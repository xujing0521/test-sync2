import { ces, type ConditionBuilder, type CustomEntityStorage } from "@pc-nexus/storage";
import type { Activity, ScheduleRecord } from "./feed.js";

interface ActivityRow {
    activity_id: string;
    team: string;
    source: string;
    text: string;
    occurred_at: number;
    summary_status: string;
    detail: Record<string, string>;
}

interface ScheduleRow {
    schedule_id: string;
    team: string;
    count: number;
    duration_ms: number;
    result: string;
    executed_at: number;
}

const pageSize = 100;

export const activities = ces.entity<ActivityRow>("activities");
export const schedules = ces.entity<ScheduleRow>("schedules");

export async function listActivities(team: string): Promise<Activity[]> {
    const rows = await findAll(activities, (builder) => {
        builder.field("team").eq(team);
    });
    return rows.flatMap((row) => {
        const activity = toActivity(row);
        return activity ? [activity] : [];
    });
}

export async function listPending(team: string): Promise<Activity[]> {
    const rows = await findAll(activities, (builder) => {
        builder.field("team").eq(team).field("summary_status").eq("pending");
    });
    return rows.flatMap((row) => {
        const activity = toActivity(row);
        return activity?.summaryStatus === "pending" ? [activity] : [];
    });
}

export async function listSchedules(team: string): Promise<ScheduleRecord[]> {
    const rows = await findAll(schedules, (builder) => {
        builder.field("team").eq(team);
    });
    return rows.flatMap((row) => {
        const record = toSchedule(row);
        return record ? [record] : [];
    });
}

export async function saveActivity(team: string, activity: Activity): Promise<void> {
    await activities.insert(toActivityRow(team, activity));
}

export async function saveSchedule(team: string, record: ScheduleRecord): Promise<void> {
    await schedules.insert({
        schedule_id: record.id,
        team,
        count: record.count,
        duration_ms: record.durationMs,
        result: record.result,
        executed_at: record.executedAt,
    });
}

export async function markSummarized(team: string, ids: string[]): Promise<void> {
    for (const id of ids) {
        await activities.update(
            (builder) => {
                builder.field("team").eq(team).field("activity_id").eq(id);
            },
            { summary_status: "summarized" },
        );
    }
}

async function findAll<T>(
    store: CustomEntityStorage<T>,
    condition?: (builder: ConditionBuilder<T>) => void,
): Promise<T[]> {
    const rows: T[] = [];
    let skip = 0;
    for (;;) {
        const page = await store.find(condition, { limit: pageSize, skip });
        rows.push(...page);
        if (page.length < pageSize) {
            return rows;
        }
        skip += page.length;
    }
}

function toActivityRow(team: string, activity: Activity): ActivityRow {
    return {
        activity_id: activity.id,
        team,
        source: activity.source,
        text: activity.text,
        occurred_at: activity.occurredAt,
        summary_status: activity.summaryStatus,
        detail: activity.detail,
    };
}

function toActivity(row: ActivityRow): Activity | undefined {
    if (!isSource(row.source) || !isSummaryStatus(row.summary_status)) {
        return undefined;
    }
    return {
        id: row.activity_id,
        source: row.source,
        text: row.text,
        occurredAt: row.occurred_at,
        summaryStatus: row.summary_status,
        detail: stringFields(row.detail),
    };
}

function toSchedule(row: ScheduleRow): ScheduleRecord | undefined {
    if (row.result !== "success" && row.result !== "failure") {
        return undefined;
    }
    return {
        id: row.schedule_id,
        count: row.count,
        durationMs: row.duration_ms,
        result: row.result,
        executedAt: row.executed_at,
    };
}

function stringFields(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object") {
        return {};
    }
    const detail: Record<string, string> = {};
    for (const [key, field] of Object.entries(value)) {
        if (typeof field === "string") {
            detail[key] = field;
        }
    }
    return detail;
}

function isSource(value: string): value is Activity["source"] {
    return value === "lifecycle" || value === "system" || value === "scheduled" || value === "webhook" || value === "app";
}

function isSummaryStatus(value: string): value is Activity["summaryStatus"] {
    return value === "pending" || value === "summarized";
}
