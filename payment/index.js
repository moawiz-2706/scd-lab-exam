// payment-service/index.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3005;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cafe-payments';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB - Payment Service'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Payment schema
const paymentSchema = new mongoose.Schema({
  paymentId: String,
  orderId: String,
  customerId: String,
  amount: Number,
  status: String,
  transactionReference: String,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Middleware
app.use(express.json());

// API Gateway URL
const API_GATEWAY = process.env.API_GATEWAY || 'http://localhost:3000';

// Routes
app.post('/payments', async (req, res) => {
  try {
    const { orderId, customerId, amount } = req.body;
    
    if (!orderId || !customerId || !amount) {
      return res.status(400).json({ error: 'Order ID, customer ID, and amount are required' });
    }
    
    // Verify order exists and amount matches
    try {
      const orderResponse = await axios.get(`${API_GATEWAY}/orders/${orderId}`);
      const order = orderResponse.data;
      
      if (order.total !== amount) {
        return res.status(400).json({ 
          error: `Payment amount does not match order total. Expected: ${order.total}, Received: ${amount}` 
        });
      }
      
      if (order.customerId !== customerId) {
        return res.status(400).json({ error: 'Customer ID does not match order' });
      }
    } catch (error) {
      return res.status(404).json({ error: 'Order not found or could not be verified' });
    }
    
    // Simulate payment processing with payment gateway (like Stripe)
    // In a real system, this would integrate with a payment processor
    const paymentId = new mongoose.Types.ObjectId().toString();
    const transactionReference = `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const payment = new Payment({
      paymentId,
      orderId,
      customerId,
      amount,
      status: 'completed',
      transactionReference
    });
    
    await payment.save();
    
    res.status(201).json({
      paymentId,
      orderId,
      amount,
      status: 'completed',
      transactionReference
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

app.get('/payments/:paymentId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ paymentId: req.params.paymentId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

app.get('/payments/order/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found for this order' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment for order' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Payment Service' });
});

app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});