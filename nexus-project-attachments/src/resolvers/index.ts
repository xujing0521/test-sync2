import { Resolver } from "@pc-nexus/core";
import { defineAttachmentFns } from "./attachment.js";

const resolver = new Resolver();

defineAttachmentFns(resolver);

export { resolver };
