import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  status: 'Hot' | 'Warm' | 'New' | 'Closed';
  note: string;
  city?: string;
  address?: string;
  timestamp: string;
  value?: string;
  estimatedKw?: number;
}

interface DatabaseSchema {
  users: UserRecord[];
  leads: LeadRecord[];
}

const DB_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DB_DIR, 'solar_crm.json');

// Cryptographic password hashing
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(testHash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

class SolarDatabase {
  private data: DatabaseSchema = {
    users: [],
    leads: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        // Seed initial admin user and verified leads
        const adminPass = hashPassword('solar123');
        this.data = {
          users: [
            {
              id: 'user-admin-1',
              name: 'Bright Solar Solutions',
              email: 'admin@solarsales.com',
              salt: adminPass.salt,
              hash: adminPass.hash,
              createdAt: new Date().toISOString(),
            },
          ],
          leads: [
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
          ],
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving database to disk:', err);
    }
  }

  // --- Users & Authentication ---
  public findUserByEmail(email: string): UserRecord | undefined {
    const normalized = email.trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === normalized);
  }

  public registerUser(name: string, email: string, password: string): { success: boolean; user?: { id: string; name: string; email: string }; error?: string } {
    const normalized = email.trim().toLowerCase();
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Business name must be at least 2 characters.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (this.findUserByEmail(normalized)) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
    }

    const { salt, hash } = hashPassword(password);
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: normalized,
      salt,
      hash,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();

    return {
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    };
  }

  public authenticate(email: string, password: string): { success: boolean; user?: { id: string; name: string; email: string }; error?: string } {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !password) {
      return { success: false, error: 'Both email and password are required.' };
    }

    const user = this.findUserByEmail(normalized);
    if (!user) {
      return { success: false, error: 'No account found with this email. Please create an account.' };
    }

    const isValid = verifyPassword(password, user.salt, user.hash);
    if (!isValid) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  // --- Leads Management ---
  public getLeads(): LeadRecord[] {
    return [...this.data.leads];
  }

  public addLead(lead: Omit<LeadRecord, 'id'> & { id?: string }): LeadRecord {
    const newLead: LeadRecord = {
      ...lead,
      id: lead.id || `lead-${Date.now()}`,
      email: lead.email || 'customer@solar-lead.com',
      timestamp: lead.timestamp || 'Just now',
    };
    this.data.leads.unshift(newLead);
    this.save();
    return newLead;
  }
}

export const db = new SolarDatabase();
