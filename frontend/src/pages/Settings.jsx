import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, Pencil, Target, User } from 'lucide-react'
import Card from '../components/Card'
import TimeInput, { joinDuration, splitDuration } from '../components/TimeInput'
import { getSettings, updateSettings } from '../services/api'

const sexOptions = { male: 'Male', female: 'Female' }
const languageOptions = { english: 'English', danish: 'Danish' }
const eventOptions = { road_race: 'Road race', trail_race: 'Trail race', track: 'Track' }

export default function Settings({ onBack }) {
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // 'profile' | 'goal' | null

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setError(err.message || 'Could not load settings.'))
  }, [])

  // PUT /settings needs every field, so merge the edited section into the current values
  const save = async (changes) => {
    const saved = await updateSettings({ ...settings, ...changes })
    setSettings(saved)
    setEditing(null)
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">PREFERENCES</div>
          <h1>Settings<span className="accent-dot">.</span></h1>
        </div>
        <button className="icon-button" onClick={onBack} aria-label="Back to dashboard"><ArrowLeft size={18} /></button>
      </header>

      {error && <div className="error-banner" role="alert"><AlertTriangle size={17} /><span>{error}</span></div>}
      {!settings && !error && <div className="loading-state"><div className="loader" /><p>Loading settings…</p></div>}

      {settings && (
        <>
          <SettingsSection title="PROFILE" icon={User} editing={editing === 'profile'} onEdit={() => setEditing('profile')}>
            {editing === 'profile' ? (
              <ProfileForm settings={settings} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <>
                <SettingRow label="Date of birth" value={formatDate(settings.date_of_birth)} />
                <SettingRow label="Sex" value={optionLabel(sexOptions, settings.sex)} />
                <SettingRow label="Language" value={optionLabel(languageOptions, settings.language)} />
              </>
            )}
          </SettingsSection>

          <SettingsSection title="TRAINING GOAL" icon={Target} editing={editing === 'goal'} onEdit={() => setEditing('goal')}>
            {editing === 'goal' ? (
              <GoalForm settings={settings} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <>
                <SettingRow label="Name" value={settings.goal_name || '—'} />
                <SettingRow label="Event" value={optionLabel(eventOptions, settings.goal_event)} />
                <SettingRow label="Distance" value={formatDistance(settings.goal_distance_meters)} />
                <SettingRow label="Target time" value={formatDuration(settings.goal_target_time_seconds)} />
                <SettingRow label="Date" value={formatDate(settings.goal_date)} />
              </>
            )}
          </SettingsSection>
        </>
      )}
      <p className="settings-footnote">Language and goal changes are used from the next coaching advice.</p>
    </main>
  )
}

function SettingsSection({ title, icon: Icon, editing, onEdit, children }) {
  return (
    <Card className="settings-card">
      <div className="session-card-top">
        <div className="section-kicker"><Icon size={15} /> {title}</div>
        {!editing && (
          <button className="icon-button small-icon-button" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>
            <Pencil size={15} />
          </button>
        )}
      </div>
      {children}
    </Card>
  )
}

function SettingRow({ label, value }) {
  return (
    <div className="setting-row">
      <strong>{label}</strong>
      <span className="setting-value">{value}</span>
    </div>
  )
}

function ProfileForm({ settings, onSave, onCancel }) {
  const [dateOfBirth, setDateOfBirth] = useState(settings.date_of_birth || '')
  const [sex, setSex] = useState(settings.sex || '')
  const [language, setLanguage] = useState(settings.language || '')

  const validate = () => {
    if (!dateOfBirth || !sex || !language) return 'Fill in all fields.'
    return null
  }

  return (
    <SettingsForm validate={validate} onSave={() => onSave({ date_of_birth: dateOfBirth, sex, language })} onCancel={onCancel}>
      <Field label="Date of birth" id="date_of_birth">
        <input id="date_of_birth" className="text-input" type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      </Field>
      <Field label="Sex" id="sex">
        <Select id="sex" options={sexOptions} value={sex} onChange={setSex} />
      </Field>
      <Field label="Language" id="language">
        <Select id="language" options={languageOptions} value={language} onChange={setLanguage} />
      </Field>
    </SettingsForm>
  )
}

function GoalForm({ settings, onSave, onCancel }) {
  const [name, setName] = useState(settings.goal_name || '')
  const [event, setEvent] = useState(settings.goal_event || '')
  const [distanceKm, setDistanceKm] = useState(settings.goal_distance_meters ? String(settings.goal_distance_meters / 1000) : '')
  const [time, setTime] = useState(() => splitDuration(settings.goal_target_time_seconds))
  const [date, setDate] = useState(settings.goal_date || '')

  // Accept both "21.097" and "21,097" (Danish keyboards)
  const distanceMeters = Math.round(Number(distanceKm.replace(',', '.')) * 1000)

  const validate = () => {
    if (!name.trim() || !event || !date) return 'Fill in all fields.'
    if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 'Enter a distance greater than zero.'
    if (joinDuration(time) <= 0) return 'Enter a target time greater than zero.'
    return null
  }

  const handleSave = () => onSave({
    goal_name: name.trim(),
    goal_event: event,
    goal_distance_meters: distanceMeters,
    goal_target_time_seconds: joinDuration(time),
    goal_date: date,
  })

  return (
    <SettingsForm validate={validate} onSave={handleSave} onCancel={onCancel}>
      <Field label="Name" id="goal_name">
        <input id="goal_name" className="text-input" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Event" id="goal_event">
        <Select id="goal_event" options={eventOptions} value={event} onChange={setEvent} />
      </Field>
      <Field label="Distance (km)" id="goal_distance">
        <input id="goal_distance" className="text-input" type="text" inputMode="decimal" required value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
      </Field>
      <Field label="Target time">
        <TimeInput {...time} onChange={setTime} />
      </Field>
      <Field label="Date" id="goal_date">
        <input id="goal_date" className="text-input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </SettingsForm>
  )
}

function SettingsForm({ validate, onSave, onCancel, children }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave()
    } catch (err) {
      setError(err.message || 'Could not save settings.')
      setSaving(false)
    }
  }

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      {children}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  )
}

function Field({ label, id, children }) {
  return (
    <div className="form-field">
      {id ? <label className="field-label" htmlFor={id}>{label}</label> : <div className="field-label">{label}</div>}
      {children}
    </div>
  )
}

// Keeps an unknown stored value selectable, so opening the form never changes it silently
function Select({ id, options, value, onChange }) {
  const entries = Object.entries(options)
  if (value && !(value in options)) entries.unshift([value, value])
  return (
    <select id={id} className="text-input" required value={value} onChange={(e) => onChange(e.target.value)}>
      {!value && <option value="">Choose…</option>}
      {entries.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  )
}

function optionLabel(options, value) {
  return options[value] || value || '—'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDistance(meters) {
  const km = Number(meters) / 1000
  return Number.isFinite(km) && km > 0 ? `${km.toLocaleString('en-GB', { maximumFractionDigits: 3 })} km` : '—'
}

function formatDuration(totalSeconds) {
  const seconds = Number(totalSeconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const { hours, minutes, seconds: secs } = splitDuration(seconds)
  return [hours, minutes, secs].map((part) => part.padStart(2, '0')).join(':')
}
