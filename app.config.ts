const contracts = {
  erc20: '0x0f7b3f5a8fed821c5eb60049538a548db2d479ce',
  uniswapPair: '0xa7480AAfA8AD2af3ce24Ac6853F960AE6Ac7F0c4',
};

export default defineAppConfig({
  ui: {
    primary: 'cyan',
    gray: 'neutral',
    modal: {
      overlay: {
        background: 'bg-neutral-200/75 dark:bg-neutral-800/75 backdrop-blur',
      },
    },
    card: {
      ring: 'ring-inset ring-1 ring-neutral-200 dark:ring-neutral-700/50',
    },
    // strategy: 'override',
    button: {
      color: {
        red: {
          solid: 'bg-red-500 text-white hover:brightness-110',
        },
        gray: {
          outline:
            'text-neutral-900 ring-1 ring-neutral-200 hover:ring-neutral-300 dark:text-neutral-50 dark:ring-neutral-700 hover:dark:ring-neutral-600',
          soft: 'text-neutral-950 hover:bg-neutral-100  dark:text-neutral-50 dark:hover:bg-neutral-800/50',
        },
        primary: {
          soft: 'text-cyan-800 bg-cyan-200/50 hover:bg-cyan-300/50 dark:text-cyan-400 dark:bg-cyan-800/50 dark:hover:bg-cyan-600/50',
        },
      },
      rounded: 'rounded-[4px]',
      base: 'justify-center',
    },
    input: {
      placeholder: 'placeholder-neutral-400 dark:placeholder-neutral-500',
      color: {
        gray: {
          outline:
            'bg-transparent dark:bg-transparent ring-neutral-200 dark:ring-neutral-700 text-neutral-900 dark:text-neutral-50 focus:ring-cyan-500 dark:focus:ring-cyan-400',
        },
      },
      icon: {
        base: 'text-neutral-400 dark:text-neutral-500',
      },
    },
    badge: {
      color: {
        white: {
          outline:
            'text-neutral-500 dark:text-neutral-400 ring-1 ring-neutral-500 dark:ring-neutral-400',
        },
      },
    },
    dropdown: {
      background: 'dark:bg-neutral-800/80 backdrop-blur-sm',
      ring: 'ring-neutral-200 dark:ring-neutral-700',
      divide: 'divide-neutral-200 dark:divide-neutral-700',
      item: {
        active: 'bg-cyan-400 dark:bg-cyan-500 text-cyan-900 dark:text-white',
        icon: {
          active: 'text-neutral-500 dark:text-neutral-400',
        },
      },
    },
    table: {
      wrapper: 'max-h-[42svh] overflow-y-scroll',
      thead:
        'sticky top-0 bg-white dark:bg-neutral-900 after:absolute after:bottom-0 after:w-full after:h-[1px] after:bg-neutral-200 after:dark:bg-neutral-600 z-10',
      th: {
        padding: 'p-2',
        color: 'text-neutral-600 dark:text-neutral-300',
        font: 'font-normal',
      },
      td: {
        padding: 'p-2',
        base: 'min-h-11',
        color: 'text-cyan-900 dark:text-cyan-100',
      },
      tbody: 'divide-y divide-neutral-200 dark:divide-neutral-800',
      default: {
        sortButton: {
          class:
            'text-xs md:text-sm font-normal dark:text-neutral-300 hover:dark:text-neutral-100 p-0',
          color: 'neutral',
        },
      },
    },
    select: {
      color: {
        white: {
          outline:
            'dark:bg-neutral-900 text-neutral-900 ring-neutral-300 dark:ring-neutral-700 ',
        },
      },
      variant: {
        none: ' text-neutral-800 dark:text-neutral-200',
      },
    },
    tabs: {
      list: {
        base: 'after:bg-gradient-to-r dark:after:from-cyan-600 dark:after:to-gray-900 after:from-cyan-300 after:to-gray-200 mb-6',
        width: 'w-full max-w-full',
        background: '',
        marker: {
          background: '',
        },
        padding: 'p-0',
        height: 'h-max',
        tab: {
          base: ' md:py-2 md:px-5 w-max bg-clip-text bg-gradient-to-r dark:from-cyan-300 dark:to-cyan-600 from-cyan-500 to-cyan-600 after:bg-gradient-to-r dark:after:from-cyan-300 dark:after:to-cyan-600 after:from-cyan-500 after:to-cyan-600 h-[36px]',
          rounded: 'rounded-none',
          background: '',
          active: 'tab-active font-medium text-cyan-500 dark:text-cyan-400',
          inactive: 'text-cyan-900 dark:text-cyan-100',
          size: 'text-xs md:text-[15px] md:leading-[24px] font-normal',
        },
      },
    },
  },
  icon: {
    size: '24px', // default <Icon> size applied
    class: 'icon', // default <Icon> class applied
    mode: 'css', // default <Icon> mode applied
    aliases: {
      nuxt: 'logos:nuxt-icon',
    },
  },
  contracts,
  arweave: {
    gateway: 'https://arweave.net',
  },
});
