import { useState, useEffect } from "react"

interface SharedDeliveryPoint {
  code: string
  name: string
  delivery: string
  latitude: number
  longitude: number
  descriptions: { key: string; value: string }[]
}

interface SharedColumnDef {
  key: string
  label: string
}

export interface SharedRouteData {
  routeName: string
  routeCode: string
  routeShift: string
  routeColor?: string
  points: SharedDeliveryPoint[]
  columns: SharedColumnDef[]
  createdAt: string
}

const ACTIVE_DELIVERIES = new Set(['Daily', 'Weekday', 'Alt 1', 'Alt 2'])

function isDeliveryActive(delivery: string): boolean {
  return ACTIVE_DELIVERIES.has(delivery) || delivery.toLowerCase() !== 'inactive'
}

function getThemeClass(): string {
  try {
    const mode = localStorage.getItem('fcalendar_color_mode') ?? 'dark'
    return mode === 'dark' ? 'dark' : ''
  } catch {
    return 'dark'
  }
}

interface Props {
  code: string
}

export function SharedRoutePage({ code }: Props) {
  const [data, setData] = useState<SharedRouteData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [themeClass, setThemeClass] = useState(getThemeClass)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`fcalendar_share_${code}`)
      if (!raw) { setNotFound(true); return }
      const parsed = JSON.parse(raw) as SharedRouteData
      setData(parsed)
    } catch {
      setNotFound(true)
    }
  }, [code])

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeClass(getThemeClass()))
    obs.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const cls = themeClass
    document.documentElement.classList.toggle('dark', cls === 'dark')
  }, [themeClass])

  if (notFound) {
    return (
      <div className={`${themeClass} min-h-screen bg-background text-foreground flex items-center justify-center`}>
        <div className="text-center space-y-2 p-8">
          <p className="text-2xl font-bold">Link not found</p>
          <p className="text-muted-foreground text-sm">This share link may have expired or was never created on this device.</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={`${themeClass} min-h-screen bg-background text-foreground flex items-center justify-center`}>
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  const visibleCols = data.columns.filter(c => c.key !== 'action')

  return (
    <div className={`${themeClass} min-h-screen bg-background text-foreground flex flex-col`}>
      {/* Header */}
      <div
        className="shrink-0 px-4 py-3 border-b border-border/70 flex items-center gap-3"
        style={{ background: 'hsl(var(--background)/0.98)' }}
      >
        <div
          className="size-2.5 rounded-full shrink-0"
          style={{ background: data.routeColor ?? '#06b6d4' }}
        />
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">{data.routeName}</span>
          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{data.routeCode}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{
              background: data.routeShift === 'AM' ? 'hsl(38 100% 50% / 0.15)' : 'hsl(250 60% 55% / 0.15)',
              color: data.routeShift === 'AM' ? 'hsl(38 95% 45%)' : 'hsl(250 80% 70%)',
            }}
          >
            {data.routeShift}
          </span>
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground shrink-0">
          {data.points.length} stop{data.points.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-[11px] whitespace-nowrap min-w-max w-full text-center [&_th]:!text-center [&_td]:!text-center [&_th]:align-middle [&_td]:align-middle">
          <thead className="sticky top-0 z-10" style={{ background: 'hsl(var(--background)/0.95)', backdropFilter: 'blur(4px)' }}>
            <tr>
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  className="px-4 h-10 text-center text-[9px] font-bold uppercase tracking-wider border-b border-border/70"
                  style={{ color: 'hsl(var(--foreground)/0.72)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Starting point row */}
            <tr className="bg-background text-center">
              {visibleCols.map(col => {
                if (col.key === 'no') return (
                  <td key="no" className="px-4 h-9 text-center">
                    <span className="text-[9px] font-semibold tabular-nums" style={{ color: data.routeColor ?? '#06b6d4' }}>∞</span>
                  </td>
                )
                if (col.key === 'code') return (
                  <td key="code" className="px-4 h-9 text-center">
                    <span className="text-[9px] font-semibold">QLK</span>
                  </td>
                )
                if (col.key === 'name') return (
                  <td key="name" className="px-3 h-9 text-center">
                    <span className="text-[9px] font-semibold">QL Kitchen</span>
                  </td>
                )
                if (col.key === 'delivery') return (
                  <td key="delivery" className="px-3 h-9 text-center">
                    <span className="text-[9px] font-semibold">Available</span>
                  </td>
                )
                if (col.key === 'km') return (
                  <td key="km" className="px-3 h-9 text-center">
                    <span className="text-[9px] font-semibold tabular-nums">0 Km</span>
                  </td>
                )
                return <td key={col.key} className="px-4 h-9" />
              })}
            </tr>

            {data.points.map((point, index) => {
              const active = isDeliveryActive(point.delivery)
              return (
                <tr
                  key={point.code}
                  className={`transition-colors duration-100 text-center ${
                    active
                      ? index % 2 === 0
                        ? 'bg-background hover:bg-muted/30'
                        : 'bg-muted/20 hover:bg-muted/35'
                      : 'bg-muted/30 text-muted-foreground/80 hover:bg-muted/45'
                  }`}
                >
                  {visibleCols.map(col => {
                    if (col.key === 'no') return (
                      <td key="no" className="px-4 h-9 text-center">
                        <span className="text-[9px] font-semibold tabular-nums" style={{ color: data.routeColor ?? '#06b6d4' }}>
                          {index + 1}
                        </span>
                      </td>
                    )
                    if (col.key === 'code') return (
                      <td key="code" className="px-4 h-9 text-center">
                        <span className="text-[9px] font-semibold">{point.code}</span>
                      </td>
                    )
                    if (col.key === 'name') return (
                      <td key="name" className="px-3 h-9 text-center min-w-[120px]">
                        <span className="text-[11px]">{point.name}</span>
                      </td>
                    )
                    if (col.key === 'delivery') return (
                      <td key="delivery" className="px-3 h-9 text-center">
                        <span
                          className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: active ? 'hsl(var(--primary)/0.1)' : 'hsl(var(--muted))',
                            color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {point.delivery}
                        </span>
                      </td>
                    )
                    if (col.key === 'km') return (
                      <td key="km" className="px-3 h-9 text-center">
                        <span className="text-[9px] tabular-nums text-muted-foreground">—</span>
                      </td>
                    )
                    return <td key={col.key} className="px-4 h-9" />
                  })}
                </tr>
              )
            })}

            {data.points.length === 0 && (
              <tr>
                <td colSpan={visibleCols.length} className="py-10 text-center">
                  <p className="text-sm font-semibold">No delivery points</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2 border-t border-border/40 text-[10px] text-muted-foreground/60 text-center">
        Shared via Dbrutals · {new Date(data.createdAt).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}
