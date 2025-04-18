// inventory-service/index.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3003;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cafe-inventory';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB - Inventory Service'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Inventory schema
const inventorySchema = new mongoose.Schema({
  itemId: String,
  quantity: Number,
  lastUpdated: { type: Date, default: Date.now }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// Middleware
app.use(express.json());

// Routes
app.post('/update', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items format' });
    }
    
    for (const item of items) {
      const { itemId, quantity } = item;
      
      // Check if item exists in inventory
      let inventoryItem = await Inventory.findOne({ itemId });
      
      if (!inventoryItem) {
        // If not in inventory service, create it
        inventoryItem = new Inventory({
          itemId,
          quantity: 0
        });
      }
      
      // Check if enough stock
      if (inventoryItem.quantity < quantity) {
        return res.status(400).json({ 
          error: `Not enough stock for item ${itemId}. Available: ${inventoryItem.quantity}, Requested: ${quantity}` 
        });
      }
      
      // Update inventory
      inventoryItem.quantity -= quantity;
      inventoryItem.lastUpdated = new Date();
      await inventoryItem.save();
    }
    
    res.status(200).json({ message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Inventory update error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

app.get('/stock/:itemId', async (req, res) => {
  try {
    const inventoryItem = await Inventory.findOne({ itemId: req.params.itemId });
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }
    
    res.json({ itemId: inventoryItem.itemId, quantity: inventoryItem.quantity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Initialize inventory with sample data if empty
async function initializeInventory() {
  const count = await Inventory.countDocuments();
  if (count === 0) {
    const initialItems = [
      { itemId: '1', quantity: 100 }, // Latte
      { itemId: '2', quantity: 50 },  // Blueberry Muffin
      { itemId: '3', quantity: 100 }, // Espresso
      { itemId: '4', quantity: 40 }   // Chocolate Croissant
    ];
    await Inventory.insertMany(initialItems);
    console.log('Inventory initialized with sample data');
  }
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'Inventory Service' });
});

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
  initializeInventory();
});