import type { UserInfo } from "./user.js";

export interface AttachmentEntity {
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

export interface AttachmentReferences {
  members: UserInfo[];
}

export interface AttachmentListResult {
  value: AttachmentEntity[];
  references: AttachmentReferences;
}

export interface AttachmentResult {
  value: AttachmentEntity;
  references: AttachmentReferences;
}

export interface ConfirmUploadPayload {
  name: string;
  objectKey: string;
}

export interface ConfirmReuploadPayload {
  attachmentId: string;
  objectKey: string;
}

export interface RenameAttachmentPayload {
  attachmentId: string;
  name: string;
}

export interface DeleteAttachmentPayload {
  attachmentId: string;
}

export interface ConfirmUploadInput {
  name: string;
  objectKey: string;
}

export interface ConfirmReuploadInput {
  attachmentId: string;
  objectKey: string;
}

export interface RenameAttachmentInput {
  attachmentId: string;
  name: string;
}

export interface DeleteAttachmentInput {
  attachmentId: string;
}

function requireText(value: string | undefined, field: string): string {
  const text = value?.trim();
  if (!text) {
    throw new Error(`${field} is required`);
  }
  return text;
}

export function parseConfirmUploadPayload(
  payload: ConfirmUploadPayload,
): ConfirmUploadInput {
  return {
    name: requireText(payload.name, "name"),
    objectKey: requireText(payload.objectKey, "objectKey"),
  };
}

export function parseConfirmReuploadPayload(
  payload: ConfirmReuploadPayload,
): ConfirmReuploadInput {
  return {
    attachmentId: requireText(payload.attachmentId, "attachmentId"),
    objectKey: requireText(payload.objectKey, "objectKey"),
  };
}

export function parseRenameAttachmentPayload(
  payload: RenameAttachmentPayload,
): RenameAttachmentInput {
  return {
    attachmentId: requireText(payload.attachmentId, "attachmentId"),
    name: requireText(payload.name, "name"),
  };
}

export function parseDeleteAttachmentPayload(
  payload: DeleteAttachmentPayload,
): DeleteAttachmentInput {
  return {
    attachmentId: requireText(payload.attachmentId, "attachmentId"),
  };
}
