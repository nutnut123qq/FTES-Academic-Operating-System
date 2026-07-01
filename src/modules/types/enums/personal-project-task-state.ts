/**
 * State of a personal project task.
 */
export enum PersonalProjectTaskState {
    /**
     * Task has not been started yet.
     */
    Todo = "todo",
    /**
     * Task is currently being worked on.
     */
    InProgress = "inProgress",
    /**
     * Task has been completed and passed.
     */
    Completed = "completed",
}