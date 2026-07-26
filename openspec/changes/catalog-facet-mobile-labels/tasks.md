# Tasks — catalog-facet-mobile-labels

## 1. Block: giữ tên cho screen-reader khi nhãn bị rút
- [x] 1.1 `SegmentedControl`: thêm `ariaLabel?: string` vào `SegmentedControlItem`
      (JSDoc: dùng khi nhãn hiển thị bị rút gọn theo breakpoint) + set
      `aria-label={item.ariaLabel}` trên `<button>`.

## 2. Facet bar responsive
- [x] 2.1 `FacetSortBar` — segment sao: `4.5+` dưới `sm` (`sm:hidden`), nhãn đầy đủ
      từ `sm:` (`hidden sm:inline`), icon ★ luôn hiện, `ariaLabel` = nhãn đầy đủ.
- [x] 2.2 `FacetSortBar` — segment cấp độ: nhãn bọc `whitespace-nowrap`.
- [x] 2.3 `FacetSortBar` — segment **sắp xếp**: nhãn bọc `whitespace-nowrap` (thầy chốt
      gộp vào change này sau khi 2 hàng facet đã gọn thì sort thành control duy nhất
      còn wrap). Sửa ở feature, KHÔNG ở block, nên `SegmentedControl` dùng nơi khác
      không đổi hành vi.

## 3. Verify bằng UI THẬT (không chỉ đọc code)
- [x] 3.1 375×812 `/vi/courses/category/software-engineering` — đo lại:
      pill sao **76px → 39px**, pill cấp độ **56px → 36px**, nhãn 1 dòng hết wrap;
      `document.scrollWidth == clientWidth == 375` (không tràn ngang); 2 group không
      bị clip. Khối facet còn **179px**, thẻ đầu tiên lên y=489 (trước y≈534).
- [x] 3.2 Desktop 1280 — nhãn sao vẫn đầy đủ `4.5 trở lên`, 3 group vẫn nằm 1 hàng,
      chiều cao pill không đổi (sao 39px / cấp độ 36px). Bố cục cũ giữ nguyên.
- [x] 3.3 Facet vẫn lọc đúng sau khi đổi nhãn: mobile bấm `4.5+` → còn **9** khoá,
      `csd201-ctdl-va-giai-thuat` (avgStar=0) rụng; a11y tree đọc nút là
      "4.5 trở lên" dù chữ hiển thị là "4.5+".

## 4. Gate
- [x] 4.1 `npx playwright test e2e/browse-category-facets.spec.ts --project=desktop --project=mobile`
      → **14/14**, chạy lại 2 lượt (workers=2 và workers=4) đều xanh.
      Spec chạy được ở mobile là nhờ `ariaLabel` (accessible name giữ nguyên).
- [x] 4.2 `npx tsc --noEmit` exit 0 + eslint 3 file đã sửa sạch.
- [x] 4.3 `npm run build` xanh ở local Windows (webpack).

## 5. Vòng 2 — hàng sắp xếp (thầy duyệt gộp vào đây)
- [x] 5.1 Nhóm **Sắp xếp** hết wrap: pill `56px → 36px`, group `64px → 44px`, không
      clip, không tràn ngang; đo trên cả `/vi/courses/category/software-engineering`
      và `/vi/courses` ở 375px. Desktop 1280 không đổi (pill vẫn 36px).
- [x] 5.2 Tổng khối chrome mobile: thẻ khoá đầu tiên từ y≈534 (trước) → y=469.
- [x] 5.3 Chạy lại gate sau vòng 2: spec **14/14** hai project, `tsc --noEmit` exit 0,
      eslint sạch, `npm run build` xanh.
