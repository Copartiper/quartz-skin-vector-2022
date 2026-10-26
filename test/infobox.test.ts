import { describe, expect, it } from "vitest";
import { h, type ComponentType } from "preact";
import render from "preact-render-to-string";
import type { QuartzComponentProps } from "@quartz-community/types";
import { VectorInfobox } from "../src/components/VectorInfobox";
const html = (infobox?: unknown) =>
  render(
    h(
      VectorInfobox() as ComponentType<QuartzComponentProps>,
      {
        cfg: {},
        fileData: { slug: "notes/example", frontmatter: { infobox } },
      } as unknown as QuartzComponentProps,
    ),
  );
describe("Infobox", () => {
  it("keeps cached Markdown links correct at different page depths", () => {
    const component = VectorInfobox() as ComponentType<QuartzComponentProps>;
    const data = { title: "Example", rows: [{ label: "Link", content: "[Reference](reference)" }] };
    const renderAt = (slug: string) =>
      render(
        h(component, {
          cfg: {},
          fileData: { slug, frontmatter: { infobox: data } },
        } as unknown as QuartzComponentProps),
      );
    expect(renderAt("notes/deep/page")).toContain('href="../../reference"');
    expect(renderAt("index")).toContain('href="./reference"');
    expect(renderAt("notes/deep/page")).toContain('href="../../reference"');
  });

  it("omits absent or malformed boxes", () => {
    expect(html()).toBe("");
    expect(html({ title: "Missing rows" })).toBe("");
  });
  it("renders semantic groups, images and Markdown with site-root URLs", () => {
    const output = html({
      title: "**Example**",
      image: "static/icon.png",
      imageAlt: "Example logo",
      caption: "A logo",
      rows: [{ heading: "Overview" }, { label: "Location", content: "[Garden](garden)" }],
      color: { light: "#c5d8ef", dark: "#293e57" },
    });
    expect(output).toContain("<strong>Example</strong>");
    expect(output).toContain('src="../static/icon.png"');
    expect(output).toContain('href="../garden"');
    expect(output).toContain('scope="row"');
    expect(output).toContain("qv-infobox-heading");
    expect(output).toContain("--qv-info-dark:#293e57");
  });
  it("escapes HTML and rejects executable URLs and CSS", () => {
    const output = html({
      title: "<script>alert(1)</script>",
      image: "javascript:alert(1)",
      rows: [{ label: "Bad", content: "[bad](javascript:alert)" }, null],
      color: { light: "red;display:none" },
    });
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("javascript:");
    expect(output).not.toContain("display:none");
    expect(output).not.toContain("<img");
  });
});
