import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account or placing an order on IronMan Services, you agree to be bound by these Terms & Conditions. IronMan Services is operated by Cherubim AI Infosoft Private Limited, Chennai, Tamil Nadu, India. If you do not agree with any part of these terms, please do not use the app.`,
  },
  {
    title: '2. The Service',
    body: `IronMan Services connects customers with local ironing service providers ("center heads") for pickup, ironing, and delivery of garments. Pricing, garment categories, and service availability are set independently by each center head for the apartments/areas they serve.`,
  },
  {
    title: '3. Account Registration',
    list: [
      'You must provide accurate name, mobile number, and address details during signup.',
      'You are responsible for keeping your OTP and account access secure.',
      'One account per mobile number.',
    ],
  },
  {
    title: '4. Placing Orders',
    list: [
      'Orders are placed by selecting garments, quantity, apartment, and a pickup time slot.',
      'The price shown at checkout is determined by the center head assigned to your apartment.',
      'A center head may accept, reject, or reschedule an order based on capacity.',
      'Prices for items already in an accepted order will not change after pickup.',
    ],
  },
  {
    title: '5. Payments',
    body: `Payments are processed securely through Razorpay. IronMan Services does not store your card, UPI, or bank account details. All prices displayed are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.`,
  },
  {
    title: '6. Cancellations & Refunds',
    list: [
      'Orders can be cancelled before pickup, subject to the reason being provided in the app.',
      'Once an order has been picked up, cancellation may not be possible — contact support for assistance.',
      'Refunds for cancelled or disputed orders, where applicable, are processed to the original payment method within a reasonable timeframe.',
    ],
  },
  {
    title: '7. Our Delivery Commitment',
    body: `We are committed to picking up and delivering your garments within the time slot you select at booking. Delivery agents are assigned by the center head handling your order, and estimated pickup/delivery times are provided in good faith. In the rare event of a delay due to weather, traffic, or operational factors, we will proactively notify you via the app or WhatsApp with a revised time. Repeated or unexplained delivery failures may be raised as a complaint for review and resolution.`,
  },
  {
    title: '8. Damaged, Burnt, or Lost Items',
    body: `We take reasonable care and follow standard fabric-safe ironing and handling practices. That said, ironing inherently involves heat and pressure, and certain fabrics may be prone to scorching, shrinkage, or colour change due to their material, age, or pre-existing condition — risks that can exist even with careful handling.`,
    list: [
      'We are not liable for damage caused by pre-existing wear, tears, or fabric defects that existed before pickup, or fabric weaknesses not disclosed by the customer.',
      'If a garment is proven to be burnt, scorched, or otherwise damaged due to our negligence while in our custody, our liability is limited to a maximum of five (5) times the service/ironing charge for that specific item, or its fair depreciated value, whichever is lower — consistent with standard practice in the garment-care industry.',
      'Claims for damaged or lost items must be reported through the app within 24 hours of delivery (or expected delivery), with photos where possible, so we can investigate.',
      'Nothing in this clause limits any right you may have under the Consumer Protection Act, 2019, that cannot be excluded by agreement.',
    ],
  },
  {
    title: '9. User Conduct',
    list: [
      'You agree not to misuse the platform, provide false information, or abuse support/delivery staff.',
      'Repeated cancellations, no-shows, or abusive behaviour may result in account suspension.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    body: `IronMan Services and Cherubim AI Infosoft Private Limited are not liable for indirect, incidental, or consequential damages arising from use of the service, beyond the value of the order in question.`,
  },
  {
    title: '11. Changes to These Terms',
    body: `We may update these Terms & Conditions from time to time. Continued use of the app after changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: '12. Contact Us',
    body: `For questions about these Terms, contact us at support@ironman.today or through the in-app support option.`,
  },
];

export default function TermsPage() {
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
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', margin: '0 0 6px' }}>Terms &amp; Conditions</h1>
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
