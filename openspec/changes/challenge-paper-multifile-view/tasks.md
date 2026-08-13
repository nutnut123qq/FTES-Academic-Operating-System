# Tasks — challenge-paper-multifile-view

## 1. Contract
- [ ] 1.1 `types.ts`: `ChallengePaperFileView {id,url,mime,filename,sizeBytes,role,sortOrder}` +
      `paperFiles?: Array<...> | null` trên `ChallengeView` (khớp BE `challenge-paper-multifile`)

## 2. Hiển thị
- [ ] 2.1 `ChallengePaper`: có `paperFiles` không rỗng → render theo `sortOrder`; file role xem-được
      hiện inline (dùng `paperKind` cho ảnh vs PDF), file role tải-về gom vào khu "Tệp đính kèm"
      (tên + dung lượng + nút tải)
- [ ] 2.2 Vai trò LẤY TỪ BE (`role`), KHÔNG suy lại từ tên file; chỉ dùng `paperKind` để chọn CÁCH
      render một file đã được BE cho phép xem
- [ ] 2.3 `paperFiles` rỗng/absent → giữ NGUYÊN nhánh một-file hiện tại (không đổi hành vi)

## 3. i18n
- [ ] 3.1 Nhãn khu "Tệp đính kèm" + nút tải, vi (canonical) + en (parity)

## 4. Verify
- [ ] 4.1 Unit cho hàm thuần tách nhóm xem-được / tải-về theo `role` + thứ tự
- [ ] 4.2 `npx tsc --noEmit` + `npm run build` (turbopack) xanh
