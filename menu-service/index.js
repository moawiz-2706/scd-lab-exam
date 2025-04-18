// menu-service/index.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cafe-menu';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Menu item schema
const menuItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  stock: Number
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Middleware
app.use(express.json());

// Routes
app.get('/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find({ stock: { $gt: 0 } });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/menu/:id', async (req, res) => {
  try {
    const item = await MenuItem.findOne({ id: req.params.id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Initialize with sample data if empty
async function initializeMenu() {
  const count = await MenuItem.countDocuments();
  if (count === 0) {
    const initialItems = [
      { id: '1', name: 'Latte', price: 4.0, stock: 100 },
      { id: '2', name: 'Blueberry Muffin', price: 3.0, stock: 50 },
      { id: '3', name: 'Espresso', price: 3.5, stock: 100 },
      { id: '4', name: 'Chocolate Croissant', price: 3.5, stock: 40 }
    ];
    await MenuItem.insertMany(initialItems);
    console.log('Menu initialized with sample data');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Menu Service' });
});

app.listen(PORT, () => {
  console.log(`Menu Service running on port ${PORT}`);
  initializeMenu();
});