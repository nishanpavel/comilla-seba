// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqFwAq5S80LGjNmxHTR_JMpRa7SZ2kZzs",
    authDomain: "newdata-1e0e1.firebaseapp.com",
    projectId: "newdata-1e0e1",
    storageBucket: "newdata-1e0e1.firebasestorage.app",
    messagingSenderId: "535523268219",
    appId: "1:535523268219:web:28d72e70d47ca676b574de",
    measurementId: "G-X9FE6SPGRS"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log("Firestore offline persistence enabled");
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code == 'unimplemented') {
            console.log("The current browser does not support persistence.");
        }
    });

// Collection references
const usersCollection = db.collection('pavel00').doc('users').collection('data');
const providersCollection = db.collection('pavel00').doc('providers').collection('data');
const categoriesCollection = db.collection('pavel00').doc('categories').collection('data');

console.log("Firebase initialized successfully");