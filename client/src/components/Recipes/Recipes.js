import React, { useState, useEffect } from 'react';
import NavBar from '../Navigation/NavBar';
import { Fade, Backdrop, Modal, Card, CardActionArea, CardContent, Grid, TextField, Box , Button, Container, Typography,FormControl, FormControlLabel, RadioGroup, Radio, Paper, Chip, Divider} from '@mui/material';



const Recipes = () => {

    const [recipes, setRecipes] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [openAddModal, setOpenAddModal] = useState(false); 
    const [newRecipe, setNewRecipe] = useState({ title: '', cooking_time: '', ingredients: '', instructions: '' , fitness_goal: ''});

    //FILTERS
    const [filteredRecipes, setFilteredRecipes] = useState([]);
    const [allergyFilter, setAllergyFilter] = useState('');
    const [ingredientFilter, setIngredientFilter] = useState('');
    const [fitnessGoalFilter, setFitnessGoalFilter] = useState('');

    const fitnessGoals = [
      'Weight Loss',
      'Muscle Gain',
      'Improve Stamina'
    ]

    

    {/*  FETCH RECIPES FROM SQL */}

    {/* NEW FETCH RECIPE FUNCTION*/}

  const fetchRecipes = async () => {
  console.log("FETCHING RECIPES");
  try {
    const query = new URLSearchParams({
      allergy: allergyFilter,
      ingredient: ingredientFilter,
      fitnessGoal: fitnessGoalFilter  // Changed to match backend expectation
    }).toString();
    const response = await fetch(`/api/recipes?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();
    if (response.ok) {
      console.log("RESPONSE OK");
      setRecipes(data);
      console.log(data)
    } else {
      console.error("Server error:", data.error);
      alert("Error fetching recipes. Please try again.");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Network error. Please check your connection.");
  }
};

    

    {/* CALL FETCH RECIPES*/}
    useEffect(() => {
      fetchRecipes();
    }, []);

    useEffect(() => {
      fetchRecipes();
    }, [allergyFilter, ingredientFilter, fitnessGoalFilter]);

    

  const handleOpen = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleClose = () => {
    setSelectedRecipe(null);
  };

  const handleAddRecipeOpen = () => {
    setOpenAddModal(true);
  };

  const handleAddRecipeClose = () => {
      setOpenAddModal(false);
  };

  const handleInputChange = (e) => {
      setNewRecipe({ ...newRecipe, [e.target.name]: e.target.value });
  };

  const handleFitnessGoalChange = (goal) => {
    setFitnessGoalFilter(fitnessGoalFilter === goal ? '' : goal);
  };

   const clearFilters = () => {
    setAllergyFilter('');
    setIngredientFilter('');
    setFitnessGoalFilter('');
  };
 

  {/* ADD NEW RECIPES */}
  const handleAddRecipeSubmit = async () => {
    try {
        const formattedRecipe = {
            ...newRecipe,
            ingredients: newRecipe.ingredients.split(",").map(i => i.trim()).join(", ") 
        };

        console.log("Sending payload:", JSON.stringify(formattedRecipe));
        console.log("Fetching:", "/api/recipes");

        const response = await fetch("/api/recipes", { // Use relative URL
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedRecipe),
        });

        console.log("GOT TO DATA");

        const data = await response.json(); // Capture the response

        if (response.ok) {
            alert("Recipe added successfully!");
            setNewRecipe({ title: '', cooking_time: '', ingredients: '', instructions: '', fitness_goal: ''}); // Clear form
            handleAddRecipeClose();
            fetchRecipes(); // Refresh the list
        } else {
            console.error("Server Error:", data);  // Log response from server
            alert("Failed to add recipe: " + (data.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Network error:", error);
        alert("Network error. Please try again.");
    }
  };

  return (
    <div>
      <NavBar />

      {/* FILTERS */}
      <Container sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filter Recipes
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Exclude Allergens"
                value={allergyFilter}
                onChange={(e) => setAllergyFilter(e.target.value)}
                variant="outlined"
                size="small"
                placeholder="e.g. nuts, dairy"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Include Ingredient"
                value={ingredientFilter}
                onChange={(e) => setIngredientFilter(e.target.value)}
                variant="outlined"
                size="small"
                placeholder="e.g. chicken, rice"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" gutterBottom>
                Fitness Goal
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {fitnessGoals.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    clickable
                    color={fitnessGoalFilter === goal ? "primary" : "default"}
                    onClick={() => handleFitnessGoalChange(goal)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* RECIPE GRID */}
        <Grid container spacing={3}>
          {recipes.length > 0 ? (
            recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardActionArea 
                    onClick={() => setSelectedRecipe(recipe)} 
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>{recipe.title}</Typography>
                      <Typography variant="body2" color="textSecondary">⏳ {recipe.cooking_time}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                        {recipe.ingredients}
                      </Typography>
                      <Chip 
                        label={recipe.fitness_goal} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">No recipes found matching your filters.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Add Recipe Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button variant="contained" onClick={handleAddRecipeOpen}>
            Add my own recipe
          </Button>
        </Box>
      </Container>

      {/* RECIPE MODAL */}
      <Modal
        open={!!selectedRecipe}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={!!selectedRecipe}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              maxWidth: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            {selectedRecipe && (
              <>
                <Typography variant="h5" gutterBottom>
                  {selectedRecipe.title}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  ⏳ {selectedRecipe.cooking_time}
                </Typography>
                <Chip 
                  label={selectedRecipe.fitness_goal} 
                  color="primary" 
                  size="small"
                  sx={{ mb: 2, textTransform: 'capitalize' }} 
                />
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Ingredients
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedRecipe.ingredients}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Instructions
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedRecipe.instructions}
                </Typography>
                
                <Button onClick={handleClose} sx={{ mt: 2 }} variant="contained">
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* ADD USER RECIPE MODAL */}
      <Modal
        open={openAddModal}
        onClose={handleAddRecipeClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openAddModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 500 },
              maxWidth: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" gutterBottom>
              Add a New Recipe
            </Typography>

            <TextField
              fullWidth
              label="Recipe Title"
              name="title"
              value={newRecipe.title}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Cooking Time"
              name="cooking_time"
              value={newRecipe.cooking_time}
              onChange={handleInputChange}
              margin="normal"
              required
              placeholder="e.g. 30 minutes"
            />

            <TextField
              fullWidth
              label="Ingredients (comma-separated)"
              name="ingredients"
              value={newRecipe.ingredients}
              onChange={handleInputChange}
              margin="normal"
              required
              multiline
              rows={2}
              placeholder="e.g. eggs, milk, flour"
            />

            <TextField
              fullWidth
              label="Instructions"
              name="instructions"
              multiline
              rows={3}
              value={newRecipe.instructions}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <Typography variant="body1" gutterBottom>Fitness Goal</Typography>
              <RadioGroup
                name="fitness_goal"
                value={newRecipe.fitness_goal}
                onChange={handleInputChange}
              >
                {fitnessGoals.map(goal => (
                  <FormControlLabel 
                    key={goal} 
                    value={goal} 
                    control={<Radio />} 
                    label={goal} 
                    sx={{ textTransform: 'capitalize' }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleAddRecipeClose} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleAddRecipeSubmit} variant="contained">
                Add Recipe
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

export default Recipes;
