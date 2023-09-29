// pages/api/editStudent.js

import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body } = req;

  if (method === 'POST') {
    const { studentId, selectedStudent } = body;

    try {
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { name: selectedStudent },
      });

      res.status(200).json(updatedStudent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
