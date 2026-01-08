# SmartGrader v2.0

智能阅卷系统 - AI驱动的试卷批改与作业辅导工具

> **🎉 v2.0 重大更新**：支持双 AI 引擎、优化图片压缩、智能语言匹配、错题详细分析  
> 查看完整更新日志：[CHANGELOG.md](./CHANGELOG.md)

## ✨ 功能特性

### 🎯 核心功能

- **📝 试卷批改** - AI 自动识别题目、判分、标注，生成详细错题分析
- **🔍 文字识别 (OCR)** - 精确提取图片中的文字内容，支持批量处理
- **🎓 作业辅导** - AI 老师逐步引导解题，提供详细的解题思路

### 🚀 v2.0 新特性

- ✅ **双 AI 引擎支持**
  - Google Gemini (2.0 Flash / 1.5 Pro)
  - 阿里通义千问 (Qwen VL Plus)
  - 自动切换和回退机制

- ✅ **智能语言匹配**
  - 中文试卷 → 纯中文分析
  - 英文试卷 → 英文原文 + 中文注释
  - 数学试卷 → 中文解释 + 原始公式

- ✅ **错题详细分析**
  - 批改图片下方显示错题卡片
  - 包含：题号、状态、扣分、错误类型、详细解析
  - 全对时显示祝贺卡片

- ✅ **优化图片压缩**
  - 原生 Canvas 压缩（移除外部依赖）
  - 前端：1024px, JPEG 0.7
  - 后端：800px, JPEG 0.5
  - 解决上传超时问题

## 🛠 技术栈

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **UI Library**: Shadcn UI, Radix UI, Lucide React
- **AI Providers**: 
  - Google Gemini API (@google/generative-ai)
  - Alibaba Qwen VL (DashScope API)
- **Utils**: html2canvas, recharts
- **Deployment**: GitHub Pages (Static Export)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/bullshitAI52/smartgrader.git
cd smartgrader
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API Key

应用启动后，点击右上角设置图标，选择 AI 提供商并输入对应的 API Key：

- **Google Gemini**: 
  - 获取地址：https://aistudio.google.com/app/apikey
  - 格式：`AIzaSy...`
  - 注意：部分地区需要全局代理

- **阿里通义千问**:
  - 获取地址：https://bailian.console.aliyun.com/
  - 格式：`sk-...`
  - 推荐：国内访问稳定，无需代理

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
smartgrader/
├── app/
│   ├── page.tsx              # 主页面（三合一：批改/OCR/作业辅导）
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── components/
│   ├── grading/
│   │   ├── grading-overlay.tsx    # 批改标注覆盖层
│   │   └── export-canvas.tsx      # 导出画布
│   ├── shared/
│   │   └── smart-uploader.tsx     # 智能图片上传组件
│   └── ui/                   # Shadcn UI 组件
├── lib/
│   ├── services/
│   │   └── gemini.ts         # AI 服务（Gemini + Qwen）
│   └── utils.ts              # 工具函数
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 部署配置
├── CHANGELOG.md              # 📝 详细更新日志
└── README.md                 # 本文件
```

## 🎯 使用指南

### 试卷批改

1. 点击顶部导航切换到「试卷批改」标签
2. 上传 1-5 张试卷图片（支持拖拽）
3. 设置试卷满分（默认 100 分）
4. 点击「开始批改」
5. 查看批改结果：
   - 左侧：原始试卷
   - 右侧：批改后的图片（带红勾红叉）+ 错题详细分析

### 文字识别 (OCR)

1. 切换到「文字识别」标签
2. 上传图片（支持批量）
3. AI 自动识别并提取文字
4. 可编辑识别结果
5. 点击「复制当前页」保存结果

### 作业辅导

1. 切换到「作业辅导」标签
2. 上传题目图片
3. （可选）添加补充说明
4. 点击「开始辅导」
5. AI 提供详细的解题步骤和概念解释

## 🌐 在线体验

访问地址：https://bullshitai52.github.io/smartgrader/

## 📊 版本对比

| 功能 | v1.0 | v2.0 |
|------|------|------|
| AI 引擎 | 仅 Google Gemini | Google + Qwen 双引擎 |
| 图片压缩 | browser-image-compression | 原生 Canvas |
| 语言策略 | 混乱 | 智能匹配 |
| 错题分析 | 无 | 详细卡片展示 |
| JSON 解析 | 基础 | 健壮提取 |

详细对比请查看 [CHANGELOG.md](./CHANGELOG.md)

## 🔧 开发说明

### 添加新的 AI 模型

1. 在 `lib/services/gemini.ts` 中添加新的 provider 类型
2. 实现对应的 API 调用逻辑
3. 在 UI 中添加选项

### 自定义批改逻辑

修改 `lib/services/gemini.ts` 中的 prompt 模板，调整 AI 的批改策略。

## 🚢 部署

### GitHub Pages (当前方式)

项目已配置 GitHub Actions 自动部署：

1. 推送到 `main` 分支
2. GitHub Actions 自动构建
3. 部署到 `gh-pages` 分支
4. 通过 GitHub Pages 访问

配置文件：`.github/workflows/deploy.yml`

### Vercel / Netlify

```bash
npm run build
```

将 `out` 目录部署到任意静态托管平台。

## 🐛 已知问题

查看 [CHANGELOG.md](./CHANGELOG.md) 中的「需要优化的问题」章节。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📮 联系方式

- GitHub: [@bullshitAI52](https://github.com/bullshitAI52)
- Issues: https://github.com/bullshitAI52/smartgrader/issues

---

**最后更新**: 2026-01-09  
**当前版本**: v2.0.0
