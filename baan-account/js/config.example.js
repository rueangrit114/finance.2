// ============================================================
//  ตั้งค่าการเชื่อมต่อ Supabase
//  เอาค่าสองอย่างนี้จาก Supabase > Project Settings > API
//   - Project URL
//   - anon public key  (คีย์ anon เท่านั้น! ห้ามใช้ service_role)
//  ถ้ายังไม่ได้ใส่ แอพจะทำงานแบบ "โหมดทดลอง" เก็บข้อมูลในเครื่องนั้นๆ ก่อน
// ============================================================
window.APP_CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
};
