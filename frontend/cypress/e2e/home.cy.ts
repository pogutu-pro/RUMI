describe('Home Page', () => {
  it('successfully loads', () => {
    cy.visit('/');
    // Check for a known element, e.g., the logo or main heading
    // Adjust selector based on actual content
    cy.get('body').should('be.visible'); 
  });
});
