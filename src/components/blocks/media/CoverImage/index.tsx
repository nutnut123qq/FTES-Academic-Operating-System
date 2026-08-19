"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link CoverImage} block. */
export interface CoverImageProps extends WithClassNames<undefined> {
    /** Image source URL (null/undefined → empty framed surface). */
    src?: string | null
    /** Accessible alt text. */
    alt: string
    /**
     * `sizes` cho optimizer — bề rộng THẬT mà ảnh chiếm trên màn. Mặc định là lưới thẻ 1/2/3 cột.
     * Đặt sai chỉ khiến tải ảnh to hơn cần, không vỡ giao diện.
     */
    sizes?: string
}

/** Bề rộng mặc định: lưới thẻ 1 cột (mobile) / 2 cột (sm) / 3 cột (lg). */
const DEFAULT_SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"

/**
 * Ảnh bìa/thumbnail có khung: hộp 16:9 cố định, bo góc, `object-cover`.
 *
 * <p><b>Đi qua `next/image`.</b> Bản trước dùng `<img>` thô kèm chú thích "ảnh đến từ host
 * image-delivery của BE nên không cần khai remotePatterns" — đường tắt đó đổi một dòng cấu hình
 * lấy việc tải NGUYÊN ảnh gốc. Đã đo trên trang chủ: những tấm 611 KB – 2.197 KB đi thẳng từ host
 * gốc, trong khi khung hiển thị chỉ vài trăm pixel.
 *
 * <p><b>Có ĐƯỜNG LÙI, và đó là phần quan trọng nhất.</b> Nếu host của ảnh chưa nằm trong
 * `images.remotePatterns`, optimizer trả 400 và ảnh sẽ BIẾN MẤT lặng lẽ — đã xảy ra thật với ảnh
 * banner. Nên khi optimizer lỗi, component rơi về `<img>` thô: ảnh nặng hơn, nhưng CÒN. Mất ảnh
 * là lỗi người dùng thấy ngay; ảnh nặng thì không.
 */
export const CoverImage = ({
    src,
    alt,
    className,
    sizes = DEFAULT_SIZES,
}: CoverImageProps) => {
    const [optimizerFailed, setOptimizerFailed] = React.useState(false)

    // Đổi ảnh thì thử lại optimizer từ đầu — cờ hỏng của ảnh CŨ không được dính sang ảnh mới.
    React.useEffect(() => {
        setOptimizerFailed(false)
    }, [src])

    return (
        <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-secondary", className)}>
            {src ? (
                optimizerFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={alt} loading="lazy" className="size-full object-cover" />
                ) : (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes={sizes}
                        className="object-cover"
                        onError={() => setOptimizerFailed(true)}
                    />
                )
            ) : null}
        </div>
    )
}
