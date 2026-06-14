import { pool } from './pool.js';
import { cdmxToUtcMysql, matchId, matches, teams } from '../data.js';

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const team of teams) {
      await conn.execute(
        `INSERT INTO teams (code, name, flag)
         VALUES (:code, :name, :flag)
         ON DUPLICATE KEY UPDATE name = VALUES(name), flag = VALUES(flag)`,
        team
      );
    }

    for (const match of matches) {
      await conn.execute(
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

    await conn.execute(
      `INSERT INTO settings (\`key\`, value) VALUES
       ('reveal_picks', 'false'),
       ('show_official_results', 'true'),
       ('late_picks_open', 'false'),
       ('show_team_stats', 'false')
       ON DUPLICATE KEY UPDATE value = value`
    );

    await conn.commit();
    console.log(`Seed ready: ${teams.length} teams, ${matches.length} matches`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
