import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Toast from '../components/common/Toast';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { mockUsers } from '../data/mockData';
import { fetchUsers } from '../services/usersApi';

export default function AppLayout() {
  const [users, setUsers] = useState(mockUsers);
  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const timerRef = useRef(null);

  const showMessage = useCallback((message) => {
    setToastMessage(message);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const refreshUsers = useCallback(async (preferredUserId = currentUser.id) => {
    try {
      const items = await fetchUsers();

      if (!items.length) {
        return;
      }

      setUsers(items);
      setCurrentUser((previous) => {
        const nextUser =
          items.find((item) => item.id === preferredUserId) ??
          items.find((item) => item.id === previous.id) ??
          items[0];

        return nextUser;
      });
    } catch (error) {
      console.error('Failed to load users', error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    setShowUserMenu(false);
    showMessage(`已切换至 ${user.name}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 font-sans md:flex-row">
      <Toast message={toastMessage} />
      <Sidebar />

      <main
        className="flex h-screen flex-1 flex-col overflow-y-auto"
        onClick={() => showUserMenu && setShowUserMenu(false)}
      >
        <Topbar
          currentUser={currentUser}
          users={users}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          onSelectUser={handleSelectUser}
        />

        <div className="p-5 md:p-8">
          <Outlet context={{ currentUser, showMessage, refreshUsers }} />
        </div>
      </main>
    </div>
  );
}
