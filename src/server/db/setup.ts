import mysql from 'mysql2/promise';
import { cdmxToUtcMysql, matchId, matches, teams } from '../data.js';
import { fifaRankSeed, teamStatsSeed, worldCupHistorySeed } from '../statsSeed.js';

function connectionBase(database?: string) {
  return {
    ...(process.env.DB_SOCKET || process.env.DB_HOST?.startsWith('/cloudsql/')
      ? { socketPath: process.env.DB_SOCKET || process.env.DB_HOST }
      : { host: process.env.DB_HOST }),
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database,
    timezone: 'Z',
    namedPlaceholders: true
  };
}

export async function setupDatabase() {
  const dbName = process.env.DB_NAME || 'quiniela_mundial_2026';
  const root = await mysql.createConnection(connectionBase());
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await root.end();

  const db = await mysql.createConnection({ ...connectionBase(dbName), multipleStatements: true });
  await db.query(`
    CREATE TABLE IF NOT EXISTS teams (
      code CHAR(3) PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      flag VARCHAR(8) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(24) PRIMARY KEY,
      grp CHAR(1) NOT NULL,
      jornada TINYINT NOT NULL,
      home CHAR(3) NOT NULL,
      away CHAR(3) NOT NULL,
      kickoff_utc DATETIME NOT NULL,
      home_goals TINYINT NULL,
      away_goals TINYINT NULL,
      advance CHAR(1) NULL,
      first_goal CHAR(1) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_matches_kickoff (kickoff_utc),
      INDEX idx_matches_grp (grp, jornada),
      CONSTRAINT fk_matches_home FOREIGN KEY (home) REFERENCES teams(code),
      CONSTRAINT fk_matches_away FOREIGN KEY (away) REFERENCES teams(code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS players (
      id CHAR(64) PRIMARY KEY,
      alias VARCHAR(80) NOT NULL,
      display_name VARCHAR(120) NOT NULL,
      birth_year CHAR(4) NOT NULL,
      active TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS picks (
      player_id CHAR(64) NOT NULL,
      match_id VARCHAR(24) NOT NULL,
      home_goals TINYINT NOT NULL,
      away_goals TINYINT NOT NULL,
      advance_pick CHAR(1) NULL,
      first_goal_pick CHAR(1) NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, match_id),
      CONSTRAINT fk_picks_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      CONSTRAINT fk_picks_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(80) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS team_info (
      team_code CHAR(3) PRIMARY KEY,
      fifa_rank SMALLINT NULL,
      first_world_cup SMALLINT NULL,
      world_cup_appearances SMALLINT NULL,
      world_cup_played SMALLINT NULL,
      world_cup_wins SMALLINT NULL,
      world_cup_draws SMALLINT NULL,
      world_cup_losses SMALLINT NULL,
      world_cup_goals_for SMALLINT NULL,
      world_cup_goals_against SMALLINT NULL,
      best_world_cup_result VARCHAR(120) NULL,
      coach VARCHAR(120) NULL,
      stars_json JSON NULL,
      squad_json JSON NULL,
      form_json JSON NULL,
      source_name VARCHAR(120) NULL,
      source_url VARCHAR(500) NULL,
      verified_at DATETIME NULL,
      CONSTRAINT fk_team_info_team FOREIGN KEY (team_code) REFERENCES teams(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS head_to_head (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_a CHAR(3) NOT NULL,
      team_b CHAR(3) NOT NULL,
      last_match_date DATE NULL,
      last_match_score VARCHAR(20) NULL,
      competition VARCHAR(120) NULL,
      source_name VARCHAR(120) NULL,
      source_url VARCHAR(500) NULL,
      verified_at DATETIME NULL,
      UNIQUE KEY uniq_h2h_pair (team_a, team_b),
      CONSTRAINT fk_h2h_team_a FOREIGN KEY (team_a) REFERENCES teams(code) ON DELETE CASCADE,
      CONSTRAINT fk_h2h_team_b FOREIGN KEY (team_b) REFERENCES teams(code) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  const [activeColumns] = await db.execute<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = :schema_name AND TABLE_NAME = 'players' AND COLUMN_NAME = 'active'`,
    { schema_name: dbName }
  );
  if (activeColumns.length === 0) {
    await db.execute(`ALTER TABLE players ADD COLUMN active TINYINT NOT NULL DEFAULT 1 AFTER birth_year`);
  }

  const matchColumns = [
    ['advance', 'CHAR(1) NULL AFTER away_goals'],
    ['first_goal', 'CHAR(1) NULL AFTER advance']
  ];
  for (const [columnName, columnDefinition] of matchColumns) {
    const [columns] = await db.execute<any[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = :schema_name AND TABLE_NAME = 'matches' AND COLUMN_NAME = :column_name`,
      { schema_name: dbName, column_name: columnName }
    );
    if (columns.length === 0) {
      await db.execute(`ALTER TABLE matches ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  const pickColumns = [
    ['advance_pick', 'CHAR(1) NULL AFTER away_goals'],
    ['first_goal_pick', 'CHAR(1) NULL AFTER advance_pick']
  ];
  for (const [columnName, columnDefinition] of pickColumns) {
    const [columns] = await db.execute<any[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = :schema_name AND TABLE_NAME = 'picks' AND COLUMN_NAME = :column_name`,
      { schema_name: dbName, column_name: columnName }
    );
    if (columns.length === 0) {
      await db.execute(`ALTER TABLE picks ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  const teamInfoColumns = [
    ['first_world_cup', 'SMALLINT NULL AFTER fifa_rank'],
    ['world_cup_appearances', 'SMALLINT NULL AFTER first_world_cup'],
    ['world_cup_played', 'SMALLINT NULL AFTER world_cup_appearances'],
    ['world_cup_wins', 'SMALLINT NULL AFTER world_cup_played'],
    ['world_cup_draws', 'SMALLINT NULL AFTER world_cup_wins'],
    ['world_cup_losses', 'SMALLINT NULL AFTER world_cup_draws'],
    ['world_cup_goals_for', 'SMALLINT NULL AFTER world_cup_losses'],
    ['world_cup_goals_against', 'SMALLINT NULL AFTER world_cup_goals_for'],
    ['best_world_cup_result', 'VARCHAR(120) NULL AFTER world_cup_goals_against'],
    ['coach', 'VARCHAR(120) NULL AFTER best_world_cup_result'],
    ['squad_json', 'JSON NULL AFTER stars_json']
  ];
  for (const [columnName, columnDefinition] of teamInfoColumns) {
    const [columns] = await db.execute<any[]>(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = :schema_name AND TABLE_NAME = 'team_info' AND COLUMN_NAME = :column_name`,
      { schema_name: dbName, column_name: columnName }
    );
    if (columns.length === 0) {
      await db.execute(`ALTER TABLE team_info ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  for (const team of teams) {
    await db.execute(
      `INSERT INTO teams (code, name, flag)
       VALUES (:code, :name, :flag)
       ON DUPLICATE KEY UPDATE name = VALUES(name), flag = VALUES(flag)`,
      team
    );
  }

  for (const match of matches) {
    await db.execute(
      `INSERT INTO matches (id, grp, jornada, home, away, kickoff_utc)
       VALUES (:id, :grp, :jornada, :home, :away, :kickoff_utc)
       ON DUPLICATE KEY UPDATE
         grp = VALUES(grp),
         jornada = VALUES(jornada),
         home = VALUES(home),
         away = VALUES(away),
         kickoff_utc = VALUES(kickoff_utc)`,
      { ...match, id: matchId(match), kickoff_utc: cdmxToUtcMysql(match.cdmx) }
    );
  }

  await db.execute(
    `INSERT INTO settings (\`key\`, value) VALUES
     ('reveal_picks', 'false'),
     ('show_official_results', 'true'),
     ('late_picks_open', 'false'),
     ('show_team_stats', 'false'),
     ('registration_open', 'true'),
     ('show_match_picks', 'false'),
     ('show_pick_scores', 'true')
     ON DUPLICATE KEY UPDATE value = value`
  );

  for (const [teamCode, stats] of Object.entries(teamStatsSeed)) {
    const history = worldCupHistorySeed[teamCode];
    await db.execute(
      `INSERT INTO team_info (
         team_code, fifa_rank, first_world_cup, world_cup_appearances, world_cup_played, world_cup_wins, world_cup_draws,
         world_cup_losses, world_cup_goals_for, world_cup_goals_against,
         best_world_cup_result, coach, stars_json, squad_json, source_name, source_url, verified_at
       )
       VALUES (
         :team_code, :fifa_rank, :first_world_cup, :world_cup_appearances, :world_cup_played, :world_cup_wins, :world_cup_draws,
         :world_cup_losses, :world_cup_goals_for, :world_cup_goals_against,
         :best_world_cup_result, :coach, CAST(:stars_json AS JSON), CAST(:squad_json AS JSON),
         :source_name, :source_url, UTC_TIMESTAMP()
       )
       ON DUPLICATE KEY UPDATE
         fifa_rank = VALUES(fifa_rank),
         first_world_cup = VALUES(first_world_cup),
         world_cup_appearances = VALUES(world_cup_appearances),
         world_cup_played = VALUES(world_cup_played),
         world_cup_wins = VALUES(world_cup_wins),
         world_cup_draws = VALUES(world_cup_draws),
         world_cup_losses = VALUES(world_cup_losses),
         world_cup_goals_for = VALUES(world_cup_goals_for),
         world_cup_goals_against = VALUES(world_cup_goals_against),
         best_world_cup_result = VALUES(best_world_cup_result),
         coach = VALUES(coach),
         stars_json = VALUES(stars_json),
         squad_json = VALUES(squad_json),
         source_name = VALUES(source_name),
         source_url = VALUES(source_url),
         verified_at = VALUES(verified_at)`,
      {
        team_code: teamCode,
        fifa_rank: stats.fifaRank ?? fifaRankSeed[teamCode] ?? null,
        first_world_cup: history?.firstWorldCup ?? null,
        world_cup_appearances: history?.appearances ?? stats.worldCup?.appearances ?? null,
        world_cup_played: history?.played ?? null,
        world_cup_wins: history?.wins ?? stats.worldCup?.wins ?? null,
        world_cup_draws: history?.draws ?? stats.worldCup?.draws ?? null,
        world_cup_losses: history?.losses ?? stats.worldCup?.losses ?? null,
        world_cup_goals_for: history?.goalsFor ?? stats.worldCup?.goalsFor ?? null,
        world_cup_goals_against: history?.goalsAgainst ?? stats.worldCup?.goalsAgainst ?? null,
        best_world_cup_result: stats.worldCup?.bestResult ?? (history?.played === 0 ? 'Debut en 2026' : null),
        coach: history?.coach ?? stats.coach ?? null,
        stars_json: JSON.stringify(stats.stars),
        squad_json: JSON.stringify(stats.squad ?? null),
        source_name: stats.sourceName,
        source_url: stats.sourceUrl ?? null
      }
    );
  }

  await db.end();
}
