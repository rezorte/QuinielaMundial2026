import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Lock, LogOut, Pencil, Settings, Trophy, UserPlus } from 'lucide-react';
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
type ResultDraft = { match_id: string; home_goals: number | null; away_goals: number | null };
type Player = { id: string; alias: string; display_name?: string; birth_year?: string; active?: boolean | 0 | 1 };
type Standing = { rank: number; rank_delta: number; player_id: string; alias: string; points: number; exacts: number; results: number };
type MatchPick = { player_id: string; alias: string; home_goals: number; away_goals: number; points: number };
type AppSettings = { late_picks_open: boolean; reveal_picks: boolean; show_team_stats: boolean; registration_open: boolean; show_match_picks: boolean; show_pick_scores: boolean };
type TeamStats = {
  team_code: string;
  fifa_rank: number | null;
  first_world_cup: number | null;
  world_cup_appearances: number | null;
  world_cup_played: number | null;
  world_cup_wins: number | null;
  world_cup_draws: number | null;
  world_cup_losses: number | null;
  world_cup_goals_for: number | null;
  world_cup_goals_against: number | null;
  best_world_cup_result: string | null;
  coach: string | null;
  stars_json: string[] | null;
  squad_json: { goalkeepers?: string[]; defenders?: string[]; midfielders?: string[]; forwards?: string[] } | null;
  form_json: Array<'W' | 'D' | 'L'> | null;
  source_name: string | null;
  source_url: string | null;
  verified_at: string | null;
} | null;
type MatchStats = {
  home: TeamStats;
  away: TeamStats;
  head_to_head: {
    last_match_date: string | null;
    last_match_score: string | null;
    competition: string | null;
    source_name: string | null;
    source_url: string | null;
    verified_at: string | null;
  } | null;
};

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
  return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Mexico_City' }).format(new Date(iso));
}

function outcome(home: number, away: number) {
  if (home > away) return 'H';
  if (home < away) return 'A';
  return 'D';
}

function pickPoints(pick: Pick | undefined, match: Match) {
  if (!pick || match.home_goals === null || match.away_goals === null) return null;
  if (pick.home_goals === match.home_goals && pick.away_goals === match.away_goals) return 3;
  if (outcome(pick.home_goals, pick.away_goals) === outcome(match.home_goals, match.away_goals)) return 1;
  return 0;
}

function Login({ onDone }: { onDone: () => void }) {
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.request<{ token: string; player: Player }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ nombre, anio })
      });
      localStorage.setItem('qm_token', data.token);
      localStorage.setItem('qm_player', JSON.stringify(data.player));
      onDone();
    } catch (err: any) {
      if (err.status === 409 && err.data?.error === 'NAME_EXISTS_WRONG_YEAR') {
        setError('Ese nombre ya existe. Usa el año correcto para continuar.');
      } else if (err.status === 403 && err.data?.error === 'REGISTRATION_CLOSED') {
        setError('El registro de nuevos jugadores está cerrado. Si ya habías entrado, usa el mismo nombre y año.');
      } else if (err.status === 403 && err.data?.error === 'USER_INACTIVE') {
        setError('Este usuario está desactivado. Pide al organizador que lo active.');
      } else {
        setError('No se pudo entrar. Revisa los datos e intenta de nuevo.');
      }
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
        {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-triondaRed">{error}</div>}
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
  const [settings, setSettings] = useState<AppSettings>({ late_picks_open: false, reveal_picks: false, show_team_stats: false, registration_open: true, show_match_picks: false, show_pick_scores: true });
  const [aliasOpen, setAliasOpen] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(player?.alias || '');

  async function load() {
    const [m, s, cfg] = await Promise.all([api.request<Match[]>('/api/matches'), api.request<Standing[]>('/api/standings'), api.request<AppSettings>('/api/settings')]);
    setMatches(m);
    setStandings(s);
    setSettings(cfg);
    if (api.token()) {
      const p = await api.request<Pick[]>('/api/picks/me').catch(() => []);
      setPicks(Object.fromEntries(p.map((pick) => [pick.match_id, pick])));
    }
  }

  useEffect(() => {
    if (!player) return;
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [player]);
  if (!player) return <Login onDone={() => setPlayer(api.player())} />;

  async function saveName() {
    try {
      const updated = await api.request<Player>('/api/profile', { method: 'PUT', body: JSON.stringify({ nombre: aliasDraft }) });
      localStorage.setItem('qm_player', JSON.stringify(updated));
      setPlayer(updated);
      setAliasOpen(false);
      await load();
    } catch (err: any) {
      if (err.status === 409) alert('Ese nombre ya existe.');
      else throw err;
    }
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
      {tab === 'fill' && <FillView matches={matches} picks={picks} setPicks={setPicks} showStats={settings.show_team_stats} showMatchPicks={settings.show_match_picks} showPickScores={settings.show_pick_scores} />}
      {tab === 'table' && <TableView standings={standings} matches={matches} />}
      {tab === 'admin' && <AdminView matches={matches} reload={load} />}
      {aliasOpen && <div className="fixed inset-0 z-40 flex items-end bg-slate-950/30 p-4">
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
          <h2 className="text-lg font-black">Cambiar nombre</h2>
          <input className="input" value={aliasDraft} onChange={(e) => setAliasDraft(e.target.value)} placeholder="Tu nombre" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setAliasOpen(false)} className="h-12 rounded-lg bg-slate-100 font-black text-slate-600">Cancelar</button>
            <button onClick={saveName} className="h-12 rounded-lg bg-pitch font-black text-white">Guardar</button>
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

function FillView({ matches, picks, setPicks, showStats, showMatchPicks, showPickScores }: { matches: Match[]; picks: Record<string, Pick>; setPicks: (p: Record<string, Pick>) => void; showStats: boolean; showMatchPicks: boolean; showPickScores: boolean }) {
  const days = Array.from(new Set(matches.map((m) => localDateKey(m.kickoff_utc))));
  const [index, setIndex] = useState(0);
  const dayMatches = matches.filter((m) => localDateKey(m.kickoff_utc) === days[index]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedPulse, setSavedPulse] = useState(false);
  const isSaving = Object.values(saving).some(Boolean);

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
    setSavedPulse(true);
    window.setTimeout(() => setSavedPulse(false), 1200);
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
        {dayMatches.map((match) => <MatchCard key={match.id} match={match} pick={picks[match.id]} setScore={setScore} saving={saving[match.id]} showStats={showStats} showMatchPicks={showMatchPicks} showPickScores={showPickScores} />)}
      </div>
      <div className={`fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-black shadow-sm transition-all ${isSaving ? 'bg-pitch text-white opacity-100' : savedPulse ? 'bg-emerald-50 text-pitch opacity-100' : 'pointer-events-none opacity-0'}`}>
        {isSaving ? 'Guardando...' : 'Guardado'}
      </div>
    </main>
  );
}

function MatchCard({ match, pick, setScore, forceOpen = false, saving = false, showStats = false, showMatchPicks = false, showPickScores = false }: { match: Match; pick?: Pick; setScore: (m: Match, s: 'home_goals' | 'away_goals', d: number) => void; forceOpen?: boolean; saving?: boolean; showStats?: boolean; showMatchPicks?: boolean; showPickScores?: boolean }) {
  const locked = Boolean(match.locked) && !forceOpen;
  const points = pickPoints(pick, match);
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
      {showPickScores && points !== null && <div className="mx-4 mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          Resultado real:
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-black text-slate-950">
          <img src={flagUrl(match.home_flag)} alt="" className="h-4 w-6 rounded-sm object-cover shadow-sm" />
          <span>{match.home_goals}</span>
          <span className="text-slate-300">-</span>
          <span>{match.away_goals}</span>
          <img src={flagUrl(match.away_flag)} alt="" className="h-4 w-6 rounded-sm object-cover shadow-sm" />
        </span>
        <span className="hidden text-slate-300 min-[360px]:inline">·</span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
          Obtuviste: <span className="font-black text-slate-950">{points} pts</span>
        </span>
      </div>}
      {showMatchPicks && <MatchPicksPanel match={match} />}
      {showStats && <StatsPanel match={match} />}
    </article>
  );
}

function MatchPicksPanel({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<MatchPick[]>([]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const rows = await api.request<MatchPick[]>(`/api/matches/${match.id}/picks`);
      setPicks(rows);
    }
  }

  return (
    <div className="border-t border-emerald-100 px-4 pb-4">
      <button onClick={toggle} className="mt-1 w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-black text-slate-600">
        Picks familiares
      </button>
      {open && <div className="mt-2 overflow-hidden rounded-lg border border-slate-100">
        {picks.length === 0 && <div className="p-3 text-center text-sm font-bold text-slate-400">Todavia no hay picks.</div>}
        {picks.map((row) => <div key={row.player_id} className="grid grid-cols-[minmax(0,1fr)_70px_52px] items-center gap-2 border-t border-slate-100 px-3 py-2 first:border-t-0">
          <b className="truncate text-sm">{row.alias}</b>
          <span className="text-right text-sm font-black">{row.home_goals} - {row.away_goals}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-center text-xs font-black text-pitch">{row.points}</span>
        </div>)}
      </div>}
    </div>
  );
}

function StatsPanel({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<MatchStats | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !stats) {
      const data = await api.request<MatchStats>(`/api/matches/${match.id}/stats`);
      setStats(data);
    }
  }

  return (
    <div className="border-t border-emerald-100 px-4 pb-4">
      <button onClick={toggle} className="mt-1 w-full rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-black text-pitch">
        Datos para decidir
      </button>
      {open && <div className="mt-3">
        {!stats || (!stats.home && !stats.away && !stats.head_to_head) ? <p className="text-sm leading-6 text-slate-500">Datos oficiales validados pendientes de cargar.</p> : <>
          <StatsComparison match={match} home={stats.home} away={stats.away} />
          {stats.head_to_head && <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
            <b>Último enfrentamiento</b>
            <div className="mt-1 text-slate-600">{stats.head_to_head.last_match_date || 'Fecha pendiente'} · {stats.head_to_head.last_match_score || 'Marcador pendiente'}</div>
            {stats.head_to_head.competition && <div className="text-xs font-bold text-slate-400">{stats.head_to_head.competition}</div>}
          </div>}
        </>}
      </div>}
    </div>
  );
}

function StatsComparison({ match, home, away }: { match: Match; home: TeamStats; away: TeamStats }) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-100 bg-white">
      <div className="grid grid-cols-[minmax(0,1fr)_82px_minmax(0,1fr)] items-end gap-2 border-b border-emerald-100 bg-emerald-50/60 px-3 py-3">
        <TeamCompareHeader name={match.home_name} flag={match.home_flag} align="left" />
        <div className="text-center text-[10px] font-black uppercase tracking-[0.12em] text-pitch">Comparativo</div>
        <TeamCompareHeader name={match.away_name} flag={match.away_flag} align="right" />
      </div>

      <div className="divide-y divide-slate-100">
        <CompareRow label="Ranking FIFA" left={rankValue(home)} right={rankValue(away)} large accent />
        <CompareRow label="Mundiales" left={numberValue(home?.world_cup_appearances)} right={numberValue(away?.world_cup_appearances)} large />
        <CompareRow label="Primer Mundial" left={numberValue(home?.first_world_cup)} right={numberValue(away?.first_world_cup)} />
        <CompareRow label="Partidos" left={numberValue(home?.world_cup_played)} right={numberValue(away?.world_cup_played)} />
        <CompareRow label="Victorias" left={numberValue(home?.world_cup_wins)} right={numberValue(away?.world_cup_wins)} leftClass="text-pitch" rightClass="text-pitch" />
        <CompareRow label="Empates" left={numberValue(home?.world_cup_draws)} right={numberValue(away?.world_cup_draws)} leftClass="text-triondaGold" rightClass="text-triondaGold" />
        <CompareRow label="Derrotas" left={numberValue(home?.world_cup_losses)} right={numberValue(away?.world_cup_losses)} leftClass="text-triondaRed" rightClass="text-triondaRed" />
        <CompareRow label="Goles a favor" left={numberValue(home?.world_cup_goals_for)} right={numberValue(away?.world_cup_goals_for)} />
        <CompareRow label="Goles contra" left={numberValue(home?.world_cup_goals_against)} right={numberValue(away?.world_cup_goals_against)} />
      </div>

      <div className="grid grid-cols-2 divide-x divide-emerald-100 border-t border-emerald-100">
        <TeamDetailBlock title={match.home_name} stats={home} />
        <TeamDetailBlock title={match.away_name} stats={away} />
      </div>
    </div>
  );
}

function TeamCompareHeader({ name, flag, align }: { name: string; flag: string; align: 'left' | 'right' }) {
  return <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
    <img src={flagUrl(flag)} alt="" className={`h-7 w-10 rounded-sm object-cover shadow-sm ${align === 'right' ? 'ml-auto' : ''}`} />
    <div className="mt-1 truncate text-sm font-black leading-5 text-slate-950">{name}</div>
  </div>;
}

function CompareRow({ label, left, right, large = false, accent = false, leftClass = 'text-slate-950', rightClass = 'text-slate-950' }: { label: string; left: string; right: string; large?: boolean; accent?: boolean; leftClass?: string; rightClass?: string }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_82px_minmax(0,1fr)] items-center gap-2 px-3 py-2.5">
    <div className={`text-left font-black ${large ? 'text-2xl leading-7' : 'text-lg leading-6'} ${accent ? 'text-pitch' : leftClass}`}>{left}</div>
    <div className="text-center text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</div>
    <div className={`text-right font-black ${large ? 'text-2xl leading-7' : 'text-lg leading-6'} ${accent ? 'text-pitch' : rightClass}`}>{right}</div>
  </div>;
}

function numberValue(value?: number | null) {
  return value === null || value === undefined ? '-' : String(value);
}

function rankValue(stats: TeamStats) {
  return stats?.fifa_rank ? `#${stats.fifa_rank}` : '-';
}

function TeamDetailBlock({ title, stats }: { title: string; stats: TeamStats }) {
  const [squadOpen, setSquadOpen] = useState(false);
  const form = stats?.form_json || [];
  const squad = stats?.squad_json;
  return (
    <section className="min-w-0 p-3 text-sm">
      <h3 className="truncate text-sm font-black text-slate-950">{title}</h3>
      {stats?.coach && <div className="mt-1 text-xs font-bold leading-5 text-slate-500">DT {stats.coach}</div>}
      {stats?.best_world_cup_result && <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-black leading-5 text-pitch">{stats.best_world_cup_result}</div>}

      <div className="mt-3">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Jugadores a seguir</div>
        {stats?.stars_json?.length ? <ul className="mt-2 space-y-1.5">
          {stats.stars_json.map((player) => <li key={player} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-sm font-black leading-5 text-slate-700">{player}</li>)}
        </ul> : <div className="mt-2 text-sm font-bold text-slate-400">Pendiente</div>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-1">
        {form.length ? form.map((r, index) => <span key={index} className={`h-3 w-3 rounded-full ${r === 'W' ? 'bg-pitch' : r === 'D' ? 'bg-triondaGold' : 'bg-triondaRed'}`} />) : <span className="text-sm text-slate-400">-</span>}
        </div>
        {squad && <button onClick={() => setSquadOpen(!squadOpen)} className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-pitch">
          {squadOpen ? 'Ocultar plantel' : 'Ver plantel'}
        </button>}
      </div>

      {squadOpen && squad && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">
        <SquadLine label="POR" players={squad.goalkeepers} />
        <SquadLine label="DEF" players={squad.defenders} />
        <SquadLine label="MED" players={squad.midfielders} />
        <SquadLine label="DEL" players={squad.forwards} />
      </div>}
    </section>
  );
}

function SquadLine({ label, players }: { label: string; players?: string[] }) {
  if (!players?.length) return null;
  return <div>
    <b className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</b>
    <ul className="mt-1 space-y-1">
      {players.map((player) => <li key={player} className="leading-5 text-slate-700">{player}</li>)}
    </ul>
  </div>;
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

function RankMovement({ delta }: { delta: number }) {
  if (!delta) return <span className="text-[11px] font-black text-slate-300">-</span>;
  const movedUp = delta > 0;
  return <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${movedUp ? 'text-pitch' : 'text-triondaRed'}`}>
    {movedUp ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
    {Math.abs(delta)}
  </span>;
}

function TableView({ standings, matches }: { standings: Standing[]; matches: Match[] }) {
  const [view, setView] = useState<'ranking' | 'match'>('ranking');
  const [selected, setSelected] = useState('');
  const [matchPicks, setMatchPicks] = useState<MatchPick[]>([]);
  const latestMatchWithResult = [...matches].reverse().find((match) => match.home_goals !== null && match.away_goals !== null);
  const selectedMatch = matches.find((match) => match.id === selected) || latestMatchWithResult || matches[0];
  const selectedIndex = selectedMatch ? matches.findIndex((match) => match.id === selectedMatch.id) : -1;

  useEffect(() => {
    if (!selectedMatch) return;
    setSelected(selectedMatch.id);
    api.request<MatchPick[]>(`/api/matches/${selectedMatch.id}/picks`).then(setMatchPicks).catch(() => setMatchPicks([]));
  }, [selectedMatch?.id]);

  function moveMatch(delta: number) {
    if (selectedIndex < 0) return;
    const next = Math.max(0, Math.min(matches.length - 1, selectedIndex + delta));
    setSelected(matches[next].id);
  }

  return (
    <main className="mx-auto max-w-4xl py-6">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-emerald-50 p-1">
        <button onClick={() => setView('ranking')} className={`h-11 rounded-md text-sm font-black ${view === 'ranking' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Ranking</button>
        <button onClick={() => setView('match')} className={`h-11 rounded-md text-sm font-black ${view === 'match' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Por partido</button>
      </div>

      {view === 'ranking' && <>
      {standings.length > 0 && <div className="mb-6 grid grid-cols-3 items-end gap-2 text-center">
        {[standings[1], standings[0], standings[2]].map((row, index) => {
          const heights = ['h-20', 'h-28', 'h-16'];
          const colors = ['bg-slate-400', 'bg-triondaGold', 'bg-[#B87333]'];
          return <div key={row?.player_id || index} className="min-w-0">
            <div className="truncate text-sm font-black text-slate-950">{row?.alias || '-'}</div>
            <div className={`mt-2 flex ${heights[index]} items-start justify-center rounded-t-lg ${colors[index]} pt-3 text-2xl font-black text-white`}>
              {row ? row.points : 0}
            </div>
            <div className="bg-emerald-50 py-1 text-xs font-black text-pitch">#{row?.rank || '-'}</div>
          </div>;
        })}
      </div>}
      <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white">
        <div className="grid grid-cols-[34px_minmax(0,1fr)_52px_48px_54px] gap-2 bg-pitch px-3 py-3 text-xs font-black text-white sm:text-sm">
          <span>#</span><span>Jugador</span><span className="text-right">Pts</span><span className="text-right">Res.</span><span className="text-right">Exact.</span>
        </div>
        {standings.map((row) => <div key={row.player_id} className="grid grid-cols-[34px_minmax(0,1fr)_52px_48px_54px] gap-2 border-t border-emerald-100 px-3 py-4 text-sm sm:text-base">
          <div className="flex flex-col leading-none">
            <b className="text-triondaGold">{row.rank}</b>
            <RankMovement delta={row.rank_delta} />
          </div>
          <b className="truncate">{row.alias}</b>
          <b className="text-right text-pitch">{row.points}</b>
          <span className="text-right">{row.results}</span>
          <span className="text-right">{row.exacts}</span>
        </div>)}
      </div>
      <p className="mt-5 text-center text-sm leading-6 text-slate-500">1 punto por resultado · 3 puntos por marcador exacto.</p>
      </>}

      {view === 'match' && <section className="rounded-lg border border-emerald-200 bg-white p-4">
        <h2 className="text-lg font-black">Picks por partido</h2>
        <div className="mt-3 grid grid-cols-[48px_1fr_48px] items-center gap-2">
          <button className="icon-btn !h-12 !w-12" disabled={selectedIndex <= 0} onClick={() => moveMatch(-1)}><ChevronLeft /></button>
          <select className="input !mt-0" value={selectedMatch?.id || ''} onChange={(e) => setSelected(e.target.value)}>
            {matches.map((match) => <option key={match.id} value={match.id}>{localDay(match.kickoff_utc)} · {match.home_name} vs {match.away_name}</option>)}
          </select>
          <button className="icon-btn !h-12 !w-12" disabled={selectedIndex >= matches.length - 1} onClick={() => moveMatch(1)}><ChevronRight /></button>
        </div>
        {selectedMatch && <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black"><img src={flagUrl(selectedMatch.home_flag)} className="h-6 w-8 object-contain" alt="" />{selectedMatch.home_name}</div>
            <div className="text-sm font-black text-slate-500">
              {selectedMatch.home_goals !== null && selectedMatch.away_goals !== null ? `${selectedMatch.home_goals} - ${selectedMatch.away_goals}` : 'vs'}
            </div>
            <div className="flex items-center gap-2 text-right font-black">{selectedMatch.away_name}<img src={flagUrl(selectedMatch.away_flag)} className="h-6 w-8 object-contain" alt="" /></div>
          </div>
          <div className="mt-1 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{localDay(selectedMatch.kickoff_utc)} · {localTime(selectedMatch.kickoff_utc)}</div>
        </div>}
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
          {matchPicks.length === 0 && <div className="p-4 text-center text-sm font-bold text-slate-400">Todavia no hay picks para este partido.</div>}
          {matchPicks.map((pick) => <div key={pick.player_id} className="grid grid-cols-[minmax(0,1fr)_76px_58px] items-center gap-2 border-t border-slate-100 px-3 py-3 first:border-t-0">
            <b className="truncate">{pick.alias}</b>
            <span className="text-right text-lg font-black">{pick.home_goals} - {pick.away_goals}</span>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-center text-sm font-black text-pitch">{pick.points} pts</span>
          </div>)}
        </div>
      </section>}
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
  const [resultDate, setResultDate] = useState(todayLocalKey());
  const [settings, setSettings] = useState<AppSettings>({ late_picks_open: false, reveal_picks: false, show_team_stats: false, registration_open: true, show_match_picks: false, show_pick_scores: true });

  async function admin<T>(url: string, options: RequestInit = {}) {
    return api.request<T>(url, { ...options, headers: { ...(options.headers || {}), 'x-admin-pin': pin } });
  }
  async function loadPlayers() {
    const rows = await admin<Player[]>('/api/admin/players');
    const currentSettings = await api.request<AppSettings>('/api/settings');
    setSettings(currentSettings);
    setAdminReady(true);
    setPlayers(rows);
    const activeRows = rows.filter((player) => Boolean(player.active));
    if (!selected && activeRows[0]) setSelected(activeRows[0].id);
  }
  async function addPlayer() {
    try {
      await admin('/api/admin/player', { method: 'POST', body: JSON.stringify({ nombre: name, anio: year }) });
      setName(''); setYear(''); await loadPlayers();
    } catch (err: any) {
      if (err.status === 409) alert('Ese nombre ya existe.');
      else throw err;
    }
  }
  async function changeDraft(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = draft[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = { ...current, [side]: Math.max(0, current[side] + delta) };
    setDraft({ ...draft, [match.id]: next });
    if (selected) {
      await admin(`/api/admin/picks/${selected}`, { method: 'PUT', body: JSON.stringify([next]) });
      await reload();
    }
  }
  async function saveResult(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current: ResultDraft = { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals };
    const currentValue = current[side];
    const nextValue = currentValue === null ? 0 : Math.max(0, currentValue + delta);
    const next = { ...current, [side]: nextValue };
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify(next) });
    await reload();
  }

  async function clearResult(match: Match) {
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify({ match_id: match.id, home_goals: null, away_goals: null }) });
    await reload();
  }

  async function updateSetting(key: keyof AppSettings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await admin('/api/admin/settings', { method: 'POST', body: JSON.stringify({ [key]: value }) });
    await reload();
  }

  async function updatePlayer(player: Player) {
    try {
      await admin(`/api/admin/player/${player.id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre: player.alias, birth_year: player.birth_year, active: Boolean(player.active) })
      });
      await loadPlayers();
    } catch (err: any) {
      if (err.status === 409) alert('Ese nombre ya existe en otro jugador.');
      else throw err;
    }
  }

  function editPlayerLocal(playerId: string, field: 'alias' | 'birth_year' | 'active', value: string | boolean) {
    setPlayers(players.map((player) => player.id === playerId ? { ...player, [field]: value } : player));
  }

  async function selectPlayer(playerId: string) {
    setSelected(playerId);
    const rows = await admin<Pick[]>(`/api/admin/picks/${playerId}`);
    setDraft(Object.fromEntries(rows.map((pick) => [pick.match_id, pick])));
  }

  useEffect(() => {
    if (adminReady && selected) selectPlayer(selected);
  }, [adminReady, selected]);

  const resultDays = Array.from(new Set(matches.map((match) => localDateKey(match.kickoff_utc))));
  const resultMatches = matches
    .filter((match) => localDateKey(match.kickoff_utc) === resultDate)
    .sort((a, b) => Number(a.home_goals !== null && a.away_goals !== null) - Number(b.home_goals !== null && b.away_goals !== null));

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
      <div className="mt-4 grid grid-cols-3 rounded-lg bg-emerald-50 p-1">
        <button onClick={() => setMode('picks')} className={`h-11 rounded-md text-sm font-black ${mode === 'picks' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Jugadores</button>
        <button onClick={() => setMode('results')} className={`h-11 rounded-md text-sm font-black ${mode === 'results' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Resultados</button>
        <button onClick={() => setMode('settings')} className={`h-11 rounded-md text-sm font-black ${mode === 'settings' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Ajustes</button>
      </div>
      {mode !== 'picks' && <h2 className="mt-6 text-lg font-black text-pitch">{mode === 'results' ? 'Resultados oficiales' : 'Ajustes'}</h2>}
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
        <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Permitir nuevos usuarios</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Si lo apagas, solo podrán entrar jugadores ya registrados con su año correcto.</p>
          </div>
          <button onClick={() => updateSetting('registration_open', !settings.registration_open)} className={`h-10 min-w-16 rounded-full px-4 text-sm font-black ${settings.registration_open ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
            {settings.registration_open ? 'Sí' : 'No'}
          </button>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Mostrar estadísticas</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Activa el panel “Datos para decidir”. Solo mostrará datos cuando estén cargados y validados.</p>
          </div>
          <button onClick={() => updateSetting('show_team_stats', !settings.show_team_stats)} className={`h-10 min-w-16 rounded-full px-4 text-sm font-black ${settings.show_team_stats ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
            {settings.show_team_stats ? 'Sí' : 'No'}
          </button>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Mostrar picks en partidos</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Controla si aparece el panel “Picks familiares” dentro de cada partido.</p>
          </div>
          <button onClick={() => updateSetting('show_match_picks', !settings.show_match_picks)} className={`h-10 min-w-16 rounded-full px-4 text-sm font-black ${settings.show_match_picks ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
            {settings.show_match_picks ? 'Sí' : 'No'}
          </button>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Mostrar resultado y puntos</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">Cuando ya haya resultado oficial, muestra debajo de tu pick el marcador real y tus puntos.</p>
          </div>
          <button onClick={() => updateSetting('show_pick_scores', !settings.show_pick_scores)} className={`h-10 min-w-16 rounded-full px-4 text-sm font-black ${settings.show_pick_scores ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
            {settings.show_pick_scores ? 'Sí' : 'No'}
          </button>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-black text-slate-950">Jugadores</h3>
          <div className="mt-3 space-y-3">
            {players.map((player) => <div key={player.id} className={`rounded-lg border p-3 ${Boolean(player.active) ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-80'}`}>
              <div className="grid grid-cols-[1fr_92px] gap-2">
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Nombre</span>
                  <input className="h-11 w-full min-w-0 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold outline-none focus:border-pitch" value={player.alias} onChange={(e) => editPlayerLocal(player.id, 'alias', e.target.value)} />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Año</span>
                  <input className="h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold outline-none focus:border-pitch" value={player.birth_year || ''} inputMode="numeric" onChange={(e) => editPlayerLocal(player.id, 'birth_year', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                </label>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-sm font-black text-slate-600">Activo</span>
                <button onClick={() => editPlayerLocal(player.id, 'active', !Boolean(player.active))} className={`h-9 min-w-14 rounded-full px-3 text-sm font-black ${Boolean(player.active) ? 'bg-pitch text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {Boolean(player.active) ? 'Sí' : 'No'}
                </button>
              </div>
              <button onClick={() => updatePlayer(player)} className="mt-2 h-10 w-full rounded-lg bg-pitch text-sm font-black text-white">Guardar</button>
            </div>)}
          </div>
        </div>
      </section> : mode === 'picks' ? <div className="mt-3 space-y-4">
        <section className="rounded-lg border border-emerald-200 bg-white p-4">
          <h3 className="font-black">Agregar jugador</h3>
          <div className="mt-3 grid grid-cols-[1fr_100px_48px] gap-2"><input className="input !mt-0" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" /><input className="input !mt-0" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" /><button onClick={addPlayer} className="rounded-lg bg-pitch text-white"><UserPlus className="mx-auto" /></button></div>
          <h3 className="mt-5 border-t border-slate-100 pt-4 font-black">Selecciona jugador</h3>
          <div className="mt-3 flex flex-wrap gap-2">{players.filter((p) => Boolean(p.active)).map((p) => <button key={p.id} onClick={() => selectPlayer(p.id)} className={`rounded-full px-4 py-2 text-sm font-black ${selected === p.id ? 'bg-pitch text-white' : 'bg-emerald-50 text-slate-600'}`}>{p.alias}</button>)}</div>
        </section>
        {matches.map((match) => <MatchCard key={match.id} match={match} pick={draft[match.id]} setScore={changeDraft} forceOpen />)}
      </div> : <div className="mt-3 space-y-3">
        <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-black text-slate-950">Fecha</label>
          <select className="input" value={resultDate} onChange={(e) => setResultDate(e.target.value)}>
            {!resultDays.includes(resultDate) && <option value={resultDate}>{localDateLabel(`${resultDate}T12:00:00Z`)}</option>}
            {resultDays.map((day) => <option key={day} value={day}>{localDateLabel(`${day}T12:00:00Z`)}</option>)}
          </select>
          <p className="mt-2 text-xs font-bold text-slate-400">Primero aparecen los partidos de esa fecha que todavía no tienen resultado.</p>
        </section>
        {resultMatches.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400">No hay partidos en esta fecha.</div>}
        {resultMatches.map((match) => {
          const p: ResultDraft = { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals };
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
              <b className="text-center text-lg">{p.home_goals ?? '-'}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => saveResult(match, 'home_goals', 1)}>+</button>
              <span className="text-center font-black text-slate-300">-</span>
              <button className="mini-btn !h-10 !w-10" onClick={() => saveResult(match, 'away_goals', -1)}>-</button>
              <b className="text-center text-lg">{p.away_goals ?? '-'}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => saveResult(match, 'away_goals', 1)}>+</button>
            </div>
            {(p.home_goals !== null || p.away_goals !== null) && <button onClick={() => clearResult(match)} className="mx-auto mt-3 block rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">Limpiar resultado</button>}
          </article>;
        })}
      </div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
