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
    isInternal: boolean;
    thumbnailUrl: string;
    workspaceId: Option<string>;
    applicationId: Option<string>;
    namespace: Option<string>;
    plugin: Option<string>;
    instruction: Option<string>;
  };
}

export interface BoardDocument {
  id: string;
  name: string;
  collection: {
    id: string;
    name: string;
    isInternal: boolean;
    thumbnailUrl: string;
    workspaceId: Option<string>;
    applicationId: Option<string>;
    namespace: Option<string>;
    plugin: Option<string>;
    account: Option<string>;
  };
}

export type SelectedBoardTask = BoardTask & {
  instructionId: string;
  kind: 'task';
};
export type SelectedBoardDocument = BoardDocument & {
  instructionId: string;
  kind: 'document';
};
export type SelectedBoardItem = SelectedBoardTask | SelectedBoardDocument;

export interface BoardInstruction {
  id: string;
  name: string;
  tasks: BoardTask[];
  documents: BoardDocument[];
}

export interface Instruction {
  id: string;
  name: string;
  isInternal: boolean;
  thumbnailUrl: string;
  workspaceId: Option<string>;
  applicationId: Option<string>;
  namespace: Option<string>;
  plugin: Option<string>;
  account: Option<string>;
}

export interface Collection {
  id: string;
  name: string;
  isInternal: boolean;
  thumbnailUrl: string;
  workspaceId: Option<string>;
  applicationId: Option<string>;
  namespace: Option<string>;
  plugin: Option<string>;
  account: Option<string>;
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
