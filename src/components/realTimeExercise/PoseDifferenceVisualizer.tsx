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
 * 사용자 관절 위치에 정확도 상태를 표시하는 시각화 컴포넌트
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
      // 🆕 모든 주요 관절 ID (하체 + 상체 팔 관절 모두 포함)
      const KEY_JOINTS = [
        // 하체 관절
        23,
        24, // 양쪽 고관절
        25,
        26, // 양쪽 무릎
        27,
        28, // 양쪽 발목

        // 상체 관절
        11,
        12, // 양쪽 어깨
        13,
        14, // 양쪽 팔꿈치
        15,
        16, // 양쪽 손목
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

      // 모든 주요 관절에 대해서 정확도 상태 표시
      KEY_JOINTS.forEach((jointId) => {
        const guideLm = guidelineMap[jointId];
        const userLm = userMap[jointId];

        // 사용자 랜드마크가 존재하고 가시성이 충분한 경우에만 표시
        if (!userLm || (userLm.visibility && userLm.visibility < 0.5)) {
          return;
        }

        // 가이드라인 랜드마크도 존재해야 비교 가능
        if (!guideLm || (guideLm.visibility && guideLm.visibility < 0.5)) {
          return;
        }

        // 🔧 수정: 올바른 좌표 변환
        // 사용자 관절 위치 계산 (0~1 정규화된 좌표를 화면 좌표로 변환)
        const userX = userLm.x * canvas.width;
        const userY = userLm.y * canvas.height;

        // 가이드라인 관절 위치 계산 (-1~1 좌표를 화면 좌표로 변환)
        const guideX = ((guideLm.x + 1) / 2) * canvas.width;
        const guideY = ((guideLm.y + 1) / 2) * canvas.height;

        // 두 관절 사이의 거리 계산
        const distance = Math.sqrt(
          Math.pow(userX - guideX, 2) + Math.pow(userY - guideY, 2)
        );

        // 🆕 관절별 목표 구역 반지름 조정 (손목/팔꿈치는 조금 더 작게)
        let targetRadius;
        if ([15, 16].includes(jointId)) {
          // 손목: 화면 크기의 2.5%
          targetRadius = Math.min(canvas.width, canvas.height) * 0.025;
        } else if ([13, 14].includes(jointId)) {
          // 팔꿈치: 화면 크기의 2.8%
          targetRadius = Math.min(canvas.width, canvas.height) * 0.028;
        } else {
          // 기타 관절: 화면 크기의 3%
          targetRadius = Math.min(canvas.width, canvas.height) * 0.03;
        }

        const isInTargetZone = distance <= targetRadius;

        // 맥박 효과 (부드러운 애니메이션)
        const pulsePhase = (Date.now() / 1000) * 3; // 3초 주기
        const pulseMultiplier = 1 + Math.sin(pulsePhase) * 0.2; // 20% 변화
        const currentRadius = targetRadius * pulseMultiplier;

        // 정확도에 따른 색상 결정
        if (isInTargetZone) {
          // 정확한 자세: 초록색
          ctx.fillStyle = "rgba(34, 197, 94, 0.4)"; // 연한 초록색
          ctx.strokeStyle = "rgba(34, 197, 94, 0.8)"; // 진한 초록색
        } else {
          // 부정확한 자세: 거리에 따라 주황색~빨간색 그라데이션
          const maxDistance = Math.min(canvas.width, canvas.height) * 0.15; // 최대 거리
          const normalizedDistance = Math.min(distance / maxDistance, 1);

          if (normalizedDistance < 0.5) {
            // 가까운 거리: 주황색
            ctx.fillStyle = "rgba(251, 146, 60, 0.4)"; // 연한 주황색
            ctx.strokeStyle = "rgba(251, 146, 60, 0.8)"; // 진한 주황색
          } else {
            // 먼 거리: 빨간색
            ctx.fillStyle = "rgba(239, 68, 68, 0.4)"; // 연한 빨간색
            ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // 진한 빨간색
          }
        }

        // 🔧 거울 모드 적용 (MediaPipeVisualizer와 동일하게)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        // 사용자 관절 위치에 상태 원 그리기
        ctx.beginPath();
        ctx.arc(userX, userY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();

        // 테두리 그리기
        ctx.lineWidth = 3;
        ctx.setLineDash([]); // 실선
        ctx.stroke();

        // 중앙에 작은 점 표시 (관절의 정확한 위치)
        ctx.fillStyle = isInTargetZone
          ? "rgba(34, 197, 94, 1)"
          : "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(userX, userY, 4, 0, 2 * Math.PI);
        ctx.fill();

        // 매우 부정확한 경우 가이드라인 방향 힌트 표시
        if (!isInTargetZone && distance > targetRadius * 2) {
          // 사용자 관절에서 가이드라인 방향으로 화살표 표시
          const angle = Math.atan2(guideY - userY, guideX - userX);
          const arrowLength = currentRadius * 0.8;
          const arrowEndX = userX + Math.cos(angle) * arrowLength;
          const arrowEndY = userY + Math.sin(angle) * arrowLength;

          // 화살표 선
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(userX, userY);
          ctx.lineTo(arrowEndX, arrowEndY);
          ctx.stroke();

          // 화살표 머리
          const arrowHeadLength = 8;
          const arrowHeadAngle = Math.PI / 6; // 30도

          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowEndY);
          ctx.lineTo(
            arrowEndX - arrowHeadLength * Math.cos(angle - arrowHeadAngle),
            arrowEndY - arrowHeadLength * Math.sin(angle - arrowHeadAngle)
          );
          ctx.moveTo(arrowEndX, arrowEndY);
          ctx.lineTo(
            arrowEndX - arrowHeadLength * Math.cos(angle + arrowHeadAngle),
            arrowEndY - arrowHeadLength * Math.sin(angle + arrowHeadAngle)
          );
          ctx.stroke();
        }

        // 개발 모드에서만 관절 이름과 거리 표시
        if (
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          const jointNames: Record<number, string> = {
            // 하체
            23: "왼골반",
            24: "오른골반",
            25: "왼무릎",
            26: "오른무릎",
            27: "왼발목",
            28: "오른발목",

            // 상체
            11: "왼어깨",
            12: "오른어깨",
            13: "왼팔꿈치", // ✅ 추가
            14: "오른팔꿈치", // ✅ 추가
            15: "왼손목", // ✅ 추가
            16: "오른손목", // ✅ 추가
          };

          const jointName = jointNames[jointId];
          if (jointName) {
            // 배경
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(userX - 30, userY - currentRadius - 35, 60, 25);

            // 텍스트
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(jointName, userX, userY - currentRadius - 18);
            ctx.fillText(
              `${Math.round(distance)}px`,
              userX,
              userY - currentRadius - 5
            );
          }
        }

        // 🔧 거울 모드 복원
        ctx.restore();
      });

      // 🆕 업데이트된 설명 텍스트 (화면 하단에 작게)
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(10, canvas.height - 100, 350, 90);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        "관절 정확도 (하체+상체 모든 관절):",
        15,
        canvas.height - 80
      );
      ctx.fillText("🟢 초록색 = 정확함", 15, canvas.height - 60);
      ctx.fillText("🟠 주황색 = 조금 벗어남", 15, canvas.height - 40);
      ctx.fillText("🔴 빨간색 = 많이 벗어남", 15, canvas.height - 20);
      ctx.fillText("→ 흰색 화살표 = 이동 방향", 180, canvas.height - 40);
    } catch (error) {
      console.error("사용자 관절 정확도 시각화 중 오류:", error);
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
