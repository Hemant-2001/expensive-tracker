import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function Dashboard() {
  const { authFetch } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [form, setForm] = useState({ type: 'Income', description: '', amount: '', category: 'Other' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ type: '', description: '', amount: '', category: '' });
  const [budget, setBudget] = useState(0);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);

  const categories = {
    Income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    Expense: ['Food', 'Rent', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Other']
  };

  // Fetch all transactions and user budget
  const fetchData = useCallback(async () => {
    try {
      const [transRes, userRes] = await Promise.all([
        authFetch('/transactions'),
        authFetch('/auth/me')
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setBudget(userData.user.monthlyBudget || 0);
      }
    } catch {
      console.error('Failed to fetch data');
    }
  }, [authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateBudget = async () => {
    try {
      const res = await authFetch('/auth/update-budget', {
        method: 'PUT',
        body: JSON.stringify({ monthlyBudget: parseFloat(newBudget) })
      });
      if (res.ok) {
        setBudget(parseFloat(newBudget));
        setShowBudgetInput(false);
        setNewBudget('');
      }
    } catch {
      console.error('Failed to update budget');
    }
  };

  const getAIAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await authFetch('/transactions/ai-advice');
      if (res.ok) {
        const data = await res.json();
        setAiAdvice(data.advice);
      }
    } catch {
      console.error('Failed to fetch AI advice');
    } finally {
      setAdviceLoading(false);
    }
  };

  // Start editing
  const startEdit = (t) => {
    setEditingId(t._id);
    setEditForm({ type: t.type, description: t.description, amount: t.amount, category: t.category || 'Other' });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ type: '', description: '', amount: '' });
  };

  // Handle edit submission
  const handleEditSubmit = async (id) => {
    try {
      const res = await authFetch(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setTransactions((prev) => prev.map((t) => (t._id === id ? updated : t)));
        setEditingId(null);
      }
    } catch {
      console.error('Failed to update transaction');
    }
  };

  // Delete a transaction
  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t._id !== id));
      }
    } catch {
      console.error('Failed to delete transaction');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(form.amount);
    if (!form.description || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid description and amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          amount,
          category: form.category || 'Other',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to add transaction.');
      } else {
        setTransactions((prev) => [data, ...prev]);
        setForm({ type: 'Income', description: '', amount: '' });
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // CSV download - mirrors home.js downloadCSV exactly
  const downloadCSV = () => {
    if (displayTransactions.length === 0) {
      alert('No transactions to download.');
      return;
    }

    const headers = ['ID', 'Type', 'Category', 'Description', 'Amount', 'Date'];
    const rows = displayTransactions.map((t) => [
      t._id,
      t.type,
      t.category || 'Other',
      `"${t.description.replace(/"/g, '""')}"`,
      parseFloat(t.amount).toFixed(2),
      new Date(t.date).toISOString().split('T')[0],
    ]);

    // Add BOM for Excel UTF-8 compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `fintrack_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (displayTransactions.length === 0) {
      alert('No transactions to download.');
      return;
    }

    const doc = new jsPDF();
    doc.text('FinTrack - Transaction Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableColumn = ["Date", "Type", "Category", "Description", "Amount"];
    const tableRows = displayTransactions.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      t.type,
      t.category || 'Other',
      t.description,
      `INR ${parseFloat(t.amount).toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`fintrack_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Filter & sort (mirrors home.js renderTransactions logic)
  let displayTransactions = [...transactions];

  if (filterType !== 'All') {
    displayTransactions = displayTransactions.filter((t) => t.type === filterType);
  }

  if (searchTerm) {
    displayTransactions = displayTransactions.filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (dateRange.start) {
    displayTransactions = displayTransactions.filter((t) => new Date(t.date) >= new Date(dateRange.start));
  }
  if (dateRange.end) {
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);
    displayTransactions = displayTransactions.filter((t) => new Date(t.date) <= endDate);
  }

  displayTransactions.sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    return 0;
  });

  return (
    <>
      <Header />
      <main className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {/* Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="card summary-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--success-color)', padding: '15px' }}>
              <h4 style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Total Income</h4>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                ₹{transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="card summary-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--danger-color)', padding: '15px' }}>
              <h4 style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Total Expense</h4>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>
                ₹{transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="card summary-card" style={{ textAlign: 'center', borderLeft: '5px solid var(--primary-color)', padding: '15px' }}>
              <h4 style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Balance</h4>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                ₹{(transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0) -
                  transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0)).toFixed(2)}
              </p>
            </div>
            <div className="card summary-card" style={{ textAlign: 'center', borderLeft: `5px solid ${transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) > budget && budget > 0 ? 'var(--danger-color)' : '#f39c12'}`, padding: '15px' }}>
              <h4 style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Monthly Budget</h4>
              {showBudgetInput ? (
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    style={{ width: '60px', padding: '2px', background: '#333', color: '#fff', border: '1px solid #555' }}
                    placeholder="Amt"
                  />
                  <button onClick={handleUpdateBudget} className="btn-edit" style={{ color: 'var(--success-color)', padding: '2px' }}><i className="fas fa-check"></i></button>
                  <button onClick={() => setShowBudgetInput(false)} className="btn-delete" style={{ padding: '2px' }}><i className="fas fa-times"></i></button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) > budget && budget > 0 ? 'var(--danger-color)' : '#f39c12' }}>
                      ₹{budget.toFixed(2)}
                    </p>
                    <button onClick={() => setShowBudgetInput(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '0.8rem' }}>
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                  {/* Progress Bar Logic */}
                  {budget > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '3px' }}>
                        {((transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) / budget) * 100).toFixed(0)}% used
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min((transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) / budget) * 100, 100)}%`,
                          height: '100%',
                          background: transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0) > budget ? 'var(--danger-color)' : '#f39c12',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* AI Advice Section */}
          <section className="card ai-advice-card" style={{ borderLeft: '5px solid #9b59b6', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}><i className="fas fa-robot" style={{ color: '#9b59b6', marginRight: '8px' }}></i> AI Advisor</h4>
              <button
                className="btn btn-primary"
                onClick={getAIAdvice}
                disabled={adviceLoading}
                style={{ background: '#9b59b6', borderColor: '#8e44ad', padding: '5px 10px', fontSize: '0.8rem' }}
              >
                {adviceLoading ? '...' : 'Get Advice'}
              </button>
            </div>
            <div style={{ flex: 1, background: 'rgba(155, 89, 182, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(155, 89, 182, 0.3)', color: '#ddd', fontSize: '0.85rem', overflowY: 'auto', maxHeight: '100px' }}>
              {aiAdvice || "Click 'Get Advice' for personalized tips!"}
            </div>
          </section>
        </div>

        {/* Charts Section */}
        <section className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div className="card chart-card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Income vs Expense</h3>
            <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
              <Pie
                data={{
                  labels: ['Income', 'Expense'],
                  datasets: [
                    {
                      data: [
                        transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0),
                        transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0),
                      ],
                      backgroundColor: ['#2ecc71', '#e74c3c'],
                      borderColor: ['#27ae60', '#c0392b'],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{ maintainAspectRatio: false }}
              />
            </div>
          </div>
          <div className="card chart-card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Monthly Overview</h3>
            <div style={{ height: '250px' }}>
              <Bar
                data={{
                  labels: ['Total'],
                  datasets: [
                    {
                      label: 'Income',
                      data: [transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0)],
                      backgroundColor: '#2ecc71',
                    },
                    {
                      label: 'Expense',
                      data: [transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0)],
                      backgroundColor: '#e74c3c',
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </section>

        {/* Add Transaction Form */}
        <section className="card form-card">
          <h3>Add New Transaction</h3>
          <form id="transaction-form" onSubmit={handleSubmit}>
            {error && (
              <p style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>{error}</p>
            )}
            <div className="form-group">
              <label htmlFor="type">
                <i className="fas fa-exchange-alt"></i> Type
              </label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, category: categories[e.target.value][0] })}
                required
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="category">
                <i className="fas fa-list"></i> Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                {categories[form.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">
                <i className="fas fa-tag"></i> Description
              </label>
              <input
                type="text"
                id="description"
                placeholder="e.g., Monthly Salary"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">
                <i className="fas fa-dollar-sign"></i> Amount
              </label>
              <input
                type="number"
                id="amount"
                placeholder="e.g., 500"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary-full" disabled={loading}>
              <i className="fas fa-plus-circle"></i>{' '}
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </form>
        </section>

        {/* Transaction List */}
        <section className="card transactions-list-card">
          <h3>Recent Transactions</h3>

          <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
            <div className="search-group" style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ddd', width: '100%' }}
              />
            </div>
            <div className="date-filter" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }} />
              <span>to</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ddd' }} />
              {(dateRange.start || dateRange.end) && (
                <button onClick={() => setDateRange({ start: '', end: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><i className="fas fa-times-circle"></i></button>
              )}
            </div>
            <div className="filter-group">
              <select id="filter-type" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '8px', borderRadius: '5px' }}>
                <option value="All">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="sort-group">
              <select id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '5px' }}>
                <option value="date-desc">Newest First</option>
                <option value="amount-desc">Highest Amount</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn btn-secondary" onClick={downloadCSV}>
              <i className="fas fa-file-csv"></i> CSV
            </button>
            <button className="btn btn-secondary" onClick={downloadPDF}>
              <i className="fas fa-file-pdf"></i> PDF Report
            </button>
          </div>

          <ul id="transactions-list">
            {displayTransactions.length === 0 ? (
              <li style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No transactions added yet. Use the form above to start tracking!
              </li>
            ) : (
              displayTransactions.map((t) => {
                const sign = t.type === 'Income' ? '+' : '-';
                const displayDate = new Date(t.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                if (editingId === t._id) {
                  return (
                    <li key={t._id} className={`transaction-item ${t.type.toLowerCase()}`} style={{ gap: '10px', flexWrap: 'wrap' }}>
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value, category: categories[e.target.value][0] })}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                      </select>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {categories[editForm.type].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        style={{ flex: '1', minWidth: '150px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => handleEditSubmit(t._id)} className="btn-edit" style={{ color: 'var(--success-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <i className="fas fa-check"></i>
                        </button>
                        <button onClick={cancelEdit} className="btn-delete" style={{ color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={t._id} className={`transaction-item ${t.type.toLowerCase()}`}>
                    <div className="icon">
                      <i className={`fas fa-arrow-${t.type.toLowerCase() === 'income' ? 'up' : 'down'}`}></i>
                    </div>
                    <div className="details">
                      <span className="desc">{t.description}</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span className="date">{displayDate}</span>
                        <span style={{ fontSize: '0.75rem', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px', color: '#666' }}>{t.category || 'Other'}</span>
                      </div>
                    </div>
                    <span className="amount">
                      {sign} ₹{parseFloat(t.amount).toFixed(2)}
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn-edit"
                        onClick={() => startEdit(t)}
                        title="Edit transaction"
                        style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(t._id)}
                        title="Delete transaction"
                        aria-label="Delete transaction"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </main>
    </>
  );
}
