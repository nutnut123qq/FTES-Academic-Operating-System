"use client"

import useSWR from "swr"
import { getInvoice, type InvoiceView } from "@/modules/api/rest/commerce"

/**
 * SWR query wrapper for {@link getInvoice}.
 */
export const useGetInvoiceSwr = (orderId: string) => {
    const swr = useSWR<InvoiceView, Error>(
        ["GET_INVOICE_SWR", orderId],
        () => getInvoice(orderId),
    )

    return swr
}
