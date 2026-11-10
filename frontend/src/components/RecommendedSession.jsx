import { Clock3, Route, Dumbbell } from 'lucide-react'
import Card from './Card'

const sessionTypes = {
  easy_run: { label: 'Easy run', badge: 'EASY', icon: Route },
  quality_run: { label: 'Quality run', badge: 'QUALITY', icon: Route },
  long_run: { label: 'Long run', badge: 'LONG', icon: Route },
  strength: { label: 'Strength', badge: 'STRENGTH', icon: Dumbbell },
}

export default function RecommendedSession({ session, index }) {
  const config = sessionTypes[session?.type] || { label: 'Training session', badge: 'SESSION', icon: Route }
  const Icon = config.icon
  const distance = Number(session?.distance_km)
  const hasDistance = session?.distance_km != null && Number.isFinite(distance) && distance > 0
  const duration = Number(session?.duration_minutes)
  const hasDuration = session?.duration_minutes != null && Number.isFinite(duration) && duration > 0

  return (
    <Card className={`session-card session-${session?.type || 'other'}`}>
      <div className="session-card-top">
        <div className="session-title-wrap">
          <span className="session-index">0{index + 1}</span>
          <h3>{config.label}</h3>
        </div>
        <span className={`session-badge badge-${session?.type || 'other'}`}>{config.badge}</span>
      </div>
      {(hasDistance || hasDuration) && (
        <div className="session-metrics">
          {hasDistance && <div className="metric"><Icon size={15} /><strong>{formatNumber(distance)} km</strong></div>}
          {hasDuration && <div className="metric"><Clock3 size={15} /><strong>{duration} min</strong></div>}
        </div>
      )}
      {session?.description && <p className="card-copy">{session.description}</p>}
    </Card>
  )
}

function formatNumber(value) {
  return value.toLocaleString('en-GB', { maximumFractionDigits: 1 })
}
