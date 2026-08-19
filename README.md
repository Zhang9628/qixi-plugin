# Qixi 🌸

> 七夕情人节彩蛋插件 —— 在 DeepSeek Harness 的 AI 会话界面里，藏一份只属于你的浪漫。

**Qixi**（`dsh-qixi`）是一个独立仓库的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件，通过 `dsh plugin add` 一键安装。四个功能合成一个彩蛋合集：**氛围换肤做底子，告白弹幕与藏头情书做隐藏彩蛋，分享卡片做病毒传播钩子**。

---

## ✨ 功能

| 功能 | 触发方式 | 效果 |
|---|---|---|
| 🌸 氛围换肤 | 侧边栏爱心开关 | 粉/玫瑰主题 + 祝福横幅 + Canvas 实时粒子背景（爱心飘浮 + 星光闪烁）+ 分享悬浮球 |
| 💌 告白弹幕 | 输入暗号 `520` | 全屏飘过 10 条浪漫文案（含秦观《鹊桥仙》「金风玉露一相逢」）|
| ✉️ 藏头情书 | 输入暗号 `情书` / `loveletter` | 打字机情书 + 100 句文案库随机生成（含 10 款隐藏款）+ 改写 / 收藏 / 换一句 |
| ✨ 分享卡片 | 悬浮球 / 情书按钮 | Canvas 绘制 1080×1440 卡片，5 套配色主题一键换风格，下载 / 复制 |

> **暗号玩法需先开启「氛围换肤」**——未点击爱心开关时，输入 `520`/`情书` 不会触发任何彩蛋，符合「开启主题后才解锁隐藏玩法」的语义。

### 藏头情书 · 100 句文案库

情书文案从 **100 句**中随机生成，全部为**第一人称「我 → 你」视角**（卡片是发给心爱的人的）：

- **38 句**第一人称古诗词（我住长江头君住长江尾、山有木兮木有枝心悦君兮君不知、思君如满月……）
- **52 句**第一人称原创情话（你是我绕过山河错落、我想和你从七夕到朝夕……）
- **10 句 ✨ 隐藏款**（《诗经·击鼓》《上邪》《鹊桥仙》等经典名句）

抽取概率 90% 普通 / 10% 隐藏款；摇到隐藏款时卡片出现金色描边 + 「✨ 隐藏款」徽章。情书弹窗内点「🎲 换一句」可随机重抽。

### 分享卡片 · 病毒传播设计

- **精美可晒**：5 套配色主题（玫紫星河 / 樱花粉白 / 黛蓝星空 / 赤金复古 / 墨青雅韵），3:4 朋友圈比例
- **个人化**：心里话 + 署名可自定义，人人晒的卡不同
- **闭环拉新**：`#七夕告白` 话题 + 「输入暗号「情书」，领取你的告白」传播钩子，把看卡的人导回 DSH 试彩蛋

---

## 🎮 体验路径

点侧边栏爱心开主题 → 输入框打 `520` 看弹幕 → 打 `情书` 看情书（可「换一句」随机）→ 点「✨ 生成分享卡片」→「🎨 换风格」选配色 → 下载 / 复制发朋友圈。

---

## 📦 安装

```sh
dsh plugin --profile web add dsh-qixi
```

> 需要先有 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 环境。

安装后**重启 dsh**，即可在侧边栏底部看到爱心开关。

---

## 🛠 本地构建

```sh
npm install
npm run build        # tsdown → lib/index.js（host 半）+ lib/client.js（client 半）
npm run typecheck    # tsc --noEmit 类型检查
```

构建产物在 `lib/`。本地调试可直接装目录：

```sh
dsh plugin --profile web add file:/path/to/qixi-plugin
```

> ⚠️ `file:` 依赖有哈希缓存，改代码后若 `dsh plugin add` 提示 `Already up to date`，需手动覆盖：
> ```sh
> cp lib/* ~/.dsh/profiles/web/node_modules/dsh-qixi/lib/
> ```

---

## 📂 源码结构

```
src/index.ts          host 半（function 插件，空 apply）
src/client/index.ts   client 半（换肤 / 弹幕 / 情书 / 分享卡片 / 粒子背景）
cordis.patch.yml      自带 patch，dsh.bundle 自动挂载
tsdown.config.ts      构建配置（host ESM + client ModuleLoader 工厂）
tsconfig.json         类型检查（noEmit）
```

---

## 🧩 技术要点

- **换肤**：用 `theme.overrideTokens` 叠加粉/玫瑰 token 层（浅色 + 深色双套值），不替换主题、不影响用户亮/暗偏好，关掉即恢复
- **粒子背景**：全屏 Canvas + `requestAnimationFrame` 实时合成（24 爱心 + 40 星光），仅主题开启时运行
- **暗号监听**：精确匹配 + 与开关联动，支持清空 / Ctrl+A+X 剪切 / Ctrl+V 粘贴后重新触发
- **卡片绘制**：Canvas2D 按标点智能折行、正文/出处/署名三层分层、5 套配色主题参数化

## 📄 License

[MIT](./LICENSE)
