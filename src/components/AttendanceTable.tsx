import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

interface DayAttendance {
  day: number;
  present: boolean;
}

interface Student {
  id: number;
  name: string;
  attendances: {
    [subject: string]: { date: string; hours: number; }[];
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
  const initializeDaysAttendance = (students: any, columnDates: any) => {
    return students.map(() => {
      return columnDates.map(() => 0);
    });
  };
  const months = ["September", "October", "November", "December"];
  const [activeMonth, setActiveMonth] = useState<string>("September");

  const monthPrefix = (months.indexOf(activeMonth) + 9).toString().padStart(2, '0') + "-"; // Convert index to "09-", "10-", etc.

  const [columnDates, setColumnDates] = useState<string[]>(Array.from(
    new Set(
      studentName.flatMap((student) => {
        const attendances = student.attendances[title] || {};
        return Object.values(attendances)
          .filter((record) => record.date.startsWith(monthPrefix))
          .map((record) => record.date);
      })
    )
  ));
  const [newDate, setNewDate] = useState<string>("");
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [filterOption, setFilterOption] = useState<string>("Show All"); // Default to "Show All"
  const router = useRouter();
  const [localDaysAttendance, setLocalDaysAttendance] = useState(
    initializeDaysAttendance(studentName, columnDates)
  );

  const handleHoursChange = (studentIndex: number, dayIndex: number, value: number) => {
    const updatedAttendance = [...daysAttendance];
    updatedAttendance[studentIndex][dayIndex] = value;
    setDaysAttendance(updatedAttendance);
  };

  const syncAttendanceWithServer = async () => {
    try {
      const attendanceUpdates: AttendanceUpdate[] = [];
      studentName.forEach((student, studentIndex) => {
        columnDates.forEach((date, columnIndex) => {
          const hours = daysAttendance[studentIndex][columnIndex];
          if (hours > 0) { // Only include values greater than 0
            attendanceUpdates.push({
              studentId: student.id,
              columnIndex: date,
              hours: hours,
              subject: title
            });
          }
        });
      });

      await fetch('/api/addStudentHours', {  // renamed for clarity
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendances: attendanceUpdates })
      });
      router.reload();
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
    const allDates = studentName.flatMap((student) =>
      Object.values(student.attendances[title] || {})
    );
    const uniqueDates = Array.from(new Set(allDates)).sort();
    const filteredDates = uniqueDates
      .filter((dateObj) => dateObj.date.startsWith(monthPrefix))
      .map((dateObj) => dateObj.date); // Extract only the date property

    const data = Array.from(new Set(filteredDates));
    console.log(data, "data");
    setColumnDates(data);
  }, [studentName, activeMonth]);

  const getTotalHoursForSubject = (studentIndex: number, subject: string): number => {
    const student = studentName[studentIndex];
    const attendances = student.attendances[subject];

    if (!attendances) {
      return 0;
    }

    // Calculate the total hours for the subject
    const totalHours = attendances.reduce((acc, record) => acc + record.hours, 0);

    return totalHours;
  };

  const getTotalHoursForStudent = (student: Student): number => {
    const subjects = Object.keys(student.attendances);

    // Calculate the total hours across all subjects for the student
    const totalHours = subjects.reduce((acc, subject) => {
      const attendances = student.attendances[subject];
      const subjectTotal = attendances.reduce((subjectAcc, record) => subjectAcc + record.hours, 0);
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
    let result = studentName.slice(); // Copy the original data

    // Sort students
    result = sortStudents(result);

    // Filter students
    result = filterStudents(result);

    return result;
  }, [studentName, sortDescending, filterOption]);
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
                  <td className="border p-2">{student.name}</td>
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
              <Tab
                key={month}
                onClick={() => {
                  setActiveMonth(month);
                  setColumnDates((prev) => [...prev]);
                }}
              >
                {month}
              </Tab>
            ))}
            <Tab onClick={() => setActiveMonth("Total")}>Total</Tab>
          </TabList>

          {months.map((month, index) => (
            <TabPanel key={month}>
              {month === activeMonth && (
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
                  <button onClick={syncAttendanceWithServer} className="ml-5 mb-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save Changes</button>
                  {activeTab !== "Total" && (
                    <table className="w-full border">
                      <thead>
                        <tr>
                          <th className="border p-2"></th>
                          {columnDates.map((date, columnIndex) => (
                            <th key={columnIndex} className="border p-2 text-center">
                              {date}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {studentName.map((studentAttendance, studentIndex) => (
                          <tr key={studentIndex}>
                            <td className="border p-2">{studentAttendance.name}</td>
                            {columnDates.map((date, columnIndex) => {
                              const hours = Number(
                                studentAttendance.attendances[title].find(
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
                                    defaultValue={hours}
                                    onChange={(e) => {
                                      handleHoursChange(studentIndex, columnIndex, parseInt(e.target.value));
                                    }}
                                    className="w-16 text-center"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
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
                  {studentName.map((student, studentIndex) => (
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
    </div>
  );
};

export default AttendanceTable;
