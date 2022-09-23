import { ApplicationNode } from './types';

export const applicationNodeLabelFunction = (node: ApplicationNode) => {
  switch (node.kind) {
    case 'collection':
    case 'instruction': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">${node.kind}</p>
          </div>
        </div>
      `;
    }

    case 'field': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">${
              'type' in node.data && node.data.type
            }</p>
          </div>
        </div>
      `;
    }
  }
};
