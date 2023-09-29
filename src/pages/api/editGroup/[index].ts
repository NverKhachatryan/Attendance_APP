import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res:NextApiResponse) {

  if (req.method === "PUT") {
    const { selectedGroupId, groupName } = req.body;

    try {
      const updatedGroup = await prisma.group.update({
        where: { id: selectedGroupId },
        data: {
          name: groupName,
        },
      });

      res.status(200).json(updatedGroup);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
