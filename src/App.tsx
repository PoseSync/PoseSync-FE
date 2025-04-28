import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/baiscInfo/Home';
import PhoneInput from './pages/baiscInfo/PhoneInput';
import HeightInput from './pages/baiscInfo/HeightInput';
import Measurement from './pages/Measurement';
import SelectExercise from './pages/startexercises/SelectExercise';
import ExerciseSetupPage from './pages/startexercises/ExerciseSetupPage';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;