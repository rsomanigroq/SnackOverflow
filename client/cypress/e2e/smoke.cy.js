describe('empty spec', () => {
    it('can view the home page', () => {
    cy.visit('/');
    cy.contains('Review a movie');
    });
    });