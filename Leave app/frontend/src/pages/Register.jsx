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
    width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  title: { fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  subtitle: { color: '#718096', marginBottom: '2rem', fontSize: '0.9rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.4rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.95rem', outline: 'none', marginBottom: '1.25rem',
  },
  btn: {
    width: '100%', padding: '0.85rem', background: '#e94560', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
  },
  error: { background: '#fff5f5', color: '#e53e3e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { background: '#f0fff4', color: '#276749', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#718096', fontSize: '0.875rem' },
  link: { color: '#e94560', fontWeight: '600' },
}

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Other']

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', department: '', gender: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSuccess('Account created! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Create account</h1>
        <p style={s.subtitle}>Join the leave management system</p>
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}
        <form onSubmit={submit}>
          <div style={s.row}>
            <div>
              <label style={s.label}>First name</label>
              <input style={s.input} name="first_name" value={form.first_name} onChange={handle} required />
            </div>
            <div>
              <label style={s.label}>Last name</label>
              <input style={s.input} name="last_name" value={form.last_name} onChange={handle} required />
            </div>
          </div>
          <label style={s.label}>Username</label>
          <input style={s.input} name="username" value={form.username} onChange={handle} required />
          <label style={s.label}>Email</label>
          <input style={s.input} name="email" type="email" value={form.email} onChange={handle} required />
          <label style={s.label}>Password</label>
          <input style={s.input} name="password" type="password" value={form.password} onChange={handle} required minLength={6} />
          <label style={s.label}>Gender</label>
          <select style={s.input} name="gender" value={form.gender} onChange={handle} required>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <label style={s.label}>Department</label>
          <select style={s.input} name="department" value={form.department} onChange={handle}>
            <option value="">Select department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
