# Landing — Copy polish tiếng Việt (2026-06-26)

> Thầy: *"xúc cái này [section Cách học] · viết tiếng việt tốt hơn tí"*. Section "Cách học / Vòng học thật sự lên tay" (learnLoop) DUYỆT — giữ layout. Việc còn lại = **nắn copy tiếng Việt** mượt/tự nhiên hơn, **bỏ lẫn tiếng Anh** trong câu Việt (build/diagram-first/to-do/design-for-failure). CHỈ đụng `vi.json` (en.json giữ English).

## Nguyên tắc nắn (voice landing StarCi)
- **Không lẫn tiếng Anh trong câu tiếng Việt** trừ thuật ngữ kỹ thuật chuẩn (API, CI/CD, production, capstone, traffic). Dịch các từ có từ Việt tốt: build→dựng/tự dựng · diagram-first→bắt đầu từ sơ đồ · design for failure→thiết kế để chịu sự cố · app to-do→app to-do (giữ, đã nhận diện) nhưng câu mượt hơn.
- **Song song nhịp** (stat label, step desc cùng độ dài/cấu trúc).
- **Punchy, tự tin, không sáo** — giữ wordplay cố ý (diagram caption "sập…sập", founder quote).
- Tag micro-label GIỮ UPPERCASE (đã duyệt riêng cho landing này — comment code + [[no-uppercase-text]] "chỉ khi thầy duyệt").

## Bảng before → after (vi.json)

### A. Hero (thấy ngay đầu trang)
| key | trước | sau (đề xuất) |
|---|---|---|
| hero.eyebrow | Tự học để thành kỹ sư hệ thống | Tự học để **trở thành** kỹ sư hệ thống |
| hero.headline | Học **xây** \<accent>hệ thống thật\</accent> — không **dừng ở** CRUD. | Học **dựng** \<accent>hệ thống thật\</accent> — không **dừng lại ở** CRUD. |
| hero.subline | …Mỗi bài bạn đọc, tự tay **build** rồi để AI chấm ngay — khép lại bằng một dự án capstone thật. | …Mỗi bài bạn đọc, tự tay **dựng** rồi để AI chấm ngay — khép lại bằng một **capstone thực tế**. (cũng đổi "từ cơ bản"→"từ nền tảng") |
| **hero.diagramCaption** ⭐ | Nhìn ra **chỗ** sập. Dựng hệ thống không thể sập. | **Nhìn ra nơi sẽ sập. Dựng hệ thống không bao giờ sập.** (giữ wordplay "sập…sập", mượt hơn) |

### B. Stats strip ⭐ (thầy flag)
| key | trước | sau |
|---|---|---|
| stats.learners | Học viên | Học viên *(giữ)* |
| stats.lessons | Bài học | Bài học *(giữ)* |
| stats.courses | Khóa học | Khóa học *(giữ)* |
| stats.badges | **Huy hiệu đã trao** | **Huy hiệu** *(gọn, đồng nhịp 3 label kia — 2 chữ; "đã trao" lệch nhịp)* |

### C. learnLoop "Cách học" ⭐ (thầy flag — section vừa duyệt)
| key | trước | sau |
|---|---|---|
| learnLoop.intro | Không xem video thụ động — mỗi học phần là một vòng đọc → **build** → chấm → xếp hạng. | Không xem video thụ động — mỗi học phần là một **vòng khép kín: đọc → tự dựng → AI chấm → leo hạng.** |
| items.read.desc | Bài đọc có cấu trúc, code 4 ngôn ngữ. | Bài đọc **mạch lạc, kèm code ở cả 4 ngôn ngữ.** |
| items.grade.desc | Viết code, chấm theo tiêu chí production. | **Tự viết code, AI chấm** theo tiêu chí production. |
| items.capstone.desc | Dựng 1 hệ thống production thật, không phải app demo. | Dựng **một hệ thống chạy thật ở production** — không phải app demo. |
| items.rank.desc | So sánh lời giải và leo bảng xếp hạng. | **Đối chiếu lời giải với người khác, rồi leo bảng xếp hạng.** |

(tags 4 NGÔN NGỮ / PHẢN HỒI TỨC THÌ / HỆ THỐNG THẬT / GIỮ PHONG ĐỘ → giữ uppercase, không đổi)

### D. courses "Lộ trình" (bỏ lẫn English)
| key | trước | sau |
|---|---|---|
| courses.intro | Mỗi lộ trình **diagram-first**, chọn ngôn ngữ của bạn (…). Các khóa khác tìm trong mục Khóa học. | Mỗi lộ trình **bắt đầu từ sơ đồ kiến trúc**, học bằng đúng ngôn ngữ bạn chọn (…). Các khóa khác có trong mục Khóa học. |
| items.fullstack.desc | …kèm frontend **sống được với** traffic thật. | …kèm frontend **trụ được dưới** traffic thật. |
| items.systemDesign.desc | …idempotency — **thiết kế cho thất bại.** | …idempotency — **thiết kế để chịu được sự cố.** |

### E. systems (bỏ lẫn English)
| key | trước | sau |
|---|---|---|
| systems.intro | Mỗi capstone là một hệ thống production thật — không phải **app to-do**. | Mỗi capstone là một **hệ thống chạy thật ở production** — không phải app to-do. |

## Không đụng
- `landing.roadmap.*` = MỒ CÔI (đã gộp vào courses, nợ xoá — [[landing-render-track-not-course-catalog]]) → bỏ qua.
- founder (quote hài cố ý), recruiter, outcome, faq, closing: ổn, giữ. (closing tùy chọn: "thử thách chấm AI"→"thử thách AI chấm" cho thuận.)
- en.json: GIỮ (chỉ nắn tiếng Việt).
- tags learnLoop: GIỮ uppercase (đã duyệt).

## Áp
- `/starci-fe-ux-apply`: sửa các string trên trong `vi.json`. JSON hợp lệ. Verify bằng mắt trang `/vi`.
