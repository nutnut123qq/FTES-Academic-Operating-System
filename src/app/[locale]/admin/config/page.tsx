import { redirect } from "next/navigation"
import { pathConfig } from "@/resources/path"

/** `/admin/config` — redirects to the default Config Center category (`general`). */
const Page = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params
    redirect(pathConfig().locale(locale).adminConfig("general").build())
}

export default Page
