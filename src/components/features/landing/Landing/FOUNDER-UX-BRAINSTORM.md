# Founder section — "Vì sao có StarCi" — UX brainstorm (2026-06-26)

> Re-imagine the founder/credibility beat of the public landing page. NO code yet — chốt hướng rồi `/starci-fe-ux-apply`.
> Section hiện tại: `Landing/index.tsx` L247–302 → block `FounderManifesto` bọc `SectionCard`.

## Mục tiêu section (job-to-be-done)
Trong **≤30s** làm khách TIN rằng **người này đủ tư cách dạy mình System Design tầm production** → "vì sao trust StarCi". Đây là **credibility/trust beat**, không phải feature.

## Pain hiện tại (legacy = inventory)
1. **Avatar GREY GENERIC ICON** (ảnh `/landing/founder.jpg` thiếu → fallback `UserIcon`). Cả 2 ref đều hét: **phải có MẶT THẬT** — "khó ngừng làm ăn với người mình nhận ra mặt". Đây là lỗi #1 phá trust.
2. **0 số liệu chứng minh.** Josh Comeau dùng "500k downloads/tháng · 1M dev/năm". StarCi có data thật mà **bỏ phí**.
3. **Body generic** ("Mình dạy đúng thứ mình làm") — chưa theo cấu trúc founder-letter (vấn đề→giải pháp).
4. **Bỏ phí data**: `body2` i18n mồ côi (không render); `FOUNDER_LINKEDIN`/`FOUNDER_FACEBOOK` khai báo nhưng không hiện; BE `platformStats` + `userProfile("starci183")` + `blogPosts` không dùng ở đây.
5. Card mồ côi trôi trên starfield, hierarchy yếu (name `h5`=16px nhỏ).

## Ref (grounded — KHÔNG bịa)
- **Josh Comeau "Hi, I'm Josh!"** (joyofreact.com): ảnh thật lớn → story cá nhân (vulnerability) → **credential ĐO ĐƯỢC bằng số** (công ty: Khan/DigitalOcean/Unsplash · "500k downloads/mo" · "1M devs/year") → cam kết + chữ ký. Trust = uy tín thể chế + cá tính thật + **số liệu**.
- **Founder letter / Jason Fried** (opensourceceo.com/p/founder-letter): vấn đề → kẻ-thù/bực-bội → giải pháp → khác biệt → CTA. Authenticity > polish; số cụ thể; vulnerability. 1 platform +33% conversion khi đổi sang founder-letter.
- Nguyên tắc chung: **face behind brand** (trust signal) + **founder voice** (narrative) + **proof số** (credibility).

## Dữ liệu KHẢ DỤNG (map section → BE/DB/config)
| Element | Nguồn THẬT | Trạng thái |
|---|---|---|
| Portrait | ảnh thật `/landing/founder.jpg` HOẶC `userProfile("starci183").avatar` | ⚠️ cần ảnh thật (đang placeholder) |
| Name / role / companies | i18n `landing.founder.*` (hoặc `userProfile.displayName/roleTitle`) | có |
| Note + quote + body2 | i18n `body1` + `body2`(mồ côi→reclaim) + `quote` | có, body2 chưa dùng |
| Proof: repo công khai | GitHub org `StarCi-Academy` = **242 repo** (build-in-public) | cần GitHub API / config (chưa có field BE) |
| Proof: học viên/bài học | BE `platformStats { totalLearners, totalLessons, totalCourses, totalBadgesEarned }` (public) | ⚠️ ĐÃ dùng ở StatStrip (section 2) → **đừng lặp** ở founder |
| Proof: viết blog mở | BE `blogPosts { title, slug, publishedAt }` (latest) | có, public |
| Companies (CTO @ 2) | static i18n | có |
| Links | GitHub + blog (đang có) + **LinkedIn** (`FOUNDER_LINKEDIN`, chưa render) | thêm LinkedIn |

> ⚠️ **Chống lặp data:** `platformStats` (learners/lessons) đã là StatStrip toàn cục ở section 2 → proof của founder phải là **founder-specific** (repo công khai · 2 cty CTO · viết blog mở), KHÔNG bê lại learner/lesson count.

## 3 hướng (đã vẽ widget)
- **A — Lá thư người sáng lập** (letter-led): mặt thật + note vấn-đề→giải-pháp + pull-quote + links. Ấm, narrative, vulnerability. Trade-off: dựa nhiều vào chất lượng copy; ít proof số.
- **B — Hồ sơ chứng minh** ⭐ (proof-led, build-in-public): mặt thật + name/role/companies + note ngắn + **proof strip 3 metric** (242 repo · 2 cty CTO · viết blog mở) + expertise chips + links (GitHub/blog/LinkedIn). Trade-off: hơi "CV" → cần 1 dòng note có cá tính để không lạnh.
- **C — Chẻ đôi** (split): thẻ định danh trái (mặt + social dọc) · manifesto + proof phải. Trade-off: 2-col phá nhịp center của landing; phức tạp + cần test mobile stack.

## CHỐT: **Hướng B (proof-led) + giọng của A**
Lý do:
1. **Grounded-in-data** (luật lõi skill): B dùng đúng data đang bỏ phí (repo công khai · companies · blog). Eyebrow "Làm công khai" **đang HỨA** build-in-public → proff số/repo công khai **CHỨNG MINH** lời hứa đó (hiện chỉ hứa suông).
2. **Audience System Design + recruiter-facing** trọng **số/bằng chứng cụ thể** hơn văn xuôi.
3. Sửa đúng lỗi #1 + #2 (mặt thật + credential đo được) theo cả 2 ref.
4. Giữ **giọng founder của A**: 1 dòng note vấn-đề→giải-pháp + quote cá tính → không thành CV lạnh.
5. Hợp nhịp center hiện tại của landing (1 card bounded), không cần 2-col như C.

### IA mới (hướng B)
1. **Header định danh**: portrait THẬT (rounded-lg ~60px) + name (to hơn, h4) + "Founder · StarCi Academy" + companies (CTO @ Nivo · CTO @ TEDO).
2. **Founder note** (1–2 dòng, giọng "mình", vấn-đề→giải-pháp) + **pull-quote** cá tính (reclaim `body2`).
3. **Proof strip** (3 metric, founder-specific): `242 repo công khai` · `2 công ty (CTO)` · `viết blog mở`. (KHÔNG lặp learner/lesson của StatStrip.)
4. **Expertise chips**: System Design · Blockchain · AI Automation.
5. **Links** (divider trên): GitHub · Đọc blog · **LinkedIn** (thêm).

### Cắt / Thêm
- **THÊM**: mặt thật (bắt buộc — cần ảnh founder thật), proof strip 3 số, LinkedIn link, reclaim `body2`.
- **CẮT**: avatar fallback UserIcon làm proof chính (chỉ giữ làm graceful fallback), hierarchy name nhỏ.
- **SỬA**: name `h5`→`h4`; note theo cấu trúc founder-letter.

### State (a11y + empty/loading/error)
- Portrait: ảnh thật + `alt` mô tả; fallback initials "NC" (KHÔNG generic person icon); a11y bỏ `aria-hidden` cho avatar có nghĩa.
- Proof "242 repo": nếu fetch GitHub API fail / chưa có nguồn → **ẩn ô đó** (no dead stat), hoặc hardcode config (an toàn). `blogPosts` latest fail → ẩn proof "viết blog mở".
- Reduced-motion: starfield/parallax tôn trọng `prefers-reduced-motion`.

## Nguồn (ref)
- joyofreact.com — instructor "Hi, I'm Josh!" credibility block.
- opensourceceo.com/p/founder-letter — founder-letter structure (Jason Fried).
- influencerdb / socialspicemedia / getrecharge "About Us" — face-behind-brand + founder-note trust signals.

→ Thầy chọn A / B / C (hoặc B-tweak-proof) → `/starci-fe-ux-apply` dựng. Feedback bất kỳ → ghi `.claude/rules/drafts/`.
