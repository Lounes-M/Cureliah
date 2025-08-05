describe('Monitoring System E2E', () => {
  beforeEach(() => {
    // Visiter le dashboard admin
    cy.visit('/admin');
    
    // Se connecter en tant qu'admin
    cy.get('[data-testid="email-input"]').type('admin@cureliah.com');
    cy.get('[data-testid="password-input"]').type('admin123');
    cy.get('[data-testid="login-button"]').click();
    
    // Attendre la redirection
    cy.url().should('include', '/admin');
  });

  describe('Error Monitoring', () => {
    it('should capture and display JavaScript errors', () => {
      // Déclencher une erreur JavaScript intentionnelle
      cy.window().then((win) => {
        // Simuler une erreur non gérée
        win.dispatchEvent(new win.ErrorEvent('error', {
          message: 'Test error for monitoring',
          filename: 'test.js',
          lineno: 10,
          colno: 5,
          error: new Error('Test error for monitoring')
        }));
      });

      // Naviguer vers le tableau de bord de monitoring
      cy.visit('/admin/monitoring');

      // Vérifier que l'erreur est affichée
      cy.get('[data-testid="error-reports"]').should('be.visible');
      cy.contains('Test error for monitoring').should('be.visible');
    });

    it('should show error severity badges correctly', () => {
      cy.visit('/admin/monitoring');

      // Vérifier les badges de sévérité
      cy.get('[data-testid="error-report-item"]').first().within(() => {
        cy.get('[data-testid="severity-badge"]').should('be.visible');
      });
    });

    it('should allow resolving errors', () => {
      cy.visit('/admin/monitoring');

      // Cliquer sur le bouton de résolution d'erreur
      cy.get('[data-testid="resolve-error-button"]').first().click();

      // Vérifier que l'erreur est marquée comme résolue
      cy.get('[data-testid="resolved-badge"]').should('be.visible');
    });
  });

  describe('Performance Monitoring', () => {
    it('should display performance metrics charts', () => {
      cy.visit('/admin/monitoring');

      // Cliquer sur l'onglet Performance
      cy.get('[data-testid="performance-tab"]').click();

      // Vérifier que les graphiques sont affichés
      cy.get('[data-testid="performance-chart"]').should('be.visible');
      cy.get('.recharts-responsive-container').should('be.visible');
    });

    it('should show performance alerts', () => {
      cy.visit('/admin/monitoring');

      // Cliquer sur l'onglet Alertes
      cy.get('[data-testid="alerts-tab"]').click();

      // Vérifier la section des alertes
      cy.get('[data-testid="performance-alerts"]').should('be.visible');
    });

    it('should allow filtering by time range', () => {
      cy.visit('/admin/monitoring');

      // Changer la plage de temps
      cy.get('[data-testid="time-range-select"]').select('1h');

      // Vérifier que les données sont rechargées
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
      cy.get('[data-testid="loading-indicator"]').should('not.exist');
    });
  });

  describe('Real-time Notifications', () => {
    it('should display monitoring notifications panel', () => {
      cy.visit('/admin/monitoring');

      // Vérifier le panneau de notifications
      cy.get('[data-testid="monitoring-notifications"]').should('be.visible');
    });

    it('should show notification count badge', () => {
      cy.visit('/admin/monitoring');

      // Simuler une nouvelle erreur critique
      cy.window().then((win) => {
        win.dispatchEvent(new win.ErrorEvent('error', {
          message: 'Critical error for notification test',
          error: new Error('Critical error for notification test')
        }));
      });

      // Attendre et vérifier le badge de notification
      cy.get('[data-testid="notification-badge"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', '1');
    });

    it('should open notifications panel when clicked', () => {
      cy.visit('/admin/monitoring');

      // Cliquer sur le bouton de notifications
      cy.get('[data-testid="monitoring-notifications"]').click();

      // Vérifier que le panneau s'ouvre
      cy.get('[data-testid="notifications-panel"]').should('be.visible');
    });
  });

  describe('System Health Report', () => {
    it('should display system health status', () => {
      cy.visit('/admin/monitoring');

      // Vérifier la section de santé système
      cy.get('[data-testid="system-health"]').should('be.visible');
      
      // Vérifier les métriques de santé
      cy.get('[data-testid="health-metric"]').should('have.length.greaterThan', 0);
    });

    it('should show health status colors correctly', () => {
      cy.visit('/admin/monitoring');

      // Vérifier les indicateurs de couleur pour la santé
      cy.get('[data-testid="health-metric"]').each(($metric) => {
        cy.wrap($metric).should('have.class', /text-(green|yellow|orange|red)-600/);
      });
    });
  });

  describe('Data Refresh and Caching', () => {
    it('should refresh data when refresh button is clicked', () => {
      cy.visit('/admin/monitoring');

      // Cliquer sur le bouton d'actualisation
      cy.get('[data-testid="refresh-button"]').click();

      // Vérifier l'indicateur de chargement
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
      cy.get('[data-testid="loading-indicator"]').should('not.exist');
    });

    it('should maintain data when switching tabs', () => {
      cy.visit('/admin/monitoring');

      // Attendre que les données se chargent
      cy.get('[data-testid="error-stats"]').should('be.visible');
      
      // Changer d'onglet
      cy.get('[data-testid="performance-tab"]').click();
      cy.get('[data-testid="errors-tab"]').click();

      // Vérifier que les données sont toujours là
      cy.get('[data-testid="error-stats"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/admin/monitoring');

      // Vérifier que l'interface s'adapte
      cy.get('[data-testid="monitoring-dashboard"]').should('be.visible');
      cy.get('[data-testid="stats-grid"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/admin/monitoring');

      // Vérifier l'affichage sur tablette
      cy.get('[data-testid="monitoring-dashboard"]').should('be.visible');
      cy.get('[data-testid="performance-chart"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Intercepter les requêtes API et renvoyer des erreurs
      cy.intercept('GET', '**/error_reports*', { statusCode: 500 }).as('errorReportsError');
      
      cy.visit('/admin/monitoring');

      // Vérifier qu'un message d'erreur est affiché
      cy.contains('Impossible de charger les données').should('be.visible');
    });

    it('should show loading states appropriately', () => {
      // Intercepter les requêtes avec un délai
      cy.intercept('GET', '**/error_reports*', { delay: 2000, fixture: 'error-reports.json' });
      
      cy.visit('/admin/monitoring');

      // Vérifier l'état de chargement
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/admin/monitoring');

      // Tester la navigation au clavier
      cy.get('body').tab();
      cy.focused().should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/admin/monitoring');

      // Vérifier les labels ARIA
      cy.get('[data-testid="monitoring-notifications"]')
        .should('have.attr', 'aria-label');
    });
  });
});
