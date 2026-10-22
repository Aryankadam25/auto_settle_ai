import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ClaimProvider } from './context/ClaimContext';
import ClaimGate from './components/ClaimGate';
import Landing from './pages/Landing';
import Verify from './pages/Verify';
import Upload from './pages/Upload';
import Result from './pages/Result';
import Negotiate from './pages/Negotiate';
import Audit from './pages/Audit';
import Adjuster from './pages/Adjuster';

export default function App() {
  return (
    <BrowserRouter>
      <ClaimProvider>
        <div className="min-h-screen bg-slate-50 text-[#0B2545] font-sans">
          {/* Demo Banner */}
          <div className="bg-amber-500 text-black text-center py-1.5 text-xs font-bold tracking-wide">
            DEMO DATA ONLY. NO REAL POLICIES OR CUSTOMERS.
          </div>

          {/* Navbar */}
          <header className="bg-[#0B2545] px-6 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-black tracking-tight text-white">
              Auto-Settle<span className="text-teal-300">AI</span>
            </Link>
            <Link to="/adjuster" className="text-sm font-semibold text-teal-100 hover:text-white">
              Adjuster Portal
            </Link>
          </header>

          {/* Routes */}
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/verify" element={<Verify />} />
              {/* ClaimGate makes sure the claim in the URL is loaded before any claim page renders */}
              <Route path="/claims/:id" element={<ClaimGate />}>
                <Route path="upload" element={<Upload />} />
                <Route path="result" element={<Result />} />
                <Route path="negotiate" element={<Negotiate />} />
                <Route path="audit" element={<Audit />} />
              </Route>
              <Route path="/adjuster" element={<Adjuster />} />
            </Routes>
          </main>
        </div>
      </ClaimProvider>
    </BrowserRouter>
  );
}
