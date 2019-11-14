import axios from 'axios';

import Pubsub from './pubsub';
//import { shallowCopyObj, deepCopyObj } from './helper';
import { deepCopyObj } from './helper';
//import Data from './data';

var Auth = {};

var user = {};

(function (obj) {
  // @TODO 


  obj.checkForExistingSession = () => {
    let session_token = localStorage.getItem('x-session-token');

    if (session_token) {
    //axios.get(API.getUsers, { headers: { 'x-session-token': session_token } }).then(response => {
      axios.get('/api/users', { headers: { 'x-session-token': session_token } }).then(response => {
        if (validateUserData(response.data)) {
          user = deepCopyObj(response.data);
        }
        console.log(user);
        //Pubsub.publish(NOTIF.SIGN_IN, null);
        Pubsub.publish('signin', null);
      }).catch(error => {
        console.log(error);
      });
    }
  }

  obj.sendSigninRequest = (params) => {
    // API require email OR alias
    // forcing email at the moment - may implement more elegant logic later
    if (validateSigninRequest(params)) {
      let signinObj = {
        email_address: params.email_address,
        password: params.password
      };
      // this extra call is not ideal, but we need to hack our way to getting the correct info on signin.  In the future, the API will need to be refactored to send back all the necessary info
      
      //axios.post(API.signin, signinObj).then(response => {
      axios.post('/api/users/login', signinObj).then(response => {
        let session_token = response.headers['x-session-token'];
        localStorage.setItem('x-session-token', session_token);
        //axios.get(API.getUsers, { headers: { 'x-session-token': session_token } }).then(response => {
        axios.get('/api/users', { headers: { 'x-session-token': session_token } }).then(response => {
          user = deepCopyObj(response.data);
          console.log(user);
          //Pubsub.publish(NOTIF.SIGN_IN, null);
          Pubsub.publish('signin', null);
        }).catch(error => {
          console.log(error);
          let errorObj = {
            message: 'Error signing in, please try again'
          };
          //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
          Pubsub.publish('auth_error', errorObj);
        });
      }).catch(error => {
        // @TODO return error codes and display helpful messages to the user, i.e. incorrect password, etc.
        // Potentially make more DRY
        let errorObj = {
          message: 'Error signing in, please try again'
        };
        //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
        Pubsub.publish('auth_error', errorObj);
      });
    } else {
      let errorObj = {
        message: 'Please fill in the required fields'
      };
      //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
      Pubsub.publish('auth_error', errorObj);
    }
  }

  obj.sendSignupRequest = (params) => {
    if (validateSignupRequest(params)) {
      console.log('sent signup request');
      //axios.post(API.signup, {
          axios.post('/api/users', {

        first_name: params.first_name,
        last_name: params.last_name,
        alias: params.alias,
        email_address: params.email,
        password: params.password,
        password_confirm: params.password_confirm
      }).then(response => {
        let signinObj = {
          email_address: params.email,
          password: params.password
        };
        console.log(signinObj);
        // these TWO extra calls are not ideal, but we need to hack our way to getting the correct info on signup.  In the future, the API will need to be refactored to send back all the necessary info
        //axios.post(API.signin, signinObj).then(signinResp => {
        axios.post('/api/users/login', signinObj).then(signinResp => {
          let session_token = signinResp.headers['x-session-token'];
          localStorage.setItem('x-session-token', session_token);
          //axios.get(API.getUsers, { headers: { 'x-session-token': session_token } }).then(getResponse => {
          axios.get('/api/users', { headers: { 'x-session-token': session_token } }).then(getResponse => {
            user = deepCopyObj(getResponse.data);
            console.log(user);
            //Pubsub.publish(NOTIF.SIGN_IN, null);
            Pubsub.publish('signin', null);
          }).catch(error => {
            console.log(error);
            let errorObj = {
              message: 'Error signing up, please try again'
            };
            //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
            Pubsub.publish('auth_error', errorObj);
          });
        }).catch(error => {
          console.log(error);
          let errorObj = {
            message: 'Error signing up, please try again'
          };
          //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
          Pubsub.publish('auth_error', errorObj);
        });
      }).catch(error => {
        // @TODO return error codes and display helpful messages to the user, i.e. incorrect password, etc.
        // Potentially make more DRY
        let errorObj = {
          message: 'Error signing up, please try again'
        };
        //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
        Pubsub.publish('auth_error', errorObj);
      });
    } else {
      let errorObj = {
        message: 'Please fill out all fields'
      };
      //Pubsub.publish(NOTIF.AUTH_ERROR, errorObj);
      Pubsub.publish('auth_error', errorObj);
    }

  }

  obj.sendSignoutRequest = () => {
    // @TODO need to verify what direction we're taking with the session token business
    let session_token = localStorage.getItem('x-session-token');

    axios({
        //url: API.signout,
      url: '/api/users/login',
      method: 'delete',
      headers: {
        'x-session-token': session_token
      }
    }).then(response => {
      if (response.status === 200) {
        user = {};
        localStorage.setItem('x-session-token', '');
        //Pubsub.publish(NOTIF.SIGN_OUT, null);
        Pubsub.publish('signout', null);
        //Data.handleSignout();
        console.log('signout success');
      } else {
        // @TODO not sure what to do in a .then handler here
        console.log('signout resolved, but not status 200');
      }
    }).catch(error => {
      console.log(error);
      // @TODO send an error back to the user
    });
  }

})(Auth);

const validateSigninRequest = (params) => {
    // API requires either email or alias, and password
    if ((params.alias || params.email_address) && params.password) {
      return true;
    }
    return false;
  }
  
  const validateSignupRequest = (params) => {
    /* API requires all of:
      first_name
      last_name
      email
      alias
      password
    */
    console.log(params);
    if (params.first_name &&
      params.last_name &&
      params.email &&
      params.alias &&
      params.password &&
      params.password_confirm) {
      return true;
    }
  
    return false;
  }

  const validateUserData = (data) => {
    if (data.alias &&
      data.created &&
      data.email_address &&
      data.first_name &&
      data.last_name &&
      data.updated &&
      data.user_id) {
      return true
    }
  
    return false;
  }


export default Auth;




































// console.log('process.env is: ');
// console.log(process.env);

// //Can we somehow include this in the future:
// //var baseURL = (process.env.NODE_ENV === 'production') ? process.env.REACT_APP_SERVER_URL : process.env.REACT_APP_LOCAL_URL;

// function Auth() {
//     var baseURL = '';
//     if (process.env.NODE_ENV === 'production') {
//         baseURL = process.env.REACT_APP_SERVER_URL
//         let test = {
//             email_address: 'production@gmail.com'
//         };
//         axios.post(baseURL + 'api/user', test)
//             .then(response => {
//                 console.log('response is: ');
//                 console.log(response);
//             }).catch(error => {
//                 console.log(error);
//             });
//     } else if (process.env.NODE_ENV === 'development') {
//         baseURL = process.env.REACT_APP_LOCAL_URL
//         let test = {
//             email_address: 'development@gmail.com'
//         };
//         axios.post(baseURL + 'api/user', test)
//             .then(response => {
//                 console.log('response is: ');
//                 console.log(response);
//             }).catch(error => {
//                 console.log(error);
//             });
//     } else {
//         console.log('development environment is not production or development');
//     };
// }

// export default Auth;