# Tasks

- [x] 1. `SubjectCatalog`: badge chữ-cái card `rounded-large` → `rounded-2xl`.
- [x] 2. `SubjectCatalog`: `SubjectCardSkeleton` badge `rounded-large` → `rounded-2xl`.
- [x] 3. `SubjectWorkspaceShell`: slot ảnh cover `size-11` `rounded-large` → `rounded-2xl`.
- [x] 4. `SubjectWorkspaceShell`: badge chữ-cái fallback `size-11` `rounded-large` → `rounded-2xl`.
- [x] 5. Xác nhận `useQuerySubjectsSwr` (list) đã mang `imageUrl` (`imageUrl ?? thumbnailUrl`)
      → không cần đổi query/DTO/BE; ảnh cover 16:9 đã bo `rounded-2xl` nhờ khung card (giữ nguyên).
- [x] 6. Verify: `npx tsc --noEmit` sạch · `vitest src/components/features/subject` xanh ·
      `npm run build` (webpack).
