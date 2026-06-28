---
name: Mikrotik RouterOS Integration
description: Guidelines for communicating with Mikrotik devices, handling CoA, Disconnect Messages, and API connections securely in a SaaS environment.
---

# Mikrotik RouterOS Integration Skill

โปรเจกต์ของเราเป็นระบบบริหารจัดการอินเทอร์เน็ตที่ทำงานร่วมกับ Mikrotik NAS เป็นหลัก กรุณาปฏิบัติตามมาตรฐานต่อไปนี้เมื่อต้องเขียนโค้ดที่สื่อสารกับ RouterOS

## 1. Authentication & Connection
- **Protocol:** ให้ใช้ RouterOS API (พอร์ต 8728) หรือ API-SSL (พอร์ต 8729) สำหรับการจัดการ Config เป็นหลัก
- **Timeouts:** การเรียก API ทุกครั้ง **ต้องมี Timeout เสมอ** (ไม่เกิน 5 วินาที) หากเชื่อมต่อไม่ได้ ต้องรองรับการแจ้งเตือนกลับมายัง Frontend อย่างสุภาพ ห้ามให้เซิร์ฟเวอร์ค้าง (Block Event Loop)
- **Tenant Isolation:** ข้อมูล IP, Username, Password ของ Mikrotik แต่ละเครื่อง จะต้องผูกกับ `tenant_id` ในฐานข้อมูล ห้ามเผลอไปสั่งงาน Mikrotik ของไซต์อื่นเด็ดขาด

## 2. Session Management (Radius CoA / Disconnect)
- **Disconnect User:** เมื่อ Site Admin กดปุ่ม "เตะ" (Kick/Disconnect) ผู้ใช้จากหน้าเว็บ ให้ส่งคำสั่ง **Disconnect-Request (Packet type 40)** ของ RADIUS ไปยัง Mikrotik IP แทนการใช้ API ปิด MAC Address โดยตรง
- **Change of Authorization (CoA):** กรณีที่ต้องเปลี่ยนความเร็วเน็ต (Rate-Limit) กลางคัน ให้ใช้ RADIUS CoA (Packet type 43) เป็นอันดับแรก

## 3. Bandwidth Management (Speed Limits)
- ใช้ Attribute `Mikrotik-Rate-Limit` สำหรับกำหนดความเร็วผู้ใช้งานเสมอ
- ฟอร์แมตความเร็วต้องเป็น `[rx-rate]/[tx-rate]` เช่น `"10M/50M"`
- ห้ามใช้ Queue Simple ตรงๆ บน Mikrotik (ให้จัดการผ่าน Radius profile เพื่อให้ทำงานร่วมกับ Hotspot/PPPoE อัตโนมัติ)

## 4. Security
- รหัสผ่านที่เก็บในฐานข้อมูลเพื่อเชื่อมต่อ Mikrotik (API Password, RADIUS Secret) ต้องเข้ารหัส (Encrypted) เสมอ
