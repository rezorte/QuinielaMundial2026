import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { playerIdFor, requireAdmin, requirePlayer, signPlayerToken } from './auth.js';
import { pool, query } from './db/pool.js';
import { setupDatabase } from './db/setup.js';
import { scorePick } from './scoring.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: appOrigin === '*' ? true : appOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const goalSchema = z.number().int().min(0).max(99);
const sideSchema = z.enum(['H', 'A']);
const firstGoalSchema = z.enum(['H', 'A', 'N']);
const pickSchema = z.object({
  match_id: z.string().min(3).max(24),
  home_goals: goalSchema,
  away_goals: goalSchema,
  advance_pick: sideSchema.nullable().optional(),
  first_goal_pick: firstGoalSchema.nullable().optional()
});
const resultSchema = z.object({
  match_id: z.string().min(3).max(24),
  home_goals: goalSchema.nullable(),
  away_goals: goalSchema.nullable(),
  advance: sideSchema.nullable().optional(),
  first_goal: firstGoalSchema.nullable().optional()
});

function pointsSql(cutoffCondition?: string) {
  const cutoff = cutoffCondition ? `${cutoffCondition} AND ` : '';
  return `
    CASE
      WHEN ${cutoff}m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.home_goals = m.home_goals AND pk.away_goals = m.away_goals THEN 3
      WHEN ${cutoff}m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND SIGN(pk.home_goals - pk.away_goals) = SIGN(m.home_goals - m.away_goals) THEN 1
      ELSE 0
    END
    + CASE WHEN ${cutoff}m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.advance_pick IS NOT NULL AND m.advance IS NOT NULL AND pk.advance_pick = m.advance THEN 1 ELSE 0 END
    + CASE WHEN ${cutoff}m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.first_goal_pick IS NOT NULL AND m.first_goal IS NOT NULL AND pk.first_goal_pick = m.first_goal THEN 1 ELSE 0 END
  `;
}

function lockedExpr() {
  return 'UTC_TIMESTAMP() >= m.kickoff_utc';
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function findPlayerByAlias(alias: string, excludeId?: string) {
  const rows = await query<any>(
    `SELECT id, alias, display_name, birth_year, active
     FROM players
     WHERE LOWER(alias) = LOWER(:alias)
       AND (:exclude_id IS NULL OR id <> :exclude_id)
     LIMIT 1`,
    { alias, exclude_id: excludeId || null }
  );
  return rows[0] || null;
}

app.post('/api/login', async (req, res) => {
  const parsed = z.object({
    nombre: z.string().min(2).max(80),
    anio: z.string().regex(/^\d{4}$/),
    alias: z.string().max(80).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_LOGIN', issues: parsed.error.issues });

  const { nombre, anio } = parsed.data;
  const alias = (parsed.data.alias || nombre).trim();
  const existing = await findPlayerByAlias(alias);
  if (existing) {
    if (existing.birth_year !== anio) {
      return res.status(409).json({ error: 'NAME_EXISTS_WRONG_YEAR' });
    }
    if (!Number(existing.active)) {
      return res.status(403).json({ error: 'USER_INACTIVE' });
    }
    return res.json({
      token: signPlayerToken({ playerId: existing.id, alias: existing.alias }),
      player: { id: existing.id, alias: existing.alias }
    });
  }

  const settings = await getSettings();
  if (settings.registration_open === 'false') {
    return res.status(403).json({ error: 'REGISTRATION_CLOSED' });
  }

  const id = playerIdFor(nombre, anio);
  await pool.execute(
    `INSERT INTO players (id, alias, display_name, birth_year)
     VALUES (:id, :alias, :display_name, :birth_year)
     ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), birth_year = VALUES(birth_year)`,
    { id, alias, display_name: nombre.trim(), birth_year: anio }
  );

  res.json({ token: signPlayerToken({ playerId: id, alias }), player: { id, alias } });
});

app.get('/api/matches', async (_req, res) => {
  const settings = await getSettings();
  const latePicksOpen = settings.late_picks_open === 'true';
  const rows = await query(`
    SELECT
      m.id, m.grp, m.jornada, DATE_FORMAT(m.kickoff_utc, '%Y-%m-%dT%H:%i:%sZ') kickoff_utc,
      m.home_goals, m.away_goals, m.advance, m.first_goal, ${latePicksOpen ? '0' : lockedExpr()} locked,
      ht.code home_code, ht.name home_name, ht.flag home_flag,
      at.code away_code, at.name away_name, at.flag away_flag
    FROM matches m
    JOIN teams ht ON ht.code = m.home
    JOIN teams at ON at.code = m.away
    ORDER BY m.kickoff_utc, m.id
  `);
  res.json(rows);
});

async function getSettings() {
  const rows = await query<{ key: string; value: string }>(`SELECT \`key\`, value FROM settings`);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

app.get('/api/settings', async (_req, res) => {
  const settings = await getSettings();
  res.json({
    late_picks_open: settings.late_picks_open === 'true',
    reveal_picks: settings.reveal_picks === 'true',
    show_team_stats: settings.show_team_stats === 'true',
    registration_open: settings.registration_open !== 'false',
    show_match_picks: settings.show_match_picks === 'true',
    show_pick_scores: settings.show_pick_scores !== 'false'
  });
});

app.get('/api/matches/:matchId/stats', async (req, res) => {
  const rows = await query<any>(
    `SELECT home, away FROM matches WHERE id = :match_id`,
    { match_id: req.params.matchId }
  );
  if (!rows.length) return res.status(404).json({ error: 'MATCH_NOT_FOUND' });

  const { home, away } = rows[0];
  const teams = await query<any>(
    `SELECT team_code, fifa_rank, first_world_cup, world_cup_appearances, world_cup_played, world_cup_wins, world_cup_draws,
       world_cup_losses, world_cup_goals_for, world_cup_goals_against, best_world_cup_result,
       coach, stars_json, squad_json, form_json, source_name, source_url,
       DATE_FORMAT(verified_at, '%Y-%m-%dT%H:%i:%sZ') verified_at
     FROM team_info
     WHERE team_code IN (:home, :away)`,
    { home, away }
  );
  const h2h = await query<any>(
    `SELECT team_a, team_b, DATE_FORMAT(last_match_date, '%Y-%m-%d') last_match_date, last_match_score, competition, source_name, source_url, DATE_FORMAT(verified_at, '%Y-%m-%dT%H:%i:%sZ') verified_at
     FROM head_to_head
     WHERE (team_a = :home AND team_b = :away) OR (team_a = :away AND team_b = :home)
     LIMIT 1`,
    { home, away }
  );

  res.json({
    home: teams.find((team: any) => team.team_code === home) || null,
    away: teams.find((team: any) => team.team_code === away) || null,
    head_to_head: h2h[0] || null
  });
});

app.get('/api/picks/me', requirePlayer, async (req, res) => {
  const rows = await query(
    `SELECT match_id, home_goals, away_goals, advance_pick, first_goal_pick, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') updated_at
     FROM picks WHERE player_id = :player_id`,
    { player_id: req.user!.playerId }
  );
  res.json(rows);
});

app.put('/api/profile', requirePlayer, async (req, res) => {
  const parsed = z.object({
    nombre: z.string().trim().min(1).max(80)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PROFILE', issues: parsed.error.issues });
  const duplicate = await findPlayerByAlias(parsed.data.nombre, req.user!.playerId);
  if (duplicate) return res.status(409).json({ error: 'ALIAS_ALREADY_EXISTS' });

  await pool.execute(
    `UPDATE players SET alias = :alias, display_name = :alias WHERE id = :player_id AND active = 1`,
    { alias: parsed.data.nombre, player_id: req.user!.playerId }
  );

  res.json({ id: req.user!.playerId, alias: parsed.data.nombre });
});

app.post('/api/picks', requirePlayer, async (req, res) => {
  const parsed = z.array(pickSchema).min(1).max(72).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PICKS', issues: parsed.error.issues });

  const saved: string[] = [];
  const rejected: { match_id: string; reason: string }[] = [];
  const settings = await getSettings();
  const latePicksOpen = settings.late_picks_open === 'true';
  const activePlayers = await query<any>(`SELECT active FROM players WHERE id = :player_id`, { player_id: req.user!.playerId });
  if (!activePlayers.length || !Number(activePlayers[0].active)) {
    return res.status(403).json({ error: 'USER_INACTIVE' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of parsed.data) {
      const [matches] = await conn.execute<any[]>(
        `SELECT id, UTC_TIMESTAMP() >= kickoff_utc locked FROM matches WHERE id = :id FOR UPDATE`,
        { id: item.match_id }
      );
      if (!matches.length) {
        rejected.push({ match_id: item.match_id, reason: 'MATCH_NOT_FOUND' });
        continue;
      }
      if (Boolean(matches[0].locked) && !latePicksOpen) {
        rejected.push({ match_id: item.match_id, reason: 'LOCKED' });
        continue;
      }
      await conn.execute(
        `INSERT INTO picks (player_id, match_id, home_goals, away_goals, advance_pick, first_goal_pick)
         VALUES (:player_id, :match_id, :home_goals, :away_goals, :advance_pick, :first_goal_pick)
         ON DUPLICATE KEY UPDATE home_goals = VALUES(home_goals), away_goals = VALUES(away_goals), advance_pick = VALUES(advance_pick), first_goal_pick = VALUES(first_goal_pick)`,
        { ...item, advance_pick: item.advance_pick ?? null, first_goal_pick: item.first_goal_pick ?? null, player_id: req.user!.playerId }
      );
      saved.push(item.match_id);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  res.status(rejected.length ? 409 : 200).json({ saved, rejected });
});

function rankStandingRows(rows: any[]) {
  let previousScore = '';
  let previousRank = 0;
  return rows.map((row: any, index: number) => {
    const score = `${row.points}|${row.exacts}|${row.results}`;
    const rank = score === previousScore ? previousRank : index + 1;
    previousScore = score;
    previousRank = rank;
    return { ...row, rank };
  });
}

async function standingRowsThroughMatch(match: { match_id: string; kickoff_utc: string }, includeMatch: boolean) {
  const cutoffCondition = includeMatch
    ? `(m.kickoff_utc < :cutoff_kickoff OR (m.kickoff_utc = :cutoff_kickoff AND m.id <= :cutoff_match_id))`
    : `(m.kickoff_utc < :cutoff_kickoff OR (m.kickoff_utc = :cutoff_kickoff AND m.id < :cutoff_match_id))`;
  const rows = await query<any>(`
    SELECT
      p.id player_id, p.alias,
      COALESCE(SUM(${pointsSql(cutoffCondition)}), 0) points,
      COALESCE(SUM(CASE
        WHEN ${cutoffCondition} AND m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.home_goals = m.home_goals AND pk.away_goals = m.away_goals THEN 1
        ELSE 0
      END), 0) exacts,
      COALESCE(SUM(CASE
        WHEN ${cutoffCondition} AND m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND SIGN(pk.home_goals - pk.away_goals) = SIGN(m.home_goals - m.away_goals) THEN 1
        ELSE 0
      END), 0) results
    FROM players p
    LEFT JOIN picks pk ON pk.player_id = p.id
    LEFT JOIN matches m ON m.id = pk.match_id
    WHERE p.active = 1
    GROUP BY p.id, p.alias
    ORDER BY points DESC, exacts DESC, results DESC, p.alias ASC
  `, { cutoff_kickoff: match.kickoff_utc, cutoff_match_id: match.match_id });
  return rankStandingRows(rows);
}

app.get('/api/standings', async (_req, res) => {
  const latest = await query<{ match_id: string | null; kickoff_utc: string | null }>(`
    SELECT id match_id, kickoff_utc
    FROM matches
    WHERE home_goals IS NOT NULL AND away_goals IS NOT NULL
    ORDER BY kickoff_utc DESC, id DESC
    LIMIT 1
  `);
  const latestMatch = latest[0] || null;
  const rows = await query<any>(`
    SELECT
      p.id player_id, p.alias,
      COALESCE(SUM(${pointsSql()}), 0) points,
      COALESCE(SUM(CASE
        WHEN m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.home_goals = m.home_goals AND pk.away_goals = m.away_goals THEN 1
        ELSE 0
      END), 0) exacts,
      COALESCE(SUM(CASE
        WHEN m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND SIGN(pk.home_goals - pk.away_goals) = SIGN(m.home_goals - m.away_goals) THEN 1
        ELSE 0
      END), 0) results
    FROM players p
    LEFT JOIN picks pk ON pk.player_id = p.id
    LEFT JOIN matches m ON m.id = pk.match_id
    WHERE p.active = 1
    GROUP BY p.id, p.alias
    ORDER BY points DESC, exacts DESC, results DESC, p.alias ASC
  `);
  const rankedRows = rankStandingRows(rows);

  if (!latestMatch?.match_id) {
    return res.json(rankedRows.map((row) => ({ ...row, rank_delta: 0 })));
  }

  const previousRows = await query<any>(`
    SELECT
      p.id player_id, p.alias,
      COALESCE(SUM(${pointsSql(`(m.kickoff_utc < :latest_kickoff OR (m.kickoff_utc = :latest_kickoff AND m.id < :latest_match_id))`)}), 0) points,
      COALESCE(SUM(CASE
        WHEN (m.kickoff_utc < :latest_kickoff OR (m.kickoff_utc = :latest_kickoff AND m.id < :latest_match_id)) AND m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND pk.home_goals = m.home_goals AND pk.away_goals = m.away_goals THEN 1
        ELSE 0
      END), 0) exacts,
      COALESCE(SUM(CASE
        WHEN (m.kickoff_utc < :latest_kickoff OR (m.kickoff_utc = :latest_kickoff AND m.id < :latest_match_id)) AND m.home_goals IS NOT NULL AND m.away_goals IS NOT NULL AND SIGN(pk.home_goals - pk.away_goals) = SIGN(m.home_goals - m.away_goals) THEN 1
        ELSE 0
      END), 0) results
    FROM players p
    LEFT JOIN picks pk ON pk.player_id = p.id
    LEFT JOIN matches m ON m.id = pk.match_id
    WHERE p.active = 1
    GROUP BY p.id, p.alias
    ORDER BY points DESC, exacts DESC, results DESC, p.alias ASC
  `, { latest_kickoff: latestMatch.kickoff_utc, latest_match_id: latestMatch.match_id });
  const previousRanks = new Map(rankStandingRows(previousRows).map((row) => [row.player_id, row.rank]));
  res.json(rankedRows.map((row) => ({ ...row, rank_delta: (previousRanks.get(row.player_id) || row.rank) - row.rank })));
});

app.get('/api/matches/:matchId/picks', async (req, res) => {
  const matchRows = await query<{ match_id: string; kickoff_utc: string; home_goals: number | null; away_goals: number | null; advance: string | null; first_goal: string | null }>(
    `SELECT id match_id, kickoff_utc, home_goals, away_goals, advance, first_goal FROM matches WHERE id = :match_id LIMIT 1`,
    { match_id: req.params.matchId }
  );
  const selectedMatch = matchRows[0] || null;
  const rows = await query<any>(
    `SELECT
      p.id player_id, p.alias,
      pk.home_goals, pk.away_goals, pk.advance_pick, pk.first_goal_pick,
      m.home_goals real_home_goals, m.away_goals real_away_goals, m.advance real_advance, m.first_goal real_first_goal
     FROM picks pk
     JOIN players p ON p.id = pk.player_id
     JOIN matches m ON m.id = pk.match_id
     WHERE pk.match_id = :match_id AND p.active = 1
     ORDER BY p.alias`,
    { match_id: req.params.matchId }
  );

  let historicalRanks = new Map<string, { rank: number; rank_delta: number; rank_before: number; points_before: number; points_after: number }>();
  if (selectedMatch?.home_goals !== null && selectedMatch?.away_goals !== null) {
    const [afterRows, beforeRows] = await Promise.all([
      standingRowsThroughMatch(selectedMatch, true),
      standingRowsThroughMatch(selectedMatch, false)
    ]);
    const beforeStats = new Map(beforeRows.map((row) => [row.player_id, row]));
    historicalRanks = new Map(afterRows.map((row) => [row.player_id, {
      rank: row.rank,
      rank_delta: (beforeStats.get(row.player_id)?.rank || row.rank) - row.rank,
      rank_before: beforeStats.get(row.player_id)?.rank || row.rank,
      points_before: Number(beforeStats.get(row.player_id)?.points || 0),
      points_after: Number(row.points || 0)
    }]));
  }

  res.json(rows.map((row: any) => ({
    player_id: row.player_id,
    alias: row.alias,
    home_goals: row.home_goals,
    away_goals: row.away_goals,
    advance_pick: row.advance_pick,
    first_goal_pick: row.first_goal_pick,
    points: scorePick(row.home_goals, row.away_goals, row.real_home_goals, row.real_away_goals, row.advance_pick, row.real_advance, row.first_goal_pick, row.real_first_goal).points,
    rank: historicalRanks.get(row.player_id)?.rank || null,
    rank_delta: historicalRanks.get(row.player_id)?.rank_delta || 0,
    rank_before: historicalRanks.get(row.player_id)?.rank_before || null,
    points_before: historicalRanks.get(row.player_id)?.points_before ?? null,
    points_after: historicalRanks.get(row.player_id)?.points_after ?? null
  })));
});

app.get('/api/admin/players', requireAdmin, async (_req, res) => {
  const rows = await query(`SELECT id, alias, display_name, birth_year, active FROM players ORDER BY alias`);
  res.json(rows);
});

app.post('/api/admin/player', requireAdmin, async (req, res) => {
  const parsed = z.object({
    nombre: z.string().min(2).max(80),
    anio: z.string().regex(/^\d{4}$/),
    alias: z.string().max(80).optional()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PLAYER', issues: parsed.error.issues });
  const id = playerIdFor(parsed.data.nombre, parsed.data.anio);
  const alias = (parsed.data.alias || parsed.data.nombre).trim();
  const duplicate = await findPlayerByAlias(alias, id);
  if (duplicate) return res.status(409).json({ error: 'ALIAS_ALREADY_EXISTS' });
  await pool.execute(
    `INSERT INTO players (id, alias, display_name, birth_year)
     VALUES (:id, :alias, :display_name, :birth_year)
     ON DUPLICATE KEY UPDATE alias = VALUES(alias), display_name = VALUES(display_name), birth_year = VALUES(birth_year)`,
    { id, alias, display_name: parsed.data.nombre.trim(), birth_year: parsed.data.anio }
  );
  res.json({ id, alias });
});

app.put('/api/admin/player/:playerId', requireAdmin, async (req, res) => {
  const parsed = z.object({
    nombre: z.string().trim().min(1).max(80),
    birth_year: z.string().regex(/^\d{4}$/),
    active: z.boolean()
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PLAYER', issues: parsed.error.issues });

  const playerId = String(req.params.playerId);
  const duplicate = await findPlayerByAlias(parsed.data.nombre, playerId);
  if (duplicate) return res.status(409).json({ error: 'ALIAS_ALREADY_EXISTS' });

  await pool.execute(
    `UPDATE players
     SET alias = :alias, display_name = :alias, birth_year = :birth_year, active = :active
     WHERE id = :player_id`,
    { alias: parsed.data.nombre, birth_year: parsed.data.birth_year, active: parsed.data.active ? 1 : 0, player_id: playerId }
  );
  res.json({ id: playerId, alias: parsed.data.nombre, birth_year: parsed.data.birth_year, active: parsed.data.active });
});

app.get('/api/admin/picks/:playerId', requireAdmin, async (req, res) => {
  const rows = await query(
    `SELECT match_id, home_goals, away_goals, advance_pick, first_goal_pick, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') updated_at
     FROM picks WHERE player_id = :player_id`,
    { player_id: req.params.playerId }
  );
  res.json(rows);
});

app.put('/api/admin/picks/:playerId', requireAdmin, async (req, res) => {
  const parsed = z.array(pickSchema).min(1).max(72).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PICKS', issues: parsed.error.issues });
  for (const item of parsed.data) {
    await pool.execute(
      `INSERT INTO picks (player_id, match_id, home_goals, away_goals, advance_pick, first_goal_pick)
       VALUES (:player_id, :match_id, :home_goals, :away_goals, :advance_pick, :first_goal_pick)
       ON DUPLICATE KEY UPDATE home_goals = VALUES(home_goals), away_goals = VALUES(away_goals), advance_pick = VALUES(advance_pick), first_goal_pick = VALUES(first_goal_pick)`,
      { ...item, advance_pick: item.advance_pick ?? null, first_goal_pick: item.first_goal_pick ?? null, player_id: req.params.playerId }
    );
  }
  res.json({ saved: parsed.data.map((pick) => pick.match_id) });
});

app.post('/api/admin/result', requireAdmin, async (req, res) => {
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_RESULT', issues: parsed.error.issues });
  await pool.execute(
    `UPDATE matches SET home_goals = :home_goals, away_goals = :away_goals, advance = :advance, first_goal = :first_goal WHERE id = :match_id`,
    { ...parsed.data, advance: parsed.data.advance ?? null, first_goal: parsed.data.first_goal ?? null }
  );
  res.json({ ok: true });
});

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  const parsed = z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_SETTINGS', issues: parsed.error.issues });
  for (const [key, value] of Object.entries(parsed.data)) {
    await pool.execute(
      `INSERT INTO settings (\`key\`, value) VALUES (:key, :value)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      { key, value: String(value) }
    );
  }
  res.json({ ok: true });
});

app.get('/api/admin/scores/:playerId', requireAdmin, async (req, res) => {
  const rows = await query<any>(
    `SELECT pk.match_id, pk.home_goals, pk.away_goals, pk.advance_pick, pk.first_goal_pick, m.home_goals real_home, m.away_goals real_away, m.advance real_advance, m.first_goal real_first_goal
     FROM picks pk JOIN matches m ON m.id = pk.match_id WHERE pk.player_id = :player_id`,
    { player_id: req.params.playerId }
  );
  res.json(rows.map((row: any) => ({ ...row, score: scorePick(row.home_goals, row.away_goals, row.real_home, row.real_away, row.advance_pick, row.real_advance, row.first_goal_pick, row.real_first_goal) })));
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, '../client');
app.use(express.static(clientDir));
app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: 'SERVER_ERROR' });
});

async function start() {
  if (process.env.AUTO_SETUP === 'true') {
    console.log('Running database setup');
    await setupDatabase();
    console.log('Database setup ready');
  }

  app.listen(port, () => {
    console.log(`Quiniela API listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
