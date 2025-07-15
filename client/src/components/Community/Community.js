import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NavBar from '../Navigation/NavBar';
import { TextField, Box, Button, Container, Typography, Paper, IconButton, FormControl, RadioGroup, FormControlLabel, Radio, MenuItem, Snackbar, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ReportIcon from '@mui/icons-material/Report';

const Community = () => {
    const [restaurantName, setRestaurantName] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [restaurantTag, setRestaurantTag] = useState('');
    const [rating, setRating] = useState(''); 
    const [reviews, setReviews] = useState([]);
    const [bookmarkedPosts, setBookmarkedPosts] = useState(() => {
        const savedBookmarks = localStorage.getItem('bookmarkedPosts');
        return savedBookmarks ? JSON.parse(savedBookmarks) : [];
    });
    const [filterRestaurant, setFilterRestaurant] = useState(''); 
    const [filterDietaryPreference, setFilterDietaryPreference] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const restaurantTags = [
        "Vegan",
        "Gluten-Free",
        "Takeout",
        "Sit-down",
        "Asian",
        "Mexican",
        "American",
        "Halal"
    ];

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const response = await fetch('/api/posts');
                const data = await response.json();
                if (isMounted) {
                    setReviews(data);
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
                if (isMounted) {
                    setSnackbarMessage('Failed to load posts.');
                    setOpenSnackbar(true);
                }
            }
        };
        
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedPosts));
    }, [bookmarkedPosts]);

    const fetchReviews = async () => {
        try {
            const response = await fetch('/api/posts');
            const data = await response.json();
            setReviews(data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setSnackbarMessage('Failed to load posts.');
            setOpenSnackbar(true);
        }
    };

    const handleSubmit = async () => {
        if (!restaurantName.trim() || !reviewText.trim() || !rating) {
            setSnackbarMessage('Please fill in all required fields.');
            setOpenSnackbar(true);
            return;
        }

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantName, reviewText, rating, restaurantTag })
            });

            if (!response.ok) throw new Error("Failed to submit review");

            await fetchReviews();
            setRestaurantName('');
            setReviewText('');
            setRating('');
            setRestaurantTag('');
            setSnackbarMessage('Post submitted successfully!');
            setOpenSnackbar(true);

        } catch (error) {
            console.error("Error submitting review:", error);
            setSnackbarMessage('Failed to submit post.');
            setOpenSnackbar(true);
        }
    };

    const handleVote = useCallback(async (id, change) => {
        try {
            const response = await fetch(`/api/posts/${id}/vote`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ change })
            });

            if (response.ok) {
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review.id === id ? { ...review, votes: review.votes + change } : review
                    )
                );
            } else {
                console.error("Error updating votes:", await response.text());
                setSnackbarMessage('Failed to update vote.');
                setOpenSnackbar(true);
            }
        } catch (error) {
            console.error("Error updating votes:", error);
            setSnackbarMessage('Failed to update vote.');
            setOpenSnackbar(true);
        }
    }, []);

    const handleDelete = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setReviews(prevReviews => prevReviews.filter(review => review.id !== id));
                setSnackbarMessage('Post deleted successfully.');
                setOpenSnackbar(true);
            } else {
                console.error("Error deleting review:", await response.text());
                setSnackbarMessage('Failed to delete post.');
                setOpenSnackbar(true);
            }
        } catch (error) {
            console.error("Error deleting review:", error);
            setSnackbarMessage('Failed to delete post.');
            setOpenSnackbar(true);
        }
    }, []);

    const toggleBookmark = useCallback((review) => {
        if (bookmarkedPosts.some(bookmark => bookmark.id === review.id)) {
            setBookmarkedPosts(bookmarkedPosts.filter(bookmark => bookmark.id !== review.id));
            setSnackbarMessage('Bookmark removed.');
        } else {
            setBookmarkedPosts([...bookmarkedPosts, review]);
            setSnackbarMessage('Post bookmarked.');
        }
        setOpenSnackbar(true);
    }, [bookmarkedPosts]);

    const handleReport = useCallback(async (id) => {
        try {
            const response = await fetch(`/api/posts/${id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: "Inappropriate content" })
            });
            
            if (response.ok) {
                setSnackbarMessage('Post has been reported for review.');
                setOpenSnackbar(true);
            } else {
                setSnackbarMessage('Failed to report post.');
                setOpenSnackbar(true);
            }
        } catch (error) {
            console.error("Error reporting review:", error);
            setSnackbarMessage('Failed to report post.');
            setOpenSnackbar(true);
        }
    }, []);

    const filteredReviews = useMemo(() => {
        return reviews.filter(review =>
            review.restaurantName.toLowerCase().includes(filterRestaurant.toLowerCase()) &&
            (filterDietaryPreference === '' || review.restaurantTag === filterDietaryPreference)
        );
    }, [reviews, filterRestaurant, filterDietaryPreference]);

    // Memoized highest rated restaurants
    const highestRatedRestaurants = useMemo(() => {
        const restaurantRatings = {};
        reviews.forEach((review) => {
            if (!restaurantRatings[review.restaurantName]) {
                restaurantRatings[review.restaurantName] = { totalRating: 0, count: 0 };
            }
            restaurantRatings[review.restaurantName].totalRating += parseInt(review.rating);
            restaurantRatings[review.restaurantName].count += 1;
        });

        const averageRatings = Object.keys(restaurantRatings).map(restaurantName => {
            const { totalRating, count } = restaurantRatings[restaurantName];
            const averageRating = totalRating / count;
            return { restaurantName, averageRating };
        });

        return averageRatings.sort((a, b) => b.averageRating - a.averageRating);
    }, [reviews]);

    const reviewsMemo = useMemo(() => {
        return filteredReviews.map((review) => (
            <Paper key={review.id} elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#fff', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                <Typography variant="h6"><strong>{review.restaurantName}</strong></Typography>
                <Typography>{review.reviewText}</Typography>
                <Typography>Rating: {review.rating} ⭐</Typography>
                <Typography>
                    Tag: {review.restaurantTag || "None"}
                </Typography>

                <Typography>Votes: {review.votes}</Typography>
                <div>
                    <IconButton onClick={() => handleVote(review.id, 1)} color="primary" aria-label="upvote">
                        <ThumbUpIcon />
                    </IconButton>
                    <IconButton onClick={() => handleVote(review.id, -1)} color="secondary" aria-label="downvote">
                        <ThumbDownIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(review.id)} color="error" aria-label="delete">
                        <DeleteIcon />
                    </IconButton>
                    <IconButton onClick={() => toggleBookmark(review)} color="default" aria-label="bookmark">
                        {bookmarkedPosts.some(bookmark => bookmark.id === review.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    </IconButton>
                    <IconButton onClick={() => handleReport(review.id)} color="warning" aria-label="report">
                        <ReportIcon />
                    </IconButton>
                </div>
            </Paper>
        ));
    }, [filteredReviews, bookmarkedPosts, handleVote, handleDelete, toggleBookmark, handleReport]);

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
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    position: "relative",
                    paddingBottom: '50px',
                    paddingLeft: '20px',
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
                <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="h2" sx={{ fontWeight: "bold", color: "white", marginBottom: '20px' }}>
                        Welcome to your community!
                    </Typography>
                    <TextField
                        value={restaurantName}
                        onChange={e => setRestaurantName(e.target.value)}
                        label="Enter the name of the restaurant"
                        fullWidth
                        variant="outlined"
                        aria-label="Restaurant name"
                        sx={{
                            marginBottom: '20px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',  
                                color: '#000',
                                '& fieldset': {
                                    borderColor: '#fff', 
                                },
                                '&:hover fieldset': {
                                    borderColor: '#fff', 
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#000',
                            },
                        }}
                    />

                    <TextField
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        label="Enter your review"
                        inputProps={{ maxLength: 200 }}
                        placeholder="Max 200 Characters"
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        aria-label="Review text"
                        sx={{
                            marginBottom: '20px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                color: '#000',
                                '& fieldset': {
                                    borderColor: '#fff',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#fff',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#000',
                            },
                        }}
                    />

                    <FormControl fullWidth sx={{ marginBottom: '20px' }}>
                        <Typography component="legend" sx={{ color: '#fff', marginBottom: '8px' }}>Rate this restaurant:</Typography>
                        <RadioGroup
                            aria-label="rating"
                            name="rating"
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            row
                        >
                            <FormControlLabel value="1" control={<Radio sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#fff' } }} />} label={<Typography style={{ color: '#fff' }}>1 ⭐</Typography>} />
                            <FormControlLabel value="2" control={<Radio sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#fff' } }} />} label={<Typography style={{ color: '#fff' }}>2 ⭐</Typography>} />
                            <FormControlLabel value="3" control={<Radio sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#fff' } }} />} label={<Typography style={{ color: '#fff' }}>3 ⭐</Typography>} />
                            <FormControlLabel value="4" control={<Radio sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#fff' } }} />} label={<Typography style={{ color: '#fff' }}>4 ⭐</Typography>} />
                            <FormControlLabel value="5" control={<Radio sx={{ color: '#fff', '& .MuiSvgIcon-root': { color: '#fff' } }} />} label={<Typography style={{ color: '#fff' }}>5 ⭐</Typography>} />
                        </RadioGroup>
                    </FormControl>

                    <FormControl fullWidth>
                        <TextField
                            select
                            value={restaurantTag}
                            onChange={(e) => setRestaurantTag(e.target.value)}
                            variant="outlined"
                            label="Select a tag"
                            aria-label="Restaurant tag"
                            sx={{
                                marginBottom: '20px',
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    color: '#000',
                                    '& fieldset': {
                                        borderColor: '#fff',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#fff',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#000',
                                },
                            }}
                        >
                            <MenuItem value="" disabled>Select a tag</MenuItem>
                            {restaurantTags.map((tag) => (
                                <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                            ))}
                        </TextField>
                    </FormControl>

                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit} 
                        style={{ marginBottom: '20px' }}
                        aria-label="Submit review"
                    >
                        Submit
                    </Button>

                    <TextField
                        value={filterRestaurant}
                        onChange={e => setFilterRestaurant(e.target.value)}
                        label="Filter by Restaurant"
                        fullWidth
                        variant="outlined"
                        aria-label="Filter by restaurant name"
                        sx={{
                            marginBottom: '20px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                color: '#000',
                                '& fieldset': {
                                    borderColor: '#fff',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#fff',
                                },
                            },
                            '& .MuiInputLabel-root': {
                                color: '#000',
                            },
                        }}
                    />

                    <TextField
                        select
                        label="Filter by Dietary Preference"
                        value={filterDietaryPreference}
                        onChange={(e) => setFilterDietaryPreference(e.target.value)}
                        fullWidth
                        variant="outlined"
                        aria-label="Filter by dietary preference"
                        sx={{
                            marginBottom: '20px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '& fieldset': { borderColor: '#fff' },
                                '&:hover fieldset': { borderColor: '#fff' },
                                '& input': { color: '#000' },
                            },
                            '& .MuiInputLabel-root': { color: '#000' },
                        }}
                    >
                        <MenuItem value="">All Preferences</MenuItem>
                        {restaurantTags.map((tag) => (
                            <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                        ))}
                    </TextField>

                    <Typography variant="h4" sx={{ color: 'white', marginBottom: '20px' }}>
                        Community Posts
                    </Typography>

                    {reviewsMemo.length > 0 ? (
                        reviewsMemo
                    ) : (
                        <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#fff', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                            <Typography>No posts found matching your criteria.</Typography>
                        </Paper>
                    )}

                    <Typography variant="h4" sx={{ color: 'white', marginBottom: '20px' }}>
                        Bookmarked Posts
                    </Typography>

                    {bookmarkedPosts.length > 0 ? (
                        bookmarkedPosts.map((bookmark) => (
                            <Paper key={bookmark.id} elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#f5f5f5', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                                <Typography variant="h6"><strong>{bookmark.restaurantName}</strong></Typography>
                                <Typography>{bookmark.reviewText}</Typography>
                                <Typography>Rating: {bookmark.rating} ⭐</Typography>
                                <Typography>Tag: {bookmark.restaurantTag || "None"}</Typography>
                                <Typography>Votes: {bookmark.votes}</Typography>
                            </Paper>
                        ))
                    ) : (
                        <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#fff', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                            <Typography>No bookmarked posts yet.</Typography>
                        </Paper>
                    )}

                    <Typography variant="h4" sx={{ color: 'white', marginBottom: '20px' }}>
                        Highest Rated Restaurants
                    </Typography>

                    {highestRatedRestaurants.length > 0 ? (
                        highestRatedRestaurants.map((restaurant) => (
                            <Paper key={restaurant.restaurantName} elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#f5f5f5', width: '100%', maxWidth: '600px', textAlign: 'left' }}>
                                <Typography variant="h6"><strong>{restaurant.restaurantName}</strong></Typography>
                                <Typography>Average Rating: {restaurant.averageRating.toFixed(1)} ⭐</Typography>
                            </Paper>
                        ))
                    ) : (
                        <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#fff', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                            <Typography>No restaurant ratings available yet.</Typography>
                        </Paper>
                    )}

                    <Paper elevation={3} sx={{ padding: 3, marginTop: 5, backgroundColor: '#fff', textAlign: 'left' }}>
                        <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: '10px' }}>
                            Community Posting Guidelines
                        </Typography>
                        <Typography>
                            - Be respectful: No hate speech, harassment, or offensive language.
                        </Typography>
                        <Typography>
                            - Keep reviews constructive: Provide helpful feedback, not personal attacks.
                        </Typography>
                        <Typography>
                            - No spam or self-promotion: This space is for genuine restaurant reviews.
                        </Typography>
                        <Typography>
                            - Stay relevant: Posts should relate to restaurants and dining experiences.
                        </Typography>
                        <Typography>
                            - Follow all terms of service: Violation of guidelines may lead to content removal.
                        </Typography>
                    </Paper>
                    
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={3000}
                        onClose={() => setOpenSnackbar(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <Alert 
                            onClose={() => setOpenSnackbar(false)} 
                            severity="success" 
                            sx={{ width: '100%' }}
                        >
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>
                </Container>
            </Box>
        </div>
    );
};

export default Community;