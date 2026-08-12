import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import en from "./en.json"
import vi from "./vi.json"

/**
 * Guard — every STATIC translation key the code asks for must exist in BOTH catalogs.
 *
 * next-intl does not throw on a missing key: it logs and renders the key path itself.
 * So `t("wallet.topup")` shipped for three weeks rendering the literal string
 * "wallet.topup" as the aria-label of the wallet top-up button (the real key is
 * `wallet.actions.topup`) and nothing caught it — `AccountMenuDropdown` has no test,
 * and `messages.icu.test.ts` only checks that the STRINGS parse as ICU, never that a
 * key the code calls exists. This closes that hole.
 *
 * DELIBERATELY BLIND to dynamic keys — `t(key)`, `t(`ns.${x}`)`, `t(MAP[k].labelKey)`
 * (~300 call sites, e.g. `useAppNav` resolving `nav.<module>`): a static scanner cannot
 * know the value, and guessing would produce false alarms that get the guard disabled.
 * It also skips files that receive the translator as a parameter (`utils/ai.ts`).
 * Static coverage is ~92% of call sites, which is where this class of typo lives.
 */

const SRC = join(process.cwd(), "src")

/** Recursively collects .ts/.tsx sources, skipping tests (they mock the translator). */
const sourceFiles = (dir: string): Array<string> =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) return sourceFiles(full)
        if (!/\.tsx?$/.test(entry.name)) return []
        if (/\.(test|spec)\.tsx?$/.test(entry.name)) return []
        return [full]
    })

/** `const t = useTranslations("ns")` / `useTranslations()` / `await getTranslations({...})`. */
const BINDING = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:"([^"]*)"|'([^']*)')?/g

/** Leaf paths of a catalog, e.g. "wallet.actions.topup". */
const leaves = (node: unknown, prefix = ""): Array<string> => {
    if (typeof node !== "object" || node === null) return [prefix]
    return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
        leaves(value, prefix ? `${prefix}.${key}` : key),
    )
}

const viKeys = new Set(leaves(vi))
const enKeys = new Set(leaves(en))

interface Call { file: string, key: string }

/** Every static `t("…")` / `t.rich("…")` call, resolved against its binding's namespace. */
const collectCalls = (): Array<Call> => {
    const calls: Array<Call> = []
    for (const file of sourceFiles(SRC)) {
        // strip comments first: docblocks quote example calls (`t("types.<x>")`) that are
        // not real lookups, and one such false alarm is enough to get a guard switched off
        const code = readFileSync(file, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*\/\/.*$/gm, "")
        // one binding name can be declared with several namespaces in the same file —
        // accept the key if ANY of them resolves (6 files do this today)
        const namespaces = new Map<string, Array<string>>()
        for (const match of code.matchAll(BINDING)) {
            const name = match[1]
            const ns = match[2] ?? match[3] ?? ""
            namespaces.set(name, [...(namespaces.get(name) ?? []), ns])
        }
        for (const [name, spaces] of namespaces) {
            // only a STRING literal argument; anything else is a dynamic key we skip
            const call = new RegExp(`\\b${name}(?:\\.(?:rich|markup|raw))?\\(\\s*"([^"\\n]+)"\\s*[,)]`, "g")
            for (const match of code.matchAll(call)) {
                const suffix = match[1]
                calls.push({
                    file: file.slice(SRC.length + 1).replace(/\\/g, "/"),
                    key: spaces.map((ns) => (ns ? `${ns}.${suffix}` : suffix)).find((k) => viKeys.has(k))
                        ?? (spaces[0] ? `${spaces[0]}.${suffix}` : suffix),
                })
            }
        }
    }
    return calls
}

describe("i18n keys — every static key the code calls exists in the catalog", () => {
    const calls = collectCalls()

    it("scans a meaningful number of call sites (guard is actually wired up)", () => {
        // a refactor that breaks the scanner must fail loudly, not silently pass on 0 calls
        expect(calls.length).toBeGreaterThan(2_000)
    })

    it("resolves every static key in vi.json", () => {
        const missing = calls.filter((call) => !viKeys.has(call.key))
        expect(missing.map((m) => `${m.file} → ${m.key}`)).toEqual([])
    })

    it("resolves every static key in en.json", () => {
        const missing = calls.filter((call) => !enKeys.has(call.key))
        expect(missing.map((m) => `${m.file} → ${m.key}`)).toEqual([])
    })

    it("keeps vi and en at the same shape (a key added to one locale must land in both)", () => {
        expect([...viKeys].filter((k) => !enKeys.has(k))).toEqual([])
        expect([...enKeys].filter((k) => !viKeys.has(k))).toEqual([])
    })
})
