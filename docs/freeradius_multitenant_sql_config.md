# คู่มือการตั้งค่า FreeRADIUS Multi-Tenant SQL Configuration

เอกสารฉบับนี้อธิบายรายละเอียดเกี่ยวกับสถาปัตยกรรมการดัดแปลงคำสั่ง SQL ใน FreeRADIUS เพื่อรองรับการแยกข้อมูลลูกค้ารายสาขา (Multi-Tenancy) บนฐานข้อมูล PostgreSQL เดียวกัน

---

## 🎯 ปัญหาที่พบและการแก้ไข (The Challenge)
ในสถาปัตยกรรมแบบ SaaS ฐานข้อมูลจำเป็นต้องแยกประวัติการใช้งานและประวัติการล็อกอิน (Logs) ของผู้ใช้ออกตามรหัสของแต่ละผู้เช่า (`tenant_id`) เพื่อให้ผู้เช่าแต่ละรายสามารถเข้าดูข้อมูลสถิติของตนเองผ่าน Dashboard ได้ โดยไม่เห็นข้อมูลข้ามไซต์กัน

แต่เดิม คำสั่ง SQL ในโมดูล SQL ของ FreeRADIUS (`rlm_sql_postgresql`) จะทำการบันทึกข้อมูลดั้งเดิมโดยไม่มีฟิลด์ `tenant_id` ส่งผลให้การบันทึกประวัติล้มเหลวเนื่องจากติด Constraint ในฐานข้อมูล หรือทำให้ไม่สามารถแยกแยะความเจ้าของข้อมูลของ Log ได้

---

## 🛠️ วิธีการแก้ไขที่ระดับระบบ (Recommended Architecture)

ระบบทำการแก้ไขปัญหาแบบผสมผสาน (Hybrid Approach) เพื่อให้ได้ความเสถียรสูงสุด:

1. **ระดับ Database (Fault Tolerance):**
   * กำหนดให้คอลัมน์ `tenant_id` ในตาราง `radacct` และ `radpostauth` สามารถมีค่าว่างได้ (`NULL`) เพื่อเป็นเกราะป้องกันหากระบบตั้งค่าผิดพลาด หรือผู้ใช้ป้อนรหัสผ่านปลอมที่ไม่มีในระบบ (Access-Reject) จะได้ไม่ทำให้ระบบล็อกอินหลักล่ม
2. **ระดับ FreeRADIUS (Data Isolation):**
   * ทำการแก้ไขคำสั่ง SQL (Insert Queries) ในไฟล์ `queries.conf` เพื่อสืบค้นหา `tenant_id` ของผู้ใช้แบบอัตโนมัติขณะที่มีกิจกรรมเกิดขึ้น

---

## 📝 จุดประสงค์และการนำเทมเพลต `queries.conf` ไปใช้

เพื่อการติดตั้งและขยายเซิร์ฟเวอร์ FreeRADIUS ตัวใหม่ในอนาคต:
* ไฟล์ต้นแบบของโครงการถูกบันทึกไว้ใน Workspace ที่ [docs/queries.conf](file:///d:/1.Development/frd-newtype/docs/queries.conf)
* เมื่อสร้างเซิร์ฟเวอร์ Ubuntu ตัวใหม่ ให้นำไฟล์นี้ไปแทนที่ไฟล์เดิมที่:
  `/etc/freeradius/3.0/mods-config/sql/main/postgresql/queries.conf`

---

## 🔍 รายละเอียดการปรับแต่งคำสั่ง SQL (Custom Queries)

คำสั่ง SQL หลักที่ดัดแปลงจะใช้กลไก `COALESCE` ร่วมกับ Subquery เพื่อสืบค้นหา `tenant_id` จากสองแหล่งคือ ตาราง `radcheck` (จากข้อมูลรหัสผ่าน/ผู้ใช้) หรือตาราง `nas` (สืบค้นจาก IP ขาเข้าของ MikroTik Router) ตามลำดับ:

### 1. คำสั่งสำหรับเก็บประวัติล็อกอินสำเร็จ/ล้มเหลว (`postauth_query`)
```sql
postauth_query = "INSERT INTO radpostauth (tenant_id, username, pass, reply, authdate) \
  VALUES ( \
    COALESCE( \
      (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), \
      (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) \
    ), \
    '%{SQL-User-Name}', \
    '%{%{User-Password}:-%{Chap-Password}}', \
    '%{reply:Packet-Type}', \
    '%S.%M' \
  )"
```

### 2. คำสั่งเริ่มเก็บข้อมูลทราฟฟิกและปริมาณการใช้งานเน็ต (`accounting_start_query`)
```sql
accounting_start_query = "INSERT INTO radacct (tenant_id, acctsessionid, acctuniqueid, username, realm, nasipaddress, nasportid, nasporttype, acctstarttime, acctinterval, acctauthentic, connectinfo_start, calledstationid, callingstationid, servicetype, framedprotocol, framedipaddress) \
  VALUES ( \
    COALESCE( \
      (SELECT tenant_id FROM radcheck WHERE username = '%{SQL-User-Name}' LIMIT 1), \
      (SELECT tenant_id FROM nas WHERE nasname = '%{NAS-IP-Address}' LIMIT 1) \
    ), \
    '%{Acct-Session-Id}', \
    '%{Acct-Unique-Session-Id}', \
    '%{SQL-User-Name}', \
    '%{Realm}', \
    '%{NAS-IP-Address}', \
    '%{NAS-Port-Id}', \
    '%{NAS-Port-Type}', \
    ${....event_timestamp}, \
    '%{Acct-Interim-Interval}', \
    '%{Acct-Authentic}', \
    '%{Connect-Info}', \
    '%{Called-Station-Id}', \
    '%{Calling-Station-Id}', \
    '%{Service-Type}', \
    '%{Framed-Protocol}', \
    '%{Framed-IP-Address}' \
  )"
```

---

## 🛠️ วิธีการตรวจสอบหลังจากติดตั้ง (Verification)

หลังจากนำไฟล์ไปวางและรันคำสั่ง `sudo systemctl restart freeradius` ให้ทดสอบล็อกอิน แล้วทำการตรวจสอบความถูกต้องในฐานข้อมูล PostgreSQL:

```sql
-- 1. ตรวจสอบการเชื่อมโยง Tenant บนตารางเก็บประวัติการล็อกอิน
SELECT id, tenant_id, username, reply, authdate FROM radpostauth ORDER BY id DESC LIMIT 5;

-- 2. ตรวจสอบการเชื่อมโยง Tenant บนตารางเก็บประวัติปริมาณการใช้งาน
SELECT radacctid, tenant_id, username, acctstarttime FROM radacct ORDER BY radacctid DESC LIMIT 5;
```
*ตัวบ่งชี้ความสำเร็จ: คอลัมน์ `tenant_id` ของบันทึกกิจกรรมล่าสุดจะต้องปรากฏค่า UUID ของลูกค้าอย่างถูกต้อง (ไม่เป็นค่า NULL)*
