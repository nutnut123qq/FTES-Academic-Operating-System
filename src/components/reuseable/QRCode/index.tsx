import React from "react"
import { cn } from "@heroui/react"
import { QRCodeSVG } from "qrcode.react"
import type { WithClassNames } from "@/modules/types/base/class-name"

export interface QRCodeProps extends WithClassNames<undefined> {
    size: number
    data: string
    icon?: React.ReactNode
}

/**
 * Locally-rendered QR (qrcode.react → inline SVG). No third-party image service, so the
 * payload (e.g. the VietQR bank string) never leaves the browser and the code still
 * renders offline / when an external QR host is blocked. Kept fixed black-on-white
 * regardless of the page theme so banking apps always scan it; error-correction is
 * raised to "H" when an icon overlays the centre.
 */
export const QRCode = ({ size, data, icon, className }: QRCodeProps) => {
    return (
        <div className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
            <QRCodeSVG
                value={data}
                size={size}
                bgColor="#ffffff"
                fgColor="#000000"
                level={icon ? "H" : "M"}
                marginSize={4}
                className="rounded-lg"
            />
            {icon ? (
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background p-1 shadow-sm">
                    {icon}
                </div>
            ) : null}
        </div>
    )
}
