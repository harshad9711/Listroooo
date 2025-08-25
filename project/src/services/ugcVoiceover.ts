import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

const polly = new PollyClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function generateVoiceover(text: string, voice: string = 'Joanna') {
  try {
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voice as any,
      Engine: 'neural'
    });

    const response = await polly.send(command);
    const audioBlob = new Blob([response.AudioStream as any || ''], { type: 'audio/mpeg' });
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Voiceover generation error:', error);
    throw error;
  }
}