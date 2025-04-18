// api-gateway/index.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Service endpoints
const MENU_SERVICE = process.env.MENU_SERVICE || 'http://localhost:3001';
const ORDER_SERVICE = process.env.ORDER_SERVICE || 'http://localhost:3002';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE || 'http://localhost:3003';
const CUSTOMER_SERVICE = process.env.CUSTOMER_SERVICE || 'http://localhost:3004';
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE || 'http://localhost:3005';

// Routes configuration
app.use('/menu', createProxyMiddleware({ 
  target: MENU_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/menu': '/menu' }
}));

app.use('/orders', createProxyMiddleware({
  target: ORDER_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/orders': '/orders' }
}));

app.use('/inventory', createProxyMiddleware({
  target: INVENTORY_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/inventory': '/' }
}));

app.use('/customers', createProxyMiddleware({
  target: CUSTOMER_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/customers': '/' }
}));

app.use('/payments', createProxyMiddleware({
  target: PAYMENT_SERVICE,
  changeOrigin: true,
  pathRewrite: { '^/payments': '/payments' }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'API Gateway' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});