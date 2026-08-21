# Tasks — home-landing-redirect-scope

Đánh số theo 4 TIÊU CHÍ XONG để đối chiếu ngược được.
`- [ ]` = CHƯA làm — người implement tự tick, không tick khống.

## 1. Đổi tầng chốt: component → route

- [x] 1.1 `HomeLanding` (`src/components/features/home-landing/HomeLanding/index.tsx`): thêm
      prop `redirectSignedIn?: boolean`, mặc định `false`. Khai báo kiểu props tường minh
      (file hiện chưa có props nào)
- [x] 1.2 Cùng file: nhánh `useEffect` + `if (signedIn) return null` (`:62-71`) chỉ chạy khi
      prop bật. Logic bên trong GIỮ NGUYÊN — vẫn `router.replace("/dashboard")`, vẫn chốt bằng
      `signedIn = initialized && authenticated`. Chỉ đổi ĐIỀU KIỆN vào nhánh, không đổi nội dung
- [x] 1.3 `src/app/[locale]/page.tsx`: truyền `redirectSignedIn` — route DUY NHẤT truyền
- [x] 1.4 `src/app/[locale]/home/page.tsx`: render trần `<HomeLanding />` như cũ, KHÔNG truyền
      prop
- [x] 1.5 KHÔNG đụng `src/proxy.ts`, KHÔNG thêm middleware, KHÔNG đổi giá trị trả về của
      `pathConfig().locale().home()` (`/home` vẫn là `/home`)

## 2. Logo navbar tự chọn đích theo phiên

- [x] 2.1 `src/components/features/navbar/Navbar/Logo/index.tsx`: đọc
      `state.keycloak.initialized` và `state.keycloak.authenticated` qua `useAppSelector`
      (`@/redux/hooks`) — y cách `HomeLanding/index.tsx:58-60` đọc
- [x] 2.2 Cùng file: `onPress` → `/dashboard` khi `initialized && authenticated`; ngược lại
      (khách HOẶC phiên chưa ngã ngũ) → `pathConfig().locale().home().build()`. Nhớ đưa cờ vào
      deps của `useCallback`
- [x] 2.3 Ghi vào docblock/comment vì sao nhánh "chưa ngã ngũ" nghiêng về `/home`: sau mục 1
      `/home` không đá ai nữa nên đoán nhầm là vô hại; đoán nhầm về phía `/dashboard` thì khách
      bị đá vào chỗ trống

## 3. Docblock nói đúng sự thật sau khi sửa

Cả 5 chỗ dưới đây hiện đang mô tả hành vi CŨ. Không sửa thì chúng chủ động lừa người đọc sau.
Giữ nguyên ngôn ngữ của từng file (file nào đang tiếng Anh thì viết tiếng Anh).

- [x] 3.1 `src/app/[locale]/home/page.tsx` (docblock đầu file): bỏ/sửa "Renders the same landing
      as the root" — sau bản vá hai route khác nhau đúng một điểm là redirect; nêu rõ route này
      KHÔNG redirect người đã đăng nhập
- [x] 3.2 `src/components/features/navbar/Navbar/Logo/index.tsx:33-34`: câu "reachable even while
      signed in" đúng trở lại, nhưng đích đến giờ phụ thuộc phiên — mô tả cả hai nhánh
- [x] 3.3 `src/resources/path/index.ts:8-13` (comment trong `build()`): bỏ câu "a logged-in
      visitor is sent to the dashboard by `HomeLanding` … and that applies to `/home` just as
      much as to `/`" — sau bản vá chỉ locale root còn redirect
- [x] 3.4 `src/resources/path/index.ts:15-17` (docblock `home()`): bỏ "Signed-in visitors are
      forwarded to the dashboard by the page itself". Chỉ sửa comment, giá trị trả về không đổi
- [x] 3.5 `src/components/features/home-landing/HomeLanding/index.tsx` (docblock): nói rõ redirect
      nay do ROUTE quyết định qua prop `redirectSignedIn`, không phải component. GIỮ phần giải
      thích vì sao không chốt ở edge (`session_hint` chưa từng được set) và vì sao `initialized`
      là bắt buộc — hai điều đó vẫn đúng
- [x] 3.6 `AccountMenuDropdown/AccountMenuAuthed/index.tsx:95-96`: câu "the bare locale root `/`
      is proxy-gated and would bounce" là SAI — `proxy.ts:75-77` chỉ có `/^\/admin(?:\/|$)/`.
      Thay bằng lý do thật: đăng xuất xong người dùng là khách, `/home` là landing không redirect
      ai. Đích đến KHÔNG đổi

## 4. Test (vitest + @testing-library/react)

Bắt chước cách mock của
`src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.test.tsx`
để lấy đúng cách mock `@/i18n/navigation` và store redux.

- [x] 4.1 `HomeLanding`: signedIn (`initialized=true`, `authenticated=true`) + KHÔNG truyền prop
      ⇒ `router.replace` KHÔNG được gọi VÀ landing có render (assert cả hai — chỉ assert "không
      gọi replace" thì `return null` vẫn lọt). Ca này PHẢI fail với code ở HEAD, đúng vì lý do
      tester báo
- [x] 4.2 `HomeLanding`: signedIn + `redirectSignedIn` ⇒ `replace` được gọi với `"/dashboard"`
- [x] 4.3 `HomeLanding`: khách (`initialized=true`, `authenticated=false`) + `redirectSignedIn`
      ⇒ không redirect, landing có render
- [x] 4.4 `Logo`: signedIn ⇒ `push("/vi/dashboard")`; khách ⇒ `push("/vi/home")`

## 5. Verify

- [x] 5.1 `npx tsc --noEmit` — sạch, exit 0
- [x] 5.2 `npx vitest run` trên 2 file test mới của đợt này — xanh toàn bộ; và `npx vitest run`
      toàn repo không sinh fail mới so với trước khi sửa
- [x] 5.3 `npx eslint` trên các đường dẫn đợt này đụng tới — không TẠO lỗi lint mới (repo có
      lỗi nền sẵn; đối chiếu theo dòng, không theo tổng số)
- [ ] 5.4 Kiểm bằng tay: đăng nhập rồi vào `/vi/home` và `/en/home` — thấy landing, KHÔNG bị
      chuyển sang dashboard
- [~] 5.5 ~~Kiểm bằng tay: đăng nhập rồi vào `/`, `/vi`, `/en` — VẪN sang `/dashboard`~~
      **HẾT HIỆU LỰC (mục 7)**: không còn redirect nào; kỳ vọng mới là thấy landing
- [~] 5.6 ~~Kiểm bằng tay: bấm logo navbar khi đã đăng nhập → `/dashboard`~~
      **HẾT HIỆU LỰC (mục 7)**: logo về `/home` cho mọi người, xem 7.7
- [ ] 5.7 Kiểm bằng tay: khách vào `/vi/home` và `/vi` — cả hai đều thấy landing như trước, không
      hồi quy

## 6. Ngoài phạm vi — ghi lại, KHÔNG làm

- [x] 6.1 KHÔNG sửa BackLink `fallbackHref="/home"` ở `GoldenBoardPage:97` — nó thành dead-end vì
      `/home` đá người dùng đi, mục 1 gỡ đúng nguyên nhân nên nó tự hết
- [x] 6.2 KHÔNG sửa breadcrumb "Trang chủ" ở `LegalPage:234` — nó trỏ locale root
      (`pathConfig().locale(locale).build()`), không phải `/home`, nên người đã đăng nhập bấm nó
      vẫn sang dashboard. Đó là hành vi ĐÚNG theo góp ý #23, không phải lỗi còn sót.
      **Cập nhật (mục 7):** locale root nay cũng chỉ là landing, nên breadcrumb đưa về đúng
      trang chủ — kết luận "không cần sửa" vẫn giữ, chỉ khác lý do
- [~] 6.3 ~~CÒN TREO~~ **HẾT HIỆU LỰC (mục 7)** — chớp landing ở locale root: người đã đăng nhập vào `/` vẫn thấy landing một
      nhịp rồi mới sang `/dashboard`. Không có tín hiệu phiên nào đọc được TRƯỚC paint. Đã treo
      từ `ux-feedback-2026-08-round2` (tasks 1.15); bản vá này chỉ thu hẹp số route gặp nó từ 2
      xuống 1. Sau khi gỡ hẳn redirect thì không còn đích nào để chớp sang — hết lỗi này
- [~] 6.4 ~~CÒN TREO~~ **HẾT HIỆU LỰC (mục 7)** — cửa sổ hydration của Logo: người đã đăng nhập bấm logo trước khi phiên ngã
      ngũ sẽ về `/home` chứ không về `/dashboard`. Chấp nhận có chủ đích (mục 2.3). Hết hẳn thì
      cần tín hiệu phiên đọc được trước paint — cùng hạng mục với 6.3. Logo nay một đích duy
      nhất nên không còn gì để đoán sai


## 7. Đổi hướng 2026-08-21 — gỡ hẳn redirect (chốt của chủ sản phẩm)

- [x] 7.1 `HomeLanding`: bỏ prop `redirectSignedIn`, `useEffect` redirect, `return null`,
      hai selector redux và import `useAppSelector`/`useEffect` không còn dùng
- [x] 7.2 `[locale]/page.tsx`: về `<HomeLanding />`, docblock nói rõ landing hiện cho mọi người
- [x] 7.3 `[locale]/home/page.tsx`: docblock bỏ phần "khác locale root một điểm"
- [x] 7.4 `Logo`: một đích `/home`, không đọc phiên
- [x] 7.5 `path/index.ts` + `AccountMenuAuthed`: comment bỏ mọi mô tả về gate
- [x] 7.6 Test đổi vai — `HomeLanding` không chuyển hướng ai (3 ca), `Logo` luôn `/vi/home` (2 ca)
- [ ] 7.7 Kiểm tay trên trình duyệt có phiên thật: `/vi/home`, `/vi`, logo khi đã đăng nhập,
      logo khi là khách — cả bốn đều phải ra landing/không nhảy đi đâu
