import {
  DrawerEvent,
  isOneTapNodeEvent,
  Node,
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

export const applicationNodeLabelFunction = (
  node: Node<ApplicationNodeKinds, ApplicationNodeData, ApplicationNodesData>
) => {
  switch (node.kind) {
    case 'collection':
    case 'instruction': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">${node.kind}</p>
          </div>
        </div>
      `;
    }

    case 'field': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">${
              'type' in node.data && node.data.type
            }</p>
          </div>
        </div>
      `;
    }
  }
};
