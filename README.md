# Venu Gopal Reddy | DevOps & Platform Engineer

A fast, responsive professional portfolio based on the supplied CV and inspired by the user-provided DevOps Portfolio Motion Kit HTML template.

The site uses the template's dark grid, neon green/cyan palette, terminal motif, pipeline visual, and career-log concept. It replaces the template's example metrics and simulated production claims with experience recorded in the CV. The terminal and diagrams are labelled illustrative. Planned public projects are labelled planned.

## Preview

Serve `dist/` with a local static server. There are no runtime dependencies or build steps.

## Structure

- `dist/index.html`: semantic site content and navigation
- `dist/style.css`: responsive visual system and reduced-motion support
- `dist/app.js`: accessible migration-phase tabs, mobile menu, copy action, and one-time entrance effects
- `dist/assets/Venu-Gopal-Reddy-CV.pdf`: supplied CV rendered as PDF

## Performance and accessibility choices

- Complete HTML arrives without client-side rendering.
- No third-party JavaScript, web fonts, infinite animation loops, or large image payloads.
- Interaction is event-driven; entrance effects run only once and honour reduced-motion settings.
- Navigation, tabs, and project details work with keyboard input.
- Mobile layout avoids horizontal overflow at a 390-pixel viewport.

Employment figures come from the supplied CV and have not been independently verified. The PDF still links to the user's earlier GitHub account; the site links to `ops-blueprint`.
