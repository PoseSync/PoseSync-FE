import React, { useState, useEffect, useRef } from "react";
import { Landmark } from "../../types";
import { POSE_LANDMARKS_NAMES } from "../../utils/pose/poseUtils";

interface LandmarkComparisonViewProps {
  userLandmarks: Landmark[];
  guidelineLandmarks: Landmark[];
  isOpen: boolean;
  onClose: () => void;
}

// 차이 계산 결과 인터페이스 정의
interface LandmarkDifference {
  id: number;
  name: string;
  xDiff: number;
  yDiff: number;
  zDiff: number;
  distance: number;
  xDiffPercent: number;
  yDiffPercent: number;
  zDiffPercent: number;
  distancePercent: number;
  significant: boolean;
}

/**
 * 실시간 랜드마크와 가이드라인 랜드마크 간의 차이를 보여주는 창 컴포넌트
 */
const LandmarkComparisonView: React.FC<LandmarkComparisonViewProps> = ({
  userLandmarks,
  guidelineLandmarks,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedJoints, setSelectedJoints] = useState<number[]>([
    11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
  ]); // 주요 관절 기본 선택

  // 랜드마크 간의 차이 계산
  const calculateDifferences = (): LandmarkDifference[] => {
    if (!userLandmarks.length || !guidelineLandmarks.length) {
      return [];
    }

    const differences: LandmarkDifference[] = [];

    // 선택된 관절만 비교
    for (const id of selectedJoints) {
      const userLandmark = userLandmarks.find((lm) => lm.id === id);
      const guidelineLandmark = guidelineLandmarks.find((lm) => lm.id === id);

      if (userLandmark && guidelineLandmark) {
        const xDiff = userLandmark.x - guidelineLandmark.x;
        const yDiff = userLandmark.y - guidelineLandmark.y;
        const zDiff = userLandmark.z - guidelineLandmark.z;

        // 3D 거리 계산
        const distance = Math.sqrt(
          xDiff * xDiff + yDiff * yDiff + zDiff * zDiff
        );

        const landmarkName = POSE_LANDMARKS_NAMES[id] || `랜드마크 ${id}`;

        // 정규화된 값 (-1~1)을 퍼센트로 변환 (차이를 더 쉽게 이해하기 위함)
        const xDiffPercent = Math.abs(xDiff) * 50; // -1~1 범위의 차이를 0~100% 범위로 변환
        const yDiffPercent = Math.abs(yDiff) * 50;
        const zDiffPercent = Math.abs(zDiff) * 50;
        const distancePercent = distance * 50;

        differences.push({
          id,
          name: landmarkName,
          xDiff,
          yDiff,
          zDiff,
          distance,
          xDiffPercent,
          yDiffPercent,
          zDiffPercent,
          distancePercent,
          significant: distance > 0.1, // 10% 이상 차이나면 유의미한 차이로 간주
        });
      }
    }

    return differences;
  };

  const differences = calculateDifferences();

  // 유의미한 차이가 있는 랜드마크만 필터링
  const significantDifferences = differences.filter((diff) => diff.significant);

  // 캔버스에 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, width, height);

    // 사람 실루엣 그리기
    drawHumanSilhouette(ctx, width, height);

    // 선택된 관절에 대해 사용자 랜드마크와 가이드라인 랜드마크 그리기
    selectedJoints.forEach((id) => {
      const userLandmark = userLandmarks.find((lm) => lm.id === id);
      const guideLandmark = guidelineLandmarks.find((lm) => lm.id === id);

      if (userLandmark && guideLandmark) {
        // 좌표 변환 (정규화된 좌표를 캔버스 좌표로 변환)
        const userX = ((userLandmark.x + 1) / 2) * width;
        const userY = ((userLandmark.y + 1) / 2) * height;
        const guideX = ((guideLandmark.x + 1) / 2) * width;
        const guideY = ((guideLandmark.y + 1) / 2) * height;

        // 가이드라인 랜드마크 그리기 (파란색)
        ctx.fillStyle = "#0000FF";
        ctx.beginPath();
        ctx.arc(guideX, guideY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // 사용자 랜드마크 그리기 (녹색)
        ctx.fillStyle = "#00FF00";
        ctx.beginPath();
        ctx.arc(userX, userY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // 두 랜드마크 사이에 선 그리기 (빨간색)
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(userX, userY);
        ctx.lineTo(guideX, guideY);
        ctx.stroke();

        // 랜드마크 ID 표시
        ctx.fillStyle = "#000000";
        ctx.font = "10px Arial";
        ctx.fillText(String(id), userX + 8, userY - 8);
      }
    });
  }, [userLandmarks, guidelineLandmarks, isOpen, selectedJoints]);

  // 사람 실루엣 그리기 (참조용)
  const drawHumanSilhouette = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;

    // 위치 변수 계산
    const centerX = width / 2;
    const headY = height * 0.2;
    const shoulderY = height * 0.3;
    const hipY = height * 0.5;
    const kneeY = height * 0.7;
    const ankleY = height * 0.85;

    const shoulderWidth = width * 0.2;
    const hipWidth = width * 0.15;
    const kneeWidth = width * 0.1;

    // 머리
    ctx.beginPath();
    ctx.arc(centerX, headY, width * 0.05, 0, 2 * Math.PI);
    ctx.stroke();

    // 몸통
    ctx.beginPath();
    ctx.moveTo(centerX, headY + width * 0.05);
    ctx.lineTo(centerX, hipY);
    ctx.stroke();

    // 어깨
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderWidth, shoulderY);
    ctx.lineTo(centerX + shoulderWidth, shoulderY);
    ctx.stroke();

    // 팔
    ctx.beginPath();
    ctx.moveTo(centerX - shoulderWidth, shoulderY);
    ctx.lineTo(centerX - shoulderWidth, shoulderY + height * 0.2);
    ctx.moveTo(centerX + shoulderWidth, shoulderY);
    ctx.lineTo(centerX + shoulderWidth, shoulderY + height * 0.2);
    ctx.stroke();

    // 다리
    ctx.beginPath();
    ctx.moveTo(centerX - hipWidth, hipY);
    ctx.lineTo(centerX - kneeWidth, kneeY);
    ctx.lineTo(centerX - kneeWidth, ankleY);
    ctx.moveTo(centerX + hipWidth, hipY);
    ctx.lineTo(centerX + kneeWidth, kneeY);
    ctx.lineTo(centerX + kneeWidth, ankleY);
    ctx.stroke();
  };

  // 컴포넌트가 열려있지 않으면 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-3/4 max-w-4xl h-3/4 overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            랜드마크 비교 분석
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 왼쪽: 시각화 영역 */}
          <div className="w-1/2 p-4 flex flex-col items-center">
            <h3 className="text-lg font-medium mb-2">시각적 비교</h3>
            <div className="relative w-full h-[500px] border rounded-lg bg-gray-50">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                width={500}
                height={500}
              />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
              가이드라인 랜드마크
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-4 mr-1"></span>{" "}
              실시간 랜드마크
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-4 mr-1"></span>{" "}
              차이
            </div>
          </div>

          {/* 오른쪽: 데이터 영역 */}
          <div className="w-1/2 p-4 overflow-y-auto">
            <h3 className="text-lg font-medium mb-2">수치 비교</h3>

            {/* 관절 선택 */}
            <div className="mb-4 p-2 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium mb-1">관절 선택</h4>
              <div className="flex flex-wrap gap-1">
                {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((id) => (
                  <button
                    key={id}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedJoints.includes(id)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={() => {
                      if (selectedJoints.includes(id)) {
                        setSelectedJoints(
                          selectedJoints.filter((j) => j !== id)
                        );
                      } else {
                        setSelectedJoints([...selectedJoints, id]);
                      }
                    }}
                  >
                    {POSE_LANDMARKS_NAMES[id] || `랜드마크 ${id}`}
                  </button>
                ))}
              </div>
            </div>

            {/* 유의미한 차이가 있는 랜드마크 */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">
                유의미한 차이가 있는 랜드마크 ({significantDifferences.length})
              </h4>
              {significantDifferences.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">관절</th>
                        <th className="p-2 text-left">차이(%)</th>
                        <th className="p-2 text-left">X</th>
                        <th className="p-2 text-left">Y</th>
                        <th className="p-2 text-left">Z</th>
                      </tr>
                    </thead>
                    <tbody>
                      {significantDifferences.map((diff) => (
                        <tr key={diff.id} className="border-t">
                          <td className="p-2">{diff.name}</td>
                          <td className="p-2 font-medium text-red-600">
                            {diff.distancePercent.toFixed(1)}%
                          </td>
                          <td className="p-2">
                            {diff.xDiffPercent.toFixed(1)}%
                          </td>
                          <td className="p-2">
                            {diff.yDiffPercent.toFixed(1)}%
                          </td>
                          <td className="p-2">
                            {diff.zDiffPercent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  유의미한 차이가 있는 랜드마크가 없습니다.
                </p>
              )}
            </div>

            {/* 모든 선택된 랜드마크 차이 */}
            <div>
              <h4 className="text-sm font-medium mb-1">
                모든 선택된 랜드마크 비교
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">관절</th>
                      <th className="p-2 text-left">차이(%)</th>
                      <th className="p-2 text-left">실시간 (X, Y, Z)</th>
                      <th className="p-2 text-left">가이드라인 (X, Y, Z)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {differences.map((diff) => {
                      const userLm = userLandmarks.find(
                        (lm) => lm.id === diff.id
                      );
                      const guideLm = guidelineLandmarks.find(
                        (lm) => lm.id === diff.id
                      );
                      if (!userLm || !guideLm) return null;
                      return (
                        <tr key={diff.id} className="border-t">
                          <td className="p-2">{diff.name}</td>
                          <td
                            className={`p-2 font-medium ${
                              diff.significant
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {diff.distancePercent.toFixed(1)}%
                          </td>
                          <td className="p-2">
                            ({userLm.x.toFixed(3)}, {userLm.y.toFixed(3)},{" "}
                            {userLm.z.toFixed(3)})
                          </td>
                          <td className="p-2">
                            ({guideLm.x.toFixed(3)}, {guideLm.y.toFixed(3)},{" "}
                            {guideLm.z.toFixed(3)})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandmarkComparisonView;
