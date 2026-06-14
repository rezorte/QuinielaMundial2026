import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronLeft, ChevronRight, Lock, LogOut, Pencil, Settings, Trophy, UserPlus } from 'lucide-react';
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
type MatchPick = { player_id: string; alias: string; home_goals: number; away_goals: number; points: number };
type AppSettings = { late_picks_open: boolean; reveal_picks: boolean };

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

function localWeekday(iso: string) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', timeZone: 'America/Mexico_City' }).format(new Date(iso));
}

function localDateLabel(iso: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' }).format(new Date(iso));
}

function localDateKey(iso: string) {
  const parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Mexico_City' }).formatToParts(new Date(iso));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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

function Brand({ player, onEditAlias, onSwitchUser }: { player?: Player | null; onEditAlias?: () => void; onSwitchUser?: () => void }) {
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
        {player && <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-sm font-black text-slate-950">
          <button onClick={onEditAlias} className="px-2 py-1">{player.alias}</button>
          <button onClick={onEditAlias} className="rounded-full p-1 text-pitch" aria-label="Editar alias"><Pencil size={15} /></button>
          <button onClick={onSwitchUser} className="rounded-full p-1 text-slate-500" aria-label="Cambiar usuario"><LogOut size={15} /></button>
        </div>}
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
  const [aliasOpen, setAliasOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(player?.alias || '');

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

  async function saveAlias() {
    const updated = await api.request<Player>('/api/profile', { method: 'PUT', body: JSON.stringify({ alias: aliasDraft }) });
    localStorage.setItem('qm_player', JSON.stringify(updated));
    setPlayer(updated);
    setAliasOpen(false);
    await load();
  }

  function switchUser() {
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_player');
    setPlayer(null);
    setPicks({});
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 pb-24">
      <Brand player={player} onEditAlias={() => { setAliasDraft(player.alias); setAliasOpen(true); }} onSwitchUser={switchUser} />
      {tab === 'fill' && <FillView matches={matches} picks={picks} setPicks={setPicks} reload={load} />}
      {tab === 'table' && <TableView standings={standings} matches={matches} />}
      {tab === 'admin' && <AdminView matches={matches} reload={load} />}
      {aliasOpen && <div className="fixed inset-0 z-40 flex items-end bg-slate-950/30 p-4">
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
          <h2 className="text-lg font-black">Cambiar alias</h2>
          <input className="input" value={aliasDraft} onChange={(e) => setAliasDraft(e.target.value)} placeholder="Tu alias" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setAliasOpen(false)} className="h-12 rounded-lg bg-slate-100 font-black text-slate-600">Cancelar</button>
            <button onClick={saveAlias} className="h-12 rounded-lg bg-pitch font-black text-white">Guardar</button>
          </div>
        </div>
      </div>}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-3">
          <NavButton active={tab === 'fill'} onClick={() => setTab('fill')} icon={<span className="text-xl leading-none">⚽</span>} label="Llenar" />
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

function todayLocalKey() {
  return localDateKey(new Date().toISOString());
}

function defaultDayIndex(days: string[]) {
  if (!days.length) return 0;
  const today = todayLocalKey();
  const exact = days.indexOf(today);
  if (exact >= 0) return exact;
  const next = days.findIndex((day) => day >= today);
  return next >= 0 ? next : days.length - 1;
}

function FillView({ matches, picks, setPicks, reload }: { matches: Match[]; picks: Record<string, Pick>; setPicks: (p: Record<string, Pick>) => void; reload: () => void }) {
  const days = Array.from(new Set(matches.map((m) => localDateKey(m.kickoff_utc))));
  const [index, setIndex] = useState(0);
  const dayMatches = matches.filter((m) => localDateKey(m.kickoff_utc) === days[index]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIndex(defaultDayIndex(days));
  }, [days.join('|')]);

  async function setScore(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    if (match.locked) return;
    const current = picks[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = { ...current, [side]: Math.max(0, Math.min(99, current[side] + delta)) };
    setPicks({ ...picks, [match.id]: next });
    setSaving({ ...saving, [match.id]: true });
    await api.request('/api/picks', { method: 'POST', body: JSON.stringify([next]) }).catch((error) => {
      if (error.status === 409) alert('Ese partido ya esta cerrado.');
      else throw error;
    });
    setSaving((state) => ({ ...state, [match.id]: false }));
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
        <div className="min-w-0 px-3 text-center">
          <h2 className="text-xl font-black capitalize leading-6 text-slate-950 sm:text-3xl">{days[index] ? localWeekday(dayMatches[0].kickoff_utc) : ''}</h2>
          <div className="text-base font-black capitalize leading-5 text-slate-500 sm:text-xl">{days[index] ? localDateLabel(dayMatches[0].kickoff_utc) : ''}</div>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-pitch">Jornada {dayMatches[0]?.jornada} · {dayMatches.length} partidos</p>
        </div>
        <button className="icon-btn" disabled={index === days.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight /></button>
      </div>
      <div className="space-y-4">
        {dayMatches.map((match) => <MatchCard key={match.id} match={match} pick={picks[match.id]} setScore={setScore} saving={saving[match.id]} />)}
      </div>
      <button onClick={save} className="mt-5 h-12 w-full rounded-lg bg-emerald-50 text-sm font-black text-pitch">Sincronizar picks</button>
    </main>
  );
}

function MatchCard({ match, pick, setScore, forceOpen = false, saving = false }: { match: Match; pick?: Pick; setScore: (m: Match, s: 'home_goals' | 'away_goals', d: number) => void; forceOpen?: boolean; saving?: boolean }) {
  const locked = Boolean(match.locked) && !forceOpen;
  return (
    <article className="rounded-lg border border-emerald-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Grupo {match.grp} · {localDay(match.kickoff_utc)} · {localTime(match.kickoff_utc)}</span>
        {saving ? <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-pitch">Guardando</span> : locked ? <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-black text-triondaRed"><Lock size={14} /> Cerrado</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        <TeamScore name={match.home_name} flag={match.home_flag} value={pick?.home_goals} locked={locked} onMinus={() => setScore(match, 'home_goals', -1)} onPlus={() => setScore(match, 'home_goals', 1)} />
        <TeamScore name={match.away_name} flag={match.away_flag} value={pick?.away_goals} locked={locked} onMinus={() => setScore(match, 'away_goals', -1)} onPlus={() => setScore(match, 'away_goals', 1)} />
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

function TableView({ standings, matches }: { standings: Standing[]; matches: Match[] }) {
  const [selected, setSelected] = useState('');
  const [matchPicks, setMatchPicks] = useState<MatchPick[]>([]);
  const selectedMatch = matches.find((match) => match.id === selected) || matches[0];

  useEffect(() => {
    if (!selectedMatch) return;
    setSelected(selectedMatch.id);
    api.request<MatchPick[]>(`/api/matches/${selectedMatch.id}/picks`).then(setMatchPicks).catch(() => setMatchPicks([]));
  }, [selectedMatch?.id]);

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
      <section className="mt-6 rounded-lg border border-emerald-200 bg-white p-4">
        <h2 className="text-lg font-black">Picks por partido</h2>
        <select className="input" value={selectedMatch?.id || ''} onChange={(e) => setSelected(e.target.value)}>
          {matches.map((match) => <option key={match.id} value={match.id}>{localDay(match.kickoff_utc)} · {match.home_name} vs {match.away_name}</option>)}
        </select>
        {selectedMatch && <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black"><img src={flagUrl(selectedMatch.home_flag)} className="h-6 w-8 object-contain" alt="" />{selectedMatch.home_name}</div>
            <div className="text-sm font-black text-slate-500">vs</div>
            <div className="flex items-center gap-2 text-right font-black">{selectedMatch.away_name}<img src={flagUrl(selectedMatch.away_flag)} className="h-6 w-8 object-contain" alt="" /></div>
          </div>
          <div className="mt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{localDay(selectedMatch.kickoff_utc)} · {localTime(selectedMatch.kickoff_utc)}</div>
        </div>}
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
          {matchPicks.length === 0 && <div className="p-4 text-center text-sm font-bold text-slate-400">Todavia no hay picks para este partido.</div>}
          {matchPicks.map((pick) => <div key={pick.player_id} className="grid grid-cols-[1fr_80px_56px] items-center border-t border-slate-100 px-3 py-3 first:border-t-0">
            <b>{pick.alias}</b>
            <span className="text-center text-lg font-black">{pick.home_goals} - {pick.away_goals}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-center text-sm font-black text-pitch">{pick.points} pts</span>
          </div>)}
        </div>
      </section>
    </main>
  );
}

function AdminView({ matches, reload }: { matches: Match[]; reload: () => void }) {
  const [pin, setPin] = useState('');
  const [adminReady, setAdminReady] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<Record<string, Pick>>({});
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [mode, setMode] = useState<'picks' | 'results' | 'settings'>('picks');
  const [settings, setSettings] = useState<AppSettings>({ late_picks_open: false, reveal_picks: false });

  async function admin<T>(url: string, options: RequestInit = {}) {
    return api.request<T>(url, { ...options, headers: { ...(options.headers || {}), 'x-admin-pin': pin } });
  }
  async function loadPlayers() {
    const rows = await admin<Player[]>('/api/admin/players');
    const currentSettings = await api.request<AppSettings>('/api/settings');
    setSettings(currentSettings);
    setAdminReady(true);
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
  async function changeDraft(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = draft[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = { ...current, [side]: Math.max(0, current[side] + delta) };
    setDraft({ ...draft, [match.id]: next });
    if (selected) {
      await admin(`/api/admin/picks/${selected}`, { method: 'PUT', body: JSON.stringify([next]) });
    }
  }
  async function saveResult(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = { match_id: match.id, home_goals: match.home_goals ?? 0, away_goals: match.away_goals ?? 0 };
    const next = { ...current, [side]: Math.max(0, current[side] + delta) };
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify(next) });
    await reload();
  }

  async function updateSetting(key: keyof AppSettings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await admin('/api/admin/settings', { method: 'POST', body: JSON.stringify({ [key]: value }) });
    await reload();
  }

  async function selectPlayer(playerId: string) {
    setSelected(playerId);
    const rows = await admin<Pick[]>(`/api/admin/picks/${playerId}`);
    setDraft(Object.fromEntries(rows.map((pick) => [pick.match_id, pick])));
  }

  useEffect(() => {
    if (adminReady && selected) selectPlayer(selected);
  }, [adminReady, selected]);

  if (!adminReady) {
    return (
      <main className="mx-auto max-w-xl py-6">
        <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Organizador</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Ingresa el PIN para capturar resultados y picks enviados por WhatsApp.</p>
          <label className="mt-5 block text-sm font-black">PIN</label>
          <input className="input" value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off" />
          <button onClick={loadPlayers} className="mt-4 h-12 w-full rounded-lg bg-pitch font-black text-white">Entrar</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl py-5">
      <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
        <h2 className="font-black">Jugadores</h2>
        <div className="mt-3 flex flex-wrap gap-2">{players.map((p) => <button key={p.id} onClick={() => selectPlayer(p.id)} className={`rounded-full px-4 py-2 text-sm font-black ${selected === p.id ? 'bg-pitch text-white' : 'bg-emerald-50 text-slate-600'}`}>{p.alias}</button>)}</div>
        <div className="mt-4 grid grid-cols-[1fr_100px_48px] gap-2"><input className="input !mt-0" value={name} onChange={(e) => setName(e.target.value)} placeholder="Agregar jugador" /><input className="input !mt-0" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" /><button onClick={addPlayer} className="rounded-lg bg-pitch text-white"><UserPlus className="mx-auto" /></button></div>
      </div>
      <div className="mt-4 grid grid-cols-3 rounded-lg bg-emerald-50 p-1">
        <button onClick={() => setMode('picks')} className={`h-11 rounded-md text-sm font-black ${mode === 'picks' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Editar picks</button>
        <button onClick={() => setMode('results')} className={`h-11 rounded-md text-sm font-black ${mode === 'results' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Resultados</button>
        <button onClick={() => setMode('settings')} className={`h-11 rounded-md text-sm font-black ${mode === 'settings' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Ajustes</button>
      </div>
      <h2 className="mt-6 text-lg font-black text-pitch">{mode === 'picks' ? 'Captura de WhatsApp' : mode === 'results' ? 'Resultados oficiales' : 'Ajustes'}</h2>
      {mode === 'settings' ? <section className="mt-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Permitir llenar partidos pasados</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Úsalo para que cada quien capture lo que ya había mandado por WhatsApp. Al apagarlo, todo lo pasado vuelve a bloquearse.</p>
          </div>
          <button onClick={() => updateSetting('late_picks_open', !settings.late_picks_open)} className={`h-10 min-w-16 rounded-full px-4 text-sm font-black ${settings.late_picks_open ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
            {settings.late_picks_open ? 'Sí' : 'No'}
          </button>
        </div>
      </section> : mode === 'picks' ? <div className="mt-3 space-y-4">
        {matches.map((match) => <MatchCard key={match.id} match={match} pick={draft[match.id]} setScore={changeDraft} forceOpen />)}
      </div> : <div className="mt-3 space-y-3">
        {matches.map((match) => {
          const p = { match_id: match.id, home_goals: match.home_goals ?? 0, away_goals: match.away_goals ?? 0 };
          return <article key={match.id} className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Grupo {match.grp} · {localDay(match.kickoff_utc)} · {localTime(match.kickoff_utc)}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 text-center">
                <img src={flagUrl(match.home_flag)} alt="" className="mx-auto h-8 w-12 object-contain" />
                <div className="mt-1 min-h-10 text-sm font-black leading-5 text-slate-950">{match.home_name}</div>
              </div>
              <div className="min-w-0 text-center">
                <img src={flagUrl(match.away_flag)} alt="" className="mx-auto h-8 w-12 object-contain" />
                <div className="mt-1 min-h-10 text-sm font-black leading-5 text-slate-950">{match.away_name}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[40px_32px_40px_24px_40px_32px_40px] items-center justify-center gap-1">
              <button className="mini-btn !h-10 !w-10" onClick={() => saveResult(match, 'home_goals', -1)}>-</button>
              <b className="text-center text-lg">{p.home_goals}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => saveResult(match, 'home_goals', 1)}>+</button>
              <span className="text-center font-black text-slate-300">-</span>
              <button className="mini-btn !h-10 !w-10" onClick={() => saveResult(match, 'away_goals', -1)}>-</button>
              <b className="text-center text-lg">{p.away_goals}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => saveResult(match, 'away_goals', 1)}>+</button>
            </div>
          </article>;
        })}
      </div>}
      {mode === 'picks' && <button onClick={saveAdminPicks} className="mt-5 h-14 w-full rounded-lg bg-pitch text-lg font-black text-white">Guardar picks del jugador</button>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
