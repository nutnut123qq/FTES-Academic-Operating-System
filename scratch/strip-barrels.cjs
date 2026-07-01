/* eslint-disable */
/**
 * Codemod — strip aggregating barrels from the FE.
 *
 * For every `@/...` import, resolve each imported symbol to its REAL declaration file
 * (walking through any number of intermediate `export *` barrels in one hop via the
 * aliased symbol), then rewrite the import to point straight at that file. Multi-symbol
 * imports that span several files are split into one import per target file.
 *
 * Modes:
 *   node scratch/strip-barrels.cjs --dry     # report only, no writes
 *   node scratch/strip-barrels.cjs --rewrite # apply import rewrites + save
 *   node scratch/strip-barrels.cjs --prune   # delete pure re-export barrels with 0 importers
 */
const path = require("path")
const { Project, Node } = require("ts-morph")

const MODE = process.argv.includes("--rewrite")
    ? "rewrite"
    : process.argv.includes("--prune")
        ? "prune"
        : "dry"

const project = new Project({ tsConfigFilePath: path.resolve("tsconfig.json") })
const SRC = path.resolve("src").replace(/\\/g, "/")

const norm = (p) => p.replace(/\\/g, "/")
const underSrc = (p) => norm(p).startsWith(SRC + "/")
const isDts = (p) => norm(p).endsWith(".d.ts")

/** Absolute file path -> `@/...` alias (strip src, ext, trailing /index). */
function toAlias(filePath) {
    let rel = norm(filePath).slice(SRC.length + 1) // after "src/"
    rel = rel.replace(/\.(tsx?|jsx?)$/, "")
    rel = rel.replace(/\/index$/, "")
    return "@/" + rel
}

/**
 * Resolve an import/alias symbol to { file, realName } where file = its true declaration
 * source file (under src) and realName = the name it is EXPORTED as in that file ("default"
 * for a default export). Returns null when it resolves outside src / cannot resolve.
 */
function resolveSymbol(symbol) {
    if (!symbol) return null
    let s = symbol
    try { const a = s.getAliasedSymbol(); if (a) s = a } catch {}
    const decls = s.getDeclarations() || []
    const pick = decls.find((d) => {
        const f = d.getSourceFile().getFilePath()
        return underSrc(f) && !isDts(f)
    }) || decls[0]
    if (!pick) return null
    const f = pick.getSourceFile().getFilePath()
    if (!underSrc(f) || isDts(f)) return null
    return { file: f, realName: s.getName() }
}

const stats = {
    files: 0, declsScanned: 0, declsRewritten: 0,
    namespaceSkipped: [], unresolved: [], external: [],
    byTarget: {},
}

function processFile(sf) {
    const filePath = sf.getFilePath()
    if (!underSrc(filePath) || isDts(filePath)) return
    const selfAlias = toAlias(filePath)
    let changed = false
    const newStructures = []
    const toRemove = []

    for (const imp of sf.getImportDeclarations()) {
        const spec = imp.getModuleSpecifierValue()
        if (!spec.startsWith("@/")) continue
        stats.declsScanned++

        const ns = imp.getNamespaceImport()
        if (ns) { stats.namespaceSkipped.push(`${selfAlias} <- ${spec} (* as ${ns.getText()})`); continue }

        const declTypeOnly = imp.isTypeOnly()
        // group: moduleSpecifier -> { named: [...], default?: name }
        const groups = new Map()
        const groupFor = (m) => { if (!groups.has(m)) groups.set(m, { named: [], default: null }); return groups.get(m) }
        let resolvedAll = true

        const def = imp.getDefaultImport()
        if (def) {
            const r = resolveSymbol(def.getSymbol())
            if (!r) { stats.unresolved.push(`${selfAlias} <- ${spec} (default ${def.getText()})`); resolvedAll = false }
            else { const m = toAlias(r.file); groupFor(m).default = def.getText() }
        }

        for (const ni of imp.getNamedImports()) {
            const importedName = ni.getName()
            const localName = ni.getAliasNode() ? ni.getAliasNode().getText() : importedName
            const niType = ni.isTypeOnly()
            const r = resolveSymbol(ni.getNameNode().getSymbol())
            if (!r) { stats.unresolved.push(`${selfAlias} <- ${spec} { ${importedName} }`); resolvedAll = false; continue }
            const m = toAlias(r.file)
            const g = groupFor(m)
            // A symbol re-exported as default in the target file must become a default import.
            if (r.realName === "default") { g.default = localName }
            else { g.named.push({ name: r.realName, alias: localName !== r.realName ? localName : null, isTypeOnly: niType }) }
        }

        if (!resolvedAll) continue
        if (groups.size === 0) continue

        // No-op: single group whose specifier equals original (already deep / not a barrel),
        // and never the file importing itself.
        const specifiers = [...groups.keys()]
        const isNoop = specifiers.length === 1 && specifiers[0] === spec
        if (isNoop) continue
        // never produce a self-import
        if (specifiers.includes(selfAlias)) { stats.unresolved.push(`${selfAlias} <- ${spec} (resolves to self)`); continue }

        for (const [m, g] of groups) {
            stats.byTarget[m] = (stats.byTarget[m] || 0) + 1
            newStructures.push({
                isTypeOnly: declTypeOnly,
                defaultImport: g.default || undefined,
                namedImports: g.named.map((n) => ({ name: n.name, alias: n.alias || undefined, isTypeOnly: n.isTypeOnly && !declTypeOnly ? true : undefined })),
                moduleSpecifier: m,
            })
        }
        toRemove.push(imp)
        changed = true
        stats.declsRewritten++
    }

    if (changed && MODE === "rewrite") {
        for (const imp of toRemove) imp.remove()
        sf.addImportDeclarations(newStructures)
        stats.files++
    } else if (changed) {
        stats.files++
    }
}

/** A pure re-export barrel: has exports, and every statement is an export/re-export with no own value/type declaration. */
function isPureBarrel(sf) {
    const stmts = sf.getStatements()
    if (stmts.length === 0) return false
    let hasExport = false
    for (const st of stmts) {
        if (Node.isExportDeclaration(st)) { hasExport = true; continue }
        if (Node.isImportDeclaration(st)) continue
        // anything else (function/class/var/interface/type/enum decl, expression) => not a pure barrel
        return false
    }
    return hasExport
}

if (MODE === "prune") {
    const deleted = []
    for (const sf of project.getSourceFiles()) {
        const f = sf.getFilePath()
        if (!underSrc(f) || isDts(f)) continue
        if (!/\/index\.(tsx?|jsx?)$/.test(norm(f))) continue
        if (!isPureBarrel(sf)) continue
        const referencing = sf.getReferencingSourceFiles().filter((r) => underSrc(r.getFilePath()))
        if (referencing.length === 0) { deleted.push(toAlias(f)); sf.delete() }
    }
    project.saveSync()
    console.log("PRUNED", deleted.length, "barrels:")
    deleted.sort().forEach((d) => console.log("  -", d))
    process.exit(0)
}

for (const sf of project.getSourceFiles()) processFile(sf)

if (MODE === "rewrite") project.saveSync()

console.log("MODE:", MODE)
console.log("import decls scanned (@/):", stats.declsScanned)
console.log("import decls rewritten   :", stats.declsRewritten)
console.log("files touched            :", stats.files)
console.log("namespace-import skips   :", stats.namespaceSkipped.length)
console.log("unresolved symbols       :", stats.unresolved.length)
console.log("\nTop rewrite targets:")
Object.entries(stats.byTarget).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([m, n]) => console.log(`  ${String(n).padStart(4)}  ${m}`))
if (stats.namespaceSkipped.length) { console.log("\nNamespace imports (need manual review):"); stats.namespaceSkipped.slice(0, 40).forEach((s) => console.log("  ", s)) }
if (stats.unresolved.length) { console.log("\nUnresolved (kept as-is):"); stats.unresolved.slice(0, 40).forEach((s) => console.log("  ", s)) }
