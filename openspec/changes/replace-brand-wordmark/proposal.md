## Why

The brand is currently hand-rolled as inline-SVG text ("FTES" + "AOS" + circuit tracing) in the `Logo` block, and the public navbar/favicon still show the old StarCi "S" mark. The user supplied the real logo (`public/logo/FTES_original.svg`) and wants it used everywhere the brand renders.

## What Changes

- `Logo` block renders `public/logo/FTES_original.svg` via `<img>` instead of the inline SVG wordmark. This flows through `BrandLogo` to the authenticated navbar, footer, and app splash.
- Public (shell) navbar shows the same wordmark (`BrandLogo`) instead of the `LogoMark` "S" square.
- Favicon `src/app/icon.svg` replaced with the FTES logo (drops the stale StarCi mark).
- Social/OG image (`config/seo.ts` `ogImage`) points to `public/logo/FTES_original.png`.

Out of scope (flagged, not shipped): the square PWA maskable icon (`manifest.ts` `/logo-icon.png`, 512²) and the `icon.png` raster fallback — a 2.6:1 wordmark can't fill a square icon cleanly; these need a dedicated square export.

## Capabilities

### New Capabilities
- `brand-logo`: how and where the FTES brand lockup renders across the app (wordmark component, navbars, splash, footer, favicon, social image).

## Impact

- `src/components/blocks/identity/Logo/index.tsx` — image instead of inline SVG.
- `src/components/layouts/shell/Navbar/Logo/index.tsx` — use `BrandLogo`.
- `src/app/icon.svg` — replaced with FTES logo.
- `src/config/seo.ts` — `ogImage` path.
- `src/components/svg/LogoMark/index.tsx` — becomes unused (left in place).
- No backend, no new dependency.
