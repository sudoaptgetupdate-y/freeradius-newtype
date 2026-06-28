# คู่มือการตรวจสอบระบบ (Recheck Guide): FreeRADIUS + PostgreSQL

ไฟล์นี้รวบรวมคำสั่ง (CLI) สำหรับตรวจสอบความถูกต้องหลังจากติดตั้งระบบ FreeRADIUS, MikroTik และ PostgreSQL (ตามคู่มือการติดตั้งหลัก) เพื่อให้แน่ใจว่าการตั้งค่าทุกจุดถูกต้องและระบบทำงานประสานกันได้อย่างสมบูรณ์

---

## 🟢 ขั้นตอนที่ 1: ตรวจสอบสถานะของ Service
เพื่อให้มั่นใจว่า service หลักทำงานอยู่ (ไม่ crash)

**เช็คสถานะ FreeRADIUS:**
```bash
sudo systemctl status freeradius --no-pager -l
```
*(ต้องแสดงสถานะ `Active: active (running)` สีเขียว)*

**เช็คสถานะ PostgreSQL:**
```bash
sudo systemctl status postgresql --no-pager -l
```
*(ต้องแสดงสถานะ `Active: active (running)` สีเขียว)*

---

## 🟢 ขั้นตอนที่ 2: ตรวจสอบฐานข้อมูลและตาราง Schema
ตรวจสอบว่าฐานข้อมูล `radius` ถูกสร้าง และตารางข้อมูลได้รับการ Import สำเร็จ

**แสดงรายชื่อตาราง (ต้องมีตาราง radcheck, radacct ฯลฯ):**
```bash
sudo -u postgres psql -d radius -c "\dt"
```

**ตรวจสอบว่ามี user `sqltest` ในระบบ (เพื่อใช้ทดสอบ):**
```bash
sudo -u postgres psql -d radius -c "SELECT * FROM radcheck WHERE username = 'sqltest';"
```
*(หากถูกต้อง จะได้ผลลัพธ์ประมาณ: `sqltest | Cleartext-Password | := | sqlpassword`)*

---

## 🟢 ขั้นตอนที่ 3: ตรวจสอบการตั้งค่าโมดูล SQL ของ FreeRADIUS
ตรวจสอบให้แน่ใจว่า FreeRADIUS เปิดใช้งานโมดูล SQL และถูกดึงมาใช้ประมวลผลแทนไฟล์ text แล้ว

**เช็คว่าเปิดโมดูล SQL (Symlink) แล้วหรือไม่:**
```bash
sudo ls -la /etc/freeradius/3.0/mods-enabled/sql
```
*(ควรแสดงว่าไฟล์ถูก Link ไปหาไฟล์ `/etc/freeradius/3.0/mods-available/sql`)*

**เช็คว่าเอาเครื่องหมาย `#` หน้า `-sql` ออกจากไฟล์ Default แล้ว:**
```bash
sudo grep -E "^\s*-sql" /etc/freeradius/3.0/sites-enabled/default
sudo grep -E "^\s*-sql" /etc/freeradius/3.0/sites-enabled/inner-tunnel
```
*(ควรมีข้อความ `-sql` แสดงขึ้นมาหลายบรรทัด แสดงว่าเปิดใช้งานในบล็อก authorize, accounting ฯลฯ เรียบร้อย)*

**เช็คสิทธิ์ (Permissions) ว่าเป็นของ group freerad:**
```bash
sudo ls -l /etc/freeradius/3.0/mods-available/sql
```

---

## 🟢 ขั้นตอนที่ 4: ตรวจสอบการรับการเชื่อมต่อจากภายนอก (PostgreSQL & Firewall)
เช็คให้แน่ใจว่าระบบฐานข้อมูลเปิดรับการเชื่อมต่อจากวงแลน หรือ Web API ได้

**เช็คว่าเปิดให้รับจากทุก IP (listen_addresses = '*'):**
```bash
sudo grep "^listen_addresses" /etc/postgresql/16/main/postgresql.conf
```

**เช็คว่าอนุญาตวงแลน (10.0.0.0/24) ใน pg_hba.conf แล้ว:**
```bash
sudo grep "10.0.0.0/24" /etc/postgresql/16/main/pg_hba.conf
```

**เช็คว่า Firewall (UFW) อนุญาต Port 5432 ของฐานข้อมูลแล้ว:**
```bash
sudo ufw status | grep 5432
```
*(ควรแสดงผลลัพธ์ว่า `5432/tcp   ALLOW   Anywhere`)*

---

## 🟢 ขั้นตอนที่ 5: ตรวจสอบข้อมูล Client (MikroTik)
เช็คว่าในไฟล์ `clients.conf` มีบล็อกการตั้งค่าให้ MikroTik แล้วหรือยัง

```bash
sudo awk '/client mikrotik/,/}/' /etc/freeradius/3.0/clients.conf
```
*(ควรจะแสดงข้อมูล IP และ secret ที่คุณตั้งไว้ให้ MikroTik)*

---

## 🚀 ขั้นตอนสุดท้าย: ทดสอบการ Authentication ตลอดสาย (End-to-End Test)
ขั้นตอนนี้จะทดสอบเสมือนว่ามีผู้ใช้งานล็อกอินเข้ามาจริงๆ โดยให้ FreeRADIUS ดึงรหัสผ่านจาก PostgreSQL มาตรวจสอบ

```bash
radtest sqltest sqlpassword localhost 0 testing123
```
**(เป้าหมาย: ต้องได้ผลลัพธ์คำว่า `Received Access-Accept...`)**

---

### 💡 การแก้ปัญหาเบื้องต้น (Troubleshooting / Debug Mode)
หากทดสอบ `radtest` แล้วไม่ได้ผลเป็น `Access-Accept` ให้เข้าสู่โหมด Debug เพื่อหาสาเหตุ:
```bash
sudo systemctl stop freeradius
sudo freeradius -X
```
รอให้มีข้อความ `Ready to process requests` แล้วเปิด Terminal อีกหน้าต่างมารันคำสั่ง `radtest` ข้างต้น จากนั้นสังเกต Log ในหน้าจอ Debug นี้ดูว่ามันไปติดหรือเกิด Error ที่บรรทัดไหน

เมื่อแก้ไขเสร็จแล้ว กด `Ctrl+C` เพื่อออกจาก Debug Mode แล้วรัน Service ตามปกติ:
```bash
sudo systemctl start freeradius
```
