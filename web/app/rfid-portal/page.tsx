import Link from 'next/link';
import { Shield } from 'lucide-react';

const tile = (bg: string): React.CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 6, width: 260, height: 180, borderRadius: 24, background: bg, color: '#fff',
  textDecoration: 'none', fontSize: 32, fontWeight: 900, boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
});

export default function RfidPortalMenu() {
  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 28, padding: 20,
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f0eeff 50%, #f8f7ff 100%)',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={28} color="#fff" />
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 900, margin: 0, color: '#0f0f0f' }}>RFID Attendance Portal</h1>
      <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Choose what this scanner is used for.</p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/rfid-portal/check-in" style={tile('#16a34a')}>
          Check In
          <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>Entrance scanner</span>
        </Link>
        <Link href="/rfid-portal/check-out" style={tile('#2563eb')}>
          Check Out
          <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>Exit scanner</span>
        </Link>
      </div>
    </div>
  );
}
