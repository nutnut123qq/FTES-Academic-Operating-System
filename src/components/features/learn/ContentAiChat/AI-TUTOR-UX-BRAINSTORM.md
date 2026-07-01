# UX Brainstorm — Content-AI: từ "chatbox thường" → TRỢ GIẢNG bám khóa học

> Panel "Hỏi StarCi AI" (`ContentAiChat`, popover/drawer FAB trên trang đọc bài / giải challenge).
> Ngày 2026-06-28. Yêu cầu thầy: *"làm sao để hỗ trợ khóa học hết sức có thể thay vì 1 chatbox thông thường"*.
> KHÔNG code — brainstorm + chốt hướng.

## Mục tiêu (≤2s)
Người học mở panel phải cảm thấy **"AI này biết BÀI NÀY và giúp mình HỌC được nó"** — không phải ô chat trống. Hỗ trợ học = **(a) hiểu** (giải thích/Socratic) · **(b) luyện** (quiz/thẻ/challenge) · **(c) nhớ** (SRS) · **(d) cá nhân hoá** (điểm yếu).

## Pain hiện tại
- Chatbox generic: 4 chip gợi ý tĩnh ("Tóm tắt", "Giải thích phần khó", "Cho ví dụ", "Mình nên nhớ gì") + ô nhập. **Không nối** vào hệ thống học của khóa (thẻ SRS, challenge, interview, outcomes). Nó **trả lời** chứ không **dạy/dẫn vào luyện tập**. Mở ra là 1 ô trống → người học không biết AI làm được gì cho việc HỌC.

## Dữ liệu/khả năng THẬT (scan BE+FE — grounded, không bịa)
| Hệ thống | Có thể dùng (READ) | Tạo/ghi được? | Nguồn |
|---|---|---|---|
| **Content-AI** | hỏi grounded theo body bài (MinIO V2 bodies), history `(enrollment, content)`, cap 8 turn, stream qwen Free 0đ | ghi history turn (đã có) | socket `/content_ai`, `contentAiHistory` |
| **Outcomes** | `ContentLearningOutcomeEntity` — "bạn sẽ nắm được" (bullet/lesson) | — | content reader đã hiện |
| **Flashcards/SRS** | `flashcardDecksByCourse(contentId)` = **deck link với BÀI NÀY**, `myDueFlashcards`, `myFlashcardStats` (streak/retention), SM-2 review | **KHÔNG tạo thẻ runtime** (seed-only) | Flashcards reviewer (route sẵn) |
| **Challenges** | `challenge` của bài (`challenge.contentId`): requirements/steps/hint/outputs; submission + AI feedback | submit (đã có); **không tạo challenge** | tab `ContentTab.Challenges` (mở inline) |
| **Interview/quiz** | `myInterviewHistory` → **tag điểm yếu** (fail theo công nghệ), pass-rate theo level; grade answer (AI) | grade (paid lane) | InterviewSession |
| **Mastery** | `userChallengeStrength`, `userSolvedChallenges`, mind-map progress | — | dashboard/leaderboard |
| **AI infra** | category Free/Economy/Balanced/Premium, credit 0/5/20/50, lane Auto/Premium/BYOK | — | balancer |

**Ràng buộc quan trọng:** **KHÔNG tạo được thẻ/challenge lúc chạy** (tất cả seed từ `.mount`). → "quiz/kiểm tra" phải là **ephemeral trong chat** (qwen ra câu hỏi + chấm tại chỗ, không persist); "ôn thẻ" = **gợi ý deck CÓ SẴN đã link bài**, không generate-and-save. Selection (bôi đen đoạn) **chưa có** trong reader (`MarkdownContent` chỉ gắn `data-toc` cho heading; không có `getSelection`).

## 3 HƯỚNG (xem widget mockup ở chat)

### A — "Trợ giảng bám hành động" (action-first, grounded) ⭐ ĐỀ XUẤT
- Empty-state KHÔNG còn 4 chip tĩnh → **lưới hành động bám bài** (context-gated theo data thật):
  - **Giải thích** (khái niệm / phần — có thể chọn theo heading TOC: "Giải thích §2.1.3").
  - **Kiểm tra hiểu** = Socratic: AI ra 1 câu hỏi từ bài (neo theo `outcomes`), người học trả lời ở composer, AI **chấm + giảng ngay trong chat** (ephemeral, qwen Free). Pattern Khanmigo / MS Learn Live.
  - **Ôn thẻ · N** — CHỈ hiện nếu `flashcardDecksByCourse(contentId)` có deck → route sang Flashcards reviewer (thẻ thật của bài).
  - **Luyện challenge · N** — CHỈ hiện nếu bài có challenge → mở `ContentTab.Challenges` / đưa hint.
- Chat tự do vẫn còn (composer), nhưng **việc dẫn dắt** thay vì ô trống.
- **Trade-off:** giá trị học cao nhất, dùng nhiều hệ thống sẵn có nhất; cần vài READ mới (decks-by-content count, challenges count) + Socratic prompt. Honest (gợi ý cái CÓ THẬT, quiz ephemeral). **Đề xuất.**

### B — "Hỏi theo đoạn (bôi đen)" (selection-anchored, NotebookLM-style)
- Thêm xử lý **selection** trong reader: bôi đen đoạn → nút nổi "Hỏi AI về đoạn này" → panel mở, **scoped** đúng đoạn ("Giải thích đoạn này / Cho ví dụ / Dịch ra đời thường"). Chip "Đang hỏi: §2.1.3".
- **Trade-off:** grounded sâu nhất cho "kẹt đúng chỗ này"; nhưng **cần plumbing selection mới** (`window.getSelection` trên `#lesson-article` + nút nổi) — chưa có. Eng cao hơn. → hợp làm **v2 power-up** chồng lên A.

### C — "3 chế độ: Hỏi · Kiểm tra · Luyện" (segmented)
- Panel chia 3 mode bằng `SegmentedControl`: **Hỏi** (chat tự do) · **Kiểm tra** (Socratic quiz chấm trong chat) · **Luyện** (launchpad: thẻ + challenge của bài + "drill điểm yếu" từ interview history).
- **Trade-off:** mental model rõ nhất (3 việc), reuse block sẵn; nhưng popover 380px + tabs dễ chật, mỗi tab phải tối giản. → C là **cách TỔ CHỨC** của A (A = nội dung; C = cách bày).

## Chốt: **A** (lõi) + dùng cơ chế **C** để tổ chức, **B** để dành v2
"Hỗ trợ khóa học hết sức" = nối vào MỌI hệ thống học (giải thích · SRS thẻ · challenge · interview/điểm yếu · outcomes). **A** làm tốt nhất việc đó, grounded từ data thật, honest về ràng buộc (không tạo thẻ runtime → quiz ephemeral + gợi ý deck có sẵn). Selection (B) là nâng cấp sau khi A chạy.

## Section → control → data (hướng A)
| Vùng | Control | Nguồn THẬT |
|---|---|---|
| Empty-state | lưới hành động grounded | derive từ content + decks(contentId) + challenges + outcomes |
| Giải thích | chip → câu hỏi (có thể theo heading) | TOC `useTableOfContents` + body |
| Kiểm tra hiểu | Socratic quiz trong chat | qwen Free stream + `outcomes` làm khung; ephemeral (không persist) |
| Ôn thẻ · N | route → Flashcards | `flashcardDecksByCourse(contentId)` (gate N>0) |
| Luyện challenge · N | mở tab Challenges | challenge của bài (gate có challenge) |
| (v2) điểm yếu | "bạn yếu Redis → ôn deck" | `myInterviewHistory` weak tags |
| Chat | hỏi tự do + history | socket `/content_ai`, `contentAiHistory` |

## Cắt / thêm
- **Cắt:** 4 chip gợi ý tĩnh generic (thay bằng hành động grounded theo data thật + section-aware).
- **Thêm:** lưới hành động context-gated; mode "Kiểm tra hiểu" (Socratic, ephemeral, chấm trong chat); handoff route sang Flashcards/Challenges (gate theo data).
- **KHÔNG thêm BE nặng:** chỉ cần đếm decks(contentId)/challenges (query đã có) + prompt Socratic. Không tạo thẻ runtime.
- **Defer (v2):** selection "Hỏi về đoạn này" (B); cá nhân hoá theo weak-tag interview; richer grading bằng lane paid.

## Refs (web, 2026)
- MS Copilot HAX — 3 kiến trúc: Immersive / **Assistive (side panel)** / Embedded; "giải thích copilot làm được gì + gợi ý cách bắt đầu" → [letsgroto](https://www.letsgroto.com/blog/mastering-ai-copilot-design) · [MS Learn UX guidance](https://learn.microsoft.com/en-us/microsoft-cloud/dev/copilot/isv/ux-guidance)
- **MS Learn Live** — copilot = gia sư **Socratic** (hỏi ngược, không phun đáp án) → [MS Copilot blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/2025/10/23/human-centered-ai/)
- **NotebookLM / Scholarly / Studygenie** — study tools (flashcards/quiz/summary) **grounded từ tài liệu nguồn**, truy vết về nội dung thật, không hallucinate → [Scholarly](https://scholarly.so/) · [coursiv 2026](https://coursiv.io/blog/best-ai-tools-for-education-2026)
- **Tutor CoPilot** (arXiv) — human-AI scaffolding gia sư thời gian thực → [arXiv 2410.03017](https://arxiv.org/pdf/2410.03017)

→ Thầy chọn hướng (A đề xuất) → `/starci-fe-ux-apply` để dựng.
