"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    cn,
    toast,
} from "@heroui/react"
import {
    useRouter,
} from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    UploadStatus,
} from "./enums"
import type {
    ProcessResult,
    ProviderUploadStatus,
} from "./types"
import {
    LoadingScreen,
} from "./LoadingScreen"
import {
    TopBar,
} from "./TopBar"
import {
    AdminUploadVideoHeader,
} from "./Header"
import {
    FileSelectionCard,
} from "./FileSelectionCard"
import {
    UploadProgressCard,
} from "./UploadProgressCard"
import { usePostAdminPresignedUrlSwr } from "@/hooks/swr/api/rest/mutations/usePostAdminPresignedUrlSwr"
import { usePostAdminProcessVideoSwr } from "@/hooks/swr/api/rest/mutations/usePostAdminProcessVideoSwr"
import { useRestWithToast } from "@/modules/toast/hooks"
import { useAppSelector } from "@/redux/hooks"
import type { AdminPresignedUrlItem } from "@/modules/api/rest/admin-presigned-url/types"

/** Props for {@link AdminUploadVideo}. */
export type AdminUploadVideoProps = WithClassNames<undefined>

/**
 * Admin video upload tool container.
 *
 * Owns the API key gate, file/upload/process state, the presigned-URL +
 * process-video SWR triggers, and the upload orchestration; renders the
 * presentational cards. "use client" because it relies on browser APIs
 * (XMLHttpRequest, clipboard, drag/drop) and local state.
 * @param props - optional className forwarded to the wrapper div
 */
export const AdminUploadVideo = ({
    className,
}: AdminUploadVideoProps = {}) => {
    const apiKey = useAppSelector((state) => state.admin.apiKey)
    const router = useRouter()

    /** Redirect to admin page if no API key is set */
    useEffect(() => {
        if (!apiKey) {
            router.replace("../../admin")
        }
    }, [apiKey, router])

    /** Selected file to upload */
    const [file, setFile] = useState<File | null>(null)
    /** Custom S3 key (path) */
    const [objectKey, setObjectKey] = useState("")
    /** Per-provider upload status */
    const [uploads, setUploads] = useState<Array<ProviderUploadStatus>>([])
    /** Is the presigned URL request in flight */
    const [isRequesting, setIsRequesting] = useState(false)
    /** Track whether upload has been performed */
    const [uploadDone, setUploadDone] = useState(false)
    /** Track whether process-video is in flight */
    const [isProcessing, setIsProcessing] = useState(false)
    /** The uploaded video URL (first provider) to pass to process-video */
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
    /** Result from the process-video API */
    const [processResult, setProcessResult] = useState<ProcessResult | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const { trigger: triggerPresignedUrl } = usePostAdminPresignedUrlSwr()
    const { trigger: triggerProcessVideo } = usePostAdminProcessVideoSwr()
    const runRest = useRestWithToast()

    /** Handle file selection */
    const onFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selected = e.target.files?.[0]
            if (!selected) return
            setFile(selected)
            setUploads([])
            setUploadDone(false)
            if (!objectKey) {
                const ts = Date.now()
                const safeName = selected.name.replace(/\s+/g, "-")
                setObjectKey(`videos/${ts}-${safeName}`)
            }
        },
        [objectKey],
    )

    /** Handle file drop */
    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            const dropped = e.dataTransfer.files?.[0]
            if (dropped) {
                setFile(dropped)
                setUploads([])
                setUploadDone(false)
                if (!objectKey) {
                    const ts = Date.now()
                    const safeName = dropped.name.replace(/\s+/g, "-")
                    setObjectKey(`videos/${ts}-${safeName}`)
                }
            }
        },
        [objectKey],
    )

    /** Allow dropping by preventing the browser's default dragover behavior. */
    const onDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
        },
        [],
    )

    /** Open the native file picker when the drop zone is clicked. */
    const onClickZone = useCallback(
        () => {
            fileInputRef.current?.click()
        },
        [],
    )

    /** Update the S3 object key from the input. */
    const onChangeObjectKey = useCallback(
        (value: string) => setObjectKey(value),
        [],
    )

    /** Upload file to a single presigned URL */
    const uploadToProvider = useCallback(
        async (
            presigned: AdminPresignedUrlItem,
            fileToUpload: File,
            idx: number,
        ) => {
            return new Promise<void>((resolve) => {
                const xhr = new XMLHttpRequest()

                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100)
                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === idx ? { ...u, progress: pct } : u,
                            ),
                        )
                    }
                })

                xhr.addEventListener("load", () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === idx
                                    ? { ...u, status: UploadStatus.Success, progress: 100 }
                                    : u,
                            ),
                        )
                    } else {
                        setUploads((prev) =>
                            prev.map((u, i) =>
                                i === idx
                                    ? {
                                        ...u,
                                        status: UploadStatus.Error,
                                        error: `HTTP ${xhr.status}`,
                                    }
                                    : u,
                            ),
                        )
                    }
                    resolve()
                })

                xhr.addEventListener("error", () => {
                    setUploads((prev) =>
                        prev.map((u, i) =>
                            i === idx
                                ? {
                                    ...u,
                                    status: UploadStatus.Error,
                                    error: "Network error",
                                }
                                : u,
                        ),
                    )
                    resolve()
                })

                xhr.open("PUT", presigned.url)
                xhr.setRequestHeader(
                    "Content-Type",
                    fileToUpload.type || "application/octet-stream",
                )
                setUploads((prev) =>
                    prev.map((u, i) =>
                        i === idx ? { ...u, status: UploadStatus.Uploading } : u,
                    ),
                )
                xhr.send(fileToUpload)
            })
        },
        [],
    )

    /** Full upload flow: get presigned URLs → upload to each provider */
    const onUpload = useCallback(async () => {
        if (!file || !objectKey) {
            toast.warning("Missing fields", {
                description: "Please select a file and set an object key.",
            })
            return
        }

        setIsRequesting(true)
        setUploadDone(false)

        // Request the presigned URLs (REST write). `runRest` toasts on failure.
        const presignedResult = await runRest(
            () =>
                triggerPresignedUrl({
                    request: {
                        key: objectKey,
                        contentType: file.type || "video/mp4",
                    },
                    apiKey,
                }),
            { showSuccessToast: false },
        )
        if (!presignedResult) {
            setIsRequesting(false)
            return
        }

        const items: Array<AdminPresignedUrlItem> = presignedResult.data ?? []
        if (items.length === 0) {
            toast.danger("No presigned URLs", {
                description: "The server returned an empty list.",
            })
            setIsRequesting(false)
            return
        }

        // Initialize per-provider statuses
        const initial: Array<ProviderUploadStatus> = items.map((item) => ({
            provider: item.provider,
            url: item.url,
            status: UploadStatus.Idle,
            progress: 0,
        }))
        setUploads(initial)
        setIsRequesting(false)

        // Upload to all providers concurrently (REST writes via XHR PUT).
        await runRest(
            () =>
                Promise.all(
                    items.map((item, idx) => uploadToProvider(item, file, idx)),
                ),
            { successMessage: "Video has been uploaded to all providers." },
        )

        setUploadDone(true)
        // Save first provider URL for process-video
        setUploadedVideoUrl(items[0].url.split("?")[0])
    }, [file, objectKey, apiKey, triggerPresignedUrl, uploadToProvider, runRest])

    /** Trigger video processing (FFmpeg encode + MPEG-DASH) on the backend */
    const onProcess = useCallback(async () => {
        if (!uploadedVideoUrl) {
            toast.warning("No video URL", {
                description: "Please upload a video first.",
            })
            return
        }
        setIsProcessing(true)
        setProcessResult(null)
        // Trigger backend video processing (REST write). `runRest` toasts the result.
        const result = await runRest(
            () =>
                triggerProcessVideo({
                    request: { url: uploadedVideoUrl },
                    apiKey,
                }),
            { showSuccessToast: false },
        )
        if (result) {
            setProcessResult({ jobId: result.jobId, message: result.message })
            toast.success("Processing started", {
                description: `Job ${result.jobId} enqueued.`,
            })
        }
        setIsProcessing(false)
    }, [uploadedVideoUrl, apiKey, triggerProcessVideo, runRest])

    /** Copy URL to clipboard */
    const onCopyUrl = useCallback((url: string) => {
        navigator.clipboard.writeText(url)
        toast.success("Copied!", {
            description: "Presigned URL copied to clipboard.",
        })
    }, [])

    /** Whether any provider upload is currently in progress. */
    const isUploading = useMemo(
        () => uploads.some((u) => u.status === UploadStatus.Uploading),
        [uploads],
    )

    if (!apiKey) {
        return <LoadingScreen />
    }

    return (
        <div className={cn("min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 md:p-8", className)}>
            <div className="mx-auto max-w-3xl space-y-6">
                <TopBar />

                <AdminUploadVideoHeader />

                <FileSelectionCard
                    file={file}
                    fileInputRef={fileInputRef}
                    objectKey={objectKey}
                    isRequesting={isRequesting}
                    isUploading={isUploading}
                    uploadDone={uploadDone}
                    isProcessing={isProcessing}
                    processResult={processResult}
                    onClickZone={onClickZone}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onFileChange={onFileChange}
                    onChangeObjectKey={onChangeObjectKey}
                    onUpload={onUpload}
                    onProcess={onProcess}
                />

                {uploads.length > 0 && (
                    <UploadProgressCard
                        uploads={uploads}
                        uploadDone={uploadDone}
                        onCopyUrl={onCopyUrl}
                    />
                )}
            </div>
        </div>
    )
}
