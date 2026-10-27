# Changelog

## 0.3.0

### Minor Changes

- ea299e9: Add a responsive, theme-aware Infobox component configured in article frontmatter, with images, grouped fields, safe Markdown and custom group colors.
- 044f56a: Add a standalone VectorPage component and a default search-index emitter for native GitHub installation. Reuse standard Quartz components without site-specific layout adapters, preserve unrelated widgets and existing footers, and document configuration through plugin options.
- ea299e9: Refine Vector reading interactions: hierarchical TOC with long-page folding, deep-link expansion and stable section tracking; quieter menus, keyboard dismissal and search focus feedback. Wide layouts reclaim empty sidebar space and lift the page width cap. Add circular top/bottom controls shown only while scrolling down beyond the article title.
- 9c194d5: Add a Vector 2022 skin with responsive layout, localized navigation, table of
  contents, persistent appearance settings and GPL source attribution.

### Patch Changes

- b00ef78: Reduce repeated date and Markdown processing during page rendering. Prepare search suggestions once, retain only the best ten matches, debounce input with composition support, and batch scrolling and SPA initialization updates with instance-safe cleanup.
- 9c194d5: Add persistent docking for contents, explorer and appearance panels with fixed reading-column placement.
- b4535ea: Dock the Explore menu in the right sidebar below Appearance, preserving pin preferences and responsive behavior.
- 9c194d5: Use configurable theme-aware footer text colors, defaulting to black in light mode and white in dark mode.
- 007a31d: Match footer text and link states to article colors and use a transparent appearance button with theme-aware icon colors.
- 007a31d: Override the native footer opacity so footer colors render at the same intensity as article colors.
- 007a31d: Remove footer paragraph gaps and leave one text line between the revision and footer body.
- 9c194d5: Align typography, tables, sidebars, responsive media and dark colors with the supplied Vector 2022 styles.
- 9c194d5: Add a grouped main menu with persistent sidebar pinning and responsive dropdown fallback.
- 9c194d5: Render configurable footer Markdown without a separate background, and omit all contents controls on pages without headings.
- 007a31d: Support per-navbox theme colors, render current-page links as text, and add a subtle appearance-button hover background.
- 007a31d: Add configurable MediaWiki-style navigation templates and bottom category bar styling.
- ea299e9: Reduce repeated Git status queries and component construction during page builds. Cache bounded Infobox Markdown output, replace per-scroll heading measurements with layout-invalidated positions and binary search, and release temporary menu cleanup closures promptly. Add reproducible rendering and scrolling benchmarks.
- 007a31d: Hide site headers in article previews and emphasize the search term in the full-search action.
- 9c194d5: Force narrow-screen panels into buttons, add floating contents and relocation hints, and support configurable footer paragraphs and links.
- 9c194d5: Add title/description suggestions with full-search handoff, collapsible left column, page background framing and a revision footer.
- 9c194d5: Keep page widths stable during menu pinning and support graph tools and revision metadata in the site footer.
- 9c194d5: Add configurable logo and grouped navigation, a search form, separate page backgrounds, and consistent main menu controls.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 文章可通过 `infobox` 配置图片、分组字段、Markdown 内容和浅色／深色主题色。
- 目录显示标题层级，超过 28 个章节时默认收起子节，并支持深链接展开父节。
- 增加按滚动方向和标题可见性显示的「页面最顶／页面最底」圆形按钮。
- 增加可复现的渲染基准、Git 查询次数统计和长目录滚动检查，结果见 `PERFORMANCE.md`。

- 通过 Quartz 5 原生插件命令安装并启用 GitHub 来源的皮肤。
- 自动整理标准页面布局，复用原生搜索、探索和图谱。
- 保留其他侧栏组件和未被自定义配置替换的页脚。
- 增加独立站点安装、页面切换、响应式布局和禁用恢复测试。

### Changed

- 探索菜单固定时放到右侧栏，位于外观面板下方。

- 「标准／宽」控制页面是否铺满浏览器；宽版会释放没有固定菜单的侧栏空间。
- 统一下拉菜单阴影，完善搜索焦点反馈、候选键盘选择和 Escape 关闭菜单后的焦点恢复。
- 页头组件按界面语言复用，Infobox Markdown 使用有界缓存。
- Git 工作区状态按构建批次查询，修订时间在 HEAD、文件状态及 mtime 未变化时跨构建复用。
- 目录在布局变化时缓存标题位置，滚动时使用二分查找，减少逐帧几何读取。
- 及时释放菜单提示和悬浮目录的临时清理回调，避免长时间浏览时累积。

- 全站设置改用插件条目的 `options`，无需站点专用适配器。
- 提供英文修订时间和导航模板控件文案。
- 更新安装、迁移、配置和开发文档。
