import { Page, expect } from '@playwright/test';

/**
 * 常用测试辅助函数
 */

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // 等待网络空闲
  await page.waitForLoadState('networkidle');
  // 等待DOM内容加载完成
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 等待并验证元素可见
 */
export async function waitAndExpectVisible(
  page: Page,
  selector: string,
  timeout = 5000,
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
}

/**
 * 模拟用户登录
 */
export async function loginUser(page: Page, username: string, password: string): Promise<void> {
  // 这里假设你有一个登录页面在 '/login'
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // 等待登录成功
  await waitAndExpectVisible(page, '.user-profile');
}

/**
 * 截取屏幕截图并保存
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `./screenshots/${name}.png`, fullPage: true });
}

/**
 * 模拟文件上传
 */
export async function uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
  await page.setInputFiles(selector, filePath);
}

/**
 * 清除本地存储
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => window.localStorage.clear());
}

/**
 * 设置本地存储项
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ([k, v]) => {
      window.localStorage.setItem(k, v);
    },
    [key, value],
  );
}
