import { Page, Locator, expect } from '@playwright/test';

/**
 * 首页的页面对象类
 * 页面对象模式可以帮助组织测试代码，使其更加可维护
 */
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;
  readonly container: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.description = page.locator('p');
    this.container = page.locator('.container');
  }

  /**
   * 导航到首页
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * 验证页面标题
   */
  async validateHeading(expectedText: string): Promise<void> {
    await expect(this.heading).toContainText(expectedText);
  }

  /**
   * 验证页面描述
   */
  async validateDescription(expectedText: string): Promise<void> {
    await expect(this.description).toContainText(expectedText);
  }

  /**
   * 切换到移动视图
   */
  async switchToMobileView(width = 375, height = 667): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * 验证容器响应式样式
   */
  async validateContainerResponsiveness(): Promise<void> {
    await expect(this.container).toHaveClass(/px-4/);
  }
}
