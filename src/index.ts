// Re-export shared types from @quartz-community/types
export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  StringResource,
  QuartzTransformerPlugin,
  QuartzFilterPlugin,
  QuartzEmitterPlugin,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
  PageGenerator,
  VirtualPage,
} from "@quartz-community/types";

export {
  VectorSkin,
  VectorHeader,
  VectorTOC,
  VectorAppearance,
  VectorRevision,
  VectorFooter,
  VectorNavigation,
} from "./components/VectorSkin";
export { defaultOptions as vectorDefaultOptions } from "./vector-options";
export type { VectorSkinOptions, VectorNavigationTemplate } from "./types";

export { VectorSearchIndex } from "./search-index";
