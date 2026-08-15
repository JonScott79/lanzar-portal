import { useLocation } from 'react-router-dom'
import './Stella.css'

export default function Stella({ user, customer, authError }) {
  const location = useLocation()
  
  let pose = '/images/stella/stella-001.png'
  let message = 'Hello! Welcome to the LANZAR Customer Portal.'

  if (!user || authError) {
    pose = '/images/stella/stella-000.png'
    message = authError ? 'Oh dear! We cannot authenticate you.' : 'Please sign in so we can direct you to the right service.'
  } else if (location.pathname === '/dashboard') {
    pose = '/images/stella/stella-001.png'
    message = `Welcome back to the launching facility!`
  } else if (location.pathname === '/submit') {
    pose = '/images/stella/stella-002.png'
    message = 'Let\'s get those details down so we can get right on it.'
  } else if (location.pathname.startsWith('/ticket/')) {
    pose = '/images/stella/stella-003.png'
    message = 'Here are the details for this request.'
  }

  return (
    <div className="stella-container">
      <div className="stella-dialogue">
        <img src="/images/decorations/stella-dialog.svg" alt="" className="stella-dialogue-art" aria-hidden="true" />
        <div className="stella-dialogue-content">
          <p className="stella-message">{message}</p>
        </div>
      </div>
      <img src={pose} alt="Stella, LANZAR Support Hostess" className="stella-img" />
    </div>
  )
}
