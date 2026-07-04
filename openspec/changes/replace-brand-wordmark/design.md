## Context

Brand is centralized: `BrandLogo` → `Logo` feeds authenticated navbar + footer + splash; the public shell navbar uses a separate `LogoMark` "S". The supplied asset `public/logo/FTES_original.svg` is a fixed-color gradient wordmark (viewBox 6381×2439, ~2.6:1). No `currentColor`, so it looks identical in light/dark — no black/white variants needed.

## Approach

- **`Logo` block** → replace the inline `<svg>` with `<img src="/logo/FTES_original.svg" alt="FTES AOS" />`, keep the `className` prop, default `h-8 w-auto`. Raw `<img>` (accepted pattern in `blocks/`), no next/image config needed for a static `/public` SVG. Drop the theme/currentColor doc — the asset carries its own colors.
- **Shell navbar `Logo`** → swap `<LogoMark className="size-10" />` for `<BrandLogo />` inside the existing home `Link`. `LogoMark` becomes unused; left in place (harmless, may be wanted later for a square mark).
- **Favicon** → overwrite `src/app/icon.svg` with the `FTES_original.svg` content.
- **OG image** → `config/seo.ts` `ogImage: "/logo/FTES_original.png"`.

## Trade-offs / flagged

- **Square icon slots not changed:** `manifest.ts` `/logo-icon.png` (512² maskable PWA icon) and `src/app/icon.png` (raster favicon fallback) are square; a 2.6:1 wordmark letterboxes badly there. Leaving them rather than shipping a squished maskable icon — a dedicated square export (mark-only) is the right fix, deferred.
- **Favicon at tiny sizes:** the wordmark is legible as a tab icon but small; same square-export caveat applies if crispness at 16px matters.

## Verify

`tsc --noEmit` clean + `next build --webpack` green. Spot-check the logo shows in navbar (auth + public), footer, splash, and the browser tab.
