import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ImageIcon } from '../components/Icons';

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
      <section className="hero">
        <button type="button" className="link-white back" onClick={() => navigate(-1)}>← 뒤로</button>
        <h1>찾은 공고를<br />직접 등록해요</h1>
        <p className="hero-sub">등록한 공고는 나만 볼 수 있고, 준비함에 담겨요.</p>
      </section>

      <section className="card">
        <p className="label first">공고 링크</p>
        <div className="row-two tight">
          <input aria-label="공고 링크" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          <button type="button" className="btn-soft" disabled={!url || importing} onClick={importLink}>
            {importing ? '불러오는 중…' : '불러오기'}
          </button>
        </div>
        {notice && <p className="hint">{notice}</p>}
        <div className="or-divider"><span>또는</span></div>
        {/* 이미지 업로드 API가 아직 없어서 「준비 중」으로 보여 준다 (가이드 0장) */}
        <div className="upload-box" aria-disabled="true">
          <ImageIcon size={22} />
          <strong>공고 캡처 올리기</strong>
          <span className="hint">준비 중이에요 · 공고 전체가 보이는 이미지</span>
        </div>
        <p className="gray-note">신분증·성적증명서 같은 개인 서류는 올리지 마세요.</p>
      </section>

      <section className="card">
        <div className="row-between">
          <h2 className="card-title">공고 정보</h2>
          <span className="hint">불러온 내용을 확인·수정해요</span>
        </div>
        <label>공고명<input name="title" required maxLength={100} value={form.title} onChange={change} /></label>
        <label>기관<input name="organization" maxLength={100} value={form.organization} onChange={change} placeholder="기관명" /></label>
        <div className="row-two tight field-pair">
          <label>신청 마감일<input name="applyEndDate" type="date" value={form.applyEndDate} onChange={change} /></label>
          <label>시각 (선택)<input name="applyEndTime" type="time" value={form.applyEndTime} onChange={change} /></label>
        </div>
        <label>분류
          <select name="category" value={form.category} onChange={change}>
            <option value="">선택 안 함</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>메모 (선택)<textarea name="memo" maxLength={2000} rows={3} value={form.memo} onChange={change} placeholder="지원 내용, 신청 방법 등" /></label>
        <label>신청 링크 (선택)<input name="applyUrl" type="url" value={form.applyUrl} onChange={change} placeholder="https://" /></label>
        <div className="row-between under-save top-gap">
          <span className="chip-small">직접 등록 · 판정 없음</span>
          <span className="hint">조건 비교는 하지 않아요</span>
        </div>
      </section>

      {error && <p className="error-box">{error.message}</p>}
      <button className="btn-primary">등록하고 준비함에 담기</button>
    </form>
  );
}
