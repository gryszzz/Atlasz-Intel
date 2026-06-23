import { createRequire as e } from "node:module";
import { dirname as t, join as n } from "node:path";
import { fileURLToPath as r } from "node:url";
import { existsSync as i, mkdirSync as a, readFileSync as o, writeFileSync as s } from "node:fs";
import { Worker as c } from "node:worker_threads";
import { createHash as l } from "node:crypto";
import { EventEmitter as u } from "node:events";
//#region \0rolldown/runtime.js
var d = Object.create, f = Object.defineProperty, p = Object.getOwnPropertyDescriptor, m = Object.getOwnPropertyNames, h = Object.getPrototypeOf, g = Object.prototype.hasOwnProperty, _ = (e, t) => () => (e && (t = e(e = 0)), t), v = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), y = (e, t) => {
	let n = {};
	for (var r in e) f(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || f(n, Symbol.toStringTag, { value: "Module" }), n;
}, b = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = m(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !g.call(e, s) && s !== n && f(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = p(t, s)) || r.enumerable
	});
	return e;
}, x = (e, t, n) => (n = e == null ? {} : d(h(e)), b(t || !e || !e.__esModule ? f(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), S = (e) => g.call(e, "module.exports") ? e["module.exports"] : b(f({}, "__esModule", { value: !0 }), e), C = /* @__PURE__ */ e(import.meta.url), w = "\nCREATE TABLE IF NOT EXISTS daily_briefs (\n  id TEXT PRIMARY KEY,\n  date TEXT NOT NULL,\n  headline TEXT NOT NULL,\n  body TEXT NOT NULL,\n  severity TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS world_headlines (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  source TEXT NOT NULL,\n  url TEXT NOT NULL,\n  sector TEXT NOT NULL,\n  impact TEXT NOT NULL,\n  observed_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS decision_journal (\n  id TEXT PRIMARY KEY,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  thesis TEXT NOT NULL,\n  direction TEXT NOT NULL,\n  tickers TEXT NOT NULL,\n  conviction INTEGER NOT NULL,\n  emotional_state TEXT NOT NULL,\n  evidence_ids TEXT NOT NULL,\n  context TEXT NOT NULL,\n  review_date INTEGER NOT NULL,\n  status TEXT NOT NULL,\n  post_mortem TEXT NOT NULL,\n  outcome TEXT\n);\nCREATE TABLE IF NOT EXISTS market_ticks_daily (\n  id TEXT PRIMARY KEY,\n  symbol TEXT NOT NULL,\n  price REAL NOT NULL,\n  volume REAL NOT NULL,\n  source TEXT NOT NULL,\n  observed_at INTEGER NOT NULL,\n  trade_date TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS social_attention_batches (\n  id TEXT PRIMARY KEY,\n  target TEXT NOT NULL,\n  pressure REAL NOT NULL,\n  mention_velocity REAL NOT NULL,\n  sentiment_divergence_index REAL NOT NULL,\n  source TEXT NOT NULL,\n  observed_at INTEGER NOT NULL,\n  sample_count INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS entity_edges (\n  id TEXT PRIMARY KEY,\n  source TEXT NOT NULL,\n  target TEXT NOT NULL,\n  relation TEXT NOT NULL,\n  confidence REAL NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS signal_events (\n  id TEXT PRIMARY KEY,\n  type TEXT NOT NULL,\n  asset_or_topic_id TEXT NOT NULL,\n  severity TEXT NOT NULL,\n  evidence_ids TEXT NOT NULL,\n  confidence TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  explanation TEXT NOT NULL,\n  related_graph_nodes TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS source_audit_log (\n  id TEXT PRIMARY KEY,\n  event_type TEXT NOT NULL,\n  connector_id TEXT,\n  severity TEXT NOT NULL,\n  message TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  metadata TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS realtime_frames (\n  id TEXT PRIMARY KEY,\n  sequence INTEGER NOT NULL,\n  emitted_at INTEGER NOT NULL,\n  frame_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS osint_sources (\n  source_id TEXT PRIMARY KEY,\n  source_name TEXT NOT NULL,\n  source_type TEXT NOT NULL,\n  endpoint_type TEXT NOT NULL,\n  endpoint TEXT NOT NULL,\n  poll_interval_ms INTEGER NOT NULL,\n  rate_limit_ms INTEGER NOT NULL,\n  timeout_ms INTEGER NOT NULL,\n  enabled INTEGER NOT NULL,\n  status TEXT NOT NULL,\n  provenance TEXT NOT NULL,\n  last_success_at INTEGER,\n  last_error_at INTEGER,\n  last_error TEXT,\n  item_count INTEGER NOT NULL,\n  source_reliability_score REAL NOT NULL,\n  legal_safety_note TEXT NOT NULL,\n  parser_adapter TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS world_intel_events (\n  id TEXT PRIMARY KEY,\n  timestamp INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  summary TEXT NOT NULL,\n  country_codes TEXT NOT NULL,\n  region TEXT NOT NULL,\n  lat REAL,\n  lon REAL,\n  category TEXT NOT NULL,\n  severity TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  source_id TEXT NOT NULL,\n  source_url TEXT,\n  provenance TEXT NOT NULL,\n  affected_assets TEXT NOT NULL,\n  affected_sectors TEXT NOT NULL,\n  affected_commodities TEXT NOT NULL,\n  affected_currencies TEXT NOT NULL,\n  extracted_entities TEXT NOT NULL,\n  narrative_tags TEXT NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  dedupe_hash TEXT NOT NULL,\n  sub_records_json TEXT\n);\nCREATE TABLE IF NOT EXISTS sec_company_filings (\n  id TEXT PRIMARY KEY,\n  cik TEXT NOT NULL,\n  company_name TEXT NOT NULL,\n  ticker TEXT,\n  form_type TEXT NOT NULL,\n  accession_number TEXT NOT NULL,\n  filing_date TEXT NOT NULL,\n  report_date TEXT,\n  accepted_at INTEGER,\n  observed_at INTEGER NOT NULL,\n  primary_document TEXT,\n  source_url TEXT NOT NULL,\n  source_json_url TEXT NOT NULL,\n  source_name TEXT NOT NULL,\n  provenance TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  raw_payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS fred_macro_observations (\n  id TEXT PRIMARY KEY,\n  series_id TEXT NOT NULL,\n  title TEXT NOT NULL,\n  units TEXT NOT NULL,\n  frequency TEXT NOT NULL,\n  seasonal_adjustment TEXT NOT NULL,\n  observation_date TEXT NOT NULL,\n  observation_timestamp INTEGER NOT NULL,\n  value REAL NOT NULL,\n  raw_value TEXT NOT NULL,\n  source_url TEXT NOT NULL,\n  source_api_url TEXT NOT NULL,\n  source_name TEXT NOT NULL,\n  retrieved_at INTEGER NOT NULL,\n  provenance TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  raw_payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS treasury_fiscal_records (\n  id TEXT PRIMARY KEY,\n  dataset_id TEXT NOT NULL,\n  dataset_name TEXT NOT NULL,\n  table_id TEXT NOT NULL,\n  table_name TEXT NOT NULL,\n  record_date TEXT NOT NULL,\n  record_timestamp INTEGER NOT NULL,\n  metric_name TEXT NOT NULL,\n  metric_value REAL NOT NULL,\n  raw_value TEXT NOT NULL,\n  units TEXT NOT NULL,\n  source_url TEXT NOT NULL,\n  source_api_url TEXT NOT NULL,\n  source_name TEXT NOT NULL,\n  retrieved_at INTEGER NOT NULL,\n  provenance TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  raw_payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS bea_observations (\n  id TEXT PRIMARY KEY,\n  dataset_name TEXT NOT NULL,\n  table_name TEXT NOT NULL,\n  line_number TEXT NOT NULL,\n  line_description TEXT NOT NULL,\n  series_code TEXT,\n  time_period TEXT NOT NULL,\n  observation_date TEXT NOT NULL,\n  observation_timestamp INTEGER NOT NULL,\n  metric_name TEXT NOT NULL,\n  metric_value REAL NOT NULL,\n  raw_value TEXT NOT NULL,\n  units TEXT NOT NULL,\n  unit_multiplier TEXT,\n  source_url TEXT NOT NULL,\n  source_api_url TEXT NOT NULL,\n  source_name TEXT NOT NULL,\n  retrieved_at INTEGER NOT NULL,\n  provenance TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  raw_payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS eia_energy_records (\n  id TEXT PRIMARY KEY,\n  series_id TEXT NOT NULL,\n  title TEXT NOT NULL,\n  energy_category TEXT NOT NULL,\n  commodity TEXT NOT NULL,\n  region TEXT,\n  country_code TEXT,\n  period TEXT NOT NULL,\n  observation_date TEXT NOT NULL,\n  observation_timestamp INTEGER NOT NULL,\n  value REAL NOT NULL,\n  raw_value TEXT NOT NULL,\n  units TEXT NOT NULL,\n  source_url TEXT NOT NULL,\n  source_api_url TEXT NOT NULL,\n  source_name TEXT NOT NULL,\n  retrieved_at INTEGER NOT NULL,\n  provenance TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  raw_payload_hash TEXT NOT NULL,\n  raw_payload_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS user_theses (\n  id TEXT PRIMARY KEY,\n  timestamp INTEGER NOT NULL,\n  asset_symbol TEXT NOT NULL,\n  thesis_type TEXT NOT NULL,\n  trigger_event_id TEXT,\n  snapshot_metrics TEXT NOT NULL,\n  user_notes TEXT NOT NULL,\n  target_horizon_days INTEGER NOT NULL,\n  is_closed INTEGER NOT NULL,\n  performance_grade TEXT,\n  entry_price REAL,\n  current_return REAL,\n  one_day_return REAL,\n  seven_day_return REAL,\n  thirty_day_return REAL,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS world_intel_embeddings (\n  id TEXT PRIMARY KEY,\n  event_id TEXT NOT NULL,\n  timestamp INTEGER NOT NULL,\n  summary_hash TEXT NOT NULL,\n  embedding_model TEXT NOT NULL,\n  embedding_vector TEXT NOT NULL,\n  source_event_category TEXT NOT NULL,\n  provenance TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS country_intel_state (\n  country_code TEXT PRIMARY KEY,\n  state_json TEXT NOT NULL,\n  last_updated INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS asset_identity (\n  symbol TEXT PRIMARY KEY,\n  identity_json TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS user_favorites (\n  id TEXT PRIMARY KEY,\n  kind TEXT NOT NULL,\n  target_id TEXT NOT NULL,\n  label TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS quant_snapshots (\n  id TEXT PRIMARY KEY,\n  asset_symbol TEXT NOT NULL,\n  snapshot_json TEXT NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS event_asset_links (\n  id TEXT PRIMARY KEY,\n  event_id TEXT NOT NULL,\n  asset_symbol TEXT NOT NULL,\n  relation TEXT NOT NULL,\n  confidence REAL NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS source_health (\n  source_id TEXT PRIMARY KEY,\n  health_json TEXT NOT NULL,\n  updated_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS narrative_clusters (\n  id TEXT PRIMARY KEY,\n  cluster_json TEXT NOT NULL,\n  updated_at INTEGER NOT NULL\n);\nCREATE INDEX IF NOT EXISTS idx_decision_review ON decision_journal(status, review_date);\nCREATE INDEX IF NOT EXISTS idx_headline_observed ON world_headlines(observed_at);\nCREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_time ON market_ticks_daily(symbol, observed_at);\nCREATE INDEX IF NOT EXISTS idx_attention_target_time ON social_attention_batches(target, observed_at);\nCREATE INDEX IF NOT EXISTS idx_signal_created ON signal_events(created_at);\nCREATE INDEX IF NOT EXISTS idx_audit_created ON source_audit_log(created_at);\nCREATE INDEX IF NOT EXISTS idx_realtime_frames_window ON realtime_frames(emitted_at);\nCREATE INDEX IF NOT EXISTS idx_world_events_time ON world_intel_events(timestamp);\nCREATE INDEX IF NOT EXISTS idx_world_events_source ON world_intel_events(source_id, timestamp);\nCREATE INDEX IF NOT EXISTS idx_sec_filings_ticker_time ON sec_company_filings(ticker, observed_at);\nCREATE INDEX IF NOT EXISTS idx_sec_filings_cik_time ON sec_company_filings(cik, observed_at);\nCREATE INDEX IF NOT EXISTS idx_sec_filings_form_time ON sec_company_filings(form_type, observed_at);\nCREATE INDEX IF NOT EXISTS idx_fred_observations_series_time ON fred_macro_observations(series_id, observation_timestamp);\nCREATE INDEX IF NOT EXISTS idx_fred_observations_retrieved ON fred_macro_observations(retrieved_at);\nCREATE INDEX IF NOT EXISTS idx_treasury_fiscal_dataset_time ON treasury_fiscal_records(dataset_id, record_timestamp);\nCREATE INDEX IF NOT EXISTS idx_treasury_fiscal_retrieved ON treasury_fiscal_records(retrieved_at);\nCREATE INDEX IF NOT EXISTS idx_bea_observations_series_time ON bea_observations(dataset_name, table_name, line_number, observation_timestamp);\nCREATE INDEX IF NOT EXISTS idx_bea_observations_retrieved ON bea_observations(retrieved_at);\nCREATE INDEX IF NOT EXISTS idx_eia_energy_series_time ON eia_energy_records(series_id, observation_timestamp);\nCREATE INDEX IF NOT EXISTS idx_eia_energy_retrieved ON eia_energy_records(retrieved_at);\nCREATE INDEX IF NOT EXISTS idx_eia_energy_commodity_time ON eia_energy_records(commodity, observation_timestamp);\nCREATE INDEX IF NOT EXISTS idx_event_asset_links_asset ON event_asset_links(asset_symbol, created_at);\nCREATE INDEX IF NOT EXISTS idx_embeddings_event ON world_intel_embeddings(event_id);\nCREATE INDEX IF NOT EXISTS idx_user_theses_symbol ON user_theses(asset_symbol, timestamp);\n";
function ee(t) {
	i(t) || a(t, { recursive: !0 });
	let r = n(t, "atlasz-intel.db"), o = e(import.meta.url);
	try {
		let { DatabaseSync: e } = o("node:sqlite"), t = new e(r);
		return T(t), new ne(t, "node:sqlite");
	} catch (e) {
		console.warn("[atlasz] node:sqlite unavailable, trying better-sqlite3. Reason:", e instanceof Error ? e.message : e);
	}
	try {
		let e = new (o("better-sqlite3"))(r);
		return T(e), new ne(e, "better-sqlite3");
	} catch (e) {
		return console.warn("[atlasz] SQLite unavailable, using JSON fallback store. Reason:", e instanceof Error ? e.message : e), new Be(t);
	}
}
function T(e) {
	e.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    ${w}
  `), te(e, "world_intel_events", "sub_records_json", "TEXT");
}
function te(e, t, n, r) {
	e.prepare(`PRAGMA table_info(${t})`).all().some((e) => String(e.name) === n) || e.exec(`ALTER TABLE ${t} ADD COLUMN ${n} ${r}`);
}
var ne = class {
	mode;
	db;
	constructor(e, t) {
		this.db = e, this.mode = t;
	}
	listBriefs() {
		return this.db.prepare("SELECT * FROM daily_briefs ORDER BY created_at DESC").all().map(re);
	}
	saveBrief(e) {
		this.db.prepare("INSERT INTO daily_briefs (id, date, headline, body, severity, confidence, created_at)\n         VALUES (@id, @date, @headline, @body, @severity, @confidence, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET\n           date=excluded.date, headline=excluded.headline, body=excluded.body,\n           severity=excluded.severity, confidence=excluded.confidence").run(e);
	}
	listHeadlines(e = 200) {
		return this.db.prepare("SELECT * FROM world_headlines ORDER BY observed_at DESC LIMIT ?").all(e).map(se);
	}
	saveHeadline(e) {
		this.db.prepare("INSERT INTO world_headlines (id, title, source, url, sector, impact, observed_at)\n         VALUES (@id, @title, @source, @url, @sector, @impact, @observedAt)\n         ON CONFLICT(id) DO UPDATE SET\n           title=excluded.title, source=excluded.source, url=excluded.url,\n           sector=excluded.sector, impact=excluded.impact, observed_at=excluded.observed_at").run(e);
	}
	listDecisions() {
		return this.db.prepare("SELECT * FROM decision_journal ORDER BY updated_at DESC").all().map(Fe);
	}
	getDecision(e) {
		let t = this.db.prepare("SELECT * FROM decision_journal WHERE id = ?").get(e);
		return t ? Fe(t) : null;
	}
	saveDecision(e) {
		this.db.prepare("INSERT INTO decision_journal\n           (id, created_at, updated_at, title, thesis, direction, tickers, conviction,\n            emotional_state, evidence_ids, context, review_date, status, post_mortem, outcome)\n         VALUES\n           (@id, @createdAt, @updatedAt, @title, @thesis, @direction, @tickers, @conviction,\n            @emotionalState, @evidenceIds, @context, @reviewDate, @status, @postMortem, @outcome)\n         ON CONFLICT(id) DO UPDATE SET\n           updated_at=excluded.updated_at, title=excluded.title, thesis=excluded.thesis,\n           direction=excluded.direction, tickers=excluded.tickers, conviction=excluded.conviction,\n           emotional_state=excluded.emotional_state, evidence_ids=excluded.evidence_ids,\n           context=excluded.context, review_date=excluded.review_date, status=excluded.status,\n           post_mortem=excluded.post_mortem, outcome=excluded.outcome").run({
			...e,
			tickers: JSON.stringify(e.tickers),
			evidenceIds: JSON.stringify(e.evidenceIds)
		});
	}
	deleteDecision(e) {
		this.db.prepare("DELETE FROM decision_journal WHERE id = ?").run(e);
	}
	decisionsDueForReview(e) {
		return this.db.prepare("SELECT * FROM decision_journal WHERE status = 'open' AND review_date <= ? ORDER BY review_date ASC").all(e).map(Fe);
	}
	saveMarketTick(e) {
		this.db.prepare("INSERT INTO market_ticks_daily (id, symbol, price, volume, source, observed_at, trade_date)\n         VALUES (@id, @symbol, @price, @volume, @source, @observedAt, @tradeDate)\n         ON CONFLICT(id) DO UPDATE SET\n           price=excluded.price, volume=excluded.volume, source=excluded.source,\n           observed_at=excluded.observed_at, trade_date=excluded.trade_date").run(e);
	}
	listMarketTicks(e, t = 200) {
		return this.db.prepare("SELECT * FROM market_ticks_daily WHERE symbol = ? ORDER BY observed_at DESC LIMIT ?").all(e, t).map(E);
	}
	saveAttentionBatch(e) {
		this.db.prepare("INSERT INTO social_attention_batches\n           (id, target, pressure, mention_velocity, sentiment_divergence_index, source, observed_at, sample_count)\n         VALUES\n           (@id, @target, @pressure, @mentionVelocity, @sentimentDivergenceIndex, @source, @observedAt, @sampleCount)\n         ON CONFLICT(id) DO UPDATE SET\n           pressure=excluded.pressure, mention_velocity=excluded.mention_velocity,\n           sentiment_divergence_index=excluded.sentiment_divergence_index,\n           source=excluded.source, observed_at=excluded.observed_at, sample_count=excluded.sample_count").run(e);
	}
	saveEntityEdge(e) {
		this.db.prepare("INSERT INTO entity_edges (id, source, target, relation, confidence, created_at)\n         VALUES (@id, @source, @target, @relation, @confidence, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET\n           source=excluded.source, target=excluded.target, relation=excluded.relation,\n           confidence=excluded.confidence, created_at=excluded.created_at").run(e);
	}
	saveSignalEvent(e) {
		this.db.prepare("INSERT INTO signal_events\n           (id, type, asset_or_topic_id, severity, evidence_ids, confidence, created_at, explanation, related_graph_nodes)\n         VALUES\n           (@id, @type, @assetOrTopicId, @severity, @evidenceIds, @confidence, @createdAt, @explanation, @relatedGraphNodes)\n         ON CONFLICT(id) DO UPDATE SET\n           severity=excluded.severity, evidence_ids=excluded.evidence_ids, confidence=excluded.confidence,\n           explanation=excluded.explanation, related_graph_nodes=excluded.related_graph_nodes").run({
			...e,
			evidenceIds: JSON.stringify(e.evidenceIds),
			relatedGraphNodes: JSON.stringify(e.relatedGraphNodes)
		});
	}
	listOsintSources() {
		return this.db.prepare("SELECT * FROM osint_sources ORDER BY source_name ASC").all().map(ce);
	}
	saveOsintSource(e) {
		this.db.prepare("INSERT INTO osint_sources\n           (source_id, source_name, source_type, endpoint_type, endpoint, poll_interval_ms,\n            rate_limit_ms, timeout_ms, enabled, status, provenance, last_success_at,\n            last_error_at, last_error, item_count, source_reliability_score, legal_safety_note, parser_adapter)\n         VALUES\n           (@sourceId, @sourceName, @sourceType, @endpointType, @endpoint, @pollIntervalMs,\n            @rateLimitMs, @timeoutMs, @enabled, @status, @provenance, @lastSuccessAt,\n            @lastErrorAt, @lastError, @itemCount, @sourceReliabilityScore, @legalSafetyNote, @parserAdapter)\n         ON CONFLICT(source_id) DO UPDATE SET\n           source_name=excluded.source_name, source_type=excluded.source_type, endpoint_type=excluded.endpoint_type,\n           endpoint=excluded.endpoint, poll_interval_ms=excluded.poll_interval_ms, rate_limit_ms=excluded.rate_limit_ms,\n           timeout_ms=excluded.timeout_ms, enabled=excluded.enabled, status=excluded.status, provenance=excluded.provenance,\n           last_success_at=excluded.last_success_at, last_error_at=excluded.last_error_at, last_error=excluded.last_error,\n           item_count=excluded.item_count, source_reliability_score=excluded.source_reliability_score,\n           legal_safety_note=excluded.legal_safety_note, parser_adapter=excluded.parser_adapter").run({
			...e,
			enabled: +!!e.enabled,
			lastSuccessAt: e.lastSuccessAt ?? null,
			lastErrorAt: e.lastErrorAt ?? null,
			lastError: e.lastError ?? null
		});
	}
	listWorldIntelEvents(e = 300) {
		return this.db.prepare("SELECT * FROM world_intel_events ORDER BY timestamp DESC LIMIT ?").all(e).map(Oe);
	}
	saveWorldIntelEvent(e) {
		this.db.prepare("INSERT INTO world_intel_events\n           (id, timestamp, title, summary, country_codes, region, lat, lon, category, severity, confidence,\n            source_id, source_url, provenance, affected_assets, affected_sectors, affected_commodities,\n            affected_currencies, extracted_entities, narrative_tags, raw_payload_hash, dedupe_hash, sub_records_json)\n         VALUES\n           (@id, @timestamp, @title, @summary, @countryCodes, @region, @lat, @lon, @category, @severity, @confidence,\n            @sourceId, @sourceUrl, @provenance, @affectedAssets, @affectedSectors, @affectedCommodities,\n            @affectedCurrencies, @extractedEntities, @narrativeTags, @rawPayloadHash, @dedupeHash, @subRecordsJson)\n         ON CONFLICT(id) DO UPDATE SET\n           timestamp=excluded.timestamp, title=excluded.title, summary=excluded.summary, country_codes=excluded.country_codes,\n           region=excluded.region, lat=excluded.lat, lon=excluded.lon, category=excluded.category, severity=excluded.severity,\n           confidence=excluded.confidence, source_id=excluded.source_id, source_url=excluded.source_url,\n           provenance=excluded.provenance, affected_assets=excluded.affected_assets, affected_sectors=excluded.affected_sectors,\n           affected_commodities=excluded.affected_commodities, affected_currencies=excluded.affected_currencies,\n           extracted_entities=excluded.extracted_entities, narrative_tags=excluded.narrative_tags,\n           raw_payload_hash=excluded.raw_payload_hash, dedupe_hash=excluded.dedupe_hash,\n           sub_records_json=excluded.sub_records_json").run({
			id: e.id,
			timestamp: e.timestamp,
			title: e.title,
			summary: e.summary,
			region: e.region,
			category: e.category,
			severity: e.severity,
			confidence: e.confidence,
			sourceId: e.sourceId,
			provenance: e.provenance,
			rawPayloadHash: e.rawPayloadHash,
			dedupeHash: e.dedupeHash,
			countryCodes: JSON.stringify(e.countryCodes),
			lat: e.lat ?? null,
			lon: e.lon ?? null,
			sourceUrl: e.sourceUrl ?? null,
			affectedAssets: JSON.stringify(e.affectedAssets),
			affectedSectors: JSON.stringify(e.affectedSectors),
			affectedCommodities: JSON.stringify(e.affectedCommodities),
			affectedCurrencies: JSON.stringify(e.affectedCurrencies),
			extractedEntities: JSON.stringify(e.extractedEntities),
			narrativeTags: JSON.stringify(e.narrativeTags),
			subRecordsJson: le(e)
		});
	}
	listSecCompanyFilings(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return (n ? this.db.prepare("SELECT * FROM sec_company_filings WHERE ticker = ? ORDER BY observed_at DESC LIMIT ?").all(n, t) : this.db.prepare("SELECT * FROM sec_company_filings ORDER BY observed_at DESC LIMIT ?").all(t)).map(ke);
	}
	saveSecCompanyFiling(e) {
		this.db.prepare("INSERT INTO sec_company_filings\n           (id, cik, company_name, ticker, form_type, accession_number, filing_date, report_date,\n            accepted_at, observed_at, primary_document, source_url, source_json_url, source_name,\n            provenance, confidence, raw_payload_hash, raw_payload_json)\n         VALUES\n           (@id, @cik, @companyName, @ticker, @formType, @accessionNumber, @filingDate, @reportDate,\n            @acceptedAt, @observedAt, @primaryDocument, @sourceUrl, @sourceJsonUrl, @sourceName,\n            @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)\n         ON CONFLICT(id) DO UPDATE SET\n           cik=excluded.cik, company_name=excluded.company_name, ticker=excluded.ticker,\n           form_type=excluded.form_type, accession_number=excluded.accession_number,\n           filing_date=excluded.filing_date, report_date=excluded.report_date,\n           accepted_at=excluded.accepted_at, observed_at=excluded.observed_at,\n           primary_document=excluded.primary_document, source_url=excluded.source_url,\n           source_json_url=excluded.source_json_url, source_name=excluded.source_name,\n           provenance=excluded.provenance, confidence=excluded.confidence,\n           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json").run({
			...e,
			ticker: e.ticker ?? null,
			reportDate: e.reportDate ?? null,
			acceptedAt: e.acceptedAt ?? null,
			primaryDocument: e.primaryDocument ?? null,
			rawPayloadJson: e.rawPayloadJson ?? "{}"
		});
	}
	listFredMacroObservations(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return (n ? this.db.prepare("SELECT * FROM fred_macro_observations WHERE series_id = ? ORDER BY observation_timestamp DESC LIMIT ?").all(n, t) : this.db.prepare("SELECT * FROM fred_macro_observations ORDER BY observation_timestamp DESC LIMIT ?").all(t)).map(Ae);
	}
	saveFredMacroObservation(e) {
		this.db.prepare("INSERT INTO fred_macro_observations\n           (id, series_id, title, units, frequency, seasonal_adjustment, observation_date,\n            observation_timestamp, value, raw_value, source_url, source_api_url, source_name,\n            retrieved_at, provenance, confidence, raw_payload_hash, raw_payload_json)\n         VALUES\n           (@id, @seriesId, @title, @units, @frequency, @seasonalAdjustment, @observationDate,\n            @observationTimestamp, @value, @rawValue, @sourceUrl, @sourceApiUrl, @sourceName,\n            @retrievedAt, @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)\n         ON CONFLICT(id) DO UPDATE SET\n           title=excluded.title, units=excluded.units, frequency=excluded.frequency,\n           seasonal_adjustment=excluded.seasonal_adjustment, observation_date=excluded.observation_date,\n           observation_timestamp=excluded.observation_timestamp, value=excluded.value, raw_value=excluded.raw_value,\n           source_url=excluded.source_url, source_api_url=excluded.source_api_url, source_name=excluded.source_name,\n           retrieved_at=excluded.retrieved_at, provenance=excluded.provenance, confidence=excluded.confidence,\n           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json").run({
			...e,
			rawPayloadJson: e.rawPayloadJson ?? "{}"
		});
	}
	listTreasuryFiscalRecords(e, t = 120) {
		let n = e?.trim().toLowerCase();
		return (n ? this.db.prepare("SELECT * FROM treasury_fiscal_records WHERE dataset_id = ? ORDER BY record_timestamp DESC LIMIT ?").all(n, t) : this.db.prepare("SELECT * FROM treasury_fiscal_records ORDER BY record_timestamp DESC LIMIT ?").all(t)).map(je);
	}
	saveTreasuryFiscalRecord(e) {
		this.db.prepare("INSERT INTO treasury_fiscal_records\n           (id, dataset_id, dataset_name, table_id, table_name, record_date, record_timestamp,\n            metric_name, metric_value, raw_value, units, source_url, source_api_url, source_name,\n            retrieved_at, provenance, confidence, raw_payload_hash, raw_payload_json)\n         VALUES\n           (@id, @datasetId, @datasetName, @tableId, @tableName, @recordDate, @recordTimestamp,\n            @metricName, @metricValue, @rawValue, @units, @sourceUrl, @sourceApiUrl, @sourceName,\n            @retrievedAt, @provenance, @confidence, @rawPayloadHash, @rawPayloadJson)\n         ON CONFLICT(id) DO UPDATE SET\n           dataset_name=excluded.dataset_name, table_id=excluded.table_id, table_name=excluded.table_name,\n           record_date=excluded.record_date, record_timestamp=excluded.record_timestamp,\n           metric_name=excluded.metric_name, metric_value=excluded.metric_value, raw_value=excluded.raw_value,\n           units=excluded.units, source_url=excluded.source_url, source_api_url=excluded.source_api_url,\n           source_name=excluded.source_name, retrieved_at=excluded.retrieved_at, provenance=excluded.provenance,\n           confidence=excluded.confidence, raw_payload_hash=excluded.raw_payload_hash,\n           raw_payload_json=excluded.raw_payload_json").run({
			...e,
			rawPayloadJson: e.rawPayloadJson ?? "{}"
		});
	}
	listBeaObservations(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return (n ? this.db.prepare("SELECT * FROM bea_observations\n             WHERE dataset_name || ':' || table_name || ':' || line_number = ?\n             ORDER BY observation_timestamp DESC LIMIT ?").all(n, t) : this.db.prepare("SELECT * FROM bea_observations ORDER BY observation_timestamp DESC LIMIT ?").all(t)).map(Me);
	}
	saveBeaObservation(e) {
		this.db.prepare("INSERT INTO bea_observations\n           (id, dataset_name, table_name, line_number, line_description, series_code, time_period,\n            observation_date, observation_timestamp, metric_name, metric_value, raw_value, units,\n            unit_multiplier, source_url, source_api_url, source_name, retrieved_at, provenance,\n            confidence, raw_payload_hash, raw_payload_json)\n         VALUES\n           (@id, @datasetName, @tableName, @lineNumber, @lineDescription, @seriesCode, @timePeriod,\n            @observationDate, @observationTimestamp, @metricName, @metricValue, @rawValue, @units,\n            @unitMultiplier, @sourceUrl, @sourceApiUrl, @sourceName, @retrievedAt, @provenance,\n            @confidence, @rawPayloadHash, @rawPayloadJson)\n         ON CONFLICT(id) DO UPDATE SET\n           line_description=excluded.line_description, series_code=excluded.series_code,\n           time_period=excluded.time_period, observation_date=excluded.observation_date,\n           observation_timestamp=excluded.observation_timestamp, metric_name=excluded.metric_name,\n           metric_value=excluded.metric_value, raw_value=excluded.raw_value, units=excluded.units,\n           unit_multiplier=excluded.unit_multiplier, source_url=excluded.source_url,\n           source_api_url=excluded.source_api_url, source_name=excluded.source_name,\n           retrieved_at=excluded.retrieved_at, provenance=excluded.provenance,\n           confidence=excluded.confidence, raw_payload_hash=excluded.raw_payload_hash,\n           raw_payload_json=excluded.raw_payload_json").run({
			...e,
			seriesCode: e.seriesCode ?? null,
			unitMultiplier: e.unitMultiplier ?? null,
			rawPayloadJson: e.rawPayloadJson ?? "{}"
		});
	}
	listEiaEnergyRecords(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return (n ? this.db.prepare("SELECT * FROM eia_energy_records WHERE series_id = ? ORDER BY observation_timestamp DESC LIMIT ?").all(n, t) : this.db.prepare("SELECT * FROM eia_energy_records ORDER BY observation_timestamp DESC LIMIT ?").all(t)).map(Ne);
	}
	saveEiaEnergyRecord(e) {
		this.db.prepare("INSERT INTO eia_energy_records\n           (id, series_id, title, energy_category, commodity, region, country_code,\n            period, observation_date, observation_timestamp, value, raw_value, units,\n            source_url, source_api_url, source_name, retrieved_at, provenance,\n            confidence, raw_payload_hash, raw_payload_json)\n         VALUES\n           (@id, @seriesId, @title, @energyCategory, @commodity, @region, @countryCode,\n            @period, @observationDate, @observationTimestamp, @value, @rawValue, @units,\n            @sourceUrl, @sourceApiUrl, @sourceName, @retrievedAt, @provenance,\n            @confidence, @rawPayloadHash, @rawPayloadJson)\n         ON CONFLICT(id) DO UPDATE SET\n           title=excluded.title, energy_category=excluded.energy_category, commodity=excluded.commodity,\n           region=excluded.region, country_code=excluded.country_code, period=excluded.period,\n           observation_date=excluded.observation_date, observation_timestamp=excluded.observation_timestamp,\n           value=excluded.value, raw_value=excluded.raw_value, units=excluded.units,\n           source_url=excluded.source_url, source_api_url=excluded.source_api_url,\n           source_name=excluded.source_name, retrieved_at=excluded.retrieved_at,\n           provenance=excluded.provenance, confidence=excluded.confidence,\n           raw_payload_hash=excluded.raw_payload_hash, raw_payload_json=excluded.raw_payload_json").run({
			...e,
			region: e.region ?? null,
			countryCode: e.countryCode ?? null,
			rawPayloadJson: e.rawPayloadJson ?? "{}"
		});
	}
	listWorldIntelEmbeddings(e = 500) {
		return this.db.prepare("SELECT * FROM world_intel_embeddings ORDER BY timestamp DESC LIMIT ?").all(e).map(ie);
	}
	saveWorldIntelEmbedding(e) {
		this.db.prepare("INSERT INTO world_intel_embeddings\n           (id, event_id, timestamp, summary_hash, embedding_model, embedding_vector,\n            source_event_category, provenance, created_at)\n         VALUES\n           (@id, @eventId, @timestamp, @summaryHash, @embeddingModel, @embeddingVector,\n            @sourceEventCategory, @provenance, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET\n           summary_hash=excluded.summary_hash, embedding_model=excluded.embedding_model,\n           embedding_vector=excluded.embedding_vector, source_event_category=excluded.source_event_category,\n           provenance=excluded.provenance, created_at=excluded.created_at").run({
			...e,
			embeddingVector: JSON.stringify(e.embeddingVector)
		});
	}
	listUserTheses(e = 500) {
		return this.db.prepare("SELECT * FROM user_theses ORDER BY timestamp DESC LIMIT ?").all(e).map(ae);
	}
	saveUserThesis(e) {
		this.db.prepare("INSERT INTO user_theses\n           (id, timestamp, asset_symbol, thesis_type, trigger_event_id, snapshot_metrics, user_notes,\n            target_horizon_days, is_closed, performance_grade, entry_price, current_return,\n            one_day_return, seven_day_return, thirty_day_return, created_at, updated_at)\n         VALUES\n           (@id, @timestamp, @assetSymbol, @thesisType, @triggerEventId, @snapshotMetrics, @userNotes,\n            @targetHorizonDays, @isClosed, @performanceGrade, @entryPrice, @currentReturn,\n            @oneDayReturn, @sevenDayReturn, @thirtyDayReturn, @createdAt, @updatedAt)\n         ON CONFLICT(id) DO UPDATE SET\n           thesis_type=excluded.thesis_type, snapshot_metrics=excluded.snapshot_metrics,\n           user_notes=excluded.user_notes, target_horizon_days=excluded.target_horizon_days,\n           is_closed=excluded.is_closed, performance_grade=excluded.performance_grade,\n           entry_price=excluded.entry_price, current_return=excluded.current_return,\n           one_day_return=excluded.one_day_return, seven_day_return=excluded.seven_day_return,\n           thirty_day_return=excluded.thirty_day_return, updated_at=excluded.updated_at").run({
			...e,
			triggerEventId: e.triggerEventId ?? null,
			snapshotMetrics: JSON.stringify(e.snapshotMetrics),
			isClosed: +!!e.isClosed,
			performanceGrade: e.performanceGrade ?? null,
			entryPrice: e.entryPrice ?? null,
			currentReturn: e.currentReturn ?? null,
			oneDayReturn: e.oneDayReturn ?? null,
			sevenDayReturn: e.sevenDayReturn ?? null,
			thirtyDayReturn: e.thirtyDayReturn ?? null
		});
	}
	listCountryIntelState() {
		return this.db.prepare("SELECT state_json FROM country_intel_state ORDER BY last_updated DESC").all().map((e) => ze(e.state_json));
	}
	saveCountryIntelState(e) {
		this.db.prepare("INSERT INTO country_intel_state (country_code, state_json, last_updated)\n         VALUES (@countryCode, @stateJson, @lastUpdated)\n         ON CONFLICT(country_code) DO UPDATE SET\n           state_json=excluded.state_json, last_updated=excluded.last_updated").run({
			countryCode: e.countryCode,
			stateJson: JSON.stringify(e),
			lastUpdated: e.lastUpdated
		});
	}
	listAssetIdentities() {
		return this.db.prepare("SELECT identity_json FROM asset_identity ORDER BY symbol ASC").all().map((e) => ze(e.identity_json));
	}
	saveAssetIdentity(e) {
		this.db.prepare("INSERT INTO asset_identity (symbol, identity_json)\n         VALUES (@symbol, @identityJson)\n         ON CONFLICT(symbol) DO UPDATE SET identity_json=excluded.identity_json").run({
			symbol: e.symbol,
			identityJson: JSON.stringify(e)
		});
	}
	listFavorites() {
		return this.db.prepare("SELECT * FROM user_favorites ORDER BY created_at DESC").all().map(Pe);
	}
	saveFavorite(e) {
		this.db.prepare("INSERT INTO user_favorites (id, kind, target_id, label, created_at)\n         VALUES (@id, @kind, @targetId, @label, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, target_id=excluded.target_id, label=excluded.label").run(e);
	}
	deleteFavorite(e) {
		this.db.prepare("DELETE FROM user_favorites WHERE id = ?").run(e);
	}
	saveEventAssetLink(e) {
		this.db.prepare("INSERT INTO event_asset_links (id, event_id, asset_symbol, relation, confidence, created_at)\n         VALUES (@id, @eventId, @assetSymbol, @relation, @confidence, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET relation=excluded.relation, confidence=excluded.confidence, created_at=excluded.created_at").run(e);
	}
	saveRealtimeFrame(e) {
		this.db.prepare("INSERT INTO realtime_frames (id, sequence, emitted_at, frame_json)\n         VALUES (@id, @sequence, @emittedAt, @frameJson)\n         ON CONFLICT(id) DO UPDATE SET\n           sequence=excluded.sequence, emitted_at=excluded.emitted_at, frame_json=excluded.frame_json").run({
			id: e.id,
			sequence: e.sequence,
			emittedAt: e.emittedAt,
			frameJson: JSON.stringify(e.frame)
		});
	}
	listRealtimeFrames(e, t, n = 2e3) {
		return this.db.prepare("SELECT * FROM realtime_frames WHERE emitted_at BETWEEN ? AND ? ORDER BY emitted_at ASC LIMIT ?").all(e, t, n).map(Ie);
	}
	audit(e) {
		this.db.prepare("INSERT INTO source_audit_log\n           (id, event_type, connector_id, severity, message, created_at, metadata)\n         VALUES\n           (@id, @eventType, @connectorId, @severity, @message, @createdAt, @metadata)").run({
			...e,
			connectorId: e.connectorId ?? null,
			metadata: JSON.stringify(e.metadata ?? {})
		});
	}
	close() {
		this.db.close();
	}
};
function re(e) {
	return {
		id: String(e.id),
		date: String(e.date),
		headline: String(e.headline),
		body: String(e.body),
		severity: String(e.severity),
		confidence: Number(e.confidence),
		createdAt: Number(e.created_at)
	};
}
function ie(e) {
	return {
		id: String(e.id),
		eventId: String(e.event_id),
		timestamp: Number(e.timestamp),
		summaryHash: String(e.summary_hash),
		embeddingModel: String(e.embedding_model),
		embeddingVector: oe(e.embedding_vector),
		sourceEventCategory: String(e.source_event_category),
		provenance: String(e.provenance),
		createdAt: Number(e.created_at)
	};
}
function ae(e) {
	return {
		id: String(e.id),
		timestamp: Number(e.timestamp),
		assetSymbol: String(e.asset_symbol),
		thesisType: String(e.thesis_type),
		triggerEventId: e.trigger_event_id === null || e.trigger_event_id === void 0 ? null : String(e.trigger_event_id),
		snapshotMetrics: ze(e.snapshot_metrics),
		userNotes: String(e.user_notes),
		targetHorizonDays: Number(e.target_horizon_days),
		isClosed: Number(e.is_closed) === 1,
		performanceGrade: e.performance_grade === null || e.performance_grade === void 0 ? null : String(e.performance_grade),
		entryPrice: e.entry_price === null || e.entry_price === void 0 ? null : Number(e.entry_price),
		currentReturn: e.current_return === null || e.current_return === void 0 ? null : Number(e.current_return),
		oneDayReturn: e.one_day_return === null || e.one_day_return === void 0 ? null : Number(e.one_day_return),
		sevenDayReturn: e.seven_day_return === null || e.seven_day_return === void 0 ? null : Number(e.seven_day_return),
		thirtyDayReturn: e.thirty_day_return === null || e.thirty_day_return === void 0 ? null : Number(e.thirty_day_return),
		createdAt: Number(e.created_at),
		updatedAt: Number(e.updated_at)
	};
}
function oe(e) {
	if (typeof e != "string") return [];
	try {
		let t = JSON.parse(e);
		return Array.isArray(t) ? t.map((e) => Number(e)).filter((e) => Number.isFinite(e)) : [];
	} catch {
		return [];
	}
}
function E(e) {
	return {
		id: String(e.id),
		symbol: String(e.symbol),
		price: Number(e.price),
		volume: Number(e.volume),
		source: String(e.source),
		observedAt: Number(e.observed_at),
		tradeDate: String(e.trade_date)
	};
}
function se(e) {
	return {
		id: String(e.id),
		title: String(e.title),
		source: String(e.source),
		url: String(e.url),
		sector: String(e.sector),
		impact: String(e.impact),
		observedAt: Number(e.observed_at)
	};
}
function ce(e) {
	return {
		sourceId: String(e.source_id),
		sourceName: String(e.source_name),
		sourceType: String(e.source_type),
		endpointType: String(e.endpoint_type),
		endpoint: String(e.endpoint),
		pollIntervalMs: Number(e.poll_interval_ms),
		rateLimitMs: Number(e.rate_limit_ms),
		timeoutMs: Number(e.timeout_ms),
		enabled: Number(e.enabled) === 1,
		status: String(e.status),
		provenance: String(e.provenance),
		lastSuccessAt: e.last_success_at === null || e.last_success_at === void 0 ? void 0 : Number(e.last_success_at),
		lastErrorAt: e.last_error_at === null || e.last_error_at === void 0 ? void 0 : Number(e.last_error_at),
		lastError: e.last_error === null || e.last_error === void 0 ? void 0 : String(e.last_error),
		itemCount: Number(e.item_count),
		sourceReliabilityScore: Number(e.source_reliability_score),
		legalSafetyNote: String(e.legal_safety_note),
		parserAdapter: String(e.parser_adapter)
	};
}
function le(e) {
	let t = {};
	return e.secFiling && (t.secFiling = e.secFiling), e.fredObservation && (t.fredObservation = e.fredObservation), e.treasuryFiscalRecord && (t.treasuryFiscalRecord = e.treasuryFiscalRecord), e.beaObservation && (t.beaObservation = e.beaObservation), e.blsObservation && (t.blsObservation = e.blsObservation), e.eiaEnergyRecord && (t.eiaEnergyRecord = e.eiaEnergyRecord), e.kevVulnerability && (t.kevVulnerability = e.kevVulnerability), e.nvdCve && (t.nvdCve = e.nvdCve), e.ghsaAdvisory && (t.ghsaAdvisory = e.ghsaAdvisory), e.osvVulnerability && (t.osvVulnerability = e.osvVulnerability), e.cisaAdvisory && (t.cisaAdvisory = e.cisaAdvisory), e.githubRelease && (t.githubRelease = e.githubRelease), e.earthquakeEvent && (t.earthquakeEvent = e.earthquakeEvent), e.weatherAlert && (t.weatherAlert = e.weatherAlert), e.patentRecord && (t.patentRecord = e.patentRecord), e.regulatoryDocument && (t.regulatoryDocument = e.regulatoryDocument), e.ofacSanctionsRecord && (t.ofacSanctionsRecord = e.ofacSanctionsRecord), Object.keys(t).length > 0 ? JSON.stringify(t) : null;
}
function ue(e) {
	let t = {};
	if (e == null || e === "") return t;
	let n;
	try {
		n = typeof e == "string" ? JSON.parse(e) : e;
	} catch {
		return t;
	}
	if (!n || typeof n != "object") return t;
	let r = n;
	return Se(r.secFiling) && (t.secFiling = r.secFiling), Ce(r.fredObservation) && (t.fredObservation = r.fredObservation), Te(r.treasuryFiscalRecord) && (t.treasuryFiscalRecord = r.treasuryFiscalRecord), Ee(r.beaObservation) && (t.beaObservation = r.beaObservation), we(r.blsObservation) && (t.blsObservation = r.blsObservation), De(r.eiaEnergyRecord) && (t.eiaEnergyRecord = r.eiaEnergyRecord), de(r.kevVulnerability) && (t.kevVulnerability = r.kevVulnerability), fe(r.nvdCve) && (t.nvdCve = r.nvdCve), pe(r.ghsaAdvisory) && (t.ghsaAdvisory = r.ghsaAdvisory), me(r.osvVulnerability) && (t.osvVulnerability = r.osvVulnerability), he(r.cisaAdvisory) && (t.cisaAdvisory = r.cisaAdvisory), ge(r.githubRelease) && (t.githubRelease = r.githubRelease), _e(r.earthquakeEvent) && (t.earthquakeEvent = r.earthquakeEvent), xe(r.weatherAlert) && (t.weatherAlert = r.weatherAlert), ve(r.patentRecord) && (t.patentRecord = r.patentRecord), ye(r.regulatoryDocument) && (t.regulatoryDocument = r.regulatoryDocument), be(r.ofacSanctionsRecord) && (t.ofacSanctionsRecord = r.ofacSanctionsRecord), t;
}
function D(e) {
	return typeof e.rawPayloadHash == "string" && e.rawPayloadHash.length > 0;
}
function O(e) {
	return e && typeof e == "object" ? e : null;
}
function de(e) {
	let t = O(e);
	return !!(t && typeof t.cveId == "string" && /^CVE-\d{4}-\d{4,}$/i.test(t.cveId) && D(t));
}
function fe(e) {
	let t = O(e);
	return !!(t && typeof t.cveId == "string" && /^CVE-\d{4}-\d{4,}$/i.test(t.cveId) && D(t));
}
function pe(e) {
	let t = O(e);
	return !!(t && typeof t.ghsaId == "string" && /^GHSA-/i.test(t.ghsaId) && D(t));
}
function me(e) {
	let t = O(e);
	return !!(t && typeof t.osvId == "string" && t.osvId.length > 0 && D(t));
}
function he(e) {
	let t = O(e);
	return !!(t && typeof t.advisoryId == "string" && t.advisoryId.length > 0 && D(t));
}
function ge(e) {
	let t = O(e);
	return !!(t && typeof t.repoFullName == "string" && t.repoFullName.length > 0 && D(t));
}
function _e(e) {
	let t = O(e);
	return !!(t && typeof t.eventId == "string" && t.eventId.length > 0 && D(t));
}
function ve(e) {
	let t = O(e);
	return !!(t && typeof t.patentId == "string" && t.patentId.length > 0 && D(t));
}
function ye(e) {
	let t = O(e);
	return !!(t && typeof t.documentNumber == "string" && t.documentNumber.length > 0 && D(t));
}
function be(e) {
	let t = O(e);
	return !!(t && typeof t.uid == "string" && t.uid.length > 0 && D(t));
}
function xe(e) {
	let t = O(e);
	return !!(t && typeof t.alertId == "string" && t.alertId.length > 0 && D(t));
}
function Se(e) {
	let t = O(e);
	return !!(t && typeof t.accessionNumber == "string" && t.accessionNumber.length > 0 && D(t));
}
function Ce(e) {
	let t = O(e);
	return !!(t && typeof t.seriesId == "string" && t.seriesId.length > 0 && D(t));
}
function we(e) {
	let t = O(e);
	return !!(t && typeof t.seriesId == "string" && t.seriesId.length > 0 && D(t));
}
function Te(e) {
	let t = O(e);
	return !!(t && typeof t.datasetId == "string" && typeof t.metricName == "string" && t.datasetId.length > 0 && t.metricName.length > 0 && D(t));
}
function Ee(e) {
	let t = O(e);
	return !!(t && typeof t.datasetName == "string" && typeof t.tableName == "string" && t.datasetName.length > 0 && t.tableName.length > 0 && D(t));
}
function De(e) {
	let t = O(e);
	return !!(t && typeof t.seriesId == "string" && typeof t.commodity == "string" && t.seriesId.length > 0 && t.commodity.length > 0 && D(t));
}
function Oe(e) {
	return {
		id: String(e.id),
		timestamp: Number(e.timestamp),
		title: String(e.title),
		summary: String(e.summary),
		countryCodes: Re(e.country_codes),
		region: String(e.region),
		lat: e.lat === null || e.lat === void 0 ? void 0 : Number(e.lat),
		lon: e.lon === null || e.lon === void 0 ? void 0 : Number(e.lon),
		category: String(e.category),
		severity: String(e.severity),
		confidence: Number(e.confidence),
		sourceId: String(e.source_id),
		sourceUrl: e.source_url === null || e.source_url === void 0 ? void 0 : String(e.source_url),
		provenance: String(e.provenance),
		affectedAssets: Re(e.affected_assets),
		affectedSectors: Re(e.affected_sectors),
		affectedCommodities: Re(e.affected_commodities),
		affectedCurrencies: Re(e.affected_currencies),
		extractedEntities: Re(e.extracted_entities),
		narrativeTags: Re(e.narrative_tags),
		rawPayloadHash: String(e.raw_payload_hash),
		dedupeHash: String(e.dedupe_hash),
		...ue(e.sub_records_json)
	};
}
function ke(e) {
	return {
		id: String(e.id),
		cik: String(e.cik),
		companyName: String(e.company_name),
		ticker: e.ticker === null || e.ticker === void 0 ? void 0 : String(e.ticker),
		formType: String(e.form_type),
		accessionNumber: String(e.accession_number),
		filingDate: String(e.filing_date),
		reportDate: e.report_date === null || e.report_date === void 0 ? void 0 : String(e.report_date),
		acceptedAt: e.accepted_at === null || e.accepted_at === void 0 ? void 0 : Number(e.accepted_at),
		observedAt: Number(e.observed_at),
		primaryDocument: e.primary_document === null || e.primary_document === void 0 ? void 0 : String(e.primary_document),
		sourceUrl: String(e.source_url),
		sourceJsonUrl: String(e.source_json_url),
		sourceName: String(e.source_name),
		provenance: String(e.provenance),
		confidence: Number(e.confidence),
		rawPayloadHash: String(e.raw_payload_hash),
		rawPayloadJson: String(e.raw_payload_json)
	};
}
function Ae(e) {
	return {
		id: String(e.id),
		seriesId: String(e.series_id),
		title: String(e.title),
		units: String(e.units),
		frequency: String(e.frequency),
		seasonalAdjustment: String(e.seasonal_adjustment),
		observationDate: String(e.observation_date),
		observationTimestamp: Number(e.observation_timestamp),
		value: Number(e.value),
		rawValue: String(e.raw_value),
		sourceUrl: String(e.source_url),
		sourceApiUrl: String(e.source_api_url),
		sourceName: String(e.source_name),
		retrievedAt: Number(e.retrieved_at),
		provenance: String(e.provenance),
		confidence: Number(e.confidence),
		rawPayloadHash: String(e.raw_payload_hash),
		rawPayloadJson: String(e.raw_payload_json)
	};
}
function je(e) {
	return {
		id: String(e.id),
		datasetId: String(e.dataset_id),
		datasetName: String(e.dataset_name),
		tableId: String(e.table_id),
		tableName: String(e.table_name),
		recordDate: String(e.record_date),
		recordTimestamp: Number(e.record_timestamp),
		metricName: String(e.metric_name),
		metricValue: Number(e.metric_value),
		rawValue: String(e.raw_value),
		units: String(e.units),
		sourceUrl: String(e.source_url),
		sourceApiUrl: String(e.source_api_url),
		sourceName: String(e.source_name),
		retrievedAt: Number(e.retrieved_at),
		provenance: String(e.provenance),
		confidence: Number(e.confidence),
		rawPayloadHash: String(e.raw_payload_hash),
		rawPayloadJson: String(e.raw_payload_json)
	};
}
function Me(e) {
	return {
		id: String(e.id),
		datasetName: String(e.dataset_name),
		tableName: String(e.table_name),
		lineNumber: String(e.line_number),
		lineDescription: String(e.line_description),
		seriesCode: e.series_code === null || e.series_code === void 0 ? void 0 : String(e.series_code),
		timePeriod: String(e.time_period),
		observationDate: String(e.observation_date),
		observationTimestamp: Number(e.observation_timestamp),
		metricName: String(e.metric_name),
		metricValue: Number(e.metric_value),
		rawValue: String(e.raw_value),
		units: String(e.units),
		unitMultiplier: e.unit_multiplier === null || e.unit_multiplier === void 0 ? void 0 : String(e.unit_multiplier),
		sourceUrl: String(e.source_url),
		sourceApiUrl: String(e.source_api_url),
		sourceName: String(e.source_name),
		retrievedAt: Number(e.retrieved_at),
		provenance: String(e.provenance),
		confidence: Number(e.confidence),
		rawPayloadHash: String(e.raw_payload_hash),
		rawPayloadJson: String(e.raw_payload_json)
	};
}
function Ne(e) {
	return {
		id: String(e.id),
		seriesId: String(e.series_id),
		title: String(e.title),
		energyCategory: String(e.energy_category),
		commodity: String(e.commodity),
		region: e.region === null || e.region === void 0 ? void 0 : String(e.region),
		countryCode: e.country_code === null || e.country_code === void 0 ? void 0 : String(e.country_code),
		period: String(e.period),
		observationDate: String(e.observation_date),
		observationTimestamp: Number(e.observation_timestamp),
		value: Number(e.value),
		rawValue: String(e.raw_value),
		units: String(e.units),
		sourceUrl: String(e.source_url),
		sourceApiUrl: String(e.source_api_url),
		sourceName: String(e.source_name),
		retrievedAt: Number(e.retrieved_at),
		provenance: String(e.provenance),
		confidence: Number(e.confidence),
		rawPayloadHash: String(e.raw_payload_hash),
		rawPayloadJson: String(e.raw_payload_json)
	};
}
function Pe(e) {
	return {
		id: String(e.id),
		kind: String(e.kind),
		targetId: String(e.target_id),
		label: String(e.label),
		createdAt: Number(e.created_at)
	};
}
function Fe(e) {
	return {
		id: String(e.id),
		createdAt: Number(e.created_at),
		updatedAt: Number(e.updated_at),
		title: String(e.title),
		thesis: String(e.thesis),
		direction: String(e.direction),
		tickers: Re(e.tickers),
		conviction: Number(e.conviction),
		emotionalState: String(e.emotional_state),
		evidenceIds: Re(e.evidence_ids),
		context: String(e.context),
		reviewDate: Number(e.review_date),
		status: String(e.status),
		postMortem: String(e.post_mortem),
		outcome: e.outcome === null || e.outcome === void 0 ? null : String(e.outcome)
	};
}
function Ie(e) {
	return {
		id: String(e.id),
		sequence: Number(e.sequence),
		emittedAt: Number(e.emitted_at),
		frame: Le(e.frame_json)
	};
}
function Le(e) {
	if (typeof e != "string") throw Error("Invalid realtime frame payload");
	return JSON.parse(e);
}
function Re(e) {
	if (typeof e != "string") return [];
	try {
		let t = JSON.parse(e);
		return Array.isArray(t) ? t.map((e) => String(e)) : [];
	} catch {
		return [];
	}
}
function ze(e) {
	if (typeof e != "string") return {};
	try {
		return JSON.parse(e);
	} catch {
		return {};
	}
}
var Be = class {
	mode = "json-fallback";
	file;
	data;
	constructor(e) {
		this.file = n(e, "atlasz-intel.fallback.json"), this.data = this.read();
	}
	listBriefs() {
		return [...this.data.briefs].sort((e, t) => t.createdAt - e.createdAt);
	}
	saveBrief(e) {
		this.data.briefs = k(this.data.briefs, e), this.flush();
	}
	listHeadlines(e = 200) {
		return [...this.data.headlines].sort((e, t) => t.observedAt - e.observedAt).slice(0, e);
	}
	saveHeadline(e) {
		this.data.headlines = k(this.data.headlines, e), this.flush();
	}
	listDecisions() {
		return [...this.data.decisions].sort((e, t) => t.updatedAt - e.updatedAt);
	}
	getDecision(e) {
		return this.data.decisions.find((t) => t.id === e) ?? null;
	}
	saveDecision(e) {
		this.data.decisions = k(this.data.decisions, e), this.flush();
	}
	deleteDecision(e) {
		this.data.decisions = this.data.decisions.filter((t) => t.id !== e), this.flush();
	}
	decisionsDueForReview(e) {
		return this.data.decisions.filter((t) => t.status === "open" && t.reviewDate <= e).sort((e, t) => e.reviewDate - t.reviewDate);
	}
	saveMarketTick(e) {
		this.data.marketTicks = A(k(this.data.marketTicks, e), "observedAt", 25e3), this.flush();
	}
	listMarketTicks(e, t = 200) {
		return [...this.data.marketTicks].filter((t) => t.symbol === e).sort((e, t) => t.observedAt - e.observedAt).slice(0, t);
	}
	saveAttentionBatch(e) {
		this.data.attentionBatches = A(k(this.data.attentionBatches, e), "observedAt", 25e3), this.flush();
	}
	saveEntityEdge(e) {
		this.data.entityEdges = k(this.data.entityEdges, e), this.flush();
	}
	saveSignalEvent(e) {
		this.data.signalEvents = A(k(this.data.signalEvents, e), "createdAt", 1e4), this.flush();
	}
	listOsintSources() {
		return [...this.data.osintSources].sort((e, t) => e.sourceName.localeCompare(t.sourceName));
	}
	saveOsintSource(e) {
		this.data.osintSources = Ve(this.data.osintSources, e, "sourceId"), this.flush();
	}
	listWorldIntelEvents(e = 300) {
		return [...this.data.worldIntelEvents].sort((e, t) => t.timestamp - e.timestamp).slice(0, e);
	}
	saveWorldIntelEvent(e) {
		this.data.worldIntelEvents = A(k(this.data.worldIntelEvents, e), "timestamp", 1e4), this.flush();
	}
	listSecCompanyFilings(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return [...this.data.secCompanyFilings].filter((e) => !n || e.ticker === n).sort((e, t) => t.observedAt - e.observedAt).slice(0, t);
	}
	saveSecCompanyFiling(e) {
		this.data.secCompanyFilings = A(k(this.data.secCompanyFilings, e), "observedAt", 1e4), this.flush();
	}
	listFredMacroObservations(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return [...this.data.fredMacroObservations].filter((e) => !n || e.seriesId === n).sort((e, t) => t.observationTimestamp - e.observationTimestamp).slice(0, t);
	}
	saveFredMacroObservation(e) {
		this.data.fredMacroObservations = A(k(this.data.fredMacroObservations, e), "observationTimestamp", 1e4), this.flush();
	}
	listTreasuryFiscalRecords(e, t = 120) {
		let n = e?.trim().toLowerCase();
		return [...this.data.treasuryFiscalRecords].filter((e) => !n || e.datasetId === n).sort((e, t) => t.recordTimestamp - e.recordTimestamp).slice(0, t);
	}
	saveTreasuryFiscalRecord(e) {
		this.data.treasuryFiscalRecords = A(k(this.data.treasuryFiscalRecords, e), "recordTimestamp", 1e4), this.flush();
	}
	listBeaObservations(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return [...this.data.beaObservations].filter((e) => !n || `${e.datasetName}:${e.tableName}:${e.lineNumber}`.toUpperCase() === n).sort((e, t) => t.observationTimestamp - e.observationTimestamp).slice(0, t);
	}
	saveBeaObservation(e) {
		this.data.beaObservations = A(k(this.data.beaObservations, e), "observationTimestamp", 1e4), this.flush();
	}
	listEiaEnergyRecords(e, t = 120) {
		let n = e?.trim().toUpperCase();
		return [...this.data.eiaEnergyRecords].filter((e) => !n || e.seriesId === n).sort((e, t) => t.observationTimestamp - e.observationTimestamp).slice(0, t);
	}
	saveEiaEnergyRecord(e) {
		this.data.eiaEnergyRecords = A(k(this.data.eiaEnergyRecords, e), "observationTimestamp", 1e4), this.flush();
	}
	listWorldIntelEmbeddings(e = 500) {
		return [...this.data.worldIntelEmbeddings].sort((e, t) => t.timestamp - e.timestamp).slice(0, e);
	}
	saveWorldIntelEmbedding(e) {
		this.data.worldIntelEmbeddings = A(k(this.data.worldIntelEmbeddings, e), "timestamp", 1e4), this.flush();
	}
	listUserTheses(e = 500) {
		return [...this.data.userTheses].sort((e, t) => t.timestamp - e.timestamp).slice(0, e);
	}
	saveUserThesis(e) {
		this.data.userTheses = A(k(this.data.userTheses, e), "timestamp", 1e4), this.flush();
	}
	listCountryIntelState() {
		return [...this.data.countryIntelState].sort((e, t) => t.riskScore - e.riskScore);
	}
	saveCountryIntelState(e) {
		this.data.countryIntelState = Ve(this.data.countryIntelState, e, "countryCode"), this.flush();
	}
	listAssetIdentities() {
		return [...this.data.assetIdentities].sort((e, t) => e.symbol.localeCompare(t.symbol));
	}
	saveAssetIdentity(e) {
		this.data.assetIdentities = Ve(this.data.assetIdentities, e, "symbol"), this.flush();
	}
	listFavorites() {
		return [...this.data.favorites].sort((e, t) => t.createdAt - e.createdAt);
	}
	saveFavorite(e) {
		this.data.favorites = k(this.data.favorites, e), this.flush();
	}
	deleteFavorite(e) {
		this.data.favorites = this.data.favorites.filter((t) => t.id !== e), this.flush();
	}
	saveEventAssetLink(e) {
		this.data.eventAssetLinks = A(k(this.data.eventAssetLinks, e), "createdAt", 25e3), this.flush();
	}
	saveRealtimeFrame(e) {
		this.data.realtimeFrames = A(k(this.data.realtimeFrames, e), "emittedAt", 1e4), this.flush();
	}
	listRealtimeFrames(e, t, n = 2e3) {
		return [...this.data.realtimeFrames].filter((n) => n.emittedAt >= e && n.emittedAt <= t).sort((e, t) => e.emittedAt - t.emittedAt).slice(0, n);
	}
	audit(e) {
		this.data.auditLog = A([...this.data.auditLog, e], "createdAt", 1e4), this.flush();
	}
	close() {
		this.flush();
	}
	read() {
		if (!i(this.file)) return He();
		try {
			let e = JSON.parse(o(this.file, "utf8"));
			return {
				briefs: e.briefs ?? [],
				headlines: e.headlines ?? [],
				decisions: e.decisions ?? [],
				marketTicks: e.marketTicks ?? [],
				attentionBatches: e.attentionBatches ?? [],
				entityEdges: e.entityEdges ?? [],
				signalEvents: e.signalEvents ?? [],
				osintSources: e.osintSources ?? [],
				worldIntelEvents: e.worldIntelEvents ?? [],
				secCompanyFilings: e.secCompanyFilings ?? [],
				fredMacroObservations: e.fredMacroObservations ?? [],
				treasuryFiscalRecords: e.treasuryFiscalRecords ?? [],
				beaObservations: e.beaObservations ?? [],
				eiaEnergyRecords: e.eiaEnergyRecords ?? [],
				worldIntelEmbeddings: e.worldIntelEmbeddings ?? [],
				userTheses: e.userTheses ?? [],
				countryIntelState: e.countryIntelState ?? [],
				assetIdentities: e.assetIdentities ?? [],
				favorites: e.favorites ?? [],
				eventAssetLinks: e.eventAssetLinks ?? [],
				realtimeFrames: e.realtimeFrames ?? [],
				auditLog: e.auditLog ?? []
			};
		} catch {
			return He();
		}
	}
	flush() {
		s(this.file, JSON.stringify(this.data), "utf8");
	}
};
function k(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return [...e, t];
	let r = [...e];
	return r[n] = t, r;
}
function Ve(e, t, n) {
	let r = e.findIndex((e) => e[n] === t[n]);
	if (r === -1) return [...e, t];
	let i = [...e];
	return i[r] = t, i;
}
function He() {
	return {
		briefs: [],
		headlines: [],
		decisions: [],
		marketTicks: [],
		attentionBatches: [],
		entityEdges: [],
		signalEvents: [],
		osintSources: [],
		worldIntelEvents: [],
		secCompanyFilings: [],
		fredMacroObservations: [],
		treasuryFiscalRecords: [],
		beaObservations: [],
		eiaEnergyRecords: [],
		worldIntelEmbeddings: [],
		userTheses: [],
		countryIntelState: [],
		assetIdentities: [],
		favorites: [],
		eventAssetLinks: [],
		realtimeFrames: [],
		auditLog: []
	};
}
function A(e, t, n) {
	return e.length <= n ? e : [...e].sort((e, n) => Number(n[t]) - Number(e[t])).slice(0, n).sort((e, n) => Number(e[t]) - Number(n[t]));
}
//#endregion
//#region src/data/intel.ts
var j = {
	redSeaWire: {
		id: "src-red-sea-wire",
		sourceName: "Atlasz Shipping Wire",
		sourceType: "shipping",
		sourceUrl: "local://sources/red-sea-shipping-risk",
		title: "Commercial vessels report higher route-risk premiums near Red Sea corridors",
		observedAt: "2026-06-19T07:45:00-04:00",
		publishedAt: "2026-06-19T07:31:00-04:00",
		note: "Seeded shipping-risk item used to test route disruption extraction."
	},
	freightTape: {
		id: "src-freight-tape",
		sourceName: "Mock Freight Rate Tape",
		sourceType: "market",
		sourceUrl: "local://sources/freight-rate-snapshot",
		title: "Freight and insurance proxies firm as energy futures bid",
		observedAt: "2026-06-19T07:48:00-04:00",
		publishedAt: "2026-06-19T07:40:00-04:00",
		note: "Market proxy snapshot links shipping stress to energy-sensitive assets."
	},
	oilTape: {
		id: "src-oil-tape",
		sourceName: "Mock Market Tape",
		sourceType: "market",
		sourceUrl: "local://sources/wti-intraday-snapshot",
		title: "WTI crude and energy equities rise while airline basket weakens",
		observedAt: "2026-06-19T08:05:00-04:00",
		publishedAt: "2026-06-19T08:00:00-04:00",
		note: "Price confirmation is event-adjacent, not direct supply confirmation."
	},
	taiwanWire: {
		id: "src-taiwan-wire",
		sourceName: "Regional Security Wire",
		sourceType: "news",
		sourceUrl: "local://sources/taiwan-strait-alert",
		title: "Taiwan Strait alert mentions advanced chip supply concentration",
		observedAt: "2026-06-19T06:20:00-04:00",
		publishedAt: "2026-06-19T06:06:00-04:00",
		note: "Seeded regional-risk item for entity extraction around Taiwan, TSMC, and semiconductors."
	},
	chipPolicy: {
		id: "src-chip-policy",
		sourceName: "Mock Export Control Monitor",
		sourceType: "policy",
		sourceUrl: "local://sources/us-chip-controls-calendar",
		title: "Chip-control calendar flags possible language around advanced nodes",
		observedAt: "2026-06-19T06:42:00-04:00",
		publishedAt: "2026-06-18T18:10:00-04:00",
		note: "Policy-calendar context raises relevance but does not confirm immediate rule changes."
	},
	rareEarthsPolicy: {
		id: "src-rare-earths-policy",
		sourceName: "Industrial Policy Monitor",
		sourceType: "policy",
		sourceUrl: "local://sources/china-rare-earths-restriction-watch",
		title: "Rare earth restriction chatter references EV magnets and defense electronics",
		observedAt: "2026-06-19T05:55:00-04:00",
		publishedAt: "2026-06-19T05:44:00-04:00",
		note: "Seeded policy-risk item for China rare earth leverage and downstream exposure."
	},
	evSupplyChain: {
		id: "src-ev-supply-chain",
		sourceName: "Atlasz Supply Chain Map",
		sourceType: "research",
		sourceUrl: "local://sources/ev-defense-input-map",
		title: "EV and defense supply-chain map flags rare earth processing concentration",
		observedAt: "2026-06-19T06:04:00-04:00",
		publishedAt: "2026-06-18T21:00:00-04:00",
		note: "Local relationship map links rare earth inputs to EV and defense electronics exposure."
	},
	fedCalendar: {
		id: "src-fed-calendar",
		sourceName: "Mock Central Bank Calendar",
		sourceType: "macro",
		sourceUrl: "local://sources/central-bank-language-watch",
		title: "Central bank language keeps real-yield sensitive assets on watch",
		observedAt: "2026-06-19T04:30:00-04:00",
		publishedAt: "2026-06-19T04:16:00-04:00",
		note: "Macro-calendar context used for gold, duration, Nasdaq, and Bitcoin sensitivity."
	},
	cryptoFlows: {
		id: "src-crypto-flows",
		sourceName: "Mock Crypto Flow Snapshot",
		sourceType: "market",
		sourceUrl: "local://sources/bitcoin-liquidity-snapshot",
		title: "Bitcoin firms with risk appetite while liquidity proxies remain mixed",
		observedAt: "2026-06-19T08:18:00-04:00",
		publishedAt: "2026-06-19T08:12:00-04:00",
		note: "Flow context supports sensitivity, but does not prove a single-cause move."
	},
	europeGas: {
		id: "src-europe-gas",
		sourceName: "Mock European Energy Monitor",
		sourceType: "macro",
		sourceUrl: "local://sources/europe-gas-storage-buffer",
		title: "European gas storage buffers immediate energy-security stress",
		observedAt: "2026-06-19T03:10:00-04:00",
		publishedAt: "2026-06-19T02:52:00-04:00",
		note: "Regional energy context limits immediate stress but keeps industrial margins watchlisted."
	}
};
`${[
	{
		id: "raw-red-sea-1",
		connector: "mock-shipping-wire",
		sourceName: j.redSeaWire.sourceName,
		sourceUrl: j.redSeaWire.sourceUrl,
		rawTitle: j.redSeaWire.title,
		rawExcerpt: "Route-risk references detected: Red Sea, insurance premium, crude, freight, airline margins.",
		ingestedAt: j.redSeaWire.observedAt,
		publishedAt: j.redSeaWire.publishedAt,
		normalizedEventId: "red-sea"
	},
	{
		id: "raw-red-sea-2",
		connector: "mock-market-tape",
		sourceName: j.oilTape.sourceName,
		sourceUrl: j.oilTape.sourceUrl,
		rawTitle: j.oilTape.title,
		rawExcerpt: "WTI, XLE, GLD, and airline basket used as market-linking confirmation.",
		ingestedAt: j.oilTape.observedAt,
		publishedAt: j.oilTape.publishedAt,
		normalizedEventId: "red-sea"
	},
	{
		id: "raw-taiwan-1",
		connector: "mock-gdelt",
		sourceName: j.taiwanWire.sourceName,
		sourceUrl: j.taiwanWire.sourceUrl,
		rawTitle: j.taiwanWire.title,
		rawExcerpt: "Entities detected: Taiwan, TSMC, advanced chips, Nvidia, Apple suppliers, Nasdaq.",
		ingestedAt: j.taiwanWire.observedAt,
		publishedAt: j.taiwanWire.publishedAt,
		normalizedEventId: "taiwan"
	},
	{
		id: "raw-rare-earths-1",
		connector: "mock-policy-calendar",
		sourceName: j.rareEarthsPolicy.sourceName,
		sourceUrl: j.rareEarthsPolicy.sourceUrl,
		rawTitle: j.rareEarthsPolicy.title,
		rawExcerpt: "Policy references include China, rare earths, EV magnets, defense electronics, and strategic inputs.",
		ingestedAt: j.rareEarthsPolicy.observedAt,
		publishedAt: j.rareEarthsPolicy.publishedAt,
		normalizedEventId: "rare-earths"
	},
	{
		id: "raw-fed-1",
		connector: "mock-policy-calendar",
		sourceName: j.fedCalendar.sourceName,
		sourceUrl: j.fedCalendar.sourceUrl,
		rawTitle: j.fedCalendar.title,
		rawExcerpt: "Macro sensitivity extraction links real yields, gold, Nasdaq, Bitcoin, TLT, and dollar pressure.",
		ingestedAt: j.fedCalendar.observedAt,
		publishedAt: j.fedCalendar.publishedAt,
		normalizedEventId: "central-bank"
	},
	{
		id: "raw-europe-gas-1",
		connector: "mock-gdelt",
		sourceName: j.europeGas.sourceName,
		sourceUrl: j.europeGas.sourceUrl,
		rawTitle: j.europeGas.title,
		rawExcerpt: "European storage buffer reduces immediate risk, but industrial margin exposure remains mapped.",
		ingestedAt: j.europeGas.observedAt,
		publishedAt: j.europeGas.publishedAt,
		normalizedEventId: "europe-energy"
	}
].length}`;
var Ue = [
	{
		ticker: "CL",
		name: "WTI Crude",
		price: "81.42",
		change: 2.64,
		volume: "1.4x",
		catalyst: "Shipping-risk premium and refinery margin pressure",
		connectedEvents: [
			"Red Sea shipping risk",
			"Middle East tension",
			"Inflation impulse"
		],
		confidence: 78
	},
	{
		ticker: "SOXX",
		name: "Semiconductors",
		price: "239.18",
		change: -1.18,
		volume: "1.2x",
		catalyst: "Taiwan exposure and export-control watch",
		connectedEvents: [
			"Taiwan Strait alert",
			"US chip controls",
			"TSMC concentration"
		],
		confidence: 73
	},
	{
		ticker: "GLD",
		name: "Gold ETF",
		price: "218.56",
		change: 1.04,
		volume: "1.1x",
		catalyst: "Safe-haven bid and real-yield sensitivity",
		connectedEvents: [
			"Geopolitical hedge",
			"Dollar drift",
			"Central bank demand"
		],
		confidence: 69
	},
	{
		ticker: "DAL",
		name: "Delta Air Lines",
		price: "48.76",
		change: -1.92,
		volume: "1.6x",
		catalyst: "Jet-fuel sensitivity from crude move",
		connectedEvents: [
			"Oil pressure",
			"Travel margins",
			"Consumer squeeze"
		],
		confidence: 65
	},
	{
		ticker: "BTC",
		name: "Bitcoin",
		price: "66,820",
		change: 1.36,
		volume: "0.9x",
		catalyst: "Liquidity expectations and policy headline sensitivity",
		connectedEvents: [
			"ETF flows",
			"Rate-cut expectations",
			"Regulatory calendar"
		],
		confidence: 61
	}
], We = [
	{
		ticker: "QQQ",
		name: "Nasdaq 100",
		price: "472.08",
		change: -.42,
		volume: "1.0x",
		catalyst: "Mega-cap duration and semiconductor beta",
		connectedEvents: [
			"Taiwan risk",
			"AI capex",
			"Real rates"
		],
		confidence: 66
	},
	{
		ticker: "XLE",
		name: "Energy Select Sector",
		price: "94.23",
		change: 1.87,
		volume: "1.3x",
		catalyst: "Crude move and energy-sector breadth",
		connectedEvents: [
			"WTI crude",
			"Shipping costs",
			"OPEC headline risk"
		],
		confidence: 74
	},
	{
		ticker: "NVDA",
		name: "Nvidia",
		price: "128.44",
		change: -.88,
		volume: "1.2x",
		catalyst: "AI demand remains strong; supply-chain risk is repricing",
		connectedEvents: [
			"TSMC",
			"China controls",
			"Data-center capex"
		],
		confidence: 70
	},
	{
		ticker: "AAPL",
		name: "Apple",
		price: "196.71",
		change: -.31,
		volume: "0.8x",
		catalyst: "China exposure and supplier concentration",
		connectedEvents: [
			"Taiwan",
			"China demand",
			"Tariff watch"
		],
		confidence: 59
	}
], Ge = [
	{
		id: "red-sea",
		time: "07:45 ET",
		category: "Trade route",
		region: "Middle East",
		severity: "elevated",
		confidence: 78,
		sourceCount: 3,
		title: "Red Sea shipping risk lifts energy and freight sensitivity",
		summary: "Longer routes and insurance pressure can push crude, refined products, shipping costs, and inflation expectations higher.",
		relationshipReason: "Shipping-route stress mentions Red Sea corridors, insurance costs, crude sensitivity, energy equities, gold, and airline margin pressure.",
		uncertainty: "Moderate confidence because the link is event-driven and market-confirmed, but not yet confirmed by direct supply disruption data.",
		detectedEntities: [
			"Red Sea",
			"Shipping Risk",
			"WTI Crude",
			"XLE",
			"Gold",
			"Airlines"
		],
		linkedMarkets: [
			"CL",
			"XLE",
			"GLD",
			"DAL",
			"UAL"
		],
		riskChannels: [
			"Freight cost",
			"Oil premium",
			"Inflation risk",
			"Airline margins"
		],
		evidenceNotes: [
			{
				id: "ev-red-sea-1",
				note: "Two seeded sources mention Red Sea route risk and higher insurance or freight pressure.",
				supports: "Event severity and shipping-risk classification",
				confidenceImpact: "raises"
			},
			{
				id: "ev-red-sea-2",
				note: "WTI and XLE are bid while airline exposure is weak, giving cross-market confirmation.",
				supports: "Market-linking logic to CL, XLE, GLD, DAL, and UAL",
				confidenceImpact: "raises"
			},
			{
				id: "ev-red-sea-3",
				note: "No direct outage or barrel-supply number is present in the seeded source layer.",
				supports: "Uncertainty note",
				confidenceImpact: "limits"
			}
		],
		sourceTrail: [
			j.redSeaWire,
			j.freightTape,
			j.oilTape
		]
	},
	{
		id: "taiwan",
		time: "06:20 ET",
		category: "Geopolitics",
		region: "Asia Pacific",
		severity: "critical",
		confidence: 73,
		sourceCount: 2,
		title: "Taiwan tension raises semiconductor concentration risk",
		summary: "The highest-exposure chain runs through TSMC, advanced-node chips, AI hardware, Apple suppliers, and Nasdaq beta.",
		relationshipReason: "The event mentions Taiwan and advanced-chip concentration; the local graph maps Taiwan to TSMC, SOXX, Nvidia, Apple, and QQQ.",
		uncertainty: "High structural exposure, but immediate market impact depends on headline severity, policy language, and whether the move broadens beyond semis.",
		detectedEntities: [
			"Taiwan",
			"TSMC",
			"Semiconductors",
			"Nvidia",
			"Apple",
			"Nasdaq 100"
		],
		linkedMarkets: [
			"TSM",
			"SOXX",
			"NVDA",
			"AAPL",
			"QQQ"
		],
		riskChannels: [
			"Supply-chain concentration",
			"Export controls",
			"AI hardware availability"
		],
		evidenceNotes: [
			{
				id: "ev-taiwan-1",
				note: "The seeded regional item directly names Taiwan and advanced chip supply concentration.",
				supports: "Entity extraction around Taiwan, TSMC, and semiconductors",
				confidenceImpact: "raises"
			},
			{
				id: "ev-taiwan-2",
				note: "Export-control calendar context increases relevance for Nvidia, SOXX, and QQQ.",
				supports: "Policy-risk linkage",
				confidenceImpact: "raises"
			},
			{
				id: "ev-taiwan-3",
				note: "The source layer has policy-calendar context but no confirmed new restriction.",
				supports: "Uncertainty note",
				confidenceImpact: "limits"
			}
		],
		sourceTrail: [j.taiwanWire, j.chipPolicy]
	},
	{
		id: "rare-earths",
		time: "05:55 ET",
		category: "Industrial policy",
		region: "China",
		severity: "elevated",
		confidence: 68,
		sourceCount: 2,
		title: "Rare earth restriction chatter pressures EV and defense chains",
		summary: "Magnet and battery supply concerns can hit autos, renewables, defense electronics, and countries reliant on Chinese processing.",
		relationshipReason: "Policy chatter references rare earth restrictions and the local supply-chain map links those inputs to EVs, defense electronics, Tesla, and battery ETFs.",
		uncertainty: "Moderate confidence because the risk depends on whether chatter becomes formal policy and whether exemptions or alternate supply appear.",
		detectedEntities: [
			"China",
			"Rare Earths",
			"EV Supply Chain",
			"Tesla",
			"Defense Electronics"
		],
		linkedMarkets: [
			"TSLA",
			"LIT",
			"XAR",
			"GM"
		],
		riskChannels: [
			"Input scarcity",
			"Policy retaliation",
			"Strategic inventory rebuild"
		],
		evidenceNotes: [
			{
				id: "ev-rare-1",
				note: "Policy monitor item mentions rare earth restrictions, EV magnets, and defense electronics.",
				supports: "Industrial-policy event classification",
				confidenceImpact: "raises"
			},
			{
				id: "ev-rare-2",
				note: "Local relationship map connects rare earth processing concentration to EV and defense exposure.",
				supports: "Market linkage to TSLA, LIT, XAR, and GM",
				confidenceImpact: "raises"
			},
			{
				id: "ev-rare-3",
				note: "No formal rule text is present in the seeded source trail.",
				supports: "Uncertainty note",
				confidenceImpact: "limits"
			}
		],
		sourceTrail: [j.rareEarthsPolicy, j.evSupplyChain]
	},
	{
		id: "central-bank",
		time: "04:30 ET",
		category: "Macro",
		region: "United States",
		severity: "watch",
		confidence: 61,
		sourceCount: 2,
		title: "Central bank language keeps rate-sensitive assets on watch",
		summary: "Duration-sensitive equities, crypto, gold, and dollar crosses remain linked to any shift in real-rate expectations.",
		relationshipReason: "Policy-calendar language maps to real yields and liquidity-sensitive markets; Bitcoin, gold, TLT, and QQQ are linked through rate expectations.",
		uncertainty: "Lower confidence because policy language is indirect and crypto can move on flows, positioning, or market-structure factors.",
		detectedEntities: [
			"Federal Reserve",
			"Real Yields",
			"Gold",
			"Bitcoin",
			"Nasdaq 100"
		],
		linkedMarkets: [
			"QQQ",
			"TLT",
			"GLD",
			"BTC"
		],
		riskChannels: [
			"Discount rates",
			"Liquidity expectations",
			"Dollar pressure"
		],
		evidenceNotes: [{
			id: "ev-fed-1",
			note: "Policy calendar item references real-yield sensitive assets.",
			supports: "Macro classification and market-linking logic",
			confidenceImpact: "neutral"
		}, {
			id: "ev-fed-2",
			note: "Crypto flow snapshot supports Bitcoin liquidity sensitivity but is not a direct cause.",
			supports: "BTC linkage with limited confidence",
			confidenceImpact: "limits"
		}],
		sourceTrail: [j.fedCalendar, j.cryptoFlows]
	},
	{
		id: "europe-energy",
		time: "03:10 ET",
		category: "Energy security",
		region: "Europe",
		severity: "watch",
		confidence: 57,
		sourceCount: 1,
		title: "European gas storage buffers energy-security headlines",
		summary: "Storage levels reduce immediate stress, but industrial energy costs remain sensitive to shipping and weather shocks.",
		relationshipReason: "Energy-storage context lowers immediate regional stress while preserving links to industrial margins, chemicals, and natural gas proxies.",
		uncertainty: "Limited source count and no live weather or pipeline data keep confidence moderate-low.",
		detectedEntities: [
			"Europe",
			"Natural Gas",
			"Industrial Margins",
			"Chemicals"
		],
		linkedMarkets: [
			"UNG",
			"VGK",
			"XLB"
		],
		riskChannels: [
			"Energy cost",
			"Manufacturing margin",
			"Weather volatility"
		],
		evidenceNotes: [{
			id: "ev-europe-1",
			note: "Storage buffer reduces immediate stress but still maps to industrial cost exposure.",
			supports: "Stable-to-watch severity rather than elevated severity",
			confidenceImpact: "neutral"
		}, {
			id: "ev-europe-2",
			note: "Only one seeded regional source is present.",
			supports: "Uncertainty note",
			confidenceImpact: "limits"
		}],
		sourceTrail: [j.europeGas]
	}
], Ke = Object.fromEntries(Ge.map((e) => [e.id, e])), M = (e) => Array.from(new Map(e.flatMap((e) => Ke[e]?.sourceTrail ?? []).map((e) => [e.id, e])).values()), N = (e) => e.flatMap((e) => Ke[e]?.evidenceNotes ?? []), qe = [
	{
		id: "oil-inflation",
		title: "Oil-linked risk is rising across shipping, energy, gold, and airline exposure",
		explanation: "Multiple shipping-risk items mention Red Sea routes, freight pressure, energy exposure, and inflation-sensitive markets. Related markets include CL, XLE, GLD, and airline equities. Confidence is moderate-high because the link is event-driven and cross-market confirmed, but not backed by direct supply data.",
		status: "elevated",
		confidence: 76,
		timeframe: "1-5 days",
		chain: "Red Sea -> Shipping Risk -> Oil -> XLE -> Inflation Risk -> Gold",
		linkedEventIds: ["red-sea", "central-bank"],
		linkedEntities: [
			"Red Sea",
			"Shipping Risk",
			"WTI Crude",
			"XLE",
			"Inflation Risk",
			"Gold",
			"Airlines"
		],
		linkedMarkets: [
			"CL",
			"XLE",
			"GLD",
			"DAL",
			"UAL"
		],
		repeatedThemes: [
			"shipping risk",
			"energy pressure",
			"inflation hedge",
			"airline margins"
		],
		relationshipStrength: 82,
		sourceCount: 4,
		recencyScore: 88,
		uncertainty: "No direct supply-disruption estimate is present; the signal could fade if shipping-risk headlines de-escalate.",
		evidenceTrail: N(["red-sea", "central-bank"]),
		sourceTrail: M(["red-sea", "central-bank"])
	},
	{
		id: "semi-risk",
		title: "Semiconductor beta is absorbing Taiwan concentration risk",
		explanation: "Taiwan-related event extraction clusters around TSMC, advanced-node chips, Nvidia, Apple suppliers, SOXX, and QQQ. Relationship strength is high because the entity graph has a direct supply-chain path from Taiwan to index beta.",
		status: "critical",
		confidence: 72,
		timeframe: "Intraday to 2 weeks",
		chain: "Taiwan -> TSMC -> Semiconductors -> Nvidia -> Nasdaq",
		linkedEventIds: ["taiwan", "rare-earths"],
		linkedEntities: [
			"Taiwan",
			"TSMC",
			"Semiconductors",
			"Nvidia",
			"Apple",
			"Nasdaq 100"
		],
		linkedMarkets: [
			"TSM",
			"SOXX",
			"NVDA",
			"AAPL",
			"QQQ"
		],
		repeatedThemes: [
			"supplier concentration",
			"export controls",
			"AI hardware availability"
		],
		relationshipStrength: 89,
		sourceCount: 4,
		recencyScore: 83,
		uncertainty: "The system has exposure evidence, not proof of disruption. Watch whether weakness spreads from SOXX into broader QQQ breadth.",
		evidenceTrail: N(["taiwan", "rare-earths"]),
		sourceTrail: M(["taiwan", "rare-earths"])
	},
	{
		id: "rare-earths",
		title: "Rare earth policy risk is moving from headline to supply-chain map",
		explanation: "China rare earth chatter repeats across policy and local supply-chain sources, with linked entities in EV magnets, defense electronics, Tesla, battery ETFs, and strategic inputs.",
		status: "elevated",
		confidence: 68,
		timeframe: "2-8 weeks",
		chain: "China -> Rare Earths -> EV Supply Chain -> Tesla -> QQQ",
		linkedEventIds: ["rare-earths"],
		linkedEntities: [
			"China",
			"Rare Earths",
			"EV Supply Chain",
			"Defense Electronics",
			"Tesla"
		],
		linkedMarkets: [
			"TSLA",
			"LIT",
			"XAR",
			"GM"
		],
		repeatedThemes: [
			"input scarcity",
			"policy retaliation",
			"strategic inventory"
		],
		relationshipStrength: 77,
		sourceCount: 2,
		recencyScore: 76,
		uncertainty: "The signal depends on formal policy action; current evidence is restriction chatter plus structural supply-chain mapping.",
		evidenceTrail: N(["rare-earths"]),
		sourceTrail: M(["rare-earths"])
	},
	{
		id: "liquidity-crypto",
		title: "Crypto remains tied to liquidity expectations, not isolated narrative",
		explanation: "Bitcoin strength is linked to central bank language, real yields, dollar pressure, ETF-flow context, and Nasdaq correlation. Confidence is limited because flow and positioning data are mocked.",
		status: "watch",
		confidence: 61,
		timeframe: "This week",
		chain: "Fed Language -> Real Yields -> Dollar -> Bitcoin -> Risk Appetite",
		linkedEventIds: ["central-bank"],
		linkedEntities: [
			"Federal Reserve",
			"Real Yields",
			"Dollar",
			"ETF Flows",
			"Bitcoin"
		],
		linkedMarkets: [
			"BTC",
			"QQQ",
			"TLT",
			"GLD"
		],
		repeatedThemes: [
			"real yields",
			"liquidity expectations",
			"risk appetite"
		],
		relationshipStrength: 64,
		sourceCount: 2,
		recencyScore: 69,
		uncertainty: "Crypto can move on flows and market structure that are not yet represented by real connectors.",
		evidenceTrail: N(["central-bank"]),
		sourceTrail: M(["central-bank"])
	}
], Je = {
	CL: {
		symbol: "CL",
		priceMove: "+2.64%",
		relatedEventIds: ["red-sea", "central-bank"],
		relatedEntities: [
			"Red Sea",
			"Shipping Risk",
			"WTI Crude",
			"Inflation Risk"
		],
		linkedMarkets: [
			"CL",
			"XLE",
			"GLD",
			"DAL",
			"UAL"
		],
		possibleCause: "Shipping-risk premium is being priced into crude while energy equities and gold confirm a broader risk/inflation channel.",
		relationshipReason: "The system connected CL because Red Sea route-risk sources mention freight and insurance pressure, and the market tape shows crude and XLE moving together.",
		confidence: 78,
		uncertainty: "No direct supply-disruption quantity is present, so the move may still be headline-premium rather than physical shortage.",
		sourceTrail: M(["red-sea", "central-bank"]),
		evidenceTrail: N(["red-sea", "central-bank"])
	},
	SOXX: {
		symbol: "SOXX",
		priceMove: "-1.18%",
		relatedEventIds: ["taiwan"],
		relatedEntities: [
			"Taiwan",
			"TSMC",
			"Semiconductors",
			"Nvidia",
			"Apple"
		],
		linkedMarkets: [
			"TSM",
			"SOXX",
			"NVDA",
			"AAPL",
			"QQQ"
		],
		possibleCause: "The semiconductor basket is repricing Taiwan and advanced-node concentration risk.",
		relationshipReason: "The graph path from Taiwan to TSMC to semiconductors and QQQ is direct and high strength.",
		confidence: 73,
		uncertainty: "The source trail shows exposure risk, not confirmed supply disruption or new export-control text.",
		sourceTrail: M(["taiwan"]),
		evidenceTrail: N(["taiwan"])
	},
	GLD: {
		symbol: "GLD",
		priceMove: "+1.04%",
		relatedEventIds: ["red-sea", "central-bank"],
		relatedEntities: [
			"Gold",
			"Inflation Risk",
			"Real Yields",
			"Geopolitical Hedge"
		],
		linkedMarkets: [
			"GLD",
			"CL",
			"XLE",
			"TLT"
		],
		possibleCause: "Gold is being linked to geopolitical hedge demand and real-yield sensitivity.",
		relationshipReason: "The system connects GLD to shipping-risk inflation channels and central-bank real-yield context.",
		confidence: 69,
		uncertainty: "Gold can also move on dollar and rate factors not fully represented in this seed set.",
		sourceTrail: M(["red-sea", "central-bank"]),
		evidenceTrail: N(["red-sea", "central-bank"])
	},
	DAL: {
		symbol: "DAL",
		priceMove: "-1.92%",
		relatedEventIds: ["red-sea"],
		relatedEntities: [
			"Airlines",
			"Jet Fuel",
			"WTI Crude",
			"Consumer Margins"
		],
		linkedMarkets: [
			"DAL",
			"UAL",
			"CL",
			"XLE"
		],
		possibleCause: "Airline equities are pressured by the same crude and fuel-cost channel supporting energy exposure.",
		relationshipReason: "DAL is linked as a negative exposure to oil-driven margin pressure when crude risk premium rises.",
		confidence: 65,
		uncertainty: "Company-specific booking, labor, or guidance factors are not represented in the source trail.",
		sourceTrail: M(["red-sea"]),
		evidenceTrail: N(["red-sea"])
	},
	BTC: {
		symbol: "BTC",
		priceMove: "+1.36%",
		relatedEventIds: ["central-bank"],
		relatedEntities: [
			"Bitcoin",
			"ETF Flows",
			"Real Yields",
			"Dollar",
			"Risk Appetite"
		],
		linkedMarkets: [
			"BTC",
			"QQQ",
			"TLT",
			"GLD"
		],
		possibleCause: "Bitcoin is being treated as a liquidity-sensitive asset in the current local evidence layer.",
		relationshipReason: "The system links BTC through central-bank language, real yields, and mock crypto flow context.",
		confidence: 61,
		uncertainty: "The flow snapshot is mocked and does not include exchange-level positioning or order-book data.",
		sourceTrail: M(["central-bank"]),
		evidenceTrail: N(["central-bank"])
	},
	QQQ: {
		symbol: "QQQ",
		priceMove: "-0.42%",
		relatedEventIds: ["taiwan", "central-bank"],
		relatedEntities: [
			"Nasdaq 100",
			"Semiconductors",
			"Real Yields",
			"Nvidia",
			"Apple"
		],
		linkedMarkets: [
			"QQQ",
			"SOXX",
			"NVDA",
			"AAPL",
			"TLT"
		],
		possibleCause: "QQQ is exposed to semiconductor concentration and real-yield pressure at the same time.",
		relationshipReason: "Taiwan and macro events both map into Nasdaq leadership through semis, AI hardware, and duration-sensitive growth equities.",
		confidence: 66,
		uncertainty: "Index-level movement could be driven by unrelated mega-cap flows not represented in the source trail.",
		sourceTrail: M(["taiwan", "central-bank"]),
		evidenceTrail: N(["taiwan", "central-bank"])
	},
	XLE: {
		symbol: "XLE",
		priceMove: "+1.87%",
		relatedEventIds: ["red-sea"],
		relatedEntities: [
			"Energy Equities",
			"WTI Crude",
			"Shipping Risk",
			"Inflation Risk"
		],
		linkedMarkets: [
			"XLE",
			"CL",
			"GLD"
		],
		possibleCause: "Energy equities are confirming the crude risk-premium channel.",
		relationshipReason: "XLE is linked because crude and energy breadth are moving with shipping-risk evidence.",
		confidence: 74,
		uncertainty: "The signal is weaker if crude strength fails to hold or does not broaden across energy constituents.",
		sourceTrail: M(["red-sea"]),
		evidenceTrail: N(["red-sea"])
	},
	NVDA: {
		symbol: "NVDA",
		priceMove: "-0.88%",
		relatedEventIds: ["taiwan"],
		relatedEntities: [
			"Nvidia",
			"TSMC",
			"Semiconductors",
			"AI Hardware"
		],
		linkedMarkets: [
			"NVDA",
			"TSM",
			"SOXX",
			"QQQ"
		],
		possibleCause: "Nvidia is exposed to advanced-node supply-chain concentration through TSMC.",
		relationshipReason: "The local graph maps Taiwan to TSMC to semiconductors to Nvidia and QQQ.",
		confidence: 70,
		uncertainty: "AI demand remains strong; the source trail only explains supply-chain risk, not demand revisions.",
		sourceTrail: M(["taiwan"]),
		evidenceTrail: N(["taiwan"])
	},
	AAPL: {
		symbol: "AAPL",
		priceMove: "-0.31%",
		relatedEventIds: ["taiwan", "rare-earths"],
		relatedEntities: [
			"Apple",
			"Taiwan",
			"China",
			"Supplier Concentration"
		],
		linkedMarkets: [
			"AAPL",
			"QQQ",
			"SOXX"
		],
		possibleCause: "Apple is lightly linked through supplier concentration and China exposure.",
		relationshipReason: "The event graph connects Apple to Taiwan supplier risk and China industrial-policy context.",
		confidence: 59,
		uncertainty: "The source trail does not include Apple-specific supplier guidance or demand data.",
		sourceTrail: M(["taiwan", "rare-earths"]),
		evidenceTrail: N(["taiwan", "rare-earths"])
	}
};
qe[0].sourceTrail, qe[0].evidenceTrail, Je.CL.sourceTrail, Je.CL.evidenceTrail, qe[1].sourceTrail, qe[1].evidenceTrail, M(["taiwan", "rare-earths"]), N(["taiwan", "rare-earths"]), M(["red-sea", "central-bank"]), N(["red-sea", "central-bank"]);
//#endregion
//#region src/assetUniverse.ts
var Ye = {
	BTC: {
		label: "Bitcoin",
		feedSymbol: "bitcoin",
		defaultPrice: 0
	},
	ETH: {
		label: "Ethereum",
		feedSymbol: "ethereum",
		defaultPrice: 0
	},
	SOL: {
		label: "Solana",
		feedSymbol: "solana",
		defaultPrice: 0
	},
	KAS: {
		label: "Kaspa",
		feedSymbol: "kaspa",
		defaultPrice: 0
	},
	LINK: {
		label: "Chainlink",
		feedSymbol: "chainlink",
		defaultPrice: 0
	},
	AVAX: {
		label: "Avalanche",
		feedSymbol: "avalanche-2",
		defaultPrice: 0
	}
}, Xe = {
	EURUSD: {
		label: "Euro / US Dollar",
		feedSymbol: "EURUSD=X",
		defaultPrice: 0
	},
	GBPUSD: {
		label: "British Pound / US Dollar",
		feedSymbol: "GBPUSD=X",
		defaultPrice: 0
	},
	USDJPY: {
		label: "US Dollar / Japanese Yen",
		feedSymbol: "JPY=X",
		defaultPrice: 0
	},
	USDCAD: {
		label: "US Dollar / Canadian Dollar",
		feedSymbol: "CAD=X",
		defaultPrice: 0
	},
	AUDUSD: {
		label: "Australian Dollar / US Dollar",
		feedSymbol: "AUDUSD=X",
		defaultPrice: 0
	},
	USDCHF: {
		label: "US Dollar / Swiss Franc",
		feedSymbol: "CHF=X",
		defaultPrice: 0
	}
}, Ze = {
	SPX: {
		label: "S&P 500 Index",
		feedSymbol: "^GSPC",
		defaultPrice: 0
	},
	NDX: {
		label: "Nasdaq 100 Index",
		feedSymbol: "^NDX",
		defaultPrice: 0
	},
	DJI: {
		label: "Dow Jones Industrial Average",
		feedSymbol: "^DJI",
		defaultPrice: 0
	},
	RUT: {
		label: "Russell 2000 Index",
		feedSymbol: "^RUT",
		defaultPrice: 0
	},
	VIX: {
		label: "CBOE Volatility Index",
		feedSymbol: "^VIX",
		defaultPrice: 0
	},
	DXY: {
		label: "US Dollar Index",
		feedSymbol: "DX-Y.NYB",
		defaultPrice: 0
	}
}, Qe = {
	TECH: {
		symbol: "XLK",
		label: "Technology Select Sector",
		defaultPrice: 0
	},
	TECHNOLOGY: {
		symbol: "XLK",
		label: "Technology Select Sector",
		defaultPrice: 0
	},
	FINANCIALS: {
		symbol: "XLF",
		label: "Financial Select Sector",
		defaultPrice: 0
	},
	ENERGY: {
		symbol: "XLE",
		label: "Energy Select Sector",
		defaultPrice: 0
	},
	HEALTHCARE: {
		symbol: "XLV",
		label: "Health Care Select Sector",
		defaultPrice: 0
	},
	INDUSTRIALS: {
		symbol: "XLI",
		label: "Industrial Select Sector",
		defaultPrice: 0
	},
	UTILITIES: {
		symbol: "XLU",
		label: "Utilities Select Sector",
		defaultPrice: 0
	}
}, $e = {
	CL: {
		label: "WTI Crude futures",
		feedSymbol: "CL=F",
		defaultPrice: 0
	},
	WTI: {
		label: "WTI Crude futures",
		feedSymbol: "CL=F",
		defaultPrice: 0
	},
	XAUUSD: {
		label: "Gold futures proxy",
		feedSymbol: "GC=F",
		defaultPrice: 0
	},
	GOLD: {
		label: "Gold futures proxy",
		feedSymbol: "GC=F",
		defaultPrice: 0
	},
	XAGUSD: {
		label: "Silver futures proxy",
		feedSymbol: "SI=F",
		defaultPrice: 0
	},
	SILVER: {
		label: "Silver futures proxy",
		feedSymbol: "SI=F",
		defaultPrice: 0
	}
}, et = {
	NVDA: {
		label: "Nvidia",
		defaultPrice: 0
	},
	AAPL: {
		label: "Apple",
		defaultPrice: 0
	},
	TSLA: {
		label: "Tesla",
		defaultPrice: 0
	},
	TSM: {
		label: "Taiwan Semiconductor",
		defaultPrice: 0
	},
	COIN: {
		label: "Coinbase Global",
		defaultPrice: 0
	},
	MSFT: {
		label: "Microsoft",
		defaultPrice: 0
	},
	AMZN: {
		label: "Amazon",
		defaultPrice: 0
	},
	XOM: {
		label: "Exxon Mobil",
		defaultPrice: 0
	},
	CVX: {
		label: "Chevron",
		defaultPrice: 0
	},
	VLO: {
		label: "Valero Energy",
		defaultPrice: 0
	},
	ZIM: {
		label: "ZIM Integrated Shipping",
		defaultPrice: 0
	},
	DAL: {
		label: "Delta Air Lines",
		defaultPrice: 0
	},
	UAL: {
		label: "United Airlines",
		defaultPrice: 0
	},
	GM: {
		label: "General Motors",
		defaultPrice: 0
	}
}, tt = new Set([
	"SPY",
	"QQQ",
	"SOXX",
	"GLD",
	"XLE",
	"XLK",
	"XLF",
	"XLV",
	"XLI",
	"XLU",
	"LIT",
	"XAR",
	"TLT",
	"UNG",
	"VGK",
	"XLB",
	"FXI"
]), nt = [
	"BTC",
	"ETH",
	"KAS",
	"SOL",
	"EUR/USD",
	"USD/JPY",
	"SPX",
	"NDX",
	"VIX",
	"SPY",
	"QQQ",
	"SOXX",
	"XLK",
	"XLE",
	"NVDA",
	"TSM",
	"TSLA",
	"AAPL",
	"FXI",
	"ZIM",
	"VLO",
	"CL",
	"GOLD"
];
function rt(e = !1) {
	return ft(nt.map((t) => at(t, { enablePublicCrypto: e })));
}
function it(e) {
	return Object.fromEntries(e.map((e) => [e.symbol, e.defaultPrice]));
}
function at(e, t = {}) {
	let n = ot(e.trim()), r = st(n), i = ct(r ?? n);
	if (i) return lt(i, t.enablePublicCrypto);
	let a = n.replace(/[/-]/g, "");
	if (Xe[a]) {
		let e = Xe[a];
		return dt(`${a.slice(0, 3)}/${a.slice(3)}`, e.label, "forex", "yahoo", e.feedSymbol, e.defaultPrice, "Yahoo public chart FX lookup; delayed/public unauthenticated");
	}
	let o = Qe[n];
	if (o) return dt(o.symbol, o.label, "sector", "yahoo", o.symbol, o.defaultPrice, "Yahoo public chart sector ETF proxy; delayed/public unauthenticated");
	let s = r ?? n, c = Ye[s];
	if (c) return dt(s, c.label, "crypto", t.enablePublicCrypto ? "coincap" : "coingecko", c.feedSymbol, c.defaultPrice, t.enablePublicCrypto ? "Public CoinCap-capable crypto mapping" : "Public CoinGecko REST mapping");
	let l = Ze[n];
	if (l) return dt(n, l.label, "index", "yahoo", l.feedSymbol, l.defaultPrice, "Yahoo public chart index lookup; delayed/public unauthenticated");
	let u = $e[n];
	if (u) return dt(n === "WTI" ? "CL" : n === "GOLD" ? "XAUUSD" : n === "SILVER" ? "XAGUSD" : n, u.label, "commodity", "yahoo", u.feedSymbol, u.defaultPrice, "Yahoo public chart commodity futures proxy; delayed/public unauthenticated");
	let d = et[n];
	if (d) return dt(n, d.label, "equity", "yahoo", n, d.defaultPrice, "Yahoo public chart equity lookup; delayed/public unauthenticated");
	let f = tt.has(n) ? "etf" : "equity";
	return dt(n, `${n} watchlist asset`, f, "yahoo", n, 0, "Yahoo public chart lookup; PRICE_UNAVAILABLE if the symbol is not found");
}
function ot(e) {
	return e.toUpperCase().replace(/\s+/g, "");
}
function st(e) {
	if (Ye[e]) return e;
	let t = e.replace(/[/-]/g, "");
	for (let e of ["USDT", "USD"]) if (t.endsWith(e)) {
		let n = t.slice(0, -e.length);
		if (Ye[n]) return n;
	}
	return null;
}
function ct(e) {
	return [...Ue, ...We].find((t) => t.ticker === e);
}
function lt(e, t = !1) {
	let n = Ye[e.ticker], r = $e[e.ticker], i = Ze[e.ticker], a = ut(e.ticker), o = t && n ? "coincap" : n ? "coingecko" : "yahoo", s = n?.feedSymbol ?? r?.feedSymbol ?? i?.feedSymbol ?? e.ticker;
	return dt(e.ticker, e.name, a, o, s, 0, n ? "Public crypto mapping" : "Yahoo public chart watchlist lookup; delayed/public unauthenticated");
}
function ut(e) {
	return Ye[e] ? "crypto" : $e[e] ? "commodity" : Ze[e] ? "index" : tt.has(e) ? "etf" : (et[e], "equity");
}
function dt(e, t, n, r, i, a, o) {
	return {
		symbol: e,
		displaySymbol: e,
		label: t,
		kind: n,
		source: r,
		feedSymbol: i,
		defaultPrice: a,
		description: o
	};
}
function ft(e) {
	return [...new Map(e.map((e) => [e.symbol, e])).values()];
}
//#endregion
//#region src/realtime.ts
var pt = {
	running: !1,
	mode: "stopped",
	sqliteMode: "unknown",
	connectedFeeds: [],
	reconnectingFeeds: []
}, mt = class {
	capacity;
	buffer;
	head = 0;
	length = 0;
	constructor(e) {
		if (!Number.isInteger(e) || e <= 0) throw RangeError(`RingBuffer capacity must be a positive integer, received ${String(e)}`);
		this.capacity = e, this.buffer = Array(e);
	}
	get size() {
		return this.length;
	}
	get isFull() {
		return this.length === this.capacity;
	}
	get isEmpty() {
		return this.length === 0;
	}
	push(e) {
		this.buffer[this.head] = e, this.head = this.head + 1 === this.capacity ? 0 : this.head + 1, this.length < this.capacity && (this.length += 1);
	}
	latest() {
		if (this.length === 0) return;
		let e = this.head === 0 ? this.capacity - 1 : this.head - 1;
		return this.buffer[e];
	}
	oldest() {
		if (this.length !== 0) return this.buffer[this.startIndex()];
	}
	forEach(e) {
		let t = this.startIndex();
		for (let n = 0; n < this.length; n += 1) {
			let r = t + n;
			r >= this.capacity && (r -= this.capacity), e(this.buffer[r], n);
		}
	}
	reduce(e, t) {
		let n = t;
		return this.forEach((t) => {
			n = e(n, t);
		}), n;
	}
	forEachReverseWhile(e) {
		for (let t = 0; t < this.length; t += 1) {
			let n = this.head - 1 - t;
			if (n < 0 && (n += this.capacity), !e(this.buffer[n])) return;
		}
	}
	toArray() {
		let e = Array(this.length);
		return this.forEach((t, n) => {
			e[n] = t;
		}), e;
	}
	slice(e) {
		let t = Math.max(0, Math.min(e, this.length)), n = Array(t), r = this.length - t, i = 0;
		return this.forEach((e, t) => {
			t >= r && (n[i] = e, i += 1);
		}), n;
	}
	clear() {
		this.head = 0, this.length = 0, this.buffer.fill(void 0);
	}
	startIndex() {
		let e = this.head - this.length;
		return e < 0 ? e + this.capacity : e;
	}
}, ht = 6e4, gt = 30 * ht, _t = class {
	assets = /* @__PURE__ */ new Map();
	order = [];
	listeners = /* @__PURE__ */ new Set();
	attention = /* @__PURE__ */ new Map();
	attentionOrder = [];
	entityEdges;
	bufferSize;
	syncIntervalMs;
	now;
	backBufferA = [];
	backBufferB = [];
	pending = this.backBufferA;
	attentionBackBufferA = [];
	attentionBackBufferB = [];
	pendingAttention = this.attentionBackBufferA;
	frontFrame = null;
	status;
	sequence = 0;
	running = !1;
	lastSyncAt = 0;
	rafHandle = null;
	timerHandle = null;
	feeds = [];
	simulatorTimer = null;
	constructor(e) {
		this.bufferSize = e.bufferSize ?? 1e3, this.syncIntervalMs = e.syncIntervalMs ?? 100, this.entityEdges = e.entityEdges ?? [], this.now = e.now ?? vt, this.status = {
			...pt,
			sqliteMode: e.sqliteMode ?? "unknown"
		};
		let t = e.seedPrices ?? {};
		for (let n of e.assets) {
			let e = t[n.symbol] ?? 0;
			this.assets.set(n.symbol, {
				config: n,
				ticks: new mt(this.bufferSize),
				sessionOpen: e,
				lastPrice: e,
				lastTimestamp: 0,
				tickCount: 0,
				previousMinuteVolume: 0,
				previousMinuteStamp: 0
			}), this.order.push(n.symbol);
		}
		let n = e.attentionTargets ?? e.assets.map((e) => e.symbol);
		for (let e of n) this.ensureAttentionTarget(e);
	}
	subscribe(e) {
		return this.listeners.add(e), e(this.getSnapshot()), () => {
			this.listeners.delete(e);
		};
	}
	getSnapshot() {
		return {
			frame: this.frontFrame,
			status: this.status
		};
	}
	ingest(e) {
		this.assets.has(e.symbol) && (!Number.isFinite(e.price) || e.price <= 0 || this.pending.push(e));
	}
	addAsset(e, t = 0) {
		!e.symbol || this.assets.has(e.symbol) || (this.assets.set(e.symbol, {
			config: e,
			ticks: new mt(this.bufferSize),
			sessionOpen: t,
			lastPrice: t,
			lastTimestamp: 0,
			tickCount: 0,
			previousMinuteVolume: 0,
			previousMinuteStamp: 0
		}), this.order.push(e.symbol), this.ensureAttentionTarget(e.symbol), this.emit());
	}
	ingestAttention(e) {
		this.attention.has(e.target) && (!Number.isFinite(e.pressure) || !Number.isFinite(e.mentionVelocity) || this.pendingAttention.push({
			...e,
			pressure: yt(e.pressure, 0, 100),
			sentimentDivergenceIndex: yt(e.sentimentDivergenceIndex, -1, 1)
		}));
	}
	registerFeed(e) {
		this.feeds.push(e);
	}
	start(e = {}) {
		if (this.running) return;
		this.running = !0, this.lastSyncAt = this.now();
		let t = [];
		for (let e of this.feeds) e.start((e) => this.ingest(e)), t.push(e.name);
		let n = e.simulate === !0;
		n && (this.startSimulator(), t.push("simulator")), this.status = {
			...this.status,
			running: !0,
			mode: n ? this.feeds.length > 0 ? "hybrid" : "simulated" : "live",
			connectedFeeds: t,
			error: void 0
		}, this.scheduleNextFlush(), this.emit();
	}
	stop() {
		if (!this.running) return;
		this.running = !1;
		let e = xt();
		this.rafHandle !== null && e && e(this.rafHandle), this.rafHandle = null, this.timerHandle !== null && (clearTimeout(this.timerHandle), this.timerHandle = null), this.simulatorTimer !== null && (clearInterval(this.simulatorTimer), this.simulatorTimer = null);
		for (let e of this.feeds) e.stop();
		this.status = {
			...this.status,
			running: !1,
			mode: "stopped",
			connectedFeeds: []
		}, this.emit();
	}
	setSqliteMode(e) {
		this.status = {
			...this.status,
			sqliteMode: e
		}, this.emit();
	}
	setHealth(e) {
		let t = e.replay.active ? "replay" : e.sourceTrust === "simulated" ? "simulated" : "live";
		this.status = {
			...this.status,
			mode: t,
			sqliteMode: e.sqliteMode,
			connectedFeeds: [e.activeConnectorId],
			reconnectingFeeds: e.ingestionStatus === "reconnecting" ? [e.activeConnectorId] : [],
			health: e,
			error: e.ingestionStatus === "failed" ? e.connectors.find((t) => t.id === e.activeConnectorId)?.lastError : void 0
		}, this.frontFrame &&= {
			...this.frontFrame,
			status: this.status
		}, this.emit();
	}
	scheduleNextFlush() {
		if (!this.running) return;
		let e = bt();
		e ? this.rafHandle = e(() => this.tick()) : this.timerHandle = setTimeout(() => this.tick(), this.syncIntervalMs);
	}
	tick() {
		if (!this.running) return;
		let e = this.now();
		e - this.lastSyncAt >= this.syncIntervalMs && (this.lastSyncAt = e, (this.pending.length > 0 || this.pendingAttention.length > 0) && this.flush(e)), this.scheduleNextFlush();
	}
	flush(e) {
		let t = this.pending;
		this.pending = t === this.backBufferA ? this.backBufferB : this.backBufferA, this.pending.length = 0;
		let n = this.pendingAttention;
		this.pendingAttention = n === this.attentionBackBufferA ? this.attentionBackBufferB : this.attentionBackBufferA, this.pendingAttention.length = 0;
		for (let e of t) {
			let t = this.assets.get(e.symbol);
			t && (t.ticks.push(e), t.lastPrice = e.price, t.lastTimestamp = e.timestamp, t.tickCount += 1);
		}
		t.length = 0;
		for (let e of n) {
			let t = this.attention.get(e.target);
			t && (t.samples.push(e), t.latestPressure = e.pressure, t.latestMentionVelocity = e.mentionVelocity, t.latestSentimentDivergenceIndex = e.sentimentDivergenceIndex, t.lastTimestamp = e.timestamp, t.sampleCount += 1);
		}
		n.length = 0;
		let r = this.order.map((t) => {
			let n = this.assets.get(t);
			return this.snapshotFor(n, e);
		}), i = this.attentionOrder.map((e) => {
			let t = this.attention.get(e);
			return {
				target: t.target,
				pressure: P(t.latestPressure, 2),
				mentionVelocity: P(t.latestMentionVelocity, 2),
				sentimentDivergenceIndex: P(t.latestSentimentDivergenceIndex, 3),
				sampleCount: t.sampleCount,
				lastUpdated: t.lastTimestamp,
				samples: t.samples.slice(120)
			};
		});
		this.sequence += 1, this.frontFrame = {
			sequence: this.sequence,
			emittedAt: e,
			assets: r,
			attention: i,
			entityEdges: this.entityEdges,
			signals: [],
			status: this.status
		}, this.emit();
	}
	snapshotFor(e, t) {
		let n = this.computeMetrics(e, t), r = e.sessionOpen > 0 ? (e.lastPrice - e.sessionOpen) / e.sessionOpen * 100 : 0;
		return {
			symbol: e.config.symbol,
			label: e.config.label,
			kind: e.config.kind,
			source: e.config.source,
			price: P(e.lastPrice, 4),
			changePct: P(r, 3),
			volume: P(n.oneMinuteVolume, 2),
			tickCount: e.tickCount,
			lastUpdated: e.lastTimestamp,
			metrics: n,
			ticks: e.ticks.slice(120)
		};
	}
	computeMetrics(e, t) {
		let n = 0, r = 0, i = NaN, a = 0, o = 0, s = 0;
		e.ticks.forEachReverseWhile((e) => {
			let i = t - e.timestamp;
			return i > gt ? !1 : (r += e.volume, i <= ht && (n += e.volume), !0);
		});
		let c = e.ticks.toArray();
		for (let e of c) {
			if (t - e.timestamp > ht) {
				i = e.price;
				continue;
			}
			if (Number.isFinite(i) && i > 0) {
				let t = Math.log(e.price / i);
				a += t, o += t * t, s += 1;
			}
			i = e.price;
		}
		let l = 0;
		if (s > 1) {
			let e = a / s, t = Math.max(0, o / s - e * e);
			l = P(Math.sqrt(t) * 1e4, 2);
		}
		let u = Math.floor(t / ht);
		e.previousMinuteStamp !== 0 && u !== e.previousMinuteStamp ? (e.previousMinuteVolume = n, e.previousMinuteStamp = u) : e.previousMinuteStamp === 0 && (e.previousMinuteStamp = u, e.previousMinuteVolume = n);
		let d = e.previousMinuteVolume, f = d > 0 ? P((n - d) / d, 3) : 0;
		return {
			volatilityVelocity: l,
			volumeAcceleration: f,
			oneMinuteVolume: P(n, 2),
			thirtyMinuteAverageVolume: P(r / 30, 2)
		};
	}
	emit() {
		let e = this.getSnapshot();
		for (let t of this.listeners) t(e);
	}
	ensureAttentionTarget(e) {
		this.attention.has(e) || (this.attention.set(e, {
			target: e,
			samples: new mt(this.bufferSize),
			latestPressure: 0,
			latestMentionVelocity: 0,
			latestSentimentDivergenceIndex: 0,
			lastTimestamp: 0,
			sampleCount: 0
		}), this.attentionOrder.push(e));
	}
	startSimulator() {
		if (this.simulatorTimer !== null) return;
		let e = /* @__PURE__ */ new Map();
		for (let t of this.order) e.set(t, 0);
		this.simulatorTimer = setInterval(() => {
			let t = Date.now(), n = (Math.random() - .5) * 9e-4;
			for (let r of this.order) {
				let i = this.assets.get(r);
				if (!i) continue;
				let a = (Math.random() - .5) * .0022, o = (e.get(r) ?? 0) * .6, s = n + a + o;
				e.set(r, s);
				let c = Math.max(1e-4, i.lastPrice * (1 + s)), l = Math.random() < .06 ? 4 + Math.random() * 8 : 1, u = 20 + Math.random() * 60;
				this.ingest({
					symbol: r,
					price: c,
					volume: P(u * l, 2),
					timestamp: t,
					source: "simulator"
				}), this.ingestAttention({
					target: r,
					pressure: P(yt(38 + Math.abs(s) * 12e3 + (l - 1) * 5, 0, 100), 2),
					mentionVelocity: P(Math.max(0, l - .8 + Math.abs(s) * 1e3), 2),
					sentimentDivergenceIndex: P(yt(s * 280 + (Math.random() - .5) * .18, -1, 1), 3),
					timestamp: t,
					source: "simulator"
				});
			}
		}, Math.min(this.syncIntervalMs, 120));
	}
};
function vt() {
	return Date.now();
}
function P(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function yt(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function bt() {
	let e = globalThis.requestAnimationFrame;
	return typeof e == "function" ? e.bind(globalThis) : null;
}
function xt() {
	let e = globalThis.cancelAnimationFrame;
	return typeof e == "function" ? e.bind(globalThis) : null;
}
//#endregion
//#region src/engine/signalEngine.ts
function St(e, t) {
	let n = new Map(t?.attention.map((e) => [e.target, e]) ?? []), r = new Map(e.attention.map((e) => [e.target, e])), i = e.assets.length > 0 ? e.assets.reduce((e, t) => e + t.changePct, 0) / e.assets.length : 0, a = [];
	for (let t of e.assets) {
		let o = r.get(t.symbol), s = n.get(t.symbol);
		a.push(...Ct(t, e, i)), o && a.push(...wt(t, o, s, e));
	}
	return a.sort((e, t) => t.magnitude - e.magnitude).slice(0, 12).map((t) => Tt(t, e));
}
function Ct(e, t, n) {
	let r = [], i = Math.max(e.metrics.thirtyMinuteAverageVolume, 1), a = e.metrics.oneMinuteVolume / i;
	(e.metrics.volumeAcceleration >= 1.75 || a >= 4) && r.push({
		type: "unusual_volume_spike",
		assetOrTopicId: e.symbol,
		severity: Et(Math.max(e.metrics.volumeAcceleration, a / 2)),
		magnitude: Math.max(e.metrics.volumeAcceleration, a / 2),
		explanation: `${e.symbol} volume is running ${a.toFixed(1)}x its rolling baseline with acceleration ${e.metrics.volumeAcceleration.toFixed(2)}.`,
		relatedGraphNodes: Ot(e.symbol, t)
	}), e.metrics.volatilityVelocity >= 18 && r.push({
		type: "volatility_velocity_spike",
		assetOrTopicId: e.symbol,
		severity: Et(e.metrics.volatilityVelocity / 10),
		magnitude: e.metrics.volatilityVelocity / 10,
		explanation: `${e.symbol} volatility velocity reached ${e.metrics.volatilityVelocity.toFixed(1)} bps on the one-minute window.`,
		relatedGraphNodes: Ot(e.symbol, t)
	});
	let o = Math.abs(e.changePct - n);
	return o >= 2.5 && e.metrics.volatilityVelocity >= 8 && r.push({
		type: "correlation_break",
		assetOrTopicId: e.symbol,
		severity: Et(o / 1.5),
		magnitude: o / 1.5,
		explanation: `${e.symbol} is deviating ${o.toFixed(2)} points from the basket while volatility remains elevated.`,
		relatedGraphNodes: Ot(e.symbol, t)
	}), r;
}
function wt(e, t, n, r) {
	let i = [];
	if (t.pressure >= 78 || t.mentionVelocity >= 8) {
		let e = Math.max(t.pressure / 25, t.mentionVelocity / 3);
		i.push({
			type: "attention_pressure_spike",
			assetOrTopicId: t.target,
			severity: Et(e),
			magnitude: e,
			explanation: `${t.target} attention pressure is ${t.pressure.toFixed(0)} with dV/dt ${t.mentionVelocity.toFixed(1)}.`,
			relatedGraphNodes: Ot(t.target, r)
		});
	}
	let a = Math.sign(e.changePct), o = Math.sign(t.sentimentDivergenceIndex);
	if (a !== 0 && o !== 0 && a !== o && Math.abs(e.changePct) >= .2 && Math.abs(t.sentimentDivergenceIndex) >= .28) {
		let n = Math.abs(e.changePct) + Math.abs(t.sentimentDivergenceIndex) * 3;
		i.push({
			type: "sentiment_price_divergence",
			assetOrTopicId: t.target,
			severity: Et(n),
			magnitude: n,
			explanation: `${t.target} price direction and social sentiment are diverging: price ${e.changePct.toFixed(2)}%, sentiment index ${t.sentimentDivergenceIndex.toFixed(2)}.`,
			relatedGraphNodes: Ot(t.target, r)
		});
	}
	if (n) {
		let e = t.mentionVelocity - n.mentionVelocity;
		if (e >= 4.5 && t.pressure >= 62) {
			let n = e / 2;
			i.push({
				type: "narrative_acceleration",
				assetOrTopicId: t.target,
				severity: Et(n),
				magnitude: n,
				explanation: `${t.target} narrative velocity accelerated by ${e.toFixed(1)} mentions/min equivalent since the prior frame.`,
				relatedGraphNodes: Ot(t.target, r)
			});
		}
	}
	return i;
}
function Tt(e, t) {
	return {
		id: `${e.type}:${e.assetOrTopicId}:${Math.floor(t.emittedAt / 1e3)}`,
		type: e.type,
		assetOrTopicId: e.assetOrTopicId,
		severity: e.severity,
		evidenceIds: [
			`frame:${t.sequence}`,
			`asset:${e.assetOrTopicId}`,
			`signal:${e.type}`
		],
		confidence: Dt(e.severity),
		createdAt: t.emittedAt,
		explanation: e.explanation,
		relatedGraphNodes: e.relatedGraphNodes
	};
}
function Et(e) {
	return e >= 5 ? "critical" : e >= 3.5 ? "high" : e >= 2 ? "elevated" : "watch";
}
function Dt(e) {
	return e === "critical" || e === "high" ? "HIGH" : e === "elevated" ? "ELEVATED" : "WATCH";
}
function Ot(e, t) {
	let n = e.toLowerCase(), r = new Set([e]);
	for (let e of t.entityEdges) (e.source.toLowerCase().includes(n) || e.target.toLowerCase().includes(n)) && (r.add(e.source), r.add(e.target));
	return [...r].slice(0, 8);
}
//#endregion
//#region electron/liquiditySampler.ts
var kt = 1e3, At = 96, jt = class {
	sampleMs;
	maxPerBatch;
	now;
	lastAcceptedAtBySymbol = /* @__PURE__ */ new Map();
	constructor(e = {}) {
		this.sampleMs = Math.max(100, Math.floor(e.sampleMs ?? kt)), this.maxPerBatch = Math.max(1, Math.floor(e.maxPerBatch ?? At)), this.now = e.now ?? (() => Date.now());
	}
	select(e, t = this.now()) {
		let n = [], r = /* @__PURE__ */ new Set();
		for (let i of e) {
			if (n.length >= this.maxPerBatch) break;
			if (!Mt(i)) continue;
			let e = i.symbol.toUpperCase();
			r.has(e) || t - (this.lastAcceptedAtBySymbol.get(e) ?? 0) < this.sampleMs || (r.add(e), n.push(i), this.lastAcceptedAtBySymbol.set(e, t));
		}
		return n;
	}
	snapshot() {
		return {
			sampleMs: this.sampleMs,
			maxPerBatch: this.maxPerBatch,
			trackedSymbols: this.lastAcceptedAtBySymbol.size
		};
	}
};
function Mt(e) {
	return typeof e.symbol == "string" && e.symbol.trim() !== "" && Number.isFinite(e.price) && e.price > 0 && Number.isFinite(e.volume) && e.volume >= 0 && Number.isFinite(e.timestamp);
}
//#endregion
//#region electron/realtimeService.ts
var { BrowserWindow: Nt } = e(import.meta.url)("electron"), Pt = t(r(import.meta.url)), Ft = 5 * 6e4, It = process.env.ATLASZ_ALLOW_SIMULATED_DATA === "1" || process.env.NODE_ENV === "test", Lt = [], Rt = class {
	engine;
	persistence;
	enablePublicWs = process.env.ATLASZ_ENABLE_PUBLIC_WS === "1";
	defaultConnectorId = process.env.ATLASZ_CONNECTOR ?? (process.env.ATLASZ_ENABLE_PUBLIC_WS === "1" ? "coincap_public_ws" : "public_market_rest");
	seenSignalIds = /* @__PURE__ */ new Set();
	universe = rt(this.enablePublicWs);
	seedPrices = it(this.universe);
	knownSymbols = new Set(this.universe.map((e) => e.symbol));
	worker = null;
	unsubscribe = null;
	healthState;
	previousLiveFrame = null;
	latestLiveSnapshot = {
		frame: null,
		status: {
			running: !1,
			mode: "stopped",
			sqliteMode: "unknown",
			connectedFeeds: [],
			reconnectingFeeds: []
		}
	};
	liquiditySampler = new jt({
		sampleMs: Bt("ATLASZ_MARKET_TICK_SAMPLE_MS", 1e3),
		maxPerBatch: Bt("ATLASZ_MARKET_TICK_MAX_PER_BATCH", 96)
	});
	persistedMarketSymbols = /* @__PURE__ */ new Set();
	persistedMarketTickCount = 0;
	lastMarketPersistAt;
	lastAttentionPersistAt = 0;
	lastFramePersistAt = 0;
	lastFrameAuditAt = 0;
	replayFrames = [];
	replayIndex = 0;
	replayTimer = null;
	replaySnapshot = null;
	replayState = {
		active: !1,
		playing: !1,
		speed: 1,
		frameCount: 0
	};
	constructor(e) {
		this.persistence = e.persistence, this.healthState = zt(this.defaultConnectorId, this.persistence.mode), this.engine = new _t({
			assets: this.universe,
			seedPrices: this.seedPrices,
			syncIntervalMs: 100,
			bufferSize: 1e3,
			entityEdges: Lt,
			attentionTargets: [...new Set([
				...this.universe.map((e) => e.symbol),
				"AIXR",
				"LIT"
			])],
			sqliteMode: this.persistence.mode,
			now: () => Date.now()
		});
		for (let e of Lt) this.safePersist(() => this.persistence.saveEntityEdge({
			id: e.id,
			source: e.source,
			target: e.target,
			relation: e.relation,
			confidence: e.confidence,
			createdAt: e.createdAt
		}));
	}
	start() {
		return this.ensureBroadcast(), this.ensureEngine(), this.startWorker(this.defaultConnectorId), this.snapshot();
	}
	stop() {
		return this.stopReplay(), this.worker?.postMessage({ type: "stop" }), this.engine.stop(), this.healthState = {
			...this.health(),
			ingestionStatus: "stopped",
			workerStatus: "stopped",
			replay: this.replayState
		}, this.engine.setHealth(this.healthState), this.snapshot();
	}
	restart(e) {
		return this.stopReplay(), this.ensureEngine(), this.worker ? this.worker.postMessage({
			type: "restart",
			connectorId: e ?? this.defaultConnectorId
		}) : this.startWorker(e ?? this.defaultConnectorId), this.snapshot();
	}
	snapshot() {
		return this.replayState.active && this.replaySnapshot ? this.replaySnapshot : this.latestLiveSnapshot.frame ? this.latestLiveSnapshot : this.engine.getSnapshot();
	}
	status() {
		return this.snapshot().status;
	}
	health() {
		return {
			...this.healthState,
			sqliteMode: this.persistence.mode,
			replay: this.replayState,
			liquidityHistory: this.liquidityHistoryHealth()
		};
	}
	addAsset(e) {
		let t = at(e, { enablePublicCrypto: this.enablePublicWs });
		return this.engine.addAsset(t, t.defaultPrice), this.seedPrices[t.symbol] = t.defaultPrice, this.knownSymbols.add(t.symbol), this.worker?.postMessage({
			type: "addAsset",
			asset: t,
			seedPrice: t.defaultPrice
		}), this.audit("connector_started", "info", `Watchlist asset ${t.symbol} added`, {
			symbol: t.symbol,
			kind: t.kind,
			source: t.source,
			query: e
		}), this.snapshot();
	}
	ingestExternalBatch(e, t) {
		this.ensureEngine();
		for (let t of e) this.ensureAsset(t.symbol), this.engine.ingest(t);
		for (let e of t) this.ensureAsset(e.target), this.engine.ingestAttention(e);
		this.persistSampledBatch(e, t);
	}
	setSqliteMode(e) {
		this.engine.setSqliteMode(e), this.healthState = {
			...this.healthState,
			sqliteMode: e
		}, this.engine.setHealth(this.health());
	}
	traverseRisk(e) {
		let t = [];
		return this.audit("graph_traversal_triggered", "info", `Graph traversal triggered from ${e}`, {
			nodeId: e,
			exposedAssets: t.map((e) => e.node.symbol ?? e.node.label)
		}), t;
	}
	replayStart(e = {}) {
		let t = e.to ?? Date.now(), n = e.from ?? t - Ft, r = e.speed ?? this.replayState.speed;
		return this.replayFrames = this.persistence.listRealtimeFrames(n, t, 3e3), this.replayIndex = 0, this.replayState = {
			active: !0,
			playing: this.replayFrames.length > 0,
			speed: r,
			windowStart: n,
			windowEnd: t,
			cursor: this.replayFrames[0]?.emittedAt ?? n,
			frameCount: this.replayFrames.length
		}, this.engine.setHealth(this.health()), this.publishReplayFrame(), this.scheduleReplay(), this.snapshot();
	}
	replayPause() {
		return this.replayState = {
			...this.replayState,
			playing: !1
		}, this.clearReplayTimer(), this.engine.setHealth(this.health()), this.publishReplayFrame(), this.snapshot();
	}
	replayResume() {
		return this.replayState.active ? (this.replayState = {
			...this.replayState,
			playing: this.replayFrames.length > 0
		}, this.engine.setHealth(this.health()), this.publishReplayFrame(), this.scheduleReplay(), this.snapshot()) : this.replayStart();
	}
	replaySetSpeed(e) {
		return this.replayState = {
			...this.replayState,
			speed: e
		}, this.engine.setHealth(this.health()), this.scheduleReplay(), this.snapshot();
	}
	replaySeek(e) {
		if (!this.replayState.active || this.replayFrames.length === 0) return this.snapshot();
		let t = this.replayFrames.findIndex((t) => t.emittedAt >= e);
		return this.replayIndex = t === -1 ? this.replayFrames.length - 1 : Math.max(0, t), this.replayState = {
			...this.replayState,
			cursor: this.replayFrames[this.replayIndex]?.emittedAt ?? e
		}, this.publishReplayFrame(), this.scheduleReplay(), this.snapshot();
	}
	replayStop() {
		return this.stopReplay(), this.engine.setHealth(this.health()), this.broadcast(this.latestLiveSnapshot), this.snapshot();
	}
	close() {
		this.stopReplay(), this.unsubscribe?.(), this.unsubscribe = null, this.worker?.postMessage({ type: "stop" }), this.worker?.terminate().catch(() => void 0), this.worker = null, this.engine.stop();
	}
	ensureEngine() {
		this.engine.getSnapshot().status.running || (this.engine.start({
			simulate: !1,
			external: !0
		}), this.engine.setHealth(this.health()));
	}
	ensureAsset(e) {
		if (!e || this.knownSymbols.has(e)) return;
		let t = at(e, { enablePublicCrypto: this.enablePublicWs });
		this.engine.addAsset(t, t.defaultPrice), this.seedPrices[t.symbol] = t.defaultPrice, this.knownSymbols.add(t.symbol), this.worker?.postMessage({
			type: "addAsset",
			asset: t,
			seedPrice: t.defaultPrice
		});
	}
	startWorker(e) {
		if (this.worker) {
			this.worker.postMessage({
				type: "start",
				connectorId: e
			});
			return;
		}
		this.healthState = {
			...this.health(),
			activeConnectorId: e,
			ingestionStatus: "connecting",
			workerStatus: "starting"
		}, this.engine.setHealth(this.healthState);
		let t = new c(n(Pt, "marketIngestionWorker.js"), { workerData: {
			assets: this.universe,
			seedPrices: this.seedPrices,
			attentionTargets: [...new Set([
				...this.universe.map((e) => e.symbol),
				"AIXR",
				"LIT"
			])],
			enablePublicWs: this.enablePublicWs,
			connectorId: e,
			sqliteMode: this.persistence.mode,
			syncIntervalMs: 100
		} });
		this.worker = t, t.on("message", (e) => this.handleWorkerMessage(e)), t.on("error", (e) => {
			this.healthState = {
				...this.health(),
				ingestionStatus: "failed",
				workerStatus: "failed"
			}, this.audit("connector_failed", "error", `Ingestion worker failed: ${e.message}`), this.engine.setHealth(this.health());
		}), t.on("exit", (e) => {
			this.worker = null, this.healthState = {
				...this.health(),
				ingestionStatus: e === 0 ? "stopped" : "failed",
				workerStatus: e === 0 ? "stopped" : "failed"
			}, e !== 0 && this.audit("connector_failed", "error", `Ingestion worker exited with code ${e}`), this.engine.setHealth(this.health());
		}), t.postMessage({
			type: "start",
			connectorId: e
		});
	}
	handleWorkerMessage(e) {
		if (e.type === "batch") {
			this.healthState = this.mergeHealth(e.health);
			for (let t of e.audits) this.safePersist(() => this.persistence.audit(t));
			for (let t of e.ticks) this.engine.ingest(t);
			for (let t of e.attention) this.engine.ingestAttention(t);
			this.persistSampledBatch(e.ticks, e.attention), this.engine.setHealth(this.health());
			return;
		}
		this.healthState = this.mergeHealth(e.health), this.engine.setHealth(this.health());
	}
	mergeHealth(e) {
		return {
			...e,
			sqliteMode: this.persistence.mode,
			replay: this.replayState,
			liquidityHistory: this.liquidityHistoryHealth()
		};
	}
	ensureBroadcast() {
		this.unsubscribe ||= this.engine.subscribe((e) => this.handleEngineSnapshot(e));
	}
	handleEngineSnapshot(e) {
		if (!e.frame) {
			this.latestLiveSnapshot = {
				...e,
				status: {
					...e.status,
					health: this.health()
				}
			}, this.replayState.active || this.broadcast(this.latestLiveSnapshot);
			return;
		}
		let t = St(e.frame, this.previousLiveFrame), n = {
			...this.health(),
			lastFrameTimestamp: e.frame.emittedAt
		};
		this.healthState = n;
		let r = {
			...e.status,
			sqliteMode: this.persistence.mode,
			health: n,
			mode: n.sourceTrust === "simulated" ? "simulated" : "live",
			connectedFeeds: [n.activeConnectorId],
			reconnectingFeeds: n.ingestionStatus === "reconnecting" ? [n.activeConnectorId] : []
		}, i = {
			...e.frame,
			signals: t,
			status: r
		};
		this.previousLiveFrame = i, this.latestLiveSnapshot = {
			frame: i,
			status: r
		}, this.persistSignals(t), this.persistSampledFrame(i), this.replayState.active || this.broadcast(this.latestLiveSnapshot);
	}
	persistSampledBatch(e, t) {
		let n = Date.now();
		for (let t of this.liquiditySampler.select(e, n)) {
			let e = new Date(t.timestamp).toISOString().slice(0, 10);
			this.safePersist(() => this.persistence.saveMarketTick({
				id: `tick:${t.symbol}:${t.timestamp}`,
				symbol: t.symbol,
				price: t.price,
				volume: t.volume,
				source: t.source,
				observedAt: t.timestamp,
				tradeDate: e
			})) && (this.persistedMarketTickCount += 1, this.persistedMarketSymbols.add(t.symbol.toUpperCase()), this.lastMarketPersistAt = Math.max(this.lastMarketPersistAt ?? 0, t.timestamp));
		}
		if (!(n - this.lastAttentionPersistAt < 1e3)) {
			this.lastAttentionPersistAt = n;
			for (let e of t.slice(0, 24)) this.safePersist(() => this.persistence.saveAttentionBatch({
				id: `attention:${e.target}:${e.timestamp}`,
				target: e.target,
				pressure: e.pressure,
				mentionVelocity: e.mentionVelocity,
				sentimentDivergenceIndex: e.sentimentDivergenceIndex,
				source: e.source,
				observedAt: e.timestamp,
				sampleCount: 1
			}));
		}
	}
	persistSampledFrame(e) {
		e.emittedAt - this.lastFramePersistAt < 1e3 || (this.lastFramePersistAt = e.emittedAt, this.safePersist(() => this.persistence.saveRealtimeFrame({
			id: `frame:${e.emittedAt}:${e.sequence}`,
			sequence: e.sequence,
			emittedAt: e.emittedAt,
			frame: e
		})), e.emittedAt - this.lastFrameAuditAt >= 1e3 && (this.lastFrameAuditAt = e.emittedAt, this.audit("frame_published", "info", `Realtime frame ${e.sequence} published`, {
			sequence: e.sequence,
			assetCount: e.assets.length,
			attentionCount: e.attention.length
		})));
	}
	liquidityHistoryHealth() {
		let e = this.liquiditySampler.snapshot();
		return {
			persistedTicks: this.persistedMarketTickCount,
			persistedSymbols: this.persistedMarketSymbols.size,
			lastPersistedAt: this.lastMarketPersistAt,
			sampleMs: e.sampleMs,
			maxPerBatch: e.maxPerBatch,
			note: "Sampled liquidity history written to market_ticks_daily. One tick per symbol per interval; raw firehose remains in memory."
		};
	}
	persistSignals(e) {
		for (let t of e) this.seenSignalIds.has(t.id) || (this.seenSignalIds.add(t.id), this.safePersist(() => this.persistence.saveSignalEvent(t)), this.audit("signal_generated", t.severity === "critical" ? "watch" : "info", t.explanation, {
			signalId: t.id,
			type: t.type,
			assetOrTopicId: t.assetOrTopicId
		}));
	}
	publishReplayFrame() {
		let e = this.replayFrames[this.replayIndex];
		if (!e) {
			let e = {
				...this.latestLiveSnapshot.status,
				mode: "replay",
				health: this.health()
			};
			this.replaySnapshot = {
				frame: this.latestLiveSnapshot.frame,
				status: e
			}, this.broadcast(this.replaySnapshot);
			return;
		}
		let t = {
			...this.health(),
			replay: {
				...this.replayState,
				cursor: e.emittedAt,
				frameCount: this.replayFrames.length
			}
		};
		this.replayState = t.replay;
		let n = {
			...e.frame.status,
			running: !0,
			mode: "replay",
			sqliteMode: this.persistence.mode,
			health: t
		}, r = {
			...e.frame,
			status: n,
			signals: e.frame.signals ?? []
		};
		this.replaySnapshot = {
			frame: r,
			status: n
		}, this.broadcast(this.replaySnapshot);
	}
	scheduleReplay() {
		if (this.clearReplayTimer(), !this.replayState.active || !this.replayState.playing || this.replayFrames.length <= 1) return;
		let e = this.replayFrames[this.replayIndex], t = this.replayFrames[this.replayIndex + 1];
		if (!e || !t) {
			this.replayState = {
				...this.replayState,
				playing: !1
			}, this.publishReplayFrame();
			return;
		}
		let n = Math.max(40, Math.min(1e3, (t.emittedAt - e.emittedAt) / this.replayState.speed));
		this.replayTimer = setTimeout(() => {
			this.replayIndex = Math.min(this.replayIndex + 1, this.replayFrames.length - 1), this.publishReplayFrame(), this.scheduleReplay();
		}, n);
	}
	stopReplay() {
		this.clearReplayTimer(), this.replayFrames = [], this.replayIndex = 0, this.replaySnapshot = null, this.replayState = {
			active: !1,
			playing: !1,
			speed: this.replayState.speed,
			frameCount: 0
		};
	}
	clearReplayTimer() {
		this.replayTimer &&= (clearTimeout(this.replayTimer), null);
	}
	broadcast(e) {
		for (let t of Nt.getAllWindows()) t.isDestroyed() || t.webContents.send("atlasz:realtime:frame", e);
	}
	audit(e, t, n, r) {
		this.safePersist(() => this.persistence.audit({
			id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
			eventType: e,
			connectorId: this.healthState.activeConnectorId,
			severity: t,
			message: n,
			createdAt: Date.now(),
			metadata: r
		}));
	}
	safePersist(e) {
		try {
			return e(), !0;
		} catch (e) {
			console.warn("[atlasz] realtime persistence failed:", e instanceof Error ? e.message : e);
			try {
				this.persistence.audit({
					id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
					eventType: "persistence_failed",
					connectorId: this.healthState.activeConnectorId,
					severity: "error",
					message: e instanceof Error ? e.message : String(e),
					createdAt: Date.now(),
					metadata: {}
				});
			} catch {}
			return !1;
		}
	}
};
function zt(e, t) {
	let n = [
		{
			id: "public_market_rest",
			label: "Public market REST (Yahoo + CoinGecko)",
			assetClasses: [
				"crypto",
				"equity",
				"etf",
				"commodity",
				"index",
				"forex",
				"sector"
			],
			requiresAuth: !1,
			status: e === "public_market_rest" ? "stopped" : "idle",
			reconnectCount: 0,
			sourceTrust: "public unauthenticated",
			packetsPerSecond: 0,
			droppedPackets: 0
		},
		{
			id: "coingecko_public_rest",
			label: "CoinGecko public REST",
			assetClasses: ["crypto"],
			requiresAuth: !1,
			status: e === "coingecko_public_rest" ? "stopped" : "idle",
			reconnectCount: 0,
			sourceTrust: "public unauthenticated",
			packetsPerSecond: 0,
			droppedPackets: 0
		},
		{
			id: "coincap_public_ws",
			label: "CoinCap public WebSocket",
			assetClasses: ["crypto"],
			requiresAuth: !1,
			status: e === "coincap_public_ws" ? "stopped" : "idle",
			reconnectCount: 0,
			sourceTrust: "public unauthenticated",
			packetsPerSecond: 0,
			droppedPackets: 0
		},
		{
			id: "binance_public_ws",
			label: "Binance public trades",
			assetClasses: ["crypto"],
			requiresAuth: !1,
			status: "idle",
			reconnectCount: 0,
			sourceTrust: "public unauthenticated",
			packetsPerSecond: 0,
			droppedPackets: 0
		},
		{
			id: "coinbase_public_ws",
			label: "Coinbase public ticker",
			assetClasses: ["crypto"],
			requiresAuth: !1,
			status: "idle",
			reconnectCount: 0,
			sourceTrust: "public unauthenticated",
			packetsPerSecond: 0,
			droppedPackets: 0
		},
		{
			id: "alpaca_iex_placeholder",
			label: "Alpaca IEX placeholder",
			assetClasses: ["equity", "etf"],
			requiresAuth: !0,
			status: "idle",
			reconnectCount: 0,
			sourceTrust: "auth-gated",
			packetsPerSecond: 0,
			droppedPackets: 0
		}
	];
	return It && n.push({
		id: "simulated",
		label: "Local simulator (dev/test only)",
		assetClasses: [
			"crypto",
			"equity",
			"etf",
			"commodity",
			"index",
			"forex",
			"sector"
		],
		requiresAuth: !1,
		status: e === "simulated" ? "stopped" : "idle",
		reconnectCount: 0,
		sourceTrust: "simulated",
		packetsPerSecond: 0,
		droppedPackets: 0
	}), {
		activeConnectorId: e,
		ingestionStatus: "stopped",
		packetsPerSecond: 0,
		framesPerSecond: 0,
		droppedPackets: 0,
		reconnectCount: 0,
		sqliteMode: t,
		sourceTrust: e === "simulated" ? "simulated" : "public unauthenticated",
		workerStatus: "stopped",
		connectors: n,
		replay: {
			active: !1,
			playing: !1,
			speed: 1,
			frameCount: 0
		},
		liquidityHistory: {
			persistedTicks: 0,
			persistedSymbols: 0,
			sampleMs: 1e3,
			maxPerBatch: 96,
			note: "Sampled liquidity history has not started."
		}
	};
}
function Bt(e, t) {
	let n = Number(process.env[e]);
	return Number.isInteger(n) && n > 0 ? n : t;
}
//#endregion
//#region src/worldIntel.ts
var Vt = [
	{
		id: "red-sea",
		label: "Shipping and Red Sea route risk",
		category: "Trade route",
		region: "Middle East",
		severity: "elevated",
		keywords: [
			"red sea",
			"suez",
			"houthi",
			"shipping",
			"freight",
			"tanker",
			"route",
			"vessel"
		],
		entities: [
			"Red Sea",
			"Shipping Risk",
			"WTI Crude",
			"Freight",
			"Airlines"
		],
		markets: [
			"CL",
			"XLE",
			"GLD",
			"DAL",
			"UAL"
		],
		riskChannels: [
			"Freight cost",
			"Oil premium",
			"Inflation risk",
			"Airline margins"
		],
		narrative: "Public coverage is clustering around shipping route friction and energy-sensitive exposure.",
		uncertainty: "Public unauthenticated news coverage is not direct proof of supply disruption or market causality.",
		watchNext: [
			"Primary shipping notices",
			"Freight and insurance language",
			"WTI/XLE breadth"
		]
	},
	{
		id: "taiwan",
		label: "Taiwan and semiconductor concentration",
		category: "Geopolitics",
		region: "Asia Pacific",
		severity: "critical",
		keywords: [
			"taiwan",
			"tsmc",
			"semiconductor",
			"chip",
			"chips",
			"export control",
			"advanced node"
		],
		entities: [
			"Taiwan",
			"TSMC",
			"Semiconductors",
			"Nvidia",
			"Apple",
			"Nasdaq 100"
		],
		markets: [
			"TSM",
			"SOXX",
			"NVDA",
			"AAPL",
			"QQQ"
		],
		riskChannels: [
			"Supply-chain concentration",
			"Export controls",
			"AI hardware availability"
		],
		narrative: "Fresh public coverage maps into semiconductor concentration and advanced-node supply-chain exposure.",
		uncertainty: "Coverage can reflect commentary or positioning without confirming a new policy or security event.",
		watchNext: [
			"Primary policy language",
			"SOXX breadth",
			"TSMC/Nvidia supplier mentions"
		]
	},
	{
		id: "rare-earths",
		label: "Rare earth and strategic input policy",
		category: "Industrial policy",
		region: "China",
		severity: "elevated",
		keywords: [
			"rare earth",
			"rare earths",
			"lithium",
			"battery",
			"magnet",
			"ev supply",
			"critical minerals"
		],
		entities: [
			"China",
			"Rare Earths",
			"Lithium",
			"EV Supply Chain",
			"Defense Electronics"
		],
		markets: [
			"TSLA",
			"LIT",
			"XAR",
			"GM"
		],
		riskChannels: [
			"Input scarcity",
			"Policy retaliation",
			"Strategic inventory rebuild"
		],
		narrative: "Public coverage is touching strategic inputs that can flow into EV, battery, and defense supply chains.",
		uncertainty: "The connector only observes public article metadata; formal rule text or primary filings still need verification.",
		watchNext: [
			"Policy documents",
			"Battery material pricing",
			"Defense electronics language"
		]
	},
	{
		id: "central-bank",
		label: "Rates, inflation, and central bank language",
		category: "Macro",
		region: "Global Macro",
		severity: "watch",
		keywords: [
			"central bank",
			"federal reserve",
			"fed",
			"inflation",
			"rates",
			"rate cut",
			"bond yield",
			"real yield"
		],
		entities: [
			"Federal Reserve",
			"Inflation",
			"Real Yields",
			"Gold",
			"Bitcoin",
			"Nasdaq 100"
		],
		markets: [
			"QQQ",
			"TLT",
			"GLD",
			"BTC"
		],
		riskChannels: [
			"Discount rates",
			"Liquidity expectations",
			"Dollar pressure"
		],
		narrative: "Coverage is touching rate-sensitive assets through inflation, real-yield, and liquidity language.",
		uncertainty: "Macro headlines are often indirect and should not be read as a single-cause market signal.",
		watchNext: [
			"Central bank transcripts",
			"Real yields",
			"Dollar and gold confirmation"
		]
	},
	{
		id: "trade-policy",
		label: "Tariffs, sanctions, and trade policy",
		category: "Trade policy",
		region: "Global",
		severity: "elevated",
		keywords: [
			"tariff",
			"tariffs",
			"sanction",
			"sanctions",
			"export ban",
			"trade restriction",
			"trade war"
		],
		entities: [
			"Tariffs",
			"Sanctions",
			"Trade Policy",
			"Supply Chains",
			"China",
			"United States"
		],
		markets: [
			"QQQ",
			"AAPL",
			"SOXX",
			"XLI"
		],
		riskChannels: [
			"Margin pressure",
			"Supply-chain rerouting",
			"Policy retaliation"
		],
		narrative: "Public coverage is clustering around trade-policy restrictions and supply-chain exposure.",
		uncertainty: "Article metadata alone does not confirm implementation details, exemptions, or timing.",
		watchNext: [
			"Official notices",
			"Affected sector lists",
			"Company guidance language"
		]
	},
	{
		id: "europe-energy",
		label: "European energy security",
		category: "Energy security",
		region: "Europe",
		severity: "watch",
		keywords: [
			"europe gas",
			"natural gas",
			"lng",
			"pipeline",
			"gas storage",
			"energy security",
			"ukraine energy"
		],
		entities: [
			"Europe",
			"Natural Gas",
			"LNG",
			"Industrial Margins",
			"Chemicals"
		],
		markets: [
			"UNG",
			"VGK",
			"XLB"
		],
		riskChannels: [
			"Energy cost",
			"Manufacturing margin",
			"Weather volatility"
		],
		narrative: "Coverage maps into European energy buffers, industrial costs, and weather or pipeline sensitivity.",
		uncertainty: "Storage and weather context require primary data confirmation before assigning stronger severity.",
		watchNext: [
			"Storage data",
			"Pipeline notices",
			"Industrial margin commentary"
		]
	}
];
function Ht(e) {
	let t = e.worldEvents.length > 0 ? e.worldEvents : e.headlines.map((t) => Jt(t, {
		sourceId: e.connectorId,
		provenance: Qt(e.sourceTrust)
	})), n = Gt(t, e.sourceTrust);
	return {
		...e,
		worldEvents: t,
		countries: e.countries.length > 0 ? e.countries : Yt(t),
		assetIdentities: e.assetIdentities.length > 0 ? e.assetIdentities : Xt(t),
		...n
	};
}
function Ut(e, t) {
	let n = e.map((e) => Kt(e)).filter((e) => e !== null);
	if (n.length === 0) return Wt();
	let r = [...cn(n, (e) => e.topic.id).values()].map((e) => $t(e, t));
	return {
		events: r,
		signals: r.map((e) => en(e, t)),
		dailyBrief: r.slice(0, 4).map((e) => tn(e, t)),
		rawSourceItems: n.slice(0, 25).map((e) => an(e))
	};
}
function Wt() {
	return {
		events: [],
		signals: [],
		dailyBrief: [],
		rawSourceItems: []
	};
}
function Gt(e, t) {
	return Ut(e.map((e) => ({
		id: e.id,
		title: e.title,
		source: e.sourceId,
		url: e.sourceUrl ?? "",
		sector: String(e.category),
		impact: `${e.summary} ${e.extractedEntities.join(" ")} ${e.narrativeTags.join(" ")}`,
		observedAt: e.timestamp
	})), t);
}
function Kt(e) {
	let t = `${e.title} ${e.sector} ${e.impact}`.toLowerCase(), n = null;
	for (let e of Vt) {
		let r = e.keywords.filter((e) => t.includes(e));
		r.length !== 0 && (!n || r.length > n.matchedKeywords.length) && (n = {
			topic: e,
			matchedKeywords: r
		});
	}
	return n ? {
		...e,
		topic: n.topic,
		matchedKeywords: n.matchedKeywords
	} : null;
}
function qt(e) {
	let t = Kt({
		id: "classification-probe",
		title: e,
		source: "classification",
		url: "",
		sector: "",
		impact: "",
		observedAt: Date.now()
	});
	return t ? {
		sector: t.topic.category,
		impact: `${t.topic.label}; matched ${t.matchedKeywords.join(", ")}`
	} : {
		sector: "World news",
		impact: "Public headline retained without a strong Atlasz keyword/entity mapping."
	};
}
function Jt(e, t = {}) {
	let n = Kt(e), r = n?.topic, i = n?.matchedKeywords ?? [], a = `${e.title} ${e.sector} ${e.impact}`, o = fn(a, r?.region), s = r?.region ?? pn(o), c = mn(o, s), l = hn(r?.category ?? e.sector), u = F([...r?.markets ?? [], ...bn(a)]).slice(0, 16), d = vn(a, r?.entities ?? []), f = yn(o, a), p = F([...r?.entities ?? [], ...i.map(Cn)]).slice(0, 18), m = F([
		r?.label ?? (e.sector || "World news"),
		...r?.riskChannels ?? [],
		...i.map(Cn)
	]).slice(0, 12), h = ln(`${e.title}|${e.source}|${e.url}|${e.observedAt}`);
	return {
		id: e.id,
		timestamp: e.observedAt,
		title: e.title,
		summary: e.impact || r?.narrative || "Public world event retained without a stronger local mapping.",
		countryCodes: o,
		region: s,
		lat: c?.lat,
		lon: c?.lon,
		category: l,
		severity: r?.severity ?? gn(a),
		confidence: on(Math.max(1, i.length), t.provenance ?? "public-unauthenticated"),
		sourceId: t.sourceId ?? wn(e.source),
		sourceUrl: e.url,
		provenance: t.provenance ?? "public-unauthenticated",
		affectedAssets: u,
		affectedSectors: _n(a, r?.category),
		affectedCommodities: d,
		affectedCurrencies: f,
		extractedEntities: p,
		narrativeTags: m,
		rawPayloadHash: h,
		dedupeHash: ln(`${e.title.toLowerCase()}|${o.join(",")}|${l}`)
	};
}
function Yt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) for (let e of n.countryCodes.length > 0 ? n.countryCodes : ["GLOBAL"]) t.set(e, [...t.get(e) ?? [], n]);
	return [...t.entries()].map(([e, t]) => {
		let n = un[e] ?? un.GLOBAL, r = Math.max(...t.map((e) => e.timestamp)), i = t.reduce((e, t) => e + Tn(t.severity), 0), a = F(t.flatMap((e) => e.affectedAssets)).slice(0, 12), o = En();
		for (let e of t) o[e.provenance] = (o[e.provenance] ?? 0) + 1;
		return {
			countryCode: e,
			countryName: n.name,
			flag: n.flag,
			currentEventCount: t.length,
			macroSnapshot: {
				note: "Macro series not available from current public sources in Phase 1.",
				provenance: "local-derived"
			},
			currency: n.currency,
			equityProxies: n.equityProxies,
			majorCommodities: F([...n.commodities, ...t.flatMap((e) => e.affectedCommodities)]).slice(0, 8),
			riskScore: Math.min(100, Math.round(18 + i * 10 + t.length * 4)),
			narrativeAcceleration: Math.min(100, Math.round(t.length * 12 + i * 4)),
			topCurrentHeadlines: t.sort((e, t) => t.timestamp - e.timestamp).slice(0, 4).map((e) => e.title),
			affectedTickers: a,
			lastUpdated: r,
			provenanceBreakdown: o
		};
	}).sort((e, t) => t.riskScore - e.riskScore);
}
function Xt(e) {
	return F(e.flatMap((e) => e.affectedAssets)).slice(0, 80).map((t) => Zt(t, {
		relatedCountries: F(e.filter((e) => e.affectedAssets.includes(t)).flatMap((e) => e.countryCodes)),
		relatedSectors: F(e.filter((e) => e.affectedAssets.includes(t)).flatMap((e) => e.affectedSectors)),
		provenanceCoverage: F(e.filter((e) => e.affectedAssets.includes(t)).map((e) => e.provenance))
	}));
}
function Zt(e, t = {}) {
	let n = e.toUpperCase(), r = dn[n], i = r?.type ?? xn(n);
	return {
		symbol: n,
		name: r?.name ?? `${n} watchlist asset`,
		type: i,
		exchangeOrSource: r?.exchangeOrSource ?? (i === "crypto" ? "public crypto mapping" : "configured universe identity"),
		iconUrl: r?.iconUrl,
		fallbackIcon: r?.fallbackIcon ?? Sn(n, i),
		favorite: t.favorite ?? !1,
		watchlistTags: r?.watchlistTags ?? [i.toLowerCase()],
		aliases: F([n, ...r?.aliases ?? []]),
		relatedCountries: t.relatedCountries ?? r?.relatedCountries ?? [],
		relatedSectors: t.relatedSectors ?? r?.relatedSectors ?? [],
		dataAvailabilityStatus: r?.dataAvailabilityStatus ?? "not available from current public sources; DATA_UNAVAILABLE until a real provider is configured",
		provenanceCoverage: t.provenanceCoverage ?? r?.provenanceCoverage ?? ["local-derived"]
	};
}
function Qt(e) {
	return e === "public unauthenticated" ? "public-unauthenticated" : e === "local derived" || e === "stale" || e === "failed" || e === "unavailable" ? "local-derived" : e;
}
function $t(e, t) {
	let n = e[0].topic, r = Math.max(...e.map((e) => e.observedAt)), i = e.slice(0, 5).map((e) => nn(e, t)), a = rn(n, e.length, t);
	return {
		id: n.id,
		time: sn(r),
		category: n.category,
		region: n.region,
		severity: n.severity,
		confidence: on(e.length, t),
		sourceCount: e.length,
		title: `${n.label} appears in public coverage`,
		summary: `${n.narrative} Latest matched headline: ${e[0].title}`,
		relationshipReason: `Keyword/entity evidence matched ${F(e.flatMap((e) => e.matchedKeywords)).join(", ")} and maps to ${n.markets.join(", ")}.`,
		uncertainty: n.uncertainty,
		detectedEntities: n.entities,
		linkedMarkets: n.markets,
		riskChannels: n.riskChannels,
		evidenceNotes: a,
		sourceTrail: i
	};
}
function en(e, t) {
	return {
		id: `world-${e.id}`,
		title: `${e.title} · source-backed watch`,
		explanation: `${e.relationshipReason} This is local derived routing from public unauthenticated headline metadata, not a prediction or recommendation.`,
		status: e.severity,
		confidence: Math.max(45, e.confidence - 4),
		timeframe: "Today",
		chain: `${e.region} -> ${e.category} -> ${e.riskChannels[0] ?? "Risk channel"} -> ${e.linkedMarkets[0] ?? "Watchlist"}`,
		linkedEventIds: [e.id],
		linkedEntities: e.detectedEntities,
		linkedMarkets: e.linkedMarkets,
		repeatedThemes: e.riskChannels,
		relationshipStrength: Math.min(88, 42 + e.sourceCount * 8),
		sourceCount: e.sourceCount,
		recencyScore: 76,
		uncertainty: t === "public unauthenticated" ? e.uncertainty : "Derived from cached or local world context.",
		evidenceTrail: e.evidenceNotes,
		sourceTrail: e.sourceTrail
	};
}
function tn(e, t) {
	return {
		id: `brief-${e.id}`,
		headline: e.title,
		whyItMatters: e.relationshipReason,
		severity: e.severity,
		relatedEntities: e.detectedEntities,
		relatedMarkets: e.linkedMarkets,
		confidence: e.confidence,
		sourceCount: e.sourceCount,
		uncertainty: t === "public unauthenticated" ? "Public unauthenticated article metadata can be stale, duplicated, or incomplete; verify with primary sources." : e.uncertainty,
		watchNext: [
			"Confirm through primary or official sources",
			"Watch whether coverage broadens across independent outlets",
			...e.riskChannels.slice(0, 2)
		],
		evidenceTrail: e.evidenceNotes,
		sourceTrail: e.sourceTrail
	};
}
function nn(e, t) {
	return {
		id: `src-${e.id}`,
		sourceName: e.source,
		sourceType: "news",
		sourceUrl: e.url,
		title: e.title,
		observedAt: new Date(e.observedAt).toISOString(),
		publishedAt: new Date(e.observedAt).toISOString(),
		note: `${t}; matched ${e.matchedKeywords.join(", ")} for ${e.topic.label}.`
	};
}
function rn(e, t, n) {
	return [
		{
			id: `ev-${e.id}-public-source-count`,
			note: `${t} public headline${t === 1 ? "" : "s"} matched the ${e.label} routing rule.`,
			supports: "Recency and source-count relevance",
			confidenceImpact: t > 1 ? "raises" : "neutral"
		},
		{
			id: `ev-${e.id}-keyword-map`,
			note: `Matched keywords are routed locally into ${e.entities.slice(0, 4).join(", ")} and ${e.markets.join(", ")}.`,
			supports: "Entity, sector, and market linkage",
			confidenceImpact: "neutral"
		},
		{
			id: `ev-${e.id}-trust-boundary`,
			note: n === "public unauthenticated" ? "GDELT article metadata is public and unauthenticated inside Atlasz; it is evidence of coverage, not verification of claims." : `Source trust is ${n}.`,
			supports: "Uncertainty and source-trust boundary",
			confidenceImpact: "limits"
		}
	];
}
function an(e) {
	return {
		id: `raw-${e.id}`,
		connector: "gdelt-doc-public",
		sourceName: e.source,
		sourceUrl: e.url,
		rawTitle: e.title,
		rawExcerpt: `${e.topic.label}; matched ${e.matchedKeywords.join(", ")}`,
		ingestedAt: new Date(Date.now()).toISOString(),
		publishedAt: new Date(e.observedAt).toISOString(),
		normalizedEventId: e.topic.id
	};
}
function on(e, t) {
	let n = t === "verified" ? 0 : t === "official-api" ? 4 : t === "public unauthenticated" || t === "public-unauthenticated" || t === "rss-public" ? 8 : t === "stale" ? 18 : 12;
	return Math.min(72, Math.max(48, 45 + e * 7 - n));
}
function sn(e) {
	return new Date(e).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function cn(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = t(r);
		n.set(e, [...n.get(e) ?? [], r]);
	}
	return n;
}
function F(e) {
	return [...new Set(e)];
}
function ln(e) {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) t = t * 31 + e.charCodeAt(n) >>> 0;
	return `world-${t.toString(36)}`;
}
var un = {
	GLOBAL: {
		name: "Global",
		flag: "GL",
		region: "Global",
		currency: "DXY",
		lat: 10,
		lon: 0,
		equityProxies: [
			"SPY",
			"QQQ",
			"ACWI"
		],
		commodities: ["Oil", "Gold"],
		keywords: [
			"global",
			"world",
			"central bank",
			"inflation"
		]
	},
	US: {
		name: "United States",
		flag: "US",
		region: "North America",
		currency: "USD",
		lat: 38,
		lon: -97,
		equityProxies: [
			"SPY",
			"QQQ",
			"IWM"
		],
		commodities: ["Oil", "Natural Gas"],
		keywords: [
			"united states",
			"u.s.",
			"us ",
			"america",
			"federal reserve",
			"fed"
		]
	},
	CN: {
		name: "China",
		flag: "CN",
		region: "Asia Pacific",
		currency: "CNY",
		lat: 35,
		lon: 103,
		equityProxies: ["FXI", "MCHI"],
		commodities: [
			"Copper",
			"Rare Earths",
			"Oil"
		],
		keywords: [
			"china",
			"beijing",
			"chinese",
			"tariff",
			"rare earth"
		]
	},
	TW: {
		name: "Taiwan",
		flag: "TW",
		region: "Asia Pacific",
		currency: "TWD",
		lat: 23.7,
		lon: 121,
		equityProxies: [
			"EWT",
			"TSM",
			"SOXX"
		],
		commodities: ["Semiconductors"],
		keywords: [
			"taiwan",
			"taipei",
			"tsmc"
		]
	},
	JP: {
		name: "Japan",
		flag: "JP",
		region: "Asia Pacific",
		currency: "JPY",
		lat: 36,
		lon: 138,
		equityProxies: ["EWJ", "DXJ"],
		commodities: ["LNG"],
		keywords: [
			"japan",
			"tokyo",
			"yen",
			"boj",
			"bank of japan"
		]
	},
	EU: {
		name: "European Union",
		flag: "EU",
		region: "Europe",
		currency: "EUR",
		lat: 50,
		lon: 10,
		equityProxies: ["VGK", "FEZ"],
		commodities: ["Natural Gas", "Power"],
		keywords: [
			"europe",
			"european union",
			"ecb",
			"eurozone",
			"brussels"
		]
	},
	DE: {
		name: "Germany",
		flag: "DE",
		region: "Europe",
		currency: "EUR",
		lat: 51,
		lon: 10,
		equityProxies: ["EWG"],
		commodities: ["Natural Gas", "Industrial Power"],
		keywords: [
			"germany",
			"berlin",
			"german"
		]
	},
	GB: {
		name: "United Kingdom",
		flag: "GB",
		region: "Europe",
		currency: "GBP",
		lat: 54,
		lon: -2,
		equityProxies: ["EWU"],
		commodities: ["Natural Gas"],
		keywords: [
			"united kingdom",
			"uk ",
			"britain",
			"london",
			"boe"
		]
	},
	RU: {
		name: "Russia",
		flag: "RU",
		region: "Europe",
		currency: "RUB",
		lat: 60,
		lon: 90,
		equityProxies: ["Energy proxies"],
		commodities: [
			"Oil",
			"Natural Gas",
			"Uranium"
		],
		keywords: [
			"russia",
			"moscow",
			"russian",
			"ukraine"
		]
	},
	UA: {
		name: "Ukraine",
		flag: "UA",
		region: "Europe",
		currency: "UAH",
		lat: 49,
		lon: 32,
		equityProxies: ["Wheat", "Europe risk"],
		commodities: ["Wheat", "Natural Gas"],
		keywords: [
			"ukraine",
			"kyiv",
			"black sea"
		]
	},
	SA: {
		name: "Saudi Arabia",
		flag: "SA",
		region: "Middle East",
		currency: "SAR",
		lat: 24,
		lon: 45,
		equityProxies: ["Oil proxies"],
		commodities: ["Oil"],
		keywords: [
			"saudi",
			"riyadh",
			"opec"
		]
	},
	IR: {
		name: "Iran",
		flag: "IR",
		region: "Middle East",
		currency: "IRR",
		lat: 32,
		lon: 53,
		equityProxies: ["Oil risk"],
		commodities: ["Oil"],
		keywords: [
			"iran",
			"tehran",
			"hormuz"
		]
	},
	YE: {
		name: "Yemen / Red Sea corridor",
		flag: "YE",
		region: "Middle East",
		currency: "Route risk",
		lat: 15,
		lon: 43,
		equityProxies: [
			"XLE",
			"ZIM",
			"DAL"
		],
		commodities: ["Oil", "Freight"],
		keywords: [
			"red sea",
			"suez",
			"houthi",
			"yemen"
		]
	},
	BR: {
		name: "Brazil",
		flag: "BR",
		region: "Latin America",
		currency: "BRL",
		lat: -10,
		lon: -55,
		equityProxies: ["EWZ"],
		commodities: [
			"Iron Ore",
			"Soybeans",
			"Oil"
		],
		keywords: [
			"brazil",
			"brasilia",
			"real "
		]
	},
	CA: {
		name: "Canada",
		flag: "CA",
		region: "North America",
		currency: "CAD",
		lat: 56,
		lon: -106,
		equityProxies: ["EWC"],
		commodities: [
			"Oil",
			"Uranium",
			"Gold"
		],
		keywords: [
			"canada",
			"ottawa",
			"canadian",
			"bank of canada"
		]
	},
	NO: {
		name: "Norway",
		flag: "NO",
		region: "Europe",
		currency: "NOK",
		lat: 61,
		lon: 8,
		equityProxies: ["Energy proxies"],
		commodities: ["Oil", "Natural Gas"],
		keywords: [
			"norway",
			"norwegian",
			"norges bank"
		]
	}
}, dn = {
	BTC: {
		name: "Bitcoin",
		type: "crypto",
		exchangeOrSource: "CoinGecko/CoinCap/Coinbase public capable",
		fallbackIcon: "BTC",
		watchlistTags: ["crypto", "liquidity"],
		aliases: ["Bitcoin", "XBT"],
		dataAvailabilityStatus: "public unauthenticated crypto feeds when a real connector returns data; no fallback price",
		provenanceCoverage: ["public-unauthenticated"]
	},
	ETH: {
		name: "Ethereum",
		type: "crypto",
		exchangeOrSource: "CoinGecko/CoinCap/Coinbase public capable",
		fallbackIcon: "ETH",
		watchlistTags: ["crypto"],
		aliases: ["Ethereum"],
		dataAvailabilityStatus: "public unauthenticated crypto feeds when a real connector returns data; no fallback price",
		provenanceCoverage: ["public-unauthenticated"]
	},
	KAS: {
		name: "Kaspa",
		type: "crypto",
		exchangeOrSource: "CoinGecko public REST mapping; CoinCap/Coinbase product-dependent",
		fallbackIcon: "KAS",
		watchlistTags: ["crypto", "watchlist"],
		aliases: [
			"Kaspa",
			"KASUSDT",
			"KAS-USD",
			"KAS/USD",
			"KAS/USDT"
		],
		dataAvailabilityStatus: "public unauthenticated crypto mapping; PRICE_UNAVAILABLE until a configured provider returns KAS data",
		provenanceCoverage: ["public-unauthenticated"]
	},
	SPY: {
		name: "SPDR S&P 500 ETF",
		type: "ETF",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "SPY"
	},
	QQQ: {
		name: "Invesco QQQ Trust",
		type: "ETF",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "QQQ"
	},
	SOXX: {
		name: "iShares Semiconductor ETF",
		type: "ETF",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "SOX"
	},
	SMH: {
		name: "VanEck Semiconductor ETF",
		type: "ETF",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "SMH"
	},
	XLE: {
		name: "Energy Select Sector SPDR",
		type: "ETF",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "XLE"
	},
	XLK: {
		name: "Technology Select Sector SPDR",
		type: "sector",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "XLK"
	},
	GLD: {
		name: "SPDR Gold Shares",
		type: "commodity",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "Au"
	},
	CL: {
		name: "WTI Crude proxy",
		type: "commodity",
		exchangeOrSource: "local commodity proxy",
		fallbackIcon: "WTI"
	},
	USO: {
		name: "United States Oil Fund",
		type: "commodity",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "USO"
	},
	DXY: {
		name: "US Dollar Index",
		type: "index",
		exchangeOrSource: "local macro proxy",
		fallbackIcon: "DXY"
	},
	NVDA: {
		name: "Nvidia",
		type: "equity",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "NV"
	},
	AMD: {
		name: "Advanced Micro Devices",
		type: "equity",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "AMD"
	},
	TSM: {
		name: "Taiwan Semiconductor Manufacturing",
		type: "equity",
		exchangeOrSource: "NYSE ADR",
		fallbackIcon: "TSM"
	},
	AAPL: {
		name: "Apple",
		type: "equity",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "APL"
	},
	TSLA: {
		name: "Tesla",
		type: "equity",
		exchangeOrSource: "Nasdaq",
		fallbackIcon: "TSL"
	},
	ZIM: {
		name: "ZIM Integrated Shipping",
		type: "equity",
		exchangeOrSource: "NYSE",
		fallbackIcon: "ZIM"
	},
	VLO: {
		name: "Valero Energy",
		type: "equity",
		exchangeOrSource: "NYSE",
		fallbackIcon: "VLO"
	},
	MP: {
		name: "MP Materials",
		type: "equity",
		exchangeOrSource: "NYSE",
		fallbackIcon: "MP"
	},
	REMX: {
		name: "VanEck Rare Earth/Strategic Metals ETF",
		type: "ETF",
		exchangeOrSource: "NYSE Arca",
		fallbackIcon: "RE"
	}
};
function fn(e, t) {
	let n = ` ${e.toLowerCase()} `, r = Object.entries(un).filter(([e]) => e !== "GLOBAL").filter(([, e]) => e.keywords.some((e) => n.includes(` ${e.toLowerCase()} `) || n.includes(e.toLowerCase()))).map(([e]) => e);
	return r.length > 0 ? F(r).slice(0, 4) : ["GLOBAL"];
}
function pn(e) {
	return un[e[0] ?? "GLOBAL"]?.region ?? "Global";
}
function mn(e, t) {
	let n = un[e[0] ?? "GLOBAL"];
	return n ? {
		lat: n.lat,
		lon: n.lon
	} : {
		"Asia Pacific": {
			lat: 25,
			lon: 120
		},
		Europe: {
			lat: 50,
			lon: 10
		},
		"Middle East": {
			lat: 25,
			lon: 45
		},
		"North America": {
			lat: 39,
			lon: -98
		},
		Global: {
			lat: 10,
			lon: 0
		}
	}[t] ?? null;
}
function hn(e) {
	let t = e.toLowerCase();
	return t.includes("trade") || t.includes("geopolitic") || t.includes("policy") ? "geopolitics" : t.includes("macro") || t.includes("rate") || t.includes("inflation") ? "macro" : t.includes("energy") || t.includes("commodity") ? "commodities" : t.includes("shipping") || t.includes("route") || t.includes("infrastructure") ? "infrastructure" : t.includes("market") ? "markets" : "other";
}
function gn(e) {
	let t = e.toLowerCase();
	return /(war|attack|missile|invasion|emergency|shutdown|crisis)/.test(t) ? "critical" : /(sanction|tariff|shortage|delay|strike|ban|restriction|disruption)/.test(t) ? "elevated" : (/(watch|monitor|could|may|risk|concern)/.test(t), "watch");
}
function _n(e, t) {
	let n = e.toLowerCase(), r = [];
	return /(semiconductor|chip|gpu|ai|data center)/.test(n) && r.push("Semiconductors", "Technology"), /(oil|gas|lng|pipeline|energy|opec)/.test(n) && r.push("Energy"), /(shipping|freight|port|suez|red sea)/.test(n) && r.push("Shipping", "Transportation"), /(tariff|trade|export|import)/.test(n) && r.push("Industrials", "Consumer goods"), /(rare earth|lithium|battery|copper|uranium)/.test(n) && r.push("Materials", "Defense"), t && r.push(t), F(r).slice(0, 8);
}
function vn(e, t) {
	let n = `${e} ${t.join(" ")}`.toLowerCase(), r = [];
	return /(oil|crude|wti|brent|opec)/.test(n) && r.push("Oil"), /(natural gas|lng|pipeline|gas storage)/.test(n) && r.push("Natural Gas"), /(gold|real yield)/.test(n) && r.push("Gold"), /(copper|power grid|data center)/.test(n) && r.push("Copper"), /(rare earth|magnet|critical mineral)/.test(n) && r.push("Rare Earths"), /(lithium|battery)/.test(n) && r.push("Lithium"), /(uranium|nuclear)/.test(n) && r.push("Uranium"), F(r);
}
function yn(e, t) {
	let n = e.map((e) => un[e]?.currency).filter((e) => !!e), r = t.toLowerCase();
	return /(dollar|fed|federal reserve|dxy)/.test(r) && n.push("USD", "DXY"), /(euro|ecb|eurozone)/.test(r) && n.push("EUR"), /(yen|boj|japan)/.test(r) && n.push("JPY"), F(n).slice(0, 6);
}
function bn(e) {
	return (e.match(/\b[A-Z]{2,5}\b/g) ?? []).filter((e) => ![
		"THE",
		"AND",
		"FOR",
		"WITH",
		"FROM",
		"THIS"
	].includes(e)).slice(0, 10);
}
function xn(e) {
	return [
		"BTC",
		"ETH",
		"SOL",
		"KAS",
		"AVAX",
		"LINK"
	].includes(e) ? "crypto" : [
		"EUR/USD",
		"USD/JPY",
		"GBP/USD",
		"DXY"
	].includes(e) ? "FX" : [
		"CL",
		"WTI",
		"USO",
		"GLD",
		"XAUUSD",
		"COPPER",
		"UNG"
	].includes(e) ? "commodity" : [
		"SPX",
		"NDX",
		"DJI",
		"RUT",
		"VIX",
		"DXY"
	].includes(e) ? "index" : e.startsWith("XL") ? "sector" : [
		"SPY",
		"QQQ",
		"SOXX",
		"SMH",
		"FXI",
		"REMX",
		"LIT",
		"XAR",
		"TLT",
		"VGK"
	].includes(e) ? "ETF" : "equity";
}
function Sn(e, t) {
	return t === "country" ? e.slice(0, 2) : t === "crypto" ? e.slice(0, 4) : e.replace(/[^A-Z]/g, "").slice(0, 3) || t.slice(0, 2).toUpperCase();
}
function Cn(e) {
	return e.split(/\s+/).filter(Boolean).map((e) => `${e.charAt(0).toUpperCase()}${e.slice(1)}`).join(" ");
}
function wn(e) {
	return e.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "public_world_source";
}
function Tn(e) {
	return e === "critical" ? 4 : e === "elevated" ? 2.4 : e === "watch" ? 1.2 : .4;
}
function En() {
	return {
		live: 0,
		delayed: 0,
		"stale-cache": 0,
		"offline-cache": 0,
		unavailable: 0,
		"public-unauthenticated": 0,
		"public-disclosure": 0,
		"official-api": 0,
		"rss-public": 0,
		"local-derived": 0,
		"local-computed": 0,
		"math-derived": 0,
		"local-model": 0,
		"model-inferred": 0,
		"auth-gated": 0,
		verified: 0,
		simulated: 0
	};
}
//#endregion
//#region electron/assetIdentityService.ts
var Dn = class {
	persistence;
	constructor(e) {
		this.persistence = e;
	}
	list() {
		let e = new Set(this.persistence.listFavorites().map((e) => e.targetId));
		return this.persistence.listAssetIdentities().map((t) => ({
			...t,
			favorite: e.has(t.symbol) || t.favorite
		}));
	}
	ensureForEvents(e) {
		let t = new Map(this.list().map((e) => [e.symbol, e])), n = [...new Set(e.flatMap((e) => e.affectedAssets))], r = [];
		for (let i of n) {
			let n = e.filter((e) => e.affectedAssets.includes(i)), a = t.get(i) ?? Zt(i, {
				relatedCountries: [...new Set(n.flatMap((e) => e.countryCodes))],
				relatedSectors: [...new Set(n.flatMap((e) => e.affectedSectors))],
				provenanceCoverage: [...new Set(n.map((e) => e.provenance))]
			});
			this.persistence.saveAssetIdentity(a), r.push(a);
		}
		return this.list().length > 0 ? this.list() : r;
	}
	toggleFavorite(e, t, n) {
		let r = `${e}:${t}`;
		return this.persistence.listFavorites().find((e) => e.id === r) ? (this.persistence.deleteFavorite(r), this.persistence.listFavorites()) : (this.persistence.saveFavorite({
			id: r,
			kind: e,
			targetId: t,
			label: n,
			createdAt: Date.now()
		}), this.persistence.listFavorites());
	}
}, On = [
	"live",
	"delayed",
	"stale-cache",
	"offline-cache",
	"unavailable",
	"public-unauthenticated",
	"public-disclosure",
	"official-api",
	"rss-public",
	"local-derived",
	"local-computed",
	"math-derived",
	"local-model",
	"model-inferred",
	"auth-gated",
	"verified",
	"simulated"
], kn = [
	"world-news",
	"osint",
	"macro",
	"filings",
	"public-disclosure",
	"market-data",
	"crypto-realtime",
	"equities",
	"microstructure",
	"vector-memory"
], An = new Set([
	"rss",
	"custom-json",
	"gdelt"
]), jn = [
	{
		providerId: "gdelt_doc_public",
		providerName: "GDELT DOC public news/events",
		category: "world-news",
		adapter: "gdelt",
		enabled: !0,
		endpoint: "https://api.gdeltproject.org/api/v2/doc/doc",
		authType: "none",
		pollIntervalMs: 5 * 6e4,
		rateLimitGuardMs: 2e4,
		timeoutMs: 12e3,
		provenance: "public-unauthenticated",
		legalSafetyNote: "Documented public GDELT API; public unauthenticated article metadata, not verification."
	},
	{
		providerId: "sec_edgar_public",
		providerName: "SEC EDGAR company submissions (8-K/10-Q/10-K)",
		category: "filings",
		adapter: "sec-edgar",
		enabled: !0,
		endpoint: "https://data.sec.gov/submissions/CIK0000320193.json",
		authType: "env",
		envKey: "ATLASZ_SEC_USER_AGENT",
		pollIntervalMs: 10 * 6e4,
		rateLimitGuardMs: 6e4,
		timeoutMs: 15e3,
		provenance: "public-disclosure",
		legalSafetyNote: "Official SEC EDGAR company submissions JSON. Requires a contactable User-Agent; fail-closed without one. No login, scraping, or simulated filings."
	},
	{
		providerId: "macro_calendar_fred",
		providerName: "FRED official macro series",
		category: "macro",
		adapter: "fred-macro",
		enabled: !0,
		endpoint: "https://api.stlouisfed.org/fred/series/observations",
		authType: "api-key",
		envKey: "ATLASZ_FRED_API_KEY",
		pollIntervalMs: 60 * 6e4,
		rateLimitGuardMs: 12e4,
		timeoutMs: 2e4,
		provenance: "official-api",
		legalSafetyNote: "Official FRED API for allowlisted macro series. API key from env only; fail-closed without it. Missing observations are skipped."
	},
	{
		providerId: "treasury_fiscal_public",
		providerName: "U.S. Treasury Fiscal Data (Debt to the Penny)",
		category: "macro",
		adapter: "treasury-fiscal",
		enabled: !0,
		endpoint: "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 15e3,
		maxRetries: 0,
		backoffMs: 1e3,
		provenance: "official-api",
		legalSafetyNote: "Official Treasury Fiscal Data API (no auth) for Debt to the Penny. Fiscal context only; no simulated debt data or market predictions."
	},
	{
		providerId: "bls_public",
		providerName: "U.S. Bureau of Labor Statistics (BLS macro series)",
		category: "macro",
		adapter: "bls",
		enabled: !0,
		endpoint: "https://api.bls.gov/publicAPI/v2/timeseries/data/",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 2e4,
		provenance: "official-api",
		legalSafetyNote: "Official BLS Public Data API v2 (public; optional registration key only raises rate limits and is sent in the request body, never persisted). Macro labor/price series; no predictions, no tickers inferred."
	},
	{
		providerId: "bea_public",
		providerName: "U.S. Bureau of Economic Analysis (BEA NIPA GDP)",
		category: "macro",
		adapter: "bea",
		enabled: !0,
		endpoint: "https://apps.bea.gov/api/data?method=GetData&DataSetName=NIPA&TableName=T10101&Frequency=Q&Year=X&ResultFormat=JSON",
		authType: "api-key",
		envKey: "ATLASZ_BEA_API_KEY",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 2e4,
		maxRetries: 2,
		backoffMs: 1e3,
		provenance: "official-api",
		legalSafetyNote: "Official BEA API for NIPA GDP table T10101. Requires ATLASZ_BEA_API_KEY; fail-closed without it. The UserID key is never persisted in source trails."
	},
	{
		providerId: "eia_energy_public",
		providerName: "U.S. EIA official energy series",
		category: "macro",
		adapter: "eia-energy",
		enabled: !0,
		endpoint: "https://api.eia.gov/v2/seriesid/PET.RWTC.D?length=1",
		authType: "api-key",
		envKey: "ATLASZ_EIA_API_KEY",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 2e4,
		maxRetries: 2,
		backoffMs: 1e3,
		provenance: "official-api",
		legalSafetyNote: "Official EIA Open Data API for allowlisted energy/commodity series. Requires ATLASZ_EIA_API_KEY; fail-closed without it. The api_key is never persisted in source trails."
	},
	{
		providerId: "cisa_kev_public",
		providerName: "CISA Known Exploited Vulnerabilities catalog",
		category: "public-disclosure",
		adapter: "cisa-kev",
		enabled: !0,
		endpoint: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 2e4,
		provenance: "official-api",
		legalSafetyNote: "Official CISA KEV public catalog JSON (no auth). Confirmed actively-exploited CVEs; per-record source trail to NIST NVD. Public defensive-security data, not financial advice; no tickers are inferred."
	},
	{
		providerId: "nvd_cve_public",
		providerName: "NIST NVD CVE vulnerability intelligence",
		category: "public-disclosure",
		adapter: "nvd-cve",
		enabled: !0,
		endpoint: "https://services.nvd.nist.gov/rest/json/cves/2.0",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official NIST NVD 2.0 API (public; optional API key only raises rate limits and is sent as a header, never persisted). Defensive vulnerability intelligence only: no scanning, exploitation, payloads, or active target collection. Cross-links to CISA KEV by CVE ID. No tickers inferred."
	},
	{
		providerId: "github_ghsa_public",
		providerName: "GitHub Security Advisories (GHSA)",
		category: "public-disclosure",
		adapter: "github-ghsa",
		enabled: !0,
		endpoint: "https://api.github.com/advisories",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official GitHub REST global advisory database (public; optional token only raises rate limits and is sent as an Authorization header, never persisted). Reviewed advisories only; cross-links to CVE/NVD/CISA KEV. No repo scraping, no person data, no exploitation logic. No tickers inferred."
	},
	{
		providerId: "osv_dev_public",
		providerName: "OSV.dev open-source vulnerabilities",
		category: "public-disclosure",
		adapter: "osv-dev",
		enabled: !0,
		endpoint: "https://api.osv.dev/v1/query",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official OSV.dev public API. Open-source package vulnerability context cross-linked to CVE/GHSA via aliases. No scanning, exploit logic, payloads, or private package/repo collection. No tickers inferred."
	},
	{
		providerId: "cisa_advisories_public",
		providerName: "CISA cybersecurity / ICS advisories",
		category: "public-disclosure",
		adapter: "cisa-advisories",
		enabled: !0,
		endpoint: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official CISA advisories public RSS feed. Defensive advisory intelligence cross-linked to CVEs. No scanning, exploit logic, payloads, or person enrichment. No tickers inferred."
	},
	{
		providerId: "github_releases_public",
		providerName: "GitHub Releases (open-source technology layer)",
		category: "public-disclosure",
		adapter: "github-releases",
		enabled: !0,
		endpoint: "https://api.github.com/repos/{owner}/{repo}/releases",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official GitHub REST releases API for a configured public-repo allowlist. Optional token only raises rate limits and is sent as an Authorization header, never persisted. No fake activity, no person enrichment (release author not collected). No tickers inferred."
	},
	{
		providerId: "politician_disclosure_public",
		providerName: "Public official financial disclosures (delayed)",
		category: "public-disclosure",
		adapter: "public-disclosure-json",
		enabled: !0,
		authType: "env",
		envKey: "ATLASZ_POLITICIAN_DISCLOSURE_URL",
		pollIntervalMs: 30 * 6e4,
		rateLimitGuardMs: 6e4,
		timeoutMs: 15e3,
		provenance: "public-disclosure",
		legalSafetyNote: "Configured public/open-civic disclosure provider only. Delayed disclosures, not real-time data. Fail-closed without a provider."
	},
	Mn("rss_public_radar", "RSS public finance/geopolitics feeds", "world-news", "rss-public"),
	Mn("public_market_rest", "Public market REST (Yahoo + CoinGecko)", "market-data", "public-unauthenticated"),
	Mn("yahoo_finance_1m_public", "Yahoo public market bars", "market-data", "public-unauthenticated"),
	Mn("coingecko_public_rest", "CoinGecko public crypto REST", "market-data", "public-unauthenticated"),
	Mn("stocktwits_public_stream", "Stocktwits public symbol streams", "osint", "public-unauthenticated"),
	Mn("polymarket_gamma_public", "Polymarket Gamma public markets", "market-data", "public-unauthenticated"),
	Mn("coinbase_public_ws", "Coinbase public crypto websocket", "crypto-realtime", "public-unauthenticated"),
	Mn("binance_public_ws", "Binance public crypto websocket", "crypto-realtime", "public-unauthenticated"),
	Nn("fed_press_rss", "Federal Reserve press releases", "macro", "https://www.federalreserve.gov/feeds/press_all.xml", "Official Federal Reserve public press RSS (policy/FOMC). Public headlines only; no scraping."),
	Nn("sec_press_rss", "SEC press releases", "filings", "https://www.sec.gov/news/pressreleases.rss", "Official SEC public press RSS. Public headlines only; no scraping."),
	Nn("ecb_press_rss", "ECB press releases", "macro", "https://www.ecb.europa.eu/rss/press.xml", "Official ECB public press RSS (global rates). Public headlines only; no scraping."),
	Nn("wsj_markets_rss", "WSJ Markets headlines", "world-news", "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", "Public market-news RSS headlines only; full articles may be paywalled and are not fetched."),
	{
		providerId: "arxiv_cs_ai",
		providerName: "arXiv AI research (cs.AI)",
		category: "world-news",
		adapter: "rss",
		enabled: !0,
		endpoint: "https://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=20",
		authType: "none",
		pollIntervalMs: 30 * 6e4,
		rateLimitGuardMs: 12e4,
		timeoutMs: 15e3,
		provenance: "official-api",
		legalSafetyNote: "Official arXiv public API (Atom). Research metadata; public."
	},
	Nn("nasa_news", "NASA news releases", "world-news", "https://www.nasa.gov/news-release/feed/", "Official NASA public news RSS. Public headlines only."),
	{
		providerId: "space_launch_library",
		providerName: "Upcoming space launches (Launch Library 2)",
		category: "world-news",
		adapter: "custom-json",
		enabled: !0,
		endpoint: "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=15",
		authType: "none",
		pollIntervalMs: 60 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 15e3,
		provenance: "public-unauthenticated",
		legalSafetyNote: "Public Launch Library 2 API. Public launch schedule; rate-limited."
	},
	{
		providerId: "github_trending_repos",
		providerName: "GitHub high-signal repositories",
		category: "world-news",
		adapter: "custom-json",
		enabled: !0,
		endpoint: "https://api.github.com/search/repositories?q=stars:%3E5000&sort=stars&order=desc&per_page=15",
		authType: "none",
		pollIntervalMs: 60 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 15e3,
		provenance: "official-api",
		legalSafetyNote: "Official GitHub public Search API (unauthenticated, rate-limited). Public repo metadata."
	},
	{
		providerId: "usgs_significant_quakes",
		providerName: "USGS significant earthquakes",
		category: "world-news",
		adapter: "usgs-quakes",
		enabled: !0,
		endpoint: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
		authType: "none",
		pollIntervalMs: 30 * 6e4,
		rateLimitGuardMs: 12e4,
		timeoutMs: 15e3,
		provenance: "official-api",
		legalSafetyNote: "Official USGS public earthquake GeoJSON feed. Public natural-event data."
	},
	{
		providerId: "noaa_alerts_public",
		providerName: "NOAA / NWS active weather alerts",
		category: "world-news",
		adapter: "noaa-alerts",
		enabled: !0,
		endpoint: "https://api.weather.gov/alerts/active",
		authType: "none",
		pollIntervalMs: 15 * 6e4,
		rateLimitGuardMs: 12e4,
		timeoutMs: 2e4,
		provenance: "official-api",
		legalSafetyNote: "Official NWS public alerts API (no auth; descriptive User-Agent). Real alerts only; severity/urgency/certainty from NWS, never inflated. No model forecasts."
	},
	{
		providerId: "federal_register_public",
		providerName: "Federal Register public documents",
		category: "public-disclosure",
		adapter: "federal-register",
		enabled: !0,
		endpoint: "https://www.federalregister.gov/api/v1/documents.json",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 2e4,
		provenance: "official-api",
		legalSafetyNote: "Official FederalRegister.gov documents API (no auth). Regulatory document metadata only; source trails preserve Federal Register URLs and govinfo PDF links when present. No invented exposure mapping or legal interpretation."
	},
	{
		providerId: "ofac_sdn_public",
		providerName: "Treasury OFAC SDN sanctions list",
		category: "public-disclosure",
		adapter: "ofac-sdn",
		enabled: !0,
		endpoint: "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML",
		authType: "none",
		pollIntervalMs: 360 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official Treasury OFAC Sanctions List Service SDN XML export (no auth). List evidence only: no sanctions screening, fuzzy matching, inferred guilt/risk labels, person enrichment, or ticker exposure."
	},
	{
		providerId: "uspto_patentsview_public",
		providerName: "USPTO patents (PatentsView)",
		category: "public-disclosure",
		adapter: "uspto-patents",
		enabled: !0,
		endpoint: "https://search.patentsview.org/api/v1/patent/",
		authType: "api-key",
		envKey: "ATLASZ_PATENTSVIEW_API_KEY",
		pollIntervalMs: 720 * 6e4,
		rateLimitGuardMs: 3e5,
		timeoutMs: 25e3,
		provenance: "official-api",
		legalSafetyNote: "Official USPTO-funded PatentsView API. API key from env only (X-Api-Key header; never persisted); fail-closed without it. Assignee organizations + classifications only — no inventor/person data. No fake patents; no inferred ownership."
	},
	{
		providerId: "x_explore_placeholder",
		providerName: "X/Twitter Explore placeholder",
		category: "osint",
		adapter: "disabled",
		enabled: !1,
		endpoint: "disabled",
		authType: "bearer-token",
		envKey: "ATLASZ_X_AUTH_TOKEN",
		provenance: "auth-gated",
		legalSafetyNote: "Disabled scaffold only. No login, CAPTCHA, paywall, or anti-bot bypass behavior is implemented."
	}
];
function Mn(e, t, n, r) {
	return {
		providerId: e,
		providerName: t,
		category: n,
		adapter: "managed-ingest",
		enabled: !0,
		endpoint: "managed by existing Atlasz ingestion service",
		authType: "none",
		provenance: r,
		legalSafetyNote: "Registered source boundary only; ingestion is handled by the existing fail-closed connector."
	};
}
function Nn(e, t, n, r, i) {
	return {
		providerId: e,
		providerName: t,
		category: n,
		adapter: "rss",
		enabled: !0,
		endpoint: r,
		authType: "none",
		pollIntervalMs: 10 * 6e4,
		rateLimitGuardMs: 6e4,
		timeoutMs: 15e3,
		provenance: "rss-public",
		legalSafetyNote: i
	};
}
function Pn(e = {}) {
	let t = e.includeBuiltins ?? !0 ? jn.map((e) => ({ ...e })) : [], n = [], r = e.configPath ?? null;
	if (r && i(r)) try {
		let e = JSON.parse(o(r, "utf8")), i = Array.isArray(e) ? e : Array.isArray(e.providers) ? e.providers : [], a = new Set(t.map((e) => e.providerId));
		for (let e of i) {
			let r = Ln(e);
			if ("error" in r) {
				n.push(r.error);
				continue;
			}
			if (a.has(r.provider.providerId)) {
				n.push(`Duplicate providerId ignored: ${r.provider.providerId}`);
				continue;
			}
			a.add(r.provider.providerId), t.push(r.provider);
		}
	} catch (e) {
		n.push(`Failed to parse ${r}: ${e instanceof Error ? e.message : String(e)}`);
	}
	return {
		providers: t,
		errors: n,
		configPath: r
	};
}
function Fn(e, t = process.env) {
	return e.adapter === "disabled" ? !1 : e.authType === "none" ? !0 : !!(e.envKey && I(t[e.envKey]));
}
function In(e) {
	if (!Fn(e)) return e.adapter === "disabled" ? "Disabled scaffold — no public adapter available." : e.envKey ? `Set ${e.envKey} to enable this provider.` : "Provider requires configuration.";
}
function Ln(e) {
	if (!e || typeof e != "object") return { error: "Provider entry is not an object." };
	let t = e, n = I(t.providerId), r = I(t.providerName), i = I(t.category), a = I(t.adapter), o = I(t.provenance), s = I(t.authType) || "none";
	if (!n) return { error: "Custom provider missing providerId." };
	if (!r) return { error: `Provider ${n} missing providerName.` };
	if (!kn.includes(i)) return { error: `Provider ${n} has invalid category "${i}".` };
	if (!An.has(a)) return { error: `Provider ${n} uses unsupported/unsafe adapter "${a}".` };
	if (!On.includes(o)) return { error: `Provider ${n} has invalid provenance "${o}".` };
	let c = I(t.endpoint);
	return (a === "rss" || a === "custom-json" || a === "gdelt") && !/^https?:\/\//i.test(c) ? { error: `Provider ${n} requires a public http(s) endpoint.` } : { provider: {
		providerId: n,
		providerName: r,
		category: i,
		adapter: a,
		enabled: t.enabled !== !1,
		endpoint: c,
		authType: [
			"none",
			"api-key",
			"bearer-token",
			"env"
		].includes(s) ? s : "none",
		envKey: I(t.envKey) || void 0,
		pollIntervalMs: Rn(t.pollIntervalMs),
		rateLimitGuardMs: Rn(t.rateLimitGuardMs),
		timeoutMs: Rn(t.timeoutMs),
		maxRetries: Rn(t.maxRetries),
		backoffMs: Rn(t.backoffMs),
		provenance: o,
		supportedSymbols: Array.isArray(t.supportedSymbols) ? t.supportedSymbols.map((e) => String(e)).filter(Boolean) : void 0,
		legalSafetyNote: I(t.legalSafetyNote) || "User-provided public feed; normalized honestly.",
		custom: !0
	} };
}
function I(e) {
	return typeof e == "string" ? e.trim() : "";
}
function Rn(e) {
	let t = Number(e);
	return Number.isInteger(t) && t >= 0 ? t : void 0;
}
//#endregion
//#region electron/providers/builtinProviderCatalog.ts
var zn = {
	gdelt_doc_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["news", "geopolitics"],
		supportedRegions: ["global"]
	},
	sec_edgar_public: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_SEC_USER_AGENT"],
		supportedEventTypes: ["filing"],
		supportedRegions: ["US"]
	},
	macro_calendar_fred: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_FRED_API_KEY"],
		supportedEventTypes: ["macro-event"],
		supportedRegions: ["US"]
	},
	treasury_fiscal_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["fiscal-event"],
		supportedRegions: ["US"]
	},
	bls_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["macro-event"],
		supportedRegions: ["US"]
	},
	bea_public: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_BEA_API_KEY"],
		supportedEventTypes: ["macro-event"],
		supportedRegions: ["US"]
	},
	eia_energy_public: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_EIA_API_KEY"],
		supportedEventTypes: ["energy-event"],
		supportedRegions: ["US"]
	},
	politician_disclosure_public: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_POLITICIAN_DISCLOSURE_URL"],
		supportedEventTypes: ["public-disclosure"],
		supportedRegions: ["US"]
	},
	rss_public_radar: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["news"]
	},
	public_market_rest: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		realtimeFeedType: "REST"
	},
	yahoo_finance_1m_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		realtimeFeedType: "REST"
	},
	coingecko_public_rest: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		realtimeFeedType: "REST"
	},
	stocktwits_public_stream: {
		feedTypes: ["REST"],
		envKeysRequired: []
	},
	polymarket_gamma_public: {
		feedTypes: ["REST"],
		envKeysRequired: []
	},
	coinbase_public_ws: {
		feedTypes: ["WebSocket", "REST"],
		envKeysRequired: [],
		symbolDiscovery: "coinbase",
		realtimeFeedType: "WebSocket"
	},
	binance_public_ws: {
		feedTypes: ["WebSocket", "REST"],
		envKeysRequired: [],
		symbolDiscovery: "binance",
		realtimeFeedType: "WebSocket"
	},
	x_explore_placeholder: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_X_AUTH_TOKEN"]
	},
	fed_press_rss: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["macro-event", "news"],
		supportedRegions: ["US"]
	},
	sec_press_rss: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["filing", "news"],
		supportedRegions: ["US"]
	},
	ecb_press_rss: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["macro-event", "news"],
		supportedRegions: ["EU"]
	},
	wsj_markets_rss: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["news"],
		supportedRegions: ["global"]
	},
	arxiv_cs_ai: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["research", "ai"],
		supportedRegions: ["global"]
	},
	nasa_news: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["space", "science"],
		supportedRegions: ["global"]
	},
	space_launch_library: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["space", "launch"],
		supportedRegions: ["global"]
	},
	github_trending_repos: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["tech", "ai"],
		supportedRegions: ["global"]
	},
	usgs_significant_quakes: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["natural-disaster", "seismic"],
		supportedRegions: ["global"]
	},
	noaa_alerts_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["weather-alert"],
		supportedRegions: ["US"]
	},
	federal_register_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: [
			"regulatory-document",
			"rule",
			"notice",
			"proposed-rule"
		],
		supportedRegions: ["US"]
	},
	ofac_sdn_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["sanctions-record", "sdn-list"],
		supportedRegions: ["global"]
	},
	uspto_patentsview_public: {
		feedTypes: ["REST"],
		envKeysRequired: ["ATLASZ_PATENTSVIEW_API_KEY"],
		supportedEventTypes: ["patent"],
		supportedRegions: ["US"]
	},
	cisa_kev_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["cyber-advisory"],
		supportedRegions: ["global"]
	},
	nvd_cve_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["cyber-advisory"],
		supportedRegions: ["global"]
	},
	github_ghsa_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["cyber-advisory"],
		supportedRegions: ["global"]
	},
	osv_dev_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["cyber-advisory"],
		supportedRegions: ["global"]
	},
	cisa_advisories_public: {
		feedTypes: ["RSS"],
		envKeysRequired: [],
		supportedEventTypes: ["cyber-advisory"],
		supportedRegions: ["global"]
	},
	github_releases_public: {
		feedTypes: ["REST"],
		envKeysRequired: [],
		supportedEventTypes: ["open-source-release"],
		supportedRegions: ["global"]
	}
}, Bn = [
	{
		id: "local_sqlite_wal",
		name: "Local SQLite (WAL) persistence",
		kind: "sqlite",
		note: "Local-first durable store; JSON fallback if SQLite is unavailable."
	},
	{
		id: "local_vector_memory",
		name: "Vector memory (historical precedent)",
		kind: "vector-memory",
		note: "Local-computed lexical embeddings for precedent matching; not a neural model."
	},
	{
		id: "local_ollama",
		name: "Local Ollama cognitive parser",
		kind: "ollama",
		enableEnvKey: "ATLASZ_ENABLE_OLLAMA",
		endpointEnvKey: "ATLASZ_OLLAMA_ENDPOINT",
		defaultEndpoint: "http://localhost:11434",
		note: "Optional local model; model-inferred outputs only, never verified. Disabled unless explicitly enabled."
	}
];
function Vn(e) {
	return zn[e] ?? {
		feedTypes: ["REST"],
		envKeysRequired: []
	};
}
//#endregion
//#region electron/osint/adapters/gdeltAdapter.ts
var Hn = "https://api.gdeltproject.org/api/v2/doc/doc", Un = [
	"\"Red Sea\"",
	"semiconductor",
	"Taiwan",
	"tariffs",
	"sanctions",
	"\"rare earth\"",
	"\"central bank\"",
	"inflation",
	"\"natural gas\"",
	"oil",
	"\"data center\"",
	"copper",
	"uranium"
].join(" OR ");
async function Wn(e) {
	let t = new URL(Hn);
	t.searchParams.set("query", Un), t.searchParams.set("mode", "ArtList"), t.searchParams.set("format", "json"), t.searchParams.set("maxrecords", "50"), t.searchParams.set("sort", "DateDesc");
	let n = await fetch(t, {
		signal: e,
		headers: {
			accept: "application/json",
			"user-agent": "AtlaszIntel/0.4 local-first world-intel connector"
		}
	});
	if (!n.ok) throw Error(`GDELT HTTP ${n.status}`);
	let r = await n.text();
	if (!r.trim().startsWith("{")) throw Error(r.trim().slice(0, 160) || "GDELT returned a non-JSON response");
	let i = JSON.parse(r);
	return (Array.isArray(i.articles) ? i.articles : []).map(Gn).filter((e) => e !== null).map((e) => Jt(e, {
		sourceId: "gdelt_doc_public",
		provenance: "public-unauthenticated"
	}));
}
function Gn(e) {
	let t = Kn(e.title), n = Kn(e.url);
	if (!t || !n) return null;
	let r = Kn(e.sourceCommonName) || Kn(e.domain) || "GDELT public source", i = qn(Kn(e.seendate)) ?? Date.now(), a = qt(t);
	return {
		id: Jn(n),
		title: t,
		source: r,
		url: n,
		sector: a.sector,
		impact: a.impact,
		observedAt: i
	};
}
function Kn(e) {
	return typeof e == "string" ? e.trim() : "";
}
function qn(e) {
	if (!/^\d{14}$/.test(e)) return null;
	let t = `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}T${e.slice(8, 10)}:${e.slice(10, 12)}:${e.slice(12, 14)}Z`, n = Date.parse(t);
	return Number.isFinite(n) ? n : null;
}
function Jn(e) {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) t = t * 31 + e.charCodeAt(n) >>> 0;
	return `osint-${t.toString(36)}`;
}
//#endregion
//#region electron/osint/adapters/adapterShared.ts
function L(e) {
	return l("sha256").update(e).digest("hex");
}
function R(e) {
	return [...new Set(e.map((e) => e.trim()).filter((e) => e.length > 0))];
}
function z(e) {
	return typeof e == "string" ? e.trim() : "";
}
function Yn(e) {
	if (typeof e == "number" && Number.isFinite(e)) return e;
	if (typeof e == "string" && e.trim() !== "") {
		let t = Number(e);
		return Number.isFinite(t) ? t : void 0;
	}
}
function Xn(e) {
	if (typeof e == "number" && Number.isFinite(e)) return Math.round(e < 0xe8d4a51000 ? e * 1e3 : e);
	if (typeof e == "string" && e.trim() !== "") {
		let t = Date.parse(e.trim());
		return Number.isFinite(t) ? t : void 0;
	}
}
function B(e) {
	let t = Jt({
		id: e.id,
		title: e.title,
		source: e.source,
		url: e.url,
		sector: e.category,
		impact: e.summary,
		observedAt: e.observedAt
	}, {
		sourceId: e.sourceId,
		provenance: e.provenance
	});
	return {
		...t,
		category: e.category,
		provenance: e.provenance,
		summary: e.summary || t.summary,
		affectedAssets: R(e.affectedAssets ?? []).slice(0, 16),
		narrativeTags: R([...e.narrativeTags ?? [], ...t.narrativeTags]).slice(0, 12),
		extractedEntities: R([...e.extractedEntities ?? [], ...t.extractedEntities]).slice(0, 18),
		rawPayloadHash: L(V(e.rawPayload)),
		dedupeHash: L(e.dedupeKey)
	};
}
function V(e) {
	return JSON.stringify(Zn(e));
}
function Zn(e) {
	return Array.isArray(e) ? e.map(Zn) : e && typeof e == "object" ? Object.keys(e).sort().reduce((t, n) => (t[n] = Zn(e[n]), t), {}) : e;
}
function H(e, t) {
	return `${e}-${L(t).slice(0, 20)}`;
}
//#endregion
//#region electron/osint/fetchPolicy.ts
var Qn = class extends Error {
	status;
	retryAfterMs;
	constructor(e, t, n) {
		super(e), this.name = "HttpError", this.status = t, this.retryAfterMs = n;
	}
};
function U(e, t, n = Date.now()) {
	if (e.ok) return;
	let r = $n(e.headers.get("retry-after"), n);
	throw new Qn(`${t} HTTP ${e.status}`, e.status, r);
}
function $n(e, t = Date.now()) {
	if (!e) return;
	let n = e.trim();
	if (/^\d+$/.test(n)) return Math.max(0, Number(n) * 1e3);
	let r = Date.parse(n);
	if (Number.isFinite(r)) return Math.max(0, r - t);
}
var er = new Set([
	408,
	425,
	429,
	500,
	502,
	503,
	504
]);
function tr(e) {
	return e !== void 0 && er.has(e);
}
function nr(e, t, n = 6e4) {
	return e <= 0 ? 0 : Math.min(n, e * 2 ** t);
}
async function rr(e, t, n = {}) {
	let r = n.sleep ?? ir, i = 0;
	for (;;) {
		let a = new AbortController(), o = t.timeoutMs > 0 ? setTimeout(() => a.abort(), t.timeoutMs) : void 0;
		try {
			return await e(a.signal);
		} catch (e) {
			let a = e instanceof Qn ? e.status : void 0;
			if (i >= t.maxRetries || !tr(a)) throw e;
			let o = (e instanceof Qn ? e.retryAfterMs : void 0) ?? nr(t.backoffMs, i);
			n.onRetry?.({
				attempt: i,
				waitMs: o,
				status: a
			}), i += 1, await r(o);
		} finally {
			o && clearTimeout(o);
		}
	}
}
function ir(e) {
	return new Promise((t) => setTimeout(t, Math.max(0, e)));
}
//#endregion
//#region electron/osint/adapters/secEdgarAdapter.ts
var ar = "sec_edgar_public", or = "SEC EDGAR", sr = "https://data.sec.gov/submissions", cr = "https://www.sec.gov/Archives/edgar/data", lr = [
	"8-K",
	"10-Q",
	"10-K"
], ur = 12, dr = 40, fr = {
	320193: "AAPL",
	789019: "MSFT",
	1045810: "NVDA",
	1318605: "TSLA",
	1018724: "AMZN",
	1652044: "GOOGL",
	1326801: "META"
};
function pr(e = process.env) {
	let t = z(e.ATLASZ_SEC_USER_AGENT);
	if (!t || !/@|https?:\/\//.test(t)) return null;
	let n = z(e.ATLASZ_SEC_FORM_TYPES) ? z(e.ATLASZ_SEC_FORM_TYPES).split(",").map((e) => e.trim().toUpperCase()).filter(Boolean) : lr, r = e.ATLASZ_SEC_INCLUDE_AMENDMENTS !== "0", i = {
		...fr,
		...Tr(e.ATLASZ_SEC_CIK_TICKER_MAP)
	}, a = Er(e.ATLASZ_SEC_COMPANY_CIKS), o = a.length > 0 ? a : Object.keys(i), s = kr(Number(e.ATLASZ_SEC_MAX_FILINGS_PER_COMPANY ?? ur), 1, dr);
	return {
		userAgent: t,
		formTypes: n,
		includeAmendments: r,
		cikTickerMap: i,
		companyCiks: R(o.map(jr)).filter(Boolean),
		maxFilingsPerCompany: s
	};
}
async function mr(e, t = pr()) {
	if (!t || t.companyCiks.length === 0) return [];
	let n = [], r = [];
	for (let i of t.companyCiks) {
		let a = br(i);
		try {
			let r = await fetch(a, {
				signal: e,
				headers: {
					accept: "application/json",
					"user-agent": t.userAgent
				}
			});
			U(r, `SEC EDGAR ${i}`);
			let o = await r.json();
			n.push(...hr(o, {
				config: t,
				sourceJsonUrl: a
			}));
		} catch (e) {
			r.push(e instanceof Error ? e.message : String(e));
		}
	}
	if (n.length === 0 && r.length > 0) throw Error(r[0]);
	return gr(n, t);
}
function hr(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e, r = n.filings?.recent;
	if (!r || typeof r != "object") return [];
	let i = z(n.name), a = jr(z(n.cik)), o = Dr(r.accessionNumber), s = Dr(r.form), c = Dr(r.filingDate), l = Dr(r.reportDate), u = Dr(r.acceptanceDateTime), d = Dr(r.primaryDocument), f = Math.min(o.length, s.length, c.length, t.config?.maxFilingsPerCompany ?? ur), p = Dr(n.tickers).map((e) => e.toUpperCase()), m = (a ? t.config?.cikTickerMap?.[a] : void 0) ?? p[0], h = t.sourceJsonUrl ?? (a ? br(a) : ""), g = t.observedAt ?? Date.now(), _ = [];
	for (let e = 0; e < f; e += 1) {
		let n = s[e]?.toUpperCase().trim() ?? "";
		if (!yr(n, t.config?.formTypes ?? lr, t.config?.includeAmendments ?? !0)) continue;
		let r = o[e] ?? "", f = c[e] ?? "", p = Or(u[e]) ?? Or(f), v = d[e] ?? "", y = xr(a, r, v);
		if (!Cr({
			cik: a,
			companyName: i,
			formType: n,
			accessionNumber: r,
			filingDate: f,
			sourceUrl: y
		})) continue;
		let b = V({
			cik: a,
			companyName: i,
			ticker: m ?? "",
			formType: n,
			accessionNumber: r,
			filingDate: f,
			reportDate: l[e] ?? "",
			acceptanceDateTime: u[e] ?? "",
			primaryDocument: v,
			sourceJsonUrl: h,
			sourceUrl: y
		}), x = L(b);
		_.push({
			id: Sr(r),
			cik: a,
			companyName: i,
			ticker: m ? m.toUpperCase() : void 0,
			formType: n,
			accessionNumber: r,
			filingDate: f,
			reportDate: l[e] || void 0,
			acceptedAt: p,
			observedAt: g,
			primaryDocument: v || void 0,
			sourceUrl: y,
			sourceJsonUrl: h,
			sourceName: or,
			provenance: "public-disclosure",
			confidence: wr({
				cik: a,
				companyName: i,
				formType: n,
				accessionNumber: r,
				filingDate: f,
				sourceUrl: y
			}),
			rawPayloadHash: x,
			rawPayloadJson: b
		});
	}
	return _;
}
function gr(e, t = {}) {
	let n = (t.formTypes ?? lr).map((e) => e.toUpperCase()), r = t.includeAmendments ?? !0, i = t.cikTickerMap ?? {}, a = [];
	for (let t of e) {
		let e = Ar(t) ? t : vr(t, i);
		yr(e.formType, n, r) && (e.confidence < 90 || a.push(_r(e)));
	}
	return a;
}
function _r(e) {
	let t = e.ticker ?? "", n = `sec|${e.accessionNumber}`.toLowerCase(), r = [
		`Official SEC ${e.formType} filing by ${e.companyName} (CIK ${e.cik}).`,
		`Accession ${e.accessionNumber}.`,
		t ? `Linked ticker: ${t}.` : "No local ticker mapping available; kept as an unmapped filing."
	].join(" ");
	return {
		...B({
			id: H(ar, n),
			title: `${e.formType} — ${e.companyName}`,
			summary: r,
			source: or,
			url: e.sourceUrl,
			observedAt: e.acceptedAt ?? Or(e.filingDate) ?? e.observedAt,
			category: "filing",
			provenance: "public-disclosure",
			sourceId: ar,
			dedupeKey: n,
			rawPayload: e,
			affectedAssets: t ? [t] : [],
			narrativeTags: R([
				"SEC filing",
				e.formType,
				"Official public disclosure"
			]),
			extractedEntities: R([
				e.companyName,
				`CIK ${e.cik}`,
				e.accessionNumber
			])
		}),
		confidence: e.confidence,
		secFiling: e
	};
}
function vr(e, t) {
	let n = jr(e.cik), r = t[n], i = new Date(e.filedAt).toISOString().slice(0, 10), a = e.filingUrl, o = V(e);
	return {
		id: Sr(e.accessionNumber),
		cik: n,
		companyName: e.companyName,
		ticker: r,
		formType: e.formType.toUpperCase(),
		accessionNumber: e.accessionNumber,
		filingDate: i,
		acceptedAt: e.filedAt,
		observedAt: e.filedAt,
		sourceUrl: a,
		sourceJsonUrl: n ? br(n) : "",
		sourceName: e.sourceDomain || or,
		provenance: "public-disclosure",
		confidence: wr({
			cik: n,
			companyName: e.companyName,
			formType: e.formType,
			accessionNumber: e.accessionNumber,
			filingDate: i,
			sourceUrl: a
		}),
		rawPayloadHash: L(o),
		rawPayloadJson: o
	};
}
function yr(e, t, n) {
	let r = e.toUpperCase().trim(), i = r.replace(/\/A$/, "");
	return r.endsWith("/A") && !n ? !1 : t.includes(i) || t.includes(r);
}
function br(e) {
	return `${sr}/CIK${Mr(e)}.json`;
}
function xr(e, t, n) {
	let r = jr(e), i = t.replace(/-/g, "");
	return !r || !i ? "" : n ? `${cr}/${r}/${i}/${encodeURIComponent(n)}` : `${cr}/${r}/${i}/${t}-index.html`;
}
function Sr(e) {
	return `${ar}:${e.toLowerCase()}`;
}
function Cr(e) {
	return !!(e.cik && e.companyName && e.formType && e.accessionNumber && /^\d{10}-\d{2}-\d{6}$/.test(e.accessionNumber) && /^\d{4}-\d{2}-\d{2}$/.test(e.filingDate) && /^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//.test(e.sourceUrl));
}
function wr(e) {
	return Cr(e) ? 96 : 62;
}
function Tr(e) {
	let t = z(e);
	if (!t) return {};
	try {
		let e = JSON.parse(t);
		return !e || typeof e != "object" ? {} : Object.fromEntries(Object.entries(e).map(([e, t]) => [jr(e), String(t).toUpperCase()]));
	} catch {
		return {};
	}
}
function Er(e) {
	return z(e).split(",").map(jr).filter(Boolean);
}
function Dr(e) {
	return Array.isArray(e) ? e.map((e) => z(e)).filter(Boolean) : [];
}
function Or(e) {
	let t = z(e);
	if (!t) return;
	let n = /^\d{14}$/.test(t) ? t.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1-$2-$3T$4:$5:$6Z") : /^\d{8}$/.test(t) ? t.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3T00:00:00Z") : t, r = Date.parse(n);
	return Number.isFinite(r) ? r : void 0;
}
function kr(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function Ar(e) {
	return "sourceUrl" in e && "sourceJsonUrl" in e;
}
function jr(e) {
	let t = String(e).replace(/\D/g, "");
	return t ? String(Number(t)) : "";
}
function Mr(e) {
	return jr(e).padStart(10, "0");
}
//#endregion
//#region electron/osint/adapters/macroCalendarAdapter.ts
var Nr = "macro_calendar_fred", Pr = "FRED (Federal Reserve Economic Data)", Fr = "https://api.stlouisfed.org/fred", Ir = "https://fred.stlouisfed.org/series", Lr = 1, Rr = 1200, zr = [
	"DXY",
	"TLT",
	"SPY",
	"QQQ",
	"GLD",
	"BTC"
], Br = [
	"SPY",
	"QQQ",
	"DXY"
], Vr = [
	{
		seriesId: "CPIAUCSL",
		label: "CPI",
		defaultUnits: "index",
		proxies: zr
	},
	{
		seriesId: "UNRATE",
		label: "Unemployment rate",
		defaultUnits: "%",
		proxies: Br
	},
	{
		seriesId: "FEDFUNDS",
		label: "Federal funds rate",
		defaultUnits: "%",
		proxies: zr
	},
	{
		seriesId: "DGS10",
		label: "10-year Treasury yield",
		defaultUnits: "%",
		proxies: zr
	},
	{
		seriesId: "GDP",
		label: "Gross domestic product",
		defaultUnits: "billions of dollars",
		proxies: Br
	},
	{
		seriesId: "PAYEMS",
		label: "Nonfarm payrolls",
		defaultUnits: "thousands",
		proxies: zr
	}
];
function Hr(e = process.env) {
	let t = z(e.ATLASZ_FRED_API_KEY);
	return t ? {
		apiKey: t,
		baseUrl: z(e.ATLASZ_FRED_BASE_URL) || Fr,
		series: ri(e.ATLASZ_FRED_SERIES_IDS) ?? Vr,
		rateLimitMs: Number.isFinite(Number(e.ATLASZ_FRED_RATE_LIMIT_MS)) ? Math.max(0, Number(e.ATLASZ_FRED_RATE_LIMIT_MS)) : Rr
	} : null;
}
async function Ur(e, t = Hr()) {
	if (!t) return [];
	let n = [];
	for (let r of t.series) {
		if (e.aborted) break;
		let i = Wr({
			requestedMeta: r,
			seriesPayload: await Zr(Qr(t.baseUrl, r.seriesId, t.apiKey), e),
			observationsPayload: await Zr($r(t.baseUrl, r.seriesId, t.apiKey, Lr), e),
			retrievedAt: Date.now(),
			sourceApiUrl: ei(t.baseUrl, r.seriesId, Lr)
		});
		i && n.push(i), await ii(t.rateLimitMs, e);
	}
	return Gr(n);
}
function Wr(e) {
	let t = qr(e.seriesPayload, e.requestedMeta), n = Jr(e.observationsPayload);
	if (!t || !n) return null;
	let r = z(n.value), i = Number(r), a = Date.parse(`${n.date}T00:00:00Z`), o = `${Ir}/${t.id}`, s = e.sourceApiUrl ?? ei(Fr, t.id, Lr);
	if (!Yr({
		seriesId: t.id,
		title: t.title,
		observationDate: n.date,
		value: i,
		sourceUrl: o,
		retrievedAt: e.retrievedAt
	})) return null;
	let c = V({
		metadata: t,
		observation: n,
		sourceUrl: o,
		sourceApiUrl: s,
		retrievedAt: e.retrievedAt
	});
	return {
		id: ni(t.id, n.date),
		seriesId: t.id,
		title: t.title,
		units: t.units,
		frequency: t.frequency,
		seasonalAdjustment: t.seasonalAdjustment,
		observationDate: n.date,
		observationTimestamp: a,
		value: i,
		rawValue: r,
		sourceUrl: o,
		sourceApiUrl: s,
		sourceName: Pr,
		retrievedAt: e.retrievedAt,
		provenance: "official-api",
		confidence: Xr({
			seriesId: t.id,
			title: t.title,
			observationDate: n.date,
			value: i,
			sourceUrl: o,
			retrievedAt: e.retrievedAt
		}),
		rawPayloadHash: L(c),
		rawPayloadJson: c
	};
}
function Gr(e) {
	return e.map(Kr);
}
function Kr(e) {
	let t = `fred|${e.seriesId}|${e.observationDate}`.toLowerCase(), n = Vr.find((t) => t.seriesId === e.seriesId)?.proxies ?? zr;
	return {
		...B({
			id: H(Nr, t),
			title: `${e.seriesId} — ${e.title}`,
			summary: `Official FRED observation for ${e.seriesId} (${e.title}) on ${e.observationDate}: ${e.rawValue} ${e.units}. Source: ${e.sourceName}.`,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observationTimestamp,
			category: "macro-event",
			provenance: "official-api",
			sourceId: Nr,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: R(n),
			narrativeTags: R([
				"FRED macro series",
				e.seriesId,
				e.frequency,
				e.seasonalAdjustment
			]),
			extractedEntities: R([
				e.title,
				e.seriesId,
				"United States macro"
			])
		}),
		confidence: e.confidence,
		fredObservation: e
	};
}
function qr(e, t) {
	if (!e || typeof e != "object") return null;
	let n = e.seriess?.[0];
	if (!n || typeof n != "object") return null;
	let r = z(n.id).toUpperCase(), i = z(n.title), a = z(n.units) || t.defaultUnits, o = z(n.frequency) || z(n.frequency_short) || "unknown", s = z(n.seasonal_adjustment) || z(n.seasonal_adjustment_short) || "unknown";
	return !r || r !== t.seriesId || !i ? null : {
		id: r,
		title: i,
		units: a,
		frequency: o,
		seasonalAdjustment: s
	};
}
function Jr(e) {
	if (!e || typeof e != "object") return null;
	let t = e;
	for (let e of t.observations ?? []) {
		let t = z(e.value);
		if (t && t !== "." && Number.isFinite(Number(t))) return e;
	}
	return null;
}
function Yr(e) {
	return !!(e.seriesId && e.title && /^\d{4}-\d{2}-\d{2}$/.test(e.observationDate) && Number.isFinite(e.value) && /^https:\/\/fred\.stlouisfed\.org\/series\/[A-Z0-9_]+$/.test(e.sourceUrl) && Number.isFinite(e.retrievedAt));
}
function Xr(e) {
	return Yr(e) ? 96 : 60;
}
async function Zr(e, t) {
	let n = await fetch(e, {
		signal: t,
		headers: { accept: "application/json" }
	});
	return U(n, "FRED"), await n.json();
}
function Qr(e, t, n) {
	let r = new URL(`${ti(e)}/series`);
	return r.searchParams.set("series_id", t), r.searchParams.set("api_key", n), r.searchParams.set("file_type", "json"), r;
}
function $r(e, t, n, r) {
	let i = new URL(`${ti(e)}/series/observations`);
	return i.searchParams.set("series_id", t), i.searchParams.set("api_key", n), i.searchParams.set("file_type", "json"), i.searchParams.set("sort_order", "desc"), i.searchParams.set("limit", String(r)), i;
}
function ei(e, t, n) {
	let r = new URL(`${ti(e)}/series/observations`);
	return r.searchParams.set("series_id", t), r.searchParams.set("file_type", "json"), r.searchParams.set("sort_order", "desc"), r.searchParams.set("limit", String(n)), r.toString();
}
function ti(e) {
	return e.replace(/\/$/, "");
}
function ni(e, t) {
	return `${Nr}:${e}:${t}`;
}
function ri(e) {
	let t = z(e).split(",").map((e) => e.trim().toUpperCase()).filter(Boolean);
	return t.length === 0 ? null : t.map((e) => Vr.find((t) => t.seriesId === e) ?? {
		seriesId: e,
		label: e,
		defaultUnits: "",
		proxies: zr
	});
}
function ii(e, t) {
	return new Promise((n, r) => {
		if (t.aborted || e <= 0) {
			n();
			return;
		}
		let i = setTimeout(n, e);
		t.addEventListener("abort", () => {
			clearTimeout(i), r(/* @__PURE__ */ Error("FRED macro fetch aborted"));
		}, { once: !0 });
	});
}
//#endregion
//#region electron/osint/adapters/noaaAlertAdapter.ts
var ai = "noaa_alerts_public", oi = "NOAA / National Weather Service", si = "https://api.weather.gov/alerts/active", ci = /^https:\/\/api\.weather\.gov\/alerts\//, li = "Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)", ui = 30, di = 200, fi = 2e4, pi = 2, mi = 1e3, hi = new Set([
	"Extreme",
	"Severe",
	"Moderate",
	"Minor",
	"Unknown"
]), gi = {
	Extreme: 4,
	Severe: 3,
	Moderate: 2,
	Minor: 1,
	Unknown: 0
};
function _i(e = process.env) {
	if (e.ATLASZ_NOAA_DISABLE === "1") return null;
	let t = z(e.ATLASZ_NOAA_ALERTS_URL) || si;
	return /^https:\/\//i.test(t) ? {
		alertsUrl: t,
		userAgent: z(e.ATLASZ_NWS_USER_AGENT) || li,
		maxRecords: ki(Number(e.ATLASZ_NOAA_MAX_RECORDS ?? ui), 1, di),
		timeoutMs: ki(Number(e.ATLASZ_NOAA_TIMEOUT_MS ?? fi), 1e3, 6e4),
		maxRetries: ki(Number(e.ATLASZ_NOAA_MAX_RETRIES ?? pi), 0, 5),
		backoffMs: ki(Number(e.ATLASZ_NOAA_BACKOFF_MS ?? mi), 0, 6e4)
	} : null;
}
async function vi(e, t = _i()) {
	return t ? xi(bi(await rr((n) => yi(t.alertsUrl, t.userAgent, Ai(e, n)), {
		maxRetries: t.maxRetries,
		backoffMs: t.backoffMs,
		timeoutMs: t.timeoutMs
	}), {
		retrievedAt: Date.now(),
		config: t
	})) : [];
}
async function yi(e, t, n) {
	let r = await fetch(e, {
		signal: n,
		headers: {
			accept: "application/geo+json",
			"user-agent": t
		}
	});
	return U(r, "NOAA alerts"), r.json();
}
function bi(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e.features;
	if (!Array.isArray(n) || n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.config?.maxRecords ?? ui, a = t.config?.alertsUrl ?? si, o = [];
	for (let e of n) {
		let t = e?.properties;
		if (!t) continue;
		let n = z(t.id), i = z(t["@id"]) || z(e.id), s = z(t.event), c = z(t.severity), l = z(t.effective), u = z(t.onset), d = z(t.expires), f = Date.parse(l), p = Date.parse(u), m = Date.parse(d);
		if (!wi({
			alertId: n,
			eventType: s,
			severity: c,
			sourceUrl: i,
			effectiveTimestamp: f,
			onsetTimestamp: p,
			expiresTimestamp: m,
			retrievedAt: r
		})) continue;
		let h = t.geocode ?? {}, g = Ei([
			f,
			p,
			Date.parse(z(t.sent))
		]) ?? r, _ = {
			id: Oi(n),
			alertId: n,
			event: s,
			headline: z(t.headline),
			description: z(t.description).replace(/\s+/g, " ").slice(0, 600),
			severity: c,
			urgency: z(t.urgency) || "Unknown",
			certainty: z(t.certainty) || "Unknown",
			areaDesc: z(t.areaDesc),
			sameCodes: Di(h.SAME),
			ugcCodes: Di(h.UGC),
			effective: l,
			effectiveTimestamp: Number.isFinite(f) ? f : void 0,
			onset: u,
			onsetTimestamp: Number.isFinite(p) ? p : void 0,
			expires: d,
			expiresTimestamp: Number.isFinite(m) ? m : void 0,
			observedTimestamp: g,
			senderName: z(t.senderName),
			sourceUrl: i,
			sourceApiUrl: a,
			sourceName: oi,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Ti({
				alertId: n,
				eventType: s,
				severity: c,
				sourceUrl: i,
				effectiveTimestamp: f,
				onsetTimestamp: p,
				expiresTimestamp: m,
				retrievedAt: r
			}),
			rawPayloadHash: "",
			rawPayloadJson: void 0
		}, v = V({
			..._,
			rawPayloadHash: void 0,
			rawPayloadJson: void 0
		});
		_.rawPayloadHash = L(v), _.rawPayloadJson = v, o.push(_);
	}
	return o.sort((e, t) => (gi[t.severity] ?? 0) - (gi[e.severity] ?? 0) || t.observedTimestamp - e.observedTimestamp), o.slice(0, i);
}
function xi(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Si(n));
	return t;
}
function Si(e) {
	let t = `noaa|${e.alertId}`.toLowerCase(), n = `${e.event} (${e.severity}/${e.urgency}/${e.certainty}) for ${e.areaDesc}.${e.expires ? ` Expires ${e.expires.slice(0, 16)}.` : ""} ${e.headline} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(ai, t),
			title: (e.headline || `${e.event} — ${e.areaDesc}`).slice(0, 140),
			summary: n,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observedTimestamp,
			category: "weather-alert",
			provenance: "official-api",
			sourceId: ai,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"NWS alert",
				e.event,
				e.severity,
				e.urgency
			]),
			extractedEntities: R([e.event, e.areaDesc])
		}),
		countryCodes: ["US"],
		severity: Ci(e.severity),
		confidence: e.confidence,
		weatherAlert: e
	};
}
function Ci(e) {
	switch (e) {
		case "Extreme": return "critical";
		case "Severe": return "elevated";
		case "Moderate": return "watch";
		case "Minor": return "stable";
		default: return "watch";
	}
}
function wi(e) {
	return !!(e.alertId && e.eventType && hi.has(e.severity) && ci.test(e.sourceUrl) && (Number.isFinite(e.effectiveTimestamp) || Number.isFinite(e.onsetTimestamp) || Number.isFinite(e.expiresTimestamp)) && Number.isFinite(e.retrievedAt));
}
function Ti(e) {
	return wi(e) ? 96 : 60;
}
function Ei(e) {
	return e.find((e) => Number.isFinite(e));
}
function Di(e) {
	return Array.isArray(e) ? e.map((e) => z(e)).filter(Boolean) : [];
}
function Oi(e) {
	return `${ai}:${e.toLowerCase()}`;
}
function ki(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function Ai(e, t) {
	if (e.aborted) return e;
	if (t.aborted) return t;
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/adapters/usptoPatentAdapter.ts
var ji = "uspto_patentsview_public", Mi = "USPTO (PatentsView)", Ni = "https://search.patentsview.org/api/v1/patent/", Pi = "https://patents.google.com/patent", Fi = /^https:\/\/patents\.google\.com\/patent\//, Ii = /^\d{4}-\d{2}-\d{2}$/, Li = 60, Ri = 25, zi = 100, Bi = [
	"NVIDIA Corporation",
	"Taiwan Semiconductor Manufacturing Company, Ltd.",
	"ASML Netherlands B.V.",
	"Intel Corporation",
	"Apple Inc.",
	"Advanced Micro Devices, Inc.",
	"QUALCOMM Incorporated",
	"Micron Technology, Inc.",
	"Tesla, Inc."
];
function Vi(e = process.env) {
	let t = z(e.ATLASZ_PATENTSVIEW_API_KEY);
	if (!t) return null;
	let n = z(e.ATLASZ_PATENTSVIEW_BASE_URL) || Ni;
	return /^https:\/\//i.test(n) ? {
		apiBase: n,
		apiKey: t,
		assignees: $i(e.ATLASZ_PATENTSVIEW_ASSIGNEES) ?? Bi,
		lookbackDays: ta(Number(e.ATLASZ_PATENTSVIEW_LOOKBACK_DAYS ?? Li), 1, 365),
		maxRecords: ta(Number(e.ATLASZ_PATENTSVIEW_MAX_RECORDS ?? Ri), 1, zi)
	} : null;
}
async function Hi(e, t = Vi()) {
	if (!t || t.assignees.length === 0) return [];
	let n = Date.now(), r = Zi(t, n), i = await fetch(r, {
		signal: e,
		headers: {
			accept: "application/json",
			"x-api-key": t.apiKey
		}
	});
	return U(i, "USPTO PatentsView"), Wi(Ui(await i.json(), {
		retrievedAt: n,
		sourceApiUrl: Qi(t)
	}));
}
function Ui(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e.patents;
	if (!Array.isArray(n) || n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.sourceApiUrl ?? Ni, a = [];
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let t = e, n = z(t.patent_id) || z(t.patent_number), o = z(t.patent_title), s = z(t.patent_date), c = Ji(n), l = Date.parse(`${s}T00:00:00Z`);
		if (!Yi({
			patentId: n,
			title: o,
			patentDate: s,
			sourceUrl: c,
			retrievedAt: r
		})) continue;
		let u = Ki(t.assignees), d = qi(t.cpc_current ?? t.cpcs), f = V({
			patentId: n,
			title: o,
			abstract: z(t.patent_abstract).slice(0, 600),
			patentDate: s,
			assignees: u,
			cpcCodes: d,
			sourceUrl: c,
			sourceApiUrl: i,
			retrievedAt: r
		});
		a.push({
			id: ea(n),
			patentId: n,
			title: o,
			abstract: z(t.patent_abstract).slice(0, 600),
			patentDate: s,
			grantTimestamp: Number.isFinite(l) ? l : r,
			assignees: u,
			cpcCodes: d,
			sourceUrl: c,
			sourceApiUrl: i,
			sourceName: Mi,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Xi({
				patentId: n,
				title: o,
				patentDate: s,
				sourceUrl: c,
				retrievedAt: r
			}),
			rawPayloadHash: L(f),
			rawPayloadJson: f
		});
	}
	return a.sort((e, t) => t.grantTimestamp - e.grantTimestamp), a;
}
function Wi(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Gi(n));
	return t;
}
function Gi(e) {
	let t = `uspto|${e.patentId}`.toLowerCase(), n = e.assignees.length > 0 ? ` Assignee: ${e.assignees.slice(0, 3).join(", ")}.` : " No assignee organization listed.", r = `USPTO patent ${e.patentId} granted ${e.patentDate}: ${e.title}.${n} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(ji, t),
			title: `${e.patentId} — ${e.title}`.slice(0, 140),
			summary: r,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.grantTimestamp,
			category: "patent",
			provenance: "official-api",
			sourceId: ji,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"USPTO patent",
				...e.assignees,
				...e.cpcCodes
			]),
			extractedEntities: R([
				e.patentId,
				...e.assignees,
				...e.cpcCodes
			])
		}),
		confidence: e.confidence,
		patentRecord: e
	};
}
function Ki(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = z(n?.assignee_organization);
		e && t.push(e);
	}
	return R(t).slice(0, 8);
}
function qi(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n, r = z(e?.cpc_group_id) || z(e?.cpc_subgroup_id) || z(e?.cpc_subsection_id) || z(e?.cpc_class);
		r && t.push(r.toUpperCase());
	}
	return R(t).slice(0, 8);
}
function Ji(e) {
	return e ? /^\d+$/.test(e) ? `${Pi}/US${e}` : `${Pi}/${encodeURIComponent(e)}` : "";
}
function Yi(e) {
	return !!(e.patentId && e.title && Ii.test(e.patentDate) && Fi.test(e.sourceUrl) && Number.isFinite(e.retrievedAt));
}
function Xi(e) {
	return Yi(e) ? 96 : 60;
}
function Zi(e, t) {
	let n = { _and: [{ _gte: { patent_date: (/* @__PURE__ */ new Date(t - e.lookbackDays * 24 * 60 * 60 * 1e3)).toISOString().slice(0, 10) } }, { _or: e.assignees.map((e) => ({ "assignees.assignee_organization": e })) }] }, r = [
		"patent_id",
		"patent_title",
		"patent_date",
		"patent_abstract",
		"assignees.assignee_organization",
		"cpc_current.cpc_group_id"
	], i = { size: e.maxRecords }, a = new URL(e.apiBase);
	return a.searchParams.set("q", JSON.stringify(n)), a.searchParams.set("f", JSON.stringify(r)), a.searchParams.set("o", JSON.stringify(i)), a.toString();
}
function Qi(e) {
	return e.apiBase;
}
function $i(e) {
	let t = z(e).split("|").map((e) => e.trim()).filter(Boolean);
	return t.length > 0 ? t : null;
}
function ea(e) {
	return `${ji}:${e.toLowerCase()}`;
}
function ta(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/federalRegisterAdapter.ts
var na = "federal_register_public", ra = "Federal Register API", ia = "https://www.federalregister.gov/api/v1/documents.json", aa = "Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)", oa = 14, sa = 25, ca = 100, la = 2e4, ua = 2, da = 1e3, fa = /^\d{4}-\d{2}-\d{2}$/, pa = /^https:\/\/www\.federalregister\.gov\/documents\//, ma = /^https:\/\/www\.govinfo\.gov\/content\/pkg\/FR-\d{4}-\d{2}-\d{2}\/pdf\/[^/]+\.pdf$/, ha = [
	"document_number",
	"title",
	"type",
	"agencies",
	"publication_date",
	"effective_on",
	"comments_close_on",
	"abstract",
	"html_url",
	"pdf_url",
	"raw_text_url",
	"body_html_url",
	"citation",
	"action"
];
function ga(e = process.env) {
	if (e.ATLASZ_FEDERAL_REGISTER_DISABLE === "1") return null;
	let t = z(e.ATLASZ_FEDERAL_REGISTER_URL) || ia;
	return /^https:\/\//i.test(t) ? {
		documentsUrl: t,
		userAgent: z(e.ATLASZ_FEDERAL_REGISTER_USER_AGENT) || z(e.ATLASZ_HTTP_USER_AGENT) || aa,
		lookbackDays: ka(Number(e.ATLASZ_FEDERAL_REGISTER_LOOKBACK_DAYS ?? oa), 1, 90),
		maxRecords: ka(Number(e.ATLASZ_FEDERAL_REGISTER_MAX_RECORDS ?? sa), 1, ca),
		timeoutMs: ka(Number(e.ATLASZ_FEDERAL_REGISTER_TIMEOUT_MS ?? la), 1e3, 6e4),
		maxRetries: ka(Number(e.ATLASZ_FEDERAL_REGISTER_MAX_RETRIES ?? ua), 0, 5),
		backoffMs: ka(Number(e.ATLASZ_FEDERAL_REGISTER_BACKOFF_MS ?? da), 0, 6e4)
	} : null;
}
async function _a(e, t = ga()) {
	if (!t) return [];
	let n = Date.now(), r = Sa(t, n);
	return ba(ya(await rr((n) => va(r, t.userAgent, Aa(e, n)), {
		maxRetries: t.maxRetries,
		backoffMs: t.backoffMs,
		timeoutMs: t.timeoutMs
	}), {
		retrievedAt: n,
		sourceApiUrl: r
	}));
}
async function va(e, t, n) {
	let r = await fetch(e, {
		signal: n,
		headers: {
			accept: "application/json",
			"user-agent": t
		}
	});
	return U(r, "Federal Register"), r.json();
}
function ya(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e.results;
	if (!Array.isArray(n) || n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.sourceApiUrl ?? ia, a = [];
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let t = e, n = z(t.document_number), o = z(t.title), s = z(t.type), c = z(t.publication_date), l = Date.parse(`${c}T00:00:00Z`), u = z(t.html_url), d = Da(z(t.pdf_url));
		if (!wa({
			documentNumber: n,
			title: o,
			documentType: s,
			publicationDate: c,
			publicationTimestamp: l,
			htmlUrl: u,
			sourceApiUrl: i,
			retrievedAt: r
		})) continue;
		let f = Ca(t.agencies), p = V(t);
		a.push({
			id: Oa(n),
			documentNumber: n,
			title: o,
			documentType: s,
			agencies: f,
			publicationDate: c,
			publicationTimestamp: l,
			effectiveDate: Ea(z(t.effective_on)),
			commentEndDate: Ea(z(t.comments_close_on)),
			abstract: z(t.abstract).replace(/\s+/g, " ").slice(0, 800),
			htmlUrl: u,
			pdfUrl: d,
			sourceApiUrl: i,
			sourceName: ra,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Ta({
				documentNumber: n,
				title: o,
				documentType: s,
				publicationDate: c,
				publicationTimestamp: l,
				htmlUrl: u,
				sourceApiUrl: i,
				retrievedAt: r
			}),
			rawPayloadHash: L(p),
			rawPayloadJson: p
		});
	}
	return a.sort((e, t) => t.publicationTimestamp - e.publicationTimestamp || e.documentNumber.localeCompare(t.documentNumber)), a;
}
function ba(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(xa(n));
	return t;
}
function xa(e) {
	let t = `federal-register|${e.documentNumber}`.toLowerCase(), n = e.agencies.length > 0 ? ` Agency: ${e.agencies.slice(0, 3).join(", ")}.` : "", r = e.effectiveDate ? ` Effective ${e.effectiveDate}.` : "", i = e.commentEndDate ? ` Comments close ${e.commentEndDate}.` : "", a = e.pdfUrl ? " Official PDF is available via govinfo." : " Official PDF was not present in the API record.", o = `${e.documentType} ${e.documentNumber} published ${e.publicationDate}: ${e.title}.${n}${r}${i}${a}`;
	return {
		...B({
			id: H(na, t),
			title: `${e.documentType} — ${e.title}`.slice(0, 160),
			summary: o,
			source: e.sourceName,
			url: e.htmlUrl,
			observedAt: e.publicationTimestamp,
			category: "regulatory-document",
			provenance: "official-api",
			sourceId: na,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"Federal Register",
				e.documentType,
				...e.agencies
			]),
			extractedEntities: R([e.documentNumber, ...e.agencies])
		}),
		countryCodes: ["US"],
		region: "United States",
		severity: "watch",
		confidence: e.confidence,
		regulatoryDocument: e
	};
}
function Sa(e, t) {
	let n = (/* @__PURE__ */ new Date(t - e.lookbackDays * 24 * 60 * 60 * 1e3)).toISOString().slice(0, 10), r = new URL(e.documentsUrl);
	r.searchParams.set("per_page", String(e.maxRecords)), r.searchParams.set("order", "newest"), r.searchParams.set("conditions[publication_date][gte]", n);
	for (let e of ha) r.searchParams.append("fields[]", e);
	return r.toString();
}
function Ca(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n, r = z(e.name) || z(e.raw_name);
		r && t.push(r);
	}
	return R(t).slice(0, 8);
}
function wa(e) {
	return !!(e.documentNumber && e.title && e.documentType && fa.test(e.publicationDate) && Number.isFinite(e.publicationTimestamp) && pa.test(e.htmlUrl) && /^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/.test(e.sourceApiUrl) && Number.isFinite(e.retrievedAt));
}
function Ta(e) {
	return wa(e) ? 96 : 60;
}
function Ea(e) {
	return fa.test(e) ? e : void 0;
}
function Da(e) {
	if (e) return ma.test(e) ? e : void 0;
}
function Oa(e) {
	return `${na}:${e.toLowerCase()}`;
}
function ka(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function Aa(e, t) {
	if (e.aborted) return e;
	if (t.aborted) return t;
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/adapters/ofacSanctionsAdapter.ts
var ja = "ofac_sdn_public", Ma = "Treasury OFAC SDN List", Na = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML", Pa = "https://sanctionslist.ofac.treas.gov/Home/SdnList", Fa = "Atlasz-Intel (github.com/gryszzz/Atlasz-Intel)", Ia = 40, La = 250, Ra = /^\d{4}-\d{2}-\d{2}$/;
function za(e = process.env) {
	if (e.ATLASZ_OFAC_DISABLE === "1") return null;
	let t = eo(e.ATLASZ_OFAC_SDN_XML_URL) || Na;
	return /^https:\/\//i.test(t) ? {
		sdnXmlUrl: t,
		userAgent: eo(e.ATLASZ_OFAC_USER_AGENT) || eo(e.ATLASZ_HTTP_USER_AGENT) || Fa,
		maxRecords: no(Number(e.ATLASZ_OFAC_MAX_RECORDS ?? Ia), 1, La)
	} : null;
}
async function Ba(e, t = za()) {
	if (!t) return [];
	let n = await fetch(t.sdnXmlUrl, {
		signal: e,
		headers: {
			accept: "application/xml, text/xml",
			"user-agent": t.userAgent
		}
	});
	return U(n, "OFAC SDN"), Ha(Va(await n.text(), {
		retrievedAt: Date.now(),
		sourceDataUrl: t.sdnXmlUrl,
		maxRecords: t.maxRecords
	}).records);
}
function Va(e, t = {}) {
	if (!e || !/<sdnList\b/i.test(e)) return {
		publishDate: "",
		publishTimestamp: 0,
		records: []
	};
	let n = t.retrievedAt ?? Date.now(), r = t.sourceDataUrl ?? Na, i = t.maxRecords ?? Ia, a = Ya(e, "publshInformation"), o = Qa(W(a, "Publish_Date")), s = o ? Date.parse(`${o}T00:00:00Z`) : 0, c = $a(W(a, "Record_Count")), l = [];
	for (let t of Xa(e, "sdnEntry")) {
		let e = W(t, "uid"), i = W(t, "sdnType"), a = Ga(t), u = R(Xa(Ya(t, "programList"), "program").map((e) => Za(e))), d = R(Xa(Ya(t, "addressList"), "address").map((e) => W(e, "country"))).slice(0, 12), f = Ka(t), p = V({ rawEntryXml: t }), m = L(t);
		qa({
			uid: e,
			name: a,
			entityType: i,
			publishDate: o,
			publishTimestamp: s,
			sourceDataUrl: r,
			retrievedAt: n,
			rawPayloadHash: m
		}) && l.push({
			id: to(e),
			uid: e,
			listType: "SDN",
			name: a,
			entityType: i,
			programs: u,
			countries: d,
			aliases: f,
			publishDate: o,
			publishTimestamp: s,
			recordCount: c,
			sourceUrl: Pa,
			sourceDataUrl: r,
			sourceName: Ma,
			retrievedAt: n,
			provenance: "official-api",
			confidence: Ja({
				uid: e,
				name: a,
				entityType: i,
				publishDate: o,
				publishTimestamp: s,
				sourceDataUrl: r,
				retrievedAt: n,
				rawPayloadHash: m
			}),
			changeStatus: "observed",
			rawPayloadHash: m,
			rawPayloadJson: p
		});
	}
	return l.sort((e, t) => Number(e.uid) - Number(t.uid)), {
		publishDate: o,
		publishTimestamp: s,
		recordCount: c,
		records: l.slice(0, i)
	};
}
function Ha(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Wa(n));
	return t;
}
function Ua(e, t) {
	if (!e.ofacSanctionsRecord) return e;
	let n = t?.ofacSanctionsRecord, r = n ? n.rawPayloadHash === e.ofacSanctionsRecord.rawPayloadHash ? "unchanged" : "updated" : "new", i = r === "unchanged" && t ? t.timestamp : e.timestamp;
	return {
		...e,
		timestamp: i,
		ofacSanctionsRecord: {
			...e.ofacSanctionsRecord,
			changeStatus: r
		}
	};
}
function Wa(e) {
	let t = `ofac-sdn|${e.uid}`.toLowerCase(), n = e.programs.length > 0 ? ` Programs: ${e.programs.slice(0, 5).join(", ")}.` : "", r = e.countries.length > 0 ? ` Countries listed: ${e.countries.slice(0, 5).join(", ")}.` : "", i = `OFAC SDN record ${e.uid} (${e.entityType}) published in the ${e.publishDate} SDN export: ${e.name}.${n}${r} This is source-published sanctions-list evidence, not a screening match or inferred guilt label.`;
	return {
		...B({
			id: H(ja, t),
			title: `OFAC SDN — ${e.name}`.slice(0, 160),
			summary: i,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.publishTimestamp,
			category: "sanctions",
			provenance: "official-api",
			sourceId: ja,
			dedupeKey: t,
			rawPayload: {
				uid: e.uid,
				rawPayloadHash: e.rawPayloadHash
			},
			affectedAssets: [],
			narrativeTags: R([
				"OFAC",
				"SDN",
				e.entityType,
				...e.programs,
				...e.countries
			]),
			extractedEntities: R([
				e.uid,
				e.name,
				...e.aliases,
				...e.programs,
				...e.countries
			])
		}),
		region: e.countries[0] ?? "OFAC SDN",
		severity: "watch",
		confidence: e.confidence,
		rawPayloadHash: e.rawPayloadHash,
		ofacSanctionsRecord: e
	};
}
function Ga(e) {
	return R([W(e, "firstName"), W(e, "lastName")]).join(" ") || W(e, "lastName");
}
function Ka(e) {
	let t = Ya(e, "akaList"), n = [];
	for (let e of Xa(t, "aka")) {
		let t = R([W(e, "firstName"), W(e, "lastName")]).join(" ") || W(e, "lastName");
		t && n.push(t);
	}
	return R(n).slice(0, 12);
}
function qa(e) {
	return !!(/^\d+$/.test(e.uid) && e.name && e.entityType && Ra.test(e.publishDate) && Number.isFinite(e.publishTimestamp) && /^https:\/\/sanctionslistservice\.ofac\.treas\.gov\/api\/PublicationPreview\/exports\/SDN\.XML$/i.test(e.sourceDataUrl) && Number.isFinite(e.retrievedAt) && /^[a-f0-9]{64}$/.test(e.rawPayloadHash));
}
function Ja(e) {
	return qa(e) ? 96 : 60;
}
function Ya(e, t) {
	return RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)<\\/${t}>`, "i").exec(e)?.[1] ?? "";
}
function Xa(e, t) {
	return e ? [...e.matchAll(RegExp(`<${t}\\b[^>]*>([\\s\\S]*?)<\\/${t}>`, "gi"))].map((e) => e[1] ?? "") : [];
}
function W(e, t) {
	return Za(Ya(e, t)).trim();
}
function Za(e) {
	return e.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
}
function Qa(e) {
	let t = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(e);
	if (!t) return "";
	let [, n, r, i] = t;
	return `${i}-${n.padStart(2, "0")}-${r.padStart(2, "0")}`;
}
function $a(e) {
	let t = Number(e);
	return Number.isFinite(t) ? t : void 0;
}
function eo(e) {
	return typeof e == "string" ? e.trim() : "";
}
function to(e) {
	return `${ja}:${e}`;
}
function no(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/treasuryFiscalAdapter.ts
var ro = "treasury_fiscal_public", io = "U.S. Treasury Fiscal Data", ao = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service", oo = "/v2/accounting/od/debt_to_penny", so = "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/", co = 1, lo = 15e3, uo = 2, fo = 1e3, po = [
	{
		field: "tot_pub_debt_out_amt",
		metricName: "Total Public Debt Outstanding",
		units: "USD"
	},
	{
		field: "debt_held_public_amt",
		metricName: "Debt Held by the Public",
		units: "USD"
	},
	{
		field: "intragov_hold_amt",
		metricName: "Intragovernmental Holdings",
		units: "USD"
	}
];
function mo(e = process.env) {
	return {
		baseUrl: z(e.ATLASZ_TREASURY_BASE_URL) || ao,
		recordLimit: To(Number(e.ATLASZ_TREASURY_RECORD_LIMIT ?? co), 1, 30),
		metrics: po,
		timeoutMs: To(Number(e.ATLASZ_TREASURY_TIMEOUT_MS ?? lo), 1e3, 6e4),
		maxRetries: To(Number(e.ATLASZ_TREASURY_MAX_RETRIES ?? uo), 0, 5),
		backoffMs: To(Number(e.ATLASZ_TREASURY_BACKOFF_MS ?? fo), 0, 6e4)
	};
}
async function ho(e, t = mo()) {
	let n = So(t.baseUrl, t.recordLimit);
	return _o(go({
		payload: await rr((t) => xo(n, Eo(e, t)), {
			maxRetries: t.maxRetries,
			backoffMs: t.backoffMs,
			timeoutMs: t.timeoutMs
		}),
		retrievedAt: Date.now(),
		sourceApiUrl: n.toString(),
		metrics: t.metrics
	}));
}
function go(e) {
	if (!e.payload || typeof e.payload != "object") return [];
	let t = e.payload;
	if (!Array.isArray(t.data)) return [];
	let n = e.metrics ?? po, r = e.sourceApiUrl ?? So(ao, co).toString(), i = [];
	for (let a of t.data) {
		if (!a || typeof a != "object") continue;
		let o = z(a.record_date), s = Date.parse(`${o}T00:00:00Z`);
		if (!(!/^\d{4}-\d{2}-\d{2}$/.test(o) || !Number.isFinite(s))) for (let c of n) {
			let n = z(a[c.field]), l = Number(n), u = z(t.meta?.labels?.[c.field]) || c.metricName, d = V({
				datasetId: "debt_to_penny",
				datasetName: "Debt to the Penny",
				tableId: "debt_to_penny",
				tableName: "Debt to the Penny",
				recordDate: o,
				field: c.field,
				metricName: u,
				rawValue: n,
				row: a,
				labels: t.meta?.labels ?? {},
				dataTypes: t.meta?.dataTypes ?? {},
				dataFormats: t.meta?.dataFormats ?? {},
				sourceUrl: so,
				sourceApiUrl: r,
				retrievedAt: e.retrievedAt
			}), f = {
				id: wo("debt_to_penny", c.field, o),
				datasetId: "debt_to_penny",
				datasetName: "Debt to the Penny",
				tableId: "debt_to_penny",
				tableName: "Debt to the Penny",
				recordDate: o,
				recordTimestamp: s,
				metricName: u,
				metricValue: l,
				rawValue: n,
				units: c.units,
				sourceUrl: so,
				sourceApiUrl: r,
				sourceName: io,
				retrievedAt: e.retrievedAt,
				provenance: "official-api",
				confidence: bo({
					recordDate: o,
					metricName: u,
					metricValue: l,
					sourceUrl: so,
					sourceApiUrl: r,
					retrievedAt: e.retrievedAt
				}),
				rawPayloadHash: L(d),
				rawPayloadJson: d
			};
			yo(f) && i.push(f);
		}
	}
	return i;
}
function _o(e) {
	return e.filter(yo).map(vo);
}
function vo(e) {
	let t = `treasury|${e.datasetId}|${e.metricName}|${e.recordDate}`.toLowerCase(), n = B({
		id: H(ro, t),
		title: `${e.datasetName} — ${e.metricName}`,
		summary: `Official Treasury Fiscal Data observation for ${e.metricName} on ${e.recordDate}: ${e.rawValue} ${e.units}. Dataset ${e.datasetId}, table ${e.tableId}.`,
		source: e.sourceName,
		url: e.sourceUrl,
		observedAt: e.recordTimestamp,
		category: "fiscal-event",
		provenance: "official-api",
		sourceId: ro,
		dedupeKey: t,
		rawPayload: e,
		affectedAssets: [],
		narrativeTags: R([
			"Treasury Fiscal Data",
			e.datasetName,
			e.metricName,
			"United States fiscal position"
		]),
		extractedEntities: R([
			"U.S. Treasury",
			"United States",
			e.datasetName,
			e.tableName,
			e.metricName
		])
	});
	return {
		...n,
		countryCodes: R(["US", ...n.countryCodes]),
		affectedSectors: R(["Government finance", ...n.affectedSectors]),
		confidence: e.confidence,
		treasuryFiscalRecord: e
	};
}
function yo(e) {
	return !!(e.datasetId && e.tableId && /^\d{4}-\d{2}-\d{2}$/.test(e.recordDate) && Number.isFinite(e.recordTimestamp) && e.metricName && Number.isFinite(e.metricValue) && e.units && /^https:\/\/fiscaldata\.treasury\.gov\/datasets\/debt-to-the-penny\/?$/.test(e.sourceUrl) && /^https:\/\/api\.fiscaldata\.treasury\.gov\/services\/api\/fiscal_service\/v2\/accounting\/od\/debt_to_penny/.test(e.sourceApiUrl) && e.sourceName === io && e.provenance === "official-api" && Number.isFinite(e.retrievedAt) && e.rawPayloadHash.length > 0);
}
function bo(e) {
	return /^\d{4}-\d{2}-\d{2}$/.test(e.recordDate) && e.metricName.length > 0 && Number.isFinite(e.metricValue) && /^https:\/\/fiscaldata\.treasury\.gov\//.test(e.sourceUrl) && /^https:\/\/api\.fiscaldata\.treasury\.gov\//.test(e.sourceApiUrl) && Number.isFinite(e.retrievedAt) ? 96 : 60;
}
async function xo(e, t) {
	let n = await fetch(e, {
		signal: t,
		headers: {
			accept: "application/json",
			"user-agent": "AtlaszIntel/0.4 (local-first fiscal intelligence; official Treasury Fiscal Data API)"
		}
	});
	return U(n, "Treasury Fiscal Data"), await n.json();
}
function So(e, t) {
	let n = new URL(`${Co(e)}${oo}`);
	return n.searchParams.set("sort", "-record_date"), n.searchParams.set("page[size]", String(t)), n.searchParams.set("fields", [
		"record_date",
		"debt_held_public_amt",
		"intragov_hold_amt",
		"tot_pub_debt_out_amt",
		"src_line_nbr"
	].join(",")), n;
}
function Co(e) {
	return e.replace(/\/$/, "");
}
function wo(e, t, n) {
	return `${ro}:${e}:${t}:${n}`;
}
function To(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function Eo(e, t) {
	if (e.aborted || t.aborted) {
		let e = new AbortController();
		return e.abort(), e.signal;
	}
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/adapters/blsAdapter.ts
var Do = "bls_public", Oo = "U.S. Bureau of Labor Statistics", ko = "https://api.bls.gov/publicAPI/v2", Ao = "https://data.bls.gov/timeseries", jo = /^[A-Z0-9]{8,}$/, Mo = /^\d{4}-\d{2}-\d{2}$/, No = [
	{
		seriesId: "CUUR0000SA0",
		label: "CPI-U, all items"
	},
	{
		seriesId: "LNS14000000",
		label: "Unemployment rate"
	},
	{
		seriesId: "CES0000000001",
		label: "Total nonfarm payroll employment"
	},
	{
		seriesId: "LNS11300000",
		label: "Labor force participation rate"
	},
	{
		seriesId: "CES0500000003",
		label: "Average hourly earnings, total private"
	}
];
function Po(e = process.env) {
	if (e.ATLASZ_BLS_DISABLE === "1") return null;
	let t = z(e.ATLASZ_BLS_API_BASE) || ko;
	return /^https:\/\//i.test(t) ? {
		apiBase: t,
		series: Wo(e.ATLASZ_BLS_SERIES) ?? No,
		apiKey: z(e.ATLASZ_BLS_API_KEY) || void 0
	} : null;
}
async function Fo(e, t = Po()) {
	if (!t || t.series.length === 0) return [];
	let n = Date.now(), r = new Date(n).getUTCFullYear(), i = {
		seriesid: t.series.map((e) => e.seriesId),
		startyear: String(r - 1),
		endyear: String(r),
		catalog: !0
	};
	t.apiKey && (i.registrationkey = t.apiKey);
	let a = await fetch(`${t.apiBase}/timeseries/data/`, {
		signal: e,
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json"
		},
		body: JSON.stringify(i)
	});
	return U(a, "BLS"), Lo(Io(await a.json(), {
		retrievedAt: n,
		config: t
	}));
}
function Io(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e.Results?.series;
	if (!Array.isArray(n) || n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = new Map((t.config?.series ?? No).map((e) => [e.seriesId, e.label])), a = [];
	for (let e of n) {
		let t = z(e.seriesID).toUpperCase(), n = zo(e.data);
		if (!jo.test(t) || !n) continue;
		let o = Bo(z(n.year), z(n.period)), s = z(n.value), c = Number(s), l = `${Ao}/${t}`, u = Vo(e) || i.get(t) || t;
		if (!Ho({
			seriesId: t,
			observationDate: o,
			value: c,
			sourceUrl: l,
			retrievedAt: r
		})) continue;
		let d = Date.parse(`${o}T00:00:00Z`), f = V({
			seriesId: t,
			title: u,
			year: z(n.year),
			period: z(n.period),
			periodName: z(n.periodName),
			observationDate: o,
			value: c,
			rawValue: s,
			sourceUrl: l,
			sourceApiUrl: `${ko}/timeseries/data/`,
			retrievedAt: r
		});
		a.push({
			id: Go(t, o),
			seriesId: t,
			title: u,
			period: z(n.period).toUpperCase(),
			periodName: z(n.periodName),
			year: z(n.year),
			observationDate: o,
			observationTimestamp: d,
			value: c,
			rawValue: s,
			sourceUrl: l,
			sourceApiUrl: `${ko}/timeseries/data/`,
			sourceName: Oo,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Uo({
				seriesId: t,
				observationDate: o,
				value: c,
				sourceUrl: l,
				retrievedAt: r
			}),
			rawPayloadHash: L(f),
			rawPayloadJson: f
		});
	}
	return a;
}
function Lo(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Ro(n));
	return t;
}
function Ro(e) {
	let t = `bls|${e.seriesId}|${e.observationDate}`.toLowerCase(), n = `Official BLS observation for ${e.seriesId} (${e.title}) — ${e.periodName} ${e.year}: ${e.rawValue}. Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(Do, t),
			title: `${e.seriesId} — ${e.title}`,
			summary: n,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observationTimestamp,
			category: "macro-event",
			provenance: "official-api",
			sourceId: Do,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"BLS macro series",
				e.seriesId,
				e.title,
				"United States"
			]),
			extractedEntities: R([
				e.title,
				e.seriesId,
				"United States macro"
			])
		}),
		confidence: e.confidence,
		blsObservation: e
	};
}
function zo(e) {
	if (!Array.isArray(e)) return null;
	for (let t of e) {
		let e = t, n = z(e.value);
		if (Bo(z(e.year), z(e.period)) && n && n !== "-" && Number.isFinite(Number(n))) return e;
	}
	return null;
}
function Bo(e, t) {
	if (!/^\d{4}$/.test(e)) return null;
	let n = t.toUpperCase();
	return /^M(0[1-9]|1[0-2])$/.test(n) ? `${e}-${n.slice(1)}-01` : /^Q0[1-4]$/.test(n) ? `${e}-${String(Number(n.slice(1)) * 3).padStart(2, "0")}-01` : n === "A01" || n === "S01" ? `${e}-01-01` : n === "S02" ? `${e}-07-01` : null;
}
function Vo(e) {
	let t = e.catalog;
	return z(t?.series_title);
}
function Ho(e) {
	return !!(jo.test(e.seriesId) && e.observationDate && Mo.test(e.observationDate) && Number.isFinite(e.value) && /^https:\/\/data\.bls\.gov\/timeseries\/[A-Z0-9]+$/.test(e.sourceUrl) && Number.isFinite(e.retrievedAt));
}
function Uo(e) {
	return Ho(e) ? 96 : 60;
}
function Wo(e) {
	let t = z(e).split(",").map((e) => e.trim().toUpperCase()).filter((e) => jo.test(e));
	if (t.length === 0) return null;
	let n = new Map(No.map((e) => [e.seriesId, e.label]));
	return t.map((e) => ({
		seriesId: e,
		label: n.get(e) ?? e
	}));
}
function Go(e, t) {
	return `${Do}:${e.toLowerCase()}:${t}`;
}
//#endregion
//#region electron/osint/adapters/beaAdapter.ts
var Ko = "bea_public", qo = "U.S. Bureau of Economic Analysis", Jo = "https://apps.bea.gov/api/data", Yo = "https://www.bea.gov/data/gdp/gross-domestic-product", Xo = 2e4, Zo = 2, Qo = 1e3, $o = /^\d{4}-\d{2}-\d{2}$/, es = [{
	datasetName: "NIPA",
	tableName: "T10101",
	lineNumber: "1",
	label: "Real gross domestic product percent change",
	frequency: "Q",
	year: "X",
	sourceUrl: Yo
}];
function ts(e = process.env) {
	if (e.ATLASZ_BEA_DISABLE === "1") return null;
	let t = G(e.ATLASZ_BEA_API_KEY), n = G(e.ATLASZ_BEA_API_BASE) || Jo;
	return !t || !/^https:\/\//i.test(n) ? null : {
		apiBase: n,
		apiKey: t,
		series: hs(e.ATLASZ_BEA_SERIES) ?? es,
		timeoutMs: _s(Number(e.ATLASZ_BEA_TIMEOUT_MS ?? Xo), 1e3, 6e4),
		maxRetries: _s(Number(e.ATLASZ_BEA_MAX_RETRIES ?? Zo), 0, 5),
		backoffMs: _s(Number(e.ATLASZ_BEA_BACKOFF_MS ?? Qo), 0, 6e4)
	};
}
async function ns(e, t = ts()) {
	if (!t || t.series.length === 0) return [];
	let n = Date.now(), r = [];
	for (let i of t.series) {
		let a = fs(t.apiBase, i, t.apiKey), o = fs(t.apiBase, i).toString(), s = await rr((t) => us(a, vs(e, t)), {
			maxRetries: t.maxRetries,
			backoffMs: t.backoffMs,
			timeoutMs: t.timeoutMs
		});
		r.push(...rs(s, {
			retrievedAt: n,
			series: i,
			sourceApiUrl: o
		}));
	}
	return is(r);
}
function rs(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = t.series ?? es[0], r = os(e);
	if (r.length === 0) return [];
	let i = t.retrievedAt ?? Date.now(), a = t.sourceApiUrl ?? fs(Jo, n).toString(), o = ss(r, n);
	if (!o) return [];
	let s = G(o.TimePeriod), c = ps(s), l = c ? Date.parse(`${c}T00:00:00Z`) : NaN, u = G(o.DataValue), d = ms(u), f = G(o.LineDescription) || n.label, p = G(o.CL_UNIT) || G(o.UnitOfMeasure) || "value", m = G(o.UNIT_MULT) || void 0, h = V({
		datasetName: n.datasetName,
		tableName: n.tableName,
		lineNumber: n.lineNumber,
		lineDescription: f,
		timePeriod: s,
		observationDate: c,
		rawValue: u,
		metricValue: d,
		units: p,
		unitMultiplier: m,
		row: o,
		sourceUrl: n.sourceUrl,
		sourceApiUrl: a,
		retrievedAt: i
	}), g = {
		id: gs(n.datasetName, n.tableName, n.lineNumber, s),
		datasetName: n.datasetName,
		tableName: n.tableName,
		lineNumber: n.lineNumber,
		lineDescription: f,
		seriesCode: G(o.SeriesCode) || void 0,
		timePeriod: s,
		observationDate: c ?? "",
		observationTimestamp: l,
		metricName: `${n.tableName} line ${n.lineNumber}: ${f}`,
		metricValue: d ?? NaN,
		rawValue: u,
		units: p,
		unitMultiplier: m,
		sourceUrl: n.sourceUrl,
		sourceApiUrl: a,
		sourceName: qo,
		retrievedAt: i,
		provenance: "official-api",
		confidence: ls({
			datasetName: n.datasetName,
			tableName: n.tableName,
			lineNumber: n.lineNumber,
			observationDate: c,
			metricValue: d,
			sourceUrl: n.sourceUrl,
			sourceApiUrl: a,
			retrievedAt: i
		}),
		rawPayloadHash: L(h),
		rawPayloadJson: h
	};
	return cs(g) ? [g] : [];
}
function is(e) {
	return e.filter(cs).map(as);
}
function as(e) {
	let t = `bea|${e.datasetName}|${e.tableName}|${e.lineNumber}|${e.timePeriod}`.toLowerCase(), n = B({
		id: H(Ko, t),
		title: `BEA ${e.datasetName} ${e.tableName} — ${e.lineDescription}`,
		summary: `Official BEA observation for ${e.datasetName} ${e.tableName} line ${e.lineNumber} (${e.lineDescription}) at ${e.timePeriod}: ${e.rawValue} ${e.units}.`,
		source: e.sourceName,
		url: e.sourceUrl,
		observedAt: e.observationTimestamp,
		category: "macro-event",
		provenance: "official-api",
		sourceId: Ko,
		dedupeKey: t,
		rawPayload: e,
		affectedAssets: [],
		narrativeTags: R([
			"BEA macro series",
			e.datasetName,
			e.tableName,
			e.lineDescription,
			"United States"
		]),
		extractedEntities: R([
			qo,
			"United States",
			e.datasetName,
			e.tableName,
			e.lineDescription
		])
	});
	return {
		...n,
		countryCodes: R(["US", ...n.countryCodes]),
		affectedSectors: R(["Macroeconomic data", ...n.affectedSectors]),
		confidence: e.confidence,
		beaObservation: e
	};
}
function os(e) {
	if (e.BEAAPI?.Results?.Error ?? e.Results?.Error) return [];
	let t = e.BEAAPI?.Results?.Data ?? e.Results?.Data;
	return Array.isArray(t) ? t : [];
}
function ss(e, t) {
	let n = null;
	for (let r of e) {
		if (G(r.TableName) && G(r.TableName).toUpperCase() !== t.tableName.toUpperCase() || G(r.LineNumber) !== t.lineNumber) continue;
		let e = ps(G(r.TimePeriod)), i = e ? Date.parse(`${e}T00:00:00Z`) : NaN, a = ms(G(r.DataValue));
		!e || !Number.isFinite(i) || a === null || (!n || i > n.timestamp) && (n = {
			row: r,
			timestamp: i
		});
	}
	return n?.row ?? null;
}
function cs(e) {
	return e.datasetName.length > 0 && e.tableName.length > 0 && e.lineNumber.length > 0 && $o.test(e.observationDate) && Number.isFinite(e.observationTimestamp) && e.metricName.length > 0 && Number.isFinite(e.metricValue) && e.units.length > 0 && /^https:\/\/www\.bea\.gov\//.test(e.sourceUrl) && /^https:\/\/apps\.bea\.gov\/api\/data/.test(e.sourceApiUrl) && !/[?&]UserID=/i.test(e.sourceApiUrl) && e.sourceName === qo && e.provenance === "official-api" && Number.isFinite(e.retrievedAt) && e.rawPayloadHash.length > 0;
}
function ls(e) {
	return e.datasetName.length > 0 && e.tableName.length > 0 && e.lineNumber.length > 0 && e.observationDate !== null && $o.test(e.observationDate) && e.metricValue !== null && Number.isFinite(e.metricValue) && /^https:\/\/www\.bea\.gov\//.test(e.sourceUrl) && /^https:\/\/apps\.bea\.gov\/api\/data/.test(e.sourceApiUrl) && !/[?&]UserID=/i.test(e.sourceApiUrl) && Number.isFinite(e.retrievedAt) ? 96 : 60;
}
async function us(e, t) {
	let n = await fetch(e, {
		signal: t,
		headers: {
			accept: "application/json",
			"user-agent": "AtlaszIntel/0.4 (local-first macro intelligence; official BEA API)"
		}
	});
	U(n, "BEA");
	let r = await n.json(), i = ds(r);
	if (i) throw Error(i);
	return r;
}
function ds(e) {
	if (!e || typeof e != "object") return null;
	let t = e, n = t.BEAAPI?.Results?.Error ?? t.Results?.Error;
	return n ? `BEA API error ${G(n.APIErrorCode) || "unknown"}: ${G(n.APIErrorDescription) || "Unknown BEA API error"}` : null;
}
function fs(e, t, n) {
	let r = new URL(e);
	return n && r.searchParams.set("UserID", n), r.searchParams.set("method", "GetData"), r.searchParams.set("DataSetName", t.datasetName), r.searchParams.set("TableName", t.tableName), r.searchParams.set("Frequency", t.frequency), r.searchParams.set("Year", t.year), r.searchParams.set("ResultFormat", "JSON"), r;
}
function ps(e) {
	let t = e.toUpperCase(), n = /^(\d{4})Q([1-4])$/.exec(t) ?? /^(\d{4})-Q([1-4])$/.exec(t);
	if (n) return `${n[1]}-${String(Number(n[2]) * 3).padStart(2, "0")}-01`;
	let r = /^(\d{4})M(0[1-9]|1[0-2])$/.exec(t) ?? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(t);
	return r ? `${r[1]}-${r[2]}-01` : /^\d{4}$/.test(t) ? `${t}-01-01` : null;
}
function ms(e) {
	if (!e || e === "(NA)" || e === "---" || e === "--" || e === "...") return null;
	let t = e.replace(/,/g, ""), n = Number(t);
	return Number.isFinite(n) ? n : null;
}
function hs(e) {
	let t = G(e).split(",").map((e) => e.trim()).filter(Boolean);
	if (t.length === 0) return null;
	let n = new Map(es.map((e) => [`${e.tableName}:${e.lineNumber}`, e])), r = t.map((e) => {
		let [t, r] = e.toUpperCase().split(":");
		if (!/^T\d{5}$/.test(t) || !/^\d+$/.test(r ?? "")) return null;
		let i = `${t}:${r}`;
		return n.get(i) ?? {
			datasetName: "NIPA",
			tableName: t,
			lineNumber: r,
			label: `${t} line ${r}`,
			frequency: "Q",
			year: "X",
			sourceUrl: Yo
		};
	}).filter((e) => e !== null);
	return r.length > 0 ? r : null;
}
function gs(e, t, n, r) {
	return `${Ko}:${e.toLowerCase()}:${t.toLowerCase()}:${n}:${r.toLowerCase()}`;
}
function G(e) {
	return e == null ? "" : String(e).trim();
}
function _s(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function vs(e, t) {
	if (e.aborted || t.aborted) {
		let e = new AbortController();
		return e.abort(), e.signal;
	}
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/adapters/eiaEnergyAdapter.ts
var ys = "eia_energy_public", bs = "U.S. Energy Information Administration", xs = "https://api.eia.gov/v2", Ss = "https://www.eia.gov/opendata/", Cs = 2e4, ws = 2, Ts = 1e3, Es = /^[A-Z0-9._-]+$/i, Ds = /^\d{4}-\d{2}-\d{2}$/, Os = [
	{
		seriesId: "PET.RWTC.D",
		title: "Cushing, OK WTI spot price FOB",
		energyCategory: "Petroleum",
		commodity: "Crude Oil",
		region: "United States",
		countryCode: "US",
		units: "Dollars per Barrel",
		sourceUrl: "https://www.eia.gov/opendata/browser/petroleum/pri/spt"
	},
	{
		seriesId: "NG.RNGWHHD.D",
		title: "Henry Hub natural gas spot price",
		energyCategory: "Natural Gas",
		commodity: "Natural Gas",
		region: "United States",
		countryCode: "US",
		units: "Dollars per Million Btu",
		sourceUrl: "https://www.eia.gov/opendata/browser/natural-gas/pri/fut"
	},
	{
		seriesId: "PET.EMM_EPM0_PTE_NUS_DPG.W",
		title: "U.S. regular retail gasoline price",
		energyCategory: "Petroleum",
		commodity: "Gasoline",
		region: "United States",
		countryCode: "US",
		units: "Dollars per Gallon",
		sourceUrl: "https://www.eia.gov/opendata/browser/petroleum/pri/gnd"
	},
	{
		seriesId: "PET.WCESTUS1.W",
		title: "U.S. ending stocks of crude oil",
		energyCategory: "Petroleum",
		commodity: "Crude Oil",
		region: "United States",
		countryCode: "US",
		units: "Thousand Barrels",
		sourceUrl: "https://www.eia.gov/opendata/browser/petroleum/stoc/wstk"
	},
	{
		seriesId: "ELEC.GEN.ALL-US-99.M",
		title: "U.S. electricity net generation",
		energyCategory: "Electricity",
		commodity: "Electricity",
		region: "United States",
		countryCode: "US",
		units: "Thousand Megawatthours",
		sourceUrl: "https://www.eia.gov/opendata/browser/electricity/electric-power-operational-data"
	}
];
function ks(e = process.env) {
	if (e.ATLASZ_EIA_DISABLE === "1") return null;
	let t = K(e.ATLASZ_EIA_API_KEY), n = K(e.ATLASZ_EIA_API_BASE) || xs;
	return !t || !/^https:\/\//i.test(n) ? null : {
		apiBase: n,
		apiKey: t,
		series: Us(e.ATLASZ_EIA_SERIES) ?? Os,
		timeoutMs: qs(Number(e.ATLASZ_EIA_TIMEOUT_MS ?? Cs), 1e3, 6e4),
		maxRetries: qs(Number(e.ATLASZ_EIA_MAX_RETRIES ?? ws), 0, 5),
		backoffMs: qs(Number(e.ATLASZ_EIA_BACKOFF_MS ?? Ts), 0, 6e4)
	};
}
async function As(e, t = ks()) {
	if (!t || t.series.length === 0) return [];
	let n = Date.now(), r = [];
	for (let i of t.series) {
		let a = zs(t.apiBase, i, t.apiKey), o = zs(t.apiBase, i).toString(), s = await rr((t) => Rs(a, Js(e, t)), {
			maxRetries: t.maxRetries,
			backoffMs: t.backoffMs,
			timeoutMs: t.timeoutMs
		});
		r.push(...js(s, {
			retrievedAt: n,
			series: i,
			sourceApiUrl: o
		}));
	}
	return Ms(r);
}
function js(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = t.series ?? Os[0], r = Ps(e);
	if (r.length === 0) return [];
	let i = t.retrievedAt ?? Date.now(), a = t.sourceApiUrl ?? zs(xs, n).toString(), o = Fs(r);
	if (!o) return [];
	let s = K(o.period) || K(o.date), c = Bs(s), l = c ? Date.parse(`${c}T00:00:00Z`) : NaN, u = K(o.value), d = Vs(u), f = K(o.units) || K(o.unit) || K(o["value-units"]) || n.units || "value", p = K(o["series-description"]) || K(o.name) || K(o.description) || n.title, m = K(o["area-name"]) || K(o.region) || n.region, h = Ws(K(o.country) || K(o.countryCode) || n.countryCode), g = V({
		seriesId: n.seriesId.toUpperCase(),
		title: p,
		energyCategory: n.energyCategory,
		commodity: n.commodity,
		region: m,
		countryCode: h,
		period: s,
		observationDate: c,
		rawValue: u,
		value: d,
		units: f,
		sourceUrl: n.sourceUrl,
		sourceApiUrl: a,
		retrievedAt: i,
		row: Hs(o)
	}), _ = {
		id: Ks(n.seriesId, s),
		seriesId: n.seriesId.toUpperCase(),
		title: p,
		energyCategory: n.energyCategory,
		commodity: n.commodity,
		region: m,
		countryCode: h,
		period: s,
		observationDate: c ?? "",
		observationTimestamp: l,
		value: d ?? NaN,
		rawValue: u,
		units: f,
		sourceUrl: n.sourceUrl,
		sourceApiUrl: a,
		sourceName: bs,
		retrievedAt: i,
		provenance: "official-api",
		confidence: Ls({
			seriesId: n.seriesId,
			observationDate: c,
			value: d,
			sourceUrl: n.sourceUrl,
			sourceApiUrl: a,
			retrievedAt: i
		}),
		rawPayloadHash: L(g),
		rawPayloadJson: g
	};
	return Is(_) ? [_] : [];
}
function Ms(e) {
	return e.filter(Is).map(Ns);
}
function Ns(e) {
	let t = `eia|${e.seriesId}|${e.period}`.toLowerCase(), n = B({
		id: H(ys, t),
		title: `EIA ${e.seriesId} — ${e.title}`,
		summary: `Official EIA energy observation for ${e.seriesId} (${e.commodity}) at ${e.period}: ${e.rawValue} ${e.units}. Source: ${e.sourceName}.`,
		source: e.sourceName,
		url: e.sourceUrl,
		observedAt: e.observationTimestamp,
		category: "energy-event",
		provenance: "official-api",
		sourceId: ys,
		dedupeKey: t,
		rawPayload: e,
		affectedAssets: [],
		narrativeTags: R([
			"EIA energy series",
			e.energyCategory,
			e.commodity,
			e.seriesId
		]),
		extractedEntities: R([
			bs,
			e.seriesId,
			e.title,
			e.commodity,
			e.region ?? ""
		])
	});
	return {
		...n,
		countryCodes: R([e.countryCode ?? "US", ...n.countryCodes]),
		affectedSectors: R([
			"Energy",
			e.energyCategory,
			...n.affectedSectors
		]),
		affectedCommodities: R([e.commodity, ...n.affectedCommodities]),
		confidence: e.confidence,
		eiaEnergyRecord: e
	};
}
function Ps(e) {
	if (e.error || e.code === 400 || e.code === 404) return [];
	let t = e.response?.data;
	if (Array.isArray(t)) return t;
	let n = e.series?.[0];
	if (Array.isArray(n?.data)) {
		let e = [];
		for (let t of n.data) !Array.isArray(t) || t.length < 2 || e.push({
			period: t[0],
			value: t[1],
			units: n.units,
			"series-description": n.name
		});
		return e;
	}
	return [];
}
function Fs(e) {
	let t = null;
	for (let n of e) {
		let e = Bs(K(n.period) || K(n.date)), r = e ? Date.parse(`${e}T00:00:00Z`) : NaN, i = Vs(K(n.value));
		!e || !Number.isFinite(r) || i === null || (!t || r > t.timestamp) && (t = {
			row: n,
			timestamp: r
		});
	}
	return t?.row ?? null;
}
function Is(e) {
	return Es.test(e.seriesId) && e.title.length > 0 && e.energyCategory.length > 0 && e.commodity.length > 0 && e.period.length > 0 && Ds.test(e.observationDate) && Number.isFinite(e.observationTimestamp) && Number.isFinite(e.value) && e.units.length > 0 && /^https:\/\/www\.eia\.gov\//.test(e.sourceUrl) && /^https:\/\/api\.eia\.gov\/v2\/seriesid\//.test(e.sourceApiUrl) && !/[?&]api_key=/i.test(e.sourceApiUrl) && e.sourceName === bs && e.provenance === "official-api" && Number.isFinite(e.retrievedAt) && e.rawPayloadHash.length > 0 && !(e.rawPayloadJson ?? "").includes("api_key");
}
function Ls(e) {
	return Es.test(e.seriesId) && e.observationDate !== null && Ds.test(e.observationDate) && e.value !== null && Number.isFinite(e.value) && /^https:\/\/www\.eia\.gov\//.test(e.sourceUrl) && /^https:\/\/api\.eia\.gov\/v2\/seriesid\//.test(e.sourceApiUrl) && !/[?&]api_key=/i.test(e.sourceApiUrl) && Number.isFinite(e.retrievedAt) ? 96 : 60;
}
async function Rs(e, t) {
	let n = await fetch(e, {
		signal: t,
		headers: {
			accept: "application/json",
			"user-agent": "AtlaszIntel/0.4 (local-first energy intelligence; official EIA API)"
		}
	});
	return U(n, "EIA"), await n.json();
}
function zs(e, t, n) {
	let r = new URL(`${Gs(e)}/seriesid/${encodeURIComponent(t.seriesId.toUpperCase())}`);
	return r.searchParams.set("length", "1"), n && r.searchParams.set("api_key", n), r;
}
function Bs(e) {
	let t = e.trim().toUpperCase();
	if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
	let n = /^(\d{4})(\d{2})(\d{2})$/.exec(t);
	if (n) return `${n[1]}-${n[2]}-${n[3]}`;
	let r = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(t) ?? /^(\d{4})(0[1-9]|1[0-2])$/.exec(t);
	if (r) return `${r[1]}-${r[2]}-01`;
	let i = /^(\d{4})Q([1-4])$/.exec(t) ?? /^(\d{4})-Q([1-4])$/.exec(t);
	return i ? `${i[1]}-${String(Number(i[2]) * 3).padStart(2, "0")}-01` : /^\d{4}$/.test(t) ? `${t}-01-01` : null;
}
function Vs(e) {
	if (!e || e === "(NA)" || e === "NA" || e === "---" || e === "--" || e === ".") return null;
	let t = Number(e.replace(/,/g, ""));
	return Number.isFinite(t) ? t : null;
}
function Hs(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) /api[_-]?key/i.test(n) || (t[n] = r);
	return t;
}
function Us(e) {
	let t = K(e).split(",").map((e) => e.trim().toUpperCase()).filter(Boolean);
	if (t.length === 0) return null;
	let n = new Map(Os.map((e) => [e.seriesId.toUpperCase(), e])), r = t.map((e) => Es.test(e) ? n.get(e) ?? {
		seriesId: e,
		title: e,
		energyCategory: "Energy",
		commodity: "Energy",
		region: "United States",
		countryCode: "US",
		sourceUrl: Ss
	} : null).filter((e) => e !== null);
	return r.length > 0 ? r : null;
}
function Ws(e) {
	if (!e) return;
	let t = e.toUpperCase();
	if (/^[A-Z]{2}$/.test(t)) return t;
	if (t === "USA" || t === "UNITED STATES") return "US";
}
function Gs(e) {
	return e.replace(/\/$/, "");
}
function Ks(e, t) {
	return `${ys}:${e.toUpperCase()}:${t.toLowerCase()}`;
}
function K(e) {
	return e == null ? "" : String(e).trim();
}
function qs(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function Js(e, t) {
	if (e.aborted || t.aborted) {
		let e = new AbortController();
		return e.abort(), e.signal;
	}
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/adapters/usgsQuakeAdapter.ts
var Ys = "usgs_significant_quakes", Xs = "USGS Earthquake Hazards Program", Zs = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson", Qs = /^https:\/\/earthquake\.usgs\.gov\//, $s = 50, ec = 200, tc = {
	alaska: "US",
	california: "US",
	nevada: "US",
	hawaii: "US",
	oklahoma: "US",
	washington: "US",
	"puerto rico": "US",
	japan: "JP",
	indonesia: "ID",
	chile: "CL",
	mexico: "MX",
	peru: "PE",
	turkey: "TR",
	türkiye: "TR",
	greece: "GR",
	iran: "IR",
	philippines: "PH",
	"papua new guinea": "PG",
	"new zealand": "NZ",
	italy: "IT",
	taiwan: "TW",
	afghanistan: "AF",
	china: "CN",
	india: "IN",
	nepal: "NP",
	ecuador: "EC",
	colombia: "CO",
	russia: "RU"
};
function nc(e = process.env) {
	if (e.ATLASZ_USGS_QUAKES_DISABLE === "1") return null;
	let t = z(e.ATLASZ_USGS_QUAKES_URL) || Zs;
	return /^https:\/\//i.test(t) ? {
		feedUrl: t,
		minMagnitude: Number.isFinite(Number(e.ATLASZ_USGS_MIN_MAGNITUDE)) ? Math.max(0, Number(e.ATLASZ_USGS_MIN_MAGNITUDE)) : 0,
		maxRecords: fc(Number(e.ATLASZ_USGS_MAX_RECORDS ?? $s), 1, ec)
	} : null;
}
async function rc(e, t = nc()) {
	if (!t) return [];
	let n = await fetch(t.feedUrl, {
		signal: e,
		headers: { accept: "application/geo+json, application/json" }
	});
	return U(n, "USGS earthquakes"), ac(ic(await n.json(), {
		retrievedAt: Date.now(),
		config: t
	}));
}
function ic(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e.features;
	if (!Array.isArray(n) || n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.config?.minMagnitude ?? 0, a = t.config?.maxRecords ?? $s, o = [];
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let n = e.properties, a = e.geometry, s = z(e.id), c = Yn(n?.mag), l = Yn(n?.time), u = z(n?.url), d = Array.isArray(a?.coordinates) ? a?.coordinates : [], f = Yn(d[0]), p = Yn(d[1]), m = Yn(d[2]);
		if (!lc({
			eventId: s,
			magnitude: c,
			time: l,
			sourceUrl: u,
			lat: p,
			lon: f,
			retrievedAt: r
		}) || c < i) continue;
		let h = z(n?.place), g = z(n?.title) || `M ${c} - ${h}`, _ = sc(h), v = _ ? tc[_.toLowerCase()] : void 0, y = z(n?.alert) || void 0, b = Yn(n?.tsunami) === 1, x = Yn(n?.sig), S = z(n?.status), C = V({
			eventId: s,
			magnitude: c,
			place: h,
			title: g,
			time: l,
			depthKm: m,
			lat: p,
			lon: f,
			region: _,
			countryCode: v,
			alert: y,
			tsunami: b,
			significance: x,
			status: S,
			sourceUrl: u,
			sourceFeedUrl: t.config?.feedUrl ?? Zs,
			retrievedAt: r
		});
		o.push({
			id: dc(s),
			eventId: s,
			magnitude: c,
			place: h,
			title: g,
			time: l,
			depthKm: m,
			lat: p,
			lon: f,
			region: _,
			countryCode: v,
			alert: y,
			tsunami: b,
			significance: x,
			status: S,
			sourceUrl: u,
			sourceFeedUrl: t.config?.feedUrl ?? Zs,
			sourceName: Xs,
			retrievedAt: r,
			provenance: "official-api",
			confidence: uc({
				eventId: s,
				magnitude: c,
				time: l,
				sourceUrl: u,
				lat: p,
				lon: f,
				retrievedAt: r
			}),
			rawPayloadHash: L(C),
			rawPayloadJson: C
		});
	}
	return o.sort((e, t) => t.time - e.time).slice(0, a);
}
function ac(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(oc(n));
	return t;
}
function oc(e) {
	let t = `usgs-quake|${e.eventId}`.toLowerCase(), n = e.tsunami ? " Tsunami flag set by USGS." : "", r = e.alert ? ` PAGER alert: ${e.alert}.` : "", i = `USGS recorded a magnitude ${e.magnitude} earthquake — ${e.place} — at depth ${e.depthKm ?? "unknown"} km.${r}${n} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(Ys, t),
			title: e.title.slice(0, 140),
			summary: i,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.time,
			category: "natural-disaster",
			provenance: "official-api",
			sourceId: Ys,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"USGS earthquake",
				"seismic",
				e.tsunami ? "tsunami flag" : "",
				e.alert ? `PAGER ${e.alert}` : "",
				e.region ?? ""
			]),
			extractedEntities: R([
				e.eventId,
				e.place,
				e.region ?? "",
				e.countryCode ?? ""
			])
		}),
		severity: cc(e.magnitude),
		lat: e.lat,
		lon: e.lon,
		confidence: e.confidence,
		earthquakeEvent: e
	};
}
function sc(e) {
	let t = e.split(",");
	return (t.length > 1 ? t[t.length - 1].trim() : "") || void 0;
}
function cc(e) {
	return e >= 7 ? "critical" : e >= 6 ? "elevated" : e >= 5 ? "watch" : "stable";
}
function lc(e) {
	return !!(e.eventId && e.magnitude !== void 0 && Number.isFinite(e.magnitude) && e.time !== void 0 && Number.isFinite(e.time) && Qs.test(e.sourceUrl) && e.lat !== void 0 && Number.isFinite(e.lat) && e.lon !== void 0 && Number.isFinite(e.lon) && Number.isFinite(e.retrievedAt));
}
function uc(e) {
	return lc(e) ? 96 : 60;
}
function dc(e) {
	return `${Ys}:${e.toLowerCase()}`;
}
function fc(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/cisaKevAdapter.ts
var pc = "cisa_kev_public", mc = "CISA Known Exploited Vulnerabilities Catalog", hc = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", gc = "https://nvd.nist.gov/vuln/detail", _c = 25, vc = 100, yc = /^CVE-\d{4}-\d{4,}$/, bc = /^\d{4}-\d{2}-\d{2}$/;
function xc(e = process.env) {
	if (e.ATLASZ_CISA_KEV_DISABLE === "1") return null;
	let t = z(e.ATLASZ_CISA_KEV_URL) || hc;
	return /^https:\/\//i.test(t) ? {
		catalogUrl: t,
		maxRecords: Mc(Number(e.ATLASZ_CISA_KEV_MAX_RECORDS ?? _c), 1, vc)
	} : null;
}
async function Sc(e, t = xc()) {
	if (!t) return [];
	let n = await fetch(t.catalogUrl, {
		signal: e,
		headers: { accept: "application/json" }
	});
	return U(n, "CISA KEV"), Ec(Tc(await n.json(), {
		config: t,
		sourceCatalogUrl: t.catalogUrl,
		retrievedAt: Date.now()
	}));
}
async function Cc(e, t = xc()) {
	if (!t) return /* @__PURE__ */ new Set();
	try {
		let n = await fetch(t.catalogUrl, {
			signal: e,
			headers: { accept: "application/json" }
		});
		return n.ok ? wc(await n.json()) : /* @__PURE__ */ new Set();
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function wc(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of Tc(e, { config: { maxRecords: 2 ** 53 - 1 } })) t.add(n.cveId);
	return t;
}
function Tc(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e, r = Array.isArray(n.vulnerabilities) ? n.vulnerabilities : [];
	if (r.length === 0) return [];
	let i = z(n.catalogVersion) || "unknown", a = t.sourceCatalogUrl ?? hc, o = t.retrievedAt ?? Date.now(), s = t.config?.maxRecords ?? _c, c = [];
	for (let e of r) {
		if (!e || typeof e != "object") continue;
		let t = z(e.cveID).toUpperCase(), n = z(e.vendorProject), r = z(e.product), s = z(e.vulnerabilityName), l = z(e.dateAdded), u = z(e.shortDescription), d = z(e.requiredAction), f = z(e.dueDate), p = z(e.knownRansomwareCampaignUse).toLowerCase() === "known", m = R(Ac(e.cwes).map((e) => e.toUpperCase())), h = `${gc}/${t}`;
		if (!Oc({
			cveId: t,
			vendorProject: n,
			product: r,
			vulnerabilityName: s,
			dateAdded: l,
			sourceUrl: h
		})) continue;
		let g = V({
			cveId: t,
			vendorProject: n,
			product: r,
			vulnerabilityName: s,
			dateAdded: l,
			shortDescription: u,
			requiredAction: d,
			dueDate: f,
			knownRansomwareCampaignUse: p,
			cwes: m,
			catalogVersion: i,
			sourceUrl: h,
			sourceCatalogUrl: a,
			retrievedAt: o
		});
		c.push({
			id: jc(t),
			cveId: t,
			vendorProject: n,
			product: r,
			vulnerabilityName: s,
			dateAdded: l,
			dateAddedTimestamp: Date.parse(`${l}T00:00:00Z`),
			shortDescription: u,
			requiredAction: d,
			dueDate: f || void 0,
			knownRansomwareCampaignUse: p,
			cwes: m,
			catalogVersion: i,
			sourceUrl: h,
			sourceCatalogUrl: a,
			sourceName: mc,
			retrievedAt: o,
			provenance: "official-api",
			confidence: kc({
				cveId: t,
				vendorProject: n,
				product: r,
				vulnerabilityName: s,
				dateAdded: l,
				sourceUrl: h
			}),
			rawPayloadHash: L(g),
			rawPayloadJson: g
		});
	}
	return c.sort((e, t) => t.dateAddedTimestamp - e.dateAddedTimestamp), c.slice(0, s);
}
function Ec(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Dc(n));
	return t;
}
function Dc(e) {
	let t = `cisa-kev|${e.cveId}`.toLowerCase(), n = e.knownRansomwareCampaignUse ? " Known use in ransomware campaigns." : "", r = e.dueDate ? ` Federal remediation due ${e.dueDate}.` : "", i = `CISA added ${e.cveId} (${e.vendorProject} ${e.product}) to the Known Exploited Vulnerabilities catalog on ${e.dateAdded}: ${e.vulnerabilityName}.${n}${r} Required action: ${e.requiredAction} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(pc, t),
			title: `${e.cveId} — ${e.vendorProject} ${e.product}`,
			summary: i,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.dateAddedTimestamp,
			category: "cyber-advisory",
			provenance: "official-api",
			sourceId: pc,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"CISA KEV",
				"Known exploited vulnerability",
				e.knownRansomwareCampaignUse ? "Known ransomware campaign use" : "",
				...e.cwes
			]),
			extractedEntities: R([
				e.cveId,
				e.vendorProject,
				e.product,
				e.vulnerabilityName
			])
		}),
		confidence: e.confidence,
		kevVulnerability: e
	};
}
function Oc(e) {
	return !!(yc.test(e.cveId) && e.vendorProject && e.product && e.vulnerabilityName && bc.test(e.dateAdded) && Number.isFinite(Date.parse(`${e.dateAdded}T00:00:00Z`)) && /^https:\/\/nvd\.nist\.gov\/vuln\/detail\/CVE-\d{4}-\d{4,}$/.test(e.sourceUrl));
}
function kc(e) {
	return Oc(e) ? 96 : 60;
}
function Ac(e) {
	return Array.isArray(e) ? e.map((e) => z(e)).filter(Boolean) : [];
}
function jc(e) {
	return `${pc}:${e.toLowerCase()}`;
}
function Mc(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/nvdCveAdapter.ts
var Nc = "nvd_cve_public", Pc = "NIST National Vulnerability Database", Fc = "https://services.nvd.nist.gov/rest/json/cves/2.0", Ic = "https://nvd.nist.gov/vuln/detail", Lc = 25, Rc = 100, zc = 7, Bc = 120, Vc = /^CVE-\d{4}-\d{4,}$/, Hc = /^CWE-\d+$/;
function Uc(e = process.env) {
	if (e.ATLASZ_NVD_DISABLE === "1") return null;
	let t = z(e.ATLASZ_NVD_BASE_URL) || Fc;
	return /^https:\/\//i.test(t) ? {
		baseUrl: t,
		apiKey: z(e.ATLASZ_NVD_API_KEY) || void 0,
		resultsPerPage: al(Number(e.ATLASZ_NVD_RESULTS_PER_PAGE ?? Lc), 1, Rc),
		lookbackDays: al(Number(e.ATLASZ_NVD_LOOKBACK_DAYS ?? zc), 1, Bc),
		linkKev: e.ATLASZ_NVD_LINK_KEV !== "0"
	} : null;
}
async function Wc(e, t = Uc()) {
	if (!t) return [];
	let n = Date.now(), r = nl(t, n), i = { accept: "application/json" };
	t.apiKey && (i.apiKey = t.apiKey);
	let a = await fetch(r, {
		signal: e,
		headers: i
	});
	U(a, "NVD");
	let o = await a.json(), s = /* @__PURE__ */ new Set();
	return t.linkKev && (s = await Cc(e, xc())), Kc(Gc(o, {
		retrievedAt: n,
		sourceApiUrl: rl(t),
		knownExploitedCveIds: s
	}));
}
function Gc(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e, r = Array.isArray(n.vulnerabilities) ? n.vulnerabilities : [];
	if (r.length === 0) return [];
	let i = t.retrievedAt ?? Date.now(), a = t.sourceApiUrl ?? Fc, o = t.knownExploitedCveIds ?? /* @__PURE__ */ new Set(), s = [];
	for (let e of r) {
		let t = e?.cve;
		if (!t || typeof t != "object") continue;
		let n = z(t.id).toUpperCase(), r = z(t.sourceIdentifier), c = z(t.published), l = z(t.lastModified), u = z(t.vulnStatus) || "Unknown", d = Jc(t.descriptions), f = `${Ic}/${n}`, p = Date.parse(c), m = Date.parse(l);
		if (!$c({
			cveId: n,
			sourceIdentifier: r,
			publishedTimestamp: p,
			lastModifiedTimestamp: m,
			sourceUrl: f,
			retrievedAt: i
		})) continue;
		let h = Yc(t.metrics), g = Xc(t.weaknesses), _ = Zc(t.configurations), v = Qc(t.references), y = o.has(n), b = V({
			cveId: n,
			sourceIdentifier: r,
			published: c,
			lastModified: l,
			vulnStatus: u,
			description: d,
			cvss: h,
			cweIds: g,
			vendorProducts: _,
			references: v,
			sourceUrl: f,
			sourceApiUrl: a,
			inKnownExploitedCatalog: y,
			retrievedAt: i
		});
		s.push({
			id: il(n),
			cveId: n,
			sourceIdentifier: r,
			published: c,
			publishedTimestamp: p,
			lastModified: l,
			lastModifiedTimestamp: m,
			vulnStatus: u,
			description: d,
			cvss: h,
			cweIds: g,
			vendorProducts: _,
			references: v,
			sourceUrl: f,
			sourceApiUrl: a,
			sourceName: Pc,
			retrievedAt: i,
			inKnownExploitedCatalog: y,
			provenance: "official-api",
			confidence: el({
				cveId: n,
				sourceIdentifier: r,
				publishedTimestamp: p,
				lastModifiedTimestamp: m,
				sourceUrl: f,
				retrievedAt: i
			}),
			rawPayloadHash: L(b),
			rawPayloadJson: b
		});
	}
	return s.sort((e, t) => t.lastModifiedTimestamp - e.lastModifiedTimestamp), s;
}
function Kc(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(qc(n));
	return t;
}
function qc(e) {
	let t = `nvd|${e.cveId}`.toLowerCase(), n = e.cvss ? ` CVSS ${e.cvss.version} ${e.cvss.baseScore} (${e.cvss.baseSeverity}).` : " CVSS not yet assigned.", r = e.inKnownExploitedCatalog ? " Listed in the CISA Known Exploited Vulnerabilities catalog (active exploitation confirmed)." : "", i = e.vendorProducts.length > 0 ? ` Affected: ${e.vendorProducts.slice(0, 4).join(", ")}.` : "", a = `${e.cveId} (${e.vulnStatus}) published ${e.published.slice(0, 10)}.${n}${i}${r} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(Nc, t),
			title: e.cvss ? `${e.cveId} — ${e.cvss.baseSeverity} (CVSS ${e.cvss.baseScore})` : `${e.cveId} — ${e.vulnStatus}`,
			summary: a,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.publishedTimestamp,
			category: "cyber-advisory",
			provenance: "official-api",
			sourceId: Nc,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"NVD CVE",
				e.vulnStatus,
				e.cvss?.baseSeverity ?? "",
				e.inKnownExploitedCatalog ? "CISA KEV" : "",
				...e.cweIds
			]),
			extractedEntities: R([
				e.cveId,
				...e.vendorProducts,
				...e.cweIds
			])
		}),
		confidence: e.confidence,
		nvdCve: e
	};
}
function Jc(e) {
	if (!Array.isArray(e)) return "";
	for (let t of e) if (t && typeof t == "object" && z(t.lang) === "en") return z(t.value);
	let t = e[0];
	return t && typeof t == "object" ? z(t.value) : "";
}
function Yc(e) {
	if (!e || typeof e != "object") return;
	let t = e;
	for (let { key: e, version: n } of [
		{
			key: "cvssMetricV31",
			version: "3.1"
		},
		{
			key: "cvssMetricV30",
			version: "3.0"
		},
		{
			key: "cvssMetricV2",
			version: "2.0"
		}
	]) {
		let r = t[e];
		if (!Array.isArray(r) || r.length === 0) continue;
		let i = r.find((e) => e && typeof e == "object" && z(e.type) === "Primary") ?? r[0], a = i.cvssData ?? {}, o = Yn(a.baseScore);
		if (o === void 0) continue;
		let s = z(a.baseSeverity).toUpperCase() || z(i.baseSeverity).toUpperCase() || tl(o);
		return {
			version: n,
			vectorString: z(a.vectorString) || void 0,
			baseScore: o,
			baseSeverity: s,
			source: z(i.source) || void 0,
			type: z(i.type) || void 0
		};
	}
}
function Xc(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n?.description;
		if (Array.isArray(e)) for (let n of e) {
			let e = z(n?.value).toUpperCase();
			Hc.test(e) && t.push(e);
		}
	}
	return R(t);
}
function Zc(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n?.nodes;
		if (Array.isArray(e)) for (let n of e) {
			let e = n?.cpeMatch;
			if (Array.isArray(e)) for (let n of e) {
				let e = z(n?.criteria).split(":");
				if (e.length < 5 || e[0] !== "cpe") continue;
				let r = e[3], i = e[4];
				!r || !i || r === "*" || i === "*" || t.push(`${r}:${i}`);
			}
		}
	}
	return R(t);
}
function Qc(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = z(n?.url);
		if (!/^https?:\/\//i.test(e)) continue;
		let r = n?.tags, i = Array.isArray(r) ? R(r.map((e) => z(e))) : [];
		t.push({
			url: e,
			source: z(n?.source) || void 0,
			tags: i
		});
	}
	return t.slice(0, 12);
}
function $c(e) {
	return !!(Vc.test(e.cveId) && e.sourceIdentifier && Number.isFinite(e.publishedTimestamp) && Number.isFinite(e.lastModifiedTimestamp) && /^https:\/\/nvd\.nist\.gov\/vuln\/detail\/CVE-\d{4}-\d{4,}$/.test(e.sourceUrl) && Number.isFinite(e.retrievedAt));
}
function el(e) {
	return $c(e) ? 96 : 60;
}
function tl(e) {
	return e >= 9 ? "CRITICAL" : e >= 7 ? "HIGH" : e >= 4 ? "MEDIUM" : e > 0 ? "LOW" : "NONE";
}
function nl(e, t) {
	let n = new URL(e.baseUrl);
	n.searchParams.set("resultsPerPage", String(e.resultsPerPage));
	let r = new Date(t), i = /* @__PURE__ */ new Date(t - e.lookbackDays * 24 * 60 * 60 * 1e3);
	return n.searchParams.set("lastModStartDate", i.toISOString()), n.searchParams.set("lastModEndDate", r.toISOString()), n.toString();
}
function rl(e) {
	let t = new URL(e.baseUrl);
	return t.searchParams.set("resultsPerPage", String(e.resultsPerPage)), t.toString();
}
function il(e) {
	return `${Nc}:${e.toLowerCase()}`;
}
function al(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/githubAdvisoryAdapter.ts
var ol = "github_ghsa_public", sl = "GitHub Advisory Database", cl = "https://api.github.com/advisories", ll = "https://github.com/advisories", ul = "Atlasz-Intel", dl = 30, fl = 100, pl = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i, ml = /^CVE-\d{4}-\d{4,}$/, hl = /^CWE-\d+$/;
function gl(e = process.env) {
	if (e.ATLASZ_GITHUB_GHSA_DISABLE === "1") return null;
	let t = z(e.ATLASZ_GITHUB_ADVISORIES_URL) || cl;
	return /^https:\/\//i.test(t) ? {
		apiUrl: t,
		token: z(e.ATLASZ_GITHUB_TOKEN) || void 0,
		perPage: Nl(Number(e.ATLASZ_GITHUB_GHSA_PER_PAGE ?? dl), 1, fl),
		advisoryType: jl(e.ATLASZ_GITHUB_GHSA_TYPE),
		linkKev: e.ATLASZ_GITHUB_GHSA_LINK_KEV !== "0"
	} : null;
}
async function _l(e, t = gl()) {
	if (!t) return [];
	let n = Date.now(), r = kl(t), i = {
		accept: "application/vnd.github+json",
		"user-agent": ul,
		"x-github-api-version": "2022-11-28"
	};
	t.token && (i.authorization = `Bearer ${t.token}`);
	let a = await fetch(r, {
		signal: e,
		headers: i
	});
	U(a, "GitHub advisories");
	let o = await a.json(), s = /* @__PURE__ */ new Set();
	return t.linkKev && (s = await Cc(e, xc())), yl(vl(o, {
		retrievedAt: n,
		sourceApiUrl: Al(t),
		knownExploitedCveIds: s
	}));
}
function vl(e, t = {}) {
	let n = Array.isArray(e) ? e : Array.isArray(e?.advisories) ? e.advisories : [];
	if (n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.sourceApiUrl ?? cl, a = t.knownExploitedCveIds ?? /* @__PURE__ */ new Set(), o = [];
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let t = e, n = z(t.ghsa_id), s = xl(t), c = z(t.summary), l = z(t.severity).toLowerCase(), u = z(t.type) || "reviewed", d = z(t.published_at), f = z(t.updated_at), p = z(t.withdrawn_at) || void 0, m = z(t.html_url) || `${ll}/${n}`, h = Date.parse(d), g = Date.parse(f);
		if (!Dl({
			ghsaId: n,
			sourceUrl: m,
			publishedTimestamp: h,
			updatedTimestamp: g,
			severity: l,
			sourceIdentifier: sl,
			retrievedAt: r
		})) continue;
		let _ = Sl(t.vulnerabilities), v = wl(t.cwes), y = Tl(t.references), b = !!(s && a.has(s)), x = V({
			ghsaId: n,
			cveId: s,
			type: u,
			summary: c,
			severity: l,
			packages: _,
			cweIds: v,
			references: y,
			publishedAt: d,
			updatedAt: f,
			withdrawnAt: p,
			sourceUrl: m,
			sourceApiUrl: i,
			inKnownExploitedCatalog: b,
			retrievedAt: r
		});
		o.push({
			id: Ml(n),
			ghsaId: n,
			cveId: s,
			type: u,
			summary: c,
			severity: l,
			packages: _,
			cweIds: v,
			references: y,
			publishedAt: d,
			publishedTimestamp: h,
			updatedAt: f,
			updatedTimestamp: g,
			withdrawnAt: p,
			sourceUrl: m,
			sourceApiUrl: i,
			sourceIdentifier: sl,
			sourceName: sl,
			retrievedAt: r,
			inKnownExploitedCatalog: b,
			provenance: "official-api",
			confidence: Ol({
				ghsaId: n,
				sourceUrl: m,
				publishedTimestamp: h,
				updatedTimestamp: g,
				severity: l,
				sourceIdentifier: sl,
				retrievedAt: r
			}),
			rawPayloadHash: L(x),
			rawPayloadJson: x
		});
	}
	return o.sort((e, t) => t.publishedTimestamp - e.publishedTimestamp), o;
}
function yl(e) {
	let t = [];
	for (let n of e) n.withdrawnAt || n.confidence < 90 || t.push(bl(n));
	return t;
}
function bl(e) {
	let t = `ghsa|${e.ghsaId}`.toLowerCase(), n = e.cveId ? ` Linked ${e.cveId}.` : "", r = e.inKnownExploitedCatalog ? " Listed in the CISA Known Exploited Vulnerabilities catalog (active exploitation confirmed)." : "", i = e.packages.length > 0 ? ` Affected: ${e.packages.slice(0, 4).map((e) => `${e.ecosystem}:${e.name}`).join(", ")}.` : "", a = `${e.ghsaId} (${e.severity || "unknown"} severity) published ${e.publishedAt.slice(0, 10)}.${n}${i}${r} ${e.summary} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(ol, t),
			title: `${e.ghsaId} — ${e.summary || e.severity}`.slice(0, 140),
			summary: a,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.publishedTimestamp,
			category: "cyber-advisory",
			provenance: "official-api",
			sourceId: ol,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"GitHub Security Advisory",
				"GHSA",
				e.severity,
				...e.packages.map((e) => e.ecosystem),
				e.inKnownExploitedCatalog ? "CISA KEV" : "",
				...e.cweIds
			]),
			extractedEntities: R([
				e.ghsaId,
				e.cveId ?? "",
				...e.packages.map((e) => `${e.ecosystem}:${e.name}`),
				...e.cweIds
			])
		}),
		severity: El(e.severity),
		confidence: e.confidence,
		ghsaAdvisory: e
	};
}
function xl(e) {
	let t = z(e.cve_id).toUpperCase();
	if (ml.test(t)) return t;
	let n = e.identifiers;
	if (Array.isArray(n)) for (let e of n) {
		let t = e;
		if (z(t.type).toUpperCase() === "CVE") {
			let e = z(t.value).toUpperCase();
			if (ml.test(e)) return e;
		}
	}
}
function Sl(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n?.package, r = z(e?.ecosystem), i = z(e?.name);
		!r || !i || t.push({
			ecosystem: r,
			name: i,
			vulnerableRange: z(n.vulnerable_version_range) || void 0,
			firstPatched: Cl(n.first_patched_version) || void 0
		});
	}
	return t.slice(0, 20);
}
function Cl(e) {
	return typeof e == "string" ? e.trim() : z(e?.identifier);
}
function wl(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = z(n?.cwe_id).toUpperCase();
		hl.test(e) && t.push(e);
	}
	return R(t);
}
function Tl(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = typeof n == "string" ? n : z(n?.url);
		/^https?:\/\//i.test(e) && t.push(e);
	}
	return R(t).slice(0, 12);
}
function El(e) {
	switch (e.toLowerCase()) {
		case "critical": return "critical";
		case "high": return "elevated";
		case "moderate":
		case "medium": return "watch";
		case "low": return "stable";
		default: return "stable";
	}
}
function Dl(e) {
	return !!(pl.test(e.ghsaId) && /^https:\/\/github\.com\/advisories\/GHSA-/i.test(e.sourceUrl) && Number.isFinite(e.publishedTimestamp) && Number.isFinite(e.updatedTimestamp) && e.severity && e.sourceIdentifier && Number.isFinite(e.retrievedAt));
}
function Ol(e) {
	return Dl(e) ? 96 : 60;
}
function kl(e) {
	let t = new URL(e.apiUrl);
	return t.searchParams.set("type", e.advisoryType), t.searchParams.set("sort", "published"), t.searchParams.set("direction", "desc"), t.searchParams.set("per_page", String(e.perPage)), t.toString();
}
function Al(e) {
	let t = new URL(e.apiUrl);
	return t.searchParams.set("type", e.advisoryType), t.searchParams.set("per_page", String(e.perPage)), t.toString();
}
function jl(e) {
	let t = z(e).toLowerCase();
	return t === "unreviewed" || t === "malware" ? t : "reviewed";
}
function Ml(e) {
	return `${ol}:${e.toLowerCase()}`;
}
function Nl(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/osvAdapter.ts
var Pl = "osv_dev_public", Fl = "OSV.dev", Il = "https://api.osv.dev", Ll = "https://osv.dev/vulnerability", Rl = /^[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9][A-Za-z0-9-]*$/, zl = /^CVE-\d{4}-\d{4,}$/i, Bl = /^GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}$/i, Vl = 40, Hl = 100, Ul = [
	{
		ecosystem: "PyPI",
		name: "requests"
	},
	{
		ecosystem: "npm",
		name: "lodash"
	},
	{
		ecosystem: "Maven",
		name: "org.apache.logging.log4j:log4j-core"
	}
];
function Wl(e = process.env) {
	if (e.ATLASZ_OSV_DISABLE === "1") return null;
	let t = z(e.ATLASZ_OSV_API_BASE) || Il;
	if (!/^https:\/\//i.test(t)) return null;
	let n = R(z(e.ATLASZ_OSV_IDS).split(",").map((e) => e.trim()).filter(Boolean));
	return {
		apiBase: t,
		packages: ru(e.ATLASZ_OSV_PACKAGES) ?? (n.length > 0 ? [] : Ul),
		vulnIds: n,
		maxRecords: ou(Number(e.ATLASZ_OSV_MAX_RECORDS ?? Vl), 1, Hl)
	};
}
async function Gl(e, t = Wl()) {
	if (!t || t.packages.length === 0 && t.vulnIds.length === 0) return [];
	let n = Date.now(), r = [];
	for (let n of t.vulnIds) {
		let i = await fetch(`${t.apiBase}/v1/vulns/${encodeURIComponent(n)}`, {
			signal: e,
			headers: { accept: "application/json" }
		});
		U(i, "OSV.dev"), r.push(await i.json());
	}
	for (let n of t.packages) {
		let i = await fetch(`${t.apiBase}/v1/query`, {
			signal: e,
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			},
			body: JSON.stringify({ package: {
				ecosystem: n.ecosystem,
				name: n.name
			} })
		});
		U(i, "OSV.dev");
		let a = await i.json();
		Array.isArray(a.vulns) && r.push(...a.vulns);
	}
	return ql(Kl(r, {
		retrievedAt: n,
		config: t
	}));
}
function Kl(e, t = {}) {
	let n = Yl(e);
	if (n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.config?.maxRecords ?? Vl, a = /* @__PURE__ */ new Map();
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let t = e, n = z(t.id), i = z(t.published), o = z(t.modified), s = Date.parse(i), c = Date.parse(o), l = `${Ll}/${n}`;
		if (!tu({
			osvId: n,
			sourceUrl: l,
			publishedTimestamp: s,
			modifiedTimestamp: c,
			retrievedAt: r
		})) continue;
		let u = R(iu(t.aliases)), d = R(u.filter((e) => zl.test(e)).map((e) => e.toUpperCase())), f = R(u.filter((e) => Bl.test(e))), p = Xl(t.affected), m = Ql(t), h = $l(t.references), g = Number.isFinite(s) ? s : c, _ = V({
			osvId: n,
			aliases: u,
			relatedCveIds: d,
			relatedGhsaIds: f,
			summary: z(t.summary),
			published: i,
			modified: o,
			severity: m,
			affectedPackages: p,
			references: h,
			sourceUrl: l,
			sourceApiUrl: `${Il}/v1/vulns/${n}`,
			retrievedAt: r
		});
		a.set(n, {
			id: au(n),
			osvId: n,
			aliases: u,
			relatedCveIds: d,
			relatedGhsaIds: f,
			summary: z(t.summary),
			details: z(t.details).slice(0, 600),
			published: i,
			publishedTimestamp: Number.isFinite(s) ? s : void 0,
			modified: o,
			modifiedTimestamp: Number.isFinite(c) ? c : void 0,
			observedTimestamp: Number.isFinite(g) ? g : r,
			severity: m,
			ecosystem: p[0]?.ecosystem,
			affectedPackages: p,
			references: h,
			sourceUrl: l,
			sourceApiUrl: `${Il}/v1/vulns/${n}`,
			sourceName: Fl,
			retrievedAt: r,
			provenance: "official-api",
			confidence: nu({
				osvId: n,
				sourceUrl: l,
				publishedTimestamp: s,
				modifiedTimestamp: c,
				retrievedAt: r
			}),
			rawPayloadHash: L(_),
			rawPayloadJson: _
		});
	}
	return [...a.values()].sort((e, t) => t.observedTimestamp - e.observedTimestamp).slice(0, i);
}
function ql(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Jl(n));
	return t;
}
function Jl(e) {
	let t = `osv|${e.osvId}`.toLowerCase(), n = e.relatedCveIds.length > 0 ? ` Linked ${e.relatedCveIds.join(", ")}.` : "", r = e.affectedPackages.length > 0 ? ` Affected: ${e.affectedPackages.slice(0, 4).map((e) => `${e.ecosystem}:${e.name}`).join(", ")}.` : "", i = `${e.osvId} (${e.severity || "unscored"})${e.published ? ` published ${e.published.slice(0, 10)}` : ""}.${n}${r} ${e.summary} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(Pl, t),
			title: `${e.osvId} — ${e.summary || e.severity || "OSV advisory"}`.slice(0, 140),
			summary: i,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observedTimestamp,
			category: "cyber-advisory",
			provenance: "official-api",
			sourceId: Pl,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"OSV.dev",
				"OSV",
				e.severity,
				...e.affectedPackages.map((e) => e.ecosystem),
				...e.relatedCveIds,
				...e.relatedGhsaIds
			]),
			extractedEntities: R([
				e.osvId,
				...e.relatedCveIds,
				...e.relatedGhsaIds,
				...e.affectedPackages.map((e) => `${e.ecosystem}:${e.name}`)
			])
		}),
		severity: eu(e.severity),
		confidence: e.confidence,
		osvVulnerability: e
	};
}
function Yl(e) {
	if (Array.isArray(e)) return e;
	if (e && typeof e == "object") {
		let t = e;
		if (Array.isArray(t.vulns)) return t.vulns;
		if (typeof t.id == "string") return [t];
	}
	return [];
}
function Xl(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = n?.package, r = z(e?.ecosystem), i = z(e?.name);
		!r || !i || t.push({
			ecosystem: r,
			name: i,
			fixed: Zl(n.ranges)
		});
	}
	return t.slice(0, 20);
}
function Zl(e) {
	if (Array.isArray(e)) for (let t of e) {
		let e = t?.events;
		if (Array.isArray(e)) for (let t of e) {
			let e = z(t?.fixed);
			if (e) return e;
		}
	}
}
function Ql(e) {
	let t = e.database_specific;
	return z(t?.severity).toUpperCase() || (Array.isArray(e.severity) && e.severity.length > 0 ? z(e.severity[0]?.type).toUpperCase() : "");
}
function $l(e) {
	if (!Array.isArray(e)) return [];
	let t = [];
	for (let n of e) {
		let e = typeof n == "string" ? n : z(n?.url);
		/^https?:\/\//i.test(e) && t.push(e);
	}
	return R(t).slice(0, 12);
}
function eu(e) {
	switch (e.toUpperCase()) {
		case "CRITICAL": return "critical";
		case "HIGH": return "elevated";
		case "MODERATE":
		case "MEDIUM": return "watch";
		case "LOW": return "stable";
		default: return "watch";
	}
}
function tu(e) {
	return !!(Rl.test(e.osvId) && /^https:\/\/osv\.dev\/vulnerability\//.test(e.sourceUrl) && (Number.isFinite(e.publishedTimestamp) || Number.isFinite(e.modifiedTimestamp)) && Number.isFinite(e.retrievedAt));
}
function nu(e) {
	return tu(e) ? 96 : 60;
}
function ru(e) {
	let t = z(e);
	if (!t) return null;
	try {
		let e = JSON.parse(t);
		if (!Array.isArray(e)) return null;
		let n = e.map((e) => ({
			ecosystem: z(e.ecosystem),
			name: z(e.name)
		})).filter((e) => e.ecosystem && e.name);
		return n.length > 0 ? n : null;
	} catch {
		return null;
	}
}
function iu(e) {
	return Array.isArray(e) ? e.map((e) => z(e)).filter(Boolean) : [];
}
function au(e) {
	return `${Pl}:${e.toLowerCase()}`;
}
function ou(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/cisaAdvisoryAdapter.ts
var su = "cisa_advisories_public", cu = "CISA Cybersecurity Advisories", lu = "https://www.cisa.gov/cybersecurity-advisories/all.xml", uu = /^https:\/\/(www\.)?cisa\.gov\//i, du = /\b(ICSA-\d{2}-\d{3}-\d{2}[A-Z]?|ICSMA-\d{2}-\d{3}-\d{2}[A-Z]?|AA\d{2}-\d{3}[A-Z]?|ICS-ALERT-\d{2}-\d{3}-\d{2}[A-Z]?)\b/i, fu = /CVE-\d{4}-\d{4,}/gi, pu = 40, mu = 100;
function hu(e = process.env) {
	if (e.ATLASZ_CISA_ADVISORIES_DISABLE === "1") return null;
	let t = z(e.ATLASZ_CISA_ADVISORIES_URL) || lu;
	return /^https:\/\//i.test(t) ? {
		feedUrl: t,
		maxRecords: ku(Number(e.ATLASZ_CISA_ADVISORIES_MAX_RECORDS ?? pu), 1, mu)
	} : null;
}
async function gu(e, t = hu()) {
	if (!t) return [];
	let n = await fetch(t.feedUrl, {
		signal: e,
		headers: { accept: "application/rss+xml, application/xml, text/xml" }
	});
	return U(n, "CISA advisories"), vu(_u(await n.text(), {
		retrievedAt: Date.now(),
		config: t
	}));
}
function _u(e, t = {}) {
	let n = typeof e == "string" ? yu(e) : e;
	if (n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = t.config?.maxRecords ?? pu, a = /* @__PURE__ */ new Map();
	for (let e of n) {
		let t = z(e.title), n = z(e.link), i = xu(t, n), o = z(e.published), s = z(e.updated), c = Date.parse(o), l = Date.parse(s);
		if (!wu({
			advisoryId: i,
			title: t,
			sourceUrl: n,
			publishedTimestamp: c,
			updatedTimestamp: l,
			retrievedAt: r
		})) continue;
		let u = z(e.description).replace(/\s+/g, " ").slice(0, 600), d = R([
			...Cu(t),
			...Cu(e.description),
			...(e.cves ?? []).map((e) => e.toUpperCase()).filter((e) => /^CVE-\d{4}-\d{4,}$/.test(e))
		]), f = R((e.vendors ?? []).map(z).filter(Boolean)), p = R((e.products ?? []).map(z).filter(Boolean)), m = R([n]), h = Number.isFinite(c) ? c : l, g = V({
			advisoryId: i,
			title: t,
			summary: u,
			relatedCveIds: d,
			vendors: f,
			products: p,
			references: m,
			published: o,
			updated: s,
			sourceUrl: n,
			retrievedAt: r
		});
		a.set(i, {
			id: Ou(i),
			advisoryId: i,
			title: t,
			summary: u,
			relatedCveIds: d,
			vendors: f,
			products: p,
			references: m,
			published: o,
			publishedTimestamp: Number.isFinite(c) ? c : void 0,
			updated: s,
			updatedTimestamp: Number.isFinite(l) ? l : void 0,
			observedTimestamp: Number.isFinite(h) ? h : r,
			sourceUrl: n,
			sourceName: cu,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Tu({
				advisoryId: i,
				title: t,
				sourceUrl: n,
				publishedTimestamp: c,
				updatedTimestamp: l,
				retrievedAt: r
			}),
			rawPayloadHash: L(g),
			rawPayloadJson: g
		});
	}
	return [...a.values()].sort((e, t) => t.observedTimestamp - e.observedTimestamp).slice(0, i);
}
function vu(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(bu(n));
	return t;
}
function yu(e) {
	if (typeof e != "string" || !/<item[\s>]/i.test(e)) return [];
	let t = [];
	for (let n of e.split(/<item[\s>]/i).slice(1)) {
		let e = n.split(/<\/item>/i)[0] ?? "", r = Eu(e, "title"), i = Eu(e, "link") || Eu(e, "guid");
		!r || !i || t.push({
			title: r,
			link: i,
			description: Eu(e, "description"),
			published: Eu(e, "pubDate") || Eu(e, "published"),
			updated: Eu(e, "updated") || Eu(e, "lastBuildDate")
		});
	}
	return t;
}
function bu(e) {
	let t = `cisa-advisory|${e.advisoryId}`.toLowerCase(), n = e.relatedCveIds.length > 0 ? ` References ${e.relatedCveIds.slice(0, 6).join(", ")}.` : "", r = `CISA advisory ${e.advisoryId}${e.published ? ` published ${e.published.slice(0, 16)}` : ""}: ${e.title}.${n} Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(su, t),
			title: e.title.slice(0, 140),
			summary: r,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observedTimestamp,
			category: "cyber-advisory",
			provenance: "official-api",
			sourceId: su,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"CISA Advisory",
				"CISA",
				Su(e.advisoryId),
				...e.relatedCveIds,
				...e.vendors
			]),
			extractedEntities: R([
				e.advisoryId,
				...e.relatedCveIds,
				...e.vendors,
				...e.products
			])
		}),
		confidence: e.confidence,
		cisaAdvisory: e
	};
}
function xu(e, t) {
	let n = e.match(du);
	if (n) return n[0].toUpperCase();
	let r = t.match(du);
	return r ? r[0].toUpperCase() : "";
}
function Su(e) {
	return e.startsWith("ICSMA") ? "ICS Medical advisory" : e.startsWith("ICSA") ? "ICS advisory" : e.startsWith("ICS-ALERT") ? "ICS alert" : /^AA\d/.test(e) ? "Cybersecurity advisory" : "Advisory";
}
function Cu(e) {
	let t = z(e);
	return t ? R((t.match(fu) ?? []).map((e) => e.toUpperCase())) : [];
}
function wu(e) {
	return !!(e.advisoryId && e.title && uu.test(e.sourceUrl) && (Number.isFinite(e.publishedTimestamp) || Number.isFinite(e.updatedTimestamp)) && Number.isFinite(e.retrievedAt));
}
function Tu(e) {
	return wu(e) ? 96 : 60;
}
function Eu(e, t) {
	let n = e.match(RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, "i"));
	return n ? Du(n[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).trim() : "";
}
function Du(e) {
	return e.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
}
function Ou(e) {
	return `${su}:${e.toLowerCase()}`;
}
function ku(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/githubReleaseAdapter.ts
var Au = "github_releases_public", ju = "GitHub Releases", Mu = "https://api.github.com", Nu = "Atlasz-Intel", Pu = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, Fu = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/releases\b/, Iu = 5, Lu = 20, Ru = [
	"sigstore/cosign",
	"aquasecurity/trivy",
	"OISF/suricata"
];
function zu(e = process.env) {
	if (e.ATLASZ_GITHUB_RELEASES_DISABLE === "1") return null;
	let t = z(e.ATLASZ_GITHUB_API_BASE) || Mu;
	return /^https:\/\//i.test(t) ? {
		apiBase: t,
		repos: qu(e.ATLASZ_GITHUB_RELEASE_REPOS) ?? Ru,
		token: z(e.ATLASZ_GITHUB_TOKEN) || void 0,
		perPage: Yu(Number(e.ATLASZ_GITHUB_RELEASES_PER_PAGE ?? Iu), 1, Lu)
	} : null;
}
async function Bu(e, t = zu()) {
	if (!t || t.repos.length === 0) return [];
	let n = Date.now(), r = {
		accept: "application/vnd.github+json",
		"user-agent": Nu,
		"x-github-api-version": "2022-11-28"
	};
	t.token && (r.authorization = `Bearer ${t.token}`);
	let i = [];
	for (let n of t.repos) {
		let a = await fetch(`${t.apiBase}/repos/${n}/releases?per_page=${t.perPage}`, {
			signal: e,
			headers: r
		});
		U(a, "GitHub releases");
		let o = await a.json();
		Array.isArray(o) && i.push(...o);
	}
	return Hu(Vu(i, { retrievedAt: n }));
}
function Vu(e, t = {}) {
	let n = Array.isArray(e) ? e : [];
	if (n.length === 0) return [];
	let r = t.retrievedAt ?? Date.now(), i = [];
	for (let e of n) {
		if (!e || typeof e != "object") continue;
		let t = e;
		if (t.draft === !0) continue;
		let n = z(t.html_url), a = n.match(Fu)?.[1] ?? "", o = t.id === void 0 || t.id === null ? "" : String(t.id), s = z(t.tag_name), c = z(t.name) || s, l = z(t.published_at), u = z(t.created_at), d = Date.parse(l), f = Date.parse(u);
		if (!Gu({
			repoFullName: a,
			releaseId: o,
			tagName: s,
			sourceUrl: n,
			publishedTimestamp: d,
			createdTimestamp: f,
			retrievedAt: r
		})) continue;
		let p = Number.isFinite(d) ? d : f, m = V({
			repoFullName: a,
			releaseId: o,
			tagName: s,
			name: c,
			isPrerelease: t.prerelease === !0,
			publishedAt: l,
			createdAt: u,
			sourceUrl: n,
			sourceApiUrl: `${Mu}/repos/${a}/releases`,
			retrievedAt: r
		});
		i.push({
			id: Ju(a, o || s),
			repoFullName: a,
			releaseId: o,
			tagName: s,
			name: c,
			isPrerelease: t.prerelease === !0,
			publishedAt: l,
			publishedTimestamp: Number.isFinite(d) ? d : void 0,
			createdAt: u,
			createdTimestamp: Number.isFinite(f) ? f : void 0,
			observedTimestamp: Number.isFinite(p) ? p : r,
			sourceUrl: n,
			sourceApiUrl: `${Mu}/repos/${a}/releases`,
			sourceName: ju,
			retrievedAt: r,
			provenance: "official-api",
			confidence: Ku({
				repoFullName: a,
				releaseId: o,
				tagName: s,
				sourceUrl: n,
				publishedTimestamp: d,
				createdTimestamp: f,
				retrievedAt: r
			}),
			rawPayloadHash: L(m),
			rawPayloadJson: m
		});
	}
	return i.sort((e, t) => t.observedTimestamp - e.observedTimestamp);
}
function Hu(e) {
	let t = [];
	for (let n of e) n.confidence < 90 || t.push(Uu(n));
	return t;
}
function Uu(e) {
	let t = `ghrelease|${e.repoFullName}|${e.releaseId || e.tagName}`.toLowerCase(), n = e.tagName ? ` ${e.tagName}` : "", r = e.isPrerelease ? " (prerelease)" : "", i = `${e.repoFullName} released ${e.name || e.tagName}${r}${e.publishedAt ? ` on ${e.publishedAt.slice(0, 10)}` : ""}. Source: ${e.sourceName}.`;
	return {
		...B({
			id: H(Au, t),
			title: `${e.repoFullName}${n}`.slice(0, 140),
			summary: i,
			source: e.sourceName,
			url: e.sourceUrl,
			observedAt: e.observedTimestamp,
			category: "open-source-release",
			provenance: "official-api",
			sourceId: Au,
			dedupeKey: t,
			rawPayload: e,
			affectedAssets: [],
			narrativeTags: R([
				"GitHub release",
				e.isPrerelease ? "prerelease" : "release",
				e.repoFullName
			]),
			extractedEntities: R([
				e.repoFullName,
				e.tagName,
				Wu(e.repoFullName)
			])
		}),
		confidence: e.confidence,
		githubRelease: e
	};
}
function Wu(e) {
	return e.split("/")[1] ?? e;
}
function Gu(e) {
	return !!(Pu.test(e.repoFullName) && (e.releaseId || e.tagName) && Fu.test(e.sourceUrl) && (Number.isFinite(e.publishedTimestamp) || Number.isFinite(e.createdTimestamp)) && Number.isFinite(e.retrievedAt));
}
function Ku(e) {
	return Gu(e) ? 96 : 60;
}
function qu(e) {
	let t = z(e).split(",").map((e) => e.trim()).filter((e) => Pu.test(e));
	return t.length > 0 ? R(t) : null;
}
function Ju(e, t) {
	return `${Au}:${e.toLowerCase()}:${t.toLowerCase()}`;
}
function Yu(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
//#endregion
//#region electron/osint/adapters/politicianTradeAdapter.ts
var Xu = "politician_disclosure_public";
function Zu(e = process.env) {
	let t = z(e.ATLASZ_POLITICIAN_DISCLOSURE_URL);
	if (!t || !/^https?:\/\//i.test(t)) return null;
	let n, r = z(e.ATLASZ_POLITICIAN_DISCLOSURE_HEADERS);
	if (r) try {
		let e = JSON.parse(r);
		e && typeof e == "object" && (n = e);
	} catch {}
	return {
		url: t,
		headers: n
	};
}
async function Qu(e, t = Zu()) {
	if (!t) return [];
	let n = await fetch(t.url, {
		signal: e,
		headers: {
			accept: "application/json",
			...t.headers ?? {}
		}
	});
	if (!n.ok) throw Error(`Politician disclosure HTTP ${n.status}`);
	let r = await n.text(), i;
	try {
		i = JSON.parse(r);
	} catch {
		throw Error("Politician disclosure provider returned non-JSON");
	}
	return $u(i);
}
function $u(e) {
	let t = rd(e), n = [];
	for (let e of t) {
		let t = ed(e);
		t && n.push(t);
	}
	return n;
}
function ed(e) {
	let t = od(e, [
		"representative",
		"senator",
		"politician",
		"official",
		"name",
		"member"
	]);
	if (!t) return null;
	let n = od(e, [
		"office",
		"chamber",
		"district",
		"state",
		"party"
	]), r = nd(od(e, [
		"ticker",
		"symbol",
		"asset_ticker",
		"assetTicker"
	])), i = od(e, [
		"asset",
		"asset_description",
		"assetDescription",
		"company",
		"security",
		"issuer"
	]), a = td(od(e, [
		"type",
		"transaction_type",
		"transactionType",
		"action",
		"order_type"
	])), o = od(e, [
		"amount",
		"amount_range",
		"amountRange",
		"range",
		"value"
	]), s = od(e, [
		"link",
		"ptr_link",
		"ptrLink",
		"source",
		"url",
		"document_url"
	]), c = Xn(ad(e, [
		"transaction_date",
		"transactionDate",
		"tx_date",
		"traded",
		"date"
	])), l = Xn(ad(e, [
		"disclosure_date",
		"disclosureDate",
		"filed",
		"published",
		"report_date"
	])), u = l ?? c ?? Date.now(), d = `${t} — ${a} ${r || i || "undisclosed asset"}`, f = [
		`${n ? `${n}. ` : ""}Delayed public financial disclosure (not real-time trading).`,
		a === "unknown" ? "" : `Transaction: ${a}.`,
		o ? `Amount range: ${o}.` : "",
		c ? `Transaction date: ${new Date(c).toISOString().slice(0, 10)}.` : "",
		l ? `Disclosed: ${new Date(l).toISOString().slice(0, 10)}.` : "",
		r ? "" : "Ticker not provided by source; retained as unmapped disclosure."
	].filter((e) => e !== ""), p = [
		t,
		r || i,
		c ?? "",
		a,
		o
	].join("|").toLowerCase();
	return B({
		id: H(Xu, p),
		title: d,
		summary: f.join(" "),
		source: "Public official financial disclosure",
		url: s,
		observedAt: u,
		category: "public-disclosure",
		provenance: "public-disclosure",
		sourceId: Xu,
		dedupeKey: p,
		rawPayload: e,
		affectedAssets: r ? [r] : [],
		narrativeTags: R([
			"Public disclosure",
			"Official financial disclosure",
			a === "unknown" ? "" : `${a} disclosure`
		]),
		extractedEntities: R([
			t,
			n,
			i
		])
	});
}
function td(e) {
	let t = e.toLowerCase();
	return /(purchase|buy|acquire|bought)/.test(t) ? "purchase" : /(sale|sell|sold|dispos)/.test(t) ? "sale" : /exchange/.test(t) ? "exchange" : "unknown";
}
function nd(e) {
	let t = e.toUpperCase().replace(/[^A-Z0-9.-]/g, "");
	return /^[A-Z]{1,6}([.-][A-Z]{1,4})?$/.test(t) ? t : "";
}
function rd(e) {
	if (Array.isArray(e)) return e.filter(id);
	if (id(e)) for (let t of [
		"data",
		"transactions",
		"results",
		"disclosures",
		"items"
	]) {
		let n = e[t];
		if (Array.isArray(n)) return n.filter(id);
	}
	return [];
}
function id(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function ad(e, t) {
	for (let n of t) if (e[n] !== void 0 && e[n] !== null && e[n] !== "") return e[n];
}
function od(e, t) {
	return z(ad(e, t));
}
//#endregion
//#region electron/osint/adapters/rssAdapter.ts
async function sd(e, t) {
	if (!/^https?:\/\//i.test(t.url)) return [];
	let n = await fetch(t.url, {
		signal: e,
		headers: {
			"user-agent": "AtlaszIntel/0.4 (local-first world-intel; +https://github.com/gryszzz/Atlasz-Intel)",
			accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
			...t.headers ?? {}
		}
	});
	if (!n.ok) throw Error(`RSS ${t.sourceName} HTTP ${n.status}`);
	return cd(await n.text(), t);
}
function cd(e, t) {
	if (typeof e != "string" || !e.includes("<item") && !e.includes("<entry")) return [];
	let n = e.includes("<entry") && !e.includes("<item"), r = ld(e, n ? "entry" : "item"), i = [];
	for (let e of r) {
		let r = fd(ud(e, "title")), a = fd(n ? dd(e, "link", "href") || ud(e, "id") : ud(e, "link"));
		if (!r || !a) continue;
		let o = fd(ud(e, "description") || ud(e, "summary") || ud(e, "content")), s = ud(e, "pubDate") || ud(e, "updated") || ud(e, "published"), c = s ? Date.parse(s) : NaN, l = qt(`${r} ${o}`);
		i.push(Jt({
			id: H(t.sourceId, a),
			title: r,
			source: t.sourceName,
			url: a,
			sector: l.sector,
			impact: o || l.impact,
			observedAt: Number.isFinite(c) ? c : Date.now()
		}, {
			sourceId: t.sourceId,
			provenance: t.provenance
		}));
	}
	return i;
}
function ld(e, t) {
	return e.split(RegExp(`<${t}[\\s>]`, "i")).slice(1).map((e) => e.split(RegExp(`</${t}>`, "i"))[0] ?? "");
}
function ud(e, t) {
	let n = e.match(RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, "i"));
	return n ? z(n[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")) : "";
}
function dd(e, t, n) {
	let r = e.match(RegExp(`<${t}[^>]*\\b${n}="([^"]*)"`, "i"));
	return r ? r[1].trim() : "";
}
function fd(e) {
	return e.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").trim();
}
//#endregion
//#region electron/osint/adapters/customJsonAdapter.ts
async function pd(e, t) {
	if (!/^https?:\/\//i.test(t.url)) return [];
	let n = await fetch(t.url, {
		signal: e,
		headers: {
			accept: "application/json",
			...t.headers ?? {}
		}
	});
	if (!n.ok) throw Error(`Custom JSON ${t.sourceName} HTTP ${n.status}`);
	let r;
	try {
		r = JSON.parse(await n.text());
	} catch {
		throw Error(`Custom JSON ${t.sourceName} returned non-JSON`);
	}
	return md(r, t);
}
function md(e, t) {
	let n = hd(e), r = [];
	for (let e of n) {
		let n = gd(e.properties) ? {
			...e,
			...e.properties
		} : e, i = vd(n, [
			"title",
			"headline",
			"name",
			"full_name",
			"summary",
			"event"
		]), a = vd(n, [
			"url",
			"link",
			"html_url",
			"source_url",
			"sourceUrl",
			"permalink",
			"webcast_live"
		]);
		if (!i || !a) continue;
		let o = vd(n, [
			"summary",
			"description",
			"body",
			"content",
			"abstract",
			"mission"
		]), s = Xn(_d(n, [
			"timestamp",
			"date",
			"published",
			"publishedAt",
			"time",
			"net",
			"created_at",
			"updated_at",
			"pushed_at"
		])) ?? Date.now(), c = qt(`${i} ${o}`);
		r.push(Jt({
			id: H(t.sourceId, a),
			title: i,
			source: t.sourceName,
			url: a,
			sector: c.sector,
			impact: o || c.impact,
			observedAt: s
		}, {
			sourceId: t.sourceId,
			provenance: t.provenance
		}));
	}
	return r;
}
function hd(e) {
	if (Array.isArray(e)) return e.filter(gd);
	if (gd(e)) for (let t of [
		"items",
		"data",
		"results",
		"articles",
		"events",
		"features"
	]) {
		let n = e[t];
		if (Array.isArray(n)) return n.filter(gd);
	}
	return [];
}
function gd(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
function _d(e, t) {
	for (let n of t) if (e[n] !== void 0 && e[n] !== null && e[n] !== "") return e[n];
}
function vd(e, t) {
	return z(_d(e, t));
}
//#endregion
//#region electron/osint/adapterRegistry.ts
function yd(e, t = process.env) {
	switch (e.adapter) {
		case "gdelt": return {
			fetcher: Wn,
			configured: !0,
			managed: !1
		};
		case "sec-edgar": {
			let e = pr(t);
			return {
				fetcher: e ? (t) => mr(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "fred-macro": {
			let e = Hr(t);
			return {
				fetcher: e ? (t) => Ur(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "noaa-alerts": {
			let e = _i(t);
			return {
				fetcher: e ? (t) => vi(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "federal-register": {
			let e = ga(t);
			return {
				fetcher: e ? (t) => _a(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "ofac-sdn": {
			let e = za(t);
			return {
				fetcher: e ? (t) => Ba(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "treasury-fiscal": {
			let e = mo(t);
			return {
				fetcher: (t) => ho(t, e),
				configured: !0,
				managed: !1
			};
		}
		case "bls": {
			let e = Po(t);
			return {
				fetcher: e ? (t) => Fo(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "bea": {
			let e = ts(t);
			return {
				fetcher: e ? (t) => ns(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "eia-energy": {
			let e = ks(t);
			return {
				fetcher: e ? (t) => As(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "usgs-quakes": {
			let e = nc(t);
			return {
				fetcher: e ? (t) => rc(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "uspto-patents": {
			let e = Vi(t);
			return {
				fetcher: e ? (t) => Hi(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "cisa-kev": {
			let e = xc(t);
			return {
				fetcher: e ? (t) => Sc(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "nvd-cve": {
			let e = Uc(t);
			return {
				fetcher: e ? (t) => Wc(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "github-ghsa": {
			let e = gl(t);
			return {
				fetcher: e ? (t) => _l(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "osv-dev": {
			let e = Wl(t);
			return {
				fetcher: e ? (t) => Gl(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "cisa-advisories": {
			let e = hu(t);
			return {
				fetcher: e ? (t) => gu(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "github-releases": {
			let e = zu(t);
			return {
				fetcher: e ? (t) => Bu(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "public-disclosure-json": {
			let e = Zu(t);
			return {
				fetcher: e ? (t) => Qu(t, e) : void 0,
				configured: e !== null,
				managed: !1
			};
		}
		case "rss": {
			let t = bd(e.endpoint);
			return {
				fetcher: t ? (t) => sd(t, {
					url: e.endpoint,
					sourceId: e.providerId,
					sourceName: e.providerName,
					provenance: e.provenance
				}) : void 0,
				configured: t,
				managed: !1
			};
		}
		case "custom-json": {
			let t = bd(e.endpoint);
			return {
				fetcher: t ? (t) => pd(t, {
					url: e.endpoint,
					sourceId: e.providerId,
					sourceName: e.providerName,
					provenance: e.provenance
				}) : void 0,
				configured: t,
				managed: !1
			};
		}
		case "managed-ingest": return {
			configured: !0,
			managed: !0
		};
		default: return {
			configured: !1,
			managed: !1
		};
	}
}
function bd(e) {
	return !!(e && /^https?:\/\//i.test(e));
}
//#endregion
//#region electron/osint/sourceRegistry.ts
var xd = 2, Sd = 1e3, Cd = class {
	definitions;
	states = /* @__PURE__ */ new Map();
	constructor(e = {}) {
		this.definitions = wd(e);
		for (let e of this.definitions) this.states.set(e.sourceId, {
			status: e.enabled ? "idle" : "disabled",
			itemCount: 0,
			sourceReliabilityScore: +!!e.enabled,
			consecutiveFailures: 0
		});
	}
	snapshots() {
		return this.definitions.map((e) => this.toSnapshot(e));
	}
	async pollEnabledSources(e = Date.now()) {
		let t = [];
		for (let n of this.definitions) {
			if (!n.enabled || !n.fetcher) continue;
			let r = this.requireState(n.sourceId);
			if (r.lastAttemptAt && e - r.lastAttemptAt < n.rateLimitMs) {
				r.status = "rate-limited";
				continue;
			}
			r.lastAttemptAt = e;
			try {
				let e = await rr(n.fetcher, {
					maxRetries: n.maxRetries,
					backoffMs: n.backoffMs,
					timeoutMs: n.timeoutMs
				});
				r.status = "online", r.lastSuccessAt = Date.now(), r.lastError = void 0, r.itemCount += e.length, r.consecutiveFailures = 0, r.sourceReliabilityScore = Math.min(1, r.sourceReliabilityScore + .05), t.push(...e);
			} catch (e) {
				r.status = e instanceof Qn && e.status === 429 ? "rate-limited" : "failed", r.lastErrorAt = Date.now(), r.lastError = e instanceof Error ? e.message : String(e), r.consecutiveFailures += 1, r.sourceReliabilityScore = Math.max(.15, Number((r.sourceReliabilityScore * .82).toFixed(3)));
			}
		}
		return {
			events: Od(t),
			sources: this.snapshots()
		};
	}
	toSnapshot(e) {
		let t = this.requireState(e.sourceId);
		return {
			sourceId: e.sourceId,
			sourceName: e.sourceName,
			sourceType: e.sourceType,
			endpointType: e.endpointType,
			endpoint: e.endpoint,
			pollIntervalMs: e.pollIntervalMs,
			rateLimitMs: e.rateLimitMs,
			timeoutMs: e.timeoutMs,
			enabled: e.enabled,
			status: e.enabled ? t.status : "disabled",
			provenance: e.provenance,
			lastSuccessAt: t.lastSuccessAt,
			lastErrorAt: t.lastErrorAt,
			lastError: t.lastError,
			itemCount: t.itemCount,
			sourceReliabilityScore: t.sourceReliabilityScore,
			legalSafetyNote: e.legalSafetyNote,
			parserAdapter: e.parserAdapter,
			category: e.category,
			authType: e.authType,
			configured: e.configured,
			configHint: e.configHint
		};
	}
	requireState(e) {
		let t = this.states.get(e);
		if (!t) throw Error(`OSINT source state missing for ${e}`);
		return t;
	}
};
function wd(e) {
	let t = e.env ?? process.env, { providers: n } = Pn({ configPath: e.configPath ?? Dd(t) });
	return n.map((e) => Td(e, t));
}
function Td(e, t) {
	let n = yd(e, t), r = t.ATLASZ_ENABLE_PUBLIC_WORLD !== "0", i = n.managed ? !0 : n.configured, a = e.enabled && (n.managed ? !0 : r && i);
	return {
		sourceId: e.providerId,
		sourceName: e.providerName,
		sourceType: e.category,
		category: e.category,
		endpointType: Ed(e),
		endpoint: e.endpoint ?? "managed by existing Atlasz ingestion service",
		pollIntervalMs: e.pollIntervalMs ?? 0,
		rateLimitMs: e.rateLimitGuardMs ?? 0,
		timeoutMs: e.timeoutMs ?? 0,
		backoffMs: e.backoffMs ?? Sd,
		maxRetries: e.maxRetries ?? xd,
		enabled: a,
		authType: e.authType,
		configured: i,
		configHint: i ? void 0 : In(e),
		provenance: e.provenance,
		legalSafetyNote: e.legalSafetyNote,
		parserAdapter: e.adapter,
		fetcher: n.fetcher
	};
}
function Ed(e) {
	if (e.adapter === "disabled") return "placeholder";
	let t = Vn(e.providerId).feedTypes[0];
	return t === "RSS" ? "rss" : t === "WebSocket" ? "websocket" : t === "local" || t === "SQLite" ? "local" : t === "REST" ? "rest" : e.adapter === "rss" || e.adapter === "sec-edgar" ? "rss" : e.category === "crypto-realtime" ? "websocket" : "rest";
}
function Dd(e) {
	let t = e.ATLASZ_PROVIDER_CONFIG ?? e.ATLASZ_PROVIDERS_CONFIG;
	return t && t.trim() !== "" ? t : n(process.cwd(), "atlasz.providers.json");
}
function Od(e) {
	return [...new Map(e.map((e) => [e.dedupeHash, e])).values()];
}
//#endregion
//#region electron/worldIntelService.ts
var kd = class {
	persistence;
	registry = new Cd();
	assetIdentity;
	enabled = process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== "0";
	status = this.enabled ? "stale" : "disabled";
	lastError;
	updatedAt;
	inFlight = null;
	constructor(e) {
		this.persistence = e, this.assetIdentity = new Dn(e), this.persistSources(this.registry.snapshots());
	}
	snapshot() {
		return this.buildSnapshot();
	}
	refresh() {
		return this.enabled ? this.inFlight ? this.inFlight : (this.status = "fetching", this.inFlight = this.registry.pollEnabledSources().then(({ events: e, sources: t }) => {
			this.persistSources(t);
			let n = new Map(this.persistence.listWorldIntelEvents(1e3).map((e) => [e.id, e]));
			for (let t of e) this.persistWorldEvent(Ua(t, n.get(t.id)));
			let r = this.persistence.listWorldIntelEvents(300);
			this.persistCountryState(Yt(r)), this.assetIdentity.ensureForEvents(r), this.status = e.length > 0 || r.length > 0 ? "ready" : "stale", this.lastError = t.find((e) => e.status === "failed")?.lastError, this.updatedAt = Date.now();
			let i = this.buildSnapshot();
			return i.worldEvents.length > 0 && Ad(this.persistence, i), i;
		}).catch((e) => (this.lastError = e instanceof Error ? e.message : String(e), this.status = this.persistence.listWorldIntelEvents(1).length > 0 || this.persistence.listHeadlines(1).length > 0 ? "stale" : "failed", this.buildSnapshot())).finally(() => {
			this.inFlight = null;
		}), this.inFlight) : (this.status = "disabled", Promise.resolve(this.buildSnapshot()));
	}
	toggleFavorite(e, t, n) {
		return this.assetIdentity.toggleFavorite(e, t, n), this.buildSnapshot();
	}
	buildSnapshot() {
		let e = this.persistence.listHeadlines(120).map(Md), t = this.persistence.listWorldIntelEvents(300), n = new Set(t.map((e) => e.id)), r = e.filter((e) => !n.has(e.id)).map((e) => Jt(e, {
			sourceId: e.source || "legacy_world_headlines",
			provenance: this.status === "stale" ? "local-derived" : "public-unauthenticated"
		})), i = [...t, ...r].sort((e, t) => t.timestamp - e.timestamp), a = this.mergeCountries(this.persistence.listCountryIntelState(), Yt(i)), o = this.mergeAssetIdentities(this.assetIdentity.list(), Xt(i)), s = this.mergeSources(this.registry.snapshots(), this.persistence.listOsintSources()), c = this.persistence.listSecCompanyFilings(void 0, 120), l = this.persistence.listFredMacroObservations(void 0, 120), u = this.persistence.listTreasuryFiscalRecords(void 0, 120), d = this.persistence.listBeaObservations(void 0, 120), f = this.persistence.listEiaEnergyRecords(void 0, 120);
		return Ht({
			enabled: this.enabled,
			status: this.status,
			sourceTrust: this.status === "failed" ? "failed" : this.status === "stale" ? "stale" : this.enabled ? "public-unauthenticated" : "unavailable",
			connectorId: this.enabled ? "gdelt_doc_public" : "unavailable",
			connectorLabel: this.enabled ? "Atlasz OSINT source registry" : "Public world connector unavailable",
			updatedAt: this.updatedAt,
			lastError: this.lastError,
			headlines: e,
			worldEvents: i,
			countries: a,
			assetIdentities: o,
			secFilings: c,
			fredObservations: l,
			treasuryFiscalRecords: u,
			beaObservations: d,
			eiaEnergyRecords: f,
			favorites: this.persistence.listFavorites(),
			sources: s
		});
	}
	persistSources(e) {
		for (let t of e) this.safePersist(() => this.persistence.saveOsintSource(t));
	}
	persistWorldEvent(e) {
		e.secFiling && this.safePersist(() => this.persistence.saveSecCompanyFiling(e.secFiling)), e.fredObservation && this.safePersist(() => this.persistence.saveFredMacroObservation(e.fredObservation)), e.treasuryFiscalRecord && this.safePersist(() => this.persistence.saveTreasuryFiscalRecord(e.treasuryFiscalRecord)), e.beaObservation && this.safePersist(() => this.persistence.saveBeaObservation(e.beaObservation)), e.eiaEnergyRecord && this.safePersist(() => this.persistence.saveEiaEnergyRecord(e.eiaEnergyRecord)), this.safePersist(() => this.persistence.saveWorldIntelEvent(e)), this.safePersist(() => this.persistence.saveHeadline(jd(e)));
		for (let t of e.affectedAssets) this.safePersist(() => this.persistence.saveEventAssetLink({
			id: `world-event:${e.id}:${t}`,
			eventId: e.id,
			assetSymbol: t,
			relation: e.narrativeTags[0] ?? e.category,
			confidence: e.confidence / 100,
			createdAt: e.timestamp
		}));
	}
	persistCountryState(e) {
		for (let t of e) this.safePersist(() => this.persistence.saveCountryIntelState(t));
	}
	mergeSources(e, t) {
		return [...new Map([...t, ...e].map((e) => [e.sourceId, e])).values()];
	}
	mergeCountries(e, t) {
		return [...new Map([...t, ...e].map((e) => [e.countryCode, e])).values()].sort((e, t) => t.riskScore - e.riskScore);
	}
	mergeAssetIdentities(e, t) {
		let n = new Set(this.persistence.listFavorites().map((e) => e.targetId));
		return [...new Map([...t, ...e].map((e) => [e.symbol, e])).values()].map((e) => ({
			...e,
			favorite: n.has(e.symbol) || e.favorite
		})).sort((e, t) => e.symbol.localeCompare(t.symbol));
	}
	safePersist(e) {
		try {
			e();
		} catch (e) {
			try {
				this.persistence.audit({
					id: `audit-world-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
					eventType: "persistence_failed",
					connectorId: "world_intel_service",
					severity: "error",
					message: e instanceof Error ? e.message : String(e),
					createdAt: Date.now(),
					metadata: {}
				});
			} catch {}
		}
	}
};
function Ad(e, t) {
	let n = t.updatedAt ?? Date.now(), r = new Date(n).toISOString().slice(0, 10);
	for (let i of t.dailyBrief.slice(0, 5)) e.saveBrief({
		id: `world-${r}-${i.id}`,
		date: r,
		headline: i.headline,
		body: [
			i.whyItMatters,
			`Trust: ${t.sourceTrust}`,
			`Markets: ${i.relatedMarkets.join(", ")}`,
			`Uncertainty: ${i.uncertainty}`
		].join("\n"),
		severity: i.severity,
		confidence: i.confidence,
		createdAt: n
	});
}
function jd(e) {
	return {
		id: e.id,
		title: e.title,
		source: e.sourceId,
		url: e.sourceUrl ?? "",
		sector: String(e.category),
		impact: `${e.summary} Provenance: ${e.provenance}.`,
		observedAt: e.timestamp
	};
}
function Md(e) {
	return {
		id: e.id,
		title: e.title,
		source: e.source,
		url: e.url,
		sector: e.sector,
		impact: e.impact,
		observedAt: e.observedAt
	};
}
//#endregion
//#region electron/quant/quantMath.ts
function Nd(e) {
	return e.length === 0 ? null : e.reduce((e, t) => e + t, 0) / e.length;
}
function Pd(e) {
	if (e.length < 2) return null;
	let t = Nd(e);
	if (t === null) return null;
	let n = e.reduce((e, n) => e + (n - t) ** 2, 0) / (e.length - 1);
	return Math.sqrt(n);
}
function Fd(e) {
	if (e.length < 3) return null;
	let t = e.slice(0, -1), n = e[e.length - 1], r = Nd(t), i = Pd(t);
	return r === null || i === null || i === 0 ? null : (n - r) / i;
}
function Id(e) {
	let t = [];
	for (let n = 1; n < e.length; n += 1) {
		let r = e[n - 1];
		r !== 0 && t.push((e[n] - r) / r);
	}
	return t;
}
function Ld(e) {
	return Pd(Id(e));
}
function Rd(e) {
	if (e.length === 0) return null;
	let t = e[0];
	for (let n of e) n > t && (t = n);
	let n = e[e.length - 1];
	return t === 0 ? null : (n - t) / t * 100;
}
function zd(e, t = 10) {
	if (e.length < 2) return null;
	let n = e[e.length - 1], r = Nd(e.slice(Math.max(0, e.length - 1 - t), e.length - 1));
	return r === null || r === 0 ? null : n / r;
}
function Bd(e) {
	let t = 0, n = 0;
	for (let r of e) t += r.price * r.volume, n += r.volume;
	return n === 0 ? null : t / n;
}
function Vd(e) {
	if (e.length === 0) return null;
	let t = Bd(e);
	return t === null || t === 0 ? null : (e[e.length - 1].price - t) / t * 100;
}
function Hd(e, t) {
	let n = Math.min(e.length, t.length);
	if (n < 3) return null;
	let r = e.slice(e.length - n), i = t.slice(t.length - n), a = Nd(r), o = Nd(i);
	if (a === null || o === null) return null;
	let s = 0, c = 0, l = 0;
	for (let e = 0; e < n; e += 1) {
		let t = r[e] - a, n = i[e] - o;
		s += t * n, c += t * t, l += n * n;
	}
	return c === 0 || l === 0 ? null : s / Math.sqrt(c * l);
}
function Ud(e, t) {
	if (e.length < 2 || t.length < 2) return null;
	let n = Wd(e), r = Wd(t);
	return n === null || r === null ? null : (n - r) * 100;
}
function Wd(e) {
	if (e.length < 2) return null;
	let t = e[0], n = e[e.length - 1];
	return t === 0 ? null : (n - t) / t;
}
function Gd(e) {
	if (e.length < 2) return null;
	let t = e[0], n = e[e.length - 1];
	return t === 0 ? null : (n - t) / t * 100;
}
//#endregion
//#region electron/quant/eventOverlayService.ts
function Kd(e) {
	let t = e.assetSymbol.toUpperCase(), n = e.allowModelInferred ?? !1, r = e.maxMarkers ?? 50, i = [];
	for (let r of e.events) {
		if (r.timestamp < e.from || r.timestamp > e.to) continue;
		let a = qd(r, t);
		a && (a === "model-inferred" && !n || i.push({
			eventId: r.id,
			timestamp: r.timestamp,
			title: r.title,
			category: String(r.category),
			severity: r.severity,
			provenance: r.provenance,
			linkType: a
		}));
	}
	return i.sort((e, t) => e.timestamp - t.timestamp).slice(0, r);
}
function qd(e, t) {
	return e.affectedAssets.map((e) => e.toUpperCase()).includes(t) ? e.category === "macro-event" ? "macro-proxy" : e.provenance === "model-inferred" ? "model-inferred" : "direct-asset" : null;
}
//#endregion
//#region src/quant.ts
function Jd(e, t = Date.now()) {
	return {
		generatedAt: t,
		regime: "unavailable",
		regimeProvenance: "math-derived",
		regimeExplanation: e,
		metrics: [],
		fredObservations: [],
		treasuryFiscalRecords: [],
		beaObservations: [],
		eiaEnergyRecords: []
	};
}
function Yd(e, t, n = Date.now()) {
	return {
		assetSymbol: e,
		generatedAt: n,
		bars: [],
		metrics: [],
		markers: [],
		dataAvailable: !1,
		unavailableReason: t
	};
}
//#endregion
//#region electron/quant/quantComputeService.ts
var Xd = 12, Zd = 60, Qd = 3, $d = /(BTC|ETH|SOL|LINK|KAS|XRP|ADA|DOGE|AVAX|USDT?$|-USD$)/i, ef = class {
	source;
	constructor(e) {
		this.source = e;
	}
	computeSnapshots(e, t = {}) {
		return e.map((e) => this.computeAssetSnapshot(e, t));
	}
	computeAssetSnapshot(e, t = {}) {
		let n = t.now ?? Date.now(), r = this.loadBars(e);
		if (r.length < Xd) return Yd(e, `Insufficient price history (${r.length}/${Xd} bars) from current public sources.`, n);
		let i = sf(e), a = r.map((e) => e.price), o = r.map((e) => e.volume), s = Math.min(1, r.length / Zd), c = r[r.length - 1].time, l = [];
		l.push(tf({
			symbol: e,
			timestamp: c,
			name: "Volume velocity",
			value: zd(o),
			unit: "x",
			window: "10-bar",
			threshold: Qd,
			coverage: s,
			status: (e) => e >= Qd ? "anomaly" : e >= 2 ? "elevated" : "normal",
			explain: (e) => `Latest volume is ${e.toFixed(2)}× the 10-bar average.`,
			unavailable: "Not enough volume history to compute velocity."
		})), l.push(tf({
			symbol: e,
			timestamp: c,
			name: "Price z-score",
			value: Fd(a),
			unit: "σ",
			window: `${a.length}-bar`,
			threshold: 3,
			coverage: s,
			status: (e) => Math.abs(e) >= 3 ? "anomaly" : Math.abs(e) >= 2 ? "elevated" : "normal",
			explain: (e) => `Latest price is ${e.toFixed(2)}σ from its moving average.`,
			unavailable: "Not enough price history to compute a z-score."
		})), l.push(tf({
			symbol: e,
			timestamp: c,
			name: "VWAP deviation",
			value: Vd(r),
			unit: "%",
			window: "session",
			threshold: 5,
			coverage: s,
			status: (e) => Math.abs(e) >= 5 ? "anomaly" : Math.abs(e) >= 2 ? "elevated" : "normal",
			explain: (e) => `Latest price is ${e.toFixed(2)}% from session VWAP.`,
			unavailable: "Intraday data does not support a VWAP computation."
		})), l.push(tf({
			symbol: e,
			timestamp: c,
			name: "Realized volatility",
			value: af(Ld(a)),
			unit: "%",
			window: `${a.length}-bar`,
			coverage: s,
			status: () => "normal",
			explain: (e) => `Std. dev. of per-bar returns is ${e.toFixed(2)}%.`,
			unavailable: "Not enough returns to compute realized volatility."
		})), l.push(tf({
			symbol: e,
			timestamp: c,
			name: "Current drawdown",
			value: Rd(a),
			unit: "%",
			window: "window peak",
			threshold: -20,
			coverage: s,
			status: (e) => e <= -20 ? "anomaly" : e <= -10 ? "elevated" : "normal",
			explain: (e) => `Down ${Math.abs(e).toFixed(2)}% from the window peak.`,
			unavailable: "No price history to compute drawdown."
		}));
		let u = (i && i !== e ? this.loadBars(i) : []).map((e) => e.price), d = u.length >= Xd ? Ud(of(a, u), of(u, a)) : null;
		l.push(nf({
			symbol: e,
			timestamp: c,
			name: "Relative strength",
			value: d,
			unit: "%",
			benchmark: i,
			coverage: s,
			status: (e) => Math.abs(e) >= 10 ? "anomaly" : Math.abs(e) >= 5 ? "elevated" : "normal",
			explain: (e) => `${e >= 0 ? "Outperforming" : "Underperforming"} ${i} by ${Math.abs(e).toFixed(2)}% over the window.`,
			unavailable: i ? `Benchmark ${i} history unavailable from current public sources.` : "No benchmark configured for this asset class."
		}));
		let f = u.length >= Xd ? Hd(Id(of(a, u)), Id(of(u, a))) : null;
		return l.push(nf({
			symbol: e,
			timestamp: c,
			name: "Rolling correlation",
			value: f,
			unit: "r",
			benchmark: i,
			coverage: s,
			status: (e) => Math.abs(e) >= .8 ? "elevated" : "normal",
			explain: (e) => `Return correlation with ${i} is ${e.toFixed(2)}.`,
			unavailable: i ? `Benchmark ${i} history unavailable from current public sources.` : "No benchmark configured for this asset class."
		})), {
			assetSymbol: e,
			generatedAt: n,
			benchmark: i,
			bars: r,
			metrics: l,
			markers: Kd({
				events: t.events ?? [],
				assetSymbol: e,
				from: r[0].time,
				to: c,
				allowModelInferred: t.allowModelInferred
			}),
			dataAvailable: !0
		};
	}
	loadBars(e) {
		return this.source.listMarketTicks(e, 200).map((e) => ({
			time: e.observedAt,
			price: e.price,
			volume: e.volume
		})).filter((e) => Number.isFinite(e.price) && Number.isFinite(e.time)).sort((e, t) => e.time - t.time);
	}
};
function tf(e) {
	return rf(e, void 0, ["market_ticks_daily"], "math-derived");
}
function nf(e) {
	return rf({
		...e,
		window: "window"
	}, e.benchmark, ["market_ticks_daily", e.benchmark ? `benchmark:${e.benchmark}` : "benchmark:none"], "math-derived");
}
function rf(e, t, n, r) {
	let i = `${e.symbol}:${e.name}`.toLowerCase().replace(/\s+/g, "-");
	return e.value === null || !Number.isFinite(e.value) ? {
		id: i,
		assetSymbol: e.symbol,
		timestamp: e.timestamp,
		metricName: e.name,
		metricValue: null,
		unit: e.unit,
		window: e.window,
		benchmark: t,
		threshold: e.threshold,
		status: "unavailable",
		explanation: e.unavailable,
		provenance: r,
		inputSources: n,
		dataCoverage: e.coverage,
		confidence: 0,
		unavailableReason: e.unavailable
	} : {
		id: i,
		assetSymbol: e.symbol,
		timestamp: e.timestamp,
		metricName: e.name,
		metricValue: e.value,
		unit: e.unit,
		window: e.window,
		benchmark: t,
		threshold: e.threshold,
		status: e.status(e.value),
		explanation: e.explain(e.value),
		provenance: r,
		inputSources: n,
		dataCoverage: e.coverage,
		confidence: Math.max(.1, Math.min(.95, e.coverage))
	};
}
function af(e) {
	return e === null ? null : e * 100;
}
function of(e, t) {
	let n = Math.min(e.length, t.length);
	return e.slice(e.length - n);
}
function sf(e) {
	let t = e.toUpperCase();
	if ($d.test(t)) return "BTC";
	if (/^[A-Z]{1,5}$/.test(t)) return "SPY";
}
//#endregion
//#region electron/quant/macroComputeService.ts
function cf(e, t = Date.now()) {
	let n = [], r = lf(e);
	n.push(df({
		id: "yield-curve-10y2y",
		metricName: "10Y-2Y yield curve",
		metricValue: r.value,
		unit: "pp",
		inputSources: r.sources,
		explanation: r.value === null ? r.reason : `${r.value.toFixed(2)}pp (${r.value < 0 ? "inverted" : "positive"}).`,
		status: r.value === null ? "unavailable" : r.value < 0 ? "anomaly" : "normal",
		unavailableReason: r.value === null ? r.reason : void 0
	}));
	let i = e.dgs10 !== void 0 && e.dgs3mo !== void 0 ? ff(e.dgs10 - e.dgs3mo) : null;
	n.push(df({
		id: "yield-curve-10y3m",
		metricName: "10Y-3M yield curve",
		metricValue: i,
		unit: "pp",
		inputSources: ["FRED:DGS10", "FRED:DGS3MO"],
		explanation: i === null ? "10Y-3M unavailable from current sources." : `${i.toFixed(2)}pp.`,
		status: i === null ? "unavailable" : i < 0 ? "anomaly" : "normal",
		unavailableReason: i === null ? "10Y-3M unavailable from current sources." : void 0
	}));
	let a = e.dxySeries && e.dxySeries.length >= 2 ? Gd(e.dxySeries) : null;
	n.push(df({
		id: "dxy-momentum",
		metricName: "DXY momentum (liquidity-proxy)",
		metricValue: a,
		unit: "%",
		inputSources: ["FRED:DTWEXBGS"],
		explanation: a === null ? "Dollar-index history unavailable from current sources." : `Broad dollar index ${a >= 0 ? "up" : "down"} ${Math.abs(a).toFixed(2)}% over the window. Proxy only.`,
		status: a === null ? "unavailable" : Math.abs(a) >= 2 ? "elevated" : "normal",
		unavailableReason: a === null ? "Dollar-index history unavailable from current sources." : void 0
	}));
	let { regime: o, explanation: s } = uf(r.value, a);
	return o === "unavailable" ? {
		...Jd(s, t),
		metrics: n
	} : {
		generatedAt: t,
		regime: o,
		regimeProvenance: "math-derived",
		regimeExplanation: s,
		metrics: n,
		fredObservations: [],
		treasuryFiscalRecords: [],
		beaObservations: [],
		eiaEnergyRecords: []
	};
}
function lf(e) {
	return e.t10y2y !== void 0 && Number.isFinite(e.t10y2y) ? {
		value: ff(e.t10y2y),
		sources: ["FRED:T10Y2Y"],
		reason: ""
	} : e.dgs10 !== void 0 && e.dgs2 !== void 0 ? {
		value: ff(e.dgs10 - e.dgs2),
		sources: ["FRED:DGS10", "FRED:DGS2"],
		reason: ""
	} : {
		value: null,
		sources: [],
		reason: "Yield-curve series unavailable from current public sources."
	};
}
function uf(e, t) {
	if (e === null && t === null) return {
		regime: "unavailable",
		explanation: "Insufficient macro series to classify a regime."
	};
	let n = 0, r = [];
	return e !== null && (e < 0 ? (--n, r.push("inverted curve (risk-off)")) : (n += 1, r.push("positive curve (risk-on)"))), t !== null && (t > 1 ? (--n, r.push("rising dollar (risk-off)")) : t < -1 ? (n += 1, r.push("falling dollar (risk-on)")) : r.push("flat dollar")), {
		regime: n > 0 ? "risk-on" : n < 0 ? "risk-off" : "mixed",
		explanation: `Signals: ${r.join(", ")}.`
	};
}
function df(e) {
	return {
		...e,
		provenance: "math-derived"
	};
}
function ff(e) {
	return Math.round(e * 100) / 100;
}
var pf = "https://api.stlouisfed.org/fred";
async function mf(e, t = process.env) {
	let n = z(t.ATLASZ_FRED_API_KEY);
	if (!n) return null;
	let r = z(t.ATLASZ_FRED_BASE_URL) || pf, [i, a, o, s] = await Promise.all([
		hf(r, n, "T10Y2Y", e),
		hf(r, n, "DGS10", e),
		hf(r, n, "DGS2", e),
		hf(r, n, "DGS3MO", e)
	]);
	return {
		t10y2y: i,
		dgs10: a,
		dgs2: o,
		dgs3mo: s,
		dxySeries: await gf(r, n, "DTWEXBGS", 30, e)
	};
}
async function hf(e, t, n, r) {
	let i = await gf(e, t, n, 1, r);
	return i[i.length - 1];
}
async function gf(e, t, n, r, i) {
	let a = new URL(`${e}/series/observations`);
	a.searchParams.set("series_id", n), a.searchParams.set("api_key", t), a.searchParams.set("file_type", "json"), a.searchParams.set("sort_order", "desc"), a.searchParams.set("limit", String(r));
	let o = await fetch(a, {
		signal: i,
		headers: { accept: "application/json" }
	});
	if (!o.ok) throw Error(`FRED ${n} HTTP ${o.status}`);
	return ((await o.json()).observations ?? []).map((e) => Number(e.value)).filter((e) => Number.isFinite(e)).reverse();
}
//#endregion
//#region electron/quant/quantService.ts
var _f = 16, vf = 8e3, yf = [
	"SPY",
	"QQQ",
	"BTC",
	"AAPL",
	"MSFT",
	"NVDA"
], bf = class {
	persistence;
	compute;
	constructor(e) {
		this.persistence = e, this.compute = new ef(e);
	}
	async snapshot() {
		let e = Date.now(), t = this.resolveSymbols(), n = this.persistence.listWorldIntelEvents(300);
		return {
			generatedAt: e,
			assets: this.compute.computeSnapshots(t, {
				events: n,
				now: e
			}),
			macro: await this.macroSnapshot(e)
		};
	}
	resolveSymbols() {
		let e = this.persistence.listAssetIdentities().map((e) => e.symbol.toUpperCase());
		return [...new Set([...e, ...yf])].slice(0, _f);
	}
	async macroSnapshot(e) {
		let t = new AbortController(), n = setTimeout(() => t.abort(), vf);
		try {
			let n = await mf(t.signal);
			return n ? {
				...cf(n, e),
				fredObservations: this.persistence.listFredMacroObservations(void 0, 12),
				treasuryFiscalRecords: this.persistence.listTreasuryFiscalRecords(void 0, 12),
				beaObservations: this.persistence.listBeaObservations(void 0, 12),
				eiaEnergyRecords: this.persistence.listEiaEnergyRecords(void 0, 12)
			} : {
				...Jd("Macro series unavailable: configure ATLASZ_FRED_API_KEY (fail-closed).", e),
				fredObservations: this.persistence.listFredMacroObservations(void 0, 12),
				treasuryFiscalRecords: this.persistence.listTreasuryFiscalRecords(void 0, 12),
				beaObservations: this.persistence.listBeaObservations(void 0, 12),
				eiaEnergyRecords: this.persistence.listEiaEnergyRecords(void 0, 12)
			};
		} catch (t) {
			return {
				...Jd(`Macro series fetch failed: ${t instanceof Error ? t.message : String(t)}`, e),
				fredObservations: this.persistence.listFredMacroObservations(void 0, 12),
				treasuryFiscalRecords: this.persistence.listTreasuryFiscalRecords(void 0, 12),
				beaObservations: this.persistence.listBeaObservations(void 0, 12),
				eiaEnergyRecords: this.persistence.listEiaEnergyRecords(void 0, 12)
			};
		} finally {
			clearTimeout(n);
		}
	}
}, xf = "lexical-hash-v1", Sf = new Set(/* @__PURE__ */ "the.a.an.and.or.of.to.in.on.for.with.as.at.by.is.are.was.were.be.from.that.this.it.its.into.over.after.new".split("."));
function Cf(e) {
	return [
		e.title,
		e.summary,
		...e.extractedEntities,
		...e.narrativeTags,
		String(e.category)
	].join(" ").toLowerCase();
}
function wf(e) {
	return l("sha256").update(Cf(e)).digest("hex").slice(0, 32);
}
function Tf(e) {
	let t = Of(e);
	if (t.length === 0) return null;
	let n = Array(256).fill(0);
	for (let e of t) {
		let t = kf(e) % 256, r = kf(`${e}#sign`) & 1 ? -1 : 1;
		n[t] += r;
	}
	let r = Math.sqrt(n.reduce((e, t) => e + t * t, 0));
	return r === 0 ? null : n.map((e) => e / r);
}
function Ef(e) {
	return Tf(Cf(e));
}
function Df(e, t) {
	if (e.length !== t.length || e.length === 0) return 0;
	let n = 0;
	for (let r = 0; r < e.length; r += 1) n += e[r] * t[r];
	return Math.max(-1, Math.min(1, n));
}
function Of(e) {
	return e.toLowerCase().split(/[^a-z0-9]+/).filter((e) => e.length > 2 && !Sf.has(e));
}
function kf(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n += 1) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
	return t >>> 0;
}
//#endregion
//#region src/intel.ts
var Af = "HISTORICAL_PLAYBOOK_UNAVAILABLE", jf = "RETURN_PROFILE_UNAVAILABLE";
function Mf(e, t, n = Date.now()) {
	return {
		queryEventId: e,
		generatedAt: n,
		embeddingModel: "none",
		available: !1,
		unavailableReason: t,
		matches: []
	};
}
//#endregion
//#region electron/intel/historicalPlaybookService.ts
var Nf = 864e5, Pf = 3, Ff = class {
	source;
	constructor(e) {
		this.source = e;
	}
	playbookFor(e, t = {}) {
		let n = t.now ?? Date.now(), r = this.source.listWorldIntelEvents(400), i = r.find((t) => t.id === e);
		if (!i) return Mf(e, "Event not found in local store.", n);
		let a = this.ensureEmbeddings(r), o = a.get(e);
		if (!o) return Mf(e, `${Af}: no embedding for the query event.`, n);
		let s = r.filter((t) => t.timestamp < i.timestamp && t.id !== e && t.dedupeHash !== i.dedupeHash).map((e) => ({
			event: e,
			vector: a.get(e.id)
		})).filter((e) => !!e.vector).map((e) => ({
			event: e.event,
			similarity: Df(o, e.vector)
		})).sort((e, t) => t.similarity - e.similarity).slice(0, Pf);
		return s.length === 0 ? Mf(e, `${Af}: no prior comparable events (insufficient history).`, n) : {
			queryEventId: e,
			generatedAt: n,
			embeddingModel: xf,
			available: !0,
			matches: s.map((e) => this.toMatch(i, e.event, e.similarity))
		};
	}
	ensureEmbeddings(e) {
		let t = new Map(this.source.listWorldIntelEmbeddings(800).map((e) => [e.eventId, e])), n = /* @__PURE__ */ new Map();
		for (let r of e) {
			let e = wf(r), i = t.get(r.id);
			if (i && i.summaryHash === e && i.embeddingModel === "lexical-hash-v1" && i.embeddingVector.length === 256) {
				n.set(r.id, i.embeddingVector);
				continue;
			}
			let a = Ef(r);
			if (a) {
				n.set(r.id, a);
				try {
					this.source.saveWorldIntelEmbedding({
						id: `emb-${r.id}`,
						eventId: r.id,
						timestamp: r.timestamp,
						summaryHash: e,
						embeddingModel: xf,
						embeddingVector: a,
						sourceEventCategory: String(r.category),
						provenance: "local-computed",
						createdAt: Date.now()
					});
				} catch {}
			}
		}
		return n;
	}
	toMatch(e, t, n) {
		let r = Rf(e.affectedAssets, t.affectedAssets), i = Rf(e.narrativeTags, t.narrativeTags), a = [`${Math.round(n * 100)}% lexical similarity`];
		return e.category === t.category && a.push(`same category (${String(t.category)})`), r.length > 0 && a.push(`shared assets: ${r.slice(0, 4).join(", ")}`), i.length > 0 && a.push(`shared narrative: ${i.slice(0, 3).join(", ")}`), {
			eventId: t.id,
			title: t.title,
			timestamp: t.timestamp,
			category: String(t.category),
			similarity: n,
			linkedAssets: t.affectedAssets,
			matchReason: a.join(" · "),
			provenance: "local-computed",
			returnProfile: this.returnProfileFor(t)
		};
	}
	returnProfileFor(e) {
		for (let t of e.affectedAssets) {
			let n = this.source.listMarketTicks(t, 800).map((e) => ({
				price: e.price,
				time: e.observedAt
			})).filter((e) => Number.isFinite(e.price) && Number.isFinite(e.time)).sort((e, t) => e.time - t.time);
			if (n.length === 0) continue;
			let r = Lf(n, e.timestamp, 3 * Nf);
			if (r === null) continue;
			let i = If(n, e.timestamp, 1 * Nf, r), a = If(n, e.timestamp, 5 * Nf, r), o = If(n, e.timestamp, 7 * Nf, r);
			return {
				symbol: t,
				oneDayPct: i,
				fiveDayPct: a,
				sevenDayPct: o,
				provenance: "math-derived",
				unavailableReason: i === null && a === null && o === null ? jf : void 0
			};
		}
		return null;
	}
};
function If(e, t, n, r) {
	let i = Lf(e, t + n, 2 * Nf);
	return i === null || r === 0 ? null : (i - r) / r * 100;
}
function Lf(e, t, n) {
	let r = null, i = Infinity;
	for (let n of e) {
		let e = Math.abs(n.time - t);
		e < i && (r = n, i = e);
	}
	return !r || i > n ? null : r.price;
}
function Rf(e, t) {
	let n = new Set(t.map((e) => e.toUpperCase()));
	return [...new Set(e.filter((e) => n.has(e.toUpperCase())))];
}
//#endregion
//#region src/engine/decisionJournal.ts
function zf(e = Date.now()) {
	return {
		generatedAt: e,
		theses: [],
		openCount: 0,
		closedCount: 0,
		followThroughRate: null,
		evaluableCount: 0,
		byProvenance: [],
		priceDataAvailable: !1
	};
}
//#endregion
//#region electron/journal/thesisService.ts
var Bf = 864e5, Vf = class {
	persistence;
	quant;
	constructor(e) {
		this.persistence = e, this.quant = new ef(e);
	}
	save(e) {
		let t = Date.now(), n = String(e.assetSymbol || "").toUpperCase().trim();
		if (!n) return this.dashboard(t);
		let r = this.persistence.listWorldIntelEvents(300), i = Hf(this.quant.computeAssetSnapshot(n, {
			events: r,
			now: t
		})), a = {
			id: `thesis-${t}-${Math.random().toString(36).slice(2, 9)}`,
			timestamp: t,
			assetSymbol: n,
			thesisType: e.thesisType,
			triggerEventId: e.triggerEventId ?? null,
			snapshotMetrics: i,
			userNotes: String(e.userNotes ?? ""),
			targetHorizonDays: qf(e.targetHorizonDays, 1, 3650, 30),
			isClosed: !1,
			performanceGrade: null,
			entryPrice: i.price,
			currentReturn: null,
			oneDayReturn: null,
			sevenDayReturn: null,
			thirtyDayReturn: null,
			createdAt: t,
			updatedAt: t
		};
		return this.persistence.saveUserThesis(a), this.dashboard(t);
	}
	dashboard(e = Date.now()) {
		let t = this.persistence.listUserTheses(500);
		if (t.length === 0) return zf(e);
		let n = t.map((t) => this.markToMarket(t, e)), r = n.filter((e) => e.currentReturn !== null), i = r.filter((e) => Wf(e.thesisType, e.currentReturn)), a = r.length > 0 ? i.length / r.length : null;
		return {
			generatedAt: e,
			theses: n,
			openCount: n.filter((e) => !e.isClosed).length,
			closedCount: n.filter((e) => e.isClosed).length,
			followThroughRate: a,
			evaluableCount: r.length,
			byProvenance: Uf(n),
			priceDataAvailable: r.length > 0
		};
	}
	markToMarket(e, t) {
		let n = this.persistence.listMarketTicks(e.assetSymbol, 800).map((e) => ({
			price: e.price,
			time: e.observedAt
		})).filter((e) => Number.isFinite(e.price) && Number.isFinite(e.time)).sort((e, t) => e.time - t.time), r = e.entryPrice, i = n.length > 0 ? n[n.length - 1].price : null, a = r && r !== 0 && i !== null ? Jf((i - r) / r * 100) : null, o = (t) => {
			if (!r || r === 0) return null;
			let i = Kf(n, e.timestamp + t * Bf, 2 * Bf);
			return i === null ? null : Jf((i - r) / r * 100);
		};
		return {
			...e,
			currentReturn: a,
			oneDayReturn: o(1),
			sevenDayReturn: o(7),
			thirtyDayReturn: o(30),
			performanceGrade: a === null ? null : Gf(e.thesisType, a),
			updatedAt: t
		};
	}
};
function Hf(e) {
	let t = (t) => {
		let n = e.metrics.find((e) => e.metricName === t);
		return n && n.status !== "unavailable" ? n.metricValue : null;
	}, n = e.bars.length > 0 ? e.bars[e.bars.length - 1].price : null, r = new Set(e.metrics.filter((e) => e.status !== "unavailable").map((e) => e.provenance));
	e.markers.length > 0 && r.add("local-computed");
	let i = e.metrics.filter((e) => e.status !== "unavailable").map((e) => e.dataCoverage), a = i.length > 0 ? Jf(i.reduce((e, t) => e + t, 0) / i.length, 3) : null;
	return {
		price: n,
		volumeVelocity: t("Volume velocity"),
		zScore: t("Price z-score"),
		vwapDeviation: t("VWAP deviation"),
		realizedVolatility: t("Realized volatility"),
		drawdown: t("Current drawdown"),
		relativeStrength: t("Relative strength"),
		rollingCorrelation: t("Rolling correlation"),
		narrativePressure: null,
		activeProvenanceBadges: [...r],
		linkedEventIds: e.markers.map((e) => e.eventId),
		sourceCoverage: a
	};
}
function Uf(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.snapshotMetrics.activeProvenanceBadges[0] ?? "local-computed", r = t.get(e) ?? {
			count: 0,
			returns: []
		};
		r.count += 1, n.currentReturn !== null && r.returns.push(n.currentReturn), t.set(e, r);
	}
	return [...t.entries()].map(([e, t]) => ({
		provenance: e,
		count: t.count,
		avgReturn: t.returns.length > 0 ? Jf(t.returns.reduce((e, t) => e + t, 0) / t.returns.length) : null
	}));
}
function Wf(e, t) {
	return e === "Positive" ? t > 0 : e === "Negative" ? t < 0 : Math.abs(t) < 2;
}
function Gf(e, t) {
	return Wf(e, t) ? Math.abs(t) >= 5 ? "strong follow-through" : "follow-through" : Math.abs(t) >= 5 ? "counter-move" : "inline";
}
function Kf(e, t, n) {
	let r = null, i = Infinity;
	for (let n of e) {
		let e = Math.abs(n.time - t);
		e < i && (r = n, i = e);
	}
	return r && i <= n ? r.price : null;
}
function qf(e, t, n, r) {
	let i = Math.round(Number(e));
	return Number.isFinite(i) ? Math.max(t, Math.min(n, i)) : r;
}
function Jf(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
//#endregion
//#region src/engine/graphMutator.ts
var Yf = {
	Sovereign: "sovereign",
	Location: "location",
	Commodity: "commodity",
	Corporation: "corporation",
	Infrastructure: "infrastructure"
};
function Xf(e) {
	return e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}
function Zf(e) {
	return Math.min(1, Math.max(0, e));
}
var Qf = class {
	nodes = /* @__PURE__ */ new Map();
	adjacency = /* @__PURE__ */ new Map();
	decayFactor;
	purgeFloor;
	halfLifeMs;
	maxSilenceMs;
	now;
	constructor(e = {}) {
		this.decayFactor = e.decayFactor ?? .95, this.purgeFloor = e.purgeFloor ?? .05, this.halfLifeMs = e.halfLifeMs ?? 360 * 6e4, this.maxSilenceMs = e.maxSilenceMs ?? 1440 * 6e4, this.now = e.now ?? Date.now;
	}
	get nodeCount() {
		return this.nodes.size;
	}
	get edgeCount() {
		let e = 0;
		for (let t of this.adjacency.values()) e += t.length;
		return e;
	}
	upsertConnection(e) {
		let t = this.now(), n = e.confidence_metrics.score, r = `event:${Xf(e.event_summary)}`, i = [];
		this.ensureNode(r, e.event_summary, "event", t, e.primary_macro_theme) && i.push(r);
		for (let a of e.extracted_entities) {
			let o = `entity:${Xf(a.name)}`;
			this.ensureNode(o, a.name, Yf[a.type] ?? "infrastructure", t, e.primary_macro_theme) && i.push(o), this.reinforceEdge(r, o, "involves", .6, n, "Volatility_Expansion", t);
		}
		let a = 0, o = 0;
		for (let s of e.downstream_exposure_chain) {
			let c = `asset:${Xf(s.node_name)}`;
			this.ensureNode(c, s.node_name, "asset", t, e.primary_macro_theme) && i.push(c);
			let l = s.transmission_mechanism || s.exposure_direction, u = this.hasEdge(r, c);
			this.reinforceEdge(r, c, l, s.exposure_weight, n, s.exposure_direction, t), u ? o += 1 : a += 1;
		}
		return {
			eventId: r,
			eventSummary: e.event_summary,
			addedNodes: i,
			newEdges: a,
			reinforcedEdges: o
		};
	}
	upsertStaticEdge(e) {
		let t = this.now();
		this.ensureNode(e.source.id, e.source.label, e.source.kind, t), this.ensureNode(e.target.id, e.target.label, e.target.kind, t);
		let n = this.adjacency.get(e.source.id) ?? [], r = n.find((t) => t.target === e.target.id);
		if (r) {
			r.weight = Zf(e.weight), r.relation = e.relation, r.direction = e.direction ?? r.direction, r.provenance = e.provenance, r.confidence = Zf(e.confidence ?? e.weight), r.lastReinforcedAt = t, r.lastDecayedAt = t, r.reinforcements += 1;
			return;
		}
		n.push({
			source: e.source.id,
			target: e.target.id,
			relation: e.relation,
			weight: Zf(e.weight),
			direction: e.direction ?? "Volatility_Expansion",
			provenance: e.provenance,
			confidence: Zf(e.confidence ?? e.weight),
			createdAt: t,
			lastReinforcedAt: t,
			lastDecayedAt: t,
			reinforcements: 0
		}), this.adjacency.set(e.source.id, n);
	}
	applyGlobalEdgeDecay() {
		return this.applyTemporalEdgeDecay();
	}
	applyTemporalEdgeDecay(e = this.now()) {
		let t = 0, n = 0, r = Math.log(2) / this.halfLifeMs;
		for (let [i, a] of this.adjacency) {
			let o = [];
			for (let i of a) {
				if (i.provenance !== "model-inferred") {
					o.push(i);
					continue;
				}
				let a = Math.max(0, e - i.lastDecayedAt), s = Math.max(0, e - i.lastReinforcedAt);
				i.weight *= Number.isFinite(r) && r > 0 ? Math.exp(-r * a) : this.decayFactor, i.lastDecayedAt = e, t += 1, i.weight >= this.purgeFloor && s <= this.maxSilenceMs ? o.push(i) : n += 1;
			}
			o.length > 0 ? this.adjacency.set(i, o) : this.adjacency.delete(i);
		}
		return this.pruneOrphanNodes(), {
			decayed: t,
			purged: n
		};
	}
	getDownstreamImpactPath(e, t = .1) {
		if (!this.nodes.has(e)) return [];
		let n = new Set([e]), r = [{
			id: e,
			depth: 0
		}], i = [];
		for (; r.length > 0;) {
			let e = r.shift(), a = this.adjacency.get(e.id);
			if (a) for (let o of a) {
				if (o.weight <= t || n.has(o.target)) continue;
				n.add(o.target);
				let a = this.nodes.get(o.target);
				i.push({
					nodeId: o.target,
					label: a?.label ?? o.target,
					relation: o.relation,
					weight: o.weight,
					direction: o.direction,
					depth: e.depth + 1
				}), r.push({
					id: o.target,
					depth: e.depth + 1
				});
			}
		}
		return i.sort((e, t) => t.weight - e.weight);
	}
	neighbors(e) {
		return this.adjacency.get(e) ?? [];
	}
	getNode(e) {
		return this.nodes.get(e);
	}
	snapshot() {
		let e = [];
		for (let t of this.adjacency.values()) for (let n of t) e.push({ ...n });
		return {
			nodes: [...this.nodes.values()].map((e) => ({ ...e })),
			edges: e,
			nodeCount: this.nodes.size,
			edgeCount: e.length
		};
	}
	ensureNode(e, t, n, r, i) {
		let a = this.nodes.get(e);
		return a ? (a.lastSeen = r, i && (a.theme = i), !1) : (this.nodes.set(e, {
			id: e,
			label: t,
			kind: n,
			firstSeen: r,
			lastSeen: r,
			theme: i
		}), !0);
	}
	hasEdge(e, t) {
		return (this.adjacency.get(e) ?? []).some((e) => e.target === t);
	}
	reinforceEdge(e, t, n, r, i, a, o) {
		let s = this.adjacency.get(e) ?? [], c = r * i, l = s.find((e) => e.target === t);
		if (l) {
			l.weight = Math.min(1, l.weight + c), l.relation = n, l.direction = a, l.confidence = i, l.lastReinforcedAt = o, l.lastDecayedAt = o, l.reinforcements += 1;
			return;
		}
		s.push({
			source: e,
			target: t,
			relation: n,
			weight: Math.min(1, c),
			direction: a,
			provenance: "model-inferred",
			confidence: i,
			createdAt: o,
			lastReinforcedAt: o,
			lastDecayedAt: o,
			reinforcements: 0
		}), this.adjacency.set(e, s);
	}
	pruneOrphanNodes() {
		let e = /* @__PURE__ */ new Set();
		for (let [t, n] of this.adjacency) {
			e.add(t);
			for (let t of n) e.add(t.target);
		}
		for (let t of [...this.nodes.keys()]) e.has(t) || this.nodes.delete(t);
	}
}, $f = [
	"Geopolitical Choke Point",
	"Supply Chain Disruption",
	"Monetary Policy Shocks",
	"Tariff and Trade War Escalation",
	"Regulatory Constraints",
	"Resource Scarcity",
	"Commodity Shock"
], ep = [
	"Sovereign",
	"Location",
	"Commodity",
	"Corporation",
	"Infrastructure"
], tp = [
	"Bullish_Catalyst",
	"Bearish_Headwind",
	"Volatility_Expansion"
], np = {
	type: "object",
	properties: {
		event_summary: { type: "string" },
		primary_macro_theme: {
			type: "string",
			enum: [...$f]
		},
		extracted_entities: {
			type: "array",
			items: {
				type: "object",
				properties: {
					name: { type: "string" },
					type: {
						type: "string",
						enum: [...ep]
					}
				},
				required: ["name", "type"]
			}
		},
		downstream_exposure_chain: {
			type: "array",
			items: {
				type: "object",
				properties: {
					node_name: { type: "string" },
					exposure_direction: {
						type: "string",
						enum: [...tp]
					},
					exposure_weight: {
						type: "number",
						minimum: 0,
						maximum: 1
					},
					transmission_mechanism: { type: "string" }
				},
				required: [
					"node_name",
					"exposure_direction",
					"exposure_weight",
					"transmission_mechanism"
				]
			}
		},
		confidence_metrics: {
			type: "object",
			properties: {
				score: {
					type: "number",
					minimum: 0,
					maximum: 1
				},
				primary_uncertainty: { type: "string" }
			},
			required: ["score", "primary_uncertainty"]
		}
	},
	required: [
		"event_summary",
		"primary_macro_theme",
		"extracted_entities",
		"downstream_exposure_chain",
		"confidence_metrics"
	]
};
function rp(e) {
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
}
function ip(e) {
	return typeof e == "string" ? e.trim() : "";
}
function ap(e, t, n) {
	return typeof e == "string" && t.includes(e) ? e : n;
}
function op(e) {
	if (!e || typeof e != "object") return null;
	let t = e, n = ip(t.event_summary);
	if (n === "") return null;
	let r = (Array.isArray(t.extracted_entities) ? t.extracted_entities : []).map((e) => {
		if (!e || typeof e != "object") return null;
		let t = e, n = ip(t.name);
		return n === "" ? null : {
			name: n,
			type: ap(t.type, ep, "Infrastructure")
		};
	}).filter((e) => e !== null), i = (Array.isArray(t.downstream_exposure_chain) ? t.downstream_exposure_chain : []).map((e) => {
		if (!e || typeof e != "object") return null;
		let t = e, n = ip(t.node_name);
		return n === "" ? null : {
			node_name: n,
			exposure_direction: ap(t.exposure_direction, tp, "Volatility_Expansion"),
			exposure_weight: rp(t.exposure_weight),
			transmission_mechanism: ip(t.transmission_mechanism)
		};
	}).filter((e) => e !== null), a = t.confidence_metrics && typeof t.confidence_metrics == "object" ? t.confidence_metrics : {};
	return {
		event_summary: n,
		primary_macro_theme: ap(t.primary_macro_theme, $f, "Supply Chain Disruption"),
		extracted_entities: r,
		downstream_exposure_chain: i,
		confidence_metrics: {
			score: rp(a.score),
			primary_uncertainty: ip(a.primary_uncertainty)
		}
	};
}
//#endregion
//#region src/engine/cognitiveParser.ts
var sp = "You are the primary cognitive node of Atlasz Intel, a local financial intelligence engine. Map the physical and macro plumbing hidden behind unstructured text.\n\nRules:\n1. NO PROSE. Output must start with '{' and end with '}'. No preamble.\n2. Adhere 100% to the enforced JSON schema. Every field is required. Do not invent keys.\n3. Look past hype: identify structural dependencies — sectors, raw materials, shipping lanes, and corporate anchors in the blast radius.\n4. Be conservative with exposure weights. A direct refinery hit is ~1.0 exposure to its equity; a secondary consumer-goods tariff is ~0.3.\n5. Set confidence by verifiable facts in the text versus speculative narrative. State the biggest remaining uncertainty.", cp = class {
	endpoint;
	model;
	timeoutMs;
	fetchImpl;
	now;
	warn;
	constructor(e = {}) {
		this.endpoint = e.endpoint ?? "http://localhost:11434/api/chat", this.model = e.model ?? "qwen2.5-coder:7b", this.timeoutMs = e.timeoutMs ?? 2e4, this.fetchImpl = e.fetchImpl ?? (typeof fetch == "function" ? fetch : null), this.now = e.now ?? Date.now, this.warn = e.warn ?? ((e, t) => console.warn(`[atlasz] cognitive parser: ${e}`, t ?? ""));
	}
	async extract(e, t = {}) {
		let n = typeof e?.headline == "string" ? e.headline.trim() : "";
		if (n === "") return null;
		if (!this.fetchImpl) return this.warn("fetch is unavailable in this runtime; failing closed"), null;
		let r = t.timeoutMs && t.timeoutMs > 0 ? t.timeoutMs : this.timeoutMs, i = t.instruction ? `${sp}\n\n${t.instruction}` : sp, a = typeof e.context == "string" && e.context.trim() !== "" ? e.context.trim() : "", o = new AbortController(), s = setTimeout(() => o.abort(), r);
		try {
			let t = await this.fetchImpl(this.endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: o.signal,
				body: JSON.stringify({
					model: this.model,
					stream: !1,
					format: np,
					options: {
						temperature: 0,
						top_p: .1
					},
					messages: [{
						role: "system",
						content: i
					}, {
						role: "user",
						content: `Analyze the following market intelligence payload.\n\nTEXT: "${n}"\nSOURCE_TRAIL: ${e.source ?? "unknown"}${a ? `\nCONTEXT: ${a}` : ""}`
					}]
				})
			});
			if (!t.ok) return this.warn(`ollama returned non-200 (${t.status}); failing closed`), null;
			let r = await t.json(), s = typeof r?.message?.content == "string" ? r.message.content.trim() : "";
			if (s === "") return this.warn("ollama returned an empty response; failing closed"), null;
			let c;
			try {
				c = JSON.parse(s);
			} catch {
				return this.warn("ollama content was not valid JSON; failing closed"), null;
			}
			let l = lp(c), u = op(c);
			return u ? {
				extraction: u,
				validationIssueCount: l,
				source: "local-model",
				provenance: "model-inferred",
				model: this.model,
				observedAt: e.timestamp ?? this.now(),
				inputHeadline: n,
				inputSource: e.source ?? "unknown"
			} : (this.warn("extraction failed schema validation; failing closed"), null);
		} catch (e) {
			return this.warn("ollama request failed (down/timeout/network); failing closed", e instanceof Error ? e.message : e), null;
		} finally {
			clearTimeout(s);
		}
	}
	async isAvailable() {
		if (!this.fetchImpl) return !1;
		let e = this.endpoint.replace(/\/api\/chat\/?$/, "/api/tags"), t = new AbortController(), n = setTimeout(() => t.abort(), Math.min(this.timeoutMs, 2e3));
		try {
			return (await this.fetchImpl(e, {
				method: "GET",
				signal: t.signal
			})).ok;
		} catch {
			return !1;
		} finally {
			clearTimeout(n);
		}
	}
	async ingestInto(e, t) {
		let n = await this.extract(t);
		return n ? e.upsertConnection(n.extraction) : null;
	}
};
function lp(e) {
	if (!e || typeof e != "object") return 1;
	let t = e, n = 0;
	if ((typeof t.event_summary != "string" || t.event_summary.trim() === "") && (n += 1), Array.isArray(t.extracted_entities) || (n += 1), !Array.isArray(t.downstream_exposure_chain)) n += 1;
	else for (let e of t.downstream_exposure_chain) {
		if (!e || typeof e != "object") {
			n += 1;
			continue;
		}
		let t = e, r = typeof t.exposure_weight == "number" ? t.exposure_weight : Number(t.exposure_weight);
		(!Number.isFinite(r) || r < 0 || r > 1) && (n += 1);
	}
	return (!t.confidence_metrics || typeof t.confidence_metrics != "object") && (n += 1), n;
}
//#endregion
//#region electron/ingest/types.ts
function up(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n += 1) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(36);
}
function dp(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function fp(e) {
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : null;
}
//#endregion
//#region electron/ingest/cognitiveTaskManager.ts
var pp = class extends u {
	enabled;
	endpoint;
	model;
	initialTimeoutMs;
	minTimeoutMs;
	maxTimeoutMs;
	latencyWindowSize;
	timeoutScale;
	maxQueueSize;
	parser;
	queue = [];
	successfulDurationsMs = [];
	sourceReliability = /* @__PURE__ */ new Map();
	successfulExtractions = 0;
	failedExtractions = 0;
	validationFailures = 0;
	processing = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.enabled = e.enabled ?? process.env.ATLASZ_ENABLE_OLLAMA === "1", this.endpoint = e.endpoint ?? process.env.ATLASZ_OLLAMA_ENDPOINT ?? "http://localhost:11434/api/chat", this.model = e.model ?? process.env.ATLASZ_OLLAMA_MODEL ?? "qwen2.5:7b", this.initialTimeoutMs = e.requestTimeoutMs ?? 18e3, this.minTimeoutMs = e.minTimeoutMs ?? 3e3, this.maxTimeoutMs = e.maxTimeoutMs ?? 3e4, this.latencyWindowSize = e.latencyWindowSize ?? 8, this.timeoutScale = e.timeoutScale ?? 1.5, this.maxQueueSize = e.maxQueueSize ?? 250, this.parser = new cp({
			endpoint: this.endpoint,
			model: this.model,
			timeoutMs: this.maxTimeoutMs,
			fetchImpl: (e, t) => fetch(e, t)
		});
	}
	on(e, t) {
		return super.on(e, t);
	}
	enqueue(e, t = "deep") {
		this.enabled && (this.queue.length >= this.maxQueueSize && this.queue.shift(), this.queue.push({
			event: e,
			mode: t
		}), this.drain());
	}
	enqueueBatch(e) {
		if (!this.enabled || e.length === 0) return;
		let t = Math.max(...e.map((e) => e.observedAt)), n = [...new Set(e.map((e) => e.sourceName))], r = {
			id: `batch-${up(e.map((e) => e.id).join("|"))}`,
			title: `Batch summary of ${e.length} public market narratives`,
			sourceName: n.length === 1 ? n[0] : "Atlasz public narrative batch",
			sourceUrl: e[0].sourceUrl,
			sourceTrust: "local derived",
			publishedAt: t,
			observedAt: t,
			sector: "Batch macro narrative",
			summary: e.map((e) => e.title).slice(0, 8).join(" | "),
			rawText: e.map((e) => `${e.title}\n${e.summary}`).join("\n---\n").slice(0, 3600)
		};
		this.enqueue(r, "batch-summary");
	}
	clear() {
		this.queue.length = 0;
	}
	status() {
		return {
			enabled: this.enabled,
			queueLength: this.queue.length,
			rollingAverageLatencyMs: this.rollingAverageLatencyMs(),
			timeoutMs: this.currentTimeoutMs(),
			successfulExtractions: this.successfulExtractions,
			failedExtractions: this.failedExtractions,
			validationFailures: this.validationFailures,
			sourceReliability: Object.fromEntries([...this.sourceReliability.entries()])
		};
	}
	sourcePenalty(e) {
		return this.getSourceReliability(e).penalty;
	}
	sourcePenaltyCount() {
		return [...this.sourceReliability.values()].filter((e) => e.penalty < .9).length;
	}
	totalValidationFailures() {
		return this.validationFailures;
	}
	queueLength() {
		return this.queue.length;
	}
	currentTimeoutMs() {
		let e = this.rollingAverageLatencyMs();
		return e ? Math.round(dp(e * this.timeoutScale, this.minTimeoutMs, this.maxTimeoutMs)) : this.initialTimeoutMs;
	}
	rollingAverageLatencyMs() {
		if (this.successfulDurationsMs.length === 0) return;
		let e = this.successfulDurationsMs.reduce((e, t) => e + t, 0);
		return Math.round(e / this.successfulDurationsMs.length);
	}
	async drain() {
		if (!this.processing) {
			this.processing = !0;
			try {
				for (; this.queue.length > 0;) {
					let e = this.queue.shift();
					if (!e) continue;
					let t = await this.extract(e);
					t && this.emit("extraction", e.event, t.extraction, t.meta);
				}
			} finally {
				this.processing = !1;
			}
		}
	}
	async extract(e) {
		let { event: t, mode: n } = e, r = this.currentTimeoutMs(), i = Date.now();
		this.markAttempt(t.sourceName);
		let a = await this.parser.extract({
			headline: t.title,
			source: t.sourceName,
			timestamp: t.observedAt,
			context: `${t.summary}\n${t.rawText.slice(0, 1800)}`.trim()
		}, {
			timeoutMs: r,
			instruction: mp(n)
		});
		if (!a) return this.failedExtractions += 1, this.markFailure(t.sourceName), null;
		let o = Date.now() - i;
		this.recordSuccessfulDuration(o), a.validationIssueCount > 0 ? this.markFailure(t.sourceName, a.validationIssueCount) : this.markSuccess(t.sourceName);
		let s = this.sourcePenalty(t.sourceName);
		return this.successfulExtractions += 1, {
			extraction: hp(a.extraction, s),
			meta: {
				durationMs: o,
				timeoutMs: r,
				sourcePenalty: s,
				validationIssueCount: a.validationIssueCount,
				routeMode: n
			}
		};
	}
	recordSuccessfulDuration(e) {
		for (this.successfulDurationsMs.push(e); this.successfulDurationsMs.length > this.latencyWindowSize;) this.successfulDurationsMs.shift();
	}
	markAttempt(e) {
		let t = this.getSourceReliability(e);
		t.attempts += 1, this.recomputePenalty(t);
	}
	markSuccess(e) {
		let t = this.getSourceReliability(e);
		t.successes += 1, this.recomputePenalty(t);
	}
	markFailure(e, t = 1) {
		let n = this.getSourceReliability(e);
		n.validationFailures += 1, n.structuralIssues += Math.max(1, t), this.validationFailures += 1, this.recomputePenalty(n);
	}
	getSourceReliability(e) {
		let t = e || "unknown-source", n = this.sourceReliability.get(t);
		return n || (n = {
			attempts: 0,
			successes: 0,
			validationFailures: 0,
			structuralIssues: 0,
			penalty: 1
		}, this.sourceReliability.set(t, n)), n;
	}
	recomputePenalty(e) {
		let t = Math.max(1, e.attempts), n = e.validationFailures / t, r = Math.min(.35, e.structuralIssues * .035);
		e.penalty = Number(dp(1 - n * .65 - r, .25, 1).toFixed(3));
	}
};
function mp(e) {
	let t = "You convert public market/news text into strictly structured, non-predictive exposure mapping. Do not give trading advice. Return only JSON matching the schema.";
	return e === "batch-summary" ? `${t} This input is a high-velocity batch; summarize only the dominant shared macro theme and the strongest exposure chains.` : e === "keyword-priority" ? `${t} This input was selected during elevated narrative velocity; ignore weak tangential references and extract only high-conviction exposure links.` : t;
}
function hp(e, t) {
	return {
		...e,
		confidence_metrics: {
			...e.confidence_metrics,
			score: dp(e.confidence_metrics.score * t, 0, 1),
			primary_uncertainty: t < .95 ? `${e.confidence_metrics.primary_uncertainty} Source reliability penalty applied: ${t.toFixed(2)}.` : e.confidence_metrics.primary_uncertainty
		},
		downstream_exposure_chain: e.downstream_exposure_chain.map((e) => ({
			...e,
			exposure_weight: dp(e.exposure_weight * t, 0, 1)
		}))
	};
}
//#endregion
//#region electron/ingest/exposureMatrix.ts
var gp = [
	{
		keywords: [
			"taiwan",
			"tsmc",
			"semiconductor",
			"semiconductors",
			"chip",
			"chips",
			"advanced node"
		],
		tickers: [
			"TSM",
			"NVDA",
			"SOXX",
			"QQQ",
			"AAPL"
		],
		theme: "Semiconductor supply concentration",
		reason: "Taiwan and advanced-chip language maps to foundry concentration, AI hardware supply, and Nasdaq beta.",
		confidence: .74
	},
	{
		keywords: [
			"red sea",
			"suez",
			"houthi",
			"shipping",
			"freight",
			"tanker",
			"vessel",
			"route disruption"
		],
		tickers: [
			"ZIM",
			"XLE",
			"VLO",
			"CL",
			"DAL",
			"UAL"
		],
		theme: "Shipping and energy route risk",
		reason: "Shipping chokepoint language maps to freight cost, crude premium, refinery margins, and airline input costs.",
		confidence: .72
	},
	{
		keywords: [
			"tariff",
			"tariffs",
			"china",
			"trade war",
			"export control",
			"export controls",
			"sanctions"
		],
		tickers: [
			"AAPL",
			"TSLA",
			"FXI",
			"SOXX",
			"NVDA",
			"XLI"
		],
		theme: "Tariff and trade-policy escalation",
		reason: "Trade restriction language maps to cross-border margin pressure, supply-chain rerouting, and China demand risk.",
		confidence: .68
	},
	{
		keywords: [
			"rare earth",
			"rare earths",
			"critical minerals",
			"lithium",
			"battery materials",
			"magnets"
		],
		tickers: [
			"LIT",
			"TSLA",
			"GM",
			"XAR",
			"NVDA"
		],
		theme: "Strategic input scarcity",
		reason: "Critical-mineral language maps to EV batteries, defense electronics, and strategic inventory pressure.",
		confidence: .66
	},
	{
		keywords: [
			"inflation",
			"federal reserve",
			"fed",
			"rate cut",
			"rate cuts",
			"bond yields",
			"real yields",
			"cpi"
		],
		tickers: [
			"SPY",
			"QQQ",
			"TLT",
			"GLD",
			"BTC"
		],
		theme: "Monetary-policy and duration sensitivity",
		reason: "Rates and inflation language maps to duration equities, real-yield hedges, dollar pressure, and liquidity-sensitive assets.",
		confidence: .64
	},
	{
		keywords: [
			"oil",
			"crude",
			"opec",
			"wti",
			"brent",
			"refinery",
			"gasoline"
		],
		tickers: [
			"CL",
			"XLE",
			"VLO",
			"XOM",
			"CVX",
			"DAL"
		],
		theme: "Energy price transmission",
		reason: "Oil and refinery language maps to energy equities, refining margins, inflation impulse, and transport input costs.",
		confidence: .7
	},
	{
		keywords: [
			"natural gas",
			"lng",
			"pipeline",
			"gas storage",
			"europe energy",
			"energy security"
		],
		tickers: [
			"UNG",
			"VGK",
			"XLB",
			"XLE"
		],
		theme: "European energy security",
		reason: "Gas-storage and LNG language maps to European industrial margins, chemicals, and energy-sensitive equities.",
		confidence: .6
	},
	{
		keywords: [
			"ai",
			"artificial intelligence",
			"data center",
			"datacenter",
			"gpu",
			"compute",
			"capex"
		],
		tickers: [
			"NVDA",
			"QQQ",
			"SOXX",
			"MSFT",
			"AMZN"
		],
		theme: "AI compute and capex cycle",
		reason: "AI compute language maps to GPU demand, hyperscaler capex, semiconductor breadth, and mega-cap index exposure.",
		confidence: .62
	},
	{
		keywords: [
			"bitcoin",
			"crypto",
			"ethereum",
			"etf flows",
			"stablecoin",
			"coinbase"
		],
		tickers: [
			"BTC",
			"ETH",
			"COIN",
			"QQQ"
		],
		theme: "Crypto liquidity and market structure",
		reason: "Crypto-flow language maps to liquidity expectations, exchange exposure, and high-beta risk appetite.",
		confidence: .58
	}
];
function _p(e, t = `event:${up(e)}`) {
	let n = e.toLowerCase(), r = [];
	for (let e of gp) {
		let i = e.keywords.find((e) => n.includes(e));
		i && r.push({
			eventId: t,
			keyword: i,
			affectedTickers: e.tickers,
			confidence: e.confidence,
			reason: `${e.theme}: ${e.reason}`
		});
	}
	return vp(r);
}
function vp(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = t.get(n.keyword);
		if (!e) {
			t.set(n.keyword, n);
			continue;
		}
		t.set(n.keyword, {
			...e,
			affectedTickers: [...new Set([...e.affectedTickers, ...n.affectedTickers])],
			confidence: Math.max(e.confidence, n.confidence),
			reason: `${e.reason}; ${n.reason}`
		});
	}
	return [...t.values()];
}
//#endregion
//#region electron/ingest/polymarketGammaService.ts
var yp = "inflation OR fed OR election OR tariffs OR Taiwan OR oil OR recession", bp = class extends u {
	intervalMs;
	requestTimeoutMs;
	query;
	limit;
	timer = null;
	running = !1;
	seen = /* @__PURE__ */ new Map();
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.intervalMs = e.intervalMs ?? 5 * 6e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 12e3, this.query = e.query ?? yp, this.limit = e.limit ?? 40;
	}
	on(e, t) {
		return super.on(e, t);
	}
	start() {
		this.running || (this.running = !0, this.poll(), this.timer = setInterval(() => void this.poll(), this.intervalMs));
	}
	stop() {
		this.running = !1, this.timer &&= (clearInterval(this.timer), null);
	}
	async poll() {
		let e = new URL("https://gamma-api.polymarket.com/markets");
		e.searchParams.set("active", "true"), e.searchParams.set("closed", "false"), e.searchParams.set("limit", String(this.limit)), e.searchParams.set("q", this.query);
		let t = new AbortController(), n = setTimeout(() => t.abort(), this.requestTimeoutMs);
		try {
			let n = await fetch(e, {
				signal: t.signal,
				headers: {
					accept: "application/json",
					"user-agent": "AtlaszIntel/0.3 local-first polymarket connector"
				}
			});
			if (!n.ok) throw Error(`Polymarket Gamma HTTP ${n.status}`);
			let r = await n.json(), i = Array.isArray(r) ? r : [];
			for (let e of i) {
				let t = xp(e);
				!t || this.wasSeenRecently(t.id, t.probability) || (this.seen.set(t.id, t.probability), this.emit("probability", t));
			}
		} catch (e) {
			this.emit("error", e instanceof Error ? e : Error(String(e)));
		} finally {
			clearTimeout(n);
		}
	}
	wasSeenRecently(e, t) {
		let n = this.seen.get(e);
		return n !== void 0 && Math.abs(n - t) < .01;
	}
};
function xp(e) {
	let t = Tp(e.question) || Tp(e.title);
	if (!t) return null;
	let n = Sp(e);
	if (n === null) return null;
	let r = Tp(e.slug);
	return {
		id: `polymarket-${Tp(e.id) || up(t)}`,
		title: t,
		probability: n,
		sourceUrl: r ? `https://polymarket.com/event/${r}` : "https://polymarket.com/",
		observedAt: Date.now(),
		tags: wp(e.tags)
	};
}
function Sp(e) {
	let t = Cp(e.outcomePrices);
	if (t.length === 0) return null;
	let n = t.filter((e) => e >= .01 && e <= .99);
	return n.length === 0 ? null : Math.max(...n);
}
function Cp(e) {
	if (Array.isArray(e)) return e.map(fp).filter((e) => e !== null);
	if (typeof e == "string") try {
		return Cp(JSON.parse(e));
	} catch {
		return e.split(",").map((e) => fp(e.trim())).filter((e) => e !== null);
	}
	return [];
}
function wp(e) {
	return Array.isArray(e) ? e.map((e) => {
		if (typeof e == "string") return e;
		if (e && typeof e == "object") {
			let t = e;
			return Tp(t.label) || Tp(t.name);
		}
		return "";
	}).filter((e) => e.length > 0).slice(0, 5) : [];
}
function Tp(e) {
	return typeof e == "string" ? e.trim() : "";
}
//#endregion
//#region node_modules/xml2js/lib/defaults.js
var Ep = /* @__PURE__ */ v(((e) => {
	(function() {
		e.defaults = {
			"0.1": {
				explicitCharkey: !1,
				trim: !0,
				normalize: !0,
				normalizeTags: !1,
				attrkey: "@",
				charkey: "#",
				explicitArray: !1,
				ignoreAttrs: !1,
				mergeAttrs: !1,
				explicitRoot: !1,
				validator: null,
				xmlns: !1,
				explicitChildren: !1,
				childkey: "@@",
				charsAsChildren: !1,
				includeWhiteChars: !1,
				async: !1,
				strict: !0,
				attrNameProcessors: null,
				attrValueProcessors: null,
				tagNameProcessors: null,
				valueProcessors: null,
				emptyTag: ""
			},
			"0.2": {
				explicitCharkey: !1,
				trim: !1,
				normalize: !1,
				normalizeTags: !1,
				attrkey: "$",
				charkey: "_",
				explicitArray: !0,
				ignoreAttrs: !1,
				mergeAttrs: !1,
				explicitRoot: !0,
				validator: null,
				xmlns: !1,
				explicitChildren: !1,
				preserveChildrenOrder: !1,
				childkey: "$$",
				charsAsChildren: !1,
				includeWhiteChars: !1,
				async: !1,
				strict: !0,
				attrNameProcessors: null,
				attrValueProcessors: null,
				tagNameProcessors: null,
				valueProcessors: null,
				rootName: "root",
				xmldec: {
					version: "1.0",
					encoding: "UTF-8",
					standalone: !0
				},
				doctype: null,
				renderOpts: {
					pretty: !0,
					indent: "  ",
					newline: "\n"
				},
				headless: !1,
				chunkSize: 1e4,
				emptyTag: "",
				cdata: !1
			}
		};
	}).call(e);
})), Dp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c = [].slice, l = {}.hasOwnProperty;
		e = function() {
			var e, t, n, r, i, o = arguments[0];
			if (i = 2 <= arguments.length ? c.call(arguments, 1) : [], a(Object.assign)) Object.assign.apply(null, arguments);
			else for (e = 0, n = i.length; e < n; e++) if (r = i[e], r != null) for (t in r) l.call(r, t) && (o[t] = r[t]);
			return o;
		}, a = function(e) {
			return !!e && Object.prototype.toString.call(e) === "[object Function]";
		}, o = function(e) {
			var t;
			return !!e && ((t = typeof e) == "function" || t === "object");
		}, r = function(e) {
			return a(Array.isArray) ? Array.isArray(e) : Object.prototype.toString.call(e) === "[object Array]";
		}, i = function(e) {
			var t;
			if (r(e)) return !e.length;
			for (t in e) if (l.call(e, t)) return !1;
			return !0;
		}, s = function(e) {
			var t, n;
			return o(e) && (n = Object.getPrototypeOf(e)) && (t = n.constructor) && typeof t == "function" && t instanceof t && Function.prototype.toString.call(t) === Function.prototype.toString.call(Object);
		}, n = function(e) {
			return a(e.valueOf) ? e.valueOf() : e;
		}, t.exports.assign = e, t.exports.isFunction = a, t.exports.isObject = o, t.exports.isArray = r, t.exports.isEmpty = i, t.exports.isPlainObject = s, t.exports.getValue = n;
	}).call(e);
})), Op = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e() {}
			return e.prototype.hasFeature = function(e, t) {
				return !0;
			}, e.prototype.createDocumentType = function(e, t, n) {
				throw Error("This DOM method is not implemented.");
			}, e.prototype.createDocument = function(e, t, n) {
				throw Error("This DOM method is not implemented.");
			}, e.prototype.createHTMLDocument = function(e) {
				throw Error("This DOM method is not implemented.");
			}, e.prototype.getFeature = function(e, t) {
				throw Error("This DOM method is not implemented.");
			}, e;
		})();
	}).call(e);
})), kp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e() {}
			return e.prototype.handleError = function(e) {
				throw Error(e);
			}, e;
		})();
	}).call(e);
})), Ap = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e(e) {
				this.arr = e || [];
			}
			return Object.defineProperty(e.prototype, "length", { get: function() {
				return this.arr.length;
			} }), e.prototype.item = function(e) {
				return this.arr[e] || null;
			}, e.prototype.contains = function(e) {
				return this.arr.indexOf(e) !== -1;
			}, e;
		})();
	}).call(e);
})), jp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e = kp(), n = Ap();
		t.exports = (function() {
			function t() {
				this.defaultParams = {
					"canonical-form": !1,
					"cdata-sections": !1,
					comments: !1,
					"datatype-normalization": !1,
					"element-content-whitespace": !0,
					entities: !0,
					"error-handler": new e(),
					infoset: !0,
					"validate-if-schema": !1,
					namespaces: !0,
					"namespace-declarations": !0,
					"normalize-characters": !1,
					"schema-location": "",
					"schema-type": "",
					"split-cdata-sections": !0,
					validate: !1,
					"well-formed": !0
				}, this.params = Object.create(this.defaultParams);
			}
			return Object.defineProperty(t.prototype, "parameterNames", { get: function() {
				return new n(Object.keys(this.defaultParams));
			} }), t.prototype.getParameter = function(e) {
				return this.params.hasOwnProperty(e) ? this.params[e] : null;
			}, t.prototype.canSetParameter = function(e, t) {
				return !0;
			}, t.prototype.setParameter = function(e, t) {
				return t == null ? delete this.params[e] : this.params[e] = t;
			}, t;
		})();
	}).call(e);
})), q = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = {
			Element: 1,
			Attribute: 2,
			Text: 3,
			CData: 4,
			EntityReference: 5,
			EntityDeclaration: 6,
			ProcessingInstruction: 7,
			Comment: 8,
			Document: 9,
			DocType: 10,
			DocumentFragment: 11,
			NotationDeclaration: 12,
			Declaration: 201,
			Raw: 202,
			AttributeDeclaration: 203,
			ElementDeclaration: 204,
			Dummy: 205
		};
	}).call(e);
})), Mp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e = q();
		J(), t.exports = (function() {
			function t(t, n, r) {
				if (this.parent = t, this.parent && (this.options = this.parent.options, this.stringify = this.parent.stringify), n == null) throw Error("Missing attribute name. " + this.debugInfo(n));
				this.name = this.stringify.name(n), this.value = this.stringify.attValue(r), this.type = e.Attribute, this.isId = !1, this.schemaTypeInfo = null;
			}
			return Object.defineProperty(t.prototype, "nodeType", { get: function() {
				return this.type;
			} }), Object.defineProperty(t.prototype, "ownerElement", { get: function() {
				return this.parent;
			} }), Object.defineProperty(t.prototype, "textContent", {
				get: function() {
					return this.value;
				},
				set: function(e) {
					return this.value = e || "";
				}
			}), Object.defineProperty(t.prototype, "namespaceURI", { get: function() {
				return "";
			} }), Object.defineProperty(t.prototype, "prefix", { get: function() {
				return "";
			} }), Object.defineProperty(t.prototype, "localName", { get: function() {
				return this.name;
			} }), Object.defineProperty(t.prototype, "specified", { get: function() {
				return !0;
			} }), t.prototype.clone = function() {
				return Object.create(this);
			}, t.prototype.toString = function(e) {
				return this.options.writer.attribute(this, this.options.writer.filterOptions(e));
			}, t.prototype.debugInfo = function(e) {
				return e ||= this.name, e == null ? "parent: <" + this.parent.name + ">" : "attribute: {" + e + "}, parent: <" + this.parent.name + ">";
			}, t.prototype.isEqualNode = function(e) {
				return !(e.namespaceURI !== this.namespaceURI || e.prefix !== this.prefix || e.localName !== this.localName || e.value !== this.value);
			}, t;
		})();
	}).call(e);
})), Np = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e(e) {
				this.nodes = e;
			}
			return Object.defineProperty(e.prototype, "length", { get: function() {
				return Object.keys(this.nodes).length || 0;
			} }), e.prototype.clone = function() {
				return this.nodes = null;
			}, e.prototype.getNamedItem = function(e) {
				return this.nodes[e];
			}, e.prototype.setNamedItem = function(e) {
				var t = this.nodes[e.nodeName];
				return this.nodes[e.nodeName] = e, t || null;
			}, e.prototype.removeNamedItem = function(e) {
				var t = this.nodes[e];
				return delete this.nodes[e], t || null;
			}, e.prototype.item = function(e) {
				return this.nodes[Object.keys(this.nodes)[e]] || null;
			}, e.prototype.getNamedItemNS = function(e, t) {
				throw Error("This DOM method is not implemented.");
			}, e.prototype.setNamedItemNS = function(e) {
				throw Error("This DOM method is not implemented.");
			}, e.prototype.removeNamedItemNS = function(e, t) {
				throw Error("This DOM method is not implemented.");
			}, e;
		})();
	}).call(e);
})), Pp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l = function(e, t) {
			for (var n in t) u.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, u = {}.hasOwnProperty;
		c = Dp(), s = c.isObject, o = c.isFunction, a = c.getValue, i = J(), e = q(), n = Mp(), r = Np(), t.exports = (function(t) {
			l(i, t);
			function i(t, n, r) {
				var a, o, s, c;
				if (i.__super__.constructor.call(this, t), n == null) throw Error("Missing element name. " + this.debugInfo());
				if (this.name = this.stringify.name(n), this.type = e.Element, this.attribs = {}, this.schemaTypeInfo = null, r != null && this.attribute(r), t.type === e.Document && (this.isRoot = !0, this.documentObject = t, t.rootObject = this, t.children)) {
					for (c = t.children, o = 0, s = c.length; o < s; o++) if (a = c[o], a.type === e.DocType) {
						a.name = this.name;
						break;
					}
				}
			}
			return Object.defineProperty(i.prototype, "tagName", { get: function() {
				return this.name;
			} }), Object.defineProperty(i.prototype, "namespaceURI", { get: function() {
				return "";
			} }), Object.defineProperty(i.prototype, "prefix", { get: function() {
				return "";
			} }), Object.defineProperty(i.prototype, "localName", { get: function() {
				return this.name;
			} }), Object.defineProperty(i.prototype, "id", { get: function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			} }), Object.defineProperty(i.prototype, "className", { get: function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			} }), Object.defineProperty(i.prototype, "classList", { get: function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			} }), Object.defineProperty(i.prototype, "attributes", { get: function() {
				return (!this.attributeMap || !this.attributeMap.nodes) && (this.attributeMap = new r(this.attribs)), this.attributeMap;
			} }), i.prototype.clone = function() {
				var e, t, n = Object.create(this), r;
				for (t in n.isRoot && (n.documentObject = null), n.attribs = {}, r = this.attribs, r) u.call(r, t) && (e = r[t], n.attribs[t] = e.clone());
				return n.children = [], this.children.forEach(function(e) {
					var t = e.clone();
					return t.parent = n, n.children.push(t);
				}), n;
			}, i.prototype.attribute = function(e, t) {
				var r, i;
				if (e != null && (e = a(e)), s(e)) for (r in e) u.call(e, r) && (i = e[r], this.attribute(r, i));
				else o(t) && (t = t.apply()), this.options.keepNullAttributes && t == null ? this.attribs[e] = new n(this, e, "") : t != null && (this.attribs[e] = new n(this, e, t));
				return this;
			}, i.prototype.removeAttribute = function(e) {
				var t, n, r;
				if (e == null) throw Error("Missing attribute name. " + this.debugInfo());
				if (e = a(e), Array.isArray(e)) for (n = 0, r = e.length; n < r; n++) t = e[n], delete this.attribs[t];
				else delete this.attribs[e];
				return this;
			}, i.prototype.toString = function(e) {
				return this.options.writer.element(this, this.options.writer.filterOptions(e));
			}, i.prototype.att = function(e, t) {
				return this.attribute(e, t);
			}, i.prototype.a = function(e, t) {
				return this.attribute(e, t);
			}, i.prototype.getAttribute = function(e) {
				return this.attribs.hasOwnProperty(e) ? this.attribs[e].value : null;
			}, i.prototype.setAttribute = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getAttributeNode = function(e) {
				return this.attribs.hasOwnProperty(e) ? this.attribs[e] : null;
			}, i.prototype.setAttributeNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.removeAttributeNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagName = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getAttributeNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.setAttributeNS = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.removeAttributeNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getAttributeNodeNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.setAttributeNodeNS = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagNameNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.hasAttribute = function(e) {
				return this.attribs.hasOwnProperty(e);
			}, i.prototype.hasAttributeNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.setIdAttribute = function(e, t) {
				return this.attribs.hasOwnProperty(e) ? this.attribs[e].isId : t;
			}, i.prototype.setIdAttributeNS = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.setIdAttributeNode = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagName = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagNameNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByClassName = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.isEqualNode = function(e) {
				var t, n, r;
				if (!i.__super__.isEqualNode.apply(this, arguments).isEqualNode(e) || e.namespaceURI !== this.namespaceURI || e.prefix !== this.prefix || e.localName !== this.localName || e.attribs.length !== this.attribs.length) return !1;
				for (t = n = 0, r = this.attribs.length - 1; 0 <= r ? n <= r : n >= r; t = 0 <= r ? ++n : --n) if (!this.attribs[t].isEqualNode(e.attribs[t])) return !1;
				return !0;
			}, i;
		})(i);
	}).call(e);
})), Fp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n = function(e, t) {
			for (var n in t) r.call(t, n) && (e[n] = t[n]);
			function i() {
				this.constructor = e;
			}
			return i.prototype = t.prototype, e.prototype = new i(), e.__super__ = t.prototype, e;
		}, r = {}.hasOwnProperty;
		e = J(), t.exports = (function(e) {
			n(t, e);
			function t(e) {
				t.__super__.constructor.call(this, e), this.value = "";
			}
			return Object.defineProperty(t.prototype, "data", {
				get: function() {
					return this.value;
				},
				set: function(e) {
					return this.value = e || "";
				}
			}), Object.defineProperty(t.prototype, "length", { get: function() {
				return this.value.length;
			} }), Object.defineProperty(t.prototype, "textContent", {
				get: function() {
					return this.value;
				},
				set: function(e) {
					return this.value = e || "";
				}
			}), t.prototype.clone = function() {
				return Object.create(this);
			}, t.prototype.substringData = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.appendData = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.insertData = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.deleteData = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.replaceData = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.isEqualNode = function(e) {
				return !(!t.__super__.isEqualNode.apply(this, arguments).isEqualNode(e) || e.data !== this.data);
			}, t;
		})(e);
	}).call(e);
})), Ip = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = Fp(), t.exports = (function(t) {
			r(n, t);
			function n(t, r) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing CDATA text. " + this.debugInfo());
				this.name = "#cdata-section", this.type = e.CData, this.value = this.stringify.cdata(r);
			}
			return n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return this.options.writer.cdata(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Lp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = Fp(), t.exports = (function(t) {
			r(n, t);
			function n(t, r) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing comment text. " + this.debugInfo());
				this.name = "#comment", this.type = e.Comment, this.value = this.stringify.comment(r);
			}
			return n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return this.options.writer.comment(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Rp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		r = Dp().isObject, n = J(), e = q(), t.exports = (function(t) {
			i(n, t);
			function n(t, i, a, o) {
				var s;
				n.__super__.constructor.call(this, t), r(i) && (s = i, i = s.version, a = s.encoding, o = s.standalone), i ||= "1.0", this.type = e.Declaration, this.version = this.stringify.xmlVersion(i), a != null && (this.encoding = this.stringify.xmlEncoding(a)), o != null && (this.standalone = this.stringify.xmlStandalone(o));
			}
			return n.prototype.toString = function(e) {
				return this.options.writer.declaration(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), zp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		n = J(), e = q(), t.exports = (function(t) {
			r(n, t);
			function n(t, r, i, a, o, s) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing DTD element name. " + this.debugInfo());
				if (i == null) throw Error("Missing DTD attribute name. " + this.debugInfo(r));
				if (!a) throw Error("Missing DTD attribute type. " + this.debugInfo(r));
				if (!o) throw Error("Missing DTD attribute default. " + this.debugInfo(r));
				if (o.indexOf("#") !== 0 && (o = "#" + o), !o.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) throw Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(r));
				if (s && !o.match(/^(#FIXED|#DEFAULT)$/)) throw Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(r));
				this.elementName = this.stringify.name(r), this.type = e.AttributeDeclaration, this.attributeName = this.stringify.name(i), this.attributeType = this.stringify.dtdAttType(a), s && (this.defaultValue = this.stringify.dtdAttDefault(s)), this.defaultValueType = o;
			}
			return n.prototype.toString = function(e) {
				return this.options.writer.dtdAttList(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Bp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		r = Dp().isObject, n = J(), e = q(), t.exports = (function(t) {
			i(n, t);
			function n(t, i, a, o) {
				if (n.__super__.constructor.call(this, t), a == null) throw Error("Missing DTD entity name. " + this.debugInfo(a));
				if (o == null) throw Error("Missing DTD entity value. " + this.debugInfo(a));
				if (this.pe = !!i, this.name = this.stringify.name(a), this.type = e.EntityDeclaration, !r(o)) this.value = this.stringify.dtdEntityValue(o), this.internal = !0;
				else {
					if (!o.pubID && !o.sysID) throw Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(a));
					if (o.pubID && !o.sysID) throw Error("System identifier is required for a public external entity. " + this.debugInfo(a));
					if (this.internal = !1, o.pubID != null && (this.pubID = this.stringify.dtdPubID(o.pubID)), o.sysID != null && (this.sysID = this.stringify.dtdSysID(o.sysID)), o.nData != null && (this.nData = this.stringify.dtdNData(o.nData)), this.pe && this.nData) throw Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(a));
				}
			}
			return Object.defineProperty(n.prototype, "publicId", { get: function() {
				return this.pubID;
			} }), Object.defineProperty(n.prototype, "systemId", { get: function() {
				return this.sysID;
			} }), Object.defineProperty(n.prototype, "notationName", { get: function() {
				return this.nData || null;
			} }), Object.defineProperty(n.prototype, "inputEncoding", { get: function() {
				return null;
			} }), Object.defineProperty(n.prototype, "xmlEncoding", { get: function() {
				return null;
			} }), Object.defineProperty(n.prototype, "xmlVersion", { get: function() {
				return null;
			} }), n.prototype.toString = function(e) {
				return this.options.writer.dtdEntity(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Vp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		n = J(), e = q(), t.exports = (function(t) {
			r(n, t);
			function n(t, r, i) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing DTD element name. " + this.debugInfo());
				i ||= "(#PCDATA)", Array.isArray(i) && (i = "(" + i.join(",") + ")"), this.name = this.stringify.name(r), this.type = e.ElementDeclaration, this.value = this.stringify.dtdElementValue(i);
			}
			return n.prototype.toString = function(e) {
				return this.options.writer.dtdElement(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Hp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		n = J(), e = q(), t.exports = (function(t) {
			r(n, t);
			function n(t, r, i) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing DTD notation name. " + this.debugInfo(r));
				if (!i.pubID && !i.sysID) throw Error("Public or system identifiers are required for an external entity. " + this.debugInfo(r));
				this.name = this.stringify.name(r), this.type = e.NotationDeclaration, i.pubID != null && (this.pubID = this.stringify.dtdPubID(i.pubID)), i.sysID != null && (this.sysID = this.stringify.dtdSysID(i.sysID));
			}
			return Object.defineProperty(n.prototype, "publicId", { get: function() {
				return this.pubID;
			} }), Object.defineProperty(n.prototype, "systemId", { get: function() {
				return this.sysID;
			} }), n.prototype.toString = function(e) {
				return this.options.writer.dtdNotation(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Up = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l = function(e, t) {
			for (var n in t) u.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, u = {}.hasOwnProperty;
		c = Dp().isObject, s = J(), e = q(), n = zp(), i = Bp(), r = Vp(), a = Hp(), o = Np(), t.exports = (function(t) {
			l(s, t);
			function s(t, n, r) {
				var i, a, o, l, u, d;
				if (s.__super__.constructor.call(this, t), this.type = e.DocType, t.children) {
					for (l = t.children, a = 0, o = l.length; a < o; a++) if (i = l[a], i.type === e.Element) {
						this.name = i.name;
						break;
					}
				}
				this.documentObject = t, c(n) && (u = n, n = u.pubID, r = u.sysID), r ?? (d = [n, r], r = d[0], n = d[1]), n != null && (this.pubID = this.stringify.dtdPubID(n)), r != null && (this.sysID = this.stringify.dtdSysID(r));
			}
			return Object.defineProperty(s.prototype, "entities", { get: function() {
				var t, n, r, i = {}, a = this.children;
				for (n = 0, r = a.length; n < r; n++) t = a[n], t.type === e.EntityDeclaration && !t.pe && (i[t.name] = t);
				return new o(i);
			} }), Object.defineProperty(s.prototype, "notations", { get: function() {
				var t, n, r, i = {}, a = this.children;
				for (n = 0, r = a.length; n < r; n++) t = a[n], t.type === e.NotationDeclaration && (i[t.name] = t);
				return new o(i);
			} }), Object.defineProperty(s.prototype, "publicId", { get: function() {
				return this.pubID;
			} }), Object.defineProperty(s.prototype, "systemId", { get: function() {
				return this.sysID;
			} }), Object.defineProperty(s.prototype, "internalSubset", { get: function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			} }), s.prototype.element = function(e, t) {
				var n = new r(this, e, t);
				return this.children.push(n), this;
			}, s.prototype.attList = function(e, t, r, i, a) {
				var o = new n(this, e, t, r, i, a);
				return this.children.push(o), this;
			}, s.prototype.entity = function(e, t) {
				var n = new i(this, !1, e, t);
				return this.children.push(n), this;
			}, s.prototype.pEntity = function(e, t) {
				var n = new i(this, !0, e, t);
				return this.children.push(n), this;
			}, s.prototype.notation = function(e, t) {
				var n = new a(this, e, t);
				return this.children.push(n), this;
			}, s.prototype.toString = function(e) {
				return this.options.writer.docType(this, this.options.writer.filterOptions(e));
			}, s.prototype.ele = function(e, t) {
				return this.element(e, t);
			}, s.prototype.att = function(e, t, n, r, i) {
				return this.attList(e, t, n, r, i);
			}, s.prototype.ent = function(e, t) {
				return this.entity(e, t);
			}, s.prototype.pent = function(e, t) {
				return this.pEntity(e, t);
			}, s.prototype.not = function(e, t) {
				return this.notation(e, t);
			}, s.prototype.up = function() {
				return this.root() || this.documentObject;
			}, s.prototype.isEqualNode = function(e) {
				return !(!s.__super__.isEqualNode.apply(this, arguments).isEqualNode(e) || e.name !== this.name || e.publicId !== this.publicId || e.systemId !== this.systemId);
			}, s;
		})(s);
	}).call(e);
})), Wp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = J(), t.exports = (function(t) {
			r(n, t);
			function n(t, r) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing raw text. " + this.debugInfo());
				this.type = e.Raw, this.value = this.stringify.raw(r);
			}
			return n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return this.options.writer.raw(this, this.options.writer.filterOptions(e));
			}, n;
		})(n);
	}).call(e);
})), Gp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = Fp(), t.exports = (function(t) {
			r(n, t);
			function n(t, r) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing element text. " + this.debugInfo());
				this.name = "#text", this.type = e.Text, this.value = this.stringify.text(r);
			}
			return Object.defineProperty(n.prototype, "isElementContentWhitespace", { get: function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			} }), Object.defineProperty(n.prototype, "wholeText", { get: function() {
				var e, t, n = "";
				for (t = this.previousSibling; t;) n = t.data + n, t = t.previousSibling;
				for (n += this.data, e = this.nextSibling; e;) n += e.data, e = e.nextSibling;
				return n;
			} }), n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return this.options.writer.text(this, this.options.writer.filterOptions(e));
			}, n.prototype.splitText = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, n.prototype.replaceWholeText = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, n;
		})(n);
	}).call(e);
})), Kp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = Fp(), t.exports = (function(t) {
			r(n, t);
			function n(t, r, i) {
				if (n.__super__.constructor.call(this, t), r == null) throw Error("Missing instruction target. " + this.debugInfo());
				this.type = e.ProcessingInstruction, this.target = this.stringify.insTarget(r), this.name = this.target, i && (this.value = this.stringify.insValue(i));
			}
			return n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return this.options.writer.processingInstruction(this, this.options.writer.filterOptions(e));
			}, n.prototype.isEqualNode = function(e) {
				return !(!n.__super__.isEqualNode.apply(this, arguments).isEqualNode(e) || e.target !== this.target);
			}, n;
		})(n);
	}).call(e);
})), qp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		n = J(), e = q(), t.exports = (function(t) {
			r(n, t);
			function n(t) {
				n.__super__.constructor.call(this, t), this.type = e.Dummy;
			}
			return n.prototype.clone = function() {
				return Object.create(this);
			}, n.prototype.toString = function(e) {
				return "";
			}, n;
		})(n);
	}).call(e);
})), Jp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e(e) {
				this.nodes = e;
			}
			return Object.defineProperty(e.prototype, "length", { get: function() {
				return this.nodes.length || 0;
			} }), e.prototype.clone = function() {
				return this.nodes = null;
			}, e.prototype.item = function(e) {
				return this.nodes[e] || null;
			}, e;
		})();
	}).call(e);
})), Yp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = {
			Disconnected: 1,
			Preceding: 2,
			Following: 4,
			Contains: 8,
			ContainedBy: 16,
			ImplementationSpecific: 32
		};
	}).call(e);
})), J = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v = {}.hasOwnProperty;
		_ = Dp(), g = _.isObject, h = _.isFunction, m = _.isEmpty, p = _.getValue, c = null, r = null, i = null, a = null, o = null, d = null, f = null, u = null, s = null, n = null, l = null, e = null, t.exports = (function() {
			function t(t) {
				this.parent = t, this.parent && (this.options = this.parent.options, this.stringify = this.parent.stringify), this.value = null, this.children = [], this.baseURI = null, c || (c = Pp(), r = Ip(), i = Lp(), a = Rp(), o = Up(), d = Wp(), f = Gp(), u = Kp(), s = qp(), n = q(), l = Jp(), Np(), e = Yp());
			}
			return Object.defineProperty(t.prototype, "nodeName", { get: function() {
				return this.name;
			} }), Object.defineProperty(t.prototype, "nodeType", { get: function() {
				return this.type;
			} }), Object.defineProperty(t.prototype, "nodeValue", { get: function() {
				return this.value;
			} }), Object.defineProperty(t.prototype, "parentNode", { get: function() {
				return this.parent;
			} }), Object.defineProperty(t.prototype, "childNodes", { get: function() {
				return (!this.childNodeList || !this.childNodeList.nodes) && (this.childNodeList = new l(this.children)), this.childNodeList;
			} }), Object.defineProperty(t.prototype, "firstChild", { get: function() {
				return this.children[0] || null;
			} }), Object.defineProperty(t.prototype, "lastChild", { get: function() {
				return this.children[this.children.length - 1] || null;
			} }), Object.defineProperty(t.prototype, "previousSibling", { get: function() {
				var e = this.parent.children.indexOf(this);
				return this.parent.children[e - 1] || null;
			} }), Object.defineProperty(t.prototype, "nextSibling", { get: function() {
				var e = this.parent.children.indexOf(this);
				return this.parent.children[e + 1] || null;
			} }), Object.defineProperty(t.prototype, "ownerDocument", { get: function() {
				return this.document() || null;
			} }), Object.defineProperty(t.prototype, "textContent", {
				get: function() {
					var e, t, r, i, a;
					if (this.nodeType === n.Element || this.nodeType === n.DocumentFragment) {
						for (a = "", i = this.children, t = 0, r = i.length; t < r; t++) e = i[t], e.textContent && (a += e.textContent);
						return a;
					} else return null;
				},
				set: function(e) {
					throw Error("This DOM method is not implemented." + this.debugInfo());
				}
			}), t.prototype.setParent = function(e) {
				var t, n, r, i, a;
				for (this.parent = e, e && (this.options = e.options, this.stringify = e.stringify), i = this.children, a = [], n = 0, r = i.length; n < r; n++) t = i[n], a.push(t.setParent(this));
				return a;
			}, t.prototype.element = function(e, t, n) {
				var r, i, a, o, s, c = null, l, u, d, f, _;
				if (t === null && n == null && (d = [{}, null], t = d[0], n = d[1]), t ??= {}, t = p(t), g(t) || (f = [t, n], n = f[0], t = f[1]), e != null && (e = p(e)), Array.isArray(e)) for (a = 0, l = e.length; a < l; a++) i = e[a], c = this.element(i);
				else if (h(e)) c = this.element(e.apply());
				else if (g(e)) {
					for (s in e) if (v.call(e, s)) if (_ = e[s], h(_) && (_ = _.apply()), !this.options.ignoreDecorators && this.stringify.convertAttKey && s.indexOf(this.stringify.convertAttKey) === 0) c = this.attribute(s.substr(this.stringify.convertAttKey.length), _);
					else if (!this.options.separateArrayItems && Array.isArray(_) && m(_)) c = this.dummy();
					else if (g(_) && m(_)) c = this.element(s);
					else if (!this.options.keepNullNodes && _ == null) c = this.dummy();
					else if (!this.options.separateArrayItems && Array.isArray(_)) for (o = 0, u = _.length; o < u; o++) i = _[o], r = {}, r[s] = i, c = this.element(r);
					else g(_) ? !this.options.ignoreDecorators && this.stringify.convertTextKey && s.indexOf(this.stringify.convertTextKey) === 0 ? c = this.element(_) : (c = this.element(s), c.element(_)) : c = this.element(s, _);
				} else c = !this.options.keepNullNodes && n === null ? this.dummy() : !this.options.ignoreDecorators && this.stringify.convertTextKey && e.indexOf(this.stringify.convertTextKey) === 0 ? this.text(n) : !this.options.ignoreDecorators && this.stringify.convertCDataKey && e.indexOf(this.stringify.convertCDataKey) === 0 ? this.cdata(n) : !this.options.ignoreDecorators && this.stringify.convertCommentKey && e.indexOf(this.stringify.convertCommentKey) === 0 ? this.comment(n) : !this.options.ignoreDecorators && this.stringify.convertRawKey && e.indexOf(this.stringify.convertRawKey) === 0 ? this.raw(n) : !this.options.ignoreDecorators && this.stringify.convertPIKey && e.indexOf(this.stringify.convertPIKey) === 0 ? this.instruction(e.substr(this.stringify.convertPIKey.length), n) : this.node(e, t, n);
				if (c == null) throw Error("Could not create any elements with: " + e + ". " + this.debugInfo());
				return c;
			}, t.prototype.insertBefore = function(e, t, n) {
				var r, i, a, o, s;
				if (e?.type) return a = e, o = t, a.setParent(this), o ? (i = children.indexOf(o), s = children.splice(i), children.push(a), Array.prototype.push.apply(children, s)) : children.push(a), a;
				if (this.isRoot) throw Error("Cannot insert elements at root level. " + this.debugInfo(e));
				return i = this.parent.children.indexOf(this), s = this.parent.children.splice(i), r = this.parent.element(e, t, n), Array.prototype.push.apply(this.parent.children, s), r;
			}, t.prototype.insertAfter = function(e, t, n) {
				var r, i, a;
				if (this.isRoot) throw Error("Cannot insert elements at root level. " + this.debugInfo(e));
				return i = this.parent.children.indexOf(this), a = this.parent.children.splice(i + 1), r = this.parent.element(e, t, n), Array.prototype.push.apply(this.parent.children, a), r;
			}, t.prototype.remove = function() {
				var e;
				if (this.isRoot) throw Error("Cannot remove the root element. " + this.debugInfo());
				return e = this.parent.children.indexOf(this), [].splice.apply(this.parent.children, [e, e - e + 1]), this.parent;
			}, t.prototype.node = function(e, t, n) {
				var r, i;
				return e != null && (e = p(e)), t ||= {}, t = p(t), g(t) || (i = [t, n], n = i[0], t = i[1]), r = new c(this, e, t), n != null && r.text(n), this.children.push(r), r;
			}, t.prototype.text = function(e) {
				var t;
				return g(e) && this.element(e), t = new f(this, e), this.children.push(t), this;
			}, t.prototype.cdata = function(e) {
				var t = new r(this, e);
				return this.children.push(t), this;
			}, t.prototype.comment = function(e) {
				var t = new i(this, e);
				return this.children.push(t), this;
			}, t.prototype.commentBefore = function(e) {
				var t = this.parent.children.indexOf(this), n = this.parent.children.splice(t);
				return this.parent.comment(e), Array.prototype.push.apply(this.parent.children, n), this;
			}, t.prototype.commentAfter = function(e) {
				var t = this.parent.children.indexOf(this), n = this.parent.children.splice(t + 1);
				return this.parent.comment(e), Array.prototype.push.apply(this.parent.children, n), this;
			}, t.prototype.raw = function(e) {
				var t = new d(this, e);
				return this.children.push(t), this;
			}, t.prototype.dummy = function() {
				return new s(this);
			}, t.prototype.instruction = function(e, t) {
				var n, r, i, a, o;
				if (e != null && (e = p(e)), t != null && (t = p(t)), Array.isArray(e)) for (a = 0, o = e.length; a < o; a++) n = e[a], this.instruction(n);
				else if (g(e)) for (n in e) v.call(e, n) && (r = e[n], this.instruction(n, r));
				else h(t) && (t = t.apply()), i = new u(this, e, t), this.children.push(i);
				return this;
			}, t.prototype.instructionBefore = function(e, t) {
				var n = this.parent.children.indexOf(this), r = this.parent.children.splice(n);
				return this.parent.instruction(e, t), Array.prototype.push.apply(this.parent.children, r), this;
			}, t.prototype.instructionAfter = function(e, t) {
				var n = this.parent.children.indexOf(this), r = this.parent.children.splice(n + 1);
				return this.parent.instruction(e, t), Array.prototype.push.apply(this.parent.children, r), this;
			}, t.prototype.declaration = function(e, t, r) {
				var i = this.document(), o = new a(i, e, t, r);
				return i.children.length === 0 ? i.children.unshift(o) : i.children[0].type === n.Declaration ? i.children[0] = o : i.children.unshift(o), i.root() || i;
			}, t.prototype.dtd = function(e, t) {
				var r, i = this.document(), a = new o(i, e, t), s, c, l, u, d, f = i.children, p;
				for (s = c = 0, u = f.length; c < u; s = ++c) if (r = f[s], r.type === n.DocType) return i.children[s] = a, a;
				for (p = i.children, s = l = 0, d = p.length; l < d; s = ++l) if (r = p[s], r.isRoot) return i.children.splice(s, 0, a), a;
				return i.children.push(a), a;
			}, t.prototype.up = function() {
				if (this.isRoot) throw Error("The root node has no parent. Use doc() if you need to get the document object.");
				return this.parent;
			}, t.prototype.root = function() {
				for (var e = this; e;) if (e.type === n.Document) return e.rootObject;
				else if (e.isRoot) return e;
				else e = e.parent;
			}, t.prototype.document = function() {
				for (var e = this; e;) if (e.type === n.Document) return e;
				else e = e.parent;
			}, t.prototype.end = function(e) {
				return this.document().end(e);
			}, t.prototype.prev = function() {
				var e = this.parent.children.indexOf(this);
				if (e < 1) throw Error("Already at the first node. " + this.debugInfo());
				return this.parent.children[e - 1];
			}, t.prototype.next = function() {
				var e = this.parent.children.indexOf(this);
				if (e === -1 || e === this.parent.children.length - 1) throw Error("Already at the last node. " + this.debugInfo());
				return this.parent.children[e + 1];
			}, t.prototype.importDocument = function(e) {
				var t = e.root().clone();
				return t.parent = this, t.isRoot = !1, this.children.push(t), this;
			}, t.prototype.debugInfo = function(e) {
				return e ||= this.name, e == null && !this.parent?.name ? "" : e == null ? "parent: <" + this.parent.name + ">" : this.parent?.name ? "node: <" + e + ">, parent: <" + this.parent.name + ">" : "node: <" + e + ">";
			}, t.prototype.ele = function(e, t, n) {
				return this.element(e, t, n);
			}, t.prototype.nod = function(e, t, n) {
				return this.node(e, t, n);
			}, t.prototype.txt = function(e) {
				return this.text(e);
			}, t.prototype.dat = function(e) {
				return this.cdata(e);
			}, t.prototype.com = function(e) {
				return this.comment(e);
			}, t.prototype.ins = function(e, t) {
				return this.instruction(e, t);
			}, t.prototype.doc = function() {
				return this.document();
			}, t.prototype.dec = function(e, t, n) {
				return this.declaration(e, t, n);
			}, t.prototype.e = function(e, t, n) {
				return this.element(e, t, n);
			}, t.prototype.n = function(e, t, n) {
				return this.node(e, t, n);
			}, t.prototype.t = function(e) {
				return this.text(e);
			}, t.prototype.d = function(e) {
				return this.cdata(e);
			}, t.prototype.c = function(e) {
				return this.comment(e);
			}, t.prototype.r = function(e) {
				return this.raw(e);
			}, t.prototype.i = function(e, t) {
				return this.instruction(e, t);
			}, t.prototype.u = function() {
				return this.up();
			}, t.prototype.importXMLBuilder = function(e) {
				return this.importDocument(e);
			}, t.prototype.replaceChild = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.removeChild = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.appendChild = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.hasChildNodes = function() {
				return this.children.length !== 0;
			}, t.prototype.cloneNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.normalize = function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.isSupported = function(e, t) {
				return !0;
			}, t.prototype.hasAttributes = function() {
				return this.attribs.length !== 0;
			}, t.prototype.compareDocumentPosition = function(t) {
				var n = this, r;
				return n === t ? 0 : this.document() === t.document() ? n.isAncestor(t) ? e.Contains | e.Preceding : n.isDescendant(t) ? e.Contains | e.Following : n.isPreceding(t) ? e.Preceding : e.Following : (r = e.Disconnected | e.ImplementationSpecific, Math.random() < .5 ? r |= e.Preceding : r |= e.Following, r);
			}, t.prototype.isSameNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.lookupPrefix = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.isDefaultNamespace = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.lookupNamespaceURI = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.isEqualNode = function(e) {
				var t, n, r;
				if (e.nodeType !== this.nodeType || e.children.length !== this.children.length) return !1;
				for (t = n = 0, r = this.children.length - 1; 0 <= r ? n <= r : n >= r; t = 0 <= r ? ++n : --n) if (!this.children[t].isEqualNode(e.children[t])) return !1;
				return !0;
			}, t.prototype.getFeature = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.setUserData = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.getUserData = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, t.prototype.contains = function(e) {
				return e ? e === this || this.isDescendant(e) : !1;
			}, t.prototype.isDescendant = function(e) {
				var t, n, r, i, a = this.children;
				for (r = 0, i = a.length; r < i; r++) if (t = a[r], e === t || (n = t.isDescendant(e), n)) return !0;
				return !1;
			}, t.prototype.isAncestor = function(e) {
				return e.isDescendant(this);
			}, t.prototype.isPreceding = function(e) {
				var t = this.treePosition(e), n = this.treePosition(this);
				return t === -1 || n === -1 ? !1 : t < n;
			}, t.prototype.isFollowing = function(e) {
				var t = this.treePosition(e), n = this.treePosition(this);
				return t === -1 || n === -1 ? !1 : t > n;
			}, t.prototype.treePosition = function(e) {
				var t, n = 0;
				return t = !1, this.foreachTreeNode(this.document(), function(r) {
					if (n++, !t && r === e) return t = !0;
				}), t ? n : -1;
			}, t.prototype.foreachTreeNode = function(e, t) {
				var n, r, i, a, o;
				for (e ||= this.document(), a = e.children, r = 0, i = a.length; r < i; r++) if (n = a[r], (o = t(n)) || (o = this.foreachTreeNode(n, t), o)) return o;
			}, t;
		})();
	}).call(e);
})), Xp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e = function(e, t) {
			return function() {
				return e.apply(t, arguments);
			};
		}, n = {}.hasOwnProperty;
		t.exports = (function() {
			function t(t) {
				this.assertLegalName = e(this.assertLegalName, this), this.assertLegalChar = e(this.assertLegalChar, this);
				var r, i, a;
				for (r in t ||= {}, this.options = t, this.options.version || (this.options.version = "1.0"), i = t.stringify || {}, i) n.call(i, r) && (a = i[r], this[r] = a);
			}
			return t.prototype.name = function(e) {
				return this.options.noValidation ? e : this.assertLegalName("" + e || "");
			}, t.prototype.text = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar(this.textEscape("" + e || ""));
			}, t.prototype.cdata = function(e) {
				return this.options.noValidation ? e : (e = "" + e || "", e = e.replace("]]>", "]]]]><![CDATA[>"), this.assertLegalChar(e));
			}, t.prototype.comment = function(e) {
				if (this.options.noValidation) return e;
				if (e = "" + e || "", e.match(/--/)) throw Error("Comment text cannot contain double-hypen: " + e);
				return this.assertLegalChar(e);
			}, t.prototype.raw = function(e) {
				return this.options.noValidation ? e : "" + e || "";
			}, t.prototype.attValue = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar(this.attEscape(e = "" + e || ""));
			}, t.prototype.insTarget = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.insValue = function(e) {
				if (this.options.noValidation) return e;
				if (e = "" + e || "", e.match(/\?>/)) throw Error("Invalid processing instruction value: " + e);
				return this.assertLegalChar(e);
			}, t.prototype.xmlVersion = function(e) {
				if (this.options.noValidation) return e;
				if (e = "" + e || "", !e.match(/1\.[0-9]+/)) throw Error("Invalid version number: " + e);
				return e;
			}, t.prototype.xmlEncoding = function(e) {
				if (this.options.noValidation) return e;
				if (e = "" + e || "", !e.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) throw Error("Invalid encoding: " + e);
				return this.assertLegalChar(e);
			}, t.prototype.xmlStandalone = function(e) {
				return this.options.noValidation ? e : e ? "yes" : "no";
			}, t.prototype.dtdPubID = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdSysID = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdElementValue = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdAttType = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdAttDefault = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdEntityValue = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.dtdNData = function(e) {
				return this.options.noValidation ? e : this.assertLegalChar("" + e || "");
			}, t.prototype.convertAttKey = "@", t.prototype.convertPIKey = "?", t.prototype.convertTextKey = "#text", t.prototype.convertCDataKey = "#cdata", t.prototype.convertCommentKey = "#comment", t.prototype.convertRawKey = "#raw", t.prototype.assertLegalChar = function(e) {
				var t, n;
				if (this.options.noValidation) return e;
				if (t = "", this.options.version === "1.0") {
					if (t = /[\0-\x08\x0B\f\x0E-\x1F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, n = e.match(t)) throw Error("Invalid character in string: " + e + " at index " + n.index);
				} else if (this.options.version === "1.1" && (t = /[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, n = e.match(t))) throw Error("Invalid character in string: " + e + " at index " + n.index);
				return e;
			}, t.prototype.assertLegalName = function(e) {
				var t;
				if (this.options.noValidation) return e;
				if (this.assertLegalChar(e), t = /^([:A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])([\x2D\.0-:A-Z_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/, !e.match(t)) throw Error("Invalid character in name");
				return e;
			}, t.prototype.textEscape = function(e) {
				var t;
				return this.options.noValidation ? e : (t = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, e.replace(t, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;"));
			}, t.prototype.attEscape = function(e) {
				var t;
				return this.options.noValidation ? e : (t = this.options.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g, e.replace(t, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;"));
			}, t;
		})();
	}).call(e);
})), Zp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = {
			None: 0,
			OpenTag: 1,
			InsideTag: 2,
			CloseTag: 3
		};
	}).call(e);
})), Qp = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = {}.hasOwnProperty;
		r = Dp().assign, e = q(), Rp(), Up(), Ip(), Lp(), Pp(), Wp(), Gp(), Kp(), qp(), zp(), Vp(), Bp(), Hp(), n = Zp(), t.exports = (function() {
			function t(e) {
				var t, n, r;
				for (t in e ||= {}, this.options = e, n = e.writer || {}, n) i.call(n, t) && (r = n[t], this["_" + t] = this[t], this[t] = r);
			}
			return t.prototype.filterOptions = function(e) {
				var t;
				return e ||= {}, e = r({}, this.options, e), t = { writer: this }, t.pretty = e.pretty || !1, t.allowEmpty = e.allowEmpty || !1, t.indent = e.indent ?? "  ", t.newline = e.newline ?? "\n", t.offset = e.offset ?? 0, t.dontPrettyTextNodes = e.dontPrettyTextNodes ?? e.dontprettytextnodes ?? 0, t.spaceBeforeSlash = e.spaceBeforeSlash ?? e.spacebeforeslash ?? "", t.spaceBeforeSlash === !0 && (t.spaceBeforeSlash = " "), t.suppressPrettyCount = 0, t.user = {}, t.state = n.None, t;
			}, t.prototype.indent = function(e, t, n) {
				var r;
				return !t.pretty || t.suppressPrettyCount ? "" : t.pretty && (r = (n || 0) + t.offset + 1, r > 0) ? Array(r).join(t.indent) : "";
			}, t.prototype.endline = function(e, t, n) {
				return !t.pretty || t.suppressPrettyCount ? "" : t.newline;
			}, t.prototype.attribute = function(e, t, n) {
				var r;
				return this.openAttribute(e, t, n), r = " " + e.name + "=\"" + e.value + "\"", this.closeAttribute(e, t, n), r;
			}, t.prototype.cdata = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<![CDATA[", t.state = n.InsideTag, i += e.value, t.state = n.CloseTag, i += "]]>" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.comment = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<!-- ", t.state = n.InsideTag, i += e.value, t.state = n.CloseTag, i += " -->" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.declaration = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<?xml", t.state = n.InsideTag, i += " version=\"" + e.version + "\"", e.encoding != null && (i += " encoding=\"" + e.encoding + "\""), e.standalone != null && (i += " standalone=\"" + e.standalone + "\""), t.state = n.CloseTag, i += t.spaceBeforeSlash + "?>", i += this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.docType = function(e, t, r) {
				var i, a, o, s, c;
				if (r ||= 0, this.openNode(e, t, r), t.state = n.OpenTag, s = this.indent(e, t, r), s += "<!DOCTYPE " + e.root().name, e.pubID && e.sysID ? s += " PUBLIC \"" + e.pubID + "\" \"" + e.sysID + "\"" : e.sysID && (s += " SYSTEM \"" + e.sysID + "\""), e.children.length > 0) {
					for (s += " [", s += this.endline(e, t, r), t.state = n.InsideTag, c = e.children, a = 0, o = c.length; a < o; a++) i = c[a], s += this.writeChildNode(i, t, r + 1);
					t.state = n.CloseTag, s += "]";
				}
				return t.state = n.CloseTag, s += t.spaceBeforeSlash + ">", s += this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), s;
			}, t.prototype.element = function(t, r, a) {
				var o, s, c, l, u, d, f, p, m, h, g, _, v, y;
				for (m in a ||= 0, h = !1, g = "", this.openNode(t, r, a), r.state = n.OpenTag, g += this.indent(t, r, a) + "<" + t.name, _ = t.attribs, _) i.call(_, m) && (o = _[m], g += this.attribute(o, r, a));
				if (c = t.children.length, l = c === 0 ? null : t.children[0], c === 0 || t.children.every(function(t) {
					return (t.type === e.Text || t.type === e.Raw) && t.value === "";
				})) r.allowEmpty ? (g += ">", r.state = n.CloseTag, g += "</" + t.name + ">" + this.endline(t, r, a)) : (r.state = n.CloseTag, g += r.spaceBeforeSlash + "/>" + this.endline(t, r, a));
				else if (r.pretty && c === 1 && (l.type === e.Text || l.type === e.Raw) && l.value != null) g += ">", r.state = n.InsideTag, r.suppressPrettyCount++, h = !0, g += this.writeChildNode(l, r, a + 1), r.suppressPrettyCount--, h = !1, r.state = n.CloseTag, g += "</" + t.name + ">" + this.endline(t, r, a);
				else {
					if (r.dontPrettyTextNodes) {
						for (v = t.children, u = 0, f = v.length; u < f; u++) if (s = v[u], (s.type === e.Text || s.type === e.Raw) && s.value != null) {
							r.suppressPrettyCount++, h = !0;
							break;
						}
					}
					for (g += ">" + this.endline(t, r, a), r.state = n.InsideTag, y = t.children, d = 0, p = y.length; d < p; d++) s = y[d], g += this.writeChildNode(s, r, a + 1);
					r.state = n.CloseTag, g += this.indent(t, r, a) + "</" + t.name + ">", h && r.suppressPrettyCount--, g += this.endline(t, r, a), r.state = n.None;
				}
				return this.closeNode(t, r, a), g;
			}, t.prototype.writeChildNode = function(t, n, r) {
				switch (t.type) {
					case e.CData: return this.cdata(t, n, r);
					case e.Comment: return this.comment(t, n, r);
					case e.Element: return this.element(t, n, r);
					case e.Raw: return this.raw(t, n, r);
					case e.Text: return this.text(t, n, r);
					case e.ProcessingInstruction: return this.processingInstruction(t, n, r);
					case e.Dummy: return "";
					case e.Declaration: return this.declaration(t, n, r);
					case e.DocType: return this.docType(t, n, r);
					case e.AttributeDeclaration: return this.dtdAttList(t, n, r);
					case e.ElementDeclaration: return this.dtdElement(t, n, r);
					case e.EntityDeclaration: return this.dtdEntity(t, n, r);
					case e.NotationDeclaration: return this.dtdNotation(t, n, r);
					default: throw Error("Unknown XML node type: " + t.constructor.name);
				}
			}, t.prototype.processingInstruction = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<?", t.state = n.InsideTag, i += e.target, e.value && (i += " " + e.value), t.state = n.CloseTag, i += t.spaceBeforeSlash + "?>", i += this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.raw = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r), t.state = n.InsideTag, i += e.value, t.state = n.CloseTag, i += this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.text = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r), t.state = n.InsideTag, i += e.value, t.state = n.CloseTag, i += this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.dtdAttList = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<!ATTLIST", t.state = n.InsideTag, i += " " + e.elementName + " " + e.attributeName + " " + e.attributeType, e.defaultValueType !== "#DEFAULT" && (i += " " + e.defaultValueType), e.defaultValue && (i += " \"" + e.defaultValue + "\""), t.state = n.CloseTag, i += t.spaceBeforeSlash + ">" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.dtdElement = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<!ELEMENT", t.state = n.InsideTag, i += " " + e.name + " " + e.value, t.state = n.CloseTag, i += t.spaceBeforeSlash + ">" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.dtdEntity = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<!ENTITY", t.state = n.InsideTag, e.pe && (i += " %"), i += " " + e.name, e.value ? i += " \"" + e.value + "\"" : (e.pubID && e.sysID ? i += " PUBLIC \"" + e.pubID + "\" \"" + e.sysID + "\"" : e.sysID && (i += " SYSTEM \"" + e.sysID + "\""), e.nData && (i += " NDATA " + e.nData)), t.state = n.CloseTag, i += t.spaceBeforeSlash + ">" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.dtdNotation = function(e, t, r) {
				var i;
				return this.openNode(e, t, r), t.state = n.OpenTag, i = this.indent(e, t, r) + "<!NOTATION", t.state = n.InsideTag, i += " " + e.name, e.pubID && e.sysID ? i += " PUBLIC \"" + e.pubID + "\" \"" + e.sysID + "\"" : e.pubID ? i += " PUBLIC \"" + e.pubID + "\"" : e.sysID && (i += " SYSTEM \"" + e.sysID + "\""), t.state = n.CloseTag, i += t.spaceBeforeSlash + ">" + this.endline(e, t, r), t.state = n.None, this.closeNode(e, t, r), i;
			}, t.prototype.openNode = function(e, t, n) {}, t.prototype.closeNode = function(e, t, n) {}, t.prototype.openAttribute = function(e, t, n) {}, t.prototype.closeAttribute = function(e, t, n) {}, t;
		})();
	}).call(e);
})), $p = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n = function(e, t) {
			for (var n in t) r.call(t, n) && (e[n] = t[n]);
			function i() {
				this.constructor = e;
			}
			return i.prototype = t.prototype, e.prototype = new i(), e.__super__ = t.prototype, e;
		}, r = {}.hasOwnProperty;
		e = Qp(), t.exports = (function(e) {
			n(t, e);
			function t(e) {
				t.__super__.constructor.call(this, e);
			}
			return t.prototype.document = function(e, t) {
				var n, r, i, a, o;
				for (t = this.filterOptions(t), a = "", o = e.children, r = 0, i = o.length; r < i; r++) n = o[r], a += this.writeChildNode(n, t, 0);
				return t.pretty && a.slice(-t.newline.length) === t.newline && (a = a.slice(0, -t.newline.length)), a;
			}, t;
		})(e);
	}).call(e);
})), em = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c = function(e, t) {
			for (var n in t) l.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, l = {}.hasOwnProperty;
		s = Dp().isPlainObject, r = Op(), n = jp(), i = J(), e = q(), o = Xp(), a = $p(), t.exports = (function(t) {
			c(i, t);
			function i(t) {
				i.__super__.constructor.call(this, null), this.name = "#document", this.type = e.Document, this.documentURI = null, this.domConfig = new n(), t ||= {}, t.writer ||= new a(), this.options = t, this.stringify = new o(t);
			}
			return Object.defineProperty(i.prototype, "implementation", { value: new r() }), Object.defineProperty(i.prototype, "doctype", { get: function() {
				var t, n, r, i = this.children;
				for (n = 0, r = i.length; n < r; n++) if (t = i[n], t.type === e.DocType) return t;
				return null;
			} }), Object.defineProperty(i.prototype, "documentElement", { get: function() {
				return this.rootObject || null;
			} }), Object.defineProperty(i.prototype, "inputEncoding", { get: function() {
				return null;
			} }), Object.defineProperty(i.prototype, "strictErrorChecking", { get: function() {
				return !1;
			} }), Object.defineProperty(i.prototype, "xmlEncoding", { get: function() {
				return this.children.length !== 0 && this.children[0].type === e.Declaration ? this.children[0].encoding : null;
			} }), Object.defineProperty(i.prototype, "xmlStandalone", { get: function() {
				return this.children.length !== 0 && this.children[0].type === e.Declaration ? this.children[0].standalone === "yes" : !1;
			} }), Object.defineProperty(i.prototype, "xmlVersion", { get: function() {
				return this.children.length !== 0 && this.children[0].type === e.Declaration ? this.children[0].version : "1.0";
			} }), Object.defineProperty(i.prototype, "URL", { get: function() {
				return this.documentURI;
			} }), Object.defineProperty(i.prototype, "origin", { get: function() {
				return null;
			} }), Object.defineProperty(i.prototype, "compatMode", { get: function() {
				return null;
			} }), Object.defineProperty(i.prototype, "characterSet", { get: function() {
				return null;
			} }), Object.defineProperty(i.prototype, "contentType", { get: function() {
				return null;
			} }), i.prototype.end = function(e) {
				var t = {};
				return e ? s(e) && (t = e, e = this.options.writer) : e = this.options.writer, e.document(this, e.filterOptions(t));
			}, i.prototype.toString = function(e) {
				return this.options.writer.document(this, this.options.writer.filterOptions(e));
			}, i.prototype.createElement = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createDocumentFragment = function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createTextNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createComment = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createCDATASection = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createProcessingInstruction = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createAttribute = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createEntityReference = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagName = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.importNode = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createElementNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createAttributeNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByTagNameNS = function(e, t) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementById = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.adoptNode = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.normalizeDocument = function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.renameNode = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.getElementsByClassName = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createEvent = function(e) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createRange = function() {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createNodeIterator = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i.prototype.createTreeWalker = function(e, t, n) {
				throw Error("This DOM method is not implemented." + this.debugInfo());
			}, i;
		})(i);
	}).call(e);
})), tm = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w = {}.hasOwnProperty;
		C = Dp(), x = C.isObject, b = C.isFunction, S = C.isPlainObject, y = C.getValue, e = q(), f = em(), p = Pp(), i = Ip(), a = Lp(), h = Wp(), v = Gp(), m = Kp(), u = Rp(), d = Up(), o = zp(), c = Bp(), s = Vp(), l = Hp(), r = Mp(), _ = Xp(), g = $p(), n = Zp(), t.exports = (function() {
			function t(t, n, r) {
				var i;
				this.name = "?xml", this.type = e.Document, t ||= {}, i = {}, t.writer ? S(t.writer) && (i = t.writer, t.writer = new g()) : t.writer = new g(), this.options = t, this.writer = t.writer, this.writerOptions = this.writer.filterOptions(i), this.stringify = new _(t), this.onDataCallback = n || function() {}, this.onEndCallback = r || function() {}, this.currentNode = null, this.currentLevel = -1, this.openTags = {}, this.documentStarted = !1, this.documentCompleted = !1, this.root = null;
			}
			return t.prototype.createChildNode = function(t) {
				var n, r, i, a, o, s, c, l;
				switch (t.type) {
					case e.CData:
						this.cdata(t.value);
						break;
					case e.Comment:
						this.comment(t.value);
						break;
					case e.Element:
						for (r in i = {}, c = t.attribs, c) w.call(c, r) && (n = c[r], i[r] = n.value);
						this.node(t.name, i);
						break;
					case e.Dummy:
						this.dummy();
						break;
					case e.Raw:
						this.raw(t.value);
						break;
					case e.Text:
						this.text(t.value);
						break;
					case e.ProcessingInstruction:
						this.instruction(t.target, t.value);
						break;
					default: throw Error("This XML node type is not supported in a JS object: " + t.constructor.name);
				}
				for (l = t.children, o = 0, s = l.length; o < s; o++) a = l[o], this.createChildNode(a), a.type === e.Element && this.up();
				return this;
			}, t.prototype.dummy = function() {
				return this;
			}, t.prototype.node = function(e, t, n) {
				var r;
				if (e == null) throw Error("Missing node name.");
				if (this.root && this.currentLevel === -1) throw Error("Document can only have one root node. " + this.debugInfo(e));
				return this.openCurrent(), e = y(e), t ??= {}, t = y(t), x(t) || (r = [t, n], n = r[0], t = r[1]), this.currentNode = new p(this, e, t), this.currentNode.children = !1, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, n != null && this.text(n), this;
			}, t.prototype.element = function(t, n, r) {
				var i, a, o, s, c, l;
				if (this.currentNode && this.currentNode.type === e.DocType) this.dtdElement.apply(this, arguments);
				else if (Array.isArray(t) || x(t) || b(t)) for (s = this.options.noValidation, this.options.noValidation = !0, l = new f(this.options).element("TEMP_ROOT"), l.element(t), this.options.noValidation = s, c = l.children, a = 0, o = c.length; a < o; a++) i = c[a], this.createChildNode(i), i.type === e.Element && this.up();
				else this.node(t, n, r);
				return this;
			}, t.prototype.attribute = function(e, t) {
				var n, i;
				if (!this.currentNode || this.currentNode.children) throw Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(e));
				if (e != null && (e = y(e)), x(e)) for (n in e) w.call(e, n) && (i = e[n], this.attribute(n, i));
				else b(t) && (t = t.apply()), this.options.keepNullAttributes && t == null ? this.currentNode.attribs[e] = new r(this, e, "") : t != null && (this.currentNode.attribs[e] = new r(this, e, t));
				return this;
			}, t.prototype.text = function(e) {
				var t;
				return this.openCurrent(), t = new v(this, e), this.onData(this.writer.text(t, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.cdata = function(e) {
				var t;
				return this.openCurrent(), t = new i(this, e), this.onData(this.writer.cdata(t, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.comment = function(e) {
				var t;
				return this.openCurrent(), t = new a(this, e), this.onData(this.writer.comment(t, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.raw = function(e) {
				var t;
				return this.openCurrent(), t = new h(this, e), this.onData(this.writer.raw(t, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.instruction = function(e, t) {
				var n, r, i, a, o;
				if (this.openCurrent(), e != null && (e = y(e)), t != null && (t = y(t)), Array.isArray(e)) for (n = 0, a = e.length; n < a; n++) r = e[n], this.instruction(r);
				else if (x(e)) for (r in e) w.call(e, r) && (i = e[r], this.instruction(r, i));
				else b(t) && (t = t.apply()), o = new m(this, e, t), this.onData(this.writer.processingInstruction(o, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1);
				return this;
			}, t.prototype.declaration = function(e, t, n) {
				var r;
				if (this.openCurrent(), this.documentStarted) throw Error("declaration() must be the first node.");
				return r = new u(this, e, t, n), this.onData(this.writer.declaration(r, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.doctype = function(e, t, n) {
				if (this.openCurrent(), e == null) throw Error("Missing root node name.");
				if (this.root) throw Error("dtd() must come before the root node.");
				return this.currentNode = new d(this, t, n), this.currentNode.rootNodeName = e, this.currentNode.children = !1, this.currentLevel++, this.openTags[this.currentLevel] = this.currentNode, this;
			}, t.prototype.dtdElement = function(e, t) {
				var n;
				return this.openCurrent(), n = new s(this, e, t), this.onData(this.writer.dtdElement(n, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.attList = function(e, t, n, r, i) {
				var a;
				return this.openCurrent(), a = new o(this, e, t, n, r, i), this.onData(this.writer.dtdAttList(a, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.entity = function(e, t) {
				var n;
				return this.openCurrent(), n = new c(this, !1, e, t), this.onData(this.writer.dtdEntity(n, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.pEntity = function(e, t) {
				var n;
				return this.openCurrent(), n = new c(this, !0, e, t), this.onData(this.writer.dtdEntity(n, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.notation = function(e, t) {
				var n;
				return this.openCurrent(), n = new l(this, e, t), this.onData(this.writer.dtdNotation(n, this.writerOptions, this.currentLevel + 1), this.currentLevel + 1), this;
			}, t.prototype.up = function() {
				if (this.currentLevel < 0) throw Error("The document node has no parent.");
				return this.currentNode ? (this.currentNode.children ? this.closeNode(this.currentNode) : this.openNode(this.currentNode), this.currentNode = null) : this.closeNode(this.openTags[this.currentLevel]), delete this.openTags[this.currentLevel], this.currentLevel--, this;
			}, t.prototype.end = function() {
				for (; this.currentLevel >= 0;) this.up();
				return this.onEnd();
			}, t.prototype.openCurrent = function() {
				if (this.currentNode) return this.currentNode.children = !0, this.openNode(this.currentNode);
			}, t.prototype.openNode = function(t) {
				var r, i, a, o;
				if (!t.isOpen) {
					if (!this.root && this.currentLevel === 0 && t.type === e.Element && (this.root = t), i = "", t.type === e.Element) {
						for (a in this.writerOptions.state = n.OpenTag, i = this.writer.indent(t, this.writerOptions, this.currentLevel) + "<" + t.name, o = t.attribs, o) w.call(o, a) && (r = o[a], i += this.writer.attribute(r, this.writerOptions, this.currentLevel));
						i += (t.children ? ">" : "/>") + this.writer.endline(t, this.writerOptions, this.currentLevel), this.writerOptions.state = n.InsideTag;
					} else this.writerOptions.state = n.OpenTag, i = this.writer.indent(t, this.writerOptions, this.currentLevel) + "<!DOCTYPE " + t.rootNodeName, t.pubID && t.sysID ? i += " PUBLIC \"" + t.pubID + "\" \"" + t.sysID + "\"" : t.sysID && (i += " SYSTEM \"" + t.sysID + "\""), t.children ? (i += " [", this.writerOptions.state = n.InsideTag) : (this.writerOptions.state = n.CloseTag, i += ">"), i += this.writer.endline(t, this.writerOptions, this.currentLevel);
					return this.onData(i, this.currentLevel), t.isOpen = !0;
				}
			}, t.prototype.closeNode = function(t) {
				var r;
				if (!t.isClosed) return r = "", this.writerOptions.state = n.CloseTag, r = t.type === e.Element ? this.writer.indent(t, this.writerOptions, this.currentLevel) + "</" + t.name + ">" + this.writer.endline(t, this.writerOptions, this.currentLevel) : this.writer.indent(t, this.writerOptions, this.currentLevel) + "]>" + this.writer.endline(t, this.writerOptions, this.currentLevel), this.writerOptions.state = n.None, this.onData(r, this.currentLevel), t.isClosed = !0;
			}, t.prototype.onData = function(e, t) {
				return this.documentStarted = !0, this.onDataCallback(e, t + 1);
			}, t.prototype.onEnd = function() {
				return this.documentCompleted = !0, this.onEndCallback();
			}, t.prototype.debugInfo = function(e) {
				return e == null ? "" : "node: <" + e + ">";
			}, t.prototype.ele = function() {
				return this.element.apply(this, arguments);
			}, t.prototype.nod = function(e, t, n) {
				return this.node(e, t, n);
			}, t.prototype.txt = function(e) {
				return this.text(e);
			}, t.prototype.dat = function(e) {
				return this.cdata(e);
			}, t.prototype.com = function(e) {
				return this.comment(e);
			}, t.prototype.ins = function(e, t) {
				return this.instruction(e, t);
			}, t.prototype.dec = function(e, t, n) {
				return this.declaration(e, t, n);
			}, t.prototype.dtd = function(e, t, n) {
				return this.doctype(e, t, n);
			}, t.prototype.e = function(e, t, n) {
				return this.element(e, t, n);
			}, t.prototype.n = function(e, t, n) {
				return this.node(e, t, n);
			}, t.prototype.t = function(e) {
				return this.text(e);
			}, t.prototype.d = function(e) {
				return this.cdata(e);
			}, t.prototype.c = function(e) {
				return this.comment(e);
			}, t.prototype.r = function(e) {
				return this.raw(e);
			}, t.prototype.i = function(e, t) {
				return this.instruction(e, t);
			}, t.prototype.att = function() {
				return this.currentNode && this.currentNode.type === e.DocType ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments);
			}, t.prototype.a = function() {
				return this.currentNode && this.currentNode.type === e.DocType ? this.attList.apply(this, arguments) : this.attribute.apply(this, arguments);
			}, t.prototype.ent = function(e, t) {
				return this.entity(e, t);
			}, t.prototype.pent = function(e, t) {
				return this.pEntity(e, t);
			}, t.prototype.not = function(e, t) {
				return this.notation(e, t);
			}, t;
		})();
	}).call(e);
})), nm = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		e = q(), r = Qp(), n = Zp(), t.exports = (function(t) {
			i(r, t);
			function r(e, t) {
				this.stream = e, r.__super__.constructor.call(this, t);
			}
			return r.prototype.endline = function(e, t, i) {
				return e.isLastRootNode && t.state === n.CloseTag ? "" : r.__super__.endline.call(this, e, t, i);
			}, r.prototype.document = function(e, t) {
				var n, r, i, a, o, s, c = e.children, l, u;
				for (r = i = 0, o = c.length; i < o; r = ++i) n = c[r], n.isLastRootNode = r === e.children.length - 1;
				for (t = this.filterOptions(t), l = e.children, u = [], a = 0, s = l.length; a < s; a++) n = l[a], u.push(this.writeChildNode(n, t, 0));
				return u;
			}, r.prototype.attribute = function(e, t, n) {
				return this.stream.write(r.__super__.attribute.call(this, e, t, n));
			}, r.prototype.cdata = function(e, t, n) {
				return this.stream.write(r.__super__.cdata.call(this, e, t, n));
			}, r.prototype.comment = function(e, t, n) {
				return this.stream.write(r.__super__.comment.call(this, e, t, n));
			}, r.prototype.declaration = function(e, t, n) {
				return this.stream.write(r.__super__.declaration.call(this, e, t, n));
			}, r.prototype.docType = function(e, t, r) {
				var i, a, o, s;
				if (r ||= 0, this.openNode(e, t, r), t.state = n.OpenTag, this.stream.write(this.indent(e, t, r)), this.stream.write("<!DOCTYPE " + e.root().name), e.pubID && e.sysID ? this.stream.write(" PUBLIC \"" + e.pubID + "\" \"" + e.sysID + "\"") : e.sysID && this.stream.write(" SYSTEM \"" + e.sysID + "\""), e.children.length > 0) {
					for (this.stream.write(" ["), this.stream.write(this.endline(e, t, r)), t.state = n.InsideTag, s = e.children, a = 0, o = s.length; a < o; a++) i = s[a], this.writeChildNode(i, t, r + 1);
					t.state = n.CloseTag, this.stream.write("]");
				}
				return t.state = n.CloseTag, this.stream.write(t.spaceBeforeSlash + ">"), this.stream.write(this.endline(e, t, r)), t.state = n.None, this.closeNode(e, t, r);
			}, r.prototype.element = function(t, r, i) {
				var o, s, c, l, u, d, f, p, m;
				for (f in i ||= 0, this.openNode(t, r, i), r.state = n.OpenTag, this.stream.write(this.indent(t, r, i) + "<" + t.name), p = t.attribs, p) a.call(p, f) && (o = p[f], this.attribute(o, r, i));
				if (c = t.children.length, l = c === 0 ? null : t.children[0], c === 0 || t.children.every(function(t) {
					return (t.type === e.Text || t.type === e.Raw) && t.value === "";
				})) r.allowEmpty ? (this.stream.write(">"), r.state = n.CloseTag, this.stream.write("</" + t.name + ">")) : (r.state = n.CloseTag, this.stream.write(r.spaceBeforeSlash + "/>"));
				else if (r.pretty && c === 1 && (l.type === e.Text || l.type === e.Raw) && l.value != null) this.stream.write(">"), r.state = n.InsideTag, r.suppressPrettyCount++, this.writeChildNode(l, r, i + 1), r.suppressPrettyCount--, r.state = n.CloseTag, this.stream.write("</" + t.name + ">");
				else {
					for (this.stream.write(">" + this.endline(t, r, i)), r.state = n.InsideTag, m = t.children, u = 0, d = m.length; u < d; u++) s = m[u], this.writeChildNode(s, r, i + 1);
					r.state = n.CloseTag, this.stream.write(this.indent(t, r, i) + "</" + t.name + ">");
				}
				return this.stream.write(this.endline(t, r, i)), r.state = n.None, this.closeNode(t, r, i);
			}, r.prototype.processingInstruction = function(e, t, n) {
				return this.stream.write(r.__super__.processingInstruction.call(this, e, t, n));
			}, r.prototype.raw = function(e, t, n) {
				return this.stream.write(r.__super__.raw.call(this, e, t, n));
			}, r.prototype.text = function(e, t, n) {
				return this.stream.write(r.__super__.text.call(this, e, t, n));
			}, r.prototype.dtdAttList = function(e, t, n) {
				return this.stream.write(r.__super__.dtdAttList.call(this, e, t, n));
			}, r.prototype.dtdElement = function(e, t, n) {
				return this.stream.write(r.__super__.dtdElement.call(this, e, t, n));
			}, r.prototype.dtdEntity = function(e, t, n) {
				return this.stream.write(r.__super__.dtdEntity.call(this, e, t, n));
			}, r.prototype.dtdNotation = function(e, t, n) {
				return this.stream.write(r.__super__.dtdNotation.call(this, e, t, n));
			}, r;
		})(r);
	}).call(e);
})), rm = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l, u = Dp();
		c = u.assign, l = u.isFunction, r = Op(), i = em(), a = tm(), s = $p(), o = nm(), e = q(), n = Zp(), t.exports.create = function(e, t, n, r) {
			var a, o;
			if (e == null) throw Error("Root element needs a name.");
			return r = c({}, t, n, r), a = new i(r), o = a.element(e), r.headless || (a.declaration(r), (r.pubID != null || r.sysID != null) && a.dtd(r)), o;
		}, t.exports.begin = function(e, t, n) {
			var r;
			return l(e) && (r = [e, t], t = r[0], n = r[1], e = {}), t ? new a(e, t, n) : new i(e);
		}, t.exports.stringWriter = function(e) {
			return new s(e);
		}, t.exports.streamWriter = function(e, t) {
			return new o(e, t);
		}, t.exports.implementation = new r(), t.exports.nodeType = e, t.exports.writerState = n;
	}).call(e);
})), im = /* @__PURE__ */ v(((e) => {
	(function() {
		var t, n, r, i, a, o = {}.hasOwnProperty;
		t = rm(), n = Ep().defaults, i = function(e) {
			return typeof e == "string" && (e.indexOf("&") >= 0 || e.indexOf(">") >= 0 || e.indexOf("<") >= 0);
		}, a = function(e) {
			return "<![CDATA[" + r(e) + "]]>";
		}, r = function(e) {
			return e.replace("]]>", "]]]]><![CDATA[>");
		}, e.Builder = (function() {
			function e(e) {
				var t, r, i;
				for (t in this.options = {}, r = n["0.2"], r) o.call(r, t) && (i = r[t], this.options[t] = i);
				for (t in e) o.call(e, t) && (i = e[t], this.options[t] = i);
			}
			return e.prototype.buildObject = function(e) {
				var r = this.options.attrkey, s = this.options.charkey, c, l, u;
				return Object.keys(e).length === 1 && this.options.rootName === n["0.2"].rootName ? (u = Object.keys(e)[0], e = e[u]) : u = this.options.rootName, c = (function(e) {
					return function(t, n) {
						var l, u, d, f, p, m;
						if (typeof n != "object") e.options.cdata && i(n) ? t.raw(a(n)) : t.txt(n);
						else if (Array.isArray(n)) {
							for (f in n) if (o.call(n, f)) for (p in u = n[f], u) d = u[p], t = c(t.ele(p), d).up();
						} else for (p in n) if (o.call(n, p)) if (u = n[p], p === r) {
							if (typeof u == "object") for (l in u) m = u[l], t = t.att(l, m);
						} else if (p === s) t = e.options.cdata && i(u) ? t.raw(a(u)) : t.txt(u);
						else if (Array.isArray(u)) for (f in u) o.call(u, f) && (d = u[f], t = typeof d == "string" ? e.options.cdata && i(d) ? t.ele(p).raw(a(d)).up() : t.ele(p, d).up() : c(t.ele(p), d).up());
						else typeof u == "object" ? t = c(t.ele(p), u).up() : typeof u == "string" && e.options.cdata && i(u) ? t = t.ele(p).raw(a(u)).up() : (u ??= "", t = t.ele(p, u.toString()).up());
						return t;
					};
				})(this), l = t.create(u, this.options.xmldec, this.options.doctype, {
					headless: this.options.headless,
					allowSurrogateChars: this.options.allowSurrogateChars
				}), c(l, e).end(this.options.renderOpts);
			}, e;
		})();
	}).call(e);
})), am = /* @__PURE__ */ v(((e) => {
	(function(e) {
		e.parser = function(e, t) {
			return new n(e, t);
		}, e.SAXParser = n, e.SAXStream = u, e.createStream = c, e.MAX_BUFFER_LENGTH = 64 * 1024;
		var t = [
			"comment",
			"sgmlDecl",
			"textNode",
			"tagName",
			"doctype",
			"procInstName",
			"procInstBody",
			"entity",
			"attribName",
			"attribValue",
			"cdata",
			"script"
		];
		e.EVENTS = [
			"text",
			"processinginstruction",
			"sgmldeclaration",
			"doctype",
			"comment",
			"opentagstart",
			"attribute",
			"opentag",
			"closetag",
			"opencdata",
			"cdata",
			"closecdata",
			"error",
			"end",
			"ready",
			"script",
			"opennamespace",
			"closenamespace"
		];
		function n(t, r) {
			if (!(this instanceof n)) return new n(t, r);
			var a = this;
			i(a), a.q = a.c = "", a.bufferCheckPosition = e.MAX_BUFFER_LENGTH, a.encoding = null, a.opt = r || {}, a.opt.lowercase = a.opt.lowercase || a.opt.lowercasetags, a.looseCase = a.opt.lowercase ? "toLowerCase" : "toUpperCase", a.opt.maxEntityCount = a.opt.maxEntityCount || 512, a.opt.maxEntityDepth = a.opt.maxEntityDepth || 4, a.entityCount = a.entityDepth = 0, a.tags = [], a.closed = a.closedRoot = a.sawRoot = !1, a.tag = a.error = null, a.strict = !!t, a.noscript = !!(t || a.opt.noscript), a.state = T.BEGIN, a.strictEntities = a.opt.strictEntities, a.ENTITIES = a.strictEntities ? Object.create(e.XML_ENTITIES) : Object.create(e.ENTITIES), a.attribList = [], a.opt.xmlns && (a.ns = Object.create(h)), a.opt.unquotedAttributeValues === void 0 && (a.opt.unquotedAttributeValues = !t), a.trackPosition = a.opt.position !== !1, a.trackPosition && (a.position = a.line = a.column = 0), ne(a, "onready");
		}
		Object.create || (Object.create = function(e) {
			function t() {}
			return t.prototype = e, new t();
		}), Object.keys || (Object.keys = function(e) {
			var t = [];
			for (var n in e) e.hasOwnProperty(n) && t.push(n);
			return t;
		});
		function r(n) {
			for (var r = Math.max(e.MAX_BUFFER_LENGTH, 10), i = 0, a = 0, o = t.length; a < o; a++) {
				var s = n[t[a]].length;
				if (s > r) switch (t[a]) {
					case "textNode":
						se(n);
						break;
					case "cdata":
						E(n, "oncdata", n.cdata), n.cdata = "";
						break;
					case "script":
						E(n, "onscript", n.script), n.script = "";
						break;
					default: le(n, "Max buffer length exceeded: " + t[a]);
				}
				i = Math.max(i, s);
			}
			n.bufferCheckPosition = e.MAX_BUFFER_LENGTH - i + n.position;
		}
		function i(e) {
			for (var n = 0, r = t.length; n < r; n++) e[t[n]] = "";
		}
		function a(e) {
			se(e), e.cdata !== "" && (E(e, "oncdata", e.cdata), e.cdata = ""), e.script !== "" && (E(e, "onscript", e.script), e.script = "");
		}
		n.prototype = {
			end: function() {
				ue(this);
			},
			write: ve,
			resume: function() {
				return this.error = null, this;
			},
			close: function() {
				return this.write(null);
			},
			flush: function() {
				a(this);
			}
		};
		var o;
		try {
			o = C("stream").Stream;
		} catch {
			o = function() {};
		}
		o ||= function() {};
		var s = e.EVENTS.filter(function(e) {
			return e !== "error" && e !== "end";
		});
		function c(e, t) {
			return new u(e, t);
		}
		function l(e, t) {
			if (e.length >= 2) {
				if (e[0] === 255 && e[1] === 254) return "utf-16le";
				if (e[0] === 254 && e[1] === 255) return "utf-16be";
			}
			return e.length >= 3 && e[0] === 239 && e[1] === 187 && e[2] === 191 ? "utf8" : e.length >= 4 ? e[0] === 60 && e[1] === 0 && e[2] === 63 && e[3] === 0 ? "utf-16le" : e[0] === 0 && e[1] === 60 && e[2] === 0 && e[3] === 63 ? "utf-16be" : "utf8" : t ? "utf8" : null;
		}
		function u(e, t) {
			if (!(this instanceof u)) return new u(e, t);
			o.apply(this), this._parser = new n(e, t), this.writable = !0, this.readable = !0;
			var r = this;
			this._parser.onend = function() {
				r.emit("end");
			}, this._parser.onerror = function(e) {
				r.emit("error", e), r._parser.error = null;
			}, this._decoder = null, this._decoderBuffer = null, s.forEach(function(e) {
				Object.defineProperty(r, "on" + e, {
					get: function() {
						return r._parser["on" + e];
					},
					set: function(t) {
						if (!t) return r.removeAllListeners(e), r._parser["on" + e] = t, t;
						r.on(e, t);
					},
					enumerable: !0,
					configurable: !1
				});
			});
		}
		u.prototype = Object.create(o.prototype, { constructor: { value: u } }), u.prototype._decodeBuffer = function(e, t) {
			if (this._decoderBuffer &&= (e = Buffer.concat([this._decoderBuffer, e]), null), !this._decoder) {
				var n = l(e, t);
				if (!n) return this._decoderBuffer = e, "";
				this._parser.encoding = n, this._decoder = new TextDecoder(n);
			}
			return this._decoder.decode(e, { stream: !t });
		}, u.prototype.write = function(e) {
			if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(e)) e = this._decodeBuffer(e, !1);
			else if (this._decoderBuffer) {
				var t = this._decodeBuffer(Buffer.alloc(0), !0);
				t && (this._parser.write(t), this.emit("data", t));
			}
			return this._parser.write(e.toString()), this.emit("data", e), !0;
		}, u.prototype.end = function(e) {
			if (e && e.length && this.write(e), this._decoderBuffer) {
				var t = this._decodeBuffer(Buffer.alloc(0), !0);
				t && (this._parser.write(t), this.emit("data", t));
			} else if (this._decoder) {
				var n = this._decoder.decode();
				n && (this._parser.write(n), this.emit("data", n));
			}
			return this._parser.end(), !0;
		}, u.prototype.on = function(e, t) {
			var n = this;
			return !n._parser["on" + e] && s.indexOf(e) !== -1 && (n._parser["on" + e] = function() {
				var t = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
				t.splice(0, 0, e), n.emit.apply(n, t);
			}), o.prototype.on.call(n, e, t);
		};
		var d = "[CDATA[", f = "DOCTYPE", p = "http://www.w3.org/XML/1998/namespace", m = "http://www.w3.org/2000/xmlns/", h = {
			xml: p,
			xmlns: m
		}, g = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, _ = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, v = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, y = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
		function b(e) {
			return e === " " || e === "\n" || e === "\r" || e === "	";
		}
		function x(e) {
			return e === "\"" || e === "'";
		}
		function S(e) {
			return e === ">" || b(e);
		}
		function w(e, t) {
			return e.test(t);
		}
		function ee(e, t) {
			return !w(e, t);
		}
		var T = 0;
		for (var te in e.STATE = {
			BEGIN: T++,
			BEGIN_WHITESPACE: T++,
			TEXT: T++,
			TEXT_ENTITY: T++,
			OPEN_WAKA: T++,
			SGML_DECL: T++,
			SGML_DECL_QUOTED: T++,
			DOCTYPE: T++,
			DOCTYPE_QUOTED: T++,
			DOCTYPE_DTD: T++,
			DOCTYPE_DTD_QUOTED: T++,
			COMMENT_STARTING: T++,
			COMMENT: T++,
			COMMENT_ENDING: T++,
			COMMENT_ENDED: T++,
			CDATA: T++,
			CDATA_ENDING: T++,
			CDATA_ENDING_2: T++,
			PROC_INST: T++,
			PROC_INST_BODY: T++,
			PROC_INST_ENDING: T++,
			OPEN_TAG: T++,
			OPEN_TAG_SLASH: T++,
			ATTRIB: T++,
			ATTRIB_NAME: T++,
			ATTRIB_NAME_SAW_WHITE: T++,
			ATTRIB_VALUE: T++,
			ATTRIB_VALUE_QUOTED: T++,
			ATTRIB_VALUE_CLOSED: T++,
			ATTRIB_VALUE_UNQUOTED: T++,
			ATTRIB_VALUE_ENTITY_Q: T++,
			ATTRIB_VALUE_ENTITY_U: T++,
			CLOSE_TAG: T++,
			CLOSE_TAG_SAW_WHITE: T++,
			SCRIPT: T++,
			SCRIPT_ENDING: T++
		}, e.XML_ENTITIES = {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'"
		}, e.ENTITIES = {
			amp: "&",
			gt: ">",
			lt: "<",
			quot: "\"",
			apos: "'",
			AElig: 198,
			Aacute: 193,
			Acirc: 194,
			Agrave: 192,
			Aring: 197,
			Atilde: 195,
			Auml: 196,
			Ccedil: 199,
			ETH: 208,
			Eacute: 201,
			Ecirc: 202,
			Egrave: 200,
			Euml: 203,
			Iacute: 205,
			Icirc: 206,
			Igrave: 204,
			Iuml: 207,
			Ntilde: 209,
			Oacute: 211,
			Ocirc: 212,
			Ograve: 210,
			Oslash: 216,
			Otilde: 213,
			Ouml: 214,
			THORN: 222,
			Uacute: 218,
			Ucirc: 219,
			Ugrave: 217,
			Uuml: 220,
			Yacute: 221,
			aacute: 225,
			acirc: 226,
			aelig: 230,
			agrave: 224,
			aring: 229,
			atilde: 227,
			auml: 228,
			ccedil: 231,
			eacute: 233,
			ecirc: 234,
			egrave: 232,
			eth: 240,
			euml: 235,
			iacute: 237,
			icirc: 238,
			igrave: 236,
			iuml: 239,
			ntilde: 241,
			oacute: 243,
			ocirc: 244,
			ograve: 242,
			oslash: 248,
			otilde: 245,
			ouml: 246,
			szlig: 223,
			thorn: 254,
			uacute: 250,
			ucirc: 251,
			ugrave: 249,
			uuml: 252,
			yacute: 253,
			yuml: 255,
			copy: 169,
			reg: 174,
			nbsp: 160,
			iexcl: 161,
			cent: 162,
			pound: 163,
			curren: 164,
			yen: 165,
			brvbar: 166,
			sect: 167,
			uml: 168,
			ordf: 170,
			laquo: 171,
			not: 172,
			shy: 173,
			macr: 175,
			deg: 176,
			plusmn: 177,
			sup1: 185,
			sup2: 178,
			sup3: 179,
			acute: 180,
			micro: 181,
			para: 182,
			middot: 183,
			cedil: 184,
			ordm: 186,
			raquo: 187,
			frac14: 188,
			frac12: 189,
			frac34: 190,
			iquest: 191,
			times: 215,
			divide: 247,
			OElig: 338,
			oelig: 339,
			Scaron: 352,
			scaron: 353,
			Yuml: 376,
			fnof: 402,
			circ: 710,
			tilde: 732,
			Alpha: 913,
			Beta: 914,
			Gamma: 915,
			Delta: 916,
			Epsilon: 917,
			Zeta: 918,
			Eta: 919,
			Theta: 920,
			Iota: 921,
			Kappa: 922,
			Lambda: 923,
			Mu: 924,
			Nu: 925,
			Xi: 926,
			Omicron: 927,
			Pi: 928,
			Rho: 929,
			Sigma: 931,
			Tau: 932,
			Upsilon: 933,
			Phi: 934,
			Chi: 935,
			Psi: 936,
			Omega: 937,
			alpha: 945,
			beta: 946,
			gamma: 947,
			delta: 948,
			epsilon: 949,
			zeta: 950,
			eta: 951,
			theta: 952,
			iota: 953,
			kappa: 954,
			lambda: 955,
			mu: 956,
			nu: 957,
			xi: 958,
			omicron: 959,
			pi: 960,
			rho: 961,
			sigmaf: 962,
			sigma: 963,
			tau: 964,
			upsilon: 965,
			phi: 966,
			chi: 967,
			psi: 968,
			omega: 969,
			thetasym: 977,
			upsih: 978,
			piv: 982,
			ensp: 8194,
			emsp: 8195,
			thinsp: 8201,
			zwnj: 8204,
			zwj: 8205,
			lrm: 8206,
			rlm: 8207,
			ndash: 8211,
			mdash: 8212,
			lsquo: 8216,
			rsquo: 8217,
			sbquo: 8218,
			ldquo: 8220,
			rdquo: 8221,
			bdquo: 8222,
			dagger: 8224,
			Dagger: 8225,
			bull: 8226,
			hellip: 8230,
			permil: 8240,
			prime: 8242,
			Prime: 8243,
			lsaquo: 8249,
			rsaquo: 8250,
			oline: 8254,
			frasl: 8260,
			euro: 8364,
			image: 8465,
			weierp: 8472,
			real: 8476,
			trade: 8482,
			alefsym: 8501,
			larr: 8592,
			uarr: 8593,
			rarr: 8594,
			darr: 8595,
			harr: 8596,
			crarr: 8629,
			lArr: 8656,
			uArr: 8657,
			rArr: 8658,
			dArr: 8659,
			hArr: 8660,
			forall: 8704,
			part: 8706,
			exist: 8707,
			empty: 8709,
			nabla: 8711,
			isin: 8712,
			notin: 8713,
			ni: 8715,
			prod: 8719,
			sum: 8721,
			minus: 8722,
			lowast: 8727,
			radic: 8730,
			prop: 8733,
			infin: 8734,
			ang: 8736,
			and: 8743,
			or: 8744,
			cap: 8745,
			cup: 8746,
			int: 8747,
			there4: 8756,
			sim: 8764,
			cong: 8773,
			asymp: 8776,
			ne: 8800,
			equiv: 8801,
			le: 8804,
			ge: 8805,
			sub: 8834,
			sup: 8835,
			nsub: 8836,
			sube: 8838,
			supe: 8839,
			oplus: 8853,
			otimes: 8855,
			perp: 8869,
			sdot: 8901,
			lceil: 8968,
			rceil: 8969,
			lfloor: 8970,
			rfloor: 8971,
			lang: 9001,
			rang: 9002,
			loz: 9674,
			spades: 9824,
			clubs: 9827,
			hearts: 9829,
			diams: 9830
		}, Object.keys(e.ENTITIES).forEach(function(t) {
			var n = e.ENTITIES[t], r = typeof n == "number" ? String.fromCharCode(n) : n;
			e.ENTITIES[t] = r;
		}), e.STATE) e.STATE[e.STATE[te]] = te;
		T = e.STATE;
		function ne(e, t, n) {
			e[t] && e[t](n);
		}
		function re(e) {
			var t = e && e.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
			return t ? t[2] : null;
		}
		function ie(e) {
			return e ? e.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
		}
		function ae(e, t) {
			let n = ie(e), r = ie(t);
			return !n || !r ? !0 : r === "utf16" ? n === "utf16le" || n === "utf16be" : n === r;
		}
		function oe(e, t) {
			if (!(!e.strict || !e.encoding || !t || t.name !== "xml")) {
				var n = re(t.body);
				n && !ae(e.encoding, n) && D(e, "XML declaration encoding " + n + " does not match detected stream encoding " + e.encoding.toUpperCase());
			}
		}
		function E(e, t, n) {
			e.textNode && se(e), ne(e, t, n);
		}
		function se(e) {
			e.textNode = ce(e.opt, e.textNode), e.textNode && ne(e, "ontext", e.textNode), e.textNode = "";
		}
		function ce(e, t) {
			return e.trim && (t = t.trim()), e.normalize && (t = t.replace(/\s+/g, " ")), t;
		}
		function le(e, t) {
			return se(e), e.trackPosition && (t += "\nLine: " + e.line + "\nColumn: " + e.column + "\nChar: " + e.c), t = Error(t), e.error = t, ne(e, "onerror", t), e;
		}
		function ue(e) {
			return e.sawRoot && !e.closedRoot && D(e, "Unclosed root tag"), e.state !== T.BEGIN && e.state !== T.BEGIN_WHITESPACE && e.state !== T.TEXT && le(e, "Unexpected end"), se(e), e.c = "", e.closed = !0, ne(e, "onend"), n.call(e, e.strict, e.opt), e;
		}
		function D(e, t) {
			if (typeof e != "object" || !(e instanceof n)) throw Error("bad call to strictFail");
			e.strict && le(e, t);
		}
		function O(e) {
			e.strict || (e.tagName = e.tagName[e.looseCase]());
			var t = e.tags[e.tags.length - 1] || e, n = e.tag = {
				name: e.tagName,
				attributes: {}
			};
			e.opt.xmlns && (n.ns = t.ns), e.attribList.length = 0, E(e, "onopentagstart", n);
		}
		function de(e, t) {
			var n = e.indexOf(":") < 0 ? ["", e] : e.split(":"), r = n[0], i = n[1];
			return t && e === "xmlns" && (r = "xmlns", i = ""), {
				prefix: r,
				local: i
			};
		}
		function fe(e) {
			if (e.strict || (e.attribName = e.attribName[e.looseCase]()), e.attribList.indexOf(e.attribName) !== -1 || e.tag.attributes.hasOwnProperty(e.attribName)) {
				e.attribName = e.attribValue = "";
				return;
			}
			if (e.opt.xmlns) {
				var t = de(e.attribName, !0), n = t.prefix, r = t.local;
				if (n === "xmlns") if (r === "xml" && e.attribValue !== p) D(e, "xml: prefix must be bound to " + p + "\nActual: " + e.attribValue);
				else if (r === "xmlns" && e.attribValue !== m) D(e, "xmlns: prefix must be bound to " + m + "\nActual: " + e.attribValue);
				else {
					var i = e.tag, a = e.tags[e.tags.length - 1] || e;
					i.ns === a.ns && (i.ns = Object.create(a.ns)), i.ns[r] = e.attribValue;
				}
				e.attribList.push([e.attribName, e.attribValue]);
			} else e.tag.attributes[e.attribName] = e.attribValue, E(e, "onattribute", {
				name: e.attribName,
				value: e.attribValue
			});
			e.attribName = e.attribValue = "";
		}
		function pe(e, t) {
			if (e.opt.xmlns) {
				var n = e.tag, r = de(e.tagName);
				n.prefix = r.prefix, n.local = r.local, n.uri = n.ns[r.prefix] || "", n.prefix && !n.uri && (D(e, "Unbound namespace prefix: " + JSON.stringify(e.tagName)), n.uri = r.prefix);
				var i = e.tags[e.tags.length - 1] || e;
				n.ns && i.ns !== n.ns && Object.keys(n.ns).forEach(function(t) {
					E(e, "onopennamespace", {
						prefix: t,
						uri: n.ns[t]
					});
				});
				for (var a = 0, o = e.attribList.length; a < o; a++) {
					var s = e.attribList[a], c = s[0], l = s[1], u = de(c, !0), d = u.prefix, f = u.local, p = d === "" ? "" : n.ns[d] || "", m = {
						name: c,
						value: l,
						prefix: d,
						local: f,
						uri: p
					};
					d && d !== "xmlns" && !p && (D(e, "Unbound namespace prefix: " + JSON.stringify(d)), m.uri = d), e.tag.attributes[c] = m, E(e, "onattribute", m);
				}
				e.attribList.length = 0;
			}
			e.tag.isSelfClosing = !!t, e.sawRoot = !0, e.tags.push(e.tag), E(e, "onopentag", e.tag), t || (!e.noscript && e.tagName.toLowerCase() === "script" ? e.state = T.SCRIPT : e.state = T.TEXT, e.tag = null, e.tagName = ""), e.attribName = e.attribValue = "", e.attribList.length = 0;
		}
		function me(e) {
			if (!e.tagName) {
				D(e, "Weird empty close tag."), e.textNode += "</>", e.state = T.TEXT;
				return;
			}
			if (e.script) {
				if (e.tagName !== "script") {
					e.script += "</" + e.tagName + ">", e.tagName = "", e.state = T.SCRIPT;
					return;
				}
				E(e, "onscript", e.script), e.script = "";
			}
			var t = e.tags.length, n = e.tagName;
			e.strict || (n = n[e.looseCase]());
			for (var r = n; t-- && e.tags[t].name !== r;) D(e, "Unexpected close tag");
			if (t < 0) {
				D(e, "Unmatched closing tag: " + e.tagName), e.textNode += "</" + e.tagName + ">", e.state = T.TEXT;
				return;
			}
			e.tagName = n;
			for (var i = e.tags.length; i-- > t;) {
				var a = e.tag = e.tags.pop();
				e.tagName = e.tag.name, E(e, "onclosetag", e.tagName);
				var o = {};
				for (var s in a.ns) o[s] = a.ns[s];
				var c = e.tags[e.tags.length - 1] || e;
				e.opt.xmlns && a.ns !== c.ns && Object.keys(a.ns).forEach(function(t) {
					var n = a.ns[t];
					E(e, "onclosenamespace", {
						prefix: t,
						uri: n
					});
				});
			}
			t === 0 && (e.closedRoot = !0), e.tagName = e.attribValue = e.attribName = "", e.attribList.length = 0, e.state = T.TEXT;
		}
		function he(e) {
			var t = e.entity, n = t.toLowerCase(), r, i = "";
			return e.ENTITIES[t] ? e.ENTITIES[t] : e.ENTITIES[n] ? e.ENTITIES[n] : (t = n, t.charAt(0) === "#" && (t.charAt(1) === "x" ? (t = t.slice(2), r = parseInt(t, 16), i = r.toString(16)) : (t = t.slice(1), r = parseInt(t, 10), i = r.toString(10))), t = t.replace(/^0+/, ""), isNaN(r) || i.toLowerCase() !== t || r < 0 || r > 1114111 ? (D(e, "Invalid character entity"), "&" + e.entity + ";") : String.fromCodePoint(r));
		}
		function ge(e, t) {
			t === "<" ? (e.state = T.OPEN_WAKA, e.startTagPosition = e.position) : b(t) || (D(e, "Non-whitespace before first tag."), e.textNode = t, e.state = T.TEXT);
		}
		function _e(e, t) {
			var n = "";
			return t < e.length && (n = e.charAt(t)), n;
		}
		function ve(t) {
			var n = this;
			if (this.error) throw this.error;
			if (n.closed) return le(n, "Cannot write after close. Assign an onready handler.");
			if (t === null) return ue(n);
			typeof t == "object" && (t = t.toString());
			for (var i = 0, a = ""; a = _e(t, i++), n.c = a, a;) switch (n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++), n.state) {
				case T.BEGIN:
					if (n.state = T.BEGIN_WHITESPACE, a === "﻿") continue;
					ge(n, a);
					continue;
				case T.BEGIN_WHITESPACE:
					ge(n, a);
					continue;
				case T.TEXT:
					if (n.sawRoot && !n.closedRoot) {
						for (var o = i - 1; a && a !== "<" && a !== "&";) a = _e(t, i++), a && n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++);
						n.textNode += t.substring(o, i - 1);
					}
					a === "<" && !(n.sawRoot && n.closedRoot && !n.strict) ? (n.state = T.OPEN_WAKA, n.startTagPosition = n.position) : (!b(a) && (!n.sawRoot || n.closedRoot) && D(n, "Text data outside of root node."), a === "&" ? n.state = T.TEXT_ENTITY : n.textNode += a);
					continue;
				case T.SCRIPT:
					a === "<" ? n.state = T.SCRIPT_ENDING : n.script += a;
					continue;
				case T.SCRIPT_ENDING:
					a === "/" ? n.state = T.CLOSE_TAG : (n.script += "<" + a, n.state = T.SCRIPT);
					continue;
				case T.OPEN_WAKA:
					if (a === "!") n.state = T.SGML_DECL, n.sgmlDecl = "";
					else if (!b(a)) if (w(g, a)) n.state = T.OPEN_TAG, n.tagName = a;
					else if (a === "/") n.state = T.CLOSE_TAG, n.tagName = "";
					else if (a === "?") n.state = T.PROC_INST, n.procInstName = n.procInstBody = "";
					else {
						if (D(n, "Unencoded <"), n.startTagPosition + 1 < n.position) {
							var s = n.position - n.startTagPosition;
							a = Array(s).join(" ") + a;
						}
						n.textNode += "<" + a, n.state = T.TEXT;
					}
					continue;
				case T.SGML_DECL:
					if (n.sgmlDecl + a === "--") {
						n.state = T.COMMENT, n.comment = "", n.sgmlDecl = "";
						continue;
					}
					n.doctype && n.doctype !== !0 && n.sgmlDecl ? (n.state = T.DOCTYPE_DTD, n.doctype += "<!" + n.sgmlDecl + a, n.sgmlDecl = "") : (n.sgmlDecl + a).toUpperCase() === d ? (E(n, "onopencdata"), n.state = T.CDATA, n.sgmlDecl = "", n.cdata = "") : (n.sgmlDecl + a).toUpperCase() === f ? (n.state = T.DOCTYPE, (n.doctype || n.sawRoot) && D(n, "Inappropriately located doctype declaration"), n.doctype = "", n.sgmlDecl = "") : a === ">" ? (E(n, "onsgmldeclaration", n.sgmlDecl), n.sgmlDecl = "", n.state = T.TEXT) : (x(a) && (n.state = T.SGML_DECL_QUOTED), n.sgmlDecl += a);
					continue;
				case T.SGML_DECL_QUOTED:
					a === n.q && (n.state = T.SGML_DECL, n.q = ""), n.sgmlDecl += a;
					continue;
				case T.DOCTYPE:
					a === ">" ? (n.state = T.TEXT, E(n, "ondoctype", n.doctype), n.doctype = !0) : (n.doctype += a, a === "[" ? n.state = T.DOCTYPE_DTD : x(a) && (n.state = T.DOCTYPE_QUOTED, n.q = a));
					continue;
				case T.DOCTYPE_QUOTED:
					n.doctype += a, a === n.q && (n.q = "", n.state = T.DOCTYPE);
					continue;
				case T.DOCTYPE_DTD:
					a === "]" ? (n.doctype += a, n.state = T.DOCTYPE) : a === "<" ? (n.state = T.OPEN_WAKA, n.startTagPosition = n.position) : x(a) ? (n.doctype += a, n.state = T.DOCTYPE_DTD_QUOTED, n.q = a) : n.doctype += a;
					continue;
				case T.DOCTYPE_DTD_QUOTED:
					n.doctype += a, a === n.q && (n.state = T.DOCTYPE_DTD, n.q = "");
					continue;
				case T.COMMENT:
					a === "-" ? n.state = T.COMMENT_ENDING : n.comment += a;
					continue;
				case T.COMMENT_ENDING:
					a === "-" ? (n.state = T.COMMENT_ENDED, n.comment = ce(n.opt, n.comment), n.comment && E(n, "oncomment", n.comment), n.comment = "") : (n.comment += "-" + a, n.state = T.COMMENT);
					continue;
				case T.COMMENT_ENDED:
					a === ">" ? n.doctype && n.doctype !== !0 ? n.state = T.DOCTYPE_DTD : n.state = T.TEXT : (D(n, "Malformed comment"), n.comment += "--" + a, n.state = T.COMMENT);
					continue;
				case T.CDATA:
					for (var o = i - 1; a && a !== "]";) a = _e(t, i++), a && n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++);
					n.cdata += t.substring(o, i - 1), a === "]" && (n.state = T.CDATA_ENDING);
					continue;
				case T.CDATA_ENDING:
					a === "]" ? n.state = T.CDATA_ENDING_2 : (n.cdata += "]" + a, n.state = T.CDATA);
					continue;
				case T.CDATA_ENDING_2:
					a === ">" ? (n.cdata && E(n, "oncdata", n.cdata), E(n, "onclosecdata"), n.cdata = "", n.state = T.TEXT) : a === "]" ? n.cdata += "]" : (n.cdata += "]]" + a, n.state = T.CDATA);
					continue;
				case T.PROC_INST:
					a === "?" ? n.state = T.PROC_INST_ENDING : b(a) ? n.state = T.PROC_INST_BODY : n.procInstName += a;
					continue;
				case T.PROC_INST_BODY:
					if (!n.procInstBody && b(a)) continue;
					a === "?" ? n.state = T.PROC_INST_ENDING : n.procInstBody += a;
					continue;
				case T.PROC_INST_ENDING:
					if (a === ">") {
						let e = {
							name: n.procInstName,
							body: n.procInstBody
						};
						oe(n, e), E(n, "onprocessinginstruction", e), n.procInstName = n.procInstBody = "", n.state = T.TEXT;
					} else n.procInstBody += "?" + a, n.state = T.PROC_INST_BODY;
					continue;
				case T.OPEN_TAG:
					w(_, a) ? n.tagName += a : (O(n), a === ">" ? pe(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : (b(a) || D(n, "Invalid character in tag name"), n.state = T.ATTRIB));
					continue;
				case T.OPEN_TAG_SLASH:
					a === ">" ? (pe(n, !0), me(n)) : (D(n, "Forward-slash in opening tag not followed by >"), n.state = T.ATTRIB);
					continue;
				case T.ATTRIB:
					if (b(a)) continue;
					a === ">" ? pe(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : w(g, a) ? (n.attribName = a, n.attribValue = "", n.state = T.ATTRIB_NAME) : D(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_NAME:
					a === "=" ? n.state = T.ATTRIB_VALUE : a === ">" ? (D(n, "Attribute without value"), n.attribValue = n.attribName, fe(n), pe(n)) : b(a) ? n.state = T.ATTRIB_NAME_SAW_WHITE : w(_, a) ? n.attribName += a : D(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_NAME_SAW_WHITE:
					if (a === "=") n.state = T.ATTRIB_VALUE;
					else if (b(a)) continue;
					else D(n, "Attribute without value"), n.tag.attributes[n.attribName] = "", n.attribValue = "", E(n, "onattribute", {
						name: n.attribName,
						value: ""
					}), n.attribName = "", a === ">" ? pe(n) : w(g, a) ? (n.attribName = a, n.state = T.ATTRIB_NAME) : (D(n, "Invalid attribute name"), n.state = T.ATTRIB);
					continue;
				case T.ATTRIB_VALUE:
					if (b(a)) continue;
					x(a) ? (n.q = a, n.state = T.ATTRIB_VALUE_QUOTED) : (n.opt.unquotedAttributeValues || le(n, "Unquoted attribute value"), n.state = T.ATTRIB_VALUE_UNQUOTED, n.attribValue = a);
					continue;
				case T.ATTRIB_VALUE_QUOTED:
					if (a !== n.q) {
						a === "&" ? n.state = T.ATTRIB_VALUE_ENTITY_Q : n.attribValue += a;
						continue;
					}
					fe(n), n.q = "", n.state = T.ATTRIB_VALUE_CLOSED;
					continue;
				case T.ATTRIB_VALUE_CLOSED:
					b(a) ? n.state = T.ATTRIB : a === ">" ? pe(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : w(g, a) ? (D(n, "No whitespace between attributes"), n.attribName = a, n.attribValue = "", n.state = T.ATTRIB_NAME) : D(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_VALUE_UNQUOTED:
					if (!S(a)) {
						a === "&" ? n.state = T.ATTRIB_VALUE_ENTITY_U : n.attribValue += a;
						continue;
					}
					fe(n), a === ">" ? pe(n) : n.state = T.ATTRIB;
					continue;
				case T.CLOSE_TAG:
					if (n.tagName) a === ">" ? me(n) : w(_, a) ? n.tagName += a : n.script ? (n.script += "</" + n.tagName + a, n.tagName = "", n.state = T.SCRIPT) : (b(a) || D(n, "Invalid tagname in closing tag"), n.state = T.CLOSE_TAG_SAW_WHITE);
					else {
						if (b(a)) continue;
						ee(g, a) ? n.script ? (n.script += "</" + a, n.state = T.SCRIPT) : D(n, "Invalid tagname in closing tag.") : n.tagName = a;
					}
					continue;
				case T.CLOSE_TAG_SAW_WHITE:
					if (b(a)) continue;
					a === ">" ? me(n) : D(n, "Invalid characters in closing tag");
					continue;
				case T.TEXT_ENTITY:
				case T.ATTRIB_VALUE_ENTITY_Q:
				case T.ATTRIB_VALUE_ENTITY_U:
					var c, l;
					switch (n.state) {
						case T.TEXT_ENTITY:
							c = T.TEXT, l = "textNode";
							break;
						case T.ATTRIB_VALUE_ENTITY_Q:
							c = T.ATTRIB_VALUE_QUOTED, l = "attribValue";
							break;
						case T.ATTRIB_VALUE_ENTITY_U:
							c = T.ATTRIB_VALUE_UNQUOTED, l = "attribValue";
							break;
					}
					if (a === ";") {
						var u = he(n);
						n.opt.unparsedEntities && !Object.values(e.XML_ENTITIES).includes(u) ? ((n.entityCount += 1) > n.opt.maxEntityCount && le(n, "Parsed entity count exceeds max entity count"), (n.entityDepth += 1) > n.opt.maxEntityDepth && le(n, "Parsed entity depth exceeds max entity depth"), n.entity = "", n.state = c, n.write(u), --n.entityDepth) : (n[l] += u, n.entity = "", n.state = c);
					} else w(n.entity.length ? y : v, a) ? n.entity += a : (D(n, "Invalid character in entity name"), n[l] += "&" + n.entity + a, n.entity = "", n.state = c);
					continue;
				default: throw Error(n, "Unknown state: " + n.state);
			}
			return n.position >= n.bufferCheckPosition && r(n), n;
		}
		/* istanbul ignore next */
		String.fromCodePoint || (function() {
			var e = String.fromCharCode, t = Math.floor, n = function() {
				var n = 16384, r = [], i, a, o = -1, s = arguments.length;
				if (!s) return "";
				for (var c = ""; ++o < s;) {
					var l = Number(arguments[o]);
					if (!isFinite(l) || l < 0 || l > 1114111 || t(l) !== l) throw RangeError("Invalid code point: " + l);
					l <= 65535 ? r.push(l) : (l -= 65536, i = (l >> 10) + 55296, a = l % 1024 + 56320, r.push(i, a)), (o + 1 === s || r.length > n) && (c += e.apply(null, r), r.length = 0);
				}
				return c;
			};
			/* istanbul ignore next */
			Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
				value: n,
				configurable: !0,
				writable: !0
			}) : String.fromCodePoint = n;
		})();
	})(e === void 0 ? e.sax = {} : e);
})), om = /* @__PURE__ */ v(((e) => {
	(function() {
		e.stripBOM = function(e) {
			return e[0] === "﻿" ? e.substring(1) : e;
		};
	}).call(e);
})), sm = /* @__PURE__ */ v(((e) => {
	(function() {
		var t = /* @__PURE__ */ new RegExp(/(?!xmlns)^.*:/);
		e.normalize = function(e) {
			return e.toLowerCase();
		}, e.firstCharLowerCase = function(e) {
			return e.charAt(0).toLowerCase() + e.slice(1);
		}, e.stripPrefix = function(e) {
			return e.replace(t, "");
		}, e.parseNumbers = function(e) {
			return isNaN(e) || (e = e % 1 == 0 ? parseInt(e, 10) : parseFloat(e)), e;
		}, e.parseBooleans = function(e) {
			return /^(?:true|false)$/i.test(e) && (e = e.toLowerCase() === "true"), e;
		};
	}).call(e);
})), cm = /* @__PURE__ */ v(((e) => {
	(function() {
		var t, n, r, i, a, o, s, c, l = function(e, t) {
			return function() {
				return e.apply(t, arguments);
			};
		}, u = function(e, t) {
			for (var n in t) d.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, d = {}.hasOwnProperty;
		s = am(), r = C("events"), t = om(), o = sm(), c = C("timers").setImmediate, n = Ep().defaults, i = function(e) {
			return typeof e == "object" && !!e && Object.keys(e).length === 0;
		}, a = function(e, t, n) {
			var r, i, a;
			for (r = 0, i = e.length; r < i; r++) a = e[r], t = a(t, n);
			return t;
		}, e.Parser = (function(r) {
			u(f, r);
			function f(t) {
				this.parseStringPromise = l(this.parseStringPromise, this), this.parseString = l(this.parseString, this), this.reset = l(this.reset, this), this.assignOrPush = l(this.assignOrPush, this), this.processAsync = l(this.processAsync, this);
				var r, i, a;
				if (!(this instanceof e.Parser)) return new e.Parser(t);
				for (r in this.options = {}, i = n["0.2"], i) d.call(i, r) && (a = i[r], this.options[r] = a);
				for (r in t) d.call(t, r) && (a = t[r], this.options[r] = a);
				this.options.xmlns && (this.options.xmlnskey = this.options.attrkey + "ns"), this.options.normalizeTags && (this.options.tagNameProcessors || (this.options.tagNameProcessors = []), this.options.tagNameProcessors.unshift(o.normalize)), this.reset();
			}
			return f.prototype.processAsync = function() {
				var e, t;
				try {
					return this.remaining.length <= this.options.chunkSize ? (e = this.remaining, this.remaining = "", this.saxParser = this.saxParser.write(e), this.saxParser.close()) : (e = this.remaining.substr(0, this.options.chunkSize), this.remaining = this.remaining.substr(this.options.chunkSize, this.remaining.length), this.saxParser = this.saxParser.write(e), c(this.processAsync));
				} catch (e) {
					if (t = e, !this.saxParser.errThrown) return this.saxParser.errThrown = !0, this.emit(t);
				}
			}, f.prototype.assignOrPush = function(e, t, n) {
				return t in e ? (e[t] instanceof Array || (e[t] = [e[t]]), e[t].push(n)) : this.options.explicitArray ? e[t] = [n] : e[t] = n;
			}, f.prototype.reset = function() {
				var e, t, n, r;
				return this.removeAllListeners(), this.saxParser = s.parser(this.options.strict, {
					trim: !1,
					normalize: !1,
					xmlns: this.options.xmlns
				}), this.saxParser.errThrown = !1, this.saxParser.onerror = (function(e) {
					return function(t) {
						if (e.saxParser.resume(), !e.saxParser.errThrown) return e.saxParser.errThrown = !0, e.emit("error", t);
					};
				})(this), this.saxParser.onend = (function(e) {
					return function() {
						if (!e.saxParser.ended) return e.saxParser.ended = !0, e.emit("end", e.resultObject);
					};
				})(this), this.saxParser.ended = !1, this.EXPLICIT_CHARKEY = this.options.explicitCharkey, this.resultObject = null, r = [], e = this.options.attrkey, t = this.options.charkey, this.saxParser.onopentag = (function(n) {
					return function(i) {
						var o, s, c = Object.create(null), l, u;
						if (c[t] = "", !n.options.ignoreAttrs) for (o in u = i.attributes, u) d.call(u, o) && (!(e in c) && !n.options.mergeAttrs && (c[e] = Object.create(null)), s = n.options.attrValueProcessors ? a(n.options.attrValueProcessors, i.attributes[o], o) : i.attributes[o], l = n.options.attrNameProcessors ? a(n.options.attrNameProcessors, o) : o, n.options.mergeAttrs ? n.assignOrPush(c, l, s) : c[e][l] = s);
						return c["#name"] = n.options.tagNameProcessors ? a(n.options.tagNameProcessors, i.name) : i.name, n.options.xmlns && (c[n.options.xmlnskey] = {
							uri: i.uri,
							local: i.local
						}), r.push(c);
					};
				})(this), this.saxParser.onclosetag = (function(e) {
					return function() {
						var n, o, s, c, l, u = r.pop(), f, p, m, h;
						if (l = u["#name"], (!e.options.explicitChildren || !e.options.preserveChildrenOrder) && delete u["#name"], u.cdata === !0 && (n = u.cdata, delete u.cdata), m = r[r.length - 1], u[t].match(/^\s*$/) && !n ? (o = u[t], delete u[t]) : (e.options.trim && (u[t] = u[t].trim()), e.options.normalize && (u[t] = u[t].replace(/\s{2,}/g, " ").trim()), u[t] = e.options.valueProcessors ? a(e.options.valueProcessors, u[t], l) : u[t], Object.keys(u).length === 1 && t in u && !e.EXPLICIT_CHARKEY && (u = u[t])), i(u) && (u = typeof e.options.emptyTag == "function" ? e.options.emptyTag() : e.options.emptyTag === "" ? o : e.options.emptyTag), e.options.validator != null && (h = "/" + (function() {
							var e, t, n = [];
							for (e = 0, t = r.length; e < t; e++) c = r[e], n.push(c["#name"]);
							return n;
						})().concat(l).join("/"), (function() {
							var t;
							try {
								return u = e.options.validator(h, m && m[l], u);
							} catch (n) {
								return t = n, e.emit("error", t);
							}
						})()), e.options.explicitChildren && !e.options.mergeAttrs && typeof u == "object") {
							if (!e.options.preserveChildrenOrder) c = Object.create(null), e.options.attrkey in u && (c[e.options.attrkey] = u[e.options.attrkey], delete u[e.options.attrkey]), !e.options.charsAsChildren && e.options.charkey in u && (c[e.options.charkey] = u[e.options.charkey], delete u[e.options.charkey]), Object.getOwnPropertyNames(u).length > 0 && (c[e.options.childkey] = u), u = c;
							else if (m) {
								for (s in m[e.options.childkey] = m[e.options.childkey] || [], f = Object.create(null), u) d.call(u, s) && (f[s] = u[s]);
								m[e.options.childkey].push(f), delete u["#name"], Object.keys(u).length === 1 && t in u && !e.EXPLICIT_CHARKEY && (u = u[t]);
							}
						}
						return r.length > 0 ? e.assignOrPush(m, l, u) : (e.options.explicitRoot && (p = u, u = Object.create(null), u[l] = p), e.resultObject = u, e.saxParser.ended = !0, e.emit("end", e.resultObject));
					};
				})(this), n = (function(e) {
					return function(n) {
						var i, a = r[r.length - 1];
						if (a) return a[t] += n, e.options.explicitChildren && e.options.preserveChildrenOrder && e.options.charsAsChildren && (e.options.includeWhiteChars || n.replace(/\\n/g, "").trim() !== "") && (a[e.options.childkey] = a[e.options.childkey] || [], i = { "#name": "__text__" }, i[t] = n, e.options.normalize && (i[t] = i[t].replace(/\s{2,}/g, " ").trim()), a[e.options.childkey].push(i)), a;
					};
				})(this), this.saxParser.ontext = n, this.saxParser.oncdata = (function(e) {
					return function(e) {
						var t = n(e);
						if (t) return t.cdata = !0;
					};
				})(this);
			}, f.prototype.parseString = function(e, n) {
				var r;
				n != null && typeof n == "function" && (this.on("end", function(e) {
					return this.reset(), n(null, e);
				}), this.on("error", function(e) {
					return this.reset(), n(e);
				}));
				try {
					return e = e.toString(), e.trim() === "" ? (this.emit("end", null), !0) : (e = t.stripBOM(e), this.options.async ? (this.remaining = e, c(this.processAsync), this.saxParser) : this.saxParser.write(e).close());
				} catch (e) {
					if (r = e, !(this.saxParser.errThrown || this.saxParser.ended)) return this.emit("error", r), this.saxParser.errThrown = !0;
					if (this.saxParser.ended) throw r;
				}
			}, f.prototype.parseStringPromise = function(e) {
				return new Promise((function(t) {
					return function(n, r) {
						return t.parseString(e, function(e, t) {
							return e ? r(e) : n(t);
						});
					};
				})(this));
			}, f;
		})(r), e.parseString = function(t, n, r) {
			var i, a, o;
			return r == null ? (typeof n == "function" && (i = n), a = {}) : (typeof r == "function" && (i = r), typeof n == "object" && (a = n)), o = new e.Parser(a), o.parseString(t, i);
		}, e.parseStringPromise = function(t, n) {
			var r, i;
			return typeof n == "object" && (r = n), i = new e.Parser(r), i.parseStringPromise(t);
		};
	}).call(e);
})), lm = /* @__PURE__ */ v(((e) => {
	(function() {
		var t, n, r, i, a = function(e, t) {
			for (var n in t) o.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, o = {}.hasOwnProperty;
		n = Ep(), t = im(), r = cm(), i = sm(), e.defaults = n.defaults, e.processors = i, e.ValidationError = (function(e) {
			a(t, e);
			function t(e) {
				this.message = e;
			}
			return t;
		})(Error), e.Builder = t.Builder, e.Parser = r.Parser, e.parseString = r.parseString, e.parseStringPromise = r.parseStringPromise;
	}).call(e);
})), um = /* @__PURE__ */ v(((e, t) => {
	var n = t.exports = {};
	n.feed = [
		["author", "creator"],
		["dc:publisher", "publisher"],
		["dc:creator", "creator"],
		["dc:source", "source"],
		["dc:title", "title"],
		["dc:type", "type"],
		"title",
		"description",
		"author",
		"pubDate",
		"webMaster",
		"managingEditor",
		"generator",
		"link",
		"language",
		"copyright",
		"lastBuildDate",
		"docs",
		"generator",
		"ttl",
		"rating",
		"skipHours",
		"skipDays"
	], n.item = [
		["author", "creator"],
		["dc:creator", "creator"],
		["dc:date", "date"],
		["dc:language", "language"],
		["dc:rights", "rights"],
		["dc:source", "source"],
		["dc:title", "title"],
		"title",
		"link",
		"pubDate",
		"author",
		"summary",
		[
			"content:encoded",
			"content:encoded",
			{ includeSnippet: !0 }
		],
		"enclosure",
		"dc:creator",
		"dc:date",
		"comments"
	];
	var r = function(e) {
		return ["itunes:" + e, e];
	};
	n.podcastFeed = [
		"author",
		"subtitle",
		"summary",
		"explicit"
	].map(r), n.podcastItem = [
		"author",
		"subtitle",
		"summary",
		"explicit",
		"duration",
		"image",
		"episode",
		"image",
		"season",
		"keywords",
		"episodeType"
	].map(r);
})), dm = /* @__PURE__ */ y({
	AElig: () => "Æ",
	AMP: () => "&",
	Aacute: () => "Á",
	Abreve: () => "Ă",
	Acirc: () => "Â",
	Acy: () => "А",
	Afr: () => pm,
	Agrave: () => "À",
	Alpha: () => "Α",
	Amacr: () => "Ā",
	And: () => "⩓",
	Aogon: () => "Ą",
	Aopf: () => hm,
	ApplyFunction: () => "⁡",
	Aring: () => "Å",
	Ascr: () => _m,
	Assign: () => "≔",
	Atilde: () => "Ã",
	Auml: () => "Ä",
	Backslash: () => "∖",
	Barv: () => "⫧",
	Barwed: () => "⌆",
	Bcy: () => "Б",
	Because: () => "∵",
	Bernoullis: () => "ℬ",
	Beta: () => "Β",
	Bfr: () => ym,
	Bopf: () => Cm,
	Breve: () => "˘",
	Bscr: () => "ℬ",
	Bumpeq: () => "≎",
	CHcy: () => "Ч",
	COPY: () => "©",
	Cacute: () => "Ć",
	Cap: () => "⋒",
	CapitalDifferentialD: () => "ⅅ",
	Cayleys: () => "ℭ",
	Ccaron: () => "Č",
	Ccedil: () => "Ç",
	Ccirc: () => "Ĉ",
	Cconint: () => "∰",
	Cdot: () => "Ċ",
	Cedilla: () => "¸",
	CenterDot: () => "·",
	Cfr: () => "ℭ",
	Chi: () => "Χ",
	CircleDot: () => "⊙",
	CircleMinus: () => "⊖",
	CirclePlus: () => "⊕",
	CircleTimes: () => "⊗",
	ClockwiseContourIntegral: () => "∲",
	CloseCurlyDoubleQuote: () => "”",
	CloseCurlyQuote: () => "’",
	Colon: () => "∷",
	Colone: () => "⩴",
	Congruent: () => "≡",
	Conint: () => "∯",
	ContourIntegral: () => "∮",
	Copf: () => "ℂ",
	Coproduct: () => "∐",
	CounterClockwiseContourIntegral: () => "∳",
	Cross: () => "⨯",
	Cscr: () => km,
	Cup: () => "⋓",
	CupCap: () => "≍",
	DD: () => "ⅅ",
	DDotrahd: () => "⤑",
	DJcy: () => "Ђ",
	DScy: () => "Ѕ",
	DZcy: () => "Џ",
	Dagger: () => "‡",
	Darr: () => "↡",
	Dashv: () => "⫤",
	Dcaron: () => "Ď",
	Dcy: () => "Д",
	Del: () => "∇",
	Delta: () => "Δ",
	Dfr: () => Mm,
	DiacriticalAcute: () => "´",
	DiacriticalDot: () => "˙",
	DiacriticalDoubleAcute: () => "˝",
	DiacriticalGrave: () => "`",
	DiacriticalTilde: () => "˜",
	Diamond: () => "⋄",
	DifferentialD: () => "ⅆ",
	Dopf: () => Pm,
	Dot: () => "¨",
	DotDot: () => "⃜",
	DotEqual: () => "≐",
	DoubleContourIntegral: () => "∯",
	DoubleDot: () => "¨",
	DoubleDownArrow: () => "⇓",
	DoubleLeftArrow: () => "⇐",
	DoubleLeftRightArrow: () => "⇔",
	DoubleLeftTee: () => "⫤",
	DoubleLongLeftArrow: () => "⟸",
	DoubleLongLeftRightArrow: () => "⟺",
	DoubleLongRightArrow: () => "⟹",
	DoubleRightArrow: () => "⇒",
	DoubleRightTee: () => "⊨",
	DoubleUpArrow: () => "⇑",
	DoubleUpDownArrow: () => "⇕",
	DoubleVerticalBar: () => "∥",
	DownArrow: () => "↓",
	DownArrowBar: () => "⤓",
	DownArrowUpArrow: () => "⇵",
	DownBreve: () => "̑",
	DownLeftRightVector: () => "⥐",
	DownLeftTeeVector: () => "⥞",
	DownLeftVector: () => "↽",
	DownLeftVectorBar: () => "⥖",
	DownRightTeeVector: () => "⥟",
	DownRightVector: () => "⇁",
	DownRightVectorBar: () => "⥗",
	DownTee: () => "⊤",
	DownTeeArrow: () => "↧",
	Downarrow: () => "⇓",
	Dscr: () => Im,
	Dstrok: () => "Đ",
	ENG: () => "Ŋ",
	ETH: () => "Ð",
	Eacute: () => "É",
	Ecaron: () => "Ě",
	Ecirc: () => "Ê",
	Ecy: () => "Э",
	Edot: () => "Ė",
	Efr: () => Rm,
	Egrave: () => "È",
	Element: () => "∈",
	Emacr: () => "Ē",
	EmptySmallSquare: () => "◻",
	EmptyVerySmallSquare: () => "▫",
	Eogon: () => "Ę",
	Eopf: () => Bm,
	Epsilon: () => "Ε",
	Equal: () => "⩵",
	EqualTilde: () => "≂",
	Equilibrium: () => "⇌",
	Escr: () => "ℰ",
	Esim: () => "⩳",
	Eta: () => "Η",
	Euml: () => "Ë",
	Exists: () => "∃",
	ExponentialE: () => "ⅇ",
	Fcy: () => "Ф",
	Ffr: () => Hm,
	FilledSmallSquare: () => "◼",
	FilledVerySmallSquare: () => "▪",
	Fopf: () => Wm,
	ForAll: () => "∀",
	Fouriertrf: () => "ℱ",
	Fscr: () => "ℱ",
	GJcy: () => "Ѓ",
	GT: () => ">",
	Gamma: () => "Γ",
	Gammad: () => "Ϝ",
	Gbreve: () => "Ğ",
	Gcedil: () => "Ģ",
	Gcirc: () => "Ĝ",
	Gcy: () => "Г",
	Gdot: () => "Ġ",
	Gfr: () => Jm,
	Gg: () => "⋙",
	Gopf: () => Xm,
	GreaterEqual: () => "≥",
	GreaterEqualLess: () => "⋛",
	GreaterFullEqual: () => "≧",
	GreaterGreater: () => "⪢",
	GreaterLess: () => "≷",
	GreaterSlantEqual: () => "⩾",
	GreaterTilde: () => "≳",
	Gscr: () => Qm,
	Gt: () => "≫",
	HARDcy: () => "Ъ",
	Hacek: () => "ˇ",
	Hat: () => "^",
	Hcirc: () => "Ĥ",
	Hfr: () => "ℌ",
	HilbertSpace: () => "ℋ",
	Hopf: () => "ℍ",
	HorizontalLine: () => "─",
	Hscr: () => "ℋ",
	Hstrok: () => "Ħ",
	HumpDownHump: () => "≎",
	HumpEqual: () => "≏",
	IEcy: () => "Е",
	IJlig: () => "Ĳ",
	IOcy: () => "Ё",
	Iacute: () => "Í",
	Icirc: () => "Î",
	Icy: () => "И",
	Idot: () => "İ",
	Ifr: () => "ℑ",
	Igrave: () => "Ì",
	Im: () => "ℑ",
	Imacr: () => "Ī",
	ImaginaryI: () => "ⅈ",
	Implies: () => "⇒",
	Int: () => "∬",
	Integral: () => "∫",
	Intersection: () => "⋂",
	InvisibleComma: () => "⁣",
	InvisibleTimes: () => "⁢",
	Iogon: () => "Į",
	Iopf: () => ah,
	Iota: () => "Ι",
	Iscr: () => "ℐ",
	Itilde: () => "Ĩ",
	Iukcy: () => "І",
	Iuml: () => "Ï",
	Jcirc: () => "Ĵ",
	Jcy: () => "Й",
	Jfr: () => ch,
	Jopf: () => uh,
	Jscr: () => fh,
	Jsercy: () => "Ј",
	Jukcy: () => "Є",
	KHcy: () => "Х",
	KJcy: () => "Ќ",
	Kappa: () => "Κ",
	Kcedil: () => "Ķ",
	Kcy: () => "К",
	Kfr: () => mh,
	Kopf: () => gh,
	Kscr: () => vh,
	LJcy: () => "Љ",
	LT: () => "<",
	Lacute: () => "Ĺ",
	Lambda: () => "Λ",
	Lang: () => "⟪",
	Laplacetrf: () => "ℒ",
	Larr: () => "↞",
	Lcaron: () => "Ľ",
	Lcedil: () => "Ļ",
	Lcy: () => "Л",
	LeftAngleBracket: () => "⟨",
	LeftArrow: () => "←",
	LeftArrowBar: () => "⇤",
	LeftArrowRightArrow: () => "⇆",
	LeftCeiling: () => "⌈",
	LeftDoubleBracket: () => "⟦",
	LeftDownTeeVector: () => "⥡",
	LeftDownVector: () => "⇃",
	LeftDownVectorBar: () => "⥙",
	LeftFloor: () => "⌊",
	LeftRightArrow: () => "↔",
	LeftRightVector: () => "⥎",
	LeftTee: () => "⊣",
	LeftTeeArrow: () => "↤",
	LeftTeeVector: () => "⥚",
	LeftTriangle: () => "⊲",
	LeftTriangleBar: () => "⧏",
	LeftTriangleEqual: () => "⊴",
	LeftUpDownVector: () => "⥑",
	LeftUpTeeVector: () => "⥠",
	LeftUpVector: () => "↿",
	LeftUpVectorBar: () => "⥘",
	LeftVector: () => "↼",
	LeftVectorBar: () => "⥒",
	Leftarrow: () => "⇐",
	Leftrightarrow: () => "⇔",
	LessEqualGreater: () => "⋚",
	LessFullEqual: () => "≦",
	LessGreater: () => "≶",
	LessLess: () => "⪡",
	LessSlantEqual: () => "⩽",
	LessTilde: () => "≲",
	Lfr: () => Sh,
	Ll: () => "⋘",
	Lleftarrow: () => "⇚",
	Lmidot: () => "Ŀ",
	LongLeftArrow: () => "⟵",
	LongLeftRightArrow: () => "⟷",
	LongRightArrow: () => "⟶",
	Longleftarrow: () => "⟸",
	Longleftrightarrow: () => "⟺",
	Longrightarrow: () => "⟹",
	Lopf: () => wh,
	LowerLeftArrow: () => "↙",
	LowerRightArrow: () => "↘",
	Lscr: () => "ℒ",
	Lsh: () => "↰",
	Lstrok: () => "Ł",
	Lt: () => "≪",
	Map: () => "⤅",
	Mcy: () => "М",
	MediumSpace: () => " ",
	Mellintrf: () => "ℳ",
	Mfr: () => kh,
	MinusPlus: () => "∓",
	Mopf: () => jh,
	Mscr: () => "ℳ",
	Mu: () => "Μ",
	NJcy: () => "Њ",
	Nacute: () => "Ń",
	Ncaron: () => "Ň",
	Ncedil: () => "Ņ",
	Ncy: () => "Н",
	NegativeMediumSpace: () => "​",
	NegativeThickSpace: () => "​",
	NegativeThinSpace: () => "​",
	NegativeVeryThinSpace: () => "​",
	NestedGreaterGreater: () => "≫",
	NestedLessLess: () => "≪",
	NewLine: () => "\n",
	Nfr: () => Hh,
	NoBreak: () => "⁠",
	NonBreakingSpace: () => "\xA0",
	Nopf: () => "ℕ",
	Not: () => "⫬",
	NotCongruent: () => "≢",
	NotCupCap: () => "≭",
	NotDoubleVerticalBar: () => "∦",
	NotElement: () => "∉",
	NotEqual: () => "≠",
	NotEqualTilde: () => ag,
	NotExists: () => "∄",
	NotGreater: () => "≯",
	NotGreaterEqual: () => "≱",
	NotGreaterFullEqual: () => og,
	NotGreaterGreater: () => sg,
	NotGreaterLess: () => "≹",
	NotGreaterSlantEqual: () => cg,
	NotGreaterTilde: () => "≵",
	NotHumpDownHump: () => lg,
	NotHumpEqual: () => ug,
	NotLeftTriangle: () => "⋪",
	NotLeftTriangleBar: () => pg,
	NotLeftTriangleEqual: () => "⋬",
	NotLess: () => "≮",
	NotLessEqual: () => "≰",
	NotLessGreater: () => "≸",
	NotLessLess: () => mg,
	NotLessSlantEqual: () => hg,
	NotLessTilde: () => "≴",
	NotNestedGreaterGreater: () => gg,
	NotNestedLessLess: () => _g,
	NotPrecedes: () => "⊀",
	NotPrecedesEqual: () => vg,
	NotPrecedesSlantEqual: () => "⋠",
	NotReverseElement: () => "∌",
	NotRightTriangle: () => "⋫",
	NotRightTriangleBar: () => yg,
	NotRightTriangleEqual: () => "⋭",
	NotSquareSubset: () => bg,
	NotSquareSubsetEqual: () => "⋢",
	NotSquareSuperset: () => xg,
	NotSquareSupersetEqual: () => "⋣",
	NotSubset: () => Sg,
	NotSubsetEqual: () => "⊈",
	NotSucceeds: () => "⊁",
	NotSucceedsEqual: () => Cg,
	NotSucceedsSlantEqual: () => "⋡",
	NotSucceedsTilde: () => wg,
	NotSuperset: () => Tg,
	NotSupersetEqual: () => "⊉",
	NotTilde: () => "≁",
	NotTildeEqual: () => "≄",
	NotTildeFullEqual: () => "≇",
	NotTildeTilde: () => "≉",
	NotVerticalBar: () => "∤",
	Nscr: () => Ng,
	Ntilde: () => "Ñ",
	Nu: () => "Ν",
	OElig: () => "Œ",
	Oacute: () => "Ó",
	Ocirc: () => "Ô",
	Ocy: () => "О",
	Odblac: () => "Ő",
	Ofr: () => Xg,
	Ograve: () => "Ò",
	Omacr: () => "Ō",
	Omega: () => "Ω",
	Omicron: () => "Ο",
	Oopf: () => Qg,
	OpenCurlyDoubleQuote: () => "“",
	OpenCurlyQuote: () => "‘",
	Or: () => "⩔",
	Oscr: () => e_,
	Oslash: () => "Ø",
	Otilde: () => "Õ",
	Otimes: () => "⨷",
	Ouml: () => "Ö",
	OverBar: () => "‾",
	OverBrace: () => "⏞",
	OverBracket: () => "⎴",
	OverParenthesis: () => "⏜",
	PartialD: () => "∂",
	Pcy: () => "П",
	Pfr: () => t_,
	Phi: () => "Φ",
	Pi: () => "Π",
	PlusMinus: () => "±",
	Poincareplane: () => "ℌ",
	Popf: () => "ℙ",
	Pr: () => "⪻",
	Precedes: () => "≺",
	PrecedesEqual: () => "⪯",
	PrecedesSlantEqual: () => "≼",
	PrecedesTilde: () => "≾",
	Prime: () => "″",
	Product: () => "∏",
	Proportion: () => "∷",
	Proportional: () => "∝",
	Pscr: () => i_,
	Psi: () => "Ψ",
	QUOT: () => "\"",
	Qfr: () => o_,
	Qopf: () => "ℚ",
	Qscr: () => l_,
	RBarr: () => "⤐",
	REG: () => "®",
	Racute: () => "Ŕ",
	Rang: () => "⟫",
	Rarr: () => "↠",
	Rarrtl: () => "⤖",
	Rcaron: () => "Ř",
	Rcedil: () => "Ŗ",
	Rcy: () => "Р",
	Re: () => "ℜ",
	ReverseElement: () => "∋",
	ReverseEquilibrium: () => "⇋",
	ReverseUpEquilibrium: () => "⥯",
	Rfr: () => "ℜ",
	Rho: () => "Ρ",
	RightAngleBracket: () => "⟩",
	RightArrow: () => "→",
	RightArrowBar: () => "⇥",
	RightArrowLeftArrow: () => "⇄",
	RightCeiling: () => "⌉",
	RightDoubleBracket: () => "⟧",
	RightDownTeeVector: () => "⥝",
	RightDownVector: () => "⇂",
	RightDownVectorBar: () => "⥕",
	RightFloor: () => "⌋",
	RightTee: () => "⊢",
	RightTeeArrow: () => "↦",
	RightTeeVector: () => "⥛",
	RightTriangle: () => "⊳",
	RightTriangleBar: () => "⧐",
	RightTriangleEqual: () => "⊵",
	RightUpDownVector: () => "⥏",
	RightUpTeeVector: () => "⥜",
	RightUpVector: () => "↾",
	RightUpVectorBar: () => "⥔",
	RightVector: () => "⇀",
	RightVectorBar: () => "⥓",
	Rightarrow: () => "⇒",
	Ropf: () => "ℝ",
	RoundImplies: () => "⥰",
	Rrightarrow: () => "⇛",
	Rscr: () => "ℛ",
	Rsh: () => "↱",
	RuleDelayed: () => "⧴",
	SHCHcy: () => "Щ",
	SHcy: () => "Ш",
	SOFTcy: () => "Ь",
	Sacute: () => "Ś",
	Sc: () => "⪼",
	Scaron: () => "Š",
	Scedil: () => "Ş",
	Scirc: () => "Ŝ",
	Scy: () => "С",
	Sfr: () => h_,
	ShortDownArrow: () => "↓",
	ShortLeftArrow: () => "←",
	ShortRightArrow: () => "→",
	ShortUpArrow: () => "↑",
	Sigma: () => "Σ",
	SmallCircle: () => "∘",
	Sopf: () => v_,
	Sqrt: () => "√",
	Square: () => "□",
	SquareIntersection: () => "⊓",
	SquareSubset: () => "⊏",
	SquareSubsetEqual: () => "⊑",
	SquareSuperset: () => "⊐",
	SquareSupersetEqual: () => "⊒",
	SquareUnion: () => "⊔",
	Sscr: () => S_,
	Star: () => "⋆",
	Sub: () => "⋐",
	Subset: () => "⋐",
	SubsetEqual: () => "⊆",
	Succeeds: () => "≻",
	SucceedsEqual: () => "⪰",
	SucceedsSlantEqual: () => "≽",
	SucceedsTilde: () => "≿",
	SuchThat: () => "∋",
	Sum: () => "∑",
	Sup: () => "⋑",
	Superset: () => "⊃",
	SupersetEqual: () => "⊇",
	Supset: () => "⋑",
	THORN: () => "Þ",
	TRADE: () => "™",
	TSHcy: () => "Ћ",
	TScy: () => "Ц",
	Tab: () => "	",
	Tau: () => "Τ",
	Tcaron: () => "Ť",
	Tcedil: () => "Ţ",
	Tcy: () => "Т",
	Tfr: () => w_,
	Therefore: () => "∴",
	Theta: () => "Θ",
	ThickSpace: () => E_,
	ThinSpace: () => " ",
	Tilde: () => "∼",
	TildeEqual: () => "≃",
	TildeFullEqual: () => "≅",
	TildeTilde: () => "≈",
	Topf: () => D_,
	TripleDot: () => "⃛",
	Tscr: () => k_,
	Tstrok: () => "Ŧ",
	Uacute: () => "Ú",
	Uarr: () => "↟",
	Uarrocir: () => "⥉",
	Ubrcy: () => "Ў",
	Ubreve: () => "Ŭ",
	Ucirc: () => "Û",
	Ucy: () => "У",
	Udblac: () => "Ű",
	Ufr: () => j_,
	Ugrave: () => "Ù",
	Umacr: () => "Ū",
	UnderBar: () => "_",
	UnderBrace: () => "⏟",
	UnderBracket: () => "⎵",
	UnderParenthesis: () => "⏝",
	Union: () => "⋃",
	UnionPlus: () => "⊎",
	Uogon: () => "Ų",
	Uopf: () => N_,
	UpArrow: () => "↑",
	UpArrowBar: () => "⤒",
	UpArrowDownArrow: () => "⇅",
	UpDownArrow: () => "↕",
	UpEquilibrium: () => "⥮",
	UpTee: () => "⊥",
	UpTeeArrow: () => "↥",
	Uparrow: () => "⇑",
	Updownarrow: () => "⇕",
	UpperLeftArrow: () => "↖",
	UpperRightArrow: () => "↗",
	Upsi: () => "ϒ",
	Upsilon: () => "Υ",
	Uring: () => "Ů",
	Uscr: () => F_,
	Utilde: () => "Ũ",
	Uuml: () => "Ü",
	VDash: () => "⊫",
	Vbar: () => "⫫",
	Vcy: () => "В",
	Vdash: () => "⊩",
	Vdashl: () => "⫦",
	Vee: () => "⋁",
	Verbar: () => "‖",
	Vert: () => "‖",
	VerticalBar: () => "∣",
	VerticalLine: () => "|",
	VerticalSeparator: () => "❘",
	VerticalTilde: () => "≀",
	VeryThinSpace: () => " ",
	Vfr: () => V_,
	Vopf: () => G_,
	Vscr: () => q_,
	Vvdash: () => "⊪",
	Wcirc: () => "Ŵ",
	Wedge: () => "⋀",
	Wfr: () => $_,
	Wopf: () => tv,
	Wscr: () => rv,
	Xfr: () => av,
	Xi: () => "Ξ",
	Xopf: () => sv,
	Xscr: () => lv,
	YAcy: () => "Я",
	YIcy: () => "Ї",
	YUcy: () => "Ю",
	Yacute: () => "Ý",
	Ycirc: () => "Ŷ",
	Ycy: () => "Ы",
	Yfr: () => dv,
	Yopf: () => pv,
	Yscr: () => hv,
	Yuml: () => "Ÿ",
	ZHcy: () => "Ж",
	Zacute: () => "Ź",
	Zcaron: () => "Ž",
	Zcy: () => "З",
	Zdot: () => "Ż",
	ZeroWidthSpace: () => "​",
	Zeta: () => "Ζ",
	Zfr: () => "ℨ",
	Zopf: () => "ℤ",
	Zscr: () => yv,
	aacute: () => "á",
	abreve: () => "ă",
	ac: () => "∾",
	acE: () => fm,
	acd: () => "∿",
	acirc: () => "â",
	acute: () => "´",
	acy: () => "а",
	aelig: () => "æ",
	af: () => "⁡",
	afr: () => mm,
	agrave: () => "à",
	alefsym: () => "ℵ",
	aleph: () => "ℵ",
	alpha: () => "α",
	amacr: () => "ā",
	amalg: () => "⨿",
	amp: () => "&",
	and: () => "∧",
	andand: () => "⩕",
	andd: () => "⩜",
	andslope: () => "⩘",
	andv: () => "⩚",
	ang: () => "∠",
	ange: () => "⦤",
	angle: () => "∠",
	angmsd: () => "∡",
	angmsdaa: () => "⦨",
	angmsdab: () => "⦩",
	angmsdac: () => "⦪",
	angmsdad: () => "⦫",
	angmsdae: () => "⦬",
	angmsdaf: () => "⦭",
	angmsdag: () => "⦮",
	angmsdah: () => "⦯",
	angrt: () => "∟",
	angrtvb: () => "⊾",
	angrtvbd: () => "⦝",
	angsph: () => "∢",
	angst: () => "Å",
	angzarr: () => "⍼",
	aogon: () => "ą",
	aopf: () => gm,
	ap: () => "≈",
	apE: () => "⩰",
	apacir: () => "⩯",
	ape: () => "≊",
	apid: () => "≋",
	apos: () => "'",
	approx: () => "≈",
	approxeq: () => "≊",
	aring: () => "å",
	ascr: () => vm,
	ast: () => "*",
	asymp: () => "≈",
	asympeq: () => "≍",
	atilde: () => "ã",
	auml: () => "ä",
	awconint: () => "∳",
	awint: () => "⨑",
	bNot: () => "⫭",
	backcong: () => "≌",
	backepsilon: () => "϶",
	backprime: () => "‵",
	backsim: () => "∽",
	backsimeq: () => "⋍",
	barvee: () => "⊽",
	barwed: () => "⌅",
	barwedge: () => "⌅",
	bbrk: () => "⎵",
	bbrktbrk: () => "⎶",
	bcong: () => "≌",
	bcy: () => "б",
	bdquo: () => "„",
	becaus: () => "∵",
	because: () => "∵",
	bemptyv: () => "⦰",
	bepsi: () => "϶",
	bernou: () => "ℬ",
	beta: () => "β",
	beth: () => "ℶ",
	between: () => "≬",
	bfr: () => bm,
	bigcap: () => "⋂",
	bigcirc: () => "◯",
	bigcup: () => "⋃",
	bigodot: () => "⨀",
	bigoplus: () => "⨁",
	bigotimes: () => "⨂",
	bigsqcup: () => "⨆",
	bigstar: () => "★",
	bigtriangledown: () => "▽",
	bigtriangleup: () => "△",
	biguplus: () => "⨄",
	bigvee: () => "⋁",
	bigwedge: () => "⋀",
	bkarow: () => "⤍",
	blacklozenge: () => "⧫",
	blacksquare: () => "▪",
	blacktriangle: () => "▴",
	blacktriangledown: () => "▾",
	blacktriangleleft: () => "◂",
	blacktriangleright: () => "▸",
	blank: () => "␣",
	blk12: () => "▒",
	blk14: () => "░",
	blk34: () => "▓",
	block: () => "█",
	bne: () => xm,
	bnequiv: () => Sm,
	bnot: () => "⌐",
	bopf: () => wm,
	bot: () => "⊥",
	bottom: () => "⊥",
	bowtie: () => "⋈",
	boxDL: () => "╗",
	boxDR: () => "╔",
	boxDl: () => "╖",
	boxDr: () => "╓",
	boxH: () => "═",
	boxHD: () => "╦",
	boxHU: () => "╩",
	boxHd: () => "╤",
	boxHu: () => "╧",
	boxUL: () => "╝",
	boxUR: () => "╚",
	boxUl: () => "╜",
	boxUr: () => "╙",
	boxV: () => "║",
	boxVH: () => "╬",
	boxVL: () => "╣",
	boxVR: () => "╠",
	boxVh: () => "╫",
	boxVl: () => "╢",
	boxVr: () => "╟",
	boxbox: () => "⧉",
	boxdL: () => "╕",
	boxdR: () => "╒",
	boxdl: () => "┐",
	boxdr: () => "┌",
	boxh: () => "─",
	boxhD: () => "╥",
	boxhU: () => "╨",
	boxhd: () => "┬",
	boxhu: () => "┴",
	boxminus: () => "⊟",
	boxplus: () => "⊞",
	boxtimes: () => "⊠",
	boxuL: () => "╛",
	boxuR: () => "╘",
	boxul: () => "┘",
	boxur: () => "└",
	boxv: () => "│",
	boxvH: () => "╪",
	boxvL: () => "╡",
	boxvR: () => "╞",
	boxvh: () => "┼",
	boxvl: () => "┤",
	boxvr: () => "├",
	bprime: () => "‵",
	breve: () => "˘",
	brvbar: () => "¦",
	bscr: () => Tm,
	bsemi: () => "⁏",
	bsim: () => "∽",
	bsime: () => "⋍",
	bsol: () => "\\",
	bsolb: () => "⧅",
	bsolhsub: () => "⟈",
	bull: () => "•",
	bullet: () => "•",
	bump: () => "≎",
	bumpE: () => "⪮",
	bumpe: () => "≏",
	bumpeq: () => "≏",
	cacute: () => "ć",
	cap: () => "∩",
	capand: () => "⩄",
	capbrcup: () => "⩉",
	capcap: () => "⩋",
	capcup: () => "⩇",
	capdot: () => "⩀",
	caps: () => Em,
	caret: () => "⁁",
	caron: () => "ˇ",
	ccaps: () => "⩍",
	ccaron: () => "č",
	ccedil: () => "ç",
	ccirc: () => "ĉ",
	ccups: () => "⩌",
	ccupssm: () => "⩐",
	cdot: () => "ċ",
	cedil: () => "¸",
	cemptyv: () => "⦲",
	cent: () => "¢",
	centerdot: () => "·",
	cfr: () => Dm,
	chcy: () => "ч",
	check: () => "✓",
	checkmark: () => "✓",
	chi: () => "χ",
	cir: () => "○",
	cirE: () => "⧃",
	circ: () => "ˆ",
	circeq: () => "≗",
	circlearrowleft: () => "↺",
	circlearrowright: () => "↻",
	circledR: () => "®",
	circledS: () => "Ⓢ",
	circledast: () => "⊛",
	circledcirc: () => "⊚",
	circleddash: () => "⊝",
	cire: () => "≗",
	cirfnint: () => "⨐",
	cirmid: () => "⫯",
	cirscir: () => "⧂",
	clubs: () => "♣",
	clubsuit: () => "♣",
	colon: () => ":",
	colone: () => "≔",
	coloneq: () => "≔",
	comma: () => ",",
	commat: () => "@",
	comp: () => "∁",
	compfn: () => "∘",
	complement: () => "∁",
	complexes: () => "ℂ",
	cong: () => "≅",
	congdot: () => "⩭",
	conint: () => "∮",
	copf: () => Om,
	coprod: () => "∐",
	copy: () => "©",
	copysr: () => "℗",
	crarr: () => "↵",
	cross: () => "✗",
	cscr: () => Am,
	csub: () => "⫏",
	csube: () => "⫑",
	csup: () => "⫐",
	csupe: () => "⫒",
	ctdot: () => "⋯",
	cudarrl: () => "⤸",
	cudarrr: () => "⤵",
	cuepr: () => "⋞",
	cuesc: () => "⋟",
	cularr: () => "↶",
	cularrp: () => "⤽",
	cup: () => "∪",
	cupbrcap: () => "⩈",
	cupcap: () => "⩆",
	cupcup: () => "⩊",
	cupdot: () => "⊍",
	cupor: () => "⩅",
	cups: () => jm,
	curarr: () => "↷",
	curarrm: () => "⤼",
	curlyeqprec: () => "⋞",
	curlyeqsucc: () => "⋟",
	curlyvee: () => "⋎",
	curlywedge: () => "⋏",
	curren: () => "¤",
	curvearrowleft: () => "↶",
	curvearrowright: () => "↷",
	cuvee: () => "⋎",
	cuwed: () => "⋏",
	cwconint: () => "∲",
	cwint: () => "∱",
	cylcty: () => "⌭",
	dArr: () => "⇓",
	dHar: () => "⥥",
	dagger: () => "†",
	daleth: () => "ℸ",
	darr: () => "↓",
	dash: () => "‐",
	dashv: () => "⊣",
	dbkarow: () => "⤏",
	dblac: () => "˝",
	dcaron: () => "ď",
	dcy: () => "д",
	dd: () => "ⅆ",
	ddagger: () => "‡",
	ddarr: () => "⇊",
	ddotseq: () => "⩷",
	default: () => xv,
	deg: () => "°",
	delta: () => "δ",
	demptyv: () => "⦱",
	dfisht: () => "⥿",
	dfr: () => Nm,
	dharl: () => "⇃",
	dharr: () => "⇂",
	diam: () => "⋄",
	diamond: () => "⋄",
	diamondsuit: () => "♦",
	diams: () => "♦",
	die: () => "¨",
	digamma: () => "ϝ",
	disin: () => "⋲",
	div: () => "÷",
	divide: () => "÷",
	divideontimes: () => "⋇",
	divonx: () => "⋇",
	djcy: () => "ђ",
	dlcorn: () => "⌞",
	dlcrop: () => "⌍",
	dollar: () => "$",
	dopf: () => Fm,
	dot: () => "˙",
	doteq: () => "≐",
	doteqdot: () => "≑",
	dotminus: () => "∸",
	dotplus: () => "∔",
	dotsquare: () => "⊡",
	doublebarwedge: () => "⌆",
	downarrow: () => "↓",
	downdownarrows: () => "⇊",
	downharpoonleft: () => "⇃",
	downharpoonright: () => "⇂",
	drbkarow: () => "⤐",
	drcorn: () => "⌟",
	drcrop: () => "⌌",
	dscr: () => Lm,
	dscy: () => "ѕ",
	dsol: () => "⧶",
	dstrok: () => "đ",
	dtdot: () => "⋱",
	dtri: () => "▿",
	dtrif: () => "▾",
	duarr: () => "⇵",
	duhar: () => "⥯",
	dwangle: () => "⦦",
	dzcy: () => "џ",
	dzigrarr: () => "⟿",
	eDDot: () => "⩷",
	eDot: () => "≑",
	eacute: () => "é",
	easter: () => "⩮",
	ecaron: () => "ě",
	ecir: () => "≖",
	ecirc: () => "ê",
	ecolon: () => "≕",
	ecy: () => "э",
	edot: () => "ė",
	ee: () => "ⅇ",
	efDot: () => "≒",
	efr: () => zm,
	eg: () => "⪚",
	egrave: () => "è",
	egs: () => "⪖",
	egsdot: () => "⪘",
	el: () => "⪙",
	elinters: () => "⏧",
	ell: () => "ℓ",
	els: () => "⪕",
	elsdot: () => "⪗",
	emacr: () => "ē",
	empty: () => "∅",
	emptyset: () => "∅",
	emptyv: () => "∅",
	emsp: () => " ",
	emsp13: () => " ",
	emsp14: () => " ",
	eng: () => "ŋ",
	ensp: () => " ",
	eogon: () => "ę",
	eopf: () => Vm,
	epar: () => "⋕",
	eparsl: () => "⧣",
	eplus: () => "⩱",
	epsi: () => "ε",
	epsilon: () => "ε",
	epsiv: () => "ϵ",
	eqcirc: () => "≖",
	eqcolon: () => "≕",
	eqsim: () => "≂",
	eqslantgtr: () => "⪖",
	eqslantless: () => "⪕",
	equals: () => "=",
	equest: () => "≟",
	equiv: () => "≡",
	equivDD: () => "⩸",
	eqvparsl: () => "⧥",
	erDot: () => "≓",
	erarr: () => "⥱",
	escr: () => "ℯ",
	esdot: () => "≐",
	esim: () => "≂",
	eta: () => "η",
	eth: () => "ð",
	euml: () => "ë",
	euro: () => "€",
	excl: () => "!",
	exist: () => "∃",
	expectation: () => "ℰ",
	exponentiale: () => "ⅇ",
	fallingdotseq: () => "≒",
	fcy: () => "ф",
	female: () => "♀",
	ffilig: () => "ﬃ",
	fflig: () => "ﬀ",
	ffllig: () => "ﬄ",
	ffr: () => Um,
	filig: () => "ﬁ",
	fjlig: () => "fj",
	flat: () => "♭",
	fllig: () => "ﬂ",
	fltns: () => "▱",
	fnof: () => "ƒ",
	fopf: () => Gm,
	forall: () => "∀",
	fork: () => "⋔",
	forkv: () => "⫙",
	fpartint: () => "⨍",
	frac12: () => "½",
	frac13: () => "⅓",
	frac14: () => "¼",
	frac15: () => "⅕",
	frac16: () => "⅙",
	frac18: () => "⅛",
	frac23: () => "⅔",
	frac25: () => "⅖",
	frac34: () => "¾",
	frac35: () => "⅗",
	frac38: () => "⅜",
	frac45: () => "⅘",
	frac56: () => "⅚",
	frac58: () => "⅝",
	frac78: () => "⅞",
	frasl: () => "⁄",
	frown: () => "⌢",
	fscr: () => Km,
	gE: () => "≧",
	gEl: () => "⪌",
	gacute: () => "ǵ",
	gamma: () => "γ",
	gammad: () => "ϝ",
	gap: () => "⪆",
	gbreve: () => "ğ",
	gcirc: () => "ĝ",
	gcy: () => "г",
	gdot: () => "ġ",
	ge: () => "≥",
	gel: () => "⋛",
	geq: () => "≥",
	geqq: () => "≧",
	geqslant: () => "⩾",
	ges: () => "⩾",
	gescc: () => "⪩",
	gesdot: () => "⪀",
	gesdoto: () => "⪂",
	gesdotol: () => "⪄",
	gesl: () => qm,
	gesles: () => "⪔",
	gfr: () => Ym,
	gg: () => "≫",
	ggg: () => "⋙",
	gimel: () => "ℷ",
	gjcy: () => "ѓ",
	gl: () => "≷",
	glE: () => "⪒",
	gla: () => "⪥",
	glj: () => "⪤",
	gnE: () => "≩",
	gnap: () => "⪊",
	gnapprox: () => "⪊",
	gne: () => "⪈",
	gneq: () => "⪈",
	gneqq: () => "≩",
	gnsim: () => "⋧",
	gopf: () => Zm,
	grave: () => "`",
	gscr: () => "ℊ",
	gsim: () => "≳",
	gsime: () => "⪎",
	gsiml: () => "⪐",
	gt: () => ">",
	gtcc: () => "⪧",
	gtcir: () => "⩺",
	gtdot: () => "⋗",
	gtlPar: () => "⦕",
	gtquest: () => "⩼",
	gtrapprox: () => "⪆",
	gtrarr: () => "⥸",
	gtrdot: () => "⋗",
	gtreqless: () => "⋛",
	gtreqqless: () => "⪌",
	gtrless: () => "≷",
	gtrsim: () => "≳",
	gvertneqq: () => $m,
	gvnE: () => eh,
	hArr: () => "⇔",
	hairsp: () => " ",
	half: () => "½",
	hamilt: () => "ℋ",
	hardcy: () => "ъ",
	harr: () => "↔",
	harrcir: () => "⥈",
	harrw: () => "↭",
	hbar: () => "ℏ",
	hcirc: () => "ĥ",
	hearts: () => "♥",
	heartsuit: () => "♥",
	hellip: () => "…",
	hercon: () => "⊹",
	hfr: () => th,
	hksearow: () => "⤥",
	hkswarow: () => "⤦",
	hoarr: () => "⇿",
	homtht: () => "∻",
	hookleftarrow: () => "↩",
	hookrightarrow: () => "↪",
	hopf: () => nh,
	horbar: () => "―",
	hscr: () => rh,
	hslash: () => "ℏ",
	hstrok: () => "ħ",
	hybull: () => "⁃",
	hyphen: () => "‐",
	iacute: () => "í",
	ic: () => "⁣",
	icirc: () => "î",
	icy: () => "и",
	iecy: () => "е",
	iexcl: () => "¡",
	iff: () => "⇔",
	ifr: () => ih,
	igrave: () => "ì",
	ii: () => "ⅈ",
	iiiint: () => "⨌",
	iiint: () => "∭",
	iinfin: () => "⧜",
	iiota: () => "℩",
	ijlig: () => "ĳ",
	imacr: () => "ī",
	image: () => "ℑ",
	imagline: () => "ℐ",
	imagpart: () => "ℑ",
	imath: () => "ı",
	imof: () => "⊷",
	imped: () => "Ƶ",
	incare: () => "℅",
	infin: () => "∞",
	infintie: () => "⧝",
	inodot: () => "ı",
	int: () => "∫",
	intcal: () => "⊺",
	integers: () => "ℤ",
	intercal: () => "⊺",
	intlarhk: () => "⨗",
	intprod: () => "⨼",
	iocy: () => "ё",
	iogon: () => "į",
	iopf: () => oh,
	iota: () => "ι",
	iprod: () => "⨼",
	iquest: () => "¿",
	iscr: () => sh,
	isin: () => "∈",
	isinE: () => "⋹",
	isindot: () => "⋵",
	isins: () => "⋴",
	isinsv: () => "⋳",
	isinv: () => "∈",
	it: () => "⁢",
	itilde: () => "ĩ",
	iukcy: () => "і",
	iuml: () => "ï",
	jcirc: () => "ĵ",
	jcy: () => "й",
	jfr: () => lh,
	jmath: () => "ȷ",
	jopf: () => dh,
	jscr: () => ph,
	jsercy: () => "ј",
	jukcy: () => "є",
	kappa: () => "κ",
	kappav: () => "ϰ",
	kcedil: () => "ķ",
	kcy: () => "к",
	kfr: () => hh,
	kgreen: () => "ĸ",
	khcy: () => "х",
	kjcy: () => "ќ",
	kopf: () => _h,
	kscr: () => yh,
	lAarr: () => "⇚",
	lArr: () => "⇐",
	lAtail: () => "⤛",
	lBarr: () => "⤎",
	lE: () => "≦",
	lEg: () => "⪋",
	lHar: () => "⥢",
	lacute: () => "ĺ",
	laemptyv: () => "⦴",
	lagran: () => "ℒ",
	lambda: () => "λ",
	lang: () => "⟨",
	langd: () => "⦑",
	langle: () => "⟨",
	lap: () => "⪅",
	laquo: () => "«",
	larr: () => "←",
	larrb: () => "⇤",
	larrbfs: () => "⤟",
	larrfs: () => "⤝",
	larrhk: () => "↩",
	larrlp: () => "↫",
	larrpl: () => "⤹",
	larrsim: () => "⥳",
	larrtl: () => "↢",
	lat: () => "⪫",
	latail: () => "⤙",
	late: () => "⪭",
	lates: () => bh,
	lbarr: () => "⤌",
	lbbrk: () => "❲",
	lbrace: () => "{",
	lbrack: () => "[",
	lbrke: () => "⦋",
	lbrksld: () => "⦏",
	lbrkslu: () => "⦍",
	lcaron: () => "ľ",
	lcedil: () => "ļ",
	lceil: () => "⌈",
	lcub: () => "{",
	lcy: () => "л",
	ldca: () => "⤶",
	ldquo: () => "“",
	ldquor: () => "„",
	ldrdhar: () => "⥧",
	ldrushar: () => "⥋",
	ldsh: () => "↲",
	le: () => "≤",
	leftarrow: () => "←",
	leftarrowtail: () => "↢",
	leftharpoondown: () => "↽",
	leftharpoonup: () => "↼",
	leftleftarrows: () => "⇇",
	leftrightarrow: () => "↔",
	leftrightarrows: () => "⇆",
	leftrightharpoons: () => "⇋",
	leftrightsquigarrow: () => "↭",
	leftthreetimes: () => "⋋",
	leg: () => "⋚",
	leq: () => "≤",
	leqq: () => "≦",
	leqslant: () => "⩽",
	les: () => "⩽",
	lescc: () => "⪨",
	lesdot: () => "⩿",
	lesdoto: () => "⪁",
	lesdotor: () => "⪃",
	lesg: () => xh,
	lesges: () => "⪓",
	lessapprox: () => "⪅",
	lessdot: () => "⋖",
	lesseqgtr: () => "⋚",
	lesseqqgtr: () => "⪋",
	lessgtr: () => "≶",
	lesssim: () => "≲",
	lfisht: () => "⥼",
	lfloor: () => "⌊",
	lfr: () => Ch,
	lg: () => "≶",
	lgE: () => "⪑",
	lhard: () => "↽",
	lharu: () => "↼",
	lharul: () => "⥪",
	lhblk: () => "▄",
	ljcy: () => "љ",
	ll: () => "≪",
	llarr: () => "⇇",
	llcorner: () => "⌞",
	llhard: () => "⥫",
	lltri: () => "◺",
	lmidot: () => "ŀ",
	lmoust: () => "⎰",
	lmoustache: () => "⎰",
	lnE: () => "≨",
	lnap: () => "⪉",
	lnapprox: () => "⪉",
	lne: () => "⪇",
	lneq: () => "⪇",
	lneqq: () => "≨",
	lnsim: () => "⋦",
	loang: () => "⟬",
	loarr: () => "⇽",
	lobrk: () => "⟦",
	longleftarrow: () => "⟵",
	longleftrightarrow: () => "⟷",
	longmapsto: () => "⟼",
	longrightarrow: () => "⟶",
	looparrowleft: () => "↫",
	looparrowright: () => "↬",
	lopar: () => "⦅",
	lopf: () => Th,
	loplus: () => "⨭",
	lotimes: () => "⨴",
	lowast: () => "∗",
	lowbar: () => "_",
	loz: () => "◊",
	lozenge: () => "◊",
	lozf: () => "⧫",
	lpar: () => "(",
	lparlt: () => "⦓",
	lrarr: () => "⇆",
	lrcorner: () => "⌟",
	lrhar: () => "⇋",
	lrhard: () => "⥭",
	lrm: () => "‎",
	lrtri: () => "⊿",
	lsaquo: () => "‹",
	lscr: () => Eh,
	lsh: () => "↰",
	lsim: () => "≲",
	lsime: () => "⪍",
	lsimg: () => "⪏",
	lsqb: () => "[",
	lsquo: () => "‘",
	lsquor: () => "‚",
	lstrok: () => "ł",
	lt: () => "<",
	ltcc: () => "⪦",
	ltcir: () => "⩹",
	ltdot: () => "⋖",
	lthree: () => "⋋",
	ltimes: () => "⋉",
	ltlarr: () => "⥶",
	ltquest: () => "⩻",
	ltrPar: () => "⦖",
	ltri: () => "◃",
	ltrie: () => "⊴",
	ltrif: () => "◂",
	lurdshar: () => "⥊",
	luruhar: () => "⥦",
	lvertneqq: () => Dh,
	lvnE: () => Oh,
	mDDot: () => "∺",
	macr: () => "¯",
	male: () => "♂",
	malt: () => "✠",
	maltese: () => "✠",
	map: () => "↦",
	mapsto: () => "↦",
	mapstodown: () => "↧",
	mapstoleft: () => "↤",
	mapstoup: () => "↥",
	marker: () => "▮",
	mcomma: () => "⨩",
	mcy: () => "м",
	mdash: () => "—",
	measuredangle: () => "∡",
	mfr: () => Ah,
	mho: () => "℧",
	micro: () => "µ",
	mid: () => "∣",
	midast: () => "*",
	midcir: () => "⫰",
	middot: () => "·",
	minus: () => "−",
	minusb: () => "⊟",
	minusd: () => "∸",
	minusdu: () => "⨪",
	mlcp: () => "⫛",
	mldr: () => "…",
	mnplus: () => "∓",
	models: () => "⊧",
	mopf: () => Mh,
	mp: () => "∓",
	mscr: () => Nh,
	mstpos: () => "∾",
	mu: () => "μ",
	multimap: () => "⊸",
	mumap: () => "⊸",
	nGg: () => Jh,
	nGt: () => Yh,
	nGtv: () => Xh,
	nLeftarrow: () => "⇍",
	nLeftrightarrow: () => "⇎",
	nLl: () => tg,
	nLt: () => ng,
	nLtv: () => rg,
	nRightarrow: () => "⇏",
	nVDash: () => "⊯",
	nVdash: () => "⊮",
	nabla: () => "∇",
	nacute: () => "ń",
	nang: () => Ph,
	nap: () => "≉",
	napE: () => Fh,
	napid: () => Ih,
	napos: () => "ŉ",
	napprox: () => "≉",
	natur: () => "♮",
	natural: () => "♮",
	naturals: () => "ℕ",
	nbsp: () => "\xA0",
	nbump: () => Lh,
	nbumpe: () => Rh,
	ncap: () => "⩃",
	ncaron: () => "ň",
	ncedil: () => "ņ",
	ncong: () => "≇",
	ncongdot: () => zh,
	ncup: () => "⩂",
	ncy: () => "н",
	ndash: () => "–",
	ne: () => "≠",
	neArr: () => "⇗",
	nearhk: () => "⤤",
	nearr: () => "↗",
	nearrow: () => "↗",
	nedot: () => Bh,
	nequiv: () => "≢",
	nesear: () => "⤨",
	nesim: () => Vh,
	nexist: () => "∄",
	nexists: () => "∄",
	nfr: () => Uh,
	ngE: () => Wh,
	nge: () => "≱",
	ngeq: () => "≱",
	ngeqq: () => Gh,
	ngeqslant: () => Kh,
	nges: () => qh,
	ngsim: () => "≵",
	ngt: () => "≯",
	ngtr: () => "≯",
	nhArr: () => "⇎",
	nharr: () => "↮",
	nhpar: () => "⫲",
	ni: () => "∋",
	nis: () => "⋼",
	nisd: () => "⋺",
	niv: () => "∋",
	njcy: () => "њ",
	nlArr: () => "⇍",
	nlE: () => Zh,
	nlarr: () => "↚",
	nldr: () => "‥",
	nle: () => "≰",
	nleftarrow: () => "↚",
	nleftrightarrow: () => "↮",
	nleq: () => "≰",
	nleqq: () => Qh,
	nleqslant: () => $h,
	nles: () => eg,
	nless: () => "≮",
	nlsim: () => "≴",
	nlt: () => "≮",
	nltri: () => "⋪",
	nltrie: () => "⋬",
	nmid: () => "∤",
	nopf: () => ig,
	not: () => "¬",
	notin: () => "∉",
	notinE: () => fg,
	notindot: () => dg,
	notinva: () => "∉",
	notinvb: () => "⋷",
	notinvc: () => "⋶",
	notni: () => "∌",
	notniva: () => "∌",
	notnivb: () => "⋾",
	notnivc: () => "⋽",
	npar: () => "∦",
	nparallel: () => "∦",
	nparsl: () => Eg,
	npart: () => Dg,
	npolint: () => "⨔",
	npr: () => "⊀",
	nprcue: () => "⋠",
	npre: () => kg,
	nprec: () => "⊀",
	npreceq: () => Og,
	nrArr: () => "⇏",
	nrarr: () => "↛",
	nrarrc: () => Ag,
	nrarrw: () => jg,
	nrightarrow: () => "↛",
	nrtri: () => "⋫",
	nrtrie: () => "⋭",
	nsc: () => "⊁",
	nsccue: () => "⋡",
	nsce: () => Mg,
	nscr: () => Pg,
	nshortmid: () => "∤",
	nshortparallel: () => "∦",
	nsim: () => "≁",
	nsime: () => "≄",
	nsimeq: () => "≄",
	nsmid: () => "∤",
	nspar: () => "∦",
	nsqsube: () => "⋢",
	nsqsupe: () => "⋣",
	nsub: () => "⊄",
	nsubE: () => Fg,
	nsube: () => "⊈",
	nsubset: () => Ig,
	nsubseteq: () => "⊈",
	nsubseteqq: () => Lg,
	nsucc: () => "⊁",
	nsucceq: () => Rg,
	nsup: () => "⊅",
	nsupE: () => zg,
	nsupe: () => "⊉",
	nsupset: () => Bg,
	nsupseteq: () => "⊉",
	nsupseteqq: () => Vg,
	ntgl: () => "≹",
	ntilde: () => "ñ",
	ntlg: () => "≸",
	ntriangleleft: () => "⋪",
	ntrianglelefteq: () => "⋬",
	ntriangleright: () => "⋫",
	ntrianglerighteq: () => "⋭",
	nu: () => "ν",
	num: () => "#",
	numero: () => "№",
	numsp: () => " ",
	nvDash: () => "⊭",
	nvHarr: () => "⤄",
	nvap: () => Hg,
	nvdash: () => "⊬",
	nvge: () => Ug,
	nvgt: () => Wg,
	nvinfin: () => "⧞",
	nvlArr: () => "⤂",
	nvle: () => Gg,
	nvlt: () => Kg,
	nvltrie: () => qg,
	nvrArr: () => "⤃",
	nvrtrie: () => Jg,
	nvsim: () => Yg,
	nwArr: () => "⇖",
	nwarhk: () => "⤣",
	nwarr: () => "↖",
	nwarrow: () => "↖",
	nwnear: () => "⤧",
	oS: () => "Ⓢ",
	oacute: () => "ó",
	oast: () => "⊛",
	ocir: () => "⊚",
	ocirc: () => "ô",
	ocy: () => "о",
	odash: () => "⊝",
	odblac: () => "ő",
	odiv: () => "⨸",
	odot: () => "⊙",
	odsold: () => "⦼",
	oelig: () => "œ",
	ofcir: () => "⦿",
	ofr: () => Zg,
	ogon: () => "˛",
	ograve: () => "ò",
	ogt: () => "⧁",
	ohbar: () => "⦵",
	ohm: () => "Ω",
	oint: () => "∮",
	olarr: () => "↺",
	olcir: () => "⦾",
	olcross: () => "⦻",
	oline: () => "‾",
	olt: () => "⧀",
	omacr: () => "ō",
	omega: () => "ω",
	omicron: () => "ο",
	omid: () => "⦶",
	ominus: () => "⊖",
	oopf: () => $g,
	opar: () => "⦷",
	operp: () => "⦹",
	oplus: () => "⊕",
	or: () => "∨",
	orarr: () => "↻",
	ord: () => "⩝",
	order: () => "ℴ",
	orderof: () => "ℴ",
	ordf: () => "ª",
	ordm: () => "º",
	origof: () => "⊶",
	oror: () => "⩖",
	orslope: () => "⩗",
	orv: () => "⩛",
	oscr: () => "ℴ",
	oslash: () => "ø",
	osol: () => "⊘",
	otilde: () => "õ",
	otimes: () => "⊗",
	otimesas: () => "⨶",
	ouml: () => "ö",
	ovbar: () => "⌽",
	par: () => "∥",
	para: () => "¶",
	parallel: () => "∥",
	parsim: () => "⫳",
	parsl: () => "⫽",
	part: () => "∂",
	pcy: () => "п",
	percnt: () => "%",
	period: () => ".",
	permil: () => "‰",
	perp: () => "⊥",
	pertenk: () => "‱",
	pfr: () => n_,
	phi: () => "φ",
	phiv: () => "ϕ",
	phmmat: () => "ℳ",
	phone: () => "☎",
	pi: () => "π",
	pitchfork: () => "⋔",
	piv: () => "ϖ",
	planck: () => "ℏ",
	planckh: () => "ℎ",
	plankv: () => "ℏ",
	plus: () => "+",
	plusacir: () => "⨣",
	plusb: () => "⊞",
	pluscir: () => "⨢",
	plusdo: () => "∔",
	plusdu: () => "⨥",
	pluse: () => "⩲",
	plusmn: () => "±",
	plussim: () => "⨦",
	plustwo: () => "⨧",
	pm: () => "±",
	pointint: () => "⨕",
	popf: () => r_,
	pound: () => "£",
	pr: () => "≺",
	prE: () => "⪳",
	prap: () => "⪷",
	prcue: () => "≼",
	pre: () => "⪯",
	prec: () => "≺",
	precapprox: () => "⪷",
	preccurlyeq: () => "≼",
	preceq: () => "⪯",
	precnapprox: () => "⪹",
	precneqq: () => "⪵",
	precnsim: () => "⋨",
	precsim: () => "≾",
	prime: () => "′",
	primes: () => "ℙ",
	prnE: () => "⪵",
	prnap: () => "⪹",
	prnsim: () => "⋨",
	prod: () => "∏",
	profalar: () => "⌮",
	profline: () => "⌒",
	profsurf: () => "⌓",
	prop: () => "∝",
	propto: () => "∝",
	prsim: () => "≾",
	prurel: () => "⊰",
	pscr: () => a_,
	psi: () => "ψ",
	puncsp: () => " ",
	qfr: () => s_,
	qint: () => "⨌",
	qopf: () => c_,
	qprime: () => "⁗",
	qscr: () => u_,
	quaternions: () => "ℍ",
	quatint: () => "⨖",
	quest: () => "?",
	questeq: () => "≟",
	quot: () => "\"",
	rAarr: () => "⇛",
	rArr: () => "⇒",
	rAtail: () => "⤜",
	rBarr: () => "⤏",
	rHar: () => "⥤",
	race: () => d_,
	racute: () => "ŕ",
	radic: () => "√",
	raemptyv: () => "⦳",
	rang: () => "⟩",
	rangd: () => "⦒",
	range: () => "⦥",
	rangle: () => "⟩",
	raquo: () => "»",
	rarr: () => "→",
	rarrap: () => "⥵",
	rarrb: () => "⇥",
	rarrbfs: () => "⤠",
	rarrc: () => "⤳",
	rarrfs: () => "⤞",
	rarrhk: () => "↪",
	rarrlp: () => "↬",
	rarrpl: () => "⥅",
	rarrsim: () => "⥴",
	rarrtl: () => "↣",
	rarrw: () => "↝",
	ratail: () => "⤚",
	ratio: () => "∶",
	rationals: () => "ℚ",
	rbarr: () => "⤍",
	rbbrk: () => "❳",
	rbrace: () => "}",
	rbrack: () => "]",
	rbrke: () => "⦌",
	rbrksld: () => "⦎",
	rbrkslu: () => "⦐",
	rcaron: () => "ř",
	rcedil: () => "ŗ",
	rceil: () => "⌉",
	rcub: () => "}",
	rcy: () => "р",
	rdca: () => "⤷",
	rdldhar: () => "⥩",
	rdquo: () => "”",
	rdquor: () => "”",
	rdsh: () => "↳",
	real: () => "ℜ",
	realine: () => "ℛ",
	realpart: () => "ℜ",
	reals: () => "ℝ",
	rect: () => "▭",
	reg: () => "®",
	rfisht: () => "⥽",
	rfloor: () => "⌋",
	rfr: () => f_,
	rhard: () => "⇁",
	rharu: () => "⇀",
	rharul: () => "⥬",
	rho: () => "ρ",
	rhov: () => "ϱ",
	rightarrow: () => "→",
	rightarrowtail: () => "↣",
	rightharpoondown: () => "⇁",
	rightharpoonup: () => "⇀",
	rightleftarrows: () => "⇄",
	rightleftharpoons: () => "⇌",
	rightrightarrows: () => "⇉",
	rightsquigarrow: () => "↝",
	rightthreetimes: () => "⋌",
	ring: () => "˚",
	risingdotseq: () => "≓",
	rlarr: () => "⇄",
	rlhar: () => "⇌",
	rlm: () => "‏",
	rmoust: () => "⎱",
	rmoustache: () => "⎱",
	rnmid: () => "⫮",
	roang: () => "⟭",
	roarr: () => "⇾",
	robrk: () => "⟧",
	ropar: () => "⦆",
	ropf: () => p_,
	roplus: () => "⨮",
	rotimes: () => "⨵",
	rpar: () => ")",
	rpargt: () => "⦔",
	rppolint: () => "⨒",
	rrarr: () => "⇉",
	rsaquo: () => "›",
	rscr: () => m_,
	rsh: () => "↱",
	rsqb: () => "]",
	rsquo: () => "’",
	rsquor: () => "’",
	rthree: () => "⋌",
	rtimes: () => "⋊",
	rtri: () => "▹",
	rtrie: () => "⊵",
	rtrif: () => "▸",
	rtriltri: () => "⧎",
	ruluhar: () => "⥨",
	rx: () => "℞",
	sacute: () => "ś",
	sbquo: () => "‚",
	sc: () => "≻",
	scE: () => "⪴",
	scap: () => "⪸",
	scaron: () => "š",
	sccue: () => "≽",
	sce: () => "⪰",
	scedil: () => "ş",
	scirc: () => "ŝ",
	scnE: () => "⪶",
	scnap: () => "⪺",
	scnsim: () => "⋩",
	scpolint: () => "⨓",
	scsim: () => "≿",
	scy: () => "с",
	sdot: () => "⋅",
	sdotb: () => "⊡",
	sdote: () => "⩦",
	seArr: () => "⇘",
	searhk: () => "⤥",
	searr: () => "↘",
	searrow: () => "↘",
	sect: () => "§",
	semi: () => ";",
	seswar: () => "⤩",
	setminus: () => "∖",
	setmn: () => "∖",
	sext: () => "✶",
	sfr: () => g_,
	sfrown: () => "⌢",
	sharp: () => "♯",
	shchcy: () => "щ",
	shcy: () => "ш",
	shortmid: () => "∣",
	shortparallel: () => "∥",
	shy: () => "­",
	sigma: () => "σ",
	sigmaf: () => "ς",
	sigmav: () => "ς",
	sim: () => "∼",
	simdot: () => "⩪",
	sime: () => "≃",
	simeq: () => "≃",
	simg: () => "⪞",
	simgE: () => "⪠",
	siml: () => "⪝",
	simlE: () => "⪟",
	simne: () => "≆",
	simplus: () => "⨤",
	simrarr: () => "⥲",
	slarr: () => "←",
	smallsetminus: () => "∖",
	smashp: () => "⨳",
	smeparsl: () => "⧤",
	smid: () => "∣",
	smile: () => "⌣",
	smt: () => "⪪",
	smte: () => "⪬",
	smtes: () => __,
	softcy: () => "ь",
	sol: () => "/",
	solb: () => "⧄",
	solbar: () => "⌿",
	sopf: () => y_,
	spades: () => "♠",
	spadesuit: () => "♠",
	spar: () => "∥",
	sqcap: () => "⊓",
	sqcaps: () => b_,
	sqcup: () => "⊔",
	sqcups: () => x_,
	sqsub: () => "⊏",
	sqsube: () => "⊑",
	sqsubset: () => "⊏",
	sqsubseteq: () => "⊑",
	sqsup: () => "⊐",
	sqsupe: () => "⊒",
	sqsupset: () => "⊐",
	sqsupseteq: () => "⊒",
	squ: () => "□",
	square: () => "□",
	squarf: () => "▪",
	squf: () => "▪",
	srarr: () => "→",
	sscr: () => C_,
	ssetmn: () => "∖",
	ssmile: () => "⌣",
	sstarf: () => "⋆",
	star: () => "☆",
	starf: () => "★",
	straightepsilon: () => "ϵ",
	straightphi: () => "ϕ",
	strns: () => "¯",
	sub: () => "⊂",
	subE: () => "⫅",
	subdot: () => "⪽",
	sube: () => "⊆",
	subedot: () => "⫃",
	submult: () => "⫁",
	subnE: () => "⫋",
	subne: () => "⊊",
	subplus: () => "⪿",
	subrarr: () => "⥹",
	subset: () => "⊂",
	subseteq: () => "⊆",
	subseteqq: () => "⫅",
	subsetneq: () => "⊊",
	subsetneqq: () => "⫋",
	subsim: () => "⫇",
	subsub: () => "⫕",
	subsup: () => "⫓",
	succ: () => "≻",
	succapprox: () => "⪸",
	succcurlyeq: () => "≽",
	succeq: () => "⪰",
	succnapprox: () => "⪺",
	succneqq: () => "⪶",
	succnsim: () => "⋩",
	succsim: () => "≿",
	sum: () => "∑",
	sung: () => "♪",
	sup: () => "⊃",
	sup1: () => "¹",
	sup2: () => "²",
	sup3: () => "³",
	supE: () => "⫆",
	supdot: () => "⪾",
	supdsub: () => "⫘",
	supe: () => "⊇",
	supedot: () => "⫄",
	suphsol: () => "⟉",
	suphsub: () => "⫗",
	suplarr: () => "⥻",
	supmult: () => "⫂",
	supnE: () => "⫌",
	supne: () => "⊋",
	supplus: () => "⫀",
	supset: () => "⊃",
	supseteq: () => "⊇",
	supseteqq: () => "⫆",
	supsetneq: () => "⊋",
	supsetneqq: () => "⫌",
	supsim: () => "⫈",
	supsub: () => "⫔",
	supsup: () => "⫖",
	swArr: () => "⇙",
	swarhk: () => "⤦",
	swarr: () => "↙",
	swarrow: () => "↙",
	swnwar: () => "⤪",
	szlig: () => "ß",
	target: () => "⌖",
	tau: () => "τ",
	tbrk: () => "⎴",
	tcaron: () => "ť",
	tcedil: () => "ţ",
	tcy: () => "т",
	tdot: () => "⃛",
	telrec: () => "⌕",
	tfr: () => T_,
	there4: () => "∴",
	therefore: () => "∴",
	theta: () => "θ",
	thetasym: () => "ϑ",
	thetav: () => "ϑ",
	thickapprox: () => "≈",
	thicksim: () => "∼",
	thinsp: () => " ",
	thkap: () => "≈",
	thksim: () => "∼",
	thorn: () => "þ",
	tilde: () => "˜",
	times: () => "×",
	timesb: () => "⊠",
	timesbar: () => "⨱",
	timesd: () => "⨰",
	tint: () => "∭",
	toea: () => "⤨",
	top: () => "⊤",
	topbot: () => "⌶",
	topcir: () => "⫱",
	topf: () => O_,
	topfork: () => "⫚",
	tosa: () => "⤩",
	tprime: () => "‴",
	trade: () => "™",
	triangle: () => "▵",
	triangledown: () => "▿",
	triangleleft: () => "◃",
	trianglelefteq: () => "⊴",
	triangleq: () => "≜",
	triangleright: () => "▹",
	trianglerighteq: () => "⊵",
	tridot: () => "◬",
	trie: () => "≜",
	triminus: () => "⨺",
	triplus: () => "⨹",
	trisb: () => "⧍",
	tritime: () => "⨻",
	trpezium: () => "⏢",
	tscr: () => A_,
	tscy: () => "ц",
	tshcy: () => "ћ",
	tstrok: () => "ŧ",
	twixt: () => "≬",
	twoheadleftarrow: () => "↞",
	twoheadrightarrow: () => "↠",
	uArr: () => "⇑",
	uHar: () => "⥣",
	uacute: () => "ú",
	uarr: () => "↑",
	ubrcy: () => "ў",
	ubreve: () => "ŭ",
	ucirc: () => "û",
	ucy: () => "у",
	udarr: () => "⇅",
	udblac: () => "ű",
	udhar: () => "⥮",
	ufisht: () => "⥾",
	ufr: () => M_,
	ugrave: () => "ù",
	uharl: () => "↿",
	uharr: () => "↾",
	uhblk: () => "▀",
	ulcorn: () => "⌜",
	ulcorner: () => "⌜",
	ulcrop: () => "⌏",
	ultri: () => "◸",
	umacr: () => "ū",
	uml: () => "¨",
	uogon: () => "ų",
	uopf: () => P_,
	uparrow: () => "↑",
	updownarrow: () => "↕",
	upharpoonleft: () => "↿",
	upharpoonright: () => "↾",
	uplus: () => "⊎",
	upsi: () => "υ",
	upsih: () => "ϒ",
	upsilon: () => "υ",
	upuparrows: () => "⇈",
	urcorn: () => "⌝",
	urcorner: () => "⌝",
	urcrop: () => "⌎",
	uring: () => "ů",
	urtri: () => "◹",
	uscr: () => I_,
	utdot: () => "⋰",
	utilde: () => "ũ",
	utri: () => "▵",
	utrif: () => "▴",
	uuarr: () => "⇈",
	uuml: () => "ü",
	uwangle: () => "⦧",
	vArr: () => "⇕",
	vBar: () => "⫨",
	vBarv: () => "⫩",
	vDash: () => "⊨",
	vangrt: () => "⦜",
	varepsilon: () => "ϵ",
	varkappa: () => "ϰ",
	varnothing: () => "∅",
	varphi: () => "ϕ",
	varpi: () => "ϖ",
	varpropto: () => "∝",
	varr: () => "↕",
	varrho: () => "ϱ",
	varsigma: () => "ς",
	varsubsetneq: () => L_,
	varsubsetneqq: () => R_,
	varsupsetneq: () => z_,
	varsupsetneqq: () => B_,
	vartheta: () => "ϑ",
	vartriangleleft: () => "⊲",
	vartriangleright: () => "⊳",
	vcy: () => "в",
	vdash: () => "⊢",
	vee: () => "∨",
	veebar: () => "⊻",
	veeeq: () => "≚",
	vellip: () => "⋮",
	verbar: () => "|",
	vert: () => "|",
	vfr: () => H_,
	vltri: () => "⊲",
	vnsub: () => U_,
	vnsup: () => W_,
	vopf: () => K_,
	vprop: () => "∝",
	vrtri: () => "⊳",
	vscr: () => J_,
	vsubnE: () => Y_,
	vsubne: () => X_,
	vsupnE: () => Z_,
	vsupne: () => Q_,
	vzigzag: () => "⦚",
	wcirc: () => "ŵ",
	wedbar: () => "⩟",
	wedge: () => "∧",
	wedgeq: () => "≙",
	weierp: () => "℘",
	wfr: () => ev,
	wopf: () => nv,
	wp: () => "℘",
	wr: () => "≀",
	wreath: () => "≀",
	wscr: () => iv,
	xcap: () => "⋂",
	xcirc: () => "◯",
	xcup: () => "⋃",
	xdtri: () => "▽",
	xfr: () => ov,
	xhArr: () => "⟺",
	xharr: () => "⟷",
	xi: () => "ξ",
	xlArr: () => "⟸",
	xlarr: () => "⟵",
	xmap: () => "⟼",
	xnis: () => "⋻",
	xodot: () => "⨀",
	xopf: () => cv,
	xoplus: () => "⨁",
	xotime: () => "⨂",
	xrArr: () => "⟹",
	xrarr: () => "⟶",
	xscr: () => uv,
	xsqcup: () => "⨆",
	xuplus: () => "⨄",
	xutri: () => "△",
	xvee: () => "⋁",
	xwedge: () => "⋀",
	yacute: () => "ý",
	yacy: () => "я",
	ycirc: () => "ŷ",
	ycy: () => "ы",
	yen: () => "¥",
	yfr: () => fv,
	yicy: () => "ї",
	yopf: () => mv,
	yscr: () => gv,
	yucy: () => "ю",
	yuml: () => "ÿ",
	zacute: () => "ź",
	zcaron: () => "ž",
	zcy: () => "з",
	zdot: () => "ż",
	zeetrf: () => "ℨ",
	zeta: () => "ζ",
	zfr: () => _v,
	zhcy: () => "ж",
	zigrarr: () => "⇝",
	zopf: () => vv,
	zscr: () => bv,
	zwj: () => "‍",
	zwnj: () => "‌"
}), fm, pm, mm, hm, gm, _m, vm, ym, bm, xm, Sm, Cm, wm, Tm, Em, Dm, Om, km, Am, jm, Mm, Nm, Pm, Fm, Im, Lm, Rm, zm, Bm, Vm, Hm, Um, Wm, Gm, Km, qm, Jm, Ym, Xm, Zm, Qm, $m, eh, th, nh, rh, ih, ah, oh, sh, ch, lh, uh, dh, fh, ph, mh, hh, gh, _h, vh, yh, bh, xh, Sh, Ch, wh, Th, Eh, Dh, Oh, kh, Ah, jh, Mh, Nh, Ph, Fh, Ih, Lh, Rh, zh, Bh, Vh, Hh, Uh, Wh, Gh, Kh, qh, Jh, Yh, Xh, Zh, Qh, $h, eg, tg, ng, rg, ig, ag, og, sg, cg, lg, ug, dg, fg, pg, mg, hg, gg, _g, vg, yg, bg, xg, Sg, Cg, wg, Tg, Eg, Dg, Og, kg, Ag, jg, Mg, Ng, Pg, Fg, Ig, Lg, Rg, zg, Bg, Vg, Hg, Ug, Wg, Gg, Kg, qg, Jg, Yg, Xg, Zg, Qg, $g, e_, t_, n_, r_, i_, a_, o_, s_, c_, l_, u_, d_, f_, p_, m_, h_, g_, __, v_, y_, b_, x_, S_, C_, w_, T_, E_, D_, O_, k_, A_, j_, M_, N_, P_, F_, I_, L_, R_, z_, B_, V_, H_, U_, W_, G_, K_, q_, J_, Y_, X_, Z_, Q_, $_, ev, tv, nv, rv, iv, av, ov, sv, cv, lv, uv, dv, fv, pv, mv, hv, gv, _v, vv, yv, bv, xv, Sv = _((() => {
	fm = "∾̳", pm = "𝔄", mm = "𝔞", hm = "𝔸", gm = "𝕒", _m = "𝒜", vm = "𝒶", ym = "𝔅", bm = "𝔟", xm = "=⃥", Sm = "≡⃥", Cm = "𝔹", wm = "𝕓", Tm = "𝒷", Em = "∩︀", Dm = "𝔠", Om = "𝕔", km = "𝒞", Am = "𝒸", jm = "∪︀", Mm = "𝔇", Nm = "𝔡", Pm = "𝔻", Fm = "𝕕", Im = "𝒟", Lm = "𝒹", Rm = "𝔈", zm = "𝔢", Bm = "𝔼", Vm = "𝕖", Hm = "𝔉", Um = "𝔣", Wm = "𝔽", Gm = "𝕗", Km = "𝒻", qm = "⋛︀", Jm = "𝔊", Ym = "𝔤", Xm = "𝔾", Zm = "𝕘", Qm = "𝒢", $m = "≩︀", eh = "≩︀", th = "𝔥", nh = "𝕙", rh = "𝒽", ih = "𝔦", ah = "𝕀", oh = "𝕚", sh = "𝒾", ch = "𝔍", lh = "𝔧", uh = "𝕁", dh = "𝕛", fh = "𝒥", ph = "𝒿", mh = "𝔎", hh = "𝔨", gh = "𝕂", _h = "𝕜", vh = "𝒦", yh = "𝓀", bh = "⪭︀", xh = "⋚︀", Sh = "𝔏", Ch = "𝔩", wh = "𝕃", Th = "𝕝", Eh = "𝓁", Dh = "≨︀", Oh = "≨︀", kh = "𝔐", Ah = "𝔪", jh = "𝕄", Mh = "𝕞", Nh = "𝓂", Ph = "∠⃒", Fh = "⩰̸", Ih = "≋̸", Lh = "≎̸", Rh = "≏̸", zh = "⩭̸", Bh = "≐̸", Vh = "≂̸", Hh = "𝔑", Uh = "𝔫", Wh = "≧̸", Gh = "≧̸", Kh = "⩾̸", qh = "⩾̸", Jh = "⋙̸", Yh = "≫⃒", Xh = "≫̸", Zh = "≦̸", Qh = "≦̸", $h = "⩽̸", eg = "⩽̸", tg = "⋘̸", ng = "≪⃒", rg = "≪̸", ig = "𝕟", ag = "≂̸", og = "≧̸", sg = "≫̸", cg = "⩾̸", lg = "≎̸", ug = "≏̸", dg = "⋵̸", fg = "⋹̸", pg = "⧏̸", mg = "≪̸", hg = "⩽̸", gg = "⪢̸", _g = "⪡̸", vg = "⪯̸", yg = "⧐̸", bg = "⊏̸", xg = "⊐̸", Sg = "⊂⃒", Cg = "⪰̸", wg = "≿̸", Tg = "⊃⃒", Eg = "⫽⃥", Dg = "∂̸", Og = "⪯̸", kg = "⪯̸", Ag = "⤳̸", jg = "↝̸", Mg = "⪰̸", Ng = "𝒩", Pg = "𝓃", Fg = "⫅̸", Ig = "⊂⃒", Lg = "⫅̸", Rg = "⪰̸", zg = "⫆̸", Bg = "⊃⃒", Vg = "⫆̸", Hg = "≍⃒", Ug = "≥⃒", Wg = ">⃒", Gg = "≤⃒", Kg = "<⃒", qg = "⊴⃒", Jg = "⊵⃒", Yg = "∼⃒", Xg = "𝔒", Zg = "𝔬", Qg = "𝕆", $g = "𝕠", e_ = "𝒪", t_ = "𝔓", n_ = "𝔭", r_ = "𝕡", i_ = "𝒫", a_ = "𝓅", o_ = "𝔔", s_ = "𝔮", c_ = "𝕢", l_ = "𝒬", u_ = "𝓆", d_ = "∽̱", f_ = "𝔯", p_ = "𝕣", m_ = "𝓇", h_ = "𝔖", g_ = "𝔰", __ = "⪬︀", v_ = "𝕊", y_ = "𝕤", b_ = "⊓︀", x_ = "⊔︀", S_ = "𝒮", C_ = "𝓈", w_ = "𝔗", T_ = "𝔱", E_ = "  ", D_ = "𝕋", O_ = "𝕥", k_ = "𝒯", A_ = "𝓉", j_ = "𝔘", M_ = "𝔲", N_ = "𝕌", P_ = "𝕦", F_ = "𝒰", I_ = "𝓊", L_ = "⊊︀", R_ = "⫋︀", z_ = "⊋︀", B_ = "⫌︀", V_ = "𝔙", H_ = "𝔳", U_ = "⊂⃒", W_ = "⊃⃒", G_ = "𝕍", K_ = "𝕧", q_ = "𝒱", J_ = "𝓋", Y_ = "⫋︀", X_ = "⊊︀", Z_ = "⫌︀", Q_ = "⊋︀", $_ = "𝔚", ev = "𝔴", tv = "𝕎", nv = "𝕨", rv = "𝒲", iv = "𝓌", av = "𝔛", ov = "𝔵", sv = "𝕏", cv = "𝕩", lv = "𝒳", uv = "𝓍", dv = "𝔜", fv = "𝔶", pv = "𝕐", mv = "𝕪", hv = "𝒴", gv = "𝓎", _v = "𝔷", vv = "𝕫", yv = "𝒵", bv = "𝓏", xv = {
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: fm,
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: pm,
		afr: mm,
		Agrave: "À",
		agrave: "à",
		alefsym: "ℵ",
		aleph: "ℵ",
		Alpha: "Α",
		alpha: "α",
		Amacr: "Ā",
		amacr: "ā",
		amalg: "⨿",
		amp: "&",
		AMP: "&",
		andand: "⩕",
		And: "⩓",
		and: "∧",
		andd: "⩜",
		andslope: "⩘",
		andv: "⩚",
		ang: "∠",
		ange: "⦤",
		angle: "∠",
		angmsdaa: "⦨",
		angmsdab: "⦩",
		angmsdac: "⦪",
		angmsdad: "⦫",
		angmsdae: "⦬",
		angmsdaf: "⦭",
		angmsdag: "⦮",
		angmsdah: "⦯",
		angmsd: "∡",
		angrt: "∟",
		angrtvb: "⊾",
		angrtvbd: "⦝",
		angsph: "∢",
		angst: "Å",
		angzarr: "⍼",
		Aogon: "Ą",
		aogon: "ą",
		Aopf: hm,
		aopf: gm,
		apacir: "⩯",
		ap: "≈",
		apE: "⩰",
		ape: "≊",
		apid: "≋",
		apos: "'",
		ApplyFunction: "⁡",
		approx: "≈",
		approxeq: "≊",
		Aring: "Å",
		aring: "å",
		Ascr: _m,
		ascr: vm,
		Assign: "≔",
		ast: "*",
		asymp: "≈",
		asympeq: "≍",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		awconint: "∳",
		awint: "⨑",
		backcong: "≌",
		backepsilon: "϶",
		backprime: "‵",
		backsim: "∽",
		backsimeq: "⋍",
		Backslash: "∖",
		Barv: "⫧",
		barvee: "⊽",
		barwed: "⌅",
		Barwed: "⌆",
		barwedge: "⌅",
		bbrk: "⎵",
		bbrktbrk: "⎶",
		bcong: "≌",
		Bcy: "Б",
		bcy: "б",
		bdquo: "„",
		becaus: "∵",
		because: "∵",
		Because: "∵",
		bemptyv: "⦰",
		bepsi: "϶",
		bernou: "ℬ",
		Bernoullis: "ℬ",
		Beta: "Β",
		beta: "β",
		beth: "ℶ",
		between: "≬",
		Bfr: ym,
		bfr: bm,
		bigcap: "⋂",
		bigcirc: "◯",
		bigcup: "⋃",
		bigodot: "⨀",
		bigoplus: "⨁",
		bigotimes: "⨂",
		bigsqcup: "⨆",
		bigstar: "★",
		bigtriangledown: "▽",
		bigtriangleup: "△",
		biguplus: "⨄",
		bigvee: "⋁",
		bigwedge: "⋀",
		bkarow: "⤍",
		blacklozenge: "⧫",
		blacksquare: "▪",
		blacktriangle: "▴",
		blacktriangledown: "▾",
		blacktriangleleft: "◂",
		blacktriangleright: "▸",
		blank: "␣",
		blk12: "▒",
		blk14: "░",
		blk34: "▓",
		block: "█",
		bne: xm,
		bnequiv: Sm,
		bNot: "⫭",
		bnot: "⌐",
		Bopf: Cm,
		bopf: wm,
		bot: "⊥",
		bottom: "⊥",
		bowtie: "⋈",
		boxbox: "⧉",
		boxdl: "┐",
		boxdL: "╕",
		boxDl: "╖",
		boxDL: "╗",
		boxdr: "┌",
		boxdR: "╒",
		boxDr: "╓",
		boxDR: "╔",
		boxh: "─",
		boxH: "═",
		boxhd: "┬",
		boxHd: "╤",
		boxhD: "╥",
		boxHD: "╦",
		boxhu: "┴",
		boxHu: "╧",
		boxhU: "╨",
		boxHU: "╩",
		boxminus: "⊟",
		boxplus: "⊞",
		boxtimes: "⊠",
		boxul: "┘",
		boxuL: "╛",
		boxUl: "╜",
		boxUL: "╝",
		boxur: "└",
		boxuR: "╘",
		boxUr: "╙",
		boxUR: "╚",
		boxv: "│",
		boxV: "║",
		boxvh: "┼",
		boxvH: "╪",
		boxVh: "╫",
		boxVH: "╬",
		boxvl: "┤",
		boxvL: "╡",
		boxVl: "╢",
		boxVL: "╣",
		boxvr: "├",
		boxvR: "╞",
		boxVr: "╟",
		boxVR: "╠",
		bprime: "‵",
		breve: "˘",
		Breve: "˘",
		brvbar: "¦",
		bscr: Tm,
		Bscr: "ℬ",
		bsemi: "⁏",
		bsim: "∽",
		bsime: "⋍",
		bsolb: "⧅",
		bsol: "\\",
		bsolhsub: "⟈",
		bull: "•",
		bullet: "•",
		bump: "≎",
		bumpE: "⪮",
		bumpe: "≏",
		Bumpeq: "≎",
		bumpeq: "≏",
		Cacute: "Ć",
		cacute: "ć",
		capand: "⩄",
		capbrcup: "⩉",
		capcap: "⩋",
		cap: "∩",
		Cap: "⋒",
		capcup: "⩇",
		capdot: "⩀",
		CapitalDifferentialD: "ⅅ",
		caps: Em,
		caret: "⁁",
		caron: "ˇ",
		Cayleys: "ℭ",
		ccaps: "⩍",
		Ccaron: "Č",
		ccaron: "č",
		Ccedil: "Ç",
		ccedil: "ç",
		Ccirc: "Ĉ",
		ccirc: "ĉ",
		Cconint: "∰",
		ccups: "⩌",
		ccupssm: "⩐",
		Cdot: "Ċ",
		cdot: "ċ",
		cedil: "¸",
		Cedilla: "¸",
		cemptyv: "⦲",
		cent: "¢",
		centerdot: "·",
		CenterDot: "·",
		cfr: Dm,
		Cfr: "ℭ",
		CHcy: "Ч",
		chcy: "ч",
		check: "✓",
		checkmark: "✓",
		Chi: "Χ",
		chi: "χ",
		circ: "ˆ",
		circeq: "≗",
		circlearrowleft: "↺",
		circlearrowright: "↻",
		circledast: "⊛",
		circledcirc: "⊚",
		circleddash: "⊝",
		CircleDot: "⊙",
		circledR: "®",
		circledS: "Ⓢ",
		CircleMinus: "⊖",
		CirclePlus: "⊕",
		CircleTimes: "⊗",
		cir: "○",
		cirE: "⧃",
		cire: "≗",
		cirfnint: "⨐",
		cirmid: "⫯",
		cirscir: "⧂",
		ClockwiseContourIntegral: "∲",
		CloseCurlyDoubleQuote: "”",
		CloseCurlyQuote: "’",
		clubs: "♣",
		clubsuit: "♣",
		colon: ":",
		Colon: "∷",
		Colone: "⩴",
		colone: "≔",
		coloneq: "≔",
		comma: ",",
		commat: "@",
		comp: "∁",
		compfn: "∘",
		complement: "∁",
		complexes: "ℂ",
		cong: "≅",
		congdot: "⩭",
		Congruent: "≡",
		conint: "∮",
		Conint: "∯",
		ContourIntegral: "∮",
		copf: Om,
		Copf: "ℂ",
		coprod: "∐",
		Coproduct: "∐",
		copy: "©",
		COPY: "©",
		copysr: "℗",
		CounterClockwiseContourIntegral: "∳",
		crarr: "↵",
		cross: "✗",
		Cross: "⨯",
		Cscr: km,
		cscr: Am,
		csub: "⫏",
		csube: "⫑",
		csup: "⫐",
		csupe: "⫒",
		ctdot: "⋯",
		cudarrl: "⤸",
		cudarrr: "⤵",
		cuepr: "⋞",
		cuesc: "⋟",
		cularr: "↶",
		cularrp: "⤽",
		cupbrcap: "⩈",
		cupcap: "⩆",
		CupCap: "≍",
		cup: "∪",
		Cup: "⋓",
		cupcup: "⩊",
		cupdot: "⊍",
		cupor: "⩅",
		cups: jm,
		curarr: "↷",
		curarrm: "⤼",
		curlyeqprec: "⋞",
		curlyeqsucc: "⋟",
		curlyvee: "⋎",
		curlywedge: "⋏",
		curren: "¤",
		curvearrowleft: "↶",
		curvearrowright: "↷",
		cuvee: "⋎",
		cuwed: "⋏",
		cwconint: "∲",
		cwint: "∱",
		cylcty: "⌭",
		dagger: "†",
		Dagger: "‡",
		daleth: "ℸ",
		darr: "↓",
		Darr: "↡",
		dArr: "⇓",
		dash: "‐",
		Dashv: "⫤",
		dashv: "⊣",
		dbkarow: "⤏",
		dblac: "˝",
		Dcaron: "Ď",
		dcaron: "ď",
		Dcy: "Д",
		dcy: "д",
		ddagger: "‡",
		ddarr: "⇊",
		DD: "ⅅ",
		dd: "ⅆ",
		DDotrahd: "⤑",
		ddotseq: "⩷",
		deg: "°",
		Del: "∇",
		Delta: "Δ",
		delta: "δ",
		demptyv: "⦱",
		dfisht: "⥿",
		Dfr: Mm,
		dfr: Nm,
		dHar: "⥥",
		dharl: "⇃",
		dharr: "⇂",
		DiacriticalAcute: "´",
		DiacriticalDot: "˙",
		DiacriticalDoubleAcute: "˝",
		DiacriticalGrave: "`",
		DiacriticalTilde: "˜",
		diam: "⋄",
		diamond: "⋄",
		Diamond: "⋄",
		diamondsuit: "♦",
		diams: "♦",
		die: "¨",
		DifferentialD: "ⅆ",
		digamma: "ϝ",
		disin: "⋲",
		div: "÷",
		divide: "÷",
		divideontimes: "⋇",
		divonx: "⋇",
		DJcy: "Ђ",
		djcy: "ђ",
		dlcorn: "⌞",
		dlcrop: "⌍",
		dollar: "$",
		Dopf: Pm,
		dopf: Fm,
		Dot: "¨",
		dot: "˙",
		DotDot: "⃜",
		doteq: "≐",
		doteqdot: "≑",
		DotEqual: "≐",
		dotminus: "∸",
		dotplus: "∔",
		dotsquare: "⊡",
		doublebarwedge: "⌆",
		DoubleContourIntegral: "∯",
		DoubleDot: "¨",
		DoubleDownArrow: "⇓",
		DoubleLeftArrow: "⇐",
		DoubleLeftRightArrow: "⇔",
		DoubleLeftTee: "⫤",
		DoubleLongLeftArrow: "⟸",
		DoubleLongLeftRightArrow: "⟺",
		DoubleLongRightArrow: "⟹",
		DoubleRightArrow: "⇒",
		DoubleRightTee: "⊨",
		DoubleUpArrow: "⇑",
		DoubleUpDownArrow: "⇕",
		DoubleVerticalBar: "∥",
		DownArrowBar: "⤓",
		downarrow: "↓",
		DownArrow: "↓",
		Downarrow: "⇓",
		DownArrowUpArrow: "⇵",
		DownBreve: "̑",
		downdownarrows: "⇊",
		downharpoonleft: "⇃",
		downharpoonright: "⇂",
		DownLeftRightVector: "⥐",
		DownLeftTeeVector: "⥞",
		DownLeftVectorBar: "⥖",
		DownLeftVector: "↽",
		DownRightTeeVector: "⥟",
		DownRightVectorBar: "⥗",
		DownRightVector: "⇁",
		DownTeeArrow: "↧",
		DownTee: "⊤",
		drbkarow: "⤐",
		drcorn: "⌟",
		drcrop: "⌌",
		Dscr: Im,
		dscr: Lm,
		DScy: "Ѕ",
		dscy: "ѕ",
		dsol: "⧶",
		Dstrok: "Đ",
		dstrok: "đ",
		dtdot: "⋱",
		dtri: "▿",
		dtrif: "▾",
		duarr: "⇵",
		duhar: "⥯",
		dwangle: "⦦",
		DZcy: "Џ",
		dzcy: "џ",
		dzigrarr: "⟿",
		Eacute: "É",
		eacute: "é",
		easter: "⩮",
		Ecaron: "Ě",
		ecaron: "ě",
		Ecirc: "Ê",
		ecirc: "ê",
		ecir: "≖",
		ecolon: "≕",
		Ecy: "Э",
		ecy: "э",
		eDDot: "⩷",
		Edot: "Ė",
		edot: "ė",
		eDot: "≑",
		ee: "ⅇ",
		efDot: "≒",
		Efr: Rm,
		efr: zm,
		eg: "⪚",
		Egrave: "È",
		egrave: "è",
		egs: "⪖",
		egsdot: "⪘",
		el: "⪙",
		Element: "∈",
		elinters: "⏧",
		ell: "ℓ",
		els: "⪕",
		elsdot: "⪗",
		Emacr: "Ē",
		emacr: "ē",
		empty: "∅",
		emptyset: "∅",
		EmptySmallSquare: "◻",
		emptyv: "∅",
		EmptyVerySmallSquare: "▫",
		emsp13: " ",
		emsp14: " ",
		emsp: " ",
		ENG: "Ŋ",
		eng: "ŋ",
		ensp: " ",
		Eogon: "Ę",
		eogon: "ę",
		Eopf: Bm,
		eopf: Vm,
		epar: "⋕",
		eparsl: "⧣",
		eplus: "⩱",
		epsi: "ε",
		Epsilon: "Ε",
		epsilon: "ε",
		epsiv: "ϵ",
		eqcirc: "≖",
		eqcolon: "≕",
		eqsim: "≂",
		eqslantgtr: "⪖",
		eqslantless: "⪕",
		Equal: "⩵",
		equals: "=",
		EqualTilde: "≂",
		equest: "≟",
		Equilibrium: "⇌",
		equiv: "≡",
		equivDD: "⩸",
		eqvparsl: "⧥",
		erarr: "⥱",
		erDot: "≓",
		escr: "ℯ",
		Escr: "ℰ",
		esdot: "≐",
		Esim: "⩳",
		esim: "≂",
		Eta: "Η",
		eta: "η",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		euro: "€",
		excl: "!",
		exist: "∃",
		Exists: "∃",
		expectation: "ℰ",
		exponentiale: "ⅇ",
		ExponentialE: "ⅇ",
		fallingdotseq: "≒",
		Fcy: "Ф",
		fcy: "ф",
		female: "♀",
		ffilig: "ﬃ",
		fflig: "ﬀ",
		ffllig: "ﬄ",
		Ffr: Hm,
		ffr: Um,
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: Wm,
		fopf: Gm,
		forall: "∀",
		ForAll: "∀",
		fork: "⋔",
		forkv: "⫙",
		Fouriertrf: "ℱ",
		fpartint: "⨍",
		frac12: "½",
		frac13: "⅓",
		frac14: "¼",
		frac15: "⅕",
		frac16: "⅙",
		frac18: "⅛",
		frac23: "⅔",
		frac25: "⅖",
		frac34: "¾",
		frac35: "⅗",
		frac38: "⅜",
		frac45: "⅘",
		frac56: "⅚",
		frac58: "⅝",
		frac78: "⅞",
		frasl: "⁄",
		frown: "⌢",
		fscr: Km,
		Fscr: "ℱ",
		gacute: "ǵ",
		Gamma: "Γ",
		gamma: "γ",
		Gammad: "Ϝ",
		gammad: "ϝ",
		gap: "⪆",
		Gbreve: "Ğ",
		gbreve: "ğ",
		Gcedil: "Ģ",
		Gcirc: "Ĝ",
		gcirc: "ĝ",
		Gcy: "Г",
		gcy: "г",
		Gdot: "Ġ",
		gdot: "ġ",
		ge: "≥",
		gE: "≧",
		gEl: "⪌",
		gel: "⋛",
		geq: "≥",
		geqq: "≧",
		geqslant: "⩾",
		gescc: "⪩",
		ges: "⩾",
		gesdot: "⪀",
		gesdoto: "⪂",
		gesdotol: "⪄",
		gesl: qm,
		gesles: "⪔",
		Gfr: Jm,
		gfr: Ym,
		gg: "≫",
		Gg: "⋙",
		ggg: "⋙",
		gimel: "ℷ",
		GJcy: "Ѓ",
		gjcy: "ѓ",
		gla: "⪥",
		gl: "≷",
		glE: "⪒",
		glj: "⪤",
		gnap: "⪊",
		gnapprox: "⪊",
		gne: "⪈",
		gnE: "≩",
		gneq: "⪈",
		gneqq: "≩",
		gnsim: "⋧",
		Gopf: Xm,
		gopf: Zm,
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: Qm,
		gscr: "ℊ",
		gsim: "≳",
		gsime: "⪎",
		gsiml: "⪐",
		gtcc: "⪧",
		gtcir: "⩺",
		gt: ">",
		GT: ">",
		Gt: "≫",
		gtdot: "⋗",
		gtlPar: "⦕",
		gtquest: "⩼",
		gtrapprox: "⪆",
		gtrarr: "⥸",
		gtrdot: "⋗",
		gtreqless: "⋛",
		gtreqqless: "⪌",
		gtrless: "≷",
		gtrsim: "≳",
		gvertneqq: $m,
		gvnE: eh,
		Hacek: "ˇ",
		hairsp: " ",
		half: "½",
		hamilt: "ℋ",
		HARDcy: "Ъ",
		hardcy: "ъ",
		harrcir: "⥈",
		harr: "↔",
		hArr: "⇔",
		harrw: "↭",
		Hat: "^",
		hbar: "ℏ",
		Hcirc: "Ĥ",
		hcirc: "ĥ",
		hearts: "♥",
		heartsuit: "♥",
		hellip: "…",
		hercon: "⊹",
		hfr: th,
		Hfr: "ℌ",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		hopf: nh,
		Hopf: "ℍ",
		horbar: "―",
		HorizontalLine: "─",
		hscr: rh,
		Hscr: "ℋ",
		hslash: "ℏ",
		Hstrok: "Ħ",
		hstrok: "ħ",
		HumpDownHump: "≎",
		HumpEqual: "≏",
		hybull: "⁃",
		hyphen: "‐",
		Iacute: "Í",
		iacute: "í",
		ic: "⁣",
		Icirc: "Î",
		icirc: "î",
		Icy: "И",
		icy: "и",
		Idot: "İ",
		IEcy: "Е",
		iecy: "е",
		iexcl: "¡",
		iff: "⇔",
		ifr: ih,
		Ifr: "ℑ",
		Igrave: "Ì",
		igrave: "ì",
		ii: "ⅈ",
		iiiint: "⨌",
		iiint: "∭",
		iinfin: "⧜",
		iiota: "℩",
		IJlig: "Ĳ",
		ijlig: "ĳ",
		Imacr: "Ī",
		imacr: "ī",
		image: "ℑ",
		ImaginaryI: "ⅈ",
		imagline: "ℐ",
		imagpart: "ℑ",
		imath: "ı",
		Im: "ℑ",
		imof: "⊷",
		imped: "Ƶ",
		Implies: "⇒",
		incare: "℅",
		in: "∈",
		infin: "∞",
		infintie: "⧝",
		inodot: "ı",
		intcal: "⊺",
		int: "∫",
		Int: "∬",
		integers: "ℤ",
		Integral: "∫",
		intercal: "⊺",
		Intersection: "⋂",
		intlarhk: "⨗",
		intprod: "⨼",
		InvisibleComma: "⁣",
		InvisibleTimes: "⁢",
		IOcy: "Ё",
		iocy: "ё",
		Iogon: "Į",
		iogon: "į",
		Iopf: ah,
		iopf: oh,
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		iscr: sh,
		Iscr: "ℐ",
		isin: "∈",
		isindot: "⋵",
		isinE: "⋹",
		isins: "⋴",
		isinsv: "⋳",
		isinv: "∈",
		it: "⁢",
		Itilde: "Ĩ",
		itilde: "ĩ",
		Iukcy: "І",
		iukcy: "і",
		Iuml: "Ï",
		iuml: "ï",
		Jcirc: "Ĵ",
		jcirc: "ĵ",
		Jcy: "Й",
		jcy: "й",
		Jfr: ch,
		jfr: lh,
		jmath: "ȷ",
		Jopf: uh,
		jopf: dh,
		Jscr: fh,
		jscr: ph,
		Jsercy: "Ј",
		jsercy: "ј",
		Jukcy: "Є",
		jukcy: "є",
		Kappa: "Κ",
		kappa: "κ",
		kappav: "ϰ",
		Kcedil: "Ķ",
		kcedil: "ķ",
		Kcy: "К",
		kcy: "к",
		Kfr: mh,
		kfr: hh,
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: gh,
		kopf: _h,
		Kscr: vh,
		kscr: yh,
		lAarr: "⇚",
		Lacute: "Ĺ",
		lacute: "ĺ",
		laemptyv: "⦴",
		lagran: "ℒ",
		Lambda: "Λ",
		lambda: "λ",
		lang: "⟨",
		Lang: "⟪",
		langd: "⦑",
		langle: "⟨",
		lap: "⪅",
		Laplacetrf: "ℒ",
		laquo: "«",
		larrb: "⇤",
		larrbfs: "⤟",
		larr: "←",
		Larr: "↞",
		lArr: "⇐",
		larrfs: "⤝",
		larrhk: "↩",
		larrlp: "↫",
		larrpl: "⤹",
		larrsim: "⥳",
		larrtl: "↢",
		latail: "⤙",
		lAtail: "⤛",
		lat: "⪫",
		late: "⪭",
		lates: bh,
		lbarr: "⤌",
		lBarr: "⤎",
		lbbrk: "❲",
		lbrace: "{",
		lbrack: "[",
		lbrke: "⦋",
		lbrksld: "⦏",
		lbrkslu: "⦍",
		Lcaron: "Ľ",
		lcaron: "ľ",
		Lcedil: "Ļ",
		lcedil: "ļ",
		lceil: "⌈",
		lcub: "{",
		Lcy: "Л",
		lcy: "л",
		ldca: "⤶",
		ldquo: "“",
		ldquor: "„",
		ldrdhar: "⥧",
		ldrushar: "⥋",
		ldsh: "↲",
		le: "≤",
		lE: "≦",
		LeftAngleBracket: "⟨",
		LeftArrowBar: "⇤",
		leftarrow: "←",
		LeftArrow: "←",
		Leftarrow: "⇐",
		LeftArrowRightArrow: "⇆",
		leftarrowtail: "↢",
		LeftCeiling: "⌈",
		LeftDoubleBracket: "⟦",
		LeftDownTeeVector: "⥡",
		LeftDownVectorBar: "⥙",
		LeftDownVector: "⇃",
		LeftFloor: "⌊",
		leftharpoondown: "↽",
		leftharpoonup: "↼",
		leftleftarrows: "⇇",
		leftrightarrow: "↔",
		LeftRightArrow: "↔",
		Leftrightarrow: "⇔",
		leftrightarrows: "⇆",
		leftrightharpoons: "⇋",
		leftrightsquigarrow: "↭",
		LeftRightVector: "⥎",
		LeftTeeArrow: "↤",
		LeftTee: "⊣",
		LeftTeeVector: "⥚",
		leftthreetimes: "⋋",
		LeftTriangleBar: "⧏",
		LeftTriangle: "⊲",
		LeftTriangleEqual: "⊴",
		LeftUpDownVector: "⥑",
		LeftUpTeeVector: "⥠",
		LeftUpVectorBar: "⥘",
		LeftUpVector: "↿",
		LeftVectorBar: "⥒",
		LeftVector: "↼",
		lEg: "⪋",
		leg: "⋚",
		leq: "≤",
		leqq: "≦",
		leqslant: "⩽",
		lescc: "⪨",
		les: "⩽",
		lesdot: "⩿",
		lesdoto: "⪁",
		lesdotor: "⪃",
		lesg: xh,
		lesges: "⪓",
		lessapprox: "⪅",
		lessdot: "⋖",
		lesseqgtr: "⋚",
		lesseqqgtr: "⪋",
		LessEqualGreater: "⋚",
		LessFullEqual: "≦",
		LessGreater: "≶",
		lessgtr: "≶",
		LessLess: "⪡",
		lesssim: "≲",
		LessSlantEqual: "⩽",
		LessTilde: "≲",
		lfisht: "⥼",
		lfloor: "⌊",
		Lfr: Sh,
		lfr: Ch,
		lg: "≶",
		lgE: "⪑",
		lHar: "⥢",
		lhard: "↽",
		lharu: "↼",
		lharul: "⥪",
		lhblk: "▄",
		LJcy: "Љ",
		ljcy: "љ",
		llarr: "⇇",
		ll: "≪",
		Ll: "⋘",
		llcorner: "⌞",
		Lleftarrow: "⇚",
		llhard: "⥫",
		lltri: "◺",
		Lmidot: "Ŀ",
		lmidot: "ŀ",
		lmoustache: "⎰",
		lmoust: "⎰",
		lnap: "⪉",
		lnapprox: "⪉",
		lne: "⪇",
		lnE: "≨",
		lneq: "⪇",
		lneqq: "≨",
		lnsim: "⋦",
		loang: "⟬",
		loarr: "⇽",
		lobrk: "⟦",
		longleftarrow: "⟵",
		LongLeftArrow: "⟵",
		Longleftarrow: "⟸",
		longleftrightarrow: "⟷",
		LongLeftRightArrow: "⟷",
		Longleftrightarrow: "⟺",
		longmapsto: "⟼",
		longrightarrow: "⟶",
		LongRightArrow: "⟶",
		Longrightarrow: "⟹",
		looparrowleft: "↫",
		looparrowright: "↬",
		lopar: "⦅",
		Lopf: wh,
		lopf: Th,
		loplus: "⨭",
		lotimes: "⨴",
		lowast: "∗",
		lowbar: "_",
		LowerLeftArrow: "↙",
		LowerRightArrow: "↘",
		loz: "◊",
		lozenge: "◊",
		lozf: "⧫",
		lpar: "(",
		lparlt: "⦓",
		lrarr: "⇆",
		lrcorner: "⌟",
		lrhar: "⇋",
		lrhard: "⥭",
		lrm: "‎",
		lrtri: "⊿",
		lsaquo: "‹",
		lscr: Eh,
		Lscr: "ℒ",
		lsh: "↰",
		Lsh: "↰",
		lsim: "≲",
		lsime: "⪍",
		lsimg: "⪏",
		lsqb: "[",
		lsquo: "‘",
		lsquor: "‚",
		Lstrok: "Ł",
		lstrok: "ł",
		ltcc: "⪦",
		ltcir: "⩹",
		lt: "<",
		LT: "<",
		Lt: "≪",
		ltdot: "⋖",
		lthree: "⋋",
		ltimes: "⋉",
		ltlarr: "⥶",
		ltquest: "⩻",
		ltri: "◃",
		ltrie: "⊴",
		ltrif: "◂",
		ltrPar: "⦖",
		lurdshar: "⥊",
		luruhar: "⥦",
		lvertneqq: Dh,
		lvnE: Oh,
		macr: "¯",
		male: "♂",
		malt: "✠",
		maltese: "✠",
		Map: "⤅",
		map: "↦",
		mapsto: "↦",
		mapstodown: "↧",
		mapstoleft: "↤",
		mapstoup: "↥",
		marker: "▮",
		mcomma: "⨩",
		Mcy: "М",
		mcy: "м",
		mdash: "—",
		mDDot: "∺",
		measuredangle: "∡",
		MediumSpace: " ",
		Mellintrf: "ℳ",
		Mfr: kh,
		mfr: Ah,
		mho: "℧",
		micro: "µ",
		midast: "*",
		midcir: "⫰",
		mid: "∣",
		middot: "·",
		minusb: "⊟",
		minus: "−",
		minusd: "∸",
		minusdu: "⨪",
		MinusPlus: "∓",
		mlcp: "⫛",
		mldr: "…",
		mnplus: "∓",
		models: "⊧",
		Mopf: jh,
		mopf: Mh,
		mp: "∓",
		mscr: Nh,
		Mscr: "ℳ",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: Ph,
		nap: "≉",
		napE: Fh,
		napid: Ih,
		napos: "ŉ",
		napprox: "≉",
		natural: "♮",
		naturals: "ℕ",
		natur: "♮",
		nbsp: "\xA0",
		nbump: Lh,
		nbumpe: Rh,
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: zh,
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		nearhk: "⤤",
		nearr: "↗",
		neArr: "⇗",
		nearrow: "↗",
		ne: "≠",
		nedot: Bh,
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: Vh,
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: "\n",
		nexist: "∄",
		nexists: "∄",
		Nfr: Hh,
		nfr: Uh,
		ngE: Wh,
		nge: "≱",
		ngeq: "≱",
		ngeqq: Gh,
		ngeqslant: Kh,
		nges: qh,
		nGg: Jh,
		ngsim: "≵",
		nGt: Yh,
		ngt: "≯",
		ngtr: "≯",
		nGtv: Xh,
		nharr: "↮",
		nhArr: "⇎",
		nhpar: "⫲",
		ni: "∋",
		nis: "⋼",
		nisd: "⋺",
		niv: "∋",
		NJcy: "Њ",
		njcy: "њ",
		nlarr: "↚",
		nlArr: "⇍",
		nldr: "‥",
		nlE: Zh,
		nle: "≰",
		nleftarrow: "↚",
		nLeftarrow: "⇍",
		nleftrightarrow: "↮",
		nLeftrightarrow: "⇎",
		nleq: "≰",
		nleqq: Qh,
		nleqslant: $h,
		nles: eg,
		nless: "≮",
		nLl: tg,
		nlsim: "≴",
		nLt: ng,
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: rg,
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		nopf: ig,
		Nopf: "ℕ",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: ag,
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: og,
		NotGreaterGreater: sg,
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: cg,
		NotGreaterTilde: "≵",
		NotHumpDownHump: lg,
		NotHumpEqual: ug,
		notin: "∉",
		notindot: dg,
		notinE: fg,
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangleBar: pg,
		NotLeftTriangle: "⋪",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: mg,
		NotLessSlantEqual: hg,
		NotLessTilde: "≴",
		NotNestedGreaterGreater: gg,
		NotNestedLessLess: _g,
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: vg,
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangleBar: yg,
		NotRightTriangle: "⋫",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: bg,
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: xg,
		NotSquareSupersetEqual: "⋣",
		NotSubset: Sg,
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: Cg,
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: wg,
		NotSuperset: Tg,
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		nparallel: "∦",
		npar: "∦",
		nparsl: Eg,
		npart: Dg,
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		nprec: "⊀",
		npreceq: Og,
		npre: kg,
		nrarrc: Ag,
		nrarr: "↛",
		nrArr: "⇏",
		nrarrw: jg,
		nrightarrow: "↛",
		nRightarrow: "⇏",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: Mg,
		Nscr: Ng,
		nscr: Pg,
		nshortmid: "∤",
		nshortparallel: "∦",
		nsim: "≁",
		nsime: "≄",
		nsimeq: "≄",
		nsmid: "∤",
		nspar: "∦",
		nsqsube: "⋢",
		nsqsupe: "⋣",
		nsub: "⊄",
		nsubE: Fg,
		nsube: "⊈",
		nsubset: Ig,
		nsubseteq: "⊈",
		nsubseteqq: Lg,
		nsucc: "⊁",
		nsucceq: Rg,
		nsup: "⊅",
		nsupE: zg,
		nsupe: "⊉",
		nsupset: Bg,
		nsupseteq: "⊉",
		nsupseteqq: Vg,
		ntgl: "≹",
		Ntilde: "Ñ",
		ntilde: "ñ",
		ntlg: "≸",
		ntriangleleft: "⋪",
		ntrianglelefteq: "⋬",
		ntriangleright: "⋫",
		ntrianglerighteq: "⋭",
		Nu: "Ν",
		nu: "ν",
		num: "#",
		numero: "№",
		numsp: " ",
		nvap: Hg,
		nvdash: "⊬",
		nvDash: "⊭",
		nVdash: "⊮",
		nVDash: "⊯",
		nvge: Ug,
		nvgt: Wg,
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: Gg,
		nvlt: Kg,
		nvltrie: qg,
		nvrArr: "⤃",
		nvrtrie: Jg,
		nvsim: Yg,
		nwarhk: "⤣",
		nwarr: "↖",
		nwArr: "⇖",
		nwarrow: "↖",
		nwnear: "⤧",
		Oacute: "Ó",
		oacute: "ó",
		oast: "⊛",
		Ocirc: "Ô",
		ocirc: "ô",
		ocir: "⊚",
		Ocy: "О",
		ocy: "о",
		odash: "⊝",
		Odblac: "Ő",
		odblac: "ő",
		odiv: "⨸",
		odot: "⊙",
		odsold: "⦼",
		OElig: "Œ",
		oelig: "œ",
		ofcir: "⦿",
		Ofr: Xg,
		ofr: Zg,
		ogon: "˛",
		Ograve: "Ò",
		ograve: "ò",
		ogt: "⧁",
		ohbar: "⦵",
		ohm: "Ω",
		oint: "∮",
		olarr: "↺",
		olcir: "⦾",
		olcross: "⦻",
		oline: "‾",
		olt: "⧀",
		Omacr: "Ō",
		omacr: "ō",
		Omega: "Ω",
		omega: "ω",
		Omicron: "Ο",
		omicron: "ο",
		omid: "⦶",
		ominus: "⊖",
		Oopf: Qg,
		oopf: $g,
		opar: "⦷",
		OpenCurlyDoubleQuote: "“",
		OpenCurlyQuote: "‘",
		operp: "⦹",
		oplus: "⊕",
		orarr: "↻",
		Or: "⩔",
		or: "∨",
		ord: "⩝",
		order: "ℴ",
		orderof: "ℴ",
		ordf: "ª",
		ordm: "º",
		origof: "⊶",
		oror: "⩖",
		orslope: "⩗",
		orv: "⩛",
		oS: "Ⓢ",
		Oscr: e_,
		oscr: "ℴ",
		Oslash: "Ø",
		oslash: "ø",
		osol: "⊘",
		Otilde: "Õ",
		otilde: "õ",
		otimesas: "⨶",
		Otimes: "⨷",
		otimes: "⊗",
		Ouml: "Ö",
		ouml: "ö",
		ovbar: "⌽",
		OverBar: "‾",
		OverBrace: "⏞",
		OverBracket: "⎴",
		OverParenthesis: "⏜",
		para: "¶",
		parallel: "∥",
		par: "∥",
		parsim: "⫳",
		parsl: "⫽",
		part: "∂",
		PartialD: "∂",
		Pcy: "П",
		pcy: "п",
		percnt: "%",
		period: ".",
		permil: "‰",
		perp: "⊥",
		pertenk: "‱",
		Pfr: t_,
		pfr: n_,
		Phi: "Φ",
		phi: "φ",
		phiv: "ϕ",
		phmmat: "ℳ",
		phone: "☎",
		Pi: "Π",
		pi: "π",
		pitchfork: "⋔",
		piv: "ϖ",
		planck: "ℏ",
		planckh: "ℎ",
		plankv: "ℏ",
		plusacir: "⨣",
		plusb: "⊞",
		pluscir: "⨢",
		plus: "+",
		plusdo: "∔",
		plusdu: "⨥",
		pluse: "⩲",
		PlusMinus: "±",
		plusmn: "±",
		plussim: "⨦",
		plustwo: "⨧",
		pm: "±",
		Poincareplane: "ℌ",
		pointint: "⨕",
		popf: r_,
		Popf: "ℙ",
		pound: "£",
		prap: "⪷",
		Pr: "⪻",
		pr: "≺",
		prcue: "≼",
		precapprox: "⪷",
		prec: "≺",
		preccurlyeq: "≼",
		Precedes: "≺",
		PrecedesEqual: "⪯",
		PrecedesSlantEqual: "≼",
		PrecedesTilde: "≾",
		preceq: "⪯",
		precnapprox: "⪹",
		precneqq: "⪵",
		precnsim: "⋨",
		pre: "⪯",
		prE: "⪳",
		precsim: "≾",
		prime: "′",
		Prime: "″",
		primes: "ℙ",
		prnap: "⪹",
		prnE: "⪵",
		prnsim: "⋨",
		prod: "∏",
		Product: "∏",
		profalar: "⌮",
		profline: "⌒",
		profsurf: "⌓",
		prop: "∝",
		Proportional: "∝",
		Proportion: "∷",
		propto: "∝",
		prsim: "≾",
		prurel: "⊰",
		Pscr: i_,
		pscr: a_,
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: o_,
		qfr: s_,
		qint: "⨌",
		qopf: c_,
		Qopf: "ℚ",
		qprime: "⁗",
		Qscr: l_,
		qscr: u_,
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		quot: "\"",
		QUOT: "\"",
		rAarr: "⇛",
		race: d_,
		Racute: "Ŕ",
		racute: "ŕ",
		radic: "√",
		raemptyv: "⦳",
		rang: "⟩",
		Rang: "⟫",
		rangd: "⦒",
		range: "⦥",
		rangle: "⟩",
		raquo: "»",
		rarrap: "⥵",
		rarrb: "⇥",
		rarrbfs: "⤠",
		rarrc: "⤳",
		rarr: "→",
		Rarr: "↠",
		rArr: "⇒",
		rarrfs: "⤞",
		rarrhk: "↪",
		rarrlp: "↬",
		rarrpl: "⥅",
		rarrsim: "⥴",
		Rarrtl: "⤖",
		rarrtl: "↣",
		rarrw: "↝",
		ratail: "⤚",
		rAtail: "⤜",
		ratio: "∶",
		rationals: "ℚ",
		rbarr: "⤍",
		rBarr: "⤏",
		RBarr: "⤐",
		rbbrk: "❳",
		rbrace: "}",
		rbrack: "]",
		rbrke: "⦌",
		rbrksld: "⦎",
		rbrkslu: "⦐",
		Rcaron: "Ř",
		rcaron: "ř",
		Rcedil: "Ŗ",
		rcedil: "ŗ",
		rceil: "⌉",
		rcub: "}",
		Rcy: "Р",
		rcy: "р",
		rdca: "⤷",
		rdldhar: "⥩",
		rdquo: "”",
		rdquor: "”",
		rdsh: "↳",
		real: "ℜ",
		realine: "ℛ",
		realpart: "ℜ",
		reals: "ℝ",
		Re: "ℜ",
		rect: "▭",
		reg: "®",
		REG: "®",
		ReverseElement: "∋",
		ReverseEquilibrium: "⇋",
		ReverseUpEquilibrium: "⥯",
		rfisht: "⥽",
		rfloor: "⌋",
		rfr: f_,
		Rfr: "ℜ",
		rHar: "⥤",
		rhard: "⇁",
		rharu: "⇀",
		rharul: "⥬",
		Rho: "Ρ",
		rho: "ρ",
		rhov: "ϱ",
		RightAngleBracket: "⟩",
		RightArrowBar: "⇥",
		rightarrow: "→",
		RightArrow: "→",
		Rightarrow: "⇒",
		RightArrowLeftArrow: "⇄",
		rightarrowtail: "↣",
		RightCeiling: "⌉",
		RightDoubleBracket: "⟧",
		RightDownTeeVector: "⥝",
		RightDownVectorBar: "⥕",
		RightDownVector: "⇂",
		RightFloor: "⌋",
		rightharpoondown: "⇁",
		rightharpoonup: "⇀",
		rightleftarrows: "⇄",
		rightleftharpoons: "⇌",
		rightrightarrows: "⇉",
		rightsquigarrow: "↝",
		RightTeeArrow: "↦",
		RightTee: "⊢",
		RightTeeVector: "⥛",
		rightthreetimes: "⋌",
		RightTriangleBar: "⧐",
		RightTriangle: "⊳",
		RightTriangleEqual: "⊵",
		RightUpDownVector: "⥏",
		RightUpTeeVector: "⥜",
		RightUpVectorBar: "⥔",
		RightUpVector: "↾",
		RightVectorBar: "⥓",
		RightVector: "⇀",
		ring: "˚",
		risingdotseq: "≓",
		rlarr: "⇄",
		rlhar: "⇌",
		rlm: "‏",
		rmoustache: "⎱",
		rmoust: "⎱",
		rnmid: "⫮",
		roang: "⟭",
		roarr: "⇾",
		robrk: "⟧",
		ropar: "⦆",
		ropf: p_,
		Ropf: "ℝ",
		roplus: "⨮",
		rotimes: "⨵",
		RoundImplies: "⥰",
		rpar: ")",
		rpargt: "⦔",
		rppolint: "⨒",
		rrarr: "⇉",
		Rrightarrow: "⇛",
		rsaquo: "›",
		rscr: m_,
		Rscr: "ℛ",
		rsh: "↱",
		Rsh: "↱",
		rsqb: "]",
		rsquo: "’",
		rsquor: "’",
		rthree: "⋌",
		rtimes: "⋊",
		rtri: "▹",
		rtrie: "⊵",
		rtrif: "▸",
		rtriltri: "⧎",
		RuleDelayed: "⧴",
		ruluhar: "⥨",
		rx: "℞",
		Sacute: "Ś",
		sacute: "ś",
		sbquo: "‚",
		scap: "⪸",
		Scaron: "Š",
		scaron: "š",
		Sc: "⪼",
		sc: "≻",
		sccue: "≽",
		sce: "⪰",
		scE: "⪴",
		Scedil: "Ş",
		scedil: "ş",
		Scirc: "Ŝ",
		scirc: "ŝ",
		scnap: "⪺",
		scnE: "⪶",
		scnsim: "⋩",
		scpolint: "⨓",
		scsim: "≿",
		Scy: "С",
		scy: "с",
		sdotb: "⊡",
		sdot: "⋅",
		sdote: "⩦",
		searhk: "⤥",
		searr: "↘",
		seArr: "⇘",
		searrow: "↘",
		sect: "§",
		semi: ";",
		seswar: "⤩",
		setminus: "∖",
		setmn: "∖",
		sext: "✶",
		Sfr: h_,
		sfr: g_,
		sfrown: "⌢",
		sharp: "♯",
		SHCHcy: "Щ",
		shchcy: "щ",
		SHcy: "Ш",
		shcy: "ш",
		ShortDownArrow: "↓",
		ShortLeftArrow: "←",
		shortmid: "∣",
		shortparallel: "∥",
		ShortRightArrow: "→",
		ShortUpArrow: "↑",
		shy: "­",
		Sigma: "Σ",
		sigma: "σ",
		sigmaf: "ς",
		sigmav: "ς",
		sim: "∼",
		simdot: "⩪",
		sime: "≃",
		simeq: "≃",
		simg: "⪞",
		simgE: "⪠",
		siml: "⪝",
		simlE: "⪟",
		simne: "≆",
		simplus: "⨤",
		simrarr: "⥲",
		slarr: "←",
		SmallCircle: "∘",
		smallsetminus: "∖",
		smashp: "⨳",
		smeparsl: "⧤",
		smid: "∣",
		smile: "⌣",
		smt: "⪪",
		smte: "⪬",
		smtes: __,
		SOFTcy: "Ь",
		softcy: "ь",
		solbar: "⌿",
		solb: "⧄",
		sol: "/",
		Sopf: v_,
		sopf: y_,
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: b_,
		sqcup: "⊔",
		sqcups: x_,
		Sqrt: "√",
		sqsub: "⊏",
		sqsube: "⊑",
		sqsubset: "⊏",
		sqsubseteq: "⊑",
		sqsup: "⊐",
		sqsupe: "⊒",
		sqsupset: "⊐",
		sqsupseteq: "⊒",
		square: "□",
		Square: "□",
		SquareIntersection: "⊓",
		SquareSubset: "⊏",
		SquareSubsetEqual: "⊑",
		SquareSuperset: "⊐",
		SquareSupersetEqual: "⊒",
		SquareUnion: "⊔",
		squarf: "▪",
		squ: "□",
		squf: "▪",
		srarr: "→",
		Sscr: S_,
		sscr: C_,
		ssetmn: "∖",
		ssmile: "⌣",
		sstarf: "⋆",
		Star: "⋆",
		star: "☆",
		starf: "★",
		straightepsilon: "ϵ",
		straightphi: "ϕ",
		strns: "¯",
		sub: "⊂",
		Sub: "⋐",
		subdot: "⪽",
		subE: "⫅",
		sube: "⊆",
		subedot: "⫃",
		submult: "⫁",
		subnE: "⫋",
		subne: "⊊",
		subplus: "⪿",
		subrarr: "⥹",
		subset: "⊂",
		Subset: "⋐",
		subseteq: "⊆",
		subseteqq: "⫅",
		SubsetEqual: "⊆",
		subsetneq: "⊊",
		subsetneqq: "⫋",
		subsim: "⫇",
		subsub: "⫕",
		subsup: "⫓",
		succapprox: "⪸",
		succ: "≻",
		succcurlyeq: "≽",
		Succeeds: "≻",
		SucceedsEqual: "⪰",
		SucceedsSlantEqual: "≽",
		SucceedsTilde: "≿",
		succeq: "⪰",
		succnapprox: "⪺",
		succneqq: "⪶",
		succnsim: "⋩",
		succsim: "≿",
		SuchThat: "∋",
		sum: "∑",
		Sum: "∑",
		sung: "♪",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		sup: "⊃",
		Sup: "⋑",
		supdot: "⪾",
		supdsub: "⫘",
		supE: "⫆",
		supe: "⊇",
		supedot: "⫄",
		Superset: "⊃",
		SupersetEqual: "⊇",
		suphsol: "⟉",
		suphsub: "⫗",
		suplarr: "⥻",
		supmult: "⫂",
		supnE: "⫌",
		supne: "⊋",
		supplus: "⫀",
		supset: "⊃",
		Supset: "⋑",
		supseteq: "⊇",
		supseteqq: "⫆",
		supsetneq: "⊋",
		supsetneqq: "⫌",
		supsim: "⫈",
		supsub: "⫔",
		supsup: "⫖",
		swarhk: "⤦",
		swarr: "↙",
		swArr: "⇙",
		swarrow: "↙",
		swnwar: "⤪",
		szlig: "ß",
		Tab: "	",
		target: "⌖",
		Tau: "Τ",
		tau: "τ",
		tbrk: "⎴",
		Tcaron: "Ť",
		tcaron: "ť",
		Tcedil: "Ţ",
		tcedil: "ţ",
		Tcy: "Т",
		tcy: "т",
		tdot: "⃛",
		telrec: "⌕",
		Tfr: w_,
		tfr: T_,
		there4: "∴",
		therefore: "∴",
		Therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: E_,
		ThinSpace: " ",
		thinsp: " ",
		thkap: "≈",
		thksim: "∼",
		THORN: "Þ",
		thorn: "þ",
		tilde: "˜",
		Tilde: "∼",
		TildeEqual: "≃",
		TildeFullEqual: "≅",
		TildeTilde: "≈",
		timesbar: "⨱",
		timesb: "⊠",
		times: "×",
		timesd: "⨰",
		tint: "∭",
		toea: "⤨",
		topbot: "⌶",
		topcir: "⫱",
		top: "⊤",
		Topf: D_,
		topf: O_,
		topfork: "⫚",
		tosa: "⤩",
		tprime: "‴",
		trade: "™",
		TRADE: "™",
		triangle: "▵",
		triangledown: "▿",
		triangleleft: "◃",
		trianglelefteq: "⊴",
		triangleq: "≜",
		triangleright: "▹",
		trianglerighteq: "⊵",
		tridot: "◬",
		trie: "≜",
		triminus: "⨺",
		TripleDot: "⃛",
		triplus: "⨹",
		trisb: "⧍",
		tritime: "⨻",
		trpezium: "⏢",
		Tscr: k_,
		tscr: A_,
		TScy: "Ц",
		tscy: "ц",
		TSHcy: "Ћ",
		tshcy: "ћ",
		Tstrok: "Ŧ",
		tstrok: "ŧ",
		twixt: "≬",
		twoheadleftarrow: "↞",
		twoheadrightarrow: "↠",
		Uacute: "Ú",
		uacute: "ú",
		uarr: "↑",
		Uarr: "↟",
		uArr: "⇑",
		Uarrocir: "⥉",
		Ubrcy: "Ў",
		ubrcy: "ў",
		Ubreve: "Ŭ",
		ubreve: "ŭ",
		Ucirc: "Û",
		ucirc: "û",
		Ucy: "У",
		ucy: "у",
		udarr: "⇅",
		Udblac: "Ű",
		udblac: "ű",
		udhar: "⥮",
		ufisht: "⥾",
		Ufr: j_,
		ufr: M_,
		Ugrave: "Ù",
		ugrave: "ù",
		uHar: "⥣",
		uharl: "↿",
		uharr: "↾",
		uhblk: "▀",
		ulcorn: "⌜",
		ulcorner: "⌜",
		ulcrop: "⌏",
		ultri: "◸",
		Umacr: "Ū",
		umacr: "ū",
		uml: "¨",
		UnderBar: "_",
		UnderBrace: "⏟",
		UnderBracket: "⎵",
		UnderParenthesis: "⏝",
		Union: "⋃",
		UnionPlus: "⊎",
		Uogon: "Ų",
		uogon: "ų",
		Uopf: N_,
		uopf: P_,
		UpArrowBar: "⤒",
		uparrow: "↑",
		UpArrow: "↑",
		Uparrow: "⇑",
		UpArrowDownArrow: "⇅",
		updownarrow: "↕",
		UpDownArrow: "↕",
		Updownarrow: "⇕",
		UpEquilibrium: "⥮",
		upharpoonleft: "↿",
		upharpoonright: "↾",
		uplus: "⊎",
		UpperLeftArrow: "↖",
		UpperRightArrow: "↗",
		upsi: "υ",
		Upsi: "ϒ",
		upsih: "ϒ",
		Upsilon: "Υ",
		upsilon: "υ",
		UpTeeArrow: "↥",
		UpTee: "⊥",
		upuparrows: "⇈",
		urcorn: "⌝",
		urcorner: "⌝",
		urcrop: "⌎",
		Uring: "Ů",
		uring: "ů",
		urtri: "◹",
		Uscr: F_,
		uscr: I_,
		utdot: "⋰",
		Utilde: "Ũ",
		utilde: "ũ",
		utri: "▵",
		utrif: "▴",
		uuarr: "⇈",
		Uuml: "Ü",
		uuml: "ü",
		uwangle: "⦧",
		vangrt: "⦜",
		varepsilon: "ϵ",
		varkappa: "ϰ",
		varnothing: "∅",
		varphi: "ϕ",
		varpi: "ϖ",
		varpropto: "∝",
		varr: "↕",
		vArr: "⇕",
		varrho: "ϱ",
		varsigma: "ς",
		varsubsetneq: L_,
		varsubsetneqq: R_,
		varsupsetneq: z_,
		varsupsetneqq: B_,
		vartheta: "ϑ",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		vBar: "⫨",
		Vbar: "⫫",
		vBarv: "⫩",
		Vcy: "В",
		vcy: "в",
		vdash: "⊢",
		vDash: "⊨",
		Vdash: "⊩",
		VDash: "⊫",
		Vdashl: "⫦",
		veebar: "⊻",
		vee: "∨",
		Vee: "⋁",
		veeeq: "≚",
		vellip: "⋮",
		verbar: "|",
		Verbar: "‖",
		vert: "|",
		Vert: "‖",
		VerticalBar: "∣",
		VerticalLine: "|",
		VerticalSeparator: "❘",
		VerticalTilde: "≀",
		VeryThinSpace: " ",
		Vfr: V_,
		vfr: H_,
		vltri: "⊲",
		vnsub: U_,
		vnsup: W_,
		Vopf: G_,
		vopf: K_,
		vprop: "∝",
		vrtri: "⊳",
		Vscr: q_,
		vscr: J_,
		vsubnE: Y_,
		vsubne: X_,
		vsupnE: Z_,
		vsupne: Q_,
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		wedge: "∧",
		Wedge: "⋀",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: $_,
		wfr: ev,
		Wopf: tv,
		wopf: nv,
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: rv,
		wscr: iv,
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: av,
		xfr: ov,
		xharr: "⟷",
		xhArr: "⟺",
		Xi: "Ξ",
		xi: "ξ",
		xlarr: "⟵",
		xlArr: "⟸",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: sv,
		xopf: cv,
		xoplus: "⨁",
		xotime: "⨂",
		xrarr: "⟶",
		xrArr: "⟹",
		Xscr: lv,
		xscr: uv,
		xsqcup: "⨆",
		xuplus: "⨄",
		xutri: "△",
		xvee: "⋁",
		xwedge: "⋀",
		Yacute: "Ý",
		yacute: "ý",
		YAcy: "Я",
		yacy: "я",
		Ycirc: "Ŷ",
		ycirc: "ŷ",
		Ycy: "Ы",
		ycy: "ы",
		yen: "¥",
		Yfr: dv,
		yfr: fv,
		YIcy: "Ї",
		yicy: "ї",
		Yopf: pv,
		yopf: mv,
		Yscr: hv,
		yscr: gv,
		YUcy: "Ю",
		yucy: "ю",
		yuml: "ÿ",
		Yuml: "Ÿ",
		Zacute: "Ź",
		zacute: "ź",
		Zcaron: "Ž",
		zcaron: "ž",
		Zcy: "З",
		zcy: "з",
		Zdot: "Ż",
		zdot: "ż",
		zeetrf: "ℨ",
		ZeroWidthSpace: "​",
		Zeta: "Ζ",
		zeta: "ζ",
		zfr: _v,
		Zfr: "ℨ",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		zopf: vv,
		Zopf: "ℤ",
		Zscr: yv,
		zscr: bv,
		zwj: "‍",
		zwnj: "‌"
	};
})), Cv = /* @__PURE__ */ y({
	AElig: () => "Æ",
	AMP: () => "&",
	Aacute: () => "Á",
	Acirc: () => "Â",
	Agrave: () => "À",
	Aring: () => "Å",
	Atilde: () => "Ã",
	Auml: () => "Ä",
	COPY: () => "©",
	Ccedil: () => "Ç",
	ETH: () => "Ð",
	Eacute: () => "É",
	Ecirc: () => "Ê",
	Egrave: () => "È",
	Euml: () => "Ë",
	GT: () => ">",
	Iacute: () => "Í",
	Icirc: () => "Î",
	Igrave: () => "Ì",
	Iuml: () => "Ï",
	LT: () => "<",
	Ntilde: () => "Ñ",
	Oacute: () => "Ó",
	Ocirc: () => "Ô",
	Ograve: () => "Ò",
	Oslash: () => "Ø",
	Otilde: () => "Õ",
	Ouml: () => "Ö",
	QUOT: () => "\"",
	REG: () => "®",
	THORN: () => "Þ",
	Uacute: () => "Ú",
	Ucirc: () => "Û",
	Ugrave: () => "Ù",
	Uuml: () => "Ü",
	Yacute: () => "Ý",
	aacute: () => "á",
	acirc: () => "â",
	acute: () => "´",
	aelig: () => "æ",
	agrave: () => "à",
	amp: () => "&",
	aring: () => "å",
	atilde: () => "ã",
	auml: () => "ä",
	brvbar: () => "¦",
	ccedil: () => "ç",
	cedil: () => "¸",
	cent: () => "¢",
	copy: () => "©",
	curren: () => "¤",
	default: () => wv,
	deg: () => "°",
	divide: () => "÷",
	eacute: () => "é",
	ecirc: () => "ê",
	egrave: () => "è",
	eth: () => "ð",
	euml: () => "ë",
	frac12: () => "½",
	frac14: () => "¼",
	frac34: () => "¾",
	gt: () => ">",
	iacute: () => "í",
	icirc: () => "î",
	iexcl: () => "¡",
	igrave: () => "ì",
	iquest: () => "¿",
	iuml: () => "ï",
	laquo: () => "«",
	lt: () => "<",
	macr: () => "¯",
	micro: () => "µ",
	middot: () => "·",
	nbsp: () => "\xA0",
	not: () => "¬",
	ntilde: () => "ñ",
	oacute: () => "ó",
	ocirc: () => "ô",
	ograve: () => "ò",
	ordf: () => "ª",
	ordm: () => "º",
	oslash: () => "ø",
	otilde: () => "õ",
	ouml: () => "ö",
	para: () => "¶",
	plusmn: () => "±",
	pound: () => "£",
	quot: () => "\"",
	raquo: () => "»",
	reg: () => "®",
	sect: () => "§",
	shy: () => "­",
	sup1: () => "¹",
	sup2: () => "²",
	sup3: () => "³",
	szlig: () => "ß",
	thorn: () => "þ",
	times: () => "×",
	uacute: () => "ú",
	ucirc: () => "û",
	ugrave: () => "ù",
	uml: () => "¨",
	uuml: () => "ü",
	yacute: () => "ý",
	yen: () => "¥",
	yuml: () => "ÿ"
}), wv, Tv = _((() => {
	wv = {
		Aacute: "Á",
		aacute: "á",
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		AElig: "Æ",
		aelig: "æ",
		Agrave: "À",
		agrave: "à",
		amp: "&",
		AMP: "&",
		Aring: "Å",
		aring: "å",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		brvbar: "¦",
		Ccedil: "Ç",
		ccedil: "ç",
		cedil: "¸",
		cent: "¢",
		copy: "©",
		COPY: "©",
		curren: "¤",
		deg: "°",
		divide: "÷",
		Eacute: "É",
		eacute: "é",
		Ecirc: "Ê",
		ecirc: "ê",
		Egrave: "È",
		egrave: "è",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		frac12: "½",
		frac14: "¼",
		frac34: "¾",
		gt: ">",
		GT: ">",
		Iacute: "Í",
		iacute: "í",
		Icirc: "Î",
		icirc: "î",
		iexcl: "¡",
		Igrave: "Ì",
		igrave: "ì",
		iquest: "¿",
		Iuml: "Ï",
		iuml: "ï",
		laquo: "«",
		lt: "<",
		LT: "<",
		macr: "¯",
		micro: "µ",
		middot: "·",
		nbsp: "\xA0",
		not: "¬",
		Ntilde: "Ñ",
		ntilde: "ñ",
		Oacute: "Ó",
		oacute: "ó",
		Ocirc: "Ô",
		ocirc: "ô",
		Ograve: "Ò",
		ograve: "ò",
		ordf: "ª",
		ordm: "º",
		Oslash: "Ø",
		oslash: "ø",
		Otilde: "Õ",
		otilde: "õ",
		Ouml: "Ö",
		ouml: "ö",
		para: "¶",
		plusmn: "±",
		pound: "£",
		quot: "\"",
		QUOT: "\"",
		raquo: "»",
		reg: "®",
		REG: "®",
		sect: "§",
		shy: "­",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		szlig: "ß",
		THORN: "Þ",
		thorn: "þ",
		times: "×",
		Uacute: "Ú",
		uacute: "ú",
		Ucirc: "Û",
		ucirc: "û",
		Ugrave: "Ù",
		ugrave: "ù",
		uml: "¨",
		Uuml: "Ü",
		uuml: "ü",
		Yacute: "Ý",
		yacute: "ý",
		yen: "¥",
		yuml: "ÿ"
	};
})), Ev = /* @__PURE__ */ y({
	amp: () => "&",
	apos: () => "'",
	default: () => Dv,
	gt: () => ">",
	lt: () => "<",
	quot: () => "\""
}), Dv, Ov = _((() => {
	Dv = {
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	};
})), kv = /* @__PURE__ */ y({ default: () => Av }), Av, jv = _((() => {
	Av = {
		0: 65533,
		128: 8364,
		130: 8218,
		131: 402,
		132: 8222,
		133: 8230,
		134: 8224,
		135: 8225,
		136: 710,
		137: 8240,
		138: 352,
		139: 8249,
		140: 338,
		142: 381,
		145: 8216,
		146: 8217,
		147: 8220,
		148: 8221,
		149: 8226,
		150: 8211,
		151: 8212,
		152: 732,
		153: 8482,
		154: 353,
		155: 8250,
		156: 339,
		158: 382,
		159: 376
	};
})), Mv = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t((jv(), S(kv).default)), r = String.fromCodePoint || function(e) {
		var t = "";
		return e > 65535 && (e -= 65536, t += String.fromCharCode(e >>> 10 & 1023 | 55296), e = 56320 | e & 1023), t += String.fromCharCode(e), t;
	};
	function i(e) {
		return e >= 55296 && e <= 57343 || e > 1114111 ? "�" : (e in n.default && (e = n.default[e]), r(e));
	}
	e.default = i;
})), Nv = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.decodeHTML = e.decodeHTMLStrict = e.decodeXML = void 0;
	var n = t((Sv(), S(dm).default)), r = t((Tv(), S(Cv).default)), i = t((Ov(), S(Ev).default)), a = t(Mv()), o = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
	e.decodeXML = s(i.default), e.decodeHTMLStrict = s(n.default);
	function s(e) {
		var t = l(e);
		return function(e) {
			return String(e).replace(o, t);
		};
	}
	var c = function(e, t) {
		return e < t ? 1 : -1;
	};
	e.decodeHTML = (function() {
		for (var e = Object.keys(r.default).sort(c), t = Object.keys(n.default).sort(c), i = 0, a = 0; i < t.length; i++) e[a] === t[i] ? (t[i] += ";?", a++) : t[i] += ";";
		var o = RegExp("&(?:" + t.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"), s = l(n.default);
		function u(e) {
			return e.substr(-1) !== ";" && (e += ";"), s(e);
		}
		return function(e) {
			return String(e).replace(o, u);
		};
	})();
	function l(e) {
		return function(t) {
			if (t.charAt(1) === "#") {
				var n = t.charAt(2);
				return n === "X" || n === "x" ? a.default(parseInt(t.substr(3), 16)) : a.default(parseInt(t.substr(2), 10));
			}
			return e[t.slice(1, -1)] || t;
		};
	}
})), Pv = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.escapeUTF8 = e.escape = e.encodeNonAsciiHTML = e.encodeHTML = e.encodeXML = void 0;
	var n = a(t((Ov(), S(Ev).default)).default), r = o(n);
	e.encodeXML = m(n);
	var i = a(t((Sv(), S(dm).default)).default);
	e.encodeHTML = u(i, o(i)), e.encodeNonAsciiHTML = m(i);
	function a(e) {
		return Object.keys(e).sort().reduce(function(t, n) {
			return t[e[n]] = "&" + n + ";", t;
		}, {});
	}
	function o(e) {
		for (var t = [], n = [], r = 0, i = Object.keys(e); r < i.length; r++) {
			var a = i[r];
			a.length === 1 ? t.push("\\" + a) : n.push(a);
		}
		t.sort();
		for (var o = 0; o < t.length - 1; o++) {
			for (var s = o; s < t.length - 1 && t[s].charCodeAt(1) + 1 === t[s + 1].charCodeAt(1);) s += 1;
			var c = 1 + s - o;
			c < 3 || t.splice(o, c, t[o] + "-" + t[s]);
		}
		return n.unshift("[" + t.join("") + "]"), new RegExp(n.join("|"), "g");
	}
	var s = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g, c = String.prototype.codePointAt == null ? function(e) {
		return (e.charCodeAt(0) - 55296) * 1024 + e.charCodeAt(1) - 56320 + 65536;
	} : function(e) {
		return e.codePointAt(0);
	};
	function l(e) {
		return "&#x" + (e.length > 1 ? c(e) : e.charCodeAt(0)).toString(16).toUpperCase() + ";";
	}
	function u(e, t) {
		return function(n) {
			return n.replace(t, function(t) {
				return e[t];
			}).replace(s, l);
		};
	}
	var d = RegExp(r.source + "|" + s.source, "g");
	function f(e) {
		return e.replace(d, l);
	}
	e.escape = f;
	function p(e) {
		return e.replace(r, l);
	}
	e.escapeUTF8 = p;
	function m(e) {
		return function(t) {
			return t.replace(d, function(t) {
				return e[t] || l(t);
			});
		};
	}
})), Fv = /* @__PURE__ */ v(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.decodeXMLStrict = e.decodeHTML5Strict = e.decodeHTML4Strict = e.decodeHTML5 = e.decodeHTML4 = e.decodeHTMLStrict = e.decodeHTML = e.decodeXML = e.encodeHTML5 = e.encodeHTML4 = e.escapeUTF8 = e.escape = e.encodeNonAsciiHTML = e.encodeHTML = e.encodeXML = e.encode = e.decodeStrict = e.decode = void 0;
	var t = Nv(), n = Pv();
	function r(e, n) {
		return (!n || n <= 0 ? t.decodeXML : t.decodeHTML)(e);
	}
	e.decode = r;
	function i(e, n) {
		return (!n || n <= 0 ? t.decodeXML : t.decodeHTMLStrict)(e);
	}
	e.decodeStrict = i;
	function a(e, t) {
		return (!t || t <= 0 ? n.encodeXML : n.encodeHTML)(e);
	}
	e.encode = a;
	var o = Pv();
	Object.defineProperty(e, "encodeXML", {
		enumerable: !0,
		get: function() {
			return o.encodeXML;
		}
	}), Object.defineProperty(e, "encodeHTML", {
		enumerable: !0,
		get: function() {
			return o.encodeHTML;
		}
	}), Object.defineProperty(e, "encodeNonAsciiHTML", {
		enumerable: !0,
		get: function() {
			return o.encodeNonAsciiHTML;
		}
	}), Object.defineProperty(e, "escape", {
		enumerable: !0,
		get: function() {
			return o.escape;
		}
	}), Object.defineProperty(e, "escapeUTF8", {
		enumerable: !0,
		get: function() {
			return o.escapeUTF8;
		}
	}), Object.defineProperty(e, "encodeHTML4", {
		enumerable: !0,
		get: function() {
			return o.encodeHTML;
		}
	}), Object.defineProperty(e, "encodeHTML5", {
		enumerable: !0,
		get: function() {
			return o.encodeHTML;
		}
	});
	var s = Nv();
	Object.defineProperty(e, "decodeXML", {
		enumerable: !0,
		get: function() {
			return s.decodeXML;
		}
	}), Object.defineProperty(e, "decodeHTML", {
		enumerable: !0,
		get: function() {
			return s.decodeHTML;
		}
	}), Object.defineProperty(e, "decodeHTMLStrict", {
		enumerable: !0,
		get: function() {
			return s.decodeHTMLStrict;
		}
	}), Object.defineProperty(e, "decodeHTML4", {
		enumerable: !0,
		get: function() {
			return s.decodeHTML;
		}
	}), Object.defineProperty(e, "decodeHTML5", {
		enumerable: !0,
		get: function() {
			return s.decodeHTML;
		}
	}), Object.defineProperty(e, "decodeHTML4Strict", {
		enumerable: !0,
		get: function() {
			return s.decodeHTMLStrict;
		}
	}), Object.defineProperty(e, "decodeHTML5Strict", {
		enumerable: !0,
		get: function() {
			return s.decodeHTMLStrict;
		}
	}), Object.defineProperty(e, "decodeXMLStrict", {
		enumerable: !0,
		get: function() {
			return s.decodeXML;
		}
	});
})), Iv = /* @__PURE__ */ v(((e, t) => {
	var n = t.exports = {}, r = Fv(), i = lm();
	n.stripHtml = function(e) {
		return e = e.replace(/([^\n])<\/?(h|br|p|ul|ol|li|blockquote|section|table|tr|div)(?:.|\n)*?>([^\n])/gm, "$1\n$3"), e = e.replace(/<(?:.|\n)*?>/gm, ""), e;
	}, n.getSnippet = function(e) {
		return r.decodeHTML(n.stripHtml(e)).trim();
	}, n.getLink = function(e, t, n) {
		if (e) {
			for (let n = 0; n < e.length; ++n) if (e[n].$.rel === t) return e[n].$.href;
			if (e[n]) return e[n].$.href;
		}
	}, n.getContent = function(e) {
		return typeof e._ == "string" ? e._ : typeof e == "object" ? new i.Builder({
			headless: !0,
			explicitRoot: !0,
			rootName: "div",
			renderOpts: { pretty: !1 }
		}).buildObject(e) : e;
	}, n.copyFromXML = function(e, t, r) {
		r.forEach(function(r) {
			let i = r, a = r, o = {};
			Array.isArray(r) && (i = r[0], a = r[1], r.length > 2 && (o = r[2]));
			let { keepArray: s, includeSnippet: c } = o;
			e[i] !== void 0 && (t[a] = s ? e[i] : e[i][0]), t[a] && typeof t[a]._ == "string" && (t[a] = t[a]._), c && t[a] && typeof t[a] == "string" && (t[a + "Snippet"] = n.getSnippet(t[a]));
		});
	}, n.maybePromisify = function(e, t) {
		return e ? t.then((t) => setTimeout(() => e(null, t)), (t) => setTimeout(() => e(t))) : t;
	};
	var a = "utf8", o = /(encoding|charset)\s*=\s*(\S+)/, s = [
		"ascii",
		"utf8",
		"utf16le",
		"ucs2",
		"base64",
		"latin1",
		"binary",
		"hex"
	], c = {
		"utf-8": "utf8",
		"iso-8859-1": "latin1"
	};
	n.getEncodingFromContentType = function(e) {
		e ||= "";
		let t = (e.match(o) || [])[2] || "";
		return t = t.toLowerCase(), t = c[t] || t, (!t || s.indexOf(t) === -1) && (t = a), t;
	};
})), Lv = /* @__PURE__ */ v(((e, t) => {
	var n = C("http"), r = C("https"), i = lm(), a = C("url"), o = um(), s = Iv(), c = {
		"User-Agent": "rss-parser",
		Accept: "application/rss+xml"
	}, l = 5, u = 6e4;
	t.exports = class {
		constructor(e = {}) {
			e.headers = e.headers || {}, e.xml2js = e.xml2js || {}, e.customFields = e.customFields || {}, e.customFields.item = e.customFields.item || [], e.customFields.feed = e.customFields.feed || [], e.requestOptions = e.requestOptions || {}, e.maxRedirects ||= l, e.timeout ||= u, this.options = e, this.xmlParser = new i.Parser(this.options.xml2js);
		}
		parseString(e, t) {
			let n = new Promise((t, n) => {
				this.xmlParser.parseString(e, (e, r) => {
					if (e) return n(e);
					if (!r) return n(/* @__PURE__ */ Error("Unable to parse XML."));
					let i = null;
					if (r.feed) i = this.buildAtomFeed(r);
					else if (r.rss && r.rss.$ && r.rss.$.version && r.rss.$.version.match(/^2/)) i = this.buildRSS2(r);
					else if (r["rdf:RDF"]) i = this.buildRSS1(r);
					else if (r.rss && r.rss.$ && r.rss.$.version && r.rss.$.version.match(/0\.9/)) i = this.buildRSS0_9(r);
					else if (r.rss && this.options.defaultRSS) switch (this.options.defaultRSS) {
						case .9:
							i = this.buildRSS0_9(r);
							break;
						case 1:
							i = this.buildRSS1(r);
							break;
						case 2:
							i = this.buildRSS2(r);
							break;
						default: return n(/* @__PURE__ */ Error("default RSS version not recognized."));
					}
					else return n(/* @__PURE__ */ Error("Feed not recognized as RSS 1 or 2."));
					t(i);
				});
			});
			return n = s.maybePromisify(t, n), n;
		}
		parseURL(e, t, i = 0) {
			let o = "", l = e.indexOf("https") === 0 ? r.get : n.get, u = a.parse(e), d = Object.assign({}, c, this.options.headers), f = null, p = new Promise((t, n) => {
				l(Object.assign({ headers: d }, u, this.options.requestOptions), (r) => {
					if (this.options.maxRedirects && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
						if (i === this.options.maxRedirects) return n(/* @__PURE__ */ Error("Too many redirects"));
						{
							let o = a.resolve(e, r.headers.location);
							return this.parseURL(o, null, i + 1).then(t, n);
						}
					} else if (r.statusCode >= 300) return n(/* @__PURE__ */ Error("Status code " + r.statusCode));
					let c = s.getEncodingFromContentType(r.headers["content-type"]);
					r.setEncoding(c), r.on("data", (e) => {
						o += e;
					}), r.on("end", () => this.parseString(o).then(t, n));
				}).on("error", n), f = setTimeout(() => n(/* @__PURE__ */ Error("Request timed out after " + this.options.timeout + "ms")), this.options.timeout);
			}).then((e) => (clearTimeout(f), Promise.resolve(e)), (e) => (clearTimeout(f), Promise.reject(e)));
			return p = s.maybePromisify(t, p), p;
		}
		buildAtomFeed(e) {
			let t = { items: [] };
			if (s.copyFromXML(e.feed, t, this.options.customFields.feed), e.feed.link && (t.link = s.getLink(e.feed.link, "alternate", 0), t.feedUrl = s.getLink(e.feed.link, "self", 1)), e.feed.title) {
				let n = e.feed.title[0] || "";
				n._ && (n = n._), n && (t.title = n);
			}
			return e.feed.updated && (t.lastBuildDate = e.feed.updated[0]), t.items = (e.feed.entry || []).map((e) => this.parseItemAtom(e)), t;
		}
		parseItemAtom(e) {
			let t = {};
			if (s.copyFromXML(e, t, this.options.customFields.item), e.title) {
				let n = e.title[0] || "";
				n._ && (n = n._), n && (t.title = n);
			}
			return e.link && e.link.length && (t.link = s.getLink(e.link, "alternate", 0)), e.published && e.published.length && e.published[0].length && (t.pubDate = new Date(e.published[0]).toISOString()), !t.pubDate && e.updated && e.updated.length && e.updated[0].length && (t.pubDate = new Date(e.updated[0]).toISOString()), e.author && e.author.length && e.author[0].name && e.author[0].name.length && (t.author = e.author[0].name[0]), e.content && e.content.length && (t.content = s.getContent(e.content[0]), t.contentSnippet = s.getSnippet(t.content)), e.summary && e.summary.length && (t.summary = s.getContent(e.summary[0])), e.id && (t.id = e.id[0]), this.setISODate(t), t;
		}
		buildRSS0_9(e) {
			var t = e.rss.channel[0], n = t.item;
			return this.buildRSS(t, n);
		}
		buildRSS1(e) {
			e = e["rdf:RDF"];
			let t = e.channel[0], n = e.item;
			return this.buildRSS(t, n);
		}
		buildRSS2(e) {
			let t = e.rss.channel[0], n = t.item, r = this.buildRSS(t, n);
			return e.rss.$ && e.rss.$["xmlns:itunes"] && this.decorateItunes(r, t), r;
		}
		buildRSS(e, t) {
			t ||= [];
			let n = { items: [] }, r = o.feed.concat(this.options.customFields.feed), i = o.item.concat(this.options.customFields.item);
			if (e["atom:link"] && e["atom:link"][0] && e["atom:link"][0].$ && (n.feedUrl = e["atom:link"][0].$.href), e.image && e.image[0] && e.image[0].url) {
				n.image = {};
				let t = e.image[0];
				t.link && (n.image.link = t.link[0]), t.url && (n.image.url = t.url[0]), t.title && (n.image.title = t.title[0]), t.width && (n.image.width = t.width[0]), t.height && (n.image.height = t.height[0]);
			}
			let a = this.generatePaginationLinks(e);
			return Object.keys(a).length && (n.paginationLinks = a), s.copyFromXML(e, n, r), n.items = t.map((e) => this.parseItemRss(e, i)), n;
		}
		parseItemRss(e, t) {
			let n = {};
			return s.copyFromXML(e, n, t), e.enclosure && (n.enclosure = e.enclosure[0].$), e.description && (n.content = s.getContent(e.description[0]), n.contentSnippet = s.getSnippet(n.content)), e.guid && (n.guid = e.guid[0], n.guid._ && (n.guid = n.guid._)), e.$ && e.$["rdf:about"] && (n["rdf:about"] = e.$["rdf:about"]), e.category && (n.categories = e.category), this.setISODate(n), n;
		}
		decorateItunes(e, t) {
			let n = t.item || [];
			if (e.itunes = {}, t["itunes:owner"]) {
				let n = {};
				t["itunes:owner"][0]["itunes:name"] && (n.name = t["itunes:owner"][0]["itunes:name"][0]), t["itunes:owner"][0]["itunes:email"] && (n.email = t["itunes:owner"][0]["itunes:email"][0]), e.itunes.owner = n;
			}
			if (t["itunes:image"]) {
				let n;
				n = t["itunes:image"][0] && t["itunes:image"][0].$ && t["itunes:image"][0].$.href ? t["itunes:image"][0].$.href : null, n && (e.itunes.image = n);
			}
			if (t["itunes:category"]) {
				let n = t["itunes:category"].map((e) => ({
					name: e && e.$ && e.$.text,
					subs: e["itunes:category"] ? e["itunes:category"].map((e) => ({ name: e && e.$ && e.$.text })) : null
				}));
				e.itunes.categories = n.map((e) => e.name), e.itunes.categoriesWithSubs = n;
			}
			if (t["itunes:keywords"]) if (t["itunes:keywords"].length > 1) e.itunes.keywords = t["itunes:keywords"].map((e) => e && e.$ && e.$.text);
			else {
				let n = t["itunes:keywords"][0];
				n && typeof n._ == "string" && (n = n._), n && n.$ && n.$.text ? e.itunes.keywords = n.$.text.split(",") : typeof n == "string" && (e.itunes.keywords = n.split(","));
			}
			s.copyFromXML(t, e.itunes, o.podcastFeed), n.forEach((t, n) => {
				let r = e.items[n];
				r.itunes = {}, s.copyFromXML(t, r.itunes, o.podcastItem);
				let i = t["itunes:image"];
				i && i[0] && i[0].$ && i[0].$.href && (r.itunes.image = i[0].$.href);
			});
		}
		setISODate(e) {
			let t = e.pubDate || e.date;
			if (t) try {
				e.isoDate = new Date(t.trim()).toISOString();
			} catch {}
		}
		generatePaginationLinks(e) {
			if (!e["atom:link"]) return {};
			let t = [
				"self",
				"first",
				"next",
				"prev",
				"last"
			];
			return e["atom:link"].reduce((e, n) => (!n.$ || !t.includes(n.$.rel) || (e[n.$.rel] = n.$.href), e), {});
		}
	};
})), Rv = /* @__PURE__ */ x((/* @__PURE__ */ v(((e, t) => {
	t.exports = Lv();
})))(), 1), zv = [
	{
		id: "cnbc-finance",
		label: "CNBC Finance RSS",
		url: "https://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=finance",
		sector: "Financial news"
	},
	{
		id: "reuters-business-google-news",
		label: "Reuters Business via Google News RSS",
		url: "https://news.google.com/rss/search?q=when:1d+source:Reuters+business",
		sector: "Business news"
	},
	{
		id: "macro-geopolitics-google-news",
		label: "Macro Geopolitics RSS",
		url: "https://news.google.com/rss/search?q=when:1d+(tariffs+OR+Taiwan+OR+Red+Sea+OR+inflation+OR+oil+OR+semiconductor)",
		sector: "Macro/geopolitics"
	}
], Bv = class extends u {
	parser = new Rv.default({ timeout: 12e3 });
	feeds;
	intervalMs;
	requestTimeoutMs;
	maxSeenTitles;
	seenTitleHashes = [];
	seenSet = /* @__PURE__ */ new Set();
	timer = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.feeds = e.feeds ?? zv, this.intervalMs = e.intervalMs ?? 3e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 12e3, this.maxSeenTitles = e.maxSeenTitles ?? 5e3;
	}
	on(e, t) {
		return super.on(e, t);
	}
	start() {
		this.running || (this.running = !0, this.pollAll(), this.timer = setInterval(() => void this.pollAll(), this.intervalMs));
	}
	stop() {
		this.running = !1, this.timer &&= (clearInterval(this.timer), null);
	}
	async pollAll() {
		await Promise.allSettled(this.feeds.map((e) => this.pollFeed(e)));
	}
	async pollFeed(e) {
		try {
			let t = await Uv(this.parser.parseURL(e.url), this.requestTimeoutMs, `${e.label} timed out`), n = Array.isArray(t.items) ? t.items : [];
			for (let t of n) {
				let n = Vv(e, t);
				!n || this.hasSeen(n.title) || (this.markSeen(n.title), this.emit("headline", n));
			}
		} catch (e) {
			this.emit("error", e instanceof Error ? e : Error(String(e)));
		}
	}
	hasSeen(e) {
		return this.seenSet.has(up(e.toLowerCase()));
	}
	markSeen(e) {
		let t = up(e.toLowerCase());
		for (this.seenSet.add(t), this.seenTitleHashes.push(t); this.seenTitleHashes.length > this.maxSeenTitles;) {
			let e = this.seenTitleHashes.shift();
			e && this.seenSet.delete(e);
		}
	}
};
function Vv(e, t) {
	let n = t.title?.trim(), r = t.link?.trim() || e.url;
	if (!n) return null;
	let i = Hv(t.isoDate ?? t.pubDate) ?? Date.now(), a = [
		n,
		t.contentSnippet,
		t.content
	].filter(Boolean).join(" ");
	return {
		id: `rss-${e.id}-${up(`${n}:${r}`)}`,
		title: n,
		sourceName: e.label,
		sourceUrl: r,
		sourceTrust: "public unauthenticated",
		publishedAt: i,
		observedAt: Date.now(),
		sector: e.sector,
		summary: t.contentSnippet?.trim() || n,
		rawText: a
	};
}
function Hv(e) {
	if (!e) return null;
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : null;
}
function Uv(e, t, n) {
	let r = null, i = new Promise((e, i) => {
		r = setTimeout(() => i(Error(n)), t);
	});
	return Promise.race([e, i]).finally(() => {
		r && clearTimeout(r);
	});
}
//#endregion
//#region electron/ingest/stocktwitsPulseService.ts
var Wv = [
	{
		symbol: "SPY",
		stocktwitsSymbol: "SPY"
	},
	{
		symbol: "QQQ",
		stocktwitsSymbol: "QQQ"
	},
	{
		symbol: "NVDA",
		stocktwitsSymbol: "NVDA"
	},
	{
		symbol: "AAPL",
		stocktwitsSymbol: "AAPL"
	},
	{
		symbol: "TSLA",
		stocktwitsSymbol: "TSLA"
	},
	{
		symbol: "BTC",
		stocktwitsSymbol: "BTC.X"
	},
	{
		symbol: "ETH",
		stocktwitsSymbol: "ETH.X"
	},
	{
		symbol: "KAS",
		stocktwitsSymbol: "KAS.X"
	}
], Gv = class extends u {
	targets;
	intervalMs;
	requestTimeoutMs;
	maxSeenIdsPerSymbol;
	state = /* @__PURE__ */ new Map();
	timer = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.targets = e.targets ?? Wv, this.intervalMs = e.intervalMs ?? 6e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 1e4, this.maxSeenIdsPerSymbol = e.maxSeenIdsPerSymbol ?? 1e3;
	}
	on(e, t) {
		return super.on(e, t);
	}
	start() {
		this.running || (this.running = !0, this.pollAll(), this.timer = setInterval(() => void this.pollAll(), this.intervalMs));
	}
	stop() {
		this.running = !1, this.timer &&= (clearInterval(this.timer), null);
	}
	async pollAll() {
		for (let e of this.targets) await this.pollTarget(e);
	}
	async pollTarget(e) {
		let t = `https://api.stocktwits.com/api/2/streams/symbol/${encodeURIComponent(e.stocktwitsSymbol)}.json`, n = new AbortController(), r = setTimeout(() => n.abort(), this.requestTimeoutMs);
		try {
			let r = await fetch(t, {
				signal: n.signal,
				headers: {
					accept: "application/json",
					"user-agent": "AtlaszIntel/0.3 local-first public stocktwits connector"
				}
			});
			if (!r.ok) throw Error(`Stocktwits ${e.stocktwitsSymbol} HTTP ${r.status}`);
			let i = await r.json(), a = Array.isArray(i.messages) ? i.messages : [], o = this.normalizeBatch(e, t, a);
			this.emit("pulse", o);
		} catch (e) {
			this.emit("error", e instanceof Error ? e : Error(String(e)));
		} finally {
			clearTimeout(r);
		}
	}
	normalizeBatch(e, t, n) {
		let r = Date.now(), i = this.getState(e.symbol), a = i.lastPollAt ? Math.max((r - i.lastPollAt) / 6e4, 1 / 60) : this.intervalMs / 6e4, o = 0, s = 0, c = 0;
		for (let e of n) {
			let t = e.id === void 0 ? "" : String(e.id);
			t && !i.seenIds.has(t) && (this.markSeen(i, t), o += 1);
			let n = String(e.entities?.sentiment?.basic ?? "").toLowerCase();
			n === "bullish" ? s += 1 : n === "bearish" && (c += 1);
		}
		let l = o / a, u = s + c, d = u === 0 ? 0 : (s - c) / u, f = l - i.lastNewMessageCount / a;
		i.lastPollAt = r, i.lastNewMessageCount = o;
		let p = dp(38 + l * 8 + Math.max(0, f) * 3 + Math.abs(d) * 16, 0, 100), m = {
			target: e.symbol,
			pressure: Kv(p, 2),
			mentionVelocity: Kv(l, 3),
			sentimentDivergenceIndex: Kv(d, 3),
			timestamp: r,
			source: "stocktwits_public_stream"
		};
		return {
			symbol: e.symbol,
			sourceSymbol: e.stocktwitsSymbol,
			sourceUrl: t,
			messageCount: n.length,
			newMessageCount: o,
			velocityPerMinute: Kv(l, 3),
			mutedSentimentIndex: Kv(d, 3),
			bullishCount: s,
			bearishCount: c,
			observedAt: r,
			attentionTick: m
		};
	}
	getState(e) {
		let t = this.state.get(e);
		return t || (t = {
			seenIds: /* @__PURE__ */ new Set(),
			seenQueue: [],
			lastNewMessageCount: 0
		}, this.state.set(e, t)), t;
	}
	markSeen(e, t) {
		for (e.seenIds.add(t), e.seenQueue.push(t); e.seenQueue.length > this.maxSeenIdsPerSymbol;) {
			let t = e.seenQueue.shift();
			t && e.seenIds.delete(t);
		}
	}
};
function Kv(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
//#endregion
//#region electron/ingest/twitterExploreScraper.ts
var qv = class {
	enabled;
	authToken;
	headless;
	constructor(e = {}) {
		this.enabled = e.enabled ?? process.env.ATLASZ_ENABLE_X_EXPLORE_SCRAPER === "1", this.authToken = e.authToken ?? process.env.ATLASZ_X_AUTH_TOKEN, this.headless = e.headless ?? !0;
	}
	async extractTrendingKeywords() {
		if (!this.enabled) return [];
		throw this.authToken ? Error(`X Explore scraper scaffold is configured (headless=${this.headless}) but no browser automation adapter is installed.`) : Error("X Explore scraper requires ATLASZ_X_AUTH_TOKEN and is disabled by default.");
	}
}, Jv = [
	"NVDA",
	"SPY",
	"QQQ",
	"XLE",
	"GLD",
	"TSM"
], Yv = class extends u {
	symbols;
	intervalMs;
	lookbackMinutes;
	timer = null;
	client = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.symbols = e.symbols ?? Jv, this.intervalMs = e.intervalMs ?? 6e4, this.lookbackMinutes = e.lookbackMinutes ?? 8;
	}
	on(e, t) {
		return super.on(e, t);
	}
	start() {
		this.running || (this.running = !0, this.poll(), this.timer = setInterval(() => void this.poll(), this.intervalMs));
	}
	stop() {
		this.running = !1, this.timer &&= (clearInterval(this.timer), null);
	}
	async poll() {
		try {
			let e = await this.getClient(), t = /* @__PURE__ */ new Date(Date.now() - this.lookbackMinutes * 6e4), n = await Promise.allSettled(this.symbols.map(async (n) => Xv(n, await e.chart(n, {
				period1: t,
				interval: "1m"
			})))), r = n.map((e) => e.status === "fulfilled" ? e.value : null).filter((e) => e !== null);
			for (let e of n) e.status === "rejected" && this.emit("error", e.reason instanceof Error ? e.reason : Error(String(e.reason)));
			r.length > 0 && this.emit("ticks", {
				source: "yahoo_finance_1m_public",
				observedAt: Date.now(),
				ticks: r
			});
		} catch (e) {
			this.emit("error", e instanceof Error ? e : Error(String(e)));
		}
	}
	async getClient() {
		if (!this.client) {
			let e = await import("./src-BolcCD_I.js");
			this.client = e.default;
		}
		return this.client;
	}
};
function Xv(e, t) {
	let n = [...t.quotes ?? []].reverse().find((e) => {
		let t = e.close ?? e.regularMarketPrice;
		return typeof t == "number" && Number.isFinite(t) && t > 0;
	});
	if (!n) return null;
	let r = n.close ?? n.regularMarketPrice;
	return typeof r != "number" || !Number.isFinite(r) || r <= 0 ? null : {
		symbol: e,
		price: r,
		volume: Number.isFinite(n.volume) && n.volume && n.volume > 0 ? n.volume : 1,
		timestamp: Zv(n.date) ?? Date.now(),
		source: "yahoo_finance_1m_public"
	};
}
function Zv(e) {
	if (e instanceof Date) return e.getTime();
	if (typeof e == "number") return e;
	if (typeof e == "string") {
		let t = Date.parse(e);
		return Number.isFinite(t) ? t : null;
	}
	return null;
}
//#endregion
//#region electron/ingest/dataIngestOrchestrator.ts
var Qv = 6e4, $v = 12, ey = 35, ty = class extends u {
	persistence;
	realtime;
	enabled;
	rss = new Bv({ intervalMs: Y("ATLASZ_RSS_POLL_MS", 3e4) });
	stocktwits = new Gv({ intervalMs: Y("ATLASZ_STOCKTWITS_POLL_MS", 6e4) });
	yahoo = new Yv({ intervalMs: Y("ATLASZ_YAHOO_POLL_MS", 6e4) });
	polymarket = new bp({ intervalMs: Y("ATLASZ_POLYMARKET_POLL_MS", 5 * 6e4) });
	cognitive = new pp();
	graphMutator = new Qf({
		halfLifeMs: Y("ATLASZ_GRAPH_EDGE_HALFLIFE_MS", 360 * 6e4),
		maxSilenceMs: Y("ATLASZ_GRAPH_EDGE_MAX_SILENCE_MS", 1440 * 6e4)
	});
	twitterExplore = new qv();
	statusState;
	narrativeInputTimestamps = [];
	cognitiveBatch = [];
	mediumVelocityThreshold = Y("ATLASZ_NARRATIVE_MEDIUM_VELOCITY", $v);
	highVelocityThreshold = Y("ATLASZ_NARRATIVE_HIGH_VELOCITY", ey);
	cognitiveMode = process.env.ATLASZ_ENABLE_OLLAMA === "1" ? "deep" : "disabled";
	cognitiveSkippedCount = 0;
	cognitiveBatchedCount = 0;
	decayTimer = null;
	batchTimer = null;
	running = !1;
	constructor(e) {
		super(), this.on("error", () => void 0), this.persistence = e.persistence, this.realtime = e.realtime, this.enabled = e.enabled ?? process.env.ATLASZ_ENABLE_PUBLIC_OSINT !== "0", this.statusState = {
			running: !1,
			enabled: this.enabled,
			rssHeadlineCount: 0,
			stocktwitsBatchCount: 0,
			yahooTickCount: 0,
			probabilityCount: 0,
			exposureEdgeCount: 0,
			narrativeVelocityPerMinute: 0,
			cognitiveMode: this.cognitiveMode,
			cognitiveQueueLength: 0,
			cognitiveValidationFailures: 0,
			cognitiveSkippedCount: 0,
			cognitiveBatchedCount: 0,
			cognitiveSourcePenaltyCount: 0
		}, this.bindServices();
	}
	on(e, t) {
		return super.on(e, t);
	}
	start() {
		this.running || !this.enabled || (this.running = !0, this.statusState.running = !0, this.statusState.startedAt = Date.now(), this.audit("connector_started", "info", "Public OSINT ingest orchestrator started", {
			rss: process.env.ATLASZ_ENABLE_RSS_RADAR !== "0",
			stocktwits: process.env.ATLASZ_ENABLE_STOCKTWITS !== "0",
			yahoo: process.env.ATLASZ_ENABLE_YAHOO_POLL !== "0",
			polymarket: process.env.ATLASZ_ENABLE_POLYMARKET !== "0",
			ollama: process.env.ATLASZ_ENABLE_OLLAMA === "1"
		}), process.env.ATLASZ_ENABLE_RSS_RADAR !== "0" && this.rss.start(), process.env.ATLASZ_ENABLE_STOCKTWITS !== "0" && this.stocktwits.start(), process.env.ATLASZ_ENABLE_YAHOO_POLL !== "0" && this.yahoo.start(), process.env.ATLASZ_ENABLE_POLYMARKET !== "0" && this.polymarket.start(), this.twitterExplore.extractTrendingKeywords().catch((e) => {
			this.handleError(e instanceof Error ? e : Error(String(e)), "x_explore_placeholder");
		}), this.decayTimer = setInterval(() => {
			let e = this.graphMutator.applyTemporalEdgeDecay();
			(e.decayed > 0 || e.purged > 0) && this.audit("graph_traversal_triggered", "info", "Adaptive graph edge decay pass completed", e);
		}, Y("ATLASZ_GRAPH_DECAY_MS", 5 * 6e4)), this.batchTimer = setInterval(() => this.flushCognitiveBatch("timer"), Y("ATLASZ_COGNITIVE_BATCH_MS", 15e3)));
	}
	stop() {
		this.running && (this.running = !1, this.statusState.running = !1, this.rss.stop(), this.stocktwits.stop(), this.yahoo.stop(), this.polymarket.stop(), this.cognitive.clear(), this.cognitiveBatch.length = 0, this.decayTimer &&= (clearInterval(this.decayTimer), null), this.batchTimer &&= (clearInterval(this.batchTimer), null));
	}
	status() {
		return this.updateAdaptiveStatus(), { ...this.statusState };
	}
	bindServices() {
		this.rss.on("headline", (e) => this.handleNewsEvent(e)), this.rss.on("error", (e) => this.handleError(e, "rss_public_radar")), this.stocktwits.on("pulse", (e) => this.handleSocialBatch(e)), this.stocktwits.on("error", (e) => this.handleError(e, "stocktwits_public_stream")), this.yahoo.on("ticks", (e) => {
			this.statusState.lastMarketPollAt = e.observedAt, this.statusState.yahooTickCount += e.ticks.length, this.realtime.ingestExternalBatch(e.ticks, []);
		}), this.yahoo.on("error", (e) => this.handleError(e, "yahoo_finance_1m_public")), this.polymarket.on("probability", (e) => this.handleProbability(e)), this.polymarket.on("error", (e) => this.handleError(e, "polymarket_gamma_public")), this.cognitive.on("extraction", (e, t, n) => {
			let r = this.graphMutator.upsertConnection(t);
			for (let e of this.graphMutator.neighbors(r.eventId)) this.saveEntityEdge({
				id: `cognitive:${e.source}:${e.target}`,
				source: e.source,
				target: e.target,
				relation: e.relation,
				confidence: e.weight,
				createdAt: e.createdAt
			});
			this.audit("graph_traversal_triggered", "info", "Ollama cognitive extraction updated adaptive graph", {
				eventId: r.eventId,
				eventTitle: e.title,
				newEdges: r.newEdges,
				reinforcedEdges: r.reinforcedEdges,
				routeMode: n.routeMode,
				durationMs: n.durationMs,
				timeoutMs: n.timeoutMs,
				sourcePenalty: n.sourcePenalty,
				validationIssueCount: n.validationIssueCount
			}), this.updateAdaptiveStatus();
		}), this.cognitive.on("error", (e) => this.handleError(e, "ollama_local_cognitive_layer"));
	}
	handleNewsEvent(e) {
		this.recordNarrativeInput(1, e.observedAt), this.statusState.lastNewsAt = e.observedAt, this.statusState.rssHeadlineCount += 1, this.saveHeadline(ny(e));
		let t = _p(e.rawText || e.title, e.id);
		this.persistExposureMatches(e, t), this.routeCognitiveEvent(e, t), this.emit("news", e), this.updateAdaptiveStatus();
	}
	handleProbability(e) {
		this.recordNarrativeInput(1, e.observedAt), this.statusState.lastProbabilityPollAt = e.observedAt, this.statusState.probabilityCount += 1;
		let t = {
			id: e.id,
			title: e.title,
			sourceName: "Polymarket Gamma public markets",
			sourceUrl: e.sourceUrl,
			sourceTrust: "public unauthenticated",
			publishedAt: e.observedAt,
			observedAt: e.observedAt,
			sector: "Macro probability",
			summary: `Public market-implied probability near ${(e.probability * 100).toFixed(1)}%.`,
			rawText: `${e.title} ${e.tags.join(" ")}`
		};
		this.saveHeadline(ny(t));
		let n = _p(t.rawText, t.id);
		this.persistExposureMatches(t, n), this.routeCognitiveEvent(t, n), this.emit("probability", e), this.updateAdaptiveStatus();
	}
	handleSocialBatch(e) {
		this.recordNarrativeInput(Math.max(1, e.newMessageCount), e.observedAt), this.statusState.lastSocialPollAt = e.observedAt, this.statusState.stocktwitsBatchCount += 1, this.realtime.ingestExternalBatch([], [e.attentionTick]), this.emit("social", e), this.updateAdaptiveStatus();
	}
	routeCognitiveEvent(e, t) {
		let n = this.currentCognitiveMode();
		if (this.cognitiveMode = n, n === "disabled") return;
		let r = t.reduce((e, t) => Math.max(e, t.confidence), 0) * this.cognitive.sourcePenalty(e.sourceName);
		if (n === "deep") {
			this.cognitive.enqueue(e, "deep");
			return;
		}
		if (n === "keyword-priority") {
			r >= .55 ? this.cognitive.enqueue(e, "keyword-priority") : this.cognitiveSkippedCount += 1;
			return;
		}
		r >= .66 ? (this.cognitiveBatch.push(e), this.cognitiveBatchedCount += 1, this.cognitiveBatch.length >= Y("ATLASZ_COGNITIVE_BATCH_SIZE", 5) && this.flushCognitiveBatch("full")) : this.cognitiveSkippedCount += 1;
	}
	flushCognitiveBatch(e) {
		if (this.cognitiveBatch.length === 0) return;
		let t = this.cognitiveBatch.splice(0, this.cognitiveBatch.length);
		this.cognitive.enqueueBatch(t), this.audit("graph_traversal_triggered", "info", "High-velocity narrative batch routed to cognitive parser", {
			reason: e,
			batchSize: t.length,
			narrativeVelocityPerMinute: this.narrativeVelocityPerMinute()
		}), this.updateAdaptiveStatus();
	}
	currentCognitiveMode() {
		if (process.env.ATLASZ_ENABLE_OLLAMA !== "1") return "disabled";
		let e = this.narrativeVelocityPerMinute();
		return e >= this.highVelocityThreshold ? "batch-summary" : e >= this.mediumVelocityThreshold ? "keyword-priority" : "deep";
	}
	recordNarrativeInput(e, t) {
		let n = Math.min(Math.max(Math.round(e), 1), 200);
		for (let e = 0; e < n; e += 1) this.narrativeInputTimestamps.push(t);
		this.pruneNarrativeWindow(t);
	}
	narrativeVelocityPerMinute(e = Date.now()) {
		return this.pruneNarrativeWindow(e), this.narrativeInputTimestamps.length;
	}
	pruneNarrativeWindow(e) {
		for (; this.narrativeInputTimestamps.length > 0 && e - this.narrativeInputTimestamps[0] > Qv;) this.narrativeInputTimestamps.shift();
	}
	updateAdaptiveStatus() {
		let e = this.cognitive.status();
		this.cognitiveMode = this.currentCognitiveMode(), this.statusState.narrativeVelocityPerMinute = this.narrativeVelocityPerMinute(), this.statusState.cognitiveMode = this.cognitiveMode, this.statusState.cognitiveQueueLength = e.queueLength, this.statusState.cognitiveAverageLatencyMs = e.rollingAverageLatencyMs, this.statusState.cognitiveTimeoutMs = e.timeoutMs, this.statusState.cognitiveValidationFailures = e.validationFailures, this.statusState.cognitiveSkippedCount = this.cognitiveSkippedCount, this.statusState.cognitiveBatchedCount = this.cognitiveBatchedCount, this.statusState.cognitiveSourcePenaltyCount = this.cognitive.sourcePenaltyCount();
	}
	persistExposureMatches(e, t) {
		let n = [], r = [];
		for (let i of t) {
			this.emit("exposure", e, i);
			for (let t of i.affectedTickers) {
				let a = dp(i.confidence, 0, 1);
				this.saveEntityEdge({
					id: `exposure:${e.id}:${t}:${up(i.keyword)}`,
					source: e.id,
					target: t,
					relation: i.reason,
					confidence: a,
					createdAt: e.observedAt
				}), n.push({
					target: t,
					pressure: Math.round(dp(45 + a * 45, 0, 100)),
					mentionVelocity: Number((1 + a * 4).toFixed(3)),
					sentimentDivergenceIndex: 0,
					timestamp: e.observedAt,
					source: "local_exposure_matrix"
				}), r.push({
					id: `signal:${e.id}:${t}:${up(i.keyword)}`,
					type: "narrative_acceleration",
					assetOrTopicId: t,
					severity: a >= .72 ? "high" : a >= .64 ? "elevated" : "watch",
					evidenceIds: [e.id],
					confidence: a >= .72 ? "ELEVATED" : "WATCH",
					createdAt: e.observedAt,
					explanation: `${t} linked to "${e.title}" via ${i.keyword}. ${i.reason}`,
					relatedGraphNodes: [e.id, t]
				});
			}
		}
		n.length > 0 && this.realtime.ingestExternalBatch([], n);
		for (let e of r) this.safePersist(() => this.persistence.saveSignalEvent(e)), this.audit("signal_generated", e.severity === "high" ? "watch" : "info", e.explanation, {
			signalId: e.id,
			assetOrTopicId: e.assetOrTopicId
		});
	}
	saveHeadline(e) {
		this.safePersist(() => this.persistence.saveHeadline(e));
	}
	saveEntityEdge(e) {
		this.statusState.exposureEdgeCount += 1, this.safePersist(() => this.persistence.saveEntityEdge(e));
	}
	handleError(e, t) {
		this.statusState.lastError = e.message, this.emit("error", e), this.audit("connector_failed", "watch", e.message, { connectorId: t });
	}
	audit(e, t, n, r) {
		this.safePersist(() => this.persistence.audit({
			id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
			eventType: e,
			connectorId: typeof r?.connectorId == "string" ? r.connectorId : "public_osint_orchestrator",
			severity: t,
			message: n,
			createdAt: Date.now(),
			metadata: r
		}));
	}
	safePersist(e) {
		try {
			e();
		} catch (e) {
			try {
				this.persistence.audit({
					id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
					eventType: "persistence_failed",
					connectorId: "public_osint_orchestrator",
					severity: "error",
					message: e instanceof Error ? e.message : String(e),
					createdAt: Date.now(),
					metadata: {}
				});
			} catch {}
		}
	}
};
function ny(e) {
	return {
		id: e.id,
		title: e.title,
		source: e.sourceName,
		url: e.sourceUrl,
		sector: e.sector,
		impact: `${e.summary} Trust: ${e.sourceTrust}.`,
		observedAt: e.publishedAt || e.observedAt
	};
}
function Y(e, t) {
	let n = Number(process.env[e]);
	return Number.isInteger(n) && n > 0 ? n : t;
}
//#endregion
//#region electron/providers/symbolDiscovery.ts
var ry = [
	"KAS",
	"KASUSDT",
	"KAS-USD",
	"KAS/USD",
	"KAS/USDT",
	"KAS-USDT"
], iy = "PRICE_UNAVAILABLE";
async function ay(e, t) {
	let n = await e("https://api.exchange.coinbase.com/products", { signal: t });
	if (!n.ok) throw Error(`Coinbase products HTTP ${n.status}`);
	let r = await n.json();
	return Array.isArray(r) ? r.map((e) => e && typeof e == "object" ? String(e.id ?? "") : "").filter((e) => e.length > 0) : [];
}
async function oy(e, t) {
	let n = await e("https://api.binance.com/api/v3/exchangeInfo", { signal: t });
	if (!n.ok) throw Error(`Binance exchangeInfo HTTP ${n.status}`);
	let r = await n.json();
	return Array.isArray(r.symbols) ? r.symbols.filter((e) => e.status === void 0 || e.status === "TRADING").map((e) => String(e.symbol ?? "")).filter((e) => e.length > 0) : [];
}
function sy(e, t, n) {
	let r = t.map((e) => e.toUpperCase()), i = [];
	for (let e of n) {
		let t = r.find((t) => e.symbols.has(t));
		t && i.push({
			providerId: e.providerId,
			providerSymbol: t,
			feedType: e.feedType,
			status: "available"
		});
	}
	return {
		assetSymbol: e,
		resolutions: i,
		status: i.length > 0 ? "available" : iy
	};
}
function cy(e) {
	return sy("KAS", ry, e);
}
function ly(e) {
	return new Set(e.map((e) => e.toUpperCase()));
}
//#endregion
//#region electron/providers/providerDiscoveryService.ts
var uy = "atlasz.provider-discovery-cache.json", dy = 2500, fy = class {
	userDataPath;
	persistence;
	fetchImpl;
	now;
	env;
	lastSnapshot = null;
	constructor(e) {
		this.userDataPath = e.userDataPath, this.persistence = e.persistence, this.fetchImpl = e.fetchImpl ?? yy, this.now = e.now ?? (() => Date.now()), this.env = e.env ?? process.env, this.lastSnapshot = this.readCache();
	}
	snapshot() {
		return this.lastSnapshot ?? by();
	}
	configPath() {
		return this.env.ATLASZ_PROVIDER_CONFIG || n(this.userDataPath, "atlasz.providers.json");
	}
	ensureConfigTemplate() {
		let e = this.configPath();
		return i(e) ? {
			path: e,
			created: !1
		} : (a(t(e), { recursive: !0 }), s(e, JSON.stringify({
			providers: [],
			note: "Add safe public RSS/custom-json/GDELT providers here. Atlasz will fail closed on unsupported/private endpoints."
		}, null, 2)), {
			path: e,
			created: !0
		});
	}
	async discover() {
		let e = Pn({ configPath: this.configPath() }), t = [], n = [], r = this.now();
		for (let i of e.providers) {
			let e = await this.discoverProvider(i, r);
			t.push(e), e.supportedSymbols.length > 0 && n.push({
				providerId: e.providerId,
				feedType: e.feedTypes.includes("WebSocket") ? "WebSocket" : "REST",
				symbols: ly(e.supportedSymbols)
			});
		}
		for (let e of await this.discoverLocalServices(r)) t.push(e);
		let i = cy(n), a = [...i.resolutions.map((e) => ({
			assetSymbol: i.assetSymbol,
			providerId: e.providerId,
			providerSymbol: e.providerSymbol,
			feedType: e.feedType,
			status: "available"
		}))];
		a.length === 0 && a.push({
			assetSymbol: "KAS",
			providerId: "unavailable",
			providerSymbol: "KAS",
			feedType: "REST",
			status: "PRICE_UNAVAILABLE"
		});
		let o = t.filter((e) => e.status === "available").length, s = t.length - o, c = {
			status: t.length === 0 ? "unavailable" : o > 0 && s > 0 ? "partial" : o > 0 ? "ready" : "failed",
			lastDiscoveryAt: r,
			cacheUpdatedAt: r,
			configPath: e.configPath,
			configErrors: e.errors,
			providers: t,
			assetAvailability: a,
			lastError: e.errors[0]
		};
		return this.lastSnapshot = c, this.writeCache(c), this.persist(c), c;
	}
	async discoverProvider(e, t) {
		let n = Vn(e.providerId), r = Cy([...e.envKey ? [e.envKey] : [], ...n.envKeysRequired]), i = r.filter((e) => !!this.env[e]), a = e.authType !== "none" || r.length > 0, o = [], s = new Set(e.supportedSymbols ?? []), c, l = In(e);
		if (e.adapter === "disabled") c = "auth-gated";
		else if (!e.enabled) c = "unsupported";
		else if (!Fn(e, this.env)) c = a ? "missing-config" : "unavailable";
		else try {
			let t = _y(e, this.env);
			if (t && (o.push(t), await this.checkEndpoint(t, e)), n.symbolDiscovery === "coinbase") {
				o.push("https://api.exchange.coinbase.com/products");
				for (let e of await ay(this.asFetchLike(), vy(dy))) s.add(e);
			}
			if (n.symbolDiscovery === "binance") {
				o.push("https://api.binance.com/api/v3/exchangeInfo");
				for (let e of await oy(this.asFetchLike(), vy(dy))) s.add(e);
			}
			if (e.providerId === "public_market_rest") for (let e of rt(this.env.ATLASZ_ENABLE_PUBLIC_WS === "1")) s.add(e.symbol), s.add(e.feedSymbol);
			if (e.providerId === "coingecko_public_rest") for (let e of rt(!1).filter((e) => e.source === "coingecko")) s.add(e.symbol), s.add(e.feedSymbol);
			c = "available", l = void 0;
		} catch (e) {
			c = xy(e) ? "rate-limited" : "unavailable", l = Sy(e);
		}
		return {
			providerId: e.providerId,
			providerName: e.providerName,
			category: e.category,
			adapterId: e.adapter,
			status: c,
			supportedAssets: [...s].filter((e) => /^[A-Z0-9/.-]{1,16}$/.test(e)).slice(0, 200),
			supportedSymbols: [...s].slice(0, 1e3),
			supportedRegions: n.supportedRegions ?? [],
			supportedEventTypes: n.supportedEventTypes ?? [],
			feedTypes: n.feedTypes,
			authRequired: a,
			envKeysRequired: r,
			envKeysPresent: i,
			endpointsChecked: Cy(o),
			lastDiscoveryAt: t,
			discoveryError: l,
			provenance: e.provenance,
			legalSafetyNote: e.legalSafetyNote,
			autoWired: e.enabled && c === "available"
		};
	}
	async discoverLocalServices(e) {
		let t = [];
		for (let n of Bn) {
			let r = n.endpointEnvKey ? this.env[n.endpointEnvKey] || n.defaultEndpoint : void 0, i = !n.enableEnvKey || this.env[n.enableEnvKey] === "1", a = i ? "available" : "missing-config", o, s = [];
			if (n.kind === "sqlite") a = this.persistence.mode === "unknown" ? "unavailable" : "available", o = this.persistence.mode === "unknown" ? "SQLite mode unknown" : void 0;
			else if (n.kind === "ollama") {
				if (!i) a = "missing-config", o = `Set ${n.enableEnvKey}=1 to enable local Ollama discovery.`;
				else if (r) {
					s.push(r);
					try {
						await this.checkEndpoint(`${r.replace(/\/$/, "")}/api/tags`), a = "available";
					} catch (e) {
						a = "unavailable", o = Sy(e);
					}
				}
			}
			t.push({
				providerId: n.id,
				providerName: n.name,
				category: n.kind,
				adapterId: n.kind,
				status: a,
				supportedAssets: [],
				supportedSymbols: [],
				supportedRegions: [],
				supportedEventTypes: [],
				feedTypes: n.kind === "sqlite" ? ["SQLite"] : ["local"],
				authRequired: !1,
				envKeysRequired: n.enableEnvKey ? [n.enableEnvKey] : [],
				envKeysPresent: n.enableEnvKey && this.env[n.enableEnvKey] ? [n.enableEnvKey] : [],
				endpointsChecked: s,
				lastDiscoveryAt: e,
				discoveryError: o,
				provenance: n.kind === "ollama" ? "local-model" : "local-derived",
				legalSafetyNote: n.note,
				autoWired: a === "available"
			});
		}
		return t;
	}
	asFetchLike() {
		return async (e, t) => this.fetchImpl(e, t);
	}
	async checkEndpoint(e, t) {
		let n = { accept: "application/json, application/xml, text/xml, */*" };
		t?.providerId === "sec_edgar_public" && this.env.ATLASZ_SEC_USER_AGENT && (n["user-agent"] = this.env.ATLASZ_SEC_USER_AGENT);
		let r = t?.providerId === "macro_calendar_fred" && this.env.ATLASZ_FRED_API_KEY ? py(e, "api_key", this.env.ATLASZ_FRED_API_KEY) : t?.providerId === "bea_public" && this.env.ATLASZ_BEA_API_KEY ? py(e, "UserID", this.env.ATLASZ_BEA_API_KEY) : t?.providerId === "eia_energy_public" && this.env.ATLASZ_EIA_API_KEY ? py(e, "api_key", this.env.ATLASZ_EIA_API_KEY) : e, i = await this.fetchImpl(r, {
			signal: vy(dy),
			headers: n
		});
		if (!i.ok) throw Error(`${e} HTTP ${i.status}`);
	}
	persist(e) {
		for (let t of e.providers) try {
			this.persistence.saveOsintSource(my(t)), this.persistence.audit({
				id: `audit-provider-${t.providerId}-${e.lastDiscoveryAt ?? this.now()}`,
				eventType: t.status === "available" ? "provider_discovered" : "provider_discovery_failed",
				connectorId: t.providerId,
				severity: t.status === "available" ? "info" : t.status === "missing-config" ? "watch" : "error",
				message: `${t.providerName}: ${t.status}`,
				createdAt: e.lastDiscoveryAt ?? this.now(),
				metadata: {
					status: t.status,
					feedTypes: t.feedTypes,
					supportedSymbols: t.supportedSymbols.slice(0, 20),
					endpointsChecked: t.endpointsChecked
				}
			});
		} catch {}
	}
	readCache() {
		let e = this.cachePath();
		if (!i(e)) return null;
		try {
			return JSON.parse(o(e, "utf8"));
		} catch {
			return null;
		}
	}
	writeCache(e) {
		let n = this.cachePath();
		try {
			a(t(n), { recursive: !0 }), s(n, JSON.stringify(e, null, 2));
		} catch {}
	}
	cachePath() {
		return n(this.userDataPath, uy);
	}
};
function py(e, t, n) {
	let r = new URL(e);
	return r.searchParams.set(t, n), r.toString();
}
function my(e) {
	return {
		sourceId: `provider:${e.providerId}`,
		sourceName: e.providerName,
		sourceType: e.category,
		endpointType: gy(e.feedTypes[0]),
		endpoint: e.endpointsChecked[0] ?? "local/provider registry",
		pollIntervalMs: 0,
		rateLimitMs: 0,
		timeoutMs: dy,
		enabled: e.autoWired,
		status: hy(e.status),
		provenance: e.provenance,
		lastSuccessAt: e.status === "available" ? e.lastDiscoveryAt : void 0,
		lastErrorAt: e.discoveryError ? e.lastDiscoveryAt : void 0,
		lastError: e.discoveryError,
		itemCount: e.supportedSymbols.length,
		sourceReliabilityScore: e.status === "available" ? 1 : e.status === "missing-config" || e.status === "auth-gated" ? .35 : .15,
		legalSafetyNote: e.legalSafetyNote,
		parserAdapter: e.adapterId
	};
}
function hy(e) {
	return e === "available" ? "online" : e === "rate-limited" ? "rate-limited" : e === "missing-config" || e === "auth-gated" || e === "unsupported" ? "disabled" : "failed";
}
function gy(e) {
	return e === "RSS" ? "rss" : e === "WebSocket" ? "websocket" : e === "local" || e === "SQLite" ? "local" : "rest";
}
function _y(e, t) {
	return e.providerId === "gdelt_doc_public" ? "https://api.gdeltproject.org/api/v2/doc/doc?query=markets&mode=ArtList&format=json&maxrecords=1" : e.providerId === "macro_calendar_fred" ? `${(t.ATLASZ_FRED_BASE_URL || "https://api.stlouisfed.org/fred").replace(/\/$/, "")}/series?series_id=CPIAUCSL&file_type=json` : e.providerId === "treasury_fiscal_public" ? "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1&fields=record_date,tot_pub_debt_out_amt" : e.providerId === "eia_energy_public" ? `${(t.ATLASZ_EIA_API_BASE || "https://api.eia.gov/v2").replace(/\/$/, "")}/seriesid/PET.RWTC.D?length=1` : e.providerId === "public_market_rest" || e.providerId === "yahoo_finance_1m_public" ? "https://query1.finance.yahoo.com/v8/finance/chart/SPY?range=1d&interval=1m" : e.providerId === "coingecko_public_rest" ? "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd" : e.providerId === "stocktwits_public_stream" ? "https://api.stocktwits.com/api/2/streams/symbol/SPY.json" : e.providerId === "polymarket_gamma_public" ? "https://gamma-api.polymarket.com/markets?limit=1" : e.endpoint && /^https?:\/\//i.test(e.endpoint) && !e.endpoint.includes(" ") ? e.endpoint : null;
}
function vy(e) {
	let t = new AbortController();
	return setTimeout(() => t.abort(), e).unref?.(), t.signal;
}
async function yy(e, t) {
	return fetch(e, {
		...t,
		headers: {
			"user-agent": "AtlaszIntel/0.4 (local-first world-intel; +https://github.com/gryszzz/Atlasz-Intel)",
			...t?.headers ?? {}
		}
	});
}
function by() {
	return {
		status: "unavailable",
		configErrors: [],
		providers: [],
		assetAvailability: [],
		lastError: "Provider discovery has not run yet."
	};
}
function xy(e) {
	return /429|rate/i.test(Sy(e));
}
function Sy(e) {
	return e instanceof Error ? e.message : String(e);
}
function Cy(e) {
	return [...new Set(e.filter(Boolean))];
}
//#endregion
//#region electron/main.ts
var { app: X, BrowserWindow: wy, ipcMain: Z, shell: Ty } = e(import.meta.url)("electron"), Ey = t(r(import.meta.url)), Dy = null, Oy = null, ky = null, Ay = null, jy = null, My = null, Ny = null, Py = null;
function Q() {
	return Dy ||= ee(X.getPath("userData")), Dy;
}
function $() {
	return Oy ||= new Rt({ persistence: Q() }), Oy;
}
function Fy() {
	return ky ||= new kd(Q()), ky;
}
function Iy() {
	return Ay ||= new bf(Q()), Ay;
}
function Ly() {
	return jy ||= new Ff(Q()), jy;
}
function Ry() {
	return My ||= new Vf(Q()), My;
}
function zy() {
	return Ny ||= new ty({
		persistence: Q(),
		realtime: $()
	}), Ny;
}
function By() {
	return Py ||= new fy({
		userDataPath: X.getPath("userData"),
		persistence: Q()
	}), Py;
}
function Vy() {
	let e = new wy({
		title: "Atlasz Intel",
		width: 1480,
		height: 980,
		minWidth: 1180,
		minHeight: 760,
		backgroundColor: "#050607",
		titleBarStyle: "hiddenInset",
		trafficLightPosition: {
			x: 16,
			y: 16
		},
		webPreferences: {
			preload: n(Ey, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	});
	e.webContents.setWindowOpenHandler(({ url: e }) => (Ty.openExternal(e), { action: "deny" })), process.env.VITE_DEV_SERVER_URL ? e.loadURL(process.env.VITE_DEV_SERVER_URL) : e.loadFile(n(Ey, "../dist/index.html"));
}
Z.handle("atlasz:app-meta", () => ({
	name: X.getName(),
	version: X.getVersion(),
	platform: process.platform,
	dataPath: X.getPath("userData")
})), Z.handle("atlasz:open-external", async (e, t) => {
	await Ty.openExternal(t);
}), Z.handle("atlasz:db:status", () => ({ mode: Q().mode })), Z.handle("atlasz:db:briefs:list", () => Q().listBriefs()), Z.handle("atlasz:db:briefs:save", (e, t) => (Q().saveBrief(t), { ok: !0 })), Z.handle("atlasz:db:headlines:list", (e, t) => Q().listHeadlines(t)), Z.handle("atlasz:db:headlines:save", (e, t) => (Q().saveHeadline(t), { ok: !0 })), Z.handle("atlasz:db:decisions:list", () => Q().listDecisions()), Z.handle("atlasz:db:decisions:get", (e, t) => Q().getDecision(t)), Z.handle("atlasz:db:decisions:save", (e, t) => (Q().saveDecision(t), { ok: !0 })), Z.handle("atlasz:db:decisions:delete", (e, t) => (Q().deleteDecision(t), { ok: !0 })), Z.handle("atlasz:db:decisions:due", (e, t) => Q().decisionsDueForReview(t)), Z.handle("atlasz:realtime:start", () => $().start()), Z.handle("atlasz:realtime:stop", () => $().stop()), Z.handle("atlasz:realtime:restart", (e, t) => $().restart(t)), Z.handle("atlasz:realtime:add-asset", (e, t) => $().addAsset(t)), Z.handle("atlasz:realtime:snapshot", () => $().snapshot()), Z.handle("atlasz:realtime:status", () => $().status()), Z.handle("atlasz:realtime:health", () => $().health()), Z.handle("atlasz:realtime:traverse-risk", (e, t) => $().traverseRisk(t)), Z.handle("atlasz:realtime:replay:start", (e, t) => $().replayStart(t)), Z.handle("atlasz:realtime:replay:pause", () => $().replayPause()), Z.handle("atlasz:realtime:replay:resume", () => $().replayResume()), Z.handle("atlasz:realtime:replay:stop", () => $().replayStop()), Z.handle("atlasz:realtime:replay:speed", (e, t) => $().replaySetSpeed(t)), Z.handle("atlasz:realtime:replay:seek", (e, t) => $().replaySeek(t)), Z.handle("atlasz:world:snapshot", () => Fy().snapshot()), Z.handle("atlasz:world:refresh", () => Fy().refresh()), Z.handle("atlasz:world:favorite", (e, t, n, r) => Fy().toggleFavorite(t, n, r)), Z.handle("atlasz:quant:snapshot", () => Iy().snapshot()), Z.handle("atlasz:intel:playbook", (e, t) => Ly().playbookFor(t)), Z.handle("atlasz:thesis:save", (e, t) => Ry().save(t)), Z.handle("atlasz:thesis:dashboard", () => Ry().dashboard()), Z.handle("atlasz:ingest:status", () => zy().status()), Z.handle("atlasz:providers:snapshot", () => By().snapshot()), Z.handle("atlasz:providers:discover", () => By().discover()), Z.handle("atlasz:providers:open-config", () => {
	let e = By().ensureConfigTemplate();
	return Ty.showItemInFolder(e.path), e;
}), X.whenReady().then(() => {
	Q();
	try {
		$().start();
	} catch (e) {
		console.error("[atlasz] realtime start failed at launch:", e);
	}
	Fy().refresh(), By().discover(), zy().start(), Vy(), X.on("activate", () => {
		wy.getAllWindows().length === 0 && Vy();
	});
}), X.on("window-all-closed", () => {
	process.platform !== "darwin" && X.quit();
}), X.on("before-quit", () => {
	Ny?.stop(), Ny = null, Oy?.close(), Oy = null, ky = null, Py = null, Dy?.close(), Dy = null;
});
//#endregion
export { S as i, _ as n, y as r, v as t };
