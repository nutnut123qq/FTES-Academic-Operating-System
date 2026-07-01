import type { GraphQLResponse } from "../../types"
import type { PersonalProjectTaskEntity } from "@/modules/types/entities/personal-project-task"
import type { PersonalProjectTaskState } from "@/modules/types/enums/personal-project-task-state"

/** Apollo variables for `tasks(request: TasksRequest!)`. */
export interface QueryTasksRequest {
    /** The course id whose tasks should be listed. */
    courseId: string
    /** Filter by task state (todo, inProgress, completed). */
    state: PersonalProjectTaskState
    /** Pagination cursor filters. */
    filters: {
        /** Cursor for pagination (opaque string from previous page). */
        cursor?: string
        /** Maximum number of tasks to return per page. */
        limit?: number
    }
}

/** Response shape for the tasks query (cursor-paginated). */
export interface QueryTasksResponseData {
    /** The list of tasks for the current page. */
    data: Array<PersonalProjectTaskEntity>
    /** Opaque cursor string to pass for the next page; absent when no more pages. */
    cursor?: string
}

/** Apollo response shape for the `tasks` query. */
export interface QueryTasksResponse {
    /** Top-level `tasks` field wrapping the standard API response. */
    tasks: GraphQLResponse<QueryTasksResponseData>
}
