// pages/api/getClassDatesAndAttendance.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const groupId = parseInt(req.query.groupId as string);

    try {
      const students = await prisma.student.findMany({
        where: { groupId },
        include: {
          attendances: {
            select: {
              hours: true,
            },
          },
          group: {
            include: {
              subjects: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      res.status(200).json({ students });
    } catch (error) {
      console.error("Error fetching class dates and attendance:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch class dates and attendance" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
