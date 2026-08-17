## Why

Thanh lọc catalog môn (`/subjects`) đang là HAI hàng nút cuộn ngang (Ngành + Kỳ) — rối. Anh muốn
gọn lại còn **2 dropdown** (Ngành, Kỳ), và Kỳ liệt kê đủ **1..9** (không chỉ kỳ có môn).

## What Changes

- `SubjectCatalog`: đổi 2 hàng Button → **2 dropdown** (pattern nhà HeroUI Dropdown, mirror CampusPicker):
  - Ngành: "Tất cả ngành" + từng ngành.
  - Kỳ: "Tất cả" + **Kì 1..9** (SUBJECT_SEMESTERS, luôn đủ 9) — chọn kỳ chưa có môn → lưới trống
    (đúng "kỳ này chưa có môn"), bỏ logic tự-huỷ-lọc của bản nút.
- Bỏ import Button (không còn dùng).

## Capabilities

### Modified Capabilities

- `subject-catalog`: bộ lọc gọn = 2 dropdown; Kỳ chọn được đủ 1..9.
