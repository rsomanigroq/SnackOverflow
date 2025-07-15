import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import Recipes from "./Recipes";

// MOCK NAVBAR
jest.mock("../Navigation/NavBar", () => () => <div>NavBar Mock</div>);

// Mock the fetch function
global.fetch = jest.fn();

// Sample mock data that matches your test expectations
const mockRecipes = [
  { 
    id: 1, 
    title: "Grilled Salmon", 
    cooking_time: "15 minutes", 
    ingredients: "Salmon, lemon, herbs", 
    instructions: "Season salmon, grill, serve with lemon."
  },
  { 
    id: 2, 
    title: "Mushroom Risotto", 
    cooking_time: "40 minutes", 
    ingredients: "Arborio rice, mushrooms, stock", 
    instructions: "Cook rice slowly with stock, add mushrooms."
  },
  { 
    id: 3, 
    title: "Lentil Soup", 
    cooking_time: "30 minutes", 
    ingredients: "Lentils, carrots, onion, celery", 
    instructions: "Simmer lentils with vegetables and spices."
  },
  // Add more recipes to reach 8 total
  { id: 4, title: "Recipe 4", cooking_time: "20 minutes", ingredients: "Ingredients 4", instructions: "Instructions 4" },
  { id: 5, title: "Recipe 5", cooking_time: "25 minutes", ingredients: "Ingredients 5", instructions: "Instructions 5" },
  { id: 6, title: "Recipe 6", cooking_time: "35 minutes", ingredients: "Ingredients 6", instructions: "Instructions 6" },
  { id: 7, title: "Recipe 7", cooking_time: "45 minutes", ingredients: "Ingredients 7", instructions: "Instructions 7" },
  { id: 8, title: "Recipe 8", cooking_time: "50 minutes", ingredients: "Ingredients 8", instructions: "Instructions 8" }
];

describe("Recipes Component", () => {
  beforeEach(() => {
    // Reset and mock the fetch function before each test
    fetch.mockReset();
    
    // Mock successful API response
    fetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRecipes)
      })
    );
  });

  test("renders without crashing", () => {
    render(<Recipes />);
  });

  test("renders correct number of recipes", async () => {
    const { container } = render(<Recipes />);
    
    // Wait for the recipes to be loaded
    await waitFor(() => {
      const cards = container.querySelectorAll(".MuiCard-root");
      expect(cards.length).toBe(8);
    });
  });

  test("contains recipe titles", async () => {
    const { container } = render(<Recipes />);
    
    // Wait for specific content to appear
    await waitFor(() => {
      expect(container.textContent).toContain("Grilled Salmon");
      expect(container.textContent).toContain("Mushroom Risotto");
    });
  });

  test("contains recipe times", async () => {
    const { container } = render(<Recipes />);
    
    await waitFor(() => {
      expect(container.textContent).toContain("15 minutes");
      expect(container.textContent).toContain("40 minutes");
    });
  });

  test("contains recipe ingredients", async () => {
    const { container, getByText } = render(<Recipes />);
    
    await waitFor(() => {
      expect(container.textContent).toContain("Salmon, lemon, herbs");
      expect(container.textContent).toContain("Lentils, carrots, onion, celery");
    });
  });

});