import { describe, expect, it } from 'vitest'
import {
  ATLASZ_UI_REFERENCE_STACK,
  DESKTOP_INTELLIGENCE_SCREEN_QUESTIONS,
  DESKTOP_INTELLIGENCE_UI_FOCUS_AREAS,
  DESKTOP_UI_CORPUS,
  desktopUiEntryIsAdoptable,
  entriesForDesktopUiDomain,
  lookupDesktopUiEntry,
  summarizeDesktopUiCorpus,
  type DesktopUiDomainId,
} from '../src/desktopUiCorpus'

const requiredDomains: DesktopUiDomainId[] = [
  'desktop-app-shell',
  'ui-design-system',
  'dashboard-template',
  'data-table-app-structure',
  'charts-data-visualization',
  'intelligence-graphs',
  'maps-geospatial-dashboards',
  'dashboard-systems',
  'motion-premium-feel',
  'icons-visual-language',
  'command-palette-power-ux',
  'layout-panels-resizable-ui',
]

function entry(id: string) {
  const value = lookupDesktopUiEntry(id)
  if (!value) throw new Error(`missing desktop UI corpus entry ${id}`)
  return value
}

describe('desktop UI mastery corpus', () => {
  it('covers every requested desktop intelligence UI domain', () => {
    for (const domain of requiredDomains) {
      expect(entriesForDesktopUiDomain(domain).length).toBeGreaterThan(0)
    }

    expect(DESKTOP_UI_CORPUS.length).toBeGreaterThan(60)
  })

  it('keeps every UI source represented by a full source URL and design lesson', () => {
    const ids = new Set<string>()

    for (const corpusEntry of DESKTOP_UI_CORPUS) {
      expect(ids.has(corpusEntry.id)).toBe(false)
      ids.add(corpusEntry.id)
      expect(corpusEntry.upstreamUrl).toMatch(/^https:\/\/[^ ]+$/)
      expect(corpusEntry.capabilities.length).toBeGreaterThan(0)
      expect(corpusEntry.atlaszLesson.length).toBeGreaterThan(20)
      expect(corpusEntry.avoid.length).toBeGreaterThan(0)
    }
  })

  it('labels the current Atlasz UI stack without forcing a framework migration', () => {
    for (const id of ['electron', 'tailwindcss', 'recharts', 'xyflow', 'lucide']) {
      expect(entry(id).adoptionPosture).toBe('current-stack')
      expect(desktopUiEntryIsAdoptable(entry(id))).toBe(true)
    }

    expect(entry('tauri')).toMatchObject({
      adoptionPosture: 'migration-reference',
      upstreamUrl: 'https://github.com/tauri-apps/tauri',
    })
    expect(desktopUiEntryIsAdoptable(entry('tauri'))).toBe(false)
  })

  it('captures the strongest reference combo as reviewable entries', () => {
    for (const id of ATLASZ_UI_REFERENCE_STACK) {
      expect(entry(id)).toBeDefined()
    }

    expect(entry('shadcn-ui').adoptionPosture).toBe('candidate-library')
    expect(entry('tanstack-table').adoptionPosture).toBe('candidate-library')
    expect(entry('echarts').adoptionPosture).toBe('candidate-library')
    expect(entry('deck-gl').adoptionPosture).toBe('candidate-library')
    expect(entry('grafana').adoptionPosture).toBe('study-reference')
    expect(entry('superset').adoptionPosture).toBe('study-reference')
  })

  it('preserves the analyst workflow questions and focus areas', () => {
    expect(DESKTOP_INTELLIGENCE_SCREEN_QUESTIONS).toEqual([
      'What is happening?',
      'Why does it matter?',
      'What changed?',
      'What evidence supports it?',
      'What should the user inspect next?',
    ])

    expect(DESKTOP_INTELLIGENCE_UI_FOCUS_AREAS).toEqual(
      expect.arrayContaining([
        'information hierarchy',
        'dense data without confusion',
        'command palettes',
        'graph exploration',
        'source lineage views',
        'evidence trails',
      ]),
    )
  })

  it('summarizes adoption posture for future design review surfaces', () => {
    const summary = summarizeDesktopUiCorpus()

    expect(summary.entryCount).toBe(DESKTOP_UI_CORPUS.length)
    expect(summary.adoptableCount).toBeGreaterThan(10)
    expect(summary.adoptableCount).toBeLessThan(summary.entryCount)
    expect(summary.byDomain['ui-design-system']).toBeGreaterThan(5)
    expect(summary.byDomain['charts-data-visualization']).toBeGreaterThan(5)
    expect(summary.byPosture['current-stack']).toBeGreaterThanOrEqual(5)
    expect(summary.byPosture['study-reference']).toBeGreaterThan(20)
  })
})
