// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { register, login, setToken, getToken, uploadCSV, analyzeText, getHistory } from './services/api';
import './index.css';

function AuthRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function LoginPage(){
  const [email,setEmail] = useState(''); const [password,setPassword]=useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error,setError] = useState('');
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setError('');
    try {
      const res = isRegister ? await register(email, password) : await login(email, password);
      if(res.token){
        setToken(res.token);
        navigate('/');
      } else {
        setError(res.error || 'Unexpected error');
      }
    } catch(err){ setError(err.message); }
  }

  return (
    <div className="container">
      <h2 style={{marginBottom:8}}>Welcome</h2>
      <p className="muted">Login or create an account to analyze text and upload CSV.</p>
      <form onSubmit={submit} style={{display:'grid', gap:10, marginTop:18}}>
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-primary" type="submit">{isRegister ? 'Create account' : 'Login'}</button>
          <button type="button" onClick={()=>setIsRegister(v=>!v)} className="btn btn-ghost">{isRegister ? 'Have an account? Login' : 'Create account'}</button>
        </div>
        {error && <div style={{color:'var(--danger)'}}>{error}</div>}
      </form>
    </div>
  );
}

function Dashboard(){
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  async function handleUpload(e){
    e.preventDefault();
    if(!file) return alert('Select CSV file');
    const r = await uploadCSV(file);
    if(r.error) return alert(r.error);
    setResults(r.results || []);
    fetchHistory();
  }

  async function handleAnalyze(e){
    e.preventDefault();
    if(!text) return;
    const r = await analyzeText(text);
    if(r.error) return alert(r.error);
    setResults([r]);
    fetchHistory();
  }

  async function fetchHistory(){
    const h = await getHistory();
    setHistory(h.results || []);
  }

  useEffect(()=>{ fetchHistory(); }, []);

  const onHome = () => { navigate('/'); window.scrollTo({top:0, behavior:'smooth'}); };
  const onLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const renderResultRow = (r, idx) => {
    const conf = (r.score ?? (Array.isArray(r.probs)? Math.max(...r.probs) : null));
    return (
      <tr key={idx}>
        <td style={{maxWidth:400}}>{r.text}</td>
        <td><span className={`badge ${r.label}`}>{r.label}</span></td>
        <td>{conf !== null && conf !== undefined ? (conf).toFixed(3) : ''}</td>
      </tr>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h2>Sentiment Dashboard</h2>
          <div className="muted" style={{marginTop:6}}>Analyze text & upload CSV — results saved to your account history.</div>
        </div>
        <div className="actions">
          <button className="btn btn-small" onClick={onHome}>Home</button>
          <button className="btn btn-small" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <section className="section">
        <h4>Analyze single text</h4>
        <form onSubmit={handleAnalyze} className="flex">
          <input className="input" value={text} onChange={e=>setText(e.target.value)} placeholder="Type text here..." />
          <button className="btn btn-primary" type="submit">Analyze</button>
        </form>
      </section>

      <section className="section">
        <h4>Upload CSV (column named 'text' or first column used)</h4>
        <form onSubmit={handleUpload} className="flex" encType="multipart/form-data">
          <input type="file" accept=".csv" onChange={e=>setFile(e.target.files[0])} />
          <button className="btn btn-primary" type="submit">Upload & Analyze</button>
        </form>
        <div className="muted" style={{marginTop:10}}>Tip: CSV should have header <code>text</code>, or the first column will be used.</div>
      </section>

      <section className="section">
        <h4>Recent Results</h4>
        <table className="table">
          <thead><tr><th>Text</th><th>Label</th><th>Confidence</th></tr></thead>
          <tbody>
            {results.map((r,i)=> renderResultRow(r,i))}
          </tbody>
        </table>
      </section>

      <section>
        <h4>History (last results)</h4>
        <table className="table">
          <thead><tr><th>Text</th><th>Label</th><th>Score</th><th>When</th></tr></thead>
          <tbody>
            {history.map(h=>(
              <tr key={h._id}><td style={{maxWidth:400}}>{h.text}</td><td><span className={`badge ${h.label}`}>{h.label}</span></td><td>{h.score?.toFixed(3)}</td><td>{new Date(h.createdAt).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthRoute><Dashboard /></AuthRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
