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
  VectorNavigation,
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
  it("renders nested, accessible TOC branches and preserves literal heading text", () => {
    const output = html(VectorTOC());
    expect(output).toContain('class="qv-toc-children"');
    expect(output).toContain('aria-expanded="true"');
    expect(output).toContain('aria-controls="qv-toc-branch-0"');
    expect(output).toContain("&lt;Introduction>");
    expect(output).toContain('href="#details"');
  });
  it("collapses subsections only when the TOC exceeds 28 headings", () => {
    const data = (count: number) =>
      ({
        ...props,
        fileData: {
          ...props.fileData,
          toc: Array.from({ length: count }, (_, i) => ({
            depth: i === 0 ? 1 : 2,
            slug: `section-${i}`,
            text: `Section ${i}`,
          })),
        },
      }) as QuartzComponentProps;
    expect(html(VectorTOC(), data(28))).toContain('aria-expanded="true"');
    const long = html(VectorTOC(), data(29));
    expect(long).toContain('aria-expanded="false"');
    expect(long).toContain('id="qv-toc-branch-0" hidden');
  });

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
    expect(output).toContain('class="qv-toc-item qv-depth-1"');
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

describe("navigation templates", () => {
  it("selects shared templates and renders inline templates with safe root links", () => {
    const output = html(
      VectorNavigation({
        navigationTemplates: [
          { title: "Shared", rows: [{ label: "Group", content: "[Note](notes/one)" }] },
        ],
      }),
      {
        ...props,
        fileData: {
          ...props.fileData,
          frontmatter: {
            title: "Test",
            tags: [],
            navboxes: [
              0,
              {
                title: "Inline",
                collapsed: true,
                rows: [{ label: "<unsafe>", content: "[bad](javascript:alert)" }],
              },
            ],
          },
        },
      } as unknown as QuartzComponentProps,
    );
    expect(output).toContain('class="qv-navbox" open');
    expect(output).toContain('href="../../notes/one"');
    expect(output).toContain("Inline");
    expect(output).not.toContain("<unsafe>");
    expect(output).not.toContain('href="javascript:');
  });
  it("omits templates on pages without navboxes or invalid references", () => {
    expect(html(VectorNavigation())).toBe("");
    expect(
      html(VectorNavigation(), {
        ...props,
        fileData: { ...props.fileData, frontmatter: { navboxes: [999, null, {}] } },
      } as unknown as QuartzComponentProps),
    ).toBe("");
  });
});

it("renders self-links as text and accepts only safe per-template colors", () => {
  const output = html(
    VectorNavigation({
      navigationTemplates: [
        {
          title: "[Current](notes/nested/page.html)",
          color: { light: "#ffccaa", dark: "red;display:none" },
          rows: [
            { label: "Group", content: "[Same](notes/nested/page#index) · [Other](notes/other)" },
          ],
        },
      ],
    }),
    {
      ...props,
      fileData: { ...props.fileData, frontmatter: { navboxes: [0] } },
    } as unknown as QuartzComponentProps,
  );
  expect(output.match(/aria-current="page"/g)).toHaveLength(2);
  expect(output).toContain("--qv-box-light:#ffccaa");
  expect(output).not.toContain("display:none");
  expect(output).toContain('href="../../notes/other"');
});

it("keeps cached Markdown links specific to each page", () => {
  const footer = VectorFooter({ footerMarkdown: "[Terms](terms)" });
  const navigation = VectorNavigation({
    navigationTemplates: [
      {
        title: "[Current](notes/nested/page)",
        rows: [{ label: "Group", content: "[Other](notes/other)" }],
      },
    ],
  });
  const data = (slug: string) =>
    ({
      ...props,
      fileData: {
        ...props.fileData,
        slug,
        frontmatter: { navboxes: [0] },
      },
    }) as unknown as QuartzComponentProps;
  expect(html(footer, data("notes/nested/page"))).toContain('href="../../terms"');
  expect(html(footer, data("index"))).toContain('href="./terms"');
  expect(html(navigation, data("notes/nested/page"))).toContain('aria-current="page"');
  const other = html(navigation, data("index"));
  expect(other).not.toContain('aria-current="page"');
  expect(other).toContain('href="./notes/nested/page"');
  expect(html(navigation, data("notes/nested/page"))).toContain('href="../../notes/other"');
});

describe("automatic plugin component", () => {
  it("renders a complete generic shell with safe defaults and preserves host footer", async () => {
    const { VectorPage } = await import("../src/components/VectorPage");
    const output = html(VectorPage(), {
      ...props,
      cfg: { pageTitle: "A different garden", locale: "en-US" },
      fileData: { ...props.fileData, frontmatter: { title: "An article", tags: ["guide/test"] } },
    } as unknown as QuartzComponentProps);
    expect(output).toContain("data-qv-auto-layout");
    expect(output).toContain('placeholder="Search A different garden"');
    expect(output).toContain('data-qv-replace-footer="false"');
    expect(output).toContain('href="../../tags/guide/test"');
    expect(output).toContain("Explore");
    expect(output).not.toContain("wiki.clytam.net");
  });
  it("opts into footer replacement only when footer content is configured", async () => {
    const { VectorPage } = await import("../src/components/VectorPage");
    const output = html(VectorPage({ footerMarkdown: "**Custom** footer" }));
    expect(output).toContain('data-qv-replace-footer="true"');
    expect(output).toContain("<strong>Custom</strong> footer");
  });
  it("formats revision text for an English site", () => {
    const output = html(VectorRevision({ locale: "en-US" }), {
      ...props,
      fileData: { ...props.fileData, dates: { modified: new Date("2026-07-29T01:42:00Z") } },
    } as unknown as QuartzComponentProps);
    expect(output).toContain("This page was last edited on ");
    expect(output).not.toContain("本页面");
  });
});
