// customer-service/index.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3004;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cafe-customers';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB - Customer Service'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Customer schema
const customerSchema = new mongoose.Schema({
  customerId: String,
  name: String,
  email: String,
  loyaltyPoints: { type: Number, default: 0 },
  registeredAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);

// Middleware
app.use(express.json());

// Routes
app.get('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.customerId });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

app.post('/update-points', async (req, res) => {
  try {
    const { customerId, points } = req.body;
    
    if (!customerId || !points) {
      return res.status(400).json({ error: 'Customer ID and points are required' });
    }
    
    const customer = await Customer.findOne({ customerId });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Update loyalty points
    customer.loyaltyPoints += points;
    await customer.save();
    
    res.json({ 
      customerId: customer.customerId, 
      name: customer.name,
      loyaltyPoints: customer.loyaltyPoints 
    });
  } catch (error) {
    console.error('Points update error:', error);
    res.status(500).json({ error: 'Failed to update loyalty points' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    // Check if customer exists
    const existingCustomer = await Customer.findOne({ email });
    
    if (existingCustomer) {
      return res.status(409).json({ error: 'Customer with this email already exists' });
    }
    
    const customerId = new mongoose.Types.ObjectId().toString();
    const customer = new Customer({
      customerId,
      name,
      email,
      loyaltyPoints: 10 // Welcome bonus
    });
    
    await customer.save();
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: 'Failed to register customer' });
  }
});

// Initialize with sample data if empty
async function initializeCustomers() {
  const count = await Customer.countDocuments();
  if (count === 0) {
    const initialCustomers = [
      { 
        customerId: '1', 
        name: 'Emma Johnson', 
        email: 'emma@example.com', 
        loyaltyPoints: 10 
      },
      { 
        customerId: '2', 
        name: 'Michael Smith', 
        email: 'michael@example.com', 
        loyaltyPoints: 15 
      }
    ];
    await Customer.insertMany(initialCustomers);
    console.log('Customers initialized with sample data');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Customer Service' });
});

app.listen(PORT, () => {
  console.log(`Customer Service running on port ${PORT}`);
  initializeCustomers();
});