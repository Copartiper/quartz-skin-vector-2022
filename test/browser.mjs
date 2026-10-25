// Browser integration fixture uses Quartz's standard renderPage DOM and real built resources.
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { h } from "preact";
import render from "preact-render-to-string";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { VectorSkin } from "../dist/index.js";
const skin = VectorSkin({
  locale: "zh-CN",
  wordmark: "知识百科",
});
const props = {
  cfg: { pageTitle: "知识百科", locale: "zh-CN" },
  fileData: {
    slug: "index",
    toc: [
      { depth: 1, text: "概述", slug: "overview" },
      { depth: 2, text: "设计与排版", slug: "design" },
      { depth: 1, text: "延伸阅读", slug: "reading" },
      { depth: 1, text: "100%", slug: "100%" },
    ],
  },
};
const component = (value) => render(h(value, props));
const base = `.page>#quartz-body .page-header{margin:6rem 0 0}.page>#quartz-body{grid-template-areas:"grid-sidebar-left grid-header grid-sidebar-right" "grid-sidebar-left grid-center grid-sidebar-right" "grid-sidebar-left grid-footer grid-sidebar-right"}.page>#quartz-body .sidebar.left{grid-area:grid-sidebar-left}.page>#quartz-body .sidebar.right{grid-area:grid-sidebar-right}.page>#quartz-body .center{min-width:100%}.page>#quartz-body footer{grid-area:grid-footer}body{margin:0}.page{max-width:1500px;margin:auto}#quartz-body{display:grid}.sidebar{display:flex;flex-direction:column}article{min-width:0}.page-header{margin:2rem 0}.article-title{margin-bottom:.5rem}button{cursor:pointer}.search-container{display:none}.search-container.open{display:block;position:fixed;inset:20%;background:var(--qv-bg);border:1px solid;padding:2rem;z-index:100}`;
const html = `<!doctype html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${base}\n${skin.header.css}</style></head><body><div class="page" id="quartz-root"><div id="quartz-body"><aside class="sidebar left"><div class="search"><button class="search-button">搜索本站</button><div class="search-container"><input aria-label="搜索" placeholder="搜索知识百科"></div></div></aside><div class="center"><div class="page-header"><header></header><div class="popover-hint">${component(skin.header)}<h1 class="article-title">知识的连接与发现</h1><p class="content-meta">2026年10月25日 · 阅读时间 3 分钟</p><nav class="qv-page-tools"><details class="qv-dock qv-toc-menu" data-qv-dock="toc"><summary aria-label="目录">☰</summary>${component(skin.toc)}</details><details class="qv-dock" data-qv-dock="explorer"><summary>探索</summary><nav class="qv-dock-panel" data-qv-panel="explorer"><div class="qv-menu-heading"><strong>探索</strong><button type="button" class="qv-menu-pin qv-dock-pin" data-pin-label="移至侧栏" data-unpin-label="隐藏">移至侧栏</button></div><a href="#overview">页面树</a></nav></details></nav></div></div><article class="popover-hint"><p>欢迎来到知识百科。这是一个由 <a href="#design">Quartz</a> 驱动的知识花园，采用 Vector 2022 的阅读布局。</p><h2 id="overview">概述</h2><p>知识来自持续的探索、记录与交流。这里的每一篇笔记都可以成为理解世界的一个起点。</p><blockquote>让知识自由生长，让想法彼此连接。</blockquote><h3 id="design">设计与排版</h3><p>简洁的导航、清晰的章节层次与舒适的行宽，将注意力留给内容。通过右侧的外观设置，可以调整阅读体验。</p><table><thead><tr><th>功能</th><th>说明</th></tr></thead><tbody><tr><td>目录</td><td>快速定位文章章节</td></tr><tr><td>外观</td><td>字号、宽度与配色设置</td></tr></tbody></table><span id="100%"></span><h2 id="reading">延伸阅读</h2><p>探索更多主题，发现新的联系。</p>${"<p>阅读、思考、连接。把分散的信息整理成有意义的知识。</p>".repeat(12)}</article><div class="page-footer"></div></div><aside class="sidebar right">${component(skin.appearance)}</aside><footer>知识百科 · Powered by Quartz · Vector 2022 skin</footer></div></div><script>window.cleanups=[];window.addCleanup=fn=>window.cleanups.push(fn);document.querySelector('.search-button').onclick=()=>document.querySelector('.search-container').classList.add('open');</script><script>${skin.header.afterDOMLoaded}</script></body></html>`;
const server = createServer((req, res) => {
  if (req.url.endsWith("vector-search.json")) {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify([
        { slug: "alpha", title: "连接与发现", description: "候选描述" },
        { slug: "beta", title: "无关页面", description: "另一页", content: "正文独有" },
      ]),
    );
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, channel: "chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator(".qv-menu > summary").click();
  assert.equal(await page.locator(".qv-menu nav li a").count(), 12);
  await page.locator(".qv-menu-pin:not(.qv-dock-pin)").click();
  assert.equal(await page.locator(".sidebar.left > .qv-main-menu-pinned").count(), 1);
  await page.reload();
  assert.equal(await page.locator(".sidebar.left > .qv-main-menu-pinned").count(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !!document.querySelector(".qv-menu nav"));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent("nav"));
    document.dispatchEvent(new CustomEvent("render"));
  });
  assert.equal(await page.locator(".sidebar.left > .qv-main-menu-pinned").count(), 1);
  await page.screenshot({
    path: join(tmpdir(), "quartz-vector-preview", "menu-sidebar.png"),
    fullPage: true,
  });
  await page.locator(".qv-menu-pin:not(.qv-dock-pin)").click();
  assert.equal(await page.locator(".qv-menu[open] nav").count(), 0);
  assert.equal(await page.locator(".qv-moved-notice").textContent(), "主菜单已移至此处");
  await page.screenshot({
    path: join(tmpdir(), "quartz-vector-preview", "menu-dropdown.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".qv-menu").getAttribute("open"), null);
  const geometry = await page.locator(".center").boundingBox();
  await page.locator('[data-qv-panel="appearance"] .qv-dock-pin').click();
  assert.equal(await page.locator(".qv-appearance-menu").isVisible(), true);
  for (const id of ["explorer", "toc"]) {
    await page.locator(`[data-qv-dock="${id}"] > summary`).click();
    await page.locator(`[data-qv-panel="${id}"] .qv-dock-pin`).click();
  }
  assert.deepEqual(
    await page
      .locator(".sidebar.left > [data-qv-panel]")
      .evaluateAll((els) => els.map((el) => el.dataset.qvPanel)),
    ["toc", "explorer"],
  );
  await page.reload();
  assert.equal(await page.locator(".sidebar.left > [data-qv-panel]").count(), 2);
  const newGeometry = await page.locator(".center").boundingBox();
  assert.equal(newGeometry.x, geometry.x);
  assert.equal(newGeometry.width, geometry.width);
  for (const id of ["toc", "explorer"])
    await page.locator(`[data-qv-panel="${id}"] .qv-dock-pin`).click();
  assert.equal(await page.locator(".qv-titlebar > .qv-toc-menu + .article-title").count(), 1);
  await page.locator(".qv-appearance-menu > summary").click();
  await page.locator('[data-qv-panel="appearance"] .qv-dock-pin').click();
  await page.locator('input[name="qv-theme"][value="dark"]').check();
  assert.equal(await page.locator("html").getAttribute("saved-theme"), "dark");
  await page.locator('input[name="qv-text"][value="large"]').check();
  await page.locator('input[name="qv-width"][value="wide"]').check();
  assert.equal(
    await page.locator("article").evaluate((el) => getComputedStyle(el).fontSize),
    "20px",
  );
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-qv-text"), "large");
  assert.equal(await page.locator("html").getAttribute("data-qv-width"), "wide");
  assert.equal(await page.locator('input[name="qv-theme"][value="dark"]').isChecked(), true);
  await page.evaluate(() => {
    for (const cleanup of window.cleanups.splice(0)) cleanup();
    document.dispatchEvent(new CustomEvent("nav"));
    document.dispatchEvent(new CustomEvent("render"));
  });
  assert.equal(await page.locator("#qv-content").count(), 1);
  await page.locator('input[name="qv-theme"][value="light"]').check();
  await page.locator('input[name="qv-width"][value="standard"]').check();
  await page.locator('input[name="qv-text"][value="standard"]').check();
  assert.equal(
    await page.locator("article").evaluate((el) => getComputedStyle(el).lineHeight),
    "26px",
  );
  assert.equal(
    await page
      .locator("article h2")
      .first()
      .evaluate((el) => getComputedStyle(el).lineHeight),
    "33px",
  );
  assert.equal(
    await page
      .locator("article th")
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(234, 236, 240)",
  );
  const suggestionsInput = page.locator(".qv-search-form input");
  await suggestionsInput.fill("正文独有");
  await page.locator(".qv-full-search").waitFor({ state: "visible" });
  assert.equal(await page.locator(".qv-suggestion").count(), 0);
  assert.equal(await page.locator(".search-container.open").count(), 0);
  await suggestionsInput.fill("连接");
  await page.locator(".qv-suggestion").waitFor({ state: "visible" });
  assert.equal(await page.locator(".qv-suggestion strong").textContent(), "连接与发现");
  assert.equal(await page.locator(".qv-suggestion span").textContent(), "候选描述");
  await suggestionsInput.press("ArrowDown");
  assert.equal(await suggestionsInput.getAttribute("aria-activedescendant"), "qv-suggestion-0");
  await suggestionsInput.press("Escape");
  assert.equal(await page.locator(".qv-search-suggestions").isVisible(), false);
  await suggestionsInput.fill("候选描述");
  await page.locator(".qv-full-search").waitFor({ state: "visible" });
  await page.locator(".qv-full-search").click();
  assert.equal(await page.locator(".search-container input").inputValue(), "候选描述");
  await page.evaluate(() => document.querySelector(".search-container").classList.remove("open"));
  await page.locator(".qv-search-form input").fill("连接");
  await page.locator(".qv-search-form > button").click();
  assert.equal(await page.locator(".search-container input").inputValue(), "连接");
  assert.equal(await page.locator(".search-container.open").count(), 1);
  await page.evaluate(() => document.querySelector(".search-container").classList.remove("open"));
  const out = join(tmpdir(), "quartz-vector-preview");
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "index.html"), html);
  await page.screenshot({ path: join(out, "desktop.png"), fullPage: true });
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `overflow at ${width}px`,
    );
    if (width < 1120) {
      await page.waitForFunction(() => !document.querySelector(".qv-docked, .qv-main-menu-pinned"));
      assert.equal(await page.locator(".qv-docked, .qv-main-menu-pinned").count(), 0);
      assert.equal(await page.locator(".sidebar.left").isVisible(), false);
      assert.equal(await page.locator(".sidebar.right").isVisible(), false);
      assert.equal(await page.locator(".qv-appearance-menu").isVisible(), true);
    }
    const header = await page.locator(".qv-header").boundingBox();
    const article = await page.locator("article").boundingBox();
    assert.ok(header.y + header.height <= article.y, `header overlaps content at ${width}px`);
    if (width >= 800) {
      const titlebar = await page.locator(".page-header").boundingBox();
      assert.ok(
        titlebar.y <= header.y + header.height + 32,
        "host header spacing overrides the skin",
      );
    }
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator(".qv-floating-toc").waitFor({ state: "visible" });
  await page.locator(".qv-floating-toc").click();
  assert.equal(await page.locator(".qv-toc-floating-open .qv-toc").isVisible(), true);
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(out, "mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('input[name="qv-theme"][value="auto"]').check();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(() => document.documentElement.getAttribute("saved-theme") === "dark");
  assert.equal(await page.locator("html").getAttribute("saved-theme"), "dark");
  await page.screenshot({ path: join(out, "dark.png"), fullPage: true });
  await page.evaluate(() => {
    for (const cleanup of window.cleanups.splice(0)) cleanup();
    document.querySelector('[data-qv-panel="toc"]').remove();
    document.dispatchEvent(new CustomEvent("nav"));
  });
  assert.equal(await page.locator('[data-qv-dock="toc"]').count(), 0);
  assert.equal(await page.locator(".qv-floating-toc").count(), 0);
  await page.evaluate(() => document.querySelector("[data-qv-skin]").remove());
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("nav")));
  assert.equal(await page.locator("html").getAttribute("data-qv-theme"), null);
  assert.deepEqual(errors, []);
  console.log(`Browser checks passed. Preview: ${out}`);
} finally {
  await browser?.close();
  server.close();
}
