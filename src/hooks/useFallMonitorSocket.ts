import { useState, useEffect, useCallback, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { Landmark } from "../types";

interface UseFallMonitorSocketOptions {
  phoneNumber: string;
  autoConnect?: boolean;
}

// 서버 URL 설정
const getServerUrl = () => {
  const hostname = window.location.hostname;
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

  // 소켓 초기화
  useEffect(() => {
    mountedRef.current = true;

    const serverUrl = getServerUrl();
    console.log("🔌 낙상 감지 소켓 서버 URL:", serverUrl);

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

      console.log("🟢 낙상 감지 소켓 연결됨:", newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

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
    });

    // 연결 오류 처리
    newSocket.on("connect_error", (err) => {
      if (!mountedRef.current) return;

      console.error("❌ 낙상 감지 소켓 연결 오류:", err.message);
      setError(new Error(`낙상 감지 연결 오류: ${err.message}`));
      setIsConnecting(false);
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

      // 🎯 중요: disconnect_client 패킷 제거, disconnect_monitor만 전송
      if (newSocket.connected) {
        console.log("🔌 낙상 감지 소켓 연결 해제 중...");
        newSocket.emit("disconnect_monitor", {
          phoneNumber: numericPhoneNumber,
        });
        newSocket.disconnect();
      }

      // 소켓 정리
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [numericPhoneNumber, autoConnect]);

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

    console.log("🔄 낙상 감지 소켓 연결 시도 중...");
    socket.connect();
  }, [socket, isConnecting]);

  // 연결 해제 함수 (수동 호출용)
  const disconnect = useCallback(() => {
    if (!socket) {
      console.error("낙상 감지 소켓이 초기화되지 않음");
      return;
    }

    if (!socket.connected) {
      console.log("낙상 감지 소켓 이미 연결 해제됨");
      return;
    }

    console.log("🔌 낙상 감지 소켓 수동 연결 해제 중...");
    // 🎯 disconnect_monitor만 전송 (disconnect_client 제거)
    socket.emit("disconnect_monitor", { phoneNumber: numericPhoneNumber });
    socket.disconnect();
  }, [socket, numericPhoneNumber]);

  // 낙상 감지 데이터 전송 함수
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

        socket.emit("monitor_fall", data);
        lastSentRef.current = now;

        console.log("📡 낙상 감지 전용 데이터 전송 성공 (monitor_fall)");
        return true;
      } catch (err) {
        console.error("낙상 감지 데이터 전송 오류:", err);
        return false;
      }
    },
    [socket, isConnected, numericPhoneNumber]
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
  };
};
