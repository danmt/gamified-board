import { inject, Injectable } from '@angular/core';
import { ComponentStore, OnStoreInit } from '@ngrx/component-store';
import { concatMap, of, tap, withLatestFrom } from 'rxjs';
import { ApplicationsStore } from '../../application/stores';
import { CollectionsStore } from '../../collection/stores';
import { InstructionsStore } from '../../instruction/stores';
import { isNotNull, isNull, Option } from '../../shared/utils';
import { SysvarsStore } from '../../sysvar/stores';
import { WorkspaceStore } from '../../workspace/stores';
import {
  populateApplication,
  populateCollection,
  populateInstruction,
  populateSysvar,
} from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
  isCollectionsSectionOpen: boolean;
  isInstructionsSectionOpen: boolean;
  isApplicationsSectionOpen: boolean;
  isSysvarsSectionOpen: boolean;
  active: Option<{
    id: string;
    kind:
      | 'collection'
      | 'instruction'
      | 'application'
      | 'sysvar'
      | 'signer'
      | 'instructionDocument'
      | 'instructionTask'
      | 'instructionSigner'
      | 'instructionSysvar'
      | 'instructionApplication';
  }>;
  selected: Option<{
    id: string;
    kind:
      | 'collection'
      | 'instruction'
      | 'application'
      | 'sysvar'
      | 'signer'
      | 'instructionDocument'
      | 'instructionTask'
      | 'instructionSigner'
      | 'instructionSysvar'
      | 'instructionApplication';
  }>;
  slots: Option<
    Option<{
      id: string;
      kind: 'collection' | 'instruction' | 'application' | 'sysvar';
    }>[]
  >;
}

const initialState: ViewModel = {
  workspaceId: null,
  currentApplicationId: null,
  isCollectionsSectionOpen: false,
  isInstructionsSectionOpen: false,
  isApplicationsSectionOpen: false,
  isSysvarsSectionOpen: false,
  active: null,
  selected: null,
  slots: null,
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceStore = inject(WorkspaceStore);
  private readonly _applicationsStore = inject(ApplicationsStore);
  private readonly _collectionsStore = inject(CollectionsStore);
  private readonly _instructionsStore = inject(InstructionsStore);
  private readonly _sysvarsStore = inject(SysvarsStore);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );
  readonly active$ = this.select(({ active }) => active);
  readonly selected$ = this.select(({ selected }) => selected);
  readonly isCollectionsSectionOpen$ = this.select(
    ({ isCollectionsSectionOpen }) => isCollectionsSectionOpen
  );
  readonly isInstructionsSectionOpen$ = this.select(
    ({ isInstructionsSectionOpen }) => isInstructionsSectionOpen
  );
  readonly isApplicationsSectionOpen$ = this.select(
    ({ isApplicationsSectionOpen }) => isApplicationsSectionOpen
  );
  readonly isSysvarsSectionOpen$ = this.select(
    ({ isSysvarsSectionOpen }) => isSysvarsSectionOpen
  );
  readonly collections$ = this.select(
    this._applicationsStore.applications$,
    this._collectionsStore.collections$,
    (applications, collections) => {
      if (isNull(collections) || isNull(applications)) {
        return null;
      }

      return collections.map((collection) =>
        populateCollection(collection, applications)
      );
    }
  );
  readonly sysvars$ = this.select(this._sysvarsStore.sysvars$, (sysvars) => {
    if (isNull(sysvars)) {
      return null;
    }

    return sysvars.map((sysvar) => populateSysvar(sysvar));
  });
  readonly instructions$ = this.select(
    this._applicationsStore.applications$,
    this._instructionsStore.instructions$,
    this._collectionsStore.collections$,
    this._sysvarsStore.sysvars$,
    (applications, instructions, collections, sysvars) => {
      if (
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars)
      ) {
        return null;
      }

      return instructions.map((instruction) =>
        populateInstruction(
          instruction,
          applications,
          collections,
          instructions,
          sysvars
        )
      );
    }
  );
  readonly applications$ = this.select(
    this._applicationsStore.applications$,
    this._instructionsStore.instructions$,
    this._collectionsStore.collections$,
    this._sysvarsStore.sysvars$,
    (applications, instructions, collections, sysvars) => {
      if (
        isNull(applications) ||
        isNull(instructions) ||
        isNull(collections) ||
        isNull(sysvars)
      ) {
        return null;
      }

      return applications.map((application) =>
        populateApplication(
          application,
          applications,
          instructions,
          collections,
          sysvars
        )
      );
    }
  );
  readonly currentApplication$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    (applications, currentApplicationId) => {
      if (isNull(applications)) {
        return null;
      }

      return applications.find(({ id }) => id === currentApplicationId) ?? null;
    }
  );
  readonly currentApplicationInstructions$ = this.select(
    this.instructions$,
    this.currentApplicationId$,
    (instructions, currentApplicationId) => {
      if (isNull(instructions) || isNull(currentApplicationId)) {
        return [];
      }

      return instructions.filter(
        (instruction) => instruction.application.id === currentApplicationId
      );
    }
  );
  readonly slots$ = this.select(
    this.applications$,
    this.instructions$,
    this.collections$,
    this.sysvars$,
    this.select(({ slots }) => slots),
    (applications, instructions, collections, sysvars, slots) => {
      if (
        isNull(instructions) ||
        isNull(collections) ||
        isNull(applications) ||
        isNull(sysvars) ||
        isNull(slots)
      ) {
        return [];
      }

      return slots.map((slot) => {
        if (isNull(slot)) {
          return null;
        }

        switch (slot.kind) {
          case 'collection': {
            return (
              collections.find((collection) => collection.id === slot.id) ??
              null
            );
          }

          case 'instruction': {
            return (
              instructions.find((instruction) => instruction.id === slot.id) ??
              null
            );
          }

          case 'application': {
            return (
              applications.find((application) => application.id === slot.id) ??
              null
            );
          }

          case 'sysvar': {
            return sysvars.find((sysvar) => sysvar.id === slot.id) ?? null;
          }
        }
      });
    }
  );

  readonly setWorkspaceId = this.updater<Option<string>>(
    (state, workspaceId) => ({
      ...state,
      workspaceId,
    })
  );

  readonly setCurrentApplicationId = this.updater<Option<string>>(
    (state, currentApplicationId) => ({
      ...state,
      currentApplicationId,
    })
  );

  readonly setActive = this.updater<
    Option<{
      id: string;
      kind:
        | 'collection'
        | 'instruction'
        | 'application'
        | 'sysvar'
        | 'signer'
        | 'instructionDocument'
        | 'instructionTask'
        | 'instructionSigner'
        | 'instructionSysvar'
        | 'instructionApplication';
    }>
  >((state, active) => ({
    ...state,
    active,
  }));

  readonly setSelected = this.updater<
    Option<{
      id: string;
      kind:
        | 'collection'
        | 'instruction'
        | 'application'
        | 'sysvar'
        | 'signer'
        | 'instructionDocument'
        | 'instructionTask'
        | 'instructionSigner'
        | 'instructionSysvar'
        | 'instructionApplication';
    }>
  >((state, selected) => ({
    ...state,
    selected,
  }));

  readonly toggleIsCollectionsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isCollectionsSectionOpen: !state.isCollectionsSectionOpen,
    isSysvarsSectionOpen: false,
  }));

  readonly toggleIsInstructionsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isInstructionsSectionOpen: !state.isInstructionsSectionOpen,
    isApplicationsSectionOpen: false,
  }));

  readonly toggleIsApplicationsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isApplicationsSectionOpen: !state.isApplicationsSectionOpen,
    isInstructionsSectionOpen: false,
  }));

  readonly toggleIsSysvarsSectionOpen = this.updater<void>((state) => ({
    ...state,
    isSysvarsSectionOpen: !state.isSysvarsSectionOpen,
    isCollectionsSectionOpen: false,
  }));

  readonly closeActiveOrSelected = this.updater<void>((state) => {
    if (isNotNull(state.active)) {
      return {
        ...state,
        active: null,
      };
    } else if (isNotNull(state.selected)) {
      return {
        ...state,
        selected: null,
      };
    } else if (
      state.isCollectionsSectionOpen ||
      state.isInstructionsSectionOpen ||
      state.isApplicationsSectionOpen ||
      state.isSysvarsSectionOpen
    ) {
      return {
        ...state,
        isCollectionsSectionOpen: false,
        isInstructionsSectionOpen: false,
        isApplicationsSectionOpen: false,
        isSysvarsSectionOpen: false,
      };
    } else {
      return state;
    }
  });

  loadSlots = this.effect<{
    workspaceId: Option<string>;
    applicationId: Option<string>;
  }>(
    tap(({ workspaceId, applicationId }) => {
      const slotsMap = localStorage.getItem('slotsMap');

      if (isNull(slotsMap) || isNull(workspaceId) || isNull(applicationId)) {
        this.patchState({
          slots: [null, null, null, null, null, null, null, null, null, null],
        });
      } else {
        const slots = JSON.parse(slotsMap)[`${workspaceId}/${applicationId}`];

        this.patchState({
          slots,
        });
      }
    })
  );

  setSlot = this.effect<{
    index: number;
    data: Option<{
      id: string;
      kind: 'instruction' | 'collection' | 'application' | 'sysvar';
    }>;
  }>(
    concatMap(({ index, data }) =>
      of(null).pipe(
        withLatestFrom(
          this.select(({ slots }) => slots),
          this.select(({ workspaceId }) => workspaceId),
          this.select(({ currentApplicationId }) => currentApplicationId)
        ),
        tap(([, slots, workspaceId, applicationId]) => {
          if (
            isNotNull(slots) &&
            isNotNull(workspaceId) &&
            isNotNull(applicationId)
          ) {
            const updatedSlots = slots.map((slot, i) =>
              i === index ? data : slot
            );

            this.patchState({
              slots: updatedSlots,
            });

            const slotsMap = localStorage.getItem('slotsMap');

            if (isNull(slotsMap)) {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            } else {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  ...JSON.parse(slotsMap),
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            }
          }
        })
      )
    )
  );

  swapSlots = this.effect<{
    previousIndex: number;
    newIndex: number;
  }>(
    concatMap(({ previousIndex, newIndex }) =>
      of(null).pipe(
        withLatestFrom(
          this.select(({ slots }) => slots),
          this.select(({ workspaceId }) => workspaceId),
          this.select(({ currentApplicationId }) => currentApplicationId)
        ),
        tap(([, slots, workspaceId, applicationId]) => {
          if (
            isNotNull(slots) &&
            isNotNull(workspaceId) &&
            isNotNull(applicationId)
          ) {
            const updatedSlots = [...slots];
            const temp = slots[newIndex];
            updatedSlots[newIndex] = updatedSlots[previousIndex];
            updatedSlots[previousIndex] = temp;

            this.patchState({
              slots: updatedSlots,
            });

            const slotsMap = localStorage.getItem('slotsMap');

            if (isNull(slotsMap)) {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            } else {
              localStorage.setItem(
                'slotsMap',
                JSON.stringify({
                  ...JSON.parse(slotsMap),
                  [`${workspaceId}/${applicationId}`]: updatedSlots,
                })
              );
            }
          }
        })
      )
    )
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._workspaceStore.setWorkspaceId(this.workspaceId$);
    this._applicationsStore.setWorkspaceId(this.workspaceId$);
    this._collectionsStore.setWorkspaceId(this.workspaceId$);
    this._instructionsStore.setWorkspaceId(this.workspaceId$);
    this.loadSlots(
      this.select(
        this.workspaceId$,
        this.currentApplicationId$,
        (workspaceId, applicationId) => ({ workspaceId, applicationId })
      )
    );
  }
}
