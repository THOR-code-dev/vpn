require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors());
// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database simulation
const DB_PATH = path.join(__dirname, 'data', 'licenses.json');

// Ensure data directory and file exist
async function initializeDatabase() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify({ licenses: [] }));
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Read licenses from JSON file
async function getLicenses() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data).licenses;
  } catch (error) {
    console.error('Error reading licenses:', error);
    return [];
  }
}

// Write licenses to JSON file
async function saveLicenses(licenses) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify({ licenses }, null, 2));
  } catch (error) {
    console.error('Error saving licenses:', error);
  }
}

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
    country: 'United States',
    name: 'US East',
    speed: 'high',
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'
  },
  {
    id: '2',
    country: 'Germany',
    name: 'Frankfurt',
    speed: 'high',
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'
  },
  {
    id: '3',
    country: 'Japan',
    name: 'Tokyo',
    speed: 'medium',
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1'
  }
];

// Validate license endpoint
app.post('/api/validate-license', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    const licenses = await getLicenses();
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
    const licenses = await getLicenses();
    licenses.push(newLicense);
    await saveLicenses(licenses);

    // Update Stripe metadata with license key
    await stripe.checkout.sessions.update(session.id, {
      metadata: { licenseKey }
    });
  }

  res.json({ received: true });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});