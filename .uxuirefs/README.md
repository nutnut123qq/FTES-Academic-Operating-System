# `.uxuirefs` — UX/UI reference library cho StarCi Academy

Tư liệu tham khảo để redesign TOÀN BỘ website. Mỗi file `<site>.md` = ghi chú pattern UX/IA rút từ 1 site peer
(fetch về + chắt lọc), KHÔNG copy pixel — lấy **tư duy + pattern đã chứng minh** (đúng `main.md` §1 "ăn cắp pattern").

## StarCi có những surface nào → tham khảo ai
| Surface StarCi | Peer mạnh nhất | Lấy gì |
|---|---|---|
| Đọc bài (docs 3 cột: content-map · content · on-this-page) | react.dev · Stripe docs · Mintlify | sidebar tree, on-this-page, breadcrumb, code-tabs, AI search |
| Trợ lý AI (FAB + chat về bài) | Mintlify AI · ChatGPT · Perplexity · Intercom Fin | entry point, chat thread, citations, suggested Q |
| Gamification (XP/streak/league/quest) | Duolingo · boot.dev · Exercism | streak ring, XP, league, path map, daily goal |
| Khóa học + challenge (graded) | boot.dev · Exercism · LeetCode · Codecademy | path/curriculum, challenge submit+grade, progress |
| Landing / bán khóa | boot.dev landing · Scrimba · Frontend Masters | hero, social proof, pricing, funnel |
| Dashboard / hub cá nhân | Duolingo home · GitHub | continue-learning, feed, streak, identity |

## Sites đã pull (round 1)
- `react-dev.md` — docs reading (sidebar + on-this-page chuẩn).
- `stripe-docs.md` — docs gold standard (nav + code + 3-pane).
- `mintlify.md` — AI docs product (AI search/ask).
- `boot-dev.md` — gamified coding learning (peer GẦN NHẤT).
- `duolingo.md` — gamification gold standard.

## Cách dùng
1. Đọc file site → mục "Pattern lấy được" + "Áp cho StarCi".
2. Khi `/ux-brainstorm` 1 surface → mở ref tương ứng làm input "ăn cắp pattern".
3. Bổ sung dần: pull thêm site → thêm file + dòng index.

> Pull tiếp (round 2 — chờ thầy): Scrimba, Frontend Masters, Exercism, LeetCode, Linear (polish), Vercel docs, Perplexity, Claude.ai, GitHub profile/dashboard.
