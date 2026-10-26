import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRevisionResolver } from "../src/revision";

describe("revision lookup", () => {
  it("uses commit dates for clean files, mtimes for edits, and refreshes on rebuild", () => {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vector-revision-"));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
    try {
      git("init");
      git("config", "user.name", "Test");
      git("config", "user.email", "test@example.invalid");
      const file = path.join(dir, "a file.md");
      fs.writeFileSync(file, "first");
      git("add", ".");
      git("commit", "-qm", "First");
      const committed = execFileSync("git", ["log", "-1", "--format=%cI"], {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      process.chdir(dir);
      const resolve = createRevisionResolver();
      expect(resolve(file, undefined, "one")?.toISOString()).toBe(
        new Date(committed).toISOString(),
      );
      expect(resolve(file, undefined, "rebuild")?.toISOString()).toBe(
        new Date(committed).toISOString(),
      );
      fs.writeFileSync(file, "edited");
      fs.utimesSync(file, new Date("2030-01-01"), new Date("2030-01-01"));
      expect(resolve(file, undefined, "one")?.toISOString()).toBe(
        fs.statSync(file).mtime.toISOString(),
      );
      const untracked = path.join(dir, "untracked.md");
      fs.writeFileSync(untracked, "new");
      expect(resolve(untracked, undefined, "three")?.toISOString()).toBe(
        fs.statSync(untracked).mtime.toISOString(),
      );
      git("add", ".");
      git("commit", "-qm", "Next");
      const next = execFileSync("git", ["log", "-1", "--format=%cI"], {
        cwd: dir,
        encoding: "utf8",
      }).trim();
      expect(resolve(file, undefined, "four")?.toISOString()).toBe(new Date(next).toISOString());
      execFileSync("git", ["commit", "--amend", "--no-edit"], {
        cwd: dir,
        stdio: "ignore",
        env: { ...process.env, GIT_COMMITTER_DATE: "2033-01-01T00:00:00Z" },
      });
      expect(resolve(file, undefined, "amended")?.toISOString()).toBe("2033-01-01T00:00:00.000Z");
    } finally {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  it("supports sites outside Git and virtual pages", () => {
    const cwd = process.cwd();
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vector-nogit-"));
    try {
      process.chdir(dir);
      const resolve = createRevisionResolver();
      const fallback = new Date("2020-01-01");
      expect(resolve(undefined, fallback, "one")).toBe(fallback);
      expect(resolve("missing.md", fallback, "one")).toBe(fallback);
      fs.writeFileSync("page.md", "test");
      expect(resolve("page.md", undefined, "one")?.toISOString()).toBe(
        fs.statSync("page.md").mtime.toISOString(),
      );
    } finally {
      process.chdir(cwd);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
