export const useMenuStore = defineStore("menu", {
  state: () => {
    return {
      isOpen: false,
      isStuck: false,
      inViewSection: null as string | null,
    };
  },
  actions: {
    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
});
