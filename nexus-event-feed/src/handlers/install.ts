import type { LifecycleEventHandler } from "@pc-nexus/event";
import { ingest } from "../feed.js";
import { saveActivity } from "../records.js";

export const onInstall: LifecycleEventHandler = async (context, event) => {
    const eventName = event.event_type === "pce:nexus:app:upgrade" ? "pce:nexus:app:upgrade" : "pce:nexus:app:install";
    const activity = ingest(
        {
            source: "lifecycle",
            eventName,
            environmentName: event.payload.environment.name,
            appVersion: event.payload.app.version,
        },
        crypto.randomUUID(),
        Date.now(),
    );
    await saveActivity(context.team.id, activity);
};
