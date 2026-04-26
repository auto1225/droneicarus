// src/PageInfo.jsx — manual-grade page guide modal with SVG mockups + glossaries
import React, { useState, useEffect } from 'react';

// ---- Real YouTube thumbnails for inline screenshots ----
const T = {
  cityscape: 'https://i.ytimg.com/vi/92y9ySxIXY4/mqdefault.jpg',
  ocean: 'https://i.ytimg.com/vi/tXpXHoDKL64/mqdefault.jpg',
  mountain: 'https://i.ytimg.com/vi/fbqHK8i-HdA/mqdefault.jpg',
  ai: 'https://i.ytimg.com/vi/YsgfLbM-VaU/mqdefault.jpg',
};

// ---- Reusable section + visual components ----
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 22 }}>
    {title && <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--parchment-dim, #4a5548)', marginBottom: 10, fontWeight: 600 }}>{title}</div>}
    {children}
  </div>
);

const Glossary = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {items.map(({ term, color, desc }, i) => (
      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
        <span style={{
          flex: '0 0 auto', minWidth: 110,
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
          padding: '3px 8px', borderRadius: 999,
          background: color || 'var(--forest-900, #ebe0c5)',
          color: color ? '#1a2820' : 'var(--bone, #0f1a14)',
          textAlign: 'center',
        }}>{term}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--parchment, #1f2b22)' }}>{desc}</span>
      </div>
    ))}
  </div>
);

const Bullets = ({ items }) => (
  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.7, color: 'var(--parchment, #1f2b22)' }}>
    {items.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
  </ul>
);

const FAQ = ({ items }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {items.map(({ q, a }, i) => (
      <div key={i}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bone, #0f1a14)', marginBottom: 4 }}>Q. {q}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--parchment, #1f2b22)' }}>{a}</div>
      </div>
    ))}
  </div>
);

// ---- SVG mockups (annotated diagrams) ----
const MapMockup = () => (
  <svg viewBox="0 0 480 220" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="220" fill="#1a3a4a"/>
    <rect x="0" y="0" width="120" height="220" fill="#faf6ec"/>
    <text x="60" y="20" fontSize="9" fontFamily="Inter" fontWeight="700" fill="#1f2b22" textAnchor="middle">Categories</text>
    {['Nature', 'Cities', 'Heritage', 'Sports', 'AI'].map((c, i) => (
      <text key={c} x="14" y={42 + i * 18} fontSize="9" fontFamily="Inter" fill="#1f2b22">{c}</text>
    ))}
    <circle cx="240" cy="90" r="9" fill="#e8b13a" stroke="#1a2820" strokeWidth="1.5"/>
    <text x="240" y="93" fontSize="9" textAnchor="middle" fontWeight="700" fill="#1a2820">$</text>
    <circle cx="320" cy="140" r="7" fill="#4a6741"/>
    <circle cx="380" cy="80" r="7" fill="#4a6741"/>
    <circle cx="280" cy="170" r="9" fill="#e8b13a" stroke="#1a2820" strokeWidth="1.5"/>
    <text x="280" y="173" fontSize="9" textAnchor="middle" fontWeight="700" fill="#1a2820">$</text>
    <line x1="240" y1="90" x2="380" y2="55" stroke="#fff" strokeWidth="1" strokeDasharray="2,2"/>
    <rect x="370" y="40" width="100" height="20" rx="3" fill="#faf6ec"/>
    <text x="420" y="53" fontSize="9" textAnchor="middle" fill="#1f2b22" fontFamily="Inter">노랑 = 유료</text>
    <line x1="320" y1="140" x2="430" y2="180" stroke="#fff" strokeWidth="1" strokeDasharray="2,2"/>
    <rect x="375" y="170" width="95" height="20" rx="3" fill="#faf6ec"/>
    <text x="422" y="183" fontSize="9" textAnchor="middle" fill="#1f2b22" fontFamily="Inter">초록 = 무료</text>
  </svg>
);

const ExploreCardMockup = () => (
  <svg viewBox="0 0 480 220" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="220" fill="#faf6ec"/>
    <rect x="20" y="20" width="180" height="180" rx="6" fill="#0d1410" stroke="rgba(26,40,32,0.18)"/>
    <image x="20" y="20" width="180" height="120" href={T.cityscape} preserveAspectRatio="xMidYMid slice"/>
    <rect x="158" y="30" width="32" height="14" rx="2" fill="rgba(13,20,16,0.85)" stroke="#c85a2e"/>
    <text x="174" y="40" fontSize="9" textAnchor="middle" fill="#c85a2e" fontFamily="Inter" fontWeight="700">$99</text>
    <rect x="160" y="48" width="30" height="11" rx="2" fill="#c68820"/>
    <text x="175" y="56" fontSize="7" textAnchor="middle" fill="#1a2820" fontFamily="Inter" fontWeight="700">DEMO</text>
    <text x="30" y="160" fontSize="10" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque">Manhattan Skyline</text>
    <text x="30" y="174" fontSize="9" fill="#666" fontFamily="Inter">@nycaerial · 23k views</text>
    <text x="30" y="194" fontSize="8" fill="#888" fontFamily="Inter">3d ago · Cityscape · 4K</text>
    <line x1="200" y1="38" x2="290" y2="20" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="295" y="22" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600">가격 라벨</text>
    <text x="295" y="34" fontSize="8" fill="#666" fontFamily="Inter">유료 클립의 라이선스 비용</text>
    <line x1="190" y1="56" x2="290" y2="60" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="295" y="62" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600">DEMO 배지</text>
    <text x="295" y="74" fontSize="8" fill="#666" fontFamily="Inter">샘플 영상 - 실제 결제 X</text>
    <line x1="200" y1="170" x2="290" y2="160" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="295" y="162" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600">제작자 + 조회수</text>
    <text x="295" y="174" fontSize="8" fill="#666" fontFamily="Inter">파일럿 핸들 + 누적 조회수</text>
    <line x1="200" y1="194" x2="290" y2="200" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="295" y="202" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600">메타정보</text>
    <text x="295" y="214" fontSize="8" fill="#666" fontFamily="Inter">업로드일 · 카테고리 · 해상도</text>
  </svg>
);

const CommissionFlowMockup = () => (
  <svg viewBox="0 0 480 140" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="140" fill="#faf6ec"/>
    {['의뢰 등록', '입찰 받기', '입찰 수락', '결과물 수령'].map((label, i) => {
      const x = 30 + i * 110;
      return (
        <g key={i}>
          <rect x={x} y={40} width={90} height={60} rx={6} fill="#fff" stroke="rgba(26,40,32,0.3)"/>
          <text x={x + 45} y={66} fontSize={11} fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22" textAnchor="middle">{`Step ${i + 1}`}</text>
          <text x={x + 45} y={82} fontSize={10} fontFamily="Inter" fill="#1f2b22" textAnchor="middle">{label}</text>
          {i < 3 && (
            <g>
              <line x1={x + 90} y1={70} x2={x + 110} y2={70} stroke="#4a6741" strokeWidth="2"/>
              <polygon points={`${x + 110},70 ${x + 105},67 ${x + 105},73`} fill="#4a6741"/>
            </g>
          )}
        </g>
      );
    })}
    <text x={240} y={120} fontSize={10} fontFamily="Inter" fill="#666" textAnchor="middle">에스크로: 결제 → 보관 → 결과 검수 → 송금</text>
  </svg>
);

const CheckoutTiersMockup = () => (
  <svg viewBox="0 0 480 160" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="160" fill="#faf6ec"/>
    {[
      ['Personal', '$79', '#4a6741', 'SNS · 블로그 · 학교 과제'],
      ['Commercial', '$129', '#c68820', '광고 · 마케팅 · 제품 홍보'],
      ['Editorial', '$199', '#c85a2e', '방송 · 다큐멘터리 · 뉴스'],
    ].map(([name, price, color, use], i) => {
      const x = 20 + i * 150;
      return (
        <g key={name}>
          <rect x={x} y={30} width={130} height={110} rx={8} fill="#fff" stroke={color} strokeWidth="2"/>
          <text x={x + 65} y={56} fontSize={13} fontWeight="700" fontFamily="Bricolage Grotesque" fill={color} textAnchor="middle">{name}</text>
          <text x={x + 65} y={86} fontSize={22} fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1a2820" textAnchor="middle">{price}</text>
          <text x={x + 65} y={114} fontSize={9} fontFamily="Inter" fill="#666" textAnchor="middle">{use}</text>
        </g>
      );
    })}
    <text x={240} y={20} fontSize={10} fontFamily="Inter" fill="#666" textAnchor="middle">용도에 맞는 라이선스를 선택 (1회 결제, 영구 사용권)</text>
  </svg>
);

// ---- Per-route content ----
const INFO = {
  home: {
    label: 'Map · 지도',
    tagline: '전 세계 드론 영상을 지도 위에서 둘러보기',
    sections: [
      { kind: 'overview', text: '드론 이카루스의 메인 시작점입니다. 전 세계 1,650개 이상의 영상이 촬영 위치(좌표) 기준으로 지도 위 핀으로 표시되고, 사이드바와 필터로 좁혀가며 원하는 장면을 발견할 수 있어요. 핀 클릭 한 번이면 영상 페이지로 진입.' },
      { kind: 'visual', component: <MapMockup /> },
      { kind: 'glossary', title: '핀 색상 의미', items: [
        { term: '$ 노랑', color: '#e8b13a', desc: '유료 라이선스 클립. 지금은 모두 데모 데이터 (실제 결제 X). 핀 안에 가격 표시.' },
        { term: '초록', color: '#4a6741', desc: '무료 시청 + CC-BY 라이선스 클립. 출처만 밝히면 자유 사용.' },
      ]},
      { kind: 'glossary', title: 'Map Filters (왼쪽 사이드바 하단 9개 체크박스)', items: [
        { term: 'Free only', desc: '무료 영상만 표시. 가격 0인 모든 클립.' },
        { term: 'Paid clips', desc: '유료 영상만 표시. 라이선스 구매 필요.' },
        { term: 'Pilot uploads', desc: '검증된 파일럿이 직접 업로드한 오리지널 (YouTube 임베드 제외).' },
        { term: 'Commercial', desc: '상업용 라이선스를 지원하는 클립.' },
        { term: 'Extended', desc: '방송·재배포까지 허용하는 확장 라이선스 가능 클립.' },
        { term: 'Exclusive', desc: '1명만 구매할 수 있는 독점 라이선스 옵션.' },
        { term: '4K+', desc: '4K 이상 고해상도만.' },
        { term: 'Last 30 days', desc: '최근 30일 내 업로드된 신작.' },
        { term: 'Editor\'s picks', desc: '편집장이 선정한 추천작 (Atlas 페이지와 연동).' },
      ]},
      { kind: 'tips', items: [
        '왼쪽 카테고리 트리: Nature(211)·Cities(296)·Heritage(63)·AI Generated(32) 등 12개. 클릭 시 핀이 즉시 좁혀짐.',
        '필터를 적용하면 사이드바 숫자도 같이 갱신 → "이 필터 조합에 영상이 있는 카테고리"만 노출.',
        '핀 클릭 → 영상 시청 → 뒤로가기 시 줌·중심·필터가 자동으로 복구됩니다.',
        '하단 캐러셀: 좌표 정보 없는 AI Generated 클립 (지도에 표시 불가)',
      ]},
      { kind: 'faq', items: [
        { q: '핀이 너무 많아서 클러스터로 묶이는데, 분리해서 보려면?', a: '지도를 더 확대(스크롤 zoom in)하면 자동으로 클러스터가 풀립니다. 또는 카테고리/필터로 좁히세요.' },
        { q: '한국어 영상만 보고 싶어요', a: '아직 언어별 필터는 없어요. 검색창에 "Korea" 입력하면 한국 위치 영상이 모입니다.' },
        { q: '핀이 같은 위치에 여러 개 겹쳤어요', a: '같은 좌표에 영상이 많을 때 자동 클러스터로 묶입니다. 클릭하면 펼쳐서 개별 영상 선택 가능.' },
      ]},
    ],
    related: [['explore', 'Explore (그리드 보기)'], ['atlas', 'Atlas (편집 추천)'], ['rankings', 'Rankings (랭킹)']],
  },

  explore: {
    label: 'Explore · 그리드 탐색',
    tagline: '카드 그리드 + 검색 + 7가지 라이선스 칩 + 4가지 정렬',
    sections: [
      { kind: 'overview', text: '지도가 아닌 카드 그리드로 모든 영상을 한눈에 봅니다. 페이지당 24개씩 페이지네이션, 실시간 검색, 라이선스 칩, 정렬 옵션을 조합해서 원하는 클립을 빠르게 찾을 수 있어요. 사이드바 카테고리 트리는 Map과 같은 12개 카테고리.' },
      { kind: 'visual', component: <ExploreCardMockup /> },
      { kind: 'glossary', title: '라이선스 칩 7가지 — 각각의 정확한 의미', items: [
        { term: 'All', desc: '모든 영상 (필터 해제). 1,653개 전체.' },
        { term: 'Free', desc: '무료 시청 + CC-BY 라이선스. 출처(파일럿 이름) 표시만 하면 SNS·블로그 등 자유 사용 가능.' },
        { term: 'Paid', desc: '유료 라이선스 (Personal/Commercial/Editorial 중 선택해 결제). 현재 66개 모두 데모 데이터로 실제 결제 처리되지 않음.' },
        { term: 'Pilot uploads', desc: '검증 완료 파일럿이 직접 우리 CDN에 올린 오리지널 마스터 파일. YouTube 임베드와 구분됨.' },
        { term: 'Commercial', desc: 'Commercial 라이선스 옵션이 활성화된 클립만. 광고/마케팅 용도로 구매 가능.' },
        { term: 'Extended', desc: 'Extended 라이선스 옵션이 활성화된 클립. 방송·다큐·재배포까지 허용.' },
        { term: 'Exclusive', desc: '1인 독점 옵션이 켜진 클립. 첫 구매자가 모든 권리를 가져가고 다른 누구도 못 사게 됨.' },
      ]},
      { kind: 'glossary', title: 'Sort 정렬 옵션 4가지', items: [
        { term: 'Trending', desc: '최근 7일 조회/구매 추이 기반 인기 (기본값).' },
        { term: 'Newest', desc: '업로드 최신순.' },
        { term: 'Highest rated', desc: '구매자 평균 평점 높은 순.' },
        { term: 'Free first', desc: '무료가 먼저, 그 다음 가격 낮은 순.' },
      ]},
      { kind: 'tips', items: [
        '검색창에 위치, 제목, 키워드 입력하면 실시간 필터링. "Tokyo", "sunset", "drone show" 같은 키워드로 시도해 보세요.',
        '라이선스 칩 + 카테고리 + 검색을 조합하면 사이드바 카운트가 자동으로 그 조합에 맞춰 갱신됩니다.',
        '카드 우상단의 자물쇠 + $ 라벨은 유료 클립. 그 아래 "DEMO" 황색 배지는 현재 모든 유료 클립이 샘플임을 표시.',
        '페이지당 24개. 화면 하단의 숫자 페이지네이션으로 이동.',
      ]},
      { kind: 'faq', items: [
        { q: 'Free와 Pilot uploads 차이가 뭐예요?', a: 'Free는 라이선스 분류 (CC-BY 무료 시청), Pilot uploads는 출처 분류 (우리 CDN 업로드 vs YouTube 임베드). 두 칩을 동시에 쓰면 "파일럿이 직접 올린 무료 영상"이 됩니다.' },
        { q: 'Commercial과 Extended 라이선스 차이는?', a: 'Commercial = 일반 광고·웹 캠페인 (~$129), Extended = 방송 중계·대규모 재배포·옥외 광고 (~$199). 같은 영상 안에서 단계적으로 가격이 올라갑니다.' },
        { q: '검색이 빈 결과를 주는데도 카테고리 숫자가 보여요', a: '카테고리 카운트는 라이선스 칩 + 검색 두 가지 모두 반영합니다. 검색 결과가 0이면 모든 카테고리도 0이 되어 사라져요. 검색을 지우면 다시 보입니다.' },
      ]},
    ],
    related: [['home', 'Map (지도)'], ['rankings', 'Rankings (랭킹)'], ['guide', 'Guide (사용 설명서)']],
  },

  watch: {
    label: 'Watch · 영상 재생',
    tagline: '클립 재생 + 메타정보 + 라이선스 구매 진입점',
    sections: [
      { kind: 'overview', text: '선택한 영상을 재생합니다. YouTube 임베드 또는 우리 CDN 호스팅. 페이지 양쪽 사이드바로 다른 영상 빠르게 둘러보고, 마음에 들면 그 자리에서 라이선스를 구매할 수 있어요.' },
      { kind: 'glossary', title: '페이지 영역 안내', items: [
        { term: '왼쪽 사이드바', desc: '같은 카테고리의 다른 클립 — 클릭으로 즉시 전환.' },
        { term: '플레이어', desc: '중앙 16:9 영상. 유료 영상은 처음 30초만 미리보기, 이후 잠금.' },
        { term: '오른쪽 사이드바', desc: 'Up next 추천 — 알고리즘 기반 다음 볼 만한 영상.' },
        { term: '하단 메타', desc: '제작자, 위치, 장비, 카테고리, 해상도, 라이선스 옵션, 가격 정보.' },
        { term: 'Unlock 버튼', desc: '유료 영상 결제 진입점. Checkout 페이지로 이동.' },
      ]},
      { kind: 'tips', items: [
        '유료 영상의 "LICENSED · $X" 라벨 옆 황색 "DEMO" 배지는 데모 데이터 표시.',
        '왼쪽 사이드바로 같은 카테고리 영상을 빠르게 비교 시청.',
        '제작자 핸들 클릭 → 그 파일럿의 모든 작품 보기.',
        '뒤로가기 시 Map/Explore 페이지의 필터·줌·검색이 그대로 보존.',
      ]},
      { kind: 'faq', items: [
        { q: '미리보기 30초 이후엔 어떻게 되나요?', a: '잠금 화면이 뜨고 "Unlock for $X" 버튼이 표시됩니다. 결제 후엔 영상 전체를 시청 + 다운로드 가능.' },
        { q: '구매한 영상을 재다운로드하려면?', a: '내 계정 메뉴 → "Orders & licenses"에서 모든 구매 내역과 다운로드 링크가 영구 보관됩니다.' },
      ]},
    ],
    related: [['checkout', 'Checkout (결제)'], ['explore', 'Explore (다른 영상 찾기)']],
  },

  commissions: {
    label: 'Commissions · 역경매 의뢰',
    tagline: '원하는 영상을 직접 의뢰 → 파일럿이 입찰 → 에스크로 결제',
    sections: [
      { kind: 'overview', text: '카탈로그에 없는 영상이 필요하면 직접 의뢰합니다. 위치·예산·마감일을 적으면 검증된 파일럿들이 가격과 포트폴리오를 제시하고, 마음에 드는 입찰을 골라 진행해요. 결제 금액은 에스크로에 보관되었다가 결과물 검수 후 송금되므로 양쪽 모두 안전.' },
      { kind: 'visual', component: <CommissionFlowMockup /> },
      { kind: 'glossary', title: '4단계 흐름', items: [
        { term: 'Step 1', desc: '의뢰 등록 — 위치 좌표·예산 범위·마감일·요구사항(시간대·분위기·장비) 작성.' },
        { term: 'Step 2', desc: '입찰 받기 — 24~72h 내 첫 입찰. 각 파일럿의 프로필·평점·과거 작품 검토.' },
        { term: 'Step 3', desc: '입찰 수락 → 에스크로 결제. 다른 입찰은 자동 거절, 작업 시작.' },
        { term: 'Step 4', desc: '결과물 수령 → Accept 버튼 → 송금. 평점·리뷰로 다음 의뢰자에게 도움.' },
      ]},
      { kind: 'glossary', title: '예산 가이드라인 (시장 시세)', items: [
        { term: '소형', desc: '4K 클립 1분 단편 — $200~600. FPV·시네마틱은 더 비쌈.' },
        { term: '시네마틱', desc: '시네마 카메라 + 후반 작업 5분 컷 — $500~1,500.' },
        { term: '프로젝트', desc: '여러 컷 + 편집까지 — $2,000~10,000+.' },
      ]},
      { kind: 'tips', items: [
        '구체적일수록 좋은 입찰: 시간대(일출/일몰), 분위기(시네마틱/다큐), 장비(DJI Mavic 3 이상), 해상도, 길이.',
        '최저가만 보지 말고 포트폴리오 품질을 우선 체크. 평점 4.5+ 권장.',
        '메시지 기능으로 직접 질문 가능 — 촬영 일정·옵션 협상.',
        '마감일 초과 시 자동 환불 옵션 활성화.',
        '수정 요청은 무료 2회까지, 3회부터는 추가 비용 협의.',
      ]},
      { kind: 'faq', items: [
        { q: '에스크로가 뭔가요?', a: '결제 금액을 우리 플랫폼이 중간 보관하다가, 의뢰자가 결과물을 Accept하면 그제서야 파일럿에게 송금하는 방식. 양쪽 모두 위험 부담을 줄여줍니다.' },
        { q: '입찰이 안 들어와요', a: '예산이 시장가 대비 낮거나 요구사항이 너무 까다로울 수 있어요. 예산을 올리거나 요구사항을 단순화해 보세요. 보통 24~72h 내에 첫 입찰이 옵니다.' },
        { q: '결과물이 마음에 안 들면?', a: '수정 요청 2회까지 무료. 그래도 안 되면 분쟁 조정 신청 → 환불 또는 부분 송금 결정. 마감일 초과 시 자동 전액 환불.' },
      ]},
    ],
    related: [['commission', '내 의뢰 상세'], ['creators', 'Creators (파일럿 둘러보기)'], ['pricing', 'Pricing (요금 가이드)']],
  },

  upload: {
    label: 'Upload · 영상 등록',
    tagline: '파일럿이 직접 영상을 올리고 70% 수익',
    sections: [
      { kind: 'overview', text: '직접 촬영한 드론 영상을 두 가지 방식으로 등록합니다. Direct는 우리 CDN에 마스터 파일 업로드, External은 YouTube/Vimeo 링크 임베드. 둘 다 같은 카탈로그에 노출되고 검색·구매 가능.' },
      { kind: 'glossary', title: '두 가지 업로드 방식', items: [
        { term: 'Direct', desc: 'MP4 파일 직접 업로드 → 우리 CDN 호스팅 → 다운로드 가능. 라이선스 판매 가능, 가격 자유 설정.' },
        { term: 'External', desc: 'YouTube/Vimeo 링크 붙여넣기 → 임베드만 → 호스팅비 무료. 라이선스 판매 안 됨, 노출/홍보 목적.' },
      ]},
      { kind: 'glossary', title: '필수 입력 필드', items: [
        { term: '제목', desc: '120자 이내. 검색에 잘 걸리는 키워드 포함 권장.' },
        { term: '설명', desc: '500자. 위치·시간·장비·후반 작업 정보 적으면 라이선스 가치 상승.' },
        { term: '위치', desc: 'Map에서 좌표 클릭 또는 위/경도 직접 입력. 정확할수록 발견율 ↑.' },
        { term: '카테고리', desc: '12개 그룹 중 선택. AI Generated는 별도 표시 의무.' },
        { term: '가격 + 라이선스', desc: '3개 티어(Personal/Commercial/Editorial) 각각 가격 설정. 비활성화 가능.' },
      ]},
      { kind: 'tips', items: [
        '시장 시세: Personal $49~99, Commercial $99~199, Editorial $149~299.',
        '같은 라이선스 안에서 무제한 사용 권리 (1회 결제, 영구 사용).',
        '플랫폼 수수료 15% (수익의 85% 파일럿).',
        '판매 통계는 [내 계정 > Earnings]에서 확인.',
        '품질이 낮은 클립은 자동 검토 후 비공개 처리될 수 있음.',
      ]},
      { kind: 'faq', items: [
        { q: '저작권이 있는 음악을 BGM으로 쓴 영상도 올릴 수 있나요?', a: '안 됩니다. 무음 또는 CC 음원만 허용. 구매자가 자기 음악을 입혀야 하므로 무음이 가장 잘 팔립니다.' },
        { q: '드론 비행 허가가 없는 지역에서 찍은 영상은?', a: '게시 자체가 불가능합니다. 각국 항공법을 준수한 영상만 등록 가능.' },
        { q: '한 영상으로 얼마나 벌 수 있나요?', a: '천차만별. 인기 클립은 월 $500~1,000, 평범한 클립은 월 $50~200. 카테고리·해상도·키워드가 가장 큰 변수.' },
      ]},
    ],
    related: [['earnings', 'Earnings (정산 내역)'], ['guide', 'Guide (사용 설명서)']],
  },

  checkout: {
    label: 'Checkout · 결제',
    tagline: '라이선스 선택 + 결제 (현재 모든 유료는 데모)',
    sections: [
      { kind: 'overview', text: '클립을 사용할 용도(개인·상업·방송)에 맞게 라이선스를 고르고 결제합니다. 결제 후엔 다운로드 링크와 라이선스 PDF가 발급되고, [Orders & licenses]에서 영구 보관됩니다.' },
      { kind: 'visual', component: <CheckoutTiersMockup /> },
      { kind: 'glossary', title: '3가지 라이선스 티어', items: [
        { term: 'Personal', color: '#4a6741', desc: '개인 SNS, 블로그, 학교 과제, 비상업 영상. 가장 저렴.' },
        { term: 'Commercial', color: '#c68820', desc: '광고, 제품 홍보, 마케팅 영상, 클라이언트 작업. 가장 일반적.' },
        { term: 'Editorial', color: '#c85a2e', desc: '방송, 다큐멘터리, 뉴스 (저작권 표시 필수). 재배포·재방영까지 허용.' },
      ]},
      { kind: 'tips', items: [
        '잘못된 라이선스 선택은 환불이 어렵습니다 — 신중하게.',
        '같은 영상을 더 높은 티어로 업그레이드하려면 차액만 추가 결제.',
        '결제 후 다운로드 링크는 30일간 유효, 라이선스 PDF는 영구 보관.',
        '상단 황색 배너의 "데모 모드" 표시 = 실제 결제 처리 안 됨.',
      ]},
      { kind: 'faq', items: [
        { q: '회사 명의로 구매했는데 부서가 다르면?', a: '같은 회사 내부 사용은 OK. 다른 법인이면 새 라이선스 필요.' },
        { q: 'Editorial 라이선스인데 광고에 쓰면?', a: '약관 위반. 라이선스 박탈 + 추가 비용 청구. 광고 용도면 Commercial 이상 필수.' },
      ]},
    ],
    related: [['orders', 'Orders & Licenses (구매 내역)'], ['pricing', 'Pricing (가격 정책)']],
  },

  rankings: {
    label: 'Rankings · 랭킹',
    tagline: '인기 영상 + 인기 파일럿 + 카테고리 트렌드',
    sections: [
      { kind: 'overview', text: '주간/월간/연간 베스트 영상과 판매 1위 파일럿, 카테고리별 급상승 트렌드를 매주 갱신해서 보여줍니다. 무엇을 봐야 할지 모를 때 출발점.' },
      { kind: 'glossary', title: '주요 섹션', items: [
        { term: 'Top Clips', desc: '조회 + 구매 + 평점 종합 점수 상위 10개.' },
        { term: 'Top Pilots', desc: '판매액 + 평점 상위 파일럿 10명.' },
        { term: '신인', desc: '최근 30일 가입한 파일럿 중 인기 급상승.' },
        { term: '카테고리 트렌드', desc: '주간 상승률 (예: AI Generated +120%).' },
      ]},
      { kind: 'tips', items: [
        '기간 토글: This week / This month / All time — 같은 영상이라도 기간 따라 순위 다름.',
        '카테고리 트렌드는 새로 부상하는 분야를 빠르게 알려줌.',
        '무엇을 만들지 고민하는 파일럿이라면 트렌드 ↑인 카테고리부터 시도.',
      ]},
    ],
    related: [['creators', 'Creators (전체 디렉터리)'], ['atlas', 'Atlas (편집 추천)']],
  },

  creators: {
    label: 'Creators · 크리에이터',
    tagline: '활동 중인 모든 검증된 파일럿 디렉터리',
    sections: [
      { kind: 'overview', text: '드론 이카루스에 등록된 모든 파일럿을 프로필 카드로 둘러봅니다. 위치, 전문 분야, 평점, 누적 작품 수가 한눈에 보이고, 카드 클릭하면 그 파일럿의 모든 작품을 확인할 수 있어요.' },
      { kind: 'tips', items: [
        '프로필 클릭 → 작품 갤러리 + 평점 + 리뷰 + 의뢰 받음 여부.',
        'Follow 기능으로 신작 알림 받기.',
        '의뢰 등록 시 우수 파일럿 1순위 추천 슬롯에 노출.',
        'Creator Studio (대시보드)는 본인 카드의 우상단 버튼.',
      ]},
      { kind: 'faq', items: [
        { q: '"검증된" 파일럿은 어떤 기준?', a: '항공법 면허 사본 제출 + 포트폴리오 검수 + 신원 인증 통과한 파일럿만. 일반 가입자는 검증 전엔 Pilot 표시 없음.' },
      ]},
    ],
    related: [['rankings', 'Rankings (인기 파일럿)'], ['commissions', 'Commissions (의뢰)']],
  },

  atlas: {
    label: 'Atlas · 편집장의 지도',
    tagline: '에디터가 큐레이션한 명소 컬렉션',
    sections: [
      { kind: 'overview', text: '여행 블로그처럼 구성된 큐레이션 페이지. 단순한 영상 나열이 아니라, 대륙·국가·시즌별로 가볼 만한 명소를 골라 추천 글 + 관련 영상을 함께 보여줍니다.' },
      { kind: 'tips', items: [
        '랜드마크 카드: 사진 + 짧은 설명 + 추천 영상 링크.',
        '시즌 추천: 봄 벚꽃, 가을 단풍, 겨울 오로라 등 시기별 큐레이션.',
        '대륙 → 국가 → 도시 순으로 드릴다운.',
        '클릭 시 해당 위치 Map 페이지로 핀과 함께 이동.',
      ]},
    ],
    related: [['home', 'Map (지도)'], ['explore', 'Explore (그리드)']],
  },

  lab: {
    label: 'Lab · 연구실',
    tagline: '드론 기술·튜토리얼·논문·특허·장비 리뷰 허브',
    sections: [
      { kind: 'overview', text: '학술 논문, 특허, 오픈소스 펌웨어, 장비 리뷰, 촬영 기법 튜토리얼 같은 깊이 있는 콘텐츠를 모은 곳입니다. 입문자부터 전문가까지 단계별 자료.' },
      { kind: 'glossary', title: '4가지 카테고리', items: [
        { term: 'Research', desc: '학술 논문, 항공역학, AI vision, swarm 알고리즘.' },
        { term: 'Tutorial', desc: '촬영 기법, 후반 작업, 색보정, ND 필터 사용법.' },
        { term: 'Patent', desc: '드론 산업 특허 동향, 기술 흐름.' },
        { term: 'News', desc: '제품 출시, 정책 변화, 산업 이벤트.' },
      ]},
      { kind: 'tips', items: [
        '글 + 영상 + 코드 샘플 혼합 콘텐츠.',
        'AI Generation 워크플로 가이드는 인기 시리즈.',
        '장비별 비교 리뷰 + 점수표.',
      ]},
    ],
    related: [['gear', 'Gear (장비 카탈로그)'], ['guide', 'Guide (사용 설명서)']],
  },

  gear: {
    label: 'Gear · 드론 카탈로그',
    tagline: '300+ 드론 제품 비교 + 가격대별 추천',
    sections: [
      { kind: 'overview', text: '입문용($200)부터 산업용($30,000+)까지 전 세계 드론 제품을 사양·가격·용도별로 비교합니다. 장비 구매 결정 전 한 번 들러보세요.' },
      { kind: 'glossary', title: '필터', items: [
        { term: '$0~500', desc: '입문용. DJI Mini 시리즈, Holy Stone, RYZE.' },
        { term: '$500~2K', desc: '취미·세미프로. DJI Air 3, Avata 2, Autel Nano.' },
        { term: '$2K~5K', desc: '시네마틱·상업. DJI Mavic 3 Pro, Inspire 2, Autel Evo Max.' },
        { term: '$5K+', desc: '시네마·산업·측량. DJI Inspire 3, Freefly Astro, Skydio X10.' },
      ]},
      { kind: 'tips', items: [
        '비교 모드: 최대 4개 제품 동시 비교 (사양·가격·무게).',
        '제품 카드: 사진 + 사양 + 가격 + 추천 용도 + 추천 라이선스 등급.',
        '신규 출시순 + 평점순 정렬 가능.',
      ]},
    ],
    related: [['lab', 'Lab (장비 리뷰 글)']],
  },

  live: {
    label: 'Live · 실시간 방송',
    tagline: '드론 라이브 방송 + 슈퍼챗 후원',
    sections: [
      { kind: 'overview', text: '파일럿이 비행하면서 실시간 방송하는 영상을 보고, 채팅·슈퍼챗으로 후원할 수 있어요. 좋은 장면이 나오는 순간을 함께 보고 응원하는 채널.' },
      { kind: 'tips', items: [
        '진행 중인 라이브 방송 그리드 (실시간 시청자 수 표시).',
        '예약된 방송 (D-day 카운트다운).',
        '슈퍼챗 후원의 70%는 파일럿에게 송금.',
        '내가 방송하려면 [Live help · Go live guide] 참고 (장비·OBS 설정·송출).',
      ]},
    ],
    related: [['livehelp', 'Live help (방송 가이드)'], ['mystreams', '내 방송 기록']],
  },

  shots: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    sections: [
      { kind: 'overview', text: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다. 전속 매니저가 큐레이션부터 결제·계약까지 담당.' },
      { kind: 'tips', items: [
        '맞춤 큐레이션 + 전속 매니저 배정.',
        '월간 구독 옵션 (스톡 풋티지 형태).',
        '견적 요청 폼: 예산·용도·기간 입력.',
        '대형 캠페인용 우선 선택권 제공.',
      ]},
    ],
    related: [['pricing', 'Pricing (요금제)'], ['commissions', 'Commissions (단건 의뢰)']],
  },

  shotlibrary: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    sections: [
      { kind: 'overview', text: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다. 전속 매니저가 큐레이션부터 결제·계약까지 담당.' },
      { kind: 'tips', items: [
        '맞춤 큐레이션 + 전속 매니저 배정.',
        '월간 구독 옵션.',
        '견적 요청 폼: 예산·용도·기간 입력.',
      ]},
    ],
    related: [['pricing', 'Pricing (요금제)'], ['commissions', 'Commissions (단건 의뢰)']],
  },

  pricing: {
    label: 'Pricing · 요금제',
    tagline: '플랫폼 수수료 + 라이선스 가격대 가이드',
    sections: [
      { kind: 'overview', text: '구매자/판매자/의뢰자 입장별 요금 구조를 한 페이지에 정리합니다. 70/30 분배 원칙은 모든 거래에 동일하게 적용돼요.' },
      { kind: 'glossary', title: '입장별 요금', items: [
        { term: '구매자', desc: '라이선스 가격 그대로 (Personal $49~99, Commercial $99~199, Editorial $149~299).' },
        { term: '판매자', desc: '판매가의 85% 정산 (수수료 15%). 매월 1일 자동 송금.' },
        { term: '의뢰자', desc: '입찰 가격 + 에스크로 수수료 5%.' },
        { term: '엔터프라이즈', desc: '맞춤 견적 (대량 패키지·월간 구독).' },
      ]},
    ],
    related: [['guide', 'Guide (사용 설명서)']],
  },

  guide: {
    label: 'Guide · 사용 설명서',
    tagline: '단계별 한국어 사용 가이드',
    sections: [
      { kind: 'overview', text: '클립 구매·판매·의뢰의 모든 절차를 SVG 목업과 함께 단계별로 설명합니다. 모든 페이지에 대한 안내도 여기 있어요.' },
      { kind: 'glossary', title: '4개 탭', items: [
        { term: '클립 구매', desc: '4단계 (지도/그리드 → 미리보기 → 라이선스 → 결제).' },
        { term: '클립 판매', desc: '4단계 (가입 → 업로드 → 가격 설정 → 모니터링).' },
        { term: '커스텀 의뢰', desc: '4단계 (작성 → 입찰 → 수락 → 수령).' },
        { term: '모든 페이지', desc: '14개 페이지의 자세한 설명 + 해당 페이지 바로가기.' },
      ]},
    ],
    related: [['home', 'Map (시작하기)'], ['pricing', 'Pricing (요금)']],
  },
};

const FALLBACK = {
  label: 'Drone Icarus',
  tagline: '항공 드론 영상 마켓플레이스',
  sections: [
    { kind: 'overview', text: '드론 이카루스는 전 세계 드론 영상의 거래·의뢰·발견을 한 곳에서 처리하는 플랫폼입니다.' },
    { kind: 'tips', items: [
      '구매: Map 또는 Explore에서 영상 찾기 → 라이선스 구매',
      '판매: Upload에서 영상 등록 → 70% 수익',
      '의뢰: Commissions에서 원하는 영상 의뢰 → 파일럿 입찰',
      '학습: Lab에서 기술·튜토리얼·장비 리뷰',
    ]},
  ],
  related: [['guide', 'Guide (사용 설명서)'], ['home', 'Map (시작하기)']],
};

function renderSection(s, i) {
  if (s.kind === 'overview') {
    return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--parchment, #1f2b22)', margin: '0 0 18px' }}>{s.text}</p>;
  }
  if (s.kind === 'visual') {
    return <div key={i} style={{ marginBottom: 22 }}>{s.component}</div>;
  }
  if (s.kind === 'glossary') {
    return <Section key={i} title={s.title}><Glossary items={s.items} /></Section>;
  }
  if (s.kind === 'tips') {
    return <Section key={i} title="실용 팁"><Bullets items={s.items} /></Section>;
  }
  if (s.kind === 'faq') {
    return <Section key={i} title="자주 묻는 질문"><FAQ items={s.items} /></Section>;
  }
  return null;
}

export function PageInfoButton({ route, onNav }) {
  const [open, setOpen] = useState(false);
  const info = INFO[route] || FALLBACK;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (['admin', 'signin', 'auth'].includes(route)) return null;

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
            maxWidth: 720, width: '100%', maxHeight: '90vh', overflow: 'auto',
            background: 'var(--ink, #faf6ec)',
            color: 'var(--bone, #0f1a14)',
            border: '1px solid var(--line-strong)',
            borderRadius: 12,
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '24px 30px',
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
            <h2 style={{ fontSize: 26, margin: '6px 0 6px', color: 'var(--bone, #0f1a14)' }}>{info.label}</h2>
            <p style={{ fontSize: 14, color: 'var(--moss, #4a6741)', margin: '0 0 22px', fontWeight: 600 }}>{info.tagline}</p>

            {info.sections?.map(renderSection)}

            {info.related && info.related.length > 0 && (
              <Section title="관련 페이지">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
              </Section>
            )}

            <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--line, rgba(26,40,32,0.12))', fontSize: 12, color: 'var(--parchment-dim, #4a5548)' }}>
              전체 가이드는 <button onClick={() => { setOpen(false); onNav?.('guide'); }} style={{ background: 'transparent', border: 'none', color: 'var(--moss, #4a6741)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}>Guide 페이지</button>에서 확인하세요.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PageInfoButton;
