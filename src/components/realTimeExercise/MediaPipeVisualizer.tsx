import React, { useRef, useEffect } from "react";
import * as drawingUtils from "@mediapipe/drawing_utils";
import * as mpPose from "@mediapipe/pose";
import { mediaPipeLandmarkStabilizer } from "../../utils/filter/LandmarkStabilizer";
import { MediaPipeLandmark } from "../../types";

// MediaPipe 결과 타입 정의
interface PoseLandmarkerResult {
  landmarks?: MediaPipeLandmark[][];
  worldLandmarks?: MediaPipeLandmark[][];
}

// 하체 운동 관련 주요 관절
const LOWER_BODY_KEYPOINTS = [23, 24, 25, 26, 27, 28];

// 상체 관절
const UPPER_BODY_KEYPOINTS = [11, 12, 13, 14, 15, 16];

// 주요 관절 - 더 큰 점으로 표시할 관절들
const KEY_JOINTS = [...LOWER_BODY_KEYPOINTS, ...UPPER_BODY_KEYPOINTS];

interface MediaPipeVisualizerProps {
  videoElement: HTMLVideoElement | null;
  results: PoseLandmarkerResult | null;
  width?: number;
  height?: number;
  showFace?: boolean;
  color?: string; // 색상 지정을 위한 속성 추가
  lineWidth?: number; // 선 두께
  pointSize?: number; // 점 크기
  isGuideline?: boolean; // 가이드라인인지 여부
}

/**
 * MediaPipe 랜드마크를 DrawingUtils를 사용하여 시각화하는 컴포넌트
 * 스타일 향상 버전
 */
const MediaPipeVisualizer: React.FC<MediaPipeVisualizerProps> = ({
  videoElement,
  results,
  width = 640,
  height = 480,
  showFace = false,
  color = "#00FF00", // 기본 색상은 녹색
  lineWidth = 2, // 기본 선 두께
  pointSize = 5, // 기본 점 크기
  isGuideline = false, // 기본적으로 가이드라인이 아님
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 안정화된 랜드마크로 캔버스 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !videoElement ||
      !results ||
      !results.landmarks ||
      results.landmarks.length === 0
    )
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // 캔버스 크기 설정 - 비디오 크기에 맞춤
      canvas.width = videoElement.videoWidth || width;
      canvas.height = videoElement.videoHeight || height;

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 배경을 약간 어둡게 처리 (MediaPipe 스타일)
      if (isGuideline) {
        // 가이드라인은 더 투명하게
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 랜드마크 안정화 적용
      const landmarks = results.landmarks[0];
      let stabilizedLandmarks;
      if (isGuideline) {
        // 가이드라인은 안정화 없이 그대로 사용
        stabilizedLandmarks = landmarks.map((lm) => ({ ...lm })); // 복사본 생성
      } else {
        // 사용자 랜드마크는 안정화 적용
        stabilizedLandmarks =
          mediaPipeLandmarkStabilizer.stabilizeMediaPipeLandmarks(landmarks);
      }

      // MediaPipe 랜드마크를 NormalizedLandmarkList 형식으로 변환
      // DrawingUtils가 기대하는 형식으로 변환
      const landmarksForDrawing = stabilizedLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z || 0,
        visibility: lm.visibility || 1.0,
      }));

      // 필터링된 랜드마크 생성 (얼굴 제외 옵션)
      const filteredLandmarks = showFace
        ? landmarksForDrawing
        : landmarksForDrawing.map((lm, idx) =>
            idx < 11 ? { ...lm, visibility: 0 } : lm
          );

      // 가이드라인 여부에 따른 스타일 설정
      let connectorStyle, pointStyle, shadowBlur;

      if (isGuideline) {
        // 가이드라인 스타일 - 파란색 계열, 글로우 효과
        connectorStyle = "#60a5fa"; // 밝은 파란색
        pointStyle = "#3b82f6"; // 더 진한 파란색
        shadowBlur = 15;

        // 연결선 스타일 설정 (파란색, 점선, 발광 효과)
        const connectorOptions = {
          color: connectorStyle,
          lineWidth: lineWidth * 1.2, // 약간 더 두껍게
          lineType: "dotted" as const, // 점선 스타일
        };

        // 랜드마크 점 스타일 설정 (파란색, 발광 효과)
        const landmarkOptions = {
          color: pointStyle,
          fillColor: pointStyle,
          lineWidth: 1,
          radius: pointSize * 1.2, // 약간 더 크게
        };

        // 가이드라인의 경우 먼저 그림자/글로우 효과 추가
        ctx.shadowColor = "#60a5fa"; // 파란색 글로우
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // DrawingUtils를 사용하여 연결선 그리기
        drawingUtils.drawConnectors(
          ctx,
          filteredLandmarks,
          mpPose.POSE_CONNECTIONS,
          connectorOptions
        );

        // DrawingUtils를 사용하여 랜드마크 그리기
        drawingUtils.drawLandmarks(ctx, filteredLandmarks, landmarkOptions);

        // 그림자 효과 제거 (다음 그리기에 영향 없게)
        ctx.shadowBlur = 0;
      } else {
        // 일반 랜드마크 스타일 - 녹색 계열, 더 선명한 선
        connectorStyle = "#4ade80"; // 밝은 녹색
        pointStyle = "#22c55e"; // 더 진한 녹색
        shadowBlur = 8;

        // 연결선 스타일 설정 (녹색, 실선)
        const connectorOptions = {
          color: connectorStyle,
          lineWidth: lineWidth,
        };

        // 랜드마크 점 스타일 설정 (녹색, 약간의 발광 효과)
        const landmarkOptions = {
          color: pointStyle,
          fillColor: pointStyle,
          lineWidth: 1,
          radius: pointSize,
        };

        // 일반 랜드마크의 경우 더 약한 그림자 효과
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // DrawingUtils를 사용하여 연결선 그리기
        drawingUtils.drawConnectors(
          ctx,
          filteredLandmarks,
          mpPose.POSE_CONNECTIONS,
          connectorOptions
        );

        // DrawingUtils를 사용하여 랜드마크 그리기
        drawingUtils.drawLandmarks(ctx, filteredLandmarks, landmarkOptions);

        // 그림자 효과 제거
        ctx.shadowBlur = 0;
      }

      // 추가 시각적 효과: 주요 관절에 원형 강조 표시
      KEY_JOINTS.forEach((idx) => {
        const lm = filteredLandmarks[idx];
        if (lm && lm.visibility && lm.visibility > 0.5) {
          // 주요 관절 주변에 투명한 원 추가
          ctx.beginPath();
          ctx.arc(
            lm.x * canvas.width,
            lm.y * canvas.height,
            isGuideline ? pointSize * 2.5 : pointSize * 2,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = isGuideline
            ? "rgba(59, 130, 246, 0.2)" // 파란색 반투명
            : "rgba(34, 197, 94, 0.2)"; // 녹색 반투명
          ctx.fill();

          // 관절 ID 표시 (디버깅용, 선택적)
          if (!isGuideline) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "12px Arial";
            ctx.fillText(
              String(idx),
              lm.x * canvas.width + 6,
              lm.y * canvas.height - 6
            );
          }
        }
      });
    } catch (error) {
      console.error("MediaPipeVisualizer 그리기 오류:", error);
    }
  }, [
    videoElement,
    results,
    width,
    height,
    showFace,
    color,
    lineWidth,
    pointSize,
    isGuideline,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      width={width}
      height={height}
    />
  );
};

export default MediaPipeVisualizer;
