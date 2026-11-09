export interface SprintTypeStat {
    id: string;
    name: string;
    count: number;
    completed: number;
}

export interface SprintSummary {
    durationDays: number;
    storyPoints: number;
    total: number;
    closed: number;
    overdueRemaining: number;
}

export interface SprintStatsResult {
    summary: SprintSummary;
    types: SprintTypeStat[];
}
