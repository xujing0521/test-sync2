import { ces } from "@pc-nexus/storage";
import type { AttachmentEntity } from "./model/index.js";

export const attachmentStorage = ces.entity<AttachmentEntity>("attachment");
