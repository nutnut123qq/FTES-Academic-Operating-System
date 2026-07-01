import type {
    IconType,
} from "react-icons"
import {
    FaJava,
    FaGolang
} from "react-icons/fa6"
import {
    TbBrandTypescript,
} from "react-icons/tb"
import {
    PiFileCSharp,
} from "react-icons/pi"
import { ProgrammingLanguage } from "@/modules/types/enums/programming-language"

/** Brand icon per default programming-language tab ([react-icons](https://react-icons.github.io/react-icons/)). */
export const programmingLanguageIconMap: Record<ProgrammingLanguage, IconType> = {
    [ProgrammingLanguage.TypeScript]: TbBrandTypescript,
    [ProgrammingLanguage.Java]: FaJava,
    [ProgrammingLanguage.Csharp]: PiFileCSharp,
    [ProgrammingLanguage.Go]: FaGolang,
}
