import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildPromptString, generateIdeaHash } from '../lib/veo3Schema.js';

describe('Veo3 Schema Functions', () => {
  describe('buildPromptString', () => {
    it('should build a valid prompt string from input', () => {
      const prompt = {
        idea: 'Create a product showcase video',
        goal: 'Increase product awareness',
        brand: {
          tone: 'premium, modern',
          colors: ['#FF6B6B', '#4ECDC4'],
          name: 'TestBrand'
        },
        cta: 'Shop now',
        visualRefs: [
          { kind: 'product', url: 'https://example.com/product.jpg' }
        ],
        shotPlan: [
          { tStart: 0, tEnd: 2, action: 'Product reveal', camera: 'Dolly in', composition: 'Wide shot' },
          { tStart: 2, tEnd: 4, action: 'Product details', camera: 'Close-up', composition: 'Close-up' }
        ],
        audio: {
          musicStyle: 'cinematic',
          dialogue: 'This product is amazing!',
          captions: true
        }
      };

      const result = buildPromptString(prompt);
      
      expect(result).toContain('Create a product showcase video');
      expect(result).toContain('Goal: Increase product awareness');
      expect(result).toContain('Brand tone: premium, modern');
      expect(result).toContain('Color palette: #FF6B6B, #4ECDC4');
      expect(result).toContain('Brand: TestBrand');
      expect(result).toContain('CTA: Shop now');
      expect(result).toContain('Visual references: product');
      expect(result).toContain('[0-2s] Product reveal | camera: Dolly in | composition: Wide shot');
      expect(result).toContain('[2-4s] Product details | camera: Close-up | composition: Close-up');
      expect(result).toContain('Dialogue: "This product is amazing!"');
      expect(result).toContain('Music: cinematic');
      expect(result).toContain('Captions: enabled');
    });

    it('should handle minimal input', () => {
      const prompt = {
        idea: 'Simple video',
        goal: 'Basic goal',
        brand: {},
        visualRefs: [],
        shotPlan: [
          { tStart: 0, tEnd: 2, action: 'Basic shot' }
        ],
        audio: {}
      };

      const result = buildPromptString(prompt);
      
      expect(result).toContain('Simple video');
      expect(result).toContain('Goal: Basic goal');
      expect(result).toContain('Brand tone: premium, modern');
      expect(result).toContain('[0-2s] Basic shot');
    });
  });

  describe('generateIdeaHash', () => {
    it('should generate consistent hash for same input', () => {
      const prompt = {
        idea: 'Test idea',
        goal: 'Test goal',
        platform: 'tiktok',
        visualRefs: [
          { kind: 'product', url: 'https://example.com/image.jpg' }
        ]
      };

      const hash1 = generateIdeaHash(prompt);
      const hash2 = generateIdeaHash(prompt);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate different hashes for different inputs', () => {
      const prompt1 = {
        idea: 'Test idea 1',
        goal: 'Test goal',
        platform: 'tiktok',
        visualRefs: []
      };

      const prompt2 = {
        idea: 'Test idea 2',
        goal: 'Test goal',
        platform: 'tiktok',
        visualRefs: []
      };

      const hash1 = generateIdeaHash(prompt1);
      const hash2 = generateIdeaHash(prompt2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should be case sensitive', () => {
      const prompt1 = {
        idea: 'Test idea',
        goal: 'Test goal',
        platform: 'tiktok',
        visualRefs: []
      };

      const prompt2 = {
        idea: 'test idea',
        goal: 'Test goal',
        platform: 'tiktok',
        visualRefs: []
      };

      const hash1 = generateIdeaHash(prompt1);
      const hash2 = generateIdeaHash(prompt2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});
