/**
 * HLS Streaming Service
 * Handles adaptive streaming delivery with signed access
 */

import ffmpeg from 'fluent-ffmpeg';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs/promises';
import pino from 'pino';

const logger = pino({ name: 'hls-streaming' });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =========================
// TYPES
// =========================

export interface HLSVariant {
  height: number;
  width: number;
  bitrate: number;
  name: string;
}

export interface HLSResult {
  masterUrl: string;
  variants: HLSVariant[];
  sprites: {
    imageUrl: string;
    vttUrl: string;
  };
  expiresAt: string;
}

export interface SpriteThumbnail {
  imageUrl: string;
  vttUrl: string;
  width: number;
  height: number;
  columns: number;
  rows: number;
}

// =========================
// HLS GENERATION
// =========================

export async function generateHLS(
  jobId: string,
  orgId: string,
  inputVideoPath: string
): Promise<HLSResult> {
  try {
    logger.info({ jobId, orgId }, 'Starting HLS generation');

    // Parse HLS variants from environment
    const variants = parseHLSVariants();
    const segmentDuration = parseInt(process.env.HLS_SEGMENT_SEC || '2');
    
    // Create HLS directory structure
    const hlsBasePath = `renders_hls/${orgId}/${jobId}`;
    const masterPath = `${hlsBasePath}/master.m3u8`;
    
    // Generate master playlist
    const masterPlaylist = generateMasterPlaylist(variants, segmentDuration);
    
    // Upload master playlist
    const { error: masterError } = await supabase.storage
      .from('renders')
      .upload(masterPath, Buffer.from(masterPlaylist), {
        contentType: 'application/vnd.apple.mpegurl',
        upsert: true
      });

    if (masterError) {
      throw new Error(`Failed to upload master playlist: ${masterError.message}`);
    }

    // Generate variants
    const variantResults: HLSVariant[] = [];
    
    for (const variant of variants) {
      const variantResult = await generateVariant(
        jobId,
        orgId,
        inputVideoPath,
        variant,
        segmentDuration
      );
      variantResults.push(variantResult);
    }

    // Generate sprite thumbnails
    const sprites = await generateSpriteThumbnails(
      jobId,
      orgId,
      inputVideoPath
    );

    // Generate signed URLs
    const masterUrl = await generateSignedUrl(masterPath);
    const spriteImageUrl = await generateSignedUrl(sprites.imageUrl);
    const spriteVttUrl = await generateSignedUrl(sprites.vttUrl);

    const result: HLSResult = {
      masterUrl,
      variants: variantResults,
      sprites: {
        imageUrl: spriteImageUrl,
        vttUrl: spriteVttUrl
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    logger.info({ jobId, orgId, variants: variantResults.length }, 'HLS generation completed');

    return result;

  } catch (error) {
    logger.error({ jobId, orgId, error: error.message }, 'HLS generation failed');
    throw error;
  }
}

async function generateVariant(
  jobId: string,
  orgId: string,
  inputPath: string,
  variant: HLSVariant,
  segmentDuration: number
): Promise<HLSVariant> {
  return new Promise((resolve, reject) => {
    const variantPath = `renders_hls/${orgId}/${jobId}/v${variant.height}`;
    const playlistPath = `${variantPath}/index.m3u8`;
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`${variant.width}x${variant.height}`)
      .videoBitrate(variant.bitrate)
      .outputOptions([
        '-preset fast',
        '-profile:v main',
        '-level 3.1',
        '-f hls',
        `-hls_time ${segmentDuration}`,
        `-hls_list_size 0`,
        '-hls_segment_filename', `${variantPath}/segment_%03d.ts`,
        '-hls_flags delete_segments'
      ])
      .output(playlistPath)
      .on('end', async () => {
        try {
          // Upload playlist and segments
          await uploadVariantFiles(variantPath, playlistPath);
          resolve(variant);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        logger.error({ error: error.message, variant }, 'Variant generation failed');
        reject(error);
      })
      .run();
  });
}

async function uploadVariantFiles(variantPath: string, playlistPath: string): Promise<void> {
  try {
    // Read and upload playlist
    const playlistContent = await fs.readFile(playlistPath);
    await supabase.storage
      .from('renders')
      .upload(playlistPath, playlistContent, {
        contentType: 'application/vnd.apple.mpegurl',
        upsert: true
      });

    // Upload segments
    const segmentFiles = await fs.readdir(path.dirname(playlistPath));
    const tsFiles = segmentFiles.filter(file => file.endsWith('.ts'));

    for (const tsFile of tsFiles) {
      const segmentPath = `${variantPath}/${tsFile}`;
      const segmentContent = await fs.readFile(path.join(path.dirname(playlistPath), tsFile));
      
      await supabase.storage
        .from('renders')
        .upload(segmentPath, segmentContent, {
          contentType: 'video/mp2t',
          upsert: true
        });
    }

  } catch (error) {
    logger.error({ error: error.message, variantPath }, 'Failed to upload variant files');
    throw error;
  }
}

// =========================
// SPRITE THUMBNAILS
// =========================

async function generateSpriteThumbnails(
  jobId: string,
  orgId: string,
  inputPath: string
): Promise<SpriteThumbnail> {
  try {
    const spritePath = `renders_hls/${orgId}/${jobId}/sprites`;
    const imagePath = `${spritePath}/thumbnails.jpg`;
    const vttPath = `${spritePath}/thumbnails.vtt`;

    // Generate sprite sheet (10x10 grid)
    const columns = 10;
    const rows = 10;
    const thumbnailWidth = 160;
    const thumbnailHeight = 90;
    const spriteWidth = thumbnailWidth * columns;
    const spriteHeight = thumbnailHeight * rows;

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: generateThumbnailTimestamps(columns * rows),
          filename: 'thumb_%03d.jpg',
          folder: '/tmp',
          size: `${thumbnailWidth}x${thumbnailHeight}`
        })
        .on('end', async () => {
          try {
            // Create sprite sheet
            const spriteSheet = await createSpriteSheet('/tmp', columns, rows, thumbnailWidth, thumbnailHeight);
            
            // Generate VTT file
            const vttContent = generateVTTFile(columns, rows, thumbnailWidth, thumbnailHeight, 8); // 8 second video

            // Upload files
            await supabase.storage
              .from('renders')
              .upload(imagePath, spriteSheet, {
                contentType: 'image/jpeg',
                upsert: true
              });

            await supabase.storage
              .from('renders')
              .upload(vttPath, Buffer.from(vttContent), {
                contentType: 'text/vtt',
                upsert: true
              });

            resolve({
              imageUrl: imagePath,
              vttUrl: vttPath,
              width: spriteWidth,
              height: spriteHeight,
              columns,
              rows
            });

          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        })
        .run();
    });

  } catch (error) {
    logger.error({ error: error.message, jobId }, 'Sprite thumbnail generation failed');
    throw error;
  }
}

function generateThumbnailTimestamps(count: number): string[] {
  const timestamps: string[] = [];
  for (let i = 0; i < count; i++) {
    const time = (i / count) * 8; // 8 second video
    timestamps.push(`${time.toFixed(1)}s`);
  }
  return timestamps;
}

async function createSpriteSheet(
  tempDir: string,
  columns: number,
  rows: number,
  thumbWidth: number,
  thumbHeight: number
): Promise<Buffer> {
  // This would use sharp to create the sprite sheet
  // For now, return a placeholder
  return Buffer.from('sprite-placeholder');
}

function generateVTTFile(
  columns: number,
  rows: number,
  thumbWidth: number,
  thumbHeight: number,
  videoDuration: number
): string {
  let vtt = 'WEBVTT\n\n';
  
  const totalThumbs = columns * rows;
  const timePerThumb = videoDuration / totalThumbs;
  
  for (let i = 0; i < totalThumbs; i++) {
    const startTime = i * timePerThumb;
    const endTime = (i + 1) * timePerThumb;
    const row = Math.floor(i / columns);
    const col = i % columns;
    
    const x = col * thumbWidth;
    const y = row * thumbHeight;
    
    vtt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    vtt += `thumbnails.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}\n\n`;
  }
  
  return vtt;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// =========================
// SIGNED URLS
// =========================

export async function generateSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('renders')
    .createSignedUrl(filePath, 24 * 60 * 60); // 24 hours

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export function generateStreamToken(jobId: string, expiresIn: number = 3600): string {
  return jwt.sign(
    { 
      sub: jobId,
      type: 'stream_access'
    },
    process.env.SIGNING_SECRET!,
    { expiresIn }
  );
}

export function verifyStreamToken(token: string): { jobId: string; valid: boolean } {
  try {
    const decoded = jwt.verify(token, process.env.SIGNING_SECRET!) as any;
    return {
      jobId: decoded.sub,
      valid: decoded.type === 'stream_access'
    };
  } catch (error) {
    return {
      jobId: '',
      valid: false
    };
  }
}

// =========================
// HELPER FUNCTIONS
// =========================

function parseHLSVariants(): HLSVariant[] {
  const variantsString = process.env.HLS_VARIANTS || '426x240,640x360,854x480';
  const variantStrings = variantsString.split(',');
  
  return variantStrings.map((variant, index) => {
    const [width, height] = variant.split('x').map(Number);
    const bitrate = calculateBitrate(width, height);
    
    return {
      width,
      height,
      bitrate,
      name: `v${height}`
    };
  });
}

function calculateBitrate(width: number, height: number): number {
  // Rough bitrate calculation based on resolution
  const pixels = width * height;
  if (pixels <= 102400) return 500; // 240p
  if (pixels <= 230400) return 1000; // 360p
  if (pixels <= 409920) return 2000; // 480p
  return 3000; // Higher resolutions
}

function generateMasterPlaylist(variants: HLSVariant[], segmentDuration: number): string {
  let playlist = '#EXTM3U\n';
  playlist += '#EXT-X-VERSION:3\n';
  playlist += `#EXT-X-TARGETDURATION:${segmentDuration}\n\n`;

  for (const variant of variants) {
    playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate * 1000},RESOLUTION=${variant.width}x${variant.height}\n`;
    playlist += `v${variant.height}/index.m3u8\n`;
  }

  return playlist;
}

