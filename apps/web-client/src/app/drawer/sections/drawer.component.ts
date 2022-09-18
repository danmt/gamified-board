import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PushModule } from '@ngrx/component';
import { environment } from '../../../environments/environment';
import { BackgroundImageMoveDirective } from '../../shared/directives/background-position.directive';
import { BackgroundImageZoomDirective } from '../../shared/directives/background-zoom.directive';
import { isNotNull, Option } from '../../shared/utils';
import { GraphApiService } from '../services';
import { DrawerStore } from '../stores';
import { Direction, Drawer } from '../utils';

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
  private readonly _graphApiService = inject(GraphApiService);

  readonly drawMode$ = this._drawerStore.drawMode$;
  readonly direction$ = this._drawerStore.direction$;
  readonly clientId = environment.clientId;

  @Input() pgGraphId: Option<string> = null;
  @Input() pgGroups: string[] = [];
  @ViewChild('drawerElement')
  pgDrawerElementRef: ElementRef<HTMLElement> | null = null;

  readonly zoomSize$ = this._drawerStore.zoomSize$;
  readonly panDrag$ = this._drawerStore.panDrag$;

  async ngAfterViewInit() {
    if (isNotNull(this.pgDrawerElementRef) && isNotNull(this.pgGraphId)) {
      const graph = await this._graphApiService.getGraph(this.pgGraphId);

      if (isNotNull(graph)) {
        const drawer = new Drawer(
          graph,
          this.pgGroups,
          this.pgDrawerElementRef.nativeElement
        );
        drawer.initialize();
        this._drawerStore.setDrawer(drawer);
      }
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
}
