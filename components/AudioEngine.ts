
class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private cursedGain: GainNode | null = null; 
  private isInitialized = false;
  
  // Ambient Sound Nodes
  private ambientOscillator: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientLFO: OscillatorNode | null = null;
  
  // Cursed Sound Nodes
  private cursedOscillator: OscillatorNode | null = null;

  // Danger Zone specific sound
  private dangerZoneGain: GainNode | null = null;
  private dangerZoneOscillator: OscillatorNode | null = null;
  
  // FATAL ERROR SOURCE
  private fatalSource: AudioBufferSourceNode | null = null;
  private fatalGain: GainNode | null = null;

  initialize() {
    if (this.isInitialized) return;
    try {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);

        this.musicGain = this.audioCtx.createGain();
        this.sfxGain = this.audioCtx.createGain();
        this.cursedGain = this.audioCtx.createGain();
        this.dangerZoneGain = this.audioCtx.createGain();
        this.ambientGain = this.audioCtx.createGain();
        this.fatalGain = this.audioCtx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        
        this.ambientGain.connect(this.musicGain);

        this.cursedGain.connect(this.audioCtx.destination);
        this.dangerZoneGain.connect(this.audioCtx.destination);
        
        // FATAL GAIN CONNECTS DIRECTLY TO OUTPUT AND BYPASSES EVERYTHING
        this.fatalGain.connect(this.audioCtx.destination);
        
        this.isInitialized = true;
    } catch(e) {
        console.warn("AudioContext initialization failed", e);
    }
  }

  setMusicVolume(volume: number) {
    if (!this.musicGain || !this.audioCtx) return;
    this.musicGain.gain.setValueAtTime(volume / 100, this.audioCtx.currentTime);
  }

  setSfxVolume(volume: number) {
    if (!this.sfxGain || !this.audioCtx) return;
    this.sfxGain.gain.setValueAtTime(volume / 100, this.audioCtx.currentTime);
  }
  
  startAmbience() {
      if (!this.audioCtx || !this.ambientGain || this.ambientOscillator) return;
      
      this.ambientOscillator = this.audioCtx.createOscillator();
      this.ambientOscillator.type = 'sine';
      this.ambientOscillator.frequency.value = 60; 

      this.ambientFilter = this.audioCtx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.value = 400;

      this.ambientLFO = this.audioCtx.createOscillator();
      this.ambientLFO.type = 'sine';
      this.ambientLFO.frequency.value = 0.2; 
      
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.value = 50; 
      
      this.ambientLFO.connect(lfoGain);
      lfoGain.connect(this.ambientOscillator.frequency);

      this.ambientOscillator.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      
      this.ambientGain.gain.value = 0.4;

      this.ambientOscillator.start();
      this.ambientLFO.start();
      
      this.scheduleRandomBubble();
  }
  
  stopAmbience() {
      if(this.ambientOscillator) {
          try {
             this.ambientOscillator.stop();
             this.ambientOscillator.disconnect();
             this.ambientLFO?.stop();
             this.ambientLFO?.disconnect();
          } catch(e){}
          this.ambientOscillator = null;
      }
  }
  
  private scheduleRandomBubble() {
      if (!this.audioCtx || !this.sfxGain || !this.isInitialized) return;
      setTimeout(() => {
          this.playBubbleSound();
          this.scheduleRandomBubble();
      }, Math.random() * 6000 + 2000);
  }
  
  private playBubbleSound() {
      if (!this.audioCtx || !this.sfxGain) return;
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      const now = this.audioCtx.currentTime;
      osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, now + 0.1);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(now + 0.1);
  }

  playClickSound() {
    if (!this.audioCtx || !this.sfxGain) return;
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.audioCtx.currentTime + 0.1);
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }
  
  playEatSound() {
    if (!this.audioCtx || !this.sfxGain) return;
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sine';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.08);
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.08);
  }
  
  playDeathSound() {
    if (!this.audioCtx || !this.sfxGain) return;
    const osc = this.audioCtx.createOscillator();
    osc.type = 'triangle';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.5);
    const gainNode = this.audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(now + 0.5);
  }

   playVictorySound() {
     if (!this.audioCtx || !this.sfxGain) return;
     const now = this.audioCtx.currentTime;
     
     // DISTINCT FANFARE: Dun-dun-dun-DUN! (Square wave for retro console feel)
     const melody = [
         { freq: 523.25, time: 0, dur: 0.1 }, // C5
         { freq: 523.25, time: 0.1, dur: 0.1 }, // C5
         { freq: 523.25, time: 0.2, dur: 0.1 }, // C5
         { freq: 659.25, time: 0.3, dur: 0.4 }, // E5
         { freq: 523.25, time: 0.7, dur: 0.1 }, // C5
         { freq: 783.99, time: 0.8, dur: 0.6 }  // G5 (Victory!)
     ];

     melody.forEach((note) => {
        const osc = this.audioCtx!.createOscillator();
        osc.type = 'square'; 
        osc.frequency.value = note.freq;
        const gain = this.audioCtx!.createGain();
        gain.gain.setValueAtTime(0.1, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.dur);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
     });
   }

   playGlitchSound() {
      if (!this.audioCtx || !this.sfxGain) return;
      const bufferSize = this.audioCtx.sampleRate * 1.0; 
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const gain = this.audioCtx.createGain();
      gain.gain.value = 0.5;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
   }
   
   startCursedNoise() {
       if(!this.audioCtx || !this.cursedGain || this.cursedOscillator) return;
       const osc1 = this.audioCtx.createOscillator();
       osc1.type = 'sawtooth';
       osc1.frequency.value = 50; 
       const osc2 = this.audioCtx.createOscillator();
       osc2.type = 'square';
       osc2.frequency.value = 55; 
       
       const gain = this.audioCtx.createGain();
       gain.gain.value = 0.05; 
       
       osc1.connect(gain);
       osc2.connect(gain);
       gain.connect(this.cursedGain);
       
       osc1.start();
       osc2.start();
       this.cursedOscillator = osc1; 
   }
   
   stopCursedNoise() {
       if(this.cursedGain) {
           this.cursedGain.disconnect();
           this.cursedGain = this.audioCtx!.createGain();
           this.cursedGain.connect(this.audioCtx!.destination);
           this.cursedOscillator = null;
       }
   }
   
   startDangerZoneSound() {
       if(!this.audioCtx || !this.dangerZoneGain || this.dangerZoneOscillator) return;
       this.dangerZoneOscillator = this.audioCtx.createOscillator();
       this.dangerZoneOscillator.type = 'sine';
       this.dangerZoneOscillator.frequency.value = 1000;
       const lfo = this.audioCtx.createOscillator();
       lfo.frequency.value = 10; 
       const lfoGain = this.audioCtx.createGain();
       lfoGain.gain.value = 500;
       lfo.connect(lfoGain);
       lfoGain.connect(this.dangerZoneOscillator.frequency);
       
       this.dangerZoneGain.gain.value = 0.1;
       this.dangerZoneOscillator.connect(this.dangerZoneGain);
       this.dangerZoneOscillator.start();
       lfo.start();
   }
   
   stopDangerZoneSound() {
        if(this.dangerZoneOscillator) {
           try{ this.dangerZoneOscillator.stop(); } catch(e){}
           this.dangerZoneOscillator = null;
        }
   }
   
   isFatalPlaying() {
       return this.fatalSource !== null;
   }

   stopFatalErrorSound() {
       if(this.fatalSource) {
           try {
               this.fatalSource.stop();
               this.fatalSource.disconnect();
           } catch(e) {}
           this.fatalSource = null;
       }
   }

   // FATAL SOUND: VERY DEEP, GRAVE, LOW FREQUENCY RUMBLE
   playFatalErrorSound() {
      if (!this.audioCtx || !this.fatalGain) return;
      if (this.fatalSource) return; 
      
      const bufferSize = this.audioCtx.sampleRate * 2; 
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
          const t = i / this.audioCtx.sampleRate;
          // Generate Low Frequency Noise/Rumble
          const r1 = Math.random() * 2 - 1;
          const r2 = Math.random() * 2 - 1;
          
          // Ultra low sine wave modulation (40Hz - 60Hz) - Like an earthquake
          const deepHum = Math.sin(t * 50 * Math.PI * 2);
          const deepGrowl = Math.sin(t * 35 * Math.PI * 2 + (r1 * 0.5));
          
          // Distorted low frequency
          data[i] = (deepHum * 0.6 + deepGrowl * 0.6 + r2 * 0.2); 
      }

      this.fatalSource = this.audioCtx.createBufferSource();
      this.fatalSource.buffer = buffer;
      this.fatalSource.loop = true; 
      
      this.fatalSource.connect(this.fatalGain);
      this.fatalGain.gain.value = 1.0; 
      
      this.fatalSource.start();
  }
}

export const audioEngine = new AudioEngine();
