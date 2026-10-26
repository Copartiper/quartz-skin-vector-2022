# 配置示例

下面的例子可以按需要复制。除文章示例外，全站设置都放在 `quartz.config.yaml` 中本插件的 `options` 下；插件条目已经存在时，合并里面的字段即可，保留其他插件。

## 给条目写一张资料卡

下面是一篇地点条目，可以直接作为新文章的起点。将图片和链接换成自己站点已有的文件与页面：

```markdown
---
title: 示例城市
infobox:
  title: 示例城市
  subtitle: Example City
  image: images/example-city.jpg
  imageAlt: 示例城市全景
  caption: 从山顶看到的城市
  color:
    light: "#c5d8ef"
    dark: "#293e57"
  rows:
    - heading: 基本资料
    - label: 所属地区
      content: "[示例地区](places/example-region)"
    - label: 别称
      content: 山间之城
    - heading: 地理
    - label: 地形
      content: 山地与河谷
  below: "参阅[地点索引](places/)"
tags: [地点]
---

示例城市是一座位于河谷中的城市。

## 概况

这里继续写城市的介绍。
```

`heading` 是卡片里的分组标题，`label` 和 `content` 是一项资料的名称与内容。图片和普通相对链接从站点根目录解析。桌面上正文会环绕卡片；手机上卡片排在正文前面。

## 默认使用宽版页面

在插件选项里设置：

```yaml
plugins:
  - source: github:Copartiper/quartz-skin-vector-2022
    enabled: true
    options:
      defaultWidth: wide
```

宽版会让页面铺满浏览器，并释放空侧栏的空间。改回 `standard` 则恢复限宽、保留两侧栏位。读者在外观面板里选择过宽度后，浏览器保存的选择优先于站点默认值。

右下角的圆形按钮用于跳到页面顶部或底部，不用于切换宽度；只有向下滚动且页面标题不可见时才出现。

## 两个模板，多篇文章共用

比如，网站里有一组入门文章和一组参考资料。先把两组链接写在配置里：

```yaml
plugins:
  - source: github:Copartiper/quartz-skin-vector-2022
    enabled: true
    options:
      navigationTemplates:
        # 第一个模板，编号是 0。
        - title: 入门指南
          collapsed: false
          color:
            light: "#c5d8ef"
            dark: "#293e57"
          rows:
            - label: 开始使用
              content: "[简介](about) · [安装](guide/install) · [常见问题](faq)"
          below: "[回到首页](index)"

        # 第二个模板，编号是 1。
        - title: 参考资料
          collapsed: true
          color:
            light: "#ddc5e4"
            dark: "#4a3052"
          rows:
            - label: 文档
              content: "[配置说明](reference/config) · [术语表](reference/glossary)"
```

然后在文章开头引用：

```markdown
---
title: 安装
navboxes: [0, 1]
tags:
  - 指南
---

这里开始写正文。
```

这篇文章底部会先显示展开的「入门指南」，再显示收起的「参考资料」，最后是「分类：指南」。如果「安装」链接指向当前页，它会显示成加粗文字。

这些地址只是示例，记得换成自己站点里已有的文章路径。调整模板顺序后，文章里的编号也要一起检查。

## 只给一篇文章写模板

不想动全站配置时，可以直接把模板放进文章开头：

```markdown
---
title: 阅读计划
navboxes:
  - title: 我的阅读清单
    collapsed: false
    color:
      light: "#d5e8d4"
      dark: "#29452e"
    above: "从这里开始，按自己的节奏阅读。"
    rows:
      - label: 基础
        content: "[第一篇](reading/one) · [第二篇](reading/two)"
      - label: 进阶
        content: "[第三篇](reading/three) · **待补充**"
    below: "[全部阅读笔记](reading/)"
---

这里开始写正文。
```

全站模板编号和文章内的模板也可以混用：在 `navboxes` 列表里先写 `- 0`，再写 `- title: ...` 即可。

## 给模板加操作链接

如果有真正的模板说明页或编辑地址，可以加入 `links`：

```yaml
links:
  - label: 查看说明
    href: templates/reading
  - label: 编辑
    href: https://example.org/edit-template
```

把它放在模板的 `title`、`rows` 同一层。没配置就不显示，也不会生成没有目标的「查、论、编」链接。

## 改页脚文字

`|` 后面缩进的内容就是 Markdown 正文。空一行表示新段落：

```yaml
plugins:
  - source: github:Copartiper/quartz-skin-vector-2022
    enabled: true
    options:
      footerMarkdown: |
        欢迎使用我的知识库。

        本站内容按 **[许可协议](https://example.org/license)** 提供。
        有问题可以[联系我](contact)。
      footerLinks:
        - label: 关于
          href: about
        - label: 使用条款
          href: usage
```

页脚支持 Markdown 的链接和加粗。直接写 HTML 标签会显示为文字，不会执行。
