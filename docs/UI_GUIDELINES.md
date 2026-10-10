# UI Guidelines & Design System: Cafe Olive

This document details the visual identity, styling conventions, typography, and UI tokens used across Cafe Olive's customer-facing and administrator interfaces.

---

## 1. Visual Brand Identity

- **Brand Name**: OLIV (often stylized as `O L I V` with character tracking)
- **Theme Concept**: "Organic Sophistication" and "Taste the Calm".
- **Visual Aesthetic**: Smooth gradients, warm color tones, rounded elements, subtle drop-shadows, animations, and arch-frame container motifs.

---

## 2. Color Palette

Tailwind variables are configured to match the brand palette:

### A. Primary Brand Colors
- **`primary`** (`#004435`): Deep Forest Green. Used for major headers and primary text branding.
- **`primary-container`** / **`deep-olive`** (`#0b5d4b`): Primary action background.
- **`soft-gold`** (`#e7c17a`): Warm metallic gold accents. Used for badges, star ratings, and key call-to-actions.
- **`ivory-surface`** / **`background`** / **`surface`** (`#fff8f5`): Warm cream/ivory backdrop.

### B. Legacy Dashboard Accents (used by Admin/KDS/Service Panels)
- **`oliv-green`**: `#3E5641`
- **`oliv-gold`**: `#C5A059`
- **`oliv-cream`**: `#F9F6EE`
- **`oliv-dark`**: `#2C2621`

---

## 3. Typography

Cafe Olive imports two Google Fonts: **Playfair Display** (serif) and **Montserrat** (sans-serif).

- **Serif (Headings)**: `'Playfair Display', serif`
  - Used for large title text (`h1`, `h2`, `h3`, page headers).
- **Sans-Serif (Body & Labels)**: `'Montserrat', sans-serif`
  - Used for descriptive paragraph text, tables, buttons, form inputs, and navigation elements.

---

## 4. UI Elements & Tokens

### A. Buttons (Tailwind utility-extended components in `index.css`)
- **Stitch Primary (`.btn-stitch-primary`)**:
  - CSS: `bg-primary-container text-white font-medium px-8 py-3 rounded-full hover:bg-primary shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`
- **Stitch Outline (`.btn-stitch-outline`)**:
  - CSS: `border border-outline text-primary font-medium px-8 py-3 rounded-full hover:bg-primary hover:text-white hover:-translate-y-0.5 active:translate-y-0`
- **Stitch Gold (`.btn-stitch-gold`)**:
  - CSS: `bg-soft-gold text-primary font-medium px-8 py-3 rounded-full hover:brightness-110 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`
- **Legacy Premium (`.btn-premium`)**:
  - CSS: `bg-deep-olive text-white px-8 py-3 rounded-full hover:bg-primary hover:-translate-y-0.5`

### B. Containers & Panels
- **Stitch Glass Panel (`.glass-panel`)**:
  - CSS: `background: rgba(255, 248, 245, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(233, 225, 220, 0.5);`
- **Arch Frame (`.arch-frame`)**:
  - CSS: `border-radius: 9999px 9999px 1rem 1rem; overflow: hidden;`
  - Often housing high-quality unsplash imagery of food/venue setups.

### C. Shadow and Border Variables
- **`soft-shadow`**: `box-shadow: 0px 20px 40px rgba(0, 0, 0, 0.04);`
- **`borderRadius`**: Default: `1rem` (16px), Large: `2rem` (32px), XL: `3rem` (48px)
- **`maxWidth`**: Container-max: `1280px`

---

## 5. Responsive Behavior & Dark Mode

- **Layout Structure**: Major grids are built using Tailwind responsive utility breakpoints (e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- **Mobile Menu**: Hidden desktop navigation transforms into a clean mobile hamburger menu overlay (`Navbar.jsx`).
- **Dark Mode**: Supports tailwind class-based dark mode (`darkMode: 'class'`). Dark backgrounds transition to `#1e1b18` (`on-background` inverses to white). Dark toggle uses `ThemeToggle.jsx`.
