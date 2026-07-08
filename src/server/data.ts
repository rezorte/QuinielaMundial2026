export type TeamSeed = { code: string; name: string; flag: string };
export type MatchSeed = { grp: string; jornada: number; home: string; away: string; cdmx: string };

export const teams: TeamSeed[] = [
  ['MEX', 'Mexico', 'MX'], ['RSA', 'Sudafrica', 'ZA'], ['KOR', 'Corea del Sur', 'KR'], ['CZE', 'Chequia', 'CZ'],
  ['CAN', 'Canada', 'CA'], ['BIH', 'Bosnia y Herz.', 'BA'], ['QAT', 'Qatar', 'QA'], ['SUI', 'Suiza', 'CH'],
  ['BRA', 'Brasil', 'BR'], ['MAR', 'Marruecos', 'MA'], ['HAI', 'Haiti', 'HT'], ['SCO', 'Escocia', 'SCT'],
  ['USA', 'Estados Unidos', 'US'], ['AUS', 'Australia', 'AU'], ['PAR', 'Paraguay', 'PY'], ['TUR', 'Turquia', 'TR'],
  ['GER', 'Alemania', 'DE'], ['ECU', 'Ecuador', 'EC'], ['CIV', 'Costa de Marfil', 'CI'], ['CUW', 'Curazao', 'CW'],
  ['NED', 'Paises Bajos', 'NL'], ['JPN', 'Japon', 'JP'], ['TUN', 'Tunez', 'TN'], ['SWE', 'Suecia', 'SE'],
  ['BEL', 'Belgica', 'BE'], ['IRN', 'Iran', 'IR'], ['EGY', 'Egipto', 'EG'], ['NZL', 'Nueva Zelanda', 'NZ'],
  ['ESP', 'Espana', 'ES'], ['URU', 'Uruguay', 'UY'], ['KSA', 'Arabia Saudita', 'SA'], ['CPV', 'Cabo Verde', 'CV'],
  ['FRA', 'Francia', 'FR'], ['SEN', 'Senegal', 'SN'], ['NOR', 'Noruega', 'NO'], ['IRQ', 'Irak', 'IQ'],
  ['ARG', 'Argentina', 'AR'], ['AUT', 'Austria', 'AT'], ['ALG', 'Argelia', 'DZ'], ['JOR', 'Jordania', 'JO'],
  ['POR', 'Portugal', 'PT'], ['COL', 'Colombia', 'CO'], ['UZB', 'Uzbekistan', 'UZ'], ['COD', 'R.D. Congo', 'CD'],
  ['ENG', 'Inglaterra', 'GB-ENG'], ['CRO', 'Croacia', 'HR'], ['PAN', 'Panama', 'PA'], ['GHA', 'Ghana', 'GH']
].map(([code, name, flag]) => ({ code, name, flag }));

export const matches: MatchSeed[] = `
A,1,MEX,RSA,2026-06-11 13:00
A,1,KOR,CZE,2026-06-11 20:00
B,1,CAN,BIH,2026-06-12 13:00
D,1,USA,PAR,2026-06-12 19:00
B,1,QAT,SUI,2026-06-13 13:00
C,1,BRA,MAR,2026-06-13 16:00
C,1,HAI,SCO,2026-06-13 19:00
D,1,AUS,TUR,2026-06-13 22:00
E,1,GER,CUW,2026-06-14 11:00
F,1,NED,JPN,2026-06-14 14:00
E,1,CIV,ECU,2026-06-14 17:00
F,1,SWE,TUN,2026-06-14 20:00
H,1,ESP,CPV,2026-06-15 10:00
G,1,BEL,EGY,2026-06-15 13:00
H,1,KSA,URU,2026-06-15 16:00
G,1,IRN,NZL,2026-06-15 19:00
I,1,FRA,SEN,2026-06-16 13:00
I,1,IRQ,NOR,2026-06-16 16:00
J,1,ARG,ALG,2026-06-16 19:00
J,1,AUT,JOR,2026-06-16 22:00
K,1,POR,COD,2026-06-17 11:00
L,1,ENG,CRO,2026-06-17 14:00
L,1,GHA,PAN,2026-06-17 17:00
K,1,UZB,COL,2026-06-17 20:00
A,2,CZE,RSA,2026-06-18 10:00
B,2,SUI,BIH,2026-06-18 13:00
B,2,CAN,QAT,2026-06-18 16:00
A,2,MEX,KOR,2026-06-18 19:00
D,2,USA,AUS,2026-06-19 13:00
C,2,SCO,MAR,2026-06-19 16:00
C,2,BRA,HAI,2026-06-19 18:30
D,2,TUR,PAR,2026-06-19 21:00
F,2,NED,SWE,2026-06-20 11:00
E,2,GER,CIV,2026-06-20 14:00
E,2,ECU,CUW,2026-06-20 18:00
F,2,TUN,JPN,2026-06-20 22:00
H,2,ESP,KSA,2026-06-21 10:00
G,2,BEL,IRN,2026-06-21 13:00
H,2,URU,CPV,2026-06-21 16:00
G,2,NZL,EGY,2026-06-21 19:00
J,2,ARG,AUT,2026-06-22 11:00
I,2,FRA,IRQ,2026-06-22 15:00
I,2,NOR,SEN,2026-06-22 18:00
J,2,JOR,ALG,2026-06-22 21:00
K,2,POR,UZB,2026-06-23 11:00
L,2,ENG,GHA,2026-06-23 14:00
L,2,PAN,CRO,2026-06-23 17:00
K,2,COL,COD,2026-06-23 20:00
B,3,SUI,CAN,2026-06-24 13:00
B,3,BIH,QAT,2026-06-24 13:00
C,3,SCO,BRA,2026-06-24 16:00
C,3,MAR,HAI,2026-06-24 16:00
A,3,CZE,MEX,2026-06-24 19:00
A,3,RSA,KOR,2026-06-24 19:00
E,3,CUW,CIV,2026-06-25 14:00
E,3,ECU,GER,2026-06-25 14:00
F,3,JPN,SWE,2026-06-25 17:00
F,3,TUN,NED,2026-06-25 17:00
D,3,TUR,USA,2026-06-25 20:00
D,3,PAR,AUS,2026-06-25 20:00
I,3,NOR,FRA,2026-06-26 13:00
I,3,SEN,IRQ,2026-06-26 13:00
H,3,CPV,KSA,2026-06-26 18:00
H,3,URU,ESP,2026-06-26 18:00
G,3,EGY,IRN,2026-06-26 21:00
G,3,NZL,BEL,2026-06-26 21:00
L,3,PAN,ENG,2026-06-27 15:00
L,3,CRO,GHA,2026-06-27 15:00
K,3,COL,POR,2026-06-27 17:30
K,3,COD,UZB,2026-06-27 17:30
J,3,ALG,AUT,2026-06-27 20:00
J,3,JOR,ARG,2026-06-27 20:00
R,4,RSA,CAN,2026-06-28 13:00
R,4,BRA,JPN,2026-06-29 11:00
R,4,GER,PAR,2026-06-29 14:30
R,4,NED,MAR,2026-06-29 19:00
R,4,CIV,NOR,2026-06-30 11:00
R,4,FRA,SWE,2026-06-30 15:00
R,4,MEX,ECU,2026-06-30 19:00
R,4,ENG,COD,2026-07-01 10:00
R,4,BEL,SEN,2026-07-01 14:00
R,4,USA,BIH,2026-07-01 18:00
R,4,ESP,AUT,2026-07-02 13:00
R,4,POR,CRO,2026-07-02 17:00
R,4,SUI,ALG,2026-07-02 21:00
R,4,AUS,EGY,2026-07-03 12:00
R,4,ARG,CPV,2026-07-03 16:00
R,4,COL,GHA,2026-07-03 19:30
O,5,CAN,MAR,2026-07-04 11:00
O,5,PAR,FRA,2026-07-04 15:00
O,5,BRA,NOR,2026-07-05 14:00
O,5,MEX,ENG,2026-07-05 18:00
O,5,POR,ESP,2026-07-06 13:00
O,5,USA,BEL,2026-07-06 18:00
O,5,ARG,EGY,2026-07-07 10:00
O,5,SUI,COL,2026-07-07 14:00
Q,6,FRA,MAR,2026-07-09 14:00
Q,6,ESP,BEL,2026-07-10 13:00
Q,6,NOR,ENG,2026-07-11 15:00
Q,6,ARG,SUI,2026-07-11 19:00
`.trim().split('\n').map((line) => {
  const [grp, jornada, home, away, cdmx] = line.split(',');
  return { grp, jornada: Number(jornada), home, away, cdmx };
});

export function matchId(match: MatchSeed) {
  return `${match.grp}${match.jornada}-${match.home}${match.away}`;
}

export function cdmxToUtcMysql(cdmx: string) {
  const [date, time] = cdmx.split(' ');
  const utc = new Date(`${date}T${time}:00-06:00`);
  return utc.toISOString().slice(0, 19).replace('T', ' ');
}
