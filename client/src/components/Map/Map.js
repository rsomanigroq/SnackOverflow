//DONT DELETE NEED FOR MAPS 
"use client";

import React from "react";
import NavBar from "../Navigation/NavBar";
import { useState } from "react";
import {
  APIProvider,

  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";


const Map = () => {

  const position = {lat: 43.4643, lng:80.5204};
  
  return (
    <div>
      <NavBar />
      <h1>Find Restaurants</h1>

      <APIProvider apiKey="LkAjjiOeKIaEL7d9W61TDaMJPwfVHnmx">
      <div style={{ height: "90vh", width: "100%" }}>
          <iframe
            src="https://storage.googleapis.com/maps-solutions-b6fatdu23b/neighborhood-discovery/cyuj/neighborhood-discovery.html"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          ></iframe>
        </div>
      </APIProvider>


    </div>
  );
};

export default Map;
