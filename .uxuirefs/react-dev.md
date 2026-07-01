# react.dev — docs reading (sidebar tree + on-this-page chuẩn)

> Docs học chuẩn mực, sạch, interactive. Pull 2026-06-18. Tham khảo cho **khu Đọc bài StarCi** (3 cột).

## Pattern lấy được
**Sidebar TRÁI:** cây phân cấp course>section>lesson, **collapse từng section**, **active highlight** dòng đang xem.
**On-this-page PHẢI:** sticky list jump-link tới mọi H2 (hash anchor) — đúng cái StarCi vừa làm.
**Content:** breadcrumb (Overview>Learn>Quick Start); **reading width ~600–800px**; hierarchy H1 title / H2 anchor /
intro callout `<YouWillLearn>` (mục tiêu bài — giống `outcomes`).
**Code:** syntax-highlight + **highlight dòng** (`{5}`); **Sandpack runnable** (editor + live result); CSS kèm JS.
**Flow:** **prev/next pager** ("Next Steps" → bài kế); CTA "Check out the Tutorial".
**Microcopy:** callout "Notice how…"; **bold thuật ngữ lần đầu** (components/JSX/props) — giống convention bold của StarCi;
"You'll get two things from useState:" + bullet kỳ vọng.

## → Áp cho StarCi
- On-this-page + sidebar tree + prev/next: StarCi đã có → **react.dev là chuẩn để soi tinh chỉnh** (active state, collapse, width).
- **"YouWillLearn" callout đầu bài** = StarCi có field `outcomes` (BE) NHƯNG **chưa expose FE** → cơ hội: render "Bạn sẽ nắm được" đầu bài như react.dev.
- **Highlight dòng code** + Sandpack runnable: StarCi có Sandpack → học cách present code-tabs + line-highlight.
- **Bold thuật ngữ lần đầu**: StarCi đã có convention (fs-keyword-bold) → react.dev validate.
- Reading width 600–800px (StarCi đang max-w-[1024px] — cân nhắc hẹp lại cho dễ đọc).
