/* @ds-bundle: {"format":4,"namespace":"BimbleDesignSystem_4e2205","components":[],"sourceHashes":{"patient-waiting-room/WaitingRoom.jsx":"24cd9facea67","patient-waiting-room/WaitingRoomHiFi.jsx":"0d94e2f95a26","patient-waiting-room/WaitingRoomWeb.jsx":"83d03ce4a94b","patient-waiting-room/WaitingRoomWeb.v1.jsx":"6ba4d17d17d4","patient-waiting-room/browser-window.jsx":"bd5e9166983f","patient-waiting-room/image-slot.js":"cf5f1791dd04","patient-waiting-room/ios-frame.jsx":"39f3a091d97d","patient-waiting-room/tweaks-panel.jsx":"7f64c6909a8b","ui_kits/clinic-onboarding/BillingScreen.jsx":"fe2f5629f7da","ui_kits/clinic-onboarding/CredentialsLogin.jsx":"2f001095aad6","ui_kits/clinic-onboarding/PlanScreen.jsx":"bb3d335d94fc","ui_kits/clinic-onboarding/SetupScreen.jsx":"d5b0018db138","ui_kits/clinic-onboarding/Shell.jsx":"cad48b25a281","ui_kits/marketing/Footer.jsx":"b51c30da57c6","ui_kits/marketing/Header.jsx":"c73d9a7ee5f6","ui_kits/marketing/Hero.jsx":"219a94cf40a4","ui_kits/marketing/Sections.jsx":"4fb289e94b91","ui_kits/marketing/Stakeholder.jsx":"7f51101d3498"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BimbleDesignSystem_4e2205 = window.BimbleDesignSystem_4e2205 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// patient-waiting-room/WaitingRoom.jsx
try { (() => {
// Bimble — Patient virtual waiting room (mobile, clean)
const {
  useState: useStateWR
} = React;
function WRIcon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      lineHeight: 0,
      ...style
    }
  });
}
const WR_STATES = {
  inline: {
    pos: "3",
    posLabel: "in line",
    headline: "You're 3rd in line",
    sub: "We'll let you know the moment it's your turn — you can keep this open in the background.",
    wait: "about 12 min",
    progress: 0.25,
    ready: false
  },
  soon: {
    pos: "2",
    posLabel: "in line",
    headline: "You're 2nd in line",
    sub: "You're moving up the queue. A good moment to find a quiet, well-lit spot.",
    wait: "about 6 min",
    progress: 0.55,
    ready: false
  },
  next: {
    pos: "1",
    posLabel: "you're next",
    headline: "You're next",
    sub: "Please settle in somewhere quiet — your provider will start the visit shortly.",
    wait: "about 2 min",
    progress: 0.85,
    ready: false
  },
  ready: {
    pos: "",
    posLabel: "",
    headline: "Your provider is ready",
    sub: "Dr. Sarah Chen is ready to see you now. Join when you're set.",
    wait: "now",
    progress: 1,
    ready: true
  }
};
function QueueRing({
  progress,
  accent,
  st
}) {
  const size = 188,
    stroke = 12,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(15,23,42,0.06)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: accent,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - progress),
    style: {
      transition: "stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, st.ready ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 72,
      width: 72,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: accent
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "video",
    size: 34,
    color: "#fff"
  })) : st.posLabel === "you're next" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WRIcon, {
    name: "bell-ring",
    size: 30,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 8,
      fontFamily: "Inter",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "#64748b"
    }
  }, "You're next")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "Montserrat,sans-serif",
      fontSize: 64,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-.04em",
      color: "#0f172a"
    }
  }, st.pos), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 6,
      fontFamily: "Inter",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "#64748b"
    }
  }, st.posLabel))));
}
function Avatar({
  showPhoto,
  accent
}) {
  if (showPhoto) {
    return /*#__PURE__*/React.createElement("image-slot", {
      id: "wr-provider",
      style: {
        width: 52,
        height: 52,
        flex: "none"
      },
      shape: "circle",
      placeholder: "Drop photo"
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      flex: "none",
      borderRadius: 9999,
      background: "rgba(92,112,255,0.12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Montserrat,sans-serif",
      fontWeight: 600,
      fontSize: 18,
      color: accent
    }
  }, "SC");
}
function WaitingRoom({
  stateKey = "inline",
  accent = "#5c70ff",
  density = "calm",
  showPhoto = false,
  tint = true
}) {
  const st = WR_STATES[stateKey];
  const calm = density === "calm";
  const prep = [["badge-check", "Photo ID nearby"], ["sun", "Bright, quiet spot"], ["headphones", "Headphones ready"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      fontFamily: "Inter,system-ui,sans-serif",
      color: "#0f172a",
      background: tint ? `linear-gradient(180deg, ${accent}14 0%, #FAFCFB 38%, #FAFCFB 100%)` : "#FAFCFB",
      display: "flex",
      flexDirection: "column",
      padding: "64px 22px 30px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 30,
      width: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
      background: accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 13
    }
  }, "B"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, "Bimble Downtown Clinic")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "#64748b",
      fontSize: 12,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "lock",
    size: 13,
    color: "#64748b"
  }), " Secure")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: ".26em",
      textTransform: "uppercase",
      color: accent
    }
  }, "Virtual waiting room"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(QueueRing, {
    progress: st.progress,
    accent: accent,
    st: st
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 26,
      fontFamily: "Montserrat,sans-serif",
      fontSize: 27,
      fontWeight: 600,
      letterSpacing: "-.03em",
      lineHeight: 1.15
    }
  }, st.headline), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 14.5,
      lineHeight: 1.6,
      color: "#64748b",
      maxWidth: 290
    }
  }, st.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      borderRadius: 9999,
      background: "#fff",
      border: "1px solid #dbe3ff",
      boxShadow: "0 1px 2px rgba(15,23,42,.06)",
      padding: "7px 14px"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "clock",
    size: 15,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "Estimated wait"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "#0f172a"
    }
  }, st.wait))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      borderRadius: 22,
      background: "#fff",
      border: "1px solid #dbe3ff",
      boxShadow: "0 1px 2px rgba(15,23,42,.06)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    showPhoto: showPhoto,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 600
    }
  }, "Dr. Sarah Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "Family Physician")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      borderRadius: 9999,
      background: "rgba(92,112,255,0.10)",
      color: accent,
      fontSize: 12,
      fontWeight: 600,
      padding: "5px 11px"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "video",
    size: 13,
    color: accent
  }), " Virtual")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "#eef1fb",
      margin: "14px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontSize: 13.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "calendar",
    size: 15,
    color: "#94a3b8"
  }), /*#__PURE__*/React.createElement("span", null, "Today \xB7 2:30 PM"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#cbd5e1"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Follow-up visit"))), calm && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      gap: 8
    }
  }, prep.map(([ic, label]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      flex: 1,
      borderRadius: 16,
      background: "rgba(255,255,255,0.7)",
      border: "1px solid #eef1fb",
      padding: "12px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 7,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: ic,
    size: 18,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      lineHeight: 1.3,
      color: "#64748b",
      fontWeight: 500
    }
  }, label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      height: 54,
      borderRadius: 16,
      border: "none",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      cursor: st.ready ? "pointer" : "not-allowed",
      background: st.ready ? accent : "#eef1fb",
      color: st.ready ? "#fff" : "#94a3b8",
      boxShadow: st.ready ? `0 10px 24px ${accent}44` : "none",
      transition: "all .2s"
    }
  }, st.ready && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 9,
      width: 9,
      borderRadius: 9999,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: "#fff",
      animation: "wrPulse 1.6s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement(WRIcon, {
    name: "video",
    size: 18,
    color: st.ready ? "#fff" : "#94a3b8"
  }), st.ready ? "Join video call" : "Join when it's your turn"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: "flex",
      justifyContent: "center",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#64748b",
      fontSize: 13.5,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "message-circle",
    size: 15,
    color: "#94a3b8"
  }), " Message clinic"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#64748b",
      fontSize: 13.5,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WRIcon, {
    name: "calendar-clock",
    size: 15,
    color: "#94a3b8"
  }), " Reschedule"))));
}
Object.assign(window, {
  WRIcon,
  WR_STATES,
  WaitingRoom
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/WaitingRoom.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/WaitingRoomHiFi.jsx
try { (() => {
// Bimble — Patient virtual waiting room · HIGH FIDELITY
function HFIcon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      lineHeight: 0,
      ...style
    }
  });
}
const HF_STATES = {
  inline: {
    pos: "3",
    posLabel: "ahead of you",
    headline: "You're 3rd in line",
    sub: "We'll bring you in automatically when it's your turn — feel free to keep this in the background.",
    wait: "about 12 min",
    progress: 0.25,
    ready: false
  },
  soon: {
    pos: "2",
    posLabel: "ahead of you",
    headline: "Almost there",
    sub: "You're moving up the queue. A good moment to settle into a quiet, well-lit spot.",
    wait: "about 6 min",
    progress: 0.58,
    ready: false
  },
  next: {
    pos: "1",
    posLabel: "ahead of you",
    headline: "You're next",
    sub: "Your provider is wrapping up. Please stay nearby — your visit will begin any moment.",
    wait: "under 2 min",
    progress: 0.86,
    ready: false
  },
  ready: {
    pos: "",
    posLabel: "",
    headline: "Dr. Chen is ready",
    sub: "Your provider is ready to see you now. Your camera and mic are all set.",
    wait: "now",
    progress: 1,
    ready: true
  }
};
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt,
    g = (n >> 8 & 0xff) + amt,
    b = (n & 0xff) + amt;
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function HFRing({
  st,
  accent
}) {
  const size = 196,
    stroke = 14,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  const gid = "hfgrad",
    lite = lighten(accent, 46);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 18,
      borderRadius: 9999,
      background: accent,
      opacity: 0.14,
      filter: "blur(26px)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      position: "relative",
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: accent
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: lite
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(15,23,42,0.05)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: `url(#${gid})`,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - st.progress),
    style: {
      transition: "stroke-dashoffset .8s cubic-bezier(.34,1.2,.4,1)",
      filter: `drop-shadow(0 6px 12px ${accent}44)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    key: st.headline,
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      animation: "hfPop .5s cubic-bezier(.34,1.3,.5,1)"
    }
  }, st.ready ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: 80,
      width: 80,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: accent,
      boxShadow: `0 12px 26px ${accent}55`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      border: `2px solid ${accent}`,
      animation: "hfRipple 1.8s ease-out infinite"
    }
  }), /*#__PURE__*/React.createElement(HFIcon, {
    name: "video",
    size: 36,
    color: "#fff"
  })) : st.pos === "1" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(HFIcon, {
    name: "bell-ring",
    size: 32,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 9,
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      color: "#64748b"
    }
  }, "You're next")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "Montserrat,sans-serif",
      fontSize: 70,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-.05em",
      color: "#0f172a"
    }
  }, st.pos), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 2,
      fontFamily: "Inter",
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, st.posLabel))));
}
function DeviceCheck({
  accent
}) {
  const items = [["video", "Camera"], ["mic", "Mic"], ["wifi", "Signal"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, items.map(([ic, label]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      borderRadius: 14,
      background: "#fff",
      border: "1px solid #eef1fb",
      boxShadow: "0 1px 2px rgba(15,23,42,.05)",
      padding: "10px 6px"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: ic,
    size: 15,
    color: "#475569"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 500,
      color: "#475569"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      height: 16,
      width: 16,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "#16a34a"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "check",
    size: 11,
    color: "#fff"
  })))));
}
function HFProvider({
  showPhoto,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 56,
      height: 56,
      flex: "none"
    }
  }, showPhoto ? /*#__PURE__*/React.createElement("image-slot", {
    id: "hf-provider",
    style: {
      width: 56,
      height: 56
    },
    shape: "circle",
    placeholder: "Photo"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 9999,
      background: `linear-gradient(135deg, ${lighten(accent, 30)}, ${accent})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Montserrat,sans-serif",
      fontWeight: 600,
      fontSize: 19,
      color: "#fff"
    }
  }, "SC"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      display: "flex",
      height: 20,
      width: 20,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "#fff",
      boxShadow: "0 1px 3px rgba(15,23,42,.2)"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "badge-check",
    size: 16,
    color: accent
  })));
}
function WaitingRoomHiFi({
  stateKey = "inline",
  accent = "#5c70ff",
  density = "calm",
  showPhoto = false
}) {
  const st = HF_STATES[stateKey];
  const calm = density === "calm";
  const rise = () => ({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      fontFamily: "Inter,system-ui,sans-serif",
      color: "#0f172a",
      background: `radial-gradient(120% 60% at 50% -8%, ${accent}1f 0%, ${accent}08 26%, #FAFCFB 52%), #FAFCFB`,
      display: "flex",
      flexDirection: "column",
      padding: "60px 20px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      ...rise(0)
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      height: 38,
      width: 38,
      borderRadius: 9999,
      border: "1px solid #e9edf6",
      background: "rgba(255,255,255,.7)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "chevron-left",
    size: 20,
    color: "#334155"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      lineHeight: 1.25
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 600
    }
  }, "Bimble Downtown Clinic"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      color: "#16a34a",
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 6,
      width: 6,
      borderRadius: 9999,
      background: "#16a34a"
    }
  }), " Secure connection")), /*#__PURE__*/React.createElement("button", {
    style: {
      height: 38,
      width: 38,
      borderRadius: 9999,
      border: "1px solid #e9edf6",
      background: "rgba(255,255,255,.7)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "help-circle",
    size: 19,
    color: "#334155"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      ...rise(60)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 7,
      width: 7,
      borderRadius: 9999,
      background: accent
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: accent,
      animation: "hfRipple 1.8s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".26em",
      textTransform: "uppercase",
      color: accent
    }
  }, "Virtual waiting room")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      ...rise(120)
    }
  }, /*#__PURE__*/React.createElement(HFRing, {
    st: st,
    accent: accent
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 24,
      fontFamily: "Montserrat,sans-serif",
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-.035em",
      lineHeight: 1.12,
      ...rise(180)
    }
  }, st.headline), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 14.5,
      lineHeight: 1.62,
      color: "#64748b",
      maxWidth: 300,
      ...rise(230)
    }
  }, st.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 9999,
      background: "#fff",
      border: "1px solid #dbe3ff",
      boxShadow: "0 2px 8px rgba(15,23,42,.05)",
      padding: "8px 16px",
      ...rise(280)
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "clock",
    size: 15,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "Estimated wait"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, st.wait))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      borderRadius: 24,
      background: "#fff",
      border: "1px solid #e9edf6",
      boxShadow: "0 8px 28px rgba(15,23,42,.07)",
      padding: 16,
      ...rise(330)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement(HFProvider, {
    showPhoto: showPhoto,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, "Dr. Sarah Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b"
    }
  }, "Family Physician \xB7 CCFP")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      borderRadius: 9999,
      background: `${accent}1a`,
      color: accent,
      fontSize: 12,
      fontWeight: 600,
      padding: "6px 12px"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "video",
    size: 13,
    color: accent
  }), " Video")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "#eef1fb",
      margin: "14px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontSize: 13.5,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "calendar",
    size: 15,
    color: "#94a3b8"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "Today, 2:30 PM")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#94a3b8"
    }
  }, "Follow-up visit"))), calm && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      ...rise(380)
    }
  }, /*#__PURE__*/React.createElement(DeviceCheck, {
    accent: accent
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 20,
      ...rise(430)
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      height: 56,
      borderRadius: 17,
      border: "none",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      cursor: st.ready ? "pointer" : "not-allowed",
      background: st.ready ? `linear-gradient(135deg, ${lighten(accent, 18)}, ${accent})` : "#eef1fb",
      color: st.ready ? "#fff" : "#94a3b8",
      boxShadow: st.ready ? `0 12px 28px ${accent}55` : "none",
      transition: "all .25s"
    }
  }, st.ready && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 9,
      width: 9,
      borderRadius: 9999,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: "#fff",
      animation: "hfRipple 1.6s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement(HFIcon, {
    name: st.ready ? "video" : "lock",
    size: 18,
    color: st.ready ? "#fff" : "#94a3b8"
  }), st.ready ? "Join video call" : "Join when it's your turn"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      justifyContent: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#64748b",
      fontSize: 13.5,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "message-circle",
    size: 15,
    color: "#94a3b8"
  }), " Message clinic"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#64748b",
      fontSize: 13.5,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(HFIcon, {
    name: "calendar-clock",
    size: 15,
    color: "#94a3b8"
  }), " Reschedule"))));
}
Object.assign(window, {
  HFIcon,
  HF_STATES,
  WaitingRoomHiFi
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/WaitingRoomHiFi.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/WaitingRoomWeb.jsx
try { (() => {
// Bimble — Patient virtual waiting room · WEB (desktop browser)
// Refined: right column is a "get ready to connect" readiness panel —
// self-view camera tile + live mic meter, camera/mic controls,
// connection-quality signal bars, and a labeled device list.
function WebIcon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      lineHeight: 0,
      ...style
    }
  });
}
const WEB_STATES = {
  inline: {
    pos: "3",
    posLabel: "ahead of you",
    headline: "You're 3rd in line",
    sub: "We'll bring you into the visit automatically when it's your turn. Keep this tab open — there's nothing you need to do.",
    wait: "about 12 min",
    progress: 0.25,
    ready: false
  },
  soon: {
    pos: "2",
    posLabel: "ahead of you",
    headline: "Almost there",
    sub: "You're moving up the queue. A good moment to settle into a quiet, well-lit room and check your camera below.",
    wait: "about 6 min",
    progress: 0.58,
    ready: false
  },
  next: {
    pos: "1",
    posLabel: "ahead of you",
    headline: "You're next",
    sub: "Your provider is wrapping up their current visit. Please stay at your computer — you'll be brought in any moment.",
    wait: "under 2 min",
    progress: 0.86,
    ready: false
  },
  ready: {
    pos: "",
    posLabel: "",
    headline: "Dr. Chen is ready for you",
    sub: "Your provider is ready to begin. Your camera and microphone are connected and working.",
    wait: "now",
    progress: 1,
    ready: true
  }
};
function webLighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.min(255, (n >> 16) + amt),
    g = Math.min(255, (n >> 8 & 0xff) + amt),
    b = Math.min(255, (n & 0xff) + amt);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

// ── Left column status ring ──────────────────────────────────────────────────
function WebRing({
  st,
  accent
}) {
  const size = 240,
    stroke = 16,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  const gid = "webgrad",
    lite = webLighten(accent, 46);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 22,
      borderRadius: 9999,
      background: accent,
      opacity: 0.13,
      filter: "blur(34px)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      position: "relative",
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: accent
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: lite
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(15,23,42,0.05)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: `url(#${gid})`,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - st.progress),
    style: {
      transition: "stroke-dashoffset .8s cubic-bezier(.34,1.2,.4,1)",
      filter: `drop-shadow(0 8px 16px ${accent}44)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    key: st.headline,
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      animation: "webPop .5s cubic-bezier(.34,1.3,.5,1)"
    }
  }, st.ready ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: 96,
      width: 96,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: accent,
      boxShadow: `0 14px 30px ${accent}55`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      border: `2px solid ${accent}`,
      animation: "webRipple 1.8s ease-out infinite"
    }
  }), /*#__PURE__*/React.createElement(WebIcon, {
    name: "video",
    size: 44,
    color: "#fff"
  })) : st.pos === "1" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WebIcon, {
    name: "bell-ring",
    size: 40,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 10,
      fontFamily: "Inter",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      color: "#64748b"
    }
  }, "You're next")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "Montserrat,sans-serif",
      fontSize: 88,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-.05em",
      color: "#0f172a"
    }
  }, st.pos), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: ".15em",
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, st.posLabel))));
}

// ── Compact appointment strip (top of right column) ──────────────────────────
function WebProviderStrip({
  showPhoto,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 46,
      height: 46,
      flex: "none"
    }
  }, showPhoto ? /*#__PURE__*/React.createElement("image-slot", {
    id: "web-provider",
    style: {
      width: 46,
      height: 46
    },
    shape: "circle",
    placeholder: "Photo"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 9999,
      background: `linear-gradient(135deg, ${webLighten(accent, 30)}, ${accent})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Montserrat,sans-serif",
      fontWeight: 600,
      fontSize: 17,
      color: "#fff"
    }
  }, "SC"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      display: "flex",
      height: 18,
      width: 18,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "#fff",
      boxShadow: "0 1px 3px rgba(15,23,42,.2)"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "badge-check",
    size: 14,
    color: accent
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1.25
    }
  }, "Dr. Sarah Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#64748b",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "Family Physician \xB7 CCFP"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 3,
      height: 3,
      borderRadius: 9999,
      background: "#cbd5e1"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "calendar",
    size: 13,
    color: "#94a3b8"
  }), " Today, 2:30 PM"))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 9999,
      background: `${accent}1a`,
      color: accent,
      fontSize: 12.5,
      fontWeight: 600,
      padding: "7px 13px",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "video",
    size: 14,
    color: accent
  }), " Video visit"));
}

// ── Live mic level meter (animated bars) ─────────────────────────────────────
function MicMeter({
  color = "#fff",
  muted = false
}) {
  const bars = [0, 1, 2, 3, 4];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height: 18
    }
  }, bars.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 3,
      height: 18,
      borderRadius: 9999,
      background: muted ? "rgba(255,255,255,.4)" : color,
      transformOrigin: "bottom",
      animation: muted ? "none" : `micBar 1.1s ${i * 0.13}s ease-in-out infinite`,
      transform: muted ? "scaleY(.22)" : undefined
    }
  })));
}

// ── Self-view camera tile ────────────────────────────────────────────────────
function SelfView({
  selfView,
  micOn,
  accent,
  ready
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: "2 / 1",
      borderRadius: 20,
      overflow: "hidden",
      background: "linear-gradient(150deg,#1e293b,#0f172a)",
      border: ready ? `2px solid ${accent}` : "1px solid #e9edf6",
      boxShadow: ready ? `0 0 0 4px ${accent}22, 0 10px 30px rgba(15,23,42,.12)` : "0 6px 20px rgba(15,23,42,.10)",
      transition: "border .25s, box-shadow .25s"
    }
  }, selfView ? /*#__PURE__*/React.createElement("image-slot", {
    id: "web-selfview",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%"
    },
    shape: "rect",
    fit: "cover",
    placeholder: "Your camera"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      color: "rgba(255,255,255,.65)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 52,
      width: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "rgba(255,255,255,.10)"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "video-off",
    size: 24,
    color: "rgba(255,255,255,.7)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 500
    }
  }, "Camera is off")), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 12,
      left: 13,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,.82)",
      textShadow: "0 1px 4px rgba(0,0,0,.4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 9999,
      background: "#f87171",
      boxShadow: "0 0 0 3px rgba(248,113,113,.25)"
    }
  }), "Self view"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 13,
      bottom: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      borderRadius: 9999,
      padding: "6px 11px 6px 9px",
      background: "rgba(15,23,42,.55)",
      backdropFilter: "blur(8px)",
      color: "#fff",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: micOn ? "mic" : "mic-off",
    size: 13,
    color: "#fff"
  }), "You"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 13,
      bottom: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 9999,
      padding: "7px 12px",
      background: "rgba(15,23,42,.55)",
      backdropFilter: "blur(8px)"
    }
  }, /*#__PURE__*/React.createElement(MicMeter, {
    color: accent === "#5c70ff" ? "#a5b2ff" : webLighten(accent, 60),
    muted: !micOn
  })));
}

// ── Camera / Mic toggle controls under the tile ──────────────────────────────
function ReadyControls({
  selfView,
  micOn,
  accent
}) {
  const Chip = ({
    on,
    iconOn,
    iconOff,
    label
  }) => /*#__PURE__*/React.createElement("button", {
    style: {
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 42,
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "Inter",
      fontSize: 13.5,
      fontWeight: 600,
      border: on ? "1px solid #dbe3ff" : "1px solid #fde2e4",
      background: on ? "#fff" : "#fff5f5",
      color: on ? "#334155" : "#b4404a",
      boxShadow: "0 1px 2px rgba(15,23,42,.05)"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: on ? iconOn : iconOff,
    size: 16,
    color: on ? accent : "#d4546a"
  }), label, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      height: 16,
      width: 16,
      borderRadius: 9999,
      background: on ? "#16a34a" : "transparent"
    }
  }, on && /*#__PURE__*/React.createElement(WebIcon, {
    name: "check",
    size: 11,
    color: "#fff"
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    on: selfView,
    iconOn: "video",
    iconOff: "video-off",
    label: selfView ? "Camera on" : "Camera off"
  }), /*#__PURE__*/React.createElement(Chip, {
    on: micOn,
    iconOn: "mic",
    iconOff: "mic-off",
    label: micOn ? "Mic on" : "Mic muted"
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 42,
      height: 42,
      flex: "none",
      borderRadius: 12,
      border: "1px solid #e9edf6",
      background: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 1px 2px rgba(15,23,42,.05)"
    },
    title: "Device settings"
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "settings",
    size: 17,
    color: "#64748b"
  })));
}

// ── Connection quality signal bars ───────────────────────────────────────────
function SignalBars({
  strong,
  accent
}) {
  const heights = [8, 12, 16, 20];
  const active = strong ? 4 : 2;
  const col = strong ? accent : "#d97706";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height: 20
    }
  }, heights.map((h, i) => {
    const on = i < active;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        width: 4,
        height: h,
        borderRadius: 2,
        background: on ? col : "#e2e8f0",
        animation: on && i === active - 1 ? "signalPulse 1.6s ease-in-out infinite" : "none"
      }
    });
  }));
}
function ConnQuality({
  strong,
  accent
}) {
  const col = strong ? accent : "#d97706";
  const bg = strong ? `${accent}0f` : "#fffbeb";
  const bd = strong ? "#dbe3ff" : "#fde9c8";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      background: bg,
      border: `1px solid ${bd}`,
      padding: "12px 15px"
    }
  }, /*#__PURE__*/React.createElement(SignalBars, {
    strong: strong,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      color: strong ? "#0f172a" : "#92400e"
    }
  }, strong ? "Strong connection" : "Connection is a little weak"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: strong ? "#64748b" : "#b45309"
    }
  }, strong ? "Stable · 24 ms latency" : "Try moving closer to your router")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 12.5,
      fontWeight: 600,
      color: col
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: strong ? "wifi" : "wifi-low",
    size: 15,
    color: col
  }), strong ? "Excellent" : "Fair"));
}

// ── Calm device readiness rows (NOT in-call controls) ────────────────────────
function WebDeviceList({
  accent,
  micOn,
  cameraReady
}) {
  const items = [{
    ic: cameraReady ? "video" : "video-off",
    label: "Camera",
    detail: cameraReady ? "FaceTime HD Camera" : "Camera is turned off",
    ok: cameraReady,
    meter: false
  }, {
    ic: micOn ? "mic" : "mic-off",
    label: "Microphone",
    detail: "MacBook Pro Microphone",
    ok: micOn,
    meter: true
  }, {
    ic: "volume-2",
    label: "Speaker",
    detail: "MacBook Pro Speakers",
    ok: true,
    meter: false
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      borderRadius: 14,
      background: "#fff",
      border: "1px solid #eef1fb",
      padding: "12px 15px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 38,
      width: 38,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      background: it.ok ? `${accent}12` : "#fff5f5"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: it.ic,
    size: 18,
    color: it.ok ? accent : "#d4546a"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#1e293b",
      lineHeight: 1.25
    }
  }, it.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "#94a3b8",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, it.detail)), it.meter && it.ok && /*#__PURE__*/React.createElement(DotMeter, {
    accent: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flex: "none",
      fontSize: 12.5,
      fontWeight: 600,
      color: it.ok ? "#16a34a" : "#d4546a"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: it.ok ? "check-circle-2" : "alert-circle",
    size: 16,
    color: it.ok ? "#16a34a" : "#d4546a"
  }), it.ok ? "Ready" : "Off"))));
}

// tiny calm audio activity dots (reassurance, not a control)
function DotMeter({
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height: 16,
      flex: "none"
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 3,
      height: 16,
      borderRadius: 9999,
      background: webLighten(accent, 20),
      transformOrigin: "bottom",
      animation: `micBar 1.2s ${i * 0.15}s ease-in-out infinite`
    }
  })));
}
function SectionLabel({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".18em",
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, children), right);
}
function WaitingRoomWeb({
  stateKey = "inline",
  accent = "#5c70ff",
  density = "calm",
  showPhoto = false,
  selfView = true,
  connection = "strong"
}) {
  const st = WEB_STATES[stateKey];
  const calm = density === "calm";
  const strong = connection !== "unstable";
  const micOn = true;
  const allReady = selfView && micOn && strong;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      fontFamily: "Inter,system-ui,sans-serif",
      color: "#0f172a",
      background: `radial-gradient(110% 70% at 50% -10%, ${accent}1c 0%, ${accent}08 24%, #FAFCFB 50%), #FAFCFB`,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "18px 32px",
      borderBottom: "1px solid #e9edf6",
      background: "rgba(255,255,255,.8)",
      backdropFilter: "blur(10px)",
      position: "sticky",
      top: 0,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 34,
      width: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      background: accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15
    }
  }, "B"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "Bimble Downtown Clinic")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: "#16a34a",
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 7,
      width: 7,
      borderRadius: 9999,
      background: "#16a34a"
    }
  }), " Secure connection"), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "8px 14px",
      fontSize: 13.5,
      fontWeight: 500,
      color: "#475569",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "help-circle",
    size: 16,
    color: "#64748b"
  }), " Help"))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "22px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 8,
      width: 8,
      borderRadius: 9999,
      background: accent
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: accent,
      animation: "webRipple 1.8s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: ".28em",
      textTransform: "uppercase",
      color: accent
    }
  }, "Virtual waiting room"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      width: "100%",
      maxWidth: 1000,
      borderRadius: 28,
      background: "#fff",
      border: "1px solid #e9edf6",
      boxShadow: "0 24px 60px rgba(15,23,42,.09)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "web-hero",
    style: {
      display: "grid",
      gridTemplateColumns: "0.82fr 1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "52px 44px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
      borderRight: "1px solid #eef1fb",
      background: "linear-gradient(180deg,#fff, #fcfdff)"
    }
  }, /*#__PURE__*/React.createElement(WebRing, {
    st: st,
    accent: accent
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 30,
      fontFamily: "Montserrat,sans-serif",
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: "-.035em",
      lineHeight: 1.12
    }
  }, st.headline), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontSize: 15,
      lineHeight: 1.65,
      color: "#64748b",
      maxWidth: 320
    }
  }, st.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      borderRadius: 9999,
      background: "#f8fafc",
      border: "1px solid #dbe3ff",
      padding: "9px 18px"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "clock",
    size: 16,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#64748b"
    }
  }, "Estimated wait"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, st.wait))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "30px 36px",
      display: "flex",
      flexDirection: "column",
      gap: 17
    }
  }, /*#__PURE__*/React.createElement(WebProviderStrip, {
    showPhoto: showPhoto,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "#eef1fb"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: allReady ? "#16a34a" : "#d97706"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 9999,
        background: allReady ? "#16a34a" : "#d97706"
      }
    }), allReady ? "All checks passed" : "Needs attention")
  }, "Device & connection check"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      borderRadius: 16,
      padding: "15px 17px",
      background: allReady ? `${accent}0d` : "#fffbeb",
      border: `1px solid ${allReady ? "#dbe3ff" : "#fde9c8"}`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 44,
      width: 44,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 13,
      background: allReady ? accent : "#f59e0b",
      boxShadow: `0 6px 14px ${allReady ? accent + "44" : "rgba(245,158,11,.3)"}`
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: allReady ? "shield-check" : "shield-alert",
    size: 22,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600,
      color: allReady ? "#0f172a" : "#92400e"
    }
  }, allReady ? "You're ready to be seen" : "Almost ready"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: allReady ? "#64748b" : "#b45309",
      lineHeight: 1.4
    }
  }, allReady ? "Camera, microphone and connection all look good — no action needed." : "We found something to check before your visit begins."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(ConnQuality, {
    strong: strong,
    accent: accent
  })), calm && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(WebDeviceList, {
    accent: accent,
    micOn: micOn,
    cameraReady: selfView
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      height: 56,
      borderRadius: 15,
      border: "none",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      cursor: st.ready ? "pointer" : "not-allowed",
      background: st.ready ? `linear-gradient(135deg, ${webLighten(accent, 18)}, ${accent})` : "#eef1fb",
      color: st.ready ? "#fff" : "#94a3b8",
      boxShadow: st.ready ? `0 12px 28px ${accent}55` : "none",
      transition: "all .25s"
    }
  }, st.ready && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 9,
      width: 9,
      borderRadius: 9999,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: "#fff",
      animation: "webRipple 1.6s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement(WebIcon, {
    name: st.ready ? "video" : "lock",
    size: 18,
    color: st.ready ? "#fff" : "#94a3b8"
  }), st.ready ? "Join video call" : "Join when it's your turn"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      justifyContent: "center",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      color: "#64748b",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "message-circle",
    size: 16,
    color: "#94a3b8"
  }), " Message clinic"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      color: "#64748b",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "calendar-clock",
    size: 16,
    color: "#94a3b8"
  }), " Reschedule")))))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      fontSize: 13,
      color: "#94a3b8",
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "shield-check",
    size: 15,
    color: "#cbd5e1"
  }), " Your connection is private and end-to-end encrypted.")));
}
Object.assign(window, {
  WebIcon,
  WEB_STATES,
  WaitingRoomWeb
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/WaitingRoomWeb.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/WaitingRoomWeb.v1.jsx
try { (() => {
// Bimble — Patient virtual waiting room · WEB (desktop browser)
function WebIcon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      lineHeight: 0,
      ...style
    }
  });
}
const WEB_STATES = {
  inline: {
    pos: "3",
    posLabel: "ahead of you",
    headline: "You're 3rd in line",
    sub: "We'll bring you into the visit automatically when it's your turn. You can keep this tab open in the background.",
    wait: "about 12 min",
    progress: 0.25,
    ready: false
  },
  soon: {
    pos: "2",
    posLabel: "ahead of you",
    headline: "Almost there",
    sub: "You're moving up the queue. A good moment to settle into a quiet, well-lit room.",
    wait: "about 6 min",
    progress: 0.58,
    ready: false
  },
  next: {
    pos: "1",
    posLabel: "ahead of you",
    headline: "You're next",
    sub: "Your provider is wrapping up their current visit. Please stay at your computer — you'll be brought in any moment.",
    wait: "under 2 min",
    progress: 0.86,
    ready: false
  },
  ready: {
    pos: "",
    posLabel: "",
    headline: "Dr. Chen is ready for you",
    sub: "Your provider is ready to begin. Your camera and microphone are connected and working.",
    wait: "now",
    progress: 1,
    ready: true
  }
};
function webLighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.min(255, (n >> 16) + amt),
    g = Math.min(255, (n >> 8 & 0xff) + amt),
    b = Math.min(255, (n & 0xff) + amt);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}
function WebRing({
  st,
  accent
}) {
  const size = 240,
    stroke = 16,
    r = (size - stroke) / 2,
    c = 2 * Math.PI * r;
  const gid = "webgrad",
    lite = webLighten(accent, 46);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 22,
      borderRadius: 9999,
      background: accent,
      opacity: 0.13,
      filter: "blur(34px)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      position: "relative",
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: accent
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: lite
  }))), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(15,23,42,0.05)",
    strokeWidth: stroke
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: `url(#${gid})`,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeDasharray: c,
    strokeDashoffset: c * (1 - st.progress),
    style: {
      transition: "stroke-dashoffset .8s cubic-bezier(.34,1.2,.4,1)",
      filter: `drop-shadow(0 8px 16px ${accent}44)`
    }
  })), /*#__PURE__*/React.createElement("div", {
    key: st.headline,
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      animation: "webPop .5s cubic-bezier(.34,1.3,.5,1)"
    }
  }, st.ready ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: 96,
      width: 96,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: accent,
      boxShadow: `0 14px 30px ${accent}55`
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      border: `2px solid ${accent}`,
      animation: "webRipple 1.8s ease-out infinite"
    }
  }), /*#__PURE__*/React.createElement(WebIcon, {
    name: "video",
    size: 44,
    color: "#fff"
  })) : st.pos === "1" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WebIcon, {
    name: "bell-ring",
    size: 40,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 10,
      fontFamily: "Inter",
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: ".16em",
      textTransform: "uppercase",
      color: "#64748b"
    }
  }, "You're next")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "Montserrat,sans-serif",
      fontSize: 88,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: "-.05em",
      color: "#0f172a"
    }
  }, st.pos), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 4,
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: ".15em",
      textTransform: "uppercase",
      color: "#94a3b8"
    }
  }, st.posLabel))));
}
function WebDeviceCheck({
  accent
}) {
  const items = [["video", "Camera"], ["mic", "Microphone"], ["wifi", "Connection"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, items.map(([ic, label]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      background: "#fff",
      border: "1px solid #eef1fb",
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 34,
      width: 34,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      background: `${accent}14`
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: ic,
    size: 17,
    color: accent
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 14,
      fontWeight: 500,
      color: "#334155"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#16a34a",
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      height: 18,
      width: 18,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "#16a34a"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "check",
    size: 12,
    color: "#fff"
  })), "Ready"))));
}
function WebProvider({
  showPhoto,
  accent
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 64,
      height: 64,
      flex: "none"
    }
  }, showPhoto ? /*#__PURE__*/React.createElement("image-slot", {
    id: "web-provider",
    style: {
      width: 64,
      height: 64
    },
    shape: "circle",
    placeholder: "Photo"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 64,
      height: 64,
      borderRadius: 9999,
      background: `linear-gradient(135deg, ${webLighten(accent, 30)}, ${accent})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Montserrat,sans-serif",
      fontWeight: 600,
      fontSize: 22,
      color: "#fff"
    }
  }, "SC"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -2,
      bottom: -2,
      display: "flex",
      height: 22,
      width: 22,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "#fff",
      boxShadow: "0 1px 3px rgba(15,23,42,.2)"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "badge-check",
    size: 17,
    color: accent
  })));
}
function WaitingRoomWeb({
  stateKey = "inline",
  accent = "#5c70ff",
  density = "calm",
  showPhoto = false
}) {
  const st = WEB_STATES[stateKey];
  const calm = density === "calm";
  const rise = () => ({});
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      fontFamily: "Inter,system-ui,sans-serif",
      color: "#0f172a",
      background: `radial-gradient(110% 70% at 50% -10%, ${accent}1c 0%, ${accent}08 24%, #FAFCFB 50%), #FAFCFB`,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "18px 32px",
      borderBottom: "1px solid #e9edf6",
      background: "rgba(255,255,255,.8)",
      backdropFilter: "blur(10px)",
      position: "sticky",
      top: 0,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 34,
      width: 34,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 11,
      background: accent,
      color: "#fff",
      fontWeight: 700,
      fontSize: 15
    }
  }, "B"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, "Bimble Downtown Clinic")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: "#16a34a",
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 7,
      width: 7,
      borderRadius: 9999,
      background: "#16a34a"
    }
  }), " Secure connection"), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "none",
      border: "1px solid #e2e8f0",
      borderRadius: 10,
      padding: "8px 14px",
      fontSize: 13.5,
      fontWeight: 500,
      color: "#475569",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "help-circle",
    size: 16,
    color: "#64748b"
  }), " Help"))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      ...rise(0)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 8,
      width: 8,
      borderRadius: 9999,
      background: accent
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: accent,
      animation: "webRipple 1.8s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: ".28em",
      textTransform: "uppercase",
      color: accent
    }
  }, "Virtual waiting room"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      width: "100%",
      maxWidth: 940,
      borderRadius: 28,
      background: "#fff",
      border: "1px solid #e9edf6",
      boxShadow: "0 24px 60px rgba(15,23,42,.09)",
      overflow: "hidden",
      ...rise(80)
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "web-hero",
    style: {
      display: "grid",
      gridTemplateColumns: "0.92fr 1fr"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "48px 40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      justifyContent: "center",
      borderRight: "1px solid #eef1fb"
    }
  }, /*#__PURE__*/React.createElement(WebRing, {
    st: st,
    accent: accent
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 30,
      fontFamily: "Montserrat,sans-serif",
      fontSize: 32,
      fontWeight: 600,
      letterSpacing: "-.035em",
      lineHeight: 1.12
    }
  }, st.headline), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontSize: 15.5,
      lineHeight: 1.65,
      color: "#64748b",
      maxWidth: 340
    }
  }, st.sub), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      borderRadius: 9999,
      background: "#f8fafc",
      border: "1px solid #dbe3ff",
      padding: "9px 18px"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "clock",
    size: 16,
    color: accent
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "#64748b"
    }
  }, "Estimated wait"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#0f172a"
    }
  }, st.wait))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "40px",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: ".18em",
      textTransform: "uppercase",
      color: "#94a3b8",
      marginBottom: 14
    }
  }, "Your appointment"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 15
    }
  }, /*#__PURE__*/React.createElement(WebProvider, {
    showPhoto: showPhoto,
    accent: accent
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 600
    }
  }, "Dr. Sarah Chen"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "#64748b"
    }
  }, "Family Physician \xB7 CCFP")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 9999,
      background: `${accent}1a`,
      color: accent,
      fontSize: 13,
      fontWeight: 600,
      padding: "7px 13px"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "video",
    size: 14,
    color: accent
  }), " Video visit")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 22,
      fontSize: 14,
      color: "#475569"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "calendar",
    size: 16,
    color: "#94a3b8"
  }), " Today, 2:30 PM"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "stethoscope",
    size: 16,
    color: "#94a3b8"
  }), " Follow-up visit"))), calm && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: ".18em",
      textTransform: "uppercase",
      color: "#94a3b8",
      marginBottom: 12
    }
  }, "Device check"), /*#__PURE__*/React.createElement(WebDeviceCheck, {
    accent: accent
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      width: "100%",
      height: 56,
      borderRadius: 15,
      border: "none",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      cursor: st.ready ? "pointer" : "not-allowed",
      background: st.ready ? `linear-gradient(135deg, ${webLighten(accent, 18)}, ${accent})` : "#eef1fb",
      color: st.ready ? "#fff" : "#94a3b8",
      boxShadow: st.ready ? `0 12px 28px ${accent}55` : "none",
      transition: "all .25s"
    }
  }, st.ready && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 9,
      width: 9,
      borderRadius: 9999,
      background: "#fff"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: 9999,
      background: "#fff",
      animation: "webRipple 1.6s ease-out infinite"
    }
  })), /*#__PURE__*/React.createElement(WebIcon, {
    name: st.ready ? "video" : "lock",
    size: 18,
    color: st.ready ? "#fff" : "#94a3b8"
  }), st.ready ? "Join video call" : "Join when it's your turn"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      justifyContent: "center",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      color: "#64748b",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "message-circle",
    size: 16,
    color: "#94a3b8"
  }), " Message clinic"), /*#__PURE__*/React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      color: "#64748b",
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "calendar-clock",
    size: 16,
    color: "#94a3b8"
  }), " Reschedule")))))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 22,
      fontSize: 13,
      color: "#94a3b8",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      ...rise(160)
    }
  }, /*#__PURE__*/React.createElement(WebIcon, {
    name: "shield-check",
    size: 15,
    color: "#cbd5e1"
  }), " Your connection is private and encrypted.")));
}
Object.assign(window, {
  WebIcon,
  WEB_STATES,
  WaitingRoomWeb
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/WaitingRoomWeb.v1.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/browser-window.jsx
try { (() => {
/* BEGIN USAGE */
// Chrome.jsx — Simplified Chrome browser window (dark theme, macOS)
// No dependencies, no image assets. All inline styles + inline SVG.
// Exports (to window): ChromeWindow, ChromeTabBar, ChromeToolbar, ChromeTab, ChromeTrafficLights
//
// Usage — wrap your page content in <ChromeWindow> to get the tab bar + URL bar:
//
//   <ChromeWindow width={1100} height={680} url="acme.design/pricing">
//     ...your page content...
//   </ChromeWindow>
/* END USAGE */

const CHROME_C = {
  barBg: '#202124',
  tabBg: '#35363a',
  text: '#e8eaed',
  dim: '#9aa0a6',
  urlBg: '#282a2d'
};
function ChromeTrafficLights() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '0 14px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#ff5f57'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#febc2e'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: '#28c840'
    }
  }));
}

// Single tab (active has curved scoops)
function ChromeTab({
  title = 'New Tab',
  active = false
}) {
  const curve = flip => /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "10",
    viewBox: "0 0 8 10",
    style: {
      position: 'absolute',
      bottom: 0,
      [flip ? 'right' : 'left']: -8,
      transform: flip ? 'scaleX(-1)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0 10C2 9 6 8 8 0V10H0Z",
    fill: CHROME_C.tabBg
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: 34,
      alignSelf: 'flex-end',
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: active ? CHROME_C.tabBg : 'transparent',
      borderRadius: '8px 8px 0 0',
      minWidth: 120,
      maxWidth: 220,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
      color: active ? CHROME_C.text : CHROME_C.dim
    }
  }, active && curve(false), active && curve(true), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#5f6368',
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title));
}
function ChromeTabBar({
  tabs = [{
    title: 'New Tab'
  }],
  activeIndex = 0
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: 44,
      background: CHROME_C.barBg,
      paddingRight: 8
    }
  }, /*#__PURE__*/React.createElement(ChromeTrafficLights, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      height: '100%',
      paddingLeft: 4,
      flex: 1
    }
  }, tabs.map((t, i) => /*#__PURE__*/React.createElement(ChromeTab, {
    key: i,
    title: t.title,
    active: i === activeIndex
  }))));
}
function ChromeToolbar({
  url = 'example.com'
}) {
  const iconDot = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: CHROME_C.dim,
      opacity: 0.4
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      background: CHROME_C.tabBg,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '0 8px'
    }
  }, iconDot, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 30,
      borderRadius: 15,
      background: CHROME_C.urlBg,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 14px',
      margin: '0 6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      background: CHROME_C.dim,
      opacity: 0.4
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      color: CHROME_C.text,
      fontSize: 13,
      fontFamily: 'system-ui, sans-serif'
    }
  }, url)), iconDot);
}
function ChromeWindow({
  tabs = [{
    title: 'New Tab'
  }],
  activeIndex = 0,
  url = 'example.com',
  width = 900,
  height = 600,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      background: CHROME_C.tabBg
    }
  }, /*#__PURE__*/React.createElement(ChromeTabBar, {
    tabs: tabs,
    activeIndex: activeIndex
  }), /*#__PURE__*/React.createElement(ChromeToolbar, {
    url: url
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: '#fff',
      overflow: 'auto'
    }
  }, children));
}
Object.assign(window, {
  ChromeWindow,
  ChromeTabBar,
  ChromeToolbar,
  ChromeTab,
  ChromeTrafficLights
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/browser-window.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/image-slot.js
try { (() => {
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/image-slot.js", error: String((e && e.message) || e) }); }

// patient-waiting-room/ios-frame.jsx
try { (() => {
/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/ios-frame.jsx", error: String((e && e.message) || e) }); }

// patient-waiting-room/tweaks-panel.jsx
try { (() => {
/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "patient-waiting-room/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinic-onboarding/BillingScreen.jsx
try { (() => {
// Bimble Pro — Step 2: card details
function formatCardNumber(v) {
  const d = v.replace(/\D/g, "").slice(0, 19);
  return d.match(/.{1,4}/g)?.join(" ") ?? d;
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}
function formatPostal(v) {
  const c = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  return c.length <= 3 ? c : `${c.slice(0, 3)} ${c.slice(3)}`;
}
function BillingScreen({
  plan,
  onBack,
  onContinue
}) {
  const [f, setF] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    billingPostalCode: ""
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setF(c => ({
      ...c,
      [k]: v
    }));
    setErrors(e => ({
      ...e,
      [k]: ""
    }));
  };
  function submit(e) {
    e.preventDefault();
    const er = {};
    if (!f.cardholderName.trim()) er.cardholderName = "Cardholder name is required.";
    if (f.cardNumber.replace(/\D/g, "").length < 13) er.cardNumber = "Enter a valid card number.";
    if (f.expiryDate.replace(/\D/g, "").length !== 4) er.expiryDate = "Enter the expiry date as MM/YY.";
    if (f.cvc.replace(/\D/g, "").length < 3) er.cvc = "Enter a valid CVC.";
    if (!f.billingPostalCode.trim()) er.billingPostalCode = "Billing postal code is required.";
    setErrors(er);
    if (Object.keys(er).length === 0) onContinue();
  }
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to plans",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      maxWidth: 580
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-pill",
    style: {
      marginBottom: 20
    }
  }, "Step 2 of 3"), /*#__PURE__*/React.createElement("h1", {
    className: "flow-title",
    style: {
      marginTop: 20
    }
  }, "Card details"), /*#__PURE__*/React.createElement("form", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      marginTop: 20
    },
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Cardholder name"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Clinic Finance",
    value: f.cardholderName,
    onChange: e => set("cardholderName", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.cardholderName
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Card number"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "4242 4242 4242 4242",
    inputMode: "numeric",
    value: f.cardNumber,
    onChange: e => set("cardNumber", formatCardNumber(e.target.value))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.cardNumber
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Expiry date"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "MM/YY",
    inputMode: "numeric",
    value: f.expiryDate,
    onChange: e => set("expiryDate", formatExpiry(e.target.value))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.expiryDate
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "CVC / CVV"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "123",
    inputMode: "numeric",
    value: f.cvc,
    onChange: e => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.cvc
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Billing postal code"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "V6B 1A1",
    value: f.billingPostalCode,
    onChange: e => set("billingPostalCode", formatPostal(e.target.value))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.billingPostalCode
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      paddingTop: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    style: {
      minWidth: 128
    },
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Back"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      flex: 1
    }
  }, "Start trial and continue ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  }))))));
}
Object.assign(window, {
  BillingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinic-onboarding/BillingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinic-onboarding/CredentialsLogin.jsx
try { (() => {
// Bimble Pro — generated credentials + clinic login
function genCreds(form) {
  const base = (form.clinicDisplayName || "bimble clinic").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 10) || "clinic";
  const rnd = n => Math.random().toString(36).slice(2, 2 + n);
  return {
    clinicName: form.clinicDisplayName || "Bimble Downtown Clinic",
    username: `${base}.admin`,
    password: `Bm-${rnd(6)}`,
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    internalClinicCode: `BMB-${rnd(4).toUpperCase()}`
  };
}
function CredentialsScreen({
  creds,
  onBack,
  onContinue
}) {
  const rows = [["Clinic name", creds.clinicName], ["Username", creds.username], ["Password", creds.password], ["PIN", creds.pin], ["Clinic code", creds.internalClinicCode]];
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to setup",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      maxWidth: 580
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 44,
      width: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      background: "rgba(92,112,255,.1)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 22,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "flow-title",
    style: {
      fontSize: 24
    }
  }, "Clinic credentials ready"), /*#__PURE__*/React.createElement("p", {
    className: "flow-help",
    style: {
      marginTop: 2
    }
  }, "Save these somewhere safe before you continue."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, rows.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "cred-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, v)))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    style: {
      width: "100%",
      marginTop: 20
    },
    onClick: onContinue
  }, "Continue to login ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  }))));
}
function LoginScreen({
  creds,
  onBack,
  onLoggedIn
}) {
  const [c, setC] = useState({
    clinicName: creds?.clinicName || "",
    username: creds?.username || "",
    password: creds?.password || "",
    pin: creds?.pin || ""
  });
  const [showPw, setShowPw] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setC(p => ({
    ...p,
    [k]: v
  }));
  function login() {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onLoggedIn();
    }, 900);
  }
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to plans",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 580,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "flow-title"
  }, "Clinic Login")), /*#__PURE__*/React.createElement("form", {
    className: "panel",
    style: {
      maxWidth: 580,
      display: "flex",
      flexDirection: "column",
      gap: 24
    },
    onSubmit: e => {
      e.preventDefault();
      login();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Clinic Name"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: c.clinicName,
    onChange: e => set("clinicName", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Username"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    value: c.username,
    onChange: e => set("username", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-row"
  }, /*#__PURE__*/React.createElement("label", null, "Password"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "link-btn",
    onClick: () => setShowPw(s => !s)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: showPw ? "eye-off" : "eye",
    size: 16,
    color: "var(--primary)"
  }), showPw ? "Hide" : "Show")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: showPw ? "text" : "password",
    value: c.password,
    onChange: e => set("password", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-row"
  }, /*#__PURE__*/React.createElement("label", null, "PIN"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "link-btn",
    onClick: () => setShowPin(s => !s)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: showPin ? "eye-off" : "eye",
    size: 16,
    color: "var(--primary)"
  }), showPin ? "Hide" : "Show")), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: showPin ? "text" : "password",
    inputMode: "numeric",
    maxLength: 4,
    value: c.pin,
    onChange: e => set("pin", e.target.value.replace(/\D/g, "").slice(0, 4))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    style: {
      minWidth: 144
    },
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Back"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      flex: 1
    },
    disabled: busy
  }, busy ? "Logging in..." : "Login", " ", !busy && /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  })))));
}
function DashboardScreen({
  creds,
  onBack
}) {
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to login",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel",
    style: {
      maxWidth: 580,
      textAlign: "center",
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 56,
      width: 56,
      margin: "0 auto 16px",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      background: "rgba(92,112,255,.1)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 28,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("h1", {
    className: "flow-title",
    style: {
      fontSize: 24
    }
  }, "You're in, ", creds?.clinicName || "clinic", "."), /*#__PURE__*/React.createElement("p", {
    className: "flow-help",
    style: {
      marginTop: 8
    }
  }, "In the real product this hands off to the clinic dashboard. This kit ends the prototype flow here."), /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    className: "btn btn-outline",
    style: {
      marginTop: 24,
      display: "inline-flex"
    }
  }, "Back to marketing site")));
}
Object.assign(window, {
  genCreds,
  CredentialsScreen,
  LoginScreen,
  DashboardScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinic-onboarding/CredentialsLogin.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinic-onboarding/PlanScreen.jsx
try { (() => {
// Bimble Pro — Step 1: choose plan
const clinicPlans = [{
  id: "standard",
  name: "Standard",
  subtitle: "Everything a clinic needs to get started.",
  priceLabel: "CAD 149 / month",
  billingInterval: "Billed monthly after the trial",
  trialDays: 90,
  features: ["90-day free trial", "Clinic setup workflow", "Core scheduling tools", "Email support"]
}, {
  id: "premium",
  name: "Premium",
  subtitle: "For clinics that want more automation and support.",
  priceLabel: "CAD 249 / month",
  billingInterval: "Billed monthly after the trial",
  trialDays: 90,
  features: ["90-day free trial", "Everything in Standard", "Priority support", "Advanced workflow automation"],
  recommended: true
}];
function PlanCard({
  plan,
  selected,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "plan" + (selected ? " selected" : "")
  }, plan.recommended && /*#__PURE__*/React.createElement("div", {
    className: "plan-badge"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 13,
    color: "#fff"
  }), " Recommended"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      paddingRight: 96
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-.02em"
    }
  }, plan.name), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 1.5,
      color: "var(--muted-fg)"
    }
  }, plan.subtitle)), /*#__PURE__*/React.createElement("div", {
    className: "plan-price"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 22,
      fontWeight: 600
    }
  }, plan.priceLabel), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, plan.billingInterval)), /*#__PURE__*/React.createElement("div", {
    className: "plan-trial"
  }, "Includes a ", plan.trialDays, "-day trial. Autopay starts after the trial ends."), /*#__PURE__*/React.createElement("ul", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      listStyle: "none"
    }
  }, plan.features.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: "flex",
      gap: 8,
      fontSize: 14,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "var(--primary)",
    style: {
      marginTop: 1,
      flex: "none"
    }
  }), f)))), /*#__PURE__*/React.createElement("button", {
    className: "btn " + (selected ? "btn-primary" : "btn-dark"),
    style: {
      marginTop: 24
    },
    onClick: onSelect
  }, selected ? "Continue with this plan" : "Choose plan"));
}
function PlanScreen({
  selectedId,
  onSelect,
  onBack
}) {
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to home",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-pill"
  }, "Step 1 of 3"), /*#__PURE__*/React.createElement("h1", {
    className: "flow-title",
    style: {
      fontSize: 36
    }
  }, "Choose your plan")), /*#__PURE__*/React.createElement("div", {
    className: "plan-grid"
  }, clinicPlans.map(p => /*#__PURE__*/React.createElement(PlanCard, {
    key: p.id,
    plan: p,
    selected: selectedId === p.id,
    onSelect: () => onSelect(p)
  })))));
}
Object.assign(window, {
  clinicPlans,
  PlanCard,
  PlanScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinic-onboarding/PlanScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinic-onboarding/SetupScreen.jsx
try { (() => {
// Bimble Pro — Step 3: 3-step clinic setup form
const provinceOptions = ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"];
const clinicTypeOptions = ["Family Practice", "Walk-In Clinic", "Specialty Clinic", "Urgent Care", "Multi-Specialty Clinic", "Community Health Centre", "Virtual Care Clinic"];
const stepOrder = ["clinic", "location", "operations"];
const stepTitles = {
  clinic: "Set up your clinic",
  location: "Add clinic location",
  operations: "Add contact details"
};
const stepHelpers = {
  clinic: "Enter the clinic identity details.",
  location: "Add the clinic address and postal code.",
  operations: "Finish with the contact and service details."
};
function fmtPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
function fmtPostal(v) {
  const c = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
  return c.length <= 3 ? c : `${c.slice(0, 3)} ${c.slice(3)}`;
}
function SetupScreen({
  plan,
  onBack,
  onComplete
}) {
  const [step, setStep] = useState("clinic");
  const [f, setF] = useState({
    clinicLegalName: "",
    clinicDisplayName: "",
    establishedYear: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    email: "",
    phoneNumber: "",
    clinicType: "",
    servicesProvided: ""
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setF(c => ({
      ...c,
      [k]: v
    }));
    setErrors(e => ({
      ...e,
      [k]: ""
    }));
  };
  const idx = stepOrder.indexOf(step);
  const isFirst = idx === 0,
    isFinal = idx === stepOrder.length - 1;
  function validate() {
    const er = {};
    if (step === "clinic") {
      if (!f.clinicLegalName.trim()) er.clinicLegalName = "Clinic legal name is required.";
      if (!f.clinicDisplayName.trim()) er.clinicDisplayName = "Clinic display name is required.";
      if (!f.establishedYear.trim()) er.establishedYear = "Established year is required.";
    } else if (step === "location") {
      if (!f.address.trim()) er.address = "Address is required.";
      if (!f.city.trim()) er.city = "City is required.";
      if (!f.province.trim()) er.province = "Province is required.";
      if (!f.postalCode.trim()) er.postalCode = "Postal code is required.";
    } else {
      if (!f.email.trim()) er.email = "Email is required.";
      if (f.phoneNumber.replace(/\D/g, "").length !== 10) er.phoneNumber = "Enter a valid 10-digit phone number.";
      if (!f.clinicType.trim()) er.clinicType = "Type of clinic is required.";
      if (!f.servicesProvided.trim()) er.servicesProvided = "Services provided is required.";
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  }
  function next(e) {
    e.preventDefault();
    if (!validate()) return;
    if (isFinal) onComplete(f);else setStep(stepOrder[idx + 1]);
  }
  return /*#__PURE__*/React.createElement(Shell, {
    backLabel: "Back to billing",
    onBack: onBack
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      marginBottom: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "flow-title",
    style: {
      fontSize: 28
    }
  }, stepTitles[step]), /*#__PURE__*/React.createElement("p", {
    className: "flow-help"
  }, stepHelpers[step])), /*#__PURE__*/React.createElement("div", {
    className: "progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-fill",
    style: {
      width: `${(idx + 1) / stepOrder.length * 100}%`
    }
  })), plan && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, "Plan: ", plan.name), /*#__PURE__*/React.createElement("span", {
    className: "chip"
  }, plan.trialDays, "-day trial active"))), /*#__PURE__*/React.createElement("div", {
    className: "panel"
  }, /*#__PURE__*/React.createElement("form", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    },
    onSubmit: next
  }, step === "clinic" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Clinic Legal Name"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Bimble Health Services Ltd.",
    value: f.clinicLegalName,
    onChange: e => set("clinicLegalName", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.clinicLegalName
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Clinic Display Name"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Bimble Downtown Clinic",
    value: f.clinicDisplayName,
    onChange: e => set("clinicDisplayName", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.clinicDisplayName
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Establish Year"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "2016",
    inputMode: "numeric",
    value: f.establishedYear,
    onChange: e => set("establishedYear", e.target.value.replace(/\D/g, "").slice(0, 4))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.establishedYear
  }))), step === "location" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Address"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Enter the full clinic address",
    value: f.address,
    onChange: e => set("address", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.address
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "City"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "Vancouver",
    value: f.city,
    onChange: e => set("city", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.city
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Province"), /*#__PURE__*/React.createElement("select", {
    className: "sel",
    value: f.province,
    onChange: e => set("province", e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select province"), provinceOptions.map(p => /*#__PURE__*/React.createElement("option", {
    key: p,
    value: p
  }, p))), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.province
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Postal Code"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    placeholder: "V6B 1A1",
    value: f.postalCode,
    onChange: e => set("postalCode", fmtPostal(e.target.value))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.postalCode
  }))), step === "operations" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Email"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "email",
    placeholder: "clinic@bimble.health",
    value: f.email,
    onChange: e => set("email", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.email
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Phone Number"), /*#__PURE__*/React.createElement("input", {
    className: "inp",
    type: "tel",
    placeholder: "604 555 0142",
    value: f.phoneNumber,
    onChange: e => set("phoneNumber", fmtPhone(e.target.value))
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.phoneNumber
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Type of Clinic"), /*#__PURE__*/React.createElement("select", {
    className: "sel",
    value: f.clinicType,
    onChange: e => set("clinicType", e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Select clinic type"), clinicTypeOptions.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.clinicType
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Service Provided"), /*#__PURE__*/React.createElement("textarea", {
    className: "ta",
    placeholder: "Describe the services provided by the clinic",
    value: f.servicesProvided,
    onChange: e => set("servicesProvided", e.target.value)
  }), /*#__PURE__*/React.createElement(FieldError, {
    message: errors.servicesProvided
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      paddingTop: 8,
      flexWrap: "wrap"
    }
  }, !isFirst && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline",
    style: {
      minWidth: 128
    },
    onClick: () => setStep(stepOrder[idx - 1])
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), " Back"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn-primary",
    style: {
      flex: 1
    }
  }, isFinal ? "Submit onboarding" : /*#__PURE__*/React.createElement(React.Fragment, null, "Continue ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  })))))));
}
Object.assign(window, {
  SetupScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinic-onboarding/SetupScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/clinic-onboarding/Shell.jsx
try { (() => {
// Bimble Pro — flow shell + Icon helper
const {
  useState
} = React;
function Icon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      ...style
    }
  });
}
function Shell({
  backLabel,
  onBack,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh"
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "shell-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "shell-top-inner"
  }, /*#__PURE__*/React.createElement("a", {
    href: "../marketing/index.html",
    className: "shell-brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "shell-mark"
  }, "B"), /*#__PURE__*/React.createElement("span", {
    className: "shell-name"
  }, "Bimble")))), /*#__PURE__*/React.createElement("main", {
    className: "shell-main"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), backLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 0"
    }
  }, children))));
}
function FieldError({
  message
}) {
  if (!message) return null;
  return /*#__PURE__*/React.createElement("p", {
    className: "err"
  }, message);
}
Object.assign(window, {
  Icon,
  Shell,
  FieldError
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/clinic-onboarding/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Footer.jsx
try { (() => {
// Bimble marketing — dark footer
const footerCols = [{
  h: "For Patients",
  links: ["Book Appointment", "Manage Care", "Patient Portal", "FAQ"]
}, {
  h: "For Clinics",
  links: ["Clinic Register", "Workflow Automation", "Provider Login", "How It Works"]
}, {
  h: "Resources",
  links: ["Articles", "Knowledge Base", "E-Learning", "Pricing"]
}, {
  h: "More",
  links: ["About Bimble", "Careers", "Privacy Policy", "Terms of Service"]
}];
function Footer({
  onRegister
}) {
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 48,
      gridTemplateColumns: "1.15fr .85fr"
    },
    className: "foot-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(BrandMark, {
    onInk: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 520,
      fontSize: 14,
      lineHeight: 1.7,
      color: "rgba(255,255,255,.7)"
    }
  }, "Bimble brings booking, verification, documentation, and recovery together so patients and clinics can move through care with less friction."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#book-demo",
    className: "btn btn-primary btn-sm"
  }, "Book a Demo ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    style: {
      background: "rgba(255,255,255,.05)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.15)"
    },
    onClick: onRegister
  }, "Clinic Register"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 32,
      gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))"
    }
  }, footerCols.map(col => /*#__PURE__*/React.createElement("div", {
    key: col.h
  }, /*#__PURE__*/React.createElement("h3", null, col.h), /*#__PURE__*/React.createElement("ul", null, col.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#"
  }, l)))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 56,
      borderTop: "1px solid rgba(255,255,255,.1)",
      paddingTop: 32,
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,.55)"
    }
  }, "\xA9 2026 Bimble Health. All rights reserved."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#faq",
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,.55)"
    }
  }, "FAQ"), /*#__PURE__*/React.createElement("a", {
    href: "#book-demo",
    style: {
      fontSize: 14,
      color: "rgba(255,255,255,.55)"
    }
  }, "Book a Demo")))));
}
Object.assign(window, {
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Header.jsx
try { (() => {
// Bimble marketing — Header with working mobile menu
const {
  useState
} = React;
function Icon({
  name,
  size = 20,
  color,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const el = document.createElement("i");
      el.setAttribute("data-lucide", name);
      ref.current.appendChild(el);
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size
        },
        nameAttr: "data-lucide"
      });
      const svg = ref.current.querySelector("svg");
      if (svg && color) svg.style.color = color;
    }
  }, [name, size, color]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    style: {
      display: "inline-flex",
      ...style
    }
  });
}
function BrandMark({
  onInk
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: "#hero",
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-mark"
  }, "B"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "brand-name",
    style: {
      color: onInk ? "#fff" : "var(--foreground)"
    }
  }, "Bimble"), /*#__PURE__*/React.createElement("span", {
    className: "brand-kicker",
    style: {
      display: "block",
      color: onInk ? "rgba(255,255,255,.6)" : "var(--muted-fg)"
    }
  }, "Healthcare platform")));
}
const navItems = [{
  href: "#who-we-serve",
  label: "For Patients"
}, {
  href: "#clinics",
  label: "For Clinics"
}, {
  href: "#faq",
  label: "Resources"
}, {
  href: "#login",
  label: "Sign in"
}];
function Header({
  onRegister
}) {
  const [open, setOpen] = useState(false);
  return /*#__PURE__*/React.createElement("header", {
    className: "hdr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hdr-inner"
  }, /*#__PURE__*/React.createElement(BrandMark, null), /*#__PURE__*/React.createElement("nav", {
    className: "nav"
  }, navItems.map(i => /*#__PURE__*/React.createElement("a", {
    key: i.label,
    href: i.href
  }, i.label))), /*#__PURE__*/React.createElement("div", {
    className: "hdr-cta"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#login",
    className: "btn btn-outline btn-sm"
  }, "Sign in"), /*#__PURE__*/React.createElement("a", {
    href: "#book-demo",
    className: "btn btn-outline btn-sm"
  }, "Book a Demo"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary btn-sm",
    onClick: onRegister
  }, "Clinic Register")), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn menu",
    onClick: () => setOpen(o => !o),
    "aria-label": "Menu"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open ? "x" : "menu",
    size: 24
  }))), open && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(219,227,255,.7)",
      padding: "16px 0 20px"
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, navItems.map(i => /*#__PURE__*/React.createElement("a", {
    key: i.label,
    href: i.href,
    onClick: () => setOpen(false),
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 12,
      padding: "12px 16px",
      fontSize: 14,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", null, i.label), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--muted-fg)"
  }))), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    style: {
      marginTop: 12
    },
    onClick: onRegister
  }, "Clinic Register")))));
}
Object.assign(window, {
  Icon,
  BrandMark,
  Header
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
// Bimble marketing — Hero with floating product-peek cards
function Hero({
  onRegister
}) {
  const bookingCells = [["Patient", "Verified"], ["Visit type", "Walk-in"], ["Pharmacy", "Selected"], ["Status", "Ready"]];
  const summaryRows = ["Structured note draft", "Follow-up tasks", "Prescription summary"];
  return /*#__PURE__*/React.createElement("section", {
    id: "hero",
    className: "section",
    style: {
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-grid hero"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      fontWeight: 500,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), " Trusted by clinics that want calmer care workflows"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("h1", null, "Healthcare that stays connected, from your first click to final recovery."), /*#__PURE__*/React.createElement("p", {
    className: "lead hero-sub"
  }, "Bimble brings booking, verification, AI-assisted documentation, and recovery workflows together so patients and clinics can move through care with less friction.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#book-demo",
    className: "btn btn-primary"
  }, "Book an Appointment ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 16,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-outline",
    onClick: onRegister
  }, "Clinic Register"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "orb"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "peek"
  }, /*#__PURE__*/React.createElement("div", {
    className: "peek-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Booking view"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: 600
    }
  }, "Secure appointment booking")), /*#__PURE__*/React.createElement("span", {
    className: "pill pill-primary"
  }, "Live")), /*#__PURE__*/React.createElement("div", {
    className: "mini",
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, bookingCells.map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    className: "mini-cell"
  }, /*#__PURE__*/React.createElement("p", {
    className: "cap"
  }, l), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4,
      fontSize: 14,
      fontWeight: 600
    }
  }, v)))))), /*#__PURE__*/React.createElement("div", {
    className: "peek"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Visit summary"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 4,
      fontSize: 18,
      fontWeight: 600
    }
  }, "AI-assisted documentation"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, summaryRows.map((item, n) => /*#__PURE__*/React.createElement("div", {
    key: item,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      border: "1px solid var(--border)",
      background: "var(--slate-50)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 36,
      width: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "rgba(92,112,255,.1)",
      color: "var(--primary)",
      fontSize: 14,
      fontWeight: 600,
      flex: "none"
    }
  }, n + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, item), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--muted-fg)"
    }
  }, "Less typing, more time with the patient.")))))))))));
}
Object.assign(window, {
  Hero
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Sections.jsx
try { (() => {
// Bimble marketing — Who We Serve, How It Works, Benefits
const audiences = ["Patients", "Doctors", "Clinics", "Care teams", "Pharmacies", "Virtual care"];
function ProblemSection() {
  const patient = ["Book from mobile in a few taps", "Keep your visit details organized", "Choose the care path that fits your day"];
  const clinic = ["Verified bookings through Secure OTP", "AI-assisted documentation and follow-up", "Medicine delivery and reminder workflows"];
  return /*#__PURE__*/React.createElement("section", {
    id: "who-we-serve",
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Who we serve"), /*#__PURE__*/React.createElement("h2", null, "Bimble works with every part of the care journey"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "One platform that adapts to your clinic's needs and keeps patients, providers, and care teams moving in the same direction.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 12,
      marginBottom: 32
    }
  }, audiences.map(a => /*#__PURE__*/React.createElement("span", {
    key: a,
    style: {
      borderRadius: 9999,
      border: "1px solid var(--border)",
      background: "#fff",
      padding: "8px 16px",
      fontSize: 14,
      fontWeight: 500,
      boxShadow: "var(--shadow-sm)"
    }
  }, a))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 24,
      gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "feature-card"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon-chip",
    style: {
      height: 48,
      width: 48
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 24
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-.02em"
    }
  }, "For Patients")), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      lineHeight: 1.6
    }
  }, "Confirm, cancel, or modify appointments, message your provider, and review results without jumping between tools."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, patient.map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "list-row"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "message-square",
    size: 20
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, i))))), /*#__PURE__*/React.createElement("div", {
    className: "feature-card",
    style: {
      border: "2px solid rgba(92,112,255,.4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon-chip",
    style: {
      height: 48,
      width: 48
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "users",
    size: 24
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: "-.02em"
    }
  }, "For Clinics")), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      lineHeight: 1.6
    }
  }, "Automate the work around every appointment so your team can spend less time on phone tag, typing, and status chasing."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, clinic.map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "list-row",
    style: {
      background: "rgba(92,112,255,.05)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 20
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, i)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      borderRadius: 16,
      background: "rgba(92,112,255,.05)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--primary)"
    }
  }, "patient portal syncs with most EMR systems"))))));
}
const steps = [{
  n: 1,
  icon: "smartphone",
  title: "Secure Verify",
  desc: "Login via phone/OTP to access your personal dashboard"
}, {
  n: 2,
  icon: "brain",
  title: "Smart Triage",
  desc: "Answer AI-powered intent questions so your care team is prepared"
}, {
  n: 3,
  icon: "file-text",
  title: "The Encounter",
  desc: "Choose virtual or walk-in. Your doctor listens; our AI documents"
}, {
  n: 4,
  icon: "package",
  title: "Seamless Resolution",
  desc: "Review your automated notes and receive your meds via your chosen delivery path"
}];
function ProcessSection({
  onRegister
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "how-it-works",
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "How it works"), /*#__PURE__*/React.createElement("h2", null, "A clear, anxiety-free process from start to finish"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "From verified booking to final follow-up, every step is designed to reduce friction for patients and clinics alike.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 32,
      gridTemplateColumns: "1.1fr .9fr",
      alignItems: "start"
    },
    className: "proc-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, steps.map((s, idx) => /*#__PURE__*/React.createElement("div", {
    key: s.n,
    className: "card",
    style: {
      borderRadius: 28,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 48,
      width: 48,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      background: "var(--primary)",
      color: "#fff",
      fontSize: 18,
      fontWeight: 600
    }
  }, s.n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon-chip",
    style: {
      height: 44,
      width: 44
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 600
    }
  }, s.title)), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: 15,
      lineHeight: 1.7
    }
  }, s.desc)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      borderRadius: 32,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      letterSpacing: ".24em"
    }
  }, "What the clinic sees"), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 8,
      fontSize: 22,
      fontWeight: 600
    }
  }, "The care context stays with the visit")), /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 20,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, [["smartphone", "Verified patient", "Secure OTP login before the appointment."], ["brain", "Prepared care team", "Triage and notes are ready when the visit starts."], ["truck", "Recovery path set", "Delivery and follow-up happen in the same flow."]].map(([ic, t, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      borderRadius: 16,
      border: "1px solid var(--border)",
      background: "var(--slate-50)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 44,
      width: 44,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      background: "#fff",
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: 13,
      lineHeight: 1.5
    }
  }, c)))))), /*#__PURE__*/React.createElement("div", {
    id: "book-demo",
    style: {
      borderRadius: 32,
      border: "1px solid rgba(92,112,255,.2)",
      background: "rgba(92,112,255,.05)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Get started"), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginTop: 12,
      fontSize: 22,
      fontWeight: 600
    }
  }, "Get Started with Bimble"), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      marginTop: 12,
      fontSize: 14,
      lineHeight: 1.7
    }
  }, "See how Bimble improves healthcare for providers and patients."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#hero",
    className: "btn btn-primary btn-sm"
  }, "Book an Appointment"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-outline btn-sm",
    onClick: onRegister
  }, "Clinic Register")))))));
}
const benefits = [{
  icon: "clock",
  title: "A calmer, more sustainable clinic day",
  bullets: ["Cuts 20+ hours of weekly admin per practitioner", "Fewer interruptions and less phone tag", "More time to focus on patient care"]
}, {
  icon: "heart",
  title: "Improved experience for patients",
  bullets: ["Easy, frustration-free self-booking", "Clean, mobile-friendly forms", "Online access to medical records"]
}, {
  icon: "monitor",
  title: "More efficient clinic operations",
  bullets: ["Reduce administrative tasks by up to 84%", "Minimize no-shows with automated reminders", "Avoid lost billing with pre-appointment checks"]
}];
function DifferentiatorsSection() {
  const metrics = [["20+ hours", "weekly admin cut per practitioner"], ["84%", "fewer administrative tasks"], ["15 minutes", "to see a doctor"]];
  return /*#__PURE__*/React.createElement("section", {
    id: "benefits",
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Benefits"), /*#__PURE__*/React.createElement("h2", null, "More medicine. Less admin."), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Bimble automates the work around care so providers can focus on patients instead of screens, callbacks, and manual follow-up.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 24,
      gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))"
    }
  }, benefits.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.title,
    className: "feature-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon-chip",
    style: {
      height: 56,
      width: 56,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: b.icon,
    size: 24
  })), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      lineHeight: 1.2
    }
  }, b.title), /*#__PURE__*/React.createElement("ul", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      listStyle: "none"
    }
  }, b.bullets.map(x => /*#__PURE__*/React.createElement("li", {
    key: x,
    style: {
      display: "flex",
      gap: 12,
      fontSize: 14,
      lineHeight: 1.5,
      color: "var(--muted-fg)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 8,
      height: 8,
      width: 8,
      flex: "none",
      borderRadius: 9999,
      background: "var(--primary)"
    }
  }), x)))))), /*#__PURE__*/React.createElement("div", {
    className: "feature-card",
    style: {
      marginTop: 32,
      display: "grid",
      gap: 16,
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      padding: 24
    }
  }, metrics.map(([v, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      borderRadius: 16,
      background: "var(--slate-50)",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      fontWeight: 600,
      letterSpacing: "-.04em"
    }
  }, v), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 1.5
    }
  }, l))))));
}
Object.assign(window, {
  ProblemSection,
  ProcessSection,
  DifferentiatorsSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Stakeholder.jsx
try { (() => {
// Bimble marketing — Patients/Clinics tab toggle section
function StakeholderSection() {
  const [tab, setTab] = useState("patients");
  const content = {
    patients: {
      eyebrow: "For Patients",
      title: "Manage your healthcare in one secure home",
      description: "Confirm, cancel, or modify appointments, message your provider, and review results without jumping between tools.",
      bullets: ["Book from mobile in a few taps", "Keep your visit details organized", "Choose the care path that fits your day"],
      panelTitle: "Patient portal",
      rowIcon: "message-square",
      rows: ["Verified appointment booking", "Message your provider securely", "Review results and follow-up steps"],
      rowSub: "Accessible from mobile or desktop.",
      note: "patient portal syncs with most EMR systems",
      icon: "shield-check",
      stats: [["15m", "fast access"], ["1 home", "for care tasks"], ["Secure", "verification first"]]
    },
    clinics: {
      eyebrow: "For Clinics",
      title: "Reduce the work around every appointment",
      description: "Automate the work around care so your team can spend less time on phone tag, typing, and status chasing.",
      bullets: ["Verified bookings through Secure OTP", "AI-assisted documentation and follow-up", "Medicine delivery and reminder workflows"],
      panelTitle: "Clinic workflow",
      rowIcon: "clock",
      rows: ["Less phone tag and fewer interruptions", "Cleaner handoffs across the team", "More time focused on patient care"],
      rowSub: "Less manual work around the visit.",
      note: "Built for calmer clinic days",
      icon: "file-text",
      stats: [["20+", "hours saved weekly"], ["84%", "less admin work"], ["0", "extra tabs"]]
    }
  };
  const c = content[tab];
  return /*#__PURE__*/React.createElement("section", {
    id: "clinics",
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Tools that simplify the workflow"), /*#__PURE__*/React.createElement("h2", null, "Everything around the appointment, in one place"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "From verified booking to follow-up, Bimble keeps the patient and clinic experience aligned without adding friction.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "patients" ? " active" : ""),
    onClick: () => setTab("patients")
  }, "For Patients"), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "clinics" ? " active" : ""),
    onClick: () => setTab("clinics")
  }, "For Clinics"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      maxWidth: 960,
      margin: "0 auto",
      borderRadius: 32,
      padding: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 40,
      gridTemplateColumns: ".95fr 1.05fr",
      alignItems: "start"
    },
    className: "stake-grid"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icon-chip",
    style: {
      height: 64,
      width: 64
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.icon,
    size: 32
  })), /*#__PURE__*/React.createElement("p", {
    className: "eyebrow",
    style: {
      letterSpacing: ".24em"
    }
  }, c.eyebrow), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-.02em"
    }
  }, c.title), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      lineHeight: 1.7,
      maxWidth: 460
    }
  }, c.description), /*#__PURE__*/React.createElement("ul", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      listStyle: "none"
    }
  }, c.bullets.map(b => /*#__PURE__*/React.createElement("li", {
    key: b,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      height: 32,
      width: 32,
      flex: "none",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9999,
      background: "rgba(92,112,255,.1)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 16,
    color: "var(--primary)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 500
    }
  }, b))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 24,
      border: "1px solid var(--border)",
      background: "var(--slate-50)",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, c.panelTitle), /*#__PURE__*/React.createElement("span", {
    className: "pill",
    style: {
      background: "#fff",
      color: "var(--primary)",
      boxShadow: "var(--shadow-sm)"
    }
  }, "Live")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, c.rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      border: "1px solid var(--border)",
      background: "#fff",
      padding: 16,
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.rowIcon,
    size: 20,
    color: "var(--primary)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, r), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      fontSize: 13
    }
  }, c.rowSub)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16,
      gridTemplateColumns: "1fr 1fr 1fr"
    }
  }, c.stats.map(([v, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      borderRadius: 20,
      border: "1px solid var(--border)",
      background: "#fff",
      padding: 16,
      boxShadow: "var(--shadow-sm)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 22,
      fontWeight: 600,
      letterSpacing: "-.04em"
    }
  }, v), /*#__PURE__*/React.createElement("p", {
    className: "muted",
    style: {
      marginTop: 4,
      fontSize: 13
    }
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 24,
      background: "rgba(92,112,255,.05)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--primary)"
    }
  }, c.note)))))));
}
const faqs = [{
  q: "Does the AI make medical decisions?",
  a: "No. Your doctor remains the final authority, reviewing and signing all AI-generated notes and prescriptions. The AI is there to reduce documentation work, not replace clinical judgment."
}, {
  q: "How does Secure OTP verification work?",
  a: "When a patient books an appointment, Bimble sends a one-time password to the registered phone number so only verified patients can complete the booking."
}, {
  q: "Can patients manage appointments and follow-up on mobile?",
  a: "Yes. Patients can confirm, cancel, or modify bookings, message their provider, review results, and stay on top of next steps from a mobile-friendly patient home."
}, {
  q: "Does Bimble fit into existing clinic workflows?",
  a: "Yes. Bimble is designed to support booking, intake, reminders, documentation, and delivery without forcing teams to rebuild their entire process."
}];
function FAQSection() {
  const [open, setOpen] = useState(0);
  return /*#__PURE__*/React.createElement("section", {
    id: "faq",
    className: "section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container",
    style: {
      maxWidth: 800
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Reassurance"), /*#__PURE__*/React.createElement("h2", null, "Frequently Asked Questions"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Everything you need to know about Bimble before getting started.")), /*#__PURE__*/React.createElement("div", {
    className: "faq"
  }, faqs.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: f.q,
    className: "faq-item"
  }, /*#__PURE__*/React.createElement("button", {
    className: "faq-q" + (open === i ? " open" : ""),
    onClick: () => setOpen(open === i ? -1 : i)
  }, /*#__PURE__*/React.createElement("span", null, f.q), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16
  })), open === i && /*#__PURE__*/React.createElement("div", {
    className: "faq-a"
  }, f.a))))));
}
Object.assign(window, {
  StakeholderSection,
  FAQSection
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Stakeholder.jsx", error: String((e && e.message) || e) }); }

})();
