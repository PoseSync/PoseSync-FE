import React, { useState, useEffect } from "react";

interface LatencyStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  samples: number[];
}

interface LatencyMonitorProps {
  latencyStats: LatencyStats;
  title?: string;
  showChart?: boolean;
}

const LatencyMonitor: React.FC<LatencyMonitorProps> = ({
  latencyStats,
  title = "레이턴시 모니터",
  showChart = true,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [chartData, setChartData] = useState<number[]>([]);

  // 차트 데이터 업데이트
  useEffect(() => {
    if (latencyStats && latencyStats.samples) {
      setChartData(latencyStats.samples.slice(-30)); // 최근 30개 샘플만 사용
    }
  }, [latencyStats]);

  // 색상 결정 함수
  const getLatencyColor = (value: number): string => {
    if (value < 100) return "text-green-500"; // 100ms 미만: 녹색
    if (value < 200) return "text-yellow-500"; // 100-200ms: 노란색
    return "text-red-500"; // 200ms 이상: 빨간색
  };

  if (!latencyStats || latencyStats.count === 0) {
    return (
      <div className="bg-gray-100 p-2 rounded shadow-sm">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="text-gray-500 text-xs">데이터 없음</div>
      </div>
    );
  }

  // 막대 차트의 최대 높이 계산
  const maxChartValue = Math.max(...chartData, 1);
  const getBarHeight = (value: number) =>
    `${Math.max(5, (value / maxChartValue) * 50)}px`;

  return (
    <div className="bg-gray-100 p-2 rounded shadow-sm">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <div
          className={`text-sm font-medium ${getLatencyColor(latencyStats.avg)}`}
        >
          평균: {latencyStats.avg.toFixed(1)}ms
        </div>
      </div>

      {expanded && (
        <div className="mt-2 text-xs">
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">샘플 수</div>
              <div className="font-medium">{latencyStats.count}</div>
            </div>
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">최소</div>
              <div
                className={`font-medium ${getLatencyColor(latencyStats.min)}`}
              >
                {latencyStats.min.toFixed(1)}ms
              </div>
            </div>
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">최대</div>
              <div
                className={`font-medium ${getLatencyColor(latencyStats.max)}`}
              >
                {latencyStats.max.toFixed(1)}ms
              </div>
            </div>
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">평균</div>
              <div
                className={`font-medium ${getLatencyColor(latencyStats.avg)}`}
              >
                {latencyStats.avg.toFixed(1)}ms
              </div>
            </div>
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">중앙값</div>
              <div
                className={`font-medium ${getLatencyColor(
                  latencyStats.median
                )}`}
              >
                {latencyStats.median.toFixed(1)}ms
              </div>
            </div>
            <div className="bg-gray-200 p-1 rounded">
              <div className="text-gray-600">95 퍼센타일</div>
              <div
                className={`font-medium ${getLatencyColor(latencyStats.p95)}`}
              >
                {latencyStats.p95.toFixed(1)}ms
              </div>
            </div>
          </div>

          {showChart && chartData.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-600 mb-1">최근 샘플 (30개)</div>
              <div className="flex items-end h-16 gap-px bg-gray-200 p-1 rounded">
                {chartData.map((value, index) => (
                  <div
                    key={index}
                    className={`w-full ${getLatencyColor(value)}`}
                    style={{
                      height: getBarHeight(value),
                      backgroundColor: "currentColor",
                      opacity: 0.7,
                    }}
                    title={`${value.toFixed(1)}ms`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500">0ms</span>
                <span className="text-gray-500">
                  {maxChartValue.toFixed(0)}ms
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LatencyMonitor;
