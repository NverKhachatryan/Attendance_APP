// pages/index.tsx

import CustomModal from "@/components/CustomModal";
import Link from "next/link";
import { useState } from "react";
import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const drafts = await prisma.group.findMany({
    where: {
      name: {},
    },
  });
  return {
    props: { drafts },
  };
};

type Props = {
  drafts: any;
};

const HomePage: React.FC<Props> = (props) => {
  const groups = props?.drafts;
  const [show, setShow] = useState<boolean>(false);
  const [groupName, setGroupName] = useState("");

  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      const body = { groupName };
      await fetch("/api/createGroup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      setShow(!show);
      window.location.reload();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("error: ", error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold mb-4">Select a Group:</h1>
        <button
          onClick={() => setShow(true)}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Create a group
        </button>
      </div>

      <ul className="space-y-2">
        {groups.map((group: any) => (
          <li key={group.id}>
            <Link href={`/groups/${group.id}`} legacyBehavior>
              <a className="text-blue-600 hover:underline">{group.name}</a>
            </Link>
          </li>
        ))}
      </ul>
      <CustomModal isOpen={show} onClose={() => setShow(false)} size={"medium"}>
        <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Create a Group
          </h3>
          <form className="space-y-6" onSubmit={submitData}>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Group Name
              </label>
              <input
                type="text"
                name="text"
                id="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="Math"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Add student
            </button>
          </form>
        </div>
      </CustomModal>
    </div>
  );
};

export default HomePage;
