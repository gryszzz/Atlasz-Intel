import { parentPort as e, workerData as t } from "node:worker_threads";
//#region electron/workers/marketIngestionWorker.ts
var n = y(t), r = 2e4, i = n.syncIntervalMs ?? 100, a = [], o = [], s = [], c = F(n), l = n.connectorId ?? (n.enablePublicWs ? "coincap_public_ws" : "simulated"), u = "stopped", d = null, f = 0, p = 0, m = 0, h = 0, g = 0, _ = Date.now(), v;
if (!e) throw Error("Atlasz market ingestion worker requires parentPort");
e.on("message", (e) => {
	!e || typeof e != "object" || (e.type === "start" ? b(e.connectorId) : e.type === "stop" ? x() : e.type === "restart" ? S(e.connectorId) : e.type === "addAsset" ? C(e.asset, e.seedPrice) : e.type === "status" ? M() : e.type === "health" && j());
}), j();
function y(e) {
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
function b(e) {
	let t = e ?? l, n = c.get(t) ?? c.get("simulated");
	if (!n) {
		u = "failed", P("connector_failed", t, "error", `Connector ${t} is not registered`), j();
		return;
	}
	w(), l = n.id, u = "starting", k(), n.start(E), u = n.status === "failed" ? "failed" : "running", T(), j(), n.status === "failed" && n.id !== "simulated" && b("simulated");
}
function x() {
	w(), d &&= (clearInterval(d), null), k(), u = "stopped", j();
}
function S(e) {
	x(), b(e);
}
function C(e, t) {
	if (!(!e.symbol || n.assets.some((t) => t.symbol === e.symbol))) {
		n.assets.push(e), n.seedPrices[e.symbol] = t, n.attentionTargets.includes(e.symbol) || n.attentionTargets.push(e.symbol);
		for (let n of c.values()) n.addAsset?.(e, t);
		P("connector_started", l, "info", `Watchlist asset ${e.symbol} added to ingestion universe`, {
			symbol: e.symbol,
			kind: e.kind,
			source: e.source
		});
	}
}
function w() {
	c.get(l)?.stop();
}
function T() {
	d ||= setInterval(O, i);
}
function E(e) {
	let t = D(a, e.ticks), n = D(o, e.attention);
	p += t + n;
}
function D(e, t) {
	let n = 0;
	for (let i of t) {
		if (e.length >= r) {
			f += 1;
			continue;
		}
		e.push(i), n += 1;
	}
	return n;
}
function O() {
	A();
	let t = a.splice(0, a.length), n = o.splice(0, o.length), r = s.splice(0, s.length);
	v = Date.now(), h += 1;
	let i = {
		type: "batch",
		ticks: t,
		attention: n,
		audits: r,
		health: N()
	};
	e?.postMessage(i);
}
function k() {
	a.length = 0, o.length = 0, s.length = 0;
}
function A() {
	let e = Date.now(), t = e - _;
	t < 1e3 || (m = p * 1e3 / t, g = h * 1e3 / t, p = 0, h = 0, _ = e);
}
function j() {
	let t = {
		type: "health",
		health: N()
	};
	e?.postMessage(t);
}
function M() {
	let t = {
		type: "status",
		health: N()
	};
	e?.postMessage(t);
}
function N() {
	A();
	let e = c.get(l), t = [...c.values()].map((e) => ({
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: e.requiresAuth,
		status: e.status,
		lastError: e.lastError,
		reconnectCount: e.reconnectCount,
		sourceTrust: e.sourceTrust,
		packetsPerSecond: e.id === l ? W(m, 2) : 0,
		droppedPackets: f,
		lastPacketAt: v
	}));
	return {
		activeConnectorId: l,
		ingestionStatus: e?.status ?? "stopped",
		packetsPerSecond: W(m, 2),
		framesPerSecond: W(g, 2),
		droppedPackets: f,
		reconnectCount: e?.reconnectCount ?? 0,
		lastFrameTimestamp: v,
		sqliteMode: n.sqliteMode ?? "unknown",
		sourceTrust: e?.sourceTrust ?? "simulated",
		workerStatus: u,
		connectors: t,
		replay: {
			active: !1,
			playing: !1,
			speed: 1,
			frameCount: 0
		}
	};
}
function P(e, t, n, r, i) {
	s.push({
		id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		eventType: e,
		connectorId: t,
		severity: n,
		message: r,
		createdAt: Date.now(),
		metadata: i
	});
}
function F(e) {
	let t = /* @__PURE__ */ new Map(), n = I(e), r = L(e), i = R(), a = z(), o = V();
	for (let e of [
		n,
		r,
		i,
		a,
		o
	]) t.set(e.id, e);
	return t;
}
function I(e) {
	let t = "idle", n = null, r = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), o = e.assets, s = new Set(e.attentionTargets);
	for (let t of o) a.set(t.symbol, e.seedPrices[t.symbol] ?? 100), r.set(t.symbol, 0), s.add(t.symbol);
	let c = {
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
			n ||= (t = "connected", P("connector_started", c.id, "info", "Local simulator connector started"), setInterval(() => {
				let t = Date.now(), n = (Math.random() - .5) * 9e-4, i = [], l = [];
				for (let e of o) {
					let o = a.get(e.symbol) ?? 100, s = (Math.random() - .5) * .0022, u = (r.get(e.symbol) ?? 0) * .6, d = n + s + u;
					r.set(e.symbol, d);
					let f = Math.max(1e-4, o * (1 + d));
					a.set(e.symbol, f);
					let p = Math.random() < .06 ? 4 + Math.random() * 8 : 1;
					i.push({
						symbol: e.symbol,
						price: W(f, 6),
						volume: W((20 + Math.random() * 60) * p, 2),
						timestamp: t,
						source: c.id
					}), l.push({
						target: e.symbol,
						pressure: W(G(38 + Math.abs(d) * 12e3 + (p - 1) * 5, 0, 100), 2),
						mentionVelocity: W(Math.max(0, p - .8 + Math.abs(d) * 1e3), 2),
						sentimentDivergenceIndex: W(G(d * 280 + (Math.random() - .5) * .18, -1, 1), 3),
						timestamp: t,
						source: c.id
					});
				}
				for (let e of s) {
					if (a.has(e)) continue;
					let n = G(35 + Math.random() * 30 + (Math.random() < .04 ? 35 : 0), 0, 100);
					l.push({
						target: e,
						pressure: W(n, 2),
						mentionVelocity: W(Math.max(0, n / 18 + (Math.random() - .4) * 3), 2),
						sentimentDivergenceIndex: W(G((Math.random() - .5) * .7, -1, 1), 3),
						timestamp: t,
						source: c.id
					});
				}
				e({
					ticks: i,
					attention: l
				});
			}, Math.min(i, 120)));
		},
		stop() {
			n &&= (clearInterval(n), null), t = "stopped";
		},
		addAsset(e, t) {
			a.has(e.symbol) || (a.set(e.symbol, t), r.set(e.symbol, 0)), s.add(e.symbol);
		},
		normalizeMessage() {
			return {
				ticks: [],
				attention: []
			};
		}
	};
	return c;
}
function L(e) {
	let t = Object.fromEntries(e.assets.filter((e) => e.kind === "crypto" && e.source === "coincap").map((e) => [e.feedSymbol, e.symbol]));
	return Object.keys(t).length === 0 && (t.bitcoin = "BTC", t.ethereum = "ETH"), H({
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
				attention: U(r, "coincap_public_ws")
			};
		}
	});
}
function R() {
	return H({
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
				attention: U(a, "binance_public_ws")
			};
		}
	});
}
function z() {
	let e = B();
	return H({
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
				attention: U(s, "coinbase_public_ws")
			};
		}
	});
}
function B() {
	let e = (process.env.ATLASZ_COINBASE_PRODUCTS ?? "BTC-USD,ETH-USD,SOL-USD,LINK-USD,KAS-USD,KAS-USDT").split(",").map((e) => e.trim().toUpperCase()).filter((e) => e.length > 0);
	return Object.fromEntries(e.map((e) => [e, e.split("-")[0]]));
}
function V() {
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
			e = "failed", t.lastError = "Alpaca IEX requires an API key and is intentionally disabled in the default local path.", P("connector_failed", t.id, "watch", t.lastError);
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
function H(e) {
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
			t = "failed", o.lastError = "WebSocket is unavailable in this runtime.", P("connector_failed", o.id, "error", o.lastError);
			return;
		}
		t = o.reconnectCount > 0 ? "reconnecting" : "connecting";
		try {
			n = new i(e.url);
		} catch (e) {
			t = "failed", o.lastError = e instanceof Error ? e.message : String(e), P("connector_failed", o.id, "error", o.lastError), c();
			return;
		}
		n.onopen = () => {
			t = "connected", o.lastError = void 0, e.subscribeMessage && n?.send(JSON.stringify(e.subscribeMessage)), P(o.reconnectCount > 0 ? "reconnect_succeeded" : "connector_started", o.id, "info", `${o.label} connected`);
		}, n.onmessage = (e) => {
			try {
				let t = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
				a?.(o.normalizeMessage(t));
			} catch (e) {
				f += 1, o.lastError = e instanceof Error ? e.message : String(e);
			}
		}, n.onerror = (e) => {
			o.lastError = e instanceof Error ? e.message : `${o.label} socket error`, P("connector_failed", o.id, "watch", o.lastError), n?.close();
		}, n.onclose = () => {
			n = null, !r && c();
		};
	}
	function c() {
		if (r) return;
		t = "reconnecting", o.reconnectCount += 1;
		let e = Math.min(3e4, 500 * 2 ** Math.min(o.reconnectCount, 8));
		P("reconnect_attempted", o.id, "watch", `${o.label} reconnect in ${e}ms`, {
			reconnectCount: o.reconnectCount,
			delay: e
		}), i = setTimeout(s, e);
	}
	return o;
}
function U(e, t) {
	return e.map((e) => ({
		target: e.symbol,
		pressure: 45,
		mentionVelocity: Math.min(18, Math.max(.5, e.volume * .4)),
		sentimentDivergenceIndex: 0,
		timestamp: e.timestamp,
		source: t
	}));
}
function W(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function G(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
//#endregion
export {};
