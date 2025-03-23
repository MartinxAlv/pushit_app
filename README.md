# PushIT - Deployment Management System

PushIT is a comprehensive deployment management system designed to help IT teams track and manage hardware deployment projects. Whether you're handling a small refresh or a large-scale rollout, PushIT provides the tools you need to manage the entire process from planning to completion.

## Features

- **Project Management**: Create and manage deployment projects with custom fields
- **Deployment Tracking**: Track individual deployments with detailed status information
- **User Management**: Role-based access control for administrators and technicians
- **Excel Integration**: Import and export deployment data using Excel spreadsheets
- **Custom Fields**: Define custom fields for each project to capture specific deployment requirements
- **Dashboard**: View deployment progress and statistics at a glance

## Technology Stack

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- Python 3.x

### Frontend
- React 19.0
- React Bootstrap
- React Router 7.4
- Axios for API communication
- XLSX.js for Excel file handling

## Getting Started

### Prerequisites

- Python 3.x
- Node.js and npm
- PostgreSQL

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pushit.git
   cd pushit
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   SECRET_KEY=your_secret_key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   DB_NAME=pushit
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

5. Set up the database:
   ```bash
   python manage.py migrate
   ```

6. Create initial data:
   ```bash
   python manage.py create_initial_data
   ```

7. Run the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. The application should now be running at `http://localhost:3000`

## Initial Login

After running the `create_initial_data` command, you can log in with the following default credentials:

- **Admin User**:
  - Username: `admin`
  - Password: `admin123`

- **Technician User**:
  - Username: `tech`
  - Password: `tech123`

**Important**: Change these passwords immediately after your first login for security purposes.

## Usage

### Project Workflow

1. **Create a Project**: Administrators can create deployment projects with custom fields
2. **Add Deployments**: Add individual deployments manually or import them from Excel
3. **Assign Technicians**: Assign technicians to deployments
4. **Track Progress**: Update deployment statuses as work progresses
5. **Export Data**: Export deployment data for reporting purposes

### User Roles

- **Administrators**: Can manage projects, users, and all deployments
- **Technicians**: Can view and update assigned deployments

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- This project uses [Create React App](https://github.com/facebook/create-react-app)
- UI components by [React Bootstrap](https://react-bootstrap.github.io/)
- Excel file handling by [SheetJS](https://sheetjs.com/)