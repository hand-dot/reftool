import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ListPage from './ListPage';
import DetailPage from './DetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/detail" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;