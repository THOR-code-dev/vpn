// Users CRUD endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// Mock users for fallback
const users = [
  {
    id: '1',
    email: 'demo@viralvpn.net',
    licenseKey: 'DEMO-1234-5678-9ABC',
    lastLogin: '2024-09-01T10:00:00.000Z',
    totalUsage: 1024 * 1024 * 512, // 512 MB
    status: 'active',
    currentServer: 'US East'
  },
  {
    id: '2',
    email: 'test@viralvpn.net', 
    licenseKey: 'TEST-ABCD-EFGH-IJKL',
    lastLogin: '2024-09-10T15:30:00.000Z',
    totalUsage: 1024 * 1024 * 1024, // 1 GB
    status: 'active',
    currentServer: 'Frankfurt'
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
      // Get all users
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase users error:', error);
          return res.status(500).json({ error: 'Failed to fetch users' });
        }
        
        res.json(data || []);
      } else {
        // Fallback to in-memory data
        res.json(users);
      }
    }
    
    else if (req.method === 'POST') {
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: req.body.email,
        licenseKey: req.body.licenseKey,
        lastLogin: new Date().toISOString(),
        totalUsage: 0,
        status: 'active'
      };
      
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase create user error:', error);
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        res.json(data);
      } else {
        users.push(newUser);
        res.json(newUser);
      }
    }
    
    else if (req.method === 'PUT') {
      // Update user - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update user error:', error);
          return res.status(500).json({ error: 'Failed to update user' });
        }
        
        res.json(data);
      } else {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        users[userIndex] = { ...users[userIndex], ...req.body };
        res.json(users[userIndex]);
      }
    }
    
    else if (req.method === 'DELETE') {
      // Delete user - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete user error:', error);
          return res.status(500).json({ error: 'Failed to delete user' });
        }
        
        res.json({ message: 'User deleted' });
      } else {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        users.splice(userIndex, 1);
        res.json({ message: 'User deleted' });
      }
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};