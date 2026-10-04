---
name: Precision Energy Intelligence
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  metric-display:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.03em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.25rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

The design system embodies an authoritative, mission-critical energy management aesthetic tailored for facility directors, sustainability executives, and grid operators. The visual atmosphere balances high-density industrial telemetry with modern SaaS refinement: purposeful, calm under pressure, and analytically rigorous.

The core design style is **Corporate / Modern** merged with **Subtle High-Density Tech**. Surfaces are crisp and structured, drawing inspiration from modern utility telemetry and precision developer tooling. The user interface prioritizes clarity, sub-second comprehension of anomalies, and visible validation of carbon and cost reduction. Visual weight is strictly functional—ornamentation is eschewed in favor of razor-thin structural borders, precise categorical telemetry accents, and unmistakable semantic alert states.

## Colors

The system uses a deliberate multi-role color architecture calibrated for continuous operational monitoring, real-time demand shifting, and enterprise reporting.

- **Primary (`#059669` / Emerald):** Denotes optimized performance, automated demand reduction, verified energy savings, and baseline efficiency gains. Secondary emerald tint (`#10B981`) serves as the hover and active telemetry signal.
- **Secondary (`#0EA5E9` / Electric Cyan):** Dedicated to grid status, baseline power draw, live submeter telemetry, and current utility load curves. Works in tandem with `#3B82F6` for multi-circuit comparators.
- **Tertiary (`#F59E0B` / Amber):** Reserved strictly for demand-response dispatch notices, peak tariff windows, threshold warnings, and shed events. Accentuated by `#EA580C` for critical peak penalties.
- **Neutral (`#0F172A` / Deep Slate):** Anchors typographic hierarchy, structural borders, and dark operational modes. Neutral steps include `#1E293B` for high-contrast interactive elements and `#334155` for muted captions.
- **Canvas & Surface:** Layered transitions from pure white (`#FFFFFF`) for elevated cards to crisp off-white slate (`#F8FAFC`) for page canvases, with `#F1F5F9` providing panel separators.

All color pairings maintain strict WCAG AAA contrast ratios for tabular data and AA for micro-badges and trend indicators.

## Typography

Typography prioritizes tabular clarity and instant scanability. Inter provides a neutral, highly legible foundation for general navigation, card headings, and systemic feedback. JetBrains Mono is paired specifically for electrical units (kW, kWh, PF, kVA), temporal timestamps, demand tariff thresholds, and dense telemetry tables to prevent layout jitter during real-time data streaming.

Font weights are constrained strictly to 400 (Regular), 500 (Medium), 600 (Semibold), and 700 (Bold). Large numerical callouts (`metric-display`) leverage proportional numbers with tabular alignment enabled via font features (`tnum`), preventing layout jump when values update over live WebSockets.

## Layout & Spacing

The layout operates on a flexible 12-column grid designed for data-dense executive and operational dashboards. 

- **Desktop (1280px+):** 12-column fluid grid, 24px (`space-xl`) margins, 20px (`gutter-lg`) gutters. Allows 3-way telemetry splits (4-4-4) and main chart / side-drawer configurations (8-4).
- **Tablet (768px - 1279px):** 8-column layout with 20px margins and 16px gutters. Telemetry cards collapse to 4-column halves; complex line charts retain full 8-column width.
- **Mobile (<767px):** 4-column layout with 16px canvas margins and 12px gutters. Telemetry stacks vertically, tables transition to stacked data cards, and time-window segment pickers convert to scrollable rails.

Vertical rhythm adheres to a strict 4px/8px incremental rhythm. Micro-spacings (`space-xs`, `space-sm`) structure metric badge interiors, while larger tokens (`space-lg`, `space-xl`) isolate distinct building sub-system zones.

## Elevation & Depth

Visual hierarchy relies on crisp, low-contrast structural outlines rather than heavy atmospheric drop shadows. Surfaces feel machined, precise, and flat-stacked.

- **Level 0 (Canvas Base):** Ground layer tinted at `#F8FAFC`. Completely flat with zero elevation.
- **Level 1 (Card & Modular Paneling):** Solid `#FFFFFF` surface bounded by a crisp 1px stroke of `#E2E8F0`. Shadow is microscopic and diffused: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Dropdowns, Popovers & Hover Cards):** `#FFFFFF` surface with `#CBD5E1` border and a soft ambient shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modal Dialogs & Emergency Dispatch Alerts):** Elevated overlays utilizing `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` surrounded by a high-definition border `#94A3B8`. Modals employ a backdrop scrim with 40% `#0F172A` opacity and a subtle 2px blur.

## Shapes

The design system employs a soft, restrained corner radius (`roundedness: 1`), instilling a modern, clinical, engineering-grade feel that avoids playful bubble shapes.

- Standard buttons, input bars, segmented controls, and metric chips: `0.25rem` (4px).
- Dashboard cards, alert banners, and analytics charts: `rounded-lg` at `0.5rem` (8px).
- Floating action sheets and dialog viewports: `rounded-xl` at `0.75rem` (12px).
- Status indicator dots, user presence marks, and switch thumbs: `9999px` (Pill/Circle).

## Components

### Buttons
- **Primary Action (Shed Demand / Optimize):** Background `#059669`, text `#FFFFFF`, borderless. Hover state `#047857`. Focus ring: 2px offset with 2px ring `#10B981`.
- **Secondary (Inspect / Export):** Background `#FFFFFF`, text `#0F172A`, 1px border `#E2E8F0`. Hover state `#F8FAFC` and border `#CBD5E1`.
- **Destructive / Peak Alert Override:** Background `#EF4444`, text `#FFFFFF`, hover `#DC2626`.
- Height: Small (32px for table micro-actions), Medium (38px standard), Large (44px for primary dashboard dispatch triggers).

### Cards & Dashboards Paneling
Cards utilize white backgrounds with `#E2E8F0` borders and 8px radii. Headers include a flex container with a semibold title (`body-md`), a monospace sub-metric badge, and an optional segmented range picker. Chart containers maintain an internal padding of `space-lg` (16px) with zero border between the canvas and interactive crosshairs.

### Metric Chips & Badges
- Small, uppercase, monospaced metadata containers with 4px radii and internal padding of `2px 8px`.
- **Savings / Net Zero:** `#ECFDF5` background, `#065F46` text, `#A7F3D0` border.
- **Grid Alert / Peak Window:** `#FFFBEB` background, `#92400E` text, `#FDE68A` border.
- **Live Circuit Telemetry:** `#F0F9FF` background, `#075985` text, `#BAE6FD` border.

### Inputs & Select Fields
Base surface `#FFFFFF` with 1px border `#CBD5E1` and 4px radius. Height is 38px with horizontal padding of 12px. Placeholder text uses `#94A3B8`. Focus state shifts the border to `#0EA5E9` with an ambient glow of `0 0 0 3px rgba(14, 165, 233, 0.15)`.

### Switches & Interactive Toggles
Toggles (for automated DR participation or load shifting) measure 36px width by 20px height. Track is `#CBD5E1` when disabled and shifts smoothly (150ms ease-out) to `#059669` when active. Thumb is pure white `#FFFFFF` with a crisp 1px shadow, moving with a 2px interior gutter.

### Checkboxes & Radios
Form controls feature 16px square (checkbox) or circular (radio) dimensions with 1px border `#94A3B8`. Selected state utilizes primary emerald `#059669` with an internal white check or dot.

### Specialized Energy Components
- **Demand Response Countdown Banner:** High-priority strip pinned at the card or viewport top, sporting a 1px border in `#F59E0B` with an amber pulse dot and monospaced countdown clock.
- **Sparkline KPI Rows:** Inline condensed metric cards displaying live kW load, deviation from 24h baseline as a percentage badge, and an embedded SVG sparkline without axes.