import type { Resolver } from "@pc-nexus/core";
import type {
  GenerateUploadUrlPayload,
  PresignedURLToObjectKeyMap,
  PresignedURLToObjectMetadataMap,
} from "@pc-nexus/storage";
import {
  type AttachmentListResult,
  type AttachmentResult,
  type ConfirmReuploadPayload,
  type ConfirmUploadPayload,
  type DeleteAttachmentPayload,
  type RenameAttachmentPayload,
  parseConfirmReuploadPayload,
  parseConfirmUploadPayload,
  parseDeleteAttachmentPayload,
  parseRenameAttachmentPayload,
} from "../model/index.js";
import { attachmentService } from "../services/attachment.js";

export function defineAttachmentFns(resolver: Resolver) {
  resolver.define<void, AttachmentListResult>(
    "list-attachments",
    async (context) => {
      return attachmentService.list(context);
    },
  );

  resolver.define<
    GenerateUploadUrlPayload[],
    PresignedURLToObjectMetadataMap
  >("generate-upload-urls", async (context, payload) => {
    return attachmentService.generateUploadUrls(context, payload);
  });

  resolver.define<string[], PresignedURLToObjectKeyMap>(
    "generate-download-urls",
    async (context, payload) => {
      return attachmentService.generateDownloadUrls(context, payload);
    },
  );

  resolver.define<ConfirmUploadPayload, AttachmentResult>(
    "confirm-upload",
    async (context, payload) => {
      return attachmentService.confirmUpload(
        context,
        parseConfirmUploadPayload(payload),
      );
    },
  );

  resolver.define<ConfirmReuploadPayload, AttachmentResult>(
    "confirm-reupload",
    async (context, payload) => {
      return attachmentService.confirmReupload(
        context,
        parseConfirmReuploadPayload(payload),
      );
    },
  );

  resolver.define<RenameAttachmentPayload, AttachmentResult>(
    "rename-attachment",
    async (context, payload) => {
      return attachmentService.rename(
        context,
        parseRenameAttachmentPayload(payload),
      );
    },
  );

  resolver.define<DeleteAttachmentPayload, { ok: true }>(
    "delete-attachment",
    async (context, payload) => {
      return attachmentService.delete(
        context,
        parseDeleteAttachmentPayload(payload),
      );
    },
  );
}
