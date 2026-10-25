import { describe, expect, it, vi } from "vitest";
import { h, type ComponentType } from "preact";
import render from "preact-render-to-string";
import type { QuartzComponentProps } from "@quartz-community/types";
vi.mock("../src/components/styles/vector.scss", () => ({ default: "/* vector */" }));
vi.mock("../src/components/scripts/vector.inline.ts", () => ({ default: "/* browser */" }));
import {
  VectorHeader,
  VectorTOC,
  VectorAppearance,
  VectorSkin,
  VectorRevision,
  VectorFooter,
} from "../src/components/VectorSkin";
import { safeUrl } from "../src/vector-options";

const props = {
  cfg: { pageTitle: "Knowledge Garden", locale: "zh-CN" },
  fileData: {
    slug: "notes/nested/page",
    toc: [
      { depth: 2, text: "<Introduction>", slug: "intro" },
      { depth: 3, text: "Details", slug: "details" },
    ],
  },
} as unknown as QuartzComponentProps;
const html = (component: unknown, data = props) =>
  render(h(component as ComponentType<QuartzComponentProps>, data));

describe("Vector skin server rendering", () => {
  it("renders Markdown footer body with safe relative links and no raw HTML", () => {
    const output = html(
      VectorFooter({
        footerMarkdown:
          "**License** [Terms](terms)\n\n<script>bad</script> [bad](javascript:alert)",
      }),
    );
    expect(output).toContain("<strong>License</strong>");
    expect(output).toContain('href="../../terms"');
    expect(output).not.toContain("<script>");
    expect(output).not.toContain('href="javascript:');
  });
  it("renders configurable footer text safely and resolves nested links", () => {
    const output = html(
      VectorFooter({
        footerParagraphs: [
          [
            { text: "<script>bad</script>" },
            { text: "License", href: "https://example.org/license", bold: true },
          ],
        ],
        footerLinks: [
          { label: "Privacy", href: "privacy" },
          { label: "Unsafe", href: "javascript:alert(1)" },
        ],
      }),
    );
    expect(output).toContain("&lt;script>");
    expect(output).toContain('<strong><a href="https://example.org/license">License</a></strong>');
    expect(output).toContain('href="../../privacy"');
    expect(output).not.toContain('href="javascript:');
  });
  it("uses the site locale, branding and a nested-page root link", () => {
    const output = html(VectorHeader());
    expect(output).toContain("Knowledge Garden");
    expect(output).toContain("主菜单");
    expect(output).toContain('href="../../"');
    expect(VectorHeader().css).toBeTruthy();
    expect(VectorHeader().afterDOMLoaded).toBeTruthy();
  });
  it("escapes labels and rejects executable navigation URLs", () => {
    const output = html(
      VectorHeader({
        wordmark: "<script>bad</script>",
        navigation: [{ label: "Bad", href: "javascript:alert(1)" }],
      }),
    );
    expect(output).toContain("&lt;script>");
    expect(output).not.toContain("javascript:");
  });
  it("resolves configured logo and menu paths from nested pages", () => {
    const output = html(
      VectorHeader({
        logoUrl: "static/logo.svg",
        logoAlt: "站点",
        tagline: "副标题",
        navigation: [{ label: "Help", href: "help", section: "Contribute" }],
      }),
    );
    expect(output).toContain('src="../../static/logo.svg"');
    expect(output).toContain('href="../../help"');
    expect(output).toContain("Contribute");
    expect(output).toContain("副标题");
    expect(output).toContain('placeholder="搜索Knowledge Garden"');
  });
  it("allows an explicitly empty navigation menu", () => {
    expect(html(VectorHeader({ navigation: [] }))).not.toContain("<li>");
  });
  it("formats the modified timestamp in the configured timezone", () => {
    const data = {
      ...props,
      fileData: { ...props.fileData, dates: { modified: new Date("2025-07-10T19:55:00Z") } },
    } as unknown as QuartzComponentProps;
    expect(html(VectorRevision(), data)).toContain("2025年7月11日 (星期五) 03:55");
    expect(html(VectorRevision())).toBe("");
  });
  it("renders stable heading targets and relative indentation", () => {
    const output = html(VectorTOC());
    expect(output).toContain('href="#intro"');
    expect(output).toContain("&lt;Introduction>");
    expect(output).toContain('class="qv-depth-1"');
  });
  it("hides the table of contents on pages without headings", () => {
    expect(html(VectorTOC(), { ...props, fileData: {} })).toBe("");
  });
  it("applies explicit locale and defaults consistently across components", () => {
    const skin = VectorSkin({ locale: "en-US", defaultTheme: "dark", defaultWidth: "wide" });
    expect(html(skin.header)).toContain('data-theme="dark"');
    expect(html(skin.appearance)).toMatch(/value="dark" checked/);
    expect(html(skin.toc)).toContain("Contents");
    expect(html(VectorAppearance({ showAppearance: false }))).toBe("");
  });
  it.each(["javascript:alert(1)", "data:text/html,hi", "//evil.test", "\\evil", "https:\\evil"])(
    "sanitizes %s",
    (value) => {
      expect(safeUrl(value)).toBe("#");
    },
  );
  it.each(["https://example.org/wiki", "/notes", "../index", "notes/page", "#section"])(
    "allows %s",
    (value) => {
      expect(safeUrl(value)).toBe(value);
    },
  );
});
