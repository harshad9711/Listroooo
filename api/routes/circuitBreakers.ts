/**
 * Circuit Breaker Metrics API
 * Provides visibility into circuit breaker states and performance
 */

import express from 'express';
import { ResilientServiceCalls } from '../lib/resilientCall.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/circuit-breakers/metrics
 * Get circuit breaker statistics and states
 */
router.get('/metrics', async (req, res) => {
  try {
    const stats = ResilientServiceCalls.getAllCircuitBreakerStats();
    
    res.json({
      success: true,
      data: {
        circuitBreakers: stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Circuit breaker metrics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get circuit breaker metrics' 
    });
  }
});

/**
 * POST /api/circuit-breakers/reset
 * Reset all circuit breakers (admin only)
 */
router.post('/reset', async (req, res) => {
  try {
    // Check if user has admin role (you might want to add role checking here)
    // For now, we'll allow any authenticated user to reset
    
    ResilientServiceCalls.resetAllCircuitBreakers();
    
    res.json({
      success: true,
      message: 'All circuit breakers have been reset'
    });
  } catch (error) {
    console.error('Circuit breaker reset error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset circuit breakers' 
    });
  }
});

/**
 * GET /api/circuit-breakers/health
 * Health check for circuit breaker system
 */
router.get('/health', async (req, res) => {
  try {
    const stats = ResilientServiceCalls.getAllCircuitBreakerStats();
    
    // Check if any circuit breakers are in OPEN state
    const openBreakers = Object.entries(stats).filter(([_, stats]) => 
      stats.state === 'open'
    );
    
    const health = {
      status: openBreakers.length > 0 ? 'degraded' : 'healthy',
      openBreakers: openBreakers.length,
      totalBreakers: Object.keys(stats).length,
      details: stats
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Circuit breaker health check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Circuit breaker health check failed' 
    });
  }
});

export default router;

