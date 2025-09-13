// Health check endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let dbStatus = 'disconnected';
    let dbInfo = {};
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('licenses')
          .select('count')
          .limit(1);
        
        if (!error) {
          dbStatus = 'connected';
          dbInfo = {
            type: 'Supabase',
            status: 'ok'
          };
        }
      } catch (error) {
        console.error('Database health check failed:', error);
        dbStatus = 'error';
        dbInfo = { error: error.message };
      }
    } else {
      dbInfo = {
        type: 'In-Memory',
        status: 'ok'
      };
    }
    
    res.json({ 
      status: 'ok', 
      message: 'ViralVPN API is running',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        ...dbInfo
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
};