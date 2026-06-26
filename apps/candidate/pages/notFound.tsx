import FallbackPage from '../components/fallbackPage';

export default function NotFoundPage() {
  return (
    <FallbackPage
      code="404"
      title="ไม่พบหน้านี้"
      description="ลิงก์นี้อาจถูกย้ายหรือไม่มีอยู่แล้ว เลือกไปหน้าผลการเลือกตั้งหรือข้อมูลผู้สมัครต่อได้เลย"
    />
  );
}
