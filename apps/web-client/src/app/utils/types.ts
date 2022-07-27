export type ItemKind = 'collection' | 'instruction';

export interface Item {
  kind: ItemKind;
  data: string;
}

export interface BoardInstruction {
  id: number;
  tasks: string[];
  documents: string[];
}
