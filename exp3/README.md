# 星尘遗迹 · 异步寻宝

![星尘遗迹通关画面](./preview.webp)

一个用 **async/await** 驱动的互动式寻宝动画。机械萤火虫「小烛」带来一张缺角的星图，玩家将穿越风之回廊、唤醒石像守门人，在月影湖取得钥匙，最终找到真正的宝藏——「星之种」。

## 在线体验

- 网页：<https://asuka060108.github.io/quanzhan-kaifa/>
- 仓库：<https://github.com/asuka060108/quanzhan-kaifa>

## 故事章节

1. **潮汐邮差**：小烛送来缺角的黄铜星图。
2. **失落的星座**：转动星图外环，补全「风之回廊」的坐标。
3. **风之回廊**：随机遇到顺风或逆风，越过断桥抵达第三浮岛。
4. **沉睡的守门人**：回答石像的谜题，打开月影神庙。
5. **月影湖**：小烛潜入倒悬的湖面，衔回星辉钥匙。
6. **星之种**：打开石匣，让熄灭百年的灯塔重新点亮。

## 功能亮点

- 6 个章节的完整寻宝剧情，新的故事线和角色设定；
- `async/await` 顺序驱动整个寻宝过程；
- 打字机式剧情文字、章节进度条、航海日志；
- 机械萤火虫沿 SVG 路径移动；
- 星空 Canvas：闪烁星点、流星、结局金色粒子；
- 星座连线、观星台亮灯、风之回廊、神庙符文、宝箱开启动画；
- 顺风 / 逆风随机分支，两条分支都会完成故事；
- 支持桌面和移动端，适配 `prefers-reduced-motion`；
- 无第三方依赖，所有资源本地化，可直接静态托管。

## 文件结构

```text
exp3/
├── index.html          # 页面结构、SVG 场景
├── style.css           # 视觉、布局和动画
├── treasure-async.js   # 寻宝故事数据层：Promise + async/await
├── app.js              # 页面动画、打字机、Canvas 星空、流程编排
├── treasure.js         # 原始 Promise.then() 版本（保留作对比）
├── preview.webp        # 通关画面预览
└── README.md           # 本说明
```

## 本地运行

直接双击 `index.html` 即可。页面没有使用 ES Module，因此 `file://` 方式也能正常运行。

也可以启动一个本地静态服务器：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

## 核心异步设计

`treasure-async.js` 中先封装一个基于 `Promise + setTimeout` 的等待函数：

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

每个寻宝步骤都是一个 `async` 静态方法：

```js
static async getInitialClue() {
  await wait(1150);
  return { /* 章节内容 */ };
}

static async decodeAncientScript(clue) {
  await wait(1450);
  return { /* 章节内容 */ };
}
```

主流程用 `await` 按顺序推进，避免 Promise 链式 `.then()` 的嵌套：

```js
const clue = await TreasureMap.getInitialClue();
await showChapter(clue);

const location = await TreasureMap.decodeAncientScript(clue);
await showChapter(location);

const crossing = await TreasureMap.crossWindCorridor(location);
await showChapter(crossing);

const guardian = await TreasureMap.wakeGuardian();
await showChapter(guardian);

const key = await TreasureMap.findMoonKey();
await showChapter(key);

const treasure = await TreasureMap.openTreasureBox();
await showChapter(treasure);
```

### 与原始 `treasure.js` 的对比

| 对比项 | 原始版本 | 本版本 |
| --- | --- | --- |
| 异步写法 | `Promise.then()` 链式调用 | `async/await` |
| 流程可读性 | 需要顺着 `.then()` 阅读 | 接近同步代码，顺序清晰 |
| 错误处理 | 末尾统一 `.catch()` | `try/catch` 包裹完整流程 |
| 剧情 | 图书馆 → 神庙 → 宝箱 | 星图 → 风之回廊 → 神庙 → 月影湖 → 星之种 |
| 交互 | 控制台文字 | 动画页面、进度、日志、按钮 |
| 随机事件 | 神庙守卫 50% 失败 | 顺风 / 逆风随机分支，均能完成故事 |

## 实现说明

- `TreasureMap` 只负责“异步返回章节数据”，不直接操作 DOM；
- `app.js` 负责把章节数据渲染成动画，并将 `await` 的等待过程可视化；
- 页面使用 `requestAnimationFrame` 绘制 Canvas 星空和萤火虫补间；
- SVG 场景通过 CSS 状态类（`has-constellation`、`has-wind`、`has-temple`、`has-key`、`has-finale`）逐章点亮；
- 点击“重新体验”会重置场景和进度，再次执行同一条异步流程。
