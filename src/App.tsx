import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/baiscInfo/Home";
import PhoneInput from "./pages/baiscInfo/PhoneInput";
import HeightInput from "./pages/baiscInfo/HeightInput";
import Measurement from "./pages/bodyMeasurement/Measurement";
import MeasurementResults from "./pages/bodyMeasurement/Measurement-results";
import SelectExercise from "./pages/startexercises/SelectExercise";
import ExerciseSetupPage from "./pages/startexercises/ExerciseSetupPage";
import Completion from "./pages/completedWorkout/Completion";
import ExerciseResult from "./pages/completedWorkout/ExerciseResult";
import RealTimeExercisePage from "./pages/realTimeExercise/RealTimeExercisePage";
import RouteGuard from "./components/guards/RouteGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 초기 페이지 - 보호 필요 없음 */}
        <Route path="/" element={<Home />} />

        {/* 전화번호 입력 - 보호 필요 없음 */}
        <Route path="/info" element={<PhoneInput />} />

        {/* 키 입력 - 전화번호 입력 후 접근 가능 */}
        <Route
          path="/height"
          element={
            <RouteGuard requiredData={{ phoneNumber: true }} redirectTo="/info">
              <HeightInput />
            </RouteGuard>
          }
        />

        {/* 체형 측정 - 전화번호, 키 입력 후 접근 가능 */}
        <Route
          path="/measurement"
          element={
            <RouteGuard
              requiredData={{ phoneNumber: true, height: true }}
              redirectTo="/info"
            >
              <Measurement />
            </RouteGuard>
          }
        />

        {/* 체형 측정 결과 - 체형 측정 완료 후 접근 가능 */}
        <Route
          path="/measurement-results"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                bodyAnalysis: true,
              }}
              redirectTo="/measurement"
            >
              <MeasurementResults />
            </RouteGuard>
          }
        />

        {/* 운동 선택 - 체형 측정 완료 후 접근 가능 */}
        <Route
          path="/startexercises"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                bodyAnalysis: true,
              }}
              redirectTo="/info"
            >
              <SelectExercise />
            </RouteGuard>
          }
        />

        {/* 운동 세트 설정 - 운동 선택 후 접근 가능 */}
        <Route
          path="/exercisesetup"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                exerciseSelected: true,
              }}
              redirectTo="/startexercises"
            >
              <ExerciseSetupPage />
            </RouteGuard>
          }
        />

        {/* 실시간 운동 - 운동 세트 설정 후 접근 가능 */}
        <Route
          path="/realtime-exercise"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                exerciseSelected: true,
                exerciseSets: true,
              }}
              redirectTo="/exercisesetup"
            >
              <RealTimeExercisePage />
            </RouteGuard>
          }
        />

        {/* 운동 완료 - 실시간 운동 후 접근 가능 */}
        <Route
          path="/completed"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                exerciseSelected: true,
              }}
              redirectTo="/startexercises"
            >
              <Completion />
            </RouteGuard>
          }
        />

        {/* 운동 결과 - 운동 완료 후 접근 가능 */}
        <Route
          path="/exercise-result"
          element={
            <RouteGuard
              requiredData={{
                phoneNumber: true,
                height: true,
                exerciseSelected: true,
              }}
              redirectTo="/startexercises"
            >
              <ExerciseResult />
            </RouteGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
