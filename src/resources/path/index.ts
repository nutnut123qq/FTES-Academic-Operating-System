import { Locale } from "next-intl"

// represent as a function to ensure optional loading or logic processing
export const pathConfig = () => {
    const locale = (locale?: Locale) => {
        const localePath = locale ? `/${locale}` : ""
        const build = () => {
            // With no locale supplied, the bare root is "" — which is an empty href the router
            // won't navigate to. Fall back to "/" so "go home" links (breadcrumbs) navigate to
            // the locale root. NOTE: the root `/` is GitHub-style gated by the proxy (logged-in
            // visitors are bounced to the dashboard); use `home()` below to reach the landing
            // page on purpose without being gated.
            return localePath || "/"
        }
        /** The marketing landing at an explicit, UNGATED url (`/home`) — proxy never bounces it,
         *  so the logo / "Trang chủ" reach the landing even while signed in. */
        const home = () => {
            const homePath = `${localePath}/home`
            const build = () => homePath
            return {
                build,
            }
        }
        const profile = (username?: string) => {
            // when a username is given, point at that user's public profile
            // (`/u/<username>`); otherwise the viewer's own hub.
            const profilePath = username
                ? `${localePath}/u/${username}`
                : `${localePath}/profile`
            const build = () => {
                return profilePath
            }
            // settings hub root — all account-management pages nest under it
            // (`/profile/settings/<page>`); the hub itself is `/profile/settings`.
            const settingsPath = `${profilePath}/settings`
            const bookmarks = () => {
                const bookmarksPath = `${settingsPath}/bookmarks`
                const build = () => {
                    return bookmarksPath
                }
                return {
                    build,
                }
            }
            const aiUsage = () => {
                const aiUsagePath = `${settingsPath}/ai-usage`
                const build = () => {
                    return aiUsagePath
                }
                return {
                    build,
                }
            }
            const edit = () => {
                const editPath = `${settingsPath}/edit`
                const build = () => {
                    return editPath
                }
                return {
                    build,
                }
            }
            const sessions = () => {
                const sessionsPath = `${settingsPath}/sessions`
                const build = () => {
                    return sessionsPath
                }
                return {
                    build,
                }
            }
            const security = () => {
                const securityPath = `${settingsPath}/security`
                const build = () => {
                    return securityPath
                }
                return {
                    build,
                }
            }
            const aiSettings = () => {
                const aiSettingsPath = `${settingsPath}/ai-settings`
                const build = () => {
                    return aiSettingsPath
                }
                return {
                    build,
                }
            }
            const aiSubscription = () => {
                const aiSubscriptionPath = `${settingsPath}/ai-subscription`
                const build = () => {
                    return aiSubscriptionPath
                }
                return {
                    build,
                }
            }
            const membership = () => {
                const membershipPath = `${settingsPath}/membership`
                const build = () => {
                    return membershipPath
                }
                return {
                    build,
                }
            }
            const settings = () => {
                const build = () => {
                    return settingsPath
                }
                return {
                    build,
                }
            }
            const learning = () => {
                const learningPath = `${settingsPath}/learning`
                const build = () => {
                    return learningPath
                }
                return {
                    build,
                }
            }
            const submissions = () => {
                const submissionsPath = `${settingsPath}/submissions`
                const build = () => {
                    return submissionsPath
                }
                return {
                    build,
                }
            }
            const attempts = () => {
                const attemptsPath = `${settingsPath}/attempts`
                const build = () => {
                    return attemptsPath
                }
                return {
                    build,
                }
            }
            const feedback = () => {
                const feedbackPath = `${settingsPath}/feedback`
                const build = () => {
                    return feedbackPath
                }
                return {
                    build,
                }
            }
            const cv = () => {
                const cvPath = `${profilePath}/cv`
                const build = () => {
                    return cvPath
                }
                return {
                    build,
                }
            }
            const progress = () => {
                // profile Progress tab (gamification dashboard + skill graph)
                const progressPath = `${profilePath}/progress`
                const build = () => {
                    return progressPath
                }
                return {
                    build,
                }
            }
            return {
                build,
                bookmarks,
                aiUsage,
                aiSettings,
                aiSubscription,
                membership,
                settings,
                edit,
                sessions,
                security,
                learning,
                submissions,
                attempts,
                feedback,
                cv,
                progress,
            }
        }
        const authentication = () => {
            const authenticationPath = `${localePath}/authentication`
            const build = () => {
                return authenticationPath
            }
            const google = () => {
                const googlePath = `${authenticationPath}/google`
                const build = () => {
                    return googlePath
                }
                const login = () => {
                    const loginPath = `${googlePath}/login`
                    const build = () => {
                        return loginPath
                    }
                    return {
                        build,
                    }
                }
                const logout = () => {
                    const logoutPath = `${googlePath}/logout`
                    const build = () => {
                        return logoutPath
                    }
                    return {
                        build,
                    }
                }
                return {
                    build, login, logout,
                }
            }
            const github = () => {
                const githubPath = `${authenticationPath}/github`
                const build = () => {
                    return githubPath
                }
                const login = () => {
                    const loginPath = `${githubPath}/login`
                    const build = () => {
                        return loginPath
                    }
                    return {
                        build,
                    }
                }
                const logout = () => {
                    const logoutPath = `${githubPath}/logout`
                    const build = () => {
                        return logoutPath
                    }
                    return {
                        build,
                    }
                }
                return {
                    build, login, logout,
                }
            }
            const forgotPassword = () => {
                const forgotPasswordPath = `${authenticationPath}/forgot-password`
                const build = () => {
                    return forgotPasswordPath
                }
                return {
                    build,
                }
            }
            return {
                build, google, github, forgotPassword,
            }
        }
        const course = (displayId?: string) => {
            const coursePath = displayId ? `${localePath}/courses/${displayId}` : `${localePath}/courses`
            const build = () => {
                return coursePath
            }
            const learn = () => {
                const learnPath = `${coursePath}/learn`
                const build = () => {
                    return learnPath
                }
                const content = () => {
                    // course-contents home ("Học phần"): the docs-style chỉ-mục landing
                    const contentPath = `${learnPath}/content`
                    const build = () => {
                        return contentPath
                    }
                    return {
                        build,
                    }
                }
                const mindMap = () => {
                    const mindMapPath = `${learnPath}/mind-map`
                    const build = () => {
                        return mindMapPath
                    }
                    return {
                        build,
                    }
                }
                const mockInterview = () => {
                    const mockInterviewPath = `${learnPath}/mock-interview`
                    const build = () => {
                        return mockInterviewPath
                    }
                    return {
                        build,
                    }
                }
                const interview = () => {
                    const interviewPath = `${learnPath}/interview`
                    const build = () => {
                        return interviewPath
                    }
                    return {
                        build,
                    }
                }
                const cv = () => {
                    const cvPath = `${learnPath}/cv`
                    const build = () => {
                        return cvPath
                    }
                    return {
                        build,
                    }
                }
                const personalProject = (taskId?: string) => {
                    const personalProjectPath = taskId
                        ? `${learnPath}/personal-project/tasks/${taskId}`
                        : `${learnPath}/personal-project`
                    const build = () => {
                        return personalProjectPath
                    }
                    return {
                        build,
                    }
                }
                const leaderboard = () => {
                    const leaderboardPath = `${learnPath}/leaderboard`
                    const build = () => {
                        return leaderboardPath
                    }
                    return {
                        build,
                    }
                }
                const headhuntings = () => {
                    const headhuntingsPath = `${learnPath}/headhuntings`
                    const build = () => {
                        return headhuntingsPath
                    }
                    return {
                        build,
                    }
                }
                const flashcards = () => {
                    const flashcardsPath = `${learnPath}/flashcards`
                    const build = () => {
                        return flashcardsPath
                    }
                    return {
                        build,
                    }
                }
                const practice = () => {
                    const practicePath = `${learnPath}/practice`
                    const build = () => {
                        return practicePath
                    }
                    return {
                        build,
                    }
                }
                const foundations = (categoryId?: string) => {
                    const foundationsPath = categoryId
                        ? `${learnPath}/foundations/${categoryId}`
                        : `${learnPath}/foundations`
                    const build = () => {
                        return foundationsPath
                    }
                    const item = (foundationId?: string) => {
                        const itemPath = foundationId
                            ? `${foundationsPath}/${foundationId}`
                            : foundationsPath
                        const buildItem = () => {
                            return itemPath
                        }
                        return {
                            build: buildItem,
                        }
                    }
                    return {
                        build,
                        item,
                    }
                }
                const module = (moduleId?: string) => {
                    // lessons live UNDER the content home: `/learn/content/modules/...`
                    const modulesBase = `${learnPath}/content/modules`
                    const modulePath = moduleId ? `${modulesBase}/${moduleId}` : modulesBase
                    const build = () => {
                        return modulePath
                    }
                    const content = (contentId?: string) => {
                        const contentPath = contentId ? `${modulePath}/contents/${contentId}` : `${modulePath}/contents`
                        const build = () => {
                            return contentPath
                        }
                        return {
                            build,
                        }
                    }
                    return {
                        build,
                        content,
                    }
                }
                return {
                    build,
                    content,
                    mindMap,
                    mockInterview,
                    interview,
                    cv,
                    personalProject,
                    leaderboard,
                    headhuntings,
                    flashcards,
                    practice,
                    foundations,
                    module,
                }
            }
            const headhuntingCompanies = (companyId?: string) => {
                const headhuntingCompaniesPath = companyId
                    ? `${coursePath}/headhunting-companies/${companyId}`
                    : `${coursePath}/headhunting-companies`
                const build = () => {
                    return headhuntingCompaniesPath
                }
                return {
                    build,
                }
            }
            // "Khóa học của tôi" — the viewer's enrolled courses. A fixed group-level
            // route (`/courses/me`), independent of any `displayId` passed to course().
            const mine = () => {
                const minePath = `${localePath}/courses/me`
                const build = () => {
                    return minePath
                }
                return {
                    build,
                }
            }

            return {
                build,
                learn,
                headhuntingCompanies,
                mine,
            }
        }
        const contact = () => {
            const contactPath = `${localePath}/contact`
            const build = () => {
                return contactPath
            }
            return {
                build,
            }
        }
        const dashboard = () => {
            const dashboardPath = `${localePath}/dashboard`
            const build = () => {
                return dashboardPath
            }
            return {
                build,
            }
        }
        const terms = () => {
            // terms of service (stub page, linked from the footer)
            const termsPath = `${localePath}/terms`
            const build = () => {
                return termsPath
            }
            return {
                build,
            }
        }
        const privacy = () => {
            // privacy policy (stub page, linked from the footer)
            const privacyPath = `${localePath}/privacy`
            const build = () => {
                return privacyPath
            }
            return {
                build,
            }
        }
        const talents = () => {
            // talent directory: users who opted into "open to work"
            const talentsPath = `${localePath}/talents`
            const build = () => {
                return talentsPath
            }
            return {
                build,
            }
        }
        const blog = () => {
            // editorial blog index (deep-dive / build-in-public / career / …)
            const blogPath = `${localePath}/blog`
            const build = () => {
                return blogPath
            }
            return {
                build,
            }
        }
        const community = () => {
            // community feed (posts + comments + reactions) + founder Q&A
            const communityPath = `${localePath}/community`
            const build = () => {
                return communityPath
            }
            const trending = () => {
                // trending scope of the community feed
                const trendingPath = `${communityPath}/trending`
                const build = () => {
                    return trendingPath
                }
                return {
                    build,
                }
            }
            return {
                build,
                trending,
            }
        }
        const groups = () => {
            // study groups / clubs / project teams index
            const groupsPath = `${localePath}/groups`
            const build = () => {
                return groupsPath
            }
            return {
                build,
            }
        }
        const resources = () => {
            // resource hub index (slides, PE/FE, books, source code, …)
            const resourcesPath = `${localePath}/resources`
            const build = () => {
                return resourcesPath
            }
            return {
                build,
            }
        }
        const saved = () => {
            // "Đã lưu" library: saved resources/courses/posts (save-for-later).
            // NOTE: the legacy profile().bookmarks() builder (/profile/settings/bookmarks)
            // is a dead route kept only as legacy — new entry points use this one.
            const savedPath = `${localePath}/saved`
            const build = () => {
                return savedPath
            }
            return {
                build,
            }
        }
        const subjects = () => {
            // subject catalog (§3) — the list of subject workspaces
            const subjectsPath = `${localePath}/subjects`
            const build = () => {
                return subjectsPath
            }
            return {
                build,
            }
        }
        // Batch-1 domain shells (§8/§10/§11/§12/§13/§14/§18/§19/§20) — each a top-level route.
        const makeSimplePath = (segment: string) => () => {
            const path = `${localePath}/${segment}`
            return { build: () => path }
        }
        const chat = makeSimplePath("chat")
        const challenges = makeSimplePath("challenges")
        const leaderboard = makeSimplePath("leaderboard")
        const wallet = makeSimplePath("wallet")
        const marketplace = makeSimplePath("marketplace")
        const events = makeSimplePath("events")
        const activity = makeSimplePath("activity")
        const workflow = makeSimplePath("workflow")
        const analytics = makeSimplePath("analytics")
        // Batch-2 domain shells (§9/§15/§16/§17/§21/§23 + §1 RBAC).
        const ai = makeSimplePath("ai")
        const notifications = makeSimplePath("notifications")
        const search = makeSimplePath("search")
        const recommendations = makeSimplePath("recommendations")
        const career = makeSimplePath("career")
        const integrations = makeSimplePath("integrations")
        const roles = makeSimplePath("admin/roles")
        const practice = () => {
            const practicePath = `${localePath}/practice`
            const build = () => {
                return practicePath
            }
            return {
                build,
            }
        }
        const review = () => {
            // flashcard review session (SM-2): all due cards across courses
            const reviewPath = `${localePath}/review`
            const build = () => {
                return reviewPath
            }
            return {
                build,
            }
        }
        const rewards = () => {
            // reward points store: spend reward points earned from learning on gifts
            const rewardsPath = `${localePath}/rewards`
            const build = () => {
                return rewardsPath
            }
            return {
                build,
            }
        }
        const league = () => {
            // weekly league + global leaderboard (full board behind the dashboard card)
            const leaguePath = `${localePath}/league`
            const build = () => {
                return leaguePath
            }
            return {
                build,
            }
        }
        const kpi = () => {
            // weekly KPI editor (set per-metric targets behind the dashboard summary)
            const kpiPath = `${localePath}/kpi`
            const build = () => {
                return kpiPath
            }
            return {
                build,
            }
        }
        const publicContent = (contentId?: string) => {
            const publicContentPath = contentId ? `${localePath}/contents/${contentId}` : `${localePath}/content`
            const build = () => {
                return publicContentPath
            }
            return {
                build,
            }
        }
        return {
            build,
            home,
            course,
            profile,
            authentication,
            contact,
            publicContent,
            dashboard,
            practice,
            review,
            talents,
            blog,
            community,
            groups,
            resources,
            saved,
            subjects,
            chat,
            challenges,
            leaderboard,
            wallet,
            marketplace,
            events,
            activity,
            workflow,
            analytics,
            ai,
            notifications,
            search,
            recommendations,
            career,
            integrations,
            roles,
            rewards,
            league,
            kpi,
            terms,
            privacy,
        }
    }
    /** Profile link WITHOUT locale prefix — intended for `next-intl` `Link`/`useRouter`
     *  which add the locale segment automatically. Use `locale().profile(...)` when
     *  you need an absolute path (e.g. raw `<a>` or external share URL). */
    const profile = (username?: string) => {
        const profilePath = username ? `/u/${username}` : "/profile"
        const build = () => profilePath
        return { build }
    }

    return {
        locale,
        profile,
    }
}