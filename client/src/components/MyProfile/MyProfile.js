import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Box,
  Paper,
} from "@mui/material";
import NavBar from "../Navigation/NavBar";

const MyProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    fitnessGoal: "",
    lifestyle: "",
    dietaryRestrictions: [],
    privacy: false,
  });

  const dietaryOptions = ["Gluten-Free", "Vegan", "Nut-Free", "Keto", "Vegetarian"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      dietaryRestrictions: checked
        ? [...prev.dietaryRestrictions, value]
        : prev.dietaryRestrictions.filter((item) => item !== value),
    }));
  };

  const handlePrivacyChange = (e) => {
    setProfile((prev) => ({ ...prev, privacy: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/profile", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Error saving profile. Please try again.");
        console.error("Server error:", data.error);
      }
    } catch (error) {
      alert("Network error. Please try again.");
      console.error("Fetch error:", error);
    }
  };

  return (
    <div>
      <NavBar />
      <Box
        sx={{
          backgroundImage: 'url(/landingbgg.jpg)',
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
        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.9)" }}>
            <Typography variant="h4" gutterBottom>My Profile</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField fullWidth label="Full Name" name="name" value={profile.name} onChange={handleChange} margin="normal" required />
              <TextField fullWidth label="Email" name="email" value={profile.email} onChange={handleChange} margin="normal" required />

              <FormControl fullWidth margin="normal">
                <InputLabel>Fitness Goal</InputLabel>
                <Select name="fitnessGoal" value={profile.fitnessGoal} onChange={handleChange} required>
                  <MenuItem value="Weight Loss">Weight Loss</MenuItem>
                  <MenuItem value="Muscle Gain">Muscle Gain</MenuItem>
                  <MenuItem value="Improved Stamina">Improved Stamina</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Lifestyle</InputLabel>
                <Select name="lifestyle" value={profile.lifestyle} onChange={handleChange} required>
                  <MenuItem value="Sedentary">Sedentary</MenuItem>
                  <MenuItem value="Moderately Active">Moderately Active</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ mt: 2 }}>Dietary Restrictions:</Typography>
              {dietaryOptions.map((option) => (
                <FormControlLabel key={option} control={<Checkbox value={option} onChange={handleCheckboxChange} />} label={option} />
              ))}

              <FormControlLabel control={<Checkbox checked={profile.privacy} onChange={handlePrivacyChange} />} label="Make my goals and preferences private" />

              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Save Profile
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </div>
  );
};

export default MyProfile;
