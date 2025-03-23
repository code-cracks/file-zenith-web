import { test } from '@playwright/test';

import { HomePage } from './page-objects/HomePage';

test.describe('首页测试 (使用页面对象模式)', () => {
  test('首页应该正确显示标题和介绍文本', async ({ page }) => {
    const homePage = new HomePage(page);

    // 导航到首页
    await homePage.goto();

    // 验证页面标题
    await homePage.validateHeading('欢迎使用 PDF 工具');

    // 验证介绍文本
    await homePage.validateDescription('提供各种 PDF 和图片处理工具');
  });

  test('首页在移动设备上应该正确响应', async ({ page }) => {
    const homePage = new HomePage(page);

    // 导航到首页
    await homePage.goto();

    // 切换到移动视图
    await homePage.switchToMobileView();

    // 验证页面标题仍然可见
    await homePage.validateHeading('欢迎使用 PDF 工具');

    // 验证容器响应式样式
    await homePage.validateContainerResponsiveness();
  });
});
