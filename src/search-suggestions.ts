export interface SearchSuggestion {
  slug: string;
  title: string;
  description: string;
}
const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();
export function suggestPages(pages: SearchSuggestion[], query: string): SearchSuggestion[] {
  const value = normalize(query);
  if (!value) return [];
  const terms = value.split(/\s+/);
  return pages
    .filter((page) =>
      terms.every((term) => normalize(`${page.title} ${page.description}`).includes(term)),
    )
    .map((page) => ({
      page,
      score:
        normalize(page.title) === value
          ? 0
          : normalize(page.title).startsWith(value)
            ? 1
            : normalize(page.title).includes(value)
              ? 2
              : 3,
    }))
    .sort((a, b) => a.score - b.score || a.page.title.localeCompare(b.page.title))
    .slice(0, 10)
    .map(({ page }) => page);
}
