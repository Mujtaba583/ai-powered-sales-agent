import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ChatMessage, Lead } from '../types';

interface VoiceAssistantViewProps {
  onLeadCaptured: (lead: Lead) => void;
  initialProductContext?: string | null;
  onClearProductContext?: () => void;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  onLeadCaptured,
  initialProductContext,
  onClearProductContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialProductContext) {
      return [
        {
          id: 'msg-init',
          sender: 'agent',
          text: `Welcome! I can assist you with the ${initialProductContext}. Would you like to check current pricing in Pakistan, system compatibility, net metering, or get an official quotation?`,
          timestamp: 'Just now',
        },
      ];
    }
    return [
      {
        id: 'msg-1',
        sender: 'agent',
        text: 'Hello! I am your AI Sales Agent. Tap the microphone or type below — ask about Longi panels, Inverex hybrid inverters, net metering, or share your contact number for a free site assessment.',
        timestamp: 'Just now',
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [statusText, setStatusText] = useState<string>('Online');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(initialProductContext || null);

  // Natural Human Voice State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speakTimeoutRef = useRef<any>(null);

  // Scoped container scroll - does NOT jump or yank the outer page/window
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isProcessing]);

  // Load browser neural / natural voices with active poller for mobile/Chrome
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const available = window.speechSynthesis.getVoices();
          if (available && available.length > 0) {
            setVoices(available);
          }
        } catch {}
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;

      // Chrome/Android interval poller
      const intervalId = setInterval(updateVoices, 200);
      const stopTimer = setTimeout(() => clearInterval(intervalId), 3000);

      return () => {
        clearInterval(intervalId);
        clearTimeout(stopTimer);
      };
    }
  }, []);

  // When initialProductContext changes from outside
  useEffect(() => {
    if (initialProductContext) {
      setSelectedProduct(initialProductContext);
      const contextualMsg: ChatMessage = {
        id: `agent-ctx-${Date.now()}`,
        sender: 'agent',
        text: `I see you are interested in ${initialProductContext}! Ask me about current wholesale rates, warranty, technical compatibility, or share your contact details for an on-site quotation.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, contextualMsg]);
      speakText(contextualMsg.text);
    }
  }, [initialProductContext]);

  // Text formatter for natural human pronunciation
  const formatTextForSpeech = (text: string): string => {
    let spoken = text;
    // Remove markdown symbols and JSON blocks
    spoken = spoken.replace(/[*#_`~]/g, '');
    spoken = spoken.replace(/@+LEAD_JSON@+[\s\S]*?@+END_LEAD_JSON@+/g, '');
    // Convert Pakistani currency & solar technical units to smooth natural phrases
    spoken = spoken.replace(/\bPKR\s*([0-9,]+(?:\.[0-9]+)?)\s*M\b/gi, '$1 million rupees');
    spoken = spoken.replace(/\bPKR\s*([0-9,]+(?:\.[0-9]+)?)\s*k\b/gi, '$1 thousand rupees');
    spoken = spoken.replace(/\bPKR\s*([0-9,]+)/gi, '$1 rupees');
    spoken = spoken.replace(/\b([0-9]+(?:\.[0-9]+)?)\s*kW\b/gi, '$1 kilowatt');
    spoken = spoken.replace(/\b([0-9]+(?:\.[0-9]+)?)\s*kWh\b/gi, '$1 kilowatt hours');
    spoken = spoken.replace(/\b([0-9]+)\s*W\b/g, '$1 watt');
    spoken = spoken.replace(/~/g, 'approximately ');
    spoken = spoken.replace(/\//g, ' or ');
    spoken = spoken.replace(/&/g, ' and ');
    spoken = spoken.replace(/\bBOQ\b/gi, 'quotation');
    spoken = spoken.replace(/\bDISCOs\b/gi, 'power distribution companies');
    spoken = spoken.replace(/\bLESCO\b/gi, 'Lesco');
    spoken = spoken.replace(/\bMEPCO\b/gi, 'Mepco');
    spoken = spoken.replace(/\bIESCO\b/gi, 'Iesco');
    spoken = spoken.replace(/\bFESCO\b/gi, 'Fesco');
    spoken = spoken.replace(/\bK-Electric\b/gi, 'K Electric');
    return spoken.trim();
  };

  // Split into clean sentence chunks to prevent Chrome/Mobile cutoff bug
  const splitTextIntoSentences = (text: string): string[] => {
    const rawSentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
    return rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);
  };

  // Select highest-fidelity human voice available on user's device/browser
  const getNaturalVoice = (gender: 'female' | 'male'): SpeechSynthesisVoice | null => {
    if (!voices || voices.length === 0) return null;
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    if (englishVoices.length === 0) return voices[0];

    if (gender === 'female') {
      const preferredFemale = [
        'Microsoft Jenny Online (Natural)',
        'Microsoft Aria Online (Natural)',
        'Microsoft Sonia Online (Natural)',
        'Google US English',
        'Google UK English Female',
        'Samantha',
        'Ava',
        'Victoria',
        'Karen',
        'Zoe',
        'Moira',
      ];
      for (const name of preferredFemale) {
        const found = englishVoices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
        if (found) return found;
      }
      const femaleFallback = englishVoices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Premium')) &&
          !v.name.toLowerCase().includes('male') &&
          !v.name.toLowerCase().includes('guy') &&
          !v.name.toLowerCase().includes('david')
      );
      if (femaleFallback) return femaleFallback;
    } else {
      const preferredMale = [
        'Microsoft Guy Online (Natural)',
        'Microsoft Ryan Online (Natural)',
        'Google UK English Male',
        'Daniel',
        'Arthur',
        'Oliver',
        'Alex',
      ];
      for (const name of preferredMale) {
        const found = englishVoices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
        if (found) return found;
      }
    }

    const anyNatural = englishVoices.find(
      (v) => v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Premium')
    );
    if (anyNatural) return anyNatural;

    return englishVoices.find((v) => v.lang === 'en-US') || englishVoices[0];
  };

  const stopSpeaking = () => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  };

  // High-Quality Speech synthesis for agent voice reply
  const speakText = (text: string) => {
    stopSpeaking();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const clean = formatTextForSpeech(text);
    if (!clean) return;

    // Small delay allows any prior cancel to flush cleanly through the browser audio subsystem
    speakTimeoutRef.current = setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        const sentences = splitTextIntoSentences(clean);
        if (sentences.length === 0) return;

        const chosenVoice = getNaturalVoice(voiceGender);
        setIsSpeaking(true);

        sentences.forEach((sentence, index) => {
          const utterance = new SpeechSynthesisUtterance(sentence);
          if (chosenVoice) {
            utterance.voice = chosenVoice;
            utterance.lang = chosenVoice.lang;
          } else {
            utterance.lang = 'en-US';
          }

          utterance.rate = voiceGender === 'female' ? 1.0 : 0.98;
          utterance.pitch = voiceGender === 'female' ? 1.04 : 0.94;

          if (index === 0) {
            utterance.onstart = () => setIsSpeaking(true);
          }

          if (index === sentences.length - 1) {
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
          }

          window.speechSynthesis.speak(utterance);
        });
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setIsSpeaking(false);
      }
    }, 40);
  };

  // Initialize Speech Recognition with cross-browser detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (!SpeechRecognition) {
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText('Listening to your voice...');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript || '';
          setIsListening(false);
          setStatusText('Processing voice...');
          if (transcript.trim()) {
            handleSend(transcript.trim());
          } else {
            setStatusText('Online');
          }
        };

        recognition.onerror = (e: any) => {
          setIsListening(false);
          const errorType = e?.error || 'unknown';
          if (errorType === 'not-allowed' || errorType === 'permission-denied') {
            setStatusText('Microphone access denied. Please allow microphone in browser');
          } else if (errorType === 'no-speech') {
            setStatusText('No speech detected. Please try again or type');
          } else if (errorType === 'network') {
            setStatusText('Voice recognition network issue. You can type below');
          } else {
            setStatusText('Online');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (statusText === 'Listening to your voice...') {
            setStatusText('Online');
          }
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      stopSpeaking();
    };
  }, []);

  const toggleMic = () => {
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setStatusText('Online');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setStatusText('Listening to your voice...');
      } catch {
        try {
          recognitionRef.current.abort();
          recognitionRef.current.start();
          setIsListening(true);
          setStatusText('Listening to your voice...');
        } catch {
          setStatusText('Please check microphone permissions or type below');
        }
      }
    } else {
      setStatusText('Speech recognition not available in this browser. Please type below');
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

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsProcessing(true);
    setStatusText('AI Sales Agent is answering...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          productContext: selectedProduct || undefined,
          modelEngine: 'gemini',
        }),
      });

      const data = await res.json();
      const reply =
        data.reply ||
        'For this requirement, our Tier-1 solar packages offer high efficiency and complete net metering support. May I have your name, address, and phone number to schedule an on-site survey?';

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
        try {
          window.dispatchEvent(
            new CustomEvent('solar_crm_lead_captured', { detail: data.capturedLead })
          );
        } catch {}
      }

      speakText(reply);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: 'Our 5kW (PKR 1.2M-1.45M) and 10kW (PKR 2.35M-2.75M) turnkey systems with Tier-1 bifacial panels and net metering are ideal for Pakistani homes. May I have your name, address, and phone number so our AI sales agent can arrange a free roof assessment?',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setStatusText('Online');
      speakText(fallbackMsg.text);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main id="main">
      <section className="section-tight">
        <div className="container assistant-shell">
          {/* Left Console: Voice Mic Stage & Quick Prompts */}
          <aside className="voice-console">
            <div className="mic-stage">
              <div>
                <button
                  className={`mic-button ${isListening ? 'listening' : ''}`}
                  type="button"
                  data-mic-button
                  aria-label={isListening ? 'Stop listening' : 'Start microphone voice input'}
                  onClick={toggleMic}
                  style={{
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '28px', height: '28px' }}>
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

                <h2 className="console-title" data-console-title style={{ fontSize: '1.25rem', marginTop: '14px' }}>
                  {isListening
                    ? 'Listening...'
                    : isSpeaking
                    ? 'Speaking...'
                    : 'Tap to speak'}
                </h2>

                <p className="console-copy" data-console-copy style={{ fontSize: '0.9rem', color: 'var(--muted)', minHeight: '1.8em' }}>
                  {statusText !== 'Online'
                    ? statusText
                    : 'Ask about solar prices, packages, or net metering.'}
                </p>

                {/* Natural Voice Selector Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    margin: '8px auto 14px',
                    padding: '4px',
                    background: '#f1f5f9',
                    borderRadius: '8px',
                    width: 'fit-content',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', color: 'var(--muted)', padding: '0 6px', fontWeight: 600 }}>
                    Voice:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('female');
                      stopSpeaking();
                    }}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: voiceGender === 'female' ? '#0d9488' : 'transparent',
                      color: voiceGender === 'female' ? 'white' : 'var(--text)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('male');
                      stopSpeaking();
                    }}
                    style={{
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: voiceGender === 'male' ? '#0d9488' : 'transparent',
                      color: voiceGender === 'male' ? 'white' : 'var(--text)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Male
                  </button>
                </div>

                {/* Selected Product Context Banner */}
                {selectedProduct && (
                  <div
                    style={{
                      background: 'var(--primary-50)',
                      border: '1px solid #b2e3e1',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      margin: '12px 0 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary-700)', fontWeight: 700 }}>
                        Active Product
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 650, color: '#134e4a' }}>
                        {selectedProduct}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        if (onClearProductContext) onClearProductContext();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        padding: '4px',
                      }}
                      title="Clear product filter"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Sound Control Indicator */}
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: '1px solid #fca5a5',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginBottom: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <VolumeX size={14} />
                    <span>Stop Audio</span>
                  </button>
                )}

                {/* Simple & Clear Quick Prompts */}
                <div className="quick-prompts" aria-label="Sample questions">
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('What is the price of a 5kW solar system?')}
                  >
                    5kW Solar Price
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('What are Longi and Jinko panel rates right now?')}
                  >
                    Longi vs Jinko Panels
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('Tell me about Inverex 10kW hybrid inverter and Net Metering')}
                  >
                    Inverex 10kW Inverter
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('What is the cost of Felicity 5.12kWh lithium battery?')}
                  >
                    Lithium Battery Backup
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('How does net metering work with LESCO and K-Electric?')}
                  >
                    Net Metering Process
                  </button>
                  <button
                    className="prompt-chip"
                    type="button"
                    onClick={() => handleSend('I want to book a free rooftop solar survey')}
                  >
                    Free Rooftop Survey
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Section: Conversation History & Input */}
          <section className="conversation-card card">
            <div className="chat-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Live Voice & Text Sales Assistant</h2>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  AI Sales Agent • Technical & Quotation Support
                </span>
              </div>
              <span className="status-dot" data-assistant-status>
                {statusText === 'Processing voice...'
                  ? 'Transcribing...'
                  : isListening
                  ? 'Listening...'
                  : isProcessing
                  ? 'Thinking...'
                  : isSpeaking
                  ? 'Speaking...'
                  : 'Online'}
              </span>
            </div>



            <div
              ref={chatWindowRef}
              className="chat-window"
              data-chat-window
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                overflowY: 'auto',
                minHeight: '380px',
                maxHeight: '520px',
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'customer' ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    className={`message ${msg.sender === 'agent' ? 'agent' : 'user'}`}
                    style={{
                      position: 'relative',
                      wordBreak: 'break-word',
                      maxWidth: '92%',
                      lineHeight: 1.5,
                      fontSize: '0.94rem',
                    }}
                  >
                    {msg.text}

                    {/* Re-listen button for Agent replies */}
                    {msg.sender === 'agent' && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        title="Listen to this response"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginLeft: '8px',
                          marginTop: '6px',
                          background: 'rgba(0,0,0,0.04)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.74rem',
                          color: 'var(--primary-700)',
                          cursor: 'pointer',
                        }}
                      >
                        <Volume2 size={12} />
                        <span>Listen</span>
                      </button>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                      marginTop: '3px',
                      padding: '0 6px',
                    }}
                  >
                    {msg.sender === 'agent' ? 'AI Sales Agent' : 'You'} • {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Chatbot Typing Indicator / Loading Animation */}
              {isProcessing && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    className="message agent"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 18px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'white',
                      border: '1px solid #d1fae5',
                      boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', color: '#0d9488', fontWeight: 600 }}>
                      AI Sales Agent is preparing answer
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                      <span className="typing-dot dot-1" />
                      <span className="typing-dot dot-2" />
                      <span className="typing-dot dot-3" />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                      marginTop: '3px',
                      padding: '0 6px',
                    }}
                  >
                    AI Sales Agent • Processing...
                  </span>
                </div>
              )}
            </div>

            {/* Input Form with Mobile-Optimized Layout */}
            <form
              className="chat-input-row"
              style={{
                display: 'flex',
                gap: '10px',
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--surface)',
                alignItems: 'center',
              }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                className="input"
                type="text"
                placeholder="Ask any question..."
                data-chat-input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ flex: 1, padding: '11px 14px', fontSize: '0.92rem' }}
              />

              <button
                type="button"
                className="btn btn-ghost"
                onClick={toggleMic}
                aria-label="Microphone button"
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  color: isListening ? '#dc2626' : 'var(--text)',
                }}
                title="Use Microphone"
              >
                <svg viewBox="0 0 24 24" fill="none" style={{ width: '20px', height: '20px' }}>
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
                type="submit"
                data-chat-send
                disabled={isProcessing || !inputText.trim()}
                style={{ minWidth: '76px', padding: '11px 18px' }}
              >
                {isProcessing ? '...' : 'Send'}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
};
