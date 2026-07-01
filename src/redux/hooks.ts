import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "./store"

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
