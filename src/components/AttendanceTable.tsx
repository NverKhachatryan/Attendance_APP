import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import axios from "axios";
import CustomModal from "./CustomModal";
import { Button } from "flowbite-react";

interface DayAttendance {
  day: number;
  present: boolean;
}

interface Student {
  id: number;
  name: string;
  isPresent: boolean;
  attendances: {
    [subject: string]: { date: string; hours: number }[];
  };
}

interface AttendanceTableProps {
  title: string;
  activeTab: string;
  studentName: Student[];
  daysAttendance: number[][];
  setDaysAttendance: (attendance: number[][]) => void;
}

interface MonthlyAttendance {
  [key: string]: number; // This allows indexing by string
}

interface MonthsAttendance {
  September: MonthlyAttendance;
  October: MonthlyAttendance;
  November: MonthlyAttendance;
  December: MonthlyAttendance;
}

type AttendanceUpdate = {
  studentId: number;
  columnIndex: string;
  hours: number;
  subject: string;
};

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  title,
  activeTab,
  daysAttendance,
  studentName,
  setDaysAttendance,
}) => {
  const getCurrentMonth = () => {
    const currentDate = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[currentDate.getMonth()];
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonth());
  const sortedStudents = [...studentName].sort((a, b) => a.id - b.id);
  const [student, setStudent] = useState(sortedStudents);
  const [show, setShow] = useState<boolean>(false);

  const monthPrefix =
    (months.indexOf(activeMonth) + 1).toString().padStart(2, "0") + "-"; // Convert index to "09-", "10-", etc.

  const [columnDates, setColumnDates] = useState<string[]>(
    Array.from(
      new Set(
        sortedStudents.flatMap((student) => {
          const attendances = student.attendances[title] || {};
          return Object.values(attendances)
            .filter((record) => record.date.startsWith(monthPrefix))
            .map((record) => record.date);
        })
      )
    )
  );
  const [newDate, setNewDate] = useState<string>("");
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [filterOption, setFilterOption] = useState<string>("Show All"); // Default to "Show All"
  const [selectedStudent, setSelectedStudent] = useState(student[0]);
  const router = useRouter();

  const handleHoursChange = (
    studentIndex: number,
    dayIndex: number,
    value: number
  ) => {
    setStudent((prevStudents) => {
      const updatedStudents = [...prevStudents];
      const title = activeTab;
      const date = columnDates[dayIndex];

      // Check if the attendance for the given date exists
      const existingAttendance = updatedStudents[studentIndex].attendances[title].find(entry => entry.date === date);
  
      if (existingAttendance) {
        // Update existing attendance entry
        existingAttendance.hours = value;
      } else {
        // Create a new attendance entry
        updatedStudents[studentIndex].attendances[title].push({
          date,
          hours: value,
        });
      }
  
      return updatedStudents;
    });

    const updatedAttendance = [...daysAttendance];
    updatedAttendance[studentIndex][dayIndex] = value;

    setDaysAttendance(updatedAttendance);
  };

  const handleTabsClick = (month: string) => {
    setActiveMonth(month);
    setColumnDates((prev) => [...prev]);
  };
  const syncAttendanceWithServer = async () => {
    try {
      const attendanceUpdates: AttendanceUpdate[] = [];
      sortedStudents.forEach((student, studentIndex) => {
        columnDates.forEach((date, columnIndex) => {
          const hours = daysAttendance[studentIndex][columnIndex];
            // Only include values greater than 0
            attendanceUpdates.push({
              studentId: student.id,
              columnIndex: date,
              hours: hours,
              subject: title,
            });
        });
      });

      await fetch("/api/addStudentHours", {
        // renamed for clarity
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendances: attendanceUpdates }),
      });
      setTimeout(() => router.reload(), 3000);
    } catch (error) {
      console.error("Error syncing attendance:", error);
    }
  };

  const addColumn = (date: string) => {
    const newDateMonth = date.slice(5, 10);
    setColumnDates((prev) => [...prev, newDateMonth]);
  };

  useEffect(() => {
    // Extract all unique dates (subject names) from studentName
    const allDates = sortedStudents.flatMap((student) =>
      Object.values(student.attendances[title] || {})
    );
    const uniqueDates = Array.from(new Set(allDates)).sort();
    const filteredDates = uniqueDates
      .filter((dateObj) => dateObj.date.startsWith(monthPrefix))
      .map((dateObj) => dateObj.date); // Extract only the date property

    const data = Array.from(new Set(filteredDates));
    setColumnDates(data);
  }, [studentName, activeMonth]);

  const getTotalHoursForSubject = (
    studentIndex: number,
    subject: string
  ): number => {
    const student = sortedStudents[studentIndex];
    const attendances = student.attendances[subject];

    if (!attendances) {
      return 0;
    }

    // Calculate the total hours for the subject
    const totalHours = attendances.reduce(
      (acc, record) => acc + record.hours,
      0
    );

    return totalHours;
  };

  const getTotalHoursForStudent = (student: Student): number => {
    const subjects = Object.keys(student.attendances);

    // Calculate the total hours across all subjects for the student
    const totalHours = subjects.reduce((acc, subject) => {
      const attendances = student.attendances[subject];
      const subjectTotal = attendances.reduce(
        (subjectAcc, record) => subjectAcc + record.hours,
        0
      );
      return acc + subjectTotal;
    }, 0);

    return totalHours;
  };

  const sortStudents = (students: Student[]) => {
    return students.slice().sort((a, b) => {
      const totalA = getTotalHoursForStudent(a);
      const totalB = getTotalHoursForStudent(b);

      if (sortDescending) {
        return totalB - totalA;
      } else {
        return totalA - totalB;
      }
    });
  };

  const filterStudents = (students: Student[]) => {
    return students.filter((student) => {
      const totalHours = getTotalHoursForStudent(student);

      if (filterOption === "Show 100-150 Hours") {
        return totalHours >= 100 && totalHours <= 150;
      } else if (filterOption === "Show 150+ Hours") {
        return totalHours > 150;
      }

      // Default: Show All
      return true;
    });
  };

  // Apply sorting and filtering to student data
  const sortedAndFilteredStudents = useMemo(() => {
    let result = sortedStudents.slice(); // Copy the original data

    // Sort students
    result = sortStudents(result);

    // Filter students
    result = filterStudents(result);

    return result;
  }, [studentName, sortDescending, filterOption]);

  const handleCheckboxChange = async (student: any) => {
    const updatedStudent = await axios.post("/api/addIsPresent", {
      studentId: student.id,
      isPresent: !student.isPresent, // Toggle the value
    });
    router.reload();
    // Handle the updatedStudent response as needed
  };

  const handleDeleteClick = async (student: any) => {
    try {
      await axios.delete("/api/deleteStudent", {
        data: { studentId: student },
      });
      router.reload();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handleEditClick = async (e: any) => {
    e.preventDefault();
    try {
      const updatedStudent = await axios.post("/api/editStudent", {
        studentId: selectedStudent.id,
        selectedStudent: selectedStudent.name,
      });
      setShow(!show);
      router.reload();
    } catch (error) {
      console.error("Error editing student:", error);
    }
  };

  const handleEditModalOpen = (studentId: number) => {
    const studentToEdit = student.filter(
      (human) => human.id == Number(studentId)
    );

    if (studentToEdit) {
      setSelectedStudent(studentToEdit[0]);
      setShow(true);
    } else {
      console.error("Student not found");
    }
  };
  
  return (
    <div className="p-4">
      {activeTab === "Total" ? (
        <Tab className="w-full">
          <div className="flex justify-end mb-3">
            <div>
              <button
                onClick={() => setSortDescending(!sortDescending)}
                className="ml-5 mb-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                {sortDescending ? "Sort Descending" : "Sort Ascending"}
              </button>
              <select
                onChange={(e) => setFilterOption(e.target.value)}
                className="ml-4 text-blue-600 hover:underline focus:outline-none"
              >
                <option value="Show All">Show All</option>
                <option value="Show 100-150 Hours">Show 100-150 Hours</option>
                <option value="Show 150+ Hours">Show 150+ Hours</option>
              </select>
            </div>
          </div>
          <table className="w-full border">
            <thead>
              <tr>
                <th className="border p-2">Student Name</th>
                <th className="border p-2 text-center">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className={
                    getTotalHoursForStudent(student) > 150
                      ? "bg-green-400"
                      : getTotalHoursForStudent(student) >= 100
                      ? "bg-orange-400"
                      : ""
                  }
                >
                  <td className="flex justify-between p-2">
                    <div>{student.name} </div>
                    <div className="flex justify-start">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={student.isPresent}
                          onChange={() => handleCheckboxChange(student)}
                        />
                        <span>{student.isPresent ? "Present" : "Absent"}</span>
                      </label>

                      <Button
                        onClick={() => handleEditModalOpen(student.id)}
                        className="bg-blue-500 mx-3"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(student.id)}
                        className="bg-blue-500"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                  <td className="border p-2 text-center">
                    {getTotalHoursForStudent(student)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tab>
      ) : (
        <Tabs>
          <TabList>
            {months.map((month) => (
              <Tab key={month} onClick={() => handleTabsClick(month)}>
                {month}
              </Tab>
            ))}
            <Tab onClick={() => setActiveMonth("Total")}>Total</Tab>
          </TabList>

          {months.map((month, index) => (
            <TabPanel key={month}>
              {month == activeMonth && (
                <>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (newDate) {
                        addColumn(newDate);
                      }
                    }}
                    className="ml-5 mb-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Add Column
                  </button>
                  <button
                    onClick={syncAttendanceWithServer}
                    className="ml-5 mb-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Save Changes
                  </button>
                  {activeTab !== "Total" && (
                    <table className="w-full border">
                      <thead>
                        <tr>
                          <th className="border p-2">Names</th>
                          {columnDates.map((date, columnIndex) => (
                            <th
                              key={columnIndex}
                              className="border p-2 text-center"
                            >
                              {date}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedStudents.map(
                          (studentAttendance, studentIndex) => (
                            <tr key={studentAttendance.id}>
                              <td className="border p-2">
                                {studentAttendance.name}
                              </td>
                              {columnDates.map((date, columnIndex) => {
                                const hours = Number(
                                  studentAttendance?.attendances[title].find(
                                    (entry) => entry.date === date
                                  )?.hours || 0
                                );
                                return (
                                  <td
                                    key={columnIndex}
                                    className="border p-2 text-center"
                                  >
                                    <input
                                      type="number"
                                      value={hours}
                                      onChange={(e) => {
                                        handleHoursChange(
                                          studentIndex,
                                          columnIndex,
                                          parseInt(e.target.value)
                                        );
                                      }}
                                      className="w-16 text-center"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </TabPanel>
          ))}
          <TabPanel>
            {activeMonth === "Total" && (
              <table className="w-full border">
                <thead>
                  <tr>
                    <th className="border p-2">Student Name</th>
                    <th className="border p-2 text-center">Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student, studentIndex) => (
                    <tr key={student.id}>
                      <td className="border p-2">{student.name}</td>
                      <td className="border p-2 text-center">
                        {getTotalHoursForSubject(studentIndex, title)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabPanel>
        </Tabs>
      )}
      <CustomModal isOpen={show} onClose={() => setShow(false)} size={"medium"}>
        <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">
            Create a Student
          </h3>
          <form className="space-y-6" onSubmit={handleEditClick}>
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
                value={selectedStudent?.name}
                onChange={(e) => {
                  setSelectedStudent((prevSelectedStudent) => ({
                    ...prevSelectedStudent,
                    name: e.target.value,
                  }));
                }}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Edit student name
            </button>
          </form>
        </div>
      </CustomModal>
    </div>
  );
};

export default AttendanceTable;
