import { Marked } from "marked";
import { pathToRoot } from "@quartz-community/utils";
import type {
  FullSlug,
  QuartzComponent,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import type { VectorInfoboxData } from "../types";
import { safeUrl } from "../vector-options";

/** Article information, authored in the page's infobox frontmatter. */
export const VectorInfobox = (() => {
  const rendered = new Map<string, string>();
  const Infobox: QuartzComponent = (props) => {
    const raw = props.fileData.frontmatter?.infobox;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const data = raw as VectorInfoboxData;
    if (typeof data.title !== "string" || !Array.isArray(data.rows)) return null;
    const base = `${pathToRoot(props.fileData.slug ?? ("index" as FullSlug))}/`;
    const url = (href: string) => {
      const value = safeUrl(href);
      return /^(?:https?:|\/|#|\.{1,2}\/)/i.test(value) ? value : base + value;
    };
    const markdown = new Marked({
      renderer: {
        html: ({ text }) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
      },
      walkTokens(token) {
        if (token.type === "link" || token.type === "image") token.href = url(token.href);
      },
    });
    const text = (value?: string) => {
      if (typeof value !== "string") return { __html: "" };
      const key = `${base}\0${value}`;
      let html = rendered.get(key);
      if (html === undefined) {
        html = markdown.parseInline(value, { async: false });
        if (rendered.size >= 512) rendered.delete(rendered.keys().next().value!);
        rendered.set(key, html);
      }
      return { __html: html };
    };
    const color = (value?: string) =>
      typeof value === "string" && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
        ? value
        : undefined;
    return (
      <aside
        class="qv-infobox"
        aria-label={data.title}
        style={{
          "--qv-info-light": color(data.color?.light),
          "--qv-info-dark": color(data.color?.dark),
        }}
      >
        <table>
          <caption dangerouslySetInnerHTML={text(data.title)} />
          <colgroup>
            <col style={{ width: "34%" }} />
            <col />
          </colgroup>
          <tbody>
            {data.subtitle && (
              <tr>
                <td
                  colspan={2}
                  class="qv-infobox-subtitle"
                  dangerouslySetInnerHTML={text(data.subtitle)}
                />
              </tr>
            )}
            {typeof data.image === "string" && safeUrl(data.image) !== "#" && (
              <tr>
                <td colspan={2} class="qv-infobox-image">
                  <img src={url(data.image)} alt={data.imageAlt ?? ""} />
                  {data.caption && <div dangerouslySetInnerHTML={text(data.caption)} />}
                </td>
              </tr>
            )}
            {data.rows.map((row) => {
              if (!row || typeof row !== "object") return null;
              if (typeof row.heading === "string")
                return (
                  <tr>
                    <th
                      colspan={2}
                      class="qv-infobox-heading"
                      dangerouslySetInnerHTML={text(row.heading)}
                    />
                  </tr>
                );
              if (typeof row.label !== "string" || typeof row.content !== "string") return null;
              return (
                <tr>
                  <th scope="row" dangerouslySetInnerHTML={text(row.label)} />
                  <td dangerouslySetInnerHTML={text(row.content)} />
                </tr>
              );
            })}
            {data.below && (
              <tr>
                <td
                  colspan={2}
                  class="qv-infobox-below"
                  dangerouslySetInnerHTML={text(data.below)}
                />
              </tr>
            )}
          </tbody>
        </table>
      </aside>
    );
  };
  return Infobox;
}) satisfies QuartzComponentConstructor;
