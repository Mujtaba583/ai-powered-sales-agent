import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Lead } from '../types';

interface VoiceAssistantViewProps {
  onLeadCaptured: (lead: Lead) => void;
  initialProductContext?: string | null;
  onClearProductContext?: () => void;
}

function getQuickSolarReply(userText: string, productContext?: string | null, history?: ChatMessage[]): string {
  const q = userText.toLowerCase().trim();

  // 1. Name and/or Phone number capture (supports typos like "may name is")
  const phonePattern = /(?:0\d{9,10}|\+92\d{10}|\d{10,12})/;
  const phoneMatch = q.match(phonePattern);
  const nameMatch = q.match(/(?:may\s+name\s+is|my\s+name\s+is|name[:\s]+|i\s+am|this\s+is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

  if (phoneMatch || nameMatch) {
    const customer = nameMatch ? nameMatch[1].replace(/\s+(?:from|living|in|at)\b.*$/i, '').trim() : 'Valued Customer';
    const num = phoneMatch ? phoneMatch[0] : '';
    return `Thank you, ${customer}! I have noted your contact details${num ? ` (${num})` : ''}. Our solar engineering team in your area will contact you shortly to coordinate your free rooftop survey.`;
  }

  // 2. Booking a site survey or roof inspection
  if (q.includes('survey') || q.includes('visit') || q.includes('inspect') || q.includes('book')) {
    return 'I would be delighted to schedule a free rooftop survey for you! Could you please share your name, phone number, and city/address so our team can coordinate the visit?';
  }

  // 3. User says "yes", "sure", "ok", "go ahead"
  if (q === 'yes' || q === 'yeah' || q === 'sure' || q === 'ok' || q === 'okay' || q.startsWith('yes ') || q.includes('go ahead')) {
    const lastAgentMsg = history
      ? [...history].reverse().find((h) => h.sender === 'agent')?.text.toLowerCase() || ''
      : '';
    if (lastAgentMsg.includes('survey') || lastAgentMsg.includes('book')) {
      return 'Wonderful! Please provide your name and phone number so our team can contact you to schedule the free roof survey.';
    }
    if (lastAgentMsg.includes('price') || lastAgentMsg.includes('quote') || lastAgentMsg.includes('cost')) {
      return 'A 5kW hybrid solar system costs between 850,000 and 1,000,000 PKR turnkey. Would you like to book a free roof survey for your home?';
    }
    return 'Great! Would you like me to share estimated package prices or would you prefer to schedule a free rooftop survey?';
  }

  // 4. Specific Pricing or Cost inquiries
  if (
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('how much') ||
    q.includes('rate') ||
    q.includes('quotation') ||
    q.includes('quote')
  ) {
    if (q.includes('3kw')) {
      return 'A complete 3kW home solar system costs around 600,000 to 750,000 PKR turnkey. It produces 12 to 15 units a day, running 1 inverter AC during sunny hours plus fans, fridge, and lights.';
    }
    if (q.includes('5kw')) {
      return 'A complete 5kW solar system in Pakistan typically costs between 850,000 and 1,000,000 PKR turnkey. It generates 22 to 26 units daily, easily running 2 inverter ACs, a water pump, fridge, and full household loads.';
    }
    if (q.includes('7kw')) {
      return 'A 7kW premium home package is 1.4 to 1.7 Million PKR turnkey, generating 32 to 38 units daily for 1 Kanal homes running 3 inverter ACs.';
    }
    if (q.includes('10kw')) {
      return 'A 10kW commercial or large home 3-phase system is 2.1 to 2.5 Million PKR turnkey, generating 45 to 55 units daily to wipe out heavy electricity bills.';
    }
    return 'Our turnkey solar packages range from 3kW (600k-750k PKR) and 5kW (850k-1M PKR) up to 10kW (2.1M-2.5M PKR). What is your monthly summer electricity bill so I can recommend the exact system size for your home?';
  }

  // 5. Bill amount detection ONLY if user mentions bill or numbers in current query
  const currentBillMatch = q.match(/(\d{1,3})(?:k|\s?thousand|\s?,?000)\s?(?:pkr|rs|rupees|bill)?/i);
  if (currentBillMatch || q.includes('bill') || q.includes('units') || q.includes('consume')) {
    const rawNum = currentBillMatch ? parseInt(currentBillMatch[1], 10) : 30;
    const billAmount = rawNum < 1000 ? rawNum * 1000 : rawNum;
    const cityMentioned = q.includes('karachi')
      ? 'in Karachi'
      : q.includes('lahore')
      ? 'in Lahore'
      : q.includes('islamabad')
      ? 'in Islamabad'
      : q.includes('rawalpindi')
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
    q.includes('home') ||
    q.includes('house') ||
    q.includes('residential') ||
    q.includes('ghar') ||
    q.includes('domestic')
  ) {
    return 'I would love to help you find the right solar setup for your home! To recommend the ideal capacity, could you tell me your average monthly electricity bill (e.g. 30,000 PKR) and your city?';
  }

  // 7. Panel inquiries in simple English
  if (
    q.includes('panel') ||
    q.includes('plate') ||
    q.includes('bifacial') ||
    q.includes('tier-1') ||
    q.includes('tier 1')
  ) {
    return 'We install high-efficiency double-sided solar panels. They absorb sunlight from both front and rear glass surfaces to give you 10% to 25% extra electricity, and come with a 25-year performance warranty. Would you like a recommendation for your rooftop size?';
  }

  // 8. Inverter inquiries in simple English
  if (q.includes('inverter') || q.includes('hybrid') || q.includes('on-grid') || q.includes('off-grid')) {
    return 'A hybrid inverter is the best choice because it lets you sell extra daytime solar units to the grid through net metering, and it instantly switches to battery backup when the power cuts out. Does your home have a single-phase or three-phase meter?';
  }

  // 9. Battery backup / Load shedding
  if (
    q.includes('battery') ||
    q.includes('backup') ||
    q.includes('lithium') ||
    q.includes('tubular') ||
    q.includes('load shedding') ||
    q.includes('outage') ||
    q.includes('power cut')
  ) {
    return 'Yes, it will definitely work during power cuts! If you choose a hybrid system, it stores energy in batteries so your lights, fans, fridge, and Wi-Fi stay on even when the grid power fails. Would you like a backup package quotation?';
  }

  // 10. Net metering explanation in simple English
  if (q.includes('net meter') || q.includes('green meter') || q.includes('nepra') || q.includes('disco') || q.includes('lesco') || q.includes('k-electric') || q.includes('kelectric')) {
    return 'Net metering is a system where your extra daytime solar power flows back into the electric grid through a green meter. At night, you use power against those earned credits, which can bring your monthly electricity bill down to almost zero. We take care of all the paperwork and licensing for you.';
  }

  // 11. Selected product context
  if (productContext) {
    return `Regarding the ${productContext}: it is one of our top-rated systems with high power generation and certified warranty. To check whether it fits your rooftop, could you share your monthly bill or city?`;
  }

  // 12. Greetings using proper word boundaries
  if (/\b(hi|hello|salam|hey|aoa|greetings)\b/i.test(q)) {
    return 'Hello and welcome! I am your AI Solar Advisor. How can I assist you with choosing the right solar system or estimating your savings today?';
  }

  // 13. General consultative response in simple, natural English
  return 'We provide complete solar systems for homes and businesses across Pakistan. To recommend the best setup for your needs, could you tell me your average monthly electricity bill or which appliances you want to run?';
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  onLeadCaptured,
  initialProductContext,
  onClearProductContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-init',
      sender: 'agent',
      text: 'Hello! I can help you choose a solar panel package. Tap the microphone or type below to get started — you can ask about pricing, battery backup, or request a quotation.',
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [statusText, setStatusText] = useState<string>('Online');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Lahore',
    address: '',
    systemSize: '5kW Hybrid System',
    notes: '',
  });

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scoped smooth scroll (avoids whole browser page jumping down)
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialProductContext) {
      const ctxMsg: ChatMessage = {
        id: `agent-ctx-${Date.now()}`,
        sender: 'agent',
        text: `I see you are interested in ${initialProductContext}. You can ask about current pricing, system compatibility, or request a quotation.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, ctxMsg]);
      speakText(ctxMsg.text);
    }
  }, [initialProductContext]);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const clean = text.replace(/[*#_`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.lang = 'en-US';
        utterance.rate = 1.05;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Speech recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText('Listening...');
        };

        recognition.onresult = (e: any) => {
          const transcript = e.results?.[0]?.[0]?.transcript || '';
          setIsListening(false);
          setStatusText('Online');
          if (transcript.trim()) {
            handleSend(transcript.trim());
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setStatusText('Online');
        };

        recognition.onend = () => {
          setIsListening(false);
          setStatusText('Online');
        };

        recognitionRef.current = recognition;
      } catch {}
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleMic = () => {
    if (isSpeaking) stopSpeaking();

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      setStatusText('Online');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setStatusText('Listening...');
      } catch {
        try {
          recognitionRef.current.abort();
          recognitionRef.current.start();
          setIsListening(true);
          setStatusText('Listening...');
        } catch {}
      }
    } else {
      // Simulate voice phrase if speech recognition not allowed in iframe
      setIsListening(true);
      setStatusText('Listening...');
      setTimeout(() => {
        setIsListening(false);
        setStatusText('Online');
        const simulatedVoice = 'Can you tell me about the 5kW hybrid solar system and net metering?';
        handleSend(simulatedVoice);
      }, 1500);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    stopSpeaking();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'customer',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);
    setStatusText('Typing...');

    const phonePattern = /(?:03\d{2}[-\s]?\d{7}|\+92\d{10}|\d{10,12})/;
    const phoneMatch = text.match(phonePattern);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          productContext: initialProductContext || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();
      const reply = data.reply || getQuickSolarReply(text, initialProductContext, [...messages, userMsg]);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: reply,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, agentMsg]);
      setStatusText('Online');

      if (data.capturedLead) {
        onLeadCaptured(data.capturedLead);
      } else if (phoneMatch) {
        const lead: Lead = {
          id: `lead-${Date.now()}`,
          name: 'Direct Inquirer',
          phone: phoneMatch[0],
          email: 'inquiry@solar.live',
          product: initialProductContext || 'Solar Package Quote',
          status: 'Hot',
          note: `Captured query: "${text}"`,
          city: 'Pakistan',
          timestamp: 'Just now',
        };
        onLeadCaptured(lead);
      }
      speakText(reply);
    } catch {
      const fallbackReply = getQuickSolarReply(text, initialProductContext, [...messages, userMsg]);
      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: fallbackReply,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setStatusText('Online');

      if (phoneMatch) {
        const lead: Lead = {
          id: `lead-${Date.now()}`,
          name: 'Direct Inquirer',
          phone: phoneMatch[0],
          email: 'inquiry@solar.live',
          product: initialProductContext || 'Solar Package Quote',
          status: 'Hot',
          note: `Captured query: "${text}"`,
          city: 'Pakistan',
          timestamp: 'Just now',
        };
        onLeadCaptured(lead);
      }
      speakText(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) return;

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: leadForm.name,
      phone: leadForm.phone,
      email: leadForm.email || 'customer@solar-lead.com',
      city: leadForm.city,
      address: leadForm.address,
      product: leadForm.systemSize,
      status: 'Hot',
      note: `Site Survey Requested: ${leadForm.address ? `${leadForm.address}, ` : ''}${leadForm.city}. Notes: ${leadForm.notes || 'None'}`,
      timestamp: 'Just now',
      value: leadForm.systemSize.includes('10kW') ? 'PKR 2.6M' : 'PKR 1.35M',
      estimatedKw: leadForm.systemSize.includes('10kW') ? 10 : 5,
    };

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
    } catch {}

    onLeadCaptured(newLead);
    setShowSurveyModal(false);

    const confirmMsg: ChatMessage = {
      id: `agent-confirm-${Date.now()}`,
      sender: 'agent',
      text: `Thank you, ${leadForm.name}! Your request for a site evaluation at ${leadForm.address ? `${leadForm.address}, ` : ''}${leadForm.city} for ${leadForm.systemSize} has been officially recorded. Our senior solar technical engineer will call you at ${leadForm.phone} shortly.`,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, confirmMsg]);
    speakText(confirmMsg.text);
  };

  return (
    <main id="main">
      <section className="section-tight">
        <div className="container assistant-shell">
          {/* Left Console: Exact Vercel Structure */}
          <aside className="voice-console">
            <div className="mic-stage">
              <div>
                <button
                  className={`mic-button ${isListening ? 'listening' : ''}`}
                  type="button"
                  data-mic-button
                  aria-label={isListening ? 'Stop listening' : 'Start voice demo'}
                  onClick={toggleMic}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M19 11a7 7 0 0 1-14 0M12 18v3M8.5 21h7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                <h2 className="console-title" data-console-title>
                  {isListening ? 'Listening... Speak now' : 'Tap the microphone to start'}
                </h2>

                <p className="console-copy" data-console-copy>
                  {isListening ? 'Assistant is listening to your voice' : 'The assistant can answer solar product questions.'}
                </p>

                {/* Quick Prompts matching Vercel */}
                <div className="quick-prompts" aria-label="Sample prompts">
                  <button
                    className="prompt-chip"
                    type="button"
                    data-prompt
                    onClick={() => handleSend('Tell me about a 5kW solar system')}
                  >
                    Tell me about a 5kW solar system
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    data-prompt
                    onClick={() => handleSend('Do you offer battery backup?')}
                  >
                    Do you offer battery backup?
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    data-prompt
                    onClick={() => setShowSurveyModal(true)}
                  >
                    I need a quotation
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Section: Exact Vercel Structure with Live Conversation */}
          <section className="conversation-card card">
            <div className="chat-header">
              <div>
                <h2>Live conversation</h2>
                <span style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                  Demo assistant response flow
                </span>
              </div>
              <span className="status-dot" data-assistant-status>
                {statusText}
              </span>
            </div>

            {/* Chat Window with Scoped Auto-Scroll */}
            <div
              ref={chatWindowRef}
              className="chat-window"
              data-chat-window
              style={{ minHeight: '380px', maxHeight: '520px', overflowY: 'auto' }}
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender === 'agent' ? 'agent' : 'customer'}`}>
                  {msg.text}
                </div>
              ))}

              {/* Chatbot Loading / Typing Dots Indicator */}
              {isProcessing && (
                <div className="typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              )}
            </div>

            {/* Chat Input Row */}
            <div
              className="chat-input-row"
              style={{
                display: 'flex',
                gap: '10px',
                padding: '14px',
                borderTop: '1px solid var(--border, rgba(0,0,0,.08))',
              }}
            >
              <input
                className="input"
                type="text"
                placeholder="Or type your message here…"
                data-chat-input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="btn btn-primary"
                type="button"
                data-chat-send
                disabled={isProcessing || !inputText.trim()}
                onClick={() => handleSend()}
              >
                Send
              </button>
            </div>
          </section>
        </div>
      </section>

      {/* Quotation & Survey Modal */}
      {showSurveyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Request Solar Quotation</h3>
              <button type="button" onClick={() => setShowSurveyModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleModalSubmit} style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Full Name *</label>
                <input required className="input" placeholder="e.g. Engr. Zubair Ahmed" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Contact Phone / Mobile *</label>
                <input required className="input" placeholder="0300-1234567" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>City</label>
                  <select className="select" value={leadForm.city} onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Peshawar">Peshawar</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>System Capacity</label>
                  <select className="select" value={leadForm.systemSize} onChange={(e) => setLeadForm({ ...leadForm, systemSize: e.target.value })}>
                    <option value="3kW Home Solar">3kW Home Solar</option>
                    <option value="5kW Hybrid System">5kW Hybrid System</option>
                    <option value="7kW Premium Home">7kW Premium Home</option>
                    <option value="10kW Business Solar">10kW Business Solar</option>
                    <option value="20kW Commercial System">20kW Commercial System</option>
                    <option value="Battery and Inverter">Battery and Inverter</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Property / Site Address</label>
                <input className="input" placeholder="e.g. DHA Phase 5, Street 12, House 42" value={leadForm.address} onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>Monthly Bill / Appliance Notes</label>
                <input className="input" placeholder="e.g. 45,000 PKR bill, 2 Inverter ACs" value={leadForm.notes} onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowSurveyModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Submit Quotation Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
