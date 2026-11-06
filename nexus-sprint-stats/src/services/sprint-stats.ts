import { NexusError, type NexusAppContext } from "@pc-nexus/core";
import { api } from "@pc-nexus/network";

import type { SprintStatsResult, SprintTypeStat } from "../model/index.js";

const MS_PER_DAY = 86_400_000;
const PAGE_SIZE = 100;

interface DateValue {
    date?: number;
    with_time?: number;
}

interface WorkItem {
    type?: { id?: string; name?: string };
    state?: { type?: string };
    due?: DateValue;
}

export class SprintStatsService {
    async getStats(context: NexusAppContext): Promise<SprintStatsResult> {
        const data = context.extension?.data as
            | { project?: { id?: string }; sprint?: { id?: string } }
            | undefined;
        const projectId = data?.project?.id?.trim();
        const sprintId = data?.sprint?.id?.trim();
        if (!projectId || !sprintId) {
            throw new NexusError(
                "ERR_APP_SPRINT_STATS_CONTEXT_INVALID",
                "sprint page extension context requires project.id and sprint.id",
            );
        }

        const userId = context.user?.id;
        const timeZone = context.team?.timezone || "UTC";
        const [sprint, workItems] = await Promise.all([
            this.getJson<{
                start?: DateValue;
                due?: DateValue;
                total_story_points?: number | null;
            }>(`/v2/pjm/sprints/${encodeURIComponent(sprintId)}`, userId),
            this.listWorkItems(projectId, sprintId, userId),
        ]);

        const stats = this.aggregate(workItems, timeZone);
        return {
            summary: {
                durationDays: this.durationDays(
                    this.readDate(sprint.start),
                    this.readDate(sprint.due),
                    timeZone,
                ),
                storyPoints:
                    typeof sprint.total_story_points === "number"
                        ? sprint.total_story_points
                        : 0,
                total: stats.total,
                closed: stats.closed,
                overdueRemaining: stats.overdueRemaining,
            },
            types: stats.types,
        };
    }

    private toMillis(ts: number): number {
        return ts < 1e12 ? ts * 1000 : ts;
    }

    private readDate(value: DateValue | undefined): number | undefined {
        if (typeof value?.date === "number") {
            return this.toMillis(value.date);
        }
        if (typeof value?.with_time === "number") {
            return this.toMillis(value.with_time);
        }
        return undefined;
    }

    private ymdInZone(ms: number, timeZone: string): string {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date(ms));
    }

    private isOverdue(
        due: DateValue | undefined,
        timeZone: string,
        nowMs: number,
    ): boolean {
        const ms = this.readDate(due);
        if (ms === undefined) {
            return false;
        }
        if (typeof due?.date === "number") {
            return this.ymdInZone(ms, timeZone) < this.ymdInZone(nowMs, timeZone);
        }
        return ms < nowMs;
    }

    private durationDays(
        startAt: number | undefined,
        endAt: number | undefined,
        timeZone: string,
    ): number {
        if (startAt === undefined || endAt === undefined || endAt < startAt) {
            return 0;
        }
        const startYmd = this.ymdInZone(startAt, timeZone);
        const endYmd = this.ymdInZone(endAt, timeZone);
        let count = 0;
        let cursor = Date.parse(`${startYmd}T12:00:00.000Z`);
        const last = Date.parse(`${endYmd}T12:00:00.000Z`);
        while (cursor <= last) {
            const day = new Date(cursor).getUTCDay();
            if (day !== 0 && day !== 6) {
                count += 1;
            }
            cursor += MS_PER_DAY;
        }
        return count;
    }

    private async getJson<T>(
        path: string,
        userId: string | undefined,
    ): Promise<T> {
        const response = await api.invoke(path, {
            as: "user",
            ...(userId ? { userId } : {}),
        });
        if (!response.ok) {
            throw new NexusError(
                "ERR_APP_PINGCODE_REST_SERVER_ERROR",
                `PingCode REST ${path.split("?")[0]} failed (${response.status})`,
            );
        }
        return (await response.json()) as T;
    }

    private async listWorkItems(
        projectId: string,
        sprintId: string,
        userId: string | undefined,
    ): Promise<WorkItem[]> {
        const items: WorkItem[] = [];
        for (let pageIndex = 0; ; pageIndex += 1) {
            const params = new URLSearchParams({
                project_id: projectId,
                sprint_id: sprintId,
                page_size: String(PAGE_SIZE),
                page_index: String(pageIndex),
            });
            const data = await this.getJson<{ values?: WorkItem[] }>(
                `/v2/pjm/workitems?${params}`,
                userId,
            );
            const page = data.values ?? [];
            items.push(...page);
            if (page.length < PAGE_SIZE) {
                break;
            }
        }
        return items;
    }

    private aggregate(workItems: WorkItem[], timeZone: string) {
        const byType = new Map<string, SprintTypeStat>();
        let total = 0;
        let closed = 0;
        let overdueRemaining = 0;
        const now = Date.now();

        for (const item of workItems) {
            const state = (item.state?.type || "").toLowerCase();
            const typeId = item.type?.id || "unknown";
            const typeName = item.type?.name || item.type?.id || "未知类型";
            const done = state === "completed" || state === "closed";

            total += 1;
            if (state === "closed") {
                closed += 1;
            }
            if (!done && this.isOverdue(item.due, timeZone, now)) {
                overdueRemaining += 1;
            }

            let row = byType.get(typeId);
            if (!row) {
                row = { id: typeId, name: typeName, count: 0, completed: 0 };
                byType.set(typeId, row);
            }
            row.count += 1;
            if (state === "completed") {
                row.completed += 1;
            }
        }

        return {
            total,
            closed,
            overdueRemaining,
            types: [...byType.values()].sort(
                (a, b) => b.count - a.count || a.name.localeCompare(b.name),
            ),
        };
    }
}

export const sprintStatsService = new SprintStatsService();
