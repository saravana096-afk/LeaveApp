import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  card: {
    background: '#fff', borderRadius: '12px', padding: '2.5rem',
    width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: { fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  subtitle: { color: '#718096', marginBottom: '2rem', fontSize: '0.9rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.4rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
    marginBottom: '1.25rem',
  },
  btn: {
    width: '100%', padding: '0.85rem', background: '#e94560', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
    cursor: 'pointer', transition: 'opacity 0.2s',
  },
  error: { background: '#fff5f5', color: '#e53e3e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#718096', fontSize: '0.875rem' },
  link: { color: '#e94560', fontWeight: '600' },
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.subtitle}>Sign in to your account</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>Username</label>
          <input style={s.input} name="username" value={form.username} onChange={handle} required autoFocus />
          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handle} required />
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div style={s.footer}>
          Don't have an account? <Link to="/register" style={s.link}>Register</Link>
        </div>
      </div>
    </div>
  )
}
