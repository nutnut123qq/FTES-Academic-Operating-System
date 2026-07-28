# Tasks

- [x] 1. `tierLabels.ts`: `TIER_CHIP_COLOR` + `resolveTierColor(slug)`.
- [x] 2. `CourseDetail` syllabus chip dùng `resolveTierColor(slug)` thay `color="accent"`.
- [x] 3. `ChallengeSubmission` CTA nâng cấp dùng cùng helper.
- [x] 4. Unit test `tierLabels.test.ts`: 3 bậc chuẩn ra 3 màu khác nhau · cùng gói luôn cùng
      màu · gói lạ rơi về `default` (không undefined). 3/3 xanh.
- [x] 5. Nghiệm thu DOM trên dev server: chip gói "Trọn khoá" (slug `full`) đổi từ hồng accent
      sang xám `default` — chứng minh màu đi ra từ bảng slug chứ không còn hardcode.
- [ ] 6. **Chưa nghiệm thu được hàng 3-4 màu cạnh nhau**: rà cả 25 khoá trên apitest, KHÔNG
      khoá nào có quá 1 gói. Ảnh góp ý (BASIC/PREMIUM/MASTER) là dữ liệu prod. Cần xem trên
      prod hoặc seed thêm gói ở apitest mới thấy đủ thang màu.
