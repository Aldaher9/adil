import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth-context";
import { 
  getStudent, 
  getReinforcementPhrases, 
  addReinforcement, 
  getDailyPoints,
  Student, 
  ReinforcementPhrase 
} from "../lib/firestore-service";
import QRScanner from "../components/QRScanner";
import StudentCard from "../components/StudentCard";
import ReinforcementPanel from "../components/ReinforcementPanel";
import { Scan, X, CheckCircle, AlertCircle } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [phrases, setPhrases] = useState<ReinforcementPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhrases();
  }, []);

  const loadPhrases = async () => {
    try {
      const data = await getReinforcementPhrases();
      setPhrases(data);
    } catch (err) {
      console.error("Failed to load phrases", err);
    }
  };

  const handleScan = async (studentId: string) => {
    setScanning(false);
    setLoading(true);
    setError(null);
    try {
      const data = await getStudent(studentId);
      if (data) {
        setStudent(data);
      } else {
        setError("Student not found!");
      }
    } catch (err) {
      setError("Error fetching student data.");
    } finally {
      setLoading(false);
    }
  };

  const handleReinforce = async (phrase: ReinforcementPhrase) => {
    if (!student || !user) return;
    
    setLoading(true);
    setError(null);

    try {
        // Check daily limit (e.g., 50 points)
        const dailyPoints = await getDailyPoints(student.id);
        if (dailyPoints + phrase.points > 50) {
            setError(`Daily limit reached! Student has ${dailyPoints} points today.`);
            setLoading(false);
            return;
        }

        await addReinforcement(student.id, user.uid, phrase.text, phrase.points);
        
        // Update local state
        setStudent(prev => prev ? { ...prev, totalPoints: prev.totalPoints + phrase.points } : null);
        
        setSuccessMessage(`Added ${phrase.points} points: ${phrase.text}`);
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
        console.error(err);
        setError("Failed to add points.");
    } finally {
        setLoading(false);
    }
  };

  const clearStudent = () => {
    setStudent(null);
    setSuccessMessage(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header / Scan Action */}
      {!student && (
        <div className="text-center py-12 space-y-6">
          <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scan size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Ready to Scan?</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Scan a student's QR code to view their profile and award points.
          </p>
          <button
            onClick={() => setScanning(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <Scan size={24} />
            Scan QR Code
          </button>
        </div>
      )}

      {/* Scanner Modal */}
      {scanning && (
        <QRScanner 
          onScan={handleScan} 
          onClose={() => setScanning(false)} 
        />
      )}

      {/* Student View */}
      {student && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <button 
              onClick={clearStudent}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2 font-medium"
            >
              <X size={20} />
              Close Profile
            </button>
            <button
                onClick={() => setScanning(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
            >
                <Scan size={20} />
                Scan Next
            </button>
          </div>

          <StudentCard student={student} />

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={24} />
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm border border-green-100">
              <CheckCircle size={24} className="text-green-600" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <ReinforcementPanel 
              phrases={phrases} 
              onSelect={handleReinforce}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
