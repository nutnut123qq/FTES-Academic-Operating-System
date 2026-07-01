# Draft — Tab có CẢ icon + label → MOBILE ẩn label, chỉ giữ icon (2026-06-18)

- File/§ đích khi `/merge`: `starci-navigation.md` (tabs) hoặc element tabs + liên quan TabsCard/ExtendedTabs.
- Bối cảnh: thầy chốt khi soi mobile lệch — *"với tabs có cả icon + label thì qua mobile hide label đi"*.

## Luật (STRICT)
- **Tab item có CẢ `icon` LẪN `label` → trên mobile (`<sm`) ẨN label, chỉ hiện icon; từ `sm:` lên hiện lại label.** Lý do: hàng tab nhiều item (vd 2 nhóm leftTabs+rightTabs, hoặc filter feed) trên màn hẹp dễ tràn/wrap xấu → icon-only gọn, không tràn.
- **Cài ở BLOCK render tab (ExtendedTabs/TabsCard), KHÔNG ở feature** — sửa 1 chỗ, áp mọi nơi. Label bọc `<span className="hidden sm:inline">{label}</span>`; icon luôn render.
- **A11y BẮT BUỘC:** khi label bị ẩn, tab vẫn phải có tên cho screen-reader → set `aria-label`/`textValue` = label gốc trên tab (icon-only không được mất nhãn). Tab CHỈ-có-label (không icon) → giữ label luôn (không ẩn, vì ẩn là mất sạch).
- **Chỉ áp cho tab có icon** (icon thay được label về mặt nhận diện). Tab không icon → luôn hiện label.

## Áp đầu (2026-06-18)
- Block tab (ExtendedTabs/TabsCard): label `hidden sm:inline` khi item có icon + `aria-label`/`textValue`=label. Khắc phục luôn rủi ro tràn TabsCard 2-nhóm trên mobile.
