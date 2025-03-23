# 端到端测试指南

本项目使用 [Playwright](https://playwright.dev/) 进行端到端测试。Playwright 是一个强大的端到端测试框架，支持多种浏览器，包括 Chromium、Firefox 和 WebKit。

## 目录结构

```
tests/
└── e2e/                      # 端到端测试目录
    ├── README.md             # 本文档
    ├── home.spec.ts          # 首页测试
    ├── home-po.spec.ts       # 使用页面对象模式的首页测试
    ├── page-objects/         # 页面对象目录
    │   └── HomePage.ts       # 首页页面对象
    └── utils/
        └── test-helpers.ts   # 测试辅助函数
```

## 安装

项目已经安装了 Playwright，但如果需要重新安装，可以运行以下命令：

```bash
pnpm add -D @playwright/test
npx playwright install --with-deps
```

## 运行测试

以下是可用的测试命令：

```bash
# 运行所有测试
pnpm test:e2e

# 使用 UI 模式运行测试
pnpm test:e2e:ui

# 使用调试模式运行测试
pnpm test:e2e:debug

# 显示测试报告
pnpm test:e2e:report
```

## 创建新测试

1. 在 `tests/e2e` 目录下创建一个新的测试文件，文件名应以 `.spec.ts` 结尾。
2. 导入必要的 Playwright 组件：

```typescript
import { test, expect } from '@playwright/test';
```

3. 编写测试用例：

```typescript
test.describe('测试组名称', () => {
  test('测试用例描述', async ({ page }) => {
    // 导航到页面
    await page.goto('/your-page');

    // 与页面交互
    await page.click('button.submit');

    // 断言结果
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

## 测试辅助函数

我们在 `utils/test-helpers.ts` 中提供了一些常用的测试辅助函数，例如：

```typescript
import { waitForPageLoad, waitAndExpectVisible } from './utils/test-helpers';

test('使用辅助函数的测试', async ({ page }) => {
  await page.goto('/your-page');

  // 等待页面加载完成
  await waitForPageLoad(page);

  // 等待并验证元素可见
  await waitAndExpectVisible(page, '.important-element');
});
```

## 测试配置

测试配置位于项目根目录的 `playwright.config.ts` 文件中。该文件定义了：

- 测试目录：`./tests/e2e`
- 支持的浏览器项目：Chromium、Firefox、WebKit、移动设备模拟
- Web 服务器配置：使用 `pnpm dev` 启动本地服务器

## CI/CD 集成

在 CI 环境中，你可以使用以下命令来运行测试：

```bash
# 安装依赖
pnpm install

# 安装 Playwright 浏览器
npx playwright install --with-deps

# 构建项目
pnpm build

# 运行测试
pnpm test:e2e
```

## 最佳实践

1. **保持测试独立**：每个测试应该是独立的，不应该依赖于其他测试的状态。
2. **使用页面对象模式**：对于复杂应用，考虑使用页面对象模式来组织代码。
3. **合理使用断言**：使用合适的断言来验证页面的状态和行为。
4. **模拟不同设备和浏览器**：使用 Playwright 的设备模拟功能测试不同设备上的响应式设计。
5. **使用截图**：在测试失败时自动截图对调试非常有帮助。

## 常见问题解决

### 测试运行太慢

- 使用 `fullyParallel: true` 配置并行运行测试
- 减少不必要的等待和导航
- 使用 `trace: 'on-first-retry'` 只在失败的测试上收集跟踪

### 元素无法找到

- 确保使用正确的选择器
- 使用 `page.waitForSelector()` 等待元素出现
- 检查元素是否在 iframe 中或由动态 JavaScript 创建

### 测试在本地通过但在 CI 中失败

- 确保 CI 环境有足够的资源（内存、CPU）
- 检查时间依赖性问题（如动画）
- 使用 `--headed` 选项在 CI 中可视化运行测试
