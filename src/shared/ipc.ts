export const IPC = {
  settings: {
    get: 'settings:get',
    save: 'settings:save',
  },
  objectStorage: {
    testConnection: 'objectStorage:testConnection',
    upload: 'objectStorage:upload',
    deleteByConversation: 'objectStorage:deleteByConversation',
    refreshUrl: 'objectStorage:refreshUrl',
    deleteKeys: 'objectStorage:deleteKeys',
  },
  storage: {
    metaGet: 'storage:meta:get',
    metaSet: 'storage:meta:set',
    conversationsList: 'storage:conversations:list',
    conversationsGet: 'storage:conversations:get',
    conversationsCreate: 'storage:conversations:create',
    conversationsUpdate: 'storage:conversations:update',
    conversationsDelete: 'storage:conversations:delete',
    messagesAppend: 'storage:messages:append',
    messagesUpdate: 'storage:messages:update',
  },
} as const;
