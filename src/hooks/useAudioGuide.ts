import { useRef, useCallback, useEffect, useState } from "react";

interface AudioGuideHook {
  playStartGuide: () => void;
  playCountGuide: (count: number, targetCount: number) => void;
  stopAllAudio: () => void;
  isPlaying: boolean;
}

export const useAudioGuide = (): AudioGuideHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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

    const audio = audioRef.current;

    const handleLoadStart = () => {
      setIsPlaying(true);
      console.log("🎵 음성 재생 시작");
    };

    const handleEnded = () => {
      setIsPlaying(false);
      console.log("🎵 음성 재생 완료");
    };

    const handleError = (e: Event) => {
      console.error("🎵 음성 재생 오류:", e);
      setIsPlaying(false);
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
      // 기존 재생 완전히 정리
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }
      audioRef.current.currentTime = 0;

      // 약간의 지연으로 안정성 확보
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 새 오디오 설정 및 재생
      audioRef.current.src = audioPath;
      audioRef.current.volume = 1.0; // 🔊 100% 볼륨으로 설정

      await audioRef.current.play();
      console.log(`🎵 음성 재생: ${audioPath}`);
    } catch (error) {
      console.error("🎵 음성 재생 실패:", error);
      setIsPlaying(false);
    }
  }, []);

  // 시작 안내 음성 재생
  const playStartGuide = useCallback(() => {
    playAudio(audioFiles.start);
  }, [playAudio]);

  // 횟수 안내 음성 재생
  const playCountGuide = useCallback(
    (count: number, targetCount: number) => {
      console.log(`🎵 음성 재생 요청: ${count}회 (목표: ${targetCount}회)`);

      // 마지막 횟수인 경우
      if (count === targetCount) {
        console.log("🎵 마지막 횟수 음성 재생");
        playAudio(audioFiles.last);
        return;
      }

      // 일반 횟수인 경우 (1-10회)
      if (count >= 1 && count <= 10) {
        const audioPath = audioFiles.counts[count - 1]; // 배열 인덱스는 0부터 시작
        if (audioPath) {
          console.log(`🎵 ${count}회 음성 재생: ${audioPath}`);
          playAudio(audioPath);
        } else {
          console.error(`🎵 ${count}회에 해당하는 음성 파일이 없습니다`);
        }
      } else {
        console.warn(`🎵 지원하지 않는 횟수: ${count}회`);
      }
    },
    [playAudio]
  );

  // 모든 오디오 중단
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    playStartGuide,
    playCountGuide,
    stopAllAudio,
    isPlaying,
  };
};
