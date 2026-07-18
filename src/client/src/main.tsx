import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, CircleDot, Crown, Lock, LogOut, Medal, Pencil, Settings, Trophy, UserPlus } from 'lucide-react';
import './styles.css';

type Match = {
  id: string;
  grp: string;
  jornada: number;
  kickoff_utc: string;
  home_goals: number | null;
  away_goals: number | null;
  advance: 'H' | 'A' | null;
  first_goal: 'H' | 'A' | 'N' | null;
  locked: 0 | 1 | boolean;
  home_code: string;
  home_name: string;
  home_flag: string;
  away_code: string;
  away_name: string;
  away_flag: string;
};
type BonusSide = 'H' | 'A';
type FirstGoalPick = 'H' | 'A' | 'N';
type Pick = { match_id: string; home_goals: number; away_goals: number; advance_pick?: BonusSide | null; first_goal_pick?: FirstGoalPick | null };
type ResultDraft = { match_id: string; home_goals: number | null; away_goals: number | null; advance?: BonusSide | null; first_goal?: FirstGoalPick | null };
type Player = { id: string; alias: string; display_name?: string; birth_year?: string; active?: boolean | 0 | 1 };
type Standing = { rank: number; rank_delta: number; player_id: string; alias: string; points: number; exacts: number; results: number };
type MatchPick = { player_id: string; alias: string; home_goals: number; away_goals: number; advance_pick?: BonusSide | null; first_goal_pick?: FirstGoalPick | null; points: number; rank?: number | null; rank_delta?: number; rank_before?: number | null; points_before?: number | null; points_after?: number | null };
type PlayPickPreview = { label: string; pick?: Pick | MatchPick; isSelf?: boolean; meta?: string; rank?: number };
type PlayMessage = { text: string; pick?: MatchPick; pickLabel?: string; picks?: PlayPickPreview[] };
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
type TeamTournamentSummaryData = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  form: Array<'W' | 'D' | 'L'>;
  avgFor: string;
  avgAgainst: string;
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
  const base = pick.home_goals === match.home_goals && pick.away_goals === match.away_goals ? 3 : outcome(pick.home_goals, pick.away_goals) === outcome(match.home_goals, match.away_goals) ? 1 : 0;
  const advance = isBonusMatch(match) && isDrawScore(pick.home_goals, pick.away_goals) && pick.advance_pick && match.advance && pick.advance_pick === match.advance ? 1 : 0;
  const firstGoalPick = isBonusMatch(match) ? effectiveFirstGoal(pick.home_goals, pick.away_goals, pick.first_goal_pick) : null;
  const firstGoalResult = isBonusMatch(match) ? effectiveFirstGoal(match.home_goals, match.away_goals, match.first_goal) : null;
  const firstGoal = firstGoalPick && firstGoalResult && firstGoalPick === firstGoalResult ? 1 : 0;
  return base + advance + firstGoal;
}

function effectiveFirstGoal(home: number | null, away: number | null, selected?: FirstGoalPick | null): FirstGoalPick | null {
  if (home === null || away === null) return null;
  if (home === 0 && away === 0) return 'N';
  if (home > 0 && away === 0) return 'H';
  if (home === 0 && away > 0) return 'A';
  return selected || null;
}

function isDrawScore(home: number | null | undefined, away: number | null | undefined) {
  return home !== null && home !== undefined && away !== null && away !== undefined && home === away;
}

function normalizeBonusPick<T extends Partial<Pick>>(match: Match, pick: T): T {
  if (!isBonusMatch(match)) return pick;
  const next = { ...pick };
  if (!isDrawScore(next.home_goals, next.away_goals)) {
    next.advance_pick = null;
  }
  next.first_goal_pick = effectiveFirstGoal(next.home_goals ?? null, next.away_goals ?? null, next.first_goal_pick ?? null);
  const firstGoalOptions = firstGoalChoiceOptions(match, next.home_goals ?? null, next.away_goals ?? null);
  if (next.first_goal_pick && !firstGoalOptions.some((option) => option.value === next.first_goal_pick)) {
    next.first_goal_pick = null;
  }
  return next;
}

function normalizeResultDraft(match: Match, draft: ResultDraft) {
  if (!isBonusMatch(match)) return draft;
  const next = { ...draft };
  if (!isDrawScore(next.home_goals, next.away_goals)) {
    next.advance = null;
  }
  next.first_goal = effectiveFirstGoal(next.home_goals, next.away_goals, next.first_goal);
  const firstGoalOptions = firstGoalChoiceOptions(match, next.home_goals, next.away_goals);
  if (next.first_goal && !firstGoalOptions.some((option) => option.value === next.first_goal)) {
    next.first_goal = null;
  }
  return next;
}

function firstGoalChoiceOptions(match: Match, home: number | null | undefined, away: number | null | undefined): Array<{ value: FirstGoalPick; label: string; flag?: string }> {
  if (home === null || home === undefined || away === null || away === undefined) return [];
  if ((home === 0 && away === 0) || (home > 0 && away === 0) || (home === 0 && away > 0)) return [];
  return [
    { value: 'H', label: match.home_name, flag: match.home_flag },
    { value: 'A', label: match.away_name, flag: match.away_flag }
  ];
}

function advanceBonusLabel(match?: Match) {
  return match && (match.grp === 'T' || (match.grp === 'Q' && match.jornada === 8)) ? '¿Quién gana en penales?' : '¿Quién clasifica?';
}

function advanceResultLabel(match?: Match) {
  return match && (match.grp === 'T' || (match.grp === 'Q' && match.jornada === 8)) ? 'Penales' : 'Clasificó';
}

function matchRoundLabel(match?: Match) {
  if (!match) return '';
  if (match.grp === 'R' && match.jornada === 4) return 'Ronda de 32';
  if (match.grp === 'O' && match.jornada === 5) return 'Ronda de 16';
  if (match.grp === 'Q' && match.jornada === 6) return 'Cuartos de final';
  if (match.grp === 'Q' && match.jornada === 7) return 'Semifinales';
  if (match.grp === 'T' && match.jornada === 8) return 'Tercer lugar';
  if (match.grp === 'Q' && match.jornada === 8) return 'Final';
  return `Grupo ${match.grp}`;
}

function matchStageLabel(match?: Match) {
  if (!match) return '';
  if (match.grp === 'R' && match.jornada === 4) return 'Ronda de 32';
  if (match.grp === 'O' && match.jornada === 5) return 'Ronda de 16';
  if (match.grp === 'Q' && match.jornada === 6) return 'Cuartos de final';
  if (match.grp === 'Q' && match.jornada === 7) return 'Semifinales';
  if (match.grp === 'T' && match.jornada === 8) return 'Tercer lugar';
  if (match.grp === 'Q' && match.jornada === 8) return 'Final';
  return `Jornada ${match.jornada} · Grupo ${match.grp}`;
}

function dayRoundLabel(match?: Match) {
  if (!match) return '';
  if (match.grp === 'R' && match.jornada === 4) return 'Ronda de 32';
  if (match.grp === 'O' && match.jornada === 5) return 'Ronda de 16';
  if (match.grp === 'Q' && match.jornada === 6) return 'Cuartos de final';
  if (match.grp === 'Q' && match.jornada === 7) return 'Semifinales';
  if (match.grp === 'T' && match.jornada === 8) return 'Tercer lugar';
  if (match.grp === 'Q' && match.jornada === 8) return 'Final';
  return `Jornada ${match.jornada}`;
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
      <form onSubmit={submit} className="mx-auto mt-8 max-w-xl rounded-lg bg-white p-6 border border-slate-200 shadow-md shadow-slate-200/60">
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
        <button className="mt-7 h-14 w-full rounded-lg bg-pitch text-lg font-black text-white disabled:bg-slate-300" disabled={busy || nombre.length < 2 || anio.length !== 4}>
          Entrar
        </button>
      </form>
    </main>
  );
}

function Brand({ player, onEditAlias, onSwitchUser }: { player?: Player | null; onEditAlias?: () => void; onSwitchUser?: () => void }) {
  return (
    <header className="sticky top-0 z-20 -mx-5 bg-white/95 px-5 pb-2 pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-3xl leading-none">⚽</div>
          <div>
            <div className="text-xl font-black leading-5 text-slate-950">Mundial 2026</div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Quiniela Familiar</div>
          </div>
        </div>
        {player && <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-sm font-black text-slate-950">
          <button onClick={onEditAlias} className="px-2 py-1">{player.alias}</button>
          <button onClick={onEditAlias} className="rounded-full p-1 text-pitch" aria-label="Editar alias"><Pencil size={15} /></button>
          <button onClick={onSwitchUser} className="rounded-full p-1 text-slate-500" aria-label="Cambiar usuario"><LogOut size={15} /></button>
        </div>}
      </div>
      <div className="mx-auto mt-2 grid h-1 max-w-4xl grid-cols-[1fr_1fr_1fr] overflow-hidden rounded-full">
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
      {tab === 'fill' && <FillView matches={matches} picks={picks} setPicks={setPicks} standings={standings} player={player} showStats={settings.show_team_stats} showMatchPicks={settings.show_match_picks} showPickScores={settings.show_pick_scores} />}
      {tab === 'table' && <TableView standings={standings} matches={matches} player={player} />}
      {tab === 'admin' && <AdminView matches={matches} reload={load} />}
      {aliasOpen && <div className="fixed inset-0 z-40 flex items-end bg-pitch/30 p-4">
        <div className="mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
          <h2 className="text-lg font-black">Cambiar nombre</h2>
          <input className="input" value={aliasDraft} onChange={(e) => setAliasDraft(e.target.value)} placeholder="Tu nombre" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setAliasOpen(false)} className="h-12 rounded-lg bg-slate-100 font-black text-slate-600">Cancelar</button>
            <button onClick={saveName} className="h-12 rounded-lg bg-pitch font-black text-white">Guardar</button>
          </div>
        </div>
      </div>}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-4xl grid-cols-3">
          <NavButton active={tab === 'fill'} onClick={() => setTab('fill')} icon={<CircleDot size={22} />} label="Llenar" />
          <NavButton active={tab === 'table'} onClick={() => setTab('table')} icon={<Trophy size={22} />} label="Tabla" />
          <NavButton active={tab === 'admin'} onClick={() => setTab('admin')} icon={<Settings size={22} />} label="Organiza" />
        </div>
      </nav>
    </div>
  );
}

function NavButton(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={props.onClick} className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-black ${props.active ? 'text-slate-950' : 'text-slate-400'}`}>{props.icon}<span>{props.label}</span></button>;
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

function FillView({ matches, picks, setPicks, standings, player, showStats, showMatchPicks, showPickScores }: { matches: Match[]; picks: Record<string, Pick>; setPicks: (p: Record<string, Pick>) => void; standings: Standing[]; player: Player; showStats: boolean; showMatchPicks: boolean; showPickScores: boolean }) {
  const days = Array.from(new Set(matches.map((m) => localDateKey(m.kickoff_utc))));
  const [index, setIndex] = useState(0);
  const dayMatches = matches.filter((m) => localDateKey(m.kickoff_utc) === days[index]);
  const dayIsKnockout = dayMatches.some((match) => isBonusMatch(match));
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedPulse, setSavedPulse] = useState(false);
  const isSaving = Object.values(saving).some(Boolean);
  const missingOpenPicks = dayMatches.filter((match) => !match.locked && !picks[match.id]).length;
  const personal = personalHistory(matches, picks);

  useEffect(() => {
    setIndex(defaultDayIndex(days));
  }, [days.join('|')]);

  async function savePickPatch(match: Match, patch: Partial<Pick>) {
    if (match.locked) return;
    const current = picks[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = normalizeBonusPick(match, { ...current, ...patch });
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

  async function setScore(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = picks[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    await savePickPatch(match, { [side]: Math.max(0, Math.min(99, current[side] + delta)) });
  }

  return (
    <main className="mx-auto max-w-4xl">
      <div className="my-6 flex items-center justify-between">
        <button className="icon-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft /></button>
        <div className="min-w-0 px-3 text-center">
          <h2 className="text-xl font-black capitalize leading-6 text-slate-950 sm:text-3xl">{days[index] ? localWeekday(dayMatches[0].kickoff_utc) : ''}</h2>
          <div className="text-base font-black capitalize leading-5 text-slate-500 sm:text-xl">{days[index] ? localDateLabel(dayMatches[0].kickoff_utc) : ''}</div>
          <p className={`mt-1 inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${dayIsKnockout ? 'border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60' : 'border-transparent text-pitch'}`}>
            {dayIsKnockout && <Trophy size={13} strokeWidth={2.6} className="mr-1.5 text-triondaGold" />}
            {dayIsKnockout ? 'Recta final' : dayRoundLabel(dayMatches[0])} · {dayMatches.length} partidos
          </p>
        </div>
        <button className="icon-btn" disabled={index === days.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight /></button>
      </div>
      <div className="mb-4 grid gap-2 min-[520px]:grid-cols-2">
        <RoundStatusCard label={missingOpenPicks ? 'Picks faltantes' : 'Picks listos'} value={missingOpenPicks ? `Te faltan ${missingOpenPicks}` : 'Todo listo'} tone={missingOpenPicks ? 'warn' : 'ok'} />
        <PersonalHistoryCard history={personal} />
      </div>
      <div className="space-y-4">
        {dayMatches.map((match) => <MatchCard key={match.id} match={match} allMatches={matches} pick={picks[match.id]} setScore={setScore} setPickPatch={savePickPatch} saving={saving[match.id]} standings={standings} player={player} showStats={showStats} showMatchPicks={showMatchPicks} showPickScores={showPickScores} />)}
      </div>
      <div className={`fixed bottom-20 left-1/2 z-20 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-black shadow-sm transition-all ${isSaving ? 'bg-pitch text-white opacity-100' : savedPulse ? 'bg-slate-100 text-pitch opacity-100' : 'pointer-events-none opacity-0'}`}>
        {isSaving ? 'Guardando...' : 'Guardado'}
      </div>
    </main>
  );
}

function RoundStatusCard({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'neutral' }) {
  const color = tone === 'ok' ? 'border-emerald-100 bg-emerald-50/70 text-pitch' : tone === 'warn' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-950';
  return (
    <div className={`rounded-lg border px-3 py-2 shadow-sm shadow-slate-200/50 ${color}`}>
      <span className="block text-[10px] font-black uppercase tracking-[0.12em] opacity-70">{label}</span>
      <b className="mt-1 block text-sm leading-5">{value}</b>
    </div>
  );
}

function PersonalHistoryCard({ history }: { history: ReturnType<typeof personalHistory> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Tu historial reciente</span>
          <b className="mt-1 block text-sm leading-5 text-slate-950">{history.played ? `Últimos ${history.played}` : 'Pendiente de resultados'}</b>
        </div>
        {history.form.length > 0 && <div className="flex shrink-0 gap-1 pt-1" aria-label="Puntos recientes">
          {history.form.map((points, index) => <span key={index} className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black ${points >= 3 ? 'bg-emerald-100 text-pitch' : points === 1 ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-triondaRed'}`}>{points}</span>)}
        </div>}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <MiniMetric label="Exactos" value={String(history.exacts)} tone="pitch" />
        <MiniMetric label="Resultados" value={String(history.results)} tone="slate" />
        <MiniMetric label="Favorito" value={history.favorite || '-'} tone="gold" />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'pitch' | 'slate' | 'gold' }) {
  const color = tone === 'pitch' ? 'text-pitch' : tone === 'gold' ? 'text-triondaGold' : 'text-slate-700';
  return (
    <div className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5 text-center">
      <span className="block truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <b className={`mt-0.5 block truncate text-sm leading-5 ${color}`}>{value}</b>
    </div>
  );
}

function personalHistory(matches: Match[], picks: Record<string, Pick>) {
  const scored = matches
    .filter((match) => match.home_goals !== null && match.away_goals !== null && picks[match.id])
    .sort((a, b) => new Date(b.kickoff_utc).getTime() - new Date(a.kickoff_utc).getTime());
  const recent = scored.slice(0, 5);
  if (!recent.length) return { played: 0, exacts: 0, results: 0, favorite: '', form: [] as number[] };
  const exacts = recent.filter((match) => {
    const pick = picks[match.id];
    return pick.home_goals === match.home_goals && pick.away_goals === match.away_goals;
  }).length;
  const results = recent.filter((match) => {
    const points = pickPoints(picks[match.id], match);
    return points !== null && points > 0;
  }).length;
  const scoreCounts = new Map<string, number>();
  Object.values(picks).forEach((pick) => {
    const key = `${pick.home_goals}-${pick.away_goals}`;
    scoreCounts.set(key, (scoreCounts.get(key) || 0) + 1);
  });
  const favorite = Array.from(scoreCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0].replace('-', '-');
  return {
    played: recent.length,
    exacts,
    results,
    favorite: favorite || '',
    form: recent.map((match) => pickPoints(picks[match.id], match) ?? 0)
  };
}

function MatchCard({ match, allMatches = [], pick, setScore, setPickPatch, forceOpen = false, saving = false, standings = [], player, showStats = false, showMatchPicks = false, showPickScores = false }: { match: Match; allMatches?: Match[]; pick?: Pick; setScore: (m: Match, s: 'home_goals' | 'away_goals', d: number) => void; setPickPatch?: (m: Match, patch: Partial<Pick>) => void; forceOpen?: boolean; saving?: boolean; standings?: Standing[]; player?: Player; showStats?: boolean; showMatchPicks?: boolean; showPickScores?: boolean }) {
  const locked = Boolean(match.locked) && !forceOpen;
  const points = pickPoints(pick, match);
  const knockout = isBonusMatch(match);
  return (
    <article className={`overflow-hidden rounded-lg bg-white border shadow-md ${knockout ? 'border-slate-300 shadow-slate-200/80' : 'border-slate-200 shadow-slate-200/60'}`}>
      {knockout && <div className="h-1 bg-slate-200" />}
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${knockout ? 'border-slate-100 bg-white' : 'border-slate-100'}`}>
        <div className={`min-w-0 text-xs font-black uppercase tracking-[0.16em] ${knockout ? 'text-slate-600' : 'text-slate-500'}`}>
          <div className="flex min-w-0 items-center gap-2">
            {knockout && <Trophy size={15} strokeWidth={2.6} className="shrink-0 text-triondaGold" />}
            <span className="truncate">{matchRoundLabel(match)}</span>
          </div>
          <div className="mt-0.5 text-[10px] tracking-[0.12em] text-slate-400">{localDay(match.kickoff_utc)} · {localTime(match.kickoff_utc)}</div>
        </div>
        {saving ? <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-pitch">Guardando</span> : locked ? <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-black text-triondaRed"><Lock size={14} /> Cerrado</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        <TeamScore name={match.home_name} flag={match.home_flag} value={pick?.home_goals} locked={locked} knockout={knockout} onMinus={() => setScore(match, 'home_goals', -1)} onPlus={() => setScore(match, 'home_goals', 1)} />
        <TeamScore name={match.away_name} flag={match.away_flag} value={pick?.away_goals} locked={locked} knockout={knockout} onMinus={() => setScore(match, 'away_goals', -1)} onPlus={() => setScore(match, 'away_goals', 1)} />
      </div>
      {isBonusMatch(match) && pick && setPickPatch && <KnockoutPickControls match={match} pick={pick} locked={locked} onChange={(patch) => setPickPatch(match, patch)} />}
      {showPickScores && points !== null && pick && <RealResultSummary match={match} pick={pick} />}
      {showMatchPicks && <PlayerPlayPanel match={match} standings={standings} player={player} />}
      {showMatchPicks && <MatchPicksPanel match={match} />}
      {showStats && <StatsPanel match={match} allMatches={allMatches} />}
    </article>
  );
}

function RealResultSummary({ match, pick }: { match: Match; pick: Pick }) {
  const hasScore = match.home_goals !== null && match.away_goals !== null;
  const firstGoal = effectiveFirstGoal(match.home_goals, match.away_goals, match.first_goal);
  const resultPoints = hasScore
    ? pick.home_goals === match.home_goals && pick.away_goals === match.away_goals
      ? 3
      : outcome(pick.home_goals, pick.away_goals) === outcome(match.home_goals!, match.away_goals!)
        ? 1
        : 0
    : 0;
  const advancePoints = isBonusMatch(match) && isDrawScore(match.home_goals, match.away_goals) && isDrawScore(pick.home_goals, pick.away_goals) && pick.advance_pick && match.advance && pick.advance_pick === match.advance ? 1 : 0;
  const pickFirstGoal = isBonusMatch(match) ? effectiveFirstGoal(pick.home_goals, pick.away_goals, pick.first_goal_pick) : null;
  const firstGoalPoints = isBonusMatch(match) && pickFirstGoal && firstGoal && pickFirstGoal === firstGoal ? 1 : 0;
  const total = resultPoints + advancePoints + firstGoalPoints;
  const showAdvance = isBonusMatch(match) && isDrawScore(match.home_goals, match.away_goals);
  return (
    <div className="mx-4 mb-4 rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600">
      <div className="mb-2 text-center text-sm font-black text-slate-950">
        Obtuviste: <span className="text-pitch">{total} {total === 1 ? 'punto' : 'puntos'}</span>
      </div>
      <div className="space-y-1.5">
        <ScoreBreakdownRow
          label="Resultado real"
          value={<FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={match.home_goals ?? '-'} awayGoals={match.away_goals ?? '-'} size="md" />}
          points={resultPoints}
        />
        {hasScore && showAdvance && <ScoreBreakdownRow
          label={advanceResultLabel(match)}
          value={<RealBonusValue value={match.advance} match={match} fallback="Pendiente" />}
          points={advancePoints}
        />}
        {hasScore && isBonusMatch(match) && <ScoreBreakdownRow
          label="Primer gol"
          value={<RealBonusValue value={firstGoal} match={match} fallback="Pendiente" />}
          points={firstGoalPoints}
        />}
      </div>
    </div>
  );
}

function ScoreBreakdownRow({ label, value, points }: { label: string; value: React.ReactNode; points: number }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)_46px] items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-sm shadow-slate-200/50">
      <span className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <div className="min-w-0">{value}</div>
      <span className={`text-right text-sm font-black ${points > 0 ? 'text-pitch' : 'text-slate-400'}`}>+{points}</span>
    </div>
  );
}

function RealBonusValue({ value, match, fallback }: { value: FirstGoalPick | BonusSide | null; match: Match; fallback: string }) {
  const team = value === 'H' ? { name: match.home_name, flag: match.home_flag } : value === 'A' ? { name: match.away_name, flag: match.away_flag } : null;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 text-xs font-black text-slate-600">
      {team ? <>
        <img src={flagUrl(team.flag)} alt="" className="h-3.5 w-5 rounded-sm object-cover shadow-sm" />
        <span className="truncate text-slate-950">{team.name}</span>
      </> : <span className="text-slate-950">{value === 'N' ? 'Sin gol' : fallback}</span>}
    </span>
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
    <div className="border-t border-slate-100 px-4 pb-4">
      <button onClick={toggle} className="mt-1 w-full rounded-lg bg-slate-50 px-3 py-2 text-left text-sm font-black text-slate-600">
        Picks familiares
      </button>
      {open && <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        {picks.length === 0 && <div className="p-3 text-center text-sm font-bold text-slate-400">Todavía no hay picks.</div>}
        {picks.length > 0 && <FamilyTrendSummary match={match} picks={picks} />}
        {picks.length > 0 && <div className="border-t border-slate-100">
          <div className="bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Lista familiar</div>
          {picks.map((row) => <div key={row.player_id} className="grid grid-cols-[minmax(0,1fr)_118px_50px] items-center gap-2 border-t border-slate-100 px-3 py-2 first:border-t-0">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <b className="truncate text-sm">{row.alias}</b>
                <RankMovement delta={row.rank_delta || 0} />
              </div>
              <PickBadges pick={row} picks={picks} match={match} />
            </div>
            <div className="justify-self-end">
              <div className="flex flex-col items-end gap-1">
                <FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={row.home_goals} awayGoals={row.away_goals} size="xs" firstGoal={isBonusMatch(match) ? effectiveFirstGoal(row.home_goals, row.away_goals, row.first_goal_pick) : null} advance={isBonusMatch(match) && isDrawScore(row.home_goals, row.away_goals) ? row.advance_pick || null : null} />
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-center text-xs font-black text-pitch">{row.points}</span>
          </div>)}
        </div>}
      </div>}
    </div>
  );
}

function PlayerPlayPanel({ match, standings, player }: { match: Match; standings: Standing[]; player?: Player }) {
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

  const drama = picks.length ? familyDrama(match, picks, standings, player) : null;
  return (
    <div className="border-t border-slate-100 px-4 pb-4">
      <button onClick={toggle} className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-black text-pitch">
        Tu jugada
      </button>
      {open && <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
        {!drama && <div className="text-center text-sm font-bold text-slate-400">Todavía no hay datos familiares para este partido.</div>}
        {drama && <PlayerPlaySummary drama={drama} match={match} />}
      </div>}
    </div>
  );
}

function PlayerPlaySummary({ drama, match }: { drama: ReturnType<typeof familyDrama>; match: Match }) {
  const items = [
    drama.attack && { label: 'Ataque', text: drama.attack, tone: 'pitch' },
    drama.defense && { label: 'Defensa', text: drama.defense, tone: 'red' },
    drama.topThree && { label: 'Top 3', text: drama.topThree, tone: 'gold' }
  ].filter(Boolean) as Array<{ label: string; text: string | PlayMessage; tone: string }>;
  return (
    <div className="grid gap-2 min-[520px]:grid-cols-2">
      {items.map((item) => <PlayChip key={`${item.label}-${messageText(item.text)}`} {...item} match={match} />)}
    </div>
  );
}

function PlayChip({ label, text, tone, match }: { label: string; text: string | PlayMessage; tone: string; match: Match }) {
  const toneClass = tone === 'pitch'
    ? 'border-l-pitch bg-emerald-50/45'
    : tone === 'red'
      ? 'border-l-triondaRed bg-red-50/45'
      : tone === 'gold'
        ? 'border-l-triondaGold bg-amber-50/55'
        : 'border-l-slate-300 bg-slate-50';
  const labelClass = tone === 'pitch'
    ? 'bg-white text-pitch'
    : tone === 'red'
      ? 'bg-white text-triondaRed'
      : tone === 'gold'
        ? 'bg-white text-amber-700'
        : 'bg-white text-slate-500';
  const message = typeof text === 'string' ? { text } : text;
  return (
    <div className={`min-w-0 rounded-md border border-slate-200 border-l-4 px-2.5 py-2 shadow-sm shadow-slate-200/50 ${toneClass}`}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${labelClass}`}>{label}</span>
        {message.pick && !message.picks?.length && <PickScoreBadge match={match} pick={message.pick} />}
      </div>
      <div className="min-w-0">
        <b className="mt-0.5 block text-sm leading-5 text-slate-950">{message.text}</b>
        {message.pick && !message.picks?.length && message.pickLabel && <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{message.pickLabel}</span>}
        {message.picks?.length ? <div className="mt-2 flex flex-wrap gap-1.5">
          {message.picks.map((item) => <PickPreview key={`${item.label}-${item.rank || ''}-${item.pick ? `${item.pick.home_goals}-${item.pick.away_goals}` : 'pending'}`} match={match} item={item} />)}
        </div> : null}
      </div>
    </div>
  );
}

function messageText(message: string | PlayMessage) {
  return typeof message === 'string' ? message : message.text;
}

function PickScoreBadge({ match, pick }: { match: Match; pick: MatchPick }) {
  return <FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={pick.home_goals} awayGoals={pick.away_goals} size="xs" firstGoal={isBonusMatch(match) ? effectiveFirstGoal(pick.home_goals, pick.away_goals, pick.first_goal_pick) : null} advance={isBonusMatch(match) && isDrawScore(pick.home_goals, pick.away_goals) ? pick.advance_pick || null : null} />;
}

function PickPreview({ match, item }: { match: Match; item: PlayPickPreview }) {
  const rankClass = item.rank === 1 ? 'bg-triondaGold text-slate-950' : item.rank === 2 ? 'bg-slate-200 text-slate-700' : item.rank === 3 ? 'bg-[#E8C1A0] text-slate-800' : '';
  return (
    <div className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 shadow-sm shadow-slate-200/60 ${item.isSelf ? 'bg-emerald-50 ring-1 ring-pitch/30' : 'bg-white'}`}>
      {item.rank && <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${rankClass}`}>#{item.rank}</span>}
      <span className={`max-w-[132px] truncate text-[10px] font-black uppercase tracking-[0.08em] ${item.isSelf ? 'text-pitch' : 'text-slate-400'}`}>{item.label}</span>
      {item.pick && <FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={item.pick.home_goals} awayGoals={item.pick.away_goals} size="xs" firstGoal={isBonusMatch(match) ? effectiveFirstGoal(item.pick.home_goals, item.pick.away_goals, item.pick.first_goal_pick) : null} advance={isBonusMatch(match) && isDrawScore(item.pick.home_goals, item.pick.away_goals) ? item.pick.advance_pick || null : null} />}
      {item.meta && <span className="text-[10px] font-black text-slate-400">{item.meta}</span>}
    </div>
  );
}

function FlagScore({ homeFlag, awayFlag, homeGoals, awayGoals, size = 'sm', firstGoal = null, advance = null }: { homeFlag: string; awayFlag: string; homeGoals: number | string; awayGoals: number | string; size?: 'xs' | 'sm' | 'md'; firstGoal?: FirstGoalPick | null; advance?: BonusSide | null }) {
  const flagSize = size === 'md' ? 'h-4 w-6' : size === 'xs' ? 'h-3 w-4' : 'h-3.5 w-5';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'md' ? 'text-[11px] leading-3' : 'text-[9px] leading-3';
  const hasIndicators = firstGoal === 'H' || firstGoal === 'A' || advance === 'H' || advance === 'A';
  const scoreCol = size === 'md' ? '1rem' : '0.9rem';
  const dashCol = size === 'md' ? '0.5rem' : '0.45rem';
  const gridTemplateColumns = `auto ${scoreCol} ${dashCol} ${scoreCol} auto`;
  const flag = (flagCode: string) => <img src={flagUrl(flagCode)} alt="" className={`${flagSize} rounded-sm object-cover shadow-sm`} />;
  const indicator = (side: 'H' | 'A', target: 'flag' | 'score') => {
    if (target === 'flag' && advance === side) return <span className={`inline-flex items-center justify-center rounded-full bg-emerald-500 font-black text-white shadow-sm ${size === 'md' ? 'h-3.5 w-3.5 text-[9px]' : 'h-3 w-3 text-[8px]'}`}>✓</span>;
    if (target === 'score' && firstGoal === side) return <span className={`${iconSize}`}>⚽</span>;
    return <span className={`${iconSize}`}>&nbsp;</span>;
  };
  return (
    <div className={`inline-flex max-w-full flex-col rounded-full bg-white px-2 py-1 font-black text-slate-950 shadow-sm shadow-slate-200/60 ${textSize}`}>
      {hasIndicators && <div className="grid items-end gap-1.5 text-center" style={{ gridTemplateColumns }}>
        <span className="flex justify-center">{indicator('H', 'flag')}</span>
        <span className="flex justify-center">{indicator('H', 'score')}</span>
        <span />
        <span className="flex justify-center">{indicator('A', 'score')}</span>
        <span className="flex justify-center">{indicator('A', 'flag')}</span>
      </div>}
      <div className="grid items-center gap-1.5 text-center" style={{ gridTemplateColumns }}>
        <span className="flex justify-center">{flag(homeFlag)}</span>
        <span className="flex justify-center">{homeGoals}</span>
        <span className="text-slate-300">-</span>
        <span className="flex justify-center">{awayGoals}</span>
        <span className="flex justify-center">{flag(awayFlag)}</span>
      </div>
    </div>
  );
}

function FamilyTrendSummary({ match, picks }: { match: Match; picks: MatchPick[] }) {
  const trend = familyTrend(match, picks);
  return (
    <div className="bg-slate-50 p-3">
      <div className={`mb-2 text-[10px] font-black uppercase tracking-[0.12em] ${isBonusMatch(match) ? 'text-slate-500' : 'text-slate-400'}`}>{isBonusMatch(match) ? 'Lectura de eliminatoria' : 'Tendencia familiar'}</div>
      <div className="grid grid-cols-3 gap-2">
        <TrendPill label={match.home_name} value={trend.homePercent} active={trend.leader === 'home'} />
        <TrendPill label="Empate" value={trend.drawPercent} active={trend.leader === 'draw'} />
        <TrendPill label={match.away_name} value={trend.awayPercent} active={trend.leader === 'away'} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
        <div className="rounded-md bg-white px-2.5 py-2">
          <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Pick de la familia</span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={trend.commonHomeGoals} awayGoals={trend.commonAwayGoals} />
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{trend.commonCount}</span>
          </div>
        </div>
        <div className="rounded-md bg-white px-2.5 py-2">
          <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Promedio esperado</span>
          <div className="mt-1"><FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={trend.avgHomeGoals} awayGoals={trend.avgAwayGoals} /></div>
        </div>
        <div className="col-span-2 rounded-md bg-white px-2.5 py-2">
          <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Lectura familiar</span>
          <b className="mt-1 block text-sm text-slate-950">{trend.reading}</b>
        </div>
      </div>
    </div>
  );
}

function TrendPill({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`min-w-0 rounded-md px-2 py-2 text-center ${active ? 'bg-white shadow-sm shadow-slate-200/70' : 'bg-white/60'}`}>
      <b className={`block text-lg leading-5 ${active ? 'text-pitch' : 'text-slate-500'}`}>{value}%</b>
      <span className="mt-1 block truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
    </div>
  );
}

function familyTrend(match: Match, picks: MatchPick[]) {
  const total = Math.max(1, picks.length);
  const homeCount = picks.filter((pick) => outcome(pick.home_goals, pick.away_goals) === 'H').length;
  const drawCount = picks.filter((pick) => outcome(pick.home_goals, pick.away_goals) === 'D').length;
  const awayCount = picks.filter((pick) => outcome(pick.home_goals, pick.away_goals) === 'A').length;
  const counts = [
    { key: 'home' as const, count: homeCount, name: match.home_name },
    { key: 'draw' as const, count: drawCount, name: 'Empate' },
    { key: 'away' as const, count: awayCount, name: match.away_name }
  ].sort((a, b) => b.count - a.count);
  const scoreCounts = new Map<string, number>();
  picks.forEach((pick) => {
    const key = `${pick.home_goals}-${pick.away_goals}`;
    scoreCounts.set(key, (scoreCounts.get(key) || 0) + 1);
  });
  const common = Array.from(scoreCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const [commonHomeGoals = '-', commonAwayGoals = '-'] = common ? common[0].split('-') : [];
  const avgHome = picks.reduce((sum, pick) => sum + pick.home_goals, 0) / total;
  const avgAway = picks.reduce((sum, pick) => sum + pick.away_goals, 0) / total;
  const leaderPercent = Math.round((counts[0].count / total) * 100);
  const secondPercent = Math.round((counts[1].count / total) * 100);
  const reading = leaderPercent >= 65 ? `Mayoría con ${counts[0].name}` : Math.abs(leaderPercent - secondPercent) <= 12 ? 'Partido dividido' : `Ligera ventaja ${counts[0].name}`;

  return {
    homePercent: Math.round((homeCount / total) * 100),
    drawPercent: Math.round((drawCount / total) * 100),
    awayPercent: Math.round((awayCount / total) * 100),
    leader: counts[0].key,
    leaderPercent,
    commonHomeGoals,
    commonAwayGoals,
    commonCount: common ? `${common[1]} picks` : 'Sin picks',
    avgHomeGoals: avgHome.toFixed(1),
    avgAwayGoals: avgAway.toFixed(1),
    reading
  };
}

function familyDrama(match: Match, picks: MatchPick[], standings: Standing[], player?: Player) {
  const currentPick = player ? picks.find((pick) => pick.player_id === player.id) : undefined;
  const hasResult = match.home_goals !== null && match.away_goals !== null;
  const contextualStandings = contextualStandingsForMatch(picks, standings, hasResult);
  const currentStanding = player ? contextualStandings.find((row) => row.player_id === player.id) : undefined;
  const maxPoints = maxPointsForMatch(match);
  const attack = currentStanding && currentPick ? attackLabel(currentStanding, currentPick, picks, contextualStandings, hasResult, maxPoints) : '';
  const defense = currentStanding && currentPick ? defenseLabel(currentStanding, currentPick, picks, contextualStandings, hasResult, maxPoints) : '';
  const topThree = currentStanding && currentPick ? topThreeLabel(currentStanding, currentPick, picks, contextualStandings, hasResult) : '';
  return { attack, defense, topThree };
}

function maxPointsForMatch(_match: Match) {
  return isBonusMatch(_match) ? 5 : 3;
}

function isBonusMatch(match?: Match) {
  return Boolean(match && ((match.grp === 'Q' && match.jornada >= 6) || (match.grp === 'T' && match.jornada === 8)));
}

function contextualStandingsForMatch(picks: MatchPick[], standings: Standing[], hasResult: boolean): Standing[] {
  if (!hasResult || !picks.some((pick) => pick.rank_before !== null && pick.rank_before !== undefined)) return standings;
  return picks
    .filter((pick) => pick.rank_before !== null && pick.rank_before !== undefined)
    .map((pick) => ({
      player_id: pick.player_id,
      alias: pick.alias,
      rank: Number(pick.rank_before),
      rank_delta: pick.rank_delta || 0,
      points: Number(pick.points_before || 0),
      exacts: 0,
      results: 0
    }))
    .sort((a, b) => Number(a.rank) - Number(b.rank) || Number(b.points) - Number(a.points) || a.alias.localeCompare(b.alias));
}

function attackLabel(current: Standing, currentPick: MatchPick, picks: MatchPick[], standings: Standing[], hasResult: boolean, maxPoints: number): PlayMessage | '' {
  const currentPoints = Number(current.points);
  const currentRank = Number(current.rank);
  const currentMax = currentPoints + maxPoints;
  const passable = standings
    .filter((row) => row.player_id !== current.player_id)
    .filter((row) => Number(row.rank) <= currentRank && currentMax > Number(row.points))
    .sort((a, b) => Number(b.rank) - Number(a.rank) || Number(a.points) - Number(b.points));
  const rivals = passable
    .map((row) => ({ row, pick: picks.find((pick) => pick.player_id === row.player_id) }))
    .filter((item): item is { row: Standing; pick: MatchPick } => Boolean(item.pick));
  const differentRivals = rivals.filter(({ pick }) => !samePick(currentPick, pick));
  const sameRivals = rivals.filter(({ pick }) => samePick(currentPick, pick));
  const previews = [{ label: 'Tu pick', pick: currentPick, isSelf: true, meta: pointsMeta(currentPick, hasResult) }, ...rivals.map(({ row, pick }) => ({ label: row.alias, pick, meta: pointsMeta(pick, hasResult) }))];
  if (differentRivals.length) {
    const possibleRank = standings.filter((row) => row.player_id !== current.player_id && Number(row.points) >= currentMax).length + 1;
    const sameText = sameRivals.length ? ` ${nameList(sameRivals.map(({ row }) => row.alias))} ${sameRivals.length === 1 ? 'trae' : 'traen'} tu mismo pick, ahí no rompes empate.` : '';
    if (hasResult) {
      const passed = differentRivals.filter(({ row }) => afterRank(currentPick) !== null && afterRank(rowPick(picks, row.player_id)) !== null && Number(afterRank(currentPick)) < Number(afterRank(rowPick(picks, row.player_id))));
      const rivalNames = differentRivals.map(({ row }) => row.alias);
      const assumption = `Supuesto: haciendo +${maxPoints} y que ${nameList(rivalNames)} ${sumLessVerb(rivalNames)} que tú, podías subir hacia #${possibleRank}.${sameText}`;
      return {
        text: passed.length
          ? `${assumption} Se logró: con este partido pasaste a ${nameList(passed.map(({ row }) => row.alias))}.`
          : `${assumption} No se dio: no sumaste lo suficiente para pasar a ${nameList(differentRivals.map(({ row }) => row.alias))}.`,
        picks: previews
      };
    }
    const rivalNames = differentRivals.map(({ row }) => row.alias);
    return {
      text: `Supuesto: haciendo +${maxPoints} y que ${nameList(rivalNames)} ${sumLessVerb(rivalNames)} que tú, puedes subir hasta #${possibleRank}.${sameText}`,
      picks: previews
    };
  }
  if (sameRivals.length) {
    return {
      text: hasResult
        ? `Traías el mismo pick que ${nameList(sameRivals.map(({ row }) => row.alias))}; este partido no cambiaba esa distancia entre ustedes.`
        : `Traes el mismo pick que ${nameList(sameRivals.map(({ row }) => row.alias))}; este partido no te sirve para pasarlos.`,
      picks: [{ label: 'Tu pick', pick: currentPick, isSelf: true, meta: pointsMeta(currentPick, hasResult) }, ...sameRivals.map(({ row, pick }) => ({ label: row.alias, pick, meta: pointsMeta(pick, hasResult) }))]
    };
  }
  const nextAbove = standings
    .filter((row) => row.player_id !== current.player_id && Number(row.rank) <= currentRank)
    .sort((a, b) => Number(b.rank) - Number(a.rank) || Number(a.points) - Number(b.points))[0];
  const nextPick = nextAbove ? picks.find((pick) => pick.player_id === nextAbove.player_id) : undefined;
  if (!nextAbove || !nextPick) return '';
  return {
    text: hasResult
      ? `Supuesto: si sumabas más que ${nextAbove.alias}, podías acercarte. Resultado: revisa los puntos de este partido para ver si recortaste distancia.`
      : samePick(currentPick, nextPick)
        ? `Traes el mismo pick que ${nextAbove.alias}; este partido mantiene la distancia si ambos suman igual.`
        : `Si aciertas y ${nextAbove.alias} no, te acercas en la tabla.`,
    picks: [{ label: 'Tu pick', pick: currentPick, isSelf: true, meta: pointsMeta(currentPick, hasResult) }, { label: nextAbove.alias, pick: nextPick, meta: pointsMeta(nextPick, hasResult) }]
  };
}

function samePick(a: Pick | MatchPick, b: Pick | MatchPick) {
  return a.home_goals === b.home_goals && a.away_goals === b.away_goals;
}

function defenseLabel(current: Standing, currentPick: MatchPick, picks: MatchPick[], standings: Standing[], hasResult: boolean, maxPoints: number): PlayMessage | '' {
  const currentPoints = Number(current.points);
  const currentRank = Number(current.rank);
  const threats = standings
    .filter((row) => row.player_id !== current.player_id)
    .filter((row) => Number(row.rank) >= currentRank && Number(row.points) + maxPoints > currentPoints)
    .sort((a, b) => Number(a.rank) - Number(b.rank) || Number(b.points) - Number(a.points));
  const rivals = threats
    .map((row) => ({ row, pick: picks.find((pick) => pick.player_id === row.player_id) }))
    .filter((item): item is { row: Standing; pick: MatchPick } => Boolean(item.pick));
  if (!rivals.length) return '';
  const different = rivals.filter(({ pick }) => !samePick(currentPick, pick));
  const focus = different.length ? different : rivals;
  const previews = [{ label: 'Tu pick', pick: currentPick, isSelf: true, meta: pointsMeta(currentPick, hasResult) }, ...focus.map(({ row, pick }) => ({ label: row.alias, pick, meta: pointsMeta(pick, hasResult) }))];
  if (hasResult) {
    const currentAfterRank = afterRank(currentPick);
    const movedAhead = different.filter(({ pick }) => currentAfterRank !== null && afterRank(pick) !== null && Number(afterRank(pick)) < Number(currentAfterRank));
    const reached = different.filter(({ pick }) => currentAfterRank !== null && afterRank(pick) !== null && Number(afterRank(pick)) === Number(currentAfterRank));
    const differentNames = different.map(({ row }) => row.alias);
    const assumption = different.length
      ? `Supuesto: si fallabas y ${nameList(differentNames)} ${maxPointsVerb(differentNames, maxPoints)}, te podía pasar o alcanzar.`
      : `Supuesto: traían tu mismo pick, así que no podían recortarte si todos sumaban igual.`;
    return {
      text: movedAhead.length
        ? `${assumption} Sí pegó la amenaza: ${nameList(movedAhead.map(({ row }) => row.alias))} te pasó con este partido.`
        : reached.length
          ? `${assumption} Te alcanzaron: ${nameList(reached.map(({ row }) => row.alias))} quedó contigo tras este partido.`
          : different.length
            ? `${assumption} Defensa cumplida: ${nameList(different.map(({ row }) => row.alias))} no te pasó en este partido.`
            : `${assumption} Nadie te recortó distancia con este partido.`,
      picks: previews
    };
  }
  return {
    text: different.length
      ? `Supuesto: si fallas y ${nameList(focus.map(({ row }) => row.alias))} ${maxPointsVerb(focus.map(({ row }) => row.alias), maxPoints)}, te puede pasar o alcanzar.`
      : `Traen tu mismo camino: ${nameList(focus.map(({ row }) => row.alias))} no te recorta si todos suman igual.`,
    picks: previews
  };
}

function topThreeLabel(current: Standing, currentPick: MatchPick, picks: MatchPick[], standings: Standing[], hasResult: boolean): PlayMessage | '' {
  const topRows = standings.slice(0, 3);
  if (!topRows.length) return '';
  const topPicks = topRows.map((row) => ({ row, pick: picks.find((pick) => pick.player_id === row.player_id) }));
  const currentInTop = topRows.some((row) => row.player_id === current.player_id);
  const filledTopPicks = topPicks.filter((item): item is { row: Standing; pick: MatchPick } => Boolean(item.pick));
  const sameTop = filledTopPicks.filter(({ row, pick }) => row.player_id !== current.player_id && samePick(currentPick, pick));
  const differentOutcomes = new Set(filledTopPicks.map(({ pick }) => pickOutcomeKey(pick))).size > 1;
  const text = currentInTop
    ? filledTopPicks.length < 2
      ? `${hasResult ? 'Antes del partido estabas' : 'Estás'} en el Top 3; faltan picks para comparar caminos.`
      : differentOutcomes
        ? `${hasResult ? 'Antes del partido estabas' : 'Estás'} en el Top 3; tu pick va marcado para ver quién se separa.`
        : `El Top 3 ${hasResult ? 'de ese momento iba' : 'va'} alineado; tu pick va marcado.`
    : sameTop.length
      ? hasResult
        ? `Traías el mismo camino que ${nameList(sameTop.map(({ row }) => row.alias))}; este era el Top 3 de ese momento.`
        : `Traes el mismo camino que ${nameList(sameTop.map(({ row }) => row.alias))}; mira cómo viene el Top 3.`
      : filledTopPicks.length
        ? `${hasResult ? 'Ibas' : 'Vas'} contra el Top 3; estos son sus caminos.`
        : `Top 3 ${hasResult ? 'de ese momento' : 'actual'}: todavía no hay picks de los punteros para este partido.`;
  const previews: PlayPickPreview[] = topPicks.map(({ row, pick }) => ({
    label: row.player_id === current.player_id ? 'Tu pick' : row.alias,
    pick,
    isSelf: row.player_id === current.player_id,
    meta: pick ? pointsMeta(pick, hasResult) : 'Pendiente',
    rank: Number(row.rank)
  }));
  if (!currentInTop) previews.push({ label: `Tu pick #${current.rank}`, pick: currentPick, isSelf: true, meta: pointsMeta(currentPick, hasResult) });
  return { text, picks: previews };
}

function rowPick(picks: MatchPick[], playerId: string) {
  return picks.find((pick) => pick.player_id === playerId);
}

function afterRank(pick?: MatchPick) {
  return pick?.rank ?? null;
}

function pointsMeta(pick: MatchPick | Pick, hasResult: boolean) {
  return hasResult && 'points' in pick ? `+${pick.points}` : undefined;
}

function nameList(names: string[]) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

function sumLessVerb(names: string[]) {
  return names.length === 1 ? 'sume menos' : 'sumen menos';
}

function maxPointsVerb(names: string[], maxPoints: number) {
  return names.length === 1 ? `hace +${maxPoints}` : `hacen +${maxPoints}`;
}

function pickOutcomeKey(pick: Pick | MatchPick) {
  const result = outcome(pick.home_goals, pick.away_goals);
  if (result === 'H') return 'home';
  if (result === 'A') return 'away';
  return 'draw';
}

function PickBadges({ pick, picks, match }: { pick: MatchPick; picks: MatchPick[]; match: Match }) {
  const trend = familyTrend(match, picks);
  const unique = isUniquePick(pick, picks);
  const brave = trend.leaderPercent >= 50 && pickOutcomeKey(pick) !== trend.leader;
  if (!unique && !brave) return null;
  return (
    <div className="mt-0.5 flex flex-wrap gap-1">
      {unique && <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">Único</span>}
      {brave && <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">Valiente</span>}
    </div>
  );
}

function isUniquePick(pick: MatchPick, picks: MatchPick[]) {
  return picks.filter((row) => row.home_goals === pick.home_goals && row.away_goals === pick.away_goals).length === 1;
}

function StatsPanel({ match, allMatches }: { match: Match; allMatches: Match[] }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const homeRecent = recentTeamResults(match.home_code, match, allMatches);
  const awayRecent = recentTeamResults(match.away_code, match, allMatches);
  const hasRecentResults = homeRecent.length > 0 || awayRecent.length > 0;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !stats) {
      const data = await api.request<MatchStats>(`/api/matches/${match.id}/stats`);
      setStats(data);
    }
  }

  return (
    <div className="border-t border-slate-100 px-4 pb-4">
      <button onClick={toggle} className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-left text-sm font-black text-pitch">
        Datos para decidir
      </button>
      {open && <div className="mt-3">
        {hasRecentResults && <RecentResultsComparison match={match} homeResults={homeRecent} awayResults={awayRecent} />}
        {!stats || (!stats.home && !stats.away && !stats.head_to_head) ? <p className={`text-sm leading-6 text-slate-500 ${hasRecentResults ? 'mt-3' : ''}`}>Datos oficiales validados pendientes de cargar.</p> : <>
          <StatsComparison match={match} home={stats.home} away={stats.away} />
          {stats.head_to_head && <HeadToHeadSummary match={match} headToHead={stats.head_to_head} />}
        </>}
      </div>}
    </div>
  );
}

function HeadToHeadSummary({ match, headToHead }: { match: Match; headToHead: NonNullable<MatchStats['head_to_head']> }) {
  const parsedScore = parseScoreString(headToHead.last_match_score);
  return (
    <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3 text-sm">
      <b>Último enfrentamiento</b>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-600">
        <span>{headToHead.last_match_date || 'Fecha pendiente'}</span>
        {parsedScore ? <FlagScore homeFlag={match.home_flag} awayFlag={match.away_flag} homeGoals={parsedScore.home} awayGoals={parsedScore.away} /> : <span>{headToHead.last_match_score || 'Marcador pendiente'}</span>}
      </div>
      {headToHead.competition && <div className="mt-1 text-xs font-bold text-slate-400">{headToHead.competition}</div>}
    </div>
  );
}

function parseScoreString(score: string | null) {
  const match = score?.match(/(\d+)\s*[-–]\s*(\d+)/);
  return match ? { home: match[1], away: match[2] } : null;
}

function recentTeamResults(teamCode: string, currentMatch: Match, matches: Match[]) {
  const currentKickoff = new Date(currentMatch.kickoff_utc).getTime();
  return matches
    .filter((match) => match.id !== currentMatch.id)
    .filter((match) => match.home_goals !== null && match.away_goals !== null)
    .filter((match) => new Date(match.kickoff_utc).getTime() < currentKickoff)
    .filter((match) => match.home_code === teamCode || match.away_code === teamCode)
    .sort((a, b) => new Date(b.kickoff_utc).getTime() - new Date(a.kickoff_utc).getTime());
}

function RecentResultsComparison({ match, homeResults, awayResults }: { match: Match; homeResults: Match[]; awayResults: Match[] }) {
  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-slate-100 bg-white">
      <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50">
        <RecentTeamResults teamCode={match.home_code} teamName={match.home_name} teamFlag={match.home_flag} results={homeResults} />
        <RecentTeamResults teamCode={match.away_code} teamName={match.away_name} teamFlag={match.away_flag} results={awayResults} />
      </div>
    </div>
  );
}

function RecentTeamResults({ teamCode, teamName, teamFlag, results }: { teamCode: string; teamName: string; teamFlag: string; results: Match[] }) {
  const summary = teamTournamentSummary(teamCode, results);
  return (
    <section className="min-w-0 p-3">
      <div className="flex items-center gap-2">
        <img src={flagUrl(teamFlag)} alt="" className="h-5 w-7 rounded-sm object-cover shadow-sm" />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-slate-950">{teamName}</h3>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Últimos resultados</p>
        </div>
      </div>
      <TeamTournamentSummary summary={summary} />
      <div className="mt-3 space-y-2">
        {results.length === 0 && <div className="rounded-md bg-white px-2.5 py-2 text-xs font-bold leading-5 text-slate-400">Sin resultados registrados</div>}
        {results.map((result) => <RecentResultRow key={result.id} teamCode={teamCode} result={result} />)}
      </div>
    </section>
  );
}

function TeamTournamentSummary({ summary }: { summary: TeamTournamentSummaryData }) {
  const recentFirst = [...summary.form].reverse();
  return (
    <div className="mt-3 rounded-md border border-slate-100 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/50">
      <div>
        <div className="flex flex-wrap gap-1.5" aria-label="Forma del equipo, más reciente primero">
          {recentFirst.length ? recentFirst.map((result, index) => <ResultBadge key={index} result={result} />) : <span className="text-xs font-bold text-slate-400">Sin forma</span>}
        </div>
        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Más reciente primero</div>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-1.5 min-[430px]:grid-cols-3">
        <StatChip label="Récord" value={`${summary.wins}G ${summary.draws}E ${summary.losses}P`} />
        <StatChip label="GF/GC" value={`${summary.goalsFor}/${summary.goalsAgainst}`} />
        <StatChip label="Prom." value={`${summary.avgFor} / ${summary.avgAgainst}`} />
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0 rounded-md bg-slate-50 px-2 py-1.5">
      <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</span>
      <b className="mt-0.5 block truncate text-[12px] leading-4 text-slate-950">{value}</b>
    </span>
  );
}

function ResultBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const label = result === 'W' ? 'G' : result === 'D' ? 'E' : 'P';
  const className = result === 'W'
    ? 'bg-emerald-100 text-pitch'
    : result === 'D'
      ? 'bg-slate-100 text-slate-600'
      : 'bg-red-50 text-triondaRed';
  return <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black ${className}`}>{label}</span>;
}

function teamTournamentSummary(teamCode: string, results: Match[]) {
  const chronological = [...results].sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());
  const totals = chronological.reduce<Omit<TeamTournamentSummaryData, 'avgFor' | 'avgAgainst'>>((summary, match) => {
    const isHome = match.home_code === teamCode;
    const goalsFor = Number(isHome ? match.home_goals : match.away_goals);
    const goalsAgainst = Number(isHome ? match.away_goals : match.home_goals);
    const result: 'W' | 'D' | 'L' = goalsFor === goalsAgainst ? 'D' : goalsFor > goalsAgainst ? 'W' : 'L';
    return {
      wins: summary.wins + (result === 'W' ? 1 : 0),
      draws: summary.draws + (result === 'D' ? 1 : 0),
      losses: summary.losses + (result === 'L' ? 1 : 0),
      goalsFor: summary.goalsFor + goalsFor,
      goalsAgainst: summary.goalsAgainst + goalsAgainst,
      form: [...summary.form, result]
    };
  }, { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, form: [] as Array<'W' | 'D' | 'L'> });
  const played = Math.max(1, chronological.length);
  return {
    ...totals,
    avgFor: (totals.goalsFor / played).toFixed(1),
    avgAgainst: (totals.goalsAgainst / played).toFixed(1)
  };
}

function RecentResultRow({ teamCode, result }: { teamCode: string; result: Match }) {
  const isHome = result.home_code === teamCode;
  const teamGoals = isHome ? result.home_goals : result.away_goals;
  const opponentGoals = isHome ? result.away_goals : result.home_goals;
  const opponentName = isHome ? result.away_name : result.home_name;
  const opponentFlag = isHome ? result.away_flag : result.home_flag;
  const teamFlag = isHome ? result.home_flag : result.away_flag;
  const resultLabel = teamGoals === opponentGoals ? 'E' : Number(teamGoals) > Number(opponentGoals) ? 'G' : 'P';
  const resultClass = resultLabel === 'G' ? 'bg-emerald-100 text-pitch' : resultLabel === 'E' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-triondaRed';

  return (
    <div className="rounded-md bg-white px-2.5 py-2 text-xs shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between gap-2">
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-black ${resultClass}`}>{resultLabel}</span>
        <FlagScore homeFlag={teamFlag} awayFlag={opponentFlag} homeGoals={teamGoals ?? '-'} awayGoals={opponentGoals ?? '-'} size="xs" />
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-slate-500">
        <span className="shrink-0 font-bold">vs</span>
        <img src={flagUrl(opponentFlag)} alt="" className="h-3.5 w-5 rounded-sm object-cover shadow-sm" />
        <span className="truncate font-bold">{opponentName}</span>
      </div>
      <div className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{matchStageLabel(result)}</div>
    </div>
  );
}

function StatsComparison({ match, home, away }: { match: Match; home: TeamStats; away: TeamStats }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 bg-white">
      <div className="grid grid-cols-[minmax(0,1fr)_82px_minmax(0,1fr)] items-end gap-2 border-b border-slate-100 bg-slate-50 px-3 py-3">
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

      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
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
      {stats?.best_world_cup_result && <div className="mt-2 rounded-md bg-slate-100 px-2 py-1.5 text-xs font-black leading-5 text-pitch">{stats.best_world_cup_result}</div>}

      <div className="mt-3">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Jugadores a seguir</div>
        {stats?.stars_json?.length ? <ul className="mt-2 space-y-1.5">
          {stats.stars_json.map((player) => <li key={player} className="rounded-md bg-slate-50 px-2.5 py-1.5 text-sm font-black leading-5 text-pitch">{player}</li>)}
        </ul> : <div className="mt-2 text-sm font-bold text-slate-400">Pendiente</div>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex gap-1">
        {form.length ? form.map((r, index) => <span key={index} className={`h-3 w-3 rounded-full ${r === 'W' ? 'bg-pitch' : r === 'D' ? 'bg-triondaGold' : 'bg-triondaRed'}`} />) : <span className="text-sm text-slate-400">-</span>}
        </div>
        {squad && <button onClick={() => setSquadOpen(!squadOpen)} className="rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-pitch">
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
      {players.map((player) => <li key={player} className="leading-5 text-pitch">{player}</li>)}
    </ul>
  </div>;
}

function TeamScore({ name, flag, value, locked, knockout = false, onMinus, onPlus }: { name: string; flag: string; value?: number; locked: boolean; knockout?: boolean; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${knockout ? 'border-slate-200 bg-slate-50/60 shadow-sm shadow-slate-200/60' : 'border-transparent'}`}>
      <img src={flagUrl(flag)} alt="" className="mx-auto h-12 w-16 object-contain" />
      <div className="mt-2 min-h-12 text-lg font-black leading-6 text-slate-950">{name}</div>
      <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <button disabled={locked} onClick={onMinus} className="score-btn">-</button>
        <div className={`rounded-lg px-1 py-1 text-4xl font-black leading-none ${knockout ? 'bg-white text-slate-950 ring-1 ring-slate-200 shadow-sm' : 'text-slate-950'}`}>{value ?? '-'}</div>
        <button disabled={locked} onClick={onPlus} className="score-btn filled">+</button>
      </div>
    </div>
  );
}

function KnockoutPickControls({ match, pick, locked, onChange }: { match: Match; pick: Pick; locked: boolean; onChange: (patch: Partial<Pick>) => void }) {
  const needsAdvance = isDrawScore(pick.home_goals, pick.away_goals);
  const firstGoalAuto = effectiveFirstGoal(pick.home_goals, pick.away_goals, null);
  const firstGoalOptions = firstGoalChoiceOptions(match, pick.home_goals, pick.away_goals);
  return (
    <div className="mx-4 mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm shadow-slate-200/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Retos de eliminatoria</div>
          <div className="mt-0.5 text-xs font-black text-slate-600">Cada detalle puede mover la tabla</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-triondaGold shadow-sm">
          <Trophy size={16} strokeWidth={2.6} />
        </div>
      </div>
      <div className="grid gap-3 min-[520px]:grid-cols-2">
        {needsAdvance ? <BonusChoiceGroup
          label={advanceBonusLabel(match)}
          selectedIcon="✓"
          options={[
            { value: 'H', label: match.home_name, flag: match.home_flag },
            { value: 'A', label: match.away_name, flag: match.away_flag }
          ]}
          value={pick.advance_pick || null}
          locked={locked}
          onChange={(value) => onChange({ advance_pick: value as BonusSide })}
        /> : <div className="rounded-lg bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500">
          <b className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{advanceBonusLabel(match)}</b>
          Solo aplica si tu marcador queda empatado.
        </div>}
        {firstGoalAuto ? <AutoBonusValue
          label="¿Quién anota el primer gol?"
          value={firstGoalAuto}
          homeName={match.home_name}
          homeFlag={match.home_flag}
          awayName={match.away_name}
          awayFlag={match.away_flag}
        /> : <BonusChoiceGroup
          label="¿Quién anota el primer gol?"
          selectedIcon="⚽"
          options={firstGoalOptions}
          value={pick.first_goal_pick || null}
          locked={locked}
          onChange={(value) => onChange({ first_goal_pick: value as FirstGoalPick })}
        />}
      </div>
    </div>
  );
}

function AutoBonusValue({ label, value, homeName, homeFlag, awayName, awayFlag }: { label: string; value: FirstGoalPick; homeName: string; homeFlag: string; awayName: string; awayFlag: string }) {
  const team = value === 'H' ? { name: homeName, flag: homeFlag } : value === 'A' ? { name: awayName, flag: awayFlag } : null;
  return (
    <div className="rounded-lg bg-white p-2 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/80">
      <b className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label} · +1</b>
      <span className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center text-slate-700">
        {team ? <>
          <img src={flagUrl(team.flag)} alt="" className="h-7 w-10 rounded-sm object-cover shadow-sm" />
          <span className="line-clamp-2 max-w-full text-sm font-black leading-4">{team.name}</span>
        </> : <span className="line-clamp-2 max-w-full text-sm font-black leading-4">Sin gol</span>}
      </span>
    </div>
  );
}

function BonusChoiceGroup({ label, options, value, locked, selectedIcon, onChange }: { label: string; options: Array<{ value: string; label: string; flag?: string }>; value: string | null; locked: boolean; selectedIcon?: string; onChange: (value: string) => void }) {
  return (
    <div className="rounded-lg bg-white p-2 shadow-sm shadow-slate-200/70 ring-1 ring-slate-200/80">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label} · +1</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return <button key={option.value} disabled={locked} onClick={() => onChange(option.value)} className={`relative min-h-20 rounded-lg border px-2 py-2 text-center shadow-sm transition disabled:opacity-50 ${selected ? 'border-slate-950 bg-white text-slate-950 ring-2 ring-slate-950/10 shadow-slate-300/80' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
          {selected && selectedIcon && <span className={`absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black leading-none shadow-sm ${selectedIcon === '✓' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950'}`}>{selectedIcon}</span>}
          <span className="flex h-full flex-col items-center justify-center gap-1.5">
            {option.flag && <img src={flagUrl(option.flag)} alt="" className="h-7 w-10 rounded-sm object-cover shadow-sm" />}
            <span className="line-clamp-2 max-w-full text-sm font-black leading-4">{option.label}</span>
          </span>
        </button>;
        })}
      </div>
    </div>
  );
}

function RankMovement({ delta }: { delta: number }) {
  if (!delta) return null;
  const movedUp = delta > 0;
  return <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${movedUp ? 'text-pitch' : 'text-triondaRed'}`} title={movedUp ? `Subió ${delta}` : `Bajó ${Math.abs(delta)}`}>
    {movedUp ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
    {movedUp ? `+${delta}` : `-${Math.abs(delta)}`}
  </span>;
}

function Podium({ standings, player }: { standings: Standing[]; player: Player }) {
  const podiumRows = [standings[1], standings[0], standings[2]];
  const configs = [
    { rank: 2, label: 'Plata', height: 'h-20', accent: 'bg-slate-300', text: 'text-slate-700', ring: 'ring-slate-200', Icon: Medal },
    { rank: 1, label: 'Líder', height: 'h-28', accent: 'bg-slate-950', text: 'text-slate-950', ring: 'ring-slate-300', Icon: Crown },
    { rank: 3, label: 'Bronce', height: 'h-16', accent: 'bg-[#C98B58]', text: 'text-slate-800', ring: 'ring-orange-200', Icon: Medal }
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rumbo a la final</div>
          <div className="mt-0.5 text-sm font-black text-slate-950">Top 3 en zona de copa</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm shadow-slate-200/70">
          <Trophy size={20} strokeWidth={2.6} className="text-triondaGold" />
        </div>
      </div>
      <div className="grid grid-cols-3 items-end gap-2 text-center">
        {podiumRows.map((row, index) => {
          const config = configs[index];
          const isCurrentPlayer = row?.player_id === player.id;
          const Icon = config.Icon;
          return (
            <div key={row?.player_id || config.rank} className="podium-rise min-w-0" style={{ animationDelay: `${index * 90}ms` }}>
              <div className={`relative overflow-hidden rounded-lg border bg-slate-50 shadow-sm shadow-slate-200/70 ${isCurrentPlayer ? 'border-pitch ring-2 ring-pitch/20' : 'border-slate-200'}`}>
                <div className={`h-1.5 ${config.accent}`} />
                <div className="px-2 py-3">
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-2 ${config.ring} ${config.text} ${config.rank === 1 ? 'podium-pulse' : ''}`}>
                    <Icon size={18} strokeWidth={2.8} />
                  </div>
                  <div className="mt-2 flex min-h-10 flex-col items-center justify-center">
                    <b className="max-w-full truncate text-sm leading-5 text-slate-950">{row?.alias || '-'}</b>
                    <span className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{config.label}</span>
                  </div>
                </div>
                <div className={`mx-2 flex ${config.height} flex-col items-center justify-end rounded-t-lg ${config.accent} px-1 pb-3 text-white shadow-inner`}>
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] opacity-80">Pts</span>
                  <b className="text-2xl leading-7">{row ? row.points : 0}</b>
                </div>
                <div className={`flex items-center justify-center gap-1 bg-slate-100 py-1.5 text-xs font-black ${config.text}`}>
                  <span>#{row?.rank || config.rank}</span>
                  {row && <RankMovement delta={row.rank_delta} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TableView({ standings, matches, player }: { standings: Standing[]; matches: Match[]; player: Player }) {
  const [view, setView] = useState<'ranking' | 'match'>('ranking');
  const [selected, setSelected] = useState('');
  const [matchMenuOpen, setMatchMenuOpen] = useState(false);
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
    setMatchMenuOpen(false);
  }

  return (
    <main className="mx-auto max-w-4xl py-6">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
        <button onClick={() => setView('ranking')} className={`h-11 rounded-md text-sm font-black ${view === 'ranking' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Ranking</button>
        <button onClick={() => setView('match')} className={`h-11 rounded-md text-sm font-black ${view === 'match' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Por partido</button>
      </div>

      {view === 'ranking' && <>
      {standings.length > 0 && <Podium standings={standings} player={player} />}
      <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-md shadow-slate-200/60">
        <div className="grid grid-cols-[34px_minmax(0,1fr)_52px_48px_54px] gap-2 bg-pitch px-3 py-3 text-xs font-black text-white sm:text-sm">
          <span>#</span><span>Jugador</span><span className="text-right">Pts</span><span className="text-right">Res.</span><span className="text-right">Exact.</span>
        </div>
        {standings.map((row) => {
          const isCurrentPlayer = row.player_id === player.id;
          return <div key={row.player_id} className={`grid grid-cols-[34px_minmax(0,1fr)_52px_48px_54px] gap-2 border-t px-3 py-4 text-sm sm:text-base ${isCurrentPlayer ? 'border-l-4 border-l-pitch border-t-emerald-100 bg-emerald-50/70' : 'border-t-slate-100'}`}>
          <div className="flex flex-col leading-none">
            <b className="text-triondaGold">{row.rank}</b>
            <RankMovement delta={row.rank_delta} />
          </div>
          <b className="truncate">{row.alias}</b>
          <b className="text-right text-pitch">{row.points}</b>
          <span className="text-right">{row.results}</span>
          <span className="text-right">{row.exacts}</span>
        </div>;
        })}
      </div>
      <p className="mt-5 text-center text-sm leading-6 text-slate-500">1 punto por resultado · 3 por exacto · en cuartos +1 primer gol y +1 clasifica solo si tu marcador es empate.</p>
      </>}

      {view === 'match' && <section className="rounded-lg bg-white p-4 border border-slate-200 shadow-md shadow-slate-200/60">
        <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2">
          <button className="icon-btn !h-12 !w-12" disabled={selectedIndex <= 0} onClick={() => moveMatch(-1)}><ChevronLeft /></button>
          <div className="relative min-w-0">
            <button onClick={() => setMatchMenuOpen(!matchMenuOpen)} className="w-full rounded-xl bg-slate-50 px-3 py-3 text-slate-950 shadow-sm border border-slate-200">
              {selectedMatch ? <MatchNavContent match={selectedMatch} /> : <span className="text-sm font-black text-slate-400">Selecciona partido</span>}
            </button>
            {matchMenuOpen && <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-100 bg-white p-2 shadow-xl">
              {matches.map((match) => <button key={match.id} onClick={() => { setSelected(match.id); setMatchMenuOpen(false); }} className={`w-full rounded-lg px-3 py-3 text-left ${selectedMatch?.id === match.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                <MatchNavContent match={match} compact />
              </button>)}
            </div>}
          </div>
          <button className="icon-btn !h-12 !w-12" disabled={selectedIndex >= matches.length - 1} onClick={() => moveMatch(1)}><ChevronRight /></button>
        </div>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
          {matchPicks.length === 0 && <div className="p-4 text-center text-sm font-bold text-slate-400">Todavia no hay picks para este partido.</div>}
          {selectedMatch && matchPicks.map((pick) => <div key={pick.player_id} className="grid grid-cols-[minmax(0,1fr)_128px_58px] items-center gap-2 border-t border-slate-100 px-3 py-3 first:border-t-0">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <b className="truncate">{pick.alias}</b>
                <RankMovement delta={pick.rank_delta || 0} />
              </div>
              {pick.rank && <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">Después: #{pick.rank}</span>}
            </div>
            <div className="justify-self-end">
              <div className="flex flex-col items-end gap-1">
                <FlagScore homeFlag={selectedMatch.home_flag} awayFlag={selectedMatch.away_flag} homeGoals={pick.home_goals} awayGoals={pick.away_goals} firstGoal={isBonusMatch(selectedMatch) ? effectiveFirstGoal(pick.home_goals, pick.away_goals, pick.first_goal_pick) : null} advance={isBonusMatch(selectedMatch) && isDrawScore(pick.home_goals, pick.away_goals) ? pick.advance_pick || null : null} />
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-center text-sm font-black text-pitch">{pick.points} pts</span>
          </div>)}
        </div>
      </section>}
    </main>
  );
}

function MatchNavContent({ match, compact = false }: { match: Match; compact?: boolean }) {
  const hasResult = match.home_goals !== null && match.away_goals !== null;
  return <div className="min-w-0 text-center">
    <div className={`truncate font-black uppercase text-slate-400 ${compact ? 'text-[10px] tracking-[0.12em]' : 'text-[10px] tracking-[0.14em]'}`}>
      {matchRoundLabel(match)} · {localDateLabel(match.kickoff_utc)} · {localTime(match.kickoff_utc)}
    </div>
    <div className={`mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_54px_minmax(0,1fr)] items-center gap-2 ${compact ? 'text-sm' : 'text-[13px] min-[380px]:text-sm sm:text-base'}`}>
      <div className="min-w-0 text-center">
        <img src={flagUrl(match.home_flag)} className="mx-auto h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm" alt="" />
        <b className="mt-1 block truncate leading-4">{match.home_name}</b>
      </div>
      <b className={`shrink-0 whitespace-nowrap text-center text-base leading-5 ${hasResult ? 'text-pitch' : 'text-slate-400'}`}>
        {hasResult ? `${match.home_goals} - ${match.away_goals}` : 'vs'}
      </b>
      <div className="min-w-0 text-center">
        <img src={flagUrl(match.away_flag)} className="mx-auto h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm" alt="" />
        <b className="mt-1 block truncate leading-4">{match.away_name}</b>
      </div>
    </div>
  </div>;
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
  const [pickDate, setPickDate] = useState(todayLocalKey());
  const [resultDate, setResultDate] = useState(todayLocalKey());
  const [resultDraft, setResultDraft] = useState<Record<string, ResultDraft>>({});
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
    await saveDraftPatch(match, { [side]: Math.max(0, current[side] + delta) });
  }

  async function saveDraftPatch(match: Match, patch: Partial<Pick>) {
    const current = draft[match.id] || { match_id: match.id, home_goals: 0, away_goals: 0 };
    const next = normalizeBonusPick(match, { ...current, ...patch });
    setDraft({ ...draft, [match.id]: next });
    if (selected) {
      await admin(`/api/admin/picks/${selected}`, { method: 'PUT', body: JSON.stringify([next]) });
      await reload();
    }
  }
  function changeResult(match: Match, side: 'home_goals' | 'away_goals', delta: number) {
    const current = resultDraft[match.id] || { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals, advance: match.advance, first_goal: match.first_goal };
    const currentValue = current[side];
    const nextValue = currentValue === null ? 0 : Math.max(0, currentValue + delta);
    setResultDraft({ ...resultDraft, [match.id]: normalizeResultDraft(match, { ...current, [side]: nextValue }) });
  }

  function changeResultBonus(match: Match, patch: Partial<ResultDraft>) {
    const current = resultDraft[match.id] || { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals, advance: match.advance, first_goal: match.first_goal };
    setResultDraft({ ...resultDraft, [match.id]: normalizeResultDraft(match, { ...current, ...patch }) });
  }

  async function saveResult(match: Match) {
    const current = normalizeResultDraft(match, resultDraft[match.id] || { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals, advance: match.advance, first_goal: match.first_goal });
    if (current.home_goals === null || current.away_goals === null) {
      alert('Captura los dos marcadores antes de guardar.');
      return;
    }
    if (isBonusMatch(match) && isDrawScore(current.home_goals, current.away_goals) && !current.advance) {
      alert('Captura quien clasifica.');
      return;
    }
    if (isBonusMatch(match) && !effectiveFirstGoal(current.home_goals, current.away_goals, current.first_goal)) {
      alert('Captura quien anota primero.');
      return;
    }
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify(current) });
    setResultDraft(({ [match.id]: _removed, ...rest }) => rest);
    await reload();
  }

  async function clearResult(match: Match) {
    await admin('/api/admin/result', { method: 'POST', body: JSON.stringify({ match_id: match.id, home_goals: null, away_goals: null, advance: null, first_goal: null }) });
    setResultDraft(({ [match.id]: _removed, ...rest }) => rest);
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

  const adminDays = Array.from(new Set(matches.map((match) => localDateKey(match.kickoff_utc))));
  const pickMatches = matches
    .filter((match) => localDateKey(match.kickoff_utc) === pickDate);
  const resultMatches = matches
    .filter((match) => localDateKey(match.kickoff_utc) === resultDate);
  const matchFinishedGraceMs = 2 * 60 * 60 * 1000;
  const missingResultMatches = matches.filter((match) => {
    const finished = new Date(match.kickoff_utc).getTime() + matchFinishedGraceMs <= Date.now();
    const missingScore = match.home_goals === null || match.away_goals === null;
    const missingAdvance = isBonusMatch(match) && isDrawScore(match.home_goals, match.away_goals) && !match.advance;
    const missingFirstGoal = isBonusMatch(match) && !effectiveFirstGoal(match.home_goals, match.away_goals, match.first_goal);
    return finished && (missingScore || missingAdvance || missingFirstGoal);
  });
  const missingResultDays = Array.from(new Set(missingResultMatches.map((match) => localDateKey(match.kickoff_utc))));

  function goToMissingResults(day: string) {
    setMode('results');
    setResultDate(day);
  }

  if (!adminReady) {
    return (
      <main className="mx-auto max-w-xl py-6">
        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-md shadow-slate-200/60">
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
      <div className="mt-4 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
        <button onClick={() => setMode('picks')} className={`h-11 rounded-md text-sm font-black ${mode === 'picks' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Jugadores</button>
        <button onClick={() => setMode('results')} className={`relative h-11 rounded-md text-sm font-black ${mode === 'results' ? 'bg-pitch text-white' : 'text-slate-500'}`}>
          Resultados
          {missingResultMatches.length > 0 && <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${mode === 'results' ? 'bg-white text-pitch' : 'bg-triondaRed text-white'}`}>{missingResultMatches.length}</span>}
        </button>
        <button onClick={() => setMode('settings')} className={`h-11 rounded-md text-sm font-black ${mode === 'settings' ? 'bg-pitch text-white' : 'text-slate-500'}`}>Ajustes</button>
      </div>
      {missingResultMatches.length > 0 && <section className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-triondaRed">Resultados pendientes</h3>
            <p className="mt-1 text-sm font-bold leading-5 text-red-700">Faltan {missingResultMatches.length} partido{missingResultMatches.length === 1 ? '' : 's'} ya terminado{missingResultMatches.length === 1 ? '' : 's'} por capturar.</p>
          </div>
          <button onClick={() => goToMissingResults(missingResultDays[0])} className="shrink-0 rounded-lg bg-triondaRed px-3 py-2 text-xs font-black text-white">Revisar</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {missingResultDays.map((day) => {
            const count = missingResultMatches.filter((match) => localDateKey(match.kickoff_utc) === day).length;
            return <button key={day} onClick={() => goToMissingResults(day)} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-red-700 shadow-sm ring-1 ring-red-100">
              {localDateLabel(`${day}T12:00:00Z`)} · {count}
            </button>;
          })}
        </div>
      </section>}
      {mode !== 'picks' && <h2 className="mt-6 text-lg font-black text-pitch">{mode === 'results' ? 'Resultados oficiales' : 'Ajustes'}</h2>}
      {mode === 'settings' ? <section className="mt-3 rounded-lg bg-white p-4 border border-slate-200 shadow-md shadow-slate-200/60">
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
            {players.map((player) => <div key={player.id} className={`rounded-lg border p-3 ${Boolean(player.active) ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-slate-50 opacity-80'}`}>
              <div className="grid grid-cols-[1fr_92px] gap-2">
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Nombre</span>
                  <input className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950" value={player.alias} onChange={(e) => editPlayerLocal(player.id, 'alias', e.target.value)} />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Año</span>
                  <input className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950" value={player.birth_year || ''} inputMode="numeric" onChange={(e) => editPlayerLocal(player.id, 'birth_year', e.target.value.replace(/\D/g, '').slice(0, 4))} />
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
        <section className="rounded-lg bg-white p-4 border border-slate-200 shadow-md shadow-slate-200/60">
          <h3 className="font-black">Agregar jugador</h3>
          <div className="mt-3 grid grid-cols-[1fr_100px_48px] gap-2"><input className="input !mt-0" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" /><input className="input !mt-0" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Año" /><button onClick={addPlayer} className="rounded-lg bg-pitch text-white"><UserPlus className="mx-auto" /></button></div>
          <h3 className="mt-5 border-t border-slate-100 pt-4 font-black">Selecciona jugador</h3>
          <div className="mt-3 flex flex-wrap gap-2">{players.filter((p) => Boolean(p.active)).map((p) => <button key={p.id} onClick={() => selectPlayer(p.id)} className={`rounded-full px-4 py-2 text-sm font-black ${selected === p.id ? 'bg-pitch text-white' : 'bg-slate-100 text-slate-600'}`}>{p.alias}</button>)}</div>
        </section>
        <section className="rounded-lg bg-white p-4 border border-slate-200 shadow-md shadow-slate-200/60">
          <label className="block text-sm font-black text-slate-950">Fecha</label>
          <select className="input" value={pickDate} onChange={(e) => setPickDate(e.target.value)}>
            {!adminDays.includes(pickDate) && <option value={pickDate}>{localDateLabel(`${pickDate}T12:00:00Z`)}</option>}
            {adminDays.map((day) => <option key={day} value={day}>{localDateLabel(`${day}T12:00:00Z`)}</option>)}
          </select>
          <p className="mt-2 text-xs font-bold text-slate-400">Muestra solo los partidos de esa fecha para capturar picks más rápido.</p>
        </section>
        {pickMatches.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400">No hay partidos en esta fecha.</div>}
        {pickMatches.map((match) => <MatchCard key={match.id} match={match} pick={draft[match.id]} setScore={changeDraft} setPickPatch={saveDraftPatch} forceOpen />)}
      </div> : <div className="mt-3 space-y-3">
        <section className="rounded-lg bg-white p-4 border border-slate-200 shadow-md shadow-slate-200/60">
          <label className="block text-sm font-black text-slate-950">Fecha</label>
          <select className="input" value={resultDate} onChange={(e) => setResultDate(e.target.value)}>
            {!adminDays.includes(resultDate) && <option value={resultDate}>{localDateLabel(`${resultDate}T12:00:00Z`)}</option>}
            {adminDays.map((day) => <option key={day} value={day}>{localDateLabel(`${day}T12:00:00Z`)}</option>)}
          </select>
          <p className="mt-2 text-xs font-bold text-slate-400">Los partidos se mantienen en orden de horario para capturarlos sin que se muevan.</p>
        </section>
        {resultMatches.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-bold text-slate-400">No hay partidos en esta fecha.</div>}
        {resultMatches.map((match) => {
          const p: ResultDraft = normalizeResultDraft(match, resultDraft[match.id] || { match_id: match.id, home_goals: match.home_goals, away_goals: match.away_goals, advance: match.advance, first_goal: match.first_goal });
          const dirty = p.home_goals !== match.home_goals || p.away_goals !== match.away_goals || p.advance !== match.advance || p.first_goal !== match.first_goal;
          const resultIsDraw = isDrawScore(p.home_goals, p.away_goals);
          const resultFirstGoal = effectiveFirstGoal(p.home_goals, p.away_goals, p.first_goal);
          const resultFirstGoalOptions = firstGoalChoiceOptions(match, p.home_goals, p.away_goals);
          const canSave = p.home_goals !== null && p.away_goals !== null && (!isBonusMatch(match) || Boolean(resultFirstGoal && (!resultIsDraw || p.advance)));
          return <article key={match.id} className="rounded-lg bg-white p-3 border border-slate-200 shadow-md shadow-slate-200/60">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{matchRoundLabel(match)} · {localDay(match.kickoff_utc)} · {localTime(match.kickoff_utc)}</div>
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
              <button className="mini-btn !h-10 !w-10" onClick={() => changeResult(match, 'home_goals', -1)}>-</button>
              <b className="text-center text-lg">{p.home_goals ?? '-'}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => changeResult(match, 'home_goals', 1)}>+</button>
              <span className="text-center font-black text-slate-300">-</span>
              <button className="mini-btn !h-10 !w-10" onClick={() => changeResult(match, 'away_goals', -1)}>-</button>
              <b className="text-center text-lg">{p.away_goals ?? '-'}</b>
              <button className="mini-btn filled !h-10 !w-10" onClick={() => changeResult(match, 'away_goals', 1)}>+</button>
            </div>
            {isBonusMatch(match) && <div className="mt-3 rounded-lg bg-slate-50 p-3">
              <div className="grid gap-3 min-[520px]:grid-cols-2">
                {resultIsDraw ? <BonusChoiceGroup
                  label={advanceBonusLabel(match)}
                  selectedIcon="✓"
                  options={[
                    { value: 'H', label: match.home_name, flag: match.home_flag },
                    { value: 'A', label: match.away_name, flag: match.away_flag }
                  ]}
                  value={p.advance || null}
                  locked={false}
                  onChange={(value) => changeResultBonus(match, { advance: value as BonusSide })}
                /> : <div className="rounded-lg bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-500">
                  <b className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{advanceBonusLabel(match)}</b>
                  Solo aplica si el marcador queda empatado.
                </div>}
                {resultFirstGoal ? <AutoBonusValue
                  label="¿Quién anota el primer gol?"
                  value={resultFirstGoal}
                  homeName={match.home_name}
                  homeFlag={match.home_flag}
                  awayName={match.away_name}
                  awayFlag={match.away_flag}
                /> : <BonusChoiceGroup
                  label="¿Quién anota el primer gol?"
                  selectedIcon="⚽"
                  options={resultFirstGoalOptions}
                  value={p.first_goal || null}
                  locked={false}
                  onChange={(value) => changeResultBonus(match, { first_goal: value as FirstGoalPick })}
                />}
              </div>
            </div>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button disabled={!dirty || !canSave} onClick={() => saveResult(match)} className="h-10 rounded-lg bg-pitch text-sm font-black text-white disabled:bg-slate-200 disabled:text-slate-400">Guardar</button>
              {(p.home_goals !== null || p.away_goals !== null || match.home_goals !== null || match.away_goals !== null) && <button onClick={() => clearResult(match)} className="h-10 rounded-lg bg-slate-100 text-xs font-black text-slate-500">Limpiar</button>}
            </div>
          </article>;
        })}
      </div>}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
