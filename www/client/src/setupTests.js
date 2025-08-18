import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translations: {}
      }
    },
    defaultNS: 'translations'
  });

jest.mock('axios', () => ({
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  useLocation: () => ({
    pathname: '/test',
  }),
  useParams: () => ({}),
  withRouter: (Component) => Component,
}));

global.MutationObserver = class {
  constructor(callback) {}
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
};
