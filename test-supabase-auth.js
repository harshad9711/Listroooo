// Test Supabase Authentication
// Run this in browser console to test Supabase connection

const SUPABASE_URL = 'https://fviddsgjpsjvawghdkxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2aWRkc2dqcHNqdmF3Z2hka3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODk1NDUsImV4cCI6MjA2ODU2NTU0NX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection successful!');
      return true;
    } else {
      console.error('❌ Supabase connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Test authentication
async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    const data = await response.json();
    console.log('Auth response:', data);
    
    if (response.ok) {
      console.log('✅ Authentication test successful!');
      return true;
    } else {
      console.error('❌ Authentication test failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication test error:', error);
    return false;
  }
}

// Run tests
console.log('🚀 Starting Supabase tests...');
testSupabaseConnection().then(() => {
  testAuth();
}); 