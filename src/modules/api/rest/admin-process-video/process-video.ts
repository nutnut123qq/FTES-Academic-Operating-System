import type { 
    AdminProcessVideoRequest, 
    AdminProcessVideoResponse 
} from "./types"
import axios from "axios"
import { publicEnv } from "@/resources/env/public"

/**
 * Params for the admin process-video REST call.
 * Includes an API key passed as x-admin-api-key header.
 */
export interface AdminProcessVideoParams {
    /** The request body. */
    request: AdminProcessVideoRequest
    /** The API key for admin authentication. */
    apiKey: string
}

/**
 * Calls the admin process-video endpoint to enqueue a video processing job.
 *
 * @param params - The request body and API key.
 * @returns Job ID and message on success; throws on failure.
 */
export const adminProcessVideo = async (
    params: AdminProcessVideoParams,
): Promise<AdminProcessVideoResponse> => {
    /** The URL of the process-video endpoint. */
    const url = `${publicEnv().api.http}/admin/process-video`
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
    /** The response from the process-video endpoint. */
    const response = await axiosInstance.post<AdminProcessVideoResponse>(url, params.request)
    /** The data from the response. */
    return response.data
}
