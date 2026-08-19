# Thiết kế — bộ lọc catalog môn theo syllabus

## Bộ lọc chốt lại: 3 trục, không thêm

| Trục | Tham số | Nguồn dữ liệu | Vì sao giữ |
|---|---|---|---|
| Ngành (2 cấp) | `major=<code>` | `subject_majors` + `majors.parent_id` | Trục chính: từ 397 môn xuống ~40–60 môn của một chuyên ngành |
| Kỳ học | `semester=1..9` | `subject_majors.semester`, rơi về `subjects.recommended_semester` | Cắt tiếp còn ~5–8 môn = đúng "kỳ này tôi học gì" |
| Tìm kiếm | `q=` | `code`/`name` (LIKE) | Người biết mã môn (`PRF192`) đi thẳng, không cần lọc |

`difficulty` giữ nguyên trong API (đã có từ trước) và nay có dữ liệu thật để lọc — suy từ chữ số
mức trong mã môn (`PRF192` → 1 → EASY, `SEP490` → 4 → VERY_HARD). Đây là **heuristic**, ghi rõ
trong migration; trước đó cột này NULL toàn bộ và FE mặc định mọi môn thành "Trung cấp" — bịa
đều nhau thì bộ lọc vô nghĩa.

Không thêm trục **khoá (K20/K21)** dù dữ liệu có: chương trình hai khoá khác nhau chủ yếu ở môn
tự chọn, và bộ lọc ba tầng đã đủ để một sinh viên tìm ra môn của mình.

## Vì sao ngành 2 cấp chứ không phẳng

- Phẳng theo **khối** (8 mục): chọn "Công nghệ thông tin" còn ~250 môn — chưa giải quyết gì.
- Phẳng theo **chuyên ngành** (26 mục): mất khối, và môn đại cương phải gắn vào cả 26 chuyên
  ngành mới không biến mất.
- Hai cấp: chọn khối = khối + con (một câu `findByParentIdAndStatus`, cây chỉ hai tầng nên
  KHÔNG cần recursive CTE); chọn chuyên ngành = chỉ nó.

Chỉ tách cấp 2 ở khối có **từ 2 chuyên ngành** (BIT, BBA, BCT). Khối một chuyên ngành
(BJP/BKR/BCH/LLB, và BEN) thì cấp 2 chỉ là bản sao cấp 1 — bắt người dùng chọn hai lần cho cùng
một thứ.

## Vì sao kỳ nằm ở bảng nối

`ACC101` là kỳ 1 ở ngành Tài chính nhưng kỳ 2 ở Quản trị khách sạn — 133/1061 cặp như vậy. Nên:

```
đã chọn ngành  → EXISTS (subject_majors WHERE major_id IN :ids AND semester = :semester)
chưa chọn ngành → subjects.recommended_semester = :semester      (kỳ phổ biến nhất của môn)
```

Lọc cả hai cùng lúc sẽ loại oan môn mà ngành xếp khác kỳ phổ biến — nên hai nhánh loại trừ nhau,
không phải AND.

## Đường dữ liệu

```
syllabase_K20_K21.json ──(scripts/gen_syllabus_seed.py)──▶ V2__syllabus_catalog_seed.sql
                                                              │ flyway, lúc boot
                              subject.majors (28, 2 cấp) ◀────┤
                              subject.subjects (397) ◀────────┤
                              subject.subject_majors (1032, có semester) ◀┘

GET /api/v1/majors    → [{code, name, nameVi, parentCode}]      → dropdown ngành (thụt lề con)
GET /api/v1/subjects  → page(24) lọc major+semester+q ở BE      → lưới + cuộn nạp thêm
```

## Đánh đổi đã cân nhắc

- **Môn seed để `PUBLISHED`, workspace rỗng.** DRAFT thì không ra catalog, mà cả bộ lọc này sinh
  ra là để lọc catalog. Môn chưa ai đóng góp mở ra là các tab rỗng — đúng trạng thái thật.
- **Không đánh index `majors.parent_id`.** Bảng 28 dòng.
- **`parentCode` chỉ có ở `GET /majors`**, chip ngành trên thẻ môn để `null`: thêm trường vào
  `MajorCatalogApi.MajorRef` là đổi hợp đồng trong jar dùng chung cho một endpoint duy nhất cần.
- **Không seed tiên quyết** dù file có `roadmap` cho 397 môn — chưa có màn nào dùng.
