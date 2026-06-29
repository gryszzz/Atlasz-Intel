import type { ComponentType, HTMLAttributes, ReactNode } from 'react'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type FrameProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function AppShell({ className, children, ...props }: FrameProps) {
  return (
    <main className={cx('app-shell', className)} {...props}>
      {children}
    </main>
  )
}

export function PageFrame({ className, children, ...props }: FrameProps) {
  return (
    <section className={cx('page-frame', className)} {...props}>
      {children}
    </section>
  )
}

export function SectionHeader({
  icon: Icon,
  label,
  title,
  children,
  className,
  ...props
}: FrameProps & {
  icon?: ComponentType<{ size?: number | string }>
  label: string
  title: string
}) {
  return (
    <header className={cx('panel-header', className)} {...props}>
      <div>
        {Icon ? <Icon size={16} /> : null}
        <span>{label}</span>
      </div>
      <h2>{title}</h2>
      {children}
    </header>
  )
}

export function CardGrid({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('card-grid', className)} {...props}>
      {children}
    </div>
  )
}

export function ScrollPanel({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('scroll-panel', className)} {...props}>
      {children}
    </div>
  )
}

export function DataTableFrame({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('data-table-frame', className)} {...props}>
      {children}
    </div>
  )
}

export function DrawerFrame({ className, children, ...props }: FrameProps) {
  return (
    <aside className={cx('drawer-frame', className)} {...props}>
      {children}
    </aside>
  )
}

export function EmptyState({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('empty-state', className)} {...props}>
      {children}
    </div>
  )
}

export function ErrorState({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('empty-state error-state', className)} {...props}>
      {children}
    </div>
  )
}

export function LoadingState({ label = 'Loading', className, ...props }: HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div className={cx('empty-state', className)} {...props}>
      <span>{label}</span>
    </div>
  )
}

export function OverflowText({ as: Tag = 'span', className, children, ...props }: FrameProps & { as?: 'span' | 'p' | 'strong' | 'em' }) {
  return (
    <Tag className={cx('overflow-text', className)} {...props}>
      {children}
    </Tag>
  )
}

export function StatusChipRow({ className, children, ...props }: FrameProps) {
  return (
    <div className={cx('status-chip-row', className)} {...props}>
      {children}
    </div>
  )
}
