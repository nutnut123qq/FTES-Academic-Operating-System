# workplace-major-three-level-filter-and-survey — lọc ngành 3 cấp ở workplace + khảo sát chọn ngành lần đầu

## Why

Chủ dự án chốt: *"ở workplace làm thêm 1 phần pick Category → Ngành con → Kì. Ví dụ Information
Technology → Software Engineering → Semester 1. Ai đăng ký lần đầu, khi vô trang workplace thì hiện
ra 1 cái khảo sát chọn ngành trước, sau đó lưu vào profile. Sau này mỗi lần vào workplace tự nhảy
vào ngành đó."*

Hai chỗ đang lệch với ý đó:

1. **Bộ lọc ngành là MỘT dropdown phẳng.** Nó liệt kê cả khối lẫn chuyên ngành trong cùng một danh
   sách, phân cấp chỉ được gợi ý bằng `pl-6`. Với vài ngành thì đọc được; với syllabus FPT (nhiều
   khối, mỗi khối nhiều chuyên ngành) thì cuộn một danh sách trộn hai cấp không cho biết mình đang
   đứng ở khối nào — mà chính "đang ở khối nào" là câu hỏi cấp 1.
2. **Lời mời chọn ngành là một dải nút inline.** `MascotMajorPicker` liệt kê PHẲNG mọi major thành
   một hàng nút đặt ở đầu trang. Nó chìm vào trang (dễ lướt qua) và cũng mang đúng vấn đề trộn hai
   cấp như trên. Chủ dự án muốn "hiện ra một cái khảo sát", tức một bề mặt hỏi đúng một việc.

## What Changes

### 1. `SubjectCatalog` — chuỗi 3 dropdown: Khối ngành → Chuyên ngành → Kỳ

- Cấp 1 chỉ liệt kê `parentCode === null` + mục "Tất cả ngành".
- Cấp 2 chỉ liệt kê con của khối đang chọn + mục "Tất cả \<khối\>". **Ẩn hẳn** khi chưa chọn khối
  hoặc khối không có con — một ô bấm được nhưng rỗng đọc như đang hỏng.
- Cấp 3 (Kỳ) giữ nguyên `SUBJECT_SEMESTERS` 1..9.
- Cả ba bộ lọc vẫn chạy **SERVER-SIDE** qua `useQuerySubjectsSwr` (không đụng tới quyết định cũ:
  catalog ~400 môn, lọc lại ở client sẽ cắt cụt im lặng).

**Quyết định lõi — MỘT state cho cả hai dropdown ngành.** Giữ nguyên `majorFilter: string |
undefined` (`undefined` = chưa tự chọn ⇒ lấy `myMajor`; `"all"` = đã bấm "Tất cả"), rồi SUY RA cặp
(khối, chuyên ngành) từ `parentCode`. Chọn khối = ghi mã khối vào cùng ô nhớ ⇒ chuyên ngành **tự
reset**, không có đường nào lọt trạng thái "Information Technology + Digital Marketing". Hai state
rời thì phải nhớ reset bằng tay ở mọi nhánh — sót một nhánh là ra cặp lệch, và không có gì báo đỏ.

**Chỗ dễ sai nhất — hồ sơ lưu MỘT mã và mã đó thường là mã CON.** `majorCode = "SE"` phải làm ô cấp
1 hiện "Information Technology" và ô cấp 2 hiện "Software Engineering". Suy ngược qua `parentCode`;
mã tra không ra trong danh mục (danh mục chưa tải xong / mã cũ đã gỡ) ⇒ hai ô về "Tất cả" nhưng
**bộ lọc gửi lên BE vẫn giữ nguyên mã đó** — hạ xuống "tất cả" chỉ vì danh mục chưa về là âm thầm
nới rộng kết quả người dùng đang xem.

### 2. `MascotMajorPicker` — nâng cấp TẠI CHỖ thành modal khảo sát 2 bước

Chọn nâng cấp tại chỗ thay vì dựng component mới: **1 file sửa, 0 file thêm, 0 file xoá**. File đó
đã giữ sẵn cả bốn điều kiện ẩn (chưa đăng nhập · đã chọn ngành · đã bỏ qua trên thiết bị này · đang
có guided tour), cơ chế nhớ localStorage (`isNudgeDismissed`/`markNudgeDismissed`, id `pickMajor`),
và cách xử lý lỗi khi BE từ chối. Dựng component mới nghĩa là chép lại đúng bốn điều kiện đó rồi gỡ
chỗ dùng cũ — nhiều việc hơn để ra cùng một kết quả, và mỗi bản sao là một chỗ nữa để lệch.

- `Modal` (HeroUI) 2 bước: chọn **Khối** → chọn **Chuyên ngành** → **Lưu** (`setMajor`).
- Khối KHÔNG có chuyên ngành con ⇒ Lưu ghi mã **khối**. Bắt buộc phải chọn con thì khối không con
  thành ngõ cụt không bấm tiếp được.
- Lưu xong: workplace lọc theo ngành đó ngay và mọi lần vào sau tự nhảy vào ngành đó — cơ chế
  `majorFilter ?? myMajor` có sẵn, đã kiểm bằng test với mã CON.
- BE từ chối (mã lạ / mất mạng): **giữ modal + báo lỗi**, không nuốt im rồi đóng như đã lưu được.

**GIỮ đường thoát "Để sau"** (Esc / bấm ra nền cũng tính là "Để sau", nhớ bằng localStorage). Lý do
đã ghi trong doc-comment cũ và được chép sang bản mới: đây là lời MỜI chứ không phải cổng chặn —
một bước onboarding BẮT BUỘC là cách nhanh nhất để mất người dùng mới, và ngành là một trường hồ sơ
sửa lại được bất cứ lúc nào ở trang cá nhân. Modal dễ khiến người sau nghĩ "đã là modal thì chặn
luôn"; ghi rõ để đừng.

## Impact

- `src/components/features/subject/SubjectCatalog/index.tsx` — chuỗi 3 dropdown + suy ngược khối cha.
- `src/components/features/subject/SubjectCatalog/index.test.tsx` (mới) — 4 ca khoá phần dễ sai.
- `src/components/features/mascot-moments/MascotMajorPicker.tsx` — modal khảo sát 2 bước.
- i18n (`subjects.catalog.allInMajor`, `mascot.nudge.pickMajor.{specializationTitle,
  specializationBody,noSpecialization}`) — vi + en. Nút Quay lại / Lưu tái dùng `common.back` /
  `common.save`.

## Non-goals

- Không đụng contract BE: vẫn CHỈ MỘT mã đi lên `?major=` và `PATCH /profiles/me { majorCode }`;
  việc gộp môn của các chuyên ngành con vẫn do BE làm.
- Không đổi `MajorPicker` (dropdown dùng chung ở onboarding/hồ sơ) — nó chọn một mã, đúng vai của nó.
- Danh mục ngành RỖNG vẫn là trạng thái HỢP LỆ (BE chưa deploy V335): cả bộ lọc lẫn khảo sát tự ẩn.
