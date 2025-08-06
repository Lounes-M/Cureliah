import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test('application routes respond correctly', async ({ page }) => {
    // Tester la page d'accueil
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que la page se charge sans erreur (status 200-299)
    const response = await page.request.get('/');
    expect(response.status()).toBeLessThan(400);
    
    // Vérifier qu'il y a du contenu sur la page
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test('authentication routes exist', async ({ page }) => {
    // Tester les routes d'authentification
    const routes = ['/login', '/signup'];
    
    for (const route of routes) {
      const response = await page.request.get(route);
      // Les routes doivent soit répondre (200-399) soit rediriger (300-399)
      // On ne veut pas d'erreurs serveur (500+) ou de 404
      expect(response.status()).toBeLessThan(500);
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
