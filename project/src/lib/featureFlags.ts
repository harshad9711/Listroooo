// Simple feature flag implementation
// In production, you'd want to use a proper feature flag service

const FEATURE_FLAGS = {
  'ugc.social-listening': true,
  'ugc.auto-editing': true,
  'ugc.voiceover-generator': true,
  'ugc.overlay-generator': true,
  'ugc.inbox': true,
  'ugc.dashboard': true
};

export async function isFeatureEnabled(flag: string): Promise<boolean> {
  // Simulate async feature flag check
  await new Promise(resolve => setTimeout(resolve, 100));
  return FEATURE_FLAGS[flag as keyof typeof FEATURE_FLAGS] || false;
}

export function setFeatureFlag(flag: string, enabled: boolean) {
  (FEATURE_FLAGS as any)[flag] = enabled;
} 