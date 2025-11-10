import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import upiPaymentRoutes from './upi-payment.js';
import { PropertiesController } from './controllers/propertiesController.js';
import messagesRoutes from './controllers/messagesController.js';
import imageRoutes from './controllers/imageController.js';
import mockAuthRoutes from './routes/mockAuth.js';
import mockUserProfileRoutes from './routes/mockUserProfile.js';
import { supabaseServer } from './lib/supabaseServer.js';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '***KEY LOADED***' : '***KEY NOT LOADED***');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock auth routes (for development)
app.use('/api/auth', mockAuthRoutes);
app.use('/api/auth', mockUserProfileRoutes);

// Create properties router
const propertiesRouter = express.Router();
propertiesRouter.get('/', PropertiesController.getProperties);
propertiesRouter.post('/', PropertiesController.createProperty);
propertiesRouter.put('/:id', PropertiesController.updateProperty);
propertiesRouter.delete('/:id', PropertiesController.deleteProperty);
propertiesRouter.get('/owner', PropertiesController.getOwnerProperties);
propertiesRouter.get('/:id', PropertiesController.getPropertyDetails);

// Routes
app.use('/', upiPaymentRoutes);
app.use('/api/properties', propertiesRouter);
app.use('/api/messages', messagesRoutes);
app.use('/api/images', imageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'StayEasy API Server is running' });
});

// Test Supabase connection
app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabaseServer.from('properties').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase connection failed (expected for mock auth):', error.message);
      res.json({ success: false, message: 'Supabase connection failed - using mock auth only', error: error.message });
    } else {
      res.json({ success: true, message: 'Supabase connection successful', count: data });
    }
  } catch (error: any) {
    console.error('Supabase test error:', error);
    res.json({ success: false, message: 'Supabase connection failed - using mock auth only', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StayEasy API Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Mock auth endpoints available at http://localhost:${PORT}/api/auth`);
});
