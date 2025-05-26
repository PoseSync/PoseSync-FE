import { useRef, useCallback, useEffect } from "react";

interface BodyAnalysisAudioHook {
  playAnalysisStartGuide: () => void;
  stopAllAudio: () => void;
  isPlaying: boolean;
}

export const useBodyAnalysisAudio = (): BodyAnalysisAudioHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // 체형분석 음성 파일 경로
  const audioFiles = {
    analysisStart:
      "/audio/지금부터 체형분석을 시작합니다. 분석이 완료될 때 까지 자세를 유지하세요!.wav",
  };

  // 오디오 초기화
  useEffect(() => {
    audioRef.current = new Audio();

    const audio = audioRef.current;

    const handleLoadStart = () => {
      isPlayingRef.current = true;
      console.log("🎵 체형분석 음성 재생 시작");
    };

    const handleEnded = () => {
      isPlayingRef.current = false;
      console.log("🎵 체형분석 음성 재생 완료");
    };

    const handleError = (e: Event) => {
      console.error("🎵 체형분석 음성 재생 오류:", e);
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
      audioRef.current.volume = 0.9; // 체형분석은 조금 더 크게 (90%)

      await audioRef.current.play();
      console.log(`🎵 체형분석 음성 재생: ${audioPath}`);
    } catch (error) {
      console.error("🎵 체형분석 음성 재생 실패:", error);
      isPlayingRef.current = false;
    }
  }, []);

  // 체형분석 시작 안내 음성 재생
  const playAnalysisStartGuide = useCallback(() => {
    console.log("🎵 체형분석 시작 음성 재생 요청");
    playAudio(audioFiles.analysisStart);
  }, [playAudio]);

  // 모든 오디오 중단
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      isPlayingRef.current = false;
      console.log("🎵 체형분석 음성 중단");
    }
  }, []);

  return {
    playAnalysisStartGuide,
    stopAllAudio,
    isPlaying: isPlayingRef.current,
  };
};
