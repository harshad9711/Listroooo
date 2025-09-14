import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Select, SelectItem, TextInput, Textarea, Badge } from '@tremor/react';
import { Plus, Trash2, Clock, Palette, Music, Camera, Type } from 'lucide-react';
import { VeoPromptJSON, Shot, AudioPlan, BrandSpec } from '../types';
import { PLATFORM_PRESETS, TEMPLATE_PRESETS, BRAND_TONE_OPTIONS, CAMERA_MOVEMENTS, COMPOSITION_TYPES, MUSIC_STYLES } from '../presets';

interface PromptFormProps {
  prompt: VeoPromptJSON;
  onPromptChange: (prompt: VeoPromptJSON) => void;
  onValidationChange: (isValid: boolean, errors: string[]) => void;
}

export default function PromptForm({ prompt, onPromptChange, onValidationChange }: PromptFormProps) {
  const [errors, setErrors] = useState<string[]>([]);

  // Validate prompt whenever it changes
  useEffect(() => {
    const validation = validatePrompt(prompt);
    setErrors(validation.errors);
    onValidationChange(validation.valid, validation.errors);
  }, [prompt, onValidationChange]);

  const validatePrompt = (p: VeoPromptJSON) => {
    const errors: string[] = [];
    
    if (!p.idea?.trim()) errors.push("Idea is required");
    if (!p.goal?.trim()) errors.push("Goal is required");
    if (p.durationSec > 8) errors.push("Duration cannot exceed 8 seconds");
    if (p.durationSec < 1) errors.push("Duration must be at least 1 second");
    
    // Validate shot plan
    if (p.shotPlan?.length) {
      let totalDuration = 0;
      for (const shot of p.shotPlan) {
        if (shot.tStart < 0 || shot.tEnd < 0) errors.push("Shot times cannot be negative");
        if (shot.tStart >= shot.tEnd) errors.push("Shot start time must be before end time");
        if (shot.tEnd > p.durationSec) errors.push("Shot end time cannot exceed total duration");
        totalDuration = Math.max(totalDuration, shot.tEnd);
      }
      if (totalDuration > p.durationSec) errors.push("Shot plan duration exceeds total duration");
    }
    
    return { valid: errors.length === 0, errors };
  };

  const updatePrompt = (updates: Partial<VeoPromptJSON>) => {
    onPromptChange({ ...prompt, ...updates });
  };

  const updateBrand = (updates: Partial<BrandSpec>) => {
    updatePrompt({ brand: { ...prompt.brand, ...updates } });
  };

  const updateAudio = (updates: Partial<AudioPlan>) => {
    updatePrompt({ audio: { ...prompt.audio, ...updates } });
  };

  const addShot = () => {
    const lastShot = prompt.shotPlan[prompt.shotPlan.length - 1];
    const newStart = lastShot ? lastShot.tEnd : 0;
    const newShot: Shot = {
      tStart: newStart,
      tEnd: Math.min(newStart + 2, prompt.durationSec),
      action: "",
      camera: "Static",
      composition: "Medium shot"
    };
    updatePrompt({ shotPlan: [...prompt.shotPlan, newShot] });
  };

  const updateShot = (index: number, updates: Partial<Shot>) => {
    const newShots = [...prompt.shotPlan];
    newShots[index] = { ...newShots[index], ...updates };
    updatePrompt({ shotPlan: newShots });
  };

  const removeShot = (index: number) => {
    const newShots = prompt.shotPlan.filter((_, i) => i !== index);
    updatePrompt({ shotPlan: newShots });
  };

  const loadTemplate = (templateKey: string) => {
    const template = TEMPLATE_PRESETS[templateKey as keyof typeof TEMPLATE_PRESETS];
    if (template) {
      updatePrompt({
        goal: template.template.goal,
        shotPlan: template.template.shotPlan,
        audio: template.template.audio
      });
    }
  };

  const handlePlatformChange = (platform: string) => {
    const preset = PLATFORM_PRESETS[platform as keyof typeof PLATFORM_PRESETS];
    if (preset) {
      updatePrompt({
        platform: platform as any,
        aspect: preset.aspect,
        resolution: preset.resolution
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="p-6">
        <Title className="flex items-center space-x-2 mb-4">
          <Type className="w-5 h-5" />
          <span>Basic Information</span>
        </Title>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="mb-2">Platform</Text>
            <Select
              value={prompt.platform}
              onValueChange={handlePlatformChange}
            >
              {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.name} ({preset.aspect}, {preset.resolution})
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <div>
            <Text className="mb-2">Duration (seconds)</Text>
            <TextInput
              type="number"
              min="1"
              max="8"
              value={prompt.durationSec.toString()}
              onChange={(e) => updatePrompt({ durationSec: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="mt-4">
          <Text className="mb-2">Idea *</Text>
          <Textarea
            placeholder="Describe your video idea..."
            value={prompt.idea}
            onChange={(e) => updatePrompt({ idea: e.target.value })}
            rows={3}
          />
        </div>

        <div className="mt-4">
          <Text className="mb-2">Goal *</Text>
          <TextInput
            placeholder="e.g., product awareness, UGC-style ad, brand awareness"
            value={prompt.goal}
            onChange={(e) => updatePrompt({ goal: e.target.value })}
          />
        </div>

        <div className="mt-4">
          <Text className="mb-2">Call to Action</Text>
          <TextInput
            placeholder="e.g., Shop now, Learn more, Download"
            value={prompt.cta || ""}
            onChange={(e) => updatePrompt({ cta: e.target.value })}
          />
        </div>
      </Card>

      {/* Brand Specification */}
      <Card className="p-6">
        <Title className="flex items-center space-x-2 mb-4">
          <Palette className="w-5 h-5" />
          <span>Brand Specification</span>
        </Title>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="mb-2">Brand Name</Text>
            <TextInput
              placeholder="Your brand name"
              value={prompt.brand.name || ""}
              onChange={(e) => updateBrand({ name: e.target.value })}
            />
          </div>
          
          <div>
            <Text className="mb-2">Brand Tone</Text>
            <Select
              value={prompt.brand.tone || ""}
              onValueChange={(value) => updateBrand({ tone: value })}
            >
              <SelectItem value="">Select tone...</SelectItem>
              {BRAND_TONE_OPTIONS.map(tone => (
                <SelectItem key={tone} value={tone}>{tone}</SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <Text className="mb-2">Brand Colors (hex codes)</Text>
          <TextInput
            placeholder="e.g., #FF6B6B, #4ECDC4, #45B7D1"
            value={prompt.brand.colors?.join(", ") || ""}
            onChange={(e) => updateBrand({ 
              colors: e.target.value.split(",").map(c => c.trim()).filter(Boolean) 
            })}
          />
        </div>

        <div className="mt-4">
          <Text className="mb-2">Brand Fonts</Text>
          <TextInput
            placeholder="e.g., Inter, Montserrat, Helvetica"
            value={prompt.brand.fonts?.join(", ") || ""}
            onChange={(e) => updateBrand({ 
              fonts: e.target.value.split(",").map(f => f.trim()).filter(Boolean) 
            })}
          />
        </div>
      </Card>

      {/* Shot Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Title className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Shot Plan</span>
          </Title>
          <div className="flex space-x-2">
            <Button
              onClick={() => loadTemplate("ugc_testimonial")}
              variant="light"
              size="sm"
            >
              UGC Template
            </Button>
            <Button
              onClick={() => loadTemplate("product_cinematic")}
              variant="light"
              size="sm"
            >
              Cinematic Template
            </Button>
            <Button
              onClick={addShot}
              variant="secondary"
              size="sm"
              icon={Plus}
            >
              Add Shot
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {prompt.shotPlan.map((shot, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Badge color="blue">
                  Shot {index + 1}: {shot.tStart}s - {shot.tEnd}s
                </Badge>
                <Button
                  onClick={() => removeShot(index)}
                  variant="light"
                  color="red"
                  size="sm"
                  icon={Trash2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Text className="mb-1">Action *</Text>
                  <TextInput
                    placeholder="What happens in this shot?"
                    value={shot.action}
                    onChange={(e) => updateShot(index, { action: e.target.value })}
                  />
                </div>
                
                <div>
                  <Text className="mb-1">Camera Movement</Text>
                  <Select
                    value={shot.camera || ""}
                    onValueChange={(value) => updateShot(index, { camera: value })}
                  >
                    <SelectItem value="">Select movement...</SelectItem>
                    {CAMERA_MOVEMENTS.map(movement => (
                      <SelectItem key={movement} value={movement}>{movement}</SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Text className="mb-1">Composition</Text>
                  <Select
                    value={shot.composition || ""}
                    onValueChange={(value) => updateShot(index, { composition: value })}
                  >
                    <SelectItem value="">Select composition...</SelectItem>
                    {COMPOSITION_TYPES.map(comp => (
                      <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div className="mt-3">
                <Text className="mb-1">Notes (optional)</Text>
                <TextInput
                  placeholder="Additional notes for this shot"
                  value={shot.notes || ""}
                  onChange={(e) => updateShot(index, { notes: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Audio Plan */}
      <Card className="p-6">
        <Title className="flex items-center space-x-2 mb-4">
          <Music className="w-5 h-5" />
          <span>Audio Plan</span>
        </Title>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="mb-2">Dialogue</Text>
            <TextInput
              placeholder="e.g., 'This product changed my life!'"
              value={prompt.audio.dialogue || ""}
              onChange={(e) => updateAudio({ dialogue: e.target.value })}
            />
          </div>
          
          <div>
            <Text className="mb-2">Voiceover</Text>
            <TextInput
              placeholder="e.g., 'Introducing the new...'"
              value={prompt.audio.voiceover || ""}
              onChange={(e) => updateAudio({ voiceover: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4">
          <Text className="mb-2">Music Style</Text>
          <Select
            value={prompt.audio.musicStyle || ""}
            onValueChange={(value) => updateAudio({ musicStyle: value })}
          >
            <SelectItem value="">Select music style...</SelectItem>
            {MUSIC_STYLES.map(style => (
              <SelectItem key={style} value={style}>{style}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="mt-4">
          <Text className="mb-2">Sound Effects</Text>
          <TextInput
            placeholder="e.g., whoosh, impact sound, engine roar"
            value={prompt.audio.sfx?.join(", ") || ""}
            onChange={(e) => updateAudio({ 
              sfx: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
            })}
          />
        </div>

        <div className="mt-4">
          <Text className="mb-2">Ambience</Text>
          <TextInput
            placeholder="e.g., city night, nature sounds, office"
            value={prompt.audio.ambience || ""}
            onChange={(e) => updateAudio({ ambience: e.target.value })}
          />
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="captions"
            checked={prompt.audio.captions || false}
            onChange={(e) => updateAudio({ captions: e.target.checked })}
            className="rounded"
          />
          <Text>Enable captions</Text>
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-6">
        <Title className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5" />
          <span>Advanced Settings</span>
        </Title>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Text className="mb-2">Negative Prompt</Text>
            <Textarea
              placeholder="What to avoid in the video..."
              value={prompt.negativePrompt || ""}
              onChange={(e) => updatePrompt({ negativePrompt: e.target.value })}
              rows={3}
            />
          </div>
          
          <div>
            <Text className="mb-2">Seed (for reproducible results)</Text>
            <TextInput
              type="number"
              value={(prompt.seed || 0).toString()}
              onChange={(e) => updatePrompt({ seed: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </Card>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <Title className="text-red-600 mb-2">Validation Errors</Title>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
