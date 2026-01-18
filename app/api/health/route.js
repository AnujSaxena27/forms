import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';

/**
 * ==========================================
 * API ROUTE: GET /api/health
 * ==========================================
 * Health check endpoint for MongoDB Atlas connectivity
 */

export async function GET(request) {
  console.log('\n========================================');
  console.log('🏥 [HEALTH CHECK] GET /api/health');
  console.log('⏰ Request time:', new Date().toISOString());
  console.log('========================================\n');

  const startTime = Date.now();
  let dbConnectionTime = 0;

  try {
    console.log('🔌 [Health] Checking MongoDB connection...');
    const dbStartTime = Date.now();

    try {
      await connectDB();
      dbConnectionTime = Date.now() - dbStartTime;
      console.log(`✅ [Health] MongoDB connected (${dbConnectionTime}ms latency)\n`);
    } catch (dbError) {
      console.error('❌ MongoDB Health Check Error:', {
        name: dbError.name,
        code: dbError.code,
        message: dbError.message,
      });

      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          message: 'Database connection failed',
          error: {
            type: dbError.name,
            message: dbError.message,
          },
          latency: {
            connection: Date.now() - dbStartTime,
            response: Date.now() - startTime,
          },
        },
        { status: 503 }
      );
    }

    const totalLatency = Date.now() - startTime;

    const healthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: '✅ All systems operational',
      mongodb: {
        connected: true,
        database: process.env.MONGO_URI?.split('/').pop()?.split('?')[0] || 'formsDB',
        connectionLatency: dbConnectionTime,
      },
      latency: {
        database: dbConnectionTime,
        total: totalLatency,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
      },
    };

    console.log('✅ [Health] Health check completed successfully\n');

    return NextResponse.json(healthResponse, { status: 200 });
  } catch (error) {
    console.error('❌ [Health] Unexpected error during health check:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: 'Health check failed',
        error: {
          type: error.name || 'Unknown',
          message: error.message,
        },
        latency: {
          response: Date.now() - startTime,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for triggering health check
 */
export async function POST(request) {
  console.log('\n========================================');
  console.log('🏥 [HEALTH CHECK] POST /api/health');
  console.log('⏰ Request time:', new Date().toISOString());
  console.log('========================================\n');

  try {
    await connectDB();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Health] POST request failed:', error.message);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
