# Authentication System with Email Verification (Backend)

This project provides a complete authentication system using **Node.js**, **Express**, and **MongoDB**. It includes features like user registration with verified email, login, email verification, forgot password, and password reset.

## Features

- **User Registration**: Users can register with their email address and password.
- **Email Verification**: After registration, users receive an email to verify their account.
- **Login**: Registered users can log in using their email and password.
- **Forgot Password**: Users can request a password reset if they forget their password.
- **Password Reset**: Users can reset their password by following the instructions sent to their email.

## Installation

### Prerequisites

- Node.js (v14 or above)
- MongoDB (local or Atlas)
- npm (Node Package Manager)

### Setup Instructions

1. Clone the repository:

    ```bash
    git clone https://github.com/your-username/authentication-system.git
    ```

2. Install backend dependencies:

    Navigate to the `backend` folder and install the required dependencies:

    ```bash
    cd backend
    npm install
    ```

3. Create a `.env` file in the `backend` folder with the following variables:

    ```env
    NODE_ENV=development
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    EMAIL_HOST=your_email_host
    EMAIL_PORT=your_email_port
    EMAIL_USER=your_email_user
    EMAIL_PASS=your_email_password
    FRONTEND_URL=http://localhost:3000
    ```

    Replace `your_mongodb_connection_string`, `your_jwt_secret`, and email details with your own credentials.

4. Run the backend server:

    ```bash
    cd backend
    npm start
    ```

    The backend server should now be running on `http://localhost:5000`.

## Folder Structure

```Tree Structuer
/backend 
├── /controllers # Handles requests for authentication (e.g., register, login, password reset) 
├── /models # Mongoose models for user and email verification (e.g., User model, Token model) 
├── /routes # Express routes for authentication (e.g., auth routes for login, register, password reset) 
├── /middleware # Middleware for JWT authentication and protecting routes 
├── /config # Configuration for email service, JWT, and environment variables 
└── server.js # Entry point for the backend server and route initialization
```
## API Endpoints

### 1. **POST /api/users/register**
   - **Description**: Registers a new user or sends a verification email if the email already exists but is unverified.
   - **Request Body**:
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "password123",
       "role": "student"
     }
     ```
   - **Response**:
     - **200 OK**: 
       ```json
       {
         "message": "Verification email sent. Please check your inbox."
       }
       ```
     - **400 Bad Request**: 
       ```json
       {
         "error": "Email already verified. Please log in."
       }
       ```
     - **200 OK**: 
       ```json
       {
         "message": "Verification email resent. Please check your inbox."
       }
       (if email is not verified)


### 2. **GET /api/users/verify-email**
   - **Description**: Verifies a user's email address using a token received via email.
   - **Query Parameter**:
     - `token`: The verification token sent to the user's email.
   - **Response**:
     - **200 OK**:
       ```json
       {
         "message": "Email verified successfully. You can now log in."
       }
       ```
     - **400 Bad Request**:
       ```json
       {
         "error": "Invalid or expired verification token."
       }
       ```

### 3. **POST /api/users/login**
   - **Description**: Logs the user in and generates a JWT, which is set as an HTTP-only cookie.
   - **Request Body**:
     ```json
     {
       "email": "john@example.com",
       "password": "password123"
     }
     ```
   - **Response**:
     - **200 OK**:
       ```json
       {
         "message": "Login successful",
         "token": "<JWT_TOKEN>"
       }
       ```
     - **401 Unauthorized**:
       ```json
       {
         "error": "Invalid email or password"
       }
       ```
     - **403 Forbidden**:
       ```json
       {
         "error": "Email not verified. Please check your inbox."
       }
       ```

### 4. **POST /api/users/forgot-password**
   - **Description**: Sends a password reset email with a reset link.
   - **Request Body**:
     ```json
     {
       "email": "john@example.com"
     }
     ```
   - **Response**:
     - **200 OK**:
       ```json
       {
         "message": "If a user exists with that email, a reset link has been sent."
       }
       ```

### 5. **POST /api/users/reset-password**
   - **Description**: Resets the user's password using a reset token sent to the user's email.
   - **Query Parameter**:
     - `token`: The password reset token sent to the user's email.
   - **Request Body**:
     ```json
     {
       "password": "newpassword123"
     }
     ```
   - **Response**:
     - **200 OK**:
       ```json
       {
         "message": "Password reset successfully."
       }
       ```
     - **400 Bad Request**:
       ```json
       {
         "error": "Invalid or expired reset token. Please try again."
       }
       ```
---

## Technologies Used

- **Backend**: Node.js, Express, MongoDB, JWT (JSON Web Tokens)
- **Email**: Nodemailer (for sending verification and reset emails)




