# FE Refactor Plan — Handoff

Mục tiêu: refactor toàn repo FE theo bộ rule strict đã chốt. Session này nên chạy **trong repo FE** (`C:\Repositories\starci-academy`) để agent có quyền ghi → swarm song song được.

## Rule nguồn (đọc trước)
- `.cursor/rules/starci-academy-fe.mdc` (alwaysApply) — file-splitting, hooks, actions onXXX, decomposition+nesting, barrel, CSS, comments STRICT.
- `.cursor/rules/design-pattern.mdc`, `.cursor/rules/component.mdc`.
- `.claude/pattern/` (01→14) — doc giải thích từng mảng.

## Mẫu chuẩn (đã làm, tsc=0) — COPY PATTERN NÀY
`src/components/layouts/profile/AiSettings/` — refactor từ `page.tsx` 302 dòng. Thể hiện đủ: container(logic)/presentational, nested ASAP (LaneSelector/LaneCard), `types/ enums/ constants/ map.tsx` + barrel, `onXXX`+useCallback, useMemo, JSDoc-all, casing (Pascal=component, lowercase=nhóm), page chỉ `return <AiSettings/>`. Nhân pattern này ra.

## Quy tắc verify
Sau MỖI đợt: `npx tsc --noEmit` ở repo root phải = **0 lỗi** (baseline hiện 0). Không sang đợt sau nếu chưa sạch.

## Chia đợt + model
**Đợt 1 — mechanical (Sonnet, song song, vùng rời):**
- ✅ **ĐÃ XONG: `src/redux/slices/`** — 29 slice đã JSDoc đầy đủ + barrel, `tsc=0` (làm ở session trước). Bỏ qua, chỉ verify lại nếu muốn.
- `src/modules/api/graphql/queries/` → tách `XxxRequest/Response/Data` inline ra `queries/types/<name>.ts` + barrel; `queries/index.ts` thêm `export * from "./types"`. KHÔNG move domain enum (AiMode/ModelProvider… để nguyên trong file query). Giữ `gql`/enum-doc-key/queryMap trong file op. JSDoc mọi export.
- `src/modules/api/graphql/mutations/` → tương tự (`mutations/types/`). Mutation import enum từ queries giữ nguyên.
- `src/redux/slices/` → JSDoc mọi slice/state/action + đảm bảo barrel. Không đổi logic.
- `src/modules/types/` (entities/enums) → JSDoc + `Array<T>` + barrel.
- `src/hooks/` → JSDoc + `useCallback`; one concern/file.

**Đợt 2 — decomposition (Opus, từng folder rời, KHÔNG đụng `layouts/index.ts` & `components/index.ts`):**
File to nhất đang vi phạm (line count):
- `layouts/AdminUploadVideo` (613), `layouts/Task` (377), `layouts/CV/CVUpload` (353), `modals/ChallengeModal/ChallengeSubmissionPanel` (330), `reuseable/CVSubmissionForm` (291), `drawers/UserCvSubmissionAttemptsDrawer` (280), `modals/AuthenticationModal/SignInSection/CredentialsState` (251), `reuseable/MarkdownContent` (246), `reuseable/PDFView` (238), `layouts/Course/Stepper` (231)…
Mỗi folder: tách sub-component nested ASAP, `types/ map.ts/ constants/`, `onXXX`+useCallback, useMemo, JSDoc. Giữ export name của folder (index.tsx) để không phải sửa barrel cha.

**Đợt 3 — dọn:** map inline → `map.ts`; object dùng chung → `src/config/`; page.tsx chỉ render component.

## Lưu ý
- ⚠️ **Mega-barrel** `components/index.ts` + `layouts/index.ts` đang tồn tại (vi phạm rule "no mega barrel") nhưng dùng app-wide → gỡ là việc rủi ro riêng, để cuối, cân nhắc kỹ. Đợt decomposition đừng đụng chúng (giữ export name folder).
- ⚠️ `reuseable` là typo sẵn của repo — GIỮ NGUYÊN, đừng đổi thành `reusable`.
- ⚠️ `reuseable/` được dùng hook UI-only (useState/useDisclosure/useId/useMemo), chỉ cấm logic nghiệp vụ (SWR/redux/fetch).
- ⚠️ Enum value khớp backend `createEnumType` (thường chữ thường).
- ⚠️ Comment có chuỗi `*/` trong JSDoc sẽ đóng comment sớm — tránh (đã dính 1 lần ở config/index.ts).
- Backend GraphQL/entity: `C:\Repositories\ac\starci-academy-backend` — đối chiếu hợp đồng khi sửa types.
