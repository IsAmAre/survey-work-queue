# คู่มือการติดตั้งระบบค้นหาสถานะงานรังวัด

## ✅ สิ่งที่พร้อมใช้งานแล้ว

### 🎯 ฟีเจอร์หลัก
- ✅ หน้าค้นหาสำหรับผู้ใช้ทั่วไป (Responsive Design)
- ✅ Dashboard สำหรับ Admin 
- ✅ อัพโหลดไฟล์ Excel/CSV ด้วย Drag & Drop
- ✅ Validation ด้วย Zod และ TypeScript
- ✅ UI/UX สวยงามด้วย shadcn/ui และ Tailwind CSS

### 🛡️ ระบบรักษาความปลอดภัย
- ✅ Input validation
- ✅ ต้องกรอกทั้งเลขที่คำขอและชื่อผู้ขอ
- ✅ Log การค้นหาเพื่อตรวจสอบ
- ✅ SQL injection protection

## 📋 ขั้นตอนการติดตั้ง

### 1. ตั้งค่า Supabase Database

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. สร้าง New Project
3. ไปที่ SQL Editor
4. รัน script จากไฟล์ `supabase-schema.sql`
5. คัดลอก URL และ API Keys จาก Settings > API

### 2. ตั้งค่า Environment Variables

ไฟล์ `.env.local` ได้ถูกสร้างไว้แล้ว โปรดอัพเดทค่าจริง:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 3. รันโปรเจค

```bash
# ติดตั้ง dependencies (ถ้ายังไม่ได้ทำ)
npm install

# รันโปรเจค
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 🔧 การทดสอบ

### ทดสอบหน้าหลัก
1. เข้า `http://localhost:3000`
2. ลองค้นหาด้วยข้อมูลจาก CSV (เช่น `253/2567` และ `นางพีรยา สมฤทธิ์`)

### ทดสอบ Admin Dashboard
1. เข้า `http://localhost:3000/admin` (จะ redirect ไป login page)
2. ตั้งค่า Authentication ใน Supabase ก่อน
3. ทดสอบการอัพโหลดไฟล์

## 📊 ข้อมูลตัวอย่าง

ระบบได้เตรียมข้อมูลตัวอย่าง 5 รายการจากไฟล์ CSV ไว้ในฐานข้อมูลแล้ว:

- `253/2567` - นางพีรยา สมฤทธิ์
- `251/2567` - นายบุญเลื่อน ถาหมี และผู้ถือกรรมสิทธิ์รวม
- `254/2567` - นางวรณ์ ประสพสงค์
- และอื่นๆ

## 🚀 การ Deploy

### Vercel (แนะนำ)

1. Push code ไป GitHub
2. เชื่อมต่อกับ Vercel
3. ตั้งค่า Environment Variables ใน Vercel Dashboard
4. Deploy

## 📝 สิ่งที่ยังต้องพัฒนาต่อ

- [ ] Rate limiting API
- [ ] CAPTCHA system
- [ ] Admin authentication page
- [ ] การจัดการข้อมูล (Edit/Delete)
- [ ] Export ข้อมูลเป็น Excel
- [ ] Email notifications
- [ ] Advanced search filters

## 🛠️ โครงสร้างไฟล์

```
src/
├── app/
│   ├── page.tsx              # หน้าหลัก (ค้นหา)
│   ├── admin/
│   │   ├── page.tsx          # Dashboard
│   │   ├── layout.tsx        # Admin Layout
│   │   └── upload/page.tsx   # Upload Excel
│   └── api/
│       ├── search/route.ts   # API ค้นหา
│       └── upload/route.ts   # API อัพโหลด
├── components/
│   ├── ui/                   # shadcn/ui Components
│   └── search/
│       └── SearchForm.tsx    # Form ค้นหา
├── lib/
│   ├── supabase/            # Supabase Config
│   ├── validations.ts       # Zod Schemas
│   └── excel-parser.ts      # Excel Parser
└── types/
    └── survey.ts            # TypeScript Types
```

## 💡 Tips

1. **ทดสอบการค้นหา**: ใช้ข้อมูลจาก `example-db.csv` ในการทดสอบ
2. **Debug**: ดู Console และ Network Tab ในเบราว์เซอร์
3. **Database**: ตรวจสอบข้อมูลใน Supabase Table Editor
4. **Logs**: ดู logs การค้นหาใน `search_logs` table

## 🆘 Troubleshooting

### Build Error
```bash
npm run build
```

### Missing Environment Variables
ตรวจสอบไฟล์ `.env.local` และค่าใน Supabase

### Database Connection Error
ตรวจสอบ Supabase URL และ API Keys

---

**พร้อมใช้งานแล้ว! 🎉**

ระบบได้ถูกสร้างขึ้นด้วย:
- Next.js 15 + TypeScript
- Tailwind CSS + shadcn/ui  
- Supabase (PostgreSQL)
- React Hook Form + Zod