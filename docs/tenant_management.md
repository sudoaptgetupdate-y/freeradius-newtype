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
    tenants ||--o{ organizations : "has groups"
    tenants ||--o{ userinfo : "stores personal info of users"
    organizations ||--o{ user_organizations : "has members"
    radcheck ||--o{ user_organizations : "belongs to groups"
    radcheck ||--o| userinfo : "has profile details"

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
    organizations {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar description
        varchar default_profile
        varchar status
    }
    user_organizations {
        uuid id PK
        uuid organization_id FK
        int radcheck_id FK
        uuid tenant_id FK
    }
    userinfo {
        int id PK
        uuid tenant_id FK
        varchar username FK
        varchar first_name
        varchar last_name
        varchar member_id
        varchar citizen_id
        varchar email
        varchar phone
    }
```

### 2.3 ตาราง `userinfo`
เก็บข้อมูลรายละเอียดข้อมูลส่วนตัวของผู้ใช้งานอินเทอร์เน็ต (แยกระดับ Tenant ป้องกัน FreeRADIUS ล่มจากการใช้ Custom Attribute ใน `radreply`)

| ชื่อคอลัมน์ | ประเภทข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | `serial` | Primary Key |
| `tenant_id` | `uuid` | Foreign Key (อ้างอิง `tenants.id`) |
| `username` | `varchar(64)` | ชื่อผู้ใช้งาน |
| `first_name` | `varchar(200)`| ชื่อจริง |
| `last_name` | `varchar(200)` | นามสกุล |
| `member_id` | `varchar(100)` | รหัสสมาชิก / รหัสพนักงาน |
| `citizen_id`| `varchar(100)` | รหัสประจำตัวประชาชน (Optional) |
| `email` | `varchar(200)` | อีเมล (Optional) |
| `phone` | `varchar(50)` | เบอร์โทรศัพท์ (Optional) |
| `created_at`| `timestamp` | วันที่สร้างข้อมูล |
| `updated_at`| `timestamp` | วันที่แก้ไขข้อมูลล่าสุด |

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

### 3.1.1 ความสัมพันธ์ระหว่าง Primary Device Type, Profile และ Group
`primary_device_type` ของ Tenant มีบทบาทในการสร้าง **Default Profile** (เช่น `Default-MikroTik`) เท่านั้น ซึ่งเป็น Profile ตั้งต้นระดับ Tenant สำหรับกรณีเหล่านี้:
- **Self-Register:** ผู้ใช้ที่สมัครผ่าน Captive Portal จะถูกผูกกับ `defaultRegisterProfile` โดยตรง (ยังไม่ได้อยู่ใน Group ใด)
- **Voucher Users:** ผู้ใช้ Voucher ถูกผูกกับ Profile โดยตรง เป็นแบบ Stateless

**สำหรับ Organization Users (ผู้ใช้ที่มี Group):**
- Profile จะมาจาก `defaultProfile` ของ **Group** ที่ User สังกัดอยู่
- `primary_device_type` ของ Tenant ยังคงใช้เป็น Template สำหรับสร้าง Profile ใหม่ใน Wizard (Auto-focus Tab) แต่ **ไม่ได้บังคับ** ให้ Group ต้องใช้ Default Profile นั้น
- แอดมินสามารถสร้าง Group และเลือก Profile ใดก็ได้ตามต้องการ

> [!TIP]
> สรุป: `primary_device_type` → ควบคุม **Default Profile** ของ Tenant | **Group** → ควบคุม **Profile จริงของผู้ใช้** | ทั้งสองระดับแยกกันทำงานได้อิสระ

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

---

## 5. Impersonation Mode (ระบบการสวมสิทธิ์ผู้เช่า)

ระบบการสวมสิทธิ์ช่วยให้ Master (Super Admin) สามารถสลับหน้าจอไปปฏิบัติงานในบทบาทของ Tenant Admin ของแต่ละไซต์ได้ทันที โดยไม่ต้องร้องขอรหัสผ่านหรือสร้างผู้ใช้งานจำลองในไซต์ของลูกค้า ซึ่งช่วยลดความซับซ้อนของการเขียน UI ในหน้ารายการข้อมูลย่อยต่าง ๆ

### 5.1 กลไกการทำงาน (Technical Flow)
1. **การเรียกสิทธิ์ (Triggering)**:
   - ในหน้า **Tenant Management** (ที่เข้าถึงได้เฉพาะ Master Admin เท่านั้น) จะมีปุ่ม 🔑 **"Manage"** (สัญลักษณ์ LogIn) ท้ายรายชื่อของแต่ละ Tenant
   - เมื่อ Master กดสวมสิทธิ์ Client จะส่ง Request ไปยัง API Endpoint `/auth/impersonate` พร้อมระบุ `tenantId` ปลายทาง
2. **การทำงานของ JWT Context**:
   - Backend จะประมวลผลออก JWT Token ชุดใหม่ที่มี Payload ระบุฟิลด์จำลองสิทธิ์โดยสวมค่า `tenantId` ไปที่ระดับ Token Payload:
     ```json
     {
       "id": "master_admin_id",
       "email": "master_email",
       "role": "super_admin",
       "tenantId": "target_tenant_id",
       "isImpersonating": true,
       "originalAdminId": "master_admin_id",
       "primaryDeviceType": "tenant_device_type",
       "defaultRegisterProfile": "tenant_profile"
     }
     ```
   - ในฝั่ง Backend Service: คอนโทรลเลอร์ทั้งหมด (เช่น Users, NAS, Profiles, Vouchers) จะทำงานโดยใช้ `user.tenantId` จาก Token JWT ในการสืบค้นข้อมูลฐานข้อมูลโดยตรง ทำให้การแยกแยะสิทธิ์ข้อมูลระดับผู้เช่า (Tenant Isolation) ทำงานได้อย่างสมบูรณ์และเป็นเนื้อเดียวกันกับผู้ใช้งานระดับผู้เช่าทั่วไปโดยไม่ต้องแก้ไข SQL หรือเขียน logic คลุมแยกต่างหาก
3. **User Experience (UI/UX)**:
   - เมื่ออยู่ในโหมดสวมสิทธิ์ Frontend Dashboard จะแสดงแบนเนอร์จำลองสถานะสีส้มขนาดใหญ่ด้านบนสุดของเว็บเพจ (`ImpersonationBanner`) ระบุข้อมูล: *"Impersonation Mode — Managing: [ชื่อ Tenant]"* เพื่อเตือนผู้ใช้งานเสมอ
   - เมนูด้านข้าง (Sidebar) จะถูกจำกัดตามสิทธิ์ของ Tenant ปลายทาง 100% (ซ่อนเมนูระบบและรายชื่อ Tenant อื่น)
   - มีปุ่ม **"Exit"** ที่แบนเนอร์นี้เสมอ เมื่อกดแล้วจะส่งคำร้องไปยัง API `/auth/exit-impersonate` เพื่อรับ Token และ User ชุดเดิมของ Master Admin กลับไปเก็บในเบราว์เซอร์ พร้อมดึงหน้าจอกลับมาสู่หน้าจัดการทั่วไปทันที

---

## 6. แนวทางความจำเป็นของ Tenant Filter และ Global Search ควบคู่กับ Impersonation Mode

การทำ Impersonation Mode ช่วยตัดความต้องการในการเขียนหน้าจอที่มี Dynamic Tenant Filter ในเกือบทุกหน้า (เช่น หน้า Users, Vouchers, Profiles, NAS) ทิ้งไปได้ อย่างไรก็ตาม ระบบส่วนกลางของ Master Admin ยังจำเป็นต้องมีจุดค้นหาข้ามสาขาเฉพาะกรณี (Use Cases) ดังต่อไปนี้:

### 6.1 จุดที่ต้องการ Global Search (การค้นหาข้ามทุก Tenant)
1. **หน้าจอค้นหาผู้ใช้อินเทอร์เน็ตส่วนกลาง (Global User Search)**
   - **กรณีใช้งาน**: เมื่ออุปกรณ์ปลายทางเจอปัญหาไม่สามารถล็อกอินได้ แต่ไม่รู้ว่าผู้ใช้ดังกล่าวสังกัดอยู่กับ Tenant ไซต์ใด (เช่น ลูกค้าแจ้งเพียง Username หรือ MAC Address ผ่านทางฝ่ายบริการหลังบ้านหลัก)
   - **ความสามารถ**: ให้ Master Admin พิมพ์ Username, อีเมล หรือ MAC Address ค้นหาจากฐานข้อมูลรวม เมื่อพบข้อมูลแล้ว จะแสดงชื่อ Tenant ของผู้ใช้นั้น ๆ พร้อมปุ่มให้ Master กด Impersonate สลับสิทธิ์เข้าไปตรวจสอบประวัติการต่อเน็ต (radacct/Loki) ของผู้ใช้รายนั้นทันที
2. **หน้าจอรวบรวมอุปกรณ์เครือข่ายทั้งหมด (Global NAS/Router Monitoring)**
   - **กรณีใช้งาน**: Master Admin ต้องการตรวจสอบสถานะความเคลื่อนไหวทางเทคนิค เช่น ดูว่ามี NAS Router ตัวใดของลูกค้าออฟไลน์ไปบ้างในขณะนี้
   - **ความสามารถ**: แสดงรายชื่อ NAS ทั่วทั้งระบบพร้อมสถานะ (Online/Offline) และแสดงชื่อของ Tenant ที่เป็นเจ้าของ ทำให้ทีม Network Engineer ของระบบ SaaS ทราบสถานการณ์ภาพรวมได้ทันที

### 6.2 จุดที่ต้องการ Tenant Filter (การเลือกกรองรายไซต์โดยตรง)
1. **หน้าจอวิเคราะห์สถิติและการเรียกเก็บเงิน (Global Analytics & Billing Dashboard)**
   - **กรณีใช้งาน**: การเปรียบเทียบปริมาณการใช้งานทราฟฟิก (Bandwidth) และสถิติเชิงปริมาณของแต่ละ Tenant (เช่น จำนวน Account ที่แอคทีฟ, โควต้าผู้ใช้ที่เหลืออยู่)
   - **ความสามารถ**: หน้า Dashboard ของ Master ต้องมี Tenant Filter เพื่อเลือกว่าจะเปรียบเทียบผู้เช่ารายใดบ้าง หรือเลือกกรองภาพรวม (All Tenants) เพื่อดูแนวโน้มการขยายตัวของระบบในภาพกว้าง
2. **ระบบรวบรวม Log พ.ร.บ. ส่วนกลาง (Centralized Log Explorer)**
   - **กรณีใช้งาน**: การสืบค้น Log การใช้งานอินเทอร์เน็ตตามคำสั่งของเจ้าหน้าที่รัฐ (Law Enforcement)
   - **ความสามารถ**: แผงควบคุมสืบค้น LogQL (Loki) ของ Master Admin จะต้องมี Dropdown Filter เลือก Tenant เพื่อเจาะจงค้นหา Log ของผู้เช่านั้น ๆ ร่วมกับการระบุ IP, MAC หรือช่วงเวลาได้อย่างแม่นยำและรวดเร็ว

