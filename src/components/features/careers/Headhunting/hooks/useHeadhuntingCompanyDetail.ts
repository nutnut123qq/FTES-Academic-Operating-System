"use client"

import { useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setHeadhunterCompany, setHeadhunterCompanyId } from "@/redux/slices/headhunter"
import { useQueryHeadhunterCompaniesSwr } from "@/hooks/swr/api/graphql/queries/useQueryHeadhunterCompaniesSwr"
import { useQueryHeadhuntersSwr } from "@/hooks/swr/api/graphql/queries/useQueryHeadhuntersSwr"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"
import type { HeadhuntingCompanyEntity } from "@/modules/types/entities/headhunting-company"

/** Resolved state for the headhunting company detail page. */
export interface UseHeadhuntingCompanyDetailResult {
    /** Company id from the route, when present. */
    companyId: string | undefined
    /** Active company from Redux. */
    company: HeadhuntingCompanyEntity | undefined
    /** All companies from Redux; undefined while loading. */
    companies: Array<HeadhuntingCompanyEntity> | undefined
    /** All consultants from Redux; undefined while loading. */
    consultants: Array<ConsultantEntity> | undefined
    /** Consultants belonging to the active company, sorted by order index. */
    companyConsultants: Array<ConsultantEntity>
}

/**
 * Loads headhunting companies + consultants, syncs the active company into
 * Redux from the route param, and derives the company's consultant list.
 * @returns Resolved company, lists, and the filtered consultant list.
 */
export const useHeadhuntingCompanyDetail = (): UseHeadhuntingCompanyDetailResult => {
    const params = useParams()
    const dispatch = useAppDispatch()
    const companyId = typeof params.companyId === "string" ? params.companyId : undefined
    const company = useAppSelector((state) => state.headhunter.company)
    const companies = useAppSelector((state) => state.headhunter.companies)
    const consultants = useAppSelector((state) => state.headhunter.entities)

    useQueryHeadhunterCompaniesSwr()
    useQueryHeadhuntersSwr()

    // sync the active company into Redux once the list + route param resolve
    useEffect(() => {
        if (!companyId || !companies?.length) {
            return
        }
        const match = companies.find((entry) => entry.id === companyId)
        if (match) {
            dispatch(setHeadhunterCompany(match))
            dispatch(setHeadhunterCompanyId(match.id))
        }
    }, [
        companies,
        companyId,
        dispatch,
    ])

    const companyConsultants = useMemo(() => {
        if (!consultants?.length || !companyId) {
            return []
        }
        return consultants
            .filter((entry) => (entry.company?.id ?? entry.companyId) === companyId)
            .sort((a, b) => a.sortIndex - b.sortIndex)
    }, [
        companyId,
        consultants,
    ])

    return {
        companyId,
        company,
        companies,
        consultants,
        companyConsultants,
    }
}
