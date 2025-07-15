# MSE 342 - Sprint 3

## Due: April 7 2025.

## GitHub Classroom link: 
https://trello.com/b/9GGCVIMr/group-4-project-user-stories 

## System Overview: 
The problem our system will be solving is helping the University of Waterloo (UW) members, whether that be teachers, profs, or TAs set and track their nutritional and fitness goals. Nutritional goals can be anything related to desired protein intake for instance, whereas, fitness goals can be related to desired body fat percentage for example. Our system will help UW set nutrition and fitness goals and provide them a list of restaurants and menu items that align with these goals. If the user would like to cook at home we will provide the user a variety of recipes that will help them reach these goals. Not to mention, we would like to also display a map of these food places around campus helping UW members navigate through campus. Something that differentiates our system from something like Campus Eats which already exists for instance is that Campus Eats only allows you to navigate different restaurants on campus. Our system, on the other hand, allows you to not only do the same but also gives recommendations based on your nutrition and fitness goals. Not to mention, our system will allow the user to track their food intake and also recommend home cooked meals to meet their goals. Not to mention, there are plenty of platforms out there which carry out similar purposes, however, our system will allow this to happen all in one centralized location.

## System Users:
University of Waterloo students, professors, and TAs that are looking to improve their diet, nutritional plans, or are simply looking for somewhere to eat. 

## System Functionalities:
Main Features:

Login Page: User sets up their account and their goals through user authentication
Nutrition goal examples: reduce calorie intake, maximize protein intake, minimize sugar intake, manage balance of nutrition, etc.

Community Page: Users can make posts based on their experiences at restaurants, food qualities and where they might be going to eat. These posts will be composed of just text. Posts will be sorted using an upvote/downvote system, to ensure the posts that are the most relevant to the user are closest to the top. The app would give them a ranking of the restaurants based on their nutrition goal, showing them which restaurants would be best to eat at.

Map of restaurants and places to eat out around the UW area - with user based goal features. Upon clicking on places on the map, the site would give a recommendation based on the users goals on where they should eat, and which menu items align best with their nutritional goals. The map will be interactive, so the user can scroll and move around, and see different places near them.

Tracking page of the users diet - unique to the user and their goals. Each time the user eats a meal, they’re able to upload it from a selection feature to the site, and track their overall progress towards their goal. This would be gamified, with achievements being tracked and rewards given to the users based on their progress.

Cooking page - list of recipes based on the users goals of what meals they should cook at home. Also, functionality such that the user can enter their ingredients and be provided with possible recipes to cook.

## Obtaining and Storing Data:
Location and menu items of UW restaurants. We plan to obtain the location data using a Google API, and obtain samples of restaurant menu items through their online postings, or through perhaps an UberEats API. 

Users will enter their own nutritional goals, and we will store them in MySQL tables, along with their login information, and their diet progress. 

Users preferences including favorite restaurants and meal options, and goals: 
Goal examples: calorie tracking, weight loss, muscle gain, etc.

We will have a list of recipes that can be made at home, along with ingredients included in a MySQL table, that we will obtain through online recipe sites.
