// Servers CRUD endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// Mock VPN servers for fallback
const VPN_SERVERS = [
  {
    id: '1',
    name: 'US East',
    country: 'United States',
    city: 'New York',
    ip: 'us-east.example.com',
    port: 8388,
    status: 'online',
    speed: 'high',
    users: 15,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024,
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'
  },
  {
    id: '2',
    name: 'Frankfurt',
    country: 'Germany',
    city: 'Frankfurt',
    ip: 'de-frankfurt.example.com',
    port: 8388,
    status: 'online',
    speed: 'high',
    users: 8,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024,
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'
  },
  {
    id: '3',
    name: 'Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    ip: 'jp-tokyo.example.com',
    port: 8388,
    status: 'online',
    speed: 'medium',
    users: 12,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024,
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1'
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
      // Get all servers
      if (supabase) {
        const { data, error } = await supabase
          .from('servers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase servers error:', error);
          return res.status(500).json({ error: 'Failed to fetch servers' });
        }
        
        res.json(data || []);
      } else {
        // Fallback to in-memory data
        res.json(VPN_SERVERS);
      }
    }
    
    else if (req.method === 'POST') {
      // Create new server
      const newServer = {
        id: Date.now().toString(),
        name: req.body.name,
        country: req.body.country,
        city: req.body.city,
        ip: req.body.ip,
        port: parseInt(req.body.port),
        status: 'online',
        users: 0,
        maxUsers: 100,
        bandwidth: 0,
        isActive: true
      };
      
      if (supabase) {
        const { data, error } = await supabase
          .from('servers')
          .insert([newServer])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase create server error:', error);
          return res.status(500).json({ error: 'Failed to create server' });
        }
        
        res.json(data);
      } else {
        VPN_SERVERS.push(newServer);
        res.json(newServer);
      }
    }
    
    else if (req.method === 'PUT') {
      // Update server - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { data, error } = await supabase
          .from('servers')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update server error:', error);
          return res.status(500).json({ error: 'Failed to update server' });
        }
        
        res.json(data);
      } else {
        const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
        if (serverIndex === -1) {
          return res.status(404).json({ error: 'Server not found' });
        }
        
        VPN_SERVERS[serverIndex] = { ...VPN_SERVERS[serverIndex], ...req.body };
        res.json(VPN_SERVERS[serverIndex]);
      }
    }
    
    else if (req.method === 'DELETE') {
      // Delete server - parse ID from URL path
      const urlParts = req.url.split('/');
      const id = urlParts[urlParts.length - 1];
      
      if (supabase) {
        const { error } = await supabase
          .from('servers')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete server error:', error);
          return res.status(500).json({ error: 'Failed to delete server' });
        }
        
        res.json({ message: 'Server deleted' });
      } else {
        const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
        if (serverIndex === -1) {
          return res.status(404).json({ error: 'Server not found' });
        }
        
        VPN_SERVERS.splice(serverIndex, 1);
        res.json({ message: 'Server deleted' });
      }
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Servers API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};