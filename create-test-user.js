import bcrypt from 'bcrypt';

async function createTestUser() {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Test user credentials:');
  console.log('Email: test@example.com');
  console.log('Password: test123');
  console.log('Bcrypt hash:', hash);
  
  console.log('\nSQL to create user:');
  console.log(`INSERT INTO users (email, password, name) VALUES ('test@example.com', '${hash}', 'Test User');`);
}

createTestUser().catch(console.error);
