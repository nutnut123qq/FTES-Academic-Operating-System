"use client"

import { mutate as globalMutate } from "swr"

/**
 * Refreshes everything the learn shell renders off a purchase: the course outline
 * (`GET_LEARN_COURSE` — what draws the lock icons on the rail), EVERY lesson query
 * (`GET_LEARN_LESSON`, because a package unlocks more than the lesson currently open),
 * and the progress meters (`GET_COURSE_PROGRESS`).
 *
 * Every surface that can raise the package gate calls THIS, not the local `mutate` of
 * whatever query it happens to own. A local mutate refreshes that one surface and leaves
 * the rest of the shell showing the pre-purchase state until a reload — the buyer unlocks
 * the lesson they are reading while the rail beside it still shows padlocks.
 *
 * @param courseId - Slug/id of the course just bought into; scopes the outline key only,
 *   since lesson and progress keys are carried per lesson and per raw course id.
 */
export const revalidateLearnData = async (courseId: string) => {
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_COURSE" && key[1] === courseId)
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_LEARN_LESSON")
    await globalMutate((key) => Array.isArray(key) && key[0] === "GET_COURSE_PROGRESS")
}
