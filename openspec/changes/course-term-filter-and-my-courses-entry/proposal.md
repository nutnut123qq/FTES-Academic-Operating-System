# course-term-filter-and-my-courses-entry — lọc theo kỳ học, và "Khoá học của tôi" có đường vào thật

> **Xuất xứ: góp ý của NGƯỜI DÙNG sau khi test**, không phải việc tự nghĩ ra. Ba góp ý:
>
> 1. Trang catalog `/courses` **không lọc được theo kỳ học** — không có cách nào hỏi "kỳ này mở
>    những khoá nào".
> 2. Trang "Khoá học của tôi" (`/courses/me`) **không cho biết khoá thuộc kỳ nào**, nên cũng không
>    lọc theo kỳ được.
> 3. **Không có đường vào `/courses/me`** từ trong app — phải gõ tay URL.
>
> Change này chạm CẢ HAI repo. Phần BE nằm ở `FTES-AOS-Backend`, change `course-term-filter-public`
> (3 endpoint: `GET /terms` public, `GET /courses?termId=`, `EnrollmentView.termId/termName`). Hợp
> đồng API **đã chốt trước khi code**; FE code độc lập theo đúng hợp đồng, **không tự đổi tên
> field/param**. Nếu thấy hợp đồng lệch code thật → DỪNG và báo lại.
>
> **Góp ý "đăng nhập Google không được" KHÔNG nằm trong change này.** Đó không phải lỗi code: luồng
> Google đã có đủ ở cả hai repo, chỉ thiếu **biến môi trường** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (FE) và
> `GOOGLE_CLIENT_ID` (BE). Việc cấu hình deploy sửa bằng cách điền env, không sửa bằng một OpenSpec
> change; gộp vào đây chỉ làm change to ra mà không sửa được gì.

## Why

**Kỳ học vô hình với người học.** `terms` / `term_courses` / `enrollments.term_id` đã có từ
`V291__course_term_lifecycle`, nhưng FE chưa từng đọc được: catalog không có facet kỳ, và
`/courses/me` chỉ hiển thị `accessUntil` ("mở đến {ngày}") — tức là "hết hạn khi nào", chứ không phải
"thuộc kỳ nào". Người học có 20 khoá qua 4 kỳ không có cách nào xem riêng một kỳ.

**`/courses/me` gần như không tới được.** Rà lại toàn bộ link trong app, chỉ còn:

- `MyCoursesSection` (band "Tiếp tục học" trên home landing) — **code chết**: `HomeLanding` là trang
  chỉ-dành-cho-khách (người đã đăng nhập bị `router.replace("/dashboard")` và component `return null`
  trước khi vẽ), trong khi band đó tự ẩn khi chưa đăng nhập / không có enrollment. Hai điều kiện loại
  trừ nhau ⇒ nó **không bao giờ render**. Nút "Xem tất cả" của nó, tức đường vào `/courses/me`, cũng
  không bao giờ render.
- CTA `LESSON_COMPLETE` của quest board — chỉ hiện khi đang có nhiệm vụ đó.

Hàng "Khóa học của tôi" trong menu tài khoản đã bị gỡ ngày 2026-08-15, với lý do ghi trong docblock
`AccountMenuAuthed`: *"this orphans nothing: `/courses/me` is still linked from the home landing's
'Xem tất cả'"*. **Câu đó sai** — home landing là trang của khách, link ấy chưa từng chạy. Nói cách
khác, quyết định gỡ hàng menu được biện minh bằng một đường vào không tồn tại, và đó chính là góp ý
số 3 của người dùng.

## What Changes

### 1. Lớp API (theo đúng hợp đồng đã chốt)

- `PublicTermView` (`id`/`code`/`name`/`startsAt`/`endsAt`/`status`) + fetcher `listTerms()` →
  `GET /terms`, `authenticated: false` (khách phải lọc được).
- `CourseListParams` thêm `termId?: string | null`; `getCourses` gửi `termId` (đặt sau `q`, trước
  `page` cho khớp thứ tự BE). **`undefined` = không gửi param — KHÔNG gửi chuỗi rỗng.**
- `EnrollmentView` thêm `termId: string | null` + `termName: string | null` ở CUỐI. FE **phải** coi
  cả hai là nullable và render fallback khi null — không mặc định chuỗi rỗng thành tên kỳ.

### 2. Facet "Kỳ học" ở catalog `/courses`

- Lọc **SERVER-side** qua `termId` (giống `categoryId` đang làm), không lọc client — vì BE mới là nơi
  biết khoá nào thuộc kỳ nào; `termId` vào SWR key nên mỗi kỳ cache riêng.
- Danh sách kỳ lấy từ `GET /terms` (trả hết, kể cả `ENDED`). FE tự quyết cách bày; mặc định là
  "Tất cả kỳ".
- Không có kỳ nào (API rỗng / lỗi) → **không render facet**, catalog chạy y như hôm nay. Bộ lọc kỳ là
  thứ thêm vào, không được làm hỏng trang khi vắng dữ liệu.

### 3. Bộ lọc kỳ ở `/courses/me`

- Lọc **client-side** trên chính danh sách enrollment đã tải (endpoint `/courses/me/enrollments`
  không có param lọc, và người học chỉ có vài chục dòng) — thêm một vòng fetch ở đây là vô ích.
- Các kỳ trong bộ lọc dựng từ chính `termId`/`termName` của enrollment, **không gọi `GET /terms`**:
  chỉ hiện kỳ mà người này thật sự có khoá.
- Có nhóm **"Ngoài kỳ học"** cho enrollment `termId = null` (khoá quyền vĩnh viễn) — đây là trạng thái
  phổ biến, không được để nó rơi khỏi mọi bộ lọc rồi biến mất.
- `termId` có giá trị nhưng `termName` null (kỳ đã bị xoá) → vẫn là một nhóm lọc được, nhãn dùng
  fallback, không hiển thị chuỗi rỗng và không văng khỏi danh sách.
- Chỉ có một kỳ (hoặc không có kỳ nào) → **không render bộ lọc** (một lựa chọn duy nhất không phải
  bộ lọc).

### 4. Xoá `MyCoursesSection` — code chết

- Xoá `HomeLanding/sections/MyCoursesSection.tsx` và lời gọi trong `HomeLanding`.
- `HomeMascotGreetingBand` hiện tồn tại chỉ để làm **fallback** cho band đó ("band kia đang chứa lời
  chào rồi → đừng vẽ đôi"). Band kia biến mất ⇒ nhánh `if (hasCourses) return null` là nhánh chết và
  nó còn kéo theo một lượt gọi `useQueryMyCoursesSwr` chẳng để làm gì. Bỏ nhánh đó, giữ đúng một lời
  chào trên landing, và **sửa docblock** đang trỏ tới `MyCoursesSection`.
- Không đụng `MyCourses` (`/courses/me`), `MyCoursesProgress` (dashboard) hay
  `useQueryMyCoursesSwr` — chúng đang sống.

### 5. Đường vào `/courses/me` từ dashboard

- `MyCoursesProgress` (tab Khoá học của dashboard) thêm link "Xem tất cả" → `/courses/me`.
  `LabeledCard` đã có sẵn slot `onSeeMore` + `seeMoreLabel`, không dựng nút mới.
- Chọn dashboard chứ không phải khôi phục hàng menu tài khoản: dashboard là nơi người đã đăng nhập
  thực sự đi qua (`/` redirect thẳng sang đó), và thẻ này vốn đã là danh sách khoá — "xem tất cả" đặt
  cạnh danh sách rút gọn là đúng chỗ, không phải một cửa thứ hai đặt ở nơi khác.

### 6. Sửa docblock sai ở `AccountMenuAuthed`

- Ghi đúng sự thật: `/courses/me` **không** được link từ home landing (trang đó chỉ dành cho khách);
  đường vào của nó bây giờ là dashboard → "Xem tất cả". Docblock này là thứ người sau đọc để quyết
  định có gỡ link tiếp hay không — để nguyên là mời lặp lại đúng lỗi cũ.

## Non-goals

- **Không đổi shape/paging/sort** của `/courses`; không thêm state kỳ vào URL query (deep-link theo
  kỳ là việc khác, chưa ai yêu cầu).
- **Không khôi phục hàng "Khóa học của tôi" trong menu tài khoản** — quyết định gỡ ngày 2026-08-15
  giữ nguyên; change này chỉ sửa cái LÝ DO sai và bù lại một đường vào thật.
- **Không đụng quest board** (CTA `LESSON_COMPLETE` → `/courses/me` vẫn giữ nguyên) và không đụng
  `/saved`.
- **Không đổi `useQueryMyCoursesSwr`** ngoài việc mang thêm `termId`/`termName` — không đổi SWR key,
  không đổi thứ tự sắp xếp (ít hoàn thành nhất lên đầu), không đổi bộ lọc published/active.
- **Không đụng `MyCourses` layout** (2 cột `lg`), không đụng `ContinueCourseCard`.
- **Không làm phần BE** — nằm ở change `course-term-filter-public` của repo `FTES-AOS-Backend`.
- **Không sửa lỗi đăng nhập Google** — thiếu env, không phải lỗi code (xem đầu file).
- Hai file đang dirty sẵn trong working tree (`MascotCoachMark.tsx`, `onboarding.test.tsx`) **không
  liên quan** tới change này: không đụng, không revert, không đưa vào diff review.

## Impact

- Affected specs: `course-catalog-browse` (MODIFIED: facet bar + ADDED: facet kỳ),
  `course-reliability-verify` (REMOVED requirement mô tả sai 3 bề mặt my-courses + ADDED requirement
  mô tả đúng đường vào và bộ lọc kỳ).
- Affected code (API): `src/modules/api/rest/course/{types.ts,course.ts}`.
- Affected code (catalog): `components/features/course/hooks/{useQueryCoursesSwr.ts,useQueryTermsSwr.ts}`,
  `components/features/course/browse/FacetSortBar/index.tsx`,
  `components/features/course/CourseCatalog/index.tsx`.
- Affected code (my courses): `components/features/course/hooks/useQueryMyCoursesSwr.ts`,
  `components/features/course/MyCourses/index.tsx`.
- Affected code (xoá / dọn): `components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx`
  (XOÁ), `HomeLanding/index.tsx`, `HomeLanding/sections/HomeMascotGreeting.tsx`.
- Affected code (đường vào + docblock): `components/features/dashboard/CoursesTab/MyCoursesProgress/index.tsx`,
  `components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx`.
- i18n: thêm khoá vào **CẢ HAI** `src/messages/vi.json` và `src/messages/en.json`
  (`i18n-keys.test.ts` là guard, thiếu một bên là đỏ).

## Tiêu chí "xong" (kiểm chứng được)

1. `npx tsc --noEmit` sạch.
2. `npx vitest run` xanh (đặc biệt `src/messages/i18n-keys.test.ts` và các test đang tham chiếu
   `useQueryMyCoursesSwr`).
3. `grep -rn "MyCoursesSection" src/` không còn kết quả nào ngoài phần openspec/tài liệu.
4. `/courses`: chọn một kỳ → lưới đổi sang đúng tập khoá của kỳ đó; chọn lại "Tất cả kỳ" → về như cũ;
   tài khoản **chưa đăng nhập** vẫn thấy và dùng được facet kỳ.
5. `/courses/me`: bộ lọc kỳ hiện đủ các kỳ người đó có + nhóm "Ngoài kỳ học"; chọn một kỳ chỉ còn khoá
   của kỳ đó.
6. Từ `/dashboard` (tab Khoá học) bấm "Xem tất cả" → sang `/courses/me`.
