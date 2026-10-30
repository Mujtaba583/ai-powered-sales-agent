import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { VoiceAssistantView } from './components/VoiceAssistantView';
import { ProductsView } from './components/ProductsView';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { SignupView } from './components/SignupView';
import { Lead } from './types';

const parseInitialTab = (): string => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'assistant' || hash === 'voice-assistant') return 'assistant';
  if (hash === 'products' || hash === 'catalog') return 'products';
  if (hash === 'dashboard' || hash === 'leads') return 'dashboard';
  if (hash === 'login') return 'login';
  if (hash === 'signup') return 'signup';
  return 'home';
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(parseInitialTab);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : { id: 'admin-1', name: 'Sales Manager', email: 'admin@solarsales.com' };
    } catch {
      return { id: 'admin-1', name: 'Sales Manager', email: 'admin@solarsales.com' };
    }
  });

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 'lead-1',
      name: 'Zubair Ahmed',
      phone: '0300-1234567',
      email: 'zubair@gmail.com',
      product: '10kW Hybrid System',
      status: 'Hot',
      note: 'Wants to install next week, discussing 12-month installment plan.',
      timestamp: 'Today, 10:15 AM',
      city: 'Lahore (DHA)',
    },
    {
      id: 'lead-2',
      name: 'Kamran Khan',
      phone: '0321-7654321',
      email: 'kamran@yahoo.com',
      product: '5kW On-Grid System',
      status: 'Warm',
      note: 'Inquired about net metering paperwork and Tier-1 Bifacial panels brand.',
      timestamp: 'Yesterday',
      city: 'Karachi (Gulshan)',
    },
    {
      id: 'lead-3',
      name: 'Ayesha Siddiqua',
      phone: '0333-9876543',
      email: 'ayesha@outlook.com',
      product: '7kW Inverter System',
      status: 'New',
      note: 'Left contact details via voice assistant, requested a site survey call back.',
      timestamp: '2 days ago',
      city: 'Islamabad (F-10)',
    },
  ]);

  const fetchLeads = () => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLeads();

    const handleLeadEvent = (e: any) => {
      const captured = e?.detail;
      if (captured) {
        handleLeadCaptured(captured);
      }
      fetchLeads();
    };

    window.addEventListener('solar_crm_lead_captured', handleLeadEvent);
    return () => {
      window.removeEventListener('solar_crm_lead_captured', handleLeadEvent);
    };
  }, []);

  // Title and URL hash synchronization
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      home: 'AI Sales Agent | Home',
      assistant: 'AI Sales Agent | Voice Assistant',
      products: 'AI Sales Agent | Products',
      dashboard: 'AI Sales Agent | Dashboard',
      login: 'AI Sales Agent | Login',
      signup: 'AI Sales Agent | Sign Up',
    };

    document.title = tabTitles[currentTab] || 'AI Sales Agent | Home';

    const targetHash = currentTab === 'home' ? '#home' : `#${currentTab}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [currentTab]);

  // Listen to browser hash changes (back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const tab = parseInitialTab();
      setCurrentTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLeadCaptured = (newLead: Lead) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === newLead.id || (l.phone && l.phone === newLead.phone));
      if (exists) return prev;
      return [newLead, ...prev];
    });
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    fetchLeads();
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    setUser(null);
    handleNavigate('login');
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'dashboard') {
      fetchLeads();
    }
    setCurrentTab(tab);
    const targetHash = tab === 'home' ? '#home' : `#${tab}`;
    window.history.replaceState(null, '', targetHash);
  };

  const handleTalkToAgentAboutProduct = (productName?: string) => {
    if (productName) {
      setSelectedProduct(productName);
    }
    handleNavigate('assistant');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6fbfb] text-[#15242a]">
      {/* Site Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        user={user}
        onLogout={handleLogout}
        leadsCount={leads.length}
      />

      {/* Main Page Content */}
      <div className="flex-1">
        {currentTab === 'home' && <HomeView onNavigate={handleNavigate} />}

        {currentTab === 'assistant' && (
          <VoiceAssistantView
            onLeadCaptured={handleLeadCaptured}
            initialProductContext={selectedProduct}
            onClearProductContext={() => setSelectedProduct(null)}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView onTalkToAgent={handleTalkToAgentAboutProduct} />
        )}

        {currentTab === 'dashboard' &&
          (user ? (
            <DashboardView
              leads={leads}
              onNavigateToAssistant={() => handleNavigate('assistant')}
              onLogout={handleLogout}
            />
          ) : (
            <LoginView
              onSuccess={handleAuthSuccess}
              onNavigateToSignup={() => handleNavigate('signup')}
            />
          ))}

        {currentTab === 'login' && (
          <LoginView
            onSuccess={handleAuthSuccess}
            onNavigateToSignup={() => handleNavigate('signup')}
          />
        )}

        {currentTab === 'signup' && (
          <SignupView
            onSuccess={handleAuthSuccess}
            onNavigateToLogin={() => handleNavigate('login')}
          />
        )}
      </div>

      {/* Site Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
