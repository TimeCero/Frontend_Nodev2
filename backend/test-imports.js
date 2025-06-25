// Test simple de importaciones
console.log('=== TESTING IMPORTS ===');

try {
  const express = require('express');
  console.log('✅ express loaded');
  
  const crypto = require('crypto');
  console.log('✅ crypto loaded');
  
  const passport = require('./config/passport');
  console.log('✅ passport config loaded');
  
  const supabase = require('./config/supabase');
  console.log('✅ supabase config loaded');
  
  const middleware = require('./middleware/supabaseAuthMiddleware');
  console.log('✅ supabaseAuthMiddleware loaded');
  
  console.log('\n🎉 ALL IMPORTS SUCCESSFUL');
  
} catch (error) {
  console.error('❌ IMPORT ERROR:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}