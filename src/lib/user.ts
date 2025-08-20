import { prisma } from "./db";
import { currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
  const user = await currentUser();

  if (!user) return null;

  // Verificar si usuario existe en nuestra DB
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  // Si no existe, crearlo
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
      },
    });
  }

  return dbUser;
}
