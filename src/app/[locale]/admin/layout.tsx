import React from "react"
import { AdminConsoleShell } from "@/components/features/admin/AdminConsoleShell"

/** `/admin/*` — wraps every admin route in the role-gated console shell (§22 Admin CMS). */
const Layout = ({ children }: { children: React.ReactNode }) => (
    <AdminConsoleShell>{children}</AdminConsoleShell>
)

export default Layout
