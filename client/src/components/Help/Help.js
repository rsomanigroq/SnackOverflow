import React from "react";
import { Container, Typography, Paper, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import NavBar from "../Navigation/NavBar";

const Help = () => {
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
              Help & Support
            </Typography>

            <Typography variant="body1" paragraph>
              Need assistance? Here are some helpful resources:
            </Typography>

            <Typography variant="body1">
              🔹 <strong>Finding Restaurants:</strong> Use the search feature to locate campus dining options.  
            </Typography>

            <Typography variant="body1">
              🔹 <strong>Posting Reviews:</strong> Share your experience by submitting a review under the "Community" page.  
            </Typography>

            <Typography variant="body1">
              🔹 <strong>Tracking Diet:</strong> Log meals and track your macros under "Diet Tracking."  
            </Typography>

            <Typography variant="body1">
              🔹 <strong>Recipe Suggestions:</strong> Find personalized meal recommendations on the "Home Meals" page.  
            </Typography>

            <Typography variant="body1" paragraph>
              If you need more help, contact our support team at <strong>support@campuseats.com</strong>.
            </Typography>

            {/* ✅ Back to About Page Button */}
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/about"
              sx={{ mt: 2 }}
            >
              Back to About Page
            </Button>
          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default Help;
