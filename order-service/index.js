// order-service/index.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3002;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cafe-orders';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Order schema
const orderSchema = new mongoose.Schema({
  orderId: String,
  customerId: String,
  items: [{
    itemId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Middleware
app.use(express.json());

// API Gateway URL
const API_GATEWAY = process.env.API_GATEWAY || 'http://localhost:3000';

// Routes
app.post('/orders', async (req, res) => {
  try {
    const { customerId, items } = req.body;
    
    // Validate customer exists
    try {
      await axios.get(`${API_GATEWAY}/customers/${customerId}`);
    } catch (error) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Validate and fetch menu items
    let total = 0;
    const orderItems = [];
    
    for (const item of items) {
      try {
        const menuItemResponse = await axios.get(`${API_GATEWAY}/menu/${item.itemId}`);
        const menuItem = menuItemResponse.data;
        
        if (menuItem.stock < item.quantity) {
          return res.status(400).json({ error: `Not enough stock for ${menuItem.name}` });
        }
        
        orderItems.push({
          itemId: menuItem.id,
          name: menuItem.name,
          quantity: item.quantity,
          price: menuItem.price
        });
        
        total += menuItem.price * item.quantity;
      } catch (error) {
        return res.status(404).json({ error: `Menu item ${item.itemId} not found` });
      }
    }
    
    // Create order
    const orderId = new mongoose.Types.ObjectId().toString();
    const order = new Order({
      orderId,
      customerId,
      items: orderItems,
      total,
      status: 'pending'
    });
    
    await order.save();
    
    // Update inventory
    try {
      await axios.post(`${API_GATEWAY}/inventory/update`, {
        items: orderItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        }))
      });
    } catch (error) {
      // Rollback order if inventory update fails
      await Order.deleteOne({ orderId });
      return res.status(500).json({ error: 'Failed to update inventory' });
    }
    
    // Update customer loyalty points
    try {
      await axios.post(`${API_GATEWAY}/customers/update-points`, {
        customerId,
        points: Math.floor(total)
      });
    } catch (error) {
      console.error('Failed to update customer points', error);
      // Continue with order even if points update fails
    }
    
    // Update order status
    order.status = 'confirmed';
    await order.save();
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.get('/orders/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Order Service' });
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});