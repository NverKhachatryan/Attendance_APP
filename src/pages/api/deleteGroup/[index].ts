// pages/api/deleteGroup/[groupId].js
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    const groupId = Number(req.query.index);

    try {
      // Delete students belonging to the group
      await prisma.student.deleteMany({
        where: {
          groupId: groupId,
        },
      });

      // Delete subjects belonging to the group
      await prisma.subject.deleteMany({
        where: {
          groupId: groupId,
        },
      });

      // Finally, delete the group itself
      await prisma.group.delete({
        where: { id: groupId },
      });

      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
