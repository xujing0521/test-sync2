import { ces } from "@pc-nexus/storage";
import type { TodoEntity } from "./model/index.js";

export const todoStorage = ces.entity<TodoEntity>("todos");
