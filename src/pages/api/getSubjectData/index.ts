// pages/api/classes/getData.js
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Retrieve tab data from your database (Prisma)
      const tabData = await prisma.subject.findMany(); // Adjust the query as needed

      res.status(200).json(tabData);
    } catch (error) {
      console.error("Error fetching tab data:", error);
      res.status(500).json({ error: "Failed to fetch tab data" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
