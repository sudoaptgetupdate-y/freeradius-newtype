---
name: SaaS FreeRADIUS Coding Standards
description: Core guidelines and coding standards for developing the SaaS FreeRADIUS Cloud Management System (Fastify, Vite, Drizzle ORM, Multi-Tenancy).
---

# SaaS FreeRADIUS Project Guidelines

คุณกำลังพัฒนาโปรเจ็ค **SaaS FreeRADIUS Cloud Management System** กรุณาปฏิบัติตามกฎกติกาเหล่านี้อย่างเคร่งครัดในทุกๆ การเขียนโค้ด

## 1. Technology Stack
- **Backend:** Node.js v22 LTS, Fastify v5, Drizzle ORM
- **Frontend:** React v19 (Vite), Tailwind CSS v4, shadcn/ui
- **Database & Logs:** PostgreSQL v17, Grafana Loki v3

## 2. Multi-Tenancy Architecture (กฎเหล็กสูงสุด)
- **Data Isolation:** การ Query ฐานข้อมูล **ต้องแนบเงื่อนไข `where tenant_id = ?` เสมอ** ห้ามละเลยเด็ดขาดเพื่อป้องกันข้อมูลข้ามไซต์ (Cross-tenant Data Leakage)
- **Composite Keys:** ตระหนักเสมอว่า `username` สามารถซ้ำกันได้ในระบบ หากอยู่คนละ `tenant_id`

## 3. Data Lifecycle (การจัดการข้อมูล)
- **Soft Delete:** ห้ามใช้คำสั่ง `DELETE` ทาง SQL สำหรับข้อมูลหลัก (Tenants, Admins, Users, NAS) ให้ใช้วิธีเปลี่ยนค่าหรือประทับเวลา `deleted_at = now()` แทน
- **Hard Delete:** ใช้เฉพาะข้อมูลชั่วคราว เช่น Vouchers ที่หมดอายุแล้ว

## 4. UI/UX & API Standards
- **Data Tables:** API ที่ดึงข้อมูลแบบลิสต์ (List) ต้องรองรับ Query Parameters สำหรับ:
  - `page` และ `limit` (Server-side Pagination)
  - `search` (Global Search)
  - `sortBy` และ `order` (Sorting)
- **Design System:** งาน Frontend ต้องยึดหลัก Premium Design, Glassmorphism, โทนสีทันสมัย และคำนึงถึง Micro-animations เวลา Hover เสมอ

## 5. FreeRADIUS & Network Logic
- ระลึกไว้เสมอว่าตัว FreeRADIUS ทำงานแบบ Real-time ร่วมกับ PostgreSQL
- การจัดการ IoT ให้ใช้ตาราง `mac_bypass` แยกต่างหากจาก `radcheck`
- หากหน้าจอ UI เกี่ยวข้องกับ Traffic กราฟ ให้พิจารณาว่าต้องดึงจาก `radacct` (Postgres) หรือ `LogQL` (Loki)
