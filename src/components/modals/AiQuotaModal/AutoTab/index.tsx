"use client"

import React from "react"
import {
    QuotaLane,
} from "../QuotaLane"
import {
    QuotaLaneVariant,
} from "../types"

/**
 * AI quota modal — Auto tab (credit windows from `myCreditUsage`).
 */
export const AiQuotaAutoTab = () => (
    <QuotaLane variant={QuotaLaneVariant.Auto} />
)
