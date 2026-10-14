import { GoogleGenAI } from '@google/genai';

function getSolarAdvisorResponse(
  userText: string,
  productContext?: string | null,
  history?: { sender: string; text: string }[]
): { reply: string; capturedLead?: any } {
  const q = (userText || '').toLowerCase().trim();

  // 1. Phone number & Name detection (Pakistan formats)
  const phonePattern = /(?:(?:\+92|0092|92)?[-.\s]?(?:3\d{2})[-.\s]?\d{7}|\b0\d{10}\b|\b03\d{9}\b|\b\d{11}\b)/;
  const phoneMatch = q.match(phonePattern);

  const nameMatch = q.match(
    /(?:my\s+name\s+is|mera\s+naam\s+(?:hai\s+)?|mera\s+name\s+(?:hai\s+)?|name[:\s]+|i\s+am|i'm|this\s+is|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  let detectedName = nameMatch
    ? nameMatch[1].replace(/\s+(?:from|living|in|at|and|contact|number|phone)\b.*$/i, '').trim()
    : 'Valued Customer';

  // City detection
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

  let newlyCapturedLead = null;
  if (phoneMatch) {
    newlyCapturedLead = {
      id: `lead-${Date.now()}`,
      name: detectedName,
      phone: phoneMatch[0].trim(),
      email: 'voice-captured@solar.live',
      product: productContext || '5kW Hybrid System',
      status: 'Hot',
      note: `Contact captured via Voice Assistant: "${userText}"`,
      city: detectedCity,
      address: detectedCity !== 'Pakistan' ? `${detectedCity} Area` : '',
      timestamp: 'Just now',
      value: 'PKR 1.2M - 1.45M',
      estimatedKw: 5,
    };

    return {
      reply: `Thank you, ${detectedName}! I have recorded your contact number (${phoneMatch[0].trim()})${detectedCity !== 'Pakistan' ? ` in ${detectedCity}` : ''}. Our solar technical engineer will reach out to you shortly to schedule your free rooftop survey and share an itemized quote.`,
      capturedLead: newlyCapturedLead,
    };
  }

  // 2. Greetings
  if (/^(hi|hello|hey|salam|slam|assalam|aoa|kese ho|kaise ho|kia hal|kya haal|good morning|good afternoon|good evening)/i.test(q)) {
    return {
      reply: 'Hello and welcome! I am your AI Solar Advisor. I can help you choose the ideal solar system size for your home or business, calculate your bill savings, and explain net metering and battery backup. How much is your average monthly electricity bill or which package are you interested in?',
    };
  }

  // 3. Monthly Electricity Bill Sizing (e.g. 20k, 30,000, 50k, 75k, 1 lakh, units)
  const hasBillIntent = q.includes('bill') || q.includes('unit') || q.includes('kharcha') || q.includes('bijli') || q.includes('consume') || q.includes('mahina') || q.includes('pkr') || q.includes('rs');
  const numMatch = q.match(/(\d{1,3})(?:k|\s?thousand|\s?,?000)\b/i) || (hasBillIntent ? q.match(/\b(\d{2,6})\b/) : null);

  if (numMatch || hasBillIntent) {
    let bill = 35000;
    if (numMatch) {
      const raw = parseInt(numMatch[1], 10);
      bill = raw < 1000 ? raw * 1000 : raw;
    }

    if (bill <= 25000) {
      return {
        reply: `For a monthly bill of around ${bill.toLocaleString()} PKR, a 3kW Home Solar System is the ideal choice. It generates 12 to 15 units daily and powers 1 Inverter AC during the day, plus a refrigerator, fans, and lights, reducing your bill by 75% to 85%. Estimated turnkey price is 750k - 880k PKR. Would you like to schedule a free rooftop survey?`,
      };
    } else if (bill <= 50000) {
      return {
        reply: `With a monthly bill of around ${bill.toLocaleString()} PKR, a 5kW Hybrid Solar System is Pakistan's most popular solution. It generates 22 to 26 units daily, running 2 Inverter ACs (1.5 Ton), water pump, fridge, and fans, cutting your bill close to zero with net metering. Turnkey package costs around 1.2M - 1.45M PKR. Would you like a free quotation?`,
      };
    } else if (bill <= 80000) {
      return {
        reply: `For a monthly bill of around ${bill.toLocaleString()} PKR, a 7kW to 8kW Solar System is recommended. It produces 32 to 38 units daily, easily running 3 Inverter ACs, water motor, and full home loads for 1 Kanal villas, virtually wiping out expensive peak electricity units. Would you like our engineer to review your roof layout?`,
      };
    } else if (bill <= 150000) {
      return {
        reply: `For a heavy bill of ${bill.toLocaleString()} PKR, a 10kW Three-Phase Hybrid System is the perfect fit. It generates 45 to 55 units daily and powers 4 Inverter ACs and heavy appliances. Through net metering, it wipes out massive bills. Turnkey cost is approximately 2.35M - 2.75M PKR. Would you like to request an inspection?`,
      };
    } else {
      return {
        reply: `For commercial setups, plazas, or homes with bills over ${bill.toLocaleString()} PKR, a 15kW to 20kW Three-Phase system is recommended. It produces 90 to 110 units daily and drastically cuts commercial tariffs. Would you like our engineering team to prepare an enterprise quote?`,
      };
    }
  }

  // 4. Inverter AC appliance load questions
  if (q.includes('ac') || q.includes('air conditioner') || q.includes('ton')) {
    if (q.includes('3kw')) {
      return {
        reply: 'A 3kW solar system can comfortably run 1 Inverter AC (up to 1.5 Ton) during peak sunlight hours along with a refrigerator, 4-5 fans, and LED lights.',
      };
    }
    if (q.includes('5kw')) {
      return {
        reply: 'A 5kW hybrid solar system can easily run 2 Inverter ACs (1.5 Ton each) simultaneously during sunlight hours, plus a refrigerator, fans, and household lighting.',
      };
    }
    if (q.includes('7kw') || q.includes('8kw')) {
      return {
        reply: 'A 7kW solar system can easily run 3 Inverter ACs simultaneously along with home appliances, deep freezer, and water motor.',
      };
    }
    if (q.includes('10kw')) {
      return {
        reply: 'A 10kW three-phase solar system can power 4 to 5 Inverter ACs simultaneously, making it ideal for 1 Kanal homes, clinics, and offices.',
      };
    }
    return {
      reply: 'On standard inverter air conditioners: 3kW runs 1 AC, 5kW runs 2 ACs, 7kW runs 3 ACs, and 10kW runs 4 to 5 ACs during sunny hours. How many ACs do you want to power at your property?',
    };
  }

  // 5. Pricing / Cost queries
  if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('kitne') || q.includes('kitnay') || q.includes('paisa') || q.includes('quotation') || q.includes('quote')) {
    if (q.includes('3kw')) {
      return {
        reply: 'A complete turnkey 3kW Home Solar System costs between 750,000 and 880,000 PKR. It includes Tier-1 N-Type TOPCon panels, hybrid inverter, structure, wiring, installation, and testing.',
      };
    }
    if (q.includes('5kw')) {
      return {
        reply: 'A complete turnkey 5kW Hybrid Residential System costs between 1.2M and 1.45M PKR. It includes Tier-1 bifacial panels, 5kW hybrid inverter (Inverex Nitrox or Growatt), and net metering capability.',
      };
    }
    if (q.includes('7kw')) {
      return {
        reply: 'A 7kW Premium Home Solar package is priced between 1.65M and 1.95M PKR turnkey, designed for 1 Kanal residences with high-yield bifacial panels.',
      };
    }
    if (q.includes('10kw')) {
      return {
        reply: 'A 10kW Three-Phase Commercial or Large Home System is priced between 2.35M and 2.75M PKR turnkey, complete with three-phase net metering documentation.',
      };
    }
    if (q.includes('20kw')) {
      return {
        reply: 'A 20kW Industrial / Commercial System is 4.5M to 5.2M PKR turnkey, engineered for factories, plazas, and warehouses.',
      };
    }
    return {
      reply: 'Our turnkey solar package prices in Pakistan: 3kW (750k-880k PKR), 5kW (1.2M-1.45M PKR), 7kW (1.65M-1.95M PKR), 10kW (2.35M-2.75M PKR), and Battery backup systems from 380k PKR. What capacity would you like a detailed quote for?',
    };
  }

  // 6. Net Metering
  if (q.includes('net meter') || q.includes('green meter') || q.includes('nepra') || q.includes('disco') || q.includes('lesco') || q.includes('k-electric') || q.includes('kelectric') || q.includes('iesco')) {
    return {
      reply: 'Net Metering allows extra daytime solar power to flow back into the electric grid through a green bidirectional meter. At night, you use power against those earned credits, bringing your electricity bill down to almost zero. We take care of all DISCO paperwork, NOC, meter installation, and NEPRA generation licenses for you.',
    };
  }

  // 7. Battery Backup & Load Shedding
  if (q.includes('battery') || q.includes('backup') || q.includes('load shedding') || q.includes('outage') || q.includes('light jati') || q.includes('bijli jati') || q.includes('ups')) {
    return {
      reply: 'Yes, our hybrid systems provide seamless 10ms UPS switchover during load shedding! With a 5.12kWh LiFePO4 Lithium battery (6000+ deep cycles) or deep-cycle tubular battery bank, your lights, fans, fridge, Wi-Fi, and inverter AC stay running when grid power cuts out. Would you like a battery package quotation?',
    };
  }

  // 8. Solar Panel Brands
  if (q.includes('panel') || q.includes('plate') || q.includes('bifacial') || q.includes('longi') || q.includes('jinko') || q.includes('canadian') || q.includes('tier 1') || q.includes('tier-1')) {
    return {
      reply: 'We only install authentic Tier-1 Grade-A solar panels: Longi Hi-MO 6 Explorer 585W and Jinko Tiger Neo 585W TOPCon Bifacial Dual-Glass. Double-sided bifacial modules capture reflected sunlight from both sides to give you 15% to 25% extra generation and come with a 25-year performance warranty.',
    };
  }

  // 9. Solar Inverter Brands
  if (q.includes('inverter') || q.includes('hybrid') || q.includes('on-grid') || q.includes('off-grid') || q.includes('inverex') || q.includes('growatt') || q.includes('huawei')) {
    return {
      reply: 'We install premium hybrid inverters including Inverex Nitrox, Growatt SPH, and Huawei with Dual MPPT, IP65 waterproof rating, generator auto-start, mobile app Wi-Fi monitoring, and 5 years official local warranty. A hybrid inverter is recommended because it supports both net metering and battery backup during outages.',
    };
  }

  // 10. Rooftop space / Area required
  if (q.includes('space') || q.includes('roof') || q.includes('area') || q.includes('chhat') || q.includes('marla') || q.includes('kanal') || q.includes('jagah')) {
    return {
      reply: 'As a standard rule, each 1kW of solar capacity requires about 80 to 90 square feet of shadow-free rooftop space. For instance, a 5kW system needs around 400 to 450 sq ft, while a 10kW system needs around 800 to 900 sq ft. We can perform a free rooftop structural and shadow inspection for your home.',
    };
  }

  // 11. Site Survey / Inspection booking
  if (q.includes('survey') || q.includes('visit') || q.includes('inspect') || q.includes('book') || q.includes('check')) {
    return {
      reply: 'We offer free, zero-obligation rooftop site surveys across all major Pakistani cities! Please provide your name, phone number, and city or address so our engineering team can schedule your inspection visit.',
    };
  }

  // 12. Selected Product Context
  if (productContext) {
    return {
      reply: `Regarding the ${productContext}: It is one of our top-rated turnkey systems with certified Tier-1 panels and 25-year warranty. What is your approximate monthly electricity bill or city so I can confirm if it is the ideal capacity for your home?`,
    };
  }

  // 13. Dynamic General Consultation
  const dynamicReplies = [
    'We provide complete turnkey solar solutions for homes and businesses across Pakistan. To recommend the most cost-effective setup, what is your average monthly electricity bill or which appliances do you want to power?',
    'Solar energy reduces electricity bills by up to 90% while providing seamless backup during load shedding. Are you looking for a residential home system, commercial 3-phase package, or battery backup?',
    'Our turnkey systems feature Tier-1 panels and hybrid inverters with full net metering support. Tell me your city and monthly electricity bill, and I will calculate your ideal capacity and savings!',
  ];

  return {
    reply: dynamicReplies[Math.floor(Math.random() * dynamicReplies.length)],
  };
}

export default async function handler(req: any, res: any) {
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

  // 1. Try Gemini AI if API Key is configured in environment
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
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
1. Speak in simple, everyday English (and understand Roman Urdu). Be direct, helpful, and concise (2 to 4 sentences).
2. Sizing advice:
   - Bill 15k-35k PKR -> 3kW to 5kW system (powers 1 Inverter AC during day, fridge, fans, lights; saves ~75-85%).
   - Bill 40k-65k PKR -> 5kW to 7kW hybrid system with Net Metering (powers 2 Inverter ACs, water pump, fridge, fans; saves ~85-95%).
   - Bill 70k-120k PKR -> 10kW three-phase system (powers 4 Inverter ACs, heavy appliances, wipes out peak tariffs).
   - Commercial / bill over 150k PKR -> 15kW to 20kW system.
3. If user shares their name, phone, or city, warmly confirm you have recorded their details for a free rooftop survey and quote.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: historyFormatted,
        config: {
          systemInstruction: productContext
            ? `${systemInstruction}\nCurrent Selected Product: ${productContext}`
            : systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 250,
        },
      });

      if (response && response.text && response.text.trim()) {
        const result = getSolarAdvisorResponse(userText, productContext, messages);
        return res.status(200).json({
          reply: response.text.trim(),
          capturedLead: result.capturedLead,
        });
      }
    } catch (e) {
      console.warn('Gemini API call warning, using intelligent local engine:', e);
    }
  }

  // 2. Intelligent, domain-specific solar advisor engine
  const result = getSolarAdvisorResponse(userText, productContext, messages);
  return res.status(200).json({
    reply: result.reply,
    capturedLead: result.capturedLead || null,
  });
}
