# SubmissionResult — UX Brainstorm (2026-06-25)

Trang kết quả 1 requirement của challenge: `.../challenges/<id>/result?submission=<reqId>&attempt=<attemptId>`.

## REFINE cột PHẢI (brainstorm 2026-06-25, vòng 2) — header ấn tượng + findings TÁCH thẻ
Sau khi bỏ outer card, thầy: *"1 header ấn tượng hơn; các card tách nhau ra chứ không phải dính"*. → 2 việc:
1. **Verdict header ẤN TƯỢNG** (thay chip nhỏ + muted trơ): verdict là thông tin số-1 (đạt/chưa) → cho nó 1 khối nổi.
   - **Hướng A (đề xuất) — Verdict banner tint theo kết quả:** 1 banner `bg-{success|danger}` (đỏ=chưa đạt, xanh=đạt) + icon lớn (`CheckCircleIcon`/`XCircleIcon` ~32px) + status (h4) + điểm + "cần N để qua" + "Xem bài nộp"↗. Summary 1 dòng dưới banner. Ref: GitHub Actions check summary · Sentry issue header. Tint = đọc verdict trong 0.5s.
   - **Hướng B — Score hero:** điểm cỡ lớn (`0/100`, 36px) dẫn dắt + chip verdict + ngưỡng qua. Ref: LeetCode/exam result. (Hợp khi điểm là trục chính; nhưng ở đây verdict pass/fail quan trọng hơn số → A thắng.)
2. **Findings TÁCH thẻ (KHÔNG dính):** mỗi finding = **`FeedbackCard` BORDERED riêng** (KHÔNG frameless), cách nhau `gap-3` (KHÔNG còn inset list dính separator). Gom theo severity (eyebrow câm). → đảo lại quyết định "frameless inset" trước đó: thầy muốn các thẻ tách bạch (mỗi finding 1 bounded object), dễ quét + thoáng. `FeedbackCard` dùng lại variant **bordered mặc định** (bỏ frameless ở result page); modal vẫn bordered.
   - Hệ quả: gỡ inset list `rounded-2xl border` bao quanh; thay bằng `flex flex-col gap-3` chứa FeedbackCard bordered.

→ Cần thầy chốt **header A hay B**. Findings tách thẻ (gap-3) áp cho cả hai.

## Mục tiêu trang
Người học xem **bài nộp của mình đạt/chưa**, **vì sao** (findings theo ưu tiên), so sánh **các lần thử**, mở lại bài nộp. ≤30s: "lần này đạt chưa, sai gì, lần trước khác gì".

## Inventory (data THẬT, đọc từ component + hook)
| Khối | Field BE | Ghi chú |
|---|---|---|
| Lần thử (list) | `SubmissionAttemptEntity`: `attemptNumber · score · processedAt · submissionUrl · shortFeedback · id` | newest-first |
| Verdict | `score` vs `passThreshold * maxScore` (config + `requirement.score`) | đạt/chưa |
| Summary | `attempt.shortFeedback` | 1 dòng |
| Findings | `SubmissionFeedbackEntity`: `severity` (High/Med/Low) + FeedbackCard (src/location + suggestion) | gom theo severity |
| Identity | `requirement.title` (cần confirm field) | tên requirement đang chấm |

## Pain hiện tại (legacy = inventory)
- KHÔNG có identity: chỉ back-link trơ; không biết đang xem requirement nào.
- Label `uppercase` ("CÁC LẦN THỬ", "ƯU TIÊN CAO") → **vi phạm [[no-uppercase-text]]**.
- Lần thử = `<button>` ad-hoc (bordered card rời), KHÔNG ListBox.
- Detail bên phải **phẳng** (verdict/summary/findings float trên nền), không Card surface.

## CHỐT 2026-06-25 (thầy duyệt)
1. **PageHeader** (back-link "Quay lại thử thách" vào slot `breadcrumb` như ChallengeView) — title = `requirement.title`, meta tuỳ chọn.
2. **Bên trái = LIST PHẲNG, KHÔNG card** (thầy: *"list no card"*) — list các lần thử: row có selected-state (bg accent, rounded) nhưng **KHÔNG viền bao ngoài, KHÔNG surface card** quanh nhóm. Mỗi row clickable (selectionMode single → push `?attempt=`). KHÔNG button bordered ad-hoc, KHÔNG bọc ListBox trong bordered container.
3. **Bên phải = HƯỚNG A** — **1 Card surface gói trọn**, findings = **hàng inset** (severity pill + text + src + suggestion), separator inset giữa rows, KHÔNG card-in-card.

## IA mới (chốt)
```
PageHeader (gap-10 ↓)            breadcrumb=back-link · title=requirement.title · (meta?)
└─ content (2-col, gap-6)
   ├─ LEFT  list phẳng "Các lần thử"  (w~64, KHÔNG card/viền; rows: Lần thử N · score · verdict · time-ago; selected = bg accent rounded)
   └─ RIGHT Card surface (A)          verdict chip + score + time + "Xem bài nộp"↗ · shortFeedback · findings (hàng inset theo severity)
```

## 2 hướng cho BÊN PHẢI (findings) — điểm cần thầy chọn (xem widget)
- **A (đề xuất) — 1 Card surface gói trọn, finding = hàng inset.** Verdict header + summary + findings là **hàng có separator inset** trong 1 surface (severity pill + text + src + suggestion). KHÔNG card-in-card → 1 surface sạch. Ref: GitHub Actions run detail · code-review panel. *Trade-off:* phải tách FeedbackCard thành "row" (frameless) — đụng FeedbackCard dùng chung ở modal (cần variant frameless).
- **B — Card verdict + finding-cards rời (2 tầng).** Verdict/summary trong 1 surface card; findings giữ nguyên FeedbackCard (bordered) gom theo nhãn severity quiet bên dưới. *Trade-off:* "card trong vùng" nhiều khối hơn, nhưng KHÔNG đụng FeedbackCard (an toàn, ít blast radius). Ref: LeetCode submission detail.

→ **Đề xuất A** (đúng tinh thần thầy "bên phải là 1 Card surface"); nhưng nếu muốn giữ FeedbackCard nguyên (đỡ đụng modal) thì **B**. Cần thầy chốt A/B.

## Sửa kèm (mọi hướng)
- Bỏ `uppercase` ở label "Các lần thử" + severity → sentence-case + `text-xs text-muted` ([[no-uppercase-text]] + eyebrow câm).
- Severity nhãn dùng màu token (danger/warning/muted), không uppercase.
- ListBox: HeroUI `ListBox` (`@heroui/react`) — selectionMode single, selectedKeys = attempt hiện tại, onSelectionChange → router push `?attempt=`.
- Card surface bên phải: `<Card><CardContent>` (1 nấc surface). Findings (hướng A) = hàng inset (như CheckListCard nhưng giàu hơn: severity + src + suggestion).
- Empty/loading/error: giữ AsyncContent (attempts rỗng → empty "chưa có lần nộp"; findings rỗng → "không có góp ý" = đạt sạch); skeleton mirror ListBox rows + Card.
- a11y: ListBox có `aria-label`; verdict chip có nhãn đạt/chưa.

## States
- **Loading**: ListBox skeleton rows + Card skeleton (verdict line + 3 finding rows).
- **Empty attempts**: ListBox empty "Chưa có lần nộp nào".
- **Empty findings (đạt sạch)**: Card hiện verdict đạt + "Không có góp ý nào — bài nộp đạt yêu cầu".
- **Error**: retry per query (attempts / feedbacks).

## Cần confirm
- `requirement.title` có field không (để làm PageHeader title)? Nếu không → fallback "Kết quả nộp bài" + challenge title.
- Chọn **A hay B** cho findings (A đụng FeedbackCard → thêm variant frameless; B giữ nguyên).

---

# Vòng 3 (2026-06-28) — "render thêm model + xấu quá" (redesign panel kết quả)

> Thầy đang ở panel kết quả (đã implement = Alert verdict + FeedbackCard bordered theo severity). Yêu cầu: (1) **render model đã chấm**, (2) **"xấu quá" → đẹp lại**. Ref-grounded: GitHub Checks · SonarQube Quality Gate · CodeRabbit (xem nguồn cuối doc).

## Phát hiện DATA quan trọng — model đã chấm KHÔNG có sẵn trong GraphQL
| Thứ | DB | GraphQL (FE đọc được)? | Nguồn |
|---|---|---|---|
| **Model ĐÃ PHỤC VỤ** (vd `qwen2.5-coder:7b`) | ✅ | ❌ | `CreditUsageHistoryEntity.model` (keyed by `attemptId`) |
| **Provider đã phục vụ** (gemini/openai/local) | ✅ | ❌ | `CreditUsageHistoryEntity.provider` |
| **Tier đã phục vụ** (low/med/high → Free/Eco/Bal/Premium) | ✅ (`recommendation`) | ❌ | `CreditUsageHistoryEntity.recommendation` |
| **Model user CHỌN** (`selectedModel`) | ✅ | ✅ | `UserChallengeSubmissionEntity.selectedModel` — **null khi Auto** |
| **Mode user chọn** (`selectedMode` auto/premium/byok) | ✅ | ✅ | `UserChallengeSubmissionEntity.selectedMode` |
| **Catalog model→tier** (`gradableModels`: model·provider·category·available) | ✅ | ✅ | query `aiModels.gradableModels` |

→ **Bài Auto (đa số, như screenshot) `selectedModel = null`** → từ data sẵn có chỉ biết "lane Tự động", KHÔNG biết model cụ thể đã chấm. Muốn hiện ĐÚNG model (qwen2.5-coder:7b) phải có BE.

### Kế hoạch hiển thị model (2 pha)
- **Pha 1 (FE-only, làm ngay, KHÔNG cần BE):** chip "lane" từ `selectedMode` (+ `selectedModel`/`provider` nếu có). Auto → "Tự động · Miễn phí" (lane + tier suy từ catalog). Trung thực — không bịa model.
- **Pha 2 (1 BE nhỏ, ĐÚNG model — ĐỀ XUẤT):** **denormalize `served_model` + `served_provider` (+ tier) lên `UserChallengeSubmissionAttemptEntity`**, set lúc grade-complete (cùng chỗ ghi `CreditUsageHistory`), expose `@Field` → FE render chip "Chấm bởi `qwen2.5-coder:7b` · Miễn phí" **per-attempt**. Pattern y `selected*` trên submission join. (Phương án khác: back-relation attempt→CreditUsageHistory, hoặc FE join `myCreditUsageHistory` theo `attemptId` — đều nặng/bẩn hơn denormalize 2 cột.)

## Mục tiêu vòng này
Đọc verdict + "model nào chấm" trong ≤3s; findings **quét nhanh** (bao nhiêu, nặng cỡ nào, ở file nào) thay vì "tường card đỏ"; model = tín hiệu TIN CẬY (ai chấm).

## 3 hướng (xem widget) — neo ref thật
- **A (ĐỀ XUẤT) — Quality-gate report.** Verdict là hero (điểm `0/100` to + pill đạt/chưa + "cần 80") · **model byline chip** ("chấm bởi `qwen2.5-coder:7b` · miễn phí · local") ngay dưới verdict · **dải đếm severity** ("3 cao · 0 TB · 0 thấp") để triage · findings = **LIST hàng gọn** (severity icon + 1 dòng + file chip + chevron mở detail/suggestion) thay cho card bự. Ref: **GitHub Checks summary · SonarQube Quality Gate · CodeRabbit**. Sửa đúng cái "xấu" = bỏ tường-card, score thành tâm điểm, model có chỗ tự nhiên. *Trade-off:* finding chuyển card→row (đụng FeedbackCard: thêm/đổi sang biến thể "row gọn + expand"; modal giữ card đầy đủ).
- **B — Score gauge + grouped cards.** Vòng điểm tròn (ring `0/100`) làm hero + model chip cạnh · GIỮ FeedbackCard bordered (siết padding + viền severity trái). Ít đụng nhất, gần hiện tại. *Trade-off:* vẫn là "nhiều card" — chỉ đẹp hơn chứ chưa đổi chất "tường card".
- **C — Review-thread annotations.** Header gọn (pill + model byline) · finding = annotation neo `file:line` + gợi ý dạng **suggestion-diff** (như GitHub suggestion). Dev-native, hợp khoá System Design. *Trade-off:* nặng nhất để dựng (suggestion-as-diff), `location` field hiện thưa (không phải finding nào cũng có file).

→ **Đề xuất A**: trị đúng "xấu" (wall-of-cards → list scannable + score hero), model chip vừa khít, đúng mental model "CI quality gate report" cho 1 challenge chấm repo. B nếu muốn blast radius nhỏ (giữ FeedbackCard). C nếu muốn cảm giác review-PR + chịu chi phí dựng.

## Section → data (hướng A)
| Section | Field |
|---|---|
| Verdict hero (điểm + đạt/chưa + ngưỡng) | `attempt.score` · `passThreshold*maxScore` |
| Model byline chip | **pha 1** `submission.selectedMode/selectedModel/selectedModelProvider` + catalog tier; **pha 2** `attempt.servedModel/servedProvider/servedTier` (BE mới) |
| Time + "Xem bài nộp" | `attempt.processedAt` · `attempt.submissionUrl` |
| Dải đếm severity | đếm `feedbacks[].severity` (high/med/low) |
| Findings list (row + expand) | `feedback.{severity,message,detail,location,suggestion}` |
| Rail "Các lần thử" | `attempts[].{attemptNumber,score}` (+ badge điểm nhỏ mỗi row) |

## States (giữ AsyncContent)
- Loading: verdict skeleton + 3 finding row skeleton + rail rows.
- Empty findings (đạt sạch): verdict đạt + "Không có vấn đề — bài nộp đạt yêu cầu" (EmptyContent), KHÔNG dải severity.
- Error: retry per query.

## Cắt / sửa kèm
- Bỏ "tường card đỏ" → list hàng (hướng A) — đây là phần "xấu" chính.
- Severity strip + per-finding file chip = grounded (`location` có khi có file).
- Verdict "Đạt 0/100" hiện đang mâu thuẫn (xanh "Đạt" + đỏ 0) — redesign cho điểm + verdict ĐỒNG NHẤT tông (0 điểm → tông đỏ "chưa đạt"); kiểm lại logic `isPassing` vs score (có thể là bug verdict, không chỉ visual).

## Nguồn (ref)
- GitHub Checks / quality gate UX, SonarQube Quality Gate, CodeRabbit PR review: https://docs.coderabbit.ai/tools/github-checks · https://sourcegraph.com/blog/automated-code-review-tools · https://lushbinary.com/blog/ai-code-review-tools-comparison-automated-pr-review/
- Rubric / AI-grading feedback UX (score per tiêu chí, severity, trust + human-oversight): https://8allocate.com/blog/how-to-build-rubric-based-ai-auto-grading-people-trust-and-adopt/ · https://www.timelygrader.ai/blog-articles/optimizing-ai-feedback-and-grading-suggestions

→ Thầy chốt hướng (A/B/C) + pha model (1 trước / làm luôn pha 2 BE) → `/starci-fe-ux-apply`.

---

# Vòng 4 (2026-06-28) — "không flex ấy" (bỏ layout 2 cột)

> Đã apply vòng 3 (Direction A) + gộp verdict/findings thành 1 card. Giờ thầy: *"không flex ấy"* = bỏ layout **2-cột flex** (rail "Các lần thử" trái `w-64` + detail phải). Pain THẬT: đa số submission chỉ **1 lần thử** → rail `w-64` ôm 1 item, **cột trái trống hoác**, detail bị bóp phải. Reuse inventory vòng 2/3 (không re-explore).

## Mục tiêu
1 cột dọc, kết quả full-width; chọn lần thử bằng selector GỌN trên đầu (không phí cột). Quét verdict các lần thử khi cần.

## 2 hướng (xem widget)
- **A (ĐỀ XUẤT) — Dải "lần thử" ngang trên đầu + kết quả full-width.** Các lần thử = **dải chip ngang** (newest-first, chip = "Lần thử N · điểm · ✓/✗", chọn được) ngay trên card kết quả; card kết quả chiếm **trọn chiều ngang**. 1 lần thử = 1 chip gọn (hết cột trống). Quét verdict mọi lần thử 1 phát. **Tabs/strip hợp khi ÍT lựa chọn + muốn so sánh** (ref). Ref: GitHub Actions run history · LeetCode "Submissions". *Trade-off:* nhiều lần thử (>~6) thì dải tràn → fallback dropdown (B) hoặc cuộn ngang.
- **B — Dropdown "lần thử" + kết quả full-width.** 1 dropdown chọn lần thử → card full-width. Gọn nhất, hợp khi NHIỀU lần thử. *Trade-off:* ẩn verdict các lần khác (cần click để so sánh) — kém khi muốn đối chiếu nhanh.
- **Khuyến nghị adaptive:** ÍT lần thử (≤ ~5) → **dải chip (A)**; nhiều hơn → **dropdown (B)**. Mặc định A vì đa số 1–vài lần thử + so-sánh-verdict là việc chính.

## Đổi gì (so với hiện tại)
- Bỏ `<div className="flex ... lg:flex-row">` (2 cột) → **1 cột dọc**: `[PageHeader]` → `[attempt selector]` → `[result card full-width]`.
- `aside w-64` ListBox dọc → **dải chip ngang** (hoặc `SegmentedControl`/tabs) — newest-first, selected = accent, mỗi chip có điểm + icon verdict (CheckCircle/XCircle).
- Result card (đã là 1 surface từ vòng trước) bỏ giới hạn cột, dùng `max-w` của trang (max-w-5xl) full-width.
- State: 1 lần thử → 1 chip (vẫn hiện, cho biết "lần 1"); 0 lần thử → empty "chưa có lần nộp".
- Mobile: dải chip cuộn ngang (`overflow-x-auto`) — đỡ hơn rail dọc.

## Section → data (không đổi nguồn)
| Section | Field |
|---|---|
| Attempt selector (chip/dropdown) | `attempts[].{attemptNumber, score}` + verdict suy từ score/threshold |
| Result card | như vòng 3 (score hero · servedModel chip · severity strip · findings list) |

## Nguồn (ref)
- Tabs vs dropdown (ít → tabs/strip để so sánh; nhiều → dropdown): https://www.eleken.co/blog-posts/tabs-ux · https://tiffanylinlin.medium.com/when-to-use-tab-views-vs-dropdowns-vs-radios-e02dd0790fb5 · https://baymard.com/blog/drop-down-usability

→ Thầy chốt A (dải chip) hay B (dropdown) hay adaptive → `/starci-fe-ux-apply`.

---

# Vòng 5 (2026-06-28) — "lần thử click mở DRAWER chọn"

> Đã apply vòng 4 (adaptive: ≤6 → dải chip, >6 → dropdown). Seed 8 lần thử → đang ra dropdown. Thầy: *"lần thử click rồi mở drawer chọn được không"* = thay **dropdown** (cho nhiều lần thử) bằng **DRAWER**.

## Vì sao drawer hợp (grounded)
- **Khớp [[when-drawer]]:** drawer = giấu danh sách PHỤ sau 1 label, mở ra chọn rồi quay lại luồng chính. Selector "các lần thử" (nhiều item) đúng pattern này — trigger `label + caret` mở drawer, chọn → đóng → xem kết quả.
- **Drawer có ĐẤT rộng hơn dropdown menu chật** → mỗi lần thử hiện GIÀU (verdict · điểm · model+tier · thời gian · số vấn đề) thay vì 1 dòng. Biến selector thành **"lịch sử nộp bài"** so sánh được. Ref: **Figma version history** (panel phải, list version + thời gian, chọn để xem) · GitHub Actions run history.
- **Placement:** `right` desktop / `bottom` mobile (`useSmViewpoint`) — block HeroUI `Drawer` repo đã có (`PaymentModal` · `ContentAiChatDrawer` · `E2eResultDrawer`). Nội dung dài → `ScrollShadow`.

## Giữ adaptive (đừng drawer cho mọi case)
- **≤6 lần thử → vẫn DẢI CHIP** (quét + so sánh tức thì, không cần mở gì). Drawer cho ÍT item = thừa 1 lần bấm.
- **>6 lần thử → trigger row "Lần thử N · điểm ▸" mở DRAWER** (thay dropdown). 1 affordance.

## 2 hướng nội dung drawer (xem widget)
- **A — Danh sách gọn:** mỗi hàng = Lần thử N · điểm · verdict (như dropdown nhưng thở hơn). Nhẹ, chọn nhanh. *Trade-off:* không tận dụng hết đất drawer (giống dropdown).
- **B (ĐỀ XUẤT) — "Lịch sử nộp bài" giàu:** mỗi hàng = verdict pill · điểm · **model + tier chip** · thời gian · **số vấn đề**. Quét tiến triển qua các lần (0→45→70→85→100), so sánh model/findings. Tận dụng đúng "đất" drawer (Figma-style history). *Trade-off:* nhiều dữ liệu hơn / mỗi hàng cao hơn (OK vì drawer cuộn được).

→ **Đề xuất B** (drawer rộng thì làm history giàu, không phí). Selected = highlight `bg-accent/10`. Header "Lịch sử nộp bài · N" + close. Trigger giữ verdict icon + điểm + caret.

## Section → data (không đổi nguồn)
| Phần | Field |
|---|---|
| Trigger row | selectedAttempt: `attemptNumber · score` + verdict icon |
| Drawer rows | `attempts[].{attemptNumber, score, processedAt, servedModel}` + verdict (score/threshold) + tier (catalog) + findings count (cần đếm feedbacks/attempt — xem nợ) |

## Nợ data (cho B)
- "Số vấn đề" mỗi lần thử = đếm `feedbacks` per attempt. Hiện `feedbacks` chỉ query cho attempt ĐANG CHỌN (`useQuerySubmissionResultFeedbacksSwr(selectedAttempt.id)`) → list không có count per-attempt. Cách: (a) BE thêm `feedbackCount` (hoặc `highFindings`) vào `UserChallengeSubmissionAttemptEntity` (denormalize, rẻ) → hiện ngay; hoặc (b) bỏ "số vấn đề" khỏi drawer (chỉ verdict+điểm+model+time) cho pha 1, thêm sau. **Pha 1 = bỏ count (B nhẹ); pha 2 = BE thêm count.** (A không cần count.)

## Nguồn (ref)
- Figma version history (right-side panel, list + timestamp, select to view): https://help.figma.com/hc/en-us/articles/360038006754-View-a-file-s-version-history · https://designcode.io/figma-handbook-version-history/

→ Thầy chốt A (list gọn) hay B (history giàu) + count pha 1/2 → `/starci-fe-ux-apply`.

---

# Vòng 6 (2026-06-28) — feedback annotate: labeled cards + drawer card-list + pagination + Button trigger

> Thầy soi bản đã apply (B), annotate 4 điểm. Map thẳng vào block/rule có sẵn (không design mới).

## 4 thay đổi (đã chốt hướng — chỉ chờ apply)
1. **BỎ nhãn "Các lần thử"** (`<Label>`). Selector tự nói (chip "Lần thử N" / Button "Lần thử N"). → xoá Label ở cả 2 nhánh (chip strip + trigger).
2. **Trigger (>6 lần thử) = HeroUI `Button` THẬT**, không `<button>` tự chế. `variant="secondary"` (hoặc `tertiary` — nút lẻ đứng 1 mình, [[button-variant-secondary-pairs-primary-else-tertiary]]) + leading verdict icon + "Lần thử N · điểm" + `CaretRightIcon`. Mở drawer.
3. **Result card → TÁCH thành nhiều `LabeledCard` nhỏ** (label NGOÀI card — [[elements/card]] §2), thay 1 surface to gộp dividers:
   - **LabeledCard "Kết quả"**: score hero (điểm + đạt/chưa + cần N) + model byline (`Chip` chấm bởi + `AiCategoryChip` tier) + time + "Xem bài nộp"↗.
   - **LabeledCard "Góp ý"**: severity strip + findings list (FindingRow). Rỗng (đạt sạch) → empty-state TRONG card ([[frameless-section-empty-state-needs-card]]).
   - 2 LabeledCard cách `gap-6`, mỗi cái nhãn riêng → đọc ra "2 vùng" (đúng [[concepts/card]]: 2 vùng ngang hàng có nhãn riêng = OK, không phải "2 box dính").
4. **Drawer list = accordion-like CARD LIST (surface-in-surface = border) + PAGINATION**:
   - List = block **`SurfaceListCard`** (1 surface bounded, `bg-surface` + **border** vì nằm trong drawer-surface — [[surface-in-surface-inner-has-border]]) + rows = **`SurfaceListCardItem`** interactive (`onPress` → select + đóng drawer), separator inset (da accordion-card — [[elements/card]] §3c).
   - **`Pagination`** căn TRÁI dưới list (HeroUI Pagination + hover/cursor — [[list-pager-left-align-and-hover]]), client-side slice (~6 lần thử/trang); ẩn khi ≤1 trang; reset trang khi mở lại.

## Block/rule map (cho apply)
| Phần | Block / rule |
|---|---|
| Bỏ nhãn selector | xoá `<Label>` |
| Trigger | HeroUI `Button` ([[button-variant-secondary-pairs-primary-else-tertiary]]) |
| Result split | 2× `LabeledCard` ([[elements/card]] §2) + gap-6 ([[concepts/card]]) |
| Findings empty | `AsyncContent` empty trong LabeledCard ([[frameless-section-empty-state-needs-card]]) |
| Drawer list | `SurfaceListCard` + `SurfaceListCardItem` interactive ([[elements/card]] §3c) + border ([[surface-in-surface-inner-has-border]]) |
| Pagination | HeroUI `Pagination` căn trái ([[list-pager-left-align-and-hover]]) — client-side slice |

## i18n thêm
`submissionResult.resultLabel` ("Kết quả") · `submissionResult.feedbackLabel` ("Góp ý") (vi+en).

## Giữ nguyên
- Chip strip (≤6 lần thử) — thầy không động tới (selector ít item vẫn chip ngang); chỉ bỏ Label.
- Score hero hand-rolled (đã hỏi: giữ hero hay đổi `Score` canonical — chờ thầy).

→ Thầy "xúc" → `/starci-fe-ux-apply` dựng 4 thay đổi.

## ✅ ĐÃ ÁP DỤNG 2026-06-28
- Bỏ `<Label>` "Các lần thử"; trigger (>6) = HeroUI `Button`; result = 2 `LabeledCard` ("Kết quả" + "Góp ý").
- **Góp ý = LABELED ACCORDION CARD** (thầy chốt thêm): `LabeledCard` + HeroUI `Accordion variant="surface"` + border (surface-in-surface), mỗi finding = `Accordion.Item` (expand → detail/location/suggestion). Bỏ severity-strip + FindingRow.
- Drawer = `SurfaceListCard` + `SurfaceListCardItem` (rows bấm được) + `Pagination` (client-side, 6/trang, ẩn khi 1 trang).
- **Sparkle "chấm bởi" = `size-5 text-accent`** (thầy chốt). `ModelByline`/`VerdictIcon` helper dùng chung (result + drawer).
- tsc + eslint + JSON sạch. Rút rule → `.claude/rules/drafts/grading-result-page-labeled-cards-verdict-hero-findings-accordion.md` + `attempt-history-selector-adaptive-and-grading-model-chip.md`.
- **CHƯA chốt:** score hero (số to hand-rolled) giữ hay đổi `Score` canonical — chờ thầy.
