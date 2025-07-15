import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyProfile from "./MyProfile";

// Mock the NavBar component
jest.mock("../Navigation/NavBar", () => () => <div>NavBar Mock</div>);

// Mock window.alert
window.alert = jest.fn();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

describe("MyProfile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates name field when typed", () => {
    render(<MyProfile />);
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: "Kendrick Lamar" } });
    expect(nameInput.value).toBe("Kendrick Lamar");
  });

  test("toggles privacy checkbox", () => {
    render(<MyProfile />);
    const privacyCheckbox = screen.getByLabelText(/Make my goals and preferences private/i);
    fireEvent.click(privacyCheckbox);
    expect(privacyCheckbox.checked).toBe(true);
  });

  test("can check multiple dietary restrictions", () => {
    render(<MyProfile />);
    const veganCheckbox = screen.getByLabelText(/Vegan/i);
    const ketoCheckbox = screen.getByLabelText(/Keto/i);
    fireEvent.click(veganCheckbox);
    fireEvent.click(ketoCheckbox);
    expect(veganCheckbox.checked).toBe(true);
    expect(ketoCheckbox.checked).toBe(true);
  });

  test("form submission shows alert", async () => {
    render(<MyProfile />);
    
    // Fill out form fields
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { name: "name", value: "Travis Scott" } });
    
    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { name: "email", value: "travis@example.com" } });
    
    // Get the Select elements by their label elements
    const fitnessGoalLabel = screen.getByText("Fitness Goal");
    const fitnessGoalSelect = fitnessGoalLabel.closest(".MuiFormControl-root").querySelector("[role='combobox']");
    fireEvent.mouseDown(fitnessGoalSelect);
    
    // Select an option from the dropdown
    const fitnessGoalOption = await screen.findByText(/^Weight Loss$/);
    fireEvent.click(fitnessGoalOption);
    
    // Get the Lifestyle select
    const lifestyleLabel = screen.getByText("Lifestyle");
    const lifestyleSelect = lifestyleLabel.closest(".MuiFormControl-root").querySelector("[role='combobox']");
    fireEvent.mouseDown(lifestyleSelect);
    
    // Select an option from the dropdown using exact matching to avoid ambiguity
    const lifestyleOption = await screen.findByText(/^Active$/);
    fireEvent.click(lifestyleOption);
    
    // Submit form
    const submitButton = screen.getByText("Save Profile");
    fireEvent.click(submitButton);
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Profile updated successfully!");
    });
  });

  test("can uncheck dietary restriction after checking", () => {
    render(<MyProfile />);
    const veganCheckbox = screen.getByLabelText(/Vegan/i);
    fireEvent.click(veganCheckbox);
    expect(veganCheckbox.checked).toBe(true);
    fireEvent.click(veganCheckbox);
    expect(veganCheckbox.checked).toBe(false);
  });
});