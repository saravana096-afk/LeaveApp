import { useEffect, useState } from 'react'
import api from '../api/axios'

const LEAVE_TYPES = ['annual', 'sick', 'personal', 'maternity', 'bereavement']

const s = {
  heading: { fontSize: '1.6rem', fontWeight: '700', marginBottom: '0.25rem', color: '#1a1a2e' },
  sub: { color: '#718096', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' },
  tab: {
    padding: '0.6rem 1.25rem', cursor: 'pointer', border: 'none', background: 'none',
    fontSize: '0.95rem', fontWeight: '600', color: '#718096', borderBottom: '2px solid transparent',
    marginBottom: '-2px', transition: 'all 0.2s',
  },
  activeTab: { color: '#e94560', borderBottomColor: '#e94560' },
  card: { background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', fontSize: '0.8rem', fontWeight: '600', color: '#718096', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '0.85rem 0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #f7fafc' },
  approveBtn: { background: '#f0fff4', color: '#276749', border: '1px solid #9ae6b4', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginRight: '0.4rem' },
  rejectBtn: { background: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#a0aec0', padding: '3rem', fontSize: '0.9rem' },
  balanceForm: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' },
  input: { padding: '0.6rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' },
  saveBtn: { background: '#3182ce', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' },
  userRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #f7fafc' },
  toggleBtn: { padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' },
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

export default function AdminPanel() {
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [balances, setBalances] = useState([])
  const [balanceForm, setBalanceForm] = useState({ leave_type: 'annual', total_days: 20, year: new Date().getFullYear() })
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [rejectForm, setRejectForm] = useState({})

  const loadRequests = async () => {
    const { data } = await api.get('/leaves/requests')
    setRequests(data.requests.reverse())
  }

  const loadUsers = async () => {
    const { data } = await api.get('/users/')
    setUsers(data.users)
  }

  useEffect(() => {
    Promise.all([loadRequests(), loadUsers()]).finally(() => setLoading(false))
  }, [])

  const loadBalances = async (userId) => {
    const { data } = await api.get(`/users/${userId}/leave-balance`)
    setBalances(data.balances)
  }

  const selectUser = (u) => {
    setSelectedUser(u)
    loadBalances(u.id)
  }

  const approve = async (id) => {
    try {
      await api.post(`/leaves/requests/${id}/approve`)
      loadRequests()
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const reject = async (id) => {
    const reason = rejectForm[id] || ''
    try {
      await api.post(`/leaves/requests/${id}/reject`, { reason })
      setRejectForm(f => ({ ...f, [id]: '' }))
      loadRequests()
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const saveBalance = async () => {
    if (!selectedUser) return
    try {
      await api.post(`/users/${selectedUser.id}/leave-balance`, balanceForm)
      loadBalances(selectedUser.id)
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const toggleAdmin = async (userId) => {
    try {
      await api.post(`/users/${userId}/toggle-admin`)
      loadUsers()
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Loading...</div>

  return (
    <div>
      <h1 style={s.heading}>Admin Panel</h1>
      <p style={s.sub}>Manage leave requests and users</p>

      <div style={s.tabs}>
        {['requests', 'users', 'balances'].map(t => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.activeTab : {}) }} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '0.35rem 0.85rem', borderRadius: '20px', border: '1.5px solid #e2e8f0',
                background: filter === f ? '#e94560' : '#fff', color: filter === f ? '#fff' : '#4a5568',
                borderColor: filter === f ? '#e94560' : '#e2e8f0', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={s.card}>
            {filtered.length === 0 ? <div style={s.empty}>No {filter !== 'all' ? filter : ''} requests.</div> : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Employee</th>
                    <th style={s.th}>Type</th>
                    <th style={s.th}>From</th>
                    <th style={s.th}>To</th>
                    <th style={s.th}>Days</th>
                    <th style={s.th}>Reason</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td style={s.td}>{r.username}</td>
                      <td style={s.td}>{r.leave_type}</td>
                      <td style={s.td}>{r.start_date}</td>
                      <td style={s.td}>{r.end_date}</td>
                      <td style={s.td}>{r.days_requested}</td>
                      <td style={{ ...s.td, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                      <td style={s.td}><StatusBadge status={r.status} /></td>
                      <td style={s.td}>
                        {r.status === 'pending' && (
                          <div>
                            <button style={s.approveBtn} onClick={() => approve(r.id)}>Approve</button>
                            <input
                              placeholder="Rejection reason"
                              value={rejectForm[r.id] || ''}
                              onChange={e => setRejectForm(f => ({ ...f, [r.id]: e.target.value }))}
                              style={{ ...s.input, fontSize: '0.78rem', padding: '0.3rem 0.6rem', marginTop: '0.4rem', display: 'block', width: '100%' }}
                            />
                            <button style={{ ...s.rejectBtn, marginTop: '0.3rem' }} onClick={() => reject(r.id)}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div style={s.card}>
          {users.map(u => (
            <div key={u.id} style={s.userRow}>
              <div>
                <div style={{ fontWeight: '600' }}>{u.first_name} {u.last_name} <span style={{ color: '#718096', fontWeight: '400', fontSize: '0.875rem' }}>@{u.username}</span></div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>{u.email} · {u.department || 'No department'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {u.is_admin && <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>Admin</span>}
                <span style={{ background: u.is_active ? '#f0fff4' : '#fff5f5', color: u.is_active ? '#276749' : '#c53030', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  style={{ ...s.toggleBtn, background: u.is_admin ? '#fff5f5' : '#ebf8ff', color: u.is_admin ? '#c53030' : '#2b6cb0' }}
                  onClick={() => toggleAdmin(u.id)}
                >
                  {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'balances' && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
          <div style={s.card}>
            <div style={{ fontWeight: '600', marginBottom: '0.75rem', color: '#4a5568', fontSize: '0.85rem', textTransform: 'uppercase' }}>Select Employee</div>
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => selectUser(u)}
                style={{
                  padding: '0.65rem 0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.25rem',
                  background: selectedUser?.id === u.id ? '#fff5f7' : 'transparent',
                  color: selectedUser?.id === u.id ? '#e94560' : '#4a5568',
                  fontWeight: selectedUser?.id === u.id ? '600' : '400',
                  fontSize: '0.9rem',
                }}
              >
                {u.first_name} {u.last_name}
              </div>
            ))}
          </div>

          <div>
            {selectedUser ? (
              <>
                <div style={s.card}>
                  <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Set Balance for {selectedUser.first_name} {selectedUser.last_name}</div>
                  <div style={s.balanceForm}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#718096', marginBottom: '0.3rem' }}>Leave Type</div>
                      <select style={s.input} value={balanceForm.leave_type} onChange={e => setBalanceForm(f => ({ ...f, leave_type: e.target.value }))}>
                        {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#718096', marginBottom: '0.3rem' }}>Total Days</div>
                      <input style={s.input} type="number" min="0" value={balanceForm.total_days} onChange={e => setBalanceForm(f => ({ ...f, total_days: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#718096', marginBottom: '0.3rem' }}>Year</div>
                      <input style={s.input} type="number" value={balanceForm.year} onChange={e => setBalanceForm(f => ({ ...f, year: Number(e.target.value) }))} />
                    </div>
                    <button style={s.saveBtn} onClick={saveBalance}>Save Balance</button>
                  </div>
                </div>

                <div style={s.card}>
                  <div style={{ fontWeight: '600', marginBottom: '1rem' }}>Current Balances</div>
                  {balances.length === 0 ? (
                    <div style={{ color: '#a0aec0', fontSize: '0.9rem' }}>No balances set yet.</div>
                  ) : (
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Type</th>
                          <th style={s.th}>Year</th>
                          <th style={s.th}>Total</th>
                          <th style={s.th}>Used</th>
                          <th style={s.th}>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {balances.map(b => (
                          <tr key={b.id}>
                            <td style={s.td}>{b.leave_type}</td>
                            <td style={s.td}>{b.year}</td>
                            <td style={s.td}>{b.total_days}</td>
                            <td style={s.td}>{b.used_days}</td>
                            <td style={s.td}><strong>{b.remaining_days}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div style={{ ...s.card, textAlign: 'center', color: '#a0aec0', padding: '3rem' }}>
                Select an employee to manage their leave balances
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
