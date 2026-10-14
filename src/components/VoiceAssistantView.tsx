import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Lead } from '../types';
import { extractLeadFromConversation } from '../services/crmStorage';

interface VoiceAssistantViewProps {
  onLeadCaptured: (lead: Lead) => void;
  initialProductContext?: string | null;
  onClearProductContext?: () => void;
}

const aiResponses = [
  'That sounds like a great requirement! Our solar panel solutions offer up to 25 years of warranty. May I know your name and contact number to arrange a final quota for you?',
  'For this scale, net metering will help you send excess electricity back to the grid and reduce your bill to zero. Can you share your phone number so our technical advisor can contact you?',
  'Perfect! We offer flexible installment plans for 5kW, 10kW, and 15kW packages. Please share your email address or phone number so I can register a slot for you?',
  'I have noted down your interest. Please share your full name and phone number so our team can execute a structural survey of your site.',
];

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  onLeadCaptured,
  initialProductContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'agent',
      text: 'Hello! I can help you choose a solar panel package. Tap the microphone or type below to get started — you can ask about pricing, battery backup, or request a quotation.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [statusText, setStatusText] = useState('Online');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialProductContext) {
      const msg: ChatMessage = {
        id: `agent-ctx-${Date.now()}`,
        sender: 'agent',
        text: `Regarding the ${initialProductContext}: It is one of our most popular high-efficiency systems with 25-year warranty. Would you like an itemized price quotation or arrange a free rooftop survey?`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, msg]);
      speakText(msg.text);
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
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = 'en-US';

          rec.onstart = () => {
            setIsListening(true);
            setStatusText('Listening...');
          };

          rec.onresult = (e: any) => {
            const transcript = e.results?.[0]?.[0]?.transcript || '';
            setIsListening(false);
            setStatusText('Online');
            if (transcript.trim()) {
              handleSend(transcript.trim());
            }
          };

          rec.onerror = () => {
            setIsListening(false);
            setStatusText('Online');
          };

          rec.onend = () => {
            setIsListening(false);
            setStatusText('Online');
          };

          recognitionRef.current = rec;
        } catch {}
      }
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

  const handleMicClick = () => {
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
        triggerSimulatedVoice();
      }
    } else {
      triggerSimulatedVoice();
    }
  };

  const triggerSimulatedVoice = () => {
    setIsListening(true);
    setStatusText('Listening...');
    setTimeout(() => {
      setIsListening(false);
      setStatusText('Online');
      const voicePhrases = [
        'I want a quote for 10kW solar system my number is 03001234567',
        'What is the total package price with battery backup?',
        'My name is Ahmed, arrange a call back for industrial net metering',
      ];
      const simulatedVoice = voicePhrases[Math.floor(Math.random() * voicePhrases.length)];
      handleSend(simulatedVoice);
    }, 1500);
  };

  const handleSend = async (customText?: string) => {
    const text = (customText || inputText).trim();
    if (!text || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'customer',
      text,
      timestamp: 'Just now',
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsProcessing(true);
    setStatusText('Typing...');

    const localLead = extractLeadFromConversation(text, updatedHistory, initialProductContext);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          productContext: initialProductContext || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      const reply = data.reply || aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: reply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, agentMsg]);
      setStatusText('Online');

      const leadToSave = data.capturedLead || localLead;
      if (leadToSave) {
        onLeadCaptured(leadToSave);
      }
      speakText(reply);
    } catch {
      const fallbackReply = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: fallbackReply,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setStatusText('Online');

      if (localLead) {
        onLeadCaptured(localLead);
      }
      speakText(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main id="main">
      <section className="section-tight">
        <div className="container assistant-shell">
          <aside className="voice-console">
            <div className="mic-stage">
              <div>
                <button
                  className={`mic-button ${isListening ? 'listening' : ''}`}
                  type="button"
                  data-mic-button
                  aria-label="Start voice demo"
                  onClick={handleMicClick}
                  style={isListening ? { transform: 'scale(1.15)', boxShadow: '0 0 25px var(--primary)' } : {}}
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
                  {isListening ? 'Listening...' : 'Tap the microphone to start'}
                </h2>
                <p className="console-copy" data-console-copy>
                  The assistant can answer solar product questions.
                </p>
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
                    onClick={() => handleSend('I need a quotation')}
                  >
                    I need a quotation
                  </button>
                </div>
              </div>
            </div>
          </aside>

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
            <div className="chat-window" data-chat-window ref={chatWindowRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender === 'agent' ? 'agent' : 'user'}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div
              className="chat-input-row"
              style={{
                display: 'flex',
                gap: '10px',
                padding: '14px',
                borderTop: '1px solid var(--border,rgba(0,0,0,.08))',
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
                type="button"
                className={`mic-icon-btn ${isListening ? 'listening' : ''}`}
                style={{
                  width: '42px',
                  height: '42px',
                  minWidth: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isListening
                    ? 'linear-gradient(180deg, var(--brand, #8b1749), #671035)'
                    : 'linear-gradient(180deg, var(--primary, #0f8f8a), var(--primary-700, #0b6f6b))',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening
                    ? '0 4px 14px rgba(139, 23, 73, 0.42)'
                    : '0 4px 14px rgba(15, 143, 138, 0.28)',
                  transform: isListening ? 'scale(1.06)' : 'none',
                  transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
                  flex: '0 0 auto',
                  alignSelf: 'center',
                }}
                aria-label={isListening ? 'Listening... Tap to stop' : 'Voice Input'}
                title={isListening ? 'Listening... Tap to stop' : 'Tap to speak'}
                onClick={handleMicClick}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ width: '20px', height: '20px' }}
                  aria-hidden="true"
                >
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
    </main>
  );
};
