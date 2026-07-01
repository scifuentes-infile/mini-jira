---
name: Mini Jira Design System
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434654'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#535f73'
  on-secondary: '#ffffff'
  secondary-container: '#d4e0f8'
  on-secondary-container: '#576377'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d7e3fb'
  secondary-fixed-dim: '#bbc7de'
  on-secondary-fixed: '#101c2d'
  on-secondary-fixed-variant: '#3b475b'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  status-todo: '#EBECF0'
  status-in-progress: '#FFAB00'
  status-review: '#5243AA'
  status-blocked: '#DE350B'
  status-done: '#36B37E'
  priority-high: '#BF2600'
  priority-medium: '#FF8B00'
  priority-low: '#0065FF'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is anchored in the **Corporate / Modern** aesthetic, prioritizing clarity, efficiency, and reliability for internal operations. It reflects a professional tool that stays out of the user's way, using high-quality typography and a structured layout to manage complex data without cognitive overload.

The visual language balances the "systematic" nature of ticket management with a friendly, accessible interface. It utilizes:
- **Functional Minimalism:** Generous whitespace to separate concerns and focus on task completion.
- **Subtle Layering:** Using soft shadows and tonal shifts rather than heavy borders to define hierarchy.
- **Information Clarity:** A color-coded status system that provides immediate scannability without being visually aggressive.

## Colors

The palette is designed for high utility and clear categorization. 

- **Primary:** A professional, deep blue used for primary actions, active navigation states, and brand presence.
- **Secondary/Neutral:** A range of cool grays used for typography, borders, and background layering. The background is a very soft gray to reduce eye strain compared to pure white.
- **Status & Priority:** These are functional colors. Status colors use a mix of background tints and solid accents, while Priority colors are used for iconography and high-visibility indicators to signal urgency.

The default mode is **Light**, optimized for day-to-day productivity, though the palette is structured to support a future high-contrast dark mode transition.

## Typography

This design system utilizes **Inter** exclusively to ensure a clean, neutral, and highly legible interface across all ticket densities.

- **Headlines:** Use tighter letter spacing and heavier weights to provide clear section anchoring.
- **Body:** The 14px size is the workhorse for ticket descriptions and comments, optimized for long-form reading within a confined space.
- **Labels:** Small, uppercase, and bold. These are used for "metadata" like ticket IDs, priority tags, and field headers to distinguish them from user-generated content.
- **Scale:** On mobile, `display-lg` should downscale to 24px to prevent horizontal overflow in headers.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for the main content area (max-width: 1440px) while maintaining a fluid sidebar and flexible Kanban columns.

- **Grid System:** A 12-column grid is used for dashboard layouts and ticket detail views.
- **Kanban Flow:** On desktop, columns have a fixed minimum width of 280px with horizontal scrolling. On mobile, the view switches to a single-column vertical list with a tabbed interface for status switching.
- **Spacing Rhythm:** Based on a 4px baseline. Most components use `md` (16px) for internal padding to maintain "generous whitespace" without losing information density.

## Elevation & Depth

Visual hierarchy is established using **Tonal Layers** combined with **Ambient Shadows**.

- **Level 0 (Background):** Used for the main application background (#F4F5F7).
- **Level 1 (Surface):** Pure white (#FFFFFF) surfaces for cards, sidebar, and headers. These use a 1px subtle border (#DFE1E6).
- **Level 2 (Interactive/Floating):** Kanban cards use a soft, diffused shadow (0px 4px 8px rgba(9, 30, 66, 0.08)) to indicate they are draggable and distinct from the background.
- **Level 3 (Overlays):** Modals and dropdowns use a deeper shadow (0px 12px 24px rgba(9, 30, 66, 0.15)) to create a strong separation from the workspace.

## Shapes

The design system uses a **Soft (4px - 8px)** corner radius. This provides a modern, approachable feel while maintaining the professional structure required for an enterprise-style tool.

- **Small elements (4px):** Checkboxes, small tags, and buttons.
- **Medium elements (8px):** Kanban cards, input fields, and modals.
- **Large elements (12px+):** Avatars (circular) and status chips (fully pill-shaped for high contrast with rectangular cards).

## Components

### Buttons
- **Primary:** Solid Professional Blue with white text. High emphasis.
- **Secondary:** Transparent background with Professional Blue text and border.
- **Ghost:** No border or background unless hovered. Used for secondary actions in headers.

### Kanban Cards
- White background, 8px radius, Level 2 shadow.
- Top section: Priority icon (left) and Ticket ID (right, Label-sm style).
- Middle section: Title (Headline-sm, max 2 lines).
- Bottom section: Assignee Avatar (bottom-right) and Label chips (bottom-left).

### Status Chips
- Use the status-specific background color with a high-contrast text color.
- Fully rounded (pill) shape to distinguish them from priority tags.

### Input Fields
- White background with a 1px neutral border. 
- On focus, the border transitions to Professional Blue with a 2px outer glow.
- Error states use the `status-blocked` red for borders and helper text.

### Sidebar Navigation
- Vertical orientation with 240px width.
- Background: Level 0 Neutral Gray.
- Active items use a left-edge blue accent bar and light blue background tint.

### Avatars
- Circular with 32px standard diameter. 
- Use initials for users without images, set against a rotating palette of secondary colors.