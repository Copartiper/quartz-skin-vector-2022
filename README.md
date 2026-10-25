# Quartz Vector 2022 Skin

让 Quartz 看起来更像维基百科：顶部搜索、可移入侧栏的菜单、文章目录、外观设置，以及文章底部的导航模板和分类栏。

皮肤适用于 Quartz 5 社区插件系统。中文、英文界面都可以使用，手机上也能阅读。它主要负责页面外观；账户、在线编辑、页面历史等 MediaWiki 后台功能，需要另外实现。

## 已经装好了，想改点东西？

如果你正在维护 `wiki.clytam.net`，通常只需要改两个地方：

- **改全站设置**：打开 `quartz.config.yaml`，找到 `vectorSkin`。
- **改某篇文章**：打开对应的 Markdown 文件，修改开头两条 `---` 之间的属性，或下面的正文。

改好后，在站点目录运行 `npx quartz build`。如果已经开着 `npx quartz build --serve`，保存后会自动重新构建。

`vectorSkin` 是站点的布局适配器读取的配置。新站点需要先接入适配器，单独往 YAML 里加这一段还不会生效。首次安装请看后面的「在新站点中接入」。

## 换站名、标志和主菜单

下面这些设置都放在 `quartz.config.yaml` 的 `vectorSkin` 下。已有这个区块时，请修改里面的内容，不要再新建一个同名区块。

```yaml
vectorSkin:
  locale: zh-CN
  wordmark: 我的知识库
  tagline: 记录、连接、分享
  logoUrl: static/icon.png
  logoAlt: 我的知识库标志
  navigation:
    - label: 首页
      href: index
    - label: 分类索引
      href: tags/
    - section: 参与
      label: 关于本站
      href: about
```

`wordmark` 是顶部站名；不填就使用 Quartz 的 `pageTitle`。`tagline` 是下面的小字。`logoUrl` 是标志图片的路径，留空就不显示图片。

主菜单里，一项就是一个链接：`label` 写显示名称，`href` 写目标页面。加上 `section`，会在这一项前面显示分组标题。提供 `navigation` 后，会替换整个默认菜单，所以首页也要自己写进去。写成 `navigation: []` 则会清空菜单。

链接一般写成 `about` 或 `notes/example`，不用加 `.md`。这种路径从站点根目录开始找，放在不同层级的文章里也能指向同一页。外部链接直接写完整的 `https://...` 地址。菜单不会自动创建页面，请确认目标文章已经存在。

## 调整菜单和阅读外观

主菜单、目录、探索都可以「移至侧栏」，也可以点「隐藏」放回按钮里。左侧从上到下是主菜单、目录、探索。外观面板固定在右侧，隐藏后通过右上角的眼镜按钮打开。

桌面端会保留两侧空间，所以隐藏菜单不会让正文突然左右移动。页面窄于 1120 px 时，四个菜单都改用按钮打开，并取消侧栏留白。没有分节的文章不显示目录；目录入口滚出屏幕后，左上角会出现悬浮目录按钮。

你可以设置访客第一次打开网站时的阅读外观：

```yaml
vectorSkin:
  defaultTheme: auto # auto 跟随系统，也可以填 light 或 dark
  defaultTextSize: standard # small、standard 或 large
  defaultWidth: standard # standard 或 wide
  showAppearance: true
```

浏览器会记住访客自己的选择，之后优先使用这些选择。因此，改了默认设置却没看到变化时，可以先检查浏览器里是否已经选过其他设置。

顶部搜索先给出匹配标题或描述的候选。想搜正文时，点击候选框底部的「搜索包含……的页面」，就会打开 Quartz 原来的全文搜索和页面预览。搜索词会加粗显示，链接预览和搜索预览中会隐藏网站页头，只保留文章内容。

## 写页脚

页脚正文用 Markdown 写，和平时写文章差不多。链接列表单独放在 `footerLinks` 中：

```yaml
vectorSkin:
  revisionTimeZone: Asia/Shanghai
  footerMarkdown: |
    本站文字按 **[许可协议](https://example.org/license)** 提供。

    继续使用本站前，请阅读[使用条款](usage)。
  footerLinks:
    - label: 关于本站
      href: about
    - label: 联系方式
      href: contact
```

正文颜色和链接颜色默认跟随文章配色，页脚没有单独的纯色背景。修订时间显示在页脚正文上方。`wiki.clytam.net` 使用文章最近一次 Git 提交的时间；文章尚未提交时，使用本地文件修改时间，不会把故事里的年代当成修订日期。

需要单独指定页脚文字颜色时，可以加上：

```yaml
footerTextColors:
  light: "var(--qv-fg)"
  dark: "var(--qv-fg)"
```

这里可以填十六进制颜色，也可以使用 `var(--变量名)`。`var(--qv-fg)` 就是正文文字颜色。旧配置 `footerParagraphs` 仍然可用，但同时写了 `footerMarkdown` 时，以 Markdown 为准。

## 给文章加导航模板

导航模板就是文章底部那块分组链接。比如「克莱拓姆协约」模板，可以把地理、组织、历史的相关文章放在一起。

最常用的方式是：**全站写一份模板，多篇文章一起引用。**

先在 `vectorSkin` 下写模板：

```yaml
vectorSkin:
  navigationTemplates:
    - title: "[我的知识库](index)"
      collapsed: false
      color:
        light: "#c5d8ef"
        dark: "#293e57"
      rows:
        - label: 入门
          content: "[简介](about) · [使用方法](guide)"
        - label: 相关页面
          content: "[常见问题](faq) · [联系方式](contact)"
      below: "[分类索引](tags/)"
```

再到要显示它的文章里，加上 `navboxes`：

```yaml
---
title: 使用方法
navboxes: [0]
---
这里是文章正文。
```

`0` 表示配置里的第一个模板，`1` 表示第二个。写成 `navboxes: [0, 1]`，就会按这个顺序显示两个模板。不写 `navboxes` 的文章不会出现模板。

模板里这些字段可以这样理解：

| 字段             | 写什么                                      |
| ---------------- | ------------------------------------------- |
| `title`          | 模板标题，可以带链接                        |
| `collapsed`      | `true` 表示默认收起，`false` 表示默认展开   |
| `color.light`    | 浅色主题下的标题背景色，例如 `"#c5d8ef"`    |
| `color.dark`     | 深色主题下的标题背景色，例如 `"#293e57"`    |
| `rows`           | 每个分组的名称 `label` 和链接内容 `content` |
| `above`、`below` | 分组上方、下方的补充内容，可省略            |
| `links`          | 可选的操作链接，每项填写 `label` 和 `href`  |

分组底色会从标题颜色自动生成，不需要逐块调色。不填颜色时使用默认配色。文字内容支持行内 Markdown；链接指向当前文章时，会自动变成加粗的纯文本，避免点回自己。

只在一篇文章里使用的模板，也可以直接写在文章属性中。完整示例见 [EXAMPLES.md](EXAMPLES.md)。

## 底部的分类从哪里来？

分类沿用 Quartz 原来的标签。文章开头这样写：

```yaml
---
title: 示例文章
tags:
  - 知识
  - 入门
---
```

站点会把它显示成文章底部的「分类：知识｜入门」。没有标签时，分类栏也会隐藏。`wiki.clytam.net` 已经完成这部分接入，直接修改文章标签即可。

## 在新站点中接入

需要 Node.js 22 或更新版本，以及 npm 10.9.2 或更新版本。在插件仓库中构建安装包：

```sh
npm ci
npm run check
npm pack
```

然后进入 Quartz 站点目录安装，路径替换成实际生成的包：

```sh
npm install /absolute/path/quartz-skin-vector-0.1.16.tgz
```

本地安装包已包含构建结果。Git 来源安装则会通过 `prepare` 构建，无需把上游 Vector 仓库复制到站点中。

接下来需要在站点布局中使用 `VectorSkin(options)` 返回的组件。它不是 Markdown 转换器，不要放进 `plugins.transformers`。

| 返回的组件   | 放在哪里、做什么                             |
| ------------ | -------------------------------------------- |
| `header`     | 每页放一次，提供顶部栏，并加载皮肤样式和脚本 |
| `toc`        | 目录面板，需要保留 Quartz 的目录数据转换器   |
| `appearance` | 外观面板                                     |
| `navigation` | 放在 `afterBody`，显示文章选择的导航模板     |
| `revision`   | 放在页脚正文之前，显示 `dates.modified`      |
| `footer`     | 放在站点页脚里，显示 Markdown 正文和链接列表 |

也可以单独导入 `VectorHeader`、`VectorTOC`、`VectorAppearance`、`VectorNavigation`、`VectorRevision`、`VectorFooter`，并给它们传入同一份配置。

接入时还要处理这些地方：

- 保留 Quartz Search 组件和内容索引，并把 `VectorSearchIndex()` 加入 `config.plugins.emitters`，生成顶部候选使用的标题、描述索引。
- 保留目录转换器；没有目录数据的页面会隐藏目录。
- 将原生 TagList 移到 `afterBody` 最后，放进 `.qv-categories` 容器，并加上指向 `tags/` 的「分类：」入口。
- 移除重复的站点标题、主题切换和阅读时长组件，避免同一功能出现两次。
- 在布局适配器中安排目录、探索的按钮与侧栏容器。皮肤依赖标准 Quartz 页面结构，如 `#quartz-body`、`.center` 和 `.sidebar.left/right`。

`wiki.clytam.net/quartz.ts` 是这套站点的实际接入位置。修改其布局前，建议先看 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 开发和检查

```sh
npm run check        # 类型、代码风格和单元测试
npm run build        # 构建插件
npx playwright install chromium # 首次运行浏览器测试前安装
npm run test:browser # 检查布局与交互
```

浏览器测试会在系统临时目录的 `quartz-vector-preview/` 中留下预览和截图。它使用测试页面；安装到实际站点后，还需要在站点目录运行 `npx quartz build` 并查看页面。

## 来源和许可证

布局参考 MediaWiki 的 Vector 2022，并改写为 Quartz 使用的 Preact、SCSS 和浏览器脚本。项目以 **GPL-2.0-or-later** 发布，详见 [LICENSE](LICENSE)、[LICENSE.Vector](LICENSE.Vector) 和 [NOTICE](NOTICE)。原插件模板的 MIT 许可证保留在 [LICENSE.template](LICENSE.template)。

这是独立移植项目，不代表 Wikimedia 或 Quartz 官方，也不附带 Wikipedia 标志。
