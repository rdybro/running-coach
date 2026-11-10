import { RefreshCw, AlertTriangle, CalendarDays, Target, ClipboardList, Timer } from 'lucide-react'
import Card from '../components/Card'
import GoalProgress from '../components/GoalProgress'
import RecommendedSession from '../components/RecommendedSession'

export default function Dashboard({ goal, advice, createdAt, loading, error, onRefresh, hasLoaded }) {
  const sessions = advice?.recommended_sessions?.slice(0, 3) || []
  const adjustments = advice?.plan_adjustments || []

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">YOUR PERSONAL RUNNING COACH</div>
          <h1>Dashboard<span className="accent-dot">.</span></h1>
        </div>
        <button className="icon-button refresh-button" onClick={onRefresh} disabled={loading} aria-label="Generate new advice" title="Generate new advice">
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </header>

      {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}

      {goal && <GoalOverview goal={goal} />}

      {!hasLoaded && loading && <LoadingState />}
      {hasLoaded && advice && (
        <>
          <GoalProgress progress={advice.goal_progress} />

          <div className="section-heading">
            <div>
              <div className="eyebrow">WHAT'S NEXT</div>
              <h2>Recommended sessions<span className="accent-dot">.</span></h2>
            </div>
            <span className="count-label">{sessions.length} / 3</span>
          </div>
          {sessions.length > 0 ? (
            <div className="session-list">
              {sessions.map((session, index) => (
                <RecommendedSession key={`${session.type}-${index}`} session={session} index={index} />
              ))}
            </div>
          ) : (
            <Card><p className="muted">No sessions recommended right now.</p></Card>
          )}

          {adjustments.length > 0 && (
            <Card className="adjustments-card">
              <div className="section-kicker"><ClipboardList size={15} /> PLAN ADJUSTMENTS</div>
              <ul className="adjustment-list">
                {adjustments.map((adjustment, index) => <li key={index}>{adjustment}</li>)}
              </ul>
            </Card>
          )}

          {typeof advice.warning === 'string' && advice.warning.trim() !== '' && (
            <Card className="warnings-card">
              <div className="section-kicker"><AlertTriangle size={15} /> WARNING</div>
              <p className="card-copy">{advice.warning}</p>
            </Card>
          )}
          {createdAt && <p className="updated-note">Last updated {formatDateTime(createdAt)}</p>}
        </>
      )}

      {hasLoaded && !advice && (
        <Card className="empty-state">
          <div className="empty-icon"><Target size={24} /></div>
          <h2>Ready when you are.</h2>
          <p className="card-copy">No coaching advice has been generated yet. Generate your first assessment to get started.</p>
          <button className="primary-button" onClick={onRefresh} disabled={loading}>{loading ? 'Generating...' : 'Generate advice'}</button>
        </Card>
      )}
      {loading && hasLoaded && <div className="refresh-status"><span className="loading-dot" /> Generating fresh advice…</div>}
    </main>
  )
}

function GoalOverview({ goal }) {
  const date = goal.goal_date
  const daysRemaining = getDaysUntilGoal(date)
  const distanceKm = Number(goal.goal_distance_meters) / 1000
  const targetSeconds = Number(goal.goal_target_time_seconds)

  return (
    <Card className="goal-overview-card">
      <div className="goal-overview-top">
        <div className="section-kicker"><Target size={15} /> YOUR GOAL</div>
        {Number.isFinite(distanceKm) && distanceKm > 0 && <span className="goal-distance">{formatDistance(distanceKm)}</span>}
      </div>
      <h2>{goal.goal_name || 'Your running goal'}<span className="accent-dot">.</span></h2>
      <div className="goal-details">
        {date && <div className="goal-detail"><CalendarDays size={15} /><span>{formatGoalDate(date)}</span></div>}
        {Number.isFinite(targetSeconds) && targetSeconds > 0 && (
          <div className="goal-target"><Timer size={15} /> {formatDuration(targetSeconds)}</div>
        )}
      </div>
      {Number.isFinite(daysRemaining) && (
        <div className="goal-countdown">{daysRemaining >= 0 ? `${daysRemaining} days to go` : 'Goal date has passed'}</div>
      )}
    </Card>
  )
}

function LoadingState() {
  return <div className="loading-state"><div className="loader" /><p>Loading your training…</p></div>
}

function getDaysUntilGoal(value) {
  if (!value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const goalDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(goalDate.getTime())) return null
  return Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24))
}

function formatGoalDate(value) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDistance(km) {
  return `${km.toLocaleString('en-GB', { maximumFractionDigits: 1 })} km`
}

function formatDuration(totalSeconds) {
  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':')
}

function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
