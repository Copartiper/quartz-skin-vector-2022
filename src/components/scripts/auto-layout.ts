/** Arrange the plugin's single component without changing host configuration files. */
export function prepareAutoLayout() {
  const shell = document.querySelector<HTMLElement>("#quartz-body [data-qv-auto-layout]");
  const body = document.querySelector<HTMLElement>("#quartz-body");
  if (!shell || !body) return;
  body.classList.add("qv-auto-active");
  const left = body.querySelector<HTMLElement>(":scope > .sidebar.left");
  const right = body.querySelector<HTMLElement>(":scope > .sidebar.right");
  const center = body.querySelector<HTMLElement>(":scope > .center");
  if (!left || !right || !center) return;
  const mainOnly = (selector: string) =>
    [...body.querySelectorAll<HTMLElement>(selector)].filter(
      (el) => !el.closest(".popover, .search-container") && !shell.contains(el),
    );
  for (const name of ["explorer", "graph"]) {
    const slot = shell.querySelector<HTMLElement>(`[data-qv-native-slot="${name}"]`);
    const native = slot?.querySelector(`.${name}`) ?? mainOnly(`.${name}`)[0];
    const tool = shell.querySelector<HTMLElement>(`[data-qv-native-tool="${name}"]`);
    if (native && slot && !slot.contains(native)) slot.append(native);
    if (tool) tool.hidden = !native;
  }
  // Search keeps its original DOM node, event listeners and component resources.
  for (const search of mainOnly(".search")) shell.append(search);
  for (const element of mainOnly(
    ".page-title, .darkmode, .reader-mode, .readermode, .breadcrumbs, .breadcrumb-container, .content-meta, .note-properties, .toc, .tags",
  )) {
    if (element.closest("article, .page-footer, footer")) continue;
    element.hidden = true;
    element.dataset.qvSuperseded = "true";
  }
  // Preserve unrelated sidebar widgets below the article instead of dropping them.
  const pageFooter =
    center.querySelector<HTMLElement>(".page-footer") ??
    center.appendChild(document.createElement("div"));
  pageFooter.classList.add("page-footer");
  for (const sidebar of [left, right]) {
    for (const child of [...sidebar.children]) {
      if (
        child instanceof HTMLElement &&
        !child.matches("[data-qv-panel], .qv-main-menu-pinned, [data-qv-superseded]")
      )
        pageFooter.append(child);
    }
  }
  const infobox = shell.querySelector<HTMLElement>("[data-qv-auto-infobox]");
  const article = center.querySelector<HTMLElement>("article");
  if (infobox && article) article.prepend(infobox);
  const tools = shell.querySelector<HTMLElement>(".qv-page-tools");
  const headingArea = center.querySelector<HTMLElement>(".page-header > .popover-hint");
  if (tools && headingArea) headingArea.append(tools);
  const appearance = shell.querySelector<HTMLElement>("[data-qv-auto-appearance]");
  if (appearance) right.append(appearance);
  const after = body.querySelector<HTMLElement>("[data-qv-auto-after]");
  if (after) pageFooter.append(after);
  const extra = body.querySelector<HTMLElement>("[data-qv-auto-footer]");
  if (extra) {
    let footer = body.querySelector<HTMLElement>(":scope > footer");
    if (!footer) {
      footer = document.createElement("footer");
      body.append(footer);
    }
    footer.classList.add("qv-site-footer");
    if (!footer.contains(extra)) {
      if (extra.dataset.qvReplaceFooter === "true") footer.replaceChildren(extra);
      else footer.prepend(extra);
    }
  }
}
