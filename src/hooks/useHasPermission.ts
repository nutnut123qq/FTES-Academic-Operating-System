import { useAppSelector } from "@/redux/hooks"

/**
 * Reads the current viewer's flat permission codes (from `me.permissions`, hydrated
 * into `state.user.permissions` by {@link useQueryUserSwr}).
 * @returns The permission code list (empty until the viewer resolves).
 */
export const usePermissions = (): Array<string> =>
    useAppSelector((state) => state.user.permissions)

/**
 * RBAC gate: whether the current viewer holds a given permission code.
 *
 * Use to gate role-restricted shell UI, e.g.
 * `const canModerate = useHasPermission("profile.update.any")`.
 * @param permission - The permission code to check.
 * @returns `true` when the viewer holds the permission.
 */
export const useHasPermission = (permission: string): boolean =>
    useAppSelector((state) => state.user.permissions.includes(permission))

/**
 * RBAC gate for a set of codes.
 * @param permissions - Codes to check.
 * @param mode - `"all"` (default) requires every code; `"any"` requires at least one.
 * @returns Whether the viewer satisfies the requested codes.
 */
export const useHasPermissions = (
    permissions: Array<string>,
    mode: "all" | "any" = "all",
): boolean =>
    useAppSelector((state) => {
        const held = state.user.permissions
        return mode === "all"
            ? permissions.every((code) => held.includes(code))
            : permissions.some((code) => held.includes(code))
    })
