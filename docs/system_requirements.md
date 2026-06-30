# Software Requirements Specification (SRS)
**Project:** Next-Gen FreeRADIUS & Network Management System (SaaS Edition)
**Based on:** Legacy FreeRADIUS Admin V2.0 + Multi-Tenancy Architecture

> [!NOTE]
> เอกสารฉบับนี้ถูกจัดทำขึ้นเพื่อใช้เป็น **Requirements Document** สำหรับทีมพัฒนาในการขึ้นโปรเจ็คใหม่แบบ SaaS (Multi-Tenant) โดยจัดหมวดหมู่ตาม Functional Requirements และ User Roles เพื่อให้ง่ายต่อการวางแผนสถาปัตยกรรม (Architecture) และนำไปต่อยอดฟีเจอร์ในอนาคต

---

## 1. System Overview (ภาพรวมระบบ)
ระบบบริหารจัดการเครือข่ายอินเทอร์เน็ตแบบรวมศูนย์ระดับคลาวด์ (SaaS Network Management System) ที่ออกแบบมารองรับการให้บริการ **Multi-Tenancy (ผู้เช่าหลายราย)** ภายใน Server และ Database ชุดเดียว ระบบทำหน้าที่เป็นตัวกลางในการจัดการผู้ใช้งาน, แพ็กเกจอินเทอร์เน็ต, และอุปกรณ์เครือข่าย (Mikrotik, NAS) โดยแบ่งแยกข้อมูลของลูกค้าแต่ละราย (Tenant) ออกจากกันอย่างเด็ดขาด

---

## 2. Architecture & Technology Stack (สถาปัตยกรรมและเทคโนโลยี)
ระบบถูกออกแบบด้วยสถาปัตยกรรมสมัยใหม่เพื่อรองรับการขยายตัว (Scalability) และประสิทธิภาพสูง:

**2.1 Server Environment:**
*   **Production Server:** เป็นที่ตั้งของ Core Services ทั้งหมด รวมถึง FreeRADIUS v3.0, PostgreSQL v17, Grafana Loki v3, Vector v0, และ Redis v7

**2.2 Tech Stack:**
*   **Frontend:** Vite v6 + React v19 + TypeScript v5 + Tailwind CSS v4 + shadcn/ui
*   **Backend API:** Node.js v22 LTS + Fastify v5 + Drizzle ORM
*   **Core Authentication:** FreeRADIUS v3.0 + PostgreSQL v17 (ทำ Table Partitioning สำหรับ `radacct`)
*   **Logging Engine:** Vector v0 (รับ Syslog 514) + Grafana Loki v3 (จัดเก็บและคิวรี Log)
*   **Caching & Queue:** Redis v7 สำหรับ Cache ข้อมูลหน้า Dashboard และทำคิวปริ้นท์คูปอง

---

## 2. User Roles & Permissions (บทบาทและสิทธิ์ผู้ใช้งาน)

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Super Admin (System Owner)** | เจ้าของระบบ SaaS | ควบคุม Master Dashboard, สร้างและจัดการ Tenant (Site), ดูภาพรวม Server |
| **Tenant Admin (Site Admin)** | ผู้ดูแลระบบของแต่ละ Site | จัดการผู้ใช้งานของ Site ตัวเอง, ออกบัตร Voucher, จัดการ Router Mikrotik ตัวเอง |
| **End User** | ผู้ใช้งานอินเทอร์เน็ต | ล็อกอินผ่าน Captive Portal, เข้าใช้งาน User Portal |

---

## 3. Functional Requirements (ความต้องการทางฟังก์ชัน)

### 3.1 Multi-Tenancy & Master Management Module (ระบบศูนย์กลางสำหรับเจ้าของ)
> [!IMPORTANT]
> โมดูลนี้เป็นแกนกลางสำคัญของโครงสร้าง SaaS ทุกตารางในระบบจะต้องมี `tenant_id` กำกับไว้เสมอ
*   **REQ-SAAS-01 (Tenant Management):** Super Admin สามารถสร้าง, แก้ไข, ระงับ (Suspend) หรือลบ Tenant (Site) รวมถึงกำหนดโควต้าจำกัดจำนวน User และ Router ให้ลูกค้าแต่ละรายได้
*   **REQ-SAAS-02 (Data Isolation & DB Design):** ระบบต้องแยกระดับการเข้าถึงข้อมูลอย่างเด็ดขาด โดยรองรับการใช้ Composite Unique Key (`tenant_id` + `username`) และปรับแก้ SQL ของ FreeRADIUS ให้ Query ควบคู่กับ `tenant_id` เสมอ
*   **REQ-SAAS-03 (Global Monitoring & Services):** Master Dashboard สำหรับตรวจสอบสถานะ Server (CPU, RAM, Disk), ดูผู้ใช้รวมทั้งระบบ และสามารถกด Restart Service (`freeradius`, `postgresql`, `vector`, `loki`, `redis`) จากหน้าเว็บ
*   **REQ-SAAS-04 (Master Staff Management):** ระบบสร้างและจัดการทีมงานส่วนกลาง (Support Team, Network Engineer) พร้อมกำหนด Role (จำกัดสิทธิ์ย่อยในระดับ Master)
*   **REQ-SAAS-05 (Global Settings):** จัดการตั้งค่าระบบและระดับเซิร์ฟเวอร์แบบรวมศูนย์สำหรับ Super Admin (Master Level) ผ่านหน้า UI โดยจัดเก็บบันทึกข้อมูลลงฐานข้อมูล ซึ่งประกอบด้วยฟิลด์ตั้งค่าดังนี้:
    *   **Telegram Bot Config:** Token (API Bot Token), Bot ID/Username, Admin Chat ID (สำหรับรับแจ้งเตือนระบบ), และ Switch เปิด/ปิดบอท
    *   **Redis Integration Config:** IP/Host Address, Port (Default: 6379), Password (ถ้ามี) สำหรับระบบ Background Worker คิวงาน
    *   **Loki & Vector Log Config:** Loki HTTP URL, Vector Syslog Port (Default: 514) เพื่อใช้จัดการซิงค์ Log
    *   **SMTP Config:** Mail Server IP/Host, Port, User, Password, และ Sender Email
    *   **General Config:** Timezone ของระบบ (เช่น Asia/Bangkok) และ Radius Dictionary


### 3.2 Authentication & Authorization Module
*   **REQ-AUTH-01:** ระบบต้องรองรับการล็อกอินแยกระดับ (Master Login และ Tenant Login) พร้อมการเข้ารหัสรหัสผ่าน
*   **REQ-AUTH-02:** มี Role-based Access Control (RBAC) เพื่อจำกัดสิทธิ์การเข้าถึงเมนูต่างๆ ภายใน Tenant

### 3.3 Dashboard & Monitoring Module (สำหรับ Tenant)
*   **REQ-DASH-01:** แสดงจำนวนผู้ใช้งานที่กำลังออนไลน์ (Online Users) แบบ Real-time ของ Site ตัวเอง
*   **REQ-DASH-02:** แอดมิน Tenant สามารถดูรายการ Online Users (IP, Username, ระยะเวลา) และสามารถสั่งเตะ (Disconnect) ได้ทันที ผ่านระบบ **RADIUS CoA (Change of Authorization)**

### 3.4 Core Network & Infrastructure Module
*   **REQ-CORE-01 (NAS Management):** จัดการอุปกรณ์ NAS ของ Tenant พร้อมตัวเลือกกำหนด **Vendor Type (เช่น Mikrotik, Fortigate, Cisco, Other)** เพื่อให้ระบบจ่าย Radius Attributes และทำ Log Parsing ได้ตรงตามยี่ห้อของอุปกรณ์
*   **REQ-CORE-02 (Radius Profiles):** สร้างและจัดการแพ็กเกจอินเทอร์เน็ต (Group) โดยมี UI รองรับ 3 รูปแบบ คือ (1) MikroTik Template สำหรับจัดการ Rate-Limit, (2) Standard Enterprise Template สำหรับจัดการ 802.1X VLAN Assignment และ (3) Advanced Custom Mode สำหรับกำหนด VSA แบบ Manual
*   **REQ-CORE-03 (Organizations):** สร้างและจัดการ "องค์กรย่อย" ภายใน Tenant เพื่อผูก Radius Profile เริ่มต้น
*   **REQ-CORE-04 (802.1X / WPA-Enterprise):** รองรับระบบการยืนยันตัวตนไร้สายระดับองค์กร (802.1X, EAP-PEAP, MS-CHAPv2) ให้ใช้งานแบบ Seamless ควบคู่กับ Hotspot (Captive Portal) โดยใช้ฐานข้อมูล User ชุดเดียวกัน พร้อมรองรับการทำ **Dynamic VLAN Assignment** ผ่านการจ่าย Radius Attributes
*   **REQ-CORE-05 (802.1X Advanced Configurations):** เพื่อเสถียรภาพระดับองค์กร ระบบต้องครอบคลุมฟังก์ชันดังต่อไปนี้:
    *   **Public CA for EAP:** รองรับการติดตั้ง SSL Certificate ที่น่าเชื่อถือ (เช่น Let's Encrypt) บน FreeRADIUS เพื่อให้สมาร์ทโฟนรุ่นใหม่ (Android 11+, iOS) เชื่อมต่อ 802.1X ได้โดยไม่เกิดข้อผิดพลาด Certificate
    *   **MAC Authentication Bypass (MAB):** มีเมนูให้ระบุ MAC Address ของอุปกรณ์ IoT (เช่น ปริ้นเตอร์, Smart TV) เพื่อโยนเข้า VLAN ได้อัตโนมัติโดยไม่ต้องกรอกรหัสผ่าน
    *   **Simultaneous-Use:** กำหนดจำนวนอุปกรณ์ที่สามารถเชื่อมต่อได้พร้อมกันต่อ 1 บัญชีผู้ใช้ เพื่อป้องกันการนำบัญชีพนักงานไปแจกจ่าย
    *   **Dead Session Cleanup:** รองรับและบังคับการทำงานร่วมกับ Interim-Updates เพื่อตรวจสอบและเคลียร์ Session ของ 802.1X ที่ขาดการเชื่อมต่ออย่างแม่นยำ

### 3.5 User & Voucher Management Module
*   **REQ-USER-01 (User Management):** รองรับการเพิ่มผู้ใช้รายบุคคล และแบบกลุ่ม (Import CSV) 
*   **REQ-USER-02 (Change Group/Org):** เมื่อย้าย Organization ให้ผู้ใช้ ระบบต้องอัปเดต Profile ทันที
*   **REQ-USER-03 (Ban/Suspend):** รองรับการระงับผู้ใช้งาน (Disable)
*   **REQ-USER-04 (Voucher Packages & Batches):** สร้างรูปแบบบัตร และสั่งผลิตบัตรแบบสุ่มพร้อม Export ไปพิมพ์
*   **REQ-USER-05 (Self-Care User Portal):** หน้าเว็บสำหรับผู้ใช้งานอินเทอร์เน็ต (End User) โดยมีฟังก์ชันย่อยดังนี้:
    *   ดูสถานะแพ็กเกจ (เวลา/ปริมาณข้อมูลคงเหลือ) และประวัติการใช้งาน
    *   เปลี่ยนรหัสผ่าน (Change Password)
    *   **Self-Disconnect:** ปุ่มสำหรับสั่งเตะ Session ตัวเองที่ค้างอยู่ในระบบผ่านคำสั่ง **RADIUS CoA** (แก้ปัญหาล็อกอินซ้อนไม่ได้)
    *   **Device Management:** ตรวจสอบรายการ MAC Address ที่กำลังเชื่อมต่อด้วยบัญชีของตนเอง และสามารถลบอุปกรณ์ที่ค้างออกได้

### 3.6 Mikrotik API Integration Module
> [!TIP]
> ทางสถาปัตยกรรม (Architecture) แนะนำให้เชื่อมต่อโดยใช้ **REST API ผ่าน HTTPS (Port 443)** แบบ Stateless เพื่อความปลอดภัยและรองรับการ Scale (กำหนดให้ Router ลูกค้าต้องเป็น RouterOS v7+) 
*   **REQ-MTK-01 (Connection Setup):** ตั้งค่าเชื่อมต่อ Mikrotik (IP, Username, Password) ของแต่ละ Tenant โดยรหัสผ่านต้องถูกเข้ารหัสแบบ AES-256 ในฐานข้อมูล
*   **REQ-MTK-02 (Auxiliary Router Management):** ควบคุมส่วนเสริมของ Router (ที่ไม่เกี่ยวกับระบบยืนยันตัวตนหลัก) เช่น การจัดการ Walled Garden, การตรวจสอบสถานะทรัพยากรของ Router (CPU, Uptime) และการทำ Auto-Provisioning
*   **REQ-MTK-03 (IP Bindings & DHCP):** จัดการ IP Bindings (Bypass/Block) และเรียกดูสถานะ DHCP Leases

### 3.7 Captive Portal & Ads Module
*   **REQ-PORTAL-01 (Dynamic Theme Customization):** ปรับแต่งโลโก้ และสีสัน Captive Portal ของแต่ละ Tenant ระบบจะโหลด Theme อัตโนมัติ โดยอาศัย Query Parameters (เช่น `nas_mac`) ที่ Router ส่งมายัง URL ของ Portal
*   **REQ-PORTAL-02 (Advertisement):** สร้างแคมเปญโฆษณา (รูป/ข้อความ) พร้อมระบบ Countdown ก่อนเข้าใช้งานอินเทอร์เน็ต

### 3.8 Logging & Compliance Module
*   **REQ-LOG-01 (Network Traffic Logs):** รับ Log พ.ร.บ. ผ่าน Syslog (Port 514) ด้วย Vector แทน `rsyslog` และส่งจัดเก็บที่ Grafana Loki รองรับปริมาณ Log ระดับมหาศาล (30GB+/วัน)
*   **REQ-LOG-02 (System Audit Logs):** ระบบต้องจัดเก็บประวัติการกระทำของแอดมิน (Audit Trail) เช่น การล็อกอินเข้าหลังบ้าน, การลบ User, แก้ไข Router ทั้งระดับ Master และ Tenant โดยแยกสิทธิ์การดูข้อมูลอย่างชัดเจน
*   **REQ-LOG-03 (Data Retention Policy & Loki Retention):** กำหนดอายุการจัดเก็บ Log (Traffic และ Audit) อัตโนมัติ (เช่น 90 วัน หรือ 1 ปี) ผ่านระบบ Retention ของ Loki โดยตรง ช่วยเคลียร์พื้นที่อัตโนมัติ
*   **REQ-LOG-04 (Hybrid Log Access Policy):** จัดการสิทธิ์การดาวน์โหลด Log พ.ร.บ. ของฝั่ง Tenant ดังนี้:
    - **Short-term Logs (ไม่เกิน 7 วัน):** Master Admin สามารถสลับเปิด/ปิด (Toggle) สิทธิ์ให้ Tenant แต่ละรายเข้าไปดูหรือดาวน์โหลดได้ด้วยตนเอง
    - **Long-term Logs (30-90 วัน):** Tenant ไม่สามารถดาวน์โหลดได้ทันที ต้องส่งคำร้อง (Request Export) และต้องรอให้ Master Admin กดอนุมัติ (Approve) ก่อน
*   **REQ-LOG-05 (Log Export & Audit):** มีหน้าจอแสดงผลประวัติบน Dashboard (ค้นหาด้วย LogQL) และระบบเก็บบันทึกประวัติ (Audit Trail) ทุกครั้งที่มีใครดาวน์โหลดไฟล์ CSV/PDF ของ Log ออกไปจากระบบ
*   **REQ-LOG-06 (FreeRADIUS Housekeeping & Log Rotation):** ระบบต้องมีการจัดการ "Log ขยะ" ที่เกิดจาก FreeRADIUS ทั้งในระดับ OS และ Database เพื่อไม่ให้ Disk เต็ม:
    *   **OS Level (`radius.log`):** ตั้งค่า `logrotate` ใน Ubuntu เพื่อบีบอัด (Compress) และลบ Text Log ของ FreeRADIUS ที่เก่าเกินระยะเวลาที่กำหนดทิ้งโดยอัตโนมัติ
    *   **Database Level (`radacct`, `radpostauth`):** ใช้ระบบ Table Partitioning รายเดือน (Monthly Partition) ร่วมกับ Cron Job หากข้อมูลเดือนไหนเก่าเกินนโยบาย (เช่น 90 วัน) ระบบจะสั่งลบ Partition นั้นทิ้งทั้งก้อน (Drop Table) ทันที
    *   **Manual Clear (UI):** มีปุ่มในหน้า Master Dashboard ให้ Super Admin สามารถสั่งกด "Clear System Logs" หรือ "Purge Old Data" ด้วยตนเองได้ในกรณีฉุกเฉิน (เช่น Disk ใกล้เต็ม)
*   **REQ-LOG-07 (Hybrid Logging Architecture):** รองรับสถาปัตยกรรมระดับ Enterprise SaaS ที่ให้ Tenant นำ Log Server ของตนเองมาเชื่อมต่อ (BYO-Loki / Dedicated Loki) ได้ โดยรองรับการระบุ `custom_loki_url` ในฐานข้อมูล ซึ่ง Backend จะทำหน้าที่เป็น Proxy ดึง Log จาก Custom URL นั้นมาแสดงผลบน Dashboard ให้ลูกค้าโดยอัตโนมัติ เพื่อลดภาระ Storage ของเซิร์ฟเวอร์หลัก

### 3.9 Telegram Bot Integration Module
*   **REQ-TG-01 (Master Admin Bot):** เชื่อมต่อ Telegram แบบ **Webhook API** (ใส่ `Bot Token`) พร้อมสวิตช์เปิด/ปิด (Toggle) ระบบบอทส่วนกลาง ระบบจะแจ้งเตือนสถานะเซิร์ฟเวอร์ (Server Down/High CPU), แจ้งเตือนคำขอดาวน์โหลด Log และรองรับคำสั่งบอท (Slash Commands) เช่น `/status`
*   **REQ-TG-02 (Tenant Admin Bot):** มีหน้าต่างตั้งค่าสำหรับผู้เช่าเพื่อระบุ `Chat ID` ของร้านตนเอง พร้อมสวิตช์เปิด/ปิดการแจ้งเตือนแบบราย Site รวมถึงรองรับระบบแจ้งเตือนและ Interactive Commands:
    *   **Guest Approval:** เมื่อมีการลงทะเบียนผ่าน Captive Portal บอทจะส่งข้อความแจ้งเตือนพร้อมปุ่ม Inline Keyboard `[Approve]` หรือ `[Decline]` ให้กดจาก Telegram ได้ทันที
    *   **NAS Status Alert:** แจ้งเตือนเมื่อ Router (Mikrotik/Fortigate) ขาดการเชื่อมต่อ
    *   **Interactive Commands:** รองรับคำสั่งจัดการผู้ใช้งานผ่านแชท เช่น `/online` (ดูยอดคนใช้งาน), `/kick <username>` (เตะผู้ใช้ออก), และ `/disable <username>` (ระงับบัญชี)

### 3.10 UI/UX & Data Lifecycle Standards (มาตรฐานส่วนติดต่อผู้ใช้และการจัดการข้อมูล)
*   **REQ-STD-01 (Data Deletion Policy - Soft vs Hard Delete):** 
    *   **Soft Delete:** ข้อมูลหลักที่มีผลผูกพันกับ Log พ.ร.บ. หรือรายงาน (เช่น Tenant, Admin, WiFi Users, NAS) เมื่อแอดมินกดลบ จะต้องทำเป็น "Soft Delete" (เปลี่ยนสถานะ หรือใส่ค่า `deleted_at`) เพื่อให้ระบบยังคงมี Reference สำหรับตาราง Accounting (`radacct`) และป้องกันปัญหา "ข้อมูลกำพร้า (Orphaned Data)"
    *   **Hard Delete:** อนุญาตให้ทำได้เฉพาะข้อมูลขยะ (เช่น บัตร Voucher ที่หมดอายุเกิน 90 วัน, เคลียร์ Session ค้าง) ผ่านระบบ Cron Job อัตโนมัติเพื่อคืนพื้นที่ Database
*   **REQ-STD-02 (Data Table UI Capabilities):** หน้าจอแสดงผลข้อมูลแบบตาราง (Data Grid) ทั้งหมดในระบบ ต้องรองรับฟีเจอร์มาตรฐานดังนี้:
    *   **Global Search & Filter:** ช่องค้นหา (Search) ที่หาข้อมูลได้อิสระ และ Filter Bar สำหรับกรองข้อมูลเฉพาะเจาะจง (เช่น กรองเฉพาะสถานะ Active, กรองตามกลุ่ม Profile)
    *   **Column Sorting:** สามารถคลิกที่หัวตาราง (Table Header) เพื่อเรียงลำดับข้อมูล (Sort ASC/DESC) เช่น เรียงตามวันที่สร้างล่าสุด หรือเรียงตามปริมาณ Data ที่ใช้
    *   **Server-side Pagination:** การแบ่งหน้าข้อมูลจะต้องประมวลผลจากฝั่ง Backend เสมอ เพื่อลดภาระ Browser กรณีมีข้อมูลหลักแสนบรรทัด
    *   **Bulk Actions:** มี Checkbox ด้านหน้าตาราง เพื่อให้ผู้ใช้ติ๊กเลือกหลายๆ บรรทัด และกดสั่งทำรายการ (ลบ, ระงับ, ย้ายกลุ่ม) รวดเดียวได้

---

## 4. Ideas for Future Enhancements (ไอเดียฟีเจอร์สำหรับพัฒนาต่อยอด)
1. **Payment Gateway Integration:** ให้ผู้ใช้สามารถซื้อ Voucher หรือต่ออายุผ่าน QR Code (PromptPay)
2. **Social Login / SSO:** รองรับการล็อกอินผ่าน Google, Facebook, LINE บนหน้า Captive Portal
3. **Billing & Subscriptions:** ระบบเก็บเงินค่าเช่ารายเดือนจาก Tenant โดยอัตโนมัติ (สำหรับเจ้าของระบบ)
4. **Advanced Analytics & Reporting:** ระบบออกรายงานกราฟิกเชิงลึก และ Export เป็น PDF/Excel
5. **Webhook & API สำหรับ External System:** เพิ่ม REST API เพื่อเชื่อมต่อกับระบบโรงแรม (PMS)
