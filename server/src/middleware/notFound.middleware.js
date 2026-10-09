export const notFoundMiddleware = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      ...(req.requestId ? { requestId: req.requestId } : {})
    }
  });
};
