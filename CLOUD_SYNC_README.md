# Cloud Sync Setup for Jigarthanda App

## 🚀 PostgreSQL Cloud Database Integration

This setup provides real-time cloud synchronization for the Jigarthanda app using PostgreSQL database.

## 📋 Prerequisites

1. **PostgreSQL Database**
   ```bash
   # Install PostgreSQL
   brew install postgresql  # macOS
   # Or download from https://postgresql.org/
   ```

2. **Database Setup**
   ```sql
   -- Create database
   CREATE DATABASE jigarthanda_db;
   
   -- Create user (optional)
   CREATE USER jigarthanda_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE jigarthanda_db TO jigarthanda_user;
   ```

3. **Environment Variables**
   ```bash
   # Create .env file in server directory
   echo "DB_PASSWORD=your_password" > server/.env
   ```

## 🔧 Installation & Setup

### 1. Install Server Dependencies
```bash
cd server
npm install
```

### 2. Start PostgreSQL Server
```bash
# Start PostgreSQL service
brew services start postgresql

# Or start manually
pg_ctl -D /usr/local/var/postgresql start
```

### 3. Start Backend Server
```bash
cd server
npm start
```

### 4. Start Mobile App
```bash
cd jigarthanda-app
npm install
npm start
```

## 📊 Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  grandTotal DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paymentMethod VARCHAR(20) NOT NULL,
  syncedAt TIMESTAMP,
  cloudId VARCHAR(50)
);
```

### Shop Settings Table
```sql
CREATE TABLE shop_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nameLocal VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  gstNumber VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Sync Features

### **Automatic Sync**
- **Real-time**: Orders sync to cloud when created
- **5-minute intervals**: Background sync for data consistency
- **Conflict resolution**: Updates existing records on conflicts
- **Offline support**: Local storage when cloud unavailable

### **Data Flow**
1. **Mobile App** → Creates order locally
2. **Cloud Sync** → Automatically syncs to PostgreSQL
3. **Server** → Stores in database with timestamps
4. **Multi-device** → All devices see same data

## 🛠 API Endpoints

### Orders
- `POST /api/orders/sync` - Sync orders to cloud
- `GET /api/orders` - Fetch all orders
- `GET /api/health` - Server health check

### Settings
- `POST /api/settings/sync` - Sync shop settings
- `GET /api/settings` - Fetch shop settings

## 🔐 Security Features

- **CORS enabled** for mobile app communication
- **Input validation** on all API endpoints
- **Error handling** with proper HTTP status codes
- **SQL injection protection** using parameterized queries

## 📱 Mobile App Integration

The mobile app now includes:
- **CloudSyncService**: Handles all cloud operations
- **Auto-sync**: Background synchronization every 5 minutes
- **Offline support**: Local storage fallback
- **Conflict resolution**: Smart merging of data

## 🚀 Deployment

### Development
```bash
# Server (port 3000)
cd server && npm run dev

# Mobile (port 8081)
cd jigarthanda-app && npm start
```

### Production
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server/index.js --name "jigarthanda-server"

# Environment variables
export NODE_ENV=production
export DB_PASSWORD=your_production_password
```

## 📈 Monitoring

### Server Logs
- Order creation and sync status
- Error tracking and resolution
- Performance metrics
- Database connection status

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 🔄 Data Migration

Existing local data will be automatically synced when:
1. Server is started
2. Mobile app comes online
3. Manual sync is triggered

## 📞 Troubleshooting

### Common Issues
1. **Database connection**: Check PostgreSQL service status
2. **CORS errors**: Verify mobile app URL
3. **Sync failures**: Check network connectivity
4. **TypeScript errors**: Run `npm install` to update dependencies

### Solutions
```bash
# Reset database
psql -d jigarthanda_db -U postgres -c "DROP TABLE orders; DROP TABLE shop_settings;"

# Clear local storage
# Mobile app will automatically re-sync on next start
```

## 📞 Support

For issues:
1. Check server logs: `cd server && npm start`
2. Verify database: `psql -d jigarthanda_db -U postgres -c "\dt"`
3. Test API: `curl http://localhost:3000/api/health`
