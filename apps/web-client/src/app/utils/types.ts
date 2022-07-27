export type Option<T> = T | null;

export type ActiveItemKind = 'collection' | 'instruction';

export interface ActiveItem {
  kind: ActiveItemKind;
  data: Instruction | Collection;
}

export type BoardItemKind = 'document' | 'task';

export interface BoardTask {
  id: string;
  thumbnailUrl: string;
}

export interface BoardDocument {
  id: string;
  thumbnailUrl: string;
}

export type SelectedBoardItem = (BoardTask | BoardDocument) & {
  instructionId: string;
  kind: BoardItemKind;
};

export interface BoardInstruction {
  id: string;
  tasks: BoardTask[];
  documents: BoardDocument[];
}

export interface Instruction {
  id: string;
  thumbnailUrl: string;
}

export interface Collection {
  id: string;
  thumbnailUrl: string;
}
