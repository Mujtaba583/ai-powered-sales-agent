export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Sample leads for initial response
  const sampleLeads = [
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

  if (req.method === 'GET') {
    return res.status(200).json({ leads: sampleLeads });
  }

  if (req.method === 'POST') {
    const lead = req.body || {};
    return res.status(201).json({
      success: true,
      lead: {
        id: lead.id || `lead-${Date.now()}`,
        ...lead,
        timestamp: 'Just now',
      },
    });
  }

  return res.status(200).json({ success: true });
}
