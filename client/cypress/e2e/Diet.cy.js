describe('Diet Tracking Page Tests', () => {
    beforeEach(() => {
      cy.visit('/diet-tracking'); 
    });

    it('should display the diet tracking page', () => {
      cy.contains('Track Your Diet').should('be.visible');
    });

    it('should add a new meal', () => {
      cy.contains('Add Meal').click();
      
      cy.get('input[name="name"]').type('Grilled Chicken');
      cy.get('input[name="protein"]').type('30');
      cy.get('input[name="carbs"]').type('10');
      cy.get('input[name="fats"]').type('5');

      // Calories auto-calculated: (Protein * 4 + Carbs * 4 + Fats * 9)
      cy.get('input[name="calories"]').should('have.value', '205');

      cy.contains('Add Meal').click();
      cy.contains('Meal saved successfully!').should('be.visible');
      cy.contains('Grilled Chicken').should('be.visible');
    });

    it('should auto-calculate calories correctly', () => {
      cy.contains('Add Meal').click();
      
      cy.get('input[name="protein"]').clear().type('20'); // 20g protein * 4 = 80
      cy.get('input[name="carbs"]').clear().type('15'); // 15g carbs * 4 = 60
      cy.get('input[name="fats"]').clear().type('10'); // 10g fats * 9 = 90

      // Total expected calories: 80 + 60 + 90 = 230
      cy.get('input[name="calories"]').should('have.value', '230');
    });

    it('should clear input fields', () => {
        cy.contains('Add Meal').click();
        
        cy.get('input[name="name"]').clear();
    
        cy.get('input[name="protein"]').clear().type('-10');
        cy.get('input[name="carbs"]').clear().type('abc');
        cy.get('input[name="fats"]').clear().type('20');
        
        cy.get('input[name="calories"]').should('not.have.value', '-10');
        cy.get('input[name="calories"]').should('not.have.value', 'abc');
    });
});
