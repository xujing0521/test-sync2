export type Source = "lifecycle" | "system" | "scheduled" | "webhook" | "app";

export interface Activity {
  id: string;
  source: Source;
  text: string;
  occurredAt: number;
  summaryStatus: "pending" | "summarized";
  detail: Record<string, string>;
}

export interface FeedResponse {
  webhookUrl: string;
  timeline: Activity[];
}

export const sourceLabels: Record<Source, string> = {
  lifecycle: "生命周期",
  system: "系统",
  scheduled: "定时",
  webhook: "外部",
  app: "自定义",
};

export const eventNameLabels: Record<string, string> = {
  "pce:nexus:app:install": "应用安装",
  "pce:nexus:app:upgrade": "应用升级",
  "pce:pjm:workitem:created": "工作项创建",
  "pce:pjm:workitem:updated": "工作项更新",
  "summary-completed": "汇总完成",
};

export const detailLabels: Record<string, string> = {
  environmentName: "环境名",
  appVersion: "应用版本",
  eventName: "事件名",
  workItemId: "工作项",
  title: "标题",
  property: "更新属性",
  build: "构建号",
  result: "结果",
  note: "说明",
  count: "本轮条数",
  eventKey: "事件 key",
  scheduleId: "调度记录",
};
