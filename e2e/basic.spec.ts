import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for React app to mount
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Verify that the page contains content
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
    
    // Verify that the title of the page is set
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Verify that there's actual content in the root element
    const rootContent = await rootElement.textContent();
    expect(rootContent?.length || 0).toBeGreaterThan(0);
  });

  test('page is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for React app to mount
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Test basic accessibility - verify there's a main content area
    const main = page.locator('main, [role="main"], #root, #app');
    await expect(main.first()).toBeVisible();
    
    // Verify the page has some interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    
    // Capturer les erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtrer les erreurs non critiques communes
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
