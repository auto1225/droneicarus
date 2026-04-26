// src/PageInfo.jsx — floating "이 페이지 안내" button + modal
// Mounted globally; reads current route from App and shows page-specific guidance.
import React, { useState, useEffect } from 'react';

const INFO = {
  home: {
    label: 'Map · 지도',
    tagline: '전 세계 드론 영상을 지도 위에서 둘러보기',
    what: '위치별로 흩어진 드론 영상을 지도 핀으로 시각화합니다. 사이드바 카테고리와 라이선스 필터로 좁혀가며 찾고 싶은 장면을 찾아보세요.',
    how: [
      '왼쪽 사이드바에서 카테고리(Nature/Cities/Heritage/AI Generated 등) 선택',
      '핀 색상: 노랑($)=유료, 초록=무료 클립',
      'Map Filters에서 Free/Paid/Pilot uploads/4K+/Last 30 days 추가 필터',
      '핀이나 썸네일 클릭 → Watch 페이지로 이동',
      '뒤로가기로 돌아오면 줌·위치·필터가 그대로 보존',
    ],
    related: [['explore', 'Explore (그리드 보기)'], ['atlas', 'Atlas (편집장의 추천)'], ['rankings', 'Rankings (인기 클립)']],
  },
  explore: {
    label: 'Explore · 그리드 탐색',
    tagline: '모든 영상을 카드 그리드로 검색·정렬·필터',
    what: '지도가 아니라 그리드 뷰로 전체 영상을 한눈에. 카테고리 트리, 검색창, 라이선스 칩, 정렬 옵션을 조합해서 원하는 클립을 빠르게 찾아요.',
    how: [
      '검색창에 위치/제목/키워드 입력 (실시간 필터)',
      'License 칩: All / Free / Paid / Pilot uploads / Commercial / Extended / Exclusive',
      'Sort: Trending / Newest / Highest rated / Free first',
      '왼쪽 트리에서 카테고리 선택 — 사이드바 숫자는 현재 필터에 맞춰 즉시 갱신',
      '카드 클릭 → Watch 페이지로',
    ],
    related: [['home', 'Map (지도)'], ['rankings', 'Rankings (랭킹)']],
  },
  watch: {
    label: 'Watch · 영상 재생',
    tagline: '클립 재생 + 메타정보 + 라이선스 구매',
    what: '선택한 영상을 재생하고, 제작자·위치·해상도 정보를 보고, 마음에 들면 그 자리에서 라이선스를 구매할 수 있어요.',
    how: [
      '왼쪽 사이드바: 같은 카테고리의 다른 영상으로 즉시 이동',
      '오른쪽 사이드바: Up next 추천',
      '하단: 제작자, 위치, 장비, 라이선스 옵션',
      '유료 영상이면 "Unlock for $X" 버튼으로 Checkout 진입',
      '데모 영상은 "DEMO" 배지 표시 — 실제 결제 없음',
    ],
    related: [['checkout', 'Checkout (결제)'], ['explore', 'Explore (다른 영상 찾기)']],
  },
  commissions: {
    label: 'Commissions · 역경매 의뢰',
    tagline: '원하는 영상이 없으면 직접 의뢰하기',
    what: '필요한 위치/시간대/예산을 적어 의뢰를 등록하면, 검증된 파일럿들이 가격과 포트폴리오를 제시합니다. 마음에 드는 입찰을 골라 진행하면 결과물이 도착해요.',
    how: [
      '"의뢰 등록" 버튼으로 새 의뢰 작성 (위치, 예산, 마감일)',
      '24~72시간 내 첫 입찰 도착 (이메일 + 사이트 알림)',
      '입찰자 프로필·평점 확인 후 "선택" 클릭',
      '에스크로: 결제 금액은 작업 완료 후 송금',
      '결과물 도착 → Accept → 송금 + 평점/리뷰',
    ],
    related: [['commission', '진행 중인 내 의뢰'], ['creators', 'Creators (파일럿 둘러보기)']],
  },
  upload: {
    label: 'Upload · 영상 등록',
    tagline: '파일럿이 직접 영상을 올리고 판매',
    what: '직접 촬영한 드론 영상을 두 가지 방식으로 등록할 수 있어요. Direct는 우리 CDN에 업로드, External은 YouTube/Vimeo 링크 임베드.',
    how: [
      'Direct 모드: MP4 파일 드래그 앤 드롭',
      'External 모드: YouTube/Vimeo URL 붙여넣기 (호스팅비 무료)',
      '제목·설명·위치(좌표)·카테고리·가격·라이선스 옵션 입력',
      'Publish 즉시 Map/Explore에 노출 (24h 검수)',
      '판매 수익의 70%는 파일럿, 15%는 플랫폼 수수료',
    ],
    related: [['earnings', 'Earnings (정산 내역)'], ['guide', 'Guide (사용 설명서)']],
  },
  checkout: {
    label: 'Checkout · 결제',
    tagline: '라이선스 선택 + 결제 처리',
    what: '클립을 사용할 용도(개인/상업/방송)에 맞게 라이선스를 고르고 결제합니다. 결제 후엔 다운로드 링크와 라이선스 PDF가 발급돼요.',
    how: [
      'Personal: 개인 SNS·블로그 비상업 용도',
      'Commercial: 광고·제품 홍보·마케팅',
      'Editorial: 방송·다큐멘터리·뉴스 (저작권 표시 필수)',
      '결제 → Success 페이지에서 다운로드 + 라이선스 증빙',
      '데모 영상은 결제 처리되지 않음 (상단 배너 확인)',
    ],
    related: [['orders', 'Orders & Licenses (구매 내역)']],
  },
  rankings: {
    label: 'Rankings · 랭킹',
    tagline: '인기 영상·파일럿·트렌드 한눈에',
    what: '주간/월간/연간 베스트 영상과 판매 1위 파일럿, 카테고리별 급상승 트렌드를 매주 갱신해서 보여줍니다.',
    how: [
      '기간 토글: This week / This month / All time',
      'Top 클립 vs Top 파일럿 탭 전환',
      '카테고리별 상승률 (예: AI Generated +120%)',
      '평점 분포 + 리뷰 하이라이트',
    ],
    related: [['creators', 'Creators (전체 디렉터리)'], ['atlas', 'Atlas (편집 추천)']],
  },
  creators: {
    label: 'Creators · 크리에이터',
    tagline: '활동 중인 모든 파일럿 디렉터리',
    what: '드론 이카루스에 등록된 모든 파일럿을 프로필 카드로 둘러봅니다. 위치, 전문 분야, 평점, 누적 작품 수 한눈에 보여요.',
    how: [
      '프로필 카드 클릭 → 개인 페이지에서 모든 작품 조회',
      'Follow 기능으로 신작 알림',
      'Creator Studio 입구는 카드 우측 상단',
      '의뢰 시 우수 파일럿 1순위 추천',
    ],
    related: [['rankings', 'Rankings (인기 파일럿)'], ['commissions', 'Commissions (의뢰)']],
  },
  atlas: {
    label: 'Atlas · 편집장의 지도',
    tagline: '에디터가 큐레이션한 명소 컬렉션',
    what: '여행 블로그처럼 구성된 큐레이션 페이지. 대륙·국가·시즌별 명소를 추천하고 관련 영상으로 바로 연결됩니다.',
    how: [
      '랜드마크 카드: 사진 + 설명 + 추천 영상 링크',
      '대륙·국가별 그룹핑',
      '시즌 추천 (봄 벚꽃, 가을 단풍, 겨울 오로라 등)',
      '클릭 시 해당 위치 Map 페이지로 이동',
    ],
    related: [['home', 'Map (지도)'], ['explore', 'Explore (그리드)']],
  },
  lab: {
    label: 'Lab · 연구실',
    tagline: '드론 기술·튜토리얼·실험 콘텐츠 허브',
    what: '학술 논문, 특허, 오픈소스 펌웨어, 장비 리뷰, 촬영 기법 튜토리얼 같은 깊이 있는 콘텐츠를 모은 곳입니다.',
    how: [
      '글 + 영상 + 코드 샘플 혼합 콘텐츠',
      'AI Generation 워크플로 가이드',
      '장비별 비교 리뷰 + 점수표',
      '카테고리: Research / Tutorial / Patent / News',
    ],
    related: [['gear', 'Gear (장비 카탈로그)'], ['guide', 'Guide (사용 설명서)']],
  },
  gear: {
    label: 'Gear · 드론 카탈로그',
    tagline: '300+ 드론 제품 카탈로그',
    what: '입문용부터 산업용까지 전 세계 드론 제품을 사양·가격·용도별로 비교합니다. 장비 구매 결정 전 한 번 들러보세요.',
    how: [
      '가격대 필터: $500 미만 / $500~2K / $2K+',
      '용도별: Beginner / Cinematic / FPV / Industrial',
      '비교 모드: 최대 4개 제품 동시 비교',
      '제품 카드: 사진 + 사양 + 가격 + 추천 용도',
    ],
    related: [['lab', 'Lab (장비 리뷰 글)']],
  },
  live: {
    label: 'Live · 실시간 방송',
    tagline: '드론 라이브 방송 + 슈퍼챗 후원',
    what: '파일럿이 비행하면서 실시간 방송하는 영상을 보고, 채팅·슈퍼챗으로 후원할 수 있어요. 좋은 장면이 나오는 순간을 함께.',
    how: [
      '진행 중인 라이브 방송 그리드',
      '예약된 방송 (D-day 카운트다운)',
      '시청 + 채팅 + 슈퍼챗 (후원의 70%는 파일럿에게)',
      '내가 방송하려면 [Live help · Go live guide] 참고',
    ],
    related: [['livehelp', 'Live help (방송 가이드)'], ['mystreams', '내 방송 기록']],
  },
  shots: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    what: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다.',
    how: [
      '맞춤 큐레이션 + 전속 매니저 배정',
      '월간 구독 옵션 (스톡 풋티지 형태)',
      '견적 요청 폼: 예산·용도·기간 입력',
      '대형 캠페인용 우선 선택권 제공',
    ],
    related: [['pricing', 'Pricing (요금제)'], ['commissions', 'Commissions (단건 의뢰)']],
  },
  shotlibrary: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    what: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다.',
    how: [
      '맞춤 큐레이션 + 전속 매니저 배정',
      '월간 구독 옵션 (스톡 풋티지 형태)',
      '견적 요청 폼: 예산·용도·기간 입력',
      '대형 캠페인용 우선 선택권 제공',
    ],
    related: [['pricing', 'Pricing (요금제)'], ['commissions', 'Commissions (단건 의뢰)']],
  },
  pricing: {
    label: 'Pricing · 요금제',
    tagline: '플랫폼 수수료 + 라이선스 가격대 가이드',
    what: '구매자/판매자/의뢰자 입장별 요금 구조를 한 페이지에 정리합니다. 70/30 분배 원칙은 모든 거래에 동일하게 적용돼요.',
    how: [
      '구매자: 라이선스별 가격 범위',
      '판매자: 수수료 15% + 정산 주기',
      '의뢰자: 예산 가이드라인',
      '엔터프라이즈: 맞춤 견적 안내',
    ],
    related: [['guide', 'Guide (사용 설명서)']],
  },
  guide: {
    label: 'Guide · 사용 설명서',
    tagline: '단계별 한국어 사용 가이드',
    what: '클립 구매·판매·의뢰의 모든 절차를 스크린샷과 함께 단계별로 설명합니다. 모든 페이지에 대한 안내도 여기 있어요.',
    how: [
      '클립 구매하기: 4단계 (지도/그리드 → 미리보기 → 라이선스 → 결제)',
      '클립 판매하기: 4단계 (가입 → 업로드 → 가격 설정 → 모니터링)',
      '커스텀 의뢰: 4단계 (작성 → 입찰 → 수락 → 수령)',
      '모든 페이지 탭: 14개 페이지 자세한 설명',
    ],
    related: [['home', 'Map (시작하기)'], ['pricing', 'Pricing (요금)']],
  },
};

// Universal "how this site works" — shown when no specific entry exists
const FALLBACK = {
  label: 'Drone Icarus',
  tagline: '항공 드론 영상 마켓플레이스',
  what: '드론 이카루스는 전 세계 드론 영상의 거래·의뢰·발견을 한 곳에서 처리하는 플랫폼입니다.',
  how: [
    '구매: Map 또는 Explore에서 영상 찾기 → 라이선스 구매',
    '판매: Upload 페이지에서 영상 등록 → 70% 수익',
    '의뢰: Commissions에서 원하는 영상 의뢰 → 파일럿 입찰',
    '학습: Lab에서 기술·튜토리얼·장비 리뷰',
  ],
  related: [['guide', 'Guide (사용 설명서)'], ['home', 'Map (시작하기)']],
};

export function PageInfoButton({ route, onNav }) {
  const [open, setOpen] = useState(false);
  const info = INFO[route] || FALLBACK;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Don't show on admin/auth screens
  if (['admin', 'signin', 'auth', 'checkout'].includes(route)) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="이 페이지 안내"
        aria-label="이 페이지 안내"
        style={{
          position: 'fixed', right: 22, bottom: 86, zIndex: 1500,
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--moss, #4a6741)',
          color: '#faf6ec',
          border: '1px solid var(--line-strong)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontWeight: 700, fontSize: 18,
        }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(15,26,20,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
          <div style={{
            maxWidth: 560, width: '100%', maxHeight: '85vh', overflow: 'auto',
            background: 'var(--ink, #faf6ec)',
            color: 'var(--bone, #0f1a14)',
            border: '1px solid var(--line-strong)',
            borderRadius: 12,
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--parchment-dim, #4a5548)' }}>이 페이지 안내</div>
              <button onClick={() => setOpen(false)} aria-label="닫기" style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--parchment-dim, #4a5548)', borderRadius: '50%',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <h2 style={{ fontSize: 24, margin: '4px 0 6px', color: 'var(--bone, #0f1a14)' }}>{info.label}</h2>
            <p style={{ fontSize: 14, color: 'var(--moss, #4a6741)', margin: '0 0 18px', fontWeight: 600 }}>{info.tagline}</p>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--parchment, #1f2b22)', margin: '0 0 18px' }}>{info.what}</p>

            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim, #4a5548)', marginBottom: 8 }}>사용 방법</div>
            <ul style={{ margin: '0 0 20px', paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: 'var(--parchment, #1f2b22)' }}>
              {info.how.map((line, i) => <li key={i}>{line}</li>)}
            </ul>

            {info.related && info.related.length > 0 && (
              <>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim, #4a5548)', marginBottom: 8 }}>관련 페이지</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {info.related.map(([r, label], i) => (
                    <button
                      key={i}
                      onClick={() => { setOpen(false); onNav?.(r); }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--line-strong)',
                        borderRadius: 999,
                        padding: '6px 14px',
                        fontSize: 13, color: 'var(--parchment, #1f2b22)',
                        cursor: 'pointer', fontWeight: 500,
                      }}>
                      {label} →
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line, rgba(26,40,32,0.12))', fontSize: 12, color: 'var(--parchment-dim, #4a5548)' }}>
              전체 가이드는 <button onClick={() => { setOpen(false); onNav?.('guide'); }} style={{ background: 'transparent', border: 'none', color: 'var(--moss, #4a6741)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}>Guide 페이지</button>에서 확인하세요.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PageInfoButton;
