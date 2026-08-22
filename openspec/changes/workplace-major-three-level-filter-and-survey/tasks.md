# Tasks

## 1. Khảo sát hiện trạng (trước khi sửa)

- [x] 1.1 Đọc `useQueryMajorsSwr`: mỗi major có `parentCode`; `null` = KHỐI cấp 1; danh sách BE trả
      đã sắp khối → con; danh sách RỖNG là trạng thái HỢP LỆ.
- [x] 1.2 Đọc `useQuerySubjectsSwr`: xác minh `?major=` nhận ĐÚNG MỘT mã, `null` không được gửi, và
      cả ba bộ lọc nằm trong SWR key (server-side) — giữ nguyên tính chất này.
- [x] 1.3 Đọc `useMyMajor`: `needsMajor` = đã đăng nhập + đã biết chắc + chưa có `majorCode`;
      `setMajor` ném lỗi lên caller khi BE từ chối.
- [x] 1.4 Đọc `MascotMajorPicker`: bốn điều kiện ẩn + localStorage `pickMajor` + xử lý lỗi đã có sẵn
      ⇒ nâng cấp tại chỗ rẻ hơn dựng component mới.

## 2. Bộ lọc 3 cấp trong `SubjectCatalog`

- [x] 2.1 Suy ra cặp (khối, chuyên ngành) từ `activeMajor` bằng `parentCode`, thay cho một danh
      sách phẳng thụt lề.
- [x] 2.2 Cấp 1 = `parentCode === null` + mục "Tất cả ngành"; ẩn cả dropdown khi không có khối nào.
- [x] 2.3 Cấp 2 = con của khối đang chọn + mục "Tất cả \<khối\>" (mục này mang chính mã KHỐI, vì bỏ
      chọn con nghĩa là quay về mã cha). Ẩn hẳn khi chưa chọn khối hoặc khối không có con.
- [x] 2.4 Cấp 3 (Kỳ) giữ nguyên.
- [x] 2.5 Đổi khối ⇒ chuyên ngành tự reset (hệ quả của việc chỉ giữ MỘT state, không phải một nhánh
      reset viết tay).
- [x] 2.6 Giữ phân biệt `majorFilter === undefined` (chưa tự chọn ⇒ lấy `myMajor`) với `"all"`
      (đã bấm Tất cả).
- [x] 2.7 Mã không tra được trong danh mục ⇒ hai ô về "Tất cả" nhưng vẫn gửi nguyên mã xuống BE.

## 3. Khảo sát lần đầu — `MascotMajorPicker` thành modal 2 bước

- [x] 3.1 Đổi dải nút inline thành `Modal` (HeroUI): bước 1 chọn khối, bước 2 chọn chuyên ngành,
      nút Lưu chỉ có ở bước 2.
- [x] 3.2 Bước 2 là chọn-rồi-Lưu ⇒ nút chuyên ngành phải cho thấy cái nào đang chọn
      (`primary` vs `secondary`); có nút Quay lại (`common.back`).
- [x] 3.3 Khối không có chuyên ngành con ⇒ Lưu ghi mã khối (không để ngõ cụt).
- [x] 3.4 Giữ "Để sau" + localStorage; Esc / bấm ra nền cũng tính là "Để sau". Ghi lại LÝ DO vào
      doc-comment (mời chứ không chặn).
- [x] 3.5 Giữ đủ bốn điều kiện ẩn (chưa đăng nhập · đã chọn ngành · đã bỏ qua · guided tour) +
      danh mục rỗng.
- [x] 3.6 BE từ chối ⇒ giữ modal + hiện `error`, không đóng.
- [x] 3.7 `Modal.Dialog` mang `aria-label` (tiêu đề nằm trong bong bóng linh vật, không ở
      `Modal.Header`).

## 4. i18n (vi + en, cùng số key)

- [x] 4.1 `subjects.catalog.allInMajor` — nhãn "Tất cả \<khối\>" của dropdown cấp 2.
- [x] 4.2 `mascot.nudge.pickMajor.{specializationTitle,specializationBody,noSpecialization}`.
- [x] 4.3 Tái dùng `common.back` / `common.save` thay vì thêm key mới.
- [x] 4.4 Kiểm parity: 6662 key mỗi bên, không lệch chiều nào.

## 5. Verify

- [x] 5.1 `npx vitest run src/components/features/subject/SubjectCatalog/index.test.tsx` — 4/4 xanh:
      hồ sơ lưu mã CON hiện đúng cặp hai ô · cấp 2 chỉ liệt kê con của khối · đổi khối thì reset ·
      hồ sơ lưu mã KHỐI thì cấp 2 đứng ở "Tất cả \<khối\>".
- [x] 5.2 `npx eslint` trên 3 file đã đổi — sạch.
- [ ] 5.3 `npx tsc --noEmit` / `npm run build` — **KHÔNG chạy trong lane này** (nhiều agent dùng
      chung thư mục, tsc incremental đá nhau); phase VERIFY riêng chạy sau.
- [ ] 5.4 Xem thật trên trình duyệt — chưa làm (phiên này không dựng dev server).

## 6. HARDEN (2026-08-22) — vá nợ sau vòng review đối kháng

- [x] 6.1 Bước 2: thêm nút "Tất cả {khối}" (dùng lại key `subjects.catalog.allInMajor`) và khoá
      nút Lưu khi `children.length > 0 && child === null`. Trước đó Lưu vẫn bấm được ở trạng thái
      "chưa chọn gì" và `child ?? category` âm thầm ghi mã KHỐI vào hồ sơ — người dùng bấm
      "Information Technology" ở bước 1 rồi bấm Lưu ngay sẽ lưu `IT` chứ không phải `SE`, không
      một dấu hiệu nào trên màn nói họ chưa chọn. Nhánh `category` giờ chỉ còn phục vụ ca ngõ cụt
      (khối không có con), đúng ý định ban đầu của nó. Đính chính 3.3.
- [x] 6.2 Chặn đóng modal trong lúc PATCH đang bay ở CẢ ba cửa:
      `Modal.Backdrop isDismissable={!saving}`, `isKeyboardDismissDisabled={saving}`, và chốt cuối
      `if (!open) { if (saving) return; onDismiss() }`. Trước đó đóng giữa chừng vừa đánh dấu
      "Để sau" VĨNH VIỄN trên thiết bị, vừa unmount cây trước khi `setMajor` settle ⇒ lỗi BE không
      hiện ở đâu và khảo sát không bao giờ quay lại. Đây là điều kiện để 3.6 đúng ở mọi nhánh.
- [x] 6.3 Hàng nút ngành chuyển từ `children` sang prop `actions` của `MascotBubble` — `children`
      nằm TRONG `aria-live="polite"`, nên mỗi lần đổi bước trình đọc màn hình đọc lại tiêu đề +
      body + tên MỌI ngành con. `actions` render ở div anh em ngoài vùng live và đã có sẵn
      `mt-4 flex flex-wrap gap-2` nên bỏ luôn `pt-3` tự chế.
- [x] 6.4 Thêm `src/components/features/mascot-moments/MascotMajorPicker.test.tsx` (chưa từng có
      test cạnh component này): 6 case — Lưu khoá khi chưa chọn · "Tất cả {khối}" ghi mã khối ·
      bấm con ghi mã con · khối ngõ cụt vẫn ghi mã khối · đang ghi thì hai cửa đóng đều khoá và
      `markNudgeDismissed` không chạy · mọi nút ngành nằm ngoài vùng `aria-live`. 6/6 xanh.
