import { AnchorProvider, Spl } from '@heavy-duty/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { isNull, toInstructionArguments } from '../../../shared/utils';
import { IdlInstruction, PluginInterface } from '../../types';

export class AssociatedTokenPlugin implements PluginInterface {
  private readonly program = Spl.associatedToken({} as AnchorProvider);
  readonly namespace = 'solana';
  readonly id = this.program.programId.toBase58();
  readonly name = this.program.idl.name;
  readonly instructions = this.program.idl.instructions;
  readonly accounts = [];
  readonly isAnchor = false;

  getInstruction(instructionName: string): IdlInstruction | null {
    return (
      this.instructions.find(
        (instruction) => instruction.name === instructionName
      ) ?? null
    );
  }

  getTransactionInstruction(
    instructionName: string,
    args: { [argName: string]: string },
    accounts: { [accountName: string]: string }
  ): TransactionInstruction | null {
    const instruction = this.getInstruction(instructionName);

    if (isNull(instruction)) {
      return null;
    }

    return new TransactionInstruction({
      programId: new PublicKey(this.program.programId),
      keys: instruction.accounts.map((account) => ({
        pubkey: new PublicKey(accounts[account.name]),
        isSigner: account.isSigner,
        isWritable: account.isMut,
      })),
      data: this.program.coder.instruction.encode(
        instructionName,
        toInstructionArguments(instruction, args)
      ),
    });
  }
}
