# Landing — "Cách học" (learnLoop) → scroll-pinned scrollytelling (2026-06-26)

> Thầy gửi ika.xyz "How it works": *"render giống web này không, kéo xuống là đọc tiếp, kéo hết là kéo xuống được nữa"*. = đổi section "Cách học / Vòng học thật sự lên tay" (4 step ngang TĨNH hiện tại) → **scroll-pinned**: ghim section, cuộn → step active nhảy + visual phải đổi, cuộn hết → nhả, trang chạy tiếp.

## Pattern (ref-grounded)
- **Scroll-pinned scrollytelling / sticky-step**: container cao `N×100vh`, inner `position: sticky; top:0; h-screen`; `useScroll(target, offset:["start start","end end"])` → `scrollYProgress` 0→1; `useTransform` → step index + progress bar; sticky **tự nhả** khi container cuộn hết (đúng "kéo hết → cuộn tiếp"). Refs: **ika.xyz** (thầy gửi) · Apple product pages · Aceternity "Sticky Scroll Reveal" · **Motion/Framer `useScroll`** (repo đã dùng Framer Motion). Nguồn: [Motion useScroll](https://motion.dev/docs/react-use-scroll) · [Motion scroll animations](https://motion.dev/docs/react-scroll-animations) · [scroll-driven progress tutorial](https://ui-incubator.com/en/catalog/video/video-scroll-play).
- **Data**: KHÔNG cần BE/DB — 4 step là i18n constant `landing.learnLoop.*` (đã có). Grounded sẵn. Chỉ thêm 4 **visual panel** (flat, token) cho cột phải.

## 3 hướng (widget đã vẽ)
- **A — Ghim cả section (ĐỀ XUẤT, giống Ika):** section `~400vh`, inner sticky pin; cuộn → step active 01→04 (left list highlight) + visual phải crossfade + progress bar chạy; hết step 04 → nhả. Đúng 100% yêu cầu thầy. **Mobile + reduced-motion → auto fallback C** (touch + a11y: không scroll-hijack).
- **B — Chỉ ghim visual phải (sticky media):** chỉ cột phải `sticky`; list step cuộn bình thường qua nó, active = step giữa màn. Nhẹ, accessible hơn, nhưng KHÔNG có cảm giác pin-and-release rõ.
- **C — Không ghim, reveal `whileInView`:** giữ 4 thẻ ngang hiện tại, fade/slide-in khi cuộn tới. Đơn giản nhất = chính là fallback mobile/reduced-motion của A.

→ **Chốt A** (thầy muốn giống Ika), **C nhúng sẵn làm fallback** mobile/reduced-motion. (B để dành nếu thấy A "hijack" quá.)

## Build plan (hướng A)
- **Component**: `Landing/LearnLoopScroll/` (tách khỏi `Landing/index.tsx` cho gọn). Section `<section ref> className="relative h-[360vh]"` (≈90vh/step — tunable; 400vh nếu muốn chậm hơn). Inner `<div className="sticky top-0 flex h-screen items-center">`.
- **Scroll → state**: `const { scrollYProgress } = useScroll({ target: ref, offset: ["start start","end end"] })`. `useMotionValueEvent(scrollYProgress,"change", v => setActive(clamp(round(v*(N-1)),0,N-1)))`. (N=4.)
- **Left**: list 4 step (số + tag + title + desc, copy i18n giữ nguyên — vừa polish). Active = `border-accent bg-accent/10 text-foreground`; inactive = `border-default text-muted opacity-60`. Transition opacity/border.
- **Right**: 4 **visual panel** đổi theo `active` (crossfade `AnimatePresence mode="wait"` hoặc stack opacity):
  1. Đọc → mock bài đọc + tab 4 ngôn ngữ (TS/Java/C#/Go).
  2. Thử thách chấm AI → mock code + panel điểm/nhận xét AI.
  3. Capstone → mini system diagram (tái dùng motif `MicroservicesDiagram`).
  4. Leaderboard → mock vài row xếp hạng + XP.
  (Flat, token, KHÔNG ảnh thật — illustrative như Ika.)
- **Progress bar** (đáy, giống Ika): track `bg-default` + `motion.div` fill `style={{ width: scaleX/“%”}}` bind `scrollYProgress` + 4 dot ở mốc step (dot ≤ active = accent).
- **Fallback**: `useReducedMotion()` HOẶC `!lg` (mobile) → render hướng **C** (4 thẻ stack/ngang `whileInView` fade) — KHÔNG pin (scroll-jack hại trên touch + a11y). 1 component, 2 nhánh render.
- **Nhịp marketing**: section này thay slot learnLoop hiện tại; trên/dưới giữ `gap-24` ([[landing-marketing-section-spacing-and-editorial-stats]]). Section pin tự chiếm chiều cao riêng (360vh) nên không tính vào gap.

## Rủi ro / lưu ý
- **Scroll-jack** = con dao 2 lưỡi: hay trên desktop, dở trên mobile/touch + người dùng reduced-motion → BẮT BUỘC fallback C (đã tính).
- **Chiều cao 360–400vh** = cuộn dài; tune để không "lê thê" (90vh/step ổn).
- `sticky` cần ancestor KHÔNG có `overflow-hidden` cắt → kiểm wrapper Landing.
- Visual panel là phần TỐN CÔNG nhất (4 mock) — làm flat/token, tái dùng diagram sẵn cho capstone.

## Áp
- `/starci-fe-ux-apply`: dựng `LearnLoopScroll` (hướng A + fallback C), thay section learnLoop trong `Landing/index.tsx`. Framer Motion (đã có). tsc/eslint + verify mắt cuộn `/vi`.
