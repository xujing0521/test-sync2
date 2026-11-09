export interface Activity {
    id: string;
    source: "lifecycle" | "system" | "scheduled" | "webhook" | "app";
    text: string;
    occurredAt: number;
    summaryStatus: "pending" | "summarized";
    detail: Record<string, string>;
}

export type PlatformEvent =
    | { source: "lifecycle"; eventName: "pce:nexus:app:install" | "pce:nexus:app:upgrade"; environmentName: string; appVersion: string }
    | {
          source: "system";
          eventName: string;
          action: "created" | "updated";
          workItemId: string;
          title?: string;
          identifier?: string;
          property?: string;
      }
    | { source: "webhook"; body: unknown }
    | { source: "app"; eventKey: string; scheduleId: string };

export function ingest(event: PlatformEvent, id: string, occurredAt: number): Activity {
    if (event.source === "lifecycle") {
        return {
            id,
            source: "lifecycle",
            text: event.eventName === "pce:nexus:app:upgrade" ? "应用已升级" : "应用已安装，初始化完成",
            occurredAt,
            summaryStatus: "pending",
            detail: { environmentName: event.environmentName, appVersion: event.appVersion, eventName: event.eventName },
        };
    }

    if (event.source === "system") {
        const detail: Record<string, string> = { eventName: event.eventName, workItemId: event.workItemId };
        if (event.identifier) {
            detail["identifier"] = event.identifier;
        }
        if (event.property) {
            detail["property"] = event.property;
        }
        if (event.title) {
            detail["title"] = event.title;
        }
        return {
            id,
            source: "system",
            text: event.action === "created" ? "工作项已创建" : event.property ? `工作项已更新（${event.property}）` : "工作项已更新",
            occurredAt,
            summaryStatus: "pending",
            detail,
        };
    }

    if (event.source === "app") {
        return {
            id,
            source: "app",
            text: "汇总完成事件已被消费",
            occurredAt,
            summaryStatus: "summarized",
            detail: { eventKey: event.eventKey, scheduleId: event.scheduleId },
        };
    }

    const build = readBuild(event.body);
    if (!build) {
        return {
            id,
            source: "webhook",
            text: "收到未能识别的外部请求",
            occurredAt,
            summaryStatus: "pending",
            detail: { note: "未识别" },
        };
    }
    return {
        id,
        source: "webhook",
        text: "收到外部构建结果",
        occurredAt,
        summaryStatus: "pending",
        detail: build,
    };
}

function readBuild(body: unknown): { build: string; result: string } | undefined {
    const value = typeof body === "string" ? parseJson(body) : body;
    if (!value || typeof value !== "object") {
        return undefined;
    }
    const record = value as Record<string, unknown>;
    const build = record["build"];
    const result = record["result"];
    if (typeof build !== "string" || build.trim() === "") {
        return undefined;
    }
    if (result !== "succeeded" && result !== "failed") {
        return undefined;
    }
    return { build, result };
}

function parseJson(text: string): unknown {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return undefined;
    }
}

export interface ScheduleRecord {
    id: string;
    count: number;
    durationMs: number;
    result: "success" | "failure";
    executedAt: number;
}

export type RoundOutcome =
    | {
          result: "success";
          scheduleId: string;
          summaryId: string;
          executedAt: number;
          durationMs: number;
      }
    | {
          result: "failure";
          scheduleId: string;
          executedAt: number;
          durationMs: number;
      };

export type RoundPlan =
    | { kind: "skip" }
    | {
          kind: "success";
          record: ScheduleRecord;
          claimedIds: string[];
          summary: Activity;
          payload: { scheduleId: string; count: number };
      }
    | { kind: "failure"; record: ScheduleRecord; claimedIds: string[] };

export function planRound(pending: Activity[], outcome: RoundOutcome): RoundPlan {
    if (pending.length === 0) {
        return { kind: "skip" };
    }
    const claimedIds = pending.map((activity) => activity.id);
    if (outcome.result === "failure") {
        return {
            kind: "failure",
            claimedIds,
            record: {
                id: outcome.scheduleId,
                count: pending.length,
                durationMs: outcome.durationMs,
                result: "failure",
                executedAt: outcome.executedAt,
            },
        };
    }
    return {
        kind: "success",
        claimedIds,
        record: {
            id: outcome.scheduleId,
            count: pending.length,
            durationMs: outcome.durationMs,
            result: "success",
            executedAt: outcome.executedAt,
        },
        payload: { scheduleId: outcome.scheduleId, count: pending.length },
        summary: {
            id: outcome.summaryId,
            source: "scheduled",
            text: `本轮收到 ${pending.length} 条事件`,
            occurredAt: outcome.executedAt,
            summaryStatus: "summarized",
            detail: { count: String(pending.length) },
        },
    };
}

const sources = ["lifecycle", "system", "scheduled", "webhook", "app"] as const;

export interface FeedView {
    total: number;
    bySource: Record<(typeof sources)[number], number>;
    lastExecutedAt: number | null;
    timeline: Activity[];
    schedules: ScheduleRecord[];
}

export function present(activities: Activity[], schedules: ScheduleRecord[]): FeedView {
    const bySource: FeedView["bySource"] = {
        lifecycle: 0,
        system: 0,
        scheduled: 0,
        webhook: 0,
        app: 0,
    };
    for (const activity of activities) {
        bySource[activity.source] += 1;
    }
    const orderedSchedules = [...schedules].sort((left, right) => right.executedAt - left.executedAt);
    const newest = orderedSchedules[0];
    return {
        total: activities.length,
        bySource,
        lastExecutedAt: newest ? newest.executedAt : null,
        timeline: [...activities].sort((left, right) => right.occurredAt - left.occurredAt),
        schedules: orderedSchedules,
    };
}
