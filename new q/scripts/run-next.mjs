import { spawn } from "node:child_process";
import path from "node:path";

const [mode = "dev", ...extraArgs] = process.argv.slice(2);
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const defaultDistDir = mode === "dev" ? ".next-dev" : ".next-prod";

const child = spawn(process.execPath, [nextBin, mode, ...extraArgs], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || defaultDistDir
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
