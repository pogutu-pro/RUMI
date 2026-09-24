/**
 * Opens Paystack checkout in its own tab, keeping the dashboard tab intact
 * behind it.
 *
 * The Paystack URL only exists after an API call returns, but a browser
 * only allows `window.open` without blocking it as a popup when it runs
 * synchronously inside a user gesture (a click handler) — by the time an
 * `await` resolves, that gesture has expired. The fix is the standard one:
 * open a blank tab synchronously, at the top of the click handler, then
 * point that already-open tab at the real URL once it's known.
 */

/** Call this first, synchronously, before any `await` in the click handler. */
export function openCheckoutTab(): Window | null {
  try {
    return window.open('', '_blank');
  } catch {
    return null;
  }
}

/**
 * Send the tab opened by `openCheckoutTab()` to the checkout URL. Falls
 * back to a same-tab redirect if the browser blocked the popup anyway (or
 * the person closed it before this ran) — the payment must still be able
 * to go through.
 */
export function navigateCheckoutTab(tab: Window | null, url: string): void {
  if (tab && !tab.closed) {
    tab.location.href = url;
  } else {
    window.location.href = url;
  }
}
