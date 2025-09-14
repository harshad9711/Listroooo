/**
 * E2E Tests for Production Features
 * Complete user workflows from compose to playback
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('Production Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Set auth token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('testToken', 'test-token');
    });

    // Mock API responses
    await page.route('**/api/veo3/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: 'test-job-id',
          status: 'queued'
        })
      });
    });

    await page.route('**/api/veo3/jobs/test-job-id', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-job-id',
            status: 'done',
            progress: 100,
            model_used: 'veo-3.0-generate-001',
            quality_score: 0.85,
            quality_detail: {
              visual: 0.9,
              audio: 0.8,
              coherence: 0.85,
              sharpness: 0.9,
              brightness: 0.8,
              freezeFrames: 0,
              blackFrames: 0,
              loudness: 0.8,
              clipping: false,
              shotClarity: 0.85,
              ctaPresence: 0.9,
              brandColors: 0.8
            },
            hls_master_url: 'https://example.com/master.m3u8',
            sprites_image_url: 'https://example.com/sprites.jpg',
            sprites_vtt_url: 'https://example.com/sprites.vtt',
            output_url: 'https://example.com/video.mp4',
            thumbnail_url: 'https://example.com/thumbnail.jpg',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        })
      });
    });
  });

  test('Complete video generation with HLS and quality analysis', async ({ page }) => {
    // Navigate to studio
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="prompt-builder"]');
    
    // Fill in prompt
    await page.fill('[data-testid="idea-input"]', 'A beautiful sunset over mountains');
    await page.selectOption('[data-testid="platform-select"]', 'tiktok');
    await page.fill('[data-testid="goal-input"]', 'brand awareness');
    await page.selectOption('[data-testid="quality-mode-select"]', 'balanced');
    
    // Submit generation
    await page.click('[data-testid="generate-button"]');
    
    // Wait for job to be created
    await page.waitForSelector('[data-testid="job-status"]');
    
    // Check job status
    const jobStatus = await page.textContent('[data-testid="job-status"]');
    expect(jobStatus).toContain('queued');
    
    // Wait for completion (with timeout)
    await page.waitForSelector('[data-testid="job-completed"]', { timeout: 60000 });
    
    // Check model used
    const modelUsed = page.locator('[data-testid="model-used"]');
    await expect(modelUsed).toBeVisible();
    await expect(modelUsed).toContainText('veo-3.0-generate-001');
    
    // Check quality score
    const qualityScore = page.locator('[data-testid="quality-score"]');
    await expect(qualityScore).toBeVisible();
    await expect(qualityScore).toContainText('85%');
    
    // Check quality badge
    const qualityBadge = page.locator('[data-testid="quality-badge"]');
    await expect(qualityBadge).toBeVisible();
    await expect(qualityBadge).toContainText('Excellent');
    
    // Check HLS availability
    const hlsBadge = page.locator('[data-testid="hls-badge"]');
    await expect(hlsBadge).toBeVisible();
    await expect(hlsBadge).toContainText('Available');
    
    // Check HLS player
    const hlsPlayer = page.locator('[data-testid="hls-player"]');
    await expect(hlsPlayer).toBeVisible();
    
    // Check sprite thumbnails
    const spriteBadge = page.locator('[data-testid="sprite-badge"]');
    await expect(spriteBadge).toBeVisible();
    await expect(spriteBadge).toContainText('Thumbnails');
  });

  test('HLS player functionality', async ({ page }) => {
    // Navigate to completed job
    await page.goto(`${BASE_URL}/studio/veo3/jobs/test-job-id`);
    
    // Wait for HLS player to load
    await page.waitForSelector('[data-testid="hls-player"]');
    
    // Check play button
    const playButton = page.locator('[data-testid="play-button"]');
    await expect(playButton).toBeVisible();
    
    // Click play
    await playButton.click();
    
    // Check that video is playing
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    // Check volume controls
    const volumeButton = page.locator('[data-testid="volume-button"]');
    await expect(volumeButton).toBeVisible();
    
    // Check fullscreen button
    const fullscreenButton = page.locator('[data-testid="fullscreen-button"]');
    await expect(fullscreenButton).toBeVisible();
    
    // Check progress bar
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    // Check time display
    const timeDisplay = page.locator('[data-testid="time-display"]');
    await expect(timeDisplay).toBeVisible();
  });

  test('Quality analysis details', async ({ page }) => {
    // Navigate to completed job
    await page.goto(`${BASE_URL}/studio/veo3/jobs/test-job-id`);
    
    // Wait for quality section
    await page.waitForSelector('[data-testid="quality-section"]');
    
    // Click show details
    const showDetailsButton = page.locator('[data-testid="show-quality-details"]');
    await showDetailsButton.click();
    
    // Check detailed metrics
    const visualScore = page.locator('[data-testid="visual-score"]');
    await expect(visualScore).toBeVisible();
    await expect(visualScore).toContainText('90%');
    
    const audioScore = page.locator('[data-testid="audio-score"]');
    await expect(audioScore).toBeVisible();
    await expect(audioScore).toContainText('80%');
    
    const coherenceScore = page.locator('[data-testid="coherence-score"]');
    await expect(coherenceScore).toBeVisible();
    await expect(coherenceScore).toContainText('85%');
    
    const sharpnessScore = page.locator('[data-testid="sharpness-score"]');
    await expect(sharpnessScore).toBeVisible();
    await expect(sharpnessScore).toContainText('90%');
  });

  test('Governance settings - data export', async ({ page }) => {
    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Go to governance section
    await page.click('[data-testid="governance-tab"]');
    
    // Wait for governance settings
    await page.waitForSelector('[data-testid="governance-settings"]');
    
    // Click export my data
    await page.click('[data-testid="export-my-data-button"]');
    
    // Confirm export
    await page.click('[data-testid="confirm-export-button"]');
    
    // Check success message
    const successMessage = page.locator('[data-testid="export-success"]');
    await expect(successMessage).toBeVisible();
    
    // Check export token
    const exportToken = page.locator('[data-testid="export-token"]');
    await expect(exportToken).toBeVisible();
  });

  test('Governance settings - data deletion', async ({ page }) => {
    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Go to governance section
    await page.click('[data-testid="governance-tab"]');
    
    // Wait for governance settings
    await page.waitForSelector('[data-testid="governance-settings"]');
    
    // Click delete my data
    await page.click('[data-testid="delete-my-data-button"]');
    
    // Confirm deletion (first confirmation)
    await page.click('[data-testid="confirm-deletion-button"]');
    
    // Final confirmation
    await page.click('[data-testid="final-confirm-deletion-button"]');
    
    // Check success message
    const successMessage = page.locator('[data-testid="deletion-success"]');
    await expect(successMessage).toBeVisible();
  });

  test('Admin queue management', async ({ page }) => {
    // Navigate to admin panel
    await page.goto(`${BASE_URL}/admin`);
    
    // Go to queues section
    await page.click('[data-testid="queues-tab"]');
    
    // Wait for queue management
    await page.waitForSelector('[data-testid="queue-management"]');
    
    // Check system health
    const systemHealth = page.locator('[data-testid="system-health"]');
    await expect(systemHealth).toBeVisible();
    
    // Check queue statistics
    const queueStats = page.locator('[data-testid="queue-stats"]');
    await expect(queueStats).toBeVisible();
    
    // Test pause queue
    const pauseButton = page.locator('[data-testid="pause-queue-veo:start"]');
    await pauseButton.click();
    
    // Check success message
    const pauseSuccess = page.locator('[data-testid="pause-success"]');
    await expect(pauseSuccess).toBeVisible();
    
    // Test resume queue
    const resumeButton = page.locator('[data-testid="resume-queue-veo:start"]');
    await resumeButton.click();
    
    // Check success message
    const resumeSuccess = page.locator('[data-testid="resume-success"]');
    await expect(resumeSuccess).toBeVisible();
  });

  test('DLQ management', async ({ page }) => {
    // Navigate to admin panel
    await page.goto(`${BASE_URL}/admin`);
    
    // Go to queues section
    await page.click('[data-testid="queues-tab"]');
    
    // Wait for queue management
    await page.waitForSelector('[data-testid="queue-management"]');
    
    // Click on DLQ jobs
    await page.click('[data-testid="view-dlq-veo:start"]');
    
    // Wait for DLQ jobs
    await page.waitForSelector('[data-testid="dlq-jobs"]');
    
    // Test replay from DLQ
    const replayButton = page.locator('[data-testid="replay-dlq-button"]');
    await replayButton.click();
    
    // Check success message
    const replaySuccess = page.locator('[data-testid="replay-success"]');
    await expect(replaySuccess).toBeVisible();
  });

  test('Error handling and fallbacks', async ({ page }) => {
    // Test with invalid input
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Submit empty form
    await page.click('[data-testid="generate-button"]');
    
    // Check for validation error
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    // Test with very long input
    const longInput = 'A'.repeat(1001);
    await page.fill('[data-testid="idea-input"]', longInput);
    await page.click('[data-testid="generate-button"]');
    
    // Check for length validation
    const lengthError = page.locator('[data-testid="length-error"]');
    await expect(lengthError).toBeVisible();
  });

  test('Accessibility features', async ({ page }) => {
    // Test keyboard navigation
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test ARIA labels
    const ideaInput = page.locator('[data-testid="idea-input"]');
    const ariaLabel = await ideaInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    
    // Test screen reader support
    const generateButton = page.locator('[data-testid="generate-button"]');
    const buttonText = await generateButton.textContent();
    expect(buttonText).toBeTruthy();
    
    // Test HLS player accessibility
    await page.goto(`${BASE_URL}/studio/veo3/jobs/test-job-id`);
    
    const hlsPlayer = page.locator('[data-testid="hls-player"]');
    await expect(hlsPlayer).toBeVisible();
    
    // Check for ARIA labels on video controls
    const playButton = page.locator('[data-testid="play-button"]');
    const playAriaLabel = await playButton.getAttribute('aria-label');
    expect(playAriaLabel).toBeTruthy();
  });

  test('Performance and load testing', async ({ page }) => {
    // Test multiple concurrent requests
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        page.goto(`${BASE_URL}/studio/veo3`)
      );
    }
    
    await Promise.all(promises);
    
    // Test HLS player performance
    await page.goto(`${BASE_URL}/studio/veo3/jobs/test-job-id`);
    
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="hls-player"]');
    const loadTime = Date.now() - startTime;
    
    // HLS player should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to studio
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Check that form is responsive
    const form = page.locator('[data-testid="prompt-builder"]');
    await expect(form).toBeVisible();
    
    // Check HLS player on mobile
    await page.goto(`${BASE_URL}/studio/veo3/jobs/test-job-id`);
    
    const hlsPlayer = page.locator('[data-testid="hls-player"]');
    await expect(hlsPlayer).toBeVisible();
    
    // Check that controls are touch-friendly
    const playButton = page.locator('[data-testid="play-button"]');
    const buttonBox = await playButton.boundingBox();
    expect(buttonBox?.width).toBeGreaterThan(44); // Minimum touch target size
  });
});

