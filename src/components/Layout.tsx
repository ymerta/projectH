import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const shopName = import.meta.env.VITE_SHOP_NAME || 'Vardiya Çizelgesi';

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary-600' : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Üst navigasyon */}
      <nav className="bg-primary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">{shopName}</h1>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors ${isActive('/')}`}
                >
                  Ana Sayfa
                </Link>
                <Link
                  to="/employees"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors ${isActive('/employees')}`}
                >
                  Çalışanlar
                </Link>
                <Link
                  to="/shifts"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors ${isActive('/shifts')}`}
                >
                  Vardiyalar
                </Link>
                <Link
                  to="/reports"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors ${isActive('/reports')}`}
                >
                  Raporlar
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                {auth.currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobil navigasyon */}
      <nav className="md:hidden bg-primary-600 text-white">
        <div className="px-4 py-2">
          <div className="flex space-x-4 overflow-x-auto">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap ${isActive('/')}`}
            >
              Ana Sayfa
            </Link>
            <Link
              to="/employees"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap ${isActive('/employees')}`}
            >
              Çalışanlar
            </Link>
            <Link
              to="/shifts"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap ${isActive('/shifts')}`}
            >
              Vardiyalar
            </Link>
            <Link
              to="/reports"
              className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap ${isActive('/reports')}`}
            >
              Raporlar
            </Link>
          </div>
        </div>
      </nav>

      {/* Ana içerik */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;

