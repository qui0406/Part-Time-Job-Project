import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyBYTjtEh-Yj-JLM2-NsFgvBZVU33K2dsN8',
  authDomain: 'app-chat-e506d.firebaseapp.com',
  databaseURL: 'https://app-chat-e506d-default-rtdb.firebaseio.com',
  projectId: 'app-chat-e506d',
  storageBucket: 'app-chat-e506d.appspot.com',
  messagingSenderId: '542889717655',
  appId: '1:542889717655:web:1b2e4e69ce692b4c2a5ed2',
};


const app = initializeApp(firebaseConfig);
const firebaseDB = getDatabase(app);


export {firebaseDB, app}