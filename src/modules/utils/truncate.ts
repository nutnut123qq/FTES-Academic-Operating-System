export interface TruncateMiddleParams {
    str: string
    front?: number
    back?: number
}
export const truncateMiddle = (
    { str, front = 6, back = 4 }: TruncateMiddleParams
): string => {
    if (str.length <= front + back) return str
    return `${str.substring(0, front)}...${str.substring(str.length - back)}`
}

export interface TruncateEndParams {
    str: string | undefined
    maxLength?: number
}

export const truncateEnd = (
    { str, maxLength = 12  }: TruncateEndParams
) => {
    if (!str) return ""
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength) + "..."
}