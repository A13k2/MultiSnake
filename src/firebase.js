import firebase from "firebase/app";
import 'firebase/database';
import apiKey from './apiKey.js';

var firebaseConfig = {
  apiKey,
  authDomain: 'multisnake-5294c.firebaseapp.com',
  databaseURL: 'https://multisnake-5294c.firebaseio.com',
  projectId: 'multisnake-5294c',
  storageBucket: '',
  messagingSenderId: '573240431896',
  appId: '1:573240431896:web:fa2c7b60677a7259',
};
firebase.initializeApp(firebaseConfig);
export default firebase;