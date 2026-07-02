## 1. Catalog
- [x] 1.1 `useQuerySubjectsSwr` — mock list (reuses `Subject` shape)
- [x] 1.2 `features/subject/SubjectCatalog` — search + difficulty filter + card grid
- [x] 1.3 `[locale]/subjects/page.tsx` renders SubjectCatalog

## 2. Wiring
- [x] 2.1 i18n `nav.subjects` + `subjects.catalog.*` (vi/en)
- [x] 2.2 `subjects` path builder + Subjects in `useAppNav` (top of "Học")
- [x] 2.3 Landing Subject tile → `/subjects`

## 3. Verify
- [x] 3.1 npm run build (webpack) green + tsc clean + eslint clean + JSON valid
