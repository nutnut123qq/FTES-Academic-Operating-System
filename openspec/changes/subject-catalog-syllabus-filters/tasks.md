# Tasks — subject-catalog-syllabus-filters

## 1. Seed dữ liệu syllabus (repo `FTES-AOS-Workspace`)
- [x] 1.1 `scripts/gen_syllabus_seed.py`: đọc `syllabase_K20_K21.json` → sinh migration; uuid5 theo mã (id giống nhau giữa các môi trường), tên tách được cả 3 kiểu viết (`EN_VI`, `VI\nEN`, một tên), độ khó suy từ chữ số mức của mã môn
- [x] 1.2 Assert ngay lúc sinh (`check()`): mã ≤16/32 ký tự, tín chỉ 0..10, kỳ hợp lệ, không trùng khoá trong cùng câu `INSERT ... ON CONFLICT DO UPDATE`
- [x] 1.3 `V2__syllabus_catalog_seed.sql`: `majors.parent_id` + `subject_majors.semester`; 8 khối + 20 chuyên ngành (`SE`/`IC` giữ id V336, `MATH`/`LANG` → INACTIVE); 397 môn `ON CONFLICT DO NOTHING`; 1032 cặp môn↔ngành có kỳ; khối hậu kiểm `RAISE EXCEPTION` khi thiếu

## 2. Truy vấn + API (repo `FTES-AOS-Workspace`)
- [x] 2.1 `Major.parentId` + `MajorRepository.findByParentIdAndStatus`; `SubjectMajor.semester`
- [x] 2.2 `MajorCatalogService.filterIdsOfCode` (khối → khối + con ACTIVE; chuyên ngành → chỉ nó) thay `idOfActiveCode` (xoá, không còn ai gọi)
- [x] 2.3 `SubjectRepository.searchPublished`: `majorIds IN`, kỳ đọc từ bảng nối khi có ngành / từ `recommendedSemester` khi không, và tìm kiếm thêm `nameVi` — chuyển ô tìm xuống BE mà chỉ tra tên tiếng Anh thì người dùng gõ tiếng Việt không ra gì
- [x] 2.4 `MajorCatalogService.listActiveTree` + `MajorView.parentCode` cho `GET /majors` (KHÔNG đụng `MajorCatalogApi.MajorRef` trong jar hợp đồng)
- [x] 2.5 Test: unit cây ngành + lọc; IT `SubjectMajorCatalogIT` thêm ca lọc theo khối, kỳ-theo-ngành, seed có mặt trong DB

## 3. FE
- [x] 3.1 `useQuerySubjectsSwr` → `useSWRInfinite`, trang 24, cả 3 bộ lọc nằm trong SWR key và gửi xuống BE; `fetchSubjectCatalogPage` không gửi tham số `null`
- [x] 3.2 `useQuerySubjectOptionsSwr` (trần 500, một lượt) cho `<select>` môn ở form tải tài nguyên
- [x] 3.3 `SubjectCatalog`: bỏ lọc client-side, `useDeferredValue` cho ô tìm, `InfiniteScrollSentinel` nạp trang sau, chuyên ngành thụt lề trong dropdown
- [x] 3.4 `MajorView.parentCode` (types) + `Major.parentCode` (hook) 
- [x] 3.5 Test: `useQuerySubjectsSwr.test.ts` ghim contract HTTP (gửi/không gửi tham số, trim `q`, `page` đúng)

## 4. Verify
- [x] 4.1 BE unit: `mvn -DskipITs test` → 82 xanh, gồm `SubjectQueryParseTest` parse HQL của `searchPublished` bằng SessionFactory KHÔNG cần DB (CI chạy `-DskipITs` nên `@Query` sai chỉ chết lúc boot; đã kiểm ngược: đổi `s.nameVi` → `s.nameXX` thì test đỏ)
- [x] 4.2 FE: `npx tsc --noEmit` sạch; `vitest run` vùng subject + MajorPicker + messages → 221 xanh
- [x] 4.3 IT Postgres thật — chạy trên server 2026-08-19: V1+V2 boot được, 5/7 xanh (gồm lọc theo khối, kỳ-theo-ngành, mã ngành lạ bị từ chối). 2 đỏ đều là lỗi TEST, đã vá ở commit BE thứ hai: assert SEP490 sai kỳ vọng (chương trình xếp ô tự chọn SE_GRA_ELE chứ không xếp thẳng đồ án tốt nghiệp) và ngành ZZNEW làm bẩn test khác
- [x] 4.4 Diễn tập trên bản sao dữ liệu apitest (241 môn có sẵn): V2 exit 0, thêm 234 môn, MATH/LANG → INACTIVE, SE/IC giữ id V336, 1032 dòng nối. Lộ ra: seed tạo thêm 1 mã trùng hoa-thường (ITE303c cạnh ITE303C) → đã vá bằng `WHERE NOT EXISTS lower(code)` + join `lower()`
- [ ] 4.5 Chạy lại IT + diễn tập với bản đã vá trước khi merge (main = auto deploy)
- [ ] 4.6 Sau khi deploy: reindex tìm kiếm để 397 môn vào index (seed bằng SQL nên KHÔNG phát sự kiện outbox)
