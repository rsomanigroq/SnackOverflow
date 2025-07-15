import React from "react";
import { Container, Typography, Paper, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import NavBar from "../Navigation/NavBar";

const About = () => {
  return (
    <div>
      <NavBar />
      <Box
        sx={{
          backgroundImage: "url(/landingbgg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
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
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
          <Paper sx={{ p: 4, boxShadow: 3, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.9)" }}>
            <Typography variant="h3" gutterBottom>
              About <strong>Campus Eats</strong>
            </Typography>

            <Typography variant="h6" paragraph>
              Welcome to <strong>Campus Eats</strong> – your go-to platform for finding, reviewing, and tracking meals on campus.
            </Typography>

            <Typography variant="body1" paragraph>
              🔹 <strong>Find Restaurants</strong> – Search for campus dining options  
            </Typography>

            <Typography variant="body1" paragraph>
              🔹 <strong>Community Reviews</strong> – Read and share restaurant experiences  
            </Typography>

            <Typography variant="body1" paragraph>
              🔹 <strong>Diet Tracking</strong> – Log meals & track macronutrients  
            </Typography>

            <Typography variant="body1" paragraph>
              🔹 <strong>Recipe Suggestions</strong> – Get easy, healthy recipes  
            </Typography>

            <Typography variant="body1" paragraph>
              Whether you're looking for a quick bite, healthy meal options, or tracking your fitness goals, Campus Eats is here to help!
            </Typography>

            <Typography variant="body1" paragraph>
              🔹 <strong>Made by Rahin, Lukas, Dhaval & Harshil</strong> – MSE 342
            </Typography>

            {/* ✅ Link to Help Page */}
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/help"
              sx={{ mt: 2 }}
            >
              Go to Help Page
            </Button>

          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default About;
