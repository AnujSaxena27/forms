import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb.js';

/**
 * ==========================================
 * TEST INSERT API ROUTE
 * ==========================================
 * 
 * PURPOSE: Verify that MongoDB Atlas database becomes visible
 * 
 * This route performs a SIMPLE, DIRECT MongoDB insert to demonstrate
 * that the database will be created in MongoDB Atlas.
 * 
 * USAGE:
 * 1. GET /api/test-insert
 *    - Performs a test insert into MongoDB
 *    - Returns success/error
 *    - Check MongoDB Atlas → formsDB.testInserts collection
 * 
 * 2. Check MongoDB Atlas dashboard:
 *    - Navigate to formsDB database
 *    - Look for testInserts collection
 *    - Should contain the inserted document
 * 
 * 3. After verification, DELETE this route
 * 
 * IMPORTANT:
 * - Do NOT commit this route to production
 * - Delete after verifying database creation
 * - This is for debugging ONLY
 */

export async function GET(request) {
  console.log('\n========================================');
  console.log('🧪 [TEST-INSERT API] GET /api/test-insert');
  console.log('⏰ Request time:', new Date().toISOString());
  console.log('========================================\n');

  try {
    // ==========================================
    // STEP 1: CONNECT TO MONGODB ATLAS
    // ==========================================
    console.log('🔌 [TEST-INSERT] Step 1: Connecting to MongoDB Atlas...');
    
    let mongooseInstance;
    try {
      mongooseInstance = await connectDB();
      console.log('✅ [TEST-INSERT] MongoDB connection established\n');
    } catch (dbError) {
      console.error('❌ [TEST-INSERT] MongoDB connection failed!');
      console.error('Error:', dbError.message);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }

    // ==========================================
    // STEP 2: LOG CONNECTION DETAILS
    // ==========================================
    console.log('📊 [TEST-INSERT] Connection Details:');
    console.log('   Connected Database Name:', mongooseInstance.connection.name);
    console.log('   Connected DB Instance:', mongooseInstance.connection.db.databaseName);
    console.log('   Host:', mongooseInstance.connection.host);
    console.log('   Protocol:', mongooseInstance.connection.client.topology?.description?.type || 'unknown');
    console.log('   Connection State:', mongooseInstance.connection.readyState, '(1=connected)\n');

    // ==========================================
    // STEP 3: GET DATABASE REFERENCE
    // ==========================================
    console.log('📚 [TEST-INSERT] Step 2: Getting database reference...');
    const db = mongooseInstance.connection.db;
    const dbName = db.databaseName;
    console.log('✅ [TEST-INSERT] Database name:', dbName, '\n');

    // ==========================================
    // STEP 4: INSERT TEST DOCUMENT
    // ==========================================
    console.log('📝 [TEST-INSERT] Step 3: Preparing test document...');
    
    const testDocument = {
      testType: 'mongodb-atlas-verification',
      timestamp: new Date().toISOString(),
      message: 'This document was inserted to verify MongoDB Atlas database creation',
      testRunAt: new Date(),
      source: 'GET /api/test-insert',
      environment: process.env.NODE_ENV,
    };

    console.log('Document to insert:', JSON.stringify(testDocument, null, 2), '\n');

    // ==========================================
    // STEP 5: EXECUTE INSERT OPERATION
    // ==========================================
    console.log('💾 [TEST-INSERT] Step 4: Executing insertOne() operation...');
    console.log('   Target Collection: testInserts');
    console.log('   Target Database: formsDB');
    console.log('   Operation: db.collection("testInserts").insertOne(document)');
    console.log('   ⭐⭐⭐ THIS LINE WILL CREATE THE DATABASE IF IT DOES NOT EXIST ⭐⭐⭐\n');

    // 🔴 THIS IS THE CRITICAL LINE THAT CREATES THE DATABASE IN MONGODB ATLAS
    const result = await db.collection('testInserts').insertOne(testDocument);

    console.log('✅ [TEST-INSERT] Insert operation completed successfully!');
    console.log('   Inserted ID:', result.insertedId);
    console.log('   Acknowledged:', result.acknowledged);
    console.log('   Inserted Count:', result.insertedCount, '\n');

    // ==========================================
    // STEP 6: VERIFY IN MONGODB
    // ==========================================
    console.log('🔍 [TEST-INSERT] Step 5: Verifying insert...');
    
    const insertedDoc = await db.collection('testInserts').findOne({ _id: result.insertedId });
    
    if (insertedDoc) {
      console.log('✅ [TEST-INSERT] Document verified in database!');
      console.log('   Found document:', JSON.stringify(insertedDoc, null, 2), '\n');
    } else {
      console.log('❌ [TEST-INSERT] Document not found after insert!');
    }

    // ==========================================
    // STEP 7: RETURN SUCCESS RESPONSE
    // ==========================================
    console.log('========================================');
    console.log('✅ [TEST-INSERT] TEST COMPLETED SUCCESSFULLY');
    console.log('========================================');
    console.log('📍 Next steps:');
    console.log('   1. Go to MongoDB Atlas dashboard');
    console.log('   2. Click on "formsDB" database');
    console.log('   3. Look for "testInserts" collection');
    console.log('   4. Verify the inserted document is there');
    console.log('   5. Delete /api/test-insert route after verification');
    console.log('========================================\n');

    return NextResponse.json(
      {
        success: true,
        message: 'Test insert completed successfully',
        insertedId: result.insertedId,
        database: {
          name: dbName,
          collection: 'testInserts',
          document: testDocument,
        },
        instructions: {
          step1: 'Go to MongoDB Atlas dashboard: https://cloud.mongodb.com',
          step2: 'Select your cluster and database "formsDB"',
          step3: 'Look for collection "testInserts"',
          step4: 'Verify inserted document with timestamp',
          step5: 'Delete /api/test-insert route after verification',
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ [TEST-INSERT] ERROR OCCURRED');
    console.error('========================================');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('========================================\n');

    return NextResponse.json(
      {
        success: false,
        error: 'Test insert failed',
        message: error.message,
        type: error.name,
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint also available for testing via curl/Postman
 */
export async function POST(request) {
  console.log('\n========================================');
  console.log('🧪 [TEST-INSERT API] POST /api/test-insert');
  console.log('⏰ Request time:', new Date().toISOString());
  console.log('========================================\n');

  // Same implementation as GET
  return GET(request);
}

/**
 * Handle unsupported methods
 */
export async function PUT() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET or POST.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use GET or POST.' },
    { status: 405 }
  );
}
