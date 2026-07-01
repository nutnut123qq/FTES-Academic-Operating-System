import type { ContactCategory } from "@/modules/api/graphql/mutations/types/contact"

/** Real contact channels (see memory: starci-real-contact-channels). */
export const CONTACT_EMAIL = "cuongnvtse160875@gmail.com"
/** Display phone number. */
export const CONTACT_PHONE = "0828678897"
/** `tel:` form of the phone number (E.164). */
export const CONTACT_PHONE_TEL = "+84828678897"

/** Founder social links (static — UserEntity has no facebookUrl). */
export const FOUNDER_FACEBOOK = "https://www.facebook.com/starci183/"
export const FOUNDER_LINKEDIN = "https://www.linkedin.com/in/stacy-nguyen-375b41324/"
export const FOUNDER_GITHUB = "https://github.com/starci183"

/** Contact-form reasons, in display order (wire value === i18n key). */
export const CONTACT_CATEGORY_KEYS: ReadonlyArray<ContactCategory> = [
    "course_support",
    "partnership",
    "general",
]

/** FAQ row indexes — keys live at `contact.faq.q{n}` / `a{n}`. */
export const CONTACT_FAQ_INDEXES = [1, 2, 3, 4, 5] as const
