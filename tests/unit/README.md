# 单元测试指南

本项目使用 [Vitest](https://vitest.dev/) 进行单元测试。Vitest 是一个快速的单元测试框架，与 Vite 生态系统紧密集成。

## 目录结构

```
tests/
├── unit/                      # 单元测试目录
│   ├── README.md              # 本文档
│   ├── components/            # 组件测试
│   │   └── ThemeButton.test.tsx
│   ├── hooks/                 # 钩子测试
│   ├── utils/                 # 工具函数测试
│   │   └── cn.test.ts
│   ├── coverage/              # 覆盖率报告（运行 test:coverage 后生成）
│   └── reports/               # 测试报告
└── e2e/                       # 端到端测试目录
```

## 运行测试

以下是可用的测试命令：

```bash
# 运行所有单元测试
pnpm test

# 以监视模式运行单元测试（文件更改时自动重新运行）
pnpm test:watch

# 运行单元测试并生成覆盖率报告
pnpm test:coverage

# 以 UI 模式运行单元测试
pnpm test:ui
```

## 创建新测试

1. 在适当的目录（`components`、`hooks` 或 `utils`）中创建一个新的测试文件
2. 文件名应遵循 `[组件名].test.tsx` 或 `[函数名].test.ts` 的命名约定
3. 导入必要的测试工具：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
```

4. 使用 `describe` 和 `it` 组织测试：

```typescript
describe('组件名称', () => {
  it('应该有特定的行为', () => {
    // 测试代码
    expect(result).toBe(expectedValue);
  });
});
```

## 模拟依赖

使用 `vi.mock()` 模拟外部依赖：

```typescript
vi.mock('next-themes', () => ({
  useTheme: vi.fn().mockReturnValue({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));
```

## 测试 React 组件

使用 `@testing-library/react` 渲染和测试组件：

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';

describe('YourComponent', () => {
  it('应该渲染正确的内容', () => {
    render(<YourComponent />);

    // 使用各种查询方法查找元素
    const element = screen.getByText('期望的文本');
    expect(element).toBeInTheDocument();

    // 模拟用户交互
    fireEvent.click(element);

    // 验证交互后的状态
    expect(screen.getByText('新文本')).toBeInTheDocument();
  });
});
```

## 代码覆盖率

运行 `pnpm test:coverage` 生成覆盖率报告。报告将显示：

- 语句覆盖率
- 分支覆盖率
- 函数覆盖率
- 行覆盖率

覆盖率报告位于 `tests/unit/coverage` 目录中。

## 结合端到端测试

单元测试和端到端测试互为补充：

- **单元测试**：测试组件和函数的独立行为
- **端到端测试**：测试整个应用的用户流程

在开发流程中：

1. 使用单元测试确保各个组件和函数正常工作
2. 使用端到端测试验证整个应用的用户交互流程
