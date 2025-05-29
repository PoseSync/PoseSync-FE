import { useRef, useCallback, useEffect, useState } from "react";

interface FallDetectionAudioHook {
  playFallAlert: () => void;
  stopAllAudio: () => void;
  isPlaying: boolean;
}

export const useFallDetectionAudio = (): FallDetectionAudioHook => {
  const sirenAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🚨 낙상 감지 전용 오디오 파일
  const audioFiles = {
    siren: "/audio/siren.mp3", // 8초 사이렌 (5초만 재생)
    emergency: "/audio/emergency_voice.wav", // 응급상황 음성
  };

  // 오디오 초기화
  useEffect(() => {
    sirenAudioRef.current = new Audio();
    voiceAudioRef.current = new Audio();

    const sirenAudio = sirenAudioRef.current;
    const voiceAudio = voiceAudioRef.current;

    // 사이렌 오디오 이벤트
    const handleSirenLoadStart = () => {
      setIsPlaying(true);
      console.log("🚨 낙상 감지 사이렌 재생 시작");
    };

    const handleSirenEnded = () => {
      console.log("🚨 사이렌 재생 완료, 음성 재생 시작");
      playEmergencyVoice();
    };

    const handleSirenError = (e: Event) => {
      console.error("🚨 사이렌 재생 오류:", e);
      // 사이렌 실패 시 바로 음성 재생
      playEmergencyVoice();
    };

    // 음성 오디오 이벤트
    const handleVoiceEnded = () => {
      setIsPlaying(false);
      console.log("🚨 응급상황 음성 재생 완료");
    };

    const handleVoiceError = (e: Event) => {
      console.error("🚨 응급상황 음성 재생 오류:", e);
      setIsPlaying(false);
    };

    sirenAudio.addEventListener("loadstart", handleSirenLoadStart);
    sirenAudio.addEventListener("ended", handleSirenEnded);
    sirenAudio.addEventListener("error", handleSirenError);

    voiceAudio.addEventListener("ended", handleVoiceEnded);
    voiceAudio.addEventListener("error", handleVoiceError);

    return () => {
      // 이벤트 리스너 제거
      sirenAudio.removeEventListener("loadstart", handleSirenLoadStart);
      sirenAudio.removeEventListener("ended", handleSirenEnded);
      sirenAudio.removeEventListener("error", handleSirenError);

      voiceAudio.removeEventListener("ended", handleVoiceEnded);
      voiceAudio.removeEventListener("error", handleVoiceError);

      // 오디오 정리
      sirenAudio.pause();
      sirenAudio.src = "";
      voiceAudio.pause();
      voiceAudio.src = "";

      // 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 응급상황 음성 재생 함수
  const playEmergencyVoice = useCallback(async () => {
    if (!voiceAudioRef.current) return;

    try {
      voiceAudioRef.current.src = audioFiles.emergency;
      voiceAudioRef.current.volume = 1.0;
      await voiceAudioRef.current.play();
      console.log("🔊 응급상황 음성 재생 중");
    } catch (error) {
      console.error("🔊 응급상황 음성 재생 실패:", error);
      setIsPlaying(false);
    }
  }, []);

  // 낙상 감지 알림 재생 (사이렌 5초 + 음성)
  const playFallAlert = useCallback(async () => {
    if (!sirenAudioRef.current) return;

    try {
      console.log("🚨 낙상 감지 알림 시작");

      // ✅ 기존 재생 중단 (타이머 포함)
      stopAllAudio();

      // 사이렌 설정 및 재생
      sirenAudioRef.current.src = audioFiles.siren;
      sirenAudioRef.current.volume = 1.0;

      await sirenAudioRef.current.play();
      console.log("🚨 사이렌 재생 시작 (5초 제한)");

      // ✅ 새로운 타이머 설정 (5초 후 사이렌 중단하고 음성 재생)
      timeoutRef.current = setTimeout(() => {
        if (sirenAudioRef.current && !sirenAudioRef.current.paused) {
          sirenAudioRef.current.pause();
          sirenAudioRef.current.currentTime = 0;
          console.log("🚨 사이렌 5초 재생 완료");
        }
        playEmergencyVoice();
      }, 5000);
    } catch (error) {
      console.error("🚨 낙상 감지 알림 재생 실패:", error);
      setIsPlaying(false);
    }
  }, [playEmergencyVoice]);

  // ✅ 모든 오디오 중단 (수정된 부분)
  const stopAllAudio = useCallback(() => {
    console.log("🛑 모든 낙상 감지 오디오 중단 시작");

    // ✅ 1. 먼저 타이머 정리 (가장 중요!)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      console.log("⏰ setTimeout 타이머 정리 완료");
    }

    // ✅ 2. 사이렌 중단
    if (sirenAudioRef.current) {
      sirenAudioRef.current.pause();
      sirenAudioRef.current.currentTime = 0;
      console.log("🚨 사이렌 중단 완료");
    }

    // ✅ 3. 음성 중단
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
      console.log("🔊 음성 중단 완료");
    }

    // ✅ 4. 상태 초기화
    setIsPlaying(false);
    console.log("🚨 낙상 감지 음성 모두 중단 완료");
  }, []);

  return {
    playFallAlert,
    stopAllAudio,
    isPlaying,
  };
};
