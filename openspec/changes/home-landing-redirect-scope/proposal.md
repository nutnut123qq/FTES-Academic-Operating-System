# home-landing-redirect-scope — Thu hẹp redirect "đã đăng nhập" về đúng locale root, trả lại `/home`

## Why

Tester báo một câu: **"vô home là nhảy dashboard"**. Người đã đăng nhập không còn cách nào
xem được trang chủ nữa — bấm logo trên navbar cũng bị đá. Đây không phải lỗi mới sinh ra hôm
nay; nó là một bản vá **quá tay từ đợt trước**, nằm im vì code chết, và vừa sống dậy.

### Bản vá gốc đặt chốt sai TẦNG

Góp ý #23 (`test01.docx`, đợt `ux-feedback-2026-08`) yêu cầu: người đã đăng nhập thì vào
thẳng không gian học, trang chủ chỉ là landing cho khách. Yêu cầu đó đúng và không bị rút lại.

Bản vá `bb81af42` hiện thực nó bằng cách đặt redirect **NGAY TRONG component**
`HomeLanding` (`src/components/features/home-landing/HomeLanding/index.tsx:62-70`):

```
useEffect(() => { if (signedIn) router.replace("/dashboard") })
if (signedIn) return null
```

Component không biết nó đang được render ở đường dẫn nào — nên chốt đặt ở đó áp cho **mọi**
route render nó. Mà có HAI route cùng render nó:

| Route | File | Ý nghĩa |
| --- | --- | --- |
| `/`, `/vi`, `/en` | `src/app/[locale]/page.tsx:5` | locale root — chỗ gõ domain trần rơi vào |
| `/vi/home`, `/en/home` | `src/app/[locale]/home/page.tsx:10` | landing ở URL tường minh, UNGATED |

⇒ người đã đăng nhập **không còn lối nào** vào trang chủ. Và không phải chỉ người tự gõ URL
mới gặp: `Logo` của navbar (`src/components/features/navbar/Navbar/Logo/index.tsx:34-36`)
trỏ thẳng `pathConfig().locale().home().build()` = `/home`, nên **cú bấm logo — cử chỉ "về
trang chủ" phổ thông nhất — cũng bị đá sang dashboard**. Docblock ngay trên nó còn ghi
*"reachable even while signed in"*, tức đúng ý định ban đầu, nhưng bản vá đã làm câu đó thành
sai.

### Vì sao mãi tới hôm nay mới lộ

Nhánh redirect chốt bằng `signedIn = initialized && authenticated`
(`HomeLanding/index.tsx:58-60`). Cờ `keycloak.initialized` **chưa từng được dispatch** trong
lịch sử repo — `setInitialized` chỉ tồn tại trong chính slice. Nên biểu thức luôn `false`, và
`bb81af42` **ship ra một nhánh code chết**: từ lúc merge tới trước hôm nay, redirect chưa
từng chuyển hướng một ai. Đã ghi rõ trong `ux-feedback-2026-08-round2/tasks.md` mục 1.10-1.11.

`68a040d0` (đợt góp ý #3) mới thực sự bật cờ đó lên. Redirect sống dậy — và cùng lúc để lộ
chỗ quá tay đã nằm im suốt. Tester gặp ngay trong ngày.

Nói cho gọn: **vá đúng yêu cầu, sai phạm vi.** Cái cần chốt là "vào locale root khi đã đăng
nhập", không phải "bất cứ ai render `HomeLanding`".

### Một comment nữa nói sai sự thật, cùng vùng

Trong khi truy nguyên thì thấy `AccountMenuAuthed/index.tsx:95-96` giải thích lý do đăng xuất
xong đi `/home` chứ không đi `/`:

> *"`home()` is the UNGATED `/home` landing; the bare locale root `/` is proxy-gated and
> would bounce."*

Câu này **SAI**. `src/proxy.ts:75-77` chỉ có đúng MỘT pattern: `/^\/admin(?:\/|$)/`. Locale
root không hề bị proxy gác — docblock ngay trên đó còn giải thích vì sao `/dashboard` cố ý
KHÔNG được liệt kê. Đích đến `/home` vẫn đúng, nhưng lý do ghi trong file là bịa; ai đọc để
sửa việc khác sẽ suy luận sai về proxy.

## What Changes

### Đổi tầng chốt: từ COMPONENT sang ROUTE

- **`src/components/features/home-landing/HomeLanding/index.tsx`** — thêm prop
  `redirectSignedIn?: boolean`, mặc định `false`. Nhánh `useEffect` + `return null`
  (`:62-71`) chỉ chạy khi prop bật; logic bên trong nhánh **giữ nguyên**, kể cả
  `router.replace("/dashboard")`. Component thôi tự quyết định thay cho route.
- **`src/app/[locale]/page.tsx`** — truyền `redirectSignedIn` (route DUY NHẤT truyền). Đây là
  chỗ khách đăng nhập bằng modal ngay trên landing, và là chỗ gõ domain trần rơi vào ⇒ góp ý
  #23 vẫn được giữ nguyên hiệu lực ở đúng nơi nó có nghĩa.
- **`src/app/[locale]/home/page.tsx`** — render trần như cũ, KHÔNG truyền prop. `/vi/home` và
  `/en/home` trở lại xem được với người đã đăng nhập.

### Logo navbar tự chọn đích theo phiên

- **`src/components/features/navbar/Navbar/Logo/index.tsx`** — đọc
  `state.keycloak.initialized` + `state.keycloak.authenticated` qua `useAppSelector` (y cách
  `HomeLanding/index.tsx:58-60` đọc). Đã đăng nhập → `/dashboard`; khách **hoặc phiên chưa ngã
  ngũ** → `/home`.

  Nhánh "chưa ngã ngũ" đi `/home` là AN TOÀN **chính vì bản vá này**: sau khi `/home` không
  còn đá ai nữa, đoán nhầm không gây hậu quả — người đã đăng nhập bấm logo trong cửa sổ
  hydration sẽ thấy landing thay vì dashboard, chứ không bị văng đi đâu cả. Trước bản vá, cùng
  một đoán nhầm sẽ dẫn tới redirect.

### Docblock: sửa những chỗ nay nói ngược sự thật

Không phải dọn dẹp cho đẹp — cả năm chỗ dưới đây đều **mô tả hành vi cũ**, và sau bản vá
chúng sẽ chủ động lừa người đọc sau:

- **`src/app/[locale]/home/page.tsx`** (docblock đầu file) — hiện nói "Renders the same landing
  as the root"; sau bản vá hai route KHÁC nhau ở đúng một điểm (redirect), phải nói rõ.
- **`src/components/features/navbar/Navbar/Logo/index.tsx:33-34`** — *"reachable even while
  signed in"*: đúng trở lại sau bản vá, nhưng đích đến giờ phụ thuộc phiên nên câu mô tả phải
  nêu cả hai nhánh.
- **`src/resources/path/index.ts:8-17`** — comment trong `build()` viết *"a logged-in visitor is
  sent to the dashboard by `HomeLanding` … and that applies to `/home` just as much as to `/`"*,
  và docblock `home()` viết *"Signed-in visitors are forwarded to the dashboard by the page
  itself"*. Cả hai câu sau bản vá là SAI. **Giá trị trả về không đổi** (`/home` vẫn là
  `/home`) — chỉ sửa comment.
- **`src/components/features/home-landing/HomeLanding/index.tsx`** (docblock) — nói rõ redirect
  nay do **ROUTE** quyết định qua prop, không phải component; giữ lại phần giải thích vì sao
  không chốt ở edge (`session_hint` chưa từng được set) và vì sao `initialized` là bắt buộc,
  vì hai điều đó vẫn đúng.
- **`src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx:95-96`**
  — thay câu "the bare locale root `/` is proxy-gated and would bounce" bằng lý do THẬT:
  `proxy.ts` chỉ gác `/admin`; đích `/home` đúng vì đăng xuất xong người dùng là **khách**, và
  `/home` là landing không redirect ai.

### Test

Bốn ca, bắt chước cách mock của
`navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.test.tsx` (mock `@/i18n/navigation`
+ store redux):

- `HomeLanding`: signedIn, **không** truyền prop ⇒ `router.replace` KHÔNG được gọi **và**
  landing có render. Ca này fail với code hôm nay, đúng vì lý do tester báo.
- `HomeLanding`: signedIn + `redirectSignedIn` ⇒ gọi `replace("/dashboard")`.
- `HomeLanding`: khách (`initialized=true`, `authenticated=false`) + prop ⇒ không redirect.
- `Logo`: signedIn ⇒ push `/vi/dashboard`; khách ⇒ push `/vi/home`.

## Không làm / còn treo

- **`src/proxy.ts` — KHÔNG đụng, và không thêm middleware.** Chốt phiên ở tầng edge không đọc
  được phiên THẬT: `AUTH_SIGNAL_COOKIE` chưa từng tới frontend này (xem docblock
  `PROTECTED_PATTERNS`, `proxy.ts:55-77` — `/dashboard` từng bị liệt kê một ngày ở `cca21d4`
  và làm sập trang cho TẤT CẢ mọi người vì đúng lý do đó). Bài học đó vẫn nguyên giá trị; bản
  vá này giữ chốt ở tầng route như cũ, chỉ thu hẹp phạm vi.
- **`pathConfig().locale().home()` giữ nguyên giá trị `/home`.** Không đổi đường dẫn, không
  đổi API — chỉ sửa comment. Đổi giá trị sẽ kéo theo mọi nơi gọi và không giải quyết thêm gì.
- **BackLink `fallbackHref="/home"` ở `GoldenBoardPage` (`:97`) — KHÔNG sửa.** Nó vốn không
  hỏng do bản thân nó; nó thành dead-end vì `/home` đá người dùng đi. Bản vá này gỡ đúng
  nguyên nhân ⇒ BackLink tự hết dead-end, không cần chạm.
- **Breadcrumb "Trang chủ" ở `LegalPage` (`:234`) — KHÔNG sửa.** Nó trỏ **locale root**
  (`pathConfig().locale(locale).build()` = `/vi`), không phải `/home`, nên sau bản vá người đã
  đăng nhập bấm nó vẫn sang dashboard. Đó là hành vi ĐÚNG theo góp ý #23 (locale root vẫn
  redirect có chủ đích), không phải lỗi còn sót. Ghi ra đây để lần sau không ai "sửa" nhầm.
- **Chớp landing ở locale root vẫn còn.** Người đã đăng nhập vào `/` vẫn thấy landing một nhịp
  trước khi sang `/dashboard` — không có tín hiệu phiên nào đọc được TRƯỚC paint. Đã treo từ
  `ux-feedback-2026-08-round2` (tasks 1.15); bản vá này không làm nó tốt hơn cũng không làm nó
  tệ hơn, chỉ thu hẹp số route gặp nó từ hai xuống một.
- **Cửa sổ hydration của Logo.** Trong lúc phiên chưa ngã ngũ, người đã đăng nhập bấm logo sẽ
  về `/home` (landing) chứ không về `/dashboard`. Chấp nhận có chủ đích: đoán sai về phía
  landing thì người dùng vẫn thấy một trang xem được, đoán sai về phía dashboard thì khách bị
  đá vào chỗ trống. Hết hẳn thì cần tín hiệu phiên đọc được trước paint — cùng một hạng mục
  treo với chớp landing.

## Capabilities

Không thêm capability mới. Đây là bản thu hẹp phạm vi của một chốt điều hướng đã có.
