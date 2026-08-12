# Tasks — challenge-samples-and-limits

## 1. Contract
- [x] 1.1 `types.ts`: challenge detail thêm `timeLimitMs`/`memoryLimitMb` (nullable) +
      `aiFeedbackLimit`/`aiFeedbackUsed` (nullable) — khớp BE `challenge-testcase-samples`

## 2. Gom nhóm bảng kết quả
- [x] 2.1 `TestCaseResultTable`: case mẫu (`hidden=false`) hiện từng dòng; case ẩn gom 1 dòng
      "Test ẩn: X/Y đạt", bấm để mở rộng xem verdict từng case
- [x] 2.2 Giữ nguyên luật che: case ẩn KHÔNG render input/expected/output ở mọi trạng thái
- [x] 2.3 Giữ tóm tắt "Qua X/Y" + cảnh báo dừng sớm sẵn có

## 3. Hiện giới hạn + lượt AI
- [x] 3.1 `ChallengeProblemAside`: dòng "Giới hạn: {time} · {memory}" (ẩn khi BE không trả)
- [x] 3.2 Nơi nhờ AI nhận xét: hiện "còn n/N lượt", hết lượt → disable + nêu lý do; nói rõ điểm do
      test case chấm
      — LƯU Ý: luồng learn là GRADE = SUBMIT, KHÔNG có nút "nhờ AI" riêng để disable (và spec cấm
      chặn nộp bài), nên hết lượt = chip cảnh báo + nêu lý do, nút nộp giữ nguyên.

## 4. i18n
- [x] 4.1 Khoá mới cho vi (canonical) + en (parity)

## 5. Verify
- [x] 5.1 `tsc --noEmit` + `npm run build` (webpack) xanh
- [x] 5.2 Unit cho hàm thuần tách nhóm mẫu/ẩn + đếm đạt
