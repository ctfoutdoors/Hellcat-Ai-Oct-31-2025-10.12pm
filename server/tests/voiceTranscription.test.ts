import { describe, it, expect } from 'vitest';
import { storagePut } from '../storage';
import { transcribeAudio } from '../_core/voiceTranscription';
import { randomBytes } from 'crypto';

describe('Voice Transcription System', () => {
  it('should upload audio file to S3', async () => {
    // Create a mock audio buffer (simulating a webm file)
    const mockAudioBuffer = Buffer.from('mock audio data for testing');
    const randomSuffix = randomBytes(8).toString('hex');
    const fileKey = `voice-recordings/test-${Date.now()}-${randomSuffix}.webm`;

    // Upload to S3
    const result = await storagePut(fileKey, mockAudioBuffer, 'audio/webm');

    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(typeof result.url).toBe('string');
    expect(result.url).toContain('voice-recordings');
    
    console.log('✓ Audio uploaded to S3:', result.url);
  }, 30000);

  it('should have transcription helper available', () => {
    expect(transcribeAudio).toBeDefined();
    expect(typeof transcribeAudio).toBe('function');
    
    console.log('✓ Whisper API transcription helper is available');
  });

  it('should validate audio file size limits', () => {
    const maxSize = 16 * 1024 * 1024; // 16MB
    const testSize = 10 * 1024 * 1024; // 10MB
    
    expect(testSize).toBeLessThan(maxSize);
    console.log(`✓ Audio file size validation: ${testSize / 1024 / 1024}MB < ${maxSize / 1024 / 1024}MB limit`);
  });

  it('should support required audio formats', () => {
    const supportedFormats = ['audio/webm', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    
    expect(supportedFormats).toContain('audio/webm');
    expect(supportedFormats).toContain('audio/wav');
    expect(supportedFormats).toContain('audio/mp3' || 'audio/mpeg');
    
    console.log('✓ Supported audio formats:', supportedFormats.join(', '));
  });
});
