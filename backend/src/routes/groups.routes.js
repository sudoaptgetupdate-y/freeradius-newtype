import { z } from "zod";
import { getGroups, createGroup, updateGroup, deleteGroup, bulkDisableGroupUsers, bulkDeleteGroupUsers } from "../controllers/groups.controller";
export default async function groupsRoutes(server) {
    // Pre-handler hook to ensure authentication
    server.addHook("preHandler", server.authenticate);
    // Schema for creating/updating a group
    const groupSchema = z.object({
        name: z.string().min(1, "Group name is required"),
        defaultProfile: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
    });
    server.get("/", {
        schema: {
            tags: ["Groups"],
            description: "Get all user groups",
        }
    }, getGroups);
    server.post("/", {
        schema: {
            tags: ["Groups"],
            description: "Create a new user group",
            body: groupSchema,
        }
    }, createGroup);
    server.put("/:id", {
        schema: {
            tags: ["Groups"],
            description: "Update a user group",
            params: z.object({ id: z.string().uuid() }),
            body: groupSchema,
        }
    }, updateGroup);
    server.delete("/:id", {
        schema: {
            tags: ["Groups"],
            description: "Soft delete a user group",
            params: z.object({ id: z.string().uuid() }),
        }
    }, deleteGroup);
    server.post("/:id/bulk-disable", {
        schema: {
            tags: ["Groups"],
            description: "Bulk suspend all users in a group",
            params: z.object({ id: z.string().uuid() }),
        }
    }, bulkDisableGroupUsers);
    server.post("/:id/bulk-delete", {
        schema: {
            tags: ["Groups"],
            description: "Bulk delete all users in a group",
            params: z.object({ id: z.string().uuid() }),
        }
    }, bulkDeleteGroupUsers);
}
//# sourceMappingURL=groups.routes.js.map