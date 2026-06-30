# Tenant Management Guide (SaaS Multi-Tenancy)

เอกสารฉบับนี้อธิบายรายละเอียดเกี่ยวกับสถาปัตยกรรม, โครงสร้างข้อมูล (Database Schema) และกระบวนการทำงานหลัก (Lifecycle) ของระบบจัดการผู้เช่า (Tenant / Site) ในระบบ FreeRADIUS Cloud Management

---

## 1. ภาพรวมการจัดการผู้เช่า (Tenant Architecture)
ระบบถูกออกแบบมาเป็น **Multi-Tenant (SaaS)** โดยแยกข้อมูลของผู้เช่าแต่ละไซต์ (Site) ออกจากกันในระดับฐานข้อมูลผ่าน `tenant_id` (UUID) อุปกรณ์เน็ตเวิร์ก (NAS), แพ็กเกจความเร็ว (Profiles/Packages), บัญชีผู้ใช้งาน (Users), คูปอง (Vouchers), และ Log การทำงานทั้งหมดจะมีการเก็บข้อมูลโดยอิงกับ `tenant_id` เสมอ เพื่อรับประกันความปลอดภัยและการแยกส่วนของข้อมูล (Data Isolation) 100%

---

## 2. โครงสร้างฐานข้อมูล (Database Schema)

### 2.1 ตาราง `tenants`
เก็บข้อมูลรายละเอียดของไซต์ผู้เช่าแต่ละแห่ง

| ชื่อคอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key (Auto-generate UUIDv4) |
| `name` | `varchar(255)` | ชื่อไซต์ หรือชื่อบริษัทผู้เช่า |
| `max_users` | `integer` | โควต้าจำนวนบัญชีผู้ใช้งานสูงสุดที่สร้างได้ (Default: 100) |
| `max_nas` | `integer` | โควต้าจำนวน NAS (Router/Firewall) สูงสุดที่เชื่อมต่อได้ (Default: 1) |
| `primary_device_type`| `varchar` | ประเภทอุปกรณ์หลัก (`mikrotik`, `fortigate`, `standard`) |
| `default_register_profile`| `varchar(255)` | ชื่อกลุ่มโปรไฟล์ FreeRADIUS สำหรับรองรับผู้สมัครใช้งานหน้าเว็บ (Self-Register) |
| `status` | `varchar` | สถานะของไซต์ (`active`, `suspended`) |
| `allow_log_access` | `boolean` | สิทธิ์ให้ Tenant เข้าถึงระบบดึงข้อมูล Log พ.ร.บ. ด้วยตนเอง |
| `telegram_chat_id` | `varchar(100)` | ID กลุ่ม/แชท Telegram สำหรับส่งแจ้งเตือนรายไซต์ |
| `telegram_enabled` | `boolean` | สวิตช์ เปิด/ปิด แจ้งเตือนบอทระดับไซต์ |
| `created_at` | `timestamp` | เวลาสร้างเรคคอร์ด |
| `updated_at` | `timestamp` | เวลาอัปเดตเรคคอร์ดล่าสุด |
| `deleted_at` | `timestamp` | เวลาที่ถูกลบ (ถ้ามี) |

### 2.2 ตารางข้อมูลอื่นๆ ที่เชื่อมโยง (Relations)
ความสัมพันธ์ของตารางต่าง ๆ ในระบบที่มีการผูกข้อมูลระดับ Tenant:

```mermaid
erDiagram
    tenants ||--o{ admins : "has administrators"
    tenants ||--o{ nas : "owns network access servers"
    tenants ||--o{ radgroupreply : "defines packages/profiles"
    tenants ||--o{ radcheck : "manages internet users"
    tenants ||--o{ radusergroup : "assigns users to profiles"
    tenants ||--o{ radacct : "collects accounting logs"

    tenants {
        uuid id PK
        varchar name
        varchar primary_device_type
        varchar default_register_profile
    }
    admins {
        int id PK
        uuid tenant_id FK
        varchar email
        varchar role
    }
    nas {
        int id PK
        uuid tenant_id FK
        varchar nasname IP
        varchar type
    }
    radgroupreply {
        int id PK
        uuid tenant_id FK
        varchar groupname
        varchar attribute
    }
    radcheck {
        int id PK
        uuid tenant_id FK
        varchar username
    }
```

---

## 3. กระบวนการทำงาน (Tenant Lifecycle)

### 3.1 การสร้างผู้เช่าใหม่และการตั้งค่าเริ่มต้นอัตโนมัติ (Auto-Provisioning)
เมื่อ Master (Super Admin) กดปุ่มสร้าง Tenant ใหม่ในระบบ หลังบ้าน (Backend) จะทำกระบวนการดังนี้อัตโนมัติ:
1. **บันทึกข้อมูล Tenant**: ลงตาราง `tenants`
2. **สร้างบัญชีแอดมินคนแรก**: ลงตาราง `admins` โดยตั้ง Role เป็น `tenant_admin`
3. **เจนเนอเรตโปรไฟล์ตั้งต้น (Auto Profile Provisioning)**:
   - ตรวจสอบ `primary_device_type` ที่เลือก
   - ตั้งชื่อโปรไฟล์อัตโนมัติเป็น `Default-MikroTik` หรือ `Default-FortiGate` หรือ `Default-Standard`
   - เพิ่ม Attributes ในตาราง `radgroupreply` ด้วย Attribute พิเศษ `Class` เพื่อใช้เป็นสัญลักษณ์มาร์กเกอร์ยืนยันความถูกต้องของโปรไฟล์ (Profile Verification Marker)
   - อัปเดตตาราง `tenants` ช่อง `default_register_profile` ให้ชี้ไปที่โปรไฟล์นี้ทันที

> [!NOTE]
> ระบบไม่อนุญาตให้แก้ไขช่อง `default_register_profile` ด้วยตนเองในขณะที่กำลังสร้าง Tenant ใหม่ เพื่อป้องกันการตั้งค่าผิดพลาด โดยระบบจะผูกโปรไฟล์ตามประเภทอุปกรณ์ที่เลือกให้เอง

---

### 3.2 การอัปเดตและการย้ายผู้ใช้งานเมื่อเปลี่ยนอุปกรณ์ (Migration Setup)
หาก Master ทำการแก้ไข Tenant และเปลี่ยนค่า `Primary Device Type` (เช่น เปลี่ยนจาก `MikroTik` ไปเป็น `FortiGate`) ระบบจะมีกลไกรองรับความปลอดภัยดังนี้:
1. **แจ้งเตือนยืนยันการเปลี่ยน (UI SweetAlert Prompt)**: หน้าจอจะแจ้งเตือนทันทีว่าผู้ใช้เดิมที่เคยเชื่อมต่อจะใช้งานอินเทอร์เน็ตไม่ได้เนื่องจากค่า Attribute อุปกรณ์ต่างกัน และจะถามว่าจะย้ายกลุ่มผู้ใช้เดิม (Migrate Users) หรือไม่
2. **สลับ Default Profile หลังบ้าน**: 
   - ระบบจะสร้าง Default Profile สำหรับอุปกรณ์ตัวใหม่ให้ทันทีหากยังไม่มี
   - อัปเดต `default_register_profile` ของ Tenant ไปหาโปรไฟล์ใหม่
3. **ย้ายกลุ่มผู้ใช้งานเดิมอัตโนมัติ (User Migration)**:
   - หากกดยืนยันการย้าย ระบบจะรันคำสั่ง SQL `UPDATE radusergroup`
   - สลับกลุ่ม (groupname) สำหรับ User ทุกคนในตาราง `radusergroup` ภายใต้ Tenant นั้น จากชื่อโปรไฟล์เดิมไปหาโปรไฟล์เริ่มต้นอันใหม่ในทันที

---

### 3.3 การลบผู้เช่าแบบมีเงื่อนไข (Conditional Delete)
เพื่อป้องกันไม่ให้ฐานข้อมูลมีขยะ และลดความเสี่ยงต่อการเกิดความเสียหายของข้อมูลระบบ (Data Corruption) รวมถึงให้เป็นไปตาม พ.ร.บ. คอมพิวเตอร์ การลบ Tenant จะถูกแบ่งออกเป็น 2 เงื่อนไข:

#### เงื่อนไขที่ 1: ลบถาวร (Hard Delete)
*   **เมื่อใด**: กรณีที่ Tenant นั้น **"ยังไม่เคยเชื่อมต่ออุปกรณ์ NAS"** และ **"ยังไม่มีการสร้าง User"** (มีค่า NAS Count = 0 และ User Count = 0)
*   **ผลลัพธ์**: ระบบจะลบข้อมูลออกถาวรทันทีใน Database ทั้งตาราง `admins`, `radgroupreply`, `radgroupcheck`, `radusergroup` และ `tenants` ทำให้ฐานข้อมูลสะอาดไม่มีขยะตกค้าง

#### เงื่อนไขที่ 2: ระงับการใช้งานชั่วคราว (Soft Delete / Suspend)
*   **เมื่อใด**: กรณีที่ Tenant นั้น **"เริ่มมีการใช้งานแล้ว"** (มีการผูกอุปกรณ์ NAS หรือมี User ในระบบแล้ว)
*   **ผลลัพธ์**: ป้องกันความเสียหายและการสูญหายของข้อมูล Audit Logs (ตาม พ.ร.บ. คอมพิวเตอร์) โดยระบบจะไม่ลบข้อมูลถาวร แต่จะเปลี่ยนสถานะเป็น `suspended` แทน ซึ่งจะทำการระงับการล็อกอินและการเข้าใช้งานเครือข่ายทั้งหมดของ Tenant นั้นชั่วคราว

---

## 4. สิทธิ์การใช้งานระดับข้อมูล (Data Isolation & JWT Payload)
สำหรับ Tenant Admin และ Tenant Staff ระบบจะส่งมอบความปลอดภัยเพิ่มเติมผ่าน Token (JWT):
*   เมื่อผู้เช่าเข้าสู่ระบบ ข้อมูล `primaryDeviceType` และ `defaultRegisterProfile` จะถูกแพ็คใส่เข้าไปใน JWT Payload ด้วย
*   เมื่อ Tenant Admin เปิดหน้าจอจัดการโปรไฟล์อินเทอร์เน็ต (Profiles) ตัวช่วยสร้าง (Wizard "Add Package") จะเปิดแท็บเทมเพลตที่ตรงกับอุปกรณ์หลักของ Tenant (MikroTik หรือ FortiGate) ให้ทันทีแบบ Auto-focus
*   ระบบในหน้า Profiles จะนำค่า `defaultRegisterProfile` จาก Token มาใช้เช็คเพื่อซ่อนปุ่มลบ (Disable Delete Button) ป้องกันไม่ให้ Tenant Admin เผลอกดลบแพ็กเกจตั้งต้นของระบบทิ้ง
