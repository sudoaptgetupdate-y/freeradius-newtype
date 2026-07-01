# 👥 สรุปผลงาน Phase 16: User Groups, CSV Import & RADIUS Stabilization (เสร็จสมบูรณ์)

เฟสนี้เป็นการขยายขีดความสามารถการจัดการบัญชีผู้ใช้งาน โดยการเพิ่มระบบ **User Groups (Organizations)** สำหรับจัดการผู้ใช้เป็นกลุ่มก้อน การทำ **CSV Bulk Import** เพื่อรองรับการนำเข้าผู้ใช้ทีละมากๆ การปรับปรุงความยืดหยุ่นของ **Expiration Date** และการแยกเก็บข้อมูลส่วนตัวผู้ใช้ไปไว้ในตาราง **`userinfo`** เพื่อป้องกันปัญหาระบบล็อกอินล่ม (FreeRADIUS Auth Crash)

---

## ✨ ฟีเจอร์ที่ทำสำเร็จแล้ว

### 1. ระบบกลุ่มและหน่วยงาน (User Groups / Organizations)
- **Drizzle Schema & Migration:** เพิ่มตาราง `organizations` และ `user_organizations` เพื่อผูกบัญชีผู้ใช้เข้ากับกลุ่ม
- **Profile Inheritance:** เมื่อสร้างผู้ใช้งานภายใต้กลุ่ม บัญชีผู้ใช้นั้นจะสืบทอดแพ็กเกจอินเทอร์เน็ต (Profile) ตามค่าเริ่มต้นที่ตั้งค่าไว้ระดับกลุ่ม (`defaultProfile`) โดยอัตโนมัติ ทำให้ผู้ใช้ไม่ต้องระบุ Profile เองในระดับบุคคล
- **Bulk Actions (suspend/delete):** แอดมินสามารถกดสั่งระงับการใช้งาน (Suspend) หรือลบ (Delete) ผู้ใช้งานทุกคนในกลุ่มพร้อมกันได้ในการกดครั้งเดียว พร้อมตัดเซสชันของผู้ใช้ที่ยังออนไลน์อยู่ในกลุ่มนั้นผ่านสัญญาณ RADIUS CoA ทันที
- **Groups Management UI:** หน้าจอแดชบอร์ดฝั่งแอดมินสำหรับการจัดการกลุ่มและดูรายชื่อสมาชิกภายในกลุ่มอย่างมีระเบียบ

### 2. นำเข้าข้อมูลผู้ใช้ผ่านไฟล์ CSV (CSV Bulk Import)
- **Smart Mapping:** รองรับการอัปโหลดไฟล์ข้อมูลผู้ใช้ด้วยไฟล์ CSV พร้อมระบุเครื่องหมายดอกจัน `*` สำหรับฟิลด์บังคับ เช่น `Username*` และ `Password*` ส่วนข้อมูลอื่นๆ เช่น วันหมดอายุ อีเมล โทรศัพท์ เป็นแบบเว้นว่างได้ (Optional)
- **High-Performance Chunking:** ยิงนำข้อมูลเข้าฐานข้อมูลระดับหลังบ้านแบบแบ่งแพ็คเกจย่อย (500 รายการต่อรอบ) ด้วย SQL Transaction ช่วยลด Overhead บนฐานข้อมูลและป้องกันปัญหา Server Timeout
- **Frontend Validation:** สแกนตรวจสอบความถูกต้องของข้อมูล (เช็คค่าว่างในฟิลด์สำคัญ หรือชื่อผู้ใช้ซ้ำซ้อน) ตั้งแต่ฝั่งเบราว์เซอร์ รวมถึงมีการตรวจสอบการมีอยู่ของกลุ่ม (**Group Name**) ในฐานข้อมูล หากไม่พบกลุ่ม ระบบจะแจ้งเตือนสถานะเป็นสีแดง `(Not Found)` บนตาราง Preview และปฏิเสธการนำเข้าจนกว่าจะสร้างกลุ่มนั้นเสร็จสิ้น ช่วยป้องกันความสับสนทางโครงสร้างข้อมูลหน่วยงาน

### 3. ปรับแต่ง Expiration Date ("No Expire" Logic)
- **No Expire Fallback:** ช่อง Expiration Date ในหน้าจอสร้าง/แก้ไขผู้ใช้ จะตั้งค่าเริ่มต้นแสดงผลว่า "No Expire" (ไม่มีวันหมดอายุ) 
- **Flexible Expiration:** หากเว้นว่างไว้ ระบบจะไม่บันทึก Attribute `Expiration` ลงในตาราง `radcheck` ซึ่งตามข้อตกลงของ FreeRADIUS บัญชีนั้นจะใช้งานได้ตลอดไปโดยไม่มีวันหมดอายุ แต่ถ้าเลือกวันที่ระบบจะสลับเป็นตัวเลือกปฏิทินเพื่อบันทึกวันเวลาหมดอายุที่ถูกต้องให้ทันที

### 4. ระบบฐานข้อมูลเพื่อความเสถียร (RADIUS Auth Stabilization)
- **ปัญหาเดิม:** การเก็บข้อมูล เช่น ชื่อ-นามสกุล, เบอร์โทร, รหัสสมาชิก ลงในตาราง `radreply` ส่งผลให้ FreeRADIUS เกิดการ Crash ขัดข้องขณะตรวจสอบสิทธิ์ (`Unknown name "User-First-Name"`) เนื่องจากตัวแปรเหล่านี้ไม่มีอยู่ใน RADIUS Dictionary
- **การแก้ไข:** 
  1. สร้างตารางใหม่ **`userinfo`** เพื่อแยกจัดเก็บข้อมูลส่วนตัวเหล่านี้ออกจากกระบวนการยืนยันสิทธิ์ของ RADIUS โดยเด็ดขาด
  2. โยกย้ายและล้างข้อมูลขยะเดิมทั้งหมด (Clean & Migrate) ที่สะสมอยู่ในตาราง `radreply` ย้ายเข้าตาราง `userinfo` ให้แก่ผู้ใช้งานเก่าจำนวน **24 คน** อย่างปลอดภัย ไร้รอยต่อ และไม่รบกวนการใช้งานจริง
  3. แก้ไขฝั่ง API (`users.controller.ts`, `users.bulk.controller.ts`, `portal.controller.ts`) ให้บันทึกและอ่านข้อมูลจากตาราง `userinfo` แทนทั้งหมด

---

## 🛠️ โครงสร้างไฟล์โค้ดของโมดูลนี้
- **[userinfo.ts](file:///d:/1.Development/dev-frd/backend/src/schema/userinfo.ts):** โครงสร้างตาราง `userinfo`
- **[users.controller.ts](file:///d:/1.Development/dev-frd/backend/src/controllers/users.controller.ts):** ปรับปรุงให้บันทึกและค้นหาข้อมูลผู้ใช้ผ่าน `userinfo` แทน `radreply`
- **[users.bulk.controller.ts](file:///d:/1.Development/dev-frd/backend/src/controllers/users.bulk.controller.ts):** อัปเดตระบบ Bulk Import ให้เซฟลงตาราง `userinfo`
- **[portal.controller.ts](file:///d:/1.Development/dev-frd/backend/src/controllers/portal.controller.ts):** อัปเดตการสมัครใช้ Captive Portal ให้เซฟลงตาราง `userinfo`
- **[cleanup_radreply.ts](file:///d:/1.Development/dev-frd/backend/scripts/cleanup_radreply.ts):** สคริปต์โยกย้ายข้อมูลส่วนตัวของผู้ใช้จาก `radreply` ไปที่ `userinfo` พร้อมลบค่าขยะทิ้ง

---

## 📈 การตรวจสอบประสิทธิภาพ (Validation)
- โครงสร้างฐานข้อมูลผ่านการ Push Schema เรียบร้อย ไร้ปัญหา Data Mismatch
- ตรวจสอบผ่านการรันคอมไพล์ TypeScript ทั้ง Backend (`npm run build`) สำเร็จ 100% ไม่มีข้อผิดพลาด
- บัญชีผู้ใช้ทั้งเก่าและใหม่ ไม่พบปัญหา Authentication ล้มเหลวจาก Custom Attribute บน MikroTik/Gateway อีกต่อไป
