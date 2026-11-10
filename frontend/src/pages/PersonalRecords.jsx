import { useEffect, useState } from 'react'
import { AlertTriangle, CalendarDays, Pencil, Timer, Trophy } from 'lucide-react'
import Card from '../components/Card'
import { getPersonalRecords, updatePersonalRecord } from '../services/api'

export default function PersonalRecords() {
  const [records, setRecords] = useState(null)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    getPersonalRecords()
      .then(setRecords)
      .catch((err) => setError(err.message || 'Could not load personal records.'))
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
  const initial = splitDuration(record.time_seconds)
  const [hours, setHours] = useState(initial.hours)
  const [minutes, setMinutes] = useState(initial.minutes)
  const [seconds, setSeconds] = useState(initial.seconds)
  const [date, setDate] = useState(record.date || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (payload) => {
    setSaving(true)
    setError('')
    try {
      onSaved(await updatePersonalRecord(record.id, payload))
    } catch (err) {
      setError(err.message || 'Could not save the record.')
      setSaving(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const total = Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)
    if (total <= 0) {
      setError('Enter a time greater than zero.')
      return
    }
    save({ time_seconds: total, date: date || null })
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <div className="field-label">Time</div>
      <div className="time-fields">
        <TimeInput label="h" value={hours} onChange={setHours} max={99} />
        <TimeInput label="m" value={minutes} onChange={setMinutes} max={59} />
        <TimeInput label="s" value={seconds} onChange={setSeconds} max={59} />
      </div>

      <label className="field-label" htmlFor={`date-${record.id}`}>Date</label>
      <input id={`date-${record.id}`} className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
        {Number(record.time_seconds) > 0 && (
          <button type="button" className="text-button" onClick={() => save({ time_seconds: null, date: null })} disabled={saving}>Clear</button>
        )}
      </div>
    </form>
  )
}

function TimeInput({ label, value, onChange, max }) {
  return (
    <label className="time-input">
      <input
        className="text-input"
        type="number"
        inputMode="numeric"
        min="0"
        max={max}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={{ h: 'Hours', m: 'Minutes', s: 'Seconds' }[label]}
      />
      <span>{label}</span>
    </label>
  )
}

function splitDuration(totalSeconds) {
  const total = Number(totalSeconds)
  if (!Number.isFinite(total) || total <= 0) return { hours: '', minutes: '', seconds: '' }
  return {
    hours: String(Math.floor(total / 3600)),
    minutes: String(Math.floor((total % 3600) / 60)),
    seconds: String(total % 60),
  }
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
