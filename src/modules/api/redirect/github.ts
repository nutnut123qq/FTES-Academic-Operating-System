import { publicEnv } from "@/resources/env/public"

export const githubRedirect = {
    redirect: new URL(`${publicEnv().api.http}/github/oauth/redirect`)
}