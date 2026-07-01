/**
 * Kind of submission attachment (matches GraphQL `ResourceType` / DB `resource_type`).
 */
export enum ResourceType {
    /** Submission via Google Drive folder URL. */
    DriverUrl = "driverUrl",
    /** Submission via Git remote repository URL. */
    GitUrl = "gitUrl",
}
