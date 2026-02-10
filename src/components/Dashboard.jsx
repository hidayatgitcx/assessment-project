import { useEffect, useState } from 'react'

function Dashboard({ user, onSignout }) {
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const loadOrders = async () => {
    const response = await fetch('/api/orders', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      setOrders(data.orders || [])
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleSeed = async () => {
    setMessage('')
    setBusy(true)
    try {
      const response = await fetch('/api/orders/seed', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      setMessage(data.message || 'Done.')
      await loadOrders()
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-card dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="login-title">Welcome</h1>
            <p className="dashboard-subtitle">{user.email}</p>
          </div>
          <button type="button" className="btn ghost" onClick={onSignout} disabled={busy}>
            Sign out
          </button>
        </div>

        {message ? <p className="status success">{message}</p> : null}

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Orders (protected)</h2>
            <button type="button" className="btn ghost" onClick={handleSeed} disabled={busy}>
              Create sample data
            </button>
          </div>

          {orders.length === 0 ? (
            <p className="muted">No orders yet. Click “Create sample data”.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Customer</th>
                  <th>Product</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((item) => (
                  <tr key={item._id}>
                    <td>{item.number}</td>
                    <td>{item.customer}</td>
                    <td>{item.product}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  )
}

export default Dashboard
