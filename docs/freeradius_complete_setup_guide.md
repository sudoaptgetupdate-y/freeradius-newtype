# คู่มือฉบับสมบูรณ์: การติดตั้ง FreeRADIUS, MikroTik และ PostgreSQL (Step 1.1 & 1.2)

คู่มือฉบับนี้เป็นการรวบรวมขั้นตอนการตั้งค่าโครงสร้างพื้นฐานทั้งหมด (Step 1.1 และ 1.2) ไว้ในไฟล์เดียว เพื่อความสะดวกในการอ่านและนำไปใช้ติดตั้งบนเซิร์ฟเวอร์ใหม่ตั้งแต่ต้นจนจบ

---

## 🎯 ภาคที่ 1: การติดตั้ง FreeRADIUS พื้นฐานและการเชื่อมต่อ MikroTik

### 1.1 การติดตั้ง FreeRADIUS บน Ubuntu Server
เชื่อมต่อผ่าน SSH เข้าไปยังเซิร์ฟเวอร์ของคุณ (`ssh username@10.0.0.105`) และรันคำสั่ง:
```bash
sudo apt update
sudo apt install freeradius freeradius-utils -y
```
ตรวจสอบสถานะ: `sudo systemctl status freeradius`

### 1.2 การตั้งค่าผู้ใช้เพื่อทดสอบแบบ Local (ไม่ต้องใช้ Database)
ใช้คำสั่งด้านล่างเพื่อเพิ่มข้อมูลผู้ใช้ `testuser` เข้าไปต่อท้ายไฟล์ `authorize` (สำหรับการทดสอบเบื้องต้น):
```bash
echo 'testuser Cleartext-Password := "testpassword"' | sudo tee -a /etc/freeradius/3.0/mods-config/files/authorize > /dev/null
sudo systemctl reload freeradius
```
ทดสอบระบบด้วยคำสั่ง:
```bash
radtest testuser testpassword localhost 0 testing123
```
*(หากได้ `Access-Accept` แสดงว่าระบบยืนยันตัวตนพื้นฐานทำงานได้)*

### 1.3 การตั้งค่าให้ MikroTik คุยกับ FreeRADIUS
เพิ่มการตั้งค่าสำหรับ MikroTik ต่อท้ายไฟล์ `clients.conf` (สมมติว่า MikroTik มี IP `10.0.0.1`):
```bash
sudo tee -a /etc/freeradius/3.0/clients.conf > /dev/null <<EOT

client mikrotik {
    ipaddr = 10.0.0.1
    secret = mysecret123
    require_message_authenticator = no
}
EOT
```
เมื่อรันคำสั่งเสร็จแล้ว ให้สั่ง `sudo systemctl reload freeradius` จากนั้นไปตั้งค่าที่เมนู **RADIUS** บน Winbox ของ MikroTik โดยใส่ IP เซิร์ฟเวอร์และ Secret (`mysecret123`) ให้ตรงกัน

---

## 🐘 ภาคที่ 2: การอัปเกรดไปใช้ฐานข้อมูล PostgreSQL

ในส่วนนี้เราจะเปลี่ยนจากการอ่านข้อมูลผู้ใช้ในไฟล์ข้อความ มาเป็นการอ่านจากฐานข้อมูล PostgreSQL

### 2.1 ติดตั้งแพ็กเกจ PostgreSQL
รันคำสั่งเพื่อติดตั้ง PostgreSQL และโมดูลเชื่อมต่อของ FreeRADIUS
```bash
sudo apt install postgresql postgresql-contrib freeradius-postgresql -y
```

### 2.2 สร้างฐานข้อมูลและผู้ใช้งาน
เข้าสู่หน้าจอของ PostgreSQL:
```bash
sudo -u postgres psql
```
ก๊อปปี้คำสั่งเหล่านี้ไปวางในหน้าจอ `postgres=#` ทีละบรรทัด:
```sql
CREATE DATABASE radius;
ALTER DATABASE radius SET timezone TO 'UTC';
CREATE USER radius WITH PASSWORD 'radpass123';
GRANT ALL PRIVILEGES ON DATABASE radius TO radius;
\q
```

### 2.3 นำเข้าโครงสร้างตาราง (Schema) ของ FreeRADIUS
เราต้องคัดลอกไฟล์ Schema ออกมาไว้ที่ `/tmp` ก่อนเพื่อให้ user `postgres` มีสิทธิ์อ่านได้:
```bash
sudo cp /etc/freeradius/3.0/mods-config/sql/main/postgresql/schema.sql /tmp/
sudo chmod 644 /tmp/schema.sql
```
กลับเข้า Database และรันคำสั่ง Import:
```bash
sudo -u postgres psql radius
```
ในหน้าจอ `radius=#` รันคำสั่งต่อไปนี้:
```sql
\i /tmp/schema.sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radius;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO radius;
```
เพิ่ม User ทดสอบลงในตาราง `radcheck`:
```sql
INSERT INTO radcheck (username, attribute, op, value) VALUES ('sqltest', 'Cleartext-Password', ':=', 'sqlpassword');
\q
```

### 2.4 เปิดใช้งานและตั้งค่าโมดูล SQL ใน FreeRADIUS
สร้าง Symlink เพื่อเปิดใช้งานโมดูล SQL:
```bash
sudo ln -s /etc/freeradius/3.0/mods-available/sql /etc/freeradius/3.0/mods-enabled/
```
แก้ไฟล์ตั้งค่าการเชื่อมต่อฐานข้อมูลโดยอัตโนมัติ (ใส่ User/Password ให้ตรงกับที่สร้างไว้):
```bash
sudo sed -i 's/driver = "rlm_sql_null"/driver = "rlm_sql_postgresql"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/dialect = "sqlite"/dialect = "postgresql"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/^#\s*server = "localhost"/server = "localhost"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/^#\s*port = 3306/port = 5432/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/^#\s*login = "radius"/login = "radius"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/^#\s*password = "radpass"/password = "radpass123"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/^#\s*radius_db = "radius"/radius_db = "radius"/' /etc/freeradius/3.0/mods-available/sql
sudo sed -i 's/read_clients = yes/read_clients = no/' /etc/freeradius/3.0/mods-available/sql
```

### 2.5 บอกให้ระบบหลัก (Sites-Enabled) ไปอ่านข้อมูลจาก SQL
เปิดไฟล์ `default` ด้วย nano:
```bash
sudo nano /etc/freeradius/3.0/sites-enabled/default
```
เลื่อนหาหัวข้อ **`authorize { ... }`**, **`accounting { ... }`**, **`session { ... }`**, **`post-auth { ... }`** แล้ว**ลบเครื่องหมาย `#`** หน้าคำว่า `-sql` ออกให้หมด (Uncomment) บันทึกไฟล์ให้เรียบร้อย

ทำเช่นเดียวกันกับไฟล์ `inner-tunnel`:
```bash
sudo nano /etc/freeradius/3.0/sites-enabled/inner-tunnel
```
ลบเครื่องหมาย `#` หน้า `-sql` ออกในหัวข้อ `authorize`, `session`, และ `post-auth` แล้วบันทึกไฟล์

ให้สิทธิ์กับ FreeRADIUS Group:
```bash
sudo chgrp freerad /etc/freeradius/3.0/mods-available/sql
```

---

### 2.6 ปลดล็อก PostgreSQL เพื่อการเชื่อมต่อข้ามเน็ตเวิร์ก (Remote Access)
> [!IMPORTANT]
> **ขั้นตอนนี้จำเป็นอย่างยิ่ง!** หากคุณเขียนโค้ด Backend/Frontend (เช่น Node.js, Fastify) อยู่บน Local PC ของคุณ และต้องการให้มันไปดึงข้อมูลจาก Database บนเซิร์ฟเวอร์ (แม้จะอยู่ในวงแลนเดียวกันก็ตาม) ค่าเริ่มต้นของ PostgreSQL จะบล็อกการเข้าถึงทั้งหมดจากเครื่องอื่น ต้องทำการปลดล็อก 3 จุดด้านล่างนี้ก่อน

1. เปลี่ยนให้รอรับการเชื่อมต่อจากทุกช่องทาง (เปลี่ยน `listen_addresses` เป็น `*`):
```bash
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
```

2. อนุญาตให้ IP วงแลน `10.0.0.0/24` (วงของ Local PC ที่ใช้ Dev) เข้าใช้งานฐานข้อมูล `radius` ได้:
```bash
echo "host    radius          radius          10.0.0.0/24             scram-sha-256" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf > /dev/null
```

3. เปิด Firewall (UFW) สำหรับ Port 5432 เพื่อให้ทราฟฟิกเชื่อมต่อเข้ามาได้ แล้วสั่งรีสตาร์ท:
```bash
sudo ufw allow 5432/tcp
sudo systemctl restart postgresql
```

---

## 🚀 ภาคที่ 3: บททดสอบสุดท้าย

เมื่อทุกอย่างตั้งค่าเรียบร้อย ให้รีสตาร์ท FreeRADIUS:
```bash
sudo systemctl restart freeradius
```
*(หากรีสตาร์ทไม่ผ่าน ให้ใช้คำสั่ง `sudo systemctl stop freeradius` และ `sudo freeradius -X` เพื่อดูข้อผิดพลาด)*

ทดสอบล็อกอินด้วยข้อมูลผู้ใช้จากฐานข้อมูล (`sqltest`):
```bash
radtest sqltest sqlpassword localhost 0 testing123
```
หากตอบกลับว่า **`Received Access-Accept...`** ถือว่าระบบโครงสร้างพื้นฐาน FreeRADIUS + PostgreSQL ของคุณทำงานได้อย่างสมบูรณ์แบบ!
