# Landing Page — UX Brainstorm

> ⬇️ VÒNG 2 (2026-06-25) là bản CURRENT (trang đã chuyển sang `features/landing/Landing`). Bản 2026-06-18 bên dưới = lịch sử (path cũ `layouts/marketing/LandingPage` đã stale).

---

# VÒNG 2 — 2026-06-25 (current: `features/landing/Landing`)

## Mục tiêu trang (≤30s)
Khách lạ hiểu trong 30s: **StarCi dạy XÂY HỆ THỐNG THỰC (Fullstack · System Design · DevOps), không phải CRUD** — thử thách chấm bằng AI, dự án thật, cộng đồng kỹ sư + đường ra nghề (talent/recruiter). 1 primary action: **Xem khóa học** (funnel → enroll).

## Inventory hiện tại (10 section, hero TEXT-ONLY)
Hero(no image) → StatStrip → Wedge(3 trụ) → TrackLadder(4) → FounderManifesto → RecruiterProof(open-to-work) → Outcomes(engineer/enterprise) → CourseCatalog → FAQ → Closing CTA.

**Pain:** hero thiếu visual anchor (chữ-nặng) · CTA lặp (§1 "Xem khóa học" ≡ §10) · Founder dài chỉ text · TrackLadder loãng · Outcomes engineer-vs-enterprise mơ hồ (chỉ enterprise có CTA) · thiếu testimonial/blog/hiring-proof · catalog nằm cuối (conversion surface bị đẩy xuống).

## Data THẬT khả dụng (grounded)
| Khối | Query/Entity | Field | Trạng thái |
|---|---|---|---|
| Stats | `platformStats` (PUBLIC) | totalLearners/Lessons/Courses/BadgesEarned | ✅ thật, tự ẩn khi lỗi |
| Khóa học | `courses` (PUBLIC, ES search+paginate) | cover · title · price · `pricingPhases` · `enrollmentCount` · `valuePropositions` | ✅ |
| Talent | `openToWorkUsers` | avatar · displayName (gate ≥3) | ✅ |
| Blog | `blogPosts` (PUBLIC) | title · excerpt · cover · category(deep-dive/build-in-public/case-study) · `ctaUrl`/`ctaLabel` · readingMinutes | ⚠️ CHƯA dùng trên landing |
| Hiring partners | `headhuntingCompanies` (PUBLIC) | logoUrl · title · websiteUrl | ⚠️ CHƯA dùng (cơ hội logo strip) |
| Popularity | `course.enrollmentCount` | số enroll | ⚠️ chưa dùng làm "phổ biến" |

**Chưa có:** testimonial/review entity (KHÔNG bịa — dùng open-to-work + hiring partners + enrollmentCount làm proof thật thay vì testimonial giả). `globalLeaderboard`/`trendingContents` là auth-only → muốn "top learners"/"trending" public cần thêm public variant (BE work — defer).

## Asset mới: ảnh dev-hologram trong suốt
Thầy có **transparent PNG** (lập trình viên + hologram code/database/system-design icons) → dùng làm **hero visual anchor** (giải pain "hero chữ-nặng, không visual"). Đúng vibe "system design / xây hệ thống thực".

## 3 HƯỚNG
- **A (ĐỀ XUẤT) — Learner-first, hero SPLIT + ảnh.** Hero 2 cột: chữ trái (eyebrow track-chip + H1 "Học xây hệ thống thực — không phải CRUD" + subline + **1 CTA "Xem khóa học"** + stats inline) · ảnh dev-hologram phải. Funnel rõ, ảnh anchor, 1 primary action. Ref: Vercel/Linear/Frontend Masters. *Trade-off:* mobile ảnh stack dưới chữ.
- **B — Hero CENTERED + ảnh backdrop mờ.** Chữ căn giữa, ảnh phủ sau opacity thấp. Chữ là tâm điểm. Ref: Stripe/ByteByteGo. *Trade-off:* ảnh mờ phí asset đẹp; ít "sản phẩm thật".
- **C — Two-sided (learner + recruiter ngang hàng).** Hero 2 path "Tôi học"/"Tôi tuyển". *Trade-off:* loãng funnel + data recruiter mỏng → **bỏ** (talent để proof phụ).

→ **CHỐT A** (hero split + ảnh; learner-first; talent/hiring = proof phụ).

## IA mới (Hướng A) — funnel learner-first
```
1. Hero SPLIT (chữ trái + ảnh dev-hologram phải) + stats inline  ← platformStats
2. Wedge 3 trụ: Nội dung thực · Thử thách chấm AI · Dự án thật   ← i18n
3. KHÓA HỌC (CourseCatalog — CHUYỂN LÊN, conversion sớm)         ← courses
4. Lộ trình track (Fullstack/SD/DevOps/Architect)               ← i18n
5. PROOF gộp: open-to-work talent + hiring-partner logos        ← openToWorkUsers + headhuntingCompanies
6. Blog build-in-public / case-study (3 card)                   ← blogPosts (MỚI)
7. Founder (RÚT GỌN: 1 khối + quote, không 2 block text)        ← i18n
8. FAQ                                                          ← i18n
9. Closing CTA (1 lần duy nhất)                                 ← i18n
```

## Cắt / Thêm
- **Cắt:** CTA lặp (§1 giữ, §10 đổi reinforcement khác / bỏ trùng) · Outcomes engineer-vs-enterprise (gộp: engineer-value vào Wedge/Hero; enterprise → 1 dòng "Tuyển dụng?" trong Proof/footer).
- **Thêm:** ảnh hero · CourseCatalog lên sớm · Blog section (build-in-public/case-study) · hiring-partner logo strip (headhuntingCompanies) · enrollmentCount badge "phổ biến" trên course card.
- **Giữ:** StatStrip (gộp vào hero), Wedge, TrackLadder, RecruiterProof (→ Proof), FAQ.

## States / a11y
- platformStats lỗi → ẩn stats (đã có); hero (ảnh + CTA) vẫn đứng.
- courses loading → skeleton grid (đã có); empty → "sắp ra mắt".
- Blog/talent/hiring: gate khi rỗng (self-hide ≥3, no thin proof) như RecruiterProof.
- Hero ảnh: `alt` mô tả / decorative `aria-hidden`; mobile stack (chữ trên, ảnh dưới), không đẩy CTA khỏi màn.

## Cần BE (defer, hỏi thầy)
- Public `topLearners`/`trendingContents` nếu muốn social proof "top học viên / bài hot" (giờ auth-only).
- `headhuntingCompanies.logoUrl` đủ ≥3-4 logo cho hiring-partner strip chưa.

---

## CURRICULUM-GROUNDED — đề xuất section (2026-06-25, sau khi scan data thật)

### StarCi dạy gì (sự thật để landing bám vào)
- **Fullstack Mastery** (23 module): BE NestJS→DB/cache→REST→auth→websocket→jobs→email/OTP→file/S3→GraphQL→payment + FE TanStack/RHF+Zod/Zustand/Next RSC/perf/a11y + testing/deploy/AI → fresher/junior fullstack.
- **System Design Mastery** (24 module · 86 lesson · **356+ challenge · 20 capstone**), tier foundation→intermediate→advanced→application — xây THẬT: news feed (fanout) · video streaming (HLS/CDN) · flash sale (idempotency) · gọi xe (geospatial/surge) · ví điện tử (ledger/saga) · search engine · rate limiter · chat · webhook · analytics.
- **DevOps Mastery** (35 module): Linux→Terraform→**4 cloud (AWS/GCP/Azure/DO)**→Docker→K8s→CI/CD(GH Actions/Jenkins/Argo/GitLab)→DevSecOps→observability(Prom/Grafana/OTel)→SLO/autoscale/DR.
- **AI/LLM** (2 module, mới) · **Claude** (trống — kế hoạch).
- **Cách dạy (cross-cutting, 1 sản phẩm):** mỗi lesson **đọc 4 ngôn ngữ (TS/Java/C#/Go)** → **challenge chấm AI 4 tier (easy→insane)** → flashcard ôn tập → leaderboard → **capstone dự án thật**.

### Insight cho landing
Landing CŨ trừu tượng ("build real systems" + 4 track mơ hồ + TrackLadder không nội dung). Curriculum cho **proof CỤ THỂ** → đưa lên: (a) là **lộ trình tự học CÓ HỆ THỐNG** (đúng tham vọng thầy), (b) **liệt kê hệ thống THẬT bạn xây** (bằng chứng "không CRUD" mạnh nhất), (c) **học bằng stack của bạn + chấm AI + capstone portfolio**.

### IA đề xuất (refined, grounded) — thay vòng-2 chỗ "Track/Wedge mơ hồ"
| # | Section | Nội dung GROUNDED | Data/nguồn |
|---|---|---|---|
| 1 | **Hero split + ảnh** | "Lộ trình tự học để **XÂY hệ thống thực** — Fullstack · System Design · DevOps" + 1 CTA + stats | i18n + ảnh + `platformStats` |
| 2 | **Cách học (learning loop)** | 4 bước: Đọc (4 ngôn ngữ) → Thử thách chấm AI (4 tier) → Capstone dự án → Leaderboard. Thay Wedge trừu tượng = vòng học CỤ THỂ | i18n (marketing) |
| 3 | **Khóa học (catalog)** | 3 mastery (FS/SD/DevOps) + AI — card thật | `courses` |
| 4 | **★ Lộ trình / Roadmap (MỚI — centerpiece)** | Mỗi track hiện **tier foundation→intermediate→advanced→application** + vài module mốc. = "lộ trình tự học có hệ thống". **THAY TrackLadder mơ hồ** | i18n curated (từ module titles thật) |
| 5 | **★ Hệ thống bạn sẽ XÂY (MỚI)** | Grid tên hệ thống thật: News feed · Video streaming · Flash sale · Gọi xe · Ví điện tử · Chat · Search engine · K8s deploy. Proof "không CRUD" | i18n curated (từ SD modules + capstones) |
| 6 | **Proof** | open-to-work talent + hiring-partner logos | `openToWorkUsers` + `headhuntingCompanies` |
| 7 | Blog build-in-public/case-study | 3 card (follow-up: cần hook) | `blogPosts` |
| 8 | Founder (rút gọn) | 1 khối + quote | i18n |
| 9 | FAQ | giữ | i18n |
| 10 | Closing CTA (1 lần) | "Bắt đầu lộ trình" | i18n |

### Cắt / Đổi so với hiện tại
- **TrackLadder mơ hồ (4 track label trống) → Roadmap CỤ THỂ** (tier + module mốc theo curriculum thật).
- **Wedge trừu tượng → "Cách học" loop CỤ THỂ** (4 ngôn ngữ · chấm AI · capstone).
- **THÊM "Hệ thống bạn sẽ xây"** (chưa có — proof mạnh nhất).
- Outcomes engineer/enterprise → gộp vào Proof (enterprise = 1 dòng "Tuyển dụng?").

### Copy grounded (ví dụ, KHÔNG generic)
- Hero: *"Học xây Newsfeed, Flash sale, Ví điện tử — không phải CRUD. Lộ trình tự học có hệ thống: đọc → thử thách chấm AI → capstone."*
- Roadmap: *"Foundation → Advanced → Application. 82 module, 20+ capstone, chấm tự động."*
- Systems: *"20 capstone = 20 hệ thống production bạn tự tay dựng."*

### ★ Ý TƯỞNG VISUAL CHỦ ĐẠO (thầy chốt hướng 2026-06-25): sơ đồ MICROSERVICES "chỗ vỡ"
- Thay vì grid 8 diagram nhỏ (mỗi hệ thống 1 flow) → **1 sơ đồ microservices THẬT, bự, có nghĩa** + đánh dấu **CHỖ HỆ THỐNG VỠ** (đỏ, pulse). Đây CHÍNH là tư duy System Design StarCi dạy → visual = value prop.
- Topology: Client → LB → API Gateway → [Auth · Order · Payment] → [Postgres · Redis · Kafka].
- **3 chỗ vỡ (grounded từ curriculum):** ① Payment gọi ĐỒNG BỘ → cascade (học circuit breaker/async) · ② Postgres 1 node → nghẽn/SPOF (học replication/sharding) · ③ spike flash-sale không queue/idempotency → quá tải (học queue+idempotency).
- **Tagline:** *"Nhìn ra chỗ vỡ. Thiết kế để nó không vỡ."*
- **Block:** `MicroservicesDiagram` (topology node+edge + break markers, optional pulse animation) — code SVG/CSS, 0 ảnh. Richer hơn `ArchitectureFlow` (cái này chỉ flow tuyến tính).
- **Placement (cần thầy chốt):** (1) HERO visual — sơ đồ pulse cạnh headline (mạnh nhất); (2) section riêng "Bạn học để hệ thống không vỡ" thay grid 8-diagram. Thầy: *"không cần nói hết các khóa, vẽ sơ đồ microservices"* → nghiêng **1 sơ đồ bự > 8 cái nhỏ**.

### Lưu ý data
- "Hệ thống bạn sẽ xây" + "Roadmap tiers" = **curated marketing copy (i18n)** rút từ curriculum thật (KHÔNG query live — đây là highlight có chọn lọc, không phải list động). Module/lesson thật chỉ hiện trong course detail (qua `courses`/`course`).
- KHÔNG bịa số — `platformStats` (learners/lessons/courses) live; "356+ challenge / 20 capstone / 82 module" là số THẬT từ data (có thể hardcode i18n hoặc thêm field aggregate nếu muốn live).

---

# VÒNG 1 — 2026-06-18 (lịch sử, path cũ stale)

> Output của `/ux-brainstorm`. KHÔNG code. Thầy duyệt hướng → `/ux-apply`.
> Trang: `src/components/layouts/marketing/LandingPage/` (route `/` và `/home`).

---

## 1. Mục tiêu trang (≤30s)

Khách lạ vào → trong 30s phải hiểu **StarCi khác bootcamp ở đâu** và **làm gì tiếp theo**.
Hiện tại trang TRẢ LỜI bằng *lời* (9 section manifesto) chứ không bằng *bằng chứng*. Mục tiêu mới:
**show, don't tell** — mỗi tuyên bố phải dựa trên DATA THẬT đã có trong BE, và chỉ có **1 primary action**.

Hai đối tượng (giữ, nhưng phân tầng rõ):
- **B2C — dev muốn lên trình & được headhunt** (primary, ~90% traffic).
- **B2B — recruiter muốn tuyển dev đã vetted** (secondary, 1 lối rẽ rõ ràng, KHÔNG chiếm nửa trang).

---

## 2. Audit trang hiện tại (chỉ để biết CÓ GÌ + điểm đau)

**Đang có (11 section):** Hero · ProofStrip · Trap · RealityCheck · Manifesto · Contrast · Methodology · Ambition · Outcome · CourseCatalog · Faq.

**Điểm đau (UX):**
1. **Wall of manifesto, 0 bằng chứng.** 10/11 section hardcoded; chỉ `CourseCatalog` có data thật. Trap/RealityCheck/Contrast/Manifesto/Ambition đều là *lời khẳng định* không có proof.
2. **Claim không chứng minh được.** "AI chấm 24/7" → demo là **skeleton giả** ("Analyzing Architecture..."). "Headhunt thẳng" → 0 con số, 0 logo, 0 talent. "Leaderboard khốc liệt" → không link, không sample.
3. **Asset vỡ.** RealityCheck có `imagePrompt` nhưng **không render ảnh** (chỉ icon placeholder). Manifesto **thiếu ảnh founder** (`/founder.jpg` TODO) → mất đòn "founder-led".
4. **Không có 1 primary CTA.** 6+ CTA rải rác; Hero "Xem lộ trình" vs Closing "Xem khóa học" trùng đích nhưng khác chữ; **không có nút Sign Up** ở đâu cả → khách mới không có cửa vào tài khoản.
5. **Vanity > proof.** ContrastSection đánh "nơi khác" ẩn danh = strawman, toothless. Ambition toàn pillar mô tả tính năng, không link tới feature thật.
6. **Bỏ phí data mạnh nhất** (xem §5): `pricingPhases.soldCount/capacity` (khan hiếm THẬT), `openToWorkUsers` (proof recruiter THẬT), `blogPosts` (founder viết thật), `enrollmentCount` aggregate.

---

## 3. Information Architecture MỚI (chốt)

Cắt 11 → **8 beat**, mỗi beat 1 nhiệm vụ, mỗi claim 1 proof:

| # | Section | Job | Primary? |
|---|---------|-----|----------|
| 1 | **Hero** | Value prop sắc + **1 primary CTA** ("Xem lộ trình") + 1 secondary ("Đăng nhập"/recruiter). Bỏ diagram giả → live stat strip. | ⭐ CTA chính |
| 2 | **Live proof strip** | Số THẬT: N learner · N bài học · N khóa · N huy hiệu. Thay ProofStrip hand-wavy. | |
| 3 | **The wedge — "Học thật" = Challenge + AI chấm** | Gộp Trap+RealityCheck+Methodology thành 1 beat. Show **challenge thật + feedback AI thật** (KHÔNG skeleton giả). Đây là điểm khác biệt. | |
| 4 | **Lộ trình 4 tuyến** | Ladder Fullstack→DevOps→Security→SA, mỗi tuyến map khóa thật. | |
| 5 | **Founder beat (nén)** | 1 block manifesto + **ảnh founder thật** + link GitHub + link `/blog` (build-in-public = proof founder ship thật). Thay Manifesto+Ambition. | |
| 6 | **Course catalog** | Section live (giữ). Thêm **khan hiếm thật** (Pioneer còn N slot từ soldCount/capacity) + enrollmentCount. Bề mặt convert chính. | ⭐ Convert |
| 7 | **Two-sided outcome** | Dev được headhunt / Company tuyển. Side recruiter backed bằng **`openToWorkUsers` thật** ("N dev đang open-to-work" + avatar) → link talent directory. | Lối rẽ B2B |
| 8 | **FAQ (tỉa) + Final CTA** | Objection-handling gọn + CTA mạnh neo giá/khan hiếm. | ⭐ CTA chính (lặp) |

**CẮT:** ContrastSection (strawman ẩn danh) · AI skeleton giả · RealityCheck illustrations vỡ · Ambition pillar vanity (fold cái thật — leaderboard, AI mentor — vào beat #3).

---

## 4. Ba hướng đã cân + hướng chốt

### Hướng A — "Show the machine" (proof-first, learner-first)
Dẫn bằng **sản phẩm thật**: catalog + engine challenge/AI show live + số enrollment thật + giá khan hiếm thật. Manifesto nén còn 1 strip. 1 primary CTA = vào lộ trình/khóa.
- ✅ Sửa đúng bệnh gốc (claim → proof), convert rõ, dùng đúng data đang bỏ phí.
- ⚠️ Hạ "chất văn" founder — vốn là 1 tài sản brand.

### Hướng B — "Manifesto founder-led" (editorial, story-first)
Giữ mạch kể chuyện founder làm xương sống, nhưng **mỗi đoạn ghép 1 bằng chứng thật** + ảnh founder + blog.
- ✅ Giữ giọng brand máu lửa, khác biệt cảm xúc.
- ⚠️ Convert vẫn mềm; rủi ro lặp lại bệnh "dài & ít proof" nếu không kỷ luật.

### Hướng C — "Two-sided marketplace" (dev + recruiter ngang hàng)
Tách đôi rõ: dev học & được tuyển / company tuyển talent đã vetted. Wedge = headhunt + `openToWorkUsers`.
- ✅ Khai thác đòn độc nhất (talent directory thật).
- ⚠️ B2B traffic còn nhỏ; chia đôi trang làm loãng message cho 90% là dev.

### ✅ CHỐT: **A có ghép 1 nhịp B** — "Show the machine, keep the voice"
Lý do: bệnh gốc của trang là **claim không proof + CTA mù** → A chữa đúng. Nhưng giọng founder là tài sản thật và `/blog` chứng minh được → giữ **đúng 1 beat** founder (nén, có ảnh + link blog) thay vì 4 section. C (recruiter) **không lên ngang hàng** — chỉ là **1 lối rẽ** ở beat #7 (backed bằng `openToWorkUsers` thật) để không loãng message dev.

---

## 5. Bảng Section → Dữ liệu BE/DB

| Section | Query / Field THẬT | Auth | Ghi chú |
|---------|--------------------|------|---------|
| Hero stat strip | **MỚI** `platformStats` (count users / enrollments / contents / user_achievements) | public | Cần thêm 1 query aggregate public (xem §6). Hoặc tạm derive. |
| Live proof strip | như trên + `blogPosts` count | public | |
| Wedge (Challenge+AI) | `publicContent` (lesson free thật) · sample challenge · `systemConfig.challenge.passThreshold` | public | Show feedback AI THẬT, bỏ skeleton giả. Có thể seed 1 sample tĩnh từ data thật. |
| Lộ trình 4 tuyến | `courses` (title, coverImageUrl, slug, description) | public | Group theo track. |
| Founder beat | i18n `contact.founder.*` · `FOUNDER_GITHUB` · `blogPosts` (build-in-public) | public | **Cần ảnh founder thật** (asset, không phải BE). |
| Course catalog | `courses` → `enrollmentCount`, `originalPrice/Usd`, **`pricingPhases{tier,price,capacity,soldCount,discount}`**, `valuePropositions` | public | **soldCount/capacity = khan hiếm THẬT** (đang bỏ phí). |
| Two-sided / recruiter | **`openToWorkUsers`** (username, avatar, displayName, roleTitle, bio) | optional | "N dev đang open-to-work" + avatar grid → link talent dir. **Đang bỏ phí.** |
| FAQ | `course.qnas` (nếu muốn động) hoặc giữ i18n | public | |

**Field CÓ nhưng CHƯA dùng (cơ hội):** `pricingPhases.soldCount/capacity` (urgency), `openToWorkUsers` (recruiter proof), `blogPosts` (founder credibility), `enrollmentCount` aggregate, `achievement.rarityPercent`.

**KHÔNG có (đừng vẽ UI cho nó):** bảng review/rating/testimonial → **không bịa "★4.9 từ 2000 học viên"**. Social proof phải lấy từ con số thật (enrollment, badge, open-to-work) chứ không phải testimonial giả.

---

## 6. BE cần thêm (flag cho `/ux-apply` → có thể cần BE)
1. `platformStats` — 1 public query trả count: learners (enrollments distinct user), lessons (contents), courses, badges earned. (Dễ; có sẵn projection.)
2. (Optional) `openToWorkUsers` đã public → chỉ cần FE gọi + 1 count.
3. (Optional) 1 sample challenge + AI feedback thật để show ở beat #3 (hoặc seed tĩnh từ data thật, không hardcode bịa).

---

## 7. Empty / Loading / Error / A11y (tính từ đầu)
- **Stat strip:** loading = skeleton số; nếu query fail → **ẩn cả strip** (đừng show "0 learners" — phản tác dụng). Không bao giờ hiện số 0 như proof.
- **Course catalog:** đã có skeleton/error/empty (giữ). Empty-search giữ.
- **openToWork grid:** nếu < ngưỡng (vd <6 dev) → ẩn count, chỉ show CTA "Trở thành đối tác".
- **Hero diagram:** nếu giữ visual → thêm `alt`/aria-label mô tả; jargon eyebrow cần text thật, không chỉ trang trí.
- **CTA:** 1 primary nổi bật (filled), secondary outline; focus ring rõ; thứ tự tab hợp lý.

---

## 8. Tóm tắt điều CẮT / THÊM
- **Cắt:** ContrastSection · AI skeleton giả · RealityCheck illustration vỡ · Ambition vanity pillars · gộp Trap+RealityCheck+Methodology → 1.
- **Thêm:** live stat strip (số thật) · challenge+AI demo THẬT · khan hiếm Pioneer (soldCount/capacity) · recruiter proof (openToWorkUsers) · founder photo + link blog · 1 primary CTA + Sign Up rõ ràng.

## HERO COPY — hướng sửa text (2026-06-26)
> Thầy: *"đề xuất hướng sửa text ở phần hero"*. Web ref: formula `[Outcome] without [Pain]`; pain-headline +45% convert (HubSpot); concrete/tangible; tách câu dày.

### Chẩn (copy hiện tại)
- Headline `Học xây <accent>hệ thống thật</accent> — không dừng ở CRUD.` — hook "beyond CRUD" SẮC (dev ngán CRUD) ✓; nhưng "Học xây" hơi cấn.
- Subline `Lộ trình tự học: Fullstack → System Design → DevOps. Đọc → thử thách chấm AI → capstone.` — **dày** (2 arrow-chain nhồi 1 câu), khó quét.

### 3 hướng (grounded: tự học · Fullstack→SD→DevOps · AI-graded · capstone · audience ngán CRUD/tutorial thụ động)
- **A (ĐỀ XUẤT) — Outcome+pain, refine bản hiện tại:**
  - headline: `Xây <accent>hệ thống thật</accent> — không dừng ở CRUD.` (bỏ "Học")
  - subline: `Lộ trình tự học Fullstack → System Design → DevOps. Mỗi bài: đọc → tự build → AI chấm → capstone.` (tách: dòng lộ trình / dòng vòng lặp)
  - Giữ identity "beyond CRUD", chỉ gọn lại. An toàn nhất.
- **B — Transformation (coder CRUD → kỹ sư hệ thống):** headline `Từ viết CRUD → <accent>thiết kế hệ thống thật</accent>.` · subline `Tự học có lộ trình: Fullstack · System Design · DevOps. Đọc → build → AI chấm → capstone như production.` Aspirational.
- **C — Pain/contrast (chống học thụ động):** headline `Hết xem video suông. <accent>Tự build hệ thống thật.</accent>` · subline `Mỗi module: đọc → tự code → AI chấm → capstone. Không tutorial thụ động, không chỉ CRUD.` Punchy nhất (+45%) nhưng giọng "đấu tranh".

### Phụ (tuỳ chọn)
- diagramCaption `Nhìn ra chỗ vỡ. Thiết kế để nó không vỡ.` — GIỮ (ăn với failure annotation).
- CTA primary `Xem khóa học` → cân nhắc `Bắt đầu lộ trình` (action+outcome). secondary `Đăng nhập` giữ.
- eyebrow `Tự học · Fullstack · System Design · DevOps` — giữ (đã quiet pill).
- **Chốt:** A (refine) trừ khi thầy muốn bạo hơn (B/C). Sửa cả vi + en (en mirror). Mockup `starci_hero_copy_directions`.

## HERO CHIPS sáng tạo (2026-06-26)
> Thầy: *"sáng tạo hơn cho [eyebrow] và [language tags] · 4 lang chìm quá"*. Web ref: brand-color per ngôn ngữ (simpleicons) = pattern chuẩn, đẹp + có nghĩa (khoe đa-ngôn-ngữ).

### Language tags (TS·Java·C#·Go) — fix "chìm"
- **A (ĐỀ XUẤT) — brand-color chips:** mỗi lang = chấm + viền + chữ MÀU THƯƠNG HIỆU (TS #3178C6 · Java #E76F00 · C# #8B5CF6 · Go #00ADD8), fill nhạt `/10-20%` (không chói). Prefix **"Giải bằng"** → khoe USP "thử thách chấm trên 4 lang". Hover sáng dần (framer `whileHover`). Đẹp cả light/dark (brand hex mid-tone). Dev nhận diện lang qua màu ngay (shields.io vibe).
- **B — chỉ chấm màu, chữ neutral:** kín đáo hơn, vẫn hết chìm. Ít pop.
- Màu lang = hằng số `LANG_COLOR` (hex, data-driven, inline style — không token semantic; cùng họ [[master-detail-rail-as-filter-and-mobile-chips]] CATEGORY_COLOR).

### Eyebrow ("Tự học · Fullstack · System Design · DevOps")
- Ý **track-segment**: đổi "·" giữa 3 trụ → **"→"** (đọc ra LỘ TRÌNH cơ bản→nâng cao) + tô 3 trụ accent nhạt. Hoặc GIỮ quiet pill (đã ổn) nếu thầy thấy đủ — ưu tiên dồn creative vào lang tags.

### Chốt
- **A cho language tags** (brand-color + "Giải bằng" + hover). Eyebrow: track-segment "→" (nhẹ) hoặc giữ.
- Impl: `HeroBanner` keywords map → brand-color chip (cần truyền màu per keyword → đổi `keywords` prop từ `string[]` sang `{label,color}[]`, HOẶC 1 `LANG_COLOR` map ở landing constants). Framer `motion.span whileHover`. Mockup `starci_hero_chips_creative`.
