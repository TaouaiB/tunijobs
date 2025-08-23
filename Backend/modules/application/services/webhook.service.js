const asyncHandler = require('express-async-handler');
const ApiError = require('../../../core/utils/ApiError');

// Temporary storage (in-memory Map - works for development)
const analysisResults = new Map();

/**
 * @desc    Receive AI analysis results from n8n
 * @route   POST /api/v1/applications/webhook/n8n-results
 * @access  Public (n8n webhook)
 */
exports.receiveAnalysisResults = asyncHandler(async (req, res) => {
  const { applicationId, analysis } = req.body;

  // Validate required fields
  if (!applicationId) {
    throw new ApiError('applicationId is required', 400);
  }
  
  if (!analysis) {
    throw new ApiError('analysis data is required', 400);
  }

  console.log('📦 Received AI analysis for application:', applicationId);
  
  // Store in temporary memory
  analysisResults.set(applicationId, {
    analysis,
    receivedAt: new Date()
  });

  res.status(200).json({ 
    success: true, 
    message: 'Analysis received successfully',
    applicationId,
    receivedAt: new Date()
  });
});

/**
 * @desc    Get AI analysis results for an application
 * @route   GET /api/v1/applications/webhook/results/:applicationId
 * @access  Public (for testing)
 */
exports.getAnalysisResults = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!applicationId) {
    throw new ApiError('applicationId is required', 400);
  }

  const result = analysisResults.get(applicationId);
  
  if (!result) {
    throw new ApiError('No analysis results found for this application', 404);
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Get all stored analysis results (for debugging)
 * @route   GET /api/v1/applications/webhook/results
 * @access  Public (for testing)
 */
exports.getAllAnalysisResults = asyncHandler(async (req, res) => {
  const results = Array.from(analysisResults.entries()).map(([applicationId, data]) => ({
    applicationId,
    ...data
  }));

  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

/**
 * @desc    Clear analysis results (for testing)
 * @route   DELETE /api/v1/applications/webhook/results/:applicationId
 * @access  Public (for testing)
 */
exports.clearAnalysisResults = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  if (!applicationId) {
    throw new ApiError('applicationId is required', 400);
  }

  const deleted = analysisResults.delete(applicationId);
  
  res.status(200).json({
    success: true,
    message: deleted ? 'Results cleared successfully' : 'No results found to clear',
    applicationId
  });
});

/**
 * @desc    Check if webhook is working (health check)
 * @route   GET /api/v1/applications/webhook/health
 * @access  Public
 */
exports.healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date(),
    storedResults: analysisResults.size
  });
});