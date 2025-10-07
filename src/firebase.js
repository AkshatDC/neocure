// src/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB_n7YLb9m-wi8Q2NG3e2BoqPqKaj8ejwU",
    authDomain: "hackathon-ai-7ffc9.firebaseapp.com",
    projectId: "hackathon-ai-7ffc9",
    storageBucket: "hackathon-ai-7ffc9.appspot.com", // corrected from firebasestorage.app → must end in .appspot.com
    messagingSenderId: "353377307573",
    appId: "1:353377307573:web:ef9a1c1bfecea9ea26e7fc",
    measurementId: "G-9R6CPJPC9M",
    databaseURL: "https://hackathon-ai-7ffc9-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
