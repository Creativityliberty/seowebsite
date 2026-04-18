/**
 * POCKETFLOW CORE (Lightweight Agentic Framework)
 * Minimalist graph-based workflow engine.
 */

export type NodeAction = (store: any) => Promise<void>;

export interface FlowNode {
  id: string;
  prep?: NodeAction;
  exec: NodeAction;
  post?: NodeAction;
}

export class PocketFlow {
  private store: any = {};
  private nodes: FlowNode[] = [];

  constructor(initialStore: any = {}) {
    this.store = initialStore;
  }

  addNode(node: FlowNode) {
    this.nodes.push(node);
    return this;
  }

  async run(
    onStep?: (nodeId: string, progress: number) => void,
    onLog?: (message: string) => void
  ) {
    console.log(`>>> [POCKETFLOW] Starting flow with ${this.nodes.length} nodes`);
    let count = 0;
    for (const node of this.nodes) {
      count++;
      if (onStep) onStep(node.id, Math.round((count / this.nodes.length) * 100));
      if (onLog) onLog(`[${node.id.toUpperCase()}] Extraction et traitement en cours...`);
      
      // Prevent Rate Limiting (Gemini free tier: 15 RPM)
      if (count > 1) {
        await new Promise(r => setTimeout(r, 1600));
      }

      if (node.prep) await node.prep(this.store);
      await node.exec(this.store);
      
      if (onLog) onLog(`[${node.id.toUpperCase()}] Terminé avec succès.`);
      if (node.post) await node.post(this.store);
    }
    return this.store;
  }

  getStore() {
    return this.store;
  }
}

// EXAMPLE PRESET NODES FOR SEO
export const ResearchNode = (prompt: string): FlowNode => ({
  id: "research",
  exec: async (store) => {
    const res = await fetch(`${store.baseUrl}/api/research`, {
      method: "POST",
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!data.research || data.research.trim() === "") {
        console.warn(">>> [FLOW] Research (A0) returned empty context. Proceeding with default knowledge.");
        store.researchContext = "Aucun contexte de recherche trouvé. Utilise tes connaissances internes.";
    } else {
        store.researchContext = data.research;
    }
  }
});

export const ArchitectNode = (prompt: string, model: string): FlowNode => ({
  id: "architect",
  exec: async (store) => {
    const res = await fetch(`${store.baseUrl}/api/generate`, {
      method: "POST",
      body: JSON.stringify({ 
        prompt: `Sujet: ${prompt}\n\nContexte de recherche Google :\n${store.researchContext || "Aucun contexte fourni."}`, 
        model 
      })
    });
    const data = await res.json();
    store.blueprint = data.blueprint;
    store.variables = data.variables;
  }
});

export const BatchFillerNode = (batchId: string, pageIndices: number[], model: string): FlowNode => ({
  id: `squad-${batchId}`,
  exec: async (store) => {
    const pages = pageIndices.map(idx => store.blueprint.contentPages[idx]).filter(Boolean);
    if (pages.length === 0) return;

    const res = await fetch(`${store.baseUrl}/api/fill-page`, {
      method: "POST",
      body: JSON.stringify({ pages, blueprint: store.blueprint, model })
    });
    
    const data = await res.json();
    if (data.success && data.results) {
      // Map back results to the store
      data.results.forEach((result: any, index: number) => {
        const globalIndex = pageIndices[index];
        if (store.blueprint.contentPages[globalIndex]) {
          store.blueprint.contentPages[globalIndex].markdownContent = result.content;
        }
      });
    } else {
      throw new Error(`Squad ${batchId} failed: ${data.error || "Unknown Error"}`);
    }
  }
});

export const FinalizerNode = (): FlowNode => ({
  id: "finalizer",
  exec: async (store) => {
    const res = await fetch(`${store.baseUrl}/api/finalize`, {
      method: "POST",
      body: JSON.stringify({ blueprint: store.blueprint, variables: store.variables })
    });
    const data = await res.json();
    store.generatedFiles = data.generatedFiles;
  }
});
