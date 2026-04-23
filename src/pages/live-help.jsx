// pages/live-help.jsx — User-facing guide for going live + monetization
import React from 'react';
import { useContent } from '../content/ContentContext';

export function LiveHelpPage({ onNav }) {
  const txt = useContent;
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 80px', color: 'var(--bone)' }}>
      <div className="eyebrow" style={{ color: 'var(--sunset)', marginBottom: 10 }}>● LIVE HELP</div>
      <h1 style={{ fontSize: 40, marginBottom: 14, letterSpacing: '-0.02em' }}>{txt('livehelp.title', 'How live streaming works')}</h1>
      <p style={{ fontSize: 15, color: 'var(--parchment)', lineHeight: 1.6, marginBottom: 36 }}>
        {txt('livehelp.intro', 'droneicarus uses YouTube for the actual video stream, then runs the chat and Super Chat tipping on our site. This means: your viewers watch in HD via YouTube\'s player, while you talk with them and earn through droneicarus.')}
      </p>

      <Step n="1" title={txt('livehelp.s1.t', 'Start your stream on YouTube')}>
        {txt('livehelp.s1.b', 'Open YouTube Studio → Go Live. Use OBS, the YouTube mobile app, or any encoder you like. Set the stream as Public or Unlisted (Private streams cannot be embedded).')}
      </Step>
      <Step n="2" title={txt('livehelp.s2.t', 'Copy your stream URL')}>
        {txt('livehelp.s2.b', 'Once you\'re live on YouTube, copy the URL — anything in the form of youtube.com/watch?v=... or youtu.be/... works. We auto-extract the video id.')}
      </Step>
      <Step n="3" title={txt('livehelp.s3.t', 'Click "● Go Live" on droneicarus')}>
        {txt('livehelp.s3.b', 'Visit /#live, click the Go Live button (top-left of the sidebar). Paste the URL, give your stream a title, optionally enable Super Chat tipping. Press Start.')}
      </Step>
      <Step n="4" title={txt('livehelp.s4.t', 'Your viewers find you')}>
        {txt('livehelp.s4.b', 'Your stream appears on the homepage right sidebar (LIVE NOW), on the Live page, and is searchable. The YouTube player embeds, and your droneicarus chat panel runs alongside it.')}
      </Step>
      <Step n="5" title={txt('livehelp.s5.t', 'End your stream')}>
        {txt('livehelp.s5.b', 'When you stop streaming on YouTube, click "End stream" in droneicarus to mark it ended. The chat history is kept, Super Chat earnings settle to your balance.')}
      </Step>

      <h2 style={{ fontSize: 24, marginTop: 50, marginBottom: 14 }}>{txt('livehelp.money.t', 'Earning with Super Chat')}</h2>
      <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.7, marginBottom: 18 }}>
        {txt('livehelp.money.b1', 'Viewers can send tips of $1–$100 during your stream. Each tip displays a colored, pinned message in your chat (just like YouTube Super Chat). You keep 70%. droneicarus retains 30% to cover payment processing and platform operations.')}
      </p>
      <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.7, marginBottom: 18 }}>
        {txt('livehelp.money.b2', 'Before enabling Super Chat, you must complete your payout profile in Settings → Billing & payouts. Required: PayPal email, legal name, country, and accepting the terms. Your 70% accumulates and pays out monthly to PayPal once your balance reaches $50.')}
      </p>

      <h2 style={{ fontSize: 24, marginTop: 40, marginBottom: 14 }}>{txt('livehelp.faq.t', 'FAQ')}</h2>
      <Faq q={txt('livehelp.faq.q1', 'Why YouTube and not direct streaming?')}
           a={txt('livehelp.faq.a1', 'YouTube\'s infrastructure handles the heavy lifting (transcoding, CDN, adaptive bitrate) for free. Building this ourselves would cost $50-300/month per active streamer. We focus on what makes droneicarus unique: drone-pilot community, location-aware discovery, and direct viewer-pilot tipping.')}/>
      <Faq q={txt('livehelp.faq.q2', 'Can I use OBS / streaming software?')}
           a={txt('livehelp.faq.a2', 'Yes. OBS, Streamlabs, Restream, the YouTube mobile app — anything that can stream to YouTube works. We just need the public watch URL.')}/>
      <Faq q={txt('livehelp.faq.q3', 'Do I need to be a verified pilot?')}
           a={txt('livehelp.faq.a3', 'Right now no — any signed-in account can go live. Verification opens up priority placement and a verified badge.')}/>
      <Faq q={txt('livehelp.faq.q4', 'What happens to chat after the stream ends?')}
           a={txt('livehelp.faq.a4', 'Chat history persists. Visitors who open an ended stream see the recorded chat alongside (in a future update) the YouTube replay.')}/>
      <Faq q={txt('livehelp.faq.q5', 'Are Super Chat tips refundable?')}
           a={txt('livehelp.faq.a5', 'Yes — viewers can request a refund within 24 hours via PayPal. Refunded tips are deducted from your pending balance.')}/>
      <Faq q={txt('livehelp.faq.q6', 'When do I get paid?')}
           a={txt('livehelp.faq.a6', 'Monthly, on the 28th, to your registered PayPal email — once your balance is at least $50. Sub-$50 carries over.')}/>

      <div style={{ marginTop: 40, padding: 22, background: 'var(--forest-900)', border: '1px solid var(--amber)', borderRadius: 6 }}>
        <div style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 600, marginBottom: 8 }}>Ready to go live?</div>
        <p style={{ fontSize: 13, color: 'var(--parchment)', marginBottom: 12 }}>Make sure you've started your YouTube live stream first.</p>
        <button onClick={() => onNav?.('live')} style={{ padding: '10px 18px', background: 'var(--sunset)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>Go to Live page →</button>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 18, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--line)' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--forest-900)', border: '1px solid var(--amber)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16 }}>{n}</div>
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 6, marginTop: 4 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--parchment)', lineHeight: 1.6, margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <div style={{ marginBottom: 18, padding: '14px 18px', background: 'var(--forest-900)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{q}</div>
      <div style={{ fontSize: 13, color: 'var(--parchment)', lineHeight: 1.6 }}>{a}</div>
    </div>
  );
}
