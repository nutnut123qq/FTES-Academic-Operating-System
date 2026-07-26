# Facet catalog trên mobile: nhãn sao viết gọn, nhãn cấp độ không wrap 2 dòng

## Why

Nghiệm thu UI thật (2026-07-26) trên `/vi/courses/category/software-engineering`
ở 375×812 cho thấy 2 hàng facet vừa mới thêm **không vỡ, không tràn ngang**, nhưng
nhãn bị wrap 2 dòng nên pill cao bất thường:

- segment sao (`4.5 trở lên`, `4 trở lên`, `3.5 trở lên`) → cao **76px**;
- segment cấp độ (`Trung cấp`, `Nâng cao`) → cao **56px**;
- cả hàng facet chiếm 3 dòng (cấp độ / sao / sắp xếp) ăn gần hết màn hình đầu.

Đây là đúng họ vấn đề mà repo đã có luật cho tab:
`.claude/rules/drafts/tabs-icon-label-hide-label-on-mobile.md` — *màn hẹp thì rút
nhãn, giữ nhận diện bằng icon, và **a11y bắt buộc** phải giữ tên đầy đủ cho
screen-reader*. Facet sao đã có icon ★ nên rút phần chữ là an toàn về nhận diện.

## What Changes

- **`SegmentedControl` (block)**: thêm prop **tuỳ chọn** `ariaLabel` cho từng item
  → set lên `<button aria-label>`. Đây là chỗ duy nhất cần sửa ở block, để mọi
  caller rút gọn nhãn hiển thị mà **không mất tên cho screen-reader** (đúng luật
  tab: ẩn/rút nhãn thì phải bù `aria-label`). Không đổi hành vi caller cũ
  (không truyền `ariaLabel` → y như trước).
- **`FacetSortBar`**:
  - segment sao: hiện `4.5+` / `4+` / `3.5+` dưới `sm`, `4.5 trở lên` từ `sm:` lên
    (2 span `sm:hidden` / `hidden sm:inline`), icon ★ giữ ở mọi breakpoint;
    `ariaLabel` = nhãn đầy đủ nên SR luôn đọc "4.5 trở lên" bất kể breakpoint.
  - segment cấp độ: nhãn bọc `whitespace-nowrap` để hết wrap 2 dòng (nhãn vốn đã
    ngắn); `ariaLabel` không cần vì chữ hiển thị không đổi.
- **Không thêm key i18n**: `ratingAtLeast` giữ nguyên; nhãn ngắn dựng từ chính
  `option` (`"4.5"` → `4.5+`) nên không phát sinh chuỗi dịch mới.

## Impact

- Affected specs: course browse (facet bar responsive + a11y).
- Affected code: `src/components/blocks/navigation/SegmentedControl/index.tsx`,
  `src/components/features/course/browse/FacetSortBar/index.tsx`.
- Không đụng backend, không đổi logic lọc → `filterCoursesByFacets` và
  `e2e/browse-category-facets.spec.ts` giữ nguyên: spec tìm segment sao bằng
  `getByRole("button", { name: /^4\.5 trở lên$/ })`, mà `aria-label` đầy đủ chính
  là accessible name, nên spec chạy được ở **cả desktop lẫn mobile** sau thay đổi
  (trước đây nó dựa vào text hiển thị — sau khi rút nhãn thì `aria-label` mới là
  thứ giữ cho spec mobile không vỡ).
- Rủi ro cần đo bằng UI thật: `whitespace-nowrap` có thể làm hàng cấp độ rộng hơn
  375px. Task 3.1 đo `document.scrollWidth` để chốt không tràn ngang.
