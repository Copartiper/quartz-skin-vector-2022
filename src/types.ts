export type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
  QuartzFilterPlugin,
  QuartzFilterPluginInstance,
  QuartzPluginData,
  QuartzTransformerPlugin,
  QuartzTransformerPluginInstance,
  StaticResources,
  PageMatcher,
  PageGenerator,
  VirtualPage,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
} from "@quartz-community/types";

export interface ExampleTransformerOptions {
  /** Token used to highlight text, defaults to ==highlight== */
  highlightToken: string;
  /** Add a CSS class to all headings in the rendered HTML. */
  headingClass: string;
  /** Enable remark-gfm for tables/task lists. */
  enableGfm: boolean;
  /** Enable adding slug IDs to headings. */
  addHeadingSlugs: boolean;
}

export interface ExampleFilterOptions {
  /** Allow pages marked draft: true to publish. */
  allowDrafts: boolean;
  /** Exclude pages that contain any of these frontmatter tags. */
  excludeTags: string[];
  /** Exclude paths that start with any of these prefixes (relative to content root). */
  excludePathPrefixes: string[];
}

export interface ExampleEmitterOptions {
  /** Filename to emit at the site root. */
  manifestSlug: string;
  /** Whether to include the frontmatter block in the manifest. */
  includeFrontmatter: boolean;
  /** Extra metadata to write at the top level of the manifest. */
  metadata: Record<string, unknown>;
  /** Optional hook to transform the emitted manifest JSON string. */
  transformManifest?: (json: string) => string;
  /** Add a custom class to the emitted manifest <script> tag if used in HTML. */
  manifestScriptClass?: string;
}

export interface ExampleComponentOptions {
  /** Text to prefix before the title */
  prefix?: string;
  /** Text to suffix after the title */
  suffix?: string;
  /** CSS class name to apply */
  className?: string;
}

/** Vector 2022 skin. Install VectorHeader once in the beforeBody slot. */
export interface VectorSkinOptions {
  /** auto uses the Quartz site locale; Chinese and English UI are included. */
  locale?: "auto" | "en-US" | "zh-CN";
  /** Defaults to Quartz configuration.pageTitle. */
  wordmark?: string;
  tagline?: string;
  /** Logo URL; relative paths resolve from the site root. Empty hides the logo. */
  logoUrl?: string;
  logoAlt?: string;
  /** Time zone used by the revision footer. */
  revisionTimeZone?: string;
  /** Defaults to a relative link to the site root, including on nested pages. */
  homeUrl?: string;
  defaultTheme?: "auto" | "light" | "dark";
  defaultTextSize?: "small" | "standard" | "large";
  defaultWidth?: "standard" | "wide";
  showAppearance?: boolean;
  /** Footer text colors by theme: hex colors or CSS custom properties (var(--name)). */
  footerTextColors?: { light?: string; dark?: string };
  /** Footer body in Markdown. Raw HTML is escaped; takes precedence over footerParagraphs. */
  footerMarkdown?: string;
  /** Footer paragraphs, each containing plain text or links. No HTML is accepted. */
  footerParagraphs?: Array<Array<{ text: string; href?: string; bold?: boolean }>>;
  footerLinks?: Array<{ label: string; href: string }>;
  /** Links shown inside the main menu. */
  navigation?: Array<{ label: string; href: string; section?: string }>;
}
