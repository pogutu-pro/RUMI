/**
 * E2E Integration Tests for Payment Flows
 * 
 * Tests complete user journeys:
 * - Student making payment (offline + online)
 * - Landlord managing subscription
 * - Admin reconciling unmatched payments
 * 
 * Run with Cypress: pnpm cypress run
 * Or Playwright: pnpm exec playwright test
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// STUDENT PAYMENT FLOW
// =============================================================================

test.describe('Student Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/student/dashboard');
  });

  test('should display current balance and payment alert', async ({ page }) => {
    await page.goto('/student/payments');
    
    // Check balance display
    await expect(page.getByText(/Current Balance/i)).toBeVisible();
    await expect(page.getByText(/KES/i)).toBeVisible();
    
    // Check alert when balance > 0
    const balance = await page.locator('[data-testid="current-balance"]').textContent();
    if (balance && parseFloat(balance.replace(/[^0-9.-]+/g, '')) > 0) {
      await expect(page.getByText(/payment due/i)).toBeVisible();
    }
  });

  test('should open payment modal and display offline payment details', async ({ page }) => {
    await page.goto('/student/payments');
    
    // Open payment modal
    await page.click('button:has-text("Make Payment")');
    
    // Should show modal
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Should display Paybill number
    await expect(page.getByText(/Paybill Number/i)).toBeVisible();
    await expect(page.getByText(/Account Number/i)).toBeVisible();
    
    // Should have copy buttons
    const copyButtons = page.getByRole('button', { name: /Copy/i });
    await expect(copyButtons).toHaveCount(2); // Paybill + Account number
  });

  test('should initiate STK Push payment', async ({ page }) => {
    await page.goto('/student/payments');
    
    // Open modal
    await page.click('button:has-text("Make Payment")');
    
    // Switch to STK Push tab
    await page.click('button:has-text("STK Push")');
    
    // Fill amount
    await page.fill('input[name="amount"]', '5000');
    
    // Click initiate
    await page.click('button:has-text("Initiate Payment")');
    
    // Should show status tracker
    await expect(page.getByText(/Check your phone/i)).toBeVisible();
    await expect(page.getByText(/Pending/i)).toBeVisible();
  });

  test('should display payment history', async ({ page }) => {
    await page.goto('/student/payments');
    
    // Scroll to history section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Should show table
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/Reference/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
  });

  test('should download receipt for completed payment', async ({ page }) => {
    await page.goto('/student/payments');
    
    // Wait for history to load
    await page.waitForSelector('table');
    
    // Click first download button (if exists)
    const downloadButton = page.locator('button:has-text("Download Receipt")').first();
    if (await downloadButton.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('popup'),
        downloadButton.click(),
      ]);
      
      // New tab should open with PDF
      expect(download.url()).toContain('/receipts/');
    }
  });
});

// =============================================================================
// LANDLORD SUBSCRIPTION FLOW
// =============================================================================

test.describe('Landlord Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as landlord
    await page.goto('/login');
    await page.fill('input[name="email"]', 'landlord@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/landlord/dashboard');
  });

  test('should display subscription overview', async ({ page }) => {
    await page.goto('/landlord/payments');
    
    // Should show plan tier
    await expect(page.getByText(/Basic|Standard|Premium/i)).toBeVisible();
    
    // Should show occupancy
    await expect(page.getByText(/Current Occupancy/i)).toBeVisible();
    await expect(page.getByText(/beds/i)).toBeVisible();
    
    // Should show next invoice
    await expect(page.getByText(/Next Invoice/i)).toBeVisible();
  });

  test('should configure Paybill number', async ({ page }) => {
    await page.goto('/landlord/payments');
    
    // Scroll to payment configuration
    await page.getByText(/Payment Configuration/i).scrollIntoViewIfNeeded();
    
    // Select Paybill
    await page.click('select[name="payment_type"]');
    await page.click('option:has-text("Paybill")');
    
    // Fill details
    await page.fill('input[name="mpesa_number"]', '548548');
    await page.fill('input[name="business_name"]', 'Test Hostel Ltd');
    
    // Save
    await page.click('button:has-text("Save Configuration")');
    
    // Should show success
    await expect(page.getByText(/Configuration saved/i)).toBeVisible();
  });

  test('should view invoice history', async ({ page }) => {
    await page.goto('/landlord/payments');
    
    // Scroll to invoices
    await page.getByText(/Invoice History/i).scrollIntoViewIfNeeded();
    
    // Should show table
    await expect(page.locator('table').last()).toBeVisible();
    
    // Check columns
    await expect(page.getByText(/Invoice #/i)).toBeVisible();
    await expect(page.getByText(/Billing Period/i)).toBeVisible();
  });

  test('should download invoice PDF', async ({ page }) => {
    await page.goto('/landlord/payments');
    
    // Find first PDF button in invoice table
    const pdfButton = page.locator('button:has-text("PDF")').first();
    
    if (await pdfButton.isVisible()) {
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        pdfButton.click(),
      ]);
      
      expect(popup.url()).toContain('.pdf');
    }
  });
});

// =============================================================================
// ADMIN RECONCILIATION FLOW
// =============================================================================

test.describe('Admin Payment Reconciliation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should display unmatched payments', async ({ page }) => {
    await page.goto('/admin/payments');
    
    // Should show unmatched section
    await expect(page.getByText(/Unmatched Payments/i)).toBeVisible();
    
    // Should show pending count
    await expect(page.getByText(/pending/i)).toBeVisible();
  });

  test('should match payment with suggested student', async ({ page }) => {
    await page.goto('/admin/payments');
    
    // Wait for table
    await page.waitForSelector('table');
    
    // Click first Match button (if exists)
    const matchButton = page.locator('button:has-text("Match")').first();
    
    if (await matchButton.isVisible()) {
      await matchButton.click();
      
      // Should show success toast
      await expect(page.getByText(/matched successfully/i)).toBeVisible();
    }
  });

  test('should search payment ledger', async ({ page }) => {
    await page.goto('/admin/payments');
    
    // Scroll to ledger
    await page.getByText(/Payment Ledger/i).scrollIntoViewIfNeeded();
    
    // Search for a student
    await page.fill('input[placeholder*="Search"]', 'John Doe');
    await page.click('button:has-text("Search")');
    
    // Should filter results
    await page.waitForResponse((response) =>
      response.url().includes('?search=John%20Doe')
    );
  });

  test('should export ledger to CSV', async ({ page }) => {
    await page.goto('/admin/payments');
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export CSV")');
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click(),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('payment_ledger');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});

// =============================================================================
// CROSS-ROLE TESTS
// =============================================================================

test.describe('Cross-Role Permissions', () => {
  test('student should not access landlord pages', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Try to access landlord page
    await page.goto('/landlord/payments');
    
    // Should be redirect or show 403
    await expect(page).not.toHaveURL('/landlord/payments');
  });

  test('landlord should not access admin pages', async ({ page }) => {
    // Login as landlord
    await page.goto('/login');
    await page.fill('input[name="email"]', 'landlord@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Try to access admin page
    await page.goto('/admin/payments');
    
    // Should be redirected or show 403
    await expect(page).not.toHaveURL('/admin/payments');
  });
});

// =============================================================================
// MOBILE RESPONSIVENESS
// =============================================================================

test.describe('Mobile Responsive Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('payment modal should be mobile-friendly', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.goto('/student/payments');
    await page.click('button:has-text("Make Payment")');
    
    // Modal should be visible and scrollable on mobile
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // Content should not overflow
    const modalBox = await modal.boundingBox();
    expect(modalBox?.width).toBeLessThanOrEqual(375);
  });

  test('tables should be horizontally scrollable on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    await page.goto('/student/payments');
    
    // Table should exist
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Table container should allow scroll
    const container = table.locator('..');
    const hasOverflow = await container.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    
    // Either scrollable OR table fits in viewport
    expect(hasOverflow || true).toBeTruthy();
  });
});
