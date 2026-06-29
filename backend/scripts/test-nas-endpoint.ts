import axios from "axios";
import { db } from "../src/db/index.js";
import { nas } from "../src/schema/nas.js";
import { eq } from "drizzle-orm";

const API_URL = "http://localhost:8000/api/v1";

async function testEndpoint() {
  const nasId = 22;
  const mtkUsername = process.argv[2];
  const mtkPassword = process.argv[3];

  if (mtkUsername && mtkPassword) {
    console.log(`[Test] Updating NAS ID ${nasId} with CLI credentials...`);
    await db.update(nas).set({
      apiUsername: mtkUsername,
      apiPasswordEncrypted: mtkPassword // Using plaintext in database for now as defined in controller
    }).where(eq(nas.id, nasId));
  } else {
    console.log("[Test] No credentials passed via CLI arguments. Using database values.");
    console.log("Usage: npx tsx scripts/test-nas-endpoint.ts <mtk_username> <mtk_password>");
  }

  console.log(`\n[Test] 1. Checking NAS ID ${nasId} in database...`);
  const [targetNas] = await db.select().from(nas).where(eq(nas.id, nasId)).limit(1);

  if (!targetNas) {
    console.error(`NAS with ID ${nasId} not found in DB!`);
    return;
  }
  console.log(`Found NAS in DB: ${targetNas.shortname} (${targetNas.nasname})`);
  console.log(`Type: ${targetNas.type}`);
  console.log(`API Username: ${targetNas.apiUsername}`);
  console.log(`API Password: ${targetNas.apiPasswordEncrypted ? "[SET]" : "[NOT SET]"}`);

  console.log("\n[Test] 2. Logging in to obtain JWT token...");
  let token = "";
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "admin@saas.local",
      password: "password123"
    });
    
    token = loginRes.data.token;
    if (token) {
      console.log(`Login successful! Obtained Token.`);
    } else {
      console.warn("Login successful but no token found in response!");
    }
  } catch (err: any) {
    console.error("Login failed:", err.response?.data || err.message);
    return;
  }

  console.log(`\n[Test] 3. Requesting GET /nas/${nasId}/status ...`);
  try {
    const statusRes = await axios.get(`${API_URL}/nas/${nasId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Status response success!");
    console.log(JSON.stringify(statusRes.data, null, 2));
  } catch (err: any) {
    console.error("Status request failed:");
    console.error(JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

testEndpoint();
