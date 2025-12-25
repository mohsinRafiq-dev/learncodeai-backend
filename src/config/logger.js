import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  
  return ms.toFixed(3);
});

const detailedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

const devFormat = ':method :url :status :response-time ms - :res[content-length]';

const loggerConfig = {
  development: morgan(devFormat, {
    skip: (req, res) => res.statusCode >= 400
  }),

  production: [
    morgan(detailedFormat, {
      stream: accessLogStream
    }),
    
    morgan(detailedFormat, {
      stream: errorLogStream,
      skip: (req, res) => res.statusCode < 400
    }),
    
    morgan('combined')
  ],

  test: morgan('tiny', {
    skip: () => process.env.NODE_ENV === 'test'
  })
};

export default loggerConfig;
