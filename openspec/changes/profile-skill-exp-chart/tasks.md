# Tasks — profile-skill-exp-chart

## 1. REST layer (career)
- [x] 1.1 `modules/api/rest/career/types.ts`: `CareerSkillCategory` (slug, label, sortOrder) +
      `CareerUserSkillExp` (slug, label, sortOrder, totalExp) — soi thẳng record đã ship của BE
      (`SkillExpDtos.CategoryView` / `CategoryExpView`), id hàng nằm lại phía server, slug là khoá công khai
- [x] 1.2 `modules/api/rest/career/career.ts`: `getCareerSkillCategories()` → `GET /career/skill-categories`,
      `getMyCareerSkillExp()` → `GET /career/me/skill-exp` (cả hai `authenticated: true`)

## 2. Block "ranked bar-per-row"
- [x] 2.1 `blocks/stats/RankedBarChart/index.tsx`: props-only, mỗi hàng = nhãn + số thô + track/fill;
      `max` tuỳ chọn (mặc định = cột cao nhất), footer trục `0 … max`, 1 màu accent (màu không mã hoá
      thêm thông tin nào), token ngữ nghĩa (`bg-default` / `var(--accent)`), KHÔNG hex

## 3. Feature skill-exp
- [x] 3.1 `features/skill-exp/hooks/skillExpModel.ts`: mapping thuần — `buildSkillExpChart(categories, totals)`
      (đủ mọi nhóm kể cả 0, sort EXP giảm dần rồi `sortOrder`/tên), `niceAxisMax(peak)` (làm tròn LÊN
      theo nấc × 10ⁿ), đọc rộng rãi snake_case lẫn camelCase như `readRelation` của skill-graph
- [x] 3.2 `features/skill-exp/hooks/skillExpModel.test.ts`: vitest cho merge / sort / nhóm 0 / rỗng /
      auto-scale trục / hàng lạ
- [x] 3.3 `features/skill-exp/hooks/useQuerySkillExpSwr.ts`: SWR key `["skill-exp"]`, gọi song song 2
      endpoint, `me/skill-exp` lỗi → `[]` (không có quyền career vẫn đọc được trang)
- [x] 3.4 `features/skill-exp/SkillExpChart/index.tsx` + `SkillExpChartSkeleton.tsx`: `AsyncContent`
      (skeleton mirror đúng hàng bar + footer trục), empty khi mọi nhóm = 0, error + retry
- [x] 3.5 Barrel `features/skill-exp/index.ts` + `hooks/index.ts`

## 4. Hồ sơ + i18n
- [x] 4.1 `features/profile/ProfileProgress/index.tsx`: `<SkillGraph/>` → `<SkillExpChart/>`,
      nhãn `LabeledCard` = `skillExp.title` (KHÔNG xoá `SkillGraph` — tab Nghề nghiệp của môn còn dùng)
- [x] 4.2 `messages/vi.json` + `messages/en.json`: namespace `skillExp.*` (title, expValue, axisHint,
      empty, error, retry, `categories.<slug>` cho 10 nhóm seed)

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` EXIT 0
- [x] 5.2 `npx vitest run src/components/features/skill-exp` — 14/14 xanh
- [x] 5.3 `npm run build` (turbopack — KHÔNG đổi sang `--webpack`) EXIT 0
- [x] 5.4 `npx eslint` trên 4 thư mục đụng tới EXIT 0

## 6. Ghi chú triển khai
- **Nhãn nhóm**: `skillExp.categories.<slug>` (vi khớp đúng chữ seed của BE), thiếu khoá thì rơi về
  `label` BE trả — admin thêm nhóm mới vẫn hiện tên tử tế, không lòi khoá i18n. Cùng khuôn
  `MyGamificationBadge.fallbackName`.
- **Trục tự giãn**: `niceAxisMax` dùng nấc `[1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] × 10ⁿ` — đủ dày để cột
  cao nhất vẫn lấp gần hết track (phí tối đa 1/3 trục), nhưng số in ra trục vẫn tròn. KHÔNG chuẩn hoá
  0–100, KHÔNG bịa trần.
- **Không đụng `SkillGraph`**: vẫn còn ở `features/subject/SubjectCareer` (subject-scoped) và
  `features/career/hooks/useQueryCareerSwr.ts` (dùng type `CareerSkillGraph`).
- **Chưa chạy được thật**: endpoint `course-skill-exp` mới xong ở repo BE, chưa deploy lên
  `apitest.ftes.vn` → chưa soi live được; trước khi deploy BE, khối này hiện trạng thái lỗi + nút thử lại.
