/* eslint-disable no-restricted-syntax -- The caller registers the returned disposer in its SPA cleanup. */
/** Enhance the server-rendered TOC without changing its position during reading. */
export function setupTOC(panel: HTMLElement, article: HTMLElement | null): () => void {
  const links = [...panel.querySelectorAll<HTMLAnchorElement>("a[href^='#']")];
  const entries = links
    .map((link) => {
      let id = link.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* Keep malformed percent sequences literal. */
      }
      return { link, heading: document.getElementById(id) };
    })
    .filter((entry): entry is { link: HTMLAnchorElement; heading: HTMLElement } => !!entry.heading);
  const setExpanded = (button: HTMLButtonElement, expanded: boolean) => {
    button.setAttribute("aria-expanded", String(expanded));
    const branch = document.getElementById(button.getAttribute("aria-controls") ?? "");
    if (branch) branch.hidden = !expanded;
  };
  const expandParents = (link: HTMLElement) => {
    let branch = link.closest<HTMLUListElement>("ul.qv-toc-children");
    while (branch) {
      const button = branch.parentElement?.querySelector<HTMLButtonElement>(
        ":scope > .qv-toc-row > button",
      );
      if (button) setExpanded(button, true);
      branch = branch.parentElement?.closest<HTMLUListElement>("ul.qv-toc-children") ?? null;
    }
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest<HTMLButtonElement>(".qv-toc-toggle");
    if (button) setExpanded(button, button.getAttribute("aria-expanded") !== "true");
    const link = target?.closest<HTMLAnchorElement>("a[href^='#']");
    if (link) {
      expandParents(link);
      const own = link.parentElement?.querySelector<HTMLButtonElement>(".qv-toc-toggle");
      if (own) setExpanded(own, true);
    }
  };
  const onHash = () => {
    let hash = location.hash;
    try {
      hash = decodeURIComponent(hash);
    } catch {
      /* Literal hash is still usable. */
    }
    const entry = entries.find(({ link }) => {
      try {
        return decodeURIComponent(link.hash) === hash;
      } catch {
        return link.hash === hash;
      }
    });
    if (entry) expandParents(entry.link);
  };
  let frame = 0;
  let positions: number[] = [];
  let stale = true;
  let ancestors: Element[] = [];
  let active: HTMLAnchorElement | undefined;
  const update = () => {
    frame = 0;
    if (!article || !entries.length) return;
    const threshold = Math.min(160, innerHeight * 0.2);
    if (stale) {
      positions = entries.map(
        ({ heading }) => heading.getBoundingClientRect().top + window.scrollY,
      );
      stale = false;
    }
    const offset = window.scrollY + threshold;
    let low = 0;
    let high = positions.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (positions[mid]! <= offset) low = mid + 1;
      else high = mid;
    }
    const next = entries[Math.max(0, low - 1)]!.link;
    if (next === active) return;
    active?.removeAttribute("aria-current");
    ancestors.forEach((el) => el.classList.remove("qv-toc-ancestor"));
    ancestors = [];
    next.setAttribute("aria-current", "location");
    let branch = next.closest("ul.qv-toc-children");
    while (branch) {
      if (branch.parentElement) {
        branch.parentElement.classList.add("qv-toc-ancestor");
        ancestors.push(branch.parentElement);
      }
      branch = branch.parentElement?.closest("ul.qv-toc-children") ?? null;
    }
    active = next;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const invalidate = () => {
    stale = true;
    schedule();
  };
  const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(invalidate);
  if (article) {
    resize?.observe(article);
    // A changing title/header can move every section without resizing the article itself.
    if (article.parentElement) resize?.observe(article.parentElement);
  }
  article?.addEventListener("load", invalidate, true);
  document.fonts?.addEventListener("loadingdone", invalidate);
  panel.addEventListener("click", onClick);
  window.addEventListener("hashchange", onHash);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", invalidate);
  onHash();
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    panel.removeEventListener("click", onClick);
    window.removeEventListener("hashchange", onHash);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", invalidate);
    resize?.disconnect();
    article?.removeEventListener("load", invalidate, true);
    document.fonts?.removeEventListener("loadingdone", invalidate);
    active?.removeAttribute("aria-current");
    panel
      .querySelectorAll(".qv-toc-ancestor")
      .forEach((el) => el.classList.remove("qv-toc-ancestor"));
  };
}
