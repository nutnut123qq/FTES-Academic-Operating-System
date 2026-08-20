import { useDispatch, useSelector, useStore } from "react-redux"
import type { AppDispatch, AppStore, RootState } from "./store"

/**
 * Typed `useDispatch` hook pre-bound to the app's `AppDispatch` type.
 * Use this instead of plain `useDispatch` to get correct action type inference.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()

/**
 * Typed `useSelector` hook pre-bound to the app's `RootState` type.
 * Use this instead of plain `useSelector` for full state type inference.
 */
export const useAppSelector = useSelector.withTypes<RootState>()

/**
 * Typed `useStore` hook pre-bound to the app's `AppStore` type.
 *
 * Use this — not `useAppSelector` — when a callback must read state that may have
 * changed AFTER the render that created the callback (anything behind an `await`).
 * A selector value is captured in the render closure and goes stale the moment the
 * callback suspends; `store.getState()` always reads the current state.
 *
 * Prefer this over importing the `store` singleton directly: tests inject their own
 * store through `<Provider>`, and a direct import would bypass it.
 */
export const useAppStore = useStore.withTypes<AppStore>()
