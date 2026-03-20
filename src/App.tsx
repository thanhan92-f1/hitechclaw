import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DemoHub } from './hub/DemoHub.js';
import { HISApp } from './modules/his/HISApp.js';
import { CSApp } from './modules/cs/CSApp.js';

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<DemoHub />} />
                <Route path="/his/*" element={<HISApp />} />
                <Route path="/cs/*" element={<CSApp />} />
            </Routes>
        </BrowserRouter>
    );
}
