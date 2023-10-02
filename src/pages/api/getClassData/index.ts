// pages/api/classes/getSubjects.js
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '../../../../lib/prisma'; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const groupId = req.body.groupId;

      // Check if groupId is provided
      if (!groupId) {
        return res.status(400).json({ error: "groupId is required" });
      }

      // Retrieve all subjects for the given groupId
      const subjects = await prisma.subject.findMany({
        where: {
          groupId: Number(groupId),
        },
      });

      res.status(200).json(subjects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to retrieve subjects" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
