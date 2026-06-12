import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, Lock, Save, Settings, Trophy, UserPlus } from 'lucide-react';
import './styles.css';

type Match = {
  id: string;
  grp: string;
  jornada: number;
  kickoff_utc: string;
  home_goals: number | null;
  away_goals: number | null;
  locked: 0 | 1 | boolean;
  home_code: string;
  home_name: string;
  home_flag: string;
  away_code: string;
  away_name: string;
  away_flag: string;
};
type Pick = { match_id: string; home_goals: number; away_goals: number };
type Player = { id: string; alias: string; display_name?: string; birth_year?: string };
type Standing = { rank: number; player_id: string; alias: string; points: number; exacts: number; results: number };

const api = {
  token: () => localStorage.getItem('qm_token') || '',
  player: (): Player | null => JSON.parse(localStorage.getItem('qm_player') || 'null'),
  async request<T>(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(api.token() ? { Authorization: `Bearer ${api.token()}` } : {}),
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(data?.error || 'Error'), { status: res.status, data });
    return data as T;
  }
};

function flagUrl(code: string) {
  if (code === 'SCT') return 'https://flagcdn.com/w80/gb-sct.png';
  if (code === 'GB-ENG') return 'https://flagcdn.com/w80/gb-eng.png';
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

function localDay(iso: string) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' }).format(new Date(iso));
}

function localTime(iso: string) {
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City' }).format(new Date(iso));
}

function Login({ onDone }: { onDone: () => void }) {
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState('');
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.request<{ token: string; player: Player }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ nombre, anio, alias: alias || undefined })
      });
      localStorage.setItem('qm_token', data.token);
      localStorage.setItem('qm_player', JSON.stringify(data.player));
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <Brand />
      <form onSubmit={submit} className="mx-auto mt-8 max-w-xl rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-5xl">⚽</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Entra a la quiniela</h1>
          <p className="mt-2 text-base leading-7 text-slate-500">Cada quien entra con su nombre y año.</p>
        </div>
        <label className="mt-8 block text-sm font-bold text-slate-950">Nombre de pila</label>
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Maria" required />
        <label className="mt-5 block text-sm font-bold text-slate-950">Año de nacimiento</label>
        <input className="input" value={anio} onChange={(e) => setAnio(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Ej. 1985" required />
        <label className="mt-5 block text-sm font-bold text-slate-950">Apodo <span className="font-medium text-slate-400">opcional</span></label>
        <input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Si lo dejas vacio, va tu nombre" />
        <button className="mt-7 h-14 w-full rounded-lg bg-pitch text-lg font-black text-white disabled:bg-emerald-200" disabled={busy || nombre.length < 2 || anio.length !== 4}>
          Entrar
        </button>
      </form>
    </main>
  );
}

function Brand({ player }: { player?: Player | null }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 bg-white/95 px-5 pb-3 pt-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-4xl leading-none">⚽</div>
          <div>
            <div className="text-2xl font-black leading-6 text-slate-950">Mundial 2026</div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Quiniela Familiar</div>
          </div>
        </div>
        {player && <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-slate-950">{player.alias}</div>}
      </div>
      <div className="mx-auto mt-3 grid h-1 max-w-4xl grid-cols-[1fr_1fr_1fr] overflow-hidden rounded-full">
        <div className="bg-triondaBlue" />
        <div className="bg-pitch" />
        <div className="bg-triondaRed" />
      </div>
    </header>
  );
}

function App() {
  const [player, setPlayer] = useState<Player | null>(api.player());
  const [tab, setTab] = useState<'fill' | 'table' | 'admin'>('fill');
  const [matches, setMatches] = useState<Match[]>([]);
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [standings, setStandings] = useState<Standing[]>([]);

  async function load() {
    const [m, s] = await Promise.all([api.request<Match[]>('/api/matches'), api.request<Standing[]>('/api/standings')]);
    setMatches(m);
    setStandings(s);
    if (api.token()) {
      const p = await api.request<Pick[]>('/api/picks/me').catch(() => []);
      setPicks(Object.fromEntries(p.map((pick) => [pick.match_id, pick])));
    }
  }

  useEffect(() => { if (player) load(); }, [player]);
  if (!player) return <Login onDone={() => setPlayer(api.player())} />;

  return (
    <div className="min-h-screen bg-slate-50 px-5 pb-24">
      <Brand player={player} />
      {tab === 'fill' && <FillView matches={matches} picks={picks} setPicks={setPicks} reload={load} />}
      {tab === 'table' && <TableView standings={standings} />}
      {tab === 'admin' && <AdminView matches={matches} reload={load} />}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-3">
          <NavButton active={tab === 'fill'} onClick={() => setTab('fill')} icon={<Save size={22} />} label="Llenar" />
          <NavButton active={tab === 'table'} onClick={() => setTab('table')} icon={<Trophy size={22} />} label="Tabla" />
          <NavButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<Settings size={22} />} label="Organiza" />
        </div>
      </nav>
    </div>
  );
}

function NavButton(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={props.onClick} className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-black ${props.active ? 'text-pitch' : 'text-slate-400'}`}>{props.icon}<span>{props.label}</span></button>;
}

function FillView({ matches, picks, setPicks, reload }: { matches: Match[]; picks: Record<string, Pick>; setPicks: (p: Record<string, Pick>) => void; reload: () => void }) {
  const days = Array.from(new Set(matches.map((m) => m.kickoff_utc.slice(0, 10))));
  const [index, setIndex] = useState(0);
  const dayMatches = matches.filter((m) => m.kickoff_utc.slice(0, 10) === days[index]);

  function setScore(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    if (match.locked) return;
    const current = picks[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    setPicks({ ...picks, [match.id]: { ...current, [side]: Math.max(0, Math.min(99, current[side] + delta)) } });
  }

  async function save() {
    await api.request('/api/picks', { method: 'POST', body: JSON.stringify(Object.values(picks)) }).catch((error) => {
      if (error.status !== 409) throw error;
      alert('Algunos partidos ya estaban cerrados y no se guardaron.');
    });
    await reload();
  }

  return (
    <main className="mx-auto max-w-4xl">
      <div className="my-6 flex items-center justify-between">
        <button className="icon-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft /></button>
        <div className="text-center">
          <h2 className="text-3xl font-black capitalize text-slate-950">{days[index] ? localDay(dayMatches[0].kickoff_utc) : ''}</h2>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-pitch">Jornada {dayMatches[0]?.jornada} · {dayMatches.length} partidos</p>
        </div>
        <button className="icon-btn" disabled={index === days.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight /></button>
      </div>
      <div className="space-y-4">
        {dayMatches.map((match) => <MatchCard key={match.id} match={match} pick={picks[match.id]} setScore={setScore} />)}
      </div>
      <button onClick={save} className="mt-5 h-14 w-full rounded-lg bg-pitch text-lg font-black text-white">Guardar</button>
    </main>
  );
}

function MatchCard({ match, pick, setScore }: { match: Match; pick?: Pick; setScore: (m: Match, s: 'home_goals' | 'away_goals', d: number) => void }) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Grupo {match.grp} · {localTime(match.kickoff_utc)}</span>
        {match.locked ? <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-black text-triondaRed"><Lock size={14} /> Cerrado</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        <TeamScore name={match.home_name} flag={match.home_flag} value={pick?.home_goals} locked={Boolean(match.locked)} onMinus={() => setScore(match, 'home_goals', -1)} onPlus={() => setScore(match, 'home_goals', 1)} />
        <TeamScore name={match.away_name} flag={match.away_flag} value={pick?.away_goals} locked={Boolean(match.locked)} onMinus={() => setScore(match, 'away_goals', -1)} onPlus={() => setScore(match, 'away_goals', 1)} />
      </div>
    </article>
  );
}

function TeamScore({ name, flag, value, locked, onMinus, onPlus }: { name: string; flag: string; value?: number; locked: boolean; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="rounded-lg border border-transparent p-2 text-center">
      <img src={flagUrl(flag)} alt="" className="mx-auto h-12 w-16 object-contain" />
      <div className="mt-2 min-h-12 text-lg font-black leading-6 text-slate-950">{name}</div>
      <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <button disabled={locked} onClick={onMinus} className="score-btn">-</button>
        <div className="text-4xl font-black text-slate-950">{value ?? '-'}</div>
        <button disabled={locked} onClick={onPlus} className="score-btn filled">+</button>
      </div>
    </div>
  );
}

function TableView({ standings }: { standings: Standing[] }) {
  return (
    <main className="mx-auto max-w-4xl py-6">
      {standings[0] && <div className="mb-6 text-center"><div className="text-4xl">🥇</div><div className="text-xl font-black">{standings[0].alias}</div><div className="mx-auto mt-2 flex h-24 w-28 items-start justify-center rounded-t-lg bg-pitch pt-4 text-3xl font-black text-white">{standings[0].points}</div></div>}
      <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
        <div className="grid grid-cols-[48px_1fr_70px_70px_70px] bg-pitch px-3 py-3 text-sm font-black text-white">
          <span>#</span><span>Jugador</span><span>Pts</span><span>Res.</span><span>Exact.</span>
        </div>
        {standings.map((row) => <div key={row.player_id} className="grid grid-cols-[48px_1fr_70px_70px_70px] border-t border-emerald-100 px-3 py-4 text-base"><b className="text-triondaGold">{row.rank}</b><b>{row.alias}</b><b className="text-pitch">{row.points}</b><span>{row.results}</span><span>{row.exacts}</span></div>)}
      </div>
      <p className="mt-5 text-center text-sm leading-6 text-slate-500">1 punto por resultado · 3 puntos por marcador exacto.</p>
    </main>
  );
}

function AdminView({ matches, reload }: { matches: Match[]; reload: () => void }) {
  const [pin, setPin] = useState(localStorage.getItem('qm_admin_pin') || '');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<Record<string, Pick>>({});
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [mode, setMode] = useState<'picks' | 'results'>('picks');

  async function admin<T>(url: string, options: RequestInit = {}) {
    return api.request<T>(url, { ...options, headers: { ...(options.headers || {}), 'x-admin-pin': pin } });
  }
  async function loadPlayers() {
    localStorage.setItem('qm_admin_pin', pin);
    const rows = await admin<Player[]>('/api/admin/players');
    setPlayers(rows);
    if (!selected && rows[0]) setSelected(rows[0].id);
  }
  async function addPlayer() {
    await admin('/api/admin/player', { method: 'POST', body: JSON.stringify({ nombre: name, anio: year }) });
    setName(''); setYear(''); await loadPlayers();
  }
  async function saveAdminPicks() {
    if (!selected) return;
    await admin(`/api/admin/picks/${selected}`, { method: 'PUT', body: JSON.stringify(Object.values(draft)) });
    alert('Pronosticos guardados');
  }
  function changeDraft(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = draft[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = { ...current, [side]: Math.max(0, current[side] + delta) };
    setDraft({ ...draft, [match.id]: next });
  }
  async function saveResult(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = { match_id: match.id, home_goals: match.home_goals ?? 0, away_goals: match.away_goals ?? 0 };
    const next = { ...current, [side]: Math.max(0, current[side] + delta) };
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify(next) });
    await reload();
  }

  return (
    <main className="mx-auto max-w-4xl py-5">
      <div className="rounded-lg border border-emerald-200 bg-white p-4">
        <label className="text-sm font-black">PIN organizador</label>
        <div className="mt-2 grid grid-cols-[1fr_120px] gap-2"><input className="input !mt-0" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="2026" /><button onClick={loadPlayers} className="rounded-lg bg-pitch font-black text-white">Entrar</button></div>
      </div>
      <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
        <h2 className="font-black">Jugadores</h2>
        <div className="mt-3 flex flex-wrap gap-2">{players.map((p) => <button key={p.id} onClick={() => setSelected(p.id)} className={`rounded-full px-4 py-2 text-sm font-black ${selected === p.id ? 'bg-pitch text-white' : 'bg-emerald-50 text-slate-600'}`}>{p.alias}</button>)}</div>
        <div className="mt-4 grid grid-cols-[1fr_100px_48px] gap-2"><input className="input !mt-0" value={name} onChange={(e) => setName(e.target.value)} placeholder="Agregar jugador" /><input className="input !mt-0" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" /><button onClick={addPlayer} className="rounded-lg bg-pitch text-white"><UserPlus className="mx-auto" /></button></div>
      </div>
      <div className="mt-4 grid grid-cols-2 rounded-lg bg-emerald-50 p-1">
        <button onClick={() => setMode('picks')} className={`h-11 rounded-md text-sm font-black ${mode === 'picks' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Editar picks</button>
        <button onClick={() => setMode('results')} className={`h-11 rounded-md text-sm font-black ${mode === 'results' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Resultados</button>
      </div>
      <h2 className="mt-6 text-lg font-black text-pitch">Captura de WhatsApp / Resultados</h2>
      <div className="mt-3 space-y-3">
        {matches.map((match) => {
          const p = mode === 'results'
            ? { match_id: match.id, home_goals: match.home_goals ?? 0, away_goals: match.away_goals ?? 0 }
            : draft[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
          const change = mode === 'results' ? saveResult : (m: Match, s: 'home_goals' | 'away_goals', d: number) => changeDraft(m, s, d);
          return <article key={match.id} className="rounded-lg border border-emerald-200 bg-white p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Grupo {match.grp} · {localDay(match.kickoff_utc)} · {localTime(match.kickoff_utc)}</div>
            <div className="grid grid-cols-[1fr_44px_32px_44px_44px_32px_44px] items-center gap-2">
              <b>{match.home_name} vs {match.away_name}</b>
              <button className="mini-btn" onClick={() => change(match, 'home_goals', -1)}>-</button><b className="text-center">{p.home_goals}</b><button className="mini-btn filled" onClick={() => change(match, 'home_goals', 1)}>+</button>
              <button className="mini-btn" onClick={() => change(match, 'away_goals', -1)}>-</button><b className="text-center">{p.away_goals}</b><button className="mini-btn filled" onClick={() => change(match, 'away_goals', 1)}>+</button>
            </div>
          </article>;
        })}
      </div>
      {mode === 'picks' && <button onClick={saveAdminPicks} className="mt-5 h-14 w-full rounded-lg bg-pitch text-lg font-black text-white">Guardar picks del jugador</button>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
