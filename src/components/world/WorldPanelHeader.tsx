import type { ComponentType } from 'react'

/** Shared panel header for World Intelligence surfaces. Light; not lazy. */
export function WorldPanelHeader({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number }>
  label: string
  value: string
}) {
  return (
    <header className="world-panel-header">
      <div>
        <Icon size={15} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
    </header>
  )
}
