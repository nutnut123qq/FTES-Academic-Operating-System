import Decimal from "decimal.js"
import * as ss from "simple-statistics"

export interface RegressionPoint {
    x: number
    y: number
}

export interface RegressionResult {
    m: number
    b: number
    predict: (x: number) => number
}

export const getSafeLinearRegression = (
    points: Array<RegressionPoint>
): RegressionResult | null => {
    if (points.length < 2) {
        return null
    }

    const normalizedPoints = points
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        .map((point) => ({
            x: point.x,
            y: point.y,
        }))

    if (normalizedPoints.length < 2) {
        return null
    }

    const firstX = normalizedPoints[0].x

    const shiftedPoints: Array<[number, number]> = normalizedPoints.map((point) => [
        new Decimal(point.x).sub(firstX).toNumber(),
        point.y,
    ])

    const uniqueXCount = new Set(shiftedPoints.map(([x]) => x)).size
    if (uniqueXCount < 2) {
        return null
    }

    const regression = ss.linearRegression(shiftedPoints)

    if (
        !Number.isFinite(regression.m) ||
        !Number.isFinite(regression.b)
    ) {
        return null
    }

    return {
        m: regression.m,
        b: regression.b,
        predict: (x: number) => {
            const shiftedX = new Decimal(x).sub(firstX).toNumber()
            return new Decimal(regression.m)
                .mul(shiftedX)
                .add(regression.b)
                .toNumber()
        },
    }
}