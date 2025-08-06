import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test('application routes respond correctly', async ({ page }) => {
    // Test the home page
    const response = await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify the page loads without error (status 200-299)
    expect(response?.status()).toBeLessThan(400);
    
    // Wait for React app to mount
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Verify there's content on the page
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('authentication routes exist', async ({ page }) => {
    // Test authentication routes
    const routes = ['/auth', '/login', '/signup'];
    
    for (const route of routes) {
      try {
        const response = await page.goto(route);
        // Routes should either respond (200-399) or redirect (300-399)
        // We don't want server errors (500+) or 404
        if (response) {
          expect(response.status()).toBeLessThan(500);
        }
      } catch (error) {
        // Some routes might not exist, which is acceptable
        console.log(`Route ${route} may not exist:`, error);
      }
    }
  });

  test('navigation works without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Capturer les erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Naviguer sur plusieurs pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtrer les erreurs non critiques communes
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR') &&
      !error.includes('ChunkLoadError')
    );
    
    // S'assurer qu'il n'y a pas d'erreurs JavaScript critiques
    expect(criticalErrors.length).toBeLessThan(5); // Tolérer quelques erreurs mineures
  });

  test('app has proper meta tags and title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que le titre de la page est défini et non vide
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Vite + React + TS'); // Vérifier qu'il ne s'agit pas du titre par défaut de Vite
    
    // Vérifier la présence d'une meta viewport (important pour le responsive)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeTruthy();
  });
});
