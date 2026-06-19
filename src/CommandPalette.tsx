/**
 * Command Palette (Ctrl/Cmd + K) — instant jump-actions across Atlasz modules.
 *
 * Fully self-contained: it owns its open/close state, the global hotkey
 * listener, fuzzy filtering, and keyboard navigation. Integrating it into the
 * shell is a single line — pass it a list of CommandActions.
 */
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import './CommandPalette.css'

export type CommandAction = {
  id: string
  label: string
  group?: string
  hint?: string
  /** Extra text matched by the fuzzy filter but not displayed. */
  keywords?: string
  icon?: ComponentType<{ size?: number | string }>
  perform: () => void
}

type NavLike = {
  id: string
  label: string
  icon?: ComponentType<{ size?: number | string }>
}

/** Map a list of view definitions to navigation CommandActions. */
export function buildNavActions<T extends NavLike>(
  views: T[],
  onNavigate: (id: T['id']) => void,
): CommandAction[] {
  return views.map((view) => ({
    id: `nav:${view.id}`,
    label: view.label,
    group: 'Navigate',
    hint: 'Jump to module',
    keywords: String(view.id),
    icon: view.icon,
    perform: () => onNavigate(view.id),
  }))
}

/** Case-insensitive subsequence match; returns a score (higher = better) or -1. */
function fuzzyScore(haystack: string, needle: string): number {
  if (needle.length === 0) {
    return 0
  }
  const text = haystack.toLowerCase()
  const query = needle.toLowerCase()
  let score = 0
  let textIndex = 0
  let consecutive = 0
  for (let i = 0; i < query.length; i += 1) {
    const char = query[i]
    const found = text.indexOf(char, textIndex)
    if (found === -1) {
      return -1
    }
    consecutive = found === textIndex ? consecutive + 1 : 0
    score += 1 + consecutive
    if (found === 0) {
      score += 2
    }
    textIndex = found + 1
  }
  return score
}

export function CommandPalette({
  actions,
  placeholder = 'Search modules and actions…',
}: {
  actions: CommandAction[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (query.trim() === '') {
      return actions
    }
    return actions
      .map((action) => ({
        action,
        score: fuzzyScore(`${action.label} ${action.group ?? ''} ${action.keywords ?? ''}`, query.trim()),
      }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.action)
  }, [actions, query])

  // Global hotkey: Ctrl/Cmd+K toggles the palette.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Reset transient state whenever the palette opens.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [open])

  // Keep the highlighted row within bounds as the list shrinks.
  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  if (!open) {
    return null
  }

  function runAt(index: number) {
    const action = filtered[index]
    if (!action) {
      return
    }
    action.perform()
    setOpen(false)
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (filtered.length === 0 ? 0 : (current + 1) % filtered.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (filtered.length === 0 ? 0 : (current - 1 + filtered.length) % filtered.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runAt(activeIndex)
    }
  }

  // Group the filtered actions while preserving the flat index used for nav.
  const groups: Array<{ label: string; items: Array<{ action: CommandAction; flatIndex: number }> }> = []
  filtered.forEach((action, flatIndex) => {
    const label = action.group ?? 'Actions'
    let group = groups.find((entry) => entry.label === label)
    if (!group) {
      group = { label, items: [] }
      groups.push(group)
    }
    group.items.push({ action, flatIndex })
  })

  return (
    <div
      className="cmdk-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false)
        }
      }}
    >
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onListKeyDown}>
        <div className="cmdk-search">
          <Search size={17} />
          <input
            ref={inputRef}
            value={query}
            placeholder={placeholder}
            aria-label="Command palette search"
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className="cmdk-kbd">ESC</span>
        </div>

        <div className="cmdk-list" role="listbox" aria-label="Commands">
          {filtered.length === 0 ? (
            <div className="cmdk-empty">No matching commands.</div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="cmdk-group-label">{group.label}</div>
                {group.items.map(({ action, flatIndex }) => {
                  const Icon = action.icon
                  const isActive = flatIndex === activeIndex
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={isActive ? 'cmdk-item active' : 'cmdk-item'}
                      onMouseMove={() => setActiveIndex(flatIndex)}
                      onClick={() => runAt(flatIndex)}
                    >
                      <span aria-hidden>{Icon ? <Icon size={15} /> : <Search size={15} />}</span>
                      <span className="cmdk-item-label">{action.label}</span>
                      {action.hint ? <span className="cmdk-item-hint">{action.hint}</span> : <span />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmdk-footer">
          <span>
            <span className="cmdk-kbd">↑</span>
            <span className="cmdk-kbd">↓</span>
            navigate
          </span>
          <span>
            <span className="cmdk-kbd">
              <CornerDownLeft size={11} />
            </span>
            select
          </span>
          <span>
            <span className="cmdk-kbd">⌘K</span>
            toggle
          </span>
        </div>
      </div>
    </div>
  )
}
