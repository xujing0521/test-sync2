import { randomUUID } from "node:crypto";
import type { NexusAppContext } from "@pc-nexus/core";
import {
  Direction,
  nos,
  type GenerateUploadUrlPayload,
  type PresignedURLToObjectKeyMap,
  type PresignedURLToObjectMetadataMap,
} from "@pc-nexus/storage";
import type {
  AttachmentEntity,
  AttachmentListResult,
  AttachmentResult,
  ConfirmReuploadInput,
  ConfirmUploadInput,
  DeleteAttachmentInput,
  RenameAttachmentInput,
} from "../model/index.js";
import { attachmentStorage } from "../storage.js";
import { userService } from "./user.js";

type AttachmentQuery = Parameters<
  Parameters<typeof attachmentStorage.update>[0]
>[0];

export class AttachmentService {
  async list(context: NexusAppContext): Promise<AttachmentListResult> {
    const projectId = this.projectId(context);
    const rows = await attachmentStorage.find(
      (builder) => {
        builder.field("project_id").eq(projectId);
      },
      {
        sort: [{ propertyKey: "uploaded_at", order: Direction.Descending }],
      },
    );
    return this.withMembers(rows);
  }

  async generateUploadUrls(
    context: NexusAppContext,
    payload: GenerateUploadUrlPayload[],
  ): Promise<PresignedURLToObjectMetadataMap> {
    const projectId = this.projectId(context);
    const items = Array.isArray(payload) ? payload : [];
    if (items.length === 0) {
      throw new Error("upload payload is required");
    }

    const map: PresignedURLToObjectMetadataMap = {};
    await Promise.all(
      items.map(async (metadata) => {
        const { size, checksum, checksum_type } = metadata;
        if (!size || size <= 0) {
          throw new Error("size must be a positive number");
        }
        if (!checksum?.trim()) {
          throw new Error("checksum is required");
        }
        if (!checksum_type) {
          throw new Error("checksum_type is required");
        }

        const key = `attachments/${projectId}/${randomUUID()}`;
        const body = { key, size, checksum, checksum_type };
        const presignedUrl = await nos.createUploadUrl(body, {
          overwrite: false,
        });
        map[presignedUrl.url] = body;
      }),
    );
    return map;
  }

  async generateDownloadUrls(
    context: NexusAppContext,
    keys: string[],
  ): Promise<PresignedURLToObjectKeyMap> {
    const projectId = this.projectId(context);
    const prefix = `attachments/${projectId}/`;
    const list = Array.isArray(keys) ? keys : [];
    const allowed = list.filter(
      (key) => typeof key === "string" && key.startsWith(prefix),
    );

    const map: PresignedURLToObjectKeyMap = {};
    await Promise.all(
      allowed.map(async (key) => {
        const downloadUrl = await nos.createDownloadUrl(key);
        map[downloadUrl.url] = key;
      }),
    );
    return map;
  }

  async confirmUpload(
    context: NexusAppContext,
    input: ConfirmUploadInput,
  ): Promise<AttachmentResult> {
    const projectId = this.projectId(context);
    this.assertKeyInProject(input.objectKey, projectId);
    const meta = await nos.getMetadata(input.objectKey);

    const entity: AttachmentEntity = {
      id: input.objectKey.split("/").filter(Boolean).pop()!.trim(),
      project_id: projectId,
      name: input.name,
      object_key: input.objectKey,
      size: meta.size,
      checksum: meta.checksum,
      uploader_id: this.accountId(context),
      uploaded_at: this.uploadedAtOf(meta.created_at),
    };
    if (meta.mime_type) {
      entity.mime_type = meta.mime_type;
    }
    const inserted = await attachmentStorage.insert(entity);
    return this.asResult(inserted);
  }

  async confirmReupload(
    context: NexusAppContext,
    input: ConfirmReuploadInput,
  ): Promise<AttachmentResult> {
    const projectId = this.projectId(context);
    const existing = await this.findOwned(projectId, input.attachmentId);
    this.assertKeyInProject(input.objectKey, projectId);
    const meta = await nos.getMetadata(input.objectKey);
    const oldKey = existing.object_key;
    const uploaderId = this.accountId(context);
    const uploadedAt = this.uploadedAtOf(meta.created_at);

    await attachmentStorage.update(this.whereExisting(projectId, existing), {
      object_key: input.objectKey,
      size: meta.size,
      checksum: meta.checksum,
      mime_type: meta.mime_type,
      uploader_id: uploaderId,
      uploaded_at: uploadedAt,
    } as Partial<AttachmentEntity>);

    if (oldKey !== input.objectKey) {
      await nos.delete(oldKey);
    }

    const next: AttachmentEntity = {
      ...existing,
      object_key: input.objectKey,
      size: meta.size,
      checksum: meta.checksum,
      uploader_id: uploaderId,
      uploaded_at: uploadedAt,
    };
    if (meta.mime_type) {
      next.mime_type = meta.mime_type;
    } else {
      delete next.mime_type;
    }
    return this.asResult(next);
  }

  async rename(
    context: NexusAppContext,
    input: RenameAttachmentInput,
  ): Promise<AttachmentResult> {
    const projectId = this.projectId(context);
    const existing = await this.findOwned(projectId, input.attachmentId);
    await attachmentStorage.update(this.whereExisting(projectId, existing), {
      name: input.name,
    });
    return this.asResult({ ...existing, name: input.name });
  }

  async delete(
    context: NexusAppContext,
    input: DeleteAttachmentInput,
  ): Promise<{ ok: true }> {
    const projectId = this.projectId(context);
    const existing = await this.findOwned(projectId, input.attachmentId);

    await nos.delete(existing.object_key);
    await attachmentStorage.delete(this.whereExisting(projectId, existing));

    return { ok: true };
  }

  private async asResult(row: AttachmentEntity): Promise<AttachmentResult> {
    const { value, references } = await this.withMembers([row]);
    return { value: value[0]!, references };
  }

  private async withMembers(
    rows: AttachmentEntity[],
  ): Promise<AttachmentListResult> {
    const ids = [
      ...new Set(
        rows.flatMap((row) =>
          row.uploader_id?.trim() ? [row.uploader_id] : [],
        ),
      ),
    ];
    const members = await userService.getByIds(ids);
    return { value: rows, references: { members } };
  }

  private async findOwned(
    projectId: string,
    attachmentId: string,
  ): Promise<AttachmentEntity> {
    const id = attachmentId?.trim();
    if (!id) {
      throw new Error("attachmentId is required");
    }

    const rows = await attachmentStorage.find((builder) => {
      builder.and((and) => {
        and.field("project_id").eq(projectId);
        and.field("id").eq(id);
      });
    });
    const row = rows[0];
    if (!row) {
      throw new Error("Attachment not found");
    }
    return row;
  }

  private whereExisting(projectId: string, existing: AttachmentEntity) {
    return (builder: AttachmentQuery) => {
      builder.and((and) => {
        and.field("project_id").eq(projectId);
        and.field("id").eq(existing.id);
      });
    };
  }

  private assertKeyInProject(objectKey: string, projectId: string) {
    const prefix = `attachments/${projectId}/`;
    if (!objectKey.startsWith(prefix)) {
      throw new Error("objectKey does not belong to this project");
    }
  }

  private uploadedAtOf(createdAt: number | undefined): number {
    return createdAt && createdAt > 0
      ? createdAt
      : Math.floor(Date.now() / 1000);
  }

  private projectId(context: NexusAppContext): string {
    return (context.extension!.data as { project: { id: string } }).project.id;
  }

  private accountId(context: NexusAppContext): string {
    return context.user!.id;
  }
}

export const attachmentService = new AttachmentService();
