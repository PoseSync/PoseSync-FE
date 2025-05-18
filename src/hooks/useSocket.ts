import { useState, useEffect, useCallback, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { Landmark, ProcessedResult } from "../types";

interface UseSocketOptions {
  phoneNumber: string;
  exerciseType: string;
  autoConnect?: boolean;
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
  const { phoneNumber, exerciseType, autoConnect = false } = options;

  // 상태
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [processedResult, setProcessedResult] =
    useState<ProcessedResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [serverUrl, setServerUrl] = useState<string>(getServerUrl());
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

      // 연결 이벤트 전송
      console.log("📤 connection 이벤트 전송:", { phoneNumber });
      newSocket.emit("connection", { phoneNumber });

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

        setProcessedResult(data);
      }
    );

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

      // 소켓 정리
      if (newSocket.connected) {
        console.log("🔌 소켓 연결 해제 중...");
        newSocket.emit("disconnection", { phoneNumber });
        newSocket.disconnect();
      }

      // 이벤트 리스너 제거
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [phoneNumber, autoConnect, serverUrl, calculateLatencyStats]);

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
    setServerUrl(url);
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

  // 연결 해제 함수
  const disconnect = useCallback(() => {
    if (!socket) {
      console.error("소켓이 초기화되지 않음");
      return;
    }

    if (!socket.connected) {
      console.log("이미 연결 해제됨");
      return;
    }

    // 타임아웃 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 연결 해제 이벤트 전송
    console.log("🔌 연결 해제 중...");
    socket.emit("disconnection", { phoneNumber });
    socket.disconnect();
  }, [socket, phoneNumber]);

  // 클라이언트 연결 해제 함수
  const disconnectClient = useCallback(() => {
    if (!socket) return;

    // 서버에 패킷만 날린다
    socket.emit("disconnect_client", { phoneNumber });

    // 실제 연결을 끊는다
    socket.disconnect();
  }, [socket, phoneNumber]);

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
        // 외부에서 requestId를 전달받지 않은 경우 생성
        const finalRequestId =
          requestId || `req_${now}_${Math.floor(Math.random() * 10000)}`;

        // 시작 시간 기록
        latencyRecordsRef.current[finalRequestId] = {
          startTime: performance.now(),
        };

        // 데이터 객체 생성
        const data = {
          phoneNumber,
          exerciseType,
          landmarks,
          requestId: finalRequestId,
        };

        // 데이터 전송
        socket.emit("exercise_data", data);
        lastSentRef.current = now;
        return true;
      } catch (err) {
        console.error("데이터 전송 오류:", err);
        return false;
      }
    },
    [socket, isConnected, phoneNumber, exerciseType]
  );

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    disconnectClient,
    sendPose,
    processedResult,
    error,
    connectionAttempts,
    serverUrl,
    setCustomServerUrl,
    latencyStats,
  };
};

export default useSocket;
