// pages/api/deleteStudent.js
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body } = req;

  if (method === "DELETE") {
    const { studentId } = body;

    try {
      await prisma.attendance.deleteMany({
        where: { studentId },
      });

      // Then delete the student
      const deletedStudent = await prisma.student.delete({
        where: { id: studentId },
      });

      res.status(200).json(deletedStudent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
