import { useCallback, useRef } from 'react';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [getAudioContext]);

  const playCorrect = useCallback(() => {
    playTone(523.25, 0.1);
    setTimeout(() => playTone(659.25, 0.1), 100);
    setTimeout(() => playTone(783.99, 0.2), 200);
  }, [playTone]);

  const playWrong = useCallback(() => {
    playTone(200, 0.15, 'sawtooth');
    setTimeout(() => playTone(150, 0.2, 'sawtooth'), 150);
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone(800, 0.05, 'square', 0.1);
  }, [playTone]);

  const playUrgentTick = useCallback(() => {
    playTone(1000, 0.08, 'square', 0.2);
  }, [playTone]);

  const playVictory = useCallback(() => {
    const melody = [
      { freq: 523.25, delay: 0 },
      { freq: 587.33, delay: 150 },
      { freq: 659.25, delay: 300 },
      { freq: 783.99, delay: 450 },
      { freq: 880.00, delay: 600 },
      { freq: 1046.50, delay: 750 }
    ];

    melody.forEach(({ freq, delay }) => {
      setTimeout(() => playTone(freq, 0.2), delay);
    });
  }, [playTone]);

  const playGameOver = useCallback(() => {
    playTone(392, 0.2, 'triangle');
    setTimeout(() => playTone(349.23, 0.2, 'triangle'), 200);
    setTimeout(() => playTone(293.66, 0.3, 'triangle'), 400);
  }, [playTone]);

  const playLevelComplete = useCallback(() => {
    playTone(659.25, 0.15);
    setTimeout(() => playTone(783.99, 0.15), 150);
    setTimeout(() => playTone(1046.50, 0.25), 300);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(600, 0.05, 'square', 0.15);
  }, [playTone]);

  const playHint = useCallback(() => {
    playTone(880, 0.1);
    setTimeout(() => playTone(1046.50, 0.15), 100);
  }, [playTone]);

  return {
    playCorrect,
    playWrong,
    playTick,
    playUrgentTick,
    playVictory,
    playGameOver,
    playLevelComplete,
    playClick,
    playHint
  };
};
