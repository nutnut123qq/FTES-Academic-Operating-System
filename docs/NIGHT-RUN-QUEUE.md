# Night-run queue (v2 — greenfield, layouts pre-chosen)

Scope đêm: **§3 Subject Workspace + §2 Profile** (greenfield, an toàn cho autonomy).
Auth/Phase-0 churn ĐÃ HOÃN (mature strict-canon → làm interactive sau).

**Điều kiện:** layout của mỗi màn được CHỐT interactive TRƯỚC (ux-brainstorm → bạn chọn).
Đêm loop chỉ chạy **ux-apply** theo layout đã chốt — không tự quyết UX.

Mỗi mục = 1 OpenSpec change (propose → apply theo layout đã chốt) → build webpack + tsc → commit.

- [ ] `subject-workspace-shell` — §3: shell + tab nav (Overview/Learning/Resources/Community/Practice/AI/Members/Stats/Career Bridge). Layout: <chốt qua brainstorm>
- [ ] `subject-workspace-overview` — §3: tab Overview (description/credits/lecturer/difficulty/prerequisites/roadmap/outcomes)
- [ ] `subject-workspace-resources` — §3: tab Resources (types + collections + interaction)
- [ ] `subject-workspace-practice` — §3: tab Practice (quiz/flashcards/coding challenge/leaderboard shells)
- [ ] `profile-shell` — §2: Profile shell (Personal + Academic + Portfolio + Community + Progress). Layout: <chốt qua brainstorm>

## Layouts đã chốt
- **`subject-workspace-shell` → A · Sidebar rail** (chốt 2026-07-01, brainstorm interactive).
  - Archetype: learn-shell. Route `/[locale]/subjects/[subjectId]` + layout.tsx (shell) + nested tab pages.
  - Blocks nhà: `CollapsibleSidebar` + `SidebarNavGroup divider` + `SidebarNavItem` (active `bg-accent/10 text-accent`), sticky one-scroll (KHÔNG viewport-lock lồng scroll).
  - Header: subject identity strip (code PRF192 · tên · tín chỉ · độ khó · progress) trên cùng content region; breadcrumb → H3 header → parts `p-6` (3-tier law). KHÔNG per-page back (đã có sidebar+breadcrumb).
  - 9 mảng gom **3 cụm** (separator, không caption; không 1-item group):
    - Học: Overview · Learning · Resources · Practice · AI
    - Cộng đồng: Community · Members
    - Insight: Statistics · Career Bridge
  - Tab Overview = lưới lối tắt (hướng C) làm nội dung.
  - Mock data (FE-only, chưa có BE): `useQuerySubjectSwr` trả mock subject; log giả định.
  - i18n `subjects.*` (vi/en). Verify build webpack + tsc.
- Sub-tab content (`overview/resources/practice`) chưa brainstorm riêng → dùng layout mặc định on-canon (Overview=lưới C; Resources=list + filter; Practice=card grid shells), **log rõ** là default để review.
- `profile-shell` (§2): **HOÃN** — cần brainstorm archetype riêng (2-column shell). Không build đêm nay.

## Guardrails (loop tuân thủ)
- CHỈ ux-apply theo layout đã chốt ở mục "Layouts đã chốt". Nếu mục chưa có layout → BỎ QUA, sang mục kế.
- Build đỏ → `git restore`, log, KHÔNG commit. 2 đỏ liên tiếp → DỪNG loop.
- Thiếu contract BE → mock + log giả định. KHÔNG push/deploy.
- Mỗi vòng cập nhật `docs/NIGHT-RUN-<ngày>.md`.
