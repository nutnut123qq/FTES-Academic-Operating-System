# FTES AOS — Roadmap & Backlog

Kế hoạch dựng **FTES Academic Operating System** (Enterprise Architecture v2) trên skeleton
đã strip từ StarCi Academy. Nguồn scope: [`ftes.txt`](../ftes.txt) — 24 domain.

Quy ước trạng thái: `[ ]` chưa làm · `[~]` một phần (đã có trong skeleton) · `[x]` xong.
Tham chiếu `§N` = mục N trong `ftes.txt`.

---

## 1. Nền đã có sẵn (skeleton)

Những gì strip giữ lại, dùng làm móng — **không dựng lại từ đầu**:

| Mảng | Có sẵn | Map spec |
|------|--------|----------|
| Auth | Keycloak: đăng nhập, Google, GitHub, session hint, refresh single-flight | §1 (một phần) |
| Admin | Admin shell + AdminLogin + 3 tool (ai-balancer, mpeg-dash, upload-video) | §22 (shell) |
| Infra FE | api/graphql (Apollo), socket.io, SWR, redux, zustand, i18n (vi/en), storage/minio | §24 |
| Design system | `components/blocks/*`, `reuseable/*`, `pallettes/*`, HeroUI, Tailwind tokens | cross-cutting |
| SEO/PWA | seo config, manifest, sitemap, robots, jsonLd | — |

> Dựng code FE mới → dùng skill `starci-fe-cannon-apply` (đặt-tên/pattern nhà). Layout →
> `starci-fe-ux-brainstorm` rồi `starci-fe-ux-apply`. Audit code cũ → `starci-fe-cannon-audit`.

---

## 2. Thứ tự dựng (phase — theo phụ thuộc, KHÔNG theo số mục)

Mỗi phase là một milestone giao được. Không nhảy cóc: phase sau ăn output phase trước.

### Phase 0 — Nền tảng (foundation)
Hoàn thiện danh tính + khung app trước khi có domain nào.
- [~] §1 Identity & Security: bổ sung Đăng ký, OTP email/SĐT, 2FA, Forgot/Reset password, Remember, Captcha
- [ ] §1 Authorization: RBAC (Permission, Role, Moderator/Admin/Super Admin) — **chặn nhiều phase sau**
- [ ] §1 Security: Device Management, Active Sessions, Login History, Trusted Devices, Security Log
- [ ] §2 Academic Profile: Personal (avatar/cover/bio/social), Academic (university/campus/major/semester/GPA), Portfolio
- [ ] App shell mới: navbar/sidebar theo kiến trúc mới (thay nav skeleton tối giản)

### Phase 1 — Core Domain ⭐ (lý do tồn tại của sản phẩm)
- [ ] §3 **Subject Workspace** ⭐⭐⭐⭐⭐ — mỗi môn = 1 workspace (Overview, Learning, Resources, Community, Practice, AI, Members, Statistics, Career Bridge)
- [ ] §4 Course System: Enroll, Section/Lesson/Video/Docs/Quiz, Progress, Certificate
- [ ] §5 Resource Hub: types (PDF/Slide/Video/PE/FE/…), Collections/Learning Pack, upload/version/approval, rating/comment/bookmark

### Phase 2 — Backbone ⭐
- [ ] §18 **Activity Engine** — event backbone (User Registered, Lesson Completed, Badge Earned…) feeding Feed/Timeline/Notification/Analytics/Recommendation. Dựng SỚM để các phase sau cắm vào.

### Phase 3 — Social layer
- [ ] §6 Community: Feed (For You/Following/Campus/Trending), Posts, Editor, Interaction, Reputation, Moderation
- [ ] §7 Groups: types (Public/Private/Study/Club/Team), members, feed/discussion/event/challenge
- [ ] §8 Chat: direct/group, voice/file/reaction/read-receipt/typing/online (socket.io đã có)
- [ ] §15 Notification: In-App/Push/Email, types, preferences/mute

### Phase 4 — Engagement
- [ ] §11 Gamification: XP/Level/Reputation, Daily/Weekly/Monthly goals + Streak, Badge/Title/Trophy, League/Season, Rewards, Subject Mastery ⭐
- [ ] §10 Challenge: types (Coding/SQL/UI-UX/AI/Business), individual/team, submission/scoring/leaderboard/rewards
- [ ] §12 Wallet & FTES Coin: balance, transaction (receive/transfer/purchase/refund), redeem/gift
- [ ] §14 Event: webinar/workshop/hackathon/meetup, registration/check-in/livestream/recording/certificate

### Phase 5 — AI Platform (cắt ngang)
- [ ] §9 AI: AI Student (Tutor/Mentor/Planner), Learning (Summary/Flashcards/Quiz/OCR), Coding (Debug/Review), Career (CV/Interview), Teacher (Generate/Auto-grading), Administration (Duplicate/Spam/Smart Search/Insight)

### Phase 6 — Discovery & Commerce
- [ ] §16 Search Platform: global + AI/semantic/NL search
- [ ] §17 Recommendation Engine: subject/course/resource/friend/group/mentor/study-partner
- [ ] §13 Marketplace: products (merch/premium/AI credits/voucher/course unlock), order/payment/invoice/coupon

### Phase 7 — Bridge & Ops
- [ ] §21 Career Center ⭐: Skill Graph, Career Roadmap (BE/FE/Mobile/AI/Data/DevOps), Internship/Jobs/Mentor
- [ ] §23 Integration Hub: **StarCI Ecosystem** (external — profile/skill/portfolio sync), GitHub, Gmail/Firebase, payment gateway, AI providers, storage, public API/webhook
- [ ] §19 Workflow Engine: content workflow (Draft→AI Review→Mod Review→Approve→Publish→Archive)
- [ ] §20 Analytics: learning/subject/community/AI/gamification/business dashboards

### Xuyên suốt (làm dần mọi phase)
- [~] §22 Admin CMS: mỗi domain xong → thêm màn quản trị tương ứng
- [~] §24 Enterprise Infrastructure: gateway, cache, event bus, queue, scheduler, search index, rate-limit, monitoring, feature flags, config center

---

## 3. Ghi chú kiến trúc

- **StarCI ≠ FTES.** Trong spec, StarCI là hệ sinh thái NGOÀI (§23) mà FTES tích hợp
  (skill sync, portfolio sync, "Suggested StarCI Roadmap"). Branding cũ đã đổi StarCi→FTES AOS;
  nhưng tên "StarCI" ở §21/§23 là đối tác thật — **giữ nguyên**, không rename.
- **RBAC là nút thắt** — nhiều màn (Groups, Community mod, Admin CMS, Workflow) phụ thuộc role/permission. Ưu tiên trong Phase 0.
- **Activity Engine dựng sớm** (Phase 2) dù nó "backbone vô hình" — Feed/Notif/Analytics/Reco đều đọc từ nó; lùi lại sẽ phải retrofit.
- **AI là layer cắt ngang** (Phase 5) — cắm lên core đã có (subject/course/resource), không phải silo riêng.
- FE-only ở đây; mỗi domain cần contract BE tương ứng (GraphQL/REST) — chốt schema trước khi dựng UI.

---

## 4. Việc kế tiếp

Chọn 1 để bắt đầu:
- **Phase 0** — RBAC + Profile + hoàn thiện Auth (nền, mở khóa mọi thứ), hoặc
- **Phase 1** — Subject Workspace ⭐ (core, thấy sản phẩm sớm; auth tạm dùng skeleton).

Khuyến nghị: **Phase 0 RBAC + Phase 1 Subject Workspace song song** — RBAC làm nền, Subject Workspace
là màn demo giá trị. Bắt đầu Subject Workspace bằng `starci-fe-ux-brainstorm` để chốt layout.
