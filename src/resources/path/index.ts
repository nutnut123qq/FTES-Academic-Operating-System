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
            // (`/profile/<username>`, GitHub-style); otherwise the viewer's own hub.
            const profilePath = username
                ? `${localePath}/profile/${username}`
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
            return {
                build, google, github,
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

            return {
                build,
                learn,
                headhuntingCompanies,
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
            return {
                build,
            }
        }
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
            rewards,
            league,
            kpi,
            terms,
            privacy,
        }
    }
    return {
        locale,
    }
}