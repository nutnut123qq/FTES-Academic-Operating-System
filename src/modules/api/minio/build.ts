import { publicEnv } from "@/resources/env/public"

/**
 * Builds the URL for a Minio object.
 * @param key - The key of the Minio object.
 * @returns The URL for the Minio object.
 */
export const buildMinioUrl = (key: string) => {
    return `
    ${publicEnv().minio.url}/${publicEnv().minio.bucket}/${key}
    `
}