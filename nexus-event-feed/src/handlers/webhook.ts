import type { WebhookEventHandler } from "@pc-nexus/event";
import { ingest } from "../feed.js";
import { saveActivity } from "../records.js";

export const onWebhook: WebhookEventHandler = async (context, event) => {
    const activity = ingest(
        { source: "webhook", body: event.payload.body },
        crypto.randomUUID(),
        Date.now(),
    );
    await saveActivity(context.team.id, activity);
    return { statusCode: 200 };
};
