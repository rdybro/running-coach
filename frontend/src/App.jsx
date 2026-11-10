import { useCallback, useEffect, useState } from 'react'
import { Activity, Settings as SettingsIcon, Trophy } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import PersonalRecords from './pages/PersonalRecords'
import Settings from './pages/Settings'
import { getAdvice, refreshAdvice } from './services/api'

const navItems = [
  { id: 'home', label: 'Home', icon: Activity },
  { id: 'records', label: 'Records', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [page, setPage] = useState('home')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadAdvice = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResponse(await getAdvice())
    } catch (err) {
      setError(err.message || 'Could not load coaching advice.')
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResponse(await refreshAdvice())
      setHasLoaded(true)
    } catch (err) {
      setError(err.message || 'Could not generate new coaching advice.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdvice()
  }, [loadAdvice])

  const trainingContext = response?.training_context ?? null
  const goal = trainingContext?.profile?.goal ?? null
  const advice = response?.ai_advice ?? null

  return (
    <div className="app-shell">
      <div className="app-content">
        {page === 'home' && (
          <Dashboard
            goal={goal}
            advice={advice}
            createdAt={response?.created_at ?? null}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            hasLoaded={hasLoaded}
          />
        )}
        {page === 'records' && <PersonalRecords />}
        {page === 'settings' && <Settings onBack={() => setPage('home')} />}
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${page === id ? 'active' : ''}`}
            onClick={() => setPage(id)}
            aria-current={page === id ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
