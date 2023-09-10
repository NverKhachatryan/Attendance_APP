// pages/api/createProject.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma'; // Import your Prisma client

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      // You can retrieve project data from the request body
      const { groupName } = req.body;

      // Create the project in your database using Prisma
      const createdProject = await prisma.group.create({
        data: {
          name: groupName
        },
      });

      res.status(201).json({ message: 'Project created successfully', project: createdProject });
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'An error occurred while creating the project' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
