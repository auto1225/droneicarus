// pages/guide.jsx — Korean user guide (all pages + real thumbnails)
import React, { useState } from 'react';

const T = {
  mountain: 'https://i.ytimg.com/vi/fbqHK8i-HdA/mqdefault.jpg',
  cityscape: 'https://i.ytimg.com/vi/92y9ySxIXY4/mqdefault.jpg',
  ocean: 'https://i.ytimg.com/vi/tXpXHoDKL64/mqdefault.jpg',
  desert: 'https://i.ytimg.com/vi/jEo-ykjmHgg/mqdefault.jpg',
  forest: 'https://i.ytimg.com/vi/DVR4aZ9JIBM/mqdefault.jpg',
  landscape: 'https://i.ytimg.com/vi/btpg2NP4AGU/mqdefault.jpg',
  sports: 'https://i.ytimg.com/vi/Jk7rliZpuSs/mqdefault.jpg',
  ai: 'https://i.ytimg.com/vi/YsgfLbM-VaU/mqdefault.jpg',
  warfare: 'https://i.ytimg.com/vi/YgtG5dBMQw0/mqdefault.jpg',
};

const Thumb = ({ x, y, w, h, href, label }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} fill="#3a4a55"/>
    <image x={x} y={y} width={w} height={h} href={href} preserveAspectRatio="xMidYMid slice"/>
    {label && <text x={x + 6} y={y + h - 6} fontSize="10" fill="#fff" fontFamily="Inter">{label}</text>}
  </g>
);

const Step = ({ n, title, caption, tips, children }) => (
  <div className="di-card" style={{ padding: 20, marginBottom: 20 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent, #4a6741)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{n}</div>
      <h3 style={{ margin: 0, fontSize: 18 }}>{title}</h3>
    </div>
    {caption && <p style={{ marginTop: 0, color: 'var(--ink-soft, #555)' }}>{caption}</p>}
    {children && <div style={{ margin: '12px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(26,40,32,0.12)' }}>{children}</div>}
    {tips && tips.length > 0 && (
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--ink-soft, #555)', fontSize: 14, lineHeight: 1.7 }}>
        {tips.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    )}
  </div>
);

const PageCard = ({ name, hash, desc, points }) => (
  <div className="di-card" style={{ padding: 16, marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <h4 style={{ margin: 0, fontSize: 16 }}>{name}</h4>
      <a href={`#${hash}`} style={{ fontSize: 13, color: 'var(--accent, #4a6741)' }}>해당 페이지 열기 →</a>
    </div>
    <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--ink-soft, #555)' }}>{desc}</p>
    {points && points.length > 0 && (
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--ink-soft, #555)', lineHeight: 1.7 }}>
        {points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    )}
  </div>
);

// ====== Mockups ======

const MapMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#1a3a4a"/>
    <rect x="0" y="0" width="220" height="380" fill="#faf6ec"/>
    <text x="20" y="32" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Categories</text>
    {['Mountain', 'Cityscape', 'Ocean', 'Forest', 'Desert', 'Sports', 'Warfare', 'AI Generated'].map((c, i) => (
      <g key={c}>
        <rect x="14" y={48 + i * 30} width="190" height="22" rx="4" fill={i === 1 ? 'rgba(74,103,65,0.15)' : 'transparent'}/>
        <text x="22" y={63 + i * 30} fontSize="12" fontFamily="Inter" fill="#1f2b22">{c}</text>
      </g>
    ))}
    {/* Map pins */}
    <circle cx="380" cy="140" r="10" fill="#e8b13a"/>
    <text x="380" y="144" fontSize="10" fontFamily="Inter" fill="#1f2b22" textAnchor="middle" fontWeight="700">$</text>
    <circle cx="500" cy="200" r="8" fill="#4a6741"/>
    <circle cx="600" cy="100" r="8" fill="#4a6741"/>
    <circle cx="450" cy="280" r="10" fill="#e8b13a"/>
    <text x="450" y="284" fontSize="10" fontFamily="Inter" fill="#1f2b22" textAnchor="middle" fontWeight="700">$</text>
    <circle cx="660" cy="240" r="8" fill="#4a6741"/>
    {/* License filter chips top right */}
    <rect x="560" y="20" width="220" height="32" rx="4" fill="rgba(255,255,255,0.92)"/>
    <text x="572" y="40" fontSize="11" fontFamily="Inter" fill="#1f2b22">All · Free · Paid</text>
    <text x="660" y="370" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="Inter" textAnchor="middle">Map Page</text>
  </svg>
);

const ExploreMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    <rect x="20" y="20" width="760" height="42" rx="6" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="36" y="46" fontSize="13" fontFamily="Inter" fill="#888">Search · 클립명, 위치, 카테고리...</text>
    <Thumb x={20} y={80} w={240} h={140} href={T.mountain} label="Mountain · Free"/>
    <Thumb x={280} y={80} w={240} h={140} href={T.cityscape} label="Cityscape · $129"/>
    <Thumb x={540} y={80} w={240} h={140} href={T.ocean} label="Ocean · Free"/>
    <Thumb x={20} y={240} w={240} h={130} href={T.forest} label="Forest · Free"/>
    <Thumb x={280} y={240} w={240} h={130} href={T.ai} label="AI · Free"/>
    <Thumb x={540} y={240} w={240} h={130} href={T.sports} label="Sports · $79"/>
    <text x="660" y="370" fontSize="10" fill="#888" fontFamily="Inter" textAnchor="middle">Explore Page</text>
  </svg>
);

const PlayerMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    <rect x="0" y="0" width="180" height="380" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="14" y="28" fontSize="11" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque">Categories</text>
    {['Mountain', 'Cityscape', 'Ocean', 'Forest'].map((c, i) => (
      <text key={c} x="14" y={50 + i * 22} fontSize="12" fontFamily="Inter" fill="#1f2b22">{c}</text>
    ))}
    <Thumb x={196} y={20} w={420} h={236} href={T.cityscape}/>
    <rect x="630" y="20" width="156" height="236" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="640" y="42" fontSize="11" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque">Up next</text>
    <text x="196" y="278" fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Manhattan Skyline at Sunset</text>
    <text x="196" y="296" fontSize="12" fontFamily="Inter" fill="#666">@nycaerial · 23k views</text>
    <rect x="196" y="312" width="120" height="32" rx="4" fill="#e8b13a"/>
    <text x="256" y="332" fontSize="13" fontFamily="Inter" fill="#1f2b22" textAnchor="middle" fontWeight="700">$129 구매</text>
    <text x="660" y="370" fontSize="10" fill="#888" fontFamily="Inter" textAnchor="middle">Watch Page</text>
  </svg>
);

const CheckoutMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    <rect x="40" y="40" width="320" height="300" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <Thumb x={56} y={56} w={288} h={160} href={T.cityscape}/>
    <text x="56" y="240" fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Manhattan Skyline at Sunset</text>
    <text x="56" y="258" fontSize="12" fontFamily="Inter" fill="#666">@nycaerial · 4K</text>
    <rect x="400" y="40" width="360" height="300" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="420" y="68" fontSize="16" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">License</text>
    <rect x="420" y="84" width="320" height="44" rx="4" fill="rgba(74,103,65,0.1)" stroke="rgba(74,103,65,0.4)"/>
    <text x="430" y="104" fontSize="13" fontWeight="700" fontFamily="Inter" fill="#1f2b22">Personal · $79</text>
    <text x="430" y="120" fontSize="11" fontFamily="Inter" fill="#666">개인 콘텐츠, 소셜 미디어</text>
    <rect x="420" y="136" width="320" height="44" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="430" y="156" fontSize="13" fontWeight="700" fontFamily="Inter" fill="#1f2b22">Commercial · $129</text>
    <text x="430" y="172" fontSize="11" fontFamily="Inter" fill="#666">광고, 마케팅, 상업적 활용</text>
    <rect x="420" y="188" width="320" height="44" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="430" y="208" fontSize="13" fontWeight="700" fontFamily="Inter" fill="#1f2b22">Editorial · $199</text>
    <text x="430" y="224" fontSize="11" fontFamily="Inter" fill="#666">방송, 다큐멘터리, 뉴스</text>
    <rect x="420" y="288" width="320" height="40" rx="4" fill="#e8b13a"/>
    <text x="580" y="313" fontSize="14" fontWeight="700" fontFamily="Inter" fill="#1f2b22" textAnchor="middle">결제하기 · $79</text>
    <text x="660" y="370" fontSize="10" fill="#888" fontFamily="Inter" textAnchor="middle">Checkout Page</text>
  </svg>
);

const SignupMockup = () => (
  <svg viewBox="0 0 800 240" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="240" fill="#faf6ec"/>
    <rect x="220" y="20" width="360" height="200" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="400" y="56" fontSize="20" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22" textAnchor="middle">Create your account</text>
    <text x="400" y="78" fontSize="11" fontFamily="Inter" fill="#888" textAnchor="middle">30초 만에 가입 · 무료</text>
    <rect x="240" y="100" width="320" height="32" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="252" y="120" fontSize="13" fontFamily="Inter" fill="#888">pilot@example.com</text>
    <rect x="240" y="140" width="320" height="32" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="252" y="160" fontSize="13" fontFamily="Inter" fill="#888">••••••••</text>
    <rect x="240" y="180" width="320" height="32" rx="4" fill="#e8b13a"/>
    <text x="400" y="200" fontSize="13" fontWeight="700" fontFamily="Inter" fill="#1f2b22" textAnchor="middle">Sign up</text>
  </svg>
);

const UploadMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    <rect x="40" y="40" width="720" height="300" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="60" y="80" fontSize="20" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Upload your clip</text>
    <rect x="60" y="100" width="80" height="28" rx="14" fill="#1f2b22"/>
    <text x="100" y="118" fontSize="12" fontWeight="700" fontFamily="Inter" fill="#fff" textAnchor="middle">Direct</text>
    <rect x="148" y="100" width="80" height="28" rx="14" fill="transparent" stroke="rgba(26,40,32,0.3)"/>
    <text x="188" y="118" fontSize="12" fontFamily="Inter" fill="#666" textAnchor="middle">External</text>
    <rect x="60" y="148" width="680" height="80" rx="6" fill="rgba(74,103,65,0.05)" stroke="rgba(74,103,65,0.4)" strokeDasharray="6,4"/>
    <text x="400" y="194" fontSize="14" fontFamily="Inter" fill="#666" textAnchor="middle">파일을 끌어다 놓거나 클릭해서 업로드</text>
    <rect x="60" y="248" width="320" height="36" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="72" y="270" fontSize="12" fontFamily="Inter" fill="#888">Title · Manhattan at sunset</text>
    <rect x="400" y="248" width="160" height="36" rx="4" fill="transparent" stroke="rgba(26,40,32,0.18)"/>
    <text x="412" y="270" fontSize="12" fontFamily="Inter" fill="#888">Price · $79</text>
    <rect x="580" y="248" width="160" height="36" rx="4" fill="#e8b13a"/>
    <text x="660" y="271" fontSize="13" fontWeight="700" fontFamily="Inter" fill="#1f2b22" textAnchor="middle">Publish</text>
    <text x="660" y="370" fontSize="10" fill="#888" fontFamily="Inter" textAnchor="middle">Upload Page</text>
  </svg>
);

const CommissionMockup = () => (
  <svg viewBox="0 0 800 380" style={{ width: '100%', display: 'block' }}>
    <rect width="800" height="380" fill="#faf6ec"/>
    <rect x="40" y="40" width="720" height="60" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="60" y="78" fontSize="18" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">서울 한강 야경 4K · 예산 $500</text>
    <text x="60" y="92" fontSize="12" fontFamily="Inter" fill="#666">D-3 · 입찰 7건</text>
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x="40" y={120 + i * 76} width="720" height="64" rx="6" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
        <circle cx="76" cy={152 + i * 76} r="20" fill="#4a6741"/>
        <text x="76" y={157 + i * 76} fontSize="13" fontWeight="700" fill="#fff" fontFamily="Inter" textAnchor="middle">P{i+1}</text>
        <text x="116" y={146 + i * 76} fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">@pilot{i+1}</text>
        <text x="116" y={164 + i * 76} fontSize="11" fontFamily="Inter" fill="#666">"한강 일대 5년 촬영. 야경 전문..."</text>
        <text x="660" y={156 + i * 76} fontSize="16" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22" textAnchor="end">${[420, 380, 450][i]}</text>
        <rect x="680" y={142 + i * 76} width="60" height="24" rx="4" fill={i === 1 ? '#e8b13a' : 'transparent'} stroke="rgba(26,40,32,0.3)"/>
        <text x="710" y={158 + i * 76} fontSize="11" fontWeight="700" fontFamily="Inter" fill="#1f2b22" textAnchor="middle">선택</text>
      </g>
    ))}
    <text x="660" y="370" fontSize="10" fill="#888" fontFamily="Inter" textAnchor="middle">Commission Page</text>
  </svg>
);

// ====== Buy Tab ======
const BuyTab = () => (
  <div>
    <Step n={1} title="Map 또는 Explore에서 클립 찾기"
      caption="좌측 카테고리에서 원하는 풍경(예: Cityscape, Mountain)을 선택하면 지도/그리드가 즉시 필터됩니다. 우측 상단에서 'Paid'만 보거나 'All'로 전체를 볼 수 있어요."
      tips={[
        '지도 왼쪽 사이드바: Mountain, Cityscape, Ocean, Forest, Desert, Sports, Warfare, AI Generated 8개 카테고리',
        '노란색 핀(원 안에 $)은 유료, 초록색 핀은 무료 클립',
        'License 필터: All / Free / Paid 중 선택 (기본은 All)',
        '핀이나 썸네일을 클릭하면 영상 페이지로 이동',
      ]}>
      <MapMockup />
    </Step>
    <Step n={2} title="영상 미리보기 + 가격 확인"
      caption="썸네일을 클릭하면 영상이 재생됩니다. 페이지 하단의 '구매' 버튼이나 사이드바에 가격이 표시됩니다."
      tips={[
        '왼쪽 사이드바에서는 다른 카테고리로 즉시 이동 가능',
        '오른쪽 사이드바에는 같은 카테고리의 다음 영상 추천',
        '무료 영상은 바로 시청, 유료는 구매 후 다운로드',
      ]}>
      <PlayerMockup />
    </Step>
    <Step n={3} title="라이선스 선택 (Personal / Commercial / Editorial)"
      caption="용도에 맞는 라이선스를 고르세요. 같은 영상이라도 Personal($79) ↔ Commercial($129) ↔ Editorial($199)로 가격이 다릅니다."
      tips={[
        'Personal: 개인 SNS, 블로그, 학교 과제 등 비상업 용도',
        'Commercial: 광고, 제품 홍보, 마케팅 영상',
        'Editorial: 방송, 뉴스, 다큐멘터리 (저작권 표시 필수)',
        '잘못 선택하면 환불이 어려우므로 신중히 선택',
      ]}>
      <CheckoutMockup />
    </Step>
    <Step n={4} title="결제하기"
      caption="결제 버튼을 누르면 주문이 생성되고, Success 페이지에서 영상 다운로드 링크와 라이선스 PDF가 발급됩니다."
      tips={[
        '주문 내역은 [내 계정 > 구매 내역]에서 언제든 확인',
        '다운로드 링크는 결제 후 30일간 유효',
        '라이선스 PDF는 영구 보관 (구매 증빙)',
        '문제 발생 시 [Help > 문의하기]에서 주문 ID와 함께 신고',
      ]} />
  </div>
);

// ====== Sell Tab ======
const SellTab = () => (
  <div>
    <Step n={1} title="회원가입 / 로그인"
      caption="우측 상단 'Sign in' 버튼을 누르고 이메일·비밀번호로 가입하세요. 이미 계정이 있다면 바로 로그인."
      tips={[
        '이메일 인증은 자동 (별도 메일 확인 불필요)',
        'Google 등 외부 로그인은 추후 지원 예정',
        '같은 계정으로 구매와 판매를 모두 할 수 있음',
      ]}>
      <SignupMockup />
    </Step>
    <Step n={2} title="Upload 페이지에서 영상 등록"
      caption="좌측 사이드바 또는 상단 메뉴에서 'Upload'를 선택. Direct(직접 업로드)와 External(YouTube 등 외부 링크) 두 방식이 있어요."
      tips={[
        'Direct: MP4 파일을 직접 올리면 우리 CDN에서 호스팅',
        'External: YouTube/Vimeo 링크만 붙여 넣으면 임베드 (호스팅비 무료)',
        '제목, 설명, 위치(위/경도), 카테고리, 가격, 라이선스 옵션을 모두 채워야 게시 가능',
        '썸네일은 자동 생성 (편집 가능)',
      ]}>
      <UploadMockup />
    </Step>
    <Step n={3} title="가격 + 라이선스 옵션 설정"
      caption="Personal/Commercial/Editorial 각 라이선스별로 가격을 설정합니다. 비활성화한 라이선스는 구매자에게 표시되지 않아요."
      tips={[
        '시장 시세: Personal $49~99, Commercial $99~199, Editorial $149~299',
        '같은 라이선스 안에서 무제한 사용 가능 (1회 결제 후 영구 사용)',
        '플랫폼 수수료 15% (수익의 85%가 판매자에게)',
        '판매 통계는 [내 계정 > 판매 내역]에서 확인',
      ]} />
    <Step n={4} title="공개 후 판매 모니터링"
      caption="Publish 버튼을 누르면 24시간 내에 Map과 Explore에 자동 반영됩니다. 판매가 발생하면 이메일 알림이 옵니다."
      tips={[
        '판매 후 정산은 매월 1일 자동 송금 (PayPal/Stripe)',
        '구매자가 환불을 요청하면 [내 알림]에서 처리',
        '품질이 낮은 클립은 자동 검토 후 비공개 처리될 수 있음',
        'Rankings 페이지에서 인기 판매자 1위가 되면 메인 노출',
      ]} />
  </div>
);

// ====== Commission Tab ======
const CommissionTab = () => (
  <div>
    <Step n={1} title="의뢰 만들기 (Commission Post)"
      caption="원하는 영상이 없으면 직접 의뢰하세요. Commission 페이지 우측 상단 '의뢰 등록'을 누르고 위치, 예산, 마감일, 요구사항을 작성합니다."
      tips={[
        '예산은 시장가 기준: 4K 클립 1분 $200~600, 시네마틱은 $500~1500',
        '마감일은 최소 7일 이상 권장 (촬영 + 편집 시간)',
        '구체적일수록 좋은 입찰을 받음 (시간대, 분위기, 장비 등)',
        '예시: "서울 한강 일대 일몰 시간 4K 60fps, 30~60초, DJI Mavic 3 이상"',
      ]} />
    <Step n={2} title="파일럿 입찰 받기 (Receive Bids)"
      caption="등록 후 파일럿들이 가격, 포트폴리오, 일정을 제시합니다. 보통 24~72시간 내 첫 입찰이 들어와요."
      tips={[
        '입찰 알림은 이메일 + 사이트 우측 상단 벨 아이콘',
        '각 입찰자의 프로필을 클릭해서 과거 작업, 평점 확인',
        '메시지 기능으로 직접 질문 가능 (촬영 일정, 추가 옵션 등)',
        '낮은 가격만 보지 말고 포트폴리오 품질을 우선 고려',
      ]}>
      <CommissionMockup />
    </Step>
    <Step n={3} title="입찰 수락 + 작업 진행"
      caption="원하는 입찰의 '선택' 버튼을 누르면 의뢰가 확정되고 다른 입찰은 자동 거절됩니다."
      tips={[
        '에스크로: 결제 금액은 우리 플랫폼이 보관 (작업 완료 시 송금)',
        '진행 상황은 의뢰 페이지의 채팅 영역에서 실시간 확인',
        '중간 결과물(러프컷)을 요청해서 방향 점검 권장',
        '마감일 초과 시 자동 환불 옵션 활성화',
      ]} />
    <Step n={4} title="결과물 수령 + 평가"
      caption="파일럿이 최종본을 업로드하면 검토 후 'Accept' 버튼을 누르세요. 그 즉시 결제 금액이 파일럿에게 송금됩니다."
      tips={[
        '수정 요청은 2회까지 무료, 3회부터는 추가 비용 협의',
        '평가(별점 + 리뷰)는 다른 의뢰자에게 큰 도움이 됨',
        '훌륭한 파일럿은 [팔로우]해서 다음 의뢰 시 1순위 추천',
      ]} />
  </div>
);

// ====== Page Tour Tab — all 14 pages ======
const PagesTab = () => (
  <div>
    <p style={{ marginBottom: 20, color: 'var(--ink-soft, #555)', lineHeight: 1.7 }}>
      droneicarus의 모든 페이지를 한 곳에서 둘러보세요. 각 카드의 "해당 페이지 열기" 링크를 누르면 바로 이동합니다.
    </p>

    <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: 'var(--accent, #4a6741)' }}>핵심 탐색 (Discovery)</h3>
    <PageCard name="Map (지도)" hash="map"
      desc="전 세계 드론 영상을 지도 위에 핀으로 표시. 카테고리 필터 + 라이선스(Free/Paid) 필터 + 클러스터링 지원."
      points={[
        '왼쪽 사이드바: 8개 카테고리 (Mountain/Cityscape/Ocean/Forest/Desert/Sports/Warfare/AI)',
        '핀 색상: 노랑($)=유료, 초록=무료',
        '하단 캐러셀: 위치 정보가 없는 AI Generated 클립',
        '핀 클릭 → Watch 페이지로 이동, 돌아올 때 줌/위치 보존',
      ]} />
    <PageCard name="Explore (그리드 탐색)" hash="explore"
      desc="모든 영상을 카드 그리드로 보고 검색·정렬·필터링. 페이지네이션 지원."
      points={[
        '상단 검색바: 제목·설명·위치 키워드',
        '필터 칩: All / Free / Paid + 카테고리',
        '정렬: 최신 / 인기 / 가격 낮은순 / 가격 높은순',
        '페이지당 24개, 하단 숫자 페이지네이션',
      ]} />
    <PageCard name="Watch (영상 재생)" hash="watch"
      desc="개별 영상 재생 페이지. 플레이어, 메타데이터, 구매 버튼, 추천 영상."
      points={[
        '왼쪽 사이드바: 같은 카테고리 영상 빠른 이동',
        '오른쪽 사이드바: Up next 추천',
        '하단: 제작자, 위치, 장비, 라이선스 정보',
        '구매 버튼 클릭 → Checkout으로 이동',
      ]} />

    <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: 'var(--accent, #4a6741)' }}>거래 (Transaction)</h3>
    <PageCard name="Checkout (결제)" hash="checkout"
      desc="라이선스 선택과 결제. Personal/Commercial/Editorial 3단계 가격."
      points={[
        '왼쪽: 영상 미리보기 + 메타데이터',
        '오른쪽: 라이선스 옵션 + 결제 버튼',
        'Stripe / PayPal / 카드 직접 입력 지원',
        '결제 완료 → Success 페이지에서 다운로드 링크 제공',
      ]} />
    <PageCard name="Commissions (역경매 의뢰)" hash="commissions"
      desc="원하는 영상을 의뢰하고 파일럿의 입찰을 받는 역경매. 에스크로 보장."
      points={[
        '의뢰 등록: 위치, 예산, 마감일, 요구사항 작성',
        '입찰 받기: 파일럿이 가격 + 포트폴리오 제시',
        '입찰 수락 → 에스크로 결제 → 결과물 검토 → 송금',
        '평점·리뷰로 우수 파일럿 발굴',
      ]} />
    <PageCard name="Upload (영상 등록)" hash="upload"
      desc="파일럿이 영상을 업로드/등록. Direct(파일) + External(링크) 두 방식."
      points={[
        '제목·설명·카테고리·위치·가격·라이선스 옵션 입력',
        '썸네일 자동 생성 (편집 가능)',
        'Publish 즉시 Map/Explore에 노출',
        '판매 통계 + 정산 내역 확인',
      ]} />

    <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: 'var(--accent, #4a6741)' }}>큐레이션 + 커뮤니티</h3>
    <PageCard name="Rankings (랭킹)" hash="rankings"
      desc="인기 영상, 인기 파일럿, 신규 트렌드를 한눈에. 매주 갱신."
      points={[
        '주간/월간 베스트 영상 Top 10',
        '판매 1위 파일럿 + 신인 파일럿',
        '카테고리별 트렌드 (예: AI Generated 급상승)',
        '평점 분포 + 리뷰 하이라이트',
      ]} />
    <PageCard name="Creators (크리에이터)" hash="creators"
      desc="활동 중인 모든 파일럿/스튜디오 디렉터리. 프로필 + 작품집 + 평점."
      points={[
        '프로필 카드: 이름, 위치, 전문 분야, 평점, 작품 수',
        '클릭 시 개인 페이지로 이동 (모든 작품 + 평가)',
        '팔로우 기능으로 신작 알림',
      ]} />
    <PageCard name="Atlas (편집장의 지도)" hash="atlas"
      desc="에디터가 큐레이션한 명소·랜드마크 컬렉션. 여행 블로그처럼 구성."
      points={[
        '랜드마크 카드: 사진 + 설명 + 추천 영상 링크',
        '대륙·국가별 그룹핑',
        '시즈널 추천 (봄 벚꽃, 가을 단풍 등)',
      ]} />
    <PageCard name="Lab (연구실)" hash="lab"
      desc="기술·튜토리얼·실험 콘텐츠. 새로운 촬영 기법, 장비 리뷰, 편집 팁."
      points={[
        '글 + 영상 + 코드 샘플 혼합 콘텐츠',
        'AI Generation 워크플로 가이드',
        '장비별 비교 리뷰 + 점수표',
      ]} />

    <h3 style={{ marginTop: 24, marginBottom: 12, fontSize: 16, color: 'var(--accent, #4a6741)' }}>커머스 + 부가 서비스</h3>
    <PageCard name="Gear (드론 카탈로그)" hash="gear"
      desc="전 세계 드론 제품 카탈로그 (300개 이상). 가격대별/용도별 필터링."
      points={[
        '제품 카드: 사진 + 사양 + 가격대 + 추천 용도',
        '가격대 필터: $500 미만 / $500~2000 / $2000+',
        '용도별: 입문용 / 시네마틱 / FPV / 산업용',
        '비교 모드: 최대 4개 동시 비교',
      ]} />
    <PageCard name="Shots (B2B 라이선싱)" hash="shots"
      desc="대량 영상 패키지를 광고 대행사·방송사에 라이선싱. 맞춤 견적 요청."
      points={[
        '대규모 패키지 거래 (예: "전국 도시 야경 100편")',
        '월간 구독 옵션 (스톡 풋티지 형태)',
        '맞춤 큐레이션 + 전속 매니저 배정',
        '견적 요청 폼에서 예산·용도·기간 입력',
      ]} />
    <PageCard name="Live (실시간 방송)" hash="live"
      desc="라이브 드론 방송 + 진행 중인 의뢰 라이브. 실시간 시청 + 응원 메시지."
      points={[
        '진행 중인 라이브 방송 그리드',
        '예약된 방송 일정 (D-day 카운트)',
        '시청 + 채팅 + 슈퍼챗',
      ]} />
    <PageCard name="Pricing (요금제)" hash="pricing"
      desc="플랫폼 수수료, 라이선스 가격대, 의뢰 비용 가이드."
      points={[
        '구매자: 라이선스별 가격 범위',
        '판매자: 수수료 15% + 정산 주기',
        '의뢰자: 예산 가이드라인',
        '엔터프라이즈: 맞춤 견적 안내',
      ]} />
  </div>
);

// ====== Main page ======
export function GuidePage() {
  const [tab, setTab] = useState('buy');

  const tabs = [
    { id: 'buy', label: '클립 구매하기', body: <BuyTab /> },
    { id: 'sell', label: '클립 판매하기', body: <SellTab /> },
    { id: 'commission', label: '커스텀 의뢰', body: <CommissionTab /> },
    { id: 'tour', label: '모든 페이지', body: <PagesTab /> },
  ];

  return (
    <div className="di-content" style={{ maxWidth: 960, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>사용 설명서</h1>
      <p style={{ fontSize: 16, color: 'var(--ink-soft, #555)', marginBottom: 32, lineHeight: 1.7 }}>
        droneicarus는 전 세계 드론 영상의 거래·의뢰·발견을 한 곳에서 처리하는 플랫폼입니다.
        구매자는 무료/유료 영상을 찾고, 판매자는 작품을 등록하고, 의뢰자는 원하는 영상을 직접 의뢰할 수 있어요.
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid rgba(26,40,32,0.1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '12px 20px',
              background: tab === t.id ? 'var(--accent, #4a6741)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--ink, #1f2b22)',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tabs.find(t => t.id === tab)?.body}
    </div>
  );
}
