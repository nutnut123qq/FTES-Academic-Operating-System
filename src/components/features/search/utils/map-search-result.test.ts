import { describe, expect, it } from "vitest"
import type { SearchGroupView } from "@/modules/api/rest/search"
import { mapSearchGroups } from "./map-search-result"

describe("mapSearchGroups", () => {
    it("removes search highlight tags and authored markdown from post snippets", () => {
        const groups = [{
            type: "POST",
            hits: [{
                docId: "p1",
                title: "Kafka",
                snippet: "<mark>## Kafka</mark> **căn bản** ![Ảnh](https://x.vn/a.png)",
            }],
        }] as unknown as Array<SearchGroupView>

        expect(mapSearchGroups(groups, "vi").posts[0].snippet).toBe("Kafka căn bản")
    })
})
