import "@testing-library/jest-dom";

// jsdom does not implement IntersectionObserver — provide a controllable mock.
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  elements: Element[] = [];
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    (MockIntersectionObserver as any).mock = (MockIntersectionObserver as any).mock || {
      instances: [] as MockIntersectionObserver[],
    };
    ((MockIntersectionObserver as any).mock.instances as MockIntersectionObserver[]).push(this);
  }
  observe(el: Element) {
    this.elements.push(el);
  }
  unobserve() {}
  disconnect() {
    this.elements = [];
  }
  takeRecords() {
    return [];
  }
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;
