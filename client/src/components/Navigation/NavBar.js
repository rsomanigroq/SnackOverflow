import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import { signOut } from "firebase/auth";
import { auth } from "../Firebase/firebase";

const NavBar = () => {
  const { user } = useContext(UserContext);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Auth state change will be captured by UserContext
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#333" }}>
      <Toolbar>
        {/* Logo and redirect to home */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
          <img src="/campus-eats.jpg" alt="Campus Eats Logo" style={{ height: 50 }} />
        </Link>
        
        {/* Navigation Links */}
        <Button color="inherit" component={Link} to="/">
          Home
        </Button>
        <Button color="inherit" component={Link} to="/app/community">
          Community
        </Button>
        <Button color="inherit" component={Link} to="/app/map">
          Find Restaurants
        </Button>
        <Button color="inherit" component={Link} to="/app/diet-tracking">
          Track Your Diet
        </Button>
        <Button color="inherit" component={Link} to="/app/recipes">
          Recipes
        </Button>
        
        {/* Conditional rendering based on auth state */}
        {user ? (
          <>
            <Button color="inherit" component={Link} to="/app/my-profile">
              My Profile
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
        )}
        
        <Button color="inherit" component={Link} to="/about">
          About
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;