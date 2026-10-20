// Harmless defaults for browser APIs that jsdom does not implement, so the test log has no "Not implemented" lines.
// Real errors are not hidden: console.error is left alone. A test that needs other behaviour overrides the stub
// (vi.stubGlobal('matchMedia', ...)) and restores it with vi.unstubAllGlobals().
const noMatch = (query: string) => ({
  addEventListener: () => undefined,
  addListener: () => undefined,
  dispatchEvent: () => false,
  matches: false,
  media: query,
  onchange: null,
  removeEventListener: () => undefined,
  removeListener: () => undefined,
});

Object.defineProperty(window, 'matchMedia', { configurable: true, value: noMatch, writable: true });
Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
  writable: true,
});

// null is what a browser without canvas support returns, and what axe copes with
HTMLCanvasElement.prototype.getContext = () => null;
