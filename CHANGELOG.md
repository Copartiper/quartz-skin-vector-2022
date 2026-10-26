# Changelog

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
