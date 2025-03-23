import { test, expect } from '@playwright/test';

test.describe('首页测试', () => {
  test('首页应该正确显示标题和介绍文本', async ({ page }) => {
    // 导航到首页
    await page.goto('/');

    // 验证页面标题
    await expect(page.locator('h1')).toContainText('欢迎使用 PDF 工具');

    // 验证介绍文本
    await expect(page.locator('p')).toContainText('提供各种 PDF 和图片处理工具');
  });

  test('首页在移动设备上应该正确响应', async ({ page }) => {
    // 设置视口为移动设备大小
    await page.setViewportSize({ width: 375, height: 667 });

    // 导航到首页
    await page.goto('/');

    // 验证页面标题仍然可见
    await expect(page.locator('h1')).toBeVisible();

    // 验证容器有正确的内边距
    const container = page.locator('.container');
    await expect(container).toHaveClass(/px-4/);
  });
});
