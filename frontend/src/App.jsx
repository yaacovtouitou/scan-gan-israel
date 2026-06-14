import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Consultation from './pages/Consultation';
import Boutique from './pages/Boutique';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/consultation" replace />} />
          <Route path="consultation" element={<Consultation />} />
          <Route path="boutique" element={<Boutique />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
