# Dự án đã ghim — UX brainstorm (2026-06-25, deep pass · Opus)

> `tab=projects` → section "Dự án đã ghim" (`ProfilePinned`).
> Brainstorm ONLY — no code. After thầy chọn hướng → `/starci-fe-ux-apply`.
> Deep pass: web research + BE code verify (lần 1 đã skip web research).

## 0. Mục tiêu section

"Dự án đã ghim" = mini portfolio showcase trên public profile. Audience chính = **recruiter** (scan ≤15s). Secondary = other learners.

**Job-to-be-done:** recruiter mở profile → biết ngay (1) build được gì, (2) tech stack, (3) **có capstone StarCi xác nhận không** → quyết định liên hệ.

**Insight cốt lõi (từ web research):** một capstone "Được StarCi xác nhận" KHÔNG phải project thường — nó là **credential** (kiểu Credly digital badge): bằng chứng kỹ năng recruiter "verify với 1 click". Self-reported external repo thì recruiter phải tự đánh giá. → 2 loại pin có **trọng số tin cậy khác nhau**, design phải phản ánh điều đó, không để chúng đồng hạng visual.

---

## 1. Dữ liệu BE (verified từ code — không đoán)

Query `userPinnedProjects({ userId })` (`KeycloakOptionalAuthGraphQLGuard` + `GraphQLProfileVisibilityGuard` — auth optional, respect privacy). Service = CQRS projection (`user_pinned_projects_projections`, jsonb, CDC-refreshed). Trả `UserPinnedProjectItemData[]`:

| Field | Type | Nullable | Nguồn / ghi chú |
|---|---|---|---|
| `id` | `ID` | NO | row key |
| `type` | `ProjectPinType` `"course"\|"external"` | NO | capstone (enroll) vs self-reported |
| `title` | `String` | YES | **`COALESCE(pin.title, course.title)`** — course pin không custom title → **title CHÍNH LÀ tên khoá** |
| `description` | `String` | YES | free-form, ≤1024 |
| `url` | `String` | YES | ≤2048; course pin = copy từ `enrollment.personalProjectGithubUrl` |
| `techStack` | `[String]` | YES | tags |
| `orderIndex` | `Int` | NO | **owner kiểm soát thứ tự** (kéo trong Manage modal); API đã sort ASC |
| `isVerified` | `Boolean` | NO | **`type='course' AND enrollment.tasks_completed_at IS NOT NULL`** — external KHÔNG BAO GIỜ verified |

Max 6 pins. Mix course + external.

### ⚠️ Phát hiện sửa so với lần 1
- **KHÔNG có field `courseName` riêng.** Course title đã được **fold vào `title`** (COALESCE fallback). → KHÔNG thể làm eyebrow `"Capstone · Full Stack Mastery"` mà title lại là tên khoá nữa (trùng lặp). Lần 1 vẽ sai. → badge eyebrow chỉ là **`"Capstone"`** (course) / **`"Dự án"`** (external), course name nằm ở title.
- `isVerified` ⟺ course pin + capstone tasks done. Đây là điều kiện DUY NHẤT → "Được StarCi xác nhận" map 1-1 với `isVerified`, đáng tin.

---

## 2. Pain points hiện tại (`PinnedProjectCard` / `MediaCard`)

1. **Verified badge buried** — chip nhỏ cạnh title, dễ sót; recruiter không phân biệt capstone legit vs tự khai
2. **Không phân biệt type** — card course/external trông y hệt
3. **Tech chips không cap overflow** — 5–6 chips clutter
4. **Description line-clamp-2** — cắt giữa chừng lửng lơ, height không đều
5. **Link affordance yếu** — whole card `<a>` nhưng không có external icon
6. **Verified ≈ non-verified về visual weight** — không có cách nhanh nhận ra "StarCi chứng nhận" (mâu thuẫn với insight credential §0)

---

## 3. Ref (web research — neo pattern, không bịa)

- **GitHub pinned repos**: card = name + 1-line description + language chip + meta; lead with name + tech; bounded grid. → card grid là pattern showcase đã chứng minh.
- **Credly / digital credential portfolio**: verified badge = "instant proof recruiters verify with a click"; nên hiện **issuing authority** + tách bạch khỏi self-claimed; credential wall thường **nhóm riêng**. → verified treatment phải là tín hiệu mạnh nhất; cân nhắc tách band.
- **Badge UI (Setproduct/Cieden)**: 1 badge = 1 loại nội dung (icon HOẶC text HOẶC dot), giữ readable. → badge "Capstone"/"Dự án" gọn, strip verified riêng.
- **UX portfolio guide (uxfol.io / uxplaybook)**: project card nên surface role/context at a glance + outcome-driven summary "pull readers before they click". → giữ 1-line description (đừng cắt hết).

Nguồn: GitHub topics `portfolio-showcase`/`github-card`; Credly *Portfolio Style*; Setproduct *Badge UI design*; uxfol.io *27 UX portfolio examples*; uxplaybook *key elements portfolio 2026*.

---

## 4. Các hướng

### Hướng A — Mixed grid + verified credential strip (ĐỀ XUẤT)
2-col grid, **giữ thứ tự owner kéo** (`orderIndex`), course+external trộn theo curation của owner. Mỗi card:
- **Eyebrow badge trái**: `"Capstone"` (icon `school`, success tint) hoặc `"Dự án"` (icon `code`, muted) — phân biệt type
- **External link icon phải**: `ArrowSquareOutIcon`
- **Title**: `font-medium`, `group-hover:underline` (course pin → title = tên khoá)
- **Description 1-line** (`line-clamp-1`): context nhanh, height đều (theo UX portfolio research — đừng cắt hết)
- **Tech chips**: max 2–3 + `"+N"` overflow muted
- **Verified strip** (`isVerified`): full-width success strip CHÂN card — `bg-success/10` + `SealCheckIcon`/rosette + "Được StarCi xác nhận"
- **Verified border**: `border-success/40`

**Pros:** robust với mọi phân bố data (0/1/nhiều verified); tôn trọng owner ordering (đúng bản chất "pinned = curation"); verified strip là tín hiệu mạnh nhất; type badge hết mơ hồ.
**Cons:** verified và non-verified xen kẽ → mắt nhảy; height lệch nhẹ (verified có strip).

### Hướng B — Credential-tiered (verified band trên · khác dưới)
Nhóm 2 tầng: band **"Được StarCi xác nhận"** (verified capstones) TRÊN + band **"Dự án khác"** (external/non-verified) DƯỚI. Mỗi band = grid 2-col compact.
**Ref:** Credly credential wall (tách credential khỏi self-claimed).
**Pros:** tín hiệu credential mạnh nhất — recruiter thấy "StarCi-verified" thành 1 khối riêng, không thể bỏ sót; đúng insight §0 (credential ≠ project thường).
**Cons:** **PHÁ thứ tự owner kéo** (`orderIndex` chỉ còn nghĩa trong band) — mâu thuẫn bản chất "pinned = owner curation"; 0 verified → band trên rỗng/biến mất (đa số user early-stage); 2 band header tốn dọc cho list ≤6 item.

### Hướng C — Verified hero + grid
Capstone verified ấn tượng nhất (orderIndex thấp nhất trong nhóm verified) = hero full-width (description đầy đủ + tech + strip prominent), còn lại 2-col compact.
**Pros:** showcase 1 credential thật nổi; hierarchy rõ.
**Cons:** phụ thuộc có ≥1 verified; nếu 0 verified → hero là external (giảm tác dụng); layout phức tạp; lệch owner ordering.

---

## 5. CHỐT: Hướng A

Lý do:
1. **Robust nhất** — đẹp & đúng với mọi data: 0 verified (toàn external), 1, hay nhiều. B/C đều có failure mode khi 0 verified (band rỗng / hero là external).
2. **Tôn trọng `orderIndex`** — "pinned" = owner curation (kéo thứ tự trong Manage modal). A giữ nguyên ý đồ owner; B/C ghi đè bằng verified-grouping → phản bản chất tính năng.
3. **Verified strip CHÂN card full-width** đã đủ mạnh để recruiter không bỏ sót (insight credential thoả mãn) mà không cần phá layout.
4. **Type badge + 1-line desc + chips cap** giải quyết toàn bộ pain §2.

> Nếu sau này verified-capstone trở thành tín hiệu bán hàng chính (vd nhiều user có 3+ capstone) → cân nhắc nâng lên B. Hiện tại early-stage → A.

---

## 6. Field → component map (Hướng A)

| Field | Component | Ghi chú |
|---|---|---|
| `type` | eyebrow badge | `course` → `"Capstone"` (school icon, success) · `external` → `"Dự án"` (code icon, muted) |
| `title` | card title | `font-medium`, `group-hover:underline` (course → tên khoá) |
| `description` | 1-line preview | `line-clamp-1` muted; guard null |
| `techStack[]` | `Chip array` | max 2–3 + `"+N"` overflow muted; null → ẩn |
| `isVerified` | verified strip + border | `border-t` chân card `bg-success/10` + SealCheck + "Được StarCi xác nhận"; card `border-success/40` |
| `url` | `<a href>` whole card | `+ ArrowSquareOutIcon` góc phải; `target="_blank" rel="noopener"` |
| `orderIndex` | sort | đã sort API; owner kéo trong Manage modal |

---

## 7. Cut / thêm / giữ

**Cut:** description line-clamp-2 (→ 1-line); tech chips uncapped.
**Thêm:** type badge eyebrow; verified success strip chân card; verified border tint; chips overflow cap; ArrowSquareOut icon.
**Giữ:** 2-col grid; whole card `<a href={url}>`; `LabeledCard` "Dự án đã ghim" + `PushPinIcon`; "Quản lý" (owner-only → `ManagePinnedProjectsModal`); max 6; `orderIndex` ordering.

---

## 8. Empty / loading / error

- **Loading**: 2×2 skeleton cards (height cố định mirror verified/non-verified)
- **Empty (owner)**: `EmptyContent` `PushPinIcon` + "Ghim dự án nổi bật để recruiter thấy ngay" + "Thêm dự án" → `ManagePinnedProjectsModal`
- **Empty (viewer)**: `EmptyContent` "Chưa có dự án nào được ghim"
- **Error**: `AsyncContent` retry

---

## 9. A11y

- `<a href target="_blank" rel="noopener noreferrer" aria-label="{title} — mở trong tab mới">`
- Verified strip text-led (không chỉ icon); icon `aria-hidden`, kèm text "Được StarCi xác nhận"
- Tech chips / type badge = plain `<span>`, không role
- Overflow `"+N"` chip có `title`/`aria-label` liệt kê phần ẩn (optional)

---

## 10. BE gap / opportunity

- **`courseName` riêng KHÔNG cần** — title đã = course name cho course pin (badge chỉ "Capstone"). OK với hướng A.
- **(opportunity) Verification deep-link**: Credly research → credential nên link tới trang xác minh. Hiện `url` trỏ GitHub repo của học viên, KHÔNG có link tới capstone review/proof của StarCi. Nếu muốn "verify with a click" đúng nghĩa → BE expose thêm link tới trang capstone/certificate. Defer (chưa cần cho A; chỉ là nâng cấp tin cậy sau).
