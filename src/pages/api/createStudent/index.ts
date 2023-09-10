// pages/api/createStudent.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma'; // Import your Prisma client


export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      // Extract student data from the request body
      const { name, id } = req.body;

      // Create the student in your database using Prisma
      const createdStudent = await prisma.student.create({
        data: {
          name,
          groupId: id,
        },
      });

      res.status(201).json({ message: 'Student created successfully', student: createdStudent });
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'An error occurred while creating the student' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
