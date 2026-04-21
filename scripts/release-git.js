const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.join(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
);

const version = pkg.version;
const remote = process.env.RELEASE_REMOTE || "origin";
const targetBranch = process.env.RELEASE_TARGET_BRANCH || "main";
const mode = (process.env.RELEASE_GIT_MODE || "tag").toLowerCase();
const tagPrefix = process.env.RELEASE_TAG_PREFIX || "v";
const branchPrefix = process.env.RELEASE_BRANCH_PREFIX || "release/";
const commitMessage =
  process.env.RELEASE_COMMIT_MESSAGE || `release: ${tagPrefix}${version}`;
const dryRun = process.env.RELEASE_GIT_DRY_RUN === "1";
const skip = process.env.SKIP_RELEASE_GIT === "1";
const allowDirty = process.env.RELEASE_ALLOW_DIRTY === "1";

if (skip) {
  process.exit(0);
}

if (!["tag", "branch"].includes(mode)) {
  throw new Error(`Unsupported RELEASE_GIT_MODE: ${mode}`);
}

const releaseTag = `${tagPrefix}${version}`;
const releaseBranch = `${branchPrefix}${version}`;

function run(command, options = {}) {
  console.log(`${dryRun ? "[dry-run] " : ""}${command}`);
  if (dryRun) {
    return "";
  }

  return execSync(command, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8",
    ...options,
  }).trim();
}

function hasChanges() {
  return run("git status --porcelain").length > 0;
}

function refExists(ref) {
  if (dryRun) {
    return false;
  }

  try {
    run(`git rev-parse --verify ${ref}`);
    return true;
  } catch {
    return false;
  }
}

function remoteRefExists(ref) {
  if (dryRun) {
    return false;
  }

  try {
    return run(`git ls-remote --exit-code --refs ${remote} ${ref}`).length > 0;
  } catch {
    return false;
  }
}

run("git rev-parse --is-inside-work-tree");

if (!allowDirty && hasChanges()) {
  run("git add -A");

  try {
    run(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
  } catch (error) {
    const output = `${error.stdout || ""}\n${error.stderr || ""}`;
    if (!output.includes("nothing to commit")) {
      throw error;
    }
  }
}

run(`git push ${remote} HEAD:${targetBranch}`);

if (mode === "tag") {
  if (refExists(releaseTag) || remoteRefExists(`refs/tags/${releaseTag}`)) {
    throw new Error(`Tag already exists: ${releaseTag}`);
  }

  run(`git tag ${releaseTag}`);
  run(`git push ${remote} ${releaseTag}`);
}

if (mode === "branch") {
  if (
    refExists(releaseBranch) ||
    remoteRefExists(`refs/heads/${releaseBranch}`)
  ) {
    throw new Error(`Branch already exists: ${releaseBranch}`);
  }

  run(`git branch ${releaseBranch}`);
  run(`git push ${remote} ${releaseBranch}`);
}
