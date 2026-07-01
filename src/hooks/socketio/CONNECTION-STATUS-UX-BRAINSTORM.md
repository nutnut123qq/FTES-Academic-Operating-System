# UX Brainstorm — Báo "mất kết nối / đang kết nối lại" cho realtime socket (2026-06-28)

> Câu hỏi thầy: khi socket rớt thì **nhắc người dùng kiểu gì — alert hay modal?**
> Bước này KHÔNG code. Ra hướng + chốt.

## Bối cảnh (grounded in source)
- 5 namespace socket: `/job_notifications` · `/content_discussion` · `/ai_lab` · `/community_chat` · `/content_ai` (`hooks/socketio/sockets.ts`). Vừa bật lại auto-reconnect built-in (`utils.ts reconnection: true` + `auth` dạng hàm).
- **CHƯA có state kết nối ở store** — lifecycle hook chỉ `console.log` on connect/disconnect/connect_error, KHÔNG dispatch. → muốn hiện bất kỳ chỉ báo nào, phải **thêm state** (per-namespace `connected` + aggregate).
- Primitive sẵn có: HeroUI **`toast`** (`modules/toast/api.ts`, `<ToastProvider/>` mounted ở `InnerLayout.tsx`), HeroUI **`<Alert>`** (vd `TaskLockedAlert`), app shell `InnerLayout.tsx` (chỗ mount chỉ báo global).
- **KHÔNG có** xử lý offline trình duyệt (`navigator.onLine`) nào.
- **Quan trọng:** socket rớt **chỉ ảnh hưởng realtime** (chat stream, job notif, discussion live, ai-lab). Phần còn lại app chạy **HTTP/GraphQL bình thường**. → KHÔNG được chặn cả app.

## Nguyên tắc (research)
Đồng thuận ngành (Google Docs · Slack · Figma · Carbon · Salesforce Lightning):
- **Modal = SAI** cho mất kết nối. Modal để dành cho việc **chặn cần quyết định**; mất kết nối là trạng thái **tự hồi phục** + app vẫn dùng được → chặn = quá tay, gây hoảng.
- **Toast tự tắt = SAI làm chỉ báo chính.** Mất kết nối là **TRẠNG THÁI kéo dài**, không phải sự kiện thoáng qua. Toast biến mất → bỏ lỡ; hoặc nhiện lại lặp → phiền.
- **Banner/pill bền (persistent, không chặn) = ĐÚNG.** Hiện trong khi mất kết nối, tự ẩn khi nối lại (Google Docs "Đang thử kết nối lại").

## 3 hướng
| | Mô tả | Ref | Trade-off |
|---|---|---|---|
| **A · thanh trạng thái toàn cục** ⭐ | Pill/bar mảnh dưới navbar "Mất kết nối — đang thử lại…" (amber), tự ẩn khi nối lại | Google Docs, Slack, Linear | Luôn biết; không chặn. Cần aggregate state 5 namespace |
| **B · banner trong panel realtime** | Chỉ surface đang dùng hiện banner + khoá nút Gửi (vd ContentAiChat) | Figma, Discord | Báo đúng nơi cần; người không mở panel khỏi phiền. Cần wiring per-surface |
| **C · modal / toast** ✗ | Modal chặn hoặc toast tự tắt | — | Modal chặn vô lý (app vẫn chạy HTTP); toast bỏ lỡ trạng thái |

## CHỐT (đề xuất): **A + B hybrid**, KHÔNG modal
- **A (global pill)** = tín hiệu nền luôn có: dưới navbar, amber `bg-warning`, debounce **hiện sau ~2s rớt** (đừng nháy với blip <2s), tự ẩn + nháy "Đã kết nối lại" (success) ~1.5s khi nối lại.
- **B (scoped)** = ở surface realtime đang mở (đầu tiên: ContentAiChat) thêm dòng "đang thử lại…" + **khoá nút Gửi** khi `/content_ai` rớt → người dùng hiểu vì sao không gửi được. (Các panel khác thêm dần.)
- → Giống đúng Google Docs: global "reconnecting" + per-feature affordance.

## Engineering để chạy được (khi /apply)
1. **State kết nối**: zustand/Redux slice `socketConnection` — `Record<namespace, "connected"|"disconnected"|"connecting">`; dispatch từ 5 lifecycle (`onConnect`/`onDisconnect`/`onConnectError`). Selector aggregate `anyDown` + `reconnecting`.
2. **A**: component `<SocketStatusBar/>` mount ở `InnerLayout` (dưới `<Navbar/>`), đọc aggregate, debounce 2s, dùng token `bg-warning`/`text-warning` (đồng bộ chip semantic — `elements/chip`). KHÔNG dùng `<Alert>` (Alert nặng/ô vuông) — pill mảnh 1 hàng.
3. **B**: ContentAiChat đọc `socketConnection["/content_ai"]` → banner + `isDisabled` nút Gửi.
4. Copy (đồng bộ giọng UI, không hoảng, không "!"): "Mất kết nối — đang thử lại…" / "Đã kết nối lại".

## Nguồn
- [Carbon — Notification usage](https://carbondesignsystem.com/components/notification/usage/)
- [Salesforce Lightning — interface feedback patterns](https://www.lightningdesignsystem.com/guidelines/notifications/interface-feedback/patterns/)
- [Mobbin — Toast best practices](https://mobbin.com/glossary/toast)
- [Figr — Error state design patterns](https://figr.design/blog/error-state-design-patterns)
- Precedent app: NiceGUI "Connection lost. Trying to reconnect…" toast bị than phiền vì lặp (→ chọn banner bền, không toast).
