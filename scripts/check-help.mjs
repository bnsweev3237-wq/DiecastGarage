// Keeps the Help page in step with releases. Runs before every build (see "build" in package.json).
// Fails if the newest release in src/lib/releases.ts is newer than HELP_UPDATED_FOR in src/lib/help.ts.
// Patch releases (0.33.1) count as their minor release (0.33), so small fixes don't need a help change.
import { readFileSync } from "node:fs";

const releases = readFileSync(new URL("../src/lib/releases.ts", import.meta.url), "utf8");
const help = readFileSync(new URL("../src/lib/help.ts", import.meta.url), "utf8");
const latest = /version:\s*"([\d.]+)"/.exec(releases)?.[1];
const helpFor = /HELP_UPDATED_FOR\s*=\s*"([\d.]+)"/.exec(help)?.[1];
const minor = (v) => v.split(".").slice(0, 2).map(Number);
const newer = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);

if (!latest || !helpFor) {
  console.error("check-help: couldn't read the release version or HELP_UPDATED_FOR.");
  process.exit(1);
}
if (newer(minor(latest), minor(helpFor))) {
  console.error(`\ncheck-help: release ${latest} is out, but the Help page was last updated for ${helpFor}.`);
  console.error("Update the matching sections in src/lib/help.ts for this release, then set HELP_UPDATED_FOR to \"" + latest.split(".").slice(0, 2).join(".") + "\".\n");
  process.exit(1);
}
console.log(`check-help: Help is up to date for ${latest}.`);
