export const DEFAULT_TOAST_DURATION = 5000;
export const DEFAULT_MAX_VISIBLE_TOASTS = 3;
// Must match the toast-exit animation in toast.module.css (0.2s). The toast is removed by this timer, never by waiting
// for an animation event, so it also goes away when the animation does not run.
export const TOAST_EXIT_DURATION = 200;
