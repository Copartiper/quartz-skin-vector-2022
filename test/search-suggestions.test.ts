import { describe, expect, it } from "vitest";
import { prepareSuggestions, suggestPreparedPages, suggestPages } from "../src/search-suggestions";
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

it("preserves stable top-ten ranking with Unicode and tied titles", () => {
  const pages = Array.from({ length: 200 }, (_, index) => ({
    slug: String(index),
    title: index % 7 === 0 ? "ＡＬＰＨＡ" : `Alpha ${index % 23}`,
    description: "A star",
  }));
  const normalize = (text: string) => text.normalize("NFKC").toLocaleLowerCase().trim();
  const prepared = prepareSuggestions(pages);
  for (const query of ["alpha", "ALPHA STAR", "alpha 2", "missing", " "]) {
    const value = normalize(query);
    const terms = value.split(/\s+/);
    const score = (title: string) => {
      const text = normalize(title);
      return text === value ? 0 : text.startsWith(value) ? 1 : text.includes(value) ? 2 : 3;
    };
    const expected = value
      ? pages
          .filter((page) =>
            terms.every((term) => normalize(`${page.title} ${page.description}`).includes(term)),
          )
          .sort((a, b) => score(a.title) - score(b.title) || a.title.localeCompare(b.title))
          .slice(0, 10)
      : [];
    expect(suggestPreparedPages(prepared, query)).toEqual(expected);
  }
});
