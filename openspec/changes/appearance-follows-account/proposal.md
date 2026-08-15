# appearance-follows-account — accent + hiệu ứng nền đi theo TÀI KHOẢN, không chỉ theo máy

> **Change hồi tố.** Code đã ship trong đợt 2 (2026-08-15); tài liệu viết SAU theo diff thật.
> Change này chạm CẢ HAI repo: phần BE (migration + validate + test JUnit) nằm ở
> `FTES-AOS-Backend`, phần FE mô tả dưới đây. Spec delta ở đây chỉ nói phần FE quan sát được.

## Why

Lựa chọn giao diện (màu chủ đạo + hiệu ứng nền) chỉ nằm trong `localStorage`. Đổi máy, đổi trình
duyệt, hay xoá dữ liệu duyệt web là mất sạch — trong khi nó là lựa chọn cá nhân người dùng nghĩ là
"của tài khoản mình".

## What Changes

### BE (repo `FTES-AOS-Backend`, ghi ở đây để không nhầm là FE tự bịa field)
- Migration **V333** thêm `accent_color varchar(32) NULL` + `background_effect varchar(32) NULL` vào
  `profile.profiles`. **CỐ Ý không đặt DEFAULT**: `NULL` = "chưa từng chọn", phân biệt được với "đã
  chọn đúng bằng mặc định" — nếu không, hàng mới sẽ đạp lên lựa chọn đang nằm trong localStorage máy cũ.
- Đường ghi là endpoint **CÓ SẴN**: `PATCH /api/v1/profiles/me` (KHÔNG phải PUT). Hai field thêm vào
  `UpdateProfileRequest`, validate rồi set trong `ProfileService.update`, và trả về trong projection
  self-profile.
- `AppearanceValidator`: accent phải là preset (indigo/pink/teal/emerald/amber/violet) hoặc hex
  `#rgb|#rrggbb`; effect phải thuộc 10 giá trị đã biết. Sai → `PROFILE_INVALID_APPEARANCE` (400).
  Không lưu chuỗi tuỳ ý vì FE ghi thẳng giá trị này vào `data-accent` / `--accent` trên `<html>`.
  Test JUnit tập trung nhánh TỪ CHỐI (`"red"`, `"rgb(255,0,0)"`, `"var(--x)"`, `"url(...)"`,
  `"#12345"`, `"indigo;background:red"`, rỗng).

### FE
- **`hooks/zustand/appearance/sync.ts` (mới)** — ba thứ thuần + một side effect:
  - `reconcileAppearance(server, local)`: **server thắng KHI CÓ giá trị, theo TỪNG FIELD**. Khách
    (`server === null`), field `null`, hoặc giá trị bản build hiện tại không render được → dùng
    local, **không snap về mặc định cứng** (đăng nhập trên máy mới mà reset trắng lựa chọn đang hiển
    thị là hành vi tệ hơn). Preset id từ server xoá custom local; hex từ server giữ preset local ở
    dưới, vì tài khoản chỉ lưu MỘT chuỗi accent còn preset là chỗ picker rơi về khi reset.
  - `toServerAccent(accent, accentCustom)`: một chuỗi duy nhất — hex nếu có, không thì preset id.
  - `pushAppearance(patch)`: debounce 600ms, gộp field, **no-op khi chưa đăng nhập** (khách PATCH
    chỉ để ăn 401 mỗi lần bấm swatch), và **nuốt lỗi** vì đây là thứ trang trí đã áp + đã lưu local rồi.
- **`store.ts`**: 4 setter (`setAccent` / `setAccentCustom` / `resetAccent` / `setEffect`) gọi
  `pushAppearance`. Thêm `hydrateAppearanceFromServer(profile)`:
  - **await `persist.rehydrate()` TRƯỚC** — store dùng `skipHydration`, không await thì viewer về
    nhanh sẽ bị localStorage rehydrate đạp lại SAU;
  - ghi bằng `setState` chứ **KHÔNG qua setter** — qua setter sẽ vọng lại một PATCH đúng giá trị vừa
    nhận từ server;
  - ghi qua `persist` nên localStorage đồng bộ theo account → script pre-paint ở `layout.tsx` đọc
    đúng ở lần tải sau, không nháy màu. **KHÔNG đụng `layout.tsx`.**
- **`useQueryUserSwr.ts`** (đường nạp viewer, vốn đã gọi `getSelfProfile`) gọi
  `hydrateAppearanceFromServer(profile)` best-effort. Khách không bao giờ tới đây nên hành vi
  localStorage của khách giữ nguyên.
- **`AccentSection` / `EffectSection` KHÔNG cần sửa** — chúng đã đi qua setter của store.
- `effectDirection` / `effectSpeed` **cố ý vẫn device-local** (đề bài chỉ yêu cầu accent + effect).
- Test vitest `sync.test.ts` — 7 test cho quy tắc hoà giải + `toServerAccent`.

## Impact

- Affected specs: `appearance-settings` (ADDED — đồng bộ theo tài khoản)
- Affected code (FE): `hooks/zustand/appearance/{sync.ts,sync.test.ts,store.ts}`,
  `hooks/swr/api/graphql/queries/useQueryUserSwr.ts`, `modules/api/rest/profile/types.ts`,
  `resources/constants/appearance.ts`
- Affected code (BE, repo khác): `V333__profile_appearance_preferences.sql`, `AppearanceValidator`,
  `ProfileService`, `ProfileMapper`, `ProfileEntity`, `UpdateProfileRequest`, `ProfileViews`,
  `ProfileError`, `AppearanceValidatorTest` (+ 2 IT chỉ sửa cho compile)
- Không thêm chuỗi hiển thị nào → không đụng `messages/{en,vi}.json`.

## Điều CHƯA verify / cần biết

1. **Chưa có lần PATCH thật nào chạy qua.** V333 chưa apply ở apitest và phiên này bị cấm dựng dev
   server; kiểm chứng dừng ở compile + unit test.
2. BE integration test chưa chạy (cần testcontainers, CI vốn `skipITs`) — chỉ đảm bảo COMPILE.
3. **Lỗi PATCH bị nuốt im lặng** (có chủ ý: màu đã áp + đã lưu local). Hệ quả: nếu server từ chối
   thì user không biết, và máy khác sẽ không thấy lựa chọn mới.
4. `PATCH /profiles/me` yêu cầu permission `profile.update.self`. Chưa kiểm tra permission đó có
   được cấp mặc định cho học viên hay không — thiếu nó thì đồng bộ im lặng không hoạt động.
