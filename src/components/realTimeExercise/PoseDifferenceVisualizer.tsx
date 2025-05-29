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
 * 사용자 관절 위치에 부정확한 자세만 표시하는 시각화 컴포넌트
 * 정확한 자세는 원을 표시하지 않고, 부정확한 자세만 주황색 원으로 표시
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
      // 모든 주요 관절 ID (하체 + 상체 팔 관절)
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

      // 부정확한 자세만 표시
      KEY_JOINTS.forEach((jointId) => {
        const guideLm = guidelineMap[jointId];
        const userLm = userMap[jointId];

        // 사용자 랜드마크가 존재하고 가시성이 충분한 경우에만 체크
        if (!userLm || (userLm.visibility && userLm.visibility < 0.5)) {
          return;
        }

        // 가이드라인 랜드마크도 존재해야 비교 가능
        if (!guideLm || (guideLm.visibility && guideLm.visibility < 0.5)) {
          return;
        }

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

        // 관절별 허용 오차 반지름 설정
        let toleranceRadius;
        if ([15, 16].includes(jointId)) {
          // 손목: 조금 더 관대하게
          toleranceRadius = Math.min(canvas.width, canvas.height) * 0.035;
        } else if ([13, 14].includes(jointId)) {
          // 팔꿈치: 중간 정도
          toleranceRadius = Math.min(canvas.width, canvas.height) * 0.032;
        } else {
          // 기타 관절: 기본값
          toleranceRadius = Math.min(canvas.width, canvas.height) * 0.03;
        }

        // ⭐ 핵심 변경: 허용 오차를 벗어난 경우에만 원 표시
        const isInaccurate = distance > toleranceRadius;

        if (isInaccurate) {
          // 거리에 따른 원 크기 및 투명도 조정
          const maxDistance = Math.min(canvas.width, canvas.height) * 0.15;
          const normalizedDistance = Math.min(distance / maxDistance, 1);

          // 맥박 효과
          const pulsePhase = (Date.now() / 1000) * 4; // 4초 주기로 빠르게
          const pulseMultiplier = 1 + Math.sin(pulsePhase) * 0.3; // 30% 변화
          const currentRadius =
            toleranceRadius * (1 + normalizedDistance * 0.5) * pulseMultiplier;

          // 💡 기존 색상과 겹치지 않는 주황색 계열 사용
          // 녹색(사용자): #4ade80, 파란색(가이드라인): #60a5fa
          // 주황색 계열로 차별화
          const alpha = 0.4 + normalizedDistance * 0.3; // 거리에 따라 투명도 증가

          ctx.fillStyle = `rgba(255, 140, 0, ${alpha})`; // 주황색 반투명
          ctx.strokeStyle = `rgba(255, 100, 0, 0.8)`; // 진한 주황색 테두리

          // 거울 모드 적용
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);

          // 부정확한 자세 표시 원 그리기
          ctx.beginPath();
          ctx.arc(userX, userY, currentRadius, 0, 2 * Math.PI);
          ctx.fill();

          // 테두리 그리기
          ctx.lineWidth = 3;
          ctx.setLineDash([]); // 실선
          ctx.stroke();

          // 중앙에 경고 표시 (!)
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.font = `${Math.max(16, currentRadius * 0.4)}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("!", userX, userY);

          // 매우 부정확한 경우 방향 힌트 표시
          if (distance > toleranceRadius * 2) {
            const angle = Math.atan2(guideY - userY, guideX - userX);
            const arrowLength = currentRadius * 0.6;
            const arrowEndX = userX + Math.cos(angle) * arrowLength;
            const arrowEndY = userY + Math.sin(angle) * arrowLength;

            // 화살표 선
            ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(userX, userY);
            ctx.lineTo(arrowEndX, arrowEndY);
            ctx.stroke();

            // 화살표 머리
            const arrowHeadLength = 12;
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
              23: "왼골반",
              24: "오른골반",
              25: "왼무릎",
              26: "오른무릎",
              27: "왼발목",
              28: "오른발목",
              11: "왼어깨",
              12: "오른어깨",
              13: "왼팔꿈치",
              14: "오른팔꿈치",
              15: "왼손목",
              16: "오른손목",
            };

            const jointName = jointNames[jointId];
            if (jointName) {
              // 배경
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(userX - 35, userY - currentRadius - 40, 70, 30);

              // 텍스트
              ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
              ctx.font = "12px Arial";
              ctx.textAlign = "center";
              ctx.fillText(jointName, userX, userY - currentRadius - 25);
              ctx.fillText(
                `${Math.round(distance)}px`,
                userX,
                userY - currentRadius - 10
              );
            }
          }

          ctx.restore();
        }
        // ⭐ 정확한 자세는 아무것도 표시하지 않음 (원 없음)
      });

      // 업데이트된 설명 텍스트 (화면 하단)
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(10, canvas.height - 70, 320, 60);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("자세 교정 가이드:", 15, canvas.height - 50);
      ctx.fillText("🟠 주황색 원 = 교정 필요", 15, canvas.height - 30);
      ctx.fillText("→ 흰색 화살표 = 이동 방향", 15, canvas.height - 10);
    } catch (error) {
      console.error("자세 차이 시각화 중 오류:", error);
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
