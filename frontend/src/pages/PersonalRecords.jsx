import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, Pencil, Route, Timer, Trophy } from 'lucide-react'
import Card from '../components/Card'
import TimeInput, { joinDuration, splitDuration } from '../components/TimeInput'
import { getLongestRun, getPersonalRecords, updatePersonalRecord } from '../services/api'

export default function PersonalRecords() {
  const [records, setRecords] = useState(null)
  const [longestRun, setLongestRun] = useState(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    getPersonalRecords()
      .then(setRecords)
      .catch((err) => setError(err.message || 'Could not load personal records.'))
    // Loaded separately, so a failure here doesn't hide the records
    getLongestRun()
      .then(setLongestRun)
      .catch(() => setLongestRun(null))
  }, [])

  const handleSaved = (saved) => {
    setRecords((current) => current.map((record) => (record.id === saved.id ? saved : record)))
    setEditingId(null)
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">YOUR BEST EFFORTS</div>
          <h1>Personal records<span className="accent-dot">.</span></h1>
        </div>
      </header>

      {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
      {!records && !error && <div className="loading-state"><div className="loader" /><p>Loading records…</p></div>}

      {Number(longestRun?.distance_meters) > 0 && <LongestRunCard longestRun={longestRun} />}

      {records && (
        <div className="session-list">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              editing={editingId === record.id}
              onEdit={() => setEditingId(record.id)}
              onCancel={() => setEditingId(null)}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
      <p className="settings-footnote">Records are included in the training context the coach uses.</p>
    </main>
  )
}

function LongestRunCard({ longestRun }) {
  const km = Number(longestRun.distance_meters) / 1000

  return (
    <Card className="longest-run-card">
      <div className="goal-overview-top">
        <div className="section-kicker"><Route size={15} /> LONGEST RUN</div>
        <span className="auto-badge">AUTO</span>
      </div>
      <div className="longest-run-distance">
        {km.toLocaleString('en-GB', { maximumFractionDigits: 2 })}<span> km</span>
      </div>
      {longestRun.date && (
        <div className="goal-detail"><CalendarDays size={15} /><span>{formatDate(longestRun.date.slice(0, 10))}</span></div>
      )}
      <p className="progress-context">Updated automatically from Garmin.</p>
    </Card>
  )
}

function RecordCard({ record, editing, onEdit, onCancel, onSaved }) {
  const hasTime = Number(record.time_seconds) > 0

  return (
    <Card className="session-card record-card">
      <div className="session-card-top">
        <div className="session-title-wrap">
          <Trophy size={16} className="record-icon" />
          <h3>{record.name}</h3>
        </div>
        {!editing && (
          <button className="icon-button small-icon-button" onClick={onEdit} aria-label={`Edit ${record.name}`}>
            <Pencil size={15} />
          </button>
        )}
      </div>

      {editing ? (
        <RecordForm record={record} onCancel={onCancel} onSaved={onSaved} />
      ) : hasTime ? (
        <div className="session-metrics">
          <div className="metric"><Timer size={15} /><strong>{formatDuration(record.time_seconds)}</strong></div>
          <div className="metric record-pace">{formatPace(record.time_seconds, record.distance_meters)}</div>
          {record.date && <div className="metric"><CalendarDays size={15} /><strong>{formatDate(record.date)}</strong></div>}
        </div>
      ) : (
        <p className="muted">No record yet.</p>
      )}
    </Card>
  )
}

function RecordForm({ record, onCancel, onSaved }) {
  const [time, setTime] = useState(() => splitDuration(record.time_seconds))
  const [date, setDate] = useState(record.date || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const total = joinDuration(time)
    if (total <= 0) {
      setError('Enter a time greater than zero.')
      return
    }
    if (!date) {
      setError('Pick a date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      onSaved(await updatePersonalRecord(record.id, { time_seconds: total, date }))
    } catch (err) {
      setError(err.message || 'Could not save the record.')
      setSaving(false)
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <div className="field-label">Time</div>
      <TimeInput {...time} onChange={setTime} />

      <label className="field-label" htmlFor={`date-${record.id}`}>Date</label>
      <input id={`date-${record.id}`} className="text-input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  )
}

function formatDuration(totalSeconds) {
  const { hours, minutes, seconds } = splitDuration(totalSeconds)
  const mm = minutes.padStart(2, '0')
  const ss = seconds.padStart(2, '0')
  return hours !== '0' ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`
}

function formatPace(totalSeconds, meters) {
  const secondsPerKm = Math.round(Number(totalSeconds) / (Number(meters) / 1000))
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) return ''
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, '0')} /km`
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
