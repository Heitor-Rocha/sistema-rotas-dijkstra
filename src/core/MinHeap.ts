export interface HeapNode {
  cidadeId: string;
  distancia: number;
}

export class MinHeap {
  private heap: HeapNode[] = [];

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public insert(node: HeapNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public extractMin(): HeapNode | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0];
    const end = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }

    return min;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.distancia >= parent.distancia) break;

      this.heap[parentIndex] = element;
      this.heap[index] = parent;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      const leftChildIdx = 2 * index + 1;
      const rightChildIdx = 2 * index + 2;
      let swapIdx: number | null = null;

      if (leftChildIdx < length) {
        if (this.heap[leftChildIdx].distancia < element.distancia) {
          swapIdx = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        const rightDist = this.heap[rightChildIdx].distancia;
        if (
          (swapIdx === null && rightDist < element.distancia) ||
          (swapIdx !== null && rightDist < this.heap[swapIdx].distancia)
        ) {
          swapIdx = rightChildIdx;
        }
      }

      if (swapIdx === null) break;

      this.heap[index] = this.heap[swapIdx];
      this.heap[swapIdx] = element;
      index = swapIdx;
    }
  }
}