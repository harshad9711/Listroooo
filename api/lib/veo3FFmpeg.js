import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'
);

/**
 * Generate thumbnail from video using FFmpeg
 */
export async function generateThumbnail(videoUrl, options = {}) {
  try {
    const {
      timestamp = '00:00:02', // Default to 2 seconds
      width = 320,
      height = 568, // 9:16 aspect ratio
      quality = 80
    } = options;

    // Create temporary file paths
    const tempDir = '/tmp/veo3-thumbnails';
    const thumbnailId = uuidv4();
    const thumbnailPath = path.join(tempDir, `${thumbnailId}.jpg`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download video to temporary location
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const tempVideoPath = path.join(tempDir, `${thumbnailId}.mp4`);
    fs.writeFileSync(tempVideoPath, Buffer.from(videoBuffer));

    // Generate thumbnail using FFmpeg
    const ffmpegCommand = [
      'ffmpeg',
      '-i', tempVideoPath,
      '-ss', timestamp,
      '-vframes', '1',
      '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
      '-q:v', quality.toString(),
      '-y', // Overwrite output file
      thumbnailPath
    ].join(' ');

    await execAsync(ffmpegCommand);

    // Upload thumbnail to Supabase storage
    const thumbnailBuffer = fs.readFileSync(thumbnailPath);
    const fileName = `thumbnails/${thumbnailId}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('renders')
      .upload(fileName, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload thumbnail: ${error.message}`);
    }

    // Generate signed URL
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Cleanup temporary files
    try {
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(thumbnailPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError);
    }

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
      publicUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/renders/${fileName}`
    };

  } catch (error) {
    console.error('Generate thumbnail error:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Generate captions (SRT file) from video
 */
export async function generateCaptions(videoUrl, captionsData) {
  try {
    const {
      dialogue,
      voiceover,
      timestamps = [],
      style = 'modern'
    } = captionsData;

    if (!dialogue && !voiceover) {
      throw new Error('Dialogue or voiceover is required for captions');
    }

    // Create temporary file paths
    const tempDir = '/tmp/veo3-captions';
    const captionId = uuidv4();
    const srtPath = path.join(tempDir, `${captionId}.srt`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate SRT content
    const srtContent = generateSRTContent({
      dialogue,
      voiceover,
      timestamps,
      style
    });

    // Write SRT file
    fs.writeFileSync(srtPath, srtContent);

    // Upload SRT to Supabase storage
    const srtBuffer = fs.readFileSync(srtPath);
    const fileName = `captions/${captionId}.srt`;
    
    const { data, error } = await supabase.storage
      .from('renders')
      .upload(fileName, srtBuffer, {
        contentType: 'text/plain',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload captions: ${error.message}`);
    }

    // Generate signed URL
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Cleanup temporary file
    try {
      fs.unlinkSync(srtPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
      publicUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/renders/${fileName}`
    };

  } catch (error) {
    console.error('Generate captions error:', error);
    throw new Error(`Failed to generate captions: ${error.message}`);
  }
}

/**
 * Burn captions into video using FFmpeg
 */
export async function burnCaptionsIntoVideo(videoUrl, captionsData, options = {}) {
  try {
    const {
      fontFamily = 'Arial',
      fontSize = 24,
      fontColor = 'white',
      backgroundColor = 'black',
      backgroundOpacity = 0.7,
      position = 'bottom'
    } = options;

    // Create temporary file paths
    const tempDir = '/tmp/veo3-burn-captions';
    const burnId = uuidv4();
    const srtPath = path.join(tempDir, `${burnId}.srt`);
    const outputPath = path.join(tempDir, `${burnId}_burned.mp4`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const tempVideoPath = path.join(tempDir, `${burnId}.mp4`);
    fs.writeFileSync(tempVideoPath, Buffer.from(videoBuffer));

    // Generate SRT content
    const srtContent = generateSRTContent(captionsData);
    fs.writeFileSync(srtPath, srtContent);

    // Build FFmpeg command for burning captions
    const subtitleFilter = `subtitles=${srtPath}:force_style='FontName=${fontFamily},FontSize=${fontSize},PrimaryColour=&H${fontColor},BackColour=&H${backgroundColor},OutlineColour=&H000000,Outline=2,Shadow=1'`;
    
    const ffmpegCommand = [
      'ffmpeg',
      '-i', tempVideoPath,
      '-vf', subtitleFilter,
      '-c:a', 'copy', // Copy audio without re-encoding
      '-y', // Overwrite output file
      outputPath
    ].join(' ');

    await execAsync(ffmpegCommand);

    // Upload burned video to Supabase storage
    const burnedVideoBuffer = fs.readFileSync(outputPath);
    const fileName = `renders/${burnId}_burned.mp4`;
    
    const { data, error } = await supabase.storage
      .from('renders')
      .upload(fileName, burnedVideoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload burned video: ${error.message}`);
    }

    // Generate signed URL
    const { data: signedUrlData } = supabase.storage
      .from('renders')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    // Cleanup temporary files
    try {
      fs.unlinkSync(tempVideoPath);
      fs.unlinkSync(srtPath);
      fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp files:', cleanupError);
    }

    return {
      path: data.path,
      signedUrl: signedUrlData?.signedUrl,
      publicUrl: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/renders/${fileName}`
    };

  } catch (error) {
    console.error('Burn captions error:', error);
    throw new Error(`Failed to burn captions: ${error.message}`);
  }
}

/**
 * Generate SRT content from captions data
 */
function generateSRTContent({ dialogue, voiceover, timestamps, style }) {
  const lines = [];
  let subtitleIndex = 1;

  // Use dialogue or voiceover as the text source
  const textSource = dialogue || voiceover;
  
  if (!textSource) {
    return '';
  }

  // Split text into sentences or phrases
  const sentences = textSource.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate timing for each sentence
  const totalDuration = 8; // 8 seconds total
  const timePerSentence = totalDuration / sentences.length;

  sentences.forEach((sentence, index) => {
    const startTime = index * timePerSentence;
    const endTime = Math.min((index + 1) * timePerSentence, totalDuration);
    
    // Convert to SRT time format (HH:MM:SS,mmm)
    const startTimeStr = formatSRTTime(startTime);
    const endTimeStr = formatSRTTime(endTime);
    
    lines.push(subtitleIndex.toString());
    lines.push(`${startTimeStr} --> ${endTimeStr}`);
    lines.push(sentence.trim());
    lines.push(''); // Empty line between subtitles
    
    subtitleIndex++;
  });

  return lines.join('\n');
}

/**
 * Format time in seconds to SRT format
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Generate multiple thumbnails at different timestamps
 */
export async function generateThumbnailGrid(videoUrl, options = {}) {
  try {
    const {
      count = 4,
      width = 160,
      height = 284,
      quality = 80
    } = options;

    const thumbnails = [];
    const totalDuration = 8; // 8 seconds
    const interval = totalDuration / count;

    for (let i = 0; i < count; i++) {
      const timestamp = i * interval;
      const thumbnail = await generateThumbnail(videoUrl, {
        timestamp: formatSRTTime(timestamp).replace(',', '.'),
        width,
        height,
        quality
      });
      thumbnails.push(thumbnail);
    }

    return thumbnails;

  } catch (error) {
    console.error('Generate thumbnail grid error:', error);
    throw new Error(`Failed to generate thumbnail grid: ${error.message}`);
  }
}

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpegAvailability() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    console.warn('FFmpeg not available:', error.message);
    return false;
  }
}

