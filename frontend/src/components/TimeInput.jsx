// Hours/minutes/seconds input, shared by Personal records and Settings
export default function TimeInput({ hours, minutes, seconds, onChange }) {
  return (
    <div className="time-fields">
      <TimePart label="h" name="Hours" value={hours} max={99} onChange={(value) => onChange({ hours: value, minutes, seconds })} />
      <TimePart label="m" name="Minutes" value={minutes} max={59} onChange={(value) => onChange({ hours, minutes: value, seconds })} />
      <TimePart label="s" name="Seconds" value={seconds} max={59} onChange={(value) => onChange({ hours, minutes, seconds: value })} />
    </div>
  )
}

function TimePart({ label, name, value, max, onChange }) {
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
        aria-label={name}
      />
      <span>{label}</span>
    </label>
  )
}

export function splitDuration(totalSeconds) {
  const total = Number(totalSeconds)
  if (!Number.isFinite(total) || total <= 0) return { hours: '', minutes: '', seconds: '' }
  return {
    hours: String(Math.floor(total / 3600)),
    minutes: String(Math.floor((total % 3600) / 60)),
    seconds: String(total % 60),
  }
}

export function joinDuration({ hours, minutes, seconds }) {
  return Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)
}
