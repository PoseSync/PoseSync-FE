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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info" element={<PhoneInput />} />
        <Route path="/height" element={<HeightInput />} />
        <Route path="/measurement" element={<Measurement />} />
        <Route path="/measurement-results" element={<MeasurementResults />} />
        <Route path="/startexercises" element={<SelectExercise />} />
        <Route path="/exercisesetup" element={<ExerciseSetupPage />} />
        <Route path="/realtime-exercise" element={<RealTimeExercisePage />} />
        <Route path="/completed" element={<Completion />} />
        <Route path="/exercise-result" element={<ExerciseResult />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
