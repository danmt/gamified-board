import { inject, Injectable } from '@angular/core';
import {
  ComponentStore,
  OnStoreInit,
  tapResponse,
} from '@ngrx/component-store';
import { combineLatest, EMPTY, map, switchMap } from 'rxjs';
import {
  ApplicationApiService,
  ApplicationDto,
  CollectionApiService,
  CollectionDto,
  InstructionApiService,
  InstructionDto,
  WorkspaceApiService,
  WorkspaceDto,
} from '../services';
import { BoardDocument, BoardInstruction, BoardTask, Option } from '../utils';

interface ViewModel {
  workspaceId: Option<string>;
  currentApplicationId: Option<string>;
  workspace: Option<WorkspaceDto & { applicationIds: string[] }>;
  applications: Option<
    (ApplicationDto & { collectionIds: string[]; instructionIds: string[] })[]
  >;
  currentApplicationInstructions: Option<BoardInstruction[]>;
  workspaceInstructions: Option<InstructionDto[]>;
  workspaceCollections: Option<CollectionDto[]>;
}

const initialState: ViewModel = {
  workspaceId: null,
  workspace: null,
  currentApplicationId: null,
  applications: null,
  currentApplicationInstructions: null,
  workspaceInstructions: null,
  workspaceCollections: null,
};

@Injectable()
export class BoardStore
  extends ComponentStore<ViewModel>
  implements OnStoreInit
{
  private readonly _workspaceApiService = inject(WorkspaceApiService);
  private readonly _applicationApiService = inject(ApplicationApiService);
  private readonly _instructionApiService = inject(InstructionApiService);
  private readonly _collectionApiService = inject(CollectionApiService);

  readonly workspaceId$ = this.select(({ workspaceId }) => workspaceId);
  readonly workspace$ = this.select(({ workspace }) => workspace);
  readonly workspaceApplicationIds$ = this.select(
    this.workspace$,
    (workspace) => workspace?.applicationIds ?? null
  );
  readonly currentApplicationId$ = this.select(
    ({ currentApplicationId }) => currentApplicationId
  );
  readonly applications$ = this.select(({ applications }) => applications);
  readonly currentApplication$ = this.select(
    this.applications$,
    this.currentApplicationId$,
    (applications, applicationId) =>
      applications?.find(({ id }) => id === applicationId) ?? null
  );
  readonly currentApplicationInstructionIds$ = this.select(
    this.currentApplication$,
    (application) => application?.instructionIds ?? null
  );
  readonly currentApplicationCollectionIds$ = this.select(
    this.currentApplication$,
    (application) => application?.collectionIds ?? null
  );
  readonly currentApplicationInstructions$ = this.select(
    ({ currentApplicationInstructions }) => currentApplicationInstructions
  );
  readonly workspaceInstructionIds$ = this.select(
    this.workspace$,
    this.applications$,
    (workspace, applications) => {
      if (workspace === null) {
        return [];
      }

      return workspace.applicationIds.reduce<string[]>(
        (instructionIds, applicationId) => {
          const application =
            applications?.find(({ id }) => id === applicationId) ?? null;

          if (application === null) {
            return instructionIds;
          }

          return [
            ...new Set([...instructionIds, ...application.instructionIds]),
          ];
        },
        []
      );
    }
  );
  readonly workspaceCollectionIds$ = this.select(
    this.workspace$,
    this.applications$,
    (workspace, applications) => {
      if (workspace === null) {
        return [];
      }

      return workspace.applicationIds.reduce<string[]>(
        (collectionIds, applicationId) => {
          const application =
            applications?.find(({ id }) => id === applicationId) ?? null;

          if (application === null) {
            return collectionIds;
          }

          return [...new Set([...collectionIds, ...application.collectionIds])];
        },
        []
      );
    }
  );
  readonly workspaceInstructions$ = this.select(
    ({ workspaceInstructions }) => workspaceInstructions
  );
  readonly workspaceCollections$ = this.select(
    ({ workspaceCollections }) => workspaceCollections
  );
  readonly workspaceApplications$ = this.select(
    this.applications$,
    this.workspaceInstructions$,
    this.workspaceCollections$,
    (applications, instructions, collections) =>
      applications?.map((application) => ({
        id: application.id,
        name: application.name,
        instructions:
          instructions?.filter(({ applicationId }) => applicationId) ?? [],
        collections:
          collections?.filter(({ applicationId }) => applicationId) ?? [],
      })) ?? []
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

  private readonly _loadWorkspace$ = this.effect<Option<string>>(
    switchMap((workspaceId) => {
      if (workspaceId === null) {
        return EMPTY;
      }

      return combineLatest([
        this._workspaceApiService.getWorkspace(workspaceId),
        this._workspaceApiService.getWorkspaceApplicationIds(workspaceId),
      ]).pipe(
        tapResponse(
          ([workspace, applicationIds]) =>
            this.patchState({
              workspace: {
                id: workspaceId,
                name: workspace['name'],
                applicationIds,
              },
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadApplications$ = this.effect<Option<string[]>>(
    switchMap((applicationIds) => {
      if (applicationIds === null) {
        return EMPTY;
      }

      return combineLatest(
        applicationIds.map((applicationId) =>
          combineLatest([
            this._applicationApiService.getApplication(applicationId),
            this._applicationApiService.getApplicationInstructionIds(
              applicationId
            ),
            this._applicationApiService.getApplicationCollectionIds(
              applicationId
            ),
          ]).pipe(
            map(([application, instructionIds, collectionIds]) => ({
              id: applicationId,
              name: application['name'] as string,
              instructionIds,
              collectionIds,
            }))
          )
        )
      ).pipe(
        tapResponse(
          (applications) =>
            this.patchState({
              applications,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadCurrentApplicationInstructions$ = this.effect<
    Option<string[]>
  >(
    switchMap((instructionIds) => {
      if (instructionIds === null) {
        return EMPTY;
      }

      return combineLatest(
        instructionIds.map((instructionId) =>
          combineLatest([
            this._instructionApiService.getInstruction(instructionId),
            this._instructionApiService.getInstructionDocuments(instructionId),
            this._instructionApiService.getInstructionTasks(instructionId),
          ]).pipe(
            map(([instruction, documents, tasks]) => ({
              id: instructionId,
              name: instruction['name'] as string,
              documents: instruction['documentsOrder'].reduce(
                (orderedDocuments: BoardDocument[], documentId: string) => {
                  const documentFound =
                    documents.find((document) => document.id === documentId) ??
                    null;

                  if (documentFound === null) {
                    return orderedDocuments;
                  }

                  return [...orderedDocuments, documentFound];
                },
                []
              ),
              tasks: instruction['tasksOrder'].reduce(
                (orderedTasks: BoardTask[], taskId: string) => {
                  const taskFound =
                    tasks.find((task) => task.id === taskId) ?? null;

                  if (taskFound === null) {
                    return orderedTasks;
                  }

                  return [...orderedTasks, taskFound];
                },
                []
              ),
            }))
          )
        )
      ).pipe(
        tapResponse(
          (currentApplicationInstructions) =>
            this.patchState({
              currentApplicationInstructions,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadWorkspaceInstructions$ = this.effect<Option<string[]>>(
    switchMap((instructionIds) => {
      if (instructionIds === null) {
        return EMPTY;
      }

      return this._instructionApiService.getInstructions(instructionIds).pipe(
        tapResponse(
          (workspaceInstructions) =>
            this.patchState({
              workspaceInstructions,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  private readonly _loadWorkspaceCollections$ = this.effect<Option<string[]>>(
    switchMap((collectionIds) => {
      if (collectionIds === null) {
        return EMPTY;
      }

      return this._collectionApiService.getCollections(collectionIds).pipe(
        tapResponse(
          (workspaceCollections) =>
            this.patchState({
              workspaceCollections,
            }),
          (error) => this._handleError(error)
        )
      );
    })
  );

  constructor() {
    super(initialState);
  }

  ngrxOnStoreInit() {
    this._loadWorkspace$(this.workspaceId$);
    this._loadApplications$(this.workspaceApplicationIds$);
    this._loadCurrentApplicationInstructions$(
      this.currentApplicationInstructionIds$
    );
    this._loadWorkspaceCollections$(this.workspaceCollectionIds$);
    this._loadWorkspaceInstructions$(this.workspaceInstructionIds$);
  }

  private _handleError(error: unknown) {
    console.log(error);
  }
}
