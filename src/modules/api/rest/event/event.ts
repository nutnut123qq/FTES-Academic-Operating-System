import { restRequest } from "@/modules/api/rest/client"
import type {
    CreateEventRequest,
    EventAttendanceView,
    EventCertificateVerifyView,
    EventCertificateView,
    EventManualCheckinRequest,
    EventQrView,
    EventRecordingRequest,
    EventRegistrationView,
    EventScanRequest,
    EventView,
} from "./types"

// ---------------- EventController ----------------

/**
 * Public event catalog. Hits the FE-facing alias `GET /api/v1/events`
 * (`EventCatalogAliasController`), which delegates to `EventController.list`
 * (`/api/v1/event/events`) — same payload, the path the events page is meant to call.
 */
export const getEvents = async (): Promise<EventView[]> =>
    restRequest<EventView[]>({
        method: "GET",
        url: "/events",
    })

export const getEventDetail = async (slug: string): Promise<EventView> =>
    restRequest<EventView>({
        method: "GET",
        url: `/event/events/${slug}`,
    })

export const registerEvent = async (id: string): Promise<EventRegistrationView> =>
    restRequest<EventRegistrationView>({
        method: "POST",
        url: `/event/events/${id}/registrations`,
    })

export const cancelEventRegistration = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/event/events/${id}/registrations/me`,
    })

export const getMyEventRegistrations = async (): Promise<EventRegistrationView[]> =>
    restRequest<EventRegistrationView[]>({
        method: "GET",
        url: "/event/registrations/me",
        authenticated: true,
    })

export const getEventRegistrationQr = async (id: string): Promise<EventQrView> =>
    restRequest<EventQrView>({
        method: "GET",
        url: `/event/registrations/${id}/qr`,
        authenticated: true,
    })

export const scanEventCheckin = async (request: EventScanRequest): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: "/event/checkins/scan",
        data: request,
    })

export const getMyEventCertificates = async (): Promise<EventCertificateView[]> =>
    restRequest<EventCertificateView[]>({
        method: "GET",
        url: "/event/certificates/me",
        authenticated: true,
    })

export const verifyEventCertificate = async (
    verifyCode: string,
): Promise<EventCertificateVerifyView> =>
    restRequest<EventCertificateVerifyView>({
        method: "GET",
        url: `/event/certificates/verify/${verifyCode}`,
    })

// ---------------- EventAdminController ----------------

export const createEvent = async (request: CreateEventRequest): Promise<string> =>
    restRequest<string>({
        method: "POST",
        url: "/event/admin/events",
        data: request,
    })

export const submitEvent = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/event/admin/events/${id}/submit`,
    })

export const cancelEvent = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/event/admin/events/${id}/cancel`,
    })

export const setEventRecording = async (
    id: string,
    request: EventRecordingRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/event/admin/events/${id}/recording`,
        data: request,
    })

export const manualCheckinEvent = async (
    id: string,
    request: EventManualCheckinRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/event/admin/events/${id}/checkins/manual`,
        data: request,
    })

export const getEventAttendance = async (id: string): Promise<EventAttendanceView> =>
    restRequest<EventAttendanceView>({
        method: "GET",
        url: `/event/admin/events/${id}/attendance`,
        authenticated: true,
    })
