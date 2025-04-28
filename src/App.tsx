import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/baiscInfo/Home';
import PhoneInput from './pages/baiscInfo/PhoneInput';
import HeightInput from './pages/baiscInfo/HeightInput';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/info" element={<PhoneInput />} />
        <Route path="/height" element={<HeightInput />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;