import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./config/prisma.js";

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    const userCount = await prisma.user.count();

    console.log(`Database connected. Users: ${userCount}`);

    app.listen(PORT, () => {
      console.log(`ChatSpace API running on http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    console.error("Failed to start server:", error);

    await prisma.$disconnect();
    process.exitCode = 1;
  }
};

void startServer();
