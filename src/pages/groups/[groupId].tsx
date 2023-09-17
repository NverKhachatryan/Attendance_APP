import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AttendanceTable from "@/components/AttendanceTable";
import { Button, Label, Modal, TextInput, Textarea } from "flowbite-react";
import CustomModal from "@/components/CustomModal";
import DropDownTargetNarrative from "@/components/DropDownNarrative";
import { GetServerSideProps } from "next";
import { prisma } from "../../../lib/prisma";
import { addClassToGroup } from "@/util";
import { TabList, Tab, TabPanel, Tabs } from "react-tabs";
import { useSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";

export const getServerSideProps: GetServerSideProps = async ({ req, res, params }) => {
  const token = await getToken({ req })
  if (!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
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
  studentId: any;
  date: any;
  hours: number;
  day: number;
  present: boolean;
  subject: string;
}

interface Student {
  id: number;
  name: string;
  attendances: DayAttendance[];
}

interface TabData {
  name: string;
  // Add other properties as needed
}

const StudentAttendancePage: React.FC<Props> = (props) => {

  const [students, setStudents] = useState<Student[]>(props.drafts);
  const router = useRouter();
  const { groupId } = router.query;
  const id = Number(groupId);
  const [show, setShow] = useState<boolean>(false);
  const [show1, setShow1] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Total"); // 'total' is the default tab

  const maxLength = Math.max(...students.map((s) => s.attendances.length));

  const [classNames, setClassNames] = useState<string[]>(["Total"]); // Initial value with "Total" tab

  const transformedStudents = useMemo(() => {
    return students.map((student) => {
      const attendancesBySubject: { [subject: string]: { date: string, hours: number }[] } = {};

      // Iterate through the classNames (subjects) and populate attendances for each subject
      classNames.forEach((subject) => {
        const subjectAttendances = student.attendances.filter((attendance) => attendance?.subject === subject);
        attendancesBySubject[subject] = subjectAttendances.map((attendance) => ({
          date: attendance.date,
          hours: attendance.hours,
          studentId: attendance.studentId,
        }));
      });

      return {
        ...student,
        attendances: attendancesBySubject,
      };
    });
  }, [students, classNames]);

  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [classAttendance, setClassAttendance] = useState<{
    [subject: string]: {
      [month: string]: number[][];
    };
  }>({
    Total: {
      September: transformedStudents.map(() => new Array(maxLength).fill(0)),
    },
  });

  const fetchClassDates = async () => {
    try {
      const response = await fetch(
        `/api/getClassDatesAndAttendance?groupId=${id}`
      );
      if (response.ok) {
        const data = await response.json();
        if(data.students[0]){
          setClassNames((prev) => [
            prev[0],
            ...data?.students[0]?.group.subjects.map((item: any) => item?.name)
          ]);
        }
      
      }
    } catch (error) {
      console.error("Error fetching class dates and attendance:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/getStudents?groupId=${id}`);
      if (response.ok) {
        const updatedStudents = await response.json();
        setStudents(updatedStudents);
      } else {
        console.error("Error fetching students:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching students:", error);
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
        setStudentName("");
        setShow(!show);
        fetchStudents();

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

      setClassName(""); // Clear the input field
      setShow1(false);
      router.reload();
    } catch (error) {
      console.error("Error adding class:", error);
      setClassName("");
    }
  };

  const updateDaysAttendance = (
    newAttendanceForActiveTab: number[][],
    subject: string,
    month: string
  ) => {
    setClassAttendance((prevAttendance) => ({
      ...prevAttendance,
      [subject]: {
        ...prevAttendance[subject],
        [month]: newAttendanceForActiveTab,
      },
    }));
  };

  const fetchData = async () => {
    try {
      // Make a request to your server to get the tab data
      const response = await fetch("/api/getSubjectData"); // Adjust the endpoint URL

      if (!response.ok) {
        throw new Error("Failed to fetch class data");
      }

      const data: TabData[] = await response.json();

      const updatedClassAttendance: {
        [subject: string]: {
          [month: string]: number[][];
        };
      } = { ...classAttendance };

      data.forEach((tabData) => {
        updatedClassAttendance[tabData.name] = {
          September: transformedStudents.map(() => new Array(maxLength).fill(0)),
          // Add more months as needed
        };
      });

      setClassAttendance(updatedClassAttendance);
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

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
        <Tabs>
          <TabList>
            {classNames.map((className) => (
              <Tab
                key={className}
                onClick={() => {
                  setActiveTab(className);
                }}
              >
                {className}
              </Tab>
            ))}
          </TabList>

          {Object.entries(classAttendance).map(([subject, monthsData]) =>
            Object.entries(monthsData).map(([month, daysAttendance]) => (
              <TabPanel key={`${subject}-${month}`}>
                {(
                  <>
                    <AttendanceTable
                      title={subject}
                      activeTab={activeTab}
                      studentName={transformedStudents}
                      daysAttendance={daysAttendance}
                      setDaysAttendance={(newAttendance) =>
                        updateDaysAttendance(newAttendance, subject, month)
                      }
                    />
                  </>
                )}
              </TabPanel>
            ))
          )}

        </Tabs>

      </div>
    </div>
  );
};

export default StudentAttendancePage;
