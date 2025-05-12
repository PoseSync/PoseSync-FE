import { Socket } from "socket.io-client";
import { SocketData, ProcessedResult } from "../../types";

// 서버 URL (올바른 포트)
export const SERVER_URL = "http://223.194.130.87:5001";

// 소켓 인스턴스 생성 함수
export const createSocket = (socket: Socket): Socket => {
  console.log("소켓 설정 중:", SERVER_URL);

  // 기본 이벤트 로깅
  socket.onAny((event, ...args) => {
    console.log(`소켓 이벤트 수신: ${event}`, args.length > 0 ? args : "");
  });

  return socket;
};

// 소켓 연결 설정
export const connectSocket = (socket: Socket, phoneNumber: string): void => {
  if (!socket) {
    console.error("소켓이 유효하지 않음");
    return;
  }

  if (socket.connected) {
    console.log("이미 연결됨, ID:", socket.id);
    // 이미 연결된 경우 연결 정보 다시 전송
    socket.emit("connection", { phoneNumber });
    return;
  }

  console.log("소켓 연결 시도 중:", phoneNumber);
  // 연결 시도
  socket.connect();
};

// 소켓 연결 해제
export const disconnectSocket = (socket: Socket, phoneNumber: string): void => {
  if (!socket) {
    console.error("소켓이 유효하지 않음");
    return;
  }

  if (!socket.connected) {
    console.log("이미 연결 해제됨");
    return;
  }

  try {
    // 연결 해제 이벤트 전송
    socket.emit("disconnection", { phoneNumber });
    console.log("연결 해제 이벤트 전송됨");

    // 소켓 연결 해제
    socket.disconnect();
    console.log("소켓 연결 해제됨");
  } catch (error) {
    console.error("소켓 연결 해제 중 오류:", error);
  }
};

// 포즈 데이터 전송
export const sendPoseData = (socket: Socket, data: SocketData): boolean => {
  if (!socket || !socket.connected) {
    console.warn("소켓이 연결되어 있지 않음, 데이터 전송 불가");
    return false;
  }

  try {
    socket.emit("exercise_data", data);
    return true;
  } catch (error) {
    console.error("데이터 전송 중 오류:", error);
    return false;
  }
};

// 결과 수신 이벤트 리스너 설정
export const setupResultListener = (
  socket: Socket,
  callback: (result: ProcessedResult) => void
): void => {
  if (!socket) return;

  // 기존 리스너 제거
  socket.off("result");

  // 새 리스너 등록
  socket.on("result", (data: ProcessedResult) => {
    console.log("서버로부터 결과 수신");
    callback(data);
  });
};

// 에러 이벤트 리스너 설정
export const setupErrorListener = (
  socket: Socket,
  callback: (error: Error) => void
): void => {
  if (!socket) return;

  // 기존 리스너 제거
  socket.off("connect_error");
  socket.off("error");

  // 연결 오류
  socket.on("connect_error", (error: Error) => {
    console.error("소켓 연결 오류:", error.message);
    callback(error);
  });

  // 일반 오류
  socket.on("error", (error: Error) => {
    console.error("소켓 오류:", error.message);
    callback(error);
  });
};
