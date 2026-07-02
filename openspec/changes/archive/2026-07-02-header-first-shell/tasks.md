## 1. HeaderNav
- [x] 1.1 `Navbar/HeaderNav` — 3 core links + "Explore" mega-menu (Popover, grouped from useAppNav)
- [x] 1.2 Mount `<HeaderNav />` in Navbar beside the logo (`hidden md:flex`)

## 2. Sidebar → context-only
- [x] 2.1 `InnerLayout` — drop the global sidebar branch, render content full-width
- [x] 2.2 Delete orphaned `features/app-shell/AppSidebar`; fix stale comments

## 3. Verify
- [x] 3.1 npm run build (webpack) green + tsc clean + eslint clean
