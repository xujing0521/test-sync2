import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { invoke, store, view } from "@pc-nexus/bridge";
import { ThyAvatarModule } from "ngx-tethys/avatar";
import { ThyButton } from "ngx-tethys/button";
import { ThyDialog } from "ngx-tethys/dialog";
import { ThyFlexibleText } from "ngx-tethys/flexible-text";
import { ThyIcon } from "ngx-tethys/icon";
import { ThyInputDirective, ThyInputSearch } from "ngx-tethys/input";
import { ThyContent, ThyHeader, ThyLayout } from "ngx-tethys/layout";
import { ThyMessageService } from "ngx-tethys/message";
import { ThyNotifyService } from "ngx-tethys/notify";
import { ThyAutofocusDirective } from "ngx-tethys/shared";
import { ThySpace, ThySpaceItemDirective } from "ngx-tethys/space";
import { ThyTable, ThyTableColumnComponent } from "ngx-tethys/table";
import { catchError, from, map, of } from "rxjs";
import { DateFormatPipe } from "./pipes/date-format.pipe";
import { FileSizePipe } from "./pipes/file-size.pipe";

interface UserInfo {
  id: string;
  name?: string;
  display_name?: string;
  avatar?: string;
}

interface AttachmentItem {
  id: string;
  project_id: string;
  name: string;
  object_key: string;
  size?: number;
  mime_type?: string;
  checksum?: string;
  uploader_id?: string;
  uploaded_at?: number;
}

interface AttachmentRow extends AttachmentItem {
  uploader?: UserInfo;
}

interface AttachmentReferences {
  members: UserInfo[];
}

interface AttachmentListResult {
  value: AttachmentItem[];
  references: AttachmentReferences;
}

interface AttachmentResult {
  value: AttachmentItem;
  references: AttachmentReferences;
}

@Component({
  selector: "app-root",
  imports: [
    FormsModule,
    ThyAvatarModule,
    ThyButton,
    ThyContent,
    ThyFlexibleText,
    ThyHeader,
    ThyIcon,
    ThyInputDirective,
    ThyInputSearch,
    ThyLayout,
    ThySpace,
    ThySpaceItemDirective,
    ThyTable,
    ThyTableColumnComponent,
    FileSizePipe,
    DateFormatPipe,
    ThyAutofocusDirective,
  ],
  templateUrl: "./app.html",
  styleUrls: ["./app.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly dialog = inject(ThyDialog);
  private readonly message = inject(ThyMessageService);
  private readonly notify = inject(ThyNotifyService);

  protected readonly attachments = signal<AttachmentItem[]>([]);
  protected readonly members = signal<Record<string, UserInfo>>({});
  protected readonly editing = signal<AttachmentItem | null>(null);
  protected readonly editingName = signal<string | null>(null);
  protected readonly projectId = signal<string | undefined>(undefined);
  protected readonly loadingDone = signal(false);
  protected readonly search = signal("");
  protected readonly isEditing = signal(false);

  protected readonly filteredAttachments = computed(() => {
    const keyword = this.search().trim().toLowerCase();
    const members = this.members();
    const list: AttachmentRow[] = [...this.attachments()]
      .sort((a, b) => (b.uploaded_at ?? 0) - (a.uploaded_at ?? 0))
      .map((attachment) => ({
        ...attachment,
        uploader: attachment.uploader_id
          ? members[attachment.uploader_id]
          : undefined,
      }));
    if (!keyword) {
      return list;
    }
    return list.filter((attachment) =>
      attachment.name.toLowerCase().includes(keyword),
    );
  });

  async ngOnInit() {
    try {
      const context = await view.getContext();
      const project = context.extension?.data?.["project"] as { id?: string };
      this.projectId.set(project?.id);
    } catch (err) {
      this.loadingDone.set(true);
      this.notify.error(this.messageOf(err, "当前项目不存在或无权限访问"));
      return;
    }

    await this.fetchAttachments();
  }

  protected onUploadClick(input: HTMLInputElement) {
    if (!this.projectId()) {
      return;
    }
    this.clearEditing();
    input.value = "";
    input.removeAttribute("accept");
    input.click();
  }

  protected onReupload(row: AttachmentItem, input: HTMLInputElement) {
    this.isEditing.set(false);
    this.editingName.set(null);
    this.editing.set(row);
    input.value = "";
    const accept = this.acceptForAttachment(row);
    if (accept) {
      input.accept = accept;
    } else {
      input.removeAttribute("accept");
    }
    input.click();
  }

  protected async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const row = this.editing();
    input.value = "";
    input.removeAttribute("accept");
    this.clearEditing();
    if (!file) {
      return;
    }
    if (row) {
      if (!this.isSameFileType(row, file)) {
        this.notify.error("请选择与当前附件相同类型的文件");
        return;
      }
      await this.reuploadAttachment(row, file);
      return;
    }
    await this.addAttachment(file);
  }

  protected onRename(row: AttachmentItem) {
    this.isEditing.set(true);
    this.editing.set(row);
    this.editingName.set(row.name);
  }

  protected async saveName(row: AttachmentItem) {
    if (!this.isEditing() || this.editing()?.id !== row.id) {
      return;
    }
    const newName = (this.editingName() ?? "").trim();
    if (!newName) {
      this.notify.error("文件名不能为空");
      return;
    }
    if (newName === row.name) {
      this.clearEditing();
      return;
    }

    if (!this.projectId()) {
      return;
    }
    this.clearEditing();
    try {
      await invoke("rename-attachment", {
        attachmentId: row.id,
        name: newName,
      });
      this.attachments.update((list) =>
        list.map((attachment) =>
          attachment.id === row.id
            ? Object.assign(attachment, { name: newName })
            : attachment,
        ),
      );
      this.notify.success("重命名成功");
    } catch (err) {
      this.notify.error(this.messageOf(err, "重命名失败"));
    }
  }

  private clearEditing() {
    this.isEditing.set(false);
    this.editing.set(null);
    this.editingName.set(null);
  }

  protected async onDownload(row: AttachmentItem) {
    try {
      const [result] = await store.download("generate-download-urls", [
        row.object_key,
      ]);
      if (!result?.success || !result.blob) {
        throw new Error(result?.error || "下载失败");
      }

      const filename = this.downloadFilename(result.name, row.name);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.notify.error(this.messageOf(err, "下载失败"));
    }
  }

  protected onDelete(row: AttachmentItem) {
    this.dialog.confirm({
      title: "删除附件",
      content: `确认删除附件「${row.name}」吗？此操作不可恢复。`,
      okText: "确认",
      okType: "danger",
      cancelText: "取消",
      footerAlign: "right",
      onOk: () =>
        from(this.deleteAttachment(row)).pipe(
          map(() => true),
          catchError(() => of(false)),
        ),
    });
  }

  private async fetchAttachments() {
    if (!this.projectId()) {
      this.loadingDone.set(true);
      this.notify.error("缺少项目上下文");
      return;
    }
    this.loadingDone.set(false);

    try {
      const result = await invoke<void, AttachmentListResult>(
        "list-attachments",
      );
      this.mergeMembers(result.references?.members);
      this.attachments.set([...(result.value ?? [])]);
    } catch (err) {
      this.notify.error(this.messageOf(err, "附件加载失败"));
    } finally {
      this.loadingDone.set(true);
    }
  }

  private async addAttachment(file: File) {
    if (!this.projectId()) {
      return;
    }
    const loading = this.message.loading("上传中...", { duration: 0 });
    try {
      const objectKey = await this.uploadFile(file);
      const result = await invoke<
        { name: string; objectKey: string },
        AttachmentResult
      >("confirm-upload", {
        name: file.name,
        objectKey,
      });
      this.mergeMembers(result.references?.members);
      this.attachments.update((list) => [result.value, ...list]);
      this.notify.success("上传成功");
    } catch (err) {
      this.notify.error(this.messageOf(err, "上传失败"));
    } finally {
      loading.close();
    }
  }

  private async reuploadAttachment(row: AttachmentItem, file: File) {
    if (!this.projectId()) {
      return;
    }
    const loading = this.message.loading("上传中...", { duration: 0 });
    try {
      const objectKey = await this.uploadFile(file);
      const result = await invoke<
        { attachmentId: string; objectKey: string },
        AttachmentResult
      >("confirm-reupload", {
        attachmentId: row.id,
        objectKey,
      });
      this.mergeMembers(result.references?.members);
      this.attachments.update((list) =>
        list.map((attachment) =>
          attachment.id === result.value.id ? result.value : attachment,
        ),
      );
      this.notify.success("重新上传成功");
    } catch (err) {
      this.notify.error(this.messageOf(err, "重新上传失败"));
    } finally {
      loading.close();
    }
  }

  private async uploadFile(file: File): Promise<string> {
    const [result] = await store.upload("generate-upload-urls", [file]);
    if (!result?.success || !result.key) {
      throw new Error(result?.error || "上传对象失败");
    }
    return result.key;
  }

  private async deleteAttachment(row: AttachmentItem) {
    if (!this.projectId()) {
      return;
    }
    try {
      await invoke("delete-attachment", {
        attachmentId: row.id,
      });
      this.attachments.update((attachments) =>
        attachments.filter((attachment) => attachment.id !== row.id),
      );
      this.notify.success("删除成功");
    } catch (err) {
      this.notify.error(this.messageOf(err, "删除失败"));
      throw err;
    }
  }

  private downloadFilename(
    resultName: string | undefined,
    fallback: string,
  ): string {
    const raw = resultName?.trim();
    if (!raw) {
      return fallback;
    }
    try {
      return decodeURIComponent(raw) || fallback;
    } catch {
      return raw;
    }
  }

  private acceptForAttachment(row: AttachmentItem): string {
    const parts: string[] = [];
    const mime = row.mime_type?.trim();
    if (mime) {
      parts.push(mime);
    }
    const ext = this.extensionOf(row.name);
    if (ext) {
      parts.push(`.${ext}`);
    }
    return parts.join(",");
  }

  private isSameFileType(row: AttachmentItem, file: File): boolean {
    const expectedExt = this.extensionOf(row.name);
    const actualExt = this.extensionOf(file.name);
    if (expectedExt && actualExt) {
      return expectedExt === actualExt;
    }
    const expectedMime = row.mime_type?.trim();
    if (expectedMime && file.type) {
      return expectedMime === file.type;
    }
    return !expectedExt && !expectedMime;
  }

  private extensionOf(filename: string): string | undefined {
    const base = filename.trim().split(/[/\\]/).pop() ?? "";
    const dot = base.lastIndexOf(".");
    if (dot <= 0 || dot === base.length - 1) {
      return undefined;
    }
    return base.slice(dot + 1).toLowerCase();
  }

  private mergeMembers(members: UserInfo[] | undefined) {
    if (!members?.length) {
      return;
    }
    this.members.update((current) => {
      const next = { ...current };
      for (const member of members) {
        if (member?.id) {
          next[member.id] = member;
        }
      }
      return next;
    });
  }

  private messageOf(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    if (typeof err === "string" && err) {
      return err;
    }
    return fallback;
  }
}
