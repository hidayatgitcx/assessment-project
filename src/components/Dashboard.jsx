import { useEffect, useState } from 'react'

function Dashboard({ user, onSignout }) {
  const [orders, setOrders] = useState([])

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

  return (
    <main className="login-page">
      <div className="login-card dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="login-title">Welcome</h1>
            <p className="dashboard-subtitle">{user.email}</p>
          </div>
          <button type="button" className="btn ghost" onClick={onSignout}>
            Sign out
          </button>
        </div>

        <section className="dashboard-panel">
          <div className="panel-header">
            <h2>Orders (protected)</h2>
          </div>

          {orders.length === 0 ? (
            <p className="muted">No orders available.</p>
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
