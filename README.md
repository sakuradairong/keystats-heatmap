# KeyStats 键盘热力图

把 [KeyStats](https://github.com/debugtheworldbot/keyStats) 导出的 JSON 渲染成等轴测 3D 键盘热力图：冷蓝表示低频，暖橙表示高频，键帽上同时显示键名与次数。

## 本地运行

```bash
npm install
npm run dev -- --port 43123
```

打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

## 使用你的数据

1. 在 KeyStats Windows 中导出统计数据（例如 `KeyStats-Export-2026-08-25.json`）
2. 打开本应用，点击右上角「导入 KeyStats JSON」
3. 用顶部日期选择器切换 `history` 中的任意一天

也支持直接导入 `%LOCALAPPDATA%\KeyStats\daily_stats.json` 或 `history.json`。

## 功能

- 全尺寸 104 键布局（含功能键、导航区、小键盘）
- 组合键拆分计入（如 `Ctrl+C` → Ctrl 与 C）
- 悬停查看单键次数
- 蓝→黄→橙热力色阶，贴近常见 KeyStats 可视化风格

默认加载 `public/sample-keystats.json` 作为演示数据。
