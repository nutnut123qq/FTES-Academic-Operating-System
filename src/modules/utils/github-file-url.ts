/**
 * Parsed GitHub repository coordinates from a submission URL.
 */
export interface GithubRepoRef {
    /** Repository owner (user or org). */
    owner: string
    /** Repository name without `.git`. */
    repo: string
    /** Branch or ref used in blob/tree links (defaults to `main`). */
    branch: string
}

/**
 * File path and optional line parsed from a feedback location hint.
 */
export interface FeedbackLocationRef {
    /** Path relative to the repository root. */
    filePath: string
    /** 1-based line number when present in the hint. */
    line?: number
}

/** Params for {@link buildGithubFileUrl}. */
export interface BuildGithubFileUrlParams {
    /** GitHub repository URL from the submission attempt. */
    repositoryUrl: string
    /** Location hint from feedback, e.g. `src/foo.ts:42`. */
    location: string
}

/**
 * Extracts owner, repo, and branch from common GitHub repository URLs.
 * @param repositoryUrl - Raw submission URL.
 * @returns Parsed ref, or null when the URL is not a GitHub repo link.
 */
export const parseGithubRepoRef = (repositoryUrl: string): GithubRepoRef | null => {
    try {
        const parsed = new URL(repositoryUrl.trim())
        const host = parsed.hostname.replace(/^www\./, "")
        if (host !== "github.com") {
            return null
        }
        const segments = parsed.pathname.split("/").filter(Boolean)
        if (segments.length < 2) {
            return null
        }
        const owner = segments[0]
        const repo = segments[1].replace(/\.git$/i, "")
        const section = segments[2]
        if (section === "tree" || section === "blob") {
            const branch = segments[3] ?? "main"
            return {
                owner,
                repo,
                branch: decodeURIComponent(branch),
            }
        }
        return {
            owner,
            repo,
            branch: "main",
        }
    } catch {
        return null
    }
}

/**
 * Parses `path/to/file.ts:line` feedback locations.
 * @param location - Location hint from the grader.
 * @returns File path and optional line number.
 */
export const parseFeedbackLocation = (location: string): FeedbackLocationRef | null => {
    const trimmed = location.trim()
    if (!trimmed) {
        return null
    }
    const lineMatch = trimmed.match(/^(.+):(\d+)$/)
    if (lineMatch) {
        return {
            filePath: lineMatch[1],
            line: Number.parseInt(lineMatch[2], 10),
        }
    }
    return {
        filePath: trimmed,
    }
}

/**
 * Builds a GitHub blob URL for a feedback location inside the submitted repository.
 * @param params - Repository URL and location hint.
 * @returns Absolute GitHub URL, or null when parsing fails.
 */
export const buildGithubFileUrl = (params: BuildGithubFileUrlParams): string | null => {
    const repoRef = parseGithubRepoRef(params.repositoryUrl)
    const locationRef = parseFeedbackLocation(params.location)
    if (!repoRef || !locationRef?.filePath) {
        return null
    }
    const encodedPath = locationRef.filePath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")
    const branch = encodeURIComponent(repoRef.branch)
    let url = `https://github.com/${repoRef.owner}/${repoRef.repo}/blob/${branch}/${encodedPath}`
    if (locationRef.line != null && Number.isFinite(locationRef.line) && locationRef.line > 0) {
        url += `#L${locationRef.line}`
    }
    return url
}
