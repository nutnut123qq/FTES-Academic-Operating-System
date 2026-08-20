# Tasks — course-term-filter-and-my-courses-entry

Hợp đồng API đã CHỐT (`GET /terms`, `GET /courses?termId=`, `EnrollmentView.termId/termName`).
**Không tự đổi tên field/param.** Thấy hợp đồng lệch code thật → DỪNG, báo lại.

## 1. Lớp API REST (khớp hợp đồng)

- [x] 1.1 `src/modules/api/rest/course/types.ts` — thêm
      `export interface PublicTermView { id: string; code: string; name: string; startsAt: string;
      endsAt: string; status: "SCHEDULED" | "ACTIVE" | "ENDED" }`.
- [x] 1.2 `src/modules/api/rest/course/course.ts` — thêm
      `listTerms(): Promise<Array<PublicTermView>>` →
      `restRequest({ method: "GET", url: "/terms", authenticated: false })`.
      Base URL đã có sẵn `/api/v1` (đúng như `url: "/courses"`). **`authenticated: false`** là bắt
      buộc: facet kỳ phải chạy cho khách.
- [x] 1.3 `types.ts` — `CourseListParams` thêm `termId?: string | null` kèm docblock
      "Filter by term id (`PublicTermView.id`). Omit for no term filter."
- [x] 1.4 `course.ts` — `getCourses` thêm vào `params`: `termId: params?.termId ?? undefined,`
      đặt **sau `q`, trước `page`** (khớp thứ tự BE). `undefined` = không gửi param —
      **KHÔNG gửi chuỗi rỗng.**
- [x] 1.5 `types.ts` — `EnrollmentView` thêm **ở CUỐI** hai field nullable, có docblock tiếng Anh
      khớp mật độ comment xung quanh:
      `termId: string | null` và `termName: string | null`.

## 2. Facet "Kỳ học" ở catalog `/courses` (lọc SERVER-side)

- [x] 2.1 `src/components/features/course/hooks/useQueryTermsSwr.ts` (MỚI) — SWR wrapper cho
      `listTerms()`, khuôn theo `useQueryCourseCategoriesSwr`. Key cố định (dữ liệu public, không
      viewer-scoped). Trả `{ terms }`, mặc định `[]`. (Kế hoạch ghi `{ terms, isLoading, error }`;
      bỏ hai field kia sau review vì thiết kế "lỗi/rỗng → không facet" không có nhánh render nào
      đọc tới chúng.) Lỗi/rỗng KHÔNG được làm vỡ trang — caller chỉ ẩn facet.
- [x] 2.2 `useQueryCoursesSwr.ts` — `UseQueryCoursesParams` thêm `termId?: string`; đưa `termId` vào
      **SWR key** (`["rest-courses", categoryId ?? null, termId ?? null]`) và truyền xuống
      `getCourses({ size: 100, categoryId, termId })`. Cập nhật docblock của hook (hiện ghi
      "currently `categoryId`").
- [x] 2.3 `browse/FacetSortBar/index.tsx` — thêm cặp prop **optional** `terms` + `termId` +
      `onTermChange`, đúng luật đang có của file: control chỉ render khi cả giá trị lẫn handler đều
      được truyền (giống `level` / `minRating`). Không đổi hành vi của các trang đang dùng bar này mà
      không truyền prop mới.
- [x] 2.4 `FacetSortBar` — render lựa chọn kỳ. Số kỳ có thể lên vài chục nên **KHÔNG** dùng
      `SegmentedControl` như level/rating (nó dành cho "1 trong vài"); dùng primitive select/dropdown
      sẵn có của repo, có `aria-label`. **Không hand-roll `<select>`/`<div border>`** — tra
      `.claude/rules` + tìm block canonical trong repo trước khi viết.
- [x] 2.5 `FacetSortBar` — lựa chọn mặc định "Tất cả kỳ" (giá trị `undefined`, không phải chuỗi rỗng);
      sort giữ nguyên vị trí pinned cuối hàng.
- [x] 2.6 `CourseCatalog/index.tsx` — `const [termId, setTermId] = useState<string | undefined>()`,
      đọc `useQueryTermsSwr`, truyền xuống `useQueryCoursesSwr({ categoryId: activeCategoryId, termId })`
      và xuống `FacetSortBar`.
- [x] 2.7 **không có kỳ nào** (list rỗng hoặc lỗi) ⇒ facet không render, catalog chạy y như trước.
      Guard nằm ở ĐÚNG MỘT chỗ — `FacetSortBar` tự tính `showTerm`. (Bản đầu guard hai lần: call site
      cũng `terms.length > 0 ? … : undefined`; nhánh ba ngôi đó không đổi được hành vi nào nên đã bỏ.)
- [x] 2.8 Kiểm nhánh khách: `/courses` khi CHƯA đăng nhập vẫn tải được danh sách kỳ và lọc được
      (đây là lý do endpoint là public).

## 3. Bộ lọc kỳ ở `/courses/me` (lọc CLIENT-side)

- [x] 3.1 `course/hooks/useQueryMyCoursesSwr.ts` — `MyCourse` thêm `termId: string | null` +
      `termName: string | null` (docblock nêu rõ null = khoá ngoài kỳ, hoặc kỳ đã bị xoá).
- [x] 3.2 `useQueryMyCoursesSwr` — map thêm `termId: enrollment.termId ?? null` và
      `termName: enrollment.termName ?? null`. **Không đổi** SWR key, bộ lọc published/active, hay
      thứ tự sắp xếp (ít hoàn thành nhất lên đầu).
- [x] 3.3 `course/MyCourses/index.tsx` — state kỳ đang chọn; dựng danh sách kỳ **từ chính `courses`**
      (distinct theo `termId`, giữ thứ tự xuất hiện hoặc sắp theo tên), **KHÔNG gọi `listTerms()`**:
      chỉ hiện kỳ mà người này thật sự có khoá.
- [x] 3.4 `MyCourses` — có nhóm **"Ngoài kỳ học"** cho `termId === null`; enrollment nhóm này không
      được rơi khỏi mọi lựa chọn.
- [x] 3.5 `MyCourses` — `termId` có giá trị nhưng `termName === null` (kỳ đã bị xoá) → vẫn là một
      nhóm chọn được, nhãn dùng fallback (không render chuỗi rỗng, không văng khỏi danh sách).
- [x] 3.6 `MyCourses` — chỉ có **≤ 1** nhóm kỳ → **không render** bộ lọc (một lựa chọn duy nhất không
      phải bộ lọc).
- [x] 3.7 `MyCourses` — lọc chỉ ảnh hưởng lưới thẻ; các nhánh loading / error / empty của
      `AsyncContent` giữ nguyên ngữ nghĩa hiện tại. Lọc ra 0 khoá → empty state nói rõ là do bộ lọc,
      không dùng lại copy "chưa đăng ký khoá nào" (sai thông tin).
- [x] 3.8 Không đụng layout 2 cột `lg:grid-cols-2` và không đụng `ContinueCourseCard`.

## 4. Xoá `MyCoursesSection` (code chết)

- [x] 4.1 Xác nhận lại trước khi xoá: `HomeLanding` redirect `/dashboard` + `return null` khi
      `signedIn`, còn `MyCoursesSection` `return null` khi `isLoading || !hasCourses` ⇒ hai điều kiện
      loại trừ nhau, component không bao giờ render.
- [x] 4.2 XOÁ file `src/components/features/home-landing/HomeLanding/sections/MyCoursesSection.tsx`.
- [x] 4.3 `HomeLanding/index.tsx` — bỏ import + lời gọi `<MyCoursesSection />` và comment đi kèm.
      Cập nhật docblock của `HomeLanding` nếu nó còn nhắc band "Tiếp tục học".
- [x] 4.4 `HomeLanding/sections/HomeMascotGreeting.tsx` — `HomeMascotGreetingBand` bỏ nhánh
      `if (hasCourses) return null` và bỏ lượt gọi `useQueryMyCoursesSwr` (không còn band nào tranh
      chỗ lời chào). Vẫn đúng luật "một mascot mỗi trang".
- [x] 4.5 `HomeMascotGreeting.tsx` — **sửa docblock** của `HomeMascotGreetingBand`: bỏ đoạn nói nó là
      fallback của `MyCoursesSection` và đoạn "reads the SAME `useQueryMyCoursesSwr`".
- [x] 4.6 KHÔNG đụng `MyCourses` (`/courses/me`), `MyCoursesProgress` (dashboard),
      `useQueryMyCoursesSwr`, `ContinueCourseCard` — đang sống.
- [x] 4.7 `grep -rn "MyCoursesSection" src/` phải sạch (chỉ còn openspec/tài liệu).

## 5. Đường vào `/courses/me` từ dashboard

- [x] 5.1 `dashboard/CoursesTab/MyCoursesProgress/index.tsx` — truyền `onSeeMore` +
      `seeMoreLabel` cho `LabeledCard` (slot có sẵn, **không dựng nút mới**), điều hướng
      `/courses/me` qua `useRouter` của `@/i18n/navigation` (giữ locale prefix).
- [x] 5.2 Link chỉ hiện khi thật sự có khoá — trạng thái empty/error đang dùng khung của
      `LabeledCard`, gắn "Xem tất cả" vào một danh sách rỗng là dẫn người dùng tới một trang rỗng nữa.
- [x] 5.3 Cập nhật docblock `MyCoursesProgress` cho khớp (thẻ này giờ là đường vào `/courses/me`).
- [x] 5.4 KHÔNG khôi phục hàng "Khóa học của tôi" trong menu tài khoản; KHÔNG đụng CTA
      `LESSON_COMPLETE` của quest board.

## 6. Sửa docblock SAI ở `AccountMenuAuthed`

- [x] 6.1 `navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` — câu
      *"this orphans nothing: `/courses/me` is still linked from the home landing's 'Xem tất cả'"*
      là SAI (home landing chỉ dành cho khách, band đó chưa từng render). Viết lại đúng: đường vào
      `/courses/me` là dashboard → tab Khoá học → "Xem tất cả" (và CTA `LESSON_COMPLETE` của quest
      board khi có nhiệm vụ).
- [x] 6.2 Chỉ sửa docblock — **không** thay đổi hành vi menu, không thêm lại hàng nào.

## 7. i18n (guard `i18n-keys.test.ts` bắt thiếu khoá)

- [x] 7.1 Thêm khoá cho facet kỳ ở catalog (nhãn bộ lọc + lựa chọn "Tất cả kỳ") vào **CẢ HAI**
      `src/messages/vi.json` và `src/messages/en.json`, đặt cạnh
      `courseSystem.browse.filters.*` đang có.
- [x] 7.2 Thêm khoá cho bộ lọc kỳ ở `/courses/me` (nhãn bộ lọc, "Tất cả kỳ", "Ngoài kỳ học", nhãn
      fallback cho kỳ đã bị xoá, empty-state khi lọc ra 0 khoá) vào cả hai catalog, đặt cạnh
      `courses.mine.*`.
- [x] 7.3 "Xem tất cả" cho dashboard: **tái dùng** `dashboard.explore.viewAll` (đúng slot
      `seeMoreLabel` của `LabeledCard`, y như 3 thẻ anh em cùng dashboard). Khoá mới
      `dashboard.enrolledCoursesSeeAll` thêm ở bản đầu đã bị XOÁ khỏi cả vi.json lẫn en.json —
      hai khoá cho cùng một chuỗi.
- [x] 7.4 Xoá khoá đã thành mồ côi sau khi bỏ `MyCoursesSection` (nếu có khoá chỉ nó dùng) khỏi cả
      hai catalog. Khoá còn dùng ở `MyCourses`/`CourseRow` (`courses.termUntil`,
      `courses.termExpired`) **giữ nguyên**.

## 8. Verify (chạy thật, báo output — không báo xanh khi chưa chạy)

- [x] 8.1 `npx tsc --noEmit` sạch.
- [x] 8.2 `npx vitest run` xanh — chú ý `src/messages/i18n-keys.test.ts`,
      `course/hooks/viewer-scoped-swr-key.test.tsx`, `course/hooks/signed-in-without-reload.test.tsx`,
      `ai-platform/AiHub/index.test.tsx` (đều chạm `useQueryMyCoursesSwr`).
- [x] 8.3 `npx eslint` sạch trên các file đã đụng.
- [ ] 8.4 `/courses` (kể cả khi CHƯA đăng nhập): chọn kỳ → lưới đổi đúng tập khoá; về "Tất cả kỳ" →
      như cũ; đổi kỳ liên tiếp trong <60s vẫn ra kết quả khác nhau (chứng minh cache BE đã tính
      `termId`).
- [ ] 8.5 `/courses/me`: bộ lọc hiện đủ kỳ + "Ngoài kỳ học"; chọn một kỳ chỉ còn khoá của kỳ đó.
- [ ] 8.6 `/dashboard` tab Khoá học → "Xem tất cả" → `/courses/me` (đúng locale prefix).
- [x] 8.7 Diff review: **không** đụng `MascotCoachMark.tsx` và `onboarding.test.tsx` (dirty sẵn,
      không liên quan).

> **8.4–8.6 CHƯA chạy** — ba mục này cần BE + FE chạy thật trên trình duyệt; phiên sửa này chỉ chạy
> được gate tĩnh (`tsc`, `vitest`, `eslint`, `next build`). Đừng đánh dấu xong khi chưa mở trang.

## 9. Sửa sau review (2026-08-20)

- [x] 9.1 **CHẶN SHIP** — `CourseCatalog`: nhánh empty trước đây gác theo ô tìm kiếm
      (`isEmpty={isFiltering && …}`), nên chọn một kỳ CHƯA gán khoá nào thì trang render ra một
      `<div>` rỗng: không copy, không nút gỡ lọc, nhìn y hệt trang lỗi. Sửa thành
      `isEmpty={filtered.length === 0}`; đang chọn kỳ thì title dùng khoá mới
      `courseSystem.browse.termEmpty` + nút "Tất cả kỳ" gọi `setTermId(undefined)` — đúng khuôn
      `/courses/me` đã làm (`MyCourses/index.tsx`).
- [x] 9.2 `CourseCatalog`: `termId` không còn lọt vào SWR key khi kỳ đó biến khỏi `GET /terms`
      (admin xoá kỳ) — thêm `activeTermId` dẫn xuất (`terms.some(...) ? termId : undefined`) dùng cho
      cả fetch lẫn `FacetSortBar`. Trước đó facet unmount theo danh sách kỳ rỗng còn state thì ở lại
      ⇒ catalog bị lọc rỗng vĩnh viễn, chỉ F5 mới thoát.
- [x] 9.3 Test mới `CourseCatalog/term-empty.test.tsx` (4 case) chốt 9.1 + 9.2.
- [x] 9.4 `TermFilterDropdown.onSelectionChange`: bỏ hai nhánh không bao giờ chạy
      (`keys === "all"` — menu là `selectionMode="single"`; `next === undefined` — đã có
      `disallowEmptySelection`).
- [x] 9.5 `FacetSortBar`: `(terms ?? []).map` → `terms.map` và `onChange={(next) => onTermChange?.(next)}`
      → `onChange={onTermChange}` (trong nhánh `showTerm` cả hai đã chắc chắn khác `undefined`).

## 10. Nợ kỹ thuật — GHI LẠI, KHÔNG làm trong change này

- [ ] 10.1 `TermFilterDropdown` gần như là bản sao của
      `gamification/SeasonBoards/SeasonPicker.tsx` (trùng import, trùng chuỗi class của Trigger,
      trùng `Dropdown.Popover className="min-w-60"`). Repo giờ có BA bản pill-dropdown chọn-một
      (`LanguageDropdown` / `SeasonPicker` / `TermFilterDropdown`). Lần dọn sau: đưa
      `TermFilterDropdown` về `components/blocks` và cho `SeasonPicker` gọi lại (~60 dòng trùng).
      Không gộp trong change này vì `SeasonPicker` nằm ngoài phạm vi.
- [ ] 10.2 `courses.mine.termLabel`/`termAll` trùng nguyên văn với
      `courseSystem.browse.filters.termLabel`/`allTerms` — 4 khoá cho 2 chuỗi. Hợp nhất bây giờ sẽ
      đụng 2 file component ở hai bề mặt khác nhau; ghi lại là đủ.
