import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket } from '../firebase/tickets.js'
import { getAccountLocations, getAccountAssets } from '../firebase/accountResources.js'
import './SubmitTicket.css'

const IT_PROBLEM_TYPES = [
  'Computer or workstation',
  'Software or application',
  'Network or connectivity',
  'Account access',
  'Other IT issue'
]

const FACILITIES_PROBLEM_TYPES = [
  'HVAC or temperature',
  'Plumbing or water',
  'Electrical or lighting',
  'Building maintenance',
  'Other facilities issue'
]

export default function SubmitTicket({ customer, user }) {
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Service, 2: Problem, 3: Review, 4: Success
  const [service, setService] = useState('')
  const [problemType, setProblemType] = useState('')
  const [locationId, setLocationId] = useState('')
  const [assetId, setAssetId] = useState('')
  const [specificProblem, setSpecificProblem] = useState('')
  const [details, setDetails] = useState('')
  
  const [locations, setLocations] = useState([])
  const [assets, setAssets] = useState([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (customer?.accountId) {
      getAccountLocations(customer.accountId).then(setLocations)
      getAccountAssets(customer.accountId).then(setAssets)
    }
  }, [customer])

  const handleLocationChange = (e) => {
    setLocationId(e.target.value)
    setAssetId('') // Clear asset when location changes as per prompt
  }

  const handleNextStep = () => setStep(step + 1)
  const handlePrevStep = () => setStep(step - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    const loc = locations.find(l => l.id === locationId)
    const ast = assets.find(a => a.id === assetId)
    
    try {
      const ticketNumber = await createTicket(
        service,
        customer,
        user,
        problemType,
        details,
        {
          locationId: loc?.id || null,
          locationName: loc?.name || null,
          assetId: ast?.id || null,
          assetName: ast?.name || null,
          issueType: specificProblem
        }
      )
      setSubmittedTicketNumber(ticketNumber)
      setStep(4)
    } catch (err) {
      console.error(err)
      setError('Failed to submit ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableServices = customer?.services?.length > 0 ? customer.services : ['IT', 'FACILITIES']

  const problemTypes = service === 'IT' ? IT_PROBLEM_TYPES : (service === 'FACILITIES' ? FACILITIES_PROBLEM_TYPES : ['General Issue'])

  // Filter assets by location
  const filteredAssets = assets.filter(a => a.locationId === locationId)

  return (
    <div className="submit-ticket-page">
      <h2 className="page-title">SUBMIT SUPPORT REQUEST</h2>

      {step === 1 && (
        <div className="wizard-step">
          <h3>1. SELECT SERVICE</h3>
          <p>Which LANZAR department can assist you?</p>
          <div className="service-options">
            {availableServices.map(srv => (
              <button 
                key={srv} 
                className={`service-btn ${service === srv ? 'selected' : ''}`}
                onClick={() => { setService(srv); setStep(2) }}
              >
                {srv}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h3>2. TELL US WHAT&apos;S WRONG</h3>
          
          <div className="form-group">
            <label>WHAT SEEMS TO BE THE TROUBLE?</label>
            <select value={problemType} onChange={(e) => setProblemType(e.target.value)}>
              <option value="">Select a problem type...</option>
              {problemTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>WHICH LOCATION?</label>
            <select value={locationId} onChange={handleLocationChange}>
              <option value="">Select a location...</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          {locationId && filteredAssets.length > 0 && (
            <div className="form-group">
              <label>WHICH ASSET?</label>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                <option value="">Select an asset...</option>
                {filteredAssets.map(ast => <option key={ast.id} value={ast.id}>{ast.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>WHAT SPECIFICALLY IS WRONG?</label>
            <input 
              type="text" 
              value={specificProblem} 
              onChange={(e) => setSpecificProblem(e.target.value)} 
              placeholder="e.g. Cannot connect to Wi-Fi" 
            />
          </div>

          <div className="form-group">
            <label>ADDITIONAL DETAILS</label>
            <textarea 
              value={details} 
              onChange={(e) => setDetails(e.target.value)} 
              rows="4"
              placeholder="Please provide any other relevant details..."
            ></textarea>
          </div>

          <div className="wizard-actions">
            <button className="secondary-btn" onClick={handlePrevStep}>BACK</button>
            <button 
              className="primary-btn" 
              onClick={handleNextStep}
              disabled={!problemType}
            >
              REVIEW
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step">
          <h3>3. REVIEW</h3>
          <div className="ticket-preview">
            <p><strong>Service:</strong> {service}</p>
            <p><strong>Problem Type:</strong> {problemType}</p>
            <p><strong>Location:</strong> {locations.find(l => l.id === locationId)?.name || 'N/A'}</p>
            <p><strong>Asset:</strong> {assets.find(a => a.id === assetId)?.name || 'N/A'}</p>
            <p><strong>Specific Issue:</strong> {specificProblem || 'N/A'}</p>
            <p><strong>Details:</strong> {details || 'N/A'}</p>
          </div>
          
          {error && <p className="error-msg">{error}</p>}

          <div className="wizard-actions">
            <button className="secondary-btn" onClick={handlePrevStep} disabled={isSubmitting}>BACK</button>
            <button className="primary-btn submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'SENDING...' : 'SEND SUPPORT REQUEST'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="wizard-step success-step">
          <h3>REQUEST RECEIVED</h3>
          <div className="ticket-number-display">
            {submittedTicketNumber}
          </div>
          <p>Your support request has been successfully submitted to LANZAR.</p>
          
          <div className="wizard-actions center-actions">
            <button className="secondary-btn" onClick={() => navigate('/dashboard')}>RETURN TO DASHBOARD</button>
            <button className="primary-btn" onClick={() => navigate(`/ticket/${submittedTicketNumber}`)}>VIEW TICKET</button>
          </div>
        </div>
      )}

    </div>
  )
}
