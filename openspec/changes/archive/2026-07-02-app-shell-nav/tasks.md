## 1. Nav source + paths + i18n
- [x] 1.1 Add `groups`/`resources` path builders in `resources/path`
- [x] 1.2 i18n `nav.{groups,resources}` + `nav.section.{learn,community}` (reused `nav.{collapseLeftRail,expandLeftRail}`) (vi/en)
- [x] 1.3 `features/app-shell/useAppNav` — shared groups (key · label · icon · path · isActive)

## 2. Shell
- [x] 2.1 `features/app-shell/AppSidebar` — CollapsibleSidebar + groups from `useAppNav`
- [x] 2.2 `InnerLayout` mounts AppSidebar beside content, gated (hide on landing/auth/learn/subject-detail)

## 3. Top bar
- [x] 3.1 Remove broken center `NavLinks` from Navbar (deleted dead NavLinks/MobileNavbar/types)
- [x] 3.2 Point Navbar mobile drawer at `useAppNav` (kills 404 Home/Contact links)

## 4. Wiring
- [x] 4.1 Verify: npm run build (webpack) green + tsc clean + eslint clean
