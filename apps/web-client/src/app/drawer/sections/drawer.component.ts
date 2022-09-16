import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PushModule } from '@ngrx/component';
import { concatMap, EMPTY } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { BackgroundImageMoveDirective } from '../../shared/directives/background-position.directive';
import { BackgroundImageZoomDirective } from '../../shared/directives/background-zoom.directive';
import { EventApiService, GraphApiService } from '../services';
import { DrawerStore } from '../stores';
import { createGraph, Direction } from '../utils';

@Component({
  selector: 'pg-drawer',
  template: `
    <div style="display: flex; height: 100vh">
      <div id="sidebar">
        <label>
          Draw Mode:
          <input
            type="checkbox"
            name="draw-mode"
            [ngModel]="(drawMode$ | async) ?? false"
            (ngModelChange)="onDrawModeChange($event)"
          />
        </label>

        <fieldset>
          Direction:

          <input
            type="radio"
            id="vertical"
            name="direction"
            value="vertical"
            [ngModel]="direction$ | async"
            (ngModelChange)="onDirectionChange($event)"
          />
          <label for="vertical">Vertical</label><br />
          <input
            type="radio"
            id="horizontal"
            name="direction"
            value="horizontal"
            [ngModel]="direction$ | async"
            (ngModelChange)="onDirectionChange($event)"
          />
          <label for="horizontal">Horizontal</label><br />
        </fieldset>

        <button (click)="onOrganize()">Organize</button>
        <button (click)="onAddNode()">Add Node</button>

        <p>{{ clientId }}</p>
      </div>
      <div
        id="cy"
        class="bp-bg-bricks"
        #drawerElement
        pgBackgroundImageZoom
        [pgZoomValue]="(zoomSize$ | ngrxPush) ?? '15%'"
        pgBackgroundImageMove
        [pgPanValue]="(panDrag$ | ngrxPush) ?? { x: '0', y: '0' }"
      ></div>
    </div>
  `,
  styles: [
    `
      #cy {
        height: 100%;
        width: calc(100% - 300px);
        position: absolute;
        right: 0;
        top: 0;
        overflow: hidden;
      }

      #sidebar {
        width: 300px;
        height: 100%;
        border-right: 1px solid black;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    PushModule,
    FormsModule,
    BackgroundImageZoomDirective,
    BackgroundImageMoveDirective,
  ],
})
export class DrawerComponent implements AfterViewInit {
  private readonly _drawerStore = inject(DrawerStore);
  private readonly _eventApiService = inject(EventApiService);
  private readonly _graphApiService = inject(GraphApiService);

  readonly drawMode$ = this._drawerStore.drawMode$;
  readonly direction$ = this._drawerStore.direction$;

  readonly clientId = uuid();
  readonly graphId = '5l7hFOgMPmJ1SBcZChwe';

  readonly zoomSize$ = this._drawerStore.zoomSize$;
  readonly panDrag$ = this._drawerStore.panDrag$;

  @ViewChild('drawerElement') drawerElementRef: ElementRef<HTMLElement> | null =
    null;

  ngAfterViewInit() {
    if (this.drawerElementRef !== null) {
      const drawerNativeElement = this.drawerElementRef.nativeElement;

      this._graphApiService.getGraph(this.graphId).then((graph) => {
        if (graph !== null) {
          this._drawerStore.setGraph(
            createGraph(
              drawerNativeElement,
              graph.nodes.map((node) => ({
                data: node,
              })),
              graph.edges.map((edge) => ({
                data: edge,
              }))
            )
          );

          this._eventApiService.onServerCreate(
            this.clientId,
            this.graphId,
            graph.lastEventId,
            (event) => {
              console.log('server event', event);

              switch (event.type) {
                case 'AddNodeSuccess': {
                  this._drawerStore.handleNodeAdded(event.payload);
                  break;
                }
                case 'DeleteNodeSuccess': {
                  this._drawerStore.handleNodeRemoved(event.payload);
                  break;
                }
                case 'AddEdgeSuccess': {
                  this._drawerStore.handleEdgeAdded(event.payload);
                  break;
                }
                case 'DeleteEdgeSuccess': {
                  this._drawerStore.handleEdgeRemoved(event.payload);
                  break;
                }
                case 'AddNodeToEdgeSuccess': {
                  this._drawerStore.handleNodeAddedToEdge(event.payload);
                  break;
                }
              }
            }
          );
        }
      });

      this._drawerStore.event$
        .pipe(
          concatMap((event) => {
            console.log('local event', event);

            switch (event.type) {
              // Ignoring these events for now
              case 'DeleteEdge':
              case 'DeleteNode':
              case 'Init':
              case 'Click':
              case 'ViewNode':
              case 'UpdateNode':
              case 'GraphScrolled':
              case 'PanDragged':
                return EMPTY;
              default: {
                return this._eventApiService.emit(
                  this.clientId,
                  this.graphId,
                  event
                );
              }
            }
          })
        )
        .subscribe();
    }
  }

  onDrawModeChange(drawMode: boolean) {
    this._drawerStore.setDrawMode(drawMode);
  }

  onDirectionChange(direction: Direction) {
    this._drawerStore.setDirection(direction);
  }

  onOrganize() {
    this._drawerStore.restartLayout();
  }

  onAddNode() {
    this._drawerStore.addNode({
      id: uuid(),
      kind: 'faucet',
      label: 'TokenProgram\nINIT ACCOUNT 2',
      image: 'url(assets/images/initAccount1.png)',
    });
  }
}
