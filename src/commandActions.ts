import type { ComponentType } from 'react'

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
