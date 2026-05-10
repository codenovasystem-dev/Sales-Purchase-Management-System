import React, { useCallback, useEffect, useState } from "react";
import SupportChatWidget from "./SupportChatWidget";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const pagesApiUrl = 'https://sales-purchase-management-system.onrender.com';
  const API_BASE_URL = process.env.REACT_APP_API_URL || (isGitHubPages ? pagesApiUrl : 'http://localhost:5000');
  const WS_BASE_URL = API_BASE_URL ? API_BASE_URL.replace(/^http/, 'ws') : '';
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customer_email: '',
    items: [{ product_id: '', quantity: 1 }]
  });
  const [orderMessage, setOrderMessage] = useState('');

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!API_BASE_URL) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [summaryRes, chartRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/dashboard/sales-chart`, { headers })
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      if (chartRes.ok) {
        const chartData = await chartRes.json();
        setChartData(chartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [API_BASE_URL]);

  // Fetch inventory data (for managers/admins)
  const fetchInventory = useCallback(async () => {
    if (!user || !['admin', 'manager'].includes(user.role)) return;
    if (!API_BASE_URL) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const inventoryData = await response.json();
        setInventory(inventoryData);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  }, [API_BASE_URL, user]);

  // Fetch forecast data
  const fetchForecast = useCallback(async () => {
    if (!user || !['admin', 'manager', 'analyst'].includes(user.role)) return;
    if (!API_BASE_URL) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/forecast`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const forecastData = await response.json();
        setForecast(forecastData);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }
  }, [API_BASE_URL, user]);

  // Fetch orders data (for managers/admins)
  const fetchOrders = useCallback(async () => {
    if (!user || !['admin', 'manager'].includes(user.role)) return;
    if (!API_BASE_URL) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [API_BASE_URL, user]);

  // Create new order
  const createOrder = async (e) => {
    e.preventDefault();
    if (!API_BASE_URL) {
      setOrderMessage('Frontend is live, but order creation requires a deployed backend API.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderForm)
      });

      const result = await response.json();
      
      if (response.ok) {
        setOrderMessage('Order created successfully!');
        setOrderForm({ customer_email: '', items: [{ product_id: '', quantity: 1 }] });
        setShowOrderForm(false);
        fetchOrders(); // Refresh orders list
        fetchInventory(); // Refresh inventory
        fetchDashboardData(); // Refresh dashboard
      } else {
        setOrderMessage(result.message || 'Failed to create order');
      }
    } catch (error) {
      setOrderMessage('Error creating order: ' + error.message);
    }
  };

  // Add order item
  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { product_id: '', quantity: 1 }]
    });
  };

  // Update order item
  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...orderForm.items];
    updatedItems[index][field] = value;
    setOrderForm({ ...orderForm, items: updatedItems });
  };

  // Remove order item
  const removeOrderItem = (index) => {
    if (orderForm.items.length > 1) {
      const updatedItems = orderForm.items.filter((_, i) => i !== index);
      setOrderForm({ ...orderForm, items: updatedItems });
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!WS_BASE_URL) return undefined;

    const websocket = new WebSocket(`${WS_BASE_URL}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SALES_UPDATE') {
        // Refresh dashboard data when sales update
        fetchDashboardData();
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      websocket.close();
    };
  }, [WS_BASE_URL, fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchInventory();
      fetchForecast();
      fetchOrders();
    }
  }, [user, fetchDashboardData, fetchInventory, fetchForecast, fetchOrders]);

  // Prepare chart data
  const salesChartData = {
    labels: chartData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Revenue (£)',
        data: chartData.map(item => item.total_revenue),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const ordersChartData = {
    labels: chartData.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Orders',
        data: chartData.map(item => item.total_orders),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Analytics',
      },
    },
  };

  if (!user) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <h1>🔐 Please log in to access the SalesIQ Dashboard</h1>
        <p>You need to authenticate to view analytics data.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      {!API_BASE_URL && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 16px',
          borderRadius: '8px',
          backgroundColor: '#fff8e1',
          color: '#8a4b00',
          border: '1px solid #ffd54f'
        }}>
          This GitHub Pages deployment shows the real frontend UI, but live dashboard data requires a deployed backend API.
        </div>
      )}
      <h1>📊 SalesIQ Analytics Platform</h1>
      <p>Welcome, {user.email} ({user.role})</p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3>💰 Today's Revenue</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
            £{summary.total_revenue?.toLocaleString() || '0'}
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3>📦 Today's Orders</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
            {summary.total_orders?.toLocaleString() || '0'}
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3>👥 Today's Customers</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7b1fa2' }}>
            {summary.total_customers?.toLocaleString() || '0'}
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h3>📊 Inventory Value</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
            £{summary.inventory_value?.toLocaleString() || '0'}
          </p>
          {summary.low_stock_items > 0 && (
            <p style={{ color: '#d32f2f', fontSize: '14px' }}>
              ⚠️ {summary.low_stock_items} items need reorder
            </p>
          )}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        <div>
          <h3>Revenue Trend (Last 30 Days)</h3>
          <Line data={salesChartData} options={chartOptions} />
        </div>

        <div>
          <h3>Orders Trend (Last 30 Days)</h3>
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      {/* Inventory Management (for managers/admins) */}
      {['admin', 'manager'].includes(user.role) && (
        <div style={{ marginBottom: '30px' }}>
          <h3>📦 Inventory Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {inventory.map(product => (
              <div key={product.id} style={{
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: product.needs_reorder ? '#fff3e0' : '#f9f9f9'
              }}>
                <h4>{product.name}</h4>
                <p>Category: {product.category}</p>
                <p>Stock: {product.stock_quantity} units</p>
                <p>Price: £{product.price}</p>
                {product.needs_reorder && (
                  <p style={{ color: '#d32f2f' }}>⚠️ Low stock! Reorder at {product.reorder_level}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Management (for managers/admins) */}
      {['admin', 'manager'].includes(user.role) && (
        <div style={{ marginBottom: '30px' }}>
          <h3>🛒 Order Management</h3>
          
          {/* Create Order Button */}
          <button 
            onClick={() => setShowOrderForm(!showOrderForm)}
            style={{
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            {showOrderForm ? 'Cancel Order' : '+ Create New Order'}
          </button>

          {/* Order Creation Form */}
          {showOrderForm && (
            <div style={{ 
              border: '1px solid #ddd', 
              padding: '20px', 
              borderRadius: '8px', 
              backgroundColor: '#f9f9f9',
              marginBottom: '20px'
            }}>
              <h4>Create New Order</h4>
              {orderMessage && (
                <p style={{ 
                  color: orderMessage.includes('success') ? '#4caf50' : '#f44336',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>
                  {orderMessage}
                </p>
              )}
              
              <form onSubmit={createOrder}>
                <div style={{ marginBottom: '15px' }}>
                  <label>Customer Email:</label>
                  <input
                    type="email"
                    value={orderForm.customer_email}
                    onChange={(e) => setOrderForm({...orderForm, customer_email: e.target.value})}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label>Order Items:</label>
                  {orderForm.items.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '5px'
                    }}>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateOrderItem(index, 'product_id', parseInt(e.target.value))}
                        required
                        style={{ flex: 1, padding: '8px' }}
                      >
                        <option value="">Select Product</option>
                        {inventory.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} (£{product.price}) - {product.stock_quantity} in stock
                          </option>
                        ))}
                      </select>
                      
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                        required
                        style={{ width: '80px', padding: '8px' }}
                      />
                      
                      {orderForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderItem(index)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addOrderItem}
                    style={{
                      backgroundColor: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '8px 15px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      marginTop: '10px'
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Create Order
                </button>
              </form>
            </div>
          )}

          {/* Orders List */}
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h4>Recent Orders</h4>
            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {orders.slice(0, 10).map(order => (
                  <div key={order.id} style={{
                    border: '1px solid #ccc',
                    padding: '15px',
                    borderRadius: '5px',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Order #{order.id}</strong> - {order.customer_email}
                      </div>
                      <div>
                        <span style={{
                          backgroundColor: 
                            order.status === 'delivered' ? '#4caf50' :
                            order.status === 'shipped' ? '#2196f3' :
                            order.status === 'processing' ? '#ff9800' :
                            order.status === 'cancelled' ? '#f44336' : '#9e9e9e',
                          color: 'white',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <p>Items: {order.items || 'No items'}</p>
                    <p>Total: £{order.total_amount} | Date: {new Date(order.order_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Forecast (for privileged users) */}
      {['admin', 'manager', 'analyst'].includes(user.role) && forecast.length > 0 && (
        <div>
          <h3>🔮 Revenue Forecast (Next 30 Days)</h3>
          <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <Line
              data={{
                labels: forecast.map(item => new Date(item.forecast_date).toLocaleDateString()),
                datasets: [{
                  label: 'Predicted Revenue (£)',
                  data: forecast.map(item => item.predicted_revenue),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  tension: 0.1,
                }],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Revenue Forecast' },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#4caf50', color: 'white', padding: '10px', borderRadius: '20px', fontSize: '12px' }}>
        🔴 LIVE
      </div>
      <SupportChatWidget
        API_BASE_URL={API_BASE_URL}
        WS_BASE_URL={WS_BASE_URL}
        user={user}
      />
    </div>
  );
}

export default Dashboard;
