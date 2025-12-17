// Scoring utilities for Grounded challenges

export interface ProofEvent {
  id: string
  checkpoint_id: string
  team_id?: string
  player_pubkey: string
  state: 'seen' | 'active' | 'redeemed'
  timestamp: number
  nfc_verified: boolean
}

export interface TeamScore {
  team_id: string
  score: number
  elapsed_time: number
  first_activation: number
  last_activation: number
  total_proofs: number
  unique_checkpoints: Set<string>
}

export interface ScoringRules {
  nfc_required: boolean
  scoring_type: 'unique_checkpoints' | 'time_based' | 'points'
  tiebreak: 'elapsed_time' | 'total_time' | 'first_completion'
  bonus_points?: {
    speed_bonus: number
    completion_bonus: number
    perfect_score_bonus: number
  }
}

/**
 * Calculate team scores from proof events
 * @param events Array of proof events
 * @param rules Scoring rules
 * @returns Map of team scores
 */
export function calculateTeamScores(
  events: ProofEvent[], 
  rules: ScoringRules
): Map<string, TeamScore> {
  const teamScores = new Map<string, TeamScore>()
  
  // Group events by team
  const teamEvents = new Map<string, ProofEvent[]>()
  
  events.forEach(event => {
    if (!event.team_id) return
    
    // Filter based on rules
    if (rules.nfc_required && !event.nfc_verified) return
    if (event.state !== 'active') return
    
    if (!teamEvents.has(event.team_id)) {
      teamEvents.set(event.team_id, [])
    }
    teamEvents.get(event.team_id)!.push(event)
  })
  
  // Calculate scores for each team
  teamEvents.forEach((events, teamId) => {
    const score = calculateSingleTeamScore(events, rules)
    teamScores.set(teamId, score)
  })
  
  return teamScores
}

/**
 * Calculate score for a single team
 * @param events Team's proof events
 * @param rules Scoring rules
 * @returns Team score
 */
export function calculateSingleTeamScore(events: ProofEvent[], rules: ScoringRules): TeamScore {
  const uniqueCheckpoints = new Set<string>()
  let firstActivation = Infinity
  let lastActivation = 0
  
  events.forEach(event => {
    uniqueCheckpoints.add(event.checkpoint_id)
    firstActivation = Math.min(firstActivation, event.timestamp)
    lastActivation = Math.max(lastActivation, event.timestamp)
  })
  
  let score = 0
  
  switch (rules.scoring_type) {
    case 'unique_checkpoints':
      score = uniqueCheckpoints.size
      break
    case 'time_based':
      // Score based on speed (inverse of elapsed time)
      const elapsedTime = lastActivation - firstActivation
      score = elapsedTime > 0 ? Math.max(0, 10000 - elapsedTime / 1000) : 0
      break
    case 'points':
      // Custom point system
      score = events.reduce((sum, event) => sum + getEventPoints(event), 0)
      break
  }
  
  // Apply bonuses
  if (rules.bonus_points) {
    const elapsedTime = lastActivation - firstActivation
    
    // Speed bonus (for completing quickly)
    if (elapsedTime < 3600000) { // Less than 1 hour
      score += rules.bonus_points.speed_bonus
    }
    
    // Completion bonus
    if (uniqueCheckpoints.size > 0) {
      score += rules.bonus_points.completion_bonus
    }
    
    // Perfect score bonus (all checkpoints)
    // This would need to be compared against total checkpoints in the route
  }
  
  return {
    team_id: events[0]?.team_id || '',
    score,
    elapsed_time: lastActivation - firstActivation,
    first_activation: firstActivation === Infinity ? 0 : firstActivation,
    last_activation: lastActivation,
    total_proofs: events.length,
    unique_checkpoints: uniqueCheckpoints
  }
}

/**
 * Rank teams based on scores and tiebreak rules
 * @param teamScores Map of team scores
 * @param rules Scoring rules
 * @returns Sorted array of team scores with ranks
 */
export function rankTeams(
  teamScores: Map<string, TeamScore>, 
  rules: ScoringRules
): (TeamScore & { rank: number })[] {
  const scores = Array.from(teamScores.values())
  
  // Sort based on primary score (descending)
  scores.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }
    
    // Apply tiebreak rules
    switch (rules.tiebreak) {
      case 'elapsed_time':
        return a.elapsed_time - b.elapsed_time // Faster wins
      case 'total_time':
        return a.last_activation - b.last_activation // Earlier finish wins
      case 'first_completion':
        return a.first_activation - b.first_activation // Earlier start wins
      default:
        return 0
    }
  })
  
  // Assign ranks (handle ties)
  const rankedScores = scores.map((score, index) => ({
    ...score,
    rank: index + 1
  }))
  
  // Adjust ranks for ties
  for (let i = 1; i < rankedScores.length; i++) {
    if (rankedScores[i].score === rankedScores[i - 1].score) {
      rankedScores[i].rank = rankedScores[i - 1].rank
    }
  }
  
  return rankedScores
}

/**
 * Get points for a specific event (used in points-based scoring)
 * @param event Proof event
 * @returns Points for this event
 */
function getEventPoints(event: ProofEvent): number {
  let points = 100 // Base points for activation
  
  // Bonus for NFC verification
  if (event.nfc_verified) {
    points += 50
  }
  
  // Time-based bonus (earlier activations get more points)
  // This would need context about when the challenge started
  
  return points
}

/**
 * Validate proof event for scoring
 * @param event Proof event to validate
 * @param rules Scoring rules
 * @returns Whether event is valid for scoring
 */
export function isValidProofEvent(event: ProofEvent, rules: ScoringRules): boolean {
  // Must be active state
  if (event.state !== 'active') return false
  
  // Check NFC requirement
  if (rules.nfc_required && !event.nfc_verified) return false
  
  // Must have valid timestamp
  if (!event.timestamp || event.timestamp <= 0) return false
  
  // Must have checkpoint and team
  if (!event.checkpoint_id || !event.team_id) return false
  
  return true
}

/**
 * Calculate leaderboard statistics
 * @param teamScores Map of team scores
 * @returns Leaderboard statistics
 */
export function calculateLeaderboardStats(teamScores: Map<string, TeamScore>) {
  const scores = Array.from(teamScores.values())
  
  if (scores.length === 0) {
    return {
      totalTeams: 0,
      averageScore: 0,
      highestScore: 0,
      totalCheckpoints: 0,
      averageElapsedTime: 0
    }
  }
  
  const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
  const totalElapsedTime = scores.reduce((sum, score) => sum + score.elapsed_time, 0)
  const allCheckpoints = new Set<string>()
  
  scores.forEach(score => {
    score.unique_checkpoints.forEach(cp => allCheckpoints.add(cp))
  })
  
  return {
    totalTeams: scores.length,
    averageScore: totalScore / scores.length,
    highestScore: Math.max(...scores.map(s => s.score)),
    totalCheckpoints: allCheckpoints.size,
    averageElapsedTime: totalElapsedTime / scores.length
  }
}