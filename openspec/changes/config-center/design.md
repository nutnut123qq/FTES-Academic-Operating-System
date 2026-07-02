# Design — config-center

## Context

- **Khu admin**: `/admin/roles` (rbac-roles) là bề mặt admin đã có; Config Center là **"config section"** của cùng admin console (`admin-moderator-console`). Nó KHÔNG dựng shell admin riêng — nó là một route con dưới `/admin` dùng chung layout/gating của khu admin.
- **Gating**: rbac-roles định nghĩa 4 role (`member`, `moderator`, `admin`, `superAdmin`). Config Center là bề mặt vận hành nhạy cảm nhất (bật/tắt tính năng toàn hệ, đổi hằng số hệ thống) → gate ở **`superAdmin`** (chặt hơn `/admin/roles` vốn cho "operator"). Role hiện tại lấy từ mock auth/session của FE (auth-flows-mock); khi chưa đủ quyền → render **forbidden surface** (403-style), KHÔNG 404, để nói rõ "bạn không có quyền" thay vì "không tồn tại".
- **appearance-settings**: đã có store `appearance` (accent/effect) persist localStorage. Config Center danh mục `appearance` là nơi quản **mặc định toàn hệ** (default accent, default effect direction) — forward-looking, non-breaking: change này chỉ SPEC ra ô setting đó, không bắt buộc rewire runtime của appearance store.
- **Canon nhà**: FE-only thì mock + ghi giả định; envelope BE `data` nullable; zustand + `persist` là canon cho preference/mock-state; HeroUI + i18n vi/en; không emoji trong UI; verify `npm run build` (webpack) + `tsc --noEmit`.

## Goals / Non-Goals

**Goals**
- Một bề mặt Config Center `/admin/config` gated Super Admin, có nav 7 danh mục, đọc/ghi mock.
- Feature flags: on/off/rollout% + mô tả + last-changed, toggle-confirm, search/filter.
- System settings key-value: form nhóm (text/number/select/toggle) + validate + save/reset + dirty-guard + audit note (mock).
- Scope selector stub (Global vs env) — hiển thị, deferred cho per-env thực.
- Trạng thái loading/empty/error, responsive, i18n `admin.config.*`, a11y đầy đủ.
- Mock store với **seam swap BE config-service** ghi tường minh (1 chỗ đổi).

**Non-Goals**
- KHÔNG dựng BE config-service thật (contract là assumption).
- KHÔNG per-environment store thật (scope selector chỉ stub; per-env = deferred).
- KHÔNG sửa spec `rbac-roles` / dựng lại admin shell (tái dùng khu admin).
- KHÔNG rewire runtime của appearance store trong change này (chỉ spec ô setting mặc định).
- KHÔNG audit trail đầy đủ (chỉ last-changed by/when mock; audit-log service là §24 riêng).

## Decisions

### D1 — Route + đặt chỗ trong admin console

- Route: **`/admin/config`** với danh mục chọn qua **`/admin/config/[category]`** (segment) — default redirect `/admin/config` → `/admin/config/general`. (Query `?category=` là alternative bị loại: segment cho deep-link + breadcrumb đẹp hơn.)
- Sống dưới layout khu admin (cùng chỗ `/admin/roles`). Layout admin đảm nhiệm chrome (sidebar/breadcrumb khu admin); Config Center chỉ render nội dung config-section của nó.
- **Gating tại layer route** (`/admin/config/layout` hoặc guard component): đọc role từ mock session; `role !== "superAdmin"` → render `<ConfigForbidden />` (không mount nội dung config, không gọi store). Guard chạy TRƯỚC khi lộ bất kỳ dữ liệu cấu hình nào.

### D2 — Data model: flags + settings + scope

```ts
// Feature flag
type FlagStatus = "on" | "off" | "rollout"
interface FeatureFlag {
    key: string                 // "community.polls", "search.v2"
    descriptionKey?: string     // i18n key hoặc mô tả literal (mock)
    status: FlagStatus
    rolloutPercent: number      // 0..100, ý nghĩa khi status==="rollout"
    lastChangedAt: string       // ISO (mock)
    lastChangedBy: string       // tên/handle (mock)
}

// System setting (key-value)
type SettingType = "text" | "number" | "select" | "toggle"
interface SettingField {
    key: string                 // "general.siteName", "limits.maxUploadMb"
    type: SettingType
    value: string | number | boolean
    options?: { value: string; labelKey: string }[]  // cho type==="select"
    validation?: { required?: boolean; min?: number; max?: number; pattern?: string }
    labelKey: string
    helpKey?: string
}
interface SettingGroup {
    id: string                  // trùng 1 category ("general", "limits", ...)
    fields: SettingField[]
    lastChangedAt?: string      // audit note (mock)
    lastChangedBy?: string
}

// Scope (stub)
type ConfigScope = "global" | "production" | "staging"

type ConfigCategory =
    | "general" | "feature-flags" | "appearance"
    | "integrations" | "notifications" | "security" | "limits"
```

- Flags và settings là 2 dạng dữ liệu riêng: `feature-flags` là danh mục render **danh sách flag**; 6 danh mục còn lại render **form nhóm setting**. `security` = "Security/RBAC visibility" (ví dụ toggle "hiện permission matrix cho admin", "cho phép self-signup") — KHÔNG sửa role thật (đó là rbac-roles), chỉ là setting hiển thị/policy cấp cao.

### D3 — Mock store + seam swap BE config-service

- `src/hooks/zustand/config/store.ts`: zustand + `persist` (`name: "ftesaos-config"`) giữ `flags: FeatureFlag[]`, `groups: Record<category, SettingGroup>`, `scope: ConfigScope`, `status: "idle"|"loading"|"error"`. Seed data literal (mock) trong `src/resources/constants/config.ts`.
- **Seam swap (STRICT, 1 chỗ đổi)**: mọi đọc/ghi đi qua một lớp `configService` (`src/services/config/index.ts`) với chữ ký giống BE thật:

```ts
interface ConfigService {
    listFlags(scope: ConfigScope): Promise<FeatureFlag[]>
    setFlag(key: string, patch: Partial<Pick<FeatureFlag, "status" | "rolloutPercent">>): Promise<FeatureFlag>
    getGroup(category: ConfigCategory, scope: ConfigScope): Promise<SettingGroup>
    saveGroup(category: ConfigCategory, values: Record<string, unknown>): Promise<SettingGroup>
}
// Mock impl: đọc/ghi zustand store, giả delay + có cờ mô phỏng lỗi (test error state).
// Swap: thay mockConfigService bằng httpConfigService gọi GET/PUT /config/*, /config/flags.
```

- **Giả định BE** (assumption tường minh — CHƯA tồn tại): `GET /config/flags?scope=`, `PATCH /config/flags/:key`, `GET /config/:category?scope=`, `PUT /config/:category` — envelope `{ data, ... }` với `data` nullable (canon nhà). Store mock mô phỏng đúng shape này để swap chỉ đổi impl của `ConfigService`, không đổi UI.
- Alternative bị loại: gọi thẳng zustand từ component (khó swap BE); context/remote-config SDK (nặng, thừa cho mock).

### D4 — Feature flags: toggle-confirm + rollout + search

- Danh sách flag = bảng/list rows: mỗi row có `key`, mô tả, **radiogroup trạng thái** (Off / On / Rollout), khi `Rollout` hiện slider/number 0–100, và caption `lastChangedBy` + `lastChangedAt`.
- **Toggle cần confirm**: đổi trạng thái (đặc biệt off→on / on→off toàn hệ) mở **HeroUI Modal confirm** ("Bật/tắt cờ này ảnh hưởng người dùng thật — xác nhận?"); Hủy → không đổi. Đổi `rolloutPercent` không confirm (điều chỉnh nhỏ) nhưng vẫn ghi lastChanged.
- **Search/filter**: `SearchInput` (block nhà) lọc theo key/mô tả + filter chip theo trạng thái (all/on/off/rollout). Rỗng kết quả → empty state.

### D5 — System settings: form + validate + save/reset + dirty-guard + audit

- Mỗi danh mục setting render `SettingGroupForm`: map `SettingField.type` → control HeroUI (`Input` text/number, `Select`, `Switch`). Giá trị nháp giữ trong local form state (draft), tách với store đã lưu.
- **Validation**: required / min-max (number) / pattern (text) → lỗi hiển thị dưới field + chặn Lưu; lỗi được announce (aria).
- **Lưu / Đặt lại**: "Lưu" gọi `configService.saveGroup` → success toast + cập nhật `lastChangedAt/By` (mock = "bạn" + now); lỗi (mock) → error toast, giữ nguyên draft. "Đặt lại" trả draft về giá trị đã lưu.
- **Dirty-state guard**: khi draft ≠ đã lưu → chặn điều hướng rời (đổi danh mục / rời route) bằng confirm ("Có thay đổi chưa lưu — rời đi?"). Dùng `beforeunload` + intercept chuyển danh mục nội bộ (cùng họ dirty-guard các form nhà).
- **Audit note**: mỗi group hiển thị dòng "Sửa lần cuối bởi {who} lúc {when}" (mock) — không phải audit-log đầy đủ.

### D6 — Scope selector (stub, DEFERRED)

- Ở đầu shell: `Select` scope = `Global` (default) · `Production` · `Staging`. Chỉ `Global` có dữ liệu thực trong mock; chọn env khác → panel hiện trạng thái "Cấu hình theo môi trường sắp có" (empty-variant), KHÔNG ghi đè dữ liệu Global.
- **Deferred** vì per-env thực = tách store/BE per-env (nặng, thuộc config-service). Stub để UI/route sẵn sàng khi BE có. Ghi rõ trong tasks là stub.

### D7 — Component decomposition

- `ConfigCenterLayout` (guard superAdmin + chrome section: breadcrumb, tiêu đề, scope selector).
- `ConfigCategoryNav` (7 mục; desktop = rail dọc, mobile = dropdown/drawer).
- `FeatureFlagsPanel` → `FlagRow` (+ `FlagStatusRadioGroup`, `RolloutControl`) + `FlagConfirmModal` + search/filter.
- `SettingGroupForm` → `SettingFieldControl` (switch theo type) + `SaveResetBar` + `AuditNote`.
- `ConfigForbidden` (403 surface), `ConfigSkeleton` (mirror layout), `ConfigEmptyState`, `ConfigErrorState`.
- `configService` (seam) + `useConfigStore` (zustand persist) + seed constants.

### D8 — i18n `admin.config.*`

Cụm `admin.config.*` (vi + en): `title`, `forbidden.{title,body}`, `scope.{label,global,production,staging,comingSoon}`, `nav.{general,featureFlags,appearance,integrations,notifications,security,limits}`, `flags.{search,statusOn,statusOff,statusRollout,rolloutPercent,lastChanged,confirmTitle,confirmBody,empty}`, `settings.{save,reset,dirtyTitle,dirtyBody,saved,saveError,required,min,max,pattern,auditNote,empty}`, `loading`, `error`. Copy vi chốt: "Trung tâm cấu hình", "Bạn không có quyền truy cập", "Phạm vi", "Toàn hệ thống", "Cờ tính năng", "Lưu", "Đặt lại", "Có thay đổi chưa lưu".

## Risks / Trade-offs

- [Mock persist khác BE thật → swap có thể lệch] → mọi I/O qua `ConfigService` với chữ ký = shape BE giả định (envelope `data` nullable); swap chỉ đổi 1 impl. Ghi assumption rõ.
- [Gate FE-only bỏ qua được bằng devtools] → chấp nhận ở FE-only; forbidden surface là UX guard, enforcement thật ở BE khi có. Không lộ dữ liệu config nếu guard fail (guard trước mount).
- [Dirty-guard chặn cả điều hướng hợp lệ gây khó chịu] → chỉ chặn khi thực sự dirty; confirm 1 bước, không nag; "Đặt lại" clear dirty.
- [Scope stub gây hiểu nhầm là đã hỗ trợ per-env] → env khác Global hiện rõ "sắp có", không cho lưu → không tạo kỳ vọng sai.
- [7 danh mục nhiều → mobile chật] → nav collapse thành dropdown/drawer trên `<sm`.

## Migration Plan

1. Land store mock + `configService` seam + seed constants + i18n (`admin.config.*`).
2. Land shell + gating (forbidden) + nav + scope stub.
3. Land Feature Flags panel (list + confirm + search).
4. Land Setting group form (validate + save/reset + dirty-guard + audit).
5. Trạng thái loading/empty/error + responsive + a11y pass.
6. Swap BE = thay `mockConfigService` → `httpConfigService` (1 chỗ) khi config-service có; rollback = revert (FE-only, localStorage mock vô hại).

## Open Questions

- Danh sách flag/setting seed cụ thể (key nào) chốt lúc implement — không chặn spec (shape đã cố định).
- BE config-service envelope/paths chính xác — assumption; chốt khi §24 config-service triển khai.
- Per-env scope thực (deferred) — thiết kế store/BE per-env khi cần.
