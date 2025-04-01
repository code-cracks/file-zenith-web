这是一个基于 **Next.js**、**Tailwind CSS** 和 **TypeScript** 构建的现代化文件处理平台。用户可以在网页上直接进行常见的文件处理操作，提升工作效率。平台支持多种文件操作，确保高效、安全地处理各类文件，支持的操作包括但不限于：

- **文件压缩**：支持压缩图片、PDF 文件等，减小文件大小，便于传输和存储。

- **文件格式转换**：提供多种文件格式之间的转换，例如将 PNG 图片转换为 JPG、DOCX 转换为 PDF 等。

- **批量处理**：支持批量上传与处理，节省时间和精力。

- **文件合并与分割**：如合并多个 PDF 文件或将一个大型文件分割成多个小文件。

- **安全性保证**：平台采用最新的加密技术，确保用户文件的安全性与隐私保护。

- **持续更新功能**：平台将定期更新新的功能，满足用户日益增长的需求，如文字识别、视频压缩等。

无论是日常办公、开发还是个人使用，本工具都能为你提供便捷的文件处理方案，帮助提升工作效率，节省宝贵的时间。

# 🛠 技术栈

- [Next.js](https://nextjs.org/) - 服务端渲染与静态生成支持，确保页面的高效加载与 SEO 优化

- [Tailwind CSS](https://tailwindcss.com/) - 高效的原子级 CSS 框架，快速构建响应式与美观的界面

- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript 超集，提升代码质量与开发效率

- [NestJS](https://nestjs.com/) - 强大的 Node.js 框架，用于构建高效的服务器端应用，提供更复杂的文件处理逻辑和 API 支持

- [Sharp](https://sharp.pixelplumbing.com/) - 高效的图像处理库，用于图像压缩、格式转换和处理

- [FFmpeg](https://ffmpeg.org/) - 强大的多媒体处理工具，用于视频、音频格式转换与处理

# 🚀 功能特色

- 🌐 **无需安装**，在线即可完成文件处理，无需额外配置或下载任何软件。

- ⚡️ **高性能文件操作**，响应快速，文件处理过程顺畅，不浪费任何时间。

- 🔐 **本地处理**：所有文件操作均在用户浏览器中完成，避免上传与下载的安全风险。

- 📱 **响应式设计**，无论是桌面端还是移动端，均能流畅操作，确保多设备兼容。

- 🧩 **模块化设计**，便于功能拓展与维护，可持续增加新的文件处理工具和功能。

- 🛡️ **隐私保护**，平台不会存储用户上传的文件，文件一旦处理完成，即刻删除，确保用户数据隐私。

- 🔄 **CI/CD 自动化**：使用 GitHub Actions 实现自动化测试、代码质量分析和预览部署，确保代码质量和快速迭代。每个 PR 自动部署预览环境，SonarQube 实时代码分析保障质量标准。

# 测试目录结构与说明

该项目包含以下测试类型：

```text
tests/
├── unit/                     # 单元测试目录
│   ├── README.md             # 单元测试文档
│   ├── components/           # 组件单元测试
│   │   └── ThemeButton.test.tsx # 主题按钮测试
│   ├── hooks/                # React Hooks测试
│   │   └── use-mobile.test.tsx # 移动设备检测Hook测试
│   ├── utils/                # 工具函数测试
│   │   └── cn.test.ts        # 样式工具函数测试
│   ├── coverage/             # 单元测试覆盖率报告
│   └── reports/              # 单元测试HTML报告
│
├── integration/              # 集成测试目录
│   ├── README.md             # 集成测试文档
│   ├── components/           # 组件集成测试
│   │   └── Header-ThemeButton.test.tsx # 头部与主题按钮集成测试
│   ├── pages/                # 页面集成测试
│   │   └── HomePage.test.tsx # 首页集成测试
│   └── utils/                # 测试工具
│       └── test-providers.tsx # 测试上下文提供器
│
├── e2e/                      # 端到端测试目录
│   ├── README.md             # 端到端测试文档
│   ├── home.spec.ts          # 首页端到端测试
│   ├── home-po.spec.ts       # 使用页面对象模式的首页测试
│   ├── page-objects/         # 页面对象目录
│   │   └── HomePage.ts       # 首页页面对象
│   ├── reports/              # 测试报告输出目录
│   │   └── index.html        # HTML测试报告
│   ├── results/              # 测试结果目录
│   │   └── .last-run.json    # 最后运行记录
│   └── utils/
│       └── test-helpers.ts   # 测试辅助函数
│
└── coverage/                 # 整体测试覆盖率报告
```

## 测试类型说明

### 单元测试 (Unit Tests)

单元测试关注于测试应用程序的最小可测试单元，通常是单个函数、组件或类。这些测试是隔离的，不依赖于其他部分的功能。

- **技术栈**: Vitest, React Testing Library
- **运行命令**: `pnpm test:unit`
- **覆盖率报告**: `pnpm test:coverage`

### 集成测试 (Integration Tests)

集成测试检验多个单元如何一起工作，测试组件之间的交互或数据流。

- **技术栈**: Vitest, React Testing Library
- **运行命令**: `pnpm test:integration`

### 端到端测试 (E2E Tests)

端到端测试模拟真实用户行为，在实际的浏览器环境中测试整个应用程序流程。

- **技术栈**: Playwright
- **运行命令**:
  - 运行测试: `pnpm test:e2e`
  - UI模式: `pnpm test:e2e:ui`
  - 调试模式: `pnpm test:e2e:debug`
  - 查看报告: `pnpm test:e2e:report`

## 测试覆盖率

项目目前的测试覆盖率如下（通过 `pnpm test:coverage` 查看详细报告）：

- 语句覆盖率 (Statements): 34.85%
- 分支覆盖率 (Branches): 76.47%
- 函数覆盖率 (Functions): 39.13%
- 行覆盖率 (Lines): 34.85%

关键组件如 `Header.tsx` (98.46%)、`ThemeButton.tsx` (100%)、`use-mobile.tsx` (100%) 和 `cn.ts` (100%) 已有高覆盖率。

# 💡 如何贡献

我们欢迎所有形式的贡献，无论是功能建议、代码贡献还是问题反馈。以下是参与项目的方式：

## 贡献流程

1. **提交 Issue**：

   - 发现 bug？有新功能想法？请先创建一个 Issue
   - 清晰描述问题或建议，附上必要的截图和复现步骤

2. **认领任务**：

   - 浏览现有 Issue，找到感兴趣的任务
   - 在 Issue 下留言认领，表明你将处理此问题

3. **开发**：

   - Fork 项目仓库到你的账号
   - 创建特性分支 `git checkout -b feature/your-feature-name`
   - 进行开发并提交更改

4. **提交 PR**：
   - 完成开发后，提交 Pull Request 到主仓库
   - PR 描述中关联相关 Issue（例如 "Fixes #123"）
   - 等待代码审查和合并

## 开发指南

- 确保遵循项目的代码风格和最佳实践
- 添加适当的测试覆盖你的更改
- 更新文档以反映你的贡献

参与贡献不仅能帮助改进产品，也是提升个人技能的绝佳机会。我们期待你的创意和贡献！

# 📞 联系我们

如果你有任何问题、建议或合作意向，欢迎通过以下方式联系我们：

- **微信**：`yunmz777`

- **GitHub Issues**：在项目 Issues 页面提交问题或建议

我们非常重视用户反馈，并致力于不断改进产品体验。无论是技术讨论、功能需求还是使用咨询，都欢迎随时联系！
