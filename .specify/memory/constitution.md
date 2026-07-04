<!--
[SYNC IMPACT REPORT]
Version change: None -> 1.0.0
List of modified principles:
  - Added: I. Full-screen & Slide-over Layouts for Detail Views
  - Added: II. Client-side Persistence & Auto-saving Resizable Columns
  - Added: III. Robust Client-side Simulation & Graceful Degradation
  - Added: IV. TypeScript and React Build Rigor
  - Added: V. Rich Visual Aesthetics & Micro-interactions
Added sections:
  - UI Components & Design System Constraints
  - Development Workflow & Code Integrity
Removed sections:
  - None
Templates requiring updates:
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
Follow-up TODOs:
  - None
-->

# V-com-ERP Constitution

## Core Principles

### I. Full-screen & Slide-over Layouts for Detail Views
Detail views (such as employee profiles, product details, contract managers, and request details) MUST use a fullscreen modal or slide-over layout to maximize work area and ensure a clean, responsive layout. Centered popups (modlets) are restricted only to minor settings, confirmations, or brief alerts.

### II. Client-side Persistence & Auto-saving Resizable Columns
Every listing or datagrid table MUST allow users to drag-resize column headers via the `ResizableTh` component. These column widths MUST automatically save and load to/from `localStorage` using unique keys via the `useTableColumns` hook to preserve layout states.

### III. Robust Client-side Simulation & Graceful Degradation
The application operates in a client-side sandbox. All external integrations (such as API calls, PDF OCR scanning, document uploads, and signature verification) MUST implement robust local simulated state changes, loaders, and timeouts to guarantee fully functional offline presentation.

### IV. TypeScript and React Build Rigor
Every codebase modification MUST compile cleanly with TypeScript. Mismatched JSX closing tags, syntax errors, or unmapped imports are unacceptable. The project must build successfully using `npm run build` prior to completion.

### V. Rich Visual Aesthetics & Micro-interactions
All user interfaces MUST feel modern, clean, and premium. Implement smooth gradients, glassmorphism, tailored HSL color schemes, active transitions, and micro-animations instead of basic browser defaults or unstyled text components.

## UI Components & Design System Constraints
Layouts must respect the unified dashboard styling. Standard HTML elements like `<dialog>` and `<popover>` or custom `<Modal>` wrappers must align with the global styling variables, avoiding unstyled or generic elements.

## Development Workflow & Code Integrity
- Avoid placeholders for images or mock data; utilize realistic simulated datasets or mock images to represent functionality.
- Preserve all existing code comments and docstrings when editing.
- Validate changes through verification builds (`npm run build`) before pushing changes.

## Governance
All proposed changes to the project structure or codebase must align with these core principles. The constitution is a living document; amendments require version bumps and updating all dependent templates to maintain sync.

**Version**: 1.0.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
