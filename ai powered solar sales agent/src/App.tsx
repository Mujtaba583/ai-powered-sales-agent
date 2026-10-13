import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { VoiceAssistantView } from './components/VoiceAssistantView';
import { ProductsView } from './components/ProductsView';
import { DashboardView } from './components/DashboardView';
import { LoginView } from './components/LoginView';
import { SignupView } from './components/SignupView';
import { Lead, LeadStatus } from './types';
import {
  verifyFirestoreConnection,
  subscribeToAuth,
  logoutUser,
  subscribeToLeads,
  saveLeadToFirestore,
  updateLeadStatusInFirestore,
  deleteLeadFromFirestore,
} from './firebase';

const INITIAL_DEMO_LEADS: Lead[] = [
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_DEMO_LEADS);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // 1. Verify Firestore Connection on Boot
  useEffect(() => {
    verifyFirestoreConnection().catch((err) => {
      console.warn('Firestore connection check warning:', err);
    });
  }, []);

  // 2. Listen to Real Firebase Auth State Changes
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Sales Agent',
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // 3. Real-time Cloud Firestore Leads Synchronization
  useEffect(() => {
    if (!user) return;

    const unsubscribeLeads = subscribeToLeads(
      (firestoreLeads) => {
        if (firestoreLeads && firestoreLeads.length > 0) {
          setLeads(firestoreLeads);
        } else {
          // If Firestore is fresh and empty, seed the initial sample leads so user sees data immediately
          INITIAL_DEMO_LEADS.forEach((lead) => {
            saveLeadToFirestore(lead).catch(() => {});
          });
        }
      },
      (error) => {
        console.warn('Live leads listener note:', error);
      }
    );

    return () => unsubscribeLeads();
  }, [user]);

  // Handle lead captured from Voice Assistant or Quote Modal
  const handleLeadCaptured = async (newLead: Lead) => {
    // 1. Optimistic local update
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === newLead.id || (l.phone && l.phone === newLead.phone));
      if (exists) return prev;
      return [newLead, ...prev];
    });

    // 2. Save directly to Cloud Firestore database
    try {
      await saveLeadToFirestore(newLead);
    } catch (err) {
      console.error('Failed to save lead to Firestore:', err);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      await updateLeadStatusInFirestore(leadId, status);
    } catch (err) {
      console.error('Failed to update lead status in Firestore:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      await deleteLeadFromFirestore(leadId);
    } catch (err) {
      console.error('Failed to delete lead from Firestore:', err);
    }
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setCurrentTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    setCurrentTab('login');
  };

  const handleNavigate = (tab: string) => {
    if (tab === 'dashboard' && !user) {
      setCurrentTab('login');
    } else {
      setCurrentTab(tab);
    }
  };

  const handleTalkToAgentAboutProduct = (productName?: string) => {
    if (productName) {
      setSelectedProduct(productName);
    }
    setCurrentTab('assistant');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6fbfb] text-[#15242a]">
      {/* Site Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigate}
        user={user}
        onLogout={handleLogout}
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
              user={user}
              onNavigateToAssistant={() => setCurrentTab('assistant')}
              onLogout={handleLogout}
              onUpdateStatus={handleUpdateLeadStatus}
              onDeleteLead={handleDeleteLead}
              onAddManualLead={handleLeadCaptured}
            />
          ) : (
            <LoginView
              onSuccess={handleAuthSuccess}
              onNavigateToSignup={() => setCurrentTab('signup')}
            />
          ))}

        {currentTab === 'login' && (
          <LoginView
            onSuccess={handleAuthSuccess}
            onNavigateToSignup={() => setCurrentTab('signup')}
          />
        )}

        {currentTab === 'signup' && (
          <SignupView
            onSuccess={handleAuthSuccess}
            onNavigateToLogin={() => setCurrentTab('login')}
          />
        )}
      </div>

      {/* Site Footer */}
      <Footer onNavigate={setCurrentTab} />
    </div>
  );
}
