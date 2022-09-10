import { Pipe, PipeTransform } from '@angular/core';
import { Option } from '../../shared';

export interface HotKey {
  slot: number;
  key: string;
}

@Pipe({
  name: 'pgSlotHotkey',
  standalone: true,
  pure: true,
})
export class SlotHotkeyPipe implements PipeTransform {
  transform(slotId: number, hotkeys: HotKey[]): Option<string> {
    const hotkey = hotkeys.find((hotkey) => hotkey.slot === slotId);

    return hotkey?.key ?? null;
  }
}
