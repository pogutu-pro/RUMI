import '@testing-library/jest-dom';

// MSW 2.x requires Fetch API to be available in Node
// For Node 18+, these are globals.
// jsdom strips them, so we restore them ONLY if we are in a browser-like environment.
if (typeof window !== 'undefined') {
  // jsdom strips fetch, but in Node 18+ it's a global.
  // We only restore if it exists globally in Node but not in the simulated window.
  // @ts-ignore
  if (typeof fetch !== 'undefined' && typeof window.fetch === 'undefined') {
    // @ts-ignore
    window.fetch = fetch;
    // @ts-ignore
    window.Request = Request;
    // @ts-ignore
    window.Response = Response;
    // @ts-ignore
    window.Headers = Headers;
  }
} else {
    // We are in Node environment
    // MSW needs TextEncoder/Decoder
    const util = require('util');
    global.TextEncoder = util.TextEncoder;
    global.TextDecoder = util.TextDecoder;
}

// Mocks for browser APIs
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  class IntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserver,
  });
  
  class ResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: ResizeObserver,
  });
}

/**
 * OPT-IN MSW SETUP
 * Tests that need MSW should import 'src/mocks/server' and call server.listen()
 * OR we can try to wrap it here but only execute if available.
 */
async function setupMSW() {
    try {
        const { server } = require('./src/mocks/server');
        if (server) {
            beforeAll(() => server.listen());
            afterEach(() => server.resetHandlers());
            afterAll(() => server.close());
        }
    } catch (e) {
        // Silently fail if MSW cannot be loaded (e.g. ESM issues in unit tests)
        console.warn('MSW could not be loaded in this test environment. Skipping API mocking.');
    }
}

// setupMSW(); // Leave it commented out for now to verify unit tests
