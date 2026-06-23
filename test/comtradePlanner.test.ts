import { describe, expect, it } from 'vitest'
import {
  buildQueryPlan,
  describeQueryScope,
  nextRunWindow,
  planKey,
  type ComtradeQueryFilter,
} from '../electron/osint/adapters/comtradePlanner'

function filter(commodityCodes: string[]): ComtradeQueryFilter {
  return {
    typeCode: 'C',
    freqCode: 'A',
    classification: 'HS',
    reporterCode: '842',
    partnerCode: '0',
    flowCode: 'M,X',
    period: '2024',
    commodityCodes,
  }
}

const codes = Array.from({ length: 230 }, (_, i) => String(100000 + i))

describe('UN Comtrade bounded query planner', () => {
  it('batches all commodity codes by batchSize (all commodities, bounded pulls)', () => {
    const plan = buildQueryPlan(filter(codes), { batchSize: 50, maxRequestsPerRun: 5 })
    expect(plan.totalCommodities).toBe(230)
    expect(plan.totalBatches).toBe(5) // ceil(230/50)
    expect(plan.batches[0].commodityCodes).toHaveLength(50)
    expect(plan.batches[4].commodityCodes).toHaveLength(30)
    // Every code is covered exactly once across batches.
    const flat = plan.batches.flatMap((b) => b.commodityCodes)
    expect(flat).toHaveLength(230)
    expect(new Set(flat).size).toBe(230)
  })

  it('dedupes codes and clamps batch size', () => {
    const plan = buildQueryPlan(filter(['1', '1', '2', '']), { batchSize: 9999 })
    expect(plan.totalCommodities).toBe(2)
    expect(plan.batchSize).toBeLessThanOrEqual(100)
  })

  it('runs only maxRequestsPerRun batches and resumes from the checkpoint', () => {
    const plan = buildQueryPlan(filter(codes), { batchSize: 50, maxRequestsPerRun: 2 })
    expect(plan.totalBatches).toBe(5)

    const run1 = nextRunWindow(plan, null)
    expect(run1.batches.map((b) => b.index)).toEqual([0, 1])
    expect(run1.done).toBe(false)
    expect(run1.nextCheckpoint.nextBatchIndex).toBe(2)

    const run2 = nextRunWindow(plan, run1.nextCheckpoint)
    expect(run2.batches.map((b) => b.index)).toEqual([2, 3])

    const run3 = nextRunWindow(plan, run2.nextCheckpoint)
    expect(run3.batches.map((b) => b.index)).toEqual([4])
    expect(run3.done).toBe(true)
  })

  it('ignores a checkpoint from a different plan scope (restarts at 0)', () => {
    const plan = buildQueryPlan(filter(codes), { batchSize: 50, maxRequestsPerRun: 2 })
    const foreign = { planKey: 'different-scope', nextBatchIndex: 4, completedBatches: 4, totalBatches: 5, updatedAt: 0 }
    const run = nextRunWindow(plan, foreign)
    expect(run.batches.map((b) => b.index)).toEqual([0, 1])
  })

  it('describes the query scope before/after a fetch', () => {
    const plan = buildQueryPlan(filter(codes), { batchSize: 50, maxRequestsPerRun: 2 })
    const scope = describeQueryScope(plan)
    expect(scope).toMatchObject({ reporterCode: '842', partnerCode: '0', period: '2024', classification: 'HS', totalCommodities: 230, totalBatches: 5, estimatedRuns: 3 })
    expect(planKey(plan)).toContain('842')
  })
})
