import { invoke, realtime, view } from '@pc-nexus/bridge';
import type { RealtimeSubscribeOptions } from '@pc-nexus/bridge';

export const CHANNEL = 'viewers';
export const HEARTBEAT_MS = 5_000;
export const STALE_MS = 15_000;
const PRUNE_MS = 2_000;

export const REALTIME_OPTIONS: RealtimeSubscribeOptions = {
  scope: 'context',
  context: 'workitem',
};

export interface ViewerIdentity {
  id: string;
  displayName: string;
  avatarUrl: string;
}

export interface HeartbeatPayload {
  type: 'heartbeat';
  userId: string;
  displayName: string;
  avatarUrl: string;
  sessionId: string;
}

export interface LeavePayload {
  type: 'leave';
  userId: string;
  sessionId: string;
}

export type PresencePayload = HeartbeatPayload | LeavePayload;

export interface ViewerSession {
  userId: string;
  displayName: string;
  avatarUrl: string;
  sessionId: string;
  seenAt: number;
}

export interface ViewerPerson {
  userId: string;
  displayName: string;
  avatarUrl: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPresencePayload(value: unknown): value is PresencePayload {
  if (!isRecord(value)) {
    return false;
  }
  const type = value['type'];
  const userId = value['userId'];
  const sessionId = value['sessionId'];
  return (type === 'heartbeat' || type === 'leave') && typeof userId === 'string' && typeof sessionId === 'string';
}

export function toViewers(sessions: ViewerSession[], selfUserId = ''): ViewerPerson[] {
  const people = new Map<string, ViewerPerson>();
  for (const session of sessions) {
    const current = people.get(session.userId);
    people.set(session.userId, {
      userId: session.userId,
      displayName: session.displayName || current?.displayName || session.userId,
      avatarUrl: session.avatarUrl || current?.avatarUrl || '',
    });
  }
  return [...people.values()].sort((left, right) => {
    if (selfUserId) {
      if (left.userId === selfUserId) {
        return -1;
      }
      if (right.userId === selfUserId) {
        return 1;
      }
    }
    return left.displayName.localeCompare(right.displayName, 'zh');
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '无法加载查看者';
}

export function isBackgroundTarget(target: string): boolean {
  return target === 'pcm:pjm:workitem:background';
}

function requireUserId(userId: string | undefined): string {
  if (!userId) {
    throw new Error('当前页面没有登录用户');
  }
  return userId;
}

/** Directory profile for the current user; falls back to userId-only on failure. */
async function loadProfile(userId: string): Promise<{ displayName: string; avatarUrl: string }> {
  try {
    const identity = await invoke<undefined, ViewerIdentity>('getViewer');
    return {
      displayName: identity.displayName || userId,
      avatarUrl: identity.avatarUrl || '',
    };
  } catch {
    return { displayName: userId, avatarUrl: '' };
  }
}

function publishLeave(payload: LeavePayload): void {
  // Fire-and-forget: unload may tear down the iframe before the promise settles.
  void realtime.publish<LeavePayload>(CHANNEL, payload, REALTIME_OPTIONS);
}

/** Publish heartbeats for the current user while the work item detail page is open. */
export async function runPresence(options: { isActive: () => boolean; onDestroy: (stop: () => void) => void }): Promise<void> {
  let heartbeatTimer = 0;
  let leavePayload: LeavePayload | null = null;

  const stop = () => {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = 0;
    window.removeEventListener('pagehide', onPageHide);
    if (!leavePayload) {
      return;
    }
    const payload = leavePayload;
    leavePayload = null;
    publishLeave(payload);
  };

  const onPageHide = () => {
    stop();
  };

  options.onDestroy(stop);

  const context = await view.getContext();
  const userId = requireUserId(context.user?.id);
  if (!options.isActive()) {
    return;
  }

  const { displayName, avatarUrl } = await loadProfile(userId);
  if (!options.isActive()) {
    return;
  }

  const sessionId = crypto.randomUUID();
  leavePayload = { type: 'leave', userId, sessionId };
  // view.onClose is Dialog-only（非弹窗场景调用无效）; background relies on pagehide + destroy.
  window.addEventListener('pagehide', onPageHide);

  const beat = () => {
    void realtime.publish<HeartbeatPayload>(
      CHANNEL,
      {
        type: 'heartbeat',
        userId,
        displayName,
        avatarUrl,
        sessionId,
      },
      REALTIME_OPTIONS,
    );
  };
  beat();
  heartbeatTimer = window.setInterval(beat, HEARTBEAT_MS);
}

/** Subscribe to presence updates and keep a pruned session map for the context UI. */
export async function runDisplay(options: {
  isActive: () => boolean;
  onDestroy: (stop: () => void) => void;
  onSessions: (sessions: ViewerSession[]) => void;
  /** Current user id from view context — self is always viewing, seed before network. */
  userId: string;
}): Promise<void> {
  let pruneTimer = 0;
  let unsubscribe = () => {};
  const presence = new Map<string, ViewerSession>();
  const localSessionId = `local:${options.userId}`;

  const publishList = () => {
    const now = Date.now();
    for (const [sessionId, session] of presence) {
      // Keep the local seed while this context module is open; only remote sessions expire.
      if (sessionId.startsWith('local:')) {
        presence.set(sessionId, { ...session, seenAt: now });
        continue;
      }
      if (now - session.seenAt > STALE_MS) {
        presence.delete(sessionId);
      }
    }
    if (options.isActive()) {
      options.onSessions([...presence.values()]);
    }
  };

  const remember = (session: ViewerSession) => {
    presence.set(session.sessionId, session);
    publishList();
  };

  const stop = () => {
    window.clearInterval(pruneTimer);
    pruneTimer = 0;
    window.removeEventListener('pagehide', onPageHide);
    unsubscribe();
    unsubscribe = () => {};
    // Extra leave from context teardown — onClose 在 background 不可用，多一次卸载出口。
    publishLeave({ type: 'leave', userId: options.userId, sessionId: localSessionId });
  };

  const onPageHide = () => {
    stop();
  };

  options.onDestroy(stop);
  window.addEventListener('pagehide', onPageHide);

  // Self is always viewing this work item — show immediately, then enrich from directory.
  remember({
    userId: options.userId,
    displayName: options.userId,
    avatarUrl: '',
    sessionId: localSessionId,
    seenAt: Date.now(),
  });

  void loadProfile(options.userId).then((profile) => {
    if (!options.isActive()) {
      return;
    }
    const current = presence.get(localSessionId);
    remember({
      userId: options.userId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      sessionId: localSessionId,
      seenAt: current?.seenAt ?? Date.now(),
    });
  });

  const subscription = await realtime.subscribe<PresencePayload>(
    CHANNEL,
    (payload) => {
      if (!isPresencePayload(payload)) {
        return;
      }
      if (payload.type === 'leave') {
        // Drop every remote session for this user (background uuid + any extras).
        for (const [sessionId, session] of presence) {
          if (session.userId === payload.userId && !sessionId.startsWith('local:')) {
            presence.delete(sessionId);
          }
        }
        presence.delete(payload.sessionId);
        publishList();
        return;
      }
      if (typeof payload.displayName !== 'string' || !payload.displayName) {
        return;
      }
      remember({
        userId: payload.userId,
        displayName: payload.displayName,
        avatarUrl: typeof payload.avatarUrl === 'string' ? payload.avatarUrl : '',
        sessionId: payload.sessionId,
        seenAt: Date.now(),
      });
    },
    REALTIME_OPTIONS,
  );

  if (!options.isActive()) {
    subscription.unsubscribe();
    return;
  }

  unsubscribe = () => {
    subscription.unsubscribe();
  };
  pruneTimer = window.setInterval(publishList, PRUNE_MS);
}
