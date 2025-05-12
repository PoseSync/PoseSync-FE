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
 * 실시간 랜드마크와 가이드라인 랜드마크 간의 차이를 시각적으로 표시하는 컴포넌트
 * 더 시각적으로 향상된 버전
 */
const PoseDifferenceVisualizer: React.FC<PoseDifferenceVisualizerProps> = ({
  videoElement,
  userLandmarks,
  guidelineLandmarks,
  width = 640,
  height = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 주요 관절 ID (스쿼트에 중요한 부분)
  const KEY_JOINTS = [
    23,
    24,
    25,
    26,
    27,
    28, // 고관절, 무릎, 발목
    11,
    12,
    13,
    14,
    15,
    16, // 어깨, 팔꿈치, 손목
  ];

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
      // 캔버스 크기 설정
      canvas.width = videoElement.videoWidth || width;
      canvas.height = videoElement.videoHeight || height;

      // 캔버스 초기화 (투명하게 유지)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 랜드마크 매핑 생성
      const userMap: Record<number, Landmark> = {};
      userLandmarks.forEach((lm, index) => {
        userMap[index] = lm;
      });

      const guidelineMap: Record<number, Landmark> = {};
      guidelineLandmarks.forEach((lm, index) => {
        guidelineMap[index] = lm;
      });

      // 차이 표시
      KEY_JOINTS.forEach((jointId) => {
        const userLm = userMap[jointId];
        const guideLm = guidelineMap[jointId];

        if (
          !userLm ||
          !guideLm ||
          (userLm.visibility && userLm.visibility < 0.5) ||
          (guideLm.visibility && guideLm.visibility < 0.5)
        ) {
          return;
        }

        // 좌표 변환 (정규화된 좌표를 화면 좌표로 변환)
        const userX = ((userLm.x + 1) / 2) * canvas.width;
        const userY = ((userLm.y + 1) / 2) * canvas.height;
        const guideX = ((guideLm.x + 1) / 2) * canvas.width;
        const guideY = ((guideLm.y + 1) / 2) * canvas.height;

        // 거리 계산
        const distance = Math.sqrt(
          Math.pow(userX - guideX, 2) + Math.pow(userY - guideY, 2)
        );

        // 유의미한 차이가 있는 경우에만 표시 (화면의 2% 이상 차이)
        const threshold = Math.min(canvas.width, canvas.height) * 0.02;
        if (distance > threshold) {
          // 시각적 효과 개선: 그라데이션과 그림자 추가

          // 거리에 따른 색상 지정 (초록→노랑→빨강)
          const maxDistance = Math.min(canvas.width, canvas.height) * 0.2; // 최대 거리(20%)
          const normalizedDistance = Math.min(1, distance / maxDistance);

          // 색상 보간: 초록(0) → 노랑(0.5) → 빨강(1)
          let color;
          if (normalizedDistance < 0.5) {
            // 초록 → 노랑
            const t = normalizedDistance * 2; // 0~1로 정규화
            color = `rgba(${Math.floor(255 * t)}, 255, 0, 0.7)`;
          } else {
            // 노랑 → 빨강
            const t = (normalizedDistance - 0.5) * 2; // 0~1로 정규화
            color = `rgba(255, ${Math.floor(255 * (1 - t))}, 0, 0.7)`;
          }

          // 선 그리기 (그림자 효과 추가)
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 + normalizedDistance * 3; // 차이가 클수록 더 두꺼운 선

          // 점선 효과 (움직임 애니메이션 효과)
          ctx.setLineDash([5, 3]);
          const offset = (-Date.now() / 50) % 8;
          ctx.lineDashOffset = offset;

          ctx.beginPath();
          ctx.moveTo(userX, userY);
          ctx.lineTo(guideX, guideY);
          ctx.stroke();

          // 선 대시 효과 초기화
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;

          // 화살표 그리기 (사용자에서 가이드라인 방향으로)
          const arrowSize = 8 + normalizedDistance * 4; // 차이가 클수록 더 큰 화살표
          const angle = Math.atan2(guideY - userY, guideX - userX);

          // 화살표 표시 (퍼센트 블렌딩 효과)
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(
            guideX - arrowSize * Math.cos(angle - Math.PI / 6),
            guideY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(guideX, guideY);
          ctx.lineTo(
            guideX - arrowSize * Math.cos(angle + Math.PI / 6),
            guideY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.fill();

          // 차이를 텍스트로 표시
          const pixelDistance = Math.round(distance);
          const centerX = (userX + guideX) / 2;
          const centerY = (userY + guideY) / 2;

          ctx.font = "bold 12px Arial";

          // 텍스트 배경 (더 멋진 버전)
          const textWidth = ctx.measureText(`${pixelDistance}px`).width;
          const padding = 4;
          const textBgHeight = 16;

          // 반투명 배경 그라데이션
          const gradient = ctx.createLinearGradient(
            centerX - textWidth / 2 - padding,
            centerY,
            centerX + textWidth / 2 + padding,
            centerY
          );
          gradient.addColorStop(0, "rgba(0, 0, 0, 0.7)");
          gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.8)");
          gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");

          ctx.fillStyle = gradient;
          // 둥근 모서리 사각형
          const radius = 4;
          const bgX = centerX - textWidth / 2 - padding;
          const bgY = centerY - textBgHeight / 2;
          const bgWidth = textWidth + padding * 2;
          const bgHeight = textBgHeight;

          ctx.beginPath();
          ctx.moveTo(bgX + radius, bgY);
          ctx.lineTo(bgX + bgWidth - radius, bgY);
          ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
          ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
          ctx.quadraticCurveTo(
            bgX + bgWidth,
            bgY + bgHeight,
            bgX + bgWidth - radius,
            bgY + bgHeight
          );
          ctx.lineTo(bgX + radius, bgY + bgHeight);
          ctx.quadraticCurveTo(
            bgX,
            bgY + bgHeight,
            bgX,
            bgY + bgHeight - radius
          );
          ctx.lineTo(bgX, bgY + radius);
          ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
          ctx.closePath();
          ctx.fill();

          // 텍스트 그림자 효과
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          // 텍스트
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${pixelDistance}px`, centerX, centerY);

          // 그림자 초기화
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // 관절 강조 효과
          // 사용자 관절에 표시
          const pulseEffect = Math.sin(Date.now() / 300) * 0.2 + 0.8; // 시간에 따른 펄스 효과 (0.6-1.0)
          const circleRadius = 5 + normalizedDistance * 5; // 거리에 따라 크기 조정

          // 외부 발광 원
          const glowGradient = ctx.createRadialGradient(
            userX,
            userY,
            0,
            userX,
            userY,
            circleRadius * 2
          );
          glowGradient.addColorStop(0, color.replace("0.7", "0.6"));
          glowGradient.addColorStop(0.5, color.replace("0.7", "0.3"));
          glowGradient.addColorStop(1, color.replace("0.7", "0"));

          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(userX, userY, circleRadius * 2 * pulseEffect, 0, 2 * Math.PI);
          ctx.fill();

          // 내부 원
          ctx.fillStyle = color.replace("0.7", "0.9");
          ctx.beginPath();
          ctx.arc(userX, userY, circleRadius * 0.7, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    } catch (error) {
      console.error("포즈 차이 시각화 중 오류:", error);
    }
  }, [
    videoElement,
    userLandmarks,
    guidelineLandmarks,
    width,
    height,
    KEY_JOINTS,
  ]);

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
