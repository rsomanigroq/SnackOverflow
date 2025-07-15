import React from 'react';
import { render, screen } from '@testing-library/react';
import Map from './Map';
import { UserContext } from '../../contexts/UserContext';
import '@testing-library/jest-dom';

jest.mock('../Navigation/NavBar', () => () => <div>Mock NavBar</div>);

describe('Map component', () => {
  test('renders NavBar and heading', () => {
    render(
      <UserContext.Provider value={{ user: { uid: 'test' }, loading: false }}>
        <Map />
      </UserContext.Provider>
    );
    expect(screen.getByText('Mock NavBar')).toBeInTheDocument();
    expect(screen.getByText('Find Restaurants')).toBeInTheDocument();
  });

  test('renders iframe with Google Maps content', () => {
    render(
      <UserContext.Provider value={{ user: { uid: 'test' }, loading: false }}>
        <Map />
      </UserContext.Provider>
    );
  
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('neighborhood-discovery');
  });
  
});
