---
name: PostgreSQL Partitioning & Large Data Management
description: Rules for managing large datasets (like radacct), implementing table partitioning with Drizzle ORM, and safe querying practices.
---

# PostgreSQL Partitioning & Large Data Management

สำหรับโปรเจกต์ SaaS ข้อมูลการใช้งาน (Accounting Logs) ในตาราง `radacct` และ `radpostauth` จะมีปริมาณเพิ่มขึ้นอย่างรวดเร็ว (หลักล้านถึงร้อยล้านแถว) การเขียนโค้ดที่ดึงข้อมูลเหล่านี้ต้องระมัดระวังสูงสุด

## 1. Table Partitioning (ตาราง radacct)
- ข้อมูลใน `radacct` ต้องถูกออกแบบให้รองรับ **Time-based Partitioning** (แบ่งพาร์ทิชันรายเดือน)
- หากมีการเขียน Schema ด้วย Drizzle ORM ตระหนักไว้เสมอว่าการสร้าง Partition ต้องใช้คำสั่ง SQL Native (Raw SQL) ใน Migration เนื่องจาก ORM หลายตัวอาจไม่รองรับ Declarative Partitioning อย่างสมบูรณ์แบบ

## 2. Safe Query Practices (การดึงข้อมูลอย่างปลอดภัย)
- **ห้าม Query ข้อมูลแบบ Full Table Scan เด็ดขาด** ทุกครั้งที่มีการดึงข้อมูล History, Session, หรือ Logs จากฐานข้อมูล ต้องแนบเงื่อนไข `LIMIT` เสมอ
- **Date Range Requirement:** หากมีฟิลเตอร์ในหน้าจอ UI ให้บังคับยูสเซอร์เลือก `start_date` และ `end_date` (Date Range) เสมอ และไม่ควรอนุญาตให้ดึงข้อมูลข้ามพาร์ทิชันที่ไกลเกิน 3 เดือน หากไม่จำเป็น
- **Tenant ID is King:** ห้ามลืม `where eq(table.tenantId, currentTenant)` แม้ในตาราง Accounting

## 3. Indexing Strategy
- ตารางที่ใหญ่มากๆ ต้องมี Composite Index ที่เหมาะสม
- ตัวอย่าง Index ที่จำเป็นสำหรับ `radacct`:
  - `(tenant_id, username, acctstarttime)`
  - `(acctsessionid)`
  - `(nasipaddress, acctstarttime)`

## 4. Archiving & Cleanup
- ควรกำหนดนโยบาย (Cronjob) เพื่อ Export ข้อมูลพาร์ทิชันที่เก่ากว่า 1 ปี ไปเก็บไว้ใน Storage ราคาถูก (Cold Storage) และ Drop พาร์ทิชันนั้นทิ้งจากฐานข้อมูลหลัก เพื่อลดภาระการทำ Backup และ Maintainance
