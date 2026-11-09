import { Resolver } from "@pc-nexus/core";

import type { SprintStatsResult } from "../model/index.js";
import { sprintStatsService } from "../services/sprint-stats.js";

const resolver = new Resolver();

resolver.define<void, SprintStatsResult>("getSprintStats", (context) =>
    sprintStatsService.getStats(context),
);

export { resolver };
