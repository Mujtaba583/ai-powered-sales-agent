import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
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
  timestamp: string;
  value?: string;
  estimatedKw?: number;
}

let leadsDatabase: ServerLead[] = [
  {
    id: 'lead-1',
    name: 'Zubair Ahmed',
    phone: '0300-1234567',
    email: 'zubair@gmail.com',
    product: '10kW Hybrid System',
    status: 'Hot',
    note: 'Wants to install next week, discussing 12-month installment plan.',
    city: 'Lahore',
    address: 'Phase 5, DHA',
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
    note: 'Inquired about net metering paperwork and Tier-1 Bifacial panels brand.',
    city: 'Karachi',
    address: 'Block 4, Gulshan-e-Iqbal',
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
    note: 'Requested rooftop structural inspection call back for 3 ACs.',
    city: 'Islamabad',
    address: 'Sector F-10/2',
    timestamp: '2 days ago',
    value: 'PKR 1.85M',
    estimatedKw: 7,
  },
];

// Intelligent, simple English solar fallback engine (Pakistan market)
function getSmartSolarExpertReply(
  userText: string,
  productContext?: string,
  history?: { sender: string; text: string }[]
): string {
  const query = (userText || '').toLowerCase().trim();

  // 1. Name and/or Phone number capture
  const phonePattern = /(?:0\d{9,10}|\+92\d{10}|\d{10,12})/;
  const phoneMatch = query.match(phonePattern);
  const nameMatch = query.match(/(?:may\s+name\s+is|my\s+name\s+is|name[:\s]+|i\s+am|this\s+is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

  if (phoneMatch || nameMatch) {
    const customer = nameMatch ? nameMatch[1].replace(/\s+(?:from|living|in|at)\b.*$/i, '').trim() : 'Valued Customer';
    const num = phoneMatch ? phoneMatch[0] : '';
    return `Thank you, ${customer}! I have noted your contact details${num ? ` (${num})` : ''}. Our solar engineering team in your area will contact you shortly to coordinate your free rooftop survey.`;
  }

  // 2. Booking a site survey or roof inspection
  if (query.includes('survey') || query.includes('visit') || query.includes('inspect') || query.includes('book')) {
    return 'I would be delighted to schedule a free rooftop survey for you! Could you please share your name, phone number, and city/address so our team can coordinate the visit?';
  }

  // 3. User says "yes", "sure", "ok", "go ahead"
  if (query === 'yes' || query === 'yeah' || query === 'sure' || query === 'ok' || query === 'okay' || query.startsWith('yes ') || query.includes('go ahead')) {
    const lastAgentMsg = history
      ? [...history].reverse().find((h) => h.sender === 'agent')?.text.toLowerCase() || ''
      : '';
    if (lastAgentMsg.includes('survey') || lastAgentMsg.includes('book')) {
      return 'Wonderful! Please provide your name and phone number so our team can contact you to schedule the free roof survey.';
    }
    if (lastAgentMsg.includes('price') || lastAgentMsg.includes('quote') || lastAgentMsg.includes('cost')) {
      return 'A 5kW hybrid solar system costs between 1,200,000 and 1,450,000 PKR turnkey. Would you like to book a free roof survey for your home?';
    }
    return 'Great! Would you like me to share estimated package prices or would you prefer to schedule a free rooftop survey?';
  }

  // 4. Specific Pricing or Cost inquiries
  if (
    query.includes('price') ||
    query.includes('cost') ||
    query.includes('how much') ||
    query.includes('rate') ||
    query.includes('quotation') ||
    query.includes('quote')
  ) {
    if (query.includes('3kw')) {
      return 'A complete 3kW home solar system costs around 750,000 to 880,000 PKR turnkey. It produces 12 to 15 units a day, running 1 inverter AC during sunny hours plus fans, fridge, and lights.';
    }
    if (query.includes('5kw')) {
      return 'A complete 5kW solar system in Pakistan typically costs between 1,200,000 and 1,450,000 PKR turnkey. It generates 22 to 26 units daily, easily running 2 inverter ACs, a water pump, fridge, and full household loads.';
    }
    if (query.includes('7kw')) {
      return 'A 7kW premium home package is 1.65 to 1.95 Million PKR turnkey, generating 32 to 38 units daily for 1 Kanal homes running 3 inverter ACs.';
    }
    if (query.includes('10kw')) {
      return 'A 10kW commercial or large home 3-phase system is 2.35 to 2.75 Million PKR turnkey, generating 45 to 55 units daily to wipe out heavy electricity bills.';
    }
    return 'Our turnkey solar packages range from 3kW (750k-880k PKR) and 5kW (1.2M-1.45M PKR) up to 10kW (2.35M-2.75M PKR). What is your monthly summer electricity bill so I can recommend the exact system size for your home?';
  }

  // 5. Bill amount detection
  const currentBillMatch = query.match(/(\d{1,3})(?:k|\s?thousand|\s?,?000)\s?(?:pkr|rs|rupees|bill)?/i);
  if (currentBillMatch || query.includes('bill') || query.includes('units') || query.includes('consume')) {
    const rawNum = currentBillMatch ? parseInt(currentBillMatch[1], 10) : 35;
    const billAmount = rawNum < 1000 ? rawNum * 1000 : rawNum;
    const cityMentioned = query.includes('karachi')
      ? 'in Karachi'
      : query.includes('lahore')
      ? 'in Lahore'
      : query.includes('islamabad')
      ? 'in Islamabad'
      : query.includes('rawalpindi')
      ? 'in Rawalpindi'
      : 'for your home';

    if (billAmount <= 35000) {
      return `For a monthly bill of around ${billAmount.toLocaleString()} PKR ${cityMentioned}, a 3kW to 5kW solar system is the ideal choice. It will comfortably power your daytime lights, fans, refrigerator, and 1 inverter AC, reducing your electricity bill by around 75% to 85%. Would you like to know the estimated price or book a free roof survey?`;
    } else if (billAmount <= 65000) {
      return `With a monthly bill of around ${billAmount.toLocaleString()} PKR ${cityMentioned}, a 5kW hybrid solar system is the best match. It easily runs 2 inverter ACs, water pump, fridge, and fans, bringing your bill close to zero with net metering. Would you like to book a free roof survey?`;
    } else {
      return `For a bill of around ${billAmount.toLocaleString()} PKR ${cityMentioned}, a 10kW three-phase system will comfortably power 3 to 4 ACs and all heavy appliances, wiping out expensive peak bills. Would you like our engineer to prepare an itemized quote?`;
    }
  }

  // 6. User says "for my home", "house", "residential"
  if (
    query.includes('home') ||
    query.includes('house') ||
    query.includes('residential') ||
    query.includes('ghar') ||
    query.includes('domestic')
  ) {
    return 'I would love to help you find the right solar setup for your home! To recommend the ideal capacity, could you tell me your average monthly electricity bill (e.g. 35,000 PKR) and your city?';
  }

  // 7. Panel inquiries
  if (
    query.includes('panel') ||
    query.includes('plate') ||
    query.includes('bifacial') ||
    query.includes('tier-1') ||
    query.includes('tier 1')
  ) {
    return 'We install high-efficiency double-sided solar panels (Longi Hi-MO 6 & Jinko Tiger Neo 585W TOPCon). They absorb sunlight from both front and rear glass surfaces to give you 15% to 25% extra electricity, and come with a 25-year performance warranty. Would you like a recommendation for your rooftop?';
  }

  // 8. Inverter inquiries
  if (query.includes('inverter') || query.includes('hybrid') || query.includes('on-grid') || query.includes('off-grid')) {
    return 'A hybrid inverter (like Inverex Nitrox or Growatt SPH) is the best choice because it lets you sell extra daytime solar units to the grid through net metering, and it instantly switches to battery backup when the power cuts out. Does your home have a single-phase or three-phase meter?';
  }

  // 9. Battery backup / Load shedding
  if (
    query.includes('battery') ||
    query.includes('backup') ||
    query.includes('lithium') ||
    query.includes('tubular') ||
    query.includes('load shedding') ||
    query.includes('outage') ||
    query.includes('power cut')
  ) {
    return 'Yes, it will definitely work during power cuts! If you choose a hybrid system, it stores energy in batteries (LiFePO4 Lithium or deep-cycle Tubular) so your lights, fans, fridge, and Wi-Fi stay on even when the grid power fails. Would you like a backup package quotation?';
  }

  // 10. Net metering explanation
  if (query.includes('net meter') || query.includes('green meter') || query.includes('nepra') || query.includes('disco') || query.includes('lesco') || query.includes('k-electric') || query.includes('kelectric')) {
    return 'Net metering is a system where your extra daytime solar power flows back into the electric grid through a green meter. At night, you use power against those earned credits, which can bring your monthly electricity bill down to almost zero. We take care of all the paperwork and licensing for you.';
  }

  // 11. Selected product context
  if (productContext) {
    return `Regarding the ${productContext}: it is one of our top-rated systems with high power generation and certified warranty. To check whether it fits your rooftop, could you share your monthly bill or city?`;
  }

  // 12. Greetings
  if (/\b(hi|hello|salam|hey|aoa|greetings)\b/i.test(query)) {
    return 'Hello and welcome! I am your AI Solar Advisor. How can I assist you with choosing the right solar system or estimating your savings today?';
  }

  // 13. General response
  return 'We provide complete solar systems for homes and businesses across Pakistan. To recommend the best setup for your needs, could you tell me your average monthly electricity bill or which appliances you want to run?';
}

// API: Get Leads
app.get('/api/leads', (_req: Request, res: Response) => {
  res.json({ leads: leadsDatabase });
});

// API: Add Lead
app.post('/api/leads', (req: Request, res: Response) => {
  const { name, phone, email, product, status, note, city, address, value, estimatedKw } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  const newLead: ServerLead = {
    id: `lead-${Date.now()}`,
    name,
    phone,
    email: email || 'inquiry@solar-lead.com',
    product: product || 'Solar Consultation',
    status: status || 'New',
    note: note || 'Customer registered inquiry through voice assistant.',
    city: city || 'Pakistan',
    address: address || '',
    timestamp: 'Just now',
    value: value || 'PKR 1.35M',
    estimatedKw: estimatedKw || 5,
  };

  leadsDatabase.unshift(newLead);
  res.status(201).json({ lead: newLead, success: true });
});

// API: Update Lead Status
app.patch('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const lead = leadsDatabase.find((l) => l.id === id);
  if (lead) {
    if (status) lead.status = status;
    if (note) lead.note = note;
    return res.json({ success: true, lead });
  }
  return res.status(404).json({ error: 'Lead not found' });
});

// API: Delete Lead
app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  leadsDatabase = leadsDatabase.filter((l) => l.id !== id);
  return res.json({ success: true });
});

// Auth: Login Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({
      success: true,
      user: { id: 'admin-1', name: 'Admin Manager', email },
      message: 'Logged in successfully',
    });
  } else {
    res.status(400).json({ error: 'Email and password required' });
  }
});

// Auth: Signup Endpoint
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { name, email } = req.body;
  res.status(201).json({
    success: true,
    user: { id: `user-${Date.now()}`, name: name || 'Business Owner', email },
    message: 'Account created successfully',
  });
});

// AI Sales Chat & Lead Capture Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, productContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.text || '';
    let replyText = '';
    let newlyCapturedLead: ServerLead | null = null;

    const userMessages = messages.filter((m: any) => m.sender === 'customer' || m.role === 'user');
    const combinedHistoryText = userMessages.map((m: any) => m.text || '').join(' ');
    const fullConversationScan = `${combinedHistoryText} ${userText}`.trim();

    // Regex details extraction
    const phonePattern = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b)/;
    const phoneMatch = fullConversationScan.match(phonePattern);

    let extractedName = 'Valued Customer';
    const nameMatch = fullConversationScan.match(/(?:my\s+name\s+is|mera\s+naam\s+(?:hai\s+)?|mera\s+name\s+(?:hai\s+)?|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
    if (nameMatch) {
      extractedName = nameMatch[1].replace(/\s+(?:from|living|in|at|and|contact|number|phone)\b.*$/i, '').trim();
    }

    let extractedCity = 'Pakistan';
    const cityMatch = fullConversationScan.match(/(?:Lahore|Karachi|Islamabad|Rawalpindi|Faisalabad|Multan|Peshawar|Sialkot|Gujranwala|Hyderabad|Quetta|Bahawalpur|Sargodha|Sukkur|Abbottabad)/i);
    if (cityMatch) {
      extractedCity = cityMatch[0];
    }

    if (ai) {
      const systemInstruction = `You are a friendly, intelligent AI Solar Sales Advisor for homes and businesses in Pakistan.
COMMUNICATION STYLE:
1. Speak in simple, everyday English. Be direct, helpful, and concise (2 to 4 sentences).
2. Sizing advice:
   - Bill 15k-35k PKR -> Recommend 3kW to 5kW system.
   - Bill 40k-65k PKR -> Recommend 5kW to 7kW hybrid system with Net Metering.
   - Bill 70k-120k PKR -> Recommend 10kW 3-phase system.
3. If customer shares their name, phone, or city, warmly confirm and append at end: @@LEAD_JSON@@{"name":"...","phone":"...","city":"...","product":"...","status":"Hot"}@@END_LEAD_JSON@@`;

      try {
        const historyFormatted = messages.slice(-6).map((m: { sender: string; text: string }) => ({
          role: m.sender === 'customer' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

        const modelsToTry = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
        let rawText = '';

        for (const model of modelsToTry) {
          try {
            const geminiPromise = ai.models.generateContent({
              model,
              contents: historyFormatted,
              config: {
                systemInstruction: productContext
                  ? `${systemInstruction}\nCurrent Selected Product Context: ${productContext}`
                  : systemInstruction,
                temperature: 0.6,
                maxOutputTokens: 250,
              },
            });

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 7000)
            );

            const response: any = await Promise.race([geminiPromise, timeoutPromise]);
            rawText = response.text || '';
            if (rawText.trim()) break;
          } catch (modelErr) {
            console.warn(`Model ${model} attempt error:`, modelErr);
          }
        }

        if (rawText.trim()) {
          const leadMatch = rawText.match(/@@LEAD_JSON@@([\s\S]*?)(?:@@END_LEAD_JSON@@|$)/);
          if (leadMatch) {
            try {
              const rawJson = leadMatch[1].replace(/@@END_LEAD_?.*$/, '').trim();
              const leadParsed = JSON.parse(rawJson);
              newlyCapturedLead = {
                id: `lead-${Date.now()}`,
                name: leadParsed.name || extractedName,
                phone: leadParsed.phone || (phoneMatch ? phoneMatch[0] : '0300-0000000'),
                email: 'inquiry@solar-lead.com',
                product: leadParsed.product || productContext || 'Solar Consultation',
                status: 'Hot',
                note: `Captured: "${userText}"`,
                city: leadParsed.city || extractedCity,
                address: '',
                timestamp: 'Just now',
                value: 'PKR 1.45M',
                estimatedKw: 5,
              };
              leadsDatabase.unshift(newlyCapturedLead);
            } catch {}
            replyText = rawText.replace(/@@LEAD_JSON@@[\s\S]*?(?:@@END_LEAD_JSON@@|$)/, '').trim();
          } else {
            replyText = rawText.trim();
          }
        }
      } catch {
        replyText = getSmartSolarExpertReply(userText, productContext, messages);
      }
    }

    if (!replyText) {
      replyText = getSmartSolarExpertReply(userText, productContext, messages);
    }

    if (!newlyCapturedLead && phoneMatch) {
      newlyCapturedLead = {
        id: `lead-${Date.now()}`,
        name: extractedName,
        phone: phoneMatch[0],
        email: 'voice-captured@solar.live',
        product: productContext || 'Solar Package Quote',
        status: 'Hot',
        note: `Contact captured from session: "${userText}"`,
        city: extractedCity,
        address: '',
        timestamp: 'Just now',
        value: 'PKR 1.35M',
        estimatedKw: 5,
      };
      leadsDatabase.unshift(newlyCapturedLead);
    }

    return res.json({
      reply: replyText,
      capturedLead: newlyCapturedLead,
    });
  } catch (error) {
    return res.json({
      reply: getSmartSolarExpertReply(
        req.body?.messages?.[req.body.messages?.length - 1]?.text || '',
        req.body?.productContext,
        req.body?.messages
      ),
      capturedLead: null,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AI Sales Agent server running on port ${port}`);
  });
}

startServer();
