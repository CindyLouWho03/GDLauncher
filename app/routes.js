/* eslint flowtype-errors/show-errors: 0 */
import React, { Component, lazy, Suspense } from 'react';
import { connect } from 'react-redux';
import { Switch, Route, Redirect } from 'react-router';
import { Form, notification } from 'antd';
import { bindActionCreators } from 'redux';
import * as AuthActions from './actions/auth';
import * as SettingsActions from './actions/settings';
import { JAVA_URL } from './constants';
import App from './containers/App';
import SideBar from './components/Common/SideBar/SideBar';
import Navigation from './containers/Navigation';
import SysNavBar from './components/Common/SystemNavBar/SystemNavBar';
import findJava from './utils/javaLocationFinder';
import DManager from './components/DManager/containers/DManagerPage';
import InstanceManagerModal from './components/InstanceManagerModal/containers/InstanceManagerModal';
import Settings from './components/Settings/Settings';
import CurseModpacksBrowser from './components/CurseModpacksBrowser/CurseModpacksBrowser';
import NewUserPage from './components/NewUserPage/NewUserPage';

const Login = lazy(() => import('./components/Login/Login'));
const HomePage = lazy(() => import('./components/Home/containers/HomePage'));
const AutoUpdate = lazy(() => import('./components/AutoUpdate/AutoUpdate'));
const ServerManager = lazy(() =>
  import('./components/ServerManager/ServerManager')
);
const InstanceCreatorModal = lazy(() =>
  import('./components/InstanceCreatorModal/containers/InstanceCreatorModal')
);
const loginHelperModal = lazy(() =>
  import('./components/LoginHelperModal/LoginHelperModal')
);
const CurseModpacksBrowserCreatorModal = lazy(() =>
  import('./components/CurseModpacksBrowserCreatorModal/CurseModpacksBrowserCreatorModal')
);
const CurseModpackExplorerModal = lazy(() =>
  import('./components/CurseModpackExplorerModal/CurseModpackExplorerModal')
);
const ImportPack = lazy(() => import('./components/ImportPack/ImportPack'));

type Props = {
  location: object,
  checkAccessToken: () => void,
  isAuthValid: boolean
};

class RouteDef extends Component<Props> {
  componentDidMount = async () => {
    const { loadSettings, checkAccessToken } = this.props;
    loadSettings();
    if (!this.props.isAuthValid) checkAccessToken();
    if ((await findJava()) === null) {
      notification.warning({
        duration: 0,
        message: 'JAVA NOT FOUND',
        description: (
          <div>
            Java has not been found. Click{' '}
            <a href={JAVA_URL} target="_blank" rel="noopener noreferrer">
              here
            </a>{' '}
            to download it. After installing you will need to restart your PC.
          </div>
        )
      });
    }
  };

  componentWillUpdate(nextProps) {
    const { location } = this.props;
    // set previousLocation if props.location is not modal
    if (
      nextProps.history.action !== 'POP' &&
      (!location.state || !location.state.modal)
    ) {
      this.previousLocation = location;
    }
  }

  previousLocation = this.props.location;

  render() {
    const { location, isAuthValid } = this.props;
    const isModal = !!(
      location.state &&
      location.state.modal &&
      this.previousLocation !== location
    ); // not initial render
    return (
      <App>
        <SysNavBar />
        <div
        // style={{
        //   margin: 0,
        //   padding: 0,
        //   willChange: 'filter',
        //   filter: isModal ? 'blur(1px)' : 'none',
        //   transition: 'filter 100ms ease-in-out'
        // }}
        >
          {location.pathname !== '/' &&
            location.pathname !== '/newUserPage' &&
            location.pathname !== '/loginHelperModal' && (
              <div>
                <Navigation />
                <SideBar />
              </div>
            )}
          <Switch location={isModal ? this.previousLocation : location}>
            <Route
              exact
              path="/"
              component={WaitingComponent(Form.create()(Login))}
            />
            <Route
              exact
              path="/autoUpdate"
              component={WaitingComponent(AutoUpdate)}
            />
            {!isAuthValid && <Redirect push to="/" />}
            <Route path="/newUserPage" component={NewUserPage} />
            <Route>
              <div
                style={{
                  width: 'calc(100% - 200px)',
                  position: 'absolute',
                  right: 200
                }}
              >
                <Route path="/dmanager" component={DManager} />
                <Route
                  path="/curseModpacksBrowser"
                  component={CurseModpacksBrowser}
                />
                <Route path="/home" component={WaitingComponent(HomePage)} />
                <Route
                  path="/serverManager"
                  component={WaitingComponent(ServerManager)}
                />
              </div>
            </Route>
          </Switch>
        </div>
        {/* ALL MODALS */}
        {isModal ? <Route path="/settings/:page" component={Settings} /> : null}
        {isModal ? (
          <Route
            path="/InstanceCreatorModal"
            component={WaitingComponent(InstanceCreatorModal)}
          />
        ) : null}
        {isModal ? (
          <Route
            path="/curseModpackBrowserCreatorModal/:addonID"
            component={WaitingComponent(CurseModpacksBrowserCreatorModal)}
          />
        ) : null}
        {isModal ? (
          <Route
            path="/curseModpackExplorerModal/:addonID"
            component={WaitingComponent(CurseModpackExplorerModal)}
          />
        ) : null}
        {isModal ? (
          <Route
            path="/editInstance/:instance/:page/:state?/:version?/:mod?"
            component={InstanceManagerModal}
          />
        ) : null}
        {isModal ? (
          <Route path="/importPack" component={WaitingComponent(ImportPack)} />
        ) : null}
        {isModal ? (
          <Route
            path="/loginHelperModal"
            component={WaitingComponent(loginHelperModal)}
          />
        ) : null}
      </App>
    );
  }
}

function WaitingComponent(MyComponent) {
  return props => (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw',
            height: '100vh',
            background: 'var(--secondary-color-1)'
          }}
        >
          Loading...
        </div>
      }
    >
      <MyComponent {...props} />
    </Suspense>
  );
}

function mapStateToProps(state) {
  return {
    location: state.router.location,
    isAuthValid: state.auth.isAuthValid
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ ...AuthActions, ...SettingsActions }, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RouteDef);
