import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import app from '../firebase/config.js'
import './Dashboard.css'

const db = getFirestore(app)

export default function Dashboard({ customer, user }) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const q = customer.accountId 
          ? query(collection(db, 'tickets'), where('accountId', '==', customer.accountId), orderBy('createdAt', 'desc'), limit(10))
          : query(collection(db, 'tickets'), where('customerId', '==', customer.id), orderBy('createdAt', 'desc'), limit(10))
        
        const snapshot = await getDocs(q)
        const t = []
        snapshot.forEach(doc => {
          t.push({ id: doc.id, ...doc.data() })
        })
        setTickets(t)
      } catch (err) {
        console.error('Error fetching tickets', err)
        // If index is missing, it will throw an error. We could fallback to no ordering
        try {
          const qFallback = customer.accountId 
            ? query(collection(db, 'tickets'), where('accountId', '==', customer.accountId))
            : query(collection(db, 'tickets'), where('customerId', '==', customer.id))
          const snap2 = await getDocs(qFallback)
          const t2 = []
          snap2.forEach(doc => {
            t2.push({ id: doc.id, ...doc.data() })
          })
          t2.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          setTickets(t2.slice(0, 10))
        } catch (err2) {
          console.error('Fallback query failed', err2)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchTickets()
  }, [customer])

  const openTickets = tickets.filter(t => t.status === 'PENDING' || t.status === 'MORE_INFO')
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'APPROVED')
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED')

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, {customer.customerName}!</h2>
        <p>How can LANZAR assist your facility today?</p>
      </div>

      <div className="dashboard-action-panel">
        <button className="primary-btn huge-btn" onClick={() => navigate('/submit')}>
          SUBMIT A SUPPORT REQUEST
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{loading ? '-' : openTickets.length}</span>
          <span className="stat-label">OPEN REQUESTS</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loading ? '-' : inProgressTickets.length}</span>
          <span className="stat-label">IN PROGRESS</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{loading ? '-' : resolvedTickets.length}</span>
          <span className="stat-label">RESOLVED</span>
        </div>
      </div>

      <div className="recent-requests">
        <h3>RECENT REQUESTS</h3>
        {loading ? (
          <p>Loading records...</p>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <p>No recent support requests found.</p>
          </div>
        ) : (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>TICKET NUMBER</th>
                <th>SERVICE</th>
                <th>PROBLEM</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td className="mono">{t.ticketNumber}</td>
                  <td>{t.service}</td>
                  <td>{t.category}</td>
                  <td>
                    <span className={`status-badge status-${t.status.toLowerCase()}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button className="text-link" onClick={() => navigate(`/ticket/${t.ticketNumber}`)}>
                      VIEW
                    </button>
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
