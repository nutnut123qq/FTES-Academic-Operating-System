# Design
- Fix ở COMPONENT (không ở overview hook): component đã có subject.uuid qua useQuerySubjectSwr; overview hook chỉ có code. Dùng useQuerySubjectFeedSwr (đã map SubjectPost) — gate tới khi uuid resolve.
- scope "forYou" = post môn MỚI NHẤT (BE api). slice N=5.
- overview.posts/pinnedPost giữ nguyên (vestigial, luôn rỗng) — không đụng hook để tối thiểu diff.
