import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const root = await mysql.createConnection({
    ...(process.env.DB_SOCKET || process.env.DB_HOST?.startsWith('/cloudsql/')
      ? { socketPath: process.env.DB_SOCKET || process.env.DB_HOST }
      : { host: process.env.DB_HOST }),
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    timezone: 'Z'
  });

  const dbName = process.env.DB_NAME || 'quiniela_mundial_2026';
  await root.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await root.end();

  const db = await mysql.createConnection({
    ...(process.env.DB_SOCKET || process.env.DB_HOST?.startsWith('/cloudsql/')
      ? { socketPath: process.env.DB_SOCKET || process.env.DB_HOST }
      : { host: process.env.DB_HOST }),
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    timezone: 'Z',
    multipleStatements: true
  });

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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS picks (
      player_id CHAR(64) NOT NULL,
      match_id VARCHAR(24) NOT NULL,
      home_goals TINYINT NOT NULL,
      away_goals TINYINT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (player_id, match_id),
      CONSTRAINT fk_picks_player FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      CONSTRAINT fk_picks_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(80) PRIMARY KEY,
      value VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.end();
  console.log('Schema ready');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
