# คู่มือการนำโปรเจกต์ไปติดตั้งและพัฒนาต่อบนเครื่องใหม่ 🚀

เนื่องจากเราเอาโค้ดขึ้น GitHub เรียบร้อยแล้ว การไปรันบนคอมที่ทำงาน (หรือเครื่องอื่นๆ) สามารถทำตาม Step ด้านล่างนี้ได้เลย:

## สิ่งที่ต้องมีในเครื่องใหม่ (Prerequisites)
- **Node.js** (แนะนำเวอร์ชัน 18 ขึ้นไป)
- **PostgreSQL** (ติดตั้งและรัน Service ไว้ให้เรียบร้อย)
- **Git** (สำหรับดึงโค้ด)

---

## ขั้นตอนการติดตั้ง (Installation)

### 1. โหลดโค้ดลงเครื่อง (Clone Repository)
เปิด Terminal หรือ Command Prompt ในโฟลเดอร์ที่คุณต้องการเก็บงาน แล้วรัน:
```bash
git clone https://github.com/sudoaptgetupdate-y/freeradius-newtype.git
cd freeradius-newtype
```

### 2. ตั้งค่าฝั่ง Database (PostgreSQL)
1. เปิดเครื่องมือจัดการฐานข้อมูล เช่น pgAdmin
2. สร้าง Database ใหม่ตั้งชื่อว่า `freeradius_db`
3. จำชื่อผู้ใช้ (Username) และรหัสผ่าน (Password) ของ Postgres ในเครื่องนั้นไว้

### 3. ติดตั้งฝั่ง Backend
1. เข้าไปที่โฟลเดอร์ Backend และลง Dependencies:
   ```bash
   cd backend
   npm install
   ```
2. สร้างไฟล์ `.env` ไว้ในโฟลเดอร์ `backend` แล้วใส่ข้อมูลนี้ลงไป:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://<ชื่อผู้ใช้>:<รหัสผ่าน>@localhost:5432/freeradius_db
   JWT_SECRET=your_super_secret_jwt_key
   ```
   *(อย่าลืมแก้ `<ชื่อผู้ใช้>` และ `<รหัสผ่าน>` ให้ตรงกับ Postgres ในคอมเครื่องใหม่ด้วยครับ)*
3. รันคำสั่งสร้างตารางใน Database อัตโนมัติ:
   ```bash
   npm run db:push
   ```
4. รันเซิร์ฟเวอร์ Backend:
   ```bash
   npm run dev
   ```
   *(ปล่อยหน้าต่าง Terminal นี้รันค้างไว้เลย)*

### 4. ติดตั้งฝั่ง Frontend
1. **เปิด Terminal หน้าต่างใหม่** แล้วเข้าไปที่โฟลเดอร์ Frontend:
   ```bash
   cd frontend
   npm install
   ```
2. สร้างไฟล์ `.env` ไว้ในโฟลเดอร์ `frontend` แล้วใส่ข้อมูลนี้:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
3. รัน Frontend:
   ```bash
   npm run dev
   ```

### 5. เข้าใช้งานได้เลย! 🎉
เปิดเบราว์เซอร์ไปที่ `http://localhost:5173` คุณก็จะเจอกับโปรเจกต์ล่าสุด พร้อมให้แก้ไข (DEV) ต่อได้ทันทีครับ!

---

## วิธีทำงานสลับเครื่อง (Syncing Work)
- **เปิดคอมใหม่ทุกเช้า:** ให้เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรัน `git pull origin main` เพื่อดึงอัปเดตล่าสุด
- **ทำเสร็จก่อนปิดคอม:** ให้เซฟงานด้วยคำสั่ง:
  ```bash
  git add .
  git commit -m "อัปเดตงานวันนี้ (เขียนอธิบายงานที่ทำ)"
  git push origin main
  ```
