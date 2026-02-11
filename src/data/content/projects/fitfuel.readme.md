# Fit-Fuel

## Short Description

An AI-powered fitness and nutrition assistant that uses computer vision to recognize gym equipment and generate personalized workout plans.

## Overview

Fit-Fuel was built as a senior capstone project to combine computer vision with meal tracking and workout planning into a single integrated fitness system. The core innovation is a custom-trained PyTorch object detection model capable of recognizing gym equipment in real time with 85% precision. Users capture an image of nearby equipment, the model identifies it, and the app maps it to a tailored workout plan—all backed by Firebase and served through a cross-platform mobile interface.

## Features

- Recognize gym equipment in real time using a custom-trained object detection model with 85% precision
- Generate personalized workout plans mapped to detected equipment
- Track meals and nutritional intake alongside workouts
- Capture images directly from the mobile app for instant model inference
- Store user data and workout history with Firebase-backed persistence

## Tech Stack

- **Languages:** Python, JavaScript
- **ML Framework:** PyTorch (custom object detection model)
- **Mobile:** React Native
- **Backend:** Flask API, Firebase (Firestore, Authentication, Storage)

## Links

- **GitHub Repository:** https://github.com/TarekChaalan/Fit-Fuel
