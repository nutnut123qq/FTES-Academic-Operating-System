/**
 * Pure mapping between the career skill-EXP REST payloads and the profile chart's
 * view model.
 *
 * Sources: `GET /api/v1/career/skill-categories` (the managed catalogue of ten
 * categories) and `GET /api/v1/career/me/skill-exp` (the learner's accumulated EXP
 * per category — the backend returns EVERY category, zeros included, so the chart
 * always has a full set of bars).
 *
 * Two properties of the data drive everything here:
 *
 * - **EXP is uncapped by design.** Studying more courses keeps adding, so there is no
 *   maximum to normalise against: bars carry the RAW total and the axis is derived from
 *   the learner's own strongest category ({@link niceAxisMax}).
 * - **A brand-new learner is all zeros.** That is not a chart — {@link SkillExpChartData.isEmpty}
 *   flags it so the surface can show an empty state instead of ten flat bars.
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

/** A learner-total row after tolerant reading. */
export interface SkillExpRow {
    slug: string
    label?: string
    sortOrder?: number
    totalExp: number
}

/** One bar: a skill category plus the learner's accumulated EXP in it. */
export interface SkillExpBar {
    /** Category slug — stable key AND the i18n key suffix (`skillExp.categories.<slug>`). */
    slug: string
    /**
     * Label the backend supplied. Admins can add categories at any time, so the UI
     * falls back to this instead of leaking a raw translation key.
     */
    fallbackLabel: string
    /** Raw accumulated EXP — uncapped, and `0` for a category not earned in yet. */
    exp: number
}

/** The whole view model behind the profile EXP chart. */
export interface SkillExpChartData {
    /** Every category, strongest first. */
    bars: Array<SkillExpBar>
    /** The strongest category's total (`0` when nothing has been earned yet). */
    peak: number
    /** Auto-scaled axis top: {@link peak} rounded up to a readable step; `0` when peak is `0`. */
    axisMax: number
    /** Sum across every category. */
    total: number
    /** No categories at all, or every category still at zero. */
    isEmpty: boolean
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
 * The chart's axis auto-scales because EXP has no ceiling; snapping to a round step
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
 * @param raw - a row of `GET /career/me/skill-exp`.
 * @returns the normalized total, or `null` when it carries no slug.
 */
export const readSkillExp = (raw: unknown): SkillExpRow | null => {
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
        // `total_exp` is a bigint column — a JSON string total must still add up.
        totalExp: Math.max(0, readNumber(row.totalExp ?? row.total_exp ?? row.exp)),
    }
}

/**
 * Builds the chart view model from the two career payloads.
 *
 * The catalogue decides WHICH bars exist (so a category the learner has never touched
 * still gets a zero bar); the totals decide how long they are. When the catalogue read
 * is unavailable, the totals payload — which already carries every category — is used
 * on its own rather than dropping the chart.
 *
 * @param categories - `GET /career/skill-categories` (either spelling).
 * @param totals - `GET /career/me/skill-exp` (either spelling; empty for guests).
 * @returns bars sorted strongest-first, the peak, the auto-scaled axis top and the total.
 */
export const buildSkillExpChart = (
    categories: Array<unknown>,
    totals: Array<unknown>,
): SkillExpChartData => {
    const expBySlug = new Map<string, SkillExpRow>()
    for (const raw of totals ?? []) {
        const row = readSkillExp(raw)
        if (row) {
            expBySlug.set(row.slug, row)
        }
    }

    const catalogue: Array<SkillCategoryRow> = []
    for (const raw of categories ?? []) {
        const row = readSkillCategory(raw)
        if (row) {
            catalogue.push(row)
        }
    }
    // Catalogue unreachable → fall back to the totals payload, which already lists
    // every category (zeros included), so the chart degrades instead of disappearing.
    const buckets: Array<SkillCategoryRow> =
        catalogue.length > 0
            ? catalogue
            : [...expBySlug.values()].map((row) => ({
                slug: row.slug,
                label: row.label && row.label.length > 0 ? row.label : row.slug,
                sortOrder: row.sortOrder,
            }))

    const bars: Array<SkillExpBar> = buckets.map((category) => ({
        slug: category.slug,
        fallbackLabel: category.label,
        exp: expBySlug.get(category.slug)?.totalExp ?? 0,
    }))

    const orderBySlug = new Map(buckets.map((category, index) => [category.slug, category.sortOrder ?? index]))
    // Strongest first; ties keep the catalogue's own order, then the label — never
    // the map iteration order, so the chart is stable across re-renders.
    bars.sort((left, right) => {
        if (right.exp !== left.exp) {
            return right.exp - left.exp
        }
        const leftOrder = orderBySlug.get(left.slug) ?? 0
        const rightOrder = orderBySlug.get(right.slug) ?? 0
        return leftOrder !== rightOrder
            ? leftOrder - rightOrder
            : left.fallbackLabel.localeCompare(right.fallbackLabel)
    })

    const peak = bars.reduce((highest, bar) => Math.max(highest, bar.exp), 0)
    const total = bars.reduce((sum, bar) => sum + bar.exp, 0)

    return {
        bars,
        peak,
        axisMax: niceAxisMax(peak),
        total,
        isEmpty: bars.length === 0 || peak <= 0,
    }
}
