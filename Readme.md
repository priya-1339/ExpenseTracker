# Personal Expense Tracker

## Overview

This is a web-based Personal Expense Tracker application built with Flask and SQLite. The application allows users to track their expenses by recording amounts, categories, descriptions, and dates. It provides a dashboard with summary statistics, filtering capabilities, and visual analytics through charts. The app is designed to help users monitor their spending habits and analyze expense patterns over time.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Problem**: Need an interactive, responsive interface for expense tracking and data visualization.

**Solution**: Client-side rendered application using vanilla JavaScript with Bootstrap 5 for UI components and responsive design.

**Key Design Decisions**:
- **Template Engine**: Server-side Jinja2 templating for initial HTML rendering
- **CSS Framework**: Bootstrap 5 for responsive grid system and pre-built components
- **JavaScript**: Vanilla JS for DOM manipulation and AJAX calls (no framework dependencies)
- **Charts**: Separate chart rendering functions for category and monthly analytics (implementation appears to use Chart.js based on variable names)
- **State Management**: Local component state with async/await pattern for API calls

**Rationale**: Lightweight approach avoids framework overhead for a simple CRUD application while maintaining good user experience.

### Backend Architecture

**Problem**: Need a lightweight backend to handle expense CRUD operations and provide analytics.

**Solution**: Flask microframework with RESTful API design pattern.

**Key Design Decisions**:
- **Framework**: Flask for minimal overhead and simplicity
- **API Design**: RESTful endpoints for expenses and dashboard data
- **Session Management**: Flask sessions with configurable secret key (environment-based)
- **Response Format**: JSON for all data endpoints, HTML for initial page load
- **Error Handling**: Try-catch blocks on frontend for API error management

**Endpoints Structure**:
- `GET /` - Main application page
- `GET /expenses` - Retrieve expenses with optional filtering (category, date range)
- `GET /expenses/<id>` - Retrieve single expense by ID
- `GET /dashboard` - Analytics data (total expenses, counts, category/monthly breakdowns)
- `POST /expenses/add` - Create new expense
- `PUT /expenses/<id>` - Update existing expense
- `DELETE /expenses/<id>` - Delete expense

**Rationale**: Flask provides just enough structure for a small application without imposing unnecessary complexity.

### Data Storage

**Problem**: Need persistent storage for expense records with simple query capabilities.

**Solution**: SQLite database with SQLAlchemy ORM.

**Key Design Decisions**:
- **Database**: SQLite for zero-configuration, file-based storage
- **ORM**: Flask-SQLAlchemy for object-relational mapping
- **Schema Design**: Single `Expense` model with core expense attributes
- **Timestamps**: Separate `date` (user-provided) and `created_at` (system-generated) fields
- **Data Types**: Float for amounts, String for categories/descriptions, Date/DateTime for temporal data

**Expense Model Schema**:
```
- id: Integer (Primary Key)
- amount: Float (required)
- category: String(50) (required)
- description: String(200) (optional)
- date: Date (required, defaults to current date)
- created_at: DateTime (auto-generated)
```

**Pros**: 
- No separate database server required
- Easy deployment and portability
- Built-in ORM simplifies queries
- Adequate for single-user applications

**Cons**: 
- Not suitable for high-concurrency scenarios
- Limited scalability for multi-user deployments

**Rationale**: SQLite is perfect for personal expense tracking with single-user access patterns.

### Filtering and Analytics

**Problem**: Users need to filter expenses and view spending analytics.

**Solution**: Server-side filtering with query parameters and aggregation logic for dashboard metrics.

**Key Design Decisions**:
- **Filtering**: Query parameter-based filtering (category, start_date, end_date)
- **Aggregation**: Server-side calculation of totals and groupings
- **Visualization**: Client-side chart rendering with data provided by backend
- **Data Format**: JSON serialization via custom `to_dict()` method on models

**Rationale**: Server-side filtering reduces client-side data processing and maintains separation of concerns.

## External Dependencies

### Frontend Libraries
- **Bootstrap 5.3.0** (CDN): Responsive UI framework for layout and components
- **Bootstrap Icons 1.11.0** (CDN): Icon library for UI elements
- **Chart.js 4.4.0** (CDN): Data visualization library for category and monthly charts

### Backend Dependencies
- **Flask**: Web framework for routing and request handling
- **Flask-SQLAlchemy**: ORM integration for database operations
- **SQLAlchemy**: Core ORM library for database abstraction

### Database
- **SQLite**: File-based relational database (no external service required)
- Database file location: `sqlite:///expenses.db` (local file)

### Environment Configuration
- **SESSION_SECRET**: Environment variable for Flask session security (falls back to 'dev-secret-key')

### Deployment Considerations
- No external API integrations currently implemented
- No authentication/authorization system (single-user assumption)
- Static file serving handled by Flask development server
- Database migrations not implemented (using `db.create_all()` for schema creation)