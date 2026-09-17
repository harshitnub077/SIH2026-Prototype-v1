# Implementation Plan: Mobile-First Field Officer Experience

## Goal
Transform the web application into a high-performance, thumb-friendly Progressive Web App (PWA) tailored specifically for field officers performing rapid compliance scans on mobile devices in warehouses and retail environments.

## Background Context
The current mobile UI feels like a "desktop website shrunk down." Top-anchored hamburger menus, horizontal data tables, and standard web forms slow down officers who need to operate the app with one hand while holding a physical product in the other.

## Open Questions
- For the Bottom Navigation Bar, should the three tabs be exactly **Dashboard**, **Scan**, and **History**? (Are there any other critical pages a field officer needs one-tap access to?)

## Proposed Changes

---

### Navigation Layer

#### [MODIFY] `frontend/components/NavBar.jsx`
- **Action:** Remove the clunky mobile hamburger menu. The top navigation bar on mobile will now be ultra-minimal, showing only the official Legal Metrology Logo and the user's profile avatar.

#### [NEW] `frontend/components/BottomNav.jsx`
- **Action:** Create a highly polished, iOS/Android style fixed Bottom Navigation Bar.
- **Details:** 
  - Fixed to `bottom-0 w-full z-50`.
  - 3 massive, thumb-friendly touch targets with icons: Dashboard, Scan (Upload), History.
  - Active tab will receive a premium glowing `var(--color-primary)` indicator.
  - Includes a frosted glass backdrop (`backdrop-blur-xl bg-background/80`) to match the premium aesthetic.

---

### Core Workflows

#### [MODIFY] `frontend/app/upload/page.jsx`
- **Action:** Redesign into a "Camera Viewfinder" layout.
- **Details:**
  - The image upload dropzone will scale to take up maximum available height on mobile, looking like a native camera app.
  - The "Run Compliance Check" button will be made completely sticky at the bottom of the screen with a massive touch target (`min-h-[56px]`), ensuring officers can hit it blindly with their thumb.

#### [MODIFY] `frontend/app/results/[id]/page.jsx`
- **Action:** Eliminate horizontal scrolling and introduce Floating Action Buttons (FAB).
- **Details:**
  - Convert side-by-side data tables into stacked definition lists (`<dl>`) so data flows purely vertically.
  - The "Download Notice" and "Export CSV" buttons will transform into a Floating Action Button (FAB) locked to the bottom-right corner on mobile screens, allowing instant access to reports without scrolling.

#### [MODIFY] `frontend/app/layout.jsx`
- **Action:** Inject the new `<BottomNav />` component so it persists across all pages. Add a global `pb-20` (padding-bottom) to the main wrapper on mobile to ensure content isn't hidden behind the bottom tab bar.

#### [MODIFY] `frontend/app/globals.css`
- **Action:** Add CSS classes for active touch states (`.active-press:active { transform: scale(0.96) }`) to simulate haptic feedback visually.

## Verification Plan
1. Emulate a mobile device (iPhone 14) in browser DevTools.
2. Verify the Bottom Nav is fixed and switches routes instantly without full-page reloading.
3. Verify the Upload page feels like a one-handed viewfinder.
4. Verify the Results page tables do not trigger horizontal scrolling.
