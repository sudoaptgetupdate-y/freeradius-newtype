---
name: Loki LogQL & Authentication Logs
description: Standards for fetching and displaying authentication logs using Grafana Loki and LogQL, ensuring tenant isolation.
---

# Loki LogQL & Authentication Logs Skill

ระบบของเราใช้ Grafana Loki ร่วมกับ Vector เพื่อเก็บ Syslog จาก Mikrotik และ FreeRADIUS การนำ Log มาใช้งานในฝั่ง Backend หรือแสดงผลใน Frontend ต้องเป็นไปตามมาตรฐานนี้

## 1. Log Aggregation Flow
- Syslog จะถูกส่งเข้า Vector ก่อน เพื่อทำการ Parse ข้อความที่อ่านยากให้กลายเป็น JSON Structure (เช่น แยก `status`, `username`, `mac_address` ออกมา)
- จากนั้น Vector จะส่งต่อไปให้ Loki จัดเก็บ

## 2. Tenant Isolation in Loki
- ข้อมูลใน Loki เป็น Time-series Log การค้นหาข้อมูล **ต้องมีการแนบ Label ของ Tenant เสมอ** เพื่อให้แน่ใจว่า Site Admin A จะไม่เห็น Log ของ Site Admin B 
- การส่ง Log เข้า Loki (ผ่าน Vector) ต้องมีการแปะ Label `tenant_id` ไว้ทุกบรรทัด

## 3. Querying with LogQL
- **การนับ (Metrics):** หากต้องการรู้ว่าผู้ใช้ล็อกอินล้มเหลวกี่ครั้งใน 1 ชั่วโมง ให้ใช้คำสั่ง `rate()` หรือ `count_over_time()` ใน LogQL แทนการดึง Log มานับทีละบรรทัดใน Node.js
- **Limit & Time Range:** การเรียกใช้งาน LogQL จาก Fastify Backend ห้ามดึงข้อมูลเกิน 1000 บรรทัด หรือเกิน 24 ชั่วโมงต่อการส่ง Request 1 ครั้ง

## 4. UI Dashboard (Failed Logins)
- ในหน้าแดชบอร์ด ควรสรุปข้อมูล Failed Logins ให้ชัดเจน เพื่อช่วยให้ Admin ตรวจจับคนที่พยายามสุ่มรหัสผ่าน (Brute-force) หรือปัญหาเน็ตเวิร์กที่ทำให้ RADIUS ไม่ตอบสนอง

---

## 5. LogQL & Performance Best Practices (สำคัญมาก)
เพื่อให้ระบบสืบค้น Log ทำงานได้เร็วที่สุด และไม่ทำเซิร์ฟเวอร์ล่ม (OOM/Timeout) เมื่อมีข้อมูลระดับหลักล้านบรรทัด:

### 5.1 Query Optimization (ลำดับการกรอง)
- **ห้าม** ค้นหาข้อความ (Text Filter) ก่อนการกรอง Label เด็ดขาด เพราะจะเกิดการ Full Scan
- **บังคับ:** ให้กรองผ่าน `Stream Selector` (เช่น `tenant_id`, `job`) เป็นอันดับแรกเสมอ แล้วตามด้วย Pipe Parser และการค้นหา
- ✅ **Correct:** `{tenant_id="123", job="freeradius"} | json | status="failed"`
- ❌ **Wrong:** `{job="freeradius"} |= "failed" | json` (ทำแบบนี้ Loki จะสแกนหาคำว่า failed ทั้งก้อนก่อน)

### 5.2 JSON Parser Over Regex
- เนื่องจาก Vector แปลง Syslog เป็นโครงสร้าง JSON ก่อนส่งเข้า Loki ดังนั้น **ห้ามใช้ Regex ในการดึงข้อมูล** หากไม่จำเป็น
- บังคับใช้คำสั่ง `| json` เพื่อกางฟิลด์ออกมากรองเสมอ เพราะทำงานเร็วกว่า Regex มาก

### 5.3 ป้องกัน Query Timeout (Step & Resolution)
- เมื่อเขียน Query ระดับ Metrics (กราฟ) ลงแดชบอร์ดย้อนหลังเกิน 1 ชั่วโมง **ต้องกำหนดค่า `step` เสมอ** (เช่น `step=5m`)
- เพื่อให้ Loki ทำการจัดกลุ่มจุดพล็อต (Data Points) ลดภาระการโหลดข้อมูลลง Client และไม่ให้ TSDB ฝั่งเซิร์ฟเวอร์ใช้ CPU เกินขีดจำกัด

### 5.4 พ.ร.บ. คอมพิวเตอร์ (Log Retention)
- ต้องมีการกำหนดค่า Retention ของ Loki ผ่าน `compactor` เพื่อจัดเก็บ Log ไว้ในระบบเป็นระยะเวลาขั้นต่ำ **90 วัน** (หรือตามเงื่อนไขของลูกค้า) 
- ข้อมูลที่เก่าเกิน 90 วัน ระบบ Loki ควรถูกตั้งค่าให้ลบทิ้ง (Delete) อัตโนมัติ เพื่อประหยัดพื้นที่ Disk
