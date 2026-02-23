import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { LogOut, User, Settings, Home } from "lucide-react";

export default function Layout() {
  const { user, role, signOut } = useAuth();

  if (!user) return <Outlet />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1 rounded-lg">SR</span>
              <span>School Rewards</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <span>{user.email}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                {role}
              </span>
            </div>
            
            <button 
              onClick={signOut}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
