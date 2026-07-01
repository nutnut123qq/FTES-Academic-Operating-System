import type { 
    AdminPresignedUrlRequest, 
    AdminPresignedUrlResponse 
} from "./types"
import axios from "axios"
import { publicEnv } from "@/resources/env/public"

/**
 * Params for the admin presigned URL REST call.
 * Includes an API key passed as x-admin-api-key header.
 */
export interface AdminPresignedUrlParams {
    /** The request body. */
    request: AdminPresignedUrlRequest
    /** The API key for admin authentication. */
    apiKey: string
}

/**
 * Calls the admin presigned URL endpoint and returns presigned upload URLs.
 *
 * @param params - The request body and API key.
 * @returns Presigned URLs for each S3 provider on success; throws on failure.
 */
export const adminPresignedUrl = async (
    params: AdminPresignedUrlParams,
): Promise<AdminPresignedUrlResponse> => {
    /** The URL of the presigned URL endpoint. */
    const url = `${publicEnv().api.http}/admin/presigned-url`
    /** The axios instance. */
    const axiosInstance = axios.create(
        {
            baseURL: publicEnv().api.http,
            headers: { 
                "Content-Type": "application/json",
                "x-admin-api-key": params.apiKey,
            },
        }
    )
    /** The response from the presigned URL endpoint. */
    const response = await axiosInstance.post<AdminPresignedUrlResponse>(url, params.request)
    /** The data from the response. */
    return response.data
}
