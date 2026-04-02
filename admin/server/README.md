# Admin Server - CRUD Operations Backend

A **dedicated Express.js server** for the DevMatch Admin Panel that handles all Create, Read, Update, and Delete (CRUD) operations.

## 📋 Features

- ✅ **Create Developers** - Add new developers to the database
- ✅ **Read Developers** - Fetch all developers or specific developer details
- ✅ **Update Developers** - Modify existing developer information
- ✅ **Delete Developers** - Remove developers with cascading deletes
- ✅ **Validation** - Email validation, duplicate checking
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Database Transactions** - Safe delete operations with rollback
- ✅ **CORS Enabled** - Works with the frontend on different ports

## 🚀 Setup & Installation

### Prerequisites
- Node.js 16+ installed
- MySQL database running
- Database configuration available

### Step 1: Install Dependencies

```bash
cd admin/server
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `admin/server` directory:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=devmatch
PORT=3002
NODE_ENV=development
```

### Step 3: Start the Server

```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Server will run at: **http://localhost:3002**

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{ status: 'ok', database: 'connected' }`

### Get All Developers
```
GET /api/developers
```
Returns: Array of all developers with calculated scores

### Get Single Developer
```
GET /api/developers/:userId
```
Returns: Single developer object

### Create Developer
```
POST /api/developers
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "country": "India",
  "state": "Tamil Nadu",
  "followers_count": 100,
  "bio": "Optional bio",
  "skills": "Optional skills"
}
```
Returns: `201 Created` with new user data

### Update Developer
```
PUT /api/developers/:userId
Content-Type: application/json

{
  "username": "updated_name",
  "email": "newemail@example.com",
  "country": "India",
  "state": "Kerala",
  "followers_count": 150
}
```
Returns: `200 OK` with updated user data

### Delete Developer
```
DELETE /api/developers/:userId
```
Returns: `200 OK` with confirmation message

### Get Languages
```
GET /api/languages
```
Returns: Array of all available programming languages

### Get Statistics
```
GET /api/stats
```
Returns: Database statistics (total users, repos, commits, languages)

## 🔄 How Admin Panel Works

1. **Frontend** (port 5174) calls **Admin Server** (port 3002)
2. **Admin Server** queries **Main Database** (MySQL)
3. **Main Server** (port 3001) remains autonomous - NOT used by admin

## 🛡️ Data Validation

### Email Validation
- Must be in valid format (example@domain.com)
- Must be unique across all developers
- Case-insensitive

### Username Validation
- Required field (cannot be empty)
- Trimmed of whitespace

### Cascading Delete
When a developer is deleted:
1. Pull requests are deleted
2. Commits are deleted
3. Repository language mappings are deleted
4. Repository statistics are deleted
5. Repositories are deleted
6. User record is deleted

All within a database transaction (rollback on error).

## 📁 Project Structure

```
admin/server/
├── server.js           # Main application file
├── package.json        # Dependencies
├── .env                # Environment variables (not in git)
├── .env.example        # Example configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | MySQL host |
| DB_PORT | 3306 | MySQL port |
| DB_USER | root | MySQL username |
| DB_PASSWORD | (empty) | MySQL password |
| DB_NAME | devmatch | Database name |
| PORT | 3002 | Admin server port |
| NODE_ENV | development | Environment |

## 🔗 Integration with Admin Frontend

The admin frontend (`admin/src`) is configured to use:
```javascript
const API = "http://localhost:3002/api"
```

Make sure **both frontend AND backend are running**:

### Terminal 1: Admin Frontend
```bash
cd admin
npm run dev
# Runs on http://localhost:5174
```

### Terminal 2: Admin Server
```bash
cd admin/server
npm run dev
# Runs on http://localhost:3002
```

### Terminal 3: Main Backend (Optional)
```bash
cd backend
npm run server
# Runs on http://localhost:3001
```

## 🚨 Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful read/update
- `201 Created` - Successful creation
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate email/username
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "Descriptive error message"
}
```

## 💡 Development Tips

### Test Endpoints with cURL

```bash
# Get all developers
curl http://localhost:3002/api/developers

# Health check
curl http://localhost:3002/api/health

# Create developer
curl -X POST http://localhost:3002/api/developers \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","country":"India"}'

# Update developer
curl -X PUT http://localhost:3002/api/developers/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"updated","email":"updated@example.com"}'

# Delete developer
curl -X DELETE http://localhost:3002/api/developers/1
```

### Enable Debug Logging

The server logs all operations to console. Add timestamps and request details as needed in `server.js`.

## 📝 Notes

- The admin server is **completely separate** from the main backend
- No CRUD endpoints in main `backend/server.js`
- Admin changes are made directly to the shared database
- Main frontend still uses the main backend API for searching/reading
- All delete operations are transactional for data integrity

## 🤝 Support

For issues:
1. Check database connection in `.env`
2. Verify MySQL is running
3. Check console logs for error messages
4. Ensure ports 3002 (admin server) is not in use
