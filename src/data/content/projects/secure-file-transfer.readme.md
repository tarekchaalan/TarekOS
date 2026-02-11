# Secure File Transfer System

## Short Description

An encrypted client-server file transfer application built from scratch using Python sockets and AES encryption.

## Overview

This project replicates the functionality of secure file sharing platforms in a lightweight, terminal-based application. It supports encrypted transmission of any file type between client and server using AES encryption and JWT-based authentication. The system handles concurrent transfers through multithreaded socket programming, with session validation ensuring only authenticated users can send or receive files.

## Features

- Encrypt all file transfers with AES encryption for secure payload transmission
- Authenticate users with JWT tokens and validate sessions before allowing transfers
- Handle multiple concurrent connections using multithreaded socket architecture
- Transfer any file type through a simple command-line interface
- Validate sessions on each request to prevent unauthorized access

## Tech Stack

- **Language:** Python
- **Networking:** Socket programming, multithreading
- **Security:** AES encryption (Cryptography library), JWT authentication

## Links

- **GitHub Repository:** https://github.com/TarekChaalan/Secure-File-Transfer-System
