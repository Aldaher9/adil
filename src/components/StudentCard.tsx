import { Student } from "../lib/firestore-service";
import { Trophy, Star, Award, Medal } from "lucide-react";
import { cn } from "../lib/utils";

interface StudentCardProps {
  student: Student;
  className?: string;
}

export default function StudentCard({ student, className }: StudentCardProps) {
  // Determine level based on points
  const getLevel = (points: number) => {
    if (points >= 100) return { name: "Honor", icon: Medal, color: "text-yellow-500", bg: "bg-yellow-50" };
    if (points >= 50) return { name: "Certificate", icon: Award, color: "text-blue-500", bg: "bg-blue-50" };
    if (points >= 20) return { name: "Star", icon: Star, color: "text-purple-500", bg: "bg-purple-50" };
    return { name: "Beginner", icon: Trophy, color: "text-gray-400", bg: "bg-gray-50" };
  };

  const level = getLevel(student.totalPoints);
  const LevelIcon = level.icon;

  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", className)}>
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-gray-500">{student.class}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-black text-indigo-600">{student.totalPoints}</div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Points</div>
        </div>
      </div>

      <div className={cn("px-6 py-3 flex items-center gap-2 text-sm font-medium", level.bg, level.color)}>
        <LevelIcon size={18} />
        <span>Current Level: {level.name}</span>
      </div>
    </div>
  );
}
