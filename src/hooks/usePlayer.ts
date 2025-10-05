import { useEffect, useRef } from "react";

let audioElement: HTMLAudioElement | null = null;

const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioElement == null) {
      audioElement = document.createElement("audio");
      document.body.appendChild(audioElement);

      // Expose audio element for Playwright tests
      // This is safe because it's only exposing a read-only reference for verification
      if (typeof window !== "undefined") {
        interface WindowWithAudio {
          __TOTEM_AUDIO_ELEMENT__: HTMLAudioElement;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Required for exposing audio element to Playwright tests
        (window as unknown as WindowWithAudio).__TOTEM_AUDIO_ELEMENT__ =
          audioElement;
      }
    }
    audioRef.current = audioElement;
  }, []);

  const play = async (uri: string) => {
    if (audioRef.current != null) {
      audioRef.current.src = uri;
      return await audioRef.current.play();
    }
  };

  const stop = () => {
    if (audioRef.current != null) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const pause = () => {
    if (audioRef.current != null) {
      audioRef.current.pause();
    }
  };

  const replay = async () => {
    if (audioRef.current != null) {
      audioRef.current.currentTime = 0;
      return await audioRef.current.play();
    }
  };

  return { play, pause, stop, replay };
};

export default usePlayer;
