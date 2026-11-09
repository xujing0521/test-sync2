import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { view } from '@pc-nexus/bridge';
import { THY_AVATAR_ITEM_SPACE, ThyAvatar, ThyAvatarList } from 'ngx-tethys/avatar';
import { ThyTooltipDirective } from 'ngx-tethys/tooltip';
import {
  errorMessage,
  isBackgroundTarget,
  runDisplay,
  runPresence,
  toViewers,
  type ViewerSession,
} from './presence';

const AVATAR_SIZE = 24;
const OVERFLOW_CHIP_SIZE = 24;

/** Local UI preview only — inject many fake viewers. Set false before shipping. */
const MOCK_MANY_VIEWERS = false;

const MOCK_VIEWER_NAMES = [
  '管理员',
  '小明',
  '小红',
  '张三',
  '李四',
  '王五',
  '赵六',
  '陈七',
  '周八',
  '吴九',
  '郑十',
  '钱十一',
];

function mockViewerSessions(selfUserId: string): ViewerSession[] {
  const now = Date.now();
  return [
    {
      userId: selfUserId,
      displayName: '我自己',
      avatarUrl: '',
      sessionId: `local:${selfUserId}`,
      seenAt: now,
    },
    ...MOCK_VIEWER_NAMES.map((displayName, index) => ({
      userId: `mock-user-${index + 1}`,
      displayName,
      avatarUrl: '',
      sessionId: `mock:${index + 1}`,
      seenAt: now,
    })),
  ];
}

function maxAvatarsForWidth(rowWidth: number, total: number): number {
  if (rowWidth <= 0 || total <= 0) {
    return 0;
  }

  const gap = THY_AVATAR_ITEM_SPACE;
  const unit = AVATAR_SIZE + gap;
  // All fit without the +N chip.
  if (total * AVATAR_SIZE + Math.max(0, total - 1) * gap <= rowWidth) {
    return total;
  }

  // Reserve chip + gap before the chip.
  const forAvatars = rowWidth - OVERFLOW_CHIP_SIZE - gap;
  return Math.max(1, Math.floor((forAvatars + gap) / unit));
}

@Component({
  selector: 'app-root',
  imports: [ThyAvatar, ThyAvatarList, ThyTooltipDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewersRow = viewChild<ElementRef<HTMLElement>>('viewersRow');
  private rowObserver: ResizeObserver | undefined;

  protected readonly avatarSize = AVATAR_SIZE;
  protected readonly isDisplay = signal(false);
  protected readonly error = signal('');
  private readonly selfUserId = signal('');
  private readonly sessions = signal<ViewerSession[]>([]);
  private readonly maxVisible = signal(1);
  protected readonly viewers = computed(() => toViewers(this.sessions(), this.selfUserId()));
  protected readonly visibleViewers = computed(() => this.viewers().slice(0, this.maxVisible()));
  protected readonly overflowCount = computed(() => Math.max(0, this.viewers().length - this.maxVisible()));
  protected readonly overflowTooltip = computed(() =>
    this.viewers()
      .slice(this.maxVisible())
      .map((person) => person.displayName)
      .join('、'),
  );

  constructor() {
    effect(() => {
      const row = this.viewersRow()?.nativeElement;
      const total = this.viewers().length;
      this.bindRowObserver(row, total);
    });
    this.destroyRef.onDestroy(() => this.rowObserver?.disconnect());
    void this.start();
  }

  private bindRowObserver(row: HTMLElement | undefined, total: number): void {
    this.rowObserver?.disconnect();
    this.rowObserver = undefined;
    if (!row || typeof ResizeObserver === 'undefined') {
      return;
    }

    const update = (width: number) => {
      this.maxVisible.set(maxAvatarsForWidth(width, total));
    };

    update(row.getBoundingClientRect().width);
    this.rowObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? row.getBoundingClientRect().width;
      update(width);
    });
    this.rowObserver.observe(row);
  }

  private async start(): Promise<void> {
    let active = true;
    this.destroyRef.onDestroy(() => {
      active = false;
    });

    try {
      const context = await view.getContext();
      if (!active) {
        return;
      }

      // Background: publish presence as soon as the work item detail page opens.
      if (isBackgroundTarget(context.extension.target)) {
        await runPresence({
          isActive: () => active,
          onDestroy: (stop) => {
            this.destroyRef.onDestroy(stop);
          },
        });
        return;
      }

      const userId = context.user?.id;
      if (!userId) {
        throw new Error('当前页面没有登录用户');
      }

      this.selfUserId.set(userId);
      this.isDisplay.set(true);

      // UI stress preview: many avatars + overflow chip, no realtime.
      if (MOCK_MANY_VIEWERS) {
        this.sessions.set(mockViewerSessions(userId));
        return;
      }

      // Self is always viewing — paint own avatar first, then subscribe for others.
      this.sessions.set([
        {
          userId,
          displayName: userId,
          avatarUrl: '',
          sessionId: `local:${userId}`,
          seenAt: Date.now(),
        },
      ]);

      await runDisplay({
        userId,
        isActive: () => active,
        onDestroy: (stop) => {
          this.destroyRef.onDestroy(stop);
        },
        onSessions: (sessions) => {
          this.sessions.set(sessions);
        },
      });
    } catch (startError: unknown) {
      if (active) {
        this.isDisplay.set(true);
        this.error.set(errorMessage(startError));
      }
    }
  }
}
