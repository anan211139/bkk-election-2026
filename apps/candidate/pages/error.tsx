import FallbackPage from '../components/fallbackPage';

export default function ErrorPage() {
  return (
    <FallbackPage
      code="500"
      title="เกิดข้อผิดพลาด"
      description="ระบบกำลังมีปัญหาชั่วคราว ลองกลับไปดูผลการเลือกตั้งหรือข้อมูลผู้สมัครก่อนได้"
    />
  );
}
