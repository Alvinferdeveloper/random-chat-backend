import prisma from "../lib/prisma";

export async function roomExist(id: string) {
    const roomExist = await prisma.room.findUnique({
        where: {
            id
        }
    })
    return roomExist
}
