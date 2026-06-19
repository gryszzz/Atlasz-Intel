import { parentPort as e, workerData as t } from "node:worker_threads";
//#region electron/workers/marketIngestionWorker.ts
var n = y(t), r = 2e4, i = n.syncIntervalMs ?? 100, a = [], o = [], s = [], c = P(n), l = n.connectorId ?? (n.enablePublicWs ? "coincap_public_ws" : "simulated"), u = "stopped", d = null, f = 0, p = 0, m = 0, h = 0, g = 0, _ = Date.now(), v;
if (!e) throw Error("Atlasz market ingestion worker requires parentPort");
e.on("message", (e) => {
	!e || typeof e != "object" || (e.type === "start" ? b(e.connectorId) : e.type === "stop" ? x() : e.type === "restart" ? S(e.connectorId) : e.type === "status" ? j() : e.type === "health" && A());
}), A();
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
		u = "failed", N("connector_failed", t, "error", `Connector ${t} is not registered`), A();
		return;
	}
	C(), l = n.id, u = "starting", O(), n.start(T), u = n.status === "failed" ? "failed" : "running", w(), A(), n.status === "failed" && n.id !== "simulated" && b("simulated");
}
function x() {
	C(), d &&= (clearInterval(d), null), O(), u = "stopped", A();
}
function S(e) {
	x(), b(e);
}
function C() {
	c.get(l)?.stop();
}
function w() {
	d ||= setInterval(D, i);
}
function T(e) {
	let t = E(a, e.ticks), n = E(o, e.attention);
	p += t + n;
}
function E(e, t) {
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
function D() {
	k();
	let t = a.splice(0, a.length), n = o.splice(0, o.length), r = s.splice(0, s.length);
	v = Date.now(), h += 1;
	let i = {
		type: "batch",
		ticks: t,
		attention: n,
		audits: r,
		health: M()
	};
	e?.postMessage(i);
}
function O() {
	a.length = 0, o.length = 0, s.length = 0;
}
function k() {
	let e = Date.now(), t = e - _;
	t < 1e3 || (m = p * 1e3 / t, g = h * 1e3 / t, p = 0, h = 0, _ = e);
}
function A() {
	let t = {
		type: "health",
		health: M()
	};
	e?.postMessage(t);
}
function j() {
	let t = {
		type: "status",
		health: M()
	};
	e?.postMessage(t);
}
function M() {
	k();
	let e = c.get(l), t = [...c.values()].map((e) => ({
		id: e.id,
		label: e.label,
		assetClasses: e.assetClasses,
		requiresAuth: e.requiresAuth,
		status: e.status,
		lastError: e.lastError,
		reconnectCount: e.reconnectCount,
		sourceTrust: e.sourceTrust,
		packetsPerSecond: e.id === l ? H(m, 2) : 0,
		droppedPackets: f,
		lastPacketAt: v
	}));
	return {
		activeConnectorId: l,
		ingestionStatus: e?.status ?? "stopped",
		packetsPerSecond: H(m, 2),
		framesPerSecond: H(g, 2),
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
function N(e, t, n, r, i) {
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
function P(e) {
	let t = /* @__PURE__ */ new Map(), n = F(e), r = I(), i = L(), a = R(), o = z();
	for (let e of [
		n,
		r,
		i,
		a,
		o
	]) t.set(e.id, e);
	return t;
}
function F(e) {
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
			"index"
		],
		requiresAuth: !1,
		get status() {
			return t;
		},
		lastError: void 0,
		reconnectCount: 0,
		sourceTrust: "simulated",
		start(e) {
			n ||= (t = "connected", N("connector_started", c.id, "info", "Local simulator connector started"), setInterval(() => {
				let t = Date.now(), n = (Math.random() - .5) * 9e-4, i = [], l = [];
				for (let e of o) {
					let o = a.get(e.symbol) ?? 100, s = (Math.random() - .5) * .0022, u = (r.get(e.symbol) ?? 0) * .6, d = n + s + u;
					r.set(e.symbol, d);
					let f = Math.max(1e-4, o * (1 + d));
					a.set(e.symbol, f);
					let p = Math.random() < .06 ? 4 + Math.random() * 8 : 1;
					i.push({
						symbol: e.symbol,
						price: H(f, 6),
						volume: H((20 + Math.random() * 60) * p, 2),
						timestamp: t,
						source: c.id
					}), l.push({
						target: e.symbol,
						pressure: H(U(38 + Math.abs(d) * 12e3 + (p - 1) * 5, 0, 100), 2),
						mentionVelocity: H(Math.max(0, p - .8 + Math.abs(d) * 1e3), 2),
						sentimentDivergenceIndex: H(U(d * 280 + (Math.random() - .5) * .18, -1, 1), 3),
						timestamp: t,
						source: c.id
					});
				}
				for (let e of s) {
					if (a.has(e)) continue;
					let n = U(35 + Math.random() * 30 + (Math.random() < .04 ? 35 : 0), 0, 100);
					l.push({
						target: e,
						pressure: H(n, 2),
						mentionVelocity: H(Math.max(0, n / 18 + (Math.random() - .4) * 3), 2),
						sentimentDivergenceIndex: H(U((Math.random() - .5) * .7, -1, 1), 3),
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
		normalizeMessage() {
			return {
				ticks: [],
				attention: []
			};
		}
	};
	return c;
}
function I() {
	let e = {
		bitcoin: "BTC",
		ethereum: "ETH"
	};
	return B({
		id: "coincap_public_ws",
		label: "CoinCap public WebSocket",
		url: "wss://ws.coincap.io/prices?assets=bitcoin,ethereum",
		assetClasses: ["crypto"],
		sourceTrust: "public unauthenticated",
		normalizeMessage(t) {
			if (!t || typeof t != "object") return {
				ticks: [],
				attention: []
			};
			let n = Date.now(), r = Object.entries(t).map(([t, r]) => {
				let i = e[t], a = Number(r);
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
				attention: V(r, "coincap_public_ws")
			};
		}
	});
}
function L() {
	return B({
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
				attention: V(a, "binance_public_ws")
			};
		}
	});
}
function R() {
	return B({
		id: "coinbase_public_ws",
		label: "Coinbase public ticker",
		url: "wss://ws-feed.exchange.coinbase.com",
		subscribeMessage: {
			type: "subscribe",
			product_ids: ["BTC-USD", "ETH-USD"],
			channels: ["ticker"]
		},
		assetClasses: ["crypto"],
		sourceTrust: "public unauthenticated",
		normalizeMessage(e) {
			if (!e || typeof e != "object") return {
				ticks: [],
				attention: []
			};
			let t = e;
			if (t.type !== "ticker") return {
				ticks: [],
				attention: []
			};
			let n = String(t.product_id ?? ""), r = n.startsWith("BTC") ? "BTC" : n.startsWith("ETH") ? "ETH" : "", i = Number(t.price), a = Number(t.last_size);
			if (!r || !Number.isFinite(i) || i <= 0) return {
				ticks: [],
				attention: []
			};
			let o = [{
				symbol: r,
				price: i,
				volume: Number.isFinite(a) && a > 0 ? a : 1,
				timestamp: Date.now(),
				source: "coinbase_public_ws"
			}];
			return {
				ticks: o,
				attention: V(o, "coinbase_public_ws")
			};
		}
	});
}
function z() {
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
			e = "failed", t.lastError = "Alpaca IEX requires an API key and is intentionally disabled in the default local path.", N("connector_failed", t.id, "watch", t.lastError);
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
function B(e) {
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
			t = "failed", o.lastError = "WebSocket is unavailable in this runtime.", N("connector_failed", o.id, "error", o.lastError);
			return;
		}
		t = o.reconnectCount > 0 ? "reconnecting" : "connecting";
		try {
			n = new i(e.url);
		} catch (e) {
			t = "failed", o.lastError = e instanceof Error ? e.message : String(e), N("connector_failed", o.id, "error", o.lastError), c();
			return;
		}
		n.onopen = () => {
			t = "connected", o.lastError = void 0, e.subscribeMessage && n?.send(JSON.stringify(e.subscribeMessage)), N(o.reconnectCount > 0 ? "reconnect_succeeded" : "connector_started", o.id, "info", `${o.label} connected`);
		}, n.onmessage = (e) => {
			try {
				let t = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
				a?.(o.normalizeMessage(t));
			} catch (e) {
				f += 1, o.lastError = e instanceof Error ? e.message : String(e);
			}
		}, n.onerror = (e) => {
			o.lastError = e instanceof Error ? e.message : `${o.label} socket error`, N("connector_failed", o.id, "watch", o.lastError), n?.close();
		}, n.onclose = () => {
			n = null, !r && c();
		};
	}
	function c() {
		if (r) return;
		t = "reconnecting", o.reconnectCount += 1;
		let e = Math.min(3e4, 500 * 2 ** Math.min(o.reconnectCount, 8));
		N("reconnect_attempted", o.id, "watch", `${o.label} reconnect in ${e}ms`, {
			reconnectCount: o.reconnectCount,
			delay: e
		}), i = setTimeout(s, e);
	}
	return o;
}
function V(e, t) {
	return e.map((e) => ({
		target: e.symbol,
		pressure: 45,
		mentionVelocity: Math.min(18, Math.max(.5, e.volume * .4)),
		sentimentDivergenceIndex: 0,
		timestamp: e.timestamp,
		source: t
	}));
}
function H(e, t = 2) {
	let n = 10 ** t;
	return Math.round(e * n) / n;
}
function U(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
//#endregion
export {};
