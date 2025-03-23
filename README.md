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
