import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { v4 as uuid } from 'uuid';

const pubsub = new PubSub();
admin.initializeApp();
const firestore = admin.firestore();

const getNodePath = (parentIds: string[], nodeId: string) => {
  if (parentIds.length === 1) {
    return `graphs/${parentIds[0]}/nodes/${nodeId}`;
  } else {
    const parentsPath = parentIds.reduce(
      (path: string, parentId: string) => `${path}/${parentId}/nodes`,
      `graphs`
    );
    return `${parentsPath}/${nodeId}`;
  }
};

const getParentPath = (parentIds: string[]) => {
  if (parentIds.length === 1) {
    return `graphs/${parentIds[0]}`;
  } else {
    const parentsPath = parentIds
      .slice(0, -1)
      .reduce(
        (path: string, parentId: string) => `${path}/${parentId}/nodes`,
        `graphs`
      );
    const parentId = parentIds.at(-1);

    return `${parentsPath}/${parentId}`;
  }
};

export const publishEvent = functions.https.onCall(async (data, context) => {
  functions.logger.info('data', data);

  pubsub.topic('events').publishJSON(
    {
      id: uuid(),
      data,
    },
    { type: data.type },
    (error) => {
      functions.logger.error(error);
    }
  );

  return {
    message: 'yoo',
  };
});

export const persistEvent = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const eventRef = firestore.doc(`events/${messageBody.id}`);
    const { referenceIds, ...payload } = messageBody.data.payload;

    const event = {
      payload,
      type: messageBody.data.type,
      clientId: messageBody.data.clientId,
      correlationId: messageBody.data.correlationId ?? null,
      createdAt: context.timestamp,
      referenceIds: referenceIds ?? [],
    };
    await eventRef.set(event);

    return true;
  });

/* 
export const mutateGraphState = functions.pubsub
  .topic('events')
  .onPublish(async (message) => {
    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const graphRef = firestore.doc(`graphs/${messageBody.graphId}`);

    return firestore.runTransaction(async (transaction) => {
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();

      const nodes = graphData?.['nodes'] ?? [];
      const edges = graphData?.['edges'] ?? [];

      switch (messageBody.type) {
        case 'CreateWorkspace': {
          const workspaceRef = firestore.doc(
            `graphs/${messageBody.payload.id}`
          );

          transaction.set(workspaceRef, {
            ...messageBody.payload,
            thumbnailUrl: 'assets/generic/workspace.png',
            kind: 'workspace',
            nodes: [],
            edges: [],
            lastEventId: messageBody.id,
          });

          break;
        }

        case 'UpdateWorkspace': {
          const workspaceRef = firestore.doc(
            `graphs/${messageBody.payload.id}`
          );

          transaction.update(workspaceRef, {
            ...messageBody.payload.changes,
            lastEventId: messageBody.id,
          });
          break;
        }

        case 'CreateApplication': {
          const workspaceRef = firestore.doc(
            `graphs/${messageBody.payload.workspaceId}`
          );
          const applicationRef = firestore.doc(
            `graphs/${messageBody.payload.id}`
          );
          const workspace = await transaction.get(workspaceRef);
          const workspaceData = workspace.data();
          const nodes = workspaceData?.['nodes'] ?? [];

          transaction.update(workspaceRef, {
            nodes: [
              ...nodes,
              {
                ...messageBody.payload,
                thumbnailUrl: 'assets/generic/application.png',
              },
            ],
            lastEventId: messageBody.id,
          });

          transaction.set(applicationRef, {
            ...messageBody.payload,
            kind: 'application',
            thumbnailUrl: 'assets/generic/application.png',
            nodes: [],
            edges: [],
            lastEventId: messageBody.id,
          });

          break;
        }

        case 'UpdateApplication': {
          const applicationRef = firestore.doc(
            `graphs/${messageBody.payload.id}`
          );
          const application = await transaction.get(applicationRef);
          const applicationData = application.data();
          const workspaceId = applicationData?.['workspaceId'];
          const workspaceRef = firestore.doc(`graphs/${workspaceId}`);
          const workspace = await transaction.get(workspaceRef);
          const workspaceData = workspace.data();

          transaction.update(applicationRef, {
            ...messageBody.payload.changes,
            lastEventId: messageBody.id,
          });

          break;
        }

        case 'UpdateGraph': {
          const graphRef = firestore.doc(`graphs/${messageBody.payload.id}`);

          transaction.update(graphRef, {
            ...messageBody.payload.changes,
            lastEventId: messageBody.id,
          });
          break;
        }

        case 'DeleteGraph': {
          const graphRef = firestore.doc(`graphs/${messageBody.payload.id}`);

          transaction.delete(graphRef);
          break;
        }

        case 'UploadThumbnail': {
          const graphRef = firestore.doc(`graphs/${messageBody.payload.id}`);
          const uploadRef = firestore.doc(
            `uploads/${messageBody.payload.fileId}`
          );

          transaction.set(uploadRef, {
            kind: 'workspace',
            ref: messageBody.graphId,
          });
          transaction.update(graphRef, {
            thumbnailUrl: messageBody.payload.fileUrl,
            lastEventId: messageBody.id,
          });

          break;
        }

        case 'AddNodeSuccess': {
          transaction.update(graphRef, {
            nodes: [...nodes, messageBody.payload],
            lastEventId: messageBody.id,
          });
          break;
        }
        case 'AddNodeToEdgeSuccess': {
          transaction.update(graphRef, {
            edges: edges
              .filter((edge: { id: string }) => {console.log(message);
                return edge.id !== messageBody.payload.edgeId;
              })
              .concat([
                {
                  id: `${messageBody.payload.source}/${messageBody.payload.node.id}`,
                  source: messageBody.payload.source,
                  target: messageBody.payload.node.id,
                },
                {
                  id: `${messageBody.payload.node.id}/${messageBody.payload.target}`,
                  source: messageBody.payload.node.id,
                  target: messageBody.payload.target,
                },
              ]),
            nodes: [...nodes, messageBody.payload.node],
            lastEventId: messageBody.id,
          });
          break;
        }
        case 'DeleteNodeSuccess': {
          transaction.update(graphRef, {
            nodes: nodes.filter((node: { id: string }) => {
              return node.id !== messageBody.payload;
            }),
            edges: edges.filter((edge: { source: string; target: string }) => {
              return (
                edge.source !== messageBody.payload &&
                edge.target !== messageBody.payload
              );
            }),
            lastEventId: messageBody.id,
          });
          break;
        }
        case 'AddEdgeSuccess': {
          transaction.update(graphRef, {
            edges: [...edges, messageBody.payload],
            lastEventId: messageBody.id,
          });
          break;
        }
        case 'DeleteEdgeSuccess': {
          transaction.update(graphRef, {
            edges: edges.filter((edge: { id: string }) => {
              return edge.id !== messageBody.payload;
            }),
            lastEventId: messageBody.id,
          });
          break;
        }
        default:
          return false;
      }

      return true;
    });
  }); */

export const createGraph = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createGraph'
    ) {
      functions.logger.warn('createGraph', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: graphId, ...payload } = messageBody.data.payload;
    const { kind, ...data } = payload;

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(`graphs/${graphId}`);

      transaction.set(graphRef, {
        data,
        kind,
        lastEventId: messageBody.id,
        createdAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'createGraphSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'createGraphSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createGraphSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createGraphSuccess'
    ) {
      functions.logger.warn('createGraphSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const graphRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await graphRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateGraph = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateGraph'
    ) {
      functions.logger.warn('updateGraph', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: graphId, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(`graphs/${graphId}`);
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();

      transaction.update(graphRef, {
        data: {
          ...graphData?.['data'],
          ...payload.changes,
        },
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'updateGraphSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'updateGraphSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateGraphThumbnail = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateGraphThumbnail'
    ) {
      functions.logger.warn('updateGraphThumbnail', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: graphId, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const uploadRef = firestore.doc(`uploads/${payload.fileId}`);
      const graphRef = firestore.doc(`graphs/${graphId}`);
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();

      transaction.set(uploadRef, {
        ref: graphId,
        createdAt: context.timestamp,
      });

      transaction.update(graphRef, {
        data: {
          ...graphData?.['data'],
          thumbnailUrl: payload.fileUrl,
        },
        lastEventId: context.eventId,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: messageBody.id,
        data: {
          payload: {
            id: graphId,
            changes: {
              thumbnailUrl: payload.fileUrl,
            },
            referenceIds: payload.referenceIds,
          },
          type: 'updateGraphThumbnailSuccess',
          clientId: messageBody.data.clientId,
          correlationId: context.eventId,
        },
      },
      { type: 'updateGraphThumbnailSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateGraphSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateGraphSuccess' &&
      message.attributes.type !== 'updateGraphThumbnailSuccess'
    ) {
      functions.logger.warn('updateGraphSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const graphRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await graphRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const deleteGraph = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteGraph'
    ) {
      functions.logger.warn('deleteGraph', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);
      transaction.delete(graphRef);
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'deleteGraphSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'deleteGraphSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createNode = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createNode'
    ) {
      functions.logger.warn('createNode', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const {
      id: nodeId,
      parentIds,
      graphId,
      referenceIds,
      ...payload
    } = messageBody.data.payload;
    const { kind, ...data } = payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));

      transaction.set(nodeRef, {
        id: nodeId,
        data,
        kind,
        createdAt: context.timestamp,
        lastEventId: messageBody.id,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'createNodeSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'createNodeSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createNodeSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createNodeSuccess'
    ) {
      functions.logger.warn('createNodeSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: nodeId, parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));

    await nodeRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateNode = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateNode'
    ) {
      functions.logger.warn('updateNode', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: nodeId, parentIds, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));
      const node = await transaction.get(nodeRef);
      const nodeData = node.data();

      transaction.update(nodeRef, {
        data: {
          ...nodeData?.['data'],
          ...payload.changes,
        },
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'updateNodeSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'updateNodeSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateNodeThumbnail = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateNodeThumbnail'
    ) {
      functions.logger.warn('updateNodeThumbnail', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: nodeId, parentIds, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const uploadRef = firestore.doc(`uploads/${payload.fileId}`);
      const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));
      const node = await transaction.get(nodeRef);
      const nodeData = node.data();

      // Save the upload for tracking purposes
      transaction.set(uploadRef, {
        ref: nodeId,
        createdAt: context.timestamp,
      });

      transaction.update(nodeRef, {
        data: {
          ...nodeData?.['data'],
          thumbnailUrl: payload.fileUrl,
        },
        lastEventId: context.eventId,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: messageBody.id,
        data: {
          payload: {
            id: messageBody.data.payload.id,
            changes: {
              thumbnailUrl: messageBody.data.payload.fileUrl,
            },
            kind: messageBody.data.kind,
            parentIds,
            referenceIds: messageBody.data.payload.referenceIds,
            graphId: messageBody.data.payload.graphId,
          },
          type: 'updateNodeThumbnailSuccess',
          clientId: messageBody.data.clientId,
          correlationId: context.eventId,
        },
      },
      { type: 'updateNodeThumbnailSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateNodeSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateNodeSuccess' &&
      message.attributes.type !== 'updateNodeThumbnailSuccess'
    ) {
      functions.logger.warn('updateNodeSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: nodeId, parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));

    await nodeRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const deleteNode = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteNode'
    ) {
      functions.logger.warn('deleteNode', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id: nodeId, parentIds } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, nodeId));

      transaction.delete(nodeRef);
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'deleteNodeSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'deleteNodeSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const deleteNodeSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteNodeSuccess'
    ) {
      functions.logger.warn('deleteNodeSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });
