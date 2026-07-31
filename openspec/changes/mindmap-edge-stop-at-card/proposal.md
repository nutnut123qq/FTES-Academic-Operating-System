# mindmap-edge-stop-at-card — Đường nối sơ đồ tư duy dừng ở VIỀN thẻ, không đâm vào giữa

## Why
Trên sơ đồ tư duy khóa học, các handle của node đặt ở TÂM thẻ (`CENTER_HANDLE_CLASS`) và
đường cong nối tâm-đến-tâm, dựa vào việc thẻ "che" điểm cuối. Nhưng nền thẻ theo trạng thái
là bán trong suốt nên đường gạch (dashed) **đâm xuyên vào giữa ô nội dung** — thầy: "đường dẫn
tới cái ô nội dung thôi, hiện tại đang đâm xuyên tới trung tâm".

## What Changes
- `MindMapCurvedEdge` (`CurvedEdge.tsx`): trước khi vẽ bezier, **cắt mỗi đầu về VIỀN thẻ** phía
  hướng node kia — dùng kích thước node đo được (`useInternalNode(id).measured`) để tính giao
  điểm của tia tâm→tâm với biên hộp. Đường nối giờ dừng đúng ở mép thẻ, không vào trong.
- Chưa đo được (frame đầu trước khi React Flow measure) → dùng tâm như cũ, rồi snap về viền.
- `curvedEdgePath` giữ nguyên chữ ký + logic cong theo trục trội (test cũ không đổi).

## Capabilities
### Modified Capabilities
- `course-mind-map`: đường nối dừng ở viền thẻ, không đâm vào giữa node.

## Impact
FE-only, 1 file `CurvedEdge.tsx`. Không đổi node/handle/build. MindMap test 29 pass.
