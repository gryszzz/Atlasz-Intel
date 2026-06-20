import { parentPort as e, workerData as t } from "node:worker_threads";
//#region electron/microstructure/streamingScreener.ts
var n = 1e4, r = 2.5, i = 20, a = class {
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
		this.capacity = Math.max(128, Math.floor(e.capacity ?? n)), this.zScoreThreshold = e.zScoreThreshold ?? r, this.minSamplesForShock = Math.max(3, Math.floor(e.minSamplesForShock ?? i)), this.maxSignals = Math.max(1, Math.floor(e.maxSignals ?? 8));
	}
	ingestMany(e) {
		for (let t of e) this.ingest(t);
	}
	ingest(e) {
		if (!s(e)) {
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
			latencyMicrosAvg: t.length > 0 ? f(u(t)) : null,
			jitterMicros: t.length > 1 ? f(d(t) ?? 0) : null,
			topSignals: e,
			note: "Microstructure context only. TRUE_L2_ORDER_BOOK is required for OBI/OFI; public trade ticks are labeled PROXY_TRADE_FLOW_PRESSURE."
		};
	}
	drainShocks() {
		return this.pendingShocks.splice(0, this.pendingShocks.length);
	}
	getState(e) {
		let t = e.toUpperCase(), n = this.states.get(t);
		return n || (n = new o(t, this.capacity, this.minSamplesForShock, this.zScoreThreshold), this.states.set(t, n)), n;
	}
}, o = class {
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
		let s = this.zScoreFor(i), l = e.bidPrice > 0 ? (e.askPrice - e.bidPrice) / e.bidPrice * 1e4 : 0, u = this.count >= this.minSamplesForShock && Math.abs(s) >= this.zScoreThreshold, d = Math.abs(s) >= this.zScoreThreshold + 1.5 ? "high" : u ? "elevated" : "watch", p = {
			id: `microstructure:${this.symbol}:${e.timestamp}`,
			symbol: this.symbol,
			observedAt: e.timestamp,
			obi: f(n, 4),
			ofi: f(i, 4),
			ofiZScore: f(s, 3),
			spreadBps: f(l, 2),
			severity: d,
			source: e.source,
			provenance: e.provenance,
			dataMode: e.dataMode,
			explanation: c(this.symbol, e.dataMode, s, this.zScoreThreshold, u),
			updateCount: this.count,
			bidVolume: f(e.bidVolume, 4),
			askVolume: f(e.askVolume, 4),
			latencyMicros: this.latestLatency(),
			jitterMicros: this.jitterMicros()
		};
		return this.lastSignal = p, {
			signal: p,
			shock: u
		};
	}
	signal() {
		return this.lastSignal;
	}
	zScoreFor(e) {
		if (this.count < 3) return 0;
		let t = this.values(this.ofiValues).slice(0, -1), n = u(t), r = d(t);
		return r === null || r === 0 ? 0 : (e - n) / r;
	}
	latestLatency() {
		let e = (this.index - 1 + this.capacity) % this.capacity;
		return this.validLatency[e] ? f(this.latencyMicros[e]) : null;
	}
	jitterMicros() {
		let e = [];
		for (let t = 0; t < this.count; t += 1) {
			let n = (this.index - this.count + t + this.capacity) % this.capacity;
			this.validLatency[n] && e.push(this.latencyMicros[n]);
		}
		return e.length > 1 ? f(d(e) ?? 0) : null;
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
function s(e) {
	return typeof e.symbol == "string" && e.symbol.trim() !== "" && Number.isFinite(e.bidPrice) && Number.isFinite(e.askPrice) && Number.isFinite(e.bidVolume) && Number.isFinite(e.askVolume) && Number.isFinite(e.timestamp) && l(e.dataMode) && e.bidPrice > 0 && e.askPrice >= e.bidPrice && e.bidVolume >= 0 && e.askVolume >= 0;
}
function c(e, t, n, r, i) {
	let a = f(n, 2);
	return t === "TRUE_L2_ORDER_BOOK" ? i ? `${e} L2 OFI z-score ${a} crossed ${r}σ; public unauthenticated book-depth context.` : `${e} L2 OBI/OFI remains below stress threshold.` : t === "TOP_OF_BOOK_ONLY" ? i ? `${e} top-of-book liquidity stress z-score ${a} crossed ${r}σ; quote-only context.` : `${e} top-of-book liquidity stress remains below threshold.` : t === "PROXY_TRADE_FLOW_PRESSURE" ? i ? `${e} proxy trade-flow pressure z-score ${a} crossed ${r}σ; not verified order-book imbalance.` : `${e} proxy trade-flow pressure remains below threshold; no verified book-depth signal.` : `${e} microstructure context unavailable.`;
}
function l(e) {
	return e === "TRUE_L2_ORDER_BOOK" || e === "TOP_OF_BOOK_ONLY" || e === "PROXY_TRADE_FLOW_PRESSURE" || e === "MICROSTRUCTURE_UNAVAILABLE";
}
function u(e) {
	return e.reduce((e, t) => e + t, 0) / Math.max(1, e.length);
}
function d(e) {
	if (e.length < 2) return null;
	let t = u(e), n = e.reduce((e, n) => e + (n - t) ** 2, 0) / (e.length - 1);
	return Math.sqrt(n);
}
function f(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
//#endregion
//#region electron/workers/marketIngestionWorker.ts
var p = te(t), m = process.env.ATLASZ_ALLOW_SIMULATED_DATA === "1" || process.env.NODE_ENV === "test", ee = 2e4, h = p.syncIntervalMs ?? 100, g = [], _ = [], v = [], y = ae(p), b = new a({
	capacity: $("ATLASZ_MICROSTRUCTURE_BUFFER_SIZE", 1e4),
	zScoreThreshold: ye("ATLASZ_MICROSTRUCTURE_ZSCORE", 2.5)
}), x = /* @__PURE__ */ new Map(), S = p.connectorId ?? (p.enablePublicWs ? "coincap_public_ws" : "public_market_rest"), C = "stopped", w = null, T = 0, E = 0, D = 0, O = 0, k = 0, A = Date.now(), j;
if (!e) throw Error("Atlasz market ingestion worker requires parentPort");
e.on("message", (e) => {
	!e || typeof e != "object" || (e.type === "start" ? M(e.connectorId) : e.type === "stop" ? N() : e.type === "restart" ? ne(e.connectorId) : e.type === "addAsset" ? re(e.asset, e.seedPrice) : e.type === "status" ? V() : e.type === "health" && B());
}), B();
function te(e) {
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
function M(e) {
	let t = e ?? S, n = y.get(t);
	if (!n) {
		C = "failed", U("connector_failed", t, "error", `Connector ${t} is not registered`), B();
		return;
	}
	P(), S = n.id, C = "starting", R(), n.start(I), C = n.status === "failed" ? "failed" : "running", F(), B();
}
function N() {
	P(), w &&= (clearInterval(w), null), R(), C = "stopped", B();
}
function ne(e) {
	N(), M(e);
}
function re(e, t) {
	if (!(!e.symbol || p.assets.some((t) => t.symbol === e.symbol))) {
		p.assets.push(e), p.seedPrices[e.symbol] = t, p.attentionTargets.includes(e.symbol) || p.attentionTargets.push(e.symbol);
		for (let n of y.values()) n.addAsset?.(e, t);
		U("connector_started", S, "info", `Watchlist asset ${e.symbol} added to ingestion universe`, {
			symbol: e.symbol,
			kind: e.kind,
			source: e.source
		});
	}
}
function P() {
	y.get(S)?.stop();
}
function F() {
	w ||= setInterval(ie, h);
}
function I(e) {
	let t = L(g, e.ticks), n = L(_, e.attention), r = e.bookUpdates && e.bookUpdates.length > 0 ? e.bookUpdates : ve(e.ticks, e.ticks[0]?.source ?? S);
	b.ingestMany(r);
	for (let e of b.drainShocks()) U("signal_generated", S, e.severity === "high" ? "watch" : "info", e.explanation, {
		signalType: "microstructure_market_shock",
		symbol: e.symbol,
		obi: e.obi,
		ofi: e.ofi,
		ofiZScore: e.ofiZScore,
		provenance: e.provenance
	});
	E += t + n;
}
function L(e, t) {
	let n = 0;
	for (let r of t) {
		if (e.length >= ee) {
			T += 1;
			continue;
		}
		e.push(r), n += 1;
	}
	return n;
}
function ie() {
	z();
	let t = g.splice(0, g.length), n = _.splice(0, _.length), r = v.splice(0, v.length);
	j = Date.now(), O += 1;
	let i = {
		type: "batch",
		ticks: t,
		attention: n,
		audits: r,
		health: H()
	};
	e?.postMessage(i);
}
function R() {
	g.length = 0, _.length = 0, v.length = 0;
}
function z() {
	let e = Date.now(), t = e - A;
	t < 1e3 || (D = E * 1e3 / t, k = O * 1e3 / t, E = 0, O = 0, A = e);
}
function B() {
	let t = {
		type: "health",
		health: H()
	};
	e?.postMessage(t);
}
function V() {
	let t = {
		type: "status",
		health: H()
	};
	e?.postMessage(t);
}
function H() {
	z();
	let e = y.get(S), t = [...y.values()].map((e) => ({
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: e.requiresAuth,
		status: e.status,
		lastError: e.lastError,
		reconnectCount: e.reconnectCount,
		sourceTrust: e.sourceTrust,
		packetsPerSecond: e.id === S ? Z(D, 2) : 0,
		droppedPackets: T,
		lastPacketAt: j
	}));
	return {
		activeConnectorId: S,
		ingestionStatus: e?.status ?? "stopped",
		packetsPerSecond: Z(D, 2),
		framesPerSecond: Z(k, 2),
		droppedPackets: T,
		reconnectCount: e?.reconnectCount ?? 0,
		lastFrameTimestamp: j,
		sqliteMode: p.sqliteMode ?? "unknown",
		sourceTrust: e?.sourceTrust ?? "unavailable",
		workerStatus: C,
		connectors: t,
		replay: {
			active: !1,
			playing: !1,
			speed: 1,
			frameCount: 0
		},
		microstructure: b.snapshot()
	};
}
function U(e, t, n, r, i) {
	v.push({
		id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		eventType: e,
		connectorId: t,
		severity: n,
		message: r,
		createdAt: Date.now(),
		metadata: i
	});
}
function ae(e) {
	let t = /* @__PURE__ */ new Map(), n = oe(e), r = W(e), i = pe(e), a = me(), o = he(), s = _e();
	for (let e of [
		n,
		r,
		i,
		a,
		o,
		s
	]) t.set(e.id, e);
	if (m) {
		let n = fe(e);
		t.set(n.id, n);
	}
	return t;
}
function oe(e) {
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
			r = e, i = !1, t = "connecting", U("connector_started", c.id, "info", "Public market REST connector started", {
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
			let t = e, n = [...G(t.coingecko ?? {}, o, c.id), ...se(t.yahoo ?? [], [...s.values()], c.id)];
			return {
				ticks: n,
				attention: Y(n, c.id)
			};
		}
	};
	async function l() {
		if (!(i || a)) {
			a = !0, t = c.reconnectCount > 0 ? "reconnecting" : "connecting";
			try {
				let [e, n] = await Promise.allSettled([K([...o.values()]), le([...s.values()])]), i = e.status === "fulfilled" ? e.value : {}, a = n.status === "fulfilled" ? n.value : [], l = c.normalizeMessage({
					coingecko: i,
					yahoo: a
				}), u = [e.status === "rejected" ? q(e.reason) : "", n.status === "rejected" ? q(n.reason) : ""].filter(Boolean);
				if (l.ticks.length === 0) throw Error(u.join(" / ") || "Public market REST returned no usable prices");
				t = "connected", c.lastError = u.length > 0 ? u.join(" / ") : void 0, u.length > 0 ? U("connector_failed", c.id, "watch", c.lastError ?? "Partial public market REST failure") : c.reconnectCount > 0 && U("reconnect_succeeded", c.id, "info", "Public market REST recovered"), r?.(l);
			} catch (e) {
				t = "failed", c.reconnectCount += 1, c.lastError = q(e), U("connector_failed", c.id, "watch", c.lastError, { reconnectCount: c.reconnectCount });
			} finally {
				a = !1;
			}
		}
	}
	return c;
}
function W(e) {
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
			r = e, i = !1, t = "connecting", U("connector_started", s.id, "info", "CoinGecko public REST connector started", { symbols: [...a.keys()] }), c(), n = setInterval(() => void c(), $("ATLASZ_COINGECKO_POLL_MS", 15e3));
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
			let t = G(e, a, s.id);
			return {
				ticks: t,
				attention: Y(t, s.id)
			};
		}
	};
	async function c() {
		if (!(i || o)) {
			if (a.size === 0) {
				t = "failed", s.lastError = "No CoinGecko-supported crypto assets are configured.", U("connector_failed", s.id, "watch", s.lastError);
				return;
			}
			o = !0;
			try {
				t = s.reconnectCount > 0 ? "reconnecting" : "connecting";
				let e = await K([...a.values()]), n = s.normalizeMessage(e);
				if (n.ticks.length === 0) throw Error("CoinGecko returned no usable crypto prices for the active universe");
				t = "connected", s.reconnectCount > 0 && U("reconnect_succeeded", s.id, "info", "CoinGecko public REST recovered"), s.lastError = void 0, r?.(n);
			} catch (e) {
				t = "failed", s.reconnectCount += 1, s.lastError = q(e), U("connector_failed", s.id, "watch", s.lastError, { reconnectCount: s.reconnectCount });
			} finally {
				o = !1;
			}
		}
	}
	return s;
}
function G(e, t, n) {
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
async function K(e) {
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
function se(e, t, n) {
	let r = [];
	for (let i = 0; i < e.length; i += 1) {
		let a = ce(e[i], t[i], n);
		a && r.push(a);
	}
	return r;
}
function ce(e, t, n) {
	if (!t) return null;
	let r = e.chart?.result?.[0];
	if (!r) return null;
	let i = r.indicators?.quote?.[0], a = i?.close ?? [], o = i?.volume ?? [], s = r.timestamp ?? [], c = de(a), l = Number(r.meta?.regularMarketPrice), u = c ? c.value : l;
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
async function le(e) {
	let t = $("ATLASZ_YAHOO_MAX_SYMBOLS", 64), n = e.slice(0, t);
	if (n.length === 0) return [];
	let r = n.map((e) => ue(e)), i = await Promise.allSettled(r), a = [], o = [];
	for (let e of i) e.status === "fulfilled" ? a.push(e.value) : (a.push({}), o.push(q(e.reason)));
	if (a.every((e) => !e.chart?.result?.[0]) && o.length > 0) throw Error(o.slice(0, 4).join(" / "));
	return a;
}
async function ue(e) {
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
function de(e) {
	for (let t = e.length - 1; t >= 0; --t) {
		let n = Number(e[t]);
		if (Number.isFinite(n) && n > 0) return {
			value: n,
			index: t
		};
	}
	return null;
}
function q(e) {
	return e instanceof Error ? e.message : String(e);
}
function fe(e) {
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
			n ||= (t = "connected", U("connector_started", s.id, "info", "Local simulator connector started"), setInterval(() => {
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
					}), u.push(X(e.symbol, p, f, m, t, s.id, "simulated")), l.push({
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
			}, Math.min(h, 120)));
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
function pe(e) {
	let t = Object.fromEntries(e.assets.filter((e) => e.kind === "crypto" && e.source === "coincap").map((e) => [e.feedSymbol, e.symbol]));
	return Object.keys(t).length === 0 && (t.bitcoin = "BTC", t.ethereum = "ETH"), J({
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
				attention: Y(r, "coincap_public_ws")
			};
		}
	});
}
function me() {
	return J({
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
				attention: Y(a, "binance_public_ws")
			};
		}
	});
}
function he() {
	let e = ge();
	return J({
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
				attention: Y(s, "coinbase_public_ws")
			};
		}
	});
}
function ge() {
	let e = (process.env.ATLASZ_COINBASE_PRODUCTS ?? "BTC-USD,ETH-USD,SOL-USD,LINK-USD,KAS-USD,KAS-USDT").split(",").map((e) => e.trim().toUpperCase()).filter((e) => e.length > 0);
	return Object.fromEntries(e.map((e) => [e, e.split("-")[0]]));
}
function _e() {
	let e = "idle", t = {
		id: "alpaca_iex_placeholder",
		label: "Alpaca IEX placeholder",
		assetClasses: ["equity", "etf"],
		requiresAuth: !0,
		get status() {
			return e;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "auth-gated",
		start() {
			e = "failed", t.lastError = "Alpaca IEX requires an API key and is intentionally disabled in the default local path.", U("connector_failed", t.id, "watch", t.lastError);
		},
		stop() {
			e = "stopped";
		},
		normalizeMessage() {
			return {
				ticks: [],
				attention: []
			};
		}
	};
	return t;
}
function J(e) {
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
			t = "failed", o.lastError = "WebSocket is unavailable in this runtime.", U("connector_failed", o.id, "error", o.lastError);
			return;
		}
		t = o.reconnectCount > 0 ? "reconnecting" : "connecting";
		try {
			n = new i(e.url);
		} catch (e) {
			t = "failed", o.lastError = e instanceof Error ? e.message : String(e), U("connector_failed", o.id, "error", o.lastError), c();
			return;
		}
		n.onopen = () => {
			t = "connected", o.lastError = void 0, e.subscribeMessage && n?.send(JSON.stringify(e.subscribeMessage)), U(o.reconnectCount > 0 ? "reconnect_succeeded" : "connector_started", o.id, "info", `${o.label} connected`);
		}, n.onmessage = (e) => {
			try {
				let t = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
				a?.(o.normalizeMessage(t));
			} catch (e) {
				T += 1, o.lastError = e instanceof Error ? e.message : String(e);
			}
		}, n.onerror = (e) => {
			o.lastError = e instanceof Error ? e.message : `${o.label} socket error`, U("connector_failed", o.id, "watch", o.lastError), n?.close();
		}, n.onclose = () => {
			n = null, !r && c();
		};
	}
	function c() {
		if (r) return;
		t = "reconnecting", o.reconnectCount += 1;
		let e = Math.min(3e4, 500 * 2 ** Math.min(o.reconnectCount, 8));
		U("reconnect_attempted", o.id, "watch", `${o.label} reconnect in ${e}ms`, {
			reconnectCount: o.reconnectCount,
			delay: e
		}), i = setTimeout(s, e);
	}
	return o;
}
function Y(e, t) {
	return e.map((e) => ({
		target: e.symbol,
		pressure: 45,
		mentionVelocity: Math.min(18, Math.max(.5, e.volume * .4)),
		sentimentDivergenceIndex: 0,
		timestamp: e.timestamp,
		source: t
	}));
}
function ve(e, t) {
	return e.map((e) => {
		let n = x.get(e.symbol) ?? e.price;
		x.set(e.symbol, e.price);
		let r = n > 0 ? (e.price - n) / n : 0, i = Math.tanh((e.volume || 1) / 10);
		return X(e.symbol, e.price, r * i, Math.max(1, e.volume), e.timestamp, t, "local-computed");
	});
}
function X(e, t, n, r, i, a, o) {
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
function ye(e, t) {
	let n = Number(process.env[e]);
	return Number.isFinite(n) && n > 0 ? n : t;
}
//#endregion
export {};
