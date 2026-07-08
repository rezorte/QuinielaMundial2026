export function outcome(home: number, away: number) {
  if (home > away) return 'H';
  if (home < away) return 'A';
  return 'D';
}

export function scorePick(
  pickHome: number,
  pickAway: number,
  realHome: number | null,
  realAway: number | null,
  pickAdvance?: string | null,
  realAdvance?: string | null,
  pickFirstGoal?: string | null,
  realFirstGoal?: string | null
) {
  if (realHome === null || realAway === null) return { points: 0, exact: 0, result: 0, advance: 0, firstGoal: 0 };
  const exact = pickHome === realHome && pickAway === realAway ? 1 : 0;
  const result = exact || outcome(pickHome, pickAway) === outcome(realHome, realAway) ? 1 : 0;
  const advance = pickAdvance && realAdvance && pickAdvance === realAdvance ? 1 : 0;
  const firstGoal = pickFirstGoal && realFirstGoal && pickFirstGoal === realFirstGoal ? 1 : 0;
  return { points: (exact ? 3 : result ? 1 : 0) + advance + firstGoal, exact, result, advance, firstGoal };
}
