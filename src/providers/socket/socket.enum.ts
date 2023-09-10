export enum SOCKET_ROOM {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SOCKET_EVENT {
  MESSAGE = 'message-recieve',
  NEW_GROUP = 'new-group',
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum SOCKET_SUBCRIBE {
  MESSAGE = 'messages',
  GROUP = 'groups',
}
