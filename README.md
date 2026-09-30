# Venu Gopal Reddy | DevOps & Platform Engineer

A fast, responsive professional portfolio based on the supplied CV and inspired by the user-provided DevOps Portfolio Motion Kit HTML template.

The site uses the template's dark grid, green/cyan palette, terminal motif, pipeline visual, and career-log concept. It replaces the template's example metrics and simulated production claims with experience recorded in the CV. The terminal and diagrams are labelled illustrative. Three public, independent projects are linked with inspectable source and CI runs. The case study explicitly separates synthetic lab work from employment experience.

## Preview

Live at https://ops-blueprint.github.io/venugopalmannuru-it/. To preview locally, serve the repo root with any static server. There are no runtime dependencies or build steps.

## Structure

- `index.html`: semantic site content and navigation
- `style.css`: responsive visual system and reduced-motion support
- `app.js`: accessible migration-phase tabs, mobile menu, copy action, and one-time entrance effects
- `motion.js` + `motion.css`: motion layer: hero network mesh, terminal replay (experience snapshot alternating with an illustrative ops session: terraform, helm, kubectl, argocd), count-up figures, flowing migration and platform traces, auto-advancing phase tabs, scroll-drawn career line, toolkit marquee, cursor spotlight. It only animates existing content and is skipped entirely under `prefers-reduced-motion`.
- `index.html#lat-card`: illustrative live p95 latency chart (deploy, alert above threshold, automatic rollback, recovery). Static SVG without JS; canvas animation with `motion.js`.
- `index.html#wf`: illustrative reusable GitHub Actions workflow run (commit, Maven/Docker build, SonarQube gate, Artifactory, approval, Helm + Argo CD). Shows a passed run without JS; `motion.js` loops it stage by stage.
- `index.html#git-log`: Experience as a newest-first git log. Roles on main, CV achievements on branches that merge into the next role. Static rail without JS; `motion.js` draws the branch curves on scroll.
- `index.html#k8s-sim`: illustrative Kubernetes simulation inside the Platform section (HPA scaling, scheduling, crash + self-heal, event feed). Static snapshot without JS; `motion.js` runs the simulation.
- `index.html#iac`: illustrative Azure Terraform example (VNet, AKS, ACR, PostgreSQL, Key Vault, alert). Renders complete without JS; `motion.js` replays it as a typed `terraform apply`.
- `projects/pipeline-modernization/`: evidence-led project case study
- `assets/fonts/`: self-hosted Geist and JetBrains Mono variable fonts and their OFL licences
- `assets/Venu-Gopal-Reddy-CV.pdf`: supplied CV rendered as PDF

## Performance and accessibility choices

- Complete HTML arrives without client-side rendering.
- No third-party JavaScript (the motion layer is plain JS/CSS), remote font requests, or large image payloads. Two self-hosted variable fonts load with `font-display: swap`.
- Interaction is event-driven; entrance effects run only once and honour reduced-motion settings.
- Navigation and tabs work with keyboard input. Project links are plain anchors.
- Mobile layout avoids horizontal overflow at a 390-pixel viewport.

Employment figures come from the supplied CV and have not been independently verified. The portfolio and CV both link to `venugopalmannuru-it`.
