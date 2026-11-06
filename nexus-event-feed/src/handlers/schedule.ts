import { events, type ScheduledEventHandler } from "@pc-nexus/event";
import { planRound, type RoundOutcome } from "../feed.js";
import { listPending, markSummarized, saveActivity, saveSchedule } from "../records.js";

const summaryEventKey = "summary-completed";

export const onSchedule: ScheduledEventHandler = async (context) => {
    const team = context.team.id;
    const pending = await listPending(team);
    if (pending.length === 0) {
        return;
    }

    const started = Date.now();
    const scheduleId = crypto.randomUUID();
    const summaryId = crypto.randomUUID();
    let published = false;
    try {
        const result = await events.publish(summaryEventKey, { scheduleId, count: pending.length });
        published = typeof result?.eventId === "string" && result.eventId !== "";
    } catch {
        published = false;
    }

    if (!published) {
        const executedAt = Date.now();
        const plan = planRound(pending, failure(scheduleId, executedAt, executedAt - started));
        if (plan.kind === "failure") {
            await saveSchedule(team, plan.record);
        }
        return;
    }

    await markSummarized(team, pending.map((activity) => activity.id));
    const executedAt = Date.now();
    const plan = planRound(pending, {
        result: "success",
        scheduleId,
        summaryId,
        executedAt,
        durationMs: executedAt - started,
    });
    if (plan.kind !== "success") {
        return;
    }
    await saveSchedule(team, plan.record);
    await saveActivity(team, plan.summary);
};

function failure(scheduleId: string, executedAt: number, durationMs: number): RoundOutcome {
    return { result: "failure", scheduleId, executedAt, durationMs };
}
