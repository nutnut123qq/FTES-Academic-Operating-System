# Tasks

## 1. BE (repo FTES-AOS-Backend)
- [x] 1.1 V333: `accent_color` + `background_effect` NULL, cố ý không DEFAULT
- [x] 1.2 `UpdateProfileRequest` + `ProfileService.update` + `ProfileMapper.selfProfile` + `ProfileViews.SelfProfile`
- [x] 1.3 `AppearanceValidator.normalizeAccent` / `normalizeEffect` + `PROFILE_INVALID_APPEARANCE`
- [x] 1.4 `AppearanceValidatorTest` — 4 test, tập trung nhánh từ chối
- [ ] 1.5 Chạy integration test (cần testcontainers) — CHƯA
- [ ] 1.6 Apply V333 + PATCH thật trên apitest — CHƯA

## 2. FE — hoà giải + đẩy lên server
- [x] 2.1 `sync.ts`: `reconcileAppearance` (server thắng theo từng field, fallback về local)
- [x] 2.2 `sync.ts`: `toServerAccent` (một chuỗi: hex nếu có, không thì preset id)
- [x] 2.3 `sync.ts`: `pushAppearance` debounce 600ms, gộp field, no-op cho khách, nuốt lỗi
- [x] 2.4 `store.ts`: 4 setter gọi `pushAppearance`
- [x] 2.5 `store.ts`: `hydrateAppearanceFromServer` — await rehydrate trước, ghi bằng `setState`
- [x] 2.6 `useQueryUserSwr` gọi hydrate best-effort sau khi có self profile
- [x] 2.7 `SelfProfile` + `ProfileUpdateRequest` thêm 2 field

## 3. Test / verify
- [x] 3.1 `sync.test.ts` — 7 test cho hoà giải + `toServerAccent`
- [x] 3.2 `npx tsc --noEmit` sạch ở các file đụng tới
- [ ] 3.3 E2E: đổi màu ở máy A, đăng nhập máy B thấy đúng màu — CHƯA chạy
