
# The Ramaekers Group — Codex Project Instructions

## 1. Project Overview

Project: ramaekersgroup.com

Build a premium corporate advisory website for
The Ramaekers Group, LLC.

The website must communicate:
- Executive authority
- Financial and operational expertise
- Precision and discipline
- Credibility and confidence
- Measurable business results

Core positioning:

"We help serious operators ensure their
strategy actually produces profit."

Primary audience:
- CEOs and business owners
- Presidents and operating executives
- CFOs and financial leadership teams
- Established middle-market businesses
- Primarily manufacturing and construction companies

The website must be professional, authoritative,
restrained, and focused on business outcomes.

Avoid generic consulting language, exaggerated
claims, and unnecessary marketing decoration.

---

## 2. Technology Stack

Framework: Astro
Language: HTML, CSS, JavaScript, TypeScript
Styling: Standard CSS with custom properties
Development Environment: Cursor
AI Coding Agent: OpenAI Codex
Version Control: Git

Architecture requirements:
- Static HTML output by default
- Reusable Astro components
- Shared page layouts
- Centralized design tokens
- Minimal client-side JavaScript
- Semantic HTML
- Responsive, mobile-first design

Do not introduce the following without approval:
- React
- Vue
- Svelte
- Tailwind CSS
- Bootstrap
- Large UI component frameworks
- Unnecessary npm dependencies

Use Astro's built-in capabilities whenever practical.

---

## 3. Executive Command Design System

The official website design system is:

EXECUTIVE COMMAND

Visual philosophy:

Authority without arrogance.
Precision without sterility.
Sophistication without unnecessary decoration.

### Primary Brand Colors

Midnight Navy: #101D2C
Graphite: #283442
Antique Gold: #B3935B
Deep Gold: #80632F
Light Gold: #D6B87E
Warm Ivory: #F7F5F0
White: #FFFFFF
Slate: #465363

### Supporting Colors

Steel Gray: #667587
Light Steel: #D9DFE5
Forest Green: #276749
Burnt Orange: #B65C32
Deep Red: #A63232

### Color Usage

Midnight Navy:
- Main navigation
- Hero sections
- Footer
- Important visual elements

Graphite:
- Secondary dark sections
- Featured content
- Methodology sections

Antique Gold:
- Premium brand accents
- Selected calls to action
- Decorative rules and highlights

Deep Gold:
- Accent text and links on light backgrounds

Light Gold:
- Accent text and links on dark backgrounds

Warm Ivory:
- Alternating content sections
- Case studies
- Supporting content

White:
- Main content backgrounds
- Cards
- Forms

Slate:
- Body text on light backgrounds

Forest Green:
- Positive financial indicators

Burnt Orange and Deep Red:
- Warnings, risks, and negative indicators

Never use color alone to communicate status.

Do not hardcode brand colors inside page components.
Use centralized CSS variables.

---

## 4. Typography

Heading font: Manrope
Body font: Inter

Desktop typography:
- H1: 56px / weight 700
- H2: 40px / weight 700
- H3: 28px / weight 600
- H4: 21px / weight 600
- Body: 17px / weight 400
- Small text: 14px
- Navigation: 14px / weight 600
- Buttons: 14px / weight 700
- Eyebrow labels: 12px / weight 700

Mobile typography:
- H1: 36px
- H2: 30px
- H3: 24px
- Body: minimum 16px

Use responsive CSS typography with clamp()
where appropriate.

Use sentence case for headings.

Reserve uppercase typography for small labels,
navigation categories, and short identifiers.

---

## 5. Design Architecture

Organize the website into five layers.

Layer 1: Design Tokens
- Colors
- Typography
- Spacing
- Borders
- Breakpoints
- Motion

Layer 2: UI Components
- Buttons
- Cards
- Form fields
- Navigation
- Footer
- Tables
- Alerts
- Accordions

Layer 3: Section Components
- Hero
- Services
- Methodology
- Proof
- Testimonials
- Call to Action

Layer 4: Page Templates
- Homepage
- Service Detail
- Industry Detail
- Methodology
- Insights / Article
- Contact / Conversion

Layer 5: Actual Pages
- Content assembled using approved templates

All pages must inherit the global design system.

Do not create independently styled pages.

---

## 6. Recommended File Structure

src/
  styles/
    tokens.css
    typography.css
    global.css
    utilities.css

  components/
    Header.astro
    Footer.astro
    Button.astro
    Card.astro
    FormField.astro

  sections/
    Hero.astro
    Services.astro
    Methodology.astro
    CallToAction.astro

  layouts/
    BaseLayout.astro

  pages/
    index.astro
    services/
    industries/
    insights/
    contact/
    design-system/

The structure may evolve as necessary, but
maintain clear separation of responsibilities.

---

## 7. Component Standards

All reusable components must support:
- Consistent styling
- Responsive behavior
- Appropriate light/dark themes
- Keyboard accessibility
- Visible focus states
- Semantic HTML
- Predictable variants
- Minimal duplication

Buttons:
- Minimum height: 44px
- Corner radius: 6px
- Primary and secondary variants
- Hover, focus, and disabled states

Cards:
- Corner radius: 16px
- Standard padding: 24px
- Subtle borders
- Minimal shadows

Forms:
- Minimum input height: 48px
- Visible labels
- Accessible error messages
- Clear validation
- Consistent focus states

Do not implement decorative interactions
that interfere with usability.

---

## 8. Page Design Standards

Preferred page structure:

1. Global header
2. Hero section
3. Primary content
4. Supporting content
5. Evidence or methodology
6. Call to action
7. Global footer

Use alternating light and dark sections
to establish visual rhythm.

Preferred sequence:

Navy Hero
White Content
Ivory Supporting Section
White Evidence Section
Graphite Feature Section
Navy Call to Action

This sequence is guidance, not a rigid requirement.

Avoid multiple consecutive dark sections unless
there is a specific design reason.

---

## 9. Content Standards

Write for experienced business executives.

Tone:
- Direct
- Credible
- Precise
- Confident
- Practical
- Outcome-oriented

Avoid:
- Generic consultant jargon
- Unsupported performance claims
- Excessive superlatives
- Artificial urgency
- Unnecessary buzzwords

Emphasize:
- Cash flow
- Profitability
- Margin improvement
- Financial visibility
- Operating discipline
- Strategic execution
- Enterprise value

Never invent:
- Client names
- Testimonials
- Case studies
- Financial results
- Certifications
- Awards
- Partnerships

Use clearly identified placeholder content
when approved information is unavailable.

---

## 10. SEO and Performance

Each production page must have:
- Unique page title
- Meta description
- One primary H1
- Semantic heading hierarchy
- Canonical URL
- Appropriate Open Graph metadata
- Descriptive internal links
- Accessible image alt text

Prioritize:
- Fast page loading
- Minimal JavaScript
- Optimized images
- Responsive images
- Minimal layout shift
- Strong Core Web Vitals

Do not add analytics, tracking scripts,
or third-party integrations without approval.

---

## 11. Accessibility

Target WCAG 2.2 AA.

Requirements:
- Sufficient text contrast
- Visible keyboard focus
- Keyboard-operable controls
- Semantic HTML
- Proper form labels
- Accessible error messages
- Reduced-motion support
- Responsive layouts
- No color-only status indicators

Verify contrast before approving color
combinations for production use.

---

## 12. Development

When starting the dev server, use background mode:

    astro dev --background

Manage the background server with:

    astro dev stop
    astro dev status
    astro dev logs

Use the project's installed Astro CLI.

If a documented command is unavailable in the
installed version, verify the correct command
rather than assuming an alternative.

Do not start duplicate development servers.

---

## 13. Testing and Validation

After meaningful code changes:

1. Run the Astro build.
2. Check for compilation errors.
3. Verify affected routes.
4. Test responsive behavior.
5. Check browser console errors.
6. Verify keyboard navigation.
7. Check accessibility issues.
8. Verify internal links.

When browser automation is available,
use Playwright for visual and functional tests.

Test viewport widths:
- 375px
- 430px
- 768px
- 1440px

Do not claim a test passed unless it was run.

---

## 14. Git and Change Management

Use Git for version control.

Development rules:
- Make small, logical changes.
- Preserve working functionality.
- Avoid unnecessary refactoring.
- Do not overwrite user content.
- Do not modify unrelated files.
- Review changes before committing.
- Use descriptive commit messages.

Do not:
- Push to remote repositories without approval.
- Deploy to production without approval.
- Change hosting infrastructure without approval.
- Add external services without approval.

---

## 15. Codex Working Instructions

Before beginning a task:

1. Read this AGENTS.md file.
2. Inspect relevant existing files.
3. Understand the current implementation.
4. Identify reusable components.
5. Follow the Executive Command design system.

During implementation:

1. Prefer existing components.
2. Avoid duplicate CSS.
3. Use semantic design tokens.
4. Keep components small and maintainable.
5. Preserve approved design decisions.
6. Avoid unrelated changes.

After implementation:

1. Run available validation commands.
2. Report what changed.
3. Identify any remaining issues.
4. Explain how to preview the result.
5. Request approval before major architectural changes.

---

## 16. Documentation

Full Astro documentation:
https://docs.astro.build

Consult these guides before working on
related tasks:

- Routing:
  https://docs.astro.build/en/guides/routing/

- Astro Components:
  https://docs.astro.build/en/basics/astro-components/

- Framework Components:
  https://docs.astro.build/en/guides/framework-components/

- Content Collections:
  https://docs.astro.build/en/guides/content-collections/

- Styling:
  https://docs.astro.build/en/guides/styling/

- Internationalization:
  https://docs.astro.build/en/guides/internationalization/

---

## 17. Primary Objective

Build a unified, maintainable, production-quality
website for The Ramaekers Group.

Every page must inherit Executive Command.

A change to the global design system should
propagate consistently throughout the website.

The finished website must communicate
executive authority, operational discipline,
financial expertise, and measurable results.
