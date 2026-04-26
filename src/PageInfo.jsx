// src/PageInfo.jsx — manual-grade page guide modal with rich SVG mockups + glossaries
import React, { useState, useEffect } from 'react';

const T = {
  cityscape: 'https://i.ytimg.com/vi/92y9ySxIXY4/mqdefault.jpg',
  ocean: 'https://i.ytimg.com/vi/tXpXHoDKL64/mqdefault.jpg',
  mountain: 'https://i.ytimg.com/vi/fbqHK8i-HdA/mqdefault.jpg',
  ai: 'https://i.ytimg.com/vi/YsgfLbM-VaU/mqdefault.jpg',
  aurora: 'https://i.ytimg.com/vi/HrcRpvV55ig/mqdefault.jpg',
};

// ---- Reusable building blocks ----
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

const Caption = ({ text }) => (
  <div style={{ fontSize: 11, color: 'var(--parchment-dim, #4a5548)', textAlign: 'center', marginTop: 6, fontStyle: 'italic' }}>{text}</div>
);

// ---- SVG mockups (annotated diagrams) ----
const MapMockup = () => (
  <svg viewBox="0 0 480 220" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="220" fill="#1a3a4a"/>
    <rect x="0" y="0" width="120" height="220" fill="#faf6ec"/>
    <text x="60" y="20" fontSize="9" fontFamily="Inter" fontWeight="700" fill="#1f2b22" textAnchor="middle">Categories</text>
    {['Nature 211', 'Cities 296', 'Heritage 63', 'Sports 70', 'AI 32'].map((c, i) => (
      <text key={c} x="14" y={42 + i * 18} fontSize="9" fontFamily="Inter" fill="#1f2b22">{c}</text>
    ))}
    <circle cx="240" cy="90" r="9" fill="#e8b13a" stroke="#1a2820" strokeWidth="1.5"/>
    <text x="240" y="93" fontSize="9" textAnchor="middle" fontWeight="700" fill="#1a2820">$</text>
    <circle cx="320" cy="140" r="7" fill="#4a6741"/>
    <circle cx="380" cy="80" r="7" fill="#4a6741"/>
    <circle cx="280" cy="170" r="9" fill="#e8b13a" stroke="#1a2820" strokeWidth="1.5"/>
    <text x="280" y="173" fontSize="9" textAnchor="middle" fontWeight="700" fill="#1a2820">$</text>
    <circle cx="200" cy="130" r="14" fill="#c85a2e"/>
    <text x="200" y="134" fontSize="11" textAnchor="middle" fontWeight="700" fill="#fff">8</text>
    <line x1="240" y1="90" x2="380" y2="55" stroke="#fff" strokeWidth="1" strokeDasharray="2,2"/>
    <rect x="370" y="40" width="100" height="20" rx="3" fill="#faf6ec"/>
    <text x="420" y="53" fontSize="9" textAnchor="middle" fill="#1f2b22" fontFamily="Inter">노랑 = 유료</text>
    <line x1="320" y1="140" x2="430" y2="180" stroke="#fff" strokeWidth="1" strokeDasharray="2,2"/>
    <rect x="375" y="170" width="95" height="20" rx="3" fill="#faf6ec"/>
    <text x="422" y="183" fontSize="9" textAnchor="middle" fill="#1f2b22" fontFamily="Inter">초록 = 무료</text>
    <line x1="200" y1="130" x2="125" y2="130" stroke="#fff" strokeWidth="1" strokeDasharray="2,2"/>
    <rect x="6" y="120" width="115" height="20" rx="3" fill="#c85a2e"/>
    <text x="63" y="133" fontSize="9" textAnchor="middle" fill="#fff" fontFamily="Inter" fontWeight="700">클러스터: 8개 영상</text>
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

const WatchPageMockup = () => (
  <svg viewBox="0 0 480 220" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="220" fill="#faf6ec"/>
    <rect x="0" y="0" width="60" height="220" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="6" y="14" fontSize="7" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque">Categories</text>
    {['Nature', 'Cities', 'Sports', 'AI'].map((c, i) => (
      <text key={c} x="6" y={28 + i * 14} fontSize="8" fontFamily="Inter" fill="#1f2b22">{c}</text>
    ))}
    <rect x="68" y="20" width="280" height="120" fill="#0d1410"/>
    <image x="68" y="20" width="280" height="120" href={T.cityscape} preserveAspectRatio="xMidYMid slice"/>
    <polygon points="200,60 200,100 230,80" fill="#fff" opacity="0.85"/>
    <rect x="356" y="20" width="120" height="120" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="362" y="32" fontSize="7" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque">Up next</text>
    {[0,1,2].map(i => (
      <g key={i}>
        <rect x="362" y={42 + i * 30} width="40" height="22" fill="#0d1410"/>
        <image x="362" y={42 + i * 30} width="40" height="22" href={T.mountain} preserveAspectRatio="xMidYMid slice"/>
        <text x="408" y={54 + i * 30} fontSize="7" fill="#1f2b22" fontFamily="Inter">Recommended {i+1}</text>
      </g>
    ))}
    <text x="68" y="160" fontSize="11" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Manhattan Skyline at Sunset</text>
    <text x="68" y="174" fontSize="9" fontFamily="Inter" fill="#666">@nycaerial · Cityscape · 4K</text>
    <rect x="68" y="184" width="60" height="22" fill="#c68820" rx="3"/>
    <text x="98" y="198" fontSize="10" fill="#1a2820" fontWeight="700" fontFamily="Inter" textAnchor="middle">LICENSED · $99</text>
    <rect x="132" y="184" width="40" height="22" fill="#c85a2e" rx="3"/>
    <text x="152" y="198" fontSize="9" fill="#fff" fontWeight="700" fontFamily="Inter" textAnchor="middle">DEMO</text>
    <rect x="180" y="184" width="100" height="22" fill="#1a2820" rx="3"/>
    <text x="230" y="198" fontSize="10" fill="#fff" fontWeight="700" fontFamily="Inter" textAnchor="middle">Unlock for $99</text>
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

const UploadModesMockup = () => (
  <svg viewBox="0 0 480 180" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="180" fill="#faf6ec"/>
    <rect x="20" y="20" width="200" height="140" rx="8" fill="#fff" stroke="#4a6741" strokeWidth="2"/>
    <text x="120" y="40" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#4a6741" textAnchor="middle">Direct</text>
    <rect x="32" y="50" width="176" height="46" rx="4" fill="rgba(74,103,65,0.05)" stroke="rgba(74,103,65,0.4)" strokeDasharray="4,3"/>
    <text x="120" y="76" fontSize="10" fontFamily="Inter" fill="#4a6741" textAnchor="middle">↑ MP4 파일 드래그 앤 드롭</text>
    <text x="120" y="115" fontSize="9" fontFamily="Inter" fill="#666" textAnchor="middle">CDN 호스팅 · 다운로드 가능</text>
    <text x="120" y="130" fontSize="9" fontFamily="Inter" fill="#666" textAnchor="middle">라이선스 판매 가능</text>
    <text x="120" y="148" fontSize="9" fontFamily="Inter" fill="#1a2820" fontWeight="700" textAnchor="middle">수익의 70% 파일럿</text>
    <rect x="260" y="20" width="200" height="140" rx="8" fill="#fff" stroke="#c68820" strokeWidth="2"/>
    <text x="360" y="40" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#c68820" textAnchor="middle">External</text>
    <rect x="272" y="50" width="176" height="34" rx="4" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="282" y="70" fontSize="9" fontFamily="Inter" fill="#888">https://youtube.com/watch?v=...</text>
    <text x="360" y="103" fontSize="9" fontFamily="Inter" fill="#666" textAnchor="middle">YouTube/Vimeo 임베드</text>
    <text x="360" y="118" fontSize="9" fontFamily="Inter" fill="#666" textAnchor="middle">호스팅비 무료</text>
    <text x="360" y="148" fontSize="9" fontFamily="Inter" fill="#1a2820" fontWeight="700" textAnchor="middle">노출/홍보 목적 (판매 X)</text>
  </svg>
);

const AtlasBountyMockup = () => (
  <svg viewBox="0 0 480 220" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="220" fill="#faf6ec"/>
    <rect x="20" y="20" width="440" height="80" rx="6" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="34" y="38" fontSize="8" fontWeight="700" fill="#888" fontFamily="Inter" letterSpacing="1.5">YEMEN · DIFFICULTY</text>
    <circle cx="146" cy="36" r="4" fill="#c85a2e"/>
    <text x="155" y="38" fontSize="8" fill="#c85a2e" fontFamily="Inter" fontWeight="700">EXTREME</text>
    <text x="34" y="60" fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">Socotra — Dragon Blood Trees</text>
    <text x="34" y="76" fontSize="10" fill="#666" fontFamily="Inter">First-light overhead of the canopy. Permit handled.</text>
    <rect x="34" y="84" width="42" height="14" rx="7" fill="rgba(74,103,65,0.08)" stroke="rgba(74,103,65,0.3)"/>
    <text x="55" y="94" fontSize="8" fill="#4a6741" textAnchor="middle" fontFamily="Inter">remote</text>
    <rect x="80" y="84" width="44" height="14" rx="7" fill="rgba(74,103,65,0.08)" stroke="rgba(74,103,65,0.3)"/>
    <text x="102" y="94" fontSize="8" fill="#4a6741" textAnchor="middle" fontFamily="Inter">endemic</text>
    <rect x="338" y="34" width="60" height="20" rx="3" fill="rgba(200,90,46,0.08)"/>
    <text x="368" y="48" fontSize="14" fontWeight="700" fill="#c85a2e" fontFamily="Bricolage Grotesque" textAnchor="middle">$3,400</text>
    <text x="408" y="46" fontSize="8" fontFamily="Inter" fill="#666">PURSE</text>
    <text x="408" y="58" fontSize="8" fontFamily="Inter" fill="#666">Deadline</text>
    <text x="408" y="68" fontSize="8" fontFamily="Inter" fill="#666">Mar 2027</text>
    <rect x="338" y="74" width="74" height="22" rx="4" fill="#1a2820"/>
    <text x="375" y="89" fontSize="9" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">Claim this</text>
    <line x1="20" y1="60" x2="6" y2="60" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="2" y="62" fontSize="8" fill="#1a2820" fontFamily="Inter" fontWeight="600" textAnchor="end">제목 + 설명</text>
    <line x1="338" y1="48" x2="438" y2="116" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="438" y="128" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600" textAnchor="end">현상금</text>
    <text x="438" y="140" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="end">사용자 후원 누적</text>
    <line x1="338" y1="85" x2="338" y2="148" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="338" y="160" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600" textAnchor="middle">Claim 버튼</text>
    <text x="338" y="172" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">파일럿이 도전</text>
    <line x1="146" y1="34" x2="146" y2="110" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="146" y="128" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600" textAnchor="middle">난이도</text>
    <text x="146" y="140" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">Easy/Mod/Hard/Extreme</text>
    <line x1="80" y1="98" x2="80" y2="180" stroke="#1a2820" strokeWidth="1" strokeDasharray="2,2"/>
    <text x="100" y="192" fontSize="9" fill="#1a2820" fontFamily="Inter" fontWeight="600" textAnchor="middle">태그</text>
    <text x="100" y="204" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">remote · architecture 등</text>
  </svg>
);

const RankingsPodiumMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="240" y="22" fontSize="11" fontFamily="Inter" fill="#1f2b22" fontWeight="700" textAnchor="middle">Top Clips · This Week</text>
    <rect x="180" y="60" width="120" height="120" fill="#c68820" rx="6"/>
    <image x="180" y="60" width="120" height="80" href={T.cityscape} preserveAspectRatio="xMidYMid slice"/>
    <text x="240" y="156" fontSize="22" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#fff" textAnchor="middle">#1</text>
    <text x="240" y="172" fontSize="9" fill="#fff" fontFamily="Inter" textAnchor="middle">23k views · ★ 4.9</text>
    <rect x="60" y="100" width="100" height="80" fill="rgba(168,160,144,0.6)" rx="6"/>
    <image x="60" y="100" width="100" height="50" href={T.mountain} preserveAspectRatio="xMidYMid slice"/>
    <text x="110" y="166" fontSize="18" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#fff" textAnchor="middle">#2</text>
    <text x="110" y="178" fontSize="8" fill="#fff" fontFamily="Inter" textAnchor="middle">17k · ★ 4.8</text>
    <rect x="320" y="120" width="100" height="60" fill="rgba(105,72,36,0.6)" rx="6"/>
    <image x="320" y="120" width="100" height="36" href={T.ocean} preserveAspectRatio="xMidYMid slice"/>
    <text x="370" y="170" fontSize="16" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#fff" textAnchor="middle">#3</text>
    <text x="370" y="180" fontSize="8" fill="#fff" fontFamily="Inter" textAnchor="middle">14k · ★ 4.7</text>
  </svg>
);

const CreatorProfileMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <rect x="20" y="20" width="280" height="160" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <circle cx="60" cy="60" r="24" fill="#4a6741"/>
    <text x="60" y="66" fontSize="14" fill="#fff" fontWeight="700" fontFamily="Bricolage Grotesque" textAnchor="middle">NY</text>
    <circle cx="80" cy="80" r="6" fill="#c68820" stroke="#fff" strokeWidth="2"/>
    <text x="80" y="84" fontSize="7" fill="#1a2820" fontWeight="700" textAnchor="middle">✓</text>
    <text x="100" y="50" fontSize="13" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">@nycaerial</text>
    <text x="100" y="64" fontSize="10" fill="#666" fontFamily="Inter">New York · Cityscape · Sports</text>
    <text x="100" y="80" fontSize="9" fill="#888" fontFamily="Inter">★ 4.9 · 142 clips · 5y active</text>
    <rect x="34" y="104" width="252" height="60" rx="4" fill="rgba(74,103,65,0.05)"/>
    <text x="44" y="120" fontSize="8" fill="#888" fontFamily="Inter" letterSpacing="1.5">PORTFOLIO PREVIEW</text>
    {[0,1,2].map(i => (
      <rect key={i} x={50 + i * 76} y={128} width={68} height={28} rx="3" fill="#0d1410"/>
    ))}
    <image x="50" y="128" width="68" height="28" href={T.cityscape} preserveAspectRatio="xMidYMid slice"/>
    <image x="126" y="128" width="68" height="28" href={T.mountain} preserveAspectRatio="xMidYMid slice"/>
    <image x="202" y="128" width="68" height="28" href={T.ocean} preserveAspectRatio="xMidYMid slice"/>
    <rect x="320" y="20" width="140" height="160" rx="8" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="332" y="40" fontSize="9" fill="#888" fontFamily="Inter" letterSpacing="1.5">STATS</text>
    {[
      ['총 판매', '342'],
      ['평점', '4.9 / 5'],
      ['응답시간', '~ 6h'],
      ['수락률', '96%'],
    ].map(([k, v], i) => (
      <g key={k}>
        <text x="332" y={62 + i * 20} fontSize="9" fill="#666" fontFamily="Inter">{k}</text>
        <text x="448" y={62 + i * 20} fontSize="10" fontWeight="700" fill="#1f2b22" fontFamily="Bricolage Grotesque" textAnchor="end">{v}</text>
      </g>
    ))}
    <rect x="332" y="148" width="116" height="22" rx="4" fill="#4a6741"/>
    <text x="390" y="163" fontSize="9" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">Follow</text>
  </svg>
);

const LabPostMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    {[
      ['Research', 'AI Vision Stabilization', '#4a6741'],
      ['Tutorial', 'ND Filter Workflow', '#c68820'],
      ['Patent', 'Swarm Algo Filing', '#3a5a8a'],
      ['News', 'DJI Mavic 4 Launch', '#c85a2e'],
    ].map(([cat, title, color], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 20 + col * 220;
      const y = 20 + row * 90;
      return (
        <g key={i}>
          <rect x={x} y={y} width={210} height={80} rx="6" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
          <rect x={x + 10} y={y + 10} width={50} height={14} rx="7" fill={color}/>
          <text x={x + 35} y={y + 20} fontSize="8" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">{cat}</text>
          <text x={x + 10} y={y + 40} fontSize="11" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">{title}</text>
          <text x={x + 10} y={y + 56} fontSize="8" fill="#666" fontFamily="Inter">3 days ago · 12 min read</text>
          <text x={x + 10} y={y + 70} fontSize="8" fill="#888" fontFamily="Inter">★ 4.7 · 234 reads · 18 comments</text>
        </g>
      );
    })}
  </svg>
);

const GearCompareMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="20" y="20" fontSize="9" fill="#888" fontFamily="Inter" letterSpacing="1.5">COMPARE 4 PRODUCTS</text>
    {[
      ['DJI Mavic 4', '$2,099', '4K/120', '720g', 4.9],
      ['DJI Air 3S', '$1,099', '4K/60', '720g', 4.7],
      ['Autel Evo Lite', '$1,499', '6K/30', '835g', 4.5],
      ['Skydio X10', '$3,500', '4K/60', '1310g', 4.6],
    ].map(([name, price, video, weight, rating], i) => {
      const x = 20 + i * 110;
      return (
        <g key={i}>
          <rect x={x} y={32} width={100} height={150} rx="6" fill="#fff" stroke={i === 0 ? '#4a6741' : 'rgba(26,40,32,0.18)'} strokeWidth={i === 0 ? '2' : '1'}/>
          {i === 0 && <rect x={x} y={32} width={100} height={14} fill="#4a6741"/>}
          {i === 0 && <text x={x + 50} y={42} fontSize="8" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">RECOMMENDED</text>}
          <rect x={x + 10} y={i === 0 ? 54 : 42} width={80} height={36} rx="3" fill="#0d1410" opacity="0.85"/>
          <text x={x + 50} y={i === 0 ? 76 : 64} fontSize="11" fill="#888" textAnchor="middle" fontFamily="Inter">[product]</text>
          <text x={x + 10} y={i === 0 ? 100 : 88} fontSize="10" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">{name}</text>
          <text x={x + 10} y={i === 0 ? 116 : 104} fontSize="13" fontWeight="700" fill="#c85a2e" fontFamily="Bricolage Grotesque">{price}</text>
          <text x={x + 10} y={i === 0 ? 134 : 122} fontSize="8" fill="#666" fontFamily="Inter">📹 {video}</text>
          <text x={x + 10} y={i === 0 ? 148 : 136} fontSize="8" fill="#666" fontFamily="Inter">⚖ {weight}</text>
          <text x={x + 10} y={i === 0 ? 162 : 150} fontSize="8" fill="#666" fontFamily="Inter">★ {rating}</text>
          <rect x={x + 10} y={i === 0 ? 170 : 158} width={80} height={18} rx="3" fill="#1a2820"/>
          <text x={x + 50} y={i === 0 ? 182 : 170} fontSize="8" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">View detail</text>
        </g>
      );
    })}
  </svg>
);

const LiveStreamMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="20" y="20" fontSize="9" fill="#888" fontFamily="Inter" letterSpacing="1.5">LIVE NOW · 3 STREAMS</text>
    {[0, 1, 2].map(i => {
      const x = 20 + i * 150;
      const thumb = [T.mountain, T.cityscape, T.ocean][i];
      return (
        <g key={i}>
          <rect x={x} y={32} width={140} height={80} rx="4" fill="#0d1410"/>
          <image x={x} y={32} width={140} height={80} href={thumb} preserveAspectRatio="xMidYMid slice"/>
          <rect x={x + 8} y={40} width={32} height={14} rx="2" fill="#c85a2e"/>
          <text x={x + 24} y={50} fontSize="8" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">LIVE</text>
          <rect x={x + 100} y={40} width={32} height={14} rx="2" fill="rgba(13,20,16,0.85)"/>
          <text x={x + 116} y={50} fontSize="8" fill="#fff" textAnchor="middle" fontFamily="Inter">{['1.2k', '420', '88'][i]}</text>
          <text x={x + 8} y={130} fontSize="10" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#1f2b22">{['Alps Sunrise', 'Tokyo Tower', 'Bora Bora'][i]}</text>
          <text x={x + 8} y={144} fontSize="8" fill="#666" fontFamily="Inter">@pilot{i + 1} · {['2h', '45m', '12m'][i]} streaming</text>
        </g>
      );
    })}
    <rect x="20" y="160" width="440" height="32" rx="4" fill="#fff" stroke="rgba(26,40,32,0.12)"/>
    <text x="34" y="180" fontSize="10" fontFamily="Inter" fill="#1f2b22">💬 채팅 + 슈퍼챗 후원 (70% 파일럿에게 송금)</text>
  </svg>
);

const ShotsB2BMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="240" y="22" fontSize="11" fontFamily="Inter" fill="#1f2b22" fontWeight="700" textAnchor="middle">B2B 패키지 vs 단건 라이선스</text>
    <rect x="20" y="40" width="200" height="140" rx="8" fill="#fff" stroke="rgba(26,40,32,0.18)"/>
    <text x="120" y="60" fontSize="11" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#666" textAnchor="middle">단건 라이선스</text>
    <text x="120" y="78" fontSize="9" fill="#888" fontFamily="Inter" textAnchor="middle">개별 클립 1개 결제</text>
    <text x="120" y="100" fontSize="22" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#666" textAnchor="middle">$129</text>
    <text x="120" y="116" fontSize="9" fill="#888" fontFamily="Inter" textAnchor="middle">/ 클립</text>
    <text x="120" y="142" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">즉시 다운로드</text>
    <text x="120" y="156" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">셀프 서비스</text>
    <text x="120" y="170" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">Personal/Commercial/Editorial</text>
    <rect x="260" y="40" width="200" height="140" rx="8" fill="#fff" stroke="#c85a2e" strokeWidth="2"/>
    <rect x="260" y="40" width="200" height="20" fill="#c85a2e"/>
    <text x="360" y="54" fontSize="9" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">SHOTS · B2B 패키지</text>
    <text x="360" y="80" fontSize="11" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#c85a2e" textAnchor="middle">대량 라이선스</text>
    <text x="360" y="96" fontSize="9" fill="#666" fontFamily="Inter" textAnchor="middle">100+ 클립 패키지</text>
    <text x="360" y="118" fontSize="22" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#c85a2e" textAnchor="middle">$8,000+</text>
    <text x="360" y="134" fontSize="9" fill="#888" fontFamily="Inter" textAnchor="middle">맞춤 견적</text>
    <text x="360" y="152" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">전속 매니저 배정</text>
    <text x="360" y="164" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">월간 구독 옵션</text>
    <text x="360" y="176" fontSize="8" fill="#666" fontFamily="Inter" textAnchor="middle">계약서 + 청구서</text>
  </svg>
);

const PricingSplitMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="240" y="20" fontSize="11" fontFamily="Inter" fill="#1f2b22" fontWeight="700" textAnchor="middle">수익 분배: 70% 파일럿 / 15% 플랫폼 / 15% 결제·세금</text>
    <circle cx="120" cy="110" r="60" fill="none" stroke="#1f2b22" strokeWidth="0.5"/>
    <path d="M 120 50 A 60 60 0 1 1 90.21 161.96 L 120 110 Z" fill="#4a6741"/>
    <path d="M 90.21 161.96 A 60 60 0 0 1 64.76 132.69 L 120 110 Z" fill="#c68820"/>
    <path d="M 64.76 132.69 A 60 60 0 0 1 120 50 L 120 110 Z" fill="#c85a2e"/>
    <text x="120" y="106" fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#fff" textAnchor="middle">파일럿</text>
    <text x="120" y="122" fontSize="14" fontWeight="700" fontFamily="Bricolage Grotesque" fill="#fff" textAnchor="middle">70%</text>
    <rect x="220" y="42" width="240" height="22" rx="4" fill="rgba(74,103,65,0.1)"/>
    <rect x="220" y="42" width="14" height="22" rx="4" fill="#4a6741"/>
    <text x="240" y="56" fontSize="10" fontWeight="600" fontFamily="Inter" fill="#1f2b22">파일럿 수익 70%</text>
    <text x="450" y="56" fontSize="10" fontFamily="Inter" fill="#666" textAnchor="end">$99 → $69.30</text>
    <rect x="220" y="74" width="240" height="22" rx="4" fill="rgba(198,136,32,0.1)"/>
    <rect x="220" y="74" width="14" height="22" rx="4" fill="#c68820"/>
    <text x="240" y="88" fontSize="10" fontWeight="600" fontFamily="Inter" fill="#1f2b22">플랫폼 수수료 15%</text>
    <text x="450" y="88" fontSize="10" fontFamily="Inter" fill="#666" textAnchor="end">$99 → $14.85</text>
    <rect x="220" y="106" width="240" height="22" rx="4" fill="rgba(200,90,46,0.1)"/>
    <rect x="220" y="106" width="14" height="22" rx="4" fill="#c85a2e"/>
    <text x="240" y="120" fontSize="10" fontWeight="600" fontFamily="Inter" fill="#1f2b22">결제·세금 15%</text>
    <text x="450" y="120" fontSize="10" fontFamily="Inter" fill="#666" textAnchor="end">$99 → $14.85</text>
    <text x="220" y="155" fontSize="9" fill="#888" fontFamily="Inter">매월 1일 자동 송금 (PayPal/Stripe)</text>
    <text x="220" y="170" fontSize="9" fill="#888" fontFamily="Inter">매출 $100 미만은 다음 달 이월</text>
    <text x="220" y="185" fontSize="9" fill="#888" fontFamily="Inter">엔터프라이즈는 맞춤 분배율 협의</text>
  </svg>
);

const GuideTabsMockup = () => (
  <svg viewBox="0 0 480 200" style={{ width: '100%', display: 'block', borderRadius: 6, border: '1px solid var(--line-strong)' }}>
    <rect width="480" height="200" fill="#faf6ec"/>
    <text x="240" y="22" fontSize="11" fontFamily="Inter" fill="#1f2b22" fontWeight="700" textAnchor="middle">Guide 페이지 4개 탭</text>
    {[
      ['클립 구매', '#4a6741', '구매자 4단계'],
      ['클립 판매', '#c68820', '판매자 4단계'],
      ['커스텀 의뢰', '#c85a2e', '의뢰자 4단계'],
      ['모든 페이지', '#1f2b22', '14개 페이지 안내'],
    ].map(([name, color, desc], i) => {
      const x = 20 + i * 110;
      return (
        <g key={name}>
          <rect x={x} y={40} width={100} height={140} rx="6" fill="#fff" stroke={color} strokeWidth={i === 0 ? "2" : "1"}/>
          <rect x={x} y={40} width={100} height={26} fill={color} rx="6"/>
          <text x={x + 50} y={57} fontSize="11" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="Bricolage Grotesque">{name}</text>
          <text x={x + 50} y={88} fontSize="9" fill="#666" fontFamily="Inter" textAnchor="middle">{desc}</text>
          {[1,2,3,4].map(n => (
            <g key={n}>
              <circle cx={x + 18} cy={108 + (n-1) * 16} r="6" fill={color}/>
              <text x={x + 18} y={111 + (n-1) * 16} fontSize="8" fill="#fff" fontWeight="700" textAnchor="middle" fontFamily="Inter">{n}</text>
              <text x={x + 30} y={111 + (n-1) * 16} fontSize="8" fill="#1f2b22" fontFamily="Inter">{['Step '+n, '', '', ''][0]}</text>
            </g>
          ))}
        </g>
      );
    })}
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
      { kind: 'caption', text: '왼쪽 사이드바 카테고리 + 핀 색상(노랑=유료, 초록=무료) + 빨간 클러스터(여러 영상 묶음)' },
      { kind: 'glossary', title: '핀 색상 의미', items: [
        { term: '$ 노랑', color: '#e8b13a', desc: '유료 라이선스 클립. 핀 안에 가격 표시. 현재는 모두 데모 데이터(실제 결제 없음).' },
        { term: '초록', color: '#4a6741', desc: '무료 시청 + CC-BY 라이선스 클립. 출처(파일럿 이름)만 밝히면 자유 사용.' },
        { term: '빨강 N', color: '#c85a2e', desc: '클러스터(N개 영상 모음). 줌 인하거나 클릭하면 펼쳐짐.' },
      ]},
      { kind: 'glossary', title: 'Map Filters (사이드바 하단 9개 체크박스)', items: [
        { term: 'Free only', desc: '무료 영상만 표시. 가격 0인 모든 클립.' },
        { term: 'Paid clips', desc: '유료 영상만 표시. 라이선스 구매 필요.' },
        { term: 'Pilot uploads', desc: '검증된 파일럿이 직접 업로드한 오리지널 (YouTube 임베드 제외).' },
        { term: 'Commercial', desc: '상업용 라이선스를 지원하는 클립.' },
        { term: 'Extended', desc: '방송·재배포까지 허용하는 확장 라이선스 가능 클립.' },
        { term: 'Exclusive', desc: '1명만 구매할 수 있는 독점 라이선스 옵션.' },
        { term: '4K+', desc: '4K 이상 고해상도만.' },
        { term: 'Last 30 days', desc: '최근 30일 내 업로드된 신작.' },
        { term: "Editor's picks", desc: '편집장이 선정한 추천작 (Atlas 페이지와 연동).' },
      ]},
      { kind: 'tips', items: [
        '왼쪽 카테고리 트리: Nature(211)·Cities(296)·Heritage(63)·AI Generated(32) 등 12개. 클릭 시 핀이 즉시 좁혀짐.',
        '필터를 적용하면 사이드바 숫자도 같이 갱신 → "이 필터 조합에 영상이 있는 카테고리"만 노출.',
        '핀 클릭 → 영상 시청 → 뒤로가기 시 줌·중심·필터가 자동으로 복구됩니다.',
        '하단 캐러셀: 좌표 정보 없는 AI Generated 클립 (지도에 표시 불가).',
        '검색창: 위치/제목/키워드 실시간 필터 (예: "Tokyo", "sunset", "drone show").',
      ]},
      { kind: 'faq', items: [
        { q: '핀이 너무 많아서 클러스터로 묶이는데, 분리해서 보려면?', a: '지도를 더 확대(스크롤 zoom in)하면 자동으로 클러스터가 풀립니다. 또는 카테고리/필터로 좁히세요.' },
        { q: '한국어 영상만 보고 싶어요', a: '아직 언어별 필터는 없어요. 검색창에 "Korea" 입력하면 한국 위치 영상이 모입니다.' },
        { q: '핀이 같은 위치에 여러 개 겹쳤어요', a: '같은 좌표에 영상이 많을 때 자동 클러스터로 묶입니다. 클릭하면 펼쳐서 개별 영상 선택 가능.' },
        { q: '영상을 제 사이트에서 바로 보고 싶어요', a: '구매 후 다운로드 받은 파일을 사용하세요. 임베드 자체는 YouTube 출처 영상에만 가능 (그 경우 외부 링크).' },
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
      { kind: 'caption', text: '카드 영역별 의미 — 가격 라벨, DEMO 배지, 제작자/조회수, 메타정보' },
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
        '검색창에 위치, 제목, 키워드 입력하면 실시간 필터링.',
        '라이선스 칩 + 카테고리 + 검색을 조합하면 사이드바 카운트가 자동으로 그 조합에 맞춰 갱신됩니다.',
        '카드 우상단의 자물쇠 + $ 라벨은 유료 클립. 그 아래 "DEMO" 황색 배지는 현재 모든 유료 클립이 샘플임을 표시.',
        '페이지당 24개. 화면 하단의 숫자 페이지네이션으로 이동.',
        '카드 호버 시 미리보기 자동 재생 (음소거).',
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
      { kind: 'visual', component: <WatchPageMockup /> },
      { kind: 'caption', text: '왼쪽 카테고리 사이드바 + 중앙 플레이어 + 오른쪽 Up next + 하단 라이선스 버튼' },
      { kind: 'glossary', title: '페이지 영역 안내', items: [
        { term: '왼쪽 사이드바', desc: '같은 카테고리의 다른 클립 — 클릭으로 즉시 전환.' },
        { term: '플레이어', desc: '중앙 16:9 영상. 유료 영상은 처음 30초만 미리보기, 이후 잠금.' },
        { term: '오른쪽 사이드바', desc: 'Up next 추천 — 알고리즘 기반 다음 볼 만한 영상.' },
        { term: '하단 메타', desc: '제작자, 위치, 장비, 카테고리, 해상도, 라이선스 옵션, 가격 정보.' },
        { term: 'Unlock 버튼', desc: '유료 영상 결제 진입점. Checkout 페이지로 이동.' },
        { term: 'LICENSED 배지', desc: '유료 영상 표시 + 가격. 옆에 DEMO 배지가 있으면 데모 데이터.' },
      ]},
      { kind: 'tips', items: [
        '유료 영상의 "LICENSED · $X" 라벨 옆 황색 "DEMO" 배지는 데모 데이터 표시.',
        '왼쪽 사이드바로 같은 카테고리 영상을 빠르게 비교 시청.',
        '제작자 핸들 클릭 → 그 파일럿의 모든 작품 보기.',
        '뒤로가기 시 Map/Explore 페이지의 필터·줌·검색이 그대로 보존.',
        '댓글·평점은 페이지 하단에 (구매자만 평점 작성 가능).',
      ]},
      { kind: 'faq', items: [
        { q: '미리보기 30초 이후엔 어떻게 되나요?', a: '잠금 화면이 뜨고 "Unlock for $X" 버튼이 표시됩니다. 결제 후엔 영상 전체를 시청 + 다운로드 가능.' },
        { q: '구매한 영상을 재다운로드하려면?', a: '내 계정 메뉴 → "Orders & licenses"에서 모든 구매 내역과 다운로드 링크가 영구 보관됩니다.' },
        { q: '평점은 어떻게 매기나요?', a: '구매자만 페이지 하단에서 1~5점 + 리뷰 작성 가능. 작성된 리뷰는 즉시 공개되고, 파일럿 평점 평균에 반영.' },
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
      { kind: 'caption', text: '4단계 진행 흐름 — 등록 → 입찰 → 수락 → 수령. 결제는 에스크로로 보관' },
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
        { q: '파일럿이 도중에 잠적하면?', a: '마감일 + 7일 이내 결과물이 안 오면 자동 환불 처리됩니다. 잠적한 파일럿은 사이트에서 추방.' },
      ]},
    ],
    related: [['commission', '내 의뢰 상세'], ['creators', 'Creators (파일럿 둘러보기)'], ['pricing', 'Pricing (요금 가이드)']],
  },

  upload: {
    label: 'Upload · 영상 등록',
    tagline: '파일럿이 직접 영상을 올리고 70% 수익',
    sections: [
      { kind: 'overview', text: '직접 촬영한 드론 영상을 두 가지 방식으로 등록합니다. Direct는 우리 CDN에 마스터 파일 업로드, External은 YouTube/Vimeo 링크 임베드. 둘 다 같은 카탈로그에 노출되고 검색·구매 가능.' },
      { kind: 'visual', component: <UploadModesMockup /> },
      { kind: 'caption', text: 'Direct (CDN 업로드, 라이선스 판매 가능) vs External (외부 링크 임베드, 노출/홍보용)' },
      { kind: 'glossary', title: '두 가지 업로드 방식 비교', items: [
        { term: 'Direct', color: '#4a6741', desc: 'MP4 파일 직접 업로드 → 우리 CDN 호스팅 → 다운로드 가능. 라이선스 판매 가능, 가격 자유 설정. 수익의 70%.' },
        { term: 'External', color: '#c68820', desc: 'YouTube/Vimeo 링크 붙여넣기 → 임베드만 → 호스팅비 무료. 라이선스 판매 안 됨, 노출/홍보·트래픽 유입 목적.' },
      ]},
      { kind: 'glossary', title: '필수 입력 필드', items: [
        { term: '제목', desc: '120자 이내. 검색에 잘 걸리는 키워드 포함 권장.' },
        { term: '설명', desc: '500자. 위치·시간·장비·후반 작업 정보 적으면 라이선스 가치 상승.' },
        { term: '위치', desc: 'Map에서 좌표 클릭 또는 위/경도 직접 입력. 정확할수록 발견율 ↑.' },
        { term: '카테고리', desc: '12개 그룹 중 선택. AI Generated는 별도 표시 의무.' },
        { term: '가격 + 라이선스', desc: '3개 티어(Personal/Commercial/Editorial) 각각 가격 설정. 비활성화 가능.' },
        { term: '태그', desc: '최대 12개. "sunset", "4k", "iceland" 같은 검색 키워드.' },
      ]},
      { kind: 'tips', items: [
        '시장 시세: Personal $49~99, Commercial $99~199, Editorial $149~299.',
        '같은 라이선스 안에서 무제한 사용 권리 (1회 결제, 영구 사용).',
        '플랫폼 수수료 15% (수익의 85% 파일럿).',
        '판매 통계는 [내 계정 > Earnings]에서 확인.',
        '품질이 낮은 클립은 자동 검토 후 비공개 처리될 수 있음.',
        'Direct 업로드는 ProRes 또는 H.265 마스터 파일 (최대 30GB) 권장.',
      ]},
      { kind: 'faq', items: [
        { q: '저작권이 있는 음악을 BGM으로 쓴 영상도 올릴 수 있나요?', a: '안 됩니다. 무음 또는 CC 음원만 허용. 구매자가 자기 음악을 입혀야 하므로 무음이 가장 잘 팔립니다.' },
        { q: '드론 비행 허가가 없는 지역에서 찍은 영상은?', a: '게시 자체가 불가능합니다. 각국 항공법을 준수한 영상만 등록 가능.' },
        { q: '한 영상으로 얼마나 벌 수 있나요?', a: '천차만별. 인기 클립은 월 $500~1,000, 평범한 클립은 월 $50~200. 카테고리·해상도·키워드가 가장 큰 변수.' },
        { q: 'AI 생성 영상도 올릴 수 있나요?', a: '네. 단 카테고리에서 "AI Generated" 표시 의무. 미고지 시 라이선스 박탈.' },
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
      { kind: 'caption', text: '3가지 라이선스 티어 — Personal $79 / Commercial $129 / Editorial $199' },
      { kind: 'glossary', title: '3가지 라이선스 티어', items: [
        { term: 'Personal', color: '#4a6741', desc: '개인 SNS, 블로그, 학교 과제, 비상업 영상. 가장 저렴.' },
        { term: 'Commercial', color: '#c68820', desc: '광고, 제품 홍보, 마케팅 영상, 클라이언트 작업. 가장 일반적.' },
        { term: 'Editorial', color: '#c85a2e', desc: '방송, 다큐멘터리, 뉴스 (저작권 표시 필수). 재배포·재방영까지 허용.' },
      ]},
      { kind: 'glossary', title: '결제 수단', items: [
        { term: 'Card', desc: 'Visa/Mastercard/Amex 직접 입력. Stripe 결제.' },
        { term: 'PayPal', desc: 'PayPal 계정으로 결제 (Smart Buttons).' },
        { term: 'Apple Pay', desc: 'Safari/iOS에서만 표시.' },
      ]},
      { kind: 'tips', items: [
        '잘못된 라이선스 선택은 환불이 어렵습니다 — 신중하게.',
        '같은 영상을 더 높은 티어로 업그레이드하려면 차액만 추가 결제.',
        '결제 후 다운로드 링크는 30일간 유효, 라이선스 PDF는 영구 보관.',
        '상단 황색 배너의 "데모 모드" 표시 = 실제 결제 처리 안 됨.',
        '회사 명의 결제는 사업자 정보를 입력해야 인보이스 발급.',
      ]},
      { kind: 'faq', items: [
        { q: '회사 명의로 구매했는데 부서가 다르면?', a: '같은 회사 내부 사용은 OK. 다른 법인이면 새 라이선스 필요.' },
        { q: 'Editorial 라이선스인데 광고에 쓰면?', a: '약관 위반. 라이선스 박탈 + 추가 비용 청구. 광고 용도면 Commercial 이상 필수.' },
        { q: '환불 정책은?', a: '결제 후 24시간 이내 + 다운로드하지 않은 경우만 환불 가능. 다운로드 후엔 환불 불가.' },
      ]},
    ],
    related: [['orders', 'Orders & Licenses (구매 내역)'], ['pricing', 'Pricing (가격 정책)']],
  },

  rankings: {
    label: 'Rankings · 랭킹',
    tagline: '인기 영상 + 인기 파일럿 + 카테고리 트렌드',
    sections: [
      { kind: 'overview', text: '주간/월간/연간 베스트 영상과 판매 1위 파일럿, 카테고리별 급상승 트렌드를 매주 갱신해서 보여줍니다. 무엇을 봐야 할지 모를 때 출발점.' },
      { kind: 'visual', component: <RankingsPodiumMockup /> },
      { kind: 'caption', text: 'Top 3 영상은 시상대 형식으로 (1·2·3등 순)' },
      { kind: 'glossary', title: '주요 섹션', items: [
        { term: 'Top Clips', desc: '조회 + 구매 + 평점 종합 점수 상위 10개.' },
        { term: 'Top Pilots', desc: '판매액 + 평점 상위 파일럿 10명.' },
        { term: 'Rising Stars', desc: '최근 30일 가입한 파일럿 중 인기 급상승.' },
        { term: '카테고리 트렌드', desc: '주간 상승률 (예: AI Generated +120%).' },
      ]},
      { kind: 'glossary', title: '점수 산정 방식', items: [
        { term: 'Views', desc: '조회수 1점 (가중치 30%).' },
        { term: 'Sales', desc: '판매 1건 50점 (가중치 50%).' },
        { term: 'Rating', desc: '★ 4.5+ 1점, ★ 5.0 2점 (가중치 20%).' },
      ]},
      { kind: 'tips', items: [
        '기간 토글: This week / This month / All time — 같은 영상이라도 기간 따라 순위 다름.',
        '카테고리 트렌드는 새로 부상하는 분야를 빠르게 알려줌.',
        '무엇을 만들지 고민하는 파일럿이라면 트렌드 ↑인 카테고리부터 시도.',
        '랭킹 1위 클립은 메인 페이지 상단 추천 슬롯에 노출.',
      ]},
      { kind: 'faq', items: [
        { q: '왜 매주 순위가 바뀌나요?', a: 'Trending은 최근 7일 활동 기준이라 신작이 빠르게 치고 올라올 수 있도록 설계. All time은 누적이라 안정적.' },
        { q: 'Rising Stars는 어떻게 선정?', a: '가입 30일 이내 + 첫 판매 5건 이상 + 평점 4.5+ 조건 만족하는 신인 파일럿.' },
      ]},
    ],
    related: [['creators', 'Creators (전체 디렉터리)'], ['atlas', 'Atlas (편집 추천)']],
  },

  creators: {
    label: 'Creators · 크리에이터',
    tagline: '활동 중인 모든 검증된 파일럿 디렉터리',
    sections: [
      { kind: 'overview', text: '드론 이카루스에 등록된 모든 파일럿을 프로필 카드로 둘러봅니다. 위치, 전문 분야, 평점, 누적 작품 수가 한눈에 보이고, 카드 클릭하면 그 파일럿의 모든 작품을 확인할 수 있어요.' },
      { kind: 'visual', component: <CreatorProfileMockup /> },
      { kind: 'caption', text: '프로필 카드 — 아바타·핸들·전문 분야·평점·포트폴리오 미리보기 + 통계 패널' },
      { kind: 'glossary', title: '프로필 카드 영역', items: [
        { term: '아바타 + ✓', desc: '검증 완료 마크 (✓). 미검증 파일럿은 ✓ 없음.' },
        { term: '핸들 + 위치', desc: '@nycaerial · New York 형식.' },
        { term: '전문 분야', desc: '주로 촬영하는 카테고리 2~3개 (예: Cityscape · Sports).' },
        { term: '★ 평점', desc: '구매자 평균 평점 (소수점 1자리).' },
        { term: 'Portfolio Preview', desc: '대표 작품 3개 썸네일.' },
        { term: 'Stats 패널', desc: '총 판매·평점·평균 응답시간·의뢰 수락률.' },
        { term: 'Follow 버튼', desc: '신작 알림 받기 (이메일 + 사이트 알림).' },
      ]},
      { kind: 'glossary', title: '파일럿 등급', items: [
        { term: '✓ Verified', color: '#c68820', desc: '항공법 면허 + 신원 인증 + 포트폴리오 검수 통과.' },
        { term: 'New', color: '#4a6741', desc: '가입 30일 이내 신인 (검증 진행 중).' },
        { term: 'Top 1%', color: '#c85a2e', desc: '판매 + 평점 기준 상위 1% 엘리트.' },
      ]},
      { kind: 'tips', items: [
        '프로필 클릭 → 작품 갤러리 + 평점 + 리뷰 + 의뢰 받음 여부.',
        'Follow 기능으로 신작 알림 받기.',
        '의뢰 등록 시 우수 파일럿 1순위 추천 슬롯에 노출.',
        'Creator Studio (대시보드)는 본인 카드의 우상단 버튼.',
        '메시지로 직접 연락 가능 (의뢰 협상·맞춤 작업).',
      ]},
      { kind: 'faq', items: [
        { q: '"검증된" 파일럿은 어떤 기준?', a: '항공법 면허 사본 제출 + 포트폴리오 검수 + 신원 인증 통과한 파일럿만. 일반 가입자는 검증 전엔 Pilot 표시 없음.' },
        { q: 'Top 1%는 어떻게 되나요?', a: '판매 누적 $50K 이상 + 평점 4.8+ + 의뢰 수락률 90%+ 동시 만족. 매주 자동 갱신.' },
        { q: '한국 파일럿이 적은 이유?', a: '플랫폼이 영문 우선이라 진입 장벽이 있어요. 한국어 가이드를 통해 가입을 늘리는 중.' },
      ]},
    ],
    related: [['rankings', 'Rankings (인기 파일럿)'], ['commissions', 'Commissions (의뢰)']],
  },

  atlas: {
    label: 'Atlas · 편집장의 지도',
    tagline: '아직 없는 명소를 크라우드소싱으로 발굴하는 현상금 시스템',
    sections: [
      { kind: 'overview', text: '드론 이카루스에 아직 영상이 없는 장소를 크라우드소싱으로 모으는 페이지입니다. 사용자가 "이 곳 영상이 있었으면 좋겠다"고 제안 → 다른 사용자들이 투표 → 현상금(purse) 후원 → 검증된 파일럿이 도전(Claim) → 첫 통과 영상에게 현상금 전체를 지급. 184개 열린 의뢰, $472,800 누적 후원금.' },
      { kind: 'visual', component: <AtlasBountyMockup /> },
      { kind: 'caption', text: 'Atlas 의뢰 카드 — 위치·난이도·태그·현상금·마감일 + Claim 버튼' },
      { kind: 'glossary', title: '의뢰 카드 영역 안내', items: [
        { term: '제목 + 설명', desc: '국가 + 명소 이름 + 원하는 분위기/조건 (예: "Socotra — Dragon Blood Trees, first-light overhead").' },
        { term: '난이도', desc: 'Easy/Moderate/Hard/Extreme 4단계 (접근성·허가·기상 조건 종합 평가).' },
        { term: '태그', desc: 'remote · endemic · architecture · fog · altitude 등 — 어떤 조건이 필요한지 표시.' },
        { term: '현상금 (PURSE)', desc: '사용자들이 모은 누적 후원금. 첫 통과 영상에게 전액 지급.' },
        { term: '마감일', desc: '이 날짜까지 영상이 안 나오면 의뢰 자동 종료, 현상금은 후원자에게 환불.' },
        { term: 'Claim 버튼', desc: '검증된 파일럿이 "내가 도전한다" 선언. 30일 내 영상 제출 의무.' },
        { term: 'Add to purse', desc: '일반 사용자가 현상금 풀에 후원 추가 (최소 $5).' },
        { term: '⬆ 투표', desc: '제안에 공감하면 +1 투표. 투표 많은 의뢰가 상단으로.' },
      ]},
      { kind: 'glossary', title: '난이도 4단계', items: [
        { term: 'Easy', color: '#4a6741', desc: '도시 근교, 별도 허가 없이 비행 가능. 누구나 도전 가능.' },
        { term: 'Moderate', color: '#c68820', desc: '특정 시즌 제한, 기본 허가 필요. 적정 경험 필요.' },
        { term: 'Hard', color: '#9b4020', desc: '국립공원·문화재 허가, 까다로운 기상 조건. 검증된 파일럿만 권장.' },
        { term: 'Extreme', color: '#c85a2e', desc: '원격지·외교 허가·전문 장비 필요. Top 1% 파일럿만 권장. 가장 큰 현상금.' },
      ]},
      { kind: 'glossary', title: '4단계 흐름', items: [
        { term: '1. Suggest', desc: '"Suggest a place" 버튼으로 위치·이유·원하는 조건 작성. 자동으로 의뢰 카드 생성.' },
        { term: '2. Vote/Fund', desc: '다른 사용자가 ⬆ 투표 또는 Add to purse로 후원금 추가.' },
        { term: '3. Claim', desc: '검증된 파일럿이 "Claim this" 클릭 → 30일 내 영상 제출 의무.' },
        { term: '4. Submit', desc: '파일럿이 영상 제출 → 편집장 검수 통과 → 현상금 전액 지급 + 영상은 카탈로그에 등록.' },
      ]},
      { kind: 'tips', items: [
        '상단 통계 패널: Open bounties · Total purse · Places claimed this month · Avg days to first submission.',
        '필터: 난이도 (All/Easy/Moderate/Hard/Extreme) · 정렬 (Most voted/Newest/Highest purse/Closest deadline).',
        '클레임은 동시에 1개만 가능. 마감일까지 제출 못하면 자동 해제 + 다른 파일럿이 Claim 가능.',
        '의뢰자(Suggest한 사람)도 후원금 추가 가능. 본인 의뢰에 보너스를 걸어 매력도 ↑.',
        '검수 거부되면 30일 이내 재제출 또는 Claim 자동 해제.',
        '현상금이 높을수록 도전자가 빨리 나타남. $1,000 미만은 평균 21일 소요, $3,000+는 5일.',
      ]},
      { kind: 'faq', items: [
        { q: 'Atlas 의뢰와 일반 Commissions 차이는?', a: 'Commissions는 1:1 (의뢰자 ↔ 파일럿) 비공개 협상, 결과물은 의뢰자 전용. Atlas는 다대다 공개 현상금, 결과물은 카탈로그에 공개되어 누구나 라이선스 구매 가능.' },
        { q: '제 영상을 등록할 수 있는 의뢰는?', a: 'Claim 버튼이 활성화된 의뢰만. 검증된 파일럿이어야 합니다 (Verified 마크 필요).' },
        { q: '현상금이 마음에 안 들면?', a: 'Add to purse로 추가 후원 가능. 또는 다른 의뢰를 골라 도전.' },
        { q: '검수 기준이 뭐예요?', a: '편집장이 (1) 위치 정확성, (2) 영상 품질, (3) 의뢰 조건 충족 여부를 확인. 보통 3영업일 이내 결과 통보.' },
        { q: '마감일이 지나면?', a: '의뢰 자동 종료, 모든 후원금이 후원자에게 환불됩니다. 의뢰 자체는 다시 살릴 수 있어요.' },
      ]},
    ],
    related: [['home', 'Map (지도)'], ['commissions', 'Commissions (1:1 의뢰)'], ['rankings', 'Rankings (Top Pilot 도전)']],
  },

  lab: {
    label: 'Lab · 연구실',
    tagline: '드론 기술·튜토리얼·논문·특허·장비 리뷰 허브',
    sections: [
      { kind: 'overview', text: '학술 논문, 특허, 오픈소스 펌웨어, 장비 리뷰, 촬영 기법 튜토리얼 같은 깊이 있는 콘텐츠를 모은 곳입니다. 입문자부터 전문가까지 단계별 자료. 주간 새 글 5~10개씩 추가됩니다.' },
      { kind: 'visual', component: <LabPostMockup /> },
      { kind: 'caption', text: '4가지 카테고리(Research/Tutorial/Patent/News)별 색상 라벨로 분류' },
      { kind: 'glossary', title: '4가지 카테고리', items: [
        { term: 'Research', color: '#4a6741', desc: '학술 논문, 항공역학, AI vision, swarm 알고리즘 — 최신 연구 동향.' },
        { term: 'Tutorial', color: '#c68820', desc: '촬영 기법, 후반 작업, 색보정, ND 필터 사용법, FPV 입문 — 실전 가이드.' },
        { term: 'Patent', color: '#3a5a8a', desc: '드론 산업 특허 동향, 기술 흐름, 라이선싱 이슈.' },
        { term: 'News', color: '#c85a2e', desc: '제품 출시, 정책 변화, 산업 이벤트, 박람회 리뷰.' },
      ]},
      { kind: 'glossary', title: '글의 구성 요소', items: [
        { term: '제목 + 카테고리 라벨', desc: '한눈에 분류 파악.' },
        { term: '메타', desc: '작성일 · 읽는 시간 · 평점 · 댓글 수.' },
        { term: '본문', desc: '마크다운 + 이미지 + 영상 임베드 + 코드 샘플 혼합 가능.' },
        { term: '댓글 + 평점', desc: '독자 반응 + 토론 + 추가 정보 공유.' },
      ]},
      { kind: 'tips', items: [
        '글 + 영상 + 코드 샘플 혼합 콘텐츠로 깊이 있는 학습 가능.',
        'AI Generation 워크플로 가이드는 인기 시리즈.',
        '장비별 비교 리뷰 + 점수표.',
        '본인이 글을 쓰려면 Lab 에디터 권한 신청 (검증된 파일럿 + 평점 4.7+).',
        '연관 글은 페이지 하단에 자동 추천.',
      ]},
      { kind: 'faq', items: [
        { q: '제가 글을 쓰고 싶어요', a: '검증된 파일럿(Verified) 또는 산업 종사자만 가능. [내 계정 > Lab editor request]에서 신청 → 편집장 승인.' },
        { q: '특허 글은 누가 작성하나요?', a: '주로 변리사·법무팀이 검수한 글이 올라갑니다. 일반 사용자도 산업 동향 분석 글은 작성 가능.' },
        { q: '실시간 댓글 알림은?', a: '내 글에 댓글이 달리면 이메일 + 사이트 알림 즉시.' },
      ]},
    ],
    related: [['gear', 'Gear (장비 카탈로그)'], ['guide', 'Guide (사용 설명서)']],
  },

  gear: {
    label: 'Gear · 드론 카탈로그',
    tagline: '300+ 드론 제품 비교 + 가격대별 추천 + 4개 동시 비교 모드',
    sections: [
      { kind: 'overview', text: '입문용($200)부터 산업용($30,000+)까지 전 세계 드론 제품을 사양·가격·용도별로 비교합니다. 장비 구매 결정 전 한 번 들러보세요. Compare 모드로 최대 4개를 가로로 늘어놓고 사양표를 한눈에 볼 수 있어요.' },
      { kind: 'visual', component: <GearCompareMockup /> },
      { kind: 'caption', text: 'Compare 모드 — 4개 제품을 가로로 비교, RECOMMENDED 라벨로 추천 강조' },
      { kind: 'glossary', title: '가격대 필터', items: [
        { term: '$0~500', color: '#4a6741', desc: '입문용. DJI Mini 시리즈, Holy Stone, RYZE.' },
        { term: '$500~2K', color: '#c68820', desc: '취미·세미프로. DJI Air 3, Avata 2, Autel Nano.' },
        { term: '$2K~5K', color: '#9b4020', desc: '시네마틱·상업. DJI Mavic 3 Pro, Inspire 2, Autel Evo Max.' },
        { term: '$5K+', color: '#c85a2e', desc: '시네마·산업·측량. DJI Inspire 3, Freefly Astro, Skydio X10.' },
      ]},
      { kind: 'glossary', title: '용도별 분류', items: [
        { term: 'Beginner', desc: '입문. 가벼움·짧은 비행시간·자동 모드. RTH/장애물 회피 기본.' },
        { term: 'Cinematic', desc: '시네마틱. 큰 센서·로그 프로필·짐벌 안정화·ProRes 녹화.' },
        { term: 'FPV', desc: 'FPV·레이싱. 고속·자유 비행·DJI O3/O4 무선 영상 송신.' },
        { term: 'Industrial', desc: '산업·측량·검사. 페이로드·열화상 카메라·오픈 SDK.' },
      ]},
      { kind: 'glossary', title: '제품 카드 정보', items: [
        { term: '🎥 Video', desc: '최대 해상도/프레임레이트 (예: 4K/120, 5.1K/50).' },
        { term: '⚖ Weight', desc: '무게. 250g 미만은 일부 국가에서 등록 불필요.' },
        { term: '⏱ Flight time', desc: '최대 비행시간 (배터리 1개 기준).' },
        { term: '📡 Range', desc: '최대 송수신 거리 (개방된 환경).' },
        { term: '★ Rating', desc: '사용자 평점 (소수점 1자리).' },
      ]},
      { kind: 'tips', items: [
        'Compare 모드: 카드 우상단 ☐ 체크박스로 선택 → 상단 "Compare (N)" 버튼 → 사양표 가로 비교.',
        'RECOMMENDED 라벨이 붙은 제품은 카테고리 + 가격대 기준 가성비 최고.',
        '제품 카드: 사진 + 사양 + 가격 + 추천 용도 + 추천 라이선스 등급.',
        '신규 출시순 + 평점순 + 가격 낮은순 정렬 가능.',
        '비교 결과는 URL에 저장되므로 공유 가능.',
      ]},
      { kind: 'faq', items: [
        { q: '가격이 실제 시장가와 다른 것 같아요', a: '제조사 권장 소비자가 기준. 실제 판매가는 변동 있을 수 있어요. 클릭 시 외부 판매 링크 (Amazon/B&H 등) 제공.' },
        { q: '내가 가진 드론도 카탈로그에 추가할 수 있나요?', a: '아쉽게도 사용자 추가는 불가. 편집장이 정기적으로 신제품을 추가합니다. 누락된 제품은 [Suggest gear] 폼으로 제보 가능.' },
        { q: '드론 보험·서비스는?', a: '카탈로그 외부. 별도 페이지(준비 중)에서 다룰 예정.' },
      ]},
    ],
    related: [['lab', 'Lab (장비 리뷰 글)']],
  },

  live: {
    label: 'Live · 실시간 방송',
    tagline: '드론 라이브 방송 + 슈퍼챗 후원 (70% 파일럿)',
    sections: [
      { kind: 'overview', text: '파일럿이 비행하면서 실시간 방송하는 영상을 보고, 채팅·슈퍼챗으로 후원할 수 있어요. 좋은 장면이 나오는 순간을 함께 보고 응원하는 채널. 송출은 YouTube/Twitch와 동시 송신 가능.' },
      { kind: 'visual', component: <LiveStreamMockup /> },
      { kind: 'caption', text: '진행 중인 라이브 방송 그리드 (LIVE 배지 + 시청자 수) + 채팅·슈퍼챗 영역' },
      { kind: 'glossary', title: '방송 카드 영역', items: [
        { term: 'LIVE 배지', desc: '빨간색 LIVE 표시 = 현재 송출 중.' },
        { term: '시청자 수', desc: '실시간 동시 시청자 (1.2k = 1,200명).' },
        { term: '제목 + 핸들', desc: '방송 제목 + 파일럿 핸들.' },
        { term: '경과 시간', desc: '방송 시작 후 경과 시간 (2h, 45m, 12m).' },
      ]},
      { kind: 'glossary', title: '슈퍼챗 후원 등급', items: [
        { term: '$1~5', color: '#4a6741', desc: '일반 채팅 강조 (5초).' },
        { term: '$5~20', color: '#c68820', desc: '상단 고정 메시지 (1분).' },
        { term: '$20~50', color: '#9b4020', desc: '상단 고정 + 멜로디 (3분).' },
        { term: '$50+', color: '#c85a2e', desc: '화면 하단 풀 배너 + 5분 고정.' },
      ]},
      { kind: 'tips', items: [
        '진행 중인 라이브 방송 그리드 (실시간 시청자 수 표시).',
        '예약된 방송 (D-day 카운트다운) — 사전 알림 신청 가능.',
        '슈퍼챗 후원의 70%는 파일럿에게 송금 (Stripe 직접).',
        '내가 방송하려면 [Live help · Go live guide] 참고 (장비·OBS 설정·송출).',
        'YouTube/Twitch 동시 송출 가능 (RTMP 멀티 인코딩).',
        '방송 종료 후 자동 VOD 저장 (My streams에서 재시청).',
      ]},
      { kind: 'faq', items: [
        { q: '드론으로 어떻게 실시간 송출하나요?', a: 'DJI Goggles + 노트북 연결 → OBS → RTMP 송출. [Live help] 페이지에 단계별 가이드 있습니다.' },
        { q: '슈퍼챗은 어떻게 받나요?', a: 'Stripe Connect 계정 연동 후 즉시 70% 송금. 매월 1일 일괄 정산도 가능.' },
        { q: '예약된 방송에 알림 받으려면?', a: '방송 카드 우상단 🔔 클릭 → 시작 5분 전 이메일/푸시.' },
      ]},
    ],
    related: [['livehelp', 'Live help (방송 가이드)'], ['mystreams', '내 방송 기록']],
  },

  livehelp: {
    label: 'Live help · 방송 가이드',
    tagline: '드론 라이브 송출 단계별 셋업 가이드',
    sections: [
      { kind: 'overview', text: '드론으로 라이브 방송을 시작하는 모든 단계를 정리합니다. 장비, 소프트웨어, 송출 설정, 슈퍼챗 정산까지.' },
      { kind: 'tips', items: [
        '필요 장비: 드론 + 송신기/Goggles + USB 캡처카드 + 노트북 + 안정적 인터넷(업로드 10Mbps+).',
        '소프트웨어: OBS Studio (무료) 또는 Streamlabs.',
        'RTMP 키: [내 계정 > Streaming]에서 발급.',
        '동시 송출: YouTube/Twitch 키도 같이 입력 가능.',
        '리허설 모드: 비공개 송출로 화질·딜레이 테스트.',
      ]},
    ],
    related: [['live', 'Live (방송 보기)'], ['mystreams', '내 방송 기록']],
  },

  shots: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    sections: [
      { kind: 'overview', text: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다. 전속 매니저가 큐레이션부터 결제·계약까지 담당.' },
      { kind: 'visual', component: <ShotsB2BMockup /> },
      { kind: 'caption', text: '단건 라이선스 vs B2B 패키지 비교 — 후자는 맞춤 견적 + 전속 매니저' },
      { kind: 'glossary', title: '패키지 종류', items: [
        { term: 'Theme Pack', desc: '주제별 100~500편 묶음 (예: "Korean cityscapes 2024", "Tropical beaches"). $5K~$30K.' },
        { term: 'Subscription', desc: '월 구독 — 매월 새 클립 50편 공급. $2K~$8K/월.' },
        { term: 'Custom', desc: '의뢰 + 라이선스 통합 — 수십 명의 파일럿에게 동시 의뢰 후 패키지로 묶음.' },
        { term: 'Exclusive', desc: '특정 영상을 한 회사가 독점. 일반 카탈로그에서 제외. $50K+.' },
      ]},
      { kind: 'tips', items: [
        '맞춤 큐레이션 + 전속 매니저 배정 (응답 24h 이내).',
        '월간 구독 옵션 (스톡 풋티지 형태).',
        '견적 요청 폼: 예산·용도·기간·필요 영상 수·해상도 입력.',
        '대형 캠페인용 우선 선택권 제공 (신작이 일반 카탈로그 노출 전 먼저).',
        'NDA 사인 가능 (특히 Exclusive 패키지).',
        '결제는 미국·한국 사업자 모두 인보이스 발행 가능.',
      ]},
      { kind: 'faq', items: [
        { q: '최소 패키지 단가가 얼마부터?', a: 'Theme Pack은 $5K부터, Subscription은 $2K/월부터. 단건 라이선스 100건 = 약 $13K이므로 패키지가 훨씬 유리.' },
        { q: '결제는 어떻게?', a: '인보이스 + 송금 (Wire/ACH/SEPA) 또는 신용카드. 선결제 또는 NET-30/60.' },
        { q: '특정 영상을 우리만 쓰게 하려면?', a: 'Exclusive 패키지로 진행. 해당 영상은 일반 카탈로그에서 제외 + 다른 회사 판매 금지.' },
      ]},
    ],
    related: [['pricing', 'Pricing (요금제)'], ['commissions', 'Commissions (단건 의뢰)']],
  },

  shotlibrary: {
    label: 'Shots · B2B 라이선싱',
    tagline: '대량 영상 패키지를 광고 대행사·방송사에',
    sections: [
      { kind: 'overview', text: '낱장 라이선스가 아니라, "전국 야경 100편" 같은 대규모 패키지 또는 월간 구독 형태로 영상을 공급하는 B2B 채널입니다. 전속 매니저가 큐레이션부터 결제·계약까지 담당.' },
      { kind: 'visual', component: <ShotsB2BMockup /> },
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
    tagline: '플랫폼 수수료 + 라이선스 가격대 가이드 (70/30 분배)',
    sections: [
      { kind: 'overview', text: '구매자/판매자/의뢰자 입장별 요금 구조를 한 페이지에 정리합니다. 70/30 분배 원칙은 모든 거래에 동일하게 적용돼요. 결제 수수료·세금이 정확히 어디로 가는지도 투명하게 표시.' },
      { kind: 'visual', component: <PricingSplitMockup /> },
      { kind: 'caption', text: '$99 매출의 분배: 파일럿 $69.30 / 플랫폼 $14.85 / 결제·세금 $14.85' },
      { kind: 'glossary', title: '입장별 요금', items: [
        { term: '구매자', color: '#4a6741', desc: '라이선스 가격 그대로 (Personal $49~99, Commercial $99~199, Editorial $149~299).' },
        { term: '판매자', color: '#c68820', desc: '판매가의 70% 정산 (수수료 15% + 결제·세금 15%). 매월 1일 자동 송금.' },
        { term: '의뢰자', color: '#9b4020', desc: '입찰 가격 + 에스크로 수수료 5%.' },
        { term: '엔터프라이즈', color: '#c85a2e', desc: '맞춤 견적 (대량 패키지·월간 구독). 분배율 협의 가능.' },
      ]},
      { kind: 'glossary', title: '정산 일정', items: [
        { term: '판매 → 정산', desc: '판매 완료 D+30일 (구매자 환불 가능 기간). 그 이후 매월 1일 송금.' },
        { term: '슈퍼챗', desc: '실시간 70% Stripe 즉시 송금 (수수료 차감 후).' },
        { term: '의뢰', desc: 'Accept 즉시 에스크로에서 송금 (1~2영업일).' },
        { term: '환불', desc: '구매자 환불은 24h + 다운로드 전만 가능. 환불 시 판매자 정산도 회수.' },
      ]},
      { kind: 'tips', items: [
        '판매 누적 $100 미만은 다음 달 이월 (Stripe 송금 최소액).',
        '엔터프라이즈는 맞춤 분배율 협의 (대형 매출은 70% → 80%까지 협상).',
        '세금: 미국·EU·한국 거래는 자동 부가세 계산.',
        '결제 수수료(Stripe 2.9% + $0.30)는 플랫폼이 부담 (수수료 15%에 포함).',
      ]},
      { kind: 'faq', items: [
        { q: '왜 70/30이에요? 다른 플랫폼은 80/20인데', a: '그 차이는 결제 수수료(Stripe 2.9% + 환율) 부담 주체 때문. 우리는 결제 수수료를 플랫폼이 부담하므로 실수령액은 다른 플랫폼과 비슷합니다.' },
        { q: '한국 사업자도 부가세 10% 붙나요?', a: '구매자가 한국 사업자면 10% VAT 자동 추가. 판매자는 매월 정산 내역에 VAT 환급 가능 항목 표시.' },
        { q: '구독 결제는 자동 갱신?', a: 'B2B 구독만. 일반 라이선스는 모두 1회 결제 (영구 사용권).' },
      ]},
    ],
    related: [['guide', 'Guide (사용 설명서)'], ['shots', 'Shots (B2B)']],
  },

  guide: {
    label: 'Guide · 사용 설명서',
    tagline: '단계별 한국어 사용 가이드 + 14개 페이지 안내',
    sections: [
      { kind: 'overview', text: '클립 구매·판매·의뢰의 모든 절차를 SVG 목업과 함께 단계별로 설명합니다. 모든 페이지에 대한 안내도 여기 있어요. 처음 방문자라면 먼저 이 페이지부터 둘러보세요.' },
      { kind: 'visual', component: <GuideTabsMockup /> },
      { kind: 'caption', text: '4개 탭 — 클립 구매 / 클립 판매 / 커스텀 의뢰 / 모든 페이지' },
      { kind: 'glossary', title: '4개 탭', items: [
        { term: '클립 구매', color: '#4a6741', desc: '4단계 (지도/그리드 → 미리보기 → 라이선스 → 결제). 각 단계마다 SVG 목업 + 팁.' },
        { term: '클립 판매', color: '#c68820', desc: '4단계 (가입 → 업로드 → 가격 설정 → 모니터링).' },
        { term: '커스텀 의뢰', color: '#c85a2e', desc: '4단계 (작성 → 입찰 → 수락 → 수령).' },
        { term: '모든 페이지', color: '#1f2b22', desc: '14개 페이지의 자세한 설명 + 해당 페이지 바로가기.' },
      ]},
      { kind: 'tips', items: [
        '각 단계의 SVG 목업에는 실제 YouTube 썸네일이 박혀 있어 시각적으로 이해 쉬움.',
        '"해당 페이지 열기 →" 링크로 바로 실습 가능.',
        '모든 텍스트는 한국어로 작성됨.',
        'Guide 페이지 자체에서도 각 페이지마다 우측 하단 ❓ 버튼으로 즉석 안내 모달 열 수 있음.',
      ]},
      { kind: 'faq', items: [
        { q: 'Guide와 ❓ 안내 버튼 차이는?', a: 'Guide는 처음 방문자를 위한 종합 매뉴얼 (4개 시나리오 + 14개 페이지). ❓ 버튼은 현재 페이지에 한정된 즉석 안내. Guide가 더 깊고, ❓는 즉시.' },
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
      '도전: Atlas에서 현상금 의뢰 클레임',
    ]},
  ],
  related: [['guide', 'Guide (사용 설명서)'], ['home', 'Map (시작하기)']],
};

function renderSection(s, i) {
  if (s.kind === 'overview') {
    return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--parchment, #1f2b22)', margin: '0 0 18px' }}>{s.text}</p>;
  }
  if (s.kind === 'visual') {
    return <div key={i} style={{ marginBottom: 6 }}>{s.component}</div>;
  }
  if (s.kind === 'caption') {
    return <Caption key={i} text={s.text} />;
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
            maxWidth: 760, width: '100%', maxHeight: '92vh', overflow: 'auto',
            background: 'var(--ink, #faf6ec)',
            color: 'var(--bone, #0f1a14)',
            border: '1px solid var(--line-strong)',
            borderRadius: 12,
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            padding: '24px 32px',
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
