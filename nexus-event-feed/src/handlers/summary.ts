import type { AppEventHandler } from "@pc-nexus/event";
import { ingest } from "../feed.js";
import { saveActivity } from "../records.js";

export const onSummaryCompleted: AppEventHandler = async (context, event) => {
    const activity = ingest(
        {
            source: "app",
            eventKey: event.key,
            scheduleId: readScheduleId(event.payload),
        },
        crypto.randomUUID(),
        Date.now(),
    );
    await saveActivity(context.team.id, activity);
};

function readScheduleId(payload: unknown): string {
    if (!payload || typeof payload !== "object") {
        return "";
    }
    const scheduleId = (payload as Record<string, unknown>)["scheduleId"];
    return typeof scheduleId === "string" ? scheduleId : "";
}
