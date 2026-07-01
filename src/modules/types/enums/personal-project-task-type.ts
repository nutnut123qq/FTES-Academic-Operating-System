/**
 * Type classification of a personal project task.
 */
export enum PersonalProjectTaskType {
    /**
     * Database design tasks — schema, entities, migrations, indexing.
     */
    DbDesign = "dbDesign",
    /**
     * Technology integration tasks — email, SMS, Socket.IO, Redis, Docker, K8s, etc.
     */
    TechIntegrate = "techIntegrate",
    /**
     * Business logic tasks — CRUD, domain rules, search, reporting.
     */
    Business = "business",
}