
import React, { useEffect, useRef, useCallback } from 'react';

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

interface AudioHandlerProps {
  isMuted: boolean;
  isPlayingMusic: boolean;
}

export const playSound = (type: 'click' | 'flip' | 'success' | 'shuffle' | 'gift' | 'explosion') => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

  const now = audioCtx.currentTime;

  if (type === 'explosion') {
    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 4);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 1);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(now);
    return;
  }

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  switch (type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'flip':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    case 'success':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.linearRampToValueAtTime(659, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
  }
};

const AudioHandler: React.FC<AudioHandlerProps> = ({ isMuted, isPlayingMusic }) => {
  // Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout for browser compatibility
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playMusic = useCallback(() => {
    if (!audioCtx || isMuted || !isPlayingMusic) return;
    
    const melody = [261, 329, 392, 329, 349, 440, 523, 440];
    let index = 0;

    const tick = () => {
      const freq = melody[index];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
      
      index = (index + 1) % melody.length;
      timeoutRef.current = setTimeout(tick, 800);
    };

    tick();
  }, [isMuted, isPlayingMusic]);

  useEffect(() => {
    if (isPlayingMusic && !isMuted) {
      playMusic();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [playMusic, isMuted, isPlayingMusic]);

  return null;
};

export default AudioHandler;
