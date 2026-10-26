/** Reproducible SSR benchmark; compare builds with VECTOR_BENCH_MODULE=/absolute/dist/index.js. */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import childProcess, { execFileSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { performance } from "node:perf_hooks";
import { h } from "preact";
import render from "preact-render-to-string";
const modulePath = process.env.VECTOR_BENCH_MODULE ?? path.resolve("dist/index.js");
let gitCalls = 0;
const originalExec = childProcess.execFileSync;
childProcess.execFileSync = (file, ...args) => {
  if (file === "git") gitCalls++;
  return originalExec(file, ...args);
};
syncBuiltinESMExports();
const { VectorPage } = await import(pathToFileURL(modulePath).href);
const originalCwd = process.cwd();
const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "vector-perf-"));
const count = 100;
const git = (...args) => execFileSync("git", args, { cwd: fixture, stdio: "ignore" });
try {
  git("init");
  git("config", "user.email", "benchmark@example.invalid");
  git("config", "user.name", "Benchmark");
  const allFiles = [];
  for (let i = 0; i < count; i++) {
    const filePath = path.join(fixture, `page-${i}.md`);
    await fs.writeFile(filePath, `# Page ${i}\n`);
    allFiles.push({
      filePath,
      slug: `page-${i}`,
      frontmatter: {
        title: `Page ${i}`,
        tags: ["benchmark"],
        navboxes: [0],
        infobox: {
          title: "Example",
          rows: [
            { label: "Type", content: "**Example** [reference](reference)" },
            { label: "Status", content: "Published" },
          ],
        },
      },
    });
  }
  git("add", ".");
  git("commit", "-qm", "Benchmark fixture");
  process.chdir(fixture);
  const props = allFiles.map((fileData) => ({
    fileData,
    allFiles,
    cfg: { pageTitle: "Benchmark", locale: "en-US", baseUrl: "example.invalid" },
    ctx: { buildId: "initial" },
  }));
  const options = {
    footerMarkdown: "**Example** [terms](terms)",
    navigationTemplates: [
      {
        title: "Navigation",
        rows: [{ label: "Pages", content: "[Example](page-1) · [Reference](reference)" }],
      },
    ],
  };
  const cold = [],
    warm = [],
    processes = [],
    rebuildProcesses = [];
  for (let trial = 0; trial < 5; trial++) {
    const Page = VectorPage(options);
    gitCalls = 0;
    let start = performance.now();
    for (const prop of props) render(h(Page, prop));
    cold.push(performance.now() - start);
    processes.push(gitCalls);
    start = performance.now();
    for (let pass = 0; pass < 10; pass++) for (const prop of props) render(h(Page, prop));
    warm.push(performance.now() - start);
    gitCalls = 0;
    for (const prop of props) prop.ctx.buildId = `rebuild-${trial}`;
    for (const prop of props) render(h(Page, prop));
    rebuildProcesses.push(gitCalls);
  }
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  console.log(
    JSON.stringify(
      {
        pages: count,
        trials: 5,
        gitProcessesPerColdRun: processes,
        gitProcessesPerUnchangedRebuild: rebuildProcesses,
        coldMedianMs: median(cold),
        warm1000MedianMs: median(warm),
        cold,
        warm,
      },
      null,
      2,
    ),
  );
} finally {
  childProcess.execFileSync = originalExec;
  syncBuiltinESMExports();
  process.chdir(originalCwd);
  await fs.rm(fixture, { recursive: true, force: true });
}
