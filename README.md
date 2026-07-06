# One-Look Trainer（二阶训练项目）

基于 React 的二阶魔方 EG/TCLL/LS 训练系统，支持自定义做底、公式筛选与计时练习。

> **原始项目参考**：[WACWCA/two-tool](https://github.com/WACWCA/two-tool) — 本项目在其求解器基础上重写为二阶训练系统。

---

## 一、环境要求

- Node.js >= 18
- npm >= 9

---

## 二、安装与启动

```bash
npm install
npm start
```

启动后打开 http://localhost:3000。

---

## 三、功能概览

### 训练配置
- **方法组**：EG / TCLL / LS
- **子类**：EG-1、EG-2、LEG-1、CLL / TCLL+、TCLL- / LS1~LS9
- **公式选择**：弹窗多选，支持全局全选/取消、分组全选/取消
- **做底预设**：33 个预设（含空底），分 7 个类别，支持多选后随机抽取，VisualCube 3D 预览图

### 打乱生成
- 基于 `Scramble = (Setup · Base · Alg · AUF)^-1` 生成训练打乱
- 支持自定义做底、魔方朝向选择

### 计时
- 空格键：按住准备 / 松开开跑 / 运行中停止
- 可选 15s 观察阶段
- 成绩记录与 PB 显示

### 可视化
- 六面 2D 颜色状态图
- 做底预设 2x2 3D 预览图（VisualCube API 生成）

---

## 四、数据规模

- 公式库：773 条（CLL 42 条，EG-1 42 条，EG-2 42 条，LEG-1 18 条，TCLL+ 43 条，TCLL- 42 条，LS1~LS9 共 544 条）
- 做底预设：33 个，分为基础、顶层不动块bar、顶层不动块not bar、简单不动块、TCLLbar+平移、棋盘顶层bar、底层/顶层bar 共 7 类

---

## 五、目录结构

```
src/
  App.js
  App.css
  util/                     # two-tool 求解相关
  trainer/                  # 训练系统
    TrainerPage.js          # 主训练页面
    Cube2DView.js           # 六面 2D 颜色图
    caseLibrary.js          # 公式库 + 做底预设
    trainingGenerator.js    # 打乱生成器
scripts/
  downloadBaseImages.mjs    # 做底图片批量下载
public/
  case-images/
    bases/                  # 做底预设 VisualCube 3D 图片
    EG/ TCLL/ LS/           # 公式 case 图片
```

---

## 六、新增公式

编辑 `src/trainer/caseLibrary.js`：

```js
'EG-1': [
  { name: 'Sune', subcase: 0, alg: "R U R' U R U2 R'" },
  { name: '新公式', subcase: 1, alg: "你的公式" }
]
```

新增做底预设同样编辑该文件中的 `BASE_PRESETS` 数组。

---

## 七、生成做底图片

```bash
node scripts/downloadBaseImages.mjs
```

图片通过 `algs.cuber.pro/visualcube/visualcube.php` 生成，参数：`pzl=2`, `r=y45x-34`（2x2 3D 透视）。

---

## 八、常见问题

### 页面空白 / 生成不了打乱
检查浏览器控制台和终端报错，确认 `caseLibrary` 中当前子类有可用公式。

### Relative imports outside of src are not supported
所有 import 必须在 `src/` 内，入口为 `src/App.js` → `./trainer/TrainerPage`。
