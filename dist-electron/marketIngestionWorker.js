import { n as e, r as t } from "./fetchPolicy-BLBFtABc.js";
import { parentPort as n, workerData as r } from "node:worker_threads";
import { createHash as i } from "node:crypto";
//#region electron/microstructure/streamingScreener.ts
var a = 1e4, o = 2.5, s = 20, c = class {
	capacity;
	zScoreThreshold;
	minSamplesForShock;
	maxSignals;
	states = /* @__PURE__ */ new Map();
	pendingShocks = [];
	updateCount = 0;
	droppedUpdates = 0;
	shockCount = 0;
	constructor(e = {}) {
		this.capacity = Math.max(128, Math.floor(e.capacity ?? a)), this.zScoreThreshold = e.zScoreThreshold ?? o, this.minSamplesForShock = Math.max(3, Math.floor(e.minSamplesForShock ?? s)), this.maxSignals = Math.max(1, Math.floor(e.maxSignals ?? 8));
	}
	ingestMany(e) {
		for (let t of e) this.ingest(t);
	}
	ingest(e) {
		if (!u(e)) {
			this.droppedUpdates += 1;
			return;
		}
		let t = this.getState(e.symbol).push(e);
		this.updateCount += 1, t.shock && Math.abs(t.signal.ofiZScore) >= this.zScoreThreshold && (this.shockCount += 1, this.pendingShocks.push(t.signal));
	}
	snapshot() {
		let e = [...this.states.values()].map((e) => e.signal()).filter((e) => e !== null).sort((e, t) => Math.abs(t.ofiZScore) - Math.abs(e.ofiZScore)).slice(0, this.maxSignals), t = e.map((e) => e.latencyMicros).filter((e) => e !== null);
		return {
			enabled: !0,
			bufferCapacity: this.capacity,
			trackedSymbols: this.states.size,
			updateCount: this.updateCount,
			droppedUpdates: this.droppedUpdates,
			shockCount: this.shockCount,
			zScoreThreshold: this.zScoreThreshold,
			dataMode: e[0]?.dataMode ?? "MICROSTRUCTURE_UNAVAILABLE",
			latencyMicrosAvg: t.length > 0 ? h(p(t)) : null,
			jitterMicros: t.length > 1 ? h(m(t) ?? 0) : null,
			topSignals: e,
			note: "Microstructure context only. TRUE_L2_ORDER_BOOK is required for OBI/OFI; public trade ticks are labeled PROXY_TRADE_FLOW_PRESSURE."
		};
	}
	drainShocks() {
		return this.pendingShocks.splice(0, this.pendingShocks.length);
	}
	getState(e) {
		let t = e.toUpperCase(), n = this.states.get(t);
		return n || (n = new l(t, this.capacity, this.minSamplesForShock, this.zScoreThreshold), this.states.set(t, n)), n;
	}
}, l = class {
	symbol;
	capacity;
	minSamplesForShock;
	zScoreThreshold;
	timestamps;
	bidPrices;
	askPrices;
	bidVolumes;
	askVolumes;
	obiValues;
	ofiValues;
	latencyMicros;
	validLatency;
	index = 0;
	count = 0;
	previousBidVolume = 0;
	previousAskVolume = 0;
	lastSignal = null;
	constructor(e, t, n, r) {
		this.symbol = e, this.capacity = t, this.minSamplesForShock = n, this.zScoreThreshold = r, this.timestamps = new Float64Array(t), this.bidPrices = new Float64Array(t), this.askPrices = new Float64Array(t), this.bidVolumes = new Float64Array(t), this.askVolumes = new Float64Array(t), this.obiValues = new Float64Array(t), this.ofiValues = new Float64Array(t), this.latencyMicros = new Float64Array(t), this.validLatency = new Uint8Array(t);
	}
	push(e) {
		let t = e.bidVolume + e.askVolume, n = t > 0 ? (e.bidVolume - e.askVolume) / t : 0, r = Math.max(1, this.previousBidVolume + this.previousAskVolume), i = this.count === 0 ? 0 : (e.bidVolume - this.previousBidVolume - (e.askVolume - this.previousAskVolume)) / r, a = e.packetReceivedAt && e.normalizedAt && e.normalizedAt >= e.packetReceivedAt ? (e.normalizedAt - e.packetReceivedAt) * 1e3 : NaN, o = this.index;
		this.timestamps[o] = e.timestamp, this.bidPrices[o] = e.bidPrice, this.askPrices[o] = e.askPrice, this.bidVolumes[o] = e.bidVolume, this.askVolumes[o] = e.askVolume, this.obiValues[o] = n, this.ofiValues[o] = i, Number.isFinite(a) ? (this.latencyMicros[o] = a, this.validLatency[o] = 1) : (this.latencyMicros[o] = 0, this.validLatency[o] = 0), this.index = (this.index + 1) % this.capacity, this.count = Math.min(this.capacity, this.count + 1), this.previousBidVolume = e.bidVolume, this.previousAskVolume = e.askVolume;
		let s = this.zScoreFor(i), c = e.bidPrice > 0 ? (e.askPrice - e.bidPrice) / e.bidPrice * 1e4 : 0, l = this.count >= this.minSamplesForShock && Math.abs(s) >= this.zScoreThreshold, u = Math.abs(s) >= this.zScoreThreshold + 1.5 ? "high" : l ? "elevated" : "watch", f = {
			id: `microstructure:${this.symbol}:${e.timestamp}`,
			symbol: this.symbol,
			observedAt: e.timestamp,
			obi: h(n, 4),
			ofi: h(i, 4),
			ofiZScore: h(s, 3),
			spreadBps: h(c, 2),
			severity: u,
			source: e.source,
			provenance: e.provenance,
			dataMode: e.dataMode,
			explanation: d(this.symbol, e.dataMode, s, this.zScoreThreshold, l),
			updateCount: this.count,
			bidVolume: h(e.bidVolume, 4),
			askVolume: h(e.askVolume, 4),
			latencyMicros: this.latestLatency(),
			jitterMicros: this.jitterMicros()
		};
		return this.lastSignal = f, {
			signal: f,
			shock: l
		};
	}
	signal() {
		return this.lastSignal;
	}
	zScoreFor(e) {
		if (this.count < 3) return 0;
		let t = this.values(this.ofiValues).slice(0, -1), n = p(t), r = m(t);
		return r === null || r === 0 ? 0 : (e - n) / r;
	}
	latestLatency() {
		let e = (this.index - 1 + this.capacity) % this.capacity;
		return this.validLatency[e] ? h(this.latencyMicros[e]) : null;
	}
	jitterMicros() {
		let e = [];
		for (let t = 0; t < this.count; t += 1) {
			let n = (this.index - this.count + t + this.capacity) % this.capacity;
			this.validLatency[n] && e.push(this.latencyMicros[n]);
		}
		return e.length > 1 ? h(m(e) ?? 0) : null;
	}
	values(e) {
		let t = [];
		for (let n = 0; n < this.count; n += 1) {
			let r = (this.index - this.count + n + this.capacity) % this.capacity;
			t.push(e[r]);
		}
		return t;
	}
};
function u(e) {
	return typeof e.symbol == "string" && e.symbol.trim() !== "" && Number.isFinite(e.bidPrice) && Number.isFinite(e.askPrice) && Number.isFinite(e.bidVolume) && Number.isFinite(e.askVolume) && Number.isFinite(e.timestamp) && f(e.dataMode) && e.bidPrice > 0 && e.askPrice >= e.bidPrice && e.bidVolume >= 0 && e.askVolume >= 0;
}
function d(e, t, n, r, i) {
	let a = h(n, 2);
	return t === "TRUE_L2_ORDER_BOOK" ? i ? `${e} L2 OFI z-score ${a} crossed ${r}σ; public unauthenticated book-depth context.` : `${e} L2 OBI/OFI remains below stress threshold.` : t === "TOP_OF_BOOK_ONLY" ? i ? `${e} top-of-book liquidity stress z-score ${a} crossed ${r}σ; quote-only context.` : `${e} top-of-book liquidity stress remains below threshold.` : t === "PROXY_TRADE_FLOW_PRESSURE" ? i ? `${e} proxy trade-flow pressure z-score ${a} crossed ${r}σ; not verified order-book imbalance.` : `${e} proxy trade-flow pressure remains below threshold; no verified book-depth signal.` : `${e} microstructure context unavailable.`;
}
function f(e) {
	return e === "TRUE_L2_ORDER_BOOK" || e === "TOP_OF_BOOK_ONLY" || e === "PROXY_TRADE_FLOW_PRESSURE" || e === "MICROSTRUCTURE_UNAVAILABLE";
}
function p(e) {
	return e.reduce((e, t) => e + t, 0) / Math.max(1, e.length);
}
function m(e) {
	if (e.length < 2) return null;
	let t = p(e), n = e.reduce((e, n) => e + (n - t) ** 2, 0) / (e.length - 1);
	return Math.sqrt(n);
}
function h(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
//#endregion
//#region electron/osint/quotes/alpacaQuoteProvider.ts
function ee(e) {
	return i("sha256").update(e).digest("hex");
}
function te(e) {
	return JSON.stringify(g(e));
}
function g(e) {
	return Array.isArray(e) ? e.map(g) : e && typeof e == "object" ? Object.keys(e).sort().reduce((t, n) => (t[n] = g(e[n]), t), {}) : e;
}
var _ = "alpaca_equity_quotes", v = "Alpaca Market Data (IEX)", y = "https://alpaca.markets/data", ne = "https://data.alpaca.markets/v2", re = 15e3, ie = 1, ae = 1e3, oe = 15 * 6e4, b = /^[A-Z][A-Z0-9.]{0,9}$/;
function se(e = process.env) {
	if (e.ATLASZ_EQUITY_QUOTE_DISABLE === "1") return null;
	let t = C(e.ATLASZ_ALPACA_API_KEY), n = C(e.ATLASZ_ALPACA_SECRET_KEY), r = C(e.ATLASZ_ALPACA_DATA_BASE) || ne;
	return !t || !n || !/^https:\/\//i.test(r) ? null : {
		apiBase: r,
		apiKey: t,
		secretKey: n,
		timeoutMs: w(Number(e.ATLASZ_ALPACA_TIMEOUT_MS ?? re), 1e3, 6e4),
		maxRetries: w(Number(e.ATLASZ_ALPACA_MAX_RETRIES ?? ie), 0, 5),
		backoffMs: w(Number(e.ATLASZ_ALPACA_BACKOFF_MS ?? ae), 0, 6e4)
	};
}
function ce(e) {
	return {
		id: _,
		name: v,
		trustTier: "key-gated-market-data",
		requiredEnv: ["ATLASZ_ALPACA_API_KEY", "ATLASZ_ALPACA_SECRET_KEY"],
		async fetchQuotes(n, r) {
			let i = de(n);
			if (i.length === 0) return [];
			let a = Date.now(), o = new URL(`${e.apiBase.replace(/\/$/, "")}/stocks/trades/latest`);
			o.searchParams.set("symbols", i.join(","));
			let s = o.toString();
			return le(await t((t) => ue(o, e, fe(r, t)), {
				maxRetries: e.maxRetries,
				backoffMs: e.backoffMs,
				timeoutMs: e.timeoutMs
			}), {
				tickers: i,
				retrievedAt: a,
				sourceApiUrl: s
			});
		}
	};
}
function le(e, t = {}) {
	if (!e || typeof e != "object") return [];
	let n = e, r = n.trades ?? {}, i = n.quotes ?? {}, a = t.retrievedAt ?? Date.now(), o = t.sourceApiUrl ?? `${ne}/stocks/trades/latest`;
	if (/[?&](api[_-]?key|apca|secret|token)/i.test(o)) return [];
	let s = t.tickers && t.tickers.length > 0 ? t.tickers : Object.keys(r), c = [];
	for (let e of s) {
		let n = e.trim().toUpperCase();
		if (!b.test(n)) continue;
		let s = r[n] ?? r[e], l = i[n] ?? i[e], u = S(s?.p), d = x(s?.t) ?? x(l?.t);
		if (u === void 0 || u <= 0 || d === void 0) continue;
		let f = te({
			ticker: n,
			price: u,
			bid: S(l?.bp),
			ask: S(l?.ap),
			volume: S(s?.s),
			marketTimestamp: d,
			sourceId: _,
			sourceUrl: y,
			sourceApiUrl: o
		});
		c.push({
			id: `${_}:${n.toLowerCase()}`,
			ticker: n,
			assetType: t.assetTypes?.[n],
			price: u,
			bid: S(l?.bp),
			ask: S(l?.ap),
			volume: S(s?.s),
			marketTimestamp: d,
			sourceId: _,
			sourceName: v,
			sourceUrl: y,
			sourceApiUrl: o,
			retrievedAt: a,
			staleAt: d + oe,
			provenance: "auth-gated",
			marketDataClass: "key-gated-market-data",
			confidence: 95,
			rawPayloadHash: ee(f),
			rawPayloadJson: f
		});
	}
	return c;
}
async function ue(t, n, r) {
	let i = await fetch(t, {
		signal: r,
		headers: {
			accept: "application/json",
			"APCA-API-KEY-ID": n.apiKey,
			"APCA-API-SECRET-KEY": n.secretKey,
			"user-agent": "AtlaszIntel/0.4 (local-first market intelligence; key-gated Alpaca quotes)"
		}
	});
	return e(i, "Alpaca quotes"), await i.json();
}
function de(e) {
	return [...new Set(e.map((e) => e.trim().toUpperCase()).filter((e) => b.test(e)))].slice(0, 100);
}
function x(e) {
	if (typeof e != "string" || e.trim() === "") return;
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : void 0;
}
function S(e) {
	return typeof e == "number" && Number.isFinite(e) ? e : void 0;
}
function C(e) {
	return e == null ? "" : String(e).trim();
}
function w(e, t, n) {
	return Number.isFinite(e) ? Math.max(t, Math.min(n, Math.round(e))) : t;
}
function fe(e, t) {
	if (e.aborted || t.aborted) {
		let e = new AbortController();
		return e.abort(), e.signal;
	}
	let n = new AbortController(), r = () => n.abort();
	return e.addEventListener("abort", r, { once: !0 }), t.addEventListener("abort", r, { once: !0 }), n.signal;
}
//#endregion
//#region electron/osint/quotes/quoteProvider.ts
function pe(e = process.env) {
	if ((e.ATLASZ_EQUITY_QUOTE_PROVIDER || "alpaca").trim().toLowerCase() === "alpaca") {
		let t = se(e);
		return t ? ce(t) : null;
	}
	return null;
}
//#endregion
//#region src/marketQuote.ts
function me(e) {
	return !!e.ticker && Number.isFinite(e.price) && e.price > 0 && Number.isFinite(e.marketTimestamp) && e.marketTimestamp > 0 && !!e.sourceId && /^https:\/\//.test(e.sourceUrl) && !/[?&](api[_-]?key|apca|secret|token)/i.test(e.sourceApiUrl) && e.provenance === "auth-gated" && e.marketDataClass === "key-gated-market-data" && Number.isFinite(e.retrievedAt) && Number.isFinite(e.staleAt) && e.rawPayloadHash.length > 0 && e.confidence >= 90;
}
//#endregion
//#region electron/osint/quotes/quotePoller.ts
function he(e, t = "alpaca") {
	return e.filter(me).map((e) => ({
		symbol: e.ticker,
		price: e.price,
		volume: e.volume ?? 0,
		timestamp: e.marketTimestamp,
		source: t
	}));
}
async function ge(e) {
	if (!e.provider) return {
		status: "missing-key",
		ticks: [],
		quoteCount: 0,
		error: "No configured quote provider/keys (fail-closed)."
	};
	if (e.tickers.length === 0) return {
		status: "idle",
		ticks: [],
		quoteCount: 0
	};
	try {
		let t = await e.provider.fetchQuotes(e.tickers, e.signal), n = he(t, e.source);
		return n.length === 0 ? {
			status: "failed",
			ticks: [],
			quoteCount: t.length,
			error: "No usable real quotes returned."
		} : {
			status: "connected",
			ticks: n,
			quoteCount: t.length
		};
	} catch (e) {
		return {
			status: "failed",
			ticks: [],
			quoteCount: 0,
			error: e instanceof Error ? e.message : String(e)
		};
	}
}
//#endregion
//#region electron/workers/marketIngestionWorker.ts
var T = ye(r), _e = process.env.ATLASZ_ALLOW_SIMULATED_DATA === "1" || process.env.NODE_ENV === "test", ve = 2e4, E = T.syncIntervalMs ?? 100, D = [], O = [], k = [], A = Ae(T), j = new c({
	capacity: $("ATLASZ_MICROSTRUCTURE_BUFFER_SIZE", 1e4),
	zScoreThreshold: Je("ATLASZ_MICROSTRUCTURE_ZSCORE", 2.5)
}), M = /* @__PURE__ */ new Map(), N = T.connectorId ?? (T.enablePublicWs ? "coincap_public_ws" : "public_market_rest"), P = "stopped", F = null, I = 0, L = 0, R = 0, z = 0, B = 0, V = Date.now(), H;
if (!n) throw Error("Atlasz market ingestion worker requires parentPort");
n.on("message", (e) => {
	!e || typeof e != "object" || (e.type === "start" ? U(e.connectorId) : e.type === "stop" ? W() : e.type === "restart" ? be(e.connectorId) : e.type === "addAsset" ? xe(e.asset, e.seedPrice) : e.type === "status" ? ke() : e.type === "health" && G());
}), G();
function ye(e) {
	return {
		assets: e.assets ?? [],
		seedPrices: e.seedPrices ?? {},
		attentionTargets: e.attentionTargets ?? [],
		enablePublicWs: e.enablePublicWs === !0,
		connectorId: e.connectorId,
		sqliteMode: e.sqliteMode ?? "unknown",
		syncIntervalMs: e.syncIntervalMs
	};
}
function U(e) {
	let t = e ?? N, n = A.get(t);
	if (!n) {
		P = "failed", q("connector_failed", t, "error", `Connector ${t} is not registered`), G();
		return;
	}
	Se(), N = n.id, P = "starting", De(), n.start(we), P = n.status === "failed" ? "failed" : "running", Ce(), G();
}
function W() {
	Se(), F &&= (clearInterval(F), null), De(), P = "stopped", G();
}
function be(e) {
	W(), U(e);
}
function xe(e, t) {
	if (!(!e.symbol || T.assets.some((t) => t.symbol === e.symbol))) {
		T.assets.push(e), T.seedPrices[e.symbol] = t, T.attentionTargets.includes(e.symbol) || T.attentionTargets.push(e.symbol);
		for (let n of A.values()) n.addAsset?.(e, t);
		q("connector_started", N, "info", `Watchlist asset ${e.symbol} added to ingestion universe`, {
			symbol: e.symbol,
			kind: e.kind,
			source: e.source
		});
	}
}
function Se() {
	A.get(N)?.stop();
}
function Ce() {
	F ||= setInterval(Ee, E);
}
function we(e) {
	let t = Te(D, e.ticks), n = Te(O, e.attention), r = e.bookUpdates && e.bookUpdates.length > 0 ? e.bookUpdates : Ke(e.ticks, e.ticks[0]?.source ?? N);
	j.ingestMany(r);
	for (let e of j.drainShocks()) q("signal_generated", N, e.severity === "high" ? "watch" : "info", e.explanation, {
		signalType: "microstructure_market_shock",
		symbol: e.symbol,
		obi: e.obi,
		ofi: e.ofi,
		ofiZScore: e.ofiZScore,
		provenance: e.provenance
	});
	L += t + n;
}
function Te(e, t) {
	let n = 0;
	for (let r of t) {
		if (e.length >= ve) {
			I += 1;
			continue;
		}
		e.push(r), n += 1;
	}
	return n;
}
function Ee() {
	Oe();
	let e = D.splice(0, D.length), t = O.splice(0, O.length), r = k.splice(0, k.length);
	H = Date.now(), z += 1;
	let i = {
		type: "batch",
		ticks: e,
		attention: t,
		audits: r,
		health: K()
	};
	n?.postMessage(i);
}
function De() {
	D.length = 0, O.length = 0, k.length = 0;
}
function Oe() {
	let e = Date.now(), t = e - V;
	t < 1e3 || (R = L * 1e3 / t, B = z * 1e3 / t, L = 0, z = 0, V = e);
}
function G() {
	let e = {
		type: "health",
		health: K()
	};
	n?.postMessage(e);
}
function ke() {
	let e = {
		type: "status",
		health: K()
	};
	n?.postMessage(e);
}
function K() {
	Oe();
	let e = A.get(N), t = [...A.values()].map((e) => ({
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: e.requiresAuth,
		status: e.status,
		lastError: e.lastError,
		reconnectCount: e.reconnectCount,
		sourceTrust: e.sourceTrust,
		packetsPerSecond: e.id === N ? Z(R, 2) : 0,
		droppedPackets: I,
		lastPacketAt: H
	}));
	return {
		activeConnectorId: N,
		ingestionStatus: e?.status ?? "stopped",
		packetsPerSecond: Z(R, 2),
		framesPerSecond: Z(B, 2),
		droppedPackets: I,
		reconnectCount: e?.reconnectCount ?? 0,
		lastFrameTimestamp: H,
		sqliteMode: T.sqliteMode ?? "unknown",
		sourceTrust: e?.sourceTrust ?? "unavailable",
		workerStatus: P,
		connectors: t,
		replay: {
			active: !1,
			playing: !1,
			speed: 1,
			frameCount: 0
		},
		microstructure: j.snapshot()
	};
}
function q(e, t, n, r, i) {
	k.push({
		id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		eventType: e,
		connectorId: t,
		severity: n,
		message: r,
		createdAt: Date.now(),
		metadata: i
	});
}
function Ae(e) {
	let t = /* @__PURE__ */ new Map(), n = je(e), r = Me(e), i = Ve(e), a = He(), o = Ue(), s = Ge(e);
	for (let e of [
		n,
		r,
		i,
		a,
		o,
		s
	]) t.set(e.id, e);
	if (_e) {
		let n = Be(e);
		t.set(n.id, n);
	}
	return t;
}
function je(e) {
	let t = "idle", n = null, r = null, i = !0, a = !1, o = new Map(e.assets.filter((e) => e.kind === "crypto" && e.source === "coingecko").map((e) => [e.symbol, e])), s = new Map(e.assets.filter((e) => e.source === "yahoo").map((e) => [e.symbol, e])), c = {
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
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "public unauthenticated",
		start(e) {
			r = e, i = !1, t = "connecting", q("connector_started", c.id, "info", "Public market REST connector started", {
				cryptoSymbols: [...o.keys()],
				yahooSymbols: [...s.keys()]
			}), l(), n = setInterval(() => void l(), $("ATLASZ_PUBLIC_MARKET_POLL_MS", 3e4));
		},
		stop() {
			i = !0, n &&= (clearInterval(n), null), t = "stopped";
		},
		addAsset(e) {
			e.kind === "crypto" && e.source === "coingecko" ? o.set(e.symbol, e) : e.source === "yahoo" && s.set(e.symbol, e), l();
		},
		normalizeMessage(e) {
			if (!e || typeof e != "object") return {
				ticks: [],
				attention: []
			};
			let t = e, n = [...Ne(t.coingecko ?? {}, o, c.id), ...Fe(t.yahoo ?? [], [...s.values()], c.id)];
			return {
				ticks: n,
				attention: X(n, c.id)
			};
		}
	};
	async function l() {
		if (!(i || a)) {
			a = !0, t = c.reconnectCount > 0 ? "reconnecting" : "connecting";
			try {
				let [e, n] = await Promise.allSettled([Pe([...o.values()]), Le([...s.values()])]), i = e.status === "fulfilled" ? e.value : {}, a = n.status === "fulfilled" ? n.value : [], l = c.normalizeMessage({
					coingecko: i,
					yahoo: a
				}), u = [e.status === "rejected" ? J(e.reason) : "", n.status === "rejected" ? J(n.reason) : ""].filter(Boolean);
				if (l.ticks.length === 0) throw Error(u.join(" / ") || "Public market REST returned no usable prices");
				t = "connected", c.lastError = u.length > 0 ? u.join(" / ") : void 0, u.length > 0 ? q("connector_failed", c.id, "watch", c.lastError ?? "Partial public market REST failure") : c.reconnectCount > 0 && q("reconnect_succeeded", c.id, "info", "Public market REST recovered"), r?.(l);
			} catch (e) {
				t = "failed", c.reconnectCount += 1, c.lastError = J(e), q("connector_failed", c.id, "watch", c.lastError, { reconnectCount: c.reconnectCount });
			} finally {
				a = !1;
			}
		}
	}
	return c;
}
function Me(e) {
	let t = "idle", n = null, r = null, i = !0, a = new Map(e.assets.filter((e) => e.kind === "crypto" && e.source === "coingecko").map((e) => [e.symbol, e])), o = !1, s = {
		id: "coingecko_public_rest",
		label: "CoinGecko public REST",
		assetClasses: ["crypto"],
		requiresAuth: !1,
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "public unauthenticated",
		start(e) {
			r = e, i = !1, t = "connecting", q("connector_started", s.id, "info", "CoinGecko public REST connector started", { symbols: [...a.keys()] }), c(), n = setInterval(() => void c(), $("ATLASZ_COINGECKO_POLL_MS", 15e3));
		},
		stop() {
			i = !0, n &&= (clearInterval(n), null), t = "stopped";
		},
		addAsset(e) {
			e.kind === "crypto" && e.source === "coingecko" && (a.set(e.symbol, e), c());
		},
		normalizeMessage(e) {
			if (!e || typeof e != "object") return {
				ticks: [],
				attention: []
			};
			let t = Ne(e, a, s.id);
			return {
				ticks: t,
				attention: X(t, s.id)
			};
		}
	};
	async function c() {
		if (!(i || o)) {
			if (a.size === 0) {
				t = "failed", s.lastError = "No CoinGecko-supported crypto assets are configured.", q("connector_failed", s.id, "watch", s.lastError);
				return;
			}
			o = !0;
			try {
				t = s.reconnectCount > 0 ? "reconnecting" : "connecting";
				let e = await Pe([...a.values()]), n = s.normalizeMessage(e);
				if (n.ticks.length === 0) throw Error("CoinGecko returned no usable crypto prices for the active universe");
				t = "connected", s.reconnectCount > 0 && q("reconnect_succeeded", s.id, "info", "CoinGecko public REST recovered"), s.lastError = void 0, r?.(n);
			} catch (e) {
				t = "failed", s.reconnectCount += 1, s.lastError = J(e), q("connector_failed", s.id, "watch", s.lastError, { reconnectCount: s.reconnectCount });
			} finally {
				o = !1;
			}
		}
	}
	return s;
}
function Ne(e, t, n) {
	let r = Date.now(), i = [];
	for (let a of t.values()) {
		let t = e[a.feedSymbol], o = Number(t?.usd);
		if (!Number.isFinite(o) || o <= 0) continue;
		let s = Number(t?.usd_24h_vol), c = Number(t?.last_updated_at);
		i.push({
			symbol: a.symbol,
			price: o,
			volume: Number.isFinite(s) && s > 0 ? s / 1440 : 1,
			timestamp: Number.isFinite(c) && c > 0 ? c * 1e3 : r,
			source: n
		});
	}
	return i;
}
async function Pe(e) {
	let t = [...new Set(e.map((e) => e.feedSymbol).filter(Boolean))];
	if (t.length === 0) return {};
	let n = new URL("https://api.coingecko.com/api/v3/simple/price");
	n.searchParams.set("ids", t.join(",")), n.searchParams.set("vs_currencies", "usd"), n.searchParams.set("include_24hr_vol", "true"), n.searchParams.set("include_last_updated_at", "true");
	let r = new AbortController(), i = setTimeout(() => r.abort(), $("ATLASZ_COINGECKO_TIMEOUT_MS", 8e3));
	try {
		let e = await fetch(n, {
			signal: r.signal,
			headers: {
				accept: "application/json",
				"user-agent": "AtlaszIntel/0.4 local-first market connector"
			}
		});
		if (!e.ok) throw Error(`CoinGecko HTTP ${e.status}`);
		return await e.json();
	} finally {
		clearTimeout(i);
	}
}
function Fe(e, t, n) {
	let r = [];
	for (let i = 0; i < e.length; i += 1) {
		let a = Ie(e[i], t[i], n);
		a && r.push(a);
	}
	return r;
}
function Ie(e, t, n) {
	if (!t) return null;
	let r = e.chart?.result?.[0];
	if (!r) return null;
	let i = r.indicators?.quote?.[0], a = i?.close ?? [], o = i?.volume ?? [], s = r.timestamp ?? [], c = ze(a), l = Number(r.meta?.regularMarketPrice), u = c ? c.value : l;
	if (!Number.isFinite(u) || u <= 0) return null;
	let d = c && Number.isFinite(s[c.index]) ? s[c.index] : Number(r.meta?.regularMarketTime), f = Number(c ? o[c.index] : r.meta?.regularMarketVolume);
	return {
		symbol: t.symbol,
		price: u,
		volume: Number.isFinite(f) && f > 0 ? f : 1,
		timestamp: Number.isFinite(d) && d > 0 ? d * 1e3 : Date.now(),
		source: n
	};
}
async function Le(e) {
	let t = $("ATLASZ_YAHOO_MAX_SYMBOLS", 64), n = e.slice(0, t);
	if (n.length === 0) return [];
	let r = n.map((e) => Re(e)), i = await Promise.allSettled(r), a = [], o = [];
	for (let e of i) e.status === "fulfilled" ? a.push(e.value) : (a.push({}), o.push(J(e.reason)));
	if (a.every((e) => !e.chart?.result?.[0]) && o.length > 0) throw Error(o.slice(0, 4).join(" / "));
	return a;
}
async function Re(e) {
	let t = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(e.feedSymbol)}`);
	t.searchParams.set("range", "1d"), t.searchParams.set("interval", "1m"), t.searchParams.set("includePrePost", "true");
	let n = new AbortController(), r = setTimeout(() => n.abort(), $("ATLASZ_YAHOO_TIMEOUT_MS", 8e3));
	try {
		let r = await fetch(t, {
			signal: n.signal,
			headers: {
				accept: "application/json",
				"user-agent": "AtlaszIntel/0.4 local-first market connector"
			}
		});
		if (!r.ok) throw Error(`Yahoo ${e.feedSymbol} HTTP ${r.status}`);
		let i = await r.json(), a = i.chart?.error?.description;
		if (a) throw Error(`Yahoo ${e.feedSymbol}: ${a}`);
		return i;
	} finally {
		clearTimeout(r);
	}
}
function ze(e) {
	for (let t = e.length - 1; t >= 0; --t) {
		let n = Number(e[t]);
		if (Number.isFinite(n) && n > 0) return {
			value: n,
			index: t
		};
	}
	return null;
}
function J(e) {
	return e instanceof Error ? e.message : String(e);
}
function Be(e) {
	let t = "idle", n = null, r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = e.assets, o = new Set(e.attentionTargets);
	for (let t of a) i.set(t.symbol, e.seedPrices[t.symbol] ?? 100), r.set(t.symbol, 0), o.add(t.symbol);
	let s = {
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
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "simulated",
		start(e) {
			n ||= (t = "connected", q("connector_started", s.id, "info", "Local simulator connector started"), setInterval(() => {
				let t = Date.now(), n = (Math.random() - .5) * 9e-4, c = [], l = [], u = [];
				for (let e of a) {
					let a = i.get(e.symbol) ?? 100, o = (Math.random() - .5) * .0022, d = (r.get(e.symbol) ?? 0) * .6, f = n + o + d;
					r.set(e.symbol, f);
					let p = Math.max(1e-4, a * (1 + f));
					i.set(e.symbol, p);
					let m = Math.random() < .06 ? 4 + Math.random() * 8 : 1;
					c.push({
						symbol: e.symbol,
						price: Z(p, 6),
						volume: Z((20 + Math.random() * 60) * m, 2),
						timestamp: t,
						source: s.id
					}), u.push(qe(e.symbol, p, f, m, t, s.id, "simulated")), l.push({
						target: e.symbol,
						pressure: Z(Q(38 + Math.abs(f) * 12e3 + (m - 1) * 5, 0, 100), 2),
						mentionVelocity: Z(Math.max(0, m - .8 + Math.abs(f) * 1e3), 2),
						sentimentDivergenceIndex: Z(Q(f * 280 + (Math.random() - .5) * .18, -1, 1), 3),
						timestamp: t,
						source: s.id
					});
				}
				for (let e of o) {
					if (i.has(e)) continue;
					let n = Q(35 + Math.random() * 30 + (Math.random() < .04 ? 35 : 0), 0, 100);
					l.push({
						target: e,
						pressure: Z(n, 2),
						mentionVelocity: Z(Math.max(0, n / 18 + (Math.random() - .4) * 3), 2),
						sentimentDivergenceIndex: Z(Q((Math.random() - .5) * .7, -1, 1), 3),
						timestamp: t,
						source: s.id
					});
				}
				e({
					ticks: c,
					attention: l,
					bookUpdates: u
				});
			}, Math.min(E, 120)));
		},
		stop() {
			n &&= (clearInterval(n), null), t = "stopped";
		},
		addAsset(e, t) {
			i.has(e.symbol) || (i.set(e.symbol, t), r.set(e.symbol, 0)), o.add(e.symbol);
		},
		normalizeMessage() {
			return {
				ticks: [],
				attention: []
			};
		}
	};
	return s;
}
function Ve(e) {
	let t = Object.fromEntries(e.assets.filter((e) => e.kind === "crypto" && e.source === "coincap").map((e) => [e.feedSymbol, e.symbol]));
	return Object.keys(t).length === 0 && (t.bitcoin = "BTC", t.ethereum = "ETH"), Y({
		id: "coincap_public_ws",
		label: "CoinCap public WebSocket",
		url: `wss://ws.coincap.io/prices?assets=${Object.keys(t).join(",")}`,
		assetClasses: ["crypto"],
		sourceTrust: "public unauthenticated",
		normalizeMessage(e) {
			if (!e || typeof e != "object") return {
				ticks: [],
				attention: []
			};
			let n = Date.now(), r = Object.entries(e).map(([e, r]) => {
				let i = t[e], a = Number(r);
				return !i || !Number.isFinite(a) || a <= 0 ? null : {
					symbol: i,
					price: a,
					volume: 1,
					timestamp: n,
					source: "coincap_public_ws"
				};
			}).filter((e) => e !== null);
			return {
				ticks: r,
				attention: X(r, "coincap_public_ws")
			};
		}
	});
}
function He() {
	return Y({
		id: "binance_public_ws",
		label: "Binance public trades",
		url: "wss://stream.binance.com:9443/ws/btcusdt@trade",
		assetClasses: ["crypto"],
		sourceTrust: "public unauthenticated",
		normalizeMessage(e) {
			if (!e || typeof e != "object") return {
				ticks: [],
				attention: []
			};
			let t = e, n = Number(t.p), r = Number(t.q), i = Number(t.T) || Date.now();
			if (!Number.isFinite(n) || n <= 0) return {
				ticks: [],
				attention: []
			};
			let a = [{
				symbol: "BTC",
				price: n,
				volume: Number.isFinite(r) && r > 0 ? r : 1,
				timestamp: i,
				source: "binance_public_ws"
			}];
			return {
				ticks: a,
				attention: X(a, "binance_public_ws")
			};
		}
	});
}
function Ue() {
	let e = We();
	return Y({
		id: "coinbase_public_ws",
		label: "Coinbase public ticker",
		url: "wss://ws-feed.exchange.coinbase.com",
		subscribeMessage: {
			type: "subscribe",
			product_ids: Object.keys(e),
			channels: ["ticker"]
		},
		assetClasses: ["crypto"],
		sourceTrust: "public unauthenticated",
		normalizeMessage(t) {
			if (!t || typeof t != "object") return {
				ticks: [],
				attention: []
			};
			let n = t;
			if (n.type !== "ticker") return {
				ticks: [],
				attention: []
			};
			let r = e[String(n.product_id ?? "")] ?? "", i = Number(n.price), a = Number(n.last_size), o = typeof n.time == "string" ? Date.parse(n.time) : NaN;
			if (!r || !Number.isFinite(i) || i <= 0) return {
				ticks: [],
				attention: []
			};
			let s = [{
				symbol: r,
				price: i,
				volume: Number.isFinite(a) && a > 0 ? a : 1,
				timestamp: Number.isFinite(o) ? o : Date.now(),
				source: "coinbase_public_ws"
			}];
			return {
				ticks: s,
				attention: X(s, "coinbase_public_ws")
			};
		}
	});
}
function We() {
	let e = (process.env.ATLASZ_COINBASE_PRODUCTS ?? "BTC-USD,ETH-USD,SOL-USD,LINK-USD,KAS-USD,KAS-USDT").split(",").map((e) => e.trim().toUpperCase()).filter((e) => e.length > 0);
	return Object.fromEntries(e.map((e) => [e, e.split("-")[0]]));
}
function Ge(e) {
	let t = "idle", n = null, r = null, i = !0, a = !1, o = pe(process.env), s = [...new Set(e.assets.filter((e) => e.kind === "equity" || e.kind === "etf").map((e) => e.symbol.toUpperCase()))], c = {
		id: "alpaca_iex_placeholder",
		label: "Alpaca IEX equities/ETFs (key-gated)",
		assetClasses: ["equity", "etf"],
		requiresAuth: !0,
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "auth-gated",
		start(e) {
			if (r = e, i = !1, !o) {
				t = "failed", c.lastError = "Alpaca quotes require ATLASZ_ALPACA_API_KEY + ATLASZ_ALPACA_SECRET_KEY (fail-closed).", q("connector_failed", c.id, "watch", c.lastError);
				return;
			}
			t = "connecting", q("connector_started", c.id, "info", "Alpaca key-gated quote connector started", { symbols: s }), l(), n = setInterval(() => void l(), $("ATLASZ_ALPACA_POLL_MS", 15e3));
		},
		stop() {
			i = !0, n &&= (clearInterval(n), null), t = "stopped";
		},
		normalizeMessage() {
			return {
				ticks: [],
				attention: []
			};
		}
	};
	async function l() {
		if (!(i || a || !o)) {
			a = !0;
			try {
				let e = await ge({
					provider: o,
					tickers: s,
					signal: new AbortController().signal,
					source: "alpaca"
				});
				t = e.status === "connected" ? "connected" : e.status === "idle" ? "idle" : "failed", c.lastError = e.error, e.status === "failed" && (c.reconnectCount += 1, q("connector_failed", c.id, "watch", e.error ?? "Alpaca quote poll failed", { reconnectCount: c.reconnectCount })), e.ticks.length > 0 && r?.({
					ticks: e.ticks,
					attention: X(e.ticks, c.id)
				});
			} finally {
				a = !1;
			}
		}
	}
	return c;
}
function Y(e) {
	let t = "idle", n = null, r = !0, i = null, a = null, o = {
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: !1,
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: e.sourceTrust,
		start(e) {
			a = e, r = !1, s();
		},
		stop() {
			r = !0, t = "stopped", i &&= (clearTimeout(i), null), n?.close(), n = null;
		},
		normalizeMessage: e.normalizeMessage
	};
	function s() {
		if (r) return;
		let i = globalThis.WebSocket;
		if (!i) {
			t = "failed", o.lastError = "WebSocket is unavailable in this runtime.", q("connector_failed", o.id, "error", o.lastError);
			return;
		}
		t = o.reconnectCount > 0 ? "reconnecting" : "connecting";
		try {
			n = new i(e.url);
		} catch (e) {
			t = "failed", o.lastError = e instanceof Error ? e.message : String(e), q("connector_failed", o.id, "error", o.lastError), c();
			return;
		}
		n.onopen = () => {
			t = "connected", o.lastError = void 0, e.subscribeMessage && n?.send(JSON.stringify(e.subscribeMessage)), q(o.reconnectCount > 0 ? "reconnect_succeeded" : "connector_started", o.id, "info", `${o.label} connected`);
		}, n.onmessage = (e) => {
			try {
				let t = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
				a?.(o.normalizeMessage(t));
			} catch (e) {
				I += 1, o.lastError = e instanceof Error ? e.message : String(e);
			}
		}, n.onerror = (e) => {
			o.lastError = e instanceof Error ? e.message : `${o.label} socket error`, q("connector_failed", o.id, "watch", o.lastError), n?.close();
		}, n.onclose = () => {
			n = null, !r && c();
		};
	}
	function c() {
		if (r) return;
		t = "reconnecting", o.reconnectCount += 1;
		let e = Math.min(3e4, 500 * 2 ** Math.min(o.reconnectCount, 8));
		q("reconnect_attempted", o.id, "watch", `${o.label} reconnect in ${e}ms`, {
			reconnectCount: o.reconnectCount,
			delay: e
		}), i = setTimeout(s, e);
	}
	return o;
}
function X(e, t) {
	return e.map((e) => ({
		target: e.symbol,
		pressure: 45,
		mentionVelocity: Math.min(18, Math.max(.5, e.volume * .4)),
		sentimentDivergenceIndex: 0,
		timestamp: e.timestamp,
		source: t
	}));
}
function Ke(e, t) {
	return e.map((e) => {
		let n = M.get(e.symbol) ?? e.price;
		M.set(e.symbol, e.price);
		let r = n > 0 ? (e.price - n) / n : 0, i = Math.tanh((e.volume || 1) / 10);
		return qe(e.symbol, e.price, r * i, Math.max(1, e.volume), e.timestamp, t, "local-computed");
	});
}
function qe(e, t, n, r, i, a, o) {
	let s = Date.now(), c = t * (Math.max(1, Math.min(18, 4 + Math.abs(n) * 12e3)) / 2e4), l = Math.max(1, 60 * r), u = Q(n * 3500, -.82, .82);
	return {
		symbol: e,
		bidPrice: Z(Math.max(1e-6, t - c), 8),
		askPrice: Z(t + c, 8),
		bidVolume: Z(l * (1 + u), 6),
		askVolume: Z(l * (1 - u), 6),
		timestamp: i,
		source: a,
		provenance: o,
		dataMode: "PROXY_TRADE_FLOW_PRESSURE",
		packetReceivedAt: s,
		normalizedAt: Date.now()
	};
}
function Z(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function Q(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function $(e, t) {
	let n = Number(process.env[e]);
	return Number.isInteger(n) && n > 0 ? n : t;
}
function Je(e, t) {
	let n = Number(process.env[e]);
	return Number.isFinite(n) && n > 0 ? n : t;
}
//#endregion
export {};
