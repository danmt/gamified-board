import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Option } from '../../shared';

type RawBrickKind = 'instruction' | 'collection' | 'application' | 'sysvar';

interface RawBrick {
  id: string;
  kind: RawBrickKind;
}

type RefinedBrickKind =
  | 'instructionArgument'
  | 'instructionDocument'
  | 'instructionApplication'
  | 'instructionTask'
  | 'instructionSigner'
  | 'instructionSysvar';

interface RefinedBrick {
  id: string;
  kind: RefinedBrickKind;
  instructionId: string;
}

export type Brick = RawBrick | RefinedBrick;

interface ViewModel {
  active: Option<Brick>;
}

const initialState: ViewModel = {
  active: null,
};

@Injectable()
export class ActiveStore extends ComponentStore<ViewModel> {
  readonly active$ = this.select(({ active }) => active);

  readonly setActive = this.updater<Option<Brick>>((state, active) => ({
    ...state,
    active,
  }));

  constructor() {
    super(initialState);
  }
}
