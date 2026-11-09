import { mkdirSync, existsSync, symlinkSync, rmSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webModules = join(root, "web", "main", "node_modules");
const rootModules = join(root, "node_modules");

const packages = ["ngx-tethys", "@tethys/icons", "@tethys/cdk"];

mkdirSync(webModules, { recursive: true });

for (const pkg of packages) {
  const target = join(rootModules, ...pkg.split("/"));
  const linkPath = join(webModules, ...pkg.split("/"));
  if (!existsSync(target)) {
    console.warn(`[link-web-modules] skip missing ${pkg}`);
    continue;
  }
  mkdirSync(dirname(linkPath), { recursive: true });
  rmSync(linkPath, { recursive: true, force: true });
  symlinkSync(relative(dirname(linkPath), target), linkPath);
}
