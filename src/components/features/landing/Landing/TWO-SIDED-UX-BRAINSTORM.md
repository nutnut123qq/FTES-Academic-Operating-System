# UX Brainstorm — Landing section "Hai hướng đáng giá" (two-sided talent marketplace)

> `/starci-fe-ux-brainstorm` · 2026-06-26 · thầy: *"render kĩ phần này, user học thành kĩ sư, tuyển dụng có thể vào nền tảng thầy để kiếm, như topcv"*. KHÔNG code — chỉ chốt hướng.

## Mục tiêu trang (≤30s)
Section này là **lời hứa hai mặt** của StarCi: học viên học → thành kỹ sư có **portfolio đã chấm**; nhà tuyển dụng vào → **duyệt + tuyển** kỹ sư đã được vetted (như TopCV/A.Team). Người đọc phải hiểu ngay: *"học ở đây ra có hồ sơ thật, và có người tới tuyển hồ sơ đó."*

## Pain hiện tại (legacy = inventory)
- Section 7 = **2 `PitchCard` PHẲNG, chỉ chữ**: kỹ sư **không có CTA**; doanh nghiệp CTA → `/contact` (form chung, không phải funnel tuyển dụng).
- **Trùng lặp**: ngay trên nó là `RecruiterProof` (live open-to-work count + "Duyệt ứng viên" → `/talents`). Hai khối pitch-recruiter xếp chồng → loãng, lặp thông điệp.
- **"Tell" chứ chưa "show"**: hứa "portfolio hiển thị tới đối tác tuyển dụng" nhưng không cho thấy hồ sơ trông ra sao → aspirational, nhẹ.
- `LANDING_HIRING_PARTNERS` = tên công ty **giả** (Northwind/Aperture…) → đọc ra demo, hạ tín nhiệm.

## Dữ liệu THẬT khả dụng (grounded — BE inventory)
| Bằng chứng kỹ sư | Nguồn (entity / query) | Field |
|---|---|---|
| Điểm CV 0–100 + feedback | `UserCVSubmissionAttemptEntity` / `userCvSubmissionAttempts` | `score`, `detailFeedback`, `templateCvId` (Junior/Mid/Senior rubric) |
| Challenge AI chấm | `UserChallengeSubmissionAttemptEntity` + `...FeedbackEntity` | `score`, `shortFeedback`, per-criterion |
| Coding verdict | `CodingSubmissionEntity` / `UserCodingProjectionEntity` | `verdict`, `passedCount/totalCount`, `language`, `avgScore`, `solvedCount` |
| Capstone GitHub | `EnrollmentEntity` | `personalProjectGithubUrl/Branch`, `taskPlanStatus`, `tasksCompletedAt` |
| Kỹ năng / ngôn ngữ | coding submissions theo `language` + profile Skills tab | freq + rating |
| Thành tích | `UserAchievementProjectionEntity` | badges wall |
| Sẵn sàng đi làm | `UserEntity.openToWork` / `useQueryOpenToWorkUsersSwr` | live count + avatars |
| XP | `user_xp_projection` / `UserEntity.points` | total XP |
| Tuyển dụng (cung) | `HeadhuntingCompanyEntity` · `ConsultantEntity` | company/consultant profiles (display-only) |

→ Tấm thẻ ứng viên (CV score · challenge avg · skills · capstone · open-to-work) **ráp được 100% từ field đã có**. Gap thật ở: talent search/filter, recruiter auth, messaging (ngoài scope section landing này).

## 3 hướng (xem widget)
- **A — Split funnel:** 2 cột (kỹ sư | doanh nghiệp), mỗi cột 3 proof bullets + **CTA riêng đi đúng đích** (kỹ sư → bật hồ sơ; doanh nghiệp → `/talents`). Ref: A.Team, Nursa (tách 2 journey). Trade-off: rõ + đúng pattern, nhưng vẫn "tell".
- **B — Product-led candidate card (ĐỀ XUẤT):** Khoe **CHÍNH tấm thẻ TalentDirectory** (avatar rank · CV score 87/100 · challenge 12·TB84 · skills · "Sẵn sàng đi làm") làm tâm điểm, khung bởi 2 nhãn "cho kỹ sư / cho doanh nghiệp" + 2 CTA. **Gộp luôn proof của `RecruiterProof`** → bỏ stack 2 pitch. Ref: TopCV/LinkedIn candidate card, landing "show-don't-tell" ([[landing-rebuild]]). Trade-off: cần ráp 1 card mẫu (dùng data thật của 1 open-to-work user, hoặc 1 card đại diện), nhưng thuyết phục nhất + đúng ý "như TopCV".
- **C — Pipeline:** Học → Chứng minh (AI chấm) → Được tuyển (3-step strip) + 2 CTA. Ref: bootcamp outcome funnel. Trade-off: narrative đẹp nhưng vẫn chưa khoe artifact.

## CHỐT: Hướng B (product-led) + nuốt RecruiterProof
Lý do: thầy muốn "như TopCV" = **cho thấy hồ sơ**, không tả. Tấm thẻ vừa là proof cho recruiter ("đây là cái bạn duyệt") vừa là aspiration cho learner ("đây là tôi sau khoá"). Gộp `RecruiterProof` (live count + Duyệt ứng viên) vào card này → 1 khối hai-mặt mạnh, hết trùng. Giữ tinh thần A (2 CTA tách journey) bên trái card.

### IA mới của section (thay section 6+7 hiện tại)
1. SectionHeading: eyebrow "Bạn nhận được gì" → đổi title hướng kết quả tuyển dụng.
2. Hàng hai-mặt: **trái** = copy 2 journey (kỹ sư / doanh nghiệp) + live open-to-work count (avatars) + 2 CTA [Bật hồ sơ kỹ sư] (→ settings open-to-work / profile) · [Duyệt ứng viên] (→ `/talents`); **phải** = candidate card mẫu (data thật từ 1 open-to-work user qua `useQueryOpenToWorkUsersSwr`, fallback card đại diện nếu < min).
3. Bỏ `LANDING_HIRING_PARTNERS` giả (hoặc thay bằng `headhuntingCompanies` thật, ẩn khi rỗng).

### Map section → dữ liệu
| Phần | Field/Query |
|---|---|
| Candidate card | `useQueryOpenToWorkUsersSwr` (avatar, displayName, username, openToWork) + bổ sung CV/challenge score nếu expose; tạm dùng field đã có trên public profile |
| Live count + avatars | `useQueryOpenToWorkUsersSwr` (đã có ở RecruiterProof) |
| CTA "Duyệt ứng viên" | `pathConfig().talents()` |
| CTA "Bật hồ sơ kỹ sư" | route settings open-to-work (xác nhận route tồn tại) |
| Partners (optional) | `headhuntingCompanies` thật, ẩn khi rỗng |

### States
- **Loading:** skeleton mirror card (avatar + 2 dòng score + chips). 
- **Empty / < min open-to-work:** card mẫu **đại diện** (không phải user thật) + vẫn giữ copy hai-mặt — KHÔNG ẩn cả section (đây là pitch, không phải proof-gated như RecruiterProof cũ). Live count chỉ hiện khi ≥ min (honest).
- **Error:** ẩn card phải, giữ copy + CTA trái (section vẫn đứng).
- **a11y:** card có `aria-label` "Hồ sơ kỹ sư mẫu"; CTA rõ ràng; chip open-to-work có text.

## Rules áp
- KHÔNG emoji, KHÔNG uppercase ([[no-emoji]] / [[no-uppercase-text]]); icon phosphor.
- Card global: `bg-surface` + `border border-default`, no shadow; surface-in-surface (card trong section) có border.
- `CheckCircleIcon` cho "đạt/sẵn sàng" ([[elements/icon]]). CTA chính = icon + `size="lg"` ([[primary-cta-icon-size-lg]]).
- gap: section ↔ section `gap-6`; trong card `gap-3`/`gap-2` ([[gap]]).
- 1 primary action mỗi journey; cắt partner giả (grounded-in-data).

## Cắt / thêm
- **Cắt:** `LANDING_HIRING_PARTNERS` giả; 1 trong 2 khối recruiter trùng (gộp RecruiterProof vào đây).
- **Thêm:** candidate card mẫu (artifact); CTA cho phía kỹ sư (hiện đang thiếu).

→ Thầy duyệt hướng → `/starci-fe-ux-apply` để dựng.
