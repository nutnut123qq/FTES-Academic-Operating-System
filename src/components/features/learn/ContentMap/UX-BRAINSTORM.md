# UX brainstorm — content-map rail TRÁI (2026-06-19)

> Vùng: rail trái khi đọc bài — feature `ContentMap` (search + accordion module → `ContentMapRow`). KHÔNG code (doc),
> rồi `/ux-apply`. Research: web (LMS sidebar + Duolingo path) vì memory chỉ có quyết định "làm lean", chưa có ref ngoài.

## Inventory (đang có gì)
- `ContentMap`: ô search (filter client) + `Accordion` module (header = title + `ProgressMeter` đếm bài đã đọc) +
  `ContentMapRow` mỗi bài (tick/circle/lock/star + title clamp-2 + phút). Active lesson tint, module active auto-expand.
- Data: `useQueryMyCourseOutlineSwr` → `myCourseOutline`.

## Field BE đang CÓ nhưng CHƯA dùng (= cơ hội, grounded)
| Field (myCourseOutline) | Hiện | Cơ hội |
|---|---|---|
| `progress.completionPercent` + `lessonsRead/Total`, `challengesCompleted/Total`, `tasksCompleted/Total` | **không hiện** | header tiến độ cả khóa |
| `currentTask {kind,id,milestoneId}` | **không hiện** | nút **"Tiếp tục"** (ít click nhất tới việc cần làm) |
| `milestones[] / tasks[]` (capstone) | **vắng khỏi rail** | rail chưa phải bản đồ ĐẦY ĐỦ → thêm nhóm Đồ án |
| `lesson.challenges[]` (status/completed) | ẩn | chấm "có thử thách / đã xong" trên row |
| `lesson.difficulty`, `module.orderIndex` | ẩn | đánh số module / nhãn độ khó (nhẹ) |

## Pain (web-grounded)
1. **Không có "tôi đang ở đâu / còn bao nhiêu".** `completionPercent` + `currentTask` đều có sẵn mà bỏ phí. LMS best practice:
   **tiến độ luôn nhìn thấy** + **ít click nhất** tới việc tiếp theo ([techhbs](https://techhbs.com/designing-lms-ui-ux-best-practices/), [lazarev](https://www.lazarev.agency/articles/lms-ux)).
2. **Bản đồ thiếu mảnh.** Rail chỉ có module/lesson, **vắng capstone milestones** → không phải "content map" trọn vẹn.
3. **Rail dài 87 bài, không auto-cuộn tới bài active** → mở rail phải tự dò. (sticky + đưa active vào tầm nhìn.)
4. **Header module hơi nặng** (title + thanh full-width) lặp lại nhiều lần; module gập vẫn tốn chiều cao.
5. **Bài có thử thách trông y bài thường** — mất tín hiệu "còn việc phải làm" (Duolingo giảm-confusion: rõ "cái gì tiếp theo").

## Hướng (web-grounded)

### Hướng A — Docs-tree + header tiến độ + "Tiếp tục" *(CHỐT)*
- **Đầu rail (sticky):** vòng/► thanh `completionPercent` + dòng "Đã đọc N/M · Thử thách x/y" + nút **"Tiếp tục"** nhảy thẳng `currentTask`.
- Giữ accordion tree lean; **thêm nhóm "Đồ án" (milestones/tasks)** cuối để rail = bản đồ đầy đủ.
- **Auto-scroll bài active vào tầm nhìn** khi mở; rail sticky.
- Row: thêm **chấm thử thách** nhỏ khi `lesson.challenges` có (đậm khi chưa xong) — tín hiệu "còn việc".
- **Vì sao chốt:** đắp đúng 2 field ROI cao nhất (`completionPercent`+`currentTask`), hoàn thiện bản đồ, bám LMS best practice
  (tiến độ hiện + ít click + milestone tạo động lực), KHÔNG đập bỏ bản lean đã chốt. Rủi ro thấp, grounded 100% data thật.

### Hướng B — Duolingo "learning path" (chuỗi node dọc)
- Thay accordion bằng đường node tuần tự (đã xong ✓ / đang pulse / khoá), line nối, cảm giác "leo đường".
- Mạnh về động lực ([duoplanet path](https://duoplanet.com/duolingo-learning-path/)) NHƯNG: 87 node = rất dài, ngữ cảnh **đọc docs cần nhảy/scan nhanh** chứ không tuyến tính; **trái với quyết định "rail lean" đã chốt** trong memory. Loại.

### Hướng C — Index siêu gọn (gập mặc định)
- Gập hết trừ module active; header module = số thứ tự + title + "n/m" (bỏ thanh), tiến độ = ring nhỏ. Pinned "Tiếp tục" đầu.
- Gọn hơn nữa nhưng **mất tiến độ-per-module ở mức liếc** và vẫn thiếu capstone/continue tổng. Kém A.

## Map section → dữ liệu (Hướng A)
| Section | Field | Trạng thái |
|---|---|---|
| Header tiến độ | `progress.completionPercent`, `lessonsRead/Total`, `challengesCompleted/Total`, `tasksCompleted/Total` | có sẵn, thêm UI |
| Nút "Tiếp tục" | `currentTask {kind,id,milestoneId}` | có sẵn, route theo kind |
| Tree module/lesson | như hiện (`ContentMapRow`) | giữ |
| Nhóm Đồ án | `milestones[]`/`tasks[]` (`completed`,`lastScore`) | thêm accordion group |
| Chấm thử thách/row | `lesson.challenges[]` (`completed`) | thêm meta nhỏ |
| Auto-scroll active | `activeContentId` (redux) | thêm `scrollIntoView` |

## Empty / loading / error / a11y
- Đã có `AsyncContent` (skeleton mirror, empty tự ẩn, error retry) — header tiến độ cũng nằm trong đó.
- "Tiếp tục" ẩn khi `currentTask=null` (đã xong hết). Search rỗng → "không khớp".
- A11y: nút Tiếp tục có aria-label; row là button (đã có); scroll dùng `block:"nearest"` không cướp focus.

→ CHỐT Hướng A. `/ux-apply`: header tiến độ + "Tiếp tục" + auto-scroll (core), rồi nhóm Đồ án + chấm thử thách (phụ).
Sources: [techhbs LMS](https://techhbs.com/designing-lms-ui-ux-best-practices/) · [Lazarev LMS UX](https://www.lazarev.agency/articles/lms-ux) · [riseapps LMS](https://riseapps.co/lms-ui-ux-design/) · [Duolingo path](https://duoplanet.com/duolingo-learning-path/).
