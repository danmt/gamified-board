export type Option<T> = T | null;

export type ActiveItemKind = 'collection' | 'instruction';

export interface ActiveItem {
  kind: ActiveItemKind;
  data: Instruction | Collection;
}

export type BoardItemKind = 'document' | 'task';

export interface BoardTask {
  id: string;
  name: string;
  instruction: {
    id: string;
    name: string;
    workspaceId: string;
    applicationId: string;
    thumbnailUrl: string;
  };
}

export interface BoardDocument {
  id: string;
  name: string;
  collection: {
    id: string;
    name: string;
    workspaceId: string;
    applicationId: string;
    thumbnailUrl: string;
  };
}

export type SelectedBoardItem =
  | (BoardTask & {
      instructionId: string;
      kind: 'task';
    })
  | (BoardDocument & {
      instructionId: string;
      kind: 'document';
    });

export interface BoardInstruction {
  id: string;
  name: string;
  tasks: BoardTask[];
  documents: BoardDocument[];
}

export interface Instruction {
  id: string;
  pluginName: string;
  thumbnailUrl: string;
}

export interface Collection {
  id: string;
  thumbnailUrl: string;
}

export type MainDockSlots = [
  Option<Instruction>,
  Option<Instruction>,
  Option<Instruction>,
  Option<Instruction>,
  Option<Instruction>,
  Option<Instruction>,
  Option<Collection>,
  Option<Collection>,
  Option<Collection>,
  Option<Collection>,
  Option<Collection>,
  Option<Collection>
];
