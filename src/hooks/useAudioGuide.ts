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

  // 음성 파일 경로 매핑
  const audioFiles = {
    start: "/audio/audio_11_운동을_시작하겠습니다_.wav",
    counts: [
      "/audio/audio_0_하나_.wav", // 1회
      "/audio/audio_1_둘_.wav", // 2회
      "/audio/audio_2_셋_.wav", // 3회
      "/audio/audio_3_넷_.wav", // 4회
      "/audio/audio_4_다섯_.wav", // 5회
      "/audio/audio_5_여섯_.wav", // 6회
      "/audio/audio_6_일곱_.wav", // 7회
      "/audio/audio_7_여덟_.wav", // 8회
      "/audio/audio_8_아홉_.wav", // 9회
      "/audio/audio_9_열_.wav", // 10회
    ],
    last: "/audio/audio_10_마지막.wav", // 마지막 횟수
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
      console.error("Audio play error:", e);
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
      audioRef.current.volume = 0.8; // 볼륨 80%

      await audioRef.current.play();
      console.log(`음성 재생: ${audioPath}`);
    } catch (error) {
      console.error("음성 재생 실패:", error);
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
