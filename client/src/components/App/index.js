import React, { useContext } from 'react';
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom';
import Landing from '../Landing';
import Community from "../Community/Community";
import Map from "../Map/Map";
import DietTracking from "../DietTracking/DietTracking";
import Login from "../Auth/Login";
import Signup from '../SignUp/index';
import Recipes from '../Recipes/Recipes';
import MyProfile from '../MyProfile/MyProfile';
import About from "../About/About";
import Help from "../Help/Help";
import ResetPassword from "../PasswordForget/index";
import { UserContext, UserProvider } from '../../contexts/UserContext';

// Protected route wrapper that uses context
const RequireAuth = () => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

// Main application component
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<About />} />
      <Route path="/help" element={<Help />} />
      <Route path="/password-reset" element={<ResetPassword />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route path="/app/community" element={<Community />} />
        <Route path="/app/map" element={<Map />} />
        <Route path="/app/diet-tracking" element={<DietTracking />} />
        <Route path="/app/recipes" element={<Recipes />} />
        <Route path="/app/my-profile" element={<MyProfile />} />
      </Route>

      {/* Redirect legacy paths to the new structure */}
      <Route path="/community" element={<Navigate to="/app/community" replace />} />
      <Route path="/map" element={<Navigate to="/app/map" replace />} />
      <Route path="/diet-tracking" element={<Navigate to="/app/diet-tracking" replace />} />
      <Route path="/recipes" element={<Navigate to="/app/recipes" replace />} />
      <Route path="/my-profile" element={<Navigate to="/app/my-profile" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Wrapper that provides both the Router and UserContext
function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;