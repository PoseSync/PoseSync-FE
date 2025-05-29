import { useState, useEffect, useCallback, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { Landmark } from "../types";

interface UseFallMonitorSocketOptions {
  phoneNumber: string;
  autoConnect?: boolean;
}

// 🔥 서버 URL 설정 개선
const getServerUrl = () => {
  const hostname = window.location.hostname;

  // 개발 환경 처리
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://127.0.0.1:5001";
  }

  // 운영 환경 처리
  return `http://${hostname}:5001`;
};

export const useFallMonitorSocket = (options: UseFallMonitorSocketOptions) => {
  const { phoneNumber, autoConnect = true } = options;

  // 전화번호에서 숫자만 추출
  const numericPhoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  // 상태
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [fallDetected, setFallDetected] = useState<boolean>(false);

  // 참조
  const mountedRef = useRef<boolean>(true);
  const lastSentRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // 🔥 연결 재시도 함수
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("🚨 낙상 감지 소켓 최대 재연결 시도 초과");
      setError(new Error("낙상 감지 서버에 연결할 수 없습니다"));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // 지수 백오프
    console.log(
      `🔄 ${delay}ms 후 낙상 감지 소켓 재연결 시도 (${
        reconnectAttempts + 1
      }/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && socket && !socket.connected) {
        setReconnectAttempts((prev) => prev + 1);
        socket.connect();
      }
    }, delay);
  }, [reconnectAttempts, socket]);

  // 소켓 초기화
  useEffect(() => {
    mountedRef.current = true;

    const serverUrl = getServerUrl();
    console.log("🔌 낙상 감지 소켓 서버 URL:", serverUrl);

    const newSocket = io(serverUrl, {
      autoConnect: false,
      reconnection: false, // 수동으로 재연결 관리
      transports: ["websocket", "polling"],
      timeout: 10000, // 10초 타임아웃
      forceNew: true, // 새 연결 강제
    });

    // 연결 성공 이벤트 처리
    newSocket.on("connect", () => {
      if (!mountedRef.current) return;

      console.log("🟢 낙상 감지 소켓 연결됨:", newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setReconnectAttempts(0); // 재연결 카운터 리셋

      // 연결 이벤트 전송
      console.log("📤 낙상 감지 connection 이벤트 전송:", {
        phoneNumber: numericPhoneNumber,
      });
      newSocket.emit("connection", { phoneNumber: numericPhoneNumber });
    });

    // 연결 해제 이벤트 처리
    newSocket.on("disconnect", (reason) => {
      if (!mountedRef.current) return;

      console.log("🔴 낙상 감지 소켓 연결 해제됨:", reason);
      setIsConnected(false);

      // 🔥 자동 재연결 시도 (서버 종료가 아닌 경우)
      if (
        reason !== "io server disconnect" &&
        reason !== "io client disconnect"
      ) {
        console.log("🔄 낙상 감지 소켓 자동 재연결 시도");
        attemptReconnect();
      }
    });

    // 연결 오류 처리
    newSocket.on("connect_error", (err) => {
      if (!mountedRef.current) return;

      console.error("❌ 낙상 감지 소켓 연결 오류:", err.message);
      setIsConnecting(false);

      // 🔥 연결 오류 시에도 재연결 시도
      if (reconnectAttempts < maxReconnectAttempts) {
        console.log("🔄 연결 오류로 인한 재연결 시도");
        attemptReconnect();
      } else {
        setError(new Error(`낙상 감지 연결 오류: ${err.message}`));
      }
    });

    // 낙상 감지 결과 수신
    newSocket.on(
      "result",
      (data: { is_fall?: boolean; requestId?: string }) => {
        if (!mountedRef.current) return;

        console.log("🚨 낙상 감지 결과 수신:", data);

        if (data.is_fall === true) {
          console.log("🚨🚨🚨 낙상 감지됨! 🚨🚨🚨");
          setFallDetected(true);
        }
      }
    );

    // 🔥 서버 응답 확인 이벤트
    newSocket.on("connected", (data) => {
      if (!mountedRef.current) return;
      console.log("🟢 낙상 감지 서버 응답 확인:", data);
    });

    setSocket(newSocket);

    // 자동 연결
    if (autoConnect) {
      console.log("🔄 낙상 감지 소켓 자동 연결 시도 중...");
      newSocket.connect();
      setIsConnecting(true);
    }

    // 정리 함수
    return () => {
      mountedRef.current = false;

      // 재연결 타이머 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (newSocket.connected) {
        console.log("🔌 낙상 감지 소켓 연결 해제 중...");
        newSocket.emit("disconnect_monitor", {
          phoneNumber: numericPhoneNumber,
        });
        newSocket.disconnect();
      }

      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [numericPhoneNumber, autoConnect, attemptReconnect]);

  // 연결 함수
  const connect = useCallback(() => {
    if (!socket) {
      console.error("낙상 감지 소켓이 초기화되지 않음");
      return;
    }

    if (socket.connected) {
      console.log("낙상 감지 소켓 이미 연결됨");
      return;
    }

    if (isConnecting) {
      console.log("낙상 감지 소켓 이미 연결 중");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setReconnectAttempts(0);

    console.log("🔄 낙상 감지 소켓 연결 시도 중...");
    socket.connect();
  }, [socket, isConnecting]);

  // 연결 해제 함수
  const disconnect = useCallback(() => {
    if (!socket) {
      console.error("낙상 감지 소켓이 초기화되지 않음");
      return;
    }

    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (!socket.connected) {
      console.log("낙상 감지 소켓 이미 연결 해제됨");
      return;
    }

    console.log("🔌 낙상 감지 소켓 연결 해제 중...");
    socket.emit("disconnect_monitor", { phoneNumber: numericPhoneNumber });
    socket.disconnect();
  }, [socket, numericPhoneNumber]);

  // 🔥 낙상 감지 데이터 전송 함수 (에러 처리 강화)
  const sendFallMonitorData = useCallback(
    (landmarks: Landmark[]): boolean => {
      if (!socket || !isConnected || !mountedRef.current) {
        return false;
      }

      // 전송 속도 제한 (200ms 당 최대 1회)
      const now = Date.now();
      if (now - lastSentRef.current < 200) {
        return false;
      }

      try {
        const requestId = `fall_${now}_${Math.floor(Math.random() * 10000)}`;

        const data = {
          phoneNumber: numericPhoneNumber,
          landmarks,
          requestId,
        };

        // monitor_fall 이벤트로 전송
        socket.emit("monitor_fall", data);
        lastSentRef.current = now;

        return true;
      } catch (err) {
        console.error("낙상 감지 데이터 전송 오류:", err);

        // 전송 오류 시 연결 상태 확인
        if (!socket.connected) {
          console.log("🔄 전송 오류로 인한 재연결 시도");
          attemptReconnect();
        }

        return false;
      }
    },
    [socket, isConnected, numericPhoneNumber, attemptReconnect]
  );

  // 낙상 감지 상태 초기화
  const resetFallDetection = useCallback(() => {
    setFallDetected(false);
  }, []);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendFallMonitorData,
    fallDetected,
    resetFallDetection,
    error,
    reconnectAttempts, // 🔥 재연결 시도 횟수 노출
  };
};
