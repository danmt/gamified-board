import { NodeSingular } from 'cytoscape';
import { InstructionNode } from './types';

export const instructionNodeLabelFunction = (node: InstructionNode) => {
  switch (node.kind) {
    case 'signer': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
            class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
            style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="text-gray-400">
              ${node.kind} 
              
              ${
                node.data.isMutable &&
                '<span class="text-xs italic">mutable</span>'
              }
            </p>
          </div>
        </div>
      `;
    }

    case 'collection': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="text-gray-400">
              ${node.kind} 
              
              <span class="text-xs italic uppercase">${node.data.method}</span>
            </p>
          </div>
        </div>
      `;
    }

    case 'sysvar': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">Sysvar: ${node.data.ref.name}</p>
          </div>
        </div>
      `;
    }

    case 'application': {
      return `
        <div class="w-[280px] h-[85px] flex gap-2 items-center px-8 bg-[length:280px_85px] bg-[url('assets/images/node.png')] z-50">
          <div 
              class="w-[56px] h-[52px] shrink-0 rounded-lg border-gray-700 border-2 bg-cover bg-center"
              style="background-image: url(${node.data.thumbnailUrl});">
          </div>
          <div style="font-family: 'Courier New', Courier, monospace">
            <h2 class="text-xl mt-2 text-white">${node.data.name}</h2>
            <p class="italic text-gray-400">${node.data.ref.name}</p>
          </div>
        </div>
      `;
    }
  }
};

export const instructionCanConnectFunction = (
  source: NodeSingular,
  target: NodeSingular
) => {
  const sourceData = source.data();
  const targetData = target.data();

  if (!targetData) {
    return false;
  }

  return false;
};
