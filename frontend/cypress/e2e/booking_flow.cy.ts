describe('Booking Flow Happy Path', () => {
    // Ignore hydration mismatch errors which are common in Next.js dev environment
    Cypress.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed') || err.message.includes('Minified React error #418')) {
        return false;
      }
      return true;
    });

    beforeEach(() => {
      // Intercept Global State & Initial Data
      cy.intercept('GET', '**/api/v1/accounts/me/**', {
        fixture: 'user.json'
      }).as('getUser');
  
      cy.intercept('GET', '**/api/v1/hostels', {
        statusCode: 200,
        body: {
          count: 1,
          results: [{
            id: 1,
            name: 'Central Hostel',
            slug: 'central-hostel',
            city: 'Nairobi',
            university: 'UoN',
            base_price: '5000',
            images: [],
            is_verified: true,
            available_rooms: 5,
            rating: '4.5'
          }]
        }
      }).as('getHostels');

      cy.intercept('GET', '**/api/v1/hostels/search/**', {
        statusCode: 200,
        body: {
          count: 1,
          results: [{
            id: 1,
            name: 'Central Hostel',
            slug: 'central-hostel',
            city: 'Nairobi',
            university: 'UoN',
            base_price: '5000',
            images: [],
            is_verified: true,
            available_rooms: 5,
            rating: '4.5'
          }]
        }
      }).as('searchHostels');
  
      cy.intercept('GET', '**/api/v1/hostels/*/', (req) => {
        if (req.url.includes('/rooms/') || req.url.includes('/search/')) return;
        req.reply({
            statusCode: 200,
            body: {
                id: 1,
                name: 'Central Hostel',
                slug: 'central-hostel',
                base_price: '5000',
                images: [],
                available_rooms: 5,
                description: 'A great hostel'
            }
        });
      }).as('getHostelDetail');

      cy.intercept('GET', '**/api/v1/hostels/rooms/**', {
        statusCode: 200,
        body: {
            data: [
                { id: 101, room_number: 'A1', base_price: '5000', capacity: 1, is_available: true }
            ],
            meta: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 1,
                itemsPerPage: 10,
                hasNextPage: false,
                hasPreviousPage: false
            }
        }
      }).as('getRooms');
    });
  
    it('should complete a booking flow from search to payment initiation', () => {
      // 1. Visit Hostels Page
      cy.visit('/hostels');
      
      // 2. Navigate to Hostel Detail
      cy.contains('a', 'View', { timeout: 10000 }).click({ force: true });
      
      // 3. Verify navigation and select room
      cy.url().should('include', '/hostels/central-hostel');
      cy.contains('Room A1', { timeout: 10000 }).click({ force: true });
      
      // 4. Verify selection and price calculation
      cy.contains('KSh 5,000').should('be.visible');
      
      // 5. Initiate Booking
      cy.intercept('GET', '**/api/v1/accounts/student-profile/exists/**', { body: { exists: true } }).as('checkProfile');
      cy.intercept('POST', '**/api/v1/hostels/rooms/book/**', {
        statusCode: 201,
        body: { id: 'bk-999', status: 'pending', amount_due: '7000.0' }
      }).as('createBooking');
  
      cy.contains('button', 'Book This Room', { timeout: 10000 }).should('be.enabled').click({ force: true });
      
      // 6. Verify Payment Step
      cy.contains('Confirm & Pay', { timeout: 15000 }).should('be.visible');
      
      // 7. Simulate Payment Confirmation click
      cy.intercept('POST', '**/api/v1/payments/confirm/**', { body: { status: 'success' } }).as('confirmPayment');
      cy.contains("I've Paid").click({ force: true });
      
      // 8. Verify Success State
      cy.contains('Booking Successful', { timeout: 10000 }).should('be.visible');
    });
  });
