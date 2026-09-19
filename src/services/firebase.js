import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCO_f6iz-J0Y1Xah1IdQDZnsbGfB5qi8ZM",
    authDomain: "sidamon-dev.firebaseapp.com",
    databaseURL: "https://sidamon-dev-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sidamon-dev",
    storageBucket: "sidamon-dev.firebasestorage.app",
    messagingSenderId: "811013712428",
    appId: "1:811013712428:web:820700e91b6eeb8aef7f89",
    measurementId: "G-PNBQ6TS4QX"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const db = firebase.database();
export const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(console.error);
export default firebase;
