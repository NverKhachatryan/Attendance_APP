import React, { useEffect, useState } from "react";
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
    [key: string]: number;
  };
}

interface AttendanceTableProps {
  title: string;
  studentName: Student[];
  daysAttendance: number[][];
  setDaysAttendance: (attendance: number[][]) => void;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  title,
  daysAttendance,
  studentName,
  setDaysAttendance,
}) => {
  const [columnDates, setColumnDates] = useState<string[]>([]);
  const [newDate, setNewDate] = useState<string>("");
  const months = ["September", "October", "November", "December"];
  const [activeMonth, setActiveMonth] = useState<string>("September");

  const addColumn = (date: string) => {
    const newDateMonth = date.slice(5, 10);
    setColumnDates((prev) => [...prev, newDateMonth]);

    const updatedAttendance = daysAttendance.map((studentHours) => [
      ...studentHours,
      0,
    ]);
    setDaysAttendance(updatedAttendance);
  };

  const updateStudentHours = async (
    studentId: any,
    columnIndex: any,
    hours: any
  ) => {
    try {
      await fetch("/api/addStudentHours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, columnIndex, hours }),
      });
    } catch (error) {
      console.error("Error adding student hours:", error);
    }
  };

  useEffect(() => {
    // Extract all unique dates from studentName and set them as columns
    const allDates = studentName.flatMap((student) =>
      Object.keys(student.attendances)
    );
    const uniqueDates = [...new Set(allDates)].sort();
    setColumnDates(uniqueDates);
  }, [studentName]);

  const separateAttendanceByMonth = (attendances) => {
    const monthsAttendance = {
      September: {},
      October: {},
      November: {},
      December: {},
    };

    for (const [key, value] of Object.entries(attendances)) {
      const monthIndex = parseInt(key.split("-")[0], 10);
      switch (monthIndex) {
        case 9:
          monthsAttendance["September"][key] = value;
          break;
        case 10:
          monthsAttendance["October"][key] = value;
          break;
        case 11:
          monthsAttendance["November"][key] = value;
          break;
        case 12:
          monthsAttendance["December"][key] = value;
          break;
      }
    }
    return monthsAttendance;
  };

  const processedStudents = studentName.map(student => {
    return {
      ...student,
      attendances: separateAttendanceByMonth(student.attendances)
    };
  });
  console.log(processedStudents, "processedStudents")



  return (
    <div className="p-4">
      <Tabs>
        <TabList>
          {months.map((month) => (
            <Tab
              key={month}
              onClick={() => {
                setActiveMonth(month);
              }}
            >
              {month}
            </Tab>
          ))}
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
                <table className="w-full border">
                  <thead>
                    <tr>
                      <th className="border p-2"></th>
                      {columnDates.map((date, columnIndex) => (
                        <th
                          key={columnIndex}
                          className="border p-2 text-center"
                        >
                          {date}
                        </th>
                      ))}
                      <th className="border p-2 text-center">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentName.map((studentAttendance, studentIndex) => (
                      <tr key={studentIndex}>
                        <td className="border p-2">{studentAttendance.name}</td>

                        {columnDates.map((date, dayIndex) => {
                          const currentMonthAttendance = studentAttendance.attendances["Setpember"];
                          const hours =
                            Number(studentAttendance.attendances[date]) || 0;
                          return (
                            <td
                              key={dayIndex}
                              className="border p-2 text-center"
                            >
                              <input
                                type="number"
                                value={hours}
                                onChange={(e) => {
                                  const updatedAttendance = [...daysAttendance];
                                  updatedAttendance[studentIndex][
                                    index * columnDates.length + dayIndex
                                  ] = parseInt(e.target.value);
                                  setDaysAttendance(updatedAttendance);
                                  const columnIndexValue =
                                    columnDates[dayIndex];
                                  console.log("index:", index);
                                  console.log("dayIndex:", dayIndex);
                                  console.log(
                                    "columnIndexValue:",
                                    columnIndexValue
                                  );
                                  updateStudentHours(
                                    studentName[studentIndex].id,
                                    columnDates[dayIndex],
                                    parseInt(e.target.value)
                                  );
                                }}
                                className="w-16 text-center"
                              />
                            </td>
                          );
                        })}
                        <td className="border p-2 text-center">
                          {Object.values(
                            studentName[studentIndex].attendances
                          ).reduce((total, hours) => total + hours, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};

export default AttendanceTable;
