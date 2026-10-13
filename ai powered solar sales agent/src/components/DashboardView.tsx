import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  user?: { id: string; name: string; email: string } | null;
  onNavigateToAssistant: () => void;
  onLogout: () => void;
  onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
  onDeleteLead?: (leadId: string) => void;
  onAddManualLead?: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  user,
  onNavigateToAssistant,
  onLogout,
  onUpdateStatus,
  onDeleteLead,
  onAddManualLead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lead Modal State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('Karachi');
  const [newAddress, setNewAddress] = useState('');
  const [newProduct, setNewProduct] = useState('5kW On-Grid System');
  const [newStatus, setNewStatus] = useState<LeadStatus>('New');
  const [newNote, setNewNote] = useState('');

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const hotLeads = leads.filter((l) => l.status === 'Hot').length;
  const followUps = leads.filter((l) => l.status === 'Warm' || l.status === 'New').length;

  const filtered = leads.filter((l) => {
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.address && l.address.toLowerCase().includes(q)) ||
      l.product.toLowerCase().includes(q) ||
      l.note.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const manualLead: Lead = {
      id: `lead-manual-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || 'walkin@client.pk',
      city: newCity,
      address: newAddress.trim() || 'Direct inquiry',
      product: newProduct,
      status: newStatus,
      note: newNote.trim() || 'Manually added by sales agent via CRM dashboard.',
      timestamp: 'Just now',
    };

    if (onAddManualLead) {
      onAddManualLead(manualLead);
    }
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNote('');
  };

  return (
    <main id="main" className="py-6 px-4">
      <section className="container max-w-7xl mx-auto">
        <div className="dashboard-layout">
          <aside className="dashboard-sidebar">
            <div className="p-4 mb-4 bg-teal-50/70 border border-teal-100 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 font-bold text-teal-800 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cloud Firestore
              </div>
              <p className="text-gray-600 text-[11px] leading-tight">
                Real-time persistent database connected.
              </p>
              {user && (
                <div className="mt-2 pt-2 border-t border-teal-200/60 text-gray-700">
                  <div className="font-semibold truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                </div>
              )}
            </div>

            <a className="sidebar-link active" href="#">
              📊 Pipeline Overview
            </a>
            <a
              className="sidebar-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowAddModal(true);
              }}
            >
              ➕ Add Lead
            </a>
            <a
              className="sidebar-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigateToAssistant();
              }}
            >
              🎙️ Voice Assistant
            </a>
            <a
              className="sidebar-link text-red-600 hover:text-red-700"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}
            >
              🚪 Sign Out
            </a>
          </aside>

          <section className="dashboard-main">
            <div className="dashboard-toolbar flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="eyebrow text-teal-600 font-semibold tracking-wider uppercase text-xs">
                  Solar Energy CRM Dashboard
                </div>
                <h1 className="h1 text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
                  Active Sales Pipeline & Site Surveys
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Persisted live in Google Cloud Firestore. Captured via Voice Assistant, Quote forms, and Direct inquiries.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-soft text-sm font-semibold"
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Lead
                </button>
                <button
                  type="button"
                  className="btn btn-primary text-sm font-semibold"
                  onClick={onNavigateToAssistant}
                >
                  Launch Voice Agent
                </button>
              </div>
            </div>

            <div className="kpi-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="Lead metrics">
              <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Leads</span>
                <strong className="block text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
                  {totalLeads}
                </strong>
              </div>
              <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-xs text-emerald-600 uppercase tracking-wider font-semibold">New Inquiries</span>
                <strong className="block text-2xl md:text-3xl font-extrabold text-emerald-600 mt-1">
                  {newLeads}
                </strong>
              </div>
              <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-xs text-amber-600 uppercase tracking-wider font-semibold">Hot Deals</span>
                <strong className="block text-2xl md:text-3xl font-extrabold text-amber-600 mt-1">
                  {hotLeads}
                </strong>
              </div>
              <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <span className="text-xs text-teal-600 uppercase tracking-wider font-semibold">Action Required</span>
                <strong className="block text-2xl md:text-3xl font-extrabold text-teal-600 mt-1">
                  {followUps}
                </strong>
              </div>
            </div>

            <section className="dashboard-card table-card bg-white rounded-2xl border border-gray-100 shadow-sm p-6" id="leads">
              <div className="table-top flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Leads & Inquiries Database</h2>
                  <span className="text-gray-400 text-xs">
                    Real-time cloud database synchronization
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <input
                    className="input px-3 py-1.5 text-xs rounded-xl border border-gray-300 w-48"
                    type="search"
                    placeholder="Search name, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="select px-3 py-1.5 text-xs rounded-xl border border-gray-300 w-32 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">⚡ Warm</option>
                    <option value="New">✨ New</option>
                    <option value="Closed">✅ Closed</option>
                  </select>
                </div>
              </div>

              <div className="table-wrap overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/80 text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Interest / System</th>
                      <th className="py-3 px-3">Contact & City</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Conversation Note</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                          No matching leads in database.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-gray-900">{lead.name}</div>
                            <div className="text-xs text-gray-400">{lead.email}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-medium text-gray-800">{lead.product}</div>
                            {lead.value && (
                              <div className="text-xs font-semibold text-teal-600 mt-0.5">
                                {lead.value}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-mono text-xs font-bold text-teal-700">
                              {lead.phone}
                            </div>
                            {(lead.address || lead.city) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {lead.address ? `${lead.address}, ` : ''}{lead.city || ''}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <select
                              value={lead.status}
                              onChange={(e) =>
                                onUpdateStatus &&
                                onUpdateStatus(lead.id, e.target.value as LeadStatus)
                              }
                              className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer ${
                                lead.status === 'Hot'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : lead.status === 'Warm'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : lead.status === 'New'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              <option value="New">✨ New</option>
                              <option value="Warm">⚡ Warm</option>
                              <option value="Hot">🔥 Hot</option>
                              <option value="Closed">✅ Closed</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-3 max-w-[280px]">
                            <p className="text-xs text-gray-600 line-clamp-2" title={lead.note}>
                              {lead.note || 'No notes available'}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete lead for "${lead.name}"?`)) {
                                  onDeleteLead && onDeleteLead(lead.id);
                                }
                              }}
                              className="text-xs text-gray-400 hover:text-red-600 p-1 rounded-md transition"
                              title="Delete Lead"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lead-cards md:hidden mt-4 space-y-3">
                {filtered.map((lead) => (
                  <article key={lead.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-900">{lead.name}</div>
                        <div className="text-xs text-gray-400">{lead.email}</div>
                      </div>
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          onUpdateStatus &&
                          onUpdateStatus(lead.id, e.target.value as LeadStatus)
                        }
                        className="text-xs font-semibold px-2 py-1 rounded-md border"
                      >
                        <option value="New">New</option>
                        <option value="Warm">Warm</option>
                        <option value="Hot">Hot</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                    <div className="text-xs text-gray-700 mb-1">
                      <span className="font-semibold text-gray-500">Package:</span> {lead.product}
                    </div>
                    <div className="text-xs text-teal-700 font-mono mb-1">
                      <span className="font-semibold text-gray-500">Phone:</span> {lead.phone}
                    </div>
                    {(lead.address || lead.city) && (
                      <div className="text-xs text-gray-600 mb-2">
                        <span className="font-semibold text-gray-500">Address:</span>{' '}
                        {lead.address ? `${lead.address}, ` : ''}{lead.city || ''}
                      </div>
                    )}
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                      {lead.note}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </div>
      </section>

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Customer Lead Manually</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Tariq Mahmood"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="tariq@gmail.com"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Site Address / Area
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. House 42, Street 8, Bahria Town"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System / Inquired Package
                  </label>
                  <select
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="3kW Home Solar System">3kW Home Solar System</option>
                    <option value="5kW On-Grid System">5kW On-Grid System</option>
                    <option value="7kW Premium Residential">7kW Premium Residential</option>
                    <option value="10kW Hybrid System">10kW Hybrid System</option>
                    <option value="15kW Commercial Solar">15kW Commercial Solar</option>
                    <option value="20kW Industrial Package">20kW Industrial Package</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="New">✨ New</option>
                    <option value="Warm">⚡ Warm</option>
                    <option value="Hot">🔥 Hot</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Requirements & Notes
                </label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Monthly bill, current appliances, rooftop survey preferences..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs font-semibold">
                  Save Lead to Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
