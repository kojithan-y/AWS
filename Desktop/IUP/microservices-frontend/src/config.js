const trimSlash = (s) => String(s || "").replace(/\/$/, "");

export const apiBase = {
  student: trimSlash(import.meta.env.VITE_STUDENT_API_URL || "http://localhost:5000"),
  exam: trimSlash(import.meta.env.VITE_EXAM_API_URL || "http://localhost:5001"),
  teacher: trimSlash(import.meta.env.VITE_TEACHER_API_URL || "http://localhost:5002"),
};

export const paths = {
  students: () => `${apiBase.student}/api/students`,
  studentExams: (id) => `${apiBase.student}/api/students/${encodeURIComponent(id)}/exams`,
  studentTeacher: (id) => `${apiBase.student}/api/students/${encodeURIComponent(id)}/teacher`,
  studentById: (id) => `${apiBase.student}/api/students/${encodeURIComponent(id)}`,
  exams: () => `${apiBase.exam}/api/exams`,
  examById: (id) => `${apiBase.exam}/api/exams/${encodeURIComponent(id)}`,
  examWithParticipants: (id) =>
    `${apiBase.exam}/api/exams/${encodeURIComponent(id)}/with-participants`,
  teacherById: (id) => `${apiBase.teacher}/api/teachers/${encodeURIComponent(id)}`,
  teachers: () => `${apiBase.teacher}/api/teachers`,
  teacherStudents: (id) =>
    `${apiBase.teacher}/api/teachers/${encodeURIComponent(id)}/students`,
  teacherExams: (id) =>
    `${apiBase.teacher}/api/teachers/${encodeURIComponent(id)}/exams`,
  teacherByStudent: (sid) =>
    `${apiBase.teacher}/api/teachers/by-student/${encodeURIComponent(sid)}`,
};
