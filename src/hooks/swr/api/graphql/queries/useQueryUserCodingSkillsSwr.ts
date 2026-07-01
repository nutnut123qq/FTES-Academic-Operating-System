import useSWR from "swr"
import { queryUserCodingSkills } from "@/modules/api/graphql/queries/query-user-coding-skills"

/**
 * SWR hook for a user's solved-coding breakdown (by language + difficulty) by id.
 * Public — works for anonymous viewers. Returns null on absent data; pass
 * null/undefined userId to disable.
 *
 * @param userId - id of the user whose coding skills to fetch
 * @returns the SWR handle (data = { byLanguage, byDifficulty } or null)
 */
export const useQueryUserCodingSkillsSwr = (userId: string | null | undefined) => {
    const swr = useSWR(
        userId ? ["QUERY_USER_CODING_SKILLS_SWR", userId] : null,
        async () => {
            const data = await queryUserCodingSkills({
                request: { userId: userId as string },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch user coding skills")
            }
            return data.data.userCodingSkills?.data ?? null
        },
    )
    return swr
}
