import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BackToTop } from '../back-to-top';

// Real animation frames run after the current task, so the fake queues them
// and the helper flushes them, like a browser would between events.
let queued: FrameRequestCallback[] = [];

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    queued.splice(0).forEach((cb) => cb(0));
  });
}

describe('BackToTop', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    queued = [];
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queued.push(cb);
      return queued.length;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('is hidden at the top of the page and shown after scrolling down', () => {
    render(<BackToTop />);
    const button = screen.getByLabelText('Back to top', { selector: 'button' });
    expect(button).toHaveAttribute('aria-hidden', 'true');
    scrollTo(900);
    expect(button).toHaveAttribute('aria-hidden', 'false');
    scrollTo(100);
    expect(button).toHaveAttribute('aria-hidden', 'true');
  });

  it('scrolls smoothly to the top when clicked', () => {
    render(<BackToTop />);
    scrollTo(900);
    fireEvent.click(screen.getByLabelText('Back to top'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('jumps instead of gliding for people who prefer reduced motion', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    render(<BackToTop />);
    scrollTo(900);
    fireEvent.click(screen.getByLabelText('Back to top'));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
