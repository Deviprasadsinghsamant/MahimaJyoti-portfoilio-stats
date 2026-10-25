#!/usr/bin/env node
// Runs mj-func's Cloud Functions locally in the Firebase emulator, so the
// portal's staff screens can be tried without deploying.
//
// Only Functions are emulated: the functions read and write the REAL
// Firestore and Auth, using scripts/service-account.json. A teacher created
// while testing is a real login.
//
// Pair with NEXT_PUBLIC_FUNCTIONS_EMULATOR=localhost:5001 in
// mj-web/.env.development.local so `npm run dev` calls the emulator.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const KEY = resolve(ROOT, "scripts", "service-account.json");

const env = {
    ...process.env,
    // Loading the functions code to discover them can exceed the default 10 s on Windows.
    FUNCTIONS_DISCOVERY_TIMEOUT: process.env.FUNCTIONS_DISCOVERY_TIMEOUT ?? "60",
};
if (existsSync(KEY)) {
    env.GOOGLE_APPLICATION_CREDENTIALS = KEY;
} else {
    console.warn("• scripts/service-account.json not found — the functions won't be able to reach Firestore or Auth.");
}

const child = spawn("npm --prefix mj-func run build && firebase emulators:start --only functions", {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: true,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => child.kill(signal));
}
child.on("exit", (code) => process.exit(code ?? 0));
