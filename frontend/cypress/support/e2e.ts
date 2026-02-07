// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Better error presentation
Cypress.on('fail', (error, runnable) => {
  // Add more context to the error message
  const originalMessage = error.message;
  const testName = runnable.title;
  const specFile = Cypress.spec.name;

  error.message = `
🧪 TEST FAILURE: ${testName}
📂 SPEC FILE: ${specFile}
--------------------------------------------------------------------------------
❌ CAUSE: ${originalMessage}
--------------------------------------------------------------------------------
💡 Tip: Check the screenshot and video for visual confirmation of the failure state.
`;

  // Rethrow to let Cypress handle the failure normally with our enriched message
  throw error;
});

// Ignore hydration mismatch errors which are common in Next.js dev environment
Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('Hydration failed') || 
    err.message.includes('Minified React error #418') ||
    err.message.includes('Minified React error #423') ||
    err.message.includes('Minified React error #425')
  ) {
    return false;
  }
  return true;
});
