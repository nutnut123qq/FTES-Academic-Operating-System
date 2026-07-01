import SuperJSON from "superjson"
import BN from "bn.js"
import Decimal from "decimal.js"
import dayjs from "dayjs"
import { Dayjs } from "dayjs"

export const superjson = new SuperJSON()
// extends bn
superjson.registerCustom<BN, string>(
    {
        isApplicable: (v): v is BN => {
            try {
                return BN.isBN(v)
            } catch {
                return false
            }
        },
        serialize: (v) => v.toString(),
        deserialize: (v) => new BN(v),
    },
    "bn.js" // identifier
)
superjson.registerCustom<Decimal, string>(
    {
        isApplicable: (v): v is Decimal => {
            return Decimal.isDecimal(v)
        },
        serialize: (v) => v.toString(),
        deserialize: (v) => new Decimal(v),
    },
    "decimal.js" // identifier
)
superjson.registerCustom<Dayjs, string>(
    {
        isApplicable: (v): v is Dayjs => {
            return dayjs.isDayjs(v)
        },
        serialize: (v) => v.toISOString(),
        deserialize: (v) => dayjs(v),
    },
    "dayjs" // identifier
)