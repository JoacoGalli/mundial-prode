export function calculatePoints(
  pred: { home: number; away: number },
  result: { home: number; away: number }
): number {
  const exactScore = pred.home === result.home && pred.away === result.away;
  const predWinner = Math.sign(pred.home - pred.away);
  const realWinner = Math.sign(result.home - result.away);
  const correctWinner = predWinner === realWinner;
  const correctHome = pred.home === result.home;
  const correctAway = pred.away === result.away;
  const oneTeamCorrect = correctHome !== correctAway;

  if (exactScore) return 12;         // Exact Score: 9 + 3 bonus
  if (correctWinner && (correctHome || correctAway)) return 7; // General Result
  if (correctWinner) return 5;       // Partial Result
  if (oneTeamCorrect) return 2;      // One Team's Score
  return 0;
}
