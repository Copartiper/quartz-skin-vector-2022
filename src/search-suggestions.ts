export interface SearchSuggestion {
  slug: string;
  title: string;
  description: string;
}
const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();
interface PreparedSuggestion {
  page: SearchSuggestion;
  title: string;
  text: string;
}

/** Prepare once after loading the index; retain original strings for display. */
export function prepareSuggestions(pages: SearchSuggestion[]): PreparedSuggestion[] {
  return pages.map((page) => ({
    page,
    title: normalize(page.title),
    text: normalize(`${page.title} ${page.description}`),
  }));
}

export function suggestPreparedPages(
  pages: PreparedSuggestion[],
  query: string,
): SearchSuggestion[] {
  const value = normalize(query);
  if (!value) return [];
  const terms = value.split(/\s+/);
  const best: Array<{ page: SearchSuggestion; score: number }> = [];
  for (const { page, title, text } of pages) {
    if (!terms.every((term) => text.includes(term))) continue;
    const score = title === value ? 0 : title.startsWith(value) ? 1 : title.includes(value) ? 2 : 3;
    const index = best.findIndex(
      (other) =>
        score < other.score ||
        (score === other.score && page.title.localeCompare(other.page.title) < 0),
    );
    if (index < 0) {
      if (best.length < 10) best.push({ page, score });
    } else {
      best.splice(index, 0, { page, score });
      if (best.length > 10) best.pop();
    }
  }
  return best.map(({ page }) => page);
}

export function suggestPages(pages: SearchSuggestion[], query: string): SearchSuggestion[] {
  return suggestPreparedPages(prepareSuggestions(pages), query);
}
