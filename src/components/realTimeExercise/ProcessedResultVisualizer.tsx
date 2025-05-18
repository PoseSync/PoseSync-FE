import React, { useRef, useEffect, useState } from "react";
import { TransformedLandmark } from "../../types";
import { processedLandmarkStabilizer } from "../../utils/filter/LandmarkStabilizer";

// MediaPipe 포즈 랜드마크 연결점 (얼굴 부분 제외)
const POSE_CONNECTIONS = [
  // 몸통 (얼굴 관련 연결점 제외)
  [11, 12], // 왼쪽 어깨에서 오른쪽 어깨
  [11, 13], // 왼쪽 어깨에서 왼쪽 팔꿈치
  [13, 15], // 왼쪽 팔꿈치에서 왼쪽 손목
  [12, 14], // 오른쪽 어깨에서 오른쪽 팔꿈치
  [14, 16], // 오른쪽 팔꿈치에서 오른쪽 손목
  [11, 23], // 왼쪽 어깨에서 왼쪽 고관절
  [12, 24], // 오른쪽 어깨에서 오른쪽 고관절
  [23, 24], // 왼쪽 고관절에서 오른쪽 고관절
  [23, 25], // 왼쪽 고관절에서 왼쪽 무릎
  [25, 27], // 왼쪽 무릎에서 왼쪽 발목
  [27, 29], // 왼쪽 발목에서 왼쪽 발뒤꿈치
  [27, 31], // 왼쪽 발목에서 왼쪽 발가락
  [31, 29], // 왼쪽 발가락에서 왼쪽 발뒤꿈치
  [24, 26], // 오른쪽 고관절에서 오른쪽 무릎
  [26, 28], // 오른쪽 무릎에서 오른쪽 발목
  [28, 30], // 오른쪽 발목에서 오른쪽 발뒤꿈치
  [28, 32], // 오른쪽 발목에서 오른쪽 발가락
  [32, 30], // 오른쪽 발가락에서 오른쪽 발뒤꿈치
];

// 주요 신체 관절 ID 목록
const KEY_JOINTS = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

interface ProcessedResultVisualizerProps {
  videoElement: HTMLVideoElement | null;
  processedLandmarks: TransformedLandmark[];
  width?: number;
  height?: number;
  showFace?: boolean;
  color?: string;
}

const ProcessedResultVisualizer: React.FC<ProcessedResultVisualizerProps> = ({
  videoElement,
  processedLandmarks,
  width = 640,
  height = 480,
  showFace = false,
  color = "#0000FF", // 기본 색상은 파란색
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stabilizedLandmarks, setStabilizedLandmarks] = useState<
    TransformedLandmark[]
  >([]);

  // 랜드마크 안정화 적용
  useEffect(() => {
    if (!processedLandmarks || processedLandmarks.length === 0) {
      return;
    }

    // 안정화 필터 적용
    const stabilized =
      processedLandmarkStabilizer.stabilizeProcessedLandmarks(
        processedLandmarks
      );
    setStabilizedLandmarks(stabilized);
  }, [processedLandmarks]);

  // 캔버스에 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !videoElement ||
      !stabilizedLandmarks ||
      stabilizedLandmarks.length === 0
    )
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // 캔버스 크기 설정
      canvas.width = videoElement.videoWidth || width;
      canvas.height = videoElement.videoHeight || height;

      // 캔버스 초기화 (투명하게 유지)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 서버에서 처리된 랜드마크를 2D 화면 좌표로 변환
      const displayLandmarks = stabilizedLandmarks.map((landmark) => {
        // 서버에서 처리된 랜드마크는 -1~1 범위이므로 0~1 범위로 변환
        return {
          ...landmark,
          x: (landmark.x + 1) / 2, // -1~1 -> 0~1
          y: (landmark.y + 1) / 2, // -1~1 -> 0~1
        };
      });

      // id를 키로 사용하는 맵 생성
      const landmarkMap: Record<number, TransformedLandmark> = {};
      for (const landmark of displayLandmarks) {
        landmarkMap[landmark.id] = landmark;
      }

      // 연결선 그리기
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const startLandmark = landmarkMap[startIdx];
        const endLandmark = landmarkMap[endIdx];

        if (!startLandmark || !endLandmark) return;

        const startVisibility = startLandmark.visibility ?? 1.0;
        const endVisibility = endLandmark.visibility ?? 1.0;

        // 가시성 체크 (임계값: 0.5)
        if (startVisibility < 0.5 || endVisibility < 0.5) return;

        // 얼굴 관련 랜드마크 필터링
        if (!showFace && (startIdx < 11 || endIdx < 11)) return;

        ctx.beginPath();
        ctx.moveTo(
          startLandmark.x * canvas.width,
          startLandmark.y * canvas.height
        );
        ctx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height);
        ctx.stroke();
      });

      // 랜드마크 그리기
      for (const [idStr, landmark] of Object.entries(landmarkMap)) {
        const id = parseInt(idStr);

        // 가시성 체크
        const visibility = landmark.visibility ?? 1.0;
        if (visibility < 0.5) continue;

        // 얼굴 관련 랜드마크 필터링
        if (!showFace && id < 11) continue;

        // 키 관절 여부에 따라 크기 결정
        const isKeyJoint = KEY_JOINTS.includes(id);
        const radius = isKeyJoint ? 5 : 3;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          radius,
          0,
          2 * Math.PI
        );
        ctx.fill();

        // 주요 관절 ID 표시
        if (isKeyJoint) {
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "10px Arial";
          ctx.fillText(
            String(id),
            landmark.x * canvas.width + 5,
            landmark.y * canvas.height - 5
          );
        }
      }

      console.log(`서버 처리 결과 시각화 완료 (색상: ${color})`);
    } catch (error) {
      console.error("서버 처리 결과 시각화 오류:", error);
    }
  }, [videoElement, stabilizedLandmarks, width, height, showFace, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      width={width}
      height={height}
    />
  );
};

export default ProcessedResultVisualizer;
