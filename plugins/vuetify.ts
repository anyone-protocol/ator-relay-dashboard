import {
  createVuetify,
  // ThemeDefinition
} from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

let theme = 'dark';
const localStorageTheme = localStorage && localStorage.getItem('theme');
if (localStorageTheme) {
  theme = localStorageTheme;
}

// const primaryATORTheme: ThemeDefinition = {
//   dark: false,
//   colors: {
//     //ator colors
//     primary: '#03bec5',
//     secondary: '#025675',
//     accent: '#025d66',
//     //extra colors
//     background: '#FFFFFF',
//     surface: '#FFFFFF',
//     'lightblue-1': '#71d0fb',
//     'lightblue-2': '#4FC3F7',
//     'lightgreen': '#0fc0b0',
//     'lightgreen-darken-1': '#0ba698',
//     'darkblue': '#0C2572',
//     error: '#FF5252',
//     info: '#2196F3',
//     success: '#4CAF50',
//     warning: '#FFC107',
//   }
// }

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: theme,
      themes: {
        // primaryATORTheme,
        light: {
          colors: {
            //ator colors
            primary: '#03bec5',
            secondary: '#025675',
            accent: '#025d66',
            //extra colors
            'basic-text': '#000000',
            background: '#FFFFFF',
            surface: '#FFFFFF',
            'lightblue-1': '#71d0fb',
            'lightblue-2': '#4FC3F7',
            lightgreen: '#0fc0b0',
            'lightgreen-darken-1': '#0ba698',
            darkblue: '#0C2572',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FFC107',
          },
        },
        dark: {
          colors: {
            primary: '#03bec5',
            // the styles connected to secondary need to be the same as primary
            // for this theme
            secondary: '#03bec5',
            accent: '#025d66',
            'basic-text': '#FFFFFF',
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
