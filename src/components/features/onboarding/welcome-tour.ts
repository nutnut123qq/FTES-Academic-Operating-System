import type { Tour } from "./types"

/** Id of the first-run welcome tour (also its localStorage namespace). */
export const WELCOME_TOUR_ID = "onboarding"

/**
 * The first-run welcome tour: a game-style coach-mark walk-through that greets a
 * new signed-in learner and points out the primary surfaces before letting them
 * loose. Fully declarative — each step aims at a real element via its
 * `data-tour` anchor (see the JSX where each anchor is set):
 *
 * | step        | target (`data-tour`) | anchor lives in                     |
 * |-------------|----------------------|-------------------------------------|
 * | welcome     | — (centered)         | —                                   |
 * | home        | `nav-home`           | `Navbar/HeaderNav`                  |
 * | workplace   | `nav-workplace`      | `Navbar/HeaderNav`                  |
 * | course      | `nav-course`         | `Navbar/HeaderNav`                  |
 * | community   | `nav-community`      | `Navbar/HeaderNav`                  |
 * | search      | `global-search`      | `Navbar` (wraps SearchInline + icon) |
 * | account     | `account-menu`       | `Navbar` (wraps AccountMenuDropdown) |
 * | done        | — (centered)         | —                                   |
 *
 * The `account` step deliberately covers the AI tutor AND the gamification
 * (streak / quests) surfaces in one spotlight: on the global header both live
 * BEHIND the avatar (in the account menu / AI hub), so the honest anchor is the
 * avatar itself — the tour never opens the dropdown mid-run (that would fight the
 * spotlight's focus), it points at the gateway and its copy names what is inside.
 *
 * Steps whose anchor is not on the current page (e.g. the header nav links are
 * hidden on mobile) are skipped automatically by the engine, so the same tour is
 * safe on every viewport.
 */
export const welcomeTour: Tour = {
    id: WELCOME_TOUR_ID,
    steps: [
        {
            id: "welcome",
            intent: "welcome",
            titleKey: "onboarding.welcome.title",
            bodyKey: "onboarding.welcome.body",
        },
        {
            id: "home",
            target: "nav-home",
            intent: "point",
            titleKey: "onboarding.steps.home.title",
            bodyKey: "onboarding.steps.home.body",
        },
        {
            id: "workplace",
            target: "nav-workplace",
            intent: "explain",
            titleKey: "onboarding.steps.workplace.title",
            bodyKey: "onboarding.steps.workplace.body",
        },
        {
            id: "course",
            target: "nav-course",
            intent: "explain",
            titleKey: "onboarding.steps.course.title",
            bodyKey: "onboarding.steps.course.body",
        },
        {
            id: "community",
            target: "nav-community",
            intent: "explain",
            titleKey: "onboarding.steps.community.title",
            bodyKey: "onboarding.steps.community.body",
        },
        {
            id: "search",
            target: "global-search",
            intent: "point",
            titleKey: "onboarding.steps.search.title",
            bodyKey: "onboarding.steps.search.body",
        },
        {
            id: "account",
            target: "account-menu",
            intent: "point",
            titleKey: "onboarding.steps.account.title",
            bodyKey: "onboarding.steps.account.body",
        },
        {
            id: "done",
            intent: "celebrate",
            titleKey: "onboarding.done.title",
            bodyKey: "onboarding.done.body",
        },
    ],
}
