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
