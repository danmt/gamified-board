import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
} from '@angular/core';
import { Option } from '../utils';
import {
  ApplicationTooltip,
  openApplicationTooltip,
} from './application-tooltip.component';
import {
  CollectionTooltip,
  openCollectionTooltip,
} from './collection-tooltip.component';
import {
  InstructionTooltip,
  openInstructionTooltip,
} from './instruction-tooltip.component';
import { openSysvarTooltip, SysvarTooltip } from './sysvar-tooltip.component';

type SlotTooltip =
  | ApplicationTooltip
  | CollectionTooltip
  | InstructionTooltip
  | SysvarTooltip;

@Directive({ selector: '[pgSlotTooltip]', standalone: true })
export class SlotTooltipDirective implements OnDestroy {
  private readonly _overlay = inject(Overlay);
  private readonly _elementRef = inject(ElementRef<unknown>);
  private _overlayRef: Option<OverlayRef> = null;

  @Input() pgSlot: Option<SlotTooltip> = null;

  @HostListener('mouseenter') onMouseEnter() {
    this._open();
  }

  @HostListener('mouseleave') onMouseLeave() {
    this._close();
  }

  ngOnDestroy() {
    this._close();
  }

  private _open() {
    if (this.pgSlot !== null && this._overlayRef === null) {
      switch (this.pgSlot.kind) {
        case 'application': {
          this._overlayRef = openApplicationTooltip(
            this._overlay,
            this._elementRef,
            this.pgSlot,
            'top'
          );
          break;
        }

        case 'collection': {
          this._overlayRef = openCollectionTooltip(
            this._overlay,
            this._elementRef,
            this.pgSlot,
            'top'
          );
          break;
        }

        case 'instruction': {
          this._overlayRef = openInstructionTooltip(
            this._overlay,
            this._elementRef,
            this.pgSlot,
            'top'
          );
          break;
        }

        case 'sysvar': {
          this._overlayRef = openSysvarTooltip(
            this._overlay,
            this._elementRef,
            this.pgSlot,
            'top'
          );
          break;
        }
      }
    }
  }

  private _close() {
    if (this._overlayRef !== null) {
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }
}
