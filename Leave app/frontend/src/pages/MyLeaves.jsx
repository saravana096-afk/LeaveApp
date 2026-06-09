import { useEffect, useState } from 'react'
import api from '../api/axios'

const s = {
  heading: { fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  sub: { color: '#718096', marginBottom: '2rem' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  filters: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  filterBtn: {
    padding: '0.4rem 1rem', borderRadius: '20px', border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', fontWeight: '600', color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.85rem 0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #f7fafc' },
  cancelBtn: {
    background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2',
    padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
  },
  empty: { textAlign: 'center', color: '#a0aec0', padding: '3rem', fontSize: '0.9rem' },
}

const statusColor = { pending: '#dd6b20', approved: '#276749', rejected: '#c53030', cancelled: '#718096' }
const statusBg = { pending: '#fffaf0', approved: '#f0fff4', rejected: '#fff5f5', cancelled: '#f7fafc' }

function StatusBadge({ status }) {
  return (
    <span style={{ background: statusBg[status] || '#f7fafc', color: statusColor[status] || '#718096', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
      {status}
    </span>
  )
}

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await api.get('/leaves/requests')
      setLeaves(data.requests.reverse())
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this leave request?')) return
    try {
      await api.post(`/leaves/requests/${id}/cancel`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel')
    }
  }

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.status === filter)

  const counts = leaves.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc }, {})

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Loading...</div>

  return (
    <div>
      <h1 style={s.heading}>My Leave Requests</h1>
      <p style={s.sub}>Track all your leave requests</p>

      <div style={s.filters}>
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(f => (
          <button
            key={f}
            style={{
              ...s.filterBtn,
              background: filter === f ? '#e94560' : '#fff',
              color: filter === f ? '#fff' : '#4a5568',
              borderColor: filter === f ? '#e94560' : '#e2e8f0',
            }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && counts[f] ? ` (${counts[f]})` : f === 'all' ? ` (${leaves.length})` : ''}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {filtered.length === 0 ? (
          <div style={s.empty}>No {filter !== 'all' ? filter : ''} leave requests found.</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Type</th>
                <th style={s.th}>From</th>
                <th style={s.th}>To</th>
                <th style={s.th}>Days</th>
                <th style={s.th}>Reason</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Applied</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={s.td}>{r.leave_type}</td>
                  <td style={s.td}>{r.start_date}</td>
                  <td style={s.td}>{r.end_date}</td>
                  <td style={s.td}>{r.days_requested}</td>
                  <td style={{ ...s.td, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.reason || '—'}
                  </td>
                  <td style={s.td}><StatusBadge status={r.status} /></td>
                  <td style={{ ...s.td, color: '#718096' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td style={s.td}>
                    {(r.status === 'pending') && (
                      <button style={s.cancelBtn} onClick={() => cancel(r.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
