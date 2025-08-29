# ProstateCancer-PreventionAPI
Web API for prostate cancer prevention, built with **Node.js** and **Angular**, featuring secure authentication, user management, medical questionnaires, and automated alerts for preventive healthcare.

## Overview
Its goal is to provide a digital solution that supports **prostate cancer prevention** by:
- Allowing registration and management of patients, doctors, and administrators;
- Enabling patients to complete clinical anamnesis questionnaires;
- Automatically generating alerts for medical follow-up and preventive exams;
- Offering a responsive and user-friendly web interface.

## Key Features
- **Administrator**
  - Register, edit, and remove users (admins, doctors, patients);
  - Manage user roles and permissions;
  - Centralized user overview.

- **Doctor**
  - View and manage patient data and questionnaires;
  - Monitor and respond to system-generated alerts;
  - Update personal profile and availability.

- **Patient**
  - Edit personal information;
  - Fill in clinical anamnesis questionnaires;
  - View, update, and manage medical alerts.

## Technologies Used
- **Backend:** Node.js, Express, MongoDB, Mongoose  
- **Frontend:** Angular (TypeScript, HTML, CSS)  
- **Tools:** Visual Studio Code, Postman  
- **Security:** JWT (JSON Web Tokens) authentication  
- **Data Format:** XML / XSD  

## Testing
API endpoints were tested with **Postman**, validating:
- User authentication and token validation;  
- CRUD operations for patients, doctors, and questionnaires;  
- Error handling for unauthorized or invalid requests.  

