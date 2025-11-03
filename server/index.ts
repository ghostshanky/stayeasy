import express from 'express';
import cors from 'cors';
import upiPaymentRoutes from './upi-payment.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', upiPaymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'StayEasy API Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StayEasy API Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
