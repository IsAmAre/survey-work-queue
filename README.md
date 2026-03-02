# ระบบค้นหาสถานะงาน

ระบบเว็บไซต์สำหรับค้นหาสถานะงานโดยใช้เลขที่คำขอและชื่อผู้ขอ พัฒนาด้วย Next.js 15, TypeScript, Tailwind CSS, shadcn/ui และ Supabase

## คุณสมบัติหลัก

- 🔍 **ค้นหาสถานะงาน** - ผู้ใช้สามารถค้นหาด้วยเลขที่คำขอและชื่อผู้ขอ
- 📊 **Dashboard สำหรับ Admin** - จัดการข้อมูลและดูสถิติการใช้งาน
- 📁 **อัพโหลด Excel/CSV** - นำเข้าข้อมูลจากไฟล์ Excel หรือ CSV
- 🔒 **ระบบรักษาความปลอดภัย** - ป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
- 📱 **Responsive Design** - รองรับทุกขนาดหน้าจอ

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Form Handling**: React Hook Form, Zod
- **Excel Parsing**: xlsx library
- **Icons**: Lucide React

## การติดตั้งและการใช้งาน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

1. สร้างโปรเจคใหม่ใน [Supabase](https://supabase.com)
2. ไปที่ SQL Editor และรัน script จากไฟล์ `supabase-schema.sql`
3. คัดลอก URL และ API Keys

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` และกรอกข้อมูล:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 4. รันโปรเจค

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── (public)/          # หน้าหลัก (ค้นหา)
│   ├── admin/             # หน้า Admin Dashboard
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui Components
│   ├── search/            # Components สำหรับค้นหา
│   └── admin/             # Components สำหรับ Admin
├── lib/
│   ├── supabase/          # Supabase Configuration
│   ├── validations.ts     # Zod Schemas
│   └── excel-parser.ts    # Excel Parsing Logic
└── types/
    └── survey.ts          # TypeScript Types
```

## การใช้งาน

### สำหรับผู้ใช้ทั่วไป

1. เข้าหน้าเว็บไซต์หลัก
2. กรอกเลขที่คำขอและชื่อผู้ขอ (ต้องกรอกทั้ง 2 ช่อง)
3. กดปุ่มค้นหา
4. ระบบจะแสดงข้อมูลสถานะงาน

### สำหรับ Admin

1. เข้า `/admin` (ต้อง Login ก่อน)
2. ดู Dashboard และสถิติการใช้งาน
3. อัพโหลดไฟล์ Excel/CSV ที่ `/admin/upload`

## รูปแบบไฟล์ Excel/CSV

ไฟล์ต้องมีคอลัมน์ตามลำดับนี้:
1. ลำดับที่
2. เลขที่ คำขอ (ร.ว.12)
3. ชื่อผู้ขอ
4. จำนวนวันที่ค้าง
5. ชื่อช่างรังวัด
6. ประเภทงาน
7. วันที่นัดรังวัด
8. สถานะงาน

## ข้อมูลตัวอย่างสำหรับทดสอบ

- `DEMO-001/2568` + `นายสมชาย  ใจดี`
- `DEMO-002/2568` + `นางสาวสุดา  รักงาน`
- `DEMO-003/2568` + `นายวิชัย  ตัวอย่าง`
- `DEMO-004/2568` + `นางมาลี  ทดสอบ`

## ฟีเจอร์รักษาความปลอดภัย

- ✅ Input validation ด้วย Zod
- ✅ Row Level Security (RLS) ใน Supabase  
- ✅ ต้องกรอกทั้งเลขที่คำขอและชื่อผู้ขอ
- ✅ Log การค้นหาเพื่อตรวจสอบ
- ✅ ป้องกัน SQL injection
- ⏳ Rate limiting (กำลังพัฒนา)
- ⏳ CAPTCHA (กำลังพัฒนา)

## การ Deploy

### Vercel (แนะนำ)

1. Push code ขึ้น GitHub
2. เชื่อมต่อ repository กับ Vercel
3. ตั้งค่า Environment Variables ใน Vercel
4. Deploy

### การตั้งค่า Environment Variables ใน Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

## การพัฒนาต่อ

- [ ] เพิ่ม Rate limiting
- [ ] เพิ่ม CAPTCHA
- [ ] หน้าจัดการข้อมูล (CRUD)
- [ ] ระบบแจ้งเตือน
- [ ] Export ข้อมูลเป็น Excel
- [ ] Dark mode
- [ ] API Documentation

## License

MIT License
