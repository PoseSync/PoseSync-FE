import React, { useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/useUserStore";
import { useExerciseStore } from "../../store/useExerciseStore";

interface RouteGuardProps {
  children: ReactNode;
  requiredData: {
    phoneNumber?: boolean;
    height?: boolean;
    exerciseSelected?: boolean;
    exerciseSets?: boolean;
    bodyAnalysis?: boolean;
  };
  redirectTo: string;
}

/**
 * 특정 경로에 접근하기 위해 필요한 데이터가 있는지 확인하는 보호 컴포넌트
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiredData,
  redirectTo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand 스토어에서 필요한 데이터 가져오기
  const phoneNumber = useUserStore((state) => state.phoneNumber);
  const height = useUserStore((state) => state.height);
  const selectedExercise = useExerciseStore((state) => state.selectedExercise);
  const sets = useExerciseStore((state) => state.sets);

  // 세션 스토리지에서 체형 분석 완료 여부 확인
  const bodyAnalysisCompleted =
    sessionStorage.getItem("bodyAnalysisCompleted") === "true";

  useEffect(() => {
    let shouldRedirect = false;
    const missingData: string[] = [];

    // 필요한 데이터 확인
    if (requiredData.phoneNumber && !phoneNumber) {
      shouldRedirect = true;
      missingData.push("전화번호");
    }

    if (requiredData.height && !height) {
      shouldRedirect = true;
      missingData.push("키");
    }

    if (requiredData.exerciseSelected && !selectedExercise) {
      shouldRedirect = true;
      missingData.push("선택된 운동");
    }

    if (requiredData.exerciseSets && (!sets || sets.length === 0)) {
      shouldRedirect = true;
      missingData.push("운동 세트 정보");
    }

    if (requiredData.bodyAnalysis && !bodyAnalysisCompleted) {
      shouldRedirect = true;
      missingData.push("체형 분석 결과");
    }

    // 데이터가 없으면 리다이렉트
    if (shouldRedirect) {
      console.log(
        `🔒 경로 보호: ${location.pathname}에 접근하기 위한 데이터가 부족합니다.`,
        missingData
      );
      alert(
        `필요한 정보(${missingData.join(
          ", "
        )})가 없습니다. 처음부터 다시 시작해주세요.`
      );
      navigate(redirectTo);
    }
  }, [
    phoneNumber,
    height,
    selectedExercise,
    sets,
    bodyAnalysisCompleted,
    navigate,
    redirectTo,
    requiredData,
    location.pathname,
  ]);

  return <>{children}</>;
};

export default RouteGuard;
