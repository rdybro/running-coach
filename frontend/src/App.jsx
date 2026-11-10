import { useCallback, useEffect, useState } from 'react'
import { Activity, Settings as SettingsIcon } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { getAdvice, refreshAdvice } from './services/api'

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
        {page === 'home' ? (
          <Dashboard
            goal={goal}
            advice={advice}
            createdAt={response?.created_at ?? null}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            hasLoaded={hasLoaded}
          />
        ) : (
          <Settings goal={goal} onBack={() => setPage('home')} />
        )}
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        <button className={`nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
          <Activity size={19} />
          <span>Home</span>
        </button>
        <button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
          <SettingsIcon size={19} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  )
}
