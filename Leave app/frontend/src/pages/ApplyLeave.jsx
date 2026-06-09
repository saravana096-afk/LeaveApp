import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

const ALL_LEAVE_TYPES = ['annual', 'sick', 'personal', 'maternity', 'bereavement']

const s = {
  heading: { fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  sub: { color: '#718096', marginBottom: '2rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '560px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#4a5568', marginBottom: '0.4rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '0.95rem', outline: 'none', marginBottom: '1.25rem',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn: {
    background: '#e94560', color: '#fff', border: 'none', padding: '0.85rem 2rem',
    borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
  },
  info: { background: '#ebf8ff', color: '#2b6cb0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' },
  error: { background: '#fff5f5', color: '#e53e3e', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
  success: { background: '#f0fff4', color: '#276749', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' },
}

export default function ApplyLeave() {
  const { user } = useAuth()
  const LEAVE_TYPES = user?.gender === 'female'
    ? ALL_LEAVE_TYPES
    : ALL_LEAVE_TYPES.filter(t => t !== 'maternity')
  const navigate = useNavigate()
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' })
  const [balances, setBalances] = useState([])
  const [businessDays, setBusinessDays] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/users/${user.id}/leave-balance`).then(r => setBalances(r.data.balances)).catch(() => {})
  }, [user.id])

  useEffect(() => {
    if (form.start_date && form.end_date && form.start_date <= form.end_date) {
      const start = new Date(form.start_date)
      const end = new Date(form.end_date)
      let days = 0
      const cur = new Date(start)
      while (cur <= end) {
        if (cur.getDay() !== 0 && cur.getDay() !== 6) days++
        cur.setDate(cur.getDate() + 1)
      }
      setBusinessDays(days)
    } else {
      setBusinessDays(null)
    }
  }, [form.start_date, form.end_date])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const selectedBalance = balances.find(b => b.leave_type === form.leave_type)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/leaves/request', form)
      setSuccess('Leave request submitted successfully!')
      setTimeout(() => navigate('/my-leaves'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 style={s.heading}>Apply for Leave</h1>
      <p style={s.sub}>Submit a new leave request</p>
      <div style={s.card}>
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>Leave Type</label>
          <select style={s.input} name="leave_type" value={form.leave_type} onChange={handle} required>
            <option value="">Select leave type</option>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>

          {selectedBalance && (
            <div style={s.info}>
              Available balance: <strong>{selectedBalance.remaining_days}</strong> of {selectedBalance.total_days} days
            </div>
          )}

          <div style={s.row}>
            <div>
              <label style={s.label}>Start Date</label>
              <input style={s.input} type="date" name="start_date" value={form.start_date} onChange={handle} required />
            </div>
            <div>
              <label style={s.label}>End Date</label>
              <input style={s.input} type="date" name="end_date" value={form.end_date} onChange={handle} required min={form.start_date} />
            </div>
          </div>

          {businessDays !== null && (
            <div style={s.info}>
              Working days requested: <strong>{businessDays}</strong>
            </div>
          )}

          <label style={s.label}>Reason (optional)</label>
          <textarea
            style={{ ...s.input, minHeight: '100px', resize: 'vertical' }}
            name="reason" value={form.reason} onChange={handle}
            placeholder="Briefly describe the reason for your leave..."
          />

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
