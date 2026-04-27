import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, clearSession, getStoredUser, login, signup } from "../services/auth";

function ParticleCanvas({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame;
    const mouse = { x: -1000, y: -1000 };
    const dots = [];
    const orbs = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots.length = 0;
      orbs.length = 0;

      for (let x = 0; x < canvas.width; x += 52) {
        for (let y = 0; y < canvas.height; y += 52) {
          dots.push({ x, y, baseX: x, baseY: y, vx: 0, vy: 0, size: Math.random() * 1.1 + 0.35 });
        }
      }

      const hues = theme === "dark" ? [190, 260, 155, 32] : [178, 210, 148, 42];
      for (let i = 0; i < 6; i += 1) {
        orbs.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 190 + 120,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          hue: hues[Math.floor(Math.random() * hues.length)],
        });
      }
    };

    const onMouseMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.r) orb.x = canvas.width + orb.r;
        if (orb.x > canvas.width + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = canvas.height + orb.r;
        if (orb.y > canvas.height + orb.r) orb.y = -orb.r;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        gradient.addColorStop(0, `hsla(${orb.hue}, 82%, 56%, ${theme === "dark" ? 0.065 : 0.11})`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 82%, 56%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      dots.forEach((dot) => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const proximity = distance < 130 ? 1 - distance / 130 : 0;

        if (proximity > 0) {
          dot.vx -= (dx / distance) * proximity * 0.22;
          dot.vy -= (dy / distance) * proximity * 0.22;
        }

        dot.vx += (dot.baseX - dot.x) * 0.045;
        dot.vy += (dot.baseY - dot.y) * 0.045;
        dot.vx *= 0.86;
        dot.vy *= 0.86;
        dot.x += dot.vx;
        dot.y += dot.vy;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size + proximity * 1.35, 0, Math.PI * 2);
        ctx.fillStyle =
          theme === "dark"
            ? `rgba(100, 220, 255, ${0.12 + proximity * 0.5})`
            : `rgba(13, 148, 136, ${0.14 + proximity * 0.42})`;
        ctx.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

function CodePreview() {
  const [visible, setVisible] = useState(0);
  const lines = [
    "// Real-time collaborative editing",
    "",
    "function mergeSort(items) {",
    "  if (items.length <= 1) return items;",
    "  const mid = Math.floor(items.length / 2);",
    "  const left = mergeSort(items.slice(0, mid));",
    "  const right = mergeSort(items.slice(mid));",
    "  return merge(left, right);",
    "}",
  ];

  useEffect(() => {
    if (visible >= lines.length) return;
    const timer = setTimeout(() => setVisible((value) => value + 1), 120);
    return () => clearTimeout(timer);
  }, [visible, lines.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10 code-preview">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-3 font-mono text-xs text-slate-500">mergeSort.js</span>
        <div className="ml-auto hidden items-center gap-1.5 sm:flex">
          {[
            ["Alice", "#22d3ee"],
            ["Bob", "#c084fc"],
            ["Raj", "#34d399"],
          ].map(([name, color]) => (
            <span key={name} className="rounded-full border px-2 py-0.5 font-mono text-[10px]" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-[265px] p-5 font-mono text-[13px] leading-6">
        {lines.slice(0, visible).map((line, index) => (
          <div key={`${line}-${index}`} className="flex gap-5 text-slate-300" style={{ animation: "fadeInLine .2s ease both" }}>
            <span className="w-5 shrink-0 select-none text-right text-slate-600">{index + 1}</span>
            <span className={line.startsWith("//") ? "text-slate-500" : ""}>{line || " "}</span>
          </div>
        ))}
        {visible < lines.length && (
          <div className="flex gap-5">
            <span className="w-5 text-right text-slate-600">{visible + 1}</span>
            <span className="inline-block h-4 w-2 animate-pulse bg-cyan-400 align-middle" />
          </div>
        )}
      </div>

      <div className="absolute left-[205px] top-[126px] pointer-events-none hidden sm:block">
        <div className="h-5 w-0.5 animate-pulse bg-violet-400" />
        <div className="absolute -top-5 left-1 rounded bg-violet-500/90 px-1.5 py-0.5 font-mono text-[9px] text-white shadow-lg">Bob</div>
      </div>

      <div className="absolute bottom-4 right-4 max-w-[160px] rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
        <p className="mb-0.5 font-mono text-[10px] font-bold text-emerald-400">Raj</p>
        <p className="text-[11px] text-slate-300">should we add memoization?</p>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, color, tag }) {
  return (
    <div className="feature-card group relative overflow-hidden rounded-2xl border border-white/5 p-7 transition-all duration-500" style={{ "--card-color": color }}>
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 0% 0%, ${color}16 0%, transparent 70%)` }} />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <span className="feature-icon grid h-12 w-12 place-items-center rounded-xl border text-xs font-black" style={{ color, background: `${color}15`, borderColor: `${color}25` }}>
            {tag.slice(0, 2)}
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ color, borderColor: `${color}40`, background: `${color}12` }}>{tag}</span>
        </div>
        <h3 className="feature-title mb-2 text-[1.08rem] font-black tracking-tight text-app md:text-lg">{title}</h3>
        <p className="text-[0.93rem] leading-7 text-muted">{desc}</p>
      </div>
    </div>
  );
}

function AuthPanel({ inviteRoom }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());
  const [mode, setMode] = useState("login");
  const [tab, setTab] = useState("create");
  const [role, setRole] = useState("participant");
  const [roomId, setRoomId] = useState(inviteRoom);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const nextUser = mode === "login" ? await login(form) : await signup(form);
      setUser(nextUser);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const enterRoom = async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "create") {
        const { data } = await authApi.post("/api/rooms/create", { name: `${user.name}'s Room` });
        navigate(`/room/${data.roomId}`);
      } else {
        if (!roomId.trim()) {
          setLoading(false);
          return setError("Paste a Room ID to join.");
        }
        sessionStorage.setItem("codesync-role", role);
        navigate(`/room/${roomId.trim()}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card rounded-3xl p-8 shadow-2xl shadow-cyan-500/5">
      {!user ? (
        <form onSubmit={submitAuth}>
          <div className="mb-6 text-center">
            <p className="text-emerald-500 text-[11px] font-mono tracking-[0.2em] uppercase mb-3">Secure rooms</p>
            <h2 className="text-3xl font-black tracking-tight text-app">{mode === "login" ? "Start a session" : "Create account"}</h2>
            <p className="mt-2 text-sm text-muted">Login or signup to save sessions and rooms.</p>
          </div>

          <div className="segmented mb-5">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Signup</button>
          </div>

          {mode === "signup" && (
            <div className="mb-4">
              <label className="field-label">Your Name</label>
              <input className="field-input mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Alice" />
            </div>
          )}
          <div className="mb-4">
            <label className="field-label">Email</label>
            <input className="field-input mt-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" />
          </div>
          <div className="mb-5">
            <label className="field-label">Password</label>
            <input className="field-input mt-2" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimum 6 characters" />
          </div>

          <button className="primary-button w-full" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Signup"}</button>
        </form>
      ) : (
        <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-app">Ready, {user.name}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <button className="text-button" onClick={() => { clearSession(); setUser(null); }}>Sign out</button>
          </div>

          <div className="segmented mb-5">
            <button className={tab === "create" ? "active" : ""} onClick={() => setTab("create")}>Create Room</button>
            <button className={tab === "join" ? "active" : ""} onClick={() => setTab("join")}>Join Room</button>
          </div>

          {tab === "join" && (
            <>
              <div className="mb-4">
                <label className="field-label">Room ID</label>
                <input className="field-input mt-2 font-mono" value={roomId} onChange={(event) => setRoomId(event.target.value)} placeholder="e.g. V1StGXR8" />
              </div>
              <div className="mb-5">
                <label className="field-label">Role</label>
                <div className="segmented mt-2">
                  {["participant", "viewer"].map((item) => (
                    <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button className="primary-button w-full" disabled={loading} onClick={enterRoom}>
            {loading ? "Please wait..." : tab === "create" ? "Create Room" : "Join Room"}
          </button>
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{error}</div>}
    </div>
  );
}

export default function Home() {
  const [params] = useSearchParams();
  const inviteRoom = params.get("room") || "";
  const [theme, setTheme] = useState(() => localStorage.getItem("codesync-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("codesync-theme", theme);
  }, [theme]);

  const featureItems = [
    { title: "Sub-50ms Sync", desc: "All users see insert, delete, and cursor updates through Socket.io.", color: "#22d3ee", tag: "LIVE" },
    { title: "Live Cursors", desc: "Every collaborator gets a unique color, name label, and selection state.", color: "#c084fc", tag: "CURSOR" },
    { title: "Code Execution", desc: "Run JavaScript, Python, and C++ with sandboxed output and line-aware errors.", color: "#fb923c", tag: "RUN" },
    { title: "Interview Mode", desc: "Host can assign problems, start a timer, and lock or unlock editing.", color: "#f472b6", tag: "HOST" },
    { title: "Live Chat", desc: "Side panel chat includes timestamps, typing indicators, and user colors.", color: "#34d399", tag: "CHAT" },
    { title: "Version History", desc: "MongoDB-backed snapshots let you save and restore previous versions.", color: "#facc15", tag: "SAVE" },
  ];
  const metricItems = [
    ["50ms", "Sync Latency", "#22d3ee"],
    ["3+", "Languages", "#c084fc"],
    ["20", "Snapshots", "#34d399"],
    ["JWT", "Sessions", "#fb923c"],
    ["Live", "Cursors", "#60a5fa"],
    ["MVP", "Interview Ready", "#f472b6"],
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app text-app" style={{ fontFamily: "'Space Grotesk', 'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInLine { from { opacity:0; transform:translateX(-4px); } to { opacity:1; transform:translateX(0); } }
        @keyframes float { 0%,100% { transform:translateY(0px) rotate(-0.5deg); } 50% { transform:translateY(-14px) rotate(0.5deg); } }
        @keyframes glow { 0%,100% { box-shadow:0 0 24px rgba(34,211,238,.35),0 0 48px rgba(34,211,238,.12); } 50% { box-shadow:0 0 40px rgba(34,211,238,.55),0 0 80px rgba(34,211,238,.22); } }
        @keyframes textSweep { 0% { background-position: 0% center; opacity: .74; } 50% { background-position: 100% center; opacity: 1; } 100% { background-position: 0% center; opacity: .74; } }
        @keyframes cardSheen { 0% { transform: translateX(-140%) rotate(18deg); opacity: 0; } 35% { opacity: .16; } 100% { transform: translateX(180%) rotate(18deg); opacity: 0; } }
        @keyframes auroraDrift { 0%,100% { transform: translate3d(-1%, -1%, 0) scale(1); opacity: .72; } 50% { transform: translate3d(2%, 1.5%, 0) scale(1.04); opacity: 1; } }
        @keyframes chipPulse { 0%,100% { transform: translateY(0); box-shadow: 0 0 0 rgba(45,212,191,0); } 50% { transform: translateY(-1px); box-shadow: 0 0 28px color-mix(in srgb, var(--brand) 18%, transparent); } }
        @keyframes scrollCue { 0%,100% { transform: translateY(0); opacity: .45; } 50% { transform: translateY(8px); opacity: 1; } }
        @keyframes metricMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .au { animation:fadeUp .75s cubic-bezier(.16,1,.3,1) both; }
        .float { animation:float 5s ease-in-out infinite; }
        .glow-btn { animation:glow 2.5s ease-in-out infinite; }
        .page-aurora {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(circle at 22% 24%, color-mix(in srgb, var(--brand-2) 22%, transparent), transparent 28%),
            radial-gradient(circle at 78% 18%, color-mix(in srgb, #c084fc 18%, transparent), transparent 30%),
            radial-gradient(circle at 50% 78%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 34%),
            linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--bg) 78%, transparent) 72%, var(--bg) 100%);
          animation: auroraDrift 12s ease-in-out infinite;
        }
        .hero-shell::before {
          content: "";
          position: absolute;
          inset: 4rem 8% auto 8%;
          height: 28rem;
          background: radial-gradient(ellipse at center, color-mix(in srgb, var(--brand) 16%, transparent), transparent 68%);
          filter: blur(8px);
          pointer-events: none;
        }
        .nav-shell {
          background: color-mix(in srgb, var(--surface) 54%, transparent);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(18px);
        }
        .hero-title {
          color: var(--hero-text);
          text-shadow: 0 24px 80px color-mix(in srgb, var(--brand) 10%, transparent);
        }
        .brand-word {
          background: linear-gradient(90deg, var(--brand-2), var(--brand), #7dd3fc, var(--brand));
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: textSweep 6s ease-in-out infinite;
        }
        .hero-chip { animation: chipPulse 4s ease-in-out infinite; }
        .hero-metric {
          background: color-mix(in srgb, var(--surface) 68%, transparent);
          border: 1px solid var(--border);
          backdrop-filter: blur(18px);
        }
        .metrics-marquee {
          overflow: hidden;
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }
        .metrics-track {
          display: flex;
          width: max-content;
          animation: metricMarquee 28s linear infinite;
        }
        .metrics-marquee:hover .metrics-track { animation-play-state: paused; }
        .metric-card {
          min-width: 235px;
          background: color-mix(in srgb, var(--surface) 54%, transparent);
          border-right: 1px solid var(--border);
          border-left: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
          backdrop-filter: blur(18px);
          transition: transform .35s cubic-bezier(.16,1,.3,1), background .35s ease, box-shadow .35s ease;
        }
        .metric-card:hover {
          transform: translateY(-4px);
          background: color-mix(in srgb, var(--surface) 78%, transparent);
          box-shadow: 0 20px 60px color-mix(in srgb, var(--metric-color) 16%, transparent);
        }
        .metric-value {
          color: var(--metric-color);
          text-shadow: 0 0 26px color-mix(in srgb, var(--metric-color) 22%, transparent);
        }
        .scroll-cue { animation: scrollCue 1.8s ease-in-out infinite; }
        .animated-subcopy {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: .01em;
          background: linear-gradient(90deg, var(--muted), var(--brand), #c084fc, var(--muted));
          background-size: 220% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: textSweep 5s ease-in-out infinite;
        }
        .code-preview, .auth-card, .feature-card { background: color-mix(in srgb, var(--surface) 88%, transparent); backdrop-filter: blur(22px); }
        .auth-card { border: 1px solid color-mix(in srgb, var(--brand) 30%, var(--border)); }
        .feature-card {
          transform: translateY(0) scale(1);
          box-shadow: 0 18px 54px rgba(0,0,0,.12);
          isolation: isolate;
        }
        .feature-card::before {
          content: "";
          position: absolute;
          inset: -45% auto -45% -35%;
          width: 34%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.7), transparent);
          transform: translateX(-140%) rotate(18deg);
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }
        .feature-card:hover {
          transform: translateY(-8px) scale(1.012);
          border-color: color-mix(in srgb, var(--card-color) 45%, var(--border));
          box-shadow: 0 24px 70px color-mix(in srgb, var(--card-color) 22%, transparent), 0 18px 54px rgba(0,0,0,.22);
        }
        .feature-card:hover::before { animation: cardSheen .9s ease-out; }
        .feature-card:hover .feature-icon {
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 0 32px color-mix(in srgb, var(--card-color) 30%, transparent);
        }
        .feature-card:hover .feature-title { color: var(--card-color); }
        .feature-icon, .feature-title { transition: transform .35s cubic-bezier(.16,1,.3,1), color .35s ease, box-shadow .35s ease; }
        :root[data-theme="light"] .code-preview {
          border-color: rgba(15, 53, 71, .12);
          box-shadow: 0 24px 70px rgba(18, 54, 74, .12);
        }
        :root[data-theme="light"] .code-preview .text-slate-300 { color: #233647; }
        :root[data-theme="light"] .code-preview .text-slate-500 { color: #65788a; }
        :root[data-theme="light"] .code-preview .text-slate-600 { color: #8ca0af; }
        :root[data-theme="light"] .code-preview .bg-emerald-500\\/10 {
          background: rgba(13, 148, 136, .12);
          border-color: rgba(13, 148, 136, .22);
        }
        :root[data-theme="light"] .code-preview .text-slate-300,
        :root[data-theme="light"] .code-preview .text-slate-500,
        :root[data-theme="light"] .code-preview .text-slate-600 {
          text-shadow: none;
        }
      `}</style>

      <div className="page-aurora" />
      <ParticleCanvas theme={theme} />

      <nav className="nav-shell sticky top-0 z-30 flex items-center justify-between px-6 py-4 md:px-14">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 font-mono text-sm font-black text-cyan-400 shadow-brand">CS</div>
          <span className="text-lg font-black tracking-tight">CodeSync</span>
          <span className="hidden rounded-full border border-slate-500/20 px-2 py-0.5 font-mono text-[10px] text-muted sm:inline">v2.0</span>
        </div>
        <button className="icon-button" onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </nav>

      <section className="hero-shell relative z-10 flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-6 pb-20 pt-14 text-center">
        <div className="hero-chip au mb-8 inline-flex items-center gap-2 rounded-full border border-app px-4 py-1.5 text-[11px] font-semibold" style={{ animationDelay: ".05s", background: "var(--surface-soft)" }}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-muted">Real-time · Multi-language · Authenticated</span>
        </div>

        <h1 className="hero-title au mb-6 text-[clamp(3.2rem,10vw,7.2rem)] font-black leading-[.9] tracking-tight" style={{ animationDelay: ".15s" }}>
          <span className="block text-app">Code Together,</span>
          <span className="brand-word mt-1 block">Ship Faster.</span>
        </h1>

        <p className="au mb-3 max-w-xl text-base leading-relaxed text-muted md:text-lg" style={{ animationDelay: ".28s" }}>
          A professional collaborative editor for technical interviews, pair programming, code reviews, and live debugging.
        </p>
        <p className="au mb-12 font-mono text-xs text-muted" style={{ animationDelay: ".38s" }}>
          Monaco Editor · Socket.io WebSockets · JWT Auth · Sandbox Runner · MongoDB
        </p>

        <div className="au mb-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: ".48s" }}>
          <button onClick={() => document.getElementById("start-section")?.scrollIntoView({ behavior: "smooth" })} className="glow-btn rounded-2xl px-8 py-3.5 text-sm font-black text-black transition-all duration-300 hover:scale-105" style={{ background: "linear-gradient(135deg, var(--brand-2), var(--brand))" }}>
            Start Coding
          </button>
          <button onClick={() => document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" })} className="secondary-button px-8 py-3.5">
            Explore Features
          </button>
        </div>

        <div className="au mb-14 grid w-full max-w-2xl grid-cols-3 gap-2 text-left sm:gap-3" style={{ animationDelay: ".56s" }}>
          {[
            ["Live sync", "Socket.io"],
            ["Saved rooms", "MongoDB"],
            ["Secure access", "JWT"],
          ].map(([label, value]) => (
            <div key={label} className="hero-metric rounded-xl px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-1 font-mono text-xs font-black text-app">{value}</p>
            </div>
          ))}
        </div>

        <div className="au float w-full max-w-2xl" style={{ animationDelay: ".64s" }}>
          <CodePreview />
        </div>

        <div className="scroll-cue mt-10 h-9 w-5 rounded-full border border-app p-1">
          <div className="mx-auto h-1.5 w-1.5 rounded-full bg-brand" />
        </div>
      </section>

      <section className="relative z-10 border-y border-app">
        <div className="metrics-marquee">
          <div className="metrics-track">
            {[...metricItems, ...metricItems].map(([value, label, color], index) => (
              <div key={`${label}-${index}`} className="metric-card py-6 text-center" style={{ "--metric-color": color }}>
                <div className="metric-value mb-1 font-mono text-3xl font-black md:text-4xl">{value}</div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features-section" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-500">Everything you need</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Built for real collaboration</h2>
            <p className="animated-subcopy mx-auto mt-4 max-w-2xl text-center text-base leading-7 md:text-lg">
              Designed for focused interviews, live collaboration, and smooth coding sessions from first invite to final snapshot.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((item) => <FeatureCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section id="start-section" className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-md">
          <AuthPanel inviteRoom={inviteRoom} />
        </div>
      </section>
    </div>
  );
}
