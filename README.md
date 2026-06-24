# eg-onelook（二阶训练项目）

本项目当前包含三部分，请注意区分：

1. `src/util/*`：two-tool 的核心求解/状态逻辑（参考与复用）
2. `cstimer/*`：cstimer 源码镜像（仅参考，不参与当前 React 训练页编译）
3. `src/trainer/*`：本项目新增的独立训练系统（当前主要运行入口）

---

## 一、环境要求

- Node.js >= 18
- npm >= 9
- 推荐系统：Windows / macOS / Linux

---

## 二、安装与启动

在项目根目录（`eg-onelook`）执行：

```bash
npm install
npm start
```
启动后打开：
- http://localhost:3000

如果 3000 端口占用，按提示切换端口即可。

---

## 三、当前训练系统功能

训练入口：`src/App.js -> src/trainer/TrainerPage.js`

### 支持能力

- 选择方法组：`EG / TCLL / LS`
- 选择子类（例如 `EG-1`, `TCLL+`, `LS1...LS9`）
- 选择公式 case（可扩展）
- 选择做底预设或输入自定义做底
- 一键生成训练打乱
- 支持“末尾强制 +R”兜底模式
- 空格键计时（开始/停止）
- 成绩记录与 PB
- 显示打乱后的六面颜色 2D 状态图（U/D/F/B/L/R）

---

## 四、训练打乱生成原理

核心公式：


$$\text{Scramble} = (\text{Setup} \cdot \text{Base} \cdot \text{Alg} \cdot \text{AUF})^{-1}$$

实现文件：

- `src/trainer/algTools.js`
- `src/trainer/trainingGenerator.js`

其中 AUF 默认随机取 `'' / U / U' / U2`。

---

## 五、目录结构（关键）
```
xt
src/
  App.js
  App.css
  util/                  # two-tool 求解相关
  trainer/               # 独立训练系统
    TrainerPage.js
    Cube2DView.js
    algTools.js
    caseLibrary.js
    trainingGenerator.js
```
---

## 六、如何新增你的公式库

编辑文件：

- `src/trainer/caseLibrary.js`

例如给 `EG-1` 增加一个 case：
s
'EG-1': [
  { name: 'EG1-basic-1', alg: "R U R' U R U2 R'" },
  { name: 'EG1-new', alg: "你的公式" }
]---

## 七、常见问题

### 1) 报错：`Relative imports outside of src are not supported`
说明你用了类似 `../util/...` 从 `src` 外部导入。  
请确保所有 import 都在 `src/` 内，当前推荐入口是：

- `src/App.js` 只导入 `./trainer/TrainerPage`

### 2) 页面空白 / 生成不了打乱
先检查浏览器控制台和终端报错；再确认 `caseLibrary` 中当前子类有可用公式。

### 3) 想保留 two-tool/cstimer 但不冲突
可以保留目录，不要在 `src/App.js` 直接引用 `cstimer/*` 内容即可。

---

## 八、后续建议

- 用真实 EG/TCLL/LS 大公式库替换示例 case
- 增加按 subset 精确筛选
- 加入 `two-tool` 校验（生成后验证命中目标 method）
- 增加 3D twisty 可视化（当前为 2D 六面图）