# Student-Teacher Appointment Booking System

This is a web-based application that allows students to book appointments with teachers. The system is built with HTML, CSS, and vanilla JavaScript, using Firebase for the backend database and authentication.

## Live Demo

[Link to your deployed website will go here after you complete the deployment step]

## Features

The application has three user roles with distinct functionalities:

### 1. Admin
- **Login**: Secure login for the administrator.
- **Add Teachers**: Create new teacher accounts with their name, department, subject, email, and a temporary password.
- **Manage Teachers**: View and delete existing teacher records.
- **Approve Students**: View a list of newly registered students and approve their accounts to grant them access.

### 2. Teacher
- **Login**: Secure login for teachers.
- **Set Availability**: Teachers can set their available time slots by specifying a date, start time, and end time.
- **Manage Availability**: View and delete their own available slots.
- **Manage Appointments**: View pending appointment requests from students and either approve or cancel them.
- **View Confirmed Appointments**: See a list of all their confirmed appointments.

### 3. Student
- **Register**: Students can create a new account. New accounts require admin approval.
- **Login**: Secure login for approved students.
- **Search Teachers**: Search for teachers by name, subject, or department.
- **Book Appointment**: View a teacher's available slots and send a booking request with a stated purpose.
- **View Appointments**: See the status of their own appointments (pending, confirmed, or cancelled).

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Firebase
  - **Firestore**: NoSQL database for storing user data, availability, and appointments.
  - **Firebase Authentication**: For handling user registration and login.
- **Deployment**: Firebase Hosting

## Project Setup and Execution

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd student-teacher-booking
    ```

2.  **Create a Firebase Project:**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - Add a new Web App to your project.
    - Enable **Authentication** (with Email/Password provider).
    - Enable **Firestore Database** (start in test mode for development).

3.  **Configure Firebase:**
    - In your Firebase project settings, find your web app's configuration object.
    - Copy this object and paste it into the `js/firebase-config.js` file.

4.  **Create Admin User:**
    - In the Firebase console, go to **Authentication** -> **Users** and manually add an admin user with the email `admin@unifiedmentor.com`.

5.  **Run the Application:**
    - Open the `index.html` file in your web browser. You can use a simple web server or a VS Code extension like "Live Server" for the best experience.

## System Workflow

1.  An **Admin** logs in and adds **Teachers** to the system.
2.  A **Student** registers for an account.
3.  The **Admin** approves the student's registration.
4.  The **Teacher** logs in and sets their available time slots.
5.  The **Student** logs in, searches for a teacher, and books an available slot.
6.  The **Teacher** receives the appointment request and approves it.
7.  The **Student** can now see their confirmed appointment.
