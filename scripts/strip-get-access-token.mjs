import fs from "fs"

const paths = [
    "src/modules/api/graphql/queries/query-courses.ts",
    "src/modules/api/graphql/queries/query-challenge-submissions.ts",
    "src/modules/api/graphql/queries/query-lesson-videos.ts",
    "src/modules/api/graphql/queries/query-livestream-sessions.ts",
    "src/modules/api/graphql/queries/query-submission-attempts.ts",
    "src/modules/api/graphql/queries/query-submission-feedbacks.ts",
    "src/modules/api/graphql/queries/query-module.ts",
    "src/modules/api/graphql/queries/query-challenge-submission.ts",
    "src/modules/api/graphql/queries/query-lesson-video.ts",
    "src/modules/api/graphql/queries/query-content.ts",
    "src/modules/api/graphql/queries/query-incomplete-jobs.ts",
    "src/modules/api/graphql/queries/query-user-cv-submission-attempts.ts",
    "src/modules/api/graphql/queries/query-challenges.ts",
    "src/modules/api/graphql/queries/query-contents.ts",
    "src/modules/api/graphql/queries/query-submit-cv-presigned-url.ts",
    "src/modules/api/graphql/queries/query-course.ts",
]

const strip = (s) =>
    s
        .replace(
            'import { createApolloClient } from "../clients"',
            'import { createApolloClient, hasKeycloakAccessTokenInStorage } from "../clients"',
        )
        .replace(
            /\r?\n    getAccessToken,\r?\n    refreshAccessToken,\r?\n    minValiditySeconds,\r?\n/g,
            "\n",
        )
        .replace(
            /\r?\n        getAccessToken,\r?\n        refreshAccessToken,\r?\n        minValiditySeconds,\r?\n/g,
            "\n",
        )

for (const p of paths) {
    const s0 = fs.readFileSync(p, "utf8")
    fs.writeFileSync(p, strip(s0))
}
console.log("stripped", paths.length, "files")
