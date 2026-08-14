/**
 * Pure mapping between the career REST payloads and the skill-graph view model.
 *
 * Sources: `GET /api/v1/career/skills` (`{skills[], relations[]}`) and
 * `GET /api/v1/career/me/skills` (`SkillProgress[]`). The BE has no notion of the six
 * UI "domains" — it stores a free-form `category` (`LANGUAGE`, `FRAMEWORK`,
 * `DATABASE`, …) — so {@link domainForCategory} folds it into the palette's domains.
 * Mastery comes from the learner's `level` normalised by the skill's own `levels`
 * ladder (a 2-level skill at level 2 IS mastered).
 *
 * The relations rows are read tolerantly: the BE serves them straight from a
 * `JdbcTemplate.queryForList` (`skill_id` / `related_id` / `relation`) while the shared
 * FE client type declares camelCase, so both spellings are accepted.
 *
 * ## Hợp đồng "mở khoá" — ĐANG ĐƯỢC BE BỔ SUNG, đọc KHOAN DUNG
 *
 * BE sẽ trả thêm ba trường cho mỗi kỹ năng (trên hàng catalogue `skills[]` và/hoặc
 * hàng tiến độ `me/skills[]`):
 *
 * - `unlocked` (boolean) — kỹ năng đã mở hay chưa,
 * - `unlockPercent` (0–100) — tiến độ tới ngưỡng mở khoá,
 * - `sources[]` (`{courseId, courseTitle, completionPercent, weight}`) — các khoá dạy
 *   kỹ năng đó cùng % hoàn thành của người học.
 *
 * HÔM NAY chưa trường nào tồn tại (bảng `career.skill_subject_map` chỉ map theo MÔN và
 * chỉ có 2 dòng seed trỏ UUID không có thật), nên mọi hàm dưới đây phải chạy đúng khi
 * chúng vắng mặt: `sources` rơi về `[]`, `unlockPercent` về `null`, `unlocked` suy ra từ
 * `level > 0`. UI đọc đúng cái đó và hiện "chưa gắn khoá học" thay vì số bịa. Cả hai
 * cách viết camelCase lẫn snake_case đều được chấp nhận (đúng tiền lệ
 * {@link readRelation}) vì BE serve nhiều bảng bằng `JdbcTemplate.queryForList`.
 */
import type { CareerSkill, CareerSkillProgress } from "@/modules/api/rest/career"

/** Career domain a skill belongs to (§21 roadmap clusters). */
export type SkillDomain = "be" | "fe" | "mobile" | "ai" | "data" | "devops"

/** Mastery status of a skill node. */
export type SkillStatus = "locked" | "learning" | "mastered"

/** Kind of link between two skills. */
export type SkillEdgeKind = "prerequisite" | "related"

/**
 * Một khoá học dạy kỹ năng này (phần tử của `sources[]` mà BE đang bổ sung).
 *
 * `completionPercent` là % người học đã hoàn thành KHOÁ đó — không phải mức thành thạo
 * kỹ năng; UI phải nói rõ thanh tiến độ đang đo cái nào.
 */
export interface SkillSource {
    /** Định danh khoá (dùng làm key React khi không có slug). */
    courseId: string
    /** Tên khoá hiển thị; rỗng khi BE chưa trả (UI rơi về `courseId`). */
    courseTitle: string
    /** Slug điều hướng `/courses/{slug}`; mặc định bằng `courseId`. */
    courseSlug: string
    /** % hoàn thành khoá của người học, 0–100. */
    completionPercent: number
    /** Ngưỡng % của khoá cần đạt để mở kỹ năng; `null` khi BE chưa khai báo. */
    requiredPercent: number | null
    /** Trọng số đóng góp của khoá vào kỹ năng (BE `weight`); 0 khi vắng mặt. */
    weight: number
}

/** A single skill node in the graph. */
export interface SkillNode {
    id: string
    name: string
    domain: SkillDomain
    /** Mastery level, 0–100 (the learner's level over the skill's own ladder). */
    level: number
    status: SkillStatus
    /** Bậc thang thô của người học (0 = chưa bắt đầu) — dùng cho chip "Lv n/m". */
    levelIndex: number
    /** Đỉnh thang bậc của chính kỹ năng đó. */
    maxLevel: number
    /** Bậc người học ĐÃ đủ điều kiện lên (BE `eligibleLevel`), có thể lớn hơn `levelIndex`. */
    eligibleLevel: number
    /** BE `unlocked`; khi vắng mặt suy ra từ `level > 0`. */
    unlocked: boolean
    /** BE `unlockPercent` 0–100 — tiến độ tới ngưỡng mở khoá; `null` khi BE chưa trả. */
    unlockPercent: number | null
    /** BE `sources[]` — các khoá dạy kỹ năng; `[]` cho tới khi BE nối course→skill. */
    sources: Array<SkillSource>
    /** Related subject ids — the career REST surface exposes none today. */
    subjectIds: Array<string>
    /** Related course ids — the career REST surface exposes none today. */
    courseIds: Array<string>
}

/** A directed/undirected link between two skill nodes. */
export interface SkillEdge {
    id: string
    source: string
    target: string
    kind: SkillEdgeKind
}

/** The full skill-graph payload. */
export interface SkillGraphData {
    nodes: Array<SkillNode>
    edges: Array<SkillEdge>
}

/** Optional scope narrowing the graph to a subject's skills + 1-hop neighbors. */
export interface SkillGraphScope {
    /** The `[subjectId]` route segment (the subject CODE). */
    subjectId?: string
}

/** All six career domains, in a stable order (drives seeded angular sectors). */
export const SKILL_DOMAINS: Array<SkillDomain> = ["be", "fe", "mobile", "ai", "data", "devops"]

/** Ordered category-keyword → domain rules; the FIRST match wins. */
const DOMAIN_RULES: Array<{ match: Array<string>; domain: SkillDomain }> = [
    { match: ["MOBILE", "ANDROID", "IOS", "FLUTTER"], domain: "mobile" },
    { match: ["AI", "ML", "MACHINE", "DEEP", "NLP", "LLM"], domain: "ai" },
    { match: ["DATA", "DATABASE", "SQL", "ANALYT", "BI"], domain: "data" },
    { match: ["DEVOPS", "CLOUD", "INFRA", "PLATFORM", "SRE", "SECURITY", "NETWORK"], domain: "devops" },
    { match: ["FRONT", "WEB", "UI", "UX", "DESIGN", "CSS"], domain: "fe" },
    { match: ["BACK", "SERVER", "API", "LANGUAGE", "FRAMEWORK"], domain: "be" },
]

/**
 * Folds a BE skill `category` into one of the six UI domains.
 *
 * @param category - the raw category (`LANGUAGE`, `DATABASE`, `MOBILE_DEV`, …).
 * @returns the matching domain; `be` when nothing matches (the backend default bucket).
 */
export const domainForCategory = (category?: string | null): SkillDomain => {
    const normalized = (category ?? "").toUpperCase()
    for (const rule of DOMAIN_RULES) {
        if (rule.match.some((token) => normalized.includes(token))) {
            return rule.domain
        }
    }
    return "be"
}

/**
 * Reads the top level of a skill's `levels` ladder (a JSON string of
 * `[{level,name,threshold}]`).
 *
 * @param levels - the raw JSON string.
 * @returns the highest declared level, or `5` when the ladder is missing/unparsable.
 */
export const maxLevelOf = (levels?: string | null): number => {
    if (!levels) {
        return 5
    }
    try {
        const parsed: unknown = JSON.parse(levels)
        if (!Array.isArray(parsed)) {
            return 5
        }
        const levelNumbers = parsed
            .map((entry) => {
                const value = (entry as { level?: unknown } | null)?.level
                return typeof value === "number" ? value : Number(value)
            })
            .filter((value) => Number.isFinite(value) && value > 0)
        return levelNumbers.length > 0 ? Math.max(...levelNumbers) : 5
    } catch {
        return 5
    }
}

/**
 * Converts a learner level to the 0–100 mastery the node size/progress meter reads.
 *
 * @param level - the learner's level for the skill.
 * @param maxLevel - the top level of that skill's ladder.
 * @returns a percentage clamped to 0–100.
 */
export const masteryOf = (level: number, maxLevel: number): number => {
    if (!Number.isFinite(level) || level <= 0) {
        return 0
    }
    const ceiling = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 5
    return Math.max(0, Math.min(100, Math.round((level / ceiling) * 100)))
}

/**
 * Buckets a learner level into the node status.
 *
 * @param level - the learner's level for the skill.
 * @param maxLevel - the top level of that skill's ladder.
 * @returns `locked` at level 0, `mastered` at the top of the ladder, `learning` between.
 */
export const statusOf = (level: number, maxLevel: number): SkillStatus => {
    if (!Number.isFinite(level) || level <= 0) {
        return "locked"
    }
    const ceiling = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 5
    return level >= ceiling ? "mastered" : "learning"
}

/**
 * Đọc một số 0–100 từ payload thô, chấp nhận cả chuỗi ("60") lẫn số.
 *
 * @param raw - giá trị thô.
 * @returns số đã kẹp trong 0–100, hoặc `null` khi không đọc được.
 */
const readPercent = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === "") {
        return null
    }
    const value = typeof raw === "number" ? raw : Number(raw)
    if (!Number.isFinite(value)) {
        return null
    }
    return Math.max(0, Math.min(100, Math.round(value)))
}

/**
 * Đọc một phần tử `sources[]` theo cả hai cách viết (camelCase / snake_case).
 *
 * @param raw - phần tử thô trong `sources[]`.
 * @returns nguồn đã chuẩn hoá, hoặc `null` khi không có định danh khoá.
 */
export const readSkillSource = (raw: unknown): SkillSource | null => {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const row = raw as Record<string, unknown>
    const idValue = row.courseId ?? row.course_id ?? row.id
    if (typeof idValue !== "string" || idValue.length === 0) {
        return null
    }
    const titleValue = row.courseTitle ?? row.course_title ?? row.title
    const slugValue = row.courseSlug ?? row.course_slug ?? row.slug
    return {
        courseId: idValue,
        courseTitle: typeof titleValue === "string" && titleValue.length > 0 ? titleValue : idValue,
        courseSlug: typeof slugValue === "string" && slugValue.length > 0 ? slugValue : idValue,
        completionPercent: readPercent(row.completionPercent ?? row.completion_percent) ?? 0,
        requiredPercent: readPercent(row.requiredPercent ?? row.required_percent ?? row.unlockAtPercent ?? row.unlock_at_percent),
        weight: Number(row.weight ?? 0) || 0,
    }
}

/**
 * Đọc cả mảng `sources[]`, bỏ qua phần tử hỏng.
 *
 * @param raw - giá trị `sources` thô (thường là mảng, có thể vắng mặt).
 * @returns mảng nguồn đã chuẩn hoá — `[]` khi BE chưa trả trường này.
 */
export const readSkillSources = (raw: unknown): Array<SkillSource> => {
    if (!Array.isArray(raw)) {
        return []
    }
    return raw
        .map(readSkillSource)
        .filter((source): source is SkillSource => source !== null)
}

/** A relation row as it may arrive (snake_case from the BE, camelCase per the FE type). */
export interface SkillRelationRow {
    skillId: string
    relatedId: string
    relation: string
}

/**
 * Reads one relation row in either spelling.
 *
 * @param raw - the row from `relations[]`.
 * @returns the normalized row, or `null` when either endpoint is missing.
 */
export const readRelation = (raw: unknown): SkillRelationRow | null => {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const row = raw as Record<string, unknown>
    const skillId = row.skillId ?? row.skill_id
    const relatedId = row.relatedId ?? row.related_id
    if (typeof skillId !== "string" || typeof relatedId !== "string") {
        return null
    }
    return {
        skillId,
        relatedId,
        relation: typeof row.relation === "string" ? row.relation : "RELATED",
    }
}

/**
 * Builds the graph view model from the career payloads.
 *
 * `REQUIRES` edges point prerequisite → dependant (`related_id` is the prerequisite of
 * `skill_id`), `UNLOCKS` the other way round; anything else renders as a `related` link.
 * Edges with a dangling endpoint (a non-ACTIVE skill) are dropped.
 *
 * Các trường mở khoá (`unlocked` / `unlockPercent` / `sources`) được đọc từ hàng tiến độ
 * TRƯỚC (dữ liệu theo người học), rồi mới tới hàng catalogue — BE đang bổ sung và chưa
 * chốt sẽ gắn ở đâu, nên chấp nhận cả hai và vắng cả hai vẫn chạy.
 *
 * @param skills - `GET /career/skills` → `skills[]`.
 * @param relations - `GET /career/skills` → `relations[]` (either spelling).
 * @param progress - `GET /career/me/skills` (empty for guests).
 * @returns nodes + edges for the canvas / list fallback.
 */
export const buildSkillGraph = (
    skills: Array<CareerSkill>,
    relations: Array<unknown>,
    progress: Array<CareerSkillProgress>,
): SkillGraphData => {
    const progressBySkill = new Map<string, Record<string, unknown>>()
    for (const entry of progress ?? []) {
        if (entry && typeof entry.skillId === "string") {
            progressBySkill.set(entry.skillId, entry as unknown as Record<string, unknown>)
        }
    }

    const nodes: Array<SkillNode> = (skills ?? []).map((skill) => {
        const maxLevel = maxLevelOf(skill.levels)
        const row = progressBySkill.get(skill.id)
        const level = Number(row?.level ?? 0)
        // Trường mở khoá có thể nằm ở hàng tiến độ (per-user) hoặc hàng catalogue.
        const catalogueRow = skill as unknown as Record<string, unknown>
        const unlockedRaw = row?.unlocked ?? catalogueRow.unlocked
        const status = statusOf(level, maxLevel)
        const eligibleRaw = Number(row?.eligibleLevel ?? row?.eligible_level ?? 0)
        return {
            id: skill.id,
            name: skill.name,
            domain: domainForCategory(skill.category),
            level: masteryOf(level, maxLevel),
            status,
            levelIndex: Number.isFinite(level) && level > 0 ? level : 0,
            maxLevel,
            eligibleLevel: Number.isFinite(eligibleRaw) && eligibleRaw > 0 ? eligibleRaw : 0,
            // BE chưa trả `unlocked` → suy ra từ bậc đã đạt (level > 0 = đã mở).
            unlocked: typeof unlockedRaw === "boolean" ? unlockedRaw : status !== "locked",
            unlockPercent: readPercent(
                row?.unlockPercent ?? row?.unlock_percent ?? catalogueRow.unlockPercent ?? catalogueRow.unlock_percent,
            ),
            sources: readSkillSources(row?.sources ?? catalogueRow.sources),
            // The career REST surface exposes no skill↔subject / skill↔course mapping.
            subjectIds: [],
            courseIds: [],
        }
    })

    const known = new Set(nodes.map((node) => node.id))
    const edges: Array<SkillEdge> = []
    for (const raw of relations ?? []) {
        const row = readRelation(raw)
        if (!row || !known.has(row.skillId) || !known.has(row.relatedId)) {
            continue
        }
        if (row.relation === "REQUIRES") {
            edges.push({
                id: `pre-${row.relatedId}-${row.skillId}`,
                source: row.relatedId,
                target: row.skillId,
                kind: "prerequisite",
            })
        } else if (row.relation === "UNLOCKS") {
            edges.push({
                id: `pre-${row.skillId}-${row.relatedId}`,
                source: row.skillId,
                target: row.relatedId,
                kind: "prerequisite",
            })
        } else {
            edges.push({
                id: `rel-${row.skillId}-${row.relatedId}`,
                source: row.skillId,
                target: row.relatedId,
                kind: "related",
            })
        }
    }

    return { nodes, edges }
}

/**
 * Narrows a graph to a set of skills plus their 1-hop neighbors.
 *
 * Used for the subject-scoped graph: the subject workspace `careerBridge.relatedSkills`
 * carries the skill UUIDs mapped to that subject.
 *
 * @param graph - the full graph.
 * @param skillIds - the anchor skill ids.
 * @returns the subgraph, or the full graph when no anchor is present in it.
 */
export const scopeGraphToSkills = (
    graph: SkillGraphData,
    skillIds: Array<string>,
): SkillGraphData => {
    const anchors = new Set(
        skillIds.filter((id) => graph.nodes.some((node) => node.id === id)),
    )
    if (anchors.size === 0) {
        // No mapping for this subject → the full graph is still the useful answer.
        return graph
    }
    const keep = new Set(anchors)
    for (const edge of graph.edges) {
        if (anchors.has(edge.source)) keep.add(edge.target)
        if (anchors.has(edge.target)) keep.add(edge.source)
    }
    return {
        nodes: graph.nodes.filter((node) => keep.has(node.id)),
        edges: graph.edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target)),
    }
}

// ---------------------------------------------------------------------------
// Mô hình cho BẢNG KỸ NĂNG THEO NHÓM NGHỀ (view danh sách)
// ---------------------------------------------------------------------------

/**
 * Nhóm trạng thái mà một thẻ kỹ năng rơi vào. Bốn nhóm này cũng là bốn lát của thanh
 * tóm tắt và bốn tone màu DUY NHẤT trong danh sách (màu nhóm nghề chỉ được dùng ở tiêu
 * đề accordion) — một trang, một ngôn ngữ màu.
 */
export type SkillBucket = "learning" | "nearly" | "mastered" | "locked"

/** Thứ tự hiển thị trong nhóm: việc nên làm tiếp trước, thành tích sau. */
export const SKILL_BUCKETS: Array<SkillBucket> = ["learning", "nearly", "mastered", "locked"]

/** Vị trí sắp xếp của từng bucket (nhỏ hơn = lên trên). */
const BUCKET_ORDER: Record<SkillBucket, number> = {
    learning: 0,
    nearly: 1,
    mastered: 2,
    locked: 3,
}

/**
 * Chọn khoá học "đại diện" cho một kỹ năng: khoá người học đi xa nhất; hoà thì lấy khoá
 * có trọng số lớn hơn.
 *
 * @param node - kỹ năng.
 * @returns nguồn tốt nhất, hoặc `null` khi kỹ năng chưa gắn khoá nào.
 */
export const bestSourceOf = (node: SkillNode): SkillSource | null => {
    let best: SkillSource | null = null
    for (const source of node.sources) {
        if (
            best === null
            || source.completionPercent > best.completionPercent
            || (source.completionPercent === best.completionPercent && source.weight > best.weight)
        ) {
            best = source
        }
    }
    return best
}

/**
 * Tiến độ tới ngưỡng mở khoá, 0–100.
 *
 * Ưu tiên `unlockPercent` của BE; khi chưa có thì suy ra từ % hoàn thành của khoá đại
 * diện — nghĩa là hôm nay (chưa có `sources`) mọi kỹ năng chưa mở đều trả 0.
 *
 * @param node - kỹ năng.
 * @returns phần trăm đã kẹp 0–100.
 */
export const unlockProgressOf = (node: SkillNode): number => {
    if (node.unlockPercent !== null) {
        return node.unlockPercent
    }
    const best = bestSourceOf(node)
    return best ? best.completionPercent : 0
}

/**
 * Xếp một kỹ năng vào bucket.
 *
 * "Sắp mở" định nghĩa CHẶT (không dùng ngưỡng đoán): kỹ năng chưa mở nhưng ĐÃ có tiến
 * độ đo được (`unlockPercent > 0`, hoặc có khoá gắn kèm mà người học đã học dở). Không
 * có dữ liệu khoá thì không thể "sắp mở" — nó là "chưa mở", và UI nói rõ vì sao.
 *
 * @param node - kỹ năng.
 * @returns bucket tương ứng.
 */
export const bucketOf = (node: SkillNode): SkillBucket => {
    if (node.status === "mastered") {
        return "mastered"
    }
    if (node.status === "learning" || node.unlocked) {
        return "learning"
    }
    return unlockProgressOf(node) > 0 ? "nearly" : "locked"
}

/**
 * Dòng "quy trách nhiệm mở khoá" ở dạng DỮ LIỆU — feature dịch nó thành chữ.
 *
 * - `none` — chưa gắn khoá nào (thực trạng BE hôm nay),
 * - `already` — đã mở, nêu khoá đã mở nó,
 * - `progress` — chưa mở, nêu khoá cần học tiếp và % hiện tại.
 */
export type SkillUnlockLine =
    | { kind: "none" }
    | { kind: "already"; source: SkillSource; extra: number }
    | { kind: "progress"; source: SkillSource; extra: number; percent: number }

/**
 * Dựng dòng mở khoá cho một kỹ năng.
 *
 * @param node - kỹ năng.
 * @returns mô tả dòng mở khoá; `extra` là số khoá còn lại ngoài khoá đại diện.
 */
export const unlockLineOf = (node: SkillNode): SkillUnlockLine => {
    const source = bestSourceOf(node)
    if (!source) {
        return { kind: "none" }
    }
    const extra = node.sources.length - 1
    if (bucketOf(node) === "locked" || bucketOf(node) === "nearly") {
        return { kind: "progress", source, extra, percent: unlockProgressOf(node) }
    }
    return { kind: "already", source, extra }
}

/**
 * Các kỹ năng tiên quyết CHƯA đạt của một kỹ năng.
 *
 * Chỉ đọc cạnh `prerequisite` (BE sinh ra từ `REQUIRES`/`UNLOCKS`); quan hệ `RELATED` cố
 * ý bỏ qua vì nó là gợi ý ngang, không phải điều kiện.
 *
 * @param graph - đồ thị đầy đủ (tính trên đồ thị ĐẦY ĐỦ, không phải tập đã lọc).
 * @param nodeId - kỹ năng đang xét.
 * @returns tên các kỹ năng tiên quyết chưa mở, theo thứ tự cạnh.
 */
export const pendingPrerequisitesOf = (graph: SkillGraphData, nodeId: string): Array<string> => {
    const byId = new Map(graph.nodes.map((node) => [node.id, node]))
    const names: Array<string> = []
    for (const edge of graph.edges) {
        if (edge.kind !== "prerequisite" || edge.target !== nodeId) {
            continue
        }
        const source = byId.get(edge.source)
        if (source && !source.unlocked && source.status === "locked") {
            names.push(source.name)
        }
    }
    return names
}

/**
 * Gán "bậc phụ thuộc" cho từng kỹ năng: bậc 0 = không có tiên quyết, bậc n = xa nhất n
 * bước trên chuỗi tiên quyết.
 *
 * Dùng làm THỨ TỰ SẮP XẾP trong nhóm chứ không làm bố cục — khi `skill_relations` còn
 * rỗng (hiện trạng) thì mọi kỹ năng ở bậc 0 và hàm này là no-op vô hại. An toàn với dữ
 * liệu bẩn: BE chỉ chặn chu trình cho `REQUIRES`, `UNLOCKS` không ai kiểm, nên các nút
 * còn kẹt bậc vào (nằm trên chu trình) giữ bậc đã tính được thay vì treo vòng lặp.
 *
 * @param nodes - toàn bộ nút.
 * @param edges - toàn bộ cạnh (chỉ cạnh `prerequisite` được dùng).
 * @returns map `id → bậc`.
 */
export const assignTiers = (
    nodes: Array<SkillNode>,
    edges: Array<SkillEdge>,
): Map<string, number> => {
    const tier = new Map<string, number>(nodes.map((node) => [node.id, 0]))
    const indegree = new Map<string, number>(nodes.map((node) => [node.id, 0]))
    const outgoing = new Map<string, Array<string>>()
    for (const edge of edges) {
        if (edge.kind !== "prerequisite" || !tier.has(edge.source) || !tier.has(edge.target)) {
            continue
        }
        outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target])
        indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1)
    }

    const queue = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id)
    for (let head = 0; head < queue.length; head += 1) {
        const id = queue[head]
        for (const next of outgoing.get(id) ?? []) {
            tier.set(next, Math.max(tier.get(next) ?? 0, (tier.get(id) ?? 0) + 1))
            const left = (indegree.get(next) ?? 0) - 1
            indegree.set(next, left)
            if (left === 0) {
                queue.push(next)
            }
        }
    }
    // Nút còn bậc-vào > 0 nằm trên chu trình: giữ bậc đã tính, KHÔNG lặp tiếp.
    return tier
}

/**
 * % dùng để so sánh trong cùng bucket: mức thành thạo cho kỹ năng đã mở, tiến độ mở khoá
 * cho kỹ năng chưa mở.
 *
 * @param node - kỹ năng.
 * @returns phần trăm 0–100.
 */
export const sortPercentOf = (node: SkillNode): number =>
    bucketOf(node) === "locked" || bucketOf(node) === "nearly" ? unlockProgressOf(node) : node.level

/**
 * Sắp xếp kỹ năng trong một nhóm nghề: bucket → bậc phụ thuộc → % giảm dần → tên (vi).
 *
 * Bậc và bucket tính trên đồ thị ĐẦY ĐỦ nên bộ lọc/ô tìm kiếm chỉ ẩn thẻ, không bao giờ
 * làm thẻ nhảy chỗ.
 *
 * @param nodes - các kỹ năng của một nhóm.
 * @param tiers - map bậc từ {@link assignTiers}.
 * @returns mảng MỚI đã sắp xếp.
 */
export const sortSkillsInGroup = (
    nodes: Array<SkillNode>,
    tiers: Map<string, number>,
): Array<SkillNode> =>
    [...nodes].sort((left, right) => {
        const byBucket = BUCKET_ORDER[bucketOf(left)] - BUCKET_ORDER[bucketOf(right)]
        if (byBucket !== 0) {
            return byBucket
        }
        const byTier = (tiers.get(left.id) ?? 0) - (tiers.get(right.id) ?? 0)
        if (byTier !== 0) {
            return byTier
        }
        const byPercent = sortPercentOf(right) - sortPercentOf(left)
        if (byPercent !== 0) {
            return byPercent
        }
        return left.name.localeCompare(right.name, "vi")
    })

/** Một nhóm nghề kèm các kỹ năng đã sắp xếp. */
export interface SkillDomainGroup {
    domain: SkillDomain
    skills: Array<SkillNode>
    /** Số kỹ năng đã mở (đang học + thành thạo) trong nhóm. */
    unlockedCount: number
}

/**
 * Gom kỹ năng theo nhóm nghề, giữ đúng thứ tự {@link SKILL_DOMAINS} để tạo trí nhớ vị
 * trí; nhóm 0 kỹ năng bị bỏ hẳn.
 *
 * @param graph - đồ thị đầy đủ.
 * @returns các nhóm không rỗng, kỹ năng bên trong đã sắp xếp.
 */
export const groupSkillsByDomain = (graph: SkillGraphData): Array<SkillDomainGroup> => {
    const tiers = assignTiers(graph.nodes, graph.edges)
    return SKILL_DOMAINS.map((domain) => {
        const skills = sortSkillsInGroup(
            graph.nodes.filter((node) => node.domain === domain),
            tiers,
        )
        return {
            domain,
            skills,
            unlockedCount: skills.filter((node) => bucketOf(node) !== "locked" && bucketOf(node) !== "nearly").length,
        }
    }).filter((group) => group.skills.length > 0)
}

/** Số đếm của thanh tóm tắt. */
export interface SkillSummary {
    total: number
    mastered: number
    learning: number
    nearly: number
    locked: number
}

/**
 * Đếm kỹ năng theo bucket cho thanh tóm tắt.
 *
 * @param nodes - toàn bộ kỹ năng.
 * @returns tổng + số đếm từng bucket.
 */
export const summarizeSkills = (nodes: Array<SkillNode>): SkillSummary => {
    const summary: SkillSummary = { total: nodes.length, mastered: 0, learning: 0, nearly: 0, locked: 0 }
    for (const node of nodes) {
        summary[bucketOf(node)] += 1
    }
    return summary
}

/** Gợi ý "việc nên làm tiếp": kỹ năng sắp mở gần đích nhất. */
export interface SkillNextUp {
    skill: SkillNode
    source: SkillSource
    /** Số % còn thiếu để chạm ngưỡng mở khoá. */
    remaining: number
}

/**
 * Chọn hành động kế tiếp cho dải tóm tắt: trong các kỹ năng "sắp mở" có khoá gắn kèm,
 * lấy cái còn thiếu ÍT nhất.
 *
 * Trả `null` khi không có dữ liệu khoá — dải tóm tắt phải ẨN HẲN nút thay vì hiện một
 * chỗ trống hay số bịa.
 *
 * @param nodes - toàn bộ kỹ năng.
 * @returns kỹ năng + khoá + % còn thiếu, hoặc `null`.
 */
export const nextUnlockOf = (nodes: Array<SkillNode>): SkillNextUp | null => {
    let best: SkillNextUp | null = null
    for (const skill of nodes) {
        if (bucketOf(skill) !== "nearly") {
            continue
        }
        const source = bestSourceOf(skill)
        if (!source) {
            continue
        }
        const target = source.requiredPercent ?? 100
        const remaining = Math.max(0, target - unlockProgressOf(skill))
        if (best === null || remaining < best.remaining) {
            best = { skill, source, remaining }
        }
    }
    return best
}

/**
 * Có kỹ năng nào ĐANG gắn với một khoá học không?
 *
 * Sai (hiện trạng production) → cả trang phải nói rõ "chưa có khoá học nào khai báo kỹ
 * năng", kẻo sinh viên tưởng hệ thống hỏng.
 *
 * @param nodes - toàn bộ kỹ năng.
 * @returns `true` khi ít nhất một kỹ năng có `sources`.
 */
export const hasCourseMapping = (nodes: Array<SkillNode>): boolean =>
    nodes.some((node) => node.sources.length > 0)

/**
 * Lọc kỹ năng theo ô tìm kiếm (không dấu-nhạy, không phân biệt hoa thường).
 *
 * @param nodes - kỹ năng của một nhóm.
 * @param query - chuỗi người dùng gõ.
 * @returns các kỹ năng khớp; trả nguyên mảng khi query rỗng.
 */
export const filterSkillsByQuery = (nodes: Array<SkillNode>, query: string): Array<SkillNode> => {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) {
        return nodes
    }
    return nodes.filter((node) => node.name.toLowerCase().includes(needle))
}
