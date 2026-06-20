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
var p = M(t), m = 2e4, h = p.syncIntervalMs ?? 100, g = [], _ = [], v = [], y = K(p), b = new a({
	capacity: se("ATLASZ_MICROSTRUCTURE_BUFFER_SIZE", 1e4),
	zScoreThreshold: ce("ATLASZ_MICROSTRUCTURE_ZSCORE", 2.5)
}), x = /* @__PURE__ */ new Map(), S = p.connectorId ?? (p.enablePublicWs ? "coincap_public_ws" : "simulated"), C = "stopped", w = null, T = 0, E = 0, D = 0, O = 0, k = 0, A = Date.now(), j;
if (!e) throw Error("Atlasz market ingestion worker requires parentPort");
e.on("message", (e) => {
	!e || typeof e != "object" || (e.type === "start" ? N(e.connectorId) : e.type === "stop" ? P() : e.type === "restart" ? ee(e.connectorId) : e.type === "addAsset" ? te(e.asset, e.seedPrice) : e.type === "status" ? U() : e.type === "health" && H());
}), H();
function M(e) {
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
function N(e) {
	let t = e ?? S, n = y.get(t) ?? y.get("simulated");
	if (!n) {
		C = "failed", G("connector_failed", t, "error", `Connector ${t} is not registered`), H();
		return;
	}
	F(), S = n.id, C = "starting", B(), n.start(L), C = n.status === "failed" ? "failed" : "running", I(), H(), n.status === "failed" && n.id !== "simulated" && N("simulated");
}
function P() {
	F(), w &&= (clearInterval(w), null), B(), C = "stopped", H();
}
function ee(e) {
	P(), N(e);
}
function te(e, t) {
	if (!(!e.symbol || p.assets.some((t) => t.symbol === e.symbol))) {
		p.assets.push(e), p.seedPrices[e.symbol] = t, p.attentionTargets.includes(e.symbol) || p.attentionTargets.push(e.symbol);
		for (let n of y.values()) n.addAsset?.(e, t);
		G("connector_started", S, "info", `Watchlist asset ${e.symbol} added to ingestion universe`, {
			symbol: e.symbol,
			kind: e.kind,
			source: e.source
		});
	}
}
function F() {
	y.get(S)?.stop();
}
function I() {
	w ||= setInterval(z, h);
}
function L(e) {
	let t = R(g, e.ticks), n = R(_, e.attention), r = e.bookUpdates && e.bookUpdates.length > 0 ? e.bookUpdates : oe(e.ticks, e.ticks[0]?.source ?? S);
	b.ingestMany(r);
	for (let e of b.drainShocks()) G("signal_generated", S, e.severity === "high" ? "watch" : "info", e.explanation, {
		signalType: "microstructure_market_shock",
		symbol: e.symbol,
		obi: e.obi,
		ofi: e.ofi,
		ofiZScore: e.ofiZScore,
		provenance: e.provenance
	});
	E += t + n;
}
function R(e, t) {
	let n = 0;
	for (let r of t) {
		if (e.length >= m) {
			T += 1;
			continue;
		}
		e.push(r), n += 1;
	}
	return n;
}
function z() {
	V();
	let t = g.splice(0, g.length), n = _.splice(0, _.length), r = v.splice(0, v.length);
	j = Date.now(), O += 1;
	let i = {
		type: "batch",
		ticks: t,
		attention: n,
		audits: r,
		health: W()
	};
	e?.postMessage(i);
}
function B() {
	g.length = 0, _.length = 0, v.length = 0;
}
function V() {
	let e = Date.now(), t = e - A;
	t < 1e3 || (D = E * 1e3 / t, k = O * 1e3 / t, E = 0, O = 0, A = e);
}
function H() {
	let t = {
		type: "health",
		health: W()
	};
	e?.postMessage(t);
}
function U() {
	let t = {
		type: "status",
		health: W()
	};
	e?.postMessage(t);
}
function W() {
	V();
	let e = y.get(S), t = [...y.values()].map((e) => ({
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: e.requiresAuth,
		status: e.status,
		lastError: e.lastError,
		reconnectCount: e.reconnectCount,
		sourceTrust: e.sourceTrust,
		packetsPerSecond: e.id === S ? Q(D, 2) : 0,
		droppedPackets: T,
		lastPacketAt: j
	}));
	return {
		activeConnectorId: S,
		ingestionStatus: e?.status ?? "stopped",
		packetsPerSecond: Q(D, 2),
		framesPerSecond: Q(k, 2),
		droppedPackets: T,
		reconnectCount: e?.reconnectCount ?? 0,
		lastFrameTimestamp: j,
		sqliteMode: p.sqliteMode ?? "unknown",
		sourceTrust: e?.sourceTrust ?? "simulated",
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
function G(e, t, n, r, i) {
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
function K(e) {
	let t = /* @__PURE__ */ new Map(), n = q(e), r = J(e), i = ne(), a = re(), o = ae();
	for (let e of [
		n,
		r,
		i,
		a,
		o
	]) t.set(e.id, e);
	return t;
}
function q(e) {
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
			n ||= (t = "connected", G("connector_started", s.id, "info", "Local simulator connector started"), setInterval(() => {
				let t = Date.now(), n = (Math.random() - .5) * 9e-4, c = [], l = [], u = [];
				for (let e of a) {
					let a = i.get(e.symbol) ?? 100, o = (Math.random() - .5) * .0022, d = (r.get(e.symbol) ?? 0) * .6, f = n + o + d;
					r.set(e.symbol, f);
					let p = Math.max(1e-4, a * (1 + f));
					i.set(e.symbol, p);
					let m = Math.random() < .06 ? 4 + Math.random() * 8 : 1;
					c.push({
						symbol: e.symbol,
						price: Q(p, 6),
						volume: Q((20 + Math.random() * 60) * m, 2),
						timestamp: t,
						source: s.id
					}), u.push(Z(e.symbol, p, f, m, t, s.id, "simulated")), l.push({
						target: e.symbol,
						pressure: Q($(38 + Math.abs(f) * 12e3 + (m - 1) * 5, 0, 100), 2),
						mentionVelocity: Q(Math.max(0, m - .8 + Math.abs(f) * 1e3), 2),
						sentimentDivergenceIndex: Q($(f * 280 + (Math.random() - .5) * .18, -1, 1), 3),
						timestamp: t,
						source: s.id
					});
				}
				for (let e of o) {
					if (i.has(e)) continue;
					let n = $(35 + Math.random() * 30 + (Math.random() < .04 ? 35 : 0), 0, 100);
					l.push({
						target: e,
						pressure: Q(n, 2),
						mentionVelocity: Q(Math.max(0, n / 18 + (Math.random() - .4) * 3), 2),
						sentimentDivergenceIndex: Q($((Math.random() - .5) * .7, -1, 1), 3),
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
function J(e) {
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
function ne() {
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
function re() {
	let e = ie();
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
function ie() {
	let e = (process.env.ATLASZ_COINBASE_PRODUCTS ?? "BTC-USD,ETH-USD,SOL-USD,LINK-USD,KAS-USD,KAS-USDT").split(",").map((e) => e.trim().toUpperCase()).filter((e) => e.length > 0);
	return Object.fromEntries(e.map((e) => [e, e.split("-")[0]]));
}
function ae() {
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
		sourceTrust: "authenticated",
		start() {
			e = "failed", t.lastError = "Alpaca IEX requires an API key and is intentionally disabled in the default local path.", G("connector_failed", t.id, "watch", t.lastError);
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
			t = "failed", o.lastError = "WebSocket is unavailable in this runtime.", G("connector_failed", o.id, "error", o.lastError);
			return;
		}
		t = o.reconnectCount > 0 ? "reconnecting" : "connecting";
		try {
			n = new i(e.url);
		} catch (e) {
			t = "failed", o.lastError = e instanceof Error ? e.message : String(e), G("connector_failed", o.id, "error", o.lastError), c();
			return;
		}
		n.onopen = () => {
			t = "connected", o.lastError = void 0, e.subscribeMessage && n?.send(JSON.stringify(e.subscribeMessage)), G(o.reconnectCount > 0 ? "reconnect_succeeded" : "connector_started", o.id, "info", `${o.label} connected`);
		}, n.onmessage = (e) => {
			try {
				let t = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
				a?.(o.normalizeMessage(t));
			} catch (e) {
				T += 1, o.lastError = e instanceof Error ? e.message : String(e);
			}
		}, n.onerror = (e) => {
			o.lastError = e instanceof Error ? e.message : `${o.label} socket error`, G("connector_failed", o.id, "watch", o.lastError), n?.close();
		}, n.onclose = () => {
			n = null, !r && c();
		};
	}
	function c() {
		if (r) return;
		t = "reconnecting", o.reconnectCount += 1;
		let e = Math.min(3e4, 500 * 2 ** Math.min(o.reconnectCount, 8));
		G("reconnect_attempted", o.id, "watch", `${o.label} reconnect in ${e}ms`, {
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
function oe(e, t) {
	return e.map((e) => {
		let n = x.get(e.symbol) ?? e.price;
		x.set(e.symbol, e.price);
		let r = n > 0 ? (e.price - n) / n : 0, i = Math.tanh((e.volume || 1) / 10);
		return Z(e.symbol, e.price, r * i, Math.max(1, e.volume), e.timestamp, t, "local-computed");
	});
}
function Z(e, t, n, r, i, a, o) {
	let s = Date.now(), c = t * (Math.max(1, Math.min(18, 4 + Math.abs(n) * 12e3)) / 2e4), l = Math.max(1, 60 * r), u = $(n * 3500, -.82, .82);
	return {
		symbol: e,
		bidPrice: Q(Math.max(1e-6, t - c), 8),
		askPrice: Q(t + c, 8),
		bidVolume: Q(l * (1 + u), 6),
		askVolume: Q(l * (1 - u), 6),
		timestamp: i,
		source: a,
		provenance: o,
		dataMode: "PROXY_TRADE_FLOW_PRESSURE",
		packetReceivedAt: s,
		normalizedAt: Date.now()
	};
}
function Q(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function $(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function se(e, t) {
	let n = Number(process.env[e]);
	return Number.isInteger(n) && n > 0 ? n : t;
}
function ce(e, t) {
	let n = Number(process.env[e]);
	return Number.isFinite(n) && n > 0 ? n : t;
}
//#endregion
export {};
