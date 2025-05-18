import React from "react";

interface PoseMatchIndicatorProps {
  similarity: number;
}

/**
 * 자세 일치도를 색상과 아이콘으로 표시하는 컴포넌트
 */
const PoseMatchIndicator: React.FC<PoseMatchIndicatorProps> = ({
  similarity,
}) => {
  // 유사도에 따른 색상 및 아이콘 결정
  const getIndicatorInfo = () => {
    if (similarity >= 80) {
      return {
        color: "text-green-400",
        icon: "✓",
        text: "우수",
      };
    } else if (similarity >= 60) {
      return {
        color: "text-yellow-400",
        icon: "!",
        text: "보통",
      };
    } else {
      return {
        color: "text-red-400",
        icon: "✗",
        text: "개선 필요",
      };
    }
  };

  const { color, icon, text } = getIndicatorInfo();

  return (
    <div className="flex items-center">
      <div className={`text-lg font-bold ${color}`}>
        {Math.round(similarity)}%
      </div>
      <div className={`ml-1 ${color} text-lg`}>{icon}</div>
      <div className="ml-1 text-xs text-gray-300">({text})</div>
    </div>
  );
};

export default PoseMatchIndicator;
