import React, { useRef, useEffect } from "react";
import { Landmark } from "../../types";

interface PoseDifferenceVisualizerProps {
  videoElement: HTMLVideoElement | null;
  userLandmarks: Landmark[];
  guidelineLandmarks: Landmark[];
  width?: number;
  height?: number;
}

/**
 * 목표 구역 방식으로 사용자가 가이드라인에 맞추도록 도와주는 시각화 컴포넌트
 * 가이드라인 관절 주변에 보라색 반투명 원을 표시하여 목표 구역을 나타냄
 */
const PoseDifferenceVisualizer: React.FC<PoseDifferenceVisualizerProps> = ({
  videoElement,
  userLandmarks,
  guidelineLandmarks,
  width = 640,
  height = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !videoElement ||
      !userLandmarks.length ||
      !guidelineLandmarks.length
    )
      return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // 주요 관절 ID (하체 중심 - 운동에서 가장 중요한 부분)
      const KEY_JOINTS = [
        23,
        24, // 양쪽 고관절
        25,
        26, // 양쪽 무릎
        27,
        28, // 양쪽 발목
        11,
        12, // 양쪽 어깨 (상체 운동 시)
      ];

      // 캔버스 크기 설정
      canvas.width = videoElement.videoWidth || width;
      canvas.height = videoElement.videoHeight || height;

      // 캔버스 초기화 (투명하게 유지)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 가이드라인 랜드마크 매핑 생성
      const guidelineMap: Record<number, Landmark> = {};
      guidelineLandmarks.forEach((lm) => {
        if (lm.id !== undefined) {
          guidelineMap[lm.id] = lm;
        }
      });

      // 사용자 랜드마크 매핑 생성
      const userMap: Record<number, Landmark> = {};
      userLandmarks.forEach((lm) => {
        if (lm.id !== undefined) {
          userMap[lm.id] = lm;
        }
      });

      // 주요 관절에 대해서만 목표 구역 표시
      KEY_JOINTS.forEach((jointId) => {
        const guideLm = guidelineMap[jointId];
        const userLm = userMap[jointId];

        // 가이드라인 랜드마크가 존재하고 가시성이 충분한 경우에만 표시
        if (!guideLm || (guideLm.visibility && guideLm.visibility < 0.5)) {
          return;
        }

        // 좌표 변환 (정규화된 좌표를 화면 좌표로 변환)
        const guideX = ((guideLm.x + 1) / 2) * canvas.width;
        const guideY = ((guideLm.y + 1) / 2) * canvas.height;

        // 사용자 랜드마크가 있는 경우 거리 계산
        let isInTargetZone = false;
        if (userLm && userLm.visibility && userLm.visibility > 0.5) {
          const userX = ((userLm.x + 1) / 2) * canvas.width;
          const userY = ((userLm.y + 1) / 2) * canvas.height;

          const distance = Math.sqrt(
            Math.pow(userX - guideX, 2) + Math.pow(userY - guideY, 2)
          );

          // 목표 구역 반지름 (화면 크기의 2.5%)
          const targetRadius = Math.min(canvas.width, canvas.height) * 0.025;
          isInTargetZone = distance <= targetRadius;
        }

        // 목표 구역 크기 설정 (화면 크기에 비례)
        const baseRadius = Math.min(canvas.width, canvas.height) * 0.025; // 2.5%

        // 맥박 효과 (부드러운 애니메이션)
        const pulsePhase = (Date.now() / 1000) * 2; // 2초 주기
        const pulseMultiplier = 1 + Math.sin(pulsePhase) * 0.15; // 15% 변화
        const currentRadius = baseRadius * pulseMultiplier;

        // 목표 구역이 달성된 경우와 아닌 경우 다른 색상
        if (isInTargetZone) {
          // 목표 달성: 연한 초록색 (성공 느낌이지만 너무 강하지 않게)
          ctx.fillStyle = "rgba(34, 197, 94, 0.2)"; // 연한 초록색
          ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        } else {
          // 목표 미달성: 보라색 (기존 녹색/파란색과 구별되는 색상)
          ctx.fillStyle = "rgba(168, 85, 247, 0.25)"; // 보라색 반투명
          ctx.strokeStyle = "rgba(168, 85, 247, 0.7)";
        }

        // 목표 구역 원 그리기
        ctx.beginPath();
        ctx.arc(guideX, guideY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();

        // 테두리 그리기 (점선으로 목표 구역임을 명확히)
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]); // 점선 패턴
        ctx.stroke();

        // 중앙에 작은 십자선 표시 (정확한 목표 지점 표시)
        ctx.setLineDash([]); // 실선으로 복원
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = isInTargetZone
          ? "rgba(34, 197, 94, 0.8)"
          : "rgba(168, 85, 247, 0.8)";

        const crossSize = currentRadius * 0.4;
        ctx.beginPath();
        // 가로선
        ctx.moveTo(guideX - crossSize, guideY);
        ctx.lineTo(guideX + crossSize, guideY);
        // 세로선
        ctx.moveTo(guideX, guideY - crossSize);
        ctx.lineTo(guideX, guideY + crossSize);
        ctx.stroke();

        // 개발 모드에서만 관절 이름 표시 (런타임 체크로 변경)
        if (
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          const jointNames: Record<number, string> = {
            23: "왼골반",
            24: "오른골반",
            25: "왼무릎",
            26: "오른무릎",
            27: "왼발목",
            28: "오른발목",
            11: "왼어깨",
            12: "오른어깨",
          };

          const jointName = jointNames[jointId];
          if (jointName) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(jointName, guideX, guideY - currentRadius - 8);
          }
        }
      });

      // 설명 텍스트 (화면 하단에 작게)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, canvas.height - 60, 300, 50);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("보라색 원 안에 관절을 맞춰주세요", 15, canvas.height - 35);
      ctx.fillText("초록색 = 목표 달성!", 15, canvas.height - 15);
    } catch (error) {
      console.error("목표 구역 시각화 중 오류:", error);
    }
  }, [videoElement, userLandmarks, guidelineLandmarks, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      width={width}
      height={height}
    />
  );
};

export default PoseDifferenceVisualizer;
