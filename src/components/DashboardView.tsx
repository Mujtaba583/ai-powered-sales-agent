import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Download, LogOut, RefreshCw, Phone, Trash2 } from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  onNavigateToAssistant: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads: propLeads,
  onNavigateToAssistant,
  onLogout,
}) => {
  const [leadsList, setLeadsList] = useState<Lead[]>(propLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const refreshLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data && Array.isArray(data.leads)) {
        setLeadsList(data.leads);
      }
    } catch (err) {
      console.warn('Failed to refresh leads:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshLeads();

    const handleNewLead = (e: any) => {
      const captured = e?.detail;
      if (captured) {
        setLeadsList((prev) => {
          const exists = prev.some((l) => l.id === captured.id || (l.phone && l.phone === captured.phone));
          if (exists) {
            return prev.map((l) => (l.id === captured.id || l.phone === captured.phone ? { ...l, ...captured } : l));
          }
          return [captured, ...prev];
        });
      }
      refreshLeads();
    };

    window.addEventListener('solar_crm_lead_captured', handleNewLead);
    const poller = setInterval(refreshLeads, 4000);

    return () => {
      window.removeEventListener('solar_crm_lead_captured', handleNewLead);
      clearInterval(poller);
    };
  }, []);

  useEffect(() => {
    if (propLeads && propLeads.length > 0) {
      setLeadsList(propLeads);
    }
  }, [propLeads]);

  const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    setLeadsList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.warn('Failed to update status on server:', err);
    }
  };

  const deleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    setLeadsList((prev) => prev.filter((l) => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete lead on server:', err);
    }
  };

  const exportToCSV = () => {
    if (leadsList.length === 0) return;
    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'City',
      'Address',
      'Monthly Bill',
      'Solar Product',
      'Status',
      'Estimated Value',
      'Estimated kW',
      'Timestamp',
      'Notes',
    ];

    const rows = leadsList.map((l) => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${(l.city || 'Pakistan').replace(/"/g, '""')}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${(l.monthlyBill || '').replace(/"/g, '""')}"`,
      `"${l.product.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.value || ''}"`,
      `"${l.estimatedKw || ''}"`,
      `"${l.timestamp}"`,
      `"${l.note.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `solar_sales_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLeads = leadsList.length;
  const newLeads = leadsList.filter((l) => l.status === 'New').length;
  const hotLeads = leadsList.filter((l) => l.status === 'Hot').length;
  const followUps = leadsList.filter((l) => l.status === 'Warm' || l.status === 'New').length;

  const filtered = leadsList.filter((l) => {
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.product.toLowerCase().includes(q) ||
      l.note.toLowerCase().includes(q) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.address && l.address.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <main id="main">
      <section className="page-hero">
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="dashboard-sidebar">
            <button
              type="button"
              className="sidebar-link active"
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BarChart3 size={16} />
              <span>Pipeline Overview</span>
            </button>
            <button
              type="button"
              className="sidebar-link"
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={16} />
              <span>All Leads ({leadsList.length})</span>
            </button>
            <button
              type="button"
              className="sidebar-link"
              onClick={exportToCSV}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={16} />
              <span>Export to CSV</span>
            </button>
            <button
              type="button"
              className="sidebar-link"
              data-logout
              onClick={onLogout}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </aside>

          {/* Main Area */}
          <section className="dashboard-main">
            <div className="dashboard-toolbar">
              <div>
                <div className="eyebrow">Enterprise CRM & Sales Console</div>
                <h1 className="h1" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.2rem)' }}>
                  Captured Solar Sales Leads
                </h1>
                <p className="lead">
                  Customer requirements, contact numbers, rooftop locations, and turnkey quotes generated live from the AI Voice & Chat Assistant.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={refreshLeads}
                  disabled={isRefreshing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh Leads'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onNavigateToAssistant}
                >
                  + Test AI Voice Assistant
                </button>
              </div>
            </div>

            {/* KPI Metrics Grid */}
            <div className="kpi-grid" aria-label="Lead metrics">
              <div className="kpi-card">
                <span>Total Inquiries</span>
                <strong data-total-leads>{totalLeads}</strong>
              </div>
              <div className="kpi-card">
                <span>New Today</span>
                <strong data-new-leads>{newLeads}</strong>
              </div>
              <div className="kpi-card">
                <span>Hot Leads</span>
                <strong data-hot-leads>{hotLeads}</strong>
              </div>
              <div className="kpi-card">
                <span>Active Follow-ups</span>
                <strong data-follow-ups>{followUps}</strong>
              </div>
            </div>

            {/* Leads Table Card */}
            <section className="dashboard-card table-card" id="leads-queue">
              <div className="table-top">
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Lead Pipeline & Inquiry Queue</h2>
                  <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {filtered.length} lead{filtered.length === 1 ? '' : 's'} matching criteria
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    style={{ minWidth: '180px', maxWidth: '240px' }}
                    data-lead-search
                    type="search"
                    placeholder="Search name, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="select"
                    style={{ minWidth: '110px' }}
                    data-status-filter
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="New">New</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={exportToCSV}
                    title="Export current leads to CSV"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Desktop / Laptop Table View */}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Solar Product</th>
                      <th>Contact Number</th>
                      <th>Location / Address</th>
                      <th>Requirement Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody data-lead-table>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                          No leads match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((lead) => {
                        return (
                          <tr key={lead.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLead(lead)}>
                            <td>
                              <div className="lead-name" style={{ fontWeight: 650 }}>{lead.name}</div>
                              <span className="lead-sub" style={{ fontSize: '0.78rem' }}>{lead.email}</span>
                              {lead.monthlyBill && (
                                <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, marginTop: '2px' }}>
                                  Bill: {lead.monthlyBill}
                                </div>
                              )}
                            </td>
                            <td>
                              <select
                                className="select"
                                value={lead.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '0.76rem',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  background:
                                    lead.status === 'Hot'
                                      ? '#fee2e2'
                                      : lead.status === 'Warm'
                                      ? '#fef3c7'
                                      : lead.status === 'New'
                                      ? '#dbeafe'
                                      : '#f1f5f9',
                                  color:
                                    lead.status === 'Hot'
                                      ? '#b91c1c'
                                      : lead.status === 'Warm'
                                      ? '#b45309'
                                      : lead.status === 'New'
                                      ? '#1d4ed8'
                                      : '#475569',
                                  border: 'none',
                                }}
                              >
                                <option value="Hot">Hot</option>
                                <option value="Warm">Warm</option>
                                <option value="New">New</option>
                                <option value="Closed">Closed</option>
                              </select>
                              <div style={{ fontSize: '0.84rem', marginTop: '4px', fontWeight: 550 }}>
                                {lead.product}
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ fontFamily: 'monospace', color: 'var(--primary-700)', fontWeight: 700 }}>
                                {lead.phone}
                              </div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <a
                                  href={`tel:${lead.phone}`}
                                  style={{
                                    fontSize: '0.74rem',
                                    padding: '2px 8px',
                                    background: '#e0f2fe',
                                    color: '#0284c7',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                  title="Call directly"
                                >
                                  <Phone size={11} />
                                  <span>Call</span>
                                </a>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                                {lead.city || 'Pakistan'}
                              </div>
                              {lead.address && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                                  {lead.address}
                                </div>
                              )}
                            </td>
                            <td style={{ maxWidth: '300px', fontSize: '0.85rem', lineHeight: 1.45 }}>
                              {lead.note}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLead(lead)}
                                  style={{
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    color: 'var(--text)',
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteLead(lead.id)}
                                  style={{
                                    background: '#fee2e2',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    color: '#b91c1c',
                                  }}
                                  title="Delete lead"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lead-cards" data-lead-cards>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    No leads found matching criteria.
                  </div>
                ) : (
                  filtered.map((lead) => {
                    return (
                      <article key={lead.id} className="lead-card-mobile" onClick={() => setSelectedLead(lead)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <div className="lead-name" style={{ fontSize: '1.05rem', fontWeight: 650 }}>{lead.name}</div>
                            <div className="lead-sub" style={{ fontSize: '0.8rem' }}>{lead.email}</div>
                          </div>
                          <span className={`status ${lead.status.toLowerCase()}`}>
                            {lead.status}
                          </span>
                        </div>

                        <div className="row">
                          <span>Solar Product</span>
                          <strong style={{ fontSize: '0.88rem' }}>{lead.product}</strong>
                        </div>

                        <div className="row">
                          <span>Phone</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--primary-700)', fontSize: '0.95rem' }}>
                              {lead.phone}
                            </strong>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                                background: '#e0f2fe',
                                color: '#0284c7',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Phone size={11} />
                              <span>Call</span>
                            </a>
                          </div>
                        </div>

                        {(lead.city || lead.address) && (
                          <div className="row">
                            <span>Location</span>
                            <strong>
                              {lead.city}
                              {lead.address ? ` • ${lead.address}` : ''}
                            </strong>
                          </div>
                        )}

                        {lead.monthlyBill && (
                          <div className="row">
                            <span>Monthly Bill</span>
                            <strong style={{ color: '#0d9488' }}>{lead.monthlyBill}</strong>
                          </div>
                        )}

                        <div className="row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                          <span style={{ fontSize: '0.76rem', textTransform: 'uppercase', color: 'var(--muted)' }}>Inquiry Notes</span>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4 }}>
                            {lead.note}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </section>
        </div>
      </section>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setSelectedLead(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className={`status ${selectedLead.status.toLowerCase()}`}>
                  {selectedLead.status} Lead
                </span>
                <h3 style={{ fontSize: '1.4rem', margin: '8px 0 2px' }}>{selectedLead.name}</h3>
                <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{selectedLead.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Phone Contact</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--primary-700)' }}>
                    {selectedLead.phone}
                  </strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>City & Address</div>
                  <strong style={{ fontSize: '0.88rem' }}>{selectedLead.city || 'Pakistan'}</strong>
                  {selectedLead.address && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{selectedLead.address}</div>}
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Monthly Bill</div>
                  <strong style={{ fontSize: '0.88rem', color: '#0d9488' }}>{selectedLead.monthlyBill || 'Not specified'}</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Interested Solar Solution</div>
                <strong style={{ fontSize: '0.92rem' }}>{selectedLead.product}</strong>
                {selectedLead.value && <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>Estimate: {selectedLead.value}</div>}
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Conversation Notes</div>
                <p style={{ margin: '6px 0 0', lineHeight: 1.5, fontSize: '0.88rem', color: 'var(--text)' }}>
                  {selectedLead.note}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => deleteLead(selectedLead.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b91c1c',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete Lead</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedLead(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
