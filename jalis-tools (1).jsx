import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle, ArrowLeft, Building2, Check, ChevronLeft, ChevronRight,
  Copy, Download, ExternalLink, FileText, FolderTree, Globe, GripVertical,
  Loader2, Lock, MapPin, Pencil, Phone, Plus, RefreshCw, Rocket, RotateCcw,
  Search, Send, Sparkles, Terminal, Upload, X, Zap, BookOpen, ClipboardList,
  FileEdit, Newspaper, CheckCircle2, Type, FileCheck
} from "lucide-react";

const JB = "#22B8DC";
function cw(t) { return t?.trim() ? t.trim().split(/\s+/).length : 0; }

/* ═══ SHARED: CopyBtn ═══ */
function Cp({ text, label }) {
  const [ok, s] = useState(false);
  const go = async () => { try { await navigator.clipboard.writeText(text); } catch { const e = document.createElement("textarea"); e.value = text; e.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(e); e.select(); document.execCommand("copy"); document.body.removeChild(e); } s(true); setTimeout(() => s(false), 1300); };
  return <button onClick={go} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${ok ? "bg-emerald-500 text-white shadow-sm" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}`}>{ok ? <><Check className="h-3 w-3" />Copié !</> : <><Copy className="h-3 w-3" />{label || "Copier"}</>}</button>;
}

/* ═══ SHARED: GenerateLoader ═══ */
function GenerateLoader({ loading, progress, label, color, itemCount, itemLabel }) {
  if (!loading) return null;
  const pct = Math.min(Math.round(progress), 99);
  
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
              <Loader2 className="h-5 w-5 animate-spin" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{label}</p>
              <p className="text-xs text-zinc-500">{itemCount} {itemLabel} en cours de génération</p>
            </div>
          </div>
          <span className="text-2xl font-bold tabular-nums text-zinc-900">{pct}<span className="text-sm text-zinc-400">%</span></span>
        </div>
        
        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
        </div>
        
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className={pct < 20 ? "text-zinc-900 font-semibold" : ""}>Analyse</span>
          <span>→</span>
          <span className={pct >= 20 && pct < 60 ? "text-zinc-900 font-semibold" : ""}>Rédaction</span>
          <span>→</span>
          <span className={pct >= 60 && pct < 90 ? "text-zinc-900 font-semibold" : ""}>Optimisation SEO</span>
          <span>→</span>
          <span className={pct >= 90 ? "text-zinc-900 font-semibold" : ""}>Finalisation</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ SHARED: useProgress hook ═══ */
function useProgress(estimatedSeconds = 30) {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  
  const start = useCallback(() => {
    setProgress(0);
    setRunning(true);
    const startTime = Date.now();
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Asymptotic curve: fast at start, slows down near 95%
      const rawPct = (1 - Math.exp(-elapsed / (estimatedSeconds * 0.4))) * 95;
      setProgress(Math.min(rawPct, 95));
    }, 200);
  }, [estimatedSeconds]);
  
  const finish = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);
    setTimeout(() => { setRunning(false); setProgress(0); }, 600);
  }, []);
  
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setProgress(0);
  }, []);
  
  return { progress, running, start, finish, reset };
}

/* ═══ SHARED: RubBuilder ═══ */
function RubBuilder({ rubriques, setRubriques, ascii, extra }) {
  const [input, setInput] = useState("");
  const [showAscii, setShowAscii] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const add = () => { const t = input.trim(); if (t) { setRubriques(p => [...p, { id: Date.now(), name: t, level: 0, ...(extra || {}) }]); setInput(""); } };
  const rm = id => setRubriques(p => p.filter(r => r.id !== id));
  const lvl = (id, d) => setRubriques(p => p.map(r => r.id === id ? { ...r, level: Math.max(0, Math.min(2, r.level + d)) } : r));
  const ds = (e, i) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; };
  const dov = (e, i) => { e.preventDefault(); setOverIdx(i); };
  const dp = (e, i) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== i) { const c = [...rubriques]; const [m] = c.splice(dragIdx, 1); c.splice(i, 0, m); setRubriques(c); } setDragIdx(null); setOverIdx(null); };
  const colors = ["bg-sky-500", "bg-violet-500", "bg-amber-500"];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Tapez le nom d'une rubrique puis Entrée" className="text-base h-10 rounded-xl border-zinc-200" />
        <Button onClick={add} size="icon" className="h-10 w-10 shrink-0 rounded-lg text-white transition-colors hover:opacity-90" style={{ background: JB }}><Plus className="h-4 w-4 text-white" /></Button>
      </div>
      {rubriques.length > 0 ? (
        <div className="space-y-1 max-h-44 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2">
          {rubriques.map((r, i) => (
            <div key={r.id} draggable onDragStart={e => ds(e, i)} onDragOver={e => dov(e, i)} onDrop={e => dp(e, i)} onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              style={{ marginLeft: r.level * 24 }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab select-none transition-all ${overIdx === i ? "bg-sky-50 ring-1 ring-sky-300" : "hover:bg-white hover:shadow-sm"} ${dragIdx === i ? "opacity-20" : ""}`}>
              <GripVertical className="h-4 w-4 text-zinc-300 shrink-0" />
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[r.level]}`} />
              <span className="flex-1 font-semibold text-[15px] text-zinc-800 truncate">{r.name}</span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={r.level === 0} onClick={() => lvl(r.id, -1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={r.level >= 2} onClick={() => lvl(r.id, 1)}><ChevronRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => rm(r.id)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-zinc-400 text-sm">Aucune rubrique. ◀ ▶ pour hiérarchiser.</div>}
      {rubriques.length > 0 && <div><Button variant="outline" size="sm" onClick={() => setShowAscii(v => !v)} className="gap-2 text-xs text-zinc-500 rounded-xl border-zinc-200"><Terminal className="h-3.5 w-3.5" />{showAscii ? "Masquer" : "Voir"} ASCII</Button>{showAscii && <pre className="mt-2 p-3 bg-zinc-900 text-emerald-400 rounded-xl text-xs leading-relaxed overflow-auto max-h-28 font-mono border border-zinc-800">{ascii}</pre>}</div>}
    </div>
  );
}

/* ═══ SHARED: FileUp (with proper PDF extraction) ═══ */
function FileUp({ onFiles }) {
  const [files, setF] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const extractPdfText = async (arrayBuffer) => {
    try {
      // Load pdf.js from CDN if not already loaded
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
      return fullText.trim();
    } catch (e) {
      console.warn("PDF.js extraction failed, falling back to raw:", e);
      // Fallback: raw byte extraction
      const b = new Uint8Array(arrayBuffer);
      let t = "";
      for (let i = 0; i < b.length; i++) {
        const c = b[i];
        if (c >= 32 && c <= 126) t += String.fromCharCode(c);
        else if (c === 10 || c === 13) t += "\n";
        else t += " ";
      }
      return t.replace(/ {3,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }
  };

  const read = async (f) => {
    if (f.type === "application/pdf") {
      const arrayBuffer = await f.arrayBuffer();
      const text = await extractPdfText(arrayBuffer);
      const charCount = text.length;
      return { name: f.name, content: text.slice(0, 50000), charCount, truncated: charCount > 50000 };
    } else {
      const text = await f.text();
      const charCount = text.length;
      return { name: f.name, content: text.slice(0, 50000), charCount, truncated: charCount > 50000 };
    }
  };

  const handle = async (fl) => {
    setLoading(true);
    try {
      const n = [];
      for (const f of fl) n.push(await read(f));
      const u = [...files, ...n];
      setF(u);
      onFiles(u);
    } catch (e) {
      console.error("File read error:", e);
    } finally {
      setLoading(false);
    }
  };

  const rm = i => { const u = files.filter((_, x) => x !== i); setF(u); onFiles(u); };

  const totalChars = files.reduce((sum, f) => sum + (f.charCount || f.content.length), 0);

  return (
    <div className="space-y-2">
      <div onClick={() => !loading && ref.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files); }}
        className={`border-2 border-dashed border-zinc-200 rounded-2xl p-5 text-center cursor-pointer hover:border-sky-300 hover:bg-sky-50/30 transition-all duration-300 group ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        <input ref={ref} type="file" multiple accept=".pdf,.json,.txt,.csv,.doc,.docx,.xml,.html" className="hidden" onChange={e => handle(e.target.files)} />
        {loading ? (
          <><Loader2 className="h-5 w-5 mx-auto text-sky-400 animate-spin" /><p className="text-sm text-sky-500 mt-1 font-medium">Extraction du contenu...</p></>
        ) : (
          <><Upload className="h-5 w-5 mx-auto text-zinc-300 group-hover:text-sky-400" /><p className="text-sm text-zinc-400 mt-1">Glisser-déposer ou cliquer</p></>
        )}
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-sky-50/80 border border-sky-200/60">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="text-sm font-medium text-sky-800 truncate">{f.name}</span>
                <span className="text-[10px] text-sky-500 shrink-0">{Math.round((f.charCount || f.content.length) / 1000)}k car.</span>
                {f.truncated && <span className="text-[10px] text-amber-600 shrink-0">⚠ tronqué</span>}
              </div>
              <button onClick={() => rm(i)} className="text-red-400 hover:text-red-600 shrink-0"><X className="h-4 w-4" /></button>
            </div>
          ))}
          <div className="text-[11px] text-zinc-400 px-1">
            {files.length} fichier{files.length > 1 ? "s" : ""} • {Math.round(totalChars / 1000)}k caractères de contexte
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ SHARED: ASCII builder ═══ */
function useAscii(rubriques) {
  return useCallback(() => {
    if (!rubriques.length) return "";
    const isLast = (idx, lvl) => { for (let j = idx + 1; j < rubriques.length; j++) { if (rubriques[j].level === lvl) return false; if (rubriques[j].level < lvl) return true; } return true; };
    return rubriques.map((r, i) => { if (r.level === 0) return (isLast(i, 0) ? "└── " : "├── ") + r.name; if (r.level === 1) { let p = true; for (let j = i + 1; j < rubriques.length; j++) { if (rubriques[j].level === 0) { p = false; break; } } return (p ? "    " : "│   ") + (isLast(i, 1) ? "└── " : "├── ") + r.name; } return "│   │   " + (isLast(i, 2) ? "└── " : "├── ") + r.name; }).join("\n");
  }, [rubriques]);
}
function getLeaves(rubriques) { const l = []; for (let i = 0; i < rubriques.length; i++) { const hc = i + 1 < rubriques.length && rubriques[i + 1].level > rubriques[i].level; if (!hc) l.push(rubriques[i].name); } return l.length ? l : rubriques.map(r => r.name); }
function getAllRubNames(rubriques) { return rubriques.map(r => r.name); }

/* ═══ SHARED: AppShell ═══ */
function AppShell({ onBack, icon: Icon, iconColor, title, badge, tabs, activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-900 hover:bg-zinc-50"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: iconColor }}><Icon className="h-4 w-4 text-white" /></div>
            <span className="text-sm sm:text-base font-semibold text-zinc-900">{title}</span>
            {badge && <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">{badge}</span>}
          </div>
          {tabs && (
            <div className="flex h-full items-center gap-1">
              {tabs.map(t => (
                <button key={t.id} onClick={() => t.on && onTabChange(t.id)} className={`px-3 sm:px-4 h-full text-xs sm:text-sm font-medium border-b-2 transition-all ${activeTab === t.id ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"} ${!t.on ? "opacity-30 cursor-default" : "cursor-pointer"}`}
                  style={{ borderColor: activeTab === t.id ? iconColor : "transparent" }}>
                  {t.label}{t.badge && <span className="ml-1.5 inline-flex items-center justify-center h-5 px-1.5 rounded-full text-[10px] font-semibold text-white" style={{ background: iconColor }}>{t.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="flex-1 pt-14 sm:pt-16">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HUB
   ═══════════════════════════════════════ */
const APPS = [
  { id: "ref-dt", name: "Préparation REF DT", desc: "Préparer les documents de référencement", icon: ClipboardList, color: "#3B82F6", locked: true },
  { id: "secteurs-geo", name: "Secteurs géographiques", desc: "Générer les secteurs géographiques optimisés SEO", icon: MapPin, color: "#6366F1", locked: false },
  { id: "remplissage", name: "Remplissage de site", desc: "Workflow complet : accueil + laïus + annonces + Jalis Express", icon: FileEdit, color: "#8B5CF6", locked: false },
  { id: "laius", name: "Laïus", desc: "Générer les laïus de rubriques", icon: Type, color: "#F59E0B", locked: false },
  { id: "annonces", name: "Annonces", desc: "Créer des annonces Express, Premium ou Expert", icon: Newspaper, color: "#10B981", locked: false },
  { id: "jalis-express", name: "Jalis Express", desc: "Générer des expressions SEO longue traîne", icon: Zap, color: JB, locked: false },
  { id: "guide-local", name: "Guide Local", desc: "Génération de liens utiles avec l'IA", icon: BookOpen, color: "#EC4899", locked: true },
];

function Hub({ onOpenApp }) {
  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex shrink-0 items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: JB }}><svg viewBox="0 0 811.11 685.79" className="h-6 w-6"><path fill="#fff" d="M564.47,232.29c1.37,16.36,15.47,28.24,31.79,26.82,16.36-1.41,28.6-15.51,27.23-31.83-1.41-16.36-15.91-28.56-32.28-27.19-16.32,1.41-28.16,15.88-26.74,32.19Z"/><path fill="#fff" d="M73.61,549.9c1.98,23.43,20.88,45.24,59.99,41.89l2.67-.16h.28c52.52-9.57,71.22-55.75,77.93-110.93l26.87-222.67-56.19,14.3-31.15,242.14c-5.41,40.24-15.11,48.8-32.4,50.29-11.15.97-26.54-3.68-28.28-23.63l-.08-1.01c2.26,3.68,6.95,4.4,10.74,4.12,9.98-.85,16.12-11.07,15.31-20.24-.73-8.76-9.98-12.68-9.98-12.68,0,0-8.93-4.04-18.42,1.17-9.45,5.21-18.78,19.79-17.29,37.41Z"/><path fill="#fff" d="M489.74,477.63c15.15-1.29,39.47-8.24,57.36-38.54,5.74,22.9,22.34,31.71,41.73,30.01,13.98-1.17,35.59-7.47,52.88-31.99,8.52,14.46,25.33,25.37,51.75,23.07,30.47-2.59,72.89-22.3,68.77-70.53-2.1-24.52-5.61-27.43-18.34-123.17l-58.71,13.77c-8.36,37.37-15.59,62.33-33.2,100.87-9.65,5.66-18.22,19.11-16.72,36.19v.16c-5.58,7.39-12.65,12.48-20.52,13.17-10.38.93-15.51-2.02-16.4-12.4-.28-3.35-.24-7.11.45-12l15.96-128.5-54.5,13.57-14.02,112.3c-3.96,19.03-16.12,34.3-30.62,35.51-10.38.89-15.47-2.06-16.4-12.4-.28-3.35-.2-7.11.44-12l25.57-204.08-54.29,12.12-23.83,189.34c0,.12,0,.16-.04.28-4,18.91-12.56,35.91-27.03,37.16-10.34.89-15.63-4.28-16.52-14.67-.28-3.31-.24-7.07.44-11.96l15.92-128.5-54.25,13.53-1.57,11.07-.24-2.63c-.89-10.75-10.54-18.18-31.71-16.36-64.52,5.54-88.51,87.98-84.27,138.08,3.79,44.15,29.29,57.69,54.49,55.54,26.38-2.26,42.37-20.84,52.39-38.9,4.16,22.06,18.5,32.8,39.31,31.03,15.07-1.25,37.33-7.88,54.21-37.57,5.94,22.34,22.34,31.06,41.53,29.41ZM655.89,409.07c2.42,2.14,5.74,2.99,8.77,2.71,9.65-.81,15.55-10.67,14.82-19.55-.56-6.3-4.64-10.46-9.65-12.28,10.22-24.76,18.66-47.95,24.04-72.71,8.64,56.84,12.93,68.07,14.58,87.34,2.22,26.02-13.05,35.91-29.37,37.29-14.86,1.29-21.73-5.62-24.04-20.08.28-.85.57-1.86.85-2.71ZM351.38,420.3c-2.63,21.9-17.25,34.38-28.04,35.31-6.7.56-18.58,1.17-21.05-27.39-2.95-34.9,11.76-103.46,43.26-106.12,11.88-1.05,16.08,8.32,16.44,12.81l-10.62,85.4Z"/></svg></div>
            <div>
              <span className="text-lg font-semibold whitespace-nowrap text-zinc-900">Coordination</span>
              <p className="text-[11px] text-zinc-400 leading-none">Outils d'aide au remplissage</p>
            </div>
          </div>
        </div>
      </nav>
      <section className="px-6 pt-28 pb-8 sm:pt-32 sm:pb-12">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-widest text-white uppercase shadow-lg" style={{ background: `linear-gradient(to right, ${JB}, #1aa3c4)` }}>
            <Sparkles className="h-3.5 w-3.5" />Outils d'aide au remplissage des sites
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">Tous vos outils de remplissage<br /><span style={{ color: JB }}>au même endroit.</span></h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-500">Sélectionnez un outil pour commencer.</p>
        </div>
      </section>
      <div className="mx-auto max-w-4xl px-6 pb-20 flex-1 w-full"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {APPS.map(app => { const I = app.icon; return (
          <button key={app.id} onClick={() => !app.locked && onOpenApp(app.id)} disabled={app.locked}
            className={`group relative rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300 flex sm:block items-center gap-4 sm:gap-0 ${app.locked ? "border-zinc-100 bg-zinc-50/50 cursor-not-allowed opacity-60" : "border-zinc-200 bg-zinc-50 cursor-pointer hover:-translate-y-1 hover:border-sky-300 hover:bg-white hover:shadow-xl hover:shadow-sky-500/10"}`}>
            {app.locked ? <div className="absolute top-3 right-3"><Lock className="h-3.5 w-3.5 text-zinc-300" /></div> : <div className="absolute top-3.5 right-3.5 flex items-center justify-center"><span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></div>}
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl shrink-0 sm:mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: app.locked ? "#f4f4f5" : `${app.color}15` }}><I className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: app.locked ? "#d4d4d8" : app.color }} /></div>
            <div className="flex-1 sm:flex-none">
              <h3 className={`font-semibold text-sm mb-1 ${app.locked ? "text-zinc-400" : "text-zinc-900"}`}>{app.name}</h3>
              <p className={`text-xs leading-relaxed ${app.locked ? "text-zinc-300" : "text-zinc-500"}`}>{app.desc}</p>
              {app.id === "jalis-express" && <div className="mt-2"><span className="inline-flex items-center text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400 border border-zinc-200">INPI FR3032291</span></div>}
            </div>
          </button>
        ); })}
      </div></div>
    </div>
  );
}

/* ═══════════════════════════════════════
   APP: LAÏUS
   ═══════════════════════════════════════ */
function LaïusApp({ onBack }) {
  const [tab, setTab] = useState("params");
  const [rubriques, setRubriques] = useState([]);
  const [ville, setVille] = useState(""); const [secteurs2, setSecteurs2] = useState(""); const [ctxFiles, setCtxFiles] = useState([]); const [consignes, setConsignes] = useState("");
  const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const toAscii = useAscii(rubriques);
  const allRubs = getAllRubNames(rubriques);
  const prog = useProgress(allRubs.length * 8);

  const generate = async () => {
    if (!rubriques.length || !ville.trim()) { setError("Remplissez arborescence et ville."); return; }
    if (!ctxFiles.length && !consignes.trim()) { setError("Fournissez fichiers ou consignes."); return; }
    setError(""); setLoading(true); setResults([]); prog.start();
    const fc = ctxFiles.length > 0 ? `\nFICHIERS :\n${ctxFiles.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n")}` : "";
    const cc = consignes.trim() ? `\nCONSIGNES :\n${consignes}` : "";
    const rubList = allRubs.map(r => `"${r}"`).join(", ");
    const prompt = `Tu es un rédacteur web expérimenté spécialisé en SEO pour l'agence Jalis.

MISSION : Générer un TITRE + une DESCRIPTION DE LAÏUS pour CHAQUE rubrique du site (rubriques parentes ET sous-rubriques).

Le laïus est un texte de présentation de rubrique (100-150 mots) qui informe sur les prestations/services, donne envie de contacter, et fixe le champ sémantique.

RÈGLES POUR LE TITRE :
- 19 mots MINIMUM
- Commence par la thématique/métier du client
- Inclure des éléments comme "par un spécialiste", "avec devis gratuit", etc.
- Géolocalisation TOUJOURS en fin de titre
- Pas d'impératif, pas de forme interrogative
- Pas de ponctuation excessive
- Utiliser des mots de liaison naturels ("de", "pour")
- Tu peux commencer 1/3 des titres par le métier discerné

RÈGLES POUR LA DESCRIPTION :
- 100 à 150 mots
- Format HTML avec balises <p> et <b> pour les mots-clés importants
- OBLIGATOIRE : au minimum 3 paragraphes <p> distincts avec style="text-align: justify;"
  • Paragraphe 1 : Présentation du service/produit avec mots-clés en gras
  • Paragraphe 2 : Détails techniques, valeur ajoutée, expertise
  • Paragraphe 3 : Zone d'intervention, réassurance, incitation au contact
- Chaque <p> DOIT avoir l'attribut style="text-align: justify;"
- Mettre en gras : localisation, nom d'entreprise, mots-clés du cocon sémantique
- Maximum 2 occurrences d'un même mot en gras
- Rappeler zone d'intervention, certifications, inciter à la prise de contact

VILLE / SECTEUR PRINCIPAL : ${ville}${secteurs2.trim() ? `\nSECTEURS GÉOGRAPHIQUES SECONDAIRES :\n${secteurs2}` : ""}
ARBORESCENCE :
${toAscii()}
${fc}${cc}

RUBRIQUES À TRAITER (TOUTES — parentes ET enfants) : ${rubList}

FORMAT — Pour CHAQUE rubrique, réponds EXACTEMENT ainsi :
===RUBRIQUE: [nom]===
TITRE: [titre de 19+ mots]
HTML:
<p style="text-align: justify;">Premier paragraphe : présentation du service avec <b>mots-clés</b>...</p>
<p style="text-align: justify;">Deuxième paragraphe : détails, expertise, valeur ajoutée...</p>
<p style="text-align: justify;">Troisième paragraphe : zone d'intervention, contact, réassurance...</p>
===FIN===

Génère ${allRubs.length} laïus (1 par rubrique, TOUTES les rubriques). RIEN D'AUTRE.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }) });
      const data = await resp.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
      const blocks = text.split("===RUBRIQUE:").filter(b => b.includes("===FIN==="));
      const parsed = blocks.map(block => {
        const nameMatch = block.match(/^(.+?)===/); const titreMatch = block.match(/TITRE:\s*(.+)/);
        const htmlMatch = block.match(/HTML:\s*([\s\S]*?)===FIN===/);
        return { rubrique: nameMatch?.[1]?.trim() || "", titre: titreMatch?.[1]?.trim() || "", html: htmlMatch?.[1]?.trim() || "" };
      }).filter(r => r.titre && r.html);
      if (!parsed.length) setError("Aucun laïus généré. Réessayez."); else { setResults(parsed); setTab("results"); }
    } catch (err) { setError("Erreur : " + (err.message || "")); }
    finally { setLoading(false); prog.finish(); }
  };

  return (
    <AppShell onBack={onBack} icon={Type} iconColor="#F59E0B" title="Laïus" tabs={[{ id: "params", label: "Paramètres", on: true }, { id: "results", label: "Résultats", on: results.length > 0, badge: results.length || null }]} activeTab={tab} onTabChange={setTab}>
      {tab === "params" && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-amber-500" /><CardTitle className="text-base">Arborescence</CardTitle><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div></CardHeader>
            <CardContent className="pt-0"><RubBuilder rubriques={rubriques} setRubriques={setRubriques} ascii={toAscii()} /></CardContent></Card>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-500" /><CardTitle className="text-base">Informations</CardTitle></div></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2"><div className="flex items-center gap-2"><Label className="text-sm font-semibold">Secteur géographique principal</Label><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div><Input value={ville} onChange={e => setVille(e.target.value)} placeholder="ex: Gardanne dans les Bouches-du-Rhône" className="h-10 text-base" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Secteurs géographiques secondaires</Label><textarea value={secteurs2} onChange={e => setSecteurs2(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Collez ici les secteurs secondaires (un par ligne)" rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Fichiers contextuels</Label><FileUp onFiles={setCtxFiles} /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Consignes supplémentaires (optionnel)</Label><textarea value={consignes} onChange={e => setConsignes(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Informations complémentaires données au LLM." rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
            </CardContent></Card>
          {error && <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
          <GenerateLoader loading={loading} progress={prog.progress} label="Génération des laïus" color="#F59E0B" itemCount={allRubs.length} itemLabel="laïus" />
          {!loading && <Button onClick={generate} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #F59E0B, #d97706)" }}>
            <Send className="h-5 w-5" />Générer les laïus ({allRubs.length} rubriques)
          </Button>}
        </div>
      )}
      {tab === "results" && results.length > 0 && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
          <div className="text-sm text-zinc-500 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3"><strong className="text-zinc-800">💡</strong> Copiez le <span className="font-semibold text-amber-700">titre</span> puis le <span className="font-semibold text-amber-700">HTML</span> pour chaque rubrique.</div>
          {results.map((r, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-4 py-2.5 bg-amber-50 border-b flex items-center justify-between">
                <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700"><FolderTree className="h-3 w-3" />{r.rubrique}</Badge>
                <span className="text-xs text-zinc-400">#{i + 1}</span>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Titre ({cw(r.titre)} mots)</Label><Cp text={r.titre} /></div>
                  <div className="bg-amber-50/50 rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border border-amber-100">{r.titre}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Description HTML</Label><Cp text={r.html} label="Copier HTML" /></div>
                  <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm leading-relaxed border" style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: r.html }} />
                  <details className="text-xs text-zinc-400"><summary className="cursor-pointer hover:text-zinc-600">Voir le code HTML</summary><pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 rounded text-[11px] overflow-auto max-h-40 font-mono">{r.html}</pre></details>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   APP: ANNONCES
   ═══════════════════════════════════════ */
const ANNONCE_TYPES = [
  { id: "express", label: "Express", mots: "50-100", efficacite: "65%", temps: "3-5 min", color: "#10B981" },
  { id: "premium", label: "Premium", mots: "100-200", efficacite: "80%", temps: "10-15 min", color: "#3B82F6" },
  { id: "expert", label: "Expert", mots: "200-300", efficacite: "100%", temps: "25-35 min", color: "#8B5CF6" },
];

function AnnoncesApp({ onBack }) {
  const [tab, setTab] = useState("params");
  const [rubriques, setRubriques] = useState([]);
  const [ville, setVille] = useState(""); const [secteurs2, setSecteurs2] = useState(""); const [ctxFiles, setCtxFiles] = useState([]); const [consignes, setConsignes] = useState("");
  const [annonceType, setAnnonceType] = useState("express"); const [nbParRub, setNbParRub] = useState(3);
  const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const toAscii = useAscii(rubriques);
  const leaves = getLeaves(rubriques);
  const totalAnnonces = leaves.length * nbParRub;
  const typeInfo = ANNONCE_TYPES.find(t => t.id === annonceType);
  const motRange = typeInfo.mots;
  const prog = useProgress(totalAnnonces * 5);

  const generate = async () => {
    if (!rubriques.length || !ville.trim()) { setError("Remplissez arborescence et ville."); return; }
    if (!ctxFiles.length && !consignes.trim()) { setError("Fournissez fichiers ou consignes."); return; }
    setError(""); setLoading(true); setResults([]); prog.start();
    const fc = ctxFiles.length > 0 ? `\nFICHIERS :\n${ctxFiles.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n")}` : "";
    const cc = consignes.trim() ? `\nCONSIGNES :\n${consignes}` : "";
    const distribStr = leaves.map(r => `- "${r}" → ${nbParRub} annonces`).join("\n");

    const prompt = `Tu es un expert en rédaction SEO pour l'agence web Jalis à Marseille. Tu génères des ANNONCES de type ${annonceType.toUpperCase()} pour un site Jalis.

RÉFÉRENTIEL : Livre Bleu du SEO Jalis (Brevet INPI FR3032291).

CHAQUE ANNONCE contient 4 éléments :

1. TITRE LONG (17-28 mots) :
- Schéma : Produit/Service + Spécificité(s) + Géolocalisation
- COMMENCE par le produit/service correspondant au nom de la rubrique
- Ajouter un maximum de spécificités concrètes pour rassurer l'internaute
- Géolocalisation TOUJOURS en fin de titre
- PAS de code postal dans le titre
- Français grammaticalement parfait

2. TITRE COURT (4-5 mots MAXIMUM) :
- Extraits directement du titre long (les mots-clés principaux, PAS une reformulation)
- Ce sont les mots essentiels du titre long

3. EXTRAIT (30 mots MAXIMUM) :
- Résumé court du contenu de la description
- Texte brut, pas de HTML
- Doit donner envie de lire la description complète

4. DESCRIPTION en FORMAT HTML (${motRange} mots) :
- Utilise les balises <p> pour les paragraphes et <strong> pour les mots-clés importants
- OBLIGATOIRE : minimum 3 paragraphes <p> avec style="text-align: justify;"
- Chaque <p> DOIT avoir l'attribut style="text-align: justify;"
- RÈGLES DE MISE EN GRAS avec <strong> :
  • Mettre en gras les mots-clés du cocon sémantique de la rubrique
  • Mettre en gras la géolocalisation (ville, département)
  • Mettre en gras le nom du métier/service principal
  • Maximum 2 occurrences d'un même mot en gras
  • Utiliser <strong> avec PARCIMONIE sur les éléments les plus pertinents
- Répéter TOUS les mots-clés du titre au moins une fois dans le texte
- Mentionner la ville/géolocalisation au moins 3 fois dans le texte (~3%)
- Mettre en avant la VALEUR AJOUTÉE du produit/service
- Inclure un appel à l'action avec contact (téléphone, devis gratuit, etc.)
- Éléments de réassurance : ancienneté, certifications, expertise
- Varier les spécificités techniques d'une annonce à l'autre
- Ton HUMAIN et FLUIDE — pas de formulations robotiques
- NE PAS utiliser : "n'hésitez pas", "nous sommes fiers", "bienvenue", "en conclusion", "en outre", "dès aujourd'hui", "nous comprenons l'importance de"

GÉOLOCALISATION :
- Ville < 20k hab → "à {ville} proche de {grande ville}"
- Ville > 20k hab → "à {ville} {CP} dans le département {nom}"
- Varier les secteurs autour de ${ville}

ARBORESCENCE :
${toAscii()}

VILLE PRINCIPALE : ${ville}${secteurs2.trim() ? `\nSECTEURS GÉOGRAPHIQUES SECONDAIRES :\n${secteurs2}` : ""}

RÉPARTITION :
${distribStr}

TOTAL : ${totalAnnonces} annonces exactement.
${fc}${cc}

FORMAT STRICT pour chaque annonce :
===ANNONCE===
RUBRIQUE: [nom]
TITRE_LONG: [17-28 mots avec géoloc, sans code postal]
TITRE_COURT: [4-5 mots extraits du titre long]
EXTRAIT: [30 mots max, résumé accrocheur]
HTML:
<p style="text-align: justify;">Premier paragraphe avec <strong>mots-clés</strong> en gras...</p>
<p style="text-align: justify;">Deuxième paragraphe, expertise et valeur ajoutée...</p>
<p style="text-align: justify;">Troisième paragraphe avec incitation au contact...</p>
===FIN===

Génère EXACTEMENT ${totalAnnonces} annonces. RIEN D'AUTRE.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }) });
      const data = await resp.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
      const blocks = text.split("===ANNONCE===").filter(b => b.includes("===FIN==="));
      let parsed = blocks.map(block => {
        const rub = block.match(/RUBRIQUE:\s*(.+)/)?.[1]?.trim() || "";
        const tl = block.match(/TITRE_LONG:\s*(.+)/)?.[1]?.trim() || "";
        const tc = block.match(/TITRE_COURT:\s*(.+)/)?.[1]?.trim() || "";
        const ext = block.match(/EXTRAIT:\s*(.+)/)?.[1]?.trim() || "";
        const html = block.match(/HTML:\s*([\s\S]*?)===FIN===/)?.[1]?.trim() || "";
        return { rubrique: rub, titreCourt: tc, titreLong: tl, extrait: ext, html: html };
      }).filter(r => r.titreCourt && r.html);
      if (parsed.length > totalAnnonces) parsed = parsed.slice(0, totalAnnonces);
      if (!parsed.length) setError("Aucune annonce générée. Réessayez."); else { setResults(parsed); setTab("results"); }
    } catch (err) { setError("Erreur : " + (err.message || "")); }
    finally { setLoading(false); prog.finish(); }
  };

  return (
    <AppShell onBack={onBack} icon={Newspaper} iconColor="#10B981" title="Annonces" tabs={[{ id: "params", label: "Paramètres", on: true }, { id: "results", label: "Résultats", on: results.length > 0, badge: results.length || null }]} activeTab={tab} onTabChange={setTab}>
      {tab === "params" && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-emerald-500" /><CardTitle className="text-base">Arborescence</CardTitle><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div></CardHeader>
            <CardContent className="pt-0"><RubBuilder rubriques={rubriques} setRubriques={setRubriques} ascii={toAscii()} /></CardContent></Card>

          {/* Type d'annonce */}
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileCheck className="h-5 w-5 text-emerald-500" />Type d'annonce</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ANNONCE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setAnnonceType(t.id)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-300 ${annonceType === t.id ? "border-current shadow-lg -translate-y-0.5 bg-white" : "border-zinc-200 bg-zinc-50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
                    style={annonceType === t.id ? { borderColor: t.color } : {}}>
                    <div className="text-sm font-semibold mb-1" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-zinc-500">{t.mots} mots</div>
                    <div className="text-xs text-zinc-400">Efficacité {t.efficacite}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Annonces par rubrique</Label><span className="text-2xl font-black" style={{ color: typeInfo.color }}>{nbParRub}</span></div>
                <input type="range" min={1} max={10} step={1} value={nbParRub} onChange={e => setNbParRub(Number(e.target.value))} className="w-full h-2 accent-emerald-500" />
                <div className="flex justify-between text-xs text-zinc-400"><span>1</span><span>10</span></div>
              </div>
              {leaves.length > 0 && <div className="text-sm font-medium p-3 rounded-xl border" style={{ background: `${typeInfo.color}08`, borderColor: `${typeInfo.color}30`, color: typeInfo.color }}>
                Total : {totalAnnonces} annonces {typeInfo.label} ({leaves.length} rubriques × {nbParRub})
              </div>}
            </CardContent></Card>

          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-500" /><CardTitle className="text-base">Informations</CardTitle></div></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2"><div className="flex items-center gap-2"><Label className="text-sm font-semibold">Secteur géographique principal</Label><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div><Input value={ville} onChange={e => setVille(e.target.value)} placeholder="ex: Toulon, Aix-en-Provence..." className="h-10 text-base" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Secteurs géographiques secondaires</Label><textarea value={secteurs2} onChange={e => setSecteurs2(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Collez ici les secteurs secondaires (un par ligne)" rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Fichiers contextuels</Label><FileUp onFiles={setCtxFiles} /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Consignes supplémentaires (optionnel)</Label><textarea value={consignes} onChange={e => setConsignes(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Informations complémentaires données au LLM." rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
            </CardContent></Card>
          {error && <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
          <GenerateLoader loading={loading} progress={prog.progress} label="Génération des annonces" color="#10B981" itemCount={totalAnnonces} itemLabel={`annonces ${typeInfo.label}`} />
          {!loading && <Button onClick={generate} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #10B981, #059669)" }}>
            <Send className="h-5 w-5" />Générer {totalAnnonces} annonces {typeInfo.label}
          </Button>}
        </div>
      )}
      {tab === "results" && results.length > 0 && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
          <div className="text-sm text-zinc-500 bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3"><strong className="text-zinc-800">💡</strong> 4 champs par annonce : <span className="font-semibold text-sky-600">Titre</span>, <span className="font-semibold text-emerald-700">Titre court</span>, <span className="font-semibold text-amber-600">Extrait</span> et <span className="font-semibold text-violet-600">Description HTML</span>.</div>
          {results.map((r, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-4 py-2.5 bg-emerald-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700"><FolderTree className="h-3 w-3" />{r.rubrique}</Badge><Badge style={{ background: typeInfo.color }} className="text-[10px] text-white">{typeInfo.label}</Badge></div>
                <span className="text-xs text-zinc-400">#{i + 1}</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-sky-600 uppercase tracking-wider">Titre ({cw(r.titreLong)}m)</Label><Cp text={r.titreLong} /></div>
                  <div className="bg-sky-50/50 rounded-xl px-4 py-2.5 text-[14px] leading-relaxed font-semibold border border-sky-100">{r.titreLong}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Titre court ({cw(r.titreCourt)}m)</Label><Cp text={r.titreCourt} /></div>
                  <div className="bg-emerald-50/50 rounded-xl px-4 py-2.5 text-base font-bold border border-emerald-100">{r.titreCourt}</div>
                </div>
                {r.extrait && <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Extrait ({cw(r.extrait)}m)</Label><Cp text={r.extrait} /></div>
                  <div className="bg-amber-50/50 rounded-xl px-4 py-2.5 text-sm italic leading-relaxed border border-amber-100" style={{ textAlign: "justify" }}>{r.extrait}</div>
                </div>}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Description HTML TinyMCE</Label><Cp text={r.html} label="Copier HTML" /></div>
                  <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm leading-relaxed border" style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: r.html }} />
                  <details className="text-xs text-zinc-400"><summary className="cursor-pointer hover:text-zinc-600">Voir le code HTML (TinyMCE)</summary><pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 rounded text-[11px] overflow-auto max-h-40 font-mono">{r.html}</pre></details>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   APP: JALIS EXPRESS (compact)
   ═══════════════════════════════════════ */
function JalisExpressApp({ onBack }) {
  const [tab, setTab] = useState("params");
  const [rubriques, setRubriques] = useState([]); const [ville, setVille] = useState(""); const [secteurs2, setSecteurs2] = useState(""); const [ctxFiles, setCtxFiles] = useState([]); const [consignes, setConsignes] = useState("");
  const [nb, setNb] = useState(10); const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const toAscii = useAscii(rubriques);
  const leaves = getLeaves(rubriques);
  const distrib = (() => { const l = leaves; if (!l.length) return []; const b = Math.floor(nb / l.length); const r = nb % l.length; return l.map((n, i) => ({ name: n, count: b + (i < r ? 1 : 0) })); })();
  const prog = useProgress(nb * 3);

  const generate = async () => {
    if (!rubriques.length || !ville.trim()) { setError("Remplissez arborescence et ville."); return; }
    if (!ctxFiles.length && !consignes.trim()) { setError("Fournissez fichiers ou consignes."); return; }
    setError(""); setLoading(true); setResults([]); prog.start();
    const ds = distrib.map(d => `- "${d.name}" → EXACTEMENT ${d.count}`).join("\n");
    const fc = ctxFiles.length > 0 ? `\nFICHIERS :\n${ctxFiles.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n")}` : "";
    const cc = consignes.trim() ? `\nCONSIGNES :\n${consignes}` : "";
    const s2 = secteurs2.trim() ? `\nSECTEURS SECONDAIRES :\n${secteurs2}` : "";
    const prompt = `Expert SEO Jalis. Jalis Express (brevet INPI FR3032291). TOTAL 2 champs = ~17 mots.\n\nCHAMP "Activité et spécificité" : ~12 mots (10-14), vraie requête Google, commence par produit/service rubrique.\nCHAMP "Géolocalisation" : ~5 mots (4-6), commence par "à", ville <20k="à X proche de Y", ville >20k="à X CP dans département Z". Varier autour de ${ville}.${s2}\n\nARBORESCENCE :\n${toAscii()}\n\nVILLE PRINCIPALE : ${ville}${s2}\nRÉPARTITION :\n${ds}\n⚠️ EXACTEMENT ${nb} LIGNES.\n${fc}${cc}\n\nFORMAT :\n1. RUBRIQUE: [nom] | ACTIVITE: [~12m] | GEO: [à + ~5m]\n...\n${nb}. RUBRIQUE: [nom] | ACTIVITE: [~12m] | GEO: [à + ~5m]\nRIEN D'AUTRE.`;
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }) });
      const data = await resp.json(); const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
      let parsed = text.split("\n").filter(l => l.includes("ACTIVITE:") && l.includes("GEO:")).map(l => { const c = l.replace(/^\d+[\.\)\-]\s*/, "").trim(); const p = c.split("|").map(x => x.trim()); let r="",a="",g=""; for (const x of p) { if (/^RUBRIQUE:/i.test(x)) r=x.replace(/^RUBRIQUE:\s*/i,""); else if (/^ACTIVITE:/i.test(x)) a=x.replace(/^ACTIVITE:\s*/i,""); else if (/^GEO:/i.test(x)) g=x.replace(/^GEO:\s*/i,""); } return { rubrique:r.trim(), activite:a.trim(), geo:g.trim() }; }).filter(r => r.activite && r.geo);
      if (parsed.length > nb) parsed = parsed.slice(0, nb);
      if (!parsed.length) setError("Réessayez."); else { setResults(parsed); setTab("results"); }
    } catch (err) { setError("Erreur : " + (err.message || "")); } finally { setLoading(false); prog.finish(); }
  };

  return (
    <AppShell onBack={onBack} icon={Zap} iconColor={JB} title="Jalis Express" badge="INPI FR3032291" tabs={[{ id: "params", label: "Paramètres", on: true }, { id: "results", label: "Résultats", on: results.length > 0, badge: results.length || null }]} activeTab={tab} onTabChange={setTab}>
      {tab === "params" && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><FolderTree className="h-5 w-5" style={{ color: JB }} /><CardTitle className="text-base">Arborescence</CardTitle><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div></CardHeader><CardContent className="pt-0"><RubBuilder rubriques={rubriques} setRubriques={setRubriques} ascii={toAscii()} /></CardContent></Card>
          {distrib.length > 0 && <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl border" style={{ background: `${JB}08`, borderColor: `${JB}30` }}><span className="text-xs font-bold" style={{ color: JB }}>Répartition ({nb}) :</span>{distrib.map((d, i) => <Badge key={i} variant="secondary" className="text-xs gap-1 bg-white border border-zinc-200">{d.name} <span className="font-bold" style={{ color: JB }}>×{d.count}</span></Badge>)}</div>}
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><MapPin className="h-5 w-5" style={{ color: JB }} /><CardTitle className="text-base">Informations</CardTitle></div></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2"><div className="flex items-center gap-2"><Label className="text-sm font-semibold">Secteur géographique principal</Label><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div><Input value={ville} onChange={e => setVille(e.target.value)} placeholder="ex: La Valette-du-Var" className="h-10 text-base" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Secteurs géographiques secondaires</Label><textarea value={secteurs2} onChange={e => setSecteurs2(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Collez ici les secteurs secondaires (un par ligne)" rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
              <Separator className="bg-zinc-100/50" /><div className="space-y-2"><Label className="text-sm font-semibold">Fichiers</Label><FileUp onFiles={setCtxFiles} /></div>
              <Separator className="bg-zinc-100/50" /><div className="space-y-2"><Label className="text-sm font-semibold">Consignes supplémentaires (optionnel)</Label><textarea value={consignes} onChange={e => setConsignes(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Informations complémentaires données au LLM." rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
            </CardContent></Card>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardContent className="p-5 space-y-4">
            <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-sm font-semibold">Jalis Express</Label><span className="text-3xl font-black" style={{ color: JB }}>{nb}</span></div><input type="range" min={5} max={60} step={5} value={nb} onChange={e => setNb(Number(e.target.value))} className="w-full h-2 accent-sky-500" /><div className="flex justify-between text-xs text-zinc-400"><span>5</span><span>60</span></div></div>
            {error && <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
            <GenerateLoader loading={loading} progress={prog.progress} label="Génération des Jalis Express" color={JB} itemCount={nb} itemLabel="expressions" />
            {!loading && <Button onClick={generate} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: `linear-gradient(to right, ${JB}, #1aa3c4)` }}><Send className="h-5 w-5" />Générer {nb} Jalis Express</Button>}
          </CardContent></Card>
        </div>
      )}
      {tab === "results" && results.length > 0 && (
        <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4">
          <div className="text-sm text-zinc-500 bg-sky-50/80 border border-sky-200/60 rounded-xl p-3"><strong>💡</strong> Copiez <span className="font-semibold" style={{ color: JB }}>Activité</span> → 1er champ, <span className="font-semibold text-rose-600">Géoloc</span> → 2ème champ.</div>
          {results.map((item, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${JB}20` }}><span className="text-xs font-bold" style={{ color: JB }}>{i + 1}</span></div>{item.rubrique && <Badge variant="outline" className="text-xs gap-1 border-zinc-200 text-zinc-600"><FolderTree className="h-3 w-3" />{item.rubrique}</Badge>}</div></div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full" style={{ background: JB }} /><Label className="text-xs font-bold uppercase tracking-wider" style={{ color: JB }}>Activité</Label></div><Cp text={item.activite} /></div><div className="rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border" style={{ background: `${JB}08`, borderColor: `${JB}20` }}>{item.activite}</div></div>
                <div className="space-y-1.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full bg-rose-500" /><Label className="text-xs font-bold text-rose-600 uppercase tracking-wider">Géoloc</Label></div><Cp text={item.geo} /></div><div className="bg-rose-50 rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border border-rose-100">{item.geo}</div></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   APP: GUIDE LOCAL (stub)
   ═══════════════════════════════════════ */
function GuideLocalApp({ onBack }) {
  const [businesses, setBusinesses] = useState([]);
  const [companyName, setCompanyName] = useState(""); const [address, setAddress] = useState(""); const [placeId, setPlaceId] = useState("");
  const [maxResults, setMaxResults] = useState(10); const [isLoading, setIsLoading] = useState(false);
  const handleSearch = async () => {
    if (!companyName.trim() || !placeId) return;
    setIsLoading(true); setBusinesses([]);
    // TODO: connecter Google Places API
    const fake = Array.from({ length: maxResults }, (_, i) => ({ nom: `Entreprise ${i + 1}`, type_activite: "Commerce", adresse: `${Math.floor(Math.random()*200+1)} Rue Exemple, ${address}`, telephone: `04 ${String(Math.floor(Math.random()*90+10))} ${String(Math.floor(Math.random()*90+10))} ${String(Math.floor(Math.random()*90+10))} ${String(Math.floor(Math.random()*90+10))}`, site_web: `https://exemple-${i+1}.fr`, lien_maps: `https://maps.google.com/?q=entreprise+${i+1}`, rating: +(Math.random()*2+3).toFixed(1), avis: Math.floor(Math.random()*500+5) }));
    await new Promise(r => setTimeout(r, 1500)); setBusinesses(fake); setIsLoading(false);
  };
  return (
    <AppShell onBack={onBack} icon={BookOpen} iconColor="#EC4899" title="Guide Local">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10 space-y-4"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 border"><Sparkles className="h-4 w-4 text-zinc-500" /><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Génération de liens utiles</span></div><h1 className="text-4xl font-black text-zinc-900 leading-tight">Guide local automatisé<br />avec l'IA</h1></div>
        <Card className="max-w-3xl mx-auto mb-8 border-zinc-200"><CardContent className="pt-8 pb-8 px-8 space-y-6">
          <div className="space-y-2"><Label className="text-sm font-bold uppercase tracking-wide">Nom de votre entreprise</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Jalis" className="h-10 text-base" /></div>
          <div className="space-y-2"><Label className="text-sm font-bold uppercase tracking-wide">Adresse</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" /><Input value={address} onChange={e => { setAddress(e.target.value); if (e.target.value.length > 3) setPlaceId("stub_" + Date.now()); }} placeholder="Ex: 160 Rue Albert Einstein, 13013 Marseille" className="h-12 text-base pl-11" /></div></div>
          <div className="space-y-2"><div className="flex items-center justify-between"><Label className="text-sm font-bold uppercase tracking-wide">Nombre</Label><span className="text-lg font-black text-pink-500">{maxResults}</span></div><input type="range" min={1} max={50} step={1} value={maxResults} onChange={e => setMaxResults(Number(e.target.value))} className="w-full accent-pink-500 h-2" /></div>
          <Button onClick={handleSearch} disabled={isLoading || !placeId || !companyName.trim()} className="w-full h-12 text-base font-semibold rounded-lg text-white shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #EC4899, #db2777)" }}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recherche...</> : <><Search className="mr-2 h-4 w-4" />Générer</>}</Button>
        </CardContent></Card>
        {businesses.length > 0 && <div className="space-y-4">{businesses.map((b, i) => <Card key={i} className="border-zinc-200 overflow-hidden group hover:shadow-lg transition-all"><div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-sky-500" /><CardHeader className="pb-3"><div className="flex items-start justify-between gap-4"><div className="space-y-2"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-pink-500" /><CardTitle className="text-xl">{b.nom}<span className="text-sm font-normal text-zinc-400 ml-2">⭐ {b.rating} ({b.avis} avis)</span></CardTitle></div><Badge variant="secondary" className="text-xs">{b.type_activite}</Badge><div className="flex items-start gap-2 text-zinc-500"><MapPin className="h-4 w-4 mt-0.5" /><span className="text-sm">{b.adresse}</span></div></div><Button variant="ghost" size="icon" onClick={() => setBusinesses(p => p.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-red-500"><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent><div className="flex flex-wrap gap-3"><a href={`tel:${b.telephone}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-50/80 border border-sky-200/60"><Phone className="h-4 w-4 text-sky-500" /><span className="text-sm font-medium">{b.telephone}</span></a><a href={b.site_web} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-50 border border-violet-200"><Globe className="h-4 w-4 text-violet-500" /><span className="text-sm font-medium truncate max-w-[200px]">{b.site_web.replace(/^https?:\/\//, "")}</span><ExternalLink className="h-3 w-3 opacity-50" /></a><a href={b.lien_maps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200/60"><MapPin className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium">Google Maps</span><ExternalLink className="h-3 w-3 opacity-50" /></a></div></CardContent></Card>)}</div>}
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   APP: REMPLISSAGE (Wizard multi-étapes)
   ═══════════════════════════════════════ */
function RemplissageApp({ onBack }) {
  // Shared state (renseigné une seule fois)
  const [rubriques, setRubriques] = useState([]);
  const [ville, setVille] = useState("");
  const [villesSecondaires, setVillesSecondaires] = useState("");
  const [ctxFiles, setCtxFiles] = useState([]);
  const [consignes, setConsignes] = useState("");

  // Wizard step: "setup" → "accueil-config" → "accueil" → "laius" → "annonces-config" → "annonces" → "express-config" → "express"
  const [step, setStep] = useState("setup");

  // Accueil config + results
  const [accueilSections, setAccueilSections] = useState([{ id: 1, theme: "" }]);
  const [accueilResults, setAccueilResults] = useState([]);
  const [accueilLoading, setAccueilLoading] = useState(false);

  // Laïus results
  const [laiusResults, setLaiusResults] = useState([]);
  const [laiusLoading, setLaiusLoading] = useState(false);

  // Annonces config + results
  const [annonceType, setAnnonceType] = useState("express");
  const [nbParRub, setNbParRub] = useState(3);
  const [annoncesResults, setAnnoncesResults] = useState([]);
  const [annoncesLoading, setAnnoncesLoading] = useState(false);

  // Express config + results
  const [nbExpress, setNbExpress] = useState(10);
  const [expressResults, setExpressResults] = useState([]);
  const [expressLoading, setExpressLoading] = useState(false);

  const [error, setError] = useState("");
  const toAscii = useAscii(rubriques);
  const leaves = getLeaves(rubriques);
  const typeInfo = ANNONCE_TYPES.find(t => t.id === annonceType);
  const totalAnnonces = leaves.length * nbParRub;
  const distribExpress = (() => { const l = leaves; if (!l.length) return []; const b = Math.floor(nbExpress / l.length); const r = nbExpress % l.length; return l.map((n, i) => ({ name: n, count: b + (i < r ? 1 : 0) })); })();

  const progAccueil = useProgress(15);
  const progLaius = useProgress(rubriques.length * 8);
  const progAnnonces = useProgress(totalAnnonces * 5);
  const progExpress = useProgress(nbExpress * 3);

  const fileCtx = ctxFiles.length > 0 ? `\nFICHIERS :\n${ctxFiles.map(f => `--- ${f.name} ---\n${f.content}`).join("\n\n")}` : "";
  const consCtx = consignes.trim() ? `\nCONSIGNES :\n${consignes}` : "";
  const geoCtx = villesSecondaires.trim() ? `\nSECTEURS SECONDAIRES : ${villesSecondaires}` : "";

  const callAI = async (prompt) => {
    const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }) });
    const data = await resp.json();
    return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
  };

  // Step Accueil → Generate homepage texts
  const generateAccueil = async () => {
    setError(""); setAccueilLoading(true); progAccueil.start();
    const sections = accueilSections.filter(s => s.theme.trim());
    if (!sections.length) { setError("Ajoutez au moins une section avec une thématique."); setAccueilLoading(false); progAccueil.reset(); return; }
    const secList = sections.map((s, i) => `Section ${i + 1} : "${s.theme}"`).join("\n");
    const prompt = `Rédacteur web SEO agence Jalis. Génère les textes de la PAGE D'ACCUEIL d'un site internet.

CONTEXTE : La page d'accueil comporte ${sections.length} section(s) de texte. Chaque section a une thématique différente. Les textes doivent être COMPLÉMENTAIRES entre eux, pas redondants.

GUIDELINES PAGE D'ACCUEIL :
- Structurer et présenter la société et ses prestations
- On peut retrouver : historique de la société, services et produits, zone de chalandise, secteurs d'intervention, cœur de métier, certifications et partenaires, éléments de différenciation
- Chaque section = minimum 200 mots
- Paragraphes clairs pour le confort de lecture
- Faire ressortir des éléments forts pour l'internaute

POUR CHAQUE SECTION :
1. TITRE : 8 à 12 mots, géolocalisé sur la ville principale (${ville}), pas de forme interrogative, pas d'impératif
2. DESCRIPTION HTML :
   - Minimum 200 mots
   - Format HTML avec <p> et <b>
   - OBLIGATOIRE : minimum 3 paragraphes <p> avec style="text-align: justify;"
- Chaque <p> DOIT avoir l'attribut style="text-align: justify;"
   - Style justifié : chaque <p> doit avoir style="text-align: justify;"
   - Mots-clés en <b> avec parcimonie (max 2 occurrences par mot-clé)
   - Géolocalisation en gras
   - Éléments de réassurance, incitation au contact

⚠️ IMPORTANT : Les ${sections.length} textes doivent être COMPLÉMENTAIRES. Chacun aborde un angle DIFFÉRENT. Pas de répétition entre les sections.

VILLE : ${ville}${geoCtx}
ARBORESCENCE DU SITE :\n${toAscii()}
${fileCtx}${consCtx}

SECTIONS DEMANDÉES :
${secList}

FORMAT pour CHAQUE section :
===SECTION: [thématique]===
TITRE: [8-12 mots géolocalisé]
HTML:
<p style="text-align: justify;">Premier paragraphe...</p>
<p style="text-align: justify;">Deuxième paragraphe...</p>
<p style="text-align: justify;">Troisième paragraphe...</p>
===FIN===

Génère ${sections.length} section(s). RIEN D'AUTRE.`;
    try {
      const text = await callAI(prompt);
      const blocks = text.split("===SECTION:").filter(b => b.includes("===FIN==="));
      const parsed = blocks.map(block => {
        const nm = block.match(/^(.+?)===/)?.[1]?.trim() || "";
        const ti = block.match(/TITRE:\s*(.+)/)?.[1]?.trim() || "";
        const ht = block.match(/HTML:\s*([\s\S]*?)===FIN===/)?.[1]?.trim() || "";
        return { section: nm, titre: ti, html: ht };
      }).filter(r => r.titre && r.html);
      if (!parsed.length) { setError("Erreur accueil. Réessayez."); } else { setAccueilResults(parsed); setStep("accueil"); }
    } catch (e) { setError("Erreur : " + (e.message || "")); }
    finally { setAccueilLoading(false); progAccueil.finish(); }
  };

  // Step 1 → Generate Laïus (ALL rubriques: parentes + enfants)
  const allRubs = rubriques.map(r => r.name);
  const generateLaius = async () => {
    setError(""); setLaiusLoading(true); progLaius.start();
    const rubList = allRubs.map(r => `"${r}"`).join(", ");
    const prompt = `Rédacteur web SEO agence Jalis. Génère un TITRE + DESCRIPTION HTML de laïus pour CHAQUE rubrique (parentes ET sous-rubriques).

TITRE : 19 mots MINIMUM, commence par thématique/métier, géolocalisation en fin, éléments de réassurance ("spécialiste", "devis gratuit"), pas d'impératif, mots de liaison naturels.
DESCRIPTION : 100-150 mots, HTML avec <p> et <b>.
- OBLIGATOIRE : minimum 3 paragraphes <p> avec style="text-align: justify;"
- Chaque <p> DOIT avoir l'attribut style="text-align: justify;"
  • Paragraphe 1 : Présentation du service avec mots-clés en gras
  • Paragraphe 2 : Détails techniques, valeur ajoutée, expertise
  • Paragraphe 3 : Zone d'intervention, réassurance, incitation au contact
- Mots-clés en gras (max 2 occurrences par mot), localisation en gras

VILLE : ${ville}${geoCtx}
ARBORESCENCE :\n${toAscii()}
${fileCtx}${consCtx}

RUBRIQUES (TOUTES — parentes ET enfants) : ${rubList}

FORMAT pour CHAQUE rubrique :
===RUBRIQUE: [nom]===
TITRE: [titre 19+ mots]
HTML:
<p>Premier paragraphe...</p>
<p style="text-align: justify;">Deuxième paragraphe...</p>
<p>Troisième paragraphe...</p>
===FIN===

Génère ${allRubs.length} laïus. RIEN D'AUTRE.`;
    try {
      const text = await callAI(prompt);
      const blocks = text.split("===RUBRIQUE:").filter(b => b.includes("===FIN==="));
      const parsed = blocks.map(block => {
        const nm = block.match(/^(.+?)===/)?.[1]?.trim() || "";
        const ti = block.match(/TITRE:\s*(.+)/)?.[1]?.trim() || "";
        const ht = block.match(/HTML:\s*([\s\S]*?)===FIN===/)?.[1]?.trim() || "";
        return { rubrique: nm, titre: ti, html: ht };
      }).filter(r => r.titre && r.html);
      if (!parsed.length) { setError("Erreur laïus. Réessayez."); } else { setLaiusResults(parsed); setStep("laius"); }
    } catch (e) { setError("Erreur : " + (e.message || "")); }
    finally { setLaiusLoading(false); progLaius.finish(); }
  };

  // Step 2 → Generate Annonces
  const generateAnnonces = async () => {
    setError(""); setAnnoncesLoading(true); progAnnonces.start();
    const distribStr = leaves.map(r => `- "${r}" → ${nbParRub} annonces`).join("\n");
    const prompt = `Expert rédaction SEO agence Jalis. Annonces ${annonceType.toUpperCase()} — Livre Bleu du SEO Jalis.

CHAQUE ANNONCE contient 4 éléments :
- TITRE_LONG (17-28 mots) : commence par produit/service rubrique, géoloc en fin, PAS de code postal dans le titre, français parfait
- TITRE_COURT (4-5 mots MAXIMUM) : mots-clés principaux EXTRAITS directement du titre long (pas une reformulation)
- EXTRAIT (30 mots MAXIMUM) : résumé accrocheur du contenu, texte brut sans HTML
- DESCRIPTION en HTML (${typeInfo.mots} mots)

RÈGLES DESCRIPTION HTML :
- Balises <p> et <strong> pour mots-clés importants
- OBLIGATOIRE : minimum 3 paragraphes <p> avec style="text-align: justify;"
- Chaque <p> DOIT avoir l'attribut style="text-align: justify;"
- <strong> sur : mots-clés sémantiques, géolocalisation, métier (max 2 fois par mot-clé)
- Répéter les mots-clés du titre au moins 1 fois
- Géolocalisation mentionnée 3 fois (~3%)
- Varier les spécificités techniques d'une annonce à l'autre
- Inclure un appel à l'action avec contact (téléphone, devis gratuit)
- Valeur ajoutée, réassurance, ton humain et fluide
- Interdit : "n'hésitez pas", "nous sommes fiers", "bienvenue", "en conclusion", "en outre"

Géoloc : ville <20k = "à X proche de Y", ville >20k = "à X CP dans département Z". Varier autour de ${ville}.${geoCtx}

ARBORESCENCE :\n${toAscii()}
RÉPARTITION :\n${distribStr}
TOTAL : ${totalAnnonces} annonces.
${fileCtx}${consCtx}

FORMAT :
===ANNONCE===
RUBRIQUE: [nom]
TITRE_LONG: [17-28 mots avec géoloc, sans code postal]
TITRE_COURT: [4-5 mots extraits du titre long]
EXTRAIT: [30 mots max, résumé accrocheur]
HTML:
<p style="text-align: justify;">Premier paragraphe avec <strong>mots-clés</strong>...</p>
<p style="text-align: justify;">Deuxième paragraphe, expertise et valeur ajoutée...</p>
<p style="text-align: justify;">Troisième paragraphe, contact et réassurance...</p>
===FIN===

EXACTEMENT ${totalAnnonces} annonces. RIEN D'AUTRE.`;
    try {
      const text = await callAI(prompt);
      const blocks = text.split("===ANNONCE===").filter(b => b.includes("===FIN==="));
      let parsed = blocks.map(block => ({
        rubrique: block.match(/RUBRIQUE:\s*(.+)/)?.[1]?.trim() || "",
        titreLong: block.match(/TITRE_LONG:\s*(.+)/)?.[1]?.trim() || "",
        titreCourt: block.match(/TITRE_COURT:\s*(.+)/)?.[1]?.trim() || "",
        extrait: block.match(/EXTRAIT:\s*(.+)/)?.[1]?.trim() || "",
        html: block.match(/HTML:\s*([\s\S]*?)===FIN===/)?.[1]?.trim() || "",
      })).filter(r => r.titreCourt && r.html);
      if (parsed.length > totalAnnonces) parsed = parsed.slice(0, totalAnnonces);
      if (!parsed.length) { setError("Erreur annonces. Réessayez."); } else { setAnnoncesResults(parsed); setStep("annonces"); }
    } catch (e) { setError("Erreur : " + (e.message || "")); }
    finally { setAnnoncesLoading(false); progAnnonces.finish(); }
  };

  // Step 3 → Generate Express
  const generateExpress = async () => {
    setError(""); setExpressLoading(true); progExpress.start();
    const ds = distribExpress.map(d => `- "${d.name}" → EXACTEMENT ${d.count}`).join("\n");
    const prompt = `Expert SEO Jalis. Jalis Express (INPI FR3032291). Total 2 champs = ~17 mots.
"Activité et spécificité" : ~12 mots (10-14), vraie requête Google, commence par produit/service rubrique.
"Géolocalisation" : ~5 mots (4-6), commence par "à", ville <20k="à X proche de Y", >20k="à X CP dans département Z". Varier autour de ${ville}.${geoCtx}

ARBORESCENCE :\n${toAscii()}
RÉPARTITION :\n${ds}
⚠️ EXACTEMENT ${nbExpress} LIGNES.
${fileCtx}${consCtx}

FORMAT :
1. RUBRIQUE: [nom] | ACTIVITE: [~12m] | GEO: [à + ~5m]
...
${nbExpress}. RUBRIQUE: [nom] | ACTIVITE: [~12m] | GEO: [à + ~5m]
RIEN D'AUTRE.`;
    try {
      const text = await callAI(prompt);
      let parsed = text.split("\n").filter(l => l.includes("ACTIVITE:") && l.includes("GEO:")).map(l => { const c = l.replace(/^\d+[\.\)\-]\s*/, "").trim(); const p = c.split("|").map(x => x.trim()); let r="",a="",g=""; for (const x of p) { if (/^RUBRIQUE:/i.test(x)) r=x.replace(/^RUBRIQUE:\s*/i,""); else if (/^ACTIVITE:/i.test(x)) a=x.replace(/^ACTIVITE:\s*/i,""); else if (/^GEO:/i.test(x)) g=x.replace(/^GEO:\s*/i,""); } return { rubrique:r.trim(), activite:a.trim(), geo:g.trim() }; }).filter(r => r.activite && r.geo);
      if (parsed.length > nbExpress) parsed = parsed.slice(0, nbExpress);
      if (!parsed.length) { setError("Erreur express. Réessayez."); } else { setExpressResults(parsed); setStep("express"); }
    } catch (e) { setError("Erreur : " + (e.message || "")); }
    finally { setExpressLoading(false); progExpress.finish(); }
  };

  const STEPS = [
    { id: "setup", num: "1" },
    { id: "accueil-config", num: "2" }, { id: "accueil", num: "2" },
    { id: "laius", num: "3" },
    { id: "annonces-config", num: "4" }, { id: "annonces", num: "4" },
    { id: "express-config", num: "5" }, { id: "express", num: "5" },
  ];
  const stepIdx = STEPS.findIndex(s => s.id === step);

  return (
    <AppShell onBack={onBack} icon={FileEdit} iconColor="#8B5CF6" title="Remplissage de site">
      {/* Stepper */}
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-1 sm:gap-2">
          {[{ n: "1", l: "Infos" }, { n: "2", l: "Accueil" }, { n: "3", l: "Laïus" }, { n: "4", l: "Annonces" }, { n: "5", l: "Express" }].map((s, i) => {
            const active = parseInt(STEPS[stepIdx]?.num) === i + 1;
            const done = parseInt(STEPS[stepIdx]?.num) > i + 1;
            return (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold shrink-0 transition-all duration-300 ${active ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" : done ? "bg-violet-400 text-white" : "bg-zinc-200 text-zinc-400"}`}>{done ? <Check className="h-3 w-3" /> : s.n}</div>
                <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${active ? "text-violet-700" : done ? "text-violet-400" : "text-zinc-400"}`}>{s.l}</span>
                {i < 4 && <div className={`flex-1 h-px ${done ? "bg-violet-300" : "bg-zinc-200"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
        {error && <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

        {/* STEP: SETUP */}
        {step === "setup" && (<>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><FolderTree className="h-5 w-5 text-violet-500" /><CardTitle className="text-base">Arborescence du site</CardTitle><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div></CardHeader>
            <CardContent className="pt-0"><RubBuilder rubriques={rubriques} setRubriques={setRubriques} ascii={toAscii()} /></CardContent></Card>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-violet-500" /><CardTitle className="text-base">Localisation & Contexte</CardTitle></div></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2"><div className="flex items-center gap-2"><Label className="text-sm font-semibold">Secteur géographique principal</Label><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div><Input value={ville} onChange={e => setVille(e.target.value)} placeholder="ex: Toulon, Aix-en-Provence..." className="h-10 text-base" /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Secteurs géographiques secondaires</Label><textarea value={villesSecondaires} onChange={e => setVillesSecondaires(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Collez ici les secteurs secondaires (un par ligne)" rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Fichiers contextuels du client</Label><FileUp onFiles={setCtxFiles} /></div>
              <Separator className="bg-zinc-100/50" />
              <div className="space-y-2"><Label className="text-sm font-semibold">Consignes supplémentaires (optionnel)</Label><textarea value={consignes} onChange={e => setConsignes(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Informations complémentaires données au LLM." rows={1} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" /></div>
            </CardContent></Card>
          <Button onClick={() => { if (!rubriques.length || !ville.trim()) { setError("Remplissez arborescence et ville."); return; } if (!ctxFiles.length && !consignes.trim()) { setError("Fournissez fichiers ou consignes."); return; } setError(""); setStep("accueil-config"); }}
            size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #8B5CF6, #7c3aed)" }}>
            <Send className="h-5 w-5" />Étape suivante : Textes d'accueil
          </Button>
        </>)}

        {/* STEP: ACCUEIL CONFIG */}
        {step === "accueil-config" && (<>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-base">Textes de la page d'accueil</CardTitle>
              </div>
              <CardDescription className="text-sm text-zinc-500 mt-1">
                Définissez les sections de votre page d'accueil. Chaque section aura un titre géolocalisé + un texte HTML de 200+ mots.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {accueilSections.map((sec, i) => (
                <div key={sec.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-violet-600">{i + 1}</span>
                  </div>
                  <Input value={sec.theme} onChange={e => setAccueilSections(p => p.map(s => s.id === sec.id ? { ...s, theme: e.target.value } : s))}
                    placeholder={`Thématique section ${i + 1} (ex: Présentation de l'entreprise, Nos services, Zone d'intervention...)`}
                    className="h-10 text-sm flex-1" />
                  {accueilSections.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0"
                      onClick={() => setAccueilSections(p => p.filter(s => s.id !== sec.id))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setAccueilSections(p => [...p, { id: Date.now(), theme: "" }])}
                className="gap-2 text-xs w-full">
                <Plus className="h-3.5 w-3.5" />Ajouter une section
              </Button>
            </CardContent>
          </Card>
          <GenerateLoader loading={accueilLoading} progress={progAccueil.progress} label="Génération des textes d'accueil" color="#8B5CF6" itemCount={accueilSections.filter(s => s.theme.trim()).length} itemLabel="sections" />
          {!accueilLoading && <Button onClick={generateAccueil} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #8B5CF6, #7c3aed)" }}>
            <Send className="h-5 w-5" />Générer {accueilSections.filter(s => s.theme.trim()).length} texte(s) d'accueil
          </Button>}
        </>)}

        {/* STEP: ACCUEIL RESULTS */}
        {step === "accueil" && (<>
          <div className="text-sm text-zinc-500 bg-violet-50 border border-violet-200 rounded-xl p-3"><strong className="text-zinc-800">✅ {accueilResults.length} texte(s) d'accueil générés.</strong> Copiez-les puis passez aux laïus.</div>
          {accueilResults.map((r, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-4 py-2.5 bg-violet-50 border-b flex items-center justify-between">
                <Badge variant="outline" className="text-xs gap-1 border-violet-300 text-violet-700"><FileEdit className="h-3 w-3" />Section : {r.section}</Badge>
                <span className="text-xs text-zinc-400">#{i + 1}</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Titre ({cw(r.titre)}m)</Label><Cp text={r.titre} /></div>
                  <div className="bg-violet-50/50 rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border border-violet-100">{r.titre}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Description HTML</Label><Cp text={r.html} label="Copier HTML" /></div>
                  <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm leading-relaxed border" style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: r.html }} />
                  <details className="text-xs text-zinc-400"><summary className="cursor-pointer hover:text-zinc-600">Code HTML (TinyMCE)</summary><pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 rounded text-[11px] overflow-auto max-h-40 font-mono">{r.html}</pre></details>
                </div>
              </CardContent>
            </Card>
          ))}
          <GenerateLoader loading={laiusLoading} progress={progLaius.progress} label="Génération des laïus" color="#F59E0B" itemCount={allRubs.length} itemLabel="laïus" />
          {!laiusLoading && <Button onClick={() => { setError(""); generateLaius(); }} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #F59E0B, #d97706)" }}>
            <Type className="h-5 w-5" />Continuer : Générer les laïus ({allRubs.length} rubriques) →
          </Button>}
        </>)}

        {/* STEP: LAIUS RESULTS */}
        {step === "laius" && (<>
          <div className="text-sm text-zinc-500 bg-violet-50 border border-violet-200 rounded-xl p-3"><strong className="text-zinc-800">✅ {laiusResults.length} laïus générés.</strong> Copiez-les puis passez aux annonces.</div>
          {laiusResults.map((r, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-4 py-2.5 bg-amber-50 border-b flex items-center justify-between"><Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700"><FolderTree className="h-3 w-3" />{r.rubrique}</Badge></div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5"><div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Titre ({cw(r.titre)}m)</Label><Cp text={r.titre} /></div><div className="bg-amber-50/50 rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border border-amber-100">{r.titre}</div></div>
                <div className="space-y-1.5"><div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Description HTML</Label><Cp text={r.html} label="Copier HTML" /></div><div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm leading-relaxed border" style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: r.html }} /><details className="text-xs text-zinc-400"><summary className="cursor-pointer hover:text-zinc-600">Code HTML</summary><pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 rounded text-[11px] overflow-auto max-h-32 font-mono">{r.html}</pre></details></div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setStep("annonces-config")} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #10B981, #059669)" }}>
            <Newspaper className="h-5 w-5 mr-2" />Continuer : configurer les annonces →
          </Button>
        </>)}

        {/* STEP: ANNONCES CONFIG */}
        {step === "annonces-config" && (<>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileCheck className="h-5 w-5 text-emerald-500" />Configuration des annonces</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ANNONCE_TYPES.map(t => (
                  <button key={t.id} onClick={() => setAnnonceType(t.id)} className={`rounded-2xl border p-4 text-left transition-all duration-300 ${annonceType === t.id ? "shadow-lg -translate-y-0.5 bg-white" : "border-zinc-200 bg-zinc-50 hover:bg-white hover:-translate-y-0.5 hover:shadow-md"}`}
                    style={annonceType === t.id ? { borderColor: t.color } : {}}>
                    <div className="text-sm font-semibold mb-1" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-zinc-500">{t.mots} mots</div>
                    <div className="text-xs text-zinc-400">Efficacité {t.efficacite}</div>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Annonces par rubrique</Label><span className="text-2xl font-black" style={{ color: typeInfo.color }}>{nbParRub}</span></div>
                <input type="range" min={1} max={10} step={1} value={nbParRub} onChange={e => setNbParRub(Number(e.target.value))} className="w-full h-2 accent-emerald-500" />
              </div>
              <div className="text-sm font-medium p-3 rounded-xl border" style={{ background: `${typeInfo.color}08`, borderColor: `${typeInfo.color}30`, color: typeInfo.color }}>
                Total : {totalAnnonces} annonces {typeInfo.label} ({leaves.length} rubriques × {nbParRub})
              </div>
            </CardContent></Card>
          <GenerateLoader loading={annoncesLoading} progress={progAnnonces.progress} label="Génération des annonces" color="#10B981" itemCount={totalAnnonces} itemLabel={`annonces ${typeInfo.label}`} />
          {!annoncesLoading && <Button onClick={generateAnnonces} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #10B981, #059669)" }}>
            <Send className="h-5 w-5" />Générer {totalAnnonces} annonces {typeInfo.label}
          </Button>}
        </>)}

        {/* STEP: ANNONCES RESULTS */}
        {step === "annonces" && (<>
          <div className="text-sm text-zinc-500 bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-3"><strong className="text-zinc-800">✅ {annoncesResults.length} annonces générées.</strong> Copiez-les puis passez aux Jalis Express.</div>
          {annoncesResults.map((r, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="px-4 py-2.5 bg-emerald-50 border-b flex items-center justify-between"><Badge variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700"><FolderTree className="h-3 w-3" />{r.rubrique}</Badge><span className="text-xs text-zinc-400">#{i + 1}</span></div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5"><div className="flex items-center justify-between"><Label className="text-xs font-bold text-sky-600 uppercase">Titre ({cw(r.titreLong)}m)</Label><Cp text={r.titreLong} /></div><div className="bg-sky-50/50 rounded-xl px-4 py-2.5 text-[14px] leading-relaxed font-semibold border border-sky-100">{r.titreLong}</div></div>
                <div className="space-y-1.5"><div className="flex items-center justify-between"><Label className="text-xs font-bold text-emerald-600 uppercase">Titre court ({cw(r.titreCourt)}m)</Label><Cp text={r.titreCourt} /></div><div className="bg-emerald-50/50 rounded-xl px-4 py-2.5 text-base font-bold border border-emerald-100">{r.titreCourt}</div></div>
                {r.extrait && <div className="space-y-1.5"><div className="flex items-center justify-between"><Label className="text-xs font-bold text-amber-600 uppercase">Extrait ({cw(r.extrait)}m)</Label><Cp text={r.extrait} /></div><div className="bg-amber-50/50 rounded-xl px-4 py-2.5 text-sm italic leading-relaxed border border-amber-100" style={{ textAlign: "justify" }}>{r.extrait}</div></div>}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold text-violet-600 uppercase">Description HTML TinyMCE</Label><Cp text={r.html} label="Copier HTML" /></div>
                  <div className="bg-zinc-50 rounded-xl px-4 py-3 text-sm leading-relaxed border" style={{ textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: r.html }} />
                  <details className="text-xs text-zinc-400"><summary className="cursor-pointer hover:text-zinc-600">Code HTML (TinyMCE)</summary><pre className="mt-1 p-2 bg-zinc-900 text-emerald-400 rounded text-[11px] overflow-auto max-h-32 font-mono">{r.html}</pre></details>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setStep("express-config")} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: `linear-gradient(to right, ${JB}, #1aa3c4)` }}>
            <Zap className="h-5 w-5 mr-2" />Continuer : configurer les Jalis Express →
          </Button>
        </>)}

        {/* STEP: EXPRESS CONFIG */}
        {step === "express-config" && (<>
          <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg"><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5" style={{ color: JB }} />Configuration Jalis Express</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Nombre de Jalis Express</Label><span className="text-3xl font-black" style={{ color: JB }}>{nbExpress}</span></div>
                <input type="range" min={5} max={60} step={5} value={nbExpress} onChange={e => setNbExpress(Number(e.target.value))} className="w-full h-2 accent-sky-500" />
                <div className="flex justify-between text-xs text-zinc-400"><span>5</span><span>60</span></div>
              </div>
              {distribExpress.length > 0 && <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border" style={{ background: `${JB}08`, borderColor: `${JB}30` }}><span className="text-xs font-bold" style={{ color: JB }}>Répartition :</span>{distribExpress.map((d, i) => <Badge key={i} variant="secondary" className="text-xs gap-1 bg-white border border-zinc-200">{d.name} <span className="font-bold" style={{ color: JB }}>×{d.count}</span></Badge>)}</div>}
            </CardContent></Card>
          <GenerateLoader loading={expressLoading} progress={progExpress.progress} label="Génération des Jalis Express" color={JB} itemCount={nbExpress} itemLabel="expressions" />
          {!expressLoading && <Button onClick={generateExpress} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: `linear-gradient(to right, ${JB}, #1aa3c4)` }}>
            <Send className="h-5 w-5" />Générer {nbExpress} Jalis Express
          </Button>}
        </>)}

        {/* STEP: EXPRESS RESULTS */}
        {step === "express" && (<>
          <div className="text-sm bg-sky-50/80 border border-sky-200/60 rounded-xl p-3"><strong className="text-zinc-800">🎉 Remplissage terminé !</strong> {laiusResults.length} laïus + {annoncesResults.length} annonces + {expressResults.length} Jalis Express générés.</div>
          <div className="text-sm text-zinc-500 bg-sky-50/60 border border-sky-100/60 rounded-xl p-3"><strong>💡</strong> Copiez <span className="font-semibold" style={{ color: JB }}>Activité</span> → 1er champ, <span className="font-semibold text-rose-600">Géoloc</span> → 2ème champ.</div>
          {expressResults.map((item, i) => (
            <Card key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${JB}20` }}><span className="text-xs font-bold" style={{ color: JB }}>{i+1}</span></div>{item.rubrique && <Badge variant="outline" className="text-xs gap-1 border-zinc-200"><FolderTree className="h-3 w-3" />{item.rubrique}</Badge>}</div></div>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full" style={{ background: JB }} /><Label className="text-xs font-bold uppercase" style={{ color: JB }}>Activité</Label></div><Cp text={item.activite} /></div><div className="rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border" style={{ background: `${JB}08`, borderColor: `${JB}20` }}>{item.activite}</div></div>
                <div className="space-y-1.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1 h-4 rounded-full bg-rose-500" /><Label className="text-xs font-bold text-rose-600 uppercase">Géoloc</Label></div><Cp text={item.geo} /></div><div className="bg-rose-50 rounded-xl px-4 py-3 text-[15px] leading-relaxed font-medium border border-rose-100">{item.geo}</div></div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={onBack} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg bg-zinc-900 hover:bg-zinc-800 shadow-lg transition-all">
            <Check className="h-5 w-5 mr-2" />Terminé — Retour au hub
          </Button>
        </>)}
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   APP: SECTEURS GÉOGRAPHIQUES
   ═══════════════════════════════════════ */
function SecteursGeoApp({ onBack }) {
  const [nbSecteurs, setNbSecteurs] = useState(7);
  const [inputVilles, setInputVilles] = useState("");
  const [activite, setActivite] = useState("");
  const [pctB2C, setPctB2C] = useState(50);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const prog = useProgress(nbSecteurs * 3);
  const pctB2B = 100 - pctB2C;
  const typoLabel = pctB2C >= 80 ? "Particuliers" : pctB2B >= 80 ? "Professionnels" : "Mixte";

  const generate = async () => {
    if (!inputVilles.trim()) { setError("Indiquez au moins une ville ou zone géographique."); return; }
    setError(""); setLoading(true); setResults([]); prog.start();

    const activiteCtx = activite.trim() ? `\nACTIVITÉ DU CLIENT : ${activite.trim()}` : "";

    const prompt = `Tu es un expert en référencement local Google pour l'agence web Jalis à Marseille.

MISSION : À partir de la liste de villes/zones fournie, génère exactement ${nbSecteurs} secteurs géographiques optimisés pour le SEO local.
${activiteCtx}
RÉPARTITION CLIENTÈLE : ${pctB2C}% Particuliers / ${pctB2B}% Professionnels

ADAPTATION DU RAYON GÉOGRAPHIQUE :
${pctB2C >= 80 ? `- Focus PARTICULIERS (${pctB2C}%) → rayon de chalandise SERRÉ (10-30 km max).
- Privilégier les villes proches, les quartiers, les communes limitrophes.
- Les particuliers cherchent un prestataire LOCAL : "plombier Aix-en-Provence", "coiffeur Vitrolles".
- Éviter les villes trop éloignées du siège du client.` :
pctB2B >= 80 ? `- Focus PROFESSIONNELS (${pctB2B}%) → rayon LARGE (département, région, zones industrielles/commerciales).
- Privilégier les zones économiques, les pôles d'activité, les grandes villes avec tissu d'entreprises.
- Les pros cherchent par zone d'activité : "fournisseur Bouches-du-Rhône", "prestataire PACA".
- Inclure des villes stratégiques même si plus éloignées.` :
`- MIXTE : ${pctB2C}% particuliers / ${pctB2B}% professionnels.
- Sur les ${nbSecteurs} secteurs, environ ${Math.round(nbSecteurs * pctB2C / 100)} doivent cibler des villes de proximité (pour les particuliers) et environ ${Math.round(nbSecteurs * pctB2B / 100)} doivent cibler des pôles économiques ou villes stratégiques (pour les professionnels).
- Commencer par les villes les plus proches, puis élargir progressivement.`}
${activite.trim() ? `- Tenir compte de l'activité "${activite.trim()}" pour choisir des villes où cette activité a du sens.` : ""}

RÈGLES STRICTES :

1. ZÉRO RÉPÉTITION DE MOT
- Aucun mot ne peut apparaître deux fois dans l'ensemble des ${nbSecteurs} lignes.
- Cela inclut les noms de villes, départements, lieux-dits, et mots courants ("proche", "dans", "sur", etc.).
- Si un mot est déjà utilisé, utiliser un autre point de repère ou sauter la relation de proximité.

2. STRUCTURE DE CHAQUE LIGNE
Format : [Ville] [code postal ou (département)] [relation de proximité ou localisation]

RÈGLE CODES POSTAUX — TRÈS IMPORTANT :
- Pour les villes avec UN SEUL code postal → écrire le code postal complet : "Vitrolles 13127", "Arcachon 33120"
- Pour les grandes villes avec PLUSIEURS arrondissements (Marseille, Lyon, Paris) OU les micro-états (Monaco) → écrire UNIQUEMENT le numéro de département entre parenthèses : "Marseille (13)", "Lyon (69)", "Monaco (98)"
- Ne JAMAIS écrire "Marseille 13000" ou "Monaco 98000" → TOUJOURS "Marseille (13)" et "Monaco (98)"

RÈGLE "PROCHE DE" — TRÈS IMPORTANT :
- Écrire TOUJOURS "proche de" avec le "de". JAMAIS "proche" seul.
- ✅ CORRECT : "Marignane 13700 proche de Saint-Victoret"
- ❌ INCORRECT : "Marignane 13700 proche Saint-Victoret"
- La seule exception est "proche des" ou "proche du" devant un article.

Relations acceptées :
- "proche de [ville]" / "proche des [lieu pluriel]" / "proche du [lieu masculin]"
- "sur le/la [lieu géographique]"
- "en [région/zone]"
- "dans le département [XX]" ou "dans les [nom département]"

3. SEO — TERMES RECHERCHÉS RÉELLEMENT
- Utiliser uniquement des termes tapés par de vrais internautes sur Google.
- INTERDITS : formulations poétiques ou touristiques ("la Venise provençale", "cité phocéenne", "perle du littoral")
- AUTORISÉS : noms de villes, codes postaux, noms de zones connues (Camargue, Alpilles, Côte Bleue, Pays d'Aix...)

4. NOMBRE DE SECTEURS
- Toujours produire EXACTEMENT ${nbSecteurs} secteurs, ni plus, ni moins.

5. QUALITÉ
- Varier les relations de proximité (ne pas répéter "proche de" à chaque ligne).
- Couvrir un périmètre géographique cohérent.
- Privilégier les villes avec un réel volume de recherche.

EXEMPLE DE RÉFÉRENCE (Bassin d'Arcachon — artisan B2C) :
1. Andernos-les-Bains 33510 sur le Bassin d'Arcachon
2. Gujan-Mestras 33470 proche de La Teste-de-Buch
3. Arès 33740 proche de Lège-Cap-Ferret
4. Biganos 33380 proche de Marcheprime
5. Arcachon 33120 proche de Pyla-sur-Mer
6. Lège-Cap-Ferret 33950 en Gironde
7. Mios 33380 dans le Sud du Bassin

AUTRE EXEMPLE (Marseille / Provence — entreprise mixte) :
1. Marseille (13) dans les Bouches-du-Rhône
2. Aix-en-Provence 13100 dans le Pays d'Aix
3. Vitrolles 13127 proche des Pennes-Mirabeau
4. Marignane 13700 proche de Saint-Victoret
5. Carry-le-Rouet 13620 sur la Côte Bleue
6. Port-Saint-Louis-du-Rhône 13230 proche de Fos-sur-Mer en Camargue
7. Salon-de-Provence 13300 proche des Alpilles

VILLES / ZONES DU CLIENT :
${inputVilles}

VÉRIFICATION FINALE avant de répondre :
1. Relis chaque ligne et vérifie que "proche" est TOUJOURS suivi de "de", "des" ou "du".
2. Vérifie que les grandes villes multi-arrondissements utilisent (XX) et non un code postal à 5 chiffres.
3. Vérifie qu'aucun mot n'apparaît deux fois dans l'ensemble des lignes.

FORMAT DE RÉPONSE — Réponds UNIQUEMENT avec les ${nbSecteurs} lignes numérotées, RIEN D'AUTRE :
1. [secteur]
2. [secteur]
...`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }) });
      const data = await resp.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
      const lines = text.split("\n").map(l => l.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(l => l.length > 3);
      if (!lines.length) setError("Aucun secteur généré. Réessayez.");
      else setResults(lines.slice(0, nbSecteurs));
    } catch (err) { setError("Erreur : " + (err.message || "")); }
    finally { setLoading(false); prog.finish(); }
  };

  const copyAll = () => {
    const text = results.map((r, i) => `${i + 1}. ${r}`).join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <AppShell onBack={onBack} icon={MapPin} iconColor="#6366F1" title="Secteurs géographiques">
      <div className="max-w-2xl mx-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
        <Card className="rounded-2xl border border-zinc-200 bg-zinc-50 transition-all duration-300 hover:bg-white hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-500" /><CardTitle className="text-base">Zones géographiques du client</CardTitle><Badge className="text-[10px] h-5 px-1.5 bg-red-500 text-white">Requis</Badge></div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Activité du client</Label>
              <Input value={activite} onChange={e => setActivite(e.target.value)} placeholder="Ex: Plomberie, Cabinet d'avocats, Grossiste alimentaire..." className="h-10 text-sm" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Typologie de clientèle</Label>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${pctB2C >= 50 ? "bg-indigo-50 border border-indigo-200" : "opacity-50"}`}>
                  <span className="text-sm">🏠</span><span className="text-xs font-semibold text-indigo-700">{pctB2C}%</span><span className="text-[10px] text-zinc-500">Particuliers</span>
                </div>
                <input type="range" min={0} max={100} step={10} value={pctB2C} onChange={e => setPctB2C(Number(e.target.value))} className="flex-1 h-2 accent-indigo-500" />
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${pctB2B >= 50 ? "bg-indigo-50 border border-indigo-200" : "opacity-50"}`}>
                  <span className="text-sm">🏢</span><span className="text-xs font-semibold text-indigo-700">{pctB2B}%</span><span className="text-[10px] text-zinc-500">Professionnels</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 text-center">
                {pctB2C >= 80 ? "Focus particuliers → rayon serré (10-30 km)" : pctB2B >= 80 ? "Focus professionnels → rayon large (département+)" : `Mixte → ~${Math.round(nbSecteurs * pctB2C / 100)} secteurs proximité, ~${Math.round(nbSecteurs * pctB2B / 100)} secteurs élargis`}
              </p>
            </div>
            <Separator className="bg-zinc-100/50" />
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Villes et zones d'intervention</Label>
              <textarea value={inputVilles} onChange={e => setInputVilles(e.target.value)} onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                placeholder="Listez les villes, quartiers, zones ou régions. L'IA complétera avec des villes proches si nécessaire."
                rows={2} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden resize-none" />
            </div>
            <Separator className="bg-zinc-100/50" />
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label className="text-sm font-semibold">Nombre de secteurs à générer</Label><span className="text-2xl font-bold text-indigo-600">{nbSecteurs}</span></div>
              <input type="range" min={3} max={15} step={1} value={nbSecteurs} onChange={e => setNbSecteurs(Number(e.target.value))} className="w-full h-2 accent-indigo-500" />
              <div className="flex justify-between text-xs text-zinc-400"><span>3</span><span>15</span></div>
            </div>
          </CardContent>
        </Card>

        {error && <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200/60 text-red-600 text-sm"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}
        <GenerateLoader loading={loading} progress={prog.progress} label="Génération des secteurs" color="#6366F1" itemCount={nbSecteurs} itemLabel="secteurs" />
        {!loading && <Button onClick={generate} size="lg" className="w-full h-12 text-base font-semibold text-white rounded-lg shadow-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(to right, #6366F1, #4f46e5)" }}>
          <Send className="h-5 w-5" />Générer {nbSecteurs} secteurs géographiques
        </Button>}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">{results.length} secteurs générés</span>
              <div className="flex gap-2">
                <Cp text={results.map((r, i) => `${i + 1}. ${r}`).join("\n")} label="Tout copier" />
                <Button variant="outline" size="sm" onClick={generate} className="h-7 text-xs gap-1.5 px-3 rounded-lg border-zinc-200"><RefreshCw className="h-3 w-3" />Regénérer</Button>
              </div>
            </div>
            {results.map((r, i) => (
              <div key={i} className="group flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-indigo-100"><span className="text-xs font-bold text-indigo-600">{i + 1}</span></div>
                <span className="flex-1 text-sm font-medium text-zinc-800">{r}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity"><Cp text={r} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ═══════════════════════════════════════
   ROOT
   ═══════════════════════════════════════ */
export default function App() {
  const [app, setApp] = useState(null);
  if (app === "jalis-express") return <JalisExpressApp onBack={() => setApp(null)} />;
  if (app === "guide-local") return <GuideLocalApp onBack={() => setApp(null)} />;
  if (app === "laius") return <LaïusApp onBack={() => setApp(null)} />;
  if (app === "annonces") return <AnnoncesApp onBack={() => setApp(null)} />;
  if (app === "remplissage") return <RemplissageApp onBack={() => setApp(null)} />;
  if (app === "secteurs-geo") return <SecteursGeoApp onBack={() => setApp(null)} />;
  return <Hub onOpenApp={setApp} />;
}
