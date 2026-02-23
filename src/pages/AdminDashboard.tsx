import { useState, useEffect } from "react";
import { 
  getAllStudents, 
  getAllPhrases, 
  addPhrase, 
  updatePhrase,
  Student, 
  ReinforcementPhrase 
} from "../lib/firestore-service";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Plus, Trash2, Edit2, Save, X, UserPlus } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [phrases, setPhrases] = useState<ReinforcementPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPhrase, setNewPhrase] = useState({ text: "", points: 0 });
  const [newStudent, setNewStudent] = useState({ name: "", class: "" });
  const [showAddStudent, setShowAddStudent] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, phrasesData] = await Promise.all([
        getAllStudents(),
        getAllPhrases()
      ]);
      setStudents(studentsData);
      setPhrases(phrasesData);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhrase = async () => {
    if (!newPhrase.text) return;
    try {
      await addPhrase(newPhrase.text, newPhrase.points);
      setNewPhrase({ text: "", points: 0 });
      loadData(); 
    } catch (err) {
      console.error("Failed to add phrase", err);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.class) return;
    try {
      await addDoc(collection(db, "students"), {
        name: newStudent.name,
        class: newStudent.class,
        totalPoints: 0,
        qrCode: Math.random().toString(36).substring(7) // Simple random ID for QR
      });
      setNewStudent({ name: "", class: "" });
      setShowAddStudent(false);
      loadData();
    } catch (err) {
      console.error("Failed to add student", err);
    }
  };

  const handleTogglePhrase = async (id: string, currentStatus: boolean) => {
    try {
      await updatePhrase(id, { active: !currentStatus });
      setPhrases(prev => prev.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
    } catch (err) {
      console.error("Failed to toggle phrase", err);
    }
  };

  // Chart Data Preparation
  const classData = students.reduce((acc, student) => {
    const existing = acc.find(d => d.name === student.class);
    if (existing) {
      existing.points += student.totalPoints;
    } else {
      acc.push({ name: student.class, points: student.totalPoints });
    }
    return acc;
  }, [] as { name: string, points: number }[]);

  const topStudents = [...students].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button 
          onClick={() => setShowAddStudent(!showAddStudent)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={20} />
          Add Student
        </button>
      </div>

      {/* Add Student Modal/Form */}
      {showAddStudent && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Student</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Student Name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Class (e.g., 5A)"
              value={newStudent.class}
              onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddStudent}
              disabled={!newStudent.name || !newStudent.class}
              className="bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Save Student
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm uppercase">Total Students</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{students.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm uppercase">Total Points Awarded</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {students.reduce((sum, s) => sum + s.totalPoints, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium text-sm uppercase">Active Phrases</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {phrases.filter(p => p.active).length}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Points by Class</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="points" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Students</h3>
          <div className="space-y-4">
            {topStudents.map((student, index) => (
              <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-gray-100 text-gray-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-500 border'}
                  `}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.class}</p>
                  </div>
                </div>
                <span className="font-bold text-indigo-600">{student.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phrase Management */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Reinforcement Phrases</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add New */}
          <div className="bg-gray-50 p-6 rounded-xl h-fit">
            <h4 className="font-semibold text-gray-900 mb-4">Add New Phrase</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phrase Text</label>
                <input
                  type="text"
                  value={newPhrase.text}
                  onChange={(e) => setNewPhrase({ ...newPhrase, text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Excellent Participation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={newPhrase.points}
                  onChange={(e) => setNewPhrase({ ...newPhrase, points: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleAddPhrase}
                disabled={!newPhrase.text}
                className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Add Phrase
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {phrases.map((phrase) => (
              <div key={phrase.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors group">
                <div>
                  <p className="font-medium text-gray-900">{phrase.text}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${phrase.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {phrase.points > 0 ? '+' : ''}{phrase.points} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePhrase(phrase.id, phrase.active)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${phrase.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {phrase.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
