import {
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"
import type { HeadhuntingCompanyEntity } from "@/modules/types/entities/headhunting-company"

/**
 * Redux state for the Headhunter / Headhunting section (companies + consultants).
 */
export interface HeadhunterSlice {
    /** Selected headhunter (consultant) id. */
    headhunterId?: string
    /** Selected headhunting company id. */
    companyId?: string
    /** Selected consultant entity (detail view). */
    entity?: ConsultantEntity
    /** Selected headhunting company entity. */
    company?: HeadhuntingCompanyEntity
    /** All headhunting company rows. */
    companies?: Array<HeadhuntingCompanyEntity>
    /** Consultant rows for the active company / filter. */
    entities?: Array<ConsultantEntity>
    /** Total consultant count for pagination. */
    count?: number
}

/** Initial state for the headhunter slice. */
const initialState: HeadhunterSlice = {
    headhunterId: undefined,
    companyId: undefined,
    entity: undefined,
    company: undefined,
    companies: undefined,
    entities: undefined,
    count: undefined,
}

/**
 * Slice managing headhunting company and consultant selection + list state.
 */
export const headhunterSlice = createSlice({
    name: "headhunter",
    initialState,
    reducers: {
        /** Set the focused consultant (headhunter) id. */
        setHeadhunterId: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.headhunterId = action.payload
        },
        /** Set the focused headhunting company id. */
        setHeadhunterCompanyId: (
            state,
            action: PayloadAction<string | undefined>,
        ) => {
            state.companyId = action.payload
        },
        /** Store the consultant detail entity. */
        setHeadhunter: (
            state,
            action: PayloadAction<ConsultantEntity | undefined>,
        ) => {
            state.entity = action.payload
        },
        /** Store the headhunting company entity. */
        setHeadhunterCompany: (
            state,
            action: PayloadAction<HeadhuntingCompanyEntity | undefined>,
        ) => {
            state.company = action.payload
        },
        /** Replace the full list of headhunting companies. */
        setHeadhunterCompanies: (
            state,
            action: PayloadAction<Array<HeadhuntingCompanyEntity> | undefined>,
        ) => {
            state.companies = action.payload
        },
        /** Replace the consultant list for the current filter. */
        setHeadhunters: (
            state,
            action: PayloadAction<Array<ConsultantEntity> | undefined>,
        ) => {
            state.entities = action.payload
        },
        /** Set the total consultant count (for pagination controls). */
        setHeadhuntersCount: (
            state,
            action: PayloadAction<number | undefined>,
        ) => {
            state.count = action.payload
        },
    },
})

/** Root reducer for the headhunter slice. */
export const headhunterReducer = headhunterSlice.reducer
/** Actions exported from the headhunter slice. */
export const {
    setHeadhunterId,
    setHeadhunterCompanyId,
    setHeadhunter,
    setHeadhunterCompany,
    setHeadhunterCompanies,
    setHeadhunters,
    setHeadhuntersCount,
} = headhunterSlice.actions
