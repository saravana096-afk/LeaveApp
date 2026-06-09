import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const styles = {
  layout: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  nav: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  brand: { color: '#e94560', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '0.5px' },
  links: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  link: {
    color: '#a0aec0',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  activeLink: {
    color: '#fff',
    background: 'rgba(233,69,96,0.2)',
  },
  logoutBtn: {
    background: '#e94560',
    color: '#fff',
    border: 'none',
    padding: '0.4rem 1rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginLeft: '0.5rem',
  },
  content: { flex: 1, padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' },
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkStyle = ({ isActive }) => ({
    ...styles.link,
    ...(isActive ? styles.activeLink : {}),
  })

  return (
    <div style={styles.layout}>
      <nav style={styles.nav}>
        <span style={styles.brand}>LeaveApp</span>
        <div style={styles.links}>
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/apply" style={linkStyle}>Apply Leave</NavLink>
          <NavLink to="/my-leaves" style={linkStyle}>My Leaves</NavLink>
          {user?.is_admin && <NavLink to="/admin" style={linkStyle}>Admin</NavLink>}
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
