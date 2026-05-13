import { StudentCard } from "./student-card";

export function GradeGroup({ grade, students }: { grade: string; students: any[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">{grade}</span>
        <span className="text-gray-400 text-sm font-normal">{students.length}名学生</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </div>
  );
}
