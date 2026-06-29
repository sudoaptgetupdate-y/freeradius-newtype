import type { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/auth.service";
import type { LoginInput } from "../services/auth.service";

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const input = request.body as LoginInput;
    const user = await authService.login(input);

    // Generate JWT
    const token = await reply.jwtSign(user);

    // Set HttpOnly Cookie (Security Best Practice)
    reply.setCookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.send({
      message: "Login successful",
      token,
      user,
    });
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      return reply.code(401).send({ error: "Unauthorized", message: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
};
