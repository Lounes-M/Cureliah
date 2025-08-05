describe('Workflow de Réservation Complet', () => {
  beforeEach(() => {
    // Configuration de base
    cy.task('db:seed'); // Seeder la base de données avec des données de test
    cy.visit('/');
  });

  it('devrait permettre à un établissement de réserver une vacation et payer', () => {
    // 1. Connexion en tant qu'établissement
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-input"]').type('establishment@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="signin-submit"]').click();

    // Vérifier que nous sommes sur le dashboard
    cy.url().should('include', '/establishment/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'Test Hospital');

    // 2. Rechercher des vacations
    cy.get('[data-testid="search-vacations-link"]').click();
    cy.url().should('include', '/vacation/search');

    // Appliquer des filtres
    cy.get('[data-testid="speciality-filter"]').select('cardiology');
    cy.get('[data-testid="location-filter"]').type('Paris');
    cy.get('[data-testid="search-button"]').click();

    // Vérifier que les résultats apparaissent
    cy.get('[data-testid="vacation-card"]').should('have.length.at.least', 1);

    // 3. Sélectionner une vacation
    cy.get('[data-testid="vacation-card"]').first().within(() => {
      cy.get('[data-testid="book-vacation-button"]').click();
    });

    // Vérifier que nous sommes sur la page de réservation
    cy.url().should('include', '/booking/');

    // 4. Remplir le formulaire de réservation
    cy.get('[data-testid="emergency-contact-input"]').type('0123456789');
    cy.get('[data-testid="message-textarea"]').type('Nous avons besoin d\'un cardiologue expérimenté pour notre service d\'urgence.');
    cy.get('[data-testid="special-requirements-textarea"]').type('Disponibilité pour les urgences 24h/24');

    // Passer à l'étape suivante
    cy.get('[data-testid="continue-button"]').click();

    // 5. Confirmer la réservation
    cy.get('[data-testid="booking-summary"]').should('be.visible');
    cy.get('[data-testid="total-amount"]').should('contain', '€');
    cy.get('[data-testid="confirm-booking-button"]').click();

    // 6. Traitement du paiement
    cy.url().should('include', '/payment/');
    
    // Vérifier que nous sommes redirigés vers Stripe
    cy.get('[data-testid="pay-button"]').click();
    
    // Simuler le paiement Stripe (en mode test)
    cy.origin('https://checkout.stripe.com', () => {
      // Utiliser une carte de test Stripe
      cy.get('[data-testid="cardNumber"]').type('4242424242424242');
      cy.get('[data-testid="cardExpiry"]').type('12/34');
      cy.get('[data-testid="cardCvc"]').type('123');
      cy.get('[data-testid="billingName"]').type('Test Hospital');
      cy.get('[data-testid="submit"]').click();
    });

    // 7. Vérifier le succès du paiement
    cy.url().should('include', '/payment-success');
    cy.get('[data-testid="success-message"]').should('contain', 'Paiement réussi');
    
    // 8. Vérifier que la réservation apparaît dans le dashboard
    cy.get('[data-testid="view-booking-button"]').click();
    cy.url().should('include', '/bookings');
    
    cy.get('[data-testid="booking-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="booking-status"]').should('contain', 'Confirmé');
    cy.get('[data-testid="payment-status"]').should('contain', 'Payé');
  });

  it('devrait permettre à un médecin de voir la nouvelle réservation et notifications', () => {
    // Simuler qu'une réservation a été créée
    cy.task('db:createMockBooking');

    // 1. Connexion en tant que médecin
    cy.visit('/auth');
    cy.get('[data-testid="email-input"]').type('doctor@test.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="signin-submit"]').click();

    // 2. Vérifier les notifications
    cy.get('[data-testid="notification-bell"]').should('have.class', 'has-unread');
    cy.get('[data-testid="notification-count"]').should('contain', '1');

    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-item"]').should('contain', 'Nouvelle demande de réservation');

    // 3. Aller voir les réservations
    cy.get('[data-testid="bookings-link"]').click();
    cy.url().should('include', '/doctor/bookings');

    // Vérifier que la réservation apparaît
    cy.get('[data-testid="booking-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="booking-status"]').should('contain', 'Confirmé');
    
    // 4. Ouvrir la messagerie avec l'établissement
    cy.get('[data-testid="open-chat-button"]').first().click();
    cy.get('[data-testid="chat-interface"]').should('be.visible');
    
    // Envoyer un message
    cy.get('[data-testid="message-input"]').type('Merci pour votre réservation. J\'ai hâte de travailler avec vous !');
    cy.get('[data-testid="send-message-button"]').click();
    
    cy.get('[data-testid="message-sent"]').should('contain', 'Merci pour votre réservation');
  });

  it('devrait gérer les erreurs de paiement gracieusement', () => {
    // 1. Créer une réservation qui échouera au paiement
    cy.login('establishment@test.com', 'password123');
    cy.createBooking('cardiology-vacation-1');

    // 2. Aller à la page de paiement
    cy.url().should('include', '/payment/');
    
    // 3. Utiliser une carte qui échoue (carte de test Stripe)
    cy.get('[data-testid="pay-button"]').click();
    
    cy.origin('https://checkout.stripe.com', () => {
      // Carte qui sera déclinée
      cy.get('[data-testid="cardNumber"]').type('4000000000000002');
      cy.get('[data-testid="cardExpiry"]').type('12/34');
      cy.get('[data-testid="cardCvc"]').type('123');
      cy.get('[data-testid="billingName"]').type('Test Hospital');
      cy.get('[data-testid="submit"]').click();
    });

    // 4. Vérifier la redirection vers la page d'échec
    cy.url().should('include', '/payment-failure');
    cy.get('[data-testid="error-message"]').should('contain', 'Échec du paiement');
    
    // 5. Vérifier que l'utilisateur peut réessayer
    cy.get('[data-testid="retry-payment-button"]').click();
    cy.url().should('include', '/payment/');
  });

  it('devrait permettre l\'annulation d\'une réservation', () => {
    // Préparer une réservation confirmée
    cy.task('db:createConfirmedBooking');
    
    // 1. Connexion en tant qu'établissement
    cy.login('establishment@test.com', 'password123');
    
    // 2. Aller aux réservations
    cy.get('[data-testid="my-bookings-link"]').click();
    
    // 3. Annuler une réservation
    cy.get('[data-testid="booking-item"]').first().within(() => {
      cy.get('[data-testid="cancel-booking-button"]').click();
    });
    
    // 4. Confirmer l'annulation
    cy.get('[data-testid="cancel-confirmation-modal"]').should('be.visible');
    cy.get('[data-testid="cancellation-reason"]').select('emergency');
    cy.get('[data-testid="confirm-cancellation-button"]').click();
    
    // 5. Vérifier que le statut a changé
    cy.get('[data-testid="booking-status"]').should('contain', 'Annulé');
    
    // 6. Vérifier que le médecin reçoit une notification
    cy.logout();
    cy.login('doctor@test.com', 'password123');
    
    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-item"]').should('contain', 'Réservation annulée');
  });
});

// Commandes personnalisées pour Cypress
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="signin-submit"]').click();
  cy.url().should('not.include', '/auth');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/');
});

Cypress.Commands.add('createBooking', (vacationId: string) => {
  cy.visit(`/booking/${vacationId}`);
  cy.get('[data-testid="emergency-contact-input"]').type('0123456789');
  cy.get('[data-testid="message-textarea"]').type('Test booking message');
  cy.get('[data-testid="continue-button"]').click();
  cy.get('[data-testid="confirm-booking-button"]').click();
});
