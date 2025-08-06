import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Attendre que le contenu principal soit chargé
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page contient du contenu
    await expect(page.locator('body')).toBeVisible();
    
    // Vérifier que le titre de la page est défini
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('page is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test basique d'accessibilité - vérifier qu'il y a un élément principal
    const main = page.locator('main, [role="main"], #root, #app');
    await expect(main.first()).toBeVisible();
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
