import { useState, useEffect, useCallback, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { Landmark, ProcessedResult, NextSetInfo } from "../types"; // 🎯 NextSetInfo를 types에서 import

interface UseSocketOptions {
  phoneNumber: string;
  exerciseType: string;
  autoConnect?: boolean;
  onSetComplete?: (setInfo: NextSetInfo) => void; // 세트 완료 콜백 추가
  onFallDetected?: () => void; // 🆕 낙상 감지 콜백 추가
}

// 서버 URL 설정 - window.location.hostname을 사용하여 동적으로 설정
const getServerUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5001`;
};

// 레이턴시 관련 인터페이스
interface LatencyRecord {
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface LatencyStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  samples: number[];
}

export const useSocket = (options: UseSocketOptions) => {
  const {
    phoneNumber,
    exerciseType,
    autoConnect = false,
    onSetComplete,
    onFallDetected, // 🆕 낙상 감지 콜백
  } = options;

  // 전화번호에서 숫자만 추출
  const numericPhoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  // 상태
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [processedResult, setProcessedResult] =
    useState<ProcessedResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [serverUrl] = useState<string>(getServerUrl()); // useState로 고정
  const [latencyStats, setLatencyStats] = useState<LatencyStats>({
    count: 0,
    min: 0,
    max: 0,
    avg: 0,
    median: 0,
    p95: 0,
    samples: [],
  });

  // 참조
  const mountedRef = useRef<boolean>(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);
  const latencyRecordsRef = useRef<Record<string, LatencyRecord>>({});
  const currentCountRef = useRef<number>(0); // 현재 운동 횟수 추적

  // 레이턴시 통계 계산 함수
  const calculateLatencyStats = useCallback(() => {
    const records = Object.values(latencyRecordsRef.current)
      .filter((record) => record.duration !== undefined)
      .map((record) => record.duration as number);

    if (records.length === 0) return null;

    // 오름차순 정렬
    records.sort((a, b) => a - b);

    const min = records[0];
    const max = records[records.length - 1];
    const avg = records.reduce((sum, value) => sum + value, 0) / records.length;
    const median = records[Math.floor(records.length / 2)];
    const p95 = records[Math.floor(records.length * 0.95)];

    return {
      count: records.length,
      min,
      max,
      avg,
      median,
      p95,
      samples: records.slice(-100), // 최근 100개 샘플만 유지
    };
  }, []);

  // 소켓 초기화
  useEffect(() => {
    mountedRef.current = true;

    // 소켓 인스턴스 생성
    console.log("🔌 서버 URL:", serverUrl);
    const newSocket = io(serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      timeout: 5000,
    });

    // 연결 이벤트 처리
    newSocket.on("connect", () => {
      if (!mountedRef.current) return;

      console.log("🟢 소켓 연결됨:", newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // 연결 이벤트 전송 (숫자만 추출한 전화번호 사용)
      console.log("📤 connection 이벤트 전송:", {
        phoneNumber: numericPhoneNumber,
      });
      newSocket.emit("connection", { phoneNumber: numericPhoneNumber });

      // 타임아웃 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });

    // 연결 결과 이벤트 처리
    newSocket.on("connected", (data) => {
      if (!mountedRef.current) return;
      console.log("🟢 서버 connected 응답 받음:", data);
    });

    // 연결 해제 이벤트 처리
    newSocket.on("disconnect", (reason) => {
      if (!mountedRef.current) return;

      console.log("🔴 소켓 연결 해제됨:", reason);
      setIsConnected(false);

      if (reason === "io server disconnect") {
        console.log("서버에서 연결 해제");
      }
    });

    // 연결 오류 처리
    newSocket.on("connect_error", (err) => {
      if (!mountedRef.current) return;

      console.error("❌ 소켓 연결 오류:", err.message);
      setError(new Error(`연결 오류: ${err.message}`));
      setIsConnecting(false);

      // 타임아웃 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });

    // 서버에서 결과 수신
    newSocket.on(
      "result",
      (
        data: ProcessedResult & {
          requestId?: string;
          serverProcessingTime?: number;
          exerciseCount?: number;
          count?: number;
          is_fall?: boolean; // 🆕 낙상 감지 필드 추가
        }
      ) => {
        if (!mountedRef.current) return;

        const now = performance.now();
        const requestId = data.requestId;

        // 레이턴시 계산
        if (requestId && latencyRecordsRef.current[requestId]) {
          const record = latencyRecordsRef.current[requestId];
          record.endTime = now;
          record.duration = now - record.startTime;

          console.log(`⏱️ 레이턴시 측정: ${record.duration.toFixed(2)}ms`);
          if (data.serverProcessingTime) {
            console.log(
              `⏱️ 서버 처리 시간: ${data.serverProcessingTime.toFixed(2)}ms`
            );
            console.log(
              `⏱️ 네트워크 시간: ${(
                record.duration - data.serverProcessingTime
              ).toFixed(2)}ms`
            );
          }

          // 일정 기간이 지난 레코드는 정리
          const cleanupTime = now - 60000; // 1분 이상 지난 레코드 삭제
          Object.keys(latencyRecordsRef.current).forEach((key) => {
            const record = latencyRecordsRef.current[key];
            if (!record.endTime && record.startTime < cleanupTime) {
              delete latencyRecordsRef.current[key];
            }
          });

          // 통계 업데이트
          const stats = calculateLatencyStats();
          if (stats) {
            setLatencyStats(stats);
          }
        }

        // 🆕 낙상 감지 처리 (가이드라인 유지하면서)
        if (data.is_fall === true) {
          console.log("🚨🚨🚨 운동 중 낙상 감지됨! 🚨🚨🚨");
          if (onFallDetected) {
            onFallDetected();
          }
          // ✅ 낙상 감지 시에도 return하지 않고 계속 진행하여 가이드라인 유지
        }

        // 운동 횟수 업데이트 - 서버의 count 필드 사용
        if (data.count !== undefined) {
          console.log(`🏋️ 서버에서 받은 운동 횟수: ${data.count}`);
          currentCountRef.current = data.count;

          // 기존 코드 호환성을 위해 exerciseCount로도 복사
          data.exerciseCount = data.count;
        }

        // ✅ 낙상 감지 여부와 관계없이 항상 processedResult 설정 (가이드라인 유지)
        setProcessedResult(data);
      }
    );

    // 🎯 next 이벤트 처리 (세트 완료 시 서버에서 전송) - null 값 허용
    newSocket.on("next", (data: NextSetInfo) => {
      if (!mountedRef.current) return;
      console.log("🎯 서버에서 next 이벤트 수신:", data);

      // 상위 컴포넌트에 세트 완료 알림
      if (onSetComplete) {
        onSetComplete(data);
      }
    });

    setSocket(newSocket);

    // 자동 연결
    if (autoConnect) {
      console.log("🔄 자동 연결 시도 중...");
      newSocket.connect();
      setIsConnecting(true);
      setConnectionAttempts((prev) => prev + 1);

      // 타임아웃 설정
      timeoutRef.current = setTimeout(() => {
        if (!newSocket.connected && mountedRef.current) {
          console.log("⏱️ 연결 타임아웃");
          setIsConnecting(false);
          setError(new Error("연결 시간 초과"));
        }
      }, 5000);
    }

    // 정리 함수
    return () => {
      mountedRef.current = false;

      // 타임아웃 클리어
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // 소켓 정리 (패킷 전송 없이 바로 정리)
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [
    numericPhoneNumber,
    autoConnect,
    serverUrl,
    calculateLatencyStats,
    onSetComplete,
    onFallDetected, // 🆕 의존성 추가
  ]);

  // 레이턴시 통계를 주기적으로 콘솔에 출력
  useEffect(() => {
    const intervalId = setInterval(() => {
      const stats = calculateLatencyStats();
      if (stats && stats.count > 0) {
        console.log("===== 레이턴시 통계 =====");
        console.log(`샘플 수: ${stats.count}`);
        console.log(`최소: ${stats.min.toFixed(2)}ms`);
        console.log(`최대: ${stats.max.toFixed(2)}ms`);
        console.log(`평균: ${stats.avg.toFixed(2)}ms`);
        console.log(`중앙값: ${stats.median.toFixed(2)}ms`);
        console.log(`95 퍼센타일: ${stats.p95.toFixed(2)}ms`);
        console.log("========================");
      }
    }, 10000); // 10초마다 통계 출력

    return () => clearInterval(intervalId);
  }, [calculateLatencyStats]);

  // 서버 URL 변경 함수 (수동 지정이 필요한 경우)
  const setCustomServerUrl = useCallback((url: string) => {
    console.log("서버 URL 변경:", url);
    // serverUrl은 이제 상태로 관리되지 않으므로 이 함수는 더 이상 사용되지 않음
  }, []);

  // 연결 함수
  const connect = useCallback(() => {
    if (!socket) {
      console.error("소켓이 초기화되지 않음");
      return;
    }

    if (socket.connected) {
      console.log("이미 연결됨");
      return;
    }

    if (isConnecting) {
      console.log("이미 연결 중");
      return;
    }

    // 상태 업데이트
    setIsConnecting(true);
    setError(null);
    setConnectionAttempts((prev) => prev + 1);

    // 타임아웃 설정
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (!socket.connected && mountedRef.current) {
        setIsConnecting(false);
        setError(new Error("연결 시간 초과"));
      }
    }, 5000);

    // 소켓 연결
    console.log("🔄 소켓 연결 시도 중...");
    socket.connect();
  }, [socket, isConnecting]);

  // 포즈 데이터 전송 함수
  const sendPose = useCallback(
    (landmarks: Landmark[], requestId?: string): boolean => {
      if (!socket || !isConnected || !mountedRef.current) {
        return false;
      }

      // 전송 속도 제한 (100ms 당 최대 1회)
      const now = Date.now();
      if (now - lastSentRef.current < 100) {
        return false;
      }

      try {
        const finalRequestId =
          requestId || `req_${now}_${Math.floor(Math.random() * 10000)}`;

        latencyRecordsRef.current[finalRequestId] = {
          startTime: performance.now(),
        };

        const data = {
          phoneNumber: numericPhoneNumber,
          exerciseType,
          landmarks,
          requestId: finalRequestId,
        };

        socket.emit("exercise_data", data);
        lastSentRef.current = now;

        console.log(
          "📡 운동 분석 + 낙상 감지 데이터 전송 성공 (exercise_data)"
        ); // ✅ 로그 수정
        return true;
      } catch (err) {
        console.error("데이터 전송 오류:", err);
        return false;
      }
    },
    [socket, isConnected, numericPhoneNumber, exerciseType]
  );

  return {
    isConnected,
    isConnecting,
    connect,
    sendPose,
    processedResult,
    error,
    connectionAttempts,
    serverUrl,
    setCustomServerUrl,
    latencyStats,
  };
};

// NextSetInfo 타입도 export (types/index.ts에서 이미 export되므로 re-export)
export type { NextSetInfo };
