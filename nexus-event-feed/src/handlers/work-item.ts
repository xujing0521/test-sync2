import type { SystemEventHandler } from "@pc-nexus/event";
import { ingest, type PlatformEvent } from "../feed.js";
import { saveActivity } from "../records.js";

export const onWorkItem: SystemEventHandler = async (context, event) => {
    const workItem = readWorkItem(event.payload.data);
    const property = readUpdatedProperty(event.payload.changelog);
    const eventName = event.event_type ?? "";
    const action = eventName.endsWith(":created") ? "created" : "updated";
    const input: PlatformEvent = {
        source: "system",
        eventName,
        action,
        workItemId: workItem.id,
        ...(workItem.identifier ? { identifier: workItem.identifier } : {}),
        ...(action === "updated" && property ? { property } : {}),
        ...(workItem.title ? { title: workItem.title } : {}),
    };
    await saveActivity(context.team.id, ingest(input, crypto.randomUUID(), Date.now()));
};

function readWorkItem(data: unknown): { id: string; title?: string; identifier?: string } {
    if (!data || typeof data !== "object") {
        return { id: "" };
    }
    const record = data as Record<string, unknown>;
    const id = readText(record["id"]);
    const title = readText(record["title"]);
    const identifier = readText(record["whole_identifier"]) || readText(record["identifier"]);
    return {
        id,
        ...(title ? { title } : {}),
        ...(identifier ? { identifier } : {}),
    };
}

function readUpdatedProperty(changelog: { property?: { id: string; name?: string } } | undefined): string | undefined {
    const name = readText(changelog?.property?.name);
    if (name) {
        return name;
    }
    const id = readText(changelog?.property?.id);
    return id || undefined;
}

function readText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}
