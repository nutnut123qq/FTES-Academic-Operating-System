# Tasks

- [x] 1. `pickSubjectName(locale, name, nameVi)` + áp cho `toSubjectFromSummary` / `toSubjectFromDetail`.
- [x] 2. `useQuerySubjectSwr` / `useQuerySubjectsSwr` đọc `useLocale()`; map ngoài fetcher.
- [x] 3. `Subject.recommendedSemester` + chip "Kỳ {n}" ở `SubjectCatalog` (ẩn khi null).
- [x] 4. i18n `subjects.semester` (vi + en).
- [x] 5. Mock `useLocale` trong `useQuerySubjectSwr.test.tsx`.
- [x] 6. Verify: `tsc --noEmit` sạch · `vitest src/components/features/subject` 111/111 ·
      thao tác thật trên dev server nối apitest:
      - `/vi/subjects` → "Cấu trúc dữ liệu và giải thuật · 3 tín chỉ · Kỳ 3"
      - `/en/subjects` → "Data Structures and Algorithms · 3 credits · Semester 3"
      - `/en/subjects/CSD201` → header "CSD201 · Data Structures and Algorithms"
- [ ] 7. (lượt sau) chip kỳ ở header `SubjectWorkspaceShell` + 4 field còn thiếu ở form môn Admin.
