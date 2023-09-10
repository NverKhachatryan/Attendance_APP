// pages/api/classes/create.js
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '../../../../lib/prisma'; // Import your Prisma client


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { groupId, name } = req.body;

      // Check if the group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Create a new class (subject) for the group
      const newClass = await prisma.subject.create({
        data: {
          name,
          groupId,
        },
      });

      res.status(201).json(newClass);
    } catch (error) {
      res.status(500).json({ error: "Failed to create class" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
