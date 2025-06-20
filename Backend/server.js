require('module-alias/register');
require('./core/utils/logger/logger');

const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });
const dbConnection = require('./core/config/database');
const ApiError = require('./core/utils/ApiError');
const ErrorHandler = require('./core/middlewares/errorMiddleware');

const userRoute = require('./modules/user/routes/userRoute');
const candidateRoute = require('./modules/candidate/routes/candidateRoute');
const companyRoute = require('./modules/company/routes/companyRoute');
const jobRoute = require('./modules/job/routes/jobRoute');
const applicationRoutes = require('./modules/application/routes/applicationRoute');
const authRoutes = require('./modules/auth/routes/auth.routes');

// Connect with db
dbConnection();

const app = express();

// Initialize error handler first
ErrorHandler.init(app);

// Middlewares
app.use(express.json());

// Importing routes (log every request to the console)
// Dev only
if (process.env.Node_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.Node_ENV}`);
}

// Import routes
app.use('/api/v1/users', companyRoute);
app.use('/api/v1/users', candidateRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/jobs', jobRoute);
app.use('/api/v1/companies', jobRoute);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/auth', authRoutes);


// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Catch all other routes and return a 404 error
app.all('/{*any}', (req, res, next) => {
  next(new ApiError(`can't find this route: ${req.originalUrl}`, 404));
});




// globalErrorHandler
app.use(ErrorHandler.handle());

// Start the server on port 5000 (or any available port)
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});
// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`unhandledRejection Errors: ${err.name} | ${err.message}`);
  // it will close the server , then close anything inside like process ( application )
  server.close(() => {
    console.error(`Shutting down ...`);
    process.exit(1);
  });
});

module.exports = app;
