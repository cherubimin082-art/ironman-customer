import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `IronMan Services is operated by Cherubim AI Infosoft Private Limited, a company incorporated in India with its registered office in Chennai, Tamil Nadu. This Privacy Policy explains what information we collect through the IronMan Services app and website, how we use it, and the choices you have.`,
  },
  {
    title: '2. Information We Collect',
    list: [
      'Account details: your name, mobile number, and email (if provided).',
      'Address details: your pickup address and the apartment/community you select.',
      'Location data: GPS coordinates captured at the time you place an order, used to guide our pickup and delivery agents to you.',
      'Order details: garments selected, quantities, pricing, pickup and delivery time slots, and order status history.',
      'Payment information: payments are processed by Razorpay. We do not store your card, UPI, or bank details — Razorpay handles this securely on our behalf.',
      'Communication data: OTPs and order updates sent to you via WhatsApp.',
    ],
  },
  {
    title: '3. How We Use Your Information',
    list: [
      'To verify your identity via OTP and let you log in securely.',
      'To schedule pickups and deliveries and assign the correct center head (vendor) and delivery agent for your area.',
      'To process payments for orders placed.',
      'To send you order status updates, delivery agent details, and service notifications.',
      'To improve our service quality and resolve complaints or disputes.',
    ],
  },
  {
    title: '4. Who We Share Information With',
    list: [
      'Center heads (vendor partners) and delivery agents assigned to your order — limited to what they need to fulfil your pickup/delivery (name, address, phone, order items).',
      'Razorpay, our payment gateway partner, for processing payments.',
      'WhatsApp (Meta Platforms) for delivering OTPs and order notifications.',
      'We do not sell your personal information to third parties.',
    ],
  },
  {
    title: '5. Data Retention',
    body: `We retain your account and order information for as long as your account is active and for a reasonable period afterward to comply with legal, accounting, and dispute-resolution requirements.`,
  },
  {
    title: '6. Your Rights',
    list: [
      'You can request access to the personal information we hold about you.',
      'You can request correction of inaccurate information via your Profile page.',
      'You can request deletion of your account and associated data, subject to any orders or payments that must be retained for legal/accounting reasons.',
    ],
  },
  {
    title: '7. Data Security',
    body: `We use industry-standard measures, including encrypted connections (HTTPS) and access-controlled databases, to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: '8. Children’s Privacy',
    body: `IronMan Services is intended for use by individuals 18 years and older. We do not knowingly collect information from children.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Material changes will be reflected with a new "Last Updated" date on this page.`,
  },
  {
    title: '10. Contact Us',
    body: `For any privacy-related questions or requests, contact us at support@ironman.today or through the in-app support option.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0F172A', padding: '28px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,28,28,0.22) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px' }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Last Updated: July 2026 · Cherubim AI Infosoft Private Limited</p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>{s.title}</h2>
            {s.body && (
              <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
            )}
            {s.list && (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {s.list.map((item, j) => (
                  <li key={j} style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ marginTop: 32, padding: '16px 18px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12 }}>
          <p style={{ fontSize: 12.5, color: '#B91C1C', margin: 0, lineHeight: 1.6 }}>
            <strong>Cherubim AI Infosoft Private Limited</strong><br />
            Chennai, Tamil Nadu, India
          </p>
        </div>
      </div>
    </div>
  );
}
