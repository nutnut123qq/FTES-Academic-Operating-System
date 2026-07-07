"use client"

import useSWR from "swr"

/** Product categories in the §13 Marketplace catalog. */
export type ProductCategory = "merch" | "premium" | "aiCredits" | "voucher" | "courseUnlock"

/** A single catalog product, priced in FTES Coin. */
export interface Product {
    id: string
    name: string
    category: ProductCategory
    priceCoin: number
    description: string
}

// ponytail: mock BE — no marketplace endpoint yet. Deterministic sample catalog,
// SWR-shaped so the catalog can swap to a real GraphQL query (products()) later
// without touching the hook API.
const fetchProductsMock = async (): Promise<Array<Product>> => [
    {
        id: "tee-ftes",
        name: "Áo thun FTES AOS",
        category: "merch",
        priceCoin: 1200,
        description: "Áo thun cotton in logo FTES Academic Operating System.",
    },
    {
        id: "premium-30d",
        name: "Premium 30 ngày",
        category: "premium",
        priceCoin: 3500,
        description: "Mở toàn bộ tính năng cao cấp trong 30 ngày.",
    },
    {
        id: "ai-credits-500",
        name: "Gói 500 AI Credits",
        category: "aiCredits",
        priceCoin: 900,
        description: "Nạp 500 credits cho trợ giảng AI và chấm bài tự động.",
    },
    {
        id: "voucher-100k",
        name: "Voucher học phí 100K",
        category: "voucher",
        priceCoin: 2000,
        description: "Giảm 100.000đ khi đăng ký bất kỳ khóa học nào.",
    },
    {
        id: "unlock-swp391",
        name: "Mở khóa SWP391",
        category: "courseUnlock",
        priceCoin: 4800,
        description: "Mở toàn bộ nội dung khóa Đồ án phần mềm SWP391.",
    },
    {
        id: "sticker-pack",
        name: "Bộ sticker FTES",
        category: "merch",
        priceCoin: 400,
        description: "Bộ 12 sticker dán laptop chủ đề lập trình.",
    },
]

/** Loads the marketplace product catalog. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProductsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["products"], () => fetchProductsMock())
    return { products: data ?? [], isLoading, error, mutate }
}
