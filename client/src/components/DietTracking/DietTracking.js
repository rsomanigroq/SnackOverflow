import React, { useState, useEffect } from "react";
import NavBar from "../Navigation/NavBar";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Badge,
  Tooltip,
} from "@mui/material";
import { PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import EmojiEventsIcon from "@mui/material/Icon"; // For the trophy icon

const DietTracking = () => {
  const [meal, setMeal] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletedMeal, setDeletedMeal] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [summaryType, setSummaryType] = useState("weekly");
  const [showMealForm, setShowMealForm] = useState(false);
  const [openUnhealthyDialog, setOpenUnhealthyDialog] = useState(false);
  const [unhealthyMessage, setUnhealthyMessage] = useState("");
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  // New state for achievement badge
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [proteinAchievement, setProteinAchievement] = useState(false);

  useEffect(() => {
    fetchMeals();
  }, []);

  // Check for protein achievement when meals change
  useEffect(() => {
    checkProteinAchievement();
  }, [meals]);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }
      const data = await response.json();
      setMeals(data);
    } catch (err) {
      setError(err.message);
      setSnackbarMessage(`Error: ${err.message}`);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeal((prev) => {
      const updatedMeal = { ...prev, [name]: value };
      if (name === "protein" || name === "carbs" || name === "fats") {
        const protein = parseFloat(updatedMeal.protein) || 0;
        const carbs = parseFloat(updatedMeal.carbs) || 0;
        const fats = parseFloat(updatedMeal.fats) || 0;
        const calories = (protein * 4 + carbs * 4 + fats * 9).toFixed(0);
        updatedMeal.calories = calories;
      }
      return updatedMeal;
    });
  };

  const isUnhealthyMeal = (meal) => {
    const calories = parseFloat(meal.calories);
    const protein = parseFloat(meal.protein);
    const carbs = parseFloat(meal.carbs);
    const fats = parseFloat(meal.fats);


    const highCalories = calories > 800;
    const badRatio = (carbs / (protein + fats)) > 4 || (fats / (protein + carbs)) > 1.5;

    if (highCalories) {
      return "This meal is high in calories. Consider a lighter option.";
    }
    if (badRatio) {
      return "The macronutrient ratio seems unbalanced. Try a better mix of protein, carbs, and fats.";
    }
    return null;
  };

  // New function to check if total protein achievement should be awarded
  const checkProteinAchievement = () => {
    const totalProtein = meals.reduce((sum, meal) => sum + (parseFloat(meal.protein) || 0), 0);

    // If we've hit 100g protein and achievement hasn't been shown yet
    if (totalProtein >= 100 && !proteinAchievement) {
      setProteinAchievement(true);
      setShowAchievementDialog(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const warning = isUnhealthyMeal(meal);

    if (warning && !warningAcknowledged) {
      setUnhealthyMessage(warning);
      setOpenUnhealthyDialog(true);
      return;
    }

    if (meal.name && (meal.calories || meal.protein || meal.carbs || meal.fats)) {
      setLoading(true);
      try {
        if (editIndex !== null) {
          const mealToUpdate = meals[editIndex];
          const response = await fetch(`/api/meals/${mealToUpdate.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(meal),
          });

          if (!response.ok) {
            throw new Error('Failed to update meal');
          }

          const updatedMeal = await response.json();
          const updatedMeals = [...meals];
          updatedMeals[editIndex] = updatedMeal;
          setMeals(updatedMeals);
          setEditIndex(null);
        } else {
          const response = await fetch('/api/meals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(meal),
          });

          if (!response.ok) {
            throw new Error('Failed to add meal');
          }

          const newMeal = await response.json();
          setMeals((prev) => [...prev, newMeal]);
        }

        setMeal({
          name: "",
          calories: "",
          protein: "",
          carbs: "",
          fats: "",
          date: new Date().toISOString().split("T")[0]
        });
        setSnackbarMessage("Meal saved successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setShowMealForm(false);
      } catch (err) {
        setError(err.message);
        setSnackbarMessage(`Error: ${err.message}`);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    } else {
      setSnackbarMessage("Please fill out all fields.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }

    setWarningAcknowledged(false);
  };

  const handleEdit = (index) => {
    setMeal(meals[index]);
    setEditIndex(index);
    setShowMealForm(true);
  };

  const handleCancel = () => {
    setMeal({
      name: "",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
      date: new Date().toISOString().split("T")[0]
    });
    setEditIndex(null);
    setShowMealForm(false);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    const mealToDelete = meals[deleteIndex];
    setLoading(true);
    try {
      const response = await fetch(`/api/meals/${mealToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      const deleted = meals[deleteIndex];
      const updatedMeals = meals.filter((_, i) => i !== deleteIndex);
      setMeals(updatedMeals);
      setDeletedMeal(deleted);
      setShowUndo(true);
      setOpenDeleteDialog(false);
      setSnackbarMessage("Meal deleted successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        setShowUndo(false);
        setDeletedMeal(null);
      }, 5000);
    } catch (err) {
      setError(err.message);
      setSnackbarMessage(`Error: ${err.message}`);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setOpenDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setOpenDeleteDialog(false);
    setDeleteIndex(null);
  };

  const undoDelete = async () => {
    if (deletedMeal) {
      setLoading(true);
      try {
        const response = await fetch('/api/meals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deletedMeal),
        });

        if (!response.ok) {
          throw new Error('Failed to restore meal');
        }

        const restoredMeal = await response.json();
        setMeals((prev) => [...prev, restoredMeal]);
        setDeletedMeal(null);
        setShowUndo(false);
        setSnackbarMessage("Meal restored successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      } catch (err) {
        setError(err.message);
        setSnackbarMessage(`Error: ${err.message}`);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const totalMacronutrients = meals.reduce(
    (acc, meal) => {
      acc.protein += parseFloat(meal.protein) || 0;
      acc.carbs += parseFloat(meal.carbs) || 0;
      acc.fats += parseFloat(meal.fats) || 0;
      return acc;
    },
    { protein: 0, carbs: 0, fats: 0 }
  );

  const macronutrientData = [
    { name: "Protein", value: totalMacronutrients.protein, color: "#0088FE" },
    { name: "Carbs", value: totalMacronutrients.carbs, color: "#FFBB28" },
    { name: "Fats", value: totalMacronutrients.fats, color: "#FF8042" },
  ];

  const getSummaryData = () => {
    const groupedData = {};

    meals.forEach((meal) => {
      const date = new Date(meal.date);
      const week = `Week ${Math.ceil(date.getDate() / 7)}`;
      const month = date.toLocaleString("default", { month: "long" });

      const key = summaryType === "weekly" ? week : month;

      if (!groupedData[key]) {
        groupedData[key] = { protein: 0, carbs: 0, fats: 0, calories: 0 };
      }

      groupedData[key].protein += parseFloat(meal.protein) || 0;
      groupedData[key].carbs += parseFloat(meal.carbs) || 0;
      groupedData[key].fats += parseFloat(meal.fats) || 0;
      groupedData[key].calories += parseFloat(meal.calories) || 0;
    });

    return Object.keys(groupedData).map((key) => ({
      period: key,
      ...groupedData[key],
    }));
  };

  const summaryData = getSummaryData();

  return (
    <div>
      <NavBar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Track Your Diet
          </Typography>

          {/* Protein Achievement Badge */}
          {proteinAchievement && (
            <Tooltip title="Achievement: Reached 100g Protein!" placement="left">
              <Badge
                badgeContent={<span style={{ fontSize: "14px" }}>💯</span>}
                color="primary"
                overlap="circular"
              >
                <Box
                  sx={{
                    bgcolor: "#FFD700",
                    borderRadius: "50%",
                    p: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: 3
                  }}
                >
                  <span style={{ fontSize: "22px" }}>🏆</span>
                </Box>
              </Badge>
            </Tooltip>
          )}
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Add Meal Button */}
        {!showMealForm && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowMealForm(true)}
            sx={{ mb: 4 }}
            disabled={loading}
          >
            Add Meal
          </Button>
        )}

        {/* Meal Input Form */}
        {showMealForm && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {editIndex !== null ? "Edit Meal" : "Add a Meal"}
            </Typography>
            <TextField
              fullWidth
              label="Meal Name"
              name="name"
              value={meal.name}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Protein (g)"
              name="protein"
              type="number"
              value={meal.protein}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Carbs (g)"
              name="carbs"
              type="number"
              value={meal.carbs}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Fats (g)"
              name="fats"
              type="number"
              value={meal.fats}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Calories (kcal)"
              name="calories"
              type="number"
              value={meal.calories}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={meal.date}
              onChange={handleInputChange}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2, mr: 2 }}
              disabled={loading}
            >
              {loading ? "Saving..." : (editIndex !== null ? "Save Changes" : "Add Meal")}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              sx={{ mt: 2 }}
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        )}

        {/* Progress Toward Protein Goal */}
        {meals.length > 0 && (
          <Box sx={{ mb: 4, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Protein Goal Progress
            </Typography>
            <Box sx={{
              position: "relative",
              height: "30px",
              bgcolor: "#e0e0e0",
              borderRadius: "15px",
              overflow: "hidden"
            }}>
              <Box sx={{
                width: `${Math.min(totalMacronutrients.protein, 100)}%`,
                height: "100%",
                bgcolor: totalMacronutrients.protein >= 100 ? "#4caf50" : "#2196f3",
                transition: "width 0.5s ease-in-out"
              }} />
              <Typography
                variant="body2"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#000",
                  fontWeight: "bold"
                }}
              >
                {totalMacronutrients.protein.toFixed(1)}g / 100g
              </Typography>
            </Box>
          </Box>
        )}

        {/* Macronutrient Breakdown Pie Chart */}
        {meals.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Macronutrient Breakdown
            </Typography>
            <Box sx={{ margin: "20px 0", display: "flex", justifyContent: "center" }}>
              <PieChart width={400} height={400}>
                <Pie
                  data={macronutrientData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {macronutrientData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </Box>

            {/* Weekly/Monthly Summary */}
            <Typography variant="h6" gutterBottom>
              {summaryType === "weekly" ? "Weekly Summary" : "Monthly Summary"}
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Summary Type</InputLabel>
              <Select
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
                label="Summary Type"
                disabled={loading}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", justifyContent: "center", overflowX: "auto" }}>
              <BarChart width={600} height={300} data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="protein" fill="#0088FE" name="Protein (g)" />
                <Bar dataKey="carbs" fill="#FFBB28" name="Carbs (g)" />
                <Bar dataKey="fats" fill="#FF8042" name="Fats (g)" />
              </BarChart>
            </Box>
          </>
        )}

        {/* Tracked Meals Table */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Tracked Meals
        </Typography>
        {meals.length === 0 && !loading ? (
          <Alert severity="info">No meals tracked yet. Add your first meal to get started!</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meal Name</TableCell>
                  <TableCell align="right">Calories (kcal)</TableCell>
                  <TableCell align="right">Protein (g)</TableCell>
                  <TableCell align="right">Carbs (g)</TableCell>
                  <TableCell align="right">Fats (g)</TableCell>
                  <TableCell align="right">Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meals.map((meal, index) => (
                  <TableRow key={meal.id || index}>
                    <TableCell>{meal.name}</TableCell>
                    <TableCell align="right">{meal.calories}</TableCell>
                    <TableCell align="right">{meal.protein}</TableCell>
                    <TableCell align="right">{meal.carbs}</TableCell>
                    <TableCell align="right">{meal.fats}</TableCell>
                    <TableCell align="right">{meal.date}</TableCell>
                    <TableCell align="right">
                      <Button
                        onClick={() => handleEdit(index)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(index)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Achievement Dialog */}
      <Dialog open={showAchievementDialog} onClose={() => setShowAchievementDialog(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>
          <span style={{ fontSize: "28px" }}>🏆</span> Achievement Unlocked!
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box
              sx={{
                bgcolor: "#FFD700",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                boxShadow: 3
              }}
            >
              <span style={{ fontSize: "40px" }}>💪</span>
            </Box>
            <Typography variant="h6" gutterBottom>
              Protein Champion
            </Typography>
            <Typography variant="body1" align="center">
              Congratulations! You've reached 100g of protein in your diet tracking.
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Keep up the great work to maintain your protein goals!
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={() => setShowAchievementDialog(false)}
            variant="contained"
            color="primary"
          >
            Awesome!
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={cancelDelete}>
        <DialogTitle>Delete Meal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this meal entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={loading}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unhealthy Meal Warning Dialog */}
      <Dialog open={openUnhealthyDialog} onClose={() => setOpenUnhealthyDialog(false)}>
        <DialogTitle>Unhealthy Meal Warning</DialogTitle>
        <DialogContent>
          <Typography>{unhealthyMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenUnhealthyDialog(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpenUnhealthyDialog(false);
              setWarningAcknowledged(true);
              setTimeout(() => {
                document.querySelector("form").requestSubmit();
              }, 0);
            }}
            color="warning"
            disabled={loading}
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Undo Snackbar */}
      <Snackbar
        open={showUndo}
        autoHideDuration={5000}
        onClose={() => setShowUndo(false)}
        message="Meal deleted. Undo?"
        action={
          <Button
            color="primary"
            size="small"
            onClick={undoDelete}
            disabled={loading}
          >
            UNDO
          </Button>
        }
      />
    </div>
  );
};

export default DietTracking;
