import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Support CORS for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, productContext } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage?.text || '';

  const userMessages = messages.filter((m: any) => m.sender === 'customer' || m.role === 'user');
  const combinedHistory = userMessages.map((m: any) => m.text || '').join(' ');
  const fullConversationScan = `${combinedHistory} ${userText}`.trim();

  // Smart regex details extraction
  const phonePattern = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b)/;
  const phoneMatch = fullConversationScan.match(phonePattern);

  let extractedName = 'Valued Customer';
  const nameMatch = fullConversationScan.match(
    /(?:my\s+name\s+is|mera\s+naam\s+(?:hai\s+)?|mera\s+name\s+(?:hai\s+)?|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  if (nameMatch) {
    extractedName = nameMatch[1].replace(/\s+(?:from|living|in|at|and|contact|number|phone)\b.*$/i, '').trim();
  }

  let extractedCity = 'Pakistan';
  const cityMatch = fullConversationScan.match(
    /(?:Lahore|Karachi|Islamabad|Rawalpindi|Faisalabad|Multan|Peshawar|Sialkot|Gujranwala|Hyderabad|Quetta|Bahawalpur|Sargodha|Sukkur|Abbottabad)/i
  );
  if (cityMatch) {
    extractedCity = cityMatch[0];
  }

  let newlyCapturedLead = null;
  if (phoneMatch) {
    newlyCapturedLead = {
      id: `lead-${Date.now()}`,
      name: extractedName,
      phone: phoneMatch[0].trim(),
      email: 'voice-captured@solar.live',
      product: productContext || '5kW Hybrid System',
      status: 'Hot',
      note: `Contact captured via Voice Assistant: "${userText}"`,
      city: extractedCity,
      address: extractedCity !== 'Pakistan' ? `${extractedCity} Area` : '',
      timestamp: 'Just now',
      value: 'PKR 1.2M - 1.45M',
      estimatedKw: 5,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });

      const historyFormatted = messages.slice(-6).map((m: any) => ({
        role: m.sender === 'customer' || m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const systemInstruction = `You are a friendly, intelligent AI Solar Sales Advisor for homes and businesses in Pakistan.
COMMUNICATION STYLE:
1. Speak in simple, everyday English. Be direct, helpful, and concise (2 to 4 sentences).
2. Sizing advice:
   - Bill 15k-35k PKR -> 3kW to 5kW system.
   - Bill 40k-65k PKR -> 5kW to 7kW hybrid system.
   - Bill 70k-120k PKR -> 10kW three-phase system.
3. If user shares their name, phone, or city, warmly confirm you have recorded their request and our engineer will reach out.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: historyFormatted,
        config: {
          systemInstruction: productContext
            ? `${systemInstruction}\nCurrent Selected Product: ${productContext}`
            : systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 200,
        },
      });

      if (response && response.text) {
        return res.status(200).json({
          reply: response.text.trim(),
          capturedLead: newlyCapturedLead,
        });
      }
    } catch (e) {
      console.warn('Gemini Vercel serverless error:', e);
    }
  }

  // Built-in intelligent solar reply fallback
  const q = userText.toLowerCase();
  let fallbackReply =
    'Thank you for reaching out! We provide turnkey solar packages across Pakistan with Tier-1 panels, hybrid inverters, and net metering. Could you share your monthly summer electricity bill so I can recommend the exact system size for you?';

  if (q.includes('price') || q.includes('cost') || q.includes('5kw')) {
    fallbackReply =
      'A complete 5kW hybrid solar system costs between 1.2M and 1.45M PKR turnkey. It generates 22 to 26 units daily, running 2 inverter ACs, water pump, and appliances. Would you like to schedule a free rooftop survey?';
  } else if (q.includes('3kw')) {
    fallbackReply =
      'A 3kW solar system costs around 750k to 880k PKR turnkey, producing 12-15 units daily and powering 1 inverter AC during sunny hours plus basic home load.';
  } else if (q.includes('10kw')) {
    fallbackReply =
      'A 10kW 3-phase commercial / large residence package is 2.35M to 2.75M PKR turnkey, producing 45 to 55 units daily and wiping out heavy bills.';
  } else if (newlyCapturedLead) {
    fallbackReply = `Thank you, ${extractedName}! I have recorded your contact details (${phoneMatch ? phoneMatch[0] : ''}). Our technical solar team will contact you shortly to schedule your free roof survey.`;
  }

  return res.status(200).json({
    reply: fallbackReply,
    capturedLead: newlyCapturedLead,
  });
}
