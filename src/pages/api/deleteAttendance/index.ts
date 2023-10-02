// pages/api/deleteAttendance.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'DELETE') {
    try {
      // Delete all attendance records
      await prisma.attendance.deleteMany({});

      res.status(200).json({ message: 'Attendance history deleted successfully' });
    } catch (error) {
      console.error('Error deleting attendance history:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
