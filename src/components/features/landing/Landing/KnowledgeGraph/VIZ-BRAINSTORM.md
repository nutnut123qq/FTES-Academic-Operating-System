# KnowledgeGraph "Bản đồ Kiến trúc" — VIZ brainstorm (2026-06-27)

> Thầy hỏi: vẽ section này dạng **bubble map** ok không, hay **vòng tròn nảy nảy**? → 3 hướng + chốt.

## Mục tiêu section
Khoe **chiều sâu + bề rộng** concept THẬT của curriculum + câu chuyện **"kiến thức lồng ghép"** (cross-track) + 3 track (màu) + click → khóa. Marketing illustration (Qdrant vibe).

## Dữ liệu (grounded — `KnowledgeGraph/data.ts`)
- **26 node** curated từ module/lesson/challenge thật. 3 track: System Design (10, `--success`) · Fullstack (8, `--accent`) · DevOps (8, `--warning`).
- **31 edge**: builds-on trong track + **7 cross-track** ("lồng ghép"). **KHÔNG có size metric** → muốn bubble-size phải suy từ **degree (số kết nối)**.
- Hiện tại (`index.tsx`): `@xyflow/react` + `d3-force`, **pill** node + dây (cross = accent dashed), kéo/pan, reshuffle 10s, click → popover blurb + "Vào khóa". Locked zoom 1.6.

## Mấu chốt
**EDGE = thông điệp.** Bỏ hết edge (bubble thuần / bóng trôi) = mất pitch "lồng ghép" — cái section này tồn tại để nói. Mọi hướng phải cân: vibe bong bóng ↔ giữ liên kết ↔ chữ đọc/bấm được.

## 3 hướng (đã vẽ widget)
| | Là gì | Được | Mất |
|---|---|---|---|
| **A — Force-graph** (giữ, làm dịu) | pill + dây, calmer motion | giữ pitch "lồng ghép" rõ nhất; đã build | nhìn dễ rối dây; pill ≠ "bong bóng" |
| **B — Bubble constellation** ⭐ | node = **TRÒN, size theo degree** (hub to, lá nhỏ); edge thành **dây MỜ**; float nhẹ | vibe bong bóng + **vẫn giữ liên kết** + size **có nghĩa** (degree = "concept lõi") | code nhiều hơn A; label trên bóng nhỏ cần khéo |
| **C — Bong bóng trôi/nảy** | tròn ĐỀU, **không dây**, drift/bounce | vui mắt nhất, "kho báu nổi" | **mất liên kết**; chữ là click-target mà nảy = mục tiêu di động → khó đọc/bấm + a11y (reduced-motion) |

## Refs
- Bubble/size: [D3 circle packing](https://d3-graph-gallery.com/circularpacking.html) · [zoomable circle packing](https://observablehq.com/@d3/zoomable-circle-packing) · [circle packing với d3-force](https://www.react-graph-gallery.com/example/circle-packing-with-d3-force) (area ∝ value).
- Bóng trôi physics: [Matter.js](https://brm.io/matter-js/) (floating/draggable bubbles — portfolio/agency landing).
- Hạ tầng hiện có: [[marketing-graph-viz-xyflow-d3force-not-new-webgl-lib]] (xyflow + d3-force, đừng kéo lib WebGL mới).

## Khuyến nghị: **B (Bubble constellation)**
- Cho thầy đúng cái "bong bóng" muốn, **không giết pitch** (dây mờ giữ "lồng ghép").
- **"Nảy nảy" thật (C) → bác**: label là click-target; nảy = mục tiêu di động → khó đọc/bấm + đụng `prefers-reduced-motion`. B dùng **float CALM** thay vì bounce → sống động mà vẫn bấm được.
- **Size = degree** (tính client từ `KNOWLEDGE_EDGES`, không cần BE) → bóng to = concept lõi (Idempotency/Kafka/K8s/NestJS), bóng nhỏ = lá → vừa đẹp vừa có nghĩa.
- **Tái dùng hạ tầng** xyflow + d3-force sẵn có: chỉ đổi node shape (pill → circle sized) + giảm opacity edge. Ít rủi ro.

## Empty/loading/a11y
- reduced-motion: settle tĩnh (đã có) — B giữ cơ chế này.
- Loading: skeleton khung (giống đã làm cho hero diagram).

→ Thầy chọn hướng → `/starci-fe-ux-apply` để dựng.
