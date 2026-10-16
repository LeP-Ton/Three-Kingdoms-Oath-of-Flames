# 三国志·烈火之誓

## 项目定位与技术选型

- 浏览器回合制战棋：玩家扮演未来穿越者玄霄，使用科技装备与直属部队，协助刘备阵营。
- React 19、TypeScript、Vite、Tailwind CSS；Canvas 绘制地图与像素单位；Web Audio 播放音效。
- 历史主线以《三国演义》为准：名将保持自身阵营、性格与主要命运；科技影响局部任务，不改写关键结局。

## 核心架构与目录

- `src/App.tsx`：战役进度、整备、对话、玩家／友军／敌军阶段与结算。
- `src/data/`：人物、装备、战役与战功军职配置。
- `src/game/`：寻路、战斗计算、自主行动与科技能力规则。
- `src/components/`：整备、地图、交锋、存档与游戏内说明。
- `src/graphics/`、`src/assets/`、`src/audio/`：图像资源、像素绘制与音频。

## 运行与验证

- 安装依赖：`npm install`。
- 本地运行：`npm run dev`（默认 3000 端口）。
- 类型检查：`npm run lint`；生产构建：`npm run build`。
- 规则回归：`npm run test:rules`。
- 存档存放于浏览器 localStorage；新剧情使用独立版本，避免混入旧版可控名将队伍。

## 检索方法

依次读取 `AGENTS.md` → `.agentdocs/index.md` → 与任务直接相关的 workflow 文档 → 定向检索源码。不要全量扫描 workflow。

## 重要开发规范

- 沟通、文档与新增代码注释使用中文。
- 开始代码任务前检查 Git 分支及工作区，保护已有修改。
- 每次代码任务在 `.agentdocs/workflow/` 创建 `YYYYMMDDHHmmss-简短描述.md`，相关修改合并记录，并更新根索引。
- 文档说明原因、影响、风险与验证；精确代码历史交由 Git。
- 只有项目级稳定认知变化才更新本文件；具体需求与普通修复写入 workflow。
- 直属部队可由玩家操控；历史名将仅作为关卡友军自主行动，不能通过招募进入直属部队。
