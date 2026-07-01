import { LocalStorageId } from "./enums"
import { superjson } from "../../superjson"
/**
 * Local storage wrapper.
 */
export class LocalStorage {
    /**
     * Get an item from local storage.
     * @param id - The id of the item to get.
     * @returns The item from local storage.
     */
    static getItem<T>(
        id: LocalStorageId
    ): T | undefined {
        const item = localStorage.getItem(id)
        if (!item) return undefined
        return superjson.parse<T>(item)
    }

    /**
     * Get an item from local storage as a string.
     * @param id - The id of the item to get.
     * @returns The item from local storage as a string.
     */
    static getItemAsString(
        id: LocalStorageId
    ): string | undefined {
        const item = localStorage.getItem(id)
        if (!item) return undefined
        return item
    }
    /**
     * Set an item in local storage.
     * @param id - The id of the item to set.
     * @param value - The value of the item to set.
     */
    static setItem<T>(id: LocalStorageId, value: T): void {
        const data = typeof value === "string" ? value : superjson.stringify(value)
        localStorage.setItem(id, data)
    }
    /**
     * Remove an item from local storage.
     * @param id - The id of the item to remove.
     */
    static removeItem(id: LocalStorageId): void {
        localStorage.removeItem(id)
    }
    /**
     * Clear all items from local storage.
     */
    static clear(): void {
        localStorage.clear()
    }
}
