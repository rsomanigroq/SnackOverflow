import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Button, Grid, Paper, CircularProgress } from "@mui/material";
import NavBar from "../Navigation/NavBar"; 
import { Link } from "react-router-dom";

const Landing = () => {
  const [topPost, setTopPost] = useState(null);
  const [latestMeal, setLatestMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const postsResponse = await fetch('/api/posts');
        const postsData = await postsResponse.json();
        
        const highestVotedPost = postsData.reduce((highest, current) => 
          (highest.votes > current.votes) ? highest : current, { votes: -Infinity });
        
        setTopPost(highestVotedPost);
        
        const mealsResponse = await fetch('/api/meals');
        const mealsData = await mealsResponse.json();
        
        const sortedMeals = [...mealsData].sort((a, b) => 
          new Date(b.date) - new Date(a.date));
        
        if (sortedMeals.length > 0) {
          setLatestMeal(sortedMeals[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load summary data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <Typography variant="h2" sx={{ fontWeight: "bold", color: "white" }}>
            Welcome to Campus Eats
          </Typography>
          <Typography variant="h5" sx={{ mt: 2, color: "white", opacity: 0.9 }}>
            Find the best restaurants around UW and track your nutrition goals!
          </Typography>
        </Container>
      </Box>

      {/* Activity Summary Section */}
      <Container maxWidth="lg" sx={{ padding: "40px 20px" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "30px" }}>
          Latest Activity
        </Typography>
        
        <Grid container spacing={4}>
          {/* Top Community Post */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ padding: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Most Popular Community Post
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : topPost ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {topPost.restaurantName}
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                    "{topPost.reviewText}"
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 1 }}>
                    Rating: {topPost.rating} ⭐ | Votes: {topPost.votes} | Tag: {topPost.restaurantTag || "None"}
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="app/community"
                    sx={{ mt: 2 }}
                  >
                    Join the Discussion
                  </Button>
                </>
              ) : (
                <Typography>No community posts yet.</Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Latest Meal Entry */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ padding: 3, height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                Your Latest Meal Entry
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : latestMeal ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {latestMeal.name}
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
                    Date: {new Date(latestMeal.date).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ marginTop: 2, marginBottom: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Paper elevation={0} sx={{ padding: 1, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                          <Typography variant="body2">Calories</Typography>
                          <Typography variant="h6">{latestMeal.calories}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper elevation={0} sx={{ padding: 1, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                          <Typography variant="body2">Protein (g)</Typography>
                          <Typography variant="h6">{latestMeal.protein}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper elevation={0} sx={{ padding: 1, textAlign: 'center', bgcolor: '#fff8e1' }}>
                          <Typography variant="body2">Carbs (g)</Typography>
                          <Typography variant="h6">{latestMeal.carbs}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Paper elevation={0} sx={{ padding: 1, textAlign: 'center', bgcolor: '#fff3e0' }}>
                          <Typography variant="body2">Fats (g)</Typography>
                          <Typography variant="h6">{latestMeal.fats}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    to="/diet-tracking"
                    sx={{ mt: 2 }}
                  >
                    Track More Meals
                  </Button>
                </>
              ) : (
                <Typography>No meal entries yet.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ padding: "40px 20px" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: "30px" }}>
          Explore the Features of Campus Eats
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Community
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Join our community to share restaurant reviews, tips, and dining experiences with other users.
              </Typography>
              <Button variant="contained" component={Link} to="app/community">Visit Community</Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Find Restaurants
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Use our map to discover great restaurants around campus and explore dining options nearby.
              </Typography>
              <Button variant="contained" component={Link} to="app/map">Find Restaurants</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Track Your Diet
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Keep track of your nutritional goals and stay on top of your health with personalized tracking.
              </Typography>
              <Button variant="contained" component={Link} to="app/diet-tracking">Track Your Diet</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Recipes
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Discover and share delicious recipes that fit your dietary preferences and nutritional needs.
              </Typography>
              <Button variant="contained" component={Link} to="app/recipes">Explore Recipes</Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ padding: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                My Profile
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Manage your account, view your posts, and personalize your experience on Campus Eats.
              </Typography>
              <Button variant="contained" component={Link} to="app/my-profile">Visit My Profile</Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Landing;