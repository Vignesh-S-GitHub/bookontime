// Android bundles every asset; it never registers or updates a service worker.
export function useRegisterSW() {
  return {
    needRefresh: [false, (_value: boolean) => {}] as const,
    updateServiceWorker: async (_reload: boolean) => {},
  };
}
