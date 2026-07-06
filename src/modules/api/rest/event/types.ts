/**
 * Request/response DTOs for the event REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.event.web.dto.EventViews`.
 * Generic view names are prefixed with `Event` to avoid barrel collisions
 * (e.g. course `CertificateView`).
 */

export interface CreateEventRequest {
    type: string
    title: string
    slug: string
    description: string
    startAt: string
    endAt: string
    locationType: string
    venue?: string
    capacity?: number
    waitlistEnabled: boolean
    checkinOpenBeforeMinutes?: number
    attendanceMinMinutes?: number
    rewardXp: number
    rewardCoin: number
    certificateEnabled: boolean
    courseId?: string
}

export interface EventView {
    id: string
    type: string
    title: string
    slug: string
    description: string
    status: string
    startAt: string
    endAt: string
    locationType: string
    capacity?: number
    seatsLeft?: number
    myRegistrationStatus?: string
}

export interface EventRegistrationView {
    id: string
    eventId: string
    status: string
    waitlistPosition?: number
    registeredAt: string
}

export interface EventQrView {
    qrToken: string
}

export interface EventScanRequest {
    qrToken: string
}

export interface EventManualCheckinRequest {
    userId: string
}

export interface EventRecordingRequest {
    recordingUrl: string
}

export interface EventCertificateView {
    id: string
    eventId: string
    certificateName: string
    verifyCode: string
    issuedAt: string
}

export interface EventCertificateVerifyView {
    eventTitle?: string
    userDisplayName?: string
    issuedAt?: string
    valid: boolean
}

export interface EventAttendanceRow {
    userId: string
    status: string
    checkinMethod?: string
    checkedInAt?: string
}

export interface EventAttendanceView {
    rows: EventAttendanceRow[]
}
