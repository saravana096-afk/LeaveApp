import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'

const LEAVE_COLORS = {
  annual: '#3182ce',
  sick: '#e53e3e',
  personal: '#805ad5',
  maternity: '#d53f8c',
  bereavement: '#718096',
}

const s = {
  greeting: { fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  sub: { color: '#718096', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: {
    background: '#fff', borderRadius: '12px', padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #3182ce',
  },
  cardTitle: { fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', marginBottom: '0.5rem' },
  cardDays: { fontSize: '2.5rem', fontWeight: '700', lineHeight: 1 },
  cardRemain: { fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' },
  section: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' },
  applyBtn: {
    background: '#e94560', color: '#fff', border: 'none', padding: '0.5rem 1.25rem',
    borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
    display: 'inline-block',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', fontWeight: '600', color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.85rem 0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #f7fafc' },
  empty: { textAlign: 'center', color: '#a0aec0', padding: '2rem', fontSize: '0.9rem' },
}

const statusColor = { pending: '#dd6b20', approved: '#276749', rejected: '#c53030', cancelled: '#718096' }
const statusBg = { pending: '#fffaf0', approved: '#f0fff4', rejected: '#fff5f5', cancelled: '#f7fafc' }

function StatusBadge({ status }) {
  return (
    <span style={{
      background: statusBg[status] || '#f7fafc',
      color: statusColor[status] || '#718096',
      padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600'
    }}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [balances, setBalances] = useState([])
  const [recentLeaves, setRecentLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [balRes, leavesRes] = await Promise.all([
          api.get(`/users/${user.id}/leave-balance`),
          api.get('/leaves/requests'),
        ])
        setBalances(balRes.data.balances)
        setRecentLeaves(leavesRes.data.requests.slice(-5).reverse())
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [user.id])

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Loading...</div>

  return (
    <div>
      <h1 style={s.greeting}>Hello, {user.first_name} 👋</h1>
      <p style={s.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div style={s.grid}>
        {balances.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>No leave balances set yet. Contact your admin.</p>
        ) : balances.map(b => (
          <div key={b.id} style={{ ...s.card, borderLeftColor: LEAVE_COLORS[b.leave_type] || '#3182ce' }}>
            <div style={s.cardTitle}>{b.leave_type}</div>
            <div style={{ ...s.cardDays, color: LEAVE_COLORS[b.leave_type] || '#3182ce' }}>{b.remaining_days}</div>
            <div style={s.cardRemain}>of {b.total_days} days remaining</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Recent Requests</h2>
          <Link to="/apply" style={s.applyBtn}>+ Apply Leave</Link>
        </div>
        {recentLeaves.length === 0 ? (
          <div style={s.empty}>No leave requests yet. <Link to="/apply" style={{ color: '#e94560' }}>Apply now</Link></div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Type</th>
                <th style={s.th}>From</th>
                <th style={s.th}>To</th>
                <th style={s.th}>Days</th>
                <th style={s.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.map(r => (
                <tr key={r.id}>
                  <td style={s.td}>{r.leave_type}</td>
                  <td style={s.td}>{r.start_date}</td>
                  <td style={s.td}>{r.end_date}</td>
                  <td style={s.td}>{r.days_requested}</td>
                  <td style={s.td}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
