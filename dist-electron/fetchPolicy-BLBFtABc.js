//#region electron/osint/fetchPolicy.ts
var e = class extends Error {
	status;
	retryAfterMs;
	constructor(e, t, n) {
		super(e), this.name = "HttpError", this.status = t, this.retryAfterMs = n;
	}
};
function t(t, r, i = Date.now()) {
	if (t.ok) return;
	let a = n(t.headers.get("retry-after"), i);
	throw new e(`${r} HTTP ${t.status}`, t.status, a);
}
function n(e, t = Date.now()) {
	if (!e) return;
	let n = e.trim();
	if (/^\d+$/.test(n)) return Math.max(0, Number(n) * 1e3);
	let r = Date.parse(n);
	if (Number.isFinite(r)) return Math.max(0, r - t);
}
var r = new Set([
	408,
	425,
	429,
	500,
	502,
	503,
	504
]);
function i(e) {
	return e !== void 0 && r.has(e);
}
function a(e, t, n = 6e4) {
	return e <= 0 ? 0 : Math.min(n, e * 2 ** t);
}
async function o(t, n, r = {}) {
	let o = r.sleep ?? s, c = n.maxRetryWaitMs ?? (n.timeoutMs > 0 ? n.timeoutMs : 6e4), l = 0;
	for (;;) {
		let s = new AbortController(), u = n.timeoutMs > 0 ? setTimeout(() => s.abort(), n.timeoutMs) : void 0;
		try {
			return await t(s.signal);
		} catch (t) {
			let s = t instanceof e ? t.status : void 0;
			if (l >= n.maxRetries || !i(s)) throw t;
			let u = t instanceof e ? t.retryAfterMs : void 0;
			if (u !== void 0 && u > c) throw t;
			let d = u ?? a(n.backoffMs, l);
			r.onRetry?.({
				attempt: l,
				waitMs: d,
				status: s
			}), l += 1, await o(d);
		} finally {
			u && clearTimeout(u);
		}
	}
}
function s(e) {
	return new Promise((t) => {
		setTimeout(t, Math.max(0, e)).unref?.();
	});
}
//#endregion
export { t as n, o as r, e as t };
