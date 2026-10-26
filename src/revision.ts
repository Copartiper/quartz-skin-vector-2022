import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/** One worktree snapshot per Quartz build, with lazy per-file commit lookups. */
export function createRevisionResolver() {
  let previousBuild: unknown = Symbol("initial");
  let repository: string | undefined;
  let head: string | undefined;
  const dirty = new Set<string>();
  const dates = new Map<string, { mtime: number; date: Date; head?: string; dirty: boolean }>();
  const git = (args: string[], cwd?: string) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return function resolveRevision(
    filePath: string | undefined,
    fallback: Date | undefined,
    buildId?: string,
  ): Date | undefined {
    if (!filePath) return fallback;
    if (previousBuild !== buildId) {
      previousBuild = buildId;
      dirty.clear();
      repository = undefined;
      head = undefined;
      try {
        const info = git(["rev-parse", "--show-toplevel", "HEAD"]).trimEnd();
        const separator = info.lastIndexOf("\n");
        repository = info.slice(0, separator);
        head = info.slice(separator + 1);
        const records = git(
          ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
          repository,
        ).split("\0");
        for (let i = 0; i < records.length; i++) {
          const record = records[i]!;
          if (!record) continue;
          dirty.add(path.resolve(repository, record.slice(3)));
          if (/R|C/.test(record.slice(0, 2))) dirty.add(path.resolve(repository, records[++i]!));
        }
      } catch {
        repository = undefined;
        head = undefined;
      }
    }
    try {
      const absolute = path.resolve(filePath);
      const stat = fs.statSync(absolute);
      const cached = dates.get(absolute);
      const changed = dirty.has(absolute);
      if (cached?.mtime === stat.mtimeMs && cached.head === head && cached.dirty === changed)
        return cached.date;
      if (cached && cached.mtime !== stat.mtimeMs) {
        // Manual integrations may reuse a build ID after an edit.
        dates.delete(absolute);
        previousBuild = Symbol("file changed");
        return resolveRevision(filePath, fallback, buildId);
      }
      let date = stat.mtime;
      // Changed files use their actual edit time. Virtual/untracked files need no log process.
      if (repository && !changed) {
        try {
          const value = git(["log", "-1", "--format=%cI", "--", absolute], repository).trim();
          if (value && !Number.isNaN(Date.parse(value))) date = new Date(value);
        } catch {
          /* Files outside the repository fall back to their mtime. */
        }
      }
      dates.set(absolute, { mtime: stat.mtimeMs, date, head, dirty: changed });
      return date;
    } catch {
      return fallback;
    }
  };
}
