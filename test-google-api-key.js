#!/usr/bin/env node

/**
 * Test script to verify Google AI API key
 * Run with: node test-google-api-key.js
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.VITE_GOOGLE_AI_API_KEY;

async function testGoogleAI() {
  console.log('🧪 Testing Google AI API Key...\n');

  if (!API_KEY) {
    console.error('❌ VITE_GOOGLE_AI_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✅ API Key found:', API_KEY.substring(0, 10) + '...');
  console.log('🔗 Testing connection to Google AI...\n');

  try {
    // Initialize Google AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Test with a simple model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('📝 Testing simple text generation...');
    
    // Simple test prompt
    const result = await model.generateContent('Hello! Please respond with "API key is working correctly!"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is working!');
    console.log('🤖 AI Response:', text);
    console.log('\n🎉 Google AI integration is ready!');
    
    // Test Veo 3 specific capabilities
    console.log('\n🎬 Testing Veo 3 related features...');
    
    // Test with a video generation prompt
    const videoPrompt = `Create a detailed description for a video generation prompt about "A cinematic product showcase for wireless earbuds with smooth camera movements and modern aesthetics". 
    
    Please provide:
    1. A detailed visual description
    2. Camera movement suggestions
    3. Lighting recommendations
    4. Style and tone suggestions`;
    
    const videoResult = await model.generateContent(videoPrompt);
    const videoResponse = await videoResult.response;
    const videoText = videoResponse.text();
    
    console.log('✅ Video prompt optimization working!');
    console.log('📹 AI Video Suggestions:');
    console.log(videoText);
    
  } catch (error) {
    console.error('❌ Error testing Google AI API:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 This usually means:');
      console.log('   • API key is incorrect');
      console.log('   • API key doesn\'t have proper permissions');
      console.log('   • API key is expired');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      console.log('\n💡 This means:');
      console.log('   • API key is working but quota is exceeded');
      console.log('   • Check your Google AI Studio dashboard');
    } else if (error.message.includes('MODEL_NOT_FOUND')) {
      console.log('\n💡 This means:');
      console.log('   • API key is working but model access issue');
      console.log('   • Check your Google AI Studio permissions');
    }
    
    process.exit(1);
  }
}

// Run the test
testGoogleAI().catch(console.error);
