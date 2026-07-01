import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUsers, createUser, updateUser, deleteUser, getUserDetails, restoreUser, permanentDeleteUser } from "../controllers/users.controller";
import { bulkDisableUsers, bulkEnableUsers, bulkDeleteUsers, bulkTransferUsers } from "../controllers/users.bulk.controller";

export const usersRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/", getUsers);
  fastify.get("/:username/details", getUserDetails);
  fastify.post("/", createUser);
  fastify.put("/:username", updateUser);

  fastify.delete("/:username", {
    schema: {
      tags: ["Users"],
      description: "Move a user to the trash bin (soft delete)",
      params: z.object({ username: z.string() })
    }
  }, deleteUser);

  fastify.post("/:username/restore", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Restore a user from the trash bin",
      params: z.object({ username: z.string() })
    }
  }, restoreUser);

  fastify.delete("/:username/permanent", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Permanently delete a user",
      params: z.object({ username: z.string() })
    }
  }, permanentDeleteUser);

  // --- Bulk Endpoints ---

  fastify.post("/bulk-disable", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Bulk suspend users",
      body: z.object({ usernames: z.array(z.string()) })
    }
  }, bulkDisableUsers);

  fastify.post("/bulk-enable", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Bulk reactivate users",
      body: z.object({ usernames: z.array(z.string()) })
    }
  }, bulkEnableUsers);

  fastify.post("/bulk-delete", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Bulk soft-delete users",
      body: z.object({ usernames: z.array(z.string()) })
    }
  }, bulkDeleteUsers);

  fastify.post("/bulk-transfer", {
    preValidation: [fastify.authenticate, fastify.requireTenantAdmin],
    schema: {
      tags: ["Users"],
      description: "Bulk transfer users to a new group",
      body: z.object({ usernames: z.array(z.string()), targetGroupId: z.string().uuid() })
    }
  }, bulkTransferUsers);
};
