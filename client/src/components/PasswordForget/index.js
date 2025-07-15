import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box
} from "@mui/material";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import NavBar from "../Navigation/NavBar";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Password reset email sent!");
    } catch (error) {
      setMessage("❌ " + error.message);
    }
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
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
              Reset Your Password
            </Typography>

            <TextField
              label="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              type="email"
              required
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleReset}
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: "16px",
                fontWeight: "bold",
                backgroundColor: "#007bff",
                "&:hover": { backgroundColor: "#0056b3" },
              }}
            >
              Send Reset Email
            </Button>

            {message && (
              <Typography
                variant="body2"
                sx={{ mt: 3, color: message.includes("✅") ? "green" : "red" }}
              >
                {message}
              </Typography>
            )}

            <Typography variant="body2" sx={{ mt: 3 }}>
              <a
                href="/login"
                style={{ textDecoration: "none", color: "#007bff", fontWeight: "bold" }}
              >
                Back to Login
              </a>
            </Typography>
          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default ResetPassword;
