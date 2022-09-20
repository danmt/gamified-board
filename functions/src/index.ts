import { PubSub } from '@google-cloud/pubsub';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { v4 as uuid } from 'uuid';

const pubsub = new PubSub();
admin.initializeApp();
const firestore = admin.firestore();

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
    const event = {
      payload: messageBody.data.payload,
      type: messageBody.data.type,
      clientId: messageBody.data.clientId,
      graphIds: messageBody.data.graphIds ?? [],
      correlationId: messageBody.data.correlationId ?? null,
      createdAt: context.timestamp,
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

export const createWorkspace = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createWorkspace'
    ) {
      functions.logger.warn('createWorkspace', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);
    const workspace = {
      ...messageBody.data.payload,
      thumbnailUrl: 'assets/generic/workspace.png',
    };

    await workspaceRef.set({
      data: {
        kind: 'workspace',
        name: workspace.name,
        thumbnailUrl: workspace.thumbnailUrl,
        userId: workspace.userId,
      },
      nodes: [],
      edges: [],
      lastEventId: messageBody.id,
      createdAt: context.timestamp,
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: workspace,
          type: 'createWorkspaceSuccess',
          graphIds: [messageBody.data.payload.id],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'createWorkspaceSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createWorkspaceSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createWorkspaceSuccess'
    ) {
      functions.logger.warn('createWorkspaceSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateWorkspace = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateWorkspace'
    ) {
      functions.logger.warn('updateWorkspace', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    firestore.runTransaction(async (transaction) => {
      const workspace = await transaction.get(workspaceRef);
      const workspaceData = workspace.data();

      transaction.update(workspaceRef, {
        data: {
          ...workspaceData?.['data'],
          ...messageBody.data.payload.changes,
        },
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: {
            id: messageBody.data.payload.id,
            changes: messageBody.data.payload.changes,
          },
          type: 'updateWorkspaceSuccess',
          graphIds: [messageBody.data.payload.id],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'updateWorkspaceSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateWorkspaceSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateWorkspaceSuccess'
    ) {
      functions.logger.warn('updateWorkspaceSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateWorkspaceThumbnail = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateWorkspaceThumbnail'
    ) {
      functions.logger.warn('updateWorkspaceThumbnail', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const graphRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);
    const uploadRef = firestore.doc(
      `uploads/${messageBody.data.payload.fileId}`
    );

    await firestore.runTransaction(async (transaction) => {
      const workspace = await transaction.get(graphRef);
      const workspaceData = workspace.data();

      transaction.set(uploadRef, {
        kind: 'workspace',
        ref: messageBody.data.payload.id,
        createdAt: context.timestamp,
      });
      transaction.update(graphRef, {
        data: {
          ...workspaceData?.['data'],
          thumbnailUrl: messageBody.data.payload.fileUrl,
        },
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: {
            id: messageBody.data.payload.id,
            fileId: messageBody.data.payload.fileId,
            fileUrl: messageBody.data.payload.fileUrl,
          },
          type: 'updateWorkspaceThumbnailSuccess',
          graphIds: [messageBody.data.payload.id],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'updateWorkspaceThumbnailSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateWorkspaceThumbnailSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateWorkspaceThumbnailSuccess'
    ) {
      functions.logger.warn('updateWorkspaceThumbnailSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const deleteWorkspace = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteWorkspace'
    ) {
      functions.logger.warn('deleteWorkspace', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(`graphs/${messageBody.data.payload.id}`);

    await workspaceRef.delete();

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: null,
          type: 'deleteWorkspaceSuccess',
          graphIds: [messageBody.data.payload.id],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'deleteWorkspaceSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createApplication = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createApplication'
    ) {
      functions.logger.warn('createApplication', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const workspaceRef = firestore.doc(
      `graphs/${messageBody.data.payload.workspaceId}`
    );
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    await firestore.runTransaction(async (transaction) => {
      const workspace = await transaction.get(workspaceRef);
      const workspaceData = workspace.data();
      const nodes = workspaceData?.['nodes'] ?? [];

      transaction.update(workspaceRef, {
        nodes: [
          ...nodes,
          {
            id: messageBody.data.payload.id,
            data: {
              name: messageBody.data.payload.name,
              kind: messageBody.data.payload.kind,
              workspaceId: messageBody.data.payload.workspaceId,
              thumbnailUrl: 'assets/generic/application.png',
            },
            createdAt: context.timestamp,
          },
        ],
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });

      transaction.set(applicationRef, {
        data: {
          name: messageBody.data.payload.name,
          kind: messageBody.data.payload.kind,
          workspaceId: messageBody.data.payload.workspaceId,
          thumbnailUrl: 'assets/generic/application.png',
        },
        nodes: [],
        edges: [],
        lastEventId: messageBody.id,
        createdAt: context.timestamp,
      });
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: {
            ...messageBody.data.payload,
            thumbnailUrl: 'assets/generic/application.png',
            nodes: [],
            edges: [],
          },
          type: 'createApplicationSuccess',
          graphIds: [
            messageBody.data.payload.id,
            messageBody.data.payload.workspaceId,
          ],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'createApplicationSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const createApplicationSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'createApplicationSuccess'
    ) {
      functions.logger.warn('createApplicationSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(
      `graphs/${messageBody.data.payload.workspaceId}`
    );
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });
    await applicationRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateApplication = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateApplication'
    ) {
      functions.logger.warn('updateApplication', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    const { workspaceId } = await firestore.runTransaction(
      async (transaction) => {
        const application = await transaction.get(applicationRef);
        const applicationData = application.data();

        const workspaceId = applicationData?.['data']['workspaceId'];
        const workspaceRef = firestore.doc(`graphs/${workspaceId}`);
        const workspace = await transaction.get(workspaceRef);
        const workspaceData = workspace.data();

        const nodes: { id: string; data: any }[] =
          workspaceData?.['nodes'] ?? [];
        const nodeIndex = nodes.findIndex(
          (node) => node.id === messageBody.data.payload.id
        );

        transaction.update(workspaceRef, {
          nodes: [
            ...nodes.slice(0, nodeIndex),
            {
              ...nodes[nodeIndex],
              data: {
                ...nodes[nodeIndex].data,
                ...messageBody.data.payload.changes,
              },
            },
            ...nodes.slice(nodeIndex + 1),
          ],
          lastEventId: messageBody.id,
          updatedAt: context.timestamp,
        });

        transaction.update(applicationRef, {
          data: {
            ...applicationData?.['data'],
            ...messageBody.data.payload.changes,
          },
          lastEventId: messageBody.id,
          updatedAt: context.timestamp,
        });

        return { workspaceId };
      }
    );

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: {
            id: messageBody.data.payload.id,
            changes: messageBody.data.payload.changes,
            workspaceId,
          },
          type: 'updateApplicationSuccess',
          graphIds: [messageBody.data.payload.id, workspaceId],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'updateApplicationSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateApplicationSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateApplicationSuccess'
    ) {
      functions.logger.warn('updateApplicationSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(
      `graphs/${messageBody.data.payload.workspaceId}`
    );
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });
    await applicationRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const updateApplicationThumbnail = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateApplicationThumbnail'
    ) {
      functions.logger.warn('updateApplicationThumbnail', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );
    const uploadRef = firestore.doc(
      `uploads/${messageBody.data.payload.fileId}`
    );

    const { workspaceId } = await firestore.runTransaction(
      async (transaction) => {
        const application = await transaction.get(applicationRef);
        const applicationData = application.data();
        const workspaceId = applicationData?.['data']['workspaceId'];
        const workspaceRef = firestore.doc(`graphs/${workspaceId}`);
        const workspace = await transaction.get(workspaceRef);
        const workspaceData = workspace.data();
        const nodes: { id: string; data: any }[] =
          workspaceData?.['nodes'] ?? [];
        const nodeIndex = nodes.findIndex(
          (node) => node.id === messageBody.data.payload.id
        );

        transaction.set(uploadRef, {
          kind: 'application',
          ref: messageBody.data.payload.id,
          createdAt: context.timestamp,
        });
        transaction.update(workspaceRef, {
          nodes: [
            ...nodes.slice(0, nodeIndex),
            {
              ...nodes[nodeIndex],
              data: {
                ...nodes[nodeIndex].data,
                thumbnailUrl: messageBody.data.payload.fileUrl,
              },
            },
            ...nodes.slice(nodeIndex + 1),
          ],
          lastEventId: context.eventId,
          updatedAt: context.timestamp,
        });
        transaction.update(applicationRef, {
          data: {
            ...applicationData?.['data'],
            thumbnailUrl: messageBody.data.payload.fileUrl,
          },
          lastEventId: context.eventId,
          updatedAt: context.timestamp,
        });

        return { workspaceId };
      }
    );

    pubsub.topic('events').publishJSON(
      {
        id: messageBody.id,
        data: {
          payload: {
            fileId: messageBody.data.payload.fileId,
            fileUrl: messageBody.data.payload.fileUrl,
            id: messageBody.data.payload.id,
            workspaceId,
          },
          type: 'updateApplicationThumbnailSuccess',
          graphIds: [messageBody.data.payload.id, workspaceId],
          clientId: messageBody.data.clientId,
          correlationId: context.eventId,
        },
      },
      { type: 'updateApplicationThumbnailSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const updateApplicationThumbnailSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'updateApplicationThumbnailSuccess'
    ) {
      functions.logger.warn(
        'updateApplicationThumbnailSuccess',
        'Event ignored'
      );
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(
      `graphs/${messageBody.data.payload.workspaceId}`
    );
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });
    await applicationRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });

export const deleteApplication = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteApplication'
    ) {
      functions.logger.warn('deleteApplication', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;
    const applicationRef = firestore.doc(
      `graphs/${messageBody.data.payload.id}`
    );

    const { workspaceId } = await firestore.runTransaction(
      async (transaction) => {
        const application = await transaction.get(applicationRef);
        const applicationData = application.data();
        const workspaceId = applicationData?.['data']['workspaceId'];
        const workspaceRef = firestore.doc(`graphs/${workspaceId}`);
        const workspace = await transaction.get(workspaceRef);
        const workspaceData = workspace.data();
        const nodes: { id: string }[] = workspaceData?.['nodes'] ?? [];

        transaction.update(workspaceRef, {
          nodes: nodes.filter((node) => {
            return node.id !== messageBody.data.payload.id;
          }),
          lastEventId: messageBody.id,
          updatedAt: context.timestamp,
        });

        transaction.delete(applicationRef);

        return { workspaceId };
      }
    );

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: { id: messageBody.data.payload.id, workspaceId },
          type: 'deleteApplicationSuccess',
          graphIds: [messageBody.data.payload.id, workspaceId],
          clientId: messageBody.data.clientId,
          correlationId: messageBody.id,
        },
      },
      { type: 'deleteApplicationSuccess' },
      (error) => {
        functions.logger.error(error);
      }
    );

    return true;
  });

export const deleteApplicationSuccess = functions.pubsub
  .topic('events')
  .onPublish(async (message, context) => {
    if (
      process.env.FUNCTIONS_EMULATOR &&
      message.attributes.type !== 'deleteApplicationSuccess'
    ) {
      functions.logger.warn('deleteApplicationSuccess', 'Event ignored');
      return false;
    }

    const messageBody = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : null;

    const workspaceRef = firestore.doc(
      `graphs/${messageBody.data.payload.workspaceId}`
    );

    await workspaceRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

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
      graphId,
      isGraph,
      ...payload
    } = messageBody.data.payload;

    const graphRef = firestore.doc(`graphs/${graphId}`);

    await firestore.runTransaction(async (transaction) => {
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();
      const nodes = graphData?.['nodes'] ?? [];

      transaction.update(graphRef, {
        nodes: [
          ...nodes,
          {
            id: nodeId,
            data: payload,
            createdAt: context.timestamp,
          },
        ],
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });

      if (isGraph) {
        const nodeGraphRef = firestore.doc(`graphs/${nodeId}`);

        transaction.set(nodeGraphRef, {
          data: payload,
          nodes: [],
          edges: [],
          lastEventId: messageBody.id,
          createdAt: context.timestamp,
        });
      }
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'createNodeSuccess',
          graphIds: [nodeId, graphId],
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

    const graphRef = firestore.doc(
      `graphs/${messageBody.data.payload.graphId}`
    );

    await graphRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    if (messageBody.data.payload.isGraph) {
      const nodeGraphRef = firestore.doc(
        `graphs/${messageBody.data.payload.id}`
      );
      await nodeGraphRef.update({
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    }

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

    const {
      id: nodeId,
      graphId,
      isGraph,
      ...payload
    } = messageBody.data.payload;

    const graphRef = firestore.doc(`graphs/${graphId}`);

    await firestore.runTransaction(async (transaction) => {
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();
      const nodes: { id: string; data: any }[] = graphData?.['nodes'] ?? [];
      const nodeIndex = nodes.findIndex((node) => node.id === nodeId);
      const nodeGraphRef = firestore.doc(`graphs/${nodeId}`);
      const nodeGraph = isGraph ? await transaction.get(nodeGraphRef) : null;

      transaction.update(graphRef, {
        nodes: [
          ...nodes.slice(0, nodeIndex),
          {
            ...nodes[nodeIndex],
            data: {
              ...nodes[nodeIndex].data,
              ...payload.changes,
            },
          },
          ...nodes.slice(nodeIndex + 1),
        ],
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });

      if (nodeGraph) {
        transaction.update(nodeGraphRef, {
          data: {
            ...nodeGraph?.['data'],
            ...messageBody.data.payload.changes,
          },
          lastEventId: messageBody.id,
          updatedAt: context.timestamp,
        });
      }
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'updateNodeSuccess',
          graphIds: [
            messageBody.data.payload.id,
            messageBody.data.payload.graphId,
          ],
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

    const {
      id: nodeId,
      graphId,
      isGraph,
      ...payload
    } = messageBody.data.payload;

    const graphRef = firestore.doc(`graphs/${graphId}`);
    const uploadRef = firestore.doc(`uploads/${payload.fileId}`);

    await firestore.runTransaction(async (transaction) => {
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();
      const nodes: { id: string; data: any }[] = graphData?.['nodes'] ?? [];
      const nodeIndex = nodes.findIndex((node) => node.id === nodeId);
      const node = nodes[nodeIndex];
      const nodeGraphRef = firestore.doc(`graphs/${nodeId}`);
      const nodeGraph = isGraph ? await transaction.get(nodeGraphRef) : null;

      // Save the upload for tracking purposes
      transaction.set(uploadRef, {
        kind: node.data.kind,
        ref: nodeId,
        createdAt: context.timestamp,
      });

      // Update parent graph
      transaction.update(graphRef, {
        nodes: [
          ...nodes.slice(0, nodeIndex),
          {
            ...node,
            data: {
              ...node.data,
              thumbnailUrl: payload.fileUrl,
            },
          },
          ...nodes.slice(nodeIndex + 1),
        ],
        lastEventId: context.eventId,
        updatedAt: context.timestamp,
      });

      if (nodeGraph) {
        transaction.update(nodeGraphRef, {
          data: {
            ...nodeGraph['data'],
            thumbnailUrl: payload.fileUrl,
          },
          lastEventId: context.eventId,
          updatedAt: context.timestamp,
        });
      }
    });

    pubsub.topic('events').publishJSON(
      {
        id: messageBody.id,
        data: {
          payload: {
            id: nodeId,
            graphId,
            isGraph,
            changes: {
              thumbnailUrl: payload.fileUrl,
            },
          },
          type: 'updateNodeThumbnailSuccess',
          graphIds: [messageBody.data.payload.id, graphId],
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

    const graphRef = firestore.doc(
      `graphs/${messageBody.data.payload.graphId}`
    );

    await graphRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    if (messageBody.data.payload.isGraph) {
      const nodeGraphRef = firestore.doc(
        `graphs/${messageBody.data.payload.id}`
      );
      await nodeGraphRef.update({
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });
    }

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

    await firestore.runTransaction(async (transaction) => {
      const graphRef = firestore.doc(
        `graphs/${messageBody.data.payload.graphId}`
      );
      const graph = await transaction.get(graphRef);
      const graphData = graph.data();
      const nodes: { id: string }[] = graphData?.['nodes'] ?? [];

      transaction.update(graphRef, {
        nodes: nodes.filter((node) => node.id !== messageBody.data.payload.id),
        lastEventId: messageBody.id,
        updatedAt: context.timestamp,
      });

      if (messageBody.data.payload.isGraph) {
        const nodeGraphRef = firestore.doc(
          `graphs/${messageBody.data.payload.id}`
        );
        transaction.delete(nodeGraphRef);
      }
    });

    pubsub.topic('events').publishJSON(
      {
        id: context.eventId,
        data: {
          payload: messageBody.data.payload,
          type: 'deleteNodeSuccess',
          graphIds: [
            messageBody.data.payload.id,
            messageBody.data.payload.graphId,
          ],
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

    const graphRef = firestore.doc(
      `graphs/${messageBody.data.payload.graphId}`
    );

    await graphRef.update({
      lastEventId: messageBody.id,
      updatedAt: context.timestamp,
    });

    return true;
  });
