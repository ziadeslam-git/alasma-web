// jsdom has no showModal() / close() on <dialog>. This minimal stand-in only toggles the open attribute and fires the
// close event, so component tests can check roles, attributes and callbacks. Real focus trapping, the inert
// background and the top layer are proven in a real browser (e2e/overlays.spec.ts).
const prototype = HTMLDialogElement.prototype;

if (typeof prototype.showModal !== 'function') {
  prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
}

if (typeof prototype.close !== 'function') {
  prototype.close = function close(this: HTMLDialogElement) {
    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    }
  };
}
