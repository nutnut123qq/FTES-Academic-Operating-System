# UX Brainstorm — Trang `/contact` (Liên hệ)

> ✅ **APPLIED 2026-06-18** (`/ux-apply`): feature mới `features/contact/Contact` (Header + ContactChannels
> + FounderCard + ContactForm + ContactFaq) + block `PageContainer` + BE mutation `submitContact` (Brevo).
> Legacy `layouts/marketing/Contact` đã xoá. tsc/eslint sạch. **Cần restart BE** để mutation live.

> Brainstorm, KHÔNG code. Ground vào BE/DB thật (3 Explore agent). Legacy chỉ là inventory.

## 0. Sự thật nền (đã verify code, không đoán)

**Backend:**
- ❌ KHÔNG có entity/mutation contact / support / lead / feedback / inquiry. Zero contact backend.
- ✅ **Hạ tầng email CÓ SẴN**: Brevo SMTP + BullMQ `SendMailPayload` + `EnqueueSendMailJobService`
  (`src/modules/bussiness/jobs/enqueue/send-mail.service.ts`). → thêm 1 mutation `submitContact` enqueue
  mail job là **gửi thật được, công ít**.
- ✅ Notification realtime (`NotificationService.createNotification`) → có thể ping admin/founder.
- ✅ `userProfile(username)` public → founder account `starci183` (nếu có + đã điền) cho mini-card thật.
  `UserEntity` giàu field public: `email, displayName, bio, roleTitle, location, linkedinUrl, websiteUrl,
  githubUsername, workMode, openToWork`.
- ✅ Membership ($5/th, cộng đồng) + discussion + follow graph → route "nhờ cộng đồng".
- ⚠️ `systemConfig` query có (chỉ threshold challenge/task/AI) — mở rộng được cho social links nhưng CHƯA có.
- ❌ KHÔNG Discord integration, KHÔNG founder/team entity, KHÔNG FAQ entity, KHÔNG social-links config.

**Frontend hiện tại (`layouts/marketing/Contact`, legacy):**
- 2 cột: trái "Get in Touch" + 2 channel card (email/phone) + Support Hours; phải = **FORM GIẢ (không submit)**.
- 🔴 **Form không gửi đi đâu** — vi phạm lớn nhất: trang contact mà bấm gửi không làm gì.
- 🔴 **Toàn English hardcode** trên site `vi/` (Get in Touch, First/Last Name, Send Message…). 0 i18n key contact.
- 🔴 Style ngoài design system: `glass`, `brand-blue/dark`, `bg-white/5`, `border-white/10`, `rounded-[40px]`,
  `<input>/<select>/<textarea>/<button>` thô → **dark-only, vỡ ở light**. Icon `@gravity-ui` (deprecated).
- 🔴 **Dữ liệu placeholder**: phone `+(84) 969 998 024`, "giờ hỗ trợ Mon-Fri 9-6" — bịa cho founder-led solo.
- Founder = ManifestoSection (landing) để TODO tên/ảnh/social. Không footer. FAQ landing 5 câu (chỉ VI).

## 1. Mục tiêu trang (purpose trước pixel)

Trong ≤30s, đưa **đúng người tới đúng kênh** + đặt **kỳ vọng trung thực** (bao lâu được trả lời) + **tự phục
vụ** (FAQ) trước khi phải liên hệ. Phản ánh bản chất **founder-led + cộng đồng**, KHÔNG phải "our team" vô danh.

**4 nhóm khách → ý định:**
1. Học viên tiềm năng ("hợp với tôi? giá? có hiệu quả?") → FAQ + cộng đồng + câu chuyện founder.
2. Học viên đang học gặp vấn đề (thanh toán / truy cập / bug / hỏi bài) → kênh hỗ trợ (email/cộng đồng) nhanh.
3. Đối tác / tuyển dụng / báo chí → liên hệ founder/business (email, LinkedIn).
4. Tò mò về founder → profile founder / manifesto.

## 2. Nguyên tắc áp (mindset + ui-ux-pro-max)
- **KHÔNG form giả.** Form contact mà không gửi = phá vỡ niềm tin. Hoặc wire thật, hoặc bỏ form route kênh thật.
- **KHÔNG bịa dữ liệu.** Phone/giờ-hỗ-trợ chưa xác thực → cắt. Chỉ hiện cái THẬT + routable.
- **1 primary action** rõ. Empty/loading/error + a11y từ đầu. i18n 100% (vi+en). Style ở blocks/globals.
- **Trung thực kỳ vọng**: nói rõ "thường trả lời trong X" thay vì "giờ làm việc" công sở giả.

## 3. Ba hướng

### Hướng A — "Channel router" (bỏ form, route kênh thật)
Trang = các thẻ "chọn đường theo ý định": Hỗ trợ khoá/tài khoản → email + cộng đồng (nhanh nhất); Hợp tác/
tuyển dụng → email founder + LinkedIn; Gặp founder → mini-card từ `userProfile(starci183)` + social; FAQ
accordion (reuse landing) để deflect. + 1 dòng "thường trả lời trong 24h".
- **Lợi**: trung thực 100%, **ship hôm nay, 0 BE**. Mỗi thẻ 1 primary.
- **Hại**: không bắt được message in-app (phụ thuộc mail client của khách); ít "chất" thương hiệu.

### Hướng B — "Working contact form" (wire vào mail infra có sẵn) ⭐
Form THẬT: mutation `submitContact(name,email,category,message)` → `EnqueueSendMailJobService` (Brevo) → hộp
thư founder + (option) notification admin. Form i18n + HeroUI + react-hook-form + zod (rule `/fe` form),
category selector (Hỗ trợ khoá / Hợp tác / Chung), đủ success/error/loading. Cột trái = kênh thật (email hỗ
trợ, cộng đồng "nhờ giúp nhanh hơn", founder mini-card) + dòng kỳ vọng + FAQ deflect.
- **Lợi**: trang contact **làm đúng việc cốt lõi** (gửi được message). Vẫn trung thực + có route kênh.
- **Hại**: cần thêm **1 mutation BE nhỏ** (resolver + handler enqueue mail) — hạ tầng sẵn, công thấp.

### Hướng C — "Founder-led / community-first" (đậm cá tính)
Dẫn bằng founder (giọng manifesto) + đường dây trực tiếp tới thầy, rồi cộng đồng là "nhờ giúp nhanh", form/
email chỉ là fallback. Phản ánh thương hiệu (manifesto, câu chuyện founder) thay vì "Get in Touch" generic.
- **Lợi**: rất đúng chất StarCi (thầy starci183 + cộng đồng), khác biệt hẳn contact generic.
- **Hại**: **phụ thuộc founder identity là THẬT** (hiện TODO placeholder) — cần thầy điền profile/social trước.

## 4. Hướng CHỐT ✅ (thầy duyệt): **B + skin của A** — form thật + route theo ý định
> Thầy chốt 2026-06-18: **Hướng B**. **GIỮ phone + giờ hỗ trợ** (thầy có số/giờ THẬT → cần điền giá trị thật,
> KHÔNG cắt như đề xuất ban đầu).


Lý do: lỗi gốc của trang hiện tại là *form không gửi được* → fix cốt lõi là làm nó **gửi thật** (hạ tầng mail
đã sẵn, chỉ thiếu 1 mutation). Bọc quanh bằng kênh thật + FAQ deflect (hướng A) để trung thực và không phụ
thuộc founder-identity-placeholder (hướng C để dành khi thầy điền profile thật).

**IA mới (2 cột, mobile xếp dọc):**
- **Header**: tiêu đề "Liên hệ" + 1 câu intro thật (founder-led) + dòng kỳ vọng "thường trả lời trong ~24h".
- **Cột trái — "Chọn cách nhanh nhất"** (route theo ý định, mỗi mục 1 hành động):
  - **Hỗ trợ khoá học / tài khoản** → cộng đồng (nhanh nhất, peer) + email hỗ trợ.
  - **Hợp tác / tuyển dụng / báo chí** → email + LinkedIn founder.
  - **Founder mini-card** (nếu `userProfile(starci183)` có): avatar/displayName/roleTitle/bio + link profile + social.
  - **FAQ deflect**: 3–5 câu hay gặp (reuse FaqSection, i18n hoá) → bớt phải liên hệ.
- **Cột phải — Form THẬT**: name, email, category (Hỗ trợ/Hợp tác/Chung), message → `submitContact` → mail.
  Success state rõ ("Đã gửi, sẽ phản hồi qua email"), error retry, button loading.
- **CẮT**: phone bịa, bảng "giờ hỗ trợ" công sở bịa, mọi English hardcode, glass/brand-*/input thô, gravity icon.

## 5. Map section → dữ liệu BE/DB

| Section | Nguồn dữ liệu thật | Trạng thái |
|---|---|---|
| Form submit | **mutation `submitContact` MỚI** → `EnqueueSendMailJobService` (Brevo) | ⚠️ cần build (infra sẵn) |
| Email hỗ trợ | `hello@starci.academy` (hardcode/i18n) | ✅ cần thầy xác nhận thật |
| Cộng đồng route | Membership + discussion (link `/blog` premium / cộng đồng) | ✅ có |
| Founder mini-card | `userProfile("starci183")` → avatar/displayName/roleTitle/bio/linkedinUrl/websiteUrl/githubUsername | ⚠️ phụ thuộc account đã điền |
| FAQ | reuse `FaqSection` (landing) — i18n hoá EN | ✅ có (cần dịch) |
| Kỳ vọng phản hồi | text tĩnh (i18n) | ✅ |
| Phone + giờ hỗ trợ | **GIỮ** (thầy có số/giờ thật) — i18n hoá giá trị thật | ⚠️ cần thầy cấp giá trị thật |

## 6. States + a11y (tính từ đầu)
- **Form**: idle → submitting (button `isPending`) → success (panel xác nhận + reset) → error (giữ nội dung +
  retry, toast). Validate zod inline (email hợp lệ, message tối thiểu). Tất cả i18n.
- **Founder mini-card**: `AsyncContent` (loading skeleton UserCell · empty = ẩn nếu account chưa có · error = ẩn).
- **a11y**: form có `<label>` gắn `htmlFor`, error `aria-describedby`, focus ring, nút ≥44px, heading đúng cấp
  (h1 trang → h2 section). Contrast ở cả light/dark (token, không white/10).

## 8. DỮ LIỆU THẬT đã chốt ✅ (nguồn sự thật cho /ux-apply, 2026-06-18)

| Field | Giá trị thật |
|---|---|
| Email hỗ trợ / nơi nhận form | `cuongnvtse160875@gmail.com` (form gửi tới đây; reply-to = email người gửi) |
| Phone | `0828678897` |
| Giờ hỗ trợ | T2–T6, 9:00–18:00 (Mon–Fri 9–6) |
| Facebook | https://www.facebook.com/starci183 |
| LinkedIn | https://www.linkedin.com/in/stacy-nguyen-375b41324/ (founder: Stacy Nguyen) |
| GitHub | https://github.com/starci183 |

**Social = STATIC config 3 URL trên** (không lấy từ `userProfile` — `UserEntity` thiếu `facebookUrl`; và
khỏi phụ thuộc account đã điền). Founder mini-card có thể *enrich* avatar/displayName/bio từ
`userProfile("starci183")` sau, optional. Đặt 6 giá trị trên vào **constants + i18n**, KHÔNG hardcode rải rác.

### FAQ — quyết: FAQ contact-specific (deflect lý do liên hệ), KHÔNG bê FAQ phễu landing
5 câu song ngữ, nhắm đúng việc người ta hay liên hệ → bớt phải gửi form:
1. **Bao lâu được phản hồi?** → thường trong ~24h, trong giờ hỗ trợ T2–T6 9–18h.
2. **Không đăng nhập được / quên mật khẩu?** → cách reset; vẫn kẹt thì gửi form/email kèm email tài khoản.
3. **Vấn đề thanh toán / hoàn tiền?** → email hỗ trợ kèm mã giao dịch.
4. **Hợp tác / tuyển dụng học viên?** → email + LinkedIn founder.
5. **Câu hỏi về khoá học / có hợp với tôi?** → **link xuống FAQ landing** (phễu) thay vì lặp lại ở đây.

→ cross-link sang FaqSection landing cho nhóm câu "nên mua không", tránh trùng nội dung.

## 7. Trạng thái quyết định
- ✅ Hướng = B (form thật + route kênh). ✅ Phone+giờ = GIỮ (thật). ✅ Email/Phone/Social/FAQ = đã chốt (§8).
- 📌 **BE còn lại**: Hướng B cần mutation `submitContact(name,email,category,message)` →
  `EnqueueSendMailJobService` (gửi tới `cuongnvtse160875@gmail.com`, reply-to = email người gửi). Build ở
  repo backend (1 resolver + 1 handler enqueue). `/ux-apply` lo FE; trước khi wire có thể stub.
