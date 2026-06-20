/**
 * Command Palette (Ctrl/Cmd + K) — instant jump-actions across Atlasz modules.
 *
 * Fully self-contained: it owns its open/close state, the global hotkey
 * listener, fuzzy filtering, and keyboard navigation. Integrating it into the
 * shell is a single line — pass it a list of CommandActions.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Command, Compass, CornerDownLeft, Search } from 'lucide-react'
import type { CommandAction } from './commandActions'
import './CommandPalette.css'

const COMMAND_MENU_EVENT = 'atlasz:command-menu'

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
  placeholder = 'Search Atlasz — modules, markets, research notes…',
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

  // Global hotkey: Ctrl/Cmd+K toggles the palette; a window event opens it so
  // any visible affordance (e.g. the topbar button) can trigger it without
  // prop drilling. Transient state is reset inside the updater (not an effect)
  // to avoid cascading renders.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => {
          const next = !current
          if (next) {
            setQuery('')
            setActiveIndex(0)
          }
          return next
        })
      }
    }
    function onOpenRequest() {
      setQuery('')
      setActiveIndex(0)
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(COMMAND_MENU_EVENT, onOpenRequest)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(COMMAND_MENU_EVENT, onOpenRequest)
    }
  }, [])

  // Focus the input when the palette opens (external-system sync, no setState).
  useEffect(() => {
    if (!open) {
      return undefined
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  if (!open) {
    return null
  }

  // Derive the in-bounds highlighted row instead of storing/clamping it, so a
  // shrinking result list never leaves the selection out of range.
  const maxIndex = Math.max(0, filtered.length - 1)
  const activeRow = Math.min(activeIndex, maxIndex)

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
      setActiveIndex(filtered.length === 0 ? 0 : (activeRow + 1) % filtered.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(filtered.length === 0 ? 0 : (activeRow - 1 + filtered.length) % filtered.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      runAt(activeRow)
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
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Atlasz command menu" onKeyDown={onListKeyDown}>
        <div className="cmdk-brand">
          <span className="cmdk-brand-mark" aria-hidden>
            <img src="/atlasz-logo.png" alt="" />
          </span>
          <span className="cmdk-brand-name">Atlasz Intel</span>
          <span className="cmdk-brand-sub">Command menu</span>
        </div>
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
            <div className="cmdk-empty">
              <Compass size={22} aria-hidden />
              <p>No commands match{query.trim() ? ` “${query.trim()}”` : ''}.</p>
              <span>Try a module name, or “research”, “pulse”, “market”.</span>
            </div>
          ) : (
            groups.map((group) => (
              <div className="cmdk-group" key={group.label}>
                <div className="cmdk-group-label">
                  {group.label}
                  <em>{group.items.length}</em>
                </div>
                {group.items.map(({ action, flatIndex }) => {
                  const Icon = action.icon
                  const isActive = flatIndex === activeRow
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      ref={(element) => {
                        if (isActive && element) {
                          element.scrollIntoView({ block: 'nearest' })
                        }
                      }}
                      className={isActive ? 'cmdk-item active' : 'cmdk-item'}
                      onMouseMove={() => setActiveIndex(flatIndex)}
                      onClick={() => runAt(flatIndex)}
                    >
                      <span className="cmdk-item-icon" aria-hidden>
                        {Icon ? <Icon size={15} /> : <Search size={15} />}
                      </span>
                      <span className="cmdk-item-label">{action.label}</span>
                      {action.hint ? <span className="cmdk-item-hint">{action.hint}</span> : <span />}
                      <span className="cmdk-item-enter" aria-hidden>
                        <CornerDownLeft size={12} />
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="cmdk-footer">
          <span className="cmdk-footer-hints">
            <span>
              <span className="cmdk-kbd">↑</span>
              <span className="cmdk-kbd">↓</span>
              navigate
            </span>
            <span>
              <span className="cmdk-kbd">
                <CornerDownLeft size={11} />
              </span>
              open
            </span>
            <span>
              <span className="cmdk-kbd">esc</span>
              close
            </span>
          </span>
          <span className="cmdk-footer-count">
            {filtered.length} command{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Visible affordance that opens the command menu — keeps Ctrl+K discoverable. */
export function CommandMenuButton() {
  return (
    <button
      type="button"
      className="cmdk-trigger"
      title="Open command menu (Ctrl/Cmd + K)"
      onClick={() => window.dispatchEvent(new Event(COMMAND_MENU_EVENT))}
    >
      <Command size={14} />
      <span>Command</span>
      <kbd>⌘K</kbd>
    </button>
  )
}
