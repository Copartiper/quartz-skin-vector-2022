import type { ComponentType } from "preact";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToRoot } from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import type { VectorSkinOptions } from "../types";
import { VectorSkin } from "./VectorSkin";
import { i18n } from "../i18n";

/** One layout component for standard Quartz 5 plugin discovery. */
export const VectorPage = ((options: VectorSkinOptions = {}) => {
  const skin = VectorSkin(options);
  const revisionCache = new Map<string, { mtime: number; date: Date }>();
  const Page: QuartzComponent = (props) => {
    const t = i18n(
      options.locale === "auto" || !options.locale ? (props.cfg.locale ?? "en-US") : options.locale,
    ).vector;
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    // A newly installed skin should only link to pages every Quartz site already has.
    const Header = VectorSkin({
      ...options,
      navigation: options.navigation ?? [
        { label: t.home, href: "index" },
        { label: t.categories, href: "tags/" },
      ],
    }).header as ComponentType<QuartzComponentProps>;
    let modified = props.fileData.dates?.modified;
    const filePath = props.fileData.filePath;
    if (filePath) {
      try {
        const stat = fs.statSync(filePath);
        const cached = revisionCache.get(filePath);
        if (cached?.mtime === stat.mtimeMs) modified = cached.date;
        else {
          let date = stat.mtime;
          try {
            const status = execFileSync("git", ["status", "--porcelain", "--", filePath], {
              encoding: "utf8",
              stdio: ["ignore", "pipe", "ignore"],
            }).trim();
            if (!status) {
              const committed = execFileSync("git", ["log", "-1", "--format=%cI", "--", filePath], {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
              }).trim();
              if (committed) date = new Date(committed);
            }
          } catch {
            /* A site does not have to be a Git checkout. */
          }
          modified = date;
          revisionCache.set(filePath, { mtime: stat.mtimeMs, date });
        }
      } catch {
        /* Virtual pages may have no source file. */
      }
    }
    const Revision = skin.revision as ComponentType<QuartzComponentProps>;
    const TOC = skin.toc as ComponentType<QuartzComponentProps>;
    const Appearance = skin.appearance as ComponentType<QuartzComponentProps>;
    const Navigation = skin.navigation as ComponentType<QuartzComponentProps>;
    const Footer = skin.footer as ComponentType<QuartzComponentProps>;
    const hasFooter =
      options.footerMarkdown !== undefined ||
      options.footerParagraphs !== undefined ||
      options.footerLinks !== undefined;
    return (
      <div class="qv-auto-layout" data-qv-auto-layout>
        <Header {...props} children={undefined} />
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
