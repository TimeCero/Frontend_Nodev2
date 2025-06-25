process.stdout.write('Testing passport strategies...\n');
process.stdout.write('Starting tests...\n');
try {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  console.log('✅ GoogleStrategy loaded');
  
  const GitHubStrategy = require('passport-github2').Strategy;
  console.log('✅ GitHubStrategy loaded');
  
  console.log('All strategies loaded successfully');
} catch (error) {
  console.error('❌ Strategy error:', error.message);
  console.error('Stack:', error.stack);
}