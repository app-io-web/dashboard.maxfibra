// src/hooks/useNotificationSound.ts
import { useRef, useEffect } from "react";

export function useNotificationSound(soundPath: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundPath);
    }
  }, [soundPath]); // carrega o áudio certo quando o som mudar

  function play(volume: number = 1) {
    if (!audioRef.current) return;

    audioRef.current.volume = Math.min(Math.max(volume, 0), 1);
    audioRef.current.currentTime = 0;

    audioRef.current
      .play()
      .catch((err) => {
        console.warn("[SOUND] Falha ao tocar áudio:", err);
      });
  }

  return { play };
}
