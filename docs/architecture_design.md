# Software Architecture Design Document (ADD)
**Project:** Next-Gen FreeRADIUS & Network Management System (SaaS Edition)

> [!NOTE]
> เอกสารฉบับนี้อธิบายถึงสถาปัตยกรรมเชิงลึก (Technical Architecture) โครงสร้างพื้นฐาน และวิธีการทำงานเบื้องหลังของระบบ เพื่อใช้เป็นแนวทาง (Guideline) สำหรับทีมพัฒนาระบบ (Developers, Data Engineer & DevOps)

---

## 1. System Environment & Tech Stack (สภาพแวดล้อมและเทคโนโลยี)

### 1.1 Server Environment
- **Production Server (Ubuntu 24.04):** เซิร์ฟเวอร์หลักที่รัน Core Services (FreeRADIUS, PostgreSQL, Loki, Vector, Redis)
- **Local Development:** สภาพแวดล้อมจำลองสำหรับนักพัฒนาเพื่อเขียน Frontend/Backend และเชื่อมต่อกับ Database บนเซิร์ฟเวอร์หลัก

### 1.2 Technology Stack
- **Frontend:** Vite v6, React v19, TypeScript v5, Tailwind CSS v4, shadcn/ui
- **Backend API:** Node.js v22 LTS, Fastify v5 (ประสิทธิภาพสูง Overhead ต่ำ), Drizzle ORM (Type-safe SQL)
- **Core Authentication:** FreeRADIUS v3.0, PostgreSQL v17 (รองรับ Table Partitioning จัดการข้อมูลมหาศาล)
- **Logging & Queuing:** Vector v0 (Syslog Receiver), Grafana Loki v3 (Log Storage), Redis v7 (Caching & Background Jobs)

---

## 2. Multi-Tenancy Architecture (สถาปัตยกรรมแบบแยกผู้เช่า)

### 2.1 Database Design (การออกแบบฐานข้อมูล)
- ทุกตารางที่เป็นข้อมูลย่อยของลูกค้าจะต้องมี `tenant_id`
- **Composite Unique Keys:** แทนที่จะให้ `username` ไม่ซ้ำกันทั้งระบบ (Unique) จะเปลี่ยนเป็นใช้ `(tenant_id, username)` คู่กัน เพื่อให้แต่ละ Tenant สามารถตั้งชื่อ User ซ้ำกับ Site อื่นได้

### 2.2 FreeRADIUS SQL Configuration
- ปรับแก้ไฟล์ `queries.conf` ของ FreeRADIUS โดยฝังเงื่อนไข `tenant_id` เข้าไปในคำสั่ง SQL ดั้งเดิม
- ตัวอย่างเช่น: `SELECT ... WHERE username = '%{SQL-User-Name}' AND tenant_id = '...'`
- ป้องกันการนำบัญชีของ Site A ไปใช้ล็อกอินข้าม Site ไปยัง Site B 

---

## 3. Logging Architecture (สถาปัตยกรรมการจัดการ Log)
ระบบจะแบ่ง Log ออกเป็น 2 ประเภทหลักคือ **Network Traffic Logs** (จาก Firewall/Router) และ **System Audit Logs** (ประวัติการใช้งานของแอดมิน)

### 3.1 Network Traffic Log Ingestion Flow (Log พ.ร.บ.)
`Mikrotik/Fortigate (Port 514)` ➡️ `Vector (Receiver & Parser)` ➡️ `Grafana Loki (Storage)` ➡️ `Fastify API (Query)` ➡️ `Frontend`

### 3.2 System Audit Log Flow (ประวัติการใช้งานระบบ)
`Admin Action (Frontend)` ➡️ `Fastify API` ➡️ *(สร้าง Audit Event)* ➡️ `Grafana Loki (ผ่าน HTTP Push API โดยตรง)`

### 3.3 Tenant Log Isolation (เทคนิคการแยกข้อมูลลูกค้า)
การแยกข้อมูลของ Log ทั้ง 2 ประเภทบน Loki สามารถทำได้ 2 รูปแบบ:

1. **Native Multi-Tenancy (ความปลอดภัยสูงสุด - แนะนำ):** 
   - เปิดโหมด `auth_enabled: true` ในการตั้งค่า Loki
   - เมื่อ **Vector** รับ Log จะเช็กแหล่งที่มา แล้วทำการสร้าง HTTP Header `X-Scope-OrgID: <tenant_id>` แปะเข้าไปก่อนยิงเข้า Loki
   - ฝั่ง **Fastify Backend** เมื่อทำการค้นหา LogQL ก็แค่ดึง `<tenant_id>` ของแอดมินที่กำลังล็อกอินอยู่ มาแนบใส่ Header ส่งไปหา Loki
   - *ผลลัพธ์:* Loki จะแบ่งพาร์ทิชันที่เก็บข้อมูลแยกจากกัน 100% ไม่มีทางที่ข้อมูลจะรั่วไหลข้าม Tenant
   
2. **Label-Based Isolation (ติดตั้งง่าย ยืดหยุ่นสูง):**
   - ให้ Vector เพิ่ม Label `{tenant_id="..."}` ลงในข้อมูลทุกบรรทัดก่อนส่งเข้า Loki
   - ฝั่ง Backend ค้นหาข้อมูลผ่าน LogQL โดยบังคับเติม prefix เสมอ เช่น `{tenant_id="Site_A"} |= "192.168.1.1"`

---

## 4. Mikrotik & Multi-Vendor Integration (การเชื่อมต่อและควบคุม Router)

### 4.1 Multi-Vendor Support (Mikrotik & Fortigate)
- ระบบอ้างอิงจากโครงสร้าง **Radius Dictionary** ซึ่งมีความยืดหยุ่นสูง
- รองรับการสร้าง Attribute เฉพาะของแต่ละยี่ห้อแบบไดนามิกผ่านหน้าเว็บ (เช่น `Mikrotik-Rate-Limit` หรือ `Fortinet-Group-Name`) ทำให้สามารถบริหารจัดการ Router / Firewall ยี่ห้อใดก็ได้ที่รองรับมาตรฐาน Radius

### 4.2 รูปแบบ REST API (สำหรับ Mikrotik RouterOS v7+)
- สถาปัตยกรรมระบบนี้ แนะนำให้เชื่อมต่อ Mikrotik ผ่าน **REST API บนโปรโตคอล HTTPS (Port 443)** เพื่อความปลอดภัยและเป็น Stateless
- **จุดประสงค์ (Auxiliary Features):** API จะไม่ได้ถูกใช้จัดการ User/Profile (เพราะเป็นหน้าที่ของ FreeRADIUS) แต่จะถูกใช้จัดการ "ส่วนเสริม" บน Router เท่านั้น ได้แก่:
  1. **IP Bindings / Walled Garden:** จัดการอนุญาตอุปกรณ์หรือเว็บไซต์ที่เข้าได้โดยไม่ต้องล็อกอิน
  2. **NAS Monitoring & Provisioning:** ดึงสถานะการทำงานของ Router (CPU, Uptime) และการตั้งค่า Hotspot อัตโนมัติลดภาระแอดมิน

---

## 5. Security & Password Management (ความปลอดภัยและการเข้ารหัส)

### 5.1 Password Hashing in Database (SSHA-Password)
- **ห้ามจัดเก็บรหัสผ่านเป็น Plaintext (`Cleartext-Password`) อย่างเด็ดขาด** 
- ให้ Backend (Fastify) เข้ารหัสผ่านของลูกค้าด้วยฟังก์ชัน Hash แบบมี Salt (เช่น **SSHA** หรือ **Bcrypt**) แล้วจัดเก็บลง PostgreSQL ในคอลัมน์ Attribute เป็น `SSHA-Password` หรือ `Crypt-Password`
- ตัวโมดูล `rlm_pap` ของ FreeRADIUS จะทำหน้าที่คำนวณและเปรียบเทียบค่า Hash เหล่านี้ให้โดยอัตโนมัติ

### 5.2 Network & Authentication Security (การรักษาความปลอดภัยของเครือข่าย)
- **Client to Captive Portal (HTTPS):** หน้าเว็บสำหรับล็อกอิน (Captive Portal) จะบังคับใช้ SSL/TLS (HTTPS) เพื่อป้องกันการดักจับข้อมูลรหัสผ่าน
  - *กลไก Multi-Tenant Portal:* Router จะทำการ Redirect ผู้ใช้มาที่หน้า Portal พร้อมแนบ Query Parameter เช่น `?nas_mac=...&client_mac=...` ทำให้ Frontend (React) สามารถรู้ได้ว่าต้องดึง Theme ของลูกค้ารายใดมาแสดงผล
- **Captive Portal to NAS (PAP):** เมื่อหน้าเว็บใช้ HTTPS แล้ว ฝั่ง NAS จะต้องตั้งค่ารูปแบบการ Auth เป็น **PAP** เพื่อให้ FreeRADIUS สามารถนำรหัสผ่านที่ถูกเข้ารหัสด้วย `SSHA` หรือ `Bcrypt` ในฐานข้อมูลมาเปรียบเทียบได้
- **NAS to FreeRADIUS:** รองรับการเชื่อมต่อแบบ Standard RADIUS (UDP 1812/1813) และ RadSec (TCP 2083 / TLS)

### 5.3 User Session Management & Disconnect (การเตะผู้ใช้งาน)
- **RADIUS CoA (Change of Authorization / Packet of Disconnect):** ระบบใช้โปรโตคอลมาตรฐาน RADIUS (Port 3799) ในการส่งคำสั่งเตะผู้ใช้ออกจากระบบ 
- **ข้อดี:** ทำให้ระบบเป็น Multi-Vendor อย่างแท้จริง ไม่จำเป็นต้องพึ่งพา Mikrotik API ในการเตะผู้ใช้ ดังนั้น Router ยี่ห้อใดที่รองรับ CoA (เช่น Fortigate, Cisco, Mikrotik) ก็สามารถถูกสั่งเตะจาก Master Backend ได้ทันที

---

## 6. Integrations (การเชื่อมต่อระบบภายนอก)

### 6.1 Telegram Bot Architecture (Webhook)
- ระบบ Telegram Bot ของ Backend (Fastify) จะทำงานผ่านรูปแบบ **Webhook**
- เมื่อมี Event เกิดขึ้นใน Telegram ข้อมูลจะถูก Push มายัง API ของระบบโดยตรง ลด Overhead ที่เกิดจากการ Polling ตลอดเวลา และสามารถรองรับการสเกล (Scale) ใช้งานพร้อมกันหลายสิบ Tenant ได้อย่างมีประสิทธิภาพ

---

## 7. Frontend UI/UX & Data Validation Standards (มาตรฐานการพัฒนาส่วนแสดงผลและการตรวจสอบข้อมูล)

เพื่อความสม่ำเสมอของประสบการณ์ผู้ใช้งาน (UX) และป้องกันข้อผิดพลาดที่เกิดจากความซ้ำซ้อนของข้อมูล (Data Integrity) ทีมพัฒนาต้องยึดถือมาตรฐานดังต่อไปนี้:

### 7.1 Notification & Dialog Libraries (มาตรฐานการแจ้งเตือน)
- **Toast Notifications:** ห้ามใช้ `alert()` หรือข้อความแจ้งเตือนที่แทรกใน DOM แบบธรรมดา ให้ใช้ไลบรารี **`react-toastify`** ในทุกกรณีสำหรับการแจ้งเตือนสถานะสำเร็จ (Success) หรือล้มเหลว (Error) ทั่วไป
- **Confirmation Dialogs:** ห้ามใช้ `window.confirm()` แบบดั้งเดิมของเบราว์เซอร์ ให้ใช้ไลบรารี **`sweetalert2`** (`sweetalert2-react-content`) ในการสร้างกล่องโต้ตอบยืนยันการกระทำที่สำคัญทุกครั้ง (เช่น การลบข้อมูล หรือการระงับการใช้งาน)

### 7.2 Dialog & Form Design Standard (มาตรฐาน Tailwind-Admin UI)
เพื่อความสะอาดตา (Clean & Professional) และสอดคล้องกับธีม **Tailwind-Admin** แบบใหม่ การสร้าง Dialog และฟอร์มกรอกข้อมูลจะต้องยึดหลักการออกแบบดังนี้:

1. **Clean Dialog Headers:** 
   - งดการใช้ไอคอนขนาดใหญ่ในหัวเรื่อง (`DialogTitle`) เพื่อลดความรกของหน้าจอ ให้เน้นใช้ตัวอักษรหนา (เช่น `text-[20px] sm:text-[22px] font-bold`) แทน
   - พื้นหลัง Header ใช้สีสว่าง (หรือตามธีม) และมีเส้นคั่น `border-b` เบาๆ ด้านล่าง เพื่อแยกส่วนเนื้อหาออกจากส่วนหัวอย่างชัดเจน
2. **Form Elements & Prefix Icons (ไอคอนด้านใน Input):**
   - หัวข้อฟิลด์ (`Label`) ใช้แค่ตัวหนังสือเพียวๆ โดยไม่มีไอคอนผสม (เช่น `className="text-[14px] font-semibold text-foreground"`)
   - นำ Icon มาฝังไว้ที่ **ด้านซ้ายมือข้างในช่องกรอกข้อมูล (Prefix Icon)** แทน โดยใช้โครงสร้าง `<div className="relative">` + `<Icon className="absolute left-3 top-1/2 -translate-y-1/2" />` และตั้งค่า Padding ซ้ายให้กับ Input/Select (`className="pl-9 h-[44px] rounded-[8px]"`)
3. **Emphasis Wrappers (กล่องไฮไลท์):** 
   - ฟิลด์ที่มีความสำคัญสูง หรือมีผลกระทบกับข้อมูลด้านล่างอย่างมีนัยสำคัญ (เช่น การเลือก Tenant ที่เป็นเงื่อนไขแรก) ต้องถูกจับใส่กล่องไฮไลท์พื้นหลังแยกออกมาต่างหาก เพื่อดึงดูดสายตาให้ผู้ใช้ทำก่อน (ตัวอย่าง: `className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50"`)
4. **Action Buttons (ปุ่มกดด้านล่าง):** 
   - ปุ่ม Primary (Save/Update) ให้ใช้ความสูง `h-[44px]` ขอบโค้ง `rounded-[8px]` และเน้นความมีมิติด้วยแสงเงา (เช่น `bg-primary shadow-md shadow-primary/20 font-semibold`)
5. **Mobile Responsiveness (โครงสร้างยืดหยุ่นบนมือถือ):**
   - แบบฟอร์มและ Dialog ทั้งหมดต้องถูกออกแบบมาในลักษณะ Mobile-First
   - **Dialog Width & Padding:** ปรับโครงสร้างแบบ Responsive (`sm:max-w-[480px] px-5 sm:px-7`) และควบคุมความสูงด้วยการทำให้ Scroll แค่ภายในกล่องเนื้อหา (`flex-1 overflow-y-auto`)
   - **Grid System:** โครงสร้างข้อมูลขนานกัน ให้บีบซ้อนกันบนมือถือ (`grid-cols-1 sm:grid-cols-2 gap-4`)
   - **Touch Targets:** ปุ่มกดใน Footer ให้ขยายเต็มความกว้างจอ และเรียงปุ่มสำคัญไว้ด้านบนเมื่ออยู่บนจอมือถือ (`flex-col-reverse sm:flex-row sm:justify-end w-full sm:w-auto`)
   - **Tables:** ตารางที่มีข้อมูลหลายคอลัมน์ ต้องมี `overflow-x-auto` หุ้ม และกำหนด `min-w-[...]` ให้ตารางเลื่อนซ้ายขวาได้เสมอ

### 7.3 Data Integrity & Duplicate Checks (การตรวจสอบความถูกต้องของข้อมูล)
- **Sensitive Data & Primary Keys:** ในกรณีที่ข้อมูลมีความสำคัญ หรือเป็นคีย์หลักที่ห้ามซ้ำซ้อน (เช่น Username, Mac Address, IP Address, Tenant Name) **ต้องมีการตรวจสอบข้อมูลซ้ำ (Duplicate Check)** เสมอ
- การตรวจสอบนี้จะต้องทำทั้งในระดับ:
  1. **Backend (API & Database):** เช็กก่อนบันทึก และใช้ Constraint (เช่น Unique Index) ระดับฐานข้อมูลร่วมด้วย
  2. **Frontend:** ตรวจจับ Error Code จาก API และแสดงข้อความแจ้งเตือนผ่าน `react-toastify` ให้ผู้ใช้ทราบอย่างชัดเจนว่าข้อมูลมีการซ้ำซ้อนและไม่สามารถใช้ได้

### 7.4 Large Dataset Selection (การเลือกข้อมูลปริมาณมากใน Dropdown)
ในกรณีที่ฟอร์มหรือ Filter Bar จำเป็นต้องให้ผู้ใช้เลือกข้อมูลจากรายการที่มีจำนวนมหาศาล (เช่น รายชื่อสาขาหรือ Tenant นับพันแห่ง) การให้ผู้ใช้เลื่อน Scroll ลงมาเรื่อยๆ เป็นสิ่งที่ทำลาย User Experience (UX) ดังนั้นต้องใช้แนวทางดังนี้:
1. **Searchable Combobox:** ใช้ UI แบบ **Combobox (Autocomplete)** เพื่อให้ผู้ใช้พิมพ์ตัวอักษรเพื่อค้นหาสิ่งที่ต้องการได้ทันที (ใช้ `Command` ของ shadcn/ui) แทนการใช้ `Select` แบบธรรมดา
2. **Server-Side API Integration:** สำหรับชุดข้อมูลระดับพันหรือหมื่นแถว ห้าม Fetch ข้อมูลทั้งหมดมากองไว้ที่ Client-side เด็ดขาด Combobox จะต้องยิง API ค้นหาพร้อมกับ Debounce (เช่น รอ 300ms ค่อยยิง API สอดแทรก `?search=xxx&limit=20`) และรองรับระบบ Infinite Scroll (โหลดเพิ่มเมื่อเลื่อนลงสุดขอบ)
3. **Virtualization:** หากมีการส่งข้อมูลระดับ 500+ แถวมาแสดงผลใน Dropdown เมนูจริงๆ จะต้องใช้เทคนิค **Virtual List** (`@tanstack/react-virtual`) เพื่อเรนเดอร์เฉพาะไอเทมที่มองเห็นเท่านั้น ช่วยลดปัญหาเบราว์เซอร์กระตุก

### 7.5 Page Transitions & Layout Stability (ความเสถียรของหน้าจอเมื่อเปลี่ยนเพจ)
เพื่อป้องกันปัญหา Layout Shift หรือหน้าจอกระตุกเมื่อเปลี่ยนเพจ หรือเปลี่ยนหน้าข้อมูลในตาราง ระบบ Frontend ต้องออกแบบตามหลักการนี้:
1. **App Shell Stabilization:** ห้ามปล่อยให้ `<body>` ของแอปพลิเคชันเกิด Scrollbar โดยเด็ดขาด Layout หลักต้องเป็น `h-screen overflow-hidden` และกำหนดให้เฉพาะพื้นที่เนื้อหา (Content Area) ด้านในทำหน้าที่ Scroll ด้วย `overflow-y-auto` วิธีนี้ช่วยให้โครงสร้าง Sidebar และ Navbar นิ่งสนิท 100% เวลาเปลี่ยนหน้า
2. **Table Pagination Anchoring:** ตารางข้อมูล (Data Table) ต้องมี Layout แบบ `flex flex-col` ควบคู่กับการกำหนดความสูงขั้นต่ำ (เช่น `min-h-[500px]` หรือ `h-full`) และตัวควบคุมหน้า (Pagination) ต้องถูกบังคับให้อยู่ด้านล่างสุดของกล่องด้วยคลาส `mt-auto` เพื่อป้องกันไม่ให้ Pagination กระโดดขึ้นไปด้านบนเมื่อจำนวนข้อมูลในหน้าสุดท้ายมีน้อยกว่าโควต้าปกติ (เช่น มีแค่ 1 แถว)
