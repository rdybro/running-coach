import { ArrowLeft, Target, CalendarDays, Timer, Route } from 'lucide-react'

export default function Settings({ goal, onBack }) {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">PREFERENCES</div>
          <h1>Settings<span className="accent-dot">.</span></h1>
        </div>
        <button className="icon-button" onClick={onBack} aria-label="Back to dashboard"><ArrowLeft size={18} /></button>
      </header>

      <section className="card settings-card">
        <div className="section-kicker"><Target size={15} /> TRAINING GOAL</div>
        {goal ? (
          <>
            <div className="setting-row">
              <div><strong>Event</strong><p className="muted">{goal.goal_name || '—'}</p></div>
            </div>
            <div className="setting-row">
              <div><strong>Date</strong><p className="muted">{formatDate(goal.goal_date)}</p></div>
              <CalendarDays size={17} className="setting-icon" />
            </div>
            <div className="setting-row">
              <div><strong>Distance</strong><p className="muted">{formatDistance(goal.goal_distance_meters)}</p></div>
              <Route size={17} className="setting-icon" />
            </div>
            <div className="setting-row">
              <div><strong>Target time</strong><p className="muted">{formatDuration(goal.goal_target_time_seconds)}</p></div>
              <Timer size={17} className="setting-icon" />
            </div>
          </>
        ) : (
          <p className="muted">No training goal available from the API.</p>
        )}
      </section>
      <p className="settings-footnote">Your goal is managed by the backend and loaded from your training data.</p>
    </main>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDistance(meters) {
  const km = Number(meters) / 1000
  return Number.isFinite(km) && km > 0 ? `${km.toLocaleString('en-GB', { maximumFractionDigits: 1 })} km` : '—'
}

function formatDuration(totalSeconds) {
  const seconds = Number(totalSeconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':')
}
