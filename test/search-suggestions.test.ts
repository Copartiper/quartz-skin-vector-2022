import { describe, expect, it } from "vitest";
import { suggestPages } from "../src/search-suggestions";
describe("title and description suggestions", () => {
  const pages = [
    { slug: "a", title: "Alpha", description: "First page" },
    { slug: "b", title: "Beta", description: "About alpha" },
    { slug: "c", title: "Alpha Centauri", description: "A star" },
  ];
  it("ranks exact titles before prefixes and description matches", () => {
    expect(suggestPages(pages, "ALPHA").map((page) => page.slug)).toEqual(["a", "c", "b"]);
  });
  it("matches all terms across title and description and ignores empty queries", () => {
    expect(suggestPages(pages, "alpha star").map((page) => page.slug)).toEqual(["c"]);
    expect(suggestPages(pages, "   ")).toEqual([]);
    expect(suggestPages(pages, "正文独有内容")).toEqual([]);
  });
});
