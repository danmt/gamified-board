import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { switchMap } from 'rxjs';
import { Option } from '../../shared';
import { SysvarApiService } from '../services';
import { SysvarDto } from '../utils';

interface ViewModel {
  sysvars: Option<SysvarDto[]>;
}

const initialState: ViewModel = {
  sysvars: null,
};

@Injectable()
export class SysvarsStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _sysvarApiService = inject(SysvarApiService);

  readonly sysvars$ = this.select(({ sysvars }) => sysvars);

  private readonly _loadSysvars$ = this.effect<void>(
    switchMap(() =>
      this._sysvarApiService.getAllSysvars().pipe(
        tapResponse(
          (sysvars) => this.patchState({ sysvars }),
          (error) => this._handleError(error)
        )
      )
    )
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadSysvars$();
  }

  private _handleError(error: unknown) {
    console.error(error);
  }
}
