import { Resolver } from "@pc-nexus/core";
import { defineTodoFns } from "./todo.js";

const resolver = new Resolver();

defineTodoFns(resolver);

export { resolver };
