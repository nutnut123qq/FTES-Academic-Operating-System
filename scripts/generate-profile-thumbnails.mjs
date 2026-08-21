import { mkdir, readdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const publicRoot = path.resolve("public", "gamification")
const outputDir = path.join(publicRoot, "profile-thumbnails")
// `badges` = the five TIER medallions (bronze…diamond). They belong here for the same
// reason the other three do: they are pinned next to a name at 16px, and the originals
// are ~260 KB each. Must stay in step with the alternation in src/utils/profileAsset.ts —
// a group listed in one place but not the other either ships the full-size original or
// points at a thumbnail that was never generated.
const groups = ["avatars", "frames", "achievements", "badges"]
const supported = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp"])

await mkdir(outputDir, { recursive: true })

let generated = 0
for (const group of groups) {
    const sourceDir = path.join(publicRoot, group)
    for (const filename of await readdir(sourceDir)) {
        const extension = path.extname(filename).toLowerCase()
        if (!supported.has(extension)) {
            continue
        }
        const stem = path.basename(filename, extension)
        const output = path.join(outputDir, `${group}-${stem}.webp`)
        await sharp(path.join(sourceDir, filename), { density: 144 })
            .resize(320, 320, { fit: "contain" })
            .webp({ quality: 82, alphaQuality: 90, effort: 6 })
            .toFile(output)
        generated += 1
    }
}

console.log(`Generated ${generated} profile thumbnails in ${outputDir}`)
