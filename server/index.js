require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Stripe setup - only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock_key_for_development') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// In-memory database for Vercel serverless
let licenses = [
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

let users = [
  {
    id: '1',
    email: 'demo@viralvpn.net',
    name: 'Demo User',
    licenseKey: 'DEMO-1234-5678-9ABC',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'test@viralvpn.net', 
    name: 'Test User',
    licenseKey: 'TEST-ABCD-EFGH-IJKL',
    status: 'active',
    createdAt: '2024-07-01T00:00:00.000Z'
  }
];

// Generate a random license key
function generateLicenseKey() {
  const segments = [
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6)
  ];
  return segments.join('-').toUpperCase();
}

// Mock VPN servers
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
    bandwidth: 1024 * 1024 * 1024, // 1 GB
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
    bandwidth: 1024 * 1024 * 1024, // 1 GB
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
    bandwidth: 1024 * 1024 * 1024, // 1 GB
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1'
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ViralVPN API is running',
    timestamp: new Date().toISOString(),
    licenses: licenses.length,
    users: users.length
  });
});

// Validate license endpoint
app.post('/api/validate-license', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    const license = licenses.find(l => l.key === licenseKey);

    if (!license) {
      return res.status(404).json({
        status: 'invalid',
        message: 'License key not found'
      });
    }

    // Check if license is expired
    const expiryDate = new Date(license.expiryDate);
    const now = new Date();
    const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return res.status(400).json({
        status: 'invalid',
        message: 'License has expired'
      });
    }

    res.json({
      status: 'valid',
      user: license.email,
      remainingDays,
      servers: VPN_SERVERS
    });
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(501).json({
        status: 'error',
        message: 'Stripe integration is not enabled.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VPN License - 1 Month',
              description: 'Access to all VPN servers for 1 month'
            },
            unit_amount: 999 // $9.99
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create checkout session'
    });
  }
});

// Stripe webhook handler
app.post('/api/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(501).send('Stripe webhook handler is not enabled.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Generate new license
    const licenseKey = generateLicenseKey();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const newLicense = {
      id: uuidv4(),
      key: licenseKey,
      email: session.customer_details.email,
      createdAt: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      stripeSessionId: session.id
    };

    // Save to database
    licenses.push(newLicense);

    // Update Stripe metadata with license key
    await stripe.checkout.sessions.update(session.id, {
      metadata: { licenseKey }
    });
  }

  res.json({ received: true });
});

// Admin API endpoints
app.get('/api/servers', async (req, res) => {
  try {
    res.json(VPN_SERVERS);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const newServer = {
      id: Date.now().toString(),
      ...req.body,
      status: 'online',
      users: 0,
      bandwidth: 0,
    };
    VPN_SERVERS.push(newServer);
    res.json(newServer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create server' });
  }
});

app.put('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Server not found' });
    }
    VPN_SERVERS[serverIndex] = { ...VPN_SERVERS[serverIndex], ...req.body };
    res.json(VPN_SERVERS[serverIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update server' });
  }
});

app.delete('/api/servers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Server not found' });
    }
    VPN_SERVERS.splice(serverIndex, 1);
    res.json({ message: 'Server deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

app.get('/api/licenses', async (req, res) => {
  try {
    res.json(licenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

app.post('/api/licenses', async (req, res) => {
  try {
    const { email, expiryDate } = req.body;
    const licenseKey = generateLicenseKey();
    
    const newLicense = {
      id: uuidv4(),
      key: licenseKey,
      email,
      createdAt: new Date().toISOString(),
      expiryDate,
      status: 'active'
    };

    licenses.push(newLicense);
    
    res.json(newLicense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create license' });
  }
});

app.put('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const licenseIndex = licenses.findIndex(l => l.id === id);
    
    if (licenseIndex === -1) {
      return res.status(404).json({ error: 'License not found' });
    }
    
    licenses[licenseIndex] = { ...licenses[licenseIndex], ...req.body };
    
    res.json(licenses[licenseIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update license' });
  }
});

app.delete('/api/licenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Lisans silme isteği:', { id });
    
    const licenseIndex = licenses.findIndex(l => l.id === id);
    
    if (licenseIndex === -1) {
      console.log('Lisans bulunamadı');
      return res.status(404).json({ error: 'License not found' });
    }
    
    const deletedLicense = licenses[licenseIndex];
    licenses.splice(licenseIndex, 1);
    
    console.log('Lisans silindi:', deletedLicense);
    res.json({ message: 'License deleted', deletedLicense });
  } catch (error) {
    console.error('Lisans silme hatası:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = {
      id: uuidv4(), // Use uuidv4 for new users
      ...req.body,
      lastLogin: new Date().toISOString(),
      totalUsage: 0,
      status: 'active'
    };
    users.push(newUser);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    
    res.json(users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = {
      appName: 'viralvpn',
      version: '1.0.0',
      maintenanceMode: false,
      maxConnectionsPerUser: 1,
      defaultLicenseDuration: 30, // days
      stripeEnabled: true,
      outlineApiEnabled: true
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    // Mock update - gerçek uygulamada ayarlar dosyasında güncellenecek
    res.json({ message: 'Settings updated', ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
});

app.post('/api/admin/verify', (req, res) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (e) {
    res.status(401).json({ valid: false });
  }
});

// Initialize database and start server
// initializeDatabase().then(() => { // This line is removed as per the new_code
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
// });