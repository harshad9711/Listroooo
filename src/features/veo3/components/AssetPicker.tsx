import React, { useState, useRef } from 'react';
import { Card, Title, Text, Button, Badge, Select, SelectItem } from '@tremor/react';
import { Upload, Image, FileText, Palette, Trash2 } from 'lucide-react';
import { BrandVisual } from '../types';

interface AssetPickerProps {
  assets: BrandVisual[];
  onAssetsChange: (assets: BrandVisual[]) => void;
  maxAssets?: number;
}

export default function AssetPicker({ assets, onAssetsChange, maxAssets = 5 }: AssetPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAssets: BrandVisual[] = [];
    
    Array.from(files).forEach((file, index) => {
      if (assets.length + newAssets.length >= maxAssets) return;
      
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const asset: BrandVisual = {
          id: `asset-${Date.now()}-${index}`,
          kind: file.type.includes('logo') ? 'logo' : 'product',
          url,
          mimeType: file.type,
          role: 'visual_reference'
        };
        newAssets.push(asset);
      }
    });

    onAssetsChange([...assets, ...newAssets]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAsset = (assetId: string) => {
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    onAssetsChange(updatedAssets);
  };

  const updateAsset = (assetId: string, updates: Partial<BrandVisual>) => {
    const updatedAssets = assets.map(asset => 
      asset.id === assetId ? { ...asset, ...updates } : asset
    );
    onAssetsChange(updatedAssets);
  };

  const getAssetIcon = (kind: string) => {
    switch (kind) {
      case 'logo': return <FileText className="w-4 h-4" />;
      case 'product': return <Image className="w-4 h-4" />;
      case 'photo': return <Image className="w-4 h-4" />;
      case 'brand_visual': return <Palette className="w-4 h-4" />;
      default: return <Image className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title>Brand Assets</Title>
          <Text>Upload logos, product photos, and brand visuals</Text>
        </div>
        <Badge color="blue">{assets.length}/{maxAssets}</Badge>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <Text className="text-lg font-medium mb-2">
          Drag & drop images here
        </Text>
        <Text className="text-gray-500 mb-4">
          or click to browse files
        </Text>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          size="sm"
        >
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Asset List */}
      {assets.length > 0 && (
        <div className="mt-6 space-y-3">
          <Text className="font-medium">Uploaded Assets</Text>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                  <img
                    src={asset.url}
                    alt={asset.kind}
                    className="w-10 h-10 object-cover rounded"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    {getAssetIcon(asset.kind)}
                    <Text className="font-medium capitalize">{asset.kind}</Text>
                  </div>
                  <Text className="text-sm text-gray-500">
                    {asset.mimeType?.split('/')[1]?.toUpperCase()}
                  </Text>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={asset.kind}
                  onValueChange={(value) => updateAsset(asset.id, { kind: value as any })}
                  className="w-32"
                >
                  <SelectItem value="logo">Logo</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="brand_visual">Brand Visual</SelectItem>
                </Select>
                
                <Button
                  onClick={() => removeAsset(asset.id)}
                  variant="light"
                  color="red"
                  size="sm"
                  icon={Trash2}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image-to-Video Note */}
      {assets.some(asset => asset.kind === 'product' || asset.kind === 'photo') && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-sm text-blue-700">
            💡 <strong>Image-to-Video:</strong> Product photos and images can be used as starting frames for video generation.
          </Text>
        </div>
      )}
    </Card>
  );
}
