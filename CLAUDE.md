@AGENTS.md

## Design frames are code to port (highest priority)

This rule wins over every other frontend rule and over any agent's own taste. Owner decision, final.

- `design/*.dc.html` (with `design/*.css`) are the FINAL design and the SOURCE CODE of every screen.
- COPY the frame's markup structure and CSS values (sizes, spacing, radii, colors, typography, breakpoints) region by
  region into our CSS Modules and TSX. Then only wire real data, routing, state and handlers.
- Never re-design, re-interpret or "build then compare". "Close to the frame" and "close enough" are failures.
- Reuse a shared component only if it renders the frame's exact markup and values. Otherwise restyle or replace it.
- Use a token only where it equals the frame's value. Otherwise add a token with the exact frame value and say so.
- Navigation, buttons, pages, navbar, sidebar and footer must be wired exactly as the frame's architecture shows.
  A target with no page or API yet uses the inert "soon" pattern, never a fake page.
- The ONLY allowed differences are missing API data and unavailable images. Name each one under Deviations.
- Verify with a pixel diff: Playwright screenshots of the frame and the built page, same data, at 390 and 1280. Inspect
  it region by region and fix every difference before reporting. Report the region table and the side-by-side images.
