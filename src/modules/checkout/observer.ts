// A second, deliberately tiny public entry of the checkout module (Task 12). The root layout needs only the session
// observer; importing it from index.ts made the whole checkout UI part of the first-load JS of every route.
// Used by src/app/layout.tsx only (AGENTS.md and eslint.config.mjs record the exception).
export { AttemptSessionObserver } from './provider/attempt-session-observer';
