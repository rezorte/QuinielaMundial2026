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
const pickSchema = z.object({
  match_id: z.string().min(3).max(24),
  home_goals: goalSchema,
  away_goals: goalSchema
});
const resultSchema = z.object({
  match_id: z.string().min(3).max(24),
  home_goals: goalSchema.nullable(),
  away_goals: goalSchema.nullable()
});

function lockedExpr() {
  return 'UTC_TIMESTAMP() >= m.kickoff_utc';
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

async function findPlayerByAlias(alias: string, excludeId?: string) {
  const rows = await query<any>(
    `SELECT id, alias, display_name, birth_year
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
      m.home_goals, m.away_goals, ${latePicksOpen ? '0' : lockedExpr()} locked,
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
    show_match_picks: settings.show_match_picks === 'true'
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
    `SELECT team_code, fifa_rank, stars_json, form_json, source_name, source_url, DATE_FORMAT(verified_at, '%Y-%m-%dT%H:%i:%sZ') verified_at
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
    `SELECT match_id, home_goals, away_goals, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') updated_at
     FROM picks WHERE player_id = :player_id`,
    { player_id: req.user!.playerId }
  );
  res.json(rows);
});

app.put('/api/profile', requirePlayer, async (req, res) => {
  const parsed = z.object({
    alias: z.string().trim().min(1).max(80)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PROFILE', issues: parsed.error.issues });
  const duplicate = await findPlayerByAlias(parsed.data.alias, req.user!.playerId);
  if (duplicate) return res.status(409).json({ error: 'ALIAS_ALREADY_EXISTS' });

  await pool.execute(
    `UPDATE players SET alias = :alias WHERE id = :player_id`,
    { alias: parsed.data.alias, player_id: req.user!.playerId }
  );

  res.json({ id: req.user!.playerId, alias: parsed.data.alias });
});

app.post('/api/picks', requirePlayer, async (req, res) => {
  const parsed = z.array(pickSchema).min(1).max(72).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PICKS', issues: parsed.error.issues });

  const saved: string[] = [];
  const rejected: { match_id: string; reason: string }[] = [];
  const settings = await getSettings();
  const latePicksOpen = settings.late_picks_open === 'true';
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
        `INSERT INTO picks (player_id, match_id, home_goals, away_goals)
         VALUES (:player_id, :match_id, :home_goals, :away_goals)
         ON DUPLICATE KEY UPDATE home_goals = VALUES(home_goals), away_goals = VALUES(away_goals)`,
        { ...item, player_id: req.user!.playerId }
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

app.get('/api/standings', async (_req, res) => {
  const rows = await query<any>(`
    SELECT
      p.id player_id, p.alias,
      COALESCE(SUM(CASE
        WHEN m.home_goals IS NULL OR m.away_goals IS NULL THEN 0
        WHEN pk.home_goals = m.home_goals AND pk.away_goals = m.away_goals THEN 3
        WHEN SIGN(pk.home_goals - pk.away_goals) = SIGN(m.home_goals - m.away_goals) THEN 1
        ELSE 0
      END), 0) points,
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
    GROUP BY p.id, p.alias
    ORDER BY points DESC, exacts DESC, results DESC, p.alias ASC
  `);
  res.json(rows.map((row: any, index: number) => ({ ...row, rank: index + 1 })));
});

app.get('/api/matches/:matchId/picks', async (req, res) => {
  const rows = await query<any>(
    `SELECT
      p.id player_id, p.alias,
      pk.home_goals, pk.away_goals,
      m.home_goals real_home_goals, m.away_goals real_away_goals
     FROM picks pk
     JOIN players p ON p.id = pk.player_id
     JOIN matches m ON m.id = pk.match_id
     WHERE pk.match_id = :match_id
     ORDER BY p.alias`,
    { match_id: req.params.matchId }
  );

  res.json(rows.map((row: any) => ({
    player_id: row.player_id,
    alias: row.alias,
    home_goals: row.home_goals,
    away_goals: row.away_goals,
    points: scorePick(row.home_goals, row.away_goals, row.real_home_goals, row.real_away_goals).points
  })));
});

app.get('/api/admin/players', requireAdmin, async (_req, res) => {
  const rows = await query(`SELECT id, alias, display_name, birth_year FROM players ORDER BY alias`);
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
    alias: z.string().trim().min(1).max(80),
    birth_year: z.string().regex(/^\d{4}$/)
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PLAYER', issues: parsed.error.issues });

  const playerId = String(req.params.playerId);
  const duplicate = await findPlayerByAlias(parsed.data.alias, playerId);
  if (duplicate) return res.status(409).json({ error: 'ALIAS_ALREADY_EXISTS' });

  await pool.execute(
    `UPDATE players
     SET alias = :alias, display_name = :alias, birth_year = :birth_year
     WHERE id = :player_id`,
    { alias: parsed.data.alias, birth_year: parsed.data.birth_year, player_id: playerId }
  );
  res.json({ id: playerId, alias: parsed.data.alias, birth_year: parsed.data.birth_year });
});

app.get('/api/admin/picks/:playerId', requireAdmin, async (req, res) => {
  const rows = await query(
    `SELECT match_id, home_goals, away_goals, DATE_FORMAT(updated_at, '%Y-%m-%dT%H:%i:%sZ') updated_at
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
      `INSERT INTO picks (player_id, match_id, home_goals, away_goals)
       VALUES (:player_id, :match_id, :home_goals, :away_goals)
       ON DUPLICATE KEY UPDATE home_goals = VALUES(home_goals), away_goals = VALUES(away_goals)`,
      { ...item, player_id: req.params.playerId }
    );
  }
  res.json({ saved: parsed.data.map((pick) => pick.match_id) });
});

app.post('/api/admin/result', requireAdmin, async (req, res) => {
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_RESULT', issues: parsed.error.issues });
  await pool.execute(
    `UPDATE matches SET home_goals = :home_goals, away_goals = :away_goals WHERE id = :match_id`,
    parsed.data
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
    `SELECT pk.match_id, pk.home_goals, pk.away_goals, m.home_goals real_home, m.away_goals real_away
     FROM picks pk JOIN matches m ON m.id = pk.match_id WHERE pk.player_id = :player_id`,
    { player_id: req.params.playerId }
  );
  res.json(rows.map((row: any) => ({ ...row, score: scorePick(row.home_goals, row.away_goals, row.real_home, row.real_away) })));
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
