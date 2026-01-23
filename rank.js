// --------------------------------------------------------------------------
// FIREBASE CONFIGURATION
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project.
// 3. Add a web app to the project.
// 4. Copy the "firebaseConfig" object and paste it below, replacing the placeholder.
// --------------------------------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyD8SY3zdbOfyGUIiWX5d1tHgvw6vNZysXY",
    authDomain: "freehoon-games.firebaseapp.com",
    projectId: "freehoon-games",
    storageBucket: "freehoon-games.firebasestorage.app",
    messagingSenderId: "979550284259",
    appId: "1:979550284259:web:3fd2309b96313fa733d8d6",
    measurementId: "G-H352Q1DMTC"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
    console.log("Firebase initialized");
} catch (e) {
    console.error("Firebase Initialization Error. Did you paste the config?", e);
}

// --------------------------------------------------------------------------
// RANKING LOGIC
// --------------------------------------------------------------------------

// Save Score
async function saveScoreToFirebase(nickname, score) {
    if (!db) return;

    try {
        await db.collection("leaderboard").add({
            nickname: nickname,
            score: score,
            date: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Score saved!");
        return true;
    } catch (error) {
        console.error("Error adding score: ", error);
        alert("점수 저장에 실패했습니다. (설정 오류일 수 있습니다)");
        return false;
    }
}

// Get Leaderboard (Top 10)
async function getLeaderboardFromFirebase() {
    if (!db) return [];

    try {
        const querySnapshot = await db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(10)
            .get();

        const leaderboard = [];
        querySnapshot.forEach((doc) => {
            leaderboard.push(doc.data());
        });
        return leaderboard;
    } catch (error) {
        console.error("Error getting leaderboard: ", error);
        return [];
    }
}
