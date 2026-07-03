# Tasks — offers-policy-3d-showcase

- [x] 1.1 `OffersPolicySection.tsx`: import `ShowcaseMockup, SHOWCASE_THEMES` từ
      `@/components/blocks/marketing/ShowcaseMockup`. Bọc `<div>` cột panel phải (khối
      map 8 tabpanel) vào `<ShowcaseMockup url="ftes.edu.vn/uu-dai" tilt="left"
      backdrop="glow" theme={SHOWCASE_THEMES.accent} contentClassName="p-6">`.
- [x] 1.2 Mỗi tabpanel: bỏ `rounded-2xl border border-separator bg-surface p-6`
      (chrome/surface giờ do mockup lo) — giữ `hidden={i !== active}` + `role="tabpanel"`
      + aria (SEO invariant: mounted, chỉ hidden). Header icon + `<ul>` bullet giữ nguyên.
- [x] 1.3 CTA "Browse courses" đặt NGOÀI mockup (dưới, như hiện tại). Tab rail trái
      không đổi.
- [x] 2.1 Verify: `npm run build` (webpack) xanh + `tsc --noEmit` sạch + eslint sạch.
- [x] 2.2 Preview verify (desktop): panel phải có chrome 3 chấm + tilt (computed
      `transform` có `perspective`/`rotate` ở ≥ md); hover → flatten. Mobile: phẳng,
      1 cột. Đổi tab → panel đổi, 8 panel vẫn trong DOM (inactive `hidden`).
- [x] 3.1 Journal: ghi "reuse ShowcaseMockup cho showcase panel bất kỳ; giữ mounted-
      hidden để không vỡ SEO khi bọc vào wrapper" + link design/home-landing.md.
