/**
 * AudioRecorder utility class for managing Web Audio API interactions
 * Handles microphone access, audio recording, and frequency analysis
 */
export class AudioRecorder {
  private mediaStream?: MediaStream;
  private mediaRecorder?: MediaRecorder;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private audioChunks: Blob[] = [];

  /**
   * Check if the browser supports getUserMedia
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  /**
   * Start recording audio from the user's microphone
   * @throws Error if browser doesn't support getUserMedia or permission is denied
   */
  public async startRecording(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error('Your browser does not support audio recording');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (!this.analyser) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      this.cleanup();
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found');
        }
      }
      throw error;
    }
  }

  /**
   * Stop recording and return the audio blob
   * @returns Audio blob in WebM format with Opus codec
   */
  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recording not started'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (event) => {
        this.cleanup();
        reject(new Error(`Recording error: ${event.error}`));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the audio context for advanced audio operations
   */
  public getAudioContext(): AudioContext | undefined {
    return this.audioContext;
  }

  /**
   * Get the analyser node for frequency analysis
   */
  public getAnalyser(): AnalyserNode | undefined {
    return this.analyser;
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Clean up audio resources
   */
  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = undefined;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = undefined;
    }

  }

  /**
   * Destroy the recorder and release all resources
   */
  public destroy(): void {
    this.cleanup();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = undefined;
    }

    this.analyser = undefined;
    this.audioChunks = [];
  }
}
