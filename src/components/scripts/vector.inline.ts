import { suggestPages, type SearchSuggestion } from "../../search-suggestions";
let qvSuggestionIndex: Promise<SearchSuggestion[]> | undefined;
/** Vector preferences and section tracking, reinitialized on Quartz SPA navigation. */
const qvAllowed: Record<string, readonly string[]> = {
  theme: ["auto", "light", "dark"],
  text: ["small", "standard", "large"],
  width: ["standard", "wide"],
};
let qvDispose: (() => void) | undefined;
function initVector() {
  qvDispose?.();
  const header = document.querySelector<HTMLElement>("[data-qv-skin]");
  if (!header) {
    for (const key of Object.keys(qvAllowed))
      document.documentElement.removeAttribute(`data-qv-${key}`);
    return;
  }
  const cleanup: Array<() => void> = [];
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const state: Record<string, string> = {};
  function apply(key: string, value: string) {
    if (!qvAllowed[key]?.includes(value)) return;
    state[key] = value;
    root.setAttribute(`data-qv-${key}`, value);
    if (key === "theme") {
      const theme = value === "auto" ? (media.matches ? "dark" : "light") : value;
      root.setAttribute("saved-theme", theme);
      document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
    }
    document
      .querySelectorAll<HTMLInputElement>(`input[data-qv-setting="${key}"]`)
      .forEach((input) => {
        input.checked = input.value === value;
      });
  }
  for (const key of Object.keys(qvAllowed)) {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(`quartz-vector-${key}`);
    } catch {
      /* Storage may be disabled. */
    }
    apply(
      key,
      stored && qvAllowed[key]?.includes(stored) ? stored : (header.dataset[key] ?? "standard"),
    );
  }
  const onChange = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.dataset.qvSetting) return;
    const key = input.dataset.qvSetting;
    if (!qvAllowed[key]?.includes(input.value)) return;
    apply(key, input.value);
    try {
      localStorage.setItem(`quartz-vector-${key}`, input.value);
    } catch {
      /* Use in-memory preference. */
    }
  };
  document.addEventListener("change", onChange);
  cleanup.push(() => document.removeEventListener("change", onChange));
  const onSystemTheme = () => {
    if (state.theme === "auto") apply("theme", "auto");
  };
  media.addEventListener("change", onSystemTheme);
  cleanup.push(() => media.removeEventListener("change", onSystemTheme));

  function movedNotice(host: HTMLElement, label: string) {
    document.querySelector(".qv-moved-notice")?.remove();
    const notice = document.createElement("div");
    notice.className = "qv-moved-notice";
    notice.role = "status";
    notice.textContent = `${label.endsWith("菜单") ? label : label + "菜单"}已移至此处`;
    document.body.append(notice);
    const rect = host.getBoundingClientRect();
    notice.style.top = `${Math.max(8, rect.bottom + 8)}px`;
    notice.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 240))}px`;
    const timer = window.setTimeout(() => notice.remove(), 4000);
    cleanup.push(() => {
      clearTimeout(timer);
      notice.remove();
    });
  }
  const menu = header.querySelector<HTMLDetailsElement>(".qv-menu");
  const menuNav = menu?.querySelector<HTMLElement>("nav");
  const pin = menuNav?.querySelector<HTMLButtonElement>(".qv-menu-pin");
  const sidebar = document.querySelector<HTMLElement>("#quartz-body > .sidebar.left");
  if (menu && menuNav && pin && sidebar) {
    let pinned = false;
    const desktop = window.matchMedia("(min-width: 1120px)");
    const placeMenu = () => {
      const docked = pinned && desktop.matches;
      menuNav.classList.toggle("qv-main-menu-pinned", docked);
      if (docked) sidebar.prepend(menuNav);
      else menu.append(menuNav);
      menu.hidden = docked;
      pin.textContent = docked ? pin.dataset.unpinLabel! : pin.dataset.pinLabel!;
      pin.hidden = !desktop.matches;
    };
    try {
      pinned = localStorage.getItem("quartz-vector-menu-pinned") === "true";
    } catch {
      /* Storage may be disabled. */
    }
    placeMenu();
    const togglePin = () => {
      pinned = !pinned;
      try {
        localStorage.setItem("quartz-vector-menu-pinned", String(pinned));
      } catch {
        /* Use in-memory preference. */
      }
      placeMenu();
      menu.open = false;
      if (!pinned) movedNotice(menu, menuNav.getAttribute("aria-label") || "主菜单");
      if (pinned) pin.focus();
      else menu.querySelector<HTMLElement>("summary")?.focus();
    };
    pin.addEventListener("click", togglePin);
    desktop.addEventListener("change", placeMenu);
    const dismiss = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof KeyboardEvent ||
        (event.target instanceof Node && !menu.contains(event.target))
      )
        menu.open = false;
    };
    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", dismiss);
    cleanup.push(() => {
      pin.removeEventListener("click", togglePin);
      desktop.removeEventListener("change", placeMenu);
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", dismiss);
      menu.append(menuNav);
      menuNav.classList.remove("qv-main-menu-pinned");
      menu.hidden = false;
    });
  }

  const emptyTOCHost = document.querySelector<HTMLDetailsElement>('[data-qv-dock="toc"]');
  if (emptyTOCHost && !emptyTOCHost.querySelector('[data-qv-panel="toc"]')) emptyTOCHost.remove();
  const tocHost = document.querySelector<HTMLDetailsElement>('[data-qv-dock="toc"]');
  const title = document.querySelector<HTMLElement>(".article-title");
  if (tocHost && title) {
    const marker = document.createComment("qv-toc-home");
    tocHost.before(marker);
    const titlebar = document.createElement("div");
    titlebar.className = "qv-titlebar";
    title.before(titlebar);
    titlebar.append(tocHost, title);
    cleanup.push(() => {
      titlebar.before(title);
      marker.replaceWith(tocHost);
      titlebar.remove();
    });
  }
  const dockDesktop = window.matchMedia("(min-width: 1120px)");
  document.querySelectorAll<HTMLDetailsElement>("[data-qv-dock]").forEach((host) => {
    const id = host.dataset.qvDock!;
    const panel = document.querySelector<HTMLElement>(`[data-qv-panel="${id}"]`);
    const target = document.querySelector<HTMLElement>(
      `#quartz-body > .sidebar.${id === "appearance" ? "right" : "left"}`,
    );
    const button = panel?.querySelector<HTMLButtonElement>(".qv-dock-pin");
    if (!panel || !target || !button) return;
    const home = document.createComment(`qv-${id}-home`);
    panel.before(home);
    let pinned = id === "appearance";
    try {
      const stored = localStorage.getItem(`quartz-vector-${id}-pinned`);
      if (stored !== null) pinned = stored === "true";
    } catch {
      /* Storage may be disabled. */
    }
    const place = () => {
      const docked = pinned && dockDesktop.matches;
      panel.classList.toggle("qv-docked", docked);
      if (docked) {
        const order = id === "toc" ? 1 : id === "explorer" ? 2 : 0;
        const next = Array.from(target.children).find(
          (child) => Number((child as HTMLElement).dataset.qvOrder ?? 0) > order,
        );
        panel.dataset.qvOrder = String(order);
        target.insertBefore(panel, next ?? null);
      } else host.append(panel);
      host.hidden = docked;
      button.textContent = docked ? button.dataset.unpinLabel! : button.dataset.pinLabel!;
      button.hidden = !dockDesktop.matches;
    };
    const toggle = () => {
      pinned = !pinned;
      try {
        localStorage.setItem(`quartz-vector-${id}-pinned`, String(pinned));
      } catch {
        /* Use in-memory preference. */
      }
      place();
      host.open = false;
      if (!pinned) movedNotice(host, id === "toc" ? "目录" : id === "explorer" ? "探索" : "外观");
      if (!host.hidden) host.querySelector<HTMLElement>("summary")?.focus();
      else button.focus();
    };
    const dismiss = (event: Event) => {
      if (
        (event instanceof KeyboardEvent && event.key === "Escape") ||
        (event instanceof MouseEvent &&
          event.target instanceof Node &&
          !host.contains(event.target) &&
          !(event.target instanceof Element && event.target.closest(".qv-floating-toc")))
      )
        host.open = false;
    };
    place();
    button.addEventListener("click", toggle);
    dockDesktop.addEventListener("change", place);
    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", dismiss);
    cleanup.push(() => {
      button.removeEventListener("click", toggle);
      dockDesktop.removeEventListener("change", place);
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", dismiss);
      home.replaceWith(panel);
      panel.classList.remove("qv-docked");
      host.hidden = false;
    });
  });

  if (tocHost) {
    const floating = document.createElement("button");
    floating.type = "button";
    floating.className = "qv-floating-toc";
    floating.textContent = "☰";
    floating.setAttribute("aria-label", "展开目录");
    document.body.append(floating);
    const refresh = () => {
      if (tocHost.open) return;
      const panel = document.querySelector<HTMLElement>('[data-qv-panel="toc"]');
      const source = tocHost.hidden ? panel : tocHost;
      const rect = source?.getBoundingClientRect();
      floating.hidden = !!rect && rect.bottom > 0 && rect.top < window.innerHeight;
    };
    const open = () => {
      floating.hidden = true;
      tocHost.classList.add("qv-toc-floating-open");
      tocHost.hidden = false;
      const panel = document.querySelector<HTMLElement>('[data-qv-panel="toc"]');
      if (panel?.classList.contains("qv-docked")) {
        const marker = document.createComment("qv-floating-home");
        panel.before(marker);
        tocHost.append(panel);
        const restore = () => {
          if (tocHost.open) return;
          marker.replaceWith(panel);
          tocHost.removeEventListener("toggle", restore);
        };
        tocHost.addEventListener("toggle", restore);
        cleanup.push(() => {
          if (marker.parentNode) marker.replaceWith(panel);
          tocHost.removeEventListener("toggle", restore);
        });
      }
      tocHost.open = true;
      tocHost.querySelector<HTMLElement>("summary")?.focus();
    };
    const onToggle = () => {
      if (!tocHost.open && tocHost.classList.contains("qv-toc-floating-open")) {
        tocHost.classList.remove("qv-toc-floating-open");
        tocHost.hidden = !!document.querySelector('[data-qv-panel="toc"].qv-docked');
        refresh();
      }
    };
    floating.addEventListener("click", open);
    tocHost.addEventListener("toggle", onToggle);
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    const observer = new MutationObserver(refresh);
    observer.observe(tocHost, { attributes: true, attributeFilter: ["hidden"] });
    refresh();
    cleanup.push(() => {
      floating.remove();
      observer.disconnect();
      tocHost.removeEventListener("toggle", onToggle);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    });
  }

  const article = document.querySelector<HTMLElement>("article.popover-hint, article");
  const content = document.querySelector<HTMLElement>(".center");
  if (content && !document.getElementById("qv-content")) {
    const anchor = document.createElement("span");
    anchor.id = "qv-content";
    anchor.tabIndex = -1;
    content.prepend(anchor);
    cleanup.push(() => anchor.remove());
  }
  const search = document.querySelector<HTMLElement>(".search");
  const searchForm = header.querySelector<HTMLFormElement>(".qv-search-form");
  if (searchForm) {
    searchForm.hidden = !search;
    const input = searchForm.querySelector<HTMLInputElement>("input")!;
    const popup = searchForm.querySelector<HTMLElement>(".qv-search-suggestions")!;
    const closeSuggestions = () => {
      popup.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    };
    const openSearch = (event: Event) => {
      event.preventDefault();
      closeSuggestions();
      const trigger = search?.querySelector<HTMLElement>(".search-button, button");
      const query = searchForm.querySelector<HTMLInputElement>("input")?.value ?? "";
      trigger?.click();
      const searchInput = search?.querySelector<HTMLInputElement>(
        ".search-bar, .search-container input",
      );
      if (searchInput) {
        searchInput.value = query;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.focus();
      }
    };
    let disposed = false;
    let revision = 0;
    let active = -1;
    const choices = () => Array.from(popup.querySelectorAll<HTMLElement>("[role=option]"));
    const updateActive = () => {
      choices().forEach((choice, index) =>
        choice.setAttribute("aria-selected", String(index === active)),
      );
      if (active >= 0) input.setAttribute("aria-activedescendant", choices()[active]?.id ?? "");
      else input.removeAttribute("aria-activedescendant");
    };
    const showSuggestions = async () => {
      const current = ++revision;
      const query = input.value.trim();
      if (!query) {
        closeSuggestions();
        return;
      }
      closeSuggestions();
      qvSuggestionIndex ??= fetch(`${header.dataset.qvRoot}static/vector-search.json`)
        .then((response) => {
          if (!response.ok) throw new Error("Suggestion index unavailable");
          return response.json();
        })
        .then((pages: unknown) =>
          Array.isArray(pages)
            ? pages.filter(
                (page): page is SearchSuggestion =>
                  typeof page?.slug === "string" &&
                  typeof page?.title === "string" &&
                  typeof page?.description === "string",
              )
            : [],
        )
        .catch(() => {
          qvSuggestionIndex = undefined;
          return [];
        });
      const pages = await qvSuggestionIndex;
      if (disposed || revision !== current || document.activeElement !== input) return;
      popup.replaceChildren();
      active = -1;
      for (const page of suggestPages(pages, query)) {
        const link = document.createElement("a");
        link.href = `${header.dataset.qvRoot}${page.slug.split("/").map(encodeURIComponent).join("/")}`;
        link.className = "qv-suggestion";
        link.setAttribute("role", "option");
        link.id = `qv-suggestion-${popup.children.length}`;
        link.setAttribute("aria-selected", "false");
        const title = document.createElement("strong");
        title.textContent = page.title;
        const description = document.createElement("span");
        description.textContent = page.description;
        link.append(title, description);
        popup.append(link);
      }
      const full = document.createElement("button");
      full.type = "button";
      full.className = "qv-full-search";
      full.setAttribute("role", "option");
      full.id = `qv-suggestion-${popup.children.length}`;
      full.setAttribute("aria-selected", "false");
      full.textContent = header.dataset.qvFullSearch!.replace("{query}", query);
      popup.append(full);
      popup.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        ++revision;
        closeSuggestions();
        return;
      }
      if (popup.hidden) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        active =
          (active + (event.key === "ArrowDown" ? 1 : -1) + choices().length) % choices().length;
        updateActive();
      } else if (event.key === "Enter" && active >= 0) {
        event.preventDefault();
        choices()[active]?.click();
      }
    };
    const onPopupClick = (event: Event) => {
      if ((event.target as HTMLElement).closest(".qv-full-search")) openSearch(event);
      else closeSuggestions();
    };
    const onOutside = (event: Event) => {
      if (event.target instanceof Node && !searchForm.contains(event.target)) {
        ++revision;
        closeSuggestions();
      }
    };
    searchForm.addEventListener("submit", openSearch);
    input.addEventListener("input", showSuggestions);
    input.addEventListener("focus", showSuggestions);
    input.addEventListener("keydown", onKey);
    popup.addEventListener("click", onPopupClick);
    document.addEventListener("click", onOutside);
    document.addEventListener("focusin", onOutside);
    cleanup.push(() => {
      disposed = true;
      searchForm.removeEventListener("submit", openSearch);
      input.removeEventListener("input", showSuggestions);
      input.removeEventListener("focus", showSuggestions);
      input.removeEventListener("keydown", onKey);
      popup.removeEventListener("click", onPopupClick);
      document.removeEventListener("click", onOutside);
      document.removeEventListener("focusin", onOutside);
      closeSuggestions();
    });
  }
  const bottomGraph = document.querySelector<HTMLDetailsElement>(".qv-graph-tool");
  if (bottomGraph) {
    const onGraphToggle = () => {
      if (bottomGraph.open)
        document.dispatchEvent(
          new CustomEvent("themechange", { detail: { theme: root.getAttribute("saved-theme") } }),
        );
    };
    bottomGraph.addEventListener("toggle", onGraphToggle);
    cleanup.push(() => bottomGraph.removeEventListener("toggle", onGraphToggle));
  }
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".qv-toc a"));
  if (article && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const heading = entries.find((entry) => entry.isIntersecting)?.target;
        if (!heading) return;
        for (const link of links) {
          if (link.getAttribute("href")?.slice(1) === heading.id) {
            link.setAttribute("aria-current", "location");
          } else link.removeAttribute("aria-current");
        }
      },
      { rootMargin: "-8% 0px -65% 0px" },
    );
    article
      .querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
      .forEach((heading) => observer.observe(heading));
    cleanup.push(() => observer.disconnect());
  }
  qvDispose = () => {
    cleanup.forEach((fn) => fn());
    qvDispose = undefined;
  };
  window.addCleanup?.(() => qvDispose?.());
}
document.addEventListener("nav", initVector);
document.addEventListener("render", initVector);
initVector();
