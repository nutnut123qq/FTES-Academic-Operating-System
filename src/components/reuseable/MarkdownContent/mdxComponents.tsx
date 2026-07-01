import React from "react"
import * as HeroUI from "@heroui/react"

/**
 * The FULL HeroUI v3 component set, exposed to MDX BY NAME so content authors can
 * call any component directly inside a ` ```mdx ` fence — e.g. `<Card>`,
 * `<Input placeholder="Email" />`, `<Tabs>`, `<Alert>`, `<Switch>` — and get the
 * REAL, interactive component with HeroUI's DEFAULT styling (no extra CSS). This
 * replaces the old static `layout` HTML mockups.
 *
 * Sourced from the installed `@heroui/react` (3.0.2) — more accurate than docs and
 * picks up new components automatically. Non-renderables are filtered out:
 * ALL-CAPS constants (`DEFAULT_*`, `REGEXP_*`), React contexts (`*Context`) and
 * providers (`*Provider`).
 */
export const heroUiMdxComponents: Record<string, React.ElementType> = Object.fromEntries(
    Object.entries(HeroUI).filter(
        ([name, value]) =>
            // PascalCase component name (no underscores → drops ALL-CAPS constants)
            /^[A-Z][A-Za-z0-9]*$/.test(name)
            && name !== name.toUpperCase()
            // drop React contexts + providers (not content components)
            && !/(Context|Provider)$/.test(name)
            && (typeof value === "function" || (typeof value === "object" && value !== null)),
    ),
) as Record<string, React.ElementType>
