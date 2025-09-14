/**
 * E2E Tests using Playwright
 * Tests complete user workflows
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('Veo 3 E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Set auth token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('testToken', 'test-token');
    });
  });

  test('Complete video generation workflow', async ({ page }) => {
    // Navigate to studio
    await page.goto(`${BASE_URL}/studio/veo3`);
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="prompt-builder"]');
    
    // Fill in prompt
    await page.fill('[data-testid="idea-input"]', 'A beautiful sunset over mountains');
    await page.selectOption('[data-testid="platform-select"]', 'tiktok');
    await page.fill('[data-testid="goal-input"]', 'brand awareness');
    
    // Submit generation
    await page.click('[data-testid="generate-button"]');
    
    // Wait for job to be created
    await page.waitForSelector('[data-testid="job-status"]');
    
    // Check job status
    const jobStatus = await page.textContent('[data-testid="job-status"]');
    expect(jobStatus).toContain('queued');
    
    // Wait for completion (with timeout)
    await page.waitForSelector('[data-testid="job-completed"]', { timeout: 60000 });
    
    // Check that assets are available
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
    
    // Check HLS availability
    const hlsButton = page.locator('[data-testid="hls-button"]');
    await expect(hlsButton).toBeVisible();
  });

  test('Product composition workflow', async ({ page }) => {
    // Navigate to catalog tab
    await page.goto(`${BASE_URL}/studio/veo3`);
    await page.click('[data-testid="catalog-tab"]');
    
    // Wait for stores to load
    await page.waitForSelector('[data-testid="store-select"]');
    
    // Select store
    await page.selectOption('[data-testid="store-select"]', 'store-1');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-select"]');
    
    // Select product
    await page.selectOption('[data-testid="product-select"]', 'product-1');
    
    // Compose from product
    await page.click('[data-testid="compose-button"]');
    
    // Wait for composition to complete
    await page.waitForSelector('[data-testid="composition-complete"]');
    
    // Check that prompt is filled
    const promptText = await page.textContent('[data-testid="prompt-preview"]');
    expect(promptText).toContain('product');
  });

  test('Attribution tracking workflow', async ({ page }) => {
    // Navigate to attribution tab
    await page.goto(`${BASE_URL}/studio/veo3`);
    await page.click('[data-testid="attribution-tab"]');
    
    // Wait for metrics to load
    await page.waitForSelector('[data-testid="metrics-table"]');
    
    // Check that metrics are displayed
    const metricsTable = page.locator('[data-testid="metrics-table"]');
    await expect(metricsTable).toBeVisible();
    
    // Check for tracked links
    const trackedLinks = page.locator('[data-testid="tracked-link"]');
    const linkCount = await trackedLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('Quality scoring workflow', async ({ page }) => {
    // Generate a video first
    await page.goto(`${BASE_URL}/studio/veo3`);
    await page.fill('[data-testid="idea-input"]', 'Test video for quality scoring');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for completion
    await page.waitForSelector('[data-testid="job-completed"]', { timeout: 60000 });
    
    // Check quality score
    const qualityScore = page.locator('[data-testid="quality-score"]');
    await expect(qualityScore).toBeVisible();
    
    const score = await qualityScore.textContent();
    expect(parseFloat(score)).toBeGreaterThan(0);
    expect(parseFloat(score)).toBeLessThanOrEqual(1);
  });

  test('HLS streaming workflow', async ({ page }) => {
    // Generate a video
    await page.goto(`${BASE_URL}/studio/veo3`);
    await page.fill('[data-testid="idea-input"]', 'Test video for HLS streaming');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for completion
    await page.waitForSelector('[data-testid="job-completed"]', { timeout: 60000 });
    
    // Generate HLS
    await page.click('[data-testid="generate-hls-button"]');
    
    // Wait for HLS generation
    await page.waitForSelector('[data-testid="hls-generated"]');
    
    // Check HLS URL
    const hlsUrl = page.locator('[data-testid="hls-url"]');
    await expect(hlsUrl).toBeVisible();
    
    const url = await hlsUrl.textContent();
    expect(url).toContain('/stream/veo/');
    expect(url).toContain('master.m3u8');
  });

  test('GDPR export workflow', async ({ page }) => {
    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Go to data section
    await page.click('[data-testid="data-section"]');
    
    // Request export
    await page.click('[data-testid="request-export-button"]');
    
    // Fill export form
    await page.selectOption('[data-testid="export-scope"]', 'user');
    await page.check('[data-testid="export-confirm"]');
    
    // Submit export request
    await page.click('[data-testid="submit-export-button"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="export-requested"]');
    
    // Check export token
    const exportToken = page.locator('[data-testid="export-token"]');
    await expect(exportToken).toBeVisible();
  });

  test('Error handling', async ({ page }) => {
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

  test('Accessibility', async ({ page }) => {
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
  });
});

