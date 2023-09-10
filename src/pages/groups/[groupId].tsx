import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AttendanceTable from "@/components/AttendanceTable";
import { Button, Label, Modal, TextInput, Textarea } from "flowbite-react";
import CustomModal from "@/components/CustomModal";
import DropDownTargetNarrative from "@/components/DropDownNarrative";
import { GetServerSideProps } from "next";
import { prisma } from "../../../lib/prisma";
import { addClassToGroup } from "@/util";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.groupId as string;
  const drafts = await prisma.student.findMany({
    where: {
      groupId: parseInt(id), // Convert id to an integer and use it in the query
    },
    include: {
      attendances: true, // Include the related attendances
    },
  });
  // Convert Date objects to strings

  return {
    props: { drafts },
  };
};

type Props = {
  drafts: any;
};

interface DayAttendance {
  date: any;
  hours: number;
  day: number;
  present: boolean;
}

interface Student {
  id: number;
  name: string;
  attendances: DayAttendance[];
}

const StudentAttendancePage: React.FC<Props> = (props) => {
  const student = props.drafts;
  const students: Student[] = student;
  const router = useRouter();
  const { groupId } = router.query;
  const id = Number(groupId);
  const [show, setShow] = useState<boolean>(false);
  const [show1, setShow1] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Total"); // 'total' is the default tab
  const transformedStudents = students.map((student) => {
    return {
      ...student,
      attendances: student.attendances.reduce<{ [key: string]: number }>((acc, attendance) => {
        acc[attendance.date] = attendance.hours;
        return acc;
      }, {}),
    };
  });

  const maxLength = Math.max(...students.map((s) => s.attendances.length));

  const [classAttendance, setClassAttendance] = useState<{
    [key: string]: number[][];
  }>({
    Total: transformedStudents.map(() => new Array(maxLength).fill(0)),
  });

  const [classDates, setClassDates] = useState<string[]>([]);

  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");

  const fetchClassDates = async () => {
    try {
      const response = await fetch(
        `/api/getClassDatesAndAttendance?groupId=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        setClassDates(data.classDates);
      }
    } catch (error) {
      console.error("Error fetching class dates and attendance:", error);
    }
  };

  useEffect(() => {
    fetchClassDates();
  }, []);

  const handleCreateStudent = async () => {
    try {
      // Make a POST request to create a student within the specific group
      if (!isNaN(id)) {
        // Make a POST request to create a student within the specific group
        await fetch("/api/createStudent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: studentName, id }), // Send groupId as an integer
        });
        // After student creation is complete, you can perform any necessary actions
        // For example, you can reset the form or update the UI
        setStudentName("");
        setShow(!show);
        window.location.reload();
      } else {
        console.error("Invalid groupId:", groupId);
      }
    } catch (error) {
      console.error("Error creating student:", error);
      // Handle the error appropriately, such as displaying an error message to the user
    }
  };

  const handleAddClass = async (e: any) => {
    e.preventDefault();

    try {
      const newClass = await addClassToGroup(id, className);
      // Handle success, e.g., show a success message or update the UI
      setClassAttendance((prevAttendance) => ({
        ...prevAttendance,
        [className]: transformedStudents.map(() =>
          new Array(students[0].attendances.length).fill(0)
        ),
      }));
      // setClassDates((prevDates) => [...prevDates, newClass.date]); // Add the date
      setShow1(!show1);
      setClassName("");
    } catch (error) {
      console.log(error);
      setClassName("");
    }
  };

  return (
    <div className="p-4">
      <CustomModal isOpen={show} onClose={() => setShow(false)} size={"medium"}>
        <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Create a Student
          </h3>
          <form className="space-y-6" onSubmit={handleCreateStudent}>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Student Name
              </label>
              <input
                type="text"
                name="text"
                id="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="John Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
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

      <CustomModal
        isOpen={show1}
        onClose={() => setShow1(false)}
        size={"medium"}
      >
        <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Create a Class
          </h3>
          <form className="space-y-6" onSubmit={handleAddClass}>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Class Name
              </label>
              <input
                type="text"
                name="text"
                id="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
                placeholder="John Doe"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Add class
            </button>
          </form>
        </div>
      </CustomModal>
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold mb-4">
          Student Attendance for Group {id}
        </h1>
        <div className="flex flex-row">
          <button
            onClick={() => {
              setShow1(!show1);
            }}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Add Class
          </button>
          <button
            onClick={() => setShow(true)}
            className="ml-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Create a student
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div>
          <AttendanceTable
            key={activeTab}
            title={`${activeTab} Class Attendance`}
            studentName={transformedStudents}
            daysAttendance={classAttendance[activeTab]}
            setDaysAttendance={(day) => day}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentAttendancePage;
