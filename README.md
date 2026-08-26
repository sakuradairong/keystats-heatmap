# KeyStats 键盘热力图

将 [KeyStats](https://github.com/debugtheworldbot/keyStats) 导出的 JSON 转换为可交互的 3D 键盘热力图。颜色深浅和键帽高度共同表示按键频次，日期、总次数与高频键用于提供当天的阅读上下文。

## 本地运行

需要 Node.js 20.9 或更新版本。

```bash
npm ci
npm run dev
```

打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

## 使用你的数据

1. 在 KeyStats Windows 中导出统计数据。
2. 打开应用，点击「导入 JSON」。
3. 使用日期选择器切换 `history` 中的任意一天。

也支持直接导入 `%LOCALAPPDATA%\KeyStats\daily_stats.json` 或 `history.json`。文件只在当前浏览器中读取和标准化，不会上传到服务器；与键盘热力图无关的应用、鼠标、滚动和峰值字段会被丢弃。

## 公共数据与隐私

- `public/keystats-public.json` 保留了用于演示的真实键盘频次，但只包含 `date`、`keyPresses` 和 `keyPressCounts`。
- `public/sample-keystats.json` 是备用示例，同样只包含键盘字段。
- 请不要将个人原始 `KeyStats-Export-*.json`、`daily_stats.json` 或 `history.json` 提交到仓库；`.gitignore` 已包含这些文件名。
- 过去提交中曾出现的文件不会因为普通删除而从 Git 历史中消失。清理历史需要单独评估并协调执行。

## 功能

- 全尺寸 ANSI 104 键布局（功能键、导航区、小键盘）
- 支持完整导出、单日统计和历史映射三种输入结构
- 组合键拆分计入，例如 `Ctrl+C` 同时影响 Ctrl 与 C
- 中性未使用状态与单色暖调频次梯度
- 颜色与物理键帽高度双重编码
- 鼠标、键盘焦点和触控提示
- 桌面三维舞台与移动端横向浏览模式
- 尊重 `prefers-reduced-motion` 和强制颜色模式

## 质量检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
