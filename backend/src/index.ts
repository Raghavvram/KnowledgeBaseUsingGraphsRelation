import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import researchRoutes from './routes/research';
import neo4jService from './services/neo4jService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ✅ ENHANCED CORS - Allow ALL common frontend ports
app.use(cors({
  origin: [
    'http://localhost:3000',    // React default
    'http://localhost:5173',    // Vite default  
    'http://localhost:8080',    // Your custom port
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

// ✅ REQUEST LOGGING - See all incoming requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🔍 ${timestamp} - ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'undefined'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'undefined'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body keys: ${Object.keys(req.body).join(', ')}`);
  }
  next();
});

// Increase payload limits for large paper datasets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ ENHANCED HEALTH CHECK
app.get('/health', (req, res) => {
  console.log('✅ Health check accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    payloadLimit: '50mb',
    corsOrigins: [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:8080'
    ]
  });
});

// ✅ API HEALTH CHECK (what your frontend actually calls)
app.get('/api/health', (req, res) => {
  console.log('✅ API Health check accessed');
  res.json({
    success: true,
    message: 'Knowledge Base Search Engine API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/search-papers',
      'POST /api/build-knowledge-graph', 
      'POST /api/generate-insights',
      'GET /api/database-stats'
    ]
  });
});

// Routes
app.use('/api', researchRoutes);

// Add explicit route for papers-with-full-content
app.get('/api/papers-with-full-content', async (req, res) => {
  const papersWithContent = await neo4jService.getPapersWithFullContent();
  
  res.json({
    success: true,
    message: `Found ${papersWithContent.length} papers with full content in database`,
    data: {
      papers: papersWithContent,
      count: papersWithContent.length,
      topic: 'all',
      totalContentSize: papersWithContent.reduce((sum, paper) => sum + (paper.originalSize || 0), 0)
    }
  });
});

app.get('/api/papers-with-full-content/:topic', async (req, res) => {
  const { topic } = req.params;
  const papersWithContent = await neo4jService.getPapersWithFullContent(topic);
  
  res.json({
    success: true,
    message: `Found ${papersWithContent.length} papers with full content in database`,
    data: {
      papers: papersWithContent,
      count: papersWithContent.length,
      topic: topic,
      totalContentSize: papersWithContent.reduce((sum, paper) => sum + (paper.originalSize || 0), 0)
    }
  });
});

// ✅ CATCH-ALL ERROR HANDLER
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Server Error:', err.message);
  console.error('   Stack:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ 404 HANDLER
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /health',
      'GET /api/health',
      'POST /api/search-papers',
      'POST /api/build-knowledge-graph',
      'POST /api/generate-insights'
    ]
  });
});

app.listen(PORT, () => {
  console.log('🚀========================================🚀');
  console.log(`🚀 Knowledge Base Search Engine Backend STARTED`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Health: http://localhost:${PORT}/health`);
  console.log(`🚀 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🚀 CORS: Multiple origins enabled`);
  console.log(`🚀 Payload: 50mb limit`);
  console.log(`🚀 Logging: All requests will be logged`);
  console.log('🚀========================================🚀');
});

export default app;
