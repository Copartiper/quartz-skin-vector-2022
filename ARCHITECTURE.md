# 开发说明

这份文档给需要改代码的人看。如果只是换菜单、页脚或导航模板，先看 [README](README.md) 和 [配置示例](EXAMPLES.md) 就够了。

## 先找到要改的文件

| 想改什么                                | 从哪里开始                                                |
| --------------------------------------- | --------------------------------------------------------- |
| 页头、目录、外观、页脚、导航模板的 HTML | `src/components/VectorSkin.tsx`                           |
| 颜色、字号、间距、响应式布局            | `src/components/styles/vector.scss`                       |
| 菜单固定、悬浮目录、搜索候选等交互      | `src/components/scripts/vector.inline.ts`                 |
| 顶部候选的筛选与排序                    | `src/search-suggestions.ts`                               |
| 搜索候选需要的数据文件                  | `src/search-index.ts`                                     |
| 配置类型、默认值、链接检查              | `src/types.ts`、`src/vector-options.ts`                   |
| 界面翻译                                | `src/i18n/`                                               |
| 对外导出和插件发现信息                  | `src/index.ts`、`src/components/index.ts`、`package.json` |

仓库里还保留着早期模板的 transformer、filter、emitter 示例。它们不是 Vector 皮肤的主要入口，修改皮肤通常不需要动它们。

## 插件和站点各管哪一部分？

插件负责组件、样式和交互；站点负责把组件放进布局，以及提供配置和文章数据。

`VectorSkin(options)` 会创建一组使用相同设置的组件。`header` 附带整套皮肤样式和浏览器脚本，因此每页需要加载一次。导航模板从文章属性 `navboxes` 读取选择，再从配置 `navigationTemplates` 找到对应模板。

在 `wiki.clytam.net` 中，`quartz.ts` 负责读取 YAML、安排菜单和侧栏、替换原生页脚，并把导航模板和分类栏放在正文之后。Git 修订时间也在这里计算。`quartz.config.yaml` 负责开关组件、设置站点文字和定义共享模板。

所以，改了插件却没影响到页面时，可以按顺序检查：是否重新打包、站点是否安装了新包、布局是否使用了相应组件、站点是否重新构建。

## 样式和脚本怎样进入页面？

构建时，SCSS 会编译为 CSS 字符串，`.inline.ts` 会打包为浏览器脚本字符串。Quartz 再通过组件的资源字段把它们写入页面。

皮肤用 `--qv-*` CSS 变量管理配色。深色主题既可以手动选择，也可以跟随系统。导航模板的 `color.light` 和 `color.dark` 会写成模板自身的 CSS 变量，分组底色由标题背景色派生。

浏览器脚本会在 Quartz 页面导航后重新初始化交互，并清理旧的监听器。新增事件或观察器时，也要处理清理，避免切换几篇文章后同一个动作执行多次。

## 内容和链接怎样处理？

页脚和导航模板使用 Marked 渲染 Markdown。原始 HTML 会转义，链接经过 `safeUrl` 检查。导航模板中的当前页链接在渲染时改为加粗文字。

普通相对链接按站点根目录解析；以 `/`、`#`、`./`、`../` 或 HTTP(S) 开头的地址保留其含义。新增可填写链接的字段时，也应沿用这个规则。

## 改完后怎么验证？

先在插件仓库运行：

```sh
npm run check
npm run test:browser
npm pack
```

然后进入实际站点，安装新包并构建：

```sh
npm install ./plugins/quartz-skin-vector-版本号.tgz
npx quartz build
```

单元测试覆盖配置和渲染逻辑，浏览器测试检查测试页面中的布局和交互。实际站点还可能有自己的组件和样式，所以最后仍需查看桌面、窄屏、深色主题和页面切换。

`dist/` 是构建结果，不要手动修改。运行时需要共享实例的依赖由构建配置保留为外部依赖，新增依赖前请检查 `tsup.config.ts` 中的规则。
