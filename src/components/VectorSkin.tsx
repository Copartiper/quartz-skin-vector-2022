import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { Marked } from "marked";
import { pathToRoot } from "@quartz-community/utils";
import type { VectorSkinOptions, VectorNavigationTemplate } from "../types";
import { resolveOptions, safeUrl } from "../vector-options";
import { i18n } from "../i18n";
import style from "./styles/vector.scss";
// @ts-expect-error inline script is compiled to a string by the Quartz bundler
import script from "./scripts/vector.inline.ts";

function labels(props: QuartzComponentProps, locale: string) {
  return i18n(locale === "auto" ? (props.cfg.locale ?? "en-US") : locale).vector;
}

export const VectorHeader = ((options?: VectorSkinOptions) => {
  const opts = resolveOptions(options);
  const Header: QuartzComponent = (props) => {
    const t = labels(props, opts.locale);
    const home = opts.homeUrl
      ? safeUrl(opts.homeUrl)
      : `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    const siteName = opts.wordmark || props.cfg.pageTitle || "Quartz";
    const searchLabel = `${t.search}${t.search === "Search" ? " " : ""}${siteName}`;
    const localUrl = (url: string) => {
      const value = safeUrl(url);
      return /^(?:https?:|\/|#|\.{1,2}\/)/i.test(value) ? value : `${base}${value}`;
    };
    const menuLinks = options?.navigation ?? [
      { label: t.categories, href: `${base}tags/` },
      { label: t.featured, href: `${base}特色内容` },
      { label: t.news, href: `${base}新闻动态` },
      { label: t.random, href: `${base}随机条目` },
      { label: t.contact, href: `${base}联络我们` },
      { label: `${t.about}${siteName}`, href: `${base}关于` },
      { label: t.help, href: `${base}帮助` },
      { label: t.community, href: `${base}维基社群` },
      { label: t.village, href: `${base}互助客` },
      { label: t.recent, href: `${base}最近更改` },
      { label: t.special, href: `${base}特殊页面` },
    ];
    return (
      <header
        class="qv-header"
        data-qv-skin
        data-theme={opts.defaultTheme}
        data-text={opts.defaultTextSize}
        data-width={opts.defaultWidth}
        data-qv-root={base}
        data-qv-full-search={t.fullSearch}
        data-qv-moved={t.moved}
      >
        <a class="qv-skip" href="#qv-content">
          {t.skip}
        </a>
        <details class="qv-menu">
          <summary aria-label={t.menu}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M1 3h18v2H1zm0 6h18v2H1zm0 6h18v2H1z" fill="currentColor" />
            </svg>
          </summary>
          <nav aria-label={t.menu}>
            <div class="qv-menu-heading">
              <strong>{t.menu}</strong>
              <button
                type="button"
                class="qv-menu-pin"
                data-pin-label={t.moveToSidebar}
                data-unpin-label={t.hide}
              >
                {t.moveToSidebar}
              </button>
            </div>
            <ul>
              {!options?.navigation && (
                <li>
                  <a href={home}>{t.home}</a>
                </li>
              )}
              {menuLinks.map((link, index) => (
                <li>
                  {!options?.navigation && index === 6 && (
                    <div class="qv-menu-section">{t.contribute}</div>
                  )}
                  {"section" in link && link.section && (
                    <div class="qv-menu-section">{link.section}</div>
                  )}
                  <a href={localUrl(link.href)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </details>
        <a class="qv-brand" href={home}>
          {opts.logoUrl && (
            <img
              class="qv-logo"
              src={localUrl(opts.logoUrl)}
              alt={opts.logoAlt}
              width="50"
              height="50"
            />
          )}
          <span class="qv-brand-text">
            <span class="qv-wordmark">{siteName}</span>
            <span class="qv-tagline">{opts.tagline || t.tagline}</span>
          </span>
        </a>
        {opts.showAppearance && (
          <details class="qv-appearance-menu qv-dock" data-qv-dock="appearance">
            <summary aria-label={t.appearance} title={t.appearance}>
              <svg width="24" height="20" viewBox="0 0 24 20" aria-hidden="true">
                <g fill="none" stroke="currentColor" stroke-width="1.8">
                  <circle cx="6" cy="12" r="4" />
                  <circle cx="18" cy="12" r="4" />
                  <path d="M10 12h4M2 11l2-7h3m15 7-2-7h-3" />
                </g>
              </svg>
            </summary>
          </details>
        )}
        <form class="qv-search-form" role="search">
          <label class="qv-search-input">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="m19 17.6-5.2-5.2a7.5 7.5 0 1 0-1.4 1.4l5.2 5.2zM2 7.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0"
                fill="currentColor"
              />
            </svg>
            <input
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="false"
              aria-controls="qv-search-suggestions"
              autocomplete="off"
              type="search"
              name="query"
              aria-label={searchLabel}
              placeholder={searchLabel}
            />
          </label>
          <button type="submit">{t.search}</button>
          <div
            id="qv-search-suggestions"
            class="qv-search-suggestions"
            role="listbox"
            aria-label={t.search}
            hidden
          />
        </form>
        <div class="qv-scroll-buttons" hidden aria-label={t.pageNavigation}>
          <button type="button" data-qv-scroll="top" aria-label={t.pageTop} title={t.pageTop}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M3 2h14v2H3zm6 16V8.8l-4.3 4.3-1.4-1.4L10 5l6.7 6.7-1.4 1.4L11 8.8V18z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            type="button"
            data-qv-scroll="bottom"
            aria-label={t.pageBottom}
            title={t.pageBottom}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M3 16h14v2H3zm6-14v9.2L4.7 6.9 3.3 8.3 10 15l6.7-6.7-1.4-1.4-4.3 4.3V2z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </header>
    );
  };
  const footerColor = (value: string | undefined, fallback: string) =>
    value && /^(?:#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|var\(--[a-z0-9-]+\))$/i.test(value)
      ? value
      : fallback;
  Header.css =
    style +
    `:root:has([data-qv-skin]){--qv-footer-light:${footerColor(options?.footerTextColors?.light, "var(--qv-fg)")};--qv-footer-dark:${footerColor(options?.footerTextColors?.dark, "var(--qv-fg)")};}`;
  Header.afterDOMLoaded = script;
  return Header;
}) satisfies QuartzComponentConstructor;

export const VectorTOC = ((options?: VectorSkinOptions) => {
  const opts = resolveOptions(options);
  const TOC: QuartzComponent = (props) => {
    const t = labels(props, opts.locale);
    const toc = props.fileData.toc ?? [];
    if (!toc.length) return null;
    type Node = { text: string; slug: string; depth: number; index: number; children: Node[] };
    const tree: Node[] = [];
    const stack: Node[] = [];
    toc.forEach((entry, index) => {
      const node: Node = { ...entry, index, children: [] };
      while (stack.length && stack[stack.length - 1]!.depth >= entry.depth) stack.pop();
      (stack.length ? stack[stack.length - 1]!.children : tree).push(node);
      stack.push(node);
    });
    const expanded = toc.length <= 28;
    const items = (nodes: Node[], depth = 0): import("preact").VNode[] =>
      nodes.map((entry) => (
        <li class={`qv-toc-item qv-depth-${Math.min(depth, 3)}`}>
          <div class="qv-toc-row">
            {!!entry.children.length && (
              <button
                type="button"
                class="qv-toc-toggle"
                aria-expanded={expanded}
                aria-controls={`qv-toc-branch-${entry.index}`}
                aria-label={`${t.expand} / ${t.collapse}: ${entry.text}`}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m7 3 7 7-7 7-1.4-1.4L11.2 10 5.6 4.4z" fill="currentColor" />
                </svg>
              </button>
            )}
            <a href={`#${entry.slug}`}>{entry.text}</a>
          </div>
          {!!entry.children.length && (
            <ul class="qv-toc-children" id={`qv-toc-branch-${entry.index}`} hidden={!expanded}>
              {items(entry.children, depth + 1)}
            </ul>
          )}
        </li>
      ));
    return (
      <nav class="qv-toc qv-panel qv-dock-panel" data-qv-panel="toc" aria-label={t.contents}>
        <div class="qv-menu-heading">
          <strong>{t.contents}</strong>
          <button
            type="button"
            class="qv-menu-pin qv-dock-pin"
            data-pin-label={t.moveToSidebar}
            data-unpin-label={t.hide}
          >
            {t.moveToSidebar}
          </button>
        </div>
        <ul>
          <li>
            <a href="#qv-content">{t.beginning}</a>
          </li>
          {items(tree)}
        </ul>
      </nav>
    );
  };
  return TOC;
}) satisfies QuartzComponentConstructor;

export const VectorAppearance = ((options?: VectorSkinOptions) => {
  const opts = resolveOptions(options);
  const Appearance: QuartzComponent = (props) => {
    if (!opts.showAppearance) return null;
    const t = labels(props, opts.locale);
    const groups = [
      {
        key: "text",
        title: t.text,
        values: ["small", "standard", "large"],
        selected: opts.defaultTextSize,
      },
      { key: "width", title: t.width, values: ["standard", "wide"], selected: opts.defaultWidth },
      {
        key: "theme",
        title: t.color,
        values: ["auto", "light", "dark"],
        selected: opts.defaultTheme,
      },
    ];
    return (
      <aside
        class="qv-appearance qv-panel qv-dock-panel"
        data-qv-panel="appearance"
        aria-label={t.appearance}
      >
        <div class="qv-menu-heading">
          <strong>{t.appearance}</strong>
          <button
            type="button"
            class="qv-menu-pin qv-dock-pin"
            data-pin-label={t.moveToSidebar}
            data-unpin-label={t.hide}
          >
            {t.hide}
          </button>
        </div>
        {groups.map((group) => (
          <fieldset>
            <legend>{group.title}</legend>
            {group.values.map((value) => (
              <label>
                <input
                  type="radio"
                  name={`qv-${group.key}`}
                  value={value}
                  checked={value === group.selected}
                  data-qv-setting={group.key}
                />
                {t[value as keyof typeof t]}
              </label>
            ))}
          </fieldset>
        ))}
      </aside>
    );
  };
  return Appearance;
}) satisfies QuartzComponentConstructor;

/** Modified metadata is shown independently of reading-time statistics. */
export const VectorRevision = ((options?: VectorSkinOptions) => {
  const opts = resolveOptions(options);
  let formatter: Intl.DateTimeFormat;
  const Revision: QuartzComponent = (props) => {
    const date = props.fileData.dates?.modified;
    if (!date) return null;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    const chinese = (opts.locale === "auto" ? (props.cfg.locale ?? "en-US") : opts.locale)
      .toLowerCase()
      .startsWith("zh");
    formatter ??= new Intl.DateTimeFormat(chinese ? "zh-CN" : "en-US", {
      timeZone: opts.revisionTimeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(parsed);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    return (
      <p class="qv-revision">
        {chinese ? "本页面最后修订于" : "This page was last edited on "}
        <time dateTime={parsed.toISOString()}>
          {chinese
            ? `${value("year")}年${value("month")}月${value("day")}日 (${value("weekday")}) ${value("hour")}:${value("minute")}`
            : formatter.format(parsed)}
        </time>
        {chinese ? "。" : "."}
      </p>
    );
  };
  return Revision;
}) satisfies QuartzComponentConstructor;

export const VectorFooter = ((options?: VectorSkinOptions) => {
  const footerBodies = new Map<string, string>();
  const Footer: QuartzComponent = (props) => {
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    const url = (href: string) => {
      const value = safeUrl(href);
      return /^(?:https?:|\/|#|\.{1,2}\/)/i.test(value) ? value : base + value;
    };
    const body =
      options?.footerMarkdown === undefined
        ? undefined
        : (footerBodies.get(base) ??
          (() => {
            const markdown = new Marked({
              renderer: {
                html({ text }) {
                  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                },
              },
              walkTokens(token) {
                if (token.type === "link" || token.type === "image") token.href = url(token.href);
              },
            });
            const rendered = markdown.parse(options.footerMarkdown!, { async: false });
            footerBodies.set(base, rendered);
            return rendered;
          })());
    return (
      <div class="qv-footer-content">
        {body !== undefined && (
          <div class="qv-footer-markdown" dangerouslySetInnerHTML={{ __html: body }} />
        )}
        {body === undefined &&
          options?.footerParagraphs?.map((paragraph) => (
            <p>
              {paragraph.map((part) => {
                const content = part.href ? <a href={url(part.href)}>{part.text}</a> : part.text;
                return part.bold ? <strong>{content}</strong> : content;
              })}
            </p>
          ))}
        <ul class="qv-footer-links">
          {options?.footerLinks?.map((link) => (
            <li>
              <a href={url(link.href)}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return Footer;
}) satisfies QuartzComponentConstructor;

/** Page frontmatter navboxes accepts template indexes or inline template objects. */
export const VectorNavigation = ((options?: VectorSkinOptions) => {
  const lexer = new Marked();
  const inlineTokens = new Map<string, ReturnType<typeof lexer.Lexer.lexInline>>();
  const Navigation: QuartzComponent = (props) => {
    const t = labels(props, options?.locale ?? "auto");
    const configured = options?.navigationTemplates ?? [];
    const selected = props.fileData.frontmatter?.navboxes;
    if (!Array.isArray(selected) || !selected.length) return null;
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    const url = (href: string) => {
      const value = safeUrl(href);
      return /^(?:https?:|\/|#|\.{1,2}\/)/i.test(value) ? value : base + value;
    };
    const origin = `https://${props.cfg.baseUrl || "quartz.invalid"}`;
    const current = new URL(
      base + (props.fileData.slug ?? "index"),
      new URL("/" + (props.fileData.slug ?? "index"), origin),
    );
    const canonical = (pathname: string) =>
      decodeURI(pathname)
        .replace(/\.html$/, "")
        .replace(/\/index\/?$/, "/")
        .replace(/\/$/, "");
    const isCurrent = (href: string) => {
      try {
        const target = new URL(url(href), new URL("/" + (props.fileData.slug ?? "index"), origin));
        return (
          target.origin === current.origin &&
          canonical(target.pathname) === canonical(current.pathname)
        );
      } catch {
        return false;
      }
    };
    const colors = (template: VectorNavigationTemplate) => {
      const valid = (value?: string) =>
        value && /^(?:#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(value)
          ? value
          : undefined;
      return {
        "--qv-box-light": valid(template.color?.light),
        "--qv-box-dark": valid(template.color?.dark),
      };
    };
    const markdown = new Marked({
      renderer: {
        link(token) {
          if (isCurrent(token.href))
            return `<span class="qv-selflink" aria-current="page">${this.parser.parseInline(token.tokens)}</span>`;
          return false;
        },
        html: ({ text }) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      },
      walkTokens(token) {
        if (token.type === "link" || token.type === "image") token.href = url(token.href);
      },
    });
    const text = (value: string) => {
      let tokens = inlineTokens.get(value);
      if (!tokens) {
        tokens = lexer.Lexer.lexInline(value);
        // Bound memory when many pages provide unique inline templates.
        if (inlineTokens.size >= 512) inlineTokens.delete(inlineTokens.keys().next().value!);
        inlineTokens.set(value, tokens);
      }
      const pageTokens = structuredClone(tokens);
      markdown.walkTokens(pageTokens, (token) => {
        if (token.type === "link" || token.type === "image") token.href = url(token.href);
      });
      return { __html: markdown.Parser.parseInline(pageTokens, markdown.defaults) };
    };
    const templates = selected
      .map((item) => (typeof item === "number" ? configured[item] : item))
      .filter(
        (item): item is VectorNavigationTemplate =>
          !!item && typeof item.title === "string" && Array.isArray(item.rows),
      );
    if (!templates.length) return null;
    return (
      <nav class="qv-navboxes" aria-label={t.navigationTemplates}>
        {templates.map((template) => (
          <details class="qv-navbox" open={!template.collapsed} style={colors(template)}>
            <summary>
              <strong dangerouslySetInnerHTML={text(template.title)} />
              <span class="qv-navbox-toggle" aria-hidden="true">
                <span class="qv-navbox-expand">[{t.expand}]</span>
                <span class="qv-navbox-collapse">[{t.collapse}]</span>
              </span>
            </summary>
            <div class="qv-navbox-body">
              {!!template.links?.length && (
                <div class="qv-navbox-actions">
                  {template.links.map((link) =>
                    isCurrent(link.href) ? (
                      <span class="qv-selflink" aria-current="page">
                        {link.label}
                      </span>
                    ) : (
                      <a href={url(link.href)}>{link.label}</a>
                    ),
                  )}
                </div>
              )}
              {template.above && (
                <div class="qv-navbox-above" dangerouslySetInnerHTML={text(template.above)} />
              )}
              {template.rows.map((row) => (
                <div class="qv-navbox-row">
                  <div class="qv-navbox-label" dangerouslySetInnerHTML={text(row.label)} />
                  <div class="qv-navbox-list" dangerouslySetInnerHTML={text(row.content)} />
                </div>
              ))}
              {template.below && (
                <div class="qv-navbox-below" dangerouslySetInnerHTML={text(template.below)} />
              )}
            </div>
          </details>
        ))}
      </nav>
    );
  };
  return Navigation;
}) satisfies QuartzComponentConstructor;

/** Convenience factory for a complete set of matching layout components. */
export function VectorSkin(options: VectorSkinOptions = {}) {
  return {
    header: VectorHeader(options),
    toc: VectorTOC(options),
    appearance: VectorAppearance(options),
    revision: VectorRevision(options),
    footer: VectorFooter(options),
    navigation: VectorNavigation(options),
  };
}
