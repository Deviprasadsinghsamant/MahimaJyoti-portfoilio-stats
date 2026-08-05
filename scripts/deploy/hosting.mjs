#!/usr/bin/env node
// Deploys mj-web to Firebase Hosting through Firebase's Next.js adapter.
//
// Why this script exists:
//   `firebase-tools`' Next.js adapter runs `npm list next --json --depth=0`
//   from the hosting source dir. Under npm workspaces that command reports
//   the *root's* dependency tree — where `next` appears as a *nested* dep of
//   the `mj-web` workspace child, not as a top-level dep. The adapter reads
//   `dependencies.next` at the top level, finds nothing, and aborts with
//   "Could not find the next executable."
//
// The workaround: temporarily hide the root `package.json` so npm treats
// `mj-web` as a standalone package for the duration of the deploy, then
// restore it. Zero permanent config changes, no risk to other tooling.
//
// Ref: https://github.com/firebase/firebase-tools/issues (workspace + Next).

import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const PKG = resolve(ROOT, "package.json");
const HIDDEN = resolve(ROOT, "package.json.workspace-hidden");

let hidden = false;

function hidePackage() {
    if (!existsSync(PKG)) return;
    renameSync(PKG, HIDDEN);
    hidden = true;
    console.log("• Temporarily hid root package.json to bypass workspaces during hosting deploy.");
}

function restorePackage() {
    if (!hidden) return;
    if (existsSync(HIDDEN)) {
        renameSync(HIDDEN, PKG);
        console.log("• Restored root package.json.");
    }
    hidden = false;
}

// Always restore, even on Ctrl-C / crash.
process.on("SIGINT", () => { restorePackage(); process.exit(130); });
process.on("SIGTERM", () => { restorePackage(); process.exit(143); });
process.on("uncaughtException", (e) => { restorePackage(); throw e; });

try {
    hidePackage();
    execSync("firebase deploy --only hosting", { stdio: "inherit", cwd: ROOT });
} finally {
    restorePackage();
}
