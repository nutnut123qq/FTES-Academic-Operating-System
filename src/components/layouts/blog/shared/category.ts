import { BlogCategory } from "@/modules/api/graphql/queries/types/blog"

/**
 * Editorial-pillar filter order for the `/blog` listing (`null` = "All").
 * Deep-dive leads because it is the SEO-magnet pillar with the most content.
 */
export const CATEGORY_FILTERS: Array<BlogCategory | null> = [
    null,
    BlogCategory.DeepDive,
    BlogCategory.BuildInPublic,
    BlogCategory.Career,
    BlogCategory.Ai,
    BlogCategory.CaseStudy,
    BlogCategory.Codebase,
]

/** HeroUI Chip color per editorial pillar. */
export const CATEGORY_COLOR: Record<
    BlogCategory,
    "accent" | "success" | "warning" | "danger" | "default"
> = {
    [BlogCategory.DeepDive]: "accent",
    [BlogCategory.BuildInPublic]: "danger",
    [BlogCategory.Career]: "success",
    [BlogCategory.Ai]: "warning",
    [BlogCategory.CaseStudy]: "default",
    [BlogCategory.Codebase]: "accent",
}
