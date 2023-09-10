// pages/api/addStudentHours.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { studentId, columnIndex, hours } = req.body;

      // Check if the student exists and load their attendances
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          attendances: true,
        },
      });

      if (!student) {
        console.log("Debug: Student not found");
        return res.status(404).json({ error: "Student not found" });
      }

      // Check if the student has attendances and if it's an array
      if (!student.attendances || !Array.isArray(student.attendances)) {
        console.log("Debug: Invalid student attendances");
        return res.status(500).json({ error: "Invalid student attendances" });
      }

      await prisma.attendance.create({
        data: {
          date: columnIndex, // You may need to specify the date
          hours: hours, // Update the hours for this attendance record
          student: {
            connect: { id: studentId }, // Associate the attendance with the student
          },
        },
      });

      res.status(200).json({ message: "Hours added successfully" });
    } catch (error) {
      console.error("Error adding student hours:", error);
      res.status(500).json({ error: "Failed to add hours" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
