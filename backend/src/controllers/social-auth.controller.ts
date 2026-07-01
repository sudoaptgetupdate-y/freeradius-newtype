import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { tenants } from "../schema/tenants";
import { tenantPortalSettings } from "../schema/portal";
import { globalSettings } from "../schema/settings";
import { userinfo } from "../schema/userinfo";
import { userOrganizations } from "../schema/organizations";
import { radcheck, radusergroup, radreply } from "../schema/freeradius";
import axios from "axios";

// Helper to get OAuth Config
const getOAuthConfig = async (tenantId: string, provider: "google" | "line") => {
  const portalSet = await db.query.tenantPortalSettings.findFirst({
    where: eq(tenantPortalSettings.tenantId, tenantId),
  });
  
  const globalSet = await db.query.globalSettings.findFirst();

  if (provider === "google") {
    return {
      clientId: portalSet?.googleClientIdOverride || globalSet?.googleClientId,
      clientSecret: portalSet?.googleClientSecretOverride || globalSet?.googleClientSecret,
    };
  } else {
    return {
      clientId: portalSet?.lineChannelIdOverride || globalSet?.lineChannelId,
      clientSecret: portalSet?.lineChannelSecretOverride || globalSet?.lineChannelSecret,
    };
  }
};

// 1. Generate Auth URL (Redirect endpoint)
export const socialLoginRedirect = async (
  request: FastifyRequest<{ Params: { tenantId: string; provider: "google" | "line" }, Querystring: any }>,
  reply: FastifyReply
) => {
  const { tenantId, provider } = request.params;
  
  const config = await getOAuthConfig(tenantId, provider);
  if (!config.clientId || !config.clientSecret) {
    return reply.code(400).send({ error: `${provider} login is not configured for this tenant.` });
  }

  const query = request.query as any;
  const stateObj = {
    tenantId,
    linkLogin: query["link-login"] || query.linkLogin || "",
    mac: query.mac || "",
    ip: query.ip || "",
    dst: query.dst || "",
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString("base64url");
  
  const redirectUri = `${request.protocol}://${request.host}/api/v1/auth/social/callback/${provider}`;

  let authUrl = "";
  if (provider === "google") {
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&state=${state}`;
  } else if (provider === "line") {
    authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;
  }

  return reply.redirect(authUrl);
};

// 2. Callback Handler
export const socialLoginCallback = async (
  request: FastifyRequest<{ Params: { provider: "google" | "line" }, Querystring: { code: string; state: string; error?: string } }>,
  reply: FastifyReply
) => {
  const { provider } = request.params;
  const query = request.query as any;
  const { code, state, error } = query;

  if (error || !code || !state) {
    return reply.code(400).send({ error: error || "Missing code or state" });
  }

  // Parse state
  let stateObj: any;
  try {
    stateObj = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
  } catch (e) {
    return reply.code(400).send({ error: "Invalid state parameter" });
  }

  const { tenantId, linkLogin, mac, dst } = stateObj;
  
  // Get config
  const config = await getOAuthConfig(tenantId, provider);
  const redirectUri = `${request.protocol}://${request.host}/api/v1/auth/social/callback/${provider}`;

  let socialId = "";
  let email = "";
  let name = "";

  try {
    if (provider === "google") {
      const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const userInfoRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });
      socialId = `google_${userInfoRes.data.id}`;
      email = userInfoRes.data.email;
      name = userInfoRes.data.name;
    } else if (provider === "line") {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", redirectUri);
      params.append("client_id", config.clientId!);
      params.append("client_secret", config.clientSecret!);

      const tokenRes = await axios.post("https://api.line.me/oauth2/v2.1/token", params.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const userInfoRes = await axios.get("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });
      socialId = `line_${userInfoRes.data.userId}`;
      name = userInfoRes.data.displayName;
      // LINE email requires OpenID scope and JWT decode, simplified for now
    }
  } catch (e: any) {
    request.log.error(e.response?.data || e.message);
    return reply.code(500).send({ error: "Failed to authenticate with social provider" });
  }

  // Database Flow
  const username = socialId;
  const password = socialId; // Use socialId as password for Hotspot

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant || tenant.status !== "active") {
    return reply.code(403).send({ error: "Tenant is inactive or not found" });
  }

  const existingUser = await db.query.radcheck.findFirst({
    where: and(eq(radcheck.tenantId, tenantId), eq(radcheck.username, username)),
  });

  if (!existingUser) {
    // Check if social login is enabled
    const settings = await db.query.tenantPortalSettings.findFirst({
      where: eq(tenantPortalSettings.tenantId, tenantId),
    });
    if (settings && !settings.isSocialLoginEnabled) {
      return reply.code(403).send({ error: "Social login is disabled for this tenant" });
    }

    if (!tenant.defaultRegisterProfile) {
      return reply.code(400).send({ error: "Tenant default profile not configured." });
    }

    // Register User
    await db.transaction(async (tx) => {
      await tx.insert(radcheck).values({
        tenantId, username, attribute: "Cleartext-Password", op: ":=", value: password,
      });
      await tx.insert(radusergroup).values({
        tenantId, username, groupname: tenant.defaultRegisterProfile!, priority: 1,
      });
      // Store in userinfo
      await tx.insert(userinfo).values({
        tenantId,
        username,
        firstName: name || "Social User",
        lastName: "",
        email: email || null,
      });
      // Bind to default group if configured
      if (settings && settings.defaultRegisterGroupId) {
        await tx.insert(userOrganizations).values({
          tenantId,
          username,
          organizationId: settings.defaultRegisterGroupId,
        });
      }
    });
  }

  // Redirect back to Captive Portal (linkLogin)
  if (linkLogin) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Authenticating...</title></head>
      <body>
        <form id="loginForm" method="POST" action="${linkLogin}">
          <input type="hidden" name="username" value="${username}" />
          <input type="hidden" name="password" value="${password}" />
          ${dst ? `<input type="hidden" name="dst" value="${dst}" />` : ''}
        </form>
        <script>document.getElementById('loginForm').submit();</script>
      </body>
      </html>
    `;
    reply.header('Content-Type', 'text/html');
    return reply.send(html);
  } else {
    // Fallback if no linkLogin
    return reply.send({ message: "Social login successful", username, password });
  }
};
