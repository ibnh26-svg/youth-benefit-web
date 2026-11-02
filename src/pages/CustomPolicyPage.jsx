import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const EMPTY = { title: '', organization: '', applyEndDate: '', applyEndTime: '', category: '', memo: '', applyUrl: '' };
const CATEGORIES = ['일자리', '주거', '교육', '복지문화', '참여권리'];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CustomPolicyPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const leftPage = useRef(false);

  // 화면을 떠나면 2초마다 묻기를 멈춘다
  useEffect(() => {
    leftPage.current = false;
    return () => {
      leftPage.current = true;
    };
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function importLink() {
    setImporting(true);
    setNotice(null);
    setError(null);
    try {
      const job = await api('/api/v1/me/imports', { method: 'POST', body: { url } });
      let view = job;
      while (!leftPage.current && (view.status === 'QUEUED' || view.status === 'RUNNING')) {
        await wait(2000);
        view = await api(`/api/v1/me/imports/${job.id}`);
      }
      if (view.status === 'SUCCEEDED') {
        // 못 찾은 칸은 null 이다. null 을 빈칸으로 바꿔서 채운다.
        const filled = Object.fromEntries(Object.entries(view.prefill).map(([k, v]) => [k, v ?? '']));
        setForm({ ...EMPTY, ...filled });
        setNotice('불러온 내용을 확인하고 고쳐 주세요.');
      } else if (view.status === 'FAILED') {
        setNotice(view.error.message);
      }
    } catch (err) {
      setNotice(err.message); // 503 IMPORT_UNAVAILABLE이면 직접 입력하도록 안내 문구만 보여 준다
    } finally {
      setImporting(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    try {
      await api('/api/v1/me/custom-policies', {
        method: 'POST',
        body: {
          title: form.title,
          organization: form.organization || null,
          applyEndDate: form.applyEndDate || null,
          applyEndTime: form.applyEndDate && form.applyEndTime ? form.applyEndTime : null,
          category: form.category || null,
          memo: form.memo || null,
          applyUrl: form.applyUrl || null,
          documents: [],
        },
      });
      navigate('/prep');
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form onSubmit={submit}>
      <section className="hero"><h1>찾은 공고를<br />직접 등록해요</h1><p className="hero-sub">등록한 공고는 나만 볼 수 있고, 준비함에 담겨요.</p></section>

      <section className="card">
        <label>공고 링크<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
        <button type="button" className="btn-secondary" disabled={!url || importing} onClick={importLink}>
          {importing ? '불러오는 중…' : '불러오기'}
        </button>
        {notice && <p className="muted">{notice}</p>}
      </section>

      <section className="card">
        <h2>공고 정보</h2>
        <label>공고명<input name="title" required maxLength={100} value={form.title} onChange={change} /></label>
        <label>기관<input name="organization" maxLength={100} value={form.organization} onChange={change} /></label>
        <label>신청 마감일<input name="applyEndDate" type="date" value={form.applyEndDate} onChange={change} /></label>
        <label>시각 (선택)<input name="applyEndTime" type="time" value={form.applyEndTime} onChange={change} /></label>
        <label>분류
          <select name="category" value={form.category} onChange={change}>
            <option value="">선택 안 함</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>메모 (선택)<input name="memo" maxLength={2000} value={form.memo} onChange={change} /></label>
        <label>신청 링크 (선택)<input name="applyUrl" type="url" value={form.applyUrl} onChange={change} /></label>
      </section>

      {error && <p className="error-box">{error.message}</p>}
      <button className="btn-primary">등록하고 준비함에 담기</button>
    </form>
  );
}
