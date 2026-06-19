import { i as e, n as t, r as n, t as r } from "./main.js";
import { createRequire as i } from "node:module";
import { dirname as a } from "node:path";
import { fileURLToPath as o, pathToFileURL as s } from "node:url";
//#region node_modules/yahoo-finance2/esm/_dnt.polyfills.js
var c = (e, t) => {
	Reflect.has(globalThis, Symbol.for(e)) || Object.defineProperty(globalThis, Symbol.for(e), {
		configurable: !0,
		get() {
			return t;
		}
	});
};
c("import-meta-ponyfill-commonjs", Reflect.get(globalThis, Symbol.for("import-meta-ponyfill-commonjs")) ?? (() => {
	let e = /* @__PURE__ */ new WeakMap();
	return (t, n) => {
		let r = e.get(n);
		if (r == null) {
			let a = Object.assign(Object.create(null), {
				url: s(n.filename).href,
				main: t.main == n,
				resolve: (e, n = a.url) => s((a.url === n ? t : i(n)).resolve(e)).href,
				filename: n.filename,
				dirname: n.path
			});
			e.set(n, a), r = a;
		}
		return r;
	};
})());
var l = Reflect.get(globalThis, Symbol.for("import-meta-ponyfill-esmodule")) ?? ((e) => {
	let t = String(e.resolve), n = /* @__PURE__ */ new WeakSet(), r = ("file:///" + process.argv[1].replace(/\\/g, "/")).replace(/\/{3,}/, "///"), c = (e) => {
		typeof e.main != "boolean" && (e.main = e.url === r), typeof e.filename != "string" && (e.filename = o(e.url), e.dirname = a(e.filename));
	};
	return l = t === "undefined" || t.startsWith("async") ? (e) => {
		if (!n.has(e)) {
			n.add(e);
			let t = {
				url: e.url,
				require: i(e.url)
			};
			e.resolve = function(n, r = e.url) {
				return s((t.url === r ? t.require : i(r)).resolve(n)).href;
			}, c(e);
		}
		return e;
	} : (e) => (n.has(e) || (n.add(e), c(e)), e), l(e);
});
c("import-meta-ponyfill-esmodule", l);
//#endregion
//#region node_modules/tough-cookie/dist/pathMatch.js
var u = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.pathMatch = t;
	function t(e, t) {
		return !!(t === e || e.indexOf(t) === 0 && (t[t.length - 1] === "/" || e.startsWith(t) && e[t.length] === "/"));
	}
}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/domain.js
function d(e, t) {
	return e.endsWith(t) ? e.length === t.length || e[e.length - t.length - 1] === "." : !1;
}
function f(e, t) {
	let n = e.length - t.length - 2, r = e.lastIndexOf(".", n);
	return r === -1 ? e : e.slice(r + 1);
}
function p(e, t, n) {
	if (n.validHosts !== null) {
		let e = n.validHosts;
		for (let n of e) if (d(t, n)) return n;
	}
	let r = 0;
	if (t.startsWith(".")) for (; r < t.length && t[r] === ".";) r += 1;
	return e.length === t.length - r ? null : f(t, e);
}
var m = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/domain-without-suffix.js
function h(e, t) {
	return e.slice(0, -t.length - 1);
}
var g = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/extract-hostname.js
function _(e, t) {
	let n = 0, r = e.length, i = !1;
	if (!t) {
		if (e.startsWith("data:")) return null;
		for (; n < e.length && e.charCodeAt(n) <= 32;) n += 1;
		for (; r > n + 1 && e.charCodeAt(r - 1) <= 32;) --r;
		if (e.charCodeAt(n) === 47 && e.charCodeAt(n + 1) === 47) n += 2;
		else {
			let t = e.indexOf(":/", n);
			if (t !== -1) {
				let r = t - n, i = e.charCodeAt(n), a = e.charCodeAt(n + 1), o = e.charCodeAt(n + 2), s = e.charCodeAt(n + 3), c = e.charCodeAt(n + 4);
				if (!(r === 5 && i === 104 && a === 116 && o === 116 && s === 112 && c === 115) && !(r === 4 && i === 104 && a === 116 && o === 116 && s === 112) && !(r === 3 && i === 119 && a === 115 && o === 115) && !(r === 2 && i === 119 && a === 115)) for (let r = n; r < t; r += 1) {
					let t = e.charCodeAt(r) | 32;
					if (!(t >= 97 && t <= 122 || t >= 48 && t <= 57 || t === 46 || t === 45 || t === 43)) return null;
				}
				for (n = t + 2; e.charCodeAt(n) === 47;) n += 1;
			}
		}
		let t = -1, a = -1, o = -1;
		for (let s = n; s < r; s += 1) {
			let n = e.charCodeAt(s);
			if (n === 35 || n === 47 || n === 63) {
				r = s;
				break;
			} else n === 64 ? t = s : n === 93 ? a = s : n === 58 ? o = s : n >= 65 && n <= 90 && (i = !0);
		}
		if (t !== -1 && t > n && t < r && (n = t + 1), e.charCodeAt(n) === 91) return a === -1 ? null : e.slice(n + 1, a).toLowerCase();
		o !== -1 && o > n && o < r && (r = o);
	}
	for (; r > n + 1 && e.charCodeAt(r - 1) === 46;) --r;
	let a = n !== 0 || r !== e.length ? e.slice(n, r) : e;
	return i ? a.toLowerCase() : a;
}
var v = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/is-ip.js
function y(e) {
	if (e.length < 7 || e.length > 15) return !1;
	let t = 0;
	for (let n = 0; n < e.length; n += 1) {
		let r = e.charCodeAt(n);
		if (r === 46) t += 1;
		else if (r < 48 || r > 57) return !1;
	}
	return t === 3 && e.charCodeAt(0) !== 46 && e.charCodeAt(e.length - 1) !== 46;
}
function b(e) {
	if (e.length < 3) return !1;
	let t = +!!e.startsWith("["), n = e.length;
	if (e[n - 1] === "]" && --n, n - t > 39) return !1;
	let r = !1;
	for (; t < n; t += 1) {
		let n = e.charCodeAt(t);
		if (n === 58) r = !0;
		else if (!(n >= 48 && n <= 57 || n >= 97 && n <= 102 || n >= 65 && n <= 90)) return !1;
	}
	return r;
}
function x(e) {
	return b(e) || y(e);
}
var S = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/is-valid.js
function C(e) {
	return e >= 97 && e <= 122 || e >= 48 && e <= 57 || e > 127;
}
function w(e) {
	if (e.length > 255 || e.length === 0 || !C(e.charCodeAt(0)) && e.charCodeAt(0) !== 46 && e.charCodeAt(0) !== 95) return !1;
	let t = -1, n = -1, r = e.length;
	for (let i = 0; i < r; i += 1) {
		let r = e.charCodeAt(i);
		if (r === 46) {
			if (i - t > 64 || n === 46 || n === 45 || n === 95) return !1;
			t = i;
		} else if (!(C(r) || r === 45 || r === 95)) return !1;
		n = r;
	}
	return r - t - 1 <= 63 && n !== 45;
}
var T = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/options.js
function E({ allowIcannDomains: e = !0, allowPrivateDomains: t = !1, detectIp: n = !0, extractHostname: r = !0, mixedInputs: i = !0, validHosts: a = null, validateHostname: o = !0 }) {
	return {
		allowIcannDomains: e,
		allowPrivateDomains: t,
		detectIp: n,
		extractHostname: r,
		mixedInputs: i,
		validHosts: a,
		validateHostname: o
	};
}
function D(e) {
	return e === void 0 ? O : E(e);
}
var O, k = t((() => {
	O = E({});
}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/subdomain.js
function ee(e, t) {
	return t.length === e.length ? "" : e.slice(0, -t.length - 1);
}
var te = t((() => {}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/factory.js
function ne() {
	return {
		domain: null,
		domainWithoutSuffix: null,
		hostname: null,
		isIcann: null,
		isIp: null,
		isPrivate: null,
		publicSuffix: null,
		subdomain: null
	};
}
function A(e) {
	e.domain = null, e.domainWithoutSuffix = null, e.hostname = null, e.isIcann = null, e.isIp = null, e.isPrivate = null, e.publicSuffix = null, e.subdomain = null;
}
function j(e, t, n, r, i) {
	let a = D(r);
	return typeof e != "string" || (a.extractHostname ? a.mixedInputs ? i.hostname = _(e, w(e)) : i.hostname = _(e, !1) : i.hostname = e, t === 0 || i.hostname === null) || a.detectIp && (i.isIp = x(i.hostname), i.isIp) ? i : a.validateHostname && a.extractHostname && !w(i.hostname) ? (i.hostname = null, i) : (n(i.hostname, a, i), t === 2 || i.publicSuffix === null || (i.domain = p(i.publicSuffix, i.hostname, a), t === 3 || i.domain === null) || (i.subdomain = ee(i.hostname, i.domain), t === 4) || (i.domainWithoutSuffix = h(i.domain, i.publicSuffix)), i);
}
var re = t((() => {
	m(), g(), v(), S(), T(), k(), te();
}));
//#endregion
//#region node_modules/tldts-core/dist/es6/src/lookup/fast-path.js
function ie(e, t, n) {
	if (!t.allowPrivateDomains && e.length > 3) {
		let t = e.length - 1, r = e.charCodeAt(t), i = e.charCodeAt(t - 1), a = e.charCodeAt(t - 2), o = e.charCodeAt(t - 3);
		if (r === 109 && i === 111 && a === 99 && o === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "com", !0;
		if (r === 103 && i === 114 && a === 111 && o === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "org", !0;
		if (r === 117 && i === 100 && a === 101 && o === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "edu", !0;
		if (r === 118 && i === 111 && a === 103 && o === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "gov", !0;
		if (r === 116 && i === 101 && a === 110 && o === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "net", !0;
		if (r === 101 && i === 100 && a === 46) return n.isIcann = !0, n.isPrivate = !1, n.publicSuffix = "de", !0;
	}
	return !1;
}
var ae = t((() => {})), oe = t((() => {
	re(), ae(), k();
})), M, N, P = t((() => {
	M = (function() {
		let e = [1, {}], t = [2, {}], n = [0, { city: e }];
		return [0, {
			ck: [0, { www: e }],
			jp: [0, {
				kawasaki: n,
				kitakyushu: n,
				kobe: n,
				nagoya: n,
				sapporo: n,
				sendai: n,
				yokohama: n
			}],
			dev: [0, { hrsn: [0, { psl: [0, { wc: [0, {
				ignored: t,
				sub: [0, { ignored: t }]
			}] }] }] }]
		}];
	})(), N = (function() {
		let e = [1, {}], t = [2, {}], n = [1, {
			com: e,
			edu: e,
			gov: e,
			net: e,
			org: e
		}], r = [1, {
			com: e,
			edu: e,
			gov: e,
			mil: e,
			net: e,
			org: e
		}], i = [0, { "*": t }], a = [2, { s: i }], o = [0, { relay: t }], s = [2, { id: t }], c = [1, { gov: e }], l = [0, { "transfer-webapp": t }], u = [0, {
			notebook: t,
			studio: t
		}], d = [0, {
			labeling: t,
			notebook: t,
			studio: t
		}], f = [0, { notebook: t }], p = [0, {
			labeling: t,
			notebook: t,
			"notebook-fips": t,
			studio: t
		}], m = [0, {
			notebook: t,
			"notebook-fips": t,
			studio: t,
			"studio-fips": t
		}], h = [0, { "*": e }], g = [1, { co: t }], _ = [0, { objects: t }], v = [2, { nodes: t }], y = [0, { my: i }], b = [0, {
			s3: t,
			"s3-accesspoint": t,
			"s3-website": t
		}], x = [0, {
			s3: t,
			"s3-accesspoint": t
		}], S = [0, { direct: t }], C = [0, { "webview-assets": t }], w = [0, {
			vfs: t,
			"webview-assets": t
		}], T = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: b,
			s3: t,
			"s3-accesspoint": t,
			"s3-object-lambda": t,
			"s3-website": t,
			"aws-cloud9": C,
			cloud9: w
		}], E = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: x,
			s3: t,
			"s3-accesspoint": t,
			"s3-object-lambda": t,
			"s3-website": t,
			"aws-cloud9": C,
			cloud9: w
		}], D = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: b,
			s3: t,
			"s3-accesspoint": t,
			"s3-object-lambda": t,
			"s3-website": t,
			"analytics-gateway": t,
			"aws-cloud9": C,
			cloud9: w
		}], O = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: b,
			s3: t,
			"s3-accesspoint": t,
			"s3-object-lambda": t,
			"s3-website": t
		}], k = [0, {
			s3: t,
			"s3-accesspoint": t,
			"s3-accesspoint-fips": t,
			"s3-fips": t,
			"s3-website": t
		}], ee = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: k,
			s3: t,
			"s3-accesspoint": t,
			"s3-accesspoint-fips": t,
			"s3-fips": t,
			"s3-object-lambda": t,
			"s3-website": t,
			"aws-cloud9": C,
			cloud9: w
		}], te = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: k,
			s3: t,
			"s3-accesspoint": t,
			"s3-accesspoint-fips": t,
			"s3-deprecated": t,
			"s3-fips": t,
			"s3-object-lambda": t,
			"s3-website": t,
			"analytics-gateway": t,
			"aws-cloud9": C,
			cloud9: w
		}], ne = [0, {
			"execute-api": t,
			"emrappui-prod": t,
			"emrnotebooks-prod": t,
			"emrstudio-prod": t,
			dualstack: [0, {
				s3: t,
				"s3-accesspoint": t,
				"s3-accesspoint-fips": t,
				"s3-fips": t
			}],
			s3: t,
			"s3-accesspoint": t,
			"s3-accesspoint-fips": t,
			"s3-fips": t,
			"s3-object-lambda": t,
			"s3-website": t
		}], A = [0, { auth: t }], j = [0, {
			auth: t,
			"auth-fips": t
		}], re = [0, { "auth-fips": t }], ie = [0, { apps: t }], ae = [0, { paas: t }], oe = [2, { eu: t }], M = [0, { app: t }], N = [0, { site: t }], P = [1, {
			com: e,
			edu: e,
			net: e,
			org: e
		}], F = [0, { j: t }], I = [0, { dyn: t }], se = [1, {
			co: e,
			com: e,
			edu: e,
			gov: e,
			net: e,
			org: e
		}], ce = [0, { p: t }], le = [0, { user: t }], ue = [0, { shop: t }], L = [0, { cdn: t }], de = [0, {
			cust: t,
			reservd: t
		}], fe = [0, { cust: t }], pe = [0, { s3: t }], R = [1, {
			biz: e,
			com: e,
			edu: e,
			gov: e,
			info: e,
			net: e,
			org: e
		}], me = [0, { ipfs: t }], z = [1, { framer: t }], he = [0, { forgot: t }], B = [1, { gs: e }], V = [0, { nes: e }], H = [1, {
			k12: e,
			cc: e,
			lib: e
		}], U = [1, {
			cc: e,
			lib: e
		}];
		return [0, {
			ac: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				drr: t,
				feedback: t,
				forms: t
			}],
			ad: e,
			ae: [1, {
				ac: e,
				co: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				sch: e
			}],
			aero: [1, {
				airline: e,
				airport: e,
				"accident-investigation": e,
				"accident-prevention": e,
				aerobatic: e,
				aeroclub: e,
				aerodrome: e,
				agents: e,
				"air-surveillance": e,
				"air-traffic-control": e,
				aircraft: e,
				airtraffic: e,
				ambulance: e,
				association: e,
				author: e,
				ballooning: e,
				broker: e,
				caa: e,
				cargo: e,
				catering: e,
				certification: e,
				championship: e,
				charter: e,
				civilaviation: e,
				club: e,
				conference: e,
				consultant: e,
				consulting: e,
				control: e,
				council: e,
				crew: e,
				design: e,
				dgca: e,
				educator: e,
				emergency: e,
				engine: e,
				engineer: e,
				entertainment: e,
				equipment: e,
				exchange: e,
				express: e,
				federation: e,
				flight: e,
				freight: e,
				fuel: e,
				gliding: e,
				government: e,
				groundhandling: e,
				group: e,
				hanggliding: e,
				homebuilt: e,
				insurance: e,
				journal: e,
				journalist: e,
				leasing: e,
				logistics: e,
				magazine: e,
				maintenance: e,
				marketplace: e,
				media: e,
				microlight: e,
				modelling: e,
				navigation: e,
				parachuting: e,
				paragliding: e,
				"passenger-association": e,
				pilot: e,
				press: e,
				production: e,
				recreation: e,
				repbody: e,
				res: e,
				research: e,
				rotorcraft: e,
				safety: e,
				scientist: e,
				services: e,
				show: e,
				skydiving: e,
				software: e,
				student: e,
				taxi: e,
				trader: e,
				trading: e,
				trainer: e,
				union: e,
				workinggroup: e,
				works: e
			}],
			af: n,
			ag: [1, {
				co: e,
				com: e,
				net: e,
				nom: e,
				org: e,
				obj: t
			}],
			ai: [1, {
				com: e,
				net: e,
				off: e,
				org: e,
				uwu: t,
				framer: t
			}],
			al: r,
			am: [1, {
				co: e,
				com: e,
				commune: e,
				net: e,
				org: e,
				radio: t
			}],
			ao: [1, {
				co: e,
				ed: e,
				edu: e,
				gov: e,
				gv: e,
				it: e,
				og: e,
				org: e,
				pb: e
			}],
			aq: e,
			ar: [1, {
				bet: e,
				com: e,
				coop: e,
				edu: e,
				gob: e,
				gov: e,
				int: e,
				mil: e,
				musica: e,
				mutual: e,
				net: e,
				org: e,
				seg: e,
				senasa: e,
				tur: e
			}],
			arpa: [1, {
				e164: e,
				home: e,
				"in-addr": e,
				ip6: e,
				iris: e,
				uri: e,
				urn: e
			}],
			as: c,
			asia: [1, {
				cloudns: t,
				daemon: t,
				dix: t
			}],
			at: [1, {
				ac: [1, { sth: e }],
				co: e,
				gv: e,
				or: e,
				funkfeuer: [0, { wien: t }],
				futurecms: [0, {
					"*": t,
					ex: i,
					in: i
				}],
				futurehosting: t,
				futuremailing: t,
				ortsinfo: [0, {
					ex: i,
					kunden: i
				}],
				biz: t,
				info: t,
				"123webseite": t,
				priv: t,
				myspreadshop: t,
				"12hp": t,
				"2ix": t,
				"4lima": t,
				"lima-city": t
			}],
			au: [1, {
				asn: e,
				com: [1, {
					cloudlets: [0, { mel: t }],
					myspreadshop: t
				}],
				edu: [1, {
					act: e,
					catholic: e,
					nsw: [1, { schools: e }],
					nt: e,
					qld: e,
					sa: e,
					tas: e,
					vic: e,
					wa: e
				}],
				gov: [1, {
					qld: e,
					sa: e,
					tas: e,
					vic: e,
					wa: e
				}],
				id: e,
				net: e,
				org: e,
				conf: e,
				oz: e,
				act: e,
				nsw: e,
				nt: e,
				qld: e,
				sa: e,
				tas: e,
				vic: e,
				wa: e
			}],
			aw: [1, { com: e }],
			ax: e,
			az: [1, {
				biz: e,
				co: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				int: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				pp: e,
				pro: e
			}],
			ba: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				rs: t
			}],
			bb: [1, {
				biz: e,
				co: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				net: e,
				org: e,
				store: e,
				tv: e
			}],
			bd: h,
			be: [1, {
				ac: e,
				cloudns: t,
				webhosting: t,
				interhostsolutions: [0, { cloud: t }],
				kuleuven: [0, { ezproxy: t }],
				"123website": t,
				myspreadshop: t,
				transurl: i
			}],
			bf: c,
			bg: [1, {
				0: e,
				1: e,
				2: e,
				3: e,
				4: e,
				5: e,
				6: e,
				7: e,
				8: e,
				9: e,
				a: e,
				b: e,
				c: e,
				d: e,
				e,
				f: e,
				g: e,
				h: e,
				i: e,
				j: e,
				k: e,
				l: e,
				m: e,
				n: e,
				o: e,
				p: e,
				q: e,
				r: e,
				s: e,
				t: e,
				u: e,
				v: e,
				w: e,
				x: e,
				y: e,
				z: e,
				barsy: t
			}],
			bh: n,
			bi: [1, {
				co: e,
				com: e,
				edu: e,
				or: e,
				org: e
			}],
			biz: [1, {
				activetrail: t,
				"cloud-ip": t,
				cloudns: t,
				jozi: t,
				dyndns: t,
				"for-better": t,
				"for-more": t,
				"for-some": t,
				"for-the": t,
				selfip: t,
				webhop: t,
				orx: t,
				mmafan: t,
				myftp: t,
				"no-ip": t,
				dscloud: t
			}],
			bj: [1, {
				africa: e,
				agro: e,
				architectes: e,
				assur: e,
				avocats: e,
				co: e,
				com: e,
				eco: e,
				econo: e,
				edu: e,
				info: e,
				loisirs: e,
				money: e,
				net: e,
				org: e,
				ote: e,
				restaurant: e,
				resto: e,
				tourism: e,
				univ: e
			}],
			bm: n,
			bn: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				co: t
			}],
			bo: [1, {
				com: e,
				edu: e,
				gob: e,
				int: e,
				mil: e,
				net: e,
				org: e,
				tv: e,
				web: e,
				academia: e,
				agro: e,
				arte: e,
				blog: e,
				bolivia: e,
				ciencia: e,
				cooperativa: e,
				democracia: e,
				deporte: e,
				ecologia: e,
				economia: e,
				empresa: e,
				indigena: e,
				industria: e,
				info: e,
				medicina: e,
				movimiento: e,
				musica: e,
				natural: e,
				nombre: e,
				noticias: e,
				patria: e,
				plurinacional: e,
				politica: e,
				profesional: e,
				pueblo: e,
				revista: e,
				salud: e,
				tecnologia: e,
				tksat: e,
				transporte: e,
				wiki: e
			}],
			br: [1, {
				"9guacu": e,
				abc: e,
				adm: e,
				adv: e,
				agr: e,
				aju: e,
				am: e,
				anani: e,
				aparecida: e,
				app: e,
				arq: e,
				art: e,
				ato: e,
				b: e,
				barueri: e,
				belem: e,
				bet: e,
				bhz: e,
				bib: e,
				bio: e,
				blog: e,
				bmd: e,
				boavista: e,
				bsb: e,
				campinagrande: e,
				campinas: e,
				caxias: e,
				cim: e,
				cng: e,
				cnt: e,
				com: [1, { simplesite: t }],
				contagem: e,
				coop: e,
				coz: e,
				cri: e,
				cuiaba: e,
				curitiba: e,
				def: e,
				des: e,
				det: e,
				dev: e,
				ecn: e,
				eco: e,
				edu: e,
				emp: e,
				enf: e,
				eng: e,
				esp: e,
				etc: e,
				eti: e,
				far: e,
				feira: e,
				flog: e,
				floripa: e,
				fm: e,
				fnd: e,
				fortal: e,
				fot: e,
				foz: e,
				fst: e,
				g12: e,
				geo: e,
				ggf: e,
				goiania: e,
				gov: [1, {
					ac: e,
					al: e,
					am: e,
					ap: e,
					ba: e,
					ce: e,
					df: e,
					es: e,
					go: e,
					ma: e,
					mg: e,
					ms: e,
					mt: e,
					pa: e,
					pb: e,
					pe: e,
					pi: e,
					pr: e,
					rj: e,
					rn: e,
					ro: e,
					rr: e,
					rs: e,
					sc: e,
					se: e,
					sp: e,
					to: e
				}],
				gru: e,
				imb: e,
				ind: e,
				inf: e,
				jab: e,
				jampa: e,
				jdf: e,
				joinville: e,
				jor: e,
				jus: e,
				leg: [1, {
					ac: t,
					al: t,
					am: t,
					ap: t,
					ba: t,
					ce: t,
					df: t,
					es: t,
					go: t,
					ma: t,
					mg: t,
					ms: t,
					mt: t,
					pa: t,
					pb: t,
					pe: t,
					pi: t,
					pr: t,
					rj: t,
					rn: t,
					ro: t,
					rr: t,
					rs: t,
					sc: t,
					se: t,
					sp: t,
					to: t
				}],
				leilao: e,
				lel: e,
				log: e,
				londrina: e,
				macapa: e,
				maceio: e,
				manaus: e,
				maringa: e,
				mat: e,
				med: e,
				mil: e,
				morena: e,
				mp: e,
				mus: e,
				natal: e,
				net: e,
				niteroi: e,
				nom: h,
				not: e,
				ntr: e,
				odo: e,
				ong: e,
				org: e,
				osasco: e,
				palmas: e,
				poa: e,
				ppg: e,
				pro: e,
				psc: e,
				psi: e,
				pvh: e,
				qsl: e,
				radio: e,
				rec: e,
				recife: e,
				rep: e,
				ribeirao: e,
				rio: e,
				riobranco: e,
				riopreto: e,
				salvador: e,
				sampa: e,
				santamaria: e,
				santoandre: e,
				saobernardo: e,
				saogonca: e,
				seg: e,
				sjc: e,
				slg: e,
				slz: e,
				sorocaba: e,
				srv: e,
				taxi: e,
				tc: e,
				tec: e,
				teo: e,
				the: e,
				tmp: e,
				trd: e,
				tur: e,
				tv: e,
				udi: e,
				vet: e,
				vix: e,
				vlog: e,
				wiki: e,
				zlg: e
			}],
			bs: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				we: t
			}],
			bt: n,
			bv: e,
			bw: [1, {
				ac: e,
				co: e,
				gov: e,
				net: e,
				org: e
			}],
			by: [1, {
				gov: e,
				mil: e,
				com: e,
				of: e,
				mediatech: t
			}],
			bz: [1, {
				co: e,
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				za: t,
				mydns: t,
				gsj: t
			}],
			ca: [1, {
				ab: e,
				bc: e,
				mb: e,
				nb: e,
				nf: e,
				nl: e,
				ns: e,
				nt: e,
				nu: e,
				on: e,
				pe: e,
				qc: e,
				sk: e,
				yk: e,
				gc: e,
				barsy: t,
				awdev: i,
				co: t,
				"no-ip": t,
				myspreadshop: t,
				box: t
			}],
			cat: e,
			cc: [1, {
				cleverapps: t,
				cloudns: t,
				ftpaccess: t,
				"game-server": t,
				myphotos: t,
				scrapping: t,
				twmail: t,
				csx: t,
				fantasyleague: t,
				spawn: [0, { instances: t }]
			}],
			cd: c,
			cf: e,
			cg: e,
			ch: [1, {
				square7: t,
				cloudns: t,
				cloudscale: [0, {
					cust: t,
					lpg: _,
					rma: _
				}],
				flow: [0, {
					ae: [0, { alp1: t }],
					appengine: t
				}],
				"linkyard-cloud": t,
				gotdns: t,
				dnsking: t,
				"123website": t,
				myspreadshop: t,
				firenet: [0, {
					"*": t,
					svc: i
				}],
				"12hp": t,
				"2ix": t,
				"4lima": t,
				"lima-city": t
			}],
			ci: [1, {
				ac: e,
				"xn--aroport-bya": e,
				aéroport: e,
				asso: e,
				co: e,
				com: e,
				ed: e,
				edu: e,
				go: e,
				gouv: e,
				int: e,
				net: e,
				or: e,
				org: e
			}],
			ck: h,
			cl: [1, {
				co: e,
				gob: e,
				gov: e,
				mil: e,
				cloudns: t
			}],
			cm: [1, {
				co: e,
				com: e,
				gov: e,
				net: e
			}],
			cn: [1, {
				ac: e,
				com: [1, {
					amazonaws: [0, {
						"cn-north-1": [0, {
							"execute-api": t,
							"emrappui-prod": t,
							"emrnotebooks-prod": t,
							"emrstudio-prod": t,
							dualstack: b,
							s3: t,
							"s3-accesspoint": t,
							"s3-deprecated": t,
							"s3-object-lambda": t,
							"s3-website": t
						}],
						"cn-northwest-1": [0, {
							"execute-api": t,
							"emrappui-prod": t,
							"emrnotebooks-prod": t,
							"emrstudio-prod": t,
							dualstack: x,
							s3: t,
							"s3-accesspoint": t,
							"s3-object-lambda": t,
							"s3-website": t
						}],
						compute: i,
						airflow: [0, {
							"cn-north-1": i,
							"cn-northwest-1": i
						}],
						eb: [0, {
							"cn-north-1": t,
							"cn-northwest-1": t
						}],
						elb: i
					}],
					sagemaker: [0, {
						"cn-north-1": u,
						"cn-northwest-1": u
					}]
				}],
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				"xn--55qx5d": e,
				公司: e,
				"xn--od0alg": e,
				網絡: e,
				"xn--io0a7i": e,
				网络: e,
				ah: e,
				bj: e,
				cq: e,
				fj: e,
				gd: e,
				gs: e,
				gx: e,
				gz: e,
				ha: e,
				hb: e,
				he: e,
				hi: e,
				hk: e,
				hl: e,
				hn: e,
				jl: e,
				js: e,
				jx: e,
				ln: e,
				mo: e,
				nm: e,
				nx: e,
				qh: e,
				sc: e,
				sd: e,
				sh: [1, { as: t }],
				sn: e,
				sx: e,
				tj: e,
				tw: e,
				xj: e,
				xz: e,
				yn: e,
				zj: e,
				"canva-apps": t,
				canvasite: y,
				myqnapcloud: t,
				quickconnect: S
			}],
			co: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				nom: e,
				org: e,
				carrd: t,
				crd: t,
				otap: i,
				leadpages: t,
				lpages: t,
				mypi: t,
				xmit: i,
				firewalledreplit: s,
				repl: s,
				supabase: t
			}],
			com: [1, {
				a2hosted: t,
				cpserver: t,
				adobeaemcloud: [2, { dev: i }],
				africa: t,
				airkitapps: t,
				"airkitapps-au": t,
				aivencloud: t,
				alibabacloudcs: t,
				kasserver: t,
				amazonaws: [0, {
					"af-south-1": T,
					"ap-east-1": E,
					"ap-northeast-1": D,
					"ap-northeast-2": D,
					"ap-northeast-3": T,
					"ap-south-1": D,
					"ap-south-2": O,
					"ap-southeast-1": D,
					"ap-southeast-2": D,
					"ap-southeast-3": O,
					"ap-southeast-4": O,
					"ap-southeast-5": [0, {
						"execute-api": t,
						dualstack: b,
						s3: t,
						"s3-accesspoint": t,
						"s3-deprecated": t,
						"s3-object-lambda": t,
						"s3-website": t
					}],
					"ca-central-1": ee,
					"ca-west-1": [0, {
						"execute-api": t,
						"emrappui-prod": t,
						"emrnotebooks-prod": t,
						"emrstudio-prod": t,
						dualstack: k,
						s3: t,
						"s3-accesspoint": t,
						"s3-accesspoint-fips": t,
						"s3-fips": t,
						"s3-object-lambda": t,
						"s3-website": t
					}],
					"eu-central-1": D,
					"eu-central-2": O,
					"eu-north-1": E,
					"eu-south-1": T,
					"eu-south-2": O,
					"eu-west-1": [0, {
						"execute-api": t,
						"emrappui-prod": t,
						"emrnotebooks-prod": t,
						"emrstudio-prod": t,
						dualstack: b,
						s3: t,
						"s3-accesspoint": t,
						"s3-deprecated": t,
						"s3-object-lambda": t,
						"s3-website": t,
						"analytics-gateway": t,
						"aws-cloud9": C,
						cloud9: w
					}],
					"eu-west-2": E,
					"eu-west-3": T,
					"il-central-1": [0, {
						"execute-api": t,
						"emrappui-prod": t,
						"emrnotebooks-prod": t,
						"emrstudio-prod": t,
						dualstack: b,
						s3: t,
						"s3-accesspoint": t,
						"s3-object-lambda": t,
						"s3-website": t,
						"aws-cloud9": C,
						cloud9: [0, { vfs: t }]
					}],
					"me-central-1": O,
					"me-south-1": E,
					"sa-east-1": T,
					"us-east-1": [2, {
						"execute-api": t,
						"emrappui-prod": t,
						"emrnotebooks-prod": t,
						"emrstudio-prod": t,
						dualstack: k,
						s3: t,
						"s3-accesspoint": t,
						"s3-accesspoint-fips": t,
						"s3-deprecated": t,
						"s3-fips": t,
						"s3-object-lambda": t,
						"s3-website": t,
						"analytics-gateway": t,
						"aws-cloud9": C,
						cloud9: w
					}],
					"us-east-2": te,
					"us-gov-east-1": ne,
					"us-gov-west-1": ne,
					"us-west-1": ee,
					"us-west-2": te,
					compute: i,
					"compute-1": i,
					airflow: [0, {
						"af-south-1": i,
						"ap-east-1": i,
						"ap-northeast-1": i,
						"ap-northeast-2": i,
						"ap-northeast-3": i,
						"ap-south-1": i,
						"ap-south-2": i,
						"ap-southeast-1": i,
						"ap-southeast-2": i,
						"ap-southeast-3": i,
						"ap-southeast-4": i,
						"ca-central-1": i,
						"ca-west-1": i,
						"eu-central-1": i,
						"eu-central-2": i,
						"eu-north-1": i,
						"eu-south-1": i,
						"eu-south-2": i,
						"eu-west-1": i,
						"eu-west-2": i,
						"eu-west-3": i,
						"il-central-1": i,
						"me-central-1": i,
						"me-south-1": i,
						"sa-east-1": i,
						"us-east-1": i,
						"us-east-2": i,
						"us-west-1": i,
						"us-west-2": i
					}],
					s3: t,
					"s3-1": t,
					"s3-ap-east-1": t,
					"s3-ap-northeast-1": t,
					"s3-ap-northeast-2": t,
					"s3-ap-northeast-3": t,
					"s3-ap-south-1": t,
					"s3-ap-southeast-1": t,
					"s3-ap-southeast-2": t,
					"s3-ca-central-1": t,
					"s3-eu-central-1": t,
					"s3-eu-north-1": t,
					"s3-eu-west-1": t,
					"s3-eu-west-2": t,
					"s3-eu-west-3": t,
					"s3-external-1": t,
					"s3-fips-us-gov-east-1": t,
					"s3-fips-us-gov-west-1": t,
					"s3-global": [0, { accesspoint: [0, { mrap: t }] }],
					"s3-me-south-1": t,
					"s3-sa-east-1": t,
					"s3-us-east-2": t,
					"s3-us-gov-east-1": t,
					"s3-us-gov-west-1": t,
					"s3-us-west-1": t,
					"s3-us-west-2": t,
					"s3-website-ap-northeast-1": t,
					"s3-website-ap-southeast-1": t,
					"s3-website-ap-southeast-2": t,
					"s3-website-eu-west-1": t,
					"s3-website-sa-east-1": t,
					"s3-website-us-east-1": t,
					"s3-website-us-gov-west-1": t,
					"s3-website-us-west-1": t,
					"s3-website-us-west-2": t,
					elb: i
				}],
				amazoncognito: [0, {
					"af-south-1": A,
					"ap-east-1": A,
					"ap-northeast-1": A,
					"ap-northeast-2": A,
					"ap-northeast-3": A,
					"ap-south-1": A,
					"ap-south-2": A,
					"ap-southeast-1": A,
					"ap-southeast-2": A,
					"ap-southeast-3": A,
					"ap-southeast-4": A,
					"ap-southeast-5": A,
					"ca-central-1": A,
					"ca-west-1": A,
					"eu-central-1": A,
					"eu-central-2": A,
					"eu-north-1": A,
					"eu-south-1": A,
					"eu-south-2": A,
					"eu-west-1": A,
					"eu-west-2": A,
					"eu-west-3": A,
					"il-central-1": A,
					"me-central-1": A,
					"me-south-1": A,
					"sa-east-1": A,
					"us-east-1": j,
					"us-east-2": j,
					"us-gov-east-1": re,
					"us-gov-west-1": re,
					"us-west-1": j,
					"us-west-2": j
				}],
				amplifyapp: t,
				awsapprunner: i,
				awsapps: t,
				elasticbeanstalk: [2, {
					"af-south-1": t,
					"ap-east-1": t,
					"ap-northeast-1": t,
					"ap-northeast-2": t,
					"ap-northeast-3": t,
					"ap-south-1": t,
					"ap-southeast-1": t,
					"ap-southeast-2": t,
					"ap-southeast-3": t,
					"ca-central-1": t,
					"eu-central-1": t,
					"eu-north-1": t,
					"eu-south-1": t,
					"eu-west-1": t,
					"eu-west-2": t,
					"eu-west-3": t,
					"il-central-1": t,
					"me-south-1": t,
					"sa-east-1": t,
					"us-east-1": t,
					"us-east-2": t,
					"us-gov-east-1": t,
					"us-gov-west-1": t,
					"us-west-1": t,
					"us-west-2": t
				}],
				awsglobalaccelerator: t,
				siiites: t,
				appspacehosted: t,
				appspaceusercontent: t,
				"on-aptible": t,
				myasustor: t,
				"balena-devices": t,
				boutir: t,
				bplaced: t,
				cafjs: t,
				"canva-apps": t,
				"cdn77-storage": t,
				br: t,
				cn: t,
				de: t,
				eu: t,
				jpn: t,
				mex: t,
				ru: t,
				sa: t,
				uk: t,
				us: t,
				za: t,
				"clever-cloud": [0, { services: i }],
				dnsabr: t,
				"ip-ddns": t,
				jdevcloud: t,
				wpdevcloud: t,
				"cf-ipfs": t,
				"cloudflare-ipfs": t,
				trycloudflare: t,
				co: t,
				devinapps: i,
				builtwithdark: t,
				datadetect: [0, {
					demo: t,
					instance: t
				}],
				dattolocal: t,
				dattorelay: t,
				dattoweb: t,
				mydatto: t,
				digitaloceanspaces: i,
				discordsays: t,
				discordsez: t,
				drayddns: t,
				dreamhosters: t,
				durumis: t,
				mydrobo: t,
				blogdns: t,
				cechire: t,
				dnsalias: t,
				dnsdojo: t,
				doesntexist: t,
				dontexist: t,
				doomdns: t,
				"dyn-o-saur": t,
				dynalias: t,
				"dyndns-at-home": t,
				"dyndns-at-work": t,
				"dyndns-blog": t,
				"dyndns-free": t,
				"dyndns-home": t,
				"dyndns-ip": t,
				"dyndns-mail": t,
				"dyndns-office": t,
				"dyndns-pics": t,
				"dyndns-remote": t,
				"dyndns-server": t,
				"dyndns-web": t,
				"dyndns-wiki": t,
				"dyndns-work": t,
				"est-a-la-maison": t,
				"est-a-la-masion": t,
				"est-le-patron": t,
				"est-mon-blogueur": t,
				"from-ak": t,
				"from-al": t,
				"from-ar": t,
				"from-ca": t,
				"from-ct": t,
				"from-dc": t,
				"from-de": t,
				"from-fl": t,
				"from-ga": t,
				"from-hi": t,
				"from-ia": t,
				"from-id": t,
				"from-il": t,
				"from-in": t,
				"from-ks": t,
				"from-ky": t,
				"from-ma": t,
				"from-md": t,
				"from-mi": t,
				"from-mn": t,
				"from-mo": t,
				"from-ms": t,
				"from-mt": t,
				"from-nc": t,
				"from-nd": t,
				"from-ne": t,
				"from-nh": t,
				"from-nj": t,
				"from-nm": t,
				"from-nv": t,
				"from-oh": t,
				"from-ok": t,
				"from-or": t,
				"from-pa": t,
				"from-pr": t,
				"from-ri": t,
				"from-sc": t,
				"from-sd": t,
				"from-tn": t,
				"from-tx": t,
				"from-ut": t,
				"from-va": t,
				"from-vt": t,
				"from-wa": t,
				"from-wi": t,
				"from-wv": t,
				"from-wy": t,
				getmyip: t,
				gotdns: t,
				"hobby-site": t,
				homelinux: t,
				homeunix: t,
				iamallama: t,
				"is-a-anarchist": t,
				"is-a-blogger": t,
				"is-a-bookkeeper": t,
				"is-a-bulls-fan": t,
				"is-a-caterer": t,
				"is-a-chef": t,
				"is-a-conservative": t,
				"is-a-cpa": t,
				"is-a-cubicle-slave": t,
				"is-a-democrat": t,
				"is-a-designer": t,
				"is-a-doctor": t,
				"is-a-financialadvisor": t,
				"is-a-geek": t,
				"is-a-green": t,
				"is-a-guru": t,
				"is-a-hard-worker": t,
				"is-a-hunter": t,
				"is-a-landscaper": t,
				"is-a-lawyer": t,
				"is-a-liberal": t,
				"is-a-libertarian": t,
				"is-a-llama": t,
				"is-a-musician": t,
				"is-a-nascarfan": t,
				"is-a-nurse": t,
				"is-a-painter": t,
				"is-a-personaltrainer": t,
				"is-a-photographer": t,
				"is-a-player": t,
				"is-a-republican": t,
				"is-a-rockstar": t,
				"is-a-socialist": t,
				"is-a-student": t,
				"is-a-teacher": t,
				"is-a-techie": t,
				"is-a-therapist": t,
				"is-an-accountant": t,
				"is-an-actor": t,
				"is-an-actress": t,
				"is-an-anarchist": t,
				"is-an-artist": t,
				"is-an-engineer": t,
				"is-an-entertainer": t,
				"is-certified": t,
				"is-gone": t,
				"is-into-anime": t,
				"is-into-cars": t,
				"is-into-cartoons": t,
				"is-into-games": t,
				"is-leet": t,
				"is-not-certified": t,
				"is-slick": t,
				"is-uberleet": t,
				"is-with-theband": t,
				"isa-geek": t,
				"isa-hockeynut": t,
				issmarterthanyou: t,
				"likes-pie": t,
				likescandy: t,
				"neat-url": t,
				"saves-the-whales": t,
				selfip: t,
				"sells-for-less": t,
				"sells-for-u": t,
				servebbs: t,
				"simple-url": t,
				"space-to-rent": t,
				"teaches-yoga": t,
				writesthisblog: t,
				ddnsfree: t,
				ddnsgeek: t,
				giize: t,
				gleeze: t,
				kozow: t,
				loseyourip: t,
				ooguy: t,
				theworkpc: t,
				mytuleap: t,
				"tuleap-partners": t,
				encoreapi: t,
				evennode: [0, {
					"eu-1": t,
					"eu-2": t,
					"eu-3": t,
					"eu-4": t,
					"us-1": t,
					"us-2": t,
					"us-3": t,
					"us-4": t
				}],
				onfabrica: t,
				"fastly-edge": t,
				"fastly-terrarium": t,
				"fastvps-server": t,
				mydobiss: t,
				firebaseapp: t,
				fldrv: t,
				forgeblocks: t,
				framercanvas: t,
				"freebox-os": t,
				freeboxos: t,
				freemyip: t,
				aliases121: t,
				gentapps: t,
				gentlentapis: t,
				githubusercontent: t,
				"0emm": i,
				appspot: [2, { r: i }],
				blogspot: t,
				codespot: t,
				googleapis: t,
				googlecode: t,
				pagespeedmobilizer: t,
				withgoogle: t,
				withyoutube: t,
				grayjayleagues: t,
				hatenablog: t,
				hatenadiary: t,
				herokuapp: t,
				gr: t,
				smushcdn: t,
				wphostedmail: t,
				wpmucdn: t,
				pixolino: t,
				"apps-1and1": t,
				"live-website": t,
				dopaas: t,
				"hosted-by-previder": ae,
				hosteur: [0, {
					"rag-cloud": t,
					"rag-cloud-ch": t
				}],
				"ik-server": [0, {
					jcloud: t,
					"jcloud-ver-jpc": t
				}],
				jelastic: [0, { demo: t }],
				massivegrid: ae,
				wafaicloud: [0, {
					jed: t,
					ryd: t
				}],
				webadorsite: t,
				joyent: [0, { cns: i }],
				lpusercontent: t,
				linode: [0, {
					members: t,
					nodebalancer: i
				}],
				linodeobjects: i,
				linodeusercontent: [0, { ip: t }],
				localtonet: t,
				lovableproject: t,
				barsycenter: t,
				barsyonline: t,
				modelscape: t,
				mwcloudnonprod: t,
				polyspace: t,
				mazeplay: t,
				miniserver: t,
				atmeta: t,
				fbsbx: ie,
				meteorapp: oe,
				routingthecloud: t,
				mydbserver: t,
				hostedpi: t,
				"mythic-beasts": [0, {
					caracal: t,
					customer: t,
					fentiger: t,
					lynx: t,
					ocelot: t,
					oncilla: t,
					onza: t,
					sphinx: t,
					vs: t,
					x: t,
					yali: t
				}],
				nospamproxy: [0, { cloud: [2, { o365: t }] }],
				"4u": t,
				nfshost: t,
				"3utilities": t,
				blogsyte: t,
				ciscofreak: t,
				damnserver: t,
				ddnsking: t,
				ditchyourip: t,
				dnsiskinky: t,
				dynns: t,
				geekgalaxy: t,
				"health-carereform": t,
				homesecuritymac: t,
				homesecuritypc: t,
				myactivedirectory: t,
				mysecuritycamera: t,
				myvnc: t,
				"net-freaks": t,
				onthewifi: t,
				point2this: t,
				quicksytes: t,
				securitytactics: t,
				servebeer: t,
				servecounterstrike: t,
				serveexchange: t,
				serveftp: t,
				servegame: t,
				servehalflife: t,
				servehttp: t,
				servehumour: t,
				serveirc: t,
				servemp3: t,
				servep2p: t,
				servepics: t,
				servequake: t,
				servesarcasm: t,
				stufftoread: t,
				unusualperson: t,
				workisboring: t,
				myiphost: t,
				observableusercontent: [0, { static: t }],
				simplesite: t,
				orsites: t,
				operaunite: t,
				"customer-oci": [0, {
					"*": t,
					oci: i,
					ocp: i,
					ocs: i
				}],
				oraclecloudapps: i,
				oraclegovcloudapps: i,
				"authgear-staging": t,
				authgearapps: t,
				skygearapp: t,
				outsystemscloud: t,
				ownprovider: t,
				pgfog: t,
				pagexl: t,
				gotpantheon: t,
				paywhirl: i,
				upsunapp: t,
				"postman-echo": t,
				prgmr: [0, { xen: t }],
				pythonanywhere: oe,
				qa2: t,
				"alpha-myqnapcloud": t,
				"dev-myqnapcloud": t,
				mycloudnas: t,
				mynascloud: t,
				myqnapcloud: t,
				qualifioapp: t,
				ladesk: t,
				qbuser: t,
				quipelements: i,
				rackmaze: t,
				"readthedocs-hosted": t,
				rhcloud: t,
				onrender: t,
				render: M,
				"subsc-pay": t,
				"180r": t,
				dojin: t,
				sakuratan: t,
				sakuraweb: t,
				x0: t,
				code: [0, {
					builder: i,
					"dev-builder": i,
					"stg-builder": i
				}],
				salesforce: [0, { platform: [0, { "code-builder-stg": [0, { test: [0, { "001": i }] }] }] }],
				logoip: t,
				scrysec: t,
				"firewall-gateway": t,
				myshopblocks: t,
				myshopify: t,
				shopitsite: t,
				"1kapp": t,
				appchizi: t,
				applinzi: t,
				sinaapp: t,
				vipsinaapp: t,
				streamlitapp: t,
				"try-snowplow": t,
				"playstation-cloud": t,
				myspreadshop: t,
				"w-corp-staticblitz": t,
				"w-credentialless-staticblitz": t,
				"w-staticblitz": t,
				"stackhero-network": t,
				stdlib: [0, { api: t }],
				strapiapp: [2, { media: t }],
				"streak-link": t,
				streaklinks: t,
				streakusercontent: t,
				"temp-dns": t,
				dsmynas: t,
				familyds: t,
				mytabit: t,
				taveusercontent: t,
				"tb-hosting": N,
				reservd: t,
				thingdustdata: t,
				"townnews-staging": t,
				typeform: [0, { pro: t }],
				hk: t,
				it: t,
				"deus-canvas": t,
				vultrobjects: i,
				wafflecell: t,
				hotelwithflight: t,
				"reserve-online": t,
				cprapid: t,
				pleskns: t,
				remotewd: t,
				wiardweb: [0, { pages: t }],
				wixsite: t,
				wixstudio: t,
				messwithdns: t,
				"woltlab-demo": t,
				wpenginepowered: [2, { js: t }],
				xnbay: [2, {
					u2: t,
					"u2-local": t
				}],
				yolasite: t
			}],
			coop: e,
			cr: [1, {
				ac: e,
				co: e,
				ed: e,
				fi: e,
				go: e,
				or: e,
				sa: e
			}],
			cu: [1, {
				com: e,
				edu: e,
				gob: e,
				inf: e,
				nat: e,
				net: e,
				org: e
			}],
			cv: [1, {
				com: e,
				edu: e,
				id: e,
				int: e,
				net: e,
				nome: e,
				org: e,
				publ: e
			}],
			cw: P,
			cx: [1, {
				gov: e,
				cloudns: t,
				ath: t,
				info: t,
				assessments: t,
				calculators: t,
				funnels: t,
				paynow: t,
				quizzes: t,
				researched: t,
				tests: t
			}],
			cy: [1, {
				ac: e,
				biz: e,
				com: [1, { scaleforce: F }],
				ekloges: e,
				gov: e,
				ltd: e,
				mil: e,
				net: e,
				org: e,
				press: e,
				pro: e,
				tm: e
			}],
			cz: [1, {
				contentproxy9: [0, { rsc: t }],
				realm: t,
				e4: t,
				co: t,
				metacentrum: [0, {
					cloud: i,
					custom: t
				}],
				muni: [0, { cloud: [0, {
					flt: t,
					usr: t
				}] }]
			}],
			de: [1, {
				bplaced: t,
				square7: t,
				com: t,
				cosidns: I,
				dnsupdater: t,
				"dynamisches-dns": t,
				"internet-dns": t,
				"l-o-g-i-n": t,
				ddnss: [2, {
					dyn: t,
					dyndns: t
				}],
				"dyn-ip24": t,
				dyndns1: t,
				"home-webserver": [2, { dyn: t }],
				"myhome-server": t,
				dnshome: t,
				fuettertdasnetz: t,
				isteingeek: t,
				istmein: t,
				lebtimnetz: t,
				leitungsen: t,
				traeumtgerade: t,
				frusky: i,
				goip: t,
				"xn--gnstigbestellen-zvb": t,
				günstigbestellen: t,
				"xn--gnstigliefern-wob": t,
				günstigliefern: t,
				"hs-heilbronn": [0, { it: [0, {
					pages: t,
					"pages-research": t
				}] }],
				"dyn-berlin": t,
				"in-berlin": t,
				"in-brb": t,
				"in-butter": t,
				"in-dsl": t,
				"in-vpn": t,
				iservschule: t,
				"mein-iserv": t,
				schulplattform: t,
				schulserver: t,
				"test-iserv": t,
				keymachine: t,
				"git-repos": t,
				"lcube-server": t,
				"svn-repos": t,
				barsy: t,
				webspaceconfig: t,
				"123webseite": t,
				rub: t,
				"ruhr-uni-bochum": [2, { noc: [0, { io: t }] }],
				logoip: t,
				"firewall-gateway": t,
				"my-gateway": t,
				"my-router": t,
				spdns: t,
				speedpartner: [0, { customer: t }],
				myspreadshop: t,
				"taifun-dns": t,
				"12hp": t,
				"2ix": t,
				"4lima": t,
				"lima-city": t,
				"dd-dns": t,
				"dray-dns": t,
				draydns: t,
				"dyn-vpn": t,
				dynvpn: t,
				"mein-vigor": t,
				"my-vigor": t,
				"my-wan": t,
				"syno-ds": t,
				"synology-diskstation": t,
				"synology-ds": t,
				uberspace: i,
				"virtual-user": t,
				virtualuser: t,
				"community-pro": t,
				diskussionsbereich: t
			}],
			dj: e,
			dk: [1, {
				biz: t,
				co: t,
				firm: t,
				reg: t,
				store: t,
				"123hjemmeside": t,
				myspreadshop: t
			}],
			dm: se,
			do: [1, {
				art: e,
				com: e,
				edu: e,
				gob: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				sld: e,
				web: e
			}],
			dz: [1, {
				art: e,
				asso: e,
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				pol: e,
				soc: e,
				tm: e
			}],
			ec: [1, {
				com: e,
				edu: e,
				fin: e,
				gob: e,
				gov: e,
				info: e,
				k12: e,
				med: e,
				mil: e,
				net: e,
				org: e,
				pro: e,
				base: t,
				official: t
			}],
			edu: [1, { rit: [0, { "git-pages": t }] }],
			ee: [1, {
				aip: e,
				com: e,
				edu: e,
				fie: e,
				gov: e,
				lib: e,
				med: e,
				org: e,
				pri: e,
				riik: e
			}],
			eg: [1, {
				ac: e,
				com: e,
				edu: e,
				eun: e,
				gov: e,
				info: e,
				me: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				sci: e,
				sport: e,
				tv: e
			}],
			er: h,
			es: [1, {
				com: e,
				edu: e,
				gob: e,
				nom: e,
				org: e,
				"123miweb": t,
				myspreadshop: t
			}],
			et: [1, {
				biz: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				name: e,
				net: e,
				org: e
			}],
			eu: [1, {
				airkitapps: t,
				cloudns: t,
				dogado: [0, { jelastic: t }],
				barsy: t,
				spdns: t,
				transurl: i,
				diskstation: t
			}],
			fi: [1, {
				aland: e,
				dy: t,
				"xn--hkkinen-5wa": t,
				häkkinen: t,
				iki: t,
				cloudplatform: [0, { fi: t }],
				datacenter: [0, {
					demo: t,
					paas: t
				}],
				kapsi: t,
				"123kotisivu": t,
				myspreadshop: t
			}],
			fj: [1, {
				ac: e,
				biz: e,
				com: e,
				gov: e,
				info: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				pro: e
			}],
			fk: h,
			fm: [1, {
				com: e,
				edu: e,
				net: e,
				org: e,
				radio: t,
				user: i
			}],
			fo: e,
			fr: [1, {
				asso: e,
				com: e,
				gouv: e,
				nom: e,
				prd: e,
				tm: e,
				avoues: e,
				cci: e,
				greta: e,
				"huissier-justice": e,
				"en-root": t,
				"fbx-os": t,
				fbxos: t,
				"freebox-os": t,
				freeboxos: t,
				goupile: t,
				"123siteweb": t,
				"on-web": t,
				"chirurgiens-dentistes-en-france": t,
				dedibox: t,
				aeroport: t,
				avocat: t,
				chambagri: t,
				"chirurgiens-dentistes": t,
				"experts-comptables": t,
				medecin: t,
				notaires: t,
				pharmacien: t,
				port: t,
				veterinaire: t,
				myspreadshop: t,
				ynh: t
			}],
			ga: e,
			gb: e,
			gd: [1, {
				edu: e,
				gov: e
			}],
			ge: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				pvt: e,
				school: e
			}],
			gf: e,
			gg: [1, {
				co: e,
				net: e,
				org: e,
				botdash: t,
				kaas: t,
				stackit: t,
				panel: [2, { daemon: t }]
			}],
			gh: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				org: e
			}],
			gi: [1, {
				com: e,
				edu: e,
				gov: e,
				ltd: e,
				mod: e,
				org: e
			}],
			gl: [1, {
				co: e,
				com: e,
				edu: e,
				net: e,
				org: e,
				biz: t
			}],
			gm: e,
			gn: [1, {
				ac: e,
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e
			}],
			gov: e,
			gp: [1, {
				asso: e,
				com: e,
				edu: e,
				mobi: e,
				net: e,
				org: e
			}],
			gq: e,
			gr: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				barsy: t,
				simplesite: t
			}],
			gs: e,
			gt: [1, {
				com: e,
				edu: e,
				gob: e,
				ind: e,
				mil: e,
				net: e,
				org: e
			}],
			gu: [1, {
				com: e,
				edu: e,
				gov: e,
				guam: e,
				info: e,
				net: e,
				org: e,
				web: e
			}],
			gw: e,
			gy: se,
			hk: [1, {
				com: e,
				edu: e,
				gov: e,
				idv: e,
				net: e,
				org: e,
				"xn--ciqpn": e,
				个人: e,
				"xn--gmqw5a": e,
				個人: e,
				"xn--55qx5d": e,
				公司: e,
				"xn--mxtq1m": e,
				政府: e,
				"xn--lcvr32d": e,
				敎育: e,
				"xn--wcvs22d": e,
				教育: e,
				"xn--gmq050i": e,
				箇人: e,
				"xn--uc0atv": e,
				組織: e,
				"xn--uc0ay4a": e,
				組织: e,
				"xn--od0alg": e,
				網絡: e,
				"xn--zf0avx": e,
				網络: e,
				"xn--mk0axi": e,
				组織: e,
				"xn--tn0ag": e,
				组织: e,
				"xn--od0aq3b": e,
				网絡: e,
				"xn--io0a7i": e,
				网络: e,
				inc: t,
				ltd: t
			}],
			hm: e,
			hn: [1, {
				com: e,
				edu: e,
				gob: e,
				mil: e,
				net: e,
				org: e
			}],
			hr: [1, {
				com: e,
				from: e,
				iz: e,
				name: e,
				brendly: ue
			}],
			ht: [1, {
				adult: e,
				art: e,
				asso: e,
				com: e,
				coop: e,
				edu: e,
				firm: e,
				gouv: e,
				info: e,
				med: e,
				net: e,
				org: e,
				perso: e,
				pol: e,
				pro: e,
				rel: e,
				shop: e,
				rt: t
			}],
			hu: [1, {
				2e3: e,
				agrar: e,
				bolt: e,
				casino: e,
				city: e,
				co: e,
				erotica: e,
				erotika: e,
				film: e,
				forum: e,
				games: e,
				hotel: e,
				info: e,
				ingatlan: e,
				jogasz: e,
				konyvelo: e,
				lakas: e,
				media: e,
				news: e,
				org: e,
				priv: e,
				reklam: e,
				sex: e,
				shop: e,
				sport: e,
				suli: e,
				szex: e,
				tm: e,
				tozsde: e,
				utazas: e,
				video: e
			}],
			id: [1, {
				ac: e,
				biz: e,
				co: e,
				desa: e,
				go: e,
				mil: e,
				my: e,
				net: e,
				or: e,
				ponpes: e,
				sch: e,
				web: e,
				zone: t
			}],
			ie: [1, {
				gov: e,
				myspreadshop: t
			}],
			il: [1, {
				ac: e,
				co: [1, {
					ravpage: t,
					mytabit: t,
					tabitorder: t
				}],
				gov: e,
				idf: e,
				k12: e,
				muni: e,
				net: e,
				org: e
			}],
			"xn--4dbrk0ce": [1, {
				"xn--4dbgdty6c": e,
				"xn--5dbhl8d": e,
				"xn--8dbq2a": e,
				"xn--hebda8b": e
			}],
			ישראל: [1, {
				אקדמיה: e,
				ישוב: e,
				צהל: e,
				ממשל: e
			}],
			im: [1, {
				ac: e,
				co: [1, {
					ltd: e,
					plc: e
				}],
				com: e,
				net: e,
				org: e,
				tt: e,
				tv: e
			}],
			in: [1, {
				"5g": e,
				"6g": e,
				ac: e,
				ai: e,
				am: e,
				bihar: e,
				biz: e,
				business: e,
				ca: e,
				cn: e,
				co: e,
				com: e,
				coop: e,
				cs: e,
				delhi: e,
				dr: e,
				edu: e,
				er: e,
				firm: e,
				gen: e,
				gov: e,
				gujarat: e,
				ind: e,
				info: e,
				int: e,
				internet: e,
				io: e,
				me: e,
				mil: e,
				net: e,
				nic: e,
				org: e,
				pg: e,
				post: e,
				pro: e,
				res: e,
				travel: e,
				tv: e,
				uk: e,
				up: e,
				us: e,
				cloudns: t,
				barsy: t,
				web: t,
				supabase: t
			}],
			info: [1, {
				cloudns: t,
				"dynamic-dns": t,
				"barrel-of-knowledge": t,
				"barrell-of-knowledge": t,
				dyndns: t,
				"for-our": t,
				"groks-the": t,
				"groks-this": t,
				"here-for-more": t,
				knowsitall: t,
				selfip: t,
				webhop: t,
				barsy: t,
				mayfirst: t,
				mittwald: t,
				mittwaldserver: t,
				typo3server: t,
				dvrcam: t,
				ilovecollege: t,
				"no-ip": t,
				forumz: t,
				nsupdate: t,
				dnsupdate: t,
				"v-info": t
			}],
			int: [1, { eu: e }],
			io: [1, {
				2038: t,
				co: e,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				nom: e,
				org: e,
				"on-acorn": i,
				myaddr: t,
				apigee: t,
				"b-data": t,
				beagleboard: t,
				bitbucket: t,
				bluebite: t,
				boxfuse: t,
				brave: a,
				browsersafetymark: t,
				bubble: L,
				bubbleapps: t,
				bigv: [0, { uk0: t }],
				cleverapps: t,
				cloudbeesusercontent: t,
				dappnode: [0, { dyndns: t }],
				darklang: t,
				definima: t,
				dedyn: t,
				"fh-muenster": t,
				shw: t,
				forgerock: [0, { id: t }],
				github: t,
				gitlab: t,
				lolipop: t,
				"hasura-app": t,
				hostyhosting: t,
				hypernode: t,
				moonscale: i,
				beebyte: ae,
				beebyteapp: [0, { sekd1: t }],
				jele: t,
				webthings: t,
				loginline: t,
				barsy: t,
				azurecontainer: i,
				ngrok: [2, {
					ap: t,
					au: t,
					eu: t,
					in: t,
					jp: t,
					sa: t,
					us: t
				}],
				nodeart: [0, { stage: t }],
				pantheonsite: t,
				pstmn: [2, { mock: t }],
				protonet: t,
				qcx: [2, { sys: i }],
				qoto: t,
				vaporcloud: t,
				myrdbx: t,
				"rb-hosting": N,
				"on-k3s": i,
				"on-rio": i,
				readthedocs: t,
				resindevice: t,
				resinstaging: [0, { devices: t }],
				hzc: t,
				sandcats: t,
				scrypted: [0, { client: t }],
				"mo-siemens": t,
				lair: ie,
				stolos: i,
				musician: t,
				utwente: t,
				edugit: t,
				telebit: t,
				thingdust: [0, {
					dev: de,
					disrec: de,
					prod: fe,
					testing: de
				}],
				tickets: t,
				webflow: t,
				webflowtest: t,
				editorx: t,
				wixstudio: t,
				basicserver: t,
				virtualserver: t
			}],
			iq: r,
			ir: [1, {
				ac: e,
				co: e,
				gov: e,
				id: e,
				net: e,
				org: e,
				sch: e,
				"xn--mgba3a4f16a": e,
				ایران: e,
				"xn--mgba3a4fra": e,
				ايران: e,
				arvanedge: t
			}],
			is: e,
			it: [1, {
				edu: e,
				gov: e,
				abr: e,
				abruzzo: e,
				"aosta-valley": e,
				aostavalley: e,
				bas: e,
				basilicata: e,
				cal: e,
				calabria: e,
				cam: e,
				campania: e,
				"emilia-romagna": e,
				emiliaromagna: e,
				emr: e,
				"friuli-v-giulia": e,
				"friuli-ve-giulia": e,
				"friuli-vegiulia": e,
				"friuli-venezia-giulia": e,
				"friuli-veneziagiulia": e,
				"friuli-vgiulia": e,
				"friuliv-giulia": e,
				"friulive-giulia": e,
				friulivegiulia: e,
				"friulivenezia-giulia": e,
				friuliveneziagiulia: e,
				friulivgiulia: e,
				fvg: e,
				laz: e,
				lazio: e,
				lig: e,
				liguria: e,
				lom: e,
				lombardia: e,
				lombardy: e,
				lucania: e,
				mar: e,
				marche: e,
				mol: e,
				molise: e,
				piedmont: e,
				piemonte: e,
				pmn: e,
				pug: e,
				puglia: e,
				sar: e,
				sardegna: e,
				sardinia: e,
				sic: e,
				sicilia: e,
				sicily: e,
				taa: e,
				tos: e,
				toscana: e,
				"trentin-sud-tirol": e,
				"xn--trentin-sd-tirol-rzb": e,
				"trentin-süd-tirol": e,
				"trentin-sudtirol": e,
				"xn--trentin-sdtirol-7vb": e,
				"trentin-südtirol": e,
				"trentin-sued-tirol": e,
				"trentin-suedtirol": e,
				trentino: e,
				"trentino-a-adige": e,
				"trentino-aadige": e,
				"trentino-alto-adige": e,
				"trentino-altoadige": e,
				"trentino-s-tirol": e,
				"trentino-stirol": e,
				"trentino-sud-tirol": e,
				"xn--trentino-sd-tirol-c3b": e,
				"trentino-süd-tirol": e,
				"trentino-sudtirol": e,
				"xn--trentino-sdtirol-szb": e,
				"trentino-südtirol": e,
				"trentino-sued-tirol": e,
				"trentino-suedtirol": e,
				"trentinoa-adige": e,
				trentinoaadige: e,
				"trentinoalto-adige": e,
				trentinoaltoadige: e,
				"trentinos-tirol": e,
				trentinostirol: e,
				"trentinosud-tirol": e,
				"xn--trentinosd-tirol-rzb": e,
				"trentinosüd-tirol": e,
				trentinosudtirol: e,
				"xn--trentinosdtirol-7vb": e,
				trentinosüdtirol: e,
				"trentinosued-tirol": e,
				trentinosuedtirol: e,
				"trentinsud-tirol": e,
				"xn--trentinsd-tirol-6vb": e,
				"trentinsüd-tirol": e,
				trentinsudtirol: e,
				"xn--trentinsdtirol-nsb": e,
				trentinsüdtirol: e,
				"trentinsued-tirol": e,
				trentinsuedtirol: e,
				tuscany: e,
				umb: e,
				umbria: e,
				"val-d-aosta": e,
				"val-daosta": e,
				"vald-aosta": e,
				valdaosta: e,
				"valle-aosta": e,
				"valle-d-aosta": e,
				"valle-daosta": e,
				valleaosta: e,
				"valled-aosta": e,
				valledaosta: e,
				"vallee-aoste": e,
				"xn--valle-aoste-ebb": e,
				"vallée-aoste": e,
				"vallee-d-aoste": e,
				"xn--valle-d-aoste-ehb": e,
				"vallée-d-aoste": e,
				valleeaoste: e,
				"xn--valleaoste-e7a": e,
				valléeaoste: e,
				valleedaoste: e,
				"xn--valledaoste-ebb": e,
				valléedaoste: e,
				vao: e,
				vda: e,
				ven: e,
				veneto: e,
				ag: e,
				agrigento: e,
				al: e,
				alessandria: e,
				"alto-adige": e,
				altoadige: e,
				an: e,
				ancona: e,
				"andria-barletta-trani": e,
				"andria-trani-barletta": e,
				andriabarlettatrani: e,
				andriatranibarletta: e,
				ao: e,
				aosta: e,
				aoste: e,
				ap: e,
				aq: e,
				aquila: e,
				ar: e,
				arezzo: e,
				"ascoli-piceno": e,
				ascolipiceno: e,
				asti: e,
				at: e,
				av: e,
				avellino: e,
				ba: e,
				balsan: e,
				"balsan-sudtirol": e,
				"xn--balsan-sdtirol-nsb": e,
				"balsan-südtirol": e,
				"balsan-suedtirol": e,
				bari: e,
				"barletta-trani-andria": e,
				barlettatraniandria: e,
				belluno: e,
				benevento: e,
				bergamo: e,
				bg: e,
				bi: e,
				biella: e,
				bl: e,
				bn: e,
				bo: e,
				bologna: e,
				bolzano: e,
				"bolzano-altoadige": e,
				bozen: e,
				"bozen-sudtirol": e,
				"xn--bozen-sdtirol-2ob": e,
				"bozen-südtirol": e,
				"bozen-suedtirol": e,
				br: e,
				brescia: e,
				brindisi: e,
				bs: e,
				bt: e,
				bulsan: e,
				"bulsan-sudtirol": e,
				"xn--bulsan-sdtirol-nsb": e,
				"bulsan-südtirol": e,
				"bulsan-suedtirol": e,
				bz: e,
				ca: e,
				cagliari: e,
				caltanissetta: e,
				"campidano-medio": e,
				campidanomedio: e,
				campobasso: e,
				"carbonia-iglesias": e,
				carboniaiglesias: e,
				"carrara-massa": e,
				carraramassa: e,
				caserta: e,
				catania: e,
				catanzaro: e,
				cb: e,
				ce: e,
				"cesena-forli": e,
				"xn--cesena-forl-mcb": e,
				"cesena-forlì": e,
				cesenaforli: e,
				"xn--cesenaforl-i8a": e,
				cesenaforlì: e,
				ch: e,
				chieti: e,
				ci: e,
				cl: e,
				cn: e,
				co: e,
				como: e,
				cosenza: e,
				cr: e,
				cremona: e,
				crotone: e,
				cs: e,
				ct: e,
				cuneo: e,
				cz: e,
				"dell-ogliastra": e,
				dellogliastra: e,
				en: e,
				enna: e,
				fc: e,
				fe: e,
				fermo: e,
				ferrara: e,
				fg: e,
				fi: e,
				firenze: e,
				florence: e,
				fm: e,
				foggia: e,
				"forli-cesena": e,
				"xn--forl-cesena-fcb": e,
				"forlì-cesena": e,
				forlicesena: e,
				"xn--forlcesena-c8a": e,
				forlìcesena: e,
				fr: e,
				frosinone: e,
				ge: e,
				genoa: e,
				genova: e,
				go: e,
				gorizia: e,
				gr: e,
				grosseto: e,
				"iglesias-carbonia": e,
				iglesiascarbonia: e,
				im: e,
				imperia: e,
				is: e,
				isernia: e,
				kr: e,
				"la-spezia": e,
				laquila: e,
				laspezia: e,
				latina: e,
				lc: e,
				le: e,
				lecce: e,
				lecco: e,
				li: e,
				livorno: e,
				lo: e,
				lodi: e,
				lt: e,
				lu: e,
				lucca: e,
				macerata: e,
				mantova: e,
				"massa-carrara": e,
				massacarrara: e,
				matera: e,
				mb: e,
				mc: e,
				me: e,
				"medio-campidano": e,
				mediocampidano: e,
				messina: e,
				mi: e,
				milan: e,
				milano: e,
				mn: e,
				mo: e,
				modena: e,
				monza: e,
				"monza-brianza": e,
				"monza-e-della-brianza": e,
				monzabrianza: e,
				monzaebrianza: e,
				monzaedellabrianza: e,
				ms: e,
				mt: e,
				na: e,
				naples: e,
				napoli: e,
				no: e,
				novara: e,
				nu: e,
				nuoro: e,
				og: e,
				ogliastra: e,
				"olbia-tempio": e,
				olbiatempio: e,
				or: e,
				oristano: e,
				ot: e,
				pa: e,
				padova: e,
				padua: e,
				palermo: e,
				parma: e,
				pavia: e,
				pc: e,
				pd: e,
				pe: e,
				perugia: e,
				"pesaro-urbino": e,
				pesarourbino: e,
				pescara: e,
				pg: e,
				pi: e,
				piacenza: e,
				pisa: e,
				pistoia: e,
				pn: e,
				po: e,
				pordenone: e,
				potenza: e,
				pr: e,
				prato: e,
				pt: e,
				pu: e,
				pv: e,
				pz: e,
				ra: e,
				ragusa: e,
				ravenna: e,
				rc: e,
				re: e,
				"reggio-calabria": e,
				"reggio-emilia": e,
				reggiocalabria: e,
				reggioemilia: e,
				rg: e,
				ri: e,
				rieti: e,
				rimini: e,
				rm: e,
				rn: e,
				ro: e,
				roma: e,
				rome: e,
				rovigo: e,
				sa: e,
				salerno: e,
				sassari: e,
				savona: e,
				si: e,
				siena: e,
				siracusa: e,
				so: e,
				sondrio: e,
				sp: e,
				sr: e,
				ss: e,
				"xn--sdtirol-n2a": e,
				südtirol: e,
				suedtirol: e,
				sv: e,
				ta: e,
				taranto: e,
				te: e,
				"tempio-olbia": e,
				tempioolbia: e,
				teramo: e,
				terni: e,
				tn: e,
				to: e,
				torino: e,
				tp: e,
				tr: e,
				"trani-andria-barletta": e,
				"trani-barletta-andria": e,
				traniandriabarletta: e,
				tranibarlettaandria: e,
				trapani: e,
				trento: e,
				treviso: e,
				trieste: e,
				ts: e,
				turin: e,
				tv: e,
				ud: e,
				udine: e,
				"urbino-pesaro": e,
				urbinopesaro: e,
				va: e,
				varese: e,
				vb: e,
				vc: e,
				ve: e,
				venezia: e,
				venice: e,
				verbania: e,
				vercelli: e,
				verona: e,
				vi: e,
				"vibo-valentia": e,
				vibovalentia: e,
				vicenza: e,
				viterbo: e,
				vr: e,
				vs: e,
				vt: e,
				vv: e,
				"12chars": t,
				ibxos: t,
				iliadboxos: t,
				neen: [0, { jc: t }],
				"123homepage": t,
				"16-b": t,
				"32-b": t,
				"64-b": t,
				myspreadshop: t,
				syncloud: t
			}],
			je: [1, {
				co: e,
				net: e,
				org: e,
				of: t
			}],
			jm: h,
			jo: [1, {
				agri: e,
				ai: e,
				com: e,
				edu: e,
				eng: e,
				fm: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				per: e,
				phd: e,
				sch: e,
				tv: e
			}],
			jobs: e,
			jp: [1, {
				ac: e,
				ad: e,
				co: e,
				ed: e,
				go: e,
				gr: e,
				lg: e,
				ne: [1, {
					aseinet: le,
					gehirn: t,
					ivory: t,
					"mail-box": t,
					mints: t,
					mokuren: t,
					opal: t,
					sakura: t,
					sumomo: t,
					topaz: t
				}],
				or: e,
				aichi: [1, {
					aisai: e,
					ama: e,
					anjo: e,
					asuke: e,
					chiryu: e,
					chita: e,
					fuso: e,
					gamagori: e,
					handa: e,
					hazu: e,
					hekinan: e,
					higashiura: e,
					ichinomiya: e,
					inazawa: e,
					inuyama: e,
					isshiki: e,
					iwakura: e,
					kanie: e,
					kariya: e,
					kasugai: e,
					kira: e,
					kiyosu: e,
					komaki: e,
					konan: e,
					kota: e,
					mihama: e,
					miyoshi: e,
					nishio: e,
					nisshin: e,
					obu: e,
					oguchi: e,
					oharu: e,
					okazaki: e,
					owariasahi: e,
					seto: e,
					shikatsu: e,
					shinshiro: e,
					shitara: e,
					tahara: e,
					takahama: e,
					tobishima: e,
					toei: e,
					togo: e,
					tokai: e,
					tokoname: e,
					toyoake: e,
					toyohashi: e,
					toyokawa: e,
					toyone: e,
					toyota: e,
					tsushima: e,
					yatomi: e
				}],
				akita: [1, {
					akita: e,
					daisen: e,
					fujisato: e,
					gojome: e,
					hachirogata: e,
					happou: e,
					higashinaruse: e,
					honjo: e,
					honjyo: e,
					ikawa: e,
					kamikoani: e,
					kamioka: e,
					katagami: e,
					kazuno: e,
					kitaakita: e,
					kosaka: e,
					kyowa: e,
					misato: e,
					mitane: e,
					moriyoshi: e,
					nikaho: e,
					noshiro: e,
					odate: e,
					oga: e,
					ogata: e,
					semboku: e,
					yokote: e,
					yurihonjo: e
				}],
				aomori: [1, {
					aomori: e,
					gonohe: e,
					hachinohe: e,
					hashikami: e,
					hiranai: e,
					hirosaki: e,
					itayanagi: e,
					kuroishi: e,
					misawa: e,
					mutsu: e,
					nakadomari: e,
					noheji: e,
					oirase: e,
					owani: e,
					rokunohe: e,
					sannohe: e,
					shichinohe: e,
					shingo: e,
					takko: e,
					towada: e,
					tsugaru: e,
					tsuruta: e
				}],
				chiba: [1, {
					abiko: e,
					asahi: e,
					chonan: e,
					chosei: e,
					choshi: e,
					chuo: e,
					funabashi: e,
					futtsu: e,
					hanamigawa: e,
					ichihara: e,
					ichikawa: e,
					ichinomiya: e,
					inzai: e,
					isumi: e,
					kamagaya: e,
					kamogawa: e,
					kashiwa: e,
					katori: e,
					katsuura: e,
					kimitsu: e,
					kisarazu: e,
					kozaki: e,
					kujukuri: e,
					kyonan: e,
					matsudo: e,
					midori: e,
					mihama: e,
					minamiboso: e,
					mobara: e,
					mutsuzawa: e,
					nagara: e,
					nagareyama: e,
					narashino: e,
					narita: e,
					noda: e,
					oamishirasato: e,
					omigawa: e,
					onjuku: e,
					otaki: e,
					sakae: e,
					sakura: e,
					shimofusa: e,
					shirako: e,
					shiroi: e,
					shisui: e,
					sodegaura: e,
					sosa: e,
					tako: e,
					tateyama: e,
					togane: e,
					tohnosho: e,
					tomisato: e,
					urayasu: e,
					yachimata: e,
					yachiyo: e,
					yokaichiba: e,
					yokoshibahikari: e,
					yotsukaido: e
				}],
				ehime: [1, {
					ainan: e,
					honai: e,
					ikata: e,
					imabari: e,
					iyo: e,
					kamijima: e,
					kihoku: e,
					kumakogen: e,
					masaki: e,
					matsuno: e,
					matsuyama: e,
					namikata: e,
					niihama: e,
					ozu: e,
					saijo: e,
					seiyo: e,
					shikokuchuo: e,
					tobe: e,
					toon: e,
					uchiko: e,
					uwajima: e,
					yawatahama: e
				}],
				fukui: [1, {
					echizen: e,
					eiheiji: e,
					fukui: e,
					ikeda: e,
					katsuyama: e,
					mihama: e,
					minamiechizen: e,
					obama: e,
					ohi: e,
					ono: e,
					sabae: e,
					sakai: e,
					takahama: e,
					tsuruga: e,
					wakasa: e
				}],
				fukuoka: [1, {
					ashiya: e,
					buzen: e,
					chikugo: e,
					chikuho: e,
					chikujo: e,
					chikushino: e,
					chikuzen: e,
					chuo: e,
					dazaifu: e,
					fukuchi: e,
					hakata: e,
					higashi: e,
					hirokawa: e,
					hisayama: e,
					iizuka: e,
					inatsuki: e,
					kaho: e,
					kasuga: e,
					kasuya: e,
					kawara: e,
					keisen: e,
					koga: e,
					kurate: e,
					kurogi: e,
					kurume: e,
					minami: e,
					miyako: e,
					miyama: e,
					miyawaka: e,
					mizumaki: e,
					munakata: e,
					nakagawa: e,
					nakama: e,
					nishi: e,
					nogata: e,
					ogori: e,
					okagaki: e,
					okawa: e,
					oki: e,
					omuta: e,
					onga: e,
					onojo: e,
					oto: e,
					saigawa: e,
					sasaguri: e,
					shingu: e,
					shinyoshitomi: e,
					shonai: e,
					soeda: e,
					sue: e,
					tachiarai: e,
					tagawa: e,
					takata: e,
					toho: e,
					toyotsu: e,
					tsuiki: e,
					ukiha: e,
					umi: e,
					usui: e,
					yamada: e,
					yame: e,
					yanagawa: e,
					yukuhashi: e
				}],
				fukushima: [1, {
					aizubange: e,
					aizumisato: e,
					aizuwakamatsu: e,
					asakawa: e,
					bandai: e,
					date: e,
					fukushima: e,
					furudono: e,
					futaba: e,
					hanawa: e,
					higashi: e,
					hirata: e,
					hirono: e,
					iitate: e,
					inawashiro: e,
					ishikawa: e,
					iwaki: e,
					izumizaki: e,
					kagamiishi: e,
					kaneyama: e,
					kawamata: e,
					kitakata: e,
					kitashiobara: e,
					koori: e,
					koriyama: e,
					kunimi: e,
					miharu: e,
					mishima: e,
					namie: e,
					nango: e,
					nishiaizu: e,
					nishigo: e,
					okuma: e,
					omotego: e,
					ono: e,
					otama: e,
					samegawa: e,
					shimogo: e,
					shirakawa: e,
					showa: e,
					soma: e,
					sukagawa: e,
					taishin: e,
					tamakawa: e,
					tanagura: e,
					tenei: e,
					yabuki: e,
					yamato: e,
					yamatsuri: e,
					yanaizu: e,
					yugawa: e
				}],
				gifu: [1, {
					anpachi: e,
					ena: e,
					gifu: e,
					ginan: e,
					godo: e,
					gujo: e,
					hashima: e,
					hichiso: e,
					hida: e,
					higashishirakawa: e,
					ibigawa: e,
					ikeda: e,
					kakamigahara: e,
					kani: e,
					kasahara: e,
					kasamatsu: e,
					kawaue: e,
					kitagata: e,
					mino: e,
					minokamo: e,
					mitake: e,
					mizunami: e,
					motosu: e,
					nakatsugawa: e,
					ogaki: e,
					sakahogi: e,
					seki: e,
					sekigahara: e,
					shirakawa: e,
					tajimi: e,
					takayama: e,
					tarui: e,
					toki: e,
					tomika: e,
					wanouchi: e,
					yamagata: e,
					yaotsu: e,
					yoro: e
				}],
				gunma: [1, {
					annaka: e,
					chiyoda: e,
					fujioka: e,
					higashiagatsuma: e,
					isesaki: e,
					itakura: e,
					kanna: e,
					kanra: e,
					katashina: e,
					kawaba: e,
					kiryu: e,
					kusatsu: e,
					maebashi: e,
					meiwa: e,
					midori: e,
					minakami: e,
					naganohara: e,
					nakanojo: e,
					nanmoku: e,
					numata: e,
					oizumi: e,
					ora: e,
					ota: e,
					shibukawa: e,
					shimonita: e,
					shinto: e,
					showa: e,
					takasaki: e,
					takayama: e,
					tamamura: e,
					tatebayashi: e,
					tomioka: e,
					tsukiyono: e,
					tsumagoi: e,
					ueno: e,
					yoshioka: e
				}],
				hiroshima: [1, {
					asaminami: e,
					daiwa: e,
					etajima: e,
					fuchu: e,
					fukuyama: e,
					hatsukaichi: e,
					higashihiroshima: e,
					hongo: e,
					jinsekikogen: e,
					kaita: e,
					kui: e,
					kumano: e,
					kure: e,
					mihara: e,
					miyoshi: e,
					naka: e,
					onomichi: e,
					osakikamijima: e,
					otake: e,
					saka: e,
					sera: e,
					seranishi: e,
					shinichi: e,
					shobara: e,
					takehara: e
				}],
				hokkaido: [1, {
					abashiri: e,
					abira: e,
					aibetsu: e,
					akabira: e,
					akkeshi: e,
					asahikawa: e,
					ashibetsu: e,
					ashoro: e,
					assabu: e,
					atsuma: e,
					bibai: e,
					biei: e,
					bifuka: e,
					bihoro: e,
					biratori: e,
					chippubetsu: e,
					chitose: e,
					date: e,
					ebetsu: e,
					embetsu: e,
					eniwa: e,
					erimo: e,
					esan: e,
					esashi: e,
					fukagawa: e,
					fukushima: e,
					furano: e,
					furubira: e,
					haboro: e,
					hakodate: e,
					hamatonbetsu: e,
					hidaka: e,
					higashikagura: e,
					higashikawa: e,
					hiroo: e,
					hokuryu: e,
					hokuto: e,
					honbetsu: e,
					horokanai: e,
					horonobe: e,
					ikeda: e,
					imakane: e,
					ishikari: e,
					iwamizawa: e,
					iwanai: e,
					kamifurano: e,
					kamikawa: e,
					kamishihoro: e,
					kamisunagawa: e,
					kamoenai: e,
					kayabe: e,
					kembuchi: e,
					kikonai: e,
					kimobetsu: e,
					kitahiroshima: e,
					kitami: e,
					kiyosato: e,
					koshimizu: e,
					kunneppu: e,
					kuriyama: e,
					kuromatsunai: e,
					kushiro: e,
					kutchan: e,
					kyowa: e,
					mashike: e,
					matsumae: e,
					mikasa: e,
					minamifurano: e,
					mombetsu: e,
					moseushi: e,
					mukawa: e,
					muroran: e,
					naie: e,
					nakagawa: e,
					nakasatsunai: e,
					nakatombetsu: e,
					nanae: e,
					nanporo: e,
					nayoro: e,
					nemuro: e,
					niikappu: e,
					niki: e,
					nishiokoppe: e,
					noboribetsu: e,
					numata: e,
					obihiro: e,
					obira: e,
					oketo: e,
					okoppe: e,
					otaru: e,
					otobe: e,
					otofuke: e,
					otoineppu: e,
					oumu: e,
					ozora: e,
					pippu: e,
					rankoshi: e,
					rebun: e,
					rikubetsu: e,
					rishiri: e,
					rishirifuji: e,
					saroma: e,
					sarufutsu: e,
					shakotan: e,
					shari: e,
					shibecha: e,
					shibetsu: e,
					shikabe: e,
					shikaoi: e,
					shimamaki: e,
					shimizu: e,
					shimokawa: e,
					shinshinotsu: e,
					shintoku: e,
					shiranuka: e,
					shiraoi: e,
					shiriuchi: e,
					sobetsu: e,
					sunagawa: e,
					taiki: e,
					takasu: e,
					takikawa: e,
					takinoue: e,
					teshikaga: e,
					tobetsu: e,
					tohma: e,
					tomakomai: e,
					tomari: e,
					toya: e,
					toyako: e,
					toyotomi: e,
					toyoura: e,
					tsubetsu: e,
					tsukigata: e,
					urakawa: e,
					urausu: e,
					uryu: e,
					utashinai: e,
					wakkanai: e,
					wassamu: e,
					yakumo: e,
					yoichi: e
				}],
				hyogo: [1, {
					aioi: e,
					akashi: e,
					ako: e,
					amagasaki: e,
					aogaki: e,
					asago: e,
					ashiya: e,
					awaji: e,
					fukusaki: e,
					goshiki: e,
					harima: e,
					himeji: e,
					ichikawa: e,
					inagawa: e,
					itami: e,
					kakogawa: e,
					kamigori: e,
					kamikawa: e,
					kasai: e,
					kasuga: e,
					kawanishi: e,
					miki: e,
					minamiawaji: e,
					nishinomiya: e,
					nishiwaki: e,
					ono: e,
					sanda: e,
					sannan: e,
					sasayama: e,
					sayo: e,
					shingu: e,
					shinonsen: e,
					shiso: e,
					sumoto: e,
					taishi: e,
					taka: e,
					takarazuka: e,
					takasago: e,
					takino: e,
					tamba: e,
					tatsuno: e,
					toyooka: e,
					yabu: e,
					yashiro: e,
					yoka: e,
					yokawa: e
				}],
				ibaraki: [1, {
					ami: e,
					asahi: e,
					bando: e,
					chikusei: e,
					daigo: e,
					fujishiro: e,
					hitachi: e,
					hitachinaka: e,
					hitachiomiya: e,
					hitachiota: e,
					ibaraki: e,
					ina: e,
					inashiki: e,
					itako: e,
					iwama: e,
					joso: e,
					kamisu: e,
					kasama: e,
					kashima: e,
					kasumigaura: e,
					koga: e,
					miho: e,
					mito: e,
					moriya: e,
					naka: e,
					namegata: e,
					oarai: e,
					ogawa: e,
					omitama: e,
					ryugasaki: e,
					sakai: e,
					sakuragawa: e,
					shimodate: e,
					shimotsuma: e,
					shirosato: e,
					sowa: e,
					suifu: e,
					takahagi: e,
					tamatsukuri: e,
					tokai: e,
					tomobe: e,
					tone: e,
					toride: e,
					tsuchiura: e,
					tsukuba: e,
					uchihara: e,
					ushiku: e,
					yachiyo: e,
					yamagata: e,
					yawara: e,
					yuki: e
				}],
				ishikawa: [1, {
					anamizu: e,
					hakui: e,
					hakusan: e,
					kaga: e,
					kahoku: e,
					kanazawa: e,
					kawakita: e,
					komatsu: e,
					nakanoto: e,
					nanao: e,
					nomi: e,
					nonoichi: e,
					noto: e,
					shika: e,
					suzu: e,
					tsubata: e,
					tsurugi: e,
					uchinada: e,
					wajima: e
				}],
				iwate: [1, {
					fudai: e,
					fujisawa: e,
					hanamaki: e,
					hiraizumi: e,
					hirono: e,
					ichinohe: e,
					ichinoseki: e,
					iwaizumi: e,
					iwate: e,
					joboji: e,
					kamaishi: e,
					kanegasaki: e,
					karumai: e,
					kawai: e,
					kitakami: e,
					kuji: e,
					kunohe: e,
					kuzumaki: e,
					miyako: e,
					mizusawa: e,
					morioka: e,
					ninohe: e,
					noda: e,
					ofunato: e,
					oshu: e,
					otsuchi: e,
					rikuzentakata: e,
					shiwa: e,
					shizukuishi: e,
					sumita: e,
					tanohata: e,
					tono: e,
					yahaba: e,
					yamada: e
				}],
				kagawa: [1, {
					ayagawa: e,
					higashikagawa: e,
					kanonji: e,
					kotohira: e,
					manno: e,
					marugame: e,
					mitoyo: e,
					naoshima: e,
					sanuki: e,
					tadotsu: e,
					takamatsu: e,
					tonosho: e,
					uchinomi: e,
					utazu: e,
					zentsuji: e
				}],
				kagoshima: [1, {
					akune: e,
					amami: e,
					hioki: e,
					isa: e,
					isen: e,
					izumi: e,
					kagoshima: e,
					kanoya: e,
					kawanabe: e,
					kinko: e,
					kouyama: e,
					makurazaki: e,
					matsumoto: e,
					minamitane: e,
					nakatane: e,
					nishinoomote: e,
					satsumasendai: e,
					soo: e,
					tarumizu: e,
					yusui: e
				}],
				kanagawa: [1, {
					aikawa: e,
					atsugi: e,
					ayase: e,
					chigasaki: e,
					ebina: e,
					fujisawa: e,
					hadano: e,
					hakone: e,
					hiratsuka: e,
					isehara: e,
					kaisei: e,
					kamakura: e,
					kiyokawa: e,
					matsuda: e,
					minamiashigara: e,
					miura: e,
					nakai: e,
					ninomiya: e,
					odawara: e,
					oi: e,
					oiso: e,
					sagamihara: e,
					samukawa: e,
					tsukui: e,
					yamakita: e,
					yamato: e,
					yokosuka: e,
					yugawara: e,
					zama: e,
					zushi: e
				}],
				kochi: [1, {
					aki: e,
					geisei: e,
					hidaka: e,
					higashitsuno: e,
					ino: e,
					kagami: e,
					kami: e,
					kitagawa: e,
					kochi: e,
					mihara: e,
					motoyama: e,
					muroto: e,
					nahari: e,
					nakamura: e,
					nankoku: e,
					nishitosa: e,
					niyodogawa: e,
					ochi: e,
					okawa: e,
					otoyo: e,
					otsuki: e,
					sakawa: e,
					sukumo: e,
					susaki: e,
					tosa: e,
					tosashimizu: e,
					toyo: e,
					tsuno: e,
					umaji: e,
					yasuda: e,
					yusuhara: e
				}],
				kumamoto: [1, {
					amakusa: e,
					arao: e,
					aso: e,
					choyo: e,
					gyokuto: e,
					kamiamakusa: e,
					kikuchi: e,
					kumamoto: e,
					mashiki: e,
					mifune: e,
					minamata: e,
					minamioguni: e,
					nagasu: e,
					nishihara: e,
					oguni: e,
					ozu: e,
					sumoto: e,
					takamori: e,
					uki: e,
					uto: e,
					yamaga: e,
					yamato: e,
					yatsushiro: e
				}],
				kyoto: [1, {
					ayabe: e,
					fukuchiyama: e,
					higashiyama: e,
					ide: e,
					ine: e,
					joyo: e,
					kameoka: e,
					kamo: e,
					kita: e,
					kizu: e,
					kumiyama: e,
					kyotamba: e,
					kyotanabe: e,
					kyotango: e,
					maizuru: e,
					minami: e,
					minamiyamashiro: e,
					miyazu: e,
					muko: e,
					nagaokakyo: e,
					nakagyo: e,
					nantan: e,
					oyamazaki: e,
					sakyo: e,
					seika: e,
					tanabe: e,
					uji: e,
					ujitawara: e,
					wazuka: e,
					yamashina: e,
					yawata: e
				}],
				mie: [1, {
					asahi: e,
					inabe: e,
					ise: e,
					kameyama: e,
					kawagoe: e,
					kiho: e,
					kisosaki: e,
					kiwa: e,
					komono: e,
					kumano: e,
					kuwana: e,
					matsusaka: e,
					meiwa: e,
					mihama: e,
					minamiise: e,
					misugi: e,
					miyama: e,
					nabari: e,
					shima: e,
					suzuka: e,
					tado: e,
					taiki: e,
					taki: e,
					tamaki: e,
					toba: e,
					tsu: e,
					udono: e,
					ureshino: e,
					watarai: e,
					yokkaichi: e
				}],
				miyagi: [1, {
					furukawa: e,
					higashimatsushima: e,
					ishinomaki: e,
					iwanuma: e,
					kakuda: e,
					kami: e,
					kawasaki: e,
					marumori: e,
					matsushima: e,
					minamisanriku: e,
					misato: e,
					murata: e,
					natori: e,
					ogawara: e,
					ohira: e,
					onagawa: e,
					osaki: e,
					rifu: e,
					semine: e,
					shibata: e,
					shichikashuku: e,
					shikama: e,
					shiogama: e,
					shiroishi: e,
					tagajo: e,
					taiwa: e,
					tome: e,
					tomiya: e,
					wakuya: e,
					watari: e,
					yamamoto: e,
					zao: e
				}],
				miyazaki: [1, {
					aya: e,
					ebino: e,
					gokase: e,
					hyuga: e,
					kadogawa: e,
					kawaminami: e,
					kijo: e,
					kitagawa: e,
					kitakata: e,
					kitaura: e,
					kobayashi: e,
					kunitomi: e,
					kushima: e,
					mimata: e,
					miyakonojo: e,
					miyazaki: e,
					morotsuka: e,
					nichinan: e,
					nishimera: e,
					nobeoka: e,
					saito: e,
					shiiba: e,
					shintomi: e,
					takaharu: e,
					takanabe: e,
					takazaki: e,
					tsuno: e
				}],
				nagano: [1, {
					achi: e,
					agematsu: e,
					anan: e,
					aoki: e,
					asahi: e,
					azumino: e,
					chikuhoku: e,
					chikuma: e,
					chino: e,
					fujimi: e,
					hakuba: e,
					hara: e,
					hiraya: e,
					iida: e,
					iijima: e,
					iiyama: e,
					iizuna: e,
					ikeda: e,
					ikusaka: e,
					ina: e,
					karuizawa: e,
					kawakami: e,
					kiso: e,
					kisofukushima: e,
					kitaaiki: e,
					komagane: e,
					komoro: e,
					matsukawa: e,
					matsumoto: e,
					miasa: e,
					minamiaiki: e,
					minamimaki: e,
					minamiminowa: e,
					minowa: e,
					miyada: e,
					miyota: e,
					mochizuki: e,
					nagano: e,
					nagawa: e,
					nagiso: e,
					nakagawa: e,
					nakano: e,
					nozawaonsen: e,
					obuse: e,
					ogawa: e,
					okaya: e,
					omachi: e,
					omi: e,
					ookuwa: e,
					ooshika: e,
					otaki: e,
					otari: e,
					sakae: e,
					sakaki: e,
					saku: e,
					sakuho: e,
					shimosuwa: e,
					shinanomachi: e,
					shiojiri: e,
					suwa: e,
					suzaka: e,
					takagi: e,
					takamori: e,
					takayama: e,
					tateshina: e,
					tatsuno: e,
					togakushi: e,
					togura: e,
					tomi: e,
					ueda: e,
					wada: e,
					yamagata: e,
					yamanouchi: e,
					yasaka: e,
					yasuoka: e
				}],
				nagasaki: [1, {
					chijiwa: e,
					futsu: e,
					goto: e,
					hasami: e,
					hirado: e,
					iki: e,
					isahaya: e,
					kawatana: e,
					kuchinotsu: e,
					matsuura: e,
					nagasaki: e,
					obama: e,
					omura: e,
					oseto: e,
					saikai: e,
					sasebo: e,
					seihi: e,
					shimabara: e,
					shinkamigoto: e,
					togitsu: e,
					tsushima: e,
					unzen: e
				}],
				nara: [1, {
					ando: e,
					gose: e,
					heguri: e,
					higashiyoshino: e,
					ikaruga: e,
					ikoma: e,
					kamikitayama: e,
					kanmaki: e,
					kashiba: e,
					kashihara: e,
					katsuragi: e,
					kawai: e,
					kawakami: e,
					kawanishi: e,
					koryo: e,
					kurotaki: e,
					mitsue: e,
					miyake: e,
					nara: e,
					nosegawa: e,
					oji: e,
					ouda: e,
					oyodo: e,
					sakurai: e,
					sango: e,
					shimoichi: e,
					shimokitayama: e,
					shinjo: e,
					soni: e,
					takatori: e,
					tawaramoto: e,
					tenkawa: e,
					tenri: e,
					uda: e,
					yamatokoriyama: e,
					yamatotakada: e,
					yamazoe: e,
					yoshino: e
				}],
				niigata: [1, {
					aga: e,
					agano: e,
					gosen: e,
					itoigawa: e,
					izumozaki: e,
					joetsu: e,
					kamo: e,
					kariwa: e,
					kashiwazaki: e,
					minamiuonuma: e,
					mitsuke: e,
					muika: e,
					murakami: e,
					myoko: e,
					nagaoka: e,
					niigata: e,
					ojiya: e,
					omi: e,
					sado: e,
					sanjo: e,
					seiro: e,
					seirou: e,
					sekikawa: e,
					shibata: e,
					tagami: e,
					tainai: e,
					tochio: e,
					tokamachi: e,
					tsubame: e,
					tsunan: e,
					uonuma: e,
					yahiko: e,
					yoita: e,
					yuzawa: e
				}],
				oita: [1, {
					beppu: e,
					bungoono: e,
					bungotakada: e,
					hasama: e,
					hiji: e,
					himeshima: e,
					hita: e,
					kamitsue: e,
					kokonoe: e,
					kuju: e,
					kunisaki: e,
					kusu: e,
					oita: e,
					saiki: e,
					taketa: e,
					tsukumi: e,
					usa: e,
					usuki: e,
					yufu: e
				}],
				okayama: [1, {
					akaiwa: e,
					asakuchi: e,
					bizen: e,
					hayashima: e,
					ibara: e,
					kagamino: e,
					kasaoka: e,
					kibichuo: e,
					kumenan: e,
					kurashiki: e,
					maniwa: e,
					misaki: e,
					nagi: e,
					niimi: e,
					nishiawakura: e,
					okayama: e,
					satosho: e,
					setouchi: e,
					shinjo: e,
					shoo: e,
					soja: e,
					takahashi: e,
					tamano: e,
					tsuyama: e,
					wake: e,
					yakage: e
				}],
				okinawa: [1, {
					aguni: e,
					ginowan: e,
					ginoza: e,
					gushikami: e,
					haebaru: e,
					higashi: e,
					hirara: e,
					iheya: e,
					ishigaki: e,
					ishikawa: e,
					itoman: e,
					izena: e,
					kadena: e,
					kin: e,
					kitadaito: e,
					kitanakagusuku: e,
					kumejima: e,
					kunigami: e,
					minamidaito: e,
					motobu: e,
					nago: e,
					naha: e,
					nakagusuku: e,
					nakijin: e,
					nanjo: e,
					nishihara: e,
					ogimi: e,
					okinawa: e,
					onna: e,
					shimoji: e,
					taketomi: e,
					tarama: e,
					tokashiki: e,
					tomigusuku: e,
					tonaki: e,
					urasoe: e,
					uruma: e,
					yaese: e,
					yomitan: e,
					yonabaru: e,
					yonaguni: e,
					zamami: e
				}],
				osaka: [1, {
					abeno: e,
					chihayaakasaka: e,
					chuo: e,
					daito: e,
					fujiidera: e,
					habikino: e,
					hannan: e,
					higashiosaka: e,
					higashisumiyoshi: e,
					higashiyodogawa: e,
					hirakata: e,
					ibaraki: e,
					ikeda: e,
					izumi: e,
					izumiotsu: e,
					izumisano: e,
					kadoma: e,
					kaizuka: e,
					kanan: e,
					kashiwara: e,
					katano: e,
					kawachinagano: e,
					kishiwada: e,
					kita: e,
					kumatori: e,
					matsubara: e,
					minato: e,
					minoh: e,
					misaki: e,
					moriguchi: e,
					neyagawa: e,
					nishi: e,
					nose: e,
					osakasayama: e,
					sakai: e,
					sayama: e,
					sennan: e,
					settsu: e,
					shijonawate: e,
					shimamoto: e,
					suita: e,
					tadaoka: e,
					taishi: e,
					tajiri: e,
					takaishi: e,
					takatsuki: e,
					tondabayashi: e,
					toyonaka: e,
					toyono: e,
					yao: e
				}],
				saga: [1, {
					ariake: e,
					arita: e,
					fukudomi: e,
					genkai: e,
					hamatama: e,
					hizen: e,
					imari: e,
					kamimine: e,
					kanzaki: e,
					karatsu: e,
					kashima: e,
					kitagata: e,
					kitahata: e,
					kiyama: e,
					kouhoku: e,
					kyuragi: e,
					nishiarita: e,
					ogi: e,
					omachi: e,
					ouchi: e,
					saga: e,
					shiroishi: e,
					taku: e,
					tara: e,
					tosu: e,
					yoshinogari: e
				}],
				saitama: [1, {
					arakawa: e,
					asaka: e,
					chichibu: e,
					fujimi: e,
					fujimino: e,
					fukaya: e,
					hanno: e,
					hanyu: e,
					hasuda: e,
					hatogaya: e,
					hatoyama: e,
					hidaka: e,
					higashichichibu: e,
					higashimatsuyama: e,
					honjo: e,
					ina: e,
					iruma: e,
					iwatsuki: e,
					kamiizumi: e,
					kamikawa: e,
					kamisato: e,
					kasukabe: e,
					kawagoe: e,
					kawaguchi: e,
					kawajima: e,
					kazo: e,
					kitamoto: e,
					koshigaya: e,
					kounosu: e,
					kuki: e,
					kumagaya: e,
					matsubushi: e,
					minano: e,
					misato: e,
					miyashiro: e,
					miyoshi: e,
					moroyama: e,
					nagatoro: e,
					namegawa: e,
					niiza: e,
					ogano: e,
					ogawa: e,
					ogose: e,
					okegawa: e,
					omiya: e,
					otaki: e,
					ranzan: e,
					ryokami: e,
					saitama: e,
					sakado: e,
					satte: e,
					sayama: e,
					shiki: e,
					shiraoka: e,
					soka: e,
					sugito: e,
					toda: e,
					tokigawa: e,
					tokorozawa: e,
					tsurugashima: e,
					urawa: e,
					warabi: e,
					yashio: e,
					yokoze: e,
					yono: e,
					yorii: e,
					yoshida: e,
					yoshikawa: e,
					yoshimi: e
				}],
				shiga: [1, {
					aisho: e,
					gamo: e,
					higashiomi: e,
					hikone: e,
					koka: e,
					konan: e,
					kosei: e,
					koto: e,
					kusatsu: e,
					maibara: e,
					moriyama: e,
					nagahama: e,
					nishiazai: e,
					notogawa: e,
					omihachiman: e,
					otsu: e,
					ritto: e,
					ryuoh: e,
					takashima: e,
					takatsuki: e,
					torahime: e,
					toyosato: e,
					yasu: e
				}],
				shimane: [1, {
					akagi: e,
					ama: e,
					gotsu: e,
					hamada: e,
					higashiizumo: e,
					hikawa: e,
					hikimi: e,
					izumo: e,
					kakinoki: e,
					masuda: e,
					matsue: e,
					misato: e,
					nishinoshima: e,
					ohda: e,
					okinoshima: e,
					okuizumo: e,
					shimane: e,
					tamayu: e,
					tsuwano: e,
					unnan: e,
					yakumo: e,
					yasugi: e,
					yatsuka: e
				}],
				shizuoka: [1, {
					arai: e,
					atami: e,
					fuji: e,
					fujieda: e,
					fujikawa: e,
					fujinomiya: e,
					fukuroi: e,
					gotemba: e,
					haibara: e,
					hamamatsu: e,
					higashiizu: e,
					ito: e,
					iwata: e,
					izu: e,
					izunokuni: e,
					kakegawa: e,
					kannami: e,
					kawanehon: e,
					kawazu: e,
					kikugawa: e,
					kosai: e,
					makinohara: e,
					matsuzaki: e,
					minamiizu: e,
					mishima: e,
					morimachi: e,
					nishiizu: e,
					numazu: e,
					omaezaki: e,
					shimada: e,
					shimizu: e,
					shimoda: e,
					shizuoka: e,
					susono: e,
					yaizu: e,
					yoshida: e
				}],
				tochigi: [1, {
					ashikaga: e,
					bato: e,
					haga: e,
					ichikai: e,
					iwafune: e,
					kaminokawa: e,
					kanuma: e,
					karasuyama: e,
					kuroiso: e,
					mashiko: e,
					mibu: e,
					moka: e,
					motegi: e,
					nasu: e,
					nasushiobara: e,
					nikko: e,
					nishikata: e,
					nogi: e,
					ohira: e,
					ohtawara: e,
					oyama: e,
					sakura: e,
					sano: e,
					shimotsuke: e,
					shioya: e,
					takanezawa: e,
					tochigi: e,
					tsuga: e,
					ujiie: e,
					utsunomiya: e,
					yaita: e
				}],
				tokushima: [1, {
					aizumi: e,
					anan: e,
					ichiba: e,
					itano: e,
					kainan: e,
					komatsushima: e,
					matsushige: e,
					mima: e,
					minami: e,
					miyoshi: e,
					mugi: e,
					nakagawa: e,
					naruto: e,
					sanagochi: e,
					shishikui: e,
					tokushima: e,
					wajiki: e
				}],
				tokyo: [1, {
					adachi: e,
					akiruno: e,
					akishima: e,
					aogashima: e,
					arakawa: e,
					bunkyo: e,
					chiyoda: e,
					chofu: e,
					chuo: e,
					edogawa: e,
					fuchu: e,
					fussa: e,
					hachijo: e,
					hachioji: e,
					hamura: e,
					higashikurume: e,
					higashimurayama: e,
					higashiyamato: e,
					hino: e,
					hinode: e,
					hinohara: e,
					inagi: e,
					itabashi: e,
					katsushika: e,
					kita: e,
					kiyose: e,
					kodaira: e,
					koganei: e,
					kokubunji: e,
					komae: e,
					koto: e,
					kouzushima: e,
					kunitachi: e,
					machida: e,
					meguro: e,
					minato: e,
					mitaka: e,
					mizuho: e,
					musashimurayama: e,
					musashino: e,
					nakano: e,
					nerima: e,
					ogasawara: e,
					okutama: e,
					ome: e,
					oshima: e,
					ota: e,
					setagaya: e,
					shibuya: e,
					shinagawa: e,
					shinjuku: e,
					suginami: e,
					sumida: e,
					tachikawa: e,
					taito: e,
					tama: e,
					toshima: e
				}],
				tottori: [1, {
					chizu: e,
					hino: e,
					kawahara: e,
					koge: e,
					kotoura: e,
					misasa: e,
					nanbu: e,
					nichinan: e,
					sakaiminato: e,
					tottori: e,
					wakasa: e,
					yazu: e,
					yonago: e
				}],
				toyama: [1, {
					asahi: e,
					fuchu: e,
					fukumitsu: e,
					funahashi: e,
					himi: e,
					imizu: e,
					inami: e,
					johana: e,
					kamiichi: e,
					kurobe: e,
					nakaniikawa: e,
					namerikawa: e,
					nanto: e,
					nyuzen: e,
					oyabe: e,
					taira: e,
					takaoka: e,
					tateyama: e,
					toga: e,
					tonami: e,
					toyama: e,
					unazuki: e,
					uozu: e,
					yamada: e
				}],
				wakayama: [1, {
					arida: e,
					aridagawa: e,
					gobo: e,
					hashimoto: e,
					hidaka: e,
					hirogawa: e,
					inami: e,
					iwade: e,
					kainan: e,
					kamitonda: e,
					katsuragi: e,
					kimino: e,
					kinokawa: e,
					kitayama: e,
					koya: e,
					koza: e,
					kozagawa: e,
					kudoyama: e,
					kushimoto: e,
					mihama: e,
					misato: e,
					nachikatsuura: e,
					shingu: e,
					shirahama: e,
					taiji: e,
					tanabe: e,
					wakayama: e,
					yuasa: e,
					yura: e
				}],
				yamagata: [1, {
					asahi: e,
					funagata: e,
					higashine: e,
					iide: e,
					kahoku: e,
					kaminoyama: e,
					kaneyama: e,
					kawanishi: e,
					mamurogawa: e,
					mikawa: e,
					murayama: e,
					nagai: e,
					nakayama: e,
					nanyo: e,
					nishikawa: e,
					obanazawa: e,
					oe: e,
					oguni: e,
					ohkura: e,
					oishida: e,
					sagae: e,
					sakata: e,
					sakegawa: e,
					shinjo: e,
					shirataka: e,
					shonai: e,
					takahata: e,
					tendo: e,
					tozawa: e,
					tsuruoka: e,
					yamagata: e,
					yamanobe: e,
					yonezawa: e,
					yuza: e
				}],
				yamaguchi: [1, {
					abu: e,
					hagi: e,
					hikari: e,
					hofu: e,
					iwakuni: e,
					kudamatsu: e,
					mitou: e,
					nagato: e,
					oshima: e,
					shimonoseki: e,
					shunan: e,
					tabuse: e,
					tokuyama: e,
					toyota: e,
					ube: e,
					yuu: e
				}],
				yamanashi: [1, {
					chuo: e,
					doshi: e,
					fuefuki: e,
					fujikawa: e,
					fujikawaguchiko: e,
					fujiyoshida: e,
					hayakawa: e,
					hokuto: e,
					ichikawamisato: e,
					kai: e,
					kofu: e,
					koshu: e,
					kosuge: e,
					"minami-alps": e,
					minobu: e,
					nakamichi: e,
					nanbu: e,
					narusawa: e,
					nirasaki: e,
					nishikatsura: e,
					oshino: e,
					otsuki: e,
					showa: e,
					tabayama: e,
					tsuru: e,
					uenohara: e,
					yamanakako: e,
					yamanashi: e
				}],
				"xn--ehqz56n": e,
				三重: e,
				"xn--1lqs03n": e,
				京都: e,
				"xn--qqqt11m": e,
				佐賀: e,
				"xn--f6qx53a": e,
				兵庫: e,
				"xn--djrs72d6uy": e,
				北海道: e,
				"xn--mkru45i": e,
				千葉: e,
				"xn--0trq7p7nn": e,
				和歌山: e,
				"xn--5js045d": e,
				埼玉: e,
				"xn--kbrq7o": e,
				大分: e,
				"xn--pssu33l": e,
				大阪: e,
				"xn--ntsq17g": e,
				奈良: e,
				"xn--uisz3g": e,
				宮城: e,
				"xn--6btw5a": e,
				宮崎: e,
				"xn--1ctwo": e,
				富山: e,
				"xn--6orx2r": e,
				山口: e,
				"xn--rht61e": e,
				山形: e,
				"xn--rht27z": e,
				山梨: e,
				"xn--nit225k": e,
				岐阜: e,
				"xn--rht3d": e,
				岡山: e,
				"xn--djty4k": e,
				岩手: e,
				"xn--klty5x": e,
				島根: e,
				"xn--kltx9a": e,
				広島: e,
				"xn--kltp7d": e,
				徳島: e,
				"xn--c3s14m": e,
				愛媛: e,
				"xn--vgu402c": e,
				愛知: e,
				"xn--efvn9s": e,
				新潟: e,
				"xn--1lqs71d": e,
				東京: e,
				"xn--4pvxs": e,
				栃木: e,
				"xn--uuwu58a": e,
				沖縄: e,
				"xn--zbx025d": e,
				滋賀: e,
				"xn--8pvr4u": e,
				熊本: e,
				"xn--5rtp49c": e,
				石川: e,
				"xn--ntso0iqx3a": e,
				神奈川: e,
				"xn--elqq16h": e,
				福井: e,
				"xn--4it168d": e,
				福岡: e,
				"xn--klt787d": e,
				福島: e,
				"xn--rny31h": e,
				秋田: e,
				"xn--7t0a264c": e,
				群馬: e,
				"xn--uist22h": e,
				茨城: e,
				"xn--8ltr62k": e,
				長崎: e,
				"xn--2m4a15e": e,
				長野: e,
				"xn--32vp30h": e,
				青森: e,
				"xn--4it797k": e,
				静岡: e,
				"xn--5rtq34k": e,
				香川: e,
				"xn--k7yn95e": e,
				高知: e,
				"xn--tor131o": e,
				鳥取: e,
				"xn--d5qv7z876c": e,
				鹿児島: e,
				kawasaki: h,
				kitakyushu: h,
				kobe: h,
				nagoya: h,
				sapporo: h,
				sendai: h,
				yokohama: h,
				buyshop: t,
				fashionstore: t,
				handcrafted: t,
				kawaiishop: t,
				supersale: t,
				theshop: t,
				"0am": t,
				"0g0": t,
				"0j0": t,
				"0t0": t,
				mydns: t,
				pgw: t,
				wjg: t,
				usercontent: t,
				angry: t,
				babyblue: t,
				babymilk: t,
				backdrop: t,
				bambina: t,
				bitter: t,
				blush: t,
				boo: t,
				boy: t,
				boyfriend: t,
				but: t,
				candypop: t,
				capoo: t,
				catfood: t,
				cheap: t,
				chicappa: t,
				chillout: t,
				chips: t,
				chowder: t,
				chu: t,
				ciao: t,
				cocotte: t,
				coolblog: t,
				cranky: t,
				cutegirl: t,
				daa: t,
				deca: t,
				deci: t,
				digick: t,
				egoism: t,
				fakefur: t,
				fem: t,
				flier: t,
				floppy: t,
				fool: t,
				frenchkiss: t,
				girlfriend: t,
				girly: t,
				gloomy: t,
				gonna: t,
				greater: t,
				hacca: t,
				heavy: t,
				her: t,
				hiho: t,
				hippy: t,
				holy: t,
				hungry: t,
				icurus: t,
				itigo: t,
				jellybean: t,
				kikirara: t,
				kill: t,
				kilo: t,
				kuron: t,
				littlestar: t,
				lolipopmc: t,
				lolitapunk: t,
				lomo: t,
				lovepop: t,
				lovesick: t,
				main: t,
				mods: t,
				mond: t,
				mongolian: t,
				moo: t,
				namaste: t,
				nikita: t,
				nobushi: t,
				noor: t,
				oops: t,
				parallel: t,
				parasite: t,
				pecori: t,
				peewee: t,
				penne: t,
				pepper: t,
				perma: t,
				pigboat: t,
				pinoko: t,
				punyu: t,
				pupu: t,
				pussycat: t,
				pya: t,
				raindrop: t,
				readymade: t,
				sadist: t,
				schoolbus: t,
				secret: t,
				staba: t,
				stripper: t,
				sub: t,
				sunnyday: t,
				thick: t,
				tonkotsu: t,
				under: t,
				upper: t,
				velvet: t,
				verse: t,
				versus: t,
				vivian: t,
				watson: t,
				weblike: t,
				whitesnow: t,
				zombie: t,
				hateblo: t,
				hatenablog: t,
				hatenadiary: t,
				"2-d": t,
				bona: t,
				crap: t,
				daynight: t,
				eek: t,
				flop: t,
				halfmoon: t,
				jeez: t,
				matrix: t,
				mimoza: t,
				netgamers: t,
				nyanta: t,
				o0o0: t,
				rdy: t,
				rgr: t,
				rulez: t,
				sakurastorage: [0, {
					isk01: pe,
					isk02: pe
				}],
				saloon: t,
				sblo: t,
				skr: t,
				tank: t,
				"uh-oh": t,
				undo: t,
				webaccel: [0, {
					rs: t,
					user: t
				}],
				websozai: t,
				xii: t
			}],
			ke: [1, {
				ac: e,
				co: e,
				go: e,
				info: e,
				me: e,
				mobi: e,
				ne: e,
				or: e,
				sc: e
			}],
			kg: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				us: t
			}],
			kh: h,
			ki: R,
			km: [1, {
				ass: e,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				nom: e,
				org: e,
				prd: e,
				tm: e,
				asso: e,
				coop: e,
				gouv: e,
				medecin: e,
				notaires: e,
				pharmaciens: e,
				presse: e,
				veterinaire: e
			}],
			kn: [1, {
				edu: e,
				gov: e,
				net: e,
				org: e
			}],
			kp: [1, {
				com: e,
				edu: e,
				gov: e,
				org: e,
				rep: e,
				tra: e
			}],
			kr: [1, {
				ac: e,
				ai: e,
				co: e,
				es: e,
				go: e,
				hs: e,
				io: e,
				it: e,
				kg: e,
				me: e,
				mil: e,
				ms: e,
				ne: e,
				or: e,
				pe: e,
				re: e,
				sc: e,
				busan: e,
				chungbuk: e,
				chungnam: e,
				daegu: e,
				daejeon: e,
				gangwon: e,
				gwangju: e,
				gyeongbuk: e,
				gyeonggi: e,
				gyeongnam: e,
				incheon: e,
				jeju: e,
				jeonbuk: e,
				jeonnam: e,
				seoul: e,
				ulsan: e,
				c01: t,
				"eliv-dns": t
			}],
			kw: [1, {
				com: e,
				edu: e,
				emb: e,
				gov: e,
				ind: e,
				net: e,
				org: e
			}],
			ky: P,
			kz: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				jcloud: t
			}],
			la: [1, {
				com: e,
				edu: e,
				gov: e,
				info: e,
				int: e,
				net: e,
				org: e,
				per: e,
				bnr: t
			}],
			lb: n,
			lc: [1, {
				co: e,
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				oy: t
			}],
			li: e,
			lk: [1, {
				ac: e,
				assn: e,
				com: e,
				edu: e,
				gov: e,
				grp: e,
				hotel: e,
				int: e,
				ltd: e,
				net: e,
				ngo: e,
				org: e,
				sch: e,
				soc: e,
				web: e
			}],
			lr: n,
			ls: [1, {
				ac: e,
				biz: e,
				co: e,
				edu: e,
				gov: e,
				info: e,
				net: e,
				org: e,
				sc: e
			}],
			lt: c,
			lu: [1, { "123website": t }],
			lv: [1, {
				asn: e,
				com: e,
				conf: e,
				edu: e,
				gov: e,
				id: e,
				mil: e,
				net: e,
				org: e
			}],
			ly: [1, {
				com: e,
				edu: e,
				gov: e,
				id: e,
				med: e,
				net: e,
				org: e,
				plc: e,
				sch: e
			}],
			ma: [1, {
				ac: e,
				co: e,
				gov: e,
				net: e,
				org: e,
				press: e
			}],
			mc: [1, {
				asso: e,
				tm: e
			}],
			md: [1, { ir: t }],
			me: [1, {
				ac: e,
				co: e,
				edu: e,
				gov: e,
				its: e,
				net: e,
				org: e,
				priv: e,
				c66: t,
				craft: t,
				edgestack: t,
				filegear: t,
				glitch: t,
				"filegear-sg": t,
				lohmus: t,
				barsy: t,
				mcdir: t,
				brasilia: t,
				ddns: t,
				dnsfor: t,
				hopto: t,
				loginto: t,
				noip: t,
				webhop: t,
				soundcast: t,
				tcp4: t,
				vp4: t,
				diskstation: t,
				dscloud: t,
				i234: t,
				myds: t,
				synology: t,
				transip: N,
				nohost: t
			}],
			mg: [1, {
				co: e,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				nom: e,
				org: e,
				prd: e
			}],
			mh: e,
			mil: e,
			mk: [1, {
				com: e,
				edu: e,
				gov: e,
				inf: e,
				name: e,
				net: e,
				org: e
			}],
			ml: [1, {
				ac: e,
				art: e,
				asso: e,
				com: e,
				edu: e,
				gouv: e,
				gov: e,
				info: e,
				inst: e,
				net: e,
				org: e,
				pr: e,
				presse: e
			}],
			mm: h,
			mn: [1, {
				edu: e,
				gov: e,
				org: e,
				nyc: t
			}],
			mo: n,
			mobi: [1, {
				barsy: t,
				dscloud: t
			}],
			mp: [1, { ju: t }],
			mq: e,
			mr: c,
			ms: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				minisite: t
			}],
			mt: P,
			mu: [1, {
				ac: e,
				co: e,
				com: e,
				gov: e,
				net: e,
				or: e,
				org: e
			}],
			museum: e,
			mv: [1, {
				aero: e,
				biz: e,
				com: e,
				coop: e,
				edu: e,
				gov: e,
				info: e,
				int: e,
				mil: e,
				museum: e,
				name: e,
				net: e,
				org: e,
				pro: e
			}],
			mw: [1, {
				ac: e,
				biz: e,
				co: e,
				com: e,
				coop: e,
				edu: e,
				gov: e,
				int: e,
				net: e,
				org: e
			}],
			mx: [1, {
				com: e,
				edu: e,
				gob: e,
				net: e,
				org: e
			}],
			my: [1, {
				biz: e,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				name: e,
				net: e,
				org: e
			}],
			mz: [1, {
				ac: e,
				adv: e,
				co: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e
			}],
			na: [1, {
				alt: e,
				co: e,
				com: e,
				gov: e,
				net: e,
				org: e
			}],
			name: [1, {
				her: he,
				his: he
			}],
			nc: [1, {
				asso: e,
				nom: e
			}],
			ne: e,
			net: [1, {
				adobeaemcloud: t,
				"adobeio-static": t,
				adobeioruntime: t,
				akadns: t,
				akamai: t,
				"akamai-staging": t,
				akamaiedge: t,
				"akamaiedge-staging": t,
				akamaihd: t,
				"akamaihd-staging": t,
				akamaiorigin: t,
				"akamaiorigin-staging": t,
				akamaized: t,
				"akamaized-staging": t,
				edgekey: t,
				"edgekey-staging": t,
				edgesuite: t,
				"edgesuite-staging": t,
				alwaysdata: t,
				myamaze: t,
				cloudfront: t,
				appudo: t,
				"atlassian-dev": [0, { prod: L }],
				myfritz: t,
				onavstack: t,
				shopselect: t,
				blackbaudcdn: t,
				boomla: t,
				bplaced: t,
				square7: t,
				cdn77: [0, { r: t }],
				"cdn77-ssl": t,
				gb: t,
				hu: t,
				jp: t,
				se: t,
				uk: t,
				clickrising: t,
				"ddns-ip": t,
				"dns-cloud": t,
				"dns-dynamic": t,
				cloudaccess: t,
				cloudflare: [2, { cdn: t }],
				cloudflareanycast: L,
				cloudflarecn: L,
				cloudflareglobal: L,
				ctfcloud: t,
				"feste-ip": t,
				"knx-server": t,
				"static-access": t,
				cryptonomic: i,
				dattolocal: t,
				mydatto: t,
				debian: t,
				definima: t,
				deno: t,
				"at-band-camp": t,
				blogdns: t,
				"broke-it": t,
				buyshouses: t,
				dnsalias: t,
				dnsdojo: t,
				"does-it": t,
				dontexist: t,
				dynalias: t,
				dynathome: t,
				endofinternet: t,
				"from-az": t,
				"from-co": t,
				"from-la": t,
				"from-ny": t,
				"gets-it": t,
				"ham-radio-op": t,
				homeftp: t,
				homeip: t,
				homelinux: t,
				homeunix: t,
				"in-the-band": t,
				"is-a-chef": t,
				"is-a-geek": t,
				"isa-geek": t,
				"kicks-ass": t,
				"office-on-the": t,
				podzone: t,
				"scrapper-site": t,
				selfip: t,
				"sells-it": t,
				servebbs: t,
				serveftp: t,
				thruhere: t,
				webhop: t,
				casacam: t,
				dynu: t,
				dynv6: t,
				twmail: t,
				ru: t,
				channelsdvr: [2, { u: t }],
				fastly: [0, {
					freetls: t,
					map: t,
					prod: [0, {
						a: t,
						global: t
					}],
					ssl: [0, {
						a: t,
						b: t,
						global: t
					}]
				}],
				fastlylb: [2, { map: t }],
				edgeapp: t,
				"keyword-on": t,
				"live-on": t,
				"server-on": t,
				"cdn-edges": t,
				heteml: t,
				cloudfunctions: t,
				"grafana-dev": t,
				iobb: t,
				moonscale: t,
				"in-dsl": t,
				"in-vpn": t,
				oninferno: t,
				botdash: t,
				"apps-1and1": t,
				ipifony: t,
				cloudjiffy: [2, {
					"fra1-de": t,
					"west1-us": t
				}],
				elastx: [0, {
					"jls-sto1": t,
					"jls-sto2": t,
					"jls-sto3": t
				}],
				massivegrid: [0, { paas: [0, {
					"fr-1": t,
					"lon-1": t,
					"lon-2": t,
					"ny-1": t,
					"ny-2": t,
					"sg-1": t
				}] }],
				saveincloud: [0, {
					jelastic: t,
					"nordeste-idc": t
				}],
				scaleforce: F,
				kinghost: t,
				uni5: t,
				krellian: t,
				ggff: t,
				localcert: t,
				localhostcert: t,
				localto: i,
				barsy: t,
				memset: t,
				"azure-api": t,
				"azure-mobile": t,
				azureedge: t,
				azurefd: t,
				azurestaticapps: [2, {
					1: t,
					2: t,
					3: t,
					4: t,
					5: t,
					6: t,
					7: t,
					centralus: t,
					eastasia: t,
					eastus2: t,
					westeurope: t,
					westus2: t
				}],
				azurewebsites: t,
				cloudapp: t,
				trafficmanager: t,
				windows: [0, {
					core: [0, { blob: t }],
					servicebus: t
				}],
				mynetname: [0, { sn: t }],
				routingthecloud: t,
				bounceme: t,
				ddns: t,
				"eating-organic": t,
				mydissent: t,
				myeffect: t,
				mymediapc: t,
				mypsx: t,
				mysecuritycamera: t,
				nhlfan: t,
				"no-ip": t,
				pgafan: t,
				privatizehealthinsurance: t,
				redirectme: t,
				serveblog: t,
				serveminecraft: t,
				sytes: t,
				dnsup: t,
				hicam: t,
				"now-dns": t,
				ownip: t,
				vpndns: t,
				cloudycluster: t,
				ovh: [0, {
					hosting: i,
					webpaas: i
				}],
				rackmaze: t,
				myradweb: t,
				in: t,
				"subsc-pay": t,
				squares: t,
				schokokeks: t,
				"firewall-gateway": t,
				seidat: t,
				senseering: t,
				siteleaf: t,
				mafelo: t,
				myspreadshop: t,
				"vps-host": [2, { jelastic: [0, {
					atl: t,
					njs: t,
					ric: t
				}] }],
				srcf: [0, {
					soc: t,
					user: t
				}],
				supabase: t,
				dsmynas: t,
				familyds: t,
				ts: [2, { c: i }],
				torproject: [2, { pages: t }],
				vusercontent: t,
				"reserve-online": t,
				"community-pro": t,
				meinforum: t,
				yandexcloud: [2, {
					storage: t,
					website: t
				}],
				za: t
			}],
			nf: [1, {
				arts: e,
				com: e,
				firm: e,
				info: e,
				net: e,
				other: e,
				per: e,
				rec: e,
				store: e,
				web: e
			}],
			ng: [1, {
				com: e,
				edu: e,
				gov: e,
				i: e,
				mil: e,
				mobi: e,
				name: e,
				net: e,
				org: e,
				sch: e,
				biz: [2, {
					co: t,
					dl: t,
					go: t,
					lg: t,
					on: t
				}],
				col: t,
				firm: t,
				gen: t,
				ltd: t,
				ngo: t,
				plc: t
			}],
			ni: [1, {
				ac: e,
				biz: e,
				co: e,
				com: e,
				edu: e,
				gob: e,
				in: e,
				info: e,
				int: e,
				mil: e,
				net: e,
				nom: e,
				org: e,
				web: e
			}],
			nl: [1, {
				co: t,
				"hosting-cluster": t,
				gov: t,
				khplay: t,
				"123website": t,
				myspreadshop: t,
				transurl: i,
				cistron: t,
				demon: t
			}],
			no: [1, {
				fhs: e,
				folkebibl: e,
				fylkesbibl: e,
				idrett: e,
				museum: e,
				priv: e,
				vgs: e,
				dep: e,
				herad: e,
				kommune: e,
				mil: e,
				stat: e,
				aa: B,
				ah: B,
				bu: B,
				fm: B,
				hl: B,
				hm: B,
				"jan-mayen": B,
				mr: B,
				nl: B,
				nt: B,
				of: B,
				ol: B,
				oslo: B,
				rl: B,
				sf: B,
				st: B,
				svalbard: B,
				tm: B,
				tr: B,
				va: B,
				vf: B,
				akrehamn: e,
				"xn--krehamn-dxa": e,
				åkrehamn: e,
				algard: e,
				"xn--lgrd-poac": e,
				ålgård: e,
				arna: e,
				bronnoysund: e,
				"xn--brnnysund-m8ac": e,
				brønnøysund: e,
				brumunddal: e,
				bryne: e,
				drobak: e,
				"xn--drbak-wua": e,
				drøbak: e,
				egersund: e,
				fetsund: e,
				floro: e,
				"xn--flor-jra": e,
				florø: e,
				fredrikstad: e,
				hokksund: e,
				honefoss: e,
				"xn--hnefoss-q1a": e,
				hønefoss: e,
				jessheim: e,
				jorpeland: e,
				"xn--jrpeland-54a": e,
				jørpeland: e,
				kirkenes: e,
				kopervik: e,
				krokstadelva: e,
				langevag: e,
				"xn--langevg-jxa": e,
				langevåg: e,
				leirvik: e,
				mjondalen: e,
				"xn--mjndalen-64a": e,
				mjøndalen: e,
				"mo-i-rana": e,
				mosjoen: e,
				"xn--mosjen-eya": e,
				mosjøen: e,
				nesoddtangen: e,
				orkanger: e,
				osoyro: e,
				"xn--osyro-wua": e,
				osøyro: e,
				raholt: e,
				"xn--rholt-mra": e,
				råholt: e,
				sandnessjoen: e,
				"xn--sandnessjen-ogb": e,
				sandnessjøen: e,
				skedsmokorset: e,
				slattum: e,
				spjelkavik: e,
				stathelle: e,
				stavern: e,
				stjordalshalsen: e,
				"xn--stjrdalshalsen-sqb": e,
				stjørdalshalsen: e,
				tananger: e,
				tranby: e,
				vossevangen: e,
				aarborte: e,
				aejrie: e,
				afjord: e,
				"xn--fjord-lra": e,
				åfjord: e,
				agdenes: e,
				akershus: V,
				aknoluokta: e,
				"xn--koluokta-7ya57h": e,
				ákŋoluokta: e,
				al: e,
				"xn--l-1fa": e,
				ål: e,
				alaheadju: e,
				"xn--laheadju-7ya": e,
				álaheadju: e,
				alesund: e,
				"xn--lesund-hua": e,
				ålesund: e,
				alstahaug: e,
				alta: e,
				"xn--lt-liac": e,
				áltá: e,
				alvdal: e,
				amli: e,
				"xn--mli-tla": e,
				åmli: e,
				amot: e,
				"xn--mot-tla": e,
				åmot: e,
				andasuolo: e,
				andebu: e,
				andoy: e,
				"xn--andy-ira": e,
				andøy: e,
				ardal: e,
				"xn--rdal-poa": e,
				årdal: e,
				aremark: e,
				arendal: e,
				"xn--s-1fa": e,
				ås: e,
				aseral: e,
				"xn--seral-lra": e,
				åseral: e,
				asker: e,
				askim: e,
				askoy: e,
				"xn--asky-ira": e,
				askøy: e,
				askvoll: e,
				asnes: e,
				"xn--snes-poa": e,
				åsnes: e,
				audnedaln: e,
				aukra: e,
				aure: e,
				aurland: e,
				"aurskog-holand": e,
				"xn--aurskog-hland-jnb": e,
				"aurskog-høland": e,
				austevoll: e,
				austrheim: e,
				averoy: e,
				"xn--avery-yua": e,
				averøy: e,
				badaddja: e,
				"xn--bdddj-mrabd": e,
				bådåddjå: e,
				"xn--brum-voa": e,
				bærum: e,
				bahcavuotna: e,
				"xn--bhcavuotna-s4a": e,
				báhcavuotna: e,
				bahccavuotna: e,
				"xn--bhccavuotna-k7a": e,
				báhccavuotna: e,
				baidar: e,
				"xn--bidr-5nac": e,
				báidár: e,
				bajddar: e,
				"xn--bjddar-pta": e,
				bájddar: e,
				balat: e,
				"xn--blt-elab": e,
				bálát: e,
				balestrand: e,
				ballangen: e,
				balsfjord: e,
				bamble: e,
				bardu: e,
				barum: e,
				batsfjord: e,
				"xn--btsfjord-9za": e,
				båtsfjord: e,
				bearalvahki: e,
				"xn--bearalvhki-y4a": e,
				bearalváhki: e,
				beardu: e,
				beiarn: e,
				berg: e,
				bergen: e,
				berlevag: e,
				"xn--berlevg-jxa": e,
				berlevåg: e,
				bievat: e,
				"xn--bievt-0qa": e,
				bievát: e,
				bindal: e,
				birkenes: e,
				bjarkoy: e,
				"xn--bjarky-fya": e,
				bjarkøy: e,
				bjerkreim: e,
				bjugn: e,
				bodo: e,
				"xn--bod-2na": e,
				bodø: e,
				bokn: e,
				bomlo: e,
				"xn--bmlo-gra": e,
				bømlo: e,
				bremanger: e,
				bronnoy: e,
				"xn--brnny-wuac": e,
				brønnøy: e,
				budejju: e,
				buskerud: V,
				bygland: e,
				bykle: e,
				cahcesuolo: e,
				"xn--hcesuolo-7ya35b": e,
				čáhcesuolo: e,
				davvenjarga: e,
				"xn--davvenjrga-y4a": e,
				davvenjárga: e,
				davvesiida: e,
				deatnu: e,
				dielddanuorri: e,
				divtasvuodna: e,
				divttasvuotna: e,
				donna: e,
				"xn--dnna-gra": e,
				dønna: e,
				dovre: e,
				drammen: e,
				drangedal: e,
				dyroy: e,
				"xn--dyry-ira": e,
				dyrøy: e,
				eid: e,
				eidfjord: e,
				eidsberg: e,
				eidskog: e,
				eidsvoll: e,
				eigersund: e,
				elverum: e,
				enebakk: e,
				engerdal: e,
				etne: e,
				etnedal: e,
				evenassi: e,
				"xn--eveni-0qa01ga": e,
				evenášši: e,
				evenes: e,
				"evje-og-hornnes": e,
				farsund: e,
				fauske: e,
				fedje: e,
				fet: e,
				finnoy: e,
				"xn--finny-yua": e,
				finnøy: e,
				fitjar: e,
				fjaler: e,
				fjell: e,
				fla: e,
				"xn--fl-zia": e,
				flå: e,
				flakstad: e,
				flatanger: e,
				flekkefjord: e,
				flesberg: e,
				flora: e,
				folldal: e,
				forde: e,
				"xn--frde-gra": e,
				førde: e,
				forsand: e,
				fosnes: e,
				"xn--frna-woa": e,
				fræna: e,
				frana: e,
				frei: e,
				frogn: e,
				froland: e,
				frosta: e,
				froya: e,
				"xn--frya-hra": e,
				frøya: e,
				fuoisku: e,
				fuossko: e,
				fusa: e,
				fyresdal: e,
				gaivuotna: e,
				"xn--givuotna-8ya": e,
				gáivuotna: e,
				galsa: e,
				"xn--gls-elac": e,
				gálsá: e,
				gamvik: e,
				gangaviika: e,
				"xn--ggaviika-8ya47h": e,
				gáŋgaviika: e,
				gaular: e,
				gausdal: e,
				giehtavuoatna: e,
				gildeskal: e,
				"xn--gildeskl-g0a": e,
				gildeskål: e,
				giske: e,
				gjemnes: e,
				gjerdrum: e,
				gjerstad: e,
				gjesdal: e,
				gjovik: e,
				"xn--gjvik-wua": e,
				gjøvik: e,
				gloppen: e,
				gol: e,
				gran: e,
				grane: e,
				granvin: e,
				gratangen: e,
				grimstad: e,
				grong: e,
				grue: e,
				gulen: e,
				guovdageaidnu: e,
				ha: e,
				"xn--h-2fa": e,
				hå: e,
				habmer: e,
				"xn--hbmer-xqa": e,
				hábmer: e,
				hadsel: e,
				"xn--hgebostad-g3a": e,
				hægebostad: e,
				hagebostad: e,
				halden: e,
				halsa: e,
				hamar: e,
				hamaroy: e,
				hammarfeasta: e,
				"xn--hmmrfeasta-s4ac": e,
				hámmárfeasta: e,
				hammerfest: e,
				hapmir: e,
				"xn--hpmir-xqa": e,
				hápmir: e,
				haram: e,
				hareid: e,
				harstad: e,
				hasvik: e,
				hattfjelldal: e,
				haugesund: e,
				hedmark: [0, {
					os: e,
					valer: e,
					"xn--vler-qoa": e,
					våler: e
				}],
				hemne: e,
				hemnes: e,
				hemsedal: e,
				hitra: e,
				hjartdal: e,
				hjelmeland: e,
				hobol: e,
				"xn--hobl-ira": e,
				hobøl: e,
				hof: e,
				hol: e,
				hole: e,
				holmestrand: e,
				holtalen: e,
				"xn--holtlen-hxa": e,
				holtålen: e,
				hordaland: [0, { os: e }],
				hornindal: e,
				horten: e,
				hoyanger: e,
				"xn--hyanger-q1a": e,
				høyanger: e,
				hoylandet: e,
				"xn--hylandet-54a": e,
				høylandet: e,
				hurdal: e,
				hurum: e,
				hvaler: e,
				hyllestad: e,
				ibestad: e,
				inderoy: e,
				"xn--indery-fya": e,
				inderøy: e,
				iveland: e,
				ivgu: e,
				jevnaker: e,
				jolster: e,
				"xn--jlster-bya": e,
				jølster: e,
				jondal: e,
				kafjord: e,
				"xn--kfjord-iua": e,
				kåfjord: e,
				karasjohka: e,
				"xn--krjohka-hwab49j": e,
				kárášjohka: e,
				karasjok: e,
				karlsoy: e,
				karmoy: e,
				"xn--karmy-yua": e,
				karmøy: e,
				kautokeino: e,
				klabu: e,
				"xn--klbu-woa": e,
				klæbu: e,
				klepp: e,
				kongsberg: e,
				kongsvinger: e,
				kraanghke: e,
				"xn--kranghke-b0a": e,
				kråanghke: e,
				kragero: e,
				"xn--krager-gya": e,
				kragerø: e,
				kristiansand: e,
				kristiansund: e,
				krodsherad: e,
				"xn--krdsherad-m8a": e,
				krødsherad: e,
				"xn--kvfjord-nxa": e,
				kvæfjord: e,
				"xn--kvnangen-k0a": e,
				kvænangen: e,
				kvafjord: e,
				kvalsund: e,
				kvam: e,
				kvanangen: e,
				kvinesdal: e,
				kvinnherad: e,
				kviteseid: e,
				kvitsoy: e,
				"xn--kvitsy-fya": e,
				kvitsøy: e,
				laakesvuemie: e,
				"xn--lrdal-sra": e,
				lærdal: e,
				lahppi: e,
				"xn--lhppi-xqa": e,
				láhppi: e,
				lardal: e,
				larvik: e,
				lavagis: e,
				lavangen: e,
				leangaviika: e,
				"xn--leagaviika-52b": e,
				leaŋgaviika: e,
				lebesby: e,
				leikanger: e,
				leirfjord: e,
				leka: e,
				leksvik: e,
				lenvik: e,
				lerdal: e,
				lesja: e,
				levanger: e,
				lier: e,
				lierne: e,
				lillehammer: e,
				lillesand: e,
				lindas: e,
				"xn--linds-pra": e,
				lindås: e,
				lindesnes: e,
				loabat: e,
				"xn--loabt-0qa": e,
				loabát: e,
				lodingen: e,
				"xn--ldingen-q1a": e,
				lødingen: e,
				lom: e,
				loppa: e,
				lorenskog: e,
				"xn--lrenskog-54a": e,
				lørenskog: e,
				loten: e,
				"xn--lten-gra": e,
				løten: e,
				lund: e,
				lunner: e,
				luroy: e,
				"xn--lury-ira": e,
				lurøy: e,
				luster: e,
				lyngdal: e,
				lyngen: e,
				malatvuopmi: e,
				"xn--mlatvuopmi-s4a": e,
				málatvuopmi: e,
				malselv: e,
				"xn--mlselv-iua": e,
				målselv: e,
				malvik: e,
				mandal: e,
				marker: e,
				marnardal: e,
				masfjorden: e,
				masoy: e,
				"xn--msy-ula0h": e,
				måsøy: e,
				"matta-varjjat": e,
				"xn--mtta-vrjjat-k7af": e,
				"mátta-várjjat": e,
				meland: e,
				meldal: e,
				melhus: e,
				meloy: e,
				"xn--mely-ira": e,
				meløy: e,
				meraker: e,
				"xn--merker-kua": e,
				meråker: e,
				midsund: e,
				"midtre-gauldal": e,
				moareke: e,
				"xn--moreke-jua": e,
				moåreke: e,
				modalen: e,
				modum: e,
				molde: e,
				"more-og-romsdal": [0, {
					heroy: e,
					sande: e
				}],
				"xn--mre-og-romsdal-qqb": [0, {
					"xn--hery-ira": e,
					sande: e
				}],
				"møre-og-romsdal": [0, {
					herøy: e,
					sande: e
				}],
				moskenes: e,
				moss: e,
				mosvik: e,
				muosat: e,
				"xn--muost-0qa": e,
				muosát: e,
				naamesjevuemie: e,
				"xn--nmesjevuemie-tcba": e,
				nååmesjevuemie: e,
				"xn--nry-yla5g": e,
				nærøy: e,
				namdalseid: e,
				namsos: e,
				namsskogan: e,
				nannestad: e,
				naroy: e,
				narviika: e,
				narvik: e,
				naustdal: e,
				navuotna: e,
				"xn--nvuotna-hwa": e,
				návuotna: e,
				"nedre-eiker": e,
				nesna: e,
				nesodden: e,
				nesseby: e,
				nesset: e,
				nissedal: e,
				nittedal: e,
				"nord-aurdal": e,
				"nord-fron": e,
				"nord-odal": e,
				norddal: e,
				nordkapp: e,
				nordland: [0, {
					bo: e,
					"xn--b-5ga": e,
					bø: e,
					heroy: e,
					"xn--hery-ira": e,
					herøy: e
				}],
				"nordre-land": e,
				nordreisa: e,
				"nore-og-uvdal": e,
				notodden: e,
				notteroy: e,
				"xn--nttery-byae": e,
				nøtterøy: e,
				odda: e,
				oksnes: e,
				"xn--ksnes-uua": e,
				øksnes: e,
				omasvuotna: e,
				oppdal: e,
				oppegard: e,
				"xn--oppegrd-ixa": e,
				oppegård: e,
				orkdal: e,
				orland: e,
				"xn--rland-uua": e,
				ørland: e,
				orskog: e,
				"xn--rskog-uua": e,
				ørskog: e,
				orsta: e,
				"xn--rsta-fra": e,
				ørsta: e,
				osen: e,
				osteroy: e,
				"xn--ostery-fya": e,
				osterøy: e,
				ostfold: [0, { valer: e }],
				"xn--stfold-9xa": [0, { "xn--vler-qoa": e }],
				østfold: [0, { våler: e }],
				"ostre-toten": e,
				"xn--stre-toten-zcb": e,
				"østre-toten": e,
				overhalla: e,
				"ovre-eiker": e,
				"xn--vre-eiker-k8a": e,
				"øvre-eiker": e,
				oyer: e,
				"xn--yer-zna": e,
				øyer: e,
				oygarden: e,
				"xn--ygarden-p1a": e,
				øygarden: e,
				"oystre-slidre": e,
				"xn--ystre-slidre-ujb": e,
				"øystre-slidre": e,
				porsanger: e,
				porsangu: e,
				"xn--porsgu-sta26f": e,
				porsáŋgu: e,
				porsgrunn: e,
				rade: e,
				"xn--rde-ula": e,
				råde: e,
				radoy: e,
				"xn--rady-ira": e,
				radøy: e,
				"xn--rlingen-mxa": e,
				rælingen: e,
				rahkkeravju: e,
				"xn--rhkkervju-01af": e,
				ráhkkerávju: e,
				raisa: e,
				"xn--risa-5na": e,
				ráisa: e,
				rakkestad: e,
				ralingen: e,
				rana: e,
				randaberg: e,
				rauma: e,
				rendalen: e,
				rennebu: e,
				rennesoy: e,
				"xn--rennesy-v1a": e,
				rennesøy: e,
				rindal: e,
				ringebu: e,
				ringerike: e,
				ringsaker: e,
				risor: e,
				"xn--risr-ira": e,
				risør: e,
				rissa: e,
				roan: e,
				rodoy: e,
				"xn--rdy-0nab": e,
				rødøy: e,
				rollag: e,
				romsa: e,
				romskog: e,
				"xn--rmskog-bya": e,
				rømskog: e,
				roros: e,
				"xn--rros-gra": e,
				røros: e,
				rost: e,
				"xn--rst-0na": e,
				røst: e,
				royken: e,
				"xn--ryken-vua": e,
				røyken: e,
				royrvik: e,
				"xn--ryrvik-bya": e,
				røyrvik: e,
				ruovat: e,
				rygge: e,
				salangen: e,
				salat: e,
				"xn--slat-5na": e,
				sálat: e,
				"xn--slt-elab": e,
				sálát: e,
				saltdal: e,
				samnanger: e,
				sandefjord: e,
				sandnes: e,
				sandoy: e,
				"xn--sandy-yua": e,
				sandøy: e,
				sarpsborg: e,
				sauda: e,
				sauherad: e,
				sel: e,
				selbu: e,
				selje: e,
				seljord: e,
				siellak: e,
				sigdal: e,
				siljan: e,
				sirdal: e,
				skanit: e,
				"xn--sknit-yqa": e,
				skánit: e,
				skanland: e,
				"xn--sknland-fxa": e,
				skånland: e,
				skaun: e,
				skedsmo: e,
				ski: e,
				skien: e,
				skierva: e,
				"xn--skierv-uta": e,
				skiervá: e,
				skiptvet: e,
				skjak: e,
				"xn--skjk-soa": e,
				skjåk: e,
				skjervoy: e,
				"xn--skjervy-v1a": e,
				skjervøy: e,
				skodje: e,
				smola: e,
				"xn--smla-hra": e,
				smøla: e,
				snaase: e,
				"xn--snase-nra": e,
				snåase: e,
				snasa: e,
				"xn--snsa-roa": e,
				snåsa: e,
				snillfjord: e,
				snoasa: e,
				sogndal: e,
				sogne: e,
				"xn--sgne-gra": e,
				søgne: e,
				sokndal: e,
				sola: e,
				solund: e,
				somna: e,
				"xn--smna-gra": e,
				sømna: e,
				"sondre-land": e,
				"xn--sndre-land-0cb": e,
				"søndre-land": e,
				songdalen: e,
				"sor-aurdal": e,
				"xn--sr-aurdal-l8a": e,
				"sør-aurdal": e,
				"sor-fron": e,
				"xn--sr-fron-q1a": e,
				"sør-fron": e,
				"sor-odal": e,
				"xn--sr-odal-q1a": e,
				"sør-odal": e,
				"sor-varanger": e,
				"xn--sr-varanger-ggb": e,
				"sør-varanger": e,
				sorfold: e,
				"xn--srfold-bya": e,
				sørfold: e,
				sorreisa: e,
				"xn--srreisa-q1a": e,
				sørreisa: e,
				sortland: e,
				sorum: e,
				"xn--srum-gra": e,
				sørum: e,
				spydeberg: e,
				stange: e,
				stavanger: e,
				steigen: e,
				steinkjer: e,
				stjordal: e,
				"xn--stjrdal-s1a": e,
				stjørdal: e,
				stokke: e,
				"stor-elvdal": e,
				stord: e,
				stordal: e,
				storfjord: e,
				strand: e,
				stranda: e,
				stryn: e,
				sula: e,
				suldal: e,
				sund: e,
				sunndal: e,
				surnadal: e,
				sveio: e,
				svelvik: e,
				sykkylven: e,
				tana: e,
				telemark: [0, {
					bo: e,
					"xn--b-5ga": e,
					bø: e
				}],
				time: e,
				tingvoll: e,
				tinn: e,
				tjeldsund: e,
				tjome: e,
				"xn--tjme-hra": e,
				tjøme: e,
				tokke: e,
				tolga: e,
				tonsberg: e,
				"xn--tnsberg-q1a": e,
				tønsberg: e,
				torsken: e,
				"xn--trna-woa": e,
				træna: e,
				trana: e,
				tranoy: e,
				"xn--trany-yua": e,
				tranøy: e,
				troandin: e,
				trogstad: e,
				"xn--trgstad-r1a": e,
				trøgstad: e,
				tromsa: e,
				tromso: e,
				"xn--troms-zua": e,
				tromsø: e,
				trondheim: e,
				trysil: e,
				tvedestrand: e,
				tydal: e,
				tynset: e,
				tysfjord: e,
				tysnes: e,
				"xn--tysvr-vra": e,
				tysvær: e,
				tysvar: e,
				ullensaker: e,
				ullensvang: e,
				ulvik: e,
				unjarga: e,
				"xn--unjrga-rta": e,
				unjárga: e,
				utsira: e,
				vaapste: e,
				vadso: e,
				"xn--vads-jra": e,
				vadsø: e,
				"xn--vry-yla5g": e,
				værøy: e,
				vaga: e,
				"xn--vg-yiab": e,
				vågå: e,
				vagan: e,
				"xn--vgan-qoa": e,
				vågan: e,
				vagsoy: e,
				"xn--vgsy-qoa0j": e,
				vågsøy: e,
				vaksdal: e,
				valle: e,
				vang: e,
				vanylven: e,
				vardo: e,
				"xn--vard-jra": e,
				vardø: e,
				varggat: e,
				"xn--vrggt-xqad": e,
				várggát: e,
				varoy: e,
				vefsn: e,
				vega: e,
				vegarshei: e,
				"xn--vegrshei-c0a": e,
				vegårshei: e,
				vennesla: e,
				verdal: e,
				verran: e,
				vestby: e,
				vestfold: [0, { sande: e }],
				vestnes: e,
				"vestre-slidre": e,
				"vestre-toten": e,
				vestvagoy: e,
				"xn--vestvgy-ixa6o": e,
				vestvågøy: e,
				vevelstad: e,
				vik: e,
				vikna: e,
				vindafjord: e,
				voagat: e,
				volda: e,
				voss: e,
				co: t,
				"123hjemmeside": t,
				myspreadshop: t
			}],
			np: h,
			nr: R,
			nu: [1, {
				merseine: t,
				mine: t,
				shacknet: t,
				enterprisecloud: t
			}],
			nz: [1, {
				ac: e,
				co: e,
				cri: e,
				geek: e,
				gen: e,
				govt: e,
				health: e,
				iwi: e,
				kiwi: e,
				maori: e,
				"xn--mori-qsa": e,
				māori: e,
				mil: e,
				net: e,
				org: e,
				parliament: e,
				school: e,
				cloudns: t
			}],
			om: [1, {
				co: e,
				com: e,
				edu: e,
				gov: e,
				med: e,
				museum: e,
				net: e,
				org: e,
				pro: e
			}],
			onion: e,
			org: [1, {
				altervista: t,
				pimienta: t,
				poivron: t,
				potager: t,
				sweetpepper: t,
				cdn77: [0, {
					c: t,
					rsc: t
				}],
				"cdn77-secure": [0, { origin: [0, { ssl: t }] }],
				ae: t,
				cloudns: t,
				"ip-dynamic": t,
				ddnss: t,
				dpdns: t,
				duckdns: t,
				tunk: t,
				blogdns: t,
				blogsite: t,
				boldlygoingnowhere: t,
				dnsalias: t,
				dnsdojo: t,
				doesntexist: t,
				dontexist: t,
				doomdns: t,
				dvrdns: t,
				dynalias: t,
				dyndns: [2, {
					go: t,
					home: t
				}],
				endofinternet: t,
				endoftheinternet: t,
				"from-me": t,
				"game-host": t,
				gotdns: t,
				"hobby-site": t,
				homedns: t,
				homeftp: t,
				homelinux: t,
				homeunix: t,
				"is-a-bruinsfan": t,
				"is-a-candidate": t,
				"is-a-celticsfan": t,
				"is-a-chef": t,
				"is-a-geek": t,
				"is-a-knight": t,
				"is-a-linux-user": t,
				"is-a-patsfan": t,
				"is-a-soxfan": t,
				"is-found": t,
				"is-lost": t,
				"is-saved": t,
				"is-very-bad": t,
				"is-very-evil": t,
				"is-very-good": t,
				"is-very-nice": t,
				"is-very-sweet": t,
				"isa-geek": t,
				"kicks-ass": t,
				misconfused: t,
				podzone: t,
				readmyblog: t,
				selfip: t,
				sellsyourhome: t,
				servebbs: t,
				serveftp: t,
				servegame: t,
				"stuff-4-sale": t,
				webhop: t,
				accesscam: t,
				camdvr: t,
				freeddns: t,
				mywire: t,
				webredirect: t,
				twmail: t,
				eu: [2, {
					al: t,
					asso: t,
					at: t,
					au: t,
					be: t,
					bg: t,
					ca: t,
					cd: t,
					ch: t,
					cn: t,
					cy: t,
					cz: t,
					de: t,
					dk: t,
					edu: t,
					ee: t,
					es: t,
					fi: t,
					fr: t,
					gr: t,
					hr: t,
					hu: t,
					ie: t,
					il: t,
					in: t,
					int: t,
					is: t,
					it: t,
					jp: t,
					kr: t,
					lt: t,
					lu: t,
					lv: t,
					me: t,
					mk: t,
					mt: t,
					my: t,
					net: t,
					ng: t,
					nl: t,
					no: t,
					nz: t,
					pl: t,
					pt: t,
					ro: t,
					ru: t,
					se: t,
					si: t,
					sk: t,
					tr: t,
					uk: t,
					us: t
				}],
				fedorainfracloud: t,
				fedorapeople: t,
				fedoraproject: [0, {
					cloud: t,
					os: M,
					stg: [0, { os: M }]
				}],
				freedesktop: t,
				hatenadiary: t,
				hepforge: t,
				"in-dsl": t,
				"in-vpn": t,
				js: t,
				barsy: t,
				mayfirst: t,
				routingthecloud: t,
				bmoattachments: t,
				"cable-modem": t,
				collegefan: t,
				couchpotatofries: t,
				hopto: t,
				mlbfan: t,
				myftp: t,
				mysecuritycamera: t,
				nflfan: t,
				"no-ip": t,
				"read-books": t,
				ufcfan: t,
				zapto: t,
				dynserv: t,
				"now-dns": t,
				"is-local": t,
				httpbin: t,
				pubtls: t,
				jpn: t,
				"my-firewall": t,
				myfirewall: t,
				spdns: t,
				"small-web": t,
				dsmynas: t,
				familyds: t,
				teckids: pe,
				tuxfamily: t,
				diskstation: t,
				hk: t,
				us: t,
				toolforge: t,
				wmcloud: t,
				wmflabs: t,
				za: t
			}],
			pa: [1, {
				abo: e,
				ac: e,
				com: e,
				edu: e,
				gob: e,
				ing: e,
				med: e,
				net: e,
				nom: e,
				org: e,
				sld: e
			}],
			pe: [1, {
				com: e,
				edu: e,
				gob: e,
				mil: e,
				net: e,
				nom: e,
				org: e
			}],
			pf: [1, {
				com: e,
				edu: e,
				org: e
			}],
			pg: h,
			ph: [1, {
				com: e,
				edu: e,
				gov: e,
				i: e,
				mil: e,
				net: e,
				ngo: e,
				org: e,
				cloudns: t
			}],
			pk: [1, {
				ac: e,
				biz: e,
				com: e,
				edu: e,
				fam: e,
				gkp: e,
				gob: e,
				gog: e,
				gok: e,
				gop: e,
				gos: e,
				gov: e,
				net: e,
				org: e,
				web: e
			}],
			pl: [1, {
				com: e,
				net: e,
				org: e,
				agro: e,
				aid: e,
				atm: e,
				auto: e,
				biz: e,
				edu: e,
				gmina: e,
				gsm: e,
				info: e,
				mail: e,
				media: e,
				miasta: e,
				mil: e,
				nieruchomosci: e,
				nom: e,
				pc: e,
				powiat: e,
				priv: e,
				realestate: e,
				rel: e,
				sex: e,
				shop: e,
				sklep: e,
				sos: e,
				szkola: e,
				targi: e,
				tm: e,
				tourism: e,
				travel: e,
				turystyka: e,
				gov: [1, {
					ap: e,
					griw: e,
					ic: e,
					is: e,
					kmpsp: e,
					konsulat: e,
					kppsp: e,
					kwp: e,
					kwpsp: e,
					mup: e,
					mw: e,
					oia: e,
					oirm: e,
					oke: e,
					oow: e,
					oschr: e,
					oum: e,
					pa: e,
					pinb: e,
					piw: e,
					po: e,
					pr: e,
					psp: e,
					psse: e,
					pup: e,
					rzgw: e,
					sa: e,
					sdn: e,
					sko: e,
					so: e,
					sr: e,
					starostwo: e,
					ug: e,
					ugim: e,
					um: e,
					umig: e,
					upow: e,
					uppo: e,
					us: e,
					uw: e,
					uzs: e,
					wif: e,
					wiih: e,
					winb: e,
					wios: e,
					witd: e,
					wiw: e,
					wkz: e,
					wsa: e,
					wskr: e,
					wsse: e,
					wuoz: e,
					wzmiuw: e,
					zp: e,
					zpisdn: e
				}],
				augustow: e,
				"babia-gora": e,
				bedzin: e,
				beskidy: e,
				bialowieza: e,
				bialystok: e,
				bielawa: e,
				bieszczady: e,
				boleslawiec: e,
				bydgoszcz: e,
				bytom: e,
				cieszyn: e,
				czeladz: e,
				czest: e,
				dlugoleka: e,
				elblag: e,
				elk: e,
				glogow: e,
				gniezno: e,
				gorlice: e,
				grajewo: e,
				ilawa: e,
				jaworzno: e,
				"jelenia-gora": e,
				jgora: e,
				kalisz: e,
				karpacz: e,
				kartuzy: e,
				kaszuby: e,
				katowice: e,
				"kazimierz-dolny": e,
				kepno: e,
				ketrzyn: e,
				klodzko: e,
				kobierzyce: e,
				kolobrzeg: e,
				konin: e,
				konskowola: e,
				kutno: e,
				lapy: e,
				lebork: e,
				legnica: e,
				lezajsk: e,
				limanowa: e,
				lomza: e,
				lowicz: e,
				lubin: e,
				lukow: e,
				malbork: e,
				malopolska: e,
				mazowsze: e,
				mazury: e,
				mielec: e,
				mielno: e,
				mragowo: e,
				naklo: e,
				nowaruda: e,
				nysa: e,
				olawa: e,
				olecko: e,
				olkusz: e,
				olsztyn: e,
				opoczno: e,
				opole: e,
				ostroda: e,
				ostroleka: e,
				ostrowiec: e,
				ostrowwlkp: e,
				pila: e,
				pisz: e,
				podhale: e,
				podlasie: e,
				polkowice: e,
				pomorskie: e,
				pomorze: e,
				prochowice: e,
				pruszkow: e,
				przeworsk: e,
				pulawy: e,
				radom: e,
				"rawa-maz": e,
				rybnik: e,
				rzeszow: e,
				sanok: e,
				sejny: e,
				skoczow: e,
				slask: e,
				slupsk: e,
				sosnowiec: e,
				"stalowa-wola": e,
				starachowice: e,
				stargard: e,
				suwalki: e,
				swidnica: e,
				swiebodzin: e,
				swinoujscie: e,
				szczecin: e,
				szczytno: e,
				tarnobrzeg: e,
				tgory: e,
				turek: e,
				tychy: e,
				ustka: e,
				walbrzych: e,
				warmia: e,
				warszawa: e,
				waw: e,
				wegrow: e,
				wielun: e,
				wlocl: e,
				wloclawek: e,
				wodzislaw: e,
				wolomin: e,
				wroclaw: e,
				zachpomor: e,
				zagan: e,
				zarow: e,
				zgora: e,
				zgorzelec: e,
				art: t,
				gliwice: t,
				krakow: t,
				poznan: t,
				wroc: t,
				zakopane: t,
				beep: t,
				"ecommerce-shop": t,
				cfolks: t,
				dfirma: t,
				dkonto: t,
				you2: t,
				shoparena: t,
				homesklep: t,
				sdscloud: t,
				unicloud: t,
				lodz: t,
				pabianice: t,
				plock: t,
				sieradz: t,
				skierniewice: t,
				zgierz: t,
				krasnik: t,
				leczna: t,
				lubartow: t,
				lublin: t,
				poniatowa: t,
				swidnik: t,
				co: t,
				torun: t,
				simplesite: t,
				myspreadshop: t,
				gda: t,
				gdansk: t,
				gdynia: t,
				med: t,
				sopot: t,
				bielsko: t
			}],
			pm: [1, {
				own: t,
				name: t
			}],
			pn: [1, {
				co: e,
				edu: e,
				gov: e,
				net: e,
				org: e
			}],
			post: e,
			pr: [1, {
				biz: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				isla: e,
				name: e,
				net: e,
				org: e,
				pro: e,
				ac: e,
				est: e,
				prof: e
			}],
			pro: [1, {
				aaa: e,
				aca: e,
				acct: e,
				avocat: e,
				bar: e,
				cpa: e,
				eng: e,
				jur: e,
				law: e,
				med: e,
				recht: e,
				"12chars": t,
				cloudns: t,
				barsy: t,
				ngrok: t
			}],
			ps: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				plo: e,
				sec: e
			}],
			pt: [1, {
				com: e,
				edu: e,
				gov: e,
				int: e,
				net: e,
				nome: e,
				org: e,
				publ: e,
				"123paginaweb": t
			}],
			pw: [1, {
				gov: e,
				cloudns: t,
				x443: t
			}],
			py: [1, {
				com: e,
				coop: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e
			}],
			qa: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				sch: e
			}],
			re: [1, {
				asso: e,
				com: e,
				netlib: t,
				can: t
			}],
			ro: [1, {
				arts: e,
				com: e,
				firm: e,
				info: e,
				nom: e,
				nt: e,
				org: e,
				rec: e,
				store: e,
				tm: e,
				www: e,
				co: t,
				shop: t,
				barsy: t
			}],
			rs: [1, {
				ac: e,
				co: e,
				edu: e,
				gov: e,
				in: e,
				org: e,
				brendly: ue,
				barsy: t,
				ox: t
			}],
			ru: [1, {
				ac: t,
				edu: t,
				gov: t,
				int: t,
				mil: t,
				eurodir: t,
				adygeya: t,
				bashkiria: t,
				bir: t,
				cbg: t,
				com: t,
				dagestan: t,
				grozny: t,
				kalmykia: t,
				kustanai: t,
				marine: t,
				mordovia: t,
				msk: t,
				mytis: t,
				nalchik: t,
				nov: t,
				pyatigorsk: t,
				spb: t,
				vladikavkaz: t,
				vladimir: t,
				na4u: t,
				mircloud: t,
				myjino: [2, {
					hosting: i,
					landing: i,
					spectrum: i,
					vps: i
				}],
				cldmail: [0, { hb: t }],
				mcdir: [2, { vps: t }],
				mcpre: t,
				net: t,
				org: t,
				pp: t,
				lk3: t,
				ras: t
			}],
			rw: [1, {
				ac: e,
				co: e,
				coop: e,
				gov: e,
				mil: e,
				net: e,
				org: e
			}],
			sa: [1, {
				com: e,
				edu: e,
				gov: e,
				med: e,
				net: e,
				org: e,
				pub: e,
				sch: e
			}],
			sb: n,
			sc: n,
			sd: [1, {
				com: e,
				edu: e,
				gov: e,
				info: e,
				med: e,
				net: e,
				org: e,
				tv: e
			}],
			se: [1, {
				a: e,
				ac: e,
				b: e,
				bd: e,
				brand: e,
				c: e,
				d: e,
				e,
				f: e,
				fh: e,
				fhsk: e,
				fhv: e,
				g: e,
				h: e,
				i: e,
				k: e,
				komforb: e,
				kommunalforbund: e,
				komvux: e,
				l: e,
				lanbib: e,
				m: e,
				n: e,
				naturbruksgymn: e,
				o: e,
				org: e,
				p: e,
				parti: e,
				pp: e,
				press: e,
				r: e,
				s: e,
				t: e,
				tm: e,
				u: e,
				w: e,
				x: e,
				y: e,
				z: e,
				com: t,
				iopsys: t,
				"123minsida": t,
				itcouldbewor: t,
				myspreadshop: t
			}],
			sg: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				enscaled: t
			}],
			sh: [1, {
				com: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				hashbang: t,
				botda: t,
				platform: [0, {
					ent: t,
					eu: t,
					us: t
				}],
				now: t
			}],
			si: [1, {
				f5: t,
				gitapp: t,
				gitpage: t
			}],
			sj: e,
			sk: e,
			sl: n,
			sm: e,
			sn: [1, {
				art: e,
				com: e,
				edu: e,
				gouv: e,
				org: e,
				perso: e,
				univ: e
			}],
			so: [1, {
				com: e,
				edu: e,
				gov: e,
				me: e,
				net: e,
				org: e,
				surveys: t
			}],
			sr: e,
			ss: [1, {
				biz: e,
				co: e,
				com: e,
				edu: e,
				gov: e,
				me: e,
				net: e,
				org: e,
				sch: e
			}],
			st: [1, {
				co: e,
				com: e,
				consulado: e,
				edu: e,
				embaixada: e,
				mil: e,
				net: e,
				org: e,
				principe: e,
				saotome: e,
				store: e,
				helioho: t,
				kirara: t,
				noho: t
			}],
			su: [1, {
				abkhazia: t,
				adygeya: t,
				aktyubinsk: t,
				arkhangelsk: t,
				armenia: t,
				ashgabad: t,
				azerbaijan: t,
				balashov: t,
				bashkiria: t,
				bryansk: t,
				bukhara: t,
				chimkent: t,
				dagestan: t,
				"east-kazakhstan": t,
				exnet: t,
				georgia: t,
				grozny: t,
				ivanovo: t,
				jambyl: t,
				kalmykia: t,
				kaluga: t,
				karacol: t,
				karaganda: t,
				karelia: t,
				khakassia: t,
				krasnodar: t,
				kurgan: t,
				kustanai: t,
				lenug: t,
				mangyshlak: t,
				mordovia: t,
				msk: t,
				murmansk: t,
				nalchik: t,
				navoi: t,
				"north-kazakhstan": t,
				nov: t,
				obninsk: t,
				penza: t,
				pokrovsk: t,
				sochi: t,
				spb: t,
				tashkent: t,
				termez: t,
				togliatti: t,
				troitsk: t,
				tselinograd: t,
				tula: t,
				tuva: t,
				vladikavkaz: t,
				vladimir: t,
				vologda: t
			}],
			sv: [1, {
				com: e,
				edu: e,
				gob: e,
				org: e,
				red: e
			}],
			sx: c,
			sy: r,
			sz: [1, {
				ac: e,
				co: e,
				org: e
			}],
			tc: e,
			td: e,
			tel: e,
			tf: [1, { sch: t }],
			tg: e,
			th: [1, {
				ac: e,
				co: e,
				go: e,
				in: e,
				mi: e,
				net: e,
				or: e,
				online: t,
				shop: t
			}],
			tj: [1, {
				ac: e,
				biz: e,
				co: e,
				com: e,
				edu: e,
				go: e,
				gov: e,
				int: e,
				mil: e,
				name: e,
				net: e,
				nic: e,
				org: e,
				test: e,
				web: e
			}],
			tk: e,
			tl: c,
			tm: [1, {
				co: e,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				nom: e,
				org: e
			}],
			tn: [1, {
				com: e,
				ens: e,
				fin: e,
				gov: e,
				ind: e,
				info: e,
				intl: e,
				mincom: e,
				nat: e,
				net: e,
				org: e,
				perso: e,
				tourism: e,
				orangecloud: t
			}],
			to: [1, {
				611: t,
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				oya: t,
				x0: t,
				quickconnect: S,
				vpnplus: t
			}],
			tr: [1, {
				av: e,
				bbs: e,
				bel: e,
				biz: e,
				com: e,
				dr: e,
				edu: e,
				gen: e,
				gov: e,
				info: e,
				k12: e,
				kep: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				pol: e,
				tel: e,
				tsk: e,
				tv: e,
				web: e,
				nc: c
			}],
			tt: [1, {
				biz: e,
				co: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				mil: e,
				name: e,
				net: e,
				org: e,
				pro: e
			}],
			tv: [1, {
				"better-than": t,
				dyndns: t,
				"on-the-web": t,
				"worse-than": t,
				from: t,
				sakura: t
			}],
			tw: [1, {
				club: e,
				com: [1, { mymailer: t }],
				ebiz: e,
				edu: e,
				game: e,
				gov: e,
				idv: e,
				mil: e,
				net: e,
				org: e,
				url: t,
				mydns: t
			}],
			tz: [1, {
				ac: e,
				co: e,
				go: e,
				hotel: e,
				info: e,
				me: e,
				mil: e,
				mobi: e,
				ne: e,
				or: e,
				sc: e,
				tv: e
			}],
			ua: [1, {
				com: e,
				edu: e,
				gov: e,
				in: e,
				net: e,
				org: e,
				cherkassy: e,
				cherkasy: e,
				chernigov: e,
				chernihiv: e,
				chernivtsi: e,
				chernovtsy: e,
				ck: e,
				cn: e,
				cr: e,
				crimea: e,
				cv: e,
				dn: e,
				dnepropetrovsk: e,
				dnipropetrovsk: e,
				donetsk: e,
				dp: e,
				if: e,
				"ivano-frankivsk": e,
				kh: e,
				kharkiv: e,
				kharkov: e,
				kherson: e,
				khmelnitskiy: e,
				khmelnytskyi: e,
				kiev: e,
				kirovograd: e,
				km: e,
				kr: e,
				kropyvnytskyi: e,
				krym: e,
				ks: e,
				kv: e,
				kyiv: e,
				lg: e,
				lt: e,
				lugansk: e,
				luhansk: e,
				lutsk: e,
				lv: e,
				lviv: e,
				mk: e,
				mykolaiv: e,
				nikolaev: e,
				od: e,
				odesa: e,
				odessa: e,
				pl: e,
				poltava: e,
				rivne: e,
				rovno: e,
				rv: e,
				sb: e,
				sebastopol: e,
				sevastopol: e,
				sm: e,
				sumy: e,
				te: e,
				ternopil: e,
				uz: e,
				uzhgorod: e,
				uzhhorod: e,
				vinnica: e,
				vinnytsia: e,
				vn: e,
				volyn: e,
				yalta: e,
				zakarpattia: e,
				zaporizhzhe: e,
				zaporizhzhia: e,
				zhitomir: e,
				zhytomyr: e,
				zp: e,
				zt: e,
				cc: t,
				inf: t,
				ltd: t,
				cx: t,
				ie: t,
				biz: t,
				co: t,
				pp: t,
				v: t
			}],
			ug: [1, {
				ac: e,
				co: e,
				com: e,
				edu: e,
				go: e,
				gov: e,
				mil: e,
				ne: e,
				or: e,
				org: e,
				sc: e,
				us: e
			}],
			uk: [1, {
				ac: e,
				co: [1, {
					bytemark: [0, {
						dh: t,
						vm: t
					}],
					layershift: F,
					barsy: t,
					barsyonline: t,
					retrosnub: fe,
					"nh-serv": t,
					"no-ip": t,
					adimo: t,
					myspreadshop: t
				}],
				gov: [1, {
					api: t,
					campaign: t,
					service: t
				}],
				ltd: e,
				me: e,
				net: e,
				nhs: e,
				org: [1, {
					glug: t,
					lug: t,
					lugs: t,
					affinitylottery: t,
					raffleentry: t,
					weeklylottery: t
				}],
				plc: e,
				police: e,
				sch: h,
				conn: t,
				copro: t,
				hosp: t,
				"independent-commission": t,
				"independent-inquest": t,
				"independent-inquiry": t,
				"independent-panel": t,
				"independent-review": t,
				"public-inquiry": t,
				"royal-commission": t,
				pymnt: t,
				barsy: t,
				nimsite: t,
				oraclegovcloudapps: i
			}],
			us: [1, {
				dni: e,
				isa: e,
				nsn: e,
				ak: H,
				al: H,
				ar: H,
				as: H,
				az: H,
				ca: H,
				co: H,
				ct: H,
				dc: H,
				de: [1, {
					cc: e,
					lib: t
				}],
				fl: H,
				ga: H,
				gu: H,
				hi: U,
				ia: H,
				id: H,
				il: H,
				in: H,
				ks: H,
				ky: H,
				la: H,
				ma: [1, {
					k12: [1, {
						chtr: e,
						paroch: e,
						pvt: e
					}],
					cc: e,
					lib: e
				}],
				md: H,
				me: H,
				mi: [1, {
					k12: e,
					cc: e,
					lib: e,
					"ann-arbor": e,
					cog: e,
					dst: e,
					eaton: e,
					gen: e,
					mus: e,
					tec: e,
					washtenaw: e
				}],
				mn: H,
				mo: H,
				ms: H,
				mt: H,
				nc: H,
				nd: U,
				ne: H,
				nh: H,
				nj: H,
				nm: H,
				nv: H,
				ny: H,
				oh: H,
				ok: H,
				or: H,
				pa: H,
				pr: H,
				ri: U,
				sc: H,
				sd: U,
				tn: H,
				tx: H,
				ut: H,
				va: H,
				vi: H,
				vt: H,
				wa: H,
				wi: H,
				wv: [1, { cc: e }],
				wy: H,
				cloudns: t,
				"is-by": t,
				"land-4-sale": t,
				"stuff-4-sale": t,
				heliohost: t,
				enscaled: [0, { phx: t }],
				mircloud: t,
				ngo: t,
				golffan: t,
				noip: t,
				pointto: t,
				freeddns: t,
				srv: [2, {
					gh: t,
					gl: t
				}],
				platterp: t,
				servername: t
			}],
			uy: [1, {
				com: e,
				edu: e,
				gub: e,
				mil: e,
				net: e,
				org: e
			}],
			uz: [1, {
				co: e,
				com: e,
				net: e,
				org: e
			}],
			va: e,
			vc: [1, {
				com: e,
				edu: e,
				gov: e,
				mil: e,
				net: e,
				org: e,
				gv: [2, { d: t }],
				"0e": i,
				mydns: t
			}],
			ve: [1, {
				arts: e,
				bib: e,
				co: e,
				com: e,
				e12: e,
				edu: e,
				emprende: e,
				firm: e,
				gob: e,
				gov: e,
				info: e,
				int: e,
				mil: e,
				net: e,
				nom: e,
				org: e,
				rar: e,
				rec: e,
				store: e,
				tec: e,
				web: e
			}],
			vg: [1, { edu: e }],
			vi: [1, {
				co: e,
				com: e,
				k12: e,
				net: e,
				org: e
			}],
			vn: [1, {
				ac: e,
				ai: e,
				biz: e,
				com: e,
				edu: e,
				gov: e,
				health: e,
				id: e,
				info: e,
				int: e,
				io: e,
				name: e,
				net: e,
				org: e,
				pro: e,
				angiang: e,
				bacgiang: e,
				backan: e,
				baclieu: e,
				bacninh: e,
				"baria-vungtau": e,
				bentre: e,
				binhdinh: e,
				binhduong: e,
				binhphuoc: e,
				binhthuan: e,
				camau: e,
				cantho: e,
				caobang: e,
				daklak: e,
				daknong: e,
				danang: e,
				dienbien: e,
				dongnai: e,
				dongthap: e,
				gialai: e,
				hagiang: e,
				haiduong: e,
				haiphong: e,
				hanam: e,
				hanoi: e,
				hatinh: e,
				haugiang: e,
				hoabinh: e,
				hungyen: e,
				khanhhoa: e,
				kiengiang: e,
				kontum: e,
				laichau: e,
				lamdong: e,
				langson: e,
				laocai: e,
				longan: e,
				namdinh: e,
				nghean: e,
				ninhbinh: e,
				ninhthuan: e,
				phutho: e,
				phuyen: e,
				quangbinh: e,
				quangnam: e,
				quangngai: e,
				quangninh: e,
				quangtri: e,
				soctrang: e,
				sonla: e,
				tayninh: e,
				thaibinh: e,
				thainguyen: e,
				thanhhoa: e,
				thanhphohochiminh: e,
				thuathienhue: e,
				tiengiang: e,
				travinh: e,
				tuyenquang: e,
				vinhlong: e,
				vinhphuc: e,
				yenbai: e
			}],
			vu: P,
			wf: [1, {
				biz: t,
				sch: t
			}],
			ws: [1, {
				com: e,
				edu: e,
				gov: e,
				net: e,
				org: e,
				advisor: i,
				cloud66: t,
				dyndns: t,
				mypets: t
			}],
			yt: [1, { org: t }],
			"xn--mgbaam7a8h": e,
			امارات: e,
			"xn--y9a3aq": e,
			հայ: e,
			"xn--54b7fta0cc": e,
			বাংলা: e,
			"xn--90ae": e,
			бг: e,
			"xn--mgbcpq6gpa1a": e,
			البحرين: e,
			"xn--90ais": e,
			бел: e,
			"xn--fiqs8s": e,
			中国: e,
			"xn--fiqz9s": e,
			中國: e,
			"xn--lgbbat1ad8j": e,
			الجزائر: e,
			"xn--wgbh1c": e,
			مصر: e,
			"xn--e1a4c": e,
			ею: e,
			"xn--qxa6a": e,
			ευ: e,
			"xn--mgbah1a3hjkrd": e,
			موريتانيا: e,
			"xn--node": e,
			გე: e,
			"xn--qxam": e,
			ελ: e,
			"xn--j6w193g": [1, {
				"xn--gmqw5a": e,
				"xn--55qx5d": e,
				"xn--mxtq1m": e,
				"xn--wcvs22d": e,
				"xn--uc0atv": e,
				"xn--od0alg": e
			}],
			香港: [1, {
				個人: e,
				公司: e,
				政府: e,
				教育: e,
				組織: e,
				網絡: e
			}],
			"xn--2scrj9c": e,
			ಭಾರತ: e,
			"xn--3hcrj9c": e,
			ଭାରତ: e,
			"xn--45br5cyl": e,
			ভাৰত: e,
			"xn--h2breg3eve": e,
			भारतम्: e,
			"xn--h2brj9c8c": e,
			भारोत: e,
			"xn--mgbgu82a": e,
			ڀارت: e,
			"xn--rvc1e0am3e": e,
			ഭാരതം: e,
			"xn--h2brj9c": e,
			भारत: e,
			"xn--mgbbh1a": e,
			بارت: e,
			"xn--mgbbh1a71e": e,
			بھارت: e,
			"xn--fpcrj9c3d": e,
			భారత్: e,
			"xn--gecrj9c": e,
			ભારત: e,
			"xn--s9brj9c": e,
			ਭਾਰਤ: e,
			"xn--45brj9c": e,
			ভারত: e,
			"xn--xkc2dl3a5ee0h": e,
			இந்தியா: e,
			"xn--mgba3a4f16a": e,
			ایران: e,
			"xn--mgba3a4fra": e,
			ايران: e,
			"xn--mgbtx2b": e,
			عراق: e,
			"xn--mgbayh7gpa": e,
			الاردن: e,
			"xn--3e0b707e": e,
			한국: e,
			"xn--80ao21a": e,
			қаз: e,
			"xn--q7ce6a": e,
			ລາວ: e,
			"xn--fzc2c9e2c": e,
			ලංකා: e,
			"xn--xkc2al3hye2a": e,
			இலங்கை: e,
			"xn--mgbc0a9azcg": e,
			المغرب: e,
			"xn--d1alf": e,
			мкд: e,
			"xn--l1acc": e,
			мон: e,
			"xn--mix891f": e,
			澳門: e,
			"xn--mix082f": e,
			澳门: e,
			"xn--mgbx4cd0ab": e,
			مليسيا: e,
			"xn--mgb9awbf": e,
			عمان: e,
			"xn--mgbai9azgqp6j": e,
			پاکستان: e,
			"xn--mgbai9a5eva00b": e,
			پاكستان: e,
			"xn--ygbi2ammx": e,
			فلسطين: e,
			"xn--90a3ac": [1, {
				"xn--80au": e,
				"xn--90azh": e,
				"xn--d1at": e,
				"xn--c1avg": e,
				"xn--o1ac": e,
				"xn--o1ach": e
			}],
			срб: [1, {
				ак: e,
				обр: e,
				од: e,
				орг: e,
				пр: e,
				упр: e
			}],
			"xn--p1ai": e,
			рф: e,
			"xn--wgbl6a": e,
			قطر: e,
			"xn--mgberp4a5d4ar": e,
			السعودية: e,
			"xn--mgberp4a5d4a87g": e,
			السعودیة: e,
			"xn--mgbqly7c0a67fbc": e,
			السعودیۃ: e,
			"xn--mgbqly7cvafr": e,
			السعوديه: e,
			"xn--mgbpl2fh": e,
			سودان: e,
			"xn--yfro4i67o": e,
			新加坡: e,
			"xn--clchc0ea0b2g2a9gcd": e,
			சிங்கப்பூர்: e,
			"xn--ogbpf8fl": e,
			سورية: e,
			"xn--mgbtf8fl": e,
			سوريا: e,
			"xn--o3cw4h": [1, {
				"xn--o3cyx2a": e,
				"xn--12co0c3b4eva": e,
				"xn--m3ch0j3a": e,
				"xn--h3cuzk1di": e,
				"xn--12c1fe0br": e,
				"xn--12cfi8ixb8l": e
			}],
			ไทย: [1, {
				ทหาร: e,
				ธุรกิจ: e,
				เน็ต: e,
				รัฐบาล: e,
				ศึกษา: e,
				องค์กร: e
			}],
			"xn--pgbs0dh": e,
			تونس: e,
			"xn--kpry57d": e,
			台灣: e,
			"xn--kprw13d": e,
			台湾: e,
			"xn--nnx388a": e,
			臺灣: e,
			"xn--j1amh": e,
			укр: e,
			"xn--mgb2ddes": e,
			اليمن: e,
			xxx: e,
			ye: r,
			za: [0, {
				ac: e,
				agric: e,
				alt: e,
				co: e,
				edu: e,
				gov: e,
				grondar: e,
				law: e,
				mil: e,
				net: e,
				ngo: e,
				nic: e,
				nis: e,
				nom: e,
				org: e,
				school: e,
				tm: e,
				web: e
			}],
			zm: [1, {
				ac: e,
				biz: e,
				co: e,
				com: e,
				edu: e,
				gov: e,
				info: e,
				mil: e,
				net: e,
				org: e,
				sch: e
			}],
			zw: [1, {
				ac: e,
				co: e,
				gov: e,
				mil: e,
				org: e
			}],
			aaa: e,
			aarp: e,
			abb: e,
			abbott: e,
			abbvie: e,
			abc: e,
			able: e,
			abogado: e,
			abudhabi: e,
			academy: [1, { official: t }],
			accenture: e,
			accountant: e,
			accountants: e,
			aco: e,
			actor: e,
			ads: e,
			adult: e,
			aeg: e,
			aetna: e,
			afl: e,
			africa: e,
			agakhan: e,
			agency: e,
			aig: e,
			airbus: e,
			airforce: e,
			airtel: e,
			akdn: e,
			alibaba: e,
			alipay: e,
			allfinanz: e,
			allstate: e,
			ally: e,
			alsace: e,
			alstom: e,
			amazon: e,
			americanexpress: e,
			americanfamily: e,
			amex: e,
			amfam: e,
			amica: e,
			amsterdam: e,
			analytics: e,
			android: e,
			anquan: e,
			anz: e,
			aol: e,
			apartments: e,
			app: [1, {
				adaptable: t,
				aiven: t,
				beget: i,
				brave: a,
				clerk: t,
				clerkstage: t,
				wnext: t,
				csb: [2, { preview: t }],
				convex: t,
				deta: t,
				ondigitalocean: t,
				easypanel: t,
				encr: t,
				evervault: o,
				expo: [2, { staging: t }],
				edgecompute: t,
				"on-fleek": t,
				flutterflow: t,
				e2b: t,
				framer: t,
				hosted: i,
				run: i,
				web: t,
				hasura: t,
				botdash: t,
				loginline: t,
				lovable: t,
				medusajs: t,
				messerli: t,
				netfy: t,
				netlify: t,
				ngrok: t,
				"ngrok-free": t,
				developer: i,
				noop: t,
				northflank: i,
				upsun: i,
				replit: s,
				nyat: t,
				snowflake: [0, {
					"*": t,
					privatelink: i
				}],
				streamlit: t,
				storipress: t,
				telebit: t,
				typedream: t,
				vercel: t,
				bookonline: t,
				wdh: t,
				windsurf: t,
				zeabur: t,
				zerops: i
			}],
			apple: e,
			aquarelle: e,
			arab: e,
			aramco: e,
			archi: e,
			army: e,
			art: e,
			arte: e,
			asda: e,
			associates: e,
			athleta: e,
			attorney: e,
			auction: e,
			audi: e,
			audible: e,
			audio: e,
			auspost: e,
			author: e,
			auto: e,
			autos: e,
			aws: [1, {
				sagemaker: [0, {
					"ap-northeast-1": d,
					"ap-northeast-2": d,
					"ap-south-1": d,
					"ap-southeast-1": d,
					"ap-southeast-2": d,
					"ca-central-1": p,
					"eu-central-1": d,
					"eu-west-1": d,
					"eu-west-2": d,
					"us-east-1": p,
					"us-east-2": p,
					"us-west-2": p,
					"af-south-1": u,
					"ap-east-1": u,
					"ap-northeast-3": u,
					"ap-south-2": f,
					"ap-southeast-3": u,
					"ap-southeast-4": f,
					"ca-west-1": [0, {
						notebook: t,
						"notebook-fips": t
					}],
					"eu-central-2": u,
					"eu-north-1": u,
					"eu-south-1": u,
					"eu-south-2": u,
					"eu-west-3": u,
					"il-central-1": u,
					"me-central-1": u,
					"me-south-1": u,
					"sa-east-1": u,
					"us-gov-east-1": m,
					"us-gov-west-1": m,
					"us-west-1": [0, {
						notebook: t,
						"notebook-fips": t,
						studio: t
					}],
					experiments: i
				}],
				repost: [0, { private: i }],
				on: [0, {
					"ap-northeast-1": l,
					"ap-southeast-1": l,
					"ap-southeast-2": l,
					"eu-central-1": l,
					"eu-north-1": l,
					"eu-west-1": l,
					"us-east-1": l,
					"us-east-2": l,
					"us-west-2": l
				}]
			}],
			axa: e,
			azure: e,
			baby: e,
			baidu: e,
			banamex: e,
			band: e,
			bank: e,
			bar: e,
			barcelona: e,
			barclaycard: e,
			barclays: e,
			barefoot: e,
			bargains: e,
			baseball: e,
			basketball: [1, {
				aus: t,
				nz: t
			}],
			bauhaus: e,
			bayern: e,
			bbc: e,
			bbt: e,
			bbva: e,
			bcg: e,
			bcn: e,
			beats: e,
			beauty: e,
			beer: e,
			bentley: e,
			berlin: e,
			best: e,
			bestbuy: e,
			bet: e,
			bharti: e,
			bible: e,
			bid: e,
			bike: e,
			bing: e,
			bingo: e,
			bio: e,
			black: e,
			blackfriday: e,
			blockbuster: e,
			blog: e,
			bloomberg: e,
			blue: e,
			bms: e,
			bmw: e,
			bnpparibas: e,
			boats: e,
			boehringer: e,
			bofa: e,
			bom: e,
			bond: e,
			boo: e,
			book: e,
			booking: e,
			bosch: e,
			bostik: e,
			boston: e,
			bot: e,
			boutique: e,
			box: e,
			bradesco: e,
			bridgestone: e,
			broadway: e,
			broker: e,
			brother: e,
			brussels: e,
			build: [1, {
				v0: t,
				windsurf: t
			}],
			builders: [1, { cloudsite: t }],
			business: g,
			buy: e,
			buzz: e,
			bzh: e,
			cab: e,
			cafe: e,
			cal: e,
			call: e,
			calvinklein: e,
			cam: e,
			camera: e,
			camp: [1, { emf: [0, { at: t }] }],
			canon: e,
			capetown: e,
			capital: e,
			capitalone: e,
			car: e,
			caravan: e,
			cards: e,
			care: e,
			career: e,
			careers: e,
			cars: e,
			casa: [1, { nabu: [0, { ui: t }] }],
			case: e,
			cash: e,
			casino: e,
			catering: e,
			catholic: e,
			cba: e,
			cbn: e,
			cbre: e,
			center: e,
			ceo: e,
			cern: e,
			cfa: e,
			cfd: e,
			chanel: e,
			channel: e,
			charity: e,
			chase: e,
			chat: e,
			cheap: e,
			chintai: e,
			christmas: e,
			chrome: e,
			church: e,
			cipriani: e,
			circle: e,
			cisco: e,
			citadel: e,
			citi: e,
			citic: e,
			city: e,
			claims: e,
			cleaning: e,
			click: e,
			clinic: e,
			clinique: e,
			clothing: e,
			cloud: [1, {
				convex: t,
				elementor: t,
				encoway: [0, { eu: t }],
				statics: i,
				ravendb: t,
				axarnet: [0, { "es-1": t }],
				diadem: t,
				jelastic: [0, { vip: t }],
				jele: t,
				"jenv-aruba": [0, {
					aruba: [0, { eur: [0, { it1: t }] }],
					it1: t
				}],
				keliweb: [2, { cs: t }],
				oxa: [2, {
					tn: t,
					uk: t
				}],
				primetel: [2, { uk: t }],
				reclaim: [0, {
					ca: t,
					uk: t,
					us: t
				}],
				trendhosting: [0, {
					ch: t,
					de: t
				}],
				jotelulu: t,
				kuleuven: t,
				laravel: t,
				linkyard: t,
				magentosite: i,
				matlab: t,
				observablehq: t,
				perspecta: t,
				vapor: t,
				"on-rancher": i,
				scw: [0, {
					baremetal: [0, {
						"fr-par-1": t,
						"fr-par-2": t,
						"nl-ams-1": t
					}],
					"fr-par": [0, {
						cockpit: t,
						fnc: [2, { functions: t }],
						k8s: v,
						s3: t,
						"s3-website": t,
						whm: t
					}],
					instances: [0, {
						priv: t,
						pub: t
					}],
					k8s: t,
					"nl-ams": [0, {
						cockpit: t,
						k8s: v,
						s3: t,
						"s3-website": t,
						whm: t
					}],
					"pl-waw": [0, {
						cockpit: t,
						k8s: v,
						s3: t,
						"s3-website": t
					}],
					scalebook: t,
					smartlabeling: t
				}],
				servebolt: t,
				onstackit: [0, { runs: t }],
				trafficplex: t,
				"unison-services": t,
				urown: t,
				voorloper: t,
				zap: t
			}],
			club: [1, {
				cloudns: t,
				jele: t,
				barsy: t
			}],
			clubmed: e,
			coach: e,
			codes: [1, { owo: i }],
			coffee: e,
			college: e,
			cologne: e,
			commbank: e,
			community: [1, {
				nog: t,
				ravendb: t,
				myforum: t
			}],
			company: e,
			compare: e,
			computer: e,
			comsec: e,
			condos: e,
			construction: e,
			consulting: e,
			contact: e,
			contractors: e,
			cooking: e,
			cool: [1, {
				elementor: t,
				de: t
			}],
			corsica: e,
			country: e,
			coupon: e,
			coupons: e,
			courses: e,
			cpa: e,
			credit: e,
			creditcard: e,
			creditunion: e,
			cricket: e,
			crown: e,
			crs: e,
			cruise: e,
			cruises: e,
			cuisinella: e,
			cymru: e,
			cyou: e,
			dad: e,
			dance: e,
			data: e,
			date: e,
			dating: e,
			datsun: e,
			day: e,
			dclk: e,
			dds: e,
			deal: e,
			dealer: e,
			deals: e,
			degree: e,
			delivery: e,
			dell: e,
			deloitte: e,
			delta: e,
			democrat: e,
			dental: e,
			dentist: e,
			desi: e,
			design: [1, {
				graphic: t,
				bss: t
			}],
			dev: [1, {
				"12chars": t,
				myaddr: t,
				panel: t,
				lcl: i,
				lclstage: i,
				stg: i,
				stgstage: i,
				pages: t,
				r2: t,
				workers: t,
				deno: t,
				"deno-staging": t,
				deta: t,
				evervault: o,
				fly: t,
				githubpreview: t,
				gateway: i,
				hrsn: [2, { psl: [0, {
					sub: t,
					wc: [0, {
						"*": t,
						sub: i
					}]
				}] }],
				botdash: t,
				inbrowser: i,
				"is-a-good": t,
				"is-a": t,
				iserv: t,
				runcontainers: t,
				localcert: [0, { user: i }],
				loginline: t,
				barsy: t,
				mediatech: t,
				modx: t,
				ngrok: t,
				"ngrok-free": t,
				"is-a-fullstack": t,
				"is-cool": t,
				"is-not-a": t,
				localplayer: t,
				xmit: t,
				"platter-app": t,
				replit: [2, {
					archer: t,
					bones: t,
					canary: t,
					global: t,
					hacker: t,
					id: t,
					janeway: t,
					kim: t,
					kira: t,
					kirk: t,
					odo: t,
					paris: t,
					picard: t,
					pike: t,
					prerelease: t,
					reed: t,
					riker: t,
					sisko: t,
					spock: t,
					staging: t,
					sulu: t,
					tarpit: t,
					teams: t,
					tucker: t,
					wesley: t,
					worf: t
				}],
				crm: [0, {
					d: i,
					w: i,
					wa: i,
					wb: i,
					wc: i,
					wd: i,
					we: i,
					wf: i
				}],
				vercel: t,
				webhare: i
			}],
			dhl: e,
			diamonds: e,
			diet: e,
			digital: [1, { cloudapps: [2, { london: t }] }],
			direct: [1, { libp2p: t }],
			directory: e,
			discount: e,
			discover: e,
			dish: e,
			diy: e,
			dnp: e,
			docs: e,
			doctor: e,
			dog: e,
			domains: e,
			dot: e,
			download: e,
			drive: e,
			dtv: e,
			dubai: e,
			dunlop: e,
			dupont: e,
			durban: e,
			dvag: e,
			dvr: e,
			earth: e,
			eat: e,
			eco: e,
			edeka: e,
			education: g,
			email: [1, {
				crisp: [0, { on: t }],
				tawk: ce,
				tawkto: ce
			}],
			emerck: e,
			energy: e,
			engineer: e,
			engineering: e,
			enterprises: e,
			epson: e,
			equipment: e,
			ericsson: e,
			erni: e,
			esq: e,
			estate: [1, { compute: i }],
			eurovision: e,
			eus: [1, { party: le }],
			events: [1, {
				koobin: t,
				co: t
			}],
			exchange: e,
			expert: e,
			exposed: e,
			express: e,
			extraspace: e,
			fage: e,
			fail: e,
			fairwinds: e,
			faith: e,
			family: e,
			fan: e,
			fans: e,
			farm: [1, { storj: t }],
			farmers: e,
			fashion: e,
			fast: e,
			fedex: e,
			feedback: e,
			ferrari: e,
			ferrero: e,
			fidelity: e,
			fido: e,
			film: e,
			final: e,
			finance: e,
			financial: g,
			fire: e,
			firestone: e,
			firmdale: e,
			fish: e,
			fishing: e,
			fit: e,
			fitness: e,
			flickr: e,
			flights: e,
			flir: e,
			florist: e,
			flowers: e,
			fly: e,
			foo: e,
			food: e,
			football: e,
			ford: e,
			forex: e,
			forsale: e,
			forum: e,
			foundation: e,
			fox: e,
			free: e,
			fresenius: e,
			frl: e,
			frogans: e,
			frontier: e,
			ftr: e,
			fujitsu: e,
			fun: e,
			fund: e,
			furniture: e,
			futbol: e,
			fyi: e,
			gal: e,
			gallery: e,
			gallo: e,
			gallup: e,
			game: e,
			games: [1, {
				pley: t,
				sheezy: t
			}],
			gap: e,
			garden: e,
			gay: [1, { pages: t }],
			gbiz: e,
			gdn: [1, { cnpy: t }],
			gea: e,
			gent: e,
			genting: e,
			george: e,
			ggee: e,
			gift: e,
			gifts: e,
			gives: e,
			giving: e,
			glass: e,
			gle: e,
			global: [1, { appwrite: t }],
			globo: e,
			gmail: e,
			gmbh: e,
			gmo: e,
			gmx: e,
			godaddy: e,
			gold: e,
			goldpoint: e,
			golf: e,
			goo: e,
			goodyear: e,
			goog: [1, {
				cloud: t,
				translate: t,
				usercontent: i
			}],
			google: e,
			gop: e,
			got: e,
			grainger: e,
			graphics: e,
			gratis: e,
			green: e,
			gripe: e,
			grocery: e,
			group: [1, { discourse: t }],
			gucci: e,
			guge: e,
			guide: e,
			guitars: e,
			guru: e,
			hair: e,
			hamburg: e,
			hangout: e,
			haus: e,
			hbo: e,
			hdfc: e,
			hdfcbank: e,
			health: [1, { hra: t }],
			healthcare: e,
			help: e,
			helsinki: e,
			here: e,
			hermes: e,
			hiphop: e,
			hisamitsu: e,
			hitachi: e,
			hiv: e,
			hkt: e,
			hockey: e,
			holdings: e,
			holiday: e,
			homedepot: e,
			homegoods: e,
			homes: e,
			homesense: e,
			honda: e,
			horse: e,
			hospital: e,
			host: [1, {
				cloudaccess: t,
				freesite: t,
				easypanel: t,
				fastvps: t,
				myfast: t,
				tempurl: t,
				wpmudev: t,
				jele: t,
				mircloud: t,
				wp2: t,
				half: t
			}],
			hosting: [1, { opencraft: t }],
			hot: e,
			hotels: e,
			hotmail: e,
			house: e,
			how: e,
			hsbc: e,
			hughes: e,
			hyatt: e,
			hyundai: e,
			ibm: e,
			icbc: e,
			ice: e,
			icu: e,
			ieee: e,
			ifm: e,
			ikano: e,
			imamat: e,
			imdb: e,
			immo: e,
			immobilien: e,
			inc: e,
			industries: e,
			infiniti: e,
			ing: e,
			ink: e,
			institute: e,
			insurance: e,
			insure: e,
			international: e,
			intuit: e,
			investments: e,
			ipiranga: e,
			irish: e,
			ismaili: e,
			ist: e,
			istanbul: e,
			itau: e,
			itv: e,
			jaguar: e,
			java: e,
			jcb: e,
			jeep: e,
			jetzt: e,
			jewelry: e,
			jio: e,
			jll: e,
			jmp: e,
			jnj: e,
			joburg: e,
			jot: e,
			joy: e,
			jpmorgan: e,
			jprs: e,
			juegos: e,
			juniper: e,
			kaufen: e,
			kddi: e,
			kerryhotels: e,
			kerryproperties: e,
			kfh: e,
			kia: e,
			kids: e,
			kim: e,
			kindle: e,
			kitchen: e,
			kiwi: e,
			koeln: e,
			komatsu: e,
			kosher: e,
			kpmg: e,
			kpn: e,
			krd: [1, {
				co: t,
				edu: t
			}],
			kred: e,
			kuokgroup: e,
			kyoto: e,
			lacaixa: e,
			lamborghini: e,
			lamer: e,
			lancaster: e,
			land: e,
			landrover: e,
			lanxess: e,
			lasalle: e,
			lat: e,
			latino: e,
			latrobe: e,
			law: e,
			lawyer: e,
			lds: e,
			lease: e,
			leclerc: e,
			lefrak: e,
			legal: e,
			lego: e,
			lexus: e,
			lgbt: e,
			lidl: e,
			life: e,
			lifeinsurance: e,
			lifestyle: e,
			lighting: e,
			like: e,
			lilly: e,
			limited: e,
			limo: e,
			lincoln: e,
			link: [1, {
				myfritz: t,
				cyon: t,
				dweb: i,
				inbrowser: i,
				nftstorage: me,
				mypep: t,
				storacha: me,
				w3s: me
			}],
			live: [1, {
				aem: t,
				hlx: t,
				ewp: i
			}],
			living: e,
			llc: e,
			llp: e,
			loan: e,
			loans: e,
			locker: e,
			locus: e,
			lol: [1, { omg: t }],
			london: e,
			lotte: e,
			lotto: e,
			love: e,
			lpl: e,
			lplfinancial: e,
			ltd: e,
			ltda: e,
			lundbeck: e,
			luxe: e,
			luxury: e,
			madrid: e,
			maif: e,
			maison: e,
			makeup: e,
			man: e,
			management: e,
			mango: e,
			map: e,
			market: e,
			marketing: e,
			markets: e,
			marriott: e,
			marshalls: e,
			mattel: e,
			mba: e,
			mckinsey: e,
			med: e,
			media: z,
			meet: e,
			melbourne: e,
			meme: e,
			memorial: e,
			men: e,
			menu: [1, {
				barsy: t,
				barsyonline: t
			}],
			merck: e,
			merckmsd: e,
			miami: e,
			microsoft: e,
			mini: e,
			mint: e,
			mit: e,
			mitsubishi: e,
			mlb: e,
			mls: e,
			mma: e,
			mobile: e,
			moda: e,
			moe: e,
			moi: e,
			mom: [1, { ind: t }],
			monash: e,
			money: e,
			monster: e,
			mormon: e,
			mortgage: e,
			moscow: e,
			moto: e,
			motorcycles: e,
			mov: e,
			movie: e,
			msd: e,
			mtn: e,
			mtr: e,
			music: e,
			nab: e,
			nagoya: e,
			navy: e,
			nba: e,
			nec: e,
			netbank: e,
			netflix: e,
			network: [1, {
				alces: i,
				co: t,
				arvo: t,
				azimuth: t,
				tlon: t
			}],
			neustar: e,
			new: e,
			news: [1, { noticeable: t }],
			next: e,
			nextdirect: e,
			nexus: e,
			nfl: e,
			ngo: e,
			nhk: e,
			nico: e,
			nike: e,
			nikon: e,
			ninja: e,
			nissan: e,
			nissay: e,
			nokia: e,
			norton: e,
			now: e,
			nowruz: e,
			nowtv: e,
			nra: e,
			nrw: e,
			ntt: e,
			nyc: e,
			obi: e,
			observer: e,
			office: e,
			okinawa: e,
			olayan: e,
			olayangroup: e,
			ollo: e,
			omega: e,
			one: [1, {
				kin: i,
				service: t
			}],
			ong: [1, { obl: t }],
			onl: e,
			online: [1, {
				eero: t,
				"eero-stage": t,
				websitebuilder: t,
				barsy: t
			}],
			ooo: e,
			open: e,
			oracle: e,
			orange: [1, { tech: t }],
			organic: e,
			origins: e,
			osaka: e,
			otsuka: e,
			ott: e,
			ovh: [1, { nerdpol: t }],
			page: [1, {
				aem: t,
				hlx: t,
				hlx3: t,
				translated: t,
				codeberg: t,
				heyflow: t,
				prvcy: t,
				rocky: t,
				pdns: t,
				plesk: t
			}],
			panasonic: e,
			paris: e,
			pars: e,
			partners: e,
			parts: e,
			party: e,
			pay: e,
			pccw: e,
			pet: e,
			pfizer: e,
			pharmacy: e,
			phd: e,
			philips: e,
			phone: e,
			photo: e,
			photography: e,
			photos: z,
			physio: e,
			pics: e,
			pictet: e,
			pictures: [1, { 1337: t }],
			pid: e,
			pin: e,
			ping: e,
			pink: e,
			pioneer: e,
			pizza: [1, { ngrok: t }],
			place: g,
			play: e,
			playstation: e,
			plumbing: e,
			plus: e,
			pnc: e,
			pohl: e,
			poker: e,
			politie: e,
			porn: e,
			pramerica: e,
			praxi: e,
			press: e,
			prime: e,
			prod: e,
			productions: e,
			prof: e,
			progressive: e,
			promo: e,
			properties: e,
			property: e,
			protection: e,
			pru: e,
			prudential: e,
			pub: [1, {
				id: i,
				kin: i,
				barsy: t
			}],
			pwc: e,
			qpon: e,
			quebec: e,
			quest: e,
			racing: e,
			radio: e,
			read: e,
			realestate: e,
			realtor: e,
			realty: e,
			recipes: e,
			red: e,
			redstone: e,
			redumbrella: e,
			rehab: e,
			reise: e,
			reisen: e,
			reit: e,
			reliance: e,
			ren: e,
			rent: e,
			rentals: e,
			repair: e,
			report: e,
			republican: e,
			rest: e,
			restaurant: e,
			review: e,
			reviews: e,
			rexroth: e,
			rich: e,
			richardli: e,
			ricoh: e,
			ril: e,
			rio: e,
			rip: [1, { clan: t }],
			rocks: [1, {
				myddns: t,
				stackit: t,
				"lima-city": t,
				webspace: t
			}],
			rodeo: e,
			rogers: e,
			room: e,
			rsvp: e,
			rugby: e,
			ruhr: e,
			run: [1, {
				appwrite: i,
				development: t,
				ravendb: t,
				liara: [2, { iran: t }],
				servers: t,
				build: i,
				code: i,
				database: i,
				migration: i,
				onporter: t,
				repl: t,
				stackit: t,
				val: [0, {
					express: t,
					web: t
				}],
				wix: t
			}],
			rwe: e,
			ryukyu: e,
			saarland: e,
			safe: e,
			safety: e,
			sakura: e,
			sale: e,
			salon: e,
			samsclub: e,
			samsung: e,
			sandvik: e,
			sandvikcoromant: e,
			sanofi: e,
			sap: e,
			sarl: e,
			sas: e,
			save: e,
			saxo: e,
			sbi: e,
			sbs: e,
			scb: e,
			schaeffler: e,
			schmidt: e,
			scholarships: e,
			school: e,
			schule: e,
			schwarz: e,
			science: e,
			scot: [1, { gov: [2, { service: t }] }],
			search: e,
			seat: e,
			secure: e,
			security: e,
			seek: e,
			select: e,
			sener: e,
			services: [1, { loginline: t }],
			seven: e,
			sew: e,
			sex: e,
			sexy: e,
			sfr: e,
			shangrila: e,
			sharp: e,
			shell: e,
			shia: e,
			shiksha: e,
			shoes: e,
			shop: [1, {
				base: t,
				hoplix: t,
				barsy: t,
				barsyonline: t,
				shopware: t
			}],
			shopping: e,
			shouji: e,
			show: e,
			silk: e,
			sina: e,
			singles: e,
			site: [1, {
				square: t,
				canva: y,
				cloudera: i,
				convex: t,
				cyon: t,
				fastvps: t,
				figma: t,
				heyflow: t,
				jele: t,
				jouwweb: t,
				loginline: t,
				barsy: t,
				notion: t,
				omniwe: t,
				opensocial: t,
				madethis: t,
				platformsh: i,
				tst: i,
				byen: t,
				srht: t,
				novecore: t,
				cpanel: t,
				wpsquared: t
			}],
			ski: e,
			skin: e,
			sky: e,
			skype: e,
			sling: e,
			smart: e,
			smile: e,
			sncf: e,
			soccer: e,
			social: e,
			softbank: e,
			software: e,
			sohu: e,
			solar: e,
			solutions: e,
			song: e,
			sony: e,
			soy: e,
			spa: e,
			space: [1, {
				myfast: t,
				heiyu: t,
				hf: [2, { static: t }],
				"app-ionos": t,
				project: t,
				uber: t,
				xs4all: t
			}],
			sport: e,
			spot: e,
			srl: e,
			stada: e,
			staples: e,
			star: e,
			statebank: e,
			statefarm: e,
			stc: e,
			stcgroup: e,
			stockholm: e,
			storage: e,
			store: [1, {
				barsy: t,
				sellfy: t,
				shopware: t,
				storebase: t
			}],
			stream: e,
			studio: e,
			study: e,
			style: e,
			sucks: e,
			supplies: e,
			supply: e,
			support: [1, { barsy: t }],
			surf: e,
			surgery: e,
			suzuki: e,
			swatch: e,
			swiss: e,
			sydney: e,
			systems: [1, { knightpoint: t }],
			tab: e,
			taipei: e,
			talk: e,
			taobao: e,
			target: e,
			tatamotors: e,
			tatar: e,
			tattoo: e,
			tax: e,
			taxi: e,
			tci: e,
			tdk: e,
			team: [1, {
				discourse: t,
				jelastic: t
			}],
			tech: [1, { cleverapps: t }],
			technology: g,
			temasek: e,
			tennis: e,
			teva: e,
			thd: e,
			theater: e,
			theatre: e,
			tiaa: e,
			tickets: e,
			tienda: e,
			tips: e,
			tires: e,
			tirol: e,
			tjmaxx: e,
			tjx: e,
			tkmaxx: e,
			tmall: e,
			today: [1, { prequalifyme: t }],
			tokyo: e,
			tools: [1, {
				addr: I,
				myaddr: t
			}],
			top: [1, {
				ntdll: t,
				wadl: i
			}],
			toray: e,
			toshiba: e,
			total: e,
			tours: e,
			town: e,
			toyota: e,
			toys: e,
			trade: e,
			trading: e,
			training: e,
			travel: e,
			travelers: e,
			travelersinsurance: e,
			trust: e,
			trv: e,
			tube: e,
			tui: e,
			tunes: e,
			tushu: e,
			tvs: e,
			ubank: e,
			ubs: e,
			unicom: e,
			university: e,
			uno: e,
			uol: e,
			ups: e,
			vacations: e,
			vana: e,
			vanguard: e,
			vegas: e,
			ventures: e,
			verisign: e,
			versicherung: e,
			vet: e,
			viajes: e,
			video: e,
			vig: e,
			viking: e,
			villas: e,
			vin: e,
			vip: e,
			virgin: e,
			visa: e,
			vision: e,
			viva: e,
			vivo: e,
			vlaanderen: e,
			vodka: e,
			volvo: e,
			vote: e,
			voting: e,
			voto: e,
			voyage: e,
			wales: e,
			walmart: e,
			walter: e,
			wang: e,
			wanggou: e,
			watch: e,
			watches: e,
			weather: e,
			weatherchannel: e,
			webcam: e,
			weber: e,
			website: z,
			wed: e,
			wedding: e,
			weibo: e,
			weir: e,
			whoswho: e,
			wien: e,
			wiki: z,
			williamhill: e,
			win: e,
			windows: e,
			wine: e,
			winners: e,
			wme: e,
			wolterskluwer: e,
			woodside: e,
			work: e,
			works: e,
			world: e,
			wow: e,
			wtc: e,
			wtf: e,
			xbox: e,
			xerox: e,
			xihuan: e,
			xin: e,
			"xn--11b4c3d": e,
			कॉम: e,
			"xn--1ck2e1b": e,
			セール: e,
			"xn--1qqw23a": e,
			佛山: e,
			"xn--30rr7y": e,
			慈善: e,
			"xn--3bst00m": e,
			集团: e,
			"xn--3ds443g": e,
			在线: e,
			"xn--3pxu8k": e,
			点看: e,
			"xn--42c2d9a": e,
			คอม: e,
			"xn--45q11c": e,
			八卦: e,
			"xn--4gbrim": e,
			موقع: e,
			"xn--55qw42g": e,
			公益: e,
			"xn--55qx5d": e,
			公司: e,
			"xn--5su34j936bgsg": e,
			香格里拉: e,
			"xn--5tzm5g": e,
			网站: e,
			"xn--6frz82g": e,
			移动: e,
			"xn--6qq986b3xl": e,
			我爱你: e,
			"xn--80adxhks": e,
			москва: e,
			"xn--80aqecdr1a": e,
			католик: e,
			"xn--80asehdb": e,
			онлайн: e,
			"xn--80aswg": e,
			сайт: e,
			"xn--8y0a063a": e,
			联通: e,
			"xn--9dbq2a": e,
			קום: e,
			"xn--9et52u": e,
			时尚: e,
			"xn--9krt00a": e,
			微博: e,
			"xn--b4w605ferd": e,
			淡马锡: e,
			"xn--bck1b9a5dre4c": e,
			ファッション: e,
			"xn--c1avg": e,
			орг: e,
			"xn--c2br7g": e,
			नेट: e,
			"xn--cck2b3b": e,
			ストア: e,
			"xn--cckwcxetd": e,
			アマゾン: e,
			"xn--cg4bki": e,
			삼성: e,
			"xn--czr694b": e,
			商标: e,
			"xn--czrs0t": e,
			商店: e,
			"xn--czru2d": e,
			商城: e,
			"xn--d1acj3b": e,
			дети: e,
			"xn--eckvdtc9d": e,
			ポイント: e,
			"xn--efvy88h": e,
			新闻: e,
			"xn--fct429k": e,
			家電: e,
			"xn--fhbei": e,
			كوم: e,
			"xn--fiq228c5hs": e,
			中文网: e,
			"xn--fiq64b": e,
			中信: e,
			"xn--fjq720a": e,
			娱乐: e,
			"xn--flw351e": e,
			谷歌: e,
			"xn--fzys8d69uvgm": e,
			電訊盈科: e,
			"xn--g2xx48c": e,
			购物: e,
			"xn--gckr3f0f": e,
			クラウド: e,
			"xn--gk3at1e": e,
			通販: e,
			"xn--hxt814e": e,
			网店: e,
			"xn--i1b6b1a6a2e": e,
			संगठन: e,
			"xn--imr513n": e,
			餐厅: e,
			"xn--io0a7i": e,
			网络: e,
			"xn--j1aef": e,
			ком: e,
			"xn--jlq480n2rg": e,
			亚马逊: e,
			"xn--jvr189m": e,
			食品: e,
			"xn--kcrx77d1x4a": e,
			飞利浦: e,
			"xn--kput3i": e,
			手机: e,
			"xn--mgba3a3ejt": e,
			ارامكو: e,
			"xn--mgba7c0bbn0a": e,
			العليان: e,
			"xn--mgbab2bd": e,
			بازار: e,
			"xn--mgbca7dzdo": e,
			ابوظبي: e,
			"xn--mgbi4ecexp": e,
			كاثوليك: e,
			"xn--mgbt3dhd": e,
			همراه: e,
			"xn--mk1bu44c": e,
			닷컴: e,
			"xn--mxtq1m": e,
			政府: e,
			"xn--ngbc5azd": e,
			شبكة: e,
			"xn--ngbe9e0a": e,
			بيتك: e,
			"xn--ngbrx": e,
			عرب: e,
			"xn--nqv7f": e,
			机构: e,
			"xn--nqv7fs00ema": e,
			组织机构: e,
			"xn--nyqy26a": e,
			健康: e,
			"xn--otu796d": e,
			招聘: e,
			"xn--p1acf": [1, {
				"xn--90amc": t,
				"xn--j1aef": t,
				"xn--j1ael8b": t,
				"xn--h1ahn": t,
				"xn--j1adp": t,
				"xn--c1avg": t,
				"xn--80aaa0cvac": t,
				"xn--h1aliz": t,
				"xn--90a1af": t,
				"xn--41a": t
			}],
			рус: [1, {
				биз: t,
				ком: t,
				крым: t,
				мир: t,
				мск: t,
				орг: t,
				самара: t,
				сочи: t,
				спб: t,
				я: t
			}],
			"xn--pssy2u": e,
			大拿: e,
			"xn--q9jyb4c": e,
			みんな: e,
			"xn--qcka1pmc": e,
			グーグル: e,
			"xn--rhqv96g": e,
			世界: e,
			"xn--rovu88b": e,
			書籍: e,
			"xn--ses554g": e,
			网址: e,
			"xn--t60b56a": e,
			닷넷: e,
			"xn--tckwe": e,
			コム: e,
			"xn--tiq49xqyj": e,
			天主教: e,
			"xn--unup4y": e,
			游戏: e,
			"xn--vermgensberater-ctb": e,
			vermögensberater: e,
			"xn--vermgensberatung-pwb": e,
			vermögensberatung: e,
			"xn--vhquv": e,
			企业: e,
			"xn--vuq861b": e,
			信息: e,
			"xn--w4r85el8fhu5dnra": e,
			嘉里大酒店: e,
			"xn--w4rs40l": e,
			嘉里: e,
			"xn--xhq521b": e,
			广东: e,
			"xn--zfr164b": e,
			政务: e,
			xyz: [1, {
				botdash: t,
				telebit: i
			}],
			yachts: e,
			yahoo: e,
			yamaxun: e,
			yandex: e,
			yodobashi: e,
			yoga: e,
			yokohama: e,
			you: e,
			youtube: e,
			yun: e,
			zappos: e,
			zara: e,
			zero: e,
			zip: e,
			zone: [1, {
				cloud66: t,
				triton: i,
				stackit: t,
				lima: t
			}],
			zuerich: e
		}];
	})();
}));
//#endregion
//#region node_modules/tldts/dist/es6/src/suffix-trie.js
function F(e, t, n, r) {
	let i = null, a = t;
	for (; a !== void 0 && ((a[0] & r) !== 0 && (i = {
		index: n + 1,
		isIcann: a[0] === 1,
		isPrivate: a[0] === 2
	}), n !== -1);) {
		let t = a[1];
		a = Object.prototype.hasOwnProperty.call(t, e[n]) ? t[e[n]] : t["*"], --n;
	}
	return i;
}
function I(e, t, n) {
	if (ie(e, t, n)) return;
	let r = e.split("."), i = (t.allowPrivateDomains ? 2 : 0) | !!t.allowIcannDomains, a = F(r, M, r.length - 1, i);
	if (a !== null) {
		n.isIcann = a.isIcann, n.isPrivate = a.isPrivate, n.publicSuffix = r.slice(a.index + 1).join(".");
		return;
	}
	let o = F(r, N, r.length - 1, i);
	if (o !== null) {
		n.isIcann = o.isIcann, n.isPrivate = o.isPrivate, n.publicSuffix = r.slice(o.index).join(".");
		return;
	}
	n.isIcann = !1, n.isPrivate = !1, n.publicSuffix = r[r.length - 1] ?? null;
}
var se = t((() => {
	oe(), P();
})), ce = /* @__PURE__ */ n({
	getDomain: () => de,
	getDomainWithoutSuffix: () => pe,
	getHostname: () => ue,
	getPublicSuffix: () => L,
	getSubdomain: () => fe,
	parse: () => le
});
function le(e, t = {}) {
	return j(e, 5, I, t, ne());
}
function ue(e, t = {}) {
	return A(R), j(e, 0, I, t, R).hostname;
}
function L(e, t = {}) {
	return A(R), j(e, 2, I, t, R).publicSuffix;
}
function de(e, t = {}) {
	return A(R), j(e, 3, I, t, R).domain;
}
function fe(e, t = {}) {
	return A(R), j(e, 4, I, t, R).subdomain;
}
function pe(e, t = {}) {
	return A(R), j(e, 5, I, t, R).domainWithoutSuffix;
}
var R, me = t((() => {
	oe(), se(), R = ne();
})), z = /* @__PURE__ */ r(((t) => {
	Object.defineProperty(t, "__esModule", { value: !0 }), t.getPublicSuffix = o;
	var n = (me(), e(ce)), r = [
		"local",
		"example",
		"invalid",
		"localhost",
		"test"
	], i = ["localhost", "invalid"], a = {
		allowSpecialUseDomain: !1,
		ignoreError: !1
	};
	function o(e, t = {}) {
		t = {
			...a,
			...t
		};
		let o = e.split("."), s = o[o.length - 1], c = !!t.allowSpecialUseDomain, l = !!t.ignoreError;
		if (c && s !== void 0 && r.includes(s)) {
			if (o.length > 1) return `${o[o.length - 2]}.${s}`;
			if (i.includes(s)) return s;
		}
		if (!l && s !== void 0 && r.includes(s)) throw Error(`Cookie has domain set to the public suffix "${s}" which is a special use domain. To allow this, configure your CookieJar with {allowSpecialUseDomain: true, rejectPublicSuffixes: false}.`);
		let u = (0, n.getDomain)(e, {
			allowIcannDomains: !0,
			allowPrivateDomains: !0
		});
		if (u) return u;
	}
})), he = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.permuteDomain = n;
	var t = z();
	function n(e, n) {
		let r = (0, t.getPublicSuffix)(e, { allowSpecialUseDomain: n });
		if (!r) return;
		if (r == e) return [e];
		e.slice(-1) == "." && (e = e.slice(0, -1));
		let i = e.slice(0, -(r.length + 1)).split(".").reverse(), a = r, o = [a];
		for (; i.length;) a = `${i.shift()}.${a}`, o.push(a);
		return o;
	}
})), B = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Store = void 0, e.Store = class {
		constructor() {
			this.synchronous = !1;
		}
		findCookie(e, t, n, r) {
			throw Error("findCookie is not implemented");
		}
		findCookies(e, t, n = !1, r) {
			throw Error("findCookies is not implemented");
		}
		putCookie(e, t) {
			throw Error("putCookie is not implemented");
		}
		updateCookie(e, t, n) {
			throw Error("updateCookie is not implemented");
		}
		removeCookie(e, t, n, r) {
			throw Error("removeCookie is not implemented");
		}
		removeCookies(e, t, n) {
			throw Error("removeCookies is not implemented");
		}
		removeAllCookies(e) {
			throw Error("removeAllCookies is not implemented");
		}
		getAllCookies(e) {
			throw Error("getAllCookies is not implemented (therefore jar cannot be serialized)");
		}
	};
})), V = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.safeToString = e.objectToString = void 0, e.createPromiseCallback = r, e.inOperator = i, e.objectToString = (e) => Object.prototype.toString.call(e);
	var t = (t, r) => typeof t.join == "function" ? (r.add(t), t.map((e) => e == null || r.has(e) ? "" : n(e, r)).join()) : (0, e.objectToString)(t), n = (n, r = /* @__PURE__ */ new WeakSet()) => typeof n != "object" || !n ? String(n) : typeof n.toString == "function" ? Array.isArray(n) ? t(n, r) : String(n) : (0, e.objectToString)(n);
	e.safeToString = (e) => n(e);
	function r(e) {
		let t, n, r, i = new Promise((e, t) => {
			n = e, r = t;
		});
		return t = typeof e == "function" ? (t, n) => {
			try {
				t ? e(t) : e(null, n);
			} catch (e) {
				r(e instanceof Error ? e : /* @__PURE__ */ Error());
			}
		} : (e, t) => {
			try {
				e ? r(e) : n(t);
			} catch (e) {
				r(e instanceof Error ? e : /* @__PURE__ */ Error());
			}
		}, {
			promise: i,
			callback: t,
			resolve: (e) => (t(null, e), i),
			reject: (e) => (t(e), i)
		};
	}
	function i(e, t) {
		return e in t;
	}
})), H = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.MemoryCookieStore = void 0;
	var t = u(), n = he(), r = B(), i = V();
	e.MemoryCookieStore = class extends r.Store {
		constructor() {
			super(), this.synchronous = !0, this.idx = Object.create(null);
		}
		findCookie(e, t, n, r) {
			let a = (0, i.createPromiseCallback)(r);
			if (e == null || t == null || n == null) return a.resolve(void 0);
			let o = this.idx[e]?.[t]?.[n];
			return a.resolve(o);
		}
		findCookies(e, r, a = !1, o) {
			typeof a == "function" && (o = a, a = !0);
			let s = [], c = (0, i.createPromiseCallback)(o);
			if (!e) return c.resolve([]);
			let l;
			l = r ? function(e) {
				for (let n in e) if ((0, t.pathMatch)(r, n)) {
					let t = e[n];
					for (let e in t) {
						let n = t[e];
						n && s.push(n);
					}
				}
			} : function(e) {
				for (let t in e) {
					let n = e[t];
					for (let e in n) {
						let t = n[e];
						t && s.push(t);
					}
				}
			};
			let u = (0, n.permuteDomain)(e, a) || [e], d = this.idx;
			return u.forEach((e) => {
				let t = d[e];
				t && l(t);
			}), c.resolve(s);
		}
		putCookie(e, t) {
			let n = (0, i.createPromiseCallback)(t), { domain: r, path: a, key: o } = e;
			if (r == null || a == null || o == null) return n.resolve(void 0);
			let s = this.idx[r] ?? Object.create(null);
			this.idx[r] = s;
			let c = s[a] ?? Object.create(null);
			return s[a] = c, c[o] = e, n.resolve(void 0);
		}
		updateCookie(e, t, n) {
			if (n) this.putCookie(t, n);
			else return this.putCookie(t);
		}
		removeCookie(e, t, n, r) {
			let a = (0, i.createPromiseCallback)(r);
			return delete this.idx[e]?.[t]?.[n], a.resolve(void 0);
		}
		removeCookies(e, t, n) {
			let r = (0, i.createPromiseCallback)(n), a = this.idx[e];
			return a && (t ? delete a[t] : delete this.idx[e]), r.resolve(void 0);
		}
		removeAllCookies(e) {
			let t = (0, i.createPromiseCallback)(e);
			return this.idx = Object.create(null), t.resolve(void 0);
		}
		getAllCookies(e) {
			let t = (0, i.createPromiseCallback)(e), n = [], r = this.idx;
			return Object.keys(r).forEach((e) => {
				let t = r[e] ?? {};
				Object.keys(t).forEach((e) => {
					let r = t[e] ?? {};
					Object.keys(r).forEach((e) => {
						let t = r[e];
						t != null && n.push(t);
					});
				});
			}), n.sort((e, t) => (e.creationIndex || 0) - (t.creationIndex || 0)), t.resolve(n);
		}
	};
})), U = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ParameterError = void 0, e.isNonEmptyString = n, e.isDate = r, e.isEmptyString = i, e.isString = a, e.isObject = o, e.isInteger = s, e.validate = c;
	var t = V();
	function n(e) {
		return a(e) && e !== "";
	}
	function r(e) {
		return e instanceof Date && s(e.getTime());
	}
	function i(e) {
		return e === "" || e instanceof String && e.toString() === "";
	}
	function a(e) {
		return typeof e == "string" || e instanceof String;
	}
	function o(e) {
		return (0, t.objectToString)(e) === "[object Object]";
	}
	function s(e) {
		return typeof e == "number" && e % 1 == 0;
	}
	function c(e, n, r) {
		if (e) return;
		let i = typeof n == "function" ? n : void 0, a = typeof n == "function" ? r : n;
		o(a) || (a = "[object Object]");
		let s = new l((0, t.safeToString)(a));
		if (i) i(s);
		else throw s;
	}
	var l = class extends Error {};
	e.ParameterError = l;
})), ge = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.version = void 0, e.version = "5.1.2";
})), _e = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.IP_V6_REGEX_OBJECT = e.PrefixSecurityEnum = void 0, e.PrefixSecurityEnum = {
		SILENT: "silent",
		STRICT: "strict",
		DISABLED: "unsafe-disabled"
	}, Object.freeze(e.PrefixSecurityEnum);
	var t = "\n\\[?(?:\n(?:[a-fA-F\\d]{1,4}:){7}(?:[a-fA-F\\d]{1,4}|:)|\n(?:[a-fA-F\\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|:[a-fA-F\\d]{1,4}|:)|\n(?:[a-fA-F\\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,2}|:)|\n(?:[a-fA-F\\d]{1,4}:){4}(?:(?::[a-fA-F\\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,3}|:)|\n(?:[a-fA-F\\d]{1,4}:){3}(?:(?::[a-fA-F\\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,4}|:)|\n(?:[a-fA-F\\d]{1,4}:){2}(?:(?::[a-fA-F\\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,5}|:)|\n(?:[a-fA-F\\d]{1,4}:){1}(?:(?::[a-fA-F\\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,6}|:)|\n(?::(?:(?::[a-fA-F\\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,7}|:))\n)(?:%[0-9a-zA-Z]{1,})?\\]?\n".replace(/\s*\/\/.*$/gm, "").replace(/\n/g, "").trim();
	e.IP_V6_REGEX_OBJECT = RegExp(`^${t}$`);
})), ve = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.canonicalDomain = r;
	var t = _e();
	function n(e) {
		return new URL(`http://${e}`).hostname;
	}
	function r(e) {
		if (e == null) return;
		let r = e.trim().replace(/^\./, "");
		return t.IP_V6_REGEX_OBJECT.test(r) ? (r.startsWith("[") || (r = "[" + r), r.endsWith("]") || (r += "]"), n(r).slice(1, -1)) : /[^\u0001-\u007f]/.test(r) ? n(r) : r.toLowerCase();
	}
})), ye = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.formatDate = t;
	function t(e) {
		return e.toUTCString();
	}
})), be = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.parseDate = o;
	var t = /[\x09\x20-\x2F\x3B-\x40\x5B-\x60\x7B-\x7E]/, n = {
		jan: 0,
		feb: 1,
		mar: 2,
		apr: 3,
		may: 4,
		jun: 5,
		jul: 6,
		aug: 7,
		sep: 8,
		oct: 9,
		nov: 10,
		dec: 11
	};
	function r(e, t, n, r) {
		let i = 0;
		for (; i < e.length;) {
			let t = e.charCodeAt(i);
			if (t <= 47 || t >= 58) break;
			i++;
		}
		if (!(i < t || i > n) && !(!r && i != e.length)) return parseInt(e.slice(0, i), 10);
	}
	function i(e) {
		let t = e.split(":"), n = [
			0,
			0,
			0
		];
		if (t.length === 3) {
			for (let e = 0; e < 3; e++) {
				let i = e == 2, a = t[e];
				if (a === void 0) return;
				let o = r(a, 1, 2, i);
				if (o === void 0) return;
				n[e] = o;
			}
			return n;
		}
	}
	function a(e) {
		switch (e = String(e).slice(0, 3).toLowerCase(), e) {
			case "jan": return n.jan;
			case "feb": return n.feb;
			case "mar": return n.mar;
			case "apr": return n.apr;
			case "may": return n.may;
			case "jun": return n.jun;
			case "jul": return n.jul;
			case "aug": return n.aug;
			case "sep": return n.sep;
			case "oct": return n.oct;
			case "nov": return n.nov;
			case "dec": return n.dec;
			default: return;
		}
	}
	function o(e) {
		if (!e) return;
		let n = e.split(t), o, s, c, l, u, d;
		for (let e = 0; e < n.length; e++) {
			let t = (n[e] ?? "").trim();
			if (t.length) {
				if (c === void 0) {
					let e = i(t);
					if (e) {
						o = e[0], s = e[1], c = e[2];
						continue;
					}
				}
				if (l === void 0) {
					let e = r(t, 1, 2, !0);
					if (e !== void 0) {
						l = e;
						continue;
					}
				}
				if (u === void 0) {
					let e = a(t);
					if (e !== void 0) {
						u = e;
						continue;
					}
				}
				if (d === void 0) {
					let e = r(t, 2, 4, !0);
					e !== void 0 && (d = e, d >= 70 && d <= 99 ? d += 1900 : d >= 0 && d <= 69 && (d += 2e3));
				}
			}
		}
		if (!(l === void 0 || u === void 0 || d === void 0 || o === void 0 || s === void 0 || c === void 0 || l < 1 || l > 31 || d < 1601 || o > 23 || s > 59 || c > 59)) return new Date(Date.UTC(d, u, l, o, s, c));
	}
})), xe = /* @__PURE__ */ r(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Cookie = void 0;
	var i = z(), a = r(U()), o = V(), s = ye(), c = be(), l = ve(), u = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/, d = /[\x20-\x3A\x3C-\x7E]+/, f = /[\x00-\x1F]/, p = [
		"\n",
		"\r",
		"\0"
	];
	function m(e) {
		if (a.isEmptyString(e)) return e;
		for (let t = 0; t < p.length; t++) {
			let n = p[t], r = n ? e.indexOf(n) : -1;
			r !== -1 && (e = e.slice(0, r));
		}
		return e;
	}
	function h(e, t) {
		e = m(e);
		let n = e.indexOf("=");
		if (t) n === 0 && (e = e.substring(1), n = e.indexOf("="));
		else if (n <= 0) return;
		let r, i;
		if (n <= 0 ? (r = "", i = e.trim()) : (r = e.slice(0, n).trim(), i = e.slice(n + 1).trim()), f.test(r) || f.test(i)) return;
		let a = new y();
		return a.key = r, a.value = i, a;
	}
	function g(e, t) {
		if (a.isEmptyString(e) || !a.isString(e)) return;
		e = e.trim();
		let n = e.indexOf(";"), r = h(n === -1 ? e : e.slice(0, n), t?.loose ?? !1);
		if (!r) return;
		if (n === -1) return r;
		let i = e.slice(n + 1).trim();
		if (i.length === 0) return r;
		let o = i.split(";");
		for (; o.length;) {
			let e = (o.shift() ?? "").trim();
			if (e.length === 0) continue;
			let t = e.indexOf("="), n, i;
			switch (t === -1 ? (n = e, i = null) : (n = e.slice(0, t), i = e.slice(t + 1)), n = n.trim().toLowerCase(), i &&= i.trim(), n) {
				case "expires":
					if (i) {
						let e = (0, c.parseDate)(i);
						e && (r.expires = e);
					}
					break;
				case "max-age":
					if (i && /^-?[0-9]+$/.test(i)) {
						let e = parseInt(i, 10);
						r.setMaxAge(e);
					}
					break;
				case "domain":
					if (i) {
						let e = i.trim().replace(/^\./, "");
						e && (r.domain = e.toLowerCase());
					}
					break;
				case "path":
					r.path = i && i[0] === "/" ? i : null;
					break;
				case "secure":
					r.secure = !0;
					break;
				case "httponly":
					r.httpOnly = !0;
					break;
				case "samesite":
					switch (i ? i.toLowerCase() : "") {
						case "strict":
							r.sameSite = "strict";
							break;
						case "lax":
							r.sameSite = "lax";
							break;
						case "none":
							r.sameSite = "none";
							break;
						default:
							r.sameSite = void 0;
							break;
					}
					break;
				default:
					r.extensions = r.extensions || [], r.extensions.push(e);
					break;
			}
		}
		return r;
	}
	function _(e) {
		if (!e || a.isEmptyString(e)) return;
		let t;
		if (typeof e == "string") try {
			t = JSON.parse(e);
		} catch {
			return;
		}
		else t = e;
		let n = new y();
		return y.serializableProperties.forEach((e) => {
			if (t && typeof t == "object" && (0, o.inOperator)(e, t)) {
				let r = t[e];
				if (r === void 0 || (0, o.inOperator)(e, v) && r === v[e]) return;
				switch (e) {
					case "key":
					case "value":
					case "sameSite":
						typeof r == "string" && (n[e] = r);
						break;
					case "expires":
					case "creation":
					case "lastAccessed":
						typeof r == "number" || typeof r == "string" || r instanceof Date ? n[e] = t[e] == "Infinity" ? "Infinity" : new Date(r) : r === null && (n[e] = null);
						break;
					case "maxAge":
						(typeof r == "number" || r === "Infinity" || r === "-Infinity") && (n[e] = r);
						break;
					case "domain":
					case "path":
						(typeof r == "string" || r === null) && (n[e] = r);
						break;
					case "secure":
					case "httpOnly":
						typeof r == "boolean" && (n[e] = r);
						break;
					case "extensions":
						Array.isArray(r) && r.every((e) => typeof e == "string") && (n[e] = r);
						break;
					case "hostOnly":
					case "pathIsDefault":
						(typeof r == "boolean" || r === null) && (n[e] = r);
						break;
				}
			}
		}), n;
	}
	var v = {
		key: "",
		value: "",
		expires: "Infinity",
		maxAge: null,
		domain: null,
		path: null,
		secure: !1,
		httpOnly: !1,
		extensions: null,
		hostOnly: null,
		pathIsDefault: null,
		creation: null,
		lastAccessed: null,
		sameSite: void 0
	}, y = class e {
		constructor(t = {}) {
			this.key = t.key ?? v.key, this.value = t.value ?? v.value, this.expires = t.expires ?? v.expires, this.maxAge = t.maxAge ?? v.maxAge, this.domain = t.domain ?? v.domain, this.path = t.path ?? v.path, this.secure = t.secure ?? v.secure, this.httpOnly = t.httpOnly ?? v.httpOnly, this.extensions = t.extensions ?? v.extensions, this.creation = t.creation ?? v.creation, this.hostOnly = t.hostOnly ?? v.hostOnly, this.pathIsDefault = t.pathIsDefault ?? v.pathIsDefault, this.lastAccessed = t.lastAccessed ?? v.lastAccessed, this.sameSite = t.sameSite ?? v.sameSite, this.creation = t.creation ?? /* @__PURE__ */ new Date(), Object.defineProperty(this, "creationIndex", {
				configurable: !1,
				enumerable: !1,
				writable: !0,
				value: ++e.cookiesCreated
			}), this.creationIndex = e.cookiesCreated;
		}
		[Symbol.for("nodejs.util.inspect.custom")]() {
			let e = Date.now(), t = this.hostOnly == null ? "?" : this.hostOnly.toString(), n = this.creation && this.creation !== "Infinity" ? `${String(e - this.creation.getTime())}ms` : "?", r = this.lastAccessed && this.lastAccessed !== "Infinity" ? `${String(e - this.lastAccessed.getTime())}ms` : "?";
			return `Cookie="${this.toString()}; hostOnly=${t}; aAge=${r}; cAge=${n}"`;
		}
		toJSON() {
			let t = {};
			for (let n of e.serializableProperties) {
				let e = this[n];
				if (e !== v[n]) switch (n) {
					case "key":
					case "value":
					case "sameSite":
						typeof e == "string" && (t[n] = e);
						break;
					case "expires":
					case "creation":
					case "lastAccessed":
						typeof e == "number" || typeof e == "string" || e instanceof Date ? t[n] = e == "Infinity" ? "Infinity" : new Date(e).toISOString() : e === null && (t[n] = null);
						break;
					case "maxAge":
						(typeof e == "number" || e === "Infinity" || e === "-Infinity") && (t[n] = e);
						break;
					case "domain":
					case "path":
						(typeof e == "string" || e === null) && (t[n] = e);
						break;
					case "secure":
					case "httpOnly":
						typeof e == "boolean" && (t[n] = e);
						break;
					case "extensions":
						Array.isArray(e) && (t[n] = e);
						break;
					case "hostOnly":
					case "pathIsDefault":
						(typeof e == "boolean" || e === null) && (t[n] = e);
						break;
				}
			}
			return t;
		}
		clone() {
			return _(this.toJSON());
		}
		validate() {
			if (!this.value || !u.test(this.value) || this.expires != "Infinity" && !(this.expires instanceof Date) && !(0, c.parseDate)(this.expires) || this.maxAge != null && this.maxAge !== "Infinity" && (this.maxAge === "-Infinity" || this.maxAge <= 0) || this.path != null && !d.test(this.path)) return !1;
			let e = this.cdomain();
			return !(e && (e.match(/\.$/) || (0, i.getPublicSuffix)(e) == null));
		}
		setExpires(e) {
			e instanceof Date ? this.expires = e : this.expires = (0, c.parseDate)(e) || "Infinity";
		}
		setMaxAge(e) {
			e === Infinity ? this.maxAge = "Infinity" : e === -Infinity ? this.maxAge = "-Infinity" : this.maxAge = e;
		}
		cookieString() {
			let e = this.value || "";
			return this.key ? `${this.key}=${e}` : e;
		}
		toString() {
			let t = this.cookieString();
			return this.expires != "Infinity" && this.expires instanceof Date && (t += `; Expires=${(0, s.formatDate)(this.expires)}`), this.maxAge != null && this.maxAge != Infinity && (t += `; Max-Age=${String(this.maxAge)}`), this.domain && !this.hostOnly && (t += `; Domain=${this.domain}`), this.path && (t += `; Path=${this.path}`), this.secure && (t += "; Secure"), this.httpOnly && (t += "; HttpOnly"), this.sameSite && this.sameSite !== "none" && (this.sameSite.toLowerCase() === e.sameSiteCanonical.lax.toLowerCase() ? t += `; SameSite=${e.sameSiteCanonical.lax}` : this.sameSite.toLowerCase() === e.sameSiteCanonical.strict.toLowerCase() ? t += `; SameSite=${e.sameSiteCanonical.strict}` : t += `; SameSite=${this.sameSite}`), this.extensions && this.extensions.forEach((e) => {
				t += `; ${e}`;
			}), t;
		}
		TTL(e = Date.now()) {
			if (this.maxAge != null && typeof this.maxAge == "number") return this.maxAge <= 0 ? 0 : this.maxAge * 1e3;
			let t = this.expires;
			return t === "Infinity" ? Infinity : (t?.getTime() ?? e) - (e || Date.now());
		}
		expiryTime(e) {
			if (this.maxAge != null) {
				let t = e || this.lastAccessed || /* @__PURE__ */ new Date(), n = typeof this.maxAge == "number" ? this.maxAge : -Infinity, r = n <= 0 ? -Infinity : n * 1e3;
				return t === "Infinity" ? Infinity : t.getTime() + r;
			}
			return this.expires == "Infinity" ? Infinity : this.expires ? this.expires.getTime() : void 0;
		}
		expiryDate(e) {
			let t = this.expiryTime(e);
			return t == Infinity ? /* @__PURE__ */ new Date(2147483647e3) : t == -Infinity ? /* @__PURE__ */ new Date(0) : t == null ? void 0 : new Date(t);
		}
		isPersistent() {
			return this.maxAge != null || this.expires != "Infinity";
		}
		canonicalizedDomain() {
			return (0, l.canonicalDomain)(this.domain);
		}
		cdomain() {
			return (0, l.canonicalDomain)(this.domain);
		}
		static parse(e, t) {
			return g(e, t);
		}
		static fromJSON(e) {
			return _(e);
		}
	};
	e.Cookie = y, y.cookiesCreated = 0, y.sameSiteLevel = {
		strict: 3,
		lax: 2,
		none: 1
	}, y.sameSiteCanonical = {
		strict: "Strict",
		lax: "Lax"
	}, y.serializableProperties = [
		"key",
		"value",
		"expires",
		"maxAge",
		"domain",
		"path",
		"secure",
		"httpOnly",
		"extensions",
		"hostOnly",
		"pathIsDefault",
		"creation",
		"lastAccessed",
		"sameSite"
	];
})), Se = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.cookieCompare = n;
	var t = 2147483647e3;
	function n(e, n) {
		let r, i = e.path ? e.path.length : 0;
		return r = (n.path ? n.path.length : 0) - i, r !== 0 || (r = (e.creation && e.creation instanceof Date ? e.creation.getTime() : t) - (n.creation && n.creation instanceof Date ? n.creation.getTime() : t), r !== 0) || (r = (e.creationIndex || 0) - (n.creationIndex || 0)), r;
	}
})), Ce = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.defaultPath = t;
	function t(e) {
		if (!e || e.slice(0, 1) !== "/") return "/";
		if (e === "/") return e;
		let t = e.lastIndexOf("/");
		return t === 0 ? "/" : e.slice(0, t);
	}
})), we = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.domainMatch = r;
	var t = ve(), n = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-f\d]{1,4}:){7}(?:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,2}|:)|(?:[a-f\d]{1,4}:){4}(?:(?::[a-f\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,3}|:)|(?:[a-f\d]{1,4}:){3}(?:(?::[a-f\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,4}|:)|(?:[a-f\d]{1,4}:){2}(?:(?::[a-f\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,5}|:)|(?:[a-f\d]{1,4}:){1}(?:(?::[a-f\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,6}|:)|(?::(?:(?::[a-f\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,7}|:)))$)/;
	function r(e, r, i) {
		if (e == null || r == null) return;
		let a, o;
		if (i === !1 ? (a = e, o = r) : (a = (0, t.canonicalDomain)(e), o = (0, t.canonicalDomain)(r)), a == null || o == null) return;
		if (a == o) return !0;
		let s = a.lastIndexOf(o);
		return s <= 0 || a.length !== o.length + s || a.substring(s - 1, s) !== "." ? !1 : !n.test(a);
	}
})), Te = /* @__PURE__ */ r(((e) => {
	var t = e && e.__createBinding || (Object.create ? (function(e, t, n, r) {
		r === void 0 && (r = n);
		var i = Object.getOwnPropertyDescriptor(t, n);
		(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}), Object.defineProperty(e, r, i);
	}) : (function(e, t, n, r) {
		r === void 0 && (r = n), e[r] = t[n];
	})), n = e && e.__setModuleDefault || (Object.create ? (function(e, t) {
		Object.defineProperty(e, "default", {
			enumerable: !0,
			value: t
		});
	}) : function(e, t) {
		e.default = t;
	}), r = e && e.__importStar || function(e) {
		if (e && e.__esModule) return e;
		var r = {};
		if (e != null) for (var i in e) i !== "default" && Object.prototype.hasOwnProperty.call(e, i) && t(r, e, i);
		return n(r, e), r;
	};
	Object.defineProperty(e, "__esModule", { value: !0 }), e.CookieJar = void 0;
	var i = z(), a = r(U()), o = U(), s = B(), c = H(), l = u(), d = xe(), f = V(), p = ve(), m = _e(), h = Ce(), g = we(), _ = Se(), v = ge(), y = {
		loose: !1,
		sameSiteContext: void 0,
		ignoreError: !1,
		http: !0
	}, b = {
		http: !0,
		expire: !0,
		allPaths: !1,
		sameSiteContext: void 0,
		sort: void 0
	}, x = "Invalid sameSiteContext option for getCookies(); expected one of \"strict\", \"lax\", or \"none\"";
	function S(e) {
		if (e && typeof e == "object" && "hostname" in e && typeof e.hostname == "string" && "pathname" in e && typeof e.pathname == "string" && "protocol" in e && typeof e.protocol == "string") return {
			hostname: e.hostname,
			pathname: e.pathname,
			protocol: e.protocol
		};
		if (typeof e == "string") try {
			return new URL(decodeURI(e));
		} catch {
			return new URL(e);
		}
		else throw new o.ParameterError("`url` argument is not a string or URL.");
	}
	function C(e) {
		let t = String(e).toLowerCase();
		if (t === "none" || t === "lax" || t === "strict") return t;
	}
	function w(e) {
		return !(typeof e.key == "string" && e.key.startsWith("__Secure-")) || e.secure;
	}
	function T(e) {
		return !(typeof e.key == "string" && e.key.startsWith("__Host-")) || !!(e.secure && e.hostOnly && e.path != null && e.path === "/");
	}
	function E(e) {
		let t = e.toLowerCase();
		switch (t) {
			case m.PrefixSecurityEnum.STRICT:
			case m.PrefixSecurityEnum.SILENT:
			case m.PrefixSecurityEnum.DISABLED: return t;
			default: return m.PrefixSecurityEnum.SILENT;
		}
	}
	e.CookieJar = class e {
		constructor(e, t) {
			typeof t == "boolean" && (t = { rejectPublicSuffixes: t }), this.rejectPublicSuffixes = t?.rejectPublicSuffixes ?? !0, this.enableLooseMode = t?.looseMode ?? !1, this.allowSpecialUseDomain = t?.allowSpecialUseDomain ?? !0, this.prefixSecurity = E(t?.prefixSecurity ?? "silent"), this.store = e ?? new c.MemoryCookieStore();
		}
		callSync(e) {
			if (!this.store.synchronous) throw Error("CookieJar store is not synchronous; use async API instead.");
			let t = null, n;
			try {
				e.call(this, (e, r) => {
					t = e, n = r;
				});
			} catch (e) {
				t = e;
			}
			if (t) throw t;
			return n;
		}
		setCookie(e, t, n, r) {
			typeof n == "function" && (r = n, n = void 0);
			let o = (0, f.createPromiseCallback)(r), s = o.callback, c;
			try {
				if (typeof t == "string" && a.validate(a.isNonEmptyString(t), r, (0, f.safeToString)(n)), c = S(t), typeof t == "function") return o.reject(/* @__PURE__ */ Error("No URL was specified"));
				if (typeof n == "function" && (n = y), a.validate(typeof s == "function", s), !a.isNonEmptyString(e) && !a.isObject(e) && e instanceof String && e.length == 0) return o.resolve(void 0);
			} catch (e) {
				return o.reject(e);
			}
			let l = (0, p.canonicalDomain)(c.hostname) ?? null, u = n?.loose || this.enableLooseMode, _ = null;
			if (n?.sameSiteContext && (_ = C(n.sameSiteContext), !_)) return o.reject(/* @__PURE__ */ Error(x));
			if (typeof e == "string" || e instanceof String) {
				let t = d.Cookie.parse(e.toString(), { loose: u });
				if (!t) {
					let e = /* @__PURE__ */ Error("Cookie failed to parse");
					return n?.ignoreError ? o.resolve(void 0) : o.reject(e);
				}
				e = t;
			} else if (!(e instanceof d.Cookie)) {
				let e = /* @__PURE__ */ Error("First argument to setCookie must be a Cookie object or string");
				return n?.ignoreError ? o.resolve(void 0) : o.reject(e);
			}
			let v = n?.now || /* @__PURE__ */ new Date();
			if (this.rejectPublicSuffixes && e.domain) try {
				let t = e.cdomain();
				if ((typeof t == "string" ? (0, i.getPublicSuffix)(t, {
					allowSpecialUseDomain: this.allowSpecialUseDomain,
					ignoreError: n?.ignoreError
				}) : null) == null && !m.IP_V6_REGEX_OBJECT.test(e.domain)) {
					let e = /* @__PURE__ */ Error("Cookie has domain set to a public suffix");
					return n?.ignoreError ? o.resolve(void 0) : o.reject(e);
				}
			} catch (e) {
				return n?.ignoreError ? o.resolve(void 0) : o.reject(e);
			}
			if (e.domain) {
				if (!(0, g.domainMatch)(l ?? void 0, e.cdomain() ?? void 0, !1)) {
					let t = /* @__PURE__ */ Error(`Cookie not in this host's domain. Cookie:${e.cdomain() ?? "null"} Request:${l ?? "null"}`);
					return n?.ignoreError ? o.resolve(void 0) : o.reject(t);
				}
				e.hostOnly ??= !1;
			} else e.hostOnly = !0, e.domain = l;
			if ((!e.path || e.path[0] !== "/") && (e.path = (0, h.defaultPath)(c.pathname), e.pathIsDefault = !0), n?.http === !1 && e.httpOnly) {
				let e = /* @__PURE__ */ Error("Cookie is HttpOnly and this isn't an HTTP API");
				return n.ignoreError ? o.resolve(void 0) : o.reject(e);
			}
			if (e.sameSite !== "none" && e.sameSite !== void 0 && _ && _ === "none") {
				let e = /* @__PURE__ */ Error("Cookie is SameSite but this is a cross-origin request");
				return n?.ignoreError ? o.resolve(void 0) : o.reject(e);
			}
			let b = this.prefixSecurity === m.PrefixSecurityEnum.SILENT;
			if (this.prefixSecurity !== m.PrefixSecurityEnum.DISABLED) {
				let t = !1, r;
				if (w(e) ? T(e) || (t = !0, r = "Cookie has __Host prefix but either Secure or HostOnly attribute is not set or Path is not '/'") : (t = !0, r = "Cookie has __Secure prefix but Secure attribute is not set"), t) return n?.ignoreError || b ? o.resolve(void 0) : o.reject(Error(r));
			}
			let E = this.store;
			return E.updateCookie ||= async function(e, t, n) {
				return this.putCookie(t).then(() => n?.(null), (e) => n?.(e));
			}, E.findCookie(e.domain, e.path, e.key, function(t, r) {
				if (t) {
					s(t);
					return;
				}
				let i = function(t) {
					t ? s(t) : typeof e == "string" ? s(null, void 0) : s(null, e);
				};
				if (r) {
					if (n && "http" in n && n.http === !1 && r.httpOnly) {
						t = /* @__PURE__ */ Error("old Cookie is HttpOnly and this isn't an HTTP API"), n.ignoreError ? s(null, void 0) : s(t);
						return;
					}
					e instanceof d.Cookie && (e.creation = r.creation, e.creationIndex = r.creationIndex, e.lastAccessed = v, E.updateCookie(r, e, i));
				} else e instanceof d.Cookie && (e.creation = e.lastAccessed = v, E.putCookie(e, i));
			}), o.promise;
		}
		setCookieSync(e, t, n) {
			let r = n ? this.setCookie.bind(this, e, t, n) : this.setCookie.bind(this, e, t);
			return this.callSync(r);
		}
		getCookies(e, t, n) {
			typeof t == "function" ? (n = t, t = b) : t === void 0 && (t = b);
			let r = (0, f.createPromiseCallback)(n), i = r.callback, o;
			try {
				typeof e == "string" && a.validate(a.isNonEmptyString(e), i, e), o = S(e), a.validate(a.isObject(t), i, (0, f.safeToString)(t)), a.validate(typeof i == "function", i);
			} catch (e) {
				return r.reject(e);
			}
			let s = (0, p.canonicalDomain)(o.hostname), c = o.pathname || "/", u = o.protocol && (o.protocol == "https:" || o.protocol == "wss:"), m = 0;
			if (t.sameSiteContext) {
				let e = C(t.sameSiteContext);
				if (e == null || (m = d.Cookie.sameSiteLevel[e], !m)) return r.reject(/* @__PURE__ */ Error(x));
			}
			let h = t.http ?? !0, v = Date.now(), y = t.expire ?? !0, w = t.allPaths ?? !1, T = this.store;
			function E(e) {
				if (e.hostOnly) {
					if (e.domain != s) return !1;
				} else if (!(0, g.domainMatch)(s ?? void 0, e.domain ?? void 0, !1)) return !1;
				if (!w && typeof e.path == "string" && !(0, l.pathMatch)(c, e.path) || e.secure && !u || e.httpOnly && !h) return !1;
				if (m) {
					let t;
					if (t = e.sameSite === "lax" ? d.Cookie.sameSiteLevel.lax : e.sameSite === "strict" ? d.Cookie.sameSiteLevel.strict : d.Cookie.sameSiteLevel.none, t > m) return !1;
				}
				let t = e.expiryTime();
				return y && t != null && t <= v ? (T.removeCookie(e.domain, e.path, e.key, () => {}), !1) : !0;
			}
			return T.findCookies(s, w ? null : c, this.allowSpecialUseDomain, (e, n) => {
				if (e) {
					i(e);
					return;
				}
				if (n == null) {
					i(null, []);
					return;
				}
				n = n.filter(E), "sort" in t && t.sort !== !1 && (n = n.sort(_.cookieCompare));
				let r = /* @__PURE__ */ new Date();
				for (let e of n) e.lastAccessed = r;
				i(null, n);
			}), r.promise;
		}
		getCookiesSync(e, t) {
			return this.callSync(this.getCookies.bind(this, e, t)) ?? [];
		}
		getCookieString(e, t, n) {
			typeof t == "function" && (n = t, t = void 0);
			let r = (0, f.createPromiseCallback)(n);
			return this.getCookies(e, t, function(e, t) {
				e ? r.callback(e) : r.callback(null, t?.sort(_.cookieCompare).map((e) => e.cookieString()).join("; "));
			}), r.promise;
		}
		getCookieStringSync(e, t) {
			return this.callSync(t ? this.getCookieString.bind(this, e, t) : this.getCookieString.bind(this, e)) ?? "";
		}
		getSetCookieStrings(e, t, n) {
			typeof t == "function" && (n = t, t = void 0);
			let r = (0, f.createPromiseCallback)(n);
			return this.getCookies(e, t, function(e, t) {
				e ? r.callback(e) : r.callback(null, t?.map((e) => e.toString()));
			}), r.promise;
		}
		getSetCookieStringsSync(e, t = {}) {
			return this.callSync(this.getSetCookieStrings.bind(this, e, t)) ?? [];
		}
		serialize(e) {
			let t = (0, f.createPromiseCallback)(e), n = this.store.constructor.name;
			a.isObject(n) && (n = null);
			let r = {
				version: `tough-cookie@${v.version}`,
				storeType: n,
				rejectPublicSuffixes: this.rejectPublicSuffixes,
				enableLooseMode: this.enableLooseMode,
				allowSpecialUseDomain: this.allowSpecialUseDomain,
				prefixSecurity: E(this.prefixSecurity),
				cookies: []
			};
			return typeof this.store.getAllCookies == "function" ? (this.store.getAllCookies((e, n) => {
				if (e) {
					t.callback(e);
					return;
				}
				if (n == null) {
					t.callback(null, r);
					return;
				}
				r.cookies = n.map((e) => {
					let t = e.toJSON();
					return delete t.creationIndex, t;
				}), t.callback(null, r);
			}), t.promise) : t.reject(/* @__PURE__ */ Error("store does not support getAllCookies and cannot be serialized"));
		}
		serializeSync() {
			return this.callSync((e) => {
				this.serialize(e);
			});
		}
		toJSON() {
			return this.serializeSync();
		}
		_importCookies(e, t) {
			let n;
			if (e && typeof e == "object" && (0, f.inOperator)("cookies", e) && Array.isArray(e.cookies) && (n = e.cookies), !n) {
				t(/* @__PURE__ */ Error("serialized jar has no cookies array"), void 0);
				return;
			}
			n = n.slice();
			let r = (e) => {
				if (e) {
					t(e, void 0);
					return;
				}
				if (Array.isArray(n)) {
					if (!n.length) {
						t(e, this);
						return;
					}
					let i;
					try {
						i = d.Cookie.fromJSON(n.shift());
					} catch (e) {
						t(e instanceof Error ? e : /* @__PURE__ */ Error(), void 0);
						return;
					}
					if (i === void 0) {
						r(null);
						return;
					}
					this.store.putCookie(i, r);
				}
			};
			r(null);
		}
		_importCookiesSync(e) {
			this.callSync(this._importCookies.bind(this, e));
		}
		clone(t, n) {
			typeof t == "function" && (n = t, t = void 0);
			let r = (0, f.createPromiseCallback)(n), i = r.callback;
			return this.serialize((n, a) => n ? r.reject(n) : e.deserialize(a ?? "", t, i)), r.promise;
		}
		_cloneSync(e) {
			let t = e && typeof e != "function" ? this.clone.bind(this, e) : this.clone.bind(this);
			return this.callSync((e) => {
				t(e);
			});
		}
		cloneSync(e) {
			if (!e) return this._cloneSync();
			if (!e.synchronous) throw Error("CookieJar clone destination store is not synchronous; use async API instead.");
			return this._cloneSync(e);
		}
		removeAllCookies(e) {
			let t = (0, f.createPromiseCallback)(e), n = t.callback, r = this.store;
			return typeof r.removeAllCookies == "function" && r.removeAllCookies !== s.Store.prototype.removeAllCookies ? (r.removeAllCookies(n), t.promise) : (r.getAllCookies((e, t) => {
				if (e) {
					n(e);
					return;
				}
				if (t ||= [], t.length === 0) {
					n(null, void 0);
					return;
				}
				let i = 0, a = [], o = function(e) {
					if (e && a.push(e), i++, i === t.length) {
						a[0] ? n(a[0]) : n(null, void 0);
						return;
					}
				};
				t.forEach((e) => {
					r.removeCookie(e.domain, e.path, e.key, o);
				});
			}), t.promise);
		}
		removeAllCookiesSync() {
			this.callSync((e) => {
				this.removeAllCookies(e);
			});
		}
		static deserialize(t, n, r) {
			typeof n == "function" && (r = n, n = void 0);
			let i = (0, f.createPromiseCallback)(r), a;
			if (typeof t == "string") try {
				a = JSON.parse(t);
			} catch (e) {
				return i.reject(e instanceof Error ? e : /* @__PURE__ */ Error());
			}
			else a = t;
			let o = (e) => a && typeof a == "object" && (0, f.inOperator)(e, a) ? a[e] : void 0, s = (e) => {
				let t = o(e);
				return typeof t == "boolean" ? t : void 0;
			}, c = new e(n, {
				rejectPublicSuffixes: s("rejectPublicSuffixes"),
				looseMode: s("enableLooseMode"),
				allowSpecialUseDomain: s("allowSpecialUseDomain"),
				prefixSecurity: E(((e) => {
					let t = o(e);
					return typeof t == "string" ? t : void 0;
				})("prefixSecurity") ?? "silent")
			});
			return c._importCookies(a, (e) => {
				if (e) {
					i.callback(e);
					return;
				}
				i.callback(null, c);
			}), i.promise;
		}
		static deserializeSync(t, n) {
			let r = typeof t == "string" ? JSON.parse(t) : t, i = (e) => r && typeof r == "object" && (0, f.inOperator)(e, r) ? r[e] : void 0, a = (e) => {
				let t = i(e);
				return typeof t == "boolean" ? t : void 0;
			}, o = new e(n, {
				rejectPublicSuffixes: a("rejectPublicSuffixes"),
				looseMode: a("enableLooseMode"),
				allowSpecialUseDomain: a("allowSpecialUseDomain"),
				prefixSecurity: E(((e) => {
					let t = i(e);
					return typeof t == "string" ? t : void 0;
				})("prefixSecurity") ?? "silent")
			});
			if (!o.store.synchronous) throw Error("CookieJar store is not synchronous; use async API instead.");
			return o._importCookiesSync(r), o;
		}
		static fromJSON(t, n) {
			return e.deserializeSync(t, n);
		}
	};
})), Ee = /* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.permutePath = t;
	function t(e) {
		if (e === "/") return ["/"];
		let t = [e];
		for (; e.length > 1;) {
			let n = e.lastIndexOf("/");
			if (n === 0) break;
			e = e.slice(0, n), t.push(e);
		}
		return t.push("/"), t;
	}
})), W = (/* @__PURE__ */ r(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.permutePath = e.parseDate = e.formatDate = e.domainMatch = e.defaultPath = e.CookieJar = e.cookieCompare = e.Cookie = e.PrefixSecurityEnum = e.canonicalDomain = e.version = e.ParameterError = e.Store = e.getPublicSuffix = e.permuteDomain = e.pathMatch = e.MemoryCookieStore = void 0;
	var t = H();
	Object.defineProperty(e, "MemoryCookieStore", {
		enumerable: !0,
		get: function() {
			return t.MemoryCookieStore;
		}
	});
	var n = u();
	Object.defineProperty(e, "pathMatch", {
		enumerable: !0,
		get: function() {
			return n.pathMatch;
		}
	});
	var r = he();
	Object.defineProperty(e, "permuteDomain", {
		enumerable: !0,
		get: function() {
			return r.permuteDomain;
		}
	});
	var i = z();
	Object.defineProperty(e, "getPublicSuffix", {
		enumerable: !0,
		get: function() {
			return i.getPublicSuffix;
		}
	});
	var a = B();
	Object.defineProperty(e, "Store", {
		enumerable: !0,
		get: function() {
			return a.Store;
		}
	});
	var o = U();
	Object.defineProperty(e, "ParameterError", {
		enumerable: !0,
		get: function() {
			return o.ParameterError;
		}
	});
	var s = ge();
	Object.defineProperty(e, "version", {
		enumerable: !0,
		get: function() {
			return s.version;
		}
	});
	var c = ve();
	Object.defineProperty(e, "canonicalDomain", {
		enumerable: !0,
		get: function() {
			return c.canonicalDomain;
		}
	});
	var l = _e();
	Object.defineProperty(e, "PrefixSecurityEnum", {
		enumerable: !0,
		get: function() {
			return l.PrefixSecurityEnum;
		}
	});
	var d = xe();
	Object.defineProperty(e, "Cookie", {
		enumerable: !0,
		get: function() {
			return d.Cookie;
		}
	});
	var f = Se();
	Object.defineProperty(e, "cookieCompare", {
		enumerable: !0,
		get: function() {
			return f.cookieCompare;
		}
	});
	var p = Te();
	Object.defineProperty(e, "CookieJar", {
		enumerable: !0,
		get: function() {
			return p.CookieJar;
		}
	});
	var m = Ce();
	Object.defineProperty(e, "defaultPath", {
		enumerable: !0,
		get: function() {
			return m.defaultPath;
		}
	});
	var h = we();
	Object.defineProperty(e, "domainMatch", {
		enumerable: !0,
		get: function() {
			return h.domainMatch;
		}
	});
	var g = ye();
	Object.defineProperty(e, "formatDate", {
		enumerable: !0,
		get: function() {
			return g.formatDate;
		}
	});
	var _ = be();
	Object.defineProperty(e, "parseDate", {
		enumerable: !0,
		get: function() {
			return _.parseDate;
		}
	});
	var v = Ee();
	Object.defineProperty(e, "permutePath", {
		enumerable: !0,
		get: function() {
			return v.permutePath;
		}
	}), xe();
})))(), De = class extends W.CookieJar {
	async setFromSetCookieHeaders(e, t) {
		let n;
		if (e === void 0 || (e instanceof Array ? n = e.map((e) => W.Cookie.parse(e)) : typeof e == "string" && (n = [W.Cookie.parse(e)])), n) for (let e of n) e instanceof W.Cookie && await this.setCookie(e, t);
	}
}, Oe = {
	info: (...e) => console.log(...e),
	warn: (...e) => console.warn(...e),
	error: (...e) => console.error(...e),
	dir: (...e) => console.dir(...e),
	debug: (...e) => {}
};
function ke(e) {
	if (typeof e != "object" || !e) throw Error("logger must be an object");
	for (let t of [
		"info",
		"warn",
		"error",
		"debug",
		"dir"
	]) {
		if (!(t in e)) throw Error(`logger.${t} is required`);
		if (typeof e[t] != "function") throw Error(`logger.${t} must be a function`);
	}
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/options/options.schema.js
var Ae = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		YahooFinanceOptions: {
			type: "object",
			properties: {
				YF_QUERY_HOST: { type: "string" },
				queue: { $ref: "#/definitions/QueueOptions" },
				validation: { $ref: "#/definitions/ValidationOptions" },
				suppressNotices: {
					type: "array",
					items: { $ref: "#/definitions/NOTICE_IDS" }
				},
				quoteCombine: { $ref: "#/definitions/QuoteCombineOptions" },
				versionCheck: { type: "boolean" },
				cookieJar: { $ref: "#/definitions/ExtendedCookieJar" },
				logger: { $ref: "#/definitions/Logger" },
				fetch: {},
				fetchOptions: {
					type: "object",
					properties: {
						body: { anyOf: [
							{
								type: "object",
								properties: { locked: { type: "boolean" } },
								required: ["locked"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									size: { type: "number" },
									type: { type: "string" }
								},
								required: ["size", "type"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									buffer: {
										type: "object",
										properties: { byteLength: { type: "number" } },
										required: ["byteLength"],
										additionalProperties: !1
									},
									byteLength: { type: "number" },
									byteOffset: { type: "number" }
								},
								required: [
									"buffer",
									"byteLength",
									"byteOffset"
								],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { byteLength: { type: "number" } },
								required: ["byteLength"],
								additionalProperties: !1
							},
							{
								type: "object",
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { size: { type: "number" } },
								required: ["size"],
								additionalProperties: !1
							},
							{ type: "string" },
							{ type: "null" }
						] },
						cache: {
							type: "string",
							enum: [
								"default",
								"force-cache",
								"no-cache",
								"no-store",
								"only-if-cached",
								"reload"
							]
						},
						credentials: {
							type: "string",
							enum: [
								"include",
								"omit",
								"same-origin"
							]
						},
						headers: { anyOf: [
							{
								type: "array",
								items: {
									type: "array",
									items: { type: "string" },
									minItems: 2,
									maxItems: 2
								}
							},
							{
								type: "object",
								additionalProperties: { type: "string" }
							},
							{
								type: "object",
								additionalProperties: !1
							}
						] },
						integrity: { type: "string" },
						keepalive: { type: "boolean" },
						method: { type: "string" },
						mode: {
							type: "string",
							enum: [
								"cors",
								"navigate",
								"no-cors",
								"same-origin"
							]
						},
						priority: {
							type: "string",
							enum: [
								"auto",
								"high",
								"low"
							]
						},
						redirect: {
							type: "string",
							enum: [
								"error",
								"follow",
								"manual"
							]
						},
						referrer: { type: "string" },
						referrerPolicy: {
							type: "string",
							enum: [
								"",
								"no-referrer",
								"no-referrer-when-downgrade",
								"origin",
								"origin-when-cross-origin",
								"same-origin",
								"strict-origin",
								"strict-origin-when-cross-origin",
								"unsafe-url"
							]
						},
						signal: { anyOf: [{
							type: "object",
							properties: {
								aborted: { type: "boolean" },
								onabort: { anyOf: [{}, { type: "null" }] },
								reason: {}
							},
							required: [
								"aborted",
								"onabort",
								"reason"
							],
							additionalProperties: !1
						}, { type: "null" }] },
						window: { type: "null" }
					},
					additionalProperties: !1
				}
			},
			additionalProperties: !1
		},
		QueueOptions: {
			type: "object",
			properties: {
				concurrency: { type: "number" },
				interval: { type: "number" }
			},
			additionalProperties: !1
		},
		ValidationOptions: {
			type: "object",
			properties: {
				logErrors: { type: "boolean" },
				logOptionsErrors: { type: "boolean" },
				allowAdditionalProps: { type: "boolean" }
			},
			additionalProperties: !1
		},
		NOTICE_IDS: {
			type: "string",
			enum: ["yahooSurvey", "ripHistorical"]
		},
		QuoteCombineOptions: {
			type: "object",
			properties: {
				maxSymbolsPerRequest: { type: "number" },
				debounceTime: { type: "number" }
			},
			additionalProperties: !1
		},
		ExtendedCookieJar: {
			type: "object",
			additionalProperties: !1,
			properties: {
				store: { $ref: "#/definitions/Store" },
				prefixSecurity: { type: "string" }
			},
			required: ["prefixSecurity", "store"]
		},
		CookieJar: {
			type: "object",
			properties: {
				store: { $ref: "#/definitions/Store" },
				prefixSecurity: { type: "string" }
			},
			required: ["store", "prefixSecurity"],
			additionalProperties: !1
		},
		Store: {
			type: "object",
			properties: { synchronous: { type: "boolean" } },
			required: ["synchronous"],
			additionalProperties: !1
		},
		Logger: {
			type: "object",
			properties: {
				info: {},
				warn: {},
				error: {},
				debug: {},
				dir: {}
			},
			required: [
				"info",
				"warn",
				"error",
				"debug",
				"dir"
			],
			additionalProperties: !1
		},
		mergeObjects: {},
		validateOptions: {},
		setOptions: {},
		YahooFinanceFetchModuleOptions: {
			type: "object",
			properties: {
				devel: {
					type: "object",
					properties: {
						id: { type: "string" },
						t: {},
						onFinish: {}
					},
					required: [
						"id",
						"t",
						"onFinish"
					],
					additionalProperties: !1
				},
				fetch: {},
				fetchOptions: {
					type: "object",
					properties: {
						body: { anyOf: [
							{
								type: "object",
								properties: { locked: { type: "boolean" } },
								required: ["locked"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									size: { type: "number" },
									type: { type: "string" }
								},
								required: ["size", "type"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									buffer: {
										type: "object",
										properties: { byteLength: { type: "number" } },
										required: ["byteLength"],
										additionalProperties: !1
									},
									byteLength: { type: "number" },
									byteOffset: { type: "number" }
								},
								required: [
									"buffer",
									"byteLength",
									"byteOffset"
								],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { byteLength: { type: "number" } },
								required: ["byteLength"],
								additionalProperties: !1
							},
							{
								type: "object",
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { size: { type: "number" } },
								required: ["size"],
								additionalProperties: !1
							},
							{ type: "string" },
							{ type: "null" }
						] },
						cache: {
							type: "string",
							enum: [
								"default",
								"force-cache",
								"no-cache",
								"no-store",
								"only-if-cached",
								"reload"
							]
						},
						credentials: {
							type: "string",
							enum: [
								"include",
								"omit",
								"same-origin"
							]
						},
						headers: { anyOf: [
							{
								type: "array",
								items: {
									type: "array",
									items: { type: "string" },
									minItems: 2,
									maxItems: 2
								}
							},
							{
								type: "object",
								additionalProperties: { type: "string" }
							},
							{
								type: "object",
								additionalProperties: !1
							}
						] },
						integrity: { type: "string" },
						keepalive: { type: "boolean" },
						method: { type: "string" },
						mode: {
							type: "string",
							enum: [
								"cors",
								"navigate",
								"no-cors",
								"same-origin"
							]
						},
						priority: {
							type: "string",
							enum: [
								"auto",
								"high",
								"low"
							]
						},
						redirect: {
							type: "string",
							enum: [
								"error",
								"follow",
								"manual"
							]
						},
						referrer: { type: "string" },
						referrerPolicy: {
							type: "string",
							enum: [
								"",
								"no-referrer",
								"no-referrer-when-downgrade",
								"origin",
								"origin-when-cross-origin",
								"same-origin",
								"strict-origin",
								"strict-origin-when-cross-origin",
								"unsafe-url"
							]
						},
						signal: { anyOf: [{
							type: "object",
							properties: {
								aborted: { type: "boolean" },
								onabort: { anyOf: [{}, { type: "null" }] },
								reason: {}
							},
							required: [
								"aborted",
								"onabort",
								"reason"
							],
							additionalProperties: !1
						}, { type: "null" }] },
						window: { type: "null" }
					},
					additionalProperties: !1
				},
				queue: { $ref: "#/definitions/QueueOptions" }
			},
			additionalProperties: !1
		},
		ModuleOptions: {
			type: "object",
			properties: {
				devel: {
					type: "object",
					properties: {
						id: { type: "string" },
						t: {},
						onFinish: {}
					},
					required: [
						"id",
						"t",
						"onFinish"
					],
					additionalProperties: !1
				},
				fetch: {},
				fetchOptions: {
					type: "object",
					properties: {
						body: { anyOf: [
							{
								type: "object",
								properties: { locked: { type: "boolean" } },
								required: ["locked"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									size: { type: "number" },
									type: { type: "string" }
								},
								required: ["size", "type"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									buffer: {
										type: "object",
										properties: { byteLength: { type: "number" } },
										required: ["byteLength"],
										additionalProperties: !1
									},
									byteLength: { type: "number" },
									byteOffset: { type: "number" }
								},
								required: [
									"buffer",
									"byteLength",
									"byteOffset"
								],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { byteLength: { type: "number" } },
								required: ["byteLength"],
								additionalProperties: !1
							},
							{
								type: "object",
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { size: { type: "number" } },
								required: ["size"],
								additionalProperties: !1
							},
							{ type: "string" },
							{ type: "null" }
						] },
						cache: {
							type: "string",
							enum: [
								"default",
								"force-cache",
								"no-cache",
								"no-store",
								"only-if-cached",
								"reload"
							]
						},
						credentials: {
							type: "string",
							enum: [
								"include",
								"omit",
								"same-origin"
							]
						},
						headers: { anyOf: [
							{
								type: "array",
								items: {
									type: "array",
									items: { type: "string" },
									minItems: 2,
									maxItems: 2
								}
							},
							{
								type: "object",
								additionalProperties: { type: "string" }
							},
							{
								type: "object",
								additionalProperties: !1
							}
						] },
						integrity: { type: "string" },
						keepalive: { type: "boolean" },
						method: { type: "string" },
						mode: {
							type: "string",
							enum: [
								"cors",
								"navigate",
								"no-cors",
								"same-origin"
							]
						},
						priority: {
							type: "string",
							enum: [
								"auto",
								"high",
								"low"
							]
						},
						redirect: {
							type: "string",
							enum: [
								"error",
								"follow",
								"manual"
							]
						},
						referrer: { type: "string" },
						referrerPolicy: {
							type: "string",
							enum: [
								"",
								"no-referrer",
								"no-referrer-when-downgrade",
								"origin",
								"origin-when-cross-origin",
								"same-origin",
								"strict-origin",
								"strict-origin-when-cross-origin",
								"unsafe-url"
							]
						},
						signal: { anyOf: [{
							type: "object",
							properties: {
								aborted: { type: "boolean" },
								onabort: { anyOf: [{}, { type: "null" }] },
								reason: {}
							},
							required: [
								"aborted",
								"onabort",
								"reason"
							],
							additionalProperties: !1
						}, { type: "null" }] },
						window: { type: "null" }
					},
					additionalProperties: !1
				},
				queue: { $ref: "#/definitions/QueueOptions" },
				validateOptions: { type: "boolean" },
				validateResult: { type: "boolean" }
			},
			additionalProperties: !1
		},
		ModuleOptionsWithValidateFalse: {
			type: "object",
			properties: {
				devel: {
					type: "object",
					properties: {
						id: { type: "string" },
						t: {},
						onFinish: {}
					},
					required: [
						"id",
						"t",
						"onFinish"
					],
					additionalProperties: !1
				},
				fetch: {},
				fetchOptions: {
					type: "object",
					properties: {
						body: { anyOf: [
							{
								type: "object",
								properties: { locked: { type: "boolean" } },
								required: ["locked"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									size: { type: "number" },
									type: { type: "string" }
								},
								required: ["size", "type"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									buffer: {
										type: "object",
										properties: { byteLength: { type: "number" } },
										required: ["byteLength"],
										additionalProperties: !1
									},
									byteLength: { type: "number" },
									byteOffset: { type: "number" }
								},
								required: [
									"buffer",
									"byteLength",
									"byteOffset"
								],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { byteLength: { type: "number" } },
								required: ["byteLength"],
								additionalProperties: !1
							},
							{
								type: "object",
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { size: { type: "number" } },
								required: ["size"],
								additionalProperties: !1
							},
							{ type: "string" },
							{ type: "null" }
						] },
						cache: {
							type: "string",
							enum: [
								"default",
								"force-cache",
								"no-cache",
								"no-store",
								"only-if-cached",
								"reload"
							]
						},
						credentials: {
							type: "string",
							enum: [
								"include",
								"omit",
								"same-origin"
							]
						},
						headers: { anyOf: [
							{
								type: "array",
								items: {
									type: "array",
									items: { type: "string" },
									minItems: 2,
									maxItems: 2
								}
							},
							{
								type: "object",
								additionalProperties: { type: "string" }
							},
							{
								type: "object",
								additionalProperties: !1
							}
						] },
						integrity: { type: "string" },
						keepalive: { type: "boolean" },
						method: { type: "string" },
						mode: {
							type: "string",
							enum: [
								"cors",
								"navigate",
								"no-cors",
								"same-origin"
							]
						},
						priority: {
							type: "string",
							enum: [
								"auto",
								"high",
								"low"
							]
						},
						redirect: {
							type: "string",
							enum: [
								"error",
								"follow",
								"manual"
							]
						},
						referrer: { type: "string" },
						referrerPolicy: {
							type: "string",
							enum: [
								"",
								"no-referrer",
								"no-referrer-when-downgrade",
								"origin",
								"origin-when-cross-origin",
								"same-origin",
								"strict-origin",
								"strict-origin-when-cross-origin",
								"unsafe-url"
							]
						},
						signal: { anyOf: [{
							type: "object",
							properties: {
								aborted: { type: "boolean" },
								onabort: { anyOf: [{}, { type: "null" }] },
								reason: {}
							},
							required: [
								"aborted",
								"onabort",
								"reason"
							],
							additionalProperties: !1
						}, { type: "null" }] },
						window: { type: "null" }
					},
					additionalProperties: !1
				},
				queue: { $ref: "#/definitions/QueueOptions" },
				validateOptions: { type: "boolean" },
				validateResult: {
					type: "boolean",
					const: !1
				}
			},
			required: ["validateResult"],
			additionalProperties: !1
		},
		ModuleOptionsWithValidateTrue: {
			type: "object",
			properties: {
				devel: {
					type: "object",
					properties: {
						id: { type: "string" },
						t: {},
						onFinish: {}
					},
					required: [
						"id",
						"t",
						"onFinish"
					],
					additionalProperties: !1
				},
				fetch: {},
				fetchOptions: {
					type: "object",
					properties: {
						body: { anyOf: [
							{
								type: "object",
								properties: { locked: { type: "boolean" } },
								required: ["locked"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									size: { type: "number" },
									type: { type: "string" }
								},
								required: ["size", "type"],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: {
									buffer: {
										type: "object",
										properties: { byteLength: { type: "number" } },
										required: ["byteLength"],
										additionalProperties: !1
									},
									byteLength: { type: "number" },
									byteOffset: { type: "number" }
								},
								required: [
									"buffer",
									"byteLength",
									"byteOffset"
								],
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { byteLength: { type: "number" } },
								required: ["byteLength"],
								additionalProperties: !1
							},
							{
								type: "object",
								additionalProperties: !1
							},
							{
								type: "object",
								properties: { size: { type: "number" } },
								required: ["size"],
								additionalProperties: !1
							},
							{ type: "string" },
							{ type: "null" }
						] },
						cache: {
							type: "string",
							enum: [
								"default",
								"force-cache",
								"no-cache",
								"no-store",
								"only-if-cached",
								"reload"
							]
						},
						credentials: {
							type: "string",
							enum: [
								"include",
								"omit",
								"same-origin"
							]
						},
						headers: { anyOf: [
							{
								type: "array",
								items: {
									type: "array",
									items: { type: "string" },
									minItems: 2,
									maxItems: 2
								}
							},
							{
								type: "object",
								additionalProperties: { type: "string" }
							},
							{
								type: "object",
								additionalProperties: !1
							}
						] },
						integrity: { type: "string" },
						keepalive: { type: "boolean" },
						method: { type: "string" },
						mode: {
							type: "string",
							enum: [
								"cors",
								"navigate",
								"no-cors",
								"same-origin"
							]
						},
						priority: {
							type: "string",
							enum: [
								"auto",
								"high",
								"low"
							]
						},
						redirect: {
							type: "string",
							enum: [
								"error",
								"follow",
								"manual"
							]
						},
						referrer: { type: "string" },
						referrerPolicy: {
							type: "string",
							enum: [
								"",
								"no-referrer",
								"no-referrer-when-downgrade",
								"origin",
								"origin-when-cross-origin",
								"same-origin",
								"strict-origin",
								"strict-origin-when-cross-origin",
								"unsafe-url"
							]
						},
						signal: { anyOf: [{
							type: "object",
							properties: {
								aborted: { type: "boolean" },
								onabort: { anyOf: [{}, { type: "null" }] },
								reason: {}
							},
							required: [
								"aborted",
								"onabort",
								"reason"
							],
							additionalProperties: !1
						}, { type: "null" }] },
						window: { type: "null" }
					},
					additionalProperties: !1
				},
				queue: { $ref: "#/definitions/QueueOptions" },
				validateOptions: { type: "boolean" },
				validateResult: {
					type: "boolean",
					const: !0
				}
			},
			additionalProperties: !1
		},
		ModuleThis: {
			type: "object",
			properties: { _moduleExec: {} },
			required: ["_moduleExec"]
		},
		ModuleError: {
			type: "object",
			properties: {
				name: { type: "string" },
				message: { type: "string" },
				stack: { type: "string" }
			},
			required: ["name", "message"],
			additionalProperties: !1
		}
	}
}, G = {
	name: "@gadicc/yahoo-finance2",
	version: "3.15.3",
	tasks: {
		cli: "deno run -A bin/yahoo-finance.ts",
		"docs:gen": "deno doc --output=jsdocs --html $(jq -r '.exports | to_entries[] | .value' deno.json)",
		"docs:lint": "deno doc --output=jsdocs --lint --html $(jq -r '.exports | to_entries[] | .value' deno.json)",
		"docs:open": "xdg-open file://$(pwd)/jsdocs/index.html",
		"docs:watch": "deno eval 'const run=async()=>{const p=new Deno.Command(\"deno\",{args:[\"task\",\"docs:gen\"],stdout:\"inherit\",stderr:\"inherit\"}).spawn(); const {code}=await p.status; if(code) console.error(\"[docs:gen] exited\", code);}; let t; const kick=()=>{clearTimeout(t); t=setTimeout(run,120)}; await run(); for await(const _ of Deno.watchFs([\"src\",\"docs\",\"scripts\",\"README.md\"])) kick();'",
		"install-cli": "deno install -A --global -n yahoo-finance npm:yahoo-finance/bin/yahoo-finance.ts",
		schema_: "TODO below... separate watch mode, vscode scripts, mtime check, etc",
		schema: "deno run -A scripts/schema-gen.ts",
		test: "deno test --no-prompt -P=test --parallel --ignore=tests/cloudflare",
		"test:serial": "deno test --no-prompt -P=test --ignore=tests/cloudflare",
		"test:cloudflare": "deno task build:npm && npm ci --prefix tests/cloudflare && npm test --prefix tests/cloudflare",
		"lock:cloudflare": "npx -p npm@10.9.4 npm install --prefix tests/cloudflare --package-lock-only",
		"build:npm": "deno run -A scripts/build_npm.ts",
		devTODO: "deno run --watch main.ts"
	},
	permissions: { test: {
		read: ["./tests/fixtures/http", "./tests/http"],
		write: ["./tests/fixtures/http"],
		env: {
			allow: [
				"FETCH_DEVEL",
				"FETCH_DEVEL_RECACHE_CONCURRENCY",
				"FETCH_DEVEL_RECACHE_INTERVAL"
			],
			ignore: !0
		},
		net: [
			"query1.finance.yahoo.com",
			"query2.finance.yahoo.com",
			"finance.yahoo.com",
			"guce.yahoo.com",
			"consent.yahoo.com"
		]
	} },
	test: { permissions: "test" },
	exports: {
		"./src/index.ts": "./src/index.ts",
		".": "./src/index.ts",
		"./createYahooFinance": "./src/createYahooFinance.ts",
		"./mcp": "./src/mcp/mod.ts",
		"./mcp/http": "./src/mcp/http.ts",
		"./mcp/server": "./src/mcp/server.ts",
		"./modules": "./src/modules/index.ts",
		"./modules/autoc": "./src/modules/autoc.ts",
		"./modules/chart": "./src/modules/chart.ts",
		"./modules/dailyGainers": "./src/modules/dailyGainers.ts",
		"./modules/dailyLosers": "./src/modules/dailyLosers.ts",
		"./modules/fundamentalsTimeSeries": "./src/modules/fundamentalsTimeSeries.ts",
		"./modules/historical": "./src/modules/historical.ts",
		"./modules/insights": "./src/modules/insights.ts",
		"./modules/options": "./src/modules/options.ts",
		"./modules/quoteSummary-iface": "./src/modules/quoteSummary-iface.ts",
		"./modules/quoteSummary": "./src/modules/quoteSummary.ts",
		"./modules/quote": "./src/modules/quote.ts",
		"./modules/recommendationsBySymbol": "./src/modules/recommendationsBySymbol.ts",
		"./modules/screener": "./src/modules/screener.ts",
		"./modules/search": "./src/modules/search.ts",
		"./modules/trendingSymbols": "./src/modules/trendingSymbols.ts",
		"./other": "./src/other/index.ts",
		"./other/quoteCombine": "./src/other/quoteCombine.ts",
		"./lib/moduleCommon": "./src/lib/moduleCommon.ts",
		"./lib/cookieJar": "./src/lib/cookieJar.ts",
		"./lib/getCrumb": "./src/lib/getCrumb.ts",
		"./lib/options": "./src/lib/options/options.ts"
	},
	imports: {
		"@deno/dnt": "jsr:@deno/dnt@^0.42.3",
		"@gadicc/fetch-mock-cache": "jsr:@gadicc/fetch-mock-cache@^2.2.0",
		"@modelcontextprotocol/sdk/client/index.js": "npm:@modelcontextprotocol/sdk@^1.26.0/client/index.js",
		"@modelcontextprotocol/sdk/inMemory.js": "npm:@modelcontextprotocol/sdk@^1.26.0/inMemory.js",
		"@modelcontextprotocol/sdk/server/mcp.js": "npm:@modelcontextprotocol/sdk@^1.26.0/server/mcp.js",
		"@modelcontextprotocol/sdk/server/stdio.js": "npm:@modelcontextprotocol/sdk@^1.26.0/server/stdio.js",
		"@modelcontextprotocol/sdk/server/streamableHttp.js": "npm:@modelcontextprotocol/sdk@^1.26.0/server/streamableHttp.js",
		"@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js": "npm:@modelcontextprotocol/sdk@^1.26.0/server/webStandardStreamableHttp.js",
		"@modelcontextprotocol/sdk/types.js": "npm:@modelcontextprotocol/sdk@^1.26.0/types.js",
		"@sebbo2002/semantic-release-jsr": "npm:@sebbo2002/semantic-release-jsr@^4.0.0",
		"@semantic-release/exec": "npm:@semantic-release/exec@^7.1.0",
		"@jest/types": "npm:@jest/types@^29.6.3",
		"@std/async": "jsr:@std/async@^1.0.11",
		"@std/cli": "jsr:@std/cli@^1.0.14",
		"@std/expect": "jsr:@std/expect@^1.0.13",
		"@std/fmt": "jsr:@std/fmt@^1.0.5",
		"@std/fs": "jsr:@std/fs@^1.0.13",
		"@std/path": "jsr:@std/path@^1.1.2",
		"@std/testing": "jsr:@std/testing@^1.0.9",
		"@types/json-schema": "npm:@types/json-schema@^7.0.15",
		"conventional-changelog-conventionalcommits": "npm:conventional-changelog-conventionalcommits@^8.0.0",
		"fetch-mock-cache": "npm:fetch-mock-cache@^2.1.3",
		"jest-get-type": "npm:jest-get-type@^29.6.3",
		"json-schema": "npm:json-schema@^0.4.0",
		"oas-schema-walker": "npm:oas-schema-walker@^1.1.5",
		"semantic-release": "npm:semantic-release@^25.0.2",
		"tough-cookie": "npm:tough-cookie@^5.1.1",
		"tough-cookie-file-store": "npm:tough-cookie-file-store@^2.0.3",
		"ts-json-schema-generator": "npm:ts-json-schema-generator@^2.4.0",
		"zod/v4": "npm:zod@^3.25.0/v4"
	},
	nodeModulesDir: "auto",
	fmt: { exclude: [
		"tests/fixtures",
		"tests/http",
		"**/*.schema.json"
	] },
	publish: { exclude: [
		"./.circleci",
		"./.editorconfig",
		"./.github",
		"./.vscode",
		"./docs",
		"./scripts",
		"./tests"
	] },
	compilerOptions: { lib: [
		"dom",
		"dom.iterable",
		"dom.asynciterable",
		"deno.ns"
	] }
}, je = class extends Error {
	constructor() {
		super(...arguments), Object.defineProperty(this, "name", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: "BadRequestError"
		});
	}
}, Me = class extends Error {
	constructor() {
		super(...arguments), Object.defineProperty(this, "name", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: "HTTPError"
		});
	}
}, Ne = class extends Error {
	constructor() {
		super(...arguments), Object.defineProperty(this, "name", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: "InvalidOptionsError"
		});
	}
}, Pe = class extends Error {
	constructor() {
		super(...arguments), Object.defineProperty(this, "name", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: "NoEnvironmentError"
		});
	}
}, Fe = class extends Error {
	constructor(e, { result: t, errors: n }) {
		super(e), Object.defineProperty(this, "name", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: "FailedYahooValidationError"
		}), Object.defineProperty(this, "result", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "errors", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), this.result = t, this.errors = n;
	}
}, Ie = {
	BadRequestError: je,
	HTTPError: Me,
	InvalidOptionsError: Ne,
	NoEnvironmentError: Pe,
	FailedYahooValidationError: Fe
}, Le = {
	array: function(e, t, n, r, i, a, o) {
		if (!Array.isArray(e)) return r.push({
			instancePath: i,
			message: "Expected an array",
			data: e
		}), !1;
		if (t.items) {
			let a = {
				parentData: e,
				parentDataProperty: 0
			};
			for (let [s, c] of e.entries()) a.parentDataProperty = s, J(c, t.items, n, r, i + "/" + s, a, o + "/items");
		}
		return !0;
	},
	boolean: function(e, t, n, r, i, a, o) {
		return typeof e == "boolean" ? !0 : (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected a boolean",
			data: e
		}), !1);
	},
	null: function(e, t, n, r, i, a, o) {
		return typeof e == "object" && e && Object.keys(e).length === 0 ? (q(a, null, i), !0) : e === null ? !0 : (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected null",
			data: e
		}), !1);
	},
	number: function(e, t, n, r, i, a, o) {
		if (typeof e == "string") {
			let n = Number.parseFloat(e);
			return Number.isNaN(n) ? (r.push({
				instancePath: i,
				schemaPath: o,
				keyword: "yahooFinanceType",
				message: "Number.parseFloat returned NaN",
				params: { schema: t },
				data: e
			}), !1) : (q(a, n, i), !0);
		}
		if (typeof e == "object" && e) {
			if (Object.keys(e).length === 0) return Array.isArray(t.type) && t.type.includes("null") ? (q(a, null, i), !0) : (r.push({
				instancePath: i,
				schemaPath: o,
				keyword: "yahooFinanceType",
				message: "Got {}->null for 'number', did you want 'number | null' ?",
				params: { schema: t },
				data: e
			}), !1);
			if ("raw" in e && typeof e.raw == "number") return q(a, e.raw, i), !0;
		}
		return typeof e == "number" ? !0 : (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected a number'ish",
			data: e
		}), !1);
	},
	object: function(e, t, n, r, i, a, o, s) {
		if (s && s[s.length - 1] === "TwoNumberRange") {
			if (typeof e == "object" && e && "low" in e && typeof e.low == "number" && "high" in e && typeof e.high == "number") return !0;
			if (typeof e == "string") {
				let n = e.split("-").map(parseFloat);
				return Number.isNaN(n[0]) || Number.isNaN(n[1]) ? (r.push({
					instancePath: i,
					schemaPath: o,
					message: "yahooFinanceType: Number.parseFloat returned NaN: [" + n.join(",") + "]",
					schema: t,
					data: e
				}), !1) : (q(a, {
					low: n[0],
					high: n[1]
				}, i), !0);
			}
			return r.push({
				instancePath: i,
				schemaPath: o,
				message: "TwoNumberRange: Unexpected format",
				schema: t,
				data: e
			}), !1;
		}
		if (typeof e != "object") return console.log({
			schemaPath: o,
			schema: t
		}), r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected an object",
			data: e
		}), !1;
		let c = e, l = {
			parentData: c,
			parentDataProperty: ""
		};
		if (t.required) for (let e of t.required) e in c || r.push({
			instancePath: i,
			schemaPath: o + "/required",
			message: "Missing required property",
			data: e
		});
		for (let [e, a] of Object.entries(c)) {
			let s = t.properties?.[e];
			l.parentDataProperty = e, s ? J(a, s, n, r, i + "/" + e, l, o) : t.additionalProperties === !1 ? r.push({
				instancePath: i,
				schemaPath: o + "/additionalProperties",
				message: "should NOT have additional properties",
				params: { additionalProperty: e },
				data: c
			}) : t.additionalProperties && J(a, t.additionalProperties, n, r, i + "/" + e, l, o + "/additionalProperties");
		}
		return !0;
	},
	string: function(e, t, n, r, i, a, o, s) {
		if (t.format === "date-time") {
			if (e instanceof Date) return !0;
			if (typeof e == "number") return s && s[s.length - 1] === "DateInMs" ? (q(a, new Date(e), i), !0) : (q(a, /* @__PURE__ */ new Date(e * 1e3), i), !0);
			if (typeof e == "object" && e) {
				if (Object.keys(e).length === 0) return Array.isArray(t.type) && t.type.includes("null") ? (q(a, null, i), !0) : (r.push({
					instancePath: i,
					schemaPath: o,
					keyword: "yahooFinanceType",
					message: "Got {}->null for 'date', did you want 'date | null' ?",
					params: { schema: t },
					data: e
				}), !1);
				if ("raw" in e && typeof e.raw == "number") return q(a, /* @__PURE__ */ new Date(e.raw * 1e3), i), !0;
			}
			return typeof e == "string" && (e.match(/^\d{4,4}-\d{2,2}-\d{2,2}$/) || e.match(/^\d{4,4}-\d{2,2}-\d{2,2}T\d{2,2}:\d{2,2}:\d{2,2}(\.\d{3,3})?Z$/)) ? (q(a, new Date(e), i), !0) : (r.push({
				instancePath: i,
				schemaPath: o,
				message: "Expecting date'ish",
				params: { schema: t },
				data: e
			}), !1);
		}
		return typeof e == "string" ? t.const && e !== t.const ? (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Invalid const value",
			data: e,
			params: { const: t.const }
		}), !1) : t.enum && !t.enum.includes(e) ? (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Invalid enum value",
			data: e,
			params: { enum: t.enum }
		}), !1) : !0 : (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected a string",
			data: e
		}), !1);
	},
	undefined: function(e, t, n, r, i, a, o) {
		return e === void 0 ? !0 : (r.push({
			instancePath: i,
			schemaPath: o,
			message: "Expected undefined",
			data: e,
			schema: t
		}), !1);
	}
}, K = (e) => e.definitions;
function q(e, t, n) {
	if (e && e.parentData && e.parentDataProperty !== "") e.parentData[e.parentDataProperty] = t;
	else throw Error("In \"" + n + "\", cannot set value " + JSON.stringify(t) + " to context " + JSON.stringify(e));
}
function Re(e, t) {
	let n, r = "";
	if (!t) throw Error("No definitions provided");
	if (typeof e == "string") {
		let i = e.match(/^#\/definitions\/(.*)$/)?.[1];
		if (!i) throw Error("No such schema with key: " + e);
		if (n = t[i], r = e, !n) throw Error(`No such schema with key: ${i}`);
	} else n = e, n.$id && (r = n.$id);
	let i;
	for (; n.$ref;) {
		i ||= [];
		let e = n.$ref.replace("#/definitions/", "");
		i.push(e), n = t[e], r = n.$ref;
	}
	return [
		n,
		r,
		i
	];
}
function J(e, t, n, r = [], i = "", a, o = null) {
	let [s, c, l] = Re(t, n.definitions);
	if (c && (o = c), s.anyOf) {
		let t = [], c = [], l = JSON.stringify(e), u = 0;
		for (let r of s.anyOf) {
			let s = r.$ref || o + "/anyOf/" + (u++).toString();
			if (c = [], J(e, r, n, c, i, a, s), !c.length) break;
			t.push(...c), a?.parentData && (e = l === void 0 ? void 0 : JSON.parse(l), a.parentData[a.parentDataProperty] = e);
		}
		if (c.length) return r.push({
			instancePath: i,
			schemaPath: o,
			message: "should match some schema in anyOf",
			data: e,
			subErrors: t
		}), r;
	} else if (s.oneOf) {
		if (!("discriminator" in s)) throw Error("oneOf without discriminator not supported yet");
		let t = s.discriminator?.propertyName, c = [], l = [], u = JSON.stringify(e), d = 0;
		for (let r of s.oneOf) {
			let s = r.$ref || o + "/oneOf/" + (d++).toString();
			if (l = [], Re(r, n.definitions)[0].properties?.hasOwnProperty(t) ? J(e, r, n, l, i, a, s) : l.push({
				instancePath: i,
				schemaPath: s,
				message: `Missing discriminator field "${t}" in schema`,
				data: e
			}), !l.length) break;
			l.some((e) => e.instancePath === "/" + t) || c.push(...l), a?.parentData && (e = u === void 0 ? void 0 : JSON.parse(u), a.parentData[a.parentDataProperty] = e);
		}
		if (l.length) return r.push({
			instancePath: i,
			schemaPath: o,
			message: "should match some schema in oneOf",
			params: { discriminator: t },
			data: e,
			subErrors: c
		}), r;
	} else if (s.type !== void 0) if (Array.isArray(s.type)) {
		let t = [];
		for (let r of s.type) {
			t = [];
			let c = Le[r];
			if (!c) throw Error(`No validator for type ${JSON.stringify(r)} in ${i}`);
			if (c(e, s, n, t, i, a, o, l), !t.length) break;
		}
		if (t.length) return r.push({
			instancePath: i,
			message: `Expected one of ${s.type.join(", ")}`,
			data: e
		}), r;
	} else {
		let t = Le[s.type];
		if (!t) throw Error(`No validator for type ${JSON.stringify(s.type)} in ${i}`);
		t(e, s, n, r, i, a, o, l);
	}
	return r;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/consts.js
var ze = "https://github.com/gadicc/yahoo-finance2", Be = null;
async function Ve() {
	if (Be) return Be;
	let e = await fetch("https://registry.npmjs.org/yahoo-finance2/latest");
	if (!e.ok) throw Error("Failed to fetch latest version");
	return Be = (await e.json()).version, Be;
}
var He = null;
async function Ue() {
	if (He) return He;
	let e = await Ve();
	return He = {
		current: G.version,
		latest: e,
		isLatest: e === G.version
	};
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/validateAndCoerceTypes.js
var We = /* @__PURE__ */ new Map();
function Ge(e, t = !1) {
	if (We.has(e)) return;
	We.set(e, !0);
	let n = /* @__PURE__ */ new Set();
	for (let t of Object.keys(e)) {
		if (t.match(/Options$/)) continue;
		let r = e[t];
		r.type === "object" && (r.additionalProperties === void 0 || typeof r.additionalProperties == "object" && Object.keys(r.additionalProperties).length === 0) && (r.additionalProperties = !1, n.add(t));
	}
	/* istanbul ignore next */
	t && console.log("Disallowed additional props in " + Array.from(n).join(", "));
}
function Ke(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map(), r = e.filter((e) => {
		if (e.subErrors &&= Ke(e.subErrors), e.schemaPath) {
			let r = e.schemaPath + "|" + e.instancePath;
			if (e.message === "Missing required property") {
				let n;
				return t.has(r) ? n = t.get(r) : (n = [], t.set(r, n)), n.push(e), !1;
			} else if (e.message === "should NOT have additional properties") {
				let t;
				return n.has(r) ? t = n.get(r) : (t = [], n.set(r, t)), t.push(e), !1;
			}
		}
		return !0;
	});
	for (let e of t.values()) {
		let t = [];
		for (let n of e) t.push(n.data || "somethingWentWrong(tm)");
		r.push({
			schemaPath: e[0].schemaPath,
			instancePath: e[0].instancePath,
			message: "Missing required properties",
			params: { missing: t }
		});
	}
	for (let e of n.values()) {
		let t = {};
		for (let n of e) {
			let e = n.params?.additionalProperty || "somethingWentWrong(tm)";
			t[e] = n.data[e];
		}
		r.push({
			schemaPath: e[0].schemaPath,
			instancePath: e[0].instancePath,
			message: "should NOT have additional properties",
			params: { additionalProperties: t }
		});
	}
	return r;
}
function Y({ source: e, type: t, object: n, schemaOrSchemaKey: r, definitions: i, options: a, logger: o, logObj: s, versionCheck: c }) {
	let l = J(n, r, {
		definitions: i,
		logger: o,
		logObj: s
	});
	if (l.length === 0) return;
	let u = Ke(l);
	if (t === "result") {
		/* istanbul ignore else */
		if (a.logErrors === !0) {
			let e = encodeURIComponent("Failed validation: " + r);
			o.error("The following result did not validate with schema: " + r), s(u, { depth: 5 }), o.error(`
This may happen intermittently and you should catch errors appropriately.  However:  1) if this recently started happening on every request for a symbol that used to work, Yahoo may have changed their API.  2) If this happens on every request for a symbol you've never used before, but not for other symbols, you've found an edge-case (OR, we may just be protecting you from "bad" data sometimes stored for e.g. misspelt symbols on Yahoo's side).

Please see if anyone has reported this previously:

  ${ze}/issues?q=is%3Aissue+${e}

or open a new issue (and mention the symbol):  ${G.name} v${G.version}

  ${ze}/issues/new?labels=bug%2C+validation&template=validation.md&title=${e}

For information on how to turn off the above logging or skip these errors, see https://github.com/gadicc/yahoo-finance2/tree/devel/docs/validation.md.

At the end of the doc, there's also a section on how to "Help Fix Validation Errors" in case you'd like to contribute to the project.  Most of the time, these fixes are very quick and easy; it's just hard for our small core team to keep up, so help is always appreciated!
`), c && Ue().then((e) => {
				e.isLatest || o.info(`Additionally, your yahoo-finance2 version out of date: ${e.current} < ${e.latest} (latest)`);
			}).catch((e) => {
				o.error(`Failed to check version: ${e.message}`);
			});
		}
		throw new Fe("Failed Yahoo Schema validation", {
			result: n,
			errors: u
		});
	} else throw a.logOptionsErrors === !0 && (o.error(`[yahooFinance.${e}] Invalid options ("${r}")`), s({
		errors: u,
		input: n
	})), new Ne(`yahooFinance.${e} called with invalid options.`);
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/options/options.js
var qe = K(Ae);
function Je(e, t) {
	let n = Reflect.ownKeys(t);
	for (let r of n) typeof t[r] == "object" ? Je(e[r], t[r]) : e[r] = t[r];
}
function Ye(e, t = "_setOpts") {
	let { cookieJar: n, logger: r, fetch: i, ...a } = e;
	if (Y({
		object: a,
		source: t,
		type: "options",
		options: {
			logErrors: !1,
			logOptionsErrors: !0,
			allowAdditionalProps: !1
		},
		schemaOrSchemaKey: "#/definitions/YahooFinanceOptions",
		definitions: qe,
		logger: this._opts.logger,
		logObj: this._logObj,
		versionCheck: !1
	}), n && !(n instanceof De)) throw Error("cookieJar must be an instance of ExtendedCookieJar");
	if (r && ke(r), i && typeof i != "function") throw Error("fetch must be a function");
}
function Xe(e) {
	Ye.call(this, e), Je(this._opts, e);
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/queue.js
var Ze = class {
	constructor(e = {}) {
		Object.defineProperty(this, "concurrency", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: 1
		}), Object.defineProperty(this, "interval", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: 0
		}), Object.defineProperty(this, "_running", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: 0
		}), Object.defineProperty(this, "_queue", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: []
		}), Object.defineProperty(this, "_lastRun", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: 0
		}), Object.defineProperty(this, "_timer", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: null
		}), typeof e.concurrency == "number" && (this.concurrency = e.concurrency), typeof e.interval == "number" && (this.interval = e.interval);
	}
	runNext() {
		let e = this._queue.shift();
		e && (this._running++, this._lastRun = Date.now(), e.func().then((t) => e.resolve(t)).catch((t) => e.reject(t)).finally(() => {
			this._running--, this.checkQueue();
		}));
	}
	checkQueue() {
		if (this._running >= this.concurrency || !this._queue.length) return;
		let e = this.interval > 0 && this._lastRun > 0 ? Math.max(0, this._lastRun + this.interval - Date.now()) : 0;
		if (e > 0) {
			this._timer ||= setTimeout(() => {
				this._timer = null, this.checkQueue();
			}, e);
			return;
		}
		this.runNext(), this.interval > 0 && this.checkQueue();
	}
	add(e) {
		return new Promise((t, n) => {
			this._queue.push({
				func: e,
				resolve: t,
				reject: n
			}), this.checkQueue();
		});
	}
};
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/headers.js
function Qe(e) {
	let t = Reflect.get(e, "getSetCookie");
	return typeof t == "function" ? t.call(e) : [];
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/getCrumb.js
var $e = "http://config.yf2/", X = null, et = (e) => e.replace(/&#x([0-9A-Fa-f]{1,3});/gi, (e, t) => String.fromCharCode(parseInt(t, 16)));
async function tt(e, t, n, r, i = "https://finance.yahoo.com/quote/AAPL", a = {
	id: "getCrumb-quote-AAPL",
	onFinish: void 0
}, o = !1) {
	if (!X) {
		let t = await e.getCookies($e);
		for (let e of t) if (e.key === "crumb") {
			X = e.value, r.debug("Retrieved crumb from cookie store: " + X);
			break;
		}
	}
	if (X && !o && (await e.getCookies(i, { expire: !0 })).length) return X;
	async function s(t, n) {
		return t && t.length > 0 ? (await e.setFromSetCookieHeaders(t, n), !0) : !1;
	}
	r.debug("Fetching crumb and cookies from " + i + "...");
	let c = {
		...n,
		headers: {
			...n.headers,
			accept: "text/html,application/xhtml+xml,application/xml"
		},
		redirect: "manual"
	};
	n.devel && (c.devel = {
		...n.devel,
		...a
	});
	let l = await t(i, c);
	await s(Qe(l.headers), i);
	let u = l.headers.get("location");
	if (u && u.match(/guce.yahoo/)) {
		let n = {
			...c,
			headers: {
				...c.headers,
				cookie: await e.getCookieString(u)
			},
			devel: {
				id: "getCrumb-quote-AAPL-consent.html",
				t: a.t,
				onFinish: a.onFinish
			}
		};
		r.debug("fetch", u);
		let i = (await t(u, n)).headers.get("location");
		if (i) {
			if (!i.match(/collectConsent/)) throw Error("Unexpected redirect to " + i);
			let l = {
				...n,
				headers: {
					...c.headers,
					cookie: await e.getCookieString(i)
				},
				devel: {
					id: "getCrumb-quote-AAPL-collectConsent.html",
					t: a.t,
					onFinish: a.onFinish
				}
			};
			r.debug("fetch", i);
			let u = [...(await (await t(i, l)).text()).matchAll(/<input type="hidden" name="([^"]+)" value="([^"]+)">/g)].map(([, e, t]) => `${e}=${encodeURIComponent(et(t))}&`).join("") + "agree=agree&agree=agree", d = {
				...n,
				headers: {
					...c.headers,
					cookie: await e.getCookieString(i),
					"content-type": "application/x-www-form-urlencoded"
				},
				method: "POST",
				body: u,
				devel: {
					id: "getCrumb-quote-AAPL-collectConsentSubmit",
					t: a.t,
					onFinish: a.onFinish
				}
			};
			r.debug("fetch", i);
			let f = await t(i, d);
			if (!await s(Qe(f.headers), i)) throw Error("No set-cookie header on collectConsentSubmitResponse, please report.");
			let p = f.headers.get("location");
			if (!p) throw Error("collectConsentSubmitResponse(1) unexpectedly did not return a Location header, please report.");
			let m = {
				...n,
				headers: {
					...c.headers,
					cookie: await e.getCookieString(p)
				},
				devel: {
					id: "getCrumb-quote-AAPL-copyConsent",
					t: a.t,
					onFinish: a.onFinish
				}
			};
			r.debug("fetch", p);
			let h = await t(p, m);
			if (!await s(Qe(h.headers), p)) throw Error("No set-cookie header on copyConsentResponse, please report.");
			let g = h.headers.get("location");
			if (!g) throw Error("collectConsentSubmitResponse(2) unexpectedly did not return a Location header, please report.");
			return await tt(e, t, {
				...c,
				headers: {
					...c.headers,
					cookie: await e.getCookieString(p)
				},
				devel: {
					id: "getCrumb-quote-AAPL-consent-final-redirect.html",
					t: a.t,
					onFinish: a.onFinish
				}
			}, r, g, {
				id: "getCrumb-quote-AAPL-consent-final-redirect.html",
				t: a.t,
				onFinish: a.onFinish
			}, o);
		}
	}
	let d = (await e.getCookies(i, { expire: !0 }))[0];
	if (d) r.debug("Success. Cookie expires on " + d.expires);
	else throw Error("No set-cookie header present in Yahoo's response.  Something must have changed, please report.");
	let f = "https://query1.finance.yahoo.com/v1/test/getcrumb", p = {
		...c,
		headers: {
			...c.headers,
			cookie: await e.getCookieString(f),
			origin: "https://finance.yahoo.com",
			referer: i,
			accept: "*/*",
			"accept-encoding": "gzip, deflate, br",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "text/plain"
		},
		devel: {
			id: "getCrumb-getcrumb",
			t: a.t,
			onFinish: a.onFinish
		}
	};
	r.debug("fetch", f);
	let m = await t(f, p);
	if (m.status !== 200) throw Error("Failed to get crumb, status " + m.status + ", statusText: " + m.statusText);
	if (X = await m.text(), !X) throw Error("Could not find crumb.  Yahoo's API may have changed; please report.");
	return r.debug("New crumb: " + X), await e.setCookie(new W.Cookie({
		key: "crumb",
		value: X
	}), $e), Z = null, X;
}
var Z = null;
function nt(e, t, n, r, i, a = "https://finance.yahoo.com/quote/AAPL", o = tt) {
	return i.show("yahooSurvey"), Z ||= Promise.resolve(o(e, t, n, r, a)).catch((e) => {
		throw Z = null, e;
	}), Z;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/yahooFinanceFetch.js
var rt = new Ze();
function it(e, t) {
	typeof t.concurrency == "number" && e.concurrency !== t.concurrency && (e.concurrency = t.concurrency), typeof t.timeout == "number" && e.timeout !== t.timeout && (e.timeout = t.timeout), typeof t.interval == "number" && e.interval !== t.interval && (e.interval = t.interval);
}
function at(e) {
	return e.replace(/\$\{([^}]+)\}/g, (e, t) => t === "YF_QUERY_HOST" ? this._opts.YF_QUERY_HOST || "query2.finance.yahoo.com" : e);
}
async function ot(e, t = {}, n = {}, r = "json", i = !1) {
	if (!(this && this._env)) throw new Ie.NoEnvironmentError("yahooFinanceFetch called without this._env set");
	let a = n.queue?._queue, o = a instanceof Ze ? a : rt;
	it(o, {
		...this._opts.queue,
		...n.queue
	});
	let { fetch: s, fetchDevel: c } = this._env, l = n.devel ? await c() : n.fetch || s || this._opts.fetch || globalThis.fetch, u = (e, t) => o.add(() => l(e, t)), d = {
		...this._opts.fetchOptions,
		...n.fetchOptions,
		devel: n.devel,
		headers: {
			...this._opts.fetchOptions?.headers,
			...n.fetchOptions?.headers
		}
	};
	if (i) {
		if (!this._opts.cookieJar) throw Error("No cookieJar set");
		if (!this._opts.logger) throw Error("Logger was unset.");
		let e = await nt(this._opts.cookieJar, u, d, this._opts.logger, this._notices);
		e && (t.crumb = e);
	}
	let f = new URLSearchParams(t), p = at.call(this, e) + "?" + f.toString();
	if (!this._opts.cookieJar) throw Error("No cookieJar set");
	let m = {
		...d,
		headers: {
			...d.headers,
			cookie: await this._opts.cookieJar.getCookieString(p, { allPaths: !0 })
		}
	};
	r === "csv" && (r = "text");
	let h = await u(p, m), g = Qe(h.headers);
	if (g) {
		if (!this._opts.cookieJar) throw Error("No cookieJar set");
		this._opts.cookieJar.setFromSetCookieHeaders(g, p);
	}
	let _ = await h.text(), v = null;
	try {
		v = JSON.parse(_);
	} catch (e) {
		if (h.ok && e instanceof Error) throw Error(`Response.ok where we expect JSON, but the response was not parsable.  Response: "${_}".  Error: "${e.message}"`);
	}
	if (v && r === "json") {
		let e = Object.keys(v);
		if (e.length === 1) {
			let t = v[e[0]].error;
			if (t) throw new (Ie[t.code.replace(/ /g, "") + "Error"] || Error)(t.description);
		}
	}
	if (!h.ok) {
		console.error(p);
		let e = new Ie.HTTPError(_ || h.statusText);
		throw e.code = h.status, e;
	}
	return v;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/csv2json.js
var st = ",";
function ct(e) {
	return e.split(" ").map((e, t) => t === 0 ? e.toLowerCase() : e[0].toUpperCase() + e.substr(1).toLowerCase()).join("");
}
function lt(e) {
	if (typeof e == "string") {
		if (e.match(/\d{4,4}-\d{2,2}-\d{2,2}/)) return new Date(e);
		if (e.match(/^[0-9\.]+$/)) return parseFloat(e);
		if (e === "null") return null;
	}
	return e;
}
function ut(e) {
	let t = e.split("\n"), n = t.shift().split(st).map(ct), r = Array(t.length);
	for (let e = 0; e < t.length; e++) {
		let i = t[e].split(st), a = r[e] = {};
		for (let e = 0; e < i.length; e++) a[n[e]] = lt(i[e]);
	}
	return r;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/moduleExec.js
async function dt(e) {
	let t = e.query, n = e.moduleOptions, r = e.moduleName, i = e.result;
	if (!t.definitions) throw Error("no definitions in queryOpts: " + JSON.stringify(t));
	if (!i.definitions) throw Error("no definitions in resultOpts: " + JSON.stringify(i));
	if (t.assertSymbol) {
		let e = t.assertSymbol;
		if (typeof e != "string") throw Error(`yahooFinance.${r}() expects a single string symbol as its query, not a(n) ${typeof e}: ${JSON.stringify(e)}`);
	}
	this._opts.validation?.allowAdditionalProps === !1 && Ge(i.definitions);
	let a = !n || n.validateOptions === void 0 || n.validateOptions === !0;
	try {
		Y({
			source: r,
			type: "options",
			object: t.overrides ?? {},
			definitions: t.definitions,
			schemaOrSchemaKey: t.schemaKey,
			options: this._opts.validation,
			logger: this._opts.logger,
			logObj: this._logObj,
			versionCheck: this._opts.versionCheck
		});
	} catch (e) {
		if (a) throw e;
	}
	let o = {
		...t.defaults,
		...t.runtime,
		...t.overrides
	};
	t.transformWith && (o = t.transformWith(o));
	let s = await this._fetch(t.url, o, n, t.fetchType, t.needsCrumb);
	t.fetchType === "csv" && (s = ut(s)), e.result.transformWith && (s = e.result.transformWith(s));
	let c = !n || n.validateResult === void 0 || n.validateResult === !0, l = {
		...this._opts.validation,
		logErrors: c ? this._opts.validation.logErrors : !1
	};
	try {
		Y({
			source: r,
			type: "result",
			object: s,
			definitions: i.definitions,
			schemaOrSchemaKey: i.schemaKey,
			options: l,
			logger: this._opts.logger,
			logObj: this._logObj,
			versionCheck: this._opts.versionCheck
		});
	} catch (e) {
		if (c) throw e;
	}
	return s;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/notices.js
var ft = {
	yahooSurvey: {
		id: "yahooSurvey",
		text: "Please consider completing the survey at https://bit.ly/yahoo-finance-api-feedback if you haven't already; for more info see https://github.com/gadicc/yahoo-finance2/issues/764#issuecomment-2056623851.",
		onceOnly: !0
	},
	ripHistorical: {
		id: "ripHistorical",
		text: "[Deprecated] historical() relies on an API that Yahoo have removed.  We'll map this request to chart() for convenience, but, please consider using chart() directly instead; for more info see https://github.com/gadicc/yahoo-finance2/issues/795.",
		level: "warn",
		onceOnly: !0
	}
}, pt = class {
	constructor(e) {
		Object.defineProperty(this, "_yahooFinance", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_suppressed", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), this._yahooFinance = e, e._opts.suppressNotices ? this._suppressed = new Set(e._opts.suppressNotices) : this._suppressed = /* @__PURE__ */ new Set();
	}
	show(e) {
		let t = ft[e];
		if (!t) throw Error(`Unknown notice id: ${e}`);
		if (this._suppressed.has(e)) return;
		t.onceOnly && this._suppressed.add(e);
		let n = t.text + (t.onceOnly ? "  This will only be shown once, but you" : "You") + " can suppress this message in future with `new YahooFinance({ suppressNotices: ['" + e + "'] })`.", r = "level" in t && t.level || "info";
		this._yahooFinance._opts.logger[r](n);
	}
	suppress(e) {
		e.forEach((e) => {
			ft[e] || this._yahooFinance._opts.logger.error(`Unknown notice id: ${e}`), this._suppressed.add(e);
		});
	}
};
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/runtimeGlobal.js
function mt() {
	return typeof self == "object" ? self : typeof global == "object" ? global : {};
}
function Q(e) {
	return mt()[e];
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/runtime-detect.js
function ht() {
	let e = {
		runtime: "unknown",
		version: null,
		details: {}
	}, t = Q("Deno"), n = Q("process"), r = Q("Bun"), i = (e) => !!(e && e.version?.deno && e.build?.os && e.build?.arch), a = Q("navigator"), o = typeof a == "object" && typeof a?.userAgent == "string" ? a.userAgent : "";
	if (/Cloudflare-Workers/i.test(o)) return e.runtime = "cloudflare", e.version = null, e.details = {
		userAgent: o,
		miniflare: !!Q("MINIFLARE") || /Miniflare/i.test(o),
		hasWebSocketPair: Q("WebSocketPair") !== void 0,
		hasCaches: Q("caches") !== void 0
	}, e;
	if (Q("process") === void 0 && Q("Deno") === void 0 && Q("Bun") === void 0 && Q("WebSocketPair") !== void 0 && Q("caches") !== void 0) return e.runtime = "cloudflare", e.version = null, e.details = {
		userAgent: o || null,
		heuristic: !0
	}, e;
	if (typeof r == "object" && typeof r?.version == "string") return e.runtime = "bun", e.version = r.version, e.details = {
		bunRevision: r.revision ?? null,
		nodeCompat: typeof n == "object" && !!n?.versions?.node
	}, e;
	let s = typeof n == "object" && !!n?.versions?.node;
	return s && !n?.versions?.deno ? (e.runtime = "node", e.version = String(n.versions.node), e.details = {
		v8: n.versions.v8,
		arch: n.arch,
		platform: n.platform,
		denoShimDetected: typeof t == "object"
	}, e) : typeof t == "object" && t?.version?.deno && (!s || i(t) || n?.versions?.deno) ? (e.runtime = "deno", e.version = String(t.version.deno), e.details = {
		v8: t.version.v8,
		typescript: t.version.typescript,
		os: t.build?.os,
		arch: t.build?.arch,
		nodeCompat: !!n?.versions?.deno
	}, e) : s ? (e.runtime = "node", e.version = String(n.versions.node), e.details = {
		v8: n.versions.v8,
		arch: n.arch,
		platform: n.platform
	}, e) : e;
}
function gt(e) {
	if (e == null) return null;
	let t = String(e).trim();
	t.startsWith("v") && (t = t.slice(1));
	let [n, r = ""] = t.split("+")[0].split("-"), [i = "0", a = "0", o = "0"] = n.split("."), s = (e) => {
		let t = parseInt(String(e), 10);
		return Number.isFinite(t) ? t : 0;
	};
	return {
		maj: s(i),
		min: s(a),
		pat: s(o),
		pre: r
	};
}
function _t(e, t) {
	let n = gt(e), r = gt(t);
	if (!n || !r) return 0;
	if (n.maj !== r.maj) return n.maj < r.maj ? -1 : 1;
	if (n.min !== r.min) return n.min < r.min ? -1 : 1;
	if (n.pat !== r.pat) return n.pat < r.pat ? -1 : 1;
	let i = n.pre && n.pre.length > 0, a = r.pre && r.pre.length > 0;
	return i === a ? i && a ? n.pre < r.pre ? -1 : +(n.pre > r.pre) : 0 : i ? -1 : 1;
}
function vt(e, t) {
	return _t(e, t) >= 0;
}
function yt(e = {}) {
	let t = ht(), n = (e) => ({
		ok: !1,
		info: t,
		reason: e
	}), r = () => ({
		ok: !0,
		info: t
	}), i = (e) => {
		let t = e.split("."), n = mt();
		for (let e of t) {
			if (n == null || !(e in n)) return !1;
			n = n[e];
		}
		return !0;
	};
	if (t.runtime === "node" && e.node) return !t.version || !vt(t.version, e.node) ? n(`Requires Node >= ${e.node}, found ${t.version ?? "unknown"}.`) : r();
	if (t.runtime === "deno" && e.deno) return !t.version || !vt(t.version, e.deno) ? n(`Requires Deno >= ${e.deno}, found ${t.version ?? "unknown"}.`) : r();
	if (t.runtime === "bun" && e.bun) return !t.version || !vt(t.version, e.bun) ? n(`Requires Bun >= ${e.bun}, found ${t.version ?? "unknown"}.`) : r();
	if (t.runtime === "cloudflare") {
		let t = e.cloudflare?.requireFeatures ?? [];
		for (let e of t) if (!i(e)) return n(`Cloudflare Workers missing required feature: ${e}`);
		return r();
	}
	return n("Unsupported runtime.");
}
function bt(e) {
	let t = yt(e);
	if (!t.ok) {
		let { runtime: e, version: n } = t.info;
		throw Error(`Unsupported environment: ${t.reason} (runtime=${e}, version=${n})`);
	}
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/quote.schema.js
var xt = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		QuoteBase: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: { type: "string" },
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"language",
				"region",
				"quoteType",
				"triggerable",
				"marketState",
				"tradeable",
				"exchange",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"gmtOffSetMilliseconds",
				"market",
				"esgPopulated",
				"sourceInterval",
				"exchangeDataDelayedBy",
				"fullExchangeName",
				"symbol"
			]
		},
		TwoNumberRange: {
			type: "object",
			properties: {
				low: { type: "number" },
				high: { type: "number" }
			},
			required: ["low", "high"],
			additionalProperties: !1
		},
		DateInMs: {
			type: "string",
			format: "date-time"
		},
		QuoteCryptoCurrency: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "CRYPTOCURRENCY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				circulatingSupply: { type: "number" },
				fromCurrency: { type: "string" },
				toCurrency: { type: "string" },
				lastMarket: { type: "string" },
				coinImageUrl: { type: "string" },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				coinMarketCapLink: { type: "string" },
				maxSupply: { type: "number" },
				totalSupply: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteCurrency: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "CURRENCY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteEtf: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "ETF"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendYield: { type: "number" },
				netAssets: { type: "number" },
				netExpenseRatio: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteEquity: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "EQUITY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteECNQuote: {
			type: "object",
			properties: {
				dividendRate: { type: "number" },
				dividendYield: { type: "number" },
				language: { type: "string" },
				region: { type: "string" },
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				quoteType: {
					type: "string",
					const: "ECNQUOTE"
				}
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			],
			additionalProperties: !1
		},
		QuoteFuture: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "FUTURE"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				headSymbolAsString: { type: "string" },
				contractSymbol: { type: "boolean" },
				underlyingExchangeSymbol: { type: "string" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				expireIsoDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"contractSymbol",
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"underlyingExchangeSymbol"
			]
		},
		QuoteIndex: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "INDEX"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteOption: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "OPTION"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				strike: { type: "number" },
				expireDate: { type: "number" },
				expireIsoDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"openInterest",
				"quoteType",
				"region",
				"sourceInterval",
				"strike",
				"symbol",
				"tradeable",
				"triggerable",
				"underlyingSymbol"
			]
		},
		QuoteMutualfund: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "MUTUALFUND"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteMoneyMarket: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "MONEYMARKET"
				},
				typeDisp: {
					type: "string",
					const: "MoneyMarket"
				},
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				netAssets: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"typeDisp"
			]
		},
		QuoteAltSymbol: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "ALTSYMBOL"
				},
				typeDisp: {
					type: "string",
					const: "ALTSYMBOL"
				},
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				underlyingExchangeSymbol: { type: "string" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				expireIsoDate: { type: "string" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"typeDisp",
				"underlyingExchangeSymbol"
			]
		},
		Quote: {
			type: "object",
			discriminator: { propertyName: "quoteType" },
			required: ["quoteType"],
			oneOf: [
				{ $ref: "#/definitions/QuoteAltSymbol" },
				{ $ref: "#/definitions/QuoteCryptoCurrency" },
				{ $ref: "#/definitions/QuoteCurrency" },
				{ $ref: "#/definitions/QuoteECNQuote" },
				{ $ref: "#/definitions/QuoteEtf" },
				{ $ref: "#/definitions/QuoteEquity" },
				{ $ref: "#/definitions/QuoteFuture" },
				{ $ref: "#/definitions/QuoteIndex" },
				{ $ref: "#/definitions/QuoteMutualfund" },
				{ $ref: "#/definitions/QuoteOption" },
				{ $ref: "#/definitions/QuoteMoneyMarket" }
			]
		},
		QuoteField: {
			type: "string",
			enum: /* @__PURE__ */ "quoteType.typeDisp.underlyingExchangeSymbol.expireDate.expireIsoDate.language.region.quoteSourceName.triggerable.currency.customPriceAlertConfidence.marketState.tradeable.cryptoTradeable.corporateActions.exchange.shortName.longName.messageBoardId.exchangeTimezoneName.exchangeTimezoneShortName.gmtOffSetMilliseconds.market.esgPopulated.fiftyTwoWeekLowChange.fiftyTwoWeekLowChangePercent.fiftyTwoWeekRange.fiftyTwoWeekHighChange.fiftyTwoWeekHighChangePercent.fiftyTwoWeekLow.fiftyTwoWeekHigh.fiftyTwoWeekChangePercent.dividendDate.earningsTimestamp.earningsTimestampStart.earningsTimestampEnd.earningsCallTimestampStart.earningsCallTimestampEnd.isEarningsDateEstimate.trailingAnnualDividendRate.trailingPE.trailingAnnualDividendYield.epsTrailingTwelveMonths.epsForward.epsCurrentYear.priceEpsCurrentYear.sharesOutstanding.bookValue.fiftyDayAverage.fiftyDayAverageChange.fiftyDayAverageChangePercent.twoHundredDayAverage.twoHundredDayAverageChange.twoHundredDayAverageChangePercent.marketCap.forwardPE.priceToBook.sourceInterval.exchangeDataDelayedBy.firstTradeDateMilliseconds.priceHint.postMarketChangePercent.postMarketTime.postMarketPrice.postMarketChange.hasPrePostMarketData.extendedMarketChange.extendedMarketChangePercent.extendedMarketPrice.extendedMarketTime.regularMarketChange.regularMarketChangePercent.regularMarketTime.regularMarketPrice.regularMarketDayHigh.regularMarketDayRange.regularMarketDayLow.regularMarketVolume.dayHigh.dayLow.volume.regularMarketPreviousClose.preMarketChange.preMarketChangePercent.preMarketTime.preMarketPrice.bid.ask.bidSize.askSize.fullExchangeName.financialCurrency.regularMarketOpen.averageDailyVolume3Month.averageDailyVolume10Day.displayName.symbol.underlyingSymbol.ytdReturn.trailingThreeMonthReturns.trailingThreeMonthNavReturns.ipoExpectedDate.newListingDate.nameChangeDate.prevName.averageAnalystRating.pageViewGrowthWeekly.openInterest.beta.companyLogoUrl.logoUrl.impliedSharesOutstanding.circulatingSupply.fromCurrency.toCurrency.lastMarket.coinImageUrl.volume24Hr.volumeAllCurrencies.startDate.coinMarketCapLink.maxSupply.totalSupply.dividendRate.dividendYield.netAssets.netExpenseRatio.headSymbolAsString.contractSymbol.strike".split(".")
		},
		ResultType: {
			type: "string",
			enum: [
				"array",
				"object",
				"map"
			]
		},
		QuoteResponseArray: {
			type: "array",
			items: { $ref: "#/definitions/Quote" }
		},
		QuoteResponseMap: {
			type: "object",
			properties: { size: { type: "number" } },
			required: ["size"],
			additionalProperties: !1
		},
		QuoteResponseObject: {
			type: "object",
			additionalProperties: { $ref: "#/definitions/Quote" }
		},
		QuoteOptions: {
			type: "object",
			properties: {
				fields: {
					type: "array",
					items: { $ref: "#/definitions/QuoteField" }
				},
				lang: { type: "string" },
				region: { type: "string" },
				return: { $ref: "#/definitions/ResultType" }
			},
			additionalProperties: !1
		},
		QuoteOptionsWithReturnArray: {
			type: "object",
			properties: {
				fields: {
					type: "array",
					items: { $ref: "#/definitions/QuoteField" }
				},
				lang: { type: "string" },
				region: { type: "string" },
				return: {
					type: "string",
					const: "array"
				}
			},
			additionalProperties: !1
		},
		QuoteOptionsWithReturnMap: {
			type: "object",
			properties: {
				fields: {
					type: "array",
					items: { $ref: "#/definitions/QuoteField" }
				},
				lang: { type: "string" },
				region: { type: "string" },
				return: {
					type: "string",
					const: "map"
				}
			},
			required: ["return"],
			additionalProperties: !1
		},
		QuoteOptionsWithReturnObject: {
			type: "object",
			properties: {
				fields: {
					type: "array",
					items: { $ref: "#/definitions/QuoteField" }
				},
				lang: { type: "string" },
				region: { type: "string" },
				return: {
					type: "string",
					const: "object"
				}
			},
			required: ["return"],
			additionalProperties: !1
		},
		quote: {}
	}
}, St = K(xt), Ct = {};
async function wt(e, t, n) {
	let r = typeof e == "string" ? e : e.join(","), i = t && t.return, a = await this._moduleExec({
		moduleName: "quote",
		query: {
			url: "https://${YF_QUERY_HOST}/v7/finance/quote",
			needsCrumb: !0,
			definitions: St,
			schemaKey: "#/definitions/QuoteOptions",
			defaults: Ct,
			runtime: { symbols: r },
			overrides: t,
			transformWith(e) {
				return e.fields && e.fields.join(","), delete e.return, e;
			}
		},
		result: {
			definitions: St,
			schemaKey: "#/definitions/QuoteResponseArray",
			transformWith(e) {
				let t = e?.quoteResponse?.result;
				if (!t || !Array.isArray(t)) throw Error("Unexpected result: " + JSON.stringify(e));
				return t = t.filter((e) => e?.quoteType !== "NONE"), t;
			}
		},
		moduleOptions: n
	});
	if (i) switch (i) {
		case "array": return a;
		case "object": {
			let e = {};
			for (let t of a) e[t.symbol] = t;
			return e;
		}
		case "map": {
			let e = /* @__PURE__ */ new Map();
			for (let t of a) e.set(t.symbol, t);
			return e;
		}
	}
	else return typeof e == "string" ? a[0] : a;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/other/quoteCombine.js
var Tt = K(xt), $ = /* @__PURE__ */ new Map(), Et = {
	maxSymbolsPerRequest: 100,
	debounceTime: 50
};
function Dt(e, t = {}, n) {
	let r = e;
	if (typeof r != "string") throw Error("quoteCombine expects a string query parameter, received: " + JSON.stringify(r, null, 2));
	if (t.return && t.return !== "array") throw Error("Can't specify other return types using quoteCombine()");
	let i = t, a = !n || n.validateOptions === void 0 || n.validateOptions === !0;
	try {
		Y({
			source: "quoteCombine",
			type: "options",
			object: i,
			definitions: Tt,
			schemaOrSchemaKey: "#/definitions/QuoteOptions",
			options: this._opts.validation,
			logger: this._opts.logger,
			logObj: this._logObj,
			versionCheck: this._opts.versionCheck
		});
	} catch (e) {
		if (a) throw e;
	}
	let o = JSON.stringify(i), s = $.get(o);
	s || (s = {
		timeout: null,
		queryOptionsOverrides: i,
		symbols: /* @__PURE__ */ new Map()
	}, $.set(o, s));
	let c = 1, l = o;
	for (; s && s.symbols.size >= this._opts.quoteCombine.maxSymbolsPerRequest;) l = `${o}-${c++}`, s = $.get(l);
	return s || (s = {
		timeout: null,
		queryOptionsOverrides: i,
		symbols: /* @__PURE__ */ new Map()
	}, $.set(l, s)), s.timeout && clearTimeout(s.timeout), new Promise((e, t) => {
		let a = s.symbols.get(r);
		a || (a = [], s.symbols.set(r, a)), a.push({
			resolve: e,
			reject: t
		}), s.timeout = setTimeout(() => {
			$.delete(l);
			let e = Array.from(s.symbols.keys());
			wt.bind(this)(e, i, {
				...n,
				validateResult: !0
			}).then((e) => {
				for (let t of e) for (let e of s.symbols.get(t.symbol)) e.resolve(t), e.resolved = !0;
				for (let [e, t] of s.symbols) for (let e of t) e.resolved || e.resolve(void 0);
			}).catch((e) => {
				for (let t of s.symbols.values()) for (let n of t) n.reject(e);
			});
		}, this._opts.quoteCombine.debounceTime);
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/options/defaults.js
var Ot = `Mozilla/5.0 (compatible; yahoo-finance2/${G.version})`, kt = {
	YF_QUERY_HOST: "query2.finance.yahoo.com",
	cookieJar: new De(),
	queue: {
		concurrency: 4,
		interval: 0
	},
	validation: {
		logErrors: !0,
		logOptionsErrors: !0,
		allowAdditionalProps: !0
	},
	logger: Oe,
	quoteCombine: Et,
	versionCheck: !0,
	fetchOptions: { headers: { "User-Agent": Ot } }
};
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/deepmerge.js
function At(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function jt(e) {
	return e === "__proto__" || e === "constructor" || e === "prototype";
}
function Mt(e, t) {
	let n = { ...e };
	for (let e of Reflect.ownKeys(t)) {
		if (jt(e)) continue;
		let r = t[e], i = n[e];
		At(i) && At(r) ? n[e] = Mt(i, r) : n[e] = r;
	}
	return n;
}
function Nt(...e) {
	let t = Object.create(null);
	for (let n of e) {
		if (!At(n)) {
			t = n;
			continue;
		}
		t = Mt(t, n);
	}
	return t;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/createYahooFinance.js
var Pt = {
	node: "22.0.0",
	deno: "2.0.0",
	bun: "1.0.0",
	cloudflare: { requireFeatures: [] }
};
function Ft() {
	let e = Q("Deno");
	return typeof e?.stdout?.isTerminal == "function" ? e.stdout.isTerminal() : !!Q("process")?.stdout?.isTTY;
}
var It = class {
	_setOpts(e) {
		Xe.call(this, e);
	}
	constructor(e) {
		if (Object.defineProperty(this, "_opts", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_fetch", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_moduleExec", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_notices", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_env", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), Object.defineProperty(this, "_logObj", {
			enumerable: !0,
			configurable: !0,
			writable: !0,
			value: void 0
		}), this._fetch = ot, this._moduleExec = dt, this._env = { fetch: null }, "_createOpts" in this) {
			let t = this._createOpts;
			this._opts = Nt(kt, t._opts ?? {}, e ?? {}), "_allowAdditionalProps" in t && (this._opts.validation || (this._opts.validation = {}), this._opts.validation.allowAdditionalProps = !1), "fetchDevel" in t && (this._env.fetchDevel = t.fetchDevel);
		} else this._opts = Nt(kt, e ?? {});
		this._notices = new pt(this), this._logObj = Ft() ? (e, t) => this._opts.logger.dir(e, {
			depth: t?.depth ?? 4,
			colors: !0
		}) : (e) => this._opts.logger.info(JSON.stringify(e, null, 2)), Ye.call(this, e ?? {}, "#constructor");
		try {
			bt(Pt);
		} catch (e) {
			let t = ". Things might break or work unexpectedly!";
			e instanceof Error ? this._opts.logger.warn("[yahoo-finance2] " + e.message + t) : this._opts.logger.warn("[yahoo-finance2] " + JSON.stringify(e) + t);
		}
	}
};
function Lt(e) {
	let { modules: t, ...n } = e;
	return Object.assign(It.prototype, t), Object.assign(It.prototype, { _createOpts: n }), Object.assign(It, Object.fromEntries(Object.keys(t).map((e) => [e, function() {
		throw Error("Call `const yahooFinance = new YahooFinance()` first.  Upgrading from v2?  See https://github.com/gadicc/yahoo-finance2/blob/dev/docs/UPGRADING.md.");
	}]))), It;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/autoc.js
function Rt() {
	throw Error("Yahoo decomissioned their autoc server sometime before 20 Nov 2021 (see https://github.com/gadicc/yahoo-finance2/issues/337])). Use `search` instead (just like they do).");
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/chart.schema.js
var zt = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		ChartResultObject: {
			type: "object",
			properties: {
				meta: { $ref: "#/definitions/ChartMeta" },
				timestamp: {
					type: "array",
					items: { type: "number" }
				},
				events: { $ref: "#/definitions/ChartEventsObject" },
				indicators: { $ref: "#/definitions/ChartIndicatorsObject" }
			},
			required: ["meta", "indicators"],
			additionalProperties: {}
		},
		ChartMeta: {
			type: "object",
			properties: {
				currency: { type: "string" },
				symbol: { type: "string" },
				exchangeName: { type: "string" },
				instrumentType: { type: "string" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				firstTradeDate: { anyOf: [{
					type: "string",
					format: "date-time"
				}, { type: "null" }] },
				fullExchangeName: { type: "string" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				gmtoffset: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				timezone: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				regularMarketPrice: { type: "number" },
				chartPreviousClose: { type: "number" },
				previousClose: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				longName: { type: "string" },
				shortName: { type: "string" },
				scale: { type: "number" },
				priceHint: { type: "number" },
				currentTradingPeriod: {
					type: "object",
					properties: {
						pre: { $ref: "#/definitions/ChartMetaTradingPeriod" },
						regular: { $ref: "#/definitions/ChartMetaTradingPeriod" },
						post: { $ref: "#/definitions/ChartMetaTradingPeriod" }
					},
					required: [
						"pre",
						"regular",
						"post"
					],
					additionalProperties: {}
				},
				tradingPeriods: { anyOf: [{ $ref: "#/definitions/ChartMetaTradingPeriods" }, {
					type: "array",
					items: {
						type: "array",
						items: { $ref: "#/definitions/ChartMetaTradingPeriod" }
					}
				}] },
				dataGranularity: { type: "string" },
				range: { type: "string" },
				validRanges: {
					type: "array",
					items: { type: "string" }
				}
			},
			required: [
				"currency",
				"symbol",
				"exchangeName",
				"instrumentType",
				"firstTradeDate",
				"regularMarketTime",
				"gmtoffset",
				"timezone",
				"exchangeTimezoneName",
				"regularMarketPrice",
				"priceHint",
				"currentTradingPeriod",
				"dataGranularity",
				"range",
				"validRanges"
			],
			additionalProperties: {}
		},
		ChartMetaTradingPeriod: {
			type: "object",
			properties: {
				timezone: { type: "string" },
				start: {
					type: "string",
					format: "date-time"
				},
				end: {
					type: "string",
					format: "date-time"
				},
				gmtoffset: { type: "number" }
			},
			required: [
				"timezone",
				"start",
				"end",
				"gmtoffset"
			],
			additionalProperties: {}
		},
		ChartMetaTradingPeriods: {
			type: "object",
			properties: {
				pre: {
					type: "array",
					items: {
						type: "array",
						items: { $ref: "#/definitions/ChartMetaTradingPeriod" }
					}
				},
				post: {
					type: "array",
					items: {
						type: "array",
						items: { $ref: "#/definitions/ChartMetaTradingPeriod" }
					}
				},
				regular: {
					type: "array",
					items: {
						type: "array",
						items: { $ref: "#/definitions/ChartMetaTradingPeriod" }
					}
				}
			},
			additionalProperties: {}
		},
		ChartEventsObject: {
			type: "object",
			properties: {
				dividends: { $ref: "#/definitions/ChartEventDividends" },
				splits: { $ref: "#/definitions/ChartEventSplits" }
			},
			additionalProperties: {}
		},
		ChartEventDividends: {
			type: "object",
			additionalProperties: { $ref: "#/definitions/ChartEventDividend" }
		},
		ChartEventDividend: {
			type: "object",
			properties: {
				amount: { type: "number" },
				date: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["amount", "date"],
			additionalProperties: {}
		},
		ChartEventSplits: {
			type: "object",
			additionalProperties: { $ref: "#/definitions/ChartEventSplit" }
		},
		ChartEventSplit: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				numerator: { type: "number" },
				denominator: { type: "number" },
				splitRatio: { type: "string" }
			},
			required: [
				"date",
				"numerator",
				"denominator",
				"splitRatio"
			],
			additionalProperties: {}
		},
		ChartIndicatorsObject: {
			type: "object",
			properties: {
				quote: {
					type: "array",
					items: { $ref: "#/definitions/ChartIndicatorQuote" }
				},
				adjclose: {
					type: "array",
					items: { $ref: "#/definitions/ChartIndicatorAdjclose" }
				}
			},
			required: ["quote"],
			additionalProperties: {}
		},
		ChartIndicatorQuote: {
			type: "object",
			properties: {
				high: {
					type: "array",
					items: { type: ["number", "null"] }
				},
				low: {
					type: "array",
					items: { type: ["number", "null"] }
				},
				open: {
					type: "array",
					items: { type: ["number", "null"] }
				},
				close: {
					type: "array",
					items: { type: ["number", "null"] }
				},
				volume: {
					type: "array",
					items: { type: ["number", "null"] }
				}
			},
			required: [
				"high",
				"low",
				"open",
				"close",
				"volume"
			],
			additionalProperties: {}
		},
		ChartIndicatorAdjclose: {
			type: "object",
			properties: { adjclose: {
				type: "array",
				items: { type: ["number", "null"] }
			} },
			additionalProperties: {}
		},
		ChartResultArray: {
			type: "object",
			properties: {
				meta: { $ref: "#/definitions/ChartMeta" },
				events: { $ref: "#/definitions/ChartEventsArray" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ChartResultArrayQuote" }
				}
			},
			required: ["meta", "quotes"],
			additionalProperties: !1
		},
		ChartEventsArray: {
			type: "object",
			properties: {
				dividends: {
					type: "array",
					items: { $ref: "#/definitions/ChartEventDividend" }
				},
				splits: {
					type: "array",
					items: { $ref: "#/definitions/ChartEventSplit" }
				}
			},
			additionalProperties: {}
		},
		ChartResultArrayQuote: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				high: { type: ["number", "null"] },
				low: { type: ["number", "null"] },
				open: { type: ["number", "null"] },
				close: { type: ["number", "null"] },
				volume: { type: ["number", "null"] },
				adjclose: { type: ["number", "null"] }
			},
			required: [
				"date",
				"high",
				"low",
				"open",
				"close",
				"volume"
			],
			additionalProperties: {}
		},
		ChartOptions: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				useYfid: { type: "boolean" },
				interval: {
					type: "string",
					enum: [
						"1m",
						"2m",
						"5m",
						"15m",
						"30m",
						"60m",
						"90m",
						"1h",
						"1d",
						"5d",
						"1wk",
						"1mo",
						"3mo"
					]
				},
				includePrePost: { type: "boolean" },
				events: { type: "string" },
				lang: { type: "string" },
				return: {
					type: "string",
					enum: ["array", "object"]
				}
			},
			required: ["period1"],
			additionalProperties: !1
		},
		ChartOptionsWithReturnArray: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				useYfid: { type: "boolean" },
				interval: {
					type: "string",
					enum: [
						"1m",
						"2m",
						"5m",
						"15m",
						"30m",
						"60m",
						"90m",
						"1h",
						"1d",
						"5d",
						"1wk",
						"1mo",
						"3mo"
					]
				},
				includePrePost: { type: "boolean" },
				events: { type: "string" },
				lang: { type: "string" },
				return: {
					type: "string",
					const: "array"
				}
			},
			additionalProperties: !1,
			required: ["period1"]
		},
		ChartOptionsWithReturnObject: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				useYfid: { type: "boolean" },
				interval: {
					type: "string",
					enum: [
						"1m",
						"2m",
						"5m",
						"15m",
						"30m",
						"60m",
						"90m",
						"1h",
						"1d",
						"5d",
						"1wk",
						"1mo",
						"3mo"
					]
				},
				includePrePost: { type: "boolean" },
				events: { type: "string" },
				lang: { type: "string" },
				return: {
					type: "string",
					const: "object"
				}
			},
			required: ["period1", "return"],
			additionalProperties: !1
		},
		chart: {}
	}
}, Bt = K(zt), Vt = {
	useYfid: !0,
	interval: "1d",
	includePrePost: !0,
	events: "div|split|earn",
	lang: "en-US",
	return: "array"
};
async function Ht(e, t, n) {
	let r = t?.return || "array", i = await this._moduleExec({
		moduleName: "chart",
		query: {
			assertSymbol: e,
			url: "https://${YF_QUERY_HOST}/v8/finance/chart/" + e,
			definitions: Bt,
			schemaKey: "#/definitions/ChartOptions",
			defaults: Vt,
			overrides: t,
			transformWith(e) {
				e.period2 ||= /* @__PURE__ */ new Date();
				for (let t of ["period1", "period2"]) {
					let n = e[t];
					if (n instanceof Date) e[t] = Math.floor(n.getTime() / 1e3);
					else if (typeof n == "string") {
						let r = new Date(n).getTime();
						if (isNaN(r)) throw Error("yahooFinance.chart() option '" + t + "' invalid date provided: '" + n + "'");
						e[t] = Math.floor(r / 1e3);
					}
				}
				if (e.period1 === e.period2) throw Error("yahooFinance.chart() options `period1` and `period2` cannot share the same value.");
				return delete e.return, e;
			}
		},
		result: {
			definitions: Bt,
			schemaKey: "#/definitions/ChartResultObject",
			transformWith(e) {
				if (!e.chart) throw Error("Unexpected result: " + JSON.stringify(e));
				let t = e.chart.result[0];
				if (!t.timestamp) {
					if (t.indicators.quote.length !== 1) throw Error("No timestamp with quotes.length !== 1, please report with your query");
					if (Object.keys(t.indicators.quote[0]).length !== 0) throw Error("No timestamp with unexpected quote, please report with your query" + JSON.stringify(t.indicators.quote[0]));
					t.indicators.quote.pop();
				}
				return t;
			}
		},
		moduleOptions: n
	});
	if (r === "object") return i;
	if (r === "array") {
		let e = i.timestamp;
		// istanbul ignore next
		if (e && i?.indicators?.quote && i.indicators.quote[0].high.length !== e.length) throw console.log({
			origTimestampSize: i.timestamp && i.timestamp.length,
			filteredSize: e.length,
			quoteSize: i.indicators.quote[0].high.length
		}), Error("Timestamp count mismatch, please report this with the query you used");
		let t = {
			meta: i.meta,
			quotes: e ? Array(e.length) : []
		}, n = i?.indicators?.adjclose?.[0].adjclose;
		if (e) for (let r = 0; r < e.length; r++) t.quotes[r] = {
			date: /* @__PURE__ */ new Date(e[r] * 1e3),
			high: i.indicators.quote[0].high[r],
			volume: i.indicators.quote[0].volume[r],
			open: i.indicators.quote[0].open[r],
			low: i.indicators.quote[0].low[r],
			close: i.indicators.quote[0].close[r]
		}, n && (t.quotes[r].adjclose = n[r]);
		if (i.events) {
			t.events = {};
			for (let e of ["dividends", "splits"]) i.events[e] && (t.events[e] = Object.values(i.events[e]));
		}
		return t;
	}
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/dailyGainers.js
function Ut() {
	throw Error("dailyGainers module has been deprecated due to reliability issues. Use screener({ scrIds: 'day_gainers' }) instead. See https://github.com/gadicc/yahoo-finance2/blob/devel/docs/modules/screener.md for details.");
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/dailyLosers.js
function Wt() {
	throw Error("dailyLosers module has been deprecated due to reliability issues. Use screener({ scrIds: 'day_losers' }) instead. See https://github.com/gadicc/yahoo-finance2/blob/devel/docs/modules/screener.md for details.");
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/lib/timeseries.js
var Gt = {
	financials: /* @__PURE__ */ "TotalRevenue.OperatingRevenue.CostOfRevenue.GrossProfit.SellingGeneralAndAdministration.SellingAndMarketingExpense.GeneralAndAdministrativeExpense.OtherGandA.ResearchAndDevelopment.DepreciationAmortizationDepletionIncomeStatement.DepletionIncomeStatement.DepreciationAndAmortizationInIncomeStatement.Amortization.AmortizationOfIntangiblesIncomeStatement.DepreciationIncomeStatement.OtherOperatingExpenses.OperatingExpense.OperatingIncome.InterestExpenseNonOperating.InterestIncomeNonOperating.TotalOtherFinanceCost.NetNonOperatingInterestIncomeExpense.WriteOff.SpecialIncomeCharges.GainOnSaleOfPPE.GainOnSaleOfBusiness.GainOnSaleOfSecurity.OtherSpecialCharges.OtherIncomeExpense.OtherNonOperatingIncomeExpenses.TotalExpenses.PretaxIncome.TaxProvision.NetIncomeContinuousOperations.NetIncomeIncludingNoncontrollingInterests.MinorityInterests.NetIncomeFromTaxLossCarryforward.NetIncomeExtraordinary.NetIncomeDiscontinuousOperations.PreferredStockDividends.OtherunderPreferredStockDividend.NetIncomeCommonStockholders.NetIncome.BasicAverageShares.DilutedAverageShares.DividendPerShare.ReportedNormalizedBasicEPS.ContinuingAndDiscontinuedBasicEPS.BasicEPSOtherGainsLosses.TaxLossCarryforwardBasicEPS.NormalizedBasicEPS.BasicEPS.BasicAccountingChange.BasicExtraordinary.BasicDiscontinuousOperations.BasicContinuousOperations.ReportedNormalizedDilutedEPS.ContinuingAndDiscontinuedDilutedEPS.TaxLossCarryforwardDilutedEPS.AverageDilutionEarnings.NormalizedDilutedEPS.DilutedEPS.DilutedAccountingChange.DilutedExtraordinary.DilutedContinuousOperations.DilutedDiscontinuousOperations.DilutedNIAvailtoComStockholders.DilutedEPSOtherGainsLosses.TotalOperatingIncomeAsReported.NetIncomeFromContinuingAndDiscontinuedOperation.NormalizedIncome.NetInterestIncome.EBIT.EBITDA.ReconciledCostOfRevenue.ReconciledDepreciation.NetIncomeFromContinuingOperationNetMinorityInterest.TotalUnusualItemsExcludingGoodwill.TotalUnusualItems.NormalizedEBITDA.TaxRateForCalcs.TaxEffectOfUnusualItems.RentExpenseSupplemental.EarningsFromEquityInterestNetOfTax.ImpairmentOfCapitalAssets.RestructuringAndMergernAcquisition.SecuritiesAmortization.EarningsFromEquityInterest.OtherTaxes.ProvisionForDoubtfulAccounts.InsuranceAndClaims.RentAndLandingFees.SalariesAndWages.ExciseTaxes.InterestExpense.InterestIncome.TotalMoneyMarketInvestments.InterestIncomeAfterProvisionForLoanLoss.OtherThanPreferredStockDividend.LossonExtinguishmentofDebt.IncomefromAssociatesandOtherParticipatingInterests.NonInterestExpense.OtherNonInterestExpense.ProfessionalExpenseAndContractServicesExpense.OccupancyAndEquipment.Equipment.NetOccupancyExpense.CreditLossesProvision.NonInterestIncome.OtherNonInterestIncome.GainLossonSaleofAssets.GainonSaleofInvestmentProperty.GainonSaleofLoans.ForeignExchangeTradingGains.TradingGainLoss.InvestmentBankingProfit.DividendIncome.FeesAndCommissions.FeesandCommissionExpense.FeesandCommissionIncome.OtherCustomerServices.CreditCard.SecuritiesActivities.TrustFeesbyCommissions.ServiceChargeOnDepositorAccounts.TotalPremiumsEarned.OtherInterestExpense.InterestExpenseForFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell.InterestExpenseForLongTermDebtAndCapitalSecurities.InterestExpenseForShortTermDebt.InterestExpenseForDeposit.OtherInterestIncome.InterestIncomeFromFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell.InterestIncomeFromDeposits.InterestIncomeFromSecurities.InterestIncomeFromLoansAndLease.InterestIncomeFromLeases.InterestIncomeFromLoans.DepreciationDepreciationIncomeStatement.OperationAndMaintenance.OtherCostofRevenue.ExplorationDevelopmentAndMineralPropertyLeaseExpenses".split("."),
	"balance-sheet": /* @__PURE__ */ "NetDebt.TreasurySharesNumber.PreferredSharesNumber.OrdinarySharesNumber.ShareIssued.TotalDebt.TangibleBookValue.InvestedCapital.WorkingCapital.NetTangibleAssets.CapitalLeaseObligations.CommonStockEquity.PreferredStockEquity.TotalCapitalization.TotalEquityGrossMinorityInterest.MinorityInterest.StockholdersEquity.OtherEquityInterest.GainsLossesNotAffectingRetainedEarnings.OtherEquityAdjustments.FixedAssetsRevaluationReserve.ForeignCurrencyTranslationAdjustments.MinimumPensionLiabilities.UnrealizedGainLoss.TreasuryStock.RetainedEarnings.AdditionalPaidInCapital.CapitalStock.OtherCapitalStock.CommonStock.PreferredStock.TotalPartnershipCapital.GeneralPartnershipCapital.LimitedPartnershipCapital.TotalLiabilitiesNetMinorityInterest.TotalNonCurrentLiabilitiesNetMinorityInterest.OtherNonCurrentLiabilities.LiabilitiesHeldforSaleNonCurrent.RestrictedCommonStock.PreferredSecuritiesOutsideStockEquity.DerivativeProductLiabilities.EmployeeBenefits.NonCurrentPensionAndOtherPostretirementBenefitPlans.NonCurrentAccruedExpenses.DuetoRelatedPartiesNonCurrent.TradeandOtherPayablesNonCurrent.NonCurrentDeferredLiabilities.NonCurrentDeferredRevenue.NonCurrentDeferredTaxesLiabilities.LongTermDebtAndCapitalLeaseObligation.LongTermCapitalLeaseObligation.LongTermDebt.LongTermProvisions.CurrentLiabilities.OtherCurrentLiabilities.CurrentDeferredLiabilities.CurrentDeferredRevenue.CurrentDeferredTaxesLiabilities.CurrentDebtAndCapitalLeaseObligation.CurrentCapitalLeaseObligation.CurrentDebt.OtherCurrentBorrowings.LineOfCredit.CommercialPaper.CurrentNotesPayable.PensionandOtherPostRetirementBenefitPlansCurrent.CurrentProvisions.PayablesAndAccruedExpenses.CurrentAccruedExpenses.InterestPayable.Payables.OtherPayable.DuetoRelatedPartiesCurrent.DividendsPayable.TotalTaxPayable.IncomeTaxPayable.AccountsPayable.TotalAssets.TotalNonCurrentAssets.OtherNonCurrentAssets.DefinedPensionBenefit.NonCurrentPrepaidAssets.NonCurrentDeferredAssets.NonCurrentDeferredTaxesAssets.DuefromRelatedPartiesNonCurrent.NonCurrentNoteReceivables.NonCurrentAccountsReceivable.FinancialAssets.InvestmentsAndAdvances.OtherInvestments.InvestmentinFinancialAssets.HeldToMaturitySecurities.AvailableForSaleSecurities.FinancialAssetsDesignatedasFairValueThroughProfitorLossTotal.TradingSecurities.LongTermEquityInvestment.InvestmentsinJointVenturesatCost.InvestmentsInOtherVenturesUnderEquityMethod.InvestmentsinAssociatesatCost.InvestmentsinSubsidiariesatCost.InvestmentProperties.GoodwillAndOtherIntangibleAssets.OtherIntangibleAssets.Goodwill.NetPPE.AccumulatedDepreciation.GrossPPE.Leases.ConstructionInProgress.OtherProperties.MachineryFurnitureEquipment.BuildingsAndImprovements.LandAndImprovements.Properties.CurrentAssets.OtherCurrentAssets.HedgingAssetsCurrent.AssetsHeldForSaleCurrent.CurrentDeferredAssets.CurrentDeferredTaxesAssets.RestrictedCash.PrepaidAssets.Inventory.InventoriesAdjustmentsAllowances.OtherInventories.FinishedGoods.WorkInProcess.RawMaterials.Receivables.ReceivablesAdjustmentsAllowances.OtherReceivables.DuefromRelatedPartiesCurrent.TaxesReceivable.AccruedInterestReceivable.NotesReceivable.LoansReceivable.AccountsReceivable.AllowanceForDoubtfulAccountsReceivable.GrossAccountsReceivable.CashCashEquivalentsAndShortTermInvestments.OtherShortTermInvestments.CashAndCashEquivalents.CashEquivalents.CashFinancial.OtherLiabilities.LiabilitiesOfDiscontinuedOperations.SubordinatedLiabilities.AdvanceFromFederalHomeLoanBanks.TradingLiabilities.DuetoRelatedParties.SecuritiesLoaned.FederalFundsPurchasedAndSecuritiesSoldUnderAgreementToRepurchase.FinancialInstrumentsSoldUnderAgreementsToRepurchase.FederalFundsPurchased.TotalDeposits.NonInterestBearingDeposits.InterestBearingDepositsLiabilities.CustomerAccounts.DepositsbyBank.OtherAssets.AssetsHeldForSale.DeferredAssets.DeferredTaxAssets.DueFromRelatedParties.AllowanceForNotesReceivable.GrossNotesReceivable.NetLoan.UnearnedIncome.AllowanceForLoansAndLeaseLosses.GrossLoan.OtherLoanAssets.MortgageLoan.ConsumerLoan.CommercialLoan.LoansHeldForSale.DerivativeAssets.SecuritiesAndInvestments.BankOwnedLifeInsurance.OtherRealEstateOwned.ForeclosedAssets.CustomerAcceptances.FederalHomeLoanBankStock.SecurityBorrowed.CashCashEquivalentsAndFederalFundsSold.MoneyMarketInvestments.FederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell.SecurityAgreeToBeResell.FederalFundsSold.RestrictedCashAndInvestments.RestrictedInvestments.RestrictedCashAndCashEquivalents.InterestBearingDepositsAssets.CashAndDueFromBanks.BankIndebtedness.MineralProperties".split("."),
	"cash-flow": /* @__PURE__ */ "FreeCashFlow.ForeignSales.DomesticSales.AdjustedGeographySegmentData.RepurchaseOfCapitalStock.RepaymentOfDebt.IssuanceOfDebt.IssuanceOfCapitalStock.CapitalExpenditure.InterestPaidSupplementalData.IncomeTaxPaidSupplementalData.EndCashPosition.OtherCashAdjustmentOutsideChangeinCash.BeginningCashPosition.EffectOfExchangeRateChanges.ChangesInCash.OtherCashAdjustmentInsideChangeinCash.CashFlowFromDiscontinuedOperation.FinancingCashFlow.CashFromDiscontinuedFinancingActivities.CashFlowFromContinuingFinancingActivities.NetOtherFinancingCharges.InterestPaidCFF.ProceedsFromStockOptionExercised.CashDividendsPaid.PreferredStockDividendPaid.CommonStockDividendPaid.NetPreferredStockIssuance.PreferredStockPayments.PreferredStockIssuance.NetCommonStockIssuance.CommonStockPayments.CommonStockIssuance.NetIssuancePaymentsOfDebt.NetShortTermDebtIssuance.ShortTermDebtPayments.ShortTermDebtIssuance.NetLongTermDebtIssuance.LongTermDebtPayments.LongTermDebtIssuance.InvestingCashFlow.CashFromDiscontinuedInvestingActivities.CashFlowFromContinuingInvestingActivities.NetOtherInvestingChanges.InterestReceivedCFI.DividendsReceivedCFI.NetInvestmentPurchaseAndSale.SaleOfInvestment.PurchaseOfInvestment.NetInvestmentPropertiesPurchaseAndSale.SaleOfInvestmentProperties.PurchaseOfInvestmentProperties.NetBusinessPurchaseAndSale.SaleOfBusiness.PurchaseOfBusiness.NetIntangiblesPurchaseAndSale.SaleOfIntangibles.PurchaseOfIntangibles.NetPPEPurchaseAndSale.SaleOfPPE.PurchaseOfPPE.CapitalExpenditureReported.OperatingCashFlow.CashFromDiscontinuedOperatingActivities.CashFlowFromContinuingOperatingActivities.TaxesRefundPaid.InterestReceivedCFO.InterestPaidCFO.DividendReceivedCFO.DividendPaidCFO.ChangeInWorkingCapital.ChangeInOtherWorkingCapital.ChangeInOtherCurrentLiabilities.ChangeInOtherCurrentAssets.ChangeInPayablesAndAccruedExpense.ChangeInAccruedExpense.ChangeInInterestPayable.ChangeInPayable.ChangeInDividendPayable.ChangeInAccountPayable.ChangeInTaxPayable.ChangeInIncomeTaxPayable.ChangeInPrepaidAssets.ChangeInInventory.ChangeInReceivables.ChangesInAccountReceivables.OtherNonCashItems.ExcessTaxBenefitFromStockBasedCompensation.StockBasedCompensation.UnrealizedGainLossOnInvestmentSecurities.ProvisionandWriteOffofAssets.AssetImpairmentCharge.AmortizationOfSecurities.DeferredTax.DeferredIncomeTax.Depletion.DepreciationAndAmortization.AmortizationCashFlow.AmortizationOfIntangibles.Depreciation.OperatingGainsLosses.PensionAndEmployeeBenefitExpense.EarningsLossesFromEquityInvestments.GainLossOnInvestmentSecurities.NetForeignCurrencyExchangeGainLoss.GainLossOnSaleOfPPE.GainLossOnSaleOfBusiness.NetIncomeFromContinuingOperations.CashFlowsfromusedinOperatingActivitiesDirect.TaxesRefundPaidDirect.InterestReceivedDirect.InterestPaidDirect.DividendsReceivedDirect.DividendsPaidDirect.ClassesofCashPayments.OtherCashPaymentsfromOperatingActivities.PaymentsonBehalfofEmployees.PaymentstoSuppliersforGoodsandServices.ClassesofCashReceiptsfromOperatingActivities.OtherCashReceiptsfromOperatingActivities.ReceiptsfromGovernmentGrants.ReceiptsfromCustomers.IncreaseDecreaseInDeposit.ChangeInFederalFundsAndSecuritiesSoldForRepurchase.NetProceedsPaymentForLoan.PaymentForLoans.ProceedsFromLoans.ProceedsPaymentInInterestBearingDepositsInBank.IncreaseinInterestBearingDepositsinBank.DecreaseinInterestBearingDepositsinBank.ProceedsPaymentFederalFundsSoldAndSecuritiesPurchasedUnderAgreementToResell.ChangeInLoans.ChangeInDeferredCharges.ProvisionForLoanLeaseAndOtherLosses.AmortizationOfFinancingCostsAndDiscounts.DepreciationAmortizationDepletion.RealizedGainLossOnSaleOfLoansAndLease.AllTaxesPaid.InterestandCommissionPaid.CashPaymentsforLoans.CashPaymentsforDepositsbyBanksandCustomers.CashReceiptsfromFeesandCommissions.CashReceiptsfromSecuritiesRelatedActivities.CashReceiptsfromLoans.CashReceiptsfromDepositsbyBanksandCustomers.CashReceiptsfromTaxRefunds.AmortizationAmortizationCashFlow".split(".")
}, Kt = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		FundamentalsTimeSeries_Period: {
			type: "string",
			enum: ["3M", "12M"]
		},
		FundamentalsTimeSeriesFinancialsResult: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				TYPE: {
					type: "string",
					const: "FINANCIALS"
				},
				periodType: { $ref: "#/definitions/FundamentalsTimeSeries_Period" },
				totalRevenue: { type: "number" },
				operatingRevenue: { type: "number" },
				costOfRevenue: { type: "number" },
				grossProfit: { type: "number" },
				sellingGeneralAndAdministration: { type: "number" },
				sellingAndMarketingExpense: { type: "number" },
				generalAndAdministrativeExpense: { type: "number" },
				otherGandA: { type: "number" },
				researchAndDevelopment: { type: "number" },
				depreciationAmortizationDepletionIncomeStatement: { type: "number" },
				depletionIncomeStatement: { type: "number" },
				depreciationAndAmortizationInIncomeStatement: { type: "number" },
				amortization: { type: "number" },
				amortizationOfIntangiblesIncomeStatement: { type: "number" },
				depreciationIncomeStatement: { type: "number" },
				otherOperatingExpenses: { type: "number" },
				operatingExpense: { type: "number" },
				operatingIncome: { type: "number" },
				interestExpenseNonOperating: { type: "number" },
				interestIncomeNonOperating: { type: "number" },
				totalOtherFinanceCost: { type: "number" },
				netNonOperatingInterestIncomeExpense: { type: "number" },
				writeOff: { type: "number" },
				specialIncomeCharges: { type: "number" },
				gainOnSaleOfPPE: { type: "number" },
				gainOnSaleOfBusiness: { type: "number" },
				gainOnSaleOfSecurity: { type: "number" },
				otherSpecialCharges: { type: "number" },
				otherIncomeExpense: { type: "number" },
				otherNonOperatingIncomeExpenses: { type: "number" },
				totalExpenses: { type: "number" },
				pretaxIncome: { type: "number" },
				taxProvision: { type: "number" },
				netIncomeContinuousOperations: { type: "number" },
				netIncomeIncludingNoncontrollingInterests: { type: "number" },
				minorityInterests: { type: "number" },
				netIncomeFromTaxLossCarryforward: { type: "number" },
				netIncomeExtraordinary: { type: "number" },
				netIncomeDiscontinuousOperations: { type: "number" },
				preferredStockDividends: { type: "number" },
				otherunderPreferredStockDividend: { type: "number" },
				netIncomeCommonStockholders: { type: "number" },
				netIncome: { type: "number" },
				basicAverageShares: { type: "number" },
				dilutedAverageShares: { type: "number" },
				dividendPerShare: { type: "number" },
				reportedNormalizedBasicEPS: { type: "number" },
				continuingAndDiscontinuedBasicEPS: { type: "number" },
				basicEPSOtherGainsLosses: { type: "number" },
				taxLossCarryforwardBasicEPS: { type: "number" },
				normalizedBasicEPS: { type: "number" },
				basicEPS: { type: "number" },
				basicAccountingChange: { type: "number" },
				basicExtraordinary: { type: "number" },
				basicDiscontinuousOperations: { type: "number" },
				basicContinuousOperations: { type: "number" },
				reportedNormalizedDilutedEPS: { type: "number" },
				continuingAndDiscontinuedDilutedEPS: { type: "number" },
				taxLossCarryforwardDilutedEPS: { type: "number" },
				averageDilutionEarnings: { type: "number" },
				normalizedDilutedEPS: { type: "number" },
				dilutedEPS: { type: "number" },
				dilutedAccountingChange: { type: "number" },
				dilutedExtraordinary: { type: "number" },
				dilutedContinuousOperations: { type: "number" },
				dilutedDiscontinuousOperations: { type: "number" },
				dilutedNIAvailtoComStockholders: { type: "number" },
				dilutedEPSOtherGainsLosses: { type: "number" },
				totalOperatingIncomeAsReported: { type: "number" },
				netIncomeFromContinuingAndDiscontinuedOperation: { type: "number" },
				normalizedIncome: { type: "number" },
				netInterestIncome: { type: "number" },
				EBIT: { type: "number" },
				EBITDA: { type: "number" },
				reconciledCostOfRevenue: { type: "number" },
				reconciledDepreciation: { type: "number" },
				netIncomeFromContinuingOperationNetMinorityInterest: { type: "number" },
				totalUnusualItemsExcludingGoodwill: { type: "number" },
				totalUnusualItems: { type: "number" },
				normalizedEBITDA: { type: "number" },
				taxRateForCalcs: { type: "number" },
				taxEffectOfUnusualItems: { type: "number" },
				rentExpenseSupplemental: { type: "number" },
				earningsFromEquityInterestNetOfTax: { type: "number" },
				impairmentOfCapitalAssets: { type: "number" },
				restructuringAndMergernAcquisition: { type: "number" },
				securitiesAmortization: { type: "number" },
				earningsFromEquityInterest: { type: "number" },
				otherTaxes: { type: "number" },
				provisionForDoubtfulAccounts: { type: "number" },
				insuranceAndClaims: { type: "number" },
				rentAndLandingFees: { type: "number" },
				salariesAndWages: { type: "number" },
				exciseTaxes: { type: "number" },
				interestExpense: { type: "number" },
				interestIncome: { type: "number" },
				totalMoneyMarketInvestments: { type: "number" },
				interestIncomeAfterProvisionForLoanLoss: { type: "number" },
				otherThanPreferredStockDividend: { type: "number" },
				lossonExtinguishmentofDebt: { type: "number" },
				incomefromAssociatesandOtherParticipatingInterests: { type: "number" },
				nonInterestExpense: { type: "number" },
				otherNonInterestExpense: { type: "number" },
				professionalExpenseAndContractServicesExpense: { type: "number" },
				occupancyAndEquipment: { type: "number" },
				equipment: { type: "number" },
				netOccupancyExpense: { type: "number" },
				creditLossesProvision: { type: "number" },
				nonInterestIncome: { type: "number" },
				otherNonInterestIncome: { type: "number" },
				gainLossonSaleofAssets: { type: "number" },
				gainonSaleofInvestmentProperty: { type: "number" },
				gainonSaleofLoans: { type: "number" },
				foreignExchangeTradingGains: { type: "number" },
				tradingGainLoss: { type: "number" },
				investmentBankingProfit: { type: "number" },
				dividendIncome: { type: "number" },
				feesAndCommissions: { type: "number" },
				feesandCommissionExpense: { type: "number" },
				feesandCommissionIncome: { type: "number" },
				otherCustomerServices: { type: "number" },
				creditCard: { type: "number" },
				securitiesActivities: { type: "number" },
				trustFeesbyCommissions: { type: "number" },
				serviceChargeOnDepositorAccounts: { type: "number" },
				totalPremiumsEarned: { type: "number" },
				otherInterestExpense: { type: "number" },
				interestExpenseForFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				interestExpenseForLongTermDebtAndCapitalSecurities: { type: "number" },
				interestExpenseForShortTermDebt: { type: "number" },
				interestExpenseForDeposit: { type: "number" },
				otherInterestIncome: { type: "number" },
				interestIncomeFromFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				interestIncomeFromDeposits: { type: "number" },
				interestIncomeFromSecurities: { type: "number" },
				interestIncomeFromLoansAndLease: { type: "number" },
				interestIncomeFromLeases: { type: "number" },
				interestIncomeFromLoans: { type: "number" },
				depreciationDepreciationIncomeStatement: { type: "number" },
				operationAndMaintenance: { type: "number" },
				otherCostofRevenue: { type: "number" },
				explorationDevelopmentAndMineralPropertyLeaseExpenses: { type: "number" }
			},
			required: [
				"date",
				"TYPE",
				"periodType"
			],
			additionalProperties: !1
		},
		FundamentalsTimeSeriesBalanceSheetResult: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				TYPE: {
					type: "string",
					const: "BALANCE_SHEET"
				},
				periodType: { $ref: "#/definitions/FundamentalsTimeSeries_Period" },
				netDebt: { type: "number" },
				treasurySharesNumber: { type: "number" },
				preferredSharesNumber: { type: "number" },
				ordinarySharesNumber: { type: "number" },
				shareIssued: { type: "number" },
				totalDebt: { type: "number" },
				tangibleBookValue: { type: "number" },
				investedCapital: { type: "number" },
				workingCapital: { type: "number" },
				netTangibleAssets: { type: "number" },
				capitalLeaseObligations: { type: "number" },
				commonStockEquity: { type: "number" },
				preferredStockEquity: { type: "number" },
				totalCapitalization: { type: "number" },
				totalEquityGrossMinorityInterest: { type: "number" },
				minorityInterest: { type: "number" },
				stockholdersEquity: { type: "number" },
				otherEquityInterest: { type: "number" },
				gainsLossesNotAffectingRetainedEarnings: { type: "number" },
				otherEquityAdjustments: { type: "number" },
				fixedAssetsRevaluationReserve: { type: "number" },
				foreignCurrencyTranslationAdjustments: { type: "number" },
				minimumPensionLiabilities: { type: "number" },
				unrealizedGainLoss: { type: "number" },
				treasuryStock: { type: "number" },
				retainedEarnings: { type: "number" },
				additionalPaidInCapital: { type: "number" },
				capitalStock: { type: "number" },
				otherCapitalStock: { type: "number" },
				commonStock: { type: "number" },
				preferredStock: { type: "number" },
				totalPartnershipCapital: { type: "number" },
				generalPartnershipCapital: { type: "number" },
				limitedPartnershipCapital: { type: "number" },
				totalLiabilitiesNetMinorityInterest: { type: "number" },
				totalNonCurrentLiabilitiesNetMinorityInterest: { type: "number" },
				otherNonCurrentLiabilities: { type: "number" },
				liabilitiesHeldforSaleNonCurrent: { type: "number" },
				restrictedCommonStock: { type: "number" },
				preferredSecuritiesOutsideStockEquity: { type: "number" },
				derivativeProductLiabilities: { type: "number" },
				employeeBenefits: { type: "number" },
				nonCurrentPensionAndOtherPostretirementBenefitPlans: { type: "number" },
				nonCurrentAccruedExpenses: { type: "number" },
				duetoRelatedPartiesNonCurrent: { type: "number" },
				tradeandOtherPayablesNonCurrent: { type: "number" },
				nonCurrentDeferredLiabilities: { type: "number" },
				nonCurrentDeferredRevenue: { type: "number" },
				nonCurrentDeferredTaxesLiabilities: { type: "number" },
				longTermDebtAndCapitalLeaseObligation: { type: "number" },
				longTermCapitalLeaseObligation: { type: "number" },
				longTermDebt: { type: "number" },
				longTermProvisions: { type: "number" },
				currentLiabilities: { type: "number" },
				otherCurrentLiabilities: { type: "number" },
				currentDeferredLiabilities: { type: "number" },
				currentDeferredRevenue: { type: "number" },
				currentDeferredTaxesLiabilities: { type: "number" },
				currentDebtAndCapitalLeaseObligation: { type: "number" },
				currentCapitalLeaseObligation: { type: "number" },
				currentDebt: { type: "number" },
				otherCurrentBorrowings: { type: "number" },
				lineOfCredit: { type: "number" },
				commercialPaper: { type: "number" },
				currentNotesPayable: { type: "number" },
				pensionandOtherPostRetirementBenefitPlansCurrent: { type: "number" },
				currentProvisions: { type: "number" },
				payablesAndAccruedExpenses: { type: "number" },
				currentAccruedExpenses: { type: "number" },
				interestPayable: { type: "number" },
				payables: { type: "number" },
				otherPayable: { type: "number" },
				duetoRelatedPartiesCurrent: { type: "number" },
				dividendsPayable: { type: "number" },
				totalTaxPayable: { type: "number" },
				incomeTaxPayable: { type: "number" },
				accountsPayable: { type: "number" },
				totalAssets: { type: "number" },
				totalNonCurrentAssets: { type: "number" },
				otherNonCurrentAssets: { type: "number" },
				definedPensionBenefit: { type: "number" },
				nonCurrentPrepaidAssets: { type: "number" },
				nonCurrentDeferredAssets: { type: "number" },
				nonCurrentDeferredTaxesAssets: { type: "number" },
				duefromRelatedPartiesNonCurrent: { type: "number" },
				nonCurrentNoteReceivables: { type: "number" },
				nonCurrentAccountsReceivable: { type: "number" },
				financialAssets: { type: "number" },
				investmentsAndAdvances: { type: "number" },
				otherInvestments: { type: "number" },
				investmentinFinancialAssets: { type: "number" },
				heldToMaturitySecurities: { type: "number" },
				availableForSaleSecurities: { type: "number" },
				financialAssetsDesignatedasFairValueThroughProfitorLossTotal: { type: "number" },
				tradingSecurities: { type: "number" },
				longTermEquityInvestment: { type: "number" },
				investmentsinJointVenturesatCost: { type: "number" },
				investmentsInOtherVenturesUnderEquityMethod: { type: "number" },
				investmentsinAssociatesatCost: { type: "number" },
				investmentsinSubsidiariesatCost: { type: "number" },
				investmentProperties: { type: "number" },
				goodwillAndOtherIntangibleAssets: { type: "number" },
				otherIntangibleAssets: { type: "number" },
				goodwill: { type: "number" },
				netPPE: { type: "number" },
				accumulatedDepreciation: { type: "number" },
				grossPPE: { type: "number" },
				leases: { type: "number" },
				constructionInProgress: { type: "number" },
				otherProperties: { type: "number" },
				machineryFurnitureEquipment: { type: "number" },
				buildingsAndImprovements: { type: "number" },
				landAndImprovements: { type: "number" },
				properties: { type: "number" },
				currentAssets: { type: "number" },
				otherCurrentAssets: { type: "number" },
				hedgingAssetsCurrent: { type: "number" },
				assetsHeldForSaleCurrent: { type: "number" },
				currentDeferredAssets: { type: "number" },
				currentDeferredTaxesAssets: { type: "number" },
				restrictedCash: { type: "number" },
				prepaidAssets: { type: "number" },
				inventory: { type: "number" },
				inventoriesAdjustmentsAllowances: { type: "number" },
				otherInventories: { type: "number" },
				finishedGoods: { type: "number" },
				workInProcess: { type: "number" },
				rawMaterials: { type: "number" },
				receivables: { type: "number" },
				receivablesAdjustmentsAllowances: { type: "number" },
				otherReceivables: { type: "number" },
				duefromRelatedPartiesCurrent: { type: "number" },
				taxesReceivable: { type: "number" },
				accruedInterestReceivable: { type: "number" },
				notesReceivable: { type: "number" },
				loansReceivable: { type: "number" },
				accountsReceivable: { type: "number" },
				allowanceForDoubtfulAccountsReceivable: { type: "number" },
				grossAccountsReceivable: { type: "number" },
				cashCashEquivalentsAndShortTermInvestments: { type: "number" },
				otherShortTermInvestments: { type: "number" },
				cashAndCashEquivalents: { type: "number" },
				cashEquivalents: { type: "number" },
				cashFinancial: { type: "number" },
				otherLiabilities: { type: "number" },
				liabilitiesOfDiscontinuedOperations: { type: "number" },
				subordinatedLiabilities: { type: "number" },
				advanceFromFederalHomeLoanBanks: { type: "number" },
				tradingLiabilities: { type: "number" },
				duetoRelatedParties: { type: "number" },
				securitiesLoaned: { type: "number" },
				federalFundsPurchasedAndSecuritiesSoldUnderAgreementToRepurchase: { type: "number" },
				financialInstrumentsSoldUnderAgreementsToRepurchase: { type: "number" },
				federalFundsPurchased: { type: "number" },
				totalDeposits: { type: "number" },
				nonInterestBearingDeposits: { type: "number" },
				interestBearingDepositsLiabilities: { type: "number" },
				customerAccounts: { type: "number" },
				depositsbyBank: { type: "number" },
				otherAssets: { type: "number" },
				assetsHeldForSale: { type: "number" },
				deferredAssets: { type: "number" },
				deferredTaxAssets: { type: "number" },
				dueFromRelatedParties: { type: "number" },
				allowanceForNotesReceivable: { type: "number" },
				grossNotesReceivable: { type: "number" },
				netLoan: { type: "number" },
				unearnedIncome: { type: "number" },
				allowanceForLoansAndLeaseLosses: { type: "number" },
				grossLoan: { type: "number" },
				otherLoanAssets: { type: "number" },
				mortgageLoan: { type: "number" },
				consumerLoan: { type: "number" },
				commercialLoan: { type: "number" },
				loansHeldForSale: { type: "number" },
				derivativeAssets: { type: "number" },
				securitiesAndInvestments: { type: "number" },
				bankOwnedLifeInsurance: { type: "number" },
				otherRealEstateOwned: { type: "number" },
				foreclosedAssets: { type: "number" },
				customerAcceptances: { type: "number" },
				federalHomeLoanBankStock: { type: "number" },
				securityBorrowed: { type: "number" },
				cashCashEquivalentsAndFederalFundsSold: { type: "number" },
				moneyMarketInvestments: { type: "number" },
				federalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				securityAgreeToBeResell: { type: "number" },
				federalFundsSold: { type: "number" },
				restrictedCashAndInvestments: { type: "number" },
				restrictedInvestments: { type: "number" },
				restrictedCashAndCashEquivalents: { type: "number" },
				interestBearingDepositsAssets: { type: "number" },
				cashAndDueFromBanks: { type: "number" },
				bankIndebtedness: { type: "number" },
				mineralProperties: { type: "number" },
				netPPEPurchaseAndSale: { type: "number" },
				purchaseOfInvestment: { type: "number" },
				investingCashFlow: { type: "number" },
				grossProfit: { type: "number" },
				cashFlowFromContinuingOperatingActivities: { type: "number" },
				endCashPosition: { type: "number" },
				netIncomeCommonStockholders: { type: "number" },
				changeInAccountPayable: { type: "number" },
				otherNonCashItems: { type: "number" },
				cashDividendsPaid: { type: "number" },
				dilutedAverageShares: { type: "number" },
				repurchaseOfCapitalStock: { type: "number" },
				EBITDA: { type: "number" },
				stockBasedCompensation: { type: "number" },
				commonStockDividendPaid: { type: "number" },
				changeInPayable: { type: "number" },
				costOfRevenue: { type: "number" },
				operatingExpense: { type: "number" },
				changeInInventory: { type: "number" },
				normalizedIncome: { type: "number" },
				netIncomeIncludingNoncontrollingInterests: { type: "number" },
				netIncomeFromContinuingOperationNetMinorityInterest: { type: "number" },
				reconciledCostOfRevenue: { type: "number" },
				otherIncomeExpense: { type: "number" },
				netInvestmentPurchaseAndSale: { type: "number" },
				purchaseOfPPE: { type: "number" },
				taxProvision: { type: "number" },
				pretaxIncome: { type: "number" },
				researchAndDevelopment: { type: "number" },
				longTermDebtPayments: { type: "number" },
				changeInReceivables: { type: "number" },
				dilutedEPS: { type: "number" },
				netIssuancePaymentsOfDebt: { type: "number" },
				netShortTermDebtIssuance: { type: "number" },
				depreciationAndAmortization: { type: "number" },
				cashFlowFromContinuingInvestingActivities: { type: "number" },
				beginningCashPosition: { type: "number" },
				changesInCash: { type: "number" },
				financingCashFlow: { type: "number" },
				changeInOtherCurrentLiabilities: { type: "number" },
				changeInWorkingCapital: { type: "number" },
				operatingIncome: { type: "number" },
				totalRevenue: { type: "number" },
				netIncomeFromContinuingAndDiscontinuedOperation: { type: "number" },
				operatingRevenue: { type: "number" },
				changeInPayablesAndAccruedExpense: { type: "number" },
				netCommonStockIssuance: { type: "number" },
				commonStockPayments: { type: "number" },
				EBIT: { type: "number" },
				netOtherInvestingChanges: { type: "number" },
				basicEPS: { type: "number" },
				shortTermDebtPayments: { type: "number" },
				sellingGeneralAndAdministration: { type: "number" },
				netIncomeContinuousOperations: { type: "number" },
				repaymentOfDebt: { type: "number" },
				totalOperatingIncomeAsReported: { type: "number" },
				normalizedEBITDA: { type: "number" },
				capitalExpenditure: { type: "number" },
				cashFlowFromContinuingFinancingActivities: { type: "number" },
				netIncome: { type: "number" },
				netOtherFinancingCharges: { type: "number" },
				basicAverageShares: { type: "number" },
				netLongTermDebtIssuance: { type: "number" },
				depreciationAmortizationDepletion: { type: "number" },
				operatingCashFlow: { type: "number" },
				dilutedNIAvailtoComStockholders: { type: "number" },
				netIncomeFromContinuingOperations: { type: "number" },
				taxRateForCalcs: { type: "number" },
				freeCashFlow: { type: "number" },
				otherNonOperatingIncomeExpenses: { type: "number" },
				changesInAccountReceivables: { type: "number" },
				totalExpenses: { type: "number" },
				changeInOtherCurrentAssets: { type: "number" },
				reconciledDepreciation: { type: "number" },
				incomeTaxPaidSupplementalData: { type: "number" },
				saleOfInvestment: { type: "number" },
				interestPaidSupplementalData: { type: "number" },
				deferredTax: { type: "number" },
				changeInOtherWorkingCapital: { type: "number" },
				interestIncomeNonOperating: { type: "number" },
				issuanceOfDebt: { type: "number" },
				purchaseOfBusiness: { type: "number" },
				longTermDebtIssuance: { type: "number" },
				interestIncome: { type: "number" },
				netInterestIncome: { type: "number" },
				deferredIncomeTax: { type: "number" },
				interestExpense: { type: "number" },
				netNonOperatingInterestIncomeExpense: { type: "number" },
				interestExpenseNonOperating: { type: "number" },
				netBusinessPurchaseAndSale: { type: "number" }
			},
			required: [
				"date",
				"TYPE",
				"periodType"
			],
			additionalProperties: !1
		},
		FundamentalsTimeSeriesCashFlowResult: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				TYPE: {
					type: "string",
					const: "CASH_FLOW"
				},
				periodType: { $ref: "#/definitions/FundamentalsTimeSeries_Period" },
				freeCashFlow: { type: "number" },
				foreignSales: { type: "number" },
				domesticSales: { type: "number" },
				adjustedGeographySegmentData: { type: "number" },
				repurchaseOfCapitalStock: { type: "number" },
				repaymentOfDebt: { type: "number" },
				issuanceOfDebt: { type: "number" },
				issuanceOfCapitalStock: { type: "number" },
				capitalExpenditure: { type: "number" },
				interestPaidSupplementalData: { type: "number" },
				incomeTaxPaidSupplementalData: { type: "number" },
				endCashPosition: { type: "number" },
				otherCashAdjustmentOutsideChangeinCash: { type: "number" },
				beginningCashPosition: { type: "number" },
				effectOfExchangeRateChanges: { type: "number" },
				changesInCash: { type: "number" },
				otherCashAdjustmentInsideChangeinCash: { type: "number" },
				cashFlowFromDiscontinuedOperation: { type: "number" },
				financingCashFlow: { type: "number" },
				cashFromDiscontinuedFinancingActivities: { type: "number" },
				cashFlowFromContinuingFinancingActivities: { type: "number" },
				netOtherFinancingCharges: { type: "number" },
				interestPaidCFF: { type: "number" },
				proceedsFromStockOptionExercised: { type: "number" },
				cashDividendsPaid: { type: "number" },
				preferredStockDividendPaid: { type: "number" },
				commonStockDividendPaid: { type: "number" },
				netPreferredStockIssuance: { type: "number" },
				preferredStockPayments: { type: "number" },
				preferredStockIssuance: { type: "number" },
				netCommonStockIssuance: { type: "number" },
				commonStockPayments: { type: "number" },
				commonStockIssuance: { type: "number" },
				netIssuancePaymentsOfDebt: { type: "number" },
				netShortTermDebtIssuance: { type: "number" },
				shortTermDebtPayments: { type: "number" },
				shortTermDebtIssuance: { type: "number" },
				netLongTermDebtIssuance: { type: "number" },
				longTermDebtPayments: { type: "number" },
				longTermDebtIssuance: { type: "number" },
				investingCashFlow: { type: "number" },
				cashFromDiscontinuedInvestingActivities: { type: "number" },
				cashFlowFromContinuingInvestingActivities: { type: "number" },
				netOtherInvestingChanges: { type: "number" },
				interestReceivedCFI: { type: "number" },
				dividendsReceivedCFI: { type: "number" },
				netInvestmentPurchaseAndSale: { type: "number" },
				saleOfInvestment: { type: "number" },
				purchaseOfInvestment: { type: "number" },
				netInvestmentPropertiesPurchaseAndSale: { type: "number" },
				saleOfInvestmentProperties: { type: "number" },
				purchaseOfInvestmentProperties: { type: "number" },
				netBusinessPurchaseAndSale: { type: "number" },
				saleOfBusiness: { type: "number" },
				purchaseOfBusiness: { type: "number" },
				netIntangiblesPurchaseAndSale: { type: "number" },
				saleOfIntangibles: { type: "number" },
				purchaseOfIntangibles: { type: "number" },
				netPPEPurchaseAndSale: { type: "number" },
				saleOfPPE: { type: "number" },
				purchaseOfPPE: { type: "number" },
				capitalExpenditureReported: { type: "number" },
				operatingCashFlow: { type: "number" },
				cashFromDiscontinuedOperatingActivities: { type: "number" },
				cashFlowFromContinuingOperatingActivities: { type: "number" },
				taxesRefundPaid: { type: "number" },
				interestReceivedCFO: { type: "number" },
				interestPaidCFO: { type: "number" },
				dividendReceivedCFO: { type: "number" },
				dividendPaidCFO: { type: "number" },
				changeInWorkingCapital: { type: "number" },
				changeInOtherWorkingCapital: { type: "number" },
				changeInOtherCurrentLiabilities: { type: "number" },
				changeInOtherCurrentAssets: { type: "number" },
				changeInPayablesAndAccruedExpense: { type: "number" },
				changeInAccruedExpense: { type: "number" },
				changeInInterestPayable: { type: "number" },
				changeInPayable: { type: "number" },
				changeInDividendPayable: { type: "number" },
				changeInAccountPayable: { type: "number" },
				changeInTaxPayable: { type: "number" },
				changeInIncomeTaxPayable: { type: "number" },
				changeInPrepaidAssets: { type: "number" },
				changeInInventory: { type: "number" },
				changeInReceivables: { type: "number" },
				changesInAccountReceivables: { type: "number" },
				otherNonCashItems: { type: "number" },
				excessTaxBenefitFromStockBasedCompensation: { type: "number" },
				stockBasedCompensation: { type: "number" },
				unrealizedGainLossOnInvestmentSecurities: { type: "number" },
				provisionandWriteOffofAssets: { type: "number" },
				assetImpairmentCharge: { type: "number" },
				amortizationOfSecurities: { type: "number" },
				deferredTax: { type: "number" },
				deferredIncomeTax: { type: "number" },
				depletion: { type: "number" },
				depreciationAndAmortization: { type: "number" },
				amortizationCashFlow: { type: "number" },
				amortizationOfIntangibles: { type: "number" },
				depreciation: { type: "number" },
				operatingGainsLosses: { type: "number" },
				pensionAndEmployeeBenefitExpense: { type: "number" },
				earningsLossesFromEquityInvestments: { type: "number" },
				gainLossOnInvestmentSecurities: { type: "number" },
				netForeignCurrencyExchangeGainLoss: { type: "number" },
				gainLossOnSaleOfPPE: { type: "number" },
				gainLossOnSaleOfBusiness: { type: "number" },
				netIncomeFromContinuingOperations: { type: "number" },
				cashFlowsfromusedinOperatingActivitiesDirect: { type: "number" },
				taxesRefundPaidDirect: { type: "number" },
				interestReceivedDirect: { type: "number" },
				interestPaidDirect: { type: "number" },
				dividendsReceivedDirect: { type: "number" },
				dividendsPaidDirect: { type: "number" },
				classesofCashPayments: { type: "number" },
				otherCashPaymentsfromOperatingActivities: { type: "number" },
				paymentsonBehalfofEmployees: { type: "number" },
				paymentstoSuppliersforGoodsandServices: { type: "number" },
				classesofCashReceiptsfromOperatingActivities: { type: "number" },
				otherCashReceiptsfromOperatingActivities: { type: "number" },
				receiptsfromGovernmentGrants: { type: "number" },
				receiptsfromCustomers: { type: "number" },
				increaseDecreaseInDeposit: { type: "number" },
				changeInFederalFundsAndSecuritiesSoldForRepurchase: { type: "number" },
				netProceedsPaymentForLoan: { type: "number" },
				paymentForLoans: { type: "number" },
				proceedsFromLoans: { type: "number" },
				proceedsPaymentInInterestBearingDepositsInBank: { type: "number" },
				increaseinInterestBearingDepositsinBank: { type: "number" },
				decreaseinInterestBearingDepositsinBank: { type: "number" },
				proceedsPaymentFederalFundsSoldAndSecuritiesPurchasedUnderAgreementToResell: { type: "number" },
				changeInLoans: { type: "number" },
				changeInDeferredCharges: { type: "number" },
				provisionForLoanLeaseAndOtherLosses: { type: "number" },
				amortizationOfFinancingCostsAndDiscounts: { type: "number" },
				depreciationAmortizationDepletion: { type: "number" },
				realizedGainLossOnSaleOfLoansAndLease: { type: "number" },
				allTaxesPaid: { type: "number" },
				interestandCommissionPaid: { type: "number" },
				cashPaymentsforLoans: { type: "number" },
				cashPaymentsforDepositsbyBanksandCustomers: { type: "number" },
				cashReceiptsfromFeesandCommissions: { type: "number" },
				cashReceiptsfromSecuritiesRelatedActivities: { type: "number" },
				cashReceiptsfromLoans: { type: "number" },
				cashReceiptsfromDepositsbyBanksandCustomers: { type: "number" },
				cashReceiptsfromTaxRefunds: { type: "number" },
				AmortizationAmortizationCashFlow: { type: "number" }
			},
			required: [
				"date",
				"TYPE",
				"periodType"
			],
			additionalProperties: !1
		},
		FundamentalsTimeSeriesAllResult: {
			type: "object",
			additionalProperties: !1,
			properties: {
				TYPE: {
					type: "string",
					const: "ALL"
				},
				date: {
					type: "string",
					format: "date-time"
				},
				periodType: { $ref: "#/definitions/FundamentalsTimeSeries_Period" },
				freeCashFlow: { type: "number" },
				foreignSales: { type: "number" },
				domesticSales: { type: "number" },
				adjustedGeographySegmentData: { type: "number" },
				repurchaseOfCapitalStock: { type: "number" },
				repaymentOfDebt: { type: "number" },
				issuanceOfDebt: { type: "number" },
				issuanceOfCapitalStock: { type: "number" },
				capitalExpenditure: { type: "number" },
				interestPaidSupplementalData: { type: "number" },
				incomeTaxPaidSupplementalData: { type: "number" },
				endCashPosition: { type: "number" },
				otherCashAdjustmentOutsideChangeinCash: { type: "number" },
				beginningCashPosition: { type: "number" },
				effectOfExchangeRateChanges: { type: "number" },
				changesInCash: { type: "number" },
				otherCashAdjustmentInsideChangeinCash: { type: "number" },
				cashFlowFromDiscontinuedOperation: { type: "number" },
				financingCashFlow: { type: "number" },
				cashFromDiscontinuedFinancingActivities: { type: "number" },
				cashFlowFromContinuingFinancingActivities: { type: "number" },
				netOtherFinancingCharges: { type: "number" },
				interestPaidCFF: { type: "number" },
				proceedsFromStockOptionExercised: { type: "number" },
				cashDividendsPaid: { type: "number" },
				preferredStockDividendPaid: { type: "number" },
				commonStockDividendPaid: { type: "number" },
				netPreferredStockIssuance: { type: "number" },
				preferredStockPayments: { type: "number" },
				preferredStockIssuance: { type: "number" },
				netCommonStockIssuance: { type: "number" },
				commonStockPayments: { type: "number" },
				commonStockIssuance: { type: "number" },
				netIssuancePaymentsOfDebt: { type: "number" },
				netShortTermDebtIssuance: { type: "number" },
				shortTermDebtPayments: { type: "number" },
				shortTermDebtIssuance: { type: "number" },
				netLongTermDebtIssuance: { type: "number" },
				longTermDebtPayments: { type: "number" },
				longTermDebtIssuance: { type: "number" },
				investingCashFlow: { type: "number" },
				cashFromDiscontinuedInvestingActivities: { type: "number" },
				cashFlowFromContinuingInvestingActivities: { type: "number" },
				netOtherInvestingChanges: { type: "number" },
				interestReceivedCFI: { type: "number" },
				dividendsReceivedCFI: { type: "number" },
				netInvestmentPurchaseAndSale: { type: "number" },
				saleOfInvestment: { type: "number" },
				purchaseOfInvestment: { type: "number" },
				netInvestmentPropertiesPurchaseAndSale: { type: "number" },
				saleOfInvestmentProperties: { type: "number" },
				purchaseOfInvestmentProperties: { type: "number" },
				netBusinessPurchaseAndSale: { type: "number" },
				saleOfBusiness: { type: "number" },
				purchaseOfBusiness: { type: "number" },
				netIntangiblesPurchaseAndSale: { type: "number" },
				saleOfIntangibles: { type: "number" },
				purchaseOfIntangibles: { type: "number" },
				netPPEPurchaseAndSale: { type: "number" },
				saleOfPPE: { type: "number" },
				purchaseOfPPE: { type: "number" },
				capitalExpenditureReported: { type: "number" },
				operatingCashFlow: { type: "number" },
				cashFromDiscontinuedOperatingActivities: { type: "number" },
				cashFlowFromContinuingOperatingActivities: { type: "number" },
				taxesRefundPaid: { type: "number" },
				interestReceivedCFO: { type: "number" },
				interestPaidCFO: { type: "number" },
				dividendReceivedCFO: { type: "number" },
				dividendPaidCFO: { type: "number" },
				changeInWorkingCapital: { type: "number" },
				changeInOtherWorkingCapital: { type: "number" },
				changeInOtherCurrentLiabilities: { type: "number" },
				changeInOtherCurrentAssets: { type: "number" },
				changeInPayablesAndAccruedExpense: { type: "number" },
				changeInAccruedExpense: { type: "number" },
				changeInInterestPayable: { type: "number" },
				changeInPayable: { type: "number" },
				changeInDividendPayable: { type: "number" },
				changeInAccountPayable: { type: "number" },
				changeInTaxPayable: { type: "number" },
				changeInIncomeTaxPayable: { type: "number" },
				changeInPrepaidAssets: { type: "number" },
				changeInInventory: { type: "number" },
				changeInReceivables: { type: "number" },
				changesInAccountReceivables: { type: "number" },
				otherNonCashItems: { type: "number" },
				excessTaxBenefitFromStockBasedCompensation: { type: "number" },
				stockBasedCompensation: { type: "number" },
				unrealizedGainLossOnInvestmentSecurities: { type: "number" },
				provisionandWriteOffofAssets: { type: "number" },
				assetImpairmentCharge: { type: "number" },
				amortizationOfSecurities: { type: "number" },
				deferredTax: { type: "number" },
				deferredIncomeTax: { type: "number" },
				depletion: { type: "number" },
				depreciationAndAmortization: { type: "number" },
				amortizationCashFlow: { type: "number" },
				amortizationOfIntangibles: { type: "number" },
				depreciation: { type: "number" },
				operatingGainsLosses: { type: "number" },
				pensionAndEmployeeBenefitExpense: { type: "number" },
				earningsLossesFromEquityInvestments: { type: "number" },
				gainLossOnInvestmentSecurities: { type: "number" },
				netForeignCurrencyExchangeGainLoss: { type: "number" },
				gainLossOnSaleOfPPE: { type: "number" },
				gainLossOnSaleOfBusiness: { type: "number" },
				netIncomeFromContinuingOperations: { type: "number" },
				cashFlowsfromusedinOperatingActivitiesDirect: { type: "number" },
				taxesRefundPaidDirect: { type: "number" },
				interestReceivedDirect: { type: "number" },
				interestPaidDirect: { type: "number" },
				dividendsReceivedDirect: { type: "number" },
				dividendsPaidDirect: { type: "number" },
				classesofCashPayments: { type: "number" },
				otherCashPaymentsfromOperatingActivities: { type: "number" },
				paymentsonBehalfofEmployees: { type: "number" },
				paymentstoSuppliersforGoodsandServices: { type: "number" },
				classesofCashReceiptsfromOperatingActivities: { type: "number" },
				otherCashReceiptsfromOperatingActivities: { type: "number" },
				receiptsfromGovernmentGrants: { type: "number" },
				receiptsfromCustomers: { type: "number" },
				increaseDecreaseInDeposit: { type: "number" },
				changeInFederalFundsAndSecuritiesSoldForRepurchase: { type: "number" },
				netProceedsPaymentForLoan: { type: "number" },
				paymentForLoans: { type: "number" },
				proceedsFromLoans: { type: "number" },
				proceedsPaymentInInterestBearingDepositsInBank: { type: "number" },
				increaseinInterestBearingDepositsinBank: { type: "number" },
				decreaseinInterestBearingDepositsinBank: { type: "number" },
				proceedsPaymentFederalFundsSoldAndSecuritiesPurchasedUnderAgreementToResell: { type: "number" },
				changeInLoans: { type: "number" },
				changeInDeferredCharges: { type: "number" },
				provisionForLoanLeaseAndOtherLosses: { type: "number" },
				amortizationOfFinancingCostsAndDiscounts: { type: "number" },
				depreciationAmortizationDepletion: { type: "number" },
				realizedGainLossOnSaleOfLoansAndLease: { type: "number" },
				allTaxesPaid: { type: "number" },
				interestandCommissionPaid: { type: "number" },
				cashPaymentsforLoans: { type: "number" },
				cashPaymentsforDepositsbyBanksandCustomers: { type: "number" },
				cashReceiptsfromFeesandCommissions: { type: "number" },
				cashReceiptsfromSecuritiesRelatedActivities: { type: "number" },
				cashReceiptsfromLoans: { type: "number" },
				cashReceiptsfromDepositsbyBanksandCustomers: { type: "number" },
				cashReceiptsfromTaxRefunds: { type: "number" },
				AmortizationAmortizationCashFlow: { type: "number" },
				netDebt: { type: "number" },
				treasurySharesNumber: { type: "number" },
				preferredSharesNumber: { type: "number" },
				ordinarySharesNumber: { type: "number" },
				shareIssued: { type: "number" },
				totalDebt: { type: "number" },
				tangibleBookValue: { type: "number" },
				investedCapital: { type: "number" },
				workingCapital: { type: "number" },
				netTangibleAssets: { type: "number" },
				capitalLeaseObligations: { type: "number" },
				commonStockEquity: { type: "number" },
				preferredStockEquity: { type: "number" },
				totalCapitalization: { type: "number" },
				totalEquityGrossMinorityInterest: { type: "number" },
				minorityInterest: { type: "number" },
				stockholdersEquity: { type: "number" },
				otherEquityInterest: { type: "number" },
				gainsLossesNotAffectingRetainedEarnings: { type: "number" },
				otherEquityAdjustments: { type: "number" },
				fixedAssetsRevaluationReserve: { type: "number" },
				foreignCurrencyTranslationAdjustments: { type: "number" },
				minimumPensionLiabilities: { type: "number" },
				unrealizedGainLoss: { type: "number" },
				treasuryStock: { type: "number" },
				retainedEarnings: { type: "number" },
				additionalPaidInCapital: { type: "number" },
				capitalStock: { type: "number" },
				otherCapitalStock: { type: "number" },
				commonStock: { type: "number" },
				preferredStock: { type: "number" },
				totalPartnershipCapital: { type: "number" },
				generalPartnershipCapital: { type: "number" },
				limitedPartnershipCapital: { type: "number" },
				totalLiabilitiesNetMinorityInterest: { type: "number" },
				totalNonCurrentLiabilitiesNetMinorityInterest: { type: "number" },
				otherNonCurrentLiabilities: { type: "number" },
				liabilitiesHeldforSaleNonCurrent: { type: "number" },
				restrictedCommonStock: { type: "number" },
				preferredSecuritiesOutsideStockEquity: { type: "number" },
				derivativeProductLiabilities: { type: "number" },
				employeeBenefits: { type: "number" },
				nonCurrentPensionAndOtherPostretirementBenefitPlans: { type: "number" },
				nonCurrentAccruedExpenses: { type: "number" },
				duetoRelatedPartiesNonCurrent: { type: "number" },
				tradeandOtherPayablesNonCurrent: { type: "number" },
				nonCurrentDeferredLiabilities: { type: "number" },
				nonCurrentDeferredRevenue: { type: "number" },
				nonCurrentDeferredTaxesLiabilities: { type: "number" },
				longTermDebtAndCapitalLeaseObligation: { type: "number" },
				longTermCapitalLeaseObligation: { type: "number" },
				longTermDebt: { type: "number" },
				longTermProvisions: { type: "number" },
				currentLiabilities: { type: "number" },
				otherCurrentLiabilities: { type: "number" },
				currentDeferredLiabilities: { type: "number" },
				currentDeferredRevenue: { type: "number" },
				currentDeferredTaxesLiabilities: { type: "number" },
				currentDebtAndCapitalLeaseObligation: { type: "number" },
				currentCapitalLeaseObligation: { type: "number" },
				currentDebt: { type: "number" },
				otherCurrentBorrowings: { type: "number" },
				lineOfCredit: { type: "number" },
				commercialPaper: { type: "number" },
				currentNotesPayable: { type: "number" },
				pensionandOtherPostRetirementBenefitPlansCurrent: { type: "number" },
				currentProvisions: { type: "number" },
				payablesAndAccruedExpenses: { type: "number" },
				currentAccruedExpenses: { type: "number" },
				interestPayable: { type: "number" },
				payables: { type: "number" },
				otherPayable: { type: "number" },
				duetoRelatedPartiesCurrent: { type: "number" },
				dividendsPayable: { type: "number" },
				totalTaxPayable: { type: "number" },
				incomeTaxPayable: { type: "number" },
				accountsPayable: { type: "number" },
				totalAssets: { type: "number" },
				totalNonCurrentAssets: { type: "number" },
				otherNonCurrentAssets: { type: "number" },
				definedPensionBenefit: { type: "number" },
				nonCurrentPrepaidAssets: { type: "number" },
				nonCurrentDeferredAssets: { type: "number" },
				nonCurrentDeferredTaxesAssets: { type: "number" },
				duefromRelatedPartiesNonCurrent: { type: "number" },
				nonCurrentNoteReceivables: { type: "number" },
				nonCurrentAccountsReceivable: { type: "number" },
				financialAssets: { type: "number" },
				investmentsAndAdvances: { type: "number" },
				otherInvestments: { type: "number" },
				investmentinFinancialAssets: { type: "number" },
				heldToMaturitySecurities: { type: "number" },
				availableForSaleSecurities: { type: "number" },
				financialAssetsDesignatedasFairValueThroughProfitorLossTotal: { type: "number" },
				tradingSecurities: { type: "number" },
				longTermEquityInvestment: { type: "number" },
				investmentsinJointVenturesatCost: { type: "number" },
				investmentsInOtherVenturesUnderEquityMethod: { type: "number" },
				investmentsinAssociatesatCost: { type: "number" },
				investmentsinSubsidiariesatCost: { type: "number" },
				investmentProperties: { type: "number" },
				goodwillAndOtherIntangibleAssets: { type: "number" },
				otherIntangibleAssets: { type: "number" },
				goodwill: { type: "number" },
				netPPE: { type: "number" },
				accumulatedDepreciation: { type: "number" },
				grossPPE: { type: "number" },
				leases: { type: "number" },
				constructionInProgress: { type: "number" },
				otherProperties: { type: "number" },
				machineryFurnitureEquipment: { type: "number" },
				buildingsAndImprovements: { type: "number" },
				landAndImprovements: { type: "number" },
				properties: { type: "number" },
				currentAssets: { type: "number" },
				otherCurrentAssets: { type: "number" },
				hedgingAssetsCurrent: { type: "number" },
				assetsHeldForSaleCurrent: { type: "number" },
				currentDeferredAssets: { type: "number" },
				currentDeferredTaxesAssets: { type: "number" },
				restrictedCash: { type: "number" },
				prepaidAssets: { type: "number" },
				inventory: { type: "number" },
				inventoriesAdjustmentsAllowances: { type: "number" },
				otherInventories: { type: "number" },
				finishedGoods: { type: "number" },
				workInProcess: { type: "number" },
				rawMaterials: { type: "number" },
				receivables: { type: "number" },
				receivablesAdjustmentsAllowances: { type: "number" },
				otherReceivables: { type: "number" },
				duefromRelatedPartiesCurrent: { type: "number" },
				taxesReceivable: { type: "number" },
				accruedInterestReceivable: { type: "number" },
				notesReceivable: { type: "number" },
				loansReceivable: { type: "number" },
				accountsReceivable: { type: "number" },
				allowanceForDoubtfulAccountsReceivable: { type: "number" },
				grossAccountsReceivable: { type: "number" },
				cashCashEquivalentsAndShortTermInvestments: { type: "number" },
				otherShortTermInvestments: { type: "number" },
				cashAndCashEquivalents: { type: "number" },
				cashEquivalents: { type: "number" },
				cashFinancial: { type: "number" },
				otherLiabilities: { type: "number" },
				liabilitiesOfDiscontinuedOperations: { type: "number" },
				subordinatedLiabilities: { type: "number" },
				advanceFromFederalHomeLoanBanks: { type: "number" },
				tradingLiabilities: { type: "number" },
				duetoRelatedParties: { type: "number" },
				securitiesLoaned: { type: "number" },
				federalFundsPurchasedAndSecuritiesSoldUnderAgreementToRepurchase: { type: "number" },
				financialInstrumentsSoldUnderAgreementsToRepurchase: { type: "number" },
				federalFundsPurchased: { type: "number" },
				totalDeposits: { type: "number" },
				nonInterestBearingDeposits: { type: "number" },
				interestBearingDepositsLiabilities: { type: "number" },
				customerAccounts: { type: "number" },
				depositsbyBank: { type: "number" },
				otherAssets: { type: "number" },
				assetsHeldForSale: { type: "number" },
				deferredAssets: { type: "number" },
				deferredTaxAssets: { type: "number" },
				dueFromRelatedParties: { type: "number" },
				allowanceForNotesReceivable: { type: "number" },
				grossNotesReceivable: { type: "number" },
				netLoan: { type: "number" },
				unearnedIncome: { type: "number" },
				allowanceForLoansAndLeaseLosses: { type: "number" },
				grossLoan: { type: "number" },
				otherLoanAssets: { type: "number" },
				mortgageLoan: { type: "number" },
				consumerLoan: { type: "number" },
				commercialLoan: { type: "number" },
				loansHeldForSale: { type: "number" },
				derivativeAssets: { type: "number" },
				securitiesAndInvestments: { type: "number" },
				bankOwnedLifeInsurance: { type: "number" },
				otherRealEstateOwned: { type: "number" },
				foreclosedAssets: { type: "number" },
				customerAcceptances: { type: "number" },
				federalHomeLoanBankStock: { type: "number" },
				securityBorrowed: { type: "number" },
				cashCashEquivalentsAndFederalFundsSold: { type: "number" },
				moneyMarketInvestments: { type: "number" },
				federalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				securityAgreeToBeResell: { type: "number" },
				federalFundsSold: { type: "number" },
				restrictedCashAndInvestments: { type: "number" },
				restrictedInvestments: { type: "number" },
				restrictedCashAndCashEquivalents: { type: "number" },
				interestBearingDepositsAssets: { type: "number" },
				cashAndDueFromBanks: { type: "number" },
				bankIndebtedness: { type: "number" },
				mineralProperties: { type: "number" },
				grossProfit: { type: "number" },
				netIncomeCommonStockholders: { type: "number" },
				dilutedAverageShares: { type: "number" },
				EBITDA: { type: "number" },
				costOfRevenue: { type: "number" },
				operatingExpense: { type: "number" },
				normalizedIncome: { type: "number" },
				netIncomeIncludingNoncontrollingInterests: { type: "number" },
				netIncomeFromContinuingOperationNetMinorityInterest: { type: "number" },
				reconciledCostOfRevenue: { type: "number" },
				otherIncomeExpense: { type: "number" },
				taxProvision: { type: "number" },
				pretaxIncome: { type: "number" },
				researchAndDevelopment: { type: "number" },
				dilutedEPS: { type: "number" },
				operatingIncome: { type: "number" },
				totalRevenue: { type: "number" },
				netIncomeFromContinuingAndDiscontinuedOperation: { type: "number" },
				operatingRevenue: { type: "number" },
				EBIT: { type: "number" },
				basicEPS: { type: "number" },
				sellingGeneralAndAdministration: { type: "number" },
				netIncomeContinuousOperations: { type: "number" },
				totalOperatingIncomeAsReported: { type: "number" },
				normalizedEBITDA: { type: "number" },
				netIncome: { type: "number" },
				basicAverageShares: { type: "number" },
				dilutedNIAvailtoComStockholders: { type: "number" },
				taxRateForCalcs: { type: "number" },
				otherNonOperatingIncomeExpenses: { type: "number" },
				totalExpenses: { type: "number" },
				reconciledDepreciation: { type: "number" },
				interestIncomeNonOperating: { type: "number" },
				interestIncome: { type: "number" },
				netInterestIncome: { type: "number" },
				interestExpense: { type: "number" },
				netNonOperatingInterestIncomeExpense: { type: "number" },
				interestExpenseNonOperating: { type: "number" },
				sellingAndMarketingExpense: { type: "number" },
				generalAndAdministrativeExpense: { type: "number" },
				otherGandA: { type: "number" },
				depreciationAmortizationDepletionIncomeStatement: { type: "number" },
				depletionIncomeStatement: { type: "number" },
				depreciationAndAmortizationInIncomeStatement: { type: "number" },
				amortization: { type: "number" },
				amortizationOfIntangiblesIncomeStatement: { type: "number" },
				depreciationIncomeStatement: { type: "number" },
				otherOperatingExpenses: { type: "number" },
				totalOtherFinanceCost: { type: "number" },
				writeOff: { type: "number" },
				specialIncomeCharges: { type: "number" },
				gainOnSaleOfPPE: { type: "number" },
				gainOnSaleOfBusiness: { type: "number" },
				gainOnSaleOfSecurity: { type: "number" },
				otherSpecialCharges: { type: "number" },
				minorityInterests: { type: "number" },
				netIncomeFromTaxLossCarryforward: { type: "number" },
				netIncomeExtraordinary: { type: "number" },
				netIncomeDiscontinuousOperations: { type: "number" },
				preferredStockDividends: { type: "number" },
				otherunderPreferredStockDividend: { type: "number" },
				dividendPerShare: { type: "number" },
				reportedNormalizedBasicEPS: { type: "number" },
				continuingAndDiscontinuedBasicEPS: { type: "number" },
				basicEPSOtherGainsLosses: { type: "number" },
				taxLossCarryforwardBasicEPS: { type: "number" },
				normalizedBasicEPS: { type: "number" },
				basicAccountingChange: { type: "number" },
				basicExtraordinary: { type: "number" },
				basicDiscontinuousOperations: { type: "number" },
				basicContinuousOperations: { type: "number" },
				reportedNormalizedDilutedEPS: { type: "number" },
				continuingAndDiscontinuedDilutedEPS: { type: "number" },
				taxLossCarryforwardDilutedEPS: { type: "number" },
				averageDilutionEarnings: { type: "number" },
				normalizedDilutedEPS: { type: "number" },
				dilutedAccountingChange: { type: "number" },
				dilutedExtraordinary: { type: "number" },
				dilutedContinuousOperations: { type: "number" },
				dilutedDiscontinuousOperations: { type: "number" },
				dilutedEPSOtherGainsLosses: { type: "number" },
				totalUnusualItemsExcludingGoodwill: { type: "number" },
				totalUnusualItems: { type: "number" },
				taxEffectOfUnusualItems: { type: "number" },
				rentExpenseSupplemental: { type: "number" },
				earningsFromEquityInterestNetOfTax: { type: "number" },
				impairmentOfCapitalAssets: { type: "number" },
				restructuringAndMergernAcquisition: { type: "number" },
				securitiesAmortization: { type: "number" },
				earningsFromEquityInterest: { type: "number" },
				otherTaxes: { type: "number" },
				provisionForDoubtfulAccounts: { type: "number" },
				insuranceAndClaims: { type: "number" },
				rentAndLandingFees: { type: "number" },
				salariesAndWages: { type: "number" },
				exciseTaxes: { type: "number" },
				totalMoneyMarketInvestments: { type: "number" },
				interestIncomeAfterProvisionForLoanLoss: { type: "number" },
				otherThanPreferredStockDividend: { type: "number" },
				lossonExtinguishmentofDebt: { type: "number" },
				incomefromAssociatesandOtherParticipatingInterests: { type: "number" },
				nonInterestExpense: { type: "number" },
				otherNonInterestExpense: { type: "number" },
				professionalExpenseAndContractServicesExpense: { type: "number" },
				occupancyAndEquipment: { type: "number" },
				equipment: { type: "number" },
				netOccupancyExpense: { type: "number" },
				creditLossesProvision: { type: "number" },
				nonInterestIncome: { type: "number" },
				otherNonInterestIncome: { type: "number" },
				gainLossonSaleofAssets: { type: "number" },
				gainonSaleofInvestmentProperty: { type: "number" },
				gainonSaleofLoans: { type: "number" },
				foreignExchangeTradingGains: { type: "number" },
				tradingGainLoss: { type: "number" },
				investmentBankingProfit: { type: "number" },
				dividendIncome: { type: "number" },
				feesAndCommissions: { type: "number" },
				feesandCommissionExpense: { type: "number" },
				feesandCommissionIncome: { type: "number" },
				otherCustomerServices: { type: "number" },
				creditCard: { type: "number" },
				securitiesActivities: { type: "number" },
				trustFeesbyCommissions: { type: "number" },
				serviceChargeOnDepositorAccounts: { type: "number" },
				totalPremiumsEarned: { type: "number" },
				otherInterestExpense: { type: "number" },
				interestExpenseForFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				interestExpenseForLongTermDebtAndCapitalSecurities: { type: "number" },
				interestExpenseForShortTermDebt: { type: "number" },
				interestExpenseForDeposit: { type: "number" },
				otherInterestIncome: { type: "number" },
				interestIncomeFromFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell: { type: "number" },
				interestIncomeFromDeposits: { type: "number" },
				interestIncomeFromSecurities: { type: "number" },
				interestIncomeFromLoansAndLease: { type: "number" },
				interestIncomeFromLeases: { type: "number" },
				interestIncomeFromLoans: { type: "number" },
				depreciationDepreciationIncomeStatement: { type: "number" },
				operationAndMaintenance: { type: "number" },
				otherCostofRevenue: { type: "number" },
				explorationDevelopmentAndMineralPropertyLeaseExpenses: { type: "number" }
			},
			required: [
				"TYPE",
				"date",
				"periodType"
			]
		},
		FundamentalsTimeSeriesResult: { anyOf: [
			{ $ref: "#/definitions/FundamentalsTimeSeriesBalanceSheetResult" },
			{ $ref: "#/definitions/FundamentalsTimeSeriesCashFlowResult" },
			{ $ref: "#/definitions/FundamentalsTimeSeriesFinancialsResult" },
			{ $ref: "#/definitions/FundamentalsTimeSeriesAllResult" }
		] },
		FundamentalsTimeSeriesResults: {
			type: "array",
			items: { $ref: "#/definitions/FundamentalsTimeSeriesResult" }
		},
		FundamentalsTimeSeriesOptions: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "number" },
					{ type: "string" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "number" },
					{ type: "string" }
				] },
				type: { type: "string" },
				merge: { type: "boolean" },
				padTimeSeries: { type: "boolean" },
				lang: { type: "string" },
				region: { type: "string" },
				module: { type: "string" }
			},
			required: ["period1", "module"],
			additionalProperties: !1
		},
		fundamentalsTimeSeries: {},
		processQuery: {},
		processResponse: {}
	}
}), qt = [
	"quarterly",
	"annual",
	"trailing"
], Jt = [
	"financials",
	"balance-sheet",
	"cash-flow",
	"all"
], Yt = {
	merge: !1,
	padTimeSeries: !0,
	lang: "en-US",
	region: "US",
	type: "quarterly"
};
function Xt(e, t, n) {
	return this._moduleExec({
		moduleName: "options",
		query: {
			assertSymbol: e,
			url: `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${e}`,
			needsCrumb: !1,
			definitions: Kt,
			schemaKey: "#/definitions/FundamentalsTimeSeriesOptions",
			defaults: Yt,
			overrides: t,
			transformWith: Zt
		},
		result: {
			definitions: Kt,
			schemaKey: "#/definitions/FundamentalsTimeSeriesResults",
			transformWith(e) {
				if (!e || !e.timeseries) throw Error(`Unexpected result: ${JSON.stringify(e)}`);
				return Qt(e, t.module ?? t.type);
			}
		},
		moduleOptions: n
	});
}
var Zt = function(e) {
	e.period2 ||= /* @__PURE__ */ new Date();
	for (let t of ["period1", "period2"]) {
		let n = e[t];
		if (n instanceof Date) e[t] = Math.floor(n.getTime() / 1e3);
		else if (typeof n == "string") {
			let r = new Date(n).getTime();
			if (isNaN(r)) throw Error("yahooFinance.fundamentalsTimeSeries() option '" + t + "' invalid date provided: '" + n + "'");
			e[t] = Math.floor(r / 1e3);
		}
	}
	if (e.period1 === e.period2) throw Error("yahooFinance.fundamentalsTimeSeries() options `period1` and `period2` cannot share the same value.");
	if (!qt.includes(e.type || "")) throw Error("yahooFinance.fundamentalsTimeSeries() option type invalid.");
	if (!Jt.includes(e.module || "")) throw Error("yahooFinance.fundamentalsTimeSeries() option module invalid.");
	let t = Object.entries(Gt).reduce((t, [n, r]) => e.module == "all" || n == e.module ? t.concat(r) : t, []), n = e.type + t.join(`,${e.type}`);
	return {
		period1: e.period1,
		period2: e.period2,
		type: n
	};
}, Qt = function(e, t) {
	let n = {}, r = new RegExp(qt.join("|"));
	for (let t = 0; t < e.timeseries.result.length; t++) {
		let i = "UNKNOWN", a = e.timeseries.result[t];
		if (!(!a.timestamp || !a.timestamp.length)) for (let e = 0; e < a.timestamp.length; e++) {
			let t = a.timestamp[e], o = Object.keys(a)[2];
			if (n[t] || (n[t] = { date: t }), !a[o][e] || !a[o][e].reportedValue || !a[o][e].reportedValue.raw) continue;
			let s = o.replace(r, ""), c = s == s.toUpperCase() ? s : s[0].toLowerCase() + s.slice(1);
			n[t][c] = a[o][e].reportedValue.raw;
			let l = a[o][e].periodType;
			if (l) {
				if (i !== "UNKNOWN" && i !== l) throw Error("periodType mismatch - please report " + i + " " + l);
				i = l, n[t].periodType = i;
			} else console.log("missing periodType", n[t]);
		}
	}
	return Object.values(n).filter((e) => Object.keys(e).length > 1).map((e) => ({
		TYPE: t === "all" ? "ALL" : t.toUpperCase().replace("-", "_"),
		...e
	}));
}, $t = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		HistoricalHistoryResult: {
			type: "array",
			items: { $ref: "#/definitions/HistoricalRowHistory" }
		},
		HistoricalRowHistory: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				open: { type: "number" },
				high: { type: "number" },
				low: { type: "number" },
				close: { type: "number" },
				adjClose: { type: "number" },
				volume: { type: "number" }
			},
			required: [
				"date",
				"open",
				"high",
				"low",
				"close",
				"volume"
			],
			additionalProperties: {}
		},
		HistoricalDividendsResult: {
			type: "array",
			items: { $ref: "#/definitions/HistoricalRowDividend" }
		},
		HistoricalRowDividend: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				dividends: { type: "number" }
			},
			required: ["date", "dividends"],
			additionalProperties: !1
		},
		HistoricalStockSplitsResult: {
			type: "array",
			items: { $ref: "#/definitions/HistoricalRowStockSplit" }
		},
		HistoricalRowStockSplit: {
			type: "object",
			properties: {
				date: {
					type: "string",
					format: "date-time"
				},
				stockSplits: { type: "string" }
			},
			required: ["date", "stockSplits"],
			additionalProperties: !1
		},
		HistoricalResult: { anyOf: [
			{ $ref: "#/definitions/HistoricalHistoryResult" },
			{ $ref: "#/definitions/HistoricalDividendsResult" },
			{ $ref: "#/definitions/HistoricalStockSplitsResult" }
		] },
		HistoricalOptions: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				interval: {
					type: "string",
					enum: [
						"1d",
						"1wk",
						"1mo"
					]
				},
				events: {
					type: "string",
					enum: [
						"history",
						"dividends",
						"split"
					]
				},
				includeAdjustedClose: { type: "boolean" }
			},
			required: ["period1"],
			additionalProperties: !1
		},
		HistoricalOptionsEventsHistory: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				interval: {
					type: "string",
					enum: [
						"1d",
						"1wk",
						"1mo"
					]
				},
				events: {
					type: "string",
					const: "history"
				},
				includeAdjustedClose: { type: "boolean" }
			},
			additionalProperties: !1,
			required: ["period1"]
		},
		HistoricalOptionsEventsDividends: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				interval: {
					type: "string",
					enum: [
						"1d",
						"1wk",
						"1mo"
					]
				},
				events: {
					type: "string",
					const: "dividends"
				},
				includeAdjustedClose: { type: "boolean" }
			},
			required: ["events", "period1"],
			additionalProperties: !1
		},
		HistoricalOptionsEventsSplit: {
			type: "object",
			properties: {
				period1: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				period2: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "string" },
					{ type: "number" }
				] },
				interval: {
					type: "string",
					enum: [
						"1d",
						"1wk",
						"1mo"
					]
				},
				events: {
					type: "string",
					const: "split"
				},
				includeAdjustedClose: { type: "boolean" }
			},
			required: ["events", "period1"],
			additionalProperties: !1
		},
		nullFieldCount: {},
		historical: {}
	}
}), en = K(zt), tn = {
	interval: "1d",
	events: "history",
	includeAdjustedClose: !0
};
function nn(e) {
	if (e == null) return;
	let t = 0;
	for (let n of Object.values(e)) n === null && t++;
	return t;
}
async function rn(e, t, n) {
	if (this._notices.show("ripHistorical"), !(!t.events || t.events === "history") && t.events !== "dividends" && t.events !== "split") throw Error("No such event type:" + t.events);
	let r = {
		...tn,
		...t
	};
	Y({
		source: "historical",
		type: "options",
		object: r,
		definitions: $t,
		schemaOrSchemaKey: "#/definitions/HistoricalOptions",
		options: this._opts.validation,
		logger: this._opts.logger,
		logObj: this._logObj,
		versionCheck: this._opts.versionCheck
	});
	let i = {
		period1: r.period1,
		period2: r.period2,
		interval: r.interval,
		events: {
			history: "",
			dividends: "div",
			split: "split"
		}[r.events || "history"]
	};
	Y({
		source: "historical",
		type: "options",
		object: i,
		definitions: en,
		schemaOrSchemaKey: "#/definitions/ChartOptions",
		options: this._opts.validation,
		logger: this._opts.logger,
		logObj: this._logObj,
		versionCheck: this._opts.versionCheck
	}), r.includeAdjustedClose;
	let a = await this.chart(e, i, {
		...n,
		validateResult: !0
	}), o;
	o = r.events === "dividends" ? (a.events?.dividends ?? []).map((e) => ({
		date: e.date,
		dividends: e.amount
	})) : r.events === "split" ? (a.events?.splits ?? []).map((e) => ({
		date: e.date,
		stockSplits: e.splitRatio
	})) : (a.quotes ?? []).filter((e) => {
		let t = Object.keys(e).length, n = nn(e);
		if (n === 0) return !0;
		if (n !== t - 1) throw console.error(n, e), Error("Historical returned a result with SOME (but not all) null values.  Please report this, and provide the query that caused it.");
		return !1;
	}).map((e) => {
		if (!e.adjclose) return e;
		let { adjclose: t, ...n } = e;
		return {
			...n,
			adjClose: t
		};
	});
	let s = !n || n.validateResult === void 0 || n.validateResult === !0, c = {
		...this._opts.validation,
		logErrors: s ? this._opts.validation.logErrors : !1
	};
	return Y({
		source: "historical",
		type: "result",
		object: o,
		definitions: $t,
		schemaOrSchemaKey: "#/definitions/HistoricalResult",
		options: c,
		logger: this._opts.logger,
		logObj: this._logObj,
		versionCheck: this._opts.versionCheck
	}), o;
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/insights.js
var an = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		InsightsResult: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				instrumentInfo: { $ref: "#/definitions/InsightsInstrumentInfo" },
				companySnapshot: { $ref: "#/definitions/InsightsCompanySnapshot" },
				recommendation: {
					type: "object",
					properties: {
						targetPrice: { type: "number" },
						provider: { type: "string" },
						rating: {
							type: "string",
							enum: [
								"BUY",
								"SELL",
								"HOLD"
							]
						}
					},
					required: ["provider", "rating"],
					additionalProperties: !1
				},
				events: {
					type: "array",
					items: { $ref: "#/definitions/InsightsEvent" }
				},
				reports: {
					type: "array",
					items: { $ref: "#/definitions/InsightsReport" }
				},
				sigDevs: {
					type: "array",
					items: { $ref: "#/definitions/InsightsSigDev" }
				},
				upsell: { $ref: "#/definitions/InsightsUpsell" },
				upsellSearchDD: {
					type: "object",
					properties: { researchReports: { $ref: "#/definitions/InsightsResearchReport" } },
					required: ["researchReports"],
					additionalProperties: !1
				},
				secReports: {
					type: "array",
					items: { $ref: "#/definitions/InsightsSecReport" }
				}
			},
			required: ["symbol", "sigDevs"],
			additionalProperties: {}
		},
		InsightsInstrumentInfo: {
			type: "object",
			properties: {
				keyTechnicals: {
					type: "object",
					properties: {
						provider: { type: "string" },
						support: { type: "number" },
						resistance: { type: "number" },
						stopLoss: { type: "number" }
					},
					required: ["provider"],
					additionalProperties: {}
				},
				technicalEvents: {
					type: "object",
					properties: {
						provider: { type: "string" },
						sector: { type: "string" },
						shortTermOutlook: { $ref: "#/definitions/InsightsOutlook" },
						intermediateTermOutlook: { $ref: "#/definitions/InsightsOutlook" },
						longTermOutlook: { $ref: "#/definitions/InsightsOutlook" }
					},
					required: [
						"provider",
						"shortTermOutlook",
						"intermediateTermOutlook",
						"longTermOutlook"
					],
					additionalProperties: {}
				},
				valuation: {
					type: "object",
					properties: {
						color: { type: "number" },
						description: { type: "string" },
						discount: { type: "string" },
						provider: { type: "string" },
						relativeValue: { type: "string" }
					},
					required: ["provider"],
					additionalProperties: {}
				}
			},
			required: [
				"keyTechnicals",
				"technicalEvents",
				"valuation"
			],
			additionalProperties: {}
		},
		InsightsOutlook: {
			type: "object",
			properties: {
				stateDescription: { type: "string" },
				direction: { $ref: "#/definitions/InsightsDirection" },
				score: { type: "number" },
				scoreDescription: { type: "string" },
				sectorDirection: { $ref: "#/definitions/InsightsDirection" },
				sectorScore: { type: "number" },
				sectorScoreDescription: { type: "string" },
				indexDirection: { $ref: "#/definitions/InsightsDirection" },
				indexScore: { type: "number" },
				indexScoreDescription: { type: "string" }
			},
			required: [
				"stateDescription",
				"direction",
				"score",
				"scoreDescription",
				"indexDirection",
				"indexScore",
				"indexScoreDescription"
			],
			additionalProperties: {}
		},
		InsightsDirection: {
			type: "string",
			enum: [
				"Bearish",
				"Bullish",
				"Neutral"
			]
		},
		InsightsCompanySnapshot: {
			type: "object",
			properties: {
				sectorInfo: { type: "string" },
				company: {
					type: "object",
					properties: {
						innovativeness: { type: "number" },
						hiring: { type: "number" },
						sustainability: { type: "number" },
						insiderSentiments: { type: "number" },
						earningsReports: { type: "number" },
						dividends: { type: "number" }
					},
					additionalProperties: {}
				},
				sector: {
					type: "object",
					properties: {
						innovativeness: { type: "number" },
						hiring: { type: "number" },
						sustainability: { type: "number" },
						insiderSentiments: { type: "number" },
						earningsReports: { type: "number" },
						dividends: { type: "number" }
					},
					required: [
						"innovativeness",
						"hiring",
						"insiderSentiments",
						"dividends"
					],
					additionalProperties: {}
				}
			},
			required: ["company", "sector"],
			additionalProperties: {}
		},
		InsightsEvent: {
			type: "object",
			properties: {
				eventType: { type: "string" },
				pricePeriod: { type: "string" },
				tradingHorizon: { type: "string" },
				tradeType: { type: "string" },
				imageUrl: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				endDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"eventType",
				"pricePeriod",
				"tradingHorizon",
				"tradeType",
				"imageUrl",
				"startDate",
				"endDate"
			],
			additionalProperties: {}
		},
		InsightsReport: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				headHtml: { type: "string" },
				provider: { type: "string" },
				reportDate: {
					type: "string",
					format: "date-time"
				},
				reportTitle: { type: "string" },
				reportType: { type: "string" },
				targetPrice: { type: "number" },
				targetPriceStatus: {
					type: "string",
					enum: [
						"Increased",
						"Maintained",
						"Decreased",
						"-"
					]
				},
				investmentRating: {
					type: "string",
					enum: [
						"Bullish",
						"Neutral",
						"Bearish"
					]
				},
				tickers: {
					type: "array",
					items: { type: "string" }
				}
			},
			required: [
				"id",
				"headHtml",
				"provider",
				"reportDate",
				"reportTitle",
				"reportType"
			],
			additionalProperties: {}
		},
		InsightsSigDev: {
			type: "object",
			properties: {
				headline: { type: "string" },
				date: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["headline", "date"],
			additionalProperties: {}
		},
		InsightsUpsell: {
			type: "object",
			properties: {
				msBullishSummary: {
					type: "array",
					items: { type: "string" }
				},
				msBearishSummary: {
					type: "array",
					items: { type: "string" }
				},
				msBullishBearishSummariesPublishDate: { $ref: "#/definitions/DateInMs" },
				companyName: { type: "string" },
				upsellReportType: { type: "string" }
			},
			additionalProperties: {}
		},
		DateInMs: {
			type: "string",
			format: "date-time"
		},
		InsightsResearchReport: {
			type: "object",
			properties: {
				reportId: { type: "string" },
				provider: { type: "string" },
				title: { type: "string" },
				reportDate: {
					type: "string",
					format: "date-time"
				},
				summary: { type: "string" },
				investmentRating: {
					type: "string",
					enum: [
						"Bullish",
						"Neutral",
						"Bearish"
					]
				}
			},
			required: [
				"reportId",
				"provider",
				"title",
				"reportDate",
				"summary"
			],
			additionalProperties: !1
		},
		InsightsSecReport: {
			type: "object",
			properties: {
				id: { type: "string" },
				type: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				filingDate: { $ref: "#/definitions/DateInMs" },
				snapshotUrl: { type: "string" },
				formType: { type: "string" }
			},
			required: [
				"id",
				"type",
				"title",
				"description",
				"filingDate",
				"snapshotUrl",
				"formType"
			],
			additionalProperties: !1
		},
		InsightsOptions: {
			type: "object",
			properties: {
				lang: { type: "string" },
				region: { type: "string" },
				reportsCount: { type: "number" }
			},
			additionalProperties: !1
		},
		insights: {}
	}
}), on = {
	lang: "en-US",
	region: "US",
	getAllResearchReports: !0,
	reportsCount: 2
};
function sn(e, t, n) {
	return this._moduleExec({
		moduleName: "insights",
		query: {
			assertSymbol: e,
			url: "https://${YF_QUERY_HOST}/ws/insights/v2/finance/insights",
			definitions: an,
			schemaKey: "#/definitions/InsightsOptions",
			defaults: on,
			overrides: t,
			runtime: { symbol: e }
		},
		result: {
			definitions: an,
			schemaKey: "#/definitions/InsightsResult",
			transformWith(e) {
				if (!e.finance) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.finance.result;
			}
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/options.js
var cn = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		OptionsResult: {
			type: "object",
			properties: {
				underlyingSymbol: { type: "string" },
				expirationDates: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				strikes: {
					type: "array",
					items: { type: "number" }
				},
				hasMiniOptions: { type: "boolean" },
				quote: { $ref: "#/definitions/Quote" },
				options: {
					type: "array",
					items: { $ref: "#/definitions/Option" }
				}
			},
			required: [
				"underlyingSymbol",
				"expirationDates",
				"strikes",
				"hasMiniOptions",
				"quote",
				"options"
			],
			additionalProperties: {}
		},
		Quote: {
			type: "object",
			discriminator: { propertyName: "quoteType" },
			required: ["quoteType"],
			oneOf: [
				{ $ref: "#/definitions/QuoteAltSymbol" },
				{ $ref: "#/definitions/QuoteCryptoCurrency" },
				{ $ref: "#/definitions/QuoteCurrency" },
				{ $ref: "#/definitions/QuoteECNQuote" },
				{ $ref: "#/definitions/QuoteEtf" },
				{ $ref: "#/definitions/QuoteEquity" },
				{ $ref: "#/definitions/QuoteFuture" },
				{ $ref: "#/definitions/QuoteIndex" },
				{ $ref: "#/definitions/QuoteMutualfund" },
				{ $ref: "#/definitions/QuoteOption" },
				{ $ref: "#/definitions/QuoteMoneyMarket" }
			]
		},
		QuoteAltSymbol: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "ALTSYMBOL"
				},
				typeDisp: {
					type: "string",
					const: "ALTSYMBOL"
				},
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				underlyingExchangeSymbol: { type: "string" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				expireIsoDate: { type: "string" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"typeDisp",
				"underlyingExchangeSymbol"
			]
		},
		QuoteBase: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: { type: "string" },
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"language",
				"region",
				"quoteType",
				"triggerable",
				"marketState",
				"tradeable",
				"exchange",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"gmtOffSetMilliseconds",
				"market",
				"esgPopulated",
				"sourceInterval",
				"exchangeDataDelayedBy",
				"fullExchangeName",
				"symbol"
			]
		},
		TwoNumberRange: {
			type: "object",
			properties: {
				low: { type: "number" },
				high: { type: "number" }
			},
			required: ["low", "high"],
			additionalProperties: !1
		},
		DateInMs: {
			type: "string",
			format: "date-time"
		},
		QuoteCryptoCurrency: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "CRYPTOCURRENCY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				circulatingSupply: { type: "number" },
				fromCurrency: { type: "string" },
				toCurrency: { type: "string" },
				lastMarket: { type: "string" },
				coinImageUrl: { type: "string" },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				coinMarketCapLink: { type: "string" },
				maxSupply: { type: "number" },
				totalSupply: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteCurrency: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "CURRENCY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteECNQuote: {
			type: "object",
			properties: {
				dividendRate: { type: "number" },
				dividendYield: { type: "number" },
				language: { type: "string" },
				region: { type: "string" },
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				quoteType: {
					type: "string",
					const: "ECNQUOTE"
				}
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			],
			additionalProperties: !1
		},
		QuoteEtf: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "ETF"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendYield: { type: "number" },
				netAssets: { type: "number" },
				netExpenseRatio: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteEquity: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "EQUITY"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteFuture: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "FUTURE"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				headSymbolAsString: { type: "string" },
				contractSymbol: { type: "boolean" },
				underlyingExchangeSymbol: { type: "string" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				expireIsoDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"contractSymbol",
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"underlyingExchangeSymbol"
			]
		},
		QuoteIndex: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "INDEX"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteMutualfund: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "MUTUALFUND"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable"
			]
		},
		QuoteOption: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "OPTION"
				},
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				strike: { type: "number" },
				expireDate: { type: "number" },
				expireIsoDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"expireDate",
				"expireIsoDate",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"openInterest",
				"quoteType",
				"region",
				"sourceInterval",
				"strike",
				"symbol",
				"tradeable",
				"triggerable",
				"underlyingSymbol"
			]
		},
		QuoteMoneyMarket: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: {
					type: "string",
					const: "MONEYMARKET"
				},
				typeDisp: {
					type: "string",
					const: "MoneyMarket"
				},
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				currency: { type: "string" },
				customPriceAlertConfidence: { type: "string" },
				marketState: {
					type: "string",
					enum: [
						"REGULAR",
						"CLOSED",
						"PRE",
						"PREPRE",
						"POST",
						"POSTPOST"
					]
				},
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				exchange: { type: "string" },
				shortName: { type: "string" },
				longName: { type: "string" },
				messageBoardId: { type: "string" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				market: { type: "string" },
				esgPopulated: { type: "boolean" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { $ref: "#/definitions/TwoNumberRange" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				dividendDate: {
					type: "string",
					format: "date-time"
				},
				earningsTimestamp: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				trailingAnnualDividendRate: { type: "number" },
				trailingPE: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				firstTradeDateMilliseconds: { $ref: "#/definitions/DateInMs" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				extendedMarketChange: { type: "number" },
				extendedMarketChangePercent: { type: "number" },
				extendedMarketPrice: { type: "number" },
				extendedMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketChange: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { $ref: "#/definitions/TwoNumberRange" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				dayHigh: { type: "number" },
				dayLow: { type: "number" },
				volume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				fullExchangeName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				displayName: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				trailingThreeMonthNavReturns: { type: "number" },
				ipoExpectedDate: {
					type: "string",
					format: "date-time"
				},
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				averageAnalystRating: { type: "string" },
				pageViewGrowthWeekly: { type: "number" },
				openInterest: { type: "number" },
				beta: { type: "number" },
				companyLogoUrl: { type: "string" },
				logoUrl: { type: "string" },
				impliedSharesOutstanding: { type: "number" },
				netAssets: { type: "number" }
			},
			required: [
				"esgPopulated",
				"exchange",
				"exchangeDataDelayedBy",
				"exchangeTimezoneName",
				"exchangeTimezoneShortName",
				"fullExchangeName",
				"gmtOffSetMilliseconds",
				"language",
				"market",
				"marketState",
				"quoteType",
				"region",
				"sourceInterval",
				"symbol",
				"tradeable",
				"triggerable",
				"typeDisp"
			]
		},
		Option: {
			type: "object",
			properties: {
				expirationDate: {
					type: "string",
					format: "date-time"
				},
				hasMiniOptions: { type: "boolean" },
				calls: {
					type: "array",
					items: { $ref: "#/definitions/CallOrPut" }
				},
				puts: {
					type: "array",
					items: { $ref: "#/definitions/CallOrPut" }
				}
			},
			required: [
				"expirationDate",
				"hasMiniOptions",
				"calls",
				"puts"
			],
			additionalProperties: {}
		},
		CallOrPut: {
			type: "object",
			properties: {
				contractSymbol: { type: "string" },
				strike: { type: "number" },
				currency: { type: "string" },
				lastPrice: { type: "number" },
				change: { type: "number" },
				percentChange: { type: "number" },
				volume: { type: "number" },
				openInterest: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				contractSize: {
					type: "string",
					const: "REGULAR"
				},
				expiration: {
					type: "string",
					format: "date-time"
				},
				lastTradeDate: {
					type: "string",
					format: "date-time"
				},
				impliedVolatility: { type: "number" },
				inTheMoney: { type: "boolean" }
			},
			required: [
				"contractSymbol",
				"strike",
				"lastPrice",
				"change",
				"contractSize",
				"expiration",
				"lastTradeDate",
				"impliedVolatility",
				"inTheMoney"
			],
			additionalProperties: {}
		},
		OptionsOptions: {
			type: "object",
			properties: {
				formatted: { type: "boolean" },
				lang: { type: "string" },
				region: { type: "string" },
				date: { anyOf: [
					{
						type: "string",
						format: "date-time"
					},
					{ type: "number" },
					{ type: "string" }
				] }
			},
			additionalProperties: !1
		},
		options: {}
	}
}), ln = {
	formatted: !1,
	lang: "en-US",
	region: "US"
};
function un(e, t, n) {
	return this._moduleExec({
		moduleName: "options",
		query: {
			assertSymbol: e,
			url: "https://${YF_QUERY_HOST}/v7/finance/options/" + e,
			needsCrumb: !0,
			definitions: cn,
			schemaKey: "#/definitions/OptionsOptions",
			defaults: ln,
			overrides: t,
			transformWith(e) {
				let t = e.date;
				if (t) if (t instanceof Date) e.date = Math.floor(t.getTime() / 1e3);
				else throw Error("Unsupported date type: " + t);
				return e;
			}
		},
		result: {
			definitions: cn,
			schemaKey: "#/definitions/OptionsResult",
			transformWith(e) {
				if (!e.optionChain) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.optionChain.result[0];
			}
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/quoteSummary.schema.js
var dn = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		QuoteSummaryResult: {
			type: "object",
			properties: {
				assetProfile: { $ref: "#/definitions/AssetProfile" },
				balanceSheetHistory: { $ref: "#/definitions/BalanceSheetHistory" },
				balanceSheetHistoryQuarterly: { $ref: "#/definitions/BalanceSheetHistory" },
				calendarEvents: { $ref: "#/definitions/CalendarEvents" },
				cashflowStatementHistory: { $ref: "#/definitions/CashflowStatementHistory" },
				cashflowStatementHistoryQuarterly: { $ref: "#/definitions/CashflowStatementHistory" },
				defaultKeyStatistics: { $ref: "#/definitions/DefaultKeyStatistics" },
				earnings: { $ref: "#/definitions/QuoteSummaryEarnings" },
				earningsHistory: { $ref: "#/definitions/EarningsHistory" },
				earningsTrend: { $ref: "#/definitions/EarningsTrend" },
				financialData: { $ref: "#/definitions/FinancialData" },
				fundOwnership: { $ref: "#/definitions/Ownership" },
				fundPerformance: { $ref: "#/definitions/FundPerformance" },
				fundProfile: { $ref: "#/definitions/FundProfile" },
				incomeStatementHistory: { $ref: "#/definitions/IncomeStatementHistory" },
				incomeStatementHistoryQuarterly: { $ref: "#/definitions/IncomeStatementHistory" },
				indexTrend: { $ref: "#/definitions/IndexTrend" },
				industryTrend: { $ref: "#/definitions/Trend" },
				insiderHolders: { $ref: "#/definitions/Holders" },
				insiderTransactions: { $ref: "#/definitions/InsiderTransactions" },
				institutionOwnership: { $ref: "#/definitions/Ownership" },
				majorDirectHolders: { $ref: "#/definitions/Holders" },
				majorHoldersBreakdown: { $ref: "#/definitions/MajorHoldersBreakdown" },
				netSharePurchaseActivity: { $ref: "#/definitions/NetSharePurchaseActivity" },
				price: { $ref: "#/definitions/Price" },
				quoteType: { $ref: "#/definitions/QuoteType" },
				recommendationTrend: { $ref: "#/definitions/RecommendationTrend" },
				secFilings: { $ref: "#/definitions/SECFilings" },
				sectorTrend: { $ref: "#/definitions/Trend" },
				summaryDetail: { $ref: "#/definitions/SummaryDetail" },
				summaryProfile: { $ref: "#/definitions/SummaryProfile" },
				topHoldings: { $ref: "#/definitions/TopHoldings" },
				upgradeDowngradeHistory: { $ref: "#/definitions/UpgradeDowngradeHistory" }
			},
			additionalProperties: {}
		},
		AssetProfile: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				address1: { type: "string" },
				address2: { type: "string" },
				address3: { type: "string" },
				city: { type: "string" },
				state: { type: "string" },
				zip: { type: "string" },
				country: { type: "string" },
				phone: { type: "string" },
				fax: { type: "string" },
				website: { type: "string" },
				industry: { type: "string" },
				industryDisp: { type: "string" },
				industryKey: { type: "string" },
				industrySymbol: { type: "string" },
				sector: { type: "string" },
				sectorDisp: { type: "string" },
				sectorKey: { type: "string" },
				longBusinessSummary: { type: "string" },
				fullTimeEmployees: { type: "number" },
				companyOfficers: {
					type: "array",
					items: { $ref: "#/definitions/CompanyOfficer" }
				},
				auditRisk: { type: "number" },
				boardRisk: { type: "number" },
				compensationRisk: { type: "number" },
				shareHolderRightsRisk: { type: "number" },
				overallRisk: { type: "number" },
				governanceEpochDate: {
					type: "string",
					format: "date-time"
				},
				compensationAsOfEpochDate: {
					type: "string",
					format: "date-time"
				},
				name: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				description: { type: "string" },
				twitter: { type: "string" },
				irWebsite: { type: "string" },
				executiveTeam: {
					type: "array",
					items: {}
				}
			},
			required: ["maxAge", "companyOfficers"],
			additionalProperties: {}
		},
		CompanyOfficer: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				name: { type: "string" },
				age: { type: "number" },
				title: { type: "string" },
				yearBorn: { type: "number" },
				fiscalYear: { type: "number" },
				totalPay: { type: "number" },
				exercisedValue: { type: "number" },
				unexercisedValue: { type: "number" }
			},
			required: [
				"maxAge",
				"name",
				"title"
			],
			additionalProperties: {}
		},
		BalanceSheetHistory: {
			type: "object",
			properties: {
				balanceSheetStatements: {
					type: "array",
					items: { $ref: "#/definitions/BalanceSheetStatement" }
				},
				maxAge: { type: "number" }
			},
			required: ["balanceSheetStatements", "maxAge"],
			additionalProperties: {}
		},
		BalanceSheetStatement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["maxAge", "endDate"],
			additionalProperties: !1
		},
		CalendarEvents: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				earnings: { $ref: "#/definitions/CalendarEventsEarnings" },
				exDividendDate: {
					type: "string",
					format: "date-time"
				},
				dividendDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["maxAge", "earnings"],
			additionalProperties: {}
		},
		CalendarEventsEarnings: {
			type: "object",
			properties: {
				earningsCallDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				isEarningsDateEstimate: { type: "boolean" },
				earningsDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				earningsAverage: { type: "number" },
				earningsLow: { type: "number" },
				earningsHigh: { type: "number" },
				revenueAverage: { type: "number" },
				revenueLow: { type: "number" },
				revenueHigh: { type: "number" }
			},
			required: ["earningsCallDate", "earningsDate"],
			additionalProperties: {}
		},
		CashflowStatementHistory: {
			type: "object",
			properties: {
				cashflowStatements: {
					type: "array",
					items: { $ref: "#/definitions/CashflowStatement" }
				},
				maxAge: { type: "number" }
			},
			required: ["cashflowStatements", "maxAge"],
			additionalProperties: !1
		},
		CashflowStatement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				},
				netIncome: { type: "number" }
			},
			required: [
				"maxAge",
				"endDate",
				"netIncome"
			],
			additionalProperties: !1
		},
		DefaultKeyStatistics: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				priceHint: { type: "number" },
				enterpriseValue: { type: "number" },
				forwardPE: { type: "number" },
				profitMargins: { type: "number" },
				floatShares: { type: "number" },
				sharesOutstanding: { type: "number" },
				sharesShort: { type: "number" },
				sharesShortPriorMonth: {
					type: "string",
					format: "date-time"
				},
				sharesShortPreviousMonthDate: {
					type: "string",
					format: "date-time"
				},
				dateShortInterest: {
					type: "string",
					format: "date-time"
				},
				sharesPercentSharesOut: { type: "number" },
				heldPercentInsiders: { type: "number" },
				heldPercentInstitutions: { type: "number" },
				shortRatio: { type: "number" },
				shortPercentOfFloat: { type: "number" },
				beta: { type: "number" },
				impliedSharesOutstanding: { type: "number" },
				category: { type: ["null", "string"] },
				bookValue: { type: "number" },
				priceToBook: { type: "number" },
				fundFamily: { type: ["null", "string"] },
				legalType: { type: ["null", "string"] },
				lastFiscalYearEnd: {
					type: "string",
					format: "date-time"
				},
				nextFiscalYearEnd: {
					type: "string",
					format: "date-time"
				},
				mostRecentQuarter: {
					type: "string",
					format: "date-time"
				},
				earningsQuarterlyGrowth: { type: "number" },
				netIncomeToCommon: { type: "number" },
				trailingEps: { type: "number" },
				forwardEps: { type: "number" },
				pegRatio: { type: "number" },
				lastSplitFactor: { type: ["null", "string"] },
				lastSplitDate: { type: "number" },
				enterpriseToRevenue: { type: "number" },
				enterpriseToEbitda: { type: "number" },
				"52WeekChange": { type: "number" },
				SandP52WeekChange: { type: "number" },
				lastDividendValue: { type: "number" },
				lastDividendDate: {
					type: "string",
					format: "date-time"
				},
				ytdReturn: { type: "number" },
				beta3Year: { type: "number" },
				totalAssets: { type: "number" },
				yield: { type: "number" },
				fundInceptionDate: {
					type: "string",
					format: "date-time"
				},
				threeYearAverageReturn: { type: "number" },
				fiveYearAverageReturn: { type: "number" },
				morningStarOverallRating: { type: "number" },
				morningStarRiskRating: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				lastCapGain: { type: "number" },
				annualHoldingsTurnover: { type: "number" },
				latestShareClass: {},
				leadInvestor: {}
			},
			required: [
				"maxAge",
				"priceHint",
				"category",
				"fundFamily",
				"legalType",
				"lastSplitFactor"
			],
			additionalProperties: {}
		},
		QuoteSummaryEarnings: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				earningsChart: { $ref: "#/definitions/EarningsChart" },
				financialsChart: { $ref: "#/definitions/FinancialsChart" },
				financialCurrency: { type: "string" }
			},
			required: [
				"maxAge",
				"earningsChart",
				"financialsChart"
			],
			additionalProperties: {}
		},
		EarningsChart: {
			type: "object",
			properties: {
				quarterly: {
					type: "array",
					items: { $ref: "#/definitions/EarningsChartQuarterly" }
				},
				currentQuarterEstimate: { type: "number" },
				currentQuarterEstimateDate: { type: "string" },
				currentQuarterEstimateYear: { type: "number" },
				earningsDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				isEarningsDateEstimate: { type: "boolean" }
			},
			required: ["quarterly", "earningsDate"],
			additionalProperties: {}
		},
		EarningsChartQuarterly: {
			type: "object",
			properties: {
				date: { type: "string" },
				actual: { type: "number" },
				estimate: { type: "number" }
			},
			required: ["date", "estimate"],
			additionalProperties: {}
		},
		FinancialsChart: {
			type: "object",
			properties: {
				yearly: {
					type: "array",
					items: { $ref: "#/definitions/Yearly" }
				},
				quarterly: {
					type: "array",
					items: { $ref: "#/definitions/FinancialsChartQuarterly" }
				}
			},
			required: ["yearly", "quarterly"],
			additionalProperties: {}
		},
		Yearly: {
			type: "object",
			properties: {
				date: { type: "number" },
				revenue: { type: "number" },
				earnings: { type: "number" }
			},
			required: [
				"date",
				"revenue",
				"earnings"
			],
			additionalProperties: {}
		},
		FinancialsChartQuarterly: {
			type: "object",
			properties: {
				date: { type: "string" },
				revenue: { type: "number" },
				earnings: { type: "number" }
			},
			required: [
				"date",
				"revenue",
				"earnings"
			],
			additionalProperties: {}
		},
		EarningsHistory: {
			type: "object",
			properties: {
				history: {
					type: "array",
					items: { $ref: "#/definitions/EarningsHistoryHistory" }
				},
				maxAge: { type: "number" }
			},
			required: ["history", "maxAge"],
			additionalProperties: {}
		},
		EarningsHistoryHistory: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				epsActual: { type: ["number", "null"] },
				epsEstimate: { type: ["number", "null"] },
				epsDifference: { type: ["number", "null"] },
				surprisePercent: { type: ["number", "null"] },
				quarter: { anyOf: [{
					type: "string",
					format: "date-time"
				}, { type: "null" }] },
				period: { type: "string" },
				currency: { type: "string" }
			},
			required: [
				"maxAge",
				"epsActual",
				"epsEstimate",
				"epsDifference",
				"surprisePercent",
				"quarter",
				"period"
			],
			additionalProperties: {}
		},
		EarningsTrend: {
			type: "object",
			properties: {
				trend: {
					type: "array",
					items: { $ref: "#/definitions/EarningsTrendTrend" }
				},
				maxAge: { type: "number" }
			},
			required: ["trend", "maxAge"],
			additionalProperties: {}
		},
		EarningsTrendTrend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				period: { type: "string" },
				endDate: { anyOf: [{
					type: "string",
					format: "date-time"
				}, { type: "null" }] },
				growth: { type: ["number", "null"] },
				earningsEstimate: { $ref: "#/definitions/EarningsEstimate" },
				revenueEstimate: { $ref: "#/definitions/RevenueEstimate" },
				epsTrend: { $ref: "#/definitions/EpsTrend" },
				epsRevisions: { $ref: "#/definitions/EpsRevisions" }
			},
			required: [
				"maxAge",
				"period",
				"endDate",
				"growth",
				"earningsEstimate",
				"revenueEstimate",
				"epsTrend",
				"epsRevisions"
			],
			additionalProperties: {}
		},
		EarningsEstimate: {
			type: "object",
			properties: {
				avg: { type: ["number", "null"] },
				low: { type: ["number", "null"] },
				high: { type: ["number", "null"] },
				yearAgoEps: { type: ["number", "null"] },
				numberOfAnalysts: { type: ["number", "null"] },
				growth: { type: ["number", "null"] },
				earningsCurrency: { type: ["string", "null"] }
			},
			required: [
				"avg",
				"low",
				"high",
				"yearAgoEps",
				"numberOfAnalysts",
				"growth"
			],
			additionalProperties: {}
		},
		RevenueEstimate: {
			type: "object",
			properties: {
				avg: { type: ["number", "null"] },
				low: { type: ["number", "null"] },
				high: { type: ["number", "null"] },
				numberOfAnalysts: { type: ["number", "null"] },
				yearAgoRevenue: { type: ["number", "null"] },
				growth: { type: ["number", "null"] },
				revenueCurrency: { type: ["string", "null"] }
			},
			required: [
				"avg",
				"low",
				"high",
				"numberOfAnalysts",
				"yearAgoRevenue",
				"growth"
			],
			additionalProperties: {}
		},
		EpsTrend: {
			type: "object",
			properties: {
				current: { type: ["number", "null"] },
				"7daysAgo": { type: ["number", "null"] },
				"30daysAgo": { type: ["number", "null"] },
				"60daysAgo": { type: ["number", "null"] },
				"90daysAgo": { type: ["number", "null"] },
				epsTrendCurrency: { type: ["string", "null"] }
			},
			required: [
				"current",
				"7daysAgo",
				"30daysAgo",
				"60daysAgo",
				"90daysAgo"
			],
			additionalProperties: {}
		},
		EpsRevisions: {
			type: "object",
			properties: {
				upLast7days: { type: ["number", "null"] },
				upLast30days: { type: ["number", "null"] },
				upLast90days: { type: ["number", "null"] },
				downLast7Days: { type: ["number", "null"] },
				downLast30days: { type: ["number", "null"] },
				downLast90days: { type: ["number", "null"] },
				epsRevisionsCurrency: { type: ["string", "null"] }
			},
			additionalProperties: {}
		},
		FinancialData: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				currentPrice: { type: "number" },
				targetHighPrice: { type: "number" },
				targetLowPrice: { type: "number" },
				targetMeanPrice: { type: "number" },
				targetMedianPrice: { type: "number" },
				recommendationMean: { type: "number" },
				recommendationKey: { type: "string" },
				numberOfAnalystOpinions: { type: "number" },
				totalCash: { type: "number" },
				totalCashPerShare: { type: "number" },
				ebitda: { type: "number" },
				totalDebt: { type: "number" },
				quickRatio: { type: "number" },
				currentRatio: { type: "number" },
				totalRevenue: { type: "number" },
				debtToEquity: { type: "number" },
				revenuePerShare: { type: "number" },
				returnOnAssets: { type: "number" },
				returnOnEquity: { type: "number" },
				grossProfits: { type: "number" },
				freeCashflow: { type: "number" },
				operatingCashflow: { type: "number" },
				earningsGrowth: { type: "number" },
				revenueGrowth: { type: "number" },
				grossMargins: { type: "number" },
				ebitdaMargins: { type: "number" },
				operatingMargins: { type: "number" },
				profitMargins: { type: "number" },
				financialCurrency: { type: ["string", "null"] }
			},
			required: [
				"maxAge",
				"recommendationKey",
				"financialCurrency"
			],
			additionalProperties: {}
		},
		Ownership: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				ownershipList: {
					type: "array",
					items: { $ref: "#/definitions/OwnershipList" }
				}
			},
			required: ["maxAge", "ownershipList"],
			additionalProperties: {}
		},
		OwnershipList: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				reportDate: {
					type: "string",
					format: "date-time"
				},
				organization: { type: "string" },
				pctHeld: { type: "number" },
				position: { type: "number" },
				value: { type: "number" },
				pctChange: { type: "number" }
			},
			required: [
				"maxAge",
				"reportDate",
				"organization",
				"pctHeld",
				"position",
				"value"
			],
			additionalProperties: {}
		},
		FundPerformance: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				loadAdjustedReturns: { $ref: "#/definitions/PeriodRange" },
				rankInCategory: { $ref: "#/definitions/PeriodRange" },
				performanceOverview: { $ref: "#/definitions/FundPerformancePerformanceOverview" },
				performanceOverviewCat: { $ref: "#/definitions/FundPerformancePerformanceOverviewCat" },
				trailingReturns: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				trailingReturnsNav: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				trailingReturnsCat: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				annualTotalReturns: { $ref: "#/definitions/FundPerformanceReturns" },
				pastQuarterlyReturns: { $ref: "#/definitions/FundPerformanceReturns" },
				riskOverviewStatistics: { $ref: "#/definitions/FundPerformanceRiskOverviewStats" },
				riskOverviewStatisticsCat: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsCat" },
				fundCategoryName: { type: "string" }
			},
			required: [
				"maxAge",
				"performanceOverview",
				"performanceOverviewCat",
				"trailingReturns",
				"trailingReturnsNav",
				"trailingReturnsCat",
				"annualTotalReturns",
				"pastQuarterlyReturns",
				"riskOverviewStatistics",
				"riskOverviewStatisticsCat"
			],
			additionalProperties: {}
		},
		PeriodRange: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytd: { type: "number" },
				oneMonth: { type: "number" },
				threeMonth: { type: "number" },
				oneYear: { type: "number" },
				threeYear: { type: "number" },
				fiveYear: { type: "number" },
				tenYear: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformancePerformanceOverview: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytdReturnPct: { type: "number" },
				oneYearTotalReturn: { type: "number" },
				threeYearTotalReturn: { type: "number" },
				fiveYrAvgReturnPct: { type: "number" },
				morningStarReturnRating: { type: "number" },
				numYearsUp: { type: "number" },
				numYearsDown: { type: "number" },
				bestOneYrTotalReturn: { type: "number" },
				worstOneYrTotalReturn: { type: "number" },
				bestThreeYrTotalReturn: { type: "number" },
				worstThreeYrTotalReturn: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformancePerformanceOverviewCat: {
			type: "object",
			properties: {
				ytdReturnPct: { type: "number" },
				fiveYrAvgReturnPct: { type: "number" },
				oneYearTotalReturn: { type: "number" },
				threeYearTotalReturn: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformanceTrailingReturns: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytd: { type: "number" },
				oneMonth: { type: "number" },
				threeMonth: { type: "number" },
				oneYear: { type: "number" },
				threeYear: { type: "number" },
				fiveYear: { type: "number" },
				tenYear: { type: "number" },
				lastBullMkt: { type: "number" },
				lastBearMkt: { type: "number" }
			},
			additionalProperties: { anyOf: [{}, {}] }
		},
		FundPerformanceReturns: {
			type: "object",
			properties: {
				returns: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceReturnsRow" }
				},
				returnsCat: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceReturnsRow" }
				}
			},
			required: ["returns"],
			additionalProperties: {}
		},
		FundPerformanceReturnsRow: {
			type: "object",
			properties: {
				year: { type: "number" },
				annualValue: { type: "number" },
				q1: { type: "number" },
				q2: { type: "number" },
				q3: { type: "number" },
				q4: { type: "number" }
			},
			required: ["year"],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStats: {
			type: "object",
			properties: {
				riskStatistics: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsRow" }
				},
				riskRating: { type: "number" }
			},
			required: ["riskStatistics"],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStatsRow: {
			type: "object",
			properties: {
				year: { type: "string" },
				alpha: { type: "number" },
				beta: { type: "number" },
				meanAnnualReturn: { type: "number" },
				rSquared: { type: "number" },
				stdDev: { type: "number" },
				sharpeRatio: { type: "number" },
				treynorRatio: { type: "number" }
			},
			required: [
				"year",
				"alpha",
				"beta",
				"meanAnnualReturn",
				"rSquared",
				"sharpeRatio",
				"treynorRatio"
			],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStatsCat: {
			type: "object",
			properties: { riskStatisticsCat: {
				type: "array",
				items: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsRow" }
			} },
			required: ["riskStatisticsCat"],
			additionalProperties: {}
		},
		FundProfile: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				styleBoxUrl: { type: ["null", "string"] },
				family: { type: ["null", "string"] },
				categoryName: { type: ["null", "string"] },
				legalType: { type: ["null", "string"] },
				managementInfo: { $ref: "#/definitions/FundProfileManagementInfo" },
				feesExpensesInvestment: { $ref: "#/definitions/FundProfileFeesExpensesInvestment" },
				feesExpensesInvestmentCat: { $ref: "#/definitions/FundProfileFeesExpensesInvestmentCat" },
				brokerages: {
					type: "array",
					items: { $ref: "#/definitions/FundProfileBrokerage" }
				},
				initInvestment: { type: "number" },
				initIraInvestment: { type: "number" },
				initAipInvestment: { type: "number" },
				subseqInvestment: { type: "number" },
				subseqIraInvestment: { type: "number" },
				subseqAipInvestment: { type: "number" }
			},
			required: [
				"maxAge",
				"family",
				"categoryName",
				"legalType"
			],
			additionalProperties: {}
		},
		FundProfileManagementInfo: {
			type: "object",
			properties: {
				managerName: { type: ["null", "string"] },
				managerBio: { type: ["null", "string"] },
				startdate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["managerName", "managerBio"],
			additionalProperties: {}
		},
		FundProfileFeesExpensesInvestment: {
			type: "object",
			properties: {
				annualHoldingsTurnover: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				grossExpRatio: { type: "number" },
				netExpRatio: { type: "number" },
				projectionValues: { type: "object" },
				totalNetAssets: { type: "number" }
			},
			required: ["projectionValues"],
			additionalProperties: {}
		},
		FundProfileFeesExpensesInvestmentCat: {
			type: "object",
			properties: {
				annualHoldingsTurnover: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				grossExpRatio: { type: "number" },
				netExpRatio: { type: "number" },
				totalNetAssets: { type: "number" },
				projectionValuesCat: { type: "object" }
			},
			required: ["projectionValuesCat"],
			additionalProperties: { anyOf: [{}, {}] }
		},
		FundProfileBrokerage: {
			type: "object",
			additionalProperties: {}
		},
		IncomeStatementHistory: {
			type: "object",
			properties: {
				incomeStatementHistory: {
					type: "array",
					items: { $ref: "#/definitions/IncomeStatementHistoryElement" }
				},
				maxAge: { type: "number" }
			},
			required: ["incomeStatementHistory", "maxAge"],
			additionalProperties: {}
		},
		IncomeStatementHistoryElement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				},
				totalRevenue: { type: "number" },
				costOfRevenue: { type: "number" },
				grossProfit: { type: "number" },
				researchDevelopment: { type: "null" },
				sellingGeneralAdministrative: { type: "null" },
				nonRecurring: { type: "null" },
				otherOperatingExpenses: { type: "null" },
				totalOperatingExpenses: { type: "number" },
				operatingIncome: { type: "null" },
				totalOtherIncomeExpenseNet: { type: "null" },
				ebit: { type: "number" },
				interestExpense: { type: "null" },
				incomeBeforeTax: { type: "null" },
				incomeTaxExpense: { type: "number" },
				minorityInterest: { type: "null" },
				netIncomeFromContinuingOps: { type: "null" },
				discontinuedOperations: { type: "null" },
				extraordinaryItems: { type: "null" },
				effectOfAccountingCharges: { type: "null" },
				otherItems: { type: "null" },
				netIncome: { type: "number" },
				netIncomeApplicableToCommonShares: { type: "null" }
			},
			required: [
				"maxAge",
				"endDate",
				"totalRevenue",
				"costOfRevenue",
				"grossProfit",
				"researchDevelopment",
				"sellingGeneralAdministrative",
				"nonRecurring",
				"otherOperatingExpenses",
				"totalOperatingExpenses",
				"operatingIncome",
				"totalOtherIncomeExpenseNet",
				"ebit",
				"interestExpense",
				"incomeBeforeTax",
				"incomeTaxExpense",
				"minorityInterest",
				"netIncomeFromContinuingOps",
				"discontinuedOperations",
				"extraordinaryItems",
				"effectOfAccountingCharges",
				"otherItems",
				"netIncome",
				"netIncomeApplicableToCommonShares"
			],
			additionalProperties: !1
		},
		IndexTrend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				symbol: { type: "string" },
				peRatio: { type: "number" },
				pegRatio: { type: "number" },
				estimates: {
					type: "array",
					items: { $ref: "#/definitions/Estimate" }
				}
			},
			required: [
				"maxAge",
				"symbol",
				"estimates"
			],
			additionalProperties: {}
		},
		Estimate: {
			type: "object",
			properties: {
				period: { type: "string" },
				growth: { type: "number" }
			},
			required: ["period"],
			additionalProperties: {}
		},
		Trend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				symbol: { type: "null" },
				estimates: {
					type: "array",
					items: {}
				}
			},
			required: [
				"maxAge",
				"symbol",
				"estimates"
			],
			additionalProperties: {}
		},
		Holders: {
			type: "object",
			properties: {
				holders: {
					type: "array",
					items: { $ref: "#/definitions/Holder" }
				},
				maxAge: { type: "number" }
			},
			required: ["holders", "maxAge"],
			additionalProperties: {}
		},
		Holder: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				name: { type: "string" },
				relation: { anyOf: [{ $ref: "#/definitions/Relation" }, { type: "string" }] },
				url: { type: "string" },
				transactionDescription: { type: "string" },
				latestTransDate: {
					type: "string",
					format: "date-time"
				},
				positionDirect: { type: "number" },
				positionDirectDate: {
					type: "string",
					format: "date-time"
				},
				positionIndirect: { type: "number" },
				positionIndirectDate: {
					type: "string",
					format: "date-time"
				},
				positionSummaryDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"maxAge",
				"name",
				"relation",
				"url",
				"transactionDescription",
				"latestTransDate"
			],
			additionalProperties: {}
		},
		Relation: {
			type: "string",
			enum: [
				"Chairman of the Board",
				"Chief Executive Officer",
				"Chief Financial Officer",
				"Chief Operating Officer",
				"Chief Technology Officer",
				"Director",
				"Director (Independent)",
				"",
				"General Counsel",
				"Independent Non-Executive Director",
				"Officer",
				"President"
			]
		},
		InsiderTransactions: {
			type: "object",
			properties: {
				transactions: {
					type: "array",
					items: { $ref: "#/definitions/Transaction" }
				},
				maxAge: { type: "number" }
			},
			required: ["transactions", "maxAge"],
			additionalProperties: {}
		},
		Transaction: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				shares: { type: "number" },
				filerUrl: { type: "string" },
				transactionText: { type: "string" },
				filerName: { type: "string" },
				filerRelation: { anyOf: [{ $ref: "#/definitions/Relation" }, { type: "string" }] },
				moneyText: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				ownership: { anyOf: [{ $ref: "#/definitions/OwnershipEnum" }, { type: "string" }] },
				value: { type: "number" }
			},
			required: [
				"maxAge",
				"shares",
				"filerUrl",
				"transactionText",
				"filerName",
				"filerRelation",
				"moneyText",
				"startDate",
				"ownership"
			],
			additionalProperties: {}
		},
		OwnershipEnum: {
			type: "string",
			enum: ["D", "I"]
		},
		MajorHoldersBreakdown: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				insidersPercentHeld: { type: "number" },
				institutionsPercentHeld: { type: "number" },
				institutionsFloatPercentHeld: { type: "number" },
				institutionsCount: { type: "number" }
			},
			required: ["maxAge"],
			additionalProperties: {}
		},
		NetSharePurchaseActivity: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				period: { type: "string" },
				buyInfoCount: { type: "number" },
				buyInfoShares: { type: "number" },
				buyPercentInsiderShares: { type: "number" },
				sellInfoCount: { type: "number" },
				sellInfoShares: { type: "number" },
				sellPercentInsiderShares: { type: "number" },
				netInfoCount: { type: "number" },
				netInfoShares: { type: "number" },
				netPercentInsiderShares: { type: "number" },
				totalInsiderShares: { type: "number" }
			},
			required: [
				"maxAge",
				"period",
				"buyInfoCount",
				"buyInfoShares",
				"sellInfoCount",
				"netInfoCount",
				"netInfoShares",
				"totalInsiderShares"
			],
			additionalProperties: {}
		},
		Price: {
			type: "object",
			properties: {
				averageDailyVolume10Day: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				exchange: { type: "string" },
				exchangeName: { type: "string" },
				exchangeDataDelayedBy: { type: "number" },
				maxAge: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketChange: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketSource: { type: "string" },
				preMarketChangePercent: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				preMarketSource: { type: "string" },
				priceHint: { type: "number" },
				regularMarketChangePercent: { type: "number" },
				regularMarketChange: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				regularMarketSource: { type: "string" },
				regularMarketOpen: { type: "number" },
				quoteSourceName: { type: "string" },
				quoteType: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: ["null", "string"] },
				shortName: { type: ["null", "string"] },
				longName: { type: ["null", "string"] },
				lastMarket: { type: ["null", "string"] },
				marketState: { type: "string" },
				marketCap: { type: "number" },
				currency: { type: "string" },
				currencySymbol: { type: "string" },
				fromCurrency: { type: ["string", "null"] },
				toCurrency: { type: ["string", "null"] },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				circulatingSupply: { type: "number" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				openInterest: { type: "number" }
			},
			required: [
				"maxAge",
				"priceHint",
				"quoteType",
				"symbol",
				"underlyingSymbol",
				"shortName",
				"longName",
				"lastMarket",
				"fromCurrency"
			],
			additionalProperties: {}
		},
		QuoteType: {
			type: "object",
			properties: {
				exchange: { type: "string" },
				quoteType: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				shortName: { type: ["null", "string"] },
				longName: { type: ["null", "string"] },
				firstTradeDateEpochUtc: { anyOf: [{ type: "null" }, {
					type: "string",
					format: "date-time"
				}] },
				timeZoneFullName: { type: "string" },
				timeZoneShortName: { type: "string" },
				uuid: { type: "string" },
				messageBoardId: { type: ["null", "string"] },
				gmtOffSetMilliseconds: { type: "number" },
				maxAge: { type: "number" }
			},
			required: [
				"exchange",
				"quoteType",
				"symbol",
				"underlyingSymbol",
				"shortName",
				"timeZoneFullName",
				"timeZoneShortName",
				"uuid",
				"gmtOffSetMilliseconds",
				"maxAge"
			],
			additionalProperties: {}
		},
		RecommendationTrend: {
			type: "object",
			properties: {
				trend: {
					type: "array",
					items: { $ref: "#/definitions/RecommendationTrendTrend" }
				},
				maxAge: { type: "number" }
			},
			required: ["trend", "maxAge"],
			additionalProperties: {}
		},
		RecommendationTrendTrend: {
			type: "object",
			properties: {
				period: { type: "string" },
				strongBuy: { type: "number" },
				buy: { type: "number" },
				hold: { type: "number" },
				sell: { type: "number" },
				strongSell: { type: "number" }
			},
			required: [
				"period",
				"strongBuy",
				"buy",
				"hold",
				"sell",
				"strongSell"
			],
			additionalProperties: {}
		},
		SECFilings: {
			type: "object",
			properties: {
				filings: {
					type: "array",
					items: { $ref: "#/definitions/Filing" }
				},
				maxAge: { type: "number" }
			},
			required: ["filings", "maxAge"],
			additionalProperties: {}
		},
		Filing: {
			type: "object",
			properties: {
				date: { type: "string" },
				epochDate: {
					type: "string",
					format: "date-time"
				},
				type: {
					type: "string",
					enum: /* @__PURE__ */ "10-K.10-Q.8-K.8-K/A.10-K/A.10-Q/A.SD.PX14A6G.SC 13G/A.DEFA14A.25-NSE.S-8 POS.6-K.F-3ASR.SC 13D/A.20-F.425.SC14D9C.SC 13G.S-8.DEF 14A.F-10.S-3ASR.CORRESP.PX14A6N.N-PX.ARS.PRE 14A.F-6EF.S-3/A.S-3.POS AM.IRANNOTICE.20-F/A.11-K.DEFR14A.S4.RW.S-4/A.S-4.S-4MEF.PRER14A.8-A12B.D.SC 13D".split(".")
				},
				title: { type: "string" },
				edgarUrl: { type: "string" },
				maxAge: { type: "number" },
				url: { type: "string" },
				exhibits: {
					type: "array",
					items: {
						type: "object",
						properties: {
							type: { type: "string" },
							url: { type: "string" },
							downloadUrl: { type: "string" }
						},
						required: ["type", "url"],
						additionalProperties: !1
					}
				}
			},
			required: [
				"date",
				"epochDate",
				"type",
				"title",
				"edgarUrl",
				"maxAge"
			],
			additionalProperties: {}
		},
		SummaryDetail: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				priceHint: { type: "number" },
				previousClose: { type: "number" },
				open: { type: "number" },
				dayLow: { type: "number" },
				dayHigh: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				regularMarketOpen: { type: "number" },
				regularMarketDayLow: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketVolume: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" },
				exDividendDate: {
					type: "string",
					format: "date-time"
				},
				payoutRatio: { type: "number" },
				fiveYearAvgDividendYield: { type: "number" },
				beta: { type: "number" },
				trailingPE: { type: "number" },
				forwardPE: { type: "number" },
				volume: { type: "number" },
				averageVolume: { type: "number" },
				averageVolume10days: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				marketCap: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				priceToSalesTrailing12Months: { type: "number" },
				trailingAnnualDividendRate: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				currency: { type: "string" },
				algorithm: { type: "null" },
				tradeable: { type: "boolean" },
				yield: { type: "number" },
				totalAssets: { type: "number" },
				navPrice: { type: "number" },
				ytdReturn: { type: "number" },
				fromCurrency: { type: ["string", "null"] },
				toCurrency: { type: ["string", "null"] },
				lastMarket: { type: ["string", "null"] },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				circulatingSupply: { type: "number" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				coinMarketCapLink: { type: ["string", "null"] },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				openInterest: { type: "number" },
				averageMaturity: { type: "number" }
			},
			required: [
				"maxAge",
				"priceHint",
				"currency",
				"algorithm",
				"tradeable",
				"fromCurrency",
				"lastMarket"
			],
			additionalProperties: {}
		},
		SummaryProfile: {
			type: "object",
			properties: {
				address1: { type: "string" },
				address2: { type: "string" },
				address3: { type: "string" },
				city: { type: "string" },
				state: { type: "string" },
				zip: { type: "string" },
				country: { type: "string" },
				phone: { type: "string" },
				fax: { type: "string" },
				website: { type: "string" },
				industry: { type: "string" },
				industryDisp: { type: "string" },
				sector: { type: "string" },
				sectorDisp: { type: "string" },
				longBusinessSummary: { type: "string" },
				fullTimeEmployees: { type: "number" },
				companyOfficers: {
					type: "array",
					items: {}
				},
				maxAge: { type: "number" },
				twitter: { type: "string" },
				industryKey: { type: "string" },
				sectorKey: { type: "string" },
				irWebsite: { type: "string" },
				executiveTeam: {
					type: "array",
					items: {}
				},
				name: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				description: { type: "string" }
			},
			required: ["companyOfficers", "maxAge"],
			additionalProperties: {}
		},
		TopHoldings: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				stockPosition: { type: "number" },
				bondPosition: { type: "number" },
				holdings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsHolding" }
				},
				equityHoldings: { $ref: "#/definitions/TopHoldingsEquityHoldings" },
				bondHoldings: { type: "object" },
				bondRatings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsBondRating" }
				},
				sectorWeightings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsSectorWeighting" }
				},
				cashPosition: { type: "number" },
				otherPosition: { type: "number" },
				preferredPosition: { type: "number" },
				convertiblePosition: { type: "number" }
			},
			required: [
				"maxAge",
				"holdings",
				"equityHoldings",
				"bondHoldings",
				"bondRatings",
				"sectorWeightings"
			],
			additionalProperties: {}
		},
		TopHoldingsHolding: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				holdingName: { type: "string" },
				holdingPercent: { type: "number" }
			},
			required: [
				"symbol",
				"holdingName",
				"holdingPercent"
			],
			additionalProperties: {}
		},
		TopHoldingsEquityHoldings: {
			type: "object",
			properties: {
				medianMarketCap: { type: "number" },
				medianMarketCapCat: { type: "number" },
				priceToBook: { type: "number" },
				priceToBookCat: { type: "number" },
				priceToCashflow: { type: "number" },
				priceToCashflowCat: { type: "number" },
				priceToEarnings: { type: "number" },
				priceToEarningsCat: { type: "number" },
				priceToSales: { type: "number" },
				priceToSalesCat: { type: "number" },
				threeYearEarningsGrowth: { type: "number" },
				threeYearEarningsGrowthCat: { type: "number" }
			},
			required: [
				"priceToBook",
				"priceToCashflow",
				"priceToEarnings",
				"priceToSales"
			],
			additionalProperties: {}
		},
		TopHoldingsBondRating: {
			type: "object",
			properties: {
				a: { type: "number" },
				aa: { type: "number" },
				aaa: { type: "number" },
				other: { type: "number" },
				b: { type: "number" },
				bb: { type: "number" },
				bbb: { type: "number" },
				below_b: { type: "number" },
				us_government: { type: "number" }
			},
			additionalProperties: {}
		},
		TopHoldingsSectorWeighting: {
			type: "object",
			properties: {
				realestate: { type: "number" },
				consumer_cyclical: { type: "number" },
				basic_materials: { type: "number" },
				consumer_defensive: { type: "number" },
				technology: { type: "number" },
				communication_services: { type: "number" },
				financial_services: { type: "number" },
				utilities: { type: "number" },
				industrials: { type: "number" },
				energy: { type: "number" },
				healthcare: { type: "number" }
			},
			additionalProperties: {}
		},
		UpgradeDowngradeHistory: {
			type: "object",
			properties: {
				history: {
					type: "array",
					items: { $ref: "#/definitions/UpgradeDowngradeHistoryHistory" }
				},
				maxAge: { type: "number" }
			},
			required: ["history", "maxAge"],
			additionalProperties: {}
		},
		UpgradeDowngradeHistoryHistory: {
			type: "object",
			properties: {
				epochGradeDate: {
					type: "string",
					format: "date-time"
				},
				firm: { type: "string" },
				toGrade: { $ref: "#/definitions/Grade" },
				fromGrade: { $ref: "#/definitions/Grade" },
				action: { $ref: "#/definitions/Action" }
			},
			required: [
				"epochGradeDate",
				"firm",
				"toGrade",
				"action"
			],
			additionalProperties: {}
		},
		Grade: {
			type: "string",
			enum: /* @__PURE__ */ "Accumulate.Add.Average.Below Average.Buy.Conviction Buy..Equal-Weight.Fair Value.Equal-weight.Long-term Buy.Hold.Long-Term Buy.Market Outperform.Market Perform.Mixed.Negative.Neutral.In-Line.Outperform.Overweight.Peer Perform.Perform.Positive.Reduce.Sector Outperform.Sector Perform.Sector Weight.Sell.Strong Buy.Top Pick.Underperform.Underperformer.Underweight.Trim.Above Average.In-line.Outperformer.OVerweight.Cautious.Market Weight.Sector Underperform.Market Underperform.Peer perform.Gradually Accumulate.Action List Buy.Performer.Sector Performer.Speculative Buy.Strong Sell.Speculative Hold.Not Rated.Hold Neutral.Developing.buy.HOld.Trading Sell.Tender.market perform.BUy".split(".")
		},
		Action: {
			type: "string",
			enum: [
				"down",
				"init",
				"main",
				"reit",
				"up"
			]
		},
		QuoteSummaryModules: {
			type: "string",
			enum: /* @__PURE__ */ "assetProfile.balanceSheetHistory.balanceSheetHistoryQuarterly.calendarEvents.cashflowStatementHistory.cashflowStatementHistoryQuarterly.defaultKeyStatistics.earnings.earningsHistory.earningsTrend.financialData.fundOwnership.fundPerformance.fundProfile.incomeStatementHistory.incomeStatementHistoryQuarterly.indexTrend.industryTrend.insiderHolders.insiderTransactions.institutionOwnership.majorDirectHolders.majorHoldersBreakdown.netSharePurchaseActivity.price.quoteType.recommendationTrend.secFilings.sectorTrend.summaryDetail.summaryProfile.topHoldings.upgradeDowngradeHistory".split(".")
		},
		QuoteSummaryOptions: {
			type: "object",
			properties: {
				formatted: { type: "boolean" },
				modules: { anyOf: [{
					type: "array",
					items: { $ref: "#/definitions/QuoteSummaryModules" }
				}, {
					type: "string",
					const: "all"
				}] }
			},
			additionalProperties: !1
		},
		quoteSummary: {}
	}
}, fn = {
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		QuoteSummaryResult: {
			type: "object",
			properties: {
				assetProfile: { $ref: "#/definitions/AssetProfile" },
				balanceSheetHistory: { $ref: "#/definitions/BalanceSheetHistory" },
				balanceSheetHistoryQuarterly: { $ref: "#/definitions/BalanceSheetHistory" },
				calendarEvents: { $ref: "#/definitions/CalendarEvents" },
				cashflowStatementHistory: { $ref: "#/definitions/CashflowStatementHistory" },
				cashflowStatementHistoryQuarterly: { $ref: "#/definitions/CashflowStatementHistory" },
				defaultKeyStatistics: { $ref: "#/definitions/DefaultKeyStatistics" },
				earnings: { $ref: "#/definitions/QuoteSummaryEarnings" },
				earningsHistory: { $ref: "#/definitions/EarningsHistory" },
				earningsTrend: { $ref: "#/definitions/EarningsTrend" },
				financialData: { $ref: "#/definitions/FinancialData" },
				fundOwnership: { $ref: "#/definitions/Ownership" },
				fundPerformance: { $ref: "#/definitions/FundPerformance" },
				fundProfile: { $ref: "#/definitions/FundProfile" },
				incomeStatementHistory: { $ref: "#/definitions/IncomeStatementHistory" },
				incomeStatementHistoryQuarterly: { $ref: "#/definitions/IncomeStatementHistory" },
				indexTrend: { $ref: "#/definitions/IndexTrend" },
				industryTrend: { $ref: "#/definitions/Trend" },
				insiderHolders: { $ref: "#/definitions/Holders" },
				insiderTransactions: { $ref: "#/definitions/InsiderTransactions" },
				institutionOwnership: { $ref: "#/definitions/Ownership" },
				majorDirectHolders: { $ref: "#/definitions/Holders" },
				majorHoldersBreakdown: { $ref: "#/definitions/MajorHoldersBreakdown" },
				netSharePurchaseActivity: { $ref: "#/definitions/NetSharePurchaseActivity" },
				price: { $ref: "#/definitions/Price" },
				quoteType: { $ref: "#/definitions/QuoteType" },
				recommendationTrend: { $ref: "#/definitions/RecommendationTrend" },
				secFilings: { $ref: "#/definitions/SECFilings" },
				sectorTrend: { $ref: "#/definitions/Trend" },
				summaryDetail: { $ref: "#/definitions/SummaryDetail" },
				summaryProfile: { $ref: "#/definitions/SummaryProfile" },
				topHoldings: { $ref: "#/definitions/TopHoldings" },
				upgradeDowngradeHistory: { $ref: "#/definitions/UpgradeDowngradeHistory" }
			},
			additionalProperties: {}
		},
		AssetProfile: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				address1: { type: "string" },
				address2: { type: "string" },
				address3: { type: "string" },
				city: { type: "string" },
				state: { type: "string" },
				zip: { type: "string" },
				country: { type: "string" },
				phone: { type: "string" },
				fax: { type: "string" },
				website: { type: "string" },
				industry: { type: "string" },
				industryDisp: { type: "string" },
				industryKey: { type: "string" },
				industrySymbol: { type: "string" },
				sector: { type: "string" },
				sectorDisp: { type: "string" },
				sectorKey: { type: "string" },
				longBusinessSummary: { type: "string" },
				fullTimeEmployees: { type: "number" },
				companyOfficers: {
					type: "array",
					items: { $ref: "#/definitions/CompanyOfficer" }
				},
				auditRisk: { type: "number" },
				boardRisk: { type: "number" },
				compensationRisk: { type: "number" },
				shareHolderRightsRisk: { type: "number" },
				overallRisk: { type: "number" },
				governanceEpochDate: {
					type: "string",
					format: "date-time"
				},
				compensationAsOfEpochDate: {
					type: "string",
					format: "date-time"
				},
				name: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				description: { type: "string" },
				twitter: { type: "string" },
				irWebsite: { type: "string" },
				executiveTeam: {
					type: "array",
					items: {}
				},
				blockNumber: { type: "number" },
				blockReward: { type: "number" },
				blockRewardReduction: { type: "string" },
				netHashesPerSecond: { type: "number" },
				whitepaper: { type: "string" }
			},
			required: ["maxAge", "companyOfficers"],
			additionalProperties: {}
		},
		CompanyOfficer: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				name: { type: "string" },
				age: { type: "number" },
				title: { type: "string" },
				yearBorn: { type: "number" },
				fiscalYear: { type: "number" },
				totalPay: { type: "number" },
				exercisedValue: { type: "number" },
				unexercisedValue: { type: "number" }
			},
			required: [
				"maxAge",
				"name",
				"title"
			],
			additionalProperties: {}
		},
		BalanceSheetHistory: {
			type: "object",
			properties: {
				balanceSheetStatements: {
					type: "array",
					items: { $ref: "#/definitions/BalanceSheetStatement" }
				},
				maxAge: { type: "number" }
			},
			required: ["balanceSheetStatements", "maxAge"],
			additionalProperties: {}
		},
		BalanceSheetStatement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["maxAge", "endDate"],
			additionalProperties: !1
		},
		CalendarEvents: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				earnings: { $ref: "#/definitions/CalendarEventsEarnings" },
				exDividendDate: {
					type: "string",
					format: "date-time"
				},
				dividendDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["maxAge", "earnings"],
			additionalProperties: {}
		},
		CalendarEventsEarnings: {
			type: "object",
			properties: {
				earningsCallDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				isEarningsDateEstimate: { type: "boolean" },
				earningsDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				earningsAverage: { type: "number" },
				earningsLow: { type: "number" },
				earningsHigh: { type: "number" },
				revenueAverage: { type: "number" },
				revenueLow: { type: "number" },
				revenueHigh: { type: "number" },
				defaultMethodology: {
					type: "string",
					enum: ["nongaap", "gaap"]
				}
			},
			required: ["earningsCallDate", "earningsDate"],
			additionalProperties: {}
		},
		CashflowStatementHistory: {
			type: "object",
			properties: {
				cashflowStatements: {
					type: "array",
					items: { $ref: "#/definitions/CashflowStatement" }
				},
				maxAge: { type: "number" }
			},
			required: ["cashflowStatements", "maxAge"],
			additionalProperties: !1
		},
		CashflowStatement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				},
				netIncome: { type: "number" }
			},
			required: [
				"maxAge",
				"endDate",
				"netIncome"
			],
			additionalProperties: !1
		},
		DefaultKeyStatistics: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				priceHint: { type: "number" },
				enterpriseValue: { type: "number" },
				forwardPE: { type: "number" },
				profitMargins: { type: "number" },
				floatShares: { type: "number" },
				sharesOutstanding: { type: "number" },
				sharesShort: { type: "number" },
				sharesShortPriorMonth: {
					type: "string",
					format: "date-time"
				},
				sharesShortPreviousMonthDate: {
					type: "string",
					format: "date-time"
				},
				dateShortInterest: {
					type: "string",
					format: "date-time"
				},
				sharesPercentSharesOut: { type: "number" },
				heldPercentInsiders: { type: "number" },
				heldPercentInstitutions: { type: "number" },
				shortRatio: { type: "number" },
				shortPercentOfFloat: { type: "number" },
				beta: { type: "number" },
				impliedSharesOutstanding: { type: "number" },
				category: { type: ["null", "string"] },
				bookValue: { type: "number" },
				priceToBook: { type: "number" },
				fundFamily: { type: ["null", "string"] },
				legalType: { type: ["null", "string"] },
				lastFiscalYearEnd: {
					type: "string",
					format: "date-time"
				},
				nextFiscalYearEnd: {
					type: "string",
					format: "date-time"
				},
				mostRecentQuarter: {
					type: "string",
					format: "date-time"
				},
				earningsQuarterlyGrowth: { type: "number" },
				netIncomeToCommon: { type: "number" },
				trailingEps: { type: "number" },
				forwardEps: { type: "number" },
				pegRatio: { type: "number" },
				lastSplitFactor: { type: ["null", "string"] },
				lastSplitDate: { type: "number" },
				enterpriseToRevenue: { type: "number" },
				enterpriseToEbitda: { type: "number" },
				"52WeekChange": { type: "number" },
				SandP52WeekChange: { type: "number" },
				lastDividendValue: { type: "number" },
				lastDividendDate: {
					type: "string",
					format: "date-time"
				},
				ytdReturn: { type: "number" },
				beta3Year: { type: "number" },
				totalAssets: { type: "number" },
				yield: { type: "number" },
				fundInceptionDate: {
					type: "string",
					format: "date-time"
				},
				threeYearAverageReturn: { type: "number" },
				fiveYearAverageReturn: { type: "number" },
				morningStarOverallRating: { type: "number" },
				morningStarRiskRating: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				lastCapGain: { type: "number" },
				annualHoldingsTurnover: { type: "number" },
				latestShareClass: {},
				leadInvestor: {}
			},
			required: [
				"maxAge",
				"priceHint",
				"category",
				"fundFamily",
				"legalType",
				"lastSplitFactor"
			],
			additionalProperties: {}
		},
		QuoteSummaryEarnings: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				earningsChart: { $ref: "#/definitions/EarningsChart" },
				financialsChart: { $ref: "#/definitions/FinancialsChart" },
				financialCurrency: { type: "string" },
				defaultMethodology: {
					type: "string",
					enum: ["nongaap", "gaap"]
				}
			},
			required: [
				"maxAge",
				"earningsChart",
				"financialsChart",
				"defaultMethodology"
			],
			additionalProperties: {}
		},
		EarningsChart: {
			type: "object",
			properties: {
				quarterly: {
					type: "array",
					items: { $ref: "#/definitions/EarningsChartQuarterly" }
				},
				currentQuarterEstimate: { type: "number" },
				currentQuarterEstimateDate: { type: "string" },
				currentQuarterEstimateYear: { type: "number" },
				earningsDate: {
					type: "array",
					items: {
						type: "string",
						format: "date-time"
					}
				},
				isEarningsDateEstimate: { type: "boolean" },
				currentCalendarQuarter: { type: "string" },
				currentFiscalQuarter: { type: "string" },
				currentPeriodEndDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["quarterly", "earningsDate"],
			additionalProperties: {}
		},
		EarningsChartQuarterly: {
			type: "object",
			properties: {
				date: { type: "string" },
				actual: { type: "number" },
				estimate: { type: "number" },
				fiscalQuarter: { type: "string" },
				calendarQuarter: { type: "string" },
				difference: { type: "string" },
				surprisePct: { type: "string" },
				periodEndDate: {
					type: "string",
					format: "date-time"
				},
				reportedDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"date",
				"estimate",
				"fiscalQuarter",
				"calendarQuarter",
				"difference",
				"surprisePct",
				"periodEndDate",
				"reportedDate"
			],
			additionalProperties: {}
		},
		FinancialsChart: {
			type: "object",
			properties: {
				yearly: {
					type: "array",
					items: { $ref: "#/definitions/Yearly" }
				},
				quarterly: {
					type: "array",
					items: { $ref: "#/definitions/FinancialsChartQuarterly" }
				}
			},
			required: ["yearly", "quarterly"],
			additionalProperties: {}
		},
		Yearly: {
			type: "object",
			properties: {
				date: { type: "number" },
				revenue: { type: "number" },
				earnings: { type: "number" },
				profitMargin: { type: "number" }
			},
			required: [
				"date",
				"revenue",
				"earnings",
				"profitMargin"
			],
			additionalProperties: {}
		},
		FinancialsChartQuarterly: {
			type: "object",
			properties: {
				date: { type: "string" },
				revenue: { type: "number" },
				earnings: { type: "number" },
				fiscalQuarter: { type: "string" },
				profitMargin: { type: "number" }
			},
			required: [
				"date",
				"revenue",
				"earnings",
				"fiscalQuarter",
				"profitMargin"
			],
			additionalProperties: {}
		},
		EarningsHistory: {
			type: "object",
			properties: {
				history: {
					type: "array",
					items: { $ref: "#/definitions/EarningsHistoryHistory" }
				},
				maxAge: { type: "number" },
				defaultMethodology: {
					type: "string",
					enum: ["nongaap", "gaap"]
				}
			},
			required: [
				"history",
				"maxAge",
				"defaultMethodology"
			],
			additionalProperties: {}
		},
		EarningsHistoryHistory: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				epsActual: { type: ["number", "null"] },
				epsEstimate: { type: ["number", "null"] },
				epsDifference: { type: ["number", "null"] },
				surprisePercent: { type: ["number", "null"] },
				quarter: { anyOf: [{
					type: "string",
					format: "date-time"
				}, { type: "null" }] },
				period: { type: "string" },
				currency: { type: "string" }
			},
			required: [
				"maxAge",
				"epsActual",
				"epsEstimate",
				"epsDifference",
				"surprisePercent",
				"quarter",
				"period"
			],
			additionalProperties: {}
		},
		EarningsTrend: {
			type: "object",
			properties: {
				trend: {
					type: "array",
					items: { $ref: "#/definitions/EarningsTrendTrend" }
				},
				maxAge: { type: "number" },
				defaultMethodology: {
					type: "string",
					enum: ["nongaap", "gaap"]
				}
			},
			required: [
				"trend",
				"maxAge",
				"defaultMethodology"
			],
			additionalProperties: {}
		},
		EarningsTrendTrend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				period: { type: "string" },
				endDate: { anyOf: [{
					type: "string",
					format: "date-time"
				}, { type: "null" }] },
				growth: { type: ["number", "null"] },
				earningsEstimate: { $ref: "#/definitions/EarningsEstimate" },
				revenueEstimate: { $ref: "#/definitions/RevenueEstimate" },
				epsTrend: { $ref: "#/definitions/EpsTrend" },
				epsRevisions: { $ref: "#/definitions/EpsRevisions" }
			},
			required: [
				"maxAge",
				"period",
				"endDate",
				"growth",
				"earningsEstimate",
				"revenueEstimate",
				"epsTrend",
				"epsRevisions"
			],
			additionalProperties: {}
		},
		EarningsEstimate: {
			type: "object",
			properties: {
				avg: { type: ["number", "null"] },
				low: { type: ["number", "null"] },
				high: { type: ["number", "null"] },
				yearAgoEps: { type: ["number", "null"] },
				numberOfAnalysts: { type: ["number", "null"] },
				growth: { type: ["number", "null"] },
				earningsCurrency: { type: ["string", "null"] }
			},
			required: [
				"avg",
				"low",
				"high",
				"yearAgoEps",
				"numberOfAnalysts",
				"growth"
			],
			additionalProperties: {}
		},
		RevenueEstimate: {
			type: "object",
			properties: {
				avg: { type: ["number", "null"] },
				low: { type: ["number", "null"] },
				high: { type: ["number", "null"] },
				numberOfAnalysts: { type: ["number", "null"] },
				yearAgoRevenue: { type: ["number", "null"] },
				growth: { type: ["number", "null"] },
				revenueCurrency: { type: ["string", "null"] }
			},
			required: [
				"avg",
				"low",
				"high",
				"numberOfAnalysts",
				"yearAgoRevenue",
				"growth"
			],
			additionalProperties: {}
		},
		EpsTrend: {
			type: "object",
			properties: {
				current: { type: ["number", "null"] },
				"7daysAgo": { type: ["number", "null"] },
				"30daysAgo": { type: ["number", "null"] },
				"60daysAgo": { type: ["number", "null"] },
				"90daysAgo": { type: ["number", "null"] },
				epsTrendCurrency: { type: ["string", "null"] }
			},
			required: [
				"current",
				"7daysAgo",
				"30daysAgo",
				"60daysAgo",
				"90daysAgo"
			],
			additionalProperties: {}
		},
		EpsRevisions: {
			type: "object",
			properties: {
				upLast7days: { type: ["number", "null"] },
				upLast30days: { type: ["number", "null"] },
				upLast90days: { type: ["number", "null"] },
				downLast7Days: { type: ["number", "null"] },
				downLast30days: { type: ["number", "null"] },
				downLast90days: { type: ["number", "null"] },
				epsRevisionsCurrency: { type: ["string", "null"] }
			},
			additionalProperties: {}
		},
		FinancialData: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				currentPrice: { type: "number" },
				targetHighPrice: { type: "number" },
				targetLowPrice: { type: "number" },
				targetMeanPrice: { type: "number" },
				targetMedianPrice: { type: "number" },
				recommendationMean: { type: "number" },
				recommendationKey: { type: "string" },
				numberOfAnalystOpinions: { type: "number" },
				totalCash: { type: "number" },
				totalCashPerShare: { type: "number" },
				ebitda: { type: "number" },
				totalDebt: { type: "number" },
				quickRatio: { type: "number" },
				currentRatio: { type: "number" },
				totalRevenue: { type: "number" },
				debtToEquity: { type: "number" },
				revenuePerShare: { type: "number" },
				returnOnAssets: { type: "number" },
				returnOnEquity: { type: "number" },
				grossProfits: { type: "number" },
				freeCashflow: { type: "number" },
				operatingCashflow: { type: "number" },
				earningsGrowth: { type: "number" },
				revenueGrowth: { type: "number" },
				grossMargins: { type: "number" },
				ebitdaMargins: { type: "number" },
				operatingMargins: { type: "number" },
				profitMargins: { type: "number" },
				financialCurrency: { type: ["string", "null"] }
			},
			required: [
				"maxAge",
				"recommendationKey",
				"financialCurrency"
			],
			additionalProperties: {}
		},
		Ownership: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				ownershipList: {
					type: "array",
					items: { $ref: "#/definitions/OwnershipList" }
				}
			},
			required: ["maxAge", "ownershipList"],
			additionalProperties: {}
		},
		OwnershipList: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				reportDate: {
					type: "string",
					format: "date-time"
				},
				organization: { type: "string" },
				pctHeld: { type: "number" },
				position: { type: "number" },
				value: { type: "number" },
				pctChange: { type: "number" }
			},
			required: [
				"maxAge",
				"reportDate",
				"organization",
				"pctHeld",
				"position",
				"value"
			],
			additionalProperties: {}
		},
		FundPerformance: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				loadAdjustedReturns: { $ref: "#/definitions/PeriodRange" },
				rankInCategory: { $ref: "#/definitions/PeriodRange" },
				performanceOverview: { $ref: "#/definitions/FundPerformancePerformanceOverview" },
				performanceOverviewCat: { $ref: "#/definitions/FundPerformancePerformanceOverviewCat" },
				trailingReturns: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				trailingReturnsNav: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				trailingReturnsCat: { $ref: "#/definitions/FundPerformanceTrailingReturns" },
				annualTotalReturns: { $ref: "#/definitions/FundPerformanceReturns" },
				pastQuarterlyReturns: { $ref: "#/definitions/FundPerformanceReturns" },
				riskOverviewStatistics: { $ref: "#/definitions/FundPerformanceRiskOverviewStats" },
				riskOverviewStatisticsCat: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsCat" },
				fundCategoryName: { type: "string" }
			},
			required: [
				"maxAge",
				"performanceOverview",
				"performanceOverviewCat",
				"trailingReturns",
				"trailingReturnsNav",
				"trailingReturnsCat",
				"annualTotalReturns",
				"pastQuarterlyReturns",
				"riskOverviewStatistics",
				"riskOverviewStatisticsCat"
			],
			additionalProperties: {}
		},
		PeriodRange: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytd: { type: "number" },
				oneMonth: { type: "number" },
				threeMonth: { type: "number" },
				oneYear: { type: "number" },
				threeYear: { type: "number" },
				fiveYear: { type: "number" },
				tenYear: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformancePerformanceOverview: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytdReturnPct: { type: "number" },
				oneYearTotalReturn: { type: "number" },
				threeYearTotalReturn: { type: "number" },
				fiveYrAvgReturnPct: { type: "number" },
				morningStarReturnRating: { type: "number" },
				numYearsUp: { type: "number" },
				numYearsDown: { type: "number" },
				bestOneYrTotalReturn: { type: "number" },
				worstOneYrTotalReturn: { type: "number" },
				bestThreeYrTotalReturn: { type: "number" },
				worstThreeYrTotalReturn: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformancePerformanceOverviewCat: {
			type: "object",
			properties: {
				ytdReturnPct: { type: "number" },
				fiveYrAvgReturnPct: { type: "number" },
				oneYearTotalReturn: { type: "number" },
				threeYearTotalReturn: { type: "number" }
			},
			additionalProperties: {}
		},
		FundPerformanceTrailingReturns: {
			type: "object",
			properties: {
				asOfDate: {
					type: "string",
					format: "date-time"
				},
				ytd: { type: "number" },
				oneMonth: { type: "number" },
				threeMonth: { type: "number" },
				oneYear: { type: "number" },
				threeYear: { type: "number" },
				fiveYear: { type: "number" },
				tenYear: { type: "number" },
				lastBullMkt: { type: "number" },
				lastBearMkt: { type: "number" }
			},
			additionalProperties: { anyOf: [{}, {}] }
		},
		FundPerformanceReturns: {
			type: "object",
			properties: {
				returns: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceReturnsRow" }
				},
				returnsCat: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceReturnsRow" }
				}
			},
			required: ["returns"],
			additionalProperties: {}
		},
		FundPerformanceReturnsRow: {
			type: "object",
			properties: {
				year: { type: "number" },
				annualValue: { type: "number" },
				q1: { type: "number" },
				q2: { type: "number" },
				q3: { type: "number" },
				q4: { type: "number" }
			},
			required: ["year"],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStats: {
			type: "object",
			properties: {
				riskStatistics: {
					type: "array",
					items: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsRow" }
				},
				riskRating: { type: "number" }
			},
			required: ["riskStatistics"],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStatsRow: {
			type: "object",
			properties: {
				year: { type: "string" },
				alpha: { type: "number" },
				beta: { type: "number" },
				meanAnnualReturn: { type: "number" },
				rSquared: { type: "number" },
				stdDev: { type: "number" },
				sharpeRatio: { type: "number" },
				treynorRatio: { type: "number" }
			},
			required: [
				"year",
				"alpha",
				"beta",
				"meanAnnualReturn",
				"rSquared",
				"sharpeRatio",
				"treynorRatio"
			],
			additionalProperties: {}
		},
		FundPerformanceRiskOverviewStatsCat: {
			type: "object",
			properties: { riskStatisticsCat: {
				type: "array",
				items: { $ref: "#/definitions/FundPerformanceRiskOverviewStatsRow" }
			} },
			required: ["riskStatisticsCat"],
			additionalProperties: {}
		},
		FundProfile: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				styleBoxUrl: { type: ["null", "string"] },
				family: { type: ["null", "string"] },
				categoryName: { type: ["null", "string"] },
				legalType: { type: ["null", "string"] },
				managementInfo: { $ref: "#/definitions/FundProfileManagementInfo" },
				feesExpensesInvestment: { $ref: "#/definitions/FundProfileFeesExpensesInvestment" },
				feesExpensesInvestmentCat: { $ref: "#/definitions/FundProfileFeesExpensesInvestmentCat" },
				brokerages: {
					type: "array",
					items: { $ref: "#/definitions/FundProfileBrokerage" }
				},
				initInvestment: { type: "number" },
				initIraInvestment: { type: "number" },
				initAipInvestment: { type: "number" },
				subseqInvestment: { type: "number" },
				subseqIraInvestment: { type: "number" },
				subseqAipInvestment: { type: "number" }
			},
			required: [
				"maxAge",
				"family",
				"categoryName",
				"legalType"
			],
			additionalProperties: {}
		},
		FundProfileManagementInfo: {
			type: "object",
			properties: {
				managerName: { type: ["null", "string"] },
				managerBio: { type: ["null", "string"] },
				startdate: {
					type: "string",
					format: "date-time"
				}
			},
			required: ["managerName", "managerBio"],
			additionalProperties: {}
		},
		FundProfileFeesExpensesInvestment: {
			type: "object",
			properties: {
				annualHoldingsTurnover: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				grossExpRatio: { type: "number" },
				netExpRatio: { type: "number" },
				projectionValues: { type: "object" },
				totalNetAssets: { type: "number" }
			},
			required: ["projectionValues"],
			additionalProperties: {}
		},
		FundProfileFeesExpensesInvestmentCat: {
			type: "object",
			properties: {
				annualHoldingsTurnover: { type: "number" },
				annualReportExpenseRatio: { type: "number" },
				grossExpRatio: { type: "number" },
				netExpRatio: { type: "number" },
				totalNetAssets: { type: "number" },
				projectionValuesCat: { type: "object" }
			},
			required: ["projectionValuesCat"],
			additionalProperties: { anyOf: [{}, {}] }
		},
		FundProfileBrokerage: {
			type: "object",
			additionalProperties: {}
		},
		IncomeStatementHistory: {
			type: "object",
			properties: {
				incomeStatementHistory: {
					type: "array",
					items: { $ref: "#/definitions/IncomeStatementHistoryElement" }
				},
				maxAge: { type: "number" }
			},
			required: ["incomeStatementHistory", "maxAge"],
			additionalProperties: {}
		},
		IncomeStatementHistoryElement: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				endDate: {
					type: "string",
					format: "date-time"
				},
				totalRevenue: { type: "number" },
				costOfRevenue: { type: "number" },
				grossProfit: { type: "number" },
				researchDevelopment: { type: "null" },
				sellingGeneralAdministrative: { type: "null" },
				nonRecurring: { type: "null" },
				otherOperatingExpenses: { type: "null" },
				totalOperatingExpenses: { type: "number" },
				operatingIncome: { type: "null" },
				totalOtherIncomeExpenseNet: { type: "null" },
				ebit: { type: "number" },
				interestExpense: { type: "null" },
				incomeBeforeTax: { type: "null" },
				incomeTaxExpense: { type: "number" },
				minorityInterest: { type: "null" },
				netIncomeFromContinuingOps: { type: "null" },
				discontinuedOperations: { type: "null" },
				extraordinaryItems: { type: "null" },
				effectOfAccountingCharges: { type: "null" },
				otherItems: { type: "null" },
				netIncome: { type: "number" },
				netIncomeApplicableToCommonShares: { type: "null" }
			},
			required: [
				"maxAge",
				"endDate",
				"totalRevenue",
				"costOfRevenue",
				"grossProfit",
				"researchDevelopment",
				"sellingGeneralAdministrative",
				"nonRecurring",
				"otherOperatingExpenses",
				"totalOperatingExpenses",
				"operatingIncome",
				"totalOtherIncomeExpenseNet",
				"ebit",
				"interestExpense",
				"incomeBeforeTax",
				"incomeTaxExpense",
				"minorityInterest",
				"netIncomeFromContinuingOps",
				"discontinuedOperations",
				"extraordinaryItems",
				"effectOfAccountingCharges",
				"otherItems",
				"netIncome",
				"netIncomeApplicableToCommonShares"
			],
			additionalProperties: !1
		},
		IndexTrend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				symbol: { type: "string" },
				peRatio: { type: "number" },
				pegRatio: { type: "number" },
				estimates: {
					type: "array",
					items: { $ref: "#/definitions/Estimate" }
				}
			},
			required: [
				"maxAge",
				"symbol",
				"estimates"
			],
			additionalProperties: {}
		},
		Estimate: {
			type: "object",
			properties: {
				period: { type: "string" },
				growth: { type: "number" }
			},
			required: ["period"],
			additionalProperties: {}
		},
		Trend: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				symbol: { type: "null" },
				estimates: {
					type: "array",
					items: {}
				}
			},
			required: [
				"maxAge",
				"symbol",
				"estimates"
			],
			additionalProperties: {}
		},
		Holders: {
			type: "object",
			properties: {
				holders: {
					type: "array",
					items: { $ref: "#/definitions/Holder" }
				},
				maxAge: { type: "number" }
			},
			required: ["holders", "maxAge"],
			additionalProperties: {}
		},
		Holder: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				name: { type: "string" },
				relation: { anyOf: [{ $ref: "#/definitions/Relation" }, { type: "string" }] },
				url: { type: "string" },
				transactionDescription: { type: "string" },
				latestTransDate: {
					type: "string",
					format: "date-time"
				},
				positionDirect: { type: "number" },
				positionDirectDate: {
					type: "string",
					format: "date-time"
				},
				positionIndirect: { type: "number" },
				positionIndirectDate: {
					type: "string",
					format: "date-time"
				},
				positionSummaryDate: {
					type: "string",
					format: "date-time"
				}
			},
			required: [
				"maxAge",
				"name",
				"relation",
				"url",
				"transactionDescription",
				"latestTransDate"
			],
			additionalProperties: {}
		},
		Relation: {
			type: "string",
			enum: [
				"Chairman of the Board",
				"Chief Executive Officer",
				"Chief Financial Officer",
				"Chief Operating Officer",
				"Chief Technology Officer",
				"Director",
				"Director (Independent)",
				"",
				"General Counsel",
				"Independent Non-Executive Director",
				"Officer",
				"President"
			]
		},
		InsiderTransactions: {
			type: "object",
			properties: {
				transactions: {
					type: "array",
					items: { $ref: "#/definitions/Transaction" }
				},
				maxAge: { type: "number" }
			},
			required: ["transactions", "maxAge"],
			additionalProperties: {}
		},
		Transaction: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				shares: { type: "number" },
				filerUrl: { type: "string" },
				transactionText: { type: "string" },
				filerName: { type: "string" },
				filerRelation: { anyOf: [{ $ref: "#/definitions/Relation" }, { type: "string" }] },
				moneyText: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				ownership: { anyOf: [{ $ref: "#/definitions/OwnershipEnum" }, { type: "string" }] },
				value: { type: "number" }
			},
			required: [
				"maxAge",
				"shares",
				"filerUrl",
				"transactionText",
				"filerName",
				"filerRelation",
				"moneyText",
				"startDate",
				"ownership"
			],
			additionalProperties: {}
		},
		OwnershipEnum: {
			type: "string",
			enum: ["D", "I"]
		},
		MajorHoldersBreakdown: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				insidersPercentHeld: { type: "number" },
				institutionsPercentHeld: { type: "number" },
				institutionsFloatPercentHeld: { type: "number" },
				institutionsCount: { type: "number" }
			},
			required: ["maxAge"],
			additionalProperties: {}
		},
		NetSharePurchaseActivity: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				period: { type: "string" },
				buyInfoCount: { type: "number" },
				buyInfoShares: { type: "number" },
				buyPercentInsiderShares: { type: "number" },
				sellInfoCount: { type: "number" },
				sellInfoShares: { type: "number" },
				sellPercentInsiderShares: { type: "number" },
				netInfoCount: { type: "number" },
				netInfoShares: { type: "number" },
				netPercentInsiderShares: { type: "number" },
				totalInsiderShares: { type: "number" },
				netInstSharesBuying: { type: "number" },
				netInstBuyingPercent: { type: "number" }
			},
			required: [
				"maxAge",
				"period",
				"buyInfoCount",
				"buyInfoShares",
				"sellInfoCount",
				"netInfoCount",
				"netInfoShares",
				"totalInsiderShares",
				"netInstSharesBuying",
				"netInstBuyingPercent"
			],
			additionalProperties: {}
		},
		Price: {
			type: "object",
			properties: {
				averageDailyVolume10Day: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				exchange: { type: "string" },
				exchangeName: { type: "string" },
				exchangeDataDelayedBy: { type: "number" },
				maxAge: { type: "number" },
				priceHint: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketChange: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				preMarketSource: { type: "string" },
				regularMarketChangePercent: { type: "number" },
				regularMarketChange: { type: "number" },
				regularMarketTime: {
					type: "string",
					format: "date-time"
				},
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				regularMarketSource: { type: "string" },
				regularMarketOpen: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketChange: { type: "number" },
				postMarketTime: {
					type: "string",
					format: "date-time"
				},
				postMarketPrice: { type: "number" },
				postMarketSource: { type: "string" },
				quoteSourceName: { type: "string" },
				quoteType: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: ["null", "string"] },
				shortName: { type: ["null", "string"] },
				longName: { type: ["null", "string"] },
				lastMarket: { type: ["null", "string"] },
				marketState: { type: "string" },
				marketCap: { type: "number" },
				currency: { type: "string" },
				currencySymbol: { type: "string" },
				fromCurrency: { type: ["string", "null"] },
				toCurrency: { type: ["string", "null"] },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				circulatingSupply: { type: "number" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				openInterest: { type: "number" }
			},
			required: [
				"maxAge",
				"priceHint",
				"quoteType",
				"symbol",
				"underlyingSymbol",
				"shortName",
				"longName",
				"lastMarket",
				"fromCurrency"
			],
			additionalProperties: {}
		},
		QuoteType: {
			type: "object",
			properties: {
				exchange: { type: "string" },
				quoteType: { type: "string" },
				symbol: { type: "string" },
				underlyingSymbol: { type: "string" },
				shortName: { type: ["null", "string"] },
				longName: { type: ["null", "string"] },
				firstTradeDateEpochUtc: { anyOf: [{ type: "null" }, {
					type: "string",
					format: "date-time"
				}] },
				timeZoneFullName: { type: "string" },
				timeZoneShortName: { type: "string" },
				uuid: { type: "string" },
				messageBoardId: { type: ["null", "string"] },
				gmtOffSetMilliseconds: { type: "number" },
				maxAge: { type: "number" }
			},
			required: [
				"exchange",
				"quoteType",
				"symbol",
				"underlyingSymbol",
				"shortName",
				"timeZoneFullName",
				"timeZoneShortName",
				"uuid",
				"gmtOffSetMilliseconds",
				"maxAge"
			],
			additionalProperties: {}
		},
		RecommendationTrend: {
			type: "object",
			properties: {
				trend: {
					type: "array",
					items: { $ref: "#/definitions/RecommendationTrendTrend" }
				},
				maxAge: { type: "number" }
			},
			required: ["trend", "maxAge"],
			additionalProperties: {}
		},
		RecommendationTrendTrend: {
			type: "object",
			properties: {
				period: { type: "string" },
				strongBuy: { type: "number" },
				buy: { type: "number" },
				hold: { type: "number" },
				sell: { type: "number" },
				strongSell: { type: "number" }
			},
			required: [
				"period",
				"strongBuy",
				"buy",
				"hold",
				"sell",
				"strongSell"
			],
			additionalProperties: {}
		},
		SECFilings: {
			type: "object",
			properties: {
				filings: {
					type: "array",
					items: { $ref: "#/definitions/Filing" }
				},
				maxAge: { type: "number" }
			},
			required: ["filings", "maxAge"],
			additionalProperties: {}
		},
		Filing: {
			type: "object",
			properties: {
				date: { type: "string" },
				epochDate: {
					type: "string",
					format: "date-time"
				},
				type: {
					type: "string",
					enum: /* @__PURE__ */ "10-K.10-Q.8-K.8-K/A.10-K/A.10-Q/A.SD.PX14A6G.SC 13G/A.DEFA14A.25-NSE.S-8 POS.6-K.F-3ASR.SC 13D/A.20-F.425.SC14D9C.SC 13G.S-8.DEF 14A.F-10.S-3ASR.CORRESP.PX14A6N.N-PX.ARS.PRE 14A.F-6EF.S-3/A.S-3.POS AM.IRANNOTICE.20-F/A.11-K.DEFR14A.S4.RW.S-4/A.S-4.S-4MEF.PRER14A.8-A12B.D.SC 13D.NT 10-Q/A.F-4".split(".")
				},
				title: { type: "string" },
				edgarUrl: { type: "string" },
				maxAge: { type: "number" },
				url: { type: "string" },
				exhibits: {
					type: "array",
					items: {
						type: "object",
						properties: {
							type: { type: "string" },
							url: { type: "string" },
							downloadUrl: { type: "string" }
						},
						required: ["type", "url"],
						additionalProperties: !1
					}
				}
			},
			required: [
				"date",
				"epochDate",
				"type",
				"title",
				"edgarUrl",
				"maxAge"
			],
			additionalProperties: {}
		},
		SummaryDetail: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				priceHint: { type: "number" },
				previousClose: { type: "number" },
				open: { type: "number" },
				dayLow: { type: "number" },
				dayHigh: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				regularMarketOpen: { type: "number" },
				regularMarketDayLow: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketVolume: { type: "number" },
				dividendRate: { type: "number" },
				dividendYield: { type: "number" },
				exDividendDate: {
					type: "string",
					format: "date-time"
				},
				payoutRatio: { type: "number" },
				fiveYearAvgDividendYield: { type: "number" },
				beta: { type: "number" },
				trailingPE: { type: "number" },
				forwardPE: { type: "number" },
				volume: { type: "number" },
				averageVolume: { type: "number" },
				averageVolume10days: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				marketCap: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				priceToSalesTrailing12Months: { type: "number" },
				trailingAnnualDividendRate: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				currency: { type: "string" },
				algorithm: { type: "null" },
				tradeable: { type: "boolean" },
				yield: { type: "number" },
				totalAssets: { type: "number" },
				navPrice: { type: "number" },
				ytdReturn: { type: "number" },
				fullyDilutedValue: { type: "number" },
				volume24HrMarketCapPercent: { type: "number" },
				fromCurrency: { type: ["string", "null"] },
				toCurrency: { type: ["string", "null"] },
				lastMarket: { type: ["string", "null"] },
				volume24Hr: { type: "number" },
				volumeAllCurrencies: { type: "number" },
				circulatingSupply: { type: "number" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				coinMarketCapLink: { type: ["string", "null"] },
				maxSupply: { type: "number" },
				totalSupply: { type: "number" },
				expireDate: {
					type: "string",
					format: "date-time"
				},
				openInterest: { type: "number" },
				averageMaturity: { type: "number" },
				nonDilutedMarketCap: { type: "number" },
				allTimeHigh: { type: "number" },
				allTimeLow: { type: "number" }
			},
			required: [
				"maxAge",
				"priceHint",
				"currency",
				"algorithm",
				"tradeable",
				"fromCurrency",
				"lastMarket"
			],
			additionalProperties: {}
		},
		SummaryProfile: {
			type: "object",
			properties: {
				address1: { type: "string" },
				address2: { type: "string" },
				address3: { type: "string" },
				city: { type: "string" },
				state: { type: "string" },
				zip: { type: "string" },
				country: { type: "string" },
				phone: { type: "string" },
				fax: { type: "string" },
				website: { type: "string" },
				industry: { type: "string" },
				industryDisp: { type: "string" },
				sector: { type: "string" },
				sectorDisp: { type: "string" },
				longBusinessSummary: { type: "string" },
				fullTimeEmployees: { type: "number" },
				companyOfficers: {
					type: "array",
					items: {}
				},
				maxAge: { type: "number" },
				twitter: { type: "string" },
				industryKey: { type: "string" },
				sectorKey: { type: "string" },
				irWebsite: { type: "string" },
				executiveTeam: {
					type: "array",
					items: {}
				},
				name: { type: "string" },
				startDate: {
					type: "string",
					format: "date-time"
				},
				description: { type: "string" },
				whitepaper: { type: "string" },
				blockNumber: { type: "number" },
				blockReward: { type: "number" },
				blockRewardReduction: { type: "string" },
				netHashesPerSecond: { type: "string" }
			},
			required: ["companyOfficers", "maxAge"],
			additionalProperties: {}
		},
		TopHoldings: {
			type: "object",
			properties: {
				maxAge: { type: "number" },
				stockPosition: { type: "number" },
				bondPosition: { type: "number" },
				holdings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsHolding" }
				},
				equityHoldings: { $ref: "#/definitions/TopHoldingsEquityHoldings" },
				bondHoldings: { type: "object" },
				bondRatings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsBondRating" }
				},
				sectorWeightings: {
					type: "array",
					items: { $ref: "#/definitions/TopHoldingsSectorWeighting" }
				},
				cashPosition: { type: "number" },
				otherPosition: { type: "number" },
				preferredPosition: { type: "number" },
				convertiblePosition: { type: "number" }
			},
			required: [
				"maxAge",
				"holdings",
				"equityHoldings",
				"bondHoldings",
				"bondRatings",
				"sectorWeightings"
			],
			additionalProperties: {}
		},
		TopHoldingsHolding: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				holdingName: { type: "string" },
				holdingPercent: { type: "number" }
			},
			required: [
				"symbol",
				"holdingName",
				"holdingPercent"
			],
			additionalProperties: {}
		},
		TopHoldingsEquityHoldings: {
			type: "object",
			properties: {
				medianMarketCap: { type: "number" },
				medianMarketCapCat: { type: "number" },
				priceToBook: { type: "number" },
				priceToBookCat: { type: "number" },
				priceToCashflow: { type: "number" },
				priceToCashflowCat: { type: "number" },
				priceToEarnings: { type: "number" },
				priceToEarningsCat: { type: "number" },
				priceToSales: { type: "number" },
				priceToSalesCat: { type: "number" },
				threeYearEarningsGrowth: { type: "number" },
				threeYearEarningsGrowthCat: { type: "number" }
			},
			required: [
				"priceToBook",
				"priceToCashflow",
				"priceToEarnings",
				"priceToSales"
			],
			additionalProperties: {}
		},
		TopHoldingsBondRating: {
			type: "object",
			properties: {
				a: { type: "number" },
				aa: { type: "number" },
				aaa: { type: "number" },
				other: { type: "number" },
				b: { type: "number" },
				bb: { type: "number" },
				bbb: { type: "number" },
				below_b: { type: "number" },
				us_government: { type: "number" }
			},
			additionalProperties: {}
		},
		TopHoldingsSectorWeighting: {
			type: "object",
			properties: {
				realestate: { type: "number" },
				consumer_cyclical: { type: "number" },
				basic_materials: { type: "number" },
				consumer_defensive: { type: "number" },
				technology: { type: "number" },
				communication_services: { type: "number" },
				financial_services: { type: "number" },
				utilities: { type: "number" },
				industrials: { type: "number" },
				energy: { type: "number" },
				healthcare: { type: "number" }
			},
			additionalProperties: {}
		},
		UpgradeDowngradeHistory: {
			type: "object",
			properties: {
				history: {
					type: "array",
					items: { $ref: "#/definitions/UpgradeDowngradeHistoryHistory" }
				},
				maxAge: { type: "number" }
			},
			required: ["history", "maxAge"],
			additionalProperties: {}
		},
		UpgradeDowngradeHistoryHistory: {
			type: "object",
			properties: {
				epochGradeDate: {
					type: "string",
					format: "date-time"
				},
				firm: { type: "string" },
				toGrade: { $ref: "#/definitions/Grade" },
				fromGrade: { $ref: "#/definitions/Grade" },
				action: { $ref: "#/definitions/Action" },
				priceTargetAction: {
					type: "string",
					enum: [
						"Lowers",
						"Raises",
						"Maintains",
						"Announces",
						"Adjusts",
						""
					]
				},
				currentPriceTarget: { type: "number" },
				priorPriceTarget: { type: "number" }
			},
			required: [
				"epochGradeDate",
				"firm",
				"toGrade",
				"action",
				"priceTargetAction",
				"currentPriceTarget",
				"priorPriceTarget"
			],
			additionalProperties: {}
		},
		Grade: {
			type: "string",
			enum: /* @__PURE__ */ "Accumulate.Add.Average.Below Average.Buy.Conviction Buy..Equal-Weight.Fair Value.Equal-weight.Long-term Buy.Hold.Long-Term Buy.Market Outperform.Market Perform.Mixed.Negative.Neutral.In-Line.Outperform.Overweight.Peer Perform.Perform.Positive.Reduce.Sector Outperform.Sector Perform.Sector Weight.Sell.Strong Buy.Top Pick.Underperform.Underperformer.Underweight.Trim.Above Average.In-line.Outperformer.OVerweight.Cautious.Market Weight.Sector Underperform.Market Underperform.Peer perform.Gradually Accumulate.Action List Buy.Performer.Sector Performer.Speculative Buy.Strong Sell.Speculative Hold.Not Rated.Hold Neutral.Developing.buy.HOld.Trading Sell.Tender.market perform.BUy".split(".")
		},
		Action: {
			type: "string",
			enum: [
				"down",
				"init",
				"main",
				"reit",
				"up"
			]
		}
	}
}, pn = K(dn), mn = K(fn), hn = /* @__PURE__ */ "assetProfile.balanceSheetHistory.balanceSheetHistoryQuarterly.calendarEvents.cashflowStatementHistory.cashflowStatementHistoryQuarterly.defaultKeyStatistics.earnings.earningsHistory.earningsTrend.financialData.fundOwnership.fundPerformance.fundProfile.incomeStatementHistory.incomeStatementHistoryQuarterly.indexTrend.industryTrend.insiderHolders.insiderTransactions.institutionOwnership.majorDirectHolders.majorHoldersBreakdown.netSharePurchaseActivity.price.quoteType.recommendationTrend.secFilings.sectorTrend.summaryDetail.summaryProfile.topHoldings.upgradeDowngradeHistory".split("."), gn = {
	formatted: !1,
	modules: ["price", "summaryDetail"]
};
function _n(e, t, n) {
	let r = [
		"balanceSheetHistory",
		"balanceSheetHistoryQuarterly",
		"cashflowStatementHistory",
		"cashflowStatementHistoryQuarterly",
		"incomeStatementHistory",
		"incomeStatementHistoryQuarterly"
	].filter((e) => t?.modules?.includes(e));
	return r.length && this._opts.logger.warn("QuoteSummary financial statements submodules like " + r.join(", ") + " have provided almost no data since Nov 2024. Use `fundamentalsTimeSeries` instead."), this._moduleExec({
		moduleName: "quoteSummary",
		query: {
			assertSymbol: e,
			url: "https://${YF_QUERY_HOST}/v10/finance/quoteSummary/" + e,
			needsCrumb: !0,
			definitions: pn,
			schemaKey: "#/definitions/QuoteSummaryOptions",
			defaults: gn,
			overrides: t,
			transformWith(e) {
				return e.modules === "all" && (e.modules = hn), e;
			}
		},
		result: {
			definitions: mn,
			schemaKey: "#/definitions/QuoteSummaryResult",
			transformWith(e) {
				if (!e.quoteSummary) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.quoteSummary.result[0];
			}
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/recommendationsBySymbol.js
var vn = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		RecommendationsBySymbolResponse: {
			type: "object",
			properties: {
				recommendedSymbols: {
					type: "array",
					items: {
						type: "object",
						properties: {
							score: { type: "number" },
							symbol: { type: "string" }
						},
						required: ["score", "symbol"],
						additionalProperties: {}
					}
				},
				symbol: { type: "string" }
			},
			required: ["recommendedSymbols", "symbol"],
			additionalProperties: {}
		},
		RecommendationsBySymbolResponseArray: {
			type: "array",
			items: { $ref: "#/definitions/RecommendationsBySymbolResponse" }
		},
		RecommendationsBySymbolOptions: {
			type: "object",
			additionalProperties: { not: {} }
		},
		recommendationsBySymbol: {}
	}
}), yn = {};
function bn(e, t, n) {
	let r = typeof e == "string" ? e : e.join(",");
	return this._moduleExec({
		moduleName: "recommendationsBySymbol",
		query: {
			url: "https://${YF_QUERY_HOST}/v6/finance/recommendationsbysymbol/" + r,
			definitions: vn,
			schemaKey: "#/definitions/RecommendationsBySymbolOptions",
			defaults: yn,
			overrides: t
		},
		result: {
			definitions: vn,
			schemaKey: "#/definitions/RecommendationsBySymbolResponseArray",
			transformWith(e) {
				if (!e.finance) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.finance.result;
			}
		},
		moduleOptions: n
	}).then((t) => typeof e == "string" ? t[0] : t);
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/screener.js
var xn = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		ScreenerResultBase: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: { type: "string" },
				criteriaMeta: { $ref: "#/definitions/ScreenerCriteriaMeta" },
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"id",
				"title",
				"description",
				"canonicalName",
				"criteriaMeta",
				"rawCriteria",
				"start",
				"count",
				"total",
				"quotes",
				"useRecords",
				"predefinedScr",
				"versionId",
				"creationDate",
				"lastUpdated",
				"isPremium",
				"iconUrl"
			],
			additionalProperties: !1
		},
		ScreenerCriteriaMeta: {
			type: "object",
			properties: {
				size: { type: "number" },
				offset: { type: "number" },
				sortField: { type: "string" },
				sortType: { type: "string" },
				quoteType: { type: "string" },
				criteria: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerCriterum" }
				},
				topOperator: { type: "string" }
			},
			required: [
				"size",
				"offset",
				"sortField",
				"sortType",
				"quoteType",
				"criteria",
				"topOperator"
			],
			additionalProperties: !1
		},
		ScreenerCriterum: {
			type: "object",
			properties: {
				field: { type: "string" },
				operators: {
					type: "array",
					items: { type: "string" }
				},
				values: {
					type: "array",
					items: { type: ["string", "number"] }
				},
				labelsSelected: {
					type: "array",
					items: { type: "number" }
				},
				dependentValues: {
					type: "array",
					items: {}
				},
				subField: { type: "null" }
			},
			required: [
				"field",
				"operators",
				"values",
				"labelsSelected",
				"dependentValues"
			],
			additionalProperties: !1
		},
		ScreenerQuote: {
			type: "object",
			properties: {
				language: { type: "string" },
				region: { type: "string" },
				quoteType: { type: "string" },
				typeDisp: { type: "string" },
				quoteSourceName: { type: "string" },
				triggerable: { type: "boolean" },
				customPriceAlertConfidence: { type: "string" },
				lastCloseTevEbitLtm: { type: "number" },
				lastClosePriceToNNWCPerShare: { type: "number" },
				firstTradeDateMilliseconds: { type: "number" },
				priceHint: { type: "number" },
				postMarketChangePercent: { type: "number" },
				postMarketTime: { type: "number" },
				postMarketPrice: { type: "number" },
				postMarketChange: { type: "number" },
				regularMarketChange: { type: "number" },
				regularMarketTime: { type: "number" },
				regularMarketPrice: { type: "number" },
				regularMarketDayHigh: { type: "number" },
				regularMarketDayRange: { type: "string" },
				currency: { type: "string" },
				regularMarketDayLow: { type: "number" },
				regularMarketVolume: { type: "number" },
				regularMarketPreviousClose: { type: "number" },
				bid: { type: "number" },
				ask: { type: "number" },
				bidSize: { type: "number" },
				askSize: { type: "number" },
				market: { type: "string" },
				messageBoardId: { type: "string" },
				fullExchangeName: { type: "string" },
				longName: { type: "string" },
				financialCurrency: { type: "string" },
				regularMarketOpen: { type: "number" },
				averageDailyVolume3Month: { type: "number" },
				averageDailyVolume10Day: { type: "number" },
				fiftyTwoWeekLowChange: { type: "number" },
				fiftyTwoWeekLowChangePercent: { type: "number" },
				fiftyTwoWeekRange: { type: "string" },
				fiftyTwoWeekHighChange: { type: "number" },
				fiftyTwoWeekHighChangePercent: { type: "number" },
				fiftyTwoWeekChangePercent: { type: "number" },
				earningsTimestamp: { type: "number" },
				earningsTimestampStart: { type: "number" },
				earningsTimestampEnd: { type: "number" },
				trailingAnnualDividendRate: { type: "number" },
				trailingAnnualDividendYield: { type: "number" },
				marketState: { type: "string" },
				epsTrailingTwelveMonths: { type: "number" },
				epsForward: { type: "number" },
				epsCurrentYear: { type: "number" },
				priceEpsCurrentYear: { type: "number" },
				sharesOutstanding: { type: "number" },
				bookValue: { type: "number" },
				fiftyDayAverage: { type: "number" },
				fiftyDayAverageChange: { type: "number" },
				fiftyDayAverageChangePercent: { type: "number" },
				twoHundredDayAverage: { type: "number" },
				twoHundredDayAverageChange: { type: "number" },
				twoHundredDayAverageChangePercent: { type: "number" },
				marketCap: { type: "number" },
				forwardPE: { type: "number" },
				priceToBook: { type: "number" },
				sourceInterval: { type: "number" },
				exchangeDataDelayedBy: { type: "number" },
				exchangeTimezoneName: { type: "string" },
				exchangeTimezoneShortName: { type: "string" },
				gmtOffSetMilliseconds: { type: "number" },
				esgPopulated: { type: "boolean" },
				tradeable: { type: "boolean" },
				cryptoTradeable: { type: "boolean" },
				exchange: { type: "string" },
				fiftyTwoWeekLow: { type: "number" },
				fiftyTwoWeekHigh: { type: "number" },
				shortName: { type: "string" },
				averageAnalystRating: { type: "string" },
				regularMarketChangePercent: { type: "number" },
				symbol: { type: "string" },
				dividendDate: { type: "number" },
				displayName: { type: "string" },
				trailingPE: { type: "number" },
				prevName: { type: "string" },
				nameChangeDate: { type: "number" },
				ipoExpectedDate: { type: "number" },
				dividendYield: { type: "number" },
				dividendRate: { type: "number" },
				yieldTTM: { type: "number" },
				peTTM: { type: "number" },
				annualReturnNavY3: { type: "number" },
				annualReturnNavY5: { type: "number" },
				ytdReturn: { type: "number" },
				trailingThreeMonthReturns: { type: "number" },
				netAssets: { type: "number" },
				netExpenseRatio: { type: "number" },
				hasPrePostMarketData: { type: "boolean" },
				corporateActions: {
					type: "array",
					items: {}
				},
				earningsCallTimestampStart: {
					type: "string",
					format: "date-time"
				},
				earningsCallTimestampEnd: {
					type: "string",
					format: "date-time"
				},
				isEarningsDateEstimate: { type: "boolean" },
				preMarketChange: { type: "number" },
				preMarketChangePercent: { type: "number" },
				preMarketTime: {
					type: "string",
					format: "date-time"
				},
				preMarketPrice: { type: "number" },
				impliedSharesOutstanding: { type: "number" }
			},
			required: /* @__PURE__ */ "language.region.quoteType.typeDisp.triggerable.customPriceAlertConfidence.firstTradeDateMilliseconds.priceHint.regularMarketChange.regularMarketTime.regularMarketPrice.currency.regularMarketPreviousClose.market.messageBoardId.fullExchangeName.fiftyTwoWeekLowChange.fiftyTwoWeekRange.fiftyTwoWeekHighChange.fiftyTwoWeekHighChangePercent.fiftyTwoWeekChangePercent.marketState.fiftyDayAverage.fiftyDayAverageChange.fiftyDayAverageChangePercent.twoHundredDayAverage.twoHundredDayAverageChange.twoHundredDayAverageChangePercent.sourceInterval.exchangeDataDelayedBy.exchangeTimezoneName.exchangeTimezoneShortName.gmtOffSetMilliseconds.esgPopulated.tradeable.cryptoTradeable.exchange.fiftyTwoWeekLow.fiftyTwoWeekHigh.regularMarketChangePercent.symbol".split("."),
			additionalProperties: !1
		},
		ScreenerResultAggressiveSmallCaps: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "AGGRESSIVE_SMALL_CAPS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerCriteriaFieldsFund: {
			type: "string",
			enum: /* @__PURE__ */ "fundnetassets.sold_proportion.annualreportnetexpenseratio.performanceratingoverall.intradaypricechange.bought_proportion.fiftytwowkhigh.fiftydaymovingavg.ticker.longname_us_en-us.percentchange.companyshortname.intradayprice.annualreturnnavy5.day_open_price.annualreturnnavy3.annualreturnnavy1.annualreportgrossexpenseratio.twohundreddaymovingavg.pe_ttm.yield_ttm.exchange.fiftytwowklow.riskratingoverall.trailing_ytd_return.trailing_3m_return.annualreturnnavy1categoryrank.categoryname.initialinvestment.fiftytwowkpercentchange".split(".")
		},
		ScreenerResultConservativeForeignFunds: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "CONSERVATIVE_FOREIGN_FUNDS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultDayGainers: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "DAY_GAINERS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultDayLosers: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "DAY_LOSERS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultGrowthTechnologyStocks: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "GROWTH_TECHNOLOGY_STOCKS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultMostActives: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "MOST_ACTIVES"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultHighYieldBond: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "HIGH_YIELD_BOND"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultMostShortedStocks: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "MOST_SHORTED_STOCKS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultPortfolioAnchors: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "PORTFOLIO_ANCHORS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultSmallCapGainers: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "SMALL_CAP_GAINERS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultSolidLargeGrowthFunds: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "SOLID_LARGE_GROWTH_FUNDS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultSolidMidcapGrowthFunds: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "SOLID_MIDCAP_GROWTH_FUNDS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultTopMutualFunds: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "TOP_MUTUAL_FUNDS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriteriaFieldsFund" }
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultUndervaluedGrowthStocks: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "UNDERVALUED_GROWTH_STOCKS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResultUndervaluedLargeCaps: {
			type: "object",
			properties: {
				id: { type: "string" },
				title: { type: "string" },
				description: { type: "string" },
				canonicalName: {
					type: "string",
					const: "UNDERVALUED_LARGE_CAPS"
				},
				criteriaMeta: {
					type: "object",
					additionalProperties: !1,
					properties: {
						includeFields: {
							type: "array",
							items: {
								type: "string",
								enum: /* @__PURE__ */ "change_in_number_of_institutional_holders,trading_central_last_close_price_to_fair_value,intradaypricechange,estimated_revenue_growth,intradaymarketcap,morningstar_previous_rating,fiftytwowkhigh,fiftytwowkpercentchange,pctheldinst,morningstar_last_close_price_to_fair_value,shares_bought_by_funds,ror_percent,morningstar_rating,sector,peratio.lasttwelvemonths,bullish_proportion,percent_change_in_number_of_institutional_holders,number_of_institutional_sellers,morningstar_stewardship,lastclosetevebit.lasttwelvemonths,percentchange,morningstar_economic_moat,percent_of_shares_outstanding_bought_by_institutions,day_open_price,morningstar_rating_change,number_of_institutional_holders,percent_in_funds_holding,exchange,percent_of_shares_outstanding_sold_by_institutions,dayvolume,bearish_proportion,morningstar_fair_value,sold_proportion,industry,morningstar_uncertainty,shares_sold_by_funds,fair_value,bought_proportion,percent_in_top_ten_holdings,avgdailyvol3m,last_close_price_to_nnwc_per_share,estimated_earnings_growth,ticker,longname_us_en-us,percent_change_in_shares_held_by_funds,number_of_institutional_buyers,companyshortname,intradayprice,change_in_shares_held_by_funds,indices,neutral_proportion,latest_holdings_report_date,fiftytwowklow,value_description,average_analyst_rating,region,epsgrowth.lasttwelvemonths,quarterlyrevenuegrowth.quarterly,pegratio_5y".split(",")
							}
						},
						size: { type: "number" },
						offset: { type: "number" },
						sortField: { type: "string" },
						sortType: { type: "string" },
						quoteType: { type: "string" },
						criteria: {
							type: "array",
							items: { $ref: "#/definitions/ScreenerCriterum" }
						},
						topOperator: { type: "string" }
					},
					required: [
						"criteria",
						"includeFields",
						"offset",
						"quoteType",
						"size",
						"sortField",
						"sortType",
						"topOperator"
					]
				},
				rawCriteria: { type: "string" },
				start: { type: "number" },
				count: { type: "number" },
				total: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/ScreenerQuote" }
				},
				useRecords: { type: "boolean" },
				predefinedScr: { type: "boolean" },
				versionId: { type: "number" },
				creationDate: { type: "number" },
				lastUpdated: { type: "number" },
				isPremium: { type: "boolean" },
				iconUrl: { type: "string" }
			},
			required: [
				"canonicalName",
				"count",
				"creationDate",
				"criteriaMeta",
				"description",
				"iconUrl",
				"id",
				"isPremium",
				"lastUpdated",
				"predefinedScr",
				"quotes",
				"rawCriteria",
				"start",
				"title",
				"total",
				"useRecords",
				"versionId"
			],
			additionalProperties: !1
		},
		ScreenerResult: {
			type: "object",
			discriminator: { propertyName: "canonicalName" },
			required: ["canonicalName"],
			oneOf: [
				{ $ref: "#/definitions/ScreenerResultAggressiveSmallCaps" },
				{ $ref: "#/definitions/ScreenerResultConservativeForeignFunds" },
				{ $ref: "#/definitions/ScreenerResultDayGainers" },
				{ $ref: "#/definitions/ScreenerResultDayLosers" },
				{ $ref: "#/definitions/ScreenerResultGrowthTechnologyStocks" },
				{ $ref: "#/definitions/ScreenerResultHighYieldBond" },
				{ $ref: "#/definitions/ScreenerResultMostActives" },
				{ $ref: "#/definitions/ScreenerResultMostShortedStocks" },
				{ $ref: "#/definitions/ScreenerResultPortfolioAnchors" },
				{ $ref: "#/definitions/ScreenerResultSmallCapGainers" },
				{ $ref: "#/definitions/ScreenerResultSolidLargeGrowthFunds" },
				{ $ref: "#/definitions/ScreenerResultSolidMidcapGrowthFunds" },
				{ $ref: "#/definitions/ScreenerResultTopMutualFunds" },
				{ $ref: "#/definitions/ScreenerResultUndervaluedGrowthStocks" },
				{ $ref: "#/definitions/ScreenerResultUndervaluedLargeCaps" }
			]
		},
		PredefinedScreenerModules: {
			type: "string",
			enum: [
				"aggressive_small_caps",
				"conservative_foreign_funds",
				"day_gainers",
				"day_losers",
				"growth_technology_stocks",
				"high_yield_bond",
				"most_actives",
				"most_shorted_stocks",
				"portfolio_anchors",
				"small_cap_gainers",
				"solid_large_growth_funds",
				"solid_midcap_growth_funds",
				"top_mutual_funds",
				"undervalued_growth_stocks",
				"undervalued_large_caps"
			]
		},
		ScreenerOptions: {
			type: "object",
			properties: {
				lang: { type: "string" },
				region: { type: "string" },
				scrIds: { $ref: "#/definitions/PredefinedScreenerModules" },
				count: { type: "number" },
				start: { type: "number" }
			},
			required: ["scrIds"],
			additionalProperties: !1
		},
		screener: {}
	}
}), Sn = {
	lang: "en-US",
	region: "US",
	scrIds: "day_gainers",
	count: 5
};
function Cn(e, t, n) {
	return t = typeof e == "string" ? {
		scrIds: e,
		...t
	} : e, this._moduleExec({
		moduleName: "screener",
		query: {
			url: "https://${YF_QUERY_HOST}/v1/finance/screener/predefined/saved",
			definitions: xn,
			schemaKey: "#/definitions/ScreenerOptions",
			defaults: Sn,
			overrides: t,
			needsCrumb: !0
		},
		result: {
			definitions: xn,
			schemaKey: "#/definitions/ScreenerResult",
			transformWith(e) {
				if (!e.finance) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.finance.result[0];
			}
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/search.js
var wn = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		SearchQuoteYahoo: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" }
			},
			required: [
				"symbol",
				"isYahooFinance",
				"exchange",
				"index",
				"score"
			],
			additionalProperties: {}
		},
		SearchQuoteYahooEquity: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "EQUITY"
				},
				typeDisp: {
					type: "string",
					const: "Equity"
				},
				sectorDisp: { type: "string" },
				industryDisp: { type: "string" }
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooOption: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "OPTION"
				},
				typeDisp: {
					type: "string",
					const: "Option"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooETF: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "ETF"
				},
				typeDisp: {
					type: "string",
					const: "ETF"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooFund: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "MUTUALFUND"
				},
				typeDisp: {
					type: "string",
					const: "Fund"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooIndex: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "INDEX"
				},
				typeDisp: {
					type: "string",
					const: "Index"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooCurrency: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "CURRENCY"
				},
				typeDisp: {
					type: "string",
					const: "Currency"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooCryptocurrency: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "CRYPTOCURRENCY"
				},
				typeDisp: {
					type: "string",
					const: "Cryptocurrency"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooFuture: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "FUTURE"
				},
				typeDisp: {
					type: "string",
					enum: ["Future", "Futures"]
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteYahooMoneyMarket: {
			type: "object",
			properties: {
				symbol: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !0
				},
				exchange: { type: "string" },
				exchDisp: { type: "string" },
				shortname: { type: "string" },
				longname: { type: "string" },
				index: {
					type: "string",
					const: "quotes"
				},
				score: { type: "number" },
				newListingDate: {
					type: "string",
					format: "date-time"
				},
				prevName: { type: "string" },
				nameChangeDate: {
					type: "string",
					format: "date-time"
				},
				sector: { type: "string" },
				industry: { type: "string" },
				dispSecIndFlag: { type: "boolean" },
				quoteType: {
					type: "string",
					const: "MONEY_MARKET"
				},
				typeDisp: {
					type: "string",
					const: "MoneyMarket"
				}
			},
			required: [
				"exchange",
				"index",
				"isYahooFinance",
				"quoteType",
				"score",
				"symbol",
				"typeDisp"
			]
		},
		SearchQuoteNonYahoo: {
			type: "object",
			properties: {
				index: { type: "string" },
				name: { type: "string" },
				permalink: { type: "string" },
				isYahooFinance: {
					type: "boolean",
					const: !1
				}
			},
			required: [
				"index",
				"name",
				"permalink",
				"isYahooFinance"
			],
			additionalProperties: {}
		},
		SearchNews: {
			type: "object",
			properties: {
				uuid: { type: "string" },
				title: { type: "string" },
				publisher: { type: "string" },
				link: { type: "string" },
				providerPublishTime: {
					type: "string",
					format: "date-time"
				},
				type: { type: "string" },
				thumbnail: {
					type: "object",
					properties: { resolutions: {
						type: "array",
						items: { $ref: "#/definitions/SearchNewsThumbnailResolution" }
					} },
					required: ["resolutions"],
					additionalProperties: !1
				},
				relatedTickers: {
					type: "array",
					items: { type: "string" }
				}
			},
			required: [
				"uuid",
				"title",
				"publisher",
				"link",
				"providerPublishTime",
				"type"
			],
			additionalProperties: {}
		},
		SearchNewsThumbnailResolution: {
			type: "object",
			properties: {
				url: { type: "string" },
				width: { type: "number" },
				height: { type: "number" },
				tag: { type: "string" }
			},
			required: [
				"url",
				"width",
				"height",
				"tag"
			],
			additionalProperties: !1
		},
		SearchResult: {
			type: "object",
			properties: {
				explains: {
					type: "array",
					items: {}
				},
				count: { type: "number" },
				quotes: {
					type: "array",
					items: { anyOf: [
						{ $ref: "#/definitions/SearchQuoteYahooEquity" },
						{ $ref: "#/definitions/SearchQuoteYahooOption" },
						{ $ref: "#/definitions/SearchQuoteYahooETF" },
						{ $ref: "#/definitions/SearchQuoteYahooFund" },
						{ $ref: "#/definitions/SearchQuoteYahooIndex" },
						{ $ref: "#/definitions/SearchQuoteYahooCurrency" },
						{ $ref: "#/definitions/SearchQuoteYahooCryptocurrency" },
						{ $ref: "#/definitions/SearchQuoteNonYahoo" },
						{ $ref: "#/definitions/SearchQuoteYahooFuture" },
						{ $ref: "#/definitions/SearchQuoteYahooMoneyMarket" }
					] }
				},
				news: {
					type: "array",
					items: { $ref: "#/definitions/SearchNews" }
				},
				nav: {
					type: "array",
					items: {}
				},
				lists: {
					type: "array",
					items: {}
				},
				researchReports: {
					type: "array",
					items: {}
				},
				totalTime: { type: "number" },
				screenerFieldResults: {
					type: "array",
					items: {}
				},
				culturalAssets: {
					type: "array",
					items: {}
				},
				timeTakenForQuotes: { type: "number" },
				timeTakenForNews: { type: "number" },
				timeTakenForAlgowatchlist: { type: "number" },
				timeTakenForPredefinedScreener: { type: "number" },
				timeTakenForCrunchbase: { type: "number" },
				timeTakenForNav: { type: "number" },
				timeTakenForResearchReports: { type: "number" },
				timeTakenForScreenerField: { type: "number" },
				timeTakenForCulturalAssets: { type: "number" },
				timeTakenForSearchLists: { type: "number" }
			},
			required: [
				"explains",
				"count",
				"quotes",
				"news",
				"nav",
				"lists",
				"researchReports",
				"totalTime",
				"timeTakenForQuotes",
				"timeTakenForNews",
				"timeTakenForAlgowatchlist",
				"timeTakenForPredefinedScreener",
				"timeTakenForCrunchbase",
				"timeTakenForNav",
				"timeTakenForResearchReports",
				"timeTakenForScreenerField",
				"timeTakenForCulturalAssets",
				"timeTakenForSearchLists"
			],
			additionalProperties: {}
		},
		SearchOptions: {
			type: "object",
			properties: {
				lang: { type: "string" },
				region: { type: "string" },
				quotesCount: { type: "number" },
				newsCount: { type: "number" },
				enableFuzzyQuery: { type: "boolean" },
				quotesQueryId: { type: "string" },
				multiQuoteQueryId: { type: "string" },
				newsQueryId: { type: "string" },
				enableCb: { type: "boolean" },
				enableNavLinks: { type: "boolean" },
				enableEnhancedTrivialQuery: { type: "boolean" }
			},
			additionalProperties: !1
		},
		search: {}
	}
}), Tn = {
	lang: "en-US",
	region: "US",
	quotesCount: 6,
	newsCount: 4,
	enableFuzzyQuery: !1,
	quotesQueryId: "tss_match_phrase_query",
	multiQuoteQueryId: "multi_quote_single_token_query",
	newsQueryId: "news_cie_vespa",
	enableCb: !0,
	enableNavLinks: !0,
	enableEnhancedTrivialQuery: !0
};
function En(e, t, n) {
	return this._moduleExec({
		moduleName: "search",
		query: {
			url: "https://${YF_QUERY_HOST}/v1/finance/search",
			definitions: wn,
			schemaKey: "#/definitions/SearchOptions",
			defaults: Tn,
			runtime: { q: e },
			overrides: t
		},
		result: {
			definitions: wn,
			schemaKey: "#/definitions/SearchResult"
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/trendingSymbols.js
var Dn = K({
	$schema: "http://json-schema.org/draft-07/schema#",
	$comment: "DO NOT EDIT THIS FILE.  It is generated automatically from typescript interfaces in the project.  To update, run `deno task schema` (with optional `--watch`).  In VSCode, this is run automatically for you on folder open.",
	definitions: {
		TrendingSymbol: {
			type: "object",
			properties: { symbol: { type: "string" } },
			required: ["symbol"],
			additionalProperties: {}
		},
		TrendingSymbolsResult: {
			type: "object",
			properties: {
				count: { type: "number" },
				quotes: {
					type: "array",
					items: { $ref: "#/definitions/TrendingSymbol" }
				},
				jobTimestamp: { type: "number" },
				startInterval: { type: "number" }
			},
			required: [
				"count",
				"quotes",
				"jobTimestamp",
				"startInterval"
			],
			additionalProperties: {}
		},
		TrendingSymbolsOptions: {
			type: "object",
			properties: {
				lang: { type: "string" },
				region: { type: "string" },
				count: { type: "number" }
			},
			additionalProperties: !1
		},
		trendingSymbols: {}
	}
}), On = {
	lang: "en-US",
	count: 5
};
function kn(e, t, n) {
	return this._moduleExec({
		moduleName: "trendingSymbols",
		query: {
			url: "https://${YF_QUERY_HOST}/v1/finance/trending/" + e,
			definitions: Dn,
			schemaKey: "#/definitions/TrendingSymbolsOptions",
			defaults: On,
			overrides: t
		},
		result: {
			definitions: Dn,
			schemaKey: "#/definitions/TrendingSymbolsResult",
			transformWith(e) {
				if (!e.finance) throw Error("Unexpected result: " + JSON.stringify(e));
				return e.finance.result[0];
			}
		},
		moduleOptions: n
	});
}
//#endregion
//#region node_modules/yahoo-finance2/esm/src/modules/index.js
var An = /* @__PURE__ */ n({
	autoc: () => Rt,
	chart: () => Ht,
	dailyGainers: () => Ut,
	dailyLosers: () => Wt,
	fundamentalsTimeSeries: () => Xt,
	historical: () => rn,
	insights: () => sn,
	options: () => un,
	quote: () => wt,
	quoteSummary: () => _n,
	recommendationsBySymbol: () => bn,
	screener: () => Cn,
	search: () => En,
	trendingSymbols: () => kn
}), jn = /* @__PURE__ */ n({ quoteCombine: () => Dt }), Mn = Lt({ modules: {
	...An,
	...jn
} });
//#endregion
export { Mn as default };
