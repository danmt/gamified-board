import { TransactionInstruction } from '@solana/web3.js';

export interface IdlStructField {
  name: string;
  type: IdlType;
}

export type IdlType =
  | string
  | { defined: string }
  | { option: string }
  | { coption: string }
  | { kind: 'struct'; fields: IdlStructField[] };

export interface IdlInstructionArgument {
  name: string;
  type: IdlType;
}

export interface IdlAccount {
  name: string;
  type: IdlType;
}

export interface IdlInstruction {
  name: string;
  accounts: {
    name: string;
    isMut: boolean;
    isSigner: boolean;
  }[];
  args: IdlInstructionArgument[];
}

export interface PluginInterface {
  namespace: string;
  name: string;
  instructions: IdlInstruction[];
  accounts: IdlAccount[];
  isAnchor: boolean;

  getInstruction(instructionName: string): IdlInstruction | null;
  getTransactionInstruction(
    instructionName: string,
    args: { [argName: string]: string },
    accounts: { [accountName: string]: string }
  ): TransactionInstruction | null;
}

export interface PluginsServiceInterface {
  plugins: PluginInterface[];
  registerAll(plugins: PluginInterface[]): void;
  getPlugin(namespace: string, program: string): PluginInterface | null;
}
