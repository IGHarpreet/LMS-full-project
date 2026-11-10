import { initializeApp } from "firebase/app";
import firebase from 'firebase'
// import { getMessaging, getToken } from "firebase/messaging";


const firebaseConfig = {
    apiKey: "AIzaSyBCti_oAfiq3mRsZFjYI1vUSOiYbWhpFW0",
    authDomain: "fir-cloud-messaging-2-e6cc2.firebaseapp.com",
    projectId: "fir-cloud-messaging-2-e6cc2",
    storageBucket: "fir-cloud-messaging-2-e6cc2.appspot.com",
    messagingSenderId: "352203875327",
    appId: "1:352203875327:web:9194ff4a5e6ac7e567fdca"
}

firebase.initializeApp(firebaseConfig);



export default firebase