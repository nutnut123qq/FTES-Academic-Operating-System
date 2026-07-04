## 1. Wordmark

- [x] 1.1 `blocks/identity/Logo/index.tsx` → render `<img src="/logo/FTES_original.svg" alt="FTES AOS">` (keep className, default `h-8 w-auto`).
- [x] 1.2 `layouts/shell/Navbar/Logo/index.tsx` → use `<BrandLogo />` instead of `<LogoMark />`.

## 2. Icons / metadata

- [x] 2.1 Overwrite `src/app/icon.svg` with `public/logo/FTES_original.svg` content.
- [x] 2.2 `config/seo.ts` `ogImage` → `/logo/FTES_original.png`.

## 3. Verify

- [x] 3.1 `tsc --noEmit` clean.
- [x] 3.2 `next build --webpack` green.
- [x] 3.3 Logo shows in navbar (auth + public), footer, splash, browser tab.
