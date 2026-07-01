import { SessionStorageId } from "./enums"
import { superjson } from "../../superjson"
/**
 * Session storage wrapper.
 */
export class SessionStorage {
    /**
     * Get an item from session storage.
     * @param id - The id of the item to get.
     * @returns The item from session storage.
     */
    static getItem<T>(id: SessionStorageId): T | undefined {
        const item = sessionStorage.getItem(id)
        if (!item) return undefined
        return superjson.parse<T>(item)
    }

    /**
     * Get an item from session storage as a string.
     * @param id - The id of the item to get.
     * @returns The item from session storage as a string.
     */
    static getItemAsString(id: SessionStorageId): string | undefined {
        const item = sessionStorage.getItem(id)
        if (!item) return undefined
        return item
    }
    /**
     * Set an item in session storage.
     * @param id - The id of the item to set.
     * @param value - The value of the item to set.
     */
    static setItem<T>(id: SessionStorageId, value: T): void {
        const serialized = typeof value === "string" ? value : superjson.stringify(value)
        sessionStorage.setItem(id, serialized)
    }
    /**
     * Remove an item from session storage.
     * @param id - The id of the item to remove.
     */
    static removeItem(id: SessionStorageId): void {
        sessionStorage.removeItem(id)
    }
    /**
     * Clear all items from session storage.
     */
    static clear(): void {
        sessionStorage.clear()
    }
}