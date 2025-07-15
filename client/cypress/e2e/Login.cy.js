describe('Login Page Integration Test', () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit('/login');
  });

  it('renders login form and inputs are visible', () => {
    // Check for page heading
    cy.contains('Login to Campus Eats').should('be.visible');

    // Check for email and password fields
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');

    // Check for the Login button
    cy.get('button').contains('LOGIN').should('exist');
  });

  it('allows user to input email and password', () => {
    // Type into email and password fields
    cy.get('input[type="email"]').type('drake@example.com').should('have.value', 'drake@example.com');
    cy.get('input[type="password"]').type('password123').should('have.value', 'password123');
  });

  it('toggles password visibility', () => {
    // Type a password first
    cy.get('input[type="password"]').type('password123');

    // Check initial password field type
    cy.get('input[type="password"]').should('exist');

    // Click visibility toggle
    cy.get('button[aria-label="toggle password visibility"]').click();

    // Password should now be visible (type="text")
    cy.get('input[type="text"]').should('have.value', 'password123');
  });

  it('validates required fields before form submission', () => {
    // Click login without entering data
    cy.get('button').contains('LOGIN').click();

    // Check for form validation (empty fields)
    cy.get('input[type="email"]:invalid').should('exist');
    cy.get('input[type="password"]:invalid').should('exist');
  });

 
});
