#!/usr/bin/env node

/**
 * Database Debug Script
 * Run this to debug database connection and user issues
 */

import { ProfileService } from './lib/profileService.js';

async function debugDatabase() {
  console.log('🔧 Database Debug Script Started');
  
  // Test with a sample user ID
  const testUserId = 'test-user-id-123';
  
  try {
    console.log('🔍 Running database debug for test user...');
    await ProfileService.debugDatabaseState(testUserId);
    
    console.log('✅ Database debug completed');
  } catch (error) {
    console.error('❌ Error running database debug:', error);
  }
  
  console.log('🔧 Database Debug Script Completed');
}

// Run the debug
debugDatabase().catch(console.error);
