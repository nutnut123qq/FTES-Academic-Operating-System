"use client"

import React from "react"
import { TwoFactorSetup } from "@/components/features/authentication/TwoFactorSetup"

/**
 * TwoFactorCard — "bật 2FA Authenticate" of the security section. Mounts the
 * existing {@link TwoFactorSetup} as-is: it already talks to the four real MFA
 * endpoints (status / enrol / activate / disable) and ships its own titled card,
 * so this wrapper adds NO chrome of its own — a heading + border here would read
 * as a card inside a card.
 *
 * The only thing it does add is neutralising `TwoFactorSetup`'s `mx-auto
 * max-w-md`, which is right on the standalone `/authentication/two-factor` page
 * (a centred auth card) but would leave this block floating in the middle of a
 * left-aligned settings column. The component takes no `className`, hence the
 * child selector rather than a prop.
 */
export const TwoFactorCard = () => {
    return (
        <div className="[&>div]:mx-0 [&>div]:max-w-none">
            <TwoFactorSetup />
        </div>
    )
}
