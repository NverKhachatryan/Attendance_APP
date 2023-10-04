import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma"; // Import your Prisma client

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { attendances } = req.body; // `attendances` is an array of updates

      // Check if the student exists and load their attendances
      for (let attendanceUpdate of attendances) {
        const { studentId, columnIndex, hours, subject } = attendanceUpdate;

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

        const existingAttendance = student.attendances.find(
          (attendance) => attendance.date === columnIndex
        );

        if (existingAttendance) {
          // If an attendance record for the given date already exists, update it
          await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              hours: hours, // Update the hours for this attendance record
              subject: subject,
            },
          });
        } else {
          // If no attendance record for the given date exists, create a new one
          await prisma.attendance.create({
            data: {
              date: columnIndex,
              hours: hours,
              student: {
                connect: { id: studentId },
              },
              subject: subject,
            },
          });
        }
      }
      res.status(200).json({ message: "Hours added successfully" });
    } catch (error) {
      console.error("Error adding student hours:", error);
      res.status(500).json({ error: "Failed to add hours" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
