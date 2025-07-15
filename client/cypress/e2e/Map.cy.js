describe("Navigation to Map Page via NavBar and Map Page Functionality", () => {
    beforeEach(() => {
      cy.visit("/"); 
    });
  
    it("should navigate to the Map page using the NavBar", () => {
      cy.contains("Find Restaurants").click();
      cy.url().should("include", "/app/map");
    });
  
    it("should display the correct page title on the Map page", () => {
      cy.contains("Find Restaurants").click();
      cy.contains("h1", "Find Restaurants").should("be.visible");
    });
  
    it("should render the Google Maps iframe correctly", () => {
      cy.contains("Find Restaurants").click();
      cy.get("iframe")
        .should("be.visible")
        .and("have.attr", "src")
        .and("include", "neighborhood-discovery.html");
    });
  });
  