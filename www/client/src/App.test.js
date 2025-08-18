import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import App from './App';

const mockStore = {
  user: {
    id: 1,
    group_count: 0,
    groups: [],
    nickname: 'testuser'
  },
  darkMode: false,
  appname: 'SubsTogether',
  float_editor_open: false,
  getHomeTimeline: jest.fn(() => Promise.resolve({ data: [], code: 0 })),
  getUnreadCount: jest.fn(() => Promise.resolve({ data: { code: 0, data: 0 } })),
  register: jest.fn(),
  login: jest.fn(),
  applyDarkModeClass: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  withRouter: (Component) => {
    const WrappedComponent = (props) => {
      const mockLocation = { pathname: '/' };
      const mockHistory = { push: jest.fn(), replace: jest.fn(), goBack: jest.fn() };
      return <Component {...props} location={mockLocation} history={mockHistory} />;
    };
    WrappedComponent.displayName = `withRouter(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={mockStore}>
      <App />
    </Provider>, 
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
