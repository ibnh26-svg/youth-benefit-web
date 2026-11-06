import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ImageIcon } from '../components/Icons';
import { Loading, ErrorBox } from '../components/StateBox';

const EMPTY = { title: '', organization: '', applyEndDate: '', applyEndTime: '', category: '', memo: '', applyUrl: '' };
const CATEGORIES = ['일자리', '주거', '교육', '복지문화', '참여권리'];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 서버의 시각 "18:00:00" → 입력칸용 "18:00"
const toTimeInput = (t) => (t ? t.slice(0, 5) : '');

// /custom-policies/new           → 새로 등록 (POST /me/custom-policies)
// /custom-policies/:appId/edit   → 준비함 공고 수정 (PUT /me/custom-policies/{policyId})
export default function CustomPolicyPage() {
  const navigate = useNavigate();
  const { appId } = useParams();
  const editing = Boolean(appId);

  const [url, setUrl] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null); // 수정할 때 원래 준비함 상세
  const [loadError, setLoadError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [imageName, setImageName] = useState('');
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const leftPage = useRef(false);
  const fileInput = useRef(null);

  // 화면을 떠나면 2초마다 묻기를 멈춘다
  useEffect(() => {
    leftPage.current = false;
    return () => {
      leftPage.current = true;
    };
  }, []);

  // 수정 모드: 준비함 상세에서 지금 값을 읽어 칸을 채운다
  useEffect(() => {
    if (!editing) return;
    api(`/api/v1/me/applications/${appId}`)
      .then((d) => {
        setOriginal(d);
        setForm({
          title: d.title ?? '',
          organization: d.organization ?? '',
          applyEndDate: d.deadline?.applyEndDate ?? '',
          applyEndTime: toTimeInput(d.deadline?.applyEndTime),
          category: d.category ?? '',
          memo: d.memo ?? '',
          applyUrl: d.applyUrl ?? '',
        });
      })
      .catch(setLoadError);
  }, [editing, appId]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 링크와 캡처 모두: 202로 작업 id를 받고 → 2초마다 상태를 묻고 → SUCCEEDED면 칸을 채운다
  async function runImport(start) {
    setImporting(true);
    setNotice(null);
    setError(null);
    try {
      const job = await start();
      let view = job;
      while (!leftPage.current && (view.status === 'QUEUED' || view.status === 'RUNNING')) {
        await wait(2000);
        view = await api(`/api/v1/me/imports/${job.id}`);
      }
      if (view.status === 'SUCCEEDED') {
        // 못 찾은 칸은 null 이다. null 은 건드리지 않고, 찾은 칸만 채운다.
        const found = Object.fromEntries(
          Object.entries(view.prefill ?? {})
            .filter(([, v]) => v !== null && v !== '')
            .map(([k, v]) => [k, k === 'applyEndTime' ? toTimeInput(v) : v]),
        );
        setForm((old) => ({ ...old, ...found }));
        setNotice('불러온 내용을 확인하고 고쳐 주세요.');
      } else if (view.status === 'FAILED') {
        setNotice(view.error?.message ?? '불러오지 못했어요. 직접 입력해 주세요.');
      }
    } catch (err) {
      // 400 errors.image(사진 아님·용량), 429(1시간 20번), 503 IMPORT_UNAVAILABLE
      setNotice(err.errors?.image ?? err.message);
    } finally {
      setImporting(false);
    }
  }

  function importLink() {
    runImport(() => api('/api/v1/me/imports', { method: 'POST', body: { url } }));
  }

  function pickImage(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 파일을 다시 골라도 동작하게
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setNotice('PNG, JPG, WEBP 사진만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setNotice('10MB 이하 사진만 올릴 수 있어요.');
      return;
    }
    setImageName(file.name);
    const data = new FormData();
    data.append('image', file);
    runImport(() => api('/api/v1/me/imports/image', { method: 'POST', body: data }));
  }

  async function submit(event) {
    event.preventDefault();
    setError(null);
    const body = {
      title: form.title,
      organization: form.organization || null,
      applyEndDate: form.applyEndDate || null,
      applyEndTime: form.applyEndDate && form.applyEndTime ? form.applyEndTime : null,
      category: form.category || null,
      memo: form.memo || null,
      applyUrl: form.applyUrl || null,
    };
    try {
      if (editing) {
        // PUT은 보낸 값 전체로 바꾼다. 서류와 상태를 안 보내면 지워지니 지금 값을 그대로 함께 보낸다.
        await api(`/api/v1/me/custom-policies/${original.policyId}`, {
          method: 'PUT',
          body: {
            ...body,
            documents: original.items.filter((item) => item.source === 'POLICY').map((item) => item.content),
            status: original.status,
          },
        });
      } else {
        await api('/api/v1/me/custom-policies', { method: 'POST', body: { ...body, documents: [] } });
      }
      navigate('/prep');
    } catch (err) {
      setError(err);
    }
  }

  if (editing && loadError) return <ErrorBox error={loadError} />;
  if (editing && !original) return <Loading />;

  return (
    <form onSubmit={submit}>
      <section className="hero">
        <button type="button" className="link-white back" onClick={() => navigate(-1)}>← 뒤로</button>
        {editing ? <h1>직접 등록한 공고<br />수정하기</h1> : <h1>찾은 공고를<br />직접 등록해요</h1>}
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
        <div className="or-divider"><span>또는</span></div>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickImage} />
        <button type="button" className="upload-box" disabled={importing} onClick={() => fileInput.current?.click()}>
          <ImageIcon size={22} />
          <strong>{importing && imageName ? '캡처에서 읽는 중…' : '공고 캡처 올리기'}</strong>
          <span className="hint">{imageName || '공고 전체가 보이는 이미지 · PNG, JPG, WEBP 10MB 이하'}</span>
        </button>
        {notice && <p className="hint notice-line">{notice}</p>}
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
      <button className="btn-primary">{editing ? '수정 내용 저장' : '등록하고 준비함에 담기'}</button>
    </form>
  );
}
