import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  resource,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { invoke, router } from "@pc-nexus/bridge";
import { workitem } from "@pc-nexus/capabilities";
import { ThyAction } from "ngx-tethys/action";
import { ThyAlert } from "ngx-tethys/alert";
import { ThyEmpty } from "ngx-tethys/empty";
import { ThyIcon } from "ngx-tethys/icon";
import { ThySwitch } from "ngx-tethys/switch";
import { ThyTable, ThyTableColumnComponent } from "ngx-tethys/table";
import { ThyTooltipDirective } from "ngx-tethys/tooltip";
import { detailLabels, eventNameLabels, sourceLabels, type Activity, type FeedResponse } from "./feed";

@Directive({
  selector: "[overflowTip]",
  host: {
    "(mouseenter)": "sync()",
  },
})
class OverflowTip {
  private readonly tip = inject(ThyTooltipDirective);
  private readonly node = inject(ElementRef<HTMLElement>).nativeElement;

  constructor() {
    afterNextRender(() => this.sync());
  }

  sync(): void {
    const hide = this.node.scrollWidth <= this.node.clientWidth + 1;
    this.tip.setDisabled(hide);
    (this.tip as unknown as { disabled: boolean }).disabled = hide;
  }
}

@Component({
  selector: "app-root",
  imports: [
    FormsModule,
    OverflowTip,
    ThyAction,
    ThyAlert,
    ThyEmpty,
    ThyIcon,
    ThySwitch,
    ThyTable,
    ThyTableColumnComponent,
    ThyTooltipDirective,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private refreshTimer: number | undefined;

  protected readonly autoRefresh = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => window.clearInterval(this.refreshTimer));
  }

  protected readonly feedResource = resource({
    loader: () => invoke<void, FeedResponse>("loadFeed"),
  });

  protected readonly feed = computed(() => (this.feedResource.hasValue() ? this.feedResource.value() : null));

  protected readonly workItemEventDoc = "https://developer.pingcode.com/reference/resource/events/pjm-workitem";
  protected readonly lifecycleEventDoc = "https://developer.pingcode.com/guide/development/events-system-trigger";
  protected readonly scheduledEventDoc = "https://developer.pingcode.com/guide/development/events-scheduled-trigger";
  protected readonly webhookEventDoc = "https://developer.pingcode.com/guide/development/events-webhook-trigger";
  protected readonly appEventDoc = "https://developer.pingcode.com/guide/development/events-app-trigger";
  protected readonly introLines = [
    "安装、升级、工作项变更，以及提交到页面地址的构建结果，都会记入时间线。",
    "每十分钟汇总并写调度记录，可打开自动刷新。",
  ];

  protected setAutoRefresh(enabled: boolean): void {
    this.autoRefresh.set(enabled);
    window.clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
    if (!enabled) {
      return;
    }
    this.feedResource.reload();
    this.refreshTimer = window.setInterval(() => this.feedResource.reload(), 5_000);
  }

  protected async copyCurl(url: string, action: ThyAction): Promise<void> {
    const command = curlCommand(url);
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const area = document.createElement("textarea");
      area.value = command;
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) {
        action.error();
        return;
      }
    }
    action.success();
  }

  protected sourceText(activity: Activity): string {
    return sourceLabels[activity.source];
  }

  protected statusText(activity: Activity): string {
    return activity.summaryStatus === "pending" ? "待汇总" : "已汇总";
  }

  protected clock(value: number | null): string {
    if (value == null) {
      return "";
    }
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(value);
  }

  protected eventName(activity: Activity): string {
    const named = eventNameLabels[activity.detail["eventName"] ?? ""] ?? eventNameLabels[activity.detail["eventKey"] ?? ""];
    if (named) {
      return named;
    }
    if (activity.source === "scheduled") {
      return "定时触发";
    }
    if (activity.source === "webhook") {
      return "构建结果";
    }
    if (activity.source === "app") {
      return "汇总完成";
    }
    if (activity.source === "lifecycle") {
      return "应用安装";
    }
    return "";
  }

  protected detailRows(activity: Activity): { key: string; label: string; value: string }[] {
    return Object.entries(activity.detail)
      .filter(([key]) => key !== "identifier" && key !== "workItemId" && key !== "eventName")
      .map(([key, value]) => ({
        key,
        label: key === "title" ? "工作项" : (detailLabels[key] ?? key),
        value: key === "result" ? this.buildResult(value) : value,
      }));
  }

  protected eventDoc(activity: Activity): string {
    if (activity.source === "lifecycle") {
      return this.lifecycleEventDoc;
    }
    if (activity.source === "scheduled") {
      return this.scheduledEventDoc;
    }
    if (activity.source === "webhook") {
      return this.webhookEventDoc;
    }
    if (activity.source === "app") {
      return this.appEventDoc;
    }
    return this.workItemEventDoc;
  }

  protected openEventDoc(activity: Activity, event: Event): void {
    event.preventDefault();
    void router.open(this.eventDoc(activity));
  }

  protected async openWorkItem(activity: Activity): Promise<void> {
    const identifier = activity.detail["identifier"] || activity.detail["workItemId"];
    if (!identifier) {
      return;
    }
    await workitem.openDetail(identifier);
  }

  private buildResult(value: string): string {
    if (value === "succeeded") {
      return "成功";
    }
    if (value === "failed") {
      return "失败";
    }
    return value;
  }
}

function curlCommand(url: string): string {
  const quoted = `'${url.replaceAll("'", "'\\''")}'`;
  return `curl -X POST ${quoted} -H 'Content-Type: application/json' -d '{"build":"42","result":"succeeded"}'`;
}
