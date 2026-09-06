var _l = { exports: {} }, ji = {}, zl = { exports: {} }, pe = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var uh;
function Gg() {
  if (uh) return pe;
  uh = 1;
  var n = Symbol.for("react.element"), r = Symbol.for("react.portal"), o = Symbol.for("react.fragment"), a = Symbol.for("react.strict_mode"), u = Symbol.for("react.profiler"), d = Symbol.for("react.provider"), f = Symbol.for("react.context"), h = Symbol.for("react.forward_ref"), g = Symbol.for("react.suspense"), v = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), x = Symbol.iterator;
  function S(T) {
    return T === null || typeof T != "object" ? null : (T = x && T[x] || T["@@iterator"], typeof T == "function" ? T : null);
  }
  var A = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, E = Object.assign, D = {};
  function L(T, _, de) {
    this.props = T, this.context = _, this.refs = D, this.updater = de || A;
  }
  L.prototype.isReactComponent = {}, L.prototype.setState = function(T, _) {
    if (typeof T != "object" && typeof T != "function" && T != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, T, _, "setState");
  }, L.prototype.forceUpdate = function(T) {
    this.updater.enqueueForceUpdate(this, T, "forceUpdate");
  };
  function V() {
  }
  V.prototype = L.prototype;
  function N(T, _, de) {
    this.props = T, this.context = _, this.refs = D, this.updater = de || A;
  }
  var z = N.prototype = new V();
  z.constructor = N, E(z, L.prototype), z.isPureReactComponent = !0;
  var b = Array.isArray, ee = Object.prototype.hasOwnProperty, Z = { current: null }, te = { key: !0, ref: !0, __self: !0, __source: !0 };
  function W(T, _, de) {
    var he, ve = {}, G = null, re = null;
    if (_ != null) for (he in _.ref !== void 0 && (re = _.ref), _.key !== void 0 && (G = "" + _.key), _) ee.call(_, he) && !te.hasOwnProperty(he) && (ve[he] = _[he]);
    var fe = arguments.length - 2;
    if (fe === 1) ve.children = de;
    else if (1 < fe) {
      for (var ke = Array(fe), nt = 0; nt < fe; nt++) ke[nt] = arguments[nt + 2];
      ve.children = ke;
    }
    if (T && T.defaultProps) for (he in fe = T.defaultProps, fe) ve[he] === void 0 && (ve[he] = fe[he]);
    return { $$typeof: n, type: T, key: G, ref: re, props: ve, _owner: Z.current };
  }
  function ae(T, _) {
    return { $$typeof: n, type: T.type, key: _, ref: T.ref, props: T.props, _owner: T._owner };
  }
  function K(T) {
    return typeof T == "object" && T !== null && T.$$typeof === n;
  }
  function ye(T) {
    var _ = { "=": "=0", ":": "=2" };
    return "$" + T.replace(/[=:]/g, function(de) {
      return _[de];
    });
  }
  var ge = /\/+/g;
  function ie(T, _) {
    return typeof T == "object" && T !== null && T.key != null ? ye("" + T.key) : _.toString(36);
  }
  function ue(T, _, de, he, ve) {
    var G = typeof T;
    (G === "undefined" || G === "boolean") && (T = null);
    var re = !1;
    if (T === null) re = !0;
    else switch (G) {
      case "string":
      case "number":
        re = !0;
        break;
      case "object":
        switch (T.$$typeof) {
          case n:
          case r:
            re = !0;
        }
    }
    if (re) return re = T, ve = ve(re), T = he === "" ? "." + ie(re, 0) : he, b(ve) ? (de = "", T != null && (de = T.replace(ge, "$&/") + "/"), ue(ve, _, de, "", function(nt) {
      return nt;
    })) : ve != null && (K(ve) && (ve = ae(ve, de + (!ve.key || re && re.key === ve.key ? "" : ("" + ve.key).replace(ge, "$&/") + "/") + T)), _.push(ve)), 1;
    if (re = 0, he = he === "" ? "." : he + ":", b(T)) for (var fe = 0; fe < T.length; fe++) {
      G = T[fe];
      var ke = he + ie(G, fe);
      re += ue(G, _, de, ke, ve);
    }
    else if (ke = S(T), typeof ke == "function") for (T = ke.call(T), fe = 0; !(G = T.next()).done; ) G = G.value, ke = he + ie(G, fe++), re += ue(G, _, de, ke, ve);
    else if (G === "object") throw _ = String(T), Error("Objects are not valid as a React child (found: " + (_ === "[object Object]" ? "object with keys {" + Object.keys(T).join(", ") + "}" : _) + "). If you meant to render a collection of children, use an array instead.");
    return re;
  }
  function we(T, _, de) {
    if (T == null) return T;
    var he = [], ve = 0;
    return ue(T, he, "", "", function(G) {
      return _.call(de, G, ve++);
    }), he;
  }
  function Te(T) {
    if (T._status === -1) {
      var _ = T._result;
      _ = _(), _.then(function(de) {
        (T._status === 0 || T._status === -1) && (T._status = 1, T._result = de);
      }, function(de) {
        (T._status === 0 || T._status === -1) && (T._status = 2, T._result = de);
      }), T._status === -1 && (T._status = 0, T._result = _);
    }
    if (T._status === 1) return T._result.default;
    throw T._result;
  }
  var je = { current: null }, B = { transition: null }, X = { ReactCurrentDispatcher: je, ReactCurrentBatchConfig: B, ReactCurrentOwner: Z };
  function U() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return pe.Children = { map: we, forEach: function(T, _, de) {
    we(T, function() {
      _.apply(this, arguments);
    }, de);
  }, count: function(T) {
    var _ = 0;
    return we(T, function() {
      _++;
    }), _;
  }, toArray: function(T) {
    return we(T, function(_) {
      return _;
    }) || [];
  }, only: function(T) {
    if (!K(T)) throw Error("React.Children.only expected to receive a single React element child.");
    return T;
  } }, pe.Component = L, pe.Fragment = o, pe.Profiler = u, pe.PureComponent = N, pe.StrictMode = a, pe.Suspense = g, pe.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = X, pe.act = U, pe.cloneElement = function(T, _, de) {
    if (T == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + T + ".");
    var he = E({}, T.props), ve = T.key, G = T.ref, re = T._owner;
    if (_ != null) {
      if (_.ref !== void 0 && (G = _.ref, re = Z.current), _.key !== void 0 && (ve = "" + _.key), T.type && T.type.defaultProps) var fe = T.type.defaultProps;
      for (ke in _) ee.call(_, ke) && !te.hasOwnProperty(ke) && (he[ke] = _[ke] === void 0 && fe !== void 0 ? fe[ke] : _[ke]);
    }
    var ke = arguments.length - 2;
    if (ke === 1) he.children = de;
    else if (1 < ke) {
      fe = Array(ke);
      for (var nt = 0; nt < ke; nt++) fe[nt] = arguments[nt + 2];
      he.children = fe;
    }
    return { $$typeof: n, type: T.type, key: ve, ref: G, props: he, _owner: re };
  }, pe.createContext = function(T) {
    return T = { $$typeof: f, _currentValue: T, _currentValue2: T, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, T.Provider = { $$typeof: d, _context: T }, T.Consumer = T;
  }, pe.createElement = W, pe.createFactory = function(T) {
    var _ = W.bind(null, T);
    return _.type = T, _;
  }, pe.createRef = function() {
    return { current: null };
  }, pe.forwardRef = function(T) {
    return { $$typeof: h, render: T };
  }, pe.isValidElement = K, pe.lazy = function(T) {
    return { $$typeof: y, _payload: { _status: -1, _result: T }, _init: Te };
  }, pe.memo = function(T, _) {
    return { $$typeof: v, type: T, compare: _ === void 0 ? null : _ };
  }, pe.startTransition = function(T) {
    var _ = B.transition;
    B.transition = {};
    try {
      T();
    } finally {
      B.transition = _;
    }
  }, pe.unstable_act = U, pe.useCallback = function(T, _) {
    return je.current.useCallback(T, _);
  }, pe.useContext = function(T) {
    return je.current.useContext(T);
  }, pe.useDebugValue = function() {
  }, pe.useDeferredValue = function(T) {
    return je.current.useDeferredValue(T);
  }, pe.useEffect = function(T, _) {
    return je.current.useEffect(T, _);
  }, pe.useId = function() {
    return je.current.useId();
  }, pe.useImperativeHandle = function(T, _, de) {
    return je.current.useImperativeHandle(T, _, de);
  }, pe.useInsertionEffect = function(T, _) {
    return je.current.useInsertionEffect(T, _);
  }, pe.useLayoutEffect = function(T, _) {
    return je.current.useLayoutEffect(T, _);
  }, pe.useMemo = function(T, _) {
    return je.current.useMemo(T, _);
  }, pe.useReducer = function(T, _, de) {
    return je.current.useReducer(T, _, de);
  }, pe.useRef = function(T) {
    return je.current.useRef(T);
  }, pe.useState = function(T) {
    return je.current.useState(T);
  }, pe.useSyncExternalStore = function(T, _, de) {
    return je.current.useSyncExternalStore(T, _, de);
  }, pe.useTransition = function() {
    return je.current.useTransition();
  }, pe.version = "18.3.1", pe;
}
var ch;
function _u() {
  return ch || (ch = 1, zl.exports = Gg()), zl.exports;
}
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var fh;
function Yg() {
  if (fh) return ji;
  fh = 1;
  var n = _u(), r = Symbol.for("react.element"), o = Symbol.for("react.fragment"), a = Object.prototype.hasOwnProperty, u = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, d = { key: !0, ref: !0, __self: !0, __source: !0 };
  function f(h, g, v) {
    var y, x = {}, S = null, A = null;
    v !== void 0 && (S = "" + v), g.key !== void 0 && (S = "" + g.key), g.ref !== void 0 && (A = g.ref);
    for (y in g) a.call(g, y) && !d.hasOwnProperty(y) && (x[y] = g[y]);
    if (h && h.defaultProps) for (y in g = h.defaultProps, g) x[y] === void 0 && (x[y] = g[y]);
    return { $$typeof: r, type: h, key: S, ref: A, props: x, _owner: u.current };
  }
  return ji.Fragment = o, ji.jsx = f, ji.jsxs = f, ji;
}
var dh;
function Xg() {
  return dh || (dh = 1, _l.exports = Yg()), _l.exports;
}
var m = Xg(), is = {}, Il = { exports: {} }, dt = {}, Fl = { exports: {} }, bl = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var hh;
function Qg() {
  return hh || (hh = 1, (function(n) {
    function r(B, X) {
      var U = B.length;
      B.push(X);
      e: for (; 0 < U; ) {
        var T = U - 1 >>> 1, _ = B[T];
        if (0 < u(_, X)) B[T] = X, B[U] = _, U = T;
        else break e;
      }
    }
    function o(B) {
      return B.length === 0 ? null : B[0];
    }
    function a(B) {
      if (B.length === 0) return null;
      var X = B[0], U = B.pop();
      if (U !== X) {
        B[0] = U;
        e: for (var T = 0, _ = B.length, de = _ >>> 1; T < de; ) {
          var he = 2 * (T + 1) - 1, ve = B[he], G = he + 1, re = B[G];
          if (0 > u(ve, U)) G < _ && 0 > u(re, ve) ? (B[T] = re, B[G] = U, T = G) : (B[T] = ve, B[he] = U, T = he);
          else if (G < _ && 0 > u(re, U)) B[T] = re, B[G] = U, T = G;
          else break e;
        }
      }
      return X;
    }
    function u(B, X) {
      var U = B.sortIndex - X.sortIndex;
      return U !== 0 ? U : B.id - X.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var d = performance;
      n.unstable_now = function() {
        return d.now();
      };
    } else {
      var f = Date, h = f.now();
      n.unstable_now = function() {
        return f.now() - h;
      };
    }
    var g = [], v = [], y = 1, x = null, S = 3, A = !1, E = !1, D = !1, L = typeof setTimeout == "function" ? setTimeout : null, V = typeof clearTimeout == "function" ? clearTimeout : null, N = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function z(B) {
      for (var X = o(v); X !== null; ) {
        if (X.callback === null) a(v);
        else if (X.startTime <= B) a(v), X.sortIndex = X.expirationTime, r(g, X);
        else break;
        X = o(v);
      }
    }
    function b(B) {
      if (D = !1, z(B), !E) if (o(g) !== null) E = !0, Te(ee);
      else {
        var X = o(v);
        X !== null && je(b, X.startTime - B);
      }
    }
    function ee(B, X) {
      E = !1, D && (D = !1, V(W), W = -1), A = !0;
      var U = S;
      try {
        for (z(X), x = o(g); x !== null && (!(x.expirationTime > X) || B && !ye()); ) {
          var T = x.callback;
          if (typeof T == "function") {
            x.callback = null, S = x.priorityLevel;
            var _ = T(x.expirationTime <= X);
            X = n.unstable_now(), typeof _ == "function" ? x.callback = _ : x === o(g) && a(g), z(X);
          } else a(g);
          x = o(g);
        }
        if (x !== null) var de = !0;
        else {
          var he = o(v);
          he !== null && je(b, he.startTime - X), de = !1;
        }
        return de;
      } finally {
        x = null, S = U, A = !1;
      }
    }
    var Z = !1, te = null, W = -1, ae = 5, K = -1;
    function ye() {
      return !(n.unstable_now() - K < ae);
    }
    function ge() {
      if (te !== null) {
        var B = n.unstable_now();
        K = B;
        var X = !0;
        try {
          X = te(!0, B);
        } finally {
          X ? ie() : (Z = !1, te = null);
        }
      } else Z = !1;
    }
    var ie;
    if (typeof N == "function") ie = function() {
      N(ge);
    };
    else if (typeof MessageChannel < "u") {
      var ue = new MessageChannel(), we = ue.port2;
      ue.port1.onmessage = ge, ie = function() {
        we.postMessage(null);
      };
    } else ie = function() {
      L(ge, 0);
    };
    function Te(B) {
      te = B, Z || (Z = !0, ie());
    }
    function je(B, X) {
      W = L(function() {
        B(n.unstable_now());
      }, X);
    }
    n.unstable_IdlePriority = 5, n.unstable_ImmediatePriority = 1, n.unstable_LowPriority = 4, n.unstable_NormalPriority = 3, n.unstable_Profiling = null, n.unstable_UserBlockingPriority = 2, n.unstable_cancelCallback = function(B) {
      B.callback = null;
    }, n.unstable_continueExecution = function() {
      E || A || (E = !0, Te(ee));
    }, n.unstable_forceFrameRate = function(B) {
      0 > B || 125 < B ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ae = 0 < B ? Math.floor(1e3 / B) : 5;
    }, n.unstable_getCurrentPriorityLevel = function() {
      return S;
    }, n.unstable_getFirstCallbackNode = function() {
      return o(g);
    }, n.unstable_next = function(B) {
      switch (S) {
        case 1:
        case 2:
        case 3:
          var X = 3;
          break;
        default:
          X = S;
      }
      var U = S;
      S = X;
      try {
        return B();
      } finally {
        S = U;
      }
    }, n.unstable_pauseExecution = function() {
    }, n.unstable_requestPaint = function() {
    }, n.unstable_runWithPriority = function(B, X) {
      switch (B) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          B = 3;
      }
      var U = S;
      S = B;
      try {
        return X();
      } finally {
        S = U;
      }
    }, n.unstable_scheduleCallback = function(B, X, U) {
      var T = n.unstable_now();
      switch (typeof U == "object" && U !== null ? (U = U.delay, U = typeof U == "number" && 0 < U ? T + U : T) : U = T, B) {
        case 1:
          var _ = -1;
          break;
        case 2:
          _ = 250;
          break;
        case 5:
          _ = 1073741823;
          break;
        case 4:
          _ = 1e4;
          break;
        default:
          _ = 5e3;
      }
      return _ = U + _, B = { id: y++, callback: X, priorityLevel: B, startTime: U, expirationTime: _, sortIndex: -1 }, U > T ? (B.sortIndex = U, r(v, B), o(g) === null && B === o(v) && (D ? (V(W), W = -1) : D = !0, je(b, U - T))) : (B.sortIndex = _, r(g, B), E || A || (E = !0, Te(ee))), B;
    }, n.unstable_shouldYield = ye, n.unstable_wrapCallback = function(B) {
      var X = S;
      return function() {
        var U = S;
        S = X;
        try {
          return B.apply(this, arguments);
        } finally {
          S = U;
        }
      };
    };
  })(bl)), bl;
}
var ph;
function qg() {
  return ph || (ph = 1, Fl.exports = Qg()), Fl.exports;
}
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mh;
function Zg() {
  if (mh) return dt;
  mh = 1;
  var n = _u(), r = qg();
  function o(e) {
    for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, i = 1; i < arguments.length; i++) t += "&args[]=" + encodeURIComponent(arguments[i]);
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var a = /* @__PURE__ */ new Set(), u = {};
  function d(e, t) {
    f(e, t), f(e + "Capture", t);
  }
  function f(e, t) {
    for (u[e] = t, e = 0; e < t.length; e++) a.add(t[e]);
  }
  var h = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), g = Object.prototype.hasOwnProperty, v = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, y = {}, x = {};
  function S(e) {
    return g.call(x, e) ? !0 : g.call(y, e) ? !1 : v.test(e) ? x[e] = !0 : (y[e] = !0, !1);
  }
  function A(e, t, i, s) {
    if (i !== null && i.type === 0) return !1;
    switch (typeof t) {
      case "function":
      case "symbol":
        return !0;
      case "boolean":
        return s ? !1 : i !== null ? !i.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
      default:
        return !1;
    }
  }
  function E(e, t, i, s) {
    if (t === null || typeof t > "u" || A(e, t, i, s)) return !0;
    if (s) return !1;
    if (i !== null) switch (i.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
    return !1;
  }
  function D(e, t, i, s, l, c, p) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = s, this.attributeNamespace = l, this.mustUseProperty = i, this.propertyName = e, this.type = t, this.sanitizeURL = c, this.removeEmptyString = p;
  }
  var L = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
    L[e] = new D(e, 0, !1, e, null, !1, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
    var t = e[0];
    L[t] = new D(t, 1, !1, e[1], null, !1, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
    L[e] = new D(e, 2, !1, e.toLowerCase(), null, !1, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
    L[e] = new D(e, 2, !1, e, null, !1, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
    L[e] = new D(e, 3, !1, e.toLowerCase(), null, !1, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
    L[e] = new D(e, 3, !0, e, null, !1, !1);
  }), ["capture", "download"].forEach(function(e) {
    L[e] = new D(e, 4, !1, e, null, !1, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(e) {
    L[e] = new D(e, 6, !1, e, null, !1, !1);
  }), ["rowSpan", "start"].forEach(function(e) {
    L[e] = new D(e, 5, !1, e.toLowerCase(), null, !1, !1);
  });
  var V = /[\-:]([a-z])/g;
  function N(e) {
    return e[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
    var t = e.replace(
      V,
      N
    );
    L[t] = new D(t, 1, !1, e, null, !1, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
    var t = e.replace(V, N);
    L[t] = new D(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
    var t = e.replace(V, N);
    L[t] = new D(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(e) {
    L[e] = new D(e, 1, !1, e.toLowerCase(), null, !1, !1);
  }), L.xlinkHref = new D("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), ["src", "href", "action", "formAction"].forEach(function(e) {
    L[e] = new D(e, 1, !1, e.toLowerCase(), null, !0, !0);
  });
  function z(e, t, i, s) {
    var l = L.hasOwnProperty(t) ? L[t] : null;
    (l !== null ? l.type !== 0 : s || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (E(t, i, l, s) && (i = null), s || l === null ? S(t) && (i === null ? e.removeAttribute(t) : e.setAttribute(t, "" + i)) : l.mustUseProperty ? e[l.propertyName] = i === null ? l.type === 3 ? !1 : "" : i : (t = l.attributeName, s = l.attributeNamespace, i === null ? e.removeAttribute(t) : (l = l.type, i = l === 3 || l === 4 && i === !0 ? "" : "" + i, s ? e.setAttributeNS(s, t, i) : e.setAttribute(t, i))));
  }
  var b = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ee = Symbol.for("react.element"), Z = Symbol.for("react.portal"), te = Symbol.for("react.fragment"), W = Symbol.for("react.strict_mode"), ae = Symbol.for("react.profiler"), K = Symbol.for("react.provider"), ye = Symbol.for("react.context"), ge = Symbol.for("react.forward_ref"), ie = Symbol.for("react.suspense"), ue = Symbol.for("react.suspense_list"), we = Symbol.for("react.memo"), Te = Symbol.for("react.lazy"), je = Symbol.for("react.offscreen"), B = Symbol.iterator;
  function X(e) {
    return e === null || typeof e != "object" ? null : (e = B && e[B] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var U = Object.assign, T;
  function _(e) {
    if (T === void 0) try {
      throw Error();
    } catch (i) {
      var t = i.stack.trim().match(/\n( *(at )?)/);
      T = t && t[1] || "";
    }
    return `
` + T + e;
  }
  var de = !1;
  function he(e, t) {
    if (!e || de) return "";
    de = !0;
    var i = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (t) if (t = function() {
        throw Error();
      }, Object.defineProperty(t.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(t, []);
        } catch (R) {
          var s = R;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (R) {
          s = R;
        }
        e.call(t.prototype);
      }
      else {
        try {
          throw Error();
        } catch (R) {
          s = R;
        }
        e();
      }
    } catch (R) {
      if (R && s && typeof R.stack == "string") {
        for (var l = R.stack.split(`
`), c = s.stack.split(`
`), p = l.length - 1, w = c.length - 1; 1 <= p && 0 <= w && l[p] !== c[w]; ) w--;
        for (; 1 <= p && 0 <= w; p--, w--) if (l[p] !== c[w]) {
          if (p !== 1 || w !== 1)
            do
              if (p--, w--, 0 > w || l[p] !== c[w]) {
                var k = `
` + l[p].replace(" at new ", " at ");
                return e.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", e.displayName)), k;
              }
            while (1 <= p && 0 <= w);
          break;
        }
      }
    } finally {
      de = !1, Error.prepareStackTrace = i;
    }
    return (e = e ? e.displayName || e.name : "") ? _(e) : "";
  }
  function ve(e) {
    switch (e.tag) {
      case 5:
        return _(e.type);
      case 16:
        return _("Lazy");
      case 13:
        return _("Suspense");
      case 19:
        return _("SuspenseList");
      case 0:
      case 2:
      case 15:
        return e = he(e.type, !1), e;
      case 11:
        return e = he(e.type.render, !1), e;
      case 1:
        return e = he(e.type, !0), e;
      default:
        return "";
    }
  }
  function G(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case te:
        return "Fragment";
      case Z:
        return "Portal";
      case ae:
        return "Profiler";
      case W:
        return "StrictMode";
      case ie:
        return "Suspense";
      case ue:
        return "SuspenseList";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case ye:
        return (e.displayName || "Context") + ".Consumer";
      case K:
        return (e._context.displayName || "Context") + ".Provider";
      case ge:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case we:
        return t = e.displayName || null, t !== null ? t : G(e.type) || "Memo";
      case Te:
        t = e._payload, e = e._init;
        try {
          return G(e(t));
        } catch {
        }
    }
    return null;
  }
  function re(e) {
    var t = e.type;
    switch (e.tag) {
      case 24:
        return "Cache";
      case 9:
        return (t.displayName || "Context") + ".Consumer";
      case 10:
        return (t._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return t;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return G(t);
      case 8:
        return t === W ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof t == "function") return t.displayName || t.name || null;
        if (typeof t == "string") return t;
    }
    return null;
  }
  function fe(e) {
    switch (typeof e) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return e;
      case "object":
        return e;
      default:
        return "";
    }
  }
  function ke(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function nt(e) {
    var t = ke(e) ? "checked" : "value", i = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), s = "" + e[t];
    if (!e.hasOwnProperty(t) && typeof i < "u" && typeof i.get == "function" && typeof i.set == "function") {
      var l = i.get, c = i.set;
      return Object.defineProperty(e, t, { configurable: !0, get: function() {
        return l.call(this);
      }, set: function(p) {
        s = "" + p, c.call(this, p);
      } }), Object.defineProperty(e, t, { enumerable: i.enumerable }), { getValue: function() {
        return s;
      }, setValue: function(p) {
        s = "" + p;
      }, stopTracking: function() {
        e._valueTracker = null, delete e[t];
      } };
    }
  }
  function ir(e) {
    e._valueTracker || (e._valueTracker = nt(e));
  }
  function Br(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var i = t.getValue(), s = "";
    return e && (s = ke(e) ? e.checked ? "true" : "false" : e.value), e = s, e !== i ? (t.setValue(e), !0) : !1;
  }
  function Yi(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function $s(e, t) {
    var i = t.checked;
    return U({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: i ?? e._wrapperState.initialChecked });
  }
  function mc(e, t) {
    var i = t.defaultValue == null ? "" : t.defaultValue, s = t.checked != null ? t.checked : t.defaultChecked;
    i = fe(t.value != null ? t.value : i), e._wrapperState = { initialChecked: s, initialValue: i, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
  }
  function yc(e, t) {
    t = t.checked, t != null && z(e, "checked", t, !1);
  }
  function Ws(e, t) {
    yc(e, t);
    var i = fe(t.value), s = t.type;
    if (i != null) s === "number" ? (i === 0 && e.value === "" || e.value != i) && (e.value = "" + i) : e.value !== "" + i && (e.value = "" + i);
    else if (s === "submit" || s === "reset") {
      e.removeAttribute("value");
      return;
    }
    t.hasOwnProperty("value") ? Us(e, t.type, i) : t.hasOwnProperty("defaultValue") && Us(e, t.type, fe(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function gc(e, t, i) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
      var s = t.type;
      if (!(s !== "submit" && s !== "reset" || t.value !== void 0 && t.value !== null)) return;
      t = "" + e._wrapperState.initialValue, i || t === e.value || (e.value = t), e.defaultValue = t;
    }
    i = e.name, i !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, i !== "" && (e.name = i);
  }
  function Us(e, t, i) {
    (t !== "number" || Yi(e.ownerDocument) !== e) && (i == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + i && (e.defaultValue = "" + i));
  }
  var $r = Array.isArray;
  function or(e, t, i, s) {
    if (e = e.options, t) {
      t = {};
      for (var l = 0; l < i.length; l++) t["$" + i[l]] = !0;
      for (i = 0; i < e.length; i++) l = t.hasOwnProperty("$" + e[i].value), e[i].selected !== l && (e[i].selected = l), l && s && (e[i].defaultSelected = !0);
    } else {
      for (i = "" + fe(i), t = null, l = 0; l < e.length; l++) {
        if (e[l].value === i) {
          e[l].selected = !0, s && (e[l].defaultSelected = !0);
          return;
        }
        t !== null || e[l].disabled || (t = e[l]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Hs(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(o(91));
    return U({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
  }
  function vc(e, t) {
    var i = t.value;
    if (i == null) {
      if (i = t.children, t = t.defaultValue, i != null) {
        if (t != null) throw Error(o(92));
        if ($r(i)) {
          if (1 < i.length) throw Error(o(93));
          i = i[0];
        }
        t = i;
      }
      t == null && (t = ""), i = t;
    }
    e._wrapperState = { initialValue: fe(i) };
  }
  function xc(e, t) {
    var i = fe(t.value), s = fe(t.defaultValue);
    i != null && (i = "" + i, i !== e.value && (e.value = i), t.defaultValue == null && e.defaultValue !== i && (e.defaultValue = i)), s != null && (e.defaultValue = "" + s);
  }
  function wc(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
  }
  function Sc(e) {
    switch (e) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Ks(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml" ? Sc(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
  }
  var Xi, kc = (function(e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, i, s, l) {
      MSApp.execUnsafeLocalFunction(function() {
        return e(t, i, s, l);
      });
    } : e;
  })(function(e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
    else {
      for (Xi = Xi || document.createElement("div"), Xi.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Xi.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
  function Wr(e, t) {
    if (t) {
      var i = e.firstChild;
      if (i && i === e.lastChild && i.nodeType === 3) {
        i.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Ur = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
  }, q0 = ["Webkit", "ms", "Moz", "O"];
  Object.keys(Ur).forEach(function(e) {
    q0.forEach(function(t) {
      t = t + e.charAt(0).toUpperCase() + e.substring(1), Ur[t] = Ur[e];
    });
  });
  function Cc(e, t, i) {
    return t == null || typeof t == "boolean" || t === "" ? "" : i || typeof t != "number" || t === 0 || Ur.hasOwnProperty(e) && Ur[e] ? ("" + t).trim() : t + "px";
  }
  function Tc(e, t) {
    e = e.style;
    for (var i in t) if (t.hasOwnProperty(i)) {
      var s = i.indexOf("--") === 0, l = Cc(i, t[i], s);
      i === "float" && (i = "cssFloat"), s ? e.setProperty(i, l) : e[i] = l;
    }
  }
  var Z0 = U({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Gs(e, t) {
    if (t) {
      if (Z0[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(o(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(o(60));
        if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(o(61));
      }
      if (t.style != null && typeof t.style != "object") throw Error(o(62));
    }
  }
  function Ys(e, t) {
    if (e.indexOf("-") === -1) return typeof t.is == "string";
    switch (e) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Xs = null;
  function Qs(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var qs = null, sr = null, ar = null;
  function Pc(e) {
    if (e = di(e)) {
      if (typeof qs != "function") throw Error(o(280));
      var t = e.stateNode;
      t && (t = xo(t), qs(e.stateNode, e.type, t));
    }
  }
  function Ec(e) {
    sr ? ar ? ar.push(e) : ar = [e] : sr = e;
  }
  function jc() {
    if (sr) {
      var e = sr, t = ar;
      if (ar = sr = null, Pc(e), t) for (e = 0; e < t.length; e++) Pc(t[e]);
    }
  }
  function Rc(e, t) {
    return e(t);
  }
  function Mc() {
  }
  var Zs = !1;
  function Ac(e, t, i) {
    if (Zs) return e(t, i);
    Zs = !0;
    try {
      return Rc(e, t, i);
    } finally {
      Zs = !1, (sr !== null || ar !== null) && (Mc(), jc());
    }
  }
  function Hr(e, t) {
    var i = e.stateNode;
    if (i === null) return null;
    var s = xo(i);
    if (s === null) return null;
    i = s[t];
    e: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (s = !s.disabled) || (e = e.type, s = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !s;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (i && typeof i != "function") throw Error(o(231, t, typeof i));
    return i;
  }
  var Js = !1;
  if (h) try {
    var Kr = {};
    Object.defineProperty(Kr, "passive", { get: function() {
      Js = !0;
    } }), window.addEventListener("test", Kr, Kr), window.removeEventListener("test", Kr, Kr);
  } catch {
    Js = !1;
  }
  function J0(e, t, i, s, l, c, p, w, k) {
    var R = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(i, R);
    } catch (F) {
      this.onError(F);
    }
  }
  var Gr = !1, Qi = null, qi = !1, ea = null, ey = { onError: function(e) {
    Gr = !0, Qi = e;
  } };
  function ty(e, t, i, s, l, c, p, w, k) {
    Gr = !1, Qi = null, J0.apply(ey, arguments);
  }
  function ny(e, t, i, s, l, c, p, w, k) {
    if (ty.apply(this, arguments), Gr) {
      if (Gr) {
        var R = Qi;
        Gr = !1, Qi = null;
      } else throw Error(o(198));
      qi || (qi = !0, ea = R);
    }
  }
  function _n(e) {
    var t = e, i = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (i = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? i : null;
  }
  function Dc(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function Lc(e) {
    if (_n(e) !== e) throw Error(o(188));
  }
  function ry(e) {
    var t = e.alternate;
    if (!t) {
      if (t = _n(e), t === null) throw Error(o(188));
      return t !== e ? null : e;
    }
    for (var i = e, s = t; ; ) {
      var l = i.return;
      if (l === null) break;
      var c = l.alternate;
      if (c === null) {
        if (s = l.return, s !== null) {
          i = s;
          continue;
        }
        break;
      }
      if (l.child === c.child) {
        for (c = l.child; c; ) {
          if (c === i) return Lc(l), e;
          if (c === s) return Lc(l), t;
          c = c.sibling;
        }
        throw Error(o(188));
      }
      if (i.return !== s.return) i = l, s = c;
      else {
        for (var p = !1, w = l.child; w; ) {
          if (w === i) {
            p = !0, i = l, s = c;
            break;
          }
          if (w === s) {
            p = !0, s = l, i = c;
            break;
          }
          w = w.sibling;
        }
        if (!p) {
          for (w = c.child; w; ) {
            if (w === i) {
              p = !0, i = c, s = l;
              break;
            }
            if (w === s) {
              p = !0, s = c, i = l;
              break;
            }
            w = w.sibling;
          }
          if (!p) throw Error(o(189));
        }
      }
      if (i.alternate !== s) throw Error(o(190));
    }
    if (i.tag !== 3) throw Error(o(188));
    return i.stateNode.current === i ? e : t;
  }
  function Vc(e) {
    return e = ry(e), e !== null ? Nc(e) : null;
  }
  function Nc(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = Nc(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var _c = r.unstable_scheduleCallback, zc = r.unstable_cancelCallback, iy = r.unstable_shouldYield, oy = r.unstable_requestPaint, Ie = r.unstable_now, sy = r.unstable_getCurrentPriorityLevel, ta = r.unstable_ImmediatePriority, Ic = r.unstable_UserBlockingPriority, Zi = r.unstable_NormalPriority, ay = r.unstable_LowPriority, Fc = r.unstable_IdlePriority, Ji = null, bt = null;
  function ly(e) {
    if (bt && typeof bt.onCommitFiberRoot == "function") try {
      bt.onCommitFiberRoot(Ji, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
  }
  var Mt = Math.clz32 ? Math.clz32 : fy, uy = Math.log, cy = Math.LN2;
  function fy(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (uy(e) / cy | 0) | 0;
  }
  var eo = 64, to = 4194304;
  function Yr(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function no(e, t) {
    var i = e.pendingLanes;
    if (i === 0) return 0;
    var s = 0, l = e.suspendedLanes, c = e.pingedLanes, p = i & 268435455;
    if (p !== 0) {
      var w = p & ~l;
      w !== 0 ? s = Yr(w) : (c &= p, c !== 0 && (s = Yr(c)));
    } else p = i & ~l, p !== 0 ? s = Yr(p) : c !== 0 && (s = Yr(c));
    if (s === 0) return 0;
    if (t !== 0 && t !== s && (t & l) === 0 && (l = s & -s, c = t & -t, l >= c || l === 16 && (c & 4194240) !== 0)) return t;
    if ((s & 4) !== 0 && (s |= i & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= s; 0 < t; ) i = 31 - Mt(t), l = 1 << i, s |= e[i], t &= ~l;
    return s;
  }
  function dy(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function hy(e, t) {
    for (var i = e.suspendedLanes, s = e.pingedLanes, l = e.expirationTimes, c = e.pendingLanes; 0 < c; ) {
      var p = 31 - Mt(c), w = 1 << p, k = l[p];
      k === -1 ? ((w & i) === 0 || (w & s) !== 0) && (l[p] = dy(w, t)) : k <= t && (e.expiredLanes |= w), c &= ~w;
    }
  }
  function na(e) {
    return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function bc() {
    var e = eo;
    return eo <<= 1, (eo & 4194240) === 0 && (eo = 64), e;
  }
  function ra(e) {
    for (var t = [], i = 0; 31 > i; i++) t.push(e);
    return t;
  }
  function Xr(e, t, i) {
    e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Mt(t), e[t] = i;
  }
  function py(e, t) {
    var i = e.pendingLanes & ~t;
    e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
    var s = e.eventTimes;
    for (e = e.expirationTimes; 0 < i; ) {
      var l = 31 - Mt(i), c = 1 << l;
      t[l] = 0, s[l] = -1, e[l] = -1, i &= ~c;
    }
  }
  function ia(e, t) {
    var i = e.entangledLanes |= t;
    for (e = e.entanglements; i; ) {
      var s = 31 - Mt(i), l = 1 << s;
      l & t | e[s] & t && (e[s] |= t), i &= ~l;
    }
  }
  var Ce = 0;
  function Oc(e) {
    return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
  }
  var Bc, oa, $c, Wc, Uc, sa = !1, ro = [], cn = null, fn = null, dn = null, Qr = /* @__PURE__ */ new Map(), qr = /* @__PURE__ */ new Map(), hn = [], my = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function Hc(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        cn = null;
        break;
      case "dragenter":
      case "dragleave":
        fn = null;
        break;
      case "mouseover":
      case "mouseout":
        dn = null;
        break;
      case "pointerover":
      case "pointerout":
        Qr.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        qr.delete(t.pointerId);
    }
  }
  function Zr(e, t, i, s, l, c) {
    return e === null || e.nativeEvent !== c ? (e = { blockedOn: t, domEventName: i, eventSystemFlags: s, nativeEvent: c, targetContainers: [l] }, t !== null && (t = di(t), t !== null && oa(t)), e) : (e.eventSystemFlags |= s, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
  }
  function yy(e, t, i, s, l) {
    switch (t) {
      case "focusin":
        return cn = Zr(cn, e, t, i, s, l), !0;
      case "dragenter":
        return fn = Zr(fn, e, t, i, s, l), !0;
      case "mouseover":
        return dn = Zr(dn, e, t, i, s, l), !0;
      case "pointerover":
        var c = l.pointerId;
        return Qr.set(c, Zr(Qr.get(c) || null, e, t, i, s, l)), !0;
      case "gotpointercapture":
        return c = l.pointerId, qr.set(c, Zr(qr.get(c) || null, e, t, i, s, l)), !0;
    }
    return !1;
  }
  function Kc(e) {
    var t = zn(e.target);
    if (t !== null) {
      var i = _n(t);
      if (i !== null) {
        if (t = i.tag, t === 13) {
          if (t = Dc(i), t !== null) {
            e.blockedOn = t, Uc(e.priority, function() {
              $c(i);
            });
            return;
          }
        } else if (t === 3 && i.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = i.tag === 3 ? i.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function io(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var i = la(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (i === null) {
        i = e.nativeEvent;
        var s = new i.constructor(i.type, i);
        Xs = s, i.target.dispatchEvent(s), Xs = null;
      } else return t = di(i), t !== null && oa(t), e.blockedOn = i, !1;
      t.shift();
    }
    return !0;
  }
  function Gc(e, t, i) {
    io(e) && i.delete(t);
  }
  function gy() {
    sa = !1, cn !== null && io(cn) && (cn = null), fn !== null && io(fn) && (fn = null), dn !== null && io(dn) && (dn = null), Qr.forEach(Gc), qr.forEach(Gc);
  }
  function Jr(e, t) {
    e.blockedOn === t && (e.blockedOn = null, sa || (sa = !0, r.unstable_scheduleCallback(r.unstable_NormalPriority, gy)));
  }
  function ei(e) {
    function t(l) {
      return Jr(l, e);
    }
    if (0 < ro.length) {
      Jr(ro[0], e);
      for (var i = 1; i < ro.length; i++) {
        var s = ro[i];
        s.blockedOn === e && (s.blockedOn = null);
      }
    }
    for (cn !== null && Jr(cn, e), fn !== null && Jr(fn, e), dn !== null && Jr(dn, e), Qr.forEach(t), qr.forEach(t), i = 0; i < hn.length; i++) s = hn[i], s.blockedOn === e && (s.blockedOn = null);
    for (; 0 < hn.length && (i = hn[0], i.blockedOn === null); ) Kc(i), i.blockedOn === null && hn.shift();
  }
  var lr = b.ReactCurrentBatchConfig, oo = !0;
  function vy(e, t, i, s) {
    var l = Ce, c = lr.transition;
    lr.transition = null;
    try {
      Ce = 1, aa(e, t, i, s);
    } finally {
      Ce = l, lr.transition = c;
    }
  }
  function xy(e, t, i, s) {
    var l = Ce, c = lr.transition;
    lr.transition = null;
    try {
      Ce = 4, aa(e, t, i, s);
    } finally {
      Ce = l, lr.transition = c;
    }
  }
  function aa(e, t, i, s) {
    if (oo) {
      var l = la(e, t, i, s);
      if (l === null) Pa(e, t, s, so, i), Hc(e, s);
      else if (yy(l, e, t, i, s)) s.stopPropagation();
      else if (Hc(e, s), t & 4 && -1 < my.indexOf(e)) {
        for (; l !== null; ) {
          var c = di(l);
          if (c !== null && Bc(c), c = la(e, t, i, s), c === null && Pa(e, t, s, so, i), c === l) break;
          l = c;
        }
        l !== null && s.stopPropagation();
      } else Pa(e, t, s, null, i);
    }
  }
  var so = null;
  function la(e, t, i, s) {
    if (so = null, e = Qs(s), e = zn(e), e !== null) if (t = _n(e), t === null) e = null;
    else if (i = t.tag, i === 13) {
      if (e = Dc(t), e !== null) return e;
      e = null;
    } else if (i === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
    return so = e, null;
  }
  function Yc(e) {
    switch (e) {
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 1;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "toggle":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 4;
      case "message":
        switch (sy()) {
          case ta:
            return 1;
          case Ic:
            return 4;
          case Zi:
          case ay:
            return 16;
          case Fc:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var pn = null, ua = null, ao = null;
  function Xc() {
    if (ao) return ao;
    var e, t = ua, i = t.length, s, l = "value" in pn ? pn.value : pn.textContent, c = l.length;
    for (e = 0; e < i && t[e] === l[e]; e++) ;
    var p = i - e;
    for (s = 1; s <= p && t[i - s] === l[c - s]; s++) ;
    return ao = l.slice(e, 1 < s ? 1 - s : void 0);
  }
  function lo(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function uo() {
    return !0;
  }
  function Qc() {
    return !1;
  }
  function mt(e) {
    function t(i, s, l, c, p) {
      this._reactName = i, this._targetInst = l, this.type = s, this.nativeEvent = c, this.target = p, this.currentTarget = null;
      for (var w in e) e.hasOwnProperty(w) && (i = e[w], this[w] = i ? i(c) : c[w]);
      return this.isDefaultPrevented = (c.defaultPrevented != null ? c.defaultPrevented : c.returnValue === !1) ? uo : Qc, this.isPropagationStopped = Qc, this;
    }
    return U(t.prototype, { preventDefault: function() {
      this.defaultPrevented = !0;
      var i = this.nativeEvent;
      i && (i.preventDefault ? i.preventDefault() : typeof i.returnValue != "unknown" && (i.returnValue = !1), this.isDefaultPrevented = uo);
    }, stopPropagation: function() {
      var i = this.nativeEvent;
      i && (i.stopPropagation ? i.stopPropagation() : typeof i.cancelBubble != "unknown" && (i.cancelBubble = !0), this.isPropagationStopped = uo);
    }, persist: function() {
    }, isPersistent: uo }), t;
  }
  var ur = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
    return e.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, ca = mt(ur), ti = U({}, ur, { view: 0, detail: 0 }), wy = mt(ti), fa, da, ni, co = U({}, ti, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: pa, button: 0, buttons: 0, relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  }, movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== ni && (ni && e.type === "mousemove" ? (fa = e.screenX - ni.screenX, da = e.screenY - ni.screenY) : da = fa = 0, ni = e), fa);
  }, movementY: function(e) {
    return "movementY" in e ? e.movementY : da;
  } }), qc = mt(co), Sy = U({}, co, { dataTransfer: 0 }), ky = mt(Sy), Cy = U({}, ti, { relatedTarget: 0 }), ha = mt(Cy), Ty = U({}, ur, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Py = mt(Ty), Ey = U({}, ur, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } }), jy = mt(Ey), Ry = U({}, ur, { data: 0 }), Zc = mt(Ry), My = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Ay = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, Dy = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Ly(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Dy[e]) ? !!t[e] : !1;
  }
  function pa() {
    return Ly;
  }
  var Vy = U({}, ti, { key: function(e) {
    if (e.key) {
      var t = My[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = lo(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ay[e.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: pa, charCode: function(e) {
    return e.type === "keypress" ? lo(e) : 0;
  }, keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }, which: function(e) {
    return e.type === "keypress" ? lo(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  } }), Ny = mt(Vy), _y = U({}, co, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Jc = mt(_y), zy = U({}, ti, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: pa }), Iy = mt(zy), Fy = U({}, ur, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), by = mt(Fy), Oy = U({}, co, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), By = mt(Oy), $y = [9, 13, 27, 32], ma = h && "CompositionEvent" in window, ri = null;
  h && "documentMode" in document && (ri = document.documentMode);
  var Wy = h && "TextEvent" in window && !ri, ef = h && (!ma || ri && 8 < ri && 11 >= ri), tf = " ", nf = !1;
  function rf(e, t) {
    switch (e) {
      case "keyup":
        return $y.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function of(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var cr = !1;
  function Uy(e, t) {
    switch (e) {
      case "compositionend":
        return of(t);
      case "keypress":
        return t.which !== 32 ? null : (nf = !0, tf);
      case "textInput":
        return e = t.data, e === tf && nf ? null : e;
      default:
        return null;
    }
  }
  function Hy(e, t) {
    if (cr) return e === "compositionend" || !ma && rf(e, t) ? (e = Xc(), ao = ua = pn = null, cr = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return ef && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Ky = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function sf(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Ky[e.type] : t === "textarea";
  }
  function af(e, t, i, s) {
    Ec(s), t = yo(t, "onChange"), 0 < t.length && (i = new ca("onChange", "change", null, i, s), e.push({ event: i, listeners: t }));
  }
  var ii = null, oi = null;
  function Gy(e) {
    Pf(e, 0);
  }
  function fo(e) {
    var t = mr(e);
    if (Br(t)) return e;
  }
  function Yy(e, t) {
    if (e === "change") return t;
  }
  var lf = !1;
  if (h) {
    var ya;
    if (h) {
      var ga = "oninput" in document;
      if (!ga) {
        var uf = document.createElement("div");
        uf.setAttribute("oninput", "return;"), ga = typeof uf.oninput == "function";
      }
      ya = ga;
    } else ya = !1;
    lf = ya && (!document.documentMode || 9 < document.documentMode);
  }
  function cf() {
    ii && (ii.detachEvent("onpropertychange", ff), oi = ii = null);
  }
  function ff(e) {
    if (e.propertyName === "value" && fo(oi)) {
      var t = [];
      af(t, oi, e, Qs(e)), Ac(Gy, t);
    }
  }
  function Xy(e, t, i) {
    e === "focusin" ? (cf(), ii = t, oi = i, ii.attachEvent("onpropertychange", ff)) : e === "focusout" && cf();
  }
  function Qy(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return fo(oi);
  }
  function qy(e, t) {
    if (e === "click") return fo(t);
  }
  function Zy(e, t) {
    if (e === "input" || e === "change") return fo(t);
  }
  function Jy(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var At = typeof Object.is == "function" ? Object.is : Jy;
  function si(e, t) {
    if (At(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var i = Object.keys(e), s = Object.keys(t);
    if (i.length !== s.length) return !1;
    for (s = 0; s < i.length; s++) {
      var l = i[s];
      if (!g.call(t, l) || !At(e[l], t[l])) return !1;
    }
    return !0;
  }
  function df(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function hf(e, t) {
    var i = df(e);
    e = 0;
    for (var s; i; ) {
      if (i.nodeType === 3) {
        if (s = e + i.textContent.length, e <= t && s >= t) return { node: i, offset: t - e };
        e = s;
      }
      e: {
        for (; i; ) {
          if (i.nextSibling) {
            i = i.nextSibling;
            break e;
          }
          i = i.parentNode;
        }
        i = void 0;
      }
      i = df(i);
    }
  }
  function pf(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? pf(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function mf() {
    for (var e = window, t = Yi(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var i = typeof t.contentWindow.location.href == "string";
      } catch {
        i = !1;
      }
      if (i) e = t.contentWindow;
      else break;
      t = Yi(e.document);
    }
    return t;
  }
  function va(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  function eg(e) {
    var t = mf(), i = e.focusedElem, s = e.selectionRange;
    if (t !== i && i && i.ownerDocument && pf(i.ownerDocument.documentElement, i)) {
      if (s !== null && va(i)) {
        if (t = s.start, e = s.end, e === void 0 && (e = t), "selectionStart" in i) i.selectionStart = t, i.selectionEnd = Math.min(e, i.value.length);
        else if (e = (t = i.ownerDocument || document) && t.defaultView || window, e.getSelection) {
          e = e.getSelection();
          var l = i.textContent.length, c = Math.min(s.start, l);
          s = s.end === void 0 ? c : Math.min(s.end, l), !e.extend && c > s && (l = s, s = c, c = l), l = hf(i, c);
          var p = hf(
            i,
            s
          );
          l && p && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== p.node || e.focusOffset !== p.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), c > s ? (e.addRange(t), e.extend(p.node, p.offset)) : (t.setEnd(p.node, p.offset), e.addRange(t)));
        }
      }
      for (t = [], e = i; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof i.focus == "function" && i.focus(), i = 0; i < t.length; i++) e = t[i], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
    }
  }
  var tg = h && "documentMode" in document && 11 >= document.documentMode, fr = null, xa = null, ai = null, wa = !1;
  function yf(e, t, i) {
    var s = i.window === i ? i.document : i.nodeType === 9 ? i : i.ownerDocument;
    wa || fr == null || fr !== Yi(s) || (s = fr, "selectionStart" in s && va(s) ? s = { start: s.selectionStart, end: s.selectionEnd } : (s = (s.ownerDocument && s.ownerDocument.defaultView || window).getSelection(), s = { anchorNode: s.anchorNode, anchorOffset: s.anchorOffset, focusNode: s.focusNode, focusOffset: s.focusOffset }), ai && si(ai, s) || (ai = s, s = yo(xa, "onSelect"), 0 < s.length && (t = new ca("onSelect", "select", null, t, i), e.push({ event: t, listeners: s }), t.target = fr)));
  }
  function ho(e, t) {
    var i = {};
    return i[e.toLowerCase()] = t.toLowerCase(), i["Webkit" + e] = "webkit" + t, i["Moz" + e] = "moz" + t, i;
  }
  var dr = { animationend: ho("Animation", "AnimationEnd"), animationiteration: ho("Animation", "AnimationIteration"), animationstart: ho("Animation", "AnimationStart"), transitionend: ho("Transition", "TransitionEnd") }, Sa = {}, gf = {};
  h && (gf = document.createElement("div").style, "AnimationEvent" in window || (delete dr.animationend.animation, delete dr.animationiteration.animation, delete dr.animationstart.animation), "TransitionEvent" in window || delete dr.transitionend.transition);
  function po(e) {
    if (Sa[e]) return Sa[e];
    if (!dr[e]) return e;
    var t = dr[e], i;
    for (i in t) if (t.hasOwnProperty(i) && i in gf) return Sa[e] = t[i];
    return e;
  }
  var vf = po("animationend"), xf = po("animationiteration"), wf = po("animationstart"), Sf = po("transitionend"), kf = /* @__PURE__ */ new Map(), Cf = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function mn(e, t) {
    kf.set(e, t), d(t, [e]);
  }
  for (var ka = 0; ka < Cf.length; ka++) {
    var Ca = Cf[ka], ng = Ca.toLowerCase(), rg = Ca[0].toUpperCase() + Ca.slice(1);
    mn(ng, "on" + rg);
  }
  mn(vf, "onAnimationEnd"), mn(xf, "onAnimationIteration"), mn(wf, "onAnimationStart"), mn("dblclick", "onDoubleClick"), mn("focusin", "onFocus"), mn("focusout", "onBlur"), mn(Sf, "onTransitionEnd"), f("onMouseEnter", ["mouseout", "mouseover"]), f("onMouseLeave", ["mouseout", "mouseover"]), f("onPointerEnter", ["pointerout", "pointerover"]), f("onPointerLeave", ["pointerout", "pointerover"]), d("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), d("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), d("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), d("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), d("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), d("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var li = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), ig = new Set("cancel close invalid load scroll toggle".split(" ").concat(li));
  function Tf(e, t, i) {
    var s = e.type || "unknown-event";
    e.currentTarget = i, ny(s, t, void 0, e), e.currentTarget = null;
  }
  function Pf(e, t) {
    t = (t & 4) !== 0;
    for (var i = 0; i < e.length; i++) {
      var s = e[i], l = s.event;
      s = s.listeners;
      e: {
        var c = void 0;
        if (t) for (var p = s.length - 1; 0 <= p; p--) {
          var w = s[p], k = w.instance, R = w.currentTarget;
          if (w = w.listener, k !== c && l.isPropagationStopped()) break e;
          Tf(l, w, R), c = k;
        }
        else for (p = 0; p < s.length; p++) {
          if (w = s[p], k = w.instance, R = w.currentTarget, w = w.listener, k !== c && l.isPropagationStopped()) break e;
          Tf(l, w, R), c = k;
        }
      }
    }
    if (qi) throw e = ea, qi = !1, ea = null, e;
  }
  function Ae(e, t) {
    var i = t[Da];
    i === void 0 && (i = t[Da] = /* @__PURE__ */ new Set());
    var s = e + "__bubble";
    i.has(s) || (Ef(t, e, 2, !1), i.add(s));
  }
  function Ta(e, t, i) {
    var s = 0;
    t && (s |= 4), Ef(i, e, s, t);
  }
  var mo = "_reactListening" + Math.random().toString(36).slice(2);
  function ui(e) {
    if (!e[mo]) {
      e[mo] = !0, a.forEach(function(i) {
        i !== "selectionchange" && (ig.has(i) || Ta(i, !1, e), Ta(i, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[mo] || (t[mo] = !0, Ta("selectionchange", !1, t));
    }
  }
  function Ef(e, t, i, s) {
    switch (Yc(t)) {
      case 1:
        var l = vy;
        break;
      case 4:
        l = xy;
        break;
      default:
        l = aa;
    }
    i = l.bind(null, t, i, e), l = void 0, !Js || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), s ? l !== void 0 ? e.addEventListener(t, i, { capture: !0, passive: l }) : e.addEventListener(t, i, !0) : l !== void 0 ? e.addEventListener(t, i, { passive: l }) : e.addEventListener(t, i, !1);
  }
  function Pa(e, t, i, s, l) {
    var c = s;
    if ((t & 1) === 0 && (t & 2) === 0 && s !== null) e: for (; ; ) {
      if (s === null) return;
      var p = s.tag;
      if (p === 3 || p === 4) {
        var w = s.stateNode.containerInfo;
        if (w === l || w.nodeType === 8 && w.parentNode === l) break;
        if (p === 4) for (p = s.return; p !== null; ) {
          var k = p.tag;
          if ((k === 3 || k === 4) && (k = p.stateNode.containerInfo, k === l || k.nodeType === 8 && k.parentNode === l)) return;
          p = p.return;
        }
        for (; w !== null; ) {
          if (p = zn(w), p === null) return;
          if (k = p.tag, k === 5 || k === 6) {
            s = c = p;
            continue e;
          }
          w = w.parentNode;
        }
      }
      s = s.return;
    }
    Ac(function() {
      var R = c, F = Qs(i), O = [];
      e: {
        var I = kf.get(e);
        if (I !== void 0) {
          var H = ca, Q = e;
          switch (e) {
            case "keypress":
              if (lo(i) === 0) break e;
            case "keydown":
            case "keyup":
              H = Ny;
              break;
            case "focusin":
              Q = "focus", H = ha;
              break;
            case "focusout":
              Q = "blur", H = ha;
              break;
            case "beforeblur":
            case "afterblur":
              H = ha;
              break;
            case "click":
              if (i.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              H = qc;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              H = ky;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              H = Iy;
              break;
            case vf:
            case xf:
            case wf:
              H = Py;
              break;
            case Sf:
              H = by;
              break;
            case "scroll":
              H = wy;
              break;
            case "wheel":
              H = By;
              break;
            case "copy":
            case "cut":
            case "paste":
              H = jy;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              H = Jc;
          }
          var J = (t & 4) !== 0, Fe = !J && e === "scroll", P = J ? I !== null ? I + "Capture" : null : I;
          J = [];
          for (var C = R, j; C !== null; ) {
            j = C;
            var $ = j.stateNode;
            if (j.tag === 5 && $ !== null && (j = $, P !== null && ($ = Hr(C, P), $ != null && J.push(ci(C, $, j)))), Fe) break;
            C = C.return;
          }
          0 < J.length && (I = new H(I, Q, null, i, F), O.push({ event: I, listeners: J }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (I = e === "mouseover" || e === "pointerover", H = e === "mouseout" || e === "pointerout", I && i !== Xs && (Q = i.relatedTarget || i.fromElement) && (zn(Q) || Q[Zt])) break e;
          if ((H || I) && (I = F.window === F ? F : (I = F.ownerDocument) ? I.defaultView || I.parentWindow : window, H ? (Q = i.relatedTarget || i.toElement, H = R, Q = Q ? zn(Q) : null, Q !== null && (Fe = _n(Q), Q !== Fe || Q.tag !== 5 && Q.tag !== 6) && (Q = null)) : (H = null, Q = R), H !== Q)) {
            if (J = qc, $ = "onMouseLeave", P = "onMouseEnter", C = "mouse", (e === "pointerout" || e === "pointerover") && (J = Jc, $ = "onPointerLeave", P = "onPointerEnter", C = "pointer"), Fe = H == null ? I : mr(H), j = Q == null ? I : mr(Q), I = new J($, C + "leave", H, i, F), I.target = Fe, I.relatedTarget = j, $ = null, zn(F) === R && (J = new J(P, C + "enter", Q, i, F), J.target = j, J.relatedTarget = Fe, $ = J), Fe = $, H && Q) t: {
              for (J = H, P = Q, C = 0, j = J; j; j = hr(j)) C++;
              for (j = 0, $ = P; $; $ = hr($)) j++;
              for (; 0 < C - j; ) J = hr(J), C--;
              for (; 0 < j - C; ) P = hr(P), j--;
              for (; C--; ) {
                if (J === P || P !== null && J === P.alternate) break t;
                J = hr(J), P = hr(P);
              }
              J = null;
            }
            else J = null;
            H !== null && jf(O, I, H, J, !1), Q !== null && Fe !== null && jf(O, Fe, Q, J, !0);
          }
        }
        e: {
          if (I = R ? mr(R) : window, H = I.nodeName && I.nodeName.toLowerCase(), H === "select" || H === "input" && I.type === "file") var ne = Yy;
          else if (sf(I)) if (lf) ne = Zy;
          else {
            ne = Qy;
            var oe = Xy;
          }
          else (H = I.nodeName) && H.toLowerCase() === "input" && (I.type === "checkbox" || I.type === "radio") && (ne = qy);
          if (ne && (ne = ne(e, R))) {
            af(O, ne, i, F);
            break e;
          }
          oe && oe(e, I, R), e === "focusout" && (oe = I._wrapperState) && oe.controlled && I.type === "number" && Us(I, "number", I.value);
        }
        switch (oe = R ? mr(R) : window, e) {
          case "focusin":
            (sf(oe) || oe.contentEditable === "true") && (fr = oe, xa = R, ai = null);
            break;
          case "focusout":
            ai = xa = fr = null;
            break;
          case "mousedown":
            wa = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            wa = !1, yf(O, i, F);
            break;
          case "selectionchange":
            if (tg) break;
          case "keydown":
          case "keyup":
            yf(O, i, F);
        }
        var se;
        if (ma) e: {
          switch (e) {
            case "compositionstart":
              var le = "onCompositionStart";
              break e;
            case "compositionend":
              le = "onCompositionEnd";
              break e;
            case "compositionupdate":
              le = "onCompositionUpdate";
              break e;
          }
          le = void 0;
        }
        else cr ? rf(e, i) && (le = "onCompositionEnd") : e === "keydown" && i.keyCode === 229 && (le = "onCompositionStart");
        le && (ef && i.locale !== "ko" && (cr || le !== "onCompositionStart" ? le === "onCompositionEnd" && cr && (se = Xc()) : (pn = F, ua = "value" in pn ? pn.value : pn.textContent, cr = !0)), oe = yo(R, le), 0 < oe.length && (le = new Zc(le, e, null, i, F), O.push({ event: le, listeners: oe }), se ? le.data = se : (se = of(i), se !== null && (le.data = se)))), (se = Wy ? Uy(e, i) : Hy(e, i)) && (R = yo(R, "onBeforeInput"), 0 < R.length && (F = new Zc("onBeforeInput", "beforeinput", null, i, F), O.push({ event: F, listeners: R }), F.data = se));
      }
      Pf(O, t);
    });
  }
  function ci(e, t, i) {
    return { instance: e, listener: t, currentTarget: i };
  }
  function yo(e, t) {
    for (var i = t + "Capture", s = []; e !== null; ) {
      var l = e, c = l.stateNode;
      l.tag === 5 && c !== null && (l = c, c = Hr(e, i), c != null && s.unshift(ci(e, c, l)), c = Hr(e, t), c != null && s.push(ci(e, c, l))), e = e.return;
    }
    return s;
  }
  function hr(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function jf(e, t, i, s, l) {
    for (var c = t._reactName, p = []; i !== null && i !== s; ) {
      var w = i, k = w.alternate, R = w.stateNode;
      if (k !== null && k === s) break;
      w.tag === 5 && R !== null && (w = R, l ? (k = Hr(i, c), k != null && p.unshift(ci(i, k, w))) : l || (k = Hr(i, c), k != null && p.push(ci(i, k, w)))), i = i.return;
    }
    p.length !== 0 && e.push({ event: t, listeners: p });
  }
  var og = /\r\n?/g, sg = /\u0000|\uFFFD/g;
  function Rf(e) {
    return (typeof e == "string" ? e : "" + e).replace(og, `
`).replace(sg, "");
  }
  function go(e, t, i) {
    if (t = Rf(t), Rf(e) !== t && i) throw Error(o(425));
  }
  function vo() {
  }
  var Ea = null, ja = null;
  function Ra(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Ma = typeof setTimeout == "function" ? setTimeout : void 0, ag = typeof clearTimeout == "function" ? clearTimeout : void 0, Mf = typeof Promise == "function" ? Promise : void 0, lg = typeof queueMicrotask == "function" ? queueMicrotask : typeof Mf < "u" ? function(e) {
    return Mf.resolve(null).then(e).catch(ug);
  } : Ma;
  function ug(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Aa(e, t) {
    var i = t, s = 0;
    do {
      var l = i.nextSibling;
      if (e.removeChild(i), l && l.nodeType === 8) if (i = l.data, i === "/$") {
        if (s === 0) {
          e.removeChild(l), ei(t);
          return;
        }
        s--;
      } else i !== "$" && i !== "$?" && i !== "$!" || s++;
      i = l;
    } while (i);
    ei(t);
  }
  function yn(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
        if (t === "/$") return null;
      }
    }
    return e;
  }
  function Af(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var i = e.data;
        if (i === "$" || i === "$!" || i === "$?") {
          if (t === 0) return e;
          t--;
        } else i === "/$" && t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  var pr = Math.random().toString(36).slice(2), Ot = "__reactFiber$" + pr, fi = "__reactProps$" + pr, Zt = "__reactContainer$" + pr, Da = "__reactEvents$" + pr, cg = "__reactListeners$" + pr, fg = "__reactHandles$" + pr;
  function zn(e) {
    var t = e[Ot];
    if (t) return t;
    for (var i = e.parentNode; i; ) {
      if (t = i[Zt] || i[Ot]) {
        if (i = t.alternate, t.child !== null || i !== null && i.child !== null) for (e = Af(e); e !== null; ) {
          if (i = e[Ot]) return i;
          e = Af(e);
        }
        return t;
      }
      e = i, i = e.parentNode;
    }
    return null;
  }
  function di(e) {
    return e = e[Ot] || e[Zt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
  }
  function mr(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(o(33));
  }
  function xo(e) {
    return e[fi] || null;
  }
  var La = [], yr = -1;
  function gn(e) {
    return { current: e };
  }
  function De(e) {
    0 > yr || (e.current = La[yr], La[yr] = null, yr--);
  }
  function Re(e, t) {
    yr++, La[yr] = e.current, e.current = t;
  }
  var vn = {}, Ze = gn(vn), at = gn(!1), In = vn;
  function gr(e, t) {
    var i = e.type.contextTypes;
    if (!i) return vn;
    var s = e.stateNode;
    if (s && s.__reactInternalMemoizedUnmaskedChildContext === t) return s.__reactInternalMemoizedMaskedChildContext;
    var l = {}, c;
    for (c in i) l[c] = t[c];
    return s && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
  }
  function lt(e) {
    return e = e.childContextTypes, e != null;
  }
  function wo() {
    De(at), De(Ze);
  }
  function Df(e, t, i) {
    if (Ze.current !== vn) throw Error(o(168));
    Re(Ze, t), Re(at, i);
  }
  function Lf(e, t, i) {
    var s = e.stateNode;
    if (t = t.childContextTypes, typeof s.getChildContext != "function") return i;
    s = s.getChildContext();
    for (var l in s) if (!(l in t)) throw Error(o(108, re(e) || "Unknown", l));
    return U({}, i, s);
  }
  function So(e) {
    return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || vn, In = Ze.current, Re(Ze, e), Re(at, at.current), !0;
  }
  function Vf(e, t, i) {
    var s = e.stateNode;
    if (!s) throw Error(o(169));
    i ? (e = Lf(e, t, In), s.__reactInternalMemoizedMergedChildContext = e, De(at), De(Ze), Re(Ze, e)) : De(at), Re(at, i);
  }
  var Jt = null, ko = !1, Va = !1;
  function Nf(e) {
    Jt === null ? Jt = [e] : Jt.push(e);
  }
  function dg(e) {
    ko = !0, Nf(e);
  }
  function xn() {
    if (!Va && Jt !== null) {
      Va = !0;
      var e = 0, t = Ce;
      try {
        var i = Jt;
        for (Ce = 1; e < i.length; e++) {
          var s = i[e];
          do
            s = s(!0);
          while (s !== null);
        }
        Jt = null, ko = !1;
      } catch (l) {
        throw Jt !== null && (Jt = Jt.slice(e + 1)), _c(ta, xn), l;
      } finally {
        Ce = t, Va = !1;
      }
    }
    return null;
  }
  var vr = [], xr = 0, Co = null, To = 0, wt = [], St = 0, Fn = null, en = 1, tn = "";
  function bn(e, t) {
    vr[xr++] = To, vr[xr++] = Co, Co = e, To = t;
  }
  function _f(e, t, i) {
    wt[St++] = en, wt[St++] = tn, wt[St++] = Fn, Fn = e;
    var s = en;
    e = tn;
    var l = 32 - Mt(s) - 1;
    s &= ~(1 << l), i += 1;
    var c = 32 - Mt(t) + l;
    if (30 < c) {
      var p = l - l % 5;
      c = (s & (1 << p) - 1).toString(32), s >>= p, l -= p, en = 1 << 32 - Mt(t) + l | i << l | s, tn = c + e;
    } else en = 1 << c | i << l | s, tn = e;
  }
  function Na(e) {
    e.return !== null && (bn(e, 1), _f(e, 1, 0));
  }
  function _a(e) {
    for (; e === Co; ) Co = vr[--xr], vr[xr] = null, To = vr[--xr], vr[xr] = null;
    for (; e === Fn; ) Fn = wt[--St], wt[St] = null, tn = wt[--St], wt[St] = null, en = wt[--St], wt[St] = null;
  }
  var yt = null, gt = null, Le = !1, Dt = null;
  function zf(e, t) {
    var i = Pt(5, null, null, 0);
    i.elementType = "DELETED", i.stateNode = t, i.return = e, t = e.deletions, t === null ? (e.deletions = [i], e.flags |= 16) : t.push(i);
  }
  function If(e, t) {
    switch (e.tag) {
      case 5:
        var i = e.type;
        return t = t.nodeType !== 1 || i.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, yt = e, gt = yn(t.firstChild), !0) : !1;
      case 6:
        return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, yt = e, gt = null, !0) : !1;
      case 13:
        return t = t.nodeType !== 8 ? null : t, t !== null ? (i = Fn !== null ? { id: en, overflow: tn } : null, e.memoizedState = { dehydrated: t, treeContext: i, retryLane: 1073741824 }, i = Pt(18, null, null, 0), i.stateNode = t, i.return = e, e.child = i, yt = e, gt = null, !0) : !1;
      default:
        return !1;
    }
  }
  function za(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function Ia(e) {
    if (Le) {
      var t = gt;
      if (t) {
        var i = t;
        if (!If(e, t)) {
          if (za(e)) throw Error(o(418));
          t = yn(i.nextSibling);
          var s = yt;
          t && If(e, t) ? zf(s, i) : (e.flags = e.flags & -4097 | 2, Le = !1, yt = e);
        }
      } else {
        if (za(e)) throw Error(o(418));
        e.flags = e.flags & -4097 | 2, Le = !1, yt = e;
      }
    }
  }
  function Ff(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    yt = e;
  }
  function Po(e) {
    if (e !== yt) return !1;
    if (!Le) return Ff(e), Le = !0, !1;
    var t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Ra(e.type, e.memoizedProps)), t && (t = gt)) {
      if (za(e)) throw bf(), Error(o(418));
      for (; t; ) zf(e, t), t = yn(t.nextSibling);
    }
    if (Ff(e), e.tag === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(o(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var i = e.data;
            if (i === "/$") {
              if (t === 0) {
                gt = yn(e.nextSibling);
                break e;
              }
              t--;
            } else i !== "$" && i !== "$!" && i !== "$?" || t++;
          }
          e = e.nextSibling;
        }
        gt = null;
      }
    } else gt = yt ? yn(e.stateNode.nextSibling) : null;
    return !0;
  }
  function bf() {
    for (var e = gt; e; ) e = yn(e.nextSibling);
  }
  function wr() {
    gt = yt = null, Le = !1;
  }
  function Fa(e) {
    Dt === null ? Dt = [e] : Dt.push(e);
  }
  var hg = b.ReactCurrentBatchConfig;
  function hi(e, t, i) {
    if (e = i.ref, e !== null && typeof e != "function" && typeof e != "object") {
      if (i._owner) {
        if (i = i._owner, i) {
          if (i.tag !== 1) throw Error(o(309));
          var s = i.stateNode;
        }
        if (!s) throw Error(o(147, e));
        var l = s, c = "" + e;
        return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === c ? t.ref : (t = function(p) {
          var w = l.refs;
          p === null ? delete w[c] : w[c] = p;
        }, t._stringRef = c, t);
      }
      if (typeof e != "string") throw Error(o(284));
      if (!i._owner) throw Error(o(290, e));
    }
    return e;
  }
  function Eo(e, t) {
    throw e = Object.prototype.toString.call(t), Error(o(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
  }
  function Of(e) {
    var t = e._init;
    return t(e._payload);
  }
  function Bf(e) {
    function t(P, C) {
      if (e) {
        var j = P.deletions;
        j === null ? (P.deletions = [C], P.flags |= 16) : j.push(C);
      }
    }
    function i(P, C) {
      if (!e) return null;
      for (; C !== null; ) t(P, C), C = C.sibling;
      return null;
    }
    function s(P, C) {
      for (P = /* @__PURE__ */ new Map(); C !== null; ) C.key !== null ? P.set(C.key, C) : P.set(C.index, C), C = C.sibling;
      return P;
    }
    function l(P, C) {
      return P = jn(P, C), P.index = 0, P.sibling = null, P;
    }
    function c(P, C, j) {
      return P.index = j, e ? (j = P.alternate, j !== null ? (j = j.index, j < C ? (P.flags |= 2, C) : j) : (P.flags |= 2, C)) : (P.flags |= 1048576, C);
    }
    function p(P) {
      return e && P.alternate === null && (P.flags |= 2), P;
    }
    function w(P, C, j, $) {
      return C === null || C.tag !== 6 ? (C = Ml(j, P.mode, $), C.return = P, C) : (C = l(C, j), C.return = P, C);
    }
    function k(P, C, j, $) {
      var ne = j.type;
      return ne === te ? F(P, C, j.props.children, $, j.key) : C !== null && (C.elementType === ne || typeof ne == "object" && ne !== null && ne.$$typeof === Te && Of(ne) === C.type) ? ($ = l(C, j.props), $.ref = hi(P, C, j), $.return = P, $) : ($ = Qo(j.type, j.key, j.props, null, P.mode, $), $.ref = hi(P, C, j), $.return = P, $);
    }
    function R(P, C, j, $) {
      return C === null || C.tag !== 4 || C.stateNode.containerInfo !== j.containerInfo || C.stateNode.implementation !== j.implementation ? (C = Al(j, P.mode, $), C.return = P, C) : (C = l(C, j.children || []), C.return = P, C);
    }
    function F(P, C, j, $, ne) {
      return C === null || C.tag !== 7 ? (C = Gn(j, P.mode, $, ne), C.return = P, C) : (C = l(C, j), C.return = P, C);
    }
    function O(P, C, j) {
      if (typeof C == "string" && C !== "" || typeof C == "number") return C = Ml("" + C, P.mode, j), C.return = P, C;
      if (typeof C == "object" && C !== null) {
        switch (C.$$typeof) {
          case ee:
            return j = Qo(C.type, C.key, C.props, null, P.mode, j), j.ref = hi(P, null, C), j.return = P, j;
          case Z:
            return C = Al(C, P.mode, j), C.return = P, C;
          case Te:
            var $ = C._init;
            return O(P, $(C._payload), j);
        }
        if ($r(C) || X(C)) return C = Gn(C, P.mode, j, null), C.return = P, C;
        Eo(P, C);
      }
      return null;
    }
    function I(P, C, j, $) {
      var ne = C !== null ? C.key : null;
      if (typeof j == "string" && j !== "" || typeof j == "number") return ne !== null ? null : w(P, C, "" + j, $);
      if (typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case ee:
            return j.key === ne ? k(P, C, j, $) : null;
          case Z:
            return j.key === ne ? R(P, C, j, $) : null;
          case Te:
            return ne = j._init, I(
              P,
              C,
              ne(j._payload),
              $
            );
        }
        if ($r(j) || X(j)) return ne !== null ? null : F(P, C, j, $, null);
        Eo(P, j);
      }
      return null;
    }
    function H(P, C, j, $, ne) {
      if (typeof $ == "string" && $ !== "" || typeof $ == "number") return P = P.get(j) || null, w(C, P, "" + $, ne);
      if (typeof $ == "object" && $ !== null) {
        switch ($.$$typeof) {
          case ee:
            return P = P.get($.key === null ? j : $.key) || null, k(C, P, $, ne);
          case Z:
            return P = P.get($.key === null ? j : $.key) || null, R(C, P, $, ne);
          case Te:
            var oe = $._init;
            return H(P, C, j, oe($._payload), ne);
        }
        if ($r($) || X($)) return P = P.get(j) || null, F(C, P, $, ne, null);
        Eo(C, $);
      }
      return null;
    }
    function Q(P, C, j, $) {
      for (var ne = null, oe = null, se = C, le = C = 0, Ke = null; se !== null && le < j.length; le++) {
        se.index > le ? (Ke = se, se = null) : Ke = se.sibling;
        var Se = I(P, se, j[le], $);
        if (Se === null) {
          se === null && (se = Ke);
          break;
        }
        e && se && Se.alternate === null && t(P, se), C = c(Se, C, le), oe === null ? ne = Se : oe.sibling = Se, oe = Se, se = Ke;
      }
      if (le === j.length) return i(P, se), Le && bn(P, le), ne;
      if (se === null) {
        for (; le < j.length; le++) se = O(P, j[le], $), se !== null && (C = c(se, C, le), oe === null ? ne = se : oe.sibling = se, oe = se);
        return Le && bn(P, le), ne;
      }
      for (se = s(P, se); le < j.length; le++) Ke = H(se, P, le, j[le], $), Ke !== null && (e && Ke.alternate !== null && se.delete(Ke.key === null ? le : Ke.key), C = c(Ke, C, le), oe === null ? ne = Ke : oe.sibling = Ke, oe = Ke);
      return e && se.forEach(function(Rn) {
        return t(P, Rn);
      }), Le && bn(P, le), ne;
    }
    function J(P, C, j, $) {
      var ne = X(j);
      if (typeof ne != "function") throw Error(o(150));
      if (j = ne.call(j), j == null) throw Error(o(151));
      for (var oe = ne = null, se = C, le = C = 0, Ke = null, Se = j.next(); se !== null && !Se.done; le++, Se = j.next()) {
        se.index > le ? (Ke = se, se = null) : Ke = se.sibling;
        var Rn = I(P, se, Se.value, $);
        if (Rn === null) {
          se === null && (se = Ke);
          break;
        }
        e && se && Rn.alternate === null && t(P, se), C = c(Rn, C, le), oe === null ? ne = Rn : oe.sibling = Rn, oe = Rn, se = Ke;
      }
      if (Se.done) return i(
        P,
        se
      ), Le && bn(P, le), ne;
      if (se === null) {
        for (; !Se.done; le++, Se = j.next()) Se = O(P, Se.value, $), Se !== null && (C = c(Se, C, le), oe === null ? ne = Se : oe.sibling = Se, oe = Se);
        return Le && bn(P, le), ne;
      }
      for (se = s(P, se); !Se.done; le++, Se = j.next()) Se = H(se, P, le, Se.value, $), Se !== null && (e && Se.alternate !== null && se.delete(Se.key === null ? le : Se.key), C = c(Se, C, le), oe === null ? ne = Se : oe.sibling = Se, oe = Se);
      return e && se.forEach(function(Kg) {
        return t(P, Kg);
      }), Le && bn(P, le), ne;
    }
    function Fe(P, C, j, $) {
      if (typeof j == "object" && j !== null && j.type === te && j.key === null && (j = j.props.children), typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case ee:
            e: {
              for (var ne = j.key, oe = C; oe !== null; ) {
                if (oe.key === ne) {
                  if (ne = j.type, ne === te) {
                    if (oe.tag === 7) {
                      i(P, oe.sibling), C = l(oe, j.props.children), C.return = P, P = C;
                      break e;
                    }
                  } else if (oe.elementType === ne || typeof ne == "object" && ne !== null && ne.$$typeof === Te && Of(ne) === oe.type) {
                    i(P, oe.sibling), C = l(oe, j.props), C.ref = hi(P, oe, j), C.return = P, P = C;
                    break e;
                  }
                  i(P, oe);
                  break;
                } else t(P, oe);
                oe = oe.sibling;
              }
              j.type === te ? (C = Gn(j.props.children, P.mode, $, j.key), C.return = P, P = C) : ($ = Qo(j.type, j.key, j.props, null, P.mode, $), $.ref = hi(P, C, j), $.return = P, P = $);
            }
            return p(P);
          case Z:
            e: {
              for (oe = j.key; C !== null; ) {
                if (C.key === oe) if (C.tag === 4 && C.stateNode.containerInfo === j.containerInfo && C.stateNode.implementation === j.implementation) {
                  i(P, C.sibling), C = l(C, j.children || []), C.return = P, P = C;
                  break e;
                } else {
                  i(P, C);
                  break;
                }
                else t(P, C);
                C = C.sibling;
              }
              C = Al(j, P.mode, $), C.return = P, P = C;
            }
            return p(P);
          case Te:
            return oe = j._init, Fe(P, C, oe(j._payload), $);
        }
        if ($r(j)) return Q(P, C, j, $);
        if (X(j)) return J(P, C, j, $);
        Eo(P, j);
      }
      return typeof j == "string" && j !== "" || typeof j == "number" ? (j = "" + j, C !== null && C.tag === 6 ? (i(P, C.sibling), C = l(C, j), C.return = P, P = C) : (i(P, C), C = Ml(j, P.mode, $), C.return = P, P = C), p(P)) : i(P, C);
    }
    return Fe;
  }
  var Sr = Bf(!0), $f = Bf(!1), jo = gn(null), Ro = null, kr = null, ba = null;
  function Oa() {
    ba = kr = Ro = null;
  }
  function Ba(e) {
    var t = jo.current;
    De(jo), e._currentValue = t;
  }
  function $a(e, t, i) {
    for (; e !== null; ) {
      var s = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, s !== null && (s.childLanes |= t)) : s !== null && (s.childLanes & t) !== t && (s.childLanes |= t), e === i) break;
      e = e.return;
    }
  }
  function Cr(e, t) {
    Ro = e, ba = kr = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (ut = !0), e.firstContext = null);
  }
  function kt(e) {
    var t = e._currentValue;
    if (ba !== e) if (e = { context: e, memoizedValue: t, next: null }, kr === null) {
      if (Ro === null) throw Error(o(308));
      kr = e, Ro.dependencies = { lanes: 0, firstContext: e };
    } else kr = kr.next = e;
    return t;
  }
  var On = null;
  function Wa(e) {
    On === null ? On = [e] : On.push(e);
  }
  function Wf(e, t, i, s) {
    var l = t.interleaved;
    return l === null ? (i.next = i, Wa(t)) : (i.next = l.next, l.next = i), t.interleaved = i, nn(e, s);
  }
  function nn(e, t) {
    e.lanes |= t;
    var i = e.alternate;
    for (i !== null && (i.lanes |= t), i = e, e = e.return; e !== null; ) e.childLanes |= t, i = e.alternate, i !== null && (i.childLanes |= t), i = e, e = e.return;
    return i.tag === 3 ? i.stateNode : null;
  }
  var wn = !1;
  function Ua(e) {
    e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function Uf(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
  }
  function rn(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Sn(e, t, i) {
    var s = e.updateQueue;
    if (s === null) return null;
    if (s = s.shared, (xe & 2) !== 0) {
      var l = s.pending;
      return l === null ? t.next = t : (t.next = l.next, l.next = t), s.pending = t, nn(e, i);
    }
    return l = s.interleaved, l === null ? (t.next = t, Wa(s)) : (t.next = l.next, l.next = t), s.interleaved = t, nn(e, i);
  }
  function Mo(e, t, i) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (i & 4194240) !== 0)) {
      var s = t.lanes;
      s &= e.pendingLanes, i |= s, t.lanes = i, ia(e, i);
    }
  }
  function Hf(e, t) {
    var i = e.updateQueue, s = e.alternate;
    if (s !== null && (s = s.updateQueue, i === s)) {
      var l = null, c = null;
      if (i = i.firstBaseUpdate, i !== null) {
        do {
          var p = { eventTime: i.eventTime, lane: i.lane, tag: i.tag, payload: i.payload, callback: i.callback, next: null };
          c === null ? l = c = p : c = c.next = p, i = i.next;
        } while (i !== null);
        c === null ? l = c = t : c = c.next = t;
      } else l = c = t;
      i = { baseState: s.baseState, firstBaseUpdate: l, lastBaseUpdate: c, shared: s.shared, effects: s.effects }, e.updateQueue = i;
      return;
    }
    e = i.lastBaseUpdate, e === null ? i.firstBaseUpdate = t : e.next = t, i.lastBaseUpdate = t;
  }
  function Ao(e, t, i, s) {
    var l = e.updateQueue;
    wn = !1;
    var c = l.firstBaseUpdate, p = l.lastBaseUpdate, w = l.shared.pending;
    if (w !== null) {
      l.shared.pending = null;
      var k = w, R = k.next;
      k.next = null, p === null ? c = R : p.next = R, p = k;
      var F = e.alternate;
      F !== null && (F = F.updateQueue, w = F.lastBaseUpdate, w !== p && (w === null ? F.firstBaseUpdate = R : w.next = R, F.lastBaseUpdate = k));
    }
    if (c !== null) {
      var O = l.baseState;
      p = 0, F = R = k = null, w = c;
      do {
        var I = w.lane, H = w.eventTime;
        if ((s & I) === I) {
          F !== null && (F = F.next = {
            eventTime: H,
            lane: 0,
            tag: w.tag,
            payload: w.payload,
            callback: w.callback,
            next: null
          });
          e: {
            var Q = e, J = w;
            switch (I = t, H = i, J.tag) {
              case 1:
                if (Q = J.payload, typeof Q == "function") {
                  O = Q.call(H, O, I);
                  break e;
                }
                O = Q;
                break e;
              case 3:
                Q.flags = Q.flags & -65537 | 128;
              case 0:
                if (Q = J.payload, I = typeof Q == "function" ? Q.call(H, O, I) : Q, I == null) break e;
                O = U({}, O, I);
                break e;
              case 2:
                wn = !0;
            }
          }
          w.callback !== null && w.lane !== 0 && (e.flags |= 64, I = l.effects, I === null ? l.effects = [w] : I.push(w));
        } else H = { eventTime: H, lane: I, tag: w.tag, payload: w.payload, callback: w.callback, next: null }, F === null ? (R = F = H, k = O) : F = F.next = H, p |= I;
        if (w = w.next, w === null) {
          if (w = l.shared.pending, w === null) break;
          I = w, w = I.next, I.next = null, l.lastBaseUpdate = I, l.shared.pending = null;
        }
      } while (!0);
      if (F === null && (k = O), l.baseState = k, l.firstBaseUpdate = R, l.lastBaseUpdate = F, t = l.shared.interleaved, t !== null) {
        l = t;
        do
          p |= l.lane, l = l.next;
        while (l !== t);
      } else c === null && (l.shared.lanes = 0);
      Wn |= p, e.lanes = p, e.memoizedState = O;
    }
  }
  function Kf(e, t, i) {
    if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
      var s = e[t], l = s.callback;
      if (l !== null) {
        if (s.callback = null, s = i, typeof l != "function") throw Error(o(191, l));
        l.call(s);
      }
    }
  }
  var pi = {}, Bt = gn(pi), mi = gn(pi), yi = gn(pi);
  function Bn(e) {
    if (e === pi) throw Error(o(174));
    return e;
  }
  function Ha(e, t) {
    switch (Re(yi, t), Re(mi, e), Re(Bt, pi), e = t.nodeType, e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Ks(null, "");
        break;
      default:
        e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Ks(t, e);
    }
    De(Bt), Re(Bt, t);
  }
  function Tr() {
    De(Bt), De(mi), De(yi);
  }
  function Gf(e) {
    Bn(yi.current);
    var t = Bn(Bt.current), i = Ks(t, e.type);
    t !== i && (Re(mi, e), Re(Bt, i));
  }
  function Ka(e) {
    mi.current === e && (De(Bt), De(mi));
  }
  var Ve = gn(0);
  function Do(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var i = t.memoizedState;
        if (i !== null && (i = i.dehydrated, i === null || i.data === "$?" || i.data === "$!")) return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var Ga = [];
  function Ya() {
    for (var e = 0; e < Ga.length; e++) Ga[e]._workInProgressVersionPrimary = null;
    Ga.length = 0;
  }
  var Lo = b.ReactCurrentDispatcher, Xa = b.ReactCurrentBatchConfig, $n = 0, Ne = null, Be = null, Ue = null, Vo = !1, gi = !1, vi = 0, pg = 0;
  function Je() {
    throw Error(o(321));
  }
  function Qa(e, t) {
    if (t === null) return !1;
    for (var i = 0; i < t.length && i < e.length; i++) if (!At(e[i], t[i])) return !1;
    return !0;
  }
  function qa(e, t, i, s, l, c) {
    if ($n = c, Ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Lo.current = e === null || e.memoizedState === null ? vg : xg, e = i(s, l), gi) {
      c = 0;
      do {
        if (gi = !1, vi = 0, 25 <= c) throw Error(o(301));
        c += 1, Ue = Be = null, t.updateQueue = null, Lo.current = wg, e = i(s, l);
      } while (gi);
    }
    if (Lo.current = zo, t = Be !== null && Be.next !== null, $n = 0, Ue = Be = Ne = null, Vo = !1, t) throw Error(o(300));
    return e;
  }
  function Za() {
    var e = vi !== 0;
    return vi = 0, e;
  }
  function $t() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Ue === null ? Ne.memoizedState = Ue = e : Ue = Ue.next = e, Ue;
  }
  function Ct() {
    if (Be === null) {
      var e = Ne.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Be.next;
    var t = Ue === null ? Ne.memoizedState : Ue.next;
    if (t !== null) Ue = t, Be = e;
    else {
      if (e === null) throw Error(o(310));
      Be = e, e = { memoizedState: Be.memoizedState, baseState: Be.baseState, baseQueue: Be.baseQueue, queue: Be.queue, next: null }, Ue === null ? Ne.memoizedState = Ue = e : Ue = Ue.next = e;
    }
    return Ue;
  }
  function xi(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Ja(e) {
    var t = Ct(), i = t.queue;
    if (i === null) throw Error(o(311));
    i.lastRenderedReducer = e;
    var s = Be, l = s.baseQueue, c = i.pending;
    if (c !== null) {
      if (l !== null) {
        var p = l.next;
        l.next = c.next, c.next = p;
      }
      s.baseQueue = l = c, i.pending = null;
    }
    if (l !== null) {
      c = l.next, s = s.baseState;
      var w = p = null, k = null, R = c;
      do {
        var F = R.lane;
        if (($n & F) === F) k !== null && (k = k.next = { lane: 0, action: R.action, hasEagerState: R.hasEagerState, eagerState: R.eagerState, next: null }), s = R.hasEagerState ? R.eagerState : e(s, R.action);
        else {
          var O = {
            lane: F,
            action: R.action,
            hasEagerState: R.hasEagerState,
            eagerState: R.eagerState,
            next: null
          };
          k === null ? (w = k = O, p = s) : k = k.next = O, Ne.lanes |= F, Wn |= F;
        }
        R = R.next;
      } while (R !== null && R !== c);
      k === null ? p = s : k.next = w, At(s, t.memoizedState) || (ut = !0), t.memoizedState = s, t.baseState = p, t.baseQueue = k, i.lastRenderedState = s;
    }
    if (e = i.interleaved, e !== null) {
      l = e;
      do
        c = l.lane, Ne.lanes |= c, Wn |= c, l = l.next;
      while (l !== e);
    } else l === null && (i.lanes = 0);
    return [t.memoizedState, i.dispatch];
  }
  function el(e) {
    var t = Ct(), i = t.queue;
    if (i === null) throw Error(o(311));
    i.lastRenderedReducer = e;
    var s = i.dispatch, l = i.pending, c = t.memoizedState;
    if (l !== null) {
      i.pending = null;
      var p = l = l.next;
      do
        c = e(c, p.action), p = p.next;
      while (p !== l);
      At(c, t.memoizedState) || (ut = !0), t.memoizedState = c, t.baseQueue === null && (t.baseState = c), i.lastRenderedState = c;
    }
    return [c, s];
  }
  function Yf() {
  }
  function Xf(e, t) {
    var i = Ne, s = Ct(), l = t(), c = !At(s.memoizedState, l);
    if (c && (s.memoizedState = l, ut = !0), s = s.queue, tl(Zf.bind(null, i, s, e), [e]), s.getSnapshot !== t || c || Ue !== null && Ue.memoizedState.tag & 1) {
      if (i.flags |= 2048, wi(9, qf.bind(null, i, s, l, t), void 0, null), He === null) throw Error(o(349));
      ($n & 30) !== 0 || Qf(i, t, l);
    }
    return l;
  }
  function Qf(e, t, i) {
    e.flags |= 16384, e = { getSnapshot: t, value: i }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.stores = [e]) : (i = t.stores, i === null ? t.stores = [e] : i.push(e));
  }
  function qf(e, t, i, s) {
    t.value = i, t.getSnapshot = s, Jf(t) && ed(e);
  }
  function Zf(e, t, i) {
    return i(function() {
      Jf(t) && ed(e);
    });
  }
  function Jf(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var i = t();
      return !At(e, i);
    } catch {
      return !0;
    }
  }
  function ed(e) {
    var t = nn(e, 1);
    t !== null && _t(t, e, 1, -1);
  }
  function td(e) {
    var t = $t();
    return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: xi, lastRenderedState: e }, t.queue = e, e = e.dispatch = gg.bind(null, Ne, e), [t.memoizedState, e];
  }
  function wi(e, t, i, s) {
    return e = { tag: e, create: t, destroy: i, deps: s, next: null }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.lastEffect = e.next = e) : (i = t.lastEffect, i === null ? t.lastEffect = e.next = e : (s = i.next, i.next = e, e.next = s, t.lastEffect = e)), e;
  }
  function nd() {
    return Ct().memoizedState;
  }
  function No(e, t, i, s) {
    var l = $t();
    Ne.flags |= e, l.memoizedState = wi(1 | t, i, void 0, s === void 0 ? null : s);
  }
  function _o(e, t, i, s) {
    var l = Ct();
    s = s === void 0 ? null : s;
    var c = void 0;
    if (Be !== null) {
      var p = Be.memoizedState;
      if (c = p.destroy, s !== null && Qa(s, p.deps)) {
        l.memoizedState = wi(t, i, c, s);
        return;
      }
    }
    Ne.flags |= e, l.memoizedState = wi(1 | t, i, c, s);
  }
  function rd(e, t) {
    return No(8390656, 8, e, t);
  }
  function tl(e, t) {
    return _o(2048, 8, e, t);
  }
  function id(e, t) {
    return _o(4, 2, e, t);
  }
  function od(e, t) {
    return _o(4, 4, e, t);
  }
  function sd(e, t) {
    if (typeof t == "function") return e = e(), t(e), function() {
      t(null);
    };
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function ad(e, t, i) {
    return i = i != null ? i.concat([e]) : null, _o(4, 4, sd.bind(null, t, e), i);
  }
  function nl() {
  }
  function ld(e, t) {
    var i = Ct();
    t = t === void 0 ? null : t;
    var s = i.memoizedState;
    return s !== null && t !== null && Qa(t, s[1]) ? s[0] : (i.memoizedState = [e, t], e);
  }
  function ud(e, t) {
    var i = Ct();
    t = t === void 0 ? null : t;
    var s = i.memoizedState;
    return s !== null && t !== null && Qa(t, s[1]) ? s[0] : (e = e(), i.memoizedState = [e, t], e);
  }
  function cd(e, t, i) {
    return ($n & 21) === 0 ? (e.baseState && (e.baseState = !1, ut = !0), e.memoizedState = i) : (At(i, t) || (i = bc(), Ne.lanes |= i, Wn |= i, e.baseState = !0), t);
  }
  function mg(e, t) {
    var i = Ce;
    Ce = i !== 0 && 4 > i ? i : 4, e(!0);
    var s = Xa.transition;
    Xa.transition = {};
    try {
      e(!1), t();
    } finally {
      Ce = i, Xa.transition = s;
    }
  }
  function fd() {
    return Ct().memoizedState;
  }
  function yg(e, t, i) {
    var s = Pn(e);
    if (i = { lane: s, action: i, hasEagerState: !1, eagerState: null, next: null }, dd(e)) hd(t, i);
    else if (i = Wf(e, t, i, s), i !== null) {
      var l = it();
      _t(i, e, s, l), pd(i, t, s);
    }
  }
  function gg(e, t, i) {
    var s = Pn(e), l = { lane: s, action: i, hasEagerState: !1, eagerState: null, next: null };
    if (dd(e)) hd(t, l);
    else {
      var c = e.alternate;
      if (e.lanes === 0 && (c === null || c.lanes === 0) && (c = t.lastRenderedReducer, c !== null)) try {
        var p = t.lastRenderedState, w = c(p, i);
        if (l.hasEagerState = !0, l.eagerState = w, At(w, p)) {
          var k = t.interleaved;
          k === null ? (l.next = l, Wa(t)) : (l.next = k.next, k.next = l), t.interleaved = l;
          return;
        }
      } catch {
      } finally {
      }
      i = Wf(e, t, l, s), i !== null && (l = it(), _t(i, e, s, l), pd(i, t, s));
    }
  }
  function dd(e) {
    var t = e.alternate;
    return e === Ne || t !== null && t === Ne;
  }
  function hd(e, t) {
    gi = Vo = !0;
    var i = e.pending;
    i === null ? t.next = t : (t.next = i.next, i.next = t), e.pending = t;
  }
  function pd(e, t, i) {
    if ((i & 4194240) !== 0) {
      var s = t.lanes;
      s &= e.pendingLanes, i |= s, t.lanes = i, ia(e, i);
    }
  }
  var zo = { readContext: kt, useCallback: Je, useContext: Je, useEffect: Je, useImperativeHandle: Je, useInsertionEffect: Je, useLayoutEffect: Je, useMemo: Je, useReducer: Je, useRef: Je, useState: Je, useDebugValue: Je, useDeferredValue: Je, useTransition: Je, useMutableSource: Je, useSyncExternalStore: Je, useId: Je, unstable_isNewReconciler: !1 }, vg = { readContext: kt, useCallback: function(e, t) {
    return $t().memoizedState = [e, t === void 0 ? null : t], e;
  }, useContext: kt, useEffect: rd, useImperativeHandle: function(e, t, i) {
    return i = i != null ? i.concat([e]) : null, No(
      4194308,
      4,
      sd.bind(null, t, e),
      i
    );
  }, useLayoutEffect: function(e, t) {
    return No(4194308, 4, e, t);
  }, useInsertionEffect: function(e, t) {
    return No(4, 2, e, t);
  }, useMemo: function(e, t) {
    var i = $t();
    return t = t === void 0 ? null : t, e = e(), i.memoizedState = [e, t], e;
  }, useReducer: function(e, t, i) {
    var s = $t();
    return t = i !== void 0 ? i(t) : t, s.memoizedState = s.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, s.queue = e, e = e.dispatch = yg.bind(null, Ne, e), [s.memoizedState, e];
  }, useRef: function(e) {
    var t = $t();
    return e = { current: e }, t.memoizedState = e;
  }, useState: td, useDebugValue: nl, useDeferredValue: function(e) {
    return $t().memoizedState = e;
  }, useTransition: function() {
    var e = td(!1), t = e[0];
    return e = mg.bind(null, e[1]), $t().memoizedState = e, [t, e];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(e, t, i) {
    var s = Ne, l = $t();
    if (Le) {
      if (i === void 0) throw Error(o(407));
      i = i();
    } else {
      if (i = t(), He === null) throw Error(o(349));
      ($n & 30) !== 0 || Qf(s, t, i);
    }
    l.memoizedState = i;
    var c = { value: i, getSnapshot: t };
    return l.queue = c, rd(Zf.bind(
      null,
      s,
      c,
      e
    ), [e]), s.flags |= 2048, wi(9, qf.bind(null, s, c, i, t), void 0, null), i;
  }, useId: function() {
    var e = $t(), t = He.identifierPrefix;
    if (Le) {
      var i = tn, s = en;
      i = (s & ~(1 << 32 - Mt(s) - 1)).toString(32) + i, t = ":" + t + "R" + i, i = vi++, 0 < i && (t += "H" + i.toString(32)), t += ":";
    } else i = pg++, t = ":" + t + "r" + i.toString(32) + ":";
    return e.memoizedState = t;
  }, unstable_isNewReconciler: !1 }, xg = {
    readContext: kt,
    useCallback: ld,
    useContext: kt,
    useEffect: tl,
    useImperativeHandle: ad,
    useInsertionEffect: id,
    useLayoutEffect: od,
    useMemo: ud,
    useReducer: Ja,
    useRef: nd,
    useState: function() {
      return Ja(xi);
    },
    useDebugValue: nl,
    useDeferredValue: function(e) {
      var t = Ct();
      return cd(t, Be.memoizedState, e);
    },
    useTransition: function() {
      var e = Ja(xi)[0], t = Ct().memoizedState;
      return [e, t];
    },
    useMutableSource: Yf,
    useSyncExternalStore: Xf,
    useId: fd,
    unstable_isNewReconciler: !1
  }, wg = { readContext: kt, useCallback: ld, useContext: kt, useEffect: tl, useImperativeHandle: ad, useInsertionEffect: id, useLayoutEffect: od, useMemo: ud, useReducer: el, useRef: nd, useState: function() {
    return el(xi);
  }, useDebugValue: nl, useDeferredValue: function(e) {
    var t = Ct();
    return Be === null ? t.memoizedState = e : cd(t, Be.memoizedState, e);
  }, useTransition: function() {
    var e = el(xi)[0], t = Ct().memoizedState;
    return [e, t];
  }, useMutableSource: Yf, useSyncExternalStore: Xf, useId: fd, unstable_isNewReconciler: !1 };
  function Lt(e, t) {
    if (e && e.defaultProps) {
      t = U({}, t), e = e.defaultProps;
      for (var i in e) t[i] === void 0 && (t[i] = e[i]);
      return t;
    }
    return t;
  }
  function rl(e, t, i, s) {
    t = e.memoizedState, i = i(s, t), i = i == null ? t : U({}, t, i), e.memoizedState = i, e.lanes === 0 && (e.updateQueue.baseState = i);
  }
  var Io = { isMounted: function(e) {
    return (e = e._reactInternals) ? _n(e) === e : !1;
  }, enqueueSetState: function(e, t, i) {
    e = e._reactInternals;
    var s = it(), l = Pn(e), c = rn(s, l);
    c.payload = t, i != null && (c.callback = i), t = Sn(e, c, l), t !== null && (_t(t, e, l, s), Mo(t, e, l));
  }, enqueueReplaceState: function(e, t, i) {
    e = e._reactInternals;
    var s = it(), l = Pn(e), c = rn(s, l);
    c.tag = 1, c.payload = t, i != null && (c.callback = i), t = Sn(e, c, l), t !== null && (_t(t, e, l, s), Mo(t, e, l));
  }, enqueueForceUpdate: function(e, t) {
    e = e._reactInternals;
    var i = it(), s = Pn(e), l = rn(i, s);
    l.tag = 2, t != null && (l.callback = t), t = Sn(e, l, s), t !== null && (_t(t, e, s, i), Mo(t, e, s));
  } };
  function md(e, t, i, s, l, c, p) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(s, c, p) : t.prototype && t.prototype.isPureReactComponent ? !si(i, s) || !si(l, c) : !0;
  }
  function yd(e, t, i) {
    var s = !1, l = vn, c = t.contextType;
    return typeof c == "object" && c !== null ? c = kt(c) : (l = lt(t) ? In : Ze.current, s = t.contextTypes, c = (s = s != null) ? gr(e, l) : vn), t = new t(i, c), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Io, e.stateNode = t, t._reactInternals = e, s && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = c), t;
  }
  function gd(e, t, i, s) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(i, s), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(i, s), t.state !== e && Io.enqueueReplaceState(t, t.state, null);
  }
  function il(e, t, i, s) {
    var l = e.stateNode;
    l.props = i, l.state = e.memoizedState, l.refs = {}, Ua(e);
    var c = t.contextType;
    typeof c == "object" && c !== null ? l.context = kt(c) : (c = lt(t) ? In : Ze.current, l.context = gr(e, c)), l.state = e.memoizedState, c = t.getDerivedStateFromProps, typeof c == "function" && (rl(e, t, c, i), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && Io.enqueueReplaceState(l, l.state, null), Ao(e, i, l, s), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
  }
  function Pr(e, t) {
    try {
      var i = "", s = t;
      do
        i += ve(s), s = s.return;
      while (s);
      var l = i;
    } catch (c) {
      l = `
Error generating stack: ` + c.message + `
` + c.stack;
    }
    return { value: e, source: t, stack: l, digest: null };
  }
  function ol(e, t, i) {
    return { value: e, source: null, stack: i ?? null, digest: t ?? null };
  }
  function sl(e, t) {
    try {
      console.error(t.value);
    } catch (i) {
      setTimeout(function() {
        throw i;
      });
    }
  }
  var Sg = typeof WeakMap == "function" ? WeakMap : Map;
  function vd(e, t, i) {
    i = rn(-1, i), i.tag = 3, i.payload = { element: null };
    var s = t.value;
    return i.callback = function() {
      Uo || (Uo = !0, Sl = s), sl(e, t);
    }, i;
  }
  function xd(e, t, i) {
    i = rn(-1, i), i.tag = 3;
    var s = e.type.getDerivedStateFromError;
    if (typeof s == "function") {
      var l = t.value;
      i.payload = function() {
        return s(l);
      }, i.callback = function() {
        sl(e, t);
      };
    }
    var c = e.stateNode;
    return c !== null && typeof c.componentDidCatch == "function" && (i.callback = function() {
      sl(e, t), typeof s != "function" && (Cn === null ? Cn = /* @__PURE__ */ new Set([this]) : Cn.add(this));
      var p = t.stack;
      this.componentDidCatch(t.value, { componentStack: p !== null ? p : "" });
    }), i;
  }
  function wd(e, t, i) {
    var s = e.pingCache;
    if (s === null) {
      s = e.pingCache = new Sg();
      var l = /* @__PURE__ */ new Set();
      s.set(t, l);
    } else l = s.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), s.set(t, l));
    l.has(i) || (l.add(i), e = _g.bind(null, e, t, i), t.then(e, e));
  }
  function Sd(e) {
    do {
      var t;
      if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function kd(e, t, i, s, l) {
    return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, i.flags |= 131072, i.flags &= -52805, i.tag === 1 && (i.alternate === null ? i.tag = 17 : (t = rn(-1, 1), t.tag = 2, Sn(i, t, 1))), i.lanes |= 1), e) : (e.flags |= 65536, e.lanes = l, e);
  }
  var kg = b.ReactCurrentOwner, ut = !1;
  function rt(e, t, i, s) {
    t.child = e === null ? $f(t, null, i, s) : Sr(t, e.child, i, s);
  }
  function Cd(e, t, i, s, l) {
    i = i.render;
    var c = t.ref;
    return Cr(t, l), s = qa(e, t, i, s, c, l), i = Za(), e !== null && !ut ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, on(e, t, l)) : (Le && i && Na(t), t.flags |= 1, rt(e, t, s, l), t.child);
  }
  function Td(e, t, i, s, l) {
    if (e === null) {
      var c = i.type;
      return typeof c == "function" && !Rl(c) && c.defaultProps === void 0 && i.compare === null && i.defaultProps === void 0 ? (t.tag = 15, t.type = c, Pd(e, t, c, s, l)) : (e = Qo(i.type, null, s, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (c = e.child, (e.lanes & l) === 0) {
      var p = c.memoizedProps;
      if (i = i.compare, i = i !== null ? i : si, i(p, s) && e.ref === t.ref) return on(e, t, l);
    }
    return t.flags |= 1, e = jn(c, s), e.ref = t.ref, e.return = t, t.child = e;
  }
  function Pd(e, t, i, s, l) {
    if (e !== null) {
      var c = e.memoizedProps;
      if (si(c, s) && e.ref === t.ref) if (ut = !1, t.pendingProps = s = c, (e.lanes & l) !== 0) (e.flags & 131072) !== 0 && (ut = !0);
      else return t.lanes = e.lanes, on(e, t, l);
    }
    return al(e, t, i, s, l);
  }
  function Ed(e, t, i) {
    var s = t.pendingProps, l = s.children, c = e !== null ? e.memoizedState : null;
    if (s.mode === "hidden") if ((t.mode & 1) === 0) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, Re(jr, vt), vt |= i;
    else {
      if ((i & 1073741824) === 0) return e = c !== null ? c.baseLanes | i : i, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, Re(jr, vt), vt |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, s = c !== null ? c.baseLanes : i, Re(jr, vt), vt |= s;
    }
    else c !== null ? (s = c.baseLanes | i, t.memoizedState = null) : s = i, Re(jr, vt), vt |= s;
    return rt(e, t, l, i), t.child;
  }
  function jd(e, t) {
    var i = t.ref;
    (e === null && i !== null || e !== null && e.ref !== i) && (t.flags |= 512, t.flags |= 2097152);
  }
  function al(e, t, i, s, l) {
    var c = lt(i) ? In : Ze.current;
    return c = gr(t, c), Cr(t, l), i = qa(e, t, i, s, c, l), s = Za(), e !== null && !ut ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, on(e, t, l)) : (Le && s && Na(t), t.flags |= 1, rt(e, t, i, l), t.child);
  }
  function Rd(e, t, i, s, l) {
    if (lt(i)) {
      var c = !0;
      So(t);
    } else c = !1;
    if (Cr(t, l), t.stateNode === null) bo(e, t), yd(t, i, s), il(t, i, s, l), s = !0;
    else if (e === null) {
      var p = t.stateNode, w = t.memoizedProps;
      p.props = w;
      var k = p.context, R = i.contextType;
      typeof R == "object" && R !== null ? R = kt(R) : (R = lt(i) ? In : Ze.current, R = gr(t, R));
      var F = i.getDerivedStateFromProps, O = typeof F == "function" || typeof p.getSnapshotBeforeUpdate == "function";
      O || typeof p.UNSAFE_componentWillReceiveProps != "function" && typeof p.componentWillReceiveProps != "function" || (w !== s || k !== R) && gd(t, p, s, R), wn = !1;
      var I = t.memoizedState;
      p.state = I, Ao(t, s, p, l), k = t.memoizedState, w !== s || I !== k || at.current || wn ? (typeof F == "function" && (rl(t, i, F, s), k = t.memoizedState), (w = wn || md(t, i, w, s, I, k, R)) ? (O || typeof p.UNSAFE_componentWillMount != "function" && typeof p.componentWillMount != "function" || (typeof p.componentWillMount == "function" && p.componentWillMount(), typeof p.UNSAFE_componentWillMount == "function" && p.UNSAFE_componentWillMount()), typeof p.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof p.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = s, t.memoizedState = k), p.props = s, p.state = k, p.context = R, s = w) : (typeof p.componentDidMount == "function" && (t.flags |= 4194308), s = !1);
    } else {
      p = t.stateNode, Uf(e, t), w = t.memoizedProps, R = t.type === t.elementType ? w : Lt(t.type, w), p.props = R, O = t.pendingProps, I = p.context, k = i.contextType, typeof k == "object" && k !== null ? k = kt(k) : (k = lt(i) ? In : Ze.current, k = gr(t, k));
      var H = i.getDerivedStateFromProps;
      (F = typeof H == "function" || typeof p.getSnapshotBeforeUpdate == "function") || typeof p.UNSAFE_componentWillReceiveProps != "function" && typeof p.componentWillReceiveProps != "function" || (w !== O || I !== k) && gd(t, p, s, k), wn = !1, I = t.memoizedState, p.state = I, Ao(t, s, p, l);
      var Q = t.memoizedState;
      w !== O || I !== Q || at.current || wn ? (typeof H == "function" && (rl(t, i, H, s), Q = t.memoizedState), (R = wn || md(t, i, R, s, I, Q, k) || !1) ? (F || typeof p.UNSAFE_componentWillUpdate != "function" && typeof p.componentWillUpdate != "function" || (typeof p.componentWillUpdate == "function" && p.componentWillUpdate(s, Q, k), typeof p.UNSAFE_componentWillUpdate == "function" && p.UNSAFE_componentWillUpdate(s, Q, k)), typeof p.componentDidUpdate == "function" && (t.flags |= 4), typeof p.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof p.componentDidUpdate != "function" || w === e.memoizedProps && I === e.memoizedState || (t.flags |= 4), typeof p.getSnapshotBeforeUpdate != "function" || w === e.memoizedProps && I === e.memoizedState || (t.flags |= 1024), t.memoizedProps = s, t.memoizedState = Q), p.props = s, p.state = Q, p.context = k, s = R) : (typeof p.componentDidUpdate != "function" || w === e.memoizedProps && I === e.memoizedState || (t.flags |= 4), typeof p.getSnapshotBeforeUpdate != "function" || w === e.memoizedProps && I === e.memoizedState || (t.flags |= 1024), s = !1);
    }
    return ll(e, t, i, s, c, l);
  }
  function ll(e, t, i, s, l, c) {
    jd(e, t);
    var p = (t.flags & 128) !== 0;
    if (!s && !p) return l && Vf(t, i, !1), on(e, t, c);
    s = t.stateNode, kg.current = t;
    var w = p && typeof i.getDerivedStateFromError != "function" ? null : s.render();
    return t.flags |= 1, e !== null && p ? (t.child = Sr(t, e.child, null, c), t.child = Sr(t, null, w, c)) : rt(e, t, w, c), t.memoizedState = s.state, l && Vf(t, i, !0), t.child;
  }
  function Md(e) {
    var t = e.stateNode;
    t.pendingContext ? Df(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Df(e, t.context, !1), Ha(e, t.containerInfo);
  }
  function Ad(e, t, i, s, l) {
    return wr(), Fa(l), t.flags |= 256, rt(e, t, i, s), t.child;
  }
  var ul = { dehydrated: null, treeContext: null, retryLane: 0 };
  function cl(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function Dd(e, t, i) {
    var s = t.pendingProps, l = Ve.current, c = !1, p = (t.flags & 128) !== 0, w;
    if ((w = p) || (w = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), w ? (c = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), Re(Ve, l & 1), e === null)
      return Ia(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (p = s.children, e = s.fallback, c ? (s = t.mode, c = t.child, p = { mode: "hidden", children: p }, (s & 1) === 0 && c !== null ? (c.childLanes = 0, c.pendingProps = p) : c = qo(p, s, 0, null), e = Gn(e, s, i, null), c.return = t, e.return = t, c.sibling = e, t.child = c, t.child.memoizedState = cl(i), t.memoizedState = ul, e) : fl(t, p));
    if (l = e.memoizedState, l !== null && (w = l.dehydrated, w !== null)) return Cg(e, t, p, s, w, l, i);
    if (c) {
      c = s.fallback, p = t.mode, l = e.child, w = l.sibling;
      var k = { mode: "hidden", children: s.children };
      return (p & 1) === 0 && t.child !== l ? (s = t.child, s.childLanes = 0, s.pendingProps = k, t.deletions = null) : (s = jn(l, k), s.subtreeFlags = l.subtreeFlags & 14680064), w !== null ? c = jn(w, c) : (c = Gn(c, p, i, null), c.flags |= 2), c.return = t, s.return = t, s.sibling = c, t.child = s, s = c, c = t.child, p = e.child.memoizedState, p = p === null ? cl(i) : { baseLanes: p.baseLanes | i, cachePool: null, transitions: p.transitions }, c.memoizedState = p, c.childLanes = e.childLanes & ~i, t.memoizedState = ul, s;
    }
    return c = e.child, e = c.sibling, s = jn(c, { mode: "visible", children: s.children }), (t.mode & 1) === 0 && (s.lanes = i), s.return = t, s.sibling = null, e !== null && (i = t.deletions, i === null ? (t.deletions = [e], t.flags |= 16) : i.push(e)), t.child = s, t.memoizedState = null, s;
  }
  function fl(e, t) {
    return t = qo({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
  }
  function Fo(e, t, i, s) {
    return s !== null && Fa(s), Sr(t, e.child, null, i), e = fl(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function Cg(e, t, i, s, l, c, p) {
    if (i)
      return t.flags & 256 ? (t.flags &= -257, s = ol(Error(o(422))), Fo(e, t, p, s)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (c = s.fallback, l = t.mode, s = qo({ mode: "visible", children: s.children }, l, 0, null), c = Gn(c, l, p, null), c.flags |= 2, s.return = t, c.return = t, s.sibling = c, t.child = s, (t.mode & 1) !== 0 && Sr(t, e.child, null, p), t.child.memoizedState = cl(p), t.memoizedState = ul, c);
    if ((t.mode & 1) === 0) return Fo(e, t, p, null);
    if (l.data === "$!") {
      if (s = l.nextSibling && l.nextSibling.dataset, s) var w = s.dgst;
      return s = w, c = Error(o(419)), s = ol(c, s, void 0), Fo(e, t, p, s);
    }
    if (w = (p & e.childLanes) !== 0, ut || w) {
      if (s = He, s !== null) {
        switch (p & -p) {
          case 4:
            l = 2;
            break;
          case 16:
            l = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            l = 32;
            break;
          case 536870912:
            l = 268435456;
            break;
          default:
            l = 0;
        }
        l = (l & (s.suspendedLanes | p)) !== 0 ? 0 : l, l !== 0 && l !== c.retryLane && (c.retryLane = l, nn(e, l), _t(s, e, l, -1));
      }
      return jl(), s = ol(Error(o(421))), Fo(e, t, p, s);
    }
    return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = zg.bind(null, e), l._reactRetry = t, null) : (e = c.treeContext, gt = yn(l.nextSibling), yt = t, Le = !0, Dt = null, e !== null && (wt[St++] = en, wt[St++] = tn, wt[St++] = Fn, en = e.id, tn = e.overflow, Fn = t), t = fl(t, s.children), t.flags |= 4096, t);
  }
  function Ld(e, t, i) {
    e.lanes |= t;
    var s = e.alternate;
    s !== null && (s.lanes |= t), $a(e.return, t, i);
  }
  function dl(e, t, i, s, l) {
    var c = e.memoizedState;
    c === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: s, tail: i, tailMode: l } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = s, c.tail = i, c.tailMode = l);
  }
  function Vd(e, t, i) {
    var s = t.pendingProps, l = s.revealOrder, c = s.tail;
    if (rt(e, t, s.children, i), s = Ve.current, (s & 2) !== 0) s = s & 1 | 2, t.flags |= 128;
    else {
      if (e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Ld(e, i, t);
        else if (e.tag === 19) Ld(e, i, t);
        else if (e.child !== null) {
          e.child.return = e, e = e.child;
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
      s &= 1;
    }
    if (Re(Ve, s), (t.mode & 1) === 0) t.memoizedState = null;
    else switch (l) {
      case "forwards":
        for (i = t.child, l = null; i !== null; ) e = i.alternate, e !== null && Do(e) === null && (l = i), i = i.sibling;
        i = l, i === null ? (l = t.child, t.child = null) : (l = i.sibling, i.sibling = null), dl(t, !1, l, i, c);
        break;
      case "backwards":
        for (i = null, l = t.child, t.child = null; l !== null; ) {
          if (e = l.alternate, e !== null && Do(e) === null) {
            t.child = l;
            break;
          }
          e = l.sibling, l.sibling = i, i = l, l = e;
        }
        dl(t, !0, i, null, c);
        break;
      case "together":
        dl(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function bo(e, t) {
    (t.mode & 1) === 0 && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
  }
  function on(e, t, i) {
    if (e !== null && (t.dependencies = e.dependencies), Wn |= t.lanes, (i & t.childLanes) === 0) return null;
    if (e !== null && t.child !== e.child) throw Error(o(153));
    if (t.child !== null) {
      for (e = t.child, i = jn(e, e.pendingProps), t.child = i, i.return = t; e.sibling !== null; ) e = e.sibling, i = i.sibling = jn(e, e.pendingProps), i.return = t;
      i.sibling = null;
    }
    return t.child;
  }
  function Tg(e, t, i) {
    switch (t.tag) {
      case 3:
        Md(t), wr();
        break;
      case 5:
        Gf(t);
        break;
      case 1:
        lt(t.type) && So(t);
        break;
      case 4:
        Ha(t, t.stateNode.containerInfo);
        break;
      case 10:
        var s = t.type._context, l = t.memoizedProps.value;
        Re(jo, s._currentValue), s._currentValue = l;
        break;
      case 13:
        if (s = t.memoizedState, s !== null)
          return s.dehydrated !== null ? (Re(Ve, Ve.current & 1), t.flags |= 128, null) : (i & t.child.childLanes) !== 0 ? Dd(e, t, i) : (Re(Ve, Ve.current & 1), e = on(e, t, i), e !== null ? e.sibling : null);
        Re(Ve, Ve.current & 1);
        break;
      case 19:
        if (s = (i & t.childLanes) !== 0, (e.flags & 128) !== 0) {
          if (s) return Vd(e, t, i);
          t.flags |= 128;
        }
        if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), Re(Ve, Ve.current), s) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, Ed(e, t, i);
    }
    return on(e, t, i);
  }
  var Nd, hl, _d, zd;
  Nd = function(e, t) {
    for (var i = t.child; i !== null; ) {
      if (i.tag === 5 || i.tag === 6) e.appendChild(i.stateNode);
      else if (i.tag !== 4 && i.child !== null) {
        i.child.return = i, i = i.child;
        continue;
      }
      if (i === t) break;
      for (; i.sibling === null; ) {
        if (i.return === null || i.return === t) return;
        i = i.return;
      }
      i.sibling.return = i.return, i = i.sibling;
    }
  }, hl = function() {
  }, _d = function(e, t, i, s) {
    var l = e.memoizedProps;
    if (l !== s) {
      e = t.stateNode, Bn(Bt.current);
      var c = null;
      switch (i) {
        case "input":
          l = $s(e, l), s = $s(e, s), c = [];
          break;
        case "select":
          l = U({}, l, { value: void 0 }), s = U({}, s, { value: void 0 }), c = [];
          break;
        case "textarea":
          l = Hs(e, l), s = Hs(e, s), c = [];
          break;
        default:
          typeof l.onClick != "function" && typeof s.onClick == "function" && (e.onclick = vo);
      }
      Gs(i, s);
      var p;
      i = null;
      for (R in l) if (!s.hasOwnProperty(R) && l.hasOwnProperty(R) && l[R] != null) if (R === "style") {
        var w = l[R];
        for (p in w) w.hasOwnProperty(p) && (i || (i = {}), i[p] = "");
      } else R !== "dangerouslySetInnerHTML" && R !== "children" && R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && R !== "autoFocus" && (u.hasOwnProperty(R) ? c || (c = []) : (c = c || []).push(R, null));
      for (R in s) {
        var k = s[R];
        if (w = l?.[R], s.hasOwnProperty(R) && k !== w && (k != null || w != null)) if (R === "style") if (w) {
          for (p in w) !w.hasOwnProperty(p) || k && k.hasOwnProperty(p) || (i || (i = {}), i[p] = "");
          for (p in k) k.hasOwnProperty(p) && w[p] !== k[p] && (i || (i = {}), i[p] = k[p]);
        } else i || (c || (c = []), c.push(
          R,
          i
        )), i = k;
        else R === "dangerouslySetInnerHTML" ? (k = k ? k.__html : void 0, w = w ? w.__html : void 0, k != null && w !== k && (c = c || []).push(R, k)) : R === "children" ? typeof k != "string" && typeof k != "number" || (c = c || []).push(R, "" + k) : R !== "suppressContentEditableWarning" && R !== "suppressHydrationWarning" && (u.hasOwnProperty(R) ? (k != null && R === "onScroll" && Ae("scroll", e), c || w === k || (c = [])) : (c = c || []).push(R, k));
      }
      i && (c = c || []).push("style", i);
      var R = c;
      (t.updateQueue = R) && (t.flags |= 4);
    }
  }, zd = function(e, t, i, s) {
    i !== s && (t.flags |= 4);
  };
  function Si(e, t) {
    if (!Le) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var i = null; t !== null; ) t.alternate !== null && (i = t), t = t.sibling;
        i === null ? e.tail = null : i.sibling = null;
        break;
      case "collapsed":
        i = e.tail;
        for (var s = null; i !== null; ) i.alternate !== null && (s = i), i = i.sibling;
        s === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : s.sibling = null;
    }
  }
  function et(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, i = 0, s = 0;
    if (t) for (var l = e.child; l !== null; ) i |= l.lanes | l.childLanes, s |= l.subtreeFlags & 14680064, s |= l.flags & 14680064, l.return = e, l = l.sibling;
    else for (l = e.child; l !== null; ) i |= l.lanes | l.childLanes, s |= l.subtreeFlags, s |= l.flags, l.return = e, l = l.sibling;
    return e.subtreeFlags |= s, e.childLanes = i, t;
  }
  function Pg(e, t, i) {
    var s = t.pendingProps;
    switch (_a(t), t.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return et(t), null;
      case 1:
        return lt(t.type) && wo(), et(t), null;
      case 3:
        return s = t.stateNode, Tr(), De(at), De(Ze), Ya(), s.pendingContext && (s.context = s.pendingContext, s.pendingContext = null), (e === null || e.child === null) && (Po(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, Dt !== null && (Tl(Dt), Dt = null))), hl(e, t), et(t), null;
      case 5:
        Ka(t);
        var l = Bn(yi.current);
        if (i = t.type, e !== null && t.stateNode != null) _d(e, t, i, s, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
        else {
          if (!s) {
            if (t.stateNode === null) throw Error(o(166));
            return et(t), null;
          }
          if (e = Bn(Bt.current), Po(t)) {
            s = t.stateNode, i = t.type;
            var c = t.memoizedProps;
            switch (s[Ot] = t, s[fi] = c, e = (t.mode & 1) !== 0, i) {
              case "dialog":
                Ae("cancel", s), Ae("close", s);
                break;
              case "iframe":
              case "object":
              case "embed":
                Ae("load", s);
                break;
              case "video":
              case "audio":
                for (l = 0; l < li.length; l++) Ae(li[l], s);
                break;
              case "source":
                Ae("error", s);
                break;
              case "img":
              case "image":
              case "link":
                Ae(
                  "error",
                  s
                ), Ae("load", s);
                break;
              case "details":
                Ae("toggle", s);
                break;
              case "input":
                mc(s, c), Ae("invalid", s);
                break;
              case "select":
                s._wrapperState = { wasMultiple: !!c.multiple }, Ae("invalid", s);
                break;
              case "textarea":
                vc(s, c), Ae("invalid", s);
            }
            Gs(i, c), l = null;
            for (var p in c) if (c.hasOwnProperty(p)) {
              var w = c[p];
              p === "children" ? typeof w == "string" ? s.textContent !== w && (c.suppressHydrationWarning !== !0 && go(s.textContent, w, e), l = ["children", w]) : typeof w == "number" && s.textContent !== "" + w && (c.suppressHydrationWarning !== !0 && go(
                s.textContent,
                w,
                e
              ), l = ["children", "" + w]) : u.hasOwnProperty(p) && w != null && p === "onScroll" && Ae("scroll", s);
            }
            switch (i) {
              case "input":
                ir(s), gc(s, c, !0);
                break;
              case "textarea":
                ir(s), wc(s);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof c.onClick == "function" && (s.onclick = vo);
            }
            s = l, t.updateQueue = s, s !== null && (t.flags |= 4);
          } else {
            p = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Sc(i)), e === "http://www.w3.org/1999/xhtml" ? i === "script" ? (e = p.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof s.is == "string" ? e = p.createElement(i, { is: s.is }) : (e = p.createElement(i), i === "select" && (p = e, s.multiple ? p.multiple = !0 : s.size && (p.size = s.size))) : e = p.createElementNS(e, i), e[Ot] = t, e[fi] = s, Nd(e, t, !1, !1), t.stateNode = e;
            e: {
              switch (p = Ys(i, s), i) {
                case "dialog":
                  Ae("cancel", e), Ae("close", e), l = s;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  Ae("load", e), l = s;
                  break;
                case "video":
                case "audio":
                  for (l = 0; l < li.length; l++) Ae(li[l], e);
                  l = s;
                  break;
                case "source":
                  Ae("error", e), l = s;
                  break;
                case "img":
                case "image":
                case "link":
                  Ae(
                    "error",
                    e
                  ), Ae("load", e), l = s;
                  break;
                case "details":
                  Ae("toggle", e), l = s;
                  break;
                case "input":
                  mc(e, s), l = $s(e, s), Ae("invalid", e);
                  break;
                case "option":
                  l = s;
                  break;
                case "select":
                  e._wrapperState = { wasMultiple: !!s.multiple }, l = U({}, s, { value: void 0 }), Ae("invalid", e);
                  break;
                case "textarea":
                  vc(e, s), l = Hs(e, s), Ae("invalid", e);
                  break;
                default:
                  l = s;
              }
              Gs(i, l), w = l;
              for (c in w) if (w.hasOwnProperty(c)) {
                var k = w[c];
                c === "style" ? Tc(e, k) : c === "dangerouslySetInnerHTML" ? (k = k ? k.__html : void 0, k != null && kc(e, k)) : c === "children" ? typeof k == "string" ? (i !== "textarea" || k !== "") && Wr(e, k) : typeof k == "number" && Wr(e, "" + k) : c !== "suppressContentEditableWarning" && c !== "suppressHydrationWarning" && c !== "autoFocus" && (u.hasOwnProperty(c) ? k != null && c === "onScroll" && Ae("scroll", e) : k != null && z(e, c, k, p));
              }
              switch (i) {
                case "input":
                  ir(e), gc(e, s, !1);
                  break;
                case "textarea":
                  ir(e), wc(e);
                  break;
                case "option":
                  s.value != null && e.setAttribute("value", "" + fe(s.value));
                  break;
                case "select":
                  e.multiple = !!s.multiple, c = s.value, c != null ? or(e, !!s.multiple, c, !1) : s.defaultValue != null && or(
                    e,
                    !!s.multiple,
                    s.defaultValue,
                    !0
                  );
                  break;
                default:
                  typeof l.onClick == "function" && (e.onclick = vo);
              }
              switch (i) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  s = !!s.autoFocus;
                  break e;
                case "img":
                  s = !0;
                  break e;
                default:
                  s = !1;
              }
            }
            s && (t.flags |= 4);
          }
          t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
        }
        return et(t), null;
      case 6:
        if (e && t.stateNode != null) zd(e, t, e.memoizedProps, s);
        else {
          if (typeof s != "string" && t.stateNode === null) throw Error(o(166));
          if (i = Bn(yi.current), Bn(Bt.current), Po(t)) {
            if (s = t.stateNode, i = t.memoizedProps, s[Ot] = t, (c = s.nodeValue !== i) && (e = yt, e !== null)) switch (e.tag) {
              case 3:
                go(s.nodeValue, i, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && go(s.nodeValue, i, (e.mode & 1) !== 0);
            }
            c && (t.flags |= 4);
          } else s = (i.nodeType === 9 ? i : i.ownerDocument).createTextNode(s), s[Ot] = t, t.stateNode = s;
        }
        return et(t), null;
      case 13:
        if (De(Ve), s = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (Le && gt !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) bf(), wr(), t.flags |= 98560, c = !1;
          else if (c = Po(t), s !== null && s.dehydrated !== null) {
            if (e === null) {
              if (!c) throw Error(o(318));
              if (c = t.memoizedState, c = c !== null ? c.dehydrated : null, !c) throw Error(o(317));
              c[Ot] = t;
            } else wr(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            et(t), c = !1;
          } else Dt !== null && (Tl(Dt), Dt = null), c = !0;
          if (!c) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0 ? (t.lanes = i, t) : (s = s !== null, s !== (e !== null && e.memoizedState !== null) && s && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (Ve.current & 1) !== 0 ? $e === 0 && ($e = 3) : jl())), t.updateQueue !== null && (t.flags |= 4), et(t), null);
      case 4:
        return Tr(), hl(e, t), e === null && ui(t.stateNode.containerInfo), et(t), null;
      case 10:
        return Ba(t.type._context), et(t), null;
      case 17:
        return lt(t.type) && wo(), et(t), null;
      case 19:
        if (De(Ve), c = t.memoizedState, c === null) return et(t), null;
        if (s = (t.flags & 128) !== 0, p = c.rendering, p === null) if (s) Si(c, !1);
        else {
          if ($e !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (p = Do(e), p !== null) {
              for (t.flags |= 128, Si(c, !1), s = p.updateQueue, s !== null && (t.updateQueue = s, t.flags |= 4), t.subtreeFlags = 0, s = i, i = t.child; i !== null; ) c = i, e = s, c.flags &= 14680066, p = c.alternate, p === null ? (c.childLanes = 0, c.lanes = e, c.child = null, c.subtreeFlags = 0, c.memoizedProps = null, c.memoizedState = null, c.updateQueue = null, c.dependencies = null, c.stateNode = null) : (c.childLanes = p.childLanes, c.lanes = p.lanes, c.child = p.child, c.subtreeFlags = 0, c.deletions = null, c.memoizedProps = p.memoizedProps, c.memoizedState = p.memoizedState, c.updateQueue = p.updateQueue, c.type = p.type, e = p.dependencies, c.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), i = i.sibling;
              return Re(Ve, Ve.current & 1 | 2), t.child;
            }
            e = e.sibling;
          }
          c.tail !== null && Ie() > Rr && (t.flags |= 128, s = !0, Si(c, !1), t.lanes = 4194304);
        }
        else {
          if (!s) if (e = Do(p), e !== null) {
            if (t.flags |= 128, s = !0, i = e.updateQueue, i !== null && (t.updateQueue = i, t.flags |= 4), Si(c, !0), c.tail === null && c.tailMode === "hidden" && !p.alternate && !Le) return et(t), null;
          } else 2 * Ie() - c.renderingStartTime > Rr && i !== 1073741824 && (t.flags |= 128, s = !0, Si(c, !1), t.lanes = 4194304);
          c.isBackwards ? (p.sibling = t.child, t.child = p) : (i = c.last, i !== null ? i.sibling = p : t.child = p, c.last = p);
        }
        return c.tail !== null ? (t = c.tail, c.rendering = t, c.tail = t.sibling, c.renderingStartTime = Ie(), t.sibling = null, i = Ve.current, Re(Ve, s ? i & 1 | 2 : i & 1), t) : (et(t), null);
      case 22:
      case 23:
        return El(), s = t.memoizedState !== null, e !== null && e.memoizedState !== null !== s && (t.flags |= 8192), s && (t.mode & 1) !== 0 ? (vt & 1073741824) !== 0 && (et(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : et(t), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(o(156, t.tag));
  }
  function Eg(e, t) {
    switch (_a(t), t.tag) {
      case 1:
        return lt(t.type) && wo(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Tr(), De(at), De(Ze), Ya(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 5:
        return Ka(t), null;
      case 13:
        if (De(Ve), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(o(340));
          wr();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return De(Ve), null;
      case 4:
        return Tr(), null;
      case 10:
        return Ba(t.type._context), null;
      case 22:
      case 23:
        return El(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Oo = !1, tt = !1, jg = typeof WeakSet == "function" ? WeakSet : Set, Y = null;
  function Er(e, t) {
    var i = e.ref;
    if (i !== null) if (typeof i == "function") try {
      i(null);
    } catch (s) {
      ze(e, t, s);
    }
    else i.current = null;
  }
  function pl(e, t, i) {
    try {
      i();
    } catch (s) {
      ze(e, t, s);
    }
  }
  var Id = !1;
  function Rg(e, t) {
    if (Ea = oo, e = mf(), va(e)) {
      if ("selectionStart" in e) var i = { start: e.selectionStart, end: e.selectionEnd };
      else e: {
        i = (i = e.ownerDocument) && i.defaultView || window;
        var s = i.getSelection && i.getSelection();
        if (s && s.rangeCount !== 0) {
          i = s.anchorNode;
          var l = s.anchorOffset, c = s.focusNode;
          s = s.focusOffset;
          try {
            i.nodeType, c.nodeType;
          } catch {
            i = null;
            break e;
          }
          var p = 0, w = -1, k = -1, R = 0, F = 0, O = e, I = null;
          t: for (; ; ) {
            for (var H; O !== i || l !== 0 && O.nodeType !== 3 || (w = p + l), O !== c || s !== 0 && O.nodeType !== 3 || (k = p + s), O.nodeType === 3 && (p += O.nodeValue.length), (H = O.firstChild) !== null; )
              I = O, O = H;
            for (; ; ) {
              if (O === e) break t;
              if (I === i && ++R === l && (w = p), I === c && ++F === s && (k = p), (H = O.nextSibling) !== null) break;
              O = I, I = O.parentNode;
            }
            O = H;
          }
          i = w === -1 || k === -1 ? null : { start: w, end: k };
        } else i = null;
      }
      i = i || { start: 0, end: 0 };
    } else i = null;
    for (ja = { focusedElem: e, selectionRange: i }, oo = !1, Y = t; Y !== null; ) if (t = Y, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Y = e;
    else for (; Y !== null; ) {
      t = Y;
      try {
        var Q = t.alternate;
        if ((t.flags & 1024) !== 0) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (Q !== null) {
              var J = Q.memoizedProps, Fe = Q.memoizedState, P = t.stateNode, C = P.getSnapshotBeforeUpdate(t.elementType === t.type ? J : Lt(t.type, J), Fe);
              P.__reactInternalSnapshotBeforeUpdate = C;
            }
            break;
          case 3:
            var j = t.stateNode.containerInfo;
            j.nodeType === 1 ? j.textContent = "" : j.nodeType === 9 && j.documentElement && j.removeChild(j.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(o(163));
        }
      } catch ($) {
        ze(t, t.return, $);
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, Y = e;
        break;
      }
      Y = t.return;
    }
    return Q = Id, Id = !1, Q;
  }
  function ki(e, t, i) {
    var s = t.updateQueue;
    if (s = s !== null ? s.lastEffect : null, s !== null) {
      var l = s = s.next;
      do {
        if ((l.tag & e) === e) {
          var c = l.destroy;
          l.destroy = void 0, c !== void 0 && pl(t, i, c);
        }
        l = l.next;
      } while (l !== s);
    }
  }
  function Bo(e, t) {
    if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
      var i = t = t.next;
      do {
        if ((i.tag & e) === e) {
          var s = i.create;
          i.destroy = s();
        }
        i = i.next;
      } while (i !== t);
    }
  }
  function ml(e) {
    var t = e.ref;
    if (t !== null) {
      var i = e.stateNode;
      switch (e.tag) {
        case 5:
          e = i;
          break;
        default:
          e = i;
      }
      typeof t == "function" ? t(e) : t.current = e;
    }
  }
  function Fd(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Fd(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ot], delete t[fi], delete t[Da], delete t[cg], delete t[fg])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  function bd(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function Od(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || bd(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function yl(e, t, i) {
    var s = e.tag;
    if (s === 5 || s === 6) e = e.stateNode, t ? i.nodeType === 8 ? i.parentNode.insertBefore(e, t) : i.insertBefore(e, t) : (i.nodeType === 8 ? (t = i.parentNode, t.insertBefore(e, i)) : (t = i, t.appendChild(e)), i = i._reactRootContainer, i != null || t.onclick !== null || (t.onclick = vo));
    else if (s !== 4 && (e = e.child, e !== null)) for (yl(e, t, i), e = e.sibling; e !== null; ) yl(e, t, i), e = e.sibling;
  }
  function gl(e, t, i) {
    var s = e.tag;
    if (s === 5 || s === 6) e = e.stateNode, t ? i.insertBefore(e, t) : i.appendChild(e);
    else if (s !== 4 && (e = e.child, e !== null)) for (gl(e, t, i), e = e.sibling; e !== null; ) gl(e, t, i), e = e.sibling;
  }
  var Ge = null, Vt = !1;
  function kn(e, t, i) {
    for (i = i.child; i !== null; ) Bd(e, t, i), i = i.sibling;
  }
  function Bd(e, t, i) {
    if (bt && typeof bt.onCommitFiberUnmount == "function") try {
      bt.onCommitFiberUnmount(Ji, i);
    } catch {
    }
    switch (i.tag) {
      case 5:
        tt || Er(i, t);
      case 6:
        var s = Ge, l = Vt;
        Ge = null, kn(e, t, i), Ge = s, Vt = l, Ge !== null && (Vt ? (e = Ge, i = i.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(i) : e.removeChild(i)) : Ge.removeChild(i.stateNode));
        break;
      case 18:
        Ge !== null && (Vt ? (e = Ge, i = i.stateNode, e.nodeType === 8 ? Aa(e.parentNode, i) : e.nodeType === 1 && Aa(e, i), ei(e)) : Aa(Ge, i.stateNode));
        break;
      case 4:
        s = Ge, l = Vt, Ge = i.stateNode.containerInfo, Vt = !0, kn(e, t, i), Ge = s, Vt = l;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!tt && (s = i.updateQueue, s !== null && (s = s.lastEffect, s !== null))) {
          l = s = s.next;
          do {
            var c = l, p = c.destroy;
            c = c.tag, p !== void 0 && ((c & 2) !== 0 || (c & 4) !== 0) && pl(i, t, p), l = l.next;
          } while (l !== s);
        }
        kn(e, t, i);
        break;
      case 1:
        if (!tt && (Er(i, t), s = i.stateNode, typeof s.componentWillUnmount == "function")) try {
          s.props = i.memoizedProps, s.state = i.memoizedState, s.componentWillUnmount();
        } catch (w) {
          ze(i, t, w);
        }
        kn(e, t, i);
        break;
      case 21:
        kn(e, t, i);
        break;
      case 22:
        i.mode & 1 ? (tt = (s = tt) || i.memoizedState !== null, kn(e, t, i), tt = s) : kn(e, t, i);
        break;
      default:
        kn(e, t, i);
    }
  }
  function $d(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var i = e.stateNode;
      i === null && (i = e.stateNode = new jg()), t.forEach(function(s) {
        var l = Ig.bind(null, e, s);
        i.has(s) || (i.add(s), s.then(l, l));
      });
    }
  }
  function Nt(e, t) {
    var i = t.deletions;
    if (i !== null) for (var s = 0; s < i.length; s++) {
      var l = i[s];
      try {
        var c = e, p = t, w = p;
        e: for (; w !== null; ) {
          switch (w.tag) {
            case 5:
              Ge = w.stateNode, Vt = !1;
              break e;
            case 3:
              Ge = w.stateNode.containerInfo, Vt = !0;
              break e;
            case 4:
              Ge = w.stateNode.containerInfo, Vt = !0;
              break e;
          }
          w = w.return;
        }
        if (Ge === null) throw Error(o(160));
        Bd(c, p, l), Ge = null, Vt = !1;
        var k = l.alternate;
        k !== null && (k.return = null), l.return = null;
      } catch (R) {
        ze(l, t, R);
      }
    }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) Wd(t, e), t = t.sibling;
  }
  function Wd(e, t) {
    var i = e.alternate, s = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (Nt(t, e), Wt(e), s & 4) {
          try {
            ki(3, e, e.return), Bo(3, e);
          } catch (J) {
            ze(e, e.return, J);
          }
          try {
            ki(5, e, e.return);
          } catch (J) {
            ze(e, e.return, J);
          }
        }
        break;
      case 1:
        Nt(t, e), Wt(e), s & 512 && i !== null && Er(i, i.return);
        break;
      case 5:
        if (Nt(t, e), Wt(e), s & 512 && i !== null && Er(i, i.return), e.flags & 32) {
          var l = e.stateNode;
          try {
            Wr(l, "");
          } catch (J) {
            ze(e, e.return, J);
          }
        }
        if (s & 4 && (l = e.stateNode, l != null)) {
          var c = e.memoizedProps, p = i !== null ? i.memoizedProps : c, w = e.type, k = e.updateQueue;
          if (e.updateQueue = null, k !== null) try {
            w === "input" && c.type === "radio" && c.name != null && yc(l, c), Ys(w, p);
            var R = Ys(w, c);
            for (p = 0; p < k.length; p += 2) {
              var F = k[p], O = k[p + 1];
              F === "style" ? Tc(l, O) : F === "dangerouslySetInnerHTML" ? kc(l, O) : F === "children" ? Wr(l, O) : z(l, F, O, R);
            }
            switch (w) {
              case "input":
                Ws(l, c);
                break;
              case "textarea":
                xc(l, c);
                break;
              case "select":
                var I = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!c.multiple;
                var H = c.value;
                H != null ? or(l, !!c.multiple, H, !1) : I !== !!c.multiple && (c.defaultValue != null ? or(
                  l,
                  !!c.multiple,
                  c.defaultValue,
                  !0
                ) : or(l, !!c.multiple, c.multiple ? [] : "", !1));
            }
            l[fi] = c;
          } catch (J) {
            ze(e, e.return, J);
          }
        }
        break;
      case 6:
        if (Nt(t, e), Wt(e), s & 4) {
          if (e.stateNode === null) throw Error(o(162));
          l = e.stateNode, c = e.memoizedProps;
          try {
            l.nodeValue = c;
          } catch (J) {
            ze(e, e.return, J);
          }
        }
        break;
      case 3:
        if (Nt(t, e), Wt(e), s & 4 && i !== null && i.memoizedState.isDehydrated) try {
          ei(t.containerInfo);
        } catch (J) {
          ze(e, e.return, J);
        }
        break;
      case 4:
        Nt(t, e), Wt(e);
        break;
      case 13:
        Nt(t, e), Wt(e), l = e.child, l.flags & 8192 && (c = l.memoizedState !== null, l.stateNode.isHidden = c, !c || l.alternate !== null && l.alternate.memoizedState !== null || (wl = Ie())), s & 4 && $d(e);
        break;
      case 22:
        if (F = i !== null && i.memoizedState !== null, e.mode & 1 ? (tt = (R = tt) || F, Nt(t, e), tt = R) : Nt(t, e), Wt(e), s & 8192) {
          if (R = e.memoizedState !== null, (e.stateNode.isHidden = R) && !F && (e.mode & 1) !== 0) for (Y = e, F = e.child; F !== null; ) {
            for (O = Y = F; Y !== null; ) {
              switch (I = Y, H = I.child, I.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  ki(4, I, I.return);
                  break;
                case 1:
                  Er(I, I.return);
                  var Q = I.stateNode;
                  if (typeof Q.componentWillUnmount == "function") {
                    s = I, i = I.return;
                    try {
                      t = s, Q.props = t.memoizedProps, Q.state = t.memoizedState, Q.componentWillUnmount();
                    } catch (J) {
                      ze(s, i, J);
                    }
                  }
                  break;
                case 5:
                  Er(I, I.return);
                  break;
                case 22:
                  if (I.memoizedState !== null) {
                    Kd(O);
                    continue;
                  }
              }
              H !== null ? (H.return = I, Y = H) : Kd(O);
            }
            F = F.sibling;
          }
          e: for (F = null, O = e; ; ) {
            if (O.tag === 5) {
              if (F === null) {
                F = O;
                try {
                  l = O.stateNode, R ? (c = l.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none") : (w = O.stateNode, k = O.memoizedProps.style, p = k != null && k.hasOwnProperty("display") ? k.display : null, w.style.display = Cc("display", p));
                } catch (J) {
                  ze(e, e.return, J);
                }
              }
            } else if (O.tag === 6) {
              if (F === null) try {
                O.stateNode.nodeValue = R ? "" : O.memoizedProps;
              } catch (J) {
                ze(e, e.return, J);
              }
            } else if ((O.tag !== 22 && O.tag !== 23 || O.memoizedState === null || O === e) && O.child !== null) {
              O.child.return = O, O = O.child;
              continue;
            }
            if (O === e) break e;
            for (; O.sibling === null; ) {
              if (O.return === null || O.return === e) break e;
              F === O && (F = null), O = O.return;
            }
            F === O && (F = null), O.sibling.return = O.return, O = O.sibling;
          }
        }
        break;
      case 19:
        Nt(t, e), Wt(e), s & 4 && $d(e);
        break;
      case 21:
        break;
      default:
        Nt(
          t,
          e
        ), Wt(e);
    }
  }
  function Wt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var i = e.return; i !== null; ) {
            if (bd(i)) {
              var s = i;
              break e;
            }
            i = i.return;
          }
          throw Error(o(160));
        }
        switch (s.tag) {
          case 5:
            var l = s.stateNode;
            s.flags & 32 && (Wr(l, ""), s.flags &= -33);
            var c = Od(e);
            gl(e, c, l);
            break;
          case 3:
          case 4:
            var p = s.stateNode.containerInfo, w = Od(e);
            yl(e, w, p);
            break;
          default:
            throw Error(o(161));
        }
      } catch (k) {
        ze(e, e.return, k);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Mg(e, t, i) {
    Y = e, Ud(e);
  }
  function Ud(e, t, i) {
    for (var s = (e.mode & 1) !== 0; Y !== null; ) {
      var l = Y, c = l.child;
      if (l.tag === 22 && s) {
        var p = l.memoizedState !== null || Oo;
        if (!p) {
          var w = l.alternate, k = w !== null && w.memoizedState !== null || tt;
          w = Oo;
          var R = tt;
          if (Oo = p, (tt = k) && !R) for (Y = l; Y !== null; ) p = Y, k = p.child, p.tag === 22 && p.memoizedState !== null ? Gd(l) : k !== null ? (k.return = p, Y = k) : Gd(l);
          for (; c !== null; ) Y = c, Ud(c), c = c.sibling;
          Y = l, Oo = w, tt = R;
        }
        Hd(e);
      } else (l.subtreeFlags & 8772) !== 0 && c !== null ? (c.return = l, Y = c) : Hd(e);
    }
  }
  function Hd(e) {
    for (; Y !== null; ) {
      var t = Y;
      if ((t.flags & 8772) !== 0) {
        var i = t.alternate;
        try {
          if ((t.flags & 8772) !== 0) switch (t.tag) {
            case 0:
            case 11:
            case 15:
              tt || Bo(5, t);
              break;
            case 1:
              var s = t.stateNode;
              if (t.flags & 4 && !tt) if (i === null) s.componentDidMount();
              else {
                var l = t.elementType === t.type ? i.memoizedProps : Lt(t.type, i.memoizedProps);
                s.componentDidUpdate(l, i.memoizedState, s.__reactInternalSnapshotBeforeUpdate);
              }
              var c = t.updateQueue;
              c !== null && Kf(t, c, s);
              break;
            case 3:
              var p = t.updateQueue;
              if (p !== null) {
                if (i = null, t.child !== null) switch (t.child.tag) {
                  case 5:
                    i = t.child.stateNode;
                    break;
                  case 1:
                    i = t.child.stateNode;
                }
                Kf(t, p, i);
              }
              break;
            case 5:
              var w = t.stateNode;
              if (i === null && t.flags & 4) {
                i = w;
                var k = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    k.autoFocus && i.focus();
                    break;
                  case "img":
                    k.src && (i.src = k.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var R = t.alternate;
                if (R !== null) {
                  var F = R.memoizedState;
                  if (F !== null) {
                    var O = F.dehydrated;
                    O !== null && ei(O);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(o(163));
          }
          tt || t.flags & 512 && ml(t);
        } catch (I) {
          ze(t, t.return, I);
        }
      }
      if (t === e) {
        Y = null;
        break;
      }
      if (i = t.sibling, i !== null) {
        i.return = t.return, Y = i;
        break;
      }
      Y = t.return;
    }
  }
  function Kd(e) {
    for (; Y !== null; ) {
      var t = Y;
      if (t === e) {
        Y = null;
        break;
      }
      var i = t.sibling;
      if (i !== null) {
        i.return = t.return, Y = i;
        break;
      }
      Y = t.return;
    }
  }
  function Gd(e) {
    for (; Y !== null; ) {
      var t = Y;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var i = t.return;
            try {
              Bo(4, t);
            } catch (k) {
              ze(t, i, k);
            }
            break;
          case 1:
            var s = t.stateNode;
            if (typeof s.componentDidMount == "function") {
              var l = t.return;
              try {
                s.componentDidMount();
              } catch (k) {
                ze(t, l, k);
              }
            }
            var c = t.return;
            try {
              ml(t);
            } catch (k) {
              ze(t, c, k);
            }
            break;
          case 5:
            var p = t.return;
            try {
              ml(t);
            } catch (k) {
              ze(t, p, k);
            }
        }
      } catch (k) {
        ze(t, t.return, k);
      }
      if (t === e) {
        Y = null;
        break;
      }
      var w = t.sibling;
      if (w !== null) {
        w.return = t.return, Y = w;
        break;
      }
      Y = t.return;
    }
  }
  var Ag = Math.ceil, $o = b.ReactCurrentDispatcher, vl = b.ReactCurrentOwner, Tt = b.ReactCurrentBatchConfig, xe = 0, He = null, be = null, Ye = 0, vt = 0, jr = gn(0), $e = 0, Ci = null, Wn = 0, Wo = 0, xl = 0, Ti = null, ct = null, wl = 0, Rr = 1 / 0, sn = null, Uo = !1, Sl = null, Cn = null, Ho = !1, Tn = null, Ko = 0, Pi = 0, kl = null, Go = -1, Yo = 0;
  function it() {
    return (xe & 6) !== 0 ? Ie() : Go !== -1 ? Go : Go = Ie();
  }
  function Pn(e) {
    return (e.mode & 1) === 0 ? 1 : (xe & 2) !== 0 && Ye !== 0 ? Ye & -Ye : hg.transition !== null ? (Yo === 0 && (Yo = bc()), Yo) : (e = Ce, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Yc(e.type)), e);
  }
  function _t(e, t, i, s) {
    if (50 < Pi) throw Pi = 0, kl = null, Error(o(185));
    Xr(e, i, s), ((xe & 2) === 0 || e !== He) && (e === He && ((xe & 2) === 0 && (Wo |= i), $e === 4 && En(e, Ye)), ft(e, s), i === 1 && xe === 0 && (t.mode & 1) === 0 && (Rr = Ie() + 500, ko && xn()));
  }
  function ft(e, t) {
    var i = e.callbackNode;
    hy(e, t);
    var s = no(e, e === He ? Ye : 0);
    if (s === 0) i !== null && zc(i), e.callbackNode = null, e.callbackPriority = 0;
    else if (t = s & -s, e.callbackPriority !== t) {
      if (i != null && zc(i), t === 1) e.tag === 0 ? dg(Xd.bind(null, e)) : Nf(Xd.bind(null, e)), lg(function() {
        (xe & 6) === 0 && xn();
      }), i = null;
      else {
        switch (Oc(s)) {
          case 1:
            i = ta;
            break;
          case 4:
            i = Ic;
            break;
          case 16:
            i = Zi;
            break;
          case 536870912:
            i = Fc;
            break;
          default:
            i = Zi;
        }
        i = rh(i, Yd.bind(null, e));
      }
      e.callbackPriority = t, e.callbackNode = i;
    }
  }
  function Yd(e, t) {
    if (Go = -1, Yo = 0, (xe & 6) !== 0) throw Error(o(327));
    var i = e.callbackNode;
    if (Mr() && e.callbackNode !== i) return null;
    var s = no(e, e === He ? Ye : 0);
    if (s === 0) return null;
    if ((s & 30) !== 0 || (s & e.expiredLanes) !== 0 || t) t = Xo(e, s);
    else {
      t = s;
      var l = xe;
      xe |= 2;
      var c = qd();
      (He !== e || Ye !== t) && (sn = null, Rr = Ie() + 500, Hn(e, t));
      do
        try {
          Vg();
          break;
        } catch (w) {
          Qd(e, w);
        }
      while (!0);
      Oa(), $o.current = c, xe = l, be !== null ? t = 0 : (He = null, Ye = 0, t = $e);
    }
    if (t !== 0) {
      if (t === 2 && (l = na(e), l !== 0 && (s = l, t = Cl(e, l))), t === 1) throw i = Ci, Hn(e, 0), En(e, s), ft(e, Ie()), i;
      if (t === 6) En(e, s);
      else {
        if (l = e.current.alternate, (s & 30) === 0 && !Dg(l) && (t = Xo(e, s), t === 2 && (c = na(e), c !== 0 && (s = c, t = Cl(e, c))), t === 1)) throw i = Ci, Hn(e, 0), En(e, s), ft(e, Ie()), i;
        switch (e.finishedWork = l, e.finishedLanes = s, t) {
          case 0:
          case 1:
            throw Error(o(345));
          case 2:
            Kn(e, ct, sn);
            break;
          case 3:
            if (En(e, s), (s & 130023424) === s && (t = wl + 500 - Ie(), 10 < t)) {
              if (no(e, 0) !== 0) break;
              if (l = e.suspendedLanes, (l & s) !== s) {
                it(), e.pingedLanes |= e.suspendedLanes & l;
                break;
              }
              e.timeoutHandle = Ma(Kn.bind(null, e, ct, sn), t);
              break;
            }
            Kn(e, ct, sn);
            break;
          case 4:
            if (En(e, s), (s & 4194240) === s) break;
            for (t = e.eventTimes, l = -1; 0 < s; ) {
              var p = 31 - Mt(s);
              c = 1 << p, p = t[p], p > l && (l = p), s &= ~c;
            }
            if (s = l, s = Ie() - s, s = (120 > s ? 120 : 480 > s ? 480 : 1080 > s ? 1080 : 1920 > s ? 1920 : 3e3 > s ? 3e3 : 4320 > s ? 4320 : 1960 * Ag(s / 1960)) - s, 10 < s) {
              e.timeoutHandle = Ma(Kn.bind(null, e, ct, sn), s);
              break;
            }
            Kn(e, ct, sn);
            break;
          case 5:
            Kn(e, ct, sn);
            break;
          default:
            throw Error(o(329));
        }
      }
    }
    return ft(e, Ie()), e.callbackNode === i ? Yd.bind(null, e) : null;
  }
  function Cl(e, t) {
    var i = Ti;
    return e.current.memoizedState.isDehydrated && (Hn(e, t).flags |= 256), e = Xo(e, t), e !== 2 && (t = ct, ct = i, t !== null && Tl(t)), e;
  }
  function Tl(e) {
    ct === null ? ct = e : ct.push.apply(ct, e);
  }
  function Dg(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var i = t.updateQueue;
        if (i !== null && (i = i.stores, i !== null)) for (var s = 0; s < i.length; s++) {
          var l = i[s], c = l.getSnapshot;
          l = l.value;
          try {
            if (!At(c(), l)) return !1;
          } catch {
            return !1;
          }
        }
      }
      if (i = t.child, t.subtreeFlags & 16384 && i !== null) i.return = t, t = i;
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function En(e, t) {
    for (t &= ~xl, t &= ~Wo, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var i = 31 - Mt(t), s = 1 << i;
      e[i] = -1, t &= ~s;
    }
  }
  function Xd(e) {
    if ((xe & 6) !== 0) throw Error(o(327));
    Mr();
    var t = no(e, 0);
    if ((t & 1) === 0) return ft(e, Ie()), null;
    var i = Xo(e, t);
    if (e.tag !== 0 && i === 2) {
      var s = na(e);
      s !== 0 && (t = s, i = Cl(e, s));
    }
    if (i === 1) throw i = Ci, Hn(e, 0), En(e, t), ft(e, Ie()), i;
    if (i === 6) throw Error(o(345));
    return e.finishedWork = e.current.alternate, e.finishedLanes = t, Kn(e, ct, sn), ft(e, Ie()), null;
  }
  function Pl(e, t) {
    var i = xe;
    xe |= 1;
    try {
      return e(t);
    } finally {
      xe = i, xe === 0 && (Rr = Ie() + 500, ko && xn());
    }
  }
  function Un(e) {
    Tn !== null && Tn.tag === 0 && (xe & 6) === 0 && Mr();
    var t = xe;
    xe |= 1;
    var i = Tt.transition, s = Ce;
    try {
      if (Tt.transition = null, Ce = 1, e) return e();
    } finally {
      Ce = s, Tt.transition = i, xe = t, (xe & 6) === 0 && xn();
    }
  }
  function El() {
    vt = jr.current, De(jr);
  }
  function Hn(e, t) {
    e.finishedWork = null, e.finishedLanes = 0;
    var i = e.timeoutHandle;
    if (i !== -1 && (e.timeoutHandle = -1, ag(i)), be !== null) for (i = be.return; i !== null; ) {
      var s = i;
      switch (_a(s), s.tag) {
        case 1:
          s = s.type.childContextTypes, s != null && wo();
          break;
        case 3:
          Tr(), De(at), De(Ze), Ya();
          break;
        case 5:
          Ka(s);
          break;
        case 4:
          Tr();
          break;
        case 13:
          De(Ve);
          break;
        case 19:
          De(Ve);
          break;
        case 10:
          Ba(s.type._context);
          break;
        case 22:
        case 23:
          El();
      }
      i = i.return;
    }
    if (He = e, be = e = jn(e.current, null), Ye = vt = t, $e = 0, Ci = null, xl = Wo = Wn = 0, ct = Ti = null, On !== null) {
      for (t = 0; t < On.length; t++) if (i = On[t], s = i.interleaved, s !== null) {
        i.interleaved = null;
        var l = s.next, c = i.pending;
        if (c !== null) {
          var p = c.next;
          c.next = l, s.next = p;
        }
        i.pending = s;
      }
      On = null;
    }
    return e;
  }
  function Qd(e, t) {
    do {
      var i = be;
      try {
        if (Oa(), Lo.current = zo, Vo) {
          for (var s = Ne.memoizedState; s !== null; ) {
            var l = s.queue;
            l !== null && (l.pending = null), s = s.next;
          }
          Vo = !1;
        }
        if ($n = 0, Ue = Be = Ne = null, gi = !1, vi = 0, vl.current = null, i === null || i.return === null) {
          $e = 1, Ci = t, be = null;
          break;
        }
        e: {
          var c = e, p = i.return, w = i, k = t;
          if (t = Ye, w.flags |= 32768, k !== null && typeof k == "object" && typeof k.then == "function") {
            var R = k, F = w, O = F.tag;
            if ((F.mode & 1) === 0 && (O === 0 || O === 11 || O === 15)) {
              var I = F.alternate;
              I ? (F.updateQueue = I.updateQueue, F.memoizedState = I.memoizedState, F.lanes = I.lanes) : (F.updateQueue = null, F.memoizedState = null);
            }
            var H = Sd(p);
            if (H !== null) {
              H.flags &= -257, kd(H, p, w, c, t), H.mode & 1 && wd(c, R, t), t = H, k = R;
              var Q = t.updateQueue;
              if (Q === null) {
                var J = /* @__PURE__ */ new Set();
                J.add(k), t.updateQueue = J;
              } else Q.add(k);
              break e;
            } else {
              if ((t & 1) === 0) {
                wd(c, R, t), jl();
                break e;
              }
              k = Error(o(426));
            }
          } else if (Le && w.mode & 1) {
            var Fe = Sd(p);
            if (Fe !== null) {
              (Fe.flags & 65536) === 0 && (Fe.flags |= 256), kd(Fe, p, w, c, t), Fa(Pr(k, w));
              break e;
            }
          }
          c = k = Pr(k, w), $e !== 4 && ($e = 2), Ti === null ? Ti = [c] : Ti.push(c), c = p;
          do {
            switch (c.tag) {
              case 3:
                c.flags |= 65536, t &= -t, c.lanes |= t;
                var P = vd(c, k, t);
                Hf(c, P);
                break e;
              case 1:
                w = k;
                var C = c.type, j = c.stateNode;
                if ((c.flags & 128) === 0 && (typeof C.getDerivedStateFromError == "function" || j !== null && typeof j.componentDidCatch == "function" && (Cn === null || !Cn.has(j)))) {
                  c.flags |= 65536, t &= -t, c.lanes |= t;
                  var $ = xd(c, w, t);
                  Hf(c, $);
                  break e;
                }
            }
            c = c.return;
          } while (c !== null);
        }
        Jd(i);
      } catch (ne) {
        t = ne, be === i && i !== null && (be = i = i.return);
        continue;
      }
      break;
    } while (!0);
  }
  function qd() {
    var e = $o.current;
    return $o.current = zo, e === null ? zo : e;
  }
  function jl() {
    ($e === 0 || $e === 3 || $e === 2) && ($e = 4), He === null || (Wn & 268435455) === 0 && (Wo & 268435455) === 0 || En(He, Ye);
  }
  function Xo(e, t) {
    var i = xe;
    xe |= 2;
    var s = qd();
    (He !== e || Ye !== t) && (sn = null, Hn(e, t));
    do
      try {
        Lg();
        break;
      } catch (l) {
        Qd(e, l);
      }
    while (!0);
    if (Oa(), xe = i, $o.current = s, be !== null) throw Error(o(261));
    return He = null, Ye = 0, $e;
  }
  function Lg() {
    for (; be !== null; ) Zd(be);
  }
  function Vg() {
    for (; be !== null && !iy(); ) Zd(be);
  }
  function Zd(e) {
    var t = nh(e.alternate, e, vt);
    e.memoizedProps = e.pendingProps, t === null ? Jd(e) : be = t, vl.current = null;
  }
  function Jd(e) {
    var t = e;
    do {
      var i = t.alternate;
      if (e = t.return, (t.flags & 32768) === 0) {
        if (i = Pg(i, t, vt), i !== null) {
          be = i;
          return;
        }
      } else {
        if (i = Eg(i, t), i !== null) {
          i.flags &= 32767, be = i;
          return;
        }
        if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
        else {
          $e = 6, be = null;
          return;
        }
      }
      if (t = t.sibling, t !== null) {
        be = t;
        return;
      }
      be = t = e;
    } while (t !== null);
    $e === 0 && ($e = 5);
  }
  function Kn(e, t, i) {
    var s = Ce, l = Tt.transition;
    try {
      Tt.transition = null, Ce = 1, Ng(e, t, i, s);
    } finally {
      Tt.transition = l, Ce = s;
    }
    return null;
  }
  function Ng(e, t, i, s) {
    do
      Mr();
    while (Tn !== null);
    if ((xe & 6) !== 0) throw Error(o(327));
    i = e.finishedWork;
    var l = e.finishedLanes;
    if (i === null) return null;
    if (e.finishedWork = null, e.finishedLanes = 0, i === e.current) throw Error(o(177));
    e.callbackNode = null, e.callbackPriority = 0;
    var c = i.lanes | i.childLanes;
    if (py(e, c), e === He && (be = He = null, Ye = 0), (i.subtreeFlags & 2064) === 0 && (i.flags & 2064) === 0 || Ho || (Ho = !0, rh(Zi, function() {
      return Mr(), null;
    })), c = (i.flags & 15990) !== 0, (i.subtreeFlags & 15990) !== 0 || c) {
      c = Tt.transition, Tt.transition = null;
      var p = Ce;
      Ce = 1;
      var w = xe;
      xe |= 4, vl.current = null, Rg(e, i), Wd(i, e), eg(ja), oo = !!Ea, ja = Ea = null, e.current = i, Mg(i), oy(), xe = w, Ce = p, Tt.transition = c;
    } else e.current = i;
    if (Ho && (Ho = !1, Tn = e, Ko = l), c = e.pendingLanes, c === 0 && (Cn = null), ly(i.stateNode), ft(e, Ie()), t !== null) for (s = e.onRecoverableError, i = 0; i < t.length; i++) l = t[i], s(l.value, { componentStack: l.stack, digest: l.digest });
    if (Uo) throw Uo = !1, e = Sl, Sl = null, e;
    return (Ko & 1) !== 0 && e.tag !== 0 && Mr(), c = e.pendingLanes, (c & 1) !== 0 ? e === kl ? Pi++ : (Pi = 0, kl = e) : Pi = 0, xn(), null;
  }
  function Mr() {
    if (Tn !== null) {
      var e = Oc(Ko), t = Tt.transition, i = Ce;
      try {
        if (Tt.transition = null, Ce = 16 > e ? 16 : e, Tn === null) var s = !1;
        else {
          if (e = Tn, Tn = null, Ko = 0, (xe & 6) !== 0) throw Error(o(331));
          var l = xe;
          for (xe |= 4, Y = e.current; Y !== null; ) {
            var c = Y, p = c.child;
            if ((Y.flags & 16) !== 0) {
              var w = c.deletions;
              if (w !== null) {
                for (var k = 0; k < w.length; k++) {
                  var R = w[k];
                  for (Y = R; Y !== null; ) {
                    var F = Y;
                    switch (F.tag) {
                      case 0:
                      case 11:
                      case 15:
                        ki(8, F, c);
                    }
                    var O = F.child;
                    if (O !== null) O.return = F, Y = O;
                    else for (; Y !== null; ) {
                      F = Y;
                      var I = F.sibling, H = F.return;
                      if (Fd(F), F === R) {
                        Y = null;
                        break;
                      }
                      if (I !== null) {
                        I.return = H, Y = I;
                        break;
                      }
                      Y = H;
                    }
                  }
                }
                var Q = c.alternate;
                if (Q !== null) {
                  var J = Q.child;
                  if (J !== null) {
                    Q.child = null;
                    do {
                      var Fe = J.sibling;
                      J.sibling = null, J = Fe;
                    } while (J !== null);
                  }
                }
                Y = c;
              }
            }
            if ((c.subtreeFlags & 2064) !== 0 && p !== null) p.return = c, Y = p;
            else e: for (; Y !== null; ) {
              if (c = Y, (c.flags & 2048) !== 0) switch (c.tag) {
                case 0:
                case 11:
                case 15:
                  ki(9, c, c.return);
              }
              var P = c.sibling;
              if (P !== null) {
                P.return = c.return, Y = P;
                break e;
              }
              Y = c.return;
            }
          }
          var C = e.current;
          for (Y = C; Y !== null; ) {
            p = Y;
            var j = p.child;
            if ((p.subtreeFlags & 2064) !== 0 && j !== null) j.return = p, Y = j;
            else e: for (p = C; Y !== null; ) {
              if (w = Y, (w.flags & 2048) !== 0) try {
                switch (w.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Bo(9, w);
                }
              } catch (ne) {
                ze(w, w.return, ne);
              }
              if (w === p) {
                Y = null;
                break e;
              }
              var $ = w.sibling;
              if ($ !== null) {
                $.return = w.return, Y = $;
                break e;
              }
              Y = w.return;
            }
          }
          if (xe = l, xn(), bt && typeof bt.onPostCommitFiberRoot == "function") try {
            bt.onPostCommitFiberRoot(Ji, e);
          } catch {
          }
          s = !0;
        }
        return s;
      } finally {
        Ce = i, Tt.transition = t;
      }
    }
    return !1;
  }
  function eh(e, t, i) {
    t = Pr(i, t), t = vd(e, t, 1), e = Sn(e, t, 1), t = it(), e !== null && (Xr(e, 1, t), ft(e, t));
  }
  function ze(e, t, i) {
    if (e.tag === 3) eh(e, e, i);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        eh(t, e, i);
        break;
      } else if (t.tag === 1) {
        var s = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof s.componentDidCatch == "function" && (Cn === null || !Cn.has(s))) {
          e = Pr(i, e), e = xd(t, e, 1), t = Sn(t, e, 1), e = it(), t !== null && (Xr(t, 1, e), ft(t, e));
          break;
        }
      }
      t = t.return;
    }
  }
  function _g(e, t, i) {
    var s = e.pingCache;
    s !== null && s.delete(t), t = it(), e.pingedLanes |= e.suspendedLanes & i, He === e && (Ye & i) === i && ($e === 4 || $e === 3 && (Ye & 130023424) === Ye && 500 > Ie() - wl ? Hn(e, 0) : xl |= i), ft(e, t);
  }
  function th(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = to, to <<= 1, (to & 130023424) === 0 && (to = 4194304)));
    var i = it();
    e = nn(e, t), e !== null && (Xr(e, t, i), ft(e, i));
  }
  function zg(e) {
    var t = e.memoizedState, i = 0;
    t !== null && (i = t.retryLane), th(e, i);
  }
  function Ig(e, t) {
    var i = 0;
    switch (e.tag) {
      case 13:
        var s = e.stateNode, l = e.memoizedState;
        l !== null && (i = l.retryLane);
        break;
      case 19:
        s = e.stateNode;
        break;
      default:
        throw Error(o(314));
    }
    s !== null && s.delete(t), th(e, i);
  }
  var nh;
  nh = function(e, t, i) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps || at.current) ut = !0;
    else {
      if ((e.lanes & i) === 0 && (t.flags & 128) === 0) return ut = !1, Tg(e, t, i);
      ut = (e.flags & 131072) !== 0;
    }
    else ut = !1, Le && (t.flags & 1048576) !== 0 && _f(t, To, t.index);
    switch (t.lanes = 0, t.tag) {
      case 2:
        var s = t.type;
        bo(e, t), e = t.pendingProps;
        var l = gr(t, Ze.current);
        Cr(t, i), l = qa(null, t, s, e, l, i);
        var c = Za();
        return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, lt(s) ? (c = !0, So(t)) : c = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Ua(t), l.updater = Io, t.stateNode = l, l._reactInternals = t, il(t, s, e, i), t = ll(null, t, s, !0, c, i)) : (t.tag = 0, Le && c && Na(t), rt(null, t, l, i), t = t.child), t;
      case 16:
        s = t.elementType;
        e: {
          switch (bo(e, t), e = t.pendingProps, l = s._init, s = l(s._payload), t.type = s, l = t.tag = bg(s), e = Lt(s, e), l) {
            case 0:
              t = al(null, t, s, e, i);
              break e;
            case 1:
              t = Rd(null, t, s, e, i);
              break e;
            case 11:
              t = Cd(null, t, s, e, i);
              break e;
            case 14:
              t = Td(null, t, s, Lt(s.type, e), i);
              break e;
          }
          throw Error(o(
            306,
            s,
            ""
          ));
        }
        return t;
      case 0:
        return s = t.type, l = t.pendingProps, l = t.elementType === s ? l : Lt(s, l), al(e, t, s, l, i);
      case 1:
        return s = t.type, l = t.pendingProps, l = t.elementType === s ? l : Lt(s, l), Rd(e, t, s, l, i);
      case 3:
        e: {
          if (Md(t), e === null) throw Error(o(387));
          s = t.pendingProps, c = t.memoizedState, l = c.element, Uf(e, t), Ao(t, s, null, i);
          var p = t.memoizedState;
          if (s = p.element, c.isDehydrated) if (c = { element: s, isDehydrated: !1, cache: p.cache, pendingSuspenseBoundaries: p.pendingSuspenseBoundaries, transitions: p.transitions }, t.updateQueue.baseState = c, t.memoizedState = c, t.flags & 256) {
            l = Pr(Error(o(423)), t), t = Ad(e, t, s, i, l);
            break e;
          } else if (s !== l) {
            l = Pr(Error(o(424)), t), t = Ad(e, t, s, i, l);
            break e;
          } else for (gt = yn(t.stateNode.containerInfo.firstChild), yt = t, Le = !0, Dt = null, i = $f(t, null, s, i), t.child = i; i; ) i.flags = i.flags & -3 | 4096, i = i.sibling;
          else {
            if (wr(), s === l) {
              t = on(e, t, i);
              break e;
            }
            rt(e, t, s, i);
          }
          t = t.child;
        }
        return t;
      case 5:
        return Gf(t), e === null && Ia(t), s = t.type, l = t.pendingProps, c = e !== null ? e.memoizedProps : null, p = l.children, Ra(s, l) ? p = null : c !== null && Ra(s, c) && (t.flags |= 32), jd(e, t), rt(e, t, p, i), t.child;
      case 6:
        return e === null && Ia(t), null;
      case 13:
        return Dd(e, t, i);
      case 4:
        return Ha(t, t.stateNode.containerInfo), s = t.pendingProps, e === null ? t.child = Sr(t, null, s, i) : rt(e, t, s, i), t.child;
      case 11:
        return s = t.type, l = t.pendingProps, l = t.elementType === s ? l : Lt(s, l), Cd(e, t, s, l, i);
      case 7:
        return rt(e, t, t.pendingProps, i), t.child;
      case 8:
        return rt(e, t, t.pendingProps.children, i), t.child;
      case 12:
        return rt(e, t, t.pendingProps.children, i), t.child;
      case 10:
        e: {
          if (s = t.type._context, l = t.pendingProps, c = t.memoizedProps, p = l.value, Re(jo, s._currentValue), s._currentValue = p, c !== null) if (At(c.value, p)) {
            if (c.children === l.children && !at.current) {
              t = on(e, t, i);
              break e;
            }
          } else for (c = t.child, c !== null && (c.return = t); c !== null; ) {
            var w = c.dependencies;
            if (w !== null) {
              p = c.child;
              for (var k = w.firstContext; k !== null; ) {
                if (k.context === s) {
                  if (c.tag === 1) {
                    k = rn(-1, i & -i), k.tag = 2;
                    var R = c.updateQueue;
                    if (R !== null) {
                      R = R.shared;
                      var F = R.pending;
                      F === null ? k.next = k : (k.next = F.next, F.next = k), R.pending = k;
                    }
                  }
                  c.lanes |= i, k = c.alternate, k !== null && (k.lanes |= i), $a(
                    c.return,
                    i,
                    t
                  ), w.lanes |= i;
                  break;
                }
                k = k.next;
              }
            } else if (c.tag === 10) p = c.type === t.type ? null : c.child;
            else if (c.tag === 18) {
              if (p = c.return, p === null) throw Error(o(341));
              p.lanes |= i, w = p.alternate, w !== null && (w.lanes |= i), $a(p, i, t), p = c.sibling;
            } else p = c.child;
            if (p !== null) p.return = c;
            else for (p = c; p !== null; ) {
              if (p === t) {
                p = null;
                break;
              }
              if (c = p.sibling, c !== null) {
                c.return = p.return, p = c;
                break;
              }
              p = p.return;
            }
            c = p;
          }
          rt(e, t, l.children, i), t = t.child;
        }
        return t;
      case 9:
        return l = t.type, s = t.pendingProps.children, Cr(t, i), l = kt(l), s = s(l), t.flags |= 1, rt(e, t, s, i), t.child;
      case 14:
        return s = t.type, l = Lt(s, t.pendingProps), l = Lt(s.type, l), Td(e, t, s, l, i);
      case 15:
        return Pd(e, t, t.type, t.pendingProps, i);
      case 17:
        return s = t.type, l = t.pendingProps, l = t.elementType === s ? l : Lt(s, l), bo(e, t), t.tag = 1, lt(s) ? (e = !0, So(t)) : e = !1, Cr(t, i), yd(t, s, l), il(t, s, l, i), ll(null, t, s, !0, e, i);
      case 19:
        return Vd(e, t, i);
      case 22:
        return Ed(e, t, i);
    }
    throw Error(o(156, t.tag));
  };
  function rh(e, t) {
    return _c(e, t);
  }
  function Fg(e, t, i, s) {
    this.tag = e, this.key = i, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = s, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Pt(e, t, i, s) {
    return new Fg(e, t, i, s);
  }
  function Rl(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function bg(e) {
    if (typeof e == "function") return Rl(e) ? 1 : 0;
    if (e != null) {
      if (e = e.$$typeof, e === ge) return 11;
      if (e === we) return 14;
    }
    return 2;
  }
  function jn(e, t) {
    var i = e.alternate;
    return i === null ? (i = Pt(e.tag, t, e.key, e.mode), i.elementType = e.elementType, i.type = e.type, i.stateNode = e.stateNode, i.alternate = e, e.alternate = i) : (i.pendingProps = t, i.type = e.type, i.flags = 0, i.subtreeFlags = 0, i.deletions = null), i.flags = e.flags & 14680064, i.childLanes = e.childLanes, i.lanes = e.lanes, i.child = e.child, i.memoizedProps = e.memoizedProps, i.memoizedState = e.memoizedState, i.updateQueue = e.updateQueue, t = e.dependencies, i.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, i.sibling = e.sibling, i.index = e.index, i.ref = e.ref, i;
  }
  function Qo(e, t, i, s, l, c) {
    var p = 2;
    if (s = e, typeof e == "function") Rl(e) && (p = 1);
    else if (typeof e == "string") p = 5;
    else e: switch (e) {
      case te:
        return Gn(i.children, l, c, t);
      case W:
        p = 8, l |= 8;
        break;
      case ae:
        return e = Pt(12, i, t, l | 2), e.elementType = ae, e.lanes = c, e;
      case ie:
        return e = Pt(13, i, t, l), e.elementType = ie, e.lanes = c, e;
      case ue:
        return e = Pt(19, i, t, l), e.elementType = ue, e.lanes = c, e;
      case je:
        return qo(i, l, c, t);
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case K:
            p = 10;
            break e;
          case ye:
            p = 9;
            break e;
          case ge:
            p = 11;
            break e;
          case we:
            p = 14;
            break e;
          case Te:
            p = 16, s = null;
            break e;
        }
        throw Error(o(130, e == null ? e : typeof e, ""));
    }
    return t = Pt(p, i, t, l), t.elementType = e, t.type = s, t.lanes = c, t;
  }
  function Gn(e, t, i, s) {
    return e = Pt(7, e, s, t), e.lanes = i, e;
  }
  function qo(e, t, i, s) {
    return e = Pt(22, e, s, t), e.elementType = je, e.lanes = i, e.stateNode = { isHidden: !1 }, e;
  }
  function Ml(e, t, i) {
    return e = Pt(6, e, null, t), e.lanes = i, e;
  }
  function Al(e, t, i) {
    return t = Pt(4, e.children !== null ? e.children : [], e.key, t), t.lanes = i, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
  }
  function Og(e, t, i, s, l) {
    this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = ra(0), this.expirationTimes = ra(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ra(0), this.identifierPrefix = s, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
  }
  function Dl(e, t, i, s, l, c, p, w, k) {
    return e = new Og(e, t, i, w, k), t === 1 ? (t = 1, c === !0 && (t |= 8)) : t = 0, c = Pt(3, null, null, t), e.current = c, c.stateNode = e, c.memoizedState = { element: s, isDehydrated: i, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Ua(c), e;
  }
  function Bg(e, t, i) {
    var s = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Z, key: s == null ? null : "" + s, children: e, containerInfo: t, implementation: i };
  }
  function ih(e) {
    if (!e) return vn;
    e = e._reactInternals;
    e: {
      if (_n(e) !== e || e.tag !== 1) throw Error(o(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (lt(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(o(171));
    }
    if (e.tag === 1) {
      var i = e.type;
      if (lt(i)) return Lf(e, i, t);
    }
    return t;
  }
  function oh(e, t, i, s, l, c, p, w, k) {
    return e = Dl(i, s, !0, e, l, c, p, w, k), e.context = ih(null), i = e.current, s = it(), l = Pn(i), c = rn(s, l), c.callback = t ?? null, Sn(i, c, l), e.current.lanes = l, Xr(e, l, s), ft(e, s), e;
  }
  function Zo(e, t, i, s) {
    var l = t.current, c = it(), p = Pn(l);
    return i = ih(i), t.context === null ? t.context = i : t.pendingContext = i, t = rn(c, p), t.payload = { element: e }, s = s === void 0 ? null : s, s !== null && (t.callback = s), e = Sn(l, t, p), e !== null && (_t(e, l, p, c), Mo(e, l, p)), p;
  }
  function Jo(e) {
    if (e = e.current, !e.child) return null;
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function sh(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var i = e.retryLane;
      e.retryLane = i !== 0 && i < t ? i : t;
    }
  }
  function Ll(e, t) {
    sh(e, t), (e = e.alternate) && sh(e, t);
  }
  function $g() {
    return null;
  }
  var ah = typeof reportError == "function" ? reportError : function(e) {
    console.error(e);
  };
  function Vl(e) {
    this._internalRoot = e;
  }
  es.prototype.render = Vl.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(o(409));
    Zo(e, t, null, null);
  }, es.prototype.unmount = Vl.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Un(function() {
        Zo(null, e, null, null);
      }), t[Zt] = null;
    }
  };
  function es(e) {
    this._internalRoot = e;
  }
  es.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = Wc();
      e = { blockedOn: null, target: e, priority: t };
      for (var i = 0; i < hn.length && t !== 0 && t < hn[i].priority; i++) ;
      hn.splice(i, 0, e), i === 0 && Kc(e);
    }
  };
  function Nl(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function ts(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
  }
  function lh() {
  }
  function Wg(e, t, i, s, l) {
    if (l) {
      if (typeof s == "function") {
        var c = s;
        s = function() {
          var R = Jo(p);
          c.call(R);
        };
      }
      var p = oh(t, s, e, 0, null, !1, !1, "", lh);
      return e._reactRootContainer = p, e[Zt] = p.current, ui(e.nodeType === 8 ? e.parentNode : e), Un(), p;
    }
    for (; l = e.lastChild; ) e.removeChild(l);
    if (typeof s == "function") {
      var w = s;
      s = function() {
        var R = Jo(k);
        w.call(R);
      };
    }
    var k = Dl(e, 0, !1, null, null, !1, !1, "", lh);
    return e._reactRootContainer = k, e[Zt] = k.current, ui(e.nodeType === 8 ? e.parentNode : e), Un(function() {
      Zo(t, k, i, s);
    }), k;
  }
  function ns(e, t, i, s, l) {
    var c = i._reactRootContainer;
    if (c) {
      var p = c;
      if (typeof l == "function") {
        var w = l;
        l = function() {
          var k = Jo(p);
          w.call(k);
        };
      }
      Zo(t, p, e, l);
    } else p = Wg(i, t, e, l, s);
    return Jo(p);
  }
  Bc = function(e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var i = Yr(t.pendingLanes);
          i !== 0 && (ia(t, i | 1), ft(t, Ie()), (xe & 6) === 0 && (Rr = Ie() + 500, xn()));
        }
        break;
      case 13:
        Un(function() {
          var s = nn(e, 1);
          if (s !== null) {
            var l = it();
            _t(s, e, 1, l);
          }
        }), Ll(e, 1);
    }
  }, oa = function(e) {
    if (e.tag === 13) {
      var t = nn(e, 134217728);
      if (t !== null) {
        var i = it();
        _t(t, e, 134217728, i);
      }
      Ll(e, 134217728);
    }
  }, $c = function(e) {
    if (e.tag === 13) {
      var t = Pn(e), i = nn(e, t);
      if (i !== null) {
        var s = it();
        _t(i, e, t, s);
      }
      Ll(e, t);
    }
  }, Wc = function() {
    return Ce;
  }, Uc = function(e, t) {
    var i = Ce;
    try {
      return Ce = e, t();
    } finally {
      Ce = i;
    }
  }, qs = function(e, t, i) {
    switch (t) {
      case "input":
        if (Ws(e, i), t = i.name, i.type === "radio" && t != null) {
          for (i = e; i.parentNode; ) i = i.parentNode;
          for (i = i.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < i.length; t++) {
            var s = i[t];
            if (s !== e && s.form === e.form) {
              var l = xo(s);
              if (!l) throw Error(o(90));
              Br(s), Ws(s, l);
            }
          }
        }
        break;
      case "textarea":
        xc(e, i);
        break;
      case "select":
        t = i.value, t != null && or(e, !!i.multiple, t, !1);
    }
  }, Rc = Pl, Mc = Un;
  var Ug = { usingClientEntryPoint: !1, Events: [di, mr, xo, Ec, jc, Pl] }, Ei = { findFiberByHostInstance: zn, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Hg = { bundleType: Ei.bundleType, version: Ei.version, rendererPackageName: Ei.rendererPackageName, rendererConfig: Ei.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: b.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
    return e = Vc(e), e === null ? null : e.stateNode;
  }, findFiberByHostInstance: Ei.findFiberByHostInstance || $g, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var rs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!rs.isDisabled && rs.supportsFiber) try {
      Ji = rs.inject(Hg), bt = rs;
    } catch {
    }
  }
  return dt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ug, dt.createPortal = function(e, t) {
    var i = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!Nl(t)) throw Error(o(200));
    return Bg(e, t, null, i);
  }, dt.createRoot = function(e, t) {
    if (!Nl(e)) throw Error(o(299));
    var i = !1, s = "", l = ah;
    return t != null && (t.unstable_strictMode === !0 && (i = !0), t.identifierPrefix !== void 0 && (s = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = Dl(e, 1, !1, null, null, i, !1, s, l), e[Zt] = t.current, ui(e.nodeType === 8 ? e.parentNode : e), new Vl(t);
  }, dt.findDOMNode = function(e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(o(188)) : (e = Object.keys(e).join(","), Error(o(268, e)));
    return e = Vc(t), e = e === null ? null : e.stateNode, e;
  }, dt.flushSync = function(e) {
    return Un(e);
  }, dt.hydrate = function(e, t, i) {
    if (!ts(t)) throw Error(o(200));
    return ns(null, e, t, !0, i);
  }, dt.hydrateRoot = function(e, t, i) {
    if (!Nl(e)) throw Error(o(405));
    var s = i != null && i.hydratedSources || null, l = !1, c = "", p = ah;
    if (i != null && (i.unstable_strictMode === !0 && (l = !0), i.identifierPrefix !== void 0 && (c = i.identifierPrefix), i.onRecoverableError !== void 0 && (p = i.onRecoverableError)), t = oh(t, null, e, 1, i ?? null, l, !1, c, p), e[Zt] = t.current, ui(e), s) for (e = 0; e < s.length; e++) i = s[e], l = i._getVersion, l = l(i._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [i, l] : t.mutableSourceEagerHydrationData.push(
      i,
      l
    );
    return new es(t);
  }, dt.render = function(e, t, i) {
    if (!ts(t)) throw Error(o(200));
    return ns(null, e, t, !1, i);
  }, dt.unmountComponentAtNode = function(e) {
    if (!ts(e)) throw Error(o(40));
    return e._reactRootContainer ? (Un(function() {
      ns(null, null, e, !1, function() {
        e._reactRootContainer = null, e[Zt] = null;
      });
    }), !0) : !1;
  }, dt.unstable_batchedUpdates = Pl, dt.unstable_renderSubtreeIntoContainer = function(e, t, i, s) {
    if (!ts(i)) throw Error(o(200));
    if (e == null || e._reactInternals === void 0) throw Error(o(38));
    return ns(e, t, i, !1, s);
  }, dt.version = "18.3.1-next-f1338f8080-20240426", dt;
}
var yh;
function Jg() {
  if (yh) return Il.exports;
  yh = 1;
  function n() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
      } catch (r) {
        console.error(r);
      }
  }
  return n(), Il.exports = Zg(), Il.exports;
}
var gh;
function e1() {
  if (gh) return is;
  gh = 1;
  var n = Jg();
  return is.createRoot = n.createRoot, is.hydrateRoot = n.hydrateRoot, is;
}
var t1 = e1(), M = _u();
const zu = M.createContext({});
function Dn(n) {
  const r = M.useRef(null);
  return r.current === null && (r.current = n()), r.current;
}
const n1 = typeof window < "u", zs = n1 ? M.useLayoutEffect : M.useEffect, Is = /* @__PURE__ */ M.createContext(null);
function Iu(n, r) {
  n.indexOf(r) === -1 && n.push(r);
}
function Cs(n, r) {
  const o = n.indexOf(r);
  o > -1 && n.splice(o, 1);
}
const qt = (n, r, o) => o > r ? r : o < n ? n : o;
function vh(n, r) {
  return r ? `${n}. For more information and steps for solving, visit https://motion.dev/troubleshooting/${r}` : n;
}
let Wi = () => {
}, tr = () => {
};
typeof process < "u" && process.env?.NODE_ENV !== "production" && (Wi = (n, r, o) => {
  !n && typeof console < "u" && console.warn(vh(r, o));
}, tr = (n, r, o) => {
  if (!n)
    throw new Error(vh(r, o));
});
const Ln = {}, Jp = (n) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(n), em = (n) => typeof n == "object" && n !== null, tm = (n) => /^0[^.\s]+$/u.test(n);
// @__NO_SIDE_EFFECTS__
function nm(n) {
  let r;
  return () => (r === void 0 && (r = n()), r);
}
const Rt = /* @__NO_SIDE_EFFECTS__ */ (n) => n, Ui = (...n) => n.reduce((r, o) => (a) => o(r(a))), bi = /* @__NO_SIDE_EFFECTS__ */ (n, r, o) => {
  const a = r - n;
  return a ? (o - n) / a : 1;
};
class Fu {
  constructor() {
    this.subscriptions = [];
  }
  add(r) {
    return Iu(this.subscriptions, r), () => Cs(this.subscriptions, r);
  }
  notify(r, o, a) {
    const u = this.subscriptions.length;
    if (u)
      if (u === 1)
        this.subscriptions[0](r, o, a);
      else
        for (let d = 0; d < u; d++) {
          const f = this.subscriptions[d];
          f && f(r, o, a);
        }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
const ht = /* @__NO_SIDE_EFFECTS__ */ (n) => n * 1e3, jt = /* @__NO_SIDE_EFFECTS__ */ (n) => n / 1e3, rm = /* @__NO_SIDE_EFFECTS__ */ (n, r) => r ? n * (1e3 / r) : 0, im = (n, r, o) => (((1 - 3 * o + 3 * r) * n + (3 * o - 6 * r)) * n + 3 * r) * n, r1 = 1e-7, i1 = 12;
function o1(n, r, o, a, u) {
  let d, f, h = 0;
  do
    f = r + (o - r) / 2, d = im(f, a, u) - n, d > 0 ? o = f : r = f;
  while (Math.abs(d) > r1 && ++h < i1);
  return f;
}
// @__NO_SIDE_EFFECTS__
function Hi(n, r, o, a) {
  if (n === r && o === a)
    return Rt;
  const u = (d) => o1(d, 0, 1, n, o);
  return (d) => d === 0 || d === 1 ? d : im(u(d), r, a);
}
const om = /* @__NO_SIDE_EFFECTS__ */ (n) => (r) => r <= 0.5 ? n(2 * r) / 2 : (2 - n(2 * (1 - r))) / 2, sm = /* @__NO_SIDE_EFFECTS__ */ (n) => (r) => 1 - n(1 - r), am = /* @__PURE__ */ Hi(0.33, 1.53, 0.69, 0.99), bu = /* @__PURE__ */ sm(am), lm = /* @__PURE__ */ om(bu), um = (n) => n >= 1 ? 1 : (n *= 2) < 1 ? 0.5 * bu(n) : 0.5 * (2 - Math.pow(2, -10 * (n - 1))), Ou = (n) => 1 - Math.sin(Math.acos(n)), cm = /* @__PURE__ */ sm(Ou), fm = /* @__PURE__ */ om(Ou), s1 = /* @__PURE__ */ Hi(0.42, 0, 1, 1), a1 = /* @__PURE__ */ Hi(0, 0, 0.58, 1), dm = /* @__PURE__ */ Hi(0.42, 0, 0.58, 1), l1 = /* @__NO_SIDE_EFFECTS__ */ (n) => Array.isArray(n) && typeof n[0] != "number", hm = /* @__NO_SIDE_EFFECTS__ */ (n) => Array.isArray(n) && typeof n[0] == "number", xh = {
  linear: Rt,
  easeIn: s1,
  easeInOut: dm,
  easeOut: a1,
  circIn: Ou,
  circInOut: fm,
  circOut: cm,
  backIn: bu,
  backInOut: lm,
  backOut: am,
  anticipate: um
}, u1 = (n) => typeof n == "string", wh = (n) => {
  if (/* @__PURE__ */ hm(n)) {
    tr(n.length === 4, "Cubic bezier arrays must contain four numerical values.", "cubic-bezier-length");
    const [r, o, a, u] = n;
    return /* @__PURE__ */ Hi(r, o, a, u);
  } else if (u1(n))
    return tr(xh[n] !== void 0, `Invalid easing type '${n}'`, "invalid-easing-type"), xh[n];
  return n;
}, os = [
  "setup",
  // Compute
  "read",
  // Read
  "resolveKeyframes",
  // Write/Read/Write/Read
  "preUpdate",
  // Compute
  "update",
  // Compute
  "preRender",
  // Compute
  "render",
  // Write
  "postRender"
  // Compute
];
function c1(n) {
  let r = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), a = !1, u = !1;
  const d = /* @__PURE__ */ new WeakSet();
  let f = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  };
  function h(v) {
    d.has(v) && (g.schedule(v), n()), v(f);
  }
  const g = {
    /**
     * Schedule a process to run on the next frame.
     */
    schedule: (v, y = !1, x = !1) => {
      const A = x && a ? r : o;
      return y && d.add(v), A.add(v), v;
    },
    /**
     * Cancel the provided callback from running on the next frame.
     */
    cancel: (v) => {
      o.delete(v), d.delete(v);
    },
    /**
     * Execute all schedule callbacks.
     */
    process: (v) => {
      if (f = v, a) {
        u = !0;
        return;
      }
      a = !0;
      const y = r;
      r = o, o = y, r.forEach(h), r.clear(), a = !1, u && (u = !1, g.process(v));
    }
  };
  return g;
}
const f1 = 40;
function pm(n, r) {
  let o = !1, a = !0;
  const u = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  }, d = () => o = !0, f = os.reduce((z, b) => (z[b] = c1(d), z), {}), { setup: h, read: g, resolveKeyframes: v, preUpdate: y, update: x, preRender: S, render: A, postRender: E } = f, D = () => {
    const z = Ln.useManualTiming, b = z ? u.timestamp : performance.now();
    o = !1, z || (u.delta = a ? 1e3 / 60 : Math.max(Math.min(b - u.timestamp, f1), 1)), u.timestamp = b, u.isProcessing = !0, h.process(u), g.process(u), v.process(u), y.process(u), x.process(u), S.process(u), A.process(u), E.process(u), u.isProcessing = !1, o && r && (a = !1, n(D));
  }, L = () => {
    o = !0, a = !0, u.isProcessing || n(D);
  };
  return { schedule: os.reduce((z, b) => {
    const ee = f[b];
    return z[b] = (Z, te = !1, W = !1) => (o || L(), ee.schedule(Z, te, W)), z;
  }, {}), cancel: (z) => {
    for (let b = 0; b < os.length; b++)
      f[os[b]].cancel(z);
  }, state: u, steps: f };
}
const { schedule: Pe, cancel: ln, state: Xe, steps: Ol } = /* @__PURE__ */ pm(typeof requestAnimationFrame < "u" ? requestAnimationFrame : Rt, !0);
let ps;
function d1() {
  ps = void 0;
}
const ot = {
  now: () => (ps === void 0 && ot.set(Xe.isProcessing || Ln.useManualTiming ? Xe.timestamp : performance.now()), ps),
  set: (n) => {
    ps = n, queueMicrotask(d1);
  }
}, mm = (n) => (r) => typeof r == "string" && r.startsWith(n), ym = /* @__PURE__ */ mm("--"), h1 = /* @__PURE__ */ mm("var(--"), Bu = (n) => h1(n) ? p1.test(n.split("/*")[0].trim()) : !1, p1 = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function Sh(n) {
  return typeof n != "string" ? !1 : n.split("/*")[0].includes("var(--");
}
const Fr = {
  test: (n) => typeof n == "number",
  parse: parseFloat,
  transform: (n) => n
}, Oi = {
  ...Fr,
  transform: (n) => qt(0, 1, n)
}, ss = {
  ...Fr,
  default: 1
}, Vi = (n) => Math.round(n * 1e5) / 1e5, $u = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function m1(n) {
  return n == null;
}
const y1 = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, Wu = (n, r) => (o) => !!(typeof o == "string" && y1.test(o) && o.startsWith(n) || r && !m1(o) && Object.prototype.hasOwnProperty.call(o, r)), gm = (n, r, o) => (a) => {
  if (typeof a != "string")
    return a;
  const [u, d, f, h] = a.match($u);
  return {
    [n]: parseFloat(u),
    [r]: parseFloat(d),
    [o]: parseFloat(f),
    alpha: h !== void 0 ? parseFloat(h) : 1
  };
}, g1 = (n) => qt(0, 255, n), Bl = {
  ...Fr,
  transform: (n) => Math.round(g1(n))
}, qn = {
  test: /* @__PURE__ */ Wu("rgb", "red"),
  parse: /* @__PURE__ */ gm("red", "green", "blue"),
  transform: ({ red: n, green: r, blue: o, alpha: a = 1 }) => "rgba(" + Bl.transform(n) + ", " + Bl.transform(r) + ", " + Bl.transform(o) + ", " + Vi(Oi.transform(a)) + ")"
};
function v1(n) {
  let r = "", o = "", a = "", u = "";
  return n.length > 5 ? (r = n.substring(1, 3), o = n.substring(3, 5), a = n.substring(5, 7), u = n.substring(7, 9)) : (r = n.substring(1, 2), o = n.substring(2, 3), a = n.substring(3, 4), u = n.substring(4, 5), r += r, o += o, a += a, u += u), {
    red: parseInt(r, 16),
    green: parseInt(o, 16),
    blue: parseInt(a, 16),
    alpha: u ? parseInt(u, 16) / 255 : 1
  };
}
const ou = {
  test: /* @__PURE__ */ Wu("#"),
  parse: v1,
  transform: qn.transform
}, Ki = /* @__NO_SIDE_EFFECTS__ */ (n) => ({
  test: (r) => typeof r == "string" && r.endsWith(n) && r.split(" ").length === 1,
  parse: parseFloat,
  transform: (r) => `${r}${n}`
}), an = /* @__PURE__ */ Ki("deg"), Qt = /* @__PURE__ */ Ki("%"), q = /* @__PURE__ */ Ki("px"), x1 = /* @__PURE__ */ Ki("vh"), w1 = /* @__PURE__ */ Ki("vw"), kh = {
  ...Qt,
  parse: (n) => Qt.parse(n) / 100,
  transform: (n) => Qt.transform(n * 100)
}, Lr = {
  test: /* @__PURE__ */ Wu("hsl", "hue"),
  parse: /* @__PURE__ */ gm("hue", "saturation", "lightness"),
  transform: ({ hue: n, saturation: r, lightness: o, alpha: a = 1 }) => "hsla(" + Math.round(n) + ", " + Qt.transform(Vi(r)) + ", " + Qt.transform(Vi(o)) + ", " + Vi(Oi.transform(a)) + ")"
}, Oe = {
  test: (n) => qn.test(n) || ou.test(n) || Lr.test(n),
  parse: (n) => qn.test(n) ? qn.parse(n) : Lr.test(n) ? Lr.parse(n) : ou.parse(n),
  transform: (n) => typeof n == "string" ? n : n.hasOwnProperty("red") ? qn.transform(n) : Lr.transform(n),
  getAnimatableNone: (n) => {
    const r = Oe.parse(n);
    return r.alpha = 0, Oe.transform(r);
  }
}, S1 = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function k1(n) {
  return isNaN(n) && typeof n == "string" && (n.match($u)?.length || 0) + (n.match(S1)?.length || 0) > 0;
}
const vm = "number", xm = "color", C1 = "var", T1 = "var(", Ch = "${}", P1 = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function zr(n) {
  const r = n.toString(), o = [], a = {
    color: [],
    number: [],
    var: []
  }, u = [];
  let d = 0;
  const h = r.replace(P1, (g) => (Oe.test(g) ? (a.color.push(d), u.push(xm), o.push(Oe.parse(g))) : g.startsWith(T1) ? (a.var.push(d), u.push(C1), o.push(g)) : (a.number.push(d), u.push(vm), o.push(parseFloat(g))), ++d, Ch)).split(Ch);
  return { values: o, split: h, indexes: a, types: u };
}
function E1(n) {
  return zr(n).values;
}
function wm({ split: n, types: r }) {
  const o = n.length;
  return (a) => {
    let u = "";
    for (let d = 0; d < o; d++)
      if (u += n[d], a[d] !== void 0) {
        const f = r[d];
        f === vm ? u += Vi(a[d]) : f === xm ? u += Oe.transform(a[d]) : u += a[d];
      }
    return u;
  };
}
function j1(n) {
  return wm(zr(n));
}
const R1 = (n) => typeof n == "number" ? 0 : Oe.test(n) ? Oe.getAnimatableNone(n) : n, M1 = (n, r) => typeof n == "number" ? r?.trim().endsWith("/") ? n : 0 : R1(n);
function A1(n) {
  const r = zr(n);
  return wm(r)(r.values.map((a, u) => M1(a, r.split[u])));
}
const Ft = {
  test: k1,
  parse: E1,
  createTransformer: j1,
  getAnimatableNone: A1
};
function $l(n, r, o) {
  return o < 0 && (o += 1), o > 1 && (o -= 1), o < 1 / 6 ? n + (r - n) * 6 * o : o < 1 / 2 ? r : o < 2 / 3 ? n + (r - n) * (2 / 3 - o) * 6 : n;
}
function D1({ hue: n, saturation: r, lightness: o, alpha: a }) {
  n /= 360, r /= 100, o /= 100;
  let u = 0, d = 0, f = 0;
  if (!r)
    u = d = f = o;
  else {
    const h = o < 0.5 ? o * (1 + r) : o + r - o * r, g = 2 * o - h;
    u = $l(g, h, n + 1 / 3), d = $l(g, h, n), f = $l(g, h, n - 1 / 3);
  }
  return {
    red: Math.round(u * 255),
    green: Math.round(d * 255),
    blue: Math.round(f * 255),
    alpha: a
  };
}
function Ts(n, r) {
  return (o) => o > 0 ? r : n;
}
const Ee = (n, r, o) => n + (r - n) * o, Wl = (n, r, o) => {
  const a = n * n, u = o * (r * r - a) + a;
  return u < 0 ? 0 : Math.sqrt(u);
}, L1 = [ou, qn, Lr], V1 = (n) => L1.find((r) => r.test(n));
function Th(n) {
  const r = V1(n);
  if (Wi(!!r, `'${n}' is not an animatable color. Use the equivalent color code instead.`, "color-not-animatable"), !r)
    return !1;
  let o = r.parse(n);
  return r === Lr && (o = D1(o)), o;
}
const Ph = (n, r) => {
  const o = Th(n), a = Th(r);
  if (!o || !a)
    return Ts(n, r);
  const u = { ...o };
  return (d) => (u.red = Wl(o.red, a.red, d), u.green = Wl(o.green, a.green, d), u.blue = Wl(o.blue, a.blue, d), u.alpha = Ee(o.alpha, a.alpha, d), qn.transform(u));
}, su = /* @__PURE__ */ new Set(["none", "hidden"]);
function N1(n, r) {
  return su.has(n) ? (o) => o <= 0 ? n : r : (o) => o >= 1 ? r : n;
}
function _1(n, r) {
  return (o) => Ee(n, r, o);
}
function Uu(n) {
  return typeof n == "number" ? _1 : typeof n == "string" ? Bu(n) ? Ts : Oe.test(n) ? Ph : F1 : Array.isArray(n) ? Sm : typeof n == "object" ? Oe.test(n) ? Ph : z1 : Ts;
}
function Sm(n, r) {
  const o = [...n], a = o.length, u = n.map((d, f) => Uu(d)(d, r[f]));
  return (d) => {
    for (let f = 0; f < a; f++)
      o[f] = u[f](d);
    return o;
  };
}
function z1(n, r) {
  const o = { ...n, ...r }, a = {};
  for (const u in o)
    n[u] !== void 0 && r[u] !== void 0 && (a[u] = Uu(n[u])(n[u], r[u]));
  return (u) => {
    for (const d in a)
      o[d] = a[d](u);
    return o;
  };
}
function I1(n, r) {
  const o = [], a = { color: 0, var: 0, number: 0 };
  for (let u = 0; u < r.values.length; u++) {
    const d = r.types[u], f = n.indexes[d][a[d]], h = n.values[f] ?? 0;
    o[u] = h, a[d]++;
  }
  return o;
}
const F1 = (n, r) => {
  const o = Ft.createTransformer(r), a = zr(n), u = zr(r);
  return a.indexes.var.length === u.indexes.var.length && a.indexes.color.length === u.indexes.color.length && a.indexes.number.length >= u.indexes.number.length ? su.has(n) && !u.values.length || su.has(r) && !a.values.length ? N1(n, r) : Ui(Sm(I1(a, u), u.values), o) : (Wi(!0, `Complex values '${n}' and '${r}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`, "complex-values-different"), Ts(n, r));
};
function km(n, r, o) {
  return typeof n == "number" && typeof r == "number" && typeof o == "number" ? Ee(n, r, o) : Uu(n)(n, r);
}
const b1 = (n) => {
  const r = ({ timestamp: o }) => n(o);
  return {
    start: (o = !0) => Pe.update(r, o),
    stop: () => ln(r),
    /**
     * If we're processing this frame we can use the
     * framelocked timestamp to keep things in sync.
     */
    now: () => Xe.isProcessing ? Xe.timestamp : ot.now()
  };
}, Cm = (n, r, o = 10) => {
  let a = "";
  const u = Math.max(Math.round(r / o), 2);
  for (let d = 0; d < u; d++)
    a += Math.round(n(d / (u - 1)) * 1e4) / 1e4 + ", ";
  return `linear(${a.substring(0, a.length - 2)})`;
}, Ps = 2e4;
function Hu(n) {
  let r = 0;
  const o = 50;
  let a = n.next(r);
  for (; !a.done && r < Ps; )
    r += o, a = n.next(r);
  return r >= Ps ? 1 / 0 : r;
}
function O1(n, r = 100, o) {
  const a = o({ ...n, keyframes: [0, r] }), u = Math.min(Hu(a), Ps);
  return {
    type: "keyframes",
    ease: (d) => a.next(u * d).value / r,
    duration: /* @__PURE__ */ jt(u)
  };
}
const _e = {
  // Default spring physics
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  // Default duration/bounce-based options
  duration: 800,
  // in ms
  bounce: 0.3,
  visualDuration: 0.3,
  // in seconds
  // Rest thresholds
  restSpeed: {
    granular: 0.01,
    default: 2
  },
  restDelta: {
    granular: 5e-3,
    default: 0.5
  },
  // Limits
  minDuration: 0.01,
  // in seconds
  maxDuration: 10,
  // in seconds
  minDamping: 0.05,
  maxDamping: 1
};
function au(n, r) {
  return n * Math.sqrt(1 - r * r);
}
const B1 = 12;
function $1(n, r, o) {
  let a = o;
  for (let u = 1; u < B1; u++)
    a = a - n(a) / r(a);
  return a;
}
const Ul = 1e-3;
function W1({ duration: n = _e.duration, bounce: r = _e.bounce, velocity: o = _e.velocity, mass: a = _e.mass }) {
  let u, d;
  Wi(n <= /* @__PURE__ */ ht(_e.maxDuration), "Spring duration must be 10 seconds or less", "spring-duration-limit");
  let f = 1 - r;
  f = qt(_e.minDamping, _e.maxDamping, f), n = qt(_e.minDuration, _e.maxDuration, /* @__PURE__ */ jt(n)), f < 1 ? (u = (v) => {
    const y = v * f, x = y * n, S = y - o, A = au(v, f), E = Math.exp(-x);
    return Ul - S / A * E;
  }, d = (v) => {
    const x = v * f * n, S = x * o + o, A = Math.pow(f, 2) * Math.pow(v, 2) * n, E = Math.exp(-x), D = au(Math.pow(v, 2), f);
    return (-u(v) + Ul > 0 ? -1 : 1) * ((S - A) * E) / D;
  }) : (u = (v) => {
    const y = Math.exp(-v * n), x = (v - o) * n + 1;
    return -Ul + y * x;
  }, d = (v) => {
    const y = Math.exp(-v * n), x = (o - v) * (n * n);
    return y * x;
  });
  const h = 5 / n, g = $1(u, d, h);
  if (n = /* @__PURE__ */ ht(n), isNaN(g))
    return {
      stiffness: _e.stiffness,
      damping: _e.damping,
      duration: n
    };
  {
    const v = Math.pow(g, 2) * a;
    return {
      stiffness: v,
      damping: f * 2 * Math.sqrt(a * v),
      duration: n
    };
  }
}
const U1 = ["duration", "bounce"], H1 = ["stiffness", "damping", "mass"];
function Eh(n, r) {
  return r.some((o) => n[o] !== void 0);
}
function K1(n) {
  let r = {
    velocity: _e.velocity,
    stiffness: _e.stiffness,
    damping: _e.damping,
    mass: _e.mass,
    isResolvedFromDuration: !1,
    ...n
  };
  if (!Eh(n, H1) && Eh(n, U1))
    if (r.velocity = 0, n.visualDuration) {
      const o = n.visualDuration, a = 2 * Math.PI / (o * 1.2), u = a * a, d = 2 * qt(0.05, 1, 1 - (n.bounce || 0)) * Math.sqrt(u);
      r = {
        ...r,
        mass: _e.mass,
        stiffness: u,
        damping: d
      };
    } else {
      const o = W1({ ...n, velocity: 0 });
      r = {
        ...r,
        ...o,
        mass: _e.mass
      }, r.isResolvedFromDuration = !0;
    }
  return r;
}
function Es(n = _e.visualDuration, r = _e.bounce) {
  const o = typeof n != "object" ? {
    visualDuration: n,
    keyframes: [0, 1],
    bounce: r
  } : n;
  let { restSpeed: a, restDelta: u } = o;
  const d = o.keyframes[0], f = o.keyframes[o.keyframes.length - 1], h = { done: !1, value: d }, { stiffness: g, damping: v, mass: y, duration: x, velocity: S, isResolvedFromDuration: A } = K1({
    ...o,
    velocity: -/* @__PURE__ */ jt(o.velocity || 0)
  }), E = S || 0, D = v / (2 * Math.sqrt(g * y)), L = f - d, V = /* @__PURE__ */ jt(Math.sqrt(g / y)), N = Math.abs(L) < 5;
  a || (a = N ? _e.restSpeed.granular : _e.restSpeed.default), u || (u = N ? _e.restDelta.granular : _e.restDelta.default);
  let z, b, ee, Z, te, W;
  if (D < 1)
    ee = au(V, D), Z = (E + D * V * L) / ee, z = (K) => {
      const ye = Math.exp(-D * V * K);
      return f - ye * (Z * Math.sin(ee * K) + L * Math.cos(ee * K));
    }, te = D * V * Z + L * ee, W = D * V * L - Z * ee, b = (K) => Math.exp(-D * V * K) * (te * Math.sin(ee * K) + W * Math.cos(ee * K));
  else if (D === 1) {
    z = (ye) => f - Math.exp(-V * ye) * (L + (E + V * L) * ye);
    const K = E + V * L;
    b = (ye) => Math.exp(-V * ye) * (V * K * ye - E);
  } else {
    const K = V * Math.sqrt(D * D - 1);
    z = (ue) => {
      const we = Math.exp(-D * V * ue), Te = Math.min(K * ue, 300);
      return f - we * ((E + D * V * L) * Math.sinh(Te) + K * L * Math.cosh(Te)) / K;
    };
    const ye = (E + D * V * L) / K, ge = D * V * ye - L * K, ie = D * V * L - ye * K;
    b = (ue) => {
      const we = Math.exp(-D * V * ue), Te = Math.min(K * ue, 300);
      return we * (ge * Math.sinh(Te) + ie * Math.cosh(Te));
    };
  }
  const ae = {
    calculatedDuration: A && x || null,
    velocity: (K) => /* @__PURE__ */ ht(b(K)),
    next: (K) => {
      if (!A && D < 1) {
        const ge = Math.exp(-D * V * K), ie = Math.sin(ee * K), ue = Math.cos(ee * K), we = f - ge * (Z * ie + L * ue), Te = /* @__PURE__ */ ht(ge * (te * ie + W * ue));
        return h.done = Math.abs(Te) <= a && Math.abs(f - we) <= u, h.value = h.done ? f : we, h;
      }
      const ye = z(K);
      if (A)
        h.done = K >= x;
      else {
        const ge = /* @__PURE__ */ ht(b(K));
        h.done = Math.abs(ge) <= a && Math.abs(f - ye) <= u;
      }
      return h.value = h.done ? f : ye, h;
    },
    toString: () => {
      const K = Math.min(Hu(ae), Ps), ye = Cm((ge) => ae.next(K * ge).value, K, 30);
      return K + "ms " + ye;
    },
    toTransition: () => {
    }
  };
  return ae;
}
Es.applyToOptions = (n) => {
  const r = O1(n, 100, Es);
  return n.ease = r.ease, n.duration = /* @__PURE__ */ ht(r.duration), n.type = "keyframes", n;
};
const G1 = 5;
function Tm(n, r, o) {
  const a = Math.max(r - G1, 0);
  return /* @__PURE__ */ rm(o - n(a), r - a);
}
function lu({ keyframes: n, velocity: r = 0, power: o = 0.8, timeConstant: a = 325, bounceDamping: u = 10, bounceStiffness: d = 500, modifyTarget: f, min: h, max: g, restDelta: v = 0.5, restSpeed: y }) {
  const x = n[0], S = {
    done: !1,
    value: x
  }, A = (W) => h !== void 0 && W < h || g !== void 0 && W > g, E = (W) => h === void 0 ? g : g === void 0 || Math.abs(h - W) < Math.abs(g - W) ? h : g;
  let D = o * r;
  const L = x + D, V = f === void 0 ? L : f(L);
  V !== L && (D = V - x);
  const N = (W) => -D * Math.exp(-W / a), z = (W) => V + N(W), b = (W) => {
    const ae = N(W), K = z(W);
    S.done = Math.abs(ae) <= v, S.value = S.done ? V : K;
  };
  let ee, Z;
  const te = (W) => {
    A(S.value) && (ee = W, Z = Es({
      keyframes: [S.value, E(S.value)],
      velocity: Tm(z, W, S.value),
      // TODO: This should be passing * 1000
      damping: u,
      stiffness: d,
      restDelta: v,
      restSpeed: y
    }));
  };
  return te(0), {
    calculatedDuration: null,
    next: (W) => {
      let ae = !1;
      return !Z && ee === void 0 && (ae = !0, b(W), te(W)), ee !== void 0 && W >= ee ? Z.next(W - ee) : (!ae && b(W), S);
    }
  };
}
function Y1(n, r, o) {
  const a = [], u = o || Ln.mix || km, d = n.length - 1;
  for (let f = 0; f < d; f++) {
    let h = u(n[f], n[f + 1]);
    if (r) {
      const g = Array.isArray(r) ? r[f] || Rt : r;
      h = Ui(g, h);
    }
    a.push(h);
  }
  return a;
}
function Pm(n, r, { clamp: o = !0, ease: a, mixer: u } = {}) {
  const d = n.length;
  if (tr(d === r.length, "Both input and output ranges must be the same length", "range-length"), d === 1)
    return () => r[0];
  if (d === 2 && r[0] === r[1])
    return () => r[1];
  const f = n[0] === n[1];
  n[0] > n[d - 1] && (n = [...n].reverse(), r = [...r].reverse());
  const h = Y1(r, a, u), g = h.length, v = (y) => {
    if (f && y < n[0])
      return r[0];
    let x = 0;
    if (g > 1)
      for (; x < n.length - 2 && !(y < n[x + 1]); x++)
        ;
    const S = /* @__PURE__ */ bi(n[x], n[x + 1], y);
    return h[x](S);
  };
  return o ? (y) => v(qt(n[0], n[d - 1], y)) : v;
}
function X1(n, r) {
  const o = n[n.length - 1];
  for (let a = 1; a <= r; a++) {
    const u = /* @__PURE__ */ bi(0, r, a);
    n.push(Ee(o, 1, u));
  }
}
function Q1(n) {
  const r = [0];
  return X1(r, n.length - 1), r;
}
function q1(n, r) {
  return n.map((o) => o * r);
}
function Z1(n, r) {
  return n.map(() => r || dm).splice(0, n.length - 1);
}
function Ni({ duration: n = 300, keyframes: r, times: o, ease: a = "easeInOut" }) {
  const u = /* @__PURE__ */ l1(a) ? a.map(wh) : wh(a), d = {
    done: !1,
    value: r[0]
  }, f = q1(
    // Only use the provided offsets if they're the correct length
    // TODO Maybe we should warn here if there's a length mismatch
    o && o.length === r.length ? o : Q1(r),
    n
  ), h = Pm(f, r, {
    ease: Array.isArray(u) ? u : Z1(r, u)
  });
  return {
    calculatedDuration: n,
    next: (g) => (d.value = h(g), d.done = g >= n, d)
  };
}
const J1 = (n) => n !== null;
function Fs(n, { repeat: r, repeatType: o = "loop" }, a, u = 1) {
  const d = n.filter(J1), h = u < 0 || r && o !== "loop" && r % 2 === 1 ? 0 : d.length - 1;
  return !h || a === void 0 ? d[h] : a;
}
const ev = {
  decay: lu,
  inertia: lu,
  tween: Ni,
  keyframes: Ni,
  spring: Es
};
function Em(n) {
  typeof n.type == "string" && (n.type = ev[n.type]);
}
class Ku {
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((r) => {
      this.resolve = r;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  /**
   * Allows the animation to be awaited.
   *
   * @deprecated Use `finished` instead.
   */
  then(r, o) {
    return this.finished.then(r, o);
  }
}
const tv = (n) => n / 100;
class js extends Ku {
  constructor(r) {
    super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = {
      done: !1,
      value: void 0
    }, this.stop = () => {
      const { motionValue: o } = this.options;
      o && o.updatedAt !== ot.now() && this.tick(ot.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
    }, this.options = r, this.initAnimation(), this.play(), r.autoplay === !1 && this.pause();
  }
  initAnimation() {
    const { options: r } = this;
    Em(r);
    const { type: o = Ni, repeat: a = 0, repeatDelay: u = 0, repeatType: d, velocity: f = 0 } = r;
    let { keyframes: h } = r;
    const g = o || Ni;
    g !== Ni && typeof h[0] != "number" && (this.mixKeyframes = Ui(tv, km(h[0], h[1])), h = [0, 100]);
    const v = g({ ...r, keyframes: h });
    d === "mirror" && (this.mirroredGenerator = g({
      ...r,
      keyframes: [...h].reverse(),
      velocity: -f
    })), v.calculatedDuration === null && (v.calculatedDuration = Hu(v));
    const { calculatedDuration: y } = v;
    this.calculatedDuration = y, this.resolvedDuration = y + u, this.totalDuration = this.resolvedDuration * (a + 1) - u, this.generator = v;
  }
  updateTime(r) {
    const o = Math.round(r - this.startTime) * this.playbackSpeed;
    this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = o;
  }
  tick(r, o = !1) {
    const { generator: a, totalDuration: u, mixKeyframes: d, mirroredGenerator: f, resolvedDuration: h, calculatedDuration: g } = this;
    if (this.startTime === null)
      return a.next(0);
    const { delay: v = 0, keyframes: y, repeat: x, repeatType: S, repeatDelay: A, type: E, onUpdate: D, finalKeyframe: L } = this.options;
    this.speed > 0 ? this.startTime = Math.min(this.startTime, r) : this.speed < 0 && (this.startTime = Math.min(r - u / this.speed, this.startTime)), o ? this.currentTime = r : this.updateTime(r);
    const V = this.currentTime - v * (this.playbackSpeed >= 0 ? 1 : -1), N = this.playbackSpeed >= 0 ? V < 0 : V > u;
    this.currentTime = Math.max(V, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = u);
    let z = this.currentTime, b = a;
    if (x) {
      const W = Math.min(this.currentTime, u) / h;
      let ae = Math.floor(W), K = W % 1;
      !K && W >= 1 && (K = 1), K === 1 && ae--, ae = Math.min(ae, x + 1), !!(ae % 2) && (S === "reverse" ? (K = 1 - K, A && (K -= A / h)) : S === "mirror" && (b = f)), z = qt(0, 1, K) * h;
    }
    let ee;
    N ? (this.delayState.value = y[0], ee = this.delayState) : ee = b.next(z), d && !N && (ee.value = d(ee.value));
    let { done: Z } = ee;
    !N && g !== null && (Z = this.playbackSpeed >= 0 ? this.currentTime >= u : this.currentTime <= 0);
    const te = this.holdTime === null && (this.state === "finished" || this.state === "running" && Z);
    return te && E !== lu && (ee.value = Fs(y, this.options, L, this.speed)), D && D(ee.value), te && this.finish(), ee;
  }
  /**
   * Allows the returned animation to be awaited or promise-chained. Currently
   * resolves when the animation finishes at all but in a future update could/should
   * reject if its cancels.
   */
  then(r, o) {
    return this.finished.then(r, o);
  }
  get duration() {
    return /* @__PURE__ */ jt(this.calculatedDuration);
  }
  get iterationDuration() {
    const { delay: r = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ jt(r);
  }
  get time() {
    return /* @__PURE__ */ jt(this.currentTime);
  }
  set time(r) {
    r = /* @__PURE__ */ ht(r), this.currentTime = r, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = r : this.driver && (this.startTime = this.driver.now() - r / this.playbackSpeed), this.driver ? this.driver.start(!1) : (this.startTime = 0, this.state = "paused", this.holdTime = r, this.tick(r));
  }
  /**
   * Returns the generator's velocity at the current time in units/second.
   * Uses the analytical derivative when available (springs), avoiding
   * the MotionValue's frame-dependent velocity estimation.
   */
  getGeneratorVelocity() {
    const r = this.currentTime;
    if (r <= 0)
      return this.options.velocity || 0;
    if (this.generator.velocity)
      return this.generator.velocity(r);
    const o = this.generator.next(r).value;
    return Tm((a) => this.generator.next(a).value, r, o);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(r) {
    const o = this.playbackSpeed !== r;
    o && this.driver && this.updateTime(ot.now()), this.playbackSpeed = r, o && this.driver && (this.time = /* @__PURE__ */ jt(this.currentTime));
  }
  play() {
    if (this.isStopped)
      return;
    const { driver: r = b1, startTime: o } = this.options;
    this.driver || (this.driver = r((u) => this.tick(u))), this.options.onPlay?.();
    const a = this.driver.now();
    this.state === "finished" ? (this.updateFinished(), this.startTime = a) : this.holdTime !== null ? this.startTime = a - this.holdTime : this.startTime || (this.startTime = o ?? a), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
  }
  pause() {
    this.state = "paused", this.updateTime(ot.now()), this.holdTime = this.currentTime;
  }
  complete() {
    this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
  }
  finish() {
    this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver && (this.driver.stop(), this.driver = void 0);
  }
  sample(r) {
    return this.startTime = 0, this.tick(r, !0);
  }
  attachTimeline(r) {
    return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), r.observe(this);
  }
}
function nv(n) {
  for (let r = 1; r < n.length; r++)
    n[r] ?? (n[r] = n[r - 1]);
}
const Zn = (n) => n * 180 / Math.PI, uu = (n) => {
  const r = Zn(Math.atan2(n[1], n[0]));
  return cu(r);
}, rv = {
  x: 4,
  y: 5,
  translateX: 4,
  translateY: 5,
  scaleX: 0,
  scaleY: 3,
  scale: (n) => (Math.abs(n[0]) + Math.abs(n[3])) / 2,
  rotate: uu,
  rotateZ: uu,
  skewX: (n) => Zn(Math.atan(n[1])),
  skewY: (n) => Zn(Math.atan(n[2])),
  skew: (n) => (Math.abs(n[1]) + Math.abs(n[2])) / 2
}, cu = (n) => (n = n % 360, n < 0 && (n += 360), n), jh = uu, Rh = (n) => Math.sqrt(n[0] * n[0] + n[1] * n[1]), Mh = (n) => Math.sqrt(n[4] * n[4] + n[5] * n[5]), iv = {
  x: 12,
  y: 13,
  z: 14,
  translateX: 12,
  translateY: 13,
  translateZ: 14,
  scaleX: Rh,
  scaleY: Mh,
  scale: (n) => (Rh(n) + Mh(n)) / 2,
  rotateX: (n) => cu(Zn(Math.atan2(n[6], n[5]))),
  rotateY: (n) => cu(Zn(Math.atan2(-n[2], n[0]))),
  rotateZ: jh,
  rotate: jh,
  skewX: (n) => Zn(Math.atan(n[4])),
  skewY: (n) => Zn(Math.atan(n[1])),
  skew: (n) => (Math.abs(n[1]) + Math.abs(n[4])) / 2
};
function fu(n) {
  return n.includes("scale") ? 1 : 0;
}
function du(n, r) {
  if (!n || n === "none")
    return fu(r);
  const o = n.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
  let a, u;
  if (o)
    a = iv, u = o;
  else {
    const h = n.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    a = rv, u = h;
  }
  if (!u)
    return fu(r);
  const d = a[r], f = u[1].split(",").map(sv);
  return typeof d == "function" ? d(f) : f[d];
}
const ov = (n, r) => {
  const { transform: o = "none" } = getComputedStyle(n);
  return du(o, r);
};
function sv(n) {
  return parseFloat(n.trim());
}
const br = [
  "transformPerspective",
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY"
], Or = /* @__PURE__ */ new Set([...br, "pathRotation"]), Ah = (n) => n === Fr || n === q, av = /* @__PURE__ */ new Set(["x", "y", "z"]), lv = br.filter((n) => !av.has(n));
function uv(n) {
  const r = [];
  return lv.forEach((o) => {
    const a = n.getValue(o);
    a !== void 0 && (r.push([o, a.get()]), a.set(o.startsWith("scale") ? 1 : 0));
  }), r;
}
const Mn = {
  // Dimensions
  width: ({ x: n }, { paddingLeft: r = "0", paddingRight: o = "0", boxSizing: a }) => {
    const u = n.max - n.min;
    return a === "border-box" ? u : u - parseFloat(r) - parseFloat(o);
  },
  height: ({ y: n }, { paddingTop: r = "0", paddingBottom: o = "0", boxSizing: a }) => {
    const u = n.max - n.min;
    return a === "border-box" ? u : u - parseFloat(r) - parseFloat(o);
  },
  top: (n, { top: r }) => parseFloat(r),
  left: (n, { left: r }) => parseFloat(r),
  bottom: ({ y: n }, { top: r }) => parseFloat(r) + (n.max - n.min),
  right: ({ x: n }, { left: r }) => parseFloat(r) + (n.max - n.min),
  // Transform
  x: (n, { transform: r }) => du(r, "x"),
  y: (n, { transform: r }) => du(r, "y")
};
Mn.translateX = Mn.x;
Mn.translateY = Mn.y;
const Jn = /* @__PURE__ */ new Set();
let hu = !1, pu = !1, mu = !1;
function jm() {
  if (pu) {
    const n = Array.from(Jn).filter((a) => a.needsMeasurement), r = new Set(n.map((a) => a.element)), o = /* @__PURE__ */ new Map();
    r.forEach((a) => {
      const u = uv(a);
      u.length && (o.set(a, u), a.render());
    }), n.forEach((a) => a.measureInitialState()), r.forEach((a) => {
      a.render();
      const u = o.get(a);
      u && u.forEach(([d, f]) => {
        a.getValue(d)?.set(f);
      });
    }), n.forEach((a) => a.measureEndState()), n.forEach((a) => {
      a.suspendedScrollY !== void 0 && window.scrollTo(0, a.suspendedScrollY);
    });
  }
  pu = !1, hu = !1, Jn.forEach((n) => n.complete(mu)), Jn.clear();
}
function Rm() {
  Jn.forEach((n) => {
    n.readKeyframes(), n.needsMeasurement && (pu = !0);
  });
}
function cv() {
  mu = !0, Rm(), jm(), mu = !1;
}
class Gu {
  constructor(r, o, a, u, d, f = !1) {
    this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...r], this.onComplete = o, this.name = a, this.motionValue = u, this.element = d, this.isAsync = f;
  }
  scheduleResolve() {
    this.state = "scheduled", this.isAsync ? (Jn.add(this), hu || (hu = !0, Pe.read(Rm), Pe.resolveKeyframes(jm))) : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    const { unresolvedKeyframes: r, name: o, element: a, motionValue: u } = this;
    if (r[0] === null) {
      const d = u?.get(), f = r[r.length - 1];
      if (d !== void 0)
        r[0] = d;
      else if (a && o) {
        const h = a.readValue(o, f);
        h != null && (r[0] = h);
      }
      r[0] === void 0 && (r[0] = f), u && d === void 0 && u.set(r[0]);
    }
    nv(r);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(r = !1) {
    this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, r), Jn.delete(this);
  }
  cancel() {
    this.state === "scheduled" && (Jn.delete(this), this.state = "pending");
  }
  resume() {
    this.state === "pending" && this.scheduleResolve();
  }
}
const fv = (n) => n.startsWith("--");
function Mm(n, r, o) {
  fv(r) ? n.style.setProperty(r, o) : n.style[r] = o;
}
const dv = {};
function Am(n, r) {
  const o = /* @__PURE__ */ nm(n);
  return () => dv[r] ?? o();
}
const hv = /* @__PURE__ */ Am(() => window.ScrollTimeline !== void 0, "scrollTimeline"), Dm = /* @__PURE__ */ Am(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch {
    return !1;
  }
  return !0;
}, "linearEasing"), Li = ([n, r, o, a]) => `cubic-bezier(${n}, ${r}, ${o}, ${a})`, Dh = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  circIn: /* @__PURE__ */ Li([0, 0.65, 0.55, 1]),
  circOut: /* @__PURE__ */ Li([0.55, 0, 1, 0.45]),
  backIn: /* @__PURE__ */ Li([0.31, 0.01, 0.66, -0.59]),
  backOut: /* @__PURE__ */ Li([0.33, 1.53, 0.69, 0.99])
};
function Lm(n, r) {
  if (n)
    return typeof n == "function" ? Dm() ? Cm(n, r) : "ease-out" : /* @__PURE__ */ hm(n) ? Li(n) : Array.isArray(n) ? n.map((o) => Lm(o, r) || Dh.easeOut) : Dh[n];
}
function pv(n, r, o, { delay: a = 0, duration: u = 300, repeat: d = 0, repeatType: f = "loop", ease: h = "easeOut", times: g } = {}, v = void 0) {
  const y = {
    [r]: o
  };
  g && (y.offset = g);
  const x = Lm(h, u);
  Array.isArray(x) && (y.easing = x);
  const S = {
    delay: a,
    duration: u,
    easing: Array.isArray(x) ? "linear" : x,
    fill: "both",
    iterations: d + 1,
    direction: f === "reverse" ? "alternate" : "normal"
  };
  return v && (S.pseudoElement = v), n.animate(y, S);
}
function Vm(n) {
  return typeof n == "function" && "applyToOptions" in n;
}
function mv({ type: n, ...r }) {
  return Vm(n) && Dm() ? n.applyToOptions(r) : (r.duration ?? (r.duration = 300), r.ease ?? (r.ease = "easeOut"), r);
}
class Nm extends Ku {
  constructor(r) {
    if (super(), this.finishedTime = null, this.isStopped = !1, this.manualStartTime = null, !r)
      return;
    const { element: o, name: a, keyframes: u, pseudoElement: d, allowFlatten: f = !1, finalKeyframe: h, onComplete: g } = r;
    this.isPseudoElement = !!d, this.allowFlatten = f, this.options = r, tr(typeof r.type != "string", `Mini animate() doesn't support "type" as a string.`, "mini-spring");
    const v = mv(r);
    this.animation = pv(o, a, u, v, d), v.autoplay === !1 && this.animation.pause(), this.animation.onfinish = () => {
      if (this.finishedTime = this.time, !d) {
        const y = Fs(u, this.options, h, this.speed);
        this.updateMotionValue && this.updateMotionValue(y), Mm(o, a, y), this.animation.cancel();
      }
      g?.(), this.notifyFinished();
    };
  }
  play() {
    this.isStopped || (this.manualStartTime = null, this.animation.play(), this.state === "finished" && this.updateFinished());
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {
    }
  }
  stop() {
    if (this.isStopped)
      return;
    this.isStopped = !0;
    const { state: r } = this;
    r === "idle" || r === "finished" || (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * In this method, we commit styles back to the DOM before cancelling
   * the animation.
   *
   * This is designed to be overridden by NativeAnimationExtended, which
   * will create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to also correctly calculate velocity for any subsequent animation
   * while deferring the commit until the next animation frame.
   */
  commitStyles() {
    const r = this.options?.element;
    !this.isPseudoElement && r?.isConnected && this.animation.commitStyles?.();
  }
  get duration() {
    const r = this.animation.effect?.getComputedTiming?.().duration || 0;
    return /* @__PURE__ */ jt(Number(r));
  }
  get iterationDuration() {
    const { delay: r = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ jt(r);
  }
  get time() {
    return /* @__PURE__ */ jt(Number(this.animation.currentTime) || 0);
  }
  set time(r) {
    const o = this.finishedTime !== null;
    this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = /* @__PURE__ */ ht(r), o && this.animation.pause();
  }
  /**
   * The playback speed of the animation.
   * 1 = normal speed, 2 = double speed, 0.5 = half speed.
   */
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(r) {
    r < 0 && (this.finishedTime = null), this.animation.playbackRate = r;
  }
  get state() {
    return this.finishedTime !== null ? "finished" : this.animation.playState;
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(r) {
    this.manualStartTime = this.animation.startTime = r;
  }
  /**
   * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
   */
  attachTimeline({ timeline: r, rangeStart: o, rangeEnd: a, observe: u }) {
    return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, r && hv() ? (this.animation.timeline = r, o && (this.animation.rangeStart = o), a && (this.animation.rangeEnd = a), Rt) : u(this);
  }
}
const _m = {
  anticipate: um,
  backInOut: lm,
  circInOut: fm
};
function yv(n) {
  return n in _m;
}
function gv(n) {
  typeof n.ease == "string" && yv(n.ease) && (n.ease = _m[n.ease]);
}
const Hl = 10;
class vv extends Nm {
  constructor(r) {
    gv(r), Em(r), super(r), r.startTime !== void 0 && r.autoplay !== !1 && (this.startTime = r.startTime), this.options = r;
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * Rather than read committed styles back out of the DOM, we can
   * create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to calculate velocity for any subsequent animation.
   */
  updateMotionValue(r) {
    const { motionValue: o, onUpdate: a, onComplete: u, element: d, ...f } = this.options;
    if (!o)
      return;
    if (r !== void 0) {
      o.set(r);
      return;
    }
    const h = new js({
      ...f,
      autoplay: !1
    }), g = Math.max(Hl, ot.now() - this.startTime), v = qt(0, Hl, g - Hl), y = h.sample(g).value, { name: x } = this.options;
    d && x && Mm(d, x, y), o.setWithVelocity(h.sample(Math.max(0, g - v)).value, y, v), h.stop();
  }
}
const Lh = (n, r) => r === "zIndex" ? !1 : !!(typeof n == "number" || Array.isArray(n) || typeof n == "string" && // It's animatable if we have a string
(Ft.test(n) || n === "0") && // And it contains numbers and/or colors
!n.startsWith("url("));
function xv(n) {
  const r = n[0];
  if (n.length === 1)
    return !0;
  for (let o = 0; o < n.length; o++)
    if (n[o] !== r)
      return !0;
}
function wv(n, r, o, a) {
  const u = n[0];
  if (u === null)
    return !1;
  if (r === "display" || r === "visibility")
    return !0;
  const d = n[n.length - 1], f = Lh(u, r), h = Lh(d, r);
  return Wi(f === h, `You are trying to animate ${r} from "${u}" to "${d}". "${f ? d : u}" is not an animatable value.`, "value-not-animatable"), !f || !h ? !1 : xv(n) || (o === "spring" || Vm(o)) && a;
}
function yu(n) {
  n.duration = 0, n.type = "keyframes";
}
const zm = /* @__PURE__ */ new Set([
  "opacity",
  "clipPath",
  "filter",
  "transform"
  // TODO: Can be accelerated but currently disabled until https://issues.chromium.org/issues/41491098 is resolved
  // or until we implement support for linear() easing.
  // "background-color"
]), Sv = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function kv(n) {
  for (let r = 0; r < n.length; r++)
    if (typeof n[r] == "string" && Sv.test(n[r]))
      return !0;
  return !1;
}
const Cv = /* @__PURE__ */ new Set([
  "color",
  "backgroundColor",
  "outlineColor",
  "fill",
  "stroke",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor"
]), Tv = /* @__PURE__ */ nm(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function Pv(n) {
  const { motionValue: r, name: o, repeatDelay: a, repeatType: u, damping: d, type: f, keyframes: h } = n;
  if (!(r?.owner?.current instanceof HTMLElement))
    return !1;
  const { onUpdate: v, transformTemplate: y } = r.owner.getProps();
  return Tv() && o && /**
   * Force WAAPI for color properties with browser-only color formats
   * (oklch, oklab, lab, lch, etc.) that the JS animation path can't parse.
   */
  (zm.has(o) || Cv.has(o) && kv(h)) && (o !== "transform" || !y) && /**
   * If we're outputting values to onUpdate then we can't use WAAPI as there's
   * no way to read the value from WAAPI every frame.
   */
  !v && !a && u !== "mirror" && d !== 0 && f !== "inertia";
}
const Ev = 40;
class jv extends Ku {
  constructor({ autoplay: r = !0, delay: o = 0, type: a = "keyframes", repeat: u = 0, repeatDelay: d = 0, repeatType: f = "loop", keyframes: h, name: g, motionValue: v, element: y, ...x }) {
    super(), this.stop = () => {
      this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
    }, this.createdAt = ot.now();
    const S = {
      autoplay: r,
      delay: o,
      type: a,
      repeat: u,
      repeatDelay: d,
      repeatType: f,
      name: g,
      motionValue: v,
      element: y,
      ...x
    }, A = y?.KeyframeResolver || Gu;
    this.keyframeResolver = new A(h, (E, D, L) => this.onKeyframesResolved(E, D, S, !L), g, v, y), this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(r, o, a, u) {
    this.keyframeResolver = void 0;
    const { name: d, type: f, velocity: h, delay: g, isHandoff: v, onUpdate: y } = a;
    this.resolvedAt = ot.now();
    let x = !0;
    wv(r, d, f, h) || (x = !1, (Ln.instantAnimations || !g) && y?.(Fs(r, a, o)), r[0] = r[r.length - 1], yu(a), a.repeat = 0);
    const A = {
      startTime: u ? this.resolvedAt ? this.resolvedAt - this.createdAt > Ev ? this.resolvedAt : this.createdAt : this.createdAt : void 0,
      finalKeyframe: o,
      ...a,
      keyframes: r
    }, E = x && !v && Pv(A), D = A.motionValue?.owner?.current;
    let L;
    if (E)
      try {
        L = new vv({
          ...A,
          element: D
        });
      } catch {
        L = new js(A);
      }
    else
      L = new js(A);
    L.finished.then(() => {
      this.notifyFinished();
    }).catch(Rt), this.pendingTimeline && (this.stopTimeline = L.attachTimeline(this.pendingTimeline), this.pendingTimeline = void 0), this._animation = L;
  }
  get finished() {
    return this._animation ? this.animation.finished : this._finished;
  }
  then(r, o) {
    return this.finished.finally(r).then(() => {
    });
  }
  get animation() {
    return this._animation || (this.keyframeResolver?.resume(), cv()), this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(r) {
    this.animation.time = r;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(r) {
    this.animation.speed = r;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(r) {
    return this._animation ? this.stopTimeline = this.animation.attachTimeline(r) : this.pendingTimeline = r, () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
  }
}
function Im(n, r, o, a = 0, u = 1) {
  const d = Array.from(n).sort((v, y) => v.sortNodePosition(y)).indexOf(r), f = n.size, h = (f - 1) * a;
  return typeof o == "function" ? o(d, f) : u === 1 ? d * a : h - d * a;
}
const Vh = 30, Rv = (n) => !isNaN(parseFloat(n)), _i = {
  current: void 0
};
class Mv {
  /**
   * @param init - The initiating value
   * @param config - Optional configuration options
   *
   * -  `transformer`: A function to transform incoming values with.
   */
  constructor(r, o = {}) {
    this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (a) => {
      const u = ot.now();
      if (this.updatedAt !== u && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(a), this.current !== this.prev && (this.events.change?.notify(this.current), this.dependents))
        for (const d of this.dependents)
          d.dirty();
    }, this.hasAnimated = !1, this.setCurrent(r), this.owner = o.owner;
  }
  setCurrent(r) {
    this.current = r, this.updatedAt = ot.now(), this.canTrackVelocity === null && r !== void 0 && (this.canTrackVelocity = Rv(this.current));
  }
  setPrevFrameValue(r = this.current) {
    this.prevFrameValue = r, this.prevUpdatedAt = this.updatedAt;
  }
  /**
   * Adds a function that will be notified when the `MotionValue` is updated.
   *
   * It returns a function that, when called, will cancel the subscription.
   *
   * When calling `onChange` inside a React component, it should be wrapped with the
   * `useEffect` hook. As it returns an unsubscribe function, this should be returned
   * from the `useEffect` function to ensure you don't add duplicate subscribers..
   *
   * ```jsx
   * export const MyComponent = () => {
   *   const x = useMotionValue(0)
   *   const y = useMotionValue(0)
   *   const opacity = useMotionValue(1)
   *
   *   useEffect(() => {
   *     function updateOpacity() {
   *       const maxXY = Math.max(x.get(), y.get())
   *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
   *       opacity.set(newOpacity)
   *     }
   *
   *     const unsubscribeX = x.on("change", updateOpacity)
   *     const unsubscribeY = y.on("change", updateOpacity)
   *
   *     return () => {
   *       unsubscribeX()
   *       unsubscribeY()
   *     }
   *   }, [])
   *
   *   return <motion.div style={{ x }} />
   * }
   * ```
   *
   * @param subscriber - A function that receives the latest value.
   * @returns A function that, when called, will cancel this subscription.
   *
   * @deprecated
   */
  onChange(r) {
    return this.on("change", r);
  }
  on(r, o) {
    this.events[r] || (this.events[r] = new Fu());
    const a = this.events[r].add(o);
    return r === "change" ? () => {
      a(), Pe.read(() => {
        this.events.change.getSize() || this.stop();
      });
    } : a;
  }
  clearListeners() {
    for (const r in this.events)
      this.events[r].clear();
  }
  /**
   * Attaches a passive effect to the `MotionValue`.
   */
  attach(r, o) {
    this.passiveEffect = r, this.stopPassiveEffect = o;
  }
  /**
   * Sets the state of the `MotionValue`.
   *
   * @remarks
   *
   * ```jsx
   * const x = useMotionValue(0)
   * x.set(10)
   * ```
   *
   * @param latest - Latest value to set.
   * @param render - Whether to notify render subscribers. Defaults to `true`
   *
   * @public
   */
  set(r) {
    this.passiveEffect ? this.passiveEffect(r, this.updateAndNotify) : this.updateAndNotify(r);
  }
  setWithVelocity(r, o, a) {
    this.set(o), this.prev = void 0, this.prevFrameValue = r, this.prevUpdatedAt = this.updatedAt - a;
  }
  /**
   * Set the state of the `MotionValue`, stopping any active animations,
   * effects, and resets velocity to `0`.
   */
  jump(r, o = !0) {
    this.updateAndNotify(r), this.prev = r, this.prevUpdatedAt = this.prevFrameValue = void 0, o && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(r) {
    this.dependents || (this.dependents = /* @__PURE__ */ new Set()), this.dependents.add(r);
  }
  removeDependent(r) {
    this.dependents && this.dependents.delete(r);
  }
  /**
   * Returns the latest state of `MotionValue`
   *
   * @returns - The latest state of `MotionValue`
   *
   * @public
   */
  get() {
    return _i.current && _i.current.push(this), this.current;
  }
  /**
   * @public
   */
  getPrevious() {
    return this.prev;
  }
  /**
   * Returns the latest velocity of `MotionValue`
   *
   * @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
   *
   * @public
   */
  getVelocity() {
    const r = ot.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || r - this.updatedAt > Vh)
      return 0;
    const o = Math.min(this.updatedAt - this.prevUpdatedAt, Vh);
    return /* @__PURE__ */ rm(parseFloat(this.current) - parseFloat(this.prevFrameValue), o);
  }
  /**
   * Registers a new animation to control this `MotionValue`. Only one
   * animation can drive a `MotionValue` at one time.
   *
   * ```jsx
   * value.start()
   * ```
   *
   * @param animation - A function that starts the provided animation
   */
  start(r) {
    return this.stop(), new Promise((o) => {
      this.hasAnimated = !0, this.animation = r(o), this.events.animationStart && this.events.animationStart.notify();
    }).then(() => {
      this.events.animationComplete && this.events.animationComplete.notify(), this.clearAnimation();
    });
  }
  /**
   * Stop the currently active animation.
   *
   * @public
   */
  stop() {
    this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
  }
  /**
   * Returns `true` if this value is currently animating.
   *
   * @public
   */
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  /**
   * Destroy and clean up subscribers to this `MotionValue`.
   *
   * The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
   * handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
   * created a `MotionValue` via the `motionValue` function.
   *
   * @public
   */
  destroy() {
    this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
}
function nr(n, r) {
  return new Mv(n, r);
}
function Yu(n, r) {
  if (n?.inherit && r) {
    const { inherit: o, ...a } = n;
    return { ...r, ...a };
  }
  return n;
}
function Xu(n, r) {
  const o = n?.[r] ?? n?.default ?? n;
  return o !== n ? Yu(o, n) : o;
}
const Av = {
  type: "spring",
  stiffness: 500,
  damping: 25,
  restSpeed: 10
}, Dv = (n) => ({
  type: "spring",
  stiffness: 550,
  damping: n === 0 ? 2 * Math.sqrt(550) : 30,
  restSpeed: 10
}), Lv = {
  type: "keyframes",
  duration: 0.8
}, Vv = {
  type: "keyframes",
  ease: [0.25, 0.1, 0.35, 1],
  duration: 0.3
}, Nv = (n, { keyframes: r }) => r.length > 2 ? Lv : Or.has(n) ? n.startsWith("scale") ? Dv(r[1]) : Av : Vv, _v = /* @__PURE__ */ new Set([
  "when",
  "delay",
  "delayChildren",
  "staggerChildren",
  "staggerDirection",
  "repeat",
  "repeatType",
  "repeatDelay",
  "from",
  "elapsed"
]);
function zv(n) {
  for (const r in n)
    if (!_v.has(r))
      return !0;
  return !1;
}
const Qu = (n, r, o, a = {}, u, d) => (f) => {
  const h = Xu(a, n) || {}, g = h.delay || a.delay || 0;
  let { elapsed: v = 0 } = a;
  v = v - /* @__PURE__ */ ht(g);
  const y = {
    keyframes: Array.isArray(o) ? o : [null, o],
    ease: "easeOut",
    velocity: r.getVelocity(),
    ...h,
    delay: -v,
    onUpdate: (S) => {
      r.set(S), h.onUpdate && h.onUpdate(S);
    },
    onComplete: () => {
      f(), h.onComplete && h.onComplete();
    },
    name: n,
    motionValue: r,
    element: d ? void 0 : u
  };
  zv(h) || Object.assign(y, Nv(n, y)), y.duration && (y.duration = /* @__PURE__ */ ht(y.duration)), y.repeatDelay && (y.repeatDelay = /* @__PURE__ */ ht(y.repeatDelay)), y.from !== void 0 && (y.keyframes[0] = y.from);
  let x = !1;
  if ((y.type === !1 || y.duration === 0 && !y.repeatDelay) && (yu(y), y.delay === 0 && (x = !0)), (Ln.instantAnimations || Ln.skipAnimations || u?.shouldSkipAnimations || h.skipAnimations) && (x = !0, yu(y), y.delay = 0), y.allowFlatten = !h.type && !h.ease, x && !d && r.get() !== void 0) {
    const S = Fs(y.keyframes, h);
    if (S !== void 0) {
      Pe.update(() => {
        y.onUpdate(S), y.onComplete();
      });
      return;
    }
  }
  return h.isSync ? new js(y) : new jv(y);
}, Iv = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive, as it can match a lot of words
  /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u
);
function Fv(n) {
  const r = Iv.exec(n);
  if (!r)
    return [,];
  const [, o, a, u] = r;
  return [`--${o ?? a}`, u];
}
const bv = 4;
function Fm(n, r, o = 1) {
  tr(o <= bv, `Max CSS variable fallback depth detected in property "${n}". This may indicate a circular fallback dependency.`, "max-css-var-depth");
  const [a, u] = Fv(n);
  if (!a)
    return;
  const d = window.getComputedStyle(r).getPropertyValue(a);
  if (d) {
    const f = d.trim();
    return Jp(f) ? parseFloat(f) : f;
  }
  return Bu(u) ? Fm(u, r, o + 1) : u;
}
function Nh(n) {
  const r = [{}, {}];
  return n?.values.forEach((o, a) => {
    r[0][a] = o.get(), r[1][a] = o.getVelocity();
  }), r;
}
function qu(n, r, o, a) {
  if (typeof r == "function") {
    const [u, d] = Nh(a);
    r = r(o !== void 0 ? o : n.custom, u, d);
  }
  if (typeof r == "string" && (r = n.variants && n.variants[r]), typeof r == "function") {
    const [u, d] = Nh(a);
    r = r(o !== void 0 ? o : n.custom, u, d);
  }
  return r;
}
function er(n, r, o) {
  const a = n.getProps();
  return qu(a, r, o !== void 0 ? o : a.custom, n);
}
const bm = /* @__PURE__ */ new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  ...br
]), gu = (n) => Array.isArray(n);
function Ov(n, r, o) {
  n.hasValue(r) ? n.getValue(r).set(o) : n.addValue(r, nr(o));
}
function Bv(n) {
  return gu(n) ? n[n.length - 1] || 0 : n;
}
function $v(n, r) {
  const o = er(n, r);
  let { transitionEnd: a = {}, transition: u = {}, ...d } = o || {};
  d = { ...d, ...a };
  for (const f in d) {
    const h = Bv(d[f]);
    Ov(n, f, h);
  }
}
const qe = (n) => !!(n && n.getVelocity);
function Wv(n) {
  return !!(qe(n) && n.add);
}
function vu(n, r) {
  const o = n.getValue("willChange");
  if (Wv(o))
    return o.add(r);
  if (!o && Ln.WillChange) {
    const a = new Ln.WillChange("auto");
    n.addValue("willChange", a), a.add(r);
  }
}
function Zu(n) {
  return n.replace(/([A-Z])/g, (r) => `-${r.toLowerCase()}`);
}
const Uv = "framerAppearId", Om = "data-" + Zu(Uv);
function Bm(n) {
  return n.props[Om];
}
function Hv({ protectedKeys: n, needsAnimating: r }, o) {
  const a = n.hasOwnProperty(o) && r[o] !== !0;
  return r[o] = !1, a;
}
function $m(n, r, { delay: o = 0, transitionOverride: a, type: u } = {}) {
  let { transition: d, transitionEnd: f, ...h } = r;
  const g = n.getDefaultTransition();
  d = d ? Yu(d, g) : g;
  const v = d?.reduceMotion, y = d?.skipAnimations;
  a && (d = a);
  const x = [], S = u && n.animationState && n.animationState.getState()[u], A = d?.path;
  A && A.animateVisualElement(n, h, d, o, x);
  for (const E in h) {
    const D = n.getValue(E, n.latestValues[E] ?? null), L = h[E];
    if (L === void 0 || S && Hv(S, E))
      continue;
    const V = {
      delay: o,
      ...Xu(d || {}, E)
    };
    y && (V.skipAnimations = !0);
    const N = D.get();
    if (N !== void 0 && !D.isAnimating() && !Array.isArray(L) && L === N && !V.velocity) {
      Pe.update(() => D.set(L));
      continue;
    }
    let z = !1;
    if (window.MotionHandoffAnimation) {
      const Z = Bm(n);
      if (Z) {
        const te = window.MotionHandoffAnimation(Z, E, Pe);
        te !== null && (V.startTime = te, z = !0);
      }
    }
    vu(n, E);
    const b = v ?? n.shouldReduceMotion;
    D.start(Qu(E, D, L, b && bm.has(E) ? { type: !1 } : V, n, z));
    const ee = D.animation;
    ee && x.push(ee);
  }
  if (f) {
    const E = () => Pe.update(() => {
      f && $v(n, f);
    });
    x.length ? Promise.all(x).then(E) : E();
  }
  return x;
}
function xu(n, r, o = {}) {
  const a = er(n, r, o.type === "exit" ? n.presenceContext?.custom : void 0);
  let { transition: u = n.getDefaultTransition() || {} } = a || {};
  o.transitionOverride && (u = o.transitionOverride);
  const d = a ? () => Promise.all($m(n, a, o)) : () => Promise.resolve(), f = n.variantChildren && n.variantChildren.size ? (g = 0) => {
    const { delayChildren: v = 0, staggerChildren: y, staggerDirection: x } = u;
    return Kv(n, r, g, v, y, x, o);
  } : () => Promise.resolve(), { when: h } = u;
  if (h) {
    const [g, v] = h === "beforeChildren" ? [d, f] : [f, d];
    return g().then(() => v());
  } else
    return Promise.all([d(), f(o.delay)]);
}
function Kv(n, r, o = 0, a = 0, u = 0, d = 1, f) {
  const h = [];
  for (const g of n.variantChildren)
    g.notify("AnimationStart", r), h.push(xu(g, r, {
      ...f,
      delay: o + (typeof a == "function" ? 0 : a) + Im(n.variantChildren, g, a, u, d)
    }).then(() => g.notify("AnimationComplete", r)));
  return Promise.all(h);
}
function Gv(n, r, o = {}) {
  n.notify("AnimationStart", r);
  let a;
  if (Array.isArray(r)) {
    const u = r.map((d) => xu(n, d, o));
    a = Promise.all(u);
  } else if (typeof r == "string")
    a = xu(n, r, o);
  else {
    const u = typeof r == "function" ? er(n, r, o.custom) : r;
    a = Promise.all($m(n, u, o));
  }
  return a.then(() => {
    n.notify("AnimationComplete", r);
  });
}
const Yv = {
  test: (n) => n === "auto",
  parse: (n) => n
}, Wm = (n) => (r) => r.test(n), Um = [Fr, q, Qt, an, w1, x1, Yv], _h = (n) => Um.find(Wm(n));
function Xv(n) {
  return typeof n == "number" ? n === 0 : n !== null ? n === "none" || n === "0" || tm(n) : !0;
}
const Qv = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function qv(n) {
  const [r, o] = n.slice(0, -1).split("(");
  if (r === "drop-shadow")
    return n;
  const [a] = o.match($u) || [];
  if (!a)
    return n;
  const u = o.replace(a, "");
  let d = Qv.has(r) ? 1 : 0;
  return a !== o && (d *= 100), r + "(" + d + u + ")";
}
const Zv = /\b([a-z-]*)\(.*?\)/gu, wu = {
  ...Ft,
  getAnimatableNone: (n) => {
    const r = n.match(Zv);
    return r ? r.map(qv).join(" ") : n;
  }
}, Su = {
  ...Ft,
  getAnimatableNone: (n) => {
    const r = Ft.parse(n);
    return Ft.createTransformer(n)(r.map((a) => typeof a == "number" ? 0 : typeof a == "object" ? { ...a, alpha: 1 } : a));
  }
}, zh = {
  ...Fr,
  transform: Math.round
}, Jv = {
  rotate: an,
  /**
   * Internal channel for `transition.path` orientToPath. Composed onto
   * `rotate` at the transform-build sites so the user's `rotate` is
   * never read or overwritten. Not part of `transformPropOrder`.
   */
  pathRotation: an,
  rotateX: an,
  rotateY: an,
  rotateZ: an,
  scale: ss,
  scaleX: ss,
  scaleY: ss,
  scaleZ: ss,
  skew: an,
  skewX: an,
  skewY: an,
  distance: q,
  translateX: q,
  translateY: q,
  translateZ: q,
  x: q,
  y: q,
  z: q,
  perspective: q,
  transformPerspective: q,
  opacity: Oi,
  originX: kh,
  originY: kh,
  originZ: q
}, Rs = {
  // Border props
  borderWidth: q,
  borderTopWidth: q,
  borderRightWidth: q,
  borderBottomWidth: q,
  borderLeftWidth: q,
  borderRadius: q,
  borderTopLeftRadius: q,
  borderTopRightRadius: q,
  borderBottomRightRadius: q,
  borderBottomLeftRadius: q,
  // Positioning props
  width: q,
  maxWidth: q,
  height: q,
  maxHeight: q,
  top: q,
  right: q,
  bottom: q,
  left: q,
  inset: q,
  insetBlock: q,
  insetBlockStart: q,
  insetBlockEnd: q,
  insetInline: q,
  insetInlineStart: q,
  insetInlineEnd: q,
  // Spacing props
  padding: q,
  paddingTop: q,
  paddingRight: q,
  paddingBottom: q,
  paddingLeft: q,
  paddingBlock: q,
  paddingBlockStart: q,
  paddingBlockEnd: q,
  paddingInline: q,
  paddingInlineStart: q,
  paddingInlineEnd: q,
  margin: q,
  marginTop: q,
  marginRight: q,
  marginBottom: q,
  marginLeft: q,
  marginBlock: q,
  marginBlockStart: q,
  marginBlockEnd: q,
  marginInline: q,
  marginInlineStart: q,
  marginInlineEnd: q,
  // Typography
  fontSize: q,
  // Misc
  backgroundPositionX: q,
  backgroundPositionY: q,
  ...Jv,
  zIndex: zh,
  // SVG
  fillOpacity: Oi,
  strokeOpacity: Oi,
  numOctaves: zh
}, e2 = {
  ...Rs,
  // Color props
  color: Oe,
  backgroundColor: Oe,
  outlineColor: Oe,
  fill: Oe,
  stroke: Oe,
  // Border props
  borderColor: Oe,
  borderTopColor: Oe,
  borderRightColor: Oe,
  borderBottomColor: Oe,
  borderLeftColor: Oe,
  filter: wu,
  WebkitFilter: wu,
  mask: Su,
  WebkitMask: Su
}, Hm = (n) => e2[n], t2 = /* @__PURE__ */ new Set([wu, Su]);
function Km(n, r) {
  let o = Hm(n);
  return t2.has(o) || (o = Ft), o.getAnimatableNone ? o.getAnimatableNone(r) : void 0;
}
const n2 = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function r2(n, r, o) {
  let a = 0, u;
  for (; a < n.length && !u; ) {
    const d = n[a];
    typeof d == "string" && !n2.has(d) && zr(d).values.length && (u = n[a]), a++;
  }
  if (u && o)
    for (const d of r)
      n[d] = Km(o, u);
}
class i2 extends Gu {
  constructor(r, o, a, u, d) {
    super(r, o, a, u, d, !0);
  }
  readKeyframes() {
    const { unresolvedKeyframes: r, element: o, name: a } = this;
    if (!o || !o.current)
      return;
    super.readKeyframes();
    for (let y = 0; y < r.length; y++) {
      let x = r[y];
      if (typeof x == "string" && (x = x.trim(), Bu(x))) {
        const S = Fm(x, o.current);
        S !== void 0 && (r[y] = S), y === r.length - 1 && (this.finalKeyframe = x);
      }
    }
    if (this.resolveNoneKeyframes(), !bm.has(a) || r.length !== 2)
      return;
    const [u, d] = r, f = _h(u), h = _h(d), g = Sh(u), v = Sh(d);
    if (g !== v && Mn[a]) {
      this.needsMeasurement = !0;
      return;
    }
    if (f !== h)
      if (Ah(f) && Ah(h))
        for (let y = 0; y < r.length; y++) {
          const x = r[y];
          typeof x == "string" && (r[y] = parseFloat(x));
        }
      else Mn[a] && (this.needsMeasurement = !0);
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes: r, name: o } = this, a = [];
    for (let u = 0; u < r.length; u++)
      (r[u] === null || Xv(r[u])) && a.push(u);
    a.length && r2(r, a, o);
  }
  measureInitialState() {
    const { element: r, unresolvedKeyframes: o, name: a } = this;
    if (!r || !r.current)
      return;
    a === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = Mn[a](r.measureViewportBox(), window.getComputedStyle(r.current)), o[0] = this.measuredOrigin;
    const u = o[o.length - 1];
    u !== void 0 && r.getValue(a, u).jump(u, !1);
  }
  measureEndState() {
    const { element: r, name: o, unresolvedKeyframes: a } = this;
    if (!r || !r.current)
      return;
    const u = r.getValue(o);
    u && u.jump(this.measuredOrigin, !1);
    const d = a.length - 1, f = a[d];
    a[d] = Mn[o](r.measureViewportBox(), window.getComputedStyle(r.current)), f !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = f), this.removedTransforms?.length && this.removedTransforms.forEach(([h, g]) => {
      r.getValue(h).set(g);
    }), this.resolveNoneKeyframes();
  }
}
const Ju = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius"
];
function Gm(n, r, o) {
  if (n == null)
    return [];
  if (n instanceof EventTarget)
    return [n];
  if (typeof n == "string") {
    let a = document;
    const u = o?.[n] ?? a.querySelectorAll(n);
    return u ? Array.from(u) : [];
  }
  return Array.from(n).filter((a) => a != null);
}
const ku = (n, r) => r && typeof n == "number" ? r.transform(n) : n;
function ms(n) {
  return em(n) && "offsetHeight" in n && !("ownerSVGElement" in n);
}
const { schedule: ec } = /* @__PURE__ */ pm(queueMicrotask, !1), It = {
  x: !1,
  y: !1
};
function Ym() {
  return It.x || It.y;
}
function o2(n) {
  return n === "x" || n === "y" ? It[n] ? null : (It[n] = !0, () => {
    It[n] = !1;
  }) : It.x || It.y ? null : (It.x = It.y = !0, () => {
    It.x = It.y = !1;
  });
}
function Xm(n, r) {
  const o = Gm(n), a = new AbortController(), u = {
    passive: !0,
    ...r,
    signal: a.signal
  };
  return [o, u, () => a.abort()];
}
function s2(n) {
  return !(n.pointerType === "touch" || Ym());
}
function a2(n, r, o = {}) {
  const [a, u, d] = Xm(n, o);
  return a.forEach((f) => {
    let h = !1, g = !1, v;
    const y = () => {
      f.removeEventListener("pointerleave", E);
    }, x = (L) => {
      v && (v(L), v = void 0), y();
    }, S = (L) => {
      h = !1, window.removeEventListener("pointerup", S), window.removeEventListener("pointercancel", S), g && (g = !1, x(L));
    }, A = () => {
      h = !0, window.addEventListener("pointerup", S, u), window.addEventListener("pointercancel", S, u);
    }, E = (L) => {
      if (L.pointerType !== "touch") {
        if (h) {
          g = !0;
          return;
        }
        x(L);
      }
    }, D = (L) => {
      if (!s2(L))
        return;
      g = !1;
      const V = r(f, L);
      typeof V == "function" && (v = V, f.addEventListener("pointerleave", E, u));
    };
    f.addEventListener("pointerenter", D, u), f.addEventListener("pointerdown", A, u);
  }), d;
}
const Qm = (n, r) => r ? n === r ? !0 : Qm(n, r.parentElement) : !1, tc = (n) => n.pointerType === "mouse" ? typeof n.button != "number" || n.button <= 0 : n.isPrimary !== !1, l2 = /* @__PURE__ */ new Set([
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "A"
]);
function u2(n) {
  return l2.has(n.tagName) || n.isContentEditable === !0;
}
const c2 = /* @__PURE__ */ new Set(["INPUT", "SELECT", "TEXTAREA"]);
function f2(n) {
  return c2.has(n.tagName) || n.isContentEditable === !0;
}
const ys = /* @__PURE__ */ new WeakSet();
function Ih(n) {
  return (r) => {
    r.key === "Enter" && n(r);
  };
}
function Kl(n, r) {
  n.dispatchEvent(new PointerEvent("pointer" + r, { isPrimary: !0, bubbles: !0 }));
}
const d2 = (n, r) => {
  const o = n.currentTarget;
  if (!o)
    return;
  const a = Ih(() => {
    if (ys.has(o))
      return;
    Kl(o, "down");
    const u = Ih(() => {
      Kl(o, "up");
    }), d = () => Kl(o, "cancel");
    o.addEventListener("keyup", u, r), o.addEventListener("blur", d, r);
  });
  o.addEventListener("keydown", a, r), o.addEventListener("blur", () => o.removeEventListener("keydown", a), r);
};
function Fh(n) {
  return tc(n) && !Ym();
}
const bh = /* @__PURE__ */ new WeakSet();
function h2(n, r, o = {}) {
  const [a, u, d] = Xm(n, o), f = (h) => {
    const g = h.currentTarget;
    if (!Fh(h) || bh.has(h))
      return;
    ys.add(g), o.stopPropagation && bh.add(h);
    const v = r(g, h), y = { ...u, capture: !0 }, x = (E, D) => {
      window.removeEventListener("pointerup", S, y), window.removeEventListener("pointercancel", A, y), ys.has(g) && ys.delete(g), Fh(E) && typeof v == "function" && v(E, { success: D });
    }, S = (E) => {
      x(E, g === window || g === document || o.useGlobalTarget || Qm(g, E.target));
    }, A = (E) => {
      x(E, !1);
    };
    window.addEventListener("pointerup", S, y), window.addEventListener("pointercancel", A, y);
  };
  return a.forEach((h) => {
    (o.useGlobalTarget ? window : h).addEventListener("pointerdown", f, u), ms(h) && (h.addEventListener("focus", (v) => d2(v, u)), !u2(h) && !h.hasAttribute("tabindex") && (h.tabIndex = 0));
  }), d;
}
function nc(n) {
  return em(n) && "ownerSVGElement" in n;
}
const gs = /* @__PURE__ */ new WeakMap();
let vs;
const qm = (n, r, o) => (a, u) => u && u[0] ? u[0][n + "Size"] : nc(a) && "getBBox" in a ? a.getBBox()[r] : a[o], p2 = /* @__PURE__ */ qm("inline", "width", "offsetWidth"), m2 = /* @__PURE__ */ qm("block", "height", "offsetHeight");
function y2({ target: n, borderBoxSize: r }) {
  gs.get(n)?.forEach((o) => {
    o(n, {
      get width() {
        return p2(n, r);
      },
      get height() {
        return m2(n, r);
      }
    });
  });
}
function g2(n) {
  n.forEach(y2);
}
function v2() {
  typeof ResizeObserver > "u" || (vs = new ResizeObserver(g2));
}
function x2(n, r) {
  vs || v2();
  const o = Gm(n);
  return o.forEach((a) => {
    let u = gs.get(a);
    u || (u = /* @__PURE__ */ new Set(), gs.set(a, u)), u.add(r), vs?.observe(a);
  }), () => {
    o.forEach((a) => {
      const u = gs.get(a);
      u?.delete(r), u?.size || vs?.unobserve(a);
    });
  };
}
const xs = /* @__PURE__ */ new Set();
let Vr;
function w2() {
  Vr = () => {
    const n = {
      get width() {
        return window.innerWidth;
      },
      get height() {
        return window.innerHeight;
      }
    };
    xs.forEach((r) => r(n));
  }, window.addEventListener("resize", Vr);
}
function S2(n) {
  return xs.add(n), Vr || w2(), () => {
    xs.delete(n), !xs.size && typeof Vr == "function" && (window.removeEventListener("resize", Vr), Vr = void 0);
  };
}
function Oh(n, r) {
  return typeof n == "function" ? S2(n) : x2(n, r);
}
function k2(n) {
  return nc(n) && n.tagName === "svg";
}
function C2(...n) {
  const r = !Array.isArray(n[0]), o = r ? 0 : -1, a = n[0 + o], u = n[1 + o], d = n[2 + o], f = n[3 + o], h = Pm(u, d, f);
  return r ? h(a) : h;
}
const T2 = [...Um, Oe, Ft], P2 = (n) => T2.find(Wm(n)), Bh = () => ({
  translate: 0,
  scale: 1,
  origin: 0,
  originPoint: 0
}), Nr = () => ({
  x: Bh(),
  y: Bh()
}), $h = () => ({ min: 0, max: 0 }), We = () => ({
  x: $h(),
  y: $h()
}), E2 = /* @__PURE__ */ new WeakMap();
function bs(n) {
  return n !== null && typeof n == "object" && typeof n.start == "function";
}
function Bi(n) {
  return typeof n == "string" || Array.isArray(n);
}
const rc = [
  "animate",
  "whileInView",
  "whileFocus",
  "whileHover",
  "whileTap",
  "whileDrag",
  "exit"
], ic = ["initial", ...rc];
function Os(n) {
  return bs(n.animate) || ic.some((r) => Bi(n[r]));
}
function Zm(n) {
  return !!(Os(n) || n.variants);
}
function j2(n, r, o) {
  for (const a in r) {
    const u = r[a], d = o[a];
    if (qe(u))
      n.addValue(a, u);
    else if (qe(d))
      n.addValue(a, nr(u, { owner: n }));
    else if (d !== u)
      if (n.hasValue(a)) {
        const f = n.getValue(a);
        f.liveStyle === !0 ? f.jump(u) : f.hasAnimated || f.set(u);
      } else {
        const f = n.getStaticValue(a);
        n.addValue(a, nr(f !== void 0 ? f : u, { owner: n }));
      }
  }
  for (const a in o)
    r[a] === void 0 && n.removeValue(a);
  return r;
}
const Cu = { current: null }, Jm = { current: !1 }, R2 = typeof window < "u";
function M2() {
  if (Jm.current = !0, !!R2)
    if (window.matchMedia) {
      const n = window.matchMedia("(prefers-reduced-motion)"), r = () => Cu.current = n.matches;
      n.addEventListener("change", r), r();
    } else
      Cu.current = !1;
}
const Wh = [
  "AnimationStart",
  "AnimationComplete",
  "Update",
  "BeforeLayoutMeasure",
  "LayoutMeasure",
  "LayoutAnimationStart",
  "LayoutAnimationComplete"
];
let Ms = {};
function e0(n) {
  Ms = n;
}
function A2() {
  return Ms;
}
class D2 {
  /**
   * This method takes React props and returns found MotionValues. For example, HTML
   * MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
   *
   * This isn't an abstract method as it needs calling in the constructor, but it is
   * intended to be one.
   */
  scrapeMotionValuesFromProps(r, o, a) {
    return {};
  }
  constructor({ parent: r, props: o, presenceContext: a, reducedMotionConfig: u, skipAnimations: d, blockInitialAnimation: f, visualState: h }, g = {}) {
    this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.shouldSkipAnimations = !1, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = Gu, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.hasBeenMounted = !1, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
      this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
    }, this.renderScheduledAt = 0, this.scheduleRender = () => {
      const A = ot.now();
      this.renderScheduledAt < A && (this.renderScheduledAt = A, Pe.render(this.render, !1, !0));
    };
    const { latestValues: v, renderState: y } = h;
    this.latestValues = v, this.baseTarget = { ...v }, this.initialValues = o.initial ? { ...v } : {}, this.renderState = y, this.parent = r, this.props = o, this.presenceContext = a, this.depth = r ? r.depth + 1 : 0, this.reducedMotionConfig = u, this.skipAnimationsConfig = d, this.options = g, this.blockInitialAnimation = !!f, this.isControllingVariants = Os(o), this.isVariantNode = Zm(o), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(r && r.current);
    const { willChange: x, ...S } = this.scrapeMotionValuesFromProps(o, {}, this);
    for (const A in S) {
      const E = S[A];
      v[A] !== void 0 && qe(E) && E.set(v[A]);
    }
  }
  mount(r) {
    if (this.hasBeenMounted)
      for (const o in this.initialValues)
        this.values.get(o)?.jump(this.initialValues[o]), this.latestValues[o] = this.initialValues[o];
    this.current = r, E2.set(r, this), this.projection && !this.projection.instance && this.projection.mount(r), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((o, a) => this.bindToMotionValue(a, o)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = !1 : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = !0 : (Jm.current || M2(), this.shouldReduceMotion = Cu.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? !1, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = !0;
  }
  unmount() {
    this.projection && this.projection.unmount(), ln(this.notifyUpdate), ln(this.render), this.valueSubscriptions.forEach((r) => r()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
    for (const r in this.events)
      this.events[r].clear();
    for (const r in this.features) {
      const o = this.features[r];
      o && (o.unmount(), o.isMounted = !1);
    }
    this.current = null;
  }
  addChild(r) {
    this.children.add(r), this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set()), this.enteringChildren.add(r);
  }
  removeChild(r) {
    this.children.delete(r), this.enteringChildren && this.enteringChildren.delete(r);
  }
  bindToMotionValue(r, o) {
    if (this.valueSubscriptions.has(r) && this.valueSubscriptions.get(r)(), o.accelerate && zm.has(r) && this.current instanceof HTMLElement) {
      const { factory: f, keyframes: h, times: g, ease: v, duration: y } = o.accelerate, x = new Nm({
        element: this.current,
        name: r,
        keyframes: h,
        times: g,
        ease: v,
        duration: /* @__PURE__ */ ht(y)
      }), S = f(x);
      this.valueSubscriptions.set(r, () => {
        S(), x.cancel();
      });
      return;
    }
    const a = Or.has(r);
    a && this.onBindTransform && this.onBindTransform();
    const u = o.on("change", (f) => {
      this.latestValues[r] = f, this.props.onUpdate && Pe.preRender(this.notifyUpdate), a && this.projection && (this.projection.isTransformDirty = !0), this.scheduleRender();
    });
    let d;
    typeof window < "u" && window.MotionCheckAppearSync && (d = window.MotionCheckAppearSync(this, r, o)), this.valueSubscriptions.set(r, () => {
      u(), d && d();
    });
  }
  sortNodePosition(r) {
    return !this.current || !this.sortInstanceNodePosition || this.type !== r.type ? 0 : this.sortInstanceNodePosition(this.current, r.current);
  }
  updateFeatures() {
    let r = "animation";
    for (r in Ms) {
      const o = Ms[r];
      if (!o)
        continue;
      const { isEnabled: a, Feature: u } = o;
      if (!this.features[r] && u && a(this.props) && (this.features[r] = new u(this)), this.features[r]) {
        const d = this.features[r];
        d.isMounted ? d.update() : (d.mount(), d.isMounted = !0);
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  /**
   * Measure the current viewport box with or without transforms.
   * Only measures axis-aligned boxes, rotate and skew must be manually
   * removed with a re-render to work.
   */
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : We();
  }
  getStaticValue(r) {
    return this.latestValues[r];
  }
  setStaticValue(r, o) {
    this.latestValues[r] = o;
  }
  /**
   * Update the provided props. Ensure any newly-added motion values are
   * added to our map, old ones removed, and listeners updated.
   */
  update(r, o) {
    (r.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = r, this.prevPresenceContext = this.presenceContext, this.presenceContext = o;
    for (let a = 0; a < Wh.length; a++) {
      const u = Wh[a];
      this.propEventSubscriptions[u] && (this.propEventSubscriptions[u](), delete this.propEventSubscriptions[u]);
      const d = "on" + u, f = r[d];
      f && (this.propEventSubscriptions[u] = this.on(u, f));
    }
    this.prevMotionValues = j2(this, this.scrapeMotionValuesFromProps(r, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  /**
   * Returns the variant definition with a given name.
   */
  getVariant(r) {
    return this.props.variants ? this.props.variants[r] : void 0;
  }
  /**
   * Returns the defined default transition on this component.
   */
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  /**
   * Add a child visual element to our set of children.
   */
  addVariantChild(r) {
    const o = this.getClosestVariantNode();
    if (o)
      return o.variantChildren && o.variantChildren.add(r), () => o.variantChildren.delete(r);
  }
  /**
   * Add a motion value and bind it to this visual element.
   */
  addValue(r, o) {
    const a = this.values.get(r);
    o !== a && (a && this.removeValue(r), this.bindToMotionValue(r, o), this.values.set(r, o), this.latestValues[r] = o.get());
  }
  /**
   * Remove a motion value and unbind any active subscriptions.
   */
  removeValue(r) {
    this.values.delete(r);
    const o = this.valueSubscriptions.get(r);
    o && (o(), this.valueSubscriptions.delete(r)), delete this.latestValues[r], this.removeValueFromRenderState(r, this.renderState);
  }
  /**
   * Check whether we have a motion value for this key
   */
  hasValue(r) {
    return this.values.has(r);
  }
  getValue(r, o) {
    if (this.props.values && this.props.values[r])
      return this.props.values[r];
    let a = this.values.get(r);
    return a === void 0 && o !== void 0 && (a = nr(o === null ? void 0 : o, { owner: this }), this.addValue(r, a)), a;
  }
  /**
   * If we're trying to animate to a previously unencountered value,
   * we need to check for it in our state and as a last resort read it
   * directly from the instance (which might have performance implications).
   */
  readValue(r, o) {
    let a = this.latestValues[r] !== void 0 || !this.current ? this.latestValues[r] : this.getBaseTargetFromProps(this.props, r) ?? this.readValueFromInstance(this.current, r, this.options);
    return a != null && (typeof a == "string" && (Jp(a) || tm(a)) ? a = parseFloat(a) : !P2(a) && Ft.test(o) && (a = Km(r, o)), this.setBaseTarget(r, qe(a) ? a.get() : a)), qe(a) ? a.get() : a;
  }
  /**
   * Set the base target to later animate back to. This is currently
   * only hydrated on creation and when we first read a value.
   */
  setBaseTarget(r, o) {
    this.baseTarget[r] = o;
  }
  /**
   * Find the base target for a value thats been removed from all animation
   * props.
   */
  getBaseTarget(r) {
    const { initial: o } = this.props;
    let a;
    if (typeof o == "string" || typeof o == "object") {
      const d = qu(this.props, o, this.presenceContext?.custom);
      d && (a = d[r]);
    }
    if (o && a !== void 0)
      return a;
    const u = this.getBaseTargetFromProps(this.props, r);
    return u !== void 0 && !qe(u) ? u : this.initialValues[r] !== void 0 && a === void 0 ? void 0 : this.baseTarget[r];
  }
  on(r, o) {
    return this.events[r] || (this.events[r] = new Fu()), this.events[r].add(o);
  }
  notify(r, ...o) {
    this.events[r] && this.events[r].notify(...o);
  }
  scheduleRenderMicrotask() {
    ec.render(this.render);
  }
}
class t0 extends D2 {
  constructor() {
    super(...arguments), this.KeyframeResolver = i2;
  }
  sortInstanceNodePosition(r, o) {
    return r.compareDocumentPosition(o) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(r, o) {
    const a = r.style;
    return a ? a[o] : void 0;
  }
  removeValueFromRenderState(r, { vars: o, style: a }) {
    delete o[r], delete a[r];
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    const { children: r } = this.props;
    qe(r) && (this.childSubscription = r.on("change", (o) => {
      this.current && (this.current.textContent = `${o}`);
    }));
  }
}
class Vn {
  constructor(r) {
    this.isMounted = !1, this.node = r;
  }
  update() {
  }
}
function n0({ top: n, left: r, right: o, bottom: a }) {
  return {
    x: { min: r, max: o },
    y: { min: n, max: a }
  };
}
function L2({ x: n, y: r }) {
  return { top: r.min, right: n.max, bottom: r.max, left: n.min };
}
function V2(n, r) {
  if (!r)
    return n;
  const o = r({ x: n.left, y: n.top }), a = r({ x: n.right, y: n.bottom });
  return {
    top: o.y,
    left: o.x,
    bottom: a.y,
    right: a.x
  };
}
function Gl(n) {
  return n === void 0 || n === 1;
}
function Tu({ scale: n, scaleX: r, scaleY: o }) {
  return !Gl(n) || !Gl(r) || !Gl(o);
}
function Qn(n) {
  return Tu(n) || r0(n) || n.z || n.rotate || n.rotateX || n.rotateY || n.skewX || n.skewY;
}
function r0(n) {
  return Uh(n.x) || Uh(n.y);
}
function Uh(n) {
  return n && n !== "0%";
}
function As(n, r, o) {
  const a = n - o, u = r * a;
  return o + u;
}
function Hh(n, r, o, a, u) {
  return u !== void 0 && (n = As(n, u, a)), As(n, o, a) + r;
}
function Pu(n, r = 0, o = 1, a, u) {
  n.min = Hh(n.min, r, o, a, u), n.max = Hh(n.max, r, o, a, u);
}
function i0(n, { x: r, y: o }) {
  Pu(n.x, r.translate, r.scale, r.originPoint), Pu(n.y, o.translate, o.scale, o.originPoint);
}
const Kh = 0.999999999999, Gh = 1.0000000000001;
function N2(n, r, o, a = !1) {
  const u = o.length;
  if (!u)
    return;
  r.x = r.y = 1;
  let d, f;
  for (let h = 0; h < u; h++) {
    d = o[h], f = d.projectionDelta;
    const { visualElement: g } = d.options;
    g && g.props.style && g.props.style.display === "contents" || (a && d.options.layoutScroll && d.scroll && d !== d.root && (Yt(n.x, -d.scroll.offset.x), Yt(n.y, -d.scroll.offset.y)), f && (r.x *= f.x.scale, r.y *= f.y.scale, i0(n, f)), a && Qn(d.latestValues) && ws(n, d.latestValues, d.layout?.layoutBox));
  }
  r.x < Gh && r.x > Kh && (r.x = 1), r.y < Gh && r.y > Kh && (r.y = 1);
}
function Yt(n, r) {
  n.min += r, n.max += r;
}
function Yh(n, r, o, a, u = 0.5) {
  const d = Ee(n.min, n.max, u);
  Pu(n, r, o, d, a);
}
function Xh(n, r) {
  return typeof n == "string" ? parseFloat(n) / 100 * (r.max - r.min) : n;
}
function ws(n, r, o) {
  const a = o ?? n;
  Yh(n.x, Xh(r.x, a.x), r.scaleX, r.scale, r.originX), Yh(n.y, Xh(r.y, a.y), r.scaleY, r.scale, r.originY);
}
function o0(n, r) {
  return n0(V2(n.getBoundingClientRect(), r));
}
function _2(n, r, o) {
  const a = o0(n, o), { scroll: u } = r;
  return u && (Yt(a.x, u.offset.x), Yt(a.y, u.offset.y)), a;
}
const z2 = {
  x: "translateX",
  y: "translateY",
  z: "translateZ",
  transformPerspective: "perspective"
}, I2 = br.length;
function F2(n, r, o) {
  let a = "", u = !0;
  for (let f = 0; f < I2; f++) {
    const h = br[f], g = n[h];
    if (g === void 0)
      continue;
    let v = !0;
    if (typeof g == "number")
      v = g === (h.startsWith("scale") ? 1 : 0);
    else {
      const y = parseFloat(g);
      v = h.startsWith("scale") ? y === 1 : y === 0;
    }
    if (!v || o) {
      const y = ku(g, Rs[h]);
      if (!v) {
        u = !1;
        const x = z2[h] || h;
        a += `${x}(${y}) `;
      }
      o && (r[h] = y);
    }
  }
  const d = n.pathRotation;
  return d && (u = !1, a += `rotate(${ku(d, Rs.pathRotation)}) `), a = a.trim(), o ? a = o(r, u ? "" : a) : u && (a = "none"), a;
}
function oc(n, r, o) {
  const { style: a, vars: u, transformOrigin: d } = n;
  let f = !1, h = !1;
  for (const g in r) {
    const v = r[g];
    if (Or.has(g)) {
      f = !0;
      continue;
    } else if (ym(g)) {
      u[g] = v;
      continue;
    } else {
      const y = ku(v, Rs[g]);
      g.startsWith("origin") ? (h = !0, d[g] = y) : a[g] = y;
    }
  }
  if (r.transform || (f || o ? a.transform = F2(r, n.transform, o) : a.transform && (a.transform = "none")), h) {
    const { originX: g = "50%", originY: v = "50%", originZ: y = 0 } = d;
    a.transformOrigin = `${g} ${v} ${y}`;
  }
}
function s0(n, { style: r, vars: o }, a, u) {
  const d = n.style;
  let f;
  for (f in r)
    d[f] = r[f];
  u?.applyProjectionStyles(d, a);
  for (f in o)
    d.setProperty(f, o[f]);
}
function Qh(n, r) {
  return r.max === r.min ? 0 : n / (r.max - r.min) * 100;
}
const Ri = {
  correct: (n, r) => {
    if (!r.target)
      return n;
    if (typeof n == "string")
      if (q.test(n))
        n = parseFloat(n);
      else
        return n;
    const o = Qh(n, r.target.x), a = Qh(n, r.target.y);
    return `${o}% ${a}%`;
  }
}, b2 = {
  correct: (n, { treeScale: r, projectionDelta: o }) => {
    const a = n, u = Ft.parse(n);
    if (u.length > 5)
      return a;
    const d = Ft.createTransformer(n), f = typeof u[0] != "number" ? 1 : 0, h = o.x.scale * r.x, g = o.y.scale * r.y;
    u[0 + f] /= h, u[1 + f] /= g;
    const v = Ee(h, g, 0.5);
    return typeof u[2 + f] == "number" && (u[2 + f] /= v), typeof u[3 + f] == "number" && (u[3 + f] /= v), d(u);
  }
}, Eu = {
  borderRadius: {
    ...Ri,
    applyTo: [...Ju]
  },
  borderTopLeftRadius: Ri,
  borderTopRightRadius: Ri,
  borderBottomLeftRadius: Ri,
  borderBottomRightRadius: Ri,
  boxShadow: b2
};
function a0(n, { layout: r, layoutId: o }) {
  return Or.has(n) || n.startsWith("origin") || (r || o !== void 0) && (!!Eu[n] || n === "opacity");
}
function sc(n, r, o) {
  const a = n.style, u = r?.style, d = {};
  if (!a)
    return d;
  for (const f in a)
    (qe(a[f]) || u && qe(u[f]) || a0(f, n) || o?.getValue(f)?.liveStyle !== void 0) && (d[f] = a[f]);
  return d;
}
function O2(n) {
  return window.getComputedStyle(n);
}
class B2 extends t0 {
  constructor() {
    super(...arguments), this.type = "html", this.renderInstance = s0;
  }
  readValueFromInstance(r, o) {
    if (Or.has(o))
      return this.projection?.isProjecting ? fu(o) : ov(r, o);
    {
      const a = O2(r), u = (ym(o) ? a.getPropertyValue(o) : a[o]) || 0;
      return typeof u == "string" ? u.trim() : u;
    }
  }
  measureInstanceViewportBox(r, { transformPagePoint: o }) {
    return o0(r, o);
  }
  build(r, o, a) {
    oc(r, o, a.transformTemplate);
  }
  scrapeMotionValuesFromProps(r, o, a) {
    return sc(r, o, a);
  }
}
const $2 = {
  offset: "stroke-dashoffset",
  array: "stroke-dasharray"
}, W2 = {
  offset: "strokeDashoffset",
  array: "strokeDasharray"
};
function U2(n, r, o = 1, a = 0, u = !0) {
  n.pathLength = 1;
  const d = u ? $2 : W2;
  n[d.offset] = `${-a}`, n[d.array] = `${r} ${o}`;
}
const H2 = [
  "offsetDistance",
  "offsetPath",
  "offsetRotate",
  "offsetAnchor"
];
function l0(n, {
  attrX: r,
  attrY: o,
  attrScale: a,
  pathLength: u,
  pathSpacing: d = 1,
  pathOffset: f = 0,
  // This is object creation, which we try to avoid per-frame.
  ...h
}, g, v, y) {
  if (oc(n, h, v), g) {
    n.style.viewBox && (n.attrs.viewBox = n.style.viewBox);
    return;
  }
  n.attrs = n.style, n.style = {};
  const { attrs: x, style: S } = n;
  x.transform && (S.transform = x.transform, delete x.transform), (S.transform || x.transformOrigin) && (S.transformOrigin = x.transformOrigin ?? "50% 50%", delete x.transformOrigin), S.transform && (S.transformBox = y?.transformBox ?? "fill-box", delete x.transformBox);
  for (const A of H2)
    x[A] !== void 0 && (S[A] = x[A], delete x[A]);
  r !== void 0 && (x.x = r), o !== void 0 && (x.y = o), a !== void 0 && (x.scale = a), u !== void 0 && U2(x, u, d, f, !1);
}
const u0 = /* @__PURE__ */ new Set([
  "baseFrequency",
  "diffuseConstant",
  "kernelMatrix",
  "kernelUnitLength",
  "keySplines",
  "keyTimes",
  "limitingConeAngle",
  "markerHeight",
  "markerWidth",
  "numOctaves",
  "targetX",
  "targetY",
  "surfaceScale",
  "specularConstant",
  "specularExponent",
  "stdDeviation",
  "tableValues",
  "viewBox",
  "gradientTransform",
  "pathLength",
  "startOffset",
  "textLength",
  "lengthAdjust"
]), c0 = (n) => typeof n == "string" && n.toLowerCase() === "svg";
function K2(n, r, o, a) {
  s0(n, r, void 0, a);
  for (const u in r.attrs)
    n.setAttribute(u0.has(u) ? u : Zu(u), r.attrs[u]);
}
function f0(n, r, o) {
  const a = sc(n, r, o);
  for (const u in n)
    if (qe(n[u]) || qe(r[u])) {
      const d = br.indexOf(u) !== -1 ? "attr" + u.charAt(0).toUpperCase() + u.substring(1) : u;
      a[d] = n[u];
    }
  return a;
}
class G2 extends t0 {
  constructor() {
    super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = We;
  }
  getBaseTargetFromProps(r, o) {
    return r[o];
  }
  readValueFromInstance(r, o) {
    if (Or.has(o)) {
      const a = Hm(o);
      return a && a.default || 0;
    }
    return o = u0.has(o) ? o : Zu(o), r.getAttribute(o);
  }
  scrapeMotionValuesFromProps(r, o, a) {
    return f0(r, o, a);
  }
  build(r, o, a) {
    l0(r, o, this.isSVGTag, a.transformTemplate, a.style);
  }
  renderInstance(r, o, a, u) {
    K2(r, o, a, u);
  }
  mount(r) {
    this.isSVGTag = c0(r.tagName), super.mount(r);
  }
}
const Y2 = ic.length;
function d0(n) {
  if (!n)
    return;
  if (!n.isControllingVariants) {
    const o = n.parent ? d0(n.parent) || {} : {};
    return n.props.initial !== void 0 && (o.initial = n.props.initial), o;
  }
  const r = {};
  for (let o = 0; o < Y2; o++) {
    const a = ic[o], u = n.props[a];
    (Bi(u) || u === !1) && (r[a] = u);
  }
  return r;
}
function h0(n, r) {
  if (!Array.isArray(r))
    return !1;
  const o = r.length;
  if (o !== n.length)
    return !1;
  for (let a = 0; a < o; a++)
    if (r[a] !== n[a])
      return !1;
  return !0;
}
const X2 = [...rc].reverse(), Q2 = rc.length;
function q2(n) {
  return (r) => Promise.all(r.map(({ animation: o, options: a }) => Gv(n, o, a)));
}
function Z2(n) {
  let r = q2(n), o = qh(), a = !0, u = !1;
  const d = (v) => (y, x) => {
    const S = er(n, x, v === "exit" ? n.presenceContext?.custom : void 0);
    if (S) {
      const { transition: A, transitionEnd: E, ...D } = S;
      y = { ...y, ...D, ...E };
    }
    return y;
  };
  function f(v) {
    r = v(n);
  }
  function h(v) {
    const { props: y } = n, x = d0(n.parent) || {}, S = [], A = /* @__PURE__ */ new Set();
    let E = {}, D = 1 / 0;
    for (let V = 0; V < Q2; V++) {
      const N = X2[V], z = o[N], b = y[N] !== void 0 ? y[N] : x[N], ee = Bi(b), Z = N === v ? z.isActive : null;
      Z === !1 && (D = V);
      let te = b === x[N] && b !== y[N] && ee;
      if (te && (a || u) && n.manuallyAnimateOnMount && (te = !1), z.protectedKeys = { ...E }, // If it isn't active and hasn't *just* been set as inactive
      !z.isActive && Z === null || // If we didn't and don't have any defined prop for this animation type
      !b && !z.prevProp || // Or if the prop doesn't define an animation
      bs(b) || typeof b == "boolean")
        continue;
      if (N === "exit" && z.isActive && Z !== !0) {
        z.prevResolvedValues && (E = {
          ...E,
          ...z.prevResolvedValues
        });
        continue;
      }
      const W = J2(z.prevProp, b);
      let ae = W || // If we're making this variant active, we want to always make it active
      N === v && z.isActive && !te && ee || // If we removed a higher-priority variant (i is in reverse order)
      V > D && ee, K = !1;
      const ye = Array.isArray(b) ? b : [b];
      let ge = ye.reduce(d(N), {});
      Z === !1 && (ge = {});
      const { prevResolvedValues: ie = {} } = z, ue = {
        ...ie,
        ...ge
      }, we = (B) => {
        ae = !0, A.has(B) && (K = !0, A.delete(B)), z.needsAnimating[B] = !0;
        const X = n.getValue(B);
        X && (X.liveStyle = !1);
      };
      for (const B in ue) {
        const X = ge[B], U = ie[B];
        if (E.hasOwnProperty(B))
          continue;
        let T = !1;
        gu(X) && gu(U) ? T = !h0(X, U) || W : T = X !== U, T ? X != null ? we(B) : A.add(B) : X !== void 0 && A.has(B) ? we(B) : z.protectedKeys[B] = !0;
      }
      z.prevProp = b, z.prevResolvedValues = ge, z.isActive && (E = { ...E, ...ge }), (a || u) && n.blockInitialAnimation && (ae = !1);
      const Te = te && W;
      ae && (!Te || K) && S.push(...ye.map((B) => {
        const X = { type: N };
        if (typeof B == "string" && (a || u) && !Te && n.manuallyAnimateOnMount && n.parent) {
          const { parent: U } = n, T = er(U, B);
          if (U.enteringChildren && T) {
            const { delayChildren: _ } = T.transition || {};
            X.delay = Im(U.enteringChildren, n, _);
          }
        }
        return {
          animation: B,
          options: X
        };
      }));
    }
    if (A.size) {
      const V = {};
      if (typeof y.initial != "boolean") {
        const N = er(n, Array.isArray(y.initial) ? y.initial[0] : y.initial);
        N && N.transition && (V.transition = N.transition);
      }
      A.forEach((N) => {
        const z = n.getBaseTarget(N), b = n.getValue(N);
        b && (b.liveStyle = !0), V[N] = z ?? null;
      }), S.push({ animation: V });
    }
    let L = !!S.length;
    return a && (y.initial === !1 || y.initial === y.animate) && !n.manuallyAnimateOnMount && (L = !1), a = !1, u = !1, L ? r(S) : Promise.resolve();
  }
  function g(v, y) {
    if (o[v].isActive === y)
      return Promise.resolve();
    n.variantChildren?.forEach((S) => S.animationState?.setActive(v, y)), o[v].isActive = y;
    const x = h(v);
    for (const S in o)
      o[S].protectedKeys = {};
    return x;
  }
  return {
    animateChanges: h,
    setActive: g,
    setAnimateFunction: f,
    getState: () => o,
    reset: () => {
      o = qh(), u = !0;
    }
  };
}
function J2(n, r) {
  return typeof r == "string" ? r !== n : Array.isArray(r) ? !h0(r, n) : !1;
}
function Yn(n = !1) {
  return {
    isActive: n,
    protectedKeys: {},
    needsAnimating: {},
    prevResolvedValues: {}
  };
}
function qh() {
  return {
    animate: Yn(!0),
    whileInView: Yn(),
    whileHover: Yn(),
    whileTap: Yn(),
    whileDrag: Yn(),
    whileFocus: Yn(),
    exit: Yn()
  };
}
function ju(n, r) {
  n.min = r.min, n.max = r.max;
}
function zt(n, r) {
  ju(n.x, r.x), ju(n.y, r.y);
}
function Zh(n, r) {
  n.translate = r.translate, n.scale = r.scale, n.originPoint = r.originPoint, n.origin = r.origin;
}
const p0 = 1e-4, ex = 1 - p0, tx = 1 + p0, m0 = 0.01, nx = 0 - m0, rx = 0 + m0;
function st(n) {
  return n.max - n.min;
}
function ix(n, r, o) {
  return Math.abs(n - r) <= o;
}
function Jh(n, r, o, a = 0.5) {
  n.origin = a, n.originPoint = Ee(r.min, r.max, n.origin), n.scale = st(o) / st(r), n.translate = Ee(o.min, o.max, n.origin) - n.originPoint, (n.scale >= ex && n.scale <= tx || isNaN(n.scale)) && (n.scale = 1), (n.translate >= nx && n.translate <= rx || isNaN(n.translate)) && (n.translate = 0);
}
function zi(n, r, o, a) {
  Jh(n.x, r.x, o.x, a ? a.originX : void 0), Jh(n.y, r.y, o.y, a ? a.originY : void 0);
}
function ep(n, r, o, a = 0) {
  const u = a ? Ee(o.min, o.max, a) : o.min;
  n.min = u + r.min, n.max = n.min + st(r);
}
function ox(n, r, o, a) {
  ep(n.x, r.x, o.x, a?.x), ep(n.y, r.y, o.y, a?.y);
}
function tp(n, r, o, a = 0) {
  const u = a ? Ee(o.min, o.max, a) : o.min;
  n.min = r.min - u, n.max = n.min + st(r);
}
function Ds(n, r, o, a) {
  tp(n.x, r.x, o.x, a?.x), tp(n.y, r.y, o.y, a?.y);
}
function np(n, r, o, a, u) {
  return n -= r, n = As(n, 1 / o, a), u !== void 0 && (n = As(n, 1 / u, a)), n;
}
function sx(n, r = 0, o = 1, a = 0.5, u, d = n, f = n) {
  if (Qt.test(r) && (r = parseFloat(r), r = Ee(f.min, f.max, r / 100) - f.min), typeof r != "number")
    return;
  let h = Ee(d.min, d.max, a);
  n === d && (h -= r), n.min = np(n.min, r, o, h, u), n.max = np(n.max, r, o, h, u);
}
function rp(n, r, [o, a, u], d, f) {
  sx(n, r[o], r[a], r[u], r.scale, d, f);
}
const ax = ["x", "scaleX", "originX"], lx = ["y", "scaleY", "originY"];
function ip(n, r, o, a) {
  rp(n.x, r, ax, o ? o.x : void 0, a ? a.x : void 0), rp(n.y, r, lx, o ? o.y : void 0, a ? a.y : void 0);
}
function op(n) {
  return n.translate === 0 && n.scale === 1;
}
function y0(n) {
  return op(n.x) && op(n.y);
}
function sp(n, r) {
  return n.min === r.min && n.max === r.max;
}
function ux(n, r) {
  return sp(n.x, r.x) && sp(n.y, r.y);
}
function ap(n, r) {
  return Math.round(n.min) === Math.round(r.min) && Math.round(n.max) === Math.round(r.max);
}
function g0(n, r) {
  return ap(n.x, r.x) && ap(n.y, r.y);
}
function lp(n) {
  return st(n.x) / st(n.y);
}
function up(n, r) {
  return n.translate === r.translate && n.scale === r.scale && n.originPoint === r.originPoint;
}
function Gt(n) {
  return [n("x"), n("y")];
}
function cx(n, r, o) {
  let a = "";
  const u = n.x.translate / r.x, d = n.y.translate / r.y, f = o?.z || 0;
  if ((u || d || f) && (a = `translate3d(${u}px, ${d}px, ${f}px) `), (r.x !== 1 || r.y !== 1) && (a += `scale(${1 / r.x}, ${1 / r.y}) `), o) {
    const { transformPerspective: v, rotate: y, pathRotation: x, rotateX: S, rotateY: A, skewX: E, skewY: D } = o;
    v && (a = `perspective(${v}px) ${a}`), y && (a += `rotate(${y}deg) `), x && (a += `rotate(${x}deg) `), S && (a += `rotateX(${S}deg) `), A && (a += `rotateY(${A}deg) `), E && (a += `skewX(${E}deg) `), D && (a += `skewY(${D}deg) `);
  }
  const h = n.x.scale * r.x, g = n.y.scale * r.y;
  return (h !== 1 || g !== 1) && (a += `scale(${h}, ${g})`), a || "none";
}
const fx = Ju.length, cp = (n) => typeof n == "string" ? parseFloat(n) : n, fp = (n) => typeof n == "number" || q.test(n);
function dx(n, r, o, a, u, d) {
  u ? (n.opacity = Ee(0, o.opacity ?? 1, hx(a)), n.opacityExit = Ee(r.opacity ?? 1, 0, px(a))) : d && (n.opacity = Ee(r.opacity ?? 1, o.opacity ?? 1, a));
  for (let f = 0; f < fx; f++) {
    const h = Ju[f];
    let g = dp(r, h), v = dp(o, h);
    if (g === void 0 && v === void 0)
      continue;
    g || (g = 0), v || (v = 0), g === 0 || v === 0 || fp(g) === fp(v) ? (n[h] = Math.max(Ee(cp(g), cp(v), a), 0), (Qt.test(v) || Qt.test(g)) && (n[h] += "%")) : n[h] = v;
  }
  (r.rotate || o.rotate) && (n.rotate = Ee(r.rotate || 0, o.rotate || 0, a));
}
function dp(n, r) {
  return n[r] !== void 0 ? n[r] : n.borderRadius;
}
const hx = /* @__PURE__ */ v0(0, 0.5, cm), px = /* @__PURE__ */ v0(0.5, 0.95, Rt);
function v0(n, r, o) {
  return (a) => a < n ? 0 : a > r ? 1 : o(/* @__PURE__ */ bi(n, r, a));
}
function mx(n, r, o) {
  const a = qe(n) ? n : nr(n);
  return a.start(Qu("", a, r, o)), a.animation;
}
function $i(n, r, o, a = { passive: !0 }) {
  return n.addEventListener(r, o, a), () => n.removeEventListener(r, o, a);
}
const yx = (n, r) => n.depth - r.depth;
class gx {
  constructor() {
    this.children = [], this.isDirty = !1;
  }
  add(r) {
    Iu(this.children, r), this.isDirty = !0;
  }
  remove(r) {
    Cs(this.children, r), this.isDirty = !0;
  }
  forEach(r) {
    this.isDirty && this.children.sort(yx), this.isDirty = !1, this.children.forEach(r);
  }
}
function vx(n, r) {
  const o = ot.now(), a = ({ timestamp: u }) => {
    const d = u - o;
    d >= r && (ln(a), n(d - r));
  };
  return Pe.setup(a, !0), () => ln(a);
}
function Ss(n) {
  return qe(n) ? n.get() : n;
}
class xx {
  constructor() {
    this.members = [];
  }
  add(r) {
    Iu(this.members, r);
    for (let o = this.members.length - 1; o >= 0; o--) {
      const a = this.members[o];
      if (a === r || a === this.lead || a === this.prevLead)
        continue;
      const u = a.instance;
      (!u || u.isConnected === !1) && !a.snapshot && (Cs(this.members, a), a.unmount());
    }
    r.scheduleRender();
  }
  remove(r) {
    if (Cs(this.members, r), r === this.prevLead && (this.prevLead = void 0), r === this.lead) {
      const o = this.members[this.members.length - 1];
      o && this.promote(o);
    }
  }
  relegate(r) {
    for (let o = this.members.indexOf(r) - 1; o >= 0; o--) {
      const a = this.members[o];
      if (a.isPresent !== !1 && a.instance?.isConnected !== !1)
        return this.promote(a), !0;
    }
    return !1;
  }
  promote(r, o) {
    const a = this.lead;
    if (r !== a && (this.prevLead = a, this.lead = r, r.show(), a)) {
      a.updateSnapshot(), r.scheduleRender();
      const { layoutDependency: u } = a.options, { layoutDependency: d } = r.options;
      (u === void 0 || u !== d) && (r.resumeFrom = a, o && (a.preserveOpacity = !0), a.snapshot && (r.snapshot = a.snapshot, r.snapshot.latestValues = a.animationValues || a.latestValues), r.root?.isUpdating && (r.isLayoutDirty = !0)), r.options.crossfade === !1 && a.hide();
    }
  }
  exitAnimationComplete() {
    this.members.forEach((r) => {
      r.options.onExitComplete?.(), r.resumingFrom?.options.onExitComplete?.();
    });
  }
  scheduleRender() {
    this.members.forEach((r) => r.instance && r.scheduleRender(!1));
  }
  removeLeadSnapshot() {
    this.lead?.snapshot && (this.lead.snapshot = void 0);
  }
}
const ks = {
  /**
   * Global flag as to whether the tree has animated since the last time
   * we resized the window
   */
  hasAnimatedSinceResize: !0,
  /**
   * We set this to true once, on the first update. Any nodes added to the tree beyond that
   * update will be given a `data-projection-id` attribute.
   */
  hasEverUpdated: !1
}, Yl = ["", "X", "Y", "Z"], wx = 1e3;
let Sx = 0;
function Xl(n, r, o, a) {
  const { latestValues: u } = r;
  u[n] && (o[n] = u[n], r.setStaticValue(n, 0), a && (a[n] = 0));
}
function x0(n) {
  if (n.hasCheckedOptimisedAppear = !0, n.root === n)
    return;
  const { visualElement: r } = n.options;
  if (!r)
    return;
  const o = Bm(r);
  if (window.MotionHasOptimisedAnimation(o, "transform")) {
    const { layout: u, layoutId: d } = n.options;
    window.MotionCancelOptimisedAnimation(o, "transform", Pe, !(u || d));
  }
  const { parent: a } = n;
  a && !a.hasCheckedOptimisedAppear && x0(a);
}
function w0({ attachResizeListener: n, defaultParent: r, measureScroll: o, checkIsScrollRoot: a, resetTransform: u }) {
  return class {
    constructor(f = {}, h = r?.()) {
      this.id = Sx++, this.animationId = 0, this.animationCommitId = 0, this.children = /* @__PURE__ */ new Set(), this.options = {}, this.isTreeAnimating = !1, this.isAnimationBlocked = !1, this.isLayoutDirty = !1, this.isProjectionDirty = !1, this.isSharedProjectionDirty = !1, this.isTransformDirty = !1, this.updateManuallyBlocked = !1, this.updateBlockedByResize = !1, this.isUpdating = !1, this.isSVG = !1, this.needsReset = !1, this.shouldResetTransform = !1, this.hasCheckedOptimisedAppear = !1, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = /* @__PURE__ */ new Map(), this.hasTreeAnimated = !1, this.layoutVersion = 0, this.updateScheduled = !1, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = !1, this.checkUpdateFailed = () => {
        this.isUpdating && (this.isUpdating = !1, this.clearAllSnapshots());
      }, this.updateProjection = () => {
        this.projectionUpdateScheduled = !1, this.nodes.forEach(Tx), this.nodes.forEach(Ax), this.nodes.forEach(Dx), this.nodes.forEach(Px);
      }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = !1, this.isVisible = !0, this.animationProgress = 0, this.sharedNodes = /* @__PURE__ */ new Map(), this.latestValues = f, this.root = h ? h.root || h : this, this.path = h ? [...h.path, h] : [], this.parent = h, this.depth = h ? h.depth + 1 : 0;
      for (let g = 0; g < this.path.length; g++)
        this.path[g].shouldResetTransform = !0;
      this.root === this && (this.nodes = new gx());
    }
    addEventListener(f, h) {
      return this.eventHandlers.has(f) || this.eventHandlers.set(f, new Fu()), this.eventHandlers.get(f).add(h);
    }
    notifyListeners(f, ...h) {
      const g = this.eventHandlers.get(f);
      g && g.notify(...h);
    }
    hasListeners(f) {
      return this.eventHandlers.has(f);
    }
    /**
     * Lifecycles
     */
    mount(f) {
      if (this.instance)
        return;
      this.isSVG = nc(f) && !k2(f), this.instance = f;
      const { layoutId: h, layout: g, visualElement: v } = this.options;
      if (v && !v.current && v.mount(f), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (g || h) && (this.isLayoutDirty = !0), n) {
        let y, x = 0;
        const S = () => this.root.updateBlockedByResize = !1;
        Pe.read(() => {
          x = window.innerWidth;
        }), n(f, () => {
          const A = window.innerWidth;
          A !== x && (x = A, this.root.updateBlockedByResize = !0, y && y(), y = vx(S, 250), ks.hasAnimatedSinceResize && (ks.hasAnimatedSinceResize = !1, this.nodes.forEach(mp)));
        });
      }
      h && this.root.registerSharedNode(h, this), this.options.animate !== !1 && v && (h || g) && this.addEventListener("didUpdate", ({ delta: y, hasLayoutChanged: x, hasRelativeLayoutChanged: S, layout: A }) => {
        if (this.isTreeAnimationBlocked()) {
          this.target = void 0, this.relativeTarget = void 0;
          return;
        }
        const E = this.options.transition || v.getDefaultTransition() || zx, { onLayoutAnimationStart: D, onLayoutAnimationComplete: L } = v.getProps(), V = !this.targetLayout || !g0(this.targetLayout, A), N = !x && S;
        if (this.options.layoutRoot || this.resumeFrom || N || x && (V || !this.currentAnimation)) {
          this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = void 0);
          const z = {
            ...Xu(E, "layout"),
            onPlay: D,
            onComplete: L
          };
          (v.shouldReduceMotion || this.options.layoutRoot) && (z.delay = 0, z.type = !1), this.startAnimation(z), this.setAnimationOrigin(y, N, z.path);
        } else
          x || mp(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
        this.targetLayout = A;
      });
    }
    unmount() {
      this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
      const f = this.getStack();
      f && f.remove(this), this.parent && this.parent.children.delete(this), this.instance = void 0, this.eventHandlers.clear(), ln(this.updateProjection);
    }
    // only on the root
    blockUpdate() {
      this.updateManuallyBlocked = !0;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = !1;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || !1;
    }
    // Note: currently only running on root node
    startUpdate() {
      this.isUpdateBlocked() || (this.isUpdating = !0, this.nodes && this.nodes.forEach(Lx), this.animationId++);
    }
    getTransformTemplate() {
      const { visualElement: f } = this.options;
      return f && f.getProps().transformTemplate;
    }
    willUpdate(f = !0) {
      if (this.root.hasTreeAnimated = !0, this.root.isUpdateBlocked()) {
        this.options.onExitComplete && this.options.onExitComplete();
        return;
      }
      if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && x0(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty)
        return;
      this.isLayoutDirty = !0;
      for (let y = 0; y < this.path.length; y++) {
        const x = this.path[y];
        x.shouldResetTransform = !0, (typeof x.latestValues.x == "string" || typeof x.latestValues.y == "string") && (x.isLayoutDirty = !0), x.updateScroll("snapshot"), x.options.layoutRoot && x.willUpdate(!1);
      }
      const { layoutId: h, layout: g } = this.options;
      if (h === void 0 && !g)
        return;
      const v = this.getTransformTemplate();
      this.prevTransformTemplateValue = v ? v(this.latestValues, "") : void 0, this.updateSnapshot(), f && this.notifyListeners("willUpdate");
    }
    update() {
      if (this.updateScheduled = !1, this.isUpdateBlocked()) {
        const g = this.updateBlockedByResize;
        this.unblockUpdate(), this.updateBlockedByResize = !1, this.clearAllSnapshots(), g && this.nodes.forEach(jx), this.nodes.forEach(hp);
        return;
      }
      if (this.animationId <= this.animationCommitId) {
        this.nodes.forEach(pp);
        return;
      }
      this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = !1, this.nodes.forEach(Rx), this.nodes.forEach(Mx), this.nodes.forEach(kx), this.nodes.forEach(Cx)) : this.nodes.forEach(pp), this.clearAllSnapshots();
      const h = ot.now();
      Xe.delta = qt(0, 1e3 / 60, h - Xe.timestamp), Xe.timestamp = h, Xe.isProcessing = !0, Ol.update.process(Xe), Ol.preRender.process(Xe), Ol.render.process(Xe), Xe.isProcessing = !1;
    }
    didUpdate() {
      this.updateScheduled || (this.updateScheduled = !0, ec.read(this.scheduleUpdate));
    }
    clearAllSnapshots() {
      this.nodes.forEach(Ex), this.sharedNodes.forEach(Vx);
    }
    scheduleUpdateProjection() {
      this.projectionUpdateScheduled || (this.projectionUpdateScheduled = !0, Pe.preRender(this.updateProjection, !1, !0));
    }
    scheduleCheckAfterUnmount() {
      Pe.postRender(() => {
        this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
      });
    }
    /**
     * Update measurements
     */
    updateSnapshot() {
      this.snapshot || !this.instance || (this.snapshot = this.measure(), this.snapshot && !st(this.snapshot.measuredBox.x) && !st(this.snapshot.measuredBox.y) && (this.snapshot = void 0));
    }
    updateLayout() {
      if (!this.instance || (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty))
        return;
      if (this.resumeFrom && !this.resumeFrom.instance)
        for (let g = 0; g < this.path.length; g++)
          this.path[g].updateScroll();
      const f = this.layout;
      this.layout = this.measure(!1), this.layoutVersion++, this.layoutCorrected || (this.layoutCorrected = We()), this.isLayoutDirty = !1, this.projectionDelta = void 0, this.notifyListeners("measure", this.layout.layoutBox);
      const { visualElement: h } = this.options;
      h && h.notify("LayoutMeasure", this.layout.layoutBox, f ? f.layoutBox : void 0);
    }
    updateScroll(f = "measure") {
      let h = !!(this.options.layoutScroll && this.instance);
      if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === f && (h = !1), h && this.instance) {
        const g = a(this.instance);
        this.scroll = {
          animationId: this.root.animationId,
          phase: f,
          isRoot: g,
          offset: o(this.instance),
          wasRoot: this.scroll ? this.scroll.isRoot : g
        };
      }
    }
    resetTransform() {
      if (!u)
        return;
      const f = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, h = this.projectionDelta && !y0(this.projectionDelta), g = this.getTransformTemplate(), v = g ? g(this.latestValues, "") : void 0, y = v !== this.prevTransformTemplateValue;
      f && this.instance && (h || Qn(this.latestValues) || y) && (u(this.instance, v), this.shouldResetTransform = !1, this.scheduleRender());
    }
    measure(f = !0) {
      const h = this.measurePageBox();
      let g = this.removeElementScroll(h);
      return f && (g = this.removeTransform(g)), Ix(g), {
        animationId: this.root.animationId,
        measuredBox: h,
        layoutBox: g,
        latestValues: {},
        source: this.id
      };
    }
    measurePageBox() {
      const { visualElement: f } = this.options;
      if (!f)
        return We();
      const h = f.measureViewportBox();
      if (!(this.scroll?.wasRoot || this.path.some(Fx))) {
        const { scroll: v } = this.root;
        v && (Yt(h.x, v.offset.x), Yt(h.y, v.offset.y));
      }
      return h;
    }
    removeElementScroll(f) {
      const h = We();
      if (zt(h, f), this.scroll?.wasRoot)
        return h;
      for (let g = 0; g < this.path.length; g++) {
        const v = this.path[g], { scroll: y, options: x } = v;
        v !== this.root && y && x.layoutScroll && (y.wasRoot && zt(h, f), Yt(h.x, y.offset.x), Yt(h.y, y.offset.y));
      }
      return h;
    }
    applyTransform(f, h = !1, g) {
      const v = g || We();
      zt(v, f);
      for (let y = 0; y < this.path.length; y++) {
        const x = this.path[y];
        !h && x.options.layoutScroll && x.scroll && x !== x.root && (Yt(v.x, -x.scroll.offset.x), Yt(v.y, -x.scroll.offset.y)), Qn(x.latestValues) && ws(v, x.latestValues, x.layout?.layoutBox);
      }
      return Qn(this.latestValues) && ws(v, this.latestValues, this.layout?.layoutBox), v;
    }
    removeTransform(f) {
      const h = We();
      zt(h, f);
      for (let g = 0; g < this.path.length; g++) {
        const v = this.path[g];
        if (!Qn(v.latestValues))
          continue;
        let y;
        v.instance && (Tu(v.latestValues) && v.updateSnapshot(), y = We(), zt(y, v.measurePageBox())), ip(h, v.latestValues, v.snapshot?.layoutBox, y);
      }
      return Qn(this.latestValues) && ip(h, this.latestValues), h;
    }
    setTargetDelta(f) {
      this.targetDelta = f, this.root.scheduleUpdateProjection(), this.isProjectionDirty = !0;
    }
    setOptions(f) {
      this.options = {
        ...this.options,
        ...f,
        crossfade: f.crossfade !== void 0 ? f.crossfade : !0
      };
    }
    clearMeasurements() {
      this.scroll = void 0, this.layout = void 0, this.snapshot = void 0, this.prevTransformTemplateValue = void 0, this.targetDelta = void 0, this.target = void 0, this.isLayoutDirty = !1;
    }
    forceRelativeParentToResolveTarget() {
      this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== Xe.timestamp && this.relativeParent.resolveTargetDelta(!0);
    }
    resolveTargetDelta(f = !1) {
      const h = this.getLead();
      this.isProjectionDirty || (this.isProjectionDirty = h.isProjectionDirty), this.isTransformDirty || (this.isTransformDirty = h.isTransformDirty), this.isSharedProjectionDirty || (this.isSharedProjectionDirty = h.isSharedProjectionDirty);
      const g = !!this.resumingFrom || this !== h;
      if (!(f || g && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize))
        return;
      const { layout: y, layoutId: x } = this.options;
      if (!this.layout || !(y || x))
        return;
      this.resolvedRelativeTargetAt = Xe.timestamp;
      const S = this.getClosestProjectingParent();
      S && this.linkedParentVersion !== S.layoutVersion && !S.options.layoutRoot && this.removeRelativeTarget(), !this.targetDelta && !this.relativeTarget && (this.options.layoutAnchor !== !1 && S && S.layout ? this.createRelativeTarget(S, this.layout.layoutBox, S.layout.layoutBox) : this.removeRelativeTarget()), !(!this.relativeTarget && !this.targetDelta) && (this.target || (this.target = We(), this.targetWithTransforms = We()), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), ox(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || void 0)) : this.targetDelta ? (this.resumingFrom ? this.applyTransform(this.layout.layoutBox, !1, this.target) : zt(this.target, this.layout.layoutBox), i0(this.target, this.targetDelta)) : zt(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = !1, this.options.layoutAnchor !== !1 && S && !!S.resumingFrom == !!this.resumingFrom && !S.options.layoutScroll && S.target && this.animationProgress !== 1 ? this.createRelativeTarget(S, this.target, S.target) : this.relativeParent = this.relativeTarget = void 0));
    }
    getClosestProjectingParent() {
      if (!(!this.parent || Tu(this.parent.latestValues) || r0(this.parent.latestValues)))
        return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
    }
    isProjecting() {
      return !!((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
    }
    createRelativeTarget(f, h, g) {
      this.relativeParent = f, this.linkedParentVersion = f.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = We(), this.relativeTargetOrigin = We(), Ds(this.relativeTargetOrigin, h, g, this.options.layoutAnchor || void 0), zt(this.relativeTarget, this.relativeTargetOrigin);
    }
    removeRelativeTarget() {
      this.relativeParent = this.relativeTarget = void 0;
    }
    calcProjection() {
      const f = this.getLead(), h = !!this.resumingFrom || this !== f;
      let g = !0;
      if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (g = !1), h && (this.isSharedProjectionDirty || this.isTransformDirty) && (g = !1), this.resolvedRelativeTargetAt === Xe.timestamp && (g = !1), g)
        return;
      const { layout: v, layoutId: y } = this.options;
      if (this.isTreeAnimating = !!(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0), !this.layout || !(v || y))
        return;
      zt(this.layoutCorrected, this.layout.layoutBox);
      const x = this.treeScale.x, S = this.treeScale.y;
      N2(this.layoutCorrected, this.treeScale, this.path, h), f.layout && !f.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1) && (f.target = f.layout.layoutBox, f.targetWithTransforms = We());
      const { target: A } = f;
      if (!A) {
        this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
        return;
      }
      !this.projectionDelta || !this.prevProjectionDelta ? this.createProjectionDeltas() : (Zh(this.prevProjectionDelta.x, this.projectionDelta.x), Zh(this.prevProjectionDelta.y, this.projectionDelta.y)), zi(this.projectionDelta, this.layoutCorrected, A, this.latestValues), (this.treeScale.x !== x || this.treeScale.y !== S || !up(this.projectionDelta.x, this.prevProjectionDelta.x) || !up(this.projectionDelta.y, this.prevProjectionDelta.y)) && (this.hasProjected = !0, this.scheduleRender(), this.notifyListeners("projectionUpdate", A));
    }
    hide() {
      this.isVisible = !1;
    }
    show() {
      this.isVisible = !0;
    }
    scheduleRender(f = !0) {
      if (this.options.visualElement?.scheduleRender(), f) {
        const h = this.getStack();
        h && h.scheduleRender();
      }
      this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
    }
    createProjectionDeltas() {
      this.prevProjectionDelta = Nr(), this.projectionDelta = Nr(), this.projectionDeltaWithTransform = Nr();
    }
    setAnimationOrigin(f, h = !1, g) {
      const v = this.snapshot, y = v ? v.latestValues : {}, x = { ...this.latestValues }, S = Nr();
      (!this.relativeParent || !this.relativeParent.options.layoutRoot) && (this.relativeTarget = this.relativeTargetOrigin = void 0), this.attemptToResolveRelativeTarget = !h;
      const A = We(), E = v ? v.source : void 0, D = this.layout ? this.layout.source : void 0, L = E !== D, V = this.getStack(), N = !V || V.members.length <= 1, z = !!(L && !N && this.options.crossfade === !0 && !this.path.some(_x));
      this.animationProgress = 0;
      let b;
      const ee = g?.interpolateProjection(f);
      this.mixTargetDelta = (Z) => {
        const te = Z / 1e3, W = ee?.(te);
        W ? (S.x.translate = W.x, S.x.scale = Ee(f.x.scale, 1, te), S.x.origin = f.x.origin, S.x.originPoint = f.x.originPoint, S.y.translate = W.y, S.y.scale = Ee(f.y.scale, 1, te), S.y.origin = f.y.origin, S.y.originPoint = f.y.originPoint) : (yp(S.x, f.x, te), yp(S.y, f.y, te)), this.setTargetDelta(S), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (Ds(A, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || void 0), Nx(this.relativeTarget, this.relativeTargetOrigin, A, te), b && ux(this.relativeTarget, b) && (this.isProjectionDirty = !1), b || (b = We()), zt(b, this.relativeTarget)), L && (this.animationValues = x, dx(x, y, this.latestValues, te, z, N)), W && W.rotate !== void 0 && (this.animationValues || (this.animationValues = x), this.animationValues.pathRotation = W.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = te;
      }, this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
    }
    startAnimation(f) {
      this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation && (ln(this.pendingAnimation), this.pendingAnimation = void 0), this.pendingAnimation = Pe.update(() => {
        ks.hasAnimatedSinceResize = !0, this.motionValue || (this.motionValue = nr(0)), this.motionValue.jump(0, !1), this.currentAnimation = mx(this.motionValue, [0, 1e3], {
          ...f,
          velocity: 0,
          isSync: !0,
          onUpdate: (h) => {
            this.mixTargetDelta(h), f.onUpdate && f.onUpdate(h);
          },
          onComplete: () => {
            f.onComplete && f.onComplete(), this.completeAnimation();
          }
        }), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = void 0;
      });
    }
    completeAnimation() {
      this.resumingFrom && (this.resumingFrom.currentAnimation = void 0, this.resumingFrom.preserveOpacity = void 0);
      const f = this.getStack();
      f && f.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = void 0, this.notifyListeners("animationComplete");
    }
    finishAnimation() {
      this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(wx), this.currentAnimation.stop()), this.completeAnimation();
    }
    applyTransformsToTarget() {
      const f = this.getLead();
      let { targetWithTransforms: h, target: g, layout: v, latestValues: y } = f;
      if (!(!h || !g || !v)) {
        if (this !== f && this.layout && v && S0(this.options.animationType, this.layout.layoutBox, v.layoutBox)) {
          g = this.target || We();
          const x = st(this.layout.layoutBox.x);
          g.x.min = f.target.x.min, g.x.max = g.x.min + x;
          const S = st(this.layout.layoutBox.y);
          g.y.min = f.target.y.min, g.y.max = g.y.min + S;
        }
        zt(h, g), ws(h, y), zi(this.projectionDeltaWithTransform, this.layoutCorrected, h, y);
      }
    }
    registerSharedNode(f, h) {
      this.sharedNodes.has(f) || this.sharedNodes.set(f, new xx()), this.sharedNodes.get(f).add(h);
      const v = h.options.initialPromotionConfig;
      h.promote({
        transition: v ? v.transition : void 0,
        preserveFollowOpacity: v && v.shouldPreserveFollowOpacity ? v.shouldPreserveFollowOpacity(h) : void 0
      });
    }
    isLead() {
      const f = this.getStack();
      return f ? f.lead === this : !0;
    }
    getLead() {
      const { layoutId: f } = this.options;
      return f ? this.getStack()?.lead || this : this;
    }
    getPrevLead() {
      const { layoutId: f } = this.options;
      return f ? this.getStack()?.prevLead : void 0;
    }
    getStack() {
      const { layoutId: f } = this.options;
      if (f)
        return this.root.sharedNodes.get(f);
    }
    promote({ needsReset: f, transition: h, preserveFollowOpacity: g } = {}) {
      const v = this.getStack();
      v && v.promote(this, g), f && (this.projectionDelta = void 0, this.needsReset = !0), h && this.setOptions({ transition: h });
    }
    relegate() {
      const f = this.getStack();
      return f ? f.relegate(this) : !1;
    }
    resetSkewAndRotation() {
      const { visualElement: f } = this.options;
      if (!f)
        return;
      let h = !1;
      const { latestValues: g } = f;
      if ((g.z || g.rotate || g.rotateX || g.rotateY || g.rotateZ || g.skewX || g.skewY) && (h = !0), !h)
        return;
      const v = {};
      g.z && Xl("z", f, v, this.animationValues);
      for (let y = 0; y < Yl.length; y++)
        Xl(`rotate${Yl[y]}`, f, v, this.animationValues), Xl(`skew${Yl[y]}`, f, v, this.animationValues);
      f.render();
      for (const y in v)
        f.setStaticValue(y, v[y]), this.animationValues && (this.animationValues[y] = v[y]);
      f.scheduleRender();
    }
    applyProjectionStyles(f, h) {
      if (!this.instance || this.isSVG)
        return;
      if (!this.isVisible) {
        f.visibility = "hidden";
        return;
      }
      const g = this.getTransformTemplate();
      if (this.needsReset) {
        this.needsReset = !1, f.visibility = "", f.opacity = "", f.pointerEvents = Ss(h?.pointerEvents) || "", f.transform = g ? g(this.latestValues, "") : "none";
        return;
      }
      const v = this.getLead();
      if (!this.projectionDelta || !this.layout || !v.target) {
        this.options.layoutId && (f.opacity = this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1, f.pointerEvents = Ss(h?.pointerEvents) || ""), this.hasProjected && !Qn(this.latestValues) && (f.transform = g ? g({}, "") : "none", this.hasProjected = !1);
        return;
      }
      f.visibility = "";
      const y = v.animationValues || v.latestValues;
      this.applyTransformsToTarget();
      let x = cx(this.projectionDeltaWithTransform, this.treeScale, y);
      g && (x = g(y, x)), f.transform = x;
      const { x: S, y: A } = this.projectionDelta;
      f.transformOrigin = `${S.origin * 100}% ${A.origin * 100}% 0`, v.animationValues ? f.opacity = v === this ? y.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : y.opacityExit : f.opacity = v === this ? y.opacity !== void 0 ? y.opacity : "" : y.opacityExit !== void 0 ? y.opacityExit : 0;
      for (const E in Eu) {
        if (y[E] === void 0)
          continue;
        const { correct: D, applyTo: L, isCSSVariable: V } = Eu[E], N = x === "none" ? y[E] : D(y[E], v);
        if (L) {
          const z = L.length;
          for (let b = 0; b < z; b++)
            f[L[b]] = N;
        } else
          V ? this.options.visualElement.renderState.vars[E] = N : f[E] = N;
      }
      this.options.layoutId && (f.pointerEvents = v === this ? Ss(h?.pointerEvents) || "" : "none");
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = void 0;
    }
    // Only run on root
    resetTree() {
      this.root.nodes.forEach((f) => f.currentAnimation?.stop()), this.root.nodes.forEach(hp), this.root.sharedNodes.clear();
    }
  };
}
function kx(n) {
  n.updateLayout();
}
function Cx(n) {
  const r = n.resumeFrom?.snapshot || n.snapshot;
  if (n.isLead() && n.layout && r && n.hasListeners("didUpdate")) {
    const { layoutBox: o, measuredBox: a } = n.layout, { animationType: u } = n.options, d = r.source !== n.layout.source;
    if (u === "size")
      Gt((y) => {
        const x = d ? r.measuredBox[y] : r.layoutBox[y], S = st(x);
        x.min = o[y].min, x.max = x.min + S;
      });
    else if (u === "x" || u === "y") {
      const y = u === "x" ? "y" : "x";
      ju(d ? r.measuredBox[y] : r.layoutBox[y], o[y]);
    } else S0(u, r.layoutBox, o) && Gt((y) => {
      const x = d ? r.measuredBox[y] : r.layoutBox[y], S = st(o[y]);
      x.max = x.min + S, n.relativeTarget && !n.currentAnimation && (n.isProjectionDirty = !0, n.relativeTarget[y].max = n.relativeTarget[y].min + S);
    });
    const f = Nr();
    zi(f, o, r.layoutBox);
    const h = Nr();
    d ? zi(h, n.applyTransform(a, !0), r.measuredBox) : zi(h, o, r.layoutBox);
    const g = !y0(f);
    let v = !1;
    if (!n.resumeFrom) {
      const y = n.getClosestProjectingParent();
      if (y && !y.resumeFrom) {
        const { snapshot: x, layout: S } = y;
        if (x && S) {
          const A = n.options.layoutAnchor || void 0, E = We();
          Ds(E, r.layoutBox, x.layoutBox, A);
          const D = We();
          Ds(D, o, S.layoutBox, A), g0(E, D) || (v = !0), y.options.layoutRoot && (n.relativeTarget = D, n.relativeTargetOrigin = E, n.relativeParent = y);
        }
      }
    }
    n.notifyListeners("didUpdate", {
      layout: o,
      snapshot: r,
      delta: h,
      layoutDelta: f,
      hasLayoutChanged: g,
      hasRelativeLayoutChanged: v
    });
  } else if (n.isLead()) {
    const { onExitComplete: o } = n.options;
    o && o();
  }
  n.options.transition = void 0;
}
function Tx(n) {
  n.parent && (n.isProjecting() || (n.isProjectionDirty = n.parent.isProjectionDirty), n.isSharedProjectionDirty || (n.isSharedProjectionDirty = !!(n.isProjectionDirty || n.parent.isProjectionDirty || n.parent.isSharedProjectionDirty)), n.isTransformDirty || (n.isTransformDirty = n.parent.isTransformDirty));
}
function Px(n) {
  n.isProjectionDirty = n.isSharedProjectionDirty = n.isTransformDirty = !1;
}
function Ex(n) {
  n.clearSnapshot();
}
function hp(n) {
  n.clearMeasurements();
}
function jx(n) {
  n.isLayoutDirty = !0, n.updateLayout();
}
function pp(n) {
  n.isLayoutDirty = !1;
}
function Rx(n) {
  n.isAnimationBlocked && n.layout && !n.isLayoutDirty && (n.snapshot = n.layout, n.isLayoutDirty = !0);
}
function Mx(n) {
  const { visualElement: r } = n.options;
  r && r.getProps().onBeforeLayoutMeasure && r.notify("BeforeLayoutMeasure"), n.resetTransform();
}
function mp(n) {
  n.finishAnimation(), n.targetDelta = n.relativeTarget = n.target = void 0, n.isProjectionDirty = !0;
}
function Ax(n) {
  n.resolveTargetDelta();
}
function Dx(n) {
  n.calcProjection();
}
function Lx(n) {
  n.resetSkewAndRotation();
}
function Vx(n) {
  n.removeLeadSnapshot();
}
function yp(n, r, o) {
  n.translate = Ee(r.translate, 0, o), n.scale = Ee(r.scale, 1, o), n.origin = r.origin, n.originPoint = r.originPoint;
}
function gp(n, r, o, a) {
  n.min = Ee(r.min, o.min, a), n.max = Ee(r.max, o.max, a);
}
function Nx(n, r, o, a) {
  gp(n.x, r.x, o.x, a), gp(n.y, r.y, o.y, a);
}
function _x(n) {
  return n.animationValues && n.animationValues.opacityExit !== void 0;
}
const zx = {
  duration: 0.45,
  ease: [0.4, 0, 0.1, 1]
}, vp = (n) => typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(n), xp = vp("applewebkit/") && !vp("chrome/") ? Math.round : Rt;
function wp(n) {
  n.min = xp(n.min), n.max = xp(n.max);
}
function Ix(n) {
  wp(n.x), wp(n.y);
}
function S0(n, r, o) {
  return n === "position" || n === "preserve-aspect" && !ix(lp(r), lp(o), 0.2);
}
function Fx(n) {
  return n !== n.root && n.scroll?.wasRoot;
}
const bx = w0({
  attachResizeListener: (n, r) => $i(n, "resize", r),
  measureScroll: () => ({
    x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
    y: document.documentElement.scrollTop || document.body?.scrollTop || 0
  }),
  checkIsScrollRoot: () => !0
}), Ql = {
  current: void 0
}, k0 = w0({
  measureScroll: (n) => ({
    x: n.scrollLeft,
    y: n.scrollTop
  }),
  defaultParent: () => {
    if (!Ql.current) {
      const n = new bx({});
      n.mount(window), n.setOptions({ layoutScroll: !0 }), Ql.current = n;
    }
    return Ql.current;
  },
  resetTransform: (n, r) => {
    n.style.transform = r !== void 0 ? r : "none";
  },
  checkIsScrollRoot: (n) => window.getComputedStyle(n).position === "fixed"
}), Ir = M.createContext({
  transformPagePoint: (n) => n,
  isStatic: !1,
  reducedMotion: "never"
});
function Sp(n, r) {
  if (typeof n == "function")
    return n(r);
  n != null && (n.current = r);
}
function Ox(...n) {
  return (r) => {
    let o = !1;
    const a = n.map((u) => {
      const d = Sp(u, r);
      return !o && typeof d == "function" && (o = !0), d;
    });
    if (o)
      return () => {
        for (let u = 0; u < a.length; u++) {
          const d = a[u];
          typeof d == "function" ? d() : Sp(n[u], null);
        }
      };
  };
}
function Bx(...n) {
  return M.useCallback(Ox(...n), n);
}
class $x extends M.Component {
  getSnapshotBeforeUpdate(r) {
    const o = this.props.childRef.current;
    if (ms(o) && r.isPresent && !this.props.isPresent && this.props.pop !== !1) {
      const a = o.offsetParent, u = ms(a) && a.offsetWidth || 0, d = ms(a) && a.offsetHeight || 0, f = getComputedStyle(o), h = this.props.sizeRef.current;
      h.height = parseFloat(f.height), h.width = parseFloat(f.width), h.top = o.offsetTop, h.left = o.offsetLeft, h.right = u - h.width - h.left, h.bottom = d - h.height - h.top, h.direction = f.direction;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function Wx({ children: n, isPresent: r, anchorX: o, anchorY: a, root: u, pop: d }) {
  const f = M.useId(), h = M.useRef(null), g = M.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    direction: "ltr"
  }), { nonce: v } = M.useContext(Ir), y = n.props?.ref ?? n?.ref, x = Bx(h, y);
  return M.useInsertionEffect(() => {
    const { width: S, height: A, top: E, left: D, right: L, bottom: V, direction: N } = g.current;
    if (r || d === !1 || !h.current || !S || !A)
      return;
    const z = N === "rtl", b = o === "left" ? z ? `right: ${L}` : `left: ${D}` : z ? `left: ${D}` : `right: ${L}`, ee = a === "bottom" ? `bottom: ${V}` : `top: ${E}`;
    h.current.dataset.motionPopId = f;
    const Z = document.createElement("style");
    v && (Z.nonce = v);
    const te = u ?? document.head;
    return te.appendChild(Z), Z.sheet && Z.sheet.insertRule(`
          [data-motion-pop-id="${f}"] {
            position: absolute !important;
            width: ${S}px !important;
            height: ${A}px !important;
            ${b}px !important;
            ${ee}px !important;
          }
        `), () => {
      h.current?.removeAttribute("data-motion-pop-id"), te.contains(Z) && te.removeChild(Z);
    };
  }, [r]), m.jsx($x, { isPresent: r, childRef: h, sizeRef: g, pop: d, children: d === !1 ? n : M.cloneElement(n, { ref: x }) });
}
const Ux = ({ children: n, initial: r, isPresent: o, onExitComplete: a, custom: u, presenceAffectsLayout: d, mode: f, anchorX: h, anchorY: g, root: v }) => {
  const y = Dn(Hx), x = M.useId(), S = M.useRef(o), A = M.useRef(a);
  zs(() => {
    S.current = o, A.current = a;
  });
  let E = !0, D = M.useMemo(() => (E = !1, {
    id: x,
    initial: r,
    isPresent: o,
    custom: u,
    onExitComplete: (L) => {
      y.set(L, !0);
      for (const V of y.values())
        if (!V)
          return;
      a && a();
    },
    register: (L) => (y.set(L, !1), () => {
      y.delete(L), !S.current && !y.size && A.current?.();
    })
  }), [o, y, a]);
  return d && E && (D = { ...D }), M.useMemo(() => {
    y.forEach((L, V) => y.set(V, !1));
  }, [o]), M.useEffect(() => {
    !o && !y.size && a && a();
  }, [o]), n = m.jsx(Wx, { pop: f === "popLayout", isPresent: o, anchorX: h, anchorY: g, root: v, children: n }), m.jsx(Is.Provider, { value: D, children: n });
};
function Hx() {
  return /* @__PURE__ */ new Map();
}
function C0(n = !0) {
  const r = M.useContext(Is);
  if (r === null)
    return [!0, null];
  const { isPresent: o, onExitComplete: a, register: u } = r, d = M.useId();
  M.useEffect(() => {
    if (n)
      return u(d);
  }, [n]);
  const f = M.useCallback(() => n && a && a(d), [d, a, n]);
  return !o && a ? [!1, f] : [!0];
}
const as = (n) => n.key || "";
function kp(n) {
  const r = [];
  return M.Children.forEach(n, (o) => {
    M.isValidElement(o) && r.push(o);
  }), r;
}
const Et = ({ children: n, custom: r, initial: o = !0, onExitComplete: a, presenceAffectsLayout: u = !0, mode: d = "sync", propagate: f = !1, anchorX: h = "left", anchorY: g = "top", root: v }) => {
  const [y, x] = C0(f), S = M.useMemo(() => kp(n), [n]), A = f && !y ? [] : S.map(as), E = M.useRef(!0), D = M.useRef(S), L = Dn(() => /* @__PURE__ */ new Map()), V = M.useRef(/* @__PURE__ */ new Set()), [N, z] = M.useState(S), [b, ee] = M.useState(S);
  zs(() => {
    E.current = !1, D.current = S;
    for (let W = 0; W < b.length; W++) {
      const ae = as(b[W]);
      A.includes(ae) ? (L.delete(ae), V.current.delete(ae)) : L.get(ae) !== !0 && L.set(ae, !1);
    }
  }, [b, A.length, A.join("-")]);
  const Z = [];
  if (S !== N) {
    let W = [...S];
    for (let ae = 0; ae < b.length; ae++) {
      const K = b[ae], ye = as(K);
      A.includes(ye) || (W.splice(ae, 0, K), Z.push(K));
    }
    return d === "wait" && Z.length && (W = Z), ee(kp(W)), z(S), null;
  }
  const { forceRender: te } = M.useContext(zu);
  return m.jsx(m.Fragment, { children: b.map((W) => {
    const ae = as(W), K = f && !y ? !1 : S === b || A.includes(ae), ye = () => {
      if (V.current.has(ae))
        return;
      if (L.has(ae))
        V.current.add(ae), L.set(ae, !0);
      else
        return;
      let ge = !0;
      L.forEach((ie) => {
        ie || (ge = !1);
      }), ge && (te?.(), ee(D.current), f && x?.(), a && a());
    };
    return m.jsx(Ux, { isPresent: K, initial: !E.current || o ? void 0 : !1, custom: r, presenceAffectsLayout: u, mode: d, root: v, onExitComplete: K ? void 0 : ye, anchorX: h, anchorY: g, children: W }, ae);
  }) });
}, T0 = M.createContext({ strict: !1 }), Cp = {
  animation: [
    "animate",
    "variants",
    "whileHover",
    "whileTap",
    "exit",
    "whileInView",
    "whileFocus",
    "whileDrag"
  ],
  exit: ["exit"],
  drag: ["drag", "dragControls"],
  focus: ["whileFocus"],
  hover: ["whileHover", "onHoverStart", "onHoverEnd"],
  tap: ["whileTap", "onTap", "onTapStart", "onTapCancel"],
  pan: ["onPan", "onPanStart", "onPanSessionStart", "onPanEnd"],
  inView: ["whileInView", "onViewportEnter", "onViewportLeave"],
  layout: ["layout", "layoutId"]
};
let Tp = !1;
function Kx() {
  if (Tp)
    return;
  const n = {};
  for (const r in Cp)
    n[r] = {
      isEnabled: (o) => Cp[r].some((a) => !!o[a])
    };
  e0(n), Tp = !0;
}
function P0() {
  return Kx(), A2();
}
function Gx(n) {
  const r = P0();
  for (const o in n)
    r[o] = {
      ...r[o],
      ...n[o]
    };
  e0(r);
}
const Yx = /* @__PURE__ */ new Set([
  "animate",
  "exit",
  "variants",
  "initial",
  "style",
  "values",
  "variants",
  "transition",
  "transformTemplate",
  "custom",
  "inherit",
  "onBeforeLayoutMeasure",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDragStart",
  "onDrag",
  "onDragEnd",
  "onMeasureDragConstraints",
  "onDirectionLock",
  "onDragTransitionEnd",
  "_dragX",
  "_dragY",
  "onHoverStart",
  "onHoverEnd",
  "onViewportEnter",
  "onViewportLeave",
  "globalTapTarget",
  "propagate",
  "ignoreStrict",
  "viewport"
]);
function Ls(n) {
  return n.startsWith("while") || n.startsWith("drag") && n !== "draggable" || n.startsWith("layout") || n.startsWith("onTap") || n.startsWith("onPan") || n.startsWith("onLayout") || Yx.has(n);
}
let E0 = (n) => !Ls(n);
function j0(n) {
  typeof n == "function" && (E0 = (r) => r.startsWith("on") ? !Ls(r) : n(r));
}
try {
  j0(require("@emotion/is-prop-valid").default);
} catch {
}
function Xx(n, r, o) {
  const a = {};
  for (const u in n)
    u === "values" && typeof n.values == "object" || qe(n[u]) || (E0(u) || o === !0 && Ls(u) || !r && !Ls(u) || // If trying to use native HTML drag events, forward drag listeners
    n.draggable && u.startsWith("onDrag")) && (a[u] = n[u]);
  return a;
}
function Qx({ children: n, isValidProp: r, ...o }) {
  r && j0(r);
  const a = M.useContext(Ir);
  o = { ...a, ...o }, o.transition = Yu(o.transition, a.transition), o.isStatic = Dn(() => o.isStatic);
  const u = M.useMemo(() => o, [
    JSON.stringify(o.transition),
    o.transformPagePoint,
    o.reducedMotion,
    o.skipAnimations
  ]);
  return m.jsx(Ir.Provider, { value: u, children: n });
}
const Bs = /* @__PURE__ */ M.createContext({});
function qx(n, r) {
  if (Os(n)) {
    const { initial: o, animate: a } = n;
    return {
      initial: o === !1 || Bi(o) ? o : void 0,
      animate: Bi(a) ? a : void 0
    };
  }
  return n.inherit !== !1 ? r : {};
}
function Zx(n) {
  const { initial: r, animate: o } = qx(n, M.useContext(Bs));
  return M.useMemo(() => ({ initial: r, animate: o }), [Pp(r), Pp(o)]);
}
function Pp(n) {
  return Array.isArray(n) ? n.join(" ") : n;
}
const ac = () => ({
  style: {},
  transform: {},
  transformOrigin: {},
  vars: {}
});
function R0(n, r, o) {
  for (const a in r)
    !qe(r[a]) && !a0(a, o) && (n[a] = r[a]);
}
function Jx({ transformTemplate: n }, r) {
  return M.useMemo(() => {
    const o = ac();
    return oc(o, r, n), Object.assign({}, o.vars, o.style);
  }, [r]);
}
function ew(n, r) {
  const o = n.style || {}, a = {};
  return R0(a, o, n), Object.assign(a, Jx(n, r)), a;
}
function tw(n, r) {
  const o = {}, a = ew(n, r);
  return n.drag && n.dragListener !== !1 && (o.draggable = !1, a.userSelect = a.WebkitUserSelect = a.WebkitTouchCallout = "none", a.touchAction = n.drag === !0 ? "none" : `pan-${n.drag === "x" ? "y" : "x"}`), n.tabIndex === void 0 && (n.onTap || n.onTapStart || n.whileTap) && (o.tabIndex = 0), o.style = a, o;
}
const M0 = () => ({
  ...ac(),
  attrs: {}
});
function nw(n, r, o, a) {
  const u = M.useMemo(() => {
    const d = M0();
    return l0(d, r, c0(a), n.transformTemplate, n.style), {
      ...d.attrs,
      style: { ...d.style }
    };
  }, [r]);
  if (n.style) {
    const d = {};
    R0(d, n.style, n), u.style = { ...d, ...u.style };
  }
  return u;
}
const rw = [
  "animate",
  "circle",
  "defs",
  "desc",
  "ellipse",
  "g",
  "image",
  "line",
  "filter",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "rect",
  "stop",
  "switch",
  "symbol",
  "svg",
  "text",
  "tspan",
  "use",
  "view"
];
function lc(n) {
  return (
    /**
     * If it's not a string, it's a custom React component. Currently we only support
     * HTML custom React components.
     */
    typeof n != "string" || /**
     * If it contains a dash, the element is a custom HTML webcomponent.
     */
    n.includes("-") ? !1 : (
      /**
       * If it's in our list of lowercase SVG tags, it's an SVG component
       */
      !!(rw.indexOf(n) > -1 || /**
       * If it contains a capital letter, it's an SVG component
       */
      /[A-Z]/u.test(n))
    )
  );
}
function iw(n, r, o, { latestValues: a }, u, d = !1, f) {
  const g = (f ?? lc(n) ? nw : tw)(r, a, u, n), v = Xx(r, typeof n == "string", d), y = n !== M.Fragment ? { ...v, ...g, ref: o } : {}, { children: x } = r, S = M.useMemo(() => qe(x) ? x.get() : x, [x]);
  return M.createElement(n, {
    ...y,
    children: S
  });
}
function ow({ scrapeMotionValuesFromProps: n, createRenderState: r }, o, a, u) {
  return {
    latestValues: sw(o, a, u, n),
    renderState: r()
  };
}
function sw(n, r, o, a) {
  const u = {}, d = a(n, {});
  for (const S in d)
    u[S] = Ss(d[S]);
  let { initial: f, animate: h } = n;
  const g = Os(n), v = Zm(n);
  r && v && !g && n.inherit !== !1 && (f === void 0 && (f = r.initial), h === void 0 && (h = r.animate));
  let y = o ? o.initial === !1 : !1;
  y = y || f === !1;
  const x = y ? h : f;
  if (x && typeof x != "boolean" && !bs(x)) {
    const S = Array.isArray(x) ? x : [x];
    for (let A = 0; A < S.length; A++) {
      const E = qu(n, S[A]);
      if (E) {
        const { transitionEnd: D, transition: L, ...V } = E;
        for (const N in V) {
          let z = V[N];
          if (Array.isArray(z)) {
            const b = y ? z.length - 1 : 0;
            z = z[b];
          }
          z !== null && (u[N] = z);
        }
        for (const N in D)
          u[N] = D[N];
      }
    }
  }
  return u;
}
const A0 = (n) => (r, o) => {
  const a = M.useContext(Bs), u = M.useContext(Is), d = () => ow(n, r, a, u);
  return o ? d() : Dn(d);
}, aw = /* @__PURE__ */ A0({
  scrapeMotionValuesFromProps: sc,
  createRenderState: ac
}), lw = /* @__PURE__ */ A0({
  scrapeMotionValuesFromProps: f0,
  createRenderState: M0
}), uw = Symbol.for("motionComponentSymbol");
function cw(n, r, o) {
  const a = M.useRef(o);
  M.useInsertionEffect(() => {
    a.current = o;
  });
  const u = M.useRef(null);
  return M.useCallback((d) => {
    d && n.onMount?.(d), r && (d ? r.mount(d) : r.unmount());
    const f = a.current;
    if (typeof f == "function")
      if (d) {
        const h = f(d);
        typeof h == "function" && (u.current = h);
      } else u.current ? (u.current(), u.current = null) : f(d);
    else f && (f.current = d);
  }, [r]);
}
const D0 = M.createContext({});
function Dr(n) {
  return n && typeof n == "object" && Object.prototype.hasOwnProperty.call(n, "current");
}
function fw(n, r, o, a, u, d) {
  const { visualElement: f } = M.useContext(Bs), h = M.useContext(T0), g = M.useContext(Is), v = M.useContext(Ir), y = v.reducedMotion, x = v.skipAnimations, S = M.useRef(null), A = M.useRef(!1);
  a = a || h.renderer, !S.current && a && (S.current = a(n, {
    visualState: r,
    parent: f,
    props: o,
    presenceContext: g,
    blockInitialAnimation: g ? g.initial === !1 : !1,
    reducedMotionConfig: y,
    skipAnimations: x,
    isSVG: d
  }), A.current && S.current && (S.current.manuallyAnimateOnMount = !0));
  const E = S.current, D = M.useContext(D0);
  E && !E.projection && u && (E.type === "html" || E.type === "svg") && dw(S.current, o, u, D);
  const L = M.useRef(!1);
  M.useInsertionEffect(() => {
    E && L.current && E.update(o, g);
  });
  const V = o[Om], N = M.useRef(!!V && typeof window < "u" && !window.MotionHandoffIsComplete?.(V) && window.MotionHasOptimisedAnimation?.(V));
  return zs(() => {
    A.current = !0, E && (L.current = !0, window.MotionIsMounted = !0, E.updateFeatures(), E.scheduleRenderMicrotask(), N.current && E.animationState && E.animationState.animateChanges());
  }), M.useEffect(() => {
    E && (!N.current && E.animationState && E.animationState.animateChanges(), N.current && (queueMicrotask(() => {
      window.MotionHandoffMarkAsComplete?.(V);
    }), N.current = !1), E.enteringChildren = void 0);
  }), E;
}
function dw(n, r, o, a) {
  const { layoutId: u, layout: d, drag: f, dragConstraints: h, layoutScroll: g, layoutRoot: v, layoutAnchor: y, layoutCrossfade: x } = r;
  n.projection = new o(n.latestValues, r["data-framer-portal-id"] ? void 0 : L0(n.parent)), n.projection.setOptions({
    layoutId: u,
    layout: d,
    alwaysMeasureLayout: !!f || h && Dr(h),
    visualElement: n,
    /**
     * TODO: Update options in an effect. This could be tricky as it'll be too late
     * to update by the time layout animations run.
     * We also need to fix this safeToRemove by linking it up to the one returned by usePresence,
     * ensuring it gets called if there's no potential layout animations.
     *
     */
    animationType: typeof d == "string" ? d : "both",
    initialPromotionConfig: a,
    crossfade: x,
    layoutScroll: g,
    layoutRoot: v,
    layoutAnchor: y
  });
}
function L0(n) {
  if (n)
    return n.options.allowProjection !== !1 ? n.projection : L0(n.parent);
}
function ql(n, { forwardMotionProps: r = !1, type: o } = {}, a, u) {
  a && Gx(a);
  const d = o ? o === "svg" : lc(n), f = d ? lw : aw;
  function h(v, y) {
    let x;
    const S = {
      ...M.useContext(Ir),
      ...v,
      layoutId: hw(v)
    }, { isStatic: A } = S, E = Zx(v), D = f(v, A);
    if (!A && typeof window < "u") {
      pw();
      const L = mw(S);
      x = L.MeasureLayout, E.visualElement = fw(n, D, S, u, L.ProjectionNode, d);
    }
    return m.jsxs(Bs.Provider, { value: E, children: [x && E.visualElement ? m.jsx(x, { visualElement: E.visualElement, ...S }) : null, iw(n, v, cw(D, E.visualElement, y), D, A, r, d)] });
  }
  h.displayName = `motion.${typeof n == "string" ? n : `create(${n.displayName ?? n.name ?? ""})`}`;
  const g = M.forwardRef(h);
  return g[uw] = n, g;
}
function hw({ layoutId: n }) {
  const r = M.useContext(zu).id;
  return r && n !== void 0 ? r + "-" + n : n;
}
function pw(n, r) {
  M.useContext(T0).strict;
}
function mw(n) {
  const r = P0(), { drag: o, layout: a } = r;
  if (!o && !a)
    return {};
  const u = { ...o, ...a };
  return {
    MeasureLayout: o?.isEnabled(n) || a?.isEnabled(n) ? u.MeasureLayout : void 0,
    ProjectionNode: u.ProjectionNode
  };
}
function yw(n, r) {
  if (typeof Proxy > "u")
    return ql;
  const o = /* @__PURE__ */ new Map(), a = (d, f) => ql(d, f, n, r), u = (d, f) => a(d, f);
  return new Proxy(u, {
    /**
     * Called when `motion` is referenced with a prop: `motion.div`, `motion.input` etc.
     * The prop name is passed through as `key` and we can use that to generate a `motion`
     * DOM component with that name.
     */
    get: (d, f) => f === "create" ? a : (o.has(f) || o.set(f, ql(f, void 0, n, r)), o.get(f))
  });
}
const gw = (n, r) => r.isSVG ?? lc(n) ? new G2(r) : new B2(r, {
  allowProjection: n !== M.Fragment
});
class vw extends Vn {
  /**
   * We dynamically generate the AnimationState manager as it contains a reference
   * to the underlying animation library. We only want to load that if we load this,
   * so people can optionally code split it out using the `m` component.
   */
  constructor(r) {
    super(r), r.animationState || (r.animationState = Z2(r));
  }
  updateAnimationControlsSubscription() {
    const { animate: r } = this.node.getProps();
    bs(r) && (this.unmountControls = r.subscribe(this.node));
  }
  /**
   * Subscribe any provided AnimationControls to the component's VisualElement
   */
  mount() {
    this.updateAnimationControlsSubscription();
  }
  update() {
    const { animate: r } = this.node.getProps(), { animate: o } = this.node.prevProps || {};
    r !== o && this.updateAnimationControlsSubscription();
  }
  unmount() {
    this.node.animationState.reset(), this.unmountControls?.();
  }
}
let xw = 0;
class ww extends Vn {
  constructor() {
    super(...arguments), this.id = xw++, this.isExitComplete = !1;
  }
  update() {
    if (!this.node.presenceContext)
      return;
    const { isPresent: r, onExitComplete: o } = this.node.presenceContext, { isPresent: a } = this.node.prevPresenceContext || {};
    if (!this.node.animationState || r === a)
      return;
    if (r && a === !1) {
      if (this.isExitComplete) {
        const { initial: d, custom: f } = this.node.getProps();
        if (typeof d == "string" || typeof d == "object" && d !== null && !Array.isArray(d)) {
          const h = er(this.node, d, f);
          if (h) {
            const { transition: g, transitionEnd: v, ...y } = h;
            for (const x in y)
              this.node.getValue(x)?.jump(y[x]);
          }
        }
        this.node.animationState.reset(), this.node.animationState.animateChanges();
      } else
        this.node.animationState.setActive("exit", !1);
      this.isExitComplete = !1;
      return;
    }
    const u = this.node.animationState.setActive("exit", !r);
    o && !r && u.then(() => {
      this.isExitComplete = !0, o(this.id);
    });
  }
  mount() {
    const { register: r, onExitComplete: o } = this.node.presenceContext || {};
    o && o(this.id), r && (this.unmount = r(this.id));
  }
  unmount() {
  }
}
const Sw = {
  animation: {
    Feature: vw
  },
  exit: {
    Feature: ww
  }
};
function Gi(n) {
  return {
    point: {
      x: n.pageX,
      y: n.pageY
    }
  };
}
const kw = (n) => (r) => tc(r) && n(r, Gi(r));
function Ii(n, r, o, a) {
  return $i(n, r, kw(o), a);
}
const V0 = ({ current: n }) => n ? n.ownerDocument.defaultView : null, Ep = (n, r) => Math.abs(n - r);
function Cw(n, r) {
  const o = Ep(n.x, r.x), a = Ep(n.y, r.y);
  return Math.sqrt(o ** 2 + a ** 2);
}
const jp = /* @__PURE__ */ new Set(["auto", "scroll"]);
class N0 {
  constructor(r, o, { transformPagePoint: a, contextWindow: u = window, dragSnapToOrigin: d = !1, distanceThreshold: f = 3, element: h } = {}) {
    if (this.startEvent = null, this.lastMoveEvent = null, this.lastMoveEventInfo = null, this.lastRawMoveEventInfo = null, this.handlers = {}, this.contextWindow = window, this.scrollPositions = /* @__PURE__ */ new Map(), this.removeScrollListeners = null, this.onElementScroll = (E) => {
      this.handleScroll(E.target);
    }, this.onWindowScroll = () => {
      this.handleScroll(window);
    }, this.updatePoint = () => {
      if (!(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      this.lastRawMoveEventInfo && (this.lastMoveEventInfo = ls(this.lastRawMoveEventInfo, this.transformPagePoint));
      const E = Zl(this.lastMoveEventInfo, this.history), D = this.startEvent !== null, L = Cw(E.offset, { x: 0, y: 0 }) >= this.distanceThreshold;
      if (!D && !L)
        return;
      const { point: V } = E, { timestamp: N } = Xe;
      this.history.push({ ...V, timestamp: N });
      const { onStart: z, onMove: b } = this.handlers;
      D || (z && z(this.lastMoveEvent, E), this.startEvent = this.lastMoveEvent), b && b(this.lastMoveEvent, E);
    }, this.handlePointerMove = (E, D) => {
      this.lastMoveEvent = E, this.lastRawMoveEventInfo = D, this.lastMoveEventInfo = ls(D, this.transformPagePoint), Pe.update(this.updatePoint, !0);
    }, this.handlePointerUp = (E, D) => {
      this.end();
      const { onEnd: L, onSessionEnd: V, resumeAnimation: N } = this.handlers;
      if ((this.dragSnapToOrigin || !this.startEvent) && N && N(), !(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      const z = Zl(E.type === "pointercancel" ? this.lastMoveEventInfo : ls(D, this.transformPagePoint), this.history);
      this.startEvent && L && L(E, z), V && V(E, z);
    }, !tc(r))
      return;
    this.dragSnapToOrigin = d, this.handlers = o, this.transformPagePoint = a, this.distanceThreshold = f, this.contextWindow = u || window;
    const g = Gi(r), v = ls(g, this.transformPagePoint), { point: y } = v, { timestamp: x } = Xe;
    this.history = [{ ...y, timestamp: x }];
    const { onSessionStart: S } = o;
    S && S(r, Zl(v, this.history));
    const A = { passive: !0, capture: !0 };
    this.removeListeners = Ui(Ii(this.contextWindow, "pointermove", this.handlePointerMove, A), Ii(this.contextWindow, "pointerup", this.handlePointerUp, A), Ii(this.contextWindow, "pointercancel", this.handlePointerUp, A)), h && this.startScrollTracking(h);
  }
  /**
   * Start tracking scroll on ancestors and window.
   */
  startScrollTracking(r) {
    let o = r.parentElement;
    for (; o; ) {
      const a = getComputedStyle(o);
      (jp.has(a.overflowX) || jp.has(a.overflowY)) && this.scrollPositions.set(o, {
        x: o.scrollLeft,
        y: o.scrollTop
      }), o = o.parentElement;
    }
    this.scrollPositions.set(window, {
      x: window.scrollX,
      y: window.scrollY
    }), window.addEventListener("scroll", this.onElementScroll, {
      capture: !0
    }), window.addEventListener("scroll", this.onWindowScroll), this.removeScrollListeners = () => {
      window.removeEventListener("scroll", this.onElementScroll, {
        capture: !0
      }), window.removeEventListener("scroll", this.onWindowScroll);
    };
  }
  /**
   * Handle scroll compensation during drag.
   *
   * For element scroll: adjusts history origin since pageX/pageY doesn't change.
   * For window scroll: adjusts lastMoveEventInfo since pageX/pageY would change.
   */
  handleScroll(r) {
    const o = this.scrollPositions.get(r);
    if (!o)
      return;
    const a = r === window, u = a ? { x: window.scrollX, y: window.scrollY } : {
      x: r.scrollLeft,
      y: r.scrollTop
    }, d = { x: u.x - o.x, y: u.y - o.y };
    d.x === 0 && d.y === 0 || (a ? this.lastMoveEventInfo && (this.lastMoveEventInfo.point.x += d.x, this.lastMoveEventInfo.point.y += d.y) : this.history.length > 0 && (this.history[0].x -= d.x, this.history[0].y -= d.y), this.scrollPositions.set(r, u), Pe.update(this.updatePoint, !0));
  }
  updateHandlers(r) {
    this.handlers = r;
  }
  end() {
    this.removeListeners && this.removeListeners(), this.removeScrollListeners && this.removeScrollListeners(), this.scrollPositions.clear(), ln(this.updatePoint);
  }
}
function ls(n, r) {
  return r ? { point: r(n.point) } : n;
}
function Rp(n, r) {
  return { x: n.x - r.x, y: n.y - r.y };
}
function Zl({ point: n }, r) {
  return {
    point: n,
    delta: Rp(n, _0(r)),
    offset: Rp(n, Tw(r)),
    velocity: Pw(r, 0.1)
  };
}
function Tw(n) {
  return n[0];
}
function _0(n) {
  return n[n.length - 1];
}
function Pw(n, r) {
  if (n.length < 2)
    return { x: 0, y: 0 };
  let o = n.length - 1, a = null;
  const u = _0(n);
  for (; o >= 0 && (a = n[o], !(u.timestamp - a.timestamp > /* @__PURE__ */ ht(r))); )
    o--;
  if (!a)
    return { x: 0, y: 0 };
  a === n[0] && n.length > 2 && u.timestamp - a.timestamp > /* @__PURE__ */ ht(r) * 2 && (a = n[1]);
  const d = /* @__PURE__ */ jt(u.timestamp - a.timestamp);
  if (d === 0)
    return { x: 0, y: 0 };
  const f = {
    x: (u.x - a.x) / d,
    y: (u.y - a.y) / d
  };
  return f.x === 1 / 0 && (f.x = 0), f.y === 1 / 0 && (f.y = 0), f;
}
function Ew(n, { min: r, max: o }, a) {
  return r !== void 0 && n < r ? n = a ? Ee(r, n, a.min) : Math.max(n, r) : o !== void 0 && n > o && (n = a ? Ee(o, n, a.max) : Math.min(n, o)), n;
}
function Mp(n, r, o) {
  return {
    min: r !== void 0 ? n.min + r : void 0,
    max: o !== void 0 ? n.max + o - (n.max - n.min) : void 0
  };
}
function jw(n, { top: r, left: o, bottom: a, right: u }) {
  return {
    x: Mp(n.x, o, u),
    y: Mp(n.y, r, a)
  };
}
function Ap(n, r) {
  let o = r.min - n.min, a = r.max - n.max;
  return r.max - r.min < n.max - n.min && ([o, a] = [a, o]), { min: o, max: a };
}
function Rw(n, r) {
  return {
    x: Ap(n.x, r.x),
    y: Ap(n.y, r.y)
  };
}
function Mw(n, r) {
  let o = 0.5;
  const a = st(n), u = st(r);
  return u > a ? o = /* @__PURE__ */ bi(r.min, r.max - a, n.min) : a > u && (o = /* @__PURE__ */ bi(n.min, n.max - u, r.min)), qt(0, 1, o);
}
function Aw(n, r) {
  const o = {};
  return r.min !== void 0 && (o.min = r.min - n.min), r.max !== void 0 && (o.max = r.max - n.min), o;
}
const Ru = 0.35;
function Dw(n = Ru) {
  return n === !1 ? n = 0 : n === !0 && (n = Ru), {
    x: Dp(n, "left", "right"),
    y: Dp(n, "top", "bottom")
  };
}
function Dp(n, r, o) {
  return {
    min: Lp(n, r),
    max: Lp(n, o)
  };
}
function Lp(n, r) {
  return typeof n == "number" ? n : n[r] || 0;
}
const Lw = /* @__PURE__ */ new WeakMap();
class Vw {
  constructor(r) {
    this.openDragLock = null, this.isDragging = !1, this.currentDirection = null, this.originPoint = { x: 0, y: 0 }, this.constraints = !1, this.hasMutatedConstraints = !1, this.elastic = We(), this.latestPointerEvent = null, this.latestPanInfo = null, this.visualElement = r;
  }
  start(r, { snapToCursor: o = !1, distanceThreshold: a } = {}) {
    const { presenceContext: u } = this.visualElement;
    if (u && u.isPresent === !1)
      return;
    const d = (x) => {
      o && this.snapToCursor(Gi(x).point), this.stopAnimation();
    }, f = (x, S) => {
      const { drag: A, dragPropagation: E, onDragStart: D } = this.getProps();
      if (A && !E && (this.openDragLock && this.openDragLock(), this.openDragLock = o2(A), !this.openDragLock))
        return;
      this.latestPointerEvent = x, this.latestPanInfo = S, this.isDragging = !0, this.currentDirection = null, this.resolveConstraints(), this.visualElement.projection && (this.visualElement.projection.isAnimationBlocked = !0, this.visualElement.projection.target = void 0), Gt((V) => {
        let N = this.getAxisMotionValue(V).get() || 0;
        if (Qt.test(N)) {
          const { projection: z } = this.visualElement;
          if (z && z.layout) {
            const b = z.layout.layoutBox[V];
            b && (N = st(b) * (parseFloat(N) / 100));
          }
        }
        this.originPoint[V] = N;
      }), D && Pe.update(() => D(x, S), !1, !0), vu(this.visualElement, "transform");
      const { animationState: L } = this.visualElement;
      L && L.setActive("whileDrag", !0);
    }, h = (x, S) => {
      this.latestPointerEvent = x, this.latestPanInfo = S;
      const { dragPropagation: A, dragDirectionLock: E, onDirectionLock: D, onDrag: L } = this.getProps();
      if (!A && !this.openDragLock)
        return;
      const { offset: V } = S;
      if (E && this.currentDirection === null) {
        this.currentDirection = _w(V), this.currentDirection !== null && D && D(this.currentDirection);
        return;
      }
      this.updateAxis("x", S.point, V), this.updateAxis("y", S.point, V), this.visualElement.render(), L && Pe.update(() => L(x, S), !1, !0);
    }, g = (x, S) => {
      this.latestPointerEvent = x, this.latestPanInfo = S, this.stop(x, S), this.latestPointerEvent = null, this.latestPanInfo = null;
    }, v = () => {
      const { dragSnapToOrigin: x } = this.getProps();
      (x || this.constraints) && this.startAnimation({ x: 0, y: 0 });
    }, { dragSnapToOrigin: y } = this.getProps();
    this.panSession = new N0(r, {
      onSessionStart: d,
      onStart: f,
      onMove: h,
      onSessionEnd: g,
      resumeAnimation: v
    }, {
      transformPagePoint: this.visualElement.getTransformPagePoint(),
      dragSnapToOrigin: y,
      distanceThreshold: a,
      contextWindow: V0(this.visualElement),
      element: this.visualElement.current
    });
  }
  /**
   * @internal
   */
  stop(r, o) {
    const a = r || this.latestPointerEvent, u = o || this.latestPanInfo, d = this.isDragging;
    if (this.cancel(), !d || !u || !a)
      return;
    const { velocity: f } = u;
    this.startAnimation(f);
    const { onDragEnd: h } = this.getProps();
    h && Pe.postRender(() => h(a, u));
  }
  /**
   * @internal
   */
  cancel() {
    this.isDragging = !1;
    const { projection: r, animationState: o } = this.visualElement;
    r && (r.isAnimationBlocked = !1), this.endPanSession();
    const { dragPropagation: a } = this.getProps();
    !a && this.openDragLock && (this.openDragLock(), this.openDragLock = null), o && o.setActive("whileDrag", !1);
  }
  /**
   * Clean up the pan session without modifying other drag state.
   * This is used during unmount to ensure event listeners are removed
   * without affecting projection animations or drag locks.
   * @internal
   */
  endPanSession() {
    this.panSession && this.panSession.end(), this.panSession = void 0;
  }
  updateAxis(r, o, a) {
    const { drag: u } = this.getProps();
    if (!a || !us(r, u, this.currentDirection))
      return;
    const d = this.getAxisMotionValue(r);
    let f = this.originPoint[r] + a[r];
    this.constraints && this.constraints[r] && (f = Ew(f, this.constraints[r], this.elastic[r])), d.set(f);
  }
  resolveConstraints() {
    const { dragConstraints: r, dragElastic: o } = this.getProps(), a = this.visualElement.projection && !this.visualElement.projection.layout ? this.visualElement.projection.measure(!1) : this.visualElement.projection?.layout, u = this.constraints;
    r && Dr(r) ? this.constraints || (this.constraints = this.resolveRefConstraints()) : r && a ? this.constraints = jw(a.layoutBox, r) : this.constraints = !1, this.elastic = Dw(o), u !== this.constraints && !Dr(r) && a && this.constraints && !this.hasMutatedConstraints && Gt((d) => {
      this.constraints !== !1 && this.getAxisMotionValue(d) && (this.constraints[d] = Aw(a.layoutBox[d], this.constraints[d]));
    });
  }
  resolveRefConstraints() {
    const { dragConstraints: r, onMeasureDragConstraints: o } = this.getProps();
    if (!r || !Dr(r))
      return !1;
    const a = r.current;
    tr(a !== null, "If `dragConstraints` is set as a React ref, that ref must be passed to another component's `ref` prop.", "drag-constraints-ref");
    const { projection: u } = this.visualElement;
    if (!u || !u.layout)
      return !1;
    u.root && (u.root.scroll = void 0, u.root.updateScroll());
    const d = _2(a, u.root, this.visualElement.getTransformPagePoint());
    let f = Rw(u.layout.layoutBox, d);
    if (o) {
      const h = o(L2(f));
      this.hasMutatedConstraints = !!h, h && (f = n0(h));
    }
    return f;
  }
  startAnimation(r) {
    const { drag: o, dragMomentum: a, dragElastic: u, dragTransition: d, dragSnapToOrigin: f, onDragTransitionEnd: h } = this.getProps(), g = this.constraints || {}, v = Gt((y) => {
      if (!us(y, o, this.currentDirection))
        return;
      let x = g && g[y] || {};
      (f === !0 || f === y) && (x = { min: 0, max: 0 });
      const S = u ? 200 : 1e6, A = u ? 40 : 1e7, E = {
        type: "inertia",
        velocity: a ? r[y] : 0,
        bounceStiffness: S,
        bounceDamping: A,
        timeConstant: 750,
        restDelta: 1,
        restSpeed: 10,
        ...d,
        ...x
      };
      return this.startAxisValueAnimation(y, E);
    });
    return Promise.all(v).then(h);
  }
  startAxisValueAnimation(r, o) {
    const a = this.getAxisMotionValue(r);
    return vu(this.visualElement, r), a.start(Qu(r, a, 0, o, this.visualElement, !1));
  }
  stopAnimation() {
    Gt((r) => this.getAxisMotionValue(r).stop());
  }
  /**
   * Drag works differently depending on which props are provided.
   *
   * - If _dragX and _dragY are provided, we output the gesture delta directly to those motion values.
   * - Otherwise, we apply the delta to the x/y motion values.
   */
  getAxisMotionValue(r) {
    const o = `_drag${r.toUpperCase()}`, u = this.visualElement.getProps()[o];
    return u || this.visualElement.getValue(r, this.visualElement.latestValues[r] ?? 0);
  }
  snapToCursor(r) {
    Gt((o) => {
      const { drag: a } = this.getProps();
      if (!us(o, a, this.currentDirection))
        return;
      const { projection: u } = this.visualElement, d = this.getAxisMotionValue(o);
      if (u && u.layout) {
        const { min: f, max: h } = u.layout.layoutBox[o], g = d.get() || 0;
        d.set(r[o] - Ee(f, h, 0.5) + g);
      }
    });
  }
  /**
   * When the viewport resizes we want to check if the measured constraints
   * have changed and, if so, reposition the element within those new constraints
   * relative to where it was before the resize.
   */
  scalePositionWithinConstraints() {
    if (!this.visualElement.current)
      return;
    const { drag: r, dragConstraints: o } = this.getProps(), { projection: a } = this.visualElement;
    if (!Dr(o) || !a || !this.constraints)
      return;
    this.stopAnimation();
    const u = { x: 0, y: 0 };
    Gt((f) => {
      const h = this.getAxisMotionValue(f);
      if (h && this.constraints !== !1) {
        const g = h.get();
        u[f] = Mw({ min: g, max: g }, this.constraints[f]);
      }
    });
    const { transformTemplate: d } = this.visualElement.getProps();
    this.visualElement.current.style.transform = d ? d({}, "") : "none", a.root && a.root.updateScroll(), a.updateLayout(), this.constraints = !1, this.resolveConstraints(), Gt((f) => {
      if (!us(f, r, null))
        return;
      const h = this.getAxisMotionValue(f), { min: g, max: v } = this.constraints[f];
      h.set(Ee(g, v, u[f]));
    }), this.visualElement.render();
  }
  addListeners() {
    if (!this.visualElement.current)
      return;
    Lw.set(this.visualElement, this);
    const r = this.visualElement.current, o = Ii(r, "pointerdown", (v) => {
      const { drag: y, dragListener: x = !0 } = this.getProps(), S = v.target, A = S !== r && f2(S);
      y && x && !A && this.start(v);
    });
    let a;
    const u = () => {
      const { dragConstraints: v } = this.getProps();
      Dr(v) && v.current && (this.constraints = this.resolveRefConstraints(), a || (a = Nw(r, v.current, () => this.scalePositionWithinConstraints())));
    }, { projection: d } = this.visualElement, f = d.addEventListener("measure", u);
    d && !d.layout && (d.root && d.root.updateScroll(), d.updateLayout()), Pe.read(u);
    const h = $i(window, "resize", () => this.scalePositionWithinConstraints()), g = d.addEventListener("didUpdate", (({ delta: v, hasLayoutChanged: y }) => {
      this.isDragging && y && (Gt((x) => {
        const S = this.getAxisMotionValue(x);
        S && (this.originPoint[x] += v[x].translate, S.set(S.get() + v[x].translate));
      }), this.visualElement.render());
    }));
    return () => {
      h(), o(), f(), g && g(), a && a();
    };
  }
  getProps() {
    const r = this.visualElement.getProps(), { drag: o = !1, dragDirectionLock: a = !1, dragPropagation: u = !1, dragConstraints: d = !1, dragElastic: f = Ru, dragMomentum: h = !0 } = r;
    return {
      ...r,
      drag: o,
      dragDirectionLock: a,
      dragPropagation: u,
      dragConstraints: d,
      dragElastic: f,
      dragMomentum: h
    };
  }
}
function Vp(n) {
  let r = !0;
  return () => {
    if (r) {
      r = !1;
      return;
    }
    n();
  };
}
function Nw(n, r, o) {
  const a = Oh(n, Vp(o)), u = Oh(r, Vp(o));
  return () => {
    a(), u();
  };
}
function us(n, r, o) {
  return (r === !0 || r === n) && (o === null || o === n);
}
function _w(n, r = 10) {
  let o = null;
  return Math.abs(n.y) > r ? o = "y" : Math.abs(n.x) > r && (o = "x"), o;
}
class zw extends Vn {
  constructor(r) {
    super(r), this.removeGroupControls = Rt, this.removeListeners = Rt, this.controls = new Vw(r);
  }
  mount() {
    const { dragControls: r } = this.node.getProps();
    r && (this.removeGroupControls = r.subscribe(this.controls)), this.removeListeners = this.controls.addListeners() || Rt;
  }
  update() {
    const { dragControls: r } = this.node.getProps(), { dragControls: o } = this.node.prevProps || {};
    r !== o && (this.removeGroupControls(), r && (this.removeGroupControls = r.subscribe(this.controls)));
  }
  unmount() {
    this.removeGroupControls(), this.removeListeners(), this.controls.isDragging || this.controls.endPanSession();
  }
}
const Jl = (n) => (r, o) => {
  n && Pe.update(() => n(r, o), !1, !0);
};
class Iw extends Vn {
  constructor() {
    super(...arguments), this.removePointerDownListener = Rt;
  }
  onPointerDown(r) {
    this.session = new N0(r, this.createPanHandlers(), {
      transformPagePoint: this.node.getTransformPagePoint(),
      contextWindow: V0(this.node)
    });
  }
  createPanHandlers() {
    const { onPanSessionStart: r, onPanStart: o, onPan: a, onPanEnd: u } = this.node.getProps();
    return {
      onSessionStart: Jl(r),
      onStart: Jl(o),
      onMove: Jl(a),
      onEnd: (d, f) => {
        delete this.session, u && Pe.postRender(() => u(d, f));
      }
    };
  }
  mount() {
    this.removePointerDownListener = Ii(this.node.current, "pointerdown", (r) => this.onPointerDown(r));
  }
  update() {
    this.session && this.session.updateHandlers(this.createPanHandlers());
  }
  unmount() {
    this.removePointerDownListener(), this.session && this.session.end();
  }
}
let eu = !1;
class Fw extends M.Component {
  /**
   * This only mounts projection nodes for components that
   * need measuring, we might want to do it for all components
   * in order to incorporate transforms
   */
  componentDidMount() {
    const { visualElement: r, layoutGroup: o, switchLayoutGroup: a, layoutId: u } = this.props, { projection: d } = r;
    d && (o.group && o.group.add(d), a && a.register && u && a.register(d), eu && d.root.didUpdate(), d.addEventListener("animationComplete", () => {
      this.safeToRemove();
    }), d.setOptions({
      ...d.options,
      layoutDependency: this.props.layoutDependency,
      onExitComplete: () => this.safeToRemove()
    })), ks.hasEverUpdated = !0;
  }
  getSnapshotBeforeUpdate(r) {
    const { layoutDependency: o, visualElement: a, drag: u, isPresent: d } = this.props, { projection: f } = a;
    return f && (f.isPresent = d, r.layoutDependency !== o && f.setOptions({
      ...f.options,
      layoutDependency: o
    }), eu = !0, u || r.layoutDependency !== o || o === void 0 || r.isPresent !== d ? f.willUpdate() : this.safeToRemove(), r.isPresent !== d && (d ? f.promote() : f.relegate() || Pe.postRender(() => {
      const h = f.getStack();
      (!h || !h.members.length) && this.safeToRemove();
    }))), null;
  }
  componentDidUpdate() {
    const { visualElement: r, layoutAnchor: o } = this.props, { projection: a } = r;
    a && (a.options.layoutAnchor = o, a.root.didUpdate(), ec.postRender(() => {
      !a.currentAnimation && a.isLead() && this.safeToRemove();
    }));
  }
  componentWillUnmount() {
    const { visualElement: r, layoutGroup: o, switchLayoutGroup: a } = this.props, { projection: u } = r;
    eu = !0, u && (u.scheduleCheckAfterUnmount(), o && o.group && o.group.remove(u), a && a.deregister && a.deregister(u));
  }
  safeToRemove() {
    const { safeToRemove: r } = this.props;
    r && r();
  }
  render() {
    return null;
  }
}
function z0(n) {
  const [r, o] = C0(), a = M.useContext(zu);
  return m.jsx(Fw, { ...n, layoutGroup: a, switchLayoutGroup: M.useContext(D0), isPresent: r, safeToRemove: o });
}
const bw = {
  pan: {
    Feature: Iw
  },
  drag: {
    Feature: zw,
    ProjectionNode: k0,
    MeasureLayout: z0
  }
};
function Np(n, r, o) {
  const { props: a } = n;
  n.animationState && a.whileHover && n.animationState.setActive("whileHover", o === "Start");
  const u = "onHover" + o, d = a[u];
  d && Pe.postRender(() => d(r, Gi(r)));
}
class Ow extends Vn {
  mount() {
    const { current: r } = this.node;
    r && (this.unmount = a2(r, (o, a) => (Np(this.node, a, "Start"), (u) => Np(this.node, u, "End"))));
  }
  unmount() {
  }
}
class Bw extends Vn {
  constructor() {
    super(...arguments), this.isActive = !1;
  }
  onFocus() {
    let r = !1;
    try {
      r = this.node.current.matches(":focus-visible");
    } catch {
      r = !0;
    }
    !r || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !0), this.isActive = !0);
  }
  onBlur() {
    !this.isActive || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !1), this.isActive = !1);
  }
  mount() {
    this.unmount = Ui($i(this.node.current, "focus", () => this.onFocus()), $i(this.node.current, "blur", () => this.onBlur()));
  }
  unmount() {
  }
}
function _p(n, r, o) {
  const { props: a } = n;
  if (n.current instanceof HTMLButtonElement && n.current.disabled)
    return;
  n.animationState && a.whileTap && n.animationState.setActive("whileTap", o === "Start");
  const u = "onTap" + (o === "End" ? "" : o), d = a[u];
  d && Pe.postRender(() => d(r, Gi(r)));
}
class $w extends Vn {
  mount() {
    const { current: r } = this.node;
    if (!r)
      return;
    const { globalTapTarget: o, propagate: a } = this.node.props;
    this.unmount = h2(r, (u, d) => (_p(this.node, d, "Start"), (f, { success: h }) => _p(this.node, f, h ? "End" : "Cancel")), {
      useGlobalTarget: o,
      stopPropagation: a?.tap === !1
    });
  }
  unmount() {
  }
}
const Mu = /* @__PURE__ */ new WeakMap(), tu = /* @__PURE__ */ new WeakMap(), Ww = (n) => {
  const r = Mu.get(n.target);
  r && r(n);
}, Uw = (n) => {
  n.forEach(Ww);
};
function Hw({ root: n, ...r }) {
  const o = n || document;
  tu.has(o) || tu.set(o, {});
  const a = tu.get(o), u = JSON.stringify(r);
  return a[u] || (a[u] = new IntersectionObserver(Uw, { root: n, ...r })), a[u];
}
function Kw(n, r, o) {
  const a = Hw(r);
  return Mu.set(n, o), a.observe(n), () => {
    Mu.delete(n), a.unobserve(n);
  };
}
const Gw = {
  some: 0,
  all: 1
};
class Yw extends Vn {
  constructor() {
    super(...arguments), this.hasEnteredView = !1, this.isInView = !1;
  }
  startObserver() {
    this.stopObserver?.();
    const { viewport: r = {} } = this.node.getProps(), { root: o, margin: a, amount: u = "some", once: d } = r, f = {
      root: o ? o.current : void 0,
      rootMargin: a,
      threshold: typeof u == "number" ? u : Gw[u]
    }, h = (g) => {
      const { isIntersecting: v } = g;
      if (this.isInView === v || (this.isInView = v, d && !v && this.hasEnteredView))
        return;
      v && (this.hasEnteredView = !0), this.node.animationState && this.node.animationState.setActive("whileInView", v);
      const { onViewportEnter: y, onViewportLeave: x } = this.node.getProps(), S = v ? y : x;
      S && S(g);
    };
    this.stopObserver = Kw(this.node.current, f, h);
  }
  mount() {
    this.startObserver();
  }
  update() {
    if (typeof IntersectionObserver > "u")
      return;
    const { props: r, prevProps: o } = this.node;
    ["amount", "margin", "root"].some(Xw(r, o)) && this.startObserver();
  }
  unmount() {
    this.stopObserver?.(), this.hasEnteredView = !1, this.isInView = !1;
  }
}
function Xw({ viewport: n = {} }, { viewport: r = {} } = {}) {
  return (o) => n[o] !== r[o];
}
const Qw = {
  inView: {
    Feature: Yw
  },
  tap: {
    Feature: $w
  },
  focus: {
    Feature: Bw
  },
  hover: {
    Feature: Ow
  }
}, qw = {
  layout: {
    ProjectionNode: k0,
    MeasureLayout: z0
  }
}, Zw = {
  ...Sw,
  ...Qw,
  ...bw,
  ...qw
}, me = /* @__PURE__ */ yw(Zw, gw);
function I0(n) {
  const r = Dn(() => nr(n)), { isStatic: o } = M.useContext(Ir);
  if (o) {
    const [, a] = M.useState(n);
    M.useEffect(() => r.on("change", a), []);
  }
  return r;
}
function F0(n, r) {
  const o = I0(r()), a = () => o.set(r());
  return a(), zs(() => {
    const u = () => Pe.preRender(a, !1, !0), d = n.map((f) => f.on("change", u));
    return () => {
      d.forEach((f) => f()), ln(a);
    };
  }), o;
}
function Jw(n) {
  _i.current = [], n();
  const r = F0(_i.current, n);
  return _i.current = void 0, r;
}
function b0(n, r, o, a) {
  if (typeof n == "function")
    return Jw(n);
  if (o !== void 0 && !Array.isArray(o) && typeof r != "function")
    return e3(n, r, o, a);
  const f = typeof r == "function" ? r : C2(r, o, a), h = Array.isArray(n) ? zp(n, f) : zp([n], ([v]) => f(v)), g = Array.isArray(n) ? void 0 : n.accelerate;
  return g && !g.isTransformed && typeof r != "function" && Array.isArray(o) && a?.clamp !== !1 && (h.accelerate = {
    ...g,
    times: r,
    keyframes: o,
    isTransformed: !0
  }), h;
}
function zp(n, r) {
  const o = Dn(() => []);
  return F0(n, () => {
    o.length = 0;
    const a = n.length;
    for (let u = 0; u < a; u++)
      o[u] = n[u].get();
    return r(o);
  });
}
function e3(n, r, o, a) {
  const u = Dn(() => Object.keys(o)), d = Dn(() => ({}));
  for (const f of u)
    d[f] = b0(n, r, o[f], a);
  return d;
}
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const t3 = (n) => n.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), n3 = (n) => n.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (r, o, a) => a ? a.toUpperCase() : o.toLowerCase()
), Ip = (n) => {
  const r = n3(n);
  return r.charAt(0).toUpperCase() + r.slice(1);
}, O0 = (...n) => n.filter((r, o, a) => !!r && r.trim() !== "" && a.indexOf(r) === o).join(" ").trim();
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var r3 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const i3 = M.forwardRef(
  ({
    color: n = "currentColor",
    size: r = 24,
    strokeWidth: o = 2,
    absoluteStrokeWidth: a,
    className: u = "",
    children: d,
    iconNode: f,
    ...h
  }, g) => M.createElement(
    "svg",
    {
      ref: g,
      ...r3,
      width: r,
      height: r,
      stroke: n,
      strokeWidth: a ? Number(o) * 24 / Number(r) : o,
      className: O0("lucide", u),
      ...h
    },
    [
      ...f.map(([v, y]) => M.createElement(v, y)),
      ...Array.isArray(d) ? d : [d]
    ]
  )
);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Me = (n, r) => {
  const o = M.forwardRef(
    ({ className: a, ...u }, d) => M.createElement(i3, {
      ref: d,
      iconNode: r,
      className: O0(
        `lucide-${t3(Ip(n))}`,
        `lucide-${n}`,
        a
      ),
      ...u
    })
  );
  return o.displayName = Ip(n), o;
};
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const o3 = [
  ["path", { d: "M2 10v3", key: "1fnikh" }],
  ["path", { d: "M6 6v11", key: "11sgs0" }],
  ["path", { d: "M10 3v18", key: "yhl04a" }],
  ["path", { d: "M14 8v7", key: "3a1oy3" }],
  ["path", { d: "M18 5v13", key: "123xd1" }],
  ["path", { d: "M22 10v3", key: "154ddg" }]
], s3 = Me("audio-lines", o3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const a3 = [
  ["path", { d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z", key: "1fy3hk" }],
  ["line", { x1: "12", x2: "12", y1: "7", y2: "13", key: "1cppfj" }],
  ["line", { x1: "15", x2: "9", y1: "10", y2: "10", key: "1gty7f" }]
], l3 = Me("bookmark-plus", a3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const u3 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]], uc = Me("check", u3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const c3 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]], f3 = Me("chevron-down", c3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const d3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
], h3 = Me("clock", d3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const p3 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
], m3 = Me("copy", p3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const y3 = [
  [
    "path",
    {
      d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
      key: "1vdc57"
    }
  ],
  ["path", { d: "M5 21h14", key: "11awu3" }]
], Au = Me("crown", y3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const g3 = [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
], v3 = Me("download", g3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const x3 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "M10 14 21 3", key: "gplh6r" }],
  ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", key: "a6xqqp" }]
], Fp = Me("external-link", x3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const w3 = [
  ["path", { d: "m9 11-6 6v3h9l3-3", key: "1a3l36" }],
  ["path", { d: "m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4", key: "14a9rk" }]
], S3 = Me("highlighter", w3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const k3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m4.93 4.93 4.24 4.24", key: "1ymg45" }],
  ["path", { d: "m14.83 9.17 4.24-4.24", key: "1cb5xl" }],
  ["path", { d: "m14.83 14.83 4.24 4.24", key: "q42g0n" }],
  ["path", { d: "m9.17 14.83-4.24 4.24", key: "bqpfvv" }],
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }]
], C3 = Me("life-buoy", k3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const T3 = [
  ["path", { d: "M9 17H7A5 5 0 0 1 7 7h2", key: "8i5ue5" }],
  ["path", { d: "M15 7h2a5 5 0 1 1 0 10h-2", key: "1b9ql8" }],
  ["line", { x1: "8", x2: "16", y1: "12", y2: "12", key: "1jonct" }]
], P3 = Me("link-2", T3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const E3 = [
  ["path", { d: "M12 12H3", key: "18klou" }],
  ["path", { d: "M16 6H3", key: "1wxfjs" }],
  ["path", { d: "M12 18H3", key: "11ftsu" }],
  ["path", { d: "m16 12 5 3-5 3v-6Z", key: "zpskkp" }]
], j3 = Me("list-video", E3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const R3 = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]], B0 = Me("loader-circle", R3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const M3 = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
], A3 = Me("lock", M3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const D3 = [
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }],
  ["polyline", { points: "10 17 15 12 10 7", key: "1ail0h" }],
  ["line", { x1: "15", x2: "3", y1: "12", y2: "12", key: "v6grx8" }]
], L3 = Me("log-in", D3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const V3 = [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }]
], N3 = Me("log-out", V3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const _3 = [
  ["rect", { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" }],
  ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }]
], z3 = Me("mail", _3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const I3 = [
  ["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z", key: "a7tn18" }]
], F3 = Me("moon", I3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const b3 = [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
], $0 = Me("pause", b3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const O3 = [["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]], cc = Me("play", O3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const B3 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
], $3 = Me("rotate-ccw", B3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const W3 = [
  ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", key: "1p45f6" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }]
], U3 = Me("rotate-cw", W3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const H3 = [
  ["line", { x1: "21", x2: "14", y1: "4", y2: "4", key: "obuewd" }],
  ["line", { x1: "10", x2: "3", y1: "4", y2: "4", key: "1q6298" }],
  ["line", { x1: "21", x2: "12", y1: "12", y2: "12", key: "1iu8h1" }],
  ["line", { x1: "8", x2: "3", y1: "12", y2: "12", key: "ntss68" }],
  ["line", { x1: "21", x2: "16", y1: "20", y2: "20", key: "14d8ph" }],
  ["line", { x1: "12", x2: "3", y1: "20", y2: "20", key: "m0wm8r" }],
  ["line", { x1: "14", x2: "14", y1: "2", y2: "6", key: "14e1ph" }],
  ["line", { x1: "8", x2: "8", y1: "10", y2: "14", key: "1i6ji0" }],
  ["line", { x1: "16", x2: "16", y1: "18", y2: "22", key: "1lctlv" }]
], K3 = Me("sliders-horizontal", H3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const G3 = [
  ["polyline", { points: "4 7 4 4 20 4 20 7", key: "1nosan" }],
  ["line", { x1: "9", x2: "15", y1: "20", y2: "20", key: "swin9y" }],
  ["line", { x1: "12", x2: "12", y1: "4", y2: "20", key: "1tx1rr" }]
], Y3 = Me("type", G3);
/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const X3 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], rr = Me("x", X3), An = {
  p14208d80: "M297.346 181.958C297.346 260.391 233.763 323.974 155.33 323.974C76.8966 323.974 13.314 260.391 13.314 181.958M155.33 368.354V332.85M155.33 244.09C116.113 244.09 84.3219 212.298 84.3219 173.082V84.3219C84.3219 45.1053 116.113 13.314 155.33 13.314C194.546 13.314 226.338 45.1053 226.338 84.3219V173.082C226.338 212.298 194.546 244.09 155.33 244.09Z",
  p159cbe00: "M263.737 13.2242C264.607 14.6289 265.477 15.9333 266.348 17.1374L266.293 17.5512C265.06 17.9401 263.845 18.1721 262.649 18.2473L262.304 17.9463L262.087 17.476C261.99 17.2753 261.796 16.8552 261.506 16.2155C261.216 15.5633 260.962 14.955 260.745 14.3906H259.53L259.657 18.0216H256.012L256.194 14.4471L256.012 5.84943L261.579 5.83062C262.896 5.83062 263.912 6.15671 264.625 6.8089C265.338 7.44855 265.695 8.37667 265.695 9.59326C265.695 10.3082 265.52 10.9792 265.169 11.6063C264.831 12.2334 264.353 12.7727 263.737 13.2242ZM261.869 9.96952C261.869 9.46784 261.742 9.09784 261.488 8.85954C261.246 8.6087 260.848 8.47074 260.291 8.44565L259.639 8.50209L259.566 11.6439L260.89 11.7192C261.228 11.5561 261.476 11.3366 261.633 11.0607C261.79 10.7848 261.869 10.421 261.869 9.96952Z",
  p179dbd80: "M216.976 80.8286L97.8509 148.9",
  p282aca00: "M89.4523 10.3647C78.2534 2.16412 66.7596 -0.758755 53.2328 0.163516C38.3146 1.69372 24.5824 9.30322 15.0303 21.3329C5.30736 33.5285 1.07091 48.0035 2.55109 63.7845C3.91089 78.6537 10.8877 92.3514 21.9468 101.864C25.7307 105.073 29.4059 107.435 34.1419 109.376C35.7706 110.014 37.4643 110.533 39.1424 111.047C45.8008 113.088 52.2149 115.054 53.3627 124.066C53.8044 127.535 52.819 131.374 50.6878 134.107C46.9592 138.889 42.0562 139.066 37.0305 139.247C35.4633 139.304 33.8842 139.361 32.325 139.558C23.2627 140.788 14.9562 145.461 9.00011 152.679C2.58298 160.384 -0.620264 170.435 0.0996298 180.608C0.811817 191.017 5.50959 200.694 13.1385 207.465C17.7733 211.613 23.3289 214.491 29.3017 215.835C31.8891 216.401 34.3731 216.467 36.7476 216.531C41.6641 216.663 46.1113 216.782 50.0354 221.287C51.836 223.348 52.9181 225.98 53.1079 228.758C53.3632 232.601 52.1172 236.392 49.6519 239.264C47.033 242.321 43.4652 243.455 39.6777 244.659C37.6942 245.289 35.6504 245.938 33.6511 246.893C13.7183 256.382 1.31406 277.52 2.30155 300.318C2.85695 315.326 9.17709 329.474 19.8434 339.588C30.6899 350.142 45.1683 355.69 59.998 354.979C71.1034 354.456 81.8088 350.504 90.7531 343.631C91.934 342.705 93.0946 341.7 94.2589 340.692C96.437 338.805 98.628 336.908 100.989 335.501C111.193 329.425 120.738 326.99 132.257 326.276C141.662 326.248 148.231 326.724 157.447 329.676C161.098 330.816 164.656 332.253 168.092 333.968C168.889 334.359 169.722 334.783 170.572 335.215C172.984 336.441 175.539 337.74 177.84 338.589C194.172 344.444 212.28 339.992 224.371 327.147C233.032 318.284 237.927 306.178 237.958 293.533C237.947 290.489 237.632 287.52 237.315 284.532C237.208 283.523 237.1 282.513 237.004 281.496C235.099 261.277 240.842 240.263 254.727 225.617C257.301 222.901 260.209 220.466 263.115 218.032C265.071 216.394 267.026 214.756 268.88 213.032C278.617 203.976 284.139 190.99 284.03 177.392C284.025 165.321 279.515 153.033 271.208 144.522C268.756 142.012 265.873 139.683 263.006 137.367C260.519 135.359 258.043 133.359 255.869 131.258C243.212 119.018 236.893 101.445 236.731 83.6411C236.688 79.1252 237.021 75.4436 237.374 71.5319C237.552 69.5631 237.735 67.536 237.879 65.3149C238.833 50.5414 234.169 37.3551 223.959 26.9005C215.208 18.0782 203.441 13.2491 191.262 13.481C182.456 13.6423 177.873 15.9312 171.278 19.2251C170.056 19.8356 168.765 20.4806 167.364 21.153C147.035 30.9175 120.891 31.6757 101.347 19.5326C98.6528 17.8584 96.2117 15.8414 93.7682 13.8223C92.3472 12.6481 90.9253 11.4732 89.4523 10.3647ZM130.902 87.0568C141.845 87.2972 151.356 91.61 160.102 98.3263C180.359 113.883 192.554 136.16 196.436 161.788C200.47 188.596 194.175 215.979 178.924 237.981C168.664 252.602 152.937 266.335 135.345 269.204C134.645 269.318 133.849 269.371 133.133 269.418L133.022 269.426C126.087 269.816 119.283 267.345 114.086 262.547C109.153 257.973 106.482 251.592 106.104 244.779C105.336 230.952 113.992 220.509 124.434 213.254C127.163 211.356 130.535 207.919 132.693 205.357C139.916 196.859 143.575 185.707 142.855 174.384C141.481 155.485 130.671 146.233 117.238 136.335C111.317 131.972 106.502 122.047 106.054 114.331C105.688 107.561 107.88 100.912 112.161 95.8027C117.229 89.8524 123.453 87.4873 130.902 87.0568Z",
  p34f18992: "M269.467 12.0708C269.467 7.32327 265.77 3.47462 261.211 3.47462C256.651 3.47462 252.954 7.32327 252.954 12.0708C252.954 16.8184 256.651 20.667 261.211 20.667V23.9781C254.894 23.9781 249.774 18.647 249.774 12.0708C249.774 5.49459 254.894 0.163499 261.211 0.163499C267.527 0.163499 272.647 5.49459 272.647 12.0708C272.647 18.647 267.527 23.9781 261.211 23.9781V20.667C265.77 20.667 269.467 16.8184 269.467 12.0708Z",
  p398d9880: "M297.346 229.893C337.215 225.935 368.354 192.296 368.354 151.385C368.354 103.936 324.776 66.6141 278.169 73.2886C278.093 73.2994 278.018 73.2606 277.984 73.1922C260.158 37.6834 223.411 13.314 180.972 13.314C124.437 13.314 78.0025 56.5594 72.9441 111.775C72.9357 111.867 72.8579 111.937 72.7657 111.937C40.4224 111.909 13.314 138.653 13.314 171.109C13.314 203.79 39.8068 230.283 72.4872 230.283H84.3219M146.454 235.214L184.557 273.317C188.024 276.784 193.643 276.784 197.11 273.317L235.213 235.214M190.834 261.842V155.33",
  p548b800: "M89.346 208.461L216.98 285.042",
  p79cdf00: "M167.814 30.5724V291.169M167.814 30.5724L184.811 24.1962C223.49 9.68657 266.638 9.68657 305.317 24.1962C315.583 28.0472 322.314 37.3717 322.314 47.7408V261.657C322.314 275.895 306.98 285.631 292.884 280.343C262.186 268.827 227.942 268.827 197.244 280.343L168.026 291.303C167.924 291.342 167.814 291.271 167.814 291.169M167.814 30.5724L150.817 24.1962C112.138 9.68657 68.9899 9.68657 30.3111 24.1962C20.0454 28.0472 13.314 37.3717 13.314 47.7408V261.657C13.314 275.895 28.6477 285.631 42.7439 280.343C73.4416 268.827 107.686 268.827 138.384 280.343L167.602 291.303C167.704 291.342 167.814 291.271 167.814 291.169"
};
function fc() {
  return /* @__PURE__ */ m.jsxs("svg", { width: "10", height: "13", viewBox: "0 0 284.032 355.039", fill: "currentColor", "aria-hidden": "true", children: [
    /* @__PURE__ */ m.jsx("path", { clipRule: "evenodd", d: An.p282aca00, fillRule: "evenodd" }),
    /* @__PURE__ */ m.jsx("path", { d: An.p159cbe00 }),
    /* @__PURE__ */ m.jsx("path", { d: An.p34f18992 })
  ] });
}
function Q3() {
  return /* @__PURE__ */ m.jsx("svg", { width: "14", height: "13", viewBox: "0 0 335.628 304.579", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ m.jsx("path", { d: An.p79cdf00, stroke: "currentColor", strokeWidth: "26.628" }) });
}
function q3() {
  return /* @__PURE__ */ m.jsx("svg", { width: "17", height: "13", viewBox: "0 0 381.668 289.231", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ m.jsx("path", { d: An.p398d9880, stroke: "currentColor", strokeLinecap: "round", strokeWidth: "26.628" }) });
}
function Z3() {
  return /* @__PURE__ */ m.jsx("svg", { width: "10", height: "13", viewBox: "0 0 310.66 381.668", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ m.jsx("path", { d: An.p14208d80, stroke: "currentColor", strokeLinecap: "round", strokeWidth: "26.628" }) });
}
function J3() {
  return /* @__PURE__ */ m.jsxs("svg", { width: "11", height: "13", viewBox: "0 0 314.833 365.878", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ m.jsx("circle", { cx: "259.525", cy: "55.3082", r: "42.5448", stroke: "currentColor", strokeWidth: "25.5268" }),
    /* @__PURE__ */ m.jsx("circle", { cx: "55.3082", cy: "174.428", r: "42.5448", stroke: "currentColor", strokeWidth: "25.5268" }),
    /* @__PURE__ */ m.jsx("path", { d: An.p179dbd80, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "25.5268" }),
    /* @__PURE__ */ m.jsx("path", { d: An.p548b800, stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "25.5268" }),
    /* @__PURE__ */ m.jsx("circle", { cx: "259.525", cy: "310.57", r: "42.5448", stroke: "currentColor", strokeWidth: "25.5268" })
  ] });
}
function eS({ size: n = 11 }) {
  return /* @__PURE__ */ m.jsxs(
    "svg",
    {
      width: n,
      height: n,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ m.jsx("circle", { cx: "12", cy: "12", r: "3" }),
        /* @__PURE__ */ m.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
      ]
    }
  );
}
const dc = 2147483e3, ce = "#f8d832", Vs = "https://dislexfy.com", hc = `${Vs}/#planos`, tS = `${Vs}/suporte.html`, xt = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", bp = "ui-monospace, SFMono-Regular, Menlo, monospace", Qe = {
  glass: "#000000",
  // preto absoluto, opaco (era rgba glassy)
  border: "rgba(255,255,255,0.14)",
  // anel fino, um pouco mais visível sobre o preto
  divider: "rgba(255,255,255,0.14)",
  glow: "rgba(248,216,50,0.45)",
  // border-primary/40
  hoverBg: "rgba(255,255,255,0.10)",
  // ghost hover
  hoverShadow: "0 6px 18px rgba(248,216,50,0.22)",
  shadow: "0 10px 28px rgba(0,0,0,0.45)",
  icon: "#ffffff",
  // text-foreground (dark)
  lockBg: "#000000",
  // fundo do selo de cadeado (encosta no preto do dock)
  tooltipBg: "rgba(0,0,0,0.95)"
}, Mi = [
  // Só as pt-BR que o Edge-TTS oferece hoje. Donato e Yara foram
  // descontinuadas pela Microsoft (davam erro "No audio received").
  { value: "pt-BR-AntonioNeural", label: "Antônio (masculina)" },
  { value: "pt-BR-FranciscaNeural", label: "Francisca (feminina)" },
  { value: "pt-BR-ThalitaNeural", label: "Thalita (feminina)" }
], Op = [
  { value: "yellow", color: "#f8d832" },
  { value: "blue", color: "#9cc4f7" },
  { value: "pink", color: "#f7a8d0" }
], Bp = [
  { value: "page", label: "Aa", family: "inherit" },
  { value: "atkinson", label: "Aa", family: "'Atkinson Hyperlegible', sans-serif" },
  { value: "opendyslexic", label: "Aa", family: "'OpenDyslexic', sans-serif" },
  { value: "lexend", label: "Aa", family: "'Lexend', sans-serif" }
], $p = 24, nS = { type: "spring", stiffness: 300, damping: 20 };
function Ai({ children: n }) {
  return /* @__PURE__ */ m.jsx("span", { className: "flex items-center justify-center", style: { transform: "scale(1.05)" }, children: n });
}
function Wp(n) {
  return `${Number(n.toFixed(2))}x`;
}
function rS({ label: n, side: r }) {
  const o = r === "top" ? { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 7 } : { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: 7 };
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      className: "absolute pointer-events-none whitespace-nowrap",
      style: {
        ...o,
        background: Qe.tooltipBg,
        color: "#fff",
        fontFamily: xt,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 7,
        boxShadow: `inset 0 0 0 1px ${Qe.border}, 0 4px 16px rgba(0,0,0,0.4)`,
        zIndex: 6
      },
      initial: { opacity: 0, scale: 0.92 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.92 },
      transition: { duration: 0.12 },
      children: n
    }
  );
}
function iS({
  item: n,
  vertical: r,
  hovered: o,
  onHover: a,
  showTip: u
}) {
  const d = n.active ? ce : n.locked || n.soon ? "rgba(255,255,255,0.5)" : Qe.icon, f = n.soon ? `${n.label} (em breve)` : n.locked ? `${n.label} (Pro)` : n.label;
  return /* @__PURE__ */ m.jsxs("div", { className: "relative flex items-center justify-center", onMouseEnter: () => a(!0), onMouseLeave: () => a(!1), children: [
    /* @__PURE__ */ m.jsxs(
      me.div,
      {
        className: "flex flex-col items-center",
        animate: { scale: o ? 1.18 : 1, rotate: o ? -5 : 0 },
        transition: nS,
        style: { transformOrigin: r ? "left center" : "bottom center" },
        children: [
          /* @__PURE__ */ m.jsxs(
            me.button,
            {
              type: "button",
              className: "relative flex items-center justify-center cursor-pointer outline-none rounded-[9px]",
              style: {
                width: $p,
                height: $p,
                color: d,
                background: o ? Qe.hoverBg : "transparent",
                boxShadow: o ? Qe.hoverShadow : "none",
                transition: "color 0.15s, background 0.15s, box-shadow 0.15s"
              },
              "aria-label": f,
              title: n.soon ? `${n.label} — em breve` : n.locked ? `${n.label} — recurso Pro` : n.label,
              "aria-pressed": n.active,
              whileTap: { scale: 0.92 },
              onMouseDown: (h) => h.preventDefault(),
              onFocus: () => a(!0),
              onBlur: () => a(!1),
              onClick: n.onClick,
              children: [
                n.icon,
                n.locked && !n.soon && /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    className: "absolute flex items-center justify-center",
                    style: {
                      right: -3,
                      bottom: -3,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: Qe.lockBg,
                      boxShadow: `inset 0 0 0 1px ${Qe.border}`,
                      color: ce
                    },
                    children: /* @__PURE__ */ m.jsx(A3, { size: 7, strokeWidth: 2.6 })
                  }
                ),
                n.beta && /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    className: "absolute flex items-center justify-center",
                    style: {
                      right: -3,
                      bottom: -3,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: Qe.lockBg,
                      boxShadow: `inset 0 0 0 1px ${Qe.border}`,
                      color: ce,
                      fontFamily: xt,
                      fontSize: 8,
                      fontWeight: 700,
                      lineHeight: 1
                    },
                    "aria-hidden": "true",
                    children: "β"
                  }
                ),
                n.soon && /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    className: "absolute flex items-center justify-center",
                    style: {
                      right: -3,
                      bottom: -3,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: Qe.lockBg,
                      boxShadow: `inset 0 0 0 1px ${Qe.border}`,
                      color: ce
                    },
                    children: /* @__PURE__ */ m.jsx(h3, { size: 7, strokeWidth: 2.6 })
                  }
                ),
                o && /* @__PURE__ */ m.jsx(
                  me.span,
                  {
                    layoutId: "dock-glow",
                    className: "absolute inset-0 rounded-[9px]",
                    style: { border: `1px solid ${Qe.glow}` },
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { type: "spring", stiffness: 380, damping: 30 }
                  }
                )
              ]
            }
          ),
          (n.active || n.hint) && /* @__PURE__ */ m.jsx(
            me.span,
            {
              style: {
                width: 4,
                height: 4,
                borderRadius: 999,
                background: ce,
                marginTop: 2,
                opacity: n.active ? 1 : 0.55
                // dica é mais discreta que "aberto"
              },
              initial: { opacity: 0, scale: 0 },
              animate: { opacity: n.active ? 1 : 0.55, scale: 1 }
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ m.jsx(Et, { children: o && u && /* @__PURE__ */ m.jsx(
      rS,
      {
        label: n.soon ? `${n.label} — em breve` : n.locked ? `${n.label} — Pro` : n.hint ? `${n.label} — entrar` : n.label,
        side: r ? "left" : "top"
      }
    ) })
  ] });
}
function Ar({
  label: n,
  onClick: r,
  children: o,
  wide: a
}) {
  return /* @__PURE__ */ m.jsx(
    me.button,
    {
      type: "button",
      className: "relative flex items-center justify-center cursor-pointer outline-none rounded-[8px]",
      style: {
        minWidth: a ? 26 : 22,
        height: 22,
        padding: a ? "0 5px" : 0,
        color: "rgba(255,255,255,0.62)"
      },
      whileHover: { scale: 1.12, color: "#ffffff" },
      whileTap: { scale: 0.9 },
      "aria-label": n,
      title: n,
      onMouseDown: (u) => u.preventDefault(),
      onClick: r,
      children: o
    }
  );
}
function oS({ props: n, vertical: r }) {
  const o = /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
    /* @__PURE__ */ m.jsx(Ar, { label: n.isPlaying ? "Pausar" : "Retomar", onClick: n.onPlayPause, children: /* @__PURE__ */ m.jsx(
      "span",
      {
        className: "flex items-center justify-center",
        style: { width: 22, height: 22, borderRadius: 999, background: ce, color: "#000" },
        children: n.isPlaying ? /* @__PURE__ */ m.jsx($0, { size: 11, fill: "#000" }) : /* @__PURE__ */ m.jsx(cc, { size: 11, fill: "#000", style: { marginLeft: 1 } })
      }
    ) }),
    /* @__PURE__ */ m.jsx(Ar, { label: "Voltar 10s", onClick: () => n.onSeek(-10), children: /* @__PURE__ */ m.jsx($3, { size: 13 }) }),
    /* @__PURE__ */ m.jsx(Ar, { label: "Avançar 10s", onClick: () => n.onSeek(10), children: /* @__PURE__ */ m.jsx(U3, { size: 13 }) }),
    /* @__PURE__ */ m.jsx(Ar, { label: `Velocidade ${Wp(n.speed)}`, onClick: n.onCycleSpeed, wide: !0, children: /* @__PURE__ */ m.jsx("span", { style: { fontFamily: bp, fontSize: 9, fontWeight: 600, color: ce }, children: Wp(n.speed) }) }),
    /* @__PURE__ */ m.jsx(Ar, { label: `Voz: ${n.voiceLabel}`, onClick: n.onCycleVoice, children: /* @__PURE__ */ m.jsx(s3, { size: 13 }) }),
    /* @__PURE__ */ m.jsx(Ar, { label: "Baixar áudio (MP3)", onClick: n.onDownload, children: /* @__PURE__ */ m.jsx(v3, { size: 12 }) })
  ] });
  return /* @__PURE__ */ m.jsxs("div", { className: r ? "flex flex-col items-center" : "flex items-center", style: { gap: 2 }, children: [
    /* @__PURE__ */ m.jsx(
      "span",
      {
        style: {
          fontFamily: bp,
          fontSize: 9,
          fontWeight: 600,
          color: n.ended ? "rgba(255,255,255,0.5)" : ce,
          letterSpacing: "0.03em",
          minWidth: r ? void 0 : 26,
          textAlign: "center",
          padding: r ? "1px 0 2px" : "0 2px"
        },
        children: n.time
      }
    ),
    /* @__PURE__ */ m.jsx(
      "div",
      {
        style: r ? { width: 18, height: 2.5, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden", margin: "0 0 2px" } : { width: 3, alignSelf: "stretch", height: 16, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden", margin: "0 2px" },
        children: n.streaming && /* @__PURE__ */ m.jsx(
          me.div,
          {
            style: r ? { height: "100%", width: "45%", background: ce, borderRadius: 999 } : { width: "100%", height: "45%", background: ce, borderRadius: 999 },
            animate: r ? { x: ["-100%", "230%"] } : { y: ["-100%", "230%"] },
            transition: { duration: 1.4, repeat: 1 / 0, ease: "easeInOut" }
          }
        )
      }
    ),
    o
  ] });
}
function sS(n) {
  const r = n.orientation === "vertical", [o, a] = M.useState(null), u = !n.isPro, d = !n.isPro, f = [
    {
      // O NOME acessível do botão é a marca e fica estável — "entrar" é estado,
      // não identidade, e vai só no tooltip (ver DockIcon). Nome de botão que
      // muda conforme o login faz leitor de tela anunciar outro botão.
      key: "brand",
      label: "Dislexfy",
      icon: /* @__PURE__ */ m.jsx(Ai, { children: /* @__PURE__ */ m.jsx(fc, {}) }),
      onClick: n.onBrand,
      active: n.menu === "brand",
      beta: !0,
      hint: n.brandHint
    },
    {
      key: "saved",
      label: "Trechos salvos",
      icon: /* @__PURE__ */ m.jsx(Ai, { children: /* @__PURE__ */ m.jsx(q3, {}) }),
      onClick: u ? n.onProLocked : n.onSaved,
      active: n.menu === "saved",
      locked: u
    },
    {
      key: "book",
      label: "Modo Leitura",
      icon: /* @__PURE__ */ m.jsx(Ai, { children: /* @__PURE__ */ m.jsx(Q3, {}) }),
      onClick: d ? n.onProLocked : n.onBook,
      active: !1,
      locked: d
    },
    {
      key: "ditado",
      label: "Ditado por voz",
      icon: /* @__PURE__ */ m.jsx(Ai, { children: /* @__PURE__ */ m.jsx(Z3, {}) }),
      onClick: n.onDitado,
      active: !1,
      soon: !0
    }
  ], h = [
    { key: "share", label: "Compartilhar", icon: /* @__PURE__ */ m.jsx(Ai, { children: /* @__PURE__ */ m.jsx(J3, {}) }), onClick: n.onShare, active: n.menu === "share" },
    { key: "settings", label: "Configurações", icon: /* @__PURE__ */ m.jsx(eS, { size: 15 }), onClick: n.onSettings, active: n.menu === "settings" },
    { key: "close", label: "Fechar Dislexfy", icon: /* @__PURE__ */ m.jsx(rr, { size: 14, strokeWidth: 2.3 }), onClick: n.onClose, active: !1 }
  ], g = (y) => /* @__PURE__ */ m.jsx(
    iS,
    {
      item: y,
      vertical: r,
      hovered: o === y.key,
      onHover: (x) => a(x ? y.key : (S) => S === y.key ? null : S),
      showTip: !n.tooltipsOff
    },
    y.key
  ), v = /* @__PURE__ */ m.jsx(
    "span",
    {
      "aria-hidden": "true",
      style: r ? { height: 1, width: 14, background: Qe.divider, margin: "1px 0" } : { width: 1, height: 14, background: Qe.divider, margin: "0 1px" }
    }
  );
  return /* @__PURE__ */ m.jsx("div", { style: { transform: r ? "none" : "perspective(600px) rotateX(10deg)", transformStyle: "preserve-3d" }, children: /* @__PURE__ */ m.jsxs(
    me.div,
    {
      "data-zx-dock": n.orientation,
      className: r ? "flex flex-col items-center" : "flex items-end",
      style: {
        gap: 3,
        padding: r ? "7px 4px" : "4px 7px",
        borderRadius: 15,
        background: Qe.glass,
        boxShadow: `inset 0 0 0 1px ${Qe.border}, ${Qe.shadow}`
      },
      animate: { y: r ? 0 : [0, -2, 0], x: r ? [0, -2, 0] : 0 },
      transition: { duration: 8, repeat: 1 / 0, ease: "easeInOut" },
      onMouseLeave: () => a(null),
      children: [
        /* @__PURE__ */ m.jsx(Et, { initial: !1, children: n.reading && /* @__PURE__ */ m.jsxs(
          me.div,
          {
            className: r ? "flex flex-col items-center" : "flex items-center",
            style: { gap: 3, overflow: "hidden" },
            initial: { opacity: 0, height: r ? 0 : void 0, width: r ? void 0 : 0 },
            animate: { opacity: 1, height: r ? "auto" : void 0, width: r ? void 0 : "auto" },
            exit: { opacity: 0, height: r ? 0 : void 0, width: r ? void 0 : 0 },
            transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
            children: [
              /* @__PURE__ */ m.jsx(oS, { props: n, vertical: r }),
              v
            ]
          },
          "player"
        ) }),
        f.map(g),
        v,
        h.map(g)
      ]
    }
  ) });
}
const W0 = M.createContext(null);
function U0() {
  const n = M.useContext(W0);
  if (!n) throw new Error("useCore fora do CoreContext.Provider");
  return n;
}
function un() {
  const n = U0();
  return M.useSyncExternalStore(n.subscribe, n.getState);
}
function Nn() {
  return U0().actions;
}
const cs = 28, Up = 9, nu = 6, aS = 6;
function Hp() {
  const n = un(), r = Nn(), o = n.open && n.hover != null;
  return /* @__PURE__ */ m.jsx(Et, { children: o && n.hover && // O wrapper é o motion component: AnimatePresence só anima a SAÍDA do
  // filho direto, então initial/animate/exit têm que morar aqui.
  /* @__PURE__ */ m.jsx(
    me.div,
    {
      style: {
        position: "fixed",
        left: n.hover.left - nu,
        top: n.hover.top - Up,
        width: cs + nu + aS,
        height: cs + Up * 2,
        zIndex: 2147483e3,
        display: "flex",
        alignItems: "center",
        paddingLeft: nu
      },
      initial: { opacity: 0, scale: 0.6 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.6 },
      transition: { type: "spring", stiffness: 500, damping: 30 },
      onMouseEnter: () => r.keepHover(),
      onMouseLeave: () => r.releaseHover(),
      children: /* @__PURE__ */ m.jsx(
        me.button,
        {
          type: "button",
          className: "flex items-center justify-center cursor-pointer outline-none",
          style: {
            width: cs,
            height: cs,
            borderRadius: 999,
            background: "#000",
            color: ce,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), 0 4px 14px rgba(0,0,0,0.35)",
            flexShrink: 0
          },
          whileHover: { scale: 1.14, boxShadow: `inset 0 0 0 1px ${ce}, 0 6px 18px rgba(248,216,50,0.3)` },
          whileTap: { scale: 0.94 },
          transition: { type: "spring", stiffness: 500, damping: 30 },
          "aria-label": n.hoverMode === "pause" ? "Pausar a leitura" : n.hoverMode === "loading" ? "Gerando o áudio…" : "Ler este parágrafo",
          title: n.hoverMode === "pause" ? "Pausar" : n.hoverMode === "loading" ? "Gerando o áudio…" : "Ler este parágrafo",
          onPointerDown: (a) => a.preventDefault(),
          onClick: () => r.readHover(),
          children: n.hoverMode === "loading" ? (
            // O clique JÁ funcionou — o áudio está sendo gerado. Sem este
            // spinner, o 1º segundo parecia botão quebrado.
            /* @__PURE__ */ m.jsx(
              me.span,
              {
                style: { display: "inline-flex" },
                animate: { rotate: 360 },
                transition: { duration: 0.9, repeat: 1 / 0, ease: "linear" },
                children: /* @__PURE__ */ m.jsx(B0, { size: 14 })
              }
            )
          ) : n.hoverMode === "pause" ? /* @__PURE__ */ m.jsx($0, { size: 12, fill: ce }) : /* @__PURE__ */ m.jsx(cc, { size: 13, fill: ce })
        }
      )
    }
  ) });
}
function lS({ onOpen: n }) {
  return /* @__PURE__ */ m.jsxs(
    me.button,
    {
      type: "button",
      className: "flex items-center rounded-full cursor-pointer outline-none",
      style: {
        gap: 6,
        paddingInline: 10,
        paddingBlock: 5,
        background: "#000000",
        color: "#ffffff",
        fontFamily: xt,
        boxShadow: "0 6px 20px rgba(0,0,0,0.28)"
      },
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      whileHover: { scale: 1.04 },
      whileTap: { scale: 0.97 },
      transition: { type: "spring", stiffness: 400, damping: 28 },
      "aria-label": "Mostrar Dislexfy",
      title: "Mostrar Dislexfy",
      onClick: n,
      children: [
        /* @__PURE__ */ m.jsx("span", { style: { color: ce, display: "inline-flex" }, children: /* @__PURE__ */ m.jsx(fc, {}) }),
        /* @__PURE__ */ m.jsx("span", { style: { fontSize: 10, fontWeight: 600 }, children: "Mostrar Dislexfy" })
      ]
    }
  );
}
const Ut = (n) => `rgba(23,23,23,${n})`, Ht = (n) => `rgba(255,255,255,${n})`, H0 = {
  isDark: !0,
  accent: ce,
  // Modo escuro = preto absoluto (#000) na superfície dos painéis; controles
  // internos ficam em cinzas bem escuros só pra ter affordance/contorno.
  panel: "#000000",
  panelRingLight: "#4a4a4a",
  panelRing: "#333333",
  inset: "#171717",
  insetRing: "#2e2e2e",
  insetSoft: "#0d0d0d",
  previewRing: "#242424",
  card: "#0b0b0b",
  cardRing: "#242424",
  badge: "#171717",
  countBadge: "#0b0b0b",
  countBadgeText: "#ffffff",
  delBtn: "#1f1f1f",
  headerTitle: "#141414",
  divider: "#1c1c1c",
  hover: "#141414",
  switchOff: "#333333",
  switchKnobOff: "#777777",
  segInactive: "#3a3a3a",
  white: "#ffffff",
  w85: Ht(0.85),
  w65: Ht(0.65),
  w50: Ht(0.5),
  w40: Ht(0.4),
  w35: Ht(0.35),
  w26: Ht(0.26),
  w22: Ht(0.22),
  w16: Ht(0.16),
  w13: Ht(0.13),
  w12: Ht(0.12),
  toastBg: "rgba(0,0,0,0.97)",
  pill: "#000000",
  pillRing: "#6c6c6c"
}, uS = {
  isDark: !1,
  accent: ce,
  panel: "#fffef9",
  panelRingLight: "#e3dfd4",
  panelRing: "#e3dfd4",
  inset: "#f1efe8",
  insetRing: "#d9d6cc",
  insetSoft: "#f5f3ec",
  previewRing: "#e3dfd4",
  card: "#ffffff",
  cardRing: "#e6e3d9",
  badge: "#efece3",
  countBadge: "#1a1a1a",
  countBadgeText: "#ffffff",
  delBtn: "#e6e3d9",
  headerTitle: "#3a382f",
  divider: "#e8e5dc",
  hover: "#efece4",
  switchOff: "#c9c6bd",
  switchKnobOff: "#ffffff",
  segInactive: "#d9d6cc",
  white: "#1b1a17",
  w85: Ut(0.85),
  w65: Ut(0.62),
  w50: Ut(0.5),
  w40: Ut(0.42),
  w35: Ut(0.38),
  w26: Ut(0.3),
  w22: Ut(0.26),
  w16: Ut(0.2),
  w13: Ut(0.16),
  w12: Ut(0.12),
  toastBg: "rgba(255,254,249,0.98)",
  pill: "#000000",
  pillRing: "#6c6c6c"
}, K0 = M.createContext(H0);
function pt() {
  return M.useContext(K0);
}
function cS(n) {
  return n ? H0 : uS;
}
function fS() {
  const n = un(), r = pt();
  return /* @__PURE__ */ m.jsx("div", { role: "status", "aria-live": "polite", style: { position: "relative" }, children: /* @__PURE__ */ m.jsx(Et, { children: n.status && /* @__PURE__ */ m.jsx(
    me.div,
    {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 6 },
      transition: { duration: 0.18 },
      style: {
        maxWidth: 260,
        background: r.toastBg,
        color: r.white,
        fontSize: 11.5,
        lineHeight: 1.35,
        padding: "7px 11px",
        borderRadius: 9,
        boxShadow: `inset 0 0 0 1px ${r.panelRing}, 0 8px 24px rgba(0,0,0,0.2)`
      },
      children: n.status
    }
  ) }) });
}
const dS = 250, Kp = 220, hS = 186;
function Fi(n) {
  try {
    window.open(n, "_blank", "noopener,noreferrer");
  } catch {
  }
}
const G0 = M.createContext({});
function pc() {
  return M.useContext(G0);
}
function pS({ on: n, onChange: r, label: o }) {
  const a = pt();
  return /* @__PURE__ */ m.jsxs(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": n,
      "aria-label": o,
      className: "relative cursor-pointer outline-none flex-shrink-0",
      style: { width: 32, height: 18, borderRadius: 999 },
      onClick: () => r(!n),
      children: [
        /* @__PURE__ */ m.jsx(
          me.span,
          {
            className: "absolute inset-0",
            style: { borderRadius: 999 },
            animate: { backgroundColor: n ? ce : a.switchOff },
            transition: { duration: 0.18 }
          }
        ),
        /* @__PURE__ */ m.jsx(
          me.span,
          {
            className: "absolute",
            style: { top: 2.5, width: 13, height: 13, borderRadius: 999, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" },
            animate: { left: n ? 16.5 : 2.5, backgroundColor: n ? "#000" : a.switchKnobOff },
            transition: { type: "spring", stiffness: 540, damping: 32 }
          }
        )
      ]
    }
  );
}
function Xn({
  label: n,
  on: r,
  onChange: o,
  icon: a
}) {
  const u = pt();
  return /* @__PURE__ */ m.jsxs("div", { className: "flex items-center justify-between", style: { padding: "6px 0" }, children: [
    /* @__PURE__ */ m.jsxs("span", { className: "flex items-center", style: { gap: 7, color: u.w85, fontSize: 11 }, children: [
      a && /* @__PURE__ */ m.jsx("span", { "aria-hidden": "true", className: "flex items-center", style: { color: u.w50 }, children: a }),
      n
    ] }),
    /* @__PURE__ */ m.jsx(pS, { on: r, onChange: o, label: n })
  ] });
}
function fs() {
  const n = pt();
  return /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: n.divider, margin: "2px 0" } });
}
function Gp({ icon: n, title: r, open: o, onClick: a }) {
  const u = pt(), [d, f] = M.useState(!1);
  return /* @__PURE__ */ m.jsxs(
    "button",
    {
      type: "button",
      className: "w-full flex items-center justify-between cursor-pointer outline-none",
      style: { padding: "10px 12px", background: d ? u.hover : "transparent" },
      "aria-expanded": o,
      onMouseEnter: () => f(!0),
      onMouseLeave: () => f(!1),
      onClick: a,
      children: [
        /* @__PURE__ */ m.jsxs("span", { className: "flex items-center", style: { gap: 8 }, children: [
          /* @__PURE__ */ m.jsx("span", { "aria-hidden": "true", className: "flex items-center", style: { color: u.w50 }, children: n }),
          /* @__PURE__ */ m.jsx("span", { style: { color: u.white, fontSize: 12, fontWeight: 600 }, children: r })
        ] }),
        /* @__PURE__ */ m.jsx(me.span, { animate: { rotate: o ? 0 : -90 }, transition: { duration: 0.18 }, style: { display: "inline-flex", color: u.w50 }, children: /* @__PURE__ */ m.jsx(f3, { size: 12 }) })
      ]
    }
  );
}
function Yp({ open: n, children: r }) {
  return /* @__PURE__ */ m.jsx(Et, { initial: !1, children: n && /* @__PURE__ */ m.jsx(
    me.div,
    {
      initial: { height: 0, opacity: 0 },
      animate: { height: "auto", opacity: 1 },
      exit: { height: 0, opacity: 0 },
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      style: { overflow: "hidden" },
      children: /* @__PURE__ */ m.jsx("div", { style: { padding: "2px 12px 10px" }, children: r })
    }
  ) });
}
function ds({ children: n }) {
  const r = pt();
  return /* @__PURE__ */ m.jsx("div", { style: { color: r.w50, fontSize: 10, marginBottom: 6, marginTop: 4 }, children: n });
}
function mS({ onClose: n }) {
  const r = un(), o = Nn(), a = pt(), u = r.prefs, [d, f] = M.useState(null), h = (y) => f((x) => x === y ? null : y), { version: g } = pc(), v = Op.find((y) => y.value === u.hlColor)?.color || ce;
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      style: { width: dS, fontFamily: xt },
      initial: { opacity: 0, y: 12, scale: 0.94 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 12, scale: 0.94 },
      transition: { type: "spring", stiffness: 460, damping: 30 },
      onPointerDown: (y) => y.stopPropagation(),
      children: /* @__PURE__ */ m.jsxs(
        "div",
        {
          className: "rounded-[15px] overflow-hidden",
          style: {
            background: a.panel,
            boxShadow: `inset 0 0 0 1.5px ${a.panelRing}, 0 16px 48px rgba(0,0,0,0.55)`,
            maxHeight: "calc(100vh - 24px)",
            display: "flex",
            flexDirection: "column"
          },
          children: [
            /* @__PURE__ */ m.jsxs("div", { className: "flex items-center justify-between flex-shrink-0", style: { padding: "11px 12px" }, children: [
              /* @__PURE__ */ m.jsx("span", { style: { color: a.white, fontSize: 13, fontWeight: 700 }, children: "Configurações" }),
              /* @__PURE__ */ m.jsx("button", { type: "button", className: "cursor-pointer outline-none flex items-center", style: { color: a.w35 }, "aria-label": "Fechar", onClick: n, children: /* @__PURE__ */ m.jsx(rr, { size: 11 }) })
            ] }),
            /* @__PURE__ */ m.jsxs("div", { style: { overflowY: "auto" }, children: [
              /* @__PURE__ */ m.jsx("div", { style: { padding: "0 12px 8px" }, children: /* @__PURE__ */ m.jsx(
                "div",
                {
                  className: "rounded-[9px]",
                  style: { background: a.insetSoft, boxShadow: `inset 0 0 0 1px ${a.previewRing}`, padding: "10px 12px", textAlign: "center" },
                  children: /* @__PURE__ */ m.jsxs(
                    "span",
                    {
                      style: {
                        fontFamily: Bp.find((y) => y.value === u.readFont)?.family || "inherit",
                        letterSpacing: u.readSpacing ? "0.06em" : void 0,
                        wordSpacing: u.readSpacing ? "0.14em" : void 0,
                        fontSize: 13,
                        color: u.highlight ? a.white : a.w50
                      },
                      children: [
                        "O leão",
                        " ",
                        /* @__PURE__ */ m.jsx(
                          "mark",
                          {
                            style: u.hlStyle === "background" ? { background: u.highlight ? v : "transparent", color: u.highlight ? "#000" : a.w50, borderRadius: 3, padding: "0 2px" } : { background: "transparent", color: u.highlight ? a.white : a.w50, borderBottom: u.highlight ? `2px solid ${v}` : "none" },
                            children: "dorme"
                          }
                        ),
                        " ",
                        "à tarde."
                      ]
                    }
                  )
                }
              ) }),
              /* @__PURE__ */ m.jsx(fs, {}),
              /* @__PURE__ */ m.jsx(Gp, { icon: /* @__PURE__ */ m.jsx(S3, { size: 12 }), title: "Destaque", open: d === "destaque", onClick: () => h("destaque") }),
              /* @__PURE__ */ m.jsxs(Yp, { open: d === "destaque", children: [
                /* @__PURE__ */ m.jsx(Xn, { label: "Destacar palavras", on: u.highlight, onChange: o.setHighlight }),
                /* @__PURE__ */ m.jsxs("div", { style: { opacity: u.highlight ? 1 : 0.4, pointerEvents: u.highlight ? "auto" : "none" }, children: [
                  /* @__PURE__ */ m.jsx(ds, { children: "Cor do destaque" }),
                  /* @__PURE__ */ m.jsx("div", { className: "flex items-center", style: { gap: 10 }, role: "radiogroup", "aria-label": "Cor do destaque", children: Op.map((y) => {
                    const x = u.hlColor === y.value;
                    return /* @__PURE__ */ m.jsx(
                      "button",
                      {
                        type: "button",
                        role: "radio",
                        "aria-checked": x,
                        "aria-label": y.value,
                        className: "cursor-pointer outline-none",
                        style: { width: 24, height: 24, borderRadius: 999, background: y.color, boxShadow: x ? "0 0 0 2px #0d0d0d, 0 0 0 3.5px #fff" : "none" },
                        onClick: () => o.setHlColor(y.value)
                      },
                      y.value
                    );
                  }) }),
                  /* @__PURE__ */ m.jsx(ds, { children: "Estilo do destaque" }),
                  /* @__PURE__ */ m.jsx("div", { className: "flex", style: { gap: 6 }, role: "radiogroup", "aria-label": "Estilo do destaque", children: ["background", "underline"].map((y) => {
                    const x = u.hlStyle === y;
                    return /* @__PURE__ */ m.jsx(
                      "button",
                      {
                        type: "button",
                        role: "radio",
                        "aria-checked": x,
                        className: "flex-1 cursor-pointer outline-none",
                        style: {
                          padding: "6px 0",
                          borderRadius: 8,
                          background: a.inset,
                          border: `1px solid ${x ? ce : a.insetRing}`,
                          color: x ? ce : a.w65,
                          fontSize: 12
                        },
                        onClick: () => o.setHlStyle(y),
                        children: /* @__PURE__ */ m.jsx("span", { style: y === "underline" ? { borderBottom: `2px solid ${x ? ce : a.w65}` } : { background: x ? ce : a.segInactive, color: x ? "#000" : a.w65, borderRadius: 3, padding: "0 3px" }, children: "ab" })
                      },
                      y
                    );
                  }) }),
                  /* @__PURE__ */ m.jsx("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ m.jsx(Xn, { label: "Rastro do que já foi lido", on: u.hlTrail, onChange: o.setHlTrail }) })
                ] }),
                /* @__PURE__ */ m.jsx(Xn, { label: "Foco no parágrafo", on: u.focusMode, onChange: o.setFocusMode }),
                /* @__PURE__ */ m.jsx(Xn, { label: "Rolagem automática", on: u.autoScroll, onChange: o.setAutoScroll })
              ] }),
              /* @__PURE__ */ m.jsx(fs, {}),
              /* @__PURE__ */ m.jsx(Gp, { icon: /* @__PURE__ */ m.jsx(Y3, { size: 12 }), title: "Texto", open: d === "texto", onClick: () => h("texto") }),
              /* @__PURE__ */ m.jsxs(Yp, { open: d === "texto", children: [
                /* @__PURE__ */ m.jsx(ds, { children: "Fonte do trecho lido" }),
                /* @__PURE__ */ m.jsx("div", { className: "flex", style: { gap: 6 }, role: "radiogroup", "aria-label": "Fonte do trecho lido", children: Bp.map((y) => {
                  const x = u.readFont === y.value;
                  return /* @__PURE__ */ m.jsx(
                    "button",
                    {
                      type: "button",
                      role: "radio",
                      "aria-checked": x,
                      "aria-label": y.value,
                      className: "flex-1 cursor-pointer outline-none",
                      style: {
                        padding: "8px 0",
                        borderRadius: 8,
                        background: a.inset,
                        border: `1px solid ${x ? ce : a.insetRing}`,
                        color: x ? ce : a.w65,
                        fontFamily: y.family,
                        fontSize: 13
                      },
                      onClick: () => o.setReadFont(y.value),
                      children: y.label
                    },
                    y.value
                  );
                }) }),
                /* @__PURE__ */ m.jsx("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ m.jsx(Xn, { label: "Espaçamento confortável", on: u.readSpacing, onChange: o.setReadSpacing }) })
              ] }),
              /* @__PURE__ */ m.jsx(fs, {}),
              /* @__PURE__ */ m.jsxs("div", { style: { padding: "4px 12px" }, children: [
                /* @__PURE__ */ m.jsx(
                  Xn,
                  {
                    icon: /* @__PURE__ */ m.jsx(j3, { size: 12 }),
                    label: "Leitura contínua",
                    on: u.autoplay,
                    onChange: o.setAutoplay
                  }
                ),
                /* @__PURE__ */ m.jsx("div", { style: { color: a.w40, fontSize: 9.5, lineHeight: 1.4, margin: "-2px 0 4px 19px" }, children: "Ao terminar um parágrafo, começa o próximo sozinho." }),
                /* @__PURE__ */ m.jsx(Xn, { icon: /* @__PURE__ */ m.jsx(F3, { size: 12 }), label: "Modo escuro", on: u.dark, onChange: o.setDark })
              ] }),
              /* @__PURE__ */ m.jsx(fs, {}),
              /* @__PURE__ */ m.jsxs("div", { style: { padding: "8px 12px" }, children: [
                /* @__PURE__ */ m.jsx(ds, { children: "Interface" }),
                /* @__PURE__ */ m.jsx("div", { className: "flex", style: { gap: 6 }, role: "radiogroup", "aria-label": "Orientação", children: ["horizontal", "vertical"].map((y) => {
                  const x = u.orientation === y;
                  return /* @__PURE__ */ m.jsxs(
                    "button",
                    {
                      type: "button",
                      role: "radio",
                      "aria-checked": x,
                      className: "flex-1 flex items-center justify-center cursor-pointer outline-none",
                      style: { gap: 6, padding: "7px 0", borderRadius: 8, background: a.inset, border: `1px solid ${x ? ce : a.insetRing}`, color: x ? ce : a.w65, fontSize: 11 },
                      onClick: () => o.setOrientation(y),
                      children: [
                        /* @__PURE__ */ m.jsx(
                          "span",
                          {
                            "aria-hidden": "true",
                            style: {
                              display: "inline-block",
                              width: y === "horizontal" ? 14 : 10,
                              height: y === "horizontal" ? 9 : 14,
                              borderRadius: 3,
                              border: `1.5px solid ${x ? ce : a.w65}`
                            }
                          }
                        ),
                        y === "horizontal" ? "Horizontal" : "Vertical"
                      ]
                    },
                    y
                  );
                }) })
              ] }),
              /* @__PURE__ */ m.jsxs("div", { style: { padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }, children: [
                /* @__PURE__ */ m.jsxs(
                  "button",
                  {
                    type: "button",
                    className: "w-full flex items-center justify-center cursor-pointer outline-none",
                    style: { gap: 6, padding: "8px 0", borderRadius: 8, background: a.inset, border: `1px solid ${a.insetRing}`, color: a.w85, fontSize: 11, fontWeight: 600 },
                    onClick: () => o.openOptions(),
                    children: [
                      /* @__PURE__ */ m.jsx(K3, { size: 12 }),
                      " Todas as configurações"
                    ]
                  }
                ),
                /* @__PURE__ */ m.jsxs(
                  "button",
                  {
                    type: "button",
                    className: "w-full flex items-center justify-center cursor-pointer outline-none",
                    style: { gap: 6, padding: "8px 0", borderRadius: 8, background: "transparent", color: a.w50, fontSize: 11, fontWeight: 600 },
                    onClick: () => Fi(tS),
                    children: [
                      /* @__PURE__ */ m.jsx(C3, { size: 12 }),
                      " Fale com a equipe"
                    ]
                  }
                ),
                /* @__PURE__ */ m.jsxs("div", { style: { textAlign: "center", color: a.w35, fontSize: 9.5, letterSpacing: "0.02em", marginTop: 2 }, children: [
                  g ? `v${g} · ` : "",
                  "beta"
                ] })
              ] })
            ] })
          ]
        }
      )
    }
  );
}
const Du = [0, 7, 13], Lu = [1, 0.965, 0.932], Vu = [0, 3.6, 7];
function Y0(n) {
  try {
    return new URL(n).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function yS(n) {
  return (Y0(n.url)[0] || n.text[0] || "•").toUpperCase();
}
function gS(n) {
  return (n.title || "").trim() || n.text.split(/\s+/).slice(0, 6).join(" ");
}
function Nu({
  item: n,
  top: r,
  onPlay: o,
  onDelete: a
}) {
  const u = pt(), d = Y0(n.url), f = n.date ? new Date(n.date).toLocaleDateString("pt-BR") : "";
  return /* @__PURE__ */ m.jsxs(
    "div",
    {
      className: "rounded-[14px]",
      style: {
        padding: "11px 12px",
        background: u.card,
        border: `1px solid ${u.cardRing}`,
        boxShadow: r ? "0 10px 30px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.14)" : "none",
        height: "100%"
      },
      children: [
        /* @__PURE__ */ m.jsxs("div", { className: "flex items-center", style: { gap: 8 }, children: [
          /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "flex items-center justify-center flex-shrink-0",
              style: { width: 26, height: 26, borderRadius: 7, background: u.badge, color: ce, fontWeight: 700, fontSize: 12 },
              children: yS(n)
            }
          ),
          /* @__PURE__ */ m.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ m.jsx("div", { style: { color: u.white, fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: d || "trecho salvo" }),
            /* @__PURE__ */ m.jsx("div", { style: { color: u.w22, fontSize: 9.5 }, children: f })
          ] }),
          r && a && /* @__PURE__ */ m.jsx(
            "button",
            {
              type: "button",
              className: "flex items-center justify-center flex-shrink-0 cursor-pointer outline-none",
              style: { width: 18, height: 18, borderRadius: 999, background: u.delBtn, color: u.w50 },
              "aria-label": "Apagar trecho",
              title: "Apagar",
              onClick: a,
              children: /* @__PURE__ */ m.jsx(rr, { size: 10 })
            }
          )
        ] }),
        /* @__PURE__ */ m.jsx("div", { style: { color: u.white, fontSize: 13, fontWeight: 700, marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: gS(n) }),
        /* @__PURE__ */ m.jsx(
          "div",
          {
            style: {
              color: u.w50,
              fontSize: 11,
              marginTop: 3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            },
            children: n.text
          }
        ),
        r && /* @__PURE__ */ m.jsxs("div", { className: "flex items-center justify-between", style: { marginTop: 9 }, children: [
          /* @__PURE__ */ m.jsx("span", { style: { color: u.w16, fontSize: 9.5 }, children: "← Arraste →" }),
          o && /* @__PURE__ */ m.jsx(
            "button",
            {
              type: "button",
              className: "flex items-center justify-center cursor-pointer outline-none",
              style: { width: 24, height: 24, borderRadius: 999, background: ce, color: "#000" },
              "aria-label": "Ouvir trecho",
              title: "Ouvir",
              onClick: o,
              children: /* @__PURE__ */ m.jsx(cc, { size: 11, fill: "#000" })
            }
          )
        ] })
      ]
    }
  );
}
function vS({
  item: n,
  dir: r,
  onDismiss: o,
  onPlay: a,
  onDelete: u
}) {
  const d = I0(0), f = b0(d, [-180, 0, 180], [-10, 0, 10]);
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      className: "absolute inset-x-0 top-0",
      style: { x: d, rotate: f, zIndex: 3, cursor: "grab" },
      drag: "x",
      dragElastic: 0.6,
      dragConstraints: { left: 0, right: 0 },
      initial: { x: 0, opacity: 1 },
      animate: { y: Du[0], scale: Lu[0], rotate: Vu[0], opacity: 1 },
      exit: { x: r * 480, opacity: 0, transition: { duration: 0.22, ease: [0.1, 0, 0.35, 1] } },
      transition: { type: "spring", stiffness: 460, damping: 22, mass: 0.78 },
      onDragEnd: (h, g) => {
        (Math.abs(g.offset.x) > 70 || Math.abs(g.velocity.x) > 350) && o(g.offset.x < 0 ? -1 : 1);
      },
      onPointerDown: (h) => h.stopPropagation(),
      children: /* @__PURE__ */ m.jsx(Nu, { item: n, top: !0, onPlay: a, onDelete: u })
    }
  );
}
function xS({ canSave: n, onSave: r }) {
  const o = pt();
  return /* @__PURE__ */ m.jsxs(
    "button",
    {
      type: "button",
      className: "flex items-center cursor-pointer outline-none",
      style: {
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        background: n ? ce : o.inset,
        color: n ? "#000" : o.w40,
        fontSize: 10,
        fontWeight: 600,
        cursor: n ? "pointer" : "not-allowed"
      },
      disabled: !n,
      "aria-label": "Salvar seleção atual",
      title: n ? "Salvar a seleção/leitura atual" : "Selecione um texto para salvar",
      onMouseDown: (a) => a.preventDefault(),
      onClick: r,
      children: [
        /* @__PURE__ */ m.jsx(l3, { size: 11 }),
        "Salvar"
      ]
    }
  );
}
function Xp({ count: n, canSave: r, onSave: o }) {
  const a = pt();
  return /* @__PURE__ */ m.jsxs(
    "div",
    {
      className: "flex items-center justify-between",
      style: {
        marginBottom: 8,
        padding: "5px 8px 5px 11px",
        borderRadius: 999,
        background: a.panel,
        boxShadow: `inset 0 0 0 1px ${a.panelRing}, 0 4px 14px rgba(0,0,0,0.18)`
      },
      children: [
        /* @__PURE__ */ m.jsxs("div", { className: "flex items-center", style: { gap: 8 }, children: [
          /* @__PURE__ */ m.jsx("span", { style: { color: a.white, fontSize: 11, fontWeight: 600 }, children: "Trechos salvos" }),
          n != null && /* @__PURE__ */ m.jsxs("span", { style: { background: a.countBadge, color: a.countBadgeText, fontSize: 9.5, padding: "1px 7px", borderRadius: 999 }, children: [
            n,
            "/30"
          ] })
        ] }),
        /* @__PURE__ */ m.jsx(xS, { canSave: r, onSave: o })
      ]
    }
  );
}
function wS() {
  const n = un(), r = Nn(), o = pt(), a = n.history, u = a.length, [d, f] = M.useState(0), [h, g] = M.useState(1), v = n.canSave;
  if (M.useEffect(() => {
    d >= u && u > 0 && f(0);
  }, [u, d]), u === 0)
    return /* @__PURE__ */ m.jsxs(
      me.div,
      {
        style: { width: Kp, fontFamily: xt },
        initial: { opacity: 0, y: 12, scale: 0.94 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.94 },
        transition: { type: "spring", stiffness: 460, damping: 30 },
        onPointerDown: (E) => E.stopPropagation(),
        children: [
          /* @__PURE__ */ m.jsx(Xp, { canSave: v, onSave: () => r.save() }),
          /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "rounded-[14px] flex items-center justify-center text-center",
              style: { height: 96, background: o.card, border: `1px solid ${o.cardRing}`, color: o.w50, fontSize: 11.5, padding: "0 18px" },
              children: v ? "Clique em Salvar para guardar a seleção atual." : "Nada salvo. Selecione um texto e clique em Salvar."
            }
          )
        ]
      }
    );
  const y = a[d % u], x = u > 1 ? a[(d + 1) % u] : null, S = u > 2 ? a[(d + 2) % u] : null;
  function A(E) {
    g(E), f((D) => (D + 1) % u);
  }
  return /* @__PURE__ */ m.jsxs(
    me.div,
    {
      style: { width: Kp, fontFamily: xt },
      initial: { opacity: 0, y: 12, scale: 0.94 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 12, scale: 0.94 },
      transition: { type: "spring", stiffness: 460, damping: 30 },
      onPointerDown: (E) => E.stopPropagation(),
      children: [
        /* @__PURE__ */ m.jsx(Xp, { count: u, canSave: v, onSave: () => r.save() }),
        /* @__PURE__ */ m.jsxs("div", { className: "relative", style: { height: 150 }, children: [
          S && /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "absolute inset-x-0 top-0",
              style: { transform: `translateY(${Du[2]}px) scale(${Lu[2]}) rotate(${Vu[2]}deg)`, zIndex: 1, pointerEvents: "none", height: 130 },
              children: /* @__PURE__ */ m.jsx(Nu, { item: S, top: !1 })
            }
          ),
          x && /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "absolute inset-x-0 top-0",
              style: { transform: `translateY(${Du[1]}px) scale(${Lu[1]}) rotate(${Vu[1]}deg)`, zIndex: 2, pointerEvents: "none", height: 130 },
              children: /* @__PURE__ */ m.jsx(Nu, { item: x, top: !1 })
            }
          ),
          /* @__PURE__ */ m.jsx("div", { className: "absolute inset-x-0 top-0", style: { height: 130 }, children: /* @__PURE__ */ m.jsx(Et, { initial: !1, custom: h, mode: "popLayout", children: /* @__PURE__ */ m.jsx(
            vS,
            {
              item: y,
              dir: h,
              onDismiss: A,
              onPlay: () => r.readHistoryItem(d % u),
              onDelete: () => r.removeHistory(d % u)
            },
            d + "|" + y.date + "|" + y.text.slice(0, 12)
          ) }) })
        ] }),
        /* @__PURE__ */ m.jsx("div", { className: "flex items-center justify-center", style: { gap: 5, marginTop: 12 }, children: a.map((E, D) => {
          const L = D === d % u;
          return /* @__PURE__ */ m.jsx(
            me.span,
            {
              animate: { width: L ? 16 : 5, height: 5, backgroundColor: L ? o.accent : o.w35 },
              transition: { type: "spring", stiffness: 460, damping: 28 },
              style: { borderRadius: 999, display: "inline-block" }
            },
            D
          );
        }) })
      ]
    }
  );
}
function SS() {
  return /* @__PURE__ */ m.jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: [
    /* @__PURE__ */ m.jsx("path", { d: "M17.5 14.4c-.3-.15-1.7-.85-2-.94-.26-.1-.46-.15-.65.15-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.08-.15-.65-1.56-.89-2.14-.24-.56-.48-.48-.65-.49-.17-.01-.36-.01-.55-.01a1.06 1.06 0 0 0-.77.36c-.26.29-1 .98-1 2.39s1.03 2.77 1.17 2.96c.15.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.81.11.55-.08 1.7-.69 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34z" }),
    /* @__PURE__ */ m.jsx("path", { d: "M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.1.97.98-3-.2-.31A8.2 8.2 0 1 1 12 20.2z" })
  ] });
}
function kS() {
  return /* @__PURE__ */ m.jsx("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ m.jsx("path", { d: "M21.9 4.3 18.7 19c-.24 1.06-.87 1.32-1.76.82l-4.87-3.59-2.35 2.26c-.26.26-.48.48-.98.48l.35-4.96 9.02-8.15c.39-.35-.09-.55-.6-.2L6.11 12.6l-4.8-1.5c-1.04-.33-1.06-1.04.22-1.54l18.77-7.23c.87-.32 1.63.2 1.4 1.97z" }) });
}
function hs(n) {
  const r = n.replace(/\s+/g, " ").trim();
  return r.length > 120 ? r.slice(0, 118) + "…" : r;
}
function CS({ onClose: n }) {
  const r = pt(), o = un(), a = Nn(), [u, d] = M.useState(!1), [f, h] = M.useState(null), [g, v] = M.useState(null), [y, x] = M.useState(null), [S, A] = M.useState(!1), [E, D] = M.useState(!1), [L, V] = M.useState(null), N = o.shareText, z = L ?? N, b = typeof document < "u" && document.title || "Dislexfy", ee = M.useRef(N);
  ee.current = N;
  const Z = M.useRef(!1), te = M.useCallback(async () => {
    if (g) return g;
    if (Z.current) return null;
    Z.current = !0, A(!0), x(null);
    const ie = ee.current, ue = await a.createShareLink();
    return A(!1), !ue.ok || !ue.url ? (Z.current = !1, x(ue.message || "Não foi possível criar o link."), null) : (v(ue.url), D(!!ue.truncated), V(ie), ue.url);
  }, [a, g]);
  M.useEffect(() => {
    N && te();
  }, [N, te]);
  function W(ie) {
    try {
      window.open(ie, "_blank", "noopener,noreferrer");
    } catch {
    }
  }
  async function ae(ie) {
    let ue = !1;
    try {
      navigator.clipboard && window.isSecureContext && (await navigator.clipboard.writeText(ie), ue = !0);
    } catch {
    }
    if (!ue)
      try {
        const we = document.createElement("textarea");
        we.value = ie, we.style.position = "fixed", we.style.opacity = "0", document.body.appendChild(we), we.select(), ue = document.execCommand("copy"), we.remove();
      } catch {
      }
    ue && (d(!0), setTimeout(() => d(!1), 2e3));
  }
  function K(ie) {
    return () => {
      if (g) {
        ie(g);
        return;
      }
      te().then((ue) => {
        ue && ie(ue);
      });
    };
  }
  const ye = [
    {
      key: "copy",
      label: u ? "Copiado!" : "Copiar link do trecho",
      icon: u ? /* @__PURE__ */ m.jsx(uc, { size: 12 }) : /* @__PURE__ */ m.jsx(m3, { size: 12 }),
      color: u ? ce : r.white,
      onClick: K((ie) => void ae(ie))
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: /* @__PURE__ */ m.jsx(SS, {}),
      color: "#25d366",
      onClick: K((ie) => W(`https://wa.me/?text=${encodeURIComponent(hs(z) + `
` + ie)}`))
    },
    {
      key: "email",
      label: "E-mail",
      icon: /* @__PURE__ */ m.jsx(z3, { size: 12 }),
      color: "#6aa3f8",
      onClick: K(
        (ie) => W(`mailto:?subject=${encodeURIComponent(b)}&body=${encodeURIComponent(hs(z) + `

` + ie)}`)
      )
    },
    {
      key: "telegram",
      label: "Telegram",
      icon: /* @__PURE__ */ m.jsx(kS, {}),
      color: "#2aabee",
      onClick: K(
        (ie) => W(`https://t.me/share/url?url=${encodeURIComponent(ie)}&text=${encodeURIComponent(hs(z))}`)
      )
    }
  ], ge = !z;
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      style: { width: hS, fontFamily: xt },
      initial: { opacity: 0, y: 10, scale: 0.94 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 10, scale: 0.94 },
      transition: { type: "spring", stiffness: 460, damping: 30 },
      onPointerDown: (ie) => ie.stopPropagation(),
      children: /* @__PURE__ */ m.jsxs(
        "div",
        {
          className: "rounded-[13px] overflow-hidden",
          style: { background: r.panel, boxShadow: `inset 0 0 0 1.5px ${r.panelRing}, 0 8px 28px rgba(0,0,0,0.45)` },
          children: [
            /* @__PURE__ */ m.jsxs("div", { className: "flex items-center justify-between", style: { padding: "8px 12px" }, children: [
              /* @__PURE__ */ m.jsx("span", { style: { color: r.white, fontSize: 11.5, fontWeight: 600 }, children: "Compartilhar trecho" }),
              /* @__PURE__ */ m.jsx(
                "button",
                {
                  type: "button",
                  className: "cursor-pointer outline-none flex items-center",
                  style: { color: r.w35 },
                  "aria-label": "Fechar",
                  onClick: n,
                  children: /* @__PURE__ */ m.jsx(rr, { size: 10 })
                }
              )
            ] }),
            /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: r.divider } }),
            /* @__PURE__ */ m.jsx("div", { style: { padding: "9px 12px", background: r.insetSoft }, children: ge ? /* @__PURE__ */ m.jsx("span", { style: { color: r.w50, fontSize: 10.5, lineHeight: 1.45 }, children: "Selecione um texto na página ou ouça um parágrafo — é ele que será compartilhado." }) : /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
              /* @__PURE__ */ m.jsxs("span", { className: "block", style: { color: r.w65, fontSize: 10.5, lineHeight: 1.45 }, children: [
                "“",
                hs(z),
                "”"
              ] }),
              /* @__PURE__ */ m.jsxs(
                "span",
                {
                  className: "flex items-center",
                  style: { gap: 4, marginTop: 6, color: y ? "#ff8f80" : S ? r.w40 : ce, fontSize: 9.5 },
                  children: [
                    /* @__PURE__ */ m.jsx(P3, { size: 9, style: { flexShrink: 0 } }),
                    /* @__PURE__ */ m.jsx("span", { style: { minWidth: 0 }, children: y || (S ? "Criando o link..." : g ? E ? "Link pronto (o trecho era longo e foi encurtado)" : "Link pronto — quem abrir lê com o Dislexfy" : "O link é criado ao escolher um destino") })
                  ]
                }
              ),
              y && /* @__PURE__ */ m.jsx(
                "button",
                {
                  type: "button",
                  className: "cursor-pointer outline-none",
                  style: {
                    marginTop: 7,
                    padding: "5px 10px",
                    borderRadius: 7,
                    background: r.inset,
                    border: `1px solid ${r.insetRing}`,
                    color: r.white,
                    fontSize: 10.5,
                    fontWeight: 600
                  },
                  onClick: () => void te(),
                  children: "Tentar de novo"
                }
              )
            ] }) }),
            /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: r.divider } }),
            ye.map((ie, ue) => /* @__PURE__ */ m.jsxs(
              "button",
              {
                type: "button",
                className: "w-full flex items-center cursor-pointer outline-none text-left",
                style: {
                  gap: 10,
                  padding: "8px 12px",
                  background: f === ie.key ? r.insetSoft : "transparent",
                  borderTop: ue === 0 ? "none" : `1px solid ${r.card}`,
                  color: ie.color,
                  opacity: ge || S ? 0.4 : 1,
                  cursor: ge || S ? "default" : "pointer"
                },
                disabled: ge || S,
                onMouseEnter: () => h(ie.key),
                onMouseLeave: () => h(null),
                onClick: ie.onClick,
                children: [
                  /* @__PURE__ */ m.jsx("span", { className: "flex items-center justify-center", style: { width: 16 }, children: ie.icon }),
                  /* @__PURE__ */ m.jsx("span", { style: { color: ie.key === "copy" && u ? ce : r.w85, fontSize: 12 }, children: ie.label })
                ]
              },
              ie.key
            ))
          ]
        }
      )
    }
  );
}
const TS = [
  "Tudo Grátis",
  "Leitura ilimitada",
  "Todas as 5 vozes + Velocidade da Leitura",
  "Modo Foco e fontes completas",
  "Salvar em PDF",
  "Acesso antecipado ao app desktop"
], Qp = "#141310", PS = "#211f1a", ES = "rgba(255,255,255,0.07)", jS = "#ecd6f0";
function RS({ onClose: n }) {
  const { proHeader: r } = pc(), o = un(), a = Nn(), u = () => {
    try {
      window.open(hc, "_blank", "noopener,noreferrer");
    } catch {
    }
    n();
  };
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      className: "fixed inset-0 flex items-center justify-center",
      style: { zIndex: dc, background: "rgba(0,0,0,0.55)", padding: 16, fontFamily: xt },
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18 },
      onPointerDown: n,
      children: /* @__PURE__ */ m.jsxs(
        me.div,
        {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Assine o Dislexfy Pro",
          className: "relative",
          style: {
            width: "min(390px, 92vw)",
            maxHeight: "92vh",
            overflowY: "auto",
            background: Qp,
            borderRadius: 28,
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)"
          },
          initial: { opacity: 0, y: 16, scale: 0.96 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 16, scale: 0.96 },
          transition: { type: "spring", stiffness: 420, damping: 32 },
          onPointerDown: (d) => d.stopPropagation(),
          children: [
            /* @__PURE__ */ m.jsx(
              "button",
              {
                type: "button",
                "aria-label": "Fechar",
                onClick: n,
                className: "absolute cursor-pointer outline-none flex items-center justify-center",
                style: {
                  top: 16,
                  right: 16,
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#f7f3ea",
                  color: "#141310",
                  border: "none",
                  zIndex: 2
                },
                children: /* @__PURE__ */ m.jsx(rr, { size: 17, strokeWidth: 2.6 })
              }
            ),
            r && /* @__PURE__ */ m.jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ m.jsx("img", { src: r, alt: "", style: { display: "block", width: "100%", height: "auto" } }),
              /* @__PURE__ */ m.jsx(
                "div",
                {
                  "aria-hidden": "true",
                  style: { position: "absolute", left: 0, right: 0, bottom: -1, height: 40, background: `linear-gradient(transparent, ${Qp})` }
                }
              )
            ] }),
            /* @__PURE__ */ m.jsxs("div", { style: { padding: r ? "2px 22px 24px" : "40px 22px 24px" }, children: [
              /* @__PURE__ */ m.jsxs(
                "h2",
                {
                  style: {
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: 25,
                    lineHeight: 1.06,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "-0.005em",
                    margin: "6px 0 18px"
                  },
                  children: [
                    "Leitura sem limites,",
                    /* @__PURE__ */ m.jsx("br", {}),
                    "em todo lugar."
                  ]
                }
              ),
              /* @__PURE__ */ m.jsx("div", { style: { display: "flex", flexDirection: "column", gap: 9 }, children: TS.map((d) => /* @__PURE__ */ m.jsxs(
                "div",
                {
                  className: "flex items-center",
                  style: { gap: 12, background: PS, borderRadius: 999, padding: "11px 16px", boxShadow: `inset 0 0 0 1px ${ES}` },
                  children: [
                    /* @__PURE__ */ m.jsx(
                      "span",
                      {
                        className: "flex items-center justify-center",
                        style: { flex: "none", width: 22, height: 22, borderRadius: 999, background: ce },
                        children: /* @__PURE__ */ m.jsx(uc, { size: 13, strokeWidth: 3.2, color: "#141310" })
                      }
                    ),
                    /* @__PURE__ */ m.jsx("span", { style: { color: "#ffffff", fontSize: 13, fontWeight: 600, lineHeight: 1.25 }, children: d })
                  ]
                },
                d
              )) }),
              /* @__PURE__ */ m.jsxs(
                me.button,
                {
                  type: "button",
                  onClick: u,
                  className: "cursor-pointer outline-none flex items-center justify-center",
                  whileHover: { y: -2 },
                  whileTap: { scale: 0.98 },
                  style: {
                    marginTop: 20,
                    width: "100%",
                    gap: 9,
                    background: ce,
                    color: "#141310",
                    border: "none",
                    borderRadius: 999,
                    padding: "15px 20px",
                    fontWeight: 800,
                    fontSize: 14.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    boxShadow: "0 8px 22px rgba(248,216,50,0.28)"
                  },
                  children: [
                    "Teste grátis por",
                    /* @__PURE__ */ m.jsx("span", { style: { background: jS, color: "#141310", borderRadius: 8, padding: "3px 9px", fontWeight: 800 }, children: "7 dias" })
                  ]
                }
              ),
              !o.account && /* @__PURE__ */ m.jsx(
                "button",
                {
                  type: "button",
                  className: "w-full cursor-pointer outline-none",
                  style: {
                    marginTop: 12,
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12.5,
                    fontWeight: 600
                  },
                  onClick: () => {
                    n(), a.openAuth();
                  },
                  children: "Já sou assinante — entrar"
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
function X0(n) {
  M.useEffect(() => {
    function r(o) {
      o.key === "Escape" && n();
    }
    return window.addEventListener("keydown", r), () => window.removeEventListener("keydown", r);
  }, [n]);
}
const MS = 320;
function Q0({
  label: n,
  onClose: r,
  children: o
}) {
  return X0(r), /* @__PURE__ */ m.jsx(
    me.div,
    {
      className: "fixed inset-0 flex items-center justify-center",
      style: { zIndex: dc + 1, background: "rgba(0,0,0,0.62)", padding: 16 },
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.16 },
      onPointerDown: (a) => a.stopPropagation(),
      onClick: r,
      children: /* @__PURE__ */ m.jsxs(
        me.div,
        {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": n,
          className: "relative",
          style: { width: MS, maxWidth: "100%" },
          initial: { opacity: 0, y: 14, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 14, scale: 0.95 },
          transition: { type: "spring", stiffness: 420, damping: 32 },
          onClick: (a) => a.stopPropagation(),
          children: [
            /* @__PURE__ */ m.jsx(
              me.button,
              {
                type: "button",
                className: "absolute flex items-center justify-center cursor-pointer outline-none",
                style: { top: 0, right: 0, width: 44, height: 44, background: "transparent", border: 0, zIndex: 2 },
                "aria-label": "Fechar",
                whileHover: { scale: 1.06 },
                whileTap: { scale: 0.94 },
                onClick: r,
                children: /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    className: "flex items-center justify-center",
                    style: { width: 30, height: 30, borderRadius: 999, background: "#f7f3ea", color: "#141310" },
                    children: /* @__PURE__ */ m.jsx(rr, { size: 15, strokeWidth: 2.6 })
                  }
                )
              }
            ),
            /* @__PURE__ */ m.jsx("div", { style: { maxHeight: "min(92vh, 640px)", overflowY: "auto", borderRadius: 16 }, children: o })
          ]
        }
      )
    }
  );
}
const ru = 296, AS = 380;
function DS({ onClose: n }) {
  const r = Nn(), { authPage: o } = pc(), a = M.useRef(null), [u, d] = M.useState(ru), [f, h] = M.useState(!1);
  return M.useEffect(() => {
    function g(v) {
      const y = a.current;
      if (!y || v.source !== y.contentWindow || !/^chrome-extension:\/\//.test(v.origin)) return;
      const x = v.data;
      !x || x.source !== "zyrex-auth" || (x.type === "height" && typeof x.height == "number" ? (d(Math.max(1, x.height + 1)), h(!0)) : x.type === "signed-in" ? r.onAuthenticated() : x.type === "opened-site" && (n(), r.refreshAccountPlan()));
    }
    return window.addEventListener("message", g), () => window.removeEventListener("message", g);
  }, [r, o, n]), /* @__PURE__ */ m.jsx(Q0, { label: "Entrar no Dislexfy", onClose: n, children: o ? (
    // O fundo do invólucro é o MESMO do cartão desenhado dentro do iframe
    // (auth.css → --zx-panel). Se a altura do iframe sobrar em relação ao
    // conteúdo, a diferença lê como cartão um pouco mais alto em vez de um
    // buraco transparente mostrando a página por trás.
    /* @__PURE__ */ m.jsxs(
      "div",
      {
        className: "relative",
        style: { boxShadow: "0 20px 60px rgba(0,0,0,0.6)", borderRadius: 15, background: "#0d0d0d" },
        children: [
          !f && /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "absolute inset-0 flex items-center justify-center",
              style: { borderRadius: 15, background: "#0d0d0d", boxShadow: "inset 0 0 0 1.5px #3a3a3a", color: "rgba(255,255,255,0.35)" },
              children: /* @__PURE__ */ m.jsx(
                me.span,
                {
                  animate: { rotate: 360 },
                  transition: { duration: 0.9, repeat: 1 / 0, ease: "linear" },
                  style: { display: "inline-flex" },
                  children: /* @__PURE__ */ m.jsx(B0, { size: 18 })
                }
              )
            }
          ),
          /* @__PURE__ */ m.jsx(
            me.iframe,
            {
              ref: a,
              src: o,
              title: "Entrar no Dislexfy",
              onLoad: () => {
                h(!0), d((g) => g === ru ? AS : g);
              },
              animate: { height: u, opacity: f ? 1 : 0 },
              initial: { height: ru, opacity: 0 },
              transition: { height: { type: "spring", stiffness: 500, damping: 40 }, opacity: { duration: 0.18 } },
              style: {
                width: "100%",
                border: 0,
                borderRadius: 15,
                display: "block",
                colorScheme: "dark"
              }
            }
          )
        ]
      }
    )
  ) : /* @__PURE__ */ m.jsx(
    "div",
    {
      style: {
        padding: 18,
        borderRadius: 15,
        background: "#0d0d0d",
        boxShadow: "inset 0 0 0 1.5px #3a3a3a",
        color: "rgba(255,255,255,0.75)",
        fontSize: 12,
        lineHeight: 1.5
      },
      children: "O login só funciona com a extensão instalada. Recarregue a página e tente de novo."
    }
  ) });
}
const qp = "#141310", LS = 5e3;
function VS({ onClose: n }) {
  const r = un(), [o, a] = M.useState(!1), u = M.useRef(n);
  u.current = n, M.useEffect(() => {
    if (o) return;
    const f = window.setTimeout(() => u.current(), LS);
    return () => window.clearTimeout(f);
  }, [o]);
  const d = r.account && r.account.name ? r.account.name.split(/\s+/)[0] : "";
  return /* @__PURE__ */ m.jsx(Q0, { label: "Login concluído", onClose: n, children: /* @__PURE__ */ m.jsxs(
    "div",
    {
      onPointerEnter: () => a(!0),
      onFocusCapture: () => a(!0),
      style: {
        padding: "34px 22px 22px",
        borderRadius: 16,
        background: qp,
        boxShadow: "0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)",
        fontFamily: xt,
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ m.jsx(
          me.span,
          {
            className: "flex items-center justify-center",
            style: { width: 56, height: 56, borderRadius: 999, background: ce, color: qp, margin: "0 auto 14px" },
            initial: { scale: 0.4, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { type: "spring", stiffness: 500, damping: 22, delay: 0.06 },
            children: /* @__PURE__ */ m.jsx(uc, { size: 30, strokeWidth: 3 })
          }
        ),
        /* @__PURE__ */ m.jsx("h2", { style: { margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }, children: d ? `Bem-vindo, ${d}!` : "Tudo certo!" }),
        /* @__PURE__ */ m.jsx("p", { style: { margin: "7px 0 0", fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.62)" }, children: r.isPro ? "Seu Pro está ativo neste navegador. Salvar trechos e Modo Leitura liberados." : "Você entrou na sua conta. Suas preferências agora sincronizam." }),
        /* @__PURE__ */ m.jsx(
          "button",
          {
            type: "button",
            className: "cursor-pointer outline-none",
            style: {
              width: "100%",
              marginTop: 18,
              padding: "11px 0",
              borderRadius: 999,
              border: 0,
              background: ce,
              color: "#000",
              fontFamily: xt,
              fontSize: 12.5,
              fontWeight: 700
            },
            onClick: n,
            children: "Continuar"
          }
        ),
        !r.isPro && /* @__PURE__ */ m.jsxs(
          "button",
          {
            type: "button",
            className: "flex items-center justify-center cursor-pointer outline-none",
            style: {
              width: "100%",
              gap: 5,
              marginTop: 10,
              padding: "6px 0",
              background: "transparent",
              border: 0,
              color: ce,
              fontFamily: xt,
              fontSize: 11.5,
              fontWeight: 600
            },
            onClick: () => {
              Fi(hc), n();
            },
            children: [
              /* @__PURE__ */ m.jsx(Au, { size: 12 }),
              " Conhecer o Pro"
            ]
          }
        )
      ]
    }
  ) });
}
const NS = 208, _S = { free: "Grátis", pro: "Pro", familia: "Família" };
function Di({
  icon: n,
  label: r,
  hint: o,
  onClick: a,
  accent: u
}) {
  const d = pt();
  return /* @__PURE__ */ m.jsxs(
    "button",
    {
      type: "button",
      className: "w-full flex items-center cursor-pointer outline-none",
      style: {
        gap: 9,
        padding: "8px 12px",
        background: "transparent",
        border: 0,
        color: u ? ce : d.white,
        fontFamily: xt,
        fontSize: 11.5,
        fontWeight: 600,
        textAlign: "left",
        transition: "background 0.12s"
      },
      onMouseEnter: (f) => f.currentTarget.style.background = d.hover,
      onMouseLeave: (f) => f.currentTarget.style.background = "transparent",
      onClick: a,
      children: [
        /* @__PURE__ */ m.jsx("span", { className: "flex items-center justify-center", style: { width: 16, flexShrink: 0, color: u ? ce : d.w65 }, children: n }),
        /* @__PURE__ */ m.jsx("span", { style: { minWidth: 0, flex: 1 }, children: r }),
        o && /* @__PURE__ */ m.jsx("span", { style: { color: d.w40, fontSize: 9.5, fontWeight: 500, flexShrink: 0 }, children: o })
      ]
    }
  );
}
function zS({ onClose: n }) {
  const r = un(), o = Nn(), a = pt(), u = M.useRef(null);
  X0(n), M.useEffect(() => {
    const f = u.current;
    if (!f) return;
    const g = f.getRootNode().host ?? null;
    function v(y) {
      const x = typeof y.composedPath == "function" ? y.composedPath() : [];
      g && x.includes(g) || n();
    }
    return window.addEventListener("pointerdown", v, !0), () => window.removeEventListener("pointerdown", v, !0);
  }, [n]);
  const d = r.account;
  return /* @__PURE__ */ m.jsx(
    me.div,
    {
      ref: u,
      style: { width: NS, fontFamily: xt },
      initial: { opacity: 0, y: 10, scale: 0.94 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 10, scale: 0.94 },
      transition: { type: "spring", stiffness: 460, damping: 30 },
      onPointerDown: (f) => f.stopPropagation(),
      children: /* @__PURE__ */ m.jsxs(
        "div",
        {
          className: "rounded-[13px] overflow-hidden",
          style: { background: a.panel, boxShadow: `inset 0 0 0 1.5px ${a.panelRing}, 0 8px 28px rgba(0,0,0,0.45)` },
          children: [
            /* @__PURE__ */ m.jsxs("div", { className: "flex items-center justify-between", style: { padding: "8px 12px", gap: 8 }, children: [
              /* @__PURE__ */ m.jsxs("span", { className: "flex items-center", style: { gap: 7, minWidth: 0 }, children: [
                /* @__PURE__ */ m.jsx("span", { style: { color: ce, display: "inline-flex", flexShrink: 0 }, children: /* @__PURE__ */ m.jsx(fc, {}) }),
                /* @__PURE__ */ m.jsx("span", { style: { color: a.white, fontSize: 11.5, fontWeight: 700 }, children: "Dislexfy" }),
                /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    style: {
                      flexShrink: 0,
                      padding: "1px 6px",
                      borderRadius: 999,
                      background: a.inset,
                      color: a.w65,
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase"
                    },
                    children: "beta"
                  }
                )
              ] }),
              /* @__PURE__ */ m.jsx(
                "button",
                {
                  type: "button",
                  className: "cursor-pointer outline-none flex items-center",
                  style: { color: a.w35, background: "transparent", border: 0 },
                  "aria-label": "Fechar",
                  onClick: n,
                  children: /* @__PURE__ */ m.jsx(rr, { size: 10 })
                }
              )
            ] }),
            /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: a.divider } }),
            d ? /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
              /* @__PURE__ */ m.jsxs("div", { className: "flex items-center", style: { gap: 9, padding: "10px 12px", background: a.insetSoft }, children: [
                /* @__PURE__ */ m.jsx(
                  "span",
                  {
                    className: "flex items-center justify-center",
                    style: { width: 26, height: 26, borderRadius: 999, background: a.inset, color: r.isPro ? ce : a.w50, flexShrink: 0 },
                    children: /* @__PURE__ */ m.jsx(Au, { size: 13 })
                  }
                ),
                /* @__PURE__ */ m.jsxs("span", { style: { minWidth: 0 }, children: [
                  /* @__PURE__ */ m.jsx(
                    "span",
                    {
                      className: "block",
                      style: { color: a.white, fontSize: 11.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                      title: d.email,
                      children: d.name || d.email
                    }
                  ),
                  /* @__PURE__ */ m.jsxs("span", { className: "block", style: { color: a.w50, fontSize: 9.5, marginTop: 1 }, children: [
                    "Plano ",
                    _S[d.plan] ?? d.plan
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: a.divider } }),
              !r.isPro && /* @__PURE__ */ m.jsx(
                Di,
                {
                  icon: /* @__PURE__ */ m.jsx(Au, { size: 13 }),
                  label: "Assinar o Pro",
                  accent: !0,
                  onClick: () => {
                    Fi(hc), n();
                  }
                }
              ),
              /* @__PURE__ */ m.jsx(
                Di,
                {
                  icon: /* @__PURE__ */ m.jsx(Fp, { size: 13 }),
                  label: "Ir para o site",
                  onClick: () => {
                    Fi(Vs), n();
                  }
                }
              ),
              /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: a.divider } }),
              /* @__PURE__ */ m.jsx(
                Di,
                {
                  icon: /* @__PURE__ */ m.jsx(N3, { size: 13 }),
                  label: "Sair da conta",
                  onClick: () => {
                    o.signOut(), n();
                  }
                }
              )
            ] }) : /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
              /* @__PURE__ */ m.jsx("div", { style: { padding: "9px 12px", background: a.insetSoft }, children: /* @__PURE__ */ m.jsx("span", { style: { color: a.w65, fontSize: 10.5, lineHeight: 1.45 }, children: "Entre para sincronizar suas preferências e liberar os recursos Pro." }) }),
              /* @__PURE__ */ m.jsx("div", { style: { height: 1, background: a.divider } }),
              /* @__PURE__ */ m.jsx(
                Di,
                {
                  icon: /* @__PURE__ */ m.jsx(L3, { size: 13 }),
                  label: "Entrar",
                  accent: !0,
                  onClick: () => {
                    o.openAuth(), n();
                  }
                }
              ),
              /* @__PURE__ */ m.jsx(
                Di,
                {
                  icon: /* @__PURE__ */ m.jsx(Fp, { size: 13 }),
                  label: "Ir para o site",
                  onClick: () => {
                    Fi(Vs), n();
                  }
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
const Xt = 12, Kt = 8, Zp = 20, _r = 0.5;
function Ns(n, r, o) {
  return Math.min(Math.max(n, r), o);
}
function IS() {
  const n = document.documentElement;
  return {
    vw: n.clientWidth || window.innerWidth,
    vh: n.clientHeight || window.innerHeight
  };
}
function _s(n, r) {
  return Math.max(Xt, n - r - Xt);
}
function FS(n, r) {
  return Math.abs(n.left - r.left) < _r && Math.abs(n.top - r.top) < _r && Math.abs(n.w - r.w) < _r && Math.abs(n.h - r.h) < _r && n.pw === r.pw && n.ph === r.ph && n.vw === r.vw && n.vh === r.vh;
}
function bS(n, r, o) {
  const a = { position: "fixed", zIndex: o };
  if (!n) return { ...a, right: Zp, bottom: Zp };
  if (!r) return { ...a, left: n.left, top: n.top };
  const u = { ...a };
  return n.left + r.w / 2 > r.vw / 2 ? u.right = Math.max(0, r.vw - (n.left + r.w)) : u.left = Math.max(0, n.left), n.top + r.h / 2 > r.vh / 2 ? u.bottom = Math.max(0, r.vh - (n.top + r.h)) : u.top = Math.max(0, n.top), u;
}
function OS(n, r) {
  if (!r)
    return n ? {
      panelStyle: { left: "50%", transform: "translateX(-50%)", bottom: "100%", marginBottom: Kt },
      panelAlign: "center"
    } : {
      panelStyle: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: Kt },
      panelAlign: "flex-end"
    };
  if (n) {
    const h = r.top - Kt - Xt, g = r.vh - (r.top + r.h) - Kt - Xt, v = r.ph <= h || h >= g, y = r.left + r.w / 2 - r.pw / 2, x = Ns(y, Xt, _s(r.vw, r.pw)) - r.left;
    return {
      panelStyle: v ? { left: x, bottom: "100%", marginBottom: Kt } : { left: x, top: "100%", marginTop: Kt },
      panelAlign: "center"
    };
  }
  const o = r.left - Kt - Xt, a = r.vw - (r.left + r.w) - Kt - Xt, u = r.pw <= o || o >= a, d = r.top + r.h / 2 - r.ph / 2, f = Ns(d, Xt, _s(r.vh, r.ph)) - r.top;
  return {
    panelStyle: u ? { top: f, right: "100%", marginRight: Kt } : { top: f, left: "100%", marginLeft: Kt },
    panelAlign: u ? "flex-end" : "flex-start"
  };
}
function BS(n) {
  const { rootRef: r, panelsRef: o, pos: a, orientation: u, zIndex: d, isDragging: f, onReposition: h } = n, [g, v] = M.useState(null), y = M.useRef(null), x = M.useCallback(() => {
    if (f()) return;
    const V = r.current;
    if (!V) return;
    const N = V.getBoundingClientRect();
    if (!N.width || !N.height) return;
    const z = o.current, { vw: b, vh: ee } = IS(), Z = {
      left: N.left,
      top: N.top,
      w: N.width,
      h: N.height,
      pw: z ? z.offsetWidth : 0,
      ph: z ? z.offsetHeight : 0,
      vw: b,
      vh: ee
    };
    if ((!y.current || !FS(y.current, Z)) && (y.current = Z, v(Z)), !a) return;
    const te = Ns(N.left, Xt, _s(Z.vw, N.width)), W = Ns(N.top, Xt, _s(Z.vh, N.height));
    (Math.abs(te - a.left) > _r || Math.abs(W - a.top) > _r) && h(te, W, { w: N.width, h: N.height });
  }, [r, o, a, f, h]);
  M.useLayoutEffect(x);
  const S = M.useRef(x);
  S.current = x;
  const A = M.useRef(null), E = M.useRef({ root: null, panels: null });
  M.useLayoutEffect(() => {
    const V = () => S.current();
    window.addEventListener("resize", V);
    const N = typeof ResizeObserver < "u" ? new ResizeObserver(V) : null;
    return A.current = N, () => {
      window.removeEventListener("resize", V), A.current = null, E.current = { root: null, panels: null }, N && N.disconnect();
    };
  }, []), M.useLayoutEffect(() => {
    const V = A.current;
    if (!V) return;
    const N = E.current, z = r.current, b = o.current;
    N.root !== z && (N.root && V.unobserve(N.root), z && V.observe(z), N.root = z), N.panels !== b && (N.panels && V.unobserve(N.panels), b && V.observe(b), N.panels = b);
  });
  const { panelStyle: D, panelAlign: L } = OS(u === "horizontal", g);
  return { anchorStyle: bS(a, g, d), panelStyle: D, panelAlign: L };
}
const $S = 3, WS = 4e3, US = 0.32, iu = [0.8, 1, 1.2, 1.4, 1.6];
function HS() {
  const n = un(), r = Nn(), [o, a] = M.useState(null), [u, d] = M.useState(n.position), f = M.useRef(null), h = M.useRef(null), g = M.useRef({ dragging: !1, didDrag: !1, sx: 0, sy: 0, ox: 0, oy: 0 });
  M.useEffect(() => {
    g.current.dragging || d(n.position);
  }, [n.position]);
  const [v, y] = M.useState(!1);
  M.useEffect(() => {
    n.open ? y(!0) : a(null);
  }, [n.open]);
  const x = M.useCallback((G) => {
    a((re) => re === G ? null : G);
  }, []), S = M.useRef(!1), A = M.useRef(null), E = M.useRef(() => {
  }), D = M.useRef(() => {
  });
  M.useEffect(() => (E.current = (G) => {
    const re = g.current;
    if (!re.dragging) return;
    const fe = G.clientX - re.sx, ke = G.clientY - re.sy;
    !re.didDrag && Math.abs(fe) + Math.abs(ke) > $S && (re.didDrag = !0), re.didDrag && d({ left: re.ox + fe, top: re.oy + ke });
  }, D.current = () => {
    const G = g.current;
    if (G.dragging && (G.dragging = !1, window.removeEventListener("pointermove", E.current), window.removeEventListener("pointerup", D.current), G.didDrag)) {
      S.current = !0, A.current && clearTimeout(A.current), A.current = window.setTimeout(() => {
        S.current = !1;
      }, 250);
      const re = f.current?.getBoundingClientRect();
      re && (d({ left: re.left, top: re.top }), r.setPosition(re.left, re.top, { w: re.width, h: re.height }));
    }
  }, () => {
    window.removeEventListener("pointermove", E.current), window.removeEventListener("pointerup", D.current), A.current && clearTimeout(A.current);
  }), [r]);
  const L = M.useCallback((G) => {
    if (G.button !== 0) return;
    const re = f.current;
    if (!re) return;
    const fe = re.getBoundingClientRect();
    g.current = {
      dragging: !0,
      didDrag: !1,
      sx: G.clientX,
      sy: G.clientY,
      ox: fe.left,
      oy: fe.top
    }, window.addEventListener("pointermove", E.current), window.addEventListener("pointerup", D.current);
  }, []), V = M.useCallback((G) => {
    S.current && (S.current = !1, G.preventDefault(), G.stopPropagation());
  }, []), N = M.useCallback(() => g.current.dragging, []), z = M.useCallback(
    (G, re, fe) => {
      d({ left: G, top: re }), r.setPosition(G, re, fe);
    },
    [r]
  ), { anchorStyle: b, panelStyle: ee, panelAlign: Z } = BS({
    rootRef: f,
    panelsRef: h,
    pos: u,
    orientation: n.prefs.orientation,
    zIndex: dc,
    isDragging: N,
    onReposition: z
  }), [te, W] = M.useState(!1), [ae, K] = M.useState(!1), [ye, ge] = M.useState(0), ie = ae || o !== null || n.authOpen || n.hasActiveReading;
  M.useEffect(() => {
    if (!n.prefs.idleFade || ie) {
      W(!1);
      return;
    }
    const G = window.setTimeout(() => W(!0), WS);
    return () => window.clearTimeout(G);
  }, [ie, n.prefs.idleFade, ye]);
  const ue = {
    onPointerEnter: () => K(!0),
    onPointerLeave: () => K(!1),
    onPointerDownCapture: () => ge((G) => G + 1),
    onFocusCapture: () => K(!0)
  }, we = te ? US : 1, Te = { duration: te ? 0.55 : 0.12, ease: [0.4, 0, 0.2, 1] }, je = /* @__PURE__ */ m.jsxs(Et, { children: [
    n.authView === "form" && /* @__PURE__ */ m.jsx(DS, { onClose: () => r.closeAuth() }, "auth"),
    n.authView === "success" && /* @__PURE__ */ m.jsx(VS, { onClose: () => r.closeAuth() }, "auth-ok")
  ] });
  if (!n.open) {
    const G = v || n.prefs.startMode === "collapsed";
    return /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
      G && // O invólucro ancorado NÃO anima transform (só opacidade, que não
      // mexe no layout): é ele que o useDockPlacement mede.
      /* @__PURE__ */ m.jsx(
        me.div,
        {
          ref: f,
          style: b,
          onClickCapture: V,
          animate: { opacity: we },
          transition: Te,
          ...ue,
          children: /* @__PURE__ */ m.jsx("div", { style: { cursor: "grab", touchAction: "none" }, onPointerDown: L, children: /* @__PURE__ */ m.jsx(lS, { onOpen: () => r.open() }) })
        }
      ),
      /* @__PURE__ */ m.jsx(Hp, {}),
      je
    ] });
  }
  const B = n.prefs.orientation === "horizontal", X = n.playerState !== "idle", U = Mi.find((G) => G.value === n.prefs.voice)?.label.split(" ")[0] ?? "Voz", T = () => {
    const G = n.prefs.speed;
    let re = 0, fe = 1 / 0;
    iu.forEach((nt, ir) => {
      const Br = Math.abs(nt - G);
      Br < fe && (fe = Br, re = ir);
    });
    const ke = iu[(re + 1) % iu.length];
    r.setSpeed(ke), r.info(`Velocidade ${ke}x`);
  }, _ = () => {
    const G = Mi.findIndex((fe) => fe.value === n.prefs.voice), re = Mi[(G + 1) % Mi.length] ?? Mi[0];
    r.setVoice(re.value), r.info(`Voz: ${re.label}`);
  }, de = {
    isPro: n.isPro,
    menu: o,
    tooltipsOff: o !== null,
    // não sobrepõe tooltip a um painel aberto
    // controles de leitura inline (só aparecem quando há leitura ativa)
    reading: X,
    isPlaying: n.isPlaying,
    streaming: n.playerState === "loading" || n.playerState === "playing",
    ended: n.playerState === "ended",
    time: n.timeText,
    speed: n.prefs.speed,
    voiceLabel: U,
    // ações
    // A marca abre o menu da CONTA (entrar/sair/plano/ir pro site). Era um link
    // direto pro site — e o login vivia escondido nas Configurações.
    onBrand: () => x("brand"),
    // Sem conta, um pontinho discreto na marca é a única pista de que existe
    // login, agora que o card de conta saiu das Configurações.
    brandHint: !n.account,
    onSaved: () => x("saved"),
    onBook: () => r.openReader(),
    onShare: () => x("share"),
    onSettings: () => x("settings"),
    onClose: () => r.close(),
    onProLocked: () => a("pro"),
    // salvar/leitura bloqueados → modal Pro (upsell)
    onDitado: () => r.info("Ditado por voz — em breve 🎙️", 2600),
    onPlayPause: () => r.togglePlayPause(),
    onSeek: (G) => r.seekRelative(G),
    onDownload: () => r.download(),
    onCycleSpeed: T,
    onCycleVoice: _
  }, he = { onPointerDown: L }, ve = /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
    /* @__PURE__ */ m.jsx(Et, { children: o === "brand" && /* @__PURE__ */ m.jsx(zS, { onClose: () => a(null) }, "brand") }),
    /* @__PURE__ */ m.jsx(Et, { children: o === "settings" && /* @__PURE__ */ m.jsx(mS, { onClose: () => a(null) }, "settings") }),
    /* @__PURE__ */ m.jsx(Et, { children: o === "saved" && /* @__PURE__ */ m.jsx(wS, {}, "saved") }),
    /* @__PURE__ */ m.jsx(Et, { children: o === "share" && /* @__PURE__ */ m.jsx(CS, { onClose: () => a(null) }, "share") })
  ] });
  return /* @__PURE__ */ m.jsxs(K0.Provider, { value: cS(n.prefs.dark), children: [
    /* @__PURE__ */ m.jsx(
      me.div,
      {
        ref: f,
        "data-zx-anchor": B ? "horizontal" : "vertical",
        style: b,
        onClickCapture: V,
        animate: { opacity: we },
        transition: Te,
        ...ue,
        children: /* @__PURE__ */ m.jsx(
          me.div,
          {
            initial: { opacity: 0, y: 8, scale: 0.96 },
            animate: { opacity: 1, y: 0, scale: 1 },
            transition: {
              y: { type: "spring", stiffness: 400, damping: 30 },
              scale: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.18 }
            },
            children: /* @__PURE__ */ m.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ m.jsxs(
                "div",
                {
                  ref: h,
                  "data-zx-panels": "",
                  className: "absolute flex flex-col",
                  style: { ...ee, alignItems: Z, gap: 8 },
                  children: [
                    /* @__PURE__ */ m.jsx(fS, {}),
                    ve
                  ]
                }
              ),
              /* @__PURE__ */ m.jsx("div", { style: { cursor: "grab", touchAction: "none" }, ...he, children: /* @__PURE__ */ m.jsx(sS, { orientation: B ? "horizontal" : "vertical", ...de }) })
            ] })
          }
        )
      }
    ),
    /* @__PURE__ */ m.jsx(Hp, {}),
    /* @__PURE__ */ m.jsx(Et, { children: o === "pro" && /* @__PURE__ */ m.jsx(RS, { onClose: () => a(null) }, "pro") }),
    je
  ] });
}
function GS({ shadow: n, cssText: r, core: o, assets: a }) {
  let u = null, d = null;
  try {
    u = new CSSStyleSheet(), u.replaceSync(r), n.adoptedStyleSheets = [...n.adoptedStyleSheets, u];
  } catch {
    d = document.createElement("style"), d.textContent = r, n.appendChild(d);
  }
  const f = document.createElement("div");
  f.id = "zx-ui-root", n.appendChild(f);
  const h = t1.createRoot(f);
  return h.render(
    // reducedMotion="user" desliga TODA animação do motion pra quem pediu
    // prefers-reduced-motion — inegociável num produto de acessibilidade.
    /* @__PURE__ */ m.jsx(Qx, { reducedMotion: "user", children: /* @__PURE__ */ m.jsx(W0.Provider, { value: o, children: /* @__PURE__ */ m.jsx(G0.Provider, { value: a ?? {}, children: /* @__PURE__ */ m.jsx(HS, {}) }) }) })
  ), () => {
    h.unmount(), f.remove(), d && d.remove(), u && (n.adoptedStyleSheets = n.adoptedStyleSheets.filter((g) => g !== u));
  };
}
export {
  GS as mountWidget
};
