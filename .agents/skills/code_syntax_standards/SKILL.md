---
name: Full-Stack Code Quality & Syntax Standards
description: Strict guidelines for coding syntax, file structures, and code quality in React, Tailwind, Fastify, and Drizzle ORM.
---

# Full-Stack Code Quality & Syntax Standards

เพื่อให้โค้ด (Source Code) ของโปรเจกต์มีความเป็นมาตรฐาน สะอาด อ่านง่าย และลดข้อผิดพลาด (Bugs) ในระยะยาว กรุณาปฏิบัติตาม Syntax Standards ดังต่อไปนี้อย่างเคร่งครัดในทุกๆ การเขียนโค้ด

## 1. Frontend (React, Vite, Tailwind CSS)

### 1.1 การจัดการ Tailwind Classes
- **ห้าม** ต่อ String คลาสของ Tailwind แบบตรงๆ (เช่น `` className={`flex ${isActive ? 'bg-red' : ''}`} ``) 
- **บังคับใช้** `cn()` utility (จาก `clsx` + `tailwind-merge`) เพื่อป้องกันปัญหา Class Conflict เสมอ
  - ✅ **Correct:** `className={cn("flex items-center", isActive && "bg-red-500")}`

### 1.2 Naming Conventions (การตั้งชื่อ)
- **React Components:** ใช้ `PascalCase` เสมอ (เช่น `UserProfile.tsx`, `PackageDialog.tsx`)
- **Non-Component Files (Hooks, Utils):** ใช้ `camelCase` หรือ `kebab-case` (เช่น `useAuth.ts`, `fetch-utils.ts`)
- **Variables & Functions:** ใช้ `camelCase` เสมอ

### 1.3 UI Standards (Form & Dialog)
- Dialog ต้องมีโครงสร้างที่ตอบสนองบนมือถือ (Mobile-first)
- **Prefix Icons:** ไอคอนในฟอร์มต้องฝังเป็น Prefix ด้านซ้ายของ Input เสมอ (ใช้ `relative` wrapper และ `absolute left-3`)
- **Emphasis Wrappers:** ฟิลด์ที่สำคัญมากๆ (เช่น เลือก Tenant) ต้องมีกรอบไฮไลท์ `bg-muted/30 p-3 rounded-lg border border-border/50` 
- ปุ่ม Actions ด้านล่างของ Form ต้องอยู่ใน `flex flex-col-reverse sm:flex-row` และมีความสูง `h-[44px]`

### 1.4 Large Data Dropdowns (การจัดการ Dropdown ที่มีข้อมูลมหาศาล)
ในกรณีที่ข้อมูลใน Dropdown หรือ Filter Bar มีปริมาณมาก (เช่น รายชื่อ Tenants, Users, Profiles เป็นพันรายการ) การใช้ `<select>` ธรรมดาจะทำให้ผู้ใช้เลื่อนหาลำบาก (Scroll Hell) และทำให้เบราว์เซอร์กระตุก ให้ปฏิบัติตามแนวทางนี้เสมอ:
1. **ใช้ Searchable Combobox:** เปลี่ยนจากการใช้ `<select>` ไปใช้ **Combobox** (เช่น `shadcn/ui` Combobox ที่สร้างจาก `Command` หรือ `cmdk`) เพื่อให้ผู้ใช้สามารถ "พิมพ์ค้นหา (Type to Search)" ได้
2. **Server-Side Search & Pagination:** หากข้อมูลมีมากกว่า 500-1000 รายการ ห้ามโหลดข้อมูลทั้งหมดมาไว้ที่ Frontend รวดเดียว ให้ทำ API รองรับการค้นหา (เช่น `?search=...&limit=20`) แล้วให้ Combobox ยิง API แบบ Debounce เมื่อพิมพ์
3. **Virtualization (ทางเลือก):** หากจำเป็นต้องแสดงผลข้อมูลนับร้อยรายการในหน้าต่าง Dropdown ให้ใช้ไลบรารี Virtual List (เช่น `@tanstack/react-virtual`) เพื่อเรนเดอร์เฉพาะแถวที่มองเห็นเท่านั้น

### 1.5 Page Layout & Table UX (ความลื่นไหลของหน้าจอ)
เพื่อรักษาความรู้สึกพรีเมียม (Premium Feel) ของระบบ ห้ามให้หน้าจอกระตุกหรือสั่นเวลาเปลี่ยนหน้าเด็ดขาด:
1. **Fixed App Shell & Inner Scroll:** โครงสร้างหลักของแอป (Sidebar + Header) ต้องถูกล็อกความสูงไว้ที่ `h-screen` เสมอ และให้เฉพาะกรอบเนื้อหาตรงกลาง (Main Content) มีคลาส `overflow-y-auto` วิธีนี้จะช่วยไม่ให้ Scrollbar ด้านขวาสั่นหรือโผล่เข้าๆ ออกๆ เวลาเปลี่ยนไปเพจที่สั้นกว่า
2. **Table Pagination Anchoring:** ทุกหน้าที่มีตารางและ Pagination ต้องป้องกันไม่ให้ Pagination "เด้งขึ้น" เวลาหน้าสุดท้ายมีข้อมูลไม่เต็มโควต้า (เช่น มี 1 แถวจาก 10 แถว) โดยให้ห่อหุ้มตารางและ Pagination ไว้ใน `flex flex-col min-h-[500px]` (หรือ `h-full`) และใส่คลาส `mt-auto` ไว้ที่ตัว Pagination เพื่อถีบมันให้อยู่ติดขอบล่างเสมอ

---

## 2. Backend (Fastify, Node.js)

### 2.1 โครงสร้างไฟล์ API (Architecture Layer)
แบ่งการทำงานออกเป็น 3 เลเยอร์เสมอ:
1. **Routes (`/routes`):** ทำหน้าที่กำหนด Endpoint, Method, และผูกกับ Zod Schema สำหรับ Validation เท่านั้น
2. **Controllers (`/controllers`):** ทำหน้าที่รับ Request/Reply จัดการ HTTP Logic เล็กน้อย และเรียกใช้ Services
3. **Services (`/services`):** ทำหน้าที่จัดการ Business Logic ล้วนๆ (เช่น Query DB) ห้ามเอา HTTP Reply มาปนใน Service

### 2.2 Zod Validation (การตรวจสอบข้อมูล)
- ทุก API Endpoint ที่มีการรับ Body, Query หรือ Params **ต้องถูก Validate ด้วย Zod Schema ก่อนเสมอ** เพื่อป้องกันข้อมูลขยะเข้าสู่ฐานข้อมูล
- ผูก Zod Schema เข้ากับ Fastify Route Config (`schema: { body: myZodSchema }`) เพื่อให้ Fastify ตรวจสอบให้โดยอัตโนมัติ

### 2.3 HTTP Error Handling
- การส่ง Error กลับไปยัง Frontend ต้องเป็นรูปแบบ JSON ที่เป็นมาตรฐานเดียวกัน เช่น:
  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Invalid tenant ID format."
  }
  ```
- ใช้ Fastify's `reply.status().send()` อย่างชัดเจน

---

## 3. Database (Drizzle ORM)

### 3.1 Data Manipulation Syntax
- เมื่อใช้งาน Drizzle ORM ห้ามใช้ Raw SQL string ในกรณีที่ Drizzle มี Query Builder ให้ใช้
- การเปรียบเทียบและการใช้ Logical Operators ต้องดึงจาก `drizzle-orm` เสมอ เช่น `eq()`, `and()`, `or()`, `inArray()`
  - ✅ **Correct:** `where: and(eq(users.tenantId, tenantId), eq(users.status, 'active'))`

### 3.2 Date & Timestamp Handling
- การเซ็ตเวลาปัจจุบัน ให้ใช้ `new Date()` ในฝั่ง JavaScript ก่อนเซฟ หรือใช้ค่า Default (`defaultNow()`) ที่ระดับ Schema 
- อย่าลืมเผื่อเรื่อง Timezone หากมีการดึงข้อมูลระดับวัน/เวลา (เช่น ดึง Log มาดู)

### 3.3 TypeScript Strictness
- ห้ามใช้ `any` หรือ `@ts-ignore` ในโค้ด Drizzle หรือ Controller โดยเด็ดขาด 
- ใช้ Type Inference ที่ได้จาก Drizzle (เช่น `typeof table.$inferSelect`) เพื่อสร้าง Type ของ Object เสมอ

---

## 4. SaaS Best Practices & Security

### 4.1 Session & JWT Security
- **ห้าม** เก็บ JWT Token (โดยเฉพาะ Refresh Token) ไว้ใน `localStorage` ของ Browser เด็ดขาด เพื่อป้องกันการถูกขโมยจากช่องโหว่ XSS (Cross-Site Scripting)
- การล็อกอินจากฝั่ง Backend ต้องเซ็ต Token ลงใน **HttpOnly, Secure Cookie** เสมอ

### 4.2 Type-safe Environment Variables
- ไฟล์ `.env` ของโปรเจกต์มักจะซับซ้อน **บังคับใช้ Zod** ในการครอบ (Validate) ตัวแปร ENV ทั้งในฝั่ง Backend และ Frontend
- หากรันแอปพลิเคชัน (`npm run dev`) แล้วตัวแปร ENV ขาดหายไป ระบบต้อง Crash แจ้งเตือนทันที ห้ามปล่อยให้แอปพลิเคชันทำงานแบบมีช่องโหว่

### 4.3 Error Boundaries & Global Error Handler
- **Frontend (React):** บังคับใช้ `<ErrorBoundary>` หุ้ม Component ระดับสูง (เช่น หน้า Page) เพื่อป้องกันไม่ให้แอปแสดงผลหน้าขาว (White Screen of Death) เวลาเกิดบั๊กที่ไม่ได้คาดคิด
- **Backend (Fastify):** บังคับใช้ `fastify.setErrorHandler()` แบบ Global เพื่อดักจับ Error (Unhandled Exceptions) ทั้งระบบ และทำการแปลงเป็น HTTP 500 JSON รูปแบบมาตรฐานแทนการคาย Stack Trace ออกไปให้ Client เห็น
