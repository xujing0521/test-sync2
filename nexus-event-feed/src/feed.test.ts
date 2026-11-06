import assert from "node:assert/strict";
import { test } from "node:test";
import { ingest, planRound, present, type Activity } from "./feed.ts";

test("install becomes a pending welcome activity with environment and version", () => {
    const activity = ingest(
        { source: "lifecycle", eventName: "pce:nexus:app:install", environmentName: "开发环境", appVersion: "1.0.0" },
        "act-install",
        1_700_000_000_000,
    );

    assert.deepEqual(activity, {
        id: "act-install",
        source: "lifecycle",
        text: "应用已安装，初始化完成",
        occurredAt: 1_700_000_000_000,
        summaryStatus: "pending",
        detail: { environmentName: "开发环境", appVersion: "1.0.0", eventName: "pce:nexus:app:install" },
    });
});

test("upgrade becomes a pending activity with the new version", () => {
    const activity = ingest(
        { source: "lifecycle", eventName: "pce:nexus:app:upgrade", environmentName: "开发环境", appVersion: "1.1.0" },
        "act-upgrade",
        1_700_000_000_050,
    );

    assert.deepEqual(activity, {
        id: "act-upgrade",
        source: "lifecycle",
        text: "应用已升级",
        occurredAt: 1_700_000_000_050,
        summaryStatus: "pending",
        detail: { environmentName: "开发环境", appVersion: "1.1.0", eventName: "pce:nexus:app:upgrade" },
    });
});

test("a created work item stays pending and keeps the event name, id, and title", () => {
    const activity = ingest(
        {
            source: "system",
            eventName: "pce:pjm:workitem:created",
            action: "created",
            workItemId: "wi-1",
            identifier: "PRJ-1",
            title: "登录失败",
        },
        "act-created",
        1_700_000_000_100,
    );

    assert.deepEqual(activity, {
        id: "act-created",
        source: "system",
        text: "工作项已创建",
        occurredAt: 1_700_000_000_100,
        summaryStatus: "pending",
        detail: { eventName: "pce:pjm:workitem:created", workItemId: "wi-1", identifier: "PRJ-1", title: "登录失败" },
    });
});

test("an updated work item without a title omits title from the detail", () => {
    const activity = ingest(
        {
            source: "system",
            eventName: "pce:pjm:workitem:updated",
            action: "updated",
            workItemId: "wi-2",
        },
        "act-updated",
        1_700_000_000_200,
    );

    assert.equal(activity.text, "工作项已更新");
    assert.equal(activity.summaryStatus, "pending");
    assert.deepEqual(activity.detail, { eventName: "pce:pjm:workitem:updated", workItemId: "wi-2" });
});

test("an updated work item records which property changed", () => {
    const activity = ingest(
        {
            source: "system",
            eventName: "pce:pjm:workitem:updated",
            action: "updated",
            workItemId: "wi-3",
            title: "登录失败",
            property: "优先级",
        },
        "act-property",
        1_700_000_000_250,
    );

    assert.equal(activity.text, "工作项已更新（优先级）");
    assert.equal(activity.detail["property"], "优先级");
});

test("a build result webhook keeps only the build number and result", () => {
    const activity = ingest(
        {
            source: "webhook",
            body: { build: "42", result: "succeeded", token: "secret" },
        },
        "act-build",
        1_700_000_000_300,
    );

    assert.deepEqual(activity, {
        id: "act-build",
        source: "webhook",
        text: "收到外部构建结果",
        occurredAt: 1_700_000_000_300,
        summaryStatus: "pending",
        detail: { build: "42", result: "succeeded" },
    });
});

test("an unrecognized webhook records that it was unrecognized and drops the body", () => {
    const activity = ingest(
        { source: "webhook", body: { build: 42, result: "ok", authorization: "secret" } },
        "act-unknown",
        1_700_000_000_400,
    );

    assert.equal(activity.text, "收到未能识别的外部请求");
    assert.equal(activity.summaryStatus, "pending");
    assert.deepEqual(activity.detail, { note: "未识别" });
    assert.equal(JSON.stringify(activity).includes("secret"), false);
});

test("a failed build result is still a build result", () => {
    const activity = ingest(
        { source: "webhook", body: '{"build":"7","result":"failed"}' },
        "act-failed-build",
        1_700_000_000_500,
    );

    assert.equal(activity.text, "收到外部构建结果");
    assert.deepEqual(activity.detail, { build: "7", result: "failed" });
});

test("a consumed summary event is summarized from the moment it is written", () => {
    const activity = ingest(
        { source: "app", eventKey: "summary-completed", scheduleId: "sched-1" },
        "act-consumed",
        1_700_000_000_600,
    );

    assert.deepEqual(activity, {
        id: "act-consumed",
        source: "app",
        text: "汇总完成事件已被消费",
        occurredAt: 1_700_000_000_600,
        summaryStatus: "summarized",
        detail: { eventKey: "summary-completed", scheduleId: "sched-1" },
    });
});

const pendingInstall: Activity = {
    id: "act-install",
    source: "lifecycle",
    text: "应用已安装，初始化完成",
    occurredAt: 1_700_000_000_000,
    summaryStatus: "pending",
    detail: { environmentName: "开发环境", appVersion: "1.0.0" },
};

test("a round with nothing pending writes nothing", () => {
    const plan = planRound([], {
        result: "success",
        scheduleId: "sched-empty",
        summaryId: "act-summary",
        executedAt: 1_700_000_100_000,
        durationMs: 12,
    });

    assert.deepEqual(plan, { kind: "skip" });
});

test("a successful round claims the pending count and writes one summarized summary line", () => {
    const before = pendingInstall.summaryStatus;
    const plan = planRound([pendingInstall], {
        result: "success",
        scheduleId: "sched-1",
        summaryId: "act-summary",
        executedAt: 1_700_000_100_000,
        durationMs: 40,
    });

    assert.equal(pendingInstall.summaryStatus, before);
    assert.deepEqual(plan, {
        kind: "success",
        claimedIds: ["act-install"],
        record: {
            id: "sched-1",
            count: 1,
            durationMs: 40,
            result: "success",
            executedAt: 1_700_000_100_000,
        },
        payload: { scheduleId: "sched-1", count: 1 },
        summary: {
            id: "act-summary",
            source: "scheduled",
            text: "本轮收到 1 条事件",
            occurredAt: 1_700_000_100_000,
            summaryStatus: "summarized",
            detail: { count: "1" },
        },
    });
});

test("a failed publish keeps the pending activities and records the attempted count", () => {
    const plan = planRound([pendingInstall], {
        result: "failure",
        scheduleId: "sched-fail",
        executedAt: 1_700_000_200_000,
        durationMs: 15,
    });

    assert.equal(pendingInstall.summaryStatus, "pending");
    assert.deepEqual(plan, {
        kind: "failure",
        claimedIds: ["act-install"],
        record: {
            id: "sched-fail",
            count: 1,
            durationMs: 15,
            result: "failure",
            executedAt: 1_700_000_200_000,
        },
    });
});

test("the feed lists newest first and leaves the last run empty until a schedule exists", () => {
    const older = pendingInstall;
    const newer: Activity = { ...pendingInstall, id: "act-newer", occurredAt: 1_700_000_000_500, source: "webhook" };
    const view = present([older, newer], []);

    assert.deepEqual(
        view.timeline.map((activity) => activity.id),
        ["act-newer", "act-install"],
    );
    assert.equal(view.total, 2);
    assert.equal(view.lastExecutedAt, null);
    assert.deepEqual(view.bySource, {
        lifecycle: 1,
        system: 0,
        scheduled: 0,
        webhook: 1,
        app: 0,
    });
    assert.deepEqual(view.schedules, []);
});

test("the last run time is the newest schedule, not the first one stored", () => {
    const view = present([], [
        { id: "sched-old", count: 1, durationMs: 10, result: "success", executedAt: 100 },
        { id: "sched-new", count: 0, durationMs: 5, result: "failure", executedAt: 300 },
        { id: "sched-mid", count: 2, durationMs: 8, result: "success", executedAt: 200 },
    ]);

    assert.equal(view.lastExecutedAt, 300);
    assert.deepEqual(
        view.schedules.map((record) => record.id),
        ["sched-new", "sched-mid", "sched-old"],
    );
});
