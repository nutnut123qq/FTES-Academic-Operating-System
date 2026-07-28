# Trợ lý tiến độ AI trên bản đồ tư duy (mind map)

## Why
Bản đồ tư duy khóa học đã tô màu 3 trạng thái hoàn thành mỗi node, nhưng người học vẫn phải
tự nhìn cả cây để biết **nên học gì tiếp**. Cần một lớp "trợ lý tiến độ" theo dõi tiến độ và
chỉ ra bước kế tiếp tối ưu — biến bản đồ tĩnh thành công cụ dẫn đường.

## What Changes
- **Engine phân tích tiến độ thuần** (`progress.ts`): từ cây learn (module/lesson + tín hiệu
  hoàn thành per-viewer) tính: % tổng, đếm bài/chương theo trạng thái, danh sách điểm mạnh
  (chương đã xong) và chương cần hoàn thành, và **một gợi ý "học tiếp"** theo luật ưu tiên:
  1. Tiếp tục bài đang học ("bạn ở đây") nếu chưa xong.
  2. Hoàn thành chương dở-dang gần xong nhất (bank chiến thắng).
  3. Bắt đầu chương chưa đụng tiếp theo.
  4. Nếu phần còn lại đều bị khóa → nhắc mở khóa (ghi danh).
  5. Hết → chúc mừng hoàn thành.
- **Panel "Trợ lý tiến độ"** nổi trên canvas (thu gọn được): thanh % tổng, thẻ gợi ý học tiếp
  + nút "Học ngay", chip điểm mạnh / cần hoàn thành.
- **Highlight trên canvas**: node bài được gợi ý mang viền nhấn + badge "Gợi ý"; bấm "Học ngay"
  dùng đúng luật mở/gate như khi bấm node đó (route reader hoặc mở package gate).

Gợi ý hiện là **rule-based, tất định** (test được); panel là chỗ cắm sẵn cho một job
ai-platform (coaching ngôn ngữ tự nhiên trên cùng snapshot) ở phase sau, không đổi shape.

## Impact
- Affected spec: `mindmap-progress-assistant` (ADDED)
- Affected code (FE): `MindMap/progress.ts` (+test), `MindMapProgressPanel.tsx`, `build.ts`
  (`recommendedLessonId`/`isRecommended`), `ContentNode.tsx` (badge), `index.tsx` (wire), i18n en/vi.
- Không đổi BE/GraphQL.
