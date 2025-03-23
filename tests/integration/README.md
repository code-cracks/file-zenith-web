# 集成测试指南

集成测试位于单元测试和端到端测试之间，主要测试多个组件之间的协作和交互。与单元测试不同，集成测试不会模拟所有依赖，而是使用真实组件集成来验证功能。

## 目录结构

```
tests/
├── integration/              # 集成测试目录
│   ├── README.md             # 本文档
│   ├── components/           # 组件集成测试
│   │   └── ...
│   └── pages/                # 页面集成测试
│       └── ...
├── unit/                     # 单元测试目录
└── e2e/                      # 端到端测试目录
```

## 集成测试与单元测试的区别

| 单元测试          | 集成测试                   |
| ----------------- | -------------------------- |
| 测试单个组件/函数 | 测试多个组件之间的交互     |
| 高度模拟依赖      | 使用真实组件组合           |
| 快速、轻量        | 相对较慢，但比端到端测试快 |
| 验证功能单元      | 验证组件间协作             |

## 运行测试

```bash
# 运行所有测试（包括单元测试和集成测试）
pnpm test

# 仅运行集成测试
pnpm test tests/integration

# 生成覆盖率报告
pnpm test:coverage
```

## 编写集成测试

集成测试使用 Vitest 和 React Testing Library，与单元测试相似，但关注点不同：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParentComponent } from '@/components/ParentComponent';

describe('ParentComponent 与子组件集成', () => {
  it('应该正确渲染子组件并传递属性', () => {
    render(<ParentComponent />);

    // 验证子组件是否正确渲染
    expect(screen.getByTestId('child-component')).toBeInTheDocument();

    // 验证属性是否正确传递
    expect(screen.getByText('从父组件传递的数据')).toBeInTheDocument();
  });
});
```

## 集成测试的最佳实践

1. **测试关键流程**：专注于测试应用中重要的用户流程和组件交互
2. **避免过度模拟**：使用真实组件组合，而不是大量模拟
3. **使用测试上下文**：在需要时提供必要的上下文（例如 Context Provider）
4. **适当的粒度**：测试不要太细（单元测试的工作）也不要太粗（端到端测试的工作）
5. **平衡覆盖率和速度**：集成测试运行速度应该比端到端测试快，但可能比单元测试慢

## 常见场景

以下是适合集成测试的常见场景：

- 表单组件与其验证逻辑
- 列表组件与其项目组件
- 导航组件与路由
- 带有多个子组件的复杂 UI 组件
- Context Provider 与消费组件
