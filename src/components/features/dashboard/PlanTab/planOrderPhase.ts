import { isPaidOrderStatus } from "@/modules/api/rest/commerce"

/**
 * What the plan-purchase dialog shows once an order exists.
 *
 * - `awaiting` — the QR is live, keep waiting for the bank webhook.
 * - `paid` — money arrived; the plan is being/has been granted.
 * - `expired` — the backend's `OrderExpireJob` closed the hold; the QR is dead.
 * - `failed` — the order died for another reason (cancelled / failed / refunded).
 */
export type PlanOrderPhase = "awaiting" | "paid" | "expired" | "failed"

/**
 * Translate a commerce order status into what the buyer is told.
 *
 * This is the only place the money path turns into words, so it is deliberately
 * conservative in BOTH directions:
 *
 * - Everything not known to be settled — including a status this build has never
 *   heard of, and the moment before the first poll answers — stays `awaiting`.
 *   Saying "failed" about an order that is still open makes people transfer a
 *   second time, and the poll is self-stopping anyway.
 * - `PAID` is not the only success: `SUCCESS` and `FULFILLING` are past it (money
 *   in, entitlement being granted), which is why the shared
 *   {@link isPaidOrderStatus} decides this arm rather than a local string compare.
 * - `EXPIRED` is kept apart from the other dead statuses because it is not a
 *   failure — nothing went wrong, the hold simply ran out, and a late transfer can
 *   still land. It gets its own copy ("create the order again"), not an error.
 * - `REFUNDED` reads as `failed`: the money came back, so the buyer holds no plan.
 *
 * @param status - `OrderView.status` from the poll, or the status the mutation
 *                 seeded; `undefined` before the first answer.
 */
export const planOrderPhase = (status?: string | null): PlanOrderPhase => {
    if (isPaidOrderStatus(status ?? undefined)) return "paid"
    if (status === "EXPIRED") return "expired"
    if (status === "FAILED" || status === "CANCELLED" || status === "REFUNDED") return "failed"
    return "awaiting"
}
