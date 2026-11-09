import { Resolver } from "@pc-nexus/core";
import { webhook } from "@pc-nexus/event";
import { present } from "../feed.js";
import { listActivities, listSchedules } from "../records.js";

const webhookTriggerKey = "build-result";

const resolver = new Resolver();

resolver.define("loadFeed", async (context) => {
    const team = context.team.id;
    const [webhookUrl, activities, schedules] = await Promise.all([
        webhook.getUrl(webhookTriggerKey),
        listActivities(team),
        listSchedules(team),
    ]);
    return { webhookUrl, ...present(activities, schedules) };
});

export { resolver };
