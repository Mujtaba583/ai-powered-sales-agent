import { Lead, LeadStatus } from '../types';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const USERS_STORAGE_KEY = 'solar_crm_registered_users';
const SESSION_STORAGE_KEY = 'solar_crm_active_session';
const LEADS_STORAGE_KEY = 'solar_crm_leads_data';
const LEADS_EVENT_NAME = 'solar_crm_leads_changed';

// Initial pre-configured staff accounts
const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'user-admin-1',
    name: 'Admin Manager',
    email: 'admin@solarsales.com',
    password: 'solar123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-agent-1',
    name: 'Sales Consultant',
    email: 'agent@solarsales.com',
    password: 'solar123',
    createdAt: new Date().toISOString(),
  },
];

// Initial verified sample leads
export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Zubair Ahmed',
    phone: '0300-1234567',
    email: 'zubair@gmail.com',
    product: '10kW Hybrid System',
    status: 'Hot',
    city: 'Lahore',
    address: 'Phase 5, DHA',
    note: 'Wants to install next week, discussing 12-month installment plan.',
    timestamp: 'Today, 10:15 AM',
    value: 'PKR 2.6M',
    estimatedKw: 10,
  },
  {
    id: 'lead-2',
    name: 'Kamran Khan',
    phone: '0321-7654321',
    email: 'kamran@yahoo.com',
    product: '5kW On-Grid System',
    status: 'Warm',
    city: 'Karachi',
    address: 'Block 4, Gulshan-e-Iqbal',
    note: 'Inquired about net metering paperwork and Tier-1 Bifacial panels brand.',
    timestamp: 'Yesterday',
    value: 'PKR 1.35M',
    estimatedKw: 5,
  },
  {
    id: 'lead-3',
    name: 'Ayesha Siddiqua',
    phone: '0333-9876543',
    email: 'ayesha@outlook.com',
    product: '7kW Premium Home Solar',
    status: 'New',
    city: 'Islamabad',
    address: 'Sector F-10/2',
    note: 'Requested rooftop structural inspection call back for 3 ACs.',
    timestamp: '2 days ago',
    value: 'PKR 1.85M',
    estimatedKw: 7,
  },
];

// ----------------- USER AUTHENTICATION -----------------

function getRegisteredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

export function getCurrentUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to set session:', e);
  }
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to logout:', e);
  }
}

export function login(
  email: string,
  pass: string
): { success: boolean; user?: UserSession; error?: string } {
  const normEmail = (email || '').trim().toLowerCase();
  const password = (pass || '').trim();

  if (!normEmail || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  const users = getRegisteredUsers();
  const matched = users.find((u) => u.email.toLowerCase() === normEmail);

  if (!matched) {
    return {
      success: false,
      error: 'Account not found. Please check your email or create a new account.',
    };
  }

  if (matched.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. Please try again.',
    };
  }

  const sessionUser: UserSession = {
    id: matched.id,
    name: matched.name,
    email: matched.email,
  };

  setCurrentSession(sessionUser);
  return { success: true, user: sessionUser };
}

export function register(
  businessName: string,
  email: string,
  pass: string
): { success: boolean; user?: UserSession; error?: string } {
  const name = (businessName || '').trim();
  const normEmail = (email || '').trim().toLowerCase();
  const password = (pass || '').trim();

  if (!name || name.length < 2) {
    return { success: false, error: 'Please enter your business or consultant name (min 2 characters).' };
  }

  if (!normEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = getRegisteredUsers();
  if (users.some((u) => u.email.toLowerCase() === normEmail)) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    name,
    email: normEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save user:', e);
  }

  const sessionUser: UserSession = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  };

  setCurrentSession(sessionUser);
  return { success: true, user: sessionUser };
}

// ----------------- LEADS MANAGEMENT -----------------

export function getLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    return parsed;
  } catch {
    return INITIAL_LEADS;
  }
}

function persistLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
    window.dispatchEvent(new Event(LEADS_EVENT_NAME));
  } catch (e) {
    console.error('Failed to persist leads:', e);
  }
}

export function saveLead(lead: Partial<Lead>): Lead {
  const current = getLeads();
  const cleanPhone = (lead.phone || '').trim();
  const cleanName = (lead.name || '').trim();

  const newLead: Lead = {
    id: lead.id || `lead-${Date.now()}`,
    name: cleanName || 'Valued Customer',
    phone: cleanPhone,
    email: lead.email || 'customer@solar-lead.com',
    product: lead.product || '5kW Hybrid System',
    status: (lead.status as LeadStatus) || 'New',
    note: lead.note || 'Inquiry captured via platform.',
    city: lead.city || 'Pakistan',
    address: lead.address || '',
    timestamp: lead.timestamp || 'Just now',
    value: lead.value || 'PKR 1.35M',
    estimatedKw: lead.estimatedKw || 5,
  };

  // Avoid duplicates if phone number exists in recent leads
  const existingIdx = current.findIndex(
    (l) => (cleanPhone && l.phone && l.phone.replace(/[^\d]/g, '') === cleanPhone.replace(/[^\d]/g, '')) || l.id === newLead.id
  );

  let updated: Lead[];
  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const bestName =
      cleanName && !['Valued Customer', 'Anonymous Customer', 'Direct Inquirer', 'Customer Inquiry'].includes(cleanName)
        ? cleanName
        : existing.name;

    const mergedLead: Lead = {
      ...existing,
      ...newLead,
      name: bestName,
      status: newLead.status === 'Hot' ? 'Hot' : existing.status,
      note: `${existing.note} | ${newLead.note}`,
      city: newLead.city !== 'Pakistan' ? newLead.city : existing.city,
      product: newLead.product || existing.product,
      value: newLead.value || existing.value,
      estimatedKw: newLead.estimatedKw || existing.estimatedKw,
    };
    updated = [...current];
    updated[existingIdx] = mergedLead;
  } else {
    updated = [newLead, ...current];
  }

  persistLeads(updated);

  // Background sync with API server if available
  try {
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead),
    }).catch(() => {});
  } catch {}

  return newLead;
}

/**
 * Intelligent Lead Extraction from Voice / Text conversation
 * Extracts Name, Pakistani Phone Number, City, System Size, and Notes
 */
export function extractLeadFromConversation(
  currentText: string,
  history?: { sender: string; text: string }[],
  productContext?: string | null
): Lead | null {
  const combinedHistory = (history || [])
    .filter((h) => h.sender === 'customer')
    .map((h) => h.text)
    .join(' ');
  const fullText = `${combinedHistory} ${currentText}`.trim();

  // 1. Phone number detection (Pakistan formats)
  const phoneRegex = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b)/;
  const phoneMatch = fullText.match(phoneRegex);

  if (!phoneMatch) {
    return null; // A valid sales lead must have a contact number
  }

  const phone = phoneMatch[0].trim();

  // 2. Name detection (English & Roman Urdu)
  let name = 'Valued Customer';
  const namePatterns = [
    /(?:my\s+name\s+is|mera\s+naam\s+(?:hai\s+)?|mera\s+name\s+(?:hai\s+)?|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:here|speaking)\b/i,
  ];

  for (const pattern of namePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1]
        .replace(/\s+(?:from|living|in|at|and|contact|number|phone|cell|mobile|solar|want|need)\b.*$/i, '')
        .trim();
      if (candidate.length >= 2 && !/^(solar|system|inverter|panel|hybrid|price|quote|survey|please|hello|yes|want)$/i.test(candidate)) {
        name = candidate;
        break;
      }
    }
  }

  // 3. City detection in Pakistan
  const cities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Bahawalpur',
    'Sargodha', 'Sukkur', 'Abbottabad', 'Gujrat', 'Wah Cantt'
  ];

  let city = 'Pakistan';
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(fullText)) {
      city = c;
      break;
    }
  }

  // 4. Product System sizing detection
  const lowerText = fullText.toLowerCase();
  let product = productContext || '5kW Hybrid System';
  let estimatedKw = 5;
  let value = 'PKR 1.2M - 1.45M';

  if (lowerText.includes('3kw') || lowerText.includes('3 kw')) {
    product = '3kW Home Solar';
    estimatedKw = 3;
    value = 'PKR 750k - 900k';
  } else if (lowerText.includes('5kw') || lowerText.includes('5 kw')) {
    product = '5kW Hybrid System';
    estimatedKw = 5;
    value = 'PKR 1.2M - 1.45M';
  } else if (lowerText.includes('7kw') || lowerText.includes('7 kw')) {
    product = '7kW Premium Home';
    estimatedKw = 7;
    value = 'PKR 1.7M - 2.0M';
  } else if (lowerText.includes('10kw') || lowerText.includes('10 kw')) {
    product = '10kW Business Solar';
    estimatedKw = 10;
    value = 'PKR 2.4M - 2.8M';
  } else if (lowerText.includes('20kw') || lowerText.includes('20 kw')) {
    product = '20kW Commercial System';
    estimatedKw = 20;
    value = 'PKR 4.6M - 5.2M';
  } else if (lowerText.includes('battery') || lowerText.includes('backup')) {
    product = 'Battery and Inverter';
    estimatedKw = 3;
    value = 'PKR 350k - 600k';
  }

  return {
    id: `lead-voice-${Date.now()}`,
    name,
    phone,
    email: 'customer@solar-lead.com',
    product,
    status: 'Hot',
    note: `Captured via Voice Assistant: "${currentText}"`,
    city,
    address: city !== 'Pakistan' ? `${city} Area` : '',
    timestamp: 'Just now',
    value,
    estimatedKw,
  };
}

export function updateLeadStatus(leadId: string, newStatus: LeadStatus): Lead[] {
  const current = getLeads();
  const updated = current.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
  persistLeads(updated);

  // Background sync
  try {
    fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => {});
  } catch {}

  return updated;
}

export function deleteLead(leadId: string): Lead[] {
  const current = getLeads();
  const updated = current.filter((l) => l.id !== leadId);
  persistLeads(updated);

  // Background sync
  try {
    fetch(`/api/leads/${leadId}`, { method: 'DELETE' }).catch(() => {});
  } catch {}

  return updated;
}

export function subscribeToLeads(callback: (leads: Lead[]) => void): () => void {
  // Emit immediately
  callback(getLeads());

  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getLeads());
  };

  window.addEventListener(LEADS_EVENT_NAME, handleUpdate);
  window.addEventListener('storage', handleUpdate);

  return () => {
    window.removeEventListener(LEADS_EVENT_NAME, handleUpdate);
    window.removeEventListener('storage', handleUpdate);
  };
}

export function exportLeadsToCsv(): void {
  const leads = getLeads();
  if (!leads.length) return;

  const headers = ['ID', 'Customer Name', 'Phone', 'Email', 'City', 'Address', 'Product', 'Status', 'Estimated KW', 'Value', 'Date/Time', 'Notes'];
  const rows = leads.map((l) => [
    `"${l.id}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.phone || '').replace(/"/g, '""')}"`,
    `"${(l.email || '').replace(/"/g, '""')}"`,
    `"${(l.city || '').replace(/"/g, '""')}"`,
    `"${(l.address || '').replace(/"/g, '""')}"`,
    `"${(l.product || '').replace(/"/g, '""')}"`,
    `"${l.status}"`,
    `"${l.estimatedKw || ''}"`,
    `"${l.value || ''}"`,
    `"${l.timestamp || ''}"`,
    `"${(l.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Solar_CRM_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
