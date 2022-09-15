import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Option } from '../../shared/utils';
import { Brick } from '../utils';

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
