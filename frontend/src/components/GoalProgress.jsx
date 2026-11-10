import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import Card from './Card'

const trendConfig = {
  improving: { label: 'Improving', icon: TrendingUp, className: 'trend-improving' },
  stable: { label: 'Stable', icon: Minus, className: 'trend-stable' },
  declining: { label: 'Declining', icon: TrendingDown, className: 'trend-declining' },
  unknown: { label: 'Not enough data', icon: Minus, className: 'trend-unknown' },
}

export default function GoalProgress({ progress }) {
  const score = Number.isFinite(Number(progress?.score))
    ? Math.min(100, Math.max(0, Number(progress.score)))
    : null
  const trend = trendConfig[progress?.trend] || trendConfig.unknown
  const TrendIcon = trend.icon

  return (
    <Card className="goal-progress-card">
      <div className="section-kicker">PROGRESS</div>
      {score === null ? (
        <p className="muted">No progress assessment yet.</p>
      ) : (
        <>
          <div className="score-line">
            <span className="score">{score}</span>
            <span className="score-total">/ 100</span>
            <span className={`trend ${trend.className}`}><TrendIcon size={13} /> {trend.label}</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={score} aria-valuemin="0" aria-valuemax="100" aria-label="Goal progress">
            <div className="progress-fill" style={{ width: `${score}%` }} />
          </div>
        </>
      )}
      {progress?.explanation && <p className="card-copy">{progress.explanation}</p>}
      <p className="progress-context">Measured against your current training phase — not race readiness today.</p>
    </Card>
  )
}
