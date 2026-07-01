import { buildApp } from "./app";
import dotenv from "dotenv";
import { CleanupService } from "./services/cleanup.service";
dotenv.config();
const start = async () => {
    const app = await buildApp();
    const PORT = parseInt(process.env.PORT || "8000", 10);
    try {
        await app.listen({ port: PORT, host: "0.0.0.0" });
        CleanupService.start();
        app.log.info(`Server running on port ${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        CleanupService.stop();
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map