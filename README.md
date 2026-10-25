# Quartz Vector 2022 Skin

将 MediaWiki Vector 2022 的布局与排版移植到 Quartz 的组件插件。包含站点页头、主菜单、左侧目录、右侧外观面板、响应式正文、打印样式，以及中文和英文界面。

适用于 Quartz 5 社区插件系统和标准 Quartz 布局 DOM（`#quartz-body`、`.center`、`.sidebar.left/right`）。本插件不是 MediaWiki 运行环境，不提供账户、编辑、历史、语言版本切换等需要后端的功能。未包含 Wikipedia 标志。

## 本地构建与安装

需要 Node.js >= 22、npm >= 10.9.2。

```sh
# 在本仓库
npm ci
npm run build
npm test
npm pack

# 在 Quartz 项目目录，替换为生成包的实际路径
npm install /absolute/path/quartz-skin-vector-0.1.10.tgz
```

包名为 `quartz-skin-vector`，当前仓库尚未发布到 npm。`npm pack` 会自动构建；Git 来源安装通过 `prepare` 构建。不需要将上游 `mediawiki-skins-Vector/` 复制到站点中。

## 布局接入

在 `quartz.layout.ts` 中导入组件，保留站点已有的 `Head`、正文标题、元数据和页脚配置。示例展示需要替换的布局槽位：

```ts
import { VectorSkin } from "quartz-skin-vector";
import * as Component from "./quartz/components";

const vector = VectorSkin({
  locale: "zh-CN",
  wordmark: "知识百科",
  tagline: "自由的知识花园",
  navigation: [
    { label: "首页", href: "/" },
    { label: "关于", href: "/about" },
  ],
});

// 将下列字段合并到已有的 contentPage 和 listPage 布局中。
// VectorHeader 必须每页恰好安装一次；同时替换旧 PageTitle、TOC、Darkmode。
const vectorSlots = {
  header: [],
  beforeBody: [vector.header, Component.ArticleTitle(), Component.ContentMeta()],
  left: [vector.toc, Component.Search()],
  right: [vector.appearance],
};

// 示例：export const contentPage = { ...existingContentPage, ...vectorSlots }
// 列表页也应采用相同的 vectorSlots；没有章节的页面仍可正常渲染。
```

`VectorSkin()` 返回一组组件供布局使用，不是 transformer，不要放进 `plugins.transformers`。也可以分别导入 `VectorHeader(options)`、`VectorTOC(options)`、`VectorAppearance(options)`；三个组件应使用相同参数。样式和浏览器脚本由 `VectorHeader` 注入。

`package.json` 的 `quartz.components` 提供自动发现信息，默认槽位为 `beforeBody` / `left` / `right`。不同宿主的配置文件格式可能不同；直接布局接入如上所示。

目录数据来自 Quartz 的 `fileData.toc`：请保留 `Plugin.TableOfContents()` transformer。没有该 transformer 时目录只显示“序言”。页头搜索入口调用已有 Quartz Search 的按钮，需要在布局中保留 `Component.Search()`，以及 Quartz 默认内容索引 emitter。未安装 Search 时，脚本会隐藏页头搜索入口。

站点部署在子路径时，默认首页链接会按当前 slug 计算相对路径。`navigation.href`、`logoUrl` 的普通相对路径从站点根目录解析；绝对 URL、`/`、`#`、`./` 和 `../` 开头的路径原样保留。`homeUrl` 原样使用。

## 配置选项

| 选项              | 默认值       | 说明                                                                                |
| ----------------- | ------------ | ----------------------------------------------------------------------------------- |
| `locale`          | `"auto"`     | `auto` 使用 Quartz locale；支持 `en-US`、`zh-CN`，其他语言回退英文，`zh-*` 使用中文 |
| `wordmark`        | `""`         | 空值使用 Quartz `pageTitle`，再回退 `Quartz`                                        |
| `tagline`         | `""`         | 空值使用本地化的站点副标题                                                          |
| `homeUrl`         | `""`         | 空值自动计算站点根目录；支持相对路径及 HTTP(S)                                      |
| `defaultTheme`    | `"auto"`     | `auto` / `light` / `dark`                                                           |
| `defaultTextSize` | `"standard"` | `small` / `standard` / `large`（14 / 16 / 18 px 的默认浏览器字号）                  |
| `defaultWidth`    | `"standard"` | `standard` 正文上限 948 px；`wide` 填满可用中栏                                     |
| `showAppearance`  | `true`       | 是否渲染外观面板                                                                    |
| `navigation`      | `[]`         | 主菜单链接数组，格式 `{ label: string, href: string }[]`                            |

访客设置保存在本站 localStorage 的 `quartz-vector-*` 键中，优先于默认值。禁止存储时本次页面仍可切换。自动配色会跟随系统变化，并通过 Quartz 的 `saved-theme` 和 `themechange` 事件同步其他组件。建议移除原有 Darkmode 组件，避免两个主题控件同时管理设置。

大屏采用三栏；1120 px 以下外观面板移至正文下方，800 px 以下目录和正文顺序排列。菜单和目录使用原生 details，可键盘操作。无 JavaScript 时保留正文样式、目录链接、主菜单和默认外观；偏好切换、跳转正文锚点与目录高亮由脚本初始化。使用现代浏览器（CSS `:has()`）。不支持旧版浏览器和完全改写标准 DOM 的自定义布局。

## 开发与验证

```sh
npm run typecheck
npm test
npm run build
# 首次安装浏览器后运行集成检查
npx playwright install chromium
npm run test:browser
```

浏览器测试使用标准 Quartz 页面结构的独立 fixture，检查 1440 / 1024 / 390 px 布局、设置持久化、跟随系统配色、Quartz 搜索触发与 nav/render 重初始化，预览 HTML 和截图写入系统临时目录 `quartz-vector-preview/`。这不等同于在完整 Quartz 站点中执行端到端构建；接入具体站点后仍需运行其构建与检查。

## 来源与许可证

参考仓库中提供的 `mediawiki-skins-Vector`，主要对应 `skin.mustache`、`variables.less`、`layouts/grid.less`、`typography.less`，将 Mustache / LESS / MediaWiki 依赖改写为 Preact / SCSS / Quartz 浏览器脚本。保留 Vector 2022 的 1596 px 页面容器、948 px 正文上限、侧栏、衬线标题与内容排版。

移植版以 **GPL-2.0-or-later** 交付，见 `LICENSE` / `LICENSE.Vector` 和 `NOTICE`；npm 包同时包含可重建的源码与构建配置；依赖锁文件保留在仓库中。原始 Quartz 插件模板的 MIT 许可证保存在 `LICENSE.template`。这是独立移植项目，不代表 Wikimedia 或 Quartz 官方。

主菜单支持「移至侧栏」与「隐藏」，选择保存在浏览器本地；小于 1120px 时自动使用弹出菜单。默认按首页、分类索引、特色内容、新闻动态、随机条目、联络我们、关于站点及贡献分组显示。`navigation` 提供时替换整个菜单（包括首页），空数组显示空菜单。分类索引指向 `tags/`，其余默认链接指向对应中文页面（关于站点指向 `关于`），需要在站点中创建页面或配置真实链接；静态站点不提供 MediaWiki 的最近更改、特殊页面后台功能。

`logoUrl` 配置标题左侧图片，空值隐藏；`logoAlt` 配置替代文本。`navigation` 项目可带 `section`，在该项上方显示分组标题。站点可在 `quartz.config.yaml` 顶层添加 `vectorSkin`，由布局适配器传入 `VectorSkin`：

```yaml
vectorSkin:
  locale: zh-CN
  logoUrl: static/icon.png
  logoAlt: 站点标志
  tagline: 自定义副标题
  navigation:
    - label: 首页
      href: index
    - label: 分类索引
      href: tags/
    - section: 贡献
      label: 帮助
      href: 帮助
```

顶部搜索表单会将输入词传给 Quartz Search；必须保留 Search 组件及其资源，皮肤隐藏其原始侧栏按钮。

`VectorSearchIndex()` 发射器输出 `static/vector-search.json`（仅标题、描述、slug），请加入 `config.plugins.emitters`；顶部候选不会搜索正文，底部操作再打开 Quartz 原生全文搜索及预览。`VectorSkin().revision` 可放在 `afterBody`，读取 `dates.modified`，通过 `revisionTimeZone`（默认 `Asia/Shanghai`）格式化修订时间；没有修改日期时不显示。

外观面板通过「隐藏」移到顶栏右上角，展开后可「移至侧栏」恢复。目录和探索的面板同样支持固定到左侧，顺序为主菜单、目录、探索。目录未固定时使用文章标题左侧的三横杠入口；侧栏隐藏后正文位置和宽度保持不变。选择存储在浏览器本地，小屏幕使用弹出面板。

Footer content can be configured with `footerParagraphs` (arrays of text segments
with `text`, optional `href`, and optional `bold`) and `footerLinks` (objects
with `label` and `href`). Render `VectorSkin(options).footer` inside your footer
after the revision component. URLs are validated and text is escaped.
Narrow screens (below 1120px) always use menu buttons without sidebar tracks,
while preserving desktop docking preferences. A floating contents button appears
when its regular entry leaves the viewport.

Use `footerMarkdown: |` in `vectorSkin` to write footer body text in Markdown,
including bold text, paragraphs, and links. It takes precedence over the older
`footerParagraphs` field. Raw HTML is escaped, and relative links resolve from
the site root. Pages without headings omit the entire contents menu.

Footer text follows the active theme. Configure `footerTextColors.light`
(default `"#000000"`) and `footerTextColors.dark` (default `"#ffffff"`).
Each accepts a hex color or a CSS theme variable such as `var(--qv-fg)`.
Links keep their separate link colors.
