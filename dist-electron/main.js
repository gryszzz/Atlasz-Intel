import { createRequire as e } from "node:module";
import t from "electron";
import { dirname as n, join as r } from "node:path";
import { fileURLToPath as i } from "node:url";
import { existsSync as a, mkdirSync as o, readFileSync as s, writeFileSync as c } from "node:fs";
import { Worker as l } from "node:worker_threads";
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
}) : n, e)), S = (e) => g.call(e, "module.exports") ? e["module.exports"] : b(f({}, "__esModule", { value: !0 }), e), C = /* @__PURE__ */ e(import.meta.url), w = "\nCREATE TABLE IF NOT EXISTS daily_briefs (\n  id TEXT PRIMARY KEY,\n  date TEXT NOT NULL,\n  headline TEXT NOT NULL,\n  body TEXT NOT NULL,\n  severity TEXT NOT NULL,\n  confidence INTEGER NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS world_headlines (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  source TEXT NOT NULL,\n  url TEXT NOT NULL,\n  sector TEXT NOT NULL,\n  impact TEXT NOT NULL,\n  observed_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS decision_journal (\n  id TEXT PRIMARY KEY,\n  created_at INTEGER NOT NULL,\n  updated_at INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  thesis TEXT NOT NULL,\n  direction TEXT NOT NULL,\n  tickers TEXT NOT NULL,\n  conviction INTEGER NOT NULL,\n  emotional_state TEXT NOT NULL,\n  evidence_ids TEXT NOT NULL,\n  context TEXT NOT NULL,\n  review_date INTEGER NOT NULL,\n  status TEXT NOT NULL,\n  post_mortem TEXT NOT NULL,\n  outcome TEXT\n);\nCREATE TABLE IF NOT EXISTS market_ticks_daily (\n  id TEXT PRIMARY KEY,\n  symbol TEXT NOT NULL,\n  price REAL NOT NULL,\n  volume REAL NOT NULL,\n  source TEXT NOT NULL,\n  observed_at INTEGER NOT NULL,\n  trade_date TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS social_attention_batches (\n  id TEXT PRIMARY KEY,\n  target TEXT NOT NULL,\n  pressure REAL NOT NULL,\n  mention_velocity REAL NOT NULL,\n  sentiment_divergence_index REAL NOT NULL,\n  source TEXT NOT NULL,\n  observed_at INTEGER NOT NULL,\n  sample_count INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS entity_edges (\n  id TEXT PRIMARY KEY,\n  source TEXT NOT NULL,\n  target TEXT NOT NULL,\n  relation TEXT NOT NULL,\n  confidence REAL NOT NULL,\n  created_at INTEGER NOT NULL\n);\nCREATE TABLE IF NOT EXISTS signal_events (\n  id TEXT PRIMARY KEY,\n  type TEXT NOT NULL,\n  asset_or_topic_id TEXT NOT NULL,\n  severity TEXT NOT NULL,\n  evidence_ids TEXT NOT NULL,\n  confidence TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  explanation TEXT NOT NULL,\n  related_graph_nodes TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS source_audit_log (\n  id TEXT PRIMARY KEY,\n  event_type TEXT NOT NULL,\n  connector_id TEXT,\n  severity TEXT NOT NULL,\n  message TEXT NOT NULL,\n  created_at INTEGER NOT NULL,\n  metadata TEXT NOT NULL\n);\nCREATE TABLE IF NOT EXISTS realtime_frames (\n  id TEXT PRIMARY KEY,\n  sequence INTEGER NOT NULL,\n  emitted_at INTEGER NOT NULL,\n  frame_json TEXT NOT NULL\n);\nCREATE INDEX IF NOT EXISTS idx_decision_review ON decision_journal(status, review_date);\nCREATE INDEX IF NOT EXISTS idx_headline_observed ON world_headlines(observed_at);\nCREATE INDEX IF NOT EXISTS idx_market_ticks_symbol_time ON market_ticks_daily(symbol, observed_at);\nCREATE INDEX IF NOT EXISTS idx_attention_target_time ON social_attention_batches(target, observed_at);\nCREATE INDEX IF NOT EXISTS idx_signal_created ON signal_events(created_at);\nCREATE INDEX IF NOT EXISTS idx_audit_created ON source_audit_log(created_at);\nCREATE INDEX IF NOT EXISTS idx_realtime_frames_window ON realtime_frames(emitted_at);\n";
function ee(t) {
	a(t) || o(t, { recursive: !0 });
	let n = r(t, "atlasz-intel.db"), i = e(import.meta.url);
	try {
		let { DatabaseSync: e } = i("node:sqlite"), t = new e(n);
		return T(t), new te(t, "node:sqlite");
	} catch (e) {
		console.warn("[atlasz] node:sqlite unavailable, trying better-sqlite3. Reason:", e instanceof Error ? e.message : e);
	}
	try {
		let e = new (i("better-sqlite3"))(n);
		return T(e), new te(e, "better-sqlite3");
	} catch (e) {
		return console.warn("[atlasz] SQLite unavailable, using JSON fallback store. Reason:", e instanceof Error ? e.message : e), new O(t);
	}
}
function T(e) {
	e.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    ${w}
  `);
}
var te = class {
	mode;
	db;
	constructor(e, t) {
		this.db = e, this.mode = t;
	}
	listBriefs() {
		return this.db.prepare("SELECT * FROM daily_briefs ORDER BY created_at DESC").all().map(E);
	}
	saveBrief(e) {
		this.db.prepare("INSERT INTO daily_briefs (id, date, headline, body, severity, confidence, created_at)\n         VALUES (@id, @date, @headline, @body, @severity, @confidence, @createdAt)\n         ON CONFLICT(id) DO UPDATE SET\n           date=excluded.date, headline=excluded.headline, body=excluded.body,\n           severity=excluded.severity, confidence=excluded.confidence").run(e);
	}
	listHeadlines(e = 200) {
		return this.db.prepare("SELECT * FROM world_headlines ORDER BY observed_at DESC LIMIT ?").all(e).map(ne);
	}
	saveHeadline(e) {
		this.db.prepare("INSERT INTO world_headlines (id, title, source, url, sector, impact, observed_at)\n         VALUES (@id, @title, @source, @url, @sector, @impact, @observedAt)\n         ON CONFLICT(id) DO UPDATE SET\n           title=excluded.title, source=excluded.source, url=excluded.url,\n           sector=excluded.sector, impact=excluded.impact, observed_at=excluded.observed_at").run(e);
	}
	listDecisions() {
		return this.db.prepare("SELECT * FROM decision_journal ORDER BY updated_at DESC").all().map(re);
	}
	getDecision(e) {
		let t = this.db.prepare("SELECT * FROM decision_journal WHERE id = ?").get(e);
		return t ? re(t) : null;
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
		return this.db.prepare("SELECT * FROM decision_journal WHERE status = 'open' AND review_date <= ? ORDER BY review_date ASC").all(e).map(re);
	}
	saveMarketTick(e) {
		this.db.prepare("INSERT INTO market_ticks_daily (id, symbol, price, volume, source, observed_at, trade_date)\n         VALUES (@id, @symbol, @price, @volume, @source, @observedAt, @tradeDate)\n         ON CONFLICT(id) DO UPDATE SET\n           price=excluded.price, volume=excluded.volume, source=excluded.source,\n           observed_at=excluded.observed_at, trade_date=excluded.trade_date").run(e);
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
	saveRealtimeFrame(e) {
		this.db.prepare("INSERT INTO realtime_frames (id, sequence, emitted_at, frame_json)\n         VALUES (@id, @sequence, @emittedAt, @frameJson)\n         ON CONFLICT(id) DO UPDATE SET\n           sequence=excluded.sequence, emitted_at=excluded.emitted_at, frame_json=excluded.frame_json").run({
			id: e.id,
			sequence: e.sequence,
			emittedAt: e.emittedAt,
			frameJson: JSON.stringify(e.frame)
		});
	}
	listRealtimeFrames(e, t, n = 2e3) {
		return this.db.prepare("SELECT * FROM realtime_frames WHERE emitted_at BETWEEN ? AND ? ORDER BY emitted_at ASC LIMIT ?").all(e, t, n).map(ie);
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
function E(e) {
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
function ne(e) {
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
function re(e) {
	return {
		id: String(e.id),
		createdAt: Number(e.created_at),
		updatedAt: Number(e.updated_at),
		title: String(e.title),
		thesis: String(e.thesis),
		direction: String(e.direction),
		tickers: D(e.tickers),
		conviction: Number(e.conviction),
		emotionalState: String(e.emotional_state),
		evidenceIds: D(e.evidence_ids),
		context: String(e.context),
		reviewDate: Number(e.review_date),
		status: String(e.status),
		postMortem: String(e.post_mortem),
		outcome: e.outcome === null || e.outcome === void 0 ? null : String(e.outcome)
	};
}
function ie(e) {
	return {
		id: String(e.id),
		sequence: Number(e.sequence),
		emittedAt: Number(e.emitted_at),
		frame: ae(e.frame_json)
	};
}
function ae(e) {
	if (typeof e != "string") throw Error("Invalid realtime frame payload");
	return JSON.parse(e);
}
function D(e) {
	if (typeof e != "string") return [];
	try {
		let t = JSON.parse(e);
		return Array.isArray(t) ? t.map((e) => String(e)) : [];
	} catch {
		return [];
	}
}
var O = class {
	mode = "json-fallback";
	file;
	data;
	constructor(e) {
		this.file = r(e, "atlasz-intel.fallback.json"), this.data = this.read();
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
		this.data.marketTicks = j(k(this.data.marketTicks, e), "observedAt", 25e3), this.flush();
	}
	saveAttentionBatch(e) {
		this.data.attentionBatches = j(k(this.data.attentionBatches, e), "observedAt", 25e3), this.flush();
	}
	saveEntityEdge(e) {
		this.data.entityEdges = k(this.data.entityEdges, e), this.flush();
	}
	saveSignalEvent(e) {
		this.data.signalEvents = j(k(this.data.signalEvents, e), "createdAt", 1e4), this.flush();
	}
	saveRealtimeFrame(e) {
		this.data.realtimeFrames = j(k(this.data.realtimeFrames, e), "emittedAt", 1e4), this.flush();
	}
	listRealtimeFrames(e, t, n = 2e3) {
		return [...this.data.realtimeFrames].filter((n) => n.emittedAt >= e && n.emittedAt <= t).sort((e, t) => e.emittedAt - t.emittedAt).slice(0, n);
	}
	audit(e) {
		this.data.auditLog = j([...this.data.auditLog, e], "createdAt", 1e4), this.flush();
	}
	close() {
		this.flush();
	}
	read() {
		if (!a(this.file)) return A();
		try {
			let e = JSON.parse(s(this.file, "utf8"));
			return {
				briefs: e.briefs ?? [],
				headlines: e.headlines ?? [],
				decisions: e.decisions ?? [],
				marketTicks: e.marketTicks ?? [],
				attentionBatches: e.attentionBatches ?? [],
				entityEdges: e.entityEdges ?? [],
				signalEvents: e.signalEvents ?? [],
				realtimeFrames: e.realtimeFrames ?? [],
				auditLog: e.auditLog ?? []
			};
		} catch {
			return A();
		}
	}
	flush() {
		c(this.file, JSON.stringify(this.data), "utf8");
	}
};
function k(e, t) {
	let n = e.findIndex((e) => e.id === t.id);
	if (n === -1) return [...e, t];
	let r = [...e];
	return r[n] = t, r;
}
function A() {
	return {
		briefs: [],
		headlines: [],
		decisions: [],
		marketTicks: [],
		attentionBatches: [],
		entityEdges: [],
		signalEvents: [],
		realtimeFrames: [],
		auditLog: []
	};
}
function j(e, t, n) {
	return e.length <= n ? e : [...e].sort((e, n) => Number(n[t]) - Number(e[t])).slice(0, n).sort((e, n) => Number(e[t]) - Number(n[t]));
}
//#endregion
//#region src/data/intel.ts
var M = {
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
}, oe = [
	{
		id: "raw-red-sea-1",
		connector: "mock-shipping-wire",
		sourceName: M.redSeaWire.sourceName,
		sourceUrl: M.redSeaWire.sourceUrl,
		rawTitle: M.redSeaWire.title,
		rawExcerpt: "Route-risk references detected: Red Sea, insurance premium, crude, freight, airline margins.",
		ingestedAt: M.redSeaWire.observedAt,
		publishedAt: M.redSeaWire.publishedAt,
		normalizedEventId: "red-sea"
	},
	{
		id: "raw-red-sea-2",
		connector: "mock-market-tape",
		sourceName: M.oilTape.sourceName,
		sourceUrl: M.oilTape.sourceUrl,
		rawTitle: M.oilTape.title,
		rawExcerpt: "WTI, XLE, GLD, and airline basket used as market-linking confirmation.",
		ingestedAt: M.oilTape.observedAt,
		publishedAt: M.oilTape.publishedAt,
		normalizedEventId: "red-sea"
	},
	{
		id: "raw-taiwan-1",
		connector: "mock-gdelt",
		sourceName: M.taiwanWire.sourceName,
		sourceUrl: M.taiwanWire.sourceUrl,
		rawTitle: M.taiwanWire.title,
		rawExcerpt: "Entities detected: Taiwan, TSMC, advanced chips, Nvidia, Apple suppliers, Nasdaq.",
		ingestedAt: M.taiwanWire.observedAt,
		publishedAt: M.taiwanWire.publishedAt,
		normalizedEventId: "taiwan"
	},
	{
		id: "raw-rare-earths-1",
		connector: "mock-policy-calendar",
		sourceName: M.rareEarthsPolicy.sourceName,
		sourceUrl: M.rareEarthsPolicy.sourceUrl,
		rawTitle: M.rareEarthsPolicy.title,
		rawExcerpt: "Policy references include China, rare earths, EV magnets, defense electronics, and strategic inputs.",
		ingestedAt: M.rareEarthsPolicy.observedAt,
		publishedAt: M.rareEarthsPolicy.publishedAt,
		normalizedEventId: "rare-earths"
	},
	{
		id: "raw-fed-1",
		connector: "mock-policy-calendar",
		sourceName: M.fedCalendar.sourceName,
		sourceUrl: M.fedCalendar.sourceUrl,
		rawTitle: M.fedCalendar.title,
		rawExcerpt: "Macro sensitivity extraction links real yields, gold, Nasdaq, Bitcoin, TLT, and dollar pressure.",
		ingestedAt: M.fedCalendar.observedAt,
		publishedAt: M.fedCalendar.publishedAt,
		normalizedEventId: "central-bank"
	},
	{
		id: "raw-europe-gas-1",
		connector: "mock-gdelt",
		sourceName: M.europeGas.sourceName,
		sourceUrl: M.europeGas.sourceUrl,
		rawTitle: M.europeGas.title,
		rawExcerpt: "European storage buffer reduces immediate risk, but industrial margin exposure remains mapped.",
		ingestedAt: M.europeGas.observedAt,
		publishedAt: M.europeGas.publishedAt,
		normalizedEventId: "europe-energy"
	}
];
`${oe.length}`;
var se = [
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
], ce = [
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
], N = [
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
			M.redSeaWire,
			M.freightTape,
			M.oilTape
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
		sourceTrail: [M.taiwanWire, M.chipPolicy]
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
		sourceTrail: [M.rareEarthsPolicy, M.evSupplyChain]
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
		sourceTrail: [M.fedCalendar, M.cryptoFlows]
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
		sourceTrail: [M.europeGas]
	}
], le = Object.fromEntries(N.map((e) => [e.id, e])), P = (e) => Array.from(new Map(e.flatMap((e) => le[e]?.sourceTrail ?? []).map((e) => [e.id, e])).values()), F = (e) => e.flatMap((e) => le[e]?.evidenceNotes ?? []), I = [
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
		evidenceTrail: F(["red-sea", "central-bank"]),
		sourceTrail: P(["red-sea", "central-bank"])
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
		evidenceTrail: F(["taiwan", "rare-earths"]),
		sourceTrail: P(["taiwan", "rare-earths"])
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
		evidenceTrail: F(["rare-earths"]),
		sourceTrail: P(["rare-earths"])
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
		evidenceTrail: F(["central-bank"]),
		sourceTrail: P(["central-bank"])
	}
], ue = {
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
		sourceTrail: P(["red-sea", "central-bank"]),
		evidenceTrail: F(["red-sea", "central-bank"])
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
		sourceTrail: P(["taiwan"]),
		evidenceTrail: F(["taiwan"])
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
		sourceTrail: P(["red-sea", "central-bank"]),
		evidenceTrail: F(["red-sea", "central-bank"])
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
		sourceTrail: P(["red-sea"]),
		evidenceTrail: F(["red-sea"])
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
		sourceTrail: P(["central-bank"]),
		evidenceTrail: F(["central-bank"])
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
		sourceTrail: P(["taiwan", "central-bank"]),
		evidenceTrail: F(["taiwan", "central-bank"])
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
		sourceTrail: P(["red-sea"]),
		evidenceTrail: F(["red-sea"])
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
		sourceTrail: P(["taiwan"]),
		evidenceTrail: F(["taiwan"])
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
		sourceTrail: P(["taiwan", "rare-earths"]),
		evidenceTrail: F(["taiwan", "rare-earths"])
	}
}, de = [
	{
		id: "red-sea",
		label: "Red Sea",
		kind: "Trade route",
		position: {
			x: 0,
			y: 80
		},
		tone: "elevated"
	},
	{
		id: "shipping",
		label: "Shipping Risk",
		kind: "Risk",
		position: {
			x: 190,
			y: 80
		},
		tone: "elevated"
	},
	{
		id: "oil",
		label: "Oil",
		kind: "Commodity",
		position: {
			x: 390,
			y: 20
		},
		tone: "elevated"
	},
	{
		id: "xle",
		label: "XLE",
		kind: "ETF",
		position: {
			x: 590,
			y: 20
		},
		tone: "elevated"
	},
	{
		id: "inflation",
		label: "Inflation Risk",
		kind: "Macro",
		position: {
			x: 590,
			y: 145
		},
		tone: "watch"
	},
	{
		id: "gold",
		label: "Gold",
		kind: "Commodity",
		position: {
			x: 790,
			y: 145
		},
		tone: "watch"
	},
	{
		id: "taiwan",
		label: "Taiwan",
		kind: "Country",
		position: {
			x: 20,
			y: 340
		},
		tone: "critical"
	},
	{
		id: "tsmc",
		label: "TSMC",
		kind: "Company",
		position: {
			x: 220,
			y: 330
		},
		tone: "critical"
	},
	{
		id: "semis",
		label: "Semiconductors",
		kind: "Sector",
		position: {
			x: 430,
			y: 330
		},
		tone: "critical"
	},
	{
		id: "nvda",
		label: "Nvidia",
		kind: "Company",
		position: {
			x: 650,
			y: 290
		},
		tone: "watch"
	},
	{
		id: "qqq",
		label: "QQQ",
		kind: "ETF",
		position: {
			x: 850,
			y: 330
		},
		tone: "watch"
	},
	{
		id: "china",
		label: "China",
		kind: "Country",
		position: {
			x: 30,
			y: 560
		},
		tone: "elevated"
	},
	{
		id: "rare-earths",
		label: "Rare Earths",
		kind: "Commodity",
		position: {
			x: 250,
			y: 560
		},
		tone: "elevated"
	},
	{
		id: "ev",
		label: "EV Supply Chain",
		kind: "Sector",
		position: {
			x: 500,
			y: 560
		},
		tone: "watch"
	},
	{
		id: "tesla",
		label: "Tesla",
		kind: "Company",
		position: {
			x: 740,
			y: 560
		},
		tone: "watch"
	}
], fe = [
	{
		id: "e1",
		source: "red-sea",
		target: "shipping",
		label: "disrupts",
		strength: 83
	},
	{
		id: "e2",
		source: "shipping",
		target: "oil",
		label: "adds premium",
		strength: 78
	},
	{
		id: "e3",
		source: "oil",
		target: "xle",
		label: "supports",
		strength: 74
	},
	{
		id: "e4",
		source: "oil",
		target: "inflation",
		label: "pressures",
		strength: 71
	},
	{
		id: "e5",
		source: "inflation",
		target: "gold",
		label: "hedge bid",
		strength: 63
	},
	{
		id: "e6",
		source: "taiwan",
		target: "tsmc",
		label: "concentration",
		strength: 91
	},
	{
		id: "e7",
		source: "tsmc",
		target: "semis",
		label: "advanced nodes",
		strength: 87
	},
	{
		id: "e8",
		source: "semis",
		target: "nvda",
		label: "supply chain",
		strength: 79
	},
	{
		id: "e9",
		source: "semis",
		target: "qqq",
		label: "index beta",
		strength: 76
	},
	{
		id: "e10",
		source: "china",
		target: "rare-earths",
		label: "processing leverage",
		strength: 86
	},
	{
		id: "e11",
		source: "rare-earths",
		target: "ev",
		label: "inputs",
		strength: 80
	},
	{
		id: "e12",
		source: "ev",
		target: "tesla",
		label: "margin exposure",
		strength: 70
	},
	{
		id: "e13",
		source: "tesla",
		target: "qqq",
		label: "mega-cap beta",
		strength: 58
	}
], pe = [
	{
		id: "brief-changed",
		headline: "Energy and geopolitical risk are now the dominant cross-asset cluster",
		whyItMatters: "The same evidence trail links Red Sea route risk, crude, XLE, gold, airline margins, and inflation-sensitive markets.",
		severity: "elevated",
		relatedEntities: [
			"Red Sea",
			"Shipping Risk",
			"WTI Crude",
			"Gold",
			"Airlines"
		],
		relatedMarkets: [
			"CL",
			"XLE",
			"GLD",
			"DAL",
			"UAL"
		],
		confidence: 76,
		sourceCount: 4,
		uncertainty: "The cluster is event-driven and lacks direct supply quantity data.",
		watchNext: [
			"Freight insurance language",
			"Crude breadth",
			"Airline underperformance",
			"Gold confirmation"
		],
		sourceTrail: I[0].sourceTrail,
		evidenceTrail: I[0].evidenceTrail
	},
	{
		id: "brief-move",
		headline: "Crude is the cleanest market move, with energy breadth confirming",
		whyItMatters: "The move is connected to shipping-risk sources and confirmed by XLE strength while airline exposure weakens.",
		severity: "elevated",
		relatedEntities: [
			"WTI Crude",
			"XLE",
			"Inflation Risk",
			"Airline Margins"
		],
		relatedMarkets: [
			"CL",
			"XLE",
			"GLD",
			"DAL"
		],
		confidence: 78,
		sourceCount: 3,
		uncertainty: "A headline premium can reverse quickly if route-risk evidence cools.",
		watchNext: [
			"WTI holds above intraday base",
			"XLE breadth",
			"DAL/UAL reaction"
		],
		sourceTrail: ue.CL.sourceTrail,
		evidenceTrail: ue.CL.evidenceTrail
	},
	{
		id: "brief-taiwan",
		headline: "Taiwan risk remains the highest-impact entity chain",
		whyItMatters: "The graph maps Taiwan to TSMC, semiconductors, Nvidia, Apple, SOXX, and QQQ, making the exposure index-level.",
		severity: "critical",
		relatedEntities: [
			"Taiwan",
			"TSMC",
			"Semiconductors",
			"Nvidia",
			"Apple"
		],
		relatedMarkets: [
			"TSM",
			"SOXX",
			"NVDA",
			"AAPL",
			"QQQ"
		],
		confidence: 72,
		sourceCount: 4,
		uncertainty: "The evidence shows exposure and policy context, not a confirmed supply interruption.",
		watchNext: [
			"SOXX relative weakness",
			"TSM gap risk",
			"Export-control language",
			"QQQ breadth"
		],
		sourceTrail: I[1].sourceTrail,
		evidenceTrail: I[1].evidenceTrail
	},
	{
		id: "brief-policy",
		headline: "Industrial policy risk is clustering around chips and rare earths",
		whyItMatters: "Chip controls and rare earth restriction chatter create linked supply-chain pressure across semis, EVs, autos, and defense electronics.",
		severity: "watch",
		relatedEntities: [
			"China",
			"Rare Earths",
			"Export Controls",
			"EV Supply Chain",
			"Defense Electronics"
		],
		relatedMarkets: [
			"SOXX",
			"NVDA",
			"TSLA",
			"LIT",
			"XAR"
		],
		confidence: 66,
		sourceCount: 4,
		uncertainty: "Policy chatter is not the same as final rule text.",
		watchNext: [
			"Formal policy language",
			"Supplier commentary",
			"Strategic inventory data"
		],
		sourceTrail: P(["taiwan", "rare-earths"]),
		evidenceTrail: F(["taiwan", "rare-earths"])
	},
	{
		id: "brief-watch",
		headline: "Watch whether event risk becomes macro pressure",
		whyItMatters: "The key next question is whether oil and policy-risk signals spill into inflation expectations, real yields, gold, QQQ, and crypto liquidity sensitivity.",
		severity: "watch",
		relatedEntities: [
			"Inflation Risk",
			"Real Yields",
			"Gold",
			"Bitcoin",
			"Nasdaq 100"
		],
		relatedMarkets: [
			"CL",
			"GLD",
			"TLT",
			"QQQ",
			"BTC"
		],
		confidence: 61,
		sourceCount: 3,
		uncertainty: "Macro confirmation is incomplete without live rates, dollar, and inflation expectation feeds.",
		watchNext: [
			"Real yields",
			"Dollar direction",
			"Gold/BTC divergence",
			"QQQ duration sensitivity"
		],
		sourceTrail: P(["red-sea", "central-bank"]),
		evidenceTrail: F(["red-sea", "central-bank"])
	}
], me = {
	BTC: {
		label: "Bitcoin",
		feedSymbol: "bitcoin",
		defaultPrice: 66820
	},
	ETH: {
		label: "Ethereum",
		feedSymbol: "ethereum",
		defaultPrice: 3550
	},
	SOL: {
		label: "Solana",
		feedSymbol: "solana",
		defaultPrice: 142
	},
	KAS: {
		label: "Kaspa",
		feedSymbol: "kaspa",
		defaultPrice: .16
	},
	LINK: {
		label: "Chainlink",
		feedSymbol: "chainlink",
		defaultPrice: 14.2
	},
	AVAX: {
		label: "Avalanche",
		feedSymbol: "avalanche-2",
		defaultPrice: 28.5
	}
}, he = {
	EURUSD: {
		label: "Euro / US Dollar",
		defaultPrice: 1.08
	},
	GBPUSD: {
		label: "British Pound / US Dollar",
		defaultPrice: 1.27
	},
	USDJPY: {
		label: "US Dollar / Japanese Yen",
		defaultPrice: 157.4
	},
	USDCAD: {
		label: "US Dollar / Canadian Dollar",
		defaultPrice: 1.37
	},
	AUDUSD: {
		label: "Australian Dollar / US Dollar",
		defaultPrice: .66
	},
	USDCHF: {
		label: "US Dollar / Swiss Franc",
		defaultPrice: .9
	}
}, ge = {
	SPX: {
		label: "S&P 500 Index",
		defaultPrice: 5450
	},
	NDX: {
		label: "Nasdaq 100 Index",
		defaultPrice: 19650
	},
	DJI: {
		label: "Dow Jones Industrial Average",
		defaultPrice: 39150
	},
	RUT: {
		label: "Russell 2000 Index",
		defaultPrice: 2030
	},
	VIX: {
		label: "CBOE Volatility Index",
		defaultPrice: 14.8
	},
	DXY: {
		label: "US Dollar Index",
		defaultPrice: 105.2
	}
}, _e = {
	TECH: {
		symbol: "XLK",
		label: "Technology Select Sector",
		defaultPrice: 226
	},
	TECHNOLOGY: {
		symbol: "XLK",
		label: "Technology Select Sector",
		defaultPrice: 226
	},
	FINANCIALS: {
		symbol: "XLF",
		label: "Financial Select Sector",
		defaultPrice: 42
	},
	ENERGY: {
		symbol: "XLE",
		label: "Energy Select Sector",
		defaultPrice: 94
	},
	HEALTHCARE: {
		symbol: "XLV",
		label: "Health Care Select Sector",
		defaultPrice: 146
	},
	INDUSTRIALS: {
		symbol: "XLI",
		label: "Industrial Select Sector",
		defaultPrice: 122
	},
	UTILITIES: {
		symbol: "XLU",
		label: "Utilities Select Sector",
		defaultPrice: 70
	}
}, ve = {
	CL: {
		label: "WTI Crude",
		defaultPrice: 81.42
	},
	WTI: {
		label: "WTI Crude",
		defaultPrice: 81.42
	},
	XAUUSD: {
		label: "Gold Spot / US Dollar",
		defaultPrice: 2360
	},
	GOLD: {
		label: "Gold",
		defaultPrice: 2360
	},
	XAGUSD: {
		label: "Silver Spot / US Dollar",
		defaultPrice: 30
	},
	SILVER: {
		label: "Silver",
		defaultPrice: 30
	}
}, ye = {
	NVDA: {
		label: "Nvidia",
		defaultPrice: 128.44
	},
	AAPL: {
		label: "Apple",
		defaultPrice: 196.71
	},
	TSLA: {
		label: "Tesla",
		defaultPrice: 182
	},
	TSM: {
		label: "Taiwan Semiconductor",
		defaultPrice: 171
	},
	COIN: {
		label: "Coinbase Global",
		defaultPrice: 225
	},
	MSFT: {
		label: "Microsoft",
		defaultPrice: 442
	},
	AMZN: {
		label: "Amazon",
		defaultPrice: 184
	},
	XOM: {
		label: "Exxon Mobil",
		defaultPrice: 115
	},
	CVX: {
		label: "Chevron",
		defaultPrice: 156
	},
	VLO: {
		label: "Valero Energy",
		defaultPrice: 151
	},
	ZIM: {
		label: "ZIM Integrated Shipping",
		defaultPrice: 22
	},
	DAL: {
		label: "Delta Air Lines",
		defaultPrice: 48.76
	},
	UAL: {
		label: "United Airlines",
		defaultPrice: 52
	},
	GM: {
		label: "General Motors",
		defaultPrice: 46
	}
}, be = new Set([
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
]), xe = [
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
	"GOLD",
	...se.map((e) => e.ticker),
	...ce.map((e) => e.ticker)
];
function Se(e = !1) {
	return Ae(xe.map((t) => we(t, { enablePublicCrypto: e })));
}
function Ce(e) {
	return Object.fromEntries(e.map((e) => [e.symbol, e.defaultPrice]));
}
function we(e, t = {}) {
	let n = Te(e.trim()), r = Ee(n);
	if (r) return De(r, t.enablePublicCrypto);
	let i = n.replace("/", "");
	if (he[i]) {
		let e = he[i];
		return L(`${i.slice(0, 3)}/${i.slice(3)}`, e.label, "forex", "simulator", i.toLowerCase(), e.defaultPrice, "FX pair simulator");
	}
	let a = _e[n];
	if (a) return L(a.symbol, a.label, "sector", "simulator", a.symbol.toLowerCase(), a.defaultPrice, "Sector pressure proxy");
	let o = me[n];
	if (o) return L(n, o.label, "crypto", t.enablePublicCrypto ? "coincap" : "simulator", o.feedSymbol, o.defaultPrice, t.enablePublicCrypto ? "Public CoinCap-capable crypto mapping" : "Crypto simulator mapping");
	let s = ge[n];
	if (s) return L(n, s.label, "index", "simulator", n.toLowerCase(), s.defaultPrice, "Index simulator proxy");
	let c = ve[n];
	if (c) {
		let e = n === "WTI" ? "CL" : n === "GOLD" ? "XAUUSD" : n === "SILVER" ? "XAGUSD" : n;
		return L(e, c.label, "commodity", "simulator", e.toLowerCase(), c.defaultPrice, "Commodity simulator proxy");
	}
	let l = ye[n];
	if (l) return L(n, l.label, "equity", "simulator", n.toLowerCase(), l.defaultPrice, "Equity public-poll/local pressure proxy");
	let u = be.has(n) ? "etf" : "equity";
	return L(n, `${n} watchlist asset`, u, "simulator", n.toLowerCase(), 100, "User-added simulator watchlist asset");
}
function Te(e) {
	return e.toUpperCase().replace(/\s+/g, "").replace("-", "/");
}
function Ee(e) {
	return [...se, ...ce].find((t) => t.ticker === e);
}
function De(e, t = !1) {
	let n = me[e.ticker], r = Oe(e.ticker);
	return L(e.ticker, e.name, r, t && n ? "coincap" : "simulator", n?.feedSymbol ?? e.ticker.toLowerCase(), ke(e.price), "Seed watchlist asset");
}
function Oe(e) {
	return me[e] ? "crypto" : ve[e] ? "commodity" : ge[e] ? "index" : be.has(e) ? "etf" : (ye[e], "equity");
}
function L(e, t, n, r, i, a, o) {
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
function ke(e) {
	let t = Number.parseFloat(e.replace(/,/g, ""));
	return Number.isFinite(t) && t > 0 ? t : 100;
}
function Ae(e) {
	return [...new Map(e.map((e) => [e.symbol, e])).values()];
}
//#endregion
//#region src/realtime.ts
var je = {
	running: !1,
	mode: "stopped",
	sqliteMode: "unknown",
	connectedFeeds: [],
	reconnectingFeeds: []
}, Me = class {
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
}, Ne = 6e4, Pe = 30 * Ne, Fe = class {
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
		this.bufferSize = e.bufferSize ?? 1e3, this.syncIntervalMs = e.syncIntervalMs ?? 100, this.entityEdges = e.entityEdges ?? [], this.now = e.now ?? Ie, this.status = {
			...je,
			sqliteMode: e.sqliteMode ?? "unknown"
		};
		let t = e.seedPrices ?? {};
		for (let n of e.assets) {
			let e = t[n.symbol] ?? 100;
			this.assets.set(n.symbol, {
				config: n,
				ticks: new Me(this.bufferSize),
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
	addAsset(e, t = 100) {
		!e.symbol || this.assets.has(e.symbol) || (this.assets.set(e.symbol, {
			config: e,
			ticks: new Me(this.bufferSize),
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
			pressure: Le(e.pressure, 0, 100),
			sentimentDivergenceIndex: Le(e.sentimentDivergenceIndex, -1, 1)
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
		let n = e.simulate ?? (!e.external && this.feeds.length === 0);
		n && (this.startSimulator(), t.push("simulator")), this.status = {
			...this.status,
			running: !0,
			mode: e.external ? "live" : this.feeds.length > 0 ? n ? "hybrid" : "live" : "simulated",
			connectedFeeds: t,
			error: void 0
		}, this.scheduleNextFlush(), this.emit();
	}
	stop() {
		if (!this.running) return;
		this.running = !1;
		let e = ze();
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
		let e = Re();
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
				pressure: R(t.latestPressure, 2),
				mentionVelocity: R(t.latestMentionVelocity, 2),
				sentimentDivergenceIndex: R(t.latestSentimentDivergenceIndex, 3),
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
			price: R(e.lastPrice, 4),
			changePct: R(r, 3),
			volume: R(n.oneMinuteVolume, 2),
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
			return i > Pe ? !1 : (r += e.volume, i <= Ne && (n += e.volume), !0);
		});
		let c = e.ticks.toArray();
		for (let e of c) {
			if (t - e.timestamp > Ne) {
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
			l = R(Math.sqrt(t) * 1e4, 2);
		}
		let u = Math.floor(t / Ne);
		e.previousMinuteStamp !== 0 && u !== e.previousMinuteStamp ? (e.previousMinuteVolume = n, e.previousMinuteStamp = u) : e.previousMinuteStamp === 0 && (e.previousMinuteStamp = u, e.previousMinuteVolume = n);
		let d = e.previousMinuteVolume, f = d > 0 ? R((n - d) / d, 3) : 0;
		return {
			volatilityVelocity: l,
			volumeAcceleration: f,
			oneMinuteVolume: R(n, 2),
			thirtyMinuteAverageVolume: R(r / 30, 2)
		};
	}
	emit() {
		let e = this.getSnapshot();
		for (let t of this.listeners) t(e);
	}
	ensureAttentionTarget(e) {
		this.attention.has(e) || (this.attention.set(e, {
			target: e,
			samples: new Me(this.bufferSize),
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
					volume: R(u * l, 2),
					timestamp: t,
					source: "simulator"
				}), this.ingestAttention({
					target: r,
					pressure: R(Le(38 + Math.abs(s) * 12e3 + (l - 1) * 5, 0, 100), 2),
					mentionVelocity: R(Math.max(0, l - .8 + Math.abs(s) * 1e3), 2),
					sentimentDivergenceIndex: R(Le(s * 280 + (Math.random() - .5) * .18, -1, 1), 3),
					timestamp: t,
					source: "simulator"
				});
			}
		}, Math.min(this.syncIntervalMs, 120));
	}
};
function Ie() {
	return Date.now();
}
function R(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function Le(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function Re() {
	let e = globalThis.requestAnimationFrame;
	return typeof e == "function" ? e.bind(globalThis) : null;
}
function ze() {
	let e = globalThis.cancelAnimationFrame;
	return typeof e == "function" ? e.bind(globalThis) : null;
}
//#endregion
//#region src/engine/signalEngine.ts
function Be(e, t) {
	let n = new Map(t?.attention.map((e) => [e.target, e]) ?? []), r = new Map(e.attention.map((e) => [e.target, e])), i = e.assets.length > 0 ? e.assets.reduce((e, t) => e + t.changePct, 0) / e.assets.length : 0, a = [];
	for (let t of e.assets) {
		let o = r.get(t.symbol), s = n.get(t.symbol);
		a.push(...Ve(t, e, i)), o && a.push(...He(t, o, s, e));
	}
	return a.sort((e, t) => t.magnitude - e.magnitude).slice(0, 12).map((t) => Ue(t, e));
}
function Ve(e, t, n) {
	let r = [], i = Math.max(e.metrics.thirtyMinuteAverageVolume, 1), a = e.metrics.oneMinuteVolume / i;
	(e.metrics.volumeAcceleration >= 1.75 || a >= 4) && r.push({
		type: "unusual_volume_spike",
		assetOrTopicId: e.symbol,
		severity: z(Math.max(e.metrics.volumeAcceleration, a / 2)),
		magnitude: Math.max(e.metrics.volumeAcceleration, a / 2),
		explanation: `${e.symbol} volume is running ${a.toFixed(1)}x its rolling baseline with acceleration ${e.metrics.volumeAcceleration.toFixed(2)}.`,
		relatedGraphNodes: B(e.symbol, t)
	}), e.metrics.volatilityVelocity >= 18 && r.push({
		type: "volatility_velocity_spike",
		assetOrTopicId: e.symbol,
		severity: z(e.metrics.volatilityVelocity / 10),
		magnitude: e.metrics.volatilityVelocity / 10,
		explanation: `${e.symbol} volatility velocity reached ${e.metrics.volatilityVelocity.toFixed(1)} bps on the one-minute window.`,
		relatedGraphNodes: B(e.symbol, t)
	});
	let o = Math.abs(e.changePct - n);
	return o >= 2.5 && e.metrics.volatilityVelocity >= 8 && r.push({
		type: "correlation_break",
		assetOrTopicId: e.symbol,
		severity: z(o / 1.5),
		magnitude: o / 1.5,
		explanation: `${e.symbol} is deviating ${o.toFixed(2)} points from the basket while volatility remains elevated.`,
		relatedGraphNodes: B(e.symbol, t)
	}), r;
}
function He(e, t, n, r) {
	let i = [];
	if (t.pressure >= 78 || t.mentionVelocity >= 8) {
		let e = Math.max(t.pressure / 25, t.mentionVelocity / 3);
		i.push({
			type: "attention_pressure_spike",
			assetOrTopicId: t.target,
			severity: z(e),
			magnitude: e,
			explanation: `${t.target} attention pressure is ${t.pressure.toFixed(0)} with dV/dt ${t.mentionVelocity.toFixed(1)}.`,
			relatedGraphNodes: B(t.target, r)
		});
	}
	let a = Math.sign(e.changePct), o = Math.sign(t.sentimentDivergenceIndex);
	if (a !== 0 && o !== 0 && a !== o && Math.abs(e.changePct) >= .2 && Math.abs(t.sentimentDivergenceIndex) >= .28) {
		let n = Math.abs(e.changePct) + Math.abs(t.sentimentDivergenceIndex) * 3;
		i.push({
			type: "sentiment_price_divergence",
			assetOrTopicId: t.target,
			severity: z(n),
			magnitude: n,
			explanation: `${t.target} price direction and social sentiment are diverging: price ${e.changePct.toFixed(2)}%, sentiment index ${t.sentimentDivergenceIndex.toFixed(2)}.`,
			relatedGraphNodes: B(t.target, r)
		});
	}
	if (n) {
		let e = t.mentionVelocity - n.mentionVelocity;
		if (e >= 4.5 && t.pressure >= 62) {
			let n = e / 2;
			i.push({
				type: "narrative_acceleration",
				assetOrTopicId: t.target,
				severity: z(n),
				magnitude: n,
				explanation: `${t.target} narrative velocity accelerated by ${e.toFixed(1)} mentions/min equivalent since the prior frame.`,
				relatedGraphNodes: B(t.target, r)
			});
		}
	}
	return i;
}
function Ue(e, t) {
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
		confidence: We(e.severity),
		createdAt: t.emittedAt,
		explanation: e.explanation,
		relatedGraphNodes: e.relatedGraphNodes
	};
}
function z(e) {
	return e >= 5 ? "critical" : e >= 3.5 ? "high" : e >= 2 ? "elevated" : "watch";
}
function We(e) {
	return e === "critical" || e === "high" ? "HIGH" : e === "elevated" ? "ELEVATED" : "WATCH";
}
function B(e, t) {
	let n = e.toLowerCase(), r = new Set([e]);
	for (let e of t.entityEdges) (e.source.toLowerCase().includes(n) || e.target.toLowerCase().includes(n)) && (r.add(e.source), r.add(e.target));
	return [...r].slice(0, 8);
}
//#endregion
//#region src/engine/intelGraph.ts
var Ge = class {
	nodes = /* @__PURE__ */ new Map();
	adjacency = /* @__PURE__ */ new Map();
	edgeCount = 0;
	get nodeCount() {
		return this.nodes.size;
	}
	get edgeTotal() {
		return this.edgeCount;
	}
	addNode(e) {
		return this.nodes.set(e.id, e), this.adjacency.has(e.id) || this.adjacency.set(e.id, []), this;
	}
	hasNode(e) {
		return this.nodes.has(e);
	}
	getNode(e) {
		return this.nodes.get(e);
	}
	addEdge(e) {
		this.nodes.has(e.source) || this.addNode({
			id: e.source,
			label: e.source,
			kind: "risk"
		}), this.nodes.has(e.target) || this.addNode({
			id: e.target,
			label: e.target,
			kind: "risk"
		});
		let t = Ke(e.weight), n = this.adjacency.get(e.source);
		return n && (n.push({
			target: e.target,
			relation: e.relation,
			weight: t
		}), this.edgeCount += 1), this;
	}
	addBidirectionalEdge(e) {
		return this.addEdge(e), this.addEdge({
			source: e.target,
			target: e.source,
			relation: e.relation,
			weight: e.weight
		}), this;
	}
	traverseRisk(e, t = {}) {
		let n = t.minStrength ?? .05, r = t.maxDepth ?? 8, i = t.leafKinds ? new Set(t.leafKinds) : null;
		if (!this.nodes.get(e)) return [];
		let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), s = [{
			nodeId: e,
			strength: 1,
			depth: 0,
			path: []
		}];
		for (a.set(e, 1); s.length > 0;) {
			let e = s.shift();
			if (e.depth > 0) {
				let t = this.nodes.get(e.nodeId);
				if (t && (!i || i.has(t.kind))) {
					let n = o.get(t.id);
					(!n || e.strength > n.strength) && o.set(t.id, {
						node: t,
						strength: e.strength,
						depth: e.depth,
						path: e.path
					});
				}
			}
			if (e.depth >= r) continue;
			let t = this.adjacency.get(e.nodeId);
			if (t) for (let r of t) {
				let t = e.strength * r.weight;
				if (t < n) continue;
				let i = a.get(r.target);
				i !== void 0 && i >= t || (a.set(r.target, t), s.push({
					nodeId: r.target,
					strength: t,
					depth: e.depth + 1,
					path: [...e.path, {
						nodeId: r.target,
						relation: r.relation
					}]
				}));
			}
		}
		return Array.from(o.values()).sort((e, t) => t.strength - e.strength);
	}
	exposedSymbols(e, t = {}) {
		return this.traverseRisk(e, {
			...t,
			leafKinds: [
				"ticker",
				"etf",
				"company"
			]
		}).map((e) => e.node.symbol ?? e.node.label);
	}
	neighbors(e) {
		return this.adjacency.get(e) ?? [];
	}
};
function Ke(e) {
	return Number.isNaN(e) || e < 0 ? 0 : e > 1 ? 1 : e;
}
function qe(e) {
	let t = new Ge();
	for (let n of e.nodes) t.addNode(n);
	for (let n of e.edges) t.addEdge(n);
	return t;
}
//#endregion
//#region src/intelGraphData.ts
var Je = {
	"Trade route": "event",
	Risk: "risk",
	Commodity: "commodity",
	ETF: "etf",
	Macro: "macro",
	Country: "country",
	Company: "company",
	Sector: "sector"
}, Ye = {
	xle: "XLE",
	qqq: "QQQ",
	nvda: "NVDA",
	tesla: "TSLA",
	tsmc: "TSM",
	oil: "CL",
	gold: "GLD"
}, Xe = null;
function Ze() {
	return Xe ||= qe({
		nodes: de.map((e) => ({
			id: e.id,
			label: e.label,
			kind: Je[e.kind] ?? "risk",
			symbol: Ye[e.id]
		})),
		edges: fe.map((e) => ({
			source: e.source,
			target: e.target,
			relation: e.label,
			weight: e.strength / 100
		}))
	}), Xe;
}
function Qe(e) {
	return e ? Ze().traverseRisk(e, {
		minStrength: .05,
		maxDepth: 8
	}) : [];
}
//#endregion
//#region electron/realtimeService.ts
var { BrowserWindow: $e } = t, et = n(i(import.meta.url)), tt = 5 * 6e4, nt = fe.map((e) => ({
	id: e.id,
	headlineId: `seed:${e.source}`,
	source: e.source,
	target: e.target,
	relation: e.label,
	confidence: e.strength,
	createdAt: Date.now()
})), rt = class {
	engine;
	persistence;
	enablePublicWs = process.env.ATLASZ_ENABLE_PUBLIC_WS === "1";
	defaultConnectorId = process.env.ATLASZ_CONNECTOR ?? (process.env.ATLASZ_ENABLE_PUBLIC_WS === "1" ? "coincap_public_ws" : "simulated");
	seenSignalIds = /* @__PURE__ */ new Set();
	universe = Se(this.enablePublicWs);
	seedPrices = Ce(this.universe);
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
	lastMarketPersistAt = 0;
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
		this.persistence = e.persistence, this.healthState = it(this.defaultConnectorId, this.persistence.mode), this.engine = new Fe({
			assets: this.universe,
			seedPrices: this.seedPrices,
			syncIntervalMs: 100,
			bufferSize: 1e3,
			entityEdges: nt,
			attentionTargets: [...new Set([
				...this.universe.map((e) => e.symbol),
				"AIXR",
				"LIT"
			])],
			sqliteMode: this.persistence.mode,
			now: () => Date.now()
		});
		for (let e of nt) this.safePersist(() => this.persistence.saveEntityEdge({
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
			replay: this.replayState
		};
	}
	addAsset(e) {
		let t = we(e, { enablePublicCrypto: this.enablePublicWs });
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
		let t = Qe(e);
		return this.audit("graph_traversal_triggered", "info", `Graph traversal triggered from ${e}`, {
			nodeId: e,
			exposedAssets: t.map((e) => e.node.symbol ?? e.node.label)
		}), t;
	}
	replayStart(e = {}) {
		let t = e.to ?? Date.now(), n = e.from ?? t - tt, r = e.speed ?? this.replayState.speed;
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
		let t = we(e, { enablePublicCrypto: this.enablePublicWs });
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
		let t = new l(r(et, "marketIngestionWorker.js"), { workerData: {
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
			replay: this.replayState
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
		let t = Be(e.frame, this.previousLiveFrame), n = {
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
		if (n - this.lastMarketPersistAt < 1e3) return;
		this.lastMarketPersistAt = n;
		let r = new Date(n).toISOString().slice(0, 10);
		for (let t of e.slice(0, 24)) this.safePersist(() => this.persistence.saveMarketTick({
			id: `tick:${t.symbol}:${t.timestamp}`,
			symbol: t.symbol,
			price: t.price,
			volume: t.volume,
			source: t.source,
			observedAt: t.timestamp,
			tradeDate: r
		}));
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
		for (let t of $e.getAllWindows()) t.isDestroyed() || t.webContents.send("atlasz:realtime:frame", e);
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
			e();
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
		}
	}
};
function it(e, t) {
	return {
		activeConnectorId: e,
		ingestionStatus: "stopped",
		packetsPerSecond: 0,
		framesPerSecond: 0,
		droppedPackets: 0,
		reconnectCount: 0,
		sqliteMode: t,
		sourceTrust: e === "simulated" ? "simulated" : "public unauthenticated",
		workerStatus: "stopped",
		connectors: [
			{
				id: "simulated",
				label: "Local simulator",
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
				sourceTrust: "authenticated",
				packetsPerSecond: 0,
				droppedPackets: 0
			}
		],
		replay: {
			active: !1,
			playing: !1,
			speed: 1,
			frameCount: 0
		}
	};
}
//#endregion
//#region src/worldIntel.ts
var at = [
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
function ot(e) {
	let t = st(e.headlines, e.sourceTrust);
	return {
		...e,
		...t
	};
}
function st(e, t) {
	let n = e.map((e) => ct(e)).filter((e) => e !== null);
	if (n.length === 0) return {
		events: N,
		signals: I,
		dailyBrief: pe,
		rawSourceItems: oe
	};
	let r = [...yt(n, (e) => e.topic.id).values()].map((e) => ut(e, t)), i = r.map((e) => dt(e, t)), a = r.slice(0, 4).map((e) => ft(e, t)), o = n.slice(0, 25).map((e) => ht(e));
	return {
		events: vt(r, N),
		signals: vt(i, I),
		dailyBrief: [...a, ...pe].slice(0, 7),
		rawSourceItems: [...o, ...oe]
	};
}
function ct(e) {
	let t = `${e.title} ${e.sector} ${e.impact}`.toLowerCase(), n = null;
	for (let e of at) {
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
function lt(e) {
	let t = ct({
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
function ut(e, t) {
	let n = e[0].topic, r = Math.max(...e.map((e) => e.observedAt)), i = e.slice(0, 5).map((e) => pt(e, t)), a = mt(n, e.length, t);
	return {
		id: n.id,
		time: _t(r),
		category: n.category,
		region: n.region,
		severity: n.severity,
		confidence: gt(e.length, t),
		sourceCount: e.length,
		title: `${n.label} appears in public coverage`,
		summary: `${n.narrative} Latest matched headline: ${e[0].title}`,
		relationshipReason: `Keyword/entity evidence matched ${bt(e.flatMap((e) => e.matchedKeywords)).join(", ")} and maps to ${n.markets.join(", ")}.`,
		uncertainty: n.uncertainty,
		detectedEntities: n.entities,
		linkedMarkets: n.markets,
		riskChannels: n.riskChannels,
		evidenceNotes: a,
		sourceTrail: i
	};
}
function dt(e, t) {
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
function ft(e, t) {
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
function pt(e, t) {
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
function mt(e, t, n) {
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
function ht(e) {
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
function gt(e, t) {
	let n = t === "public unauthenticated" ? 8 : t === "stale" ? 18 : 12;
	return Math.min(72, Math.max(48, 45 + e * 7 - n));
}
function _t(e) {
	return new Date(e).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
}
function vt(e, t) {
	return [...new Map([...e, ...t].map((e) => [e.id, e])).values()];
}
function yt(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = t(r);
		n.set(e, [...n.get(e) ?? [], r]);
	}
	return n;
}
function bt(e) {
	return [...new Set(e)];
}
//#endregion
//#region electron/worldIntelService.ts
var xt = "https://api.gdeltproject.org/api/v2/doc/doc", St = [
	"\"Red Sea\"",
	"semiconductor",
	"Taiwan",
	"tariffs",
	"sanctions",
	"\"rare earth\"",
	"\"central bank\"",
	"inflation",
	"\"natural gas\"",
	"oil"
].join(" OR "), Ct = class {
	persistence;
	enabled = process.env.ATLASZ_ENABLE_PUBLIC_WORLD !== "0";
	status = this.enabled ? "stale" : "disabled";
	lastError;
	updatedAt;
	inFlight = null;
	constructor(e) {
		this.persistence = e;
	}
	snapshot() {
		return this.buildSnapshot();
	}
	refresh() {
		return this.enabled ? this.inFlight ? this.inFlight : (this.status = "fetching", this.inFlight = this.fetchGdelt().then((e) => {
			for (let t of e) this.persistence.saveHeadline(Et(t));
			this.status = e.length > 0 ? "ready" : "stale", this.lastError = void 0, this.updatedAt = Date.now();
			let t = this.buildSnapshot();
			return t.rawSourceItems.some((e) => e.connector === "gdelt-doc-public") && wt(this.persistence, t), t;
		}).catch((e) => (this.lastError = e instanceof Error ? e.message : String(e), this.status = this.persistence.listHeadlines(1).length > 0 ? "stale" : "failed", this.buildSnapshot())).finally(() => {
			this.inFlight = null;
		}), this.inFlight) : (this.status = "disabled", Promise.resolve(this.buildSnapshot()));
	}
	async fetchGdelt() {
		let e = new URL(xt);
		e.searchParams.set("query", St), e.searchParams.set("mode", "ArtList"), e.searchParams.set("format", "json"), e.searchParams.set("maxrecords", "35"), e.searchParams.set("sort", "DateDesc");
		let t = await fetch(e, { headers: {
			accept: "application/json",
			"user-agent": "AtlaszIntel/0.2 local-first world-intel connector"
		} });
		if (!t.ok) throw Error(`GDELT HTTP ${t.status}`);
		let n = await t.text();
		if (!n.trim().startsWith("{")) throw Error(n.trim().slice(0, 160) || "GDELT returned a non-JSON response");
		let r = JSON.parse(n);
		return (Array.isArray(r.articles) ? r.articles : []).map(Tt).filter((e) => e !== null);
	}
	buildSnapshot() {
		let e = this.persistence.listHeadlines(80).map(Dt);
		return ot({
			enabled: this.enabled,
			status: this.status,
			sourceTrust: this.status === "failed" ? "failed" : this.status === "stale" ? "stale" : "public unauthenticated",
			connectorId: this.enabled ? "gdelt_doc_public" : "seeded",
			connectorLabel: this.enabled ? "GDELT DOC public news" : "Seeded local world layer",
			updatedAt: this.updatedAt,
			lastError: this.lastError,
			headlines: e
		});
	}
};
function wt(e, t) {
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
function Tt(e) {
	let t = V(e.title), n = V(e.url);
	if (!t || !n) return null;
	let r = V(e.sourceCommonName) || V(e.domain) || "GDELT public source", i = Ot(V(e.seendate)) ?? Date.now(), a = lt(t);
	return {
		id: kt(n),
		title: t,
		source: r,
		url: n,
		sector: a.sector,
		impact: a.impact,
		observedAt: i
	};
}
function Et(e) {
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
function Dt(e) {
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
function V(e) {
	return typeof e == "string" ? e.trim() : "";
}
function Ot(e) {
	if (!/^\d{14}$/.test(e)) return null;
	let t = `${e.slice(0, 4)}-${e.slice(4, 6)}-${e.slice(6, 8)}T${e.slice(8, 10)}:${e.slice(10, 12)}:${e.slice(12, 14)}Z`, n = Date.parse(t);
	return Number.isFinite(n) ? n : null;
}
function kt(e) {
	let t = 0;
	for (let n = 0; n < e.length; n += 1) t = t * 31 + e.charCodeAt(n) >>> 0;
	return `gdelt-${t.toString(36)}`;
}
//#endregion
//#region src/engine/graphMutator.ts
var At = {
	Sovereign: "sovereign",
	Location: "location",
	Commodity: "commodity",
	Corporation: "corporation",
	Infrastructure: "infrastructure"
};
function jt(e) {
	return e.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
}
function Mt(e) {
	return Math.min(1, Math.max(0, e));
}
var Nt = class {
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
		let t = this.now(), n = e.confidence_metrics.score, r = `event:${jt(e.event_summary)}`, i = [];
		this.ensureNode(r, e.event_summary, "event", t, e.primary_macro_theme) && i.push(r);
		for (let a of e.extracted_entities) {
			let o = `entity:${jt(a.name)}`;
			this.ensureNode(o, a.name, At[a.type] ?? "infrastructure", t, e.primary_macro_theme) && i.push(o), this.reinforceEdge(r, o, "involves", .6, n, "Volatility_Expansion", t);
		}
		let a = 0, o = 0;
		for (let s of e.downstream_exposure_chain) {
			let c = `asset:${jt(s.node_name)}`;
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
			r.weight = Mt(e.weight), r.relation = e.relation, r.direction = e.direction ?? r.direction, r.provenance = e.provenance, r.confidence = Mt(e.confidence ?? e.weight), r.lastReinforcedAt = t, r.lastDecayedAt = t, r.reinforcements += 1;
			return;
		}
		n.push({
			source: e.source.id,
			target: e.target.id,
			relation: e.relation,
			weight: Mt(e.weight),
			direction: e.direction ?? "Volatility_Expansion",
			provenance: e.provenance,
			confidence: Mt(e.confidence ?? e.weight),
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
}, Pt = [
	"Geopolitical Choke Point",
	"Supply Chain Disruption",
	"Monetary Policy Shocks",
	"Tariff and Trade War Escalation",
	"Regulatory Constraints",
	"Resource Scarcity",
	"Commodity Shock"
], Ft = [
	"Sovereign",
	"Location",
	"Commodity",
	"Corporation",
	"Infrastructure"
], It = [
	"Bullish_Catalyst",
	"Bearish_Headwind",
	"Volatility_Expansion"
], Lt = {
	type: "object",
	properties: {
		event_summary: { type: "string" },
		primary_macro_theme: {
			type: "string",
			enum: [...Pt]
		},
		extracted_entities: {
			type: "array",
			items: {
				type: "object",
				properties: {
					name: { type: "string" },
					type: {
						type: "string",
						enum: [...Ft]
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
						enum: [...It]
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
function Rt(e) {
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
}
function H(e) {
	return typeof e == "string" ? e.trim() : "";
}
function zt(e, t, n) {
	return typeof e == "string" && t.includes(e) ? e : n;
}
function Bt(e) {
	if (!e || typeof e != "object") return null;
	let t = e, n = H(t.event_summary);
	if (n === "") return null;
	let r = (Array.isArray(t.extracted_entities) ? t.extracted_entities : []).map((e) => {
		if (!e || typeof e != "object") return null;
		let t = e, n = H(t.name);
		return n === "" ? null : {
			name: n,
			type: zt(t.type, Ft, "Infrastructure")
		};
	}).filter((e) => e !== null), i = (Array.isArray(t.downstream_exposure_chain) ? t.downstream_exposure_chain : []).map((e) => {
		if (!e || typeof e != "object") return null;
		let t = e, n = H(t.node_name);
		return n === "" ? null : {
			node_name: n,
			exposure_direction: zt(t.exposure_direction, It, "Volatility_Expansion"),
			exposure_weight: Rt(t.exposure_weight),
			transmission_mechanism: H(t.transmission_mechanism)
		};
	}).filter((e) => e !== null), a = t.confidence_metrics && typeof t.confidence_metrics == "object" ? t.confidence_metrics : {};
	return {
		event_summary: n,
		primary_macro_theme: zt(t.primary_macro_theme, Pt, "Supply Chain Disruption"),
		extracted_entities: r,
		downstream_exposure_chain: i,
		confidence_metrics: {
			score: Rt(a.score),
			primary_uncertainty: H(a.primary_uncertainty)
		}
	};
}
//#endregion
//#region src/engine/cognitiveParser.ts
var Vt = "You are the primary cognitive node of Atlasz Intel, a local financial intelligence engine. Map the physical and macro plumbing hidden behind unstructured text.\n\nRules:\n1. NO PROSE. Output must start with '{' and end with '}'. No preamble.\n2. Adhere 100% to the enforced JSON schema. Every field is required. Do not invent keys.\n3. Look past hype: identify structural dependencies — sectors, raw materials, shipping lanes, and corporate anchors in the blast radius.\n4. Be conservative with exposure weights. A direct refinery hit is ~1.0 exposure to its equity; a secondary consumer-goods tariff is ~0.3.\n5. Set confidence by verifiable facts in the text versus speculative narrative. State the biggest remaining uncertainty.", Ht = class {
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
		let r = t.timeoutMs && t.timeoutMs > 0 ? t.timeoutMs : this.timeoutMs, i = t.instruction ? `${Vt}\n\n${t.instruction}` : Vt, a = typeof e.context == "string" && e.context.trim() !== "" ? e.context.trim() : "", o = new AbortController(), s = setTimeout(() => o.abort(), r);
		try {
			let t = await this.fetchImpl(this.endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: o.signal,
				body: JSON.stringify({
					model: this.model,
					stream: !1,
					format: Lt,
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
			let l = Ut(c), u = Bt(c);
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
function Ut(e) {
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
function U(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n += 1) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
	return (t >>> 0).toString(36);
}
function W(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function Wt(e) {
	let t = typeof e == "number" ? e : Number(e);
	return Number.isFinite(t) ? t : null;
}
//#endregion
//#region electron/ingest/cognitiveTaskManager.ts
var Gt = class extends u {
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
		super(), this.on("error", () => void 0), this.enabled = e.enabled ?? process.env.ATLASZ_ENABLE_OLLAMA === "1", this.endpoint = e.endpoint ?? process.env.ATLASZ_OLLAMA_ENDPOINT ?? "http://localhost:11434/api/chat", this.model = e.model ?? process.env.ATLASZ_OLLAMA_MODEL ?? "qwen2.5:7b", this.initialTimeoutMs = e.requestTimeoutMs ?? 18e3, this.minTimeoutMs = e.minTimeoutMs ?? 3e3, this.maxTimeoutMs = e.maxTimeoutMs ?? 3e4, this.latencyWindowSize = e.latencyWindowSize ?? 8, this.timeoutScale = e.timeoutScale ?? 1.5, this.maxQueueSize = e.maxQueueSize ?? 250, this.parser = new Ht({
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
			id: `batch-${U(e.map((e) => e.id).join("|"))}`,
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
		return e ? Math.round(W(e * this.timeoutScale, this.minTimeoutMs, this.maxTimeoutMs)) : this.initialTimeoutMs;
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
			instruction: Kt(n)
		});
		if (!a) return this.failedExtractions += 1, this.markFailure(t.sourceName), null;
		let o = Date.now() - i;
		this.recordSuccessfulDuration(o), a.validationIssueCount > 0 ? this.markFailure(t.sourceName, a.validationIssueCount) : this.markSuccess(t.sourceName);
		let s = this.sourcePenalty(t.sourceName);
		return this.successfulExtractions += 1, {
			extraction: qt(a.extraction, s),
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
		e.penalty = Number(W(1 - n * .65 - r, .25, 1).toFixed(3));
	}
};
function Kt(e) {
	let t = "You convert public market/news text into strictly structured, non-predictive exposure mapping. Do not give trading advice. Return only JSON matching the schema.";
	return e === "batch-summary" ? `${t} This input is a high-velocity batch; summarize only the dominant shared macro theme and the strongest exposure chains.` : e === "keyword-priority" ? `${t} This input was selected during elevated narrative velocity; ignore weak tangential references and extract only high-conviction exposure links.` : t;
}
function qt(e, t) {
	return {
		...e,
		confidence_metrics: {
			...e.confidence_metrics,
			score: W(e.confidence_metrics.score * t, 0, 1),
			primary_uncertainty: t < .95 ? `${e.confidence_metrics.primary_uncertainty} Source reliability penalty applied: ${t.toFixed(2)}.` : e.confidence_metrics.primary_uncertainty
		},
		downstream_exposure_chain: e.downstream_exposure_chain.map((e) => ({
			...e,
			exposure_weight: W(e.exposure_weight * t, 0, 1)
		}))
	};
}
//#endregion
//#region electron/ingest/exposureMatrix.ts
var Jt = [
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
function Yt(e, t = `event:${U(e)}`) {
	let n = e.toLowerCase(), r = [];
	for (let e of Jt) {
		let i = e.keywords.find((e) => n.includes(e));
		i && r.push({
			eventId: t,
			keyword: i,
			affectedTickers: e.tickers,
			confidence: e.confidence,
			reason: `${e.theme}: ${e.reason}`
		});
	}
	return Xt(r);
}
function Xt(e) {
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
var Zt = "inflation OR fed OR election OR tariffs OR Taiwan OR oil OR recession", Qt = class extends u {
	intervalMs;
	requestTimeoutMs;
	query;
	limit;
	timer = null;
	running = !1;
	seen = /* @__PURE__ */ new Map();
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.intervalMs = e.intervalMs ?? 5 * 6e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 12e3, this.query = e.query ?? Zt, this.limit = e.limit ?? 40;
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
				let t = $t(e);
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
function $t(e) {
	let t = G(e.question) || G(e.title);
	if (!t) return null;
	let n = en(e);
	if (n === null) return null;
	let r = G(e.slug);
	return {
		id: `polymarket-${G(e.id) || U(t)}`,
		title: t,
		probability: n,
		sourceUrl: r ? `https://polymarket.com/event/${r}` : "https://polymarket.com/",
		observedAt: Date.now(),
		tags: nn(e.tags)
	};
}
function en(e) {
	let t = tn(e.outcomePrices);
	if (t.length === 0) return null;
	let n = t.filter((e) => e >= .01 && e <= .99);
	return n.length === 0 ? null : Math.max(...n);
}
function tn(e) {
	if (Array.isArray(e)) return e.map(Wt).filter((e) => e !== null);
	if (typeof e == "string") try {
		return tn(JSON.parse(e));
	} catch {
		return e.split(",").map((e) => Wt(e.trim())).filter((e) => e !== null);
	}
	return [];
}
function nn(e) {
	return Array.isArray(e) ? e.map((e) => {
		if (typeof e == "string") return e;
		if (e && typeof e == "object") {
			let t = e;
			return G(t.label) || G(t.name);
		}
		return "";
	}).filter((e) => e.length > 0).slice(0, 5) : [];
}
function G(e) {
	return typeof e == "string" ? e.trim() : "";
}
//#endregion
//#region node_modules/xml2js/lib/defaults.js
var rn = /* @__PURE__ */ v(((e) => {
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
})), K = /* @__PURE__ */ v(((e, t) => {
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
})), an = /* @__PURE__ */ v(((e, t) => {
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
})), on = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = (function() {
			function e() {}
			return e.prototype.handleError = function(e) {
				throw Error(e);
			}, e;
		})();
	}).call(e);
})), sn = /* @__PURE__ */ v(((e, t) => {
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
})), cn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e = on(), n = sn();
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
})), ln = /* @__PURE__ */ v(((e, t) => {
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
})), un = /* @__PURE__ */ v(((e, t) => {
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
})), dn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l = function(e, t) {
			for (var n in t) u.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, u = {}.hasOwnProperty;
		c = K(), s = c.isObject, o = c.isFunction, a = c.getValue, i = J(), e = q(), n = ln(), r = un(), t.exports = (function(t) {
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
})), fn = /* @__PURE__ */ v(((e, t) => {
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
})), pn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = fn(), t.exports = (function(t) {
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
})), mn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = fn(), t.exports = (function(t) {
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
})), hn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		r = K().isObject, n = J(), e = q(), t.exports = (function(t) {
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
})), gn = /* @__PURE__ */ v(((e, t) => {
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
})), _n = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		r = K().isObject, n = J(), e = q(), t.exports = (function(t) {
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
})), vn = /* @__PURE__ */ v(((e, t) => {
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
})), yn = /* @__PURE__ */ v(((e, t) => {
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
})), bn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l = function(e, t) {
			for (var n in t) u.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, u = {}.hasOwnProperty;
		c = K().isObject, s = J(), e = q(), n = gn(), i = _n(), r = vn(), a = yn(), o = un(), t.exports = (function(t) {
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
})), xn = /* @__PURE__ */ v(((e, t) => {
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
})), Sn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = fn(), t.exports = (function(t) {
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
})), Cn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r = function(e, t) {
			for (var n in t) i.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, i = {}.hasOwnProperty;
		e = q(), n = fn(), t.exports = (function(t) {
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
})), wn = /* @__PURE__ */ v(((e, t) => {
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
})), Tn = /* @__PURE__ */ v(((e, t) => {
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
})), En = /* @__PURE__ */ v(((e, t) => {
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
		_ = K(), g = _.isObject, h = _.isFunction, m = _.isEmpty, p = _.getValue, c = null, r = null, i = null, a = null, o = null, d = null, f = null, u = null, s = null, n = null, l = null, e = null, t.exports = (function() {
			function t(t) {
				this.parent = t, this.parent && (this.options = this.parent.options, this.stringify = this.parent.stringify), this.value = null, this.children = [], this.baseURI = null, c || (c = dn(), r = pn(), i = mn(), a = hn(), o = bn(), d = xn(), f = Sn(), u = Cn(), s = wn(), n = q(), l = Tn(), un(), e = En());
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
})), Dn = /* @__PURE__ */ v(((e, t) => {
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
})), On = /* @__PURE__ */ v(((e, t) => {
	(function() {
		t.exports = {
			None: 0,
			OpenTag: 1,
			InsideTag: 2,
			CloseTag: 3
		};
	}).call(e);
})), kn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = {}.hasOwnProperty;
		r = K().assign, e = q(), hn(), bn(), pn(), mn(), dn(), xn(), Sn(), Cn(), wn(), gn(), vn(), _n(), yn(), n = On(), t.exports = (function() {
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
})), An = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n = function(e, t) {
			for (var n in t) r.call(t, n) && (e[n] = t[n]);
			function i() {
				this.constructor = e;
			}
			return i.prototype = t.prototype, e.prototype = new i(), e.__super__ = t.prototype, e;
		}, r = {}.hasOwnProperty;
		e = kn(), t.exports = (function(e) {
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
})), jn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c = function(e, t) {
			for (var n in t) l.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, l = {}.hasOwnProperty;
		s = K().isPlainObject, r = an(), n = cn(), i = J(), e = q(), o = Dn(), a = An(), t.exports = (function(t) {
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
})), Mn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w = {}.hasOwnProperty;
		C = K(), x = C.isObject, b = C.isFunction, S = C.isPlainObject, y = C.getValue, e = q(), f = jn(), p = dn(), i = pn(), a = mn(), h = xn(), v = Sn(), m = Cn(), u = hn(), d = bn(), o = gn(), c = _n(), s = vn(), l = yn(), r = ln(), _ = Dn(), g = An(), n = On(), t.exports = (function() {
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
})), Nn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i = function(e, t) {
			for (var n in t) a.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, a = {}.hasOwnProperty;
		e = q(), r = kn(), n = On(), t.exports = (function(t) {
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
})), Pn = /* @__PURE__ */ v(((e, t) => {
	(function() {
		var e, n, r, i, a, o, s, c, l, u = K();
		c = u.assign, l = u.isFunction, r = an(), i = jn(), a = Mn(), s = An(), o = Nn(), e = q(), n = On(), t.exports.create = function(e, t, n, r) {
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
})), Fn = /* @__PURE__ */ v(((e) => {
	(function() {
		var t, n, r, i, a, o = {}.hasOwnProperty;
		t = Pn(), n = rn().defaults, i = function(e) {
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
})), In = /* @__PURE__ */ v(((e) => {
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
			i(a), a.q = a.c = "", a.bufferCheckPosition = e.MAX_BUFFER_LENGTH, a.encoding = null, a.opt = r || {}, a.opt.lowercase = a.opt.lowercase || a.opt.lowercasetags, a.looseCase = a.opt.lowercase ? "toLowerCase" : "toUpperCase", a.opt.maxEntityCount = a.opt.maxEntityCount || 512, a.opt.maxEntityDepth = a.opt.maxEntityDepth || 4, a.entityCount = a.entityDepth = 0, a.tags = [], a.closed = a.closedRoot = a.sawRoot = !1, a.tag = a.error = null, a.strict = !!t, a.noscript = !!(t || a.opt.noscript), a.state = T.BEGIN, a.strictEntities = a.opt.strictEntities, a.ENTITIES = a.strictEntities ? Object.create(e.XML_ENTITIES) : Object.create(e.ENTITIES), a.attribList = [], a.opt.xmlns && (a.ns = Object.create(h)), a.opt.unquotedAttributeValues === void 0 && (a.opt.unquotedAttributeValues = !t), a.trackPosition = a.opt.position !== !1, a.trackPosition && (a.position = a.line = a.column = 0), E(a, "onready");
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
						O(n);
						break;
					case "cdata":
						D(n, "oncdata", n.cdata), n.cdata = "";
						break;
					case "script":
						D(n, "onscript", n.script), n.script = "";
						break;
					default: A(n, "Max buffer length exceeded: " + t[a]);
				}
				i = Math.max(i, s);
			}
			n.bufferCheckPosition = e.MAX_BUFFER_LENGTH - i + n.position;
		}
		function i(e) {
			for (var n = 0, r = t.length; n < r; n++) e[t[n]] = "";
		}
		function a(e) {
			O(e), e.cdata !== "" && (D(e, "oncdata", e.cdata), e.cdata = ""), e.script !== "" && (D(e, "onscript", e.script), e.script = "");
		}
		n.prototype = {
			end: function() {
				j(this);
			},
			write: ue,
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
		function E(e, t, n) {
			e[t] && e[t](n);
		}
		function ne(e) {
			var t = e && e.match(/(?:^|\s)encoding\s*=\s*(['"])([^'"]+)\1/i);
			return t ? t[2] : null;
		}
		function re(e) {
			return e ? e.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
		}
		function ie(e, t) {
			let n = re(e), r = re(t);
			return !n || !r ? !0 : r === "utf16" ? n === "utf16le" || n === "utf16be" : n === r;
		}
		function ae(e, t) {
			if (!(!e.strict || !e.encoding || !t || t.name !== "xml")) {
				var n = ne(t.body);
				n && !ie(e.encoding, n) && M(e, "XML declaration encoding " + n + " does not match detected stream encoding " + e.encoding.toUpperCase());
			}
		}
		function D(e, t, n) {
			e.textNode && O(e), E(e, t, n);
		}
		function O(e) {
			e.textNode = k(e.opt, e.textNode), e.textNode && E(e, "ontext", e.textNode), e.textNode = "";
		}
		function k(e, t) {
			return e.trim && (t = t.trim()), e.normalize && (t = t.replace(/\s+/g, " ")), t;
		}
		function A(e, t) {
			return O(e), e.trackPosition && (t += "\nLine: " + e.line + "\nColumn: " + e.column + "\nChar: " + e.c), t = Error(t), e.error = t, E(e, "onerror", t), e;
		}
		function j(e) {
			return e.sawRoot && !e.closedRoot && M(e, "Unclosed root tag"), e.state !== T.BEGIN && e.state !== T.BEGIN_WHITESPACE && e.state !== T.TEXT && A(e, "Unexpected end"), O(e), e.c = "", e.closed = !0, E(e, "onend"), n.call(e, e.strict, e.opt), e;
		}
		function M(e, t) {
			if (typeof e != "object" || !(e instanceof n)) throw Error("bad call to strictFail");
			e.strict && A(e, t);
		}
		function oe(e) {
			e.strict || (e.tagName = e.tagName[e.looseCase]());
			var t = e.tags[e.tags.length - 1] || e, n = e.tag = {
				name: e.tagName,
				attributes: {}
			};
			e.opt.xmlns && (n.ns = t.ns), e.attribList.length = 0, D(e, "onopentagstart", n);
		}
		function se(e, t) {
			var n = e.indexOf(":") < 0 ? ["", e] : e.split(":"), r = n[0], i = n[1];
			return t && e === "xmlns" && (r = "xmlns", i = ""), {
				prefix: r,
				local: i
			};
		}
		function ce(e) {
			if (e.strict || (e.attribName = e.attribName[e.looseCase]()), e.attribList.indexOf(e.attribName) !== -1 || e.tag.attributes.hasOwnProperty(e.attribName)) {
				e.attribName = e.attribValue = "";
				return;
			}
			if (e.opt.xmlns) {
				var t = se(e.attribName, !0), n = t.prefix, r = t.local;
				if (n === "xmlns") if (r === "xml" && e.attribValue !== p) M(e, "xml: prefix must be bound to " + p + "\nActual: " + e.attribValue);
				else if (r === "xmlns" && e.attribValue !== m) M(e, "xmlns: prefix must be bound to " + m + "\nActual: " + e.attribValue);
				else {
					var i = e.tag, a = e.tags[e.tags.length - 1] || e;
					i.ns === a.ns && (i.ns = Object.create(a.ns)), i.ns[r] = e.attribValue;
				}
				e.attribList.push([e.attribName, e.attribValue]);
			} else e.tag.attributes[e.attribName] = e.attribValue, D(e, "onattribute", {
				name: e.attribName,
				value: e.attribValue
			});
			e.attribName = e.attribValue = "";
		}
		function N(e, t) {
			if (e.opt.xmlns) {
				var n = e.tag, r = se(e.tagName);
				n.prefix = r.prefix, n.local = r.local, n.uri = n.ns[r.prefix] || "", n.prefix && !n.uri && (M(e, "Unbound namespace prefix: " + JSON.stringify(e.tagName)), n.uri = r.prefix);
				var i = e.tags[e.tags.length - 1] || e;
				n.ns && i.ns !== n.ns && Object.keys(n.ns).forEach(function(t) {
					D(e, "onopennamespace", {
						prefix: t,
						uri: n.ns[t]
					});
				});
				for (var a = 0, o = e.attribList.length; a < o; a++) {
					var s = e.attribList[a], c = s[0], l = s[1], u = se(c, !0), d = u.prefix, f = u.local, p = d === "" ? "" : n.ns[d] || "", m = {
						name: c,
						value: l,
						prefix: d,
						local: f,
						uri: p
					};
					d && d !== "xmlns" && !p && (M(e, "Unbound namespace prefix: " + JSON.stringify(d)), m.uri = d), e.tag.attributes[c] = m, D(e, "onattribute", m);
				}
				e.attribList.length = 0;
			}
			e.tag.isSelfClosing = !!t, e.sawRoot = !0, e.tags.push(e.tag), D(e, "onopentag", e.tag), t || (!e.noscript && e.tagName.toLowerCase() === "script" ? e.state = T.SCRIPT : e.state = T.TEXT, e.tag = null, e.tagName = ""), e.attribName = e.attribValue = "", e.attribList.length = 0;
		}
		function le(e) {
			if (!e.tagName) {
				M(e, "Weird empty close tag."), e.textNode += "</>", e.state = T.TEXT;
				return;
			}
			if (e.script) {
				if (e.tagName !== "script") {
					e.script += "</" + e.tagName + ">", e.tagName = "", e.state = T.SCRIPT;
					return;
				}
				D(e, "onscript", e.script), e.script = "";
			}
			var t = e.tags.length, n = e.tagName;
			e.strict || (n = n[e.looseCase]());
			for (var r = n; t-- && e.tags[t].name !== r;) M(e, "Unexpected close tag");
			if (t < 0) {
				M(e, "Unmatched closing tag: " + e.tagName), e.textNode += "</" + e.tagName + ">", e.state = T.TEXT;
				return;
			}
			e.tagName = n;
			for (var i = e.tags.length; i-- > t;) {
				var a = e.tag = e.tags.pop();
				e.tagName = e.tag.name, D(e, "onclosetag", e.tagName);
				var o = {};
				for (var s in a.ns) o[s] = a.ns[s];
				var c = e.tags[e.tags.length - 1] || e;
				e.opt.xmlns && a.ns !== c.ns && Object.keys(a.ns).forEach(function(t) {
					var n = a.ns[t];
					D(e, "onclosenamespace", {
						prefix: t,
						uri: n
					});
				});
			}
			t === 0 && (e.closedRoot = !0), e.tagName = e.attribValue = e.attribName = "", e.attribList.length = 0, e.state = T.TEXT;
		}
		function P(e) {
			var t = e.entity, n = t.toLowerCase(), r, i = "";
			return e.ENTITIES[t] ? e.ENTITIES[t] : e.ENTITIES[n] ? e.ENTITIES[n] : (t = n, t.charAt(0) === "#" && (t.charAt(1) === "x" ? (t = t.slice(2), r = parseInt(t, 16), i = r.toString(16)) : (t = t.slice(1), r = parseInt(t, 10), i = r.toString(10))), t = t.replace(/^0+/, ""), isNaN(r) || i.toLowerCase() !== t || r < 0 || r > 1114111 ? (M(e, "Invalid character entity"), "&" + e.entity + ";") : String.fromCodePoint(r));
		}
		function F(e, t) {
			t === "<" ? (e.state = T.OPEN_WAKA, e.startTagPosition = e.position) : b(t) || (M(e, "Non-whitespace before first tag."), e.textNode = t, e.state = T.TEXT);
		}
		function I(e, t) {
			var n = "";
			return t < e.length && (n = e.charAt(t)), n;
		}
		function ue(t) {
			var n = this;
			if (this.error) throw this.error;
			if (n.closed) return A(n, "Cannot write after close. Assign an onready handler.");
			if (t === null) return j(n);
			typeof t == "object" && (t = t.toString());
			for (var i = 0, a = ""; a = I(t, i++), n.c = a, a;) switch (n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++), n.state) {
				case T.BEGIN:
					if (n.state = T.BEGIN_WHITESPACE, a === "﻿") continue;
					F(n, a);
					continue;
				case T.BEGIN_WHITESPACE:
					F(n, a);
					continue;
				case T.TEXT:
					if (n.sawRoot && !n.closedRoot) {
						for (var o = i - 1; a && a !== "<" && a !== "&";) a = I(t, i++), a && n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++);
						n.textNode += t.substring(o, i - 1);
					}
					a === "<" && !(n.sawRoot && n.closedRoot && !n.strict) ? (n.state = T.OPEN_WAKA, n.startTagPosition = n.position) : (!b(a) && (!n.sawRoot || n.closedRoot) && M(n, "Text data outside of root node."), a === "&" ? n.state = T.TEXT_ENTITY : n.textNode += a);
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
						if (M(n, "Unencoded <"), n.startTagPosition + 1 < n.position) {
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
					n.doctype && n.doctype !== !0 && n.sgmlDecl ? (n.state = T.DOCTYPE_DTD, n.doctype += "<!" + n.sgmlDecl + a, n.sgmlDecl = "") : (n.sgmlDecl + a).toUpperCase() === d ? (D(n, "onopencdata"), n.state = T.CDATA, n.sgmlDecl = "", n.cdata = "") : (n.sgmlDecl + a).toUpperCase() === f ? (n.state = T.DOCTYPE, (n.doctype || n.sawRoot) && M(n, "Inappropriately located doctype declaration"), n.doctype = "", n.sgmlDecl = "") : a === ">" ? (D(n, "onsgmldeclaration", n.sgmlDecl), n.sgmlDecl = "", n.state = T.TEXT) : (x(a) && (n.state = T.SGML_DECL_QUOTED), n.sgmlDecl += a);
					continue;
				case T.SGML_DECL_QUOTED:
					a === n.q && (n.state = T.SGML_DECL, n.q = ""), n.sgmlDecl += a;
					continue;
				case T.DOCTYPE:
					a === ">" ? (n.state = T.TEXT, D(n, "ondoctype", n.doctype), n.doctype = !0) : (n.doctype += a, a === "[" ? n.state = T.DOCTYPE_DTD : x(a) && (n.state = T.DOCTYPE_QUOTED, n.q = a));
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
					a === "-" ? (n.state = T.COMMENT_ENDED, n.comment = k(n.opt, n.comment), n.comment && D(n, "oncomment", n.comment), n.comment = "") : (n.comment += "-" + a, n.state = T.COMMENT);
					continue;
				case T.COMMENT_ENDED:
					a === ">" ? n.doctype && n.doctype !== !0 ? n.state = T.DOCTYPE_DTD : n.state = T.TEXT : (M(n, "Malformed comment"), n.comment += "--" + a, n.state = T.COMMENT);
					continue;
				case T.CDATA:
					for (var o = i - 1; a && a !== "]";) a = I(t, i++), a && n.trackPosition && (n.position++, a === "\n" ? (n.line++, n.column = 0) : n.column++);
					n.cdata += t.substring(o, i - 1), a === "]" && (n.state = T.CDATA_ENDING);
					continue;
				case T.CDATA_ENDING:
					a === "]" ? n.state = T.CDATA_ENDING_2 : (n.cdata += "]" + a, n.state = T.CDATA);
					continue;
				case T.CDATA_ENDING_2:
					a === ">" ? (n.cdata && D(n, "oncdata", n.cdata), D(n, "onclosecdata"), n.cdata = "", n.state = T.TEXT) : a === "]" ? n.cdata += "]" : (n.cdata += "]]" + a, n.state = T.CDATA);
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
						ae(n, e), D(n, "onprocessinginstruction", e), n.procInstName = n.procInstBody = "", n.state = T.TEXT;
					} else n.procInstBody += "?" + a, n.state = T.PROC_INST_BODY;
					continue;
				case T.OPEN_TAG:
					w(_, a) ? n.tagName += a : (oe(n), a === ">" ? N(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : (b(a) || M(n, "Invalid character in tag name"), n.state = T.ATTRIB));
					continue;
				case T.OPEN_TAG_SLASH:
					a === ">" ? (N(n, !0), le(n)) : (M(n, "Forward-slash in opening tag not followed by >"), n.state = T.ATTRIB);
					continue;
				case T.ATTRIB:
					if (b(a)) continue;
					a === ">" ? N(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : w(g, a) ? (n.attribName = a, n.attribValue = "", n.state = T.ATTRIB_NAME) : M(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_NAME:
					a === "=" ? n.state = T.ATTRIB_VALUE : a === ">" ? (M(n, "Attribute without value"), n.attribValue = n.attribName, ce(n), N(n)) : b(a) ? n.state = T.ATTRIB_NAME_SAW_WHITE : w(_, a) ? n.attribName += a : M(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_NAME_SAW_WHITE:
					if (a === "=") n.state = T.ATTRIB_VALUE;
					else if (b(a)) continue;
					else M(n, "Attribute without value"), n.tag.attributes[n.attribName] = "", n.attribValue = "", D(n, "onattribute", {
						name: n.attribName,
						value: ""
					}), n.attribName = "", a === ">" ? N(n) : w(g, a) ? (n.attribName = a, n.state = T.ATTRIB_NAME) : (M(n, "Invalid attribute name"), n.state = T.ATTRIB);
					continue;
				case T.ATTRIB_VALUE:
					if (b(a)) continue;
					x(a) ? (n.q = a, n.state = T.ATTRIB_VALUE_QUOTED) : (n.opt.unquotedAttributeValues || A(n, "Unquoted attribute value"), n.state = T.ATTRIB_VALUE_UNQUOTED, n.attribValue = a);
					continue;
				case T.ATTRIB_VALUE_QUOTED:
					if (a !== n.q) {
						a === "&" ? n.state = T.ATTRIB_VALUE_ENTITY_Q : n.attribValue += a;
						continue;
					}
					ce(n), n.q = "", n.state = T.ATTRIB_VALUE_CLOSED;
					continue;
				case T.ATTRIB_VALUE_CLOSED:
					b(a) ? n.state = T.ATTRIB : a === ">" ? N(n) : a === "/" ? n.state = T.OPEN_TAG_SLASH : w(g, a) ? (M(n, "No whitespace between attributes"), n.attribName = a, n.attribValue = "", n.state = T.ATTRIB_NAME) : M(n, "Invalid attribute name");
					continue;
				case T.ATTRIB_VALUE_UNQUOTED:
					if (!S(a)) {
						a === "&" ? n.state = T.ATTRIB_VALUE_ENTITY_U : n.attribValue += a;
						continue;
					}
					ce(n), a === ">" ? N(n) : n.state = T.ATTRIB;
					continue;
				case T.CLOSE_TAG:
					if (n.tagName) a === ">" ? le(n) : w(_, a) ? n.tagName += a : n.script ? (n.script += "</" + n.tagName + a, n.tagName = "", n.state = T.SCRIPT) : (b(a) || M(n, "Invalid tagname in closing tag"), n.state = T.CLOSE_TAG_SAW_WHITE);
					else {
						if (b(a)) continue;
						ee(g, a) ? n.script ? (n.script += "</" + a, n.state = T.SCRIPT) : M(n, "Invalid tagname in closing tag.") : n.tagName = a;
					}
					continue;
				case T.CLOSE_TAG_SAW_WHITE:
					if (b(a)) continue;
					a === ">" ? le(n) : M(n, "Invalid characters in closing tag");
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
						var u = P(n);
						n.opt.unparsedEntities && !Object.values(e.XML_ENTITIES).includes(u) ? ((n.entityCount += 1) > n.opt.maxEntityCount && A(n, "Parsed entity count exceeds max entity count"), (n.entityDepth += 1) > n.opt.maxEntityDepth && A(n, "Parsed entity depth exceeds max entity depth"), n.entity = "", n.state = c, n.write(u), --n.entityDepth) : (n[l] += u, n.entity = "", n.state = c);
					} else w(n.entity.length ? y : v, a) ? n.entity += a : (M(n, "Invalid character in entity name"), n[l] += "&" + n.entity + a, n.entity = "", n.state = c);
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
})), Ln = /* @__PURE__ */ v(((e) => {
	(function() {
		e.stripBOM = function(e) {
			return e[0] === "﻿" ? e.substring(1) : e;
		};
	}).call(e);
})), Rn = /* @__PURE__ */ v(((e) => {
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
})), zn = /* @__PURE__ */ v(((e) => {
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
		s = In(), r = C("events"), t = Ln(), o = Rn(), c = C("timers").setImmediate, n = rn().defaults, i = function(e) {
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
})), Bn = /* @__PURE__ */ v(((e) => {
	(function() {
		var t, n, r, i, a = function(e, t) {
			for (var n in t) o.call(t, n) && (e[n] = t[n]);
			function r() {
				this.constructor = e;
			}
			return r.prototype = t.prototype, e.prototype = new r(), e.__super__ = t.prototype, e;
		}, o = {}.hasOwnProperty;
		n = rn(), t = Fn(), r = zn(), i = Rn(), e.defaults = n.defaults, e.processors = i, e.ValidationError = (function(e) {
			a(t, e);
			function t(e) {
				this.message = e;
			}
			return t;
		})(Error), e.Builder = t.Builder, e.Parser = r.Parser, e.parseString = r.parseString, e.parseStringPromise = r.parseStringPromise;
	}).call(e);
})), Vn = /* @__PURE__ */ v(((e, t) => {
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
})), Hn = /* @__PURE__ */ y({
	AElig: () => "Æ",
	AMP: () => "&",
	Aacute: () => "Á",
	Abreve: () => "Ă",
	Acirc: () => "Â",
	Acy: () => "А",
	Afr: () => Wn,
	Agrave: () => "À",
	Alpha: () => "Α",
	Amacr: () => "Ā",
	And: () => "⩓",
	Aogon: () => "Ą",
	Aopf: () => Kn,
	ApplyFunction: () => "⁡",
	Aring: () => "Å",
	Ascr: () => Jn,
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
	Bfr: () => Xn,
	Bopf: () => er,
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
	Cscr: () => or,
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
	Dfr: () => lr,
	DiacriticalAcute: () => "´",
	DiacriticalDot: () => "˙",
	DiacriticalDoubleAcute: () => "˝",
	DiacriticalGrave: () => "`",
	DiacriticalTilde: () => "˜",
	Diamond: () => "⋄",
	DifferentialD: () => "ⅆ",
	Dopf: () => dr,
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
	Dscr: () => pr,
	Dstrok: () => "Đ",
	ENG: () => "Ŋ",
	ETH: () => "Ð",
	Eacute: () => "É",
	Ecaron: () => "Ě",
	Ecirc: () => "Ê",
	Ecy: () => "Э",
	Edot: () => "Ė",
	Efr: () => hr,
	Egrave: () => "È",
	Element: () => "∈",
	Emacr: () => "Ē",
	EmptySmallSquare: () => "◻",
	EmptyVerySmallSquare: () => "▫",
	Eogon: () => "Ę",
	Eopf: () => _r,
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
	Ffr: () => yr,
	FilledSmallSquare: () => "◼",
	FilledVerySmallSquare: () => "▪",
	Fopf: () => xr,
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
	Gfr: () => Tr,
	Gg: () => "⋙",
	Gopf: () => Dr,
	GreaterEqual: () => "≥",
	GreaterEqualLess: () => "⋛",
	GreaterFullEqual: () => "≧",
	GreaterGreater: () => "⪢",
	GreaterLess: () => "≷",
	GreaterSlantEqual: () => "⩾",
	GreaterTilde: () => "≳",
	Gscr: () => kr,
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
	Iopf: () => Ir,
	Iota: () => "Ι",
	Iscr: () => "ℐ",
	Itilde: () => "Ĩ",
	Iukcy: () => "І",
	Iuml: () => "Ï",
	Jcirc: () => "Ĵ",
	Jcy: () => "Й",
	Jfr: () => zr,
	Jopf: () => Vr,
	Jscr: () => Ur,
	Jsercy: () => "Ј",
	Jukcy: () => "Є",
	KHcy: () => "Х",
	KJcy: () => "Ќ",
	Kappa: () => "Κ",
	Kcedil: () => "Ķ",
	Kcy: () => "К",
	Kfr: () => Gr,
	Kopf: () => qr,
	Kscr: () => Yr,
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
	Lfr: () => $r,
	Ll: () => "⋘",
	Lleftarrow: () => "⇚",
	Lmidot: () => "Ŀ",
	LongLeftArrow: () => "⟵",
	LongLeftRightArrow: () => "⟷",
	LongRightArrow: () => "⟶",
	Longleftarrow: () => "⟸",
	Longleftrightarrow: () => "⟺",
	Longrightarrow: () => "⟹",
	Lopf: () => ti,
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
	Mfr: () => oi,
	MinusPlus: () => "∓",
	Mopf: () => ci,
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
	Nfr: () => yi,
	NoBreak: () => "⁠",
	NonBreakingSpace: () => "\xA0",
	Nopf: () => "ℕ",
	Not: () => "⫬",
	NotCongruent: () => "≢",
	NotCupCap: () => "≭",
	NotDoubleVerticalBar: () => "∦",
	NotElement: () => "∉",
	NotEqual: () => "≠",
	NotEqualTilde: () => Ii,
	NotExists: () => "∄",
	NotGreater: () => "≯",
	NotGreaterEqual: () => "≱",
	NotGreaterFullEqual: () => Li,
	NotGreaterGreater: () => Ri,
	NotGreaterLess: () => "≹",
	NotGreaterSlantEqual: () => zi,
	NotGreaterTilde: () => "≵",
	NotHumpDownHump: () => Bi,
	NotHumpEqual: () => Vi,
	NotLeftTriangle: () => "⋪",
	NotLeftTriangleBar: () => Wi,
	NotLeftTriangleEqual: () => "⋬",
	NotLess: () => "≮",
	NotLessEqual: () => "≰",
	NotLessGreater: () => "≸",
	NotLessLess: () => Gi,
	NotLessSlantEqual: () => Ki,
	NotLessTilde: () => "≴",
	NotNestedGreaterGreater: () => qi,
	NotNestedLessLess: () => Ji,
	NotPrecedes: () => "⊀",
	NotPrecedesEqual: () => Yi,
	NotPrecedesSlantEqual: () => "⋠",
	NotReverseElement: () => "∌",
	NotRightTriangle: () => "⋫",
	NotRightTriangleBar: () => Xi,
	NotRightTriangleEqual: () => "⋭",
	NotSquareSubset: () => Zi,
	NotSquareSubsetEqual: () => "⋢",
	NotSquareSuperset: () => Qi,
	NotSquareSupersetEqual: () => "⋣",
	NotSubset: () => $i,
	NotSubsetEqual: () => "⊈",
	NotSucceeds: () => "⊁",
	NotSucceedsEqual: () => ea,
	NotSucceedsSlantEqual: () => "⋡",
	NotSucceedsTilde: () => ta,
	NotSuperset: () => na,
	NotSupersetEqual: () => "⊉",
	NotTilde: () => "≁",
	NotTildeEqual: () => "≄",
	NotTildeFullEqual: () => "≇",
	NotTildeTilde: () => "≉",
	NotVerticalBar: () => "∤",
	Nscr: () => ua,
	Ntilde: () => "Ñ",
	Nu: () => "Ν",
	OElig: () => "Œ",
	Oacute: () => "Ó",
	Ocirc: () => "Ô",
	Ocy: () => "О",
	Odblac: () => "Ő",
	Ofr: () => Da,
	Ograve: () => "Ò",
	Omacr: () => "Ō",
	Omega: () => "Ω",
	Omicron: () => "Ο",
	Oopf: () => ka,
	OpenCurlyDoubleQuote: () => "“",
	OpenCurlyQuote: () => "‘",
	Or: () => "⩔",
	Oscr: () => ja,
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
	Pfr: () => Ma,
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
	Pscr: () => Fa,
	Psi: () => "Ψ",
	QUOT: () => "\"",
	Qfr: () => La,
	Qopf: () => "ℚ",
	Qscr: () => Ba,
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
	Sfr: () => Ka,
	ShortDownArrow: () => "↓",
	ShortLeftArrow: () => "←",
	ShortRightArrow: () => "→",
	ShortUpArrow: () => "↑",
	Sigma: () => "Σ",
	SmallCircle: () => "∘",
	Sopf: () => Ya,
	Sqrt: () => "√",
	Square: () => "□",
	SquareIntersection: () => "⊓",
	SquareSubset: () => "⊏",
	SquareSubsetEqual: () => "⊑",
	SquareSuperset: () => "⊐",
	SquareSupersetEqual: () => "⊒",
	SquareUnion: () => "⊔",
	Sscr: () => $a,
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
	Tfr: () => to,
	Therefore: () => "∴",
	Theta: () => "Θ",
	ThickSpace: () => ro,
	ThinSpace: () => " ",
	Tilde: () => "∼",
	TildeEqual: () => "≃",
	TildeFullEqual: () => "≅",
	TildeTilde: () => "≈",
	Topf: () => io,
	TripleDot: () => "⃛",
	Tscr: () => oo,
	Tstrok: () => "Ŧ",
	Uacute: () => "Ú",
	Uarr: () => "↟",
	Uarrocir: () => "⥉",
	Ubrcy: () => "Ў",
	Ubreve: () => "Ŭ",
	Ucirc: () => "Û",
	Ucy: () => "У",
	Udblac: () => "Ű",
	Ufr: () => co,
	Ugrave: () => "Ù",
	Umacr: () => "Ū",
	UnderBar: () => "_",
	UnderBrace: () => "⏟",
	UnderBracket: () => "⎵",
	UnderParenthesis: () => "⏝",
	Union: () => "⋃",
	UnionPlus: () => "⊎",
	Uogon: () => "Ų",
	Uopf: () => uo,
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
	Uscr: () => po,
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
	Vfr: () => yo,
	Vopf: () => Co,
	Vscr: () => To,
	Vvdash: () => "⊪",
	Wcirc: () => "Ŵ",
	Wedge: () => "⋀",
	Wfr: () => jo,
	Wopf: () => No,
	Wscr: () => Fo,
	Xfr: () => Lo,
	Xi: () => "Ξ",
	Xopf: () => zo,
	Xscr: () => Vo,
	YAcy: () => "Я",
	YIcy: () => "Ї",
	YUcy: () => "Ю",
	Yacute: () => "Ý",
	Ycirc: () => "Ŷ",
	Ycy: () => "Ы",
	Yfr: () => Uo,
	Yopf: () => Go,
	Yscr: () => qo,
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
	Zscr: () => Zo,
	aacute: () => "á",
	abreve: () => "ă",
	ac: () => "∾",
	acE: () => Un,
	acd: () => "∿",
	acirc: () => "â",
	acute: () => "´",
	acy: () => "а",
	aelig: () => "æ",
	af: () => "⁡",
	afr: () => Gn,
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
	aopf: () => qn,
	ap: () => "≈",
	apE: () => "⩰",
	apacir: () => "⩯",
	ape: () => "≊",
	apid: () => "≋",
	apos: () => "'",
	approx: () => "≈",
	approxeq: () => "≊",
	aring: () => "å",
	ascr: () => Yn,
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
	bfr: () => Zn,
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
	bne: () => Qn,
	bnequiv: () => $n,
	bnot: () => "⌐",
	bopf: () => tr,
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
	bscr: () => nr,
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
	caps: () => rr,
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
	cfr: () => ir,
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
	copf: () => ar,
	coprod: () => "∐",
	copy: () => "©",
	copysr: () => "℗",
	crarr: () => "↵",
	cross: () => "✗",
	cscr: () => sr,
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
	cups: () => cr,
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
	default: () => $o,
	deg: () => "°",
	delta: () => "δ",
	demptyv: () => "⦱",
	dfisht: () => "⥿",
	dfr: () => ur,
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
	dopf: () => fr,
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
	dscr: () => mr,
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
	efr: () => gr,
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
	eopf: () => vr,
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
	ffr: () => br,
	filig: () => "ﬁ",
	fjlig: () => "fj",
	flat: () => "♭",
	fllig: () => "ﬂ",
	fltns: () => "▱",
	fnof: () => "ƒ",
	fopf: () => Sr,
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
	fscr: () => Cr,
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
	gesl: () => wr,
	gesles: () => "⪔",
	gfr: () => Er,
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
	gopf: () => Or,
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
	gvertneqq: () => Ar,
	gvnE: () => jr,
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
	hfr: () => Mr,
	hksearow: () => "⤥",
	hkswarow: () => "⤦",
	hoarr: () => "⇿",
	homtht: () => "∻",
	hookleftarrow: () => "↩",
	hookrightarrow: () => "↪",
	hopf: () => Nr,
	horbar: () => "―",
	hscr: () => Pr,
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
	ifr: () => Fr,
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
	iopf: () => Lr,
	iota: () => "ι",
	iprod: () => "⨼",
	iquest: () => "¿",
	iscr: () => Rr,
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
	jfr: () => Br,
	jmath: () => "ȷ",
	jopf: () => Hr,
	jscr: () => Wr,
	jsercy: () => "ј",
	jukcy: () => "є",
	kappa: () => "κ",
	kappav: () => "ϰ",
	kcedil: () => "ķ",
	kcy: () => "к",
	kfr: () => Kr,
	kgreen: () => "ĸ",
	khcy: () => "х",
	kjcy: () => "ќ",
	kopf: () => Jr,
	kscr: () => Xr,
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
	lates: () => Zr,
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
	lesg: () => Qr,
	lesges: () => "⪓",
	lessapprox: () => "⪅",
	lessdot: () => "⋖",
	lesseqgtr: () => "⋚",
	lesseqqgtr: () => "⪋",
	lessgtr: () => "≶",
	lesssim: () => "≲",
	lfisht: () => "⥼",
	lfloor: () => "⌊",
	lfr: () => ei,
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
	lopf: () => ni,
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
	lscr: () => ri,
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
	lvertneqq: () => ii,
	lvnE: () => ai,
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
	mfr: () => si,
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
	mopf: () => li,
	mp: () => "∓",
	mscr: () => ui,
	mstpos: () => "∾",
	mu: () => "μ",
	multimap: () => "⊸",
	mumap: () => "⊸",
	nGg: () => Ti,
	nGt: () => Ei,
	nGtv: () => Di,
	nLeftarrow: () => "⇍",
	nLeftrightarrow: () => "⇎",
	nLl: () => Mi,
	nLt: () => Ni,
	nLtv: () => Pi,
	nRightarrow: () => "⇏",
	nVDash: () => "⊯",
	nVdash: () => "⊮",
	nabla: () => "∇",
	nacute: () => "ń",
	nang: () => di,
	nap: () => "≉",
	napE: () => fi,
	napid: () => pi,
	napos: () => "ŉ",
	napprox: () => "≉",
	natur: () => "♮",
	natural: () => "♮",
	naturals: () => "ℕ",
	nbsp: () => "\xA0",
	nbump: () => mi,
	nbumpe: () => hi,
	ncap: () => "⩃",
	ncaron: () => "ň",
	ncedil: () => "ņ",
	ncong: () => "≇",
	ncongdot: () => gi,
	ncup: () => "⩂",
	ncy: () => "н",
	ndash: () => "–",
	ne: () => "≠",
	neArr: () => "⇗",
	nearhk: () => "⤤",
	nearr: () => "↗",
	nearrow: () => "↗",
	nedot: () => _i,
	nequiv: () => "≢",
	nesear: () => "⤨",
	nesim: () => vi,
	nexist: () => "∄",
	nexists: () => "∄",
	nfr: () => bi,
	ngE: () => xi,
	nge: () => "≱",
	ngeq: () => "≱",
	ngeqq: () => Si,
	ngeqslant: () => Ci,
	nges: () => wi,
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
	nlE: () => Oi,
	nlarr: () => "↚",
	nldr: () => "‥",
	nle: () => "≰",
	nleftarrow: () => "↚",
	nleftrightarrow: () => "↮",
	nleq: () => "≰",
	nleqq: () => ki,
	nleqslant: () => Ai,
	nles: () => ji,
	nless: () => "≮",
	nlsim: () => "≴",
	nlt: () => "≮",
	nltri: () => "⋪",
	nltrie: () => "⋬",
	nmid: () => "∤",
	nopf: () => Fi,
	not: () => "¬",
	notin: () => "∉",
	notinE: () => Ui,
	notindot: () => Hi,
	notinva: () => "∉",
	notinvb: () => "⋷",
	notinvc: () => "⋶",
	notni: () => "∌",
	notniva: () => "∌",
	notnivb: () => "⋾",
	notnivc: () => "⋽",
	npar: () => "∦",
	nparallel: () => "∦",
	nparsl: () => ra,
	npart: () => ia,
	npolint: () => "⨔",
	npr: () => "⊀",
	nprcue: () => "⋠",
	npre: () => oa,
	nprec: () => "⊀",
	npreceq: () => aa,
	nrArr: () => "⇏",
	nrarr: () => "↛",
	nrarrc: () => sa,
	nrarrw: () => ca,
	nrightarrow: () => "↛",
	nrtri: () => "⋫",
	nrtrie: () => "⋭",
	nsc: () => "⊁",
	nsccue: () => "⋡",
	nsce: () => la,
	nscr: () => da,
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
	nsubE: () => fa,
	nsube: () => "⊈",
	nsubset: () => pa,
	nsubseteq: () => "⊈",
	nsubseteqq: () => ma,
	nsucc: () => "⊁",
	nsucceq: () => ha,
	nsup: () => "⊅",
	nsupE: () => ga,
	nsupe: () => "⊉",
	nsupset: () => _a,
	nsupseteq: () => "⊉",
	nsupseteqq: () => va,
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
	nvap: () => ya,
	nvdash: () => "⊬",
	nvge: () => ba,
	nvgt: () => xa,
	nvinfin: () => "⧞",
	nvlArr: () => "⤂",
	nvle: () => Sa,
	nvlt: () => Ca,
	nvltrie: () => wa,
	nvrArr: () => "⤃",
	nvrtrie: () => Ta,
	nvsim: () => Ea,
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
	ofr: () => Oa,
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
	oopf: () => Aa,
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
	pfr: () => Na,
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
	popf: () => Pa,
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
	pscr: () => Ia,
	psi: () => "ψ",
	puncsp: () => " ",
	qfr: () => Ra,
	qint: () => "⨌",
	qopf: () => za,
	qprime: () => "⁗",
	qscr: () => Va,
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
	race: () => Ha,
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
	rfr: () => Ua,
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
	ropf: () => Wa,
	roplus: () => "⨮",
	rotimes: () => "⨵",
	rpar: () => ")",
	rpargt: () => "⦔",
	rppolint: () => "⨒",
	rrarr: () => "⇉",
	rsaquo: () => "›",
	rscr: () => Ga,
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
	sfr: () => qa,
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
	smtes: () => Ja,
	softcy: () => "ь",
	sol: () => "/",
	solb: () => "⧄",
	solbar: () => "⌿",
	sopf: () => Xa,
	spades: () => "♠",
	spadesuit: () => "♠",
	spar: () => "∥",
	sqcap: () => "⊓",
	sqcaps: () => Za,
	sqcup: () => "⊔",
	sqcups: () => Qa,
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
	sscr: () => eo,
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
	tfr: () => no,
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
	topf: () => ao,
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
	tscr: () => so,
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
	ufr: () => lo,
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
	uopf: () => fo,
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
	uscr: () => mo,
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
	varsubsetneq: () => ho,
	varsubsetneqq: () => go,
	varsupsetneq: () => _o,
	varsupsetneqq: () => vo,
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
	vfr: () => bo,
	vltri: () => "⊲",
	vnsub: () => xo,
	vnsup: () => So,
	vopf: () => wo,
	vprop: () => "∝",
	vrtri: () => "⊳",
	vscr: () => Eo,
	vsubnE: () => Do,
	vsubne: () => Oo,
	vsupnE: () => ko,
	vsupne: () => Ao,
	vzigzag: () => "⦚",
	wcirc: () => "ŵ",
	wedbar: () => "⩟",
	wedge: () => "∧",
	wedgeq: () => "≙",
	weierp: () => "℘",
	wfr: () => Mo,
	wopf: () => Po,
	wp: () => "℘",
	wr: () => "≀",
	wreath: () => "≀",
	wscr: () => Io,
	xcap: () => "⋂",
	xcirc: () => "◯",
	xcup: () => "⋃",
	xdtri: () => "▽",
	xfr: () => Ro,
	xhArr: () => "⟺",
	xharr: () => "⟷",
	xi: () => "ξ",
	xlArr: () => "⟸",
	xlarr: () => "⟵",
	xmap: () => "⟼",
	xnis: () => "⋻",
	xodot: () => "⨀",
	xopf: () => Bo,
	xoplus: () => "⨁",
	xotime: () => "⨂",
	xrArr: () => "⟹",
	xrarr: () => "⟶",
	xscr: () => Ho,
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
	yfr: () => Wo,
	yicy: () => "ї",
	yopf: () => Ko,
	yscr: () => Jo,
	yucy: () => "ю",
	yuml: () => "ÿ",
	zacute: () => "ź",
	zcaron: () => "ž",
	zcy: () => "з",
	zdot: () => "ż",
	zeetrf: () => "ℨ",
	zeta: () => "ζ",
	zfr: () => Yo,
	zhcy: () => "ж",
	zigrarr: () => "⇝",
	zopf: () => Xo,
	zscr: () => Qo,
	zwj: () => "‍",
	zwnj: () => "‌"
}), Un, Wn, Gn, Kn, qn, Jn, Yn, Xn, Zn, Qn, $n, er, tr, nr, rr, ir, ar, or, sr, cr, lr, ur, dr, fr, pr, mr, hr, gr, _r, vr, yr, br, xr, Sr, Cr, wr, Tr, Er, Dr, Or, kr, Ar, jr, Mr, Nr, Pr, Fr, Ir, Lr, Rr, zr, Br, Vr, Hr, Ur, Wr, Gr, Kr, qr, Jr, Yr, Xr, Zr, Qr, $r, ei, ti, ni, ri, ii, ai, oi, si, ci, li, ui, di, fi, pi, mi, hi, gi, _i, vi, yi, bi, xi, Si, Ci, wi, Ti, Ei, Di, Oi, ki, Ai, ji, Mi, Ni, Pi, Fi, Ii, Li, Ri, zi, Bi, Vi, Hi, Ui, Wi, Gi, Ki, qi, Ji, Yi, Xi, Zi, Qi, $i, ea, ta, na, ra, ia, aa, oa, sa, ca, la, ua, da, fa, pa, ma, ha, ga, _a, va, ya, ba, xa, Sa, Ca, wa, Ta, Ea, Da, Oa, ka, Aa, ja, Ma, Na, Pa, Fa, Ia, La, Ra, za, Ba, Va, Ha, Ua, Wa, Ga, Ka, qa, Ja, Ya, Xa, Za, Qa, $a, eo, to, no, ro, io, ao, oo, so, co, lo, uo, fo, po, mo, ho, go, _o, vo, yo, bo, xo, So, Co, wo, To, Eo, Do, Oo, ko, Ao, jo, Mo, No, Po, Fo, Io, Lo, Ro, zo, Bo, Vo, Ho, Uo, Wo, Go, Ko, qo, Jo, Yo, Xo, Zo, Qo, $o, es = _((() => {
	Un = "∾̳", Wn = "𝔄", Gn = "𝔞", Kn = "𝔸", qn = "𝕒", Jn = "𝒜", Yn = "𝒶", Xn = "𝔅", Zn = "𝔟", Qn = "=⃥", $n = "≡⃥", er = "𝔹", tr = "𝕓", nr = "𝒷", rr = "∩︀", ir = "𝔠", ar = "𝕔", or = "𝒞", sr = "𝒸", cr = "∪︀", lr = "𝔇", ur = "𝔡", dr = "𝔻", fr = "𝕕", pr = "𝒟", mr = "𝒹", hr = "𝔈", gr = "𝔢", _r = "𝔼", vr = "𝕖", yr = "𝔉", br = "𝔣", xr = "𝔽", Sr = "𝕗", Cr = "𝒻", wr = "⋛︀", Tr = "𝔊", Er = "𝔤", Dr = "𝔾", Or = "𝕘", kr = "𝒢", Ar = "≩︀", jr = "≩︀", Mr = "𝔥", Nr = "𝕙", Pr = "𝒽", Fr = "𝔦", Ir = "𝕀", Lr = "𝕚", Rr = "𝒾", zr = "𝔍", Br = "𝔧", Vr = "𝕁", Hr = "𝕛", Ur = "𝒥", Wr = "𝒿", Gr = "𝔎", Kr = "𝔨", qr = "𝕂", Jr = "𝕜", Yr = "𝒦", Xr = "𝓀", Zr = "⪭︀", Qr = "⋚︀", $r = "𝔏", ei = "𝔩", ti = "𝕃", ni = "𝕝", ri = "𝓁", ii = "≨︀", ai = "≨︀", oi = "𝔐", si = "𝔪", ci = "𝕄", li = "𝕞", ui = "𝓂", di = "∠⃒", fi = "⩰̸", pi = "≋̸", mi = "≎̸", hi = "≏̸", gi = "⩭̸", _i = "≐̸", vi = "≂̸", yi = "𝔑", bi = "𝔫", xi = "≧̸", Si = "≧̸", Ci = "⩾̸", wi = "⩾̸", Ti = "⋙̸", Ei = "≫⃒", Di = "≫̸", Oi = "≦̸", ki = "≦̸", Ai = "⩽̸", ji = "⩽̸", Mi = "⋘̸", Ni = "≪⃒", Pi = "≪̸", Fi = "𝕟", Ii = "≂̸", Li = "≧̸", Ri = "≫̸", zi = "⩾̸", Bi = "≎̸", Vi = "≏̸", Hi = "⋵̸", Ui = "⋹̸", Wi = "⧏̸", Gi = "≪̸", Ki = "⩽̸", qi = "⪢̸", Ji = "⪡̸", Yi = "⪯̸", Xi = "⧐̸", Zi = "⊏̸", Qi = "⊐̸", $i = "⊂⃒", ea = "⪰̸", ta = "≿̸", na = "⊃⃒", ra = "⫽⃥", ia = "∂̸", aa = "⪯̸", oa = "⪯̸", sa = "⤳̸", ca = "↝̸", la = "⪰̸", ua = "𝒩", da = "𝓃", fa = "⫅̸", pa = "⊂⃒", ma = "⫅̸", ha = "⪰̸", ga = "⫆̸", _a = "⊃⃒", va = "⫆̸", ya = "≍⃒", ba = "≥⃒", xa = ">⃒", Sa = "≤⃒", Ca = "<⃒", wa = "⊴⃒", Ta = "⊵⃒", Ea = "∼⃒", Da = "𝔒", Oa = "𝔬", ka = "𝕆", Aa = "𝕠", ja = "𝒪", Ma = "𝔓", Na = "𝔭", Pa = "𝕡", Fa = "𝒫", Ia = "𝓅", La = "𝔔", Ra = "𝔮", za = "𝕢", Ba = "𝒬", Va = "𝓆", Ha = "∽̱", Ua = "𝔯", Wa = "𝕣", Ga = "𝓇", Ka = "𝔖", qa = "𝔰", Ja = "⪬︀", Ya = "𝕊", Xa = "𝕤", Za = "⊓︀", Qa = "⊔︀", $a = "𝒮", eo = "𝓈", to = "𝔗", no = "𝔱", ro = "  ", io = "𝕋", ao = "𝕥", oo = "𝒯", so = "𝓉", co = "𝔘", lo = "𝔲", uo = "𝕌", fo = "𝕦", po = "𝒰", mo = "𝓊", ho = "⊊︀", go = "⫋︀", _o = "⊋︀", vo = "⫌︀", yo = "𝔙", bo = "𝔳", xo = "⊂⃒", So = "⊃⃒", Co = "𝕍", wo = "𝕧", To = "𝒱", Eo = "𝓋", Do = "⫋︀", Oo = "⊊︀", ko = "⫌︀", Ao = "⊋︀", jo = "𝔚", Mo = "𝔴", No = "𝕎", Po = "𝕨", Fo = "𝒲", Io = "𝓌", Lo = "𝔛", Ro = "𝔵", zo = "𝕏", Bo = "𝕩", Vo = "𝒳", Ho = "𝓍", Uo = "𝔜", Wo = "𝔶", Go = "𝕐", Ko = "𝕪", qo = "𝒴", Jo = "𝓎", Yo = "𝔷", Xo = "𝕫", Zo = "𝒵", Qo = "𝓏", $o = {
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: Un,
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: Wn,
		afr: Gn,
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
		Aopf: Kn,
		aopf: qn,
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
		Ascr: Jn,
		ascr: Yn,
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
		Bfr: Xn,
		bfr: Zn,
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
		bne: Qn,
		bnequiv: $n,
		bNot: "⫭",
		bnot: "⌐",
		Bopf: er,
		bopf: tr,
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
		bscr: nr,
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
		caps: rr,
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
		cfr: ir,
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
		copf: ar,
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
		Cscr: or,
		cscr: sr,
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
		cups: cr,
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
		Dfr: lr,
		dfr: ur,
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
		Dopf: dr,
		dopf: fr,
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
		Dscr: pr,
		dscr: mr,
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
		Efr: hr,
		efr: gr,
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
		Eopf: _r,
		eopf: vr,
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
		Ffr: yr,
		ffr: br,
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: xr,
		fopf: Sr,
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
		fscr: Cr,
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
		gesl: wr,
		gesles: "⪔",
		Gfr: Tr,
		gfr: Er,
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
		Gopf: Dr,
		gopf: Or,
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: kr,
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
		gvertneqq: Ar,
		gvnE: jr,
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
		hfr: Mr,
		Hfr: "ℌ",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		hopf: Nr,
		Hopf: "ℍ",
		horbar: "―",
		HorizontalLine: "─",
		hscr: Pr,
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
		ifr: Fr,
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
		Iopf: Ir,
		iopf: Lr,
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		iscr: Rr,
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
		Jfr: zr,
		jfr: Br,
		jmath: "ȷ",
		Jopf: Vr,
		jopf: Hr,
		Jscr: Ur,
		jscr: Wr,
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
		Kfr: Gr,
		kfr: Kr,
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: qr,
		kopf: Jr,
		Kscr: Yr,
		kscr: Xr,
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
		lates: Zr,
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
		lesg: Qr,
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
		Lfr: $r,
		lfr: ei,
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
		Lopf: ti,
		lopf: ni,
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
		lscr: ri,
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
		lvertneqq: ii,
		lvnE: ai,
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
		Mfr: oi,
		mfr: si,
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
		Mopf: ci,
		mopf: li,
		mp: "∓",
		mscr: ui,
		Mscr: "ℳ",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: di,
		nap: "≉",
		napE: fi,
		napid: pi,
		napos: "ŉ",
		napprox: "≉",
		natural: "♮",
		naturals: "ℕ",
		natur: "♮",
		nbsp: "\xA0",
		nbump: mi,
		nbumpe: hi,
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: gi,
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		nearhk: "⤤",
		nearr: "↗",
		neArr: "⇗",
		nearrow: "↗",
		ne: "≠",
		nedot: _i,
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: vi,
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: "\n",
		nexist: "∄",
		nexists: "∄",
		Nfr: yi,
		nfr: bi,
		ngE: xi,
		nge: "≱",
		ngeq: "≱",
		ngeqq: Si,
		ngeqslant: Ci,
		nges: wi,
		nGg: Ti,
		ngsim: "≵",
		nGt: Ei,
		ngt: "≯",
		ngtr: "≯",
		nGtv: Di,
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
		nlE: Oi,
		nle: "≰",
		nleftarrow: "↚",
		nLeftarrow: "⇍",
		nleftrightarrow: "↮",
		nLeftrightarrow: "⇎",
		nleq: "≰",
		nleqq: ki,
		nleqslant: Ai,
		nles: ji,
		nless: "≮",
		nLl: Mi,
		nlsim: "≴",
		nLt: Ni,
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: Pi,
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		nopf: Fi,
		Nopf: "ℕ",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: Ii,
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: Li,
		NotGreaterGreater: Ri,
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: zi,
		NotGreaterTilde: "≵",
		NotHumpDownHump: Bi,
		NotHumpEqual: Vi,
		notin: "∉",
		notindot: Hi,
		notinE: Ui,
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangleBar: Wi,
		NotLeftTriangle: "⋪",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: Gi,
		NotLessSlantEqual: Ki,
		NotLessTilde: "≴",
		NotNestedGreaterGreater: qi,
		NotNestedLessLess: Ji,
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: Yi,
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangleBar: Xi,
		NotRightTriangle: "⋫",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: Zi,
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: Qi,
		NotSquareSupersetEqual: "⋣",
		NotSubset: $i,
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: ea,
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: ta,
		NotSuperset: na,
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		nparallel: "∦",
		npar: "∦",
		nparsl: ra,
		npart: ia,
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		nprec: "⊀",
		npreceq: aa,
		npre: oa,
		nrarrc: sa,
		nrarr: "↛",
		nrArr: "⇏",
		nrarrw: ca,
		nrightarrow: "↛",
		nRightarrow: "⇏",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: la,
		Nscr: ua,
		nscr: da,
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
		nsubE: fa,
		nsube: "⊈",
		nsubset: pa,
		nsubseteq: "⊈",
		nsubseteqq: ma,
		nsucc: "⊁",
		nsucceq: ha,
		nsup: "⊅",
		nsupE: ga,
		nsupe: "⊉",
		nsupset: _a,
		nsupseteq: "⊉",
		nsupseteqq: va,
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
		nvap: ya,
		nvdash: "⊬",
		nvDash: "⊭",
		nVdash: "⊮",
		nVDash: "⊯",
		nvge: ba,
		nvgt: xa,
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: Sa,
		nvlt: Ca,
		nvltrie: wa,
		nvrArr: "⤃",
		nvrtrie: Ta,
		nvsim: Ea,
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
		Ofr: Da,
		ofr: Oa,
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
		Oopf: ka,
		oopf: Aa,
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
		Oscr: ja,
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
		Pfr: Ma,
		pfr: Na,
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
		popf: Pa,
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
		Pscr: Fa,
		pscr: Ia,
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: La,
		qfr: Ra,
		qint: "⨌",
		qopf: za,
		Qopf: "ℚ",
		qprime: "⁗",
		Qscr: Ba,
		qscr: Va,
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		quot: "\"",
		QUOT: "\"",
		rAarr: "⇛",
		race: Ha,
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
		rfr: Ua,
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
		ropf: Wa,
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
		rscr: Ga,
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
		Sfr: Ka,
		sfr: qa,
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
		smtes: Ja,
		SOFTcy: "Ь",
		softcy: "ь",
		solbar: "⌿",
		solb: "⧄",
		sol: "/",
		Sopf: Ya,
		sopf: Xa,
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: Za,
		sqcup: "⊔",
		sqcups: Qa,
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
		Sscr: $a,
		sscr: eo,
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
		Tfr: to,
		tfr: no,
		there4: "∴",
		therefore: "∴",
		Therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: ro,
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
		Topf: io,
		topf: ao,
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
		Tscr: oo,
		tscr: so,
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
		Ufr: co,
		ufr: lo,
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
		Uopf: uo,
		uopf: fo,
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
		Uscr: po,
		uscr: mo,
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
		varsubsetneq: ho,
		varsubsetneqq: go,
		varsupsetneq: _o,
		varsupsetneqq: vo,
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
		Vfr: yo,
		vfr: bo,
		vltri: "⊲",
		vnsub: xo,
		vnsup: So,
		Vopf: Co,
		vopf: wo,
		vprop: "∝",
		vrtri: "⊳",
		Vscr: To,
		vscr: Eo,
		vsubnE: Do,
		vsubne: Oo,
		vsupnE: ko,
		vsupne: Ao,
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		wedge: "∧",
		Wedge: "⋀",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: jo,
		wfr: Mo,
		Wopf: No,
		wopf: Po,
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: Fo,
		wscr: Io,
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: Lo,
		xfr: Ro,
		xharr: "⟷",
		xhArr: "⟺",
		Xi: "Ξ",
		xi: "ξ",
		xlarr: "⟵",
		xlArr: "⟸",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: zo,
		xopf: Bo,
		xoplus: "⨁",
		xotime: "⨂",
		xrarr: "⟶",
		xrArr: "⟹",
		Xscr: Vo,
		xscr: Ho,
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
		Yfr: Uo,
		yfr: Wo,
		YIcy: "Ї",
		yicy: "ї",
		Yopf: Go,
		yopf: Ko,
		Yscr: qo,
		yscr: Jo,
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
		zfr: Yo,
		Zfr: "ℨ",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		zopf: Xo,
		Zopf: "ℤ",
		Zscr: Zo,
		zscr: Qo,
		zwj: "‍",
		zwnj: "‌"
	};
})), ts = /* @__PURE__ */ y({
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
	default: () => ns,
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
}), ns, rs = _((() => {
	ns = {
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
})), is = /* @__PURE__ */ y({
	amp: () => "&",
	apos: () => "'",
	default: () => as,
	gt: () => ">",
	lt: () => "<",
	quot: () => "\""
}), as, os = _((() => {
	as = {
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	};
})), ss = /* @__PURE__ */ y({ default: () => cs }), cs, ls = _((() => {
	cs = {
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
})), us = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 });
	var n = t((ls(), S(ss).default)), r = String.fromCodePoint || function(e) {
		var t = "";
		return e > 65535 && (e -= 65536, t += String.fromCharCode(e >>> 10 & 1023 | 55296), e = 56320 | e & 1023), t += String.fromCharCode(e), t;
	};
	function i(e) {
		return e >= 55296 && e <= 57343 || e > 1114111 ? "�" : (e in n.default && (e = n.default[e]), r(e));
	}
	e.default = i;
})), ds = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.decodeHTML = e.decodeHTMLStrict = e.decodeXML = void 0;
	var n = t((es(), S(Hn).default)), r = t((rs(), S(ts).default)), i = t((os(), S(is).default)), a = t(us()), o = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
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
})), fs = /* @__PURE__ */ v(((e) => {
	var t = e && e.__importDefault || function(e) {
		return e && e.__esModule ? e : { default: e };
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.escapeUTF8 = e.escape = e.encodeNonAsciiHTML = e.encodeHTML = e.encodeXML = void 0;
	var n = a(t((os(), S(is).default)).default), r = o(n);
	e.encodeXML = m(n);
	var i = a(t((es(), S(Hn).default)).default);
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
})), ps = /* @__PURE__ */ v(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.decodeXMLStrict = e.decodeHTML5Strict = e.decodeHTML4Strict = e.decodeHTML5 = e.decodeHTML4 = e.decodeHTMLStrict = e.decodeHTML = e.decodeXML = e.encodeHTML5 = e.encodeHTML4 = e.escapeUTF8 = e.escape = e.encodeNonAsciiHTML = e.encodeHTML = e.encodeXML = e.encode = e.decodeStrict = e.decode = void 0;
	var t = ds(), n = fs();
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
	var o = fs();
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
	var s = ds();
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
})), ms = /* @__PURE__ */ v(((e, t) => {
	var n = t.exports = {}, r = ps(), i = Bn();
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
})), hs = /* @__PURE__ */ v(((e, t) => {
	var n = C("http"), r = C("https"), i = Bn(), a = C("url"), o = Vn(), s = ms(), c = {
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
})), gs = /* @__PURE__ */ x((/* @__PURE__ */ v(((e, t) => {
	t.exports = hs();
})))(), 1), _s = [
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
], vs = class extends u {
	parser = new gs.default({ timeout: 12e3 });
	feeds;
	intervalMs;
	requestTimeoutMs;
	maxSeenTitles;
	seenTitleHashes = [];
	seenSet = /* @__PURE__ */ new Set();
	timer = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.feeds = e.feeds ?? _s, this.intervalMs = e.intervalMs ?? 3e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 12e3, this.maxSeenTitles = e.maxSeenTitles ?? 5e3;
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
			let t = await xs(this.parser.parseURL(e.url), this.requestTimeoutMs, `${e.label} timed out`), n = Array.isArray(t.items) ? t.items : [];
			for (let t of n) {
				let n = ys(e, t);
				!n || this.hasSeen(n.title) || (this.markSeen(n.title), this.emit("headline", n));
			}
		} catch (e) {
			this.emit("error", e instanceof Error ? e : Error(String(e)));
		}
	}
	hasSeen(e) {
		return this.seenSet.has(U(e.toLowerCase()));
	}
	markSeen(e) {
		let t = U(e.toLowerCase());
		for (this.seenSet.add(t), this.seenTitleHashes.push(t); this.seenTitleHashes.length > this.maxSeenTitles;) {
			let e = this.seenTitleHashes.shift();
			e && this.seenSet.delete(e);
		}
	}
};
function ys(e, t) {
	let n = t.title?.trim(), r = t.link?.trim() || e.url;
	if (!n) return null;
	let i = bs(t.isoDate ?? t.pubDate) ?? Date.now(), a = [
		n,
		t.contentSnippet,
		t.content
	].filter(Boolean).join(" ");
	return {
		id: `rss-${e.id}-${U(`${n}:${r}`)}`,
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
function bs(e) {
	if (!e) return null;
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : null;
}
function xs(e, t, n) {
	let r = null, i = new Promise((e, i) => {
		r = setTimeout(() => i(Error(n)), t);
	});
	return Promise.race([e, i]).finally(() => {
		r && clearTimeout(r);
	});
}
//#endregion
//#region electron/ingest/stocktwitsPulseService.ts
var Ss = [
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
], Cs = class extends u {
	targets;
	intervalMs;
	requestTimeoutMs;
	maxSeenIdsPerSymbol;
	state = /* @__PURE__ */ new Map();
	timer = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.targets = e.targets ?? Ss, this.intervalMs = e.intervalMs ?? 6e4, this.requestTimeoutMs = e.requestTimeoutMs ?? 1e4, this.maxSeenIdsPerSymbol = e.maxSeenIdsPerSymbol ?? 1e3;
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
		let p = W(38 + l * 8 + Math.max(0, f) * 3 + Math.abs(d) * 16, 0, 100), m = {
			target: e.symbol,
			pressure: ws(p, 2),
			mentionVelocity: ws(l, 3),
			sentimentDivergenceIndex: ws(d, 3),
			timestamp: r,
			source: "stocktwits_public_stream"
		};
		return {
			symbol: e.symbol,
			sourceSymbol: e.stocktwitsSymbol,
			sourceUrl: t,
			messageCount: n.length,
			newMessageCount: o,
			velocityPerMinute: ws(l, 3),
			mutedSentimentIndex: ws(d, 3),
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
function ws(e, t) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
//#endregion
//#region electron/ingest/twitterExploreScraper.ts
var Ts = class {
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
}, Es = [
	"NVDA",
	"SPY",
	"QQQ",
	"XLE",
	"GLD",
	"TSM"
], Ds = class extends u {
	symbols;
	intervalMs;
	lookbackMinutes;
	timer = null;
	client = null;
	running = !1;
	constructor(e = {}) {
		super(), this.on("error", () => void 0), this.symbols = e.symbols ?? Es, this.intervalMs = e.intervalMs ?? 6e4, this.lookbackMinutes = e.lookbackMinutes ?? 8;
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
			let e = await this.getClient(), t = /* @__PURE__ */ new Date(Date.now() - this.lookbackMinutes * 6e4), n = await Promise.allSettled(this.symbols.map(async (n) => Os(n, await e.chart(n, {
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
function Os(e, t) {
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
		timestamp: ks(n.date) ?? Date.now(),
		source: "yahoo_finance_1m_public"
	};
}
function ks(e) {
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
var As = 6e4, js = 12, Ms = 35, Ns = class extends u {
	persistence;
	realtime;
	enabled;
	rss = new vs({ intervalMs: Y("ATLASZ_RSS_POLL_MS", 3e4) });
	stocktwits = new Cs({ intervalMs: Y("ATLASZ_STOCKTWITS_POLL_MS", 6e4) });
	yahoo = new Ds({ intervalMs: Y("ATLASZ_YAHOO_POLL_MS", 6e4) });
	polymarket = new Qt({ intervalMs: Y("ATLASZ_POLYMARKET_POLL_MS", 5 * 6e4) });
	cognitive = new Gt();
	graphMutator = new Nt({
		halfLifeMs: Y("ATLASZ_GRAPH_EDGE_HALFLIFE_MS", 360 * 6e4),
		maxSilenceMs: Y("ATLASZ_GRAPH_EDGE_MAX_SILENCE_MS", 1440 * 6e4)
	});
	twitterExplore = new Ts();
	statusState;
	narrativeInputTimestamps = [];
	cognitiveBatch = [];
	mediumVelocityThreshold = Y("ATLASZ_NARRATIVE_MEDIUM_VELOCITY", js);
	highVelocityThreshold = Y("ATLASZ_NARRATIVE_HIGH_VELOCITY", Ms);
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
		this.recordNarrativeInput(1, e.observedAt), this.statusState.lastNewsAt = e.observedAt, this.statusState.rssHeadlineCount += 1, this.saveHeadline(Ps(e));
		let t = Yt(e.rawText || e.title, e.id);
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
		this.saveHeadline(Ps(t));
		let n = Yt(t.rawText, t.id);
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
		for (; this.narrativeInputTimestamps.length > 0 && e - this.narrativeInputTimestamps[0] > As;) this.narrativeInputTimestamps.shift();
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
				let a = W(i.confidence, 0, 1);
				this.saveEntityEdge({
					id: `exposure:${e.id}:${t}:${U(i.keyword)}`,
					source: e.id,
					target: t,
					relation: i.reason,
					confidence: a,
					createdAt: e.observedAt
				}), n.push({
					target: t,
					pressure: Math.round(W(45 + a * 45, 0, 100)),
					mentionVelocity: Number((1 + a * 4).toFixed(3)),
					sentimentDivergenceIndex: 0,
					timestamp: e.observedAt,
					source: "local_exposure_matrix"
				}), r.push({
					id: `signal:${e.id}:${t}:${U(i.keyword)}`,
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
function Ps(e) {
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
//#region electron/main.ts
var { app: X, BrowserWindow: Fs, ipcMain: Z, shell: Is } = t, Ls = n(i(import.meta.url)), Rs = null, zs = null, Bs = null, Vs = null;
function Q() {
	return Rs ||= ee(X.getPath("userData")), Rs;
}
function $() {
	return zs ||= new rt({ persistence: Q() }), zs;
}
function Hs() {
	return Bs ||= new Ct(Q()), Bs;
}
function Us() {
	return Vs ||= new Ns({
		persistence: Q(),
		realtime: $()
	}), Vs;
}
function Ws() {
	let e = new Fs({
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
			preload: r(Ls, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1,
			sandbox: !1
		}
	});
	e.webContents.setWindowOpenHandler(({ url: e }) => (Is.openExternal(e), { action: "deny" })), process.env.VITE_DEV_SERVER_URL ? e.loadURL(process.env.VITE_DEV_SERVER_URL) : e.loadFile(r(Ls, "../dist/index.html"));
}
Z.handle("atlasz:app-meta", () => ({
	name: X.getName(),
	version: X.getVersion(),
	platform: process.platform,
	dataPath: X.getPath("userData")
})), Z.handle("atlasz:open-external", async (e, t) => {
	await Is.openExternal(t);
}), Z.handle("atlasz:db:status", () => ({ mode: Q().mode })), Z.handle("atlasz:db:briefs:list", () => Q().listBriefs()), Z.handle("atlasz:db:briefs:save", (e, t) => (Q().saveBrief(t), { ok: !0 })), Z.handle("atlasz:db:headlines:list", (e, t) => Q().listHeadlines(t)), Z.handle("atlasz:db:headlines:save", (e, t) => (Q().saveHeadline(t), { ok: !0 })), Z.handle("atlasz:db:decisions:list", () => Q().listDecisions()), Z.handle("atlasz:db:decisions:get", (e, t) => Q().getDecision(t)), Z.handle("atlasz:db:decisions:save", (e, t) => (Q().saveDecision(t), { ok: !0 })), Z.handle("atlasz:db:decisions:delete", (e, t) => (Q().deleteDecision(t), { ok: !0 })), Z.handle("atlasz:db:decisions:due", (e, t) => Q().decisionsDueForReview(t)), Z.handle("atlasz:realtime:start", () => $().start()), Z.handle("atlasz:realtime:stop", () => $().stop()), Z.handle("atlasz:realtime:restart", (e, t) => $().restart(t)), Z.handle("atlasz:realtime:add-asset", (e, t) => $().addAsset(t)), Z.handle("atlasz:realtime:snapshot", () => $().snapshot()), Z.handle("atlasz:realtime:status", () => $().status()), Z.handle("atlasz:realtime:health", () => $().health()), Z.handle("atlasz:realtime:traverse-risk", (e, t) => $().traverseRisk(t)), Z.handle("atlasz:realtime:replay:start", (e, t) => $().replayStart(t)), Z.handle("atlasz:realtime:replay:pause", () => $().replayPause()), Z.handle("atlasz:realtime:replay:resume", () => $().replayResume()), Z.handle("atlasz:realtime:replay:stop", () => $().replayStop()), Z.handle("atlasz:realtime:replay:speed", (e, t) => $().replaySetSpeed(t)), Z.handle("atlasz:realtime:replay:seek", (e, t) => $().replaySeek(t)), Z.handle("atlasz:world:snapshot", () => Hs().snapshot()), Z.handle("atlasz:world:refresh", () => Hs().refresh()), Z.handle("atlasz:ingest:status", () => Us().status()), X.whenReady().then(() => {
	Q(), $(), Hs().refresh(), Us().start(), Ws(), X.on("activate", () => {
		Fs.getAllWindows().length === 0 && Ws();
	});
}), X.on("window-all-closed", () => {
	process.platform !== "darwin" && X.quit();
}), X.on("before-quit", () => {
	Vs?.stop(), Vs = null, zs?.close(), zs = null, Bs = null, Rs?.close(), Rs = null;
});
//#endregion
export { S as i, _ as n, y as r, v as t };
