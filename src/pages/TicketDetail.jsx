import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '../firebase/config.js'
import './TicketDetail.css'

const db = getFirestore(app)

export default function TicketDetail({ customer }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'tickets', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          // Ensure customer has access to this ticket
          if (customer.accountId && data.accountId === customer.accountId) {
            setTicket(data)
          } else if (data.customerId === customer.id || data.userId === customer.id) {
            setTicket(data)
          } else {
            setError('You do not have permission to view this ticket.')
          }
        } else {
          setError('Ticket not found.')
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load ticket details.')
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [id, customer])

  if (loading) return <div className="ticket-detail-page"><p>Loading ticket details...</p></div>
  if (error) return <div className="ticket-detail-page"><p className="error-msg">{error}</p><button className="secondary-btn" onClick={() => navigate('/dashboard')}>BACK</button></div>
  if (!ticket) return null

  return (
    <div className="ticket-detail-page">
      <div className="detail-header">
        <button className="text-link back-link" onClick={() => navigate('/dashboard')}>&larr; BACK TO DASHBOARD</button>
        <div className="title-row">
          <h2 className="mono">{ticket.ticketNumber}</h2>
          <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="detail-content">
        <div className="info-grid">
          <div className="info-group">
            <span className="info-label">SERVICE</span>
            <span className="info-value">{ticket.service}</span>
          </div>
          <div className="info-group">
            <span className="info-label">PROBLEM TYPE</span>
            <span className="info-value">{ticket.category}</span>
          </div>
          <div className="info-group">
            <span className="info-label">LOCATION</span>
            <span className="info-value">{ticket.locationName || 'N/A'}</span>
          </div>
          <div className="info-group">
            <span className="info-label">ASSET</span>
            <span className="info-value">{ticket.assetName || 'N/A'}</span>
          </div>
          <div className="info-group">
            <span className="info-label">SUBMITTED DATE</span>
            <span className="info-value">
              {ticket.createdAt?.toDate().toLocaleDateString() || 'N/A'}
            </span>
          </div>
        </div>

        <div className="description-box">
          <h3>DESCRIPTION</h3>
          <p><strong>Specific Issue:</strong> {ticket.issueType || ticket.subcategory || 'N/A'}</p>
          <p>{ticket.description}</p>
        </div>

        {ticket.history && ticket.history.length > 0 && (
          <div className="updates-box">
            <h3>UPDATES</h3>
            {ticket.history.filter(h => h.visibleToCustomer !== false).map((h, i) => (
              <div key={i} className="update-item">
                <span className="update-date">{h.timestamp?.toDate().toLocaleString() || 'Unknown Date'}</span>
                <p className="update-msg">{h.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
