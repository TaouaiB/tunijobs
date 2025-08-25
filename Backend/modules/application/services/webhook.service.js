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
  const body = req.body || {};
  const analysis = body.analysis ?? body;

  if (!analysis) {
    throw new ApiError('analysis data is required', 400);
  }

  // Prefer a stable ID if provided; otherwise generate one
  const baseId =
    body.resultId ||
    body.applicationId ||
    `ai-result-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const resultId = String(baseId).startsWith('ai-') ? baseId : `ai-${baseId}`;

  analysisResults.set(resultId, {
    analysis,
    receivedAt: new Date(),
    isTemporary: !body.applicationId,
  });

  console.log('✅ Stored analysis result:', resultId);

  // 🔴 Echo the payload back so you see the real content immediately
  return res.status(200).json({
    success: true,
    resultId,
    data: analysis, // ← this is the exact content n8n sent
  });
});

/**
 * @desc    Get AI analysis results for an application
 * @route   GET /api/v1/applications/webhook/results/:applicationId
 * @access  Public (for testing)
 */
exports.getAnalysisResults = asyncHandler(async (req, res) => {
  let { resultId } = req.params;

  if (resultId === 'latest') {
    const keys = Array.from(analysisResults.keys());
    if (!keys.length) throw new ApiError('No analysis results found', 404);
    resultId = keys[keys.length - 1];
  }

  if (!resultId) throw new ApiError('resultId is required', 400);

  const result = analysisResults.get(resultId);
  if (!result) throw new ApiError('No analysis results found', 404);

  res.status(200).json({ success: true, resultId, data: result });
});

/**
 * @desc    Get all stored analysis results (for debugging)
 * @route   GET /api/v1/applications/webhook/results
 * @access  Public (for testing)
 */
exports.getAllAnalysisResults = asyncHandler(async (_req, res) => {
  const results = Array.from(analysisResults.entries()).map(
    ([resultId, data]) => ({
      resultId,
      ...data,
    })
  );
  res.status(200).json({ success: true, count: results.length, data: results });
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
    message:
      deleted ? 'Results cleared successfully' : 'No results found to clear',
    applicationId,
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
    storedResults: analysisResults.size,
  });
});
