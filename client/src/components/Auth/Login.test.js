import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "./Login";
import { UserContext } from "../../contexts/UserContext";
import '@testing-library/jest-dom';

describe("Login Component", () => {
  const mockUser = {
    uid: "test-uid",
    email: "test@example.com",
    username: "testuser"
  };

  const renderWithProviders = (ui) => {
    return render(
      <UserContext.Provider value={{ user: mockUser }}>
        <BrowserRouter>{ui}</BrowserRouter>
      </UserContext.Provider>
    );
  };

  test("renders email and password input fields", () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toBeInTheDocument();
  });

  test("renders the login button with the correct text", () => {
    renderWithProviders(<Login />);
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("renders 'Forgot Password' link", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });
});
