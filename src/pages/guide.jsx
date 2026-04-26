// pages/guide.jsx — Korean user guide with annotated UI mockups
import React, { useState } from 'react';
import { Ic } from '../components';

const TABS = [
  { id: 'license', label: '클립 라이선싱', sub: 'For Buyers' },
  { id: 'upload',  label: '업로드 + 판매', sub: 'For Pilots' },
  { id: 'commission', label: '커스텀 의뢰',  sub: 'Reverse Auction' },
];

export function GuidePage({ onNav }) {
  const [tab, setTab] = useState('license');
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 10 }}>● 사용 안내</div>
      <h1 style={{ fontSize: 48, letterSpacing: '-0.02em', marginBottom: 12 }}>드론아이카루스 사용법</h1>
      <p style={{ fontSize: 16, color: 'var(--parchment)', maxWidth: 720, lineHeight: 1.6, marginBottom: 32 }}>
        드론 영상을 사고팔고, 직접 의뢰하는 모든 흐름을 단계별로 안내합니다. 각 화면은 실제 페이지를 그대로 옮긴 모형입니다.
      </p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '14px 22px',
            borderBottom: tab === t.id ? '2px solid var(--sunset)' : '2px solid transparent',
            color: tab === t.id ? 'var(--bone)' : 'var(--parchment-dim)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            borderBottomWidth: 2, borderBottomStyle: 'solid', marginBottom: -1,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
          }}>
            <span style={{ fontSize: 17, fontWeight: tab === t.id ? 700 : 500 }}>{t.label}</span>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}>{t.sub}</span>
          </button>
        ))}
      </div>

      {tab === 'license'    && <LicenseGuide onNav={onNav}/>}
      {tab === 'upload'     && <UploadGuide onNav={onNav}/>}
      {tab === 'commission' && <CommissionGuide onNav={onNav}/>}

      {/* Footer CTA */}
      <div className="di-card" style={{ marginTop: 60, padding: 28, textAlign: 'center', background: 'linear-gradient(135deg, rgba(200,90,46,0.05), rgba(140,180,100,0.05))' }}>
        <h3 style={{ fontSize: 22, marginBottom: 8 }}>준비됐다면 시작해 보세요</h3>
        <p style={{ fontSize: 14, color: 'var(--parchment-dim)', marginBottom: 18 }}>3초 미리보기로 누구나 둘러볼 수 있습니다. 라이선스가 필요하면 결제, 직접 찍을 사람이 필요하면 의뢰를 등록하세요.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => onNav('home')}>지도에서 둘러보기</button>
          <button className="btn secondary" onClick={() => onNav('commissions')}>의뢰 게시판</button>
          <button className="btn secondary" onClick={() => onNav('upload')}>내 클립 업로드</button>
        </div>
      </div>
    </div>
  );
}

// ─── Step block (numbered + caption + UI mockup) ─────────────────
function Step({ n, title, caption, children, accent = 'var(--sunset)' }) {
  return (
    <div className="di-card" style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 24, padding: 24, marginBottom: 18, alignItems: 'flex-start' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', background: accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, flexShrink: 0,
      }}>{n}</div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ fontSize: 20, marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.65, marginBottom: 14 }}>{caption}</p>
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: 라이선싱 (Buyers) ─────────────────────────────────────
function LicenseGuide({ onNav }) {
  return (
    <div>
      <Intro
        eyebrow="구매자 트랙"
        title="이미 촬영된 클립을 구매하기"
        body="지도와 카테고리 두 가지 축으로 1,500개 이상의 영상을 둘러볼 수 있습니다. 무료 클립(YouTube CC-BY)과 유료 라이선스 클립이 함께 있고, 좌측 사이드바 라이선스 필터로 골라 볼 수 있어요."
      />
      <Step n={1} title="지도에서 위치 기반 탐색" caption="홈(지도)에서는 영상이 촬영된 장소가 핀으로 표시됩니다. 좌측 사이드바에서 카테고리를 누르면 해당 주제만 필터됩니다. 유료 클립은 주황색 핀에 가격 배지($)가 붙어 한눈에 구분됩니다.">
        <MapMockup/>
      </Step>
      <Step n={2} title="카테고리로 찾기 (Explore)" caption="더 평면적으로 그리드 형태로 둘러보고 싶다면 Explore. 상단의 라이선스 칩(All / Free / Paid / Commercial / Extended / Exclusive)으로 거를 수 있고, 정렬은 Trending / Newest / Highest rated / Free first 중에서 선택합니다.">
        <ExploreMockup/>
      </Step>
      <Step n={3} title="클립 상세 — 미리보기 + 라이선스 티어 선택" caption="썸네일을 클릭하면 3초 미리보기가 자동 재생됩니다. 그 아래 4개의 라이선스 티어 카드가 있어요. Personal(개인 프로젝트) / Commercial(상업 활용) / Extended(방송·OTT) / Exclusive(독점 매수). 가격은 파일럿이 정한 기준값을 1× / 1.8× / 3.5× / 견적으로 자동 계산.">
        <WatchMockup/>
      </Step>
      <Step n={4} title="체크아웃 — 한 번 결제, 영구 사용권" caption="원하는 티어를 누르면 체크아웃으로 이동. 카드 또는 PayPal 결제 가능. VAT 8% 자동 적용. 구독이 아니라 한 번 결제해서 해당 티어 범위에서 영구 사용. 24시간 이내 환불 보장.">
        <CheckoutMockup/>
      </Step>
      <Step n={5} title="다운로드 패키지" caption="결제 완료되면 4K MP4(H.264) + 4K ProRes 422 HQ + LUT 파일(.cube) + 서명된 라이선스 PDF가 즉시 받을 수 있게 준비됩니다. 마스터는 7일 안에 받아야 하고, 그 후에는 본인이 백업을 보관해야 합니다.">
        <DownloadMockup/>
      </Step>
      <Step n={6} title="재다운로드 + 라이선스 보관" caption="구매 후에는 #orders 페이지(My Locker)에서 본인이 산 모든 라이선스를 다시 받을 수 있고, 라이선스 PDF도 따로 저장할 수 있습니다. 회계감사용으로 활용 가능.">
        <OrdersMockup/>
      </Step>
    </div>
  );
}

// ─── Tab 2: 업로드 + 판매 (Pilots) ────────────────────────────────
function UploadGuide({ onNav }) {
  return (
    <div>
      <Intro
        eyebrow="파일럿 트랙"
        title="내 영상을 올리고 70%를 가져가세요"
        body="구독료, 업로드 수수료, 저장 비용 모두 0원. 라이선스가 팔릴 때마다 70%가 들어옵니다. 매달 28일 PayPal로 자동 정산(잔액 $50 이상)."
      />
      <Step n={1} title="회원가입 + 파일럿 인증" caption="이메일로 가입한 뒤 #pilot-onboarding에서 페이아웃 정보(PayPal · 본명 · 국가)를 등록합니다. 인증 파일럿은 노란 체크 배지를 받고, 검색 결과 우선 노출 + 커스텀 의뢰 받기 자격을 얻습니다." accent="var(--moss)">
        <SignupMockup/>
      </Step>
      <Step n={2} title="업로드 — 파일 또는 외부 링크" caption="MP4 / MOV / MKV / WebM, 50GB까지 직접 업로드 가능. 이미 Dropbox · Vimeo · Google Drive · Frame.io · WeTransfer에 호스팅된 영상은 URL만 붙여 넣으면 됩니다." accent="var(--moss)">
        <UploadMockup/>
      </Step>
      <Step n={3} title="메타데이터 — 제목 · 설명 · 위치" caption="제목과 설명은 검색에 사용. 위치는 랜드마크 검색 / 좌표 직접 입력 / 지도에서 직접 클릭 세 가지로 지정. 이 좌표가 지도 핀 위치가 됩니다." accent="var(--moss)">
        <MetadataMockup/>
      </Step>
      <Step n={4} title="가격 + 라이선스 티어" caption="기준 가격(USD)을 정하면 Personal $X / Commercial $1.8X / Extended $3.5X 가 자동 계산. 파일럿은 매 라이선스 매출의 70%를 가져가고, 30%는 플랫폼 수수료(결제·전송 수수료 포함, 추가 차감 없음)." accent="var(--moss)">
        <PricingMockup/>
      </Step>
      <Step n={5} title="공개 범위 + 발행" caption="Public(검색·지도·익스플로어 모두 노출) / Unlisted(링크 있는 사람만) / Private(나만 보기) 중 선택. Allow commercial(상업 사용 허용) / Allow remix(2차창작 허용) 토글로 라이선스 깊이 조절." accent="var(--moss)">
        <VisibilityMockup/>
      </Step>
      <Step n={6} title="수익 정산" caption="매달 28일 PayPal로 자동 송금. 잔액 $50 이하는 다음 달로 이월. 수수료(Wise/PayPal)는 플랫폼 30%에서 부담하므로 파일럿이 받는 70%에서 추가 차감되지 않습니다." accent="var(--moss)">
        <PayoutMockup/>
      </Step>
    </div>
  );
}

// ─── Tab 3: 커스텀 의뢰 (Reverse auction) ─────────────────────────
function CommissionGuide({ onNav }) {
  return (
    <div>
      <Intro
        eyebrow="역경매 의뢰"
        title="원하는 영상이 카탈로그에 없다면 직접 의뢰하세요"
        body="구매자가 브리핑(예산 + 마감 + 위치 + 라이선스 종류)을 등록하면, 인증 파일럿들이 가격과 ETA로 비드를 겁니다. 가장 적합한 비드를 골라 수락하면 계약 성립."
      />

      <h2 style={{ fontSize: 24, marginTop: 36, marginBottom: 14, color: 'var(--sunset)' }}>구매자 트랙</h2>
      <Step n={1} title="의뢰 등록" caption="#commission-new에서 폼 작성. 제목, 상세 브리핑, 카테고리, 위치(좌표), 예산 상한, 마감일, 필요한 라이선스 등급(personal / commercial / extended / exclusive), 해상도. 등록하면 의뢰 게시판(#commissions)에 즉시 표시됩니다.">
        <CommissionNewMockup/>
      </Step>
      <Step n={2} title="비드 받기" caption="파일럿들이 비드를 걸면 의뢰 상세 페이지에 실시간으로 쌓입니다. 각 비드에 가격, ETA(영업일), 자기소개 피치, 파일럿 핸들이 보입니다.">
        <CommissionBidsMockup/>
      </Step>
      <Step n={3} title="수락 + 계약 성립" caption="마음에 드는 비드의 Accept 버튼을 누르면 그 비드 status='accepted', 의뢰 status='awarded'로 즉시 변경. 다른 비드들은 자동 reject. 'WINNING BID' 배지가 붙고, 파일럿에게 알림이 갑니다.">
        <CommissionAwardedMockup/>
      </Step>

      <h2 style={{ fontSize: 24, marginTop: 48, marginBottom: 14, color: 'var(--moss)' }}>파일럿 트랙</h2>
      <Step n={1} title="의뢰 둘러보기" caption="#commissions에서 열려있는 의뢰들을 카테고리, 지역, 예산, 마감 기준으로 필터·정렬. 카드에 예산 상한, 남은 일수, 현재 비드 수가 표시됩니다." accent="var(--moss)">
        <CommissionListMockup/>
      </Step>
      <Step n={2} title="비드 등록" caption="관심 있는 의뢰의 상세 페이지에서 'Place a bid' 폼을 작성. 가격(예산 상한 이하 권장), ETA(촬영+납품까지 며칠), 짧은 피치(왜 나를 골라야 하는지). 한 의뢰에 한 명당 한 번만 비드 가능." accent="var(--moss)">
        <BidFormMockup/>
      </Step>
      <Step n={3} title="결과 알림" caption="버이어가 비드를 수락하면 본인 비드 status가 'accepted'로 표시되고 'WINNING BID' 배지가 붙어요. 떨어진 비드는 'rejected'로 자동 처리됩니다. 수락된 후의 결제·납품·파일 전달은 의뢰 페이지의 메시지로 진행." accent="var(--moss)">
        <BidWonMockup/>
      </Step>
    </div>
  );
}

// ─── Intro section ──────────────────────────────────────────
function Intro({ eyebrow, title, body }) {
  return (
    <div style={{ marginBottom: 28, padding: '20px 24px', borderLeft: '3px solid var(--sunset)', background: 'rgba(200,90,46,0.04)', borderRadius: 4 }}>
      <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 6 }}>{eyebrow}</div>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

// ─── UI MOCKUPS (SVG-based, mirror real page styling) ────────
const MapMockup = () => (
  <svg viewBox="0 0 800 360" style={{ width: '100%', display: 'block' }}>
    <defs>
      <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a8c8d0"/><stop offset="1" stopColor="#7fa3ad"/></linearGradient>
    </defs>
    <rect width="800" height="360" fill="#faf6ec"/>
    {/* Sidebar */}
    <rect x="0" y="0" width="200" height="360" fill="#fff" stroke="#e8dfc8"/>
    <text x="14" y="28" fontFamily="JetBrains Mono" fontSize="10" fill="#666" letterSpacing="1.5">BROWSE BY THEME</text>
    {[['All clips','1000','active'],['Nature','97'],['Ocean & Coast','13'],['Cities','209'],['Heritage','1'],['Warfare','161'],['AI Generated','32']].map((row, i) => (
      <g key={i} transform={`translate(0, ${50 + i * 28})`}>
        <rect x="8" y="0" width="184" height="22" rx="4" fill={row[2] === 'active' ? '#1f2b22' : 'transparent'}/>
        <text x="20" y="15" fontSize="13" fontFamily="Inter" fill={row[2] === 'active' ? '#faf6ec' : '#1f2b22'}>{row[0]}</text>
        <text x="180" y="15" fontSize="11" fontFamily="JetBrains Mono" fill={row[2] === 'active' ? '#faf6ec' : '#888'} textAnchor="end">{row[1]}</text>
      </g>
    ))}
    <text x="14" y="270" fontFamily="JetBrains Mono" fontSize="10" fill="#666" letterSpacing="1.5">LICENSE</text>
    {[['Free only', false],['Paid clips', true],['Commercial', false],['Exclusive', false]].map((row, i) => (
      <g key={i} transform={`translate(0, ${290 + i * 18})`}>
        <rect x="14" y="2" width="10" height="10" rx="2" fill="#fff" stroke={row[1] ? '#c85a2e' : '#ccc'} strokeWidth="1.5"/>
        {row[1] && <path d="M16 7 l2 2 l4 -4" stroke="#c85a2e" strokeWidth="1.5" fill="none"/>}
        <text x="32" y="11" fontSize="12" fontFamily="Inter" fill="#1f2b22">{row[0]}</text>
      </g>
    ))}
    {/* Map */}
    <rect x="200" y="0" width="600" height="360" fill="url(#ocean)"/>
    {/* Land masses */}
    <path d="M 250 80 Q 350 50 460 90 L 480 160 Q 460 200 380 220 L 300 200 Q 240 180 250 80 Z" fill="#9bb087"/>
    <path d="M 530 200 Q 620 180 700 200 L 720 280 Q 660 310 580 290 L 530 280 Z" fill="#9bb087"/>
    {/* Pins — paid (orange) and free (cream) */}
    <g>{[[330, 130, true, 299], [400, 170, true, 99], [430, 110, false], [580, 230, true, 199], [650, 260, false], [350, 200, true, 49]].map(([x, y, paid, price], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="9" fill={paid ? '#c85a2e' : '#a8a090'} stroke="#fff" strokeWidth="2"/>
        {paid && <g transform={`translate(${x+6}, ${y-12})`}>
          <rect x="0" y="0" width="32" height="14" rx="7" fill="#c85a2e" stroke="#fff" strokeWidth="1.5"/>
          <text x="16" y="10" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#fff" textAnchor="middle">${price}</text>
        </g>}
      </g>
    ))}</g>
    {/* Annotation */}
    <g transform="translate(580, 30)">
      <rect x="0" y="0" width="200" height="58" rx="6" fill="#fff" stroke="#c85a2e" strokeWidth="2"/>
      <text x="12" y="20" fontSize="11" fontFamily="JetBrains Mono" fill="#c85a2e" letterSpacing="1">유료 핀</text>
      <text x="12" y="38" fontSize="12" fontFamily="Inter" fill="#1f2b22">주황색 + $가격 배지로</text>
      <text x="12" y="52" fontSize="12" fontFamily="Inter" fill="#1f2b22">한눈에 구분됩니다</text>
    </g>
  </svg>
);

const ExploreMockup = () => (
  <svg viewBox="0 0 800 360" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="360" fill="#faf6ec"/>
    <rect x="0" y="0" width="200" height="360" fill="#fff" stroke="#e8dfc8"/>
    <text x="14" y="28" fontSize="11" fontFamily="JetBrains Mono" fill="#666" letterSpacing="1.5">CATEGORIES</text>
    {['Nature','Ocean','Sky','Cities','Heritage','Action','Warfare','AI'].map((c, i) => (
      <text key={i} x="20" y={56 + i*22} fontSize="13" fontFamily="Inter" fill={i === 3 ? '#c85a2e' : '#1f2b22'} fontWeight={i === 3 ? '700' : '400'}>{c}</text>
    ))}
    {/* Header */}
    <text x="216" y="32" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Cities · 209 clips</text>
    {/* License chips */}
    <text x="216" y="60" fontSize="9" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.5">LICENSE</text>
    {[['All',false],['Free',false],['Paid',true],['Commercial',false],['Extended',false]].map(([label, active], i) => (
      <g key={i} transform={`translate(${268 + i * 75}, 50)`}>
        <rect width="65" height="20" rx="10" fill={active ? '#c85a2e' : 'transparent'} stroke={active ? '#c85a2e' : '#ccc'}/>
        <text x="32" y="14" fontSize="11" fontFamily="Inter" fill={active ? '#fff' : '#1f2b22'} textAnchor="middle">{label}</text>
      </g>
    ))}
    {/* Cards grid 4x2 */}
    {Array.from({length: 8}).map((_, i) => {
      const r = Math.floor(i/4), c = i % 4;
      const x = 220 + c * 142, y = 88 + r * 130;
      const paid = [0, 2, 5, 7].includes(i);
      const price = [299, 0, 49, 0, 0, 199, 0, 89][i];
      return (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <rect width="130" height="118" rx="6" fill="#fff" stroke="rgba(26,40,32,0.16)"/>
          <rect x="0" y="0" width="130" height="74" rx="6" fill="#3a4a55"/>
          <rect x="0" y="60" width="130" height="14" fill="#3a4a55"/>
          {paid ? (
            <g transform="translate(8, 8)">
              <rect width="40" height="16" rx="3" fill="#c85a2e"/>
              <text x="20" y="11" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#fff" textAnchor="middle">${price}</text>
            </g>
          ) : (
            <g transform="translate(8, 8)">
              <rect width="36" height="16" rx="3" fill="#8a9a5b"/>
              <text x="18" y="11" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#fff" textAnchor="middle">FREE</text>
            </g>
          )}
          <text x="6" y="92" fontSize="9" fontFamily="JetBrains Mono" fill="#c68820">CITYSCAPE</text>
          <text x="6" y="106" fontSize="10" fontFamily="Inter" fontWeight="600" fill="#1f2b22">Tokyo skyline 4K</text>
        </g>
      );
    })}
  </svg>
);

const WatchMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    {/* Player area */}
    <rect x="20" y="20" width="500" height="280" fill="#0d1410" rx="4"/>
    <polygon points="245,140 245,180 285,160" fill="#c85a2e"/>
    <text x="270" y="220" fontSize="12" fontFamily="JetBrains Mono" fill="#faf6ec" textAnchor="middle">PREVIEW · 3 SECONDS</text>
    {/* Sidebar */}
    <text x="540" y="42" fontSize="18" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Tokyo at dusk</text>
    <text x="540" y="60" fontSize="11" fontFamily="JetBrains Mono" fill="#888">@aerialnomad · 4K · 0:45</text>
    {/* License tiers */}
    <text x="20" y="328" fontSize="10" fontFamily="JetBrains Mono" fill="#666" letterSpacing="1.5">CHOOSE A LICENSE TIER</text>
    {[['Personal','$49','Edits, social, non-commercial', false],
      ['Commercial','$99','Ads, client work, online', true],
      ['Extended','$198','Broadcast & streaming', false],
      ['Exclusive','By quote','Buyout · perpetual · all media', false]].map(([name, price, desc, popular], i) => (
      <g key={i} transform={`translate(${20 + i * 195}, 340)`}>
        <rect width="180" height="30" rx="4" fill={popular ? 'rgba(232,176,74,0.05)' : '#fff'} stroke={popular ? '#c68820' : 'rgba(26,40,32,0.16)'}/>
        {popular && <rect x="120" y="-8" width="55" height="14" rx="2" fill="#c68820"/>}
        {popular && <text x="148" y="2" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#1a2820" textAnchor="middle">POPULAR</text>}
        <text x="10" y="14" fontSize="10" fontFamily="JetBrains Mono" fill={popular ? '#c68820' : '#888'} letterSpacing="1">{name.toUpperCase()}</text>
        <text x="10" y="26" fontSize="14" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">{price}</text>
      </g>
    ))}
  </svg>
);

const CheckoutMockup = () => (
  <svg viewBox="0 0 800 360" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="360" fill="#faf6ec"/>
    <rect x="40" y="30" width="500" height="290" rx="6" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="60" y="60" fontSize="11" fontFamily="JetBrains Mono" fill="#c85a2e" letterSpacing="1.5">LICENSE CHECKOUT</text>
    <text x="60" y="86" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Tokyo at dusk · 4K</text>
    <text x="60" y="104" fontSize="12" fontFamily="Inter" fill="#888">@aerialnomad · 0:45</text>
    {/* Line items */}
    <line x1="60" y1="130" x2="520" y2="130" stroke="#eee"/>
    <text x="60" y="150" fontSize="13" fontFamily="Inter" fill="#1f2b22">Commercial license · perpetual · worldwide</text>
    <text x="520" y="150" fontSize="14" fontFamily="JetBrains Mono" fontWeight="600" fill="#1f2b22" textAnchor="end">$99.00</text>
    <text x="60" y="172" fontSize="13" fontFamily="Inter" fill="#888">VAT (8%)</text>
    <text x="520" y="172" fontSize="14" fontFamily="JetBrains Mono" fill="#888" textAnchor="end">$7.92</text>
    <line x1="60" y1="186" x2="520" y2="186" stroke="#eee"/>
    <text x="60" y="208" fontSize="14" fontFamily="Inter" fontWeight="700" fill="#1f2b22">Total</text>
    <text x="520" y="208" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#c85a2e" textAnchor="end">$106.92</text>
    {/* Payment */}
    <rect x="60" y="230" width="220" height="36" rx="4" fill="#fff" stroke="#c85a2e" strokeWidth="2"/>
    <text x="170" y="252" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#1f2b22" textAnchor="middle">Card</text>
    <rect x="290" y="230" width="220" height="36" rx="4" fill="#fff" stroke="#ccc"/>
    <text x="400" y="252" fontSize="13" fontFamily="Inter" fill="#888" textAnchor="middle">PayPal</text>
    <rect x="60" y="282" width="450" height="32" rx="4" fill="#c85a2e"/>
    <text x="285" y="302" fontSize="14" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">Pay $106.92</text>
    {/* Side note */}
    <g transform="translate(560, 30)">
      <rect width="200" height="100" rx="6" fill="rgba(140,180,100,0.08)" stroke="rgba(138,154,91,0.5)"/>
      <text x="14" y="24" fontSize="11" fontFamily="JetBrains Mono" fill="#8a9a5b" letterSpacing="1">ONE-TIME · NO SUBSCRIPTION</text>
      <text x="14" y="50" fontSize="12" fontFamily="Inter" fill="#1f2b22" >영구 사용권</text>
      <text x="14" y="68" fontSize="12" fontFamily="Inter" fill="#1f2b22">24시간 환불 보장</text>
      <text x="14" y="86" fontSize="12" fontFamily="Inter" fill="#1f2b22">VAT 자동 계산</text>
    </g>
  </svg>
);

const DownloadMockup = () => (
  <svg viewBox="0 0 800 280" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="280" fill="#faf6ec"/>
    <circle cx="400" cy="60" r="32" fill="#8a9a5b"/>
    <path d="M 386 60 l10 10 l18 -18" stroke="#fff" strokeWidth="3" fill="none"/>
    <text x="400" y="120" fontSize="10" fontFamily="JetBrains Mono" fill="#888" textAnchor="middle" letterSpacing="1.5">PAYMENT CONFIRMED · 2026.04.25</text>
    <text x="400" y="148" fontSize="22" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22" textAnchor="middle">License issued.</text>
    <text x="400" y="166" fontSize="12" fontFamily="Inter" fill="#888" textAnchor="middle">Order DI-2026-31124 · Emailed to you</text>
    {/* Download tiles */}
    {[['MP4 H.264','4K · 3.4 GB'],['ProRes 422 HQ','4K · 24.8 GB'],['LUT .CUBE','D-Log M · 12 KB'],['License.pdf','Signed · 84 KB']].map(([name, sub], i) => (
      <g key={i} transform={`translate(${100 + i * 150}, 200)`}>
        <rect width="130" height="50" rx="6" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
        <text x="65" y="22" fontSize="12" fontFamily="Inter" fontWeight="600" fill="#1f2b22" textAnchor="middle">{name}</text>
        <text x="65" y="38" fontSize="10" fontFamily="JetBrains Mono" fill="#888" textAnchor="middle">{sub}</text>
        <rect x="40" y="60" width="50" height="18" rx="3" fill="#c85a2e"/>
        <text x="65" y="73" fontSize="10" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">Download</text>
      </g>
    ))}
  </svg>
);

const OrdersMockup = () => (
  <svg viewBox="0 0 800 220" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="220" fill="#faf6ec"/>
    <text x="40" y="40" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">My Locker</text>
    <text x="40" y="58" fontSize="12" fontFamily="Inter" fill="#888">Every clip you've licensed, ready to re-download. Held for 12 months after purchase.</text>
    {[['DI-2026-31124', 'Tokyo at dusk · Commercial', '$99', '4 files'],
      ['DI-2026-12877', 'Mt Fuji sunrise · Personal', '$49', '4 files'],
      ['DI-2026-09141', 'Iceland glacier · Extended', '$198', '4 files']].map(([id, t, p, f], i) => (
      <g key={i} transform={`translate(40, ${82 + i * 38})`}>
        <rect width="720" height="32" rx="4" fill="#fff" stroke="rgba(26,40,32,0.16)"/>
        <text x="14" y="20" fontSize="11" fontFamily="JetBrains Mono" fill="#888">{id}</text>
        <text x="160" y="20" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#1f2b22">{t}</text>
        <text x="540" y="20" fontSize="13" fontFamily="JetBrains Mono" fill="#1f2b22">{p}</text>
        <text x="600" y="20" fontSize="11" fontFamily="JetBrains Mono" fill="#888">{f}</text>
        <rect x="660" y="6" width="50" height="20" rx="3" fill="#c85a2e"/>
        <text x="685" y="20" fontSize="10" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">Re-DL</text>
      </g>
    ))}
  </svg>
);

const SignupMockup = () => (
  <svg viewBox="0 0 800 240" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="240" fill="#faf6ec"/>
    <rect x="180" y="30" width="440" height="180" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="400" y="68" fontSize="22" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22" textAnchor="middle">Become a pilot</text>
    <text x="400" y="92" fontSize="13" fontFamily="Inter" fill="#888" textAnchor="middle">70% per license · monthly PayPal · no upfront</text>
    {/* Inputs */}
    <rect x="220" y="110" width="360" height="32" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="232" y="130" fontSize="13" fontFamily="Inter" fill="#888">PayPal email</text>
    <rect x="220" y="148" width="170" height="32" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="232" y="168" fontSize="13" fontFamily="Inter" fill="#888">Legal name</text>
    <rect x="410" y="148" width="170" height="32" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="422" y="168" fontSize="13" fontFamily="Inter" fill="#888">Country</text>
  </svg>
);

const UploadMockup = () => (
  <svg viewBox="0 0 800 240" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="240" fill="#faf6ec"/>
    <text x="40" y="36" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Bring your footage home.</text>
    {/* Tabs */}
    <rect x="40" y="56" width="120" height="30" rx="4" fill="#fff" stroke="#c85a2e" strokeWidth="2"/>
    <text x="100" y="76" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#c85a2e" textAnchor="middle">Upload file</text>
    <rect x="170" y="56" width="160" height="30" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="250" y="76" fontSize="13" fontFamily="Inter" fill="#888" textAnchor="middle">Link external host</text>
    {/* Drop zone */}
    <rect x="40" y="100" width="720" height="120" rx="8" fill="#fbf6e9" stroke="rgba(26,40,32,0.30)" strokeDasharray="6 6"/>
    <text x="400" y="148" fontSize="16" fontFamily="Inter" fontWeight="600" fill="#1f2b22" textAnchor="middle">파일을 끌어 놓거나 클릭해서 선택</text>
    <text x="400" y="170" fontSize="12" fontFamily="JetBrains Mono" fill="#888" textAnchor="middle">MP4 · MOV · MKV · WebM · 최대 50GB</text>
    <text x="400" y="190" fontSize="11" fontFamily="Inter" fill="#888" textAnchor="middle">또는 Dropbox · Vimeo · Google Drive · Frame.io · WeTransfer URL 붙여넣기</text>
  </svg>
);

const MetadataMockup = () => (
  <svg viewBox="0 0 800 280" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="280" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="240" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="60" y="48" fontSize="11" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.5">DETAILS · THUMBNAIL · VIDEO · PRICING · VISIBILITY</text>
    <text x="60" y="76" fontSize="12" fontFamily="Inter" fill="#1f2b22">Title</text>
    <rect x="60" y="84" width="680" height="32" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="72" y="104" fontSize="13" fontFamily="Inter" fill="#1f2b22">Mt Fuji at sunrise — cinematic 4K</text>
    <text x="60" y="138" fontSize="12" fontFamily="Inter" fill="#1f2b22">Location *</text>
    {[['Pick a landmark', true],['Enter coordinates', false],['Drop on map', false]].map(([label, active], i) => (
      <g key={i} transform={`translate(${60 + i * 130}, 146)`}>
        <rect width="120" height="26" rx="4" fill={active ? '#1f2b22' : 'transparent'} stroke="rgba(26,40,32,0.18)"/>
        <text x="60" y="18" fontSize="12" fontFamily="Inter" fontWeight="600" fill={active ? '#faf6ec' : '#1f2b22'} textAnchor="middle">{label}</text>
      </g>
    ))}
    {[['Mt. Fuji', 'Japan · 35.36, 138.73'],['Giza Pyramids','Egypt · 29.98, 31.13'],['Mt. Everest BC','Nepal · 28.00, 86.85']].map(([n, sub], i) => (
      <g key={i} transform={`translate(60, ${190 + i * 22})`}>
        <text x="0" y="14" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#1f2b22">{n}</text>
        <text x="160" y="14" fontSize="11" fontFamily="JetBrains Mono" fill="#888">{sub}</text>
      </g>
    ))}
  </svg>
);

const PricingMockup = () => (
  <svg viewBox="0 0 800 320" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="320" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="280" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    {/* License model */}
    <text x="60" y="46" fontSize="12" fontFamily="Inter" fill="#1f2b22">License model</text>
    {[['Single price', false],['Tiered', true],['Exclusive', false]].map(([label, active], i) => (
      <g key={i} transform={`translate(${60 + i * 230}, 56)`}>
        <rect width="220" height="40" rx="4" fill={active ? '#fbf6e9' : 'transparent'} stroke={active ? '#c85a2e' : 'rgba(26,40,32,0.18)'}/>
        <text x="14" y="18" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#1f2b22">{label}</text>
        <text x="14" y="32" fontSize="10" fontFamily="Inter" fill="#888">{['One flat fee, all uses','Personal/Commercial/Extended','Higher fee, one buyer'][i]}</text>
      </g>
    ))}
    {/* Base price */}
    <text x="60" y="124" fontSize="12" fontFamily="Inter" fill="#1f2b22">Base price (USD)</text>
    <rect x="60" y="134" width="200" height="32" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="76" y="156" fontSize="14" fontFamily="JetBrains Mono" fill="#1f2b22">49.99</text>
    <text x="280" y="156" fontSize="13" fontFamily="Inter" fill="#888">You earn <tspan fill="#c68820" fontWeight="700">$34.99</tspan> per sale · platform keeps 30%.</text>
    {/* Tier preview */}
    <rect x="60" y="186" width="680" height="92" rx="6" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="76" y="208" fontSize="10" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.5">TIER PREVIEW</text>
    {[['Personal','$49.99','$34.99'],['Commercial','$89.98','$62.99'],['Extended','$174.97','$122.48']].map(([t, p, e], i) => (
      <g key={i} transform={`translate(76, ${224 + i * 18})`}>
        <text x="0" y="12" fontSize="13" fontFamily="Inter" fill="#1f2b22">{t}</text>
        <text x="450" y="12" fontSize="13" fontFamily="JetBrains Mono" fill="#888" textAnchor="end">{p} → you get</text>
        <text x="600" y="12" fontSize="13" fontFamily="JetBrains Mono" fontWeight="700" fill="#c68820" textAnchor="end">{e}</text>
      </g>
    ))}
  </svg>
);

const VisibilityMockup = () => (
  <svg viewBox="0 0 800 220" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="220" fill="#faf6ec"/>
    {[['Public', 'Show in explore, atlas and search results.', true],
      ['Unlisted', 'Hidden from listings, but anyone with the link can view.', false],
      ['Private (draft)', 'Only you can see this clip.', false]].map(([name, desc, active], i) => (
      <g key={i} transform={`translate(40, ${20 + i * 56})`}>
        <rect width="720" height="48" rx="4" fill={active ? '#fbf6e9' : 'transparent'} stroke={active ? '#c85a2e' : 'rgba(26,40,32,0.18)'}/>
        <circle cx="20" cy="24" r="8" fill="#fff" stroke={active ? '#c85a2e' : '#ccc'} strokeWidth="2"/>
        {active && <circle cx="20" cy="24" r="4" fill="#c85a2e"/>}
        <text x="40" y="20" fontSize="14" fontFamily="Inter" fontWeight="600" fill="#1f2b22">{name}</text>
        <text x="40" y="36" fontSize="12" fontFamily="Inter" fill="#888">{desc}</text>
      </g>
    ))}
  </svg>
);

const PayoutMockup = () => (
  <svg viewBox="0 0 800 220" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="220" fill="#faf6ec"/>
    {[['When', 'Monthly · 28th', '매월 28일 자동 송금'],
      ['Threshold', '$50+', '잔액 $50 미만은 다음 달 이월'],
      ['Methods', 'PayPal · Wise', 'PayPal 우선, Wise 다국통화'],
      ['Fees', '0% off your share', '송금 수수료는 플랫폼 30%에서 부담']].map(([label, big, sub], i) => (
      <g key={i} transform={`translate(${30 + (i % 4) * 190}, 30)`}>
        <rect width="170" height="160" rx="8" fill="#fff" stroke="rgba(26,40,32,0.16)"/>
        <text x="14" y="28" fontSize="10" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.5">{label.toUpperCase()}</text>
        <text x="14" y="58" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#c68820">{big}</text>
        <text x="14" y="100" fontSize="11" fontFamily="Inter" fill="#1f2b22">
          <tspan x="14" dy="0">{sub}</tspan>
        </text>
      </g>
    ))}
  </svg>
);

const CommissionNewMockup = () => (
  <svg viewBox="0 0 800 320" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="320" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="280" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="60" y="50" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Brief your shoot. Pilots bid.</text>
    {[['Title','Mt Fuji at sunrise — cinematic 4K'],
      ['Brief','Need cinematic flythrough at golden hour. ProRes master + LUT...'],
      ['Region · Coordinates','Asia · Japan · 35.36, 138.73'],
      ['Budget cap','$650'],
      ['Deadline','2026-06-15'],
      ['License','Commercial']].map(([label, val], i) => (
      <g key={i} transform={`translate(60, ${74 + i * 36})`}>
        <text x="0" y="0" fontSize="11" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.2">{label.toUpperCase()}</text>
        <rect x="0" y="6" width="660" height="22" rx="3" fill="#fbf6e9" stroke="rgba(26,40,32,0.16)"/>
        <text x="10" y="22" fontSize="13" fontFamily="Inter" fill="#1f2b22">{val}</text>
      </g>
    ))}
  </svg>
);

const CommissionListMockup = () => (
  <svg viewBox="0 0 800 320" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="320" fill="#faf6ec"/>
    <text x="40" y="40" fontSize="22" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Open commissions · 7</text>
    {[['Mt Fuji sunrise','Mountain · Asia · Japan','$650','15D','5 bids'],
      ['Manhattan skyline','Cityscape · NYC','$1200','30D','3 bids'],
      ['Algarve coast','Ocean · Portugal','$400','12D','2 bids'],
      ['Bali rice terraces','Vineyard · Indonesia','$300','25D','3 bids']].map(([title, meta, budget, days, bids], i) => {
      const x = 40 + (i % 2) * 360, y = 70 + Math.floor(i/2) * 110;
      return (
        <g key={i} transform={`translate(${x}, ${y})`}>
          <rect width="340" height="92" rx="8" fill="#fff" stroke="rgba(26,40,32,0.16)"/>
          <text x="14" y="22" fontSize="9" fontFamily="JetBrains Mono" fill="#c85a2e" letterSpacing="1.5">OPEN</text>
          <text x="14" y="42" fontSize="14" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">{title}</text>
          <text x="14" y="58" fontSize="11" fontFamily="Inter" fill="#888">{meta}</text>
          <text x="14" y="82" fontSize="13" fontFamily="JetBrains Mono" fontWeight="700" fill="#c68820">{budget}</text>
          <text x="80" y="82" fontSize="11" fontFamily="Inter" fill="#888">· {days} left · {bids}</text>
        </g>
      );
    })}
  </svg>
);

const CommissionBidsMockup = () => (
  <svg viewBox="0 0 800 280" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="280" fill="#faf6ec"/>
    <text x="40" y="40" fontSize="11" fontFamily="JetBrains Mono" fill="#c85a2e" letterSpacing="1.5">OPEN · MOUNTAIN · ASIA · JAPAN</text>
    <text x="40" y="68" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Mt Fuji at sunrise — cinematic 4K</text>
    <text x="40" y="98" fontSize="14" fontFamily="Inter" fontWeight="600" fill="#1f2b22">Bids (3)</text>
    {[['@skywaltz','$580','7D','Tokyo-based, 5.7K Inspire 3, weather-window planned for May 18-22.'],
      ['@aerialnomad','$620','5D','Local permit secured. 4K ProRes master + 3 alt cuts. References at link.'],
      ['@hyunwoo','$540','10D','5.7K archival. Multi-day reshoots if cloudy. Includes LUT pack.']].map(([h, p, eta, pitch], i) => (
      <g key={i} transform={`translate(40, ${110 + i * 50})`}>
        <rect width="720" height="44" rx="6" fill="#fff" stroke="rgba(26,40,32,0.16)"/>
        <circle cx="24" cy="22" r="14" fill="#7b9568"/>
        <text x="24" y="26" fontSize="11" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">{h.slice(1, 3).toUpperCase()}</text>
        <text x="50" y="20" fontSize="13" fontFamily="Inter" fontWeight="600" fill="#1f2b22">{h}</text>
        <text x="50" y="36" fontSize="11" fontFamily="Inter" fill="#888">{pitch.slice(0, 60)}…</text>
        <text x="540" y="20" fontSize="14" fontFamily="JetBrains Mono" fontWeight="700" fill="#1f2b22">{p}</text>
        <text x="540" y="36" fontSize="11" fontFamily="JetBrains Mono" fill="#888">ETA {eta}</text>
        <rect x="640" y="10" width="60" height="24" rx="3" fill="#c85a2e"/>
        <text x="670" y="26" fontSize="12" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">Accept</text>
      </g>
    ))}
  </svg>
);

const CommissionAwardedMockup = () => (
  <svg viewBox="0 0 800 220" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="220" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="60" rx="6" fill="rgba(140,180,100,0.10)" stroke="#8a9a5b"/>
    <text x="60" y="46" fontSize="14" fontFamily="Inter" fontWeight="700" fill="#1f2b22">Awarded. A pilot has been selected for this commission.</text>
    <text x="60" y="64" fontSize="11" fontFamily="JetBrains Mono" fill="#888">@aerialnomad · $620 · ETA 5D · accepted</text>
    {/* Winning bid card */}
    <rect x="40" y="100" width="720" height="100" rx="8" fill="#fff" stroke="#c68820" strokeWidth="2"/>
    <rect x="610" y="92" width="120" height="20" rx="3" fill="#c68820"/>
    <text x="670" y="106" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#1a2820" textAnchor="middle">WINNING BID</text>
    <circle cx="80" cy="148" r="22" fill="#7b9568"/>
    <text x="80" y="153" fontSize="14" fontFamily="Inter" fontWeight="700" fill="#fff" textAnchor="middle">AN</text>
    <text x="116" y="138" fontSize="15" fontFamily="Inter" fontWeight="700" fill="#1f2b22">@aerialnomad</text>
    <text x="116" y="158" fontSize="11" fontFamily="Inter" fill="#888">Tokyo-based · DJI Inspire 3 · permit secured</text>
    <text x="116" y="180" fontSize="11" fontFamily="JetBrains Mono" fill="#8a9a5b">just now · accepted</text>
    <text x="600" y="158" fontSize="22" fontFamily="JetBrains Mono" fontWeight="700" fill="#1f2b22" textAnchor="end">$620</text>
    <text x="600" y="180" fontSize="12" fontFamily="JetBrains Mono" fill="#888" textAnchor="end">ETA 5D</text>
  </svg>
);

const BidFormMockup = () => (
  <svg viewBox="0 0 800 220" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="220" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="180" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="60" y="48" fontSize="16" fontFamily="Bricolage Grotesque" fontWeight="700" fill="#1f2b22">Place a bid</text>
    <text x="60" y="74" fontSize="11" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.2">PRICE (USD)</text>
    <rect x="60" y="80" width="160" height="30" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="70" y="100" fontSize="14" fontFamily="JetBrains Mono" fill="#1f2b22">580</text>
    <text x="240" y="74" fontSize="11" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.2">ETA (DAYS)</text>
    <rect x="240" y="80" width="100" height="30" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="250" y="100" fontSize="14" fontFamily="JetBrains Mono" fill="#1f2b22">7</text>
    <text x="60" y="130" fontSize="11" fontFamily="JetBrains Mono" fill="#888" letterSpacing="1.2">SHORT PITCH</text>
    <rect x="60" y="136" width="680" height="40" rx="4" fill="#fbf6e9" stroke="rgba(26,40,32,0.18)"/>
    <text x="70" y="156" fontSize="13" fontFamily="Inter" fill="#1f2b22">Why you, what kit, location proximity, prior similar work.</text>
  </svg>
);

const BidWonMockup = () => (
  <svg viewBox="0 0 800 200" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="200" fill="#faf6ec"/>
    <rect x="40" y="20" width="720" height="60" rx="6" fill="rgba(140,180,100,0.10)" stroke="#8a9a5b"/>
    <text x="60" y="46" fontSize="14" fontFamily="Inter" fontWeight="700" fill="#1f2b22">Your bid was accepted!</text>
    <text x="60" y="64" fontSize="11" fontFamily="JetBrains Mono" fill="#888">$620 · ETA 5D · status: accepted · WINNING BID</text>
    <text x="40" y="120" fontSize="13" fontFamily="Inter" fill="#1f2b22">다음 단계: 의뢰 페이지에서 결제 영수증 + 마감일 + 납품 방법 확인. 파일 전달은 의뢰</text>
    <text x="40" y="140" fontSize="13" fontFamily="Inter" fill="#1f2b22">상세 페이지의 메시지·첨부파일 영역에서 진행됩니다.</text>
    <text x="40" y="170" fontSize="12" fontFamily="JetBrains Mono" fill="#888">매월 28일 PayPal로 70% 정산</text>
  </svg>
);
