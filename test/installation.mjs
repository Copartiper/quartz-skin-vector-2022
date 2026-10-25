/** End-to-end installation against a local, unmodified Quartz 5 checkout. */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const run = promisify(execFile);
const host = process.env.QUARTZ_HOST;
if (!host) throw new Error("Set QUARTZ_HOST to a Quartz 5 checkout with installed dependencies.");
const repo = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vector-install-"));
const site = path.join(dir, "site");
const plugin = path.join(dir, "vector-skin");
await fs.mkdir(site);
await fs.mkdir(plugin);
// Snapshot the source: the host's installer can build/prune without touching this repo.
for (const name of [
  "src",
  "types",
  "test",
  "package.json",
  "package-lock.json",
  "tsup.config.ts",
  "tsconfig.json",
  "tsconfig.build.json",
  "vitest.config.ts",
  ".gitignore",
]) {
  await fs.cp(path.join(repo, name), path.join(plugin, name), { recursive: true });
}
await fs.cp(path.join(host, "quartz"), path.join(site, "quartz"), { recursive: true });
for (const name of ["package.json", "tsconfig.json"])
  await fs.copyFile(path.join(host, name), path.join(site, name));
await fs.symlink(path.join(host, "node_modules"), path.join(site, "node_modules"), "dir");
const config = path.join(site, "quartz.config.yaml");
await fs.copyFile(path.join(site, "quartz/cli/templates/default.yaml"), config);
const entry =
  'import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"\nconst config = await loadQuartzConfig()\nexport const layout = await loadQuartzLayout()\nexport default config\n';
await fs.writeFile(path.join(site, "quartz.ts"), entry);
await fs.mkdir(path.join(site, "content/notes"), { recursive: true });
await fs.writeFile(
  path.join(site, "content/index.md"),
  "---\ntitle: Test Garden\ntags: [guide]\nnavboxes: [0]\n---\n## Welcome\n\nHello [nested page](notes/example).\n\n## Reading\n\nSome words.\n\n## More\n\nMore words.\n",
);
await fs.writeFile(
  path.join(site, "content/notes/example.md"),
  "---\ntitle: Nested example\ntags: [guide/test]\nnavboxes: [0]\n---\n## Introduction\n\nNested article with [home](../index).\n\n## Details\n\nOther words.\n\n## More\n\nMore words.\n",
);
const cli = (...args) =>
  run(process.execPath, ["quartz/bootstrap-cli.mjs", ...args], {
    cwd: site,
    timeout: 180000,
    maxBuffer: 4e6,
  });
console.log("Installing through Quartz's native plugin command…");
await cli("plugin", "add", plugin);
assert.equal(await fs.readFile(path.join(site, "quartz.ts"), "utf8"), entry);
// The host already has YAML as a runtime dependency; tests need no extra dependency.
const { default: YAML } = await import(path.join(host, "node_modules/yaml/dist/index.js"));
const data = YAML.parse(await fs.readFile(config, "utf8"));
const installed = data.plugins.find((p) => p.source === plugin);
assert.ok(installed?.enabled);
assert.equal(installed.layout.position, "beforeBody");
const originalPlugins = data.plugins.filter((p) => p !== installed).map((p) => JSON.stringify(p));
const save = () => fs.writeFile(config, YAML.stringify(data));
await cli("build");
assert.ok(
  (await fs.readFile(path.join(site, "public/index.html"), "utf8")).includes("data-qv-auto-layout"),
);
installed.options = {
  locale: "en-US",
  footerMarkdown: "A **custom** footer",
  navigationTemplates: [
    {
      title: "Shared navigation",
      color: { light: "#c5d8ef", dark: "#293e57" },
      rows: [{ label: "Pages", content: "[Home](index) · [Example](notes/example)" }],
    },
  ],
};
await save();
await cli("build");
const output = path.join(site, "public");
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = path.resolve(output, "." + pathname);
    if (!file.startsWith(output + path.sep) && file !== output) throw new Error("Bad path");
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
    } catch {
      file += ".html";
    }
    const ext = path.extname(file);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[ext] ?? "application/octet-stream",
    );
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "chromium", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".qv-auto-active");
    assert.equal(await page.locator(".qv-header").count(), 1);
    assert.equal(await page.locator("[data-qv-native-slot=explorer] .explorer").count(), 1);
    assert.equal(await page.locator("[data-qv-native-slot=graph] .graph").count(), 1);
    assert.equal(
      await page
        .locator("footer")
        .textContent()
        .then((text) => text.includes("A custom footer")),
      true,
    );
    assert.equal(await page.locator(".qv-categories").count(), 1);
    assert.equal(
      await page
        .locator(".readermode:visible, .content-meta:visible, .breadcrumb-container:visible")
        .count(),
      0,
    );
    assert.equal(await page.locator(".qv-navbox [aria-current=page]").textContent(), "Home");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.locator(".qv-search-form input").fill("Nested");
    await page.locator(".qv-suggestion").first().waitFor();
    await page.locator(".qv-suggestion").first().click();
    await page.waitForURL("**/notes/example");
    await page.waitForSelector(".qv-auto-active");
    assert.equal(await page.locator(".qv-header").count(), 1);
    assert.equal(await page.locator(".qv-categories").count(), 1);
    assert.equal(await page.locator(".qv-navbox [aria-current=page]").textContent(), "Example");
    await page.screenshot({ path: path.join(dir, `installed-${width}.png`), fullPage: true });
  }
  // A fetched preview contains server HTML, before the automatic DOM arrangement.
  await page.locator('article a.internal:not([data-no-popover="true"])').first().hover();
  const preview = page.locator(".popover [data-qv-auto-layout]").first();
  await preview.waitFor({ state: "attached" });
  assert.equal(await preview.evaluate((el) => getComputedStyle(el).display), "none");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.close();
}
assert.deepEqual(
  data.plugins.filter((p) => p !== installed).map((p) => JSON.stringify(p)),
  originalPlugins,
);
installed.enabled = false;
await save();
await cli("build");
assert.ok(
  !(await fs.readFile(path.join(output, "index.html"), "utf8")).includes("data-qv-auto-layout"),
);
assert.equal(await fs.readFile(path.join(site, "quartz.ts"), "utf8"), entry);
console.log(
  `Installation, configuration, SPA, responsive and disable checks passed. Files: ${dir}`,
);
