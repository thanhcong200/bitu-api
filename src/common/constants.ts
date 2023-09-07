export const ErrorCode = {
  INVALID_DATA: 'E15',
  NO_DATA_EXISTS: 'E14',
  ALREADY_COMPLETED: 'already completed',
};

export const MIMEType = {
  APPLICATION_JSON: 'application/json',
  IMAGE_PNG: 'image/png',
};

export const QUEUE = {};

export const QUEUE_SETTINGS = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  delayedDebounce: 5000,
  removeOnSuccess: true,
  activateDelayedJobs: true,
};

export const MAX_RETRY = 3;

export const TIME_WAIT_RETRY = 300;

export const USER_AVATARS = [
  'https://bootdey.com/img/Content/avatar/avatar1.png',
  'https://bootdey.com/img/Content/avatar/avatar2.png',
  'https://bootdey.com/img/Content/avatar/avatar3.png',
  'https://bootdey.com/img/Content/avatar/avatar7.png',
  'https://bootdey.com/img/Content/avatar/avatar8.png',
];
