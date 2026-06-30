# คู่มือการทดสอบระบบผ่านอินเทอร์เน็ตภายนอกด้วย ngrok (Testing Guide)

เอกสารฉบับนี้อธิบายวิธีการตั้งค่าและการใช้โปรแกรม **ngrok** เพื่อทำการจำลองระบบเครือข่ายอินเทอร์เน็ตสาธารณะ (Public URL) สำหรับทดสอบระบบ **Captive Portal** ร่วมกับฟังก์ชัน **Social Login** (Google / LINE) และอุปกรณ์ **Mikrotik** บนเครื่องคอมพิวเตอร์ Local Development

---

## 1. ทำไมต้องใช้ ngrok ในการทดสอบ?
1. **Google/LINE OAuth Restriction:** ผู้ให้บริการเหล่านี้บังคับให้ลิงก์ Redirect Callback ต้องเป็นโดเมนจริงที่มีความปลอดภัย และบางกรณีต้องเป็น `https` เท่านั้น (ไม่ยอมรับ IP LAN ภายใน)
2. **Mikrotik Redirection:** อุปกรณ์มือถือที่เชื่อมต่อ Wi-Fi Hotspot จะไม่เข้าใจคำว่า `localhost` เมื่อ Mikrotik สั่งเปลี่ยนทิศทางเบราว์เซอร์ จึงจำเป็นต้องส่งเครื่องมือถือไปยังโดเมนที่เป็นสาธารณะจริง

---

## 2. การตั้งค่า ngrok Configuration (Multi-Tunnel)
เนื่องจากบัญชีประเภทใช้งานฟรี (Free Tier) อนุญาตให้เปิด Tunnel ได้เพียง 1 โดเมนต่อการพิมพ์ปกติ เราจึงเลือกใช้ไฟล์คอนฟิกเพื่อเปิด 2 พอร์ตพร้อมกัน (Frontend และ Backend) ดังนี้

### 2.1 เปิดไฟล์การตั้งค่า ngrok
พิมพ์คำสั่งนี้ใน Command Prompt/PowerShell เพื่อเข้าสู่ไฟล์คอนฟิกหลักของเครื่อง:
```bash
ngrok config edit
```

### 2.2 โครงสร้างการตั้งค่าในไฟล์ `ngrok.yml`
ให้วางโครงสร้างคอนฟิกเวอร์ชันล่าสุด (v3) ดังต่อไปนี้ลงในไฟล์แล้วบันทึก:
```yaml
version: "3"
agent:
  authtoken: YOUR_AUTHTOKEN_HERE # รหัสยืนยันตัวตนของคุณจากเว็บ ngrok.com
tunnels:
  frontend:
    proto: http
    addr: 5173 # พอร์ตเว็บหน้าบ้าน (Vite Dev Server)
  backend:
    proto: http
    addr: 8000 # พอร์ตเซิร์ฟเวอร์หลังบ้าน (Fastify Server)
```

---

## 3. วิธีการรันระบบเพื่อเริ่มทดสอบ
เมื่อเปิดเซิร์ฟเวอร์หลังบ้านและหน้ารันระบบหน้าบ้านปกติแล้ว ให้รัน ngrok พร้อมกันทั้งหมดด้วยคำสั่งเดี่ยว:
```bash
ngrok start --all
```

**ตัวอย่างหน้าจอเมื่อรันสำเร็จ:**
ระบบจะพ่นลิงก์ URL ที่ส่งต่อทราฟฟิก (Forwarding) ขึ้นมา 2 โดเมน เช่น:
*   `frontend` -> `https://a1b2-cd3e.ngrok-free.app` -> ส่งต่อไปยัง `http://localhost:5173`
*   `backend` -> `https://f4g5-hi6j.ngrok-free.app` -> ส่งต่อไปยัง `http://localhost:8000`

---

## 4. ขั้นตอนการนำลิงก์ไปผูกกับส่วนต่างๆ

เมื่อรัน ngrok สำเร็จ ให้นำลิงก์ที่ได้ไปกำหนดค่าในระบบดังต่อไปนี้:

### 4.1 นำโดเมน `backend` ไปผูกกับ OAuth Developer Console
*   **Google Cloud Console (Credentials) -> Authorized redirect URIs:**
    ```text
    https://<โดเมน-backend-ของ-ngrok>/api/v1/auth/social/callback/google
    ```
*   **LINE Developers (LINE Login Setting) -> Callback URL:**
    ```text
    https://<โดเมน-backend-ของ-ngrok>/api/v1/auth/social/callback/line
    ```

### 4.2 นำโดเมน `frontend` ไปแก้ไขหน้าล็อกอิน Mikrotik (`login.html`)
นำลิงก์ฝั่ง `frontend` ไปใส่แทนไอพีเดิม เพื่อให้มือถือ Redirect วิ่งมาถูกที่:
```html
<script>
    window.onload = function() {
        var tenantId = "7a9648eb-6332-4a26-b281-bca669d8bd29";
        // แทนที่ด้วยโดเมน ngrok ของ frontend
        var portalUrl = "https://<โดเมน-frontend-ของ-ngrok>/portal/" + tenantId;
        
        var linkLogin = "$(link-login-only)";
        var mac = "$(mac-esc)";
        var ip = "$(ip)";
        var dst = encodeURIComponent("$(link-orig)");
        
        window.location.href = portalUrl + 
            "?link-login=" + encodeURIComponent(linkLogin) +
            "&mac=" + encodeURIComponent(mac) +
            "&ip=" + encodeURIComponent(ip) +
            "&dst=" + dst;
    };
</script>
```

---

> [!WARNING]
> **ข้อควรระวังเรื่องการรันแบบฟรี (Free Tier):**
> ทุกครั้งที่คุณปิดโปรแกรม ngrok หรือรันใหม่ ตัวลิงก์ URL สุ่มในช่อง Forwarding จะเปลี่ยนใหม่เสมอ ดังนั้นทุกครั้งที่เริ่มรันการทดสอบรอบใหม่ คุณจำเป็นต้องนำค่าโดเมนล่าสุดไปอัปเดตที่ Google Console, LINE Login และไฟล์ `login.html` บน Mikrotik ทุกครั้งครับ
