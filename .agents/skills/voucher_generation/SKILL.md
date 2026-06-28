---
name: Voucher Generation & Redis Queues
description: Practices for handling heavy tasks like bulk voucher generation using Redis queues to prevent blocking the Node.js event loop.
---

# Voucher Generation & Redis Queues Skill

การสร้างคูปองอินเทอร์เน็ต (Hotspot Vouchers) แบบเป็นจำนวนมาก (Batch) อาจทำให้ฝั่ง Backend (Node.js/Fastify) ตอบสนองช้า หรือ Event Loop ค้างได้ กรุณาปฏิบัติตามมาตรฐานนี้

## 1. Background Jobs (Redis Queue)
- การสร้างคูปองที่เกิน 10 ใบ หรือคำสั่งใดๆ ที่ต้อง Export ไฟล์ PDF ควรถูกผลักไปทำในรูปแบบ **Background Job** ผ่าน Redis (เช่น ใช้ไลบรารี `bullmq`)
- เมื่อ API ร้องขอให้สร้างคูปอง, Backend จะต้องตอบกลับด้วย HTTP 202 Accepted พร้อม `job_id` แทนที่จะปล่อยให้ HTTP Request หมุนรอนานๆ

## 2. Security & Uniqueness
- รหัสบัตรคูปอง (PIN หรือ Username/Password) ต้องสร้างด้วยอัลกอริทึมสุ่มที่คาดเดาไม่ได้ (Cryptographically secure random string)
- รหัสผ่านควรสั้นและพิมพ์ง่าย แต่อ่านแล้วไม่สับสนตัวอักษร (เช่น เลี่ยงการใช้ `0` คู่กับ `O`, `l` คู่กับ `1`)
- ก่อนนำเข้าฐานข้อมูล ต้องมีกระบวนการ Check Duplicate เพื่อป้องกันไม่ให้รหัสชนกับบัตรที่สร้างไปก่อนหน้า

## 3. PDF Generation & Templates
- การ Export คูปองออกเป็น PDF ควรใช้ไลบรารีที่แปลง HTML-to-PDF อย่างรวดเร็ว (เช่น `puppeteer` แบบ Headless หรือไลบรารีเฉพาะทาง)
- เก็บ Template ของคูปองแยกส่วนไว้ในโฟลเดอร์ให้เป็นระเบียบ และรองรับการทำ CSS/Theme ที่ปรับแต่งได้ตาม `tenant_id`

## 4. Status Tracking
- Frontend ควรกระพริบ (Polling) หรือรับผ่าน WebSocket/SSE เพื่อดึงสถานะความก้าวหน้าของ Job นั้น (เช่น "50% Complete", "Completed") และแสดงปุ่มดาวน์โหลดไฟล์ PDF เมื่อทำสำเร็จ
