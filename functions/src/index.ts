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

const getEdgePath = (parentIds: string[], edgeId: string) => {
  if (parentIds.length === 1) {
    return `graphs/${parentIds[0]}/edges/${edgeId}`;
  } else {
    const parentsPath = parentIds.reduce(
      (path: string, parentId: string, currentIndex) =>
        `${path}/${parentId}/${
          currentIndex + 1 < parentIds.length ? 'nodes' : 'edges'
        }`,
      `graphs`
    );
    return `${parentsPath}/${edgeId}`;
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

    const { id, ...payload } = messageBody.data.payload;
    const { kind, ...data } = payload;

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(`graphs/${id}`);

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

    const { id, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(`graphs/${id}`);
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

    const { id, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const uploadRef = firestore.doc(`uploads/${payload.fileId}`);
      const graphRef = firestore.doc(`graphs/${id}`);
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();

      transaction.set(uploadRef, {
        ref: id,
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
            id,
            changes: {
              thumbnailUrl: payload.fileUrl,
            },
            referenceIds: payload.referenceIds,
            parentIds: payload.parentIds,
            kind: payload.kind,
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

    const { id, parentIds, graphId, referenceIds, ...payload } =
      messageBody.data.payload;
    const { kind, ...data } = payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, id));

      transaction.set(nodeRef, {
        id,
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

    const { id, parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    const nodeRef = firestore.doc(getNodePath(parentIds, id));

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

    const { id, parentIds, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, id));
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

    const { id, parentIds, ...payload } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const uploadRef = firestore.doc(`uploads/${payload.fileId}`);
      const nodeRef = firestore.doc(getNodePath(parentIds, id));
      const node = await transaction.get(nodeRef);
      const nodeData = node.data();

      // Save the upload for tracking purposes
      transaction.set(uploadRef, {
        ref: id,
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
            kind: messageBody.data.payload.kind,
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

    const { id, parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    const nodeRef = firestore.doc(getNodePath(parentIds, id));

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

    const { id, parentIds } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getNodePath(parentIds, id));

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

export const createEdge = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createEdge'
    ) {
      functions.logger.warn('createEdge', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id, parentIds, graphId, referenceIds, ...payload } =
      messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const edgeRef = firestore.doc(getEdgePath(parentIds, id));

      transaction.set(edgeRef, {
        id,
        data: payload,
        createdAt: context.timestamp,
        lastEventId: messageBody.id,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'createEdgeSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'createEdgeSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createEdgeSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createEdgeSuccess'
    ) {
      functions.logger.warn('createEdgeSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id, parentIds } = messageBody.data.payload;

    const parentRef = firestore.doc(getParentPath(parentIds));

    await parentRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    const edgeRef = firestore.doc(getEdgePath(parentIds, id));

    await edgeRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const deleteEdge = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteEdge'
    ) {
      functions.logger.warn('deleteEdge', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id, parentIds } = messageBody.data.payload;

    await firestore.runTransaction(async (transaction) => {
      const nodeRef = firestore.doc(getEdgePath(parentIds, id));

      transaction.delete(nodeRef);
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'deleteEdgeSuccess',
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'deleteEdgeSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const deleteEdgeSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteEdgeSuccess'
    ) {
      functions.logger.warn('deleteEdgeSuccess', 'Event ignored');
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

export const saveCheckpoint = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'saveCheckpoint'
    ) {
      functions.logger.warn('saveCheckpoint', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id, name, applicationId, workspaceId } = messageBody.data.payload;

    const [application, applicationNodes, applicationEdges] = await Promise.all(
      [
        firestore.doc(`graphs/${workspaceId}/nodes/${applicationId}`).get(),
        firestore
          .collection(`graphs/${workspaceId}/nodes/${applicationId}/nodes`)
          .get(),
        firestore
          .collection(`graphs/${workspaceId}/nodes/${applicationId}/edges`)
          .get(),
      ]
    );

    const applicationCheckpointRef = firestore.doc(
      `graphs/${workspaceId}/nodes/${applicationId}/checkpoints/${id}`
    );
    await applicationCheckpointRef.set({
      name,
      graph: application.data(),
      nodes: applicationNodes.docs.map((node) => ({
        id: node.id,
        ...node.data(),
      })),
      edges: applicationEdges.docs.map((edge) => ({
        id: edge.id,
        ...edge.data(),
      })),
      createdAt: context.timestamp,
    });

    return true;
  });

export const installApplication = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'installApplication'
    ) {
      functions.logger.warn('installApplication', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const { id, data, applicationId, workspaceId } = messageBody.data.payload;

    const installationRef = firestore.doc(
      `graphs/${workspaceId}/nodes/${applicationId}/installations/${id}`
    );
    await installationRef.set({
      data,
      createdAt: context.timestamp,
    });

    return true;
  });
