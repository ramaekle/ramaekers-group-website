# The Ramaekers Group — Executive Command

Astro website for The Ramaekers Group, built on the Executive Command design
foundation. Phase 2 adds the homepage at `/`. The component showcase remains at
`/design-system/`, with its evaluation-only Typography Lab at
`/design-system/typography/`. Contact actions remain previews until a verified
destination is approved. No service pages, integrations, or deployment are included.

## Local development

Use the Node version specified by `.nvmrc` and `package.json`. Install packages
with `npm ci` when setting up a new checkout.

Check for an existing server before starting one:

```sh
npm run astro -- dev status
```

If none is running, use the installed Astro CLI's background mode:

```sh
npm run dev -- --background
```

Open **http://localhost:4321/design-system/** (or the URL reported by Astro).

```sh
npm run astro -- dev logs
npm run astro -- dev stop
```

## Validation

```sh
npm run check
npm run build
```

`check` runs Astro and TypeScript diagnostics. `build` generates static HTML in
`dist/`. Both checker packages are development dependencies; Astro remains the
only runtime dependency. To inspect a production build locally, run
`npm run preview` and open the showcase route at the reported URL.

Inspect the showcase at 375px, 430px, 768px, and 1440px. Check keyboard focus,
skip navigation, component states, validation, reduced motion, console errors,
and links. Automated checks supplement manual review; they do not establish
complete WCAG conformance.

## Design architecture

Global styles are imported once by `src/layouts/BaseLayout.astro`, in this order:

1. `src/styles/tokens.css`: complete brand palette, type scale, spacing,
   borders, radii, motion, breakpoints, and semantic theme aliases.
2. `src/styles/typography.css`: local font faces and shared text hierarchy.
3. `src/styles/global.css`: reset, focus and selection treatments, buttons,
   cards, fields, and reduced-motion behavior.
4. `src/styles/utilities.css`: shared containers, stacks, clusters, and grids.

Use semantic tokens such as `--surface`, `--heading`, `--text`, `--link`, and
`--control-border` in shared components. Set `data-theme="white"`, `"ivory"`,
`"navy"`, or `"graphite"` on a section to adapt its content and components.
Explicit theme wrappers also support nesting a light section within a dark one.
Do not introduce page-specific brand values.

The spacing scale uses a 4px base. Buttons are at least 44px high with a 6px
radius; inputs are at least 48px high; cards use 24px padding and a 16px radius.
Layouts switch at 48rem and 64rem. CSS custom properties cannot serve as media
query conditions, so keep the documented breakpoint tokens and literal queries
in sync.

`BaseLayout` requires `title` and `description` props, provides metadata,
canonical and Open Graph URLs, the skip link, one main landmark, and shared
header/footer. Its optional `noindex` flag is enabled for the internal showcase.
The canonical origin uses the approved `https://ramaekersgroup.com` domain.

Reusable UI components live in `src/components/`:

- `Header.astro` and `Footer.astro`: wrapping, keyboard-accessible navigation.
  All destinations currently reference real showcase sections. Production
  navigation can be added when its destinations exist.
- `Button.astro`: primary/secondary variants, native button attributes,
  disabled state, and slot content. The default type is `button`; use
  `type="submit"` explicitly for forms. Links can use the shared `button` and
  `button--primary`/`button--secondary` CSS classes. Alternatively, pass `href`
  to Button to render a semantic link with the same variants; link props cannot
  include `disabled` or a button `type`.
- `Card.astro`: semantic article container with shared padding and surface.
- `FormField.astro`: requires a unique `id` and visible `label`; accepts native
  input attributes plus `hint`, `error`, and `success`. It associates messages
  through `aria-describedby` and marks errors with `aria-invalid`.

The showcase's scoped CSS arranges specimens only. All brand and component
styling comes from the shared foundation. Its small vanilla JavaScript module
demonstrates button activation and form validation without sending or saving
information. Validation errors move focus to the field and announce the result.

Future section components and page templates should compose these primitives
through `BaseLayout`. The Phase 2 homepage now follows this pattern.

## Contrast and accessibility

Light themes use slate body text, navy headings, and deep gold links. Dark
themes use light steel body text, white headings, and light gold links. Control
borders use steel gray on light surfaces and light steel on dark surfaces.
Decorative card boundaries use subtler borders.

Antique gold and burnt orange remain available as brand accents, but are not
used for small text on light backgrounds. Semantic warning text uses deep gold
on light surfaces; dark-theme status text uses light steel or light gold.
Every status includes a textual description. Focus indicators adapt to each
theme, and reduced-motion preferences suppress transitions.

## Self-hosted typography

Inter and Manrope are locally hosted Latin variable WOFF2 fonts (about 73KB
combined), with `font-display: swap` and system sans-serif fallbacks. No font
service is contacted by the page. The files were retrieved from Google Fonts:

- [Inter Latin variable font](https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2)
- [Manrope Latin variable font](https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSvfedN4.woff2)

SIL Open Font License notices are included alongside the files in
`public/fonts/inter-OFL.txt` and `public/fonts/manrope-OFL.txt`. Additional
language subsets should be added when multilingual content is approved.

## Phase 1A — Typography Lab

Open **http://localhost:4321/design-system/typography/**, or follow the link in
the showcase's typography section. The lab uses the existing BaseLayout,
header, footer, theme tokens, and UI components. It is an evaluation tool;
production typography and the homepage are unchanged.

Choose heading and body fonts independently. Enable comparison to configure
a second pairing. Heading weight, body size, heading tracking, and preview
theme apply equally to both specimens. Comparison columns stack below 48rem.
Reset restores Manrope / Inter, heading weight 700, body size 17px, tracking
−0.035em, the white theme, and single-panel mode. The lab's heading-weight
control applies uniformly to the H1–H4 visual samples; their sizes retain the
shared responsive type scale. Selections are not persisted.

Implementation is isolated to:

- `src/pages/design-system/typography/index.astro`: route and evaluation controls.
- `src/components/design-system/TypographySpecimen.astro`: identical content
  reused by both comparison panels.
- `src/data/typography-lab.ts`: available font families and genuine weights.
- `src/scripts/typography-lab.ts`: live controls, loading verification, reset,
  and sample button feedback.
- `src/styles/typography-lab.css`: lab layout and specimen-only typography overrides.
- `src/styles/typography-lab-fonts.css`: additional faces imported only by this route.
- `public/fonts/typography-lab/`: twelve Latin WOFF2 files, six original SIL
  licenses, and `SOURCES.txt` recording download locations.

Inter and Manrope reuse their existing local font files. The other six families
are self-hosted too; no Google Fonts connection is needed while using the lab.
The browser loads only selected faces. A specimen stays hidden until the
requested fonts load successfully; a visible error replaces it if loading fails.

Real weight availability is explicit. Lato has 400/700/900 faces, so requests
for 500/600/800 map to 400/700/900 respectively. Josefin Sans and the existing
Inter CSS declaration stop at 700, so their 800 requests use 700. The panel
reports requested and available heading weights when they differ. Synthetic
weights are disabled. No existing font declarations were expanded or replaced.

The financial metric is illustrative sample content, not a client performance
claim. Fields and sample actions do not send or save information.

## Phase 2 — Homepage

Open **http://localhost:4321/** using the existing development server. The homepage
composes eight components in `src/sections/home/`: Hero, Positioning, Challenges,
Services, Approach, Audience, Differentiation, and CallToAction. Shared section
introductions use `src/components/SectionHeading.astro`; layout-only styling
is isolated to `src/styles/home.css`. Colors, fonts, spacing, cards, buttons,
and theme behavior continue to inherit the existing foundation.

`BaseLayout` accepts `navigation="homepage"` for production header/footer content
and `appendBrand={false}` when the supplied title is already complete. The
reference navigation remains the default for both design-system routes. Homepage
navigation points to real sections on `/`; no extra production pages were added.

Two release prerequisites are intentionally explicit in this local preview:

- Both **Start a Conversation** buttons are disabled, with visible notes and
  associated descriptions stating that their contact destination is pending
  approval. No email address, scheduling service, or contact page was invented.
- **Explore the Black Ops Playbook** is a disabled methodology preview. Its
  planned destination is `/approach/black-ops-playbook/`, but no `href` is emitted
  until that page exists. The methodology page is outside Phase 2.

The homepage ships static HTML and CSS with no custom client-side JavaScript.
It uses the exact requested title, description, canonical URL, and shared Open
Graph metadata. No client results, logos, testimonials, or financial figures
were invented. Phase 1 tokens, approved font declarations, the showcase, and
the Typography Lab are preserved.

## Phase 2B — Four-treatment hero

The hero now has four approved treatments controlled by one typed configuration
and a client module. Review `/?hero=A`, `/?hero=B`, `/?hero=C`, and `/?hero=D`.
Preview requests never initialize analytics. PostHog is **disabled and
configuration-ready, not live**. All four final photographs are missing;
treatments use the approved navy fallback.

Run `npm run test:hero` for experiment state-machine and privacy tests.
See [the experiment guide](docs/analytics/hero-experiment.md) for native exposure,
consent, the optional browser SDK test, dashboard specifications, conversion
dependencies, environment setup, and rollback. Phase 2's no-JavaScript statement
above describes that phase; Phase 2B adds only experiment/consent behavior,
with the official SDK loaded on demand after consent.
