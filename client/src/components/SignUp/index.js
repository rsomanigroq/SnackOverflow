import React, { useContext, useState } from "react";
import { Container, TextField, Button, Typography, Paper, Box, IconButton, InputAdornment } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material"; 
import NavBar from "../Navigation/NavBar";
import { auth } from "../Firebase/firebase";
import { UserContext } from "../../contexts/UserContext";
import { createUserWithEmailAndPassword } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate()
const { setUser } = useContext(UserContext)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      // Create auth user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Optionally, update the user context here if needed
      // Note: userCredential.user is not an array, so we use it directly
      setUser(userCredential.user);
      navigate("/");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <NavBar /> 

      <Box
        sx={{
          backgroundImage: 'url(/landingbgg.jpg)',
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)", 
          },
        }}
      >
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Paper
            elevation={5}
            sx={{
              padding: 4,
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)", 
              backdropFilter: "blur(8px)", 
              borderRadius: "12px",
              boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)", 
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              Sign up to Campus Eats  
            </Typography>

            <form onSubmit={handleSignUp}>
              {/* ✅ Email Field */}
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"} 
                fullWidth
                required
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontSize: "16px",
                  fontWeight: "bold",
                  backgroundColor: "#007bff",
                  "&:hover": { backgroundColor: "#0056b3" },
                }}
              >
                Signup
              </Button>
            </form>

            <Typography variant="body2" sx={{ mt: 2 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>
                Login
              </Link>
            </Typography>

            <Typography variant="body2" sx={{ mt: 2 }}>
              Don't remember your password?{" "}
              <Link to="/PasswordForget" style={{ textDecoration: "none", color: "#007bff", fontWeight: "bold" }}>
                Forgot Password
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default Signup;


