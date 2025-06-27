// Cypress E2E test: Auth, Payment, Subscription flows

describe('Cureliah Auth, Payment, and Subscription Flows', () => {
  const doctorEmail = `doctor${Date.now()}@test.com`;
  const doctorPassword = 'TestPassword123!';

  it('should sign up as a doctor', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type(doctorEmail);
    cy.get('input[name="password"]').type(doctorPassword);
    cy.get('input[name="userType"]').check('doctor');
    cy.get('button[type="submit"]').click();
    cy.contains('Vérifiez votre email').should('exist');
  });

  it('should log in as a doctor', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(doctorEmail);
    cy.get('input[name="password"]').type(doctorPassword);
    cy.get('button[type="submit"]').click();
    cy.contains('Bienvenue').should('exist');
  });

  it('should subscribe as a doctor', () => {
    cy.visit('/doctor/dashboard');
    cy.contains('S’abonner').click();
    // Simulate payment (adjust selectors for your payment form)
    cy.get('input[name="cardnumber"]').type('4242424242424242');
    cy.get('input[name="exp-date"]').type('1234');
    cy.get('input[name="cvc"]').type('123');
    cy.get('input[name="postal"]').type('12345');
    cy.get('button[type="submit"]').click();
    cy.contains('Abonnement actif').should('exist');
  });

  it('should restrict access to subscription-protected features if not subscribed', () => {
    // Log out and log in as a new doctor who is not subscribed
    const unsubscribedEmail = `unsub${Date.now()}@test.com`;
    cy.visit('/signup');
    cy.get('input[name="email"]').type(unsubscribedEmail);
    cy.get('input[name="password"]').type(doctorPassword);
    cy.get('input[name="userType"]').check('doctor');
    cy.get('button[type="submit"]').click();
    cy.visit('/login');
    cy.get('input[name="email"]').type(unsubscribedEmail);
    cy.get('input[name="password"]').type(doctorPassword);
    cy.get('button[type="submit"]').click();
    cy.visit('/doctor/dashboard');
    cy.contains('S’abonner').should('exist');
    // Try to access a protected feature
    cy.visit('/doctor/protected-feature');
    cy.contains('Abonnement requis').should('exist');
  });

  it('should log out', () => {
    cy.get('button[aria-label="logout"]').click();
    cy.contains('Déconnexion réussie').should('exist');
  });
});
