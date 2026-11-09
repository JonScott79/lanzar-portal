import { useState, useEffect } from 'react';
import { fetchUsers, fetchUserDetail, setAccountStatus, revokeAllSessions } from './adminApi.js';

export default function DeckIdentities() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected User Detail Drawer State
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Destructive Action Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    actionType: '', // 'suspend' | 'activate' | 'revoke_sessions'
    targetUser: null,
    reason: '',
    confirmText: '',
    isSubmitting: false
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers(searchQuery, statusFilter);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleInspectUser = async (uid) => {
    try {
      setDrawerLoading(true);
      const detail = await fetchUserDetail(uid);
      setSelectedUser(detail);
    } catch (err) {
      alert(`Failed to load identity details: ${err.message}`);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExecuteModalAction = async () => {
    const { actionType, targetUser, reason, confirmText } = actionModal;
    if (!targetUser) return;

    if (actionType === 'suspend' && confirmText !== 'SUSPEND') {
      alert('Please type SUSPEND to confirm.');
      return;
    }
    if (actionType === 'revoke_sessions' && confirmText !== 'REVOKE') {
      alert('Please type REVOKE to confirm.');
      return;
    }

    try {
      setActionModal(prev => ({ ...prev, isSubmitting: true }));
      if (actionType === 'suspend') {
        await setAccountStatus(targetUser.uid, 'suspended', reason || 'Administrative action');
      } else if (actionType === 'activate') {
        await setAccountStatus(targetUser.uid, 'active', reason || 'Restored by administrator');
      } else if (actionType === 'revoke_sessions') {
        await revokeAllSessions(targetUser.uid);
      }

      setActionModal({ isOpen: false, actionType: '', targetUser: null, reason: '', confirmText: '', isSubmitting: false });
      await loadUsers();
      if (selectedUser && selectedUser.uid === targetUser.uid) {
        await handleInspectUser(targetUser.uid);
      }
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
      setActionModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      {/* Deck Header */}
      <div className="mc-deck-header">
        <div className="mc-deck-title-wrap">
          <span className="mc-deck-tag">DECK 02 // IDENTITY EXPLORER</span>
          <h1 className="mc-deck-title">IDENTITY EXPLORER</h1>
          <p className="mc-deck-subtitle">
            Search, inspect, and manage canonical user profiles, active sessions, and security statuses.
          </p>
        </div>
        <div className="mc-deck-actions">
          <button className="mc-btn mc-btn-secondary" onClick={loadUsers}>
            &#8635; REFRESH
          </button>
        </div>
      </div>

      {error && (
        <div style="padding: 1rem; background: var(--mc-rose-dim); border: 1px solid var(--mc-rose); border-radius: 6px; color: var(--mc-rose); font-family: var(--mc-font-mono); font-size: 0.82rem;">
          FAILED TO QUERY IDENTITIES: {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="mc-panel" style="padding: 1rem;">
        <form onSubmit={handleSearchSubmit} style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <input
            className="mc-input"
            style="flex: 1; min-width: 280px;"
            placeholder="Search by email, display name, or UID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select
            className="mc-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">ALL STATUSES</option>
            <option value="active">ACTIVE NOMINAL</option>
            <option value="suspended">SUSPENDED</option>
          </select>
          <button type="submit" className="mc-btn mc-btn-primary">
            SEARCH IDENTITIES
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="mc-panel">
        <div className="mc-panel-header">
          <h3 className="mc-panel-title">
            <span>&#9737;</span> MATCHED IDENTITIES ({users.length})
          </h3>
        </div>
        <div className="mc-panel-body" style="padding: 0;">
          <div className="mc-table-container" style="border: none;">
            <table className="mc-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>EMAIL / IDENTITY</th>
                  <th>NAME</th>
                  <th>BADGES & FOUNDERS</th>
                  <th>MFA</th>
                  <th>ROLE</th>
                  <th style="text-align: right;">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style="text-align: center; padding: 2rem; color: var(--mc-text-dim);">
                      Scanning identity database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style="text-align: center; padding: 2rem; color: var(--mc-text-dim);">
                      No matching user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.uid}>
                      <td>
                        <span className={`mc-badge ${u.status === 'suspended' ? 'alert' : 'nominal'}`}>
                          {(u.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style="font-weight: 700; color: #fff;">{u.email}</div>
                        <div style="font-family: var(--mc-font-mono); font-size: 0.68rem; color: var(--mc-text-dim);">
                          {u.uid}
                        </div>
                      </td>
                      <td>{u.displayName || '—'}</td>
                      <td>
                        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                          {(u.derivedBadges && u.derivedBadges.length > 0) ? (
                            u.derivedBadges.map((b, idx) => (
                              <span key={idx} className="mc-badge gold">{b}</span>
                            ))
                          ) : (
                            <span style="color: var(--mc-text-dim); font-size: 0.75rem;">None</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`mc-badge ${u.mfaEnabled ? 'nominal' : 'warning'}`}>
                          {u.mfaEnabled ? 'ENABLED' : 'OFF'}
                        </span>
                      </td>
                      <td>
                        <span style="font-family: var(--mc-font-mono); font-size: 0.75rem; text-transform: uppercase;">
                          {u.role || 'USER'}
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <button
                          className="mc-btn mc-btn-secondary"
                          style="padding: 4px 10px; font-size: 0.72rem;"
                          onClick={() => handleInspectUser(u.uid)}
                        >
                          INSPECT &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Slide-Over Drawer */}
      {selectedUser && (
        <div className="mc-drawer-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="mc-drawer" onClick={e => e.stopPropagation()}>
            <div className="mc-drawer-header">
              <div>
                <span className="mc-deck-tag">IDENTITY INSPECTION</span>
                <h3 style="margin: 0; color: #fff; font-size: 1.2rem;">{selectedUser.displayName || selectedUser.email}</h3>
              </div>
              <button className="mc-btn mc-btn-secondary" onClick={() => setSelectedUser(null)}>
                &times;
              </button>
            </div>

            <div className="mc-drawer-body">
              {/* Profile Card */}
              <div className="mc-panel" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-family: var(--mc-font-mono); font-size: 0.7rem; color: var(--mc-text-dim);">STATUS</span>
                  <span className={`mc-badge ${selectedUser.status === 'suspended' ? 'alert' : 'nominal'}`}>
                    {(selectedUser.status || 'ACTIVE').toUpperCase()}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-family: var(--mc-font-mono); font-size: 0.7rem; color: var(--mc-text-dim);">UID</span>
                  <span style="font-family: var(--mc-font-mono); font-size: 0.72rem; color: var(--mc-cyan);">{selectedUser.uid}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-family: var(--mc-font-mono); font-size: 0.7rem; color: var(--mc-text-dim);">EMAIL</span>
                  <span style="font-weight: 700;">{selectedUser.email}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-family: var(--mc-font-mono); font-size: 0.7rem; color: var(--mc-text-dim);">TOKEN VERSION</span>
                  <span style="font-family: var(--mc-font-mono); font-size: 0.75rem;">v{selectedUser.tokenVersion || 1}</span>
                </div>
              </div>

              {/* Authoritative Founders */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h4 className="mc-panel-title">🎖 AUTHORITATIVE FOUNDERS</h4>
                </div>
                <div className="mc-panel-body" style="padding: 0.75rem;">
                  {(!selectedUser.authoritativeFounders || selectedUser.authoritativeFounders.length === 0) ? (
                    <div style="color: var(--mc-text-dim); font-size: 0.8rem; text-align: center; padding: 0.5rem;">
                      No active founder designations.
                    </div>
                  ) : (
                    selectedUser.authoritativeFounders.map((f, idx) => (
                      <div key={idx} style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--mc-border);">
                        <div>
                          <div style="font-weight: 700; color: var(--mc-gold);">{f.title || f.programId}</div>
                          <div style="font-family: var(--mc-font-mono); font-size: 0.68rem; color: var(--mc-text-dim);">
                            Founder #{f.founderNumber || 'N/A'} • Granted: {f.grantedAt ? new Date(f.grantedAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <span className="mc-badge gold">AUTHORITATIVE</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Device Sessions */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h4 className="mc-panel-title">📱 ACTIVE DEVICE SESSIONS</h4>
                </div>
                <div className="mc-panel-body" style="padding: 0.75rem;">
                  {(!selectedUser.authoritativeSessions || selectedUser.authoritativeSessions.length === 0) ? (
                    <div style="color: var(--mc-text-dim); font-size: 0.8rem; text-align: center; padding: 0.5rem;">
                      No tracked active device sessions.
                    </div>
                  ) : (
                    selectedUser.authoritativeSessions.map((s, idx) => (
                      <div key={idx} style="padding: 0.5rem; border-bottom: 1px solid var(--mc-border); display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; font-size: 0.82rem;">{s.deviceName || 'Web Session'}</div>
                          <div style="font-family: var(--mc-font-mono); font-size: 0.68rem; color: var(--mc-text-dim);">
                            IP: {s.ipAddress || 'Unknown'} • Client: {s.clientId || 'general'}
                          </div>
                        </div>
                        <span className="mc-badge nominal">ACTIVE</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Administrative Actions */}
              <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
                <button
                  className="mc-btn mc-btn-secondary"
                  onClick={() => setActionModal({
                    isOpen: true,
                    actionType: 'revoke_sessions',
                    targetUser: selectedUser,
                    reason: 'Administrative device session wipe',
                    confirmText: '',
                    isSubmitting: false
                  })}
                >
                  ⚡ FORCE REVOKE ALL SESSIONS EVERYWHERE
                </button>

                {selectedUser.status === 'suspended' ? (
                  <button
                    className="mc-btn mc-btn-primary"
                    onClick={() => setActionModal({
                      isOpen: true,
                      actionType: 'activate',
                      targetUser: selectedUser,
                      reason: '',
                      confirmText: '',
                      isSubmitting: false
                    })}
                  >
                    &#10003; RESTORE ACCOUNT TO ACTIVE STATUS
                  </button>
                ) : (
                  <button
                    className="mc-btn mc-btn-danger"
                    onClick={() => setActionModal({
                      isOpen: true,
                      actionType: 'suspend',
                      targetUser: selectedUser,
                      reason: '',
                      confirmText: '',
                      isSubmitting: false
                    })}
                  >
                    &#9888; SUSPEND USER ACCOUNT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Destructive Action Modal */}
      {actionModal.isOpen && (
        <div className="mc-modal-backdrop" onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="mc-modal" onClick={e => e.stopPropagation()}>
            <div className="mc-modal-header">
              <span style="font-size: 1.2rem;">&#9888;</span>
              <h3 className="mc-modal-title">
                {actionModal.actionType === 'suspend' && 'CONFIRM ACCOUNT SUSPENSION'}
                {actionModal.actionType === 'activate' && 'CONFIRM ACCOUNT RESTORATION'}
                {actionModal.actionType === 'revoke_sessions' && 'CONFIRM GLOBAL SESSION REVOCATION'}
              </h3>
            </div>
            <div className="mc-modal-body">
              <div>
                Target Account: <strong>{actionModal.targetUser?.email}</strong> ({actionModal.targetUser?.uid})
              </div>

              {actionModal.actionType === 'suspend' && (
                <>
                  <div style="color: var(--mc-rose); font-size: 0.82rem;">
                    Suspension will immediately terminate all active sessions, invalidate tokens, and prevent all further logins across LANZAR subdomains.
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; font-family: var(--mc-font-mono); color: var(--mc-text-dim);">
                      MANDATORY AUDIT REASON:
                    </label>
                    <input
                      className="mc-input"
                      style="width: 100%; margin-top: 4px;"
                      placeholder="e.g. Suspected unauthorized account compromise"
                      value={actionModal.reason}
                      onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; font-family: var(--mc-font-mono); color: var(--mc-text-dim);">
                      TYPE "SUSPEND" TO CONFIRM:
                    </label>
                    <input
                      className="mc-input"
                      style="width: 100%; margin-top: 4px;"
                      placeholder="SUSPEND"
                      value={actionModal.confirmText}
                      onChange={e => setActionModal(prev => ({ ...prev, confirmText: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {actionModal.actionType === 'revoke_sessions' && (
                <>
                  <div style="font-size: 0.82rem; color: var(--mc-amber);">
                    This will increment tokenVersion and revoke all refresh tokens in Firebase Auth, signing the user out across all browsers, mobile devices, and active clients.
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; font-family: var(--mc-font-mono); color: var(--mc-text-dim);">
                      TYPE "REVOKE" TO CONFIRM:
                    </label>
                    <input
                      className="mc-input"
                      style="width: 100%; margin-top: 4px;"
                      placeholder="REVOKE"
                      value={actionModal.confirmText}
                      onChange={e => setActionModal(prev => ({ ...prev, confirmText: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {actionModal.actionType === 'activate' && (
                <div>
                  <label style="font-size: 0.75rem; font-family: var(--mc-font-mono); color: var(--mc-text-dim);">
                    RESTORATION REASON:
                  </label>
                  <input
                    className="mc-input"
                    style="width: 100%; margin-top: 4px;"
                    placeholder="e.g. Identity verified via support hotline"
                    value={actionModal.reason}
                    onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="mc-modal-footer">
              <button
                className="mc-btn mc-btn-secondary"
                onClick={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                disabled={actionModal.isSubmitting}
              >
                CANCEL
              </button>
              <button
                className={`mc-btn ${actionModal.actionType === 'activate' ? 'mc-btn-primary' : 'mc-btn-danger'}`}
                onClick={handleExecuteModalAction}
                disabled={actionModal.isSubmitting}
              >
                {actionModal.isSubmitting ? 'PROCESSING...' : 'EXECUTE OPERATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
