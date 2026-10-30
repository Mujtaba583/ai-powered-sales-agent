import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini SDK with User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Initial Lead Database
// Lead Interface with full lead details
export interface ServerLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  status: 'Hot' | 'Warm' | 'New' | 'Closed';
  note: string;
  city?: string;
  address?: string;
  monthlyBill?: string;
  source?: string;
  timestamp: string;
  value?: string;
  estimatedKw?: number;
}

const LEADS_FILE = path.resolve(__dirname, 'leads_database.json');

const defaultLeads: ServerLead[] = [
  {
    id: 'lead-1',
    name: 'Zubair Ahmed',
    phone: '0300-1234567',
    email: 'zubair@gmail.com',
    product: '10kW Hybrid System',
    status: 'Hot',
    note: 'Wants 10kW system for 1-Kanal house in DHA Phase 5. Monthly bill PKR 70,000.',
    city: 'Lahore',
    address: 'DHA Phase 5, Sector C',
    monthlyBill: 'PKR 70,000',
    source: 'Voice Assistant',
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
    note: 'Inquired about net metering paperwork and Tier-1 Bifacial panels brand for Gulshan home.',
    city: 'Karachi',
    address: 'Block 13-D, Gulshan-e-Iqbal',
    monthlyBill: 'PKR 35,000',
    source: 'Voice Assistant',
    timestamp: 'Yesterday',
    value: 'PKR 1.35M',
    estimatedKw: 5,
  },
  {
    id: 'lead-3',
    name: 'Ayesha Siddiqua',
    phone: '0333-9876543',
    email: 'ayesha@outlook.com',
    product: '7kW Inverter System',
    status: 'New',
    note: 'Requested free rooftop site assessment and Net Metering for Islamabad residence.',
    city: 'Islamabad',
    address: 'House 42, Street 18, F-10/2',
    monthlyBill: 'PKR 52,000',
    source: 'Voice Assistant',
    timestamp: '2 days ago',
    value: 'PKR 1.85M',
    estimatedKw: 7,
  },
  {
    id: 'lead-4',
    name: 'Dr. Tariq Mahmood',
    phone: '0302-8899112',
    email: 'dr.tariq@hospital.org',
    product: '20kW Commercial System',
    status: 'Hot',
    note: 'Daytime medical clinic load reduction. Needs 3-phase net metering proposal with Huawei inverter.',
    city: 'Faisalabad',
    address: 'Civil Lines, Near DHQ',
    monthlyBill: 'PKR 140,000',
    source: 'Web Consultation',
    timestamp: '3 days ago',
    value: 'PKR 4.9M',
    estimatedKw: 20,
  },
  {
    id: 'lead-5',
    name: 'Hassan Raza',
    phone: '0345-5544332',
    email: 'hassan.r@gmail.com',
    product: '5.12kWh Felicity LiFePO4 Battery',
    status: 'Warm',
    note: 'Suffering from 4-hour evening load shedding, needs 5kWh lithium battery storage for 2 ACs.',
    city: 'Rawalpindi',
    address: 'Bahria Town Phase 4',
    monthlyBill: 'PKR 45,000',
    source: 'Voice Assistant',
    timestamp: '4 days ago',
    value: 'PKR 480k',
    estimatedKw: 3,
  },
];

function loadLeadsFromDisk(): ServerLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('Could not read leads_database.json, using defaults:', err);
  }
  return defaultLeads;
}

function persistLeadsToDisk() {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leadsDatabase, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist leads to disk:', err);
  }
}


let leadsDatabase: ServerLead[] = loadLeadsFromDisk();

// Supabase REST persistence. The service-role key is server-side only.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseRequest(pathname: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getStoredLeads(): Promise<ServerLead[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return leadsDatabase;
  const rows = await supabaseRequest('leads?select=id,data&order=created_at.desc') as { id: string; data: ServerLead }[];
  if (!rows.length) {
    // Seed the database once with the project's existing demo leads.
    for (const lead of defaultLeads) await saveStoredLead(lead);
    return [...defaultLeads];
  }
  return rows.map((row) => row.data);
}

async function saveStoredLead(lead: ServerLead): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    leadsDatabase = [lead, ...leadsDatabase.filter((item) => item.id !== lead.id)];
    persistLeadsToDisk();
    return;
  }
  await supabaseRequest('leads?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: lead.id, data: lead }),
  });
}

async function updateStoredLead(id: string, patch: Partial<ServerLead>): Promise<ServerLead | null> {
  const leads = await getStoredLeads();
  const current = leads.find((lead) => lead.id === id);
  if (!current) return null;
  const updated = { ...current, ...patch, id };
  await saveStoredLead(updated);
  return updated;
}

async function deleteStoredLead(id: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    leadsDatabase = leadsDatabase.filter((lead) => lead.id !== id);
    persistLeadsToDisk();
    return;
  }
  await supabaseRequest(`leads?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}


// Intelligent context-aware solar expert knowledge engine (Pakistan market)
function getSmartSolarExpertReply(
  userText: string,
  productContext?: string,
  _history?: { sender: string; text: string }[]
): { reply: string; capturedLead?: ServerLead | null } {
  const query = (userText || '').toLowerCase().trim();

  // Detect Phone
  const phonePattern = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b|\b\d{11}\b)/;
  const phoneMatch = userText.match(phonePattern);

  // Detect Name
  const nameMatch = userText.match(
    /(?:my\s+name\s+is|mera\s+naam\s+|mera\s+name\s+|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  let detectedName = nameMatch
    ? nameMatch[1].replace(/\b(?:hai|hun|he|from|living|in|at|and|contact|number|phone|se)\b.*$/i, '').trim()
    : '';

  // Detect City
  const pakCities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Bahawalpur',
    'Sargodha', 'Sukkur', 'Abbottabad', 'Wah Cantt', 'Gujrat', 'Sheikhupura'
  ];
  let detectedCity = '';
  for (const city of pakCities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(userText)) {
      detectedCity = city;
      break;
    }
  }

  // Detect Bill / Budget
  const billMatch = userText.match(/(?:bill|bijli|bijli ka bill|monthly bill)[^\d]*(\d+[\d,\.]*)/i) ||
                    userText.match(/(\d+[\d,\.]*)\s*(?:hazar|k|thousand|pkr|rs)/i);
  let detectedBill = billMatch ? billMatch[0] : '';

  let capturedLead: ServerLead | null = null;
  if (phoneMatch || (detectedName && detectedCity)) {
    const pNumber = phoneMatch ? phoneMatch[0].trim() : '0300-0000000';
    const cName = detectedName || 'Direct Inquirer';
    capturedLead = {
      id: `lead-${Date.now()}`,
      name: cName,
      phone: pNumber,
      email: `${cName.toLowerCase().replace(/\s+/g, '.') || 'inquiry'}@solar.live`,
      product: productContext || 'Turnkey Solar System',
      status: 'Hot',
      note: `Inquiry: "${userText}"`,
      city: detectedCity || 'Pakistan',
      address: detectedCity ? `${detectedCity} Region` : '',
      monthlyBill: detectedBill || '',
      source: 'AI Sales Assistant',
      timestamp: 'Just now',
      value: 'PKR 1.45M',
      estimatedKw: 5,
    };
  }

  let leadPrefix = '';
  if (phoneMatch || detectedName) {
    const who = detectedName || 'valued customer';
    const where = detectedCity ? ` in ${detectedCity}` : '';
    leadPrefix = `Thank you, ${who}! I have registered your inquiry details${phoneMatch ? ` (${phoneMatch[0]})` : ''}${where}. `;
  }

  // 1. Tier-1 Bifacial panels inquiry (Longi, Jinko, Canadian Solar)
  if (
    query.includes('bifacial') ||
    query.includes('tier-1') ||
    query.includes('tier 1') ||
    query.includes('longi') ||
    query.includes('jinko') ||
    query.includes('canadian') ||
    (query.includes('panel') && (query.includes('what') || query.includes('which') || query.includes('difference') || query.includes('type') || query.includes('rate') || query.includes('price') || query.includes('qeemat')))
  ) {
    return {
      reply: `${leadPrefix}Tier-1 bifacial panels are dual-sided modules by Bloomberg-verified top tier manufacturers like Longi and Jinko. They absorb sunlight from both the front and rear surfaces to generate 10% to 25% additional power. In Pakistan, Longi Hi-MO 6 Explorer 585W and Jinko Tiger Neo TOPCon 585W are currently available at approximately PKR 31-33 per watt (~PKR 18,200 to 18,800 per panel) with a 25-30 year linear output warranty. Would you like a customized roof layout proposal?`,
      capturedLead,
    };
  }

  // 2. Inverter inquiries (Inverex Nitrox, Growatt, Huawei, Knox, Hybrid, On-Grid)
  if (
    query.includes('inverter') ||
    query.includes('nitrox') ||
    query.includes('inverex') ||
    query.includes('growatt') ||
    query.includes('huawei') ||
    query.includes('hybrid') ||
    query.includes('on-grid') ||
    query.includes('off-grid')
  ) {
    return {
      reply: `${leadPrefix}For Pakistani grid conditions, hybrid inverters are recommended because they support both green net-metering and zero-millisecond battery backup during load shedding. Top choices include Inverex Nitrox 6kW Single-Phase (~PKR 295,000), Inverex Nitrox 10kW 3-Phase (~PKR 485,000), Growatt 5kW (~PKR 215,000), and European-grade Huawei SUN2000 10kW (~PKR 490,000). Does your premises have a single-phase or 3-phase meter?`,
      capturedLead,
    };
  }

  // 3. Batteries & Energy Storage (Lithium, LiFePO4, Felicity, Tubular, Phoenix)
  if (
    query.includes('battery') ||
    query.includes('lithium') ||
    query.includes('lifepo4') ||
    query.includes('felicity') ||
    query.includes('tubular') ||
    query.includes('backup') ||
    query.includes('load shedding') ||
    query.includes('storage')
  ) {
    return {
      reply: `${leadPrefix}For dependable energy backup, we provide Felicity Solar 51.2V 100Ah (5.12kWh) Wall-Mount Lithium LiFePO4 batteries (~PKR 315,000) offering 6,000+ deep cycles (10-15 year lifespan) with 95% depth of discharge. We also supply Phoenix TX-1800 tubular batteries (~PKR 68,000 each) for lead-acid setups. What essential appliances (such as Inverter ACs, water pumps, or refrigerators) do you plan to run during load shedding?`,
      capturedLead,
    };
  }

  // 4. Net Metering inquiries (LESCO, K-Electric, IESCO, MEPCO, FESCO, Green Meter)
  if (
    query.includes('net meter') ||
    query.includes('green meter') ||
    query.includes('lesco') ||
    query.includes('kelectric') ||
    query.includes('k-electric') ||
    query.includes('iesco') ||
    query.includes('mepco') ||
    query.includes('fesco') ||
    query.includes('gepco') ||
    query.includes('nepra')
  ) {
    return {
      reply: `${leadPrefix}Net metering uses a bidirectional green meter to export excess daytime solar generation directly to your utility company (LESCO, K-Electric, IESCO, etc.), banking units at peak tariff rates to offset your night consumption and bring your monthly electricity bill down to zero. We handle the complete DISCO licensing, NEPRA inspection, and green meter commissioning turnkey. Do you currently have a 3-phase connection at your site?`,
      capturedLead,
    };
  }

  // 5. System sizing, home size, or monthly electricity bill
  if (
    query.includes('bill') ||
    query.includes('bijli') ||
    query.includes('kharcha') ||
    query.includes('marla') ||
    query.includes('kanal') ||
    query.includes('ghar') ||
    query.includes('home') ||
    query.includes('size') ||
    query.includes('recommend') ||
    query.includes('3kw') ||
    query.includes('5kw') ||
    query.includes('7kw') ||
    query.includes('10kw') ||
    query.includes('20kw')
  ) {
    if (query.includes('3kw')) {
      return {
        reply: `${leadPrefix}Our 3kW On-Grid/Hybrid System is PKR 750,000 - 880,000 turnkey. It produces 12-15 units per day, perfectly running 1 Inverter AC during peak sunshine hours alongside fans, lights, and refrigerator. Ideal for 5-Marla homes with monthly bills around PKR 25,000 to 40,000.`,
        capturedLead,
      };
    }
    if (query.includes('5kw')) {
      return {
        reply: `${leadPrefix}Our 5kW Hybrid Package (Pakistan's most popular setup) costs PKR 1.2M - 1.45M turnkey. It produces 22-26 units daily, running 2 Inverter ACs plus complete household load, and is fully net-metering ready. What city or address is your site located in?`,
        capturedLead,
      };
    }
    if (query.includes('7kw')) {
      return {
        reply: `${leadPrefix}Our 7kW Premium Package is PKR 1.65M - 1.95M turnkey, generating 30-36 units per day for 10-Marla or 1-Kanal homes running up to 3 Inverter ACs simultaneously. May I have your address and contact number to arrange a site assessment?`,
        capturedLead,
      };
    }
    if (query.includes('10kw')) {
      return {
        reply: `${leadPrefix}Our 10kW 3-Phase Commercial & Residential Package is PKR 2.35M - 2.75M turnkey. It produces 45-55 units daily with 3-phase net metering, perfect for 1-Kanal homes or offices with summer bills over PKR 65,000. Would you like our engineer to inspect your roof structure?`,
        capturedLead,
      };
    }
    if (query.includes('20kw')) {
      return {
        reply: `${leadPrefix}Our 20kW Commercial & Industrial Package is PKR 4.5M - 5.2M turnkey, generating 90-110 units daily for schools, clinics, and manufacturing facilities, eliminating commercial tariffs. Would you like an itemized commercial BOQ?`,
        capturedLead,
      };
    }
    return {
      reply: `${leadPrefix}System sizing depends on your appliances and electricity bill: A bill of PKR 25k-40k suits a 3kW-5kW system (PKR 750k-1.45M); PKR 45k-70k is ideal for 5kW-7kW (PKR 1.2M-1.95M); and bills over PKR 75k benefit most from a 10kW 3-phase system with Net Metering (PKR 2.35M-2.75M). May I have your full name, city/address, and phone number to prepare your free ROI proposal?`,
      capturedLead,
    };
  }

  // 6. Selected Product Context
  if (productContext) {
    return {
      reply: `${leadPrefix}Regarding ${productContext}: it is one of our premium, high-efficiency solar solutions engineered for Pakistan's climate with full manufacturer warranty and tier-1 certification. Would you like our technical engineer to visit your premises or share an itemized quote? Please share your city and phone number.`,
      capturedLead,
    };
  }

  // 6.5 Off-topic non-solar queries (car, vehicles, food, weather, medical, etc.)
  if (
    query.includes('car') ||
    query.includes('gari') ||
    query.includes('gaari') ||
    query.includes('bike') ||
    query.includes('motorcycle') ||
    query.includes('vehicle') ||
    query.includes('food') ||
    query.includes('pizza') ||
    query.includes('burger') ||
    query.includes('weather') ||
    query.includes('movie') ||
    query.includes('hotel') ||
    query.includes('flight') ||
    query.includes('loan') ||
    query.includes('cricket') ||
    query.includes('doctor')
  ) {
    if (query.includes('car') || query.includes('gari') || query.includes('gaari') || query.includes('vehicle')) {
      return {
        reply: "I am your AI Solar Energy Consultant. While I do not sell cars, I can help you design a solar panel system with an EV home charger so you can charge your electric vehicle for free using clean solar power! Would you like details on a solar setup for your home?",
        capturedLead,
      };
    }
    return {
      reply: "I am an AI Solar Energy Consultant specialized in solar panels, hybrid inverters, battery backups, and net metering in Pakistan. I can't assist with topics outside solar power, but I would be glad to help you reduce your electricity bills to zero with a rooftop solar system. How can I help with your energy needs?",
      capturedLead,
    };
  }

  // 7. General Greetings or Default Response
  if (/^(hi|hello|hey|salam|slam|assalam|aoa|kese|kaise|kia hal|kya hal)/i.test(query)) {
    return {
      reply: "Welcome! I am your AI Sales Agent. We provide Tier-1 bifacial panels (Longi, Jinko), hybrid inverters (Inverex Nitrox, Growatt, Huawei), and complete Net Metering solutions in Pakistan. How can I assist you with your home or business solar installation today?",
      capturedLead,
    };
  }

  return {
    reply: `${leadPrefix}We offer turnkey solar installations across Pakistan using Tier-1 bifacial panels (Longi, Jinko) and smart hybrid inverters (Inverex, Growatt) with net metering support. Systems range from 3kW (PKR 750k-880k), 5kW (PKR 1.2M-1.45M), 7kW (PKR 1.65M-1.95M) to 10kW (PKR 2.35M-2.75M). Could you share your monthly electricity bill, city, or phone number so our AI sales agent can arrange a free rooftop feasibility assessment?`,
    capturedLead,
  };
}

// Authentication accounts are stored in Supabase when configured.
interface ServerUser { id: string; name: string; email: string; passwordHash: string; createdAt: string; }
const usersDatabase: ServerUser[] = [];

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
async function findUserByEmail(email: string): Promise<ServerUser | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return usersDatabase.find((u) => u.email === email) || null;
  const rows = await supabaseRequest(`user_accounts?select=id,name,email,password_hash,created_at&email=eq.${encodeURIComponent(email)}&limit=1`) as any[];
  return rows[0] ? { id: rows[0].id, name: rows[0].name, email: rows[0].email, passwordHash: rows[0].password_hash, createdAt: rows[0].created_at } : null;
}
async function createUser(user: ServerUser): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { usersDatabase.push(user); return; }
  await supabaseRequest('user_accounts', { method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ id: user.id, name: user.name, email: user.email, password_hash: user.passwordHash }) });
}
async function ensureDemoAdmin(): Promise<void> {
  const existing = await findUserByEmail('admin@solarsales.com');
  if (!existing) await createUser({ id: 'user-demo-1', name: 'Admin Owner', email: 'admin@solarsales.com', passwordHash: hashPassword('solar123'), createdAt: new Date().toISOString() });
}

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || String(password).length < 8) {
      return res.status(400).json({ error: 'Name, email, and a password of at least 8 characters are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await findUserByEmail(normalizedEmail)) return res.status(400).json({ error: 'An account with this email already exists' });
    const user: ServerUser = { id: `user-${crypto.randomUUID()}`, name: String(name).trim(), email: normalizedEmail, passwordHash: hashPassword(String(password)), createdAt: new Date().toISOString() };
    await createUser(user);
    res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email }, message: 'Account created successfully' });
  } catch (error) { console.error('Signup failed:', error); res.status(500).json({ error: 'Could not create account. Check database configuration.' }); }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    await ensureDemoAdmin();
    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user || !verifyPassword(String(password), user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, message: 'Logged in successfully' });
  } catch (error) { console.error('Login failed:', error); res.status(500).json({ error: 'Could not log in. Check database configuration.' }); }
});

// API: Get Leads
app.get('/api/leads', async (_req: Request, res: Response) => {
  try {
    res.json({ leads: await getStoredLeads() });
  } catch (error) {
    console.error('Unable to load leads:', error);
    res.status(500).json({ error: 'Unable to load leads. Check Supabase configuration.' });
  }
});

// API: Add Lead
app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, product, status, note, city, address, monthlyBill, value, estimatedKw } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone number are required.' });
    const newLead: ServerLead = {
      id: `lead-${Date.now()}`, name, phone,
      email: email || 'captured@ai-agent.live',
      product: product || 'Solar Consultation',
      status: status || 'New',
      note: note || 'Customer registered inquiry through voice assistant.',
      city: city || 'Not specified', address: address || '',
      monthlyBill: monthlyBill || '', source: 'Voice Assistant',
      timestamp: new Date().toISOString(), value: value || 'PKR 1.2M',
      estimatedKw: estimatedKw || 5,
    };
    await saveStoredLead(newLead);
    res.status(201).json({ lead: newLead, success: true });
  } catch (error) {
    console.error('Unable to save lead:', error);
    res.status(500).json({ error: 'Unable to save lead. Check Supabase configuration.' });
  }
});

// API: Update Lead
app.patch('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateStoredLead(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json({ lead: updated, success: true });
  } catch (error) {
    console.error('Unable to update lead:', error);
    res.status(500).json({ error: 'Unable to update lead.' });
  }
});

// API: Delete Lead
app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    await deleteStoredLead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Unable to delete lead:', error);
    res.status(500).json({ error: 'Unable to delete lead.' });
  }
});

// API: Stats
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const leads = await getStoredLeads();
    const total = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New').length;
    const hotLeads = leads.filter((l) => l.status === 'Hot').length;
    const warmLeads = leads.filter((l) => l.status === 'Warm').length;
    const closedLeads = leads.filter((l) => l.status === 'Closed').length;
    res.json({ totalLeads: total, newLeads, hotLeads, warmLeads, closedLeads,
      followUps: warmLeads + newLeads, estimatedPipelineValue: 'PKR 11.2M' });
  } catch (error) {
    console.error('Unable to calculate stats:', error);
    res.status(500).json({ error: 'Unable to load dashboard statistics.' });
  }
});

// API: Get Fine-Tuning Dataset for TinyLlama 1.1B
app.get('/api/dataset', (_req: Request, res: Response) => {
  try {
    const datasetPath = path.resolve(__dirname, 'dataset', 'solar_sales_tinyllama_dataset.json');
    if (fs.existsSync(datasetPath)) {
      const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
      return res.json({ dataset: data, count: data.length });
    }
    return res.json({ dataset: [], count: 0 });
  } catch (err) {
    console.error('Error reading dataset:', err);
    return res.status(500).json({ error: 'Failed to read dataset' });
  }
});



// API: AI Sales Chat & Lead Capture
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, productContext, modelEngine } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.text || '';

    let replyText = '';
    let newlyCapturedLead: ServerLead | null = null;

    // Pre-extract phone and customer details if present in the message
    const phonePattern = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b|\b\d{11}\b)/;
    const phoneMatch = userText.match(phonePattern);
    
    // Check if name is mentioned
    let extractedName = 'Direct Inquirer';
    const nameMatch = userText.match(
      /(?:my\s+name\s+is|mera\s+naam\s+|mera\s+name\s+|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
    );
    if (nameMatch) {
      const clean = nameMatch[1].replace(/\b(?:hai|hun|he|from|living|in|at|and|contact|number|phone|se)\b.*$/i, '').trim();
      if (clean) extractedName = clean;
    }

    // Check if city is mentioned
    const pakCities = [
      'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
      'Peshawar', 'Gujranwala', 'Sialkot', 'Quetta', 'Hyderabad', 'Bahawalpur',
      'Sargodha', 'Sukkur', 'Abbottabad', 'Wah Cantt', 'Gujrat'
    ];
    let detectedCity = 'Pakistan';
    for (const city of pakCities) {
      if (new RegExp(`\\b${city}\\b`, 'i').test(userText)) {
        detectedCity = city;
        break;
      }
    }

    // Call Gemini with intelligent prompt and multi-model failover
    if (ai) {
      const systemInstruction = `You are an expert, articulate AI Solar Sales Agent for a premier renewable energy and solar solutions provider in Pakistan.

COMMUNICATION LANGUAGE & TONE:
- STRICTLY ENGLISH ONLY. All responses, technical explanations, greetings, and quotations MUST be delivered exclusively in clear, professional, fluent English.
- If the user writes or speaks in Roman Urdu or Urdu (e.g., "bhai 5kw solar kitnay ka lagay ga?"), understand their requirement fully, but YOU MUST ALWAYS RESPOND 100% IN PROFESSIONAL ENGLISH. NEVER use Roman Urdu or Urdu words in your reply.
- Keep each reply concise and voice-friendly (2-4 sentences max), clear, and direct.

CORE GUIDELINES:
1. ALWAYS ANSWER THE SPECIFIC QUESTION FIRST:
   Never regurgitate a canned sales pitch without answering. If the user asks about bifacial panels, inverter brands, net metering, battery storage, or pricing, answer that directly with accurate facts and figures in your very first sentence!
2. ACCURATE PAKISTAN SOLAR PRICING & HARDWARE:
   - Solar Panels: Tier-1 Bloomberg-listed bifacial modules like Longi Hi-MO 6 Explorer 585W (~PKR 18,200/panel | ~PKR 31-33/Watt) and Jinko Tiger Neo TOPCon 585W bifacial (~PKR 18,800/panel) with 25-30 year linear output warranties.
   - Inverters: Inverex Nitrox 6kW Hybrid (~PKR 295,000), Inverex Nitrox 10kW 3-Phase (~PKR 485,000), Growatt 5kW (~PKR 215,000), Huawei SUN2000 10kW European standard (~PKR 490,000).
   - Battery Storage: Felicity Solar 51.2V 100Ah (5.12kWh) Wall-Mount LiFePO4 (~PKR 315,000, 6000+ deep cycles, 10-15 year life) and Phoenix TX-1800 heavy tubular (~PKR 68,000 each).
   - Net Metering: Bidirectional green meter with DISCOs (LESCO, K-Electric, IESCO, MEPCO, FESCO) to export surplus daytime solar and offset nighttime units.
   - Turnkey Packages: 3kW (PKR 750k-880k), 5kW (PKR 1.2M-1.45M), 7kW (PKR 1.65M-1.95M), 10kW 3-Phase (PKR 2.35M-2.75M), 20kW (PKR 4.5M-5.2M).
3. HANDLING OFF-TOPIC / UNRELATED QUERIES:
   - If the user asks an unrelated or out-of-topic question (e.g. asking for a car, bike, food, weather, medical, movies, general jokes):
   - Politely clarify that you are a dedicated AI Solar Energy Consultant in Pakistan specializing exclusively in solar installations, inverters, and battery systems.
   - If they mentioned cars or vehicles, mention that while you don't sell cars, you can help design a rooftop solar setup to charge their electric car (EV) for free using clean solar energy!
   - Politely guide them back to how solar can eliminate their monthly electricity bills or provide power during outages.
4. NATURAL, RESPECTFUL LEAD GATHERING:
   - In a polite and respectful manner, invite the customer to share their Full Name, City / Address, and WhatsApp or Phone number, or monthly electricity bill, so our senior engineering team can arrange a free rooftop feasibility assessment and customized BOQ proposal.
   - When the user provides contact details or answers your questions, acknowledge them warmly, answer their technical question, and append the @@LEAD_JSON@@ block at the very end:
   @@LEAD_JSON@@{"name":"...","phone":"...","city":"...","address":"...","email":"...","product":"...","monthlyBill":"...","estimatedKw":5,"status":"Hot","note":"..."}@@END_LEAD_JSON@@`;

      try {
        const historyFormatted = messages.map((m: { sender: string; text: string }) => ({
          role: m.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        // Order by proven availability and lowest latency
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'];
        let geminiSuccess = false;

        for (const modelName of candidateModels) {
          try {
            // Apply a 3800ms race timeout per model to guarantee sub-second or fast responses
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3800));
            const genPromise = ai.models.generateContent({
              model: modelName,
              contents: historyFormatted,
              config: {
                systemInstruction: productContext
                  ? `${systemInstruction}\nCurrent Selected Product Context: ${productContext}`
                  : systemInstruction,
                temperature: 0.7,
              },
            });

            const response = await Promise.race([genPromise, timeoutPromise]);
            if (!response) {
              console.warn(`Model ${modelName} hit timeout, trying next model`);
              continue;
            }

            const rawText = response.text || '';
            if (rawText.trim()) {
              const leadMatch = rawText.match(/@@LEAD_JSON@@([\s\S]*?)@@END_LEAD_JSON@@/);
              if (leadMatch) {
                try {
                  const leadParsed = JSON.parse(leadMatch[1].trim());
                  newlyCapturedLead = {
                    id: `lead-${Date.now()}`,
                    name: leadParsed.name || extractedName,
                    phone: leadParsed.phone || (phoneMatch ? phoneMatch[0] : '0300-0000000'),
                    email: leadParsed.email || `${(leadParsed.name || extractedName).toLowerCase().replace(/\s+/g, '.')}@solar.live`,
                    product: leadParsed.product || productContext || 'Solar Consultation',
                    status: leadParsed.status || 'Hot',
                    note: leadParsed.note || `Requirement: "${userText}"`,
                    city: leadParsed.city || detectedCity || 'Pakistan',
                    address: leadParsed.address || (detectedCity !== 'Pakistan' ? `${detectedCity} Area` : ''),
                    monthlyBill: leadParsed.monthlyBill || '',
                    source: 'Voice Assistant',
                    timestamp: 'Just now',
                    value: 'PKR 1.45M',
                    estimatedKw: leadParsed.estimatedKw || 5,
                  };
                  await saveStoredLead(newlyCapturedLead);
                } catch {
                  // ignore JSON parse error
                }
                replyText = rawText.replace(/@@LEAD_JSON@@[\s\S]*?@@END_LEAD_JSON@@/, '').trim();
              } else {
                replyText = rawText.trim();
              }

              geminiSuccess = true;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Gemini model ${modelName} failed: ${modelErr?.status || modelErr?.message}`);
          }
        }

        if (!geminiSuccess || !replyText) {
          const fallback = getSmartSolarExpertReply(userText, productContext, messages);
          replyText = fallback.reply;
          if (fallback.capturedLead && !newlyCapturedLead) {
            newlyCapturedLead = fallback.capturedLead;
            await saveStoredLead(newlyCapturedLead);
          }
        }
      } catch (genError) {
        console.warn('Gemini chat error, invoking smart expert engine:', genError);
        const fallback = getSmartSolarExpertReply(userText, productContext, messages);
        replyText = fallback.reply;
        if (fallback.capturedLead && !newlyCapturedLead) {
          newlyCapturedLead = fallback.capturedLead;
          await saveStoredLead(newlyCapturedLead);
        }
      }
    } else {
      const fallback = getSmartSolarExpertReply(userText, productContext, messages);
      replyText = fallback.reply;
      if (fallback.capturedLead && !newlyCapturedLead) {
        newlyCapturedLead = fallback.capturedLead;
        await saveStoredLead(newlyCapturedLead);
      }
    }

    // Direct backup capture if phone number or customer contact details provided and not yet created
    if (!newlyCapturedLead && (phoneMatch || extractedName !== 'Direct Inquirer' || detectedCity !== 'Pakistan')) {
      newlyCapturedLead = {
        id: `lead-${Date.now()}`,
        name: extractedName !== 'Direct Inquirer' ? extractedName : 'Solar Inquirer',
        phone: phoneMatch ? phoneMatch[0] : 'Contact pending',
        email: `${(extractedName !== 'Direct Inquirer' ? extractedName : 'inquiry').toLowerCase().replace(/\s+/g, '.')}@solar.live`,
        product: productContext || 'Solar System Consultation',
        status: phoneMatch ? 'Hot' : 'New',
        note: `Contact captured via chat: "${userText}"`,
        city: detectedCity !== 'Pakistan' ? detectedCity : 'Pakistan',
        address: detectedCity !== 'Pakistan' ? `${detectedCity} Region` : 'Pakistan',
        source: 'Voice Assistant',
        timestamp: 'Just now',
        value: 'PKR 1.45M',
        estimatedKw: 5,
      };
      await saveStoredLead(newlyCapturedLead);
    }

    return res.json({
      reply: replyText,
      capturedLead: newlyCapturedLead,
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    const lastMessage = req.body?.messages?.[req.body.messages.length - 1];
    const userText = lastMessage?.text || '';
    const fallback = getSmartSolarExpertReply(userText, req.body?.productContext);
    return res.json({
      reply: fallback.reply,
      capturedLead: fallback.capturedLead || null,
    });
  }
});

// Export the Express app for the Vercel serverless function.
// Vercel serves the Vite build as static assets; this file handles /api routes only.
export default app;

// Local development: run Express and mount Vite middleware.
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    app.listen(port, '0.0.0.0', () => console.log(`AI Sales Agent running on port ${port}`));
  };
  startServer();
}
