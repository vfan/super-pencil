# Super Pencil

一款用于技术演示的屏幕批注工具。启动后覆盖一层透明玻璃在整个屏幕上，可以在上面画图标注，也可以一键切回编码操作底层应用。

## 安装

### 从源码构建

需要 Go 1.23+、Node.js 18+、[Wails CLI v2](https://wails.io/docs/gettingstarted/installation)。

```bash
# 安装 Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 克隆项目
git clone <repo-url> && cd super-pencil

# 开发模式
wails dev

# 打包
wails build -platform darwin/arm64
```

产物位于 `build/bin/super-pencil.app`，可拖入 `/Applications/` 使用。

## 权限

首次启动会弹出 **辅助功能权限** 申请。请在 **系统设置 > 隐私与安全性 > 辅助功能** 中允许 Super Pencil，否则全局快捷键无法在其他应用聚焦时生效。

## 使用方式

### 两种模式

| 模式 | 说明 |
|------|------|
| **画图模式** | 默认模式。屏幕顶部显示工具栏，鼠标可在屏幕上绘制批注 |
| **穿透模式** | 鼠标穿透到底层桌面，可正常操作 IDE、终端等应用。已有批注自动清除 |

### 快捷键

| 快捷键 | 作用 |
|--------|------|
| **双击左 Ctrl** | 在画图模式与穿透模式之间切换 |
| **单击左 Ctrl** | 画图模式下清除所有批注 |
| **左 / 右箭头** | 画图模式下切换工具（画笔 → 矩形 → 圆形 → 箭头 → 橡皮） |
| **Cmd + Z** | 撤销上一笔 |

### 工具栏

画图模式下，屏幕顶部居中显示工具栏：

- **画笔** — 自由绘制
- **矩形** — 拖拽绘制矩形框
- **圆形** — 拖拽绘制椭圆
- **箭头** — 拖拽绘制箭头
- **橡皮** — 擦除已有内容
- **颜色** — 红 / 蓝 / 绿 / 黄 / 白 五种颜色可选
- **撤销 / 清屏** — 撤销最后一笔 / 清除全部

## 技术栈

- **Wails v2** — Go + WebView 桌面应用框架
- **Go** — 全局键盘监听（NSEvent）、窗口穿透控制（NSWindow）
- **HTML5 Canvas** — 图形渲染
- **Vite** — 前端构建
