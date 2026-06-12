export function outcome(home: number, away: number) {
  if (home > away) return 'H';
  if (home < away) return 'A';
  return 'D';
}

export function scorePick(pickHome: number, pickAway: number, realHome: number | null, realAway: number | null) {
  if (realHome === null || realAway === null) return { points: 0, exact: 0, result: 0 };
  if (pickHome === realHome && pickAway === realAway) return { points: 3, exact: 1, result: 1 };
  if (outcome(pickHome, pickAway) === outcome(realHome, realAway)) return { points: 1, exact: 0, result: 1 };
  return { points: 0, exact: 0, result: 0 };
}
