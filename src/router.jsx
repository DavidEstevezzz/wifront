// src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './views/Login';
import NotFound from './views/NotFound';
import Users from './views/Users';
import Dashboard from './views/Dashboard';
import Register from './views/Register';
import UserProfile from './views/UserProfile';
import DefaultLayout from './layout/DefaultLayout';
import GuestLayout from './layout/GuestLayout';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" />
      },
      {
        path: '/dashboard',
        element: <Dashboard />
      },
      {
        path: '/users',
        element: <ProtectedRoute element={<Users />} allowedRoles={['SuperMaster', 'Admin']} />
      },
      {
        path: '/register',
        element: <ProtectedRoute element={<Register />} allowedRoles={['SuperMaster', 'Admin']} />
      },
      {
        path: '/profile',
        element: <UserProfile />
      }
    ]
  },
  {
    path: '/',
    element: <GuestLayout />,
    children: [
      {
        path: '/login',
        element: <Login />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;