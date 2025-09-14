// Licenses CRUD endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// License key generator
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Mock licenses for fallback
const licenses = [
  {
    id: '1',
    key: 'DEMO-1234-5678-9ABC',
    email: 'demo@viralvpn.net',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  },
  {
    id: '2', 
    key: 'TEST-ABCD-EFGH-IJKL',
    email: 'test@viralvpn.net',
    status: 'active',
    expiryDate: '2025-08-31T23:59:59.000Z',
    createdAt: '2024-07-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  }
];

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all licenses
      if (supabase) {
        const { data, error } = await supabase
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase licenses error:', error);
          return res.status(500).json({ error: 'Failed to fetch licenses' });
        }
        
        res.json(data || []);
      } else {
        // Fallback to in-memory data
        res.json(licenses);
      }
    }
    
    else if (req.method === 'POST') {
      // Create new license
      const licenseKey = generateLicenseKey();
      const now = new Date();
      const daysToAdd = req.body.plan === 'yearly' ? 365 : 30;
      const expiryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      
      const newLicense = {
        id: uuidv4(),
        key: licenseKey,
        email: req.body.email,
        status: 'active',
        expiryDate: expiryDate.toISOString(),
        createdAt: now.toISOString(),
        plan: req.body.plan || 'monthly',
        price: req.body.plan === 'yearly' ? 59.99 : 9.99
      };
      
      if (supabase) {
        const { data, error } = await supabase
          .from('licenses')
          .insert([newLicense])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase create license error:', error);
          return res.status(500).json({ error: 'Failed to create license' });
        }
        
        // Update purchase request if provided
        if (req.body.purchaseRequestId) {
          await supabase
            .from('purchase_requests')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString(),
              admin_notes: `License created: ${licenseKey}`
            })
            .eq('id', req.body.purchaseRequestId);
        }
        
        res.json(data);
      } else {
        licenses.push(newLicense);
        res.json(newLicense);
      }
    }
    
    else if (req.method === 'PUT') {
      // Update license - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { data, error } = await supabase
          .from('licenses')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update license error:', error);
          return res.status(500).json({ error: 'Failed to update license' });
        }
        
        res.json(data);
      } else {
        const licenseIndex = licenses.findIndex(l => l.id === id);
        if (licenseIndex === -1) {
          return res.status(404).json({ error: 'License not found' });
        }
        
        licenses[licenseIndex] = { ...licenses[licenseIndex], ...req.body };
        res.json(licenses[licenseIndex]);
      }
    }
    
    else if (req.method === 'DELETE') {
      // Delete license - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { error } = await supabase
          .from('licenses')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete license error:', error);
          return res.status(500).json({ error: 'Failed to delete license' });
        }
        
        res.json({ message: 'License deleted' });
      } else {
        const licenseIndex = licenses.findIndex(l => l.id === id);
        if (licenseIndex === -1) {
          return res.status(404).json({ error: 'License not found' });
        }
        
        licenses.splice(licenseIndex, 1);
        res.json({ message: 'License deleted' });
      }
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Licenses API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};