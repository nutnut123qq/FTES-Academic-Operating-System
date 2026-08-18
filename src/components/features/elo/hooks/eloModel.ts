/**
 * Pure mapping between the career **Elo** REST payloads and the profile chart's view
 * model.
 *
 * Sources: `GET /api/v1/career/skill-categories` (the full managed catalogue) and
 * `GET /api/v1/career/me/elo` (the learner's SKILL SET — the default categories of
 * their major — plus their real Elo in each).
 *
 * NAME: this used to be called "skill EXP" and was renamed to **Elo** because the
 * platform already has a different EXP — gamification XP, which drives level, league
 * and the leaderboards. Two labels both reading "EXP" side by side made users think
 * they were one number. Elo here ONLY ACCUMULATES: there is no opponent, no match and
 * no deduction, so do not add one because the chess meaning suggests it.
 *
 * Three properties of the data drive everything here:
 *
 * - **Elo is uncapped by design.** Studying more courses keeps adding, so there is no
 *   maximum to normalise against: bars carry the RAW total and the axis is derived from
 *   the learner's own strongest category ({@link niceAxisMax}).
 * - **A brand-new learner is all zeros, and that is a CHART, not an empty state.**
 *   Change `default-skills-by-major`: the backend answers with every category of the
 *   learner's major, so the panel shows the skills they are working towards at `0` Elo
 *   instead of the blank "no Elo yet" box. {@link EloChartData.isEmpty} now
 *   means only "there are no buckets at all" — which is a broken/empty catalogue, not a
 *   new learner. `hasEarnedElo` is the flag for "all bars still at zero".
 * - **The learner's skill set is scoped to their major**, and the payload says whether
 *   it actually was ({@link EloChartData.source}). `FULL_CATALOGUE` means the major
 *   is unknown, which the surface must SAY rather than silently show everything.
 *
 * Rows are read tolerantly (snake_case as well as the camelCase the shared FE client
 * type declares), exactly like the skill-graph relation rows, because the backend
 * serves several career reads straight from a `JdbcTemplate.queryForList`.
 */
/**
 * A catalogue row after tolerant reading. `sortOrder` is optional here (unlike the
 * wire type) so a payload without it falls back to the catalogue's own position
 * instead of collapsing every row to `0`.
 */
export interface SkillCategoryRow {
    slug: string
    label: string
    sortOrder?: number
}

/** Where the learner's bucket list came from (`EloDtos.SkillSetSource`). */
export type EloSource = "MAJOR_DEFAULTS" | "FULL_CATALOGUE"

/**
 * Lý do bộ cột đang hiện như vậy — mỗi giá trị ứng với ĐÚNG MỘT câu trên màn hình.
 *
 * `MAJOR_WITHOUT_SET` là nhánh thứ ba mà trước đây không có tiếng nói nào: BE trả
 * `source = FULL_CATALOGUE` cho CẢ "chưa chọn ngành" LẪN "đã chọn ngành nhưng ngành đó chưa khai
 * bộ mặc định", và chỉ `majorCode` mới tách được hai cái đó ra.
 */
export type SkillSetNotice =
    /** Đây là bộ kỹ năng của ngành X (có nhãn ngành để in). */
    | "MAJOR_SET"
    /** Chưa chọn ngành ⇒ hiện toàn bộ danh mục + mời chọn ngành. */
    | "NO_MAJOR"
    /** ĐÃ chọn ngành, nhưng ngành đó chưa khai bộ kỹ năng riêng ⇒ KHÔNG mời chọn lại. */
    | "MAJOR_WITHOUT_SET"
    /** Không đọc được Elo của học viên ⇒ các cột là danh mục chung ở 0, không phải Elo thật. */
    | "READ_UNAVAILABLE"
    /** Không có gì phải giải thích thêm. */
    | "NONE"

/** A learner-total row after tolerant reading. */
export interface EloRow {
    slug: string
    label?: string
    sortOrder?: number
    totalElo: number
}

/** One bar: a skill category plus the learner's accumulated Elo in it. */
export interface EloBar {
    /** Category slug — stable key AND the i18n key suffix (`elo.categories.<slug>`). */
    slug: string
    /**
     * Label the backend supplied. Admins can add categories at any time, so the UI
     * falls back to this instead of leaking a raw translation key.
     */
    fallbackLabel: string
    /** Raw accumulated Elo — uncapped, and `0` for a category not earned in yet. */
    elo: number
}

/** The whole view model behind the profile Elo chart. */
export interface EloChartData {
    /** The learner's skill set, strongest first. */
    bars: Array<EloBar>
    /** The strongest category's total (`0` when nothing has been earned yet). */
    peak: number
    /** Auto-scaled axis top: {@link peak} rounded up to a readable step; `0` when peak is `0`. */
    axisMax: number
    /** Sum across every category. */
    total: number
    /**
     * TRUE only when there is not a single bucket to draw — an empty catalogue, or a
     * failed read that degraded to nothing. A learner who has simply earned nothing yet
     * is NOT empty: their major's categories are drawn at zero (see {@link hasEarnedElo}).
     */
    isEmpty: boolean
    /** `false` while every bar is still at `0` — the chart says so instead of hiding. */
    hasEarnedElo: boolean
    /** See {@link EloSource}. `FULL_CATALOGUE` when the major is unknown. */
    source: EloSource
    /** The learner's major code, or `null` when they have not chosen one. */
    majorCode: string | null
    /**
     * TRUE khi đường đọc Elo của học viên KHÔNG dùng được (khách chưa đăng nhập / thiếu quyền /
     * endpoint chưa deploy), nên các cột dưới đây là DANH MỤC CHUNG ở mức 0 chứ không phải Elo thật.
     *
     * VÌ SAO phải có cờ riêng thay vì cứ để rỗng: "đọc được và rỗng" (chưa học nên chưa có Elo) với
     * "không đọc được" là HAI SỰ THẬT KHÁC NHAU. Gộp chúng lại chính là lớp bug mà cả thay đổi này
     * sinh ra để diệt — người đang có 1.200 Elo mà nhìn thấy một biểu đồ đầy số 0 sẽ đọc thành
     * "hệ thống mất sạch Elo của tôi". Lỗi HỎNG THẬT (5xx/timeout) thì không tới được đây: nó được
     * ném lên cho SWR để màn hình hiện trạng thái lỗi có nút Thử lại
     * (xem `useQueryEloSwr#loadEloChart`).
     */
    learnerReadUnavailable: boolean
    /**
     * Display name of the major. `null` when unchosen AND when the major catalogue
     * service could not be reached — never assume a `MAJOR_DEFAULTS` source implies
     * a label exists.
     */
    majorLabel: string | null
}

/**
 * Readable axis steps, as multipliers of the peak's power of ten. Dense enough that
 * the strongest bar still fills most of its track (the widest gap wastes a third of
 * the axis at worst) while the printed top stays a round number.
 */
const AXIS_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

/**
 * Rounds a peak value up to a readable axis maximum (a step × 10ⁿ).
 *
 * The chart's axis auto-scales because Elo has no ceiling; snapping to a round step
 * keeps the printed axis top legible (340 reads as "400", not "340") and leaves the
 * top bar visible headroom instead of pinning it at full width.
 *
 * @param peak - the largest category total.
 * @returns the axis maximum, or `0` when there is nothing to plot.
 */
export const niceAxisMax = (peak: number): number => {
    if (!Number.isFinite(peak) || peak <= 0) {
        return 0
    }
    const magnitude = 10 ** Math.floor(Math.log10(peak))
    for (const step of AXIS_STEPS) {
        const candidate = Math.ceil(step * magnitude)
        if (candidate >= peak) {
            return candidate
        }
    }
    return Math.ceil(10 * magnitude)
}

/**
 * Reads a number in either spelling / type (the BE may serve `bigint` totals as strings).
 *
 * @param value - the raw field.
 * @returns a finite number, or `0`.
 */
const readNumber = (value: unknown): number => {
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Reads one catalogue row in either spelling.
 *
 * @param raw - a row of `GET /career/skill-categories`.
 * @returns the normalized category, or `null` when it carries no slug.
 */
export const readSkillCategory = (raw: unknown): SkillCategoryRow | null => {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const row = raw as Record<string, unknown>
    const slug = row.slug
    if (typeof slug !== "string" || slug.length === 0) {
        return null
    }
    // Left undefined when the backend sends no order, so the catalogue's own
    // position is used as the tie-break instead of collapsing every row to 0.
    const rawOrder = row.sortOrder ?? row.sort_order
    return {
        slug,
        label: typeof row.label === "string" && row.label.length > 0 ? row.label : slug,
        sortOrder: rawOrder == null ? undefined : readNumber(rawOrder),
    }
}

/**
 * Reads one learner total in either spelling.
 *
 * @param raw - a row of `GET /career/me/elo`.
 * @returns the normalized total, or `null` when it carries no slug.
 */
export const readEloRow = (raw: unknown): EloRow | null => {
    if (typeof raw !== "object" || raw === null) {
        return null
    }
    const row = raw as Record<string, unknown>
    const slug = row.slug ?? row.categorySlug ?? row.category_slug
    if (typeof slug !== "string" || slug.length === 0) {
        return null
    }
    const rawOrder = row.sortOrder ?? row.sort_order
    return {
        slug,
        label: typeof row.label === "string" ? row.label : undefined,
        sortOrder: rawOrder == null ? undefined : readNumber(rawOrder),
        // `total_elo` is a bigint column — a JSON string total must still add up.
        // The `totalExp`/`total_exp` spellings are the PRE-RENAME wire, still served by
        // the deprecated `/career/me/skill-exp` alias this client falls back to when the
        // backend has not been deployed yet. Reading both is what keeps the deploy order
        // of BE and FE from producing a chart of silent zeros.
        totalElo: Math.max(
            0,
            readNumber(
                row.totalElo ?? row.total_elo ?? row.totalExp ?? row.total_exp ?? row.elo ?? row.exp,
            ),
        ),
    }
}

/** The learner's skill set after tolerant reading of `GET /career/me/elo`. */
export interface EloPayload {
    rows: Array<EloRow>
    source: EloSource
    majorCode: string | null
    majorLabel: string | null
}

/**
 * Reads `GET /career/me/elo` in EITHER wire shape.
 *
 * The endpoint returned a bare array before change `default-skills-by-major` and an
 * envelope after it. Reading both means the deploy order of backend and frontend
 * cannot produce a broken panel — the array shape simply degrades to
 * `FULL_CATALOGUE` with no major, which is exactly what it meant.
 *
 * @param raw - the unwrapped `data` of the response (or `[]` when the read failed).
 * @returns the rows plus the skill-set metadata.
 */
export const readEloPayload = (raw: unknown): EloPayload => {
    const envelope = (Array.isArray(raw) ? null : raw) as Record<string, unknown> | null
    const list = Array.isArray(raw) ? raw : Array.isArray(envelope?.items) ? envelope.items : []

    const rows: Array<EloRow> = []
    for (const item of list) {
        const row = readEloRow(item)
        if (row) {
            rows.push(row)
        }
    }
    // Anything other than the one known non-default value reads as FULL_CATALOGUE: an
    // unrecognised source must not suppress the "pick your major" prompt, because the
    // prompt is the only way out of a bucket list that is not actually the learner's.
    const source: EloSource =
        envelope?.source === "MAJOR_DEFAULTS" ? "MAJOR_DEFAULTS" : "FULL_CATALOGUE"
    const majorCode = typeof envelope?.majorCode === "string" && envelope.majorCode.length > 0
        ? envelope.majorCode
        : null
    const majorLabel = typeof envelope?.majorLabel === "string" && envelope.majorLabel.length > 0
        ? envelope.majorLabel
        : null

    return { rows, source, majorCode, majorLabel }
}

/**
 * Builds the chart view model from the two career payloads.
 *
 * The learner payload decides WHICH bars exist — it already carries their major's
 * default skill set, zeros included — and the catalogue is only consulted for the
 * DISPLAY LABEL of each bucket. That is the inversion made by change
 * `default-skills-by-major`: driving the buckets off the full catalogue would put
 * every category on every learner's chart and undo the whole point.
 *
 * When the learner read fails (guest, permission, network) there is no skill set to
 * scope by, so the full catalogue is drawn at zero rather than nothing at all.
 *
 * @param categories - `GET /career/skill-categories` (either spelling).
 * @param totals - `GET /career/me/elo`: the envelope, the legacy bare array, or
 *                 `[]` when that read was UNAVAILABLE (and only then — see the flag below).
 * @param learnerReadUnavailable - `true` chỉ khi đường đọc Elo học viên không dùng được
 *                 (401/403/404). Mặc định `false` = payload này là sự thật đã đọc được, kể cả khi
 *                 nó rỗng. Truyền bừa `true` sẽ nói dối theo chiều ngược lại, nên nơi gọi phải tự
 *                 biết mình đang ở nhánh nào.
 * @returns bars sorted strongest-first, the peak, the auto-scaled axis top, the total
 *          and the skill-set metadata.
 */
export const buildEloChart = (
    categories: Array<unknown>,
    totals: unknown,
    learnerReadUnavailable = false,
): EloChartData => {
    const payload = readEloPayload(totals)
    const eloBySlug = new Map<string, EloRow>()
    for (const row of payload.rows) {
        eloBySlug.set(row.slug, row)
    }

    const catalogue = new Map<string, SkillCategoryRow>()
    for (const raw of categories ?? []) {
        const row = readSkillCategory(raw)
        if (row) {
            catalogue.set(row.slug, row)
        }
    }

    // The learner's own skill set is authoritative. Only when it is missing entirely
    // does the catalogue stand in — otherwise a learner in Foreign Languages would get
    // DevOps bars back.
    const buckets: Array<SkillCategoryRow> =
        payload.rows.length > 0
            ? payload.rows.map((row) => ({
                slug: row.slug,
                // Prefer the catalogue's label: an admin renaming a category there is
                // the single place that should change what the bar says.
                label: catalogue.get(row.slug)?.label
                    ?? (row.label && row.label.length > 0 ? row.label : row.slug),
            }))
            : [...catalogue.values()]

    const bars: Array<EloBar> = buckets.map((category) => ({
        slug: category.slug,
        fallbackLabel: category.label,
        elo: eloBySlug.get(category.slug)?.totalElo ?? 0,
    }))

    // Ties keep the order the BACKEND sent, i.e. the array position — NOT `sortOrder`.
    // `sortOrder` is the position in the GLOBAL catalogue, while the payload is ordered
    // by the major's own order (V343: `mathematics` is last globally but first for the
    // Mathematics major). Ranking by `sortOrder` would throw that away in exactly the
    // case where the order is all the reader has to go on — a learner whose bars are
    // all still at zero.
    const orderBySlug = new Map(buckets.map((category, index) => [category.slug, index]))
    // Strongest first; ties keep the backend's order, then the label — never the map
    // iteration order, so the chart is stable across re-renders.
    bars.sort((left, right) => {
        if (right.elo !== left.elo) {
            return right.elo - left.elo
        }
        const leftOrder = orderBySlug.get(left.slug) ?? 0
        const rightOrder = orderBySlug.get(right.slug) ?? 0
        return leftOrder !== rightOrder
            ? leftOrder - rightOrder
            : left.fallbackLabel.localeCompare(right.fallbackLabel)
    })

    const peak = bars.reduce((highest, bar) => Math.max(highest, bar.elo), 0)
    const total = bars.reduce((sum, bar) => sum + bar.elo, 0)

    return {
        bars,
        peak,
        axisMax: niceAxisMax(peak),
        total,
        // ONLY "nothing to draw". A learner at all zeros keeps their bars — that used
        // to fall into the empty state, which is the blank panel this change fixes.
        isEmpty: bars.length === 0,
        hasEarnedElo: peak > 0,
        source: payload.source,
        majorCode: payload.majorCode,
        majorLabel: payload.majorLabel,
        learnerReadUnavailable,
    }
}

/**
 * Câu giải thích DUY NHẤT mà biểu đồ được phép in dưới các cột — mỗi giá trị là một sự thật khác
 * nhau về bộ cột đang hiện.
 *
 * VÌ SAO tách thành hàm thuần thay vì `if` trong component: quyết định này chính là chỗ đã sai.
 * Trước đây màn hình chỉ nhìn `source === "FULL_CATALOGUE"` rồi in "Chưa rõ ngành của bạn" + lời mời
 * chọn ngành, trong khi BE cố tình gộp HAI tình huống vào cùng một `source` (xem javadoc
 * `EloDtos.SkillSetSource`: "chưa chọn ngành, HOẶC ngành chưa khai bộ mặc định"). Học viên
 * ngành mới (admin thêm ngành nhưng `career.major_skill_categories` chỉ được seed bằng migration)
 * bị nói sai về hồ sơ của chính mình rồi mời sang `/profile/edit` — nơi ngành họ đã chọn nằm sẵn ở
 * đó, không có gì để sửa. `majorCode` là thứ BE trả kèm để phân biệt, dùng nó.
 *
 * @param chart - view model đã dựng bởi {@link buildEloChart}.
 * @returns loại câu cần in (`NONE` = không có gì phải giải thích).
 */
export const eloSetNotice = (chart: EloChartData): SkillSetNotice => {
    // Không đọc được Elo thì mọi câu khác đều là suy đoán trên dữ liệu không có: nói đúng chuyện đó
    // trước, và TUYỆT ĐỐI không mời chọn ngành (ngành có thể đang được chọn sẵn, ta chỉ không đọc nổi).
    if (chart.learnerReadUnavailable) {
        return "READ_UNAVAILABLE"
    }
    if (chart.source === "MAJOR_DEFAULTS") {
        // Không có nhãn ngành (danh mục ngành ở service khác không với tới được) thì im lặng còn hơn
        // in ra một mã trần kiểu "Bộ kỹ năng của ngành SE".
        return chart.majorLabel ? "MAJOR_SET" : "NONE"
    }
    // FULL_CATALOGUE + CÓ mã ngành = đã chọn ngành, chỉ là ngành đó chưa khai bộ kỹ năng riêng.
    // Mời chọn lại ngành ở đây là vô nghĩa và nói sai về hồ sơ người dùng.
    return chart.majorCode ? "MAJOR_WITHOUT_SET" : "NO_MAJOR"
}
