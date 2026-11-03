import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError, clearLogin, isLoggedIn } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/StateBox';

const EMPTY_FORM = {
  birthDate: '', sido: '', zipCd: '', jobCd: '', schoolCd: '', mrgSttsCd: '',
  majorName: '', sbizCd: null, annualIncome: '', housingType: '', homeowner: false,
  interestCategories: [], isStudent: false, schoolName: '', enrollmentStatus: '',
  gradeLevel: '', gpa: '', gpaScale: '4.5', kosafIncomeBracket: '',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const codes = useApi('/api/v1/codes');
  const regions = useApi('/api/v1/regions');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState(null);

  // 이미 저장한 프로필이 있으면 입력칸에 채운다. 처음이면 404라서 그냥 빈칸으로 둔다.
  useEffect(() => {
    api('/api/v1/me/profile')
      .then((p) => setForm({
        ...EMPTY_FORM,
        ...Object.fromEntries(Object.entries(p).filter(([, value]) => value !== null)),
        sbizCd: p.sbizCd,
        sido: p.zipCd ? p.zipCd.slice(0, 2) : '',
        isStudent: Boolean(p.schoolName),
      }))
      .catch((error) => {
        if (error.status !== 404) setSaveError(error);
      });
  }, []);

  function change(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function toggleInterest(code) {
    const list = form.interestCategories;
    change('interestCategories', list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);
  }

  async function save(event) {
    event.preventDefault(); // 브라우저가 페이지를 새로고침하지 못하게 막는다
    setSaveError(null);
    try {
      await api('/api/v1/me/profile', {
        method: 'PUT',
        body: {
          // 빈칸은 null = "모름". 서버는 모르는 값을 "확인 필요"로 판정한다.
          birthDate: form.birthDate || null,
          zipCd: form.zipCd || null,
          jobCd: form.jobCd || null,
          schoolCd: form.schoolCd || null,
          mrgSttsCd: form.mrgSttsCd || null,
          majorName: form.majorName || null,
          sbizCd: form.sbizCd,
          annualIncome: form.annualIncome === '' ? null : Number(form.annualIncome),
          housingType: form.housingType || null,
          homeowner: form.homeowner,
          interestCategories: form.interestCategories,
          // 학생이 아니면 학교 항목은 전부 null
          schoolName: form.isStudent ? form.schoolName || null : null,
          enrollmentStatus: form.isStudent ? form.enrollmentStatus || null : null,
          gradeLevel: form.isStudent && form.gradeLevel ? Number(form.gradeLevel) : null,
          gpa: form.isStudent && form.gpa !== '' ? Number(form.gpa) : null,
          gpaScale: form.isStudent && form.gpa !== '' ? Number(form.gpaScale) : null,
          kosafIncomeBracket: form.isStudent && form.kosafIncomeBracket !== '' ? Number(form.kosafIncomeBracket) : null,
        },
      });
      navigate('/');
    } catch (error) {
      setSaveError(error);
    }
  }

  // 내 데이터 삭제와 로그아웃
  async function deleteData() {
    if (!window.confirm('프로필과 준비함을 모두 지울까요?')) return;
    await api('/api/v1/me', { method: 'DELETE' });
    setForm(EMPTY_FORM);
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    await api('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
    clearLogin();
    navigate('/login');
  }

  function skip() {
    localStorage.setItem('skipOnboarding', 'yes');
    navigate('/');
  }

  if (codes.loading || regions.loading) return <Loading />;
  if (codes.error) return <ErrorBox error={codes.error} onRetry={codes.reload} />;
  if (regions.error) return <ErrorBox error={regions.error} onRetry={regions.reload} />;

  const sigungu = regions.data.find((r) => r.code === form.sido)?.sigungu ?? [];
  const fieldErrors = saveError instanceof ApiError ? saveError.errors ?? {} : {};

  return (
    <form onSubmit={save}>
      <section className="hero">
        <div className="row-between">
          <p>내 정보</p>
          <button type="button" className="link-white" onClick={skip}>나중에 입력</button>
        </div>
        <h1>맞춤 공고를 찾기 위해<br />조건을 알려주세요</h1>
      </section>

      <section className="card">
        <FieldHead label="생년월일" empty={!form.birthDate} onUnknown={() => change('birthDate', '')} />
        <input
          aria-label="생년월일"
          className={form.birthDate ? '' : 'is-unknown'}
          type="date"
          value={form.birthDate}
          onChange={(e) => change('birthDate', e.target.value)}
        />
        {fieldErrors.birthDate && <p className="field-error">{fieldErrors.birthDate}</p>}

        <FieldHead label="지역" empty={!form.zipCd} onUnknown={() => setForm((old) => ({ ...old, sido: '', zipCd: '' }))} />
        <label className="no-label">
          <select
            aria-label="시도"
            className={form.sido ? '' : 'is-unknown'}
            value={form.sido}
            onChange={(e) => { const v = e.target.value; setForm((old) => ({ ...old, sido: v, zipCd: '' })); }}
          >
            <option value="">시·도 선택</option>
            {regions.data.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
        </label>
        <select aria-label="시군구" className={form.zipCd ? '' : 'is-unknown'} value={form.zipCd} onChange={(e) => change('zipCd', e.target.value)}>
          <option value="">시·군·구 선택</option>
          {sigungu.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>

        <CodeSelect label="취업 상태" name="jobCd" options={codes.data.jobCd} form={form} change={change} />
        <CodeSelect label="학력" name="schoolCd" options={codes.data.schoolCd} form={form} change={change} />
        <FieldHead label="결혼 여부" empty={!form.mrgSttsCd} onUnknown={() => change('mrgSttsCd', '')} />
        <div className="chips">
          {codes.data.mrgSttsCd.map((o) => (
            <button
              type="button"
              key={o.code}
              className={form.mrgSttsCd === o.code ? 'chip active' : 'chip'}
              onClick={() => change('mrgSttsCd', form.mrgSttsCd === o.code ? '' : o.code)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <FieldHead label="전공" empty={!form.majorName} onUnknown={() => change('majorName', '')} />
        <label className="no-label">
          <input aria-label="전공" className={form.majorName ? '' : 'is-unknown'} value={form.majorName} onChange={(e) => change('majorName', e.target.value)} placeholder="예: 전기전자공학" />
        </label>

        <p className="label">해당 대상</p>
        <div className="chips">
          {codes.data.sbizCd.map((c) => {
            const on = form.sbizCd?.includes(c.code);
            return (
              <button
                type="button"
                key={c.code}
                className={on ? 'chip active' : 'chip'}
                onClick={() => {
                  const list = form.sbizCd ?? [];
                  change('sbizCd', on ? list.filter((x) => x !== c.code) : [...list, c.code]);
                }}
              >
                {c.label}
              </button>
            );
          })}
          {/* [] = 해당 없음, null = 모름. 둘은 서버에서 다르게 판정된다 */}
          <button
            type="button"
            className={form.sbizCd?.length === 0 ? 'chip active' : 'chip'}
            onClick={() => change('sbizCd', form.sbizCd?.length === 0 ? null : [])}
          >
            해당 없음
          </button>
        </div>

        <FieldHead label="소득 (본인 연소득, 만원)" empty={form.annualIncome === ''} onUnknown={() => change('annualIncome', '')} />
        <label className="no-label">
          <input aria-label="연소득" className={form.annualIncome === '' ? 'is-unknown' : ''} type="number" min="0" value={form.annualIncome} onChange={(e) => change('annualIncome', e.target.value)} placeholder="비워 두면 모름" />
        </label>

        <CodeSelect label="주거 형태" name="housingType" options={codes.data.housingType} form={form} change={change} />
        <label className="check">
          <input type="checkbox" checked={form.homeowner} onChange={(e) => change('homeowner', e.target.checked)} />
          내 명의로 된 집이 있어요
        </label>

        <p className="label">관심 분야</p>
        <div className="chips">
          {codes.data.interestCategories.map((c) => (
            <button
              type="button"
              key={c.code}
              className={form.interestCategories.includes(c.code) ? 'chip active' : 'chip'}
              onClick={() => toggleInterest(c.code)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <label className="check">
          <input type="checkbox" checked={form.isStudent} onChange={(e) => change('isStudent', e.target.checked)} />
          학생이에요
        </label>
        {form.isStudent && (
          <>
            <label>학교
              <input value={form.schoolName} onChange={(e) => change('schoolName', e.target.value)} placeholder="인하대학교" />
            </label>
            <CodeSelect label="재학 상태" name="enrollmentStatus" options={codes.data.enrollmentStatus} form={form} change={change} />
            <label>학년
              <input type="number" min="1" max="6" value={form.gradeLevel} onChange={(e) => change('gradeLevel', e.target.value)} />
            </label>
            <label>직전 학기 평점
              <input type="number" step="0.01" min="0" value={form.gpa} onChange={(e) => change('gpa', e.target.value)} placeholder="예: 3.8" />
            </label>
            <label>평점 만점
              <select value={form.gpaScale} onChange={(e) => change('gpaScale', e.target.value)}>
                {codes.data.gpaScale.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </label>
            <CodeSelect label="학자금 지원구간" name="kosafIncomeBracket" options={codes.data.kosafIncomeBracket} form={form} change={change} />
          </>
        )}
      </section>

      {saveError && <ErrorBox error={saveError} />}
      <button className="btn-primary" type="submit">저장하고 맞춤 공고 보기</button>

      <section className="card">
        <h2>계정</h2>
        {isLoggedIn()
          ? <button type="button" className="btn-secondary" onClick={logout}>로그아웃</button>
          : <Link className="btn-secondary" to="/login">로그인 · 회원가입</Link>}
        <button type="button" className="link" onClick={deleteData}>내 데이터 전체 삭제</button>
      </section>
    </form>
  );
}

// 칸 이름 + 오른쪽 「모름」 버튼. 누르면 값을 비운다(= 서버에 null = 모름).
function FieldHead({ label, empty, onUnknown }) {
  return (
    <div className="field-head">
      <span className="label">{label}</span>
      <button type="button" className={empty ? 'unknown-btn active' : 'unknown-btn'} onClick={onUnknown}>모름</button>
    </div>
  );
}

function CodeSelect({ label, name, options, form, change }) {
  const value = form[name] ?? '';
  return (
    <>
      <FieldHead label={label} empty={value === ''} onUnknown={() => change(name, '')} />
      <select aria-label={label} className={value === '' ? 'is-unknown' : ''} value={value} onChange={(e) => change(name, e.target.value)}>
        <option value="">선택</option>
        {options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
      </select>
    </>
  );
}
