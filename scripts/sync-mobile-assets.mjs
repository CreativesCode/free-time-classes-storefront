import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "assets");
const source = join(root, "public", "images", "Isotipo.svg");
const dest = join(assetsDir, "logo.svg");

mkdirSync(assetsDir, { recursive: true });
copyFileSync(source, dest);

execSync(
  [
    "npx",
    "@capacitor/assets",
    "generate",
    "--android",
    "--ios",
    "--iconBackgroundColor",
    "#485569",
    "--iconBackgroundColorDark",
    "#27272a",
    "--splashBackgroundColor",
    "#fef3ff",
    "--splashBackgroundColorDark",
    "#18181b",
  ].join(" "),
  { stdio: "inherit", cwd: root, shell: true }
);
