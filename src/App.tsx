import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/baiscInfo/Home';
import PhoneInput from './pages/baiscInfo/PhoneInput';
import HeightInput from './pages/baiscInfo/HeightInput';
import Measurement from './pages/bodyMeasurement/Measurement';
import SelectExercise from './pages/startexercises/SelectExercise';
import ExerciseSetupPage from './pages/startexercises/ExerciseSetupPage';
import IconTestPage from './pages/icon-test/IconTestPage';
import Completion from './pages/completedWorkout/Completion';
import ExerciseResult from './pages/completedWorkout/ExerciseResult';
import MeasurementResults from './pages/bodyMeasurement/Measurement-results';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info" element={<PhoneInput />} />
        <Route path="/height" element={<HeightInput />} /> 
        <Route path="/measurement" element={<Measurement />} />
        <Route path="/startexercises" element={<SelectExercise />} />
        <Route path="/exercisesetup" element={<ExerciseSetupPage />} />
        <Route path="/icon-test" element={<IconTestPage />} />
        <Route path="/completed" element={<Completion />} />
        <Route path="/exercise-result" element={<ExerciseResult />} />
        <Route path="/measurement-results" element={<MeasurementResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
