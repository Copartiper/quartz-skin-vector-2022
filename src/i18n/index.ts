import enUS from "./locales/en-US";
import zhCN from "./locales/zh-CN";

export function i18n(locale: string) {
  return locale.toLowerCase().startsWith("zh") ? zhCN : enUS;
}
