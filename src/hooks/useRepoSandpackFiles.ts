"use client"

import useSWR from "swr"
import type { SandpackFiles } from "@codesandbox/sandpack-react"
import { publicEnv } from "@/resources/env/public"
import { querySandboxRepoUrl } from "@/modules/api/graphql/queries/query-sandbox-repo-url"

export interface RepoSandpackResult {
    files: SandpackFiles
    dependencies: Record<string, string>
}

/** Plain Sandpack file map stored in Minio by RepoSynchronizerService. */
type RepoFileMap = Record<string, { code: string }>

/** Split package.json deps out of the raw file map into a Sandpack result. */
const parseFileMap = (raw: RepoFileMap): RepoSandpackResult => {
    let dependencies: Record<string, string> = {}
    if (raw["/package.json"]) {
        try {
            const pkg = JSON.parse(raw["/package.json"].code)
            dependencies = {
                ...(pkg.dependencies ?? {}),
                ...(pkg.devDependencies ?? {}),
            }
        } catch { /* ignore */ }
        delete raw["/package.json"]
    }

    return { files: raw as SandpackFiles, dependencies }
}

/**
 * Fetch non-premium snapshot directly from the public Minio URL.
 * Works because RepoSynchronizerService sets bucket policy to allow
 * anonymous GET on the `repo/` prefix at sync time.
 */
const fetchPublic = async (
    repoName: string,
    githubDir: string,
): Promise<RepoSandpackResult> => {
    const { url, bucket } = publicEnv().minio
    const cdnUrl = `${url}/${bucket}/repo/${repoName}/${githubDir}.json`
    const res = await fetch(cdnUrl)
    if (!res.ok) throw new Error(`Repo CDN ${res.status}: ${cdnUrl}`)
    return parseFileMap(await res.json() as RepoFileMap)
}

/**
 * Fetch premium snapshot via a BE-issued presigned Minio URL.
 * BE verifies enrollment before issuing the URL.
 */
const fetchPresigned = async (contentId: string): Promise<RepoSandpackResult> => {
    const result = await querySandboxRepoUrl({ request: { contentId } })
    const presignedUrl = result.data?.sandboxRepoUrl
    if (!presignedUrl) throw new Error("No presigned URL returned for sandbox lesson")
    const res = await fetch(presignedUrl)
    if (!res.ok) throw new Error(`Presigned fetch failed: ${res.status}`)
    return parseFileMap(await res.json() as RepoFileMap)
}

/**
 * Fetches the lesson's Sandpack file tree from CDN.
 *
 * - Non-premium: public Minio URL — no auth, zero latency overhead.
 *   Bucket policy for `repo/*` is set to public-read by RepoSynchronizerService.
 * - Premium: BE issues a time-limited presigned URL after verifying enrollment,
 *   then the snapshot is fetched directly from Minio.
 */
export const useRepoSandpackFiles = (
    contentId: string | null | undefined,
    githubBaseUrl: string | null | undefined,
    githubDir: string | null | undefined,
    isPremium: boolean | null | undefined,
) => {
    const enabled = !!contentId && !!githubBaseUrl && !!githubDir
    const repoName = githubBaseUrl?.split("/").at(-1) ?? ""

    const { data, isLoading, error } = useSWR<RepoSandpackResult>(
        enabled ? ["repo-sandpack", contentId, isPremium] : null,
        () =>
            isPremium
                ? fetchPresigned(contentId!)
                : fetchPublic(repoName, githubDir!),
        { revalidateOnFocus: false, revalidateOnReconnect: false },
    )

    return {
        files: data?.files ?? {},
        dependencies: data?.dependencies ?? {},
        isLoading,
        error,
    }
}
