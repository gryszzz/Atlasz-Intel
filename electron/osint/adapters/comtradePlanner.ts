/*
 * UN Comtrade bounded query planner.
 *
 * Turns a reporter/partner/flow/year/classification filter plus the FULL set of
 * commodity codes (discovered from the catalog) into a sequence of bounded request
 * batches. Two safety rails enforce "all commodities, bounded pulls only":
 *   - batchSize caps commodity codes per request (UN limits codes per call);
 *   - maxRequestsPerRun caps how many batches a single run may execute, with a
 *     checkpoint so the next run resumes where this one stopped.
 * Pure and deterministic — no network here.
 */

export type ComtradeQueryFilter = {
  typeCode: string
  freqCode: string
  classification: string
  reporterCode: string
  partnerCode: string
  flowCode: string
  period: string
  /** All commodity codes to cover (typically the full catalog leaf set). */
  commodityCodes: string[]
}

export type ComtradeQueryBatch = {
  index: number
  typeCode: string
  freqCode: string
  classification: string
  reporterCode: string
  partnerCode: string
  flowCode: string
  period: string
  commodityCodes: string[]
}

export type ComtradeQueryPlan = {
  filter: ComtradeQueryFilter
  batches: ComtradeQueryBatch[]
  batchSize: number
  totalCommodities: number
  totalBatches: number
  maxRequestsPerRun: number
}

export type ComtradeCheckpoint = {
  planKey: string
  nextBatchIndex: number
  completedBatches: number
  totalBatches: number
  updatedAt: number
}

export type ComtradeRunWindow = {
  batches: ComtradeQueryBatch[]
  nextCheckpoint: ComtradeCheckpoint
  done: boolean
}

const DEFAULT_BATCH_SIZE = 50
const MAX_BATCH_SIZE = 100
const DEFAULT_MAX_REQUESTS_PER_RUN = 5
const MAX_REQUESTS_CAP = 50

export function buildQueryPlan(
  filter: ComtradeQueryFilter,
  options: { batchSize?: number; maxRequestsPerRun?: number } = {},
): ComtradeQueryPlan {
  const batchSize = clampInt(options.batchSize ?? DEFAULT_BATCH_SIZE, 1, MAX_BATCH_SIZE)
  const maxRequestsPerRun = clampInt(options.maxRequestsPerRun ?? DEFAULT_MAX_REQUESTS_PER_RUN, 1, MAX_REQUESTS_CAP)
  // Dedupe + drop empties so the full catalog can be passed in directly.
  const codes = unique(filter.commodityCodes.map((code) => code.trim()).filter(Boolean))
  const batches: ComtradeQueryBatch[] = []
  for (let i = 0; i < codes.length; i += batchSize) {
    batches.push({
      index: batches.length,
      typeCode: filter.typeCode,
      freqCode: filter.freqCode,
      classification: filter.classification,
      reporterCode: filter.reporterCode,
      partnerCode: filter.partnerCode,
      flowCode: filter.flowCode,
      period: filter.period,
      commodityCodes: codes.slice(i, i + batchSize),
    })
  }
  return {
    filter: { ...filter, commodityCodes: codes },
    batches,
    batchSize,
    totalCommodities: codes.length,
    totalBatches: batches.length,
    maxRequestsPerRun,
  }
}

/** A stable key identifying a plan's scope, used to validate a resumed checkpoint. */
export function planKey(plan: ComtradeQueryPlan): string {
  const f = plan.filter
  return [f.typeCode, f.freqCode, f.classification, f.reporterCode, f.partnerCode, f.flowCode, f.period, plan.totalCommodities, plan.batchSize].join('|')
}

/**
 * Select the batches to run THIS execution, starting from a prior checkpoint and
 * bounded by maxRequestsPerRun. Returns the next checkpoint so a later run resumes.
 * A checkpoint from a different plan scope is ignored (restart from 0).
 */
export function nextRunWindow(plan: ComtradeQueryPlan, checkpoint: ComtradeCheckpoint | null, now = Date.now()): ComtradeRunWindow {
  const key = planKey(plan)
  const start = checkpoint && checkpoint.planKey === key ? clampInt(checkpoint.nextBatchIndex, 0, plan.totalBatches) : 0
  const end = Math.min(plan.totalBatches, start + plan.maxRequestsPerRun)
  const batches = plan.batches.slice(start, end)
  return {
    batches,
    nextCheckpoint: {
      planKey: key,
      nextBatchIndex: end,
      completedBatches: end,
      totalBatches: plan.totalBatches,
      updatedAt: now,
    },
    done: end >= plan.totalBatches,
  }
}

export type ComtradeQueryScope = {
  reporterCode: string
  partnerCode: string
  flowCode: string
  period: string
  classification: string
  totalCommodities: number
  totalBatches: number
  batchSize: number
  maxRequestsPerRun: number
  estimatedRuns: number
}

/** Human-readable scope BEFORE/AFTER a fetch — what will be (or was) pulled. */
export function describeQueryScope(plan: ComtradeQueryPlan): ComtradeQueryScope {
  return {
    reporterCode: plan.filter.reporterCode,
    partnerCode: plan.filter.partnerCode,
    flowCode: plan.filter.flowCode,
    period: plan.filter.period,
    classification: plan.filter.classification,
    totalCommodities: plan.totalCommodities,
    totalBatches: plan.totalBatches,
    batchSize: plan.batchSize,
    maxRequestsPerRun: plan.maxRequestsPerRun,
    estimatedRuns: Math.max(1, Math.ceil(plan.totalBatches / plan.maxRequestsPerRun)),
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}
