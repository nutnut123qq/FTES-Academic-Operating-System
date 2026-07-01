import React from "react"
import { SubmissionAttemptsDrawer } from "./SubmissionAttemptsDrawer"
import { UserCvSubmissionAttemptsDrawer } from "./UserCvSubmissionAttemptsDrawer"
import { PersonalProjectTaskAttemptsDrawer } from "./PersonalProjectTaskAttemptsDrawer"
import { E2eResultDrawer } from "./E2eResultDrawer"
import { ContentAiChatDrawer } from "./ContentAiChatDrawer"

export const DrawerContainer = () => {
    return (
        <>
            <SubmissionAttemptsDrawer />
            <UserCvSubmissionAttemptsDrawer />
            <PersonalProjectTaskAttemptsDrawer />
            <E2eResultDrawer />
            <ContentAiChatDrawer />
        </>
    )
}