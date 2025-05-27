import { useRef, useCallback, useEffect } from "react";

interface AudioGuideHook {
  playStartGuide: () => void;
  playCountGuide: (count: number, targetCount: number) => void;
  stopAllAudio: () => void;
  isPlaying: boolean;
}

export const useAudioGuide = (): AudioGuideHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // 🎵 새로운 간단한 파일명으로 변경
  const audioFiles = {
    start: "/audio/start_exercise.wav",
    counts: [
      "/audio/count_1.wav", // 1회
      "/audio/count_2.wav", // 2회
      "/audio/count_3.wav", // 3회
      "/audio/count_4.wav", // 4회
      "/audio/count_5.wav", // 5회
      "/audio/count_6.wav", // 6회
      "/audio/count_7.wav", // 7회
      "/audio/count_8.wav", // 8회
      "/audio/count_9.wav", // 9회
      "/audio/count_10.wav", // 10회
    ],
    last: "/audio/count_last.wav", // 마지막 횟수
  };

  // 오디오 초기화
  useEffect(() => {
    audioRef.current = new Audio();

    // 오디오 이벤트 리스너
    const audio = audioRef.current;

    const handleLoadStart = () => {
      isPlayingRef.current = true;
    };

    const handleEnded = () => {
      isPlayingRef.current = false;
    };

    const handleError = (e: Event) => {
      console.error("🎵 음성 재생 오류:", e);
      isPlayingRef.current = false;
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // 음성 재생 함수
  const playAudio = useCallback(async (audioPath: string) => {
    if (!audioRef.current) return;

    try {
      // 이전 재생 중단
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      // 새 오디오 설정 및 재생
      audioRef.current.src = audioPath;
      audioRef.current.volume = 1.0; // 🔊 100% 볼륨으로 설정

      await audioRef.current.play();
      console.log(`🎵 음성 재생: ${audioPath}`);
    } catch (error) {
      console.error("🎵 음성 재생 실패:", error);
      isPlayingRef.current = false;
    }
  }, []);

  // 시작 안내 음성 재생
  const playStartGuide = useCallback(() => {
    playAudio(audioFiles.start);
  }, [playAudio]);

  // 횟수 안내 음성 재생
  const playCountGuide = useCallback(
    (count: number, targetCount: number) => {
      // 마지막 횟수인 경우
      if (count === targetCount) {
        playAudio(audioFiles.last);
        return;
      }

      // 일반 횟수인 경우 (1-10회)
      if (count >= 1 && count <= 10) {
        const audioPath = audioFiles.counts[count - 1]; // 배열 인덱스는 0부터 시작
        if (audioPath) {
          playAudio(audioPath);
        }
      }
    },
    [playAudio]
  );

  // 모든 오디오 중단
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
    }
  }, []);

  return {
    playStartGuide,
    playCountGuide,
    stopAllAudio,
    isPlaying: isPlayingRef.current,
  };
};
