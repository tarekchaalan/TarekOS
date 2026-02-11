# ChessAnalysis

## Short Description

A native iOS app that analyzes chess games locally using the Stockfish engine, helping players review their moves and improve their gameplay.

## Overview

ChessAnalysis was built to provide chess players with a free, offline alternative to subscription-based analysis tools. The app allows users to import games from Chess.com or PGN files, then runs them through the powerful Stockfish engine to classify every move—identifying brilliancies, mistakes, and blunders. With evaluation graphs, accuracy statistics, and best-move suggestions, players can understand exactly where they went wrong and how to improve.

## Features

- Run the Stockfish chess engine directly on-device for fast, private, offline analysis
- Classify every move as best, brilliant, great, excellent, good, book, inaccuracy, mistake, miss, blunder, or forced
- Fetch games directly from the Chess.com API using your username
- Import and export games from any source using standard PGN notation
- Visualize game dynamics with interactive evaluation graphs showing advantage over time
- Calculate move accuracy percentages and view detailed game statistics
- Review games move-by-move with customizable board themes and an evaluation bar
- Optimize performance with battery-aware low-power mode and thermal monitoring

## Tech Stack

- **Language:** Swift
- **UI Framework:** SwiftUI
- **Persistence:** CoreData
- **Concurrency:** Swift Concurrency (async/await), Combine
- **Charts:** Swift Charts
- **Audio:** AVFoundation
- **Chess Engine:** Stockfish (embedded C/C++ library)
- **External API:** Chess.com Public API
- **Architecture:** MVVM with Actor-based concurrency
- **Testing:** XCTest, XCUITest
- **Platform:** iOS

## Links

- **GitHub Repository:** https://github.com/tarekchaalan/ChessAnalysis
