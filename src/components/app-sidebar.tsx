"use client"

import * as React from "react"
import {
  CalendarDays, ChevronsUpDown, Cog, House, Images, Moon,
  Package, Pencil, Search, Sun, X, Zap,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useEditMode } from "@/contexts/EditModeContext"
import { useTheme } from "@/hooks/use-theme"
import {
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"

function matchesSearch(text: string, q: string) {
  return text.toLowerCase().includes(q.toLowerCase())
}

function getOpenSectionForPage(page: string | undefined): string | null {
  if (!page) return null
  if (["route-list", "deliveries", "custom"].includes(page)) return "Operations"
  if (page === "rooster") return "Schedule"
  if (["plano-vm", "gallery-album", "gallery-site-images"].includes(page)) return "Gallery"
  return null
}

const ALL_NAV_ITEMS = [
  {
    title: "Operations",
    url: "#",
    icon: Package,
    color: "hsl(var(--accent-emerald))",
    items: [
      { title: "Route List", url: "#", page: "route-list" },
      { title: "Location",   url: "#", page: "deliveries" },
      { title: "Custom",     url: "#", page: "custom" },
    ],
  },
  {
    title: "Schedule",
    url: "#",
    icon: CalendarDays,
    color: "hsl(var(--accent-indigo))",
    items: [
      { title: "Rooster", url: "#", page: "rooster" },
    ],
  },
  {
    title: "Gallery",
    url: "#",
    icon: Images,
    color: "hsl(var(--accent-pink))",
    items: [
      { title: "Plano VM",    url: "#", page: "plano-vm" },
      { title: "Site Images", url: "#", page: "gallery-site-images" },
    ],
  },
] as const

export function AppSidebar({
  onNavigate,
  currentPage,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onNavigate?: (page: string) => void
  currentPage?: string
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [actionOpen, setActionOpen] = React.useState(false)
  const actionRef = React.useRef<HTMLDivElement>(null)
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const touchStartYRef = React.useRef<number | null>(null)
  const [unsavedDialogOpen, setUnsavedDialogOpen] = React.useState(false)
  const [isEditModeTransitioning, setIsEditModeTransitioning] = React.useState(false)
  const [openItem, setOpenItem] = React.useState<string | null>(
    () => getOpenSectionForPage(currentPage)
  )

  const { setOpenMobile } = useSidebar()
  const { isEditMode, setIsEditMode, hasUnsavedChanges, saveChanges, isSaving, discardChanges } = useEditMode()
  const { mode, toggleMode } = useTheme()
  const isDark = mode === "dark"

  const q = searchQuery.trim()

  React.useEffect(() => {
    const section = getOpenSectionForPage(currentPage)
    if (section) setOpenItem(section)
  }, [currentPage])

  React.useEffect(() => {
    if (!actionOpen) return
    const handler = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) setActionOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [actionOpen])

  React.useEffect(() => {
    if (!openItem) return
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) setOpenItem(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openItem])

  const navigate = React.useCallback(
    (page: string) => { onNavigate?.(page); setOpenMobile(false) },
    [onNavigate, setOpenMobile]
  )

  const applyEditModeChange = (next: boolean) => {
    setIsEditModeTransitioning(true)
    window.setTimeout(() => { setIsEditMode(next); setIsEditModeTransitioning(false) }, 260)
  }

  const handleEditModeToggle = () => {
    if (isEditModeTransitioning) return
    if (isEditMode && hasUnsavedChanges) setUnsavedDialogOpen(true)
    else applyEditModeChange(!isEditMode)
  }

  type NavItemDef = {
    title: string; url: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    color: string; isActive?: boolean; page?: string
    items?: { title: string; url: string; page?: string }[]
  }

  const navItems: NavItemDef[] = React.useMemo(() => {
    const withActive = ALL_NAV_ITEMS.map(section => ({
      ...section,
      isActive: section.items.some(i => i.page === currentPage),
      items: [...section.items],
    }))
    if (!q) return withActive
    return withActive
      .map(section => {
        const parentMatch = matchesSearch(section.title, q)
        const filteredChildren = section.items.filter(sub => matchesSearch(sub.title, q))
        if (parentMatch) return { ...section }
        if (filteredChildren.length > 0) return { ...section, items: filteredChildren }
        return null
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
  }, [currentPage, q])

  const showHome     = !q || matchesSearch("Home", q)
  const showSettings = !q || matchesSearch("Settings", q)
  const noResults    = q.length > 0 && !showHome && navItems.length === 0 && !showSettings
  const isSettingsActive = currentPage?.startsWith("settings") ?? false

  /* shared colour tokens */
  const divider   = isDark ? "bg-white/[0.07]"    : "bg-black/[0.07]"
  const labelCls  = `text-[9.5px] font-bold uppercase tracking-[0.13em] ${isDark ? "text-white/25" : "text-black/28"}`

  return (
    <>
      <Sidebar {...props} variant="floating">
        <div
          ref={sidebarRef}
          className="flex flex-col h-full min-h-0 overflow-hidden"
          style={{
            borderRadius: 16,
            background: isDark
              ? "linear-gradient(160deg,rgba(15,23,42,0.95) 0%,rgba(10,14,20,0.98) 100%)"
              : "linear-gradient(160deg,rgba(248,250,252,0.95) 0%,rgba(255,255,255,0.98) 100%)",
          }}
        >

          {/* ── Header ───────────────────────────────────────────── */}
          <SidebarHeader className="p-0 shrink-0">

            {/* Cover image + brand */}
            <div
              className="relative overflow-hidden"
              style={{
                height: 112,
                borderRadius: "16px 16px 0 0",
                background: isDark
                    ? "linear-gradient(180deg,rgba(15,23,42,0.12) 0%,rgba(15,23,42,0.80) 100%)"
                    : "linear-gradient(180deg,rgba(248,250,252,0.28) 0%,rgba(255,255,255,0.88) 100%)",
                }}
              >
                <img
                  src="/icon/IMG_0011.jpeg"
                  alt="" aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: isDark ? 0.32 : 0.62 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: isDark
                      ? "linear-gradient(180deg,rgba(15,23,42,0.22) 0%,rgba(15,23,42,0.82) 100%)"
                      : "linear-gradient(180deg,rgba(255,255,255,0.15) 0%,rgba(244,246,250,0.75) 100%)",
                  }}
                />

              {/* Logo + name — pinned to bottom, consistent with content px-4 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 flex items-center gap-2.5">
                <img src="/FamilyMart.png" alt="FM" className="w-8 h-8 object-contain shrink-0" />
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold leading-snug truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                    Vending Machine
                  </p>
                  <p className={`text-[9px] leading-snug ${isDark ? "text-white/40" : "text-black/38"}`}>
                    Delivery Operations
                  </p>
                </div>
              </div>
            </div>

            {/* Search — matches content horizontal padding */}
            <div className="px-4 pt-3 pb-2">
              <div
                className="relative flex items-center h-8 rounded-lg"
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
                }}
              >
                <Search className={`absolute left-2.5 size-3 shrink-0 pointer-events-none ${isDark ? "text-white/30" : "text-black/28"}`} />
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full h-full bg-transparent outline-none text-[12px] pl-7 ${searchQuery ? "pr-7" : "pr-3"}
                    ${isDark ? "text-white/80 placeholder:text-white/25" : "text-gray-800 placeholder:text-black/25"}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-2.5 transition-colors ${isDark ? "text-white/30 hover:text-white/60" : "text-black/28 hover:text-black/55"}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Divider under header */}
            <div className={`mx-4 h-px ${divider}`} />
          </SidebarHeader>

          {/* ── Content ──────────────────────────────────────────── */}
          <SidebarContent className="px-3 pt-2 pb-1 gap-0 overflow-y-auto min-h-0">

            {/* Navigation section */}
            {(showHome || navItems.length > 0) && (
              <p className={`${labelCls} px-1 mb-1.5 mt-0.5`}>Navigation</p>
            )}

            {showHome && (
              <NavButton
                icon={<House className="size-3.5" style={{ color: "#6366f1" }} />}
                label="Home"
                isActive={currentPage === "home"}
                isDark={isDark}
                onClick={() => navigate("home")}
              />
            )}

            {navItems.length > 0 && (
              <NavMain
                items={navItems as Parameters<typeof NavMain>[0]["items"]}
                onSubItemClick={navigate}
                searchQuery={q}
                currentPage={currentPage}
                openItem={openItem}
                onOpenItemChange={setOpenItem}
              />
            )}

            {/* Settings section */}
            {showSettings && (
              <>
                <div className={`h-px ${divider} my-2`} />
                <p className={`${labelCls} px-1 mb-1.5`}>General</p>
                <NavButton
                  icon={<Cog className="size-3.5" style={{ color: "#f59e0b" }} />}
                  label="Settings"
                  isActive={isSettingsActive}
                  isDark={isDark}
                  onClick={() => navigate("settings")}
                />
              </>
            )}

            {/* No results */}
            {noResults && (
              <div className="flex flex-col items-center gap-1 py-8 text-center">
                <p className={`text-xs font-medium ${isDark ? "text-white/30" : "text-black/30"}`}>No results</p>
                <p className={`text-[11px] ${isDark ? "text-white/20" : "text-black/20"}`}>Try a different keyword</p>
              </div>
            )}
          </SidebarContent>

          {/* ── Footer ───────────────────────────────────────────── */}
          <SidebarFooter className="px-3 pt-0 pb-2 shrink-0">
            {/* Quick actions */}
            <div className="relative" ref={actionRef}>

              {/* Slide-up panel */}
              <div
                className="absolute bottom-full left-0 right-0 mb-1.5 z-[70] rounded-xl overflow-hidden"
                style={{
                  transition: "opacity 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
                  opacity: actionOpen ? 1 : 0,
                  transform: actionOpen ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
                  pointerEvents: actionOpen ? "auto" : "none",
                  background: isDark ? "rgba(18,22,32,0.98)" : "rgba(255,255,255,0.98)",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isDark ? "0 16px 36px rgba(0,0,0,0.55)" : "0 6px 24px rgba(0,0,0,0.11)",
                  backdropFilter: "blur(20px)",
                }}
                onTouchStart={e => { touchStartYRef.current = e.touches[0].clientY }}
                onTouchEnd={e => {
                  if (touchStartYRef.current === null) return
                  const delta = e.changedTouches[0].clientY - touchStartYRef.current
                  touchStartYRef.current = null
                  if (delta > 50) setActionOpen(false)
                }}
              >
                {/* Panel header */}
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
                  <Zap className="size-3 text-amber-400 shrink-0" />
                  <span className={`text-[9.5px] font-bold uppercase tracking-[0.13em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                    Quick Actions
                  </span>
                </div>
                <div className={`h-px ${divider} mx-3 mb-0.5`} />

                {/* Theme row */}
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors
                    ${isDark ? "hover:bg-white/5" : "hover:bg-black/4"}`}
                >
                  {isDark
                    ? <Moon className="size-3.5 text-indigo-400 shrink-0" />
                    : <Sun className="size-3.5 text-amber-500 shrink-0" />}
                  <span className={`flex-1 text-[11px] font-medium text-left ${isDark ? "text-white/70" : "text-gray-600"}`}>
                    {isDark ? "Dark Mode" : "Light Mode"}
                  </span>
                  <span onClick={e => e.stopPropagation()}>
                    <Switch size="sm" className="fcal-switch-sidebar" checked={isDark} onCheckedChange={toggleMode} />
                  </span>
                </button>

                {/* Edit mode row */}
                <button
                  type="button"
                  onClick={handleEditModeToggle}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 pb-2.5 transition-colors
                    ${isDark ? "hover:bg-white/5" : "hover:bg-black/4"}`}
                >
                  {isEditModeTransitioning
                    ? <LoadingSpinner size={14} className="text-primary shrink-0" />
                    : <Pencil className={`size-3.5 shrink-0 ${isEditMode ? "text-emerald-400" : isDark ? "text-white/35" : "text-black/32"}`} />}
                  <span className={`flex-1 text-[11px] font-medium text-left ${isDark ? "text-white/70" : "text-gray-600"}`}>
                    {isEditModeTransitioning ? "Switching…" : "Edit Mode"}
                  </span>
                  {!isEditModeTransitioning && (
                    <span onClick={e => e.stopPropagation()}>
                      <Switch size="sm" className="fcal-switch-sidebar" checked={isEditMode} onCheckedChange={handleEditModeToggle} />
                    </span>
                  )}
                </button>
              </div>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setActionOpen(v => !v)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150
                  ${actionOpen
                    ? isDark ? "bg-white/8" : "bg-black/6"
                    : isDark ? "hover:bg-white/5" : "hover:bg-black/4"
                  }`}
              >
                <Zap className="size-3.5 text-amber-400 shrink-0" />
                <span className={`flex-1 text-[12px] font-medium ${isDark ? "text-white/65" : "text-gray-600"}`}>
                  Quick Actions
                </span>
                <ChevronsUpDown
                  className={`size-3.5 shrink-0 transition-transform duration-200 ${isDark ? "text-white/22" : "text-black/25"}`}
                  style={{ transform: actionOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </div>

            <div className={`h-px ${divider} mb-2`} />
            {/* Version */}
            <p className={`mt-0.5 mx-auto text-center text-[9px] tracking-wide ${isDark ? "text-white/40" : "text-black/40"}`}>
              Dbrutals · v1.0.0
            </p>
          </SidebarFooter>
        </div>
      </Sidebar>

      {/* Unsaved dialog */}
      <Dialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ zIndex: 300 }}>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do before turning off Edit Mode?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => { discardChanges(); setUnsavedDialogOpen(false); setIsEditMode(false) }}>
              Discard Changes
            </Button>
            <Button onClick={async () => { await saveChanges(); setUnsavedDialogOpen(false); setIsEditMode(false) }} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save & Turn Off"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ── Nav button ───────────────────────────────────────────────────────────── */
function NavButton({
  icon, label, isActive, isDark, onClick,
}: {
  icon: React.ReactNode
  label: string
  isActive: boolean
  isDark: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all duration-150 text-left
        ${isActive
          ? isDark ? "bg-white/10" : "bg-black/7"
          : isDark ? "hover:bg-white/5" : "hover:bg-black/4"
        }`}
    >
      {icon}
      <span className={`flex-1 text-[12.5px] font-medium leading-none
        ${isActive ? (isDark ? "text-white" : "text-gray-900") : (isDark ? "text-white/60" : "text-gray-600")}`}>
        {label}
      </span>
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
    </button>
  )
}
