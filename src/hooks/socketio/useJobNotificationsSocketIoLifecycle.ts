import { useEffect } from "react"
import EventEmitter2 from "eventemitter2"
import { useLocale } from "next-intl"
import {
    SubscribeJobNotificationSocketIoPayload,
} from "./types"
import { PublicationEvent, SubscriptionEvent } from "./enums"
import { jobNotificationsSocket } from "./sockets"
import { useSocketConnectionStore } from "./connectionStore"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { applyIncompleteJobStatus } from "@/redux/slices/job"
import { setAiProcessingModalData } from "@/redux/slices/modal"
import { setJobStatusMessageForJob } from "@/redux/slices/socketio"
import type { JobStatusUpdatedSocketIoMessage } from "@/modules/types/socketio"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

/** Fan-out for listeners that are not couched in Redux. */
export const jobNotificationsSocketIoEventEmitter = new EventEmitter2()

/**
 * Lifecycle hook for the `/job_notifications` namespace — runs ONCE in {@link SocketIoSideEffects}.
 * Auto-connects on auth, subscribes incomplete jobs, fans out job status updates, and merges
 * status into Redux. Consumers do NOT call this; they use the `useJobNotificationsSocketIo`
 * accessor to get the singleton socket and `.emit()`.
 */
export const useJobNotificationsSocketIoLifecycle = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const dispatch = useAppDispatch()
    const incompleteJobs = useAppSelector((state) => state.job.incompleteJobs)
    const locale = useLocale()

    /** Wire connect / disconnect / message listeners. */
    useEffect(() => {
        const socket = jobNotificationsSocket
        const onConnect = () => {
            console.log("[Job notifications Socket] Connected.")
            useSocketConnectionStore.getState().setStatus("job_notifications", "connected")
        }
        const onMessage = (message: JobStatusUpdatedSocketIoMessage) => {
            jobNotificationsSocketIoEventEmitter.emit(
                SubscriptionEvent.JobStatusUpdated,
                message,
            )
        }
        const onDisconnect = (reason: string) => {
            console.log(`[Job notifications Socket] Disconnected — reason: ${reason}`)
            useSocketConnectionStore.getState().setStatus("job_notifications", "disconnected")
        }
        const onConnectError = (err: Error) => {
            console.error("[Job notifications Socket] Connection error:", err.message)
            useSocketConnectionStore.getState().setStatus("job_notifications", "disconnected")
        }
        socket.on("connect", onConnect)
        socket.on(SubscriptionEvent.JobStatusUpdated, onMessage)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", onConnectError)
        return () => {
            socket.off("connect", onConnect)
            socket.off(SubscriptionEvent.JobStatusUpdated, onMessage)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error", onConnectError)
        }
    }, [])

    /** Connect (or reconnect) when auth state changes. */
    useEffect(() => {
        if (!authenticated) {
            return
        }
        if (jobNotificationsSocket.connected) {
            jobNotificationsSocket.disconnect()
        }
        jobNotificationsSocket.auth = (cb) => cb({
            token: LocalStorage.getItemAsString(
                LocalStorageId.KeycloakAccessToken,
            ),
        })
        jobNotificationsSocket.connect()
    }, [authenticated])

    /** Emit `SubscribeJobNotification` for each row in `incompleteJobs` (from GraphQL + Redux). */
    useEffect(() => {
        if (incompleteJobs.length === 0) {
            return
        }
        for (const item of incompleteJobs) {
            const payload: SubscribeJobNotificationSocketIoPayload = {
                data: {
                    jobId: item.jobId,
                },
                locale,
            }
            jobNotificationsSocket.emit(
                PublicationEvent.SubscribeJobNotification,
                payload,
            )
        }
    }, [
        incompleteJobs,
        locale,
    ])

    /** Merge job status into Redux, mirror personal-project review state, and keep AI modal metadata in sync. */
    useEffect(() => {
        const onMessage = (message: JobStatusUpdatedSocketIoMessage) => {
            const jobId = message.data?.jobId
            if (!jobId) {
                return
            }
            dispatch(
                setJobStatusMessageForJob({
                    jobId,
                    message,
                }),
            )
            const status = message.data?.status
            if (status !== undefined) {
                dispatch(applyIncompleteJobStatus({ jobId, status }))
            }
            const category = message.data?.category
            if (category) {
                dispatch(
                    setAiProcessingModalData({
                        category,
                        jobId,
                    }),
                )
            }
        }
        jobNotificationsSocketIoEventEmitter.on(SubscriptionEvent.JobStatusUpdated, onMessage)
        return () => {
            jobNotificationsSocketIoEventEmitter.off(SubscriptionEvent.JobStatusUpdated, onMessage)
        }
    }, [dispatch])
}
