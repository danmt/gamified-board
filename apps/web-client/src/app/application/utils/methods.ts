import {
  DrawerEvent,
  isOneTapNodeEvent,
  OneTapNodeEvent,
  UpdateNodeSuccessEvent,
} from '../../drawer/utils';
import {
  ApplicationGraphData,
  ApplicationGraphKind,
  ApplicationNodeData,
  ApplicationNodeKinds,
  ApplicationNodesData,
  CollectionNodeData,
  FieldNodeData,
  InstructionNodeData,
} from './types';

export const isOneTapCollectionNodeEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is OneTapNodeEvent<
  'collection',
  CollectionNodeData,
  ApplicationNodesData
> => {
  return isOneTapNodeEvent(event) && event.payload.kind === 'collection';
};

export const isOneTapInstructionNodeEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is OneTapNodeEvent<
  'instruction',
  InstructionNodeData,
  ApplicationNodesData
> => {
  return isOneTapNodeEvent(event) && event.payload.kind === 'instruction';
};

export const isOneTapFieldNodeEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is OneTapNodeEvent<'field', FieldNodeData, ApplicationNodesData> => {
  return isOneTapNodeEvent(event) && event.payload.kind === 'field';
};

export const isUpdateFieldNodeSuccessEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is UpdateNodeSuccessEvent<'field', FieldNodeData> => {
  return event.type === 'UpdateNodeSuccess' && event.payload.kind === 'field';
};

export const isUpdateCollectionNodeSuccessEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is UpdateNodeSuccessEvent<'collection', CollectionNodeData> => {
  return (
    event.type === 'UpdateNodeSuccess' && event.payload.kind === 'collection'
  );
};

export const isUpdateInstructionNodeSuccessEvent = (
  event: DrawerEvent<
    ApplicationNodeKinds,
    ApplicationNodeData,
    ApplicationNodesData,
    ApplicationGraphKind,
    ApplicationGraphData
  >
): event is UpdateNodeSuccessEvent<'instruction', InstructionNodeData> => {
  return (
    event.type === 'UpdateNodeSuccess' && event.payload.kind === 'instruction'
  );
};
