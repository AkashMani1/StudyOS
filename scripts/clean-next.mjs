import { rmSync } from "node:fs";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
} catch (error) {
  console.error("Failed to clean .next", error);
  process.exit(1);
}
