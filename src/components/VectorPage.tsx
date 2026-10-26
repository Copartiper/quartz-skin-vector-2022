import type { ComponentType } from "preact";
import { pathToRoot } from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import type { VectorSkinOptions } from "../types";
import { VectorInfobox } from "./VectorInfobox";
import { createRevisionResolver } from "../revision";
import { VectorHeader, VectorSkin } from "./VectorSkin";
import { i18n } from "../i18n";

/** One layout component for standard Quartz 5 plugin discovery. */
export const VectorPage = ((options: VectorSkinOptions = {}) => {
  const skin = VectorSkin(options);
  const Infobox = VectorInfobox() as ComponentType<QuartzComponentProps>;
  const revision = createRevisionResolver();
  const headers = new Map<string, ComponentType<QuartzComponentProps>>();
  const Revision = skin.revision as ComponentType<QuartzComponentProps>;
  const TOC = skin.toc as ComponentType<QuartzComponentProps>;
  const Appearance = skin.appearance as ComponentType<QuartzComponentProps>;
  const Navigation = skin.navigation as ComponentType<QuartzComponentProps>;
  const Footer = skin.footer as ComponentType<QuartzComponentProps>;
  const hasFooter =
    options.footerMarkdown !== undefined ||
    options.footerParagraphs !== undefined ||
    options.footerLinks !== undefined;
  const Page: QuartzComponent = (props) => {
    const t = i18n(
      options.locale === "auto" || !options.locale ? (props.cfg.locale ?? "en-US") : options.locale,
    ).vector;
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    // Default navigation is localized; reuse the header factory across all pages of that locale.
    const locale = t.home;
    let Header = headers.get(locale);
    if (!Header) {
      Header = VectorHeader({
        ...options,
        navigation: options.navigation ?? [
          { label: t.home, href: "index" },
          { label: t.categories, href: "tags/" },
        ],
      }) as ComponentType<QuartzComponentProps>;
      headers.set(locale, Header);
    }
    const modified = revision(
      props.fileData.filePath,
      props.fileData.dates?.modified,
      (props.ctx as { buildId?: string } | undefined)?.buildId,
    );
    return (
      <div class="qv-auto-layout" data-qv-auto-layout>
        <Header {...props} children={undefined} />
        <div data-qv-auto-infobox>
          <Infobox {...props} children={undefined} />
        </div>
        <nav class="qv-page-tools" aria-label={t.pageNavigation}>
          {!!props.fileData.toc?.length && (
            <details class="qv-dock qv-toc-menu" data-qv-dock="toc">
              <summary aria-label={t.contents} title={t.contents}>
                ☰
              </summary>
              <TOC {...props} children={undefined} />
            </details>
          )}
          <details class="qv-dock" data-qv-dock="explorer" data-qv-native-tool="explorer">
            <summary>{t.explore}</summary>
            <nav class="qv-dock-panel" data-qv-panel="explorer" aria-label={t.explore}>
              <div class="qv-menu-heading">
                <strong>{t.explore}</strong>
                <button
                  type="button"
                  class="qv-menu-pin qv-dock-pin"
                  data-pin-label={t.moveToSidebar}
                  data-unpin-label={t.hide}
                >
                  {t.moveToSidebar}
                </button>
              </div>
              <div data-qv-native-slot="explorer" />
            </nav>
          </details>
          <details class="qv-graph-tool" data-qv-native-tool="graph">
            <summary>{t.graph}</summary>
            <div class="qv-tool-popup" data-qv-native-slot="graph" />
          </details>
        </nav>
        <div data-qv-auto-appearance>
          <Appearance {...props} children={undefined} />
        </div>
        <div data-qv-auto-after>
          <Navigation {...props} children={undefined} />
          {!!props.fileData.frontmatter?.tags?.length && (
            <nav class="qv-categories" aria-label={t.categories}>
              <a href={`${base}tags/`}>{t.categories}</a>
              <span>:</span>
              <ul class="tags">
                {props.fileData.frontmatter.tags.map((tag) => (
                  <li>
                    <a
                      class="internal tag-link"
                      href={`${base}tags/${tag.split("/").map(encodeURIComponent).join("/")}`}
                    >
                      {tag}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        <div data-qv-auto-footer data-qv-replace-footer={hasFooter ? "true" : "false"}>
          <Revision
            {...props}
            children={undefined}
            fileData={{
              ...props.fileData,
              dates: { ...props.fileData.dates!, modified: modified! },
            }}
          />
          {hasFooter && <Footer {...props} children={undefined} />}
        </div>
      </div>
    );
  };
  Page.css = skin.header.css;
  Page.beforeDOMLoaded = skin.header.beforeDOMLoaded;
  Page.afterDOMLoaded = skin.header.afterDOMLoaded;
  return Page;
}) satisfies QuartzComponentConstructor;
