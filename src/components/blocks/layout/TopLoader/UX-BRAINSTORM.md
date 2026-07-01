# UX Brainstorm — Top loading bar + entry Suspense splash

> `/starci-fe-ux-brainstorm` · 2026-06-27 · Opus MAX. KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.
> Yêu cầu thầy: *"Tạo trang suspense với mỗi khi load trang có cái thanh lướt trên đầu trang."*

## 0. Đề bài = 2 mảnh của 1 HỆ THỐNG loading (thầy chốt 2026-06-27)
Thầy làm rõ: **"Suspense" = màn render khi MỚI VÀO WEB** (cold load splash), KHÔNG phải skeleton từng route.

| Mảnh | Khi nào | Affordance |
|---|---|---|
| **Trang Suspense (splash)** | mở web / hard refresh (cold) | **màn full-screen**: thanh accent trượt mép trên + logo StarCi giữa → xong thì mờ vào app |
| **Thanh lướt (top bar)** | mỗi lần điều hướng SPA trong app (click Link / router.push / back-forward) | **thanh accent 3px** trượt ở mép trên, trickle → 100% rồi mờ |

→ Splash + top bar **dùng CHUNG đúng 1 thanh accent** = 1 hệ thống nhất quán. Cold load thấy splash; sau đó mọi nav thấy thanh lướt. Không bao giờ "đứng im không biết có đang load".
(Per-route `loading.tsx` skeleton = thứ KHÁC, optional, để đợt sau — xem §6.)

> **✅ ĐÃ CHỐT (thầy duyệt 2026-06-27):** thanh lướt = **hướng A** (đường accent 3px, không glow) · trang Suspense = **splash hướng 1** (logo + thanh accent + "Đang tải…"). → sẵn sàng `/starci-fe-ux-apply`.

## 1. Mục tiêu (≤30s / first impression)
- Người học bấm chuyển trang → **trong <100ms thấy có gì đó đang chạy** (giảm cảm giác "lag/đơ").
- KHÔNG chớp nháy khi điều hướng nhanh (route đã prefetch → đừng nháy bar 1 frame).
- Khung trang đích **không nhảy layout** khi data về (skeleton mirror).
- Tôn trọng `prefers-reduced-motion`.
- Đúng "da" StarCi: **phẳng, border + no-shadow, accent là CHI TIẾT mảnh, design restraint** (ref [[highlight-accent-as-detail-not-block-fill]] · [[whitespace-over-dividers]] · card global border+no-shadow).

## 2. Grounding (đã scan — KHÔNG đoán)
- Stack: **Next 16.1.6 · React 19.2.3** (FE `D:\Repositories\starci-academy`, branch `final-mvp`). `useLinkStatus` (Next 15.3+) CÓ.
- **Chưa có** loader nào: không `nprogress`/`nextjs-toploader`/`@bprogress`/`holy-loader`. Greenfield.
- **Chưa có** `loading.tsx` nào dưới `src/app/**`. Chỉ 1 `<Suspense>` ở `InnerLayout.tsx` (không fallback).
- App shell mount provider tại `src/app/InnerLayout.tsx`: `NextThemes → HeroUI → Redux → Swr → (sideEffects) → Navbar → ModalContainer → DrawerContainer → {children} → Footer? → Toast`. → mount `<TopLoader/>` **trong SwrProvider, trước `<Navbar/>`**.
- Navbar: `src/components/features/navbar/Navbar/index.tsx` — `sticky top-0 z-50 h-16` (64px), `border-b`. → bar phải `fixed top-0 z-[60]` (trên navbar).
- Token accent (light+dark giống nhau): `--accent: oklch(70.03% 0.2092 354.13)` (hồng hue 354). `--surface`/`--background`/`--default`/`--muted` đủ cho skeleton.
- Skeleton: block compound `src/components/blocks/skeleton/Skeleton` (Skeleton.Typography/Paragraph/Card/Avatar/SegmentBar/ListRow… shimmer HeroUI). `AsyncContent` (`blocks/async/AsyncContent`) priority `error→loading→empty→content`, prop `skeleton` mirror layout. → fallback route DÙNG LẠI đúng các skeleton này (đồng nhất per-region).
- Keyframes có sẵn `globals.css`: `wireFlow`, `emberRise`, `reactionPop`. → thêm 1 keyframe nhỏ cho bar nếu cần (hoặc drive bằng JS motion value).
- Nhà để block: `src/components/blocks/layout/TopLoader/` (cạnh PageContainer/PageHeader/AmbientBackground).

## 3. Kỹ thuật — top bar (chốt ở `/apply`, ghi để khỏi quên)
Next App Router **cố ý KHÔNG có router events global** (tránh "spooky action at a distance" — [Next docs](https://nextjs.org/docs/app/getting-started/linking-and-navigating)). 3 cách:

| Cách | Bản chất | Đánh giá |
|---|---|---|
| **A. React `useTransition` + progress hook + wrap router/Link** (Sam Selikoff / buildui) | framework-agnostic, robust-to-interruption: `start()` → trickle tới ~90% → `done()` trong transition callback → 100% + fade | ✅ **chốt**: chuẩn React 19, không dep, robust khi bấm liên tiếp (transition cũ bị huỷ êm) |
| **B. `nextjs-toploader` (nprogress)** | zero-config, intercept click global | ❌ thêm dep + di sản nprogress (peg/glow) + intercept click toàn cục; khó theo token |
| **C. `useLinkStatus`** (per-Link `{pending}`) | chỉ pending của 1 `<Link>` | ❌ KHÔNG phải bar global ("only last link's pending"); chỉ hợp hint inline. Dùng BỔ SUNG cho nút prefetch=false, KHÔNG làm bar chính |

→ **Top bar = cách A** (hook `useProgress` + provider mount 1 lần). Trickle indeterminate (không có % thật cho route load): start nhanh ~38% → bò tới ~90% → khi transition done thì 100% + fade. **Delay ~100ms trước khi hiện** (route prefetch nhanh thì khỏi nháy — đúng khuyến nghị [useLinkStatus docs](https://nextjs.org/docs/app/api-reference/functions/use-link-status) về fast-navigation flash).

## 4. Ba HƯỚNG style (widget đã render) — neo ref
| | Mô tả | Ref | Trade-off |
|---|---|---|---|
| **A · đường accent mảnh** ⭐ | 3px solid `--accent`, KHÔNG glow/peg, trickle → 100% rồi mờ | GitHub / Vercel / Linear top bar | Sạch, đúng "accent-là-chi-tiet" + "no-shadow" của StarCi. Ít "đã mắt" nhất — nhưng đó là điểm cộng theo design restraint |
| **B · nprogress cổ điển** | 3px + "peg" sáng + glow ở đầu mút | nprogress / nextjs-toploader default | "Sống động" hơn — nhưng **glow/shadow chọi luật flat no-shadow** của StarCi (card global = border, no shadow). Hơi cũ |
| **C · gradient shimmer** | accent→hồng nhạt + vệt sáng chạy | YouTube đỏ / brand-gradient bars | Branded/vui — nhưng busier, dễ "quá đà"; StarCi chưa dùng gradient ở chrome (chỉ heat ramp data-viz) |

**Chốt đề xuất: A.** Lý do: cả "họ" rule StarCi đẩy về RESTRAINT — accent là gia vị mảnh, card no-shadow, ngăn bằng whitespace. 1 đường hồng 3px ở mép trên = accent-as-detail hoàn hảo; peg/glow (B) phá luật no-shadow, gradient (C) thêm visual weight không cần. Height **3px** (2px mảnh quá dễ miss trên hi-dpi, 4px hơi nặng). Bo góc 0 (chạm mép trên). Reduced-motion → bar tĩnh mảnh hiện/ẩn theo pending (không trickle).

## 5. Section → trigger → affordance (map)
| Trigger | Affordance | Nguồn / block |
|---|---|---|
| Mở web / hard refresh (cold) | **Splash full-screen** (logo + thanh accent) | `blocks/layout/AppSplash` (mới) → `<Suspense fallback>` ở `InnerLayout` |
| Bấm `<Link>` / `router.push` / back-forward | **Top bar** trickle (hướng A) | `blocks/layout/TopLoader` (mới) + hook `useProgress` + wrap navigation |
| Region trong trang fetch SWR | `AsyncContent` skeleton (đã có, GIỮ) | `blocks/async/AsyncContent` |
| (optional, đợt sau) route nặng điều hướng | `loading.tsx` skeleton mirror | `blocks/skeleton/Skeleton.*` — §6b |

## 6. Trang Suspense vào web (splash) — thầy chốt làm
Màn full-screen render khi cold load (mở web / hard refresh), mờ đi khi app sẵn sàng.
- **Hook kỹ thuật:** `InnerLayout.tsx` đã có sẵn `<Suspense>` (không fallback) → cấp `fallback={<AppSplash/>}`. App splash hiện trong lúc app shell / route đầu stream + trước hydrate; xong tự thay bằng app. (Có thể kèm 1 `mounted` gate để fade mượt, tôn trọng anti-flash của theme provider.)
- **Block:** `blocks/layout/AppSplash` (mới) — dùng LẠI cùng thanh accent của `TopLoader` ở mép trên + logo StarCi giữa.
- **2 hướng splash (widget đã render):**
  - **1 · logo + thanh accent** ⭐ — logo pulse nhẹ + thanh accent trượt mép trên + "Đang tải…". Minimal, nhất quán với top bar. **Đề xuất.**
  - **2 · logo + 3 chấm nhảy** — thêm spinner dạng dots. "Loading-y" hơn nhưng thêm 1 motif chuyển động (hơi thừa khi đã có thanh accent).
- **Reduced-motion:** logo + bar tĩnh (không pulse/trickle), chỉ fade.

### 6b. (Optional, đợt sau) per-route `loading.tsx` skeleton
KHÔNG nằm trong đợt này. Nếu sau muốn route nặng (dashboard / learn / course / profile) có skeleton mirror khi điều hướng → chạy `/starci-fe-skeleton-apply` riêng, dùng `Skeleton.*` (đã có). Top bar + splash đã đủ cho yêu cầu hiện tại.

## 7. States / a11y
- **Reduced-motion**: bar không trickle → chỉ hiện/ẩn (opacity) theo pending; skeleton shimmer cũng tôn trọng (HeroUI đã lo).
- **A11y**: bar = `role="progressbar"` + `aria-hidden` cho phần trang trí? → dùng `role="progressbar" aria-label="Đang tải trang"` `aria-busy`. Không trap focus.
- **Z-index**: `fixed top-0 inset-x-0 z-[60]` (trên navbar z-50). Không che nội dung (chỉ 3px).
- **Anti-flash**: delay 100ms; route prefetch nhanh → bar không kịp hiện (tốt).

## 8. Việc cắt / thêm
- **Thêm**: block `AppSplash` (splash vào web) + `<Suspense fallback>` ở `InnerLayout`; block `TopLoader` + hook `useProgress` + wrap navigation (Link/router) + mount ở `InnerLayout` trước Navbar; `@keyframes`/motion cho thanh accent (dùng chung splash + bar).
- **Cắt/không làm**: KHÔNG thêm dep `nextjs-toploader`; KHÔNG dùng `useLinkStatus` làm bar chính; per-route `loading.tsx` skeleton để ĐỢT SAU (§6b), không làm bây giờ.
- **Không đụng**: `AsyncContent` per-region (đã chuẩn) — top bar + loading.tsx là tầng route, độc lập.

## Nguồn
- Next.js — Linking & Navigating: https://nextjs.org/docs/app/getting-started/linking-and-navigating
- Next.js — useLinkStatus (fast-nav flash, per-Link): https://nextjs.org/docs/app/api-reference/functions/use-link-status
- Next.js — loading.js convention: https://nextjs.org/docs/app/api-reference/file-conventions/loading
- buildui (Sam Selikoff) — Global progress in Next.js (useTransition pattern, robust-to-interruption): https://buildui.com/posts/global-progress-in-nextjs
- nextjs-toploader (nprogress, ref style B): https://github.com/TheSGJ/nextjs-toploader
