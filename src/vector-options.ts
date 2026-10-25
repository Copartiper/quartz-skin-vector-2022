import type { VectorSkinOptions } from "./types";

export const defaultOptions = {
  locale: "auto",
  wordmark: "",
  tagline: "",
  logoUrl: "",
  logoAlt: "",
  revisionTimeZone: "Asia/Shanghai",
  homeUrl: "",
  defaultTheme: "auto",
  defaultTextSize: "standard",
  defaultWidth: "standard",
  showAppearance: true,
  navigation: [],
} satisfies VectorSkinOptions;

/** Accept local links and HTTP(S), but never executable URL schemes. */
export function safeUrl(url: string): string {
  const value = url.trim();
  return /^(?:https?:\/\/|\/(?!\/)|\.{1,2}\/|#)/i.test(value) ||
    (!/[:\\\s]/.test(value) && !value.startsWith("//"))
    ? value
    : "#";
}

export function resolveOptions(options: VectorSkinOptions = {}) {
  return { ...defaultOptions, ...options };
}
