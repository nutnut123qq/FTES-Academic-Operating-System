import fs from "fs"

const paths = [
    "src/modules/api/graphql/mutations/mutation-submit-challenge-submission.ts",
    "src/modules/api/graphql/mutations/mutation-sync-challenge-submission.ts",
    "src/modules/api/graphql/mutations/mutation-trigger-cv-submission.ts",
    "src/modules/api/graphql/mutations/mutation-course-enroll.ts",
    "src/modules/api/graphql/mutations/mutation-get-cv-presigned-url.ts",
    "src/modules/api/graphql/mutations/mutation-process-cv.ts",
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
        .replace(
            /Boolean\(getAccessToken\)/g,
            "hasKeycloakAccessTokenInStorage()",
        )

for (const p of paths) {
    const s0 = fs.readFileSync(p, "utf8")
    fs.writeFileSync(p, strip(s0))
}
console.log("mutations", paths.length)
