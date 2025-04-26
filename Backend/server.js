const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });
const dbConnection = require('./config/database');
const ApiError = require('./utils/apiError');
const globalErrorHandler = require('./middlewares/errorMiddleware');

const userRoute = require('./routes/userRoute');

// Connect with db
dbConnection();

const app = express();

// Middlewares
app.use(express.json());

// Importing routes (log every request to the console)
// Dev only
if (process.env.Node_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.Node_ENV}`);
}

// Importing routes
app.use('/api/v1/users', userRoute);

app.all('/{*any}', (req, res, next) => {
  next(new ApiError(`can't find this route: ${req.originalUrl}`, 404));
});

// globalErrorHandler
app.use(globalErrorHandler);

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
