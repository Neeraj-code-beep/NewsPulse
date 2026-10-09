export const createCorsOptions = (clientUrl) => ({
  origin(origin, callback) {
    if (!origin) return callback(null, false);
    return callback(null, origin === clientUrl ? clientUrl : false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
});

export const createSocketCorsOptions = (clientUrl) => ({
  cors: createCorsOptions(clientUrl),
  allowRequest(request, callback) {
    const origin = request.headers.origin;
    callback(null, !origin || origin === clientUrl);
  }
});
