// Load environment variables first
require('dotenv').config();

const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('index-debug.log', message + '\n');
}

try {
  // Clear previous log
  if (fs.existsSync('index-debug.log')) {
    fs.unlinkSync('index-debug.log');
  }
  
  log('=== INDEX.JS IMPORTS TEST ===');
  
  log('1. Testing express...');
  const express = require('express');
  log('✅ express loaded');
  
  log('2. Testing session...');
  const session = require('express-session');
  log('✅ express-session loaded');
  
  log('3. Testing cors...');
  const cors = require('cors');
  log('✅ cors loaded');
  
  log('4. Testing passport config...');
  const { passport } = require('./config/passport');
  log('✅ passport config loaded');
  
  log('5. Testing supabase config...');
  const { supabase, isSupabaseConfigured } = require('./config/supabase');
  log('✅ supabase config loaded');
  
  log('6. Testing auth routes...');
  const authRoutes = require('./routes/auth');
  log('✅ auth routes loaded');
  
  log('7. Testing supabaseAuth routes...');
  const supabaseAuthRoutes = require('./routes/supabaseAuth');
  log('✅ supabaseAuth routes loaded');
  
  log('\n🎉 ALL INDEX.JS IMPORTS SUCCESSFUL!');
  
} catch (error) {
  log('❌ ERROR: ' + error.message);
  log('Stack: ' + error.stack);
  process.exit(1);
}