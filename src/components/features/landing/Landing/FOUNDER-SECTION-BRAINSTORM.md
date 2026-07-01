# UX Brainstorm — Founder section "Vì sao có StarCi" (landing §5)

> `/starci-fe-ux-brainstorm` · 2026-06-26 · `FounderManifesto` block dưới `SectionHeading` (eyebrow "Làm công khai"). Thầy: *"trang này trống quá"*. KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.

## Pain
- **1 card hẹp giữa canvas tối rộng** → trống hoác (heading căn giữa trôi xa card; ambient sparks càng làm thưa).
- **Lời hứa bị TELL, không SHOW:** body2 = *"Mọi thứ đều làm công khai — đọc ghi chú kỹ thuật và TỰ ĐÁNH GIÁ chất lượng"* nhưng section KHÔNG show 1 artifact công khai nào (không blog, không activity, không hệ thống). Hứa "build in public" mà không có bằng chứng = section yếu nhất nhưng đang trống nhất.

## Mục tiêu section (≤10s)
Khách tin **founder là CTO thật, ship thật, dạy thứ thật** + thấy "đi mà kiểm được". = credibility qua BẰNG CHỨNG/giọng thật, KHÔNG vanity.

## Ref (web)
- **Founder landing = narrative editorial**, dẫn bằng "emotional truth" trước khi xin commit; long-form/magazine, không feature-walkthrough. ([rocket.new founder template](https://www.rocket.new/templates/startup-premium-founders-landing-page-template))
- **Build-in-public** = show progress/wins/setback real-time (proof of activity). ([buildinpublic guide](https://github.com/buildinginpublic/buildinpublic))
- **Solo-founder credibility** = nêu qualification + VÌ SAO nó quan trọng VỚI NGƯỜI HỌC (lợi ích học từ practitioner thật). ([Indie Hackers](https://www.indiehackers.com/post/tips-for-or-examples-of-solo-founder-about-pages-3976ea7d68))
- Memory/rules: [[landing-grounded-real-courses-and-systems]] (grounded, không bịa) · [[concepts/card]] · [[no-uppercase-text]] · [[course-home-no-duplicate-surfaces]] (đừng lặp section "systems" đã có ở trên).

## Data thật khả dụng
| Nguồn | Hook | Trạng thái |
|---|---|---|
| Platform stats (learners/lessons/courses) | `useQueryPlatformStatsSwr` | ✅ public (nhưng đã có StatStrip riêng → đừng lặp) |
| Hệ thống/capstone thật | i18n curated từ curriculum | ✅ (nhưng đã là section "systems" phía trên → đừng lặp) |
| Founder GitHub/blog link | i18n | ✅ có (chỉ là link) |
| **Blog posts (ghi chú kỹ thuật)** | `useQueryBlogPostsSwr` | ❌ FE hook CHƯA wire (defer — [[landing-hero-split-visual-and-catalog-early]]) |
| **Founder contribution activity** (heatmap) | `useQueryUserContributionCalendarSwr(founderUserId)` | ⚠️ cần founder userId + xác nhận query chạy public (chưa chắc) |
→ Bằng chứng "live" mạnh nhất (blog/activity) **chưa wire** → A dựng được ngay, B cần data.

## 3 hướng (xem widget)
### Hướng A — Founder letter (editorial) ✦ ĐỀ XUẤT (dựng ngay, 0 data mới)
- Lấp bằng **câu chuyện có sức nặng**, không widget: 1 **thesis sắc** (serif, lớn) — vd *"Mọi khóa dạy CRUD. Mình dạy thứ làm sập production rồi dựng lại."* + ảnh + 2 nhịp body + link **"đừng tin, đi mà kiểm"** (GitHub/blog thành CTA chứng cứ). Editorial rhythm, giọng practitioner đã có sẵn trong copy.
- **Chốt vì**: trị đúng "trống" bằng nội dung THẬT (không bịa data), đúng ref "founder = editorial narrative", on-brand giọng opinionated. Build ngay.
- Trade-off: vẫn là copy — "show proof" chỉ ở mức link (chưa nhúng artifact).

### Hướng B — Build-in-public, SHOW bằng chứng (mạnh nhất, cần wire)
- Founder gọn + **dải artifact THẬT**: activity heatmap (founder ship đều) · ghi chú kỹ thuật mới nhất (blog) · "đã dựng N hệ thống". Giữ ĐÚNG lời hứa body2.
- Trade-off: cần `useQueryBlogPostsSwr` (chưa có) + founder activity (cần userId + public query). **Nợ data** → defer tới khi wire. KHÔNG bịa data giả ([[landing-grounded...]]).

### Hướng C — Authority 2-cột
- Ảnh founder LỚN (3:4) trái + lưới credential phải (ship gì · dạy gì · kiểm ở đâu). Cân khổ rộng, dễ quét.
- Trade-off: boxy, ít chất editorial/soul; credential lưới đọc hơi "CV".

## Đề xuất chốt
**A ngay** (editorial letter — trị trống bằng story thật, 0 data, đúng ref). **Mở đường B** khi wire xong `useQueryBlogPostsSwr` + founder activity → nâng từ "kể" lên "show bằng chứng" (đúng nhất với "làm công khai"). C là phương án giữa nếu thầy thích ảnh-lớn/credential-grid.

## States / a11y
- A: ảnh founder có `alt`; thesis là `<blockquote>`/Typography serif; link GitHub/blog là `<a>` rõ. Không data → không loading/empty.
- B (sau): mỗi artifact-card `AsyncContent` (skeleton/empty/error riêng); ẩn card nào data rỗng (đừng để ô trống).
- Layout: card rộng hơn / 2-cột để hết "1 card hẹp giữa canvas"; cân nhắc giảm khoảng heading↔card (gap-24 landing nhưng card cần "nặng" hơn).

## Sau khi thầy chốt
`/starci-fe-ux-apply`: A = viết lại `FounderManifesto` (thesis serif + nhịp + link CTA) + i18n copy mới; cân lại layout cho hết trống. Rút nguyên tắc ("section hứa build-in-public phải SHOW artifact, không chỉ claim") → `.claude/rules/drafts/`.

---

# VÒNG 2 (2026-06-26) — REDESIGN theo tông RAW-TRUTH (thầy: *"nghiên cứu và redesign cơ"*)

## Đổi định vị
Thầy chốt tông **"bóc trần sự thật"** (eyebrow "Góc khuất nghề code" · title "Sự thật trần trụi về ngành IT"). → KHÔNG còn là founder-bio lịch sự; section giờ phải **bóc trần** = SHOW các sự thật phũ, founder = giọng ký tên. Vòng-1 A (1 thesis + card bio) chưa đủ — vẫn đọc như "bio có 1 câu mạnh".

## Ref (web)
- Genre "brutal truth về bootcamp" rất resonant: chứng chỉ ≠ việc làm, junior market khắc nghiệt, *"glorified YouTube tutorials"*, tutorial hell. ([Medium "brutal truth bootcamps"](https://medium.com/@MikeyJaay/the-brutal-truth-about-coding-bootcamps-what-they-dont-want-you-to-know-4fee415e6476) · [SheCanCode](https://shecancode.io/the-truth-about-coding-bootcamp/) · [Noble myths](https://www.nobledesktop.com/blog/coding-bootcamp-myths-debunked))
- Nguyên tắc: anti-marketing/manifesto thắng khi **NÊU sự thật cụ thể + chứng minh mình khác**, KHÔNG strawman. Mỗi "truth" phải neo bằng chứng (đừng chỉ chê đối thủ).

## 3 hướng (xem widget)
### Hướng A — Danh sách SỰ THẬT, mỗi cái → 1 cơ chế THẬT của StarCi ✦ ĐỀ XUẤT
- Section = title + **3–4 sự thật phũ**, MỖI cái = câu phũ (đậm) + dòng *"→ StarCi làm gì về nó"* (neo bằng chứng). **Founder = byline ký tên** dưới cùng (ảnh nhỏ + tên + CTO + GitHub/Blog), KHÔNG còn card bio chiếm spotlight.
- **Map truth → feature THẬT** (grounded, không bịa):
  | Sự thật phũ | Neo vào (cơ chế thật) |
  |---|---|
  | Chứng chỉ không cứu lúc production sập 3h sáng | Challenge + **AI chấm gắt**, pass mới qua (không cấp chứng chỉ dễ) |
  | 100 bài CRUD vẫn chưa phải kỹ sư | **Capstone hệ thống thật** (20 đồ án/khóa — số THẬT từ curriculum) |
  | Đa số khóa = YouTube thu phí | **Làm công khai** — đọc ghi chú kỹ thuật, tự đánh giá |
  | (option) Junior market khắc nghiệt — chỉ kỹ năng thật sống | Rèn đúng thứ production yêu cầu |
- **Chốt vì**: "bóc trần" thành CẤU TRÚC (show, không claim); mỗi truth có bằng chứng → không sáo/không strawman; founder thành **người dám nói thẳng** (uy tín hơn bio); lấp section đầy + đúng tông. Reuse "✕ truth → fix" = pattern myth-vs-reality đã chứng minh.
- Trade-off: copy phải sắc (curated i18n) — viết dở thành "chê đối thủ rẻ tiền". Cần thầy duyệt từng câu truth.

### Hướng B — Thư founder raw (prose)
- Lá thư dài giọng phũ + ảnh + chữ ký. Soul cao, nhưng "1 khối chữ" → rủi ro vẫn trống/khó quét. (Chính là vòng-1 A nối dài.)

### Hướng C — "Lời hứa ↔ Sự thật" (contrast 2 cột)
- Trái "Điều họ bán" (gạch ngang, mờ) · phải "Sự thật ở StarCi". Mạnh thị giác nhưng dễ **strawman/gimmick** (chê đối thủ ảo) — ref cảnh báo tránh.

## Đề xuất chốt
**A** — danh sách sự thật neo bằng chứng + founder ký tên. Đúng tông "bóc trần" + grounded + lấp đầy + nâng founder thành "người nói thẳng". B nếu thầy thích prose-letter; C nếu thích contrast (nhưng cảnh báo gimmick).

## Data / grounding
- Truth copy = **i18n curated** (thầy duyệt từng câu). Số "20 đồ án" = THẬT từ curriculum ([[landing-grounded-real-courses-and-systems]]). Challenge+AI-grading, build-in-public = feature thật. KHÔNG bịa số/claim.
- Founder identity thật (ảnh, CTO, GitHub/blog).

## States / a11y
- Mỗi truth row = `✕` (danger, `aria-hidden`) + statement (`<p>` đậm) + fix (muted). List `<ul>`/stack `gap-4`. Founder byline `border-t` cuối.
- Layout: truths là HERO (lấp section), founder thu thành byline → hết "card bio trống giữa canvas". Card rộng/đủ cao tự nhiên.
- Tông phũ nhưng KHÔNG chửi đối thủ đích danh (nói "đa số khóa", không tên).

## Sau khi thầy chốt
`/starci-fe-ux-apply`: viết lại `FounderManifesto` (hoặc block mới `TruthList` + founder byline) — truth rows + map fix + byline; i18n 3–4 truth (vi+en, thầy duyệt). Rút nguyên tắc ("section định-vị-bằng-sự-thật phải neo mỗi claim vào bằng chứng thật, founder = byline không phải spotlight") → drafts.
