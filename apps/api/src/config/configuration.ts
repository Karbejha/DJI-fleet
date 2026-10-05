export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dji-fleet-super-secure-production-secret-token-32chars',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  cookieSecret: process.env.COOKIE_SECRET || 'dji-fleet-cookie-secret-key-salt-987654321',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres_secure_password@localhost:5432/dji_fleet?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME || 'dji-raw-flight-logs',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || true,
  },
  parserService: {
    url: process.env.PARSER_SERVICE_URL || 'http://localhost:8000',
    timeoutMs: parseInt(process.env.PARSER_SERVICE_TIMEOUT_MS || '60000', 10),
  },
  djiApiKey: process.env.DJI_API_KEY || '',
});
