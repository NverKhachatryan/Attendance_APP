// pages/api/classes/delete.js
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from '../../../../lib/prisma'; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    try {
      const id = req.body.id;


      // Check if the subject (class) exists
      const existingSubject = await prisma.subject.findUnique({
        where: { id: Number(id) },
      });

      if (!existingSubject) {
        return res.status(404).json({ error: "Subject not found" });
      }

      // Delete the subject
      await prisma.subject.delete({
        where: { id: Number(id) },
      });

      res.status(200).json({ message: "Subject deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subject" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
